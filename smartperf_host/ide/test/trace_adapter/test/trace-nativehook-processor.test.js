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
const { createNativeHookProcessor } = require('../trace_adapter/traceNativeHookProcessor.js');
const {
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK,
  LONG_TRACE_SEGMENT_LENGTH_BYTES,
} = require('../trace_adapter/traceConstants.js');
const {
  buildNativehookSegment,
  buildNonNativehookSegment,
  buildTraceFromSegments,
  loadLongTraceProtoTypes,
} = require('./traceTestBuilders.js');

/*
 * 测试条件：同一 trace 中同时包含 cpu 段和 nativehook 段。
 * 测试目的：验证处理器能识别 nativehook 并过滤掉非目标插件段。
 */
test('traceNativeHookProcessor 能识别并过滤 nativehook 段', () => {
  const processor = createNativeHookProcessor();
  const types = loadLongTraceProtoTypes();
  // mapsInfo 事件足以表示一条可被提取的公共数据。
  const nativeEvents = [
    {
      tvSec: '1',
      tvNsec: '100',
      mapsInfo: {
        pid: 1,
        start: '1',
        end: '2',
        offset: '0',
        filePathId: 1,
      },
    },
  ];
  const traceBuffer = buildTraceFromSegments([
    buildNonNativehookSegment(types),
    buildNativehookSegment(types, nativeEvents, 1, 100),
  ]);

  // 仅 header 的数据不应被误判为 nativehook。
  assert.equal(processor.hasNativehookFast(Buffer.alloc(LONG_TRACE_HEADER_SIZE_BYTES)), false);
  assert.equal(processor.hasNativehookFast(traceBuffer), true);

  // 过滤后应去掉非 nativehook 段，同时仍可被再次探测出来。
  const filtered = processor.filterNativeHookSegments(traceBuffer);
  assert.ok(filtered.byteLength < traceBuffer.byteLength);
  assert.equal(processor.hasNativehookFast(filtered), true);
});

/*
 * 测试条件：构造公共事件、重复统计事件和应被丢弃的统计事件。
 * 测试目的：验证 extractCommonEvents 的提取和去重规则正确。
 */
test('traceNativeHookProcessor 能提取公共事件并按统计维度去重', () => {
  const processor = createNativeHookProcessor();
  const types = loadLongTraceProtoTypes();
  // 这里同时放入公共事件、可保留统计事件和应被丢弃的统计事件。
  const events = [
    {
      tvSec: '1',
      tvNsec: '100',
      mapsInfo: {
        pid: 1,
        start: '1',
        end: '2',
        offset: '0',
        filePathId: 1,
      },
    },
    {
      tvSec: '1',
      tvNsec: '110',
      statisticsEvent: {
        pid: 11,
        callstackId: 7,
        type: 0,
        applyCount: '2',
        releaseCount: '1',
        applySize: '32',
        releaseSize: '8',
      },
    },
    {
      tvSec: '1',
      tvNsec: '120',
      statisticsEvent: {
        pid: 11,
        callstackId: 7,
        type: 0,
        applyCount: '3',
        releaseCount: '2',
        applySize: '64',
        releaseSize: '16',
      },
    },
    {
      tvSec: '1',
      tvNsec: '130',
      statisticsEvent: {
        pid: 22,
        callstackId: 9,
        type: 0,
        applyCount: '1',
        releaseCount: '1',
        applySize: '16',
        releaseSize: '16',
      },
    },
  ];
  const traceBuffer = buildTraceFromSegments([buildNativehookSegment(types, events, 1, 100)]);

  // 最终应保留 1 条公共事件和 1 条最新且仍有残留分配的统计事件。
  const extracted = processor.extractCommonEvents(traceBuffer);

  assert.equal(extracted.length, 2);
  assert.ok(extracted.some((item) => item.mapsInfo));
  assert.ok(extracted.some((item) => item.statisticsEvent && Number(item.statisticsEvent.pid) === 11));
  assert.equal(extracted.some((item) => item.statisticsEvent && Number(item.statisticsEvent.pid) === 22), false);
});

/*
 * 测试条件：输入单条公共事件并指定目标时间戳。
 * 测试目的：验证 buildNativehookPatchPayload 会正确重写时间并保持可解码。
 */
test('traceNativeHookProcessor 能生成带目标时间戳的补丁段', () => {
  const processor = createNativeHookProcessor();
  const types = loadLongTraceProtoTypes();
  // 用单条公共事件验证补丁重写时间戳后仍能被 protobuf 正常解码。
  const commonEvents = [
    {
      tvSec: '1',
      tvNsec: '100',
      mapsInfo: {
        pid: 1,
        start: '1',
        end: '2',
        offset: '0',
        filePathId: 1,
      },
    },
  ];

  // patchPayload 格式为“4 字节长度 + ProfilerPluginData”。
  const patchPayload = processor.buildNativehookPatchPayload(commonEvents, 9, '5', '600');
  const payloadLength = patchPayload.readUInt32LE(0);
  const plugin = types.pluginType.decode(
    patchPayload.subarray(LONG_TRACE_SEGMENT_LENGTH_BYTES, LONG_TRACE_SEGMENT_LENGTH_BYTES + payloadLength)
  );
  const batch = types.batchType.decode(plugin.data);

  assert.equal(plugin.name, LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK);
  assert.equal(String(plugin.clockId), '9');
  assert.equal(String(plugin.tvSec), '5');
  assert.equal(String(plugin.tvNsec), '600');
  assert.equal(batch.events.length, 1);
  assert.equal(String(batch.events[0].tvSec), '5');
  assert.equal(String(batch.events[0].tvNsec), '600');
});
