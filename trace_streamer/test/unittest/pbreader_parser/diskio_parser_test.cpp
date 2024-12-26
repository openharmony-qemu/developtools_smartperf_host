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

#include "diskio_plugin_result.pb.h"
#include "diskio_plugin_result.pbreader.h"
#include "disk_io_parser/pbreader_disk_io_parser.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace DiskioParserUnitTest {
const uint64_t TS = 100;
const uint64_t RD_01 = 100;
const uint64_t WR_01 = 101;
const uint64_t RDPERSEC_01 = 102;
const uint64_t WRPERSEC_01 = 103;
const uint64_t RD_02 = 104;
const uint64_t WR_02 = 105;
const uint64_t RDPERSEC_02 = 106;
const uint64_t WRPERSEC_02 = 107;
const uint64_t RD_03 = 108;
const uint64_t WR_03 = 109;
const uint64_t RDPERSEC_03 = 110;
const uint64_t WRPERSEC_03 = 111;
const uint64_t RD_04 = 112;
const uint64_t WR_04 = 113;
const uint64_t RDPERSEC_04 = 114;
const uint64_t WRPERSEC_04 = 115;

struct DiskiodataInfo {
    uint64_t rd_kb;
    uint64_t wr_kb;
    uint64_t rd_per_sec;
    uint64_t wr_per_sec;
};

class PbreaderDiskioParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    std::string SetDiskioData(DiskiodataInfo &diskiodataInfo)
    {
        auto diskioInfo(std::make_unique<DiskioData>());
        StatsData *statsDataSecond = new StatsData();
        auto ioStatDataSecond = statsDataSecond->add_statsinfo();
        ioStatDataSecond->set_rd_kb(diskiodataInfo.rd_kb);
        ioStatDataSecond->set_wr_kb(diskiodataInfo.wr_kb);
        ioStatDataSecond->set_rd_per_sec(diskiodataInfo.rd_per_sec);
        ioStatDataSecond->set_wr_per_sec(diskiodataInfo.wr_per_sec);
        diskioInfo->set_allocated_statsdata(statsDataSecond);

        std::string diskioData = "";
        diskioInfo->SerializeToString(&diskioData);
        return diskioData;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParsePbreaderDiskioWithoutDiskioData
 * @tc.desc: Parse a diskio that does not contain any DiskioData
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderDiskioParserTest, ParsePbreaderDiskioWithoutDiskioData, TestSize.Level1)
{
    TS_LOGI("test13-1");
    auto diskioInfo = std::make_unique<DiskioData>();
    std::string diskioData = "";
    diskioInfo->SerializeToString(&diskioData);
    ProtoReader::BytesView diskioInfoData(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    PbreaderDiskIOParser pbreaderDiskioParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    pbreaderDiskioParser.Parse(diskioInfoData, TS);
    auto size = stream_.traceDataCache_->GetConstDiskIOData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParsePbreaderDiskioWithOneDiskioData
 * @tc.desc: Parse a diskio with one DiskioData
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderDiskioParserTest, ParsePbreaderDiskioWithOneDiskioData, TestSize.Level1)
{
    TS_LOGI("test13-2");

    DiskiodataInfo diskiodataInfo = {RD_01, WR_01, RDPERSEC_01, WRPERSEC_01};
    std::string diskioData = SetDiskioData(diskiodataInfo);
    ProtoReader::BytesView diskioInfoData(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    PbreaderDiskIOParser pbreaderDiskioParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    pbreaderDiskioParser.Parse(diskioInfoData, TS);
    pbreaderDiskioParser.Finish();
    auto size = stream_.traceDataCache_->GetConstDiskIOData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParsePbreaderDiskioWithTwoDiskioData
 * @tc.desc: Parse a diskio with two DiskioData
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderDiskioParserTest, ParsePbreaderDiskioWithTwoDiskioData, TestSize.Level1)
{
    TS_LOGI("test13-3");

    DiskiodataInfo diskiodataInfo = {RD_01, WR_01, RDPERSEC_01, WRPERSEC_01};
    std::string diskioData = SetDiskioData(diskiodataInfo);
    ProtoReader::BytesView diskioInfoData01(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());

    PbreaderDiskIOParser pbreaderDiskioParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    pbreaderDiskioParser.Parse(diskioInfoData01, TS);

    DiskiodataInfo diskiodataInfo02 = {RD_02, WR_02, RDPERSEC_02, WRPERSEC_02};
    diskioData = SetDiskioData(diskiodataInfo02);
    ProtoReader::BytesView diskioInfoData02(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData02, TS);
    pbreaderDiskioParser.Finish();

    auto diskIOData = stream_.traceDataCache_->GetConstDiskIOData();
    ASSERT_EQ(1, diskIOData.Size());
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[0], RDPERSEC_02);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[0], WRPERSEC_02);
    EXPECT_EQ(diskIOData.RdCountDatas()[0], RD_02);
    EXPECT_EQ(diskIOData.WrCountDatas()[0], WR_02);
}

