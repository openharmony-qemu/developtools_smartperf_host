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

const WebSocket = require('ws');
const { LONG_TRACE_TEXT_ENCODING_UTF8 } = require('./traceConstants.js');

/**
 * 发送 JSON 控制帧，通信异常在会话层统一兜底，不在此处抛出。
 * @param {WebSocket} ws - 目标 WebSocket 连接。
 * @param {Object} obj - 待发送的 JSON 控制帧对象。
 */
function sendJsonFrame(ws, obj) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {}
}

/**
 * 按固定块大小发送二进制补丁，避免单帧过大造成浏览器或 ws 缓冲压力。
 * @param {WebSocket} ws - 目标 WebSocket 连接。
 * @param {Buffer} buffer - 待发送的二进制补丁数据。
 * @param {number} chunkSize - 每个块的字节数。
 */
function sendBinaryInChunks(ws, buffer, chunkSize) {
  let offset = 0;
  while (offset < buffer.byteLength) {
    // 每次发送 chunkSize 字节，或剩余字节数不足 chunkSize 时，发送所有剩余字节。
    const end = Math.min(offset + chunkSize, buffer.byteLength);
    ws.send(buffer.subarray(offset, end));
    offset = end;
  }
}

/**
 * 回收单个会话占用的上下行连接与定时器资源，防止超时连接长期驻留。
 * @param {Map} sessionStore - 会话存储，键为会话 ID，值为会话状态。
 * @param {string} sessionId - 要回收的会话 ID。
 */
function cleanupLongTraceSession(sessionStore, sessionId) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return;
  }
  sessionStore.delete(sessionId);
  try {
    if (session.uploadWs && session.uploadWs.readyState === WebSocket.OPEN) {
      session.uploadWs.close();
    }
  } catch (e) {}
  try {
    if (session.downloadWs && session.downloadWs.readyState === WebSocket.OPEN) {
      session.downloadWs.close();
    }
  } catch (e) {}
  try {
    if (session.bindTimer) {
      clearTimeout(session.bindTimer);
    }
  } catch (e) {}
  try {
    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
    }
  } catch (e) {}
}

/**
 * 创建 longtrace 会话的初始运行时状态，供双通道绑定完成前后共享。
 * @param {string} sessionId - 会话 ID。
 * @param {number} bindTimer - 绑定超时器 ID。
 */
function createLongTraceSessionState(sessionId, bindTimer) {
  return {
    sessionId, // 会话 ID
    uploadWs: undefined, // 上传行连接
    downloadWs: undefined, // 下载行连接
    bound: false, // 是否绑定
    bindTimer, // 绑定超时器 ID
    idleTimer: undefined, // 空闲超时器 ID
    patchEvents: [], // 补丁数组
    pendingQueue: [], // 待处理trace文件队列
    processing: false, // 是否处理中
    inflight: undefined, // 当前在传trace文件
    minN: undefined, // 最小trace文件序号
    nextN: undefined, // 下一个trace文件序号
    noPatchDone: new Set(), // 没有补丁的trace文件序号集合
  };
}

/**
 * 统一把 string、Buffer、ArrayBuffer 三类消息载体解码为 JSON 对象。
 * @param {string|Buffer|ArrayBuffer} data - 待解码的消息数据。
 * @returns {Object|undefined} - 解码后的 JSON 对象或 undefined。
 */
function decodeTextMessage(data) {
  let text = '';
  if (typeof data === 'string') {
    text = data;
  } else if (Buffer.isBuffer(data)) {
    text = data.toString(LONG_TRACE_TEXT_ENCODING_UTF8);
  } else if (data instanceof ArrayBuffer) {
    text = Buffer.from(data).toString(LONG_TRACE_TEXT_ENCODING_UTF8);
  } else {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return undefined;
  }
}

module.exports = {
  cleanupLongTraceSession,
  createLongTraceSessionState,
  decodeTextMessage,
  sendBinaryInChunks,
  sendJsonFrame,
};
