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
