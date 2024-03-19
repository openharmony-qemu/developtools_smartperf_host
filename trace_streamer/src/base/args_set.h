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

#ifndef SRC_TRACE_BASE_ARGS_SET_H
#define SRC_TRACE_BASE_ARGS_SET_H

#include "ts_common.h"
#include <limits>
#include <string>
namespace SysTuning {
namespace TraceStreamer {
class ArgsSet {
public:
    ArgsSet() {}
    ~ArgsSet() {}
    ArgsSet& operator=(const ArgsSet& other)
    {
        this->valuesMap_ = other.valuesMap_;
        this->argSetId_ = other.argSetId_;
        this->sliceId_ = other.sliceId_;
        this->inserted_ = other.inserted_;
        return *this;
    }
    void AppendArg(DataIndex dataIndex, BaseDataType datatype, uint64_t value)
    {
        ArgsData data;
        data.type = datatype;
        data.value = value;
        valuesMap_.emplace(dataIndex, data);
    }
    std::map<DataIndex, ArgsData> valuesMap_;
    uint32_t argSetId_ = 0;
    uint32_t sliceId_ = 0;
    bool inserted_ = false;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
