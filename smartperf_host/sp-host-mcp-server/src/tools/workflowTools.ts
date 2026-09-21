/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpExecuteWorkflowSchema, SpListWorkflowsSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
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

interface TextContent {
  type: string;
  text: string;
}

function loadWorkflow(name: string): Workflow | null {
  const p = path.join(WORKFLOWS_DIR, `${name}.json`);
  if (!fs.existsSync(p)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function extractContentText(stepResult: unknown): unknown {
  if (stepResult === null || stepResult === undefined || typeof stepResult !== 'object' || !('content' in stepResult)) {
    return stepResult;
  }
  const contentArr = (stepResult as { content?: TextContent[] }).content;
  if (!Array.isArray(contentArr)) {
    return stepResult;
  }
  const textItem = contentArr.find((c) => c.type === 'text');
  if (!textItem || typeof textItem.text !== 'string') {
    return stepResult;
  }
  try {
    return JSON.parse(textItem.text);
  } catch (e: unknown) {
    return undefined;
  }
}

function walkFieldPath(current: unknown, parts: string[]): unknown {
  let value = current;
  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function resolveFieldValue(mapping: string, results: Map<string, unknown>): unknown {
  const match = mapping.match(/^\$\{(\w+)\.content\.?([^}]*)\}$/);
  if (!match) {
    return mapping;
  }
  const stepId = match[1];
  const fieldPath = match[2];
  const stepResult = results.get(stepId);
  if (!stepResult) {
    return undefined;
  }
  if (!fieldPath) {
    return stepResult;
  }

  const parts = fieldPath.split('.');
  let current = extractContentText(stepResult);
  return walkFieldPath(current, parts);
}

const WORKFLOW_NAMES = ['full-triage', 'jank-deep-dive', 'memory-leak-hunt', 'cpu-sched-analysis'];

async function executeStepGroup(
  group: WorkflowStep[],
  globalArgs: Record<string, unknown>,
  stepResults: Map<string, unknown>,
  engine: TraceEngine
): Promise<Array<Record<string, unknown>>> {
  if (group.length === 1 && !group[0].parallel) {
    return [await executeStep(group[0], globalArgs, stepResults, engine)];
  }
  return Promise.all(group.map(step => executeStep(step, globalArgs, stepResults, engine)));
}

async function executeAllSteps(
  workflow: Workflow,
  globalArgs: Record<string, unknown>,
  engine: TraceEngine
): Promise<{ outputs: Array<Record<string, unknown>>; hasError: boolean }> {
  const stepResults = new Map<string, unknown>();
  const outputs: Array<Record<string, unknown>> = [];
  let hasError = false;

  const groups = groupSteps(workflow.steps);
  for (const group of groups) {
    const results = await executeStepGroup(group, globalArgs, stepResults, engine);
    outputs.push(...results);
    if (results.some(r => Boolean(r.isError))) {
      hasError = true;
    }
  }

  return { outputs, hasError };
}

export function registerWorkflowTools(server: McpServer, engine: TraceEngine): void {
  server.tool(
    'sp-execute-workflow',
    SpToolDescriptions.spExecuteWorkflow,
    SpExecuteWorkflowSchema,
    async ({ name, args }) => {
      const workflow = loadWorkflow(name);
      if (!workflow) {
        return {
          content: [{
            type: 'text',
            text: `Workflow "${name}" not found. Available: ${WORKFLOW_NAMES.join(', ')}`,
          }],
          isError: true,
        };
      }
      const { outputs, hasError } = await executeAllSteps(workflow, args || {}, engine);
      return { content: [{ type: 'text', text: JSON.stringify(outputs) }], isError: hasError || undefined };
    }
  );

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
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}

async function executeStep(
  step: WorkflowStep,
  globalArgs: Record<string, unknown>,
  stepResults: Map<string, unknown>,
  engine: TraceEngine
): Promise<Record<string, unknown>> {
  const stepArgs = { ...step.args, ...globalArgs };
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
  } catch (e: unknown) {
    return { step: step.id, tool: step.tool, result: result.content[0].text };
  }
}
