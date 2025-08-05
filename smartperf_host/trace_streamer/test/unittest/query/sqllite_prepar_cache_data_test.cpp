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
#include <memory>

#define private public
#include "export_test.h"
#include "file.h"
#include "sph_data.pb.h"
#include "sph_data.pbreader.h"
#include "cpu_data_parser/pbreader_cpu_data_parser.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "sqllite_prepar_cache_data.h"

using namespace testing::ext;
using namespace SysTuning;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
namespace SqlitePreparCacheUnitTest {
const int32_t PROCESS_ID = 100;
const int32_t CPU = 101;
const int32_t PID = 102;
const int32_t TID = 103;
const int32_t UID = 104;
const int32_t IPID = 105;
const int32_t ID = 106;
const int32_t VALUE = 107;
const int32_t MAXX = 108;
const int32_t MINN = 109;
const int32_t DEPTH = 111;
const int32_t ITID = 112;
const int32_t FILTER_ID = 113;
const int32_t ARG_SET_ID = 114;
const int32_t DURATION = 115;
const int32_t DELTA = 116;
const int32_t INT_NAME = 117;
const int32_t JANK_TAG = 118;
const int32_t RS_VSYNC = 119;
const int32_t RS_IPID = 120;
const int32_t RS_PID = 121;
const int32_t RS_NAME = 122;
const int32_t ANIMATION_ID = 123;
const int32_t STATUS = 124;
const int32_t START_NAME = 125;
const int32_t INT_TYPE = 126;
const int32_t TRACK_ID = 127;
const int32_t PARENT_ID = 128;
const int32_t COOKIE = 129;

const int64_t DUR = 10000;
const int64_t START_TIME = 10001;
const int64_t START_NS = 10002;
const int64_t START_TS = 10003;
const int64_t END_TS = 10004;
const int64_t TS = 10005;
const int64_t MAX_VALUE = 10006;
const int64_t APP_DUR = 10007;
const int64_t RS_TS = 10008;
const int64_t RS_DUR = 10009;
const int64_t CURRENT_TS = 10010;
const int64_t END_NS = 10011;
const int64_t ARGSETTID = 10012;
const int64_t EVENT_COUNT = 10013;
const int64_t SAMPLE_COUNT = 10014;
const int64_t EVENT_TYPE_ID = 10015;
const int64_t CALLCHAIN_ID = 10016;
const int64_t THREAD_ID = 10017;
const int64_t CPU_ID = 10018;
const int64_t FILE_ID = 10019;
const int64_t SYMBOL_ID = 10020;
const int64_t IS_MAIN_THREAD = 10021;
const int64_t SIZE = 10022;
const int64_t FUNCTION_ID = 10023;
const int64_t END_TIME = 10024;
const int64_t URL_ID = 10025;
const int64_t LINE = 10026;
const int64_t COLUMN = 10027;
const int64_t HIT_COUNT = 10028;
const int64_t CHILDREN_STRING = 10029;
const int64_t INT_NAME_ID = 10030;
const int64_t HEAP_SIZE = 10031;
const int64_t EVENT_TYPE = 10032;
const int64_t APPLY_COUNT = 10033;
const int64_t APPLY_SIZE = 10034;
const int64_t RELEASE_COUNT = 10034;
const int64_t RELEASE_SIZE = 10034;

const std::string SEQ = "seq";
const std::string EVENT_NAME = "enent_name";
const std::string APP_KEY = "app_key";
const std::string EVENT_VALUE = "event_value";
const std::string FRAME_TYPE = "prame_type";
const std::string TYPE = "type";
const std::string CMDLINE = "cmdline";
const std::string NAME = "name";
const std::string X = "x";
const std::string Y = "y";
const std::string WIDTH = "width";
const std::string HEIGHT = "height";
const std::string ALPHA = "alpha";
const std::string APP_NAME = "app_name";
const std::string CURRENT_FRAME_WIDTH = "current_frame_width";
const std::string CURRENT_FRAME_HEIGHT = "current_frame_height";
const std::string NAME_ID = "name_id";
const std::string STATE = "STATE";
const std::string SVALUE = "VALUE";

class SqllitePreparCacheDataTest : public testing::Test {
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseBatchSphDataWithSphCpuData
 * @tc.desc: Parse a BatchSphData with SphCpuData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphCpuData, TestSize.Level1)
{
    TS_LOGI("test42-1");
    SqllitePreparCacheData sqllitePreparCacheData;
    BatchSphData batchSphCpuData;
    auto sphCpuData = batchSphCpuData.add_values()->mutable_cpu_data();
    sphCpuData->set_process_id(PROCESS_ID);
    sphCpuData->set_cpu(CPU);
    sphCpuData->set_tid(TID);
    sphCpuData->set_id(ID);
    sphCpuData->set_dur(DUR);
    sphCpuData->set_start_time(START_TIME);

    std::string sphStrMsg = "";
    batchSphCpuData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphCpuDataResult;
    batchSphCpuDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphCpuDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphCpuDataResult.values(0).has_cpu_data());
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().process_id(), PROCESS_ID);
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().cpu(), CPU);
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().tid(), TID);
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().id(), ID);
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().dur(), DUR);
    EXPECT_EQ(batchSphCpuDataResult.values(0).cpu_data().start_time(), START_TIME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphCpuStateData
 * @tc.desc: Parse a BatchSphData with SphCpuStateData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphCpuStateData, TestSize.Level1)
{
    TS_LOGI("test42-2");

    BatchSphData batchSphCpuStateData;
    auto sphCpuStateData = batchSphCpuStateData.add_values()->mutable_cpu_state_data();
    sphCpuStateData->set_value(VALUE);
    sphCpuStateData->set_dur(DUR);
    sphCpuStateData->set_start_ts(START_TS);

    std::string sphStrMsg = "";
    batchSphCpuStateData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphCpuStateDataResult;
    batchSphCpuStateDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphCpuStateDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphCpuStateDataResult.values(0).has_cpu_state_data());
    EXPECT_EQ(batchSphCpuStateDataResult.values(0).cpu_state_data().value(), VALUE);
    EXPECT_EQ(batchSphCpuStateDataResult.values(0).cpu_state_data().dur(), DUR);
    EXPECT_EQ(batchSphCpuStateDataResult.values(0).cpu_state_data().start_ts(), START_TS);
}

