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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#define private public
#include "frame_filter.h"
#include "process_filter.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
const uint64_t START_TS = 1;
const uint32_t PID1 = 156;
const uint32_t TID1 = 248;
const uint64_t EXPECTED_START = 5;
const uint64_t EXPECTED_END = 10;
const uint32_t VSYNC_ID = 1;
const uint32_t CALLSTACK_SLICE_ID = 1;
const uint32_t CALLSTACK_SLICE_ID2 = 1;
const uint64_t RS_START_TS = 5;
const uint32_t RS_PID = 2;
const uint32_t RS_TID = 2;
const uint64_t RS_EXPECTED_START = 6;
const uint64_t RS_EXPECTED_END = 11;
const uint32_t RS_VSYNC_ID = 2;
const uint32_t RS_CALLSTACK_SLICE_ID = 2;
const size_t SON_THREAD_DATA_INDEX = 2;
const uint8_t INVALID_DATA = 2;

class FrameFilterTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

public:
    TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: AppVsyncNoFrameNum
 * @tc.desc: app's vsync event no frameNum
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, AppVsyncNoFrameNum, TestSize.Level1)
{
    TS_LOGI("test6-1");
    // ut 1 no frameNum
    // app ---------------VSYNCStart------------------End---uint64_t ts,
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    const uint64_t END_TS = 10;
    auto res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_FALSE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[0], 0);                // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[1], INVALID_UINT8);    // expect frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->TimeStampData()[0], START_TS); // actural frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->TimeStampData()[1], EXPECTED_START);       // expect frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0], END_TS - START_TS);             // actural frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[1], EXPECTED_END - EXPECTED_START); // expect frame
}

