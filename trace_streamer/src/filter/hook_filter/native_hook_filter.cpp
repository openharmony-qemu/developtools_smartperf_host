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

#include "native_hook_filter.h"
#include "native_hook_config.pbreader.h"
#include <cstddef>
#include <cinttypes>
namespace SysTuning {
namespace TraceStreamer {
NativeHookFilter::NativeHookFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : OfflineSymbolizationFilter(dataCache, filter),
      anonMmapData_(nullptr),
      hookPluginData_(std::make_unique<ProfilerPluginData>()),
      ipidToSymIdToSymIndex_(INVALID_UINT64),
      ipidToFilePathIdToFileIndex_(INVALID_UINT64),
      ipidToFrameIdToFrameBytes_(nullptr)
{
    invalidLibPathIndexs_.insert(traceDataCache_->dataDict_.GetStringIndex("/system/lib/libc++.so"));
    invalidLibPathIndexs_.insert(traceDataCache_->dataDict_.GetStringIndex("/system/lib64/libc++.so"));
    invalidLibPathIndexs_.insert(traceDataCache_->dataDict_.GetStringIndex("/system/lib/ld-musl-aarch64.so.1"));
    invalidLibPathIndexs_.insert(traceDataCache_->dataDict_.GetStringIndex("/system/lib/ld-musl-arm.so.1"));
    hookPluginData_->set_name("nativehook");
    commHookData_.datas = std::make_unique<BatchNativeHookData>();
    addrToAllocEventRow_ = traceDataCache_->GetNativeHookData()->GetAddrToAllocEventRow();
    addrToMmapEventRow_ = traceDataCache_->GetNativeHookData()->GetAddrToMmapEventRow();
}

void NativeHookFilter::ParseConfigInfo(ProtoReader::BytesView &protoData)
{
    auto configReader = ProtoReader::NativeHookConfig_Reader(protoData);
    if (configReader.has_expand_pids() || (configReader.has_process_name() && configReader.has_pid())) {
        isSingleProcData_ = false;
    }
    if (configReader.has_statistics_interval()) {
        isStatisticMode_ = true;
        isCallStackCompressedMode_ = true;
        isStringCompressedMode_ = true;
    }
    if (configReader.has_response_library_mode() || configReader.has_offline_symbolization()) {
        isOfflineSymbolizationMode_ = true;
        isCallStackCompressedMode_ = true;
        isStringCompressedMode_ = true;
        return;
    }
    if (configReader.has_callframe_compress()) {
        isCallStackCompressedMode_ = true;
        isStringCompressedMode_ = true;
        return;
    }
    if (configReader.has_string_compressed()) {
        isStringCompressedMode_ = true;
        return;
    }
    return;
}
void NativeHookFilter::AppendStackMaps(uint32_t ipid, uint32_t stackid, std::vector<uint64_t> &frames)
{
    uint64_t ipidWithStackIdIndex = 0;
    // the last element is ipid for this batch of frames/ips
    if (isSingleProcData_) {
        frames.emplace_back(SINGLE_PROC_IPID);
        ipidWithStackIdIndex = stackid;
    } else {
        frames.emplace_back(ipid);
        ipidWithStackIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(stackid));
    }
    auto framesSharedPtr = std::make_shared<std::vector<uint64_t>>(frames);
    stackIdToFramesMap_.emplace(std::make_pair(ipidWithStackIdIndex, framesSharedPtr));
    // allStackIdToFramesMap_ save all offline symbolic call stack
    if (isOfflineSymbolizationMode_) {
        allStackIdToFramesMap_.emplace(std::make_pair(ipidWithStackIdIndex, framesSharedPtr));
    }
}
void NativeHookFilter::AppendFrameMaps(uint32_t ipid, uint32_t frameMapId, const ProtoReader::BytesView &bytesView)
{
    auto frames = std::make_shared<const ProtoReader::BytesView>(bytesView);
    if (isSingleProcData_) {
        ipidToFrameIdToFrameBytes_.Insert(SINGLE_PROC_IPID, frameMapId, frames);
    } else {
        ipidToFrameIdToFrameBytes_.Insert(ipid, frameMapId, frames);
    }
}
void NativeHookFilter::AppendFilePathMaps(uint32_t ipid, uint32_t filePathId, uint64_t fileIndex)
{
    if (isSingleProcData_) {
        ipidToFilePathIdToFileIndex_.Insert(SINGLE_PROC_IPID, filePathId, fileIndex);
    } else {
        ipidToFilePathIdToFileIndex_.Insert(ipid, filePathId, fileIndex);
    }
}
void NativeHookFilter::AppendSymbolMap(uint32_t ipid, uint32_t symId, uint64_t symbolIndex)
{
    if (isSingleProcData_) {
        ipidToSymIdToSymIndex_.Insert(SINGLE_PROC_IPID, symId, symbolIndex);
    } else {
        ipidToSymIdToSymIndex_.Insert(ipid, symId, symbolIndex);
    }
}
void NativeHookFilter::AppendThreadNameMap(uint32_t ipid, uint32_t nameId, uint64_t threadNameIndex)
{
    uint64_t ipidWithThreadNameIdIndex = 0;
    if (isSingleProcData_) {
        ipidWithThreadNameIdIndex = nameId;
    } else {
        ipidWithThreadNameIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(nameId));
    }
    threadNameIdToThreadNameIndex_.emplace(ipidWithThreadNameIdIndex, threadNameIndex);
}

template <class T1, class T2>
void NativeHookFilter::UpdateMap(std::unordered_map<T1, T2> &sourceMap, T1 key, T2 value)
{
    auto itor = sourceMap.find(key);
    if (itor != sourceMap.end()) {
        itor->second = value;
    } else {
        sourceMap.insert(std::make_pair(key, value));
    }
}
std::unique_ptr<NativeHookFrameInfo> NativeHookFilter::ParseFrame(uint64_t row, const ProtoReader::DataArea &frame)
{
    auto frameInfo = std::make_unique<NativeHookFrameInfo>();

    ProtoReader::Frame_Reader reader(frame.Data(), frame.Size());
    auto curCacheIpid = traceDataCache_->GetNativeHookData()->Ipids()[row];
    if (isSingleProcData_) {
        curCacheIpid = SINGLE_PROC_IPID;
    }
    if (isStringCompressedMode_) {
        frameInfo->symbolIndex_ = ipidToSymIdToSymIndex_.Find(curCacheIpid, reader.symbol_name_id());
        TS_CHECK_TRUE(frameInfo->symbolIndex_ != INVALID_UINT64, nullptr,
                      "Native hook ParseFrame find symbol id failed!!!");
        frameInfo->filePathIndex_ = ipidToFilePathIdToFileIndex_.Find(curCacheIpid, reader.file_path_id());
        TS_CHECK_TRUE(frameInfo->filePathIndex_ != INVALID_UINT64, nullptr,
                      "Native hook ParseFrame find file path id failed!!!");
    } else {
        frameInfo->symbolIndex_ = traceDataCache_->dataDict_.GetStringIndex(reader.symbol_name().ToStdString());
        frameInfo->filePathIndex_ = traceDataCache_->dataDict_.GetStringIndex(reader.file_path().ToStdString());
    }
    // 0 is meaningful, but it is not displayed. Other data is still needed
    if (reader.has_ip()) {
        frameInfo->ip_ = reader.ip();
    }
    if (reader.has_offset()) {
        frameInfo->offset_ = reader.offset();
    }
    if (reader.has_symbol_offset()) {
        frameInfo->symbolOffset_ = reader.symbol_offset();
    }
    return frameInfo;
}

