/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef SYS_EVENT_MEASURE_FILTER_H
#define SYS_EVENT_MEASURE_FILTER_H

#include <map>
#include <string_view>
#include <tuple>

#include "double_map.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
enum SysEventType { E_SYS_MEMORY_FILTER, E_SYS_VIRTUAL_MEMORY_FILTER, E_SYS_EVENT_SOURCE_FILTER };

class SystemEventMeasureFilter : private FilterBase {
public:
    SystemEventMeasureFilter(TraceDataCache* dataCache, const TraceStreamerFilters* filter, SysEventType);
    SystemEventMeasureFilter(const SystemEventMeasureFilter&) = delete;
    SystemEventMeasureFilter& operator=(const SystemEventMeasureFilter&) = delete;
    ~SystemEventMeasureFilter() override;
    void AppendNewMeasureData(DataIndex nameIndex, uint64_t timeStamp, int64_t value);
    uint32_t AppendNewMeasureFilter(DataIndex nameIndex);
    void Clear();

private:
    uint32_t GetOrCreateFilterId(DataIndex nameIndex);
    void AddCertainFilterId(DataIndex nameIndex, uint64_t filterId);
    std::map<DataIndex, uint64_t> tidStreamIdFilterIdMap_ = {};
    SysEventType filterType_;

    const std::map<SysEventType, std::string> filterTypeValue = {
        {E_SYS_MEMORY_FILTER, "sys_memory_filter"},
        {E_SYS_VIRTUAL_MEMORY_FILTER, "sys_virtual_memory_filter"},
        {E_SYS_EVENT_SOURCE_FILTER, "sys_event_source_filter"}};
    const DataIndex sysMemoryFilterId_ = traceDataCache_->GetDataIndex("sys_memory_filter");
    const DataIndex sysVMemoryFilterId_ = traceDataCache_->GetDataIndex("sys_virtual_memory_filter");
    const DataIndex sysEventSourceFilterId_ = traceDataCache_->GetDataIndex("sys_event_source_filter");
    std::map<uint32_t, uint32_t> filterIdToRow_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // SYS_EVENT_MEASURE_FILTER_H
