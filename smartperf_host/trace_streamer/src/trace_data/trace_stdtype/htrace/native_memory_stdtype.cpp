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
#include "native_memory_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
void NativeHookSampleBase::AppendNativeHookSampleBase(uint32_t callChainId,
                                                      uint32_t ipid,
                                                      uint32_t itid,
                                                      uint64_t timeStamp)
{
    ids_.emplace_back(id_++);
    callChainIds_.emplace_back(callChainId);
    ipids_.emplace_back(ipid);
    internalTids_.emplace_back(itid);
    timeStamps_.emplace_back(timeStamp);
    lastCallerPathIndexs_.emplace_back(INVALID_DATAINDEX);
    lastSymbolIndexs_.emplace_back(INVALID_DATAINDEX);
}
void NativeHookSampleBase::AppendNativeHookSampleBase(uint32_t callChainId, uint32_t ipid, uint64_t timeStamp)
{
    ids_.emplace_back(id_++);
    callChainIds_.emplace_back(callChainId);
    ipids_.emplace_back(ipid);
    timeStamps_.emplace_back(timeStamp);
    lastCallerPathIndexs_.emplace_back(INVALID_DATAINDEX);
    lastSymbolIndexs_.emplace_back(INVALID_DATAINDEX);
}
const std::deque<uint32_t> &NativeHookSampleBase::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t> &NativeHookSampleBase::Ipids() const
{
    return ipids_;
}
const std::deque<uint64_t> &NativeHookSampleBase::LastCallerPathIndexs() const
{
    return lastCallerPathIndexs_;
}
const std::deque<uint64_t> &NativeHookSampleBase::LastSymbolIndexs() const
{
    return lastSymbolIndexs_;
}
void NativeHookSampleBase::UpdateLastCallerPathAndSymbolIndexs(
    std::unordered_map<uint32_t, std::tuple<DataIndex, DataIndex>> &callIdToLasLibId)
{
    if (callIdToLasLibId.empty()) {
        return;
    }
    for (auto i = 0; i < Size(); ++i) {
        auto symbolIt = callIdToLasLibId.find(callChainIds_[i]);
        if (symbolIt != callIdToLasLibId.end()) {
            std::tie(lastCallerPathIndexs_[i], lastSymbolIndexs_[i]) = symbolIt->second;
        } else {
            lastCallerPathIndexs_[i] = INVALID_DATAINDEX;
            lastSymbolIndexs_[i] = INVALID_DATAINDEX;
        }
    }
}
size_t NativeHook::AppendNewNativeHookData(const NativeHookRow &context)
{
    AppendNativeHookSampleBase(context.callChainId, context.ipid, context.itid, context.timeStamp);
    eventTypes_.emplace_back(context.eventType);
    subTypes_.emplace_back(context.subType);
    endTimeStamps_.emplace_back(context.endTimeStamp);
    durations_.emplace_back(context.duration);
    addrs_.emplace_back(context.addr);
    memSizes_.emplace_back(context.memSize);
    if (context.eventType == ALLOC_EVET) {
        countHeapSizes_ += context.memSize;
        allMemSizes_.emplace_back(countHeapSizes_);
    } else if (context.eventType == FREE_EVENT) {
        countHeapSizes_ -= context.memSize;
        allMemSizes_.emplace_back(countHeapSizes_);
    } else if (context.eventType == MMAP_EVENT) {
        countMmapSizes_ += context.memSize;
        allMemSizes_.emplace_back(countMmapSizes_);
    } else if (context.eventType == MUNMAP_EVENT) {
        countMmapSizes_ -= context.memSize;
        allMemSizes_.emplace_back(countMmapSizes_);
    } else if (context.eventType == GPU_VK_ALLOC_EVENT) {
        countGpuVkSizes_ += context.memSize;
        allMemSizes_.emplace_back(countGpuVkSizes_);
    } else if (context.eventType == GPU_VK_FREE_EVENT) {
        countGpuVkSizes_ -= context.memSize;
        allMemSizes_.emplace_back(countGpuVkSizes_);
    } else if (context.eventType == GPU_GLES_ALLOC_EVENT) {
        countGpuGlesSizes_ += context.memSize;
        allMemSizes_.emplace_back(countGpuGlesSizes_);
    } else if (context.eventType == GPU_GLES_FREE_EVENT) {
        countGpuGlesSizes_ -= context.memSize;
        allMemSizes_.emplace_back(countGpuGlesSizes_);
    } else if (context.eventType == GPU_CL_ALLOC_EVENT) {
        countGpuClSizes_ += context.memSize;
        allMemSizes_.emplace_back(countGpuClSizes_);
    } else if (context.eventType == GPU_CL_FREE_EVENT) {
        countGpuClSizes_ -= context.memSize;
        allMemSizes_.emplace_back(countGpuClSizes_);
    }
    currentSizeDurs_.emplace_back(0);
    return Size() - 1;
}
void NativeHook::UpdateCallChainId(size_t row, uint32_t callChainId)
{
    if (row < Size()) {
        callChainIds_[row] = callChainId;
    } else {
        TS_LOGE("Native hook update callChainId failed!!!");
    }
}
void NativeHook::UpdateEndTimeStampAndDuration(size_t row, uint64_t endTimeStamp)
{
    endTimeStamps_[row] = endTimeStamp;
    durations_[row] = endTimeStamp - timeStamps_[row];
}
void NativeHook::UpdateCurrentSizeDur(size_t row, uint64_t timeStamp)
{
    currentSizeDurs_[row] = timeStamp - timeStamps_[row];
}
void NativeHook::UpdateMemMapSubType(uint64_t row, uint64_t tagId)
{
    if (row < subTypes_.size()) {
        subTypes_[row] = tagId;
    } else {
        TS_LOGE("subTypes_ row is invalid!");
    }
}
const std::deque<std::string> &NativeHook::EventTypes() const
{
    return eventTypes_;
}
const std::deque<DataIndex> &NativeHook::SubTypes() const
{
    return subTypes_;
}
const std::deque<uint64_t> &NativeHook::EndTimeStamps() const
{
    return endTimeStamps_;
}
const std::deque<uint64_t> &NativeHook::Durations() const
{
    return durations_;
}
const std::deque<uint64_t> &NativeHook::Addrs() const
{
    return addrs_;
}
const std::deque<int64_t> &NativeHook::MemSizes() const
{
    return memSizes_;
}
const std::deque<int64_t> &NativeHook::AllMemSizes() const
{
    return allMemSizes_;
}
const std::deque<uint64_t> &NativeHook::CurrentSizeDurs() const
{
    return currentSizeDurs_;
}
size_t NativeHookFrame::AppendNewNativeHookFrame(const NativeHookFrameVaddrRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    ips_.emplace_back(context.ip);
    depths_.emplace_back(context.depth);
    symbolNames_.emplace_back(context.symbolName);
    filePaths_.emplace_back(context.filePath);
    offsets_.emplace_back(context.offset);
    symbolOffsets_.emplace_back(context.symbolOffset);
    vaddrs_.emplace_back(context.vaddr);
    return Size() - 1;
}
size_t NativeHookFrame::AppendNewNativeHookFrame(const NativeHookFrameRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    ips_.emplace_back(context.ip);
    depths_.emplace_back(context.depth);
    symbolNames_.emplace_back(context.symbolName);
    filePaths_.emplace_back(context.filePath);
    offsets_.emplace_back(context.offset);
    symbolOffsets_.emplace_back(context.symbolOffset);
    return Size() - 1;
}
void NativeHookFrame::UpdateSymbolIdToNameMap(uint64_t originSymbolId, uint64_t symbolId)
{
    symbolIdToSymbolName_.insert(std::make_pair(originSymbolId, symbolId));
}
void NativeHookFrame::UpdateFrameInfo(size_t row,
                                      DataIndex symbolIndex,
                                      DataIndex filePathIndex,
                                      uint64_t offset,
                                      uint64_t symbolOffset)
{
    if (row >= Size()) {
        TS_LOGE("The updated row does not exist!");
        return;
    }
    symbolNames_[row] = symbolIndex;
    filePaths_[row] = filePathIndex;
    offsets_[row] = offset;
    symbolOffsets_[row] = symbolOffset;
}

