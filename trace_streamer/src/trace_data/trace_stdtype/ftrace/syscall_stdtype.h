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
class SysCall : public CacheBase, public BatchCacheBase {
public:
    size_t AppendSysCallData(int64_t sysCallNum, DataIndex type, uint32_t ipid, uint64_t timeStamp, int64_t ret);
    const std::deque<int64_t> &SysCallsData() const
    {
        return sysCallNums_;
    }
    const std::deque<DataIndex> &TypesData() const
    {
        return types_;
    }
    const std::deque<uint32_t> &IpidsData() const
    {
        return ipids_;
    }
    const std::deque<uint64_t> &RetsData() const
    {
        return rets_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        sysCallNums_.clear();
        types_.clear();
        ipids_.clear();
        rets_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(timeStamps_, sysCallNums_, types_, ipids_, rets_);
    }

private:
    std::deque<int64_t> sysCallNums_ = {};
    std::deque<DataIndex> types_ = {};
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint64_t> rets_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // SYSCALL_STDTYPE_H