/**
 * @tc.name: ParsePbreaderDiskioWithThreeDiskioData
 * @tc.desc: Parse a diskio with Three DiskioData
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderDiskioParserTest, ParsePbreaderDiskioWithThreeDiskioData, TestSize.Level1)
{
    TS_LOGI("test13-4");

    DiskiodataInfo diskiodataInfo = {RD_01, WR_01, RDPERSEC_01, WRPERSEC_01};
    std::string diskioData = SetDiskioData(diskiodataInfo);
    ProtoReader::BytesView diskioInfoData01(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());

    PbreaderDiskIOParser pbreaderDiskioParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    pbreaderDiskioParser.Parse(diskioInfoData01, TS);

    DiskiodataInfo diskiodataInfo02 = {RD_02, WR_02, RDPERSEC_02, WRPERSEC_02};
    diskioData = SetDiskioData(diskiodataInfo02);
    ProtoReader::BytesView diskioInfoData02(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData02, TS);

    DiskiodataInfo diskiodataInfo03 = {RD_03, WR_03, RDPERSEC_03, WRPERSEC_03};
    diskioData = SetDiskioData(diskiodataInfo03);
    ProtoReader::BytesView diskioInfoData03(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData03, TS);
    pbreaderDiskioParser.Finish();

    auto diskIOData = stream_.traceDataCache_->GetConstDiskIOData();
    ASSERT_EQ(2, diskIOData.Size());
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[0], RDPERSEC_02);
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[1], RDPERSEC_03);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[0], WRPERSEC_02);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[1], WRPERSEC_03);
    EXPECT_EQ(diskIOData.RdCountDatas()[0], RD_02);
    EXPECT_EQ(diskIOData.RdCountDatas()[1], RD_03);
    EXPECT_EQ(diskIOData.WrCountDatas()[0], WR_02);
    EXPECT_EQ(diskIOData.WrCountDatas()[1], WR_03);
}

/**
 * @tc.name: ParsePbreaderDiskioWithMultipleDiskioData
 * @tc.desc: Parse a diskio with Multiple DiskioData
 * @tc.type: FUNC
 */
HWTEST_F(PbreaderDiskioParserTest, ParsePbreaderDiskioWithMultipleDiskioData, TestSize.Level1)
{
    TS_LOGI("test13-5");

    DiskiodataInfo diskiodataInfo = {RD_01, WR_01, RDPERSEC_01, WRPERSEC_01};
    std::string diskioData = SetDiskioData(diskiodataInfo);
    ProtoReader::BytesView diskioInfoData01(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());

    PbreaderDiskIOParser pbreaderDiskioParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    pbreaderDiskioParser.Parse(diskioInfoData01, TS);

    DiskiodataInfo diskiodataInfo02 = {RD_02, WR_02, RDPERSEC_02, WRPERSEC_02};
    diskioData = SetDiskioData(diskiodataInfo02);
    ProtoReader::BytesView diskioInfoData02(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData02, TS);

    DiskiodataInfo diskiodataInfo03 = {RD_03, WR_03, RDPERSEC_03, WRPERSEC_03};
    diskioData = SetDiskioData(diskiodataInfo03);
    ProtoReader::BytesView diskioInfoData03(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData03, TS);

    DiskiodataInfo diskiodataInfo04 = {RD_04, WR_04, RDPERSEC_04, WRPERSEC_04};
    diskioData = SetDiskioData(diskiodataInfo04);
    ProtoReader::BytesView diskioInfoData04(reinterpret_cast<const uint8_t *>(diskioData.data()), diskioData.size());
    pbreaderDiskioParser.Parse(diskioInfoData04, TS);
    pbreaderDiskioParser.Finish();

    auto diskIOData = stream_.traceDataCache_->GetConstDiskIOData();
    ASSERT_EQ(3, diskIOData.Size());
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[0], RDPERSEC_02);
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[1], RDPERSEC_03);
    EXPECT_EQ(diskIOData.RdCountPerSecDatas()[2], RDPERSEC_04);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[0], WRPERSEC_02);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[1], WRPERSEC_03);
    EXPECT_EQ(diskIOData.WrCountPerSecDatas()[2], WRPERSEC_04);
    EXPECT_EQ(diskIOData.RdCountDatas()[0], RD_02);
    EXPECT_EQ(diskIOData.RdCountDatas()[1], RD_03);
    EXPECT_EQ(diskIOData.RdCountDatas()[2], RD_04);
    EXPECT_EQ(diskIOData.WrCountDatas()[0], WR_02);
    EXPECT_EQ(diskIOData.WrCountDatas()[1], WR_03);
    EXPECT_EQ(diskIOData.WrCountDatas()[2], WR_04);
}
} // namespace DiskioParserUnitTest
} // namespace TraceStreamer
} // namespace SysTuning