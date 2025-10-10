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

#ifndef NATIVE_MEMORY_STDTYPE_H
#define NATIVE_MEMORY_STDTYPE_H
#include "base_stdtype.h"
#include <unordered_map>
#include <unordered_set>

namespace SysTuning {
namespace TraceStdtype {
class NativeHookSampleBase : public CacheBase {
public:
    void AppendNativeHookSampleBase(uint32_t callChainId, uint32_t ipid, uint32_t itid, uint64_t timeStamp);
    void AppendNativeHookSampleBase(uint32_t callChainId, uint32_t ipid, uint64_t timeStamp);
    const std::deque<uint32_t> &CallChainIds() const;
    const std::deque<uint32_t> &Ipids() const;
    const std::deque<uint64_t> &LastCallerPathIndexs() const;
    const std::deque<uint64_t> &LastSymbolIndexs() const;
    void UpdateLastCallerPathAndSymbolIndexs(
        std::unordered_map<uint32_t, std::tuple<DataIndex, DataIndex>> &callIdToLasLibId);
    void Clear() override
    {
        CacheBase::Clear();
        callChainIds_.clear();
        ipids_.clear();
        lastCallerPathIndexs_.clear();
        lastSymbolIndexs_.clear();
    }

public:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint32_t> ipids_ = {};
    std::deque<DataIndex> lastCallerPathIndexs_ = {};
    std::deque<DataIndex> lastSymbolIndexs_ = {};
};

struct NativeHookRow {
    uint32_t callChainId = INVALID_UINT32;
    uint32_t ipid = INVALID_UINT32;
    uint32_t itid = INVALID_UINT32;
    std::string eventType;
    DataIndex subType = INVALID_DATAINDEX;
    uint64_t timeStamp = INVALID_UINT64;
    uint64_t endTimeStamp = INVALID_UINT64;
    uint64_t duration = INVALID_UINT64;
    uint64_t addr = INVALID_UINT64;
    int64_t memSize = INVALID_UINT64;
};
class NativeHook : public NativeHookSampleBase {
public:
    size_t AppendNewNativeHookData(const NativeHookRow &context);
    void UpdateCallChainId(size_t row, uint32_t callChainId);
    void UpdateEndTimeStampAndDuration(size_t row, uint64_t endTimeStamp);
    void UpdateCurrentSizeDur(size_t row, uint64_t timeStamp);
    void UpdateMemMapSubType(uint64_t row, uint64_t tagId);
    const std::deque<std::string> &EventTypes() const;
    const std::deque<DataIndex> &SubTypes() const;
    const std::deque<uint64_t> &EndTimeStamps() const;
    const std::deque<uint64_t> &Durations() const;
    const std::deque<uint64_t> &Addrs() const;
    const std::deque<int64_t> &MemSizes() const;
    const std::deque<int64_t> &AllMemSizes() const;
    const std::deque<uint64_t> &CurrentSizeDurs() const;
    void Clear() override
    {
        NativeHookSampleBase::Clear();
        eventTypes_.clear();
        subTypes_.clear();
        endTimeStamps_.clear();
        durations_.clear();
        addrs_.clear();
        memSizes_.clear();
        allMemSizes_.clear();
        currentSizeDurs_.clear();
    }
    std::unordered_map<uint64_t, uint64_t> *GetAddrToAllocEventRow()
    {
        return &addrToAllocEventRow_;
    }
    std::unordered_map<uint64_t, uint64_t> *GetAddrToMmapEventRow()
    {
        return &addrToMmapEventRow_;
    }
    std::unordered_map<uint64_t, uint64_t> *GetAddrToTraceAllocEventRow()
    {
        return &addrToTraceAllocEventRow_;
    }

    uint64_t &GetLastMallocEventRaw()
    {
        return lastMallocEventRaw_;
    }
    uint64_t &GetLastMmapEventRaw()
    {
        return lastMmapEventRaw_;
    }

    uint64_t &GetLastGpuVkEventRaw()
    {
        return lastGpuVkEventRaw_;
    }

    uint64_t &GetLastGpuGlesEventRaw()
    {
        return lastGpuGlesEventRaw_;
    }
    
