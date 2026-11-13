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
#include "mem_parser/pbreader_mem_parser.h"
#include "memory_plugin_result.pb.h"
#include "memory_plugin_result.pbreader.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
std::string PERMISSION_01 = "r--p";
std::string PATH = "/system/bin/hiprofilerd";
const uint64_t VARTUAL_SIZE_01 = 128;
const uint64_t RSS_01 = 112;
const uint64_t PSS_01 = 112;
const double RESIDE_01 = 87.5;
std::string PERMISSION_02 = "r-xp";
const uint64_t VARTUAL_SIZE_02 = 280;
const uint64_t RSS_02 = 280;
const uint64_t PSS_02 = 280;
const double RESIDE_02 = 100;

class SmapsParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown()
    {
        if (access(dbPath_.c_str(), F_OK) == 0) {
            remove(dbPath_.c_str());
        }
    }

    void SetSmapinfo(ProcessMemoryInfo *memInfo, bool isRepeated = false)
    {
        SmapsInfo *smapsInfo = memInfo->add_smapinfo();
        smapsInfo->set_start_addr("5589523000");
        smapsInfo->set_end_addr("5589543000");
        smapsInfo->set_permission(PERMISSION_01);
        smapsInfo->set_path(PATH);
        smapsInfo->set_size(VARTUAL_SIZE_01);
        smapsInfo->set_rss(RSS_01);
        smapsInfo->set_pss(PSS_01);
        smapsInfo->set_reside(RESIDE_01);

        if (isRepeated) {
            SmapsInfo *smapsInfo1 = memInfo->add_smapinfo();
            smapsInfo1->set_start_addr("5589543000");
            smapsInfo1->set_end_addr("5589589000");
            smapsInfo1->set_permission(PERMISSION_02);
            smapsInfo1->set_path(PATH);
            smapsInfo1->set_size(VARTUAL_SIZE_02);
            smapsInfo1->set_rss(RSS_02);
            smapsInfo1->set_pss(PSS_02);
            smapsInfo1->set_reside(RESIDE_02);
        }
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
    const std::string dbPath_ = "out.db";
};
/**
 * @tc.name: ParseSmapsParse
 * @tc.desc: Parse SmapsData object and export database
 * @tc.type: FUNC
 */
HWTEST_F(SmapsParserTest, ParseSmapsParse, TestSize.Level1)
{
    TS_LOGI("test29-1");
    PbreaderMemParser SmapsEvent(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    MemoryData tracePacket;
    ProcessMemoryInfo *memInfo = tracePacket.add_processesinfo();
    SmapsInfo *smapsInfo = memInfo->add_smapinfo();
    EXPECT_TRUE(smapsInfo != nullptr);
    int32_t size = memInfo->smapinfo_size();
    EXPECT_TRUE(size == 1);
    uint64_t timeStamp = 1616439852302;
    BuiltinClocks clock = TS_CLOCK_BOOTTIME;

    std::string memStrMsg = "";
    tracePacket.SerializeToString(&memStrMsg);
    ProtoReader::BytesView memBytesView(reinterpret_cast<const uint8_t *>(memStrMsg.data()), memStrMsg.size());
    ProtoReader::MemoryData_Reader memData(memBytesView);
    SmapsEvent.ParseProcessInfo(&memData, timeStamp);
    SmapsEvent.Finish();
    stream_.traceDataCache_->ExportDatabase(dbPath_);

    EXPECT_TRUE(access(dbPath_.c_str(), F_OK) == 0);
    memInfo->clear_smapinfo();

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().Size() == 9);
    EXPECT_EQ(stream_.traceDataCache_->GetConstProcessData().size(), 1);
}
/**
 * @tc.name: ParseSmapsParseTestMeasureDataSize
 * @tc.desc: Parse SmapsData object and count StatInfo
 * @tc.type: FUNC
 */
HWTEST_F(SmapsParserTest, ParseSmapsParseTestMeasureDataSize, TestSize.Level1)
{
    TS_LOGI("test29-2");

    MemoryData tracePacket;
    ProcessMemoryInfo *memInfo = tracePacket.add_processesinfo();
    SetSmapinfo(memInfo);
    std::string memStrMsg = "";
    tracePacket.SerializeToString(&memStrMsg);
    ProtoReader::BytesView memBytesView(reinterpret_cast<const uint8_t *>(memStrMsg.data()), memStrMsg.size());
    ProtoReader::MemoryData_Reader memData(memBytesView);
    uint64_t timeStamp = 1616439852302;
    PbreaderMemParser SmapsEvent(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    SmapsEvent.ParseProcessInfo(&memData, timeStamp);
    SmapsEvent.Finish();
    stream_.traceDataCache_->ExportDatabase(dbPath_);

    EXPECT_TRUE(access(dbPath_.c_str(), F_OK) == 0);
    memInfo->clear_smapinfo();

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().Size() == 9);
    EXPECT_EQ(stream_.traceDataCache_->GetConstProcessData().size(), 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().StartAddrs()[0] == "0x5589523000");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().EndAddrs()[0] == "0x5589543000");
    uint64_t protection = stream_.traceDataCache_->GetDataIndex(PERMISSION_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().ProtectionIds()[0] == protection);
    uint64_t pat = stream_.traceDataCache_->GetDataIndex(PATH);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().PathIds()[0] == pat);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Sizes()[0] == VARTUAL_SIZE_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Rss()[0] == RSS_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Pss()[0] == PSS_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Resides()[0] == RESIDE_01);
    EXPECT_EQ(stream_.traceDataCache_->GetConstProcessData().size(), 1);
}
/**
 * @tc.name: ParseSmapsParseTestMutiMeasureData
 * @tc.desc: Parse muti SmapsData object and count StatInfo
 * @tc.type: FUNC
 */