void NativeHookFilter::CompressStackAndFrames(uint64_t row,
                                              ProtoReader::RepeatedDataAreaIterator<ProtoReader::BytesView> frames)
{
    std::vector<uint64_t> framesHash;
    std::string framesHashStr = "";
    for (auto itor = frames; itor; itor++) {
        std::string_view frameStr(reinterpret_cast<const char *>(itor->Data()), itor->Size());
        auto frameHash = hashFun_(frameStr);
        if (!frameHashToFrameInfoMap_.count(frameHash)) {
            // the frame compression is completed and the frame is parsed.
            auto frameInfo = ParseFrame(row, itor.GetDataArea());
            if (!frameInfo) {
                continue;
            }
            frameHashToFrameInfoMap_.emplace(std::make_pair(frameHash, std::move(frameInfo)));
        }
        framesHash.emplace_back(frameHash);
        framesHashStr.append("+");
        framesHashStr.append(std::to_string(frameHash));
    }
    auto stackHashValue = hashFun_(framesHashStr);
    uint32_t callChainId = INVALID_UINT32;
    if (!stackHashValueToCallChainIdMap_.count(stackHashValue)) {
        callChainId = callChainIdToStackHashValueMap_.size() + 1;
        callChainIdToStackHashValueMap_.emplace(std::make_pair(callChainId, stackHashValue));
        stackHashValueToCallChainIdMap_.emplace(std::make_pair(stackHashValue, callChainId));
        stackHashValueToFramesHashMap_.emplace(std::make_pair(stackHashValue, std::move(framesHash)));
    } else {
        callChainId = stackHashValueToCallChainIdMap_[stackHashValue];
    }
    // When compressing the call stack, update the callChainId of the nativeHook table
    traceDataCache_->GetNativeHookData()->UpdateCallChainId(row, callChainId);
}
void NativeHookFilter::ParseStatisticEvent(uint64_t timeStamp, const ProtoReader::BytesView &bytesView)
{
    ProtoReader::RecordStatisticsEvent_Reader reader(bytesView);
    uint32_t callChainId = INVALID_UINT32;
    uint64_t ipidWithCallChainIdIndex = INVALID_UINT64;
    auto ipid = streamFilters_->processFilter_->GetOrCreateInternalPid(timeStamp, reader.pid());
    if (isSingleProcData_) {
        ipidWithCallChainIdIndex = reader.callstack_id();
    } else {
        ipidWithCallChainIdIndex =
            traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(reader.callstack_id()));
    }
    // When the stack id is zero, there is no matching call stack
    if (isOfflineSymbolizationMode_ && reader.callstack_id()) {
        // The same call stack may have different symbolic results due to changes in the symbol table
        if (stackIdToCallChainIdMap_.count(ipidWithCallChainIdIndex)) {
            callChainId = stackIdToCallChainIdMap_.at(ipidWithCallChainIdIndex);
        } else {
            TS_LOGE("invalid callChainId, can not find stack id : %u in stackIdToCallChainIdMap_!",
                    reader.callstack_id());
        }
    } else if (reader.callstack_id()) { // when isStatisticMode_ is true, isCallStackCompressedMode_ must be true.
        // when isOfflineSymblolizationMode_ is false, the stack id is unique
        callChainId = ipidWithCallChainIdIndex;
    }

    DataIndex memSubType = INVALID_UINT64;
    if (reader.has_tag_name()) {
        memSubType = traceDataCache_->GetDataIndex(reader.tag_name().ToStdString());
    }
    NativeHookStatisticRow nativeHookStatisticRow = {ipid,
                                                     timeStamp,
                                                     callChainId,
                                                     static_cast<uint32_t>(reader.type()),
                                                     memSubType,
                                                     reader.apply_count(),
                                                     reader.release_count(),
                                                     reader.apply_size(),
                                                     reader.release_size()};
    traceDataCache_->GetNativeHookStatisticsData()->AppendNewNativeHookStatistic(nativeHookStatisticRow);
}
void NativeHookFilter::ParseAllocEvent(uint64_t timeStamp, const ProtoReader::BytesView &bytesView)
{
    ProtoReader::AllocEvent_Reader allocEventReader(bytesView);
    uint32_t callChainId = INVALID_UINT32;
    auto itid =
        streamFilters_->processFilter_->GetOrCreateThreadWithPid(allocEventReader.tid(), allocEventReader.pid());
    auto ipid = traceDataCache_->GetConstThreadData(itid).internalPid_;
    uint64_t ipidWithStackIdIndex = INVALID_UINT64;
    uint64_t ipidWithThreadNameIdIndex = INVALID_UINT64;
    if (isSingleProcData_) {
        ipidWithThreadNameIdIndex = allocEventReader.thread_name_id();
        ipidWithStackIdIndex = allocEventReader.stack_id();
    } else {
        ipidWithThreadNameIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" +
                                                                  std::to_string(allocEventReader.thread_name_id()));
        ipidWithStackIdIndex =
            traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(allocEventReader.stack_id()));
    }
    // When the stack id is zero, there is no matching call stack
    if (isOfflineSymbolizationMode_ && allocEventReader.stack_id()) {
        // The same call stack may have different symbolic results due to changes in the symbol table
        if (stackIdToCallChainIdMap_.count(ipidWithStackIdIndex)) {
            callChainId = stackIdToCallChainIdMap_.at(ipidWithStackIdIndex);
        } else {
            TS_LOGE("invalid callChainId, can not find pid with stack id : %" PRIu64 " in stackIdToCallChainIdMap_!",
                    ipidWithStackIdIndex);
        }
    } else if (isCallStackCompressedMode_ && allocEventReader.stack_id()) {
        // when isOfflineSymblolizationMode_ is false && isCallStackCompressedMode is true, the stack id is unique
        callChainId = ipidWithStackIdIndex;
    }

    if (allocEventReader.has_thread_name_id()) {
        UpdateMap(itidToThreadNameId_, itid, ipidWithThreadNameIdIndex);
    }
    NativeHookRow nativeHookRow = {callChainId,
                                   ipid,
                                   itid,
                                   "AllocEvent",
                                   INVALID_UINT64,
                                   timeStamp,
                                   0,
                                   0,
                                   allocEventReader.addr(),
                                   static_cast<int64_t>(allocEventReader.size())};
    auto row = traceDataCache_->GetNativeHookData()->AppendNewNativeHookData(nativeHookRow);
    addrToAllocEventRow_->insert(std::make_pair(allocEventReader.addr(), static_cast<uint64_t>(row)));
    if (allocEventReader.size() != 0) {
        MaybeUpdateCurrentSizeDur(row, timeStamp, true);
    }
    // Uncompressed call stack
    if (allocEventReader.has_frame_info()) {
        CompressStackAndFrames(row, allocEventReader.frame_info());
    }
}

