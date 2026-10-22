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
