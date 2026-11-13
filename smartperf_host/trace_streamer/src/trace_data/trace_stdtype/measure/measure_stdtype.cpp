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

#include "measure_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t Filter::AppendNewFilterData(std::string type, std::string name, uint64_t sourceArgSetId)
{
    nameDeque_.emplace_back(name);
    sourceArgSetId_.emplace_back(sourceArgSetId);
    ids_.emplace_back(id_++);
    typeDeque_.emplace_back(type);
    return Size() - 1;
}

size_t Measure::AppendMeasureData(uint32_t type, uint64_t timeStamp, int64_t value, uint32_t filterId)
{
    valuesDeque_.emplace_back(value);
    filterIdDeque_.emplace_back(filterId);
    typeDeque_.emplace_back(type);
    timeStamps_.emplace_back(timeStamp);
    durDeque_.emplace_back(INVALID_UINT64);
    return Size() - 1;
}

void Measure::SetDur(uint32_t row, uint64_t timeStamp)
{
    durDeque_[row] = timeStamp - timeStamps_[row];
}

void Measure::UpdatePrevSizeAndAdapterRows(size_t size)
{
    readySize_ = size;
    // if filterIdToRow_.empty(), the readySize_ is all
    if (filterIdToRow_.empty()) {
        return;
    }
    // find minRowToBeUpdated
    auto minRowToBeUpdated = filterIdToRow_.begin()->second;
    for (const auto &pair : filterIdToRow_) {
        if (minRowToBeUpdated > pair.second) {
            minRowToBeUpdated = pair.second;
        }
    }
    readySize_ = minRowToBeUpdated;
    for (auto &pair : filterIdToRow_) {
        pair.second -= readySize_;
    }
}

size_t SysMeasureFilter::AppendNewFilter(uint64_t filterId, DataIndex type, DataIndex nameId)
{
    ids_.emplace_back(filterId);
    names_.emplace_back(nameId);
    types_.emplace_back(type);
    return ids_.size() - 1;
}
const std::deque<DataIndex> &SysMeasureFilter::NamesData() const
{
    return names_;
}

const std::deque<DataIndex> &SysMeasureFilter::TypesData() const
{
    return types_;
}

size_t ProcessMeasureFilter::AppendNewFilter(uint64_t id, DataIndex name, uint32_t internalPid)
{
    internalPids_.emplace_back(internalPid);
    ids_.emplace_back(id);
    names_.emplace_back(name);
    return Size() - 1;
}

size_t ClockEventData::AppendNewFilter(uint64_t id, DataIndex type, DataIndex name, uint64_t cpu)
{
    cpus_.emplace_back(cpu);
    ids_.emplace_back(id);
    types_.emplace_back(type);
    names_.emplace_back(name);
    return Size() - 1;
}
size_t ClkEventData::AppendNewFilter(uint64_t id, uint64_t rate, DataIndex name, uint64_t cpu)
{
    ids_.emplace_back(id);
    rates_.emplace_back(rate);
    names_.emplace_back(name);
    cpus_.emplace_back(cpu);
    return Size() - 1;
}
} // namespace TraceStdtype
} // namespace SysTuning
