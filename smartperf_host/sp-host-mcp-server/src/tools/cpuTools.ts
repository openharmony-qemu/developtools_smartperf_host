import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpTriageCpuSchema, SpAnalyzeSchedLatencySchema, SpAnalyzeThreadStateSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import triageCpuSql from '../sqlScripts/triage_cpu.sql';
import schedLatencySql from '../sqlScripts/sched_latency.sql';
import threadStateSummarySql from '../sqlScripts/thread_state_summary.sql';

export function registerCpuTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-triage-cpu', SpToolDescriptions.spTriageCpu, SpTriageCpuSchema, async (args) => engine.queryWithParams(triageCpuSql, args));

  server.tool('sp-analyze-sched-latency', SpToolDescriptions.spAnalyzeSchedLatency, SpAnalyzeSchedLatencySchema, async (args) => engine.queryWithParams(schedLatencySql, args));

  server.tool('sp-analyze-thread-state', SpToolDescriptions.spAnalyzeThreadState, SpAnalyzeThreadStateSchema, async (args) => engine.queryWithParams(threadStateSummarySql, args));
}
