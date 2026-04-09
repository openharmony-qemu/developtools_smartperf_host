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
const net = require('net');
const WebSocket = require('ws');
const {
  LONG_TRACE_MESSAGE_TYPE_HELLO,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_MESSAGE_TYPE_RESULT,
  LONG_TRACE_MESSAGE_TYPE_TRACE_END,
  LONG_TRACE_MESSAGE_TYPE_TRACE_META,
  LONG_TRACE_RESULT_REASON_MIN_N,
  LONG_TRACE_RESULT_REASON_SESSION_BOUND,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
  LONG_TRACE_RESULT_STATUS_PATCH_READY,
  LONG_TRACE_TEXT_ENCODING_UTF8,
  LONG_TRACE_CHANNEL_DOWNLOAD,
  LONG_TRACE_CHANNEL_UPLOAD,
} = require('../trace_adapter/traceConstants.js');
const {
  TEST_BIND_TIMEOUT_MS,
  TEST_E2E_TIMEOUT_MS,
  TEST_E2E_TRACE_FILE_PREFIX,
  TEST_E2E_TRACE_FILE_SUFFIX,
  TEST_E2E_SESSION_ID,
  TEST_LOCALHOST,
  TEST_POLL_INTERVAL_MS,
  TEST_RESULT_TIMEOUT_MS,
} = require('./traceTestConstants.js');
const {
  buildTraceWithOptionalNativehook,
  loadLongTraceProtoTypes,
} = require('./traceTestBuilders.js');

// 统一收敛轮询和绑定等待时长，避免端到端测试对环境波动过于敏感。
const BIND_TIMEOUT_MS = TEST_BIND_TIMEOUT_MS;
const RESULT_TIMEOUT_MS = TEST_RESULT_TIMEOUT_MS;
const POLL_INTERVAL_MS = TEST_POLL_INTERVAL_MS;
const E2E_TIMEOUT_MS = TEST_E2E_TIMEOUT_MS;

// 等待 WebSocket 进入 OPEN，确保后续发送 HELLO 前连接已经可用。
function waitForOpen(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      ws.off('open', onOpen);
      ws.off('error', onError);
    };
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    ws.on('open', onOpen);
    ws.on('error', onError);
  });
}

// 轮询等待某个条件成立，用于观察异步结果帧和补丁回传。
function waitForCondition(getter, timeoutMs, message) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const value = getter();
      if (value) {
        resolve(value);
        return;
      }
      if (Date.now() - startTime >= timeoutMs) {
        reject(new Error(message));
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  });
}

// 申请一个空闲端口，避免端到端测试和本地运行环境发生端口冲突。
function allocateTestPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, TEST_LOCALHOST, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

// 启动只服务于当前测试的 WebSocket 服务器，并直接挂接真实 traceAdapter。
function startLongTraceTestServer(port) {
  const adapter = require('../trace_adapter/traceAdapter.js');
  adapter.init();
  const server = new WebSocket.Server({ port });
  server.on('connection', (ws) => adapter.handleLongTraceConnection(ws));
  return {
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      adapter.stop();
    },
  };
}

// 收集下载通道上的结果帧和补丁字节数，用于后续断言 PATCH_READY 是否真的落地。
function createDownloadCollectors(downloadWs) {
  const resultFrames = [];
  const patchBytesByN = new Map();
  let patchBytes = 0;
  downloadWs.on('message', (data) => {
    let text = '';
    if (typeof data === 'string') {
      text = data;
    } else if (Buffer.isBuffer(data)) {
      text = data.toString(LONG_TRACE_TEXT_ENCODING_UTF8);
    }
    if (!text) {
      return;
    }
    let msg;
    try {
      msg = JSON.parse(text);
    } catch (e) {
      if (Buffer.isBuffer(data)) {
        patchBytes += data.byteLength;
      }
      return;
    }
    if (msg.type === LONG_TRACE_MESSAGE_TYPE_RESULT) {
      resultFrames.push(msg);
      return;
    }
    if (msg.type === LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END) {
      patchBytesByN.set(msg.n, patchBytes);
      patchBytes = 0;
    }
  });
  return { patchBytesByN, resultFrames };
}

