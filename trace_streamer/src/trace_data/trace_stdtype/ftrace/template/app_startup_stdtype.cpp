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
#include "app_startup_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t AppStartup::AppendNewData(uint32_t ipid,
                                 uint32_t tid,
                                 uint32_t callId,
                                 uint64_t startTime,
                                 uint64_t endTime,
                                 uint32_t startName,
                                 DataIndex packedName)
{
    ipids_.emplace_back(ipid);
    tids_.emplace_back(tid);
    callIds_.emplace_back(callId);
    startTimes_.emplace_back(startTime);
    endTimes_.emplace_back(endTime);
    startNames_.emplace_back(startName);
    packedNames_.emplace_back(packedName);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t>& AppStartup::Pids() const
{
    return ipids_;
}
const std::deque<uint32_t>& AppStartup::Tids() const
{
    return tids_;
}
const std::deque<uint32_t>& AppStartup::CallIds() const
{
    return callIds_;
}
const std::deque<uint64_t>& AppStartup::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t>& AppStartup::EndTimes() const
{
    return endTimes_;
}
const std::deque<uint32_t>& AppStartup::StartNames() const
{
    return startNames_;
}
const std::deque<DataIndex>& AppStartup::PackedNames() const
{
    return packedNames_;
}

size_t SoStaticInitalization::AppendNewData(uint32_t ipid,
                                            uint32_t tid,
                                            uint32_t callId,
                                            uint64_t startTime,
                                            uint64_t endTime,
                                            DataIndex soName,
                                            uint32_t depth)
{
    ipids_.emplace_back(ipid);
    tids_.emplace_back(tid);
    callIds_.emplace_back(callId);
    startTimes_.emplace_back(startTime);
    endTimes_.emplace_back(endTime);
    soNames_.emplace_back(soName);
    depths_.emplace_back(depth);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t>& SoStaticInitalization::Pids() const
{
    return ipids_;
}
const std::deque<uint32_t>& SoStaticInitalization::Tids() const
{
    return tids_;
}
const std::deque<uint32_t>& SoStaticInitalization::CallIds() const
{
    return callIds_;
}
const std::deque<uint64_t>& SoStaticInitalization::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t>& SoStaticInitalization::EndTimes() const
{
    return endTimes_;
}
const std::deque<DataIndex>& SoStaticInitalization::SoNames() const
{
    return soNames_;
}
const std::deque<uint32_t> SoStaticInitalization::Depths() const
{
    return depths_;
}
} // namespace TraceStdtype
} // namespace SysTuning
