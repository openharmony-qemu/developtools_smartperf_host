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

#include "process_parser/pbreader_process_parser.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "process_plugin_result.pb.h"
#include "process_plugin_result.pbreader.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace PbreaderProcessParserUnitTest {
uint64_t TS = 100;
const uint32_t PID_01 = 311;
const std::string NAME_01 = "resource_schedu01";
const int32_t PPID_01 = 21;
const int32_t UID_01 = 1;
const uint32_t PID_02 = 312;
const std::string NAME_02 = "resource_schedu02";
const int32_t PPID_02 = 22;
const int32_t UID_02 = 2;
const uint32_t PID_03 = 313;
const std::string NAME_03 = "resource_schedu03";
const int32_t PPID_03 = 23;
const int32_t UID_03 = 3;
const uint32_t PID_04 = 313;
const std::string NAME_04 = "resource_schedu03";
const int32_t PPID_04 = 23;
const int32_t UID_04 = 3;

class HtraceProcessParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    void SetProcessesinfo(ProcessData *processData, uint32_t pid, std::string name, uint32_t ppid, uint32_t uid)
    {
        ProcessInfo *processInfo = processData->add_processesinfo();
        processInfo->set_pid(pid);
        processInfo->set_name(name);
        processInfo->set_ppid(ppid);
        processInfo->set_uid(uid);
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseHtraceProcessWithoutProcessData
 * @tc.desc: Parse a Process that does not contain any ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceProcessParserTest, ParseHtraceProcessWithoutProcessData, TestSize.Level1)
{
    TS_LOGI("test18-1");
    auto processData = std::make_unique<ProcessData>();
    std::string processStrMsg = "";
    processData->SerializeToString(&processStrMsg);
    ProtoReader::BytesView processBytesView(reinterpret_cast<const uint8_t *>(processStrMsg.data()),
                                            processStrMsg.size());
    PbreaderProcessParser htraceProcessParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceProcessParser.Parse(processBytesView, TS);
    auto size = stream_.traceDataCache_->GetConstLiveProcessData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceProcessWithProcessData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceProcessParserTest, ParseHtraceProcessWithProcessData, TestSize.Level1)
{
    TS_LOGI("test18-2");
    const uint32_t pid = 312;
    const string name = "resource_schedu";
    const int32_t ppid = 22;
    const int32_t uid = 23;
    auto processData = std::make_unique<ProcessData>();
    SetProcessesinfo(processData.get(), pid, name, ppid, uid);
    std::string processStrMsg = "";
    processData->SerializeToString(&processStrMsg);
    ProtoReader::BytesView processBytesView(reinterpret_cast<const uint8_t *>(processStrMsg.data()),
                                            processStrMsg.size());
    PbreaderProcessParser htraceProcessParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceProcessParser.Parse(processBytesView, TS);
    htraceProcessParser.Finish();

    auto size = stream_.traceDataCache_->GetConstLiveProcessData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceProcessWithTwoProcessData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceProcessParserTest, ParseHtraceProcessWithTwoProcessData, TestSize.Level1)
{
    TS_LOGI("test18-3");
    auto processData = std::make_unique<ProcessData>();
    SetProcessesinfo(processData.get(), PID_01, NAME_01, PPID_01, UID_01);
    SetProcessesinfo(processData.get(), PID_02, NAME_02, PPID_02, UID_02);
    std::string processStrMsg = "";
    processData->SerializeToString(&processStrMsg);
    ProtoReader::BytesView processBytesView(reinterpret_cast<const uint8_t *>(processStrMsg.data()),
                                            processStrMsg.size());
    PbreaderProcessParser htraceProcessParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceProcessParser.Parse(processBytesView, TS);
    htraceProcessParser.Finish();

    auto liveProcessData = stream_.traceDataCache_->GetConstLiveProcessData();
    ASSERT_EQ(1, liveProcessData.Size());
    EXPECT_EQ(liveProcessData.ProcessID()[0], PID_02);
    EXPECT_EQ(liveProcessData.ProcessName()[0], NAME_02);
    EXPECT_EQ(liveProcessData.ParentProcessID()[0], PPID_02);
    EXPECT_EQ(liveProcessData.Uid()[0], UID_02);
    EXPECT_EQ(liveProcessData.UserName()[0], std::to_string(UID_02));
}

