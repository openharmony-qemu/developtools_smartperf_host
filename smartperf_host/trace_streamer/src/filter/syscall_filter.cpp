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

#include "config_filter.h"
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
    TS_LOGD("SysEnterEvent: SysEnter ID %u", syscallInfoRow.number);
    const auto &syscallNrSet = streamFilters_->configFilter_->GetSwitchConfig().SyscallsTsSet();
    if (syscallNrSet.find(syscallInfoRow.number) == syscallNrSet.end()) {
        return;
    }
    syscallEnterExitMap_[syscallInfoRow.itid] = syscallInfoRow;
}

void SyscallFilter::AppendSysCallInfo(uint32_t pid, uint32_t syscallNr, uint64_t ts, int64_t ret)
{
    TS_LOGD("SysExitEvent: SysEnter ID %u", syscallNr);
    auto syscallEnterExitItor = syscallEnterExitMap_.find(pid);
    if (syscallEnterExitItor != syscallEnterExitMap_.end()) {
        auto &syscallInfoRow = syscallEnterExitItor->second;
        if (syscallInfoRow.number == syscallNr && syscallInfoRow.ts <= ts) {
            syscallInfoRow.dur = ts - syscallInfoRow.ts;
            syscallInfoRow.ret = ret;
            syscallInfoRow.itid = streamFilters_->processFilter_->UpdateOrCreateThread(ts, pid);
            traceDataCache_->GetSysCallData()->AppendSysCallData(syscallInfoRow);
        }
        syscallEnterExitMap_.erase(pid);
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
