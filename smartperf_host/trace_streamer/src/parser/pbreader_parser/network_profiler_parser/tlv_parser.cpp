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
    return static_cast<uint32_t>(data[offset + BYTE_OFFSET_0]) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_1]) << BYTE_SHIFT_8) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_2]) << BYTE_SHIFT_16) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_3]) << BYTE_SHIFT_24);
}

uint32_t TlvParser::ParseLength(const uint8_t *data, size_t offset)
{
    return static_cast<uint32_t>(data[offset + BYTE_OFFSET_0]) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_1]) << BYTE_SHIFT_8) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_2]) << BYTE_SHIFT_16) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_3]) << BYTE_SHIFT_24);
}

uint64_t TlvParser::ParseUint64Value(const uint8_t *data, size_t offset, uint32_t length)
{
    if (length != TLV_UINT64_LENGTH) {
        TS_LOGW("TlvParser: UINT64 length mismatch, expected 8, got %u", length);
        return 0;
    }
    return static_cast<uint64_t>(data[offset + BYTE_OFFSET_0]) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_1]) << BYTE_SHIFT_8) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_2]) << BYTE_SHIFT_16) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_3]) << BYTE_SHIFT_24) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_4]) << BYTE_SHIFT_32) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_5]) << BYTE_SHIFT_40) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_6]) << BYTE_SHIFT_48) |
           (static_cast<uint64_t>(data[offset + BYTE_OFFSET_7]) << BYTE_SHIFT_56);
}

uint32_t TlvParser::ParseUint32Value(const uint8_t *data, size_t offset, uint32_t length)
{
    if (length != TLV_UINT32_LENGTH) {
        TS_LOGW("TlvParser: UINT32 length mismatch, expected 4, got %u", length);
        return 0;
    }
    return static_cast<uint32_t>(data[offset + BYTE_OFFSET_0]) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_1]) << BYTE_SHIFT_8) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_2]) << BYTE_SHIFT_16) |
           (static_cast<uint32_t>(data[offset + BYTE_OFFSET_3]) << BYTE_SHIFT_24);
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
    while (offset + TLV_HEADER_SIZE <= size) {
        TlvItem item;
        item.type = ParseTag(data, offset);
        offset += TLV_TAG_SIZE;

        item.length = ParseLength(data, offset);
        offset += TLV_LENGTH_SIZE;

        if (offset + item.length > size) {
            TS_LOGW("TlvParser: incomplete TLV, offset=%zu, length=%u, size=%zu", offset, item.length, size);
            break;
        }

        if (item.length > 0) {
            item.value.resize(item.length);
            std::copy(data + offset, data + offset + item.length, item.value.data());
        }

        items.push_back(std::move(item));
        offset += item.length;
    }

    return items;
}

