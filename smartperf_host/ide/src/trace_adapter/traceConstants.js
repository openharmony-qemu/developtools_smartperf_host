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

// htrace 文件固定头长度，后续 segment 遍历都基于该偏移开始。
const LONG_TRACE_HEADER_SIZE_BYTES = 1024;
// htrace 中 segment 长度字段固定占用 4 个字节。
const LONG_TRACE_SEGMENT_LENGTH_BYTES = 4;
// htrace 文件 magic，用于快速校验输入数据是否为合法 trace 文件。
const LONG_TRACE_HEADER_MAGIC = BigInt('0x464F5250534F484F');
// NativeHook ProfilerPluginData 的版本字段，补丁重编码时需要保持一致。
const LONG_TRACE_PROTO_VERSION = '1.02';
// protobuf 中 common_types.ProfilerPluginData 的类型名。
const LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA = 'common_types.ProfilerPluginData';
// protobuf 中 BatchNativeHookData 的类型名。
const LONG_TRACE_PROTO_TYPE_BATCH_NATIVE_HOOK_DATA = 'BatchNativeHookData';
// protobuf 中 NativeHookData 的类型名。
const LONG_TRACE_PROTO_TYPE_NATIVE_HOOK_DATA = 'NativeHookData';
// 运行时允许上传端领先处理进度的最大文件数，防止队列无限膨胀。
const LONG_TRACE_PREFETCH_LIMIT = 3;
// 补丁二进制按块发送时的单块大小，兼顾吞吐与内存占用。
const LONG_TRACE_PATCH_CHUNK_SIZE_BYTES = 4 * 1024 * 1024;
// 上传/下载双通道等待绑定完成的超时时间。
const LONG_TRACE_SESSION_BIND_TIMEOUT_MS = 5 * 1000;
// 会话长时间无读写时的回收超时时间。
const LONG_TRACE_SESSION_IDLE_TIMEOUT_MS = 60 * 1000;
// 文本帧统一按 utf8 编解码。
const LONG_TRACE_TEXT_ENCODING_UTF8 = 'utf8';
// native hook 插件的固定名字。
const LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK = 'nativehook';
// ProfilerPluginData.status 的成功值。
const LONG_TRACE_PLUGIN_STATUS_OK = 0;
// 控制消息类型：双通道握手。
const LONG_TRACE_MESSAGE_TYPE_HELLO = 'HELLO';
// 控制消息类型：服务端处理结果。
const LONG_TRACE_MESSAGE_TYPE_RESULT = 'RESULT';
// 控制消息类型：上传前的文件元信息。
const LONG_TRACE_MESSAGE_TYPE_TRACE_META = 'TRACE_META';
// 控制消息类型：单个文件上传结束。
const LONG_TRACE_MESSAGE_TYPE_TRACE_END = 'TRACE_END';
// 控制消息类型：补丁二进制发送结束。
const LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END = 'PATCH_PAYLOAD_END';
// 通道角色：上传通道。
const LONG_TRACE_CHANNEL_UPLOAD = 'UPLOAD';
// 通道角色：下载通道。
const LONG_TRACE_CHANNEL_DOWNLOAD = 'DOWNLOAD';
// 结果状态：当前页无需补丁。
const LONG_TRACE_RESULT_STATUS_NO_PATCH = 'NO_PATCH';
// 结果状态：当前页已经生成补丁。
const LONG_TRACE_RESULT_STATUS_PATCH_READY = 'PATCH_READY';
// 结果状态：当前页处理失败。
const LONG_TRACE_RESULT_STATUS_ERROR = 'ERROR';
// 结果原因：上传下载通道已经完成绑定。
const LONG_TRACE_RESULT_REASON_SESSION_BOUND = 'SESSION_BOUND';
// 结果原因：当前页不存在 nativehook 数据。
const LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK = 'NO_NATIVEHOOK';
// 结果原因：当前页是最小页号基线页。
const LONG_TRACE_RESULT_REASON_MIN_N = 'MIN_N';
// 结果原因：补丁上下文为空，不需要下发补丁。
const LONG_TRACE_RESULT_REASON_PATCH_BUFFER_EMPTY = 'PATCH_BUFFER_EMPTY';
// 结果原因：存在未结束的 inflight 文件。
const LONG_TRACE_RESULT_REASON_INFLIGHT_EXISTS = 'INFLIGHT_EXISTS';
// 结果原因：预取窗口已满。
const LONG_TRACE_RESULT_REASON_PREFETCH_LIMIT = 'PREFETCH_LIMIT';
// 结果原因：页号不连续，顺序校验失败。
const LONG_TRACE_RESULT_REASON_SEQUENCE_MISMATCH = 'SEQUENCE_MISMATCH';
// 结果原因：缺少 TRACE_META 就收到 TRACE_END。
const LONG_TRACE_RESULT_REASON_TRACE_END_WITHOUT_META = 'TRACE_END_WITHOUT_META';
// 结果原因：上传通道在文件完成前被关闭。
const LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED = 'UPLOAD_CHANNEL_CLOSED';

module.exports = {
  LONG_TRACE_CHANNEL_DOWNLOAD,
  LONG_TRACE_CHANNEL_UPLOAD,
  LONG_TRACE_HEADER_MAGIC,
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_MESSAGE_TYPE_HELLO,
  LONG_TRACE_MESSAGE_TYPE_PATCH_PAYLOAD_END,
  LONG_TRACE_MESSAGE_TYPE_RESULT,
  LONG_TRACE_MESSAGE_TYPE_TRACE_END,
  LONG_TRACE_MESSAGE_TYPE_TRACE_META,
  LONG_TRACE_PATCH_CHUNK_SIZE_BYTES,
  LONG_TRACE_PREFETCH_LIMIT,
  LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK,
  LONG_TRACE_PLUGIN_STATUS_OK,
  LONG_TRACE_PROTO_VERSION,
  LONG_TRACE_PROTO_TYPE_BATCH_NATIVE_HOOK_DATA,
  LONG_TRACE_PROTO_TYPE_NATIVE_HOOK_DATA,
  LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA,
  LONG_TRACE_RESULT_REASON_INFLIGHT_EXISTS,
  LONG_TRACE_RESULT_REASON_MIN_N,
  LONG_TRACE_RESULT_REASON_NO_NATIVEHOOK,
  LONG_TRACE_RESULT_REASON_PATCH_BUFFER_EMPTY,
  LONG_TRACE_RESULT_REASON_PREFETCH_LIMIT,
  LONG_TRACE_RESULT_REASON_SEQUENCE_MISMATCH,
  LONG_TRACE_RESULT_REASON_SESSION_BOUND,
  LONG_TRACE_RESULT_REASON_TRACE_END_WITHOUT_META,
  LONG_TRACE_RESULT_REASON_UPLOAD_CHANNEL_CLOSED,
  LONG_TRACE_RESULT_STATUS_ERROR,
  LONG_TRACE_RESULT_STATUS_NO_PATCH,
  LONG_TRACE_RESULT_STATUS_PATCH_READY,
  LONG_TRACE_SEGMENT_LENGTH_BYTES,
  LONG_TRACE_SESSION_BIND_TIMEOUT_MS,
  LONG_TRACE_SESSION_IDLE_TIMEOUT_MS,
  LONG_TRACE_TEXT_ENCODING_UTF8,
};
