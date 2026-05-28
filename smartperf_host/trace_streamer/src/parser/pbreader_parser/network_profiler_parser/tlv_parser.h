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

#ifndef TLV_PARSER_H
#define TLV_PARSER_H

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace SysTuning {
namespace TraceStreamer {

constexpr size_t BYTE_SHIFT_8 = 8;
constexpr size_t BYTE_SHIFT_16 = 16;
constexpr size_t BYTE_SHIFT_24 = 24;
constexpr size_t BYTE_SHIFT_32 = 32;
constexpr size_t BYTE_SHIFT_40 = 40;
constexpr size_t BYTE_SHIFT_48 = 48;
constexpr size_t BYTE_SHIFT_56 = 56;

constexpr size_t BYTE_OFFSET_0 = 0;
constexpr size_t BYTE_OFFSET_1 = 1;
constexpr size_t BYTE_OFFSET_2 = 2;
constexpr size_t BYTE_OFFSET_3 = 3;
constexpr size_t BYTE_OFFSET_4 = 4;
constexpr size_t BYTE_OFFSET_5 = 5;
constexpr size_t BYTE_OFFSET_6 = 6;
constexpr size_t BYTE_OFFSET_7 = 7;

constexpr size_t TLV_TAG_SIZE = 4;
constexpr size_t TLV_LENGTH_SIZE = 4;
constexpr size_t TLV_HEADER_SIZE = TLV_TAG_SIZE + TLV_LENGTH_SIZE;

constexpr uint32_t TLV_UINT64_LENGTH = 8;
constexpr uint32_t TLV_UINT32_LENGTH = 4;

constexpr size_t IDX_BEGIN_TIME = 0;
constexpr size_t IDX_DNS_END_TIME = 1;
constexpr size_t IDX_TCP_CONNECT_END_TIME = 2;
constexpr size_t IDX_TLS_HANDSHAKE_END_TIME = 3;
constexpr size_t IDX_FIRST_SEND_TIME = 4;
constexpr size_t IDX_FIRST_RECV_TIME = 5;
constexpr size_t IDX_END_TIME = 6;
constexpr size_t IDX_REQUEST_ID = 7;
constexpr size_t IDX_REQUEST_URL = 8;
constexpr size_t IDX_REQUEST_METHOD = 9;
constexpr size_t IDX_REQUEST_HEADER = 10;
constexpr size_t IDX_RESPONSE_STATUS_CODE = 11;
constexpr size_t IDX_RESPONSE_HEADER = 12;
constexpr size_t IDX_RESPONSE_EFFECTIVE_URL = 13;
constexpr size_t IDX_IP_ADDRESS = 14;
constexpr size_t IDX_HTTP_VERSION = 15;
constexpr size_t IDX_RESPONSE_REASON_PHRASE = 16;
constexpr size_t IDX_RESPONSE_BODY = 17;

enum class TlvType : uint32_t {
    UINT64 = 1,
    UINT32 = 2,
    STRING = 3
};

struct TlvItem {
    uint32_t type;
    uint32_t length;
    std::vector<uint8_t> value;
};

struct TlvResult {
    uint64_t beginTime = 0;
    uint64_t dnsEndTime = 0;
    uint64_t tcpConnectEndTime = 0;
    uint64_t tlsHandshakeEndTime = 0;
    uint64_t firstSendTime = 0;
    uint64_t firstRecvTime = 0;
    uint64_t endTime = 0;
    std::string requestId;
    std::string requestUrl;
    std::string requestMethod;
    std::string requestHeader;
    uint32_t responseStatusCode = 0;
    std::string responseHeader;
    std::string responseEffectiveUrl;
    std::string ipAddress;
    std::string httpVersion;
    std::string responseReasonPhrase;
    std::string responseBody;
    bool parseSuccess = true;
};

class TlvParser {
public:
    TlvParser() = default;
    ~TlvParser() = default;

    TlvResult ParseAll(const uint8_t *data, size_t size);

private:
    std::vector<TlvItem> ParseAllItems(const uint8_t *data, size_t size);
    uint32_t ParseTag(const uint8_t *data, size_t offset);
    uint32_t ParseLength(const uint8_t *data, size_t offset);
    uint64_t ParseUint64Value(const uint8_t *data, size_t offset, uint32_t length);
    uint32_t ParseUint32Value(const uint8_t *data, size_t offset, uint32_t length);
    std::string ParseStringValue(const uint8_t *data, size_t offset, uint32_t length);
    void ParseTimeFields(const std::vector<TlvItem> &items, TlvResult &result);
    void ParseStringFields(const std::vector<TlvItem> &items, TlvResult &result);
};

} // namespace TraceStreamer
} // namespace SysTuning

#endif // TLV_PARSER_H