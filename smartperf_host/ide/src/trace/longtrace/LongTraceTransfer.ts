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

import { Constants } from '../../webSocket/Constants';
import { parseSequenceNumber } from './LongTraceFilter';
import {
  buildLongTraceProgressMessage,
  LONG_TRACE_CHANNEL_DOWNLOAD,
  LONG_TRACE_CHANNEL_UPLOAD,
  LONG_TRACE_CLOSE_WAIT_MS,
  LONG_TRACE_FALLBACK_PATH,
  LONG_TRACE_MESSAGE_TYPE_HELLO,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_MESSAGE_TYPE_RESULT,
  LONG_TRACE_MESSAGE_TYPE_TRACE_END,
  LONG_TRACE_MESSAGE_TYPE_TRACE_META,
  LONG_TRACE_PREFETCH_LIMIT,
  LONG_TRACE_REASON_SESSION_BOUND,
  LONG_TRACE_SESSION_BIND_TIMEOUT_MS,
  LONG_TRACE_STATUS_PATCH_READY,
  LONG_TRACE_UPLOAD_CHUNK_SIZE_BYTES,
  type LongTraceChannel,
  type LongTracePreprocessStatus,
} from './LongTraceConstants';

/**
 * 建立双通道时，客户端向服务端发送的握手消息
 * 用于声明会话 ID 与通道角色（上传/下载）
 */
interface LongTraceHelloMessage {
  type: typeof LONG_TRACE_MESSAGE_TYPE_HELLO;
  // 本次会话唯一标识，用于服务端绑定上下行通道
  sessionId: string;
  // 通道角色：UPLOAD 为上传通道，DOWNLOAD 为下载通道
  channel: LongTraceChannel;
}

/**
 * 上传文件元数据消息
 * 在正式传输二进制分片前，先发送该消息告知服务端文件信息
 */
interface LongTraceTraceMetaMessage {
  type: typeof LONG_TRACE_MESSAGE_TYPE_TRACE_META;
  // 所属会话 ID
  sessionId: string;
  // 文件序号，用于排序与结果匹配
  n: number;
  // 原始文件名
  fileName: string;
  // 是否为当前会话最后一个文件，用于服务端做整体收尾
  isLast: boolean;
}

/**
 * 单个文件上传结束标记
 * 所有分片发送完成后，发送此消息通知服务端进行后续预处理
 */
interface LongTraceTraceEndMessage {
  type: typeof LONG_TRACE_MESSAGE_TYPE_TRACE_END;
  sessionId: string;
  n: number;
  fileName: string;
}

/**
 * 服务端返回的预处理结果
 * 包含处理状态及是否需要继续接收补丁数据
 */
interface LongTraceResultMessage {
  type: typeof LONG_TRACE_MESSAGE_TYPE_RESULT;
  sessionId: string;
  n: number;
  fileName: string;
  // 预处理状态：无补丁/补丁就绪/错误
  status: LongTracePreprocessStatus;
  // 是否携带补丁数据，若为 true，客户端需继续接收二进制分片
  hasPatchPayload: boolean;
  // 可选原因，如 SESSION_BOUND、错误描述等
  reason?: string;
}

/**
 * 补丁数据发送结束标记
 * 服务端完成补丁二进制流推送后发送，用于客户端合并分片并回调结果
 */
interface LongTracePatchPayloadEndMessage {
  type: typeof LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END;
  sessionId: string;
  n: number;
  fileName: string;
}

/**
 * 暴露给业务方的单文件预处理结果
 */
export interface LongTracePreprocessResult {
  // 文件序号
  n: number;
  // 文件名
  fileName: string;
  // 预处理状态
  status: LongTracePreprocessStatus;
  // 补丁二进制数据，仅当 status 为 PATCH_READY 时存在
  patchPayload?: Uint8Array;
  // 附加描述，如错误原因
  reason?: string;
}

/**
 * 进度回调数据结构
 */
