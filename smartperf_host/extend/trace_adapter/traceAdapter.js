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

const winston = require('winston');
const { sendBinaryInChunks, sendJsonFrame } = require('./traceCommunication.js');
const { createTraceBusinessHandlers } = require('./traceBusinessHandlers.js');
const {
  LONG_TRACE_PATCH_CHUNK_SIZE_BYTES,
  LONG_TRACE_PREFETCH_LIMIT,
  LONG_TRACE_SESSION_BIND_TIMEOUT_MS,
  LONG_TRACE_SESSION_IDLE_TIMEOUT_MS,
} = require('./traceConstants.js');
const { createNativeHookProcessor } = require('./traceNativeHookProcessor.js');
const { createLongTraceRuntime } = require('./traceRuntime.js');

// 统一使用项目级日志配置，保证 longtrace 运行时日志格式与主服务一致。
const logger = winston.createLogger(require('../winston.config.js'));
// NativeHook 处理器封装了 protobuf 解码、公共事件提取和补丁构造逻辑。
const nativeHookProcessor = createNativeHookProcessor();
// 业务处理器负责把运行时回调与 NativeHook 处理逻辑组合起来。
const traceBusinessHandlers = createTraceBusinessHandlers({
  nativeHookProcessor,
  patchChunkSizeBytes: LONG_TRACE_PATCH_CHUNK_SIZE_BYTES,
  sendBinaryInChunks,
  sendJsonFrame,
});
let longTraceRuntime;

/**
 * 初始化 longtrace 子系统，提前构造运行时单例以接收主服务分流连接。
 */
function init() {
  getLongTraceRuntime();
}

/**
 * 停止 longtrace 子系统并释放已建立的双通道会话。
 */
function stop() {
  if (longTraceRuntime?.stop) {
    longTraceRuntime.stop();
  }
  longTraceRuntime = undefined;
}

/**
 * 获取 longtrace 运行时单例。
 * 运行时中维护所有会话的状态机、待处理队列和连接处理逻辑。
 * @returns {{sessionStore: Map<string, object>, handleConnection: (ws: WebSocket) => void}} longtrace 运行时对象。
 */
function getLongTraceRuntime() {
  if (longTraceRuntime) {
    return longTraceRuntime;
  }
  longTraceRuntime = createLongTraceRuntime({
    logger,
    onProcessFile: traceBusinessHandlers.onProcessFile,
    onUploadComplete: traceBusinessHandlers.onUploadComplete,
    prefetchLimit: LONG_TRACE_PREFETCH_LIMIT,
    sessionBindTimeoutMs: LONG_TRACE_SESSION_BIND_TIMEOUT_MS,
    sessionIdleTimeoutMs: LONG_TRACE_SESSION_IDLE_TIMEOUT_MS,
  });
  return longTraceRuntime;
}

/**
 * 处理来自主 19099 入口分流过来的 longtrace 连接。
 * @param {WebSocket} ws - 已由主服务分流过来的 WebSocket 连接。
 * @returns {void} 无返回值。
 */
function handleLongTraceConnection(ws) {
  const runtime = getLongTraceRuntime();
  runtime.handleConnection(ws);
}

module.exports = { init, stop, handleLongTraceConnection };
