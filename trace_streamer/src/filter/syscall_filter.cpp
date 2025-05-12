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

#include "syscall_filter.h"

#include "process_filter.h"

namespace SysTuning {
namespace TraceStreamer {
SyscallFilter::SyscallFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
}
SyscallFilter::~SyscallFilter() {}

void SyscallFilter::UpdataSyscallEnterExitMap(const SyscallInfoRow &syscallInfoRow)
{
    TS_LOGI("SysEnterEvent: SysEnter ID %u", syscallInfoRow.number);
    auto key = std::make_pair(syscallInfoRow.itid, syscallInfoRow.number);
    syscallEnterExitMap_[key] = syscallInfoRow;
}

void SyscallFilter::AppendSysCallInfo(uint32_t pid, uint32_t syscallNr, uint64_t ts, int64_t ret)
{
    TS_LOGI("SysExitEvent: SysEnter ID %u", syscallNr);
    auto key = std::make_pair(pid, syscallNr);
    auto syscallEnterExitItor = syscallEnterExitMap_.find(key);
    if (syscallEnterExitItor != syscallEnterExitMap_.end() && syscallEnterExitItor->second.ts <= ts) {
        uint64_t dur = ts - syscallEnterExitItor->second.ts;
        syscallEnterExitItor->second.dur = dur;
        syscallEnterExitItor->second.ret = ret;
        syscallEnterExitItor->second.itid = streamFilters_->processFilter_->UpdateOrCreateThread(ts, pid);
        traceDataCache_->GetSysCallData()->AppendSysCallData(syscallEnterExitItor->second);
        syscallEnterExitMap_.erase(key);
    } else {
        TS_LOGW("SysExitEvent: No matching sysExit event found for syscallID = %u.", syscallNr);
    }
}

void SyscallFilter::Clear()
{
    syscallEnterExitMap_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