    uint64_t &GetLastGpuClEventRaw()
    {
        return lastGpuClEventRaw_;
    }

private:
    std::deque<std::string> eventTypes_ = {};
    std::deque<DataIndex> subTypes_ = {};
    std::deque<uint64_t> endTimeStamps_ = {};
    std::deque<uint64_t> durations_ = {};
    std::deque<uint64_t> addrs_ = {};
    std::deque<int64_t> memSizes_ = {};
    std::deque<int64_t> allMemSizes_ = {};
    std::deque<uint64_t> currentSizeDurs_ = {};
    int64_t countHeapSizes_ = 0;
    int64_t countMmapSizes_ = 0;
    int64_t countGpuVkSizes_ = 0;
    int64_t countGpuGlesSizes_ = 0;
    int64_t countGpuClSizes_ = 0;
    const std::string ALLOC_EVET = "AllocEvent";
    const std::string FREE_EVENT = "FreeEvent";
    const std::string MMAP_EVENT = "MmapEvent";
    const std::string MUNMAP_EVENT = "MunmapEvent";
    const std::string GPU_VK_ALLOC_EVENT = "GPU_VK_Alloc_Event";
    const std::string GPU_VK_FREE_EVENT = "GPU_VK_Free_Event";
    const std::string GPU_GLES_ALLOC_EVENT = "GPU_GLES_Alloc_Event";
    const std::string GPU_GLES_FREE_EVENT = "GPU_GLES_Free_Event";
    const std::string GPU_CL_ALLOC_EVENT = "GPU_CL_Alloc_Event";
    const std::string GPU_CL_FREE_EVENT = "GPU_CL_Free_Event";
    std::unordered_map<uint64_t, uint64_t> addrToAllocEventRow_ = {};
    std::unordered_map<uint64_t, uint64_t> addrToMmapEventRow_ = {};
    std::unordered_map<uint64_t, uint64_t> addrToTraceAllocEventRow_ = {};
    uint64_t lastMallocEventRaw_ = INVALID_UINT64;
    uint64_t lastMmapEventRaw_ = INVALID_UINT64;
    uint64_t lastGpuVkEventRaw_ = INVALID_UINT64;
    uint64_t lastGpuGlesEventRaw_ = INVALID_UINT64;
    uint64_t lastGpuClEventRaw_ = INVALID_UINT64;
};

struct NativeHookFrameRow {
    /* data */
    uint32_t callChainId = INVALID_UINT32;
    uint16_t depth = INVALID_UINT16;
    uint64_t ip = INVALID_UINT64;
    DataIndex symbolName = INVALID_DATAINDEX;
    DataIndex filePath = INVALID_DATAINDEX;
    uint64_t offset = INVALID_UINT64;
    uint64_t symbolOffset = INVALID_UINT64;
};

struct NativeHookFrameVaddrRow {
    /* data */
    uint32_t callChainId = INVALID_UINT32;
    uint16_t depth = INVALID_UINT16;
    uint64_t ip = INVALID_UINT64;
    DataIndex symbolName = INVALID_DATAINDEX;
    DataIndex filePath = INVALID_DATAINDEX;
    uint64_t offset = INVALID_UINT64;
    uint64_t symbolOffset = INVALID_UINT64;
    const std::string &vaddr;
};

class NativeHookFrame {
public:
    size_t AppendNewNativeHookFrame(const NativeHookFrameRow &context);
    size_t AppendNewNativeHookFrame(const NativeHookFrameVaddrRow &context);
    void UpdateFrameInfo(size_t row,
                         DataIndex symbolIndex,
                         DataIndex filePathIndex,
                         uint64_t offset,
                         uint64_t symbolOffset);
    void UpdateSymbolIdToNameMap(uint64_t originSymbolId, uint64_t symbolId);
    void UpdateSymbolId();
    void UpdateSymbolId(size_t index, DataIndex symbolId);
    void UpdateFileId(std::map<uint32_t, uint64_t> &filePathIdToFilePathName);
    void UpdateVaddrs(std::deque<std::string> &vaddrs);
    void ClearUselessCallChainIds(const std::unordered_set<uint32_t> &callChainIdsSet);
    const std::deque<uint32_t> &CallChainIds() const;
    const std::deque<uint16_t> &Depths() const;
    const std::deque<uint64_t> &Ips() const;
    const std::deque<DataIndex> &SymbolNames() const;
    const std::deque<DataIndex> &FilePaths() const;
    const std::deque<uint64_t> &Offsets() const;
    const std::deque<uint64_t> &SymbolOffsets() const;
    const std::deque<std::string> &Vaddrs() const;
    const std::deque<uint32_t> &realStack() const;
    size_t Size() const
    {
        return callChainIds_.size();
    }
    void Clear()
    {
        callChainIds_.clear();
        depths_.clear();
        ips_.clear();
        symbolNames_.clear();
        filePaths_.clear();
        offsets_.clear();
        symbolOffsets_.clear();
        vaddrs_.clear();
    }

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint16_t> depths_ = {};
    std::deque<uint64_t> ips_ = {};
    std::deque<DataIndex> symbolNames_ = {};
    std::deque<DataIndex> filePaths_ = {};
    std::deque<uint64_t> offsets_ = {};
    std::deque<uint64_t> symbolOffsets_ = {};
    std::deque<std::string> vaddrs_ = {};
    std::map<uint32_t, uint64_t> symbolIdToSymbolName_ = {};
};
struct NativeHookStatisticRow {
    uint32_t ipid = INVALID_UINT32;
    uint64_t timeStamp = INVALID_UINT64;
    uint32_t callChainId = INVALID_UINT32;
    uint32_t memoryType = INVALID_UINT32;
    DataIndex subMemType = INVALID_UINT64;
    uint64_t applyCount = INVALID_UINT64;
    uint64_t releaseCount = INVALID_UINT64;
    uint64_t applySize = INVALID_UINT64;
    uint64_t releaseSize = INVALID_UINT64;
};
class NativeHookStatistic : public NativeHookSampleBase {
public:
    size_t AppendNewNativeHookStatistic(const NativeHookStatisticRow &nativeHookStatisticRow);
    const std::deque<uint32_t> &MemoryTypes() const;
    const std::deque<DataIndex> &MemorySubTypes() const;
    const std::deque<uint64_t> &ApplyCounts() const;
    const std::deque<uint64_t> &ReleaseCounts() const;
    const std::deque<uint64_t> &ApplySizes() const;
    const std::deque<uint64_t> &ReleaseSizes() const;
    void Clear() override
    {
        NativeHookSampleBase::Clear();
        memoryTypes_.clear();
        applyCounts_.clear();
        releaseCounts_.clear();
        applySizes_.clear();
        releaseSizes_.clear();
    }

private:
    std::deque<uint32_t> memoryTypes_ = {};
    std::deque<DataIndex> memSubTypes_ = {};
    std::deque<uint64_t> applyCounts_ = {};
    std::deque<uint64_t> releaseCounts_ = {};
    std::deque<uint64_t> applySizes_ = {};
    std::deque<uint64_t> releaseSizes_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning

#endif // NATIVE_MEMORY_STDTYPE_H