/**
 * @tc.name: ParseBatchSphDataWithSphCpuFreqData
 * @tc.desc: Parse a BatchSphData with SphCpuFreqData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphCpuFreqData, TestSize.Level1)
{
    TS_LOGI("test42-3");

    BatchSphData batchSphCpuFreqData;
    auto sphCpuFreqData = batchSphCpuFreqData.add_values()->mutable_cpu_freq_data();
    sphCpuFreqData->set_cpu(CPU);
    sphCpuFreqData->set_value(VALUE);
    sphCpuFreqData->set_dur(DUR);
    sphCpuFreqData->set_start_ns(START_NS);

    std::string sphStrMsg = "";
    batchSphCpuFreqData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphCpuFreqDataResult;
    batchSphCpuFreqDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphCpuFreqDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphCpuFreqDataResult.values(0).has_cpu_freq_data());
    EXPECT_EQ(batchSphCpuFreqDataResult.values(0).cpu_freq_data().cpu(), CPU);
    EXPECT_EQ(batchSphCpuFreqDataResult.values(0).cpu_freq_data().value(), VALUE);
    EXPECT_EQ(batchSphCpuFreqDataResult.values(0).cpu_freq_data().dur(), DUR);
    EXPECT_EQ(batchSphCpuFreqDataResult.values(0).cpu_freq_data().start_ns(), START_NS);
}

/**
 * @tc.name: ParseBatchSphDataWithSphCpuFreqLimitData
 * @tc.desc: Parse a BatchSphData with SphCpuFreqLimitData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphCpuFreqLimitData, TestSize.Level1)
{
    TS_LOGI("test42-4");

    BatchSphData batchSphCpuFreqLimitData;
    auto sphCpuFreqLimitData = batchSphCpuFreqLimitData.add_values()->mutable_cpu_freq_limit_data();
    sphCpuFreqLimitData->set_max(MAXX);
    sphCpuFreqLimitData->set_min(MINN);
    sphCpuFreqLimitData->set_value(VALUE);
    sphCpuFreqLimitData->set_dur(DUR);
    sphCpuFreqLimitData->set_start_ns(START_NS);

    std::string sphStrMsg = "";
    batchSphCpuFreqLimitData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphCpuFreqLimitDataResult;
    batchSphCpuFreqLimitDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphCpuFreqLimitDataResult.values(0).has_cpu_freq_limit_data());
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values(0).cpu_freq_limit_data().max(), MAXX);
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values(0).cpu_freq_limit_data().min(), MINN);
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values(0).cpu_freq_limit_data().value(), VALUE);
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values(0).cpu_freq_limit_data().dur(), DUR);
    EXPECT_EQ(batchSphCpuFreqLimitDataResult.values(0).cpu_freq_limit_data().start_ns(), START_NS);
}

/**
 * @tc.name: ParseBatchSphDataWithSphClockData
 * @tc.desc: Parse a BatchSphData with SphClockData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphClockData, TestSize.Level1)
{
    TS_LOGI("test42-5");

    BatchSphData batchSphClockData;
    auto sphClockData = batchSphClockData.add_values()->mutable_clock_data();
    sphClockData->set_filter_id(FILTER_ID);
    sphClockData->set_value(VALUE);
    sphClockData->set_start_ns(START_NS);

    std::string sphStrMsg = "";
    batchSphClockData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphClockDataResult;
    batchSphClockDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphClockDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphClockDataResult.values(0).has_clock_data());
    EXPECT_EQ(batchSphClockDataResult.values(0).clock_data().filter_id(), FILTER_ID);
    EXPECT_EQ(batchSphClockDataResult.values(0).clock_data().value(), VALUE);
    EXPECT_EQ(batchSphClockDataResult.values(0).clock_data().start_ns(), START_NS);
}

/**
 * @tc.name: ParseBatchSphDataWithSphIrqData
 * @tc.desc: Parse a BatchSphData with SphIrqData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphIrqData, TestSize.Level1)
{
    TS_LOGI("test42-6");

    BatchSphData batchSphIrqData;
    auto sphIrqData = batchSphIrqData.add_values()->mutable_irq_data();
    sphIrqData->set_start_ns(START_NS);
    sphIrqData->set_dur(DUR);
    sphIrqData->set_depth(DEPTH);
    sphIrqData->set_arg_set_id(ARG_SET_ID);

    std::string sphStrMsg = "";
    batchSphIrqData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphIrqDataResult;
    batchSphIrqDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphIrqDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphIrqDataResult.values(0).has_irq_data());
    EXPECT_EQ(batchSphIrqDataResult.values(0).irq_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphIrqDataResult.values(0).irq_data().dur(), DUR);
    EXPECT_EQ(batchSphIrqDataResult.values(0).irq_data().depth(), DEPTH);
    EXPECT_EQ(batchSphIrqDataResult.values(0).irq_data().arg_set_id(), ARG_SET_ID);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessData
 * @tc.desc: Parse a BatchSphData with SphProcessData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessData, TestSize.Level1)
{
    TS_LOGI("test42-7");

    BatchSphData batchSphProcessData;
    auto sphProcessData = batchSphProcessData.add_values()->mutable_process_data();
    sphProcessData->set_cpu(CPU);
    sphProcessData->set_dur(DUR);
    sphProcessData->set_start_time(START_TIME);

    std::string sphStrMsg = "";
    batchSphProcessData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessDataResult;
    batchSphProcessDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphProcessDataResult.values(0).has_process_data());
    EXPECT_EQ(batchSphProcessDataResult.values(0).process_data().cpu(), CPU);
    EXPECT_EQ(batchSphProcessDataResult.values(0).process_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessDataResult.values(0).process_data().start_time(), START_TIME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessMemData
 * @tc.desc: Parse a BatchSphData with SphProcessMemData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessMemData, TestSize.Level1)
{
    TS_LOGI("test42-8");

    BatchSphData batchSphProcessMemData;
    auto sphProcessMemData = batchSphProcessMemData.add_values()->mutable_process_mem_data();
    sphProcessMemData->set_track_id(TRACK_ID);
    sphProcessMemData->set_value(VALUE);
    sphProcessMemData->set_start_time(START_TIME);
    sphProcessMemData->set_ts(TS);

    std::string sphStrMsg = "";
    batchSphProcessMemData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessMemDataResult;
    batchSphProcessMemDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessMemDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphProcessMemDataResult.values(0).has_process_mem_data());
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_mem_data().track_id(), TRACK_ID);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_mem_data().value(), VALUE);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_mem_data().start_time(), START_TIME);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_mem_data().ts(), TS);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessStartupData
 * @tc.desc: Parse a BatchSphData with SphProcessStartupData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessStartupData, TestSize.Level1)
{
    TS_LOGI("test42-9");

    BatchSphData batchSphProcessStartupData;
    auto sphProcessStartupData = batchSphProcessStartupData.add_values()->mutable_process_startup_data();
    sphProcessStartupData->set_pid(PID);
    sphProcessStartupData->set_tid(TID);
    sphProcessStartupData->set_itid(ITID);
    sphProcessStartupData->set_start_time(START_TIME);
    sphProcessStartupData->set_dur(DUR);
    sphProcessStartupData->set_start_name(START_NAME);

    std::string sphStrMsg = "";
    batchSphProcessStartupData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessStartupDataResult;
    batchSphProcessStartupDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessStartupDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphProcessStartupDataResult.values(0).has_process_startup_data());
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().pid(), PID);
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().tid(), TID);
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().itid(), ITID);
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().start_time(), START_TIME);
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessStartupDataResult.values(0).process_startup_data().start_name(), START_NAME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessSoInitData
 * @tc.desc: Parse a BatchSphData with SphProcessSoInitData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessSoInitData, TestSize.Level1)
{
    TS_LOGI("test42-10");

    BatchSphData batchSphProcessSoInitData;
    auto sphProcessSoInitData = batchSphProcessSoInitData.add_values()->mutable_process_soinit_data();
    sphProcessSoInitData->set_depth(DEPTH);
    sphProcessSoInitData->set_pid(PID);
    sphProcessSoInitData->set_tid(TID);
    sphProcessSoInitData->set_itid(ITID);
    sphProcessSoInitData->set_start_time(START_TIME);
    sphProcessSoInitData->set_dur(DUR);
    sphProcessSoInitData->set_id(ID);

    std::string sphStrMsg = "";
    batchSphProcessSoInitData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessMemDataResult;
    batchSphProcessMemDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessMemDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphProcessMemDataResult.values(0).has_process_soinit_data());
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().depth(), DEPTH);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().pid(), PID);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().tid(), TID);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().itid(), ITID);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().start_time(), START_TIME);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessMemDataResult.values(0).process_soinit_data().id(), ID);
}

/**
 * @tc.name: ParseBatchSphDataWithSphHiSysEventData
 * @tc.desc: Parse a BatchSphData with SphHiSysEventData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphHiSysEventData, TestSize.Level1)
{
    TS_LOGI("test42-11");

    BatchSphData batchSphHiSysEventData;
    auto sphHiSysEventData = batchSphHiSysEventData.add_values()->mutable_hi_sys_event_data();
    sphHiSysEventData->set_id(ID);
    sphHiSysEventData->set_ts(TS);
    sphHiSysEventData->set_pid(PID);
    sphHiSysEventData->set_tid(TID);
    sphHiSysEventData->set_uid(UID);
    sphHiSysEventData->set_seq(SEQ);
    sphHiSysEventData->set_depth(DEPTH);
    sphHiSysEventData->set_dur(DUR);

    std::string sphStrMsg = "";
    batchSphHiSysEventData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphHiSysEventDataResult;
    batchSphHiSysEventDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphHiSysEventDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphHiSysEventDataResult.values(0).has_hi_sys_event_data());
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().id(), ID);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().ts(), TS);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().pid(), PID);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().tid(), TID);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().uid(), UID);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().seq(), SEQ);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().depth(), DEPTH);
    EXPECT_EQ(batchSphHiSysEventDataResult.values(0).hi_sys_event_data().dur(), DUR);
}

/**
 * @tc.name: ParseBatchSphDataWithSphLogData
 * @tc.desc: Parse a BatchSphData with SphLogData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphLogData, TestSize.Level1)
{
    TS_LOGI("test42-12");

    BatchSphData batchSphLogData;
    auto sphLogData = batchSphLogData.add_values()->mutable_log_data();
    sphLogData->set_id(ID);
    sphLogData->set_pid(PID);
    sphLogData->set_tid(TID);
    sphLogData->set_start_ts(START_TS);
    sphLogData->set_depth(DEPTH);
    sphLogData->set_dur(DUR);

    std::string sphStrMsg = "";
    batchSphLogData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphLogDataResult;
    batchSphLogDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphLogDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphLogDataResult.values(0).has_log_data());
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().id(), ID);
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().pid(), PID);
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().tid(), TID);
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().start_ts(), START_TS);
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().depth(), DEPTH);
    EXPECT_EQ(batchSphLogDataResult.values(0).log_data().dur(), DUR);
}

/**
 * @tc.name: ParseBatchSphDataWithSphVirtualMemData
 * @tc.desc: Parse a BatchSphData with SphVirtualMemData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphVirtualMemData, TestSize.Level1)
{
    TS_LOGI("test42-13");

    BatchSphData batchSphVirtualMemData;
    auto sphVirtualMemData = batchSphVirtualMemData.add_values()->mutable_virtual_mem_data();
    sphVirtualMemData->set_start_time(START_TIME);
    sphVirtualMemData->set_filter_id(FILTER_ID);
    sphVirtualMemData->set_value(VALUE);
    sphVirtualMemData->set_duration(DURATION);
    sphVirtualMemData->set_max_value(MAX_VALUE);
    sphVirtualMemData->set_delta(DELTA);

    std::string sphStrMsg = "";
    batchSphVirtualMemData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphVirtualMemDataResult;
    batchSphVirtualMemDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphVirtualMemDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphVirtualMemDataResult.values(0).has_virtual_mem_data());
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().start_time(), START_TIME);
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().filter_id(), FILTER_ID);
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().value(), VALUE);
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().duration(), DURATION);
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().max_value(), MAX_VALUE);
    EXPECT_EQ(batchSphVirtualMemDataResult.values(0).virtual_mem_data().delta(), DELTA);
}

/**
 * @tc.name: ParseBatchSphDataWithSphEnergyData
 * @tc.desc: Parse a BatchSphData with SphEnergyData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphEnergyData, TestSize.Level1)
{
    TS_LOGI("test42-14");

    BatchSphData batchSphEnergyData;
    auto sphEnergyData = batchSphEnergyData.add_values()->mutable_energy_data();
    sphEnergyData->set_id(ID);
    sphEnergyData->set_start_ns(START_NS);
    sphEnergyData->set_event_name(EVENT_NAME);
    sphEnergyData->set_app_key(APP_KEY);
    sphEnergyData->set_event_value(EVENT_VALUE);

    std::string sphStrMsg = "";
    batchSphEnergyData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphEnergyDataResult;
    batchSphEnergyDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphEnergyDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphEnergyDataResult.values(0).has_energy_data());
    EXPECT_EQ(batchSphEnergyDataResult.values(0).energy_data().id(), ID);
    EXPECT_EQ(batchSphEnergyDataResult.values(0).energy_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphEnergyDataResult.values(0).energy_data().event_name(), EVENT_NAME);
    EXPECT_EQ(batchSphEnergyDataResult.values(0).energy_data().app_key(), APP_KEY);
    EXPECT_EQ(batchSphEnergyDataResult.values(0).energy_data().event_value(), EVENT_VALUE);
}

/**
 * @tc.name: ParseBatchSphDataWithSphFrameData
 * @tc.desc: Parse a BatchSphData with SphFrameData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphFrameData, TestSize.Level1)
{
    TS_LOGI("test42-15");

    BatchSphData batchSphFrameData;
    auto sphFrameData = batchSphFrameData.add_values()->mutable_frame_data();
    sphFrameData->set_id(ID);
    sphFrameData->set_frame_type(FRAME_TYPE);
    sphFrameData->set_ipid(IPID);
    sphFrameData->set_name(INT_NAME);
    sphFrameData->set_app_dur(APP_DUR);
    sphFrameData->set_dur(DUR);
    sphFrameData->set_ts(TS);
    sphFrameData->set_type(TYPE);
    sphFrameData->set_jank_tag(JANK_TAG);
    sphFrameData->set_pid(PID);
    sphFrameData->set_cmdline(CMDLINE);
    sphFrameData->set_rs_ts(RS_TS);
    sphFrameData->set_rs_vsync(RS_VSYNC);
    sphFrameData->set_rs_dur(RS_DUR);
    sphFrameData->set_rs_ipid(RS_IPID);
    sphFrameData->set_rs_pid(RS_PID);
    sphFrameData->set_rs_name(RS_NAME);

    std::string sphStrMsg = "";
    batchSphFrameData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphFrameDataResult;
    batchSphFrameDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphFrameDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphFrameDataResult.values(0).has_frame_data());
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().id(), ID);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().frame_type(), FRAME_TYPE);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().ipid(), IPID);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().name(), INT_NAME);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().app_dur(), APP_DUR);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().dur(), DUR);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().ts(), TS);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().type(), TYPE);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().jank_tag(), JANK_TAG);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().pid(), PID);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().cmdline(), CMDLINE);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_ts(), RS_TS);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_vsync(), RS_VSYNC);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_dur(), RS_DUR);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_ipid(), RS_IPID);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_pid(), RS_PID);
    EXPECT_EQ(batchSphFrameDataResult.values(0).frame_data().rs_name(), RS_NAME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphFrameAnimationData
 * @tc.desc: Parse a BatchSphData with SphFrameAnimationData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphFrameAnimationData, TestSize.Level1)
{
    TS_LOGI("test42-16");

    BatchSphData batchSphFrameAnimationData;
    auto sphFrameAnimationData = batchSphFrameAnimationData.add_values()->mutable_frame_animation_data();
    sphFrameAnimationData->set_animation_id(ANIMATION_ID);
    sphFrameAnimationData->set_status(STATUS);
    sphFrameAnimationData->set_start_ts(START_TS);
    sphFrameAnimationData->set_end_ts(END_TS);
    sphFrameAnimationData->set_name(NAME);

    std::string sphStrMsg = "";
    batchSphFrameAnimationData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphFrameAnimationDataResult;
    batchSphFrameAnimationDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphFrameAnimationDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphFrameAnimationDataResult.values(0).has_frame_animation_data());
    EXPECT_EQ(batchSphFrameAnimationDataResult.values(0).frame_animation_data().animation_id(), ANIMATION_ID);
    EXPECT_EQ(batchSphFrameAnimationDataResult.values(0).frame_animation_data().status(), STATUS);
    EXPECT_EQ(batchSphFrameAnimationDataResult.values(0).frame_animation_data().start_ts(), START_TS);
    EXPECT_EQ(batchSphFrameAnimationDataResult.values(0).frame_animation_data().end_ts(), END_TS);
    EXPECT_EQ(batchSphFrameAnimationDataResult.values(0).frame_animation_data().name(), NAME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphFrameDynamicData
 * @tc.desc: Parse a BatchSphData with SphFrameDynamicData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphFrameDynamicData, TestSize.Level1)
{
    TS_LOGI("test42-17");

    BatchSphData batchSphFrameDynamicData;
    auto sphFrameDynamicData = batchSphFrameDynamicData.add_values()->mutable_frame_dynamic_data();
    sphFrameDynamicData->set_id(ID);
    sphFrameDynamicData->set_x(X);
    sphFrameDynamicData->set_y(Y);
    sphFrameDynamicData->set_width(WIDTH);
    sphFrameDynamicData->set_height(HEIGHT);
    sphFrameDynamicData->set_alpha(ALPHA);
    sphFrameDynamicData->set_ts(TS);
    sphFrameDynamicData->set_app_name(APP_NAME);

    std::string sphStrMsg = "";
    batchSphFrameDynamicData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphFrameDynamicDataResult;
    batchSphFrameDynamicDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphFrameDynamicDataResult.values(0).has_frame_dynamic_data());
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().id(), ID);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().x(), X);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().y(), Y);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().width(), WIDTH);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().height(), HEIGHT);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().alpha(), ALPHA);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().ts(), TS);
    EXPECT_EQ(batchSphFrameDynamicDataResult.values(0).frame_dynamic_data().app_name(), APP_NAME);
}

/**
 * @tc.name: ParseBatchSphDataWithSphFrameSpacingData
 * @tc.desc: Parse a BatchSphData with SphFrameSpacingData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphFrameSpacingData, TestSize.Level1)
{
    TS_LOGI("test42-18");

    BatchSphData batchSphFrameSpacingData;
    auto sphFrameSpacingData = batchSphFrameSpacingData.add_values()->mutable_frame_spacing_data();
    sphFrameSpacingData->set_id(ID);
    sphFrameSpacingData->set_x(X);
    sphFrameSpacingData->set_y(Y);
    sphFrameSpacingData->set_current_frame_width(CURRENT_FRAME_WIDTH);
    sphFrameSpacingData->set_current_frame_height(CURRENT_FRAME_HEIGHT);
    sphFrameSpacingData->set_current_ts(CURRENT_TS);
    sphFrameSpacingData->set_name_id(NAME_ID);

    std::string sphStrMsg = "";
    batchSphFrameSpacingData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphFrameSpacingDataResult;
    batchSphFrameSpacingDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphFrameSpacingDataResult.values(0).has_frame_spacing_data());
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().id(), ID);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().x(), X);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().y(), Y);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().current_frame_width(), CURRENT_FRAME_WIDTH);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().current_frame_height(),
              CURRENT_FRAME_HEIGHT);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().current_ts(), CURRENT_TS);
    EXPECT_EQ(batchSphFrameSpacingDataResult.values(0).frame_spacing_data().name_id(), NAME_ID);
}

/**
 * @tc.name: ParseBatchSphDataWithSphEbpfData
 * @tc.desc: Parse a BatchSphData with SphEbpfData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphEbpfData, TestSize.Level1)
{
    TS_LOGI("test42-19");

    BatchSphData batchSphEbpfData;
    auto sphSphEbpfData = batchSphEbpfData.add_values()->mutable_ebpf_data();
    sphSphEbpfData->set_start_ns(START_NS);
    sphSphEbpfData->set_end_ns(END_NS);
    sphSphEbpfData->set_dur(DUR);

    std::string sphStrMsg = "";
    batchSphEbpfData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphEbpfDataResult;
    batchSphEbpfDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphEbpfDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphEbpfDataResult.values(0).has_ebpf_data());
    EXPECT_EQ(batchSphEbpfDataResult.values(0).ebpf_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphEbpfDataResult.values(0).ebpf_data().end_ns(), END_NS);
    EXPECT_EQ(batchSphEbpfDataResult.values(0).ebpf_data().dur(), DUR);
}

/**
 * @tc.name: ParseBatchSphDataWithSphTrackerData
 * @tc.desc: Parse a BatchSphData with SphTrackerData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphTrackerData, TestSize.Level1)
{
    TS_LOGI("test42-20");

    BatchSphData batchSphTrackerData;
    auto sphSphTrackerData = batchSphTrackerData.add_values()->mutable_tracker_data();
    sphSphTrackerData->set_start_ns(START_NS);
    sphSphTrackerData->set_value(VALUE);

    std::string sphStrMsg = "";
    batchSphTrackerData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphTrackerDataResult;
    batchSphTrackerDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphTrackerDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphTrackerDataResult.values(0).has_tracker_data());
    EXPECT_EQ(batchSphTrackerDataResult.values(0).tracker_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphTrackerDataResult.values(0).tracker_data().value(), VALUE);
}

/**
 * @tc.name: ParseBatchSphDataWithSphAbilityData
 * @tc.desc: Parse a BatchSphData with SphAbilityData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphAbilityData, TestSize.Level1)
{
    TS_LOGI("test42-21");

    BatchSphData batchSphAbilityData;
    auto sphSphAbilityData = batchSphAbilityData.add_values()->mutable_ability_data();
    sphSphAbilityData->set_value(VALUE);
    sphSphAbilityData->set_start_ns(START_NS);
    sphSphAbilityData->set_dur(DUR);

    std::string sphStrMsg = "";
    batchSphAbilityData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphAbilityDataResult;
    batchSphAbilityDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphAbilityDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphAbilityDataResult.values(0).has_ability_data());
    EXPECT_EQ(batchSphAbilityDataResult.values(0).ability_data().value(), VALUE);
    EXPECT_EQ(batchSphAbilityDataResult.values(0).ability_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphAbilityDataResult.values(0).ability_data().dur(), DUR);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessThreadData
 * @tc.desc: Parse a BatchSphData with SphProcessThreadData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessThreadData, TestSize.Level1)
{
    TS_LOGI("test42-22");

    BatchSphData batchSphProcessThreadData;
    auto sphProcessThreadData = batchSphProcessThreadData.add_values()->mutable_process_thread_data();
    sphProcessThreadData->set_cpu(CPU);
    sphProcessThreadData->set_dur(DUR);
    sphProcessThreadData->set_id(ID);
    sphProcessThreadData->set_tid(TID);
    sphProcessThreadData->set_state(STATE);
    sphProcessThreadData->set_pid(PID);
    sphProcessThreadData->set_start_time(START_TIME);
    sphProcessThreadData->set_arg_set_id(ARG_SET_ID);

    std::string sphStrMsg = "";
    batchSphProcessThreadData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessThreadDataResult;
    batchSphProcessThreadDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessThreadDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphProcessThreadDataResult.values(0).has_process_thread_data());
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().cpu(), CPU);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().id(), ID);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().tid(), TID);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().state(), STATE);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().pid(), PID);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().start_time(), START_TIME);
    EXPECT_EQ(batchSphProcessThreadDataResult.values(0).process_thread_data().arg_set_id(), ARG_SET_ID);
}

/**
 * @tc.name: ParseBatchSphDataWithSphProcessFuncData
 * @tc.desc: Parse a BatchSphData with SphProcessFuncData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphProcessFuncData, TestSize.Level1)
{
    TS_LOGI("test42-23");

    BatchSphData batchSphProcessFuncData;
    auto sphProcessFuncData = batchSphProcessFuncData.add_values()->mutable_process_func_data();
    sphProcessFuncData->set_start_ts(START_TS);
    sphProcessFuncData->set_dur(DUR);
    sphProcessFuncData->set_argsetid(ARGSETTID);
    sphProcessFuncData->set_depth(DEPTH);
    sphProcessFuncData->set_id(ID);
    sphProcessFuncData->set_itid(ITID);
    sphProcessFuncData->set_ipid(IPID);

    std::string sphStrMsg = "";
    batchSphProcessFuncData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessFuncDataRes;
    batchSphProcessFuncDataRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessFuncDataRes.values_size(), 1);
    EXPECT_TRUE(batchSphProcessFuncDataRes.values(0).has_process_func_data());
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().start_ts(), START_TS);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().argsetid(), ARGSETTID);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().depth(), DEPTH);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().id(), ID);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().itid(), ITID);
    EXPECT_EQ(batchSphProcessFuncDataRes.values(0).process_func_data().ipid(), IPID);
}

/**
 * @tc.name: ParseBatchSphDataWithSphHiperfData
 * @tc.desc: Parse a BatchSphData with SphHiperfData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphWithSphHiperfData, TestSize.Level1)
{
    TS_LOGI("test42-24");

    BatchSphData batchSphHiperfData;
    auto sphHiperfData = batchSphHiperfData.add_values()->mutable_hiperf_data();
    sphHiperfData->set_start_ns(START_NS);
    sphHiperfData->set_event_count(EVENT_COUNT);
    sphHiperfData->set_sample_count(SAMPLE_COUNT);
    sphHiperfData->set_event_type_id(EVENT_TYPE_ID);
    sphHiperfData->set_callchain_id(CALLCHAIN_ID);

    std::string sphStrMsg = "";
    batchSphHiperfData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphHiperfDataResult;
    batchSphHiperfDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphHiperfDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphHiperfDataResult.values(0).has_hiperf_data());
    EXPECT_EQ(batchSphHiperfDataResult.values(0).hiperf_data().start_ns(), START_NS);
    EXPECT_EQ(batchSphHiperfDataResult.values(0).hiperf_data().event_count(), EVENT_COUNT);
    EXPECT_EQ(batchSphHiperfDataResult.values(0).hiperf_data().sample_count(), SAMPLE_COUNT);
    EXPECT_EQ(batchSphHiperfDataResult.values(0).hiperf_data().event_type_id(), EVENT_TYPE_ID);
    EXPECT_EQ(batchSphHiperfDataResult.values(0).hiperf_data().callchain_id(), CALLCHAIN_ID);
}

/**
 * @tc.name: ParseBatchSphHiperfCallChartData
 * @tc.desc: Parse a BatchSphData with SphHiperfCallChartData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphHiperfCallChartData, TestSize.Level1)
{
    TS_LOGI("test42-25");

    BatchSphData batchSphHiperfCallChartData;
    auto sphHiperfCallChartData = batchSphHiperfCallChartData.add_values()->mutable_hiperf_call_chart_data();
    sphHiperfCallChartData->set_callchain_id(CALLCHAIN_ID);
    sphHiperfCallChartData->set_start_ts(START_TS);
    sphHiperfCallChartData->set_event_count(EVENT_COUNT);
    sphHiperfCallChartData->set_thread_id(THREAD_ID);
    sphHiperfCallChartData->set_cpu_id(CPU_ID);
    sphHiperfCallChartData->set_event_type_id(EVENT_TYPE_ID);

    std::string sphStrMsg = "";
    batchSphHiperfCallChartData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphHperfCallChartDataResult;
    batchSphHperfCallChartDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphHperfCallChartDataResult.values(0).has_hiperf_call_chart_data());
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().callchain_id(), CALLCHAIN_ID);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().start_ts(), START_TS);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().event_count(), EVENT_COUNT);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().thread_id(), THREAD_ID);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().cpu_id(), CPU_ID);
    EXPECT_EQ(batchSphHperfCallChartDataResult.values(0).hiperf_call_chart_data().event_type_id(), EVENT_TYPE_ID);
}

/**
 * @tc.name: ParseBatchSphHiperfCallStackData
 * @tc.desc: Parse a BatchSphData with SphHiperfCallStackData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphHiperfCallStackData, TestSize.Level1)
{
    TS_LOGI("test42-26");

    BatchSphData batchSphHiperfCallStackData;
    auto sphHiperfCallStackData = batchSphHiperfCallStackData.add_values()->mutable_hiperf_call_stack_data();
    sphHiperfCallStackData->set_callchain_id(CALLCHAIN_ID);
    sphHiperfCallStackData->set_file_id(FILE_ID);
    sphHiperfCallStackData->set_depth(DEPTH);
    sphHiperfCallStackData->set_symbol_id(SYMBOL_ID);

    std::string sphStrMsg = "";
    batchSphHiperfCallStackData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphHiperfCallStackDataResult;
    batchSphHiperfCallStackDataResult.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphHiperfCallStackDataResult.values_size(), 1);
    EXPECT_TRUE(batchSphHiperfCallStackDataResult.values(0).has_hiperf_call_stack_data());
    EXPECT_EQ(batchSphHiperfCallStackDataResult.values(0).hiperf_call_stack_data().callchain_id(), CALLCHAIN_ID);
    EXPECT_EQ(batchSphHiperfCallStackDataResult.values(0).hiperf_call_stack_data().file_id(), FILE_ID);
    EXPECT_EQ(batchSphHiperfCallStackDataResult.values(0).hiperf_call_stack_data().depth(), DEPTH);
    EXPECT_EQ(batchSphHiperfCallStackDataResult.values(0).hiperf_call_stack_data().symbol_id(), SYMBOL_ID);
}

/**
 * @tc.name: ParseBatchSphProcessJanksFramesData
 * @tc.desc: Parse a BatchSphData with SphProcessJanksFramesData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphProcessJanksFramesData, TestSize.Level1)
{
    TS_LOGI("test42-27");

    BatchSphData batchSphProcessJanksFramesData;
    auto sphProcessJanksFramesData = batchSphProcessJanksFramesData.add_values()->mutable_process_janks_frames_data();
    sphProcessJanksFramesData->set_ts(TS);
    sphProcessJanksFramesData->set_dur(DUR);
    sphProcessJanksFramesData->set_pid(PID);
    sphProcessJanksFramesData->set_id(ID);
    sphProcessJanksFramesData->set_name(INT_NAME);
    sphProcessJanksFramesData->set_type(INT_TYPE);

    std::string sphStrMsg = "";
    batchSphProcessJanksFramesData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessJanksFramesRes;
    batchSphProcessJanksFramesRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values_size(), 1);
    EXPECT_TRUE(batchSphProcessJanksFramesRes.values(0).has_process_janks_frames_data());
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().ts(), TS);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().pid(), PID);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().name(), INT_NAME);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().type(), INT_TYPE);
}

/**
 * @tc.name: ParseBatchSphProcessJanksFrames
 * @tc.desc: Parse a BatchSphData with SphProcessJanksFrames
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphProcessJanksFrames, TestSize.Level1)
{
    TS_LOGI("test42-28");

    BatchSphData batchSphProcessJanksFramesData;
    auto sphProcessJanksFramesData = batchSphProcessJanksFramesData.add_values()->mutable_process_janks_frames_data();
    sphProcessJanksFramesData->set_ts(TS);
    sphProcessJanksFramesData->set_dur(DUR);
    sphProcessJanksFramesData->set_pid(PID);
    sphProcessJanksFramesData->set_id(ID);
    sphProcessJanksFramesData->set_name(INT_NAME);
    sphProcessJanksFramesData->set_type(INT_TYPE);

    std::string sphStrMsg = "";
    batchSphProcessJanksFramesData.SerializeToString(&sphStrMsg);
    BatchSphData batchSphProcessJanksFramesRes;
    batchSphProcessJanksFramesRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values_size(), 1);
    EXPECT_TRUE(batchSphProcessJanksFramesRes.values(0).has_process_janks_frames_data());
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().ts(), TS);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().dur(), DUR);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().pid(), PID);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().id(), ID);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().name(), INT_NAME);
    EXPECT_EQ(batchSphProcessJanksFramesRes.values(0).process_janks_frames_data().type(), INT_TYPE);
}

/**
 * @tc.name: ParseBatchSphProcessInputEventData
 * @tc.desc: Parse a BatchSphData with SphProcessInputEventData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphProcessInputEventData, TestSize.Level1)
{
    TS_LOGI("test42-29");

    BatchSphData batchSphProcessInputEventData;
    auto sphProcessInputEventData = batchSphProcessInputEventData.add_values()->mutable_process_input_event_data();
    sphProcessInputEventData->set_start_ts(START_TS);
    sphProcessInputEventData->set_dur(DUR);
    sphProcessInputEventData->set_argsetid(ARGSETTID);
    sphProcessInputEventData->set_tid(TID);
    sphProcessInputEventData->set_pid(PID);
    sphProcessInputEventData->set_is_main_thread(IS_MAIN_THREAD);
    sphProcessInputEventData->set_track_id(TRACK_ID);
    sphProcessInputEventData->set_parent_id(PARENT_ID);
    sphProcessInputEventData->set_id(ID);
    sphProcessInputEventData->set_cookie(COOKIE);
    sphProcessInputEventData->set_depth(DEPTH);

    std::string sphStrMsg = "";
    batchSphProcessInputEventData.SerializeToString(&sphStrMsg);
    BatchSphData batchProcessInputEventFramesRes;
    batchProcessInputEventFramesRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchProcessInputEventFramesRes.values_size(), 1);
    EXPECT_TRUE(batchProcessInputEventFramesRes.values(0).has_process_input_event_data());
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().start_ts(), START_TS);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().dur(), DUR);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().argsetid(), ARGSETTID);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().tid(), TID);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().pid(), PID);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().is_main_thread(), IS_MAIN_THREAD);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().id(), ID);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().cookie(), COOKIE);
    EXPECT_EQ(batchProcessInputEventFramesRes.values(0).process_input_event_data().depth(), DEPTH);
}

/**
 * @tc.name: ParseBatchSphHeapFilesData
 * @tc.desc: Parse a BatchSphData with SphHeapFilesData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphHeapFilesData, TestSize.Level1)
{
    TS_LOGI("test42-30");

    BatchSphData batchSphHeapFilesData;
    auto sphHeapFilesData = batchSphHeapFilesData.add_values()->mutable_heap_files_data();
    sphHeapFilesData->set_id(ID);
    sphHeapFilesData->set_name(NAME);
    sphHeapFilesData->set_start_ts(START_TS);
    sphHeapFilesData->set_end_ts(END_TS);
    sphHeapFilesData->set_size(SIZE);
    sphHeapFilesData->set_pid(PID);

    std::string sphStrMsg = "";
    batchSphHeapFilesData.SerializeToString(&sphStrMsg);
    BatchSphData batchHeapFilesDataFramesRes;
    batchHeapFilesDataFramesRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values_size(), 1);
    EXPECT_TRUE(batchHeapFilesDataFramesRes.values(0).has_heap_files_data());
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().id(), ID);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().name(), NAME);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().start_ts(), START_TS);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().end_ts(), END_TS);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().size(), SIZE);
    EXPECT_EQ(batchHeapFilesDataFramesRes.values(0).heap_files_data().pid(), PID);
}

/**
 * @tc.name: ParseBatchSphCpuProfilerData
 * @tc.desc: Parse a BatchSphData with SphCpuProfilerData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphCpuProfilerData, TestSize.Level1)
{
    TS_LOGI("test42-31");

    BatchSphData batchSphCpuProfilerData;
    auto sphCpuProfilerData = batchSphCpuProfilerData.add_values()->mutable_cpu_profiler_data();
    sphCpuProfilerData->set_id(ID);
    sphCpuProfilerData->set_function_id(FUNCTION_ID);
    sphCpuProfilerData->set_start_time(START_TIME);
    sphCpuProfilerData->set_end_time(END_TIME);
    sphCpuProfilerData->set_dur(DUR);
    sphCpuProfilerData->set_name_id(INT_NAME_ID);
    sphCpuProfilerData->set_url_id(URL_ID);
    sphCpuProfilerData->set_line(LINE);
    sphCpuProfilerData->set_column(COLUMN);
    sphCpuProfilerData->set_hit_count(HIT_COUNT);
    sphCpuProfilerData->set_children_string(CHILDREN_STRING);
    sphCpuProfilerData->set_parent_id(PARENT_ID);

    std::string sphStrMsg = "";
    batchSphCpuProfilerData.SerializeToString(&sphStrMsg);
    BatchSphData batchCpuProfilerDataRes;
    batchCpuProfilerDataRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchCpuProfilerDataRes.values_size(), 1);
    EXPECT_TRUE(batchCpuProfilerDataRes.values(0).has_cpu_profiler_data());
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().id(), ID);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().function_id(), FUNCTION_ID);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().start_time(), START_TIME);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().end_time(), END_TIME);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().dur(), DUR);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().name_id(), INT_NAME_ID);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().url_id(), URL_ID);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().line(), LINE);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().column(), COLUMN);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().hit_count(), HIT_COUNT);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().children_string(), CHILDREN_STRING);
    EXPECT_EQ(batchCpuProfilerDataRes.values(0).cpu_profiler_data().parent_id(), PARENT_ID);
}

/**
 * @tc.name: ParseBatchSphNativeMemoryNormalData
 * @tc.desc: Parse a BatchSphData with SphNativeMemoryNormalData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphNativeMemoryNormalData, TestSize.Level1)
{
    TS_LOGI("test42-32");

    BatchSphData batchSphNativMemoryNormalData;
    auto sphNativMemoryNormalData = batchSphNativMemoryNormalData.add_values()->mutable_native_memory_normal();
    sphNativMemoryNormalData->set_start_time(START_TIME);
    sphNativMemoryNormalData->set_heap_size(HEAP_SIZE);
    sphNativMemoryNormalData->set_event_type(EVENT_TYPE);
    sphNativMemoryNormalData->set_ipid(IPID);

    std::string sphStrMsg = "";
    batchSphNativMemoryNormalData.SerializeToString(&sphStrMsg);
    BatchSphData batchNativMemoryNormalDataRes;
    batchNativMemoryNormalDataRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchNativMemoryNormalDataRes.values_size(), 1);
    EXPECT_TRUE(batchNativMemoryNormalDataRes.values(0).has_native_memory_normal());
    EXPECT_EQ(batchNativMemoryNormalDataRes.values(0).native_memory_normal().start_time(), START_TIME);
    EXPECT_EQ(batchNativMemoryNormalDataRes.values(0).native_memory_normal().heap_size(), HEAP_SIZE);
    EXPECT_EQ(batchNativMemoryNormalDataRes.values(0).native_memory_normal().event_type(), EVENT_TYPE);
    EXPECT_EQ(batchNativMemoryNormalDataRes.values(0).native_memory_normal().ipid(), IPID);
}

/**
 * @tc.name: ParseBatchSphNativeMemoryStatisticData
 * @tc.desc: Parse a BatchSphData with SphNativeMemoryStatisticData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphNativeMemoryStatisticData, TestSize.Level1)
{
    TS_LOGI("test42-33");

    BatchSphData batchSphNatMemStatisticData;
    auto sphNatMemStatisticData = batchSphNatMemStatisticData.add_values()->mutable_native_memory_statistic();
    sphNatMemStatisticData->set_callchain_id(CALLCHAIN_ID);
    sphNatMemStatisticData->set_start_ts(START_TS);
    sphNatMemStatisticData->set_apply_count(APPLY_COUNT);
    sphNatMemStatisticData->set_apply_size(APPLY_SIZE);
    sphNatMemStatisticData->set_release_count(RELEASE_COUNT);
    sphNatMemStatisticData->set_release_size(RELEASE_SIZE);
    sphNatMemStatisticData->set_ipid(IPID);
    sphNatMemStatisticData->set_type(INT_TYPE);

    std::string sphStrMsg = "";
    batchSphNatMemStatisticData.SerializeToString(&sphStrMsg);
    BatchSphData batchNatMemStatisticDataRes;
    batchNatMemStatisticDataRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchNatMemStatisticDataRes.values_size(), 1);
    EXPECT_TRUE(batchNatMemStatisticDataRes.values(0).has_native_memory_statistic());
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().callchain_id(), CALLCHAIN_ID);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().start_ts(), START_TS);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().apply_count(), APPLY_COUNT);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().apply_size(), APPLY_SIZE);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().release_count(), RELEASE_COUNT);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().release_size(), RELEASE_SIZE);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().ipid(), IPID);
    EXPECT_EQ(batchNatMemStatisticDataRes.values(0).native_memory_statistic().type(), INT_TYPE);
}

/**
 * @tc.name: ParseBatchSphCpuAbilityData
 * @tc.desc: Parse a BatchSphData with SphCpuAbilityData
 * @tc.type: FUNC
 */
