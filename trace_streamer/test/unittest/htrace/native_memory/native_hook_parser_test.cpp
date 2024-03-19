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

#include <fcntl.h>
#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <memory>

#include "export_test.h"
#include "file.h"
#include "htrace_native_hook_parser.h"
#include "native_hook_result.pb.h"
#include "native_hook_result.pbreader.h"
#include "parser/bytrace_parser/bytrace_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
bool ParseTraceFile(TraceStreamerSelector& ts_, const std::string& tracePath);
const uint64_t SEC_01 = 1632675525;
const uint64_t SEC_02 = 1632675526;
const uint64_t SEC_03 = 1632675527;
const uint64_t SEC_04 = 1632675528;
const uint64_t NSEC_01 = 996560701;
const uint64_t NSEC_02 = 999560702;
const uint64_t NSEC_03 = 996560703;
const uint64_t NSEC_04 = 999560704;
const uint64_t TIMESTAMP_01 = NSEC_01 + SEC_01 * SEC_TO_NS;
const uint64_t TIMESTAMP_02 = NSEC_02 + SEC_02 * SEC_TO_NS;
const uint64_t TIMESTAMP_03 = NSEC_03 + SEC_03 * SEC_TO_NS;
const uint64_t TIMESTAMP_04 = NSEC_04 + SEC_04 * SEC_TO_NS;
const int32_t PID = 2716;
const int32_t TID_01 = 1532;
const int32_t TID_02 = 1532;
const uint64_t ADDR_01 = 10453088;
const uint64_t ADDR_02 = 10453089;
const uint64_t ADDR_03 = 10453090;
const int64_t SIZE_01 = 4096;
const int64_t SIZE_02 = 2048;
const uint64_t IP_01 = 4154215627;
const uint64_t IP_02 = 4154215630;
const uint64_t SP_01 = 4146449696;
const uint64_t SP_02 = 4146449698;
const std::string SYMBOL_NAME_01 = "__aeabi_read_tp";
const std::string SYMBOL_NAME_02 = "ThreadMmap";
const std::string FILE_PATH_01 = "/system/lib/ld-musl-arm.so.1";
const std::string FILE_PATH_02 = "/system/bin/nativetest_c";
const uint64_t OFFSET_01 = 359372;
const uint64_t OFFSET_02 = 17865;
const uint64_t SYMBOL_OFFSET_01 = 255;
const uint64_t SYMBOL_OFFSET_02 = 33;
const std::string ALLOCEVENT = "AllocEvent";
const std::string FREEEVENT = "FreeEvent";
const std::string MMAPEVENT = "MmapEvent";
const std::string MUNMAPEVENT = "MunmapEvent";
const std::string TYPE_01 = "mmapType1";
const std::string TYPE_02 = "mmapType2";

struct HookDataStruct {
    int32_t tid;
    uint64_t addr;
    int64_t size;
    std::string type;
    uint64_t sec;
    uint64_t nsec;
};

struct FrameStruct {
    uint64_t ip;
    uint64_t sp;
    std::string name;
    std::string path;
    uint64_t offset;
    uint64_t symbolOffset;
};

class NativeHookParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    void SetFrameInfo(Frame* frame, FrameStruct frameStruct)
    {
        frame->set_ip(frameStruct.ip);
        frame->set_sp(frameStruct.sp);
        frame->set_symbol_name(frameStruct.name);
        frame->set_file_path(frameStruct.path);
        frame->set_offset(frameStruct.offset);
        frame->set_symbol_offset(frameStruct.symbolOffset);
    }

    void SetAllocEvent(BatchNativeHookData& hookData,
                       HookDataStruct dataStruct,
                       bool isRepeated = false,
                       bool isAddFrame = true,
                       bool isSecond = false)
    {
        // construct AllocEvent
        AllocEvent* allocEvent = new AllocEvent();
        allocEvent->set_pid(PID);
        allocEvent->set_tid(dataStruct.tid);
        allocEvent->set_addr(dataStruct.addr);
        allocEvent->set_size(dataStruct.size);
        if (isAddFrame) {
            // construct AllocEvent's Frame
            auto frame = allocEvent->add_frame_info();
            if (!isSecond) {
                SetFrameInfo(frame, {IP_01, SP_01, SYMBOL_NAME_01, FILE_PATH_01, OFFSET_01, SYMBOL_OFFSET_01});
            } else {
                SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
            }
        }
        if (isRepeated) {
            // construct first AllocEvent's second Frame
            auto frame = allocEvent->add_frame_info();
            SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
        }

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_alloc_event(allocEvent);
    }

    void SetFreeEvent(BatchNativeHookData& hookData,
                      HookDataStruct dataStruct,
                      bool isRepeated = false,
                      bool isSecond = false,
                      bool isAddFrame = true)
    {
        // construct FreeEvent
        FreeEvent* freeEvent = new FreeEvent();
        freeEvent->set_pid(PID);
        freeEvent->set_tid(dataStruct.tid);
        freeEvent->set_addr(dataStruct.addr);
        if (isAddFrame) {
            // construct first FreeEvent's first Frame
            auto frame = freeEvent->add_frame_info();
            if (!isSecond) {
                SetFrameInfo(frame, {IP_01, SP_01, SYMBOL_NAME_01, FILE_PATH_01, OFFSET_01, SYMBOL_OFFSET_01});
            } else {
                SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
            }
        }

        if (isRepeated) {
            // construct first FreeEvent's second Frame
            auto frame = freeEvent->add_frame_info();
            SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
        }

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_free_event(freeEvent);
    }

    void SetMmapEvent(BatchNativeHookData& hookData,
                      HookDataStruct dataStruct,
                      bool isRepeated = false,
                      bool isSecond = false,
                      bool isAddFrame = true)
    {
        // construct MmapEvent
        MmapEvent* mmapEvent = new MmapEvent();
        mmapEvent->set_pid(PID);
        mmapEvent->set_tid(dataStruct.tid);
        mmapEvent->set_addr(dataStruct.addr);
        mmapEvent->set_size(dataStruct.size);
        mmapEvent->set_type(dataStruct.type);
        if (isAddFrame) {
            // construct first MmapEvent's first Frame
            auto frame = mmapEvent->add_frame_info();
            if (!isSecond) {
                SetFrameInfo(frame, {IP_01, SP_01, SYMBOL_NAME_01, FILE_PATH_01, OFFSET_01, SYMBOL_OFFSET_01});
            } else {
                SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
            }
        }

        if (isRepeated) {
            auto frame = mmapEvent->add_frame_info();
            SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
        }

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_mmap_event(mmapEvent);
    }

    void SetMunmapEvent(BatchNativeHookData& hookData, HookDataStruct dataStruct, bool isSecond, bool isAddFrame)
    {
        // construct MunmapEvent
        MunmapEvent* munmapEvent = new MunmapEvent();
        munmapEvent->set_pid(PID);
        munmapEvent->set_tid(dataStruct.tid);
        munmapEvent->set_addr(dataStruct.addr);
        munmapEvent->set_size(dataStruct.size);
        if (isAddFrame) {
            // construct MunmapEvent's Frame
            auto frame = munmapEvent->add_frame_info();
            if (!isSecond) {
                SetFrameInfo(frame, {IP_01, SP_01, SYMBOL_NAME_01, FILE_PATH_01, OFFSET_01, SYMBOL_OFFSET_01});
            } else {
                SetFrameInfo(frame, {IP_02, SP_02, SYMBOL_NAME_02, FILE_PATH_02, OFFSET_02, SYMBOL_OFFSET_02});
            }
        }

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_munmap_event(munmapEvent);
    }

    BatchNativeHookData CreateBatchNativeHookData(HtraceDataSegment& dataSeg)
    {
        std::string hookStrMsg = "";
        BatchNativeHookData batchNativeHookData;
        SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, true);
        SetAllocEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_02, NSEC_02}, true);
        batchNativeHookData.SerializeToString(&hookStrMsg);
        dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
        ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                             dataSeg.seg->size());
        dataSeg.protoData = hookBytesView;
        return batchNativeHookData;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

template <typename T>
bool IsEqual(T src, T dest, std::string logStr)
{
    if (src != dest) {
        std::cout << logStr << ": src = " << src << ", dest = " << dest << std::endl;
        return false;
    }
    return true;
}

class NativeHookCache {
public:
    NativeHookCache(const uint64_t callChainId,
                    const uint32_t ipid,
                    const uint32_t itid,
                    const std::string eventType,
                    const uint64_t subType,
                    const uint64_t startTimeStamp,
                    const uint64_t endTimeStamp,
                    const uint64_t duration,
                    const uint64_t address,
                    const int64_t memSize,
                    const int64_t allMemSize,
                    const uint64_t currentSizeDurations)
        : callChainId_(callChainId),
          ipid_(ipid),
          itid_(itid),
          eventType_(eventType),
          subType_(subType),
          startTimeStamp_(startTimeStamp),
          endTimeStamp_(endTimeStamp),
          duration_(duration),
          address_(address),
          memSize_(memSize),
          allMemSize_(allMemSize),
          currentSizeDurations_(currentSizeDurations)
    {
    }

