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
  cleanupLongTraceSession,
  createLongTraceSessionState,
  decodeTextMessage,
  sendBinaryInChunks,
  sendJsonFrame,
} = require('../trace_adapter/traceCommunication.js');
const { LONG_TRACE_MESSAGE_TYPE_RESULT } = require('../trace_adapter/traceConstants.js');
const {
  TEST_RUNTIME_TIMEOUT_MS,
  TEST_SESSION_ID,
  TEST_TRACE_SAMPLE_BUFFER,
} = require('./traceTestConstants.js');

// 简化版 WebSocket 测试替身，用于观察 send/close 调用结果。
class FakeSocket {
  constructor(readyState = WebSocket.OPEN) {
    this.readyState = readyState;
    this.sent = [];
    this.closeCount = 0;
  }

  send(payload) {
    this.sent.push(payload);
  }

  close() {
    this.closeCount += 1;
    this.readyState = WebSocket.CLOSED;
  }
}

/*
 * 测试条件：提供一个可记录 send 调用的假连接。
 * 测试目的：验证 sendJsonFrame 会把对象序列化为 JSON 字符串。
 */
test('traceCommunication.sendJsonFrame 发送 JSON 字符串', () => {
  const socket = new FakeSocket();

  // JSON 控制帧应被序列化为字符串发送。
  sendJsonFrame(socket, { type: LONG_TRACE_MESSAGE_TYPE_RESULT, n: 1 });

  assert.equal(socket.sent.length, 1);
  assert.equal(socket.sent[0], JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_RESULT, n: 1 }));
});

// 测试条件：输入 5 字节缓冲区并指定 2 字节分块。测试目的：验证 sendBinaryInChunks 会按预期切成 3 段发送。
test('traceCommunication.sendBinaryInChunks 按块拆分发送二进制', () => {
  const socket = new FakeSocket();
  const buffer = TEST_TRACE_SAMPLE_BUFFER.subarray(0, 5);

  // 5 字节数据按 2 字节分片后，预期得到 3 次发送。
  sendBinaryInChunks(socket, buffer, 2);

  assert.equal(socket.sent.length, 3);
  assert.deepEqual(socket.sent[0], Buffer.from([1, 2]));
  assert.deepEqual(socket.sent[1], Buffer.from([3, 4]));
  assert.deepEqual(socket.sent[2], Buffer.from([5]));
});

/*
 * 测试条件：创建一个全新的会话状态对象。
 * 测试目的：验证 createLongTraceSessionState 返回的默认字段完整且值正确。
 */
test('traceCommunication.createLongTraceSessionState 返回完整默认状态', () => {
  const bindTimer = setTimeout(() => {}, TEST_RUNTIME_TIMEOUT_MS);
  const state = createLongTraceSessionState(TEST_SESSION_ID, bindTimer);
  clearTimeout(bindTimer);

  // 新会话应处于未绑定、无 inflight、无待处理队列的初始状态。
  assert.equal(state.sessionId, TEST_SESSION_ID);
  assert.equal(state.bound, false);
  assert.equal(state.bindTimer, bindTimer);
  assert.equal(state.idleTimer, undefined);
  assert.deepEqual(state.patchEvents, []);
  assert.deepEqual(state.pendingQueue, []);
  assert.equal(state.processing, false);
  assert.equal(state.inflight, undefined);
  assert.equal(state.minN, undefined);
  assert.equal(state.nextN, undefined);
  assert.ok(state.noPatchDone instanceof Set);
});

/*
 * 测试条件：分别传入 string、Buffer、ArrayBuffer 以及非法值。
 * 测试目的：验证 decodeTextMessage 兼容多种载体并在异常输入下安全返回。
 */
test('traceCommunication.decodeTextMessage 支持 string、Buffer 与 ArrayBuffer', () => {
  // 文本解码器需要兼容运行时可能出现的三种消息载体。
  assert.deepEqual(decodeTextMessage('{"a":1}'), { a: 1 });
  assert.deepEqual(decodeTextMessage(Buffer.from('{"b":2}')), { b: 2 });
  assert.deepEqual(decodeTextMessage(Uint8Array.from(Buffer.from('{"c":3}')).buffer), { c: 3 });
  assert.equal(decodeTextMessage(Buffer.from('not-json')), undefined);
  assert.equal(decodeTextMessage(123), undefined);
});

/*
 * 测试条件：构造包含上下行连接和定时器的会话。
 * 测试目的：验证 cleanupLongTraceSession 会删除会话并回收资源。
 */
test('traceCommunication.cleanupLongTraceSession 关闭连接并清理会话与定时器', async () => {
  const sessionStore = new Map();
  const uploadWs = new FakeSocket(WebSocket.OPEN);
  const downloadWs = new FakeSocket(WebSocket.OPEN);
  const bindTimer = setTimeout(() => {}, TEST_RUNTIME_TIMEOUT_MS);
  const idleTimer = setTimeout(() => {}, TEST_RUNTIME_TIMEOUT_MS);

  sessionStore.set(TEST_SESSION_ID, {
    uploadWs,
    downloadWs,
    bindTimer,
    idleTimer,
  });

  // 清理函数应同步删除会话，并关闭仍处于 OPEN 状态的上下行连接。
  cleanupLongTraceSession(sessionStore, TEST_SESSION_ID);

  assert.equal(sessionStore.has(TEST_SESSION_ID), false);
  assert.equal(uploadWs.closeCount, 1);
  assert.equal(downloadWs.closeCount, 1);

  await new Promise((resolve) => setTimeout(resolve, 0));
});
