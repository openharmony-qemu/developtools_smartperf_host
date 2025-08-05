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

#ifndef SYSCALL_STDTYPE_H
#define SYSCALL_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
struct SyscallInfoRow {
    uint64_t ts = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    InternalTid itid = INVALID_UINT32;
    uint32_t number = INVALID_UINT32;
    DataIndex args = INVALID_UINT64;
    int64_t ret = INVALID_INT64;
};
class SysCall : public CacheBase, public BatchCacheBase {
public:
    size_t AppendSysCallData(const SyscallInfoRow &syscallNrInfoRow);
    const std::deque<uint32_t> &SysCallNumbersData() const
    {
        return sysCallNumbers_;
    }
    const std::deque<uint64_t> &DursData() const
    {
        return durs_;
    }
    const std::deque<uint32_t> &ItidsData() const
    {
        return itids_;
    }
    const std::deque<DataIndex> &ArgsData() const
    {
        return args_;
    }
    const std::deque<int64_t> &RetsData() const
    {
        return rets_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        sysCallNumbers_.clear();
        durs_.clear();
        itids_.clear();
        args_.clear();
        rets_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(sysCallNumbers_, timeStamps_, durs_, itids_, args_, rets_);
    }

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<uint32_t> sysCallNumbers_ = {};
    std::deque<uint32_t> itids_ = {};
    std::deque<DataIndex> args_ = {};
    std::deque<int64_t> rets_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // SYSCALL_STDTYPE_H