HWTEST_F(SmapsParserTest, ParseSmapsParseTestMutiMeasureData, TestSize.Level1)
{
    TS_LOGI("test29-3");

    MemoryData tracePacket;
    ProcessMemoryInfo *memInfo = tracePacket.add_processesinfo();
    SetSmapinfo(memInfo, true);
    std::string memStrMsg = "";
    tracePacket.SerializeToString(&memStrMsg);
    ProtoReader::BytesView memBytesView(reinterpret_cast<const uint8_t *>(memStrMsg.data()), memStrMsg.size());
    ProtoReader::MemoryData_Reader memData(memBytesView);
    uint64_t timeStamp = 1616439852302;
    PbreaderMemParser SmapsEvent(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    SmapsEvent.ParseProcessInfo(&memData, timeStamp);
    SmapsEvent.Finish();
    stream_.traceDataCache_->ExportDatabase(dbPath_);

    EXPECT_TRUE(access(dbPath_.c_str(), F_OK) == 0);
    memInfo->clear_smapinfo();

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().StartAddrs()[0] == "0x5589523000");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().EndAddrs()[0] == "0x5589543000");
    uint64_t protection = stream_.traceDataCache_->GetDataIndex(PERMISSION_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().ProtectionIds()[0] == protection);
    uint64_t pathId = stream_.traceDataCache_->GetDataIndex(PATH);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().PathIds()[0] == pathId);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Sizes()[0] == VARTUAL_SIZE_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Rss()[0] == RSS_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Pss()[0] == PSS_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Resides()[0] == RESIDE_01);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().StartAddrs()[1] == "0x5589543000");
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().EndAddrs()[1] == "0x5589589000");
    protection = stream_.traceDataCache_->GetDataIndex(PERMISSION_02);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().ProtectionIds()[1] == protection);
    pathId = stream_.traceDataCache_->GetDataIndex(PATH);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().PathIds()[1] == pathId);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Sizes()[1] == VARTUAL_SIZE_02);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Rss()[1] == RSS_02);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Pss()[1] == PSS_02);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstSmapsData().Resides()[1] == RESIDE_02);
}
/**
 * @tc.name: ParseMutiEmptySmapsDataAndCountStatInfo
 * @tc.desc: Parse muti Empty SmapsData object and count StatInfo
 * @tc.type: FUNC
 */
HWTEST_F(SmapsParserTest, ParseMutiEmptySmapsDataAndCountStatInfo, TestSize.Level1)
{
    TS_LOGI("test29-4");
    PbreaderMemParser SmapsEvent(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    MemoryData tracePacket;
    ProcessMemoryInfo *memInfo = tracePacket.add_processesinfo();
    SmapsInfo *smapsInfo0 = memInfo->add_smapinfo();
    EXPECT_TRUE(smapsInfo0 != nullptr);
    int32_t size = memInfo->smapinfo_size();
    EXPECT_TRUE(size == 1);
    uint64_t timeStamp = 1616439852302;
    BuiltinClocks clock = TS_CLOCK_BOOTTIME;

    SmapsInfo *smapsInfo1 = memInfo->add_smapinfo();
    EXPECT_TRUE(smapsInfo1 != nullptr);
    size = memInfo->smapinfo_size();
    EXPECT_TRUE(size == 2);

    std::string memStrMsg = "";
    tracePacket.SerializeToString(&memStrMsg);
    ProtoReader::BytesView memBytesView(reinterpret_cast<const uint8_t *>(memStrMsg.data()), memStrMsg.size());
    ProtoReader::MemoryData_Reader memData(memBytesView);
    SmapsEvent.ParseProcessInfo(&memData, timeStamp);
    SmapsEvent.Finish();
    stream_.traceDataCache_->ExportDatabase(dbPath_);

    EXPECT_TRUE(access(dbPath_.c_str(), F_OK) == 0);
    memInfo->clear_smapinfo();

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    EXPECT_EQ(stream_.traceDataCache_->GetConstProcessData().size(), 1);
}
/**
 * @tc.name: ParseEmptySmapsData
 * @tc.desc: Parse Empty SmapsData
 * @tc.type: FUNC
 */
HWTEST_F(SmapsParserTest, ParseEmptySmapsData, TestSize.Level1)
{
    TS_LOGI("test29-5");
    PbreaderMemParser SmapsEvent(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    MemoryData tracePacket;
    int32_t size = tracePacket.processesinfo_size();
    EXPECT_TRUE(size == 0);
    uint64_t timeStamp = 1616439852302;
    BuiltinClocks clock = TS_CLOCK_BOOTTIME;

    std::string memStrMsg = "";
    tracePacket.SerializeToString(&memStrMsg);
    ProtoReader::BytesView memBytesView(reinterpret_cast<const uint8_t *>(memStrMsg.data()), memStrMsg.size());
    ProtoReader::MemoryData_Reader memData(memBytesView);
    SmapsEvent.ParseProcessInfo(&memData, timeStamp);
    SmapsEvent.Finish();
    stream_.traceDataCache_->ExportDatabase(dbPath_);

    EXPECT_TRUE(access(dbPath_.c_str(), F_OK) == 0);
    tracePacket.clear_processesinfo();

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    EXPECT_EQ(0, eventCount);
}
} // namespace TraceStreamer
} // namespace SysTuning
