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

#ifndef THREAD_MEASURE_FILTER_H
#define THREAD_MEASURE_FILTER_H

#include <map>
#include <string_view>
#include <tuple>

#include "double_map.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
enum FilterType {
    E_PROCESS_MEASURE_FILTER,
    E_CPU_MEASURE_FILTER,
    E_CLOCK_RATE_FILTER,
    E_CLOCK_ENABLE_FILTER,
    E_CLOCK_DISABLE_FILTER,
    E_CLK_RATE_FILTER,
    E_CLK_ENABLE_FILTER,
    E_CLK_DISABLE_FILTER
};

class MeasureFilter : private FilterBase {
public:
    MeasureFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter, FilterType);
    MeasureFilter(const MeasureFilter &) = delete;
    MeasureFilter &operator=(const MeasureFilter &) = delete;
    ~MeasureFilter() override;
    bool AppendNewMeasureData(uint64_t internalTid, DataIndex nameIndex, uint64_t timeStamp, int64_t value);
    uint32_t GetOrCreateFilterId(uint64_t internalTid, DataIndex nameIndex);

private:
    void AddCertainFilterId(uint64_t internalTid, DataIndex nameIndex, uint64_t filterId);
    DoubleMap<uint64_t, DataIndex, uint64_t> tidStreamIdFilterIdMap_;
    FilterType filterType_;

    const std::map<FilterType, std::string> filterTypeValue = {
        {E_PROCESS_MEASURE_FILTER, "process_measure_filter"}, {E_CPU_MEASURE_FILTER, "cpu_measure_filter"},
        {E_CLOCK_RATE_FILTER, "clock_rate_filter"},           {E_CLOCK_ENABLE_FILTER, "clock_enable_filter"},
        {E_CLOCK_DISABLE_FILTER, "clock_disable_filter"},     {E_CLK_RATE_FILTER, "clk_rate_filter"},
        {E_CLK_ENABLE_FILTER, "clk_enable_filter"},           {E_CLK_DISABLE_FILTER, "clk_disable_filter"}};
    const DataIndex clockSetRateDataIndex_ = traceDataCache_->GetDataIndex("clock_set_rate");
    const DataIndex clockEnableDataIndex_ = traceDataCache_->GetDataIndex("clock_enable");
    const DataIndex clockDisableDataIndex_ = traceDataCache_->GetDataIndex("clock_disable");
    const DataIndex clkSetRateDataIndex_ = traceDataCache_->GetDataIndex("clk_set_rate");
    const DataIndex clkEnableDataIndex_ = traceDataCache_->GetDataIndex("clk_enable");
    const DataIndex clkDisableDataIndex_ = traceDataCache_->GetDataIndex("clk_disable");
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // THREAD_MEASURE_FILTER_H
