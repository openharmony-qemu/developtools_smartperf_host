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

import type { SpApplication } from '../trace/SpApplication';
import type { SpSystemTrace } from '../trace/component/SpSystemTrace';
import { WebSocketManager } from '../webSocket/WebSocketManager';
import { Utils } from '../webSocket/Util';
import { TypeConstants } from '../webSocket/Constants';
import { threadPool } from '../trace/database/SqlLite';

const AGENT_TYPE = 20;
const RESULT_CMD = 100;

const UI_CMD = {
  SHOW_TIMELINE: 1,
  SELECT_PROCESS: 2,
  FOCUS_RANGE: 3,
  SHOW_QUERY_RESULT: 4,
  EXPORT_DB: 5,
};

interface ShowTimelinePayload {
  startTime?: number;
  endTime?: number;
  ipid?: number;
}

interface SelectProcessPayload {
  ipid: number;
  processName?: string;
}

interface FocusRangePayload {
  startTime: number;
  endTime: number;
}

interface ShowQueryResultPayload {
  query: string;
  title?: string;
}

interface ExportDbPayload {
  [key: string]: unknown;
}

export class SpAgentListener {
  private registered = false;

  register(): void {
    if (this.registered) {
      return;
    }
    const wsManager = WebSocketManager.getInstance();
    if (!wsManager) {
      return;
    }

    wsManager.registerMessageListener(
      AGENT_TYPE,
      this.handleMessage.bind(this),
      this.handleEvent.bind(this),
    );
    this.registered = true;
  }

  private sendResult(cmd: number, success: boolean, message?: string, trackingId?: number): void {
    const payloadObj: Record<string, unknown> = { cmd, success, message: message || '' };
    if (trackingId !== undefined) {
      payloadObj._trackingId = trackingId;
    }
    const payload = JSON.stringify(payloadObj);
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    WebSocketManager.getInstance()?.sendMessage(AGENT_TYPE, RESULT_CMD, data);
  }

  private handleMessage(cmd: number, data: Uint8Array): void {
    let payload: unknown;
    try {
      const decoder = new TextDecoder();
      payload = JSON.parse(decoder.decode(data));
    } catch (e: unknown) {
      console.error('[SpAgentListener] JSON parse failed:', e instanceof Error ? e.message : String(e));
      this.sendResult(cmd, false, 'Invalid JSON payload');
      return;
    }

    switch (cmd) {
      case UI_CMD.SHOW_TIMELINE:
        this.executeShowTimeline(payload as ShowTimelinePayload);
        break;
      case UI_CMD.SELECT_PROCESS:
        this.executeSelectProcess(payload as SelectProcessPayload);
        break;
      case UI_CMD.FOCUS_RANGE:
        this.executeFocusRange(payload as FocusRangePayload);
        break;
      case UI_CMD.SHOW_QUERY_RESULT:
        this.executeShowQueryResult(payload as ShowQueryResultPayload);
        break;
      case UI_CMD.EXPORT_DB:
        this.executeExportDb(payload as ExportDbPayload);
        break;
    }
  }

  private handleEvent(status: string): void {
    console.warn('[SpAgentListener] WebSocket event:', status);
  }

  private getSpSystemTrace(): SpSystemTrace | null {
    const app = document.querySelector('body > sp-application') as SpApplication | null;
    if (!app?.shadowRoot) {
      return null;
    }
    return app.shadowRoot.querySelector('#sp-system-trace') as SpSystemTrace | null;
  }

  private executeShowTimeline(payload: ShowTimelinePayload): void {
    try {
      const trace = this.getSpSystemTrace();
      if (!trace?.timerShaftEL) {
        this.sendResult(UI_CMD.SHOW_TIMELINE, false, 'SpSystemTrace or timerShaftEL not found');
        return;
      }

      if (payload.startTime !== undefined && payload.endTime !== undefined) {
        trace.timerShaftEL.setRangeNS(payload.startTime, payload.endTime);
        trace.refreshCanvas?.(true, 'agent-show-timeline');
      }

      if (payload.ipid !== undefined) {
        this.scrollToProcessByIpid(trace, payload.ipid);
      }
      this.sendResult(UI_CMD.SHOW_TIMELINE, true);
    } catch (e: unknown) {
      this.sendResult(UI_CMD.SHOW_TIMELINE, false, e instanceof Error ? e.message : String(e));
    }
  }

