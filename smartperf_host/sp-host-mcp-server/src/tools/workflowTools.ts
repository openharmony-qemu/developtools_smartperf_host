import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpExecuteWorkflowSchema, SpListWorkflowsSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import * as fs from 'fs';
import * as path from 'path';
import triageJankSql from '../sqlScripts/triage_jank.sql';
import triageMemorySql from '../sqlScripts/triage_memory.sql';
import triageCpuSql from '../sqlScripts/triage_cpu.sql';
import jankDetailSql from '../sqlScripts/jank_detail.sql';
import jankCpuContextSql from '../sqlScripts/jank_cpu_context.sql';
import nativeHookDetailSql from '../sqlScripts/native_hook_detail.sql';
import nativeHookStatisticSql from '../sqlScripts/native_hook_statistic.sql';
import memoryDetailSql from '../sqlScripts/memory_detail.sql';
import schedLatencySql from '../sqlScripts/sched_latency.sql';
import threadStateSummarySql from '../sqlScripts/thread_state_summary.sql';
import jsHeapSummarySql from '../sqlScripts/js_heap_summary.sql';
import triageGpuSql from '../sqlScripts/triage_gpu.sql';
import triageIoSql from '../sqlScripts/triage_io.sql';
import triageNetworkSql from '../sqlScripts/triage_network.sql';
import triagePowerSql from '../sqlScripts/triage_power.sql';
import triageHangSql from '../sqlScripts/triage_hang.sql';

const SQL_MAP: Record<string, string> = {
  'triage_jank': triageJankSql,
  'triage_memory': triageMemorySql,
  'triage_cpu': triageCpuSql,
  'jank_detail': jankDetailSql,
  'jank_cpu_context': jankCpuContextSql,
  'native_hook_detail': nativeHookDetailSql,
  'native_hook_statistic': nativeHookStatisticSql,
  'memory_detail': memoryDetailSql,
  'sched_latency': schedLatencySql,
  'thread_state_summary': threadStateSummarySql,
  'js_heap_summary': jsHeapSummarySql,
  'triage_gpu': triageGpuSql,
  'triage_io': triageIoSql,
  'triage_network': triageNetworkSql,
  'triage_power': triagePowerSql,
  'triage_hang': triageHangSql,
};

const WORKFLOWS_DIR = path.join(__dirname, '..', '..', 'workflows');

interface WorkflowStep {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
  argsMapping?: Record<string, string>;
  parallel?: boolean;
}

interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

function loadWorkflow(name: string): Workflow | null {
  const p = path.join(WORKFLOWS_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function resolveFieldValue(mapping: string, results: Map<string, any>): unknown {
  const match = mapping.match(/^\$\{(\w+)\.content\.?([^}]*)\}$/);
  if (!match) return mapping;
  const stepId = match[1];
  const fieldPath = match[2];
  const stepResult = results.get(stepId);
  if (!stepResult) return undefined;
  if (!fieldPath) return stepResult;

  const parts = fieldPath.split('.');
  let current: unknown = stepResult;

  if (current != null && typeof current === 'object' && 'content' in current) {
    const contentArr = (current as any).content;
    if (Array.isArray(contentArr)) {
      const textItem = contentArr.find((c: any) => c.type === 'text');
      if (textItem && typeof textItem.text === 'string') {
        try {
          current = JSON.parse(textItem.text);
        } catch {
          return undefined;
        }
      }
    }
  }

  for (const part of parts) {
    if (current == null) return undefined;
    current = (current as any)[part];
  }
  return current;
}

const WORKFLOW_NAMES = ['full-triage', 'jank-deep-dive', 'memory-leak-hunt', 'cpu-sched-analysis'];

export function registerWorkflowTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-execute-workflow', SpToolDescriptions.spExecuteWorkflow, SpExecuteWorkflowSchema, async ({ name, args }) => {
    const workflow = loadWorkflow(name);
    if (!workflow) {
      return { content: [{ type: 'text', text: `Workflow "${name}" not found. Available: ${WORKFLOW_NAMES.join(', ')}` }], isError: true };
    }
    const stepResults = new Map<string, any>();
    const outputs: any[] = [];
    let hasError = false;

    const groups = groupSteps(workflow.steps);
    for (const group of groups) {
      if (group.length === 1 && !group[0].parallel) {
        const result = await executeStep(group[0], args || {}, stepResults, engine);
        outputs.push(result);
        if (result.isError) hasError = true;
      } else {
        const results = await Promise.all(group.map(step => executeStep(step, args || {}, stepResults, engine)));
        for (const r of results) {
          outputs.push(r);
          if (r.isError) hasError = true;
        }
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify(outputs) }], isError: hasError || undefined };
  });

  server.tool('sp-list-workflows', SpToolDescriptions.spListWorkflows, SpListWorkflowsSchema, async () => {
    const workflows = WORKFLOW_NAMES.map(n => {
      const w = loadWorkflow(n);
      return { name: n, description: w?.description || '' };
    });
    return { content: [{ type: 'text', text: JSON.stringify(workflows) }] };
  });
}

function groupSteps(steps: WorkflowStep[]): WorkflowStep[][] {
  const groups: WorkflowStep[][] = [];
  let currentGroup: WorkflowStep[] = [];
  for (const step of steps) {
    if (step.parallel) {
      currentGroup.push(step);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      groups.push([step]);
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

async function executeStep(step: WorkflowStep, globalArgs: Record<string, unknown>, stepResults: Map<string, any>, engine: TraceEngine): Promise<any> {
  let stepArgs = { ...step.args, ...globalArgs };
  if (step.argsMapping) {
    for (const [argKey, mapping] of Object.entries(step.argsMapping)) {
      const resolved = resolveFieldValue(mapping, stepResults);
      if (resolved !== undefined) {
        stepArgs[argKey] = resolved;
      }
    }
  }
  const sql = SQL_MAP[step.tool];
  if (!sql) {
    return { step: step.id, tool: step.tool, isError: true, result: `SQL template not found for tool: ${step.tool}` };
  }
  const result = await engine.queryWithParams(sql, stepArgs);
  stepResults.set(step.id, result);
  try {
    const parsed = JSON.parse(result.content[0].text);
    return { step: step.id, tool: step.tool, result: parsed };
  } catch {
    return { step: step.id, tool: step.tool, result: result.content[0].text };
  }
}
