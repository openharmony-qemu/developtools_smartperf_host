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

import { LongTraceTransfer } from '../../../src/trace/longtrace/LongTraceTransfer';
import {
  buildLongTraceProgressMessage,
  LONG_TRACE_CHANNEL_DOWNLOAD,
  LONG_TRACE_CHANNEL_UPLOAD,
  LONG_TRACE_FALLBACK_PATH,
  LONG_TRACE_MESSAGE_TYPE_HELLO,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_MESSAGE_TYPE_RESULT,
  LONG_TRACE_MESSAGE_TYPE_TRACE_END,
  LONG_TRACE_MESSAGE_TYPE_TRACE_META,
  LONG_TRACE_REASON_SESSION_BOUND,
  LONG_TRACE_STATUS_NO_PATCH,
  LONG_TRACE_STATUS_PATCH_READY,
} from '../../../src/trace/longtrace/LongTraceConstants';

const MOCK_SESSION_ID = 'mock-session';
const MOCK_TRACE_FILE_NAME = 'hiprofiler_data_20260101_010101_1.htrace';
const MOCK_TRACE_URL = `ws://mock${LONG_TRACE_FALLBACK_PATH}`;
const MOCK_TRACE_FILE_CONTENT = 'abc';
const MOCK_TRACE_PATCH_CONTENT = 'trace';
const MOCK_PATCH_PART_ONE = 'patch-';
const MOCK_PATCH_PART_TWO = 'payload';
const MOCK_PATCH_READY_PAGE = 1;
const MOCK_NO_PATCH_PAGE = 1;

type MockListener = (event?: { data?: unknown }) => void;

// 模拟最小可用的 WebSocket，实现事件监听、发送与主动触发消息。
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readonly sentData: Array<string | ArrayBuffer> = [];
  readonly listeners: Map<string, Set<MockListener>> = new Map();
  readyState = MockWebSocket.CONNECTING;
  binaryType = '';

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: MockListener): void {
    const group = this.listeners.get(type) ?? new Set<MockListener>();
    group.add(listener);
    this.listeners.set(type, group);
  }

  removeEventListener(type: string, listener: MockListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string | ArrayBuffer): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('socket not open');
    }
    this.sentData.push(data);
  }

  close(): void {
    if (this.readyState === MockWebSocket.CLOSED) {
      return;
    }
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close');
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN;
    this.emit('open');
  }

  emit(type: string, event?: { data?: unknown }): void {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return;
    }
    listeners.forEach((listener) => listener(event));
  }
}

// 等待一个事件循环，让异步 Promise 与消息回调有机会继续执行。
function flushAsyncTasks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

// 构造可被 LongTraceTransfer 正常读取的测试文件对象。
function createMockFile(name: string, content: string): File {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  return {
    name,
    size: bytes.byteLength,
    slice(start?: number, end?: number): Blob {
      const from = start ?? 0;
      const to = end ?? bytes.byteLength;
      return {
        arrayBuffer(): Promise<ArrayBuffer> {
          return Promise.resolve(bytes.slice(from, to).buffer);
        },
      } as Blob;
    },
  } as File;
}