  private executeSelectProcess(payload: SelectProcessPayload): void {
    try {
      const trace = this.getSpSystemTrace();
      if (!trace?.rowsEL) {
        this.sendResult(UI_CMD.SELECT_PROCESS, false, 'SpSystemTrace or rowsEL not found');
        return;
      }

      if (payload.ipid !== undefined) {
        this.scrollToProcessByIpid(trace, payload.ipid);
      }
      this.sendResult(UI_CMD.SELECT_PROCESS, true);
    } catch (e: unknown) {
      this.sendResult(UI_CMD.SELECT_PROCESS, false, e instanceof Error ? e.message : String(e));
    }
  }

  private executeFocusRange(payload: FocusRangePayload): void {
    try {
      const trace = this.getSpSystemTrace();
      if (!trace?.timerShaftEL) {
        this.sendResult(UI_CMD.FOCUS_RANGE, false, 'SpSystemTrace or timerShaftEL not found');
        return;
      }

      trace.timerShaftEL.setRangeNS(payload.startTime, payload.endTime);
      trace.refreshCanvas?.(true, 'agent-focus-range');
      this.sendResult(UI_CMD.FOCUS_RANGE, true);
    } catch (e: unknown) {
      this.sendResult(UI_CMD.FOCUS_RANGE, false, e instanceof Error ? e.message : String(e));
    }
  }

  private executeShowQueryResult(payload: ShowQueryResultPayload): void {
    try {
      const app = document.querySelector('body > sp-application') as SpApplication | null;
      if (app?.shadowRoot) {
        const queryPanel = app.shadowRoot.querySelector('#sp-query-sql') as HTMLElement | null;
        const showContent = (app as unknown as { showContent?: (node: HTMLElement) => void }).showContent;
        if (queryPanel && typeof showContent === 'function') {
          showContent.call(app, queryPanel);
        }
      }
      const event = new CustomEvent('sp-agent-show-query', {
        detail: { query: payload.query, title: payload.title },
        bubbles: true,
      });
      document.dispatchEvent(event);
      this.sendResult(UI_CMD.SHOW_QUERY_RESULT, true);
    } catch (e: unknown) {
      this.sendResult(UI_CMD.SHOW_QUERY_RESULT, false, e instanceof Error ? e.message : String(e));
    }
  }

  private scrollToProcessByIpid(trace: SpSystemTrace, ipid: number): void {
    if (!trace?.rowsEL) {
      return;
    }

    const processRows = trace.rowsEL.querySelectorAll("trace-row[row-type='process'][folder]");
    for (const row of processRows) {
      if (row.getAttribute('data-ipid') === String(ipid)) {
        row.dispatchEvent(new Event('focus', { bubbles: true }));
        row.dispatchEvent(new Event('click', { bubbles: true }));
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }

  private executeExportDb(payload: ExportDbPayload): void {
    const trackingId = payload._trackingId as number | undefined;
    try {
      const wsManager = WebSocketManager.getInstance();
      if (!wsManager) {
        this.sendResult(UI_CMD.EXPORT_DB, false, 'WebSocketManager not available', trackingId);
        return;
      }
      threadPool.submit(
        'download-db',
        '',
        {},
        (reqBufferDB: Uint8Array) => {
          if (reqBufferDB && reqBufferDB.byteLength > 0) {
            this.sendResult(UI_CMD.EXPORT_DB, true, 'db-bytes-following', trackingId);
            wsManager.sendMessage(AGENT_TYPE, RESULT_CMD, reqBufferDB);
          } else {
            this.sendResult(UI_CMD.EXPORT_DB, false, 'DB export failed: empty buffer', trackingId);
          }
        },
        'download-db'
      );
    } catch (e: unknown) {
      this.sendResult(UI_CMD.EXPORT_DB, false, e instanceof Error ? e.message : String(e), trackingId);
    }
  }
}
