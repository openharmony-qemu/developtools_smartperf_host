/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "tlv_parser.h"
#include "base/log.h"

namespace SysTuning {
namespace TraceStreamer {

uint32_t TlvParser::ParseTag(const uint8_t *data, size_t offset)
{
    return static_cast<uint32_t>(data[offset]) |
           (static_cast<uint32_t>(data[offset + 1]) << 8) |
           (static_cast<uint32_t>(data[offset + 2]) << 16) |
           (static_cast<uint32_t>(data[offset + 3]) << 24);
}

uint32_t TlvParser::ParseLength(const uint8_t *data, size_t offset)
{
    return static_cast<uint32_t>(data[offset]) |
           (static_cast<uint32_t>(data[offset + 1]) << 8) |
           (static_cast<uint32_t>(data[offset + 2]) << 16) |
           (static_cast<uint32_t>(data[offset + 3]) << 24);
}

uint64_t TlvParser::ParseUint64Value(const uint8_t *data, size_t offset, uint32_t length)
{
    if (length != 8) {
        TS_LOGW("TlvParser: UINT64 length mismatch, expected 8, got %u", length);
        return 0;
    }
    return static_cast<uint64_t>(data[offset]) |
           (static_cast<uint64_t>(data[offset + 1]) << 8) |
           (static_cast<uint64_t>(data[offset + 2]) << 16) |
           (static_cast<uint64_t>(data[offset + 3]) << 24) |
           (static_cast<uint64_t>(data[offset + 4]) << 32) |
           (static_cast<uint64_t>(data[offset + 5]) << 40) |
           (static_cast<uint64_t>(data[offset + 6]) << 48) |
           (static_cast<uint64_t>(data[offset + 7]) << 56);
}

uint32_t TlvParser::ParseUint32Value(const uint8_t *data, size_t offset, uint32_t length)
{
    if (length != 4) {
        TS_LOGW("TlvParser: UINT32 length mismatch, expected 4, got %u", length);
        return 0;
    }
    return static_cast<uint32_t>(data[offset]) |
           (static_cast<uint32_t>(data[offset + 1]) << 8) |
           (static_cast<uint32_t>(data[offset + 2]) << 16) |
           (static_cast<uint32_t>(data[offset + 3]) << 24);
}

std::string TlvParser::ParseStringValue(const uint8_t *data, size_t offset, uint32_t length)
{
    return std::string(reinterpret_cast<const char *>(data + offset), length);
}

std::vector<TlvItem> TlvParser::ParseAllItems(const uint8_t *data, size_t size)
{
    std::vector<TlvItem> items;

    if (data == nullptr || size == 0) {
        return items;
    }

    size_t offset = 0;
    while (offset + 8 <= size) {
        TlvItem item;
        item.type = ParseTag(data, offset);
        offset += 4;

        item.length = ParseLength(data, offset);
        offset += 4;

        if (offset + item.length > size) {
            TS_LOGW("TlvParser: incomplete TLV, offset=%zu, length=%u, size=%zu", offset, item.length, size);
            break;
        }

        if (item.length > 0) {
            item.value.resize(item.length);
            std::memcpy(item.value.data(), data + offset, item.length);
        }

        items.push_back(std::move(item));
        offset += item.length;
    }

    return items;
}

void TlvParser::ParseTimeFields(const std::vector<TlvItem> &items, TlvResult &result)
{
    if (items.size() >= 1 && items[0].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.beginTime = ParseUint64Value(items[0].value.data(), 0, items[0].length);
    }
    if (items.size() >= 2 && items[1].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.dnsEndTime = ParseUint64Value(items[1].value.data(), 0, items[1].length);
    }
    if (items.size() >= 3 && items[2].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.tcpConnectEndTime = ParseUint64Value(items[2].value.data(), 0, items[2].length);
    }
    if (items.size() >= 4 && items[3].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.tlsHandshakeEndTime = ParseUint64Value(items[3].value.data(), 0, items[3].length);
    }
    if (items.size() >= 5 && items[4].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.firstSendTime = ParseUint64Value(items[4].value.data(), 0, items[4].length);
    }
    if (items.size() >= 6 && items[5].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.firstRecvTime = ParseUint64Value(items[5].value.data(), 0, items[5].length);
    }
    if (items.size() >= 7 && items[6].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.endTime = ParseUint64Value(items[6].value.data(), 0, items[6].length);
    }
}

void TlvParser::ParseStringFields(const std::vector<TlvItem> &items, TlvResult &result)
{
    if (items.size() >= 8 && items[7].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestId = ParseStringValue(items[7].value.data(), 0, items[7].length);
    }
    if (items.size() >= 9 && items[8].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestUrl = ParseStringValue(items[8].value.data(), 0, items[8].length);
    }
    if (items.size() >= 10 && items[9].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestMethod = ParseStringValue(items[9].value.data(), 0, items[9].length);
    }
    if (items.size() >= 11 && items[10].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestHeader = ParseStringValue(items[10].value.data(), 0, items[10].length);
    }
    if (items.size() >= 12 && items[11].type == static_cast<uint32_t>(TlvType::UINT32)) {
        result.responseStatusCode = ParseUint32Value(items[11].value.data(), 0, items[11].length);
    }
    if (items.size() >= 13 && items[12].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseHeader = ParseStringValue(items[12].value.data(), 0, items[12].length);
    }
    if (items.size() >= 14 && items[13].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseEffectiveUrl = ParseStringValue(items[13].value.data(), 0, items[13].length);
    }
    if (items.size() >= 15 && items[14].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.ipAddress = ParseStringValue(items[14].value.data(), 0, items[14].length);
    }
    if (items.size() >= 16 && items[15].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.httpVersion = ParseStringValue(items[15].value.data(), 0, items[15].length);
    }
    if (items.size() >= 17 && items[16].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseReasonPhrase = ParseStringValue(items[16].value.data(), 0, items[16].length);
    }
    if (items.size() >= 18 && items[17].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseBody = ParseStringValue(items[17].value.data(), 0, items[17].length);
    }
}

TlvResult TlvParser::ParseAll(const uint8_t *data, size_t size)
{
    TlvResult result;

    if (data == nullptr || size == 0) {
        TS_LOGW("TlvParser: empty or null payload");
        result.parseSuccess = false;
        return result;
    }

    TS_LOGI("TlvParser: payload size=%zu", size);

    std::vector<TlvItem> items = ParseAllItems(data, size);

    TS_LOGI("TlvParser: parsed %zu TLV items", items.size());

    if (items.empty()) {
        TS_LOGW("TlvParser: no valid TLV items parsed");
        result.parseSuccess = false;
        return result;
    }

    ParseTimeFields(items, result);
    ParseStringFields(items, result);

    return result;
}

} // namespace TraceStreamer
} // namespace SysTuning