// 构造真正独立的 ArrayBuffer，避免直接复用 TypedArray 底层缓冲区导致类型判断不稳定。
function createArrayBuffer(content: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(content);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

// 统一构造绑定成功消息，避免各用例重复拼装 JSON。
function createSessionBoundMessage(): string {
  return JSON.stringify({
    type: LONG_TRACE_MESSAGE_TYPE_RESULT,
    sessionId: MOCK_SESSION_ID,
    n: 0,
    fileName: '',
    status: LONG_TRACE_STATUS_NO_PATCH,
    hasPatchPayload: false,
    reason: LONG_TRACE_REASON_SESSION_BOUND,
  });
}

// 统一构造普通结果消息，便于表达“无需补丁”的完成场景。
function createNoPatchResultMessage(n: number, fileName: string): string {
  return JSON.stringify({
    type: LONG_TRACE_MESSAGE_TYPE_RESULT,
    sessionId: MOCK_SESSION_ID,
    n,
    fileName,
    status: LONG_TRACE_STATUS_NO_PATCH,
    hasPatchPayload: false,
  });
}

// 统一构造“需要补丁”的结果消息，便于驱动补丁接收流程。
function createPatchReadyMessage(n: number, fileName: string): string {
  return JSON.stringify({
    type: LONG_TRACE_MESSAGE_TYPE_RESULT,
    sessionId: MOCK_SESSION_ID,
    n,
    fileName,
    status: LONG_TRACE_STATUS_PATCH_READY,
    hasPatchPayload: true,
  });
}

// 统一构造补丁结束消息，触发补丁合并与结果回调。
function createPatchEndMessage(n: number, fileName: string): string {
  return JSON.stringify({
    type: LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
    sessionId: MOCK_SESSION_ID,
    n,
    fileName,
  });
}

// 过滤 WebSocket 发送缓存中的文本消息，便于断言握手与元数据发送顺序。
function getSentTextMessages(ws: MockWebSocket): Array<Record<string, unknown>> {
  return ws.sentData
    .filter((data): data is string => typeof data === 'string')
    .map((data) => JSON.parse(data) as Record<string, unknown>);
}

describe('LongTraceTransfer', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      writable: true,
      value: MockWebSocket,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      writable: true,
      value: originalWebSocket,
    });
  });

  /*
   * 测试条件：在会话绑定完成前下载通道关闭时，预处理 Promise 应直接 reject。
   * 测试目的：验证 LongTraceTransfer 实例在绑定失败时能够及时通知业务层。
   */
  it('在会话绑定完成前下载通道关闭时应直接失败', async () => {
    // 构造一个最小的单文件预处理场景。
    const transfer = new LongTraceTransfer(MOCK_TRACE_URL);
    const files = [createMockFile(MOCK_TRACE_FILE_NAME, MOCK_TRACE_FILE_CONTENT)];
    const preprocessPromise = transfer.preprocessInBackground(files);

    // 等待实例化双通道。
    await flushAsyncTasks();
    expect(MockWebSocket.instances.length).toBe(2);
    const [uploadWs, downloadWs] = MockWebSocket.instances;

    // 双通道连接建立后，流程会进入“等待 SESSION_BOUND”阶段。
    uploadWs.open();
    downloadWs.open();
    await flushAsyncTasks();

    // 绑定尚未成功时下载通道被关闭，应由绑定等待 Promise 直接 reject。
    downloadWs.close();
    await expect(preprocessPromise).rejects.toThrow('The extended service channel has been disconnected');
  });

  /*
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确合并补丁数据并回调结果。
   */
  it('单文件无补丁场景下应完成握手、上传并回调结果与进度', async () => {
    // 构造进度与结果回调，验证业务层可收到完整通知。
    const transfer = new LongTraceTransfer(MOCK_TRACE_URL);
    const onProgress = jest.fn();
    const onResult = jest.fn();
    const fileName = MOCK_TRACE_FILE_NAME;
    const preprocessPromise = transfer.preprocessInBackground([createMockFile(fileName, MOCK_TRACE_FILE_CONTENT)], {
      onProgress,
      onResult,
    });

    // 等待双通道创建完成。
    await flushAsyncTasks();
    expect(MockWebSocket.instances.length).toBe(2);
    const [uploadWs, downloadWs] = MockWebSocket.instances;

    // 打开双通道后，客户端会先发送 HELLO 握手消息。
    uploadWs.open();
    downloadWs.open();
    await flushAsyncTasks();

    // 服务端返回绑定成功，客户端随后开始发送文件元数据与二进制分片。
    downloadWs.emit('message', {
      data: createSessionBoundMessage(),
    });
    await flushAsyncTasks();

    // 服务端告知该文件无需补丁，整个预处理流程应正常结束。
    downloadWs.emit('message', {
      data: createNoPatchResultMessage(1, fileName),
    });

    await expect(preprocessPromise).resolves.toBeUndefined();

    // 上传通道应发送 HELLO、TRACE_META、文件分片、TRACE_END 四类数据。
    const uploadTextMessages = getSentTextMessages(uploadWs);
    expect(uploadTextMessages[0]).toMatchObject({ type: LONG_TRACE_MESSAGE_TYPE_HELLO, channel: LONG_TRACE_CHANNEL_UPLOAD });
    expect(uploadTextMessages[1]).toMatchObject({
      type: LONG_TRACE_MESSAGE_TYPE_TRACE_META,
      n: MOCK_NO_PATCH_PAGE,
      fileName,
      isLast: true,
    });
    expect(uploadWs.sentData.some((data) => typeof data !== 'string')).toBeTruthy();
    expect(uploadTextMessages[2]).toMatchObject({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, n: MOCK_NO_PATCH_PAGE, fileName });
    // 下载通道只负责发送 HELLO，不承载上传元数据。
    expect(getSentTextMessages(downloadWs)[0]).toMatchObject({
      type: LONG_TRACE_MESSAGE_TYPE_HELLO,
      channel: LONG_TRACE_CHANNEL_DOWNLOAD,
    });
    // 业务层应收到一次“无补丁”结果通知。
    expect(onResult).toHaveBeenCalledWith({
      n: MOCK_NO_PATCH_PAGE,
      fileName,
      status: LONG_TRACE_STATUS_NO_PATCH,
      reason: undefined,
    });
    // 进度回调应报告单文件已完成。
    expect(onProgress).toHaveBeenCalledWith({
      done: MOCK_NO_PATCH_PAGE,
      total: MOCK_NO_PATCH_PAGE,
      message: buildLongTraceProgressMessage(MOCK_NO_PATCH_PAGE, MOCK_NO_PATCH_PAGE),
    });
  });

  /*
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确合并补丁数据并回调结果。
   */
  it('补丁场景下应合并二进制分片并回调 PATCH_READY 结果', async () => {
    // 构造补丁结果回调，验证二进制分片最终会被正确拼接。
    const transfer = new LongTraceTransfer(MOCK_TRACE_URL);
    const onProgress = jest.fn();
    const onResult = jest.fn();
    const fileName = MOCK_TRACE_FILE_NAME;
    const preprocessPromise = transfer.preprocessInBackground([createMockFile(fileName, MOCK_TRACE_PATCH_CONTENT)], {
      onProgress,
      onResult,
    });

    // 等待双通道创建并建立连接。
    await flushAsyncTasks();
    const [uploadWs, downloadWs] = MockWebSocket.instances;
    uploadWs.open();
    downloadWs.open();
    await flushAsyncTasks();

    // 先完成双通道绑定，再通知客户端当前文件需要补丁数据。
    downloadWs.emit('message', { data: createSessionBoundMessage() });
    await flushAsyncTasks();
    downloadWs.emit('message', { data: createPatchReadyMessage(MOCK_PATCH_READY_PAGE, fileName) });
    await flushAsyncTasks();

    // 依次下发两段补丁二进制流，模拟真实的分片传输过程。
    downloadWs.emit('message', { data: createArrayBuffer(MOCK_PATCH_PART_ONE) });
    downloadWs.emit('message', { data: createArrayBuffer(MOCK_PATCH_PART_TWO) });
    downloadWs.emit('message', { data: createPatchEndMessage(MOCK_PATCH_READY_PAGE, fileName) });

    await expect(preprocessPromise).resolves.toBeUndefined();

    // 补丁完成后业务层应收到 PATCH_READY，且补丁内容已按顺序拼接。
    expect(onResult).toHaveBeenCalledTimes(1);
    const result = onResult.mock.calls[0][0] as {
      n: number;
      fileName: string;
      status: string;
      patchPayload: Uint8Array;
    };
    expect(result.n).toBe(MOCK_PATCH_READY_PAGE);
    expect(result.fileName).toBe(fileName);
    expect(result.status).toBe(LONG_TRACE_STATUS_PATCH_READY);
    expect(new TextDecoder().decode(result.patchPayload)).toBe(`${MOCK_PATCH_PART_ONE}${MOCK_PATCH_PART_TWO}`);
    // 补丁合并完成后，同样需要推进进度到 100%。
    expect(onProgress).toHaveBeenCalledWith({
      done: MOCK_PATCH_READY_PAGE,
      total: MOCK_PATCH_READY_PAGE,
      message: buildLongTraceProgressMessage(MOCK_PATCH_READY_PAGE, MOCK_PATCH_READY_PAGE),
    });
  });
});