void NativeHookFilter::SetFreeEventCallChainId(uint32_t &callChainId,
                                               uint32_t ipid,
                                               uint32_t itid,
                                               const ProtoReader::FreeEvent_Reader &freeEventReader)
{
    uint64_t ipidWithStackIdIndex = INVALID_UINT64;
    uint64_t ipidWithThreadNameIdIndex = INVALID_UINT64;
    if (isSingleProcData_) {
        ipidWithStackIdIndex = freeEventReader.stack_id();
        ipidWithThreadNameIdIndex = freeEventReader.thread_name_id();
    } else {
        ipidWithThreadNameIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" +
                                                                  std::to_string(freeEventReader.thread_name_id()));
        ipidWithStackIdIndex =
            traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(freeEventReader.stack_id()));
    }
    // When the stack id is zero, there is no matching call stack
    if (isOfflineSymbolizationMode_ && freeEventReader.stack_id()) {
        // The same call stack may have different symbolic results due to changes in the symbol table
        if (stackIdToCallChainIdMap_.count(ipidWithStackIdIndex)) {
            callChainId = stackIdToCallChainIdMap_.at(ipidWithStackIdIndex);
        } else {
            TS_LOGE("invalid callChainId, can not find pid with stack id : %" PRIu64 " in stackIdToCallChainIdMap_!",
                    ipidWithStackIdIndex);
        }
    } else if (isCallStackCompressedMode_ && freeEventReader.stack_id()) {
        // when isOfflineSymblolizationMode_ is false && isCallStackCompressedMode is true, the stack id is unique
        callChainId = ipidWithStackIdIndex;
    }
    if (freeEventReader.thread_name_id() != 0) {
        UpdateMap(itidToThreadNameId_, itid, ipidWithThreadNameIdIndex);
    }
}
void NativeHookFilter::ParseFreeEvent(uint64_t timeStamp, const ProtoReader::BytesView &bytesView)
{
    ProtoReader::FreeEvent_Reader freeEventReader(bytesView);
    uint32_t callChainId = INVALID_UINT32;
    auto itid = streamFilters_->processFilter_->GetOrCreateThreadWithPid(freeEventReader.tid(), freeEventReader.pid());
    auto ipid = traceDataCache_->GetConstThreadData(itid).internalPid_;
    SetFreeEventCallChainId(callChainId, ipid, itid, freeEventReader);
    int64_t freeHeapSize = 0;
    // Find a matching malloc event, and if the matching fails, do not write to the database
    uint64_t row = INVALID_UINT64;
    if (addrToAllocEventRow_->count(freeEventReader.addr())) {
        row = addrToAllocEventRow_->at(freeEventReader.addr());
    }
    if (row != INVALID_UINT64 && timeStamp > traceDataCache_->GetNativeHookData()->TimeStampData()[row]) {
        addrToAllocEventRow_->erase(freeEventReader.addr());
        traceDataCache_->GetNativeHookData()->UpdateEndTimeStampAndDuration(row, timeStamp);
        freeHeapSize = traceDataCache_->GetNativeHookData()->MemSizes()[row];
    } else {
        TS_LOGD("func addr:%" PRIu64 " is empty", freeEventReader.addr());
        streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_DATA_INVALID);
        return;
    }
    NativeHookRow nativeHookRow = {
        callChainId, ipid, itid, "FreeEvent", INVALID_UINT64, timeStamp, 0, 0, freeEventReader.addr(), freeHeapSize};
    row = traceDataCache_->GetNativeHookData()->AppendNewNativeHookData(nativeHookRow);
    if (freeHeapSize != 0) {
        MaybeUpdateCurrentSizeDur(row, timeStamp, true);
    }
    // Uncompressed call stack
    if (freeEventReader.has_frame_info()) {
        CompressStackAndFrames(row, freeEventReader.frame_info());
    }
}
void NativeHookFilter::SetMmapEventCallChainId(uint32_t &callChainId,
                                               uint32_t ipid,
                                               uint32_t itid,
                                               const ProtoReader::MmapEvent_Reader &mMapEventReader)
{
    uint64_t ipidWithStackIdIndex = INVALID_UINT64;
    uint64_t ipidWithThreadNameIdIndex = INVALID_UINT64;
    if (isSingleProcData_) {
        ipidWithStackIdIndex = mMapEventReader.stack_id();
        ipidWithThreadNameIdIndex = mMapEventReader.thread_name_id();
    } else {
        ipidWithThreadNameIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" +
                                                                  std::to_string(mMapEventReader.thread_name_id()));
        ipidWithStackIdIndex =
            traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(mMapEventReader.stack_id()));
    }
    // When the stack id is zero, there is no matching call stack
    if (isOfflineSymbolizationMode_ && mMapEventReader.stack_id()) {
        // The same call stack may have different symbolic results due to changes in the symbol table
        if (stackIdToCallChainIdMap_.count(ipidWithStackIdIndex)) {
            callChainId = stackIdToCallChainIdMap_.at(ipidWithStackIdIndex);
        } else {
            TS_LOGE("invalid callChainId, can not find pid with stack id : %" PRIu64 " in stackIdToCallChainIdMap_!",
                    ipidWithStackIdIndex);
        }
    } else if (isCallStackCompressedMode_ && mMapEventReader.stack_id()) {
        // when isOfflineSymblolizationMode_ is false && isCallStackCompressedMode is true, the stack id is unique
        callChainId = ipidWithStackIdIndex;
    }
    // Update the mapping of tid to thread name id.
    if (mMapEventReader.thread_name_id() != 0) {
        UpdateMap(itidToThreadNameId_, itid, ipidWithThreadNameIdIndex);
    }
}
void NativeHookFilter::ParseMmapEvent(uint64_t timeStamp, const ProtoReader::BytesView &bytesView)
{
    ProtoReader::MmapEvent_Reader mMapEventReader(bytesView);
    uint32_t callChainId = INVALID_UINT32;
    auto itid = streamFilters_->processFilter_->GetOrCreateThreadWithPid(mMapEventReader.tid(), mMapEventReader.pid());
    auto ipid = traceDataCache_->GetConstThreadData(itid).internalPid_;
    SetMmapEventCallChainId(callChainId, ipid, itid, mMapEventReader);
    // Gets the index of the mmap event's label in the data dictionary
    DataIndex subType = INVALID_UINT64;
    auto mMapAddr = mMapEventReader.addr();
    auto mMapSize = mMapEventReader.size();
    if (mMapEventReader.has_type() && !mMapEventReader.type().ToStdString().empty()) {
        subType = traceDataCache_->dataDict_.GetStringIndex(mMapEventReader.type().ToStdString());
        // Establish a mapping of addr and size to the mmap tag index.
        addrToMmapTag_[mMapAddr] = subType; // update addr to MemMapSubType
    }
    NativeHookRow nativeHookRow = {callChainId, ipid, itid, "MmapEvent", subType,
                                   timeStamp,   0,    0,    mMapAddr,    static_cast<int64_t>(mMapSize)};
    auto row = traceDataCache_->GetNativeHookData()->AppendNewNativeHookData(nativeHookRow);
    if (subType == INVALID_UINT64) {
        UpdateAnonMmapDataDbIndex(mMapAddr, mMapSize, static_cast<uint64_t>(row));
    }
    addrToMmapEventRow_->insert(std::make_pair(mMapAddr, static_cast<uint64_t>(row)));
    // update currentSizeDur.
    if (mMapSize) {
        MaybeUpdateCurrentSizeDur(row, timeStamp, false);
    }
    // Uncompressed call stack
    if (mMapEventReader.has_frame_info()) {
        CompressStackAndFrames(row, mMapEventReader.frame_info());
    }
}
void NativeHookFilter::SetMunmapEventCallChainId(uint32_t &callChainId,
                                                 uint32_t ipid,
                                                 uint32_t itid,
                                                 const ProtoReader::MunmapEvent_Reader &mUnmapEventReader)
{
    uint64_t ipidWithStackIdIndex = INVALID_UINT64;
    uint64_t ipidWithThreadNameIdIndex = INVALID_UINT64;
    if (isSingleProcData_) {
        ipidWithStackIdIndex = mUnmapEventReader.stack_id();
        ipidWithThreadNameIdIndex = mUnmapEventReader.thread_name_id();
    } else {
        ipidWithThreadNameIdIndex = traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" +
                                                                  std::to_string(mUnmapEventReader.thread_name_id()));
        ipidWithStackIdIndex =
            traceDataCache_->GetDataIndex(std::to_string(ipid) + "_" + std::to_string(mUnmapEventReader.stack_id()));
    }
    // When the stack id is zero, there is no matching call stack
    if (isOfflineSymbolizationMode_) {
        // The same call stack may have different symbolic results due to changes in the symbol table
        if (stackIdToCallChainIdMap_.count(ipidWithStackIdIndex)) {
            callChainId = stackIdToCallChainIdMap_.at(mUnmapEventReader.stack_id());
        } else {
            TS_LOGE("invalid callChainId, can not find pid with stack id : %" PRIu64 " in stackIdToCallChainIdMap_!",
                    ipidWithStackIdIndex);
        }
    } else if (isCallStackCompressedMode_) {
        // when isOfflineSymblolizationMode_ is false && isCallStackCompressedMode is true, the stack id is unique
        callChainId = ipidWithStackIdIndex;
    }
    if (mUnmapEventReader.thread_name_id() != 0) {
        UpdateMap(itidToThreadNameId_, itid, ipidWithThreadNameIdIndex);
    }
}
void NativeHookFilter::ParseMunmapEvent(uint64_t timeStamp, const ProtoReader::BytesView &bytesView)
{
    ProtoReader::MunmapEvent_Reader mUnmapEventReader(bytesView);
    uint32_t callChainId = INVALID_UINT32;
    auto itid =
        streamFilters_->processFilter_->GetOrCreateThreadWithPid(mUnmapEventReader.tid(), mUnmapEventReader.pid());
    auto ipid = traceDataCache_->GetConstThreadData(itid).internalPid_;
    SetMunmapEventCallChainId(callChainId, ipid, itid, mUnmapEventReader);
    // Query for MMAP events that match the current data. If there are no matching MMAP events, the current data is not
    // written to the database.
    uint64_t row = INVALID_UINT64;
    if (addrToMmapEventRow_->count(mUnmapEventReader.addr())) {
        row = addrToMmapEventRow_->at(mUnmapEventReader.addr());
    }
    if (row != INVALID_UINT64 && timeStamp > traceDataCache_->GetNativeHookData()->TimeStampData()[row]) {
        addrToMmapEventRow_->erase(mUnmapEventReader.addr());
        traceDataCache_->GetNativeHookData()->UpdateEndTimeStampAndDuration(row, timeStamp);
    } else {
        TS_LOGD("func addr:%" PRIu64 " is empty", mUnmapEventReader.addr());
        streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_DATA_INVALID);
        return;
    }
    NativeHookRow nativeHookRow = {callChainId,
                                   ipid,
                                   itid,
                                   "MunmapEvent",
                                   GetMemMapSubTypeWithAddr(mUnmapEventReader.addr()),
                                   timeStamp,
                                   0,
                                   0,
                                   mUnmapEventReader.addr(),
                                   static_cast<int64_t>(mUnmapEventReader.size())};
    row = traceDataCache_->GetNativeHookData()->AppendNewNativeHookData(nativeHookRow);
    addrToMmapTag_.erase(mUnmapEventReader.addr()); // earse MemMapSubType with addr
    if (mUnmapEventReader.size() != 0) {
        MaybeUpdateCurrentSizeDur(row, timeStamp, false);
    }
    // Uncompressed call stack
    if (mUnmapEventReader.has_frame_info()) {
        CompressStackAndFrames(row, mUnmapEventReader.frame_info());
    }
}
void NativeHookFilter::ParseTagEvent(const ProtoReader::BytesView &bytesView)
{
    ProtoReader::MemTagEvent_Reader memTagEventReader(bytesView);
    auto addr = memTagEventReader.addr();
    auto size = memTagEventReader.size();
    if (traceDataCache_->isSplitFile_) {
        auto hookData = commHookData_.datas->add_events();
        MemTagEvent *memTagEvent = hookData->mutable_tag_event();
        memTagEvent->ParseFromArray(bytesView.Data(), bytesView.Size());
        commHookData_.size += bytesView.Size();
        return;
    }
    auto tagIndex = traceDataCache_->dataDict_.GetStringIndex(memTagEventReader.tag().ToStdString());
    NativeHook *nativeHookPtr = traceDataCache_->GetNativeHookData();
    std::shared_ptr<std::set<uint64_t>> indexSetPtr = anonMmapData_.Find(addr, size); // get anonMmapData dbIndex
    if (indexSetPtr != nullptr) {
        for (auto rowIter = indexSetPtr->begin(); rowIter != indexSetPtr->end(); rowIter++) {
            nativeHookPtr->UpdateMemMapSubType(*rowIter, tagIndex);
        }
        indexSetPtr->clear();            // clear annoMmapData dbIndex
        addrToMmapTag_[addr] = tagIndex; // update addr to MemMapSubType
    }
}
inline uint64_t NativeHookFilter::GetMemMapSubTypeWithAddr(uint64_t addr)
{
    auto iter = addrToMmapTag_.find(addr);
    if (iter != addrToMmapTag_.end()) {
        return iter->second; // subType
    } else {
        return INVALID_UINT64;
    }
}
inline void NativeHookFilter::UpdateAnonMmapDataDbIndex(uint64_t addr, uint64_t size, uint64_t row)
{
    auto indexPtr = anonMmapData_.Find(addr, size);
    if (indexPtr == nullptr) {
        std::shared_ptr<std::set<uint64_t>> rowPtr_ = std::make_shared<std::set<uint64_t>>();
        rowPtr_->insert(row);
        anonMmapData_.Insert(addr, size, std::move(rowPtr_));
    } else {
        indexPtr->insert(row);
    }
}
void NativeHookFilter::FilterNativeHookMainEvent(size_t num)
{
    auto itor = tsToMainEventsMap_.begin();
    for (; itor != tsToMainEventsMap_.end() && num; num--, itor++) {
        auto nativeHookDataReader = itor->second->reader_.get();
        auto timeStamp = itor->first;
        if (nativeHookDataReader->has_alloc_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED);
            ParseAllocEvent(timeStamp, nativeHookDataReader->alloc_event());
        } else if (nativeHookDataReader->has_free_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED);
            ParseFreeEvent(timeStamp, nativeHookDataReader->free_event());
        } else if (nativeHookDataReader->has_mmap_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED);
            ParseMmapEvent(timeStamp, nativeHookDataReader->mmap_event());
        } else if (nativeHookDataReader->has_munmap_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED);
            ParseMunmapEvent(timeStamp, nativeHookDataReader->munmap_event());
        } else if (nativeHookDataReader->has_statistics_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_RECORD_STATISTICS, STAT_EVENT_RECEIVED);
            ParseStatisticEvent(timeStamp, nativeHookDataReader->statistics_event());
        } else if (nativeHookDataReader->has_tag_event()) {
            streamFilters_->statFilter_->IncreaseStat(TRACE_NATIVE_HOOK_MEMTAG, STAT_EVENT_RECEIVED);
            ParseTagEvent(nativeHookDataReader->tag_event());
        }
    }
    tsToMainEventsMap_.erase(tsToMainEventsMap_.begin(), itor);
}

