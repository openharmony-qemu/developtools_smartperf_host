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

#ifndef TASK_POOL_STDTYPE_H
#define TASK_POOL_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class TaskPoolInfo : public CacheBase {
public:
    size_t AppendAllocationTaskData(uint32_t allocationTaskRow,
                                    uint32_t allocationItid,
                                    uint32_t executeId,
                                    uint32_t priority,
                                    uint32_t executeState);
    size_t AppendExecuteTaskData(uint32_t executeTaskRow, uint32_t executeItid, uint32_t executeId);
    size_t AppendReturnTaskData(uint32_t returnTaskRow, uint32_t returnItid, uint32_t executeId, uint32_t returnState);
    void UpdateAllocationTaskData(uint32_t index,
                                  uint32_t allocationTaskRow,
                                  uint32_t allocationItid,
                                  uint32_t priority,
                                  uint32_t executeState);
    void UpdateExecuteTaskData(uint32_t index, uint32_t executeTaskRow, uint32_t executeItid);
    void UpdateReturnTaskData(uint32_t index, uint32_t returnTaskRow, uint32_t returnItid, uint32_t returnState);
    void AppendTimeoutRow(uint32_t index, uint32_t timeoutRow);

    const std::deque<uint32_t>& AllocationTaskRows() const;
    const std::deque<uint32_t>& ExecuteTaskRows() const;
    const std::deque<uint32_t>& ReturnTaskRows() const;
    const std::deque<uint32_t>& AllocationItids() const;
    const std::deque<uint32_t>& ExecuteItids() const;
    const std::deque<uint32_t>& ReturnItids() const;
    const std::deque<uint32_t>& ExecuteIds() const;
    const std::deque<uint32_t>& Prioritys() const;
    const std::deque<uint32_t>& ExecuteStates() const;
    const std::deque<uint32_t>& ReturnStates() const;
    const std::deque<uint32_t>& TimeoutRows() const;
    void Clear() override
    {
        CacheBase::Clear();
        allocationTaskRows_.clear();
        executeTaskRows_.clear();
        returnTaskRows_.clear();
        allocationItids_.clear();
        executeItids_.clear();
        returnItids_.clear();
        executeIds_.clear();
        prioritys_.clear();
        executeStates_.clear();
        returnStates_.clear();
        timeoutRows_.clear();
    }

private:
    std::deque<uint32_t> allocationTaskRows_ = {};
    std::deque<uint32_t> executeTaskRows_ = {};
    std::deque<uint32_t> returnTaskRows_ = {};
    std::deque<uint32_t> allocationItids_ = {};
    std::deque<uint32_t> executeItids_ = {};
    std::deque<uint32_t> returnItids_ = {};
    std::deque<uint32_t> executeIds_ = {};
    std::deque<uint32_t> prioritys_ = {};
    std::deque<uint32_t> executeStates_ = {};
    std::deque<uint32_t> returnStates_ = {};
    std::deque<uint32_t> timeoutRows_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // TASK_POOL_STDTYPE_H
