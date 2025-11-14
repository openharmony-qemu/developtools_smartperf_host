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

#include "sched_stdtype.h"
#include "version.h"

namespace SysTuning {
namespace TraceStdtype {
TableRowId ThreadStateData::AppendThreadState(InternalTime ts,
                                              InternalTime dur,
                                              InternalCpu cpu,
                                              InternalTid itid,
                                              TableRowId idState)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(ts);
    durations_.emplace_back(dur);
    itids_.emplace_back(itid);
    tids_.emplace_back(INVALID_UINT32);
    pids_.emplace_back(INVALID_UINT32);
    states_.emplace_back(idState);
    cpus_.emplace_back(cpu);
    argSetIds_.emplace_back(INVALID_UINT32);
    return Size() - 1;
}

void ThreadStateData::SetDuration(TableRowId index, InternalTime dur)
{
    durations_[index] = dur;
}

void ThreadStateData::SortAllRowByTs()
{
    std::deque<InternalTime> timeStampsTemp;
    timeStampsTemp = std::move(timeStamps_);
    std::multimap<uint64_t, uint32_t> timeStampsToIdMap = {};
    for (auto id = 0; id < timeStampsTemp.size(); ++id) {
        timeStampsToIdMap.insert({timeStampsTemp[id], id});
    }
    std::deque<InternalTime> durationsTemp;
    std::deque<InternalTid> itidsTemp;
    std::deque<InternalTid> tidsTemp;
    std::deque<InternalPid> pidsTemp;
    std::deque<DataIndex> statesTemp;
    std::deque<InternalCpu> cpusTemp;
    std::deque<uint32_t> argSetIdsTemp;
    durationsTemp = std::move(durations_);
    itidsTemp = std::move(itids_);
    tidsTemp = std::move(tids_);
    pidsTemp = std::move(pids_);
    statesTemp = std::move(states_);
    cpusTemp = std::move(cpus_);
    argSetIdsTemp = std::move(argSetIds_);
    for (auto itor = timeStampsToIdMap.begin(); itor != timeStampsToIdMap.end(); itor++) {
        timeStamps_.emplace_back(timeStampsTemp[itor->second]);
        durations_.emplace_back(durationsTemp[itor->second]);
        itids_.emplace_back(itidsTemp[itor->second]);
        tids_.emplace_back(tidsTemp[itor->second]);
        pids_.emplace_back(pidsTemp[itor->second]);
        states_.emplace_back(statesTemp[itor->second]);
        cpus_.emplace_back(cpusTemp[itor->second]);
        argSetIds_.emplace_back(argSetIdsTemp[itor->second]);
    }
}

TableRowId ThreadStateData::UpdateDuration(TableRowId index, InternalTime ts)
{
    if (durations_[index] == INVALID_TIME) {
        durations_[index] = ts - timeStamps_[index];
    }
    return itids_[index];
}

bool ThreadStateData::End(TableRowId index, InternalTime ts)
{
    if (durations_[index] == INVALID_TIME) {
        durations_[index] = -1;
        return false;
    }
    return true;
}
void ThreadStateData::UpdateState(TableRowId index, TableRowId idState)
{
    states_[index] = idState;
}
void ThreadStateData::SetArgSetId(TableRowId index, uint32_t setId)
{
    argSetIds_[index] = setId;
}

void ThreadStateData::UpdateDuration(TableRowId index, InternalTime ts, TableRowId idState)
{
    durations_[index] = ts - timeStamps_[index];
    states_[index] = idState;
}

void ThreadStateData::UpdateTidAndPid(TableRowId index, InternalTid tid, InternalTid pid)
{
    tids_[index] = tid;
    pids_[index] = pid;
}

TableRowId ThreadStateData::UpdateDuration(TableRowId index, InternalTime ts, InternalCpu cpu, TableRowId idState)
{
    cpus_[index] = cpu;
    durations_[index] = ts - timeStamps_[index];
    states_[index] = idState;
    return itids_[index];
}

size_t SchedSlice::AppendSchedSlice(const SchedSliceRow &schedSliceRow)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(schedSliceRow.ts);
    durs_.emplace_back(schedSliceRow.dur);
    cpus_.emplace_back(schedSliceRow.cpu);
    tsEnds_.emplace_back(0);
    internalTids_.emplace_back(schedSliceRow.internalTid);
    endStates_.emplace_back(schedSliceRow.endState);
    priority_.emplace_back(schedSliceRow.priority);
    argSets_.emplace_back(INVALID_UINT32);
    internalPids_.emplace_back(INVALID_UINT32);
    if (SysTuning::TraceStreamer::g_extendField) {
        prevStates_.emplace_back(schedSliceRow.prevState);
        prevInternalPids_.emplace_back(schedSliceRow.prevInternalTid);
    }
    return Size() - 1;
}

void SchedSlice::SetDuration(size_t index, uint64_t duration)
{
    durs_[index] = duration;
    tsEnds_[index] = timeStamps_[index] + duration;
}

void SchedSlice::Update(uint64_t index, uint64_t ts, uint64_t state)
{
    durs_[index] = ts - timeStamps_[index];
    endStates_[index] = state;
}

void SchedSlice::UpdateEndState(uint64_t index, uint64_t state)
{
    endStates_[index] = state;
}

void SchedSlice::UpdateArg(uint64_t index, uint32_t argsetId)
{
    argSets_[index] = argsetId;
}

size_t Raw::AppendRawData(uint64_t timeStamp, uint32_t name, uint32_t cpu, uint32_t internalTid)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(timeStamp);
    nameDeque_.emplace_back(name);
    cpuDeque_.emplace_back(cpu);
    internalTids_.emplace_back(internalTid);
    return Size() - 1;
}

size_t Instants::AppendInstantEventData(uint64_t timeStamp,
                                        DataIndex nameIndex,
                                        int64_t internalTid,
                                        int64_t wakeupFromInternalPid)
{
    internalTids_.emplace_back(internalTid);
    timeStamps_.emplace_back(timeStamp);
    NameIndexs_.emplace_back(nameIndex);
    wakeupFromInternalPids_.emplace_back(wakeupFromInternalPid);
    return Size() - 1;
}
} // namespace TraceStdtype
} // namespace SysTuning
