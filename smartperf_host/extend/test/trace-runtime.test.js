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

const test = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const {
  LONG_TRACE_CHANNEL_DOWNLOAD,
  LONG_TRACE_CHANNEL_UPLOAD,
  LONG_TRACE_MESSAGE_TYPE_HELLO,
  LONG_TRACE_MESSAGE_TYPE_RESULT,
  LONG_TRACE_MESSAGE_TYPE_TRACE_END,
  LONG_TRACE_MESSAGE_TYPE_TRACE_META,
  LONG_TRACE_RESULT_REASON_INFLIGHT_EXISTS,
  LONG_TRACE_RESULT_REASON_PREFETCH_LIMIT,
  LONG_TRACE_RESULT_REASON_SEQUENCE_MISMATCH,
  LONG_TRACE_RESULT_REASON_SESSION_BOUND,
  LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED,
  LONG_TRACE_RESULT_STATUS_ERROR,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
} = require('../trace_adapter/traceConstants.js');
const {
  TEST_DOUBLE_BYTE_BUFFER,
  TEST_FOUR_BYTE_BUFFER,
  TEST_FILE_NAME_QUEUED,
  TEST_FILE_NAME_TRACE_1,
  TEST_FILE_NAME_TRACE_2,
  TEST_FILE_NAME_TRACE_3,
  TEST_FILE_NAME_TRACE_4,
  TEST_RUNTIME_PREFETCH_LIMIT,
  TEST_RUNTIME_TIMEOUT_MS,
  TEST_SESSION_ID,
  TEST_SINGLE_BYTE_BUFFER,
  TEST_TRIPLE_BYTE_BUFFER,
} = require('./traceTestConstants.js');
const { createLongTraceRuntime } = require('../trace_adapter/traceRuntime.js');

// 自定义 WebSocket 测试替身，用于模拟 message/close/error 生命周期。
class FakeWebSocket {
  constructor(name) {
    this.name = name;
    this.binaryType = undefined;
    this.closedCount = 0;
    this.handlers = new Map();
    this.readyState = WebSocket.OPEN;
    this.sent = [];
  }

  on(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  emit(eventName, ...args) {
    const handlers = this.handlers.get(eventName) ?? [];
    for (const handler of handlers) {
      handler(...args);
    }
  }

  send(data) {
    this.sent.push(data);
  }

  close() {
    this.closedCount += 1;
    this.readyState = WebSocket.CLOSED;
  }
}

// 统一完成上传/下载双通道握手，避免各测试重复搭建样板代码。
function bindRuntime(runtime, sessionId = TEST_SESSION_ID) {
  const uploadWs = new FakeWebSocket('upload');
  const downloadWs = new FakeWebSocket('download');
  runtime.handleConnection(uploadWs);
  runtime.handleConnection(downloadWs);
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_HELLO, sessionId, channel: LONG_TRACE_CHANNEL_UPLOAD }),
    false
  );
  downloadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_HELLO, sessionId, channel: LONG_TRACE_CHANNEL_DOWNLOAD }),
    false
  );
  return { downloadWs, sessionId, uploadWs };
}

// 从下载通道发送记录中提取指定 reason 的 RESULT 帧，便于断言错误分支。
function findResult(downloadWs, reason) {
  return downloadWs.sent
    .filter((item) => typeof item === 'string')
    .map((item) => JSON.parse(item))
    .find((item) => item.type === LONG_TRACE_MESSAGE_TYPE_RESULT && item.reason === reason);
}

// 构造最小可运行 runtime，默认使用空业务回调，只关注状态机行为。
function createRuntime(overrides = {}) {
  return createLongTraceRuntime({
    logger: { error: () => {} },
    onProcessFile: async () => {},
    onUploadComplete: () => {},
    prefetchLimit: TEST_RUNTIME_PREFETCH_LIMIT,
    sessionBindTimeoutMs: TEST_RUNTIME_TIMEOUT_MS,
    sessionIdleTimeoutMs: TEST_RUNTIME_TIMEOUT_MS,
    ...overrides,
  });
}

