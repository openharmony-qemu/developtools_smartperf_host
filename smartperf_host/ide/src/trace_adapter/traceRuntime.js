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

const {
  cleanupLongTraceSession,
  createLongTraceSessionState,
  decodeTextMessage,
  sendJsonFrame,
} = require('./traceCommunication.js');
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
  LONG_TRACE_RESULT_REASON_TRACE_END_WITHOUT_META,
  LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED,
  LONG_TRACE_RESULT_STATUS_ERROR,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
} = require('./traceConstants.js');
/*
 * 创建 longtrace 运行时单例。
 * 运行时中维护所有会话的状态机、待处理队列和连接处理逻辑。
 * @param {object} options - 运行时配置选项。
 * @param {function} options.logger - 日志记录函数，用于记录运行时事件。
 * @param {function} options.onProcessFile - 处理文件回调函数，用于处理接收到的文件数据。
 * @param {function} options.onUploadComplete - 上传完成回调函数，用于处理上传完成事件。
 * @param {number} options.prefetchLimit - 预取限制，用于限制同时处理的文件数量。
 * @param {number} options.sessionBindTimeoutMs - 会话绑定超时时间，用于设置会话绑定超时时间。
 * @param {number} options.sessionIdleTimeoutMs - 会话空闲超时时间，用于设置会话空闲超时时间。
 * @returns {object} longtrace 运行时对象。
 */
