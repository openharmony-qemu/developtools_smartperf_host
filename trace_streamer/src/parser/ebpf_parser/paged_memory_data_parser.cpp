/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
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
#include "paged_memory_data_parser.h"
#include "process_filter.h"
#include "stat_filter.h"
#include "string_to_numerical.h"
#include <cinttypes>

namespace SysTuning {
namespace TraceStreamer {
PagedMemoryDataParser::PagedMemoryDataParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx), EbpfBase(dataCache, ctx), timeParser_(std::make_unique<HtracePluginTimeParser>())
{
}
PagedMemoryDataParser::~PagedMemoryDataParser()
{
    TS_LOGI("EBPF paged memory data ts MIN:%llu, MAX:%llu",
            static_cast<unsigned long long>(timeParser_->GetPluginStartTime()),
            static_cast<unsigned long long>(timeParser_->GetPluginEndTime()));
}

int32_t PagedMemoryDataParser::PagingData(const PagedMemoryFixedHeader *pagedMemoryFixedHeadrAddr)
{
    // Parsing paging memory data
    auto type = pagedMemoryFixedHeadrAddr->type;
    // Init process name data
    const char *processName = reinterpret_cast<const char *>(pagedMemoryFixedHeadrAddr->comm);
    uint32_t ipid =
        streamFilters_->processFilter_->UpdateOrCreateProcessWithName(pagedMemoryFixedHeadrAddr->pid, processName);
    uint32_t itid = streamFilters_->processFilter_->GetOrCreateThreadWithPid(pagedMemoryFixedHeadrAddr->tid,
                                                                             pagedMemoryFixedHeadrAddr->pid);
    uint64_t startTs = pagedMemoryFixedHeadrAddr->startTime;
    uint64_t endTs = pagedMemoryFixedHeadrAddr->endTime;
    auto newStartTs = streamFilters_->clockFilter_->ToPrimaryTraceTime(clockId_, startTs);
    timeParser_->UpdatePluginTimeRange(clockId_, startTs, newStartTs);
    auto newEndTs = streamFilters_->clockFilter_->ToPrimaryTraceTime(clockId_, endTs);
    timeParser_->UpdatePluginTimeRange(clockId_, endTs, newEndTs);
    if (newStartTs > newEndTs) {
        TS_LOGE("startTs = %" PRIu64 ", endTs = %" PRIu64 ", newStartTs = %" PRIu64 ", newEndTs = %" PRIu64 "", startTs,
                endTs, newStartTs, newEndTs);
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_EBPF_PAGED_MEMORY, STAT_EVENT_DATA_INVALID);
        return -1;
    }
    uint64_t duration = newEndTs - newStartTs;

    auto addr = ConvertToHexTextIndex(pagedMemoryFixedHeadrAddr->addr);
    auto size = pagedMemoryFixedHeadrAddr->size;
    PagedMemorySampleDataRow pagedMemorySampleDataRow = {currentCallId_, type, ipid, newStartTs, newEndTs,
                                                         duration,       size, addr, itid};
    traceDataCache_->GetPagedMemorySampleData()->AppendNewData(pagedMemorySampleDataRow);
    return 1;
}

void PagedMemoryDataParser::ParsePagedMemoryEvent()
{
    for (auto mapItor = reader_->GetPagedMemoryMap().begin(); mapItor != reader_->GetPagedMemoryMap().end();
         mapItor++) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_EBPF_PAGED_MEMORY, STAT_EVENT_RECEIVED);
        auto pagedMemoryFixedHeadrAddr = mapItor->second;
        bool callIdExistFlag = false;

        auto userIpsAddr = reinterpret_cast<const uint64_t *>(pagedMemoryFixedHeadrAddr + 1);
        if (pagedMemoryFixedHeadrAddr->nips) {
            std::string ipsToStr(reinterpret_cast<const char *>(userIpsAddr),
                                 pagedMemoryFixedHeadrAddr->nips * SINGLE_IP_SIZE);
            auto ipsHashValue = hashFun_(ipsToStr);
            auto value = pidAndipsToCallId_.Find(pagedMemoryFixedHeadrAddr->pid, ipsHashValue);
            if (value != INVALID_UINT32) {
                callIdExistFlag = true;
                currentCallId_ = value;
            } else {
                pidAndipsToCallId_.Insert(pagedMemoryFixedHeadrAddr->pid, ipsHashValue, callChainId_);
                currentCallId_ = callChainId_++;
            }
        } else {
            currentCallId_ = INVALID_UINT32;
        }

        int32_t ret = PagingData(pagedMemoryFixedHeadrAddr);
        if (1 == ret && !callIdExistFlag) {
            ParseCallStackData(userIpsAddr, pagedMemoryFixedHeadrAddr->nips, pagedMemoryFixedHeadrAddr->pid,
                               currentCallId_);
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
