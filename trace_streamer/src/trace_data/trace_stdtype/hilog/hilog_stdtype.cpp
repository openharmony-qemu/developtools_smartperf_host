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
#include "hilog_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t LogInfo::AppendNewLogInfo(uint64_t seq,
                                 uint64_t timeStamp,
                                 uint32_t pid,
                                 uint32_t tid,
                                 DataIndex level,
                                 DataIndex tag,
                                 DataIndex context,
                                 uint64_t originTs)
{
    hilogLineSeqs_.emplace_back(seq);
    timeStamps_.emplace_back(timeStamp);
    pids_.emplace_back(pid);
    tids_.emplace_back(tid);
    levels_.emplace_back(level);
    tags_.emplace_back(tag);
    contexts_.emplace_back(context);
    originTs_.emplace_back(originTs);
    return Size() - 1;
}
const std::deque<uint64_t>& LogInfo::HilogLineSeqs() const
{
    return hilogLineSeqs_;
}
const std::deque<uint32_t>& LogInfo::Pids() const
{
    return pids_;
}
const std::deque<uint32_t>& LogInfo::Tids() const
{
    return tids_;
}
const std::deque<DataIndex>& LogInfo::Levels() const
{
    return levels_;
}
const std::deque<DataIndex>& LogInfo::Tags() const
{
    return tags_;
}
const std::deque<DataIndex>& LogInfo::Contexts() const
{
    return contexts_;
}
const std::deque<uint64_t>& LogInfo::OriginTimeStamData() const
{
    return originTs_;
}
} // namespace TraceStdtype
} // namespace SysTuning
