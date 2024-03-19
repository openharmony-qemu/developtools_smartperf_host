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
#include "task_pool_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t TaskPoolInfo::AppendAllocationTaskData(uint32_t allocationTaskRow,
                                              uint32_t allocationItid,
                                              uint32_t executeId,
                                              uint32_t priority,
                                              uint32_t executeState)
{
    allocationTaskRows_.emplace_back(allocationTaskRow);
    executeTaskRows_.emplace_back(INVALID_INT32);
    returnTaskRows_.emplace_back(INVALID_INT32);
    allocationItids_.emplace_back(allocationItid);
    executeItids_.emplace_back(INVALID_INT32);
    returnItids_.emplace_back(INVALID_INT32);
    executeIds_.emplace_back(executeId);
    prioritys_.emplace_back(priority);
    executeStates_.emplace_back(executeState);
    returnStates_.emplace_back(INVALID_INT32);
    timeoutRows_.emplace_back(INVALID_INT32);
    ids_.emplace_back(Size());
    return Size() - 1;
}
size_t TaskPoolInfo::AppendExecuteTaskData(uint32_t executeTaskRow, uint32_t executeItid, uint32_t executeId)
{
    allocationTaskRows_.emplace_back(INVALID_INT32);
    executeTaskRows_.emplace_back(executeTaskRow);
    returnTaskRows_.emplace_back(INVALID_INT32);
    allocationItids_.emplace_back(INVALID_INT32);
    executeItids_.emplace_back(executeItid);
    returnItids_.emplace_back(INVALID_INT32);
    executeIds_.emplace_back(executeId);
    prioritys_.emplace_back(INVALID_INT32);
    executeStates_.emplace_back(INVALID_INT32);
    returnStates_.emplace_back(INVALID_INT32);
    timeoutRows_.emplace_back(INVALID_INT32);
    ids_.emplace_back(Size());
    return Size() - 1;
}
size_t TaskPoolInfo::AppendReturnTaskData(uint32_t returnTaskRow,
                                          uint32_t returnItid,
                                          uint32_t executeId,
                                          uint32_t returnState)
{
    allocationTaskRows_.emplace_back(INVALID_INT32);
    executeTaskRows_.emplace_back(INVALID_INT32);
    returnTaskRows_.emplace_back(returnTaskRow);
    allocationItids_.emplace_back(INVALID_INT32);
    executeItids_.emplace_back(INVALID_INT32);
    returnItids_.emplace_back(returnItid);
    executeIds_.emplace_back(executeId);
    prioritys_.emplace_back(INVALID_INT32);
    executeStates_.emplace_back(INVALID_INT32);
    returnStates_.emplace_back(returnState);
    timeoutRows_.emplace_back(INVALID_INT32);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t>& TaskPoolInfo::AllocationTaskRows() const
{
    return allocationTaskRows_;
}
const std::deque<uint32_t>& TaskPoolInfo::ExecuteTaskRows() const
{
    return executeTaskRows_;
}
const std::deque<uint32_t>& TaskPoolInfo::ReturnTaskRows() const
{
    return returnTaskRows_;
}
const std::deque<uint32_t>& TaskPoolInfo::AllocationItids() const
{
    return allocationItids_;
}
const std::deque<uint32_t>& TaskPoolInfo::ExecuteItids() const
{
    return executeItids_;
}
const std::deque<uint32_t>& TaskPoolInfo::ReturnItids() const
{
    return returnItids_;
}
const std::deque<uint32_t>& TaskPoolInfo::ExecuteIds() const
{
    return executeIds_;
}
const std::deque<uint32_t>& TaskPoolInfo::Prioritys() const
{
    return prioritys_;
}
const std::deque<uint32_t>& TaskPoolInfo::ExecuteStates() const
{
    return executeStates_;
}
const std::deque<uint32_t>& TaskPoolInfo::ReturnStates() const
{
    return returnStates_;
}
const std::deque<uint32_t>& TaskPoolInfo::TimeoutRows() const
{
    return timeoutRows_;
}
void TaskPoolInfo::UpdateAllocationTaskData(uint32_t index,
                                            uint32_t allocationTaskRow,
                                            uint32_t allocationItid,
                                            uint32_t priority,
                                            uint32_t executeState)
{
    if (index <= Size()) {
        allocationTaskRows_[index] = allocationTaskRow;
        allocationItids_[index] = allocationItid;
        prioritys_[index] = priority;
        executeStates_[index] = executeState;
    }
}
void TaskPoolInfo::UpdateExecuteTaskData(uint32_t index, uint32_t executeTaskRow, uint32_t executeItid)
{
    if (index <= Size()) {
        executeTaskRows_[index] = executeTaskRow;
        executeItids_[index] = executeItid;
    }
}
void TaskPoolInfo::UpdateReturnTaskData(uint32_t index,
                                        uint32_t returnTaskRow,
                                        uint32_t returnItid,
                                        uint32_t returnState)
{
    if (index <= Size()) {
        returnTaskRows_[index] = returnTaskRow;
        returnItids_[index] = returnItid;
        returnStates_[index] = returnState;
    }
}
void TaskPoolInfo::AppendTimeoutRow(uint32_t index, uint32_t timeoutRow)
{
    if (index <= Size()) {
        timeoutRows_[index] = timeoutRow;
    }
}
} // namespace TraceStdtype
} // namespace SysTuning
