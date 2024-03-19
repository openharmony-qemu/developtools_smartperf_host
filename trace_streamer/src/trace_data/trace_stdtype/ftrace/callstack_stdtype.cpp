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
#include "callstack_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t CallStack::AppendInternalAsyncSlice(uint64_t startT,
                                           uint64_t durationNs,
                                           InternalTid internalTid,
                                           DataIndex cat,
                                           uint16_t nameIdentify,
                                           DataIndex name,
                                           uint8_t depth,
                                           uint64_t cookid,
                                           const std::optional<uint64_t>& parentId)
{
    AppendCommonInfo(startT, durationNs, internalTid);
    AppendCallStack(cat, name, depth, parentId);
    AppendDistributeInfo();
    cookies_.emplace_back(cookid);
    ids_.emplace_back(id_++);
    identifys_.emplace_back(nameIdentify + depth);
    return Size() - 1;
}
size_t CallStack::AppendInternalSlice(uint64_t startT,
                                      uint64_t durationNs,
                                      InternalTid internalTid,
                                      DataIndex cat,
                                      uint16_t nameIdentify,
                                      DataIndex name,
                                      uint8_t depth,
                                      const std::optional<uint64_t>& parentId)
{
    AppendCommonInfo(startT, durationNs, internalTid);
    AppendCallStack(cat, name, depth, parentId);
    identifys_.emplace_back(nameIdentify + depth);
    ids_.emplace_back(id_++);
    cookies_.emplace_back(INVALID_UINT64);
    AppendDistributeInfo();
    return Size() - 1;
}

void CallStack::AppendCommonInfo(uint64_t startT, uint64_t durationNs, InternalTid internalTid)
{
    timeStamps_.emplace_back(startT);
    durs_.emplace_back(durationNs);
    callIds_.emplace_back(internalTid);
}
void CallStack::AppendCallStack(DataIndex cat, DataIndex name, uint8_t depth, std::optional<uint64_t> parentId)
{
    parentIds_.emplace_back(parentId);
    cats_.emplace_back(cat);
    names_.emplace_back(name);
    depths_.emplace_back(depth);
}
void CallStack::SetDistributeInfo(size_t index,
                                  const std::string& chainId,
                                  const std::string& spanId,
                                  const std::string& parentSpanId,
                                  const std::string& flag,
                                  const std::string& args)
{
    chainIds_[index] = chainId;
    spanIds_[index] = spanId;
    parentSpanIds_[index] = parentSpanId;
    flags_[index] = flag;
    args_[index] = args;
    argSet_[index] = INVALID_UINT32;
}
void CallStack::AppendDistributeInfo(const std::string& chainId,
                                     const std::string& spanId,
                                     const std::string& parentSpanId,
                                     const std::string& flag,
                                     const std::string& args)
{
    chainIds_.emplace_back(chainId);
    spanIds_.emplace_back(spanId);
    parentSpanIds_.emplace_back(parentSpanId);
    flags_.emplace_back(flag);
    args_.emplace_back(args);
    argSet_.emplace_back(INVALID_UINT32);
}
void CallStack::AppendDistributeInfo()
{
    chainIds_.emplace_back("");
    spanIds_.emplace_back("");
    parentSpanIds_.emplace_back("");
    flags_.emplace_back("");
    args_.emplace_back("");
    argSet_.emplace_back(INVALID_UINT32);
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
const std::deque<std::optional<uint64_t>>& CallStack::ParentIdData() const
{
    return parentIds_;
}
const std::deque<DataIndex>& CallStack::CatsData() const
{
    return cats_;
}
const std::deque<uint16_t>& CallStack::IdentifysData() const
{
    return identifys_;
}
const std::deque<DataIndex>& CallStack::NamesData() const
{
    return names_;
}
const std::deque<uint8_t>& CallStack::Depths() const
{
    return depths_;
}
const std::deque<uint64_t>& CallStack::Cookies() const
{
    return cookies_;
}
const std::deque<uint32_t>& CallStack::CallIds() const
{
    return callIds_;
}
const std::deque<std::string>& CallStack::ChainIds() const
{
    return chainIds_;
}
const std::deque<std::string>& CallStack::SpanIds() const
{
    return spanIds_;
}
const std::deque<std::string>& CallStack::ParentSpanIds() const
{
    return parentSpanIds_;
}
const std::deque<std::string>& CallStack::Flags() const
{
    return flags_;
}
const std::deque<std::string>& CallStack::ArgsData() const
{
    return args_;
}
const std::deque<uint32_t>& CallStack::ArgSetIdsData() const
{
    return argSet_;
}
} // namespace TraceStdtype
} // namespace SysTuning
