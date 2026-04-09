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
// 上传文件分块大小
export const LONG_TRACE_UPLOAD_CHUNK_SIZE_BYTES = 4 * 1024 * 1024;
// 会话绑定超时时间
export const LONG_TRACE_SESSION_BIND_TIMEOUT_MS = 5 * 1000;
// 关闭会话等待时间
export const LONG_TRACE_CLOSE_WAIT_MS = 2 * 1000;
// 预取文件数量
export const LONG_TRACE_PREFETCH_LIMIT = 3;
// 回退路径
export const LONG_TRACE_FALLBACK_PATH = '/longtrace-preprocess';
// 文件名分隔符
export const LONG_TRACE_FILE_NAME_SEPARATOR = '_';
// 文件名后缀
export const LONG_TRACE_FILE_SUFFIX = '.htrace';
// 头部大小
export const LONG_TRACE_HEADER_SIZE_BYTES = 1024;
// 总长度偏移量
export const LONG_TRACE_TOTAL_LENGTH_OFFSET_BYTES = 8;
// 无符号 32 位整数字节数
export const LONG_TRACE_UINT32_BYTES = 4;
// 无符号 32 位整数左移位数（用于高低位计算）
export const LONG_TRACE_UINT32_SHIFT_BITS = BigInt(32);
// 无符号 32 位整数掩码（用于截取低 32 位）
export const LONG_TRACE_UINT32_MASK = BigInt(0xffffffff);
// 第一页页码（分页展示时从 1 开始）
export const LONG_TRACE_FIRST_PAGE_NUMBER = 1;
// 页面锁定（加载中）时的透明度
export const LONG_TRACE_PAGE_LOCKED_OPACITY = '0.7';
// 页面准备就绪时的透明度
export const LONG_TRACE_PAGE_READY_OPACITY = '1';
// 允许鼠标事件的 CSS 值
export const LONG_TRACE_POINTER_EVENTS_AUTO = 'auto';
// 禁止鼠标事件的 CSS 值
export const LONG_TRACE_POINTER_EVENTS_NONE = 'none';
// WASM 单次读取分块大小（48 MB）
export const LONG_TRACE_WASM_READ_CHUNK_BYTES = 48 * 1024 * 1024;
// 支持的最大文件长度（400 MB）
export const LONG_TRACE_MAX_FILE_LENGTH_BYTES = 400 * 1024 * 1024;
// 进度百分比保留小数位数
export const LONG_TRACE_PROGRESS_PERCENT_DECIMALS = 2;

// 消息类型：握手/hello
export const LONG_TRACE_MESSAGE_TYPE_HELLO = 'HELLO';
// 消息类型：trace 元信息
export const LONG_TRACE_MESSAGE_TYPE_TRACE_META = 'TRACE_META';
// 消息类型：trace 结束标记
export const LONG_TRACE_MESSAGE_TYPE_TRACE_END = 'TRACE_END';
// 消息类型：处理结果
export const LONG_TRACE_MESSAGE_TYPE_RESULT = 'RESULT';
// 消息类型：分片数据发送结束
export const LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END = 'PATCH_PAYLOAD_END';

// 通道类型：上传
export const LONG_TRACE_CHANNEL_UPLOAD = 'UPLOAD';
// 通道类型：下载
export const LONG_TRACE_CHANNEL_DOWNLOAD = 'DOWNLOAD';

// 预处理状态：无需补丁
export const LONG_TRACE_STATUS_NO_PATCH = 'NO_PATCH';
// 预处理状态：补丁已就绪
export const LONG_TRACE_STATUS_PATCH_READY = 'PATCH_READY';
// 预处理状态：发生错误
export const LONG_TRACE_STATUS_ERROR = 'ERROR';

// 会话绑定原因：已绑定
export const LONG_TRACE_REASON_SESSION_BOUND = 'SESSION_BOUND';

// 预处理状态联合类型
export type LongTracePreprocessStatus =
  | typeof LONG_TRACE_STATUS_NO_PATCH
  | typeof LONG_TRACE_STATUS_PATCH_READY
  | typeof LONG_TRACE_STATUS_ERROR;

// 通道类型联合类型
export type LongTraceChannel = typeof LONG_TRACE_CHANNEL_UPLOAD | typeof LONG_TRACE_CHANNEL_DOWNLOAD;

// 普通长 trace 文件名正则（格式：_YYYYMMDD_HHMMSS_序号.htrace）
export const LONG_TRACE_NORMAL_MATCH_PATTERN = /_\d{8}_\d{6}_\d+\.htrace$/;
// 特殊长 trace 文件名正则（格式：_(arkts|ebpf|hiperf).htrace）
export const LONG_TRACE_SPECIAL_MATCH_PATTERN = /_(arkts|ebpf|hiperf)\.htrace$/;

// 构造进度提示消息
export function buildLongTraceProgressMessage(done: number, total: number): string {
  return `Extension service converting longtrace... Completed: (${done}/${total})`;
}

// 构造页面未就绪提示消息
export function buildLongTracePageNotReadyMessage(pageNum: number): string {
  return `Extension service converting, page ${pageNum} not ready`;
}
