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

import { EventEmitter } from 'events';
import WebSocket from 'ws';

export const EXTENSION_PORT = 19099;
const AGENT_TYPE = 20;
const MESSAGE_BYTE = 20;
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 3;

const UI_CMD = {
  SHOW_TIMELINE: 1,
  SELECT_PROCESS: 2,
  FOCUS_RANGE: 3,
  SHOW_QUERY_RESULT: 4,
  EXPORT_DB: 5,
};

const RESULT_CMD = 100;

const DEFAULT_UI_CMD_TIMEOUT_MS = 5000;
const DEFAULT_DB_EXPORT_TIMEOUT_MS = 90000;
const ERROR_CODE = -1;
const WS_CONNECT_TIMEOUT_MS = 10000;
const LOGIN_TIMEOUT_MS = 5000;
const SYS_MSG_TYPE = 0;
const LOGIN_REQ_CMD = 1;
const LOGIN_SUCCESS_CMD = 2;
const LOGIN_FAIL_CMD = 3;
const INITIAL_SESSION_ID = 0;
const INITIAL_SESSION = 0n;
const MAX_RECONNECT_DELAY_MS = 60000;

export interface BrowserBridgeConfig {
  port?: number;
  autoConnect?: boolean;
}

interface BrowserResponse {
  success?: boolean;
  code?: number;
  message?: string;
  raw?: string;
  [key: string]: unknown;
}

interface PendingCallback {
  trackingId: number;
  resolve: (payload: unknown) => void;
  timer: NodeJS.Timeout;
}

interface DecodedMessage {
  type: number;
  cmd: number;
  sessionId: number;
  session: bigint;
  data: Uint8Array;
  dataLength: number;
}

export class BrowserBridge extends EventEmitter {
  private ws: WebSocket | null = null;
  private sessionId: number = 0;
  private session: bigint = 0n;
  private port: number;
  private reconnectAttempts = 0;
  private connected = false;
  private connecting = false;

