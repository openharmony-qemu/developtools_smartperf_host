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
  LONG_TRACE_PROTO_TYPE_NATIVE_HOOK_DATA,
  LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA,
  LONG_TRACE_SEGMENT_LENGTH_BYTES,
  LONG_TRACE_TEXT_ENCODING_UTF8,
} = require('./traceConstants.js');
const NANOSECONDS_PER_SECOND = BigInt(1000000000);

/**
 * 创建一个 native hook 处理器实例，用于解析和处理 native hook 数据。
 * @returns {Object} - 包含解析和处理 native hook 数据的方法的对象。
 */
function createNativeHookProcessor() {
  let longTraceProtoRoot;
  let longTraceProfilerPluginDataType;
  let longTraceBatchNativeHookDataType;
  let longTraceNativeHookDataType;

  /**
   * 首次使用时懒加载 proto 元信息，避免服务启动阶段承担不必要的 I/O 开销。
   * @returns {void}
   * @description 无返回值。
   */
  function ensureLongTraceProtoLoaded() {
    if (longTraceProtoRoot) {
      return;
    }
    const commonTypesProto = path.join(__dirname, '..', 'proto', 'common_types.proto');
    const nativeHookProto = path.join(__dirname, '..', 'proto', 'native_hook_result.proto');
    longTraceProtoRoot = protobuf.loadSync([commonTypesProto, nativeHookProto]);
    longTraceProfilerPluginDataType = longTraceProtoRoot.lookupType(LONG_TRACE_PROTO_TYPE_PROFILER_PLUGIN_DATA);
    longTraceBatchNativeHookDataType = longTraceProtoRoot.lookupType(LONG_TRACE_PROTO_TYPE_BATCH_NATIVE_HOOK_DATA);
    longTraceNativeHookDataType = longTraceProtoRoot.lookupType(LONG_TRACE_PROTO_TYPE_NATIVE_HOOK_DATA);
  }

  /**
   * 统把 long/number/string 等输入转换为 BigInt，便于后续做时间戳和大小比较。
   * @param {*} value - 输入值，可能是是 bigint、number、string 或其他对象。
   * @returns {bigint} - 转换后的 BigInt 值。
   */
  function toBigIntU64(value) {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return BigInt(value);
    }
    if (typeof value === 'string' && value) {
      return BigInt(value);
    }
    if (value && typeof value.toString === 'function') {
      return BigInt(value.toString());
    }
    return BigInt(0);
  }

  /**
   * 校验 header 长度和 magic，快速过滤掉非法 trace 输入。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @returns {boolean} - 是否为合法的 trace 输入。
   */
  function isValidHtraceHeader(traceBuffer) {
    if (!traceBuffer || traceBuffer.byteLength < LONG_TRACE_HEADER_SIZE_BYTES) {
      return false;
    }
    try {
      return traceBuffer.readBigUInt64LE(0) === LONG_TRACE_HEADER_MAGIC;
    } catch (e) {
      return false;
    }
  }

  /**
   * 按 htrace 的“长度 + payload”格式顺序遍历每个 segment。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @param {function} onSegmentPayload - 每个 segment 的 payload 回调函数，参数为 segment 的 payload 字节流。
   */
  function forEachHtraceSegment(traceBuffer, onSegmentPayload) {
    let offset = LONG_TRACE_HEADER_SIZE_BYTES;
    while (offset + LONG_TRACE_SEGMENT_LENGTH_BYTES <= traceBuffer.byteLength) {
      const segmentLength = traceBuffer.readUInt32LE(offset);
      offset += LONG_TRACE_SEGMENT_LENGTH_BYTES;
      if (segmentLength <= 0 || offset + segmentLength > traceBuffer.byteLength) {
        break;
      }
      onSegmentPayload(traceBuffer.subarray(offset, offset + segmentLength));
      offset += segmentLength;
    }
  }

  /**
   * 快速探测原始字节流中是否包含 nativehook 关键字，用于尽早短路无关文件。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @returns {boolean} - 是否包含 nativehook 关键字。
   */
  function hasNativehookFast(traceBuffer) {
    if (!traceBuffer || traceBuffer.byteLength <= LONG_TRACE_HEADER_SIZE_BYTES) {
      return false;
    }
    try {
      const needle = Buffer.from(LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK, LONG_TRACE_TEXT_ENCODING_UTF8);
      return traceBuffer.indexOf(needle, LONG_TRACE_HEADER_SIZE_BYTES) !== -1;
    } catch (e) {
      return false;
    }
  }

  /**
   * 仅保留 nativehook 插件段，降低后续 protobuf 解码的内存和 CPU 压力。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @returns {Buffer} - 过滤后的 trace 字节流，仅包含 nativehook 插件段。
   */
  function filterNativeHookSegments(traceBuffer) {
    // 检查 trace 输入是否为合法的 htrace 格式。
    if (!isValidHtraceHeader(traceBuffer)) {
      return traceBuffer;
    }
    // 加载 proto 元信息，确保后续 protobuf 解码正常。
    ensureLongTraceProtoLoaded();
    // 初始化结果数组，包含 header。
    const chunks = [traceBuffer.subarray(0, LONG_TRACE_HEADER_SIZE_BYTES)];
    let offset = LONG_TRACE_HEADER_SIZE_BYTES;
    // 遍历每个 segment，检查是否为 nativehook 插件段。
    while (offset + LONG_TRACE_SEGMENT_LENGTH_BYTES <= traceBuffer.byteLength) {
      const segmentLength = traceBuffer.readUInt32LE(offset);
      const segmentStart = offset;
      offset += LONG_TRACE_SEGMENT_LENGTH_BYTES;
      if (segmentLength <= 0 || offset + segmentLength > traceBuffer.byteLength) {
        break;
      }
      const segmentPayload = traceBuffer.subarray(offset, offset + segmentLength);
      try {
        const plugin = longTraceProfilerPluginDataType.decode(segmentPayload);
        if (plugin.name === LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK) {
          // 仅保留 nativehook 插件段。
          chunks.push(traceBuffer.subarray(segmentStart, offset + segmentLength));
        }
      } catch (e) {}
      offset += segmentLength;
    }
    // 拼接已缓存分片，合并为完整文件。
    return Buffer.concat(chunks);
  }

  /**
   * 扫描所有 nativehook 段，找出时间线最早的事件时间用于补丁对齐。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @returns {object} - 包含 clockId、tvSec、tvNsec 的对象，若未找到则返回 undefined 。
   */
  function findEarliestNativehookTimestamp(traceBuffer) {
    if (!isValidHtraceHeader(traceBuffer)) {
      return undefined;
    }
    ensureLongTraceProtoLoaded();
    let minTs;
    let minClockId;
    let minTvSec;
    let minTvNsec;
    forEachHtraceSegment(traceBuffer, (segmentPayload) => {
      let plugin;
      try {
        plugin = longTraceProfilerPluginDataType.decode(segmentPayload);
      } catch (e) {
        return;
      }
      if (plugin.name !== LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK) {
        return;
      }
      const tvSec = toBigIntU64(plugin.tvSec);
      const tvNsec = toBigIntU64(plugin.tvNsec);
      const ts = tvSec * NANOSECONDS_PER_SECOND + tvNsec;
      if (minTs === undefined || ts < minTs) {
        minTs = ts;
        minClockId = plugin.clockId;
        minTvSec = tvSec;
        minTvNsec = tvNsec;
      }
    });
    if (minTs === undefined) {
      return undefined;
    }
    return { clockId: minClockId, tvSec: minTvSec, tvNsec: minTvNsec };
  }

  /**
   * 根据 oneof 展开后的字段判断当前事件属于公共上下文还是统计事件。
   * @param {object} eventObj - 包含事件数据的对象。
   * @returns {string} - 事件类型，'commonData' 或 'statisticsEvent'，若无法判断则返回 undefined 。
   */
  function detectNativeHookEventField(eventObj) {
    if (
      eventObj.symbolTab ||
      eventObj.mapsInfo ||
      eventObj.threadNameMap ||
      eventObj.symbolName ||
      eventObj.filePath ||
      eventObj.tagEvent ||
      eventObj.frameMap ||
      eventObj.stackMap
    ) {
      return 'commonData';
    }
    if (eventObj.statisticsEvent) {
      return 'statisticsEvent';
    }
    return undefined;
  }

  /**
   * 解码单个 nativehook 段中的 BatchNativeHookData 事件数组。
   * @param {Buffer} segmentPayload - 输入的 trace 字节流。
   * @returns {Array} - 包含事件数据的数组，若解码失败则返回 null 。
   */
  function decodeNativeHookEvents(segmentPayload) {
    let plugin;
    try {
      // 按照ProfilerPluginDataType解码段数据
      plugin = longTraceProfilerPluginDataType.decode(segmentPayload);
    } catch (e) {
      return null;
    }
    // 检查是否为nativehook插件段
    if (plugin.name !== LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK) {
      return null;
    }
    let batch;
    try {
      // 按照BatchNativeHookDataType解码段数据
      batch = longTraceBatchNativeHookDataType.decode(plugin.data);
    } catch (e) {
      return null;
    }
    // 返回BatchNativeHookData事件数组
    return Array.isArray(batch.events) ? batch.events : [];
  }

  /**
   * 按 pid + callstackId 聚合统计事件，只保留最新且仍有残留分配的数据。
   * @param {Array} commonEvents - 包含公共事件数据的数组。
   * @param {Array} statisticsEvents - 包含统计事件数据的数组。
   * @returns {Array} - 合并后的公共事件数组，包含最新且仍有残留分配的统计事件。
   */
  function mergeStatistics(commonEvents, statisticsEvents) {
    // 检查统计事件数组是否为空
    if (statisticsEvents.length <= 0) {
      return commonEvents;
    }
    const latestByKey = new Map();
    // 遍历统计事件数组，根据 pid + callstackId 聚合最新事件。 latestByKey 用于存储每个 pid + callstackId 对应的最新事件
    for (const event of statisticsEvents) {
      const stats = event.statisticsEvent;
      if (!stats) {
        continue;
      }
      // 获取同一个统计事件的最新时间
      const key = `${Number(stats.pid)}-${Number(stats.callstackId)}`;
      const ts = toBigIntU64(event.tvSec) * NANOSECONDS_PER_SECOND + toBigIntU64(event.tvNsec);
      const prev = latestByKey.get(key);
      if (!prev || ts > prev.ts) {
        latestByKey.set(key, { ts, event });
      }
    }
    // 遍历 latestByKey，根据 applySize 和 releaseSize 判断是否仍有残留分配的数据。 如果 applySize 大于 releaseSize，说明仍有残留分配的数据
    for (const { event } of latestByKey.values()) {
      const stats = event.statisticsEvent;
      if (!stats) {
        continue;
      }
      const applySize = toBigIntU64(stats.applySize);
      const releaseSize = toBigIntU64(stats.releaseSize);
      if (applySize > releaseSize) {
        commonEvents.push(event);
      }
    }
    // 返回合并后的公共事件数组+最新且仍有残留分配的统计事件
    return commonEvents;
  }

  /**
   * 抽取跨页补丁所需的公共事件，为后续页构造 NativeHook 上下文。
   * @param {Buffer} traceBuffer - 输入的 trace 字节流。
   * @returns {Array} - 包含公共事件数据的数组。
   */
  function extractCommonEvents(traceBuffer) {
    if (!isValidHtraceHeader(traceBuffer)) {
      return [];
    }
    ensureLongTraceProtoLoaded();
    const commonEvents = [];
    const statisticsEvents = [];
    forEachHtraceSegment(traceBuffer, (segmentPayload) => {
      // 获取batchNativeHookData事件数组
      const events = decodeNativeHookEvents(segmentPayload);
      if (!events) {
        return;
      }
      // 遍历事件数组，根据事件类型分类
      for (const ev of events) {
        // 按照NativeHookDataType转换为事件数据对象
        const obj = longTraceNativeHookDataType.toObject(ev, { longs: String, bytes: Buffer, defaults: false });
        // 检查事件类型是否为commonData或statisticsEvent
        const field = detectNativeHookEventField(obj);
        if (!field) {
          continue;
        }
        if (field === 'statisticsEvent') {
          statisticsEvents.push(obj);
        } else {
          commonEvents.push(obj);
        }
      }
    });
    return mergeStatistics(commonEvents, statisticsEvents);
  }

  /**
   * 用目标页时间戳重写公共事件后重新编码为可插入 trace 的补丁段。
   * @param {Array} commonEvents - 包含公共事件数据的数组。
   * @param {string} clockId - 目标页的 clockId 字符串。
   * @param {string} tvSec - 目标页的时间戳秒部分字符串。
   * @param {string} tvNsec - 目标页的时间戳纳秒部分字符串。
   * @returns {Buffer} - 可插入 trace 的补丁段字节流。
   */
  function buildNativehookPatchPayload(commonEvents, clockId, tvSec, tvNsec) {
    // 加载 proto 元信息，确保后续 protobuf 编码正常。
    ensureLongTraceProtoLoaded();
    // 修改公共事件的时间戳为目标页时间戳。
    const tvSecStr = toBigIntU64(tvSec).toString();
    const tvNsecStr = toBigIntU64(tvNsec).toString();
    for (let i = 0; i < commonEvents.length; i++) {
      commonEvents[i].tvSec = tvSecStr;
      commonEvents[i].tvNsec = tvNsecStr;
    }
    // 编码公共事件为 protobuf 字节流。
    const batchBytes = longTraceBatchNativeHookDataType.encode({ events: commonEvents }).finish();
    const pluginBytes = longTraceProfilerPluginDataType.encode({
      name: LONG_TRACE_PLUGIN_NAME_NATIVE_HOOK,
      status: LONG_TRACE_PLUGIN_STATUS_OK,
      data: batchBytes,
      clockId: clockId,
      tvSec: tvSecStr,
      tvNsec: tvNsecStr,
      version: LONG_TRACE_PROTO_VERSION,
    }).finish();
    // 编码补丁段长度为 4 字节。
    // 合并补丁段长度与补丁段数据，返回可插入 trace 的补丁段字节流。
    const lenBuf = Buffer.alloc(LONG_TRACE_SEGMENT_LENGTH_BYTES);
    lenBuf.writeUInt32LE(pluginBytes.length, 0);
    return Buffer.concat([lenBuf, Buffer.from(pluginBytes)]);
  }

  return {
    buildNativehookPatchPayload,
    extractCommonEvents,
    filterNativeHookSegments,
    findEarliestNativehookTimestamp,
    hasNativehookFast,
    headerSizeBytes: LONG_TRACE_HEADER_SIZE_BYTES,
  };
}

module.exports = {
  createNativeHookProcessor,
};
