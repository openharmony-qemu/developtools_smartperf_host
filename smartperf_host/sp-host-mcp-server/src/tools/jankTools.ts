import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpTriageJankSchema, SpAnalyzeJankDetailSchema, SpJankCpuContextSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import triageJankSql from '../sqlScripts/triage_jank.sql';
import jankDetailSql from '../sqlScripts/jank_detail.sql';
import jankCpuContextSql from '../sqlScripts/jank_cpu_context.sql';

export function registerJankTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-triage-jank', SpToolDescriptions.spTriageJank, SpTriageJankSchema, async (args) => engine.queryWithParams(triageJankSql, args));

  server.tool('sp-analyze-jank-detail', SpToolDescriptions.spAnalyzeJankDetail, SpAnalyzeJankDetailSchema, async (args) => engine.queryWithParams(jankDetailSql, args));

  server.tool('sp-jank-cpu-context', SpToolDescriptions.spJankCpuContext, SpJankCpuContextSchema, async (args) => engine.queryWithParams(jankCpuContextSql, args));
}
