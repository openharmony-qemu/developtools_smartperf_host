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

#ifndef FILTER_FILTER_H
#define FILTER_FILTER_H

#include "filter_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class TraceStreamerFilters;
class FilterFilter : private FilterBase {
public:
    FilterFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    FilterFilter(const FilterFilter &) = delete;
    FilterFilter &operator=(const FilterFilter &) = delete;
    ~FilterFilter() override;

    uint32_t AddFilter(std::string type, std::string name, uint64_t arg);
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FILTER_FILTER_H
