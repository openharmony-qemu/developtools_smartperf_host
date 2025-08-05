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

#include <cstdint>
#include <map>
#include <string_view>
#include <tuple>

#include "double_map.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
enum class EnumMeasureFilter : uint16_t {
    PROCESS,
    CPU,
    CLOCK_RATE,
    CLOCK_ENABLE,
    CLOCK_DISABLE,
    CLK_RATE,
    CLK_ENABLE,
    CLK_DISABLE,
    XPOWER,
    MAX_COUNT,
};

class MeasureFilter : private FilterBase {
public:
    MeasureFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    MeasureFilter(const MeasureFilter &) = delete;
    MeasureFilter &operator=(const MeasureFilter &) = delete;
    ~MeasureFilter() override;
    bool AppendNewMeasureData(EnumMeasureFilter enumType,
                              uint64_t internalTid,
                              DataIndex nameIndex,
                              uint64_t timeStamp,
                              int64_t value);

private:
    uint32_t GetOrCreateFilterId(EnumMeasureFilter enumType, uint64_t internalTid, DataIndex nameIndex);
    void AddCertainFilterId(EnumMeasureFilter enumType, uint64_t internalTid, DataIndex nameIndex, uint64_t filterId);
    std::map<EnumMeasureFilter, DoubleMap<uint64_t, DataIndex, uint64_t>> filterTypeMap_;
    // DoubleMap<uint64_t, DataIndex, uint64_t> tidStreamIdFilterIdMap_;

    const std::map<EnumMeasureFilter, std::string> filterTypeValue = {
        {EnumMeasureFilter::PROCESS, "process_measure_filter"},
        {EnumMeasureFilter::CPU, "cpu_measure_filter"},
        {EnumMeasureFilter::CLOCK_RATE, "clock_rate_filter"},
        {EnumMeasureFilter::CLOCK_ENABLE, "clock_enable_filter"},
        {EnumMeasureFilter::CLOCK_DISABLE, "clock_disable_filter"},
        {EnumMeasureFilter::CLK_RATE, "clk_rate_filter"},
        {EnumMeasureFilter::CLK_ENABLE, "clk_enable_filter"},
        {EnumMeasureFilter::CLK_DISABLE, "clk_disable_filter"},
        {EnumMeasureFilter::XPOWER, "xpower_filter"},
    };
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
