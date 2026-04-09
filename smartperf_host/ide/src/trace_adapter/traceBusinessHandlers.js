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
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_RESULT_REASON_MIN_N,
  LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK,
  LONG_TRACE_RESULT_REASON_PATCH_BUFFER_EMPTY,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
  LONG_TRACE_RESULT_STATUS_PATCH_READY,
} = require('./traceConstants.js');

/**
 * 业务处理器把运行时回调与 NativeHook 提取逻辑解耦，便于独立测试和复用。
 * @param {object} options - 业务处理器选项。
 * @param {object} options.nativeHookProcessor - NativeHook 处理器实例。
 * @param {number} options.patchChunkSizeBytes - 补丁分块大小。
 * @param {function} options.sendBinaryInChunks - 发送二进制数据分块的回调函数。
 * @param {function} options.sendJsonFrame - 发送 JSON 帧的回调函数。
 * @returns {object} - 业务处理器对象。
 */
function createTraceBusinessHandlers(options) {
  const { nativeHookProcessor, patchChunkSizeBytes, sendBinaryInChunks, sendJsonFrame } = options;

  /**
   * 按页处理已过滤的 trace 数据，必要时生成补丁并回传给前端下载通道。
   * @param {object} fileItem - 当前页 trace 数据项。
   * @param {function} sendResult - 回传结果帧的回调函数。
   * @param {object} session - 会话上下文。
   */
  const onProcessFile = async ({ fileItem, sendResult, session }) => {
    // 仅有 header 或完全无字节数据时，说明当前页没有可用于补丁的 nativehook 内容。
    if (!fileItem.bytes || fileItem.bytes.byteLength <= nativeHookProcessor.headerSizeBytes) {
      // 发送无补丁结果帧
      sendResult(
        session,
        session.sessionId,
        fileItem.n,
        fileItem.fileName,
        LONG_TRACE_RESULT_STATUS_NO_PATCH,
        false,
        LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK
      );
      return;
    }
    // 找不到最早时间戳时，说明当前页没有 nativehook 内容，不需要生成补丁。
    const nativehookTs = nativeHookProcessor.findEarliestNativehookTimestamp(fileItem.bytes);
    // 发送无补丁结果帧
    if (!nativehookTs) {
      sendResult(
        session,
        session.sessionId,
        fileItem.n,
        fileItem.fileName,
        LONG_TRACE_RESULT_STATUS_NO_PATCH,
        false,
        LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK
      );
      return;
    }
    // 生成补丁 payload
    let patchPayload = Buffer.alloc(0);
    const isMinN = fileItem.n === session.minN;
    // 非基线页且有公共事件时，尝试生成补丁 payload。 基线页不需要补丁，只负责初始化 patchEvents。
    if (!isMinN && Array.isArray(session.patchEvents) && session.patchEvents.length > 0) {
      patchPayload = nativeHookProcessor.buildNativehookPatchPayload(
        session.patchEvents,
        nativehookTs.clockId,
        nativehookTs.tvSec,
        nativehookTs.tvNsec
      );
    }
    // 将上一页的 patchPayload 插入文件头之后、原始数据段之前，再整体提取，使 mergeStatistics 跨页去重生效。
    const extractSource = patchPayload.byteLength > 0
      ? Buffer.concat([
          fileItem.bytes.subarray(0, LONG_TRACE_HEADER_SIZE_BYTES),
          patchPayload,
          fileItem.bytes.subarray(LONG_TRACE_HEADER_SIZE_BYTES),
        ])
      : fileItem.bytes;
    const extracted = nativeHookProcessor.extractCommonEvents(extractSource);
    // 用合并后提取的公共事件替换会话上下文，仅向下一页传递当前页的补丁上下文。
    if (extracted.length > 0) {
      session.patchEvents = extracted;
    }
    if (isMinN || patchPayload.byteLength <= 0) {
      const reason = isMinN ? LONG_TRACE_RESULT_REASON_MIN_N : LONG_TRACE_RESULT_REASON_PATCH_BUFFER_EMPTY;
      sendResult(session, session.sessionId, fileItem.n, fileItem.fileName, LONG_TRACE_RESULT_STATUS_NO_PATCH, false, reason);
      return;
    }
    // PATCH_READY 先发送结果帧，再下发补丁二进制和结束标记。
    sendResult(session, session.sessionId, fileItem.n, fileItem.fileName, LONG_TRACE_RESULT_STATUS_PATCH_READY, true);
    sendBinaryInChunks(session.downloadWs, patchPayload, patchChunkSizeBytes);
    sendJsonFrame(session.downloadWs, {
      type: LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
      sessionId: session.sessionId,
      n: fileItem.n,
      fileName: fileItem.fileName,
    });
  };

  /**
   * 上传完成后做快速分流：无 nativehook 直接回包，有 nativehook 才进入顺序处理队列。
   * @param {Buffer} bytes - 上传的 trace 数据。
   * @param {function} enqueuePendingFile - 进入顺序处理队列的回调函数。
   * @param {function} sendResult - 回传结果帧的回调函数。
   * @param {object} session - 会话上下文。
   * @param {string} sessionId - 会话 ID。
   * @param {object} uploadedFile - 上传的文件信息。
   */
  const onUploadComplete = ({ bytes, enqueuePendingFile, sendResult, session, sessionId, uploadedFile }) => {
    const likelyHasNativehook = nativeHookProcessor.hasNativehookFast(bytes);
    let filteredBytes = null;
    if (likelyHasNativehook) {
      // 先裁剪掉无关插件段，减少后续排队文件的内存占用。
      filteredBytes = nativeHookProcessor.filterNativeHookSegments(bytes);
    }
    // 无 nativehook 或仅 header 时，直接回包。
    if (!likelyHasNativehook || (filteredBytes && filteredBytes.byteLength <= nativeHookProcessor.headerSizeBytes)) {
      // 回包无补丁结果。
      sendResult(
        session,
        sessionId,
        uploadedFile.n,
        uploadedFile.fileName,
        LONG_TRACE_RESULT_STATUS_NO_PATCH,
        false,
        LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK
      );
      try {
        // 记录已快速完成的页号，避免顺序消费时把这些页误判为断号。
        session.noPatchDone.add(uploadedFile.n);
      } catch (e) {}
      return;
    }
    // 需要补丁计算的文件统一进入运行时队列，按页序串行处理。
    enqueuePendingFile(sessionId, {
      n: uploadedFile.n,
      fileName: uploadedFile.fileName,
      bytes: filteredBytes,
    });
  };

  return {
    onProcessFile,
    onUploadComplete,
  };
}

module.exports = {
  createTraceBusinessHandlers,
};