/**
 * @tc.name: AppVsyncHasFrameNum
 * @tc.desc: app's vsync event has frameNum
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, AppVsyncHasFrameNum, TestSize.Level1)
{
    TS_LOGI("test6-2");
    // ut 2 has frameNum
    // app -----VSYNCStart------------------End---
    //     -----------------frameNum--------------
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    const uint64_t FRAME_TS = 5;
    const uint32_t FRAME_NUM = 1;
    bool res = stream_.streamFilters_->frameFilter_->BeginRSTransactionData(itid, FRAME_NUM, itid);
    EXPECT_TRUE(res);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[0], 0);                // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[1], 255);              // expect frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->TimeStampData()[0], START_TS); // actural frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->TimeStampData()[1], EXPECTED_START);       // expect frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0], END_TS - START_TS);             // actural frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[1], EXPECTED_END - EXPECTED_START); // expect frame
    EXPECT_EQ(stream_.streamFilters_->frameFilter_->dstRenderSlice_[itid][FRAME_NUM].get()->startTs_, START_TS);
}
/**
 * @tc.name: RSVsyncHasFrameNum
 * @tc.desc: RS's vsync event has no frameNum
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, RSVsyncHasNoFrameNum, TestSize.Level1)
{
    TS_LOGI("test6-3");
    // ut3 RS no frame
    // RS ---------------VSYNCStart------------------End---
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    auto res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid);
    EXPECT_TRUE(res);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    EXPECT_TRUE(stream_.streamFilters_->frameFilter_->vsyncRenderSlice_[itid].begin()->get()->isRsMainThread_ == true);
}

/**
 * @tc.name: RSVsyncHasFrameNumNotMatched
 * @tc.desc: RS's vsync event has frameNum,but not matched
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, RSVsyncHasFrameNumNotMatched, TestSize.Level1)
{
    TS_LOGI("test6-4");
    // ut4 RS has frame, bu not matched
    // RS -----VSYNCStart------------------End---
    //     -----------frameNum-------------------
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    auto res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid);
    EXPECT_TRUE(res);

    const uint32_t SOURCE_ITID1 = 2;
    const uint32_t SOURCE_FRAME_NUM = 1;
    std::vector<FrameFilter::FrameMap> frames;
    frames.push_back({SOURCE_ITID1, SOURCE_FRAME_NUM});
    stream_.streamFilters_->frameFilter_->BeginProcessCommandUni(itid, frames, 0);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    EXPECT_TRUE(stream_.streamFilters_->frameFilter_->vsyncRenderSlice_[itid].begin()->get()->isRsMainThread_ == true);
    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Srcs()[0].empty() == true);
}

/**
 * @tc.name: RSVsyncHasGpu
 * @tc.desc: RS's vsync event has gpu
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, RSVsyncHasGpu, TestSize.Level1)
{
    TS_LOGI("test6-5");
    // ut5 RS has gpu inner
    // RS -----VSYNCStart------------------End---
    // --------------gpuStart----gpuEnd----------
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    auto res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid);
    EXPECT_TRUE(res);

    const uint32_t SOURCE_ITID1 = 2;
    const uint32_t SOURCE_FRAME_NUM = 1;
    std::vector<FrameFilter::FrameMap> frames;
    frames.push_back({SOURCE_ITID1, SOURCE_FRAME_NUM});
    stream_.streamFilters_->frameFilter_->BeginProcessCommandUni(itid, frames, 0);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    EXPECT_TRUE(
        (stream_.streamFilters_->frameFilter_->vsyncRenderSlice_[itid].begin()->get()->isRsMainThread_ == true));
    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Srcs()[0].empty() == true);
}

/**
 * @tc.name: RSVsyncHasGpuCross
 * @tc.desc: RS's vsync event has gpu
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, RSVsyncHasGpuCross, TestSize.Level1)
{
    TS_LOGI("test6-6");
    // ut6 RS has gpu later
    // RS -----VSYNCStart------------------End------------
    // ------------------------------gpuStart----gpuEnd---
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    auto res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid);
    EXPECT_TRUE(res);
    const uint64_t GPU_START_TS = 3;
    stream_.streamFilters_->frameFilter_->StartFrameQueue(GPU_START_TS, itid);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);

    const uint64_t GPU_END_TS = 15;
    res = stream_.streamFilters_->frameFilter_->EndFrameQueue(GPU_END_TS, itid);

    EXPECT_TRUE(res);
    EXPECT_TRUE(
        (stream_.streamFilters_->frameFilter_->vsyncRenderSlice_[itid].begin()->get()->isRsMainThread_ == true));
    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0] == GPU_END_TS - START_TS);
}

/**
 * @tc.name: RSVsyncHasGpu2Slices
 * @tc.desc: RS's vsync event has gpu, two slice across
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, RSVsyncHasGpu2Slices, TestSize.Level1)
{
    TS_LOGI("test6-7");
    // ut7 RS two slice across
    // RS -----VSYNCStart------------------End-----VSYNCStart------------------End--------
    // --------------gpuStart------------------------------gpuEnd---------gpuStart----gpuEnd------
    BytraceLine line1 = {START_TS, TID1};
    line1.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line1, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    auto res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid);
    EXPECT_TRUE(res);
    const uint64_t GPU_START_TS = 3;
    stream_.streamFilters_->frameFilter_->StartFrameQueue(GPU_START_TS, itid);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);

    const uint64_t START_TS2 = 4;
    const uint64_t EXPECTED_START2 = 6;
    const uint64_t EXPECTED_END2 = 11;
    const uint32_t VSYNC_ID2 = 2;
    const uint32_t CALLSTACK_SLICE_ID2 = 2;
    BytraceLine line2 = {START_TS2, TID1};
    line2.tgid = PID1;
    auto itid2 = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line2, EXPECTED_START2, EXPECTED_END2, VSYNC_ID2,
                                                          CALLSTACK_SLICE_ID2);
    res = stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(itid2);
    EXPECT_TRUE(res);

    const uint64_t GPU_END_TS = 15;
    res = stream_.streamFilters_->frameFilter_->EndFrameQueue(GPU_END_TS, itid2);

    const uint64_t GPU_START_TS2 = 16;
    stream_.streamFilters_->frameFilter_->StartFrameQueue(GPU_START_TS2, itid2);
    const uint64_t END_TS2 = 18;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS2, itid2);

    const uint64_t GPU_END_TS2 = 20;
    res = stream_.streamFilters_->frameFilter_->EndFrameQueue(GPU_END_TS2, itid2);

    EXPECT_TRUE(res);
    EXPECT_TRUE(
        (stream_.streamFilters_->frameFilter_->vsyncRenderSlice_[itid].begin()->get()->isRsMainThread_ == true));
    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0] == GPU_END_TS - START_TS);
    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Durs()[2] == GPU_END_TS2 - START_TS2);
    EXPECT_TRUE(stream_.streamFilters_->frameFilter_->vsyncRenderSlice_.size() == 1);
}

/**
 * @tc.name: RSVsyncHasGpu2Slices
 * @tc.desc: RS's vsync event has gpu, two slice across
 * @tc.type: FUNC
 */
