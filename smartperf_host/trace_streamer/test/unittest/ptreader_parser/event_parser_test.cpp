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

#include <fcntl.h>
#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <string>
#include <unordered_map>

#define private public
#include "cpu_filter.h"
#include "parser/ptreader_parser/bytrace_parser/bytrace_event_parser.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "string_help.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
using namespace SysTuning::base;

namespace SysTuning {
namespace TraceStreamer {
const uint32_t G_BUF_SIZE = 1024;
// TestSuite:
class EventParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
        stream_.streamFilters_->configFilter_->switchConfig_.UpdateSyscallsTsSet("145;146;147");
    }

    void TearDown()
    {
        if (access(dbPath_.c_str(), F_OK) == 0) {
            remove(dbPath_.c_str());
        }
    }

public:
    TraceStreamerSelector stream_ = {};
    const std::string dbPath_ = "../../../data/resource/out.db";
};

/**
 * @tc.name: ParseLine
 * @tc.desc: Parse a complete sched_switch event in bytrace format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseLine, TestSize.Level1)
{
    TS_LOGI("test5-1");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    eventParser.ParseDataItem(bytraceLine);
    eventParser.FilterAllEvents();
    EXPECT_EQ(0,
              stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_SCHED_SWITCH, STAT_EVENT_DATA_INVALID));
    auto readStatIndex = stream_.traceDataCache_->GetConstSchedSliceData().EndStatesData()[0];
    EXPECT_EQ(TASK_RUNNABLE, readStatIndex);
    auto realTimeStamp = stream_.traceDataCache_->GetConstSchedSliceData().TimeStampData()[0];
    EXPECT_TRUE(bytraceLine.ts == realTimeStamp);
    auto realCpu = stream_.traceDataCache_->GetConstSchedSliceData().CpusData()[0];
    EXPECT_TRUE(bytraceLine.cpu == realCpu);
}

/**
 * @tc.name: ParseLineNotEnoughArgs
 * @tc.desc: Parse a sched_switch event which has not enough args in bytrace format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseLineNotEnoughArgs, TestSize.Level1)
{
    TS_LOGI("test5-2");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr = "prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    eventParser.ParseDataItem(bytraceLine);
    eventParser.FilterAllEvents();
    EXPECT_EQ(1,
              stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_SCHED_SWITCH, STAT_EVENT_DATA_INVALID));
    TS_LOGI("test5-2 Finished.");
}
/**
 * @tc.name: ParseLineUnCognizableEventname
 * @tc.desc: Parse a UnCognizable Eventname event in bytrace format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseLineUnCognizableEventname, TestSize.Level1)
{
    TS_LOGI("test5-3");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "ThisEventNameDoNotExist"; // UnRecognizable event name
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    eventParser.ParseDataItem(bytraceLine);
    eventParser.FilterAllEvents();
    EXPECT_EQ(1, stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_OTHER, STAT_EVENT_NOTSUPPORTED));
}

/**
 * @tc.name: ParseSchedSwitchNoArgs
 * @tc.desc: Parse a SchedSwitch event which has no args in bytrace format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedSwitchNoArgs, TestSize.Level1)
{
    TS_LOGI("test5-4");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    eventParser.ParseDataItem(bytraceLine);
    eventParser.FilterAllEvents();
    EXPECT_EQ(1, stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_SCHED_SWITCH, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseSchedWakeupNoArgs
 * @tc.desc: Parse a SchedWakeup event which has no args in bytrace format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakeupNoArgs, TestSize.Level1)
{
    TS_LOGI("test5-5");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_wakeup";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    eventParser.ParseDataItem(bytraceLine);
    eventParser.FilterAllEvents();
    EXPECT_EQ(1,
              stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_SCHED_WAKEUP, STAT_EVENT_DATA_INVALID));
}

/**
 * @tc.name: ParseTracingMarkWriteC
 * @tc.desc: Parse a TracingMarkWrite C event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTracingMarkWriteC, TestSize.Level1)
{
    TS_LOGI("test5-6");

    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] ...1 174330.284808: tracing_mark_write: C|2519|Heap size (KB)|2906\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(2906, stream_.traceDataCache_->GetProcessMeasureData()->ValuesData()[0]);
}

/**
 * @tc.name: ParseTracingMarkWriteBE
 * @tc.desc: Parse a TracingMarkWrite BE event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTracingMarkWriteBE, TestSize.Level1)
{
    TS_LOGI("test5-7");
    const uint8_t str[] =
        "system-1298 ( 1298) [001] ...1 174330.287420: tracing_mark_write: B|1298|Choreographer#doFrame\n"
        "system-1298 ( 1298) [001] ...1 174330.287622: tracing_mark_write: E|1298\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(2));
    EXPECT_EQ(174330287420000, stream_.traceDataCache_->GetInternalSlicesData()->TimeStampData()[0]);
    EXPECT_EQ(202000, stream_.traceDataCache_->GetInternalSlicesData()->DursData()[0]);
}

/**
 * @tc.name: ParseTracingMarkWriteSF
 * @tc.desc: Parse a TracingMarkWrite SF event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTracingMarkWriteSF, TestSize.Level1)
{
    TS_LOGI("test5-8");

    const uint8_t str[] =
        "system-1298 ( 1298) [001] ...1 174330.287478: tracing_mark_write: S|1298|animator:translateX|18888109\n"
        "system-1298 ( 1298) [001] ...1 174330.287514: tracing_mark_write: F|1298|animator:translateX|18888109\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(2));
    EXPECT_EQ(174330287478000, stream_.traceDataCache_->GetInternalSlicesData()->TimeStampData()[0]);
    EXPECT_EQ(36000, stream_.traceDataCache_->GetInternalSlicesData()->DursData()[0]);
    EXPECT_EQ(18888109, stream_.traceDataCache_->GetInternalSlicesData()->Cookies()[0]);
}

/**
 * @tc.name: ParseTracingMarkWriteErrorPoint
 * @tc.desc: Parse a TracingMarkWrite event with error point info
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTracingMarkWriteErrorPoint, TestSize.Level1)
{
    TS_LOGI("test5-9");
    const uint8_t str[] =
        "system-1298  ( 1298) [001] ...1 174330.287478: tracing_mark_write: G|1298|animator:translateX|18888109\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();
    EXPECT_EQ(0, stream_.traceDataCache_->GetInternalSlicesData()->TimeStampData().size());
}

/**
 * @tc.name: ParseCpuIdle
 * @tc.desc: Parse a CpuIdle event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuIdle, TestSize.Level1)
{
    TS_LOGI("test5-10");
    const uint8_t str[] = "<idle>-0     (-----) [003] d..2 174330.280761: cpu_idle: state=2 cpu_id=3\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(174330280761000, stream_.traceDataCache_->GetMeasureData()->TimeStampData()[0]);
    EXPECT_EQ(3, stream_.traceDataCache_->GetMeasureData()->ValuesData()[0]);
}

/**
 * @tc.name: ParseIrqHandlerEntry
 * @tc.desc: Parse a IrqHandlerEntry event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseIrqHandlerEntry, TestSize.Level1)
{
    TS_LOGI("test5-11");
    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] d.h1 174330.280362: irq_handler_entry: irq=19 name=408000.qcom,cpu-bwmon\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(174330280362000, stream_.traceDataCache_->GetIrqData()->TimeStampData()[0]);
}

/**
 * @tc.name: ParseIrqHandlerExit
 * @tc.desc: Parse a IrqHandlerExit event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseIrqHandlerExit, TestSize.Level1)
{
    TS_LOGI("test5-12");
    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] d.h1 174330.280362: irq_handler_entry: irq=19 name=408000.qcom,cpu-bwmon\n"
        "ACCS0-2716  ( 2519) [000] d.h1 174330.280382: irq_handler_exit: irq=19 ret=handled\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(2));
    EXPECT_EQ(1,
              stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_IRQ_HANDLER_EXIT, STAT_EVENT_RECEIVED));
}

/**
 * @tc.name: ParseSchedWaking
 * @tc.desc: Parse a SchedWaking event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWaking, TestSize.Level1)
{
    TS_LOGI("test5-13");
    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] d..5 174330.280567: sched_waking: \
            comm=Binder:924_6 pid=1332 prio=120 target_cpu=000\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();
    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(0, stream_.traceDataCache_->GetSchedSliceData()->TimeStampData().size());
}

/**
 * @tc.name: ParseSchedWakeup
 * @tc.desc: Parse a SchedWakeup event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakeup, TestSize.Level1)
{
    TS_LOGI("test5-14");
    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] d..6 174330.280575: sched_wakeup: \
            comm=Binder:924_6 pid=1332 prio=120 target_cpu=000\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(174330280575000, stream_.traceDataCache_->GetRawData()->TimeStampData()[0]);
    EXPECT_EQ(0, stream_.traceDataCache_->GetRawData()->CpuData()[0]);
}

/**
 * @tc.name: ParseTraceEventClockSync
 * @tc.desc: Parse a TraceEventClockSync event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTraceEventClockSync, TestSize.Level1)
{
    TS_LOGI("test5-15");
    const uint8_t str[] =
        "sampletrace-12728 (12728) [003] ...1 174330.280300: tracing_mark_write: \
            trace_event_clock_sync:parent_ts=23139.998047\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(1,
              stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_TRACING_MARK_WRITE, STAT_EVENT_RECEIVED));
    EXPECT_EQ(1, stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_TRACING_MARK_WRITE,
                                                                     STAT_EVENT_DATA_INVALID));
}

/**
 * @tc.name: ParseSchedSwitch
 * @tc.desc: Parse a SchedSwitch event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedSwitch, TestSize.Level1)
{
    TS_LOGI("test5-16");
    const uint8_t str[] =
        "ACCS0-2716  ( 2519) [000] d..3 174330.289220: sched_switch: prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
            prev_state=R+ ==> next_comm=Binder:924_6 next_pid=1332 next_prio=120\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(174330289220000, stream_.traceDataCache_->GetSchedSliceData()->TimeStampData()[0]);
}

/**
 * @tc.name: ParseTaskRename
 * @tc.desc: Parse a TaskRename event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTaskRename, TestSize.Level1)
{
    TS_LOGI("test5-17");
    const uint8_t str[] =
        "ACCS0-12729  ( 2519) [000] d..3 174330.289220: sched_switch: prev_comm=ACCS0\
        prev_pid=2716 prev_prio=120 prev_state=R+ ==> next_comm=Binder:924_6 next_pid=1332 next_prio=120\n\
        <...>-2093  (-----) [001] ...2 174332.792290: task_rename: pid=12729 oldcomm=perfd \
            newcomm=POSIX timer 249 oom_score_adj=-1000\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    auto itid = stream_.streamFilters_->processFilter_->GetInternalTid(12729);
    auto threadNameIndex = stream_.traceDataCache_->GetThreadData(itid)->nameIndex_;
    auto expectThreadNameIndex = stream_.traceDataCache_->GetDataIndex("POSIX");
    EXPECT_EQ(expectThreadNameIndex, threadNameIndex);
}

/**
 * @tc.name: ParseTaskNewtask
 * @tc.desc: Parse a TaskNewtask event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTaskNewtask, TestSize.Level1)
{
    TS_LOGI("test5-18");
    const uint8_t str[] =
        "<...>-2     (-----) [003] ...1 174332.825588: task_newtask: pid=12730 \
            comm=kthreadd clone_flags=800711 oom_score_adj=0\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    auto itid = stream_.streamFilters_->processFilter_->GetInternalTid(12730);
    EXPECT_EQ(INVALID_ID, itid);
}

/**
 * @tc.name: ParseWorkqueueExecuteStart
 * @tc.desc: Parse a WorkqueueExecuteStart event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseWorkqueueExecuteStart, TestSize.Level1)
{
    TS_LOGI("test5-19");
    const uint8_t str[] =
        "<...>-12180 (-----) [001] ...1 174332.827595: workqueue_execute_start: \
            work struct 0000000000000000: function pm_runtime_work\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_EQ(174332827595000, stream_.traceDataCache_->GetInternalSlicesData()->TimeStampData()[0]);
}

/**
 * @tc.name: ParseWorkqueueExecuteEnd
 * @tc.desc: Parse a WorkqueueExecuteEnd event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseWorkqueueExecuteEnd, TestSize.Level1)
{
    TS_LOGI("test5-20");
    const uint8_t str[] =
        "<...>-12180 (-----) [001] ...1 174332.827595: workqueue_execute_start: \
    work struct 0000000000000000: function pm_runtime_work\n\
    <...>-12180 (-----) [001] ...1 174332.828056: workqueue_execute_end: work struct 0000000000000000\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(174332827595000, stream_.traceDataCache_->GetInternalSlicesData()->TimeStampData()[0]);
    EXPECT_EQ(461000, stream_.traceDataCache_->GetInternalSlicesData()->DursData()[0]);
}

/**
 * @tc.name: ParsDistribute
 * @tc.desc: Parse a Distribute event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParsDistribute, TestSize.Level1)
{
    TS_LOGI("test5-21");
    const uint8_t str[] =
        "system-1298 ( 1298) [001] ...1 174330.287420: tracing_mark_write: B|1298|H:[8b00e96b2,2,1]#C##decodeFrame\n"
        "system - 1298(1298)[001]... 1 174330.287622 : tracing_mark_write : E | 1298 \n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ChainIds()[0] == "8b00e96b2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().SpanIds()[0] == "2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ParentSpanIds()[0] == "1");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Flags()[0] == "C");
}

/**
 * @tc.name: ParsPairsOfDistributeEvent
 * @tc.desc: Parse a pair of Distribute event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParsPairsOfDistributeEvent, TestSize.Level1)
{
    TS_LOGI("test5-22");
    const uint8_t str[] =
        "system-1298 ( 1298) [001] ...1 174330.287420: tracing_mark_write: B|1298|H:[8b00e96b2,2,1]#C##decodeFrame\n"
        "startVC-7601 ( 7601) [002] ...1 174330.387420: tracing_mark_write: B|7601|H:[8b00e96b2,2,1]#S##startVCFrame\n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(2));
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 2);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ChainIds()[0] == "8b00e96b2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().SpanIds()[0] == "2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ParentSpanIds()[0] == "1");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Flags()[0] == "C");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ChainIds()[1] == "8b00e96b2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().SpanIds()[1] == "2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ParentSpanIds()[1] == "1");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Flags()[1] == "S");
}

/**
 * @tc.name: ParsDistributeWithNoFlag
 * @tc.desc: Parse a Distribute event with no flag
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParsDistributeWithNoFlag, TestSize.Level1)
{
    TS_LOGI("test5-23");
    const uint8_t str[] =
        "system-1298 ( 1298) [001] ...1 174330.287420: tracing_mark_write: B|1298|H:[8b00e96b2,2,1]###decodeFrame\n"
        "system - 1298(1298)[001]... 1 174330.287622 : tracing_mark_write : E | 1298 \n";
    auto buf = std::make_unique<uint8_t[]>(G_BUF_SIZE);
    if (memcpy_s(buf.get(), G_BUF_SIZE, str, sizeof(str))) {
        EXPECT_TRUE(false);
        return;
    }
    PtreaderParser ptreaderParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ptreaderParser.ParseTraceDataSegment(std::move(buf), G_BUF_SIZE);
    ptreaderParser.WaitForParserEnd();

    EXPECT_EQ(ptreaderParser.ParsedTraceValidLines(), static_cast<const uint32_t>(1));
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ChainIds()[0] == "8b00e96b2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().SpanIds()[0] == "2");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ParentSpanIds()[0] == "1");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Flags()[0] == "");
}

/**
 * @tc.name: ParseSchedSwitchByInitParam
 * @tc.desc: Parse a SchedSwitch event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedSwitchByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-24");
    BytraceLine bytraceLine;
    static std::unordered_map<std::string, std::string> args{{"prev_comm", "ACCS0"}, {"next_comm", "HeapTaskDaemon"},
                                                             {"prev_prio", "120"},   {"next_prio", "124"},
                                                             {"prev_pid", "2716"},   {"next_pid", "2532"},
                                                             {"prev_state", "S"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedSwitchEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseSchedSwitchByAbnormalInitParam
 * @tc.desc: Parse a SchedSwitch event with some Null parameter
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedSwitchByAbnormalInitParam, TestSize.Level1)
{
    TS_LOGI("test5-25");
    BytraceLine bytraceLine;
    static std::unordered_map<std::string, std::string> args{{"prev_comm", "ACCS0"}, {"next_comm", "HeapTaskDaemon"},
                                                             {"prev_prio", ""},      {"next_prio", ""},
                                                             {"prev_pid", ""},       {"next_pid", ""},
                                                             {"prev_state", "S"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedSwitchEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseTaskRenameEventByInitParam
 * @tc.desc: Parse a TaskRename event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTaskRenameEventByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-26");
    BytraceLine bytraceLine;
    static std::unordered_map<std::string, std::string> args{{"newcomm", "POSIX"}, {"pid", "8542"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.TaskRenameEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseTaskNewtaskByInitParam
 * @tc.desc: Parse a TaskNew event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTaskNewtaskByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-27");
    BytraceLine bytraceLine;
    static std::unordered_map<std::string, std::string> args{{"comm", "POSIX"}, {"pid", "8542"}, {"clone_flags", "1"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.TaskNewtaskEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseTracingMarkWriteByInitParam
 * @tc.desc: Parse a TracingMarkWriteEvent event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTracingMarkWriteByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-28");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.argsStr = "B|924|FullSuspendCheck";
    static std::unordered_map<std::string, std::string> args{};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.TracingMarkWriteOrPrintEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseSchedWakeupByInitParam
 * @tc.desc: Parse a SchedWakeup event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakeupByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-29");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    static std::unordered_map<std::string, std::string> args{{"pid", "1200"}, {"target_cpu", "1"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedWakeupEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseSchedWakeupByAbromalInitParam
 * @tc.desc: Parse a SchedWakeup event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakeupByAbromalInitParam, TestSize.Level1)
{
    TS_LOGI("test5-30");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    static std::unordered_map<std::string, std::string> args{{"pid", ""}, {"target_cpu", "1"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedWakeupEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseSchedWakingByInitParam
 * @tc.desc: Parse a SchedWaking event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakingByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-31");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    static std::unordered_map<std::string, std::string> args{
        {"prio", "120"}, {"comm", "thread1"}, {"pid", "1200"}, {"target_cpu", "1"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedWakingEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseSchedWakingByAbnormalInitParam
 * @tc.desc: Parse a SchedWaking event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakingByAbnormalInitParam, TestSize.Level1)
{
    TS_LOGI("test5-32");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    static std::unordered_map<std::string, std::string> args{
        {"prio", "120"}, {"comm", "thread1"}, {"pid", ""}, {"target_cpu", "1"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SchedWakingEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseCpuIdleByInitParam
 * @tc.desc: Parse a CpuIdle event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuIdleByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-33");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    static std::unordered_map<std::string, std::string> args{{"cpu_id", "3"}, {"state", "4294967295"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.CpuIdleEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseCpuIdleByAbnormalInitParam
 * @tc.desc: Parse a CpuIdle event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuIdleByAbnormalInitParam, TestSize.Level1)
{
    TS_LOGI("test5-34");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    static std::unordered_map<std::string, std::string> args{{"cpu_id", ""}, {"state", "4294967295"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.CpuIdleEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseCpuFrequencyNormal
 * @tc.desc: Parse a CpuFrequency event normally
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuFrequencyNormal, TestSize.Level1)
{
    TS_LOGI("test5-35");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    static std::unordered_map<std::string, std::string> args{{"cpu_id", "3"}, {"state", "4294967295"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.CpuFrequencyEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseCpuFrequencyByAbnormalInitEmptyCpuId
 * @tc.desc: Parse a CpuFrequency event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuFrequencyByAbnormalInitEmptyCpuId, TestSize.Level1)
{
    TS_LOGI("test5-36");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    static std::unordered_map<std::string, std::string> args{{"cpu_id", ""}, {"state", "4294967295"}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.CpuFrequencyEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseCpuFrequencyByAbnormalInitEmptyStateValue
 * @tc.desc: Parse a CpuFrequency event, empty state value
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuFrequencyByAbnormalInitEmptyStateValue, TestSize.Level1)
{
    TS_LOGI("test5-37");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    static std::unordered_map<std::string, std::string> args{{"cpu_id", "3"}, {"state", ""}};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.CpuFrequencyEvent(args, bytraceLine);

    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseWorkqueueExecuteStartByInitParam
 * @tc.desc: Parse a WorkqueueExecuteStart event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseWorkqueueExecuteStartByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-38");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1355;
    bytraceLine.argsStr = "vec=9 [action=RCU]";
    static std::unordered_map<std::string, std::string> args{};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.WorkqueueExecuteStartEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseWorkqueueExecuteEndByInitParam
 * @tc.desc: Parse a WorkqueueExecuteEnd event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseWorkqueueExecuteEndByInitParam, TestSize.Level1)
{
    TS_LOGI("test5-39");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1355;
    static std::unordered_map<std::string, std::string> args{};
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.WorkqueueExecuteEndEvent(args, bytraceLine);

    EXPECT_EQ(result, true);
}

/**
 * @tc.name: CheckTracePoint
 * @tc.desc: Judge whether the "tracepoint information conforming to the specification" in a text format conforms to the
 * tracepoint specification
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePoint, TestSize.Level1)
{
    TS_LOGI("test5-40");
    std::string str("B|924|FullSuspendCheck");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_SUCCESS);
}

/**
 * @tc.name: CheckTracePointEmptyString
 * @tc.desc: Judge whether the Empty string conforms to the tracepoint specification
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePointEmptyString, TestSize.Level1)
{
    TS_LOGI("test5-41");
    std::string str("");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: CheckTracePointNoSplit
 * @tc.desc: Judge whether the string No Split conforms to the tracepoint specification
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePointNoSplit, TestSize.Level1)
{
    TS_LOGI("test5-42");
    std::string str("trace_event_clock_sync");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: CheckTracePointMultiType
 * @tc.desc: Judge whether the  string has multipul Case type conforms to the tracepoint specification
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePointMultiType, TestSize.Level1)
{
    TS_LOGI("test5-43");
    std::string str("BECSF|924|FullSuspendCheck");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: CheckTracePointCheckSingleCharacter
 * @tc.desc: Check whether a single character conforms to tracepoint format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePointCheckSingleCharacter, TestSize.Level1)
{
    TS_LOGI("test5-44");
    std::string str("X");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: CheckTracePointCheckErrorSplit
 * @tc.desc: Check error split
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CheckTracePointCheckErrorSplit, TestSize.Level1)
{
    TS_LOGI("test5-45");
    std::string str("B&924|FullSuspendCheck");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.CheckTracePoint(str);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: GetTracePoint
 * @tc.desc: Test GetTracePoint interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, GetTracePoint, TestSize.Level1)
{
    TS_LOGI("test5-46");
    TracePoint point;
    std::string str("B|924|SuspendThreadByThreadId suspended Binder:924_8 id=39");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.GetTracePoint(str, point);

    EXPECT_TRUE(result == PARSE_SUCCESS);
}

/**
 * @tc.name: GetTracePointParseEmptyString
 * @tc.desc: Test GetTracePoint interface parse empty string
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, GetTracePointParseEmptyString, TestSize.Level1)
{
    TS_LOGI("test5-47");
    TracePoint point;
    std::string str("");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.GetTracePoint(str, point);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: GetTracePointParseErrorSubEventType
 * @tc.desc: Test GetTracePoint interface parse error Sub event type
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, GetTracePointParseErrorSubEventType, TestSize.Level1)
{
    TS_LOGI("test5-48");
    TracePoint point;
    std::string str("X|924|SuspendThreadByThreadId suspended Binder:924_8 id=39");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.GetTracePoint(str, point);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: GetThreadGroupId
 * @tc.desc: Test GetThreadGroupId interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, GetThreadGroupId, TestSize.Level1)
{
    TS_LOGI("test5-49");
    size_t length{0};
    std::string str("E|924");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.GetThreadGroupId(str, length);

    EXPECT_TRUE(result == 924);
}

/**
 * @tc.name: GetThreadGroupIdParseErrorPid
 * @tc.desc: Test GetThreadGroupId interface parse error pid
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, GetThreadGroupIdParseErrorPid, TestSize.Level1)
{
    TS_LOGI("test5-50");
    size_t length{0};
    std::string str("E|abc");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.GetThreadGroupId(str, length);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: HandlerB
 * @tc.desc: Test HandlerB interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerB, TestSize.Level1)
{
    TS_LOGI("test5-51");
    size_t length{3};
    TracePoint outPoint;
    std::string str("B|924|HID::ISensors::batch::client");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerB(str, outPoint, length);

    EXPECT_TRUE(result == PARSE_SUCCESS);
}

/**
 * @tc.name: HandlerBAbnormal
 * @tc.desc: Test HandlerBAbnormal interface using Abnormal format
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerBAbnormal, TestSize.Level1)
{
    TS_LOGI("test5-52");
    size_t length{3};
    TracePoint outPoint;
    std::string str("B|924|");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerB(str, outPoint, length);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: HandlerCsf
 * @tc.desc: Test HandlerCSF interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerCsf, TestSize.Level1)
{
    TS_LOGI("test5-53");
    size_t length{4};
    TracePoint outPoint;
    std::string str("C|2519|Heap size (KB)|2363");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerCSF(str, outPoint, length);

    EXPECT_TRUE(result == PARSE_SUCCESS);
}

/**
 * @tc.name: HandlerCsfParseEmptyString
 * @tc.desc: Parse empty string using HandlerCSF interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerCsfParseEmptyString, TestSize.Level1)
{
    TS_LOGI("test5-54");
    size_t length{4};
    TracePoint outPoint;
    std::string str("");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerCSF(str, outPoint, length);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: HandlerCsfParseErrorFormate
 * @tc.desc: Parse "C|2519|Heap size (KB)|" using HandlerCSF interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerCsfParseErrorFormate, TestSize.Level1)
{
    TS_LOGI("test5-55");
    size_t length{4};
    TracePoint outPoint;
    std::string str("C|2519|Heap size (KB)|");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerCSF(str, outPoint, length);

    EXPECT_TRUE(result == PARSE_ERROR);
}

/**
 * @tc.name: HandlerBParseSystemDataTracking
 * @tc.desc: Parse "B|2483|H:hitraceTest|M62|key1=value1" using HandlerB interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerBParseSystemDataTracking, TestSize.Level1)
{
    TS_LOGI("test5-56");
    size_t length{4};
    TracePoint outPoint;
    std::string str = "B|2483|H:hitraceTest";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerB(str, outPoint, length);
    EXPECT_TRUE(result == PARSE_SUCCESS);
    EXPECT_EQ(outPoint.customArgsId_, INVALID_UINT64);

    str = "B|2483|H:hitraceTest|M62|key1=value1";
    result = eventParser.printEventParser_.HandlerB(str, outPoint, length);
    EXPECT_TRUE(result == PARSE_SUCCESS);
    EXPECT_NE(outPoint.customArgsId_, INVALID_UINT64);
}

/**
 * @tc.name: HandlerCsfParseSystemDataTracking
 * @tc.desc: Parse "S|2483|H:hitraceTest|M62|customCategoryTest|key1=value1" using HandlerCSF interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerCsfParseSystemDataTracking, TestSize.Level1)
{
    TS_LOGI("test5-57");
    size_t length{4};
    TracePoint outPoint;
    outPoint.phase_ = 'S';
    std::string str = "S|2483|H:hitraceTest|123";
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.printEventParser_.HandlerCSF(str, outPoint, length);
    EXPECT_TRUE(result == PARSE_SUCCESS);
    EXPECT_EQ(outPoint.customCategoryId_, INVALID_UINT64);

    str = "S|2483|H:hitraceTest|123|M62|categoryTest|key=value";
    result = eventParser.printEventParser_.HandlerCSF(str, outPoint, length);
    EXPECT_TRUE(result == PARSE_SUCCESS);
    EXPECT_NE(outPoint.customCategoryId_, INVALID_UINT64);
}

/**
 * @tc.name: ParseSysEnterEventAndSysEnterEvent
 * @tc.desc: Parse SysEnterEvent and SysEnterEvent interface
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSysEnterEventAndSysEnterEvent, TestSize.Level1)
{
    TS_LOGI("test5-58");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.eventName = "sys_enter";
    bytraceLine.argsStr = "";
    std::unordered_map<std::string, std::string> args;
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    int32_t result = eventParser.SysEnterEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    result = eventParser.SysExitEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    auto eventCount = stream_.traceDataCache_->GetConstSysCallData().Size();
    EXPECT_EQ(eventCount, 0);

    bytraceLine.argsStr = "NR";
    result = eventParser.SysEnterEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    result = eventParser.SysExitEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    eventCount = stream_.traceDataCache_->GetConstSysCallData().Size();
    EXPECT_EQ(eventCount, 0);

    bytraceLine.argsStr = "NR 146 (6, f663d4e8, 3, 42, 3, f663d4e8)";
    result = eventParser.SysEnterEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    bytraceLine.argsStr = "NR 145 = 66";
    result = eventParser.SysExitEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    EXPECT_EQ(eventCount, 0);

    bytraceLine.argsStr = "NR 146 = 66";
    result = eventParser.SysExitEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    eventCount = stream_.traceDataCache_->GetConstSysCallData().Size();
    EXPECT_EQ(eventCount, 0);

    bytraceLine.argsStr = "NR 147 (6, f663d4e8, 3, 42, 3, f663d4e8)";
    result = eventParser.SysEnterEvent(args, bytraceLine);
    EXPECT_TRUE(result);

    bytraceLine.argsStr = "NR 147 = 66";
    result = eventParser.SysExitEvent(args, bytraceLine);
    EXPECT_TRUE(result);
    eventCount = stream_.traceDataCache_->GetConstSysCallData().Size();
    EXPECT_EQ(eventCount, 1);
}

/**
 * @tc.name: ParseGEvent
 * @tc.desc: Parse GEvent
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseGEvent, TestSize.Level1)
{
    TS_LOGI("test5-59");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    uint64_t ts = 10;
    uint32_t pid;
    TracePoint point;
    printEventParser.ParseGEvent(ts, pid, point);
    uint64_t num = printEventParser.streamFilters_->sliceFilter_->gEventSize_;
    EXPECT_EQ(num, 1u);
}

/**
 * @tc.name: ParseHEvent
 * @tc.desc: Parse HEvent
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseHEvent, TestSize.Level1)
{
    TS_LOGI("test5-60");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    uint64_t ts = 10;
    TracePoint point;
    printEventParser.ParseHEvent(ts, point);
    bool result = printEventParser.streamFilters_->sliceFilter_->gEventFilterMap_.empty();
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ReciveVsync
 * @tc.desc: Deal a reciveVsync event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ReciveVsync, TestSize.Level1)
{
    TS_LOGI("test5-61");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    size_t row = 5;
    std::string args = "comm";
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = printEventParser.ReciveVsync(row, args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ReciveVsync001
 * @tc.desc: Standard format parameters
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ReciveVsync001, TestSize.Level1)
{
    TS_LOGI("test5-62");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line;
    line.pid = 1234;
    std::string args = "dataCount:24bytes now:211306766162 expectedEnd:211323423844 vsyncId:3179";
    bool result = printEventParser.ReciveVsync(1, args, line);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ReciveVsync002
 * @tc.desc: All standard format parameters are set to 0
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ReciveVsync002, TestSize.Level1)
{
    TS_LOGI("test5-63");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line;
    line.pid = 1234;
    std::string args = "dataCount:24bytes now:0 expectedEnd:0 vsyncId:0";
    bool result = printEventParser.ReciveVsync(1, args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ReciveVsync003
 * @tc.desc: Multiple requests
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ReciveVsync003, TestSize.Level1)
{
    TS_LOGI("test5-64");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line;
    line.pid = 1234;
    std::string args = "dataCount:24bytes now:0 expectedEnd:0 vsyncId:0";
    bool result = printEventParser.ReciveVsync(1, args, line);
    EXPECT_EQ(result, false);
    result = printEventParser.ReciveVsync(2, args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: DealUIVsyncTaskEvent
 * @tc.desc: Deal a UIVsyncTask event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, DealUIVsyncTaskEvent, TestSize.Level1)
{
    TS_LOGI("test5-65");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    DataIndex index = 10;
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = printEventParser.DealUIVsyncTaskEvent(index, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: HandleFrameQueueEndEvent
 * @tc.desc: Deal a handleFrameQueueEnd event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandleFrameQueueEndEvent, TestSize.Level1)
{
    TS_LOGI("test5-66");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    uint64_t ts = 123456789;
    uint64_t pid = 1001;
    uint64_t tid = 2002;
    size_t callStackRow = 5;
    printEventParser.frameCallIds_.push_back(callStackRow);
    printEventParser.HandleFrameQueueEndEvent(ts, pid, tid, callStackRow);
    auto result = printEventParser.frameCallIds_.empty();
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: HandlerGH
 * @tc.desc: Deal a handlerGH event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandlerGH, TestSize.Level1)
{
    TS_LOGI("test5-67");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string pointStr = "prefix1234567890name:value12345";
    TracePoint outPoint;
    size_t tGidlength = 10;
    auto result = printEventParser.HandlerGH(pointStr, outPoint, tGidlength);
    EXPECT_EQ(result, 0);
}

/**
 * @tc.name: OnRwTransaction
 * @tc.desc: Deal a onRwTransaction event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, OnRwTransaction, TestSize.Level1)
{
    TS_LOGI("test5-68");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    size_t row = 5;
    std::string args = "comm";
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = printEventParser.OnRwTransaction(row, args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: OnRwTransaction001
 * @tc.desc: Deal a onRwTransaction event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, OnRwTransaction001, TestSize.Level1)
{
    TS_LOGI("test5-69");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    size_t callStackRow = 0;
    std::string args = "transactionFlag:[3799,8], tid:5678, timestamp:987654321";
    BytraceLine line;
    line.pid = 1234;
    bool result = printEventParser.OnRwTransaction(callStackRow, args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: OnRwTransaction002
 * @tc.desc: Deal a onRwTransaction evevnt
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, OnRwTransaction002, TestSize.Level1)
{
    TS_LOGI("test5-70");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    size_t callStackRow = 0;
    std::string args = "transactionFlag:[3799,8]";
    BytraceLine line;
    line.pid = 1234;
    bool result = printEventParser.OnRwTransaction(callStackRow, args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: OnMainThreadProcessCmd
 * @tc.desc: Deal a onMainThreadProcessCmd event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, OnMainThreadProcessCmd, TestSize.Level1)
{
    TS_LOGI("test5-71");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    size_t row = 0;
    std::string args = "[123,456]";
    BytraceLine line;
    line.pid = 1234;
    bool result = printEventParser.OnMainThreadProcessCmd(row, args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: HandleAnimationBeginEvent
 * @tc.desc: Deal a handleAnimationBegin event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, HandleAnimationBeginEvent, TestSize.Level1)
{
    TS_LOGI("test5-72");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    TracePoint point;
    size_t row = 5;
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = printEventParser.HandleAnimationBeginEvent(point, row, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: OnFrameQueueStart
 * @tc.desc: Deal a onFrameQueueStart event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, OnFrameQueueStart, TestSize.Level1)
{
    TS_LOGI("test5-73");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    uint64_t ts = 10;
    size_t row = 5;
    uint32_t pid;
    bool result = printEventParser.OnFrameQueueStart(ts, row, pid);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: BlockedReason
 * @tc.desc: Deal a blockedReason event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BlockedReason, TestSize.Level1)
{
    TS_LOGI("test5-74");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.BlockedReason(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BlockedReason001
 * @tc.desc: Deal a blockedReason event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BlockedReason001, TestSize.Level1)
{
    TS_LOGI("test5-75");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"pid", "1234"}, {"iowait", "1"}, {"caller", "test_caller"}};
    BytraceLine line;
    line.ts = 123456789;
    line.cpu = 0;
    bool result = eventParser.BlockedReason(args, line);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: CpuFrequencyLimitsEvent
 * @tc.desc: Deal a cpuFrequencyLimits event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CpuFrequencyLimitsEvent, TestSize.Level1)
{
    TS_LOGI("test5-76");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"cpu_id", "0"}, {"min", "1000000"}, {"max", "2000000"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bool result = eventParser.CpuFrequencyLimitsEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: CpuFrequencyLimitsEvent001
 * @tc.desc: Deal a cpuFrequencyLimits event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CpuFrequencyLimitsEvent001, TestSize.Level1)
{
    TS_LOGI("test5-77");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bool result = eventParser.CpuFrequencyLimitsEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseTaskRenameEventByInitParam001
 * @tc.desc: Parse a TaskRename event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseTaskRenameEventByInitParam001, TestSize.Level1)
{
    TS_LOGI("test5-78");
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456;
    ArgsMap args;
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool result = eventParser.TaskRenameEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseSchedWakingByInitParam001
 * @tc.desc: Parse a SchedWaking event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseSchedWakingByInitParam001, TestSize.Level1)
{
    TS_LOGI("test5-79");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    ArgsMap args;
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool result = eventParser.SchedWakingEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseCpuIdleByInitParam
 * @tc.desc: Parse a CpuIdle event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuIdleByInitParam01, TestSize.Level1)
{
    TS_LOGI("test5-80");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    ArgsMap args;
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool result = eventParser.CpuIdleEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ParseCpuFrequencyNormal001
 * @tc.desc: Parse a CpuFrequency event normally with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseCpuFrequencyNormal001, TestSize.Level1)
{
    TS_LOGI("test5-81");
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.eventName = "POSIX";
    ArgsMap args;
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool result = eventParser.CpuFrequencyEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ProcessExitEvent
 * @tc.desc: Deal a process exit event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ProcessExitEvent, TestSize.Level1)
{
    TS_LOGI("test5-82");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"comm", "test_process"}, {"pid", "1234"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.ProcessExitEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ProcessExitEvent001
 * @tc.desc: Deal a process exit event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ProcessExitEvent001, TestSize.Level1)
{
    TS_LOGI("test5-83");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.ProcessExitEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: IrqHandlerEntryEvent
 * @tc.desc: Deal a irq handler entry event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, IrqHandlerEntryEvent, TestSize.Level1)
{
    TS_LOGI("test5-84");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.IrqHandlerEntryEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: IrqHandlerExitEvent
 * @tc.desc: Deal a irq handler exit event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, IrqHandlerExitEvent, TestSize.Level1)
{
    TS_LOGI("test5-85");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.IrqHandlerExitEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: SoftIrqEntryEvent
 * @tc.desc: Deal a soft irq entry event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, SoftIrqEntryEvent, TestSize.Level1)
{
    TS_LOGI("test5-86");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.SoftIrqEntryEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: SoftIrqExitEvent
 * @tc.desc: Deal a soft irq exit event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, SoftIrqExitEvent, TestSize.Level1)
{
    TS_LOGI("test5-87");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.SoftIrqExitEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BinderTransaction
 * @tc.desc: Deal a binder transaction event with empty args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BinderTransaction, TestSize.Level1)
{
    TS_LOGI("test5-88");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.BinderTransaction(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BinderTransactionReceived
 * @tc.desc: Deal a binder transaction received event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BinderTransactionReceived, TestSize.Level1)
{
    TS_LOGI("test5-89");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.BinderTransactionReceived(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BinderTransactionAllocBufEvent
 * @tc.desc: Deal a binder transaction allocBuf event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BinderTransactionAllocBufEvent, TestSize.Level1)
{
    TS_LOGI("test5-90");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args;
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bytraceLine.cpu = 1;
    bool result = eventParser.BinderTransactionAllocBufEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: SetRateEvent
 * @tc.desc: Deal a set rate event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, SetRateEvent, TestSize.Level1)
{
    TS_LOGI("test5-91");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.SetRateEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ClockEnableEvent
 * @tc.desc: Deal a clock enable event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ClockEnableEvent, TestSize.Level1)
{
    TS_LOGI("test5-92");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.ClockEnableEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: ClockDisableEvent
 * @tc.desc: Deal a clock disable event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ClockDisableEvent, TestSize.Level1)
{
    TS_LOGI("test5-93");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.ClockDisableEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: RegulatorSetVoltageEvent
 * @tc.desc: Deal a regulator set voltage event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, RegulatorSetVoltageEvent, TestSize.Level1)
{
    TS_LOGI("test5-94");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.RegulatorSetVoltageEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: RegulatorSetVoltageCompleteEvent
 * @tc.desc: Deal a regulator set voltage complete event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, RegulatorSetVoltageCompleteEvent, TestSize.Level1)
{
    TS_LOGI("test5-95");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.RegulatorSetVoltageCompleteEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: RegulatorDisableEvent
 * @tc.desc: Deal a regulator disable event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, RegulatorDisableEvent, TestSize.Level1)
{
    TS_LOGI("test5-96");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.RegulatorDisableEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: RegulatorDisableCompleteEvent
 * @tc.desc: Deal a regulator disable complete event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, RegulatorDisableCompleteEvent, TestSize.Level1)
{
    TS_LOGI("test5-97");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.RegulatorDisableCompleteEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: DmaFenceEvent
 * @tc.desc: Deal a dma fence event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, DmaFenceEvent, TestSize.Level1)
{
    TS_LOGI("test5-98");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"cpu_id", "3"}, {"state", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bytraceLine.pid = 1;
    bytraceLine.cpu = 0;
    bytraceLine.task = "ACCS0-2716";
    bytraceLine.eventName = "sched_switch";
    bytraceLine.argsStr =
        "prev_comm=ACCS0 prev_pid=2716 prev_prio=120 \
        prev_state=R ==> next_comm=kworker/0:0 next_pid=8326 next_prio=120";
    bool result = eventParser.DmaFenceEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: CpuFrequencyLimitsEvent001
 * @tc.desc: Deal a cpuFrequencyLimits event with normal args
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CpuFrequencyLimitsEvent004, TestSize.Level1)
{
    TS_LOGI("test5-99");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"cpu_id", "invalid"}, {"min_freq", "1000000"}, {"max_freq", "2000000"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bool result = eventParser.CpuFrequencyLimitsEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: CpuFrequencyLimitsEvent002
 * @tc.desc: Deal a cpuFrequencyLimits event with empty min_freq
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CpuFrequencyLimitsEvent002, TestSize.Level1)
{
    TS_LOGI("test5-100");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"cpu_id", "0"}, {"min_freq", ""}, {"max_freq", "2000000"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bool result = eventParser.CpuFrequencyLimitsEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: CpuFrequencyLimitsEvent003
 * @tc.desc: Deal a cpuFrequencyLimits event with empty max_freq
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, CpuFrequencyLimitsEvent003, TestSize.Level1)
{
    TS_LOGI("test5-101");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"cpu_id", "0"}, {"min_freq", "1000000"}, {"max_freq", ""}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 123456789;
    bool result = eventParser.CpuFrequencyLimitsEvent(args, bytraceLine);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BlockedReason002
 * @tc.desc: Deal a blockedReason event with io_wait
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BlockedReason002, TestSize.Level1)
{
    TS_LOGI("test5-102");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"pid", "invalid"}, {"io_wait", "0"}, {"caller", "another_caller"}};
    BytraceLine line;
    line.ts = 123456789;
    line.cpu = 0;
    bool result = eventParser.BlockedReason(args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: BlockedReason003
 * @tc.desc: Deal a blockedReason event with delay
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, BlockedReason003, TestSize.Level1)
{
    TS_LOGI("test5-103");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args = {{"pid", "1234"}, {"iowait", "invalid"}, {"caller", "another_caller"}, {"delay", "50"}};
    BytraceLine line;
    line.ts = 123456789;
    line.cpu = 3;
    line.pid = 1111;
    bool result = eventParser.BlockedReason(args, line);
    EXPECT_EQ(result, false);
}

/**
 * @tc.name: SetRateEvent001
 * @tc.desc: Deal a set rate event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, SetRateEvent001, TestSize.Level1)
{
    TS_LOGI("test5-104");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"name", "gpu_clk"}, {"state", "800000"}, {"extra1", "value1"}, {"extra2", "value2"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bool result = eventParser.SetRateEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ClockEnableEvent001
 * @tc.desc: Deal a clock enable event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ClockEnableEvent001, TestSize.Level1)
{
    TS_LOGI("test5-105");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"name", "cpu_clk"}, {"state", "1000000"}, {"cpu_id", "3"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bool result = eventParser.ClockEnableEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ClockDisableEvent001
 * @tc.desc: Deal a clock enable event
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ClockDisableEvent001, TestSize.Level1)
{
    TS_LOGI("test5-106");
    BytraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{{"name", "cpu_clk"}, {"state", "1000000"}, {"cpu_id", "3"}};
    BytraceLine bytraceLine;
    bytraceLine.ts = 1616439852302;
    bool result = eventParser.ClockDisableEvent(args, bytraceLine);
    EXPECT_EQ(result, true);
}

/**
 * @tc.name: ParseStartEvent
 * @tc.desc: Parse startevent
 * @tc.type: FUNC
 */
HWTEST_F(EventParserTest, ParseStartEvent, TestSize.Level1)
{
    TS_LOGI("test5-107");
    PrintEventParser printEventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string comm = "test_comm";
    uint64_t ts = 123456789;
    uint32_t pid = 1234;
    TracePoint point;
    point.value_ = 5678;
    point.tgid_ = 91011;
    point.name_ = "H:M: Frame queued";
    point.traceLevel_ = 1;
    point.traceTagId_ = 2;
    point.customArgsId_ = 3;
    point.customCategoryId_ = 4;
    BytraceLine line;
    printEventParser.ParseStartEvent(comm, ts, pid, point, line);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    ASSERT_NE(slices, nullptr);
}
} // namespace TraceStreamer
} // namespace SysTuning