/*
 * 测试条件：上传与下载通道都完成 HELLO 握手。
 * 测试目的：验证 runtime 会切换到已绑定状态并回发 SESSION_BOUND。
 */
test('traceRuntime 在双通道握手完成后返回 SESSION_BOUND', () => {
  const runtime = createRuntime();
  const { downloadWs, sessionId } = bindRuntime(runtime);

  // 成功绑定后，会话状态应置为 bound，同时下载通道收到绑定确认。
  const session = runtime.sessionStore.get(sessionId);
  const boundResult = findResult(downloadWs, LONG_TRACE_RESULT_REASON_SESSION_BOUND);

  assert.equal(session.bound, true);
  assert.ok(boundResult);
  assert.equal(boundResult.status, LONG_TRACE_RESULT_STATUS_NO_PATCH);
});

/*
 * 测试条件：同一个 inflight 文件尚未结束前再次发送 TRACE_META。
 * 测试目的：验证 runtime 会拒绝重复入流并返回 INFLIGHT_EXISTS。
 */
test('traceRuntime 对重复 TRACE_META 返回 INFLIGHT_EXISTS', () => {
  const runtime = createRuntime();
  const { downloadWs, sessionId, uploadWs } = bindRuntime(runtime);

  // 在未收到 TRACE_END 前再次发送 TRACE_META，应命中 inflight 冲突保护。
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );

  const result = findResult(downloadWs, LONG_TRACE_RESULT_REASON_INFLIGHT_EXISTS);

  assert.ok(result);
  assert.equal(result.status, LONG_TRACE_RESULT_STATUS_ERROR);
});

/*
 * 测试条件：业务处理被阻塞且待处理队列达到预取上限。
 * 测试目的：验证 runtime 会对后续 TRACE_META 返回 PREFETCH_LIMIT。
 */
test('traceRuntime 在处理拥塞时对后续 TRACE_META 返回 PREFETCH_LIMIT', () => {
  let releaseProcess;
  const runtime = createRuntime({
    // 故意阻塞业务处理，制造“处理中 + 队列已满”的运行时状态。
    onProcessFile: async () =>
      new Promise((resolve) => {
        releaseProcess = resolve;
      }),
    onUploadComplete: ({ enqueuePendingFile, sessionId, uploadedFile }) => {
      enqueuePendingFile(sessionId, {
        n: uploadedFile.n,
        fileName: uploadedFile.fileName,
        bytes: TEST_SINGLE_BYTE_BUFFER,
      });
      enqueuePendingFile(sessionId, {
        n: uploadedFile.n + 1,
        fileName: TEST_FILE_NAME_QUEUED,
        bytes: TEST_DOUBLE_BYTE_BUFFER.subarray(1),
      });
    },
  });
  const { downloadWs, sessionId, uploadWs } = bindRuntime(runtime);

  // 第一份文件进入处理后，再追加新的 TRACE_META，应被预取窗口限制拒绝。
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );
  uploadWs.emit('message', TEST_TRIPLE_BYTE_BUFFER, true);
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 3, fileName: TEST_FILE_NAME_TRACE_3 }),
    false
  );

  const result = findResult(downloadWs, LONG_TRACE_RESULT_REASON_PREFETCH_LIMIT);

  assert.ok(result);
  assert.equal(result.status, LONG_TRACE_RESULT_STATUS_ERROR);
  releaseProcess();
});

/*
 * 测试条件：先处理页号 1，再直接上传页号 3。
 * 测试目的：验证 runtime 对断号场景会返回 SEQUENCE_MISMATCH 并阻止后续消费。
 */
