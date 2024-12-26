
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
#include "paged_memory_data_parser.h"
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
namespace PagedMemoryParserUnitTest {
const std::string COMMAND_LINE = "hiebpf --events ptrace --duration 50";
const uint64_t START_TIME = 1725645867369;
const uint64_t END_TIME = 1725645967369;
const uint64_t PAGEED_MEM_ADDR = 46549876;
const uint64_t IPS_01 = 548606407208;
const uint64_t IPS_02 = 548607407208;
const uint64_t EBPF_COMMAND_MAX_SIZE = 1000;
const uint64_t PID = 32;
const uint64_t TID = 32;
const uint16_t TYPE = 2;

class EbpfPagedMemoryParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();

        EbpfDataHeader ebpfHeader;
        ebpfHeader.header.clock = EBPF_CLOCK_BOOTTIME;
        ebpfHeader.header.cmdLineLen = COMMAND_LINE.length();
        memcpy_s(ebpfHeader.cmdline, EbpfDataHeader::EBPF_COMMAND_MAX_SIZE, COMMAND_LINE.c_str(),
                 COMMAND_LINE.length());
        dequeBuffer_.insert(dequeBuffer_.end(), &(reinterpret_cast<uint8_t *>(&ebpfHeader))[0],
                            &(reinterpret_cast<uint8_t *>(&ebpfHeader))[EbpfDataHeader::EBPF_DATA_HEADER_SIZE]);
    }
    void TearDown() {}

    void InitData(uint32_t length, uint16_t nips, uint64_t ts1 = START_TIME, uint64_t ts2 = END_TIME)
    {
        EbpfTypeAndLength ebpfTypeAndLength;
        ebpfTypeAndLength.length = length;
        ebpfTypeAndLength.type = ITEM_EVENT_VM;
        pagedMemoryFixedHeader_.pid = PID;
        pagedMemoryFixedHeader_.tid = TID;
        memcpy_s(pagedMemoryFixedHeader_.comm, MAX_PROCESS_NAME_SZIE, "process", MAX_PROCESS_NAME_SZIE);
        pagedMemoryFixedHeader_.startTime = ts1;
        pagedMemoryFixedHeader_.endTime = ts2;
        pagedMemoryFixedHeader_.addr = PAGEED_MEM_ADDR;
        pagedMemoryFixedHeader_.size = 1;
        pagedMemoryFixedHeader_.nips = nips;
        pagedMemoryFixedHeader_.type = TYPE;
        dequeBuffer_.insert(dequeBuffer_.end(), &(reinterpret_cast<uint8_t *>(&ebpfTypeAndLength))[0],
                            &(reinterpret_cast<uint8_t *>(&ebpfTypeAndLength))[sizeof(EbpfTypeAndLength)]);
        dequeBuffer_.insert(dequeBuffer_.end(), &(reinterpret_cast<uint8_t *>(&pagedMemoryFixedHeader_))[0],
                            &(reinterpret_cast<uint8_t *>(&pagedMemoryFixedHeader_))[sizeof(PagedMemoryFixedHeader)]);
    }

public:
    TraceStreamerSelector stream_ = {};
    std::deque<uint8_t> dequeBuffer_;
    PagedMemoryFixedHeader pagedMemoryFixedHeader_;
};

/**
 * @tc.name: EbpfPagedMemoryParserCorrectWithoutCallback
 * @tc.desc: Test parse PagedMem data without callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfPagedMemoryParserTest, EbpfPagedMemoryParserCorrectWithoutCallback, TestSize.Level1)
{
    TS_LOGI("test31-1");

    InitData(sizeof(PagedMemoryFixedHeader), 0);
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetPagedMemoryMap().size());
    ebpfDataParser->ParsePagedMemoryEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstPagedMemorySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    EXPECT_EQ(sampleData.Durs()[0], END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Sizes()[0], 1);
    EXPECT_EQ(sampleData.Addr()[0], ebpfDataParser->ConvertToHexTextIndex(pagedMemoryFixedHeader_.addr));
}

/**
 * @tc.name: EbpfPagedMemoryParserwrongWithoutCallback
 * @tc.desc: Test parse pagedMem data without callback and startTs > endTs
 * @tc.type: FUNC
 */
