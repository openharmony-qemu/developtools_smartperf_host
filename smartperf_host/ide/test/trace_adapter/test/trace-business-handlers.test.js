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
const {
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_RESULT_REASON_MIN_N,
  LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
  LONG_TRACE_RESULT_STATUS_PATCH_READY,
} = require('../trace_adapter/traceConstants.js');
const {
  TEST_EMPTY_BUFFER,
  TEST_FILTERED_SEGMENT_BUFFER,
  TEST_FILE_NAME_BASE,
  TEST_FILE_NAME_EMPTY,
  TEST_FILE_NAME_HOOK,
  TEST_FILE_NAME_NEXT,
  TEST_FILE_NAME_NO_HOOK,
  TEST_PATCH_PAYLOAD_BUFFER,
  TEST_PATCH_CHUNK_SIZE_BYTES,
  TEST_SESSION_ID,
  TEST_TRACE_SAMPLE_BUFFER,
  TEST_TRIPLE_BYTE_BUFFER,
} = require('./traceTestConstants.js');
const { createTraceBusinessHandlers } = require('../trace_adapter/traceBusinessHandlers.js');

// 构造业务处理器测试桩，统一收集二进制发送和 JSON 发送行为。
function createHandlers(overrides = {}) {
  const sendBinaryCalls = [];
  const sendJsonCalls = [];
  // 使用可覆盖的 nativeHookProcessor 假实现，便于针对不同场景控制输入分支。
  const nativeHookProcessor = {
    headerSizeBytes: 8,
    findEarliestNativehookTimestamp: () => ({ clockId: 7, tvSec: '10', tvNsec: '20' }),
    buildNativehookPatchPayload: () => TEST_PATCH_PAYLOAD_BUFFER,
    extractCommonEvents: () => [{ id: 'common' }],
    hasNativehookFast: () => true,
    filterNativeHookSegments: () => TEST_FILTERED_SEGMENT_BUFFER,
    ...overrides,
  };
  const handlers = createTraceBusinessHandlers({
    nativeHookProcessor,
    patchChunkSizeBytes: TEST_PATCH_CHUNK_SIZE_BYTES,
    sendBinaryInChunks: (...args) => sendBinaryCalls.push(args),
    sendJsonFrame: (...args) => sendJsonCalls.push(args),
  });
  return {
    handlers,
    nativeHookProcessor,
    sendBinaryCalls,
    sendJsonCalls,
  };
}

// 生成最小会话对象，只保留业务处理器依赖的状态字段。
function createSession() {
  return {
    sessionId: TEST_SESSION_ID,
    downloadWs: { name: 'download-ws' },
    minN: 1,
    patchEvents: [],
    noPatchDone: new Set(),
  };
}

// 测试条件：构造空字节流输入。测试目的：验证 onProcessFile 遇到无有效 trace 数据时直接返回 NO_PATCH。
test('traceBusinessHandlers.onProcessFile 在无有效数据时返回 NO_PATCH', async () => {
  const { handlers } = createHandlers();
  const session = createSession();
  const results = [];

  // 空字节流应被识别为无可处理数据，直接返回 NO_PATCH。
  await handlers.onProcessFile({
    fileItem: { n: 1, fileName: TEST_FILE_NAME_EMPTY, bytes: TEST_EMPTY_BUFFER },
    sendResult: (...args) => results.push(args),
    session,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0][3], TEST_FILE_NAME_EMPTY);
  assert.equal(results[0][4], LONG_TRACE_RESULT_STATUS_NO_PATCH);
  assert.equal(results[0][6], LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK);
});

/*
 * 测试条件：当前页为最小页号且存在可提取公共事件。
 * 测试目的：验证基线页只初始化补丁上下文，不发送补丁数据。
 */
test('traceBusinessHandlers.onProcessFile 在基线页累计公共事件但不发送补丁', async () => {
  const { handlers, sendBinaryCalls, sendJsonCalls } = createHandlers();
  const session = createSession();
  const results = [];

  // 基线页负责初始化补丁上下文，因此只累计公共事件，不下发补丁数据。
  await handlers.onProcessFile({
    fileItem: { n: 1, fileName: TEST_FILE_NAME_BASE, bytes: TEST_TRACE_SAMPLE_BUFFER },
    sendResult: (...args) => results.push(args),
    session,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0][4], LONG_TRACE_RESULT_STATUS_NO_PATCH);
  assert.equal(results[0][6], LONG_TRACE_RESULT_REASON_MIN_N);
  assert.deepEqual(session.patchEvents, [{ id: 'common' }]);
  assert.equal(sendBinaryCalls.length, 0);
  assert.equal(sendJsonCalls.length, 0);
});

/*
 * 测试条件：当前页不是基线页，且会话中已存在历史公共事件。
 * 测试目的：验证后续页先将 patchPayload 合并到当前字节流再整体提取，并发送补丁结束帧。
 */
