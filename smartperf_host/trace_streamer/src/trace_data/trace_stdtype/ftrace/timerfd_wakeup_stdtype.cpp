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

#include "timerfd_wakeup_stdtype.h"
namespace SysTuning {
namespace TraceStdtype {
size_t TimerfdWakeup::AppendTimerfdWakeupData(const TimerfdWakeupRow &timerfdWakeupRow)
{
    ids_.emplace_back(id_++);
    timeStamps_.push_back(timerfdWakeupRow.timeStamp);
    pids_.push_back(timerfdWakeupRow.pid);
    tids_.push_back(timerfdWakeupRow.tid);
    threadNames_.push_back(timerfdWakeupRow.thread_name);
    intervals_.push_back(timerfdWakeupRow.interval);
    currMonos_.push_back(timerfdWakeupRow.curr_mono);
    expireMonos_.push_back(timerfdWakeupRow.expire_mono);
    return Size() - 1;
}
} // namespace TraceStdtype
} // namespace SysTuning
