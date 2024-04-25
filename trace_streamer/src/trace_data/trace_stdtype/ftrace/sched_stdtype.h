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

#ifndef SCHED_STDTYPE_H
#define SCHED_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class ThreadStateData : public CacheBase, public BatchCacheBase {
public:
    TableRowId AppendThreadState(InternalTime ts,
                                 InternalTime dur,
                                 InternalCpu cpu,
                                 InternalTid itid,
                                 TableRowId idState);
    void SetDuration(TableRowId index, InternalTime dur);
    TableRowId UpdateDuration(TableRowId index, InternalTime ts);
    bool End(TableRowId index, InternalTime ts);
    void UpdateState(TableRowId index, TableRowId idState);
    void SetArgSetId(TableRowId index, uint32_t setId);
    void UpdateDuration(TableRowId index, InternalTime ts, TableRowId idState);
    void UpdateTidAndPid(TableRowId index, InternalTid tid, InternalTid pid);
    TableRowId UpdateDuration(TableRowId index, InternalTime ts, InternalCpu cpu, TableRowId idState);
    void SortAllRowByTs();
    void Clear() override
    {
        CacheBase::Clear();
        durations_.clear();
        itids_.clear();
        tids_.clear();
        pids_.clear();
        states_.clear();
        cpus_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, timeStamps_, durations_, itids_, tids_, pids_, states_, cpus_, argSetIds_);
    }
    const std::deque<InternalTime> &DursData() const
    {
        return durations_;
    }
    const std::deque<InternalTid> &ItidsData() const
    {
        return itids_;
    }
    const std::deque<InternalTid> &TidsData() const
    {
        return tids_;
    }
    const std::deque<InternalPid> &PidsData() const
    {
        return pids_;
    }
    const std::deque<DataIndex> &StatesData() const
    {
        return states_;
    }
    const std::deque<InternalCpu> &CpusData() const
    {
        return cpus_;
    }
    const std::deque<uint32_t> &ArgSetsData() const
    {
        return argSetIds_;
    }

private:
    std::deque<InternalTime> durations_;
    std::deque<InternalTid> itids_;
    std::deque<InternalTid> tids_;
    std::deque<InternalPid> pids_;
    std::deque<DataIndex> states_;
    std::deque<InternalCpu> cpus_;
    std::deque<uint32_t> argSetIds_;
};
struct SchedSliceRow {
    uint64_t ts = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    uint64_t cpu = INVALID_UINT64;
    uint32_t internalTid = INVALID_UINT32;
    uint64_t endState = INVALID_UINT64;
    int32_t priority = INVALID_INT32;
};
class SchedSlice : public CacheBase, public CpuCacheBase, public BatchCacheBase {
public:
    size_t AppendSchedSlice(const SchedSliceRow &schedSliceRow);
    void SetDuration(size_t index, uint64_t duration);
    void Update(uint64_t index, uint64_t ts, uint64_t state);
    void UpdateEndState(uint64_t index, uint64_t state);
    void UpdateArg(uint64_t index, uint32_t argsetId);

    const std::deque<uint64_t> &EndStatesData() const
    {
        return endStates_;
    }

    const std::deque<int32_t> &PriorityData() const
    {
        return priority_;
    }

    const std::deque<uint32_t> &ArgSetData() const
    {
        return argSets_;
    }
    const std::deque<uint64_t> &TsEndData() const
    {
        return tsEnds_;
    }
    const std::deque<InternalPid> &InternalPidsData() const
    {
        return internalPids_;
    }
    void ReviseInternalPid(uint32_t row, InternalPid ipid)
    {
        if (row < internalPids_.size()) {
            internalPids_[row] = ipid;
        }
    }
    void Clear() override
    {
        CacheBase::Clear();
        CpuCacheBase::Clear();
        endStates_.clear();
        priority_.clear();
        internalPids_.clear();
        tsEnds_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, internalTids_, timeStamps_, durs_, cpus_, endStates_, priority_, internalPids_, tsEnds_,
                      argSets_);
    }

private:
    std::deque<InternalPid> internalPids_ = {};
    std::deque<uint64_t> tsEnds_ = {};
    std::deque<uint64_t> endStates_ = {};
    std::deque<int32_t> priority_ = {};
    std::deque<uint32_t> argSets_ = {};
};
class Raw : public CacheBase, public BatchCacheBase {
public:
    size_t AppendRawData(uint64_t timeStamp, uint32_t name, uint32_t cpu, uint32_t internalTid);
    const std::deque<uint32_t> &NameData() const
    {
        return nameDeque_;
    }
    const std::deque<uint32_t> &CpuData() const
    {
        return cpuDeque_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        nameDeque_.clear();
        cpuDeque_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(internalTids_, timeStamps_, ids_, nameDeque_, cpuDeque_);
    }

private:
    std::deque<uint32_t> nameDeque_ = {};
    std::deque<uint32_t> cpuDeque_ = {};
};

class Instants : public CacheBase, public BatchCacheBase {
public:
    size_t AppendInstantEventData(uint64_t timeStamp,
                                  DataIndex nameIndex,
                                  int64_t internalTid,
                                  int64_t wakeupFromInternalPid);

    const std::deque<DataIndex> &NameIndexsData() const
    {
        return NameIndexs_;
    }
    const std::deque<int64_t> &WakeupFromPidsData() const
    {
        return wakeupFromInternalPids_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        NameIndexs_.clear();
        wakeupFromInternalPids_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(internalTids_, timeStamps_, NameIndexs_, wakeupFromInternalPids_);
    }

private:
    std::deque<DataIndex> NameIndexs_;
    std::deque<int64_t> wakeupFromInternalPids_;
};
} // namespace TraceStdtype
} // namespace SysTuning

#endif // SCHED_STDTYPE_H
