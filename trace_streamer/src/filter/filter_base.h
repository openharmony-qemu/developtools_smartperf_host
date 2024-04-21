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

#ifndef FILTER_BASE_H
#define FILTER_BASE_H
#include <string_view>
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
class FilterBase {
public:
    FilterBase(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    FilterBase(const FilterBase &) = delete;
    FilterBase &operator=(const FilterBase &) = delete;
    virtual ~FilterBase();

public:
    const TraceStreamerFilters *streamFilters_ = {};
    TraceDataCache *traceDataCache_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FILTER_BASE_H
