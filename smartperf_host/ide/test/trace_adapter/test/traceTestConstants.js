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

// 单元测试使用的固定会话标识，避免各文件重复散落同一字符串。
const TEST_SESSION_ID = 'session-1';
// 端到端测试使用独立会话标识，便于和单元测试语义区分。
const TEST_E2E_SESSION_ID = 'e2e-session-1';
// 本地回环地址，统一 WebSocket 与临时端口监听使用。
const TEST_LOCALHOST = '127.0.0.1';
// 单元测试中的短超时配置，用于构造 bindTimer 和 idleTimer。
const TEST_RUNTIME_TIMEOUT_MS = 1000;
// runtime 单元测试中使用的预取窗口配置。
const TEST_RUNTIME_PREFETCH_LIMIT = 1;
// e2e 轮询间隔，控制等待结果帧时的重试频率。
const TEST_POLL_INTERVAL_MS = 20;
// e2e 等待双通道绑定完成的超时阈值。
const TEST_BIND_TIMEOUT_MS = 5 * 1000;
// e2e 等待结果帧或补丁返回的超时阈值。
const TEST_RESULT_TIMEOUT_MS = 8 * 1000;
// e2e 单用例总超时时间。
const TEST_E2E_TIMEOUT_MS = 15 * 1000;
// 业务处理器测试中用于验证分片发送的补丁块大小。
const TEST_PATCH_CHUNK_SIZE_BYTES = 1024;
// 常用的单字节占位缓冲区。
const TEST_SINGLE_BYTE_BUFFER = Buffer.from([1]);
// 常用的双字节占位缓冲区。
const TEST_DOUBLE_BYTE_BUFFER = Buffer.from([1, 2]);
// 常用的三字节占位缓冲区。
const TEST_TRIPLE_BYTE_BUFFER = Buffer.from([1, 2, 3]);
// 常用的四字节占位缓冲区。
const TEST_FOUR_BYTE_BUFFER = Buffer.from([1, 2, 3, 4]);
// 常用的过滤结果缓冲区。
const TEST_FILTERED_SEGMENT_BUFFER = Buffer.from([1, 2, 3, 4]);
// 常用的九字节 trace 样例缓冲区。
const TEST_TRACE_SAMPLE_BUFFER = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
// 常用的补丁负载缓冲区。
const TEST_PATCH_PAYLOAD_BUFFER = Buffer.from([9, 8, 7]);
// 空 trace 样例缓冲区。
const TEST_EMPTY_BUFFER = Buffer.alloc(0);
// 业务处理器测试中的最小输入文件名。
const TEST_FILE_NAME_EMPTY = 'a.htrace';
// 基线页测试使用的文件名。
const TEST_FILE_NAME_BASE = 'base.htrace';
// 后续页测试使用的文件名。
const TEST_FILE_NAME_NEXT = 'next.htrace';
// 无 nativehook 场景测试使用的文件名。
const TEST_FILE_NAME_NO_HOOK = 'no-hook.htrace';
// 有 nativehook 场景测试使用的文件名。
const TEST_FILE_NAME_HOOK = 'hook.htrace';
// runtime 队列占位文件名。
const TEST_FILE_NAME_QUEUED = 'queued-2.htrace';
// runtime 测试第一页文件名。
const TEST_FILE_NAME_TRACE_1 = 'trace-1.htrace';
// runtime 测试第二页文件名。
const TEST_FILE_NAME_TRACE_2 = 'trace-2.htrace';
// runtime 测试第三页文件名。
const TEST_FILE_NAME_TRACE_3 = 'trace-3.htrace';
// runtime 测试第四页文件名。
const TEST_FILE_NAME_TRACE_4 = 'trace-4.htrace';
// runtime 测试第5页文件名。
const TEST_FILE_NAME_TRACE_5= 'trace-5.htrace';
// runtime 测试第6页文件名。
const TEST_FILE_NAME_TRACE_6 = 'trace-6.htrace';
// runtime 测试第7页文件名。
const TEST_FILE_NAME_TRACE_7 = 'trace-7.htrace';
// runtime 测试第8文件名。
const TEST_FILE_NAME_TRACE_8 = 'trace-8.htrace';
// runtime 测试第9文件名。
const TEST_FILE_NAME_TRACE_9 = 'trace-9.htrace';
// runtime 测试第10页文件名。
const TEST_FILE_NAME_TRACE_10 = 'trace-10.htrace';
// runtime 测试第十一页文件名。
const TEST_FILE_NAME_TRACE_11 = 'trace-11.htrace';
// runtime 测试第十二页文件名。
const TEST_FILE_NAME_TRACE_12 = 'trace-12.htrace';
// runtime 测试第十三页文件名。
const TEST_FILE_NAME_TRACE_13 = 'trace-13.htrace';
// runtime 测试第十四页文件名。
const TEST_FILE_NAME_TRACE_14 = 'trace-14.htrace';
// runtime 测试第十五页文件名。
const TEST_FILE_NAME_TRACE_15= 'trace-15.htrace';
// runtime 测试第16页文件名。
const TEST_FILE_NAME_TRACE_16 = 'trace-16.htrace';
// runtime 测试第17页文件名。
const TEST_FILE_NAME_TRACE_17 = 'trace-17.htrace';
// runtime 测试第18页文件名。
const TEST_FILE_NAME_TRACE_18 = 'trace-18.htrace';
// runtime 测试第19页文件名。
const TEST_FILE_NAME_TRACE_19 = 'trace-19.htrace';
// runtime 测试第20页文件名。
const TEST_FILE_NAME_TRACE_20 = 'trace-20.htrace';
// e2e trace 文件名前缀，便于统一拼装页号文件名。
const TEST_E2E_TRACE_FILE_PREFIX = 'hiprofiler_data_20260101_000001_';
// e2e trace 文件名后缀。
const TEST_E2E_TRACE_FILE_SUFFIX = '.htrace';

module.exports = {
  TEST_BIND_TIMEOUT_MS,
  TEST_DOUBLE_BYTE_BUFFER,
  TEST_E2E_TIMEOUT_MS,
  TEST_E2E_TRACE_FILE_PREFIX,
  TEST_E2E_TRACE_FILE_SUFFIX,
  TEST_E2E_SESSION_ID,
  TEST_EMPTY_BUFFER,
  TEST_FILTERED_SEGMENT_BUFFER,
  TEST_FILE_NAME_BASE,
  TEST_FILE_NAME_EMPTY,
  TEST_FILE_NAME_HOOK,
  TEST_FILE_NAME_NEXT,
  TEST_FILE_NAME_NO_HOOK,
  TEST_FILE_NAME_QUEUED,
  TEST_FILE_NAME_TRACE_1,
  TEST_FILE_NAME_TRACE_2,
  TEST_FILE_NAME_TRACE_3,
  TEST_FILE_NAME_TRACE_4,
  TEST_FOUR_BYTE_BUFFER,
  TEST_LOCALHOST,
  TEST_PATCH_PAYLOAD_BUFFER,
  TEST_PATCH_CHUNK_SIZE_BYTES,
  TEST_POLL_INTERVAL_MS,
  TEST_RESULT_TIMEOUT_MS,
  TEST_RUNTIME_PREFETCH_LIMIT,
  TEST_RUNTIME_TIMEOUT_MS,
  TEST_SESSION_ID,
  TEST_SINGLE_BYTE_BUFFER,
  TEST_TRACE_SAMPLE_BUFFER,
  TEST_TRIPLE_BYTE_BUFFER,
};