void NativeHookFilter::MaybeParseNativeHookMainEvent(uint64_t timeStamp,
                                                     std::unique_ptr<NativeHookMetaData> nativeHookMetaData)
{
    tsToMainEventsMap_.insert(std::make_pair(timeStamp, std::move(nativeHookMetaData)));
    if (tsToMainEventsMap_.size() > MAX_CACHE_SIZE) {
        if (isOfflineSymbolizationMode_) {
            ParseFramesInOfflineSymbolizationMode();
            ReparseStacksWithDifferentMeans();
        }
        FilterNativeHookMainEvent(tsToMainEventsMap_.size() - MAX_CACHE_SIZE);
    }
}

// Returns the address range of memMaps that conflict with start Addr and endAddr, as [start, end).
std::tuple<uint64_t, uint64_t> NativeHookFilter::GetNeedUpdateProcessMapsAddrRange(uint32_t ipid,
                                                                                   uint64_t startAddr,
                                                                                   uint64_t endAddr)
{
    uint64_t start = INVALID_UINT64;
    uint64_t end = INVALID_UINT64;
    auto startAddrToMapsInfoMapPtr = ipidToStartAddrToMapsInfoMap_.Find(ipid);
    if (startAddr >= endAddr || startAddrToMapsInfoMapPtr == nullptr) {
        return std::make_tuple(start, end);
    }
    // Find first item in startAddrToMapsInfoMapPtr,
    // that startItor->second()->start <= startAddr && startItor->second()->end > startAddr.
    auto startItor = startAddrToMapsInfoMapPtr->upper_bound(startAddr);
    if (startAddrToMapsInfoMapPtr->begin() != startItor) {
        --startItor;
        // Follow the rules of front closing and rear opening, [start, end)
        if (startItor != startAddrToMapsInfoMapPtr->end() && startAddr >= startItor->second->end()) {
            ++startItor;
        }
    }
    // Forward query for the last item with filePathId == startItor ->filePathId()
    if (startItor != startAddrToMapsInfoMapPtr->end()) {
        auto startFilePathId = startItor->second->file_path_id();
        while (startAddrToMapsInfoMapPtr->begin() != startItor) {
            --startItor;
            if (startFilePathId != startItor->second->file_path_id()) {
                ++startItor;
                break;
            }
        }
        start = startItor->first;
    }

    // Find first item in startAddrToMapsInfoMapPtr, that endItor->second()->start > endAddr
    auto endItor = startAddrToMapsInfoMapPtr->upper_bound(endAddr);
    if (endItor == startAddrToMapsInfoMapPtr->end()) {
        return std::make_tuple(start, end);
    }
    if (endItor == startAddrToMapsInfoMapPtr->begin()) {
        start = INVALID_UINT64;
        return std::make_tuple(start, end);
    }
    // Backward query for the last item with filePathId == endItor ->filePathId()
    --endItor;
    auto endFilePathId = endItor->second->file_path_id();
    ++endItor;
    while (endItor != startAddrToMapsInfoMapPtr->end()) {
        if (endFilePathId != endItor->second->file_path_id()) {
            end = endItor->second->start();
            break;
        }
        endItor++;
    }
    return std::make_tuple(start, end);
}

