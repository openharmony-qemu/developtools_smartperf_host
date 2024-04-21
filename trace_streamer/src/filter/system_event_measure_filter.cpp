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

#include "system_event_measure_filter.h"
#include "filter_filter.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
SystemEventMeasureFilter::SystemEventMeasureFilter(TraceDataCache *dataCache,
                                                   const TraceStreamerFilters *filter,
                                                   SysEventType e)
    : FilterBase(dataCache, filter), filterType_(e)
{
}

SystemEventMeasureFilter::~SystemEventMeasureFilter() {}

void SystemEventMeasureFilter::AppendNewMeasureData(DataIndex nameIndex, uint64_t timeStamp, int64_t value)
{
    auto filterId = GetOrCreateFilterId(nameIndex);
    auto row = traceDataCache_->GetSysMemMeasureData()->AppendMeasureData(0, timeStamp, value, filterId);
    // if the filterId ever exists
    if (filterIdToRow_.count(filterId)) {
        traceDataCache_->GetSysMemMeasureData()->SetDur(filterIdToRow_.at(filterId), timeStamp);
        filterIdToRow_.at(filterId) = row;
    } else {
        filterIdToRow_.insert(std::make_pair(filterId, row));
    }
}
uint32_t SystemEventMeasureFilter::AppendNewMeasureFilter(DataIndex nameIndex)
{
    return GetOrCreateFilterId(nameIndex);
}
uint32_t SystemEventMeasureFilter::GetOrCreateFilterId(DataIndex nameIndex)
{
    auto filterId = tidStreamIdFilterIdMap_.find(nameIndex);
    if (filterId != tidStreamIdFilterIdMap_.end()) {
        return static_cast<uint32_t>((tidStreamIdFilterIdMap_.at(nameIndex)));
    }

    uint32_t newFilterId = streamFilters_->filterFilter_->AddFilter(
        filterTypeValue.at(filterType_), traceDataCache_->GetDataFromDict(nameIndex), INVALID_UINT64);
    AddCertainFilterId(nameIndex, newFilterId);
    return newFilterId;
}

void SystemEventMeasureFilter::AddCertainFilterId(DataIndex nameIndex, uint64_t filterId)
{
    tidStreamIdFilterIdMap_.insert(std::make_pair(nameIndex, filterId));

    if (filterType_ == E_SYS_MEMORY_FILTER) {
        traceDataCache_->GetSysMeasureFilterData()->AppendNewFilter(filterId, sysMemoryFilterId_,
                                                                    static_cast<uint32_t>(nameIndex));
    } else if (filterType_ == E_SYS_VIRTUAL_MEMORY_FILTER) {
        traceDataCache_->GetSysMeasureFilterData()->AppendNewFilter(filterId, sysVMemoryFilterId_,
                                                                    static_cast<uint32_t>(nameIndex));
    } else if (filterType_ == E_SYS_EVENT_SOURCE_FILTER) {
        traceDataCache_->GetSysMeasureFilterData()->AppendNewFilter(filterId, sysEventSourceFilterId_,
                                                                    static_cast<uint32_t>(nameIndex));
    }
}

void SystemEventMeasureFilter::Clear()
{
    tidStreamIdFilterIdMap_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