void NativeHookFrame::UpdateSymbolId()
{
    if (symbolIdToSymbolName_.empty()) {
        return;
    }
    for (auto i = 0; i < Size(); ++i) {
        auto symbolIt = symbolIdToSymbolName_.find(symbolNames_[i]);
        if (symbolIt != symbolIdToSymbolName_.end()) {
            symbolNames_[i] = symbolIt->second;
        }
    }
}
void NativeHookFrame::UpdateSymbolId(size_t index, DataIndex symbolId)
{
    if (index < Size()) {
        symbolNames_[index] = symbolId;
    }
}
void NativeHookFrame::UpdateFileId(std::map<uint32_t, uint64_t> &filePathIdToFilePathName)
{
    if (filePathIdToFilePathName.empty()) {
        return;
    }
    for (auto i = 0; i < Size(); ++i) {
        auto symbolIt = filePathIdToFilePathName.find(filePaths_[i]);
        if (symbolIt != filePathIdToFilePathName.end()) {
            filePaths_[i] = symbolIt->second;
        }
    }
}
void NativeHookFrame::UpdateVaddrs(std::deque<std::string> &vaddrs)
{
    vaddrs_.assign(vaddrs.begin(), vaddrs.end());
}
void NativeHookFrame::ClearUselessCallChainIds(const std::unordered_set<uint32_t> &callChainIdsSet)
{
    std::deque<uint32_t> callChainIdsTmp;
    std::deque<uint16_t> depthsTmp;
    std::deque<uint64_t> ipsTmp;
    std::deque<DataIndex> symbolNamesTmp;
    std::deque<DataIndex> filePathsTmp;
    std::deque<uint64_t> offsetsTmp;
    std::deque<uint64_t> symbolOffsetsTmp;
    std::deque<std::string> vaddrsTmp;
    for (size_t i = 0; i < callChainIds_.size(); i++) {
        if (callChainIdsSet.find(callChainIds_[i]) == callChainIdsSet.end()) {
            continue;
        }
        callChainIdsTmp.emplace_back(callChainIds_[i]);
        depthsTmp.emplace_back(depths_[i]);
        ipsTmp.emplace_back(ips_[i]);
        symbolNamesTmp.emplace_back(symbolNames_[i]);
        filePathsTmp.emplace_back(filePaths_[i]);
        offsetsTmp.emplace_back(offsets_[i]);
        symbolOffsetsTmp.emplace_back(symbolOffsets_[i]);
        vaddrsTmp.emplace_back(vaddrs_[i]);
    }
    callChainIds_.swap(callChainIdsTmp);
    depths_.swap(depthsTmp);
    ips_.swap(ipsTmp);
    symbolNames_.swap(symbolNamesTmp);
    filePaths_.swap(filePathsTmp);
    offsets_.swap(offsetsTmp);
    symbolOffsets_.swap(symbolOffsetsTmp);
    vaddrs_.swap(vaddrsTmp);
}
const std::deque<uint32_t> &NativeHookFrame::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t> &NativeHookFrame::Depths() const
{
    return depths_;
}
const std::deque<uint64_t> &NativeHookFrame::Ips() const
{
    return ips_;
}
const std::deque<DataIndex> &NativeHookFrame::SymbolNames() const
{
    return symbolNames_;
}
const std::deque<DataIndex> &NativeHookFrame::FilePaths() const
{
    return filePaths_;
}
const std::deque<uint64_t> &NativeHookFrame::Offsets() const
{
    return offsets_;
}
const std::deque<uint64_t> &NativeHookFrame::SymbolOffsets() const
{
    return symbolOffsets_;
}
const std::deque<std::string> &NativeHookFrame::Vaddrs() const
{
    return vaddrs_;
}

