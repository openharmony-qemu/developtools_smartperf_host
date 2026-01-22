/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#include <fcntl.h>
#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <memory>

#define private public
#include "export_test.h"
#include "file.h"
#include "native_hook_parser/pbreader_native_hook_parser.h"
#include "native_hook_result.pb.h"
#include "native_hook_result.pbreader.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace NativeMemoryUnitTest {
const uint32_t INDEX_SIZE_02 = 2;
const uint32_t INDEX_SIZE_03 = 3;
const uint32_t INDEX_SIZE_04 = 4;
const uint64_t SEC_01 = 1632675525;
const uint64_t SEC_02 = 1632675526;
const uint64_t SEC_03 = 1632675527;
const uint64_t SEC_04 = 1632675528;
const uint64_t SEC_05 = 1632675529;
const uint64_t SEC_06 = 1632675530;
const uint64_t NSEC_01 = 996560701;
const uint64_t NSEC_02 = 999560702;
const uint64_t NSEC_03 = 996560703;
const uint64_t NSEC_04 = 999560704;
const uint64_t NSEC_05 = 999560705;
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
const uint64_t ADDR_1000 = 0x1000;
const uint64_t ADDR_2000 = 0x2000;
const uint64_t ADDR_3000 = 0x3000;
const uint64_t ADDR_4000 = 0x4000;
const uint64_t ADDR_5000 = 0x5000;
const uint64_t ADDR_6000 = 0x6000;
const uint32_t NUM_02 = 2;
const uint32_t NUM_03 = 3;
const uint32_t NUM_04 = 4;
const uint32_t NUM_05 = 5;
const uint32_t NUM_06 = 6;
const uint32_t NUM_07 = 7;
const uint32_t NUM_1000 = 1000;
const uint32_t NUM_1500 = 1500;
const uint32_t NUM_2000 = 2000;
const uint32_t NUM_3000 = 3000;
const uint32_t NUM_4000 = 4000;
const int64_t SIZE_01 = 4096;
const int64_t SIZE_02 = 2048;
const int64_t SIZE_03 = 1024;
const uint64_t STACK_MAP_ALLOC_IP = 18446742974197923848ULL;
const uint64_t STACK_MAP_JS_IP_01 = 18446741874686296087ULL;
const uint64_t STACK_MAP_JS_IP_02 = 18446741874686296086ULL;
const uint64_t IP_01 = 4154215627;
const uint64_t IP_02 = 4154215630;
const uint64_t IP_03 = 5483396524;
const uint64_t SP_01 = 4146449696;
const uint64_t SP_02 = 4146449698;
const std::string SYMBOL_NAME_01 = "__aeabi_read_tp";
const std::string SYMBOL_NAME_02 = "ThreadMmap";
const std::string SYMBOL_NAME_03 = "napicallback_arkts";
const std::string SYMBOL_NAME_04 = "unknown 0xf79c4cce";
const std::string SYMBOL_NAME_05 = "alloc size(8bytes)0xffffff0000000008";
const std::string FILE_PATH_01 = "/system/lib/ld-musl-arm.so.1";
const std::string FILE_PATH_02 = "/system/bin/nativetest_c";
const std::string FILE_PATH_03 = "/entry/src/main/ets/pages/Index.ets:47:5";
const uint64_t OFFSET_01 = 359372;
const uint64_t OFFSET_02 = 17865;
const uint64_t OFFSET_03 = 89456;
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

    void SetFrameInfo(Frame *frame, FrameStruct frameStruct)
    {
        frame->set_ip(frameStruct.ip);
        frame->set_sp(frameStruct.sp);
        frame->set_symbol_name(frameStruct.name);
        frame->set_file_path(frameStruct.path);
        frame->set_offset(frameStruct.offset);
        frame->set_symbol_offset(frameStruct.symbolOffset);
    }

    void SetOfflineFrameEvent(BatchNativeHookData &hookData)
    {
        // construct FrameEvent
        auto frameMapData = hookData.add_events();
        FrameMap *frameMap = new FrameMap();
        frameMap->set_id(STACK_MAP_JS_IP_01 & (~JS_IP_MASK));
        frameMap->set_pid(PID);
        frameMapData->set_allocated_frame_map(frameMap);

        // construct Frame
        Frame *frame = new Frame();
        frame->set_ip(IP_03);
        frame->set_sp(0);
        frame->set_symbol_name_id(1);
        frame->set_file_path_id(1);
        frame->set_offset(OFFSET_03);
        frame->set_symbol_offset(0);
        frameMap->set_allocated_frame(frame);

        // construct SymbolMap
        auto symbolMapData = hookData.add_events();
        SymbolMap *symbolMap = new SymbolMap();
        symbolMap->set_id(1);
        symbolMap->set_name(SYMBOL_NAME_03);
        symbolMap->set_pid(PID);
        symbolMapData->set_allocated_symbol_name(symbolMap);

        // construct FilePathMap
        auto filePathMapData = hookData.add_events();
        FilePathMap *filePathMap = new FilePathMap();
        filePathMap->set_id(1);
        filePathMap->set_name(FILE_PATH_03);
        filePathMap->set_pid(PID);
        filePathMapData->set_allocated_file_path(filePathMap);
    }

    void SetOfflineAllocEvent(BatchNativeHookData &hookData,
                              HookDataStruct dataStruct,
                              bool isJsMixedStack = false,
                              bool isJsStackAbnormal = false)
    {
        auto stackMapData = hookData.add_events();
        // Construct JavaScript stack data
        StackMap *stackMap = new StackMap();
        stackMap->set_id(1);

        if (isJsMixedStack) {
            // add stackMap.ip: alloc
            stackMap->add_ip(STACK_MAP_ALLOC_IP);
            // add stackMap.ip: Offline symbolization failed
            stackMap->add_ip(IP_02);
            // add stackMap.ip :js
            stackMap->add_ip(STACK_MAP_JS_IP_01);
            SetOfflineFrameEvent(hookData);
        }
        if (isJsStackAbnormal) {
            // add stackMap.ip :jsStackAbnormal
            stackMap->add_ip(STACK_MAP_JS_IP_02);
        }
        stackMap->set_pid(PID);
        stackMapData->set_allocated_stack_map(stackMap);

        // construct AllocEvent
        auto nativeHookData = hookData.add_events();
        AllocEvent *allocEvent = new AllocEvent();
        allocEvent->set_stack_id(1);
        allocEvent->set_pid(PID);
        allocEvent->set_tid(dataStruct.tid);
        allocEvent->set_addr(dataStruct.addr);
        allocEvent->set_size(dataStruct.size);

        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_alloc_event(allocEvent);
    }
    void SetAllocEvent(BatchNativeHookData &hookData,
                       HookDataStruct dataStruct,
                       bool isRepeated = false,
                       bool isAddFrame = true,
                       bool isSecond = false)
    {
        // construct AllocEvent
        AllocEvent *allocEvent = new AllocEvent();
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

    void SetFreeEvent(BatchNativeHookData &hookData,
                      HookDataStruct dataStruct,
                      bool isRepeated = false,
                      bool isSecond = false,
                      bool isAddFrame = true)
    {
        // construct FreeEvent
        FreeEvent *freeEvent = new FreeEvent();
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

    void SetMmapEvent(BatchNativeHookData &hookData,
                      HookDataStruct dataStruct,
                      bool isRepeated = false,
                      bool isSecond = false,
                      bool isAddFrame = true)
    {
        // construct MmapEvent
        MmapEvent *mmapEvent = new MmapEvent();
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

    void SetMunmapEvent(BatchNativeHookData &hookData, HookDataStruct dataStruct, bool isSecond, bool isAddFrame)
    {
        // construct MunmapEvent
        MunmapEvent *munmapEvent = new MunmapEvent();
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

    void SetTraceAllocEvent(BatchNativeHookData &hookData,
                            HookDataStruct dataStruct,
                            ProtoReader::TraceType traceType = ProtoReader::TraceType::ARKTS_HEAP,
                            bool isAddFrame = false,
                            bool isSecond = false)
    {
        // construct TraceAllocEvent
        TraceAllocEvent *traceAllocEvent = new TraceAllocEvent();
        traceAllocEvent->set_pid(PID);
        traceAllocEvent->set_tid(dataStruct.tid);
        traceAllocEvent->set_addr(dataStruct.addr);
        traceAllocEvent->set_size(dataStruct.size);
        traceAllocEvent->set_trace_type(static_cast<TraceType>(traceType));

        if (isAddFrame) {
            // construct traceAllocEvent's Frame
            auto frame = traceAllocEvent->add_frame_info();
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
        nativeHookData->set_allocated_trace_alloc_event(traceAllocEvent);
    }

    void SetTraceFreeEvent(BatchNativeHookData &hookData,
                           HookDataStruct dataStruct,
                           ProtoReader::TraceType traceType = ProtoReader::TraceType::ARKTS_HEAP,
                           bool isAddFrame = false,
                           bool isSecond = false)
    {
        // construct TraceFreeEvent
        TraceFreeEvent *traceFreeEvent = new TraceFreeEvent();
        traceFreeEvent->set_pid(PID);
        traceFreeEvent->set_tid(dataStruct.tid);
        traceFreeEvent->set_addr(dataStruct.addr);
        traceFreeEvent->set_trace_type(static_cast<TraceType>(traceType));

        // Add frame info if needed
        if (isAddFrame) {
            // construct traceFreeEvent's Frame
            auto frame = traceFreeEvent->add_frame_info();
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
        nativeHookData->set_allocated_trace_free_event(traceFreeEvent);
    }

    void SetTraceMoveEvent(BatchNativeHookData &hookData,
                           HookDataStruct dataStruct,
                           uint64_t newAddr,
                           ProtoReader::TraceType traceType = ProtoReader::TraceType::ARKTS_HEAP)
    {
        // construct TraceMoveEvent
        TraceMoveEvent *traceMoveEvent = new TraceMoveEvent();
        traceMoveEvent->set_pid(PID);
        traceMoveEvent->set_tid(dataStruct.tid);
        traceMoveEvent->set_addr(dataStruct.addr);
        traceMoveEvent->set_new_addr(newAddr);
        traceMoveEvent->set_trace_type(static_cast<TraceType>(traceType));
        traceMoveEvent->set_size(dataStruct.size);

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_trace_move_event(traceMoveEvent);
    }

    void SetTraceFreeRegionEvent(BatchNativeHookData &hookData,
                                 HookDataStruct dataStruct,
                                 ProtoReader::TraceType traceType = ProtoReader::TraceType::ARKTS_HEAP)
    {
        // construct TraceFreeRegionEvent
        TraceFreeRegionEvent *traceFreeRegionEvent = new TraceFreeRegionEvent();
        traceFreeRegionEvent->set_pid(PID);
        traceFreeRegionEvent->set_tid(dataStruct.tid);
        traceFreeRegionEvent->set_addr(dataStruct.addr);
        traceFreeRegionEvent->set_trace_type(static_cast<TraceType>(traceType));
        traceFreeRegionEvent->set_size(dataStruct.size);

        // add NativeHookData
        auto nativeHookData = hookData.add_events();
        nativeHookData->set_tv_sec(dataStruct.sec);
        nativeHookData->set_tv_nsec(dataStruct.nsec);
        nativeHookData->set_allocated_trace_free_region_event(traceFreeRegionEvent);
    }

    BatchNativeHookData CreateBatchNativeHookData(PbreaderDataSegment &dataSeg)
    {
        std::string hookStrMsg = "";
        BatchNativeHookData batchNativeHookData;
        SetAllocEvent(batchNativeHookData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, true);
        SetAllocEvent(batchNativeHookData, {TID_02, ADDR_02, SIZE_02, "", SEC_02, NSEC_02}, true);
        batchNativeHookData.SerializeToString(&hookStrMsg);
        dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
        ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
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
                    const uint64_t memSize,
                    const uint64_t allMemSize,
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

    NativeHookCache(const NativeHook &nativeHook, uint64_t index)
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
    NativeHookCache(const NativeHookCache &) = delete;
    NativeHookCache &operator=(const NativeHookCache &) = delete;
    bool operator==(const NativeHookCache &nativeHookCache) const
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
    inline uint64_t GetMemSize() const
    {
        return memSize_;
    }
    inline uint64_t GetAllMemSize() const
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
    uint64_t memSize_;
    uint64_t allMemSize_;
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

    NativeHookFrameCache(const NativeHookFrame &nativeHookFrame, const uint64_t index)
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
    NativeHookFrameCache(const NativeHookFrameCache &) = delete;
    NativeHookFrameCache &operator=(const NativeHookFrameCache &) = delete;
    bool operator==(const NativeHookFrameCache &frameCache) const
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
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

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    // start parse
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache expectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64, TIMESTAMP_01,
                                          0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);
    EXPECT_EQ(1, nativeHook.Size());

    // Verification parse NativeHook Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
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
    PbreaderDataSegment dataSeg;
    BatchNativeHookData batchNativeHookData = CreateBatchNativeHookData(dataSeg);
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    // Calculate partial expectations
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    EXPECT_TRUE(0 == nativeHook.Size());
    EXPECT_TRUE(0 == nativeHookFrame.Size());

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(INDEX_SIZE_02 == eventCount);
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
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
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    // Verification parse Malloc Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache secondExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                                SYMBOL_OFFSET_01);
    NativeHookFrameCache secondResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(secondExpectFrameCache == secondResultFrameCache);

    // Verification parse Free event results
    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    NativeHookCache expectNativeHookCache(INDEX_SIZE_02, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                          TIMESTAMP_02, 0, 0, ADDR_01, SIZE_01, 0, 0);
    NativeHookCache resultNativeHookCache(nativeHook, 1);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);

    // Verification parse Free Event Frame results
    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache expectFrameCache(INDEX_SIZE_02, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                          SYMBOL_OFFSET_02);
    NativeHookFrameCache resultFrameCache(nativeHookFrame, 1);
    EXPECT_TRUE(expectFrameCache == resultFrameCache);

    auto size = nativeHookFrame.Size();
    EXPECT_EQ(INDEX_SIZE_02, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse Malloc event results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache firstResultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(firstExpectNativeHookCache == firstResultNativeHookCache);

    // Verification parse Malloc Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                               SYMBOL_OFFSET_01);
    NativeHookFrameCache firstResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(firstExpectFrameCache == firstResultFrameCache);

    auto size = nativeHookFrame.Size();
    EXPECT_EQ(1, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse first Malloc event results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    NativeHookCache secondResultMallocCache(nativeHook, INDEX_SIZE_02);
    EXPECT_TRUE(secondExpectMallocCache == secondResultMallocCache);

    // Verification parse first Free event results
    NativeHookCache secondExpectFreeCache(INVALID_UINT32, expect_ipid, expect_itid, FREEEVENT.c_str(), INVALID_UINT64,
                                          TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache secondResultFreeCache(nativeHook, INDEX_SIZE_03);
    EXPECT_TRUE(secondExpectFreeCache == secondResultFreeCache);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse first Malloc event results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    NativeHookCache secondResultMallocCache(nativeHook, INDEX_SIZE_02);
    EXPECT_TRUE(secondExpectMallocCache == secondResultMallocCache);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_FREE, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
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
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookCache == resultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(1, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(0, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();

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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    auto mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_01);

    NativeHookCache firstExpectNativeHookCache(1, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01,
                                               TIMESTAMP_02 - TIMESTAMP_01);
    EXPECT_TRUE(firstExpectNativeHookCache == NativeHookCache(nativeHook, 0));

    expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_02);
    mmapSubType = stream_.traceDataCache_->dataDict_.GetStringIndex(TYPE_02);
    NativeHookCache secondExpectNativeHookCache(INDEX_SIZE_02, expect_ipid, expect_itid, MMAPEVENT.c_str(), mmapSubType,
                                                TIMESTAMP_02, 0, 0, ADDR_02, SIZE_02, SIZE_01 + SIZE_02, 0);
    EXPECT_TRUE(secondExpectNativeHookCache == NativeHookCache(nativeHook, 1));
    EXPECT_EQ(INDEX_SIZE_02, stream_.traceDataCache_->GetConstNativeHookData().Size());
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_01);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_01);
    NativeHookFrameCache firstExpectFrameCache(1, 0, IP_01, expectSymbolData, expectFilePathData, OFFSET_01,
                                               SYMBOL_OFFSET_01);
    EXPECT_TRUE(firstExpectFrameCache == NativeHookFrameCache(nativeHookFrame, 0));

    expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_02);
    expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_02);
    NativeHookFrameCache expectFrameCache(INDEX_SIZE_02, 0, IP_02, expectSymbolData, expectFilePathData, OFFSET_02,
                                          SYMBOL_OFFSET_02);
    EXPECT_TRUE(expectFrameCache == NativeHookFrameCache(nativeHookFrame, 1));
    EXPECT_EQ(INDEX_SIZE_02, nativeHookFrame.Size());
    EXPECT_EQ(INDEX_SIZE_02,
              stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(0, size);

    // Verification parse NativeHook Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();

    size = nativeHookFrame.Size();
    EXPECT_EQ(0, size);

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(INDEX_SIZE_02 == eventCount);
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    EXPECT_EQ(INDEX_SIZE_02, stream_.traceDataCache_->GetConstNativeHookData().Size());

    // Verification parse NativeHook Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
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
    EXPECT_EQ(INDEX_SIZE_02, nativeHookFrame.Size());

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
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
    EXPECT_EQ(INDEX_SIZE_02, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    NativeHookCache thirdResultNativeHookCache(nativeHook, INDEX_SIZE_02);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, INDEX_SIZE_03);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(INDEX_SIZE_04, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    NativeHookCache thirdResultNativeHookCache(nativeHook, INDEX_SIZE_02);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(INVALID_UINT32, expect_ipid, expect_itid, MUNMAPEVENT.c_str(),
                                                mmapSubType, TIMESTAMP_04, 0, 0, ADDR_03, SIZE_02, SIZE_02, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, INDEX_SIZE_03);
    EXPECT_TRUE(secondExpectNativeHookCache == secondResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(INDEX_SIZE_03, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MMAP, STAT_EVENT_RECEIVED));
    EXPECT_TRUE(INDEX_SIZE_02 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MUNMAP, STAT_EVENT_RECEIVED));
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
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    // Verification parse NativeHook results
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
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
    NativeHookCache thirdExpectNativeHookCache(INDEX_SIZE_02, expect_ipid, expect_itid, ALLOCEVENT.c_str(),
                                               INVALID_UINT64, TIMESTAMP_03, TIMESTAMP_04, TIMESTAMP_04 - TIMESTAMP_03,
                                               ADDR_02, SIZE_02, SIZE_02, TIMESTAMP_04 - TIMESTAMP_03);
    NativeHookCache thirdResultNativeHookCache(nativeHook, INDEX_SIZE_02);
    EXPECT_TRUE(thirdExpectNativeHookCache == thirdResultNativeHookCache);

    NativeHookCache fourthExpectNativeHookCache(INDEX_SIZE_02, expect_ipid, expect_itid, FREEEVENT.c_str(),
                                                INVALID_UINT64, TIMESTAMP_04, 0, 0, ADDR_02, SIZE_02, 0, 0);
    NativeHookCache fourthResultNativeHookCache(nativeHook, INDEX_SIZE_03);
    EXPECT_TRUE(fourthExpectNativeHookCache == fourthResultNativeHookCache);

    auto size = stream_.traceDataCache_->GetConstNativeHookData().Size();
    EXPECT_EQ(INDEX_SIZE_04, size);

    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
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
/**
 * @ts.name: ParseOfflineSymJsAbnormal
 * @ts.desc: Parse Abnormal Js Stack Data in Offline Sym
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseOfflineSymJsAbnormal, TestSize.Level1)
{
    TS_LOGI("test24-21");
    BatchNativeHookData nativeHookJsAbnormalData;
    SetOfflineAllocEvent(nativeHookJsAbnormalData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, false, true);
    // start parse
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNativeHookParser.UpdataOfflineSymbolizationMode(true);
    std::string hookJsAbnormalStrMsg = "";
    nativeHookJsAbnormalData.SerializeToString(&hookJsAbnormalStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookJsAbnormalStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookJsAbnormalStrMsg.data()),
                                         hookJsAbnormalStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasJsAbnormalSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasJsAbnormalSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    // Verification parse Malloc event results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache expectNativeHookEventCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookEventCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookEventCache == resultNativeHookEventCache);

    // Verification parse Malloc Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto size = nativeHookFrame.Size();
    EXPECT_EQ(0, size);
    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}
/**
 * @ts.name: ParseOfflineSymHybridStack
 * @ts.desc: Parse Native Hook and Arkts Mixed Stack Data in Offline Sym
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseOfflineSymMixedStack, TestSize.Level1)
{
    TS_LOGI("test24-22");
    BatchNativeHookData nativeHookMixedStackData;
    SetOfflineAllocEvent(nativeHookMixedStackData, {TID_01, ADDR_01, SIZE_01, "", SEC_01, NSEC_01}, true, false);
    // start parse
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNativeHookParser.UpdataOfflineSymbolizationMode(true);
    std::string hookStrMsg = "";
    nativeHookMixedStackData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;
    bool hasMixedStackSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasMixedStackSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    // Verification parse Malloc event results
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    NativeHookCache expectNativeHookEventCache(1, expect_ipid, expect_itid, ALLOCEVENT.c_str(), INVALID_UINT64,
                                               TIMESTAMP_01, 0, 0, ADDR_01, SIZE_01, SIZE_01, 0);
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    NativeHookCache resultNativeHookEventCache(nativeHook, 0);
    EXPECT_TRUE(expectNativeHookEventCache == resultNativeHookEventCache);
    // Verification parse Malloc Frame results
    const NativeHookFrame &nativeHookFrame = stream_.traceDataCache_->GetConstNativeHookFrameData();
    auto expectSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_03);
    auto expectFilePathData = stream_.traceDataCache_->dataDict_.GetStringIndex(FILE_PATH_03);
    NativeHookFrameCache jsExpectFrameCache(1, 0, IP_03, expectSymbolData, expectFilePathData, OFFSET_03,
                                            INVALID_UINT64);
    NativeHookFrameCache jsResultFrameCache(nativeHookFrame, 0);
    EXPECT_TRUE(jsExpectFrameCache == jsResultFrameCache);
    auto expectSymFailedSymName = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_04);
    NativeHookFrameCache symFailedExpectFrameCache(1, 1, IP_02, expectSymFailedSymName, INVALID_UINT64, INVALID_UINT64,
                                                   INVALID_UINT64);
    NativeHookFrameCache symFailedResultFrameCache(nativeHookFrame, 1);
    EXPECT_TRUE(symFailedExpectFrameCache == symFailedResultFrameCache);
    auto expectAllocSymbolData = stream_.traceDataCache_->dataDict_.GetStringIndex(SYMBOL_NAME_05);
    NativeHookFrameCache allocExpectFrameCache(1, INDEX_SIZE_02, STACK_MAP_ALLOC_IP, expectAllocSymbolData,
                                               INVALID_UINT64, INVALID_UINT64, INVALID_UINT64);
    NativeHookFrameCache allocResultFrameCache(nativeHookFrame, INDEX_SIZE_02);
    EXPECT_TRUE(allocExpectFrameCache == allocResultFrameCache);
    auto size = nativeHookFrame.Size();
    EXPECT_EQ(INDEX_SIZE_03, size);
    auto &statAndInfo = stream_.traceDataCache_->GetConstStatAndInfo();
    EXPECT_TRUE(1 == statAndInfo.GetValue(TRACE_NATIVE_HOOK_MALLOC, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseTraceAllocEventTest
 * @tc.desc: Parse a BatchNativeHookData with TraceAllocEvent only
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceAllocEventTest, TestSize.Level1)
{
    TS_LOGI("test24-23");
    // Construct BatchNativeHookData with alloc event
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), 1);

    NativeHookCache cache(nativeHook, 0);
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);

    EXPECT_EQ(cache.GetPid(), expect_ipid);
    EXPECT_EQ(cache.GetTid(), expect_itid);
    EXPECT_EQ(cache.GetAddress(), addr);
    EXPECT_EQ(cache.GetMemSize(), SIZE_03);
}

/**
 * @tc.name: ParseMultipleTraceAllocEventsTest
 * @tc.desc: Parse multiple TraceAllocEvents
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceAllocEventsTest, TestSize.Level1)
{
    TS_LOGI("test24-24");
    // Construct BatchNativeHookData with multiple alloc events
    BatchNativeHookData batchNativeHookData;
    uint64_t addr1 = ADDR_1000;
    uint64_t addr2 = ADDR_2000;
    uint64_t addr3 = ADDR_3000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr2, SIZE_02, "", SEC_02, NSEC_02},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr3, SIZE_02 + SIZE_03, "", SEC_03, NSEC_03},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_03);
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);

    NativeHookCache cache1(nativeHook, 0);
    EXPECT_EQ(cache1.GetPid(), expect_ipid);
    EXPECT_EQ(cache1.GetTid(), expect_itid);
    EXPECT_EQ(cache1.GetAddress(), addr1);
    EXPECT_EQ(cache1.GetMemSize(), SIZE_03);

    NativeHookCache cache2(nativeHook, 1);
    EXPECT_EQ(cache2.GetPid(), expect_ipid);
    EXPECT_EQ(cache2.GetTid(), expect_itid);
    EXPECT_EQ(cache2.GetAddress(), addr2);
    EXPECT_EQ(cache2.GetMemSize(), SIZE_02);

    NativeHookCache cache3(nativeHook, NUM_02);
    EXPECT_EQ(cache3.GetPid(), expect_ipid);
    EXPECT_EQ(cache3.GetTid(), expect_itid);
    EXPECT_EQ(cache3.GetAddress(), addr3);
    EXPECT_EQ(cache3.GetMemSize(), SIZE_02 + SIZE_03);
}

/**
 * @tc.name: ParseTraceAllocFreePairTest
 * @tc.desc: Parse TraceAllocEvent and TraceFreeEvent in pair
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceAllocFreePairTest, TestSize.Level1)
{
    TS_LOGI("test24-25");
    // Construct BatchNativeHookData with alloc and free events
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_02},
                      ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_02);
}

/**
 * @tc.name: ParseTraceFreeEventTest
 * @tc.desc: Parse a BatchNativeHookData with TraceAllocEvent and TraceFreeEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-26");
    // Construct BatchNativeHookData with alloc event
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string allocHookStrMsg = "";
    batchNativeHookData.SerializeToString(&allocHookStrMsg);

    PbreaderDataSegment allocDataSeg;
    allocDataSeg.seg = std::make_shared<std::string>(allocHookStrMsg);
    ProtoReader::BytesView allocHookBytesView(reinterpret_cast<const uint8_t *>(allocHookStrMsg.data()),
                                              allocHookStrMsg.size());
    allocDataSeg.protoData = allocHookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(allocDataSeg, hasSplit);
    BatchNativeHookData freeBatchData;
    SetTraceFreeEvent(freeBatchData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_02}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    std::string freeHookStrMsg = "";
    freeBatchData.SerializeToString(&freeHookStrMsg);

    PbreaderDataSegment freeDataSeg;
    freeDataSeg.seg = std::make_shared<std::string>(freeHookStrMsg);
    ProtoReader::BytesView freeHookBytesView(reinterpret_cast<const uint8_t *>(freeHookStrMsg.data()),
                                             freeHookStrMsg.size());
    freeDataSeg.protoData = freeHookBytesView;

    htraceNativeHookParser.Parse(freeDataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_02);

    NativeHookCache allocCache(nativeHook, 0);
    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
    EXPECT_EQ(allocCache.GetPid(), expect_ipid);
    EXPECT_EQ(allocCache.GetTid(), expect_itid);
    EXPECT_EQ(allocCache.GetMemSize(), SIZE_03);

    NativeHookCache freeCache(nativeHook, 1);
    EXPECT_EQ(freeCache.GetPid(), expect_ipid);
    EXPECT_EQ(freeCache.GetTid(), expect_itid);
    EXPECT_EQ(freeCache.GetMemSize(), SIZE_03);
}

/**
 * @tc.name: ParseMultipleTraceFreeEventTest
 * @tc.desc: Parse multiple TraceFreeEvents for the same address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-27");
    // Construct BatchNativeHookData with alloc event
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string allocHookStrMsg = "";
    batchNativeHookData.SerializeToString(&allocHookStrMsg);

    PbreaderDataSegment allocDataSeg;
    allocDataSeg.seg = std::make_shared<std::string>(allocHookStrMsg);
    ProtoReader::BytesView allocHookBytesView(reinterpret_cast<const uint8_t *>(allocHookStrMsg.data()),
                                              allocHookStrMsg.size());
    allocDataSeg.protoData = allocHookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(allocDataSeg, hasSplit);

    BatchNativeHookData freeBatchData;
    SetTraceFreeEvent(freeBatchData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_02}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    SetTraceFreeEvent(freeBatchData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_03}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    SetTraceFreeEvent(freeBatchData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_04}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);

    std::string freeHookStrMsg = "";
    freeBatchData.SerializeToString(&freeHookStrMsg);

    PbreaderDataSegment freeDataSeg;
    freeDataSeg.seg = std::make_shared<std::string>(freeHookStrMsg);
    ProtoReader::BytesView freeHookBytesView(reinterpret_cast<const uint8_t *>(freeHookStrMsg.data()),
                                             freeHookStrMsg.size());
    freeDataSeg.protoData = freeHookBytesView;
    htraceNativeHookParser.Parse(freeDataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_02);
}

/**
 * @tc.name: ParseTraceFreeAllocFreeEventTest
 * @tc.desc: Parse TraceFreeEvent, then TraceAllocEvent, then TraceFreeEvent for the same address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeAllocFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-28");
    // Construct BatchNativeHookData with alloc event
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string allocHookStrMsg = "";
    batchNativeHookData.SerializeToString(&allocHookStrMsg);
    PbreaderDataSegment allocDataSeg;
    allocDataSeg.seg = std::make_shared<std::string>(allocHookStrMsg);
    ProtoReader::BytesView allocHookBytesView(reinterpret_cast<const uint8_t *>(allocHookStrMsg.data()),
                                              allocHookStrMsg.size());
    allocDataSeg.protoData = allocHookBytesView;
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(allocDataSeg, hasSplit);

    BatchNativeHookData freeBatchData;
    SetTraceFreeEvent(freeBatchData, {TID_01, addr, SIZE_03, "", SEC_02, NSEC_01}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    std::string freeHookStrMsg = "";
    freeBatchData.SerializeToString(&freeHookStrMsg);
    PbreaderDataSegment freeDataSeg;
    freeDataSeg.seg = std::make_shared<std::string>(freeHookStrMsg);
    ProtoReader::BytesView freeHookBytesView(reinterpret_cast<const uint8_t *>(freeHookStrMsg.data()),
                                             freeHookStrMsg.size());
    freeDataSeg.protoData = freeHookBytesView;
    htraceNativeHookParser.Parse(freeDataSeg, hasSplit);

    BatchNativeHookData reallocBatchData;
    SetTraceAllocEvent(reallocBatchData, {TID_01, addr, SIZE_02, "", SEC_03, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string reallocHookStrMsg = "";
    reallocBatchData.SerializeToString(&reallocHookStrMsg);
    PbreaderDataSegment reallocDataSeg;
    reallocDataSeg.seg = std::make_shared<std::string>(reallocHookStrMsg);
    ProtoReader::BytesView reallocHookBytesView(reinterpret_cast<const uint8_t *>(reallocHookStrMsg.data()),
                                                reallocHookStrMsg.size());
    reallocDataSeg.protoData = reallocHookBytesView;
    htraceNativeHookParser.Parse(reallocDataSeg, hasSplit);

    BatchNativeHookData refreeBatchData;
    SetTraceFreeEvent(refreeBatchData, {TID_01, addr, SIZE_02, "", SEC_04, NSEC_01}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    std::string refreeHookStrMsg = "";
    refreeBatchData.SerializeToString(&refreeHookStrMsg);
    PbreaderDataSegment refreeDataSeg;
    refreeDataSeg.seg = std::make_shared<std::string>(refreeHookStrMsg);
    ProtoReader::BytesView refreeHookBytesView(reinterpret_cast<const uint8_t *>(refreeHookStrMsg.data()),
                                               refreeHookStrMsg.size());
    refreeDataSeg.protoData = refreeHookBytesView;
    htraceNativeHookParser.Parse(refreeDataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_04);
}

/**
 * @tc.name: ParseTraceMoveEventTest
 * @tc.desc: Parse a BatchNativeHookData with TraceAllocEvent and TraceMoveEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveEventTest, TestSize.Level1)
{
    TS_LOGI("test24-29");
    // Construct BatchNativeHookData with both alloc and move events
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr = ADDR_2000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_02, NSEC_02}, newAddr);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_03);

    // Find the new AllocEvent with newAddr
    bool foundNewAddr = false;
    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        if (cache.GetAddress() == newAddr && cache.GetMemSize() == SIZE_03 &&
            cache.GetEventType() == "ARKTS_HEAP_Alloc_Event") {
            foundNewAddr = true;
            auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
            auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
            EXPECT_EQ(cache.GetPid(), expect_ipid);
            EXPECT_EQ(cache.GetTid(), expect_itid);
            EXPECT_EQ(cache.GetAddress(), newAddr);
            EXPECT_EQ(cache.GetMemSize(), SIZE_03);
            break;
        }
    }
    EXPECT_TRUE(foundNewAddr) << "New address " << newAddr << " not found";
}

/**
 * @tc.name: ParseMultipleTraceMoveEventTest
 * @tc.desc: Parse multiple TraceMoveEvents for the same address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceMoveEventTest, TestSize.Level1)
{
    TS_LOGI("test24-30");
    // Construct BatchNativeHookData with alloc and multiple move events
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr1 = ADDR_2000;
    uint64_t newAddr2 = ADDR_3000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_02, NSEC_02}, newAddr1);
    SetTraceMoveEvent(batchNativeHookData, {TID_01, newAddr1, SIZE_03, "", SEC_03, NSEC_03}, newAddr2);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_05);

    // Find the last AllocEvent with newAddr2
    bool foundNewAddr2 = false;
    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        if (cache.GetAddress() == newAddr2 && cache.GetMemSize() == SIZE_03 &&
            cache.GetEventType() == "ARKTS_HEAP_Alloc_Event") {
            foundNewAddr2 = true;
            auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
            auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);
            EXPECT_EQ(cache.GetPid(), expect_ipid);
            EXPECT_EQ(cache.GetTid(), expect_itid);
            EXPECT_EQ(cache.GetAddress(), newAddr2);
            EXPECT_EQ(cache.GetMemSize(), SIZE_03);
            break;
        }
    }
    EXPECT_TRUE(foundNewAddr2) << "Last move target address " << newAddr2 << " not found";
}

/**
 * @tc.name: ParseTraceMoveFreeEventTest
 * @tc.desc: Parse TraceMoveEvent followed by TraceFreeEvent for the new address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-31");
    // Construct BatchNativeHookData with alloc, move, and free events
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr = ADDR_2000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_02, NSEC_02}, newAddr);
    SetTraceFreeEvent(batchNativeHookData, {TID_01, newAddr, SIZE_03, "", SEC_03, NSEC_03});
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_04);
}

/**
 * @tc.name: ParseTraceFreeRegionEventTest
 * @tc.desc: Parse a BatchNativeHookData with TraceAllocEvent and TraceFreeRegionEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeRegionEventTest, TestSize.Level1)
{
    TS_LOGI("test24-32");
    // Construct BatchNativeHookData with alloc and free region events
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_03, "", SEC_02, NSEC_02});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_2000, SIZE_03, "", SEC_03, NSEC_03});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_4000, SIZE_03, "", SEC_04, NSEC_04});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr, NUM_3000, "", SEC_05, NSEC_05});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_07);

    auto expect_ipid = stream_.streamFilters_->processFilter_->GetInternalPid(PID);
    auto expect_itid = stream_.streamFilters_->processFilter_->GetInternalTid(TID_01);

    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        EXPECT_EQ(cache.GetPid(), expect_ipid);
        EXPECT_EQ(cache.GetTid(), expect_itid);
        if (i < NUM_04) { // First 4 events are alloc events
            EXPECT_EQ(cache.GetMemSize(), SIZE_03);
        }
    }
}

/**
 * @tc.name: ParseMultipleTraceFreeRegionEventTest
 * @tc.desc: Parse multiple TraceFreeRegionEvents for overlapping regions
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceFreeRegionEventTest, TestSize.Level1)
{
    TS_LOGI("test24-33");
    // Construct BatchNativeHookData with alloc and multiple overlapping free region events
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_03, "", SEC_02, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_2000, SIZE_03, "", SEC_03, NSEC_01});

    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr, NUM_1500, "", SEC_04, NSEC_01});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, NUM_1500, "", SEC_05, NSEC_01});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();

    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_06);
}

/**
 * @tc.name: ParseTraceFreeRegionPartialOverlapTest
 * @tc.desc: Parse TraceFreeRegionEvent that partially overlaps with allocations
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeRegionPartialOverlapTest, TestSize.Level1)
{
    TS_LOGI("test24-34");
    // Construct BatchNativeHookData with alloc and partially overlapping free region event
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_2000, SIZE_03, "", SEC_01, NSEC_02});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_4000, SIZE_03, "", SEC_01, NSEC_03});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1500, NUM_3000, "", SEC_01, NSEC_04});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_05);
}

/**
 * @tc.name: ParseTraceAllocFreeUnpairTest
 * @tc.desc: Parse TraceFreeEvent without matching TraceAllocEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceAllocFreeUnpairTest, TestSize.Level1)
{
    TS_LOGI("test24-35");
    // Construct BatchNativeHookData with free event only (no matching alloc)
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000;
    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                      ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_TRUE(nativeHook.Size() <= 1);
}

/**
 * @tc.name: ParseMultipleTraceAllocPartialFreeTest
 * @tc.desc: Parse multiple TraceAllocEvents and partially free them
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceAllocPartialFreeTest, TestSize.Level1)
{
    TS_LOGI("test24-36");
    // Construct BatchNativeHookData with multiple alloc and some free events
    BatchNativeHookData batchNativeHookData;
    uint64_t addr1 = ADDR_1000;
    uint64_t addr2 = ADDR_2000;
    uint64_t addr3 = ADDR_3000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr2, SIZE_03, "", SEC_01, NSEC_02},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr3, SIZE_03, "", SEC_01, NSEC_03},
                       ProtoReader::TraceType::ARKTS_HEAP, true);

    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_01, NSEC_04},
                      ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr3, SIZE_03, "", SEC_01, NSEC_05},
                      ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_05);
}

/**
 * @tc.name: ParseTraceAllocFreeAllocTest
 * @tc.desc: Parse TraceAllocEvent, TraceFreeEvent, then TraceAllocEvent again for the same address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceAllocFreeAllocTest, TestSize.Level1)
{
    TS_LOGI("test24-37");
    // Construct BatchNativeHookData with alloc, free, then alloc again for same address
    BatchNativeHookData batchNativeHookData;

    uint64_t addr = ADDR_1000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_02},
                      ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr, SIZE_02, "", SEC_01, NSEC_03},
                       ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_03);
}

/**
 * @tc.name: ParseTraceMultiAllocFreeEventTest
 * @tc.desc: Parse multiple TraceAllocEvents and then multiple TraceFreeEvents in different order
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMultiAllocFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-38");
    // Construct BatchNativeHookData with multiple alloc events
    BatchNativeHookData batchNativeHookData;
    uint64_t addr1 = ADDR_1000;
    uint64_t addr2 = ADDR_2000;
    uint64_t addr3 = ADDR_3000;
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_01, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr2, SIZE_02, "", SEC_02, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr3, SIZE_02 + SIZE_03, "", SEC_03, NSEC_01},
                       ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string allocHookStrMsg = "";
    batchNativeHookData.SerializeToString(&allocHookStrMsg);
    PbreaderDataSegment allocDataSeg;
    allocDataSeg.seg = std::make_shared<std::string>(allocHookStrMsg);
    ProtoReader::BytesView allocHookBytesView(reinterpret_cast<const uint8_t *>(allocHookStrMsg.data()),
                                              allocHookStrMsg.size());
    allocDataSeg.protoData = allocHookBytesView;
    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(allocDataSeg, hasSplit);

    BatchNativeHookData freeBatchData;
    SetTraceFreeEvent(freeBatchData, {TID_01, addr2, SIZE_02, "", SEC_04, NSEC_01}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    SetTraceFreeEvent(freeBatchData, {TID_01, addr1, SIZE_03, "", SEC_05, NSEC_01}, ProtoReader::TraceType::ARKTS_HEAP,
                      true);
    SetTraceFreeEvent(freeBatchData, {TID_01, addr3, SIZE_02 + SIZE_03, "", SEC_06, NSEC_01},
                      ProtoReader::TraceType::ARKTS_HEAP, true);

    std::string freeHookStrMsg = "";
    freeBatchData.SerializeToString(&freeHookStrMsg);
    PbreaderDataSegment freeDataSeg;
    freeDataSeg.seg = std::make_shared<std::string>(freeHookStrMsg);
    ProtoReader::BytesView freeHookBytesView(reinterpret_cast<const uint8_t *>(freeHookStrMsg.data()),
                                             freeHookStrMsg.size());
    freeDataSeg.protoData = freeHookBytesView;
    htraceNativeHookParser.Parse(freeDataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_06);
}

/**
 * @tc.name: ParseTraceFreeNonExistentAddressTest
 * @tc.desc: Parse TraceFreeEvent for a non-existent address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeNonExistentAddressTest, TestSize.Level1)
{
    TS_LOGI("test24-39");
    // Construct BatchNativeHookData with only free event (no matching alloc)
    BatchNativeHookData batchNativeHookData;
    uint64_t addr = ADDR_1000; // Address that was never allocated

    SetTraceFreeEvent(batchNativeHookData, {TID_01, addr, SIZE_03, "", SEC_01, NSEC_01},
                      ProtoReader::TraceType::ARKTS_HEAP, true);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_LE(nativeHook.Size(), 1); // Should not crash and should have at most 1 event
}

/**
 * @tc.name: ParseTraceMoveNonExistentAddressTest
 * @tc.desc: Parse TraceMoveEvent for a non-existent address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveNonExistentAddressTest, TestSize.Level1)
{
    TS_LOGI("test24-40");
    // Construct BatchNativeHookData with only move event (no matching alloc)
    BatchNativeHookData batchNativeHookData;
    uint64_t nonExistentAddr = ADDR_1000; // Address that was never allocated
    uint64_t newAddr = ADDR_2000;

    SetTraceMoveEvent(batchNativeHookData, {TID_01, nonExistentAddr, SIZE_03, "", SEC_01, NSEC_01}, newAddr);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_LE(nativeHook.Size(), 1); // Should not crash and should have at most 1 event
}

/**
 * @tc.name: ParseTraceMultiAllocMoveEventTest
 * @tc.desc: Parse multiple TraceAllocEvents and then TraceMoveEvents for different addresses
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMultiAllocMoveEventTest, TestSize.Level1)
{
    TS_LOGI("test24-41");
    // Construct BatchNativeHookData with multiple alloc and move events
    BatchNativeHookData batchNativeHookData;
    uint64_t addr1 = ADDR_1000;
    uint64_t addr2 = ADDR_2000;
    uint64_t newAddr1 = ADDR_3000;
    uint64_t newAddr2 = ADDR_4000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr2, SIZE_02, "", SEC_01, NSEC_02});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, addr1, SIZE_03, "", SEC_02, NSEC_03}, newAddr1);
    SetTraceMoveEvent(batchNativeHookData, {TID_01, addr2, SIZE_02, "", SEC_02, NSEC_04}, newAddr2);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_06);

    bool foundNewAddr1 = false;
    bool foundNewAddr2 = false;
    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();

        if (cacheAddr == newAddr1 && cache.GetMemSize() == SIZE_03) {
            foundNewAddr1 = true;
        } else if (cacheAddr == newAddr2 && cache.GetMemSize() == SIZE_02) {
            foundNewAddr2 = true;
        }
    }
    EXPECT_TRUE(foundNewAddr1);
    EXPECT_TRUE(foundNewAddr2);
}

/**
 * @tc.name: ParseTraceMoveAllocNewAddressTest
 * @tc.desc: Parse TraceMoveEvent and then TraceAllocEvent for the original address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveAllocNewAddressTest, TestSize.Level1)
{
    TS_LOGI("test24-42");
    // Construct BatchNativeHookData with move and then alloc for original address
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr = ADDR_2000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_02, NSEC_02}, newAddr);
    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, SIZE_03, "", SEC_03, NSEC_03});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_04);

    bool foundNewAddr = false;
    bool foundOriginalAddr = false;
    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();

        if (cacheAddr == newAddr && cache.GetMemSize() == SIZE_03) {
            foundNewAddr = true;
        } else if (cacheAddr == originalAddr && cache.GetMemSize() == SIZE_03) {
            foundOriginalAddr = true;
        }
    }
    EXPECT_TRUE(foundNewAddr);
    EXPECT_TRUE(foundOriginalAddr);
}

/**
 * @tc.name: ParseTraceFreeRegionNonOverlapTest
 * @tc.desc: Parse TraceFreeRegionEvent that doesn't overlap with any allocations
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeRegionNonOverlapTest, TestSize.Level1)
{
    TS_LOGI("test24-43");
    // Construct BatchNativeHookData with alloc and non-overlapping free region event
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_2000, SIZE_03, "", SEC_01, NSEC_02});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr + NUM_4000, NUM_1000, "", SEC_01, NSEC_03});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_02);
}

/**
 * @tc.name: ParseTraceFreeRegionAllocAfterTest
 * @tc.desc: Parse TraceFreeRegionEvent followed by new allocations in the freed region
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeRegionAllocAfterTest, TestSize.Level1)
{
    TS_LOGI("test24-44");
    // Construct BatchNativeHookData with alloc, free region, then new alloc in freed region
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_03, "", SEC_01, NSEC_02});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr, NUM_2000, "", SEC_01, NSEC_03});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_04});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_02, "", SEC_01, NSEC_05});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_05);
}

/**
 * @tc.name: ParseTraceFreeRegionFreeAfterTest
 * @tc.desc: Parse TraceFreeRegionEvent followed by individual TraceFreeEvents
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceFreeRegionFreeAfterTest, TestSize.Level1)
{
    TS_LOGI("test24-45");
    // Construct BatchNativeHookData with alloc, free region, then individual free events
    BatchNativeHookData batchNativeHookData;
    uint64_t baseAddr = ADDR_1000;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_03, "", SEC_02, NSEC_01});
    SetTraceFreeRegionEvent(batchNativeHookData, {TID_01, baseAddr, NUM_2000, "", SEC_03, NSEC_01});
    SetTraceFreeEvent(batchNativeHookData, {TID_01, baseAddr, SIZE_03, "", SEC_04, NSEC_01});
    SetTraceFreeEvent(batchNativeHookData, {TID_01, baseAddr + NUM_1000, SIZE_03, "", SEC_05, NSEC_01});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_04);
}

/**
 * @tc.name: ParseTraceMoveDifferentSizeEventTest
 * @tc.desc: Parse TraceMoveEvent with different size
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveDifferentSizeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-46");
    // Construct BatchNativeHookData with alloc and move events with different size
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr = ADDR_2000;
    int64_t originalSize = SIZE_03;
    int64_t newSize = SIZE_02;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, originalSize, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, newSize, "", SEC_02, NSEC_02}, newAddr);
    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);

    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_03);

    bool foundAllocEvent = false;
    bool foundFreeEvent = false;
    bool foundNewAllocEvent = false;
    for (uint64_t i = 0; i < nativeHook.Size(); i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();
        int64_t cacheSize = cache.GetMemSize();
        std::string eventType = cache.GetEventType();

        if (eventType == "ARKTS_HEAP_Alloc_Event" && cacheAddr == originalAddr && cacheSize == originalSize) {
            foundAllocEvent = true;
        } else if (eventType == "ARKTS_HEAP_Free_Event" && cacheAddr == originalAddr && cacheSize == originalSize) {
            foundFreeEvent = true;
        } else if (eventType == "ARKTS_HEAP_Alloc_Event" && cacheAddr == newAddr && cacheSize == newSize) {
            foundNewAllocEvent = true;
        }
    }
    EXPECT_TRUE(foundAllocEvent);
    EXPECT_TRUE(foundFreeEvent);
    EXPECT_TRUE(foundNewAllocEvent);
}

/**
 * @tc.name: ParseMultipleTraceMoveDifferentSizeEventTest
 * @tc.desc: Parse multiple TraceMoveEvents with different sizes for the same address
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseMultipleTraceMoveDifferentSizeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-47");
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr1 = ADDR_2000;
    uint64_t newAddr2 = ADDR_3000;
    uint64_t newAddr3 = ADDR_4000;
    int64_t originalSize = SIZE_03;
    int64_t newSize1 = SIZE_02;
    int64_t newSize2 = SIZE_01;
    int64_t newSize3 = SIZE_03 * NUM_05;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, originalSize, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, newSize1, "", SEC_02, NSEC_02}, newAddr1);
    SetTraceMoveEvent(batchNativeHookData, {TID_01, newAddr1, newSize2, "", SEC_03, NSEC_03}, newAddr2);
    SetTraceMoveEvent(batchNativeHookData, {TID_01, newAddr2, newSize3, "", SEC_04, NSEC_04}, newAddr3);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_07);

    bool foundLastAllocEvent = false;
    int64_t totalEvents = nativeHook.Size();
    for (uint64_t i = 0; i < totalEvents; i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();
        int64_t cacheSize = cache.GetMemSize();
        std::string eventType = cache.GetEventType();

        if (eventType == "ARKTS_HEAP_Alloc_Event" && cacheAddr == newAddr3 && cacheSize == newSize3) {
            foundLastAllocEvent = true;
            break;
        }
    }
    EXPECT_TRUE(foundLastAllocEvent);
}

/**
 * @tc.name: ParseTraceMoveDifferentSizeFreeEventTest
 * @tc.desc: Parse TraceMoveEvent with different size followed by FreeEvent
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMoveDifferentSizeFreeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-48");
    BatchNativeHookData batchNativeHookData;
    uint64_t originalAddr = ADDR_1000;
    uint64_t newAddr = ADDR_2000;
    int64_t originalSize = SIZE_03;
    int64_t newSize = SIZE_02;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, originalAddr, originalSize, "", SEC_01, NSEC_01});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, originalAddr, newSize, "", SEC_02, NSEC_02}, newAddr);
    SetTraceFreeEvent(batchNativeHookData, {TID_01, newAddr, newSize, "", SEC_03, NSEC_03});

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_04);

    bool foundFinalFreeEvent = false;
    int64_t totalEvents = nativeHook.Size();
    for (uint64_t i = 0; i < totalEvents; i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();
        int64_t cacheSize = cache.GetMemSize();
        std::string eventType = cache.GetEventType();

        if (eventType == "ARKTS_HEAP_Free_Event" && cacheAddr == newAddr && cacheSize == newSize) {
            foundFinalFreeEvent = true;
            break;
        }
    }
    EXPECT_TRUE(foundFinalFreeEvent);
}

/**
 * @tc.name: ParseTraceMultiAllocMoveDifferentSizeEventTest
 * @tc.desc: Parse multiple TraceAllocEvents and TraceMoveEvents with different sizes
 * @tc.type: FUNC
 */
HWTEST_F(NativeHookParserTest, ParseTraceMultiAllocMoveDifferentSizeEventTest, TestSize.Level1)
{
    TS_LOGI("test24-49");
    BatchNativeHookData batchNativeHookData;

    uint64_t addr1 = ADDR_1000;
    uint64_t newAddr1 = ADDR_2000;
    int64_t size1 = SIZE_03;
    int64_t newSize1 = SIZE_02;

    uint64_t addr2 = ADDR_5000;
    uint64_t newAddr2 = ADDR_6000;
    int64_t size2 = SIZE_02;
    int64_t newSize2 = SIZE_01;

    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr1, size1, "", SEC_01, NSEC_01});
    SetTraceAllocEvent(batchNativeHookData, {TID_01, addr2, size2, "", SEC_01, NSEC_02});
    SetTraceMoveEvent(batchNativeHookData, {TID_01, addr1, newSize1, "", SEC_02, NSEC_01}, newAddr1);
    SetTraceMoveEvent(batchNativeHookData, {TID_01, addr2, newSize2, "", SEC_02, NSEC_02}, newAddr2);

    std::string hookStrMsg = "";
    batchNativeHookData.SerializeToString(&hookStrMsg);
    PbreaderDataSegment dataSeg;
    dataSeg.seg = std::make_shared<std::string>(hookStrMsg);
    ProtoReader::BytesView hookBytesView(reinterpret_cast<const uint8_t *>(hookStrMsg.data()), hookStrMsg.size());
    dataSeg.protoData = hookBytesView;

    PbreaderNativeHookParser htraceNativeHookParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool hasSplit = false;
    htraceNativeHookParser.Parse(dataSeg, hasSplit);
    htraceNativeHookParser.FinishParseNativeHookData();
    const NativeHook &nativeHook = stream_.traceDataCache_->GetConstNativeHookData();
    EXPECT_EQ(nativeHook.Size(), NUM_06);

    bool foundMovedAlloc1 = false;
    bool foundMovedAlloc2 = false;
    int64_t totalEvents = nativeHook.Size();
    for (uint64_t i = 0; i < totalEvents; i++) {
        NativeHookCache cache(nativeHook, i);
        uint64_t cacheAddr = cache.GetAddress();
        int64_t cacheSize = cache.GetMemSize();
        std::string eventType = cache.GetEventType();
        if (eventType == "ARKTS_HEAP_Alloc_Event" && cacheAddr == newAddr1 && cacheSize == newSize1) {
            foundMovedAlloc1 = true;
        } else if (eventType == "ARKTS_HEAP_Alloc_Event" && cacheAddr == newAddr2 && cacheSize == newSize2) {
            foundMovedAlloc2 = true;
        }
    }
    EXPECT_TRUE(foundMovedAlloc1);
    EXPECT_TRUE(foundMovedAlloc2);
}
} // namespace NativeMemoryUnitTest
} // namespace TraceStreamer
} // namespace SysTuning