/**
 * @tc.name: ParseHtraceProcessWithThreeProcessData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceProcessParserTest, ParseHtraceProcessWithThreeProcessData, TestSize.Level1)
{
    TS_LOGI("test18-4");

    auto processData = std::make_unique<ProcessData>();
    SetProcessesinfo(processData.get(), PID_01, NAME_01, PPID_01, UID_01);
    SetProcessesinfo(processData.get(), PID_02, NAME_02, PPID_02, UID_02);
    SetProcessesinfo(processData.get(), PID_03, NAME_03, PPID_03, UID_03);
    std::string processStrMsg = "";
    processData->SerializeToString(&processStrMsg);
    ProtoReader::BytesView processBytesView(reinterpret_cast<const uint8_t *>(processStrMsg.data()),
                                            processStrMsg.size());
    PbreaderProcessParser htraceProcessParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceProcessParser.Parse(processBytesView, TS);
    htraceProcessParser.Finish();

    auto liveProcessData = stream_.traceDataCache_->GetConstLiveProcessData();
    ASSERT_EQ(2, liveProcessData.Size());
    EXPECT_EQ(liveProcessData.ProcessID()[0], PID_02);
    EXPECT_EQ(liveProcessData.ProcessID()[1], PID_03);
    EXPECT_EQ(liveProcessData.ProcessName()[0], NAME_02);
    EXPECT_EQ(liveProcessData.ProcessName()[1], NAME_03);
    EXPECT_EQ(liveProcessData.ParentProcessID()[0], PPID_02);
    EXPECT_EQ(liveProcessData.ParentProcessID()[1], PPID_03);
    EXPECT_EQ(liveProcessData.Uid()[0], UID_02);
    EXPECT_EQ(liveProcessData.Uid()[1], UID_03);
    EXPECT_EQ(liveProcessData.UserName()[0], std::to_string(UID_02));
    EXPECT_EQ(liveProcessData.UserName()[1], std::to_string(UID_03));
}

/**
 * @tc.name: ParseHtraceProcessWithMultipleProcessData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceProcessParserTest, ParseHtraceProcessWithMultipleProcessData, TestSize.Level1)
{
    TS_LOGI("test18-5");
    auto processData = std::make_unique<ProcessData>();
    SetProcessesinfo(processData.get(), PID_01, NAME_01, PPID_01, UID_01);
    SetProcessesinfo(processData.get(), PID_02, NAME_02, PPID_02, UID_02);
    SetProcessesinfo(processData.get(), PID_03, NAME_03, PPID_03, UID_03);
    SetProcessesinfo(processData.get(), PID_04, NAME_04, PPID_04, UID_04);
    std::string processStrMsg = "";
    processData->SerializeToString(&processStrMsg);
    ProtoReader::BytesView processBytesView(reinterpret_cast<const uint8_t *>(processStrMsg.data()),
                                            processStrMsg.size());
    PbreaderProcessParser htraceProcessParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceProcessParser.Parse(processBytesView, TS);
    htraceProcessParser.Finish();

    auto liveProcessData = stream_.traceDataCache_->GetConstLiveProcessData();
    ASSERT_EQ(3, liveProcessData.Size());
    EXPECT_EQ(liveProcessData.ProcessID()[0], PID_02);
    EXPECT_EQ(liveProcessData.ProcessID()[1], PID_03);
    EXPECT_EQ(liveProcessData.ProcessID()[2], PID_04);
    EXPECT_EQ(liveProcessData.ProcessName()[0], NAME_02);
    EXPECT_EQ(liveProcessData.ProcessName()[1], NAME_03);
    EXPECT_EQ(liveProcessData.ProcessName()[2], NAME_04);
    EXPECT_EQ(liveProcessData.ParentProcessID()[0], PPID_02);
    EXPECT_EQ(liveProcessData.ParentProcessID()[1], PPID_03);
    EXPECT_EQ(liveProcessData.ParentProcessID()[2], PPID_04);
    EXPECT_EQ(liveProcessData.Uid()[0], UID_02);
    EXPECT_EQ(liveProcessData.Uid()[1], UID_03);
    EXPECT_EQ(liveProcessData.Uid()[2], UID_04);
    EXPECT_EQ(liveProcessData.UserName()[0], std::to_string(UID_02));
    EXPECT_EQ(liveProcessData.UserName()[1], std::to_string(UID_03));
    EXPECT_EQ(liveProcessData.UserName()[2], std::to_string(UID_04));
}
} // namespace PbreaderProcessParserUnitTest
} // namespace TraceStreamer
} // namespace SysTuning