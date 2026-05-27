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

#include "pbreader_network_profiler_parser.h"
#include "clock_filter_ex.h"
#include "network_profiler.pbreader.h"
#include "network_profiler_config.pbreader.h"
#include "process_filter.h"
#include "stat_filter.h"

namespace SysTuning {
namespace TraceStreamer {

PbreaderNetworkProfilerParser::PbreaderNetworkProfilerParser(TraceDataCache *dataCache,
                                                             const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx)
{
}

PbreaderNetworkProfilerParser::~PbreaderNetworkProfilerParser()
{
    TS_LOGI("network profiler ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}

UrlParts PbreaderNetworkProfilerParser::ParseUrl(const std::string &requestUrl)
{
    UrlParts urlParts;
    size_t protocolPos = requestUrl.find("://");
    if (protocolPos != std::string::npos) {
        urlParts.protocol = requestUrl.substr(0, protocolPos);
        size_t domainStart = protocolPos + 3;
        size_t slashPos = requestUrl.find('/', domainStart);
        if (slashPos != std::string::npos) {
            urlParts.domain = requestUrl.substr(domainStart, slashPos - domainStart);
            urlParts.requestUri = requestUrl.substr(slashPos);
        } else {
            urlParts.domain = requestUrl.substr(domainStart);
            urlParts.requestUri = "";
        }
    } else {
        urlParts.protocol = "";
        urlParts.domain = "";
        urlParts.requestUri = requestUrl;
    }
    return urlParts;
}

uint8_t PbreaderNetworkProfilerParser::CalculateCacheHit(const TlvResult &result)
{
    if (result.beginTime == 0 && result.dnsEndTime == 0 && result.tcpConnectEndTime == 0 &&
        result.tlsHandshakeEndTime == 0 && result.firstSendTime == 0 && result.firstRecvTime == 0 &&
        result.endTime == 0) {
        return 1;
    }
    return 0;
}

void PbreaderNetworkProfilerParser::StoreTimeInformation(const TlvResult &result, uint32_t pid, uint32_t tid)
{
    InternalPid ipid = streamFilters_->processFilter_->GetInternalPid(pid);
    if (ipid == INVALID_IPID) {
        ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(pid, "");
    }
    InternalTid itid = streamFilters_->processFilter_->GetOrCreateThreadWithPid(tid, pid);

    NetworkTimeInformationRow row;
    row.ipid = ipid;
    row.itid = itid;
    row.beginTime = result.beginTime;
    row.dnsEndTime = result.dnsEndTime;
    row.tcpConnectEndTime = result.tcpConnectEndTime;
    row.tlsHandshakeEndTime = result.tlsHandshakeEndTime;
    row.firstSendTime = result.firstSendTime;
    row.firstRecvTime = result.firstRecvTime;
    row.endTime = result.endTime;
    row.cacheHit = CalculateCacheHit(result);

    traceDataCache_->GetNetworkTimeInformationData()->AppendNewData(row);
}

void PbreaderNetworkProfilerParser::StoreInformation(const TlvResult &result, const UrlParts &urlParts)
{
    NetworkInformationRow row;
    row.requestId = result.requestId;
    row.protocol = urlParts.protocol;
    row.domain = urlParts.domain;
    row.requestUri = urlParts.requestUri;
    row.requestMethod = result.requestMethod;
    row.requestHeader = result.requestHeader;
    row.responseHeader = result.responseHeader;
    row.responseEffectiveUrl = result.responseEffectiveUrl;
    row.ipAddress = result.ipAddress;
    row.httpVersion = result.httpVersion;
    row.responseReasonPhrase = result.responseReasonPhrase;
    row.responseStatusCode = result.responseStatusCode;

    traceDataCache_->GetNetworkInformationData()->AppendNewData(row);
}

void PbreaderNetworkProfilerParser::Parse(ProtoReader::BytesView tracePacket, uint64_t ts)
{
    ProtoReader::NetworkProfilerResult_Reader resultReader(tracePacket.data_, tracePacket.size_);
    if (!resultReader.has_network_event()) {
        return;
    }
    for (auto it = resultReader.network_event(); it; ++it) {
        ProtoReader::NetworkProfilerEvent_Reader eventReader(it->ToBytes());
        uint32_t pid = static_cast<uint32_t>(eventReader.pid());
        uint32_t tid = static_cast<uint32_t>(eventReader.tid());
        ProtoReader::BytesView payload = eventReader.payload();

        TlvResult result = tlvParser_.ParseAll(payload.data_, payload.size_);
        if (!result.parseSuccess) {
            TS_LOGW("Failed to parse NetworkProfiler TLV payload");
            continue;
        }

        UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);

        UrlParts urlParts = ParseUrl(result.requestUrl);
        StoreTimeInformation(result, pid, tid);
        StoreInformation(result, urlParts);
    }
}

void PbreaderNetworkProfilerParser::Finish()
{
    traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
}

void PbreaderNetworkProfilerParser::SetNetworkProfilerSrcClockid(PbreaderDataSegment &dataSeg)
{
    ProtoReader::NetworkProfilerConfig_Reader configReader(dataSeg.protoData);
    networkProfilerClockid_ = configReader.clock_id();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_NETWORK_PROFILER,
                                                                       networkProfilerClockid_);
    TS_LOGI("networkProfilerClockid_=%u", networkProfilerClockid_);
}

} // namespace TraceStreamer
} // namespace SysTuning