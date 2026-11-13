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

#ifndef STAT_FILTER_H
#define STAT_FILTER_H

#include <map>
#include <string_view>
#include <tuple>

#include "double_map.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_config.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::TraceCfg;
class StatFilter : private FilterBase {
public:
    StatFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    StatFilter(const StatFilter &) = delete;
    StatFilter &operator=(const StatFilter &) = delete;
    ~StatFilter() override;
    void IncreaseStat(SupportedTraceEventType eventType, StatType type);
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // THREAD_MEASURE_FILTER_H