std::shared_ptr<FrameInfo> NativeHookFilter::ParseArktsOfflineSymbolization(uint64_t ipid, uint64_t arktsIp)
{
    auto arktsFrameInfo = std::make_shared<FrameInfo>();
    // Under offline symbolization, there is no need to symbolize js data
    uint64_t arktsFrame = arktsIp & (~JS_IP_MASK);
    auto arktsReaderFrameInfo = ipidToFrameIdToFrameBytes_.Find(ipid, arktsFrame);
    if (arktsReaderFrameInfo == nullptr) {
        TS_LOGE("Can not to find Frame_map.id for js(arkts)!!!");
        return nullptr;
    }
    ProtoReader::Frame_Reader reader(*arktsReaderFrameInfo);
    // 0 is meaningful, but it is not displayed. Other data is still needed
    // For js, the last 5 bytes of stack.ip and the outgoing frame member IP are reserved
    if (reader.has_ip()) {
        arktsFrameInfo->ip_ = reader.ip();
    }
    if (reader.has_symbol_name_id()) {
        arktsFrameInfo->symbolIndex_ = ipidToSymIdToSymIndex_.Find(ipid, reader.symbol_name_id());
    }
    if (reader.has_file_path_id()) {
        arktsFrameInfo->filePathId_ = reader.file_path_id();
    }
    if (reader.has_offset()) {
        arktsFrameInfo->offset_ = reader.offset();
    }
    // Unchanged data is the default value
    return arktsFrameInfo;
}

std::shared_ptr<std::vector<std::shared_ptr<FrameInfo>>> NativeHookFilter::OfflineSymbolization(
    const std::shared_ptr<std::vector<uint64_t>> ips)
{
    auto ipid = ips->back();
    auto result = std::make_shared<std::vector<std::shared_ptr<FrameInfo>>>();
    for (auto itor = ips->begin(); (itor + 1) != ips->end(); itor++) {
        if (JS_IP_MASK == (*itor & ALLOC_IP_MASK)) {
            auto arktsFrameInfo = ParseArktsOfflineSymbolization(ipid, *itor);
            if (!arktsFrameInfo) {
                break;
            }
            result->emplace_back(arktsFrameInfo);
            continue;
        }
        auto frameInfo = OfflineSymbolizationByIp(ipid, *itor);
        // If the IP in the middle of the call stack cannot be symbolized, the remaining IP is discarded
        if (!frameInfo) {
            break;
        }
        result->emplace_back(frameInfo);
    }
    return result;
}
void NativeHookFilter::FillOfflineSymbolizationFrames(
    std::map<uint64_t, std::shared_ptr<std::vector<uint64_t>>>::iterator mapItor)
{
    auto curCacheIpid = mapItor->second->back();
    stackIdToCallChainIdMap_.insert(std::make_pair(mapItor->first, ++callChainId_));
    auto framesInfo = OfflineSymbolization(mapItor->second);
    uint16_t depth = 0;
    if (isSingleProcData_) {
        curCacheIpid = SINGLE_PROC_IPID;
    }
    uint64_t filePathIndex = INVALID_UINT64;
    for (auto itor = framesInfo->rbegin(); itor != framesInfo->rend(); itor++) {
        // Note that the filePathId here is provided for the end side. Not a true TS internal index dictionary.
        auto frameInfo = itor->get();
        filePathIndex = ipidToFilePathIdToFileIndex_.Find(curCacheIpid, frameInfo->filePathId_);
        std::string vaddr = base::Uint64ToHexText(frameInfo->symVaddr_);
        NativeHookFrameVaddrRow nativeHookFrameVaddrRow = {callChainId_,
                                                           depth++,
                                                           frameInfo->ip_,
                                                           frameInfo->symbolIndex_,
                                                           filePathIndex,
                                                           frameInfo->offset_,
                                                           frameInfo->symbolOffset_,
                                                           vaddr};
        auto row = traceDataCache_->GetNativeHookFrameData()->AppendNewNativeHookFrame(nativeHookFrameVaddrRow);
        UpdateFilePathIndexToCallStackRowMap(row, filePathIndex);
    }
}

void NativeHookFilter::ReparseStacksWithDifferentMeans()
{
    for (auto itor = reparseStackIdToFramesMap_.begin(); itor != reparseStackIdToFramesMap_.end(); itor++) {
        // Items with key equal to stack id should not be retained in stackIdToCallChainIdMap_
        if (stackIdToCallChainIdMap_.count(itor->first)) {
            TS_LOGE("error! The mapping of ambiguous call stack id and callChainId has not been deleted!");
        }
        FillOfflineSymbolizationFrames(itor);
    }
    reparseStackIdToFramesMap_.clear();
}

void NativeHookFilter::UpdateReparseStack(uint64_t stackId, std::shared_ptr<std::vector<uint64_t>> frames)
{
    // delete the stack ids whitch should be parsed again
    if (stackIdToCallChainIdMap_.count(stackId)) {
        stackIdToCallChainIdMap_.erase(stackId);
    }
    /* update reparseStackIdToFramesMap_. The reparseStackIdToFramesMap_ cannot be parsed immediately.
    Wait until the relevant memmaps and symbolTable updates are completed. After the main event is
    updated and before the main event is about to be parsed, parse reparseStackIdToFramesMap_ first. */
    if (!stackIdToFramesMap_.count(stackId)) {
        reparseStackIdToFramesMap_.emplace(std::make_pair(stackId, frames));
    }
}
inline void NativeHookFilter::ReparseStacksWithAddrRange(uint64_t start, uint64_t end)
{
    // Get the list of call stack ids that should be parsed again
    for (auto itor = allStackIdToFramesMap_.begin(); itor != allStackIdToFramesMap_.end(); itor++) {
        auto ips = itor->second;
        for (auto ipsItor = ips->begin(); ipsItor != ips->end(); ipsItor++) {
            if (*ipsItor >= start && *ipsItor < end) {
                UpdateReparseStack(itor->first, itor->second);
                break;
            }
        }
    }
}