function createLongTraceRuntime(options) {
  const sessionStore = new Map();

  /**
   * 每次收到有效数据后刷新空闲超时，避免僵尸会话长期占用内存与连接资源。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @returns {void}
   */
  const resetIdleTimer = (sessionId) => {
    const session = sessionStore.get(sessionId);
    if (!session) {
      return;
    }
    try {
      if (session.idleTimer) {
        clearTimeout(session.idleTimer);
      }
    } catch (e) {}
    session.idleTimer = setTimeout(
      () => cleanupLongTraceSession(sessionStore, sessionId),
      options.sessionIdleTimeoutMs
    );
  };

  /**
   * 统一封装结果帧发送逻辑，降低各分支对协议细节的重复拼接。
   * @param {object} session - 会话上下文，包含下载通道。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @param {number} n - 文件 n，用于标识当前文件。
   * @param {string} fileName - 文件名，用于标识当前文件。
   * @param {string} status - 状态，用于标识当前文件处理结果。
   * @param {boolean} hasPatchPayload - 是否有补丁 payload，用于标识当前文件是否有补丁。
   * @param {string} reason - 错误原因，用于标识当前文件处理结果。
   * @returns {void}
   */
  const sendResult = (session, sessionId, n, fileName, status, hasPatchPayload, reason) => {
    sendJsonFrame(session.downloadWs, {
      type: LONG_TRACE_MESSAGE_TYPE_RESULT,
      sessionId,
      n,
      fileName,
      status,
      hasPatchPayload,
      reason,
    });
  };

  /**
   * 当上传和下载两条通道都准备完成后，切换会话状态为已绑定。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @returns {void}
   */
  const tryBindSession = (sessionId) => {
    // 获取会话上下文。
    const session = sessionStore.get(sessionId);
    if (!session || session.bound || !session.uploadWs || !session.downloadWs) {
      return;
    }
    // 标记会话为已绑定。
    session.bound = true;
    try {
      if (session.bindTimer) {
        clearTimeout(session.bindTimer);
      }
    } catch (e) {}
    // 发送会话绑定结果帧。
    sendResult(session, sessionId, 0, '', LONG_TRACE_RESULT_STATUS_NO_PATCH, false, LONG_TRACE_RESULT_REASON_SESSION_BOUND);
    // 刷新空闲超时，避免会话长期占用内存与连接资源。
    resetIdleTimer(sessionId);
  };

  /**
   * 顺序校验失败时，当前文件以及队列中未处理文件都需要同步回错误结果。
   * @param {object} session - 会话上下文，包含待处理文件队列。
   * @param {object} firstFileItem - 第一个文件项，包含文件 n 和文件名。
   * @param {string} reason - 错误原因，用于标识失败类型。
   * @returns {void}
   */
  const failPendingFiles = (session, firstFileItem, reason) => {
    // 发送第一个文件的错误结果帧。
    sendResult(session, session.sessionId, firstFileItem.n, firstFileItem.fileName, 'ERROR', false, reason);
    // 遍历队列，发送其他文件的错误结果帧。
    while (session.pendingQueue.length > 0) {
      const pendingFileItem = session.pendingQueue.shift();
      if (!pendingFileItem) {
        break;
      }
      sendResult(session, session.sessionId, pendingFileItem.n, pendingFileItem.fileName, 'ERROR', false, reason);
    }
  };

  /*
   * 串行消费待处理文件队列，确保补丁上下文严格按照页序推进。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @returns {void}
   */
  const processQueue = async (sessionId) => {
    // session.processing 用于防止重复处理，避免死循环。
    const session = sessionStore.get(sessionId);
    if (!session || session.processing) {
      return;
    }
    session.processing = true;
    try {
      // pendingQueue 用于维护待处理文件队列，按序处理文件，确保补丁上下文严格按照页序推进。
      while (session.pendingQueue.length > 0) {
        // 从队列头取文件，按序处理。
        const fileItem = session.pendingQueue.shift();
        if (!fileItem) {
          break;
        }
        // session.nextN === undefined 时，说明是第一个文件，直接赋值给 nextN。
        if (session.nextN === undefined) {
          session.nextN = fileItem.n;
          session.minN = fileItem.n;
        }
        // session.noPatchDone 用于记录已处理的无补丁文件，避免重复处理。
        // 例如，当文件 n=1 无补丁时，记录 n=1 到 session.noPatchDone 中，后续处理 n=2 时，直接跳过。
        while (session.noPatchDone && session.noPatchDone.has(session.nextN)) {
          session.nextN += 1;
        }
        // 当前文件 n 与 nextN 不匹配，说明顺序校验失败，直接失败。
        if (fileItem.n !== session.nextN) {
          failPendingFiles(session, fileItem, LONG_TRACE_RESULT_REASON_SEQUENCE_MISMATCH);
          break;
        }
        // 处理文件，更新 nextN。
        await options.onProcessFile({
          fileItem,
          resetIdleTimer,
          sendResult,
          session,
          sessionId,
        });
        session.nextN += 1;
        while (session.noPatchDone && session.noPatchDone.has(session.nextN)) {
          session.nextN += 1;
        }
        // 每次处理文件后，刷新空闲超时，避免僵尸会话长期占用内存与连接资源。
        resetIdleTimer(sessionId);
      }
    } catch (e) {
      options.logger.error(`longtrace preprocess failed: session=${sessionId}, err=${String(e)}`);
    } finally {
      session.processing = false;
    }
  };

  /**
   * 将上传完成的文件放入待处理队列，并立即触发按序消费。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @param {Object} fileItem - 文件项，包含文件 n、文件名等信息。
   * @returns {void}
   */
  const enqueuePendingFile = (sessionId, fileItem) => {
    const session = sessionStore.get(sessionId);
    if (!session) {
      return;
    }
    session.pendingQueue.push(fileItem);
    processQueue(sessionId);
  };

  /**
   * 处理 HELLO 握手消息，登记连接角色并尝试完成双通道绑定。
   * @param {WebSocket} ws - 目标 WebSocket 连接。
   * @param {Object} msg - HELLO 消息，包含会话 ID、通道类型等信息。
   * @returns {void}
   */
  const handleHello = (ws, msg) => {
    const sessionId = msg.sessionId;
    ws._longTraceSessionId = sessionId;
    ws._longTraceChannel = msg.channel;
    // 检查会话是否存在，不存在则创建。
    if (!sessionStore.has(sessionId)) {
      const bindTimer = setTimeout(
        () => cleanupLongTraceSession(sessionStore, sessionId),
        options.sessionBindTimeoutMs
      );
      sessionStore.set(sessionId, createLongTraceSessionState(sessionId, bindTimer));
    }
    // 获取会话上下文。
    const session = sessionStore.get(sessionId);
    if (!session) {
      return;
    }
    // 登记连接角色。
    if (msg.channel === LONG_TRACE_CHANNEL_UPLOAD) {
      session.uploadWs = ws;
    } else {
      session.downloadWs = ws;
    }
    tryBindSession(sessionId);
  };

  /**
   * 记录单个上传中的文件元信息，后续二进制帧统一追加到 inflight。
   * @param {Object} session - 会话上下文，包含当前上传中的文件元信息。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @param {Object} msg - TRACE_META 消息，包含文件 n、文件名等信息。
   * @returns {void}
   */
  const handleTraceMeta = (session, sessionId, msg) => {
    // 检查是否有正在上传的文件，有则返回错误。
    if (session.inflight) {
      sendResult(session, sessionId, msg.n, msg.fileName, LONG_TRACE_RESULT_STATUS_ERROR, false, LONG_TRACE_RESULT_REASON_INFLIGHT_EXISTS);
      return;
    }
    // 检查是否有正在处理的文件并且队列已满，有则返回错误。
    if (session.processing && session.pendingQueue.length >= options.prefetchLimit) {
      sendResult(session, sessionId, msg.n, msg.fileName, LONG_TRACE_RESULT_STATUS_ERROR, false, LONG_TRACE_RESULT_REASON_PREFETCH_LIMIT);
      return;
    }
    // 记录文件元信息，等待后续二进制帧到达。
    session.inflight = { n: Number(msg.n), fileName: String(msg.fileName || ''), chunks: [], totalBytes: 0 };
  };

  /**
   * 在 TRACE_END 到达时拼接已缓存分片，并把完整文件交给业务层继续判断。
   * @param {Object} session - 会话上下文，包含当前上传中的文件元信息。
   * @param {string} sessionId - 会话 ID，用于标识当前会话。
   * @param {Object} msg - TRACE_END 消息，包含文件 n、文件名等信息。
   * @returns {void}
   */
  const handleTraceEnd = (session, sessionId, msg) => {
    // 检查是否有正在上传的文件，没有则返回错误。
    if (!session.inflight) {
      sendResult(
        session,
        sessionId,
        Number(msg.n),
        String(msg.fileName || ''),
        LONG_TRACE_RESULT_STATUS_ERROR,
        false,
        LONG_TRACE_RESULT_REASON_TRACE_END_WITHOUT_META
      );
      return;
    }
    const inflight = session.inflight;
    session.inflight = undefined;
    // 拼接已缓存分片，合并为完整文件。
    const bytes = Buffer.concat(inflight.chunks, inflight.totalBytes);
    inflight.chunks.length = 0;
    // 调用业务层处理上传完成的文件。
    options.onUploadComplete({
      bytes,
      enqueuePendingFile,
      sendResult,
      session,
      sessionId,
      uploadedFile: {
        fileName: inflight.fileName,
        n: inflight.n,
      },
    });
  };

  /**
   * 为单个 WebSocket 连接注册消息、关闭与错误处理逻辑。
   * @param {WebSocket} ws - 目标 WebSocket 连接。
   */
  const handleConnection = (ws) => {
    ws.binaryType = 'arraybuffer';
    /**
     * 处理 WebSocket 迶�息事件，根据消息类型分发给对应的处理函数。
     * @param {string|Buffer|ArrayBuffer} data - 待解码的消息数据。
     * @param {boolean} isBinary - 是否为二进制消息。
     * @returns {void}
     */
    ws.on('message', (data, isBinary) => {
      // 如果是二进制消息，且是上传通道，且有正在上传的文件，才处理。
      if (isBinary) {
        if (ws._longTraceSessionId && ws._longTraceChannel === LONG_TRACE_CHANNEL_UPLOAD) {
          const session = sessionStore.get(ws._longTraceSessionId);
          if (session && session.inflight) {
            // 接受上传通道的二进制数据，追加到 inflight 文件。
            const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data);
            session.inflight.chunks.push(Buffer.from(bufferData));
            session.inflight.totalBytes += bufferData.byteLength;
            resetIdleTimer(ws._longTraceSessionId);
          }
        }
        return;
      }
      // 如果不是二进制消息，尝试解码为文本消息。
      const msg = decodeTextMessage(data);
      if (!msg || typeof msg !== 'object') {
        return;
      }
      // 如果是 HELLO 消息，且会话 ID 与通道类型匹配，才处理。
      if (
        msg.type === LONG_TRACE_MESSAGE_TYPE_HELLO &&
        typeof msg.sessionId === 'string' &&
        (msg.channel === LONG_TRACE_CHANNEL_UPLOAD || msg.channel === LONG_TRACE_CHANNEL_DOWNLOAD)
      ) {
        handleHello(ws, msg);
        return;
      }
      if (!ws._longTraceSessionId) {
        return;
      }
      const sessionId = ws._longTraceSessionId;
      const session = sessionStore.get(sessionId);
      if (!session || !session.bound) {
        return;
      }
      resetIdleTimer(sessionId);
      // 下载通道只负责接收服务端回包，因此后续控制消息只在上传通道处理。
      if (ws._longTraceChannel !== LONG_TRACE_CHANNEL_UPLOAD) {
        return;
      }
      // 处理 TRACE_META 消息，记录文件元信息。
      if (msg.type === LONG_TRACE_MESSAGE_TYPE_TRACE_META) {
        handleTraceMeta(session, sessionId, msg);
        return;
      }
      // 处理 TRACE_END 消息，拼接已缓存分片，并把完整文件交给业务层继续判断。
      if (msg.type === LONG_TRACE_MESSAGE_TYPE_TRACE_END) {
        handleTraceEnd(session, sessionId, msg);
      }
    });

    /**
     * 处理 WebSocket 连接关闭事件，根据会话状态判断是否需要通知前端。
     * @returns {void}
     */
    ws.on('close', () => {
      const sessionId = ws._longTraceSessionId;
      if (!sessionId) {
        return;
      }
      const session = sessionStore.get(sessionId);
      // 上传通道在文件尚未结束时关闭，需要明确通知前端本页处理失败。
      if (ws._longTraceChannel === LONG_TRACE_CHANNEL_UPLOAD && session?.bound && session.inflight) {
        sendResult(
          session,
          sessionId,
          session.inflight.n,
          session.inflight.fileName,
          LONG_TRACE_RESULT_STATUS_ERROR,
          false,
          LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED
        );
        session.inflight = undefined;
      }
      cleanupLongTraceSession(sessionStore, sessionId);
    });

    /**
     * 处理 WebSocket 连接错误事件，根据会话状态判断是否需要通知前端。
     * @returns {void}
     */
    ws.on('error', () => {
      const sessionId = ws._longTraceSessionId;
      if (!sessionId) {
        return;
      }
      cleanupLongTraceSession(sessionStore, sessionId);
    });
  };

  /**
   * 停止运行时时遍历所有会话，确保连接和定时器都被及时回收。
   */
  const stop = () => {
    for (const sessionId of sessionStore.keys()) {
      cleanupLongTraceSession(sessionStore, sessionId);
    }
  };

  return {
    handleConnection,
    sessionStore,
    stop,
  };
}

module.exports = {
  createLongTraceRuntime,
};
