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

export class SpAgentListener {
  private registered = false;

  register(): void {
    if (this.registered) return;
    const wsManager = WebSocketManager.getInstance();
    if (!wsManager) return;

    wsManager.registerMessageListener(
      AGENT_TYPE,
      this.handleMessage.bind(this),
      this.handleEvent.bind(this),
    );
    this.registered = true;
  }

  private sendResult(cmd: number, success: boolean, message?: string): void {
    const payload = JSON.stringify({ cmd, success, message: message || '' });
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    WebSocketManager.getInstance()?.sendMessage(AGENT_TYPE, RESULT_CMD, data);
  }

  private handleMessage(cmd: number, data: Uint8Array): void {
    let payload: any;
    try {
      const decoder = new TextDecoder();
      payload = JSON.parse(decoder.decode(data));
    } catch {
      return;
    }

    switch (cmd) {
      case UI_CMD.SHOW_TIMELINE:
        this.executeShowTimeline(payload);
        break;
      case UI_CMD.SELECT_PROCESS:
        this.executeSelectProcess(payload);
        break;
      case UI_CMD.FOCUS_RANGE:
        this.executeFocusRange(payload);
        break;
      case UI_CMD.SHOW_QUERY_RESULT:
        this.executeShowQueryResult(payload);
        break;
      case UI_CMD.EXPORT_DB:
        this.executeExportDb(payload);
        break;
    }
  }

  private handleEvent(status: string): void {
    console.warn('[SpAgentListener] WebSocket event:', status);
  }

  private getSpSystemTrace(): any {
    const app = document.querySelector('body > sp-application') as any;
    if (!app?.shadowRoot) return null;
    return app.shadowRoot.querySelector('#sp-system-trace');
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
    } catch (e: any) {
      this.sendResult(UI_CMD.SHOW_TIMELINE, false, e.message);
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
    } catch (e: any) {
      this.sendResult(UI_CMD.SELECT_PROCESS, false, e.message);
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
    } catch (e: any) {
      this.sendResult(UI_CMD.FOCUS_RANGE, false, e.message);
    }
  }

  private executeShowQueryResult(payload: ShowQueryResultPayload): void {
    try {
      const app = document.querySelector('body > sp-application') as any;
      if (app?.shadowRoot) {
        const queryPanel = app.shadowRoot.querySelector('#sp-query-sql') as HTMLElement | null;
        if (queryPanel && typeof app.showContent === 'function') {
          app.showContent(queryPanel);
        }
      }
      const event = new CustomEvent('sp-agent-show-query', {
        detail: { query: payload.query, title: payload.title },
        bubbles: true,
      });
      document.dispatchEvent(event);
      this.sendResult(UI_CMD.SHOW_QUERY_RESULT, true);
    } catch (e: any) {
      this.sendResult(UI_CMD.SHOW_QUERY_RESULT, false, e.message);
    }
  }

  private scrollToProcessByIpid(trace: any, ipid: number): void {
    if (!trace?.rowsEL) return;

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

  private executeExportDb(payload: any): void {
    try {
      const wsManager = WebSocketManager.getInstance();
      if (!wsManager) {
        this.sendResult(UI_CMD.EXPORT_DB, false, 'WebSocketManager not available');
        return;
      }
      threadPool.submit(
        'download-db',
        '',
        {},
        (reqBufferDB: Uint8Array) => {
          if (reqBufferDB && reqBufferDB.byteLength > 0) {
            wsManager.sendMessage(AGENT_TYPE, RESULT_CMD, reqBufferDB);
          } else {
            this.sendResult(UI_CMD.EXPORT_DB, false, 'DB export failed: empty buffer');
          }
        },
        'download-db'
      );
    } catch (e: any) {
      this.sendResult(UI_CMD.EXPORT_DB, false, e.message);
    }
  }
}
