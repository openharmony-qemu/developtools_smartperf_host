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
import { BrowserBridge } from '../browserBridge';
import { TraceEngine } from '../traceEngine';
import { SpShowTimelineSchema, SpSelectProcessSchema, SpFocusRangeSchema, SpShowQueryResultSchema, SpGetCurrentTraceSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';

const UI_CMD = {
  SHOW_TIMELINE: 1,
  SELECT_PROCESS: 2,
  FOCUS_RANGE: 3,
  SHOW_QUERY_RESULT: 4,
};

const EXPORT_DB_ERROR_CODE = -1;
const EXPORT_DB_SUCCESS_CODE = 0;

function notConnectedResult(): { content: Array<{ type: 'text'; text: string }>; isError?: boolean } {
  return { content: [{ type: 'text', text: 'Extension service not connected. UI operations require the extension service and browser to be running. Start the extension service first, then retry.' }], isError: true };
}

interface McpExtra {
  _meta?: { progressToken?: unknown };
  sendNotification?: (notification: { method: string; params: Record<string, unknown> }) => Promise<void>;
}

interface ExportResult {
  success?: boolean;
  code?: number;
  message?: string;
}

function createProgressNotifier(extra?: McpExtra): ((elapsedMs: number) => void) | undefined {
  if (!extra?.sendNotification) {
    return undefined;
  }
  return (elapsedMs: number) => {
    const progressToken = extra._meta?.progressToken;
    if (progressToken !== null && progressToken !== undefined) {
      extra.sendNotification!({
        method: 'notifications/progress',
        params: { progressToken, progress: elapsedMs, total: 90000 },
      }).catch((e: unknown) => {
        console.warn('[sp-agent] Progress notification failed:', e instanceof Error ? e.message : String(e));
      });
    }
  };
}

async function handleExportDbResult(
  sent: boolean,
  result: ExportResult | undefined,
  engine: TraceEngine
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  if (!sent) {
    return { content: [{ type: 'text', text: 'Extension service not available. Start the extension service and open SP Host in browser with a trace file loaded.' }], isError: true };
  }
  if (!result?.success && result?.code === EXPORT_DB_ERROR_CODE) {
    return { content: [{ type: 'text', text: `Failed to get trace from browser: ${result.message}` }], isError: true };
  }
  if (result?.code === EXPORT_DB_SUCCESS_CODE && result?.message) {
    return engine.setDbFile(result.message);
  }
  if (!result?.success && result?.message) {
    return { content: [{ type: 'text', text: `Failed to get trace from browser: ${result.message}` }], isError: true };
  }
  return { content: [{ type: 'text', text: `Unexpected response: ${JSON.stringify(result)}` }], isError: true };
}

async function handleGetCurrentTrace(bridge: BrowserBridge, engine: TraceEngine, extra?: McpExtra): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  if (!bridge.isConnected()) {
    return { content: [{ type: 'text', text: 'Extension service not connected. sp-get-current-trace requires the extension service and browser to be running. Start the extension service first, then retry.' }], isError: true };
  }
  const onProgress = createProgressNotifier(extra);
  const { sent, result } = await bridge.requestExportDb(onProgress);
  return handleExportDbResult(sent, result as ExportResult | undefined, engine);
}

async function handleUiCommand(
  bridge: BrowserBridge,
  cmd: number,
  payload: Record<string, unknown>,
  successMessage: string
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  if (!bridge.isConnected()) {
    return notConnectedResult();
  }
  const { sent, result } = await bridge.sendUiCommand(cmd, payload);
  if (!sent) {
    return { content: [{ type: 'text', text: 'Failed to send command.' }], isError: true };
  }
  return { content: [{ type: 'text', text: result ? `Browser response: ${JSON.stringify(result)}` : successMessage }] };
}

export function registerUiTools(server: McpServer, bridge: BrowserBridge, engine: TraceEngine): void {
  server.tool('sp-show-timeline', SpToolDescriptions.spShowTimeline, SpShowTimelineSchema, async (args) =>
    handleUiCommand(bridge, UI_CMD.SHOW_TIMELINE, { startTime: args.startTime, endTime: args.endTime, ipid: args.ipid }, 'Timeline command sent to browser.')
  );

  server.tool('sp-select-process', SpToolDescriptions.spSelectProcess, SpSelectProcessSchema, async (args) =>
    handleUiCommand(bridge, UI_CMD.SELECT_PROCESS, { ipid: args.ipid, processName: args.processName }, 'Select process command sent to browser.')
  );

  server.tool('sp-focus-range', SpToolDescriptions.spFocusRange, SpFocusRangeSchema, async (args) =>
    handleUiCommand(bridge, UI_CMD.FOCUS_RANGE, { startTime: args.startTime, endTime: args.endTime }, 'Focus range command sent to browser.')
  );

  server.tool('sp-show-query-result', SpToolDescriptions.spShowQueryResult, SpShowQueryResultSchema, async (args) =>
    handleUiCommand(bridge, UI_CMD.SHOW_QUERY_RESULT, { query: args.query, title: args.title }, 'Show query result command sent to browser.')
  );

  server.tool('sp-get-current-trace', SpToolDescriptions.spGetCurrentTrace, SpGetCurrentTraceSchema, async (_args, extra) =>
    handleGetCurrentTrace(bridge, engine, extra)
  );
}
