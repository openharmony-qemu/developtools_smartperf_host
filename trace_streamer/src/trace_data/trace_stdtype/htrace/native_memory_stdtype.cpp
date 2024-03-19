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
const std::deque<uint32_t>& NativeHookSampleBase::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t>& NativeHookSampleBase::Ipids() const
{
    return ipids_;
}
const std::deque<uint64_t>& NativeHookSampleBase::LastCallerPathIndexs() const
{
    return lastCallerPathIndexs_;
}
const std::deque<uint64_t>& NativeHookSampleBase::LastSymbolIndexs() const
{
    return lastSymbolIndexs_;
}
void NativeHookSampleBase::UpdateLastCallerPathAndSymbolIndexs(
    std::unordered_map<uint32_t, std::tuple<DataIndex, DataIndex>>& callIdToLasLibId)
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
size_t NativeHook::AppendNewNativeHookData(uint32_t callChainId,
                                           uint32_t ipid,
                                           uint32_t itid,
                                           std::string eventType,
                                           DataIndex subType,
                                           uint64_t timeStamp,
                                           uint64_t endTimeStamp,
                                           uint64_t duration,
                                           uint64_t addr,
                                           int64_t memSize)
{
    AppendNativeHookSampleBase(callChainId, ipid, itid, timeStamp);
    eventTypes_.emplace_back(eventType);
    subTypes_.emplace_back(subType);
    endTimeStamps_.emplace_back(endTimeStamp);
    durations_.emplace_back(duration);
    addrs_.emplace_back(addr);
    memSizes_.emplace_back(memSize);
    if (eventType == ALLOC_EVET) {
        countHeapSizes_ += memSize;
        allMemSizes_.emplace_back(countHeapSizes_);
    } else if (eventType == FREE_EVENT) {
        countHeapSizes_ -= memSize;
        allMemSizes_.emplace_back(countHeapSizes_);
    } else if (eventType == MMAP_EVENT) {
        countMmapSizes_ += memSize;
        allMemSizes_.emplace_back(countMmapSizes_);
    } else if (eventType == MUNMAP_EVENT) {
        countMmapSizes_ -= memSize;
        allMemSizes_.emplace_back(countMmapSizes_);
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
const std::deque<std::string>& NativeHook::EventTypes() const
{
    return eventTypes_;
}
const std::deque<DataIndex>& NativeHook::SubTypes() const
{
    return subTypes_;
}
const std::deque<uint64_t>& NativeHook::EndTimeStamps() const
{
    return endTimeStamps_;
}
const std::deque<uint64_t>& NativeHook::Durations() const
{
    return durations_;
}
const std::deque<uint64_t>& NativeHook::Addrs() const
{
    return addrs_;
}
const std::deque<int64_t>& NativeHook::MemSizes() const
{
    return memSizes_;
}
const std::deque<int64_t>& NativeHook::AllMemSizes() const
{
    return allMemSizes_;
}
const std::deque<uint64_t>& NativeHook::CurrentSizeDurs() const
{
    return currentSizeDurs_;
}
size_t NativeHookFrame::AppendNewNativeHookFrame(uint32_t callChainId,
                                                 uint16_t depth,
                                                 uint64_t ip,
                                                 DataIndex symbolName,
                                                 DataIndex filePath,
                                                 uint64_t offset,
                                                 uint64_t symbolOffset,
                                                 const std::string& vaddr)
{
    callChainIds_.emplace_back(callChainId);
    ips_.emplace_back(ip);
    depths_.emplace_back(depth);
    symbolNames_.emplace_back(symbolName);
    filePaths_.emplace_back(filePath);
    offsets_.emplace_back(offset);
    symbolOffsets_.emplace_back(symbolOffset);
    vaddrs_.emplace_back(vaddr);
    return Size() - 1;
}
size_t NativeHookFrame::AppendNewNativeHookFrame(uint32_t callChainId,
                                                 uint16_t depth,
                                                 uint64_t ip,
                                                 DataIndex symbolName,
                                                 DataIndex filePath,
                                                 uint64_t offset,
                                                 uint64_t symbolOffset)
{
    callChainIds_.emplace_back(callChainId);
    ips_.emplace_back(ip);
    depths_.emplace_back(depth);
    symbolNames_.emplace_back(symbolName);
    filePaths_.emplace_back(filePath);
    offsets_.emplace_back(offset);
    symbolOffsets_.emplace_back(symbolOffset);
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
void NativeHookFrame::UpdateFileId(std::map<uint32_t, uint64_t>& filePathIdToFilePathName)
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
void NativeHookFrame::UpdateVaddrs(std::deque<std::string>& vaddrs)
{
    vaddrs_.assign(vaddrs.begin(), vaddrs.end());
}
const std::deque<uint32_t>& NativeHookFrame::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t>& NativeHookFrame::Depths() const
{
    return depths_;
}
const std::deque<uint64_t>& NativeHookFrame::Ips() const
{
    return ips_;
}
const std::deque<DataIndex>& NativeHookFrame::SymbolNames() const
{
    return symbolNames_;
}
const std::deque<DataIndex>& NativeHookFrame::FilePaths() const
{
    return filePaths_;
}
const std::deque<uint64_t>& NativeHookFrame::Offsets() const
{
    return offsets_;
}
const std::deque<uint64_t>& NativeHookFrame::SymbolOffsets() const
{
    return symbolOffsets_;
}
const std::deque<std::string>& NativeHookFrame::Vaddrs() const
{
    return vaddrs_;
}

size_t NativeHookStatistic::AppendNewNativeHookStatistic(uint32_t ipid,
                                                         uint64_t timeStamp,
                                                         uint32_t callChainId,
                                                         uint32_t memoryType,
                                                         DataIndex subMemType,
                                                         uint64_t applyCount,
                                                         uint64_t releaseCount,
                                                         uint64_t applySize,
                                                         uint64_t releaseSize)
{
    AppendNativeHookSampleBase(callChainId, ipid, timeStamp);
    memoryTypes_.emplace_back(memoryType);
    applyCounts_.emplace_back(applyCount);
    memSubTypes_.emplace_back(subMemType);
    releaseCounts_.emplace_back(releaseCount);
    applySizes_.emplace_back(applySize);
    releaseSizes_.emplace_back(releaseSize);
    return Size() - 1;
}

const std::deque<uint32_t>& NativeHookStatistic::MemoryTypes() const
{
    return memoryTypes_;
}
const std::deque<DataIndex>& NativeHookStatistic::MemorySubTypes() const
{
    return memSubTypes_;
}
const std::deque<uint64_t>& NativeHookStatistic::ApplyCounts() const
{
    return applyCounts_;
}
const std::deque<uint64_t>& NativeHookStatistic::ReleaseCounts() const
{
    return releaseCounts_;
}
const std::deque<uint64_t>& NativeHookStatistic::ApplySizes() const
{
    return applySizes_;
}
const std::deque<uint64_t>& NativeHookStatistic::ReleaseSizes() const
{
    return releaseSizes_;
}
} // namespace TraceStdtype
} // namespace SysTuning