size_t NativeHookStatistic::AppendNewNativeHookStatistic(const NativeHookStatisticRow &nativeHookStatisticRow)
{
    AppendNativeHookSampleBase(nativeHookStatisticRow.callChainId, nativeHookStatisticRow.ipid,
                               nativeHookStatisticRow.timeStamp);
    memoryTypes_.emplace_back(nativeHookStatisticRow.memoryType);
    applyCounts_.emplace_back(nativeHookStatisticRow.applyCount);
    memSubTypes_.emplace_back(nativeHookStatisticRow.subMemType);
    releaseCounts_.emplace_back(nativeHookStatisticRow.releaseCount);
    applySizes_.emplace_back(nativeHookStatisticRow.applySize);
    releaseSizes_.emplace_back(nativeHookStatisticRow.releaseSize);
    return Size() - 1;
}

const std::deque<uint32_t> &NativeHookStatistic::MemoryTypes() const
{
    return memoryTypes_;
}
const std::deque<DataIndex> &NativeHookStatistic::MemorySubTypes() const
{
    return memSubTypes_;
}
const std::deque<uint64_t> &NativeHookStatistic::ApplyCounts() const
{
    return applyCounts_;
}
const std::deque<uint64_t> &NativeHookStatistic::ReleaseCounts() const
{
    return releaseCounts_;
}
const std::deque<uint64_t> &NativeHookStatistic::ApplySizes() const
{
    return applySizes_;
}
const std::deque<uint64_t> &NativeHookStatistic::ReleaseSizes() const
{
    return releaseSizes_;
}
} // namespace TraceStdtype
} // namespace SysTuning