test('traceBusinessHandlers.onProcessFile 在后续页合并上一页补丁后整体提取并发送结束帧', async () => {
  const extractCalls = [];
  const { handlers, sendBinaryCalls, sendJsonCalls } = createHandlers({
    extractCommonEvents: (buf) => { extractCalls.push(buf); return [{ id: 'new-common' }]; },
  });
  const session = createSession();
  session.minN = 1;
  session.patchEvents = [{ id: 'old-common' }];
  const results = [];
  // 构造大于 header 的输入，确保能验证 patchPayload 被插入到文件头之后、原始数据段之前。
  const headerPart = Buffer.alloc(LONG_TRACE_HEADER_SIZE_BYTES, 0xAA);
  const dataPart = Buffer.from([0xBB, 0xCC, 0xDD]);
  const traceWithData = Buffer.concat([headerPart, dataPart]);

  await handlers.onProcessFile({
    fileItem: { n: 2, fileName: TEST_FILE_NAME_NEXT, bytes: traceWithData },
    sendResult: (...args) => results.push(args),
    session,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0][4], LONG_TRACE_RESULT_STATUS_PATCH_READY);
  assert.equal(results[0][5], true);
  assert.equal(sendBinaryCalls.length, 1);
  assert.equal(sendBinaryCalls[0][0], session.downloadWs);
  assert.deepEqual(sendBinaryCalls[0][1], TEST_PATCH_PAYLOAD_BUFFER);
  assert.equal(sendBinaryCalls[0][2], TEST_PATCH_CHUNK_SIZE_BYTES);
  assert.equal(sendJsonCalls.length, 1);
  assert.equal(sendJsonCalls[0][1].type, LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END);
  assert.equal(sendJsonCalls[0][1].n, 2);
  assert.deepEqual(session.patchEvents, [{ id: 'new-common' }]);
  // extractCommonEvents 应收到 [header][patchPayload][原始数据段] 顺序的合并字节流。
  assert.equal(extractCalls.length, 1);
  const expectedMerged = Buffer.concat([headerPart, TEST_PATCH_PAYLOAD_BUFFER, dataPart]);
  assert.deepEqual(extractCalls[0], expectedMerged);
});

/*
 * 测试条件：快速探测明确返回无 nativehook。
 * 测试目的：验证 onUploadComplete 会快速回包并登记 noPatchDone。
 */
test('traceBusinessHandlers.onUploadComplete 在无 nativehook 时直接回 NO_PATCH', () => {
  const { handlers } = createHandlers({
    // 强制关闭 nativehook 探测，验证快速返回分支。
    hasNativehookFast: () => false,
  });
  const session = createSession();
  const results = [];
  const enqueued = [];

  // 没有 nativehook 段时，应直接回包并记录 noPatchDone，避免阻塞顺序消费。
  handlers.onUploadComplete({
    bytes: TEST_TRIPLE_BYTE_BUFFER,
    enqueuePendingFile: (...args) => enqueued.push(args),
    sendResult: (...args) => results.push(args),
    session,
    sessionId: session.sessionId,
    uploadedFile: { n: 5, fileName: TEST_FILE_NAME_NO_HOOK },
  });

  assert.equal(results.length, 1);
  assert.equal(results[0][4], LONG_TRACE_RESULT_STATUS_NO_PATCH);
  assert.equal(results[0][6], LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK);
  assert.equal(session.noPatchDone.has(5), true);
  assert.equal(enqueued.length, 0);
});

/*
 * 测试条件：过滤后的结果仍大于 header，表示存在 nativehook 数据。
 * 测试目的：验证文件会进入待处理队列而不是立即回包。
 */
test('traceBusinessHandlers.onUploadComplete 在存在 nativehook 时投递待处理队列', () => {
  const { handlers } = createHandlers({
    // 返回大于 header 的过滤结果，验证成功进入待处理队列。
    filterNativeHookSegments: () => TEST_TRACE_SAMPLE_BUFFER,
  });
  const session = createSession();
  const results = [];
  const enqueued = [];

  // 命中 nativehook 后不应立即回包，而是交给运行时按序消费。
  handlers.onUploadComplete({
    bytes: TEST_TRIPLE_BYTE_BUFFER,
    enqueuePendingFile: (...args) => enqueued.push(args),
    sendResult: (...args) => results.push(args),
    session,
    sessionId: session.sessionId,
    uploadedFile: { n: 6, fileName: TEST_FILE_NAME_HOOK },
  });

  assert.equal(results.length, 0);
  assert.equal(enqueued.length, 1);
  assert.equal(enqueued[0][0], session.sessionId);
  assert.equal(enqueued[0][1].n, 6);
  assert.equal(enqueued[0][1].fileName, TEST_FILE_NAME_HOOK);
  assert.deepEqual(enqueued[0][1].bytes, TEST_TRACE_SAMPLE_BUFFER);
});