export interface LongTracePreprocessProgress {
  // 已完成文件数
  done: number;
  // 总文件数
  total: number;
  // 进度描述
  message: string;
}

/**
 * 上传与预处理配置项
 */
export interface LongTraceTransferOptions {
  // 二进制分片大小，默认 4MB
  uploadChunkSizeBytes?: number;
  // 双通道绑定超时时间，默认 5s
  bindTimeoutMs?: number;
  // 进度回调，用于 UI 刷新
  onProgress?: (progress: LongTracePreprocessProgress) => void;
  // 单文件结果回调，用于业务处理补丁或错误
  onResult?: (result: LongTracePreprocessResult) => void;
}

/**
 * 内部使用的已解析传输配置接口
 * 所有可选字段都已赋予默认值，确保后续逻辑无需再次判空
 */
type LongTraceResolvedTransferOptions = Required<
  Pick<LongTraceTransferOptions, 'uploadChunkSizeBytes' | 'bindTimeoutMs'>
> &
  Pick<LongTraceTransferOptions, 'onProgress' | 'onResult'>;

/**
 * 一次完整传输会话的上下文
 * 包含会话 ID、双通道 WebSocket 及已按序号排序的文件列表
 */
interface LongTraceTransferSession {
  // 全局唯一会话标识，用于服务端绑定上下行通道
  sessionId: string;
  // 上传通道 WebSocket，用于发送文件元数据及二进制分片
  uploadWs: WebSocket;
  // 下载通道 WebSocket，用于接收预处理结果及补丁数据
  downloadWs: WebSocket;
  // 按文件名序号升序排列后的文件列表
  sequenceSortedFiles: File[];
  // 待处理文件总数
  total: number;
}

/**
 * 补丁数据累加器
 * 用于在下载通道接收服务端回传的补丁二进制分片
 */
interface LongTracePatchAccumulator {
  // 文件序号，与上传时的序号保持一致
  n: number;
  // 原始文件名，用于结果回调时透传
  fileName: string;
  // 已接收的二进制分片数组
  chunks: Uint8Array[];
  // 已接收的总字节数，用于最终合并时预分配缓冲区
  totalBytes: number;
}

/**
 * 传输过程中的可变状态
 * 用于跟踪已完成数量、通道绑定状态、补丁接收进度及结果等待队列
 */
interface LongTraceTransferState {
  // 已完成预处理的文件数量
  done: number;
  // 上传/下载双通道是否已完成绑定
  bound: boolean;
  // 当前正在接收的补丁数据累加器，若无则为 undefined
  currentPatch?: LongTracePatchAccumulator;
  // 已收到 RESULT 消息的最大文件序号，用于流量控制
  lastResultIndex: number;
  /**
   * 等待结果推进的回调队列
   * 当 RESULT 消息到达时，依次调用以唤醒等待协程
   */
  resultAdvanceWaiters: Array<() => void>;
}

/**
 * 生成全局唯一会话 ID
 * 优先使用 crypto.randomUUID，降级采用时间戳+随机数
 */
function createSessionId(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * 创建 WebSocket 实例，统一设置 binaryType 为 arraybuffer
 */
function createWebSocket(url: string): WebSocket {
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';
  return ws;
}

/**
 * 等待 WebSocket 连接成功
 * 若已打开则立即 resolve，否则监听 open/error 事件
 */
function waitForOpen(ws: WebSocket): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    return Promise.reject(new Error('WebSocket already closed'));
  }
  return new Promise((resolve, reject) => {
    const onOpen = (): void => {
      cleanup();
      resolve();
    };
    const onFail = (): void => {
      cleanup();
      reject(new Error('WebSocket connection failed'));
    };
    const cleanup = (): void => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', onFail);
      ws.removeEventListener('close', onFail);
    };
    ws.addEventListener('open', onOpen);
    ws.addEventListener('error', onFail);
    ws.addEventListener('close', onFail);
  });
}