    NativeHookCache(const NativeHook& nativeHook, uint64_t index)
    {
        if (nativeHook.Size() <= index) {
            TS_LOGE("index out of deque bounds! nativeHook.Size() = %lu, index = %lu", nativeHook.Size(), index);
            return;
        }
        callChainId_ = nativeHook.CallChainIds()[index];
        ipid_ = nativeHook.Ipids()[index];
        itid_ = nativeHook.InternalTidsData()[index];
        eventType_ = nativeHook.EventTypes()[index];
        subType_ = nativeHook.SubTypes()[index];
        startTimeStamp_ = nativeHook.TimeStampData()[index];
        endTimeStamp_ = nativeHook.EndTimeStamps()[index];
        duration_ = nativeHook.Durations()[index];
        address_ = nativeHook.Addrs()[index];
        memSize_ = nativeHook.MemSizes()[index];
        allMemSize_ = nativeHook.AllMemSizes()[index];
        currentSizeDurations_ = nativeHook.CurrentSizeDurs()[index];
    }
    ~NativeHookCache() = default;
    NativeHookCache(const NativeHookCache&) = delete;
    NativeHookCache& operator=(const NativeHookCache&) = delete;
    bool operator==(const NativeHookCache& nativeHookCache) const
    {
        bool ret = true;
        ret &= IsEqual(nativeHookCache.GetCallChainId(), callChainId_, "CallChainId");
        ret &= IsEqual(nativeHookCache.GetPid(), ipid_, "Pid");
        ret &= IsEqual(nativeHookCache.GetTid(), itid_, "Tid");
        ret &= IsEqual(nativeHookCache.GetEventType(), eventType_, "EventType");
        ret &= IsEqual(nativeHookCache.GetSubType(), subType_, "SubType");
        ret &= IsEqual(nativeHookCache.GetStartTimeStamp(), startTimeStamp_, "StartTimeStamp");
        ret &= IsEqual(nativeHookCache.GetEndTimeStamp(), endTimeStamp_, "EndTimeStamp");
        ret &= IsEqual(nativeHookCache.GetDuration(), duration_, "Duration");
        ret &= IsEqual(nativeHookCache.GetAddress(), address_, "Address");
        ret &= IsEqual(nativeHookCache.GetMemSize(), memSize_, "MemSize");
        ret &= IsEqual(nativeHookCache.GetAllMemSize(), allMemSize_, "AllMemSize");
        ret &= IsEqual(nativeHookCache.GetCurrentSizeDuration(), currentSizeDurations_, "CurrentSizeDurations");
        return ret;
    }
    inline uint64_t GetCallChainId() const
    {
        return callChainId_;
    }
    inline uint32_t GetPid() const
    {
        return ipid_;
    }
    inline uint32_t GetTid() const
    {
        return itid_;
    }
    inline std::string GetEventType() const
    {
        return eventType_;
    }
    inline uint64_t GetSubType() const
    {
        return subType_;
    }
    inline uint64_t GetStartTimeStamp() const
    {
        return startTimeStamp_;
    }
    inline uint64_t GetEndTimeStamp() const
    {
        return endTimeStamp_;
    }
    inline uint64_t GetDuration() const
    {
        return duration_;
    }
    inline uint64_t GetAddress() const
    {
        return address_;
    }
    inline int64_t GetMemSize() const
    {
        return memSize_;
    }
    inline int64_t GetAllMemSize() const
    {
        return allMemSize_;
    }
    inline uint64_t GetCurrentSizeDuration() const
    {
        return currentSizeDurations_;
    }

private:
    uint64_t callChainId_;
    uint32_t ipid_;
    uint32_t itid_;
    std::string eventType_;
    uint64_t subType_;
    uint64_t startTimeStamp_;
    uint64_t endTimeStamp_;
    uint64_t duration_;
    uint64_t address_;
    int64_t memSize_;
    int64_t allMemSize_;
    uint64_t currentSizeDurations_;
};

