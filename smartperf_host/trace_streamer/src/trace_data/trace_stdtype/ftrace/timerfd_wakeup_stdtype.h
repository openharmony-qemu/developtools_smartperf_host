/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
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

#ifndef TIMERFD_WAKEUP_STDTYPE_H
#define TIMERFD_WAKEUP_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
struct TimerfdWakeupRow {
    uint64_t timeStamp = INVALID_UINT64;
    int32_t pid = INVALID_UINT32;
    int32_t tid = INVALID_UINT32;
    DataIndex thread_name = INVALID_DATAINDEX;
    uint64_t interval = INVALID_INT64;
    uint64_t curr_mono = INVALID_INT64;
    uint64_t expire_mono = INVALID_INT64;
};
class TimerfdWakeup : public CacheBase, public BatchCacheBase {
public:
    size_t AppendTimerfdWakeupData(const TimerfdWakeupRow &timerfdWakeupRow);
    const std::deque<int32_t> &PidsData() const
    {
        return pids_;
    }
    const std::deque<int32_t> &TidsData() const
    {
        return tids_;
    }
    const std::deque<uint64_t> &IntervalsData() const
    {
        return intervals_;
    }
    const std::deque<uint64_t> &CurrMonosData() const
    {
        return currMonos_;
    }
    const std::deque<uint64_t> &ExpireMonosData() const
    {
        return expireMonos_;
    }
    const std::deque<DataIndex> &ThreadNamesData() const
    {
        return threadNames_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        pids_.clear();
        tids_.clear();
        intervals_.clear();
        currMonos_.clear();
        expireMonos_.clear();
        threadNames_.clear();
    }

    void ClearExportedData() override
    {
        EraseElements(ids_, timeStamps_, pids_, tids_, intervals_, currMonos_, expireMonos_, threadNames_);
    }

private:
    std::deque<int32_t> pids_;
    std::deque<int32_t> tids_;
    std::deque<uint64_t> intervals_;
    std::deque<uint64_t> currMonos_;
    std::deque<uint64_t> expireMonos_;
    std::deque<DataIndex> threadNames_;
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // TIMERFD_WAKEUP_STDTYPE_H