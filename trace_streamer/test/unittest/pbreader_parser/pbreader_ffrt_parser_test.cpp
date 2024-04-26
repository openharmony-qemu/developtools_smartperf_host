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
#include "export_test.h"
#include "ffrt_profiler_config.pb.h"
#include "ffrt_profiler_result.pb.h"
#include "pbreader_parser.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
class PbreaderFfrtParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        selector_.InitFilter();
        selector_.pbreaderParser_ =
            std::make_unique<PbreaderParser>(selector_.GetTraceDataCache(), selector_.GetStreamFilter());
        ffrtDetailParser_ = std::make_unique<PbreaderFfrtDetailParser>(
            selector_.GetTraceDataCache(), selector_.GetStreamFilter(),
            selector_.GetPbreaderParser()->htraceCpuDetailParser_->eventParser_.get());
    }

    void TearDown() {}

private:
    void SetFfrtSrcClockid(FfrtProfilerConfig::ClockId destClockId)
    {
        PbreaderDataSegment dataSeg;
        FfrtProfilerConfig ffrtCfg;
        ffrtCfg.set_clock_id(destClockId);
        dataSeg.seg = std::make_shared<std::string>();
        ffrtCfg.SerializeToString(dataSeg.seg.get());
        dataSeg.protoData.data_ = reinterpret_cast<const uint8_t *>(dataSeg.seg->data());
        dataSeg.protoData.size_ = dataSeg.seg->size();
        ffrtDetailParser_->SetFfrtSrcClockid(dataSeg);
        EXPECT_EQ(ffrtDetailParser_->ffrtClockid_, destClockId);
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector selector_ = {};
    std::unique_ptr<PbreaderFfrtDetailParser> ffrtDetailParser_;
};
/**
 * @tc.name: SetFfrtSrcClockid
 * @tc.desc: Set ffrt src clockid
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderFfrtParserTest, SetFfrtSrcClockid, TestSize.Level1)
{
    TS_LOGI("test45-1");
    SetFfrtSrcClockid(FfrtProfilerConfig::BOOTTIME);
    SetFfrtSrcClockid(FfrtProfilerConfig::REALTIME);
    SetFfrtSrcClockid(FfrtProfilerConfig::REALTIME_COARSE);
    SetFfrtSrcClockid(FfrtProfilerConfig::MONOTONIC);
    SetFfrtSrcClockid(FfrtProfilerConfig::MONOTONIC_COARSE);
    SetFfrtSrcClockid(FfrtProfilerConfig::MONOTONIC_RAW);
}
/**
 * @tc.name: ParserAll
 * @tc.desc: Parser ffrt all data
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderFfrtParserTest, ParserAll, TestSize.Level1)
{
    TS_LOGI("test45-2");
    const std::string ffrtBinPath = "../../test/resource/pbreader_ffrt.htrace";
    EXPECT_TRUE(ParseTraceFile(selector_, ffrtBinPath));
}
/**
 * @tc.name: Parser
 * @tc.desc: Parser ffrt comm and trace data
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderFfrtParserTest, Parser, TestSize.Level1)
{
    TS_LOGI("test45-3");
    std::string buf;
    bool haveSplitSeg = false;
    PbreaderDataSegment dataSeg;
    auto tid = gettid();
    auto pid = getpid();
    // case 1: for ffrt comm result
    FfrtProfilerResult ffrtCommResult;
    auto commResultEvent = ffrtCommResult.add_ffrt_event();
    commResultEvent->set_pid(pid);
    commResultEvent->set_tid(tid);
    commResultEvent->set_process_name("PbreaderFfrtParserTest");
    commResultEvent->set_thread_name("PbreaderFfrtParserTest");
    ffrtCommResult.SerializeToString(&buf);
    dataSeg.seg = std::make_shared<std::string>(buf);
    dataSeg.protoData =
        ProtoReader::BytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()), dataSeg.seg->size());
    EXPECT_TRUE(ffrtDetailParser_->taskNameIndexMap_.Empty());
    ffrtDetailParser_->Parser(dataSeg, haveSplitSeg);
    EXPECT_TRUE(!ffrtDetailParser_->taskNameIndexMap_.Empty());
    // case 2: for ffrt trace result
    struct timespec currentTime;
    clock_gettime(CLOCK_BOOTTIME, &currentTime);
    auto cpu = 0;
    FfrtProfilerResult ffrtTraceResult;
    auto ffrtTraceEvent = ffrtTraceResult.add_ffrt_event();
    ffrtTraceEvent->set_pid(pid);
    ffrtTraceEvent->set_tid(tid);
    ffrtTraceEvent->set_tv_sec(currentTime.tv_sec);
    ffrtTraceEvent->set_tv_nsec(currentTime.tv_nsec);
    ffrtTraceEvent->mutable_trace()->set_cpu(cpu);
    ffrtTraceEvent->mutable_trace()->set_trace_type("B");
    ffrtTraceEvent->mutable_trace()->set_label("onSubmit");
    ffrtTraceResult.SerializeToString(&buf);
    dataSeg.seg = std::make_shared<std::string>(buf);
    dataSeg.protoData =
        ProtoReader::BytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()), dataSeg.seg->size());
    EXPECT_TRUE(ffrtDetailParser_->eventParser_->htraceEventList_.empty());
    ffrtDetailParser_->Parser(dataSeg, haveSplitSeg);
    EXPECT_TRUE(!ffrtDetailParser_->eventParser_->htraceEventList_.empty());
}

} // namespace TraceStreamer
} // namespace SysTuning
