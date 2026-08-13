import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpTriageGpuSchema, SpTriageIoSchema, SpTriageNetworkSchema, SpTriagePowerSchema, SpTriageHangSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import triageGpuSql from '../sqlScripts/triage_gpu.sql';
import triageIoSql from '../sqlScripts/triage_io.sql';
import triageNetworkSql from '../sqlScripts/triage_network.sql';
import triagePowerSql from '../sqlScripts/triage_power.sql';
import triageHangSql from '../sqlScripts/triage_hang.sql';

export function registerExtendedTriageTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-triage-gpu', SpToolDescriptions.spTriageGpu, SpTriageGpuSchema, async (args) => engine.queryWithParams(triageGpuSql, args));

  server.tool('sp-triage-io', SpToolDescriptions.spTriageIo, SpTriageIoSchema, async (args) => engine.queryWithParams(triageIoSql, args));

  server.tool('sp-triage-network', SpToolDescriptions.spTriageNetwork, SpTriageNetworkSchema, async (args) => engine.queryWithParams(triageNetworkSql, args));

  server.tool('sp-triage-power', SpToolDescriptions.spTriagePower, SpTriagePowerSchema, async (args) => engine.queryWithParams(triagePowerSql, args));

  server.tool('sp-triage-hang', SpToolDescriptions.spTriageHang, SpTriageHangSchema, async (args) => engine.queryWithParams(triageHangSql, args));
}
