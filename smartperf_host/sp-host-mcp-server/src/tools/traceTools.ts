import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpSetTraceFileSchema, SpExecuteQuerySchema, SpListProcessesSchema, SpListTablesSchema, SpListTableStructureSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';

export function registerTraceTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-set-trace-file', SpToolDescriptions.spSetTraceFile, SpSetTraceFileSchema, async ({ traceFile }) => engine.setTraceFile(traceFile));

  server.tool('sp-execute-query', SpToolDescriptions.spExecuteQuery, SpExecuteQuerySchema, async ({ query }) => engine.query(query));

  server.tool('sp-list-processes', SpToolDescriptions.spListProcesses, SpListProcessesSchema, async () => engine.listProcesses());

  server.tool('sp-list-tables', SpToolDescriptions.spListTables, SpListTablesSchema, async () => engine.listTables());

  server.tool('sp-list-table-structure', SpToolDescriptions.spListTableStructure, SpListTableStructureSchema, async ({ table }) => engine.listTableStructure(table));
}
