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
