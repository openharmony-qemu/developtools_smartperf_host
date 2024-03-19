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

#include "filter_filter.h"

#include "process_filter.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
FilterFilter::FilterFilter(TraceDataCache* dataCache, const TraceStreamerFilters* filter)
    : FilterBase(dataCache, filter)
{
}

FilterFilter::~FilterFilter() = default;

uint32_t FilterFilter::AddFilter(std::string type, std::string name, uint64_t arg)
{
    auto filter = traceDataCache_->GetFilterData();
    size_t id = filter->AppendNewFilterData(type, name, arg);
    return static_cast<uint32_t>(id);
}
} // namespace TraceStreamer
} // namespace SysTuning
