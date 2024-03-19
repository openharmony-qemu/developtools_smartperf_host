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

#ifndef ARGS_FILTER_H
#define ARGS_FILTER_H

#include <map>
#include <string_view>
#include <tuple>

#include "args_set.h"
#include "double_map.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
class ArgsFilter : private FilterBase {
public:
    ArgsFilter(TraceDataCache*, const TraceStreamerFilters*);
    ArgsFilter(const ArgsFilter&) = delete;
    ArgsFilter& operator=(const ArgsFilter&) = delete;
    ~ArgsFilter() override;
    uint32_t NewArgs(const ArgsSet& args);
    uint32_t AppendArgs(const ArgsSet& args, const size_t argSetId);
    int32_t count_ = 0;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // ARGS_FILTER_H
