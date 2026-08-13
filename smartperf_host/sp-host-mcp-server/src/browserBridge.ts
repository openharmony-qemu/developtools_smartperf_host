import WebSocket from 'ws';
import { EventEmitter } from 'events';

const EXTENSION_PORT = 19099;
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

export interface BrowserBridgeConfig {
  port?: number;
  autoConnect?: boolean;
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
    if (this.connected || this.connecting) return;
    this.connecting = true;
    try {
      await this.doConnect();
      await this.login();
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');
    } catch (e) {
      this.connecting = false;
      this.emit('error', e);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.connected = false;
    for (const [id, cb] of this.pendingCallbacks) {
      clearTimeout(cb.timer);
      cb.resolve({ success: false, message: 'Disconnected' });
    }
    this.pendingCallbacks.clear();
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  private pendingCallbacks = new Map<number, { trackingId: number; resolve: (payload: any) => void; timer: NodeJS.Timeout }>();
  private cmdCounter = 0;

  async sendUiCommand(cmd: number, payload: Record<string, unknown>, timeoutMs = 5000): Promise<{ sent: boolean; result?: any }> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch {
        return { sent: false, result: { success: false, message: 'Extension service not available. Start the extension service and open SP Host in browser.' } };
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
        resolve({ sent: true, result: { success: false, message: 'Browser response timeout' } });
      }, timeoutMs);

      this.pendingCallbacks.set(trackingId, {
        trackingId,
        resolve: (responsePayload: any) => {
          clearTimeout(timer);
          resolve({ sent: true, result: responsePayload });
        },
        timer,
      });
    });
  }

  async requestExportDb(timeoutMs = 120000): Promise<{ sent: boolean; result?: any }> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch {
        return { sent: false, result: { success: false, message: 'Extension service not available. Start the extension service and open SP Host in browser.' } };
      }
    }
    const trackingId = ++this.cmdCounter;
    const data = new TextEncoder().encode(JSON.stringify({ _trackingId: trackingId }));
    const message = this.encodeMessage(AGENT_TYPE, UI_CMD.EXPORT_DB, this.sessionId, this.session, data);
    this.ws!.send(message);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingCallbacks.delete(trackingId);
        resolve({ sent: true, result: { success: false, message: 'DB export timeout' } });
      }, timeoutMs);

      this.pendingCallbacks.set(trackingId, {
        trackingId,
        resolve: (responsePayload: any) => {
          clearTimeout(timer);
          resolve({ sent: true, result: responsePayload });
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
        let payload: any;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          payload = { raw: dataStr };
        }
        this.emit('browser-response', { cmd: msg.cmd, sessionId: msg.session_id, payload });
        const trackingId = payload?._trackingId;
        if (trackingId != null) {
          const cb = this.pendingCallbacks.get(Number(trackingId));
          if (cb) {
            this.pendingCallbacks.delete(Number(trackingId));
            cb.resolve(payload);
          }
        }
      }
    } catch {}
  }

  private async doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${this.port}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.ws?.close();
      }, 10000);

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
        if (loginHandler && this.ws) this.ws.off('message', loginHandler);
        if (timer) clearTimeout(timer);
        loginHandler = null;
        timer = null;
      };

      timer = setTimeout(() => {
        cleanup();
        this.ws?.close();
        reject(new Error('Login timeout'));
      }, 5000);

      loginHandler = (raw: Buffer) => {
        try {
          const msg = this.decodeMessage(raw);
          if (msg.type === 0 && msg.cmd === 2) {
            this.sessionId = msg.session_id;
            this.session = msg.session;
            cleanup();
            resolve();
          } else if (msg.type === 0 && msg.cmd === 3) {
            cleanup();
            this.ws?.close();
            reject(new Error('Login failed: session limit reached'));
          }
        } catch {}
      };

      this.ws!.on('message', loginHandler);
      const loginMsg = this.encodeMessage(0, 1, 0, 0n, new Uint8Array(0));
      this.ws!.send(loginMsg);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts - 1), 60000);
    setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private encodeMessage(type: number, cmd: number, sessionId: number, session: bigint, data: Uint8Array): Buffer {
    const totalLength = MESSAGE_BYTE + data.byteLength;
    const buf = Buffer.alloc(totalLength);
    let offset = 0;
    buf.writeUInt8(type, offset); offset += 1;
    buf.writeUInt16BE(cmd, offset); offset += 2;
    buf.writeUInt8(sessionId, offset); offset += 1;
    const sessionHigh = Number((session >> BigInt(32)) & BigInt(0xFFFFFFFF));
    const sessionLow = Number(session & BigInt(0xFFFFFFFF));
    buf.writeUInt32BE(sessionHigh, offset); offset += 4;
    buf.writeUInt32BE(sessionLow, offset); offset += 4;
    buf.writeUInt32BE(data.byteLength, offset); offset += 4;
    buf.set(data, MESSAGE_BYTE);
    return buf;
  }

  private decodeMessage(raw: Buffer): { type: number; cmd: number; session_id: number; session: bigint; data: Uint8Array; data_length: number } {
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const type = buf.readUInt8(0);
    const cmd = buf.readUInt16BE(1);
    const session_id = buf.readUInt8(3);
    const sessionHigh = buf.readUInt32BE(4);
    const sessionLow = buf.readUInt32BE(8);
    const session = (BigInt(sessionHigh) << BigInt(32)) | BigInt(sessionLow);
    const data_length = buf.readUInt32BE(12);
    const data = new Uint8Array(buf.subarray(MESSAGE_BYTE, MESSAGE_BYTE + data_length));
    return { type, cmd, session_id, session, data, data_length };
  }
}
