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

const path = require('path');
const protobuf = require('protobufjs');
const {
  LONG_TRACE_HEADER_MAGIC,
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK,
  LONG_TRACE_PLUGIN_STATUS_OK,
  LONG_TRACE_PROTO_VERSION,
  LONG_TRACE_PROTO_TYPE_BATCH_NATIVE_HOOK_DATA,
  LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA,
  LONG_TRACE_SEGMENT_LENGTH_BYTES,
} = require('../trace_adapter/traceConstants.js');
const { TEST_TRIPLE_BYTE_BUFFER } = require('./traceTestConstants.js');

// 加载真实 proto 类型，确保测试构造出的数据与生产链路完全一致。
function loadLongTraceProtoTypes() {
  const protoRoot = protobuf.loadSync([
    path.join(__dirname, '..', 'proto', 'common_types.proto'),
    path.join(__dirname, '..', 'proto', 'native_hook_result.proto'),
  ]);
  return {
    batchType: protoRoot.lookupType(LONG_TRACE_PROTO_TYPE_BATCH_NATIVE_HOOK_DATA),
    pluginType: protoRoot.lookupType(LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA),
  };
}

// 构造最小 htrace 文件头，后续 segment 会追加在 header 之后。
function buildLongTraceHeader(totalLength) {
  const header = Buffer.alloc(LONG_TRACE_HEADER_SIZE_BYTES);
  header.writeBigUInt64LE(LONG_TRACE_HEADER_MAGIC, 0);
  header.writeBigUInt64LE(BigInt(totalLength), 8);
  return header;
}

// 按“长度字段 + protobuf payload”的格式生成单个插件段。
function buildPluginSegment(protoTypes, pluginData) {
  const pluginBytes = protoTypes.pluginType.encode(pluginData).finish();
  const segment = Buffer.alloc(LONG_TRACE_SEGMENT_LENGTH_BYTES + pluginBytes.length);
  segment.writeUInt32LE(pluginBytes.length, 0);
  Buffer.from(pluginBytes).copy(segment, LONG_TRACE_SEGMENT_LENGTH_BYTES);
  return segment;
}

// 构造一个 nativehook 插件段，便于覆盖补丁生成与过滤链路。
function buildNativehookSegment(protoTypes, events, tvSec, tvNsec, clockId = 7) {
  const batchBytes = protoTypes.batchType.encode({ events }).finish();
  return buildPluginSegment(protoTypes, {
    name: LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK,
    status: LONG_TRACE_PLUGIN_STATUS_OK,
    data: batchBytes,
    clockId,
    tvSec: String(tvSec),
    tvNsec: String(tvNsec),
    version: LONG_TRACE_PROTO_VERSION,
  });
}

// 构造一个非 nativehook 插件段，用于验证过滤逻辑只保留目标插件。
function buildNonNativehookSegment(protoTypes, overrides = {}) {
  return buildPluginSegment(protoTypes, {
    name: 'cpu',
    status: LONG_TRACE_PLUGIN_STATUS_OK,
    data: TEST_TRIPLE_BYTE_BUFFER,
    clockId: 3,
    tvSec: '10',
    tvNsec: '20',
    version: LONG_TRACE_PROTO_VERSION,
    ...overrides,
  });
}

// 将多个 segment 组合成完整 trace，用于单元测试和 e2e 共同复用。
function buildTraceFromSegments(segments) {
  const body = Buffer.concat(segments);
  return Buffer.concat([buildLongTraceHeader(LONG_TRACE_HEADER_SIZE_BYTES + body.length), body]);
}

// 按需构造包含或不包含 nativehook 的 trace 输入，减少 e2e 样板代码。
function buildTraceWithOptionalNativehook(protoTypes, hasNativehook, tvSec, tvNsec, events) {
  if (!hasNativehook) {
    return buildLongTraceHeader(LONG_TRACE_HEADER_SIZE_BYTES);
  }
  const nativehookEvents = Array.isArray(events) && events.length > 0
    ? events
    : [
        {
          tvSec: String(tvSec),
          tvNsec: String(tvNsec),
          mapsInfo: {
            pid: 1,
            start: '1',
            end: '2',
            offset: '0',
            filePathId: 1,
          },
        },
      ];
  return buildTraceFromSegments([buildNativehookSegment(protoTypes, nativehookEvents, tvSec, tvNsec)]);
}

module.exports = {
  buildLongTraceHeader,
  buildNativehookSegment,
  buildNonNativehookSegment,
  buildPluginSegment,
  buildTraceFromSegments,
  buildTraceWithOptionalNativehook,
  loadLongTraceProtoTypes,
};
