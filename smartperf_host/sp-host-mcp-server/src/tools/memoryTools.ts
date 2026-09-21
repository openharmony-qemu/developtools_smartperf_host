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
import { SpTriageMemorySchema, SpAnalyzeMemoryDetailSchema, SpAnalyzeNativeHookSchema, SpAnalyzeJsHeapSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import triageMemorySql from '../sqlScripts/triage_memory.sql';
import memoryDetailSql from '../sqlScripts/memory_detail.sql';
import nativeHookDetailSql from '../sqlScripts/native_hook_detail.sql';
import nativeHookStatisticSql from '../sqlScripts/native_hook_statistic.sql';
import jsHeapSummarySql from '../sqlScripts/js_heap_summary.sql';

export function registerMemoryTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-triage-memory', SpToolDescriptions.spTriageMemory, SpTriageMemorySchema, async (args) => engine.queryWithParams(triageMemorySql, args));

  server.tool('sp-analyze-memory-detail', SpToolDescriptions.spAnalyzeMemoryDetail, SpAnalyzeMemoryDetailSchema, async (args) => engine.queryWithParams(memoryDetailSql, args));

  server.tool('sp-analyze-native-hook', SpToolDescriptions.spAnalyzeNativeHook, SpAnalyzeNativeHookSchema, async (args) => {
    const sql = args.isStatistic ? nativeHookStatisticSql : nativeHookDetailSql;
    return engine.queryWithParams(sql, { ipid: args.ipid, eventType: args.eventType });
  });

  server.tool('sp-analyze-js-heap', SpToolDescriptions.spAnalyzeJsHeap, SpAnalyzeJsHeapSchema, async (args) => engine.queryWithParams(jsHeapSummarySql, args));
}
