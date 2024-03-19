
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
#include "bio_latency_data_parser.h"
#include "cpu_filter.h"
#include "ebpf_data_parser.h"
#include "ebpf_stdtype.h"
#include "process_filter.h"
#include "trace_streamer_selector.h"
#include "ts_common.h"
using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
using namespace SysTuning::EbpfStdtype;
namespace SysTuning ::TraceStreamer {
const std::string COMMAND_LINE = "hiebpf --events ptrace --duration 50";
const uint64_t EPBF_ERROR_MAGIC = 0x12345678;
const uint32_t EPBF_ERROR_HEAD_SIZE = 0;
const char PROCESS_NAME_01[MAX_PROCESS_NAME_SZIE] = "process01";
const uint64_t START_TIME = 1725645867369;
const uint64_t END_TIME = 1725645967369;
const uint64_t BLKCNT = 7829248;
const uint64_t IPS_01 = 548606407208;
const uint64_t IPS_02 = 548607407208;
const uint64_t EBPF_COMMAND_MAX_SIZE = 1000;
const uint32_t DURPER4K = 4096;

class EbpfBioParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown()
    {
        dequeBuffer_.clear();
    }

    void InitData(uint32_t length, uint32_t nips, const uint64_t startTime, const uint64_t endTime, uint32_t prio = 0)
    {
        ebpfHeader_.header.clock = EBPF_CLOCK_BOOTTIME;
        ebpfHeader_.header.cmdLineLen = COMMAND_LINE.length();
        strcpy_s(ebpfHeader_.cmdline, EBPF_COMMAND_MAX_SIZE, COMMAND_LINE.c_str());
        ebpfTypeAndLength_.type = ITEM_EVENT_BIO;
        ebpfTypeAndLength_.length = length;
        bioFixedHeader_.pid = 32;
        bioFixedHeader_.tid = 32;
        memcpy_s(bioFixedHeader_.processName, MAX_PROCESS_NAME_SZIE, "process", MAX_PROCESS_NAME_SZIE);
        bioFixedHeader_.prio = 0;
        bioFixedHeader_.size = DURPER4K;
        bioFixedHeader_.blkcnt = BLKCNT;
        bioFixedHeader_.type = 2;
        bioFixedHeader_.nips = nips;
        bioFixedHeader_.startTime = startTime;
        bioFixedHeader_.endTime = endTime;

        dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<uint8_t*>(&ebpfHeader_),
                            reinterpret_cast<uint8_t*>(&ebpfHeader_ + 1));
        dequeBuffer_.insert(dequeBuffer_.end(), &(reinterpret_cast<uint8_t*>(&ebpfTypeAndLength_))[0],
                            &(reinterpret_cast<uint8_t*>(&ebpfTypeAndLength_))[sizeof(EbpfTypeAndLength)]);

        dequeBuffer_.insert(dequeBuffer_.end(), &(reinterpret_cast<uint8_t*>(&bioFixedHeader_))[0],
                            &(reinterpret_cast<uint8_t*>(&bioFixedHeader_))[sizeof(BIOFixedHeader)]);
    }

public:
    TraceStreamerSelector stream_ = {};
    EbpfDataHeader ebpfHeader_;
    EbpfTypeAndLength ebpfTypeAndLength_;
    BIOFixedHeader bioFixedHeader_;
    std::deque<uint8_t> dequeBuffer_;
};

/**
 * @tc.name: EbpfBioParserCorrectWithoutCallback
 * @tc.desc: Test parse BIO data without callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfBioParserTest, EbpfBioParserCorrectWithoutCallback, TestSize.Level1)
{
    TS_LOGI("test32-1");
    InitData(sizeof(BIOFixedHeader), 0, START_TIME, END_TIME);

    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetBIOSampleMap().size());
    ebpfDataParser->ParseBioLatencyEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstBioLatencySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    auto dur = sampleData.LatencyDurs()[0];
    EXPECT_EQ(dur, END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Tiers()[0], 0);
    auto size = sampleData.Sizes()[0];
    EXPECT_EQ(size, DURPER4K);
    EXPECT_EQ(sampleData.BlockNumbers()[0], ebpfDataParser->ConvertToHexTextIndex(BLKCNT));
    EXPECT_EQ(sampleData.DurPer4k()[0], dur / (size / DURPER4K));
}

/**
 * @tc.name: EbpfBioParserwrongWithoutCallback
 * @tc.desc: Test parse BIO data without callback and startTs > endTs
 * @tc.type: FUNC
 */
