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

#ifndef NETWORK_PROFILER_STDTYPE_H
#define NETWORK_PROFILER_STDTYPE_H

#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {

struct NetworkTimeInformationRow {
    uint64_t id = INVALID_UINT64;
    InternalPid ipid = INVALID_UINT32;
    InternalTid itid = INVALID_UINT32;
    uint64_t beginTime = INVALID_UINT64;
    uint64_t dnsEndTime = INVALID_UINT64;
    uint64_t tcpConnectEndTime = INVALID_UINT64;
    uint64_t tlsHandshakeEndTime = INVALID_UINT64;
    uint64_t firstSendTime = INVALID_UINT64;
    uint64_t firstRecvTime = INVALID_UINT64;
    uint64_t endTime = INVALID_UINT64;
    uint8_t cacheHit = INVALID_UINT8;
};

class NetworkTimeInformationData : public CacheBase {
public:
    size_t AppendNewData(const NetworkTimeInformationRow &row);
    const std::deque<InternalPid> &Ipids() const;
    const std::deque<InternalTid> &Itids() const;
    const std::deque<uint64_t> &BeginTimes() const;
    const std::deque<uint64_t> &DnsEndTimes() const;
    const std::deque<uint64_t> &TcpConnectEndTimes() const;
    const std::deque<uint64_t> &TlsHandshakeEndTimes() const;
    const std::deque<uint64_t> &FirstSendTimes() const;
    const std::deque<uint64_t> &FirstRecvTimes() const;
    const std::deque<uint64_t> &EndTimes() const;
    const std::deque<uint8_t> &CacheHits() const;
    void Clear() override
    {
        CacheBase::Clear();
        ipids_.clear();
        itids_.clear();
        beginTimes_.clear();
        dnsEndTimes_.clear();
        tcpConnectEndTimes_.clear();
        tlsHandshakeEndTimes_.clear();
        firstSendTimes_.clear();
        firstRecvTimes_.clear();
        endTimes_.clear();
        cacheHits_.clear();
    }

private:
    std::deque<InternalPid> ipids_ = {};
    std::deque<InternalTid> itids_ = {};
    std::deque<uint64_t> beginTimes_ = {};
    std::deque<uint64_t> dnsEndTimes_ = {};
    std::deque<uint64_t> tcpConnectEndTimes_ = {};
    std::deque<uint64_t> tlsHandshakeEndTimes_ = {};
    std::deque<uint64_t> firstSendTimes_ = {};
    std::deque<uint64_t> firstRecvTimes_ = {};
    std::deque<uint64_t> endTimes_ = {};
    std::deque<uint8_t> cacheHits_ = {};
};

struct NetworkInformationRow {
    uint64_t id = INVALID_UINT64;
    std::string requestId;
    std::string protocol;
    std::string domain;
    std::string requestUri;
    std::string requestMethod;
    std::string requestHeader;
    std::string responseHeader;
    std::string responseEffectiveUrl;
    std::string ipAddress;
    std::string httpVersion;
    std::string responseReasonPhrase;
    uint32_t responseStatusCode = INVALID_UINT32;
};

class NetworkInformationData : public CacheBase {
public:
    size_t AppendNewData(const NetworkInformationRow &row);
    const std::deque<std::string> &RequestIds() const;
    const std::deque<std::string> &Protocols() const;
    const std::deque<std::string> &Domains() const;
    const std::deque<std::string> &RequestUris() const;
    const std::deque<std::string> &RequestMethods() const;
    const std::deque<std::string> &RequestHeaders() const;
    const std::deque<std::string> &ResponseHeaders() const;
    const std::deque<std::string> &ResponseEffectiveUrls() const;
    const std::deque<std::string> &IpAddresses() const;
    const std::deque<std::string> &HttpVersions() const;
    const std::deque<std::string> &ResponseReasonPhrases() const;
    const std::deque<uint32_t> &ResponseStatusCodes() const;
    void Clear() override
    {
        CacheBase::Clear();
        requestIds_.clear();
        protocols_.clear();
        domains_.clear();
        requestUris_.clear();
        requestMethods_.clear();
        requestHeaders_.clear();
        responseHeaders_.clear();
        responseEffectiveUrls_.clear();
        ipAddresses_.clear();
        httpVersions_.clear();
        responseReasonPhrases_.clear();
        responseStatusCodes_.clear();
    }

private:
    std::deque<std::string> requestIds_ = {};
    std::deque<std::string> protocols_ = {};
    std::deque<std::string> domains_ = {};
    std::deque<std::string> requestUris_ = {};
    std::deque<std::string> requestMethods_ = {};
    std::deque<std::string> requestHeaders_ = {};
    std::deque<std::string> responseHeaders_ = {};
    std::deque<std::string> responseEffectiveUrls_ = {};
    std::deque<std::string> ipAddresses_ = {};
    std::deque<std::string> httpVersions_ = {};
    std::deque<std::string> responseReasonPhrases_ = {};
    std::deque<uint32_t> responseStatusCodes_ = {};
};

} // namespace TraceStdtype
} // namespace SysTuning

#endif // NETWORK_PROFILER_STDTYPE_H