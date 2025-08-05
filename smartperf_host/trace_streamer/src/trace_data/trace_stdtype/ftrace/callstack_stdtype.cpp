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
#include "callstack_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t CallStack::AppendInternalAsyncSlice(const CallStackInternalRow &callStackInternalRow,
                                           int64_t cookid,
                                           const std::optional<uint64_t> &parentId)
{
    AppendCommonInfo(callStackInternalRow.startT, callStackInternalRow.durationNs, callStackInternalRow.internalTid);
    AppendCallStack(callStackInternalRow.cat, callStackInternalRow.name, callStackInternalRow.depth,
                    callStackInternalRow.childCallid, parentId);
    AppendDistributeInfo();
    AppendTraceMetadata();
    cookies_.emplace_back(cookid);
    ids_.emplace_back(id_++);
    return Size() - 1;
}
size_t CallStack::AppendInternalSlice(const CallStackInternalRow &callStackInternalRow,
                                      const std::optional<uint64_t> &parentId)
{
    AppendCommonInfo(callStackInternalRow.startT, callStackInternalRow.durationNs, callStackInternalRow.internalTid);
    AppendCallStack(callStackInternalRow.cat, callStackInternalRow.name, callStackInternalRow.depth,
                    callStackInternalRow.childCallid, parentId);
    ids_.emplace_back(id_++);
    cookies_.emplace_back(INVALID_INT64);
    AppendDistributeInfo();
    AppendTraceMetadata();
    return Size() - 1;
}

void CallStack::AppendCommonInfo(uint64_t startT, uint64_t durationNs, InternalTid internalTid)
{
    timeStamps_.emplace_back(startT);
    durs_.emplace_back(durationNs);
    callIds_.emplace_back(internalTid);
    colorIndexs_.emplace_back(0);
}
void CallStack::AppendCallStack(DataIndex cat,
                                DataIndex name,
                                uint8_t depth,
                                std::optional<uint64_t> childCallid,
                                std::optional<uint64_t> parentId)
{
    parentIds_.emplace_back(parentId);
    cats_.emplace_back(cat);
    names_.emplace_back(name);
    depths_.emplace_back(depth);
    childCallid_.emplace_back(childCallid);
}
void CallStack::SetDistributeInfo(size_t index,
                                  const std::string &chainId,
                                  const std::string &spanId,
                                  const std::string &parentSpanId,
                                  const std::string &flag)
{
    chainIds_[index] = chainId;
    spanIds_[index] = spanId;
    parentSpanIds_[index] = parentSpanId;
    flags_[index] = flag;
    argSet_[index] = INVALID_UINT32;
}
void CallStack::SetTraceMetadata(size_t index,
                                 const std::string &traceLevel,
                                 const DataIndex &tag,
                                 const DataIndex &customArg,
                                 const DataIndex &customCategory)
{
    traceLevels_[index] = traceLevel;
    traceTags_[index] = tag;
    customArgs_[index] = customArg;
    customCategorys_[index] = customCategory;
}
void CallStack::AppendDistributeInfo()
{
    chainIds_.emplace_back("");
    spanIds_.emplace_back("");
    parentSpanIds_.emplace_back("");
    flags_.emplace_back("");
    argSet_.emplace_back(INVALID_UINT32);
}
void CallStack::AppendTraceMetadata()
{
    traceLevels_.emplace_back("");
    traceTags_.emplace_back(INVALID_UINT64);
    customArgs_.emplace_back(INVALID_UINT64);
    customCategorys_.emplace_back(INVALID_UINT64);
}
void CallStack::SetDuration(size_t index, uint64_t timeStamp)
{
    durs_[index] = timeStamp - timeStamps_[index];
}
void CallStack::SetDurationWithFlag(size_t index, uint64_t timeStamp)
{
    durs_[index] = timeStamp - timeStamps_[index];
    flags_[index] = "1";
}

void CallStack::SetFlag(size_t index, uint8_t flag)
{
    flags_[index] = std::to_string(flag);
}
void CallStack::SetDurationEx(size_t index, uint32_t dur)
{
    durs_[index] = dur;
}

void CallStack::SetIrqDurAndArg(size_t index, uint64_t timeStamp, uint32_t argSetId)
{
    SetDuration(index, timeStamp);
    argSet_[index] = argSetId;
}
void CallStack::SetTimeStamp(size_t index, uint64_t timeStamp)
{
    timeStamps_[index] = timeStamp;
}

void CallStack::SetDepth(size_t index, uint8_t depth)
{
    depths_[index] = depth;
}
void CallStack::SetArgSetId(size_t index, uint32_t argSetId)
{
    argSet_[index] = argSetId;
}
void CallStack::SetColorIndex(size_t index, uint32_t colorIndex)
{
    colorIndexs_[index] = colorIndex;
}
const std::deque<std::optional<uint64_t>> &CallStack::ParentIdData() const
{
    return parentIds_;
}
const std::deque<DataIndex> &CallStack::CatsData() const
{
    return cats_;
}
const std::deque<DataIndex> &CallStack::NamesData() const
{
    return names_;
}
const std::deque<uint8_t> &CallStack::Depths() const
{
    return depths_;
}
const std::deque<int64_t> &CallStack::Cookies() const
{
    return cookies_;
}
const std::deque<uint32_t> &CallStack::CallIds() const
{
    return callIds_;
}
const std::deque<uint32_t> &CallStack::ColorIndexs() const
{
    return colorIndexs_;
}
const std::deque<std::string> &CallStack::ChainIds() const
{
    return chainIds_;
}
const std::deque<std::string> &CallStack::SpanIds() const
{
    return spanIds_;
}
const std::deque<std::string> &CallStack::ParentSpanIds() const
{
    return parentSpanIds_;
}
const std::deque<std::string> &CallStack::Flags() const
{
    return flags_;
}
const std::deque<uint32_t> &CallStack::ArgSetIdsData() const
{
    return argSet_;
}
const std::deque<std::string> &CallStack::TraceLevelsData() const
{
    return traceLevels_;
}
const std::deque<DataIndex> &CallStack::TraceTagsData() const
{
    return traceTags_;
}
const std::deque<DataIndex> &CallStack::CustomCategorysData() const
{
    return customCategorys_;
}
const std::deque<DataIndex> &CallStack::CustomArgsData() const
{
    return customArgs_;
}
const std::deque<std::optional<uint64_t>> &CallStack::ChildCallidData() const
{
    return childCallid_;
}
} // namespace TraceStdtype
} // namespace SysTuning