HWTEST_F(FrameFilterTest, SliceFromAppToRS, TestSize.Level1)
{
    TS_LOGI("test6-8");
    // ut8
    // slice from app to RS
    // app -----VSYNCStart------------------End---
    //     -----------------frameNum--------------
    // RS -------------------------VSYNCStart------------------End-----VSYNCStart------------------End-----------------
    // -----------------------------------gpuStart------------------------------gpuEnd---------gpuStart----gpuEnd------
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    const uint64_t ON_DO_COMPOSITION_TS = 2;
    const uint32_t FRAME_NUM = 1;
    EXPECT_TRUE(stream_.streamFilters_->frameFilter_->BeginRSTransactionData(itid, FRAME_NUM, itid));
    BytraceLine line2 = {RS_START_TS, RS_PID};
    line.tgid = RS_TID;
    auto itid2 = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(RS_TID, RS_PID);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line2, RS_EXPECTED_START, RS_EXPECTED_END, RS_VSYNC_ID,
                                                          RS_CALLSTACK_SLICE_ID);
    stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(RS_TID);
    const uint64_t GPU_START_TS2 = 7;
    stream_.streamFilters_->frameFilter_->StartFrameQueue(GPU_START_TS2, RS_TID);
    const uint64_t END_TS = 10;
    EXPECT_TRUE(stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid));

    const uint64_t RS_END_TS = 10;
    stream_.streamFilters_->frameFilter_->EndVsyncEvent(RS_END_TS, itid2);

    const uint64_t RS_START_TS2 = 11;
    const uint64_t RS_EXPECTED_START2 = 11;
    const uint64_t RS_EXPECTED_END2 = 25;
    const uint32_t RS_VSYNC_ID2 = 3;
    const uint32_t RS_CALLSTACK_SLICE_ID2 = 3;
    BytraceLine line3 = {RS_START_TS2, RS_PID, RS_TID};
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(line3, RS_EXPECTED_START2, RS_EXPECTED_END2, RS_VSYNC_ID2,
                                                          RS_CALLSTACK_SLICE_ID2);
    stream_.streamFilters_->frameFilter_->MarkRSOnDoCompositionEvent(RS_TID);

    const uint64_t GPU_END_TS = 15;
    stream_.streamFilters_->frameFilter_->EndFrameQueue(GPU_END_TS, RS_TID);

    const uint64_t GPU_START_TS3 = 16;
    stream_.streamFilters_->frameFilter_->StartFrameQueue(GPU_START_TS3, RS_TID);
    const uint64_t END_TS3 = 20;
    stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS3, RS_TID);

    const uint64_t GPU_END_TS3 = 25;
    stream_.streamFilters_->frameFilter_->EndFrameQueue(GPU_END_TS3, RS_TID);

    EXPECT_TRUE(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0] == END_TS - START_TS);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[2], GPU_END_TS3 - END_TS3);
    EXPECT_TRUE(atoi(stream_.traceDataCache_->GetFrameSliceData()->Srcs()[2].c_str()) ==
                stream_.traceDataCache_->GetFrameSliceData()->IdsData()[0]);
}

HWTEST_F(FrameFilterTest, AppParallelTraceNoVsyncIdAndFrameNum, TestSize.Level1)
{
    TS_LOGI("test6-9");
    // no vsyncId and frameNum
    // app ---------------H:ParallelTrace------------------End---uint64_t ts,
    BytraceLine line = {START_TS, TID1};
    line.tgid = PID1;
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    // BeginParallelTraceEvent 用于开始一个并发/并行的追踪事件
    // BeginUVTraceEvent 用于开始一个普通的追踪事件（函数没有）----
    stream_.streamFilters_->frameFilter_->BeginParallelTraceEvent(line, CALLSTACK_SLICE_ID);
    const uint64_t END_TS = 10;
    auto res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, itid);
    EXPECT_TRUE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[0], 0);                // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->TimeStampData()[0], START_TS); // actural frame
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[0], END_TS - START_TS); // actural frame
}