// Only called in offline symbolization mode.
void NativeHookFilter::ParseMapsEvent(std::unique_ptr<NativeHookMetaData> &nativeHookMetaData)
{
    segs_.emplace_back(nativeHookMetaData->seg_);
    const ProtoReader::BytesView &mapsInfoByteView = nativeHookMetaData->reader_->maps_info();
    if (traceDataCache_->isSplitFile_) {
        auto hookData = commHookData_.datas->add_events();
        MapsInfo *mapsInfo = hookData->mutable_maps_info();
        mapsInfo->ParseFromArray(mapsInfoByteView.Data(), mapsInfoByteView.Size());
        commHookData_.size += mapsInfoByteView.Size();
        return;
    }
    auto reader = std::make_shared<ProtoReader::MapsInfo_Reader>(mapsInfoByteView);

    // The temporary variable startAddr here is to solve the problem of parsing errors under the window platform
    auto startAddr = reader->start();
    auto endAddr = reader->end();
    uint64_t start = INVALID_UINT64;
    uint64_t end = INVALID_UINT64;
    auto ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(reader->pid(), "");
    if (isSingleProcData_) {
        ipid = SINGLE_PROC_IPID;
    }
    // Get [start, end) of ips addr range which need to update
    std::tie(start, end) = GetNeedUpdateProcessMapsAddrRange(ipid, startAddr, endAddr);
    if (start != INVALID_UINT64 && start != end) { // Conflicting
        /* First parse the updated call stacks, then parse the main events, and finally update Maps or SymbolTable
        Note that when tsToMainEventsMap_.size() > MAX_CACHE_SIZE and main events need to be resolved, this logic
        should also be followed. */
        ParseFramesInOfflineSymbolizationMode();
        // When a main event is updated, the call stack that needs to be parsed again is parsed.
        if (tsToMainEventsMap_.size()) {
            ReparseStacksWithDifferentMeans();
            FilterNativeHookMainEvent(tsToMainEventsMap_.size());
        }

        // Delete IP symbolization results within the conflict range.
        auto ipToFrameInfoPtr = const_cast<IpToFrameInfoType *>(ipidToIpToFrameInfo_.Find(ipid));
        if (ipToFrameInfoPtr != nullptr) {
            auto ipToFrameInfoItor = ipToFrameInfoPtr->lower_bound(start);
            while (ipToFrameInfoItor != ipToFrameInfoPtr->end() && ipToFrameInfoItor->first < end) {
                ipToFrameInfoItor = ipToFrameInfoPtr->erase(ipToFrameInfoItor);
            }
        }
        // Delete MapsInfo within the conflict range
        auto startAddrToMapsInfoMapPtr =
            const_cast<StartAddrToMapsInfoType *>(ipidToStartAddrToMapsInfoMap_.Find(ipid));
        if (startAddrToMapsInfoMapPtr != nullptr) {
            auto itor = startAddrToMapsInfoMapPtr->lower_bound(start);
            while (itor != startAddrToMapsInfoMapPtr->end() && itor->first < end) {
                itor = startAddrToMapsInfoMapPtr->erase(itor);
            }
        }
        ReparseStacksWithAddrRange(start, end);
    }
    ipidToStartAddrToMapsInfoMap_.Insert(ipid, startAddr, std::move(reader));
}
template <class T>
void NativeHookFilter::UpdateSymbolTablePtrAndStValueToSymAddrMap(
    T *firstSymbolAddr,
    const int size,
    std::shared_ptr<ProtoReader::SymbolTable_Reader> reader)
{
    for (auto i = 0; i < size; i++) {
        auto symAddr = firstSymbolAddr + i;
        if ((symAddr->st_info & STT_FUNC) && symAddr->st_value) {
            symbolTablePtrAndStValueToSymAddr_.Insert(reader, symAddr->st_value,
                                                      reinterpret_cast<const uint8_t *>(symAddr));
        }
    }
}
std::tuple<uint64_t, uint64_t> NativeHookFilter::GetIpRangeByIpidAndFilePathId(uint32_t ipid, uint32_t filePathId)
{
    uint64_t start = INVALID_UINT32;
    uint64_t end = 0;
    auto startAddrToMapsInfoMapPtr = ipidToStartAddrToMapsInfoMap_.Find(ipid);
    if (startAddrToMapsInfoMapPtr != nullptr) {
        for (auto itor = startAddrToMapsInfoMapPtr->begin(); itor != startAddrToMapsInfoMapPtr->end(); itor++) {
            if (itor->second->file_path_id() == filePathId) {
                start = std::min(itor->first, start);
                end = std::max(itor->second->end(), end);
            } else if (start != INVALID_UINT32) {
                break;
            }
        }
    }
    return std::make_tuple(start, end);
}
void NativeHookFilter::DeleteFrameInfoWhichNeedsReparse(uint32_t ipid, uint32_t filePathId)
{
    // Delete symbolic results with the same filePathId
    auto ipToFrameInfoPtr = const_cast<IpToFrameInfoType *>(ipidToIpToFrameInfo_.Find(ipid));
    if (ipToFrameInfoPtr != nullptr) {
        for (auto itor = ipToFrameInfoPtr->begin(); itor != ipToFrameInfoPtr->end();) {
            if (itor->second->filePathId_ == filePathId) {
                itor = ipToFrameInfoPtr->erase(itor);
                continue;
            }
            itor++;
        }
    }
}
void NativeHookFilter::ProcSymbolTable(uint32_t ipid,
                                       uint32_t filePathId,
                                       std::shared_ptr<ProtoReader::SymbolTable_Reader> reader)
{
    auto symbolTablePtr = ipidTofilePathIdToSymbolTableMap_.Find(ipid, filePathId);
    if (symbolTablePtr != nullptr) { // SymbolTable already exists.
        /* First parse the updated call stacks, then parse the main events, and finally update Maps or SymbolTable
        Note that when tsToMainEventsMap_.size() > MAX_CACHE_SIZE and main events need to be resolved, this logic
        should also be followed. */
        ParseFramesInOfflineSymbolizationMode();
        // When a main event is updated, the call stack that needs to be parsed again is parsed.
        if (tsToMainEventsMap_.size()) {
            ReparseStacksWithDifferentMeans();
            FilterNativeHookMainEvent(tsToMainEventsMap_.size());
        }
        DeleteFrameInfoWhichNeedsReparse(ipid, filePathId);
        uint64_t start = INVALID_UINT32;
        uint64_t end = 0;
        std::tie(start, end) = GetIpRangeByIpidAndFilePathId(ipid, filePathId);
        ReparseStacksWithAddrRange(start, end);
        symbolTablePtr = reader;
    } else {
        ipidTofilePathIdToSymbolTableMap_.Insert(ipid, filePathId, reader);
    }
}
// Only called in offline symbolization mode.
void NativeHookFilter::ParseSymbolTableEvent(std::unique_ptr<NativeHookMetaData> &nativeHookMetaData)
{
    segs_.emplace_back(nativeHookMetaData->seg_);
    const ProtoReader::BytesView &symbolTableByteView = nativeHookMetaData->reader_->symbol_tab();
    if (traceDataCache_->isSplitFile_) {
        auto hookData = commHookData_.datas->add_events();
        SymbolTable *symbolTable = hookData->mutable_symbol_tab();
        symbolTable->ParseFromArray(symbolTableByteView.Data(), symbolTableByteView.Size());
        commHookData_.size += symbolTableByteView.Size();
        return;
    }
    auto reader = std::make_shared<ProtoReader::SymbolTable_Reader>(symbolTableByteView);
    auto ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(reader->pid(), "");
    if (isSingleProcData_) {
        ipid = SINGLE_PROC_IPID;
    }
    ProcSymbolTable(ipid, reader->file_path_id(), reader);
    auto symEntrySize = reader->sym_entry_size();
    auto symTable = reader->sym_table();
    if (symEntrySize == 0) {
        return;
    }
    auto size = symTable.Size() / symEntrySize;
    if (symEntrySize == ELF32_SYM) {
        UpdateSymbolTablePtrAndStValueToSymAddrMap(reinterpret_cast<const Elf32_Sym *>(symTable.Data()), size, reader);
    } else {
        UpdateSymbolTablePtrAndStValueToSymAddrMap(reinterpret_cast<const Elf64_Sym *>(symTable.Data()), size, reader);
    }
}

void NativeHookFilter::MaybeUpdateCurrentSizeDur(uint64_t row, uint64_t timeStamp, bool isMalloc)
{
    auto &lastAnyEventRaw = isMalloc ? traceDataCache_->GetNativeHookData()->GetLastMallocEventRaw()
                                     : traceDataCache_->GetNativeHookData()->GetLastMmapEventRaw();
    if (lastAnyEventRaw != INVALID_UINT64) {
        traceDataCache_->GetNativeHookData()->UpdateCurrentSizeDur(lastAnyEventRaw, timeStamp);
    }
    lastAnyEventRaw = row;
}