  constructor(config?: BrowserBridgeConfig) {
    super();
    this.port = config?.port || EXTENSION_PORT;
    if (config?.autoConnect !== false) {
      this.connect();
    }
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) { return; }
    this.connecting = true;
    try {
      await this.doConnect();
      await this.login();
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');
    } catch (e: unknown) {
      this.connecting = false;
      this.emit('error', e);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.connected = false;
    for (const [id, cb] of this.pendingCallbacks) {
      clearTimeout(cb.timer);
      cb.resolve({ success: false, code: ERROR_CODE, message: 'Disconnected' });
    }
    this.pendingCallbacks.clear();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e: unknown) {
        console.warn('[sp-agent] WS close failed:', e instanceof Error ? e.message : String(e));
      }
      this.ws = null;
    }
  }

  private pendingCallbacks = new Map<number, PendingCallback>();
  private cmdCounter = 0;

  async sendUiCommand(cmd: number, payload: Record<string, unknown>, timeoutMs = DEFAULT_UI_CMD_TIMEOUT_MS): Promise<{ sent: boolean; result?: BrowserResponse }> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch (e: unknown) {
        return { sent: false, result: { success: false, message: `Extension service not available: ${e instanceof Error ? e.message : String(e)}` } };
      }
    }
    const trackingId = ++this.cmdCounter;
    const dataStr = JSON.stringify({ ...payload, _trackingId: trackingId });
    const data = new TextEncoder().encode(dataStr);
    const message = this.encodeMessage(AGENT_TYPE, cmd, this.sessionId, this.session, data);
    this.ws!.send(message);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingCallbacks.delete(trackingId);
        resolve({ sent: true, result: { success: false, code: ERROR_CODE, message: 'Browser response timeout' } });
      }, timeoutMs);

      this.pendingCallbacks.set(trackingId, {
        trackingId,
        resolve: (responsePayload: unknown) => {
          clearTimeout(timer);
          resolve({ sent: true, result: responsePayload as BrowserResponse });
        },
        timer,
      });
    });
  }

  async requestExportDb(
    onProgress?: (elapsedMs: number) => void,
    timeoutMs = DEFAULT_DB_EXPORT_TIMEOUT_MS,
  ): Promise<{ sent: boolean; result?: BrowserResponse }> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch (e: unknown) {
        return { sent: false, result: { success: false, message: `Extension service not available: ${e instanceof Error ? e.message : String(e)}` } };
      }
    }
    const trackingId = ++this.cmdCounter;
    const data = new TextEncoder().encode(JSON.stringify({ _trackingId: trackingId }));
    const message = this.encodeMessage(AGENT_TYPE, UI_CMD.EXPORT_DB, this.sessionId, this.session, data);
    this.ws!.send(message);

    const startTime = Date.now();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (progressTimer) clearInterval(progressTimer);
        this.pendingCallbacks.delete(trackingId);
        resolve({ sent: true, result: { success: false, code: ERROR_CODE, message: 'DB export timeout' } });
      }, timeoutMs);

      const progressTimer = onProgress
        ? setInterval(() => {
            onProgress(Date.now() - startTime);
          }, 10000)
        : null;

      this.pendingCallbacks.set(trackingId, {
        trackingId,
        resolve: (responsePayload: unknown) => {
          clearTimeout(timer);
          if (progressTimer) clearInterval(progressTimer);
          resolve({ sent: true, result: responsePayload as BrowserResponse });
        },
        timer,
      });
    });
  }

  private handleMessage(raw: Buffer): void {
    try {
      const msg = this.decodeMessage(raw);
      if (msg.type === AGENT_TYPE) {
        const dataStr = new TextDecoder().decode(msg.data);
        let payload: Record<string, unknown>;
        let isBinary = false;
        try {
          payload = JSON.parse(dataStr);
        } catch (e: unknown) {
          isBinary = true;
          payload = { raw: dataStr };
        }
        this.emit('browser-response', { cmd: msg.cmd, sessionId: msg.sessionId, payload });
        const trackingId = payload?._trackingId;
        if (trackingId !== null && trackingId !== undefined) {
          const cb = this.pendingCallbacks.get(Number(trackingId));
          if (cb) {
            this.pendingCallbacks.delete(Number(trackingId));
            cb.resolve(payload);
          }
        } else if (this.pendingCallbacks.size > 0) {
          const entries = Array.from(this.pendingCallbacks.entries());
          const [id, cb] = entries[entries.length - 1];
          this.pendingCallbacks.delete(id);
          if (isBinary) {
            cb.resolve({ code: ERROR_CODE, success: false, message: 'Received binary DB data without file path - extension service may not have processed it correctly' });
          } else {
            cb.resolve(payload);
          }
        }
      }
    } catch (e: unknown) {
      console.error('[sp-agent] Message decode failed:', e instanceof Error ? e.message : String(e));
    }
  }

  private async doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${this.port}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.ws?.close();
      }, WS_CONNECT_TIMEOUT_MS);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.ws.on('close', () => {
        if (this.connected) {
          this.connected = false;
          this.emit('disconnected');
          this.scheduleReconnect();
        }
      });

      this.ws.on('message', (raw: Buffer) => {
        this.handleMessage(raw);
      });
    });
  }

  private async login(): Promise<void> {
    return new Promise((resolve, reject) => {
      let loginHandler: ((raw: Buffer) => void) | null = null;
      let timer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (loginHandler && this.ws) { this.ws.off('message', loginHandler); }
        if (timer) clearTimeout(timer);
        loginHandler = null;
        timer = null;
      };

      timer = setTimeout(() => {
        cleanup();
        this.ws?.close();
        reject(new Error('Login timeout'));
      }, LOGIN_TIMEOUT_MS);

      loginHandler = (raw: Buffer) => {
        try {
          const msg = this.decodeMessage(raw);
          if (msg.type === SYS_MSG_TYPE && msg.cmd === LOGIN_SUCCESS_CMD) {
            this.sessionId = msg.sessionId;
            this.session = msg.session;
            cleanup();
            resolve();
          } else if (msg.type === SYS_MSG_TYPE && msg.cmd === LOGIN_FAIL_CMD) {
            cleanup();
            this.ws?.close();
            reject(new Error('Login failed: session limit reached'));
          }
        } catch (e: unknown) {
          console.warn('[sp-agent] Login message parse failed:', e instanceof Error ? e.message : String(e));
        }
      };

      this.ws!.on('message', loginHandler);
      const loginMsg = this.encodeMessage(SYS_MSG_TYPE, LOGIN_REQ_CMD, INITIAL_SESSION_ID, INITIAL_SESSION, new Uint8Array(0));
      this.ws!.send(loginMsg);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
    setTimeout(() => {
      this.connect().catch((e: unknown) => {
        console.warn('[sp-agent] Reconnect failed:', e instanceof Error ? e.message : String(e));
      });
    }, delay);
  }

  private encodeMessage(type: number, cmd: number, sessionId: number, session: bigint, data: Uint8Array): Buffer {
    const totalLength = MESSAGE_BYTE + data.byteLength;
    const buf = Buffer.alloc(totalLength);
    let offset = 0;
    buf.writeUInt8(type, offset);
    offset += 1;
    buf.writeUInt16BE(cmd, offset);
    offset += 2;
    buf.writeUInt8(sessionId, offset);
    offset += 1;
    const sessionHigh = Number((session >> BigInt(32)) & BigInt(0xFFFFFFFF));
    const sessionLow = Number(session & BigInt(0xFFFFFFFF));
    buf.writeUInt32BE(sessionHigh, offset);
    offset += 4;
    buf.writeUInt32BE(sessionLow, offset);
    offset += 4;
    buf.writeUInt32BE(data.byteLength, offset);
    offset += 4;
    buf.set(data, MESSAGE_BYTE);
    return buf;
  }

  private decodeMessage(raw: Buffer): DecodedMessage {
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const type = buf.readUInt8(0);
    const cmd = buf.readUInt16BE(1);
    const sessionId = buf.readUInt8(3);
    const sessionHigh = buf.readUInt32BE(4);
    const sessionLow = buf.readUInt32BE(8);
    const session = (BigInt(sessionHigh) << BigInt(32)) | BigInt(sessionLow);
    const dataLength = buf.readUInt32BE(12);
    const data = new Uint8Array(buf.subarray(MESSAGE_BYTE, MESSAGE_BYTE + dataLength));
    return { type, cmd, sessionId, session, data, dataLength };
  }
}
