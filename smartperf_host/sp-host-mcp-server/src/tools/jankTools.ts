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