class NativeHookFrameCache {
public:
    NativeHookFrameCache(const uint64_t callChainId,
                         const uint64_t depth,
                         const uint64_t ip,
                         const uint64_t symbolName,
                         const uint64_t filePath,
                         const uint64_t offset,
                         const uint64_t symbolOffset)
        : callChainId_(callChainId),
          depth_(depth),
          ip_(ip),
          symbolName_(symbolName),
          filePath_(filePath),
          offset_(offset),
          symbolOffset_(symbolOffset)
    {
    }

    NativeHookFrameCache(const NativeHookFrame& nativeHookFrame, const uint64_t index)
    {
        if (nativeHookFrame.Size() <= index) {
            TS_LOGE("index out of deque bounds! nativeHookFrame.Size() = %lu, index = %lu", nativeHookFrame.Size(),
                    index);
            return;
        }
        callChainId_ = nativeHookFrame.CallChainIds()[index];
        depth_ = nativeHookFrame.Depths()[index];
        ip_ = nativeHookFrame.Ips()[index];
        symbolName_ = nativeHookFrame.SymbolNames()[index];
        filePath_ = nativeHookFrame.FilePaths()[index];
        offset_ = nativeHookFrame.Offsets()[index];
        symbolOffset_ = nativeHookFrame.SymbolOffsets()[index];
    }

    ~NativeHookFrameCache() = default;
    NativeHookFrameCache(const NativeHookFrameCache&) = delete;
    NativeHookFrameCache& operator=(const NativeHookFrameCache&) = delete;
    bool operator==(const NativeHookFrameCache& frameCache) const
    {
        bool ret = true;
        ret &= IsEqual(frameCache.GetCallChainId(), callChainId_, "CallChainId");
        ret &= IsEqual(frameCache.GetDepth(), depth_, "Depth");
        ret &= IsEqual(frameCache.GetIp(), ip_, "Ip");
        ret &= IsEqual(frameCache.GetSymbolName(), symbolName_, "SymbolName");
        ret &= IsEqual(frameCache.GetFilePath(), filePath_, "FilePath");
        ret &= IsEqual(frameCache.GetOffset(), offset_, "Offset");
        ret &= IsEqual(frameCache.GetSymbolOffset(), symbolOffset_, "SymbolOffset");
        return ret;
    }
    inline uint64_t GetCallChainId() const
    {
        return callChainId_;
    }
    inline uint64_t GetDepth() const
    {
        return depth_;
    }
    inline uint64_t GetIp() const
    {
        return ip_;
    }
    inline uint64_t GetSymbolName() const
    {
        return symbolName_;
    }
    inline uint64_t GetFilePath() const
    {
        return filePath_;
    }
    inline uint64_t GetOffset() const
    {
        return offset_;
    }
    inline uint64_t GetSymbolOffset() const
    {
        return symbolOffset_;
    }

private:
    uint64_t callChainId_;
    uint64_t depth_;
    uint64_t ip_;
    uint64_t symbolName_;
    uint64_t filePath_;
    uint64_t offset_;
    uint64_t symbolOffset_;
};

