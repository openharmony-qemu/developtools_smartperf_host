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

#include "htrace_network_parser.h"
#include "network_plugin_result.pb.h"
#include "network_plugin_result.pbreader.h"
#include "parser/bytrace_parser/bytrace_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
const uint64_t TS = 100;
const uint64_t DURS_01 = 1999632781;
const uint64_t TX_01 = 712921;
const uint64_t RX_01 = 13535011;
const uint64_t PACKETIN_01 = 11431;
const uint64_t PACKETOUT_01 = 7371;
const uint64_t DURS_02 = 1999632782;
const uint64_t TX_02 = 712922;
const uint64_t RX_02 = 13535012;
const uint64_t PACKETIN_02 = 11432;
const uint64_t PACKETOUT_02 = 7372;
const uint64_t DURS_03 = 1999632783;
const uint64_t TX_03 = 712923;
const uint64_t RX_03 = 13535013;
const uint64_t PACKETIN_03 = 11433;
const uint64_t PACKETOUT_03 = 7373;
const uint64_t DURS_04 = 1999632784;
const uint64_t TX_04 = 712924;
const uint64_t RX_04 = 13535014;
const uint64_t PACKETIN_04 = 11434;
const uint64_t PACKETOUT_04 = 7374;

class HtraceNetworkParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    std::string SetNetworkSystemData(uint64_t rx_bytes, uint64_t tx_bytes, uint64_t rx_packets, uint64_t tx_packets)
    {
        auto networkInfo = std::make_unique<NetworkDatas>();
        NetworkSystemData* networkSystemData = new NetworkSystemData();
        networkSystemData->set_rx_bytes(rx_bytes);
        networkSystemData->set_tx_bytes(tx_bytes);
        networkSystemData->set_rx_packets(rx_packets);
        networkSystemData->set_tx_packets(tx_packets);
        networkInfo->set_allocated_network_system_info(networkSystemData);

        std::string networkData = "";
        networkInfo->SerializeToString(&networkData);
        return networkData;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseHtraceNetworkWithoutNetworkData
 * @tc.desc: Parse a Process that does not contain any ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceNetworkParserTest, ParseHtraceNetworkWithoutNetworkData, TestSize.Level1)
{
    TS_LOGI("test17-1");
    auto networkInfo = std::make_unique<NetworkDatas>();
    std::string networkData = "";
    networkInfo->SerializeToString(&networkData);
    ProtoReader::BytesView networkInfoData(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    HtraceNetworkParser htraceNetworkParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNetworkParser.Parse(networkInfoData, TS);
    auto size = stream_.traceDataCache_->GetConstNetworkData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceNetworkWithNetworkData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceNetworkParserTest, ParseHtraceNetworkWithNetworkData, TestSize.Level1)
{
    TS_LOGI("test17-2");
    const uint64_t TX = 712924;
    const uint64_t RX = 13535014;
    const uint64_t PACKETIN = 11431;
    const uint64_t PACKETOUT = 7373;
    std::string networkData = SetNetworkSystemData(RX, TX, PACKETIN, PACKETOUT);
    ProtoReader::BytesView networkInfoData(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    HtraceNetworkParser htraceNetworkParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNetworkParser.Parse(networkInfoData, TS);
    htraceNetworkParser.Finish();
    auto size = stream_.traceDataCache_->GetConstNetworkData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHtraceNetworkWithTwoNetworkData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceNetworkParserTest, ParseHtraceNetworkWithTwoNetworkData, TestSize.Level1)
{
    TS_LOGI("test17-3");
    std::string networkData = SetNetworkSystemData(RX_01, TX_01, PACKETIN_01, PACKETOUT_01);
    ProtoReader::BytesView networkInfoData01(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    HtraceNetworkParser htraceNetworkParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNetworkParser.Parse(networkInfoData01, TS);

    networkData = SetNetworkSystemData(RX_02, TX_02, PACKETIN_02, PACKETOUT_02);
    ProtoReader::BytesView networkInfoData02(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    htraceNetworkParser.Parse(networkInfoData02, TS);
    htraceNetworkParser.Finish();

    auto netDetailData = stream_.traceDataCache_->GetConstNetworkData();
    EXPECT_EQ(netDetailData.TxDatas()[0], TX_02);
    EXPECT_EQ(netDetailData.RxDatas()[0], RX_02);
    EXPECT_EQ(netDetailData.PacketIn()[0], PACKETIN_02);
    EXPECT_EQ(netDetailData.PacketOut()[0], PACKETOUT_02);
}

/**
 * @tc.name: ParseHtraceNetworkWithThreeNetworkData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceNetworkParserTest, ParseHtraceNetworkWithThreeNetworkData, TestSize.Level1)
{
    TS_LOGI("test17-4");
    std::string networkData = SetNetworkSystemData(RX_01, TX_01, PACKETIN_01, PACKETOUT_01);
    ProtoReader::BytesView networkInfoData01(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    HtraceNetworkParser htraceNetworkParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNetworkParser.Parse(networkInfoData01, TS);

    networkData = SetNetworkSystemData(RX_02, TX_02, PACKETIN_02, PACKETOUT_02);
    ProtoReader::BytesView networkInfoData02(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());
    htraceNetworkParser.Parse(networkInfoData02, TS);

    networkData = SetNetworkSystemData(RX_03, TX_03, PACKETIN_03, PACKETOUT_03);
    ProtoReader::BytesView networkInfoData03(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());
    htraceNetworkParser.Parse(networkInfoData03, TS);
    htraceNetworkParser.Finish();

    auto netDetailData = stream_.traceDataCache_->GetConstNetworkData();
    EXPECT_EQ(netDetailData.TxDatas()[0], TX_02);
    EXPECT_EQ(netDetailData.TxDatas()[1], TX_03);
    EXPECT_EQ(netDetailData.RxDatas()[0], RX_02);
    EXPECT_EQ(netDetailData.RxDatas()[1], RX_03);
    EXPECT_EQ(netDetailData.PacketIn()[0], PACKETIN_02);
    EXPECT_EQ(netDetailData.PacketIn()[1], PACKETIN_03);
    EXPECT_EQ(netDetailData.PacketOut()[0], PACKETOUT_02);
    EXPECT_EQ(netDetailData.PacketOut()[1], PACKETOUT_03);
}

/**
 * @tc.name: ParseHtraceNetworkWithMultipleNetworkData
 * @tc.desc: Parse a Process with ProcessData
 * @tc.type: FUNC
 */
HWTEST_F(HtraceNetworkParserTest, ParseHtraceNetworkWithMultipleNetworkData, TestSize.Level1)
{
    TS_LOGI("test17-5");
    std::string networkData = SetNetworkSystemData(RX_01, TX_01, PACKETIN_01, PACKETOUT_01);
    ProtoReader::BytesView networkInfoData01(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());

    HtraceNetworkParser htraceNetworkParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    htraceNetworkParser.Parse(networkInfoData01, TS);

    networkData = SetNetworkSystemData(RX_02, TX_02, PACKETIN_02, PACKETOUT_02);
    ProtoReader::BytesView networkInfoData02(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());
    htraceNetworkParser.Parse(networkInfoData02, TS);

    networkData = SetNetworkSystemData(RX_03, TX_03, PACKETIN_03, PACKETOUT_03);
    ProtoReader::BytesView networkInfoData03(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());
    htraceNetworkParser.Parse(networkInfoData03, TS);

    networkData = SetNetworkSystemData(RX_04, TX_04, PACKETIN_04, PACKETOUT_04);
    ProtoReader::BytesView networkInfoData04(reinterpret_cast<const uint8_t*>(networkData.data()), networkData.size());
    htraceNetworkParser.Parse(networkInfoData04, TS);
    htraceNetworkParser.Finish();

    auto netDetailData = stream_.traceDataCache_->GetConstNetworkData();
    EXPECT_EQ(netDetailData.TxDatas()[0], TX_02);
    EXPECT_EQ(netDetailData.TxDatas()[1], TX_03);
    EXPECT_EQ(netDetailData.TxDatas()[2], TX_04);
    EXPECT_EQ(netDetailData.RxDatas()[0], RX_02);
    EXPECT_EQ(netDetailData.RxDatas()[1], RX_03);
    EXPECT_EQ(netDetailData.RxDatas()[2], RX_04);
    EXPECT_EQ(netDetailData.PacketIn()[0], PACKETIN_02);
    EXPECT_EQ(netDetailData.PacketIn()[1], PACKETIN_03);
    EXPECT_EQ(netDetailData.PacketIn()[2], PACKETIN_04);
    EXPECT_EQ(netDetailData.PacketOut()[0], PACKETOUT_02);
    EXPECT_EQ(netDetailData.PacketOut()[1], PACKETOUT_03);
    EXPECT_EQ(netDetailData.PacketOut()[2], PACKETOUT_04);
}
} // namespace TraceStreamer
} // namespace SysTuning