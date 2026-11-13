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

#include "measure_filter.h"
#include "filter_filter.h"
#include "measure_stdtype.h"
#include "ts_common.h"
#include <cstdint>

namespace SysTuning {
namespace TraceStreamer {
MeasureFilter::MeasureFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
    for (uint16_t i = 0; i < static_cast<uint16_t>(EnumMeasureFilter::MAX_COUNT); ++i) {
        filterTypeMap_.emplace(static_cast<EnumMeasureFilter>(i), INVALID_UINT64);
    }
}

MeasureFilter::~MeasureFilter() {}

bool MeasureFilter::AppendNewMeasureData(EnumMeasureFilter enumType,
                                         uint64_t internalTid,
                                         DataIndex nameIndex,
                                         uint64_t timeStamp,
                                         int64_t value)
{
    auto filterId = GetOrCreateFilterId(enumType, internalTid, nameIndex);
    Measure *measurePtr = nullptr;
    if (enumType == EnumMeasureFilter::PROCESS) {
        measurePtr = traceDataCache_->GetProcessMeasureData();
    } else if (enumType == EnumMeasureFilter::XPOWER) {
        measurePtr = traceDataCache_->GetXpowerMeasureData();
    } else {
        measurePtr = traceDataCache_->GetMeasureData();
    }
    if (!measurePtr) {
        return false;
    }
    auto row = measurePtr->AppendMeasureData(0, timeStamp, value, filterId);
    // if the filterId ever exists
    auto *filterIdToRow = measurePtr->GetFilterIdToRow();
    if (filterIdToRow->count(filterId)) {
        measurePtr->SetDur(filterIdToRow->at(filterId), timeStamp);
        filterIdToRow->at(filterId) = row;
    } else {
        filterIdToRow->insert(std::make_pair(filterId, row));
    }
    return true;
}
uint32_t MeasureFilter::GetOrCreateFilterId(EnumMeasureFilter enumType, uint64_t internalTid, DataIndex nameIndex)
{
    auto &tidStreamIdFilterIdMap = filterTypeMap_.at(enumType);
    auto filterId = tidStreamIdFilterIdMap.Find(internalTid, nameIndex);
    if (filterId != INVALID_UINT64) {
        return static_cast<uint32_t>(filterId);
    }

    uint32_t newFilterId = streamFilters_->filterFilter_->AddFilter(
        filterTypeValue.at(enumType), traceDataCache_->GetDataFromDict(nameIndex), internalTid);
    tidStreamIdFilterIdMap.Insert(internalTid, nameIndex, newFilterId);
    AddCertainFilterId(enumType, internalTid, nameIndex, newFilterId);
    return newFilterId;
}

void MeasureFilter::AddCertainFilterId(EnumMeasureFilter enumType,
                                       uint64_t internalTid,
                                       DataIndex nameIndex,
                                       uint64_t filterId)
{
    if (enumType == EnumMeasureFilter::PROCESS) {
        traceDataCache_->GetProcessMeasureFilterData()->AppendNewFilter(
            static_cast<uint32_t>(filterId), static_cast<uint32_t>(nameIndex), static_cast<uint32_t>(internalTid));
    } else if (enumType == EnumMeasureFilter::CPU) {
        traceDataCache_->GetCpuMeasuresData()->AppendNewFilter(filterId, static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLOCK_RATE) {
        traceDataCache_->GetClockEventFilterData()->AppendNewFilter(filterId, clockSetRateDataIndex_,
                                                                    static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLOCK_ENABLE) {
        traceDataCache_->GetClockEventFilterData()->AppendNewFilter(filterId, clockEnableDataIndex_,
                                                                    static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLOCK_DISABLE) {
        traceDataCache_->GetClockEventFilterData()->AppendNewFilter(filterId, clockDisableDataIndex_,
                                                                    static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLK_RATE) {
        traceDataCache_->GetClkEventFilterData()->AppendNewFilter(filterId, clkSetRateDataIndex_,
                                                                  static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLK_ENABLE) {
        traceDataCache_->GetClkEventFilterData()->AppendNewFilter(filterId, clkEnableDataIndex_,
                                                                  static_cast<uint32_t>(nameIndex), internalTid);
    } else if (enumType == EnumMeasureFilter::CLK_DISABLE) {
        traceDataCache_->GetClkEventFilterData()->AppendNewFilter(filterId, clkDisableDataIndex_,
                                                                  static_cast<uint32_t>(nameIndex), internalTid);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