HWTEST_F(FrameFilterTest, AppParallelTraceNoFrameNum, TestSize.Level1)
{
    TS_LOGI("test6-10");
    // no frameNum
    // app ---------------H:ParallelTrace------------------End---uint64_t ts,
    BytraceLine mainThreadLine = {0, PID1};
    mainThreadLine.tgid = PID1;
    const uint64_t SON_START_TS = 6;
    BytraceLine line = {SON_START_TS, TID1};
    line.tgid = PID1;
    auto mainThreadId = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(PID1, PID1);
    auto itid = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(mainThreadLine, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    stream_.streamFilters_->frameFilter_->BeginParallelTraceEvent(line, CALLSTACK_SLICE_ID);
    uint64_t timeId = 0;
    stream_.streamFilters_->frameFilter_->UpdateVsyncId(line, VSYNC_ID, timeId);
    const uint64_t SON_END_TS = 9;
    auto res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(SON_END_TS, itid);
    EXPECT_TRUE(res);
    const uint64_t END_TS = 10;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, mainThreadId);
    EXPECT_TRUE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[SON_THREAD_DATA_INDEX],
              0); // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[SON_THREAD_DATA_INDEX],
              SON_END_TS - SON_START_TS); // actural frame
}

HWTEST_F(FrameFilterTest, AppParallelTraceNormal, TestSize.Level1)
{
    TS_LOGI("test6-11");
    // app ---------------H:ParallelTrace------------------End---uint64_t ts,
    const uint64_t SON_START_TS = 6;
    BytraceLine line = {SON_START_TS, TID1};
    line.tgid = PID1;
    auto sonThreadId = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    BytraceLine mainThreadLine = {0, PID1};
    mainThreadLine.tgid = PID1;
    auto mainThreadId = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(PID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(mainThreadLine, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID2);
    stream_.streamFilters_->frameFilter_->BeginParallelTraceEvent(line, CALLSTACK_SLICE_ID2);
    uint64_t timeId = 0;
    stream_.streamFilters_->frameFilter_->UpdateVsyncId(line, VSYNC_ID, timeId);
    const uint32_t FRAME_NUM = 1;
    stream_.streamFilters_->frameFilter_->BeginRSTransactionData(sonThreadId, FRAME_NUM, mainThreadId);
    const uint64_t SON_END_TS = 8;
    auto res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(SON_END_TS, sonThreadId);
    EXPECT_TRUE(res);
    const uint64_t END_TS = 9;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, mainThreadId);
    EXPECT_TRUE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[SON_THREAD_DATA_INDEX],
              0); // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[SON_THREAD_DATA_INDEX],
              SON_END_TS - SON_START_TS); // actural frame
}

HWTEST_F(FrameFilterTest, AppParallelTraceTimeout, TestSize.Level1)
{
    TS_LOGI("test6-12");
    // app subthread actual frame timeout
    const uint64_t SON_START_TS = 7;
    BytraceLine line = {SON_START_TS, TID1};
    line.tgid = PID1;
    const uint64_t START_TS = 6;
    BytraceLine mainThreadLine = {START_TS, PID1};
    mainThreadLine.tgid = PID1;
    auto sonThreadId = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(TID1, PID1);
    auto mainThreadId = stream_.streamFilters_->processFilter_->GetOrCreateThreadWithPid(PID1, PID1);
    stream_.streamFilters_->frameFilter_->BeginVsyncEvent(mainThreadLine, EXPECTED_START, EXPECTED_END, VSYNC_ID,
                                                          CALLSTACK_SLICE_ID);
    stream_.streamFilters_->frameFilter_->BeginParallelTraceEvent(line, CALLSTACK_SLICE_ID2);
    uint64_t timeId = 0;
    stream_.streamFilters_->frameFilter_->UpdateVsyncId(line, VSYNC_ID, timeId);
    const uint32_t FRAME_NUM = 2;
    stream_.streamFilters_->frameFilter_->BeginRSTransactionData(sonThreadId, FRAME_NUM, mainThreadId);
    const uint64_t SON_END_TS = 11;
    auto res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(SON_END_TS, sonThreadId);
    EXPECT_TRUE(res);
    const uint64_t END_TS = 9;
    res = stream_.streamFilters_->frameFilter_->EndVsyncEvent(END_TS, mainThreadId);
    EXPECT_TRUE(res);
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Flags()[SON_THREAD_DATA_INDEX],
              1); // actural frame, no frameNum
    EXPECT_EQ(stream_.traceDataCache_->GetFrameSliceData()->Durs()[SON_THREAD_DATA_INDEX],
              SON_END_TS - SON_START_TS); // actural frame
}
} // namespace TraceStreamer
} // namespace SysTuning
