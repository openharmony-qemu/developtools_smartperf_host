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
 
#include "network_profiler_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {

size_t NetworkTimeInformationData::AppendNewData(const NetworkTimeInformationRow &row)
{
    ipids_.emplace_back(row.ipid);
    itids_.emplace_back(row.itid);
    beginTimes_.emplace_back(row.beginTime);
    dnsEndTimes_.emplace_back(row.dnsEndTime);
    tcpConnectEndTimes_.emplace_back(row.tcpConnectEndTime);
    tlsHandshakeEndTimes_.emplace_back(row.tlsHandshakeEndTime);
    firstSendTimes_.emplace_back(row.firstSendTime);
    firstRecvTimes_.emplace_back(row.firstRecvTime);
    endTimes_.emplace_back(row.endTime);
    cacheHits_.emplace_back(row.cacheHit);
    ids_.emplace_back(Size());
    return Size() - 1;
}

const std::deque<InternalPid> &NetworkTimeInformationData::Ipids() const
{
    return ipids_;
}

const std::deque<InternalTid> &NetworkTimeInformationData::Itids() const
{
    return itids_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::BeginTimes() const
{
    return beginTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::DnsEndTimes() const
{
    return dnsEndTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::TcpConnectEndTimes() const
{
    return tcpConnectEndTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::TlsHandshakeEndTimes() const
{
    return tlsHandshakeEndTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::FirstSendTimes() const
{
    return firstSendTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::FirstRecvTimes() const
{
    return firstRecvTimes_;
}

const std::deque<uint64_t> &NetworkTimeInformationData::EndTimes() const
{
    return endTimes_;
}

const std::deque<uint8_t> &NetworkTimeInformationData::CacheHits() const
{
    return cacheHits_;
}

size_t NetworkInformationData::AppendNewData(const NetworkInformationRow &row)
{
    requestIds_.emplace_back(row.requestId);
    protocols_.emplace_back(row.protocol);
    domains_.emplace_back(row.domain);
    requestUris_.emplace_back(row.requestUri);
    requestMethods_.emplace_back(row.requestMethod);
    requestHeaders_.emplace_back(row.requestHeader);
    responseHeaders_.emplace_back(row.responseHeader);
    responseEffectiveUrls_.emplace_back(row.responseEffectiveUrl);
    ipAddresses_.emplace_back(row.ipAddress);
    httpVersions_.emplace_back(row.httpVersion);
    responseReasonPhrases_.emplace_back(row.responseReasonPhrase);
    responseStatusCodes_.emplace_back(row.responseStatusCode);
    ids_.emplace_back(Size());
    return Size() - 1;
}

const std::deque<std::string> &NetworkInformationData::RequestIds() const
{
    return requestIds_;
}

const std::deque<std::string> &NetworkInformationData::Protocols() const
{
    return protocols_;
}

const std::deque<std::string> &NetworkInformationData::Domains() const
{
    return domains_;
}

const std::deque<std::string> &NetworkInformationData::RequestUris() const
{
    return requestUris_;
}

const std::deque<std::string> &NetworkInformationData::RequestMethods() const
{
    return requestMethods_;
}

const std::deque<std::string> &NetworkInformationData::RequestHeaders() const
{
    return requestHeaders_;
}

const std::deque<std::string> &NetworkInformationData::ResponseHeaders() const
{
    return responseHeaders_;
}

const std::deque<std::string> &NetworkInformationData::ResponseEffectiveUrls() const
{
    return responseEffectiveUrls_;
}

const std::deque<std::string> &NetworkInformationData::IpAddresses() const
{
    return ipAddresses_;
}

const std::deque<std::string> &NetworkInformationData::HttpVersions() const
{
    return httpVersions_;
}

const std::deque<std::string> &NetworkInformationData::ResponseReasonPhrases() const
{
    return responseReasonPhrases_;
}

const std::deque<uint32_t> &NetworkInformationData::ResponseStatusCodes() const
{
    return responseStatusCodes_;
}

} // namespace TraceStdtype
} // namespace SysTuning