/**
 * @tc.name: ParseBatchNativeHookWithOutNativeHookData
 * @tc.desc: Parse a BatchNativeHookData that does not contain any NativeHookData
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOutNativeHookData, TestSize.Level1)
{
    TS_LOGI("test24-1");
    BatchNativeHookData batchNativeHookData;
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    auto size = stream_.traceDataCache_->GetConstHilogData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseBatchNativeHookWithOneMalloc
 * @tc.desc: Parse a BatchNativeHookData with only one Malloc
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOneMalloc, TestSize.Level1)
{
    TS_LOGI("test24-2");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01});
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache expectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64, TIMESTAMP_01,
                                          0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);
    EXPECT_EQ(1, nativeHook.Size());

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache expectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                          SYMBOL_OFFSET_01);
    NativeHookFrameCache resultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(expectFrameCache == resultFrameCache);
    EXPECT_EQ(1, nativeHookFrame.Size());
    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseBatchNativeHookWithMultipleMalloc
 * @tc.desc: Parse a NativeHook with multiple Malloc and Frame
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithMultipleMalloc, TestSize.Level1)
{
    TS_LOGI("test24-3");
    HtraceDataSegment dataSeg;
    BatchNativeHookData batchNativeHookData = CreateBatchNativeHookData(dataSeg);
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    EXPECT_TRUE(SIZE_01 == nativeHook.AllMemSizes()[0]);
    EXPECT_TRUE(nativeHook.CurrentSizeDurs()[0] == TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01,
                                               TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);
    auto firstExpectSymbol = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    auto firstExpectFilePath = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache firstMallocExpectFirstFrame(1, 0, IP_02, firstExpectSymbol, firstExpectFilePath, OFFSET_02,
                                                     SYMBOL_OFFSET_02);
    EXPECT_TRUE(firstMallocExpectFirstFrame == NativeHookFrameCache(nativeHookFrame, 0));
    auto secondExpectSymbol = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto secondExpectFilePath = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache firstMallocExpectSecondFrame(1, 1, IP_01, secondExpectSymbol, secondExpectFilePath, OFFSET_01,
                                                      SYMBOL_OFFSET_01);
    NativeHookFrameCache firstMallocResultSecondFrame(nativeHookFrame, 1);
    EXPECT_TRUE(firstMallocExpectSecondFrame == firstMallocResultSecondFrame);
    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache secondExpectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                                TIMESTAMP_02, 0, 0, ADDR_02, SIZE_02, SIZE_01 + SIZE_02, 0);
    NativeHookCache secondResultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);
    NativeHookFrameCache secondMallocExpectFirstFrame(1, 0, IP_02, firstExpectSymbol, firstExpectFilePath, OFFSET_02,
                                                      SYMBOL_OFFSET_02);
    EXPECT_EQ(nativeHookFrame.CallChainIds()[1], 1);
    EXPECT_EQ(nativeHookFrame.Depths()[1], 1);
    EXPECT_EQ(nativeHookFrame.Ips()[1], IP_01);
    EXPECT_EQ(nativeHookFrame.SymbolNames()[1], secondExpectSymbol);
    EXPECT_EQ(nativeHookFrame.FilePaths()[1], secondExpectFilePath);
    EXPECT_EQ(nativeHookFrame.Offsets()[1], OFFSET_01);
    EXPECT_EQ(nativeHookFrame.SymbolOffsets()[1], SYMBOL_OFFSET_01);
}

/**
 * @tc.name: ParseBatchNativeHookWithOneFree
 * @tc.desc: Parse a BatchNativeHookData with only one Free
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOneFree, TestSize.Level1)
{
    TS_LOGI("test24-4");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetFreeEvent(batchNativeHookData, {TID_01, ADDR_01, 0, "", SEC_01, NSEC_01}, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(0, size);
    size = stream_.traceDataCache_->GetConstNativeHookFrameData().Size();
    EXPECT_EQ(0, size);
    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseBatchNativeHookWithMultipleFree
 * @tc.desc: Parse a NativeHook with multiple Free and Frame
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithMultipleFree, TestSize.Level1)
{
    TS_LOGI("test24-5");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetFreeEvent(batchNativeHookData, {TID_01, ADDR_01, 0, "", SEC_01, NSEC_01}, true);
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_02, 0, "", SEC_02, NSEC_02}, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    // Calculate partial expectations
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    EXPECT_TRUE(0 == nativeHook.Size());
    EXPECT_TRUE(0 == nativeHookFrame.Size());

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(2 == eventCount);
}

/**
 * @tc.name: ParseBatchNativeHookWithOnePairsMallocAndFree
 * @tc.desc: Parse a BatchNativeHookData with a pair of matching Malloc and Free Event
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOnePairsMallocAndFree, TestSize.Level1)
{
    TS_LOGI("test24-6");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01});
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_01, 0, "", SEC_02, NSEC_02}, false, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse Malloc event results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01,
                                               SIZE_01, SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    // Verification parse Malloc Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache secondExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                                SYMBOL_OFFSET_01);
    NativeHookFrameCache secondResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(secondExpectFrameCache == secondResultFrameCache);

    // Verification parse Free event results
    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache expectNativeHookCache(2, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64, TIMESTAMP_02,
                                          0, 0, ADDR_01, SIZE_01, 0, 0);
    NativeHookCache resultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);

    // Verification parse Free Event Frame results
    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache expectFrameCache(2, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                          SYMBOL_OFFSET_02);
    NativeHookFrameCache resultFrameCache(nativeHookFrame, 1);
    EXPECT_TRUE(expectFrameCache == resultFrameCache);

    auto size = nativeHookFrame.Size();
    EXPECT_EQ(2, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseBatchNativeHookWithNotMatchMallocAndFree
 * @tc.desc: Parse a BatchNativeHookData with Not Match Malloc and Free Event
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithNotMatchMallocAndFree, TestSize.Level1)
{
    TS_LOGI("test24-7");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01});
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_02, 0, "", SEC_02, NSEC_02}, false, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse Malloc event results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    // Verification parse Malloc Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                               SYMBOL_OFFSET_01);
    NativeHookFrameCache firstResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(firstExpectFrameCache == firstResultFrameCache);

    auto size = nativeHookFrame.Size();
    EXPECT_EQ(1, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseTwoMallocAndFreeEventMatched
 * @tc.desc: Parse a BatchNativeHookData with two Malloc and two Free Event, that Malloc and Free was matched.
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTwoMallocAndFreeEventMatched, TestSize.Level1)
{
    TS_LOGI("test24-8");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, false, false);
    SetFreeEvent(batchNativeHookData, {TID_01, ADDR_01, 0, "", SEC_02, NSEC_02}, false, false, false);
    SetAllocEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_03, NSEC_03}, false, false);
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_02, 0, "", SEC_04, NSEC_04}, false, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse first Malloc event results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache firstExpectMallocCache(INVALID_UINT32, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                           TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01, SIZE_01,
                                           SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultMallocCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectMallocCache == firstResultMallocCache);

    // Verification parse first Free event results
    NativeHookCache firstExpectFreeCache(INVALID_UINT32, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                         TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0, TIMESTAMP_03 - TIMESTAMP_02);
    NativeHookCache firstResultFreeCache(nativeHook, 1);
    EXPECT_TRUE(firstExpectFreeCache == firstResultFreeCache);

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache secondExpectMallocCache(INVALID_UINT32, expect_ipid, expect_itid, ALLOCEVENT.c_str(),
                                            INVALID_UINT64, TIMESTAMP_03, TIMESTAMP_04, TIMESTAMP_04 - TIMESTAMP_03,
                                            ADDR_02, SIZE_02, SIZE_02, TIMESTAMP_04 - TIMESTAMP_03);
    NativeHookCache secondResultMallocCache(nativeHook, 2);
    EXPECT_TRUE(secondExpectMallocCache == secondResultMallocCache);

    // Verification parse first Free event results
    NativeHookCache secondExpectFreeCache(INVALID_UINT32, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                          TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache secondResultFreeCache(nativeHook, 3);
    EXPECT_TRUE(secondExpectFreeCache == secondResultFreeCache);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseTwoMallocAndFreeEventPartialMatched
 * @tc.desc: Parse a BatchNativeHookData with two Malloc and two Free Event, that Malloc and Free was partial
 matched.
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTwoMallocAndFreeEventPartialMatched, TestSize.Level1)
{
    TS_LOGI("test24-9");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, false, false);
    SetFreeEvent(batchNativeHookData, {TID_01, ADDR_01, 0, "", SEC_02, NSEC_02}, false, false, false);
    SetAllocEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_03, NSEC_03}, false, false);
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_03, 0, "", SEC_04, NSEC_04}, false, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse first Malloc event results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache firstExpectMallocCache(INVALID_UINT32, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                           TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01, SIZE_01,
                                           SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultMallocCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectMallocCache == firstResultMallocCache);

    // Verification parse first Free event results
    NativeHookCache firstExpectFreeCache(INVALID_UINT32, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                         TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0, TIMESTAMP_03 - TIMESTAMP_02);
    NativeHookCache firstResultFreeCache(nativeHook, 1);
    EXPECT_TRUE(firstExpectFreeCache == firstResultFreeCache);

    // Verification parse second Malloc event results
    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache secondExpectMallocCache(INVALID_UINT32, expect_ipid, expect_itid, ALLOCEVENT.c_str(),
                                            INVALID_UINT64, TIMESTAMP_03, 0, 0, ADDR_02, SIZE_02, SIZE_02, 0);
    NativeHookCache secondResultMallocCache(nativeHook, 2);
    EXPECT_TRUE(secondExpectMallocCache == secondResultMallocCache);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseBatchNativeHookWithOneMmap
 * @tc.desc: Parse a BatchNativeHookData with only one MMAP
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOneMmap, TestSize.Level1)
{
    TS_LOGI("test24-10");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01});

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache expectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType, TIMESTAMP_01, 0,
                                          0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(1, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache expectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                          SYMBOL_OFFSET_01);
    NativeHookFrameCache resultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(expectFrameCache == resultFrameCache);

    size = nativeHookFrame.Size();
    EXPECT_EQ(1, size);

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseBatchNativeHookWithOneMunmap
 * @tc.desc: Parse a BatchNativeHookData with only one MMAP
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithOneMunmap, TestSize.Level1)
{
    TS_LOGI("test24-11");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, false, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(0, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();

    size = nativeHookFrame.Size();
    EXPECT_EQ(0, size);

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseBatchNativeHookWithMultipleMmap
 * @tc.desc: Parse a BatchNativeHookData with multiple MMAP
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithMultipleMmap, TestSize.Level1)
{
    TS_LOGI("test24-12");
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01});
    SetMmapEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, TYPE_02, SEC_02, NSEC_02}, false, true);
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);

    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01,
                                               TIMESTAMP_02 - TIMESTAMP_01);
    EXPECT_TRUE(firstExpectNativeHookCache == NativeHookCache(nativeHook, 0));

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_02);
    NativeHookCache secondExpectNativeHookCache(2, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                                TIMESTAMP_02, 0, 0, ADDR_02, SIZE_02, SIZE_01 + SIZE_02, 0);
    EXPECT_TRUE(secondExpectNativeHookCache == NativeHookCache(nativeHook, 1));
    EXPECT_EQ(2, stream_.traceDataCache_->GetConstNativeHookData().Size());
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                               SYMBOL_OFFSET_01);
    EXPECT_TRUE(firstExpectFrameCache == NativeHookFrameCache(nativeHookFrame, 0));

    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache expectFrameCache(2, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                          SYMBOL_OFFSET_02);
    EXPECT_TRUE(expectFrameCache == NativeHookFrameCache(nativeHookFrame, 1));
    EXPECT_EQ(2, nativeHookFrame.Size());
    EXPECT_EQ(2, stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseBatchNativeHookWithMultipleMunmap
 * @tc.desc: Parse a BatchNativeHookData with multiple munmap
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithMultipleMunmap, TestSize.Level1)
{
    TS_LOGI("test24-13");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, false, true);
    SetMunmapEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_02, NSEC_02}, true, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(0, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();

    size = nativeHookFrame.Size();
    EXPECT_EQ(0, size);

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(2 == eventCount);
}

/**
 * @tc.name: ParseOnePairsMmapAndMunmapEvent
 * @tc.desc: Parse a BatchNativeHookData with one pairs Mmap and MunmapEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseOnePairsMmapAndMunmapEvent, TestSize.Level1)
{
    TS_LOGI("test24-14");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01}, true);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_02, NSEC_02}, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01,
                                               SIZE_01, SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    NativeHookCache secondExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0, 0);
    NativeHookCache secondResultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);
    EXPECT_EQ(2, stream_.traceDataCache_->GetConstNativeHookData().Size());

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                               SYMBOL_OFFSET_02);
    NativeHookFrameCache firstResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(firstExpectFrameCache == firstResultFrameCache);

    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache secondExpectFrameCache(1, 1, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                                SYMBOL_OFFSET_01);
    NativeHookFrameCache secondResultFrameCache(nativeHookFrame, 1);
    EXPECT_TRUE(secondExpectFrameCache == secondResultFrameCache);
    EXPECT_EQ(2, nativeHookFrame.Size());

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseNotMatchMmapAndMunmapEvent
 * @tc.desc: Parse a BatchNativeHookData with not match Mmap and MunmapEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseNotMatchMmapAndMunmapEvent, TestSize.Level1)
{
    TS_LOGI("test24-15");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01}, true);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_02, SIZE_01, "", SEC_02, NSEC_02}, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(1, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame& nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                               SYMBOL_OFFSET_02);
    NativeHookFrameCache firstResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(firstExpectFrameCache == firstResultFrameCache);

    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache secondExpectFrameCache(1, 1, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                                SYMBOL_OFFSET_01);
    NativeHookFrameCache secondResultFrameCache(nativeHookFrame, 1);
    EXPECT_TRUE(secondExpectFrameCache == secondResultFrameCache);

    size = nativeHookFrame.Size();
    EXPECT_EQ(2, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseTwoPairsMatchedMmapAndMunmapEvent
 * @tc.desc: Parse a BatchNativeHookData with two pairs matched Mmap and MunmapEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTwoPairsMatchedMmapAndMunmapEvent, TestSize.Level1)
{
    TS_LOGI("test24-16");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01}, false, false, false);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_02, NSEC_02}, false, false);
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_02, SIZE_02, TYPE_02, SEC_03, NSEC_03}, false, false, false);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_02, SIZE_02, "", SEC_04, NSEC_04}, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache firstExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01,
                                               SIZE_01, SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    NativeHookCache secondExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0,
                                                TIMESTAMP_03 - TIMESTAMP_02);
    NativeHookCache secondResultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_02);
    NativeHookCache thirdExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_03, TIMESTAMP_04, TIMESTAMP_04 - TIMESTAMP_03, ADDR_02,
                                               SIZE_02, SIZE_02, TIMESTAMP_04 - TIMESTAMP_03);
    NativeHookCache thirdResultNativeHookCache(nativeHook, 2);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, 3);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(4, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParsePartialMatchedMmapAndMunmapEvent
 * @tc.desc: Parse a BatchNativeHookData with partial matched Mmap and MunmapEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParsePartialMatchedMmapAndMunmapEvent, TestSize.Level1)
{
    TS_LOGI("test24-17");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01}, false, false, false);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_02, NSEC_02}, false, false);
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_02, SIZE_02, TYPE_02, SEC_03, NSEC_03}, false, false, false);
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_03, SIZE_02, "", SEC_04, NSEC_04}, false, false);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache firstExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01,
                                               SIZE_01, SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    NativeHookCache secondExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0,
                                                TIMESTAMP_03 - TIMESTAMP_02);
    NativeHookCache secondResultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_02);
    NativeHookCache thirdExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_03, 0, 0, ADDR_02, SIZE_02, SIZE_02, 0);
    NativeHookCache thirdResultNativeHookCache(nativeHook, 2);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_04, 0, 0, ADDR_03, SIZE_02, SIZE_02, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, 3);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(3, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(2 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseBatchNativeHookWithAllTypesEvents
 * @tc.desc: Parse a BatchNativeHookData with one pairs Mmap and MunmapEvent and one pairs Malloc and Free
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseBatchNativeHookWithAllTypesEvents, TestSize.Level1)
{
    TS_LOGI("test24-18");

    // construct BatchNativeHookData
    BatchNativeHookData batchNativeHookData;
    SetMmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, TYPE_01, SEC_01, NSEC_01});
    SetMunmapEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_02, NSEC_02}, false, true);
    SetAllocEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_03, NSEC_03}, false, true, true);
    SetFreeEvent(batchNativeHookData, {TID_02, ADDR_02, 0, "", SEC_04, NSEC_04}, false, true);

    // start parse
    HtraceNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    HtraceDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t*>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook& nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, TIMESTAMP_02, TIMESTAMP_02 - TIMESTAMP_01, ADDR_01,
                                               SIZE_01, SIZE_01, TIMESTAMP_02 - TIMESTAMP_01);
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    NativeHookCache secondExpectNativeHookCache(1, expect_ipid, expect_itid, MUNMAPEVENT.c_str(), mmapSubType,
                                                TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0, 0);
    NativeHookCache secondResultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache thirdExpectNativeHookCache(2, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_03, TIMESTAMP_04, TIMESTAMP_04 - TIMESTAMP_03, ADDR_02,
                                               SIZE_02, SIZE_02, TIMESTAMP_04 - TIMESTAMP_03);
    NativeHookCache thirdResultNativeHookCache(nativeHook, 2);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(2, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                                TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, 3);
    EXPECT_TRUE(fourthExpectNativeHookCache == fourthResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(4, size);

    auto& statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
}
/**
 * @tc.name: ParseOfflineSymAndStatisticalData
 * @tc.desc: Parse Offline Sym And Statistical Data
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseOfflineSymAndStatisticalData, TestSize.Level1)
{
    std::string path("../../test/resource/offline_symbolization_statistical_data.htrace");
    TS_LOGI("test24-19");
    EXPECT_TRUE(ParseTraceFile(stream_, path));
}
/**
 * @tc.name: ParseCallStackCompressionData
 * @tc.desc: Parse CallStack Compression Data
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseCallStackCompressionData, TestSize.Level1)
{
    std::string path("../../test/resource/callstack_compression.htrace");
    TS_LOGI("test24-20");
    EXPECT_TRUE(ParseTraceFile(stream_, path));
}
} // namespace TraceStreamer
} // namespace SysTuning