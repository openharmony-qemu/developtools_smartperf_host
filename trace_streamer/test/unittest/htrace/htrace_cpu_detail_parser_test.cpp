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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#include "htrace_cpu_detail_parser.h"
#include "htrace_event_parser.h"
#include "power.pb.h"
#include "stat_filter.h"
#include "trace_streamer_selector.h"
#include "trace_plugin_result.pb.h"
#include "trace_plugin_result.pbreader.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
class HtraceCpuDetailParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() const {}

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseCpudetaulNoEvents
 * @tc.desc: Parse a cpudetaul with no events
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDetailParserTest, ParseCpudetaulNoEvents, TestSize.Level1)
{
    TS_LOGI("test12-1");
    TracePluginResult tracePacket;
    FtraceCpuDetailMsg* cpuDetail = tracePacket.add_ftrace_cpu_detail();

    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_REALTIME;
    std::string cpuDetailStrMsg = "";
    tracePacket.SerializeToString(&cpuDetailStrMsg);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceCpuDetailParser htraceCpuDetailParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    htraceCpuDetailParser.Parse(dataSeg, tracePluginResult, haveSplit);
    htraceCpuDetailParser.FilterAllEvents();
    EXPECT_EQ(tracePacket.ftrace_cpu_detail_size(), 1);
    EXPECT_EQ(cpuDetail->event_size(), 0);
}
/**
 * @tc.name: ParseHtraceWithoutCpuDetailData
 * @tc.desc: Parse a cpu that does not contain any cpudetail
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDetailParserTest, ParseHtraceWithoutCpuDetailData, TestSize.Level1)
{
    TS_LOGI("test12-2");
    TracePluginResult tracePacket;
    FtraceCpuDetailMsg* cpuDetail = tracePacket.add_ftrace_cpu_detail();
    auto event = cpuDetail->add_event();

    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_REALTIME;

    std::string cpuDetailStrMsg = "";
    tracePacket.SerializeToString(&cpuDetailStrMsg);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;
    HtraceCpuDetailParser htraceCpuDetailParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    htraceCpuDetailParser.Parse(dataSeg, tracePluginResult, haveSplit);
    htraceCpuDetailParser.FilterAllEvents();
    EXPECT_EQ(tracePacket.ftrace_cpu_detail_size(), 1);
    EXPECT_EQ(cpuDetail->event_size(), 1);
}
/**
 * @tc.name: ParseHtraceCpuDetailData
 * @tc.desc: Parse a cpudetail data
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDetailParserTest, ParseHtraceCpuDetailData, TestSize.Level1)
{
    TS_LOGI("test12-3");
    TracePluginResult tracePacket;
    FtraceCpuDetailMsg* cpuDetail = tracePacket.add_ftrace_cpu_detail();
    auto event = cpuDetail->add_event();
    cpuDetail->set_cpu(1);
    event->set_timestamp(1501983446213000000);
    event->set_tgid(1);
    CpuFrequencyFormat* freq = new CpuFrequencyFormat();
    freq->set_cpu_id(1);
    freq->set_state(1500);
    event->set_allocated_cpu_frequency_format(freq);

    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_REALTIME;

    std::string cpuDetailStrMsg = "";
    tracePacket.SerializeToString(&cpuDetailStrMsg);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceCpuDetailParser htraceCpuDetailParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    htraceCpuDetailParser.Parse(dataSeg, tracePluginResult, haveSplit);
    htraceCpuDetailParser.FilterAllEvents();
    EXPECT_EQ(tracePacket.ftrace_cpu_detail_size(), 1);
    EXPECT_EQ(cpuDetail->event_size(), 1);
    EXPECT_EQ(stream_.traceDataCache_->GetConstMeasureData().ValuesData()[0], 1500);
}
/**
 * @tc.name: ParseMultipleCpuDetailData
 * @tc.desc: Parse multiple cpudetail data
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDetailParserTest, ParseMultipleCpuDetailData, TestSize.Level1)
{
    TS_LOGI("test12-4");
    TracePluginResult tracePacket;
    FtraceCpuDetailMsg* cpuDetail = tracePacket.add_ftrace_cpu_detail();
    auto event = cpuDetail->add_event();
    cpuDetail->set_cpu(1);
    event->set_timestamp(1501983446213000000);
    event->set_tgid(1);
    CpuFrequencyFormat* freq0 = new CpuFrequencyFormat();
    freq0->set_cpu_id(1);
    freq0->set_state(1500);
    event->set_allocated_cpu_frequency_format(freq0);

    cpuDetail = tracePacket.add_ftrace_cpu_detail();
    event = cpuDetail->add_event();
    cpuDetail->set_cpu(1);
    event->set_timestamp(1501983446213000000);
    event->set_tgid(1);
    CpuFrequencyFormat* freq1 = new CpuFrequencyFormat();
    freq1->set_cpu_id(2);
    freq1->set_state(3000);
    event->set_allocated_cpu_frequency_format(freq1);

    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_REALTIME;

    std::string cpuDetailStrMsg = "";
    tracePacket.SerializeToString(&cpuDetailStrMsg);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceCpuDetailParser htraceCpuDetailParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    htraceCpuDetailParser.Parse(dataSeg, tracePluginResult, haveSplit);
    htraceCpuDetailParser.FilterAllEvents();
    EXPECT_EQ(tracePacket.ftrace_cpu_detail_size(), 2);
    EXPECT_EQ(cpuDetail->event_size(), 1);
    auto measureData = stream_.traceDataCache_->GetConstMeasureData();
    EXPECT_EQ(measureData.ValuesData()[0], 1500);
    EXPECT_EQ(measureData.ValuesData()[1], 3000);
}
} // namespace TraceStreamer
} // namespace SysTuning
