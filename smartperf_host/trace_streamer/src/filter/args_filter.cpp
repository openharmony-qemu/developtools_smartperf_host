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

#include "args_filter.h"
#include "filter_filter.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
ArgsFilter::ArgsFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter) : FilterBase(dataCache, filter)
{
    (void)traceDataCache_->GetDataTypeData()->UpdateNewDataType(BASE_DATA_TYPE_INT,
                                                                traceDataCache_->GetDataIndex("int32_t"));
    (void)traceDataCache_->GetDataTypeData()->UpdateNewDataType(BASE_DATA_TYPE_STRING,
                                                                traceDataCache_->GetDataIndex("string"));
    (void)traceDataCache_->GetDataTypeData()->UpdateNewDataType(BASE_DATA_TYPE_DOUBLE,
                                                                traceDataCache_->GetDataIndex("double"));
    (void)traceDataCache_->GetDataTypeData()->UpdateNewDataType(BASE_DATA_TYPE_BOOLEAN,
                                                                traceDataCache_->GetDataIndex("boolean"));
}

ArgsFilter::~ArgsFilter() {}

uint32_t ArgsFilter::NewArgs(const ArgsSet &args)
{
    auto argSet = traceDataCache_->GetArgSetData();
    for (auto it = args.valuesMap_.begin(); it != args.valuesMap_.end(); it++) {
        (void)argSet->AppendNewArg(it->first, it->second.type, it->second.value, count_);
    }
    count_++;
    return count_ - 1;
}
uint32_t ArgsFilter::AppendArgs(const ArgsSet &args, const size_t argSetId)
{
    auto argSet = traceDataCache_->GetArgSetData();
    for (auto it = args.valuesMap_.begin(); it != args.valuesMap_.end(); it++) {
        (void)argSet->AppendNewArg(it->first, it->second.type, it->second.value, argSetId);
    }
    return count_ - 1;
}
} // namespace TraceStreamer
} // namespace SysTuning