HWTEST_F(SqllitePreparCacheDataTest, ParseBatchSphCpuAbilityData, TestSize.Level1)
{
    TS_LOGI("test42-34");

    BatchSphData batchSphCpuAbilityData;
    auto sphCpuAbilityData = batchSphCpuAbilityData.add_values()->mutable_cpu_ability_data();
    sphCpuAbilityData->set_value(SVALUE);
    sphCpuAbilityData->set_start_ns(START_NS);
    sphCpuAbilityData->set_dur(DUR);

    std::string sphStrMsg = "";
    batchSphCpuAbilityData.SerializeToString(&sphStrMsg);
    BatchSphData batchsphCpuAbilityDataRes;
    batchsphCpuAbilityDataRes.ParseFromString(sphStrMsg);
    EXPECT_EQ(batchsphCpuAbilityDataRes.values_size(), 1);
    EXPECT_TRUE(batchsphCpuAbilityDataRes.values(0).has_cpu_ability_data());
    EXPECT_EQ(batchsphCpuAbilityDataRes.values(0).cpu_ability_data().value(), SVALUE);
    EXPECT_EQ(batchsphCpuAbilityDataRes.values(0).cpu_ability_data().start_ns(), START_NS);
    EXPECT_EQ(batchsphCpuAbilityDataRes.values(0).cpu_ability_data().dur(), DUR);
}
} // namespace SqlitePreparCacheUnitTest
} // namespace TraceStreamer
} // namespace SysTuning