test('traceRuntime 在序号断裂时返回 SEQUENCE_MISMATCH', async () => {
  const processedNs = [];
  const runtime = createRuntime({
    // 记录已成功消费的文件序号，验证乱序后不会继续处理后续文件。
    onProcessFile: async ({ fileItem }) => {
      processedNs.push(fileItem.n);
    },
    onUploadComplete: ({ enqueuePendingFile, sessionId, uploadedFile }) => {
      enqueuePendingFile(sessionId, {
        n: uploadedFile.n,
        fileName: uploadedFile.fileName,
        bytes: TEST_SINGLE_BYTE_BUFFER,
      });
    },
  });
  const { downloadWs, sessionId, uploadWs } = bindRuntime(runtime);

  // 先发送 1，再直接发送 3，验证 runtime 对断号场景的顺序保护。
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );
  uploadWs.emit('message', TEST_SINGLE_BYTE_BUFFER, true);
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, sessionId, n: 1, fileName: TEST_FILE_NAME_TRACE_1 }),
    false
  );
  await new Promise((resolve) => setImmediate(resolve));

  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 3, fileName: TEST_FILE_NAME_TRACE_3 }),
    false
  );
  uploadWs.emit('message', TEST_TRIPLE_BYTE_BUFFER.subarray(2), true);
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, sessionId, n: 3, fileName: TEST_FILE_NAME_TRACE_3 }),
    false
  );
  await new Promise((resolve) => setImmediate(resolve));

  const result = findResult(downloadWs, LONG_TRACE_RESULT_REASON_SEQUENCE_MISMATCH);

  assert.deepEqual(processedNs, [1]);
  assert.ok(result);
  assert.equal(result.n, 3);
});

/*
 * 测试条件：上传通道在 inflight 文件尚未结束时直接关闭。
 * 测试目的：验证 runtime 会主动回发 UPLOAD_CHANNEL_CLOSED 并清理会话。
 */
test('traceRuntime 在上传通道异常关闭时返回 UPLOAD_CHANNEL_CLOSED', () => {
  const runtime = createRuntime();
  const { downloadWs, sessionId, uploadWs } = bindRuntime(runtime);

  // 上传通道在 inflight 期间关闭时，应主动补发错误结果并回收会话。
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 2, fileName: TEST_FILE_NAME_TRACE_2 }),
    false
  );
  uploadWs.emit('close');

  const result = findResult(downloadWs, LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED);

  assert.ok(result);
  assert.equal(result.status, LONG_TRACE_RESULT_STATUS_ERROR);
  assert.equal(runtime.sessionStore.has(sessionId), false);
});

/*
 * 测试条件：一个文件被拆成多个二进制分片后再发送 TRACE_END。
 * 测试目的：验证 runtime 会拼接完整字节流再交给业务层。
 */
test('traceRuntime 在 TRACE_END 时向业务层传递完整二进制内容', () => {
  const uploadCompleteCalls = [];
  const runtime = createRuntime({
    // 用回调收集运行时提交给业务层的聚合数据。
    onUploadComplete: (payload) => {
      uploadCompleteCalls.push(payload);
    },
  });
  const { sessionId, uploadWs } = bindRuntime(runtime);

  // 多个二进制分片应在 TRACE_END 时被完整拼接后再交给业务层。
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n: 4, fileName: TEST_FILE_NAME_TRACE_4 }),
    false
  );
  uploadWs.emit('message', TEST_DOUBLE_BYTE_BUFFER, true);
  uploadWs.emit('message', TEST_FOUR_BYTE_BUFFER.subarray(2), true);
  uploadWs.emit(
    'message',
    JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, sessionId, n: 4, fileName: TEST_FILE_NAME_TRACE_4 }),
    false
  );

  assert.equal(uploadCompleteCalls.length, 1);
  assert.deepEqual(uploadCompleteCalls[0].bytes, TEST_FOUR_BYTE_BUFFER);
  assert.equal(uploadCompleteCalls[0].uploadedFile.n, 4);
});