// when symbolization failed, use filePath + vaddr as symbol name
void NativeHookFilter::UpdateSymbolIdsForSymbolizationFailed()
{
    auto size = traceDataCache_->GetNativeHookFrameData()->Size();
    for (size_t i = 0; i < size; ++i) {
        auto symbolNameIndex = traceDataCache_->GetNativeHookFrameData()->SymbolNames()[i];
        if (symbolNameIndex != INVALID_UINT64) {
            continue;
        }
        auto filePathIndex = traceDataCache_->GetNativeHookFrameData()->FilePaths()[i];
        if (filePathIndex != INVALID_UINT64) {
            auto filePathStr = traceDataCache_->dataDict_.GetDataFromDict(filePathIndex);
            auto vaddrStr = traceDataCache_->GetNativeHookFrameData()->Vaddrs()[i];
            traceDataCache_->GetNativeHookFrameData()->UpdateSymbolId(
                i, traceDataCache_->dataDict_.GetStringIndex(filePathStr + "+" + vaddrStr));
        } else {
            // when symbolization failed，filePath and symbolNameIndex invalid
            auto ip = traceDataCache_->GetNativeHookFrameData()->Ips()[i];
            // Distinguish whether it is the last layer call stack using the first 3 bytes
            if (ALLOC_IP_MASK == (ip & ALLOC_IP_MASK)) {
                // Take the last five bytes from the IP address
                uint64_t ipBitOperation = ip & IP_BIT_OPERATION;
                std::ostringstream newSymbol;
                //  alloc size (IP(Decimal))bytes 0xIP(hexadecimal conversion)
                newSymbol << "alloc size(" << base::number(ipBitOperation, base::INTEGER_RADIX_TYPE_DEC) << "bytes)"
                          << "0x" << base::number(ip, base::INTEGER_RADIX_TYPE_HEX);
                traceDataCache_->GetNativeHookFrameData()->UpdateSymbolId(
                    i, traceDataCache_->dataDict_.GetStringIndex(newSymbol.str()));
            } else {
                // If the current callChainId is same，unknow 0x ip(Convert IP to hexadecimal)
                traceDataCache_->GetNativeHookFrameData()->UpdateSymbolId(
                    i, traceDataCache_->dataDict_.GetStringIndex("unknown 0x" +
                                                                 base::number(ip, base::INTEGER_RADIX_TYPE_HEX)));
            }
        }
    }
}
void NativeHookFilter::ParseFramesInOfflineSymbolizationMode()
{
    for (auto stackIdToFramesItor = stackIdToFramesMap_.begin(); stackIdToFramesItor != stackIdToFramesMap_.end();
         stackIdToFramesItor++) {
        FillOfflineSymbolizationFrames(stackIdToFramesItor);
    }
    // In offline symbolization scenarios, The updated call stack information is saved in stackIdToFramesMap_.
    // After each parsing is completed, it needs to be cleared to avoid repeated parsing.
    stackIdToFramesMap_.clear();
}

void NativeHookFilter::GetNativeHookFrameVaddrs()
{
    vaddrs_.clear();
    auto size = traceDataCache_->GetNativeHookFrameData()->Size();
    // Traverse every piece of native_hook frame data
    for (size_t i = 0; i < size; i++) {
        auto symbolOffset = traceDataCache_->GetNativeHookFrameData()->SymbolOffsets()[i];
        auto fileOffset = traceDataCache_->GetNativeHookFrameData()->Offsets()[i];
        // When the symbol offset not is INVALID_UINT64, vaddr=offset+symbol offset
        if (symbolOffset != INVALID_UINT64 && fileOffset != INVALID_UINT64) {
            auto vaddr = base::Uint64ToHexText(fileOffset + symbolOffset);
            vaddrs_.emplace_back(vaddr);
            continue;
        }
        // When the symbol offset is 0, vaddr takes the string after the plus sign in the function name
        auto functionNameIndex = traceDataCache_->GetNativeHookFrameData()->SymbolNames()[i];
        std::string vaddr = "";
        auto itor = functionNameIndexToVaddr_.find(functionNameIndex);
        if (itor == functionNameIndexToVaddr_.end()) {
            auto functionName = traceDataCache_->dataDict_.GetDataFromDict(functionNameIndex);
            auto pos = functionName.rfind("+");
            if (pos != functionName.npos && pos != functionName.length() - 1) {
                vaddr = functionName.substr(++pos);
            }
            // Vaddr keeps "" when lookup failed
            functionNameIndexToVaddr_.emplace(std::make_pair(functionNameIndex, vaddr));
        } else {
            vaddr = itor->second;
        }
        vaddrs_.emplace_back(vaddr);
    }
}
// Called When isCallStackCompressedMode_ is true && isOfflineSymbolizationMode_ is false.
void NativeHookFilter::ParseFramesInCallStackCompressedMode()
{
    for (auto stackIdToFramesItor = stackIdToFramesMap_.begin(); stackIdToFramesItor != stackIdToFramesMap_.end();
         stackIdToFramesItor++) {
        auto frameIds = stackIdToFramesItor->second;
        uint16_t depth = 0;
        auto curCacheIpid = frameIds->back();
        if (isSingleProcData_) {
            curCacheIpid = SINGLE_PROC_IPID;
        }
        for (auto frameIdsItor = frameIds->crbegin() + 1; frameIdsItor != frameIds->crend(); frameIdsItor++) {
            auto frameBytesPtr = ipidToFrameIdToFrameBytes_.Find(curCacheIpid, *frameIdsItor);
            if (frameBytesPtr == nullptr) {
                TS_LOGE("Can not find Frame by frame_map_id!!!");
                continue;
            }
            ProtoReader::Frame_Reader reader(*frameBytesPtr);
            if (!reader.has_file_path_id() or !reader.has_symbol_name_id()) {
                TS_LOGE("Data exception, frames should has fil_path_id and symbol_name_id");
                continue;
            }
            auto filePathIndex = ipidToFilePathIdToFileIndex_.Find(curCacheIpid, reader.file_path_id());
            if (filePathIndex == INVALID_UINT64) {
                TS_LOGE("Data exception, can not find fil_path_id(%u)!!!", reader.file_path_id());
                continue;
            }
            auto symbolIndex = ipidToSymIdToSymIndex_.Find(curCacheIpid, reader.symbol_name_id());
            if (symbolIndex == INVALID_UINT64) {
                TS_LOGE("Data exception, can not find symbol_name_id!!!");
                continue;
            }
            // IP may not exist
            // 0 is meaningful, but it is not displayed. Other data is still needed
            auto frameIp = reader.has_ip() ? reader.ip() : INVALID_UINT64;
            auto frameOffset = reader.has_offset() ? reader.offset() : INVALID_UINT64;
            auto frameSymbolOffset = reader.has_symbol_offset() ? reader.symbol_offset() : INVALID_UINT64;
            NativeHookFrameRow nativeHookFrameRow = {static_cast<uint32_t>(stackIdToFramesItor->first),
                                                     depth++,
                                                     frameIp,
                                                     symbolIndex,
                                                     filePathIndex,
                                                     frameOffset,
                                                     frameSymbolOffset};
            auto row = traceDataCache_->GetNativeHookFrameData()->AppendNewNativeHookFrame(nativeHookFrameRow);
            UpdateFilePathIndexToCallStackRowMap(row, filePathIndex);
        }
    }
}
// Called When isCallStackCompressedMode_ is false
void NativeHookFilter::ParseFramesWithOutCallStackCompressedMode()
{
    for (auto itor = callChainIdToStackHashValueMap_.begin(); itor != callChainIdToStackHashValueMap_.end(); itor++) {
        auto callChainId = itor->first;
        if (!stackHashValueToFramesHashMap_.count(itor->second)) {
            continue;
        }
        auto &framesHash = stackHashValueToFramesHashMap_.at(itor->second);
        uint16_t depth = 0;
        for (auto frameHashValueVectorItor = framesHash.crbegin(); frameHashValueVectorItor != framesHash.crend();
             frameHashValueVectorItor++) {
            if (!frameHashToFrameInfoMap_.count(*frameHashValueVectorItor)) {
                TS_LOGE("find matching frameInfo failed!!!!");
                return;
            }
            auto &frameInfo = frameHashToFrameInfoMap_.at(*frameHashValueVectorItor);
            NativeHookFrameRow nativeHookFrameRow = {callChainId,
                                                     depth++,
                                                     frameInfo->ip_,
                                                     frameInfo->symbolIndex_,
                                                     frameInfo->filePathIndex_,
                                                     frameInfo->offset_,
                                                     frameInfo->symbolOffset_};
            auto row = traceDataCache_->GetNativeHookFrameData()->AppendNewNativeHookFrame(nativeHookFrameRow);
            UpdateFilePathIndexToCallStackRowMap(row, frameInfo->filePathIndex_);
        }
    }
}
void NativeHookFilter::ParseSymbolizedNativeHookFrame()
{
    // isOfflineSymbolizationMode is false, but isCallStackCompressedMode is true.
    if (isCallStackCompressedMode_) {
        ParseFramesInCallStackCompressedMode();
    } else {
        ParseFramesWithOutCallStackCompressedMode();
    }
    GetNativeHookFrameVaddrs();
    traceDataCache_->GetNativeHookFrameData()->UpdateVaddrs(vaddrs_);
    return;
}
void NativeHookFilter::UpdateThreadNameWithNativeHookData() const
{
    if (itidToThreadNameId_.empty() || threadNameIdToThreadNameIndex_.empty()) {
        return;
    }
    for (auto itor = itidToThreadNameId_.begin(); itor != itidToThreadNameId_.end(); ++itor) {
        auto thread = traceDataCache_->GetThreadData(itor->first);
        if (!thread->nameIndex_) {
            auto threadNameMapItor = threadNameIdToThreadNameIndex_.find(itor->second);
            if (threadNameMapItor != threadNameIdToThreadNameIndex_.end()) {
                thread->nameIndex_ = threadNameMapItor->second;
            }
        }
    }
}
void NativeHookFilter::FinishParseNativeHookData()
{
    // In offline symbolization mode Parse all NativeHook main events depends on updated stackIdToCallChainIdMap_
    // during execute ParseSymbolizedNativeHookFrame or ReparseStacksWithDifferentMeans , So first parse the call
    // stack data and then parse the main event.
    if (isOfflineSymbolizationMode_) {
        ParseFramesInOfflineSymbolizationMode();
        ReparseStacksWithDifferentMeans();
        UpdateSymbolIdsForSymbolizationFailed();
    }
    FilterNativeHookMainEvent(tsToMainEventsMap_.size());
    // In online symbolization mode and callstack is not compressed mode parse stack should after parse main event
    // In online symbolization mode and callstack is compressed mode, there is no need worry about the order
    if (!isOfflineSymbolizationMode_) {
        ParseSymbolizedNativeHookFrame();
    }

    // update last lib id
    UpdateLastCallerPathAndSymbolIndexs();
    UpdateThreadNameWithNativeHookData();
}
void NativeHookFilter::UpdateLastCallerPathAndSymbolIndexs()
{
    GetCallIdToLastLibId();
    if (isStatisticMode_) {
        traceDataCache_->GetNativeHookStatisticsData()->UpdateLastCallerPathAndSymbolIndexs(
            callIdToLastCallerPathIndex_);
    } else {
        traceDataCache_->GetNativeHookData()->UpdateLastCallerPathAndSymbolIndexs(callIdToLastCallerPathIndex_);
    }
}
void NativeHookFilter::GetCallIdToLastLibId()
{
    callIdToLastCallerPathIndex_.clear();
    auto size = static_cast<int64_t>(traceDataCache_->GetNativeHookFrameData()->Size());
    uint32_t lastCallChainId = INVALID_UINT32;
    bool foundLast = false;
    for (auto i = size - 1; i > -1; i--) {
        auto callChainId = traceDataCache_->GetNativeHookFrameData()->CallChainIds()[i];
        if (callChainId == lastCallChainId) {
            if (foundLast) {
                continue;
            }
        }
        if (callChainId != lastCallChainId) {
            lastCallChainId = callChainId;
            foundLast = false;
        }
        auto filePathIndex = traceDataCache_->GetNativeHookFrameData()->FilePaths()[i];
        if (filePathIndex == INVALID_UINT64) {
            continue;
        }
        auto symbolIndex = traceDataCache_->GetNativeHookFrameData()->SymbolNames()[i];
        if (!traceDataCache_->GetNativeHookFrameData()->Depths()[i]) {
            callIdToLastCallerPathIndex_.insert({callChainId, std::make_tuple(filePathIndex, symbolIndex)});
            foundLast = true;
            continue;
        }

        auto lower = std::lower_bound(invalidLibPathIndexs_.begin(), invalidLibPathIndexs_.end(), filePathIndex);
        if (lower == invalidLibPathIndexs_.end() || *lower != filePathIndex) { // found
            auto filePath = traceDataCache_->dataDict_.GetDataFromDict(filePathIndex);
            auto ret = filePath.find("libc++_shared.so");
            if (ret == filePath.npos) {
                callIdToLastCallerPathIndex_.insert({callChainId, std::make_tuple(filePathIndex, symbolIndex)});
                foundLast = true;
            }
        }
    }
}