HWTEST_F(EbpfBioParserTest, EbpfBioParserwrongWithoutCallback, TestSize.Level1)
{
    TS_LOGI("test32-2");
    InitData(sizeof(BIOFixedHeader), 0, END_TIME, START_TIME, 1);

    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetBIOSampleMap().size());
    ebpfDataParser->ParseBioLatencyEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstBioLatencySampleData();
    EXPECT_NE(sampleData.CallChainIds()[0], INVALID_UINT64);
    EXPECT_NE(sampleData.Types()[0], 2);
    EXPECT_NE(sampleData.StartTs()[0], END_TIME);
    EXPECT_NE(sampleData.EndTs()[0], START_TIME);
    auto dur = sampleData.LatencyDurs()[0];
    EXPECT_NE(dur, START_TIME - END_TIME);
    EXPECT_NE(sampleData.Tiers()[0], 1);
    auto size = sampleData.Sizes()[0];
    EXPECT_NE(size, DURPER4K);
    EXPECT_NE(sampleData.BlockNumbers()[0], ebpfDataParser->ConvertToHexTextIndex(BLKCNT));
    if (size > 0) {
        EXPECT_NE(sampleData.DurPer4k()[0], dur / (size / DURPER4K));
    }
}

/**
 * @tc.name: EbpfBioParserCorrectWithOneCallback
 * @tc.desc: Test parse BIO data with one callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfBioParserTest, EbpfBioParserCorrectWithOneCallback, TestSize.Level1)
{
    TS_LOGI("test32-3");
    InitData(sizeof(BIOFixedHeader), 1, START_TIME, END_TIME);

    const uint64_t ips[1] = {IPS_01};
    dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<const uint8_t*>(ips),
                        reinterpret_cast<const uint8_t*>(&ips + 1));
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetBIOSampleMap().size());
    ebpfDataParser->ParseBioLatencyEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstBioLatencySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], 0);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.Ipids()[0], 1);
    EXPECT_EQ(sampleData.Itids()[0], 1);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    auto dur = sampleData.LatencyDurs()[0];
    EXPECT_EQ(dur, END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Tiers()[0], 0);
    auto size = sampleData.Sizes()[0];
    EXPECT_EQ(size, DURPER4K);
    EXPECT_EQ(sampleData.BlockNumbers()[0], ebpfDataParser->ConvertToHexTextIndex(BLKCNT));
    EXPECT_EQ(sampleData.DurPer4k()[0], dur / (size / DURPER4K));
    auto ExpectIps0 = ebpfDataParser->ConvertToHexTextIndex(ips[0]);
    auto ips0 = stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[0];
    EXPECT_EQ(ips0, ExpectIps0);
}

/**
 * @tc.name: EbpfBioParserCorrectWithMultipleCallback
 * @tc.desc: Test parse BIO data with multiple callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfBioParserTest, EbpfBioParserCorrectWithMultipleCallback, TestSize.Level1)
{
    TS_LOGI("test32-4");
    InitData(sizeof(BIOFixedHeader) + 2 * sizeof(uint64_t), 2, START_TIME, END_TIME);

    const uint64_t ips[2] = {IPS_01, IPS_02};
    dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<const uint8_t*>(ips),
                        reinterpret_cast<const uint8_t*>(&ips + 1));
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetBIOSampleMap().size());
    ebpfDataParser->ParseBioLatencyEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstBioLatencySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], 0);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.Ipids()[0], 1);
    EXPECT_EQ(sampleData.Itids()[0], 1);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    auto dur = sampleData.LatencyDurs()[0];
    EXPECT_EQ(dur, END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Tiers()[0], 0);
    auto size = sampleData.Sizes()[0];
    EXPECT_EQ(size, DURPER4K);
    EXPECT_EQ(sampleData.BlockNumbers()[0], ebpfDataParser->ConvertToHexTextIndex(BLKCNT));
    EXPECT_EQ(sampleData.DurPer4k()[0], dur / (size / DURPER4K));
    auto ExpectIps0 = ebpfDataParser->ConvertToHexTextIndex(ips[0]);
    auto ips0 = stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[1];
    EXPECT_EQ(ips0, ExpectIps0);
    auto ExpectIps1 = ebpfDataParser->ConvertToHexTextIndex(ips[1]);
    auto ips1 = stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[0];
    EXPECT_EQ(ips1, ExpectIps1);
}
} // namespace SysTuning::TraceStreamer
