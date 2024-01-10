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
#include "irq_filter.h"
#include "trace_plugin_result.pb.h"
#include "trace_plugin_result.pbreader.h"
#include "trace_streamer_selector.h"
#include "ts_common.h"
#include "trace_plugin_result.pb.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
class HtraceIrqEventTest : public ::testing::Test {
    const uint32_t RET = 1;
    const std::string APP_NAME = "app1";
    const uint32_t TID = 1;
    const int32_t IRQ = 12; // 1 for handled, else for unhandled
    const uint32_t VEC = 1;

public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    std::string SetIrqHandlerEntryFormat(int64_t ts, uint32_t cpu)
    {
        IrqHandlerEntryFormat* irqHandlerEvent = new IrqHandlerEntryFormat();
        irqHandlerEvent->set_irq(IRQ);
        irqHandlerEvent->set_name("user_irq");
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg* ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        ftraceCpuDetail->set_cpu(cpu);
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts);
        ftraceEvent->set_tgid(TID);
        ftraceEvent->set_comm(APP_NAME);
        ftraceEvent->set_allocated_irq_handler_entry_format(irqHandlerEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

    std::string SetIrqHandlerExitFormat(int64_t ts, uint32_t cpu)
    {
        IrqHandlerExitFormat* irqHandlerExitEvent = new IrqHandlerExitFormat();
        irqHandlerExitEvent->set_irq(IRQ);
        irqHandlerExitEvent->set_ret(RET);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg* ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        ftraceCpuDetail->set_cpu(cpu);
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts);
        ftraceEvent->set_tgid(TID);
        ftraceEvent->set_comm(APP_NAME);
        ftraceEvent->set_allocated_irq_handler_exit_format(irqHandlerExitEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

    std::string SetSoftIrqEntryFormat(int64_t ts, uint32_t cpu)
    {
        SoftirqEntryFormat* softirqEntryEvent = new SoftirqEntryFormat();
        softirqEntryEvent->set_vec(VEC);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg* ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        ftraceCpuDetail->set_cpu(cpu);
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts);
        ftraceEvent->set_tgid(TID);
        ftraceEvent->set_comm(APP_NAME);
        ftraceEvent->set_allocated_softirq_entry_format(softirqEntryEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

    std::string SetSoftIrqExitFormat(int64_t ts, uint32_t cpu)
    {
        SoftirqExitFormat* softirqExitEvent = new SoftirqExitFormat();
        softirqExitEvent->set_vec(VEC);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg* ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        ftraceCpuDetail->set_cpu(cpu);
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts);
        ftraceEvent->set_tgid(TID);
        ftraceEvent->set_comm(APP_NAME);
        ftraceEvent->set_allocated_softirq_exit_format(softirqExitEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: IrqHandlerEntryTest
 * @tc.desc: Binary formate IrqHandlerEntry Normal TEST
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, IrqHandlerEntryTest, TestSize.Level1)
{
    TS_LOGI("test15-1");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetIrqHandlerEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    eventParser.Clear();
}

/**
 * @tc.name: IrqHandlerEntryTestNotMatch
 * @tc.desc: Binary formate IrqHandlerEntry, only start, no end
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, IrqHandlerEntryTestNotMatch, TestSize.Level1)
{
    TS_LOGI("test15-2");

    const int64_t ts = 120;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetIrqHandlerEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);

    const int64_t ts2 = 110;
    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetIrqHandlerEntryFormat(ts2, cpu);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 2);

    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_IRQ_HANDLER_ENTRY, STAT_EVENT_DATA_LOST);
    EXPECT_TRUE(1 == eventCount);
    eventParser.Clear();
}

/**
 * @tc.name: IrqHandlerExitTestEmpty
 * @tc.desc: Binary formate IrqHandlerExit, Interrupt only ends, not starts
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, IrqHandlerExitTestEmpty, TestSize.Level1)
{
    TS_LOGI("test15-3");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetIrqHandlerExitFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 0);
    auto eventCount =
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_IRQ_HANDLER_EXIT, STAT_EVENT_NOTMATCH);
    EXPECT_TRUE(1 == eventCount);
    eventParser.Clear();
}

/**
 * @tc.name: IrqHandlerEnterAndExitTest
 * @tc.desc: Binary formate IrqHandlerEnter, Interrupt normal start and end
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, IrqHandlerEnterAndExitTest, TestSize.Level1)
{
    TS_LOGI("test15-4");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetIrqHandlerEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);

    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetIrqHandlerExitFormat(ts, cpu);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();

    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().ArgSetIdsData()[0] == 0);
    eventParser.Clear();
}

/**
 * @tc.name: IrqHandlerEnterAndExitTestTwice
 * @tc.desc: Binary formate IrqHandlerEnter and Exit, Interrupt normal start and end Twice
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, IrqHandlerEnterAndExitTestTwice, TestSize.Level1)
{
    TS_LOGI("test15-5");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetIrqHandlerEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);

    const int64_t ts2 = 150;
    const uint32_t cpu2 = 2;
    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetIrqHandlerExitFormat(ts2, cpu2);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_IRQ_HANDLER_EXIT,
                                                                        STAT_EVENT_NOTMATCH) == 1);

    const int64_t ts3 = 200;
    HtraceDataSegment dataSeg3;
    dataSeg3.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetIrqHandlerExitFormat(ts3, cpu);
    dataSeg3.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView3(reinterpret_cast<const uint8_t*>(dataSeg3.seg->data()),
                                               dataSeg3.seg->size());
    dataSeg3.protoData = cpuDetailBytesView3;
    ProtoReader::TracePluginResult_Reader tracePluginResult3(dataSeg3.protoData);
    eventParser.ParseDataItem(dataSeg3, tracePluginResult3, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().ArgSetIdsData()[0] == 0);
    eventParser.Clear();
}

/**
 * @tc.name: SoftIrqEntryTest
 * @tc.desc: Binary format Soft interrupt normal test
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, SoftIrqEntryTest, TestSize.Level1)
{
    TS_LOGI("test15-6");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetSoftIrqEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    eventParser.Clear();
}

/**
 * @tc.name: SoftIrqEntryNotMatch
 * @tc.desc: The binary format soft interrupts do not match. The two interrupts have only the beginning and no end
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, SoftIrqEntryNotMatch, TestSize.Level1)
{
    TS_LOGI("test15-7");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetSoftIrqEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);

    const int64_t ts2 = 150;
    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetSoftIrqEntryFormat(ts2, cpu);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 2);
    EXPECT_TRUE(
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_SOFTIRQ_ENTRY, STAT_EVENT_DATA_LOST) == 1);
    eventParser.Clear();
}

/**
 * @tc.name: SoftIrqExitEmptyTest
 * @tc.desc: The binary format soft interrupt only ends without starting
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, SoftIrqExitEmptyTest, TestSize.Level1)
{
    TS_LOGI("test15-8");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetSoftIrqExitFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 0);
    EXPECT_TRUE(
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_SOFTIRQ_EXIT, STAT_EVENT_DATA_LOST) == 1);
    eventParser.Clear();
}

/**
 * @tc.name: SoftIrqTest
 * @tc.desc: The binary format soft interrupt normal test
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, SoftIrqTest, TestSize.Level1)
{
    TS_LOGI("test15-9");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetSoftIrqEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();

    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    eventParser.Clear();

    const int64_t ts1 = 150;
    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetSoftIrqExitFormat(ts1, cpu);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    eventParser.Clear();
}

/**
 * @tc.name: SoftIrqTestNotMatch
 * @tc.desc: The binary soft interrupt test not match
 * @tc.type: FUNC
 */
HWTEST_F(HtraceIrqEventTest, SoftIrqTestNotMatch, TestSize.Level1)
{
    TS_LOGI("test15-10");

    const int64_t ts = 100;
    const uint32_t cpu = 1;
    HtraceDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetSoftIrqEntryFormat(ts, cpu);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t*>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    eventParser.Clear();

    const int64_t ts2 = 150;
    const uint32_t cpu2 = 2;
    HtraceDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetSoftIrqExitFormat(ts2, cpu2);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t*>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstIrqData().Size() == 1);
    EXPECT_TRUE(
        stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_EVENT_SOFTIRQ_EXIT, STAT_EVENT_DATA_LOST) == 1);
    eventParser.Clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