template <class T>
void NativeHookFilter::UpdateFilePathIdAndStValueToSymAddrMap(T *firstSymbolAddr, const int size, uint32_t filePathId)
{
    for (auto i = 0; i < size; i++) {
        auto symAddr = firstSymbolAddr + i;
        if ((symAddr->st_info & STT_FUNC) && (symAddr->st_value)) {
            filePathIdAndStValueToSymAddr_.Insert(filePathId, symAddr->st_value,
                                                  reinterpret_cast<const uint8_t *>(symAddr));
        }
    }
}

void NativeHookFilter::NativeHookReloadElfSymbolTable(const std::vector<std::unique_ptr<SymbolsFile>> &symbolsFiles)
{
    auto nativeHookFrame = traceDataCache_->GetNativeHookFrameData();
    auto size = nativeHookFrame->Size();
    auto filePathIndexs = nativeHookFrame->FilePaths();
    auto vaddrs = nativeHookFrame->Vaddrs();
    for (const auto &symbolsFile : symbolsFiles) {
        std::shared_ptr<std::set<size_t>> frameRows = nullptr;
        for (const auto &item : filePathIndexToFrameTableRowMap_) {
            auto filePath = traceDataCache_->GetDataFromDict(item.first);
            if (base::EndWith(filePath, symbolsFile->filePath_)) {
                frameRows = item.second;
                break;
            }
        }
        if (frameRows == nullptr) {
            continue;
        }
        for (auto row : *frameRows) {
            auto symVaddr = base::StrToInt<uint32_t>(vaddrs[row], base::INTEGER_RADIX_TYPE_HEX);
            if (!symVaddr.has_value()) {
                continue;
            }
            auto dfxSymbol = symbolsFile->GetSymbolWithVaddr(symVaddr.value());
            if (dfxSymbol.IsValid()) {
                auto newSymbolIndex = traceDataCache_->GetDataIndex(dfxSymbol.GetName());
                nativeHookFrame->UpdateSymbolId(row, newSymbolIndex);
            }
        }
    }
    UpdateLastCallerPathAndSymbolIndexs();
}
void NativeHookFilter::UpdateFilePathIndexToCallStackRowMap(size_t row, DataIndex filePathIndex)
{
    if (filePathIndex != INVALID_UINT64) {
        if (filePathIndexToFrameTableRowMap_.count(filePathIndex) == 0) {
            auto rows = std::make_shared<std::set<size_t>>();
            rows->insert(row);
            filePathIndexToFrameTableRowMap_[filePathIndex] = rows;
        } else {
            filePathIndexToFrameTableRowMap_[filePathIndex]->insert(row);
        }
    }
}
CommHookData &NativeHookFilter::GetCommHookData()
{
    return commHookData_;
}
ProfilerPluginData *NativeHookFilter::GetHookPluginData()
{
    return hookPluginData_.get();
}
void NativeHookFilter::SerializeHookCommDataToString()
{
    if (commHookData_.size == 0) {
        return;
    }
    std::string hookBuffer;
    commHookData_.datas->SerializeToString(&hookBuffer);
    hookPluginData_->set_data(hookBuffer);
    std::unique_ptr<std::string> pluginBuffer = std::make_unique<std::string>();
    hookPluginData_->SerializeToString(pluginBuffer.get());
    traceDataCache_->HookCommProtos().push_back(std::move(pluginBuffer));
    hookPluginData_->Clear();
    commHookData_.datas->Clear();
    commHookData_.size = 0;
    hookPluginData_->set_name("nativehook");
}
} // namespace TraceStreamer
} // namespace SysTuning
