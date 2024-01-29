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

#include "cpu_plugin_result.pb.h"
#include "cpu_plugin_result.pbreader.h"
#include "htrace_cpu_data_parser.h"
#include "parser/bytrace_parser/bytrace_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
const uint64_t TS = 104;
const uint64_t TOTALLOAD_01 = 4;
const uint64_t USERLOAD_01 = 44;
const uint64_t SYSTEMLOAD_01 = 34;
const uint64_t PROCESS_NUM_01 = 204;
const uint64_t TOTALLOAD_02 = 5;
const uint64_t USERLOAD_02 = 45;
const uint64_t SYSTEMLOAD_02 = 35;
const uint64_t PROCESS_NUM_02 = 205;
const uint64_t TOTALLOAD_03 = 6;
const uint64_t USERLOAD_03 = 46;
const uint64_t SYSTEMLOAD_03 = 36;
const uint64_t PROCESS_NUM_03 = 206;
const uint64_t TOTALLOAD_04 = 6;
const uint64_t USERLOAD_04 = 46;
const uint64_t SYSTEMLOAD_04 = 36;
const uint64_t PROCESS_NUM_04 = 206;

struct CpudataInfo {
    uint64_t total_load;
    uint64_t user_load;
    uint64_t sys_load;
    uint64_t process_num;
};

class HtraceCpuDataParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() const {}

    std::string SetCpuData(CpudataInfo& cpudataInfo, bool isSetUsageInfo)
    {
        auto cpuInfo(std::make_unique<CpuData>());
        cpuInfo->set_total_load(cpudataInfo.total_load);
        cpuInfo->set_user_load(cpudataInfo.user_load);
        cpuInfo->set_sys_load(cpudataInfo.sys_load);
        cpuInfo->set_process_num(cpudataInfo.process_num);
        if (isSetUsageInfo) {
            CpuUsageInfo* cpuUsageInfo = new CpuUsageInfo();
            cpuInfo->set_allocated_cpu_usage_info(cpuUsageInfo);
        }

        std::string cpuData = "";
        cpuInfo->SerializeToString(&cpuData);
        return cpuData;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseHtraceWithoutCpuDataData
 * @tc.desc: Parse a cpu that does not contain any cpudata
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDataParserTest, ParseHtraceWithoutCpuData, TestSize.Level1)
{
    TS_LOGI("test11-1");

    auto cpuInfo = std::make_unique<CpuData>();
    std::string cpuData = "";
    cpuInfo->SerializeToString(&cpuData);
    ProtoReader::BytesView cpuInfoData(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    HtraceCpuDataParser htraceCpuDataParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceCpuDataParser.Parse(cpuInfoData, TS);
    auto size = stream_.traceDataCache_->GetConstCpuUsageInfoData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceWithOneCpuData
 * @tc.desc: Parse a cpu with one cpudata
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDataParserTest, ParseHtraceWithOneCpuData, TestSize.Level1)
{
    TS_LOGI("test11-2");

    CpudataInfo cpudataInfo = {TOTALLOAD_01, USERLOAD_01, SYSTEMLOAD_01, PROCESS_NUM_01};
    std::string cpuData = SetCpuData(cpudataInfo, false);
    ProtoReader::BytesView cpuInfoData(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    HtraceCpuDataParser htraceCpuDataParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceCpuDataParser.Parse(cpuInfoData, TS);
    htraceCpuDataParser.Finish();
    auto size = stream_.traceDataCache_->GetConstCpuUsageInfoData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceWithTwoCpuData
 * @tc.desc: Parse a cpu with two cpudata
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDataParserTest, ParseHtraceWithTwoCpuData, TestSize.Level1)
{
    TS_LOGI("test11-3");

    CpudataInfo cpudataInfo01 = {TOTALLOAD_01, USERLOAD_01, SYSTEMLOAD_01, PROCESS_NUM_01};
    std::string cpuData = SetCpuData(cpudataInfo01, true);
    ProtoReader::BytesView cpuInfoData01(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    HtraceCpuDataParser htraceCpuDataParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceCpuDataParser.Parse(cpuInfoData01, TS);

    CpudataInfo cpudataInfo02 = {TOTALLOAD_02, USERLOAD_02, SYSTEMLOAD_02, PROCESS_NUM_02};
    cpuData = SetCpuData(cpudataInfo02, true);
    ProtoReader::BytesView cpuInfoData02(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData02, TS);
    htraceCpuDataParser.Finish();

    auto cpuUsageInfoData = stream_.traceDataCache_->GetConstCpuUsageInfoData();
    ASSERT_EQ(1, cpuUsageInfoData.Size());
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[0], TOTALLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[0], USERLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[0], SYSTEMLOAD_02);
}

/**
 * @tc.name: ParseHtraceWithThreeCpuData
 * @tc.desc: Parse a cpu with Three cpudata
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDataParserTest, ParseHtraceWithThreeCpuData, TestSize.Level1)
{
    TS_LOGI("test11-4");

    CpudataInfo cpudataInfo01 = {TOTALLOAD_01, USERLOAD_01, SYSTEMLOAD_01, PROCESS_NUM_01};
    std::string cpuData = SetCpuData(cpudataInfo01, true);
    ProtoReader::BytesView cpuInfoData01(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    HtraceCpuDataParser htraceCpuDataParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceCpuDataParser.Parse(cpuInfoData01, TS);

    CpudataInfo cpudataInfo02 = {TOTALLOAD_02, USERLOAD_02, SYSTEMLOAD_02, PROCESS_NUM_02};
    cpuData = SetCpuData(cpudataInfo02, true);
    ProtoReader::BytesView cpuInfoData02(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData02, TS);

    CpudataInfo cpudataInfo03 = {TOTALLOAD_03, USERLOAD_03, SYSTEMLOAD_03, PROCESS_NUM_03};
    cpuData = SetCpuData(cpudataInfo03, true);
    ProtoReader::BytesView cpuInfoData03(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData03, TS);
    htraceCpuDataParser.Finish();

    auto cpuUsageInfoData = stream_.traceDataCache_->GetConstCpuUsageInfoData();
    ASSERT_EQ(2, cpuUsageInfoData.Size());
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[0], TOTALLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[1], TOTALLOAD_03);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[0], USERLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[1], USERLOAD_03);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[0], SYSTEMLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[1], SYSTEMLOAD_03);
}

/**
 * @tc.name: ParseHtraceWithMultipleCpuData
 * @tc.desc: Parse a CpuData with Multiple CpuData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceCpuDataParserTest, ParseHtraceWithMultipleCpuData, TestSize.Level1)
{
    TS_LOGI("test11-5");

    CpudataInfo cpudataInfo01 = {TOTALLOAD_01, USERLOAD_01, SYSTEMLOAD_01, PROCESS_NUM_01};
    std::string cpuData = SetCpuData(cpudataInfo01, true);
    ProtoReader::BytesView cpuInfoData01(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    HtraceCpuDataParser htraceCpuDataParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceCpuDataParser.Parse(cpuInfoData01, TS);

    CpudataInfo cpudataInfo02 = {TOTALLOAD_02, USERLOAD_02, SYSTEMLOAD_02, PROCESS_NUM_02};
    cpuData = SetCpuData(cpudataInfo02, true);
    ProtoReader::BytesView cpuInfoData02(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData02, TS);

    CpudataInfo cpudataInfo03 = {TOTALLOAD_03, USERLOAD_03, SYSTEMLOAD_03, PROCESS_NUM_03};
    cpuData = SetCpuData(cpudataInfo03, true);
    ProtoReader::BytesView cpuInfoData03(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData03, TS);

    CpudataInfo cpudataInfo04 = {TOTALLOAD_04, USERLOAD_04, SYSTEMLOAD_04, PROCESS_NUM_04};
    cpuData = SetCpuData(cpudataInfo04, true);
    ProtoReader::BytesView cpuInfoData04(reinterpret_cast<const uint8_t*>(cpuData.data()), cpuData.size());
    htraceCpuDataParser.Parse(cpuInfoData04, TS);
    htraceCpuDataParser.Finish();

    auto cpuUsageInfoData = stream_.traceDataCache_->GetConstCpuUsageInfoData();
    ASSERT_EQ(3, cpuUsageInfoData.Size());
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[0], TOTALLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[1], TOTALLOAD_03);
    EXPECT_EQ(cpuUsageInfoData.TotalLoad()[2], TOTALLOAD_04);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[0], USERLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[1], USERLOAD_03);
    EXPECT_EQ(cpuUsageInfoData.UserLoad()[2], USERLOAD_04);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[0], SYSTEMLOAD_02);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[1], SYSTEMLOAD_03);
    EXPECT_EQ(cpuUsageInfoData.SystemLoad()[2], SYSTEMLOAD_04);
}
} // namespace TraceStreamer
} // namespace SysTuning