// 统一封装上传一页 trace 的三步动作：TRACE_META、二进制数据、TRACE_END。
function sendTrace(uploadWs, sessionId, n, traceBuffer, isLast) {
  const fileName = `${TEST_E2E_TRACE_FILE_PREFIX}${n}${TEST_E2E_TRACE_FILE_SUFFIX}`;
  uploadWs.send(JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_META, sessionId, n, fileName, isLast }));
  uploadWs.send(traceBuffer);
  uploadWs.send(JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_TRACE_END, sessionId, n, fileName }));
}

/*
 * 测试条件：启动真实 traceAdapter 服务，依次上传两页包含 nativehook 的 trace。
 * 测试目的：验证双通道握手、基线页 NO_PATCH 和后续页 PATCH_READY 的完整端到端链路。
 */
test('LongTrace 双通道端到端：绑定确认、NO_PATCH 与 PATCH_READY 回传', { timeout: E2E_TIMEOUT_MS }, async () => {
  const testPort = await allocateTestPort();
  const server = startLongTraceTestServer(testPort);
  const types = loadLongTraceProtoTypes();
  const sessionId = TEST_E2E_SESSION_ID;
  const uploadWs = new WebSocket(`ws://${TEST_LOCALHOST}:${testPort}`);
  const downloadWs = new WebSocket(`ws://${TEST_LOCALHOST}:${testPort}`);
  const { patchBytesByN, resultFrames } = createDownloadCollectors(downloadWs);

  try {
    // 先完成双通道握手，再按顺序上传第一页和第二页 trace。
    await Promise.all([waitForOpen(uploadWs), waitForOpen(downloadWs)]);
    uploadWs.send(JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_HELLO, sessionId, channel: LONG_TRACE_CHANNEL_UPLOAD }));
    downloadWs.send(
      JSON.stringify({ type: LONG_TRACE_MESSAGE_TYPE_HELLO, sessionId, channel: LONG_TRACE_CHANNEL_DOWNLOAD })
    );
    await waitForCondition(
      () => resultFrames.find((item) => item.reason === LONG_TRACE_RESULT_REASON_SESSION_BOUND),
      BIND_TIMEOUT_MS,
      '未收到 SESSION_BOUND'
    );
    sendTrace(uploadWs, sessionId, 1, buildTraceWithOptionalNativehook(types, true, 1, 100), false);
    sendTrace(uploadWs, sessionId, 2, buildTraceWithOptionalNativehook(types, true, 2, 200), true);
    // 第 1 页作为基线页不带补丁，第 2 页应收到 PATCH_READY 和补丁二进制。
    const firstResult = await waitForCondition(
      () => resultFrames.find((item) => item.n === 1),
      RESULT_TIMEOUT_MS,
      '未收到第一页结果'
    );
    const secondResult = await waitForCondition(
      () => resultFrames.find((item) => item.n === 2),
      RESULT_TIMEOUT_MS,
      '未收到第二页结果'
    );
    await waitForCondition(() => patchBytesByN.get(2), RESULT_TIMEOUT_MS, '未收到第二页补丁数据');

    assert.equal(firstResult.status, LONG_TRACE_RESULT_STATUS_NO_PATCH);
    assert.equal(firstResult.reason, LONG_TRACE_RESULT_REASON_MIN_N);
    assert.equal(secondResult.status, LONG_TRACE_RESULT_STATUS_PATCH_READY);
    assert.equal(secondResult.hasPatchPayload, true);
    assert.ok((patchBytesByN.get(2) ?? 0) > 0);
  } finally {
    try {
      uploadWs.close();
    } catch (e) {}
    try {
      downloadWs.close();
    } catch (e) {}
    await server.stop();
  }
});