/**
 * 为 Promise 设置超时控制
 * @param promise 原始 Promise
 * @param timeoutMs 超时毫秒数
 * @param errorMessage 超时错误文案
 * @returns 新 Promise，超时则 reject
 */
function waitWithTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    promise
      .then((v) => {
        window.clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        window.clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * 长trace文件上传与预处理管理类
 * 通过 WebSocket 双通道（上传/下载）与扩展服务交互，实现后台批量预处理
 */
export class LongTraceTransfer {
  // WebSocket 连接地址
  private readonly wsUrl: string;

  /**
   * 构造函数
   * @param wsUrl 自定义 WebSocket 地址；留空时使用默认本地地址
   */
  constructor(wsUrl: string = `ws://localhost:${Constants.NODE_PORT}${LONG_TRACE_FALLBACK_PATH}`) {
    this.wsUrl = wsUrl;
  }

  /**
   * 处理服务端下发的 RESULT 消息
   * - 若为 SESSION_BOUND 通知，则标记通道已绑定
   * - 若无补丁数据，直接回调业务并更新进度
   * - 若需补丁，初始化 currentPatch 缓存结构，等待后续二进制流
   */
  private handleResultMessage(
    msg: LongTraceResultMessage,
    session: LongTraceTransferSession,
    state: LongTraceTransferState,
    options: LongTraceResolvedTransferOptions
  ): void {
    // 如果是会话绑定通知（n=0 且 reason 为 SESSION_BOUND），则标记通道已绑定并直接返回
    if (msg.n === 0 && msg.reason === LONG_TRACE_REASON_SESSION_BOUND) {
      state.bound = true;
      return;
    }
    // 根据消息中的序号 n 查找对应文件在排序后文件列表中的索引
    const resultIndex = session.sequenceSortedFiles.findIndex((file) => parseSequenceNumber(file.name) === msg.n);
    if (resultIndex >= 0) {
      // 更新已处理的最大结果索引，用于流量控制
      state.lastResultIndex = Math.max(state.lastResultIndex, resultIndex);
      // 唤醒所有等待结果推进的协程
      while (state.resultAdvanceWaiters.length > 0) {
        state.resultAdvanceWaiters.shift()?.();
      }
    }
    // 如果服务端返回无需补丁数据，则直接回调业务方并更新进度
    if (!msg.hasPatchPayload) {
      state.done += 1;
      options.onResult?.({ n: msg.n, fileName: msg.fileName, status: msg.status, reason: msg.reason });
      options.onProgress?.({
        done: state.done,
        total: session.total,
        message: buildLongTraceProgressMessage(state.done, session.total),
      });
      return;
    }
    // 需要补丁数据时，初始化补丁累加器，等待后续二进制流
    state.currentPatch = { n: msg.n, fileName: msg.fileName, chunks: [], totalBytes: 0 };
  }

  /**
   * 处理服务端补丁流结束标记 PATCH_PAYLOAD_END
   * 合并所有分片，回调业务结果，并清理 currentPatch
   */
  private handlePatchPayloadEnd(
    msg: LongTracePatchPayloadEndMessage,
    session: LongTraceTransferSession,
    state: LongTraceTransferState,
    options: LongTraceResolvedTransferOptions
  ): void {
    // 若当前没有补丁累加器，或序号不匹配，则忽略该结束标记
    if (!state.currentPatch || state.currentPatch.n !== msg.n) {
      return;
    }
    // 预分配总长度等于已接收字节数的 Uint8Array，用于一次性合并所有分片
    const payload = new Uint8Array(state.currentPatch.totalBytes);
    let offset = 0;
    // 依次将每个分片拷贝到最终缓冲区，offset 持续后移
    for (const chunk of state.currentPatch.chunks) {
      payload.set(chunk, offset);
      offset += chunk.byteLength;
    }
    // 已完成文件数 +1
    state.done += 1;
    // 回调业务方，携带合并后的完整补丁数据
    options.onResult?.({
      n: state.currentPatch.n,
      fileName: state.currentPatch.fileName,
      status: LONG_TRACE_STATUS_PATCH_READY,
      patchPayload: payload,
    });
    // 清空当前补丁累加器，释放内存
    state.currentPatch = undefined;
    // 更新进度回调，提示当前完成进度
    options.onProgress?.({
      done: state.done,
      total: session.total,
      message: buildLongTraceProgressMessage(state.done, session.total),
    });
    // 唤醒所有等待结果推进的协程，允许后续文件继续上传
    while (state.resultAdvanceWaiters.length > 0) {
      state.resultAdvanceWaiters.shift()?.();
    }
  }

  /**
   * 为下载 WebSocket 注册统一消息入口
   * 字符串走文本解析分支，ArrayBuffer 走二进制补丁分支
   */
  private registerDownloadMessageHandler(
    session: LongTraceTransferSession,
    state: LongTraceTransferState,
    options: LongTraceResolvedTransferOptions
  ): void {
    // 监听下载通道的所有消息事件
    session.downloadWs.addEventListener('message', (ev: MessageEvent) => {
      // 文本消息分支：解析 JSON 并分发到对应处理器
      if (typeof ev.data === 'string') {
        let msg: { type?: string } | undefined;
        try {
          // 尝试将文本解析为 JSON，失败则置空
          msg = JSON.parse(ev.data) as { type?: string } | undefined;
        } catch (e) {
          msg = undefined;
        }
        // 若为 RESULT 消息，调用对应处理函数
        if (msg?.type === LONG_TRACE_MESSAGE_TYPE_RESULT) {
          this.handleResultMessage(msg as LongTraceResultMessage, session, state, options);
          return;
        }
        // 若为补丁结束标记，调用对应处理函数
        if (msg?.type === LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END) {
          this.handlePatchPayloadEnd(msg as LongTracePatchPayloadEndMessage, session, state, options);
        }
        return;
      }

      // 二进制消息分支：仅当存在当前补丁累加器时才接收分片
      if (!(ev.data instanceof ArrayBuffer) || !state.currentPatch) {
        return;
      }
      // 将 ArrayBuffer 转为 Uint8Array 并追加到累加器
      const chunk = new Uint8Array(ev.data);
      state.currentPatch.chunks.push(chunk);
      state.currentPatch.totalBytes += chunk.byteLength;
    });
  }

  /**
   * 构造一个 Promise，在收到 SESSION_BOUND 结果时 resolve
   * 若通道提前关闭或出错则 reject，确保绑定阶段超时可控
   */
  private createBindReadyPromise(downloadWs: WebSocket, state: LongTraceTransferState): Promise<void> {
    return new Promise((resolve, reject) => {
      // 清理函数：移除所有已注册的事件监听，防止内存泄漏
      const cleanup = (): void => {
        downloadWs.removeEventListener('message', onDownloadMessage);
        downloadWs.removeEventListener('close', onClose);
        downloadWs.removeEventListener('error', onClose);
      };
      // 下载通道消息处理：仅处理文本消息，解析为 RESULT 并检查 SESSION_BOUND
      const onDownloadMessage = (ev: MessageEvent): void => {
        if (typeof ev.data !== 'string') {
          return;
        }
        let result: Partial<LongTraceResultMessage> | undefined;
        try {
          result = JSON.parse(ev.data) as Partial<LongTraceResultMessage> | undefined;
        } catch (e) {
          result = undefined;
        }
        // 收到 SESSION_BOUND 标识绑定成功，更新状态并 resolve
        if (result?.type === LONG_TRACE_MESSAGE_TYPE_RESULT && result.reason === LONG_TRACE_REASON_SESSION_BOUND) {
          state.bound = true;
          cleanup();
          resolve();
        }
      };
      // 通道关闭/错误处理：统一 reject，提示扩展服务通道已断开
      const onClose = (): void => {
        cleanup();
        reject(new Error('The extended service channel has been disconnected'));
      };
      // 注册事件监听：消息、关闭、错误
      downloadWs.addEventListener('message', onDownloadMessage);
      downloadWs.addEventListener('close', onClose);
      downloadWs.addEventListener('error', onClose);
    });
  }

  /**
   * 向双通道同时发送 HELLO 握手消息，声明 sessionId 与通道角色
   * 服务端依靠此消息完成上下行绑定
   */
  private sendHelloMessages(session: LongTraceTransferSession): void {
    const helloUpload: LongTraceHelloMessage = {
      type: LONG_TRACE_MESSAGE_TYPE_HELLO,
      sessionId: session.sessionId,
      channel: LONG_TRACE_CHANNEL_UPLOAD,
    };
    const helloDownload: LongTraceHelloMessage = {
      type: LONG_TRACE_MESSAGE_TYPE_HELLO,
      sessionId: session.sessionId,
      channel: LONG_TRACE_CHANNEL_DOWNLOAD,
    };
    session.uploadWs.send(JSON.stringify(helloUpload));
    session.downloadWs.send(JSON.stringify(helloDownload));
  }

  /**
   * 完整上传单个文件：等待窗口→发送元数据→发送分片→发送结束标记
   * 若文件名无法解析序号则跳过
   */
  private async uploadOneFile(
    file: File,
    fileIndex: number,
    session: LongTraceTransferSession,
    state: LongTraceTransferState,
    options: LongTraceResolvedTransferOptions
  ): Promise<void> {
    // 解析文件名中的序号，若失败则跳过此文件
    const n = parseSequenceNumber(file.name);
    if (typeof n !== 'number') {
      return;
    }
    // 流量控制：等待服务端处理完前面的文件，避免一次性上传过多
    while (fileIndex > state.lastResultIndex + LONG_TRACE_PREFETCH_LIMIT) {
      await new Promise<void>((resolve) => state.resultAdvanceWaiters.push(resolve));
    }
    // 构造并发送文件元数据消息，告知服务端即将上传的文件信息
    const meta: LongTraceTraceMetaMessage = {
      type: LONG_TRACE_MESSAGE_TYPE_TRACE_META,
      sessionId: session.sessionId,
      n,
      fileName: file.name,
      isLast: fileIndex === session.sequenceSortedFiles.length - 1,
    };
    session.uploadWs.send(JSON.stringify(meta));
    // 按块读取文件并循环发送，直到整个文件传输完毕
    let offset = 0;
    while (offset < file.size) {
      const end = Math.min(offset + options.uploadChunkSizeBytes, file.size);
      const buffer = await file.slice(offset, end).arrayBuffer();
      offset += buffer.byteLength;
      session.uploadWs.send(buffer);
    }
    // 发送 TRACE_END 消息，通知服务端该文件已上传完成，可开始预处理
    const endMsg: LongTraceTraceEndMessage = {
      type: LONG_TRACE_MESSAGE_TYPE_TRACE_END,
      sessionId: session.sessionId,
      n,
      fileName: file.name,
    };
    session.uploadWs.send(JSON.stringify(endMsg));
  }

  /**
   * 优雅关闭 WebSocket：先监听 close 事件，再主动 close
   * 若指定时间内未收到关闭事件，则超时兜底 resolve
   */
  private closeWebSocketGracefully(ws: WebSocket): Promise<void> {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const onClose = (): void => {
        ws.removeEventListener('close', onClose);
        resolve();
      };
      ws.addEventListener('close', onClose);
      ws.close();
      window.setTimeout(() => resolve(), LONG_TRACE_CLOSE_WAIT_MS);
    });
  }

  /**
   * 安全关闭 WebSocket：忽略任何异常，防止重复关闭抛出错误
   */
  private safeCloseWebSocket(ws: WebSocket): void {
    try {
      ws.close();
    } catch (e) {}
  }

  /**
   * 根据绑定状态选择合适的关闭策略
   * 未绑定直接强关；已绑定则优雅等待双通道关闭完成
   */
  private async closeSession(session: LongTraceTransferSession, bound: boolean): Promise<void> {
    if (!bound) {
      this.safeCloseWebSocket(session.uploadWs);
      this.safeCloseWebSocket(session.downloadWs);
      return;
    }
    await Promise.all([
      this.closeWebSocketGracefully(session.uploadWs),
      this.closeWebSocketGracefully(session.downloadWs),
    ]);
  }

  /**
   * 后台批量预处理长trace文件
   * @param files 待处理的 File 列表
   * @param options 上传与回调配置
   */
  async preprocessInBackground(files: File[], options: LongTraceTransferOptions = {}): Promise<void> {
    // 若文件列表为空，直接返回
    if (files.length <= 0) {
      return;
    }
    // 合并用户配置与默认配置，确保后续逻辑使用完整参数
    const resolvedOptions: LongTraceResolvedTransferOptions = {
      uploadChunkSizeBytes: options.uploadChunkSizeBytes ?? LONG_TRACE_UPLOAD_CHUNK_SIZE_BYTES,
      bindTimeoutMs: options.bindTimeoutMs ?? LONG_TRACE_SESSION_BIND_TIMEOUT_MS,
      onProgress: options.onProgress,
      onResult: options.onResult,
    };
    // 生成全局唯一会话 ID，用于服务端绑定上下行通道
    const sessionId = createSessionId();
    // 创建会话上下文：双通道 WebSocket 与按序号排序后的文件列表
    const session: LongTraceTransferSession = {
      sessionId,
      uploadWs: createWebSocket(this.wsUrl),
      downloadWs: createWebSocket(this.wsUrl),
      // 按文件名中的序号升序排序，保证上传顺序与预处理顺序一致
      sequenceSortedFiles: [...files].sort((a, b) => {
        const na = parseSequenceNumber(a.name) ?? 0;
        const nb = parseSequenceNumber(b.name) ?? 0;
        return na - nb;
      }),
      total: files.length,
    };
    // 初始化传输状态：完成数、绑定标志、补丁累加器、结果索引、等待队列
    const state: LongTraceTransferState = {
      done: 0,
      bound: false,
      currentPatch: undefined,
      lastResultIndex: -1,
      resultAdvanceWaiters: [],
    };
    // 提前构造绑定完成 Promise，用于后续超时控制
    const bindReadyPromise = this.createBindReadyPromise(session.downloadWs, state);
    bindReadyPromise.catch(() => {});
    try {
      // 等待双通道 WebSocket 同时连接成功，超时则抛出异常
      await waitWithTimeout(
        Promise.all([waitForOpen(session.uploadWs), waitForOpen(session.downloadWs)]),
        resolvedOptions.bindTimeoutMs,
        'WebSocket connection timeout'
      );
      // 向双通道发送 HELLO 握手消息，声明会话 ID 与通道角色
      this.sendHelloMessages(session);
      // 等待服务端返回 SESSION_BOUND，超时则抛出异常
      await waitWithTimeout(bindReadyPromise, resolvedOptions.bindTimeoutMs, 'Extension service dual-channel binding timeout');
      // 注册下载通道消息处理器，开始监听 RESULT 与补丁数据
      this.registerDownloadMessageHandler(session, state, resolvedOptions);
      // 顺序上传每个文件：元数据→分片→结束标记
      for (let i = 0; i < session.sequenceSortedFiles.length; i += 1) {
        await this.uploadOneFile(session.sequenceSortedFiles[i], i, session, state, resolvedOptions);
      }
      // 等待所有文件预处理完成（state.done 等于总数）
      while (state.done < session.total) {
        await new Promise<void>((resolve) => state.resultAdvanceWaiters.push(resolve));
      }
    } finally {
      // 无论成功或异常，都要优雅关闭双通道 WebSocket
      await this.closeSession(session, state.bound);
    }
  }
}
