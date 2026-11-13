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
#include "app_startup_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t AppStartup::AppendNewData(const AppStartupRow &appStartupRow)
{
    ipids_.emplace_back(appStartupRow.ipid);
    tids_.emplace_back(appStartupRow.tid);
    callIds_.emplace_back(appStartupRow.callId);
    startTimes_.emplace_back(appStartupRow.startTime);
    endTimes_.emplace_back(appStartupRow.endTime);
    startNames_.emplace_back(appStartupRow.startName);
    packedNames_.emplace_back(appStartupRow.packedName);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &AppStartup::Pids() const
{
    return ipids_;
}
const std::deque<uint32_t> &AppStartup::Tids() const
{
    return tids_;
}
const std::deque<uint32_t> &AppStartup::CallIds() const
{
    return callIds_;
}
const std::deque<uint64_t> &AppStartup::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t> &AppStartup::EndTimes() const
{
    return endTimes_;
}
const std::deque<uint32_t> &AppStartup::StartNames() const
{
    return startNames_;
}
const std::deque<DataIndex> &AppStartup::PackedNames() const
{
    return packedNames_;
}

size_t SoStaticInitalization::AppendNewData(const SoStaticInitalizationRow &soStaticInitalizationRow)
{
    ipids_.emplace_back(soStaticInitalizationRow.ipid);
    tids_.emplace_back(soStaticInitalizationRow.tid);
    callIds_.emplace_back(soStaticInitalizationRow.callId);
    startTimes_.emplace_back(soStaticInitalizationRow.startTime);
    endTimes_.emplace_back(soStaticInitalizationRow.endTime);
    soNames_.emplace_back(soStaticInitalizationRow.soName);
    depths_.emplace_back(soStaticInitalizationRow.depth);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &SoStaticInitalization::Pids() const
{
    return ipids_;
}
const std::deque<uint32_t> &SoStaticInitalization::Tids() const
{
    return tids_;
}
const std::deque<uint32_t> &SoStaticInitalization::CallIds() const
{
    return callIds_;
}
const std::deque<uint64_t> &SoStaticInitalization::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t> &SoStaticInitalization::EndTimes() const
{
    return endTimes_;
}
const std::deque<DataIndex> &SoStaticInitalization::SoNames() const
{
    return soNames_;
}
const std::deque<uint32_t> SoStaticInitalization::Depths() const
{
    return depths_;
}
} // namespace TraceStdtype
} // namespace SysTuning
