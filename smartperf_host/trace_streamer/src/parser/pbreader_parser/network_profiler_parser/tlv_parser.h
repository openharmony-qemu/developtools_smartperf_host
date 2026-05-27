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

#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace SysTuning {
namespace TraceStreamer {

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