void TlvParser::ParseTimeFields(const std::vector<TlvItem> &items, TlvResult &result)
{
    if (items.size() > IDX_BEGIN_TIME && items[IDX_BEGIN_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.beginTime = ParseUint64Value(items[IDX_BEGIN_TIME].value.data(), 0, items[IDX_BEGIN_TIME].length);
    }
    if (items.size() > IDX_DNS_END_TIME && items[IDX_DNS_END_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.dnsEndTime = ParseUint64Value(items[IDX_DNS_END_TIME].value.data(), 0, items[IDX_DNS_END_TIME].length);
    }
    if (items.size() > IDX_TCP_CONNECT_END_TIME &&
        items[IDX_TCP_CONNECT_END_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.tcpConnectEndTime =
            ParseUint64Value(items[IDX_TCP_CONNECT_END_TIME].value.data(), 0, items[IDX_TCP_CONNECT_END_TIME].length);
    }
    if (items.size() > IDX_TLS_HANDSHAKE_END_TIME &&
        items[IDX_TLS_HANDSHAKE_END_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.tlsHandshakeEndTime =
            ParseUint64Value(items[IDX_TLS_HANDSHAKE_END_TIME].value.data(), 0, items[IDX_TLS_HANDSHAKE_END_TIME].length);
    }
    if (items.size() > IDX_FIRST_SEND_TIME &&
        items[IDX_FIRST_SEND_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.firstSendTime =
            ParseUint64Value(items[IDX_FIRST_SEND_TIME].value.data(), 0, items[IDX_FIRST_SEND_TIME].length);
    }
    if (items.size() > IDX_FIRST_RECV_TIME &&
        items[IDX_FIRST_RECV_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.firstRecvTime =
            ParseUint64Value(items[IDX_FIRST_RECV_TIME].value.data(), 0, items[IDX_FIRST_RECV_TIME].length);
    }
    if (items.size() > IDX_END_TIME && items[IDX_END_TIME].type == static_cast<uint32_t>(TlvType::UINT64)) {
        result.endTime = ParseUint64Value(items[IDX_END_TIME].value.data(), 0, items[IDX_END_TIME].length);
    }
}

void TlvParser::ParseStringFields(const std::vector<TlvItem> &items, TlvResult &result)
{
    if (items.size() > IDX_REQUEST_ID && items[IDX_REQUEST_ID].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestId = ParseStringValue(items[IDX_REQUEST_ID].value.data(), 0, items[IDX_REQUEST_ID].length);
    }
    if (items.size() > IDX_REQUEST_URL && items[IDX_REQUEST_URL].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestUrl = ParseStringValue(items[IDX_REQUEST_URL].value.data(), 0, items[IDX_REQUEST_URL].length);
    }
    if (items.size() > IDX_REQUEST_METHOD &&
        items[IDX_REQUEST_METHOD].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestMethod =
            ParseStringValue(items[IDX_REQUEST_METHOD].value.data(), 0, items[IDX_REQUEST_METHOD].length);
    }
    if (items.size() > IDX_REQUEST_HEADER &&
        items[IDX_REQUEST_HEADER].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.requestHeader =
            ParseStringValue(items[IDX_REQUEST_HEADER].value.data(), 0, items[IDX_REQUEST_HEADER].length);
    }
    if (items.size() > IDX_RESPONSE_STATUS_CODE &&
        items[IDX_RESPONSE_STATUS_CODE].type == static_cast<uint32_t>(TlvType::UINT32)) {
        result.responseStatusCode =
            ParseUint32Value(items[IDX_RESPONSE_STATUS_CODE].value.data(), 0, items[IDX_RESPONSE_STATUS_CODE].length);
    }
    if (items.size() > IDX_RESPONSE_HEADER &&
        items[IDX_RESPONSE_HEADER].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseHeader =
            ParseStringValue(items[IDX_RESPONSE_HEADER].value.data(), 0, items[IDX_RESPONSE_HEADER].length);
    }
    if (items.size() > IDX_RESPONSE_EFFECTIVE_URL &&
        items[IDX_RESPONSE_EFFECTIVE_URL].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseEffectiveUrl =
            ParseStringValue(items[IDX_RESPONSE_EFFECTIVE_URL].value.data(), 0, items[IDX_RESPONSE_EFFECTIVE_URL].length);
    }
    if (items.size() > IDX_IP_ADDRESS &&
        items[IDX_IP_ADDRESS].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.ipAddress =
            ParseStringValue(items[IDX_IP_ADDRESS].value.data(), 0, items[IDX_IP_ADDRESS].length);
    }
    if (items.size() > IDX_HTTP_VERSION &&
        items[IDX_HTTP_VERSION].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.httpVersion =
            ParseStringValue(items[IDX_HTTP_VERSION].value.data(), 0, items[IDX_HTTP_VERSION].length);
    }
    if (items.size() > IDX_RESPONSE_REASON_PHRASE &&
        items[IDX_RESPONSE_REASON_PHRASE].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseReasonPhrase =
            ParseStringValue(items[IDX_RESPONSE_REASON_PHRASE].value.data(), 0, items[IDX_RESPONSE_REASON_PHRASE].length);
    }
    if (items.size() > IDX_RESPONSE_BODY &&
        items[IDX_RESPONSE_BODY].type >= static_cast<uint32_t>(TlvType::STRING)) {
        result.responseBody =
            ParseStringValue(items[IDX_RESPONSE_BODY].value.data(), 0, items[IDX_RESPONSE_BODY].length);
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