HWTEST_F(EbpfPagedMemoryParserTest, EbpfPagedMemoryParserwrongWithoutCallback, TestSize.Level1)
{
    TS_LOGI("test31-2");

    InitData(sizeof(PagedMemoryFixedHeader), 0, END_TIME, START_TIME);
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetPagedMemoryMap().size());
    ebpfDataParser->ParsePagedMemoryEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstPagedMemorySampleData();
    EXPECT_FALSE(sampleData.CallChainIds()[0] == INVALID_UINT32);
    EXPECT_FALSE(sampleData.Types()[0] == 2);
    auto startTs = sampleData.StartTs()[0];
    auto endTs = sampleData.EndTs()[0];
    EXPECT_FALSE(startTs == pagedMemoryFixedHeader_.startTime);
    EXPECT_FALSE(endTs == pagedMemoryFixedHeader_.endTime);
    EXPECT_FALSE(sampleData.Durs()[0] == endTs - startTs);
    EXPECT_FALSE(sampleData.Sizes()[0] == 1);
    EXPECT_FALSE(sampleData.Addr()[0] == ebpfDataParser->ConvertToHexTextIndex(pagedMemoryFixedHeader_.addr));
}

/**
 * @tc.name: EbpfPagedMemoryParserCorrectWithOneCallback
 * @tc.desc: Test parse PagedMem data with one callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfPagedMemoryParserTest, EbpfPagedMemoryParserCorrectWithOneCallback, TestSize.Level1)
{
    TS_LOGI("test31-3");

    InitData(sizeof(PagedMemoryFixedHeader), 1);
    const uint64_t ips[1] = {IPS_01};
    dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<const uint8_t *>(ips),
                        reinterpret_cast<const uint8_t *>(&ips + 1));
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetPagedMemoryMap().size());
    ebpfDataParser->ParsePagedMemoryEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstPagedMemorySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], 0);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    EXPECT_EQ(sampleData.Durs()[0], END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Sizes()[0], 1);
    EXPECT_EQ(sampleData.Addr()[0], ebpfDataParser->ConvertToHexTextIndex(pagedMemoryFixedHeader_.addr));
    EXPECT_EQ(stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[0],
              ebpfDataParser->ConvertToHexTextIndex(ips[0]));
}

/**
 * @tc.name: EbpfPagedMemoryParserCorrectWithMultipleCallback
 * @tc.desc: Test parse PagedMem data with Multiple callback
 * @tc.type: FUNC
 */
HWTEST_F(EbpfPagedMemoryParserTest, EbpfPagedMemoryParserCorrectWithMultipleCallback, TestSize.Level1)
{
    TS_LOGI("test31-4");

    InitData(sizeof(PagedMemoryFixedHeader) + 2 * sizeof(uint64_t), 2);
    const uint64_t ips[2] = {IPS_01, IPS_02};
    dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<const uint8_t *>(ips),
                        reinterpret_cast<const uint8_t *>(&ips + 1));
    std::unique_ptr<EbpfDataParser> ebpfDataParser =
        std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    EXPECT_TRUE(ebpfDataParser->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(ebpfDataParser->reader_->GetPagedMemoryMap().size());
    ebpfDataParser->ParsePagedMemoryEvent();
    ebpfDataParser->Finish();
    EXPECT_TRUE(ebpfDataParser->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto sampleData = stream_.traceDataCache_->GetConstPagedMemorySampleData();
    EXPECT_EQ(sampleData.CallChainIds()[0], 0);
    EXPECT_EQ(sampleData.Types()[0], 2);
    EXPECT_EQ(sampleData.StartTs()[0], START_TIME);
    EXPECT_EQ(sampleData.EndTs()[0], END_TIME);
    EXPECT_EQ(sampleData.Durs()[0], END_TIME - START_TIME);
    EXPECT_EQ(sampleData.Sizes()[0], 1);
    EXPECT_EQ(sampleData.Addr()[0], ebpfDataParser->ConvertToHexTextIndex(pagedMemoryFixedHeader_.addr));
    EXPECT_EQ(stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[1],
              ebpfDataParser->ConvertToHexTextIndex(ips[0]));
    EXPECT_EQ(stream_.traceDataCache_->GetConstEbpfCallStackData().Ips()[0],
              ebpfDataParser->ConvertToHexTextIndex(ips[1]));
}
} // namespace PagedMemoryParserUnitTest
} // namespace SysTuning::TraceStreamer
