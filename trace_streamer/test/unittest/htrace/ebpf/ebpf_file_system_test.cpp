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

#include "ebpf_data_parser.h"
#include "ebpf_stdtype.h"
#include "process_filter.h"
#include "trace_streamer_selector.h"
#include "ts_common.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
using namespace SysTuning::EbpfStdtype;
namespace SysTuning {
namespace TraceStreamer {
const uint32_t PID_01 = 32;
const uint32_t TID_01 = 12;
const uint32_t PID_02 = 33;
const uint32_t TID_02 = 13;
const uint64_t START_TIME_01 = 1725645867369;
const uint64_t END_TIME_01 = 1725645967369;
const uint64_t START_TIME_02 = 1725645867369;
const uint64_t END_TIME_02 = 1725645967369;
const int32_t RET_01 = 8;
const int32_t RET_02 = -1;
const uint16_t IPS_NUM_00 = 0;
const uint16_t IPS_NUM_01 = 1;
const uint16_t IPS_NUM_02 = 2;
const uint64_t ARGS_01[ARGS_MAX] = {101, 102, 103, 104};
const uint64_t ARGS_02[ARGS_MAX] = {201, 202, 203, 204};
const char PROCESS_NAME_01[MAX_PROCESS_NAME_SZIE] = "process01";
const char PROCESS_NAME_02[MAX_PROCESS_NAME_SZIE] = "process02";
const uint64_t IPS_01[IPS_NUM_01] = {0x100000000};
const uint64_t IPS_02[IPS_NUM_02] = {0x100000000, 0x100000001};

class EbpfFileSystemTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
        parser_ = std::make_unique<EbpfDataParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

        EbpfDataHeader ebpfHeader;
        ebpfHeader.header.clock = EBPF_CLOCK_BOOTTIME;

        dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<uint8_t*>(&ebpfHeader),
                            reinterpret_cast<uint8_t*>(&ebpfHeader + 1));

        ebpfTypeAndLength_.length = sizeof(fsFixedHeader_);
        ebpfTypeAndLength_.type = ITEM_EVENT_FS;
    }

    void TearDown() {}

    void InitData(uint16_t nrUserIPs = IPS_NUM_00)
    {
        fsFixedHeader_.pid = PID_01;
        fsFixedHeader_.tid = TID_01;
        fsFixedHeader_.startTime = START_TIME_01;
        fsFixedHeader_.endTime = END_TIME_01;
        fsFixedHeader_.ret = RET_01;
        fsFixedHeader_.nrUserIPs = nrUserIPs;
        for (auto i = 0; i < ARGS_MAX; i++) {
            fsFixedHeader_.args[i] = ARGS_01[i];
        }
        strncpy_s(fsFixedHeader_.processName, MAX_PROCESS_NAME_SZIE, PROCESS_NAME_01, MAX_PROCESS_NAME_SZIE);
    }

    void ResetData()
    {
        fsFixedHeader_.pid = PID_02;
        fsFixedHeader_.tid = TID_02;
        fsFixedHeader_.startTime = START_TIME_02;
        fsFixedHeader_.endTime = END_TIME_02;
        fsFixedHeader_.ret = RET_02;
        fsFixedHeader_.nrUserIPs = IPS_NUM_00;
        for (auto i = 0; i < ARGS_MAX; i++) {
            fsFixedHeader_.args[i] = ARGS_02[i];
        }
        strncpy_s(fsFixedHeader_.processName, MAX_PROCESS_NAME_SZIE, PROCESS_NAME_02, MAX_PROCESS_NAME_SZIE);
    }

    void UpdateData()
    {
        dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<uint8_t*>(&ebpfTypeAndLength_),
                            reinterpret_cast<uint8_t*>(&ebpfTypeAndLength_ + 1));
        dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<uint8_t*>(&fsFixedHeader_),
                            reinterpret_cast<uint8_t*>(&fsFixedHeader_ + 1));
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
    FsFixedHeader fsFixedHeader_;
    EbpfTypeAndLength ebpfTypeAndLength_;
    std::deque<uint8_t> dequeBuffer_ = {};
    std::unique_ptr<EbpfDataParser> parser_ = nullptr;
};

/**
 * @tc.name: ParseFileSystemWithTypeOpen
 * @tc.desc: Test parse Ebpf data has one file system data with type open and no ips
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithTypeOpen, TestSize.Level1)
{
    TS_LOGI("test30-1");

    InitData();
    ebpfTypeAndLength_.length = sizeof(FsFixedHeader);
    fsFixedHeader_.type = SYS_OPENAT2;
    UpdateData();

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto fileSystemSample = stream_.traceDataCache_->GetConstFileSystemSample();
    EXPECT_EQ(fileSystemSample.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(fileSystemSample.Types()[0], OPEN);
    EXPECT_EQ(fileSystemSample.StartTs()[0], START_TIME_01);
    EXPECT_EQ(fileSystemSample.EndTs()[0], END_TIME_01);
    EXPECT_EQ(fileSystemSample.Durs()[0], END_TIME_01 - START_TIME_01);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(RET_01), fileSystemSample.ReturnValues()[0]);
    EXPECT_EQ(fileSystemSample.ErrorCodes()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Fds()[0], RET_01);
    EXPECT_EQ(fileSystemSample.FileIds()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Sizes()[0], MAX_SIZE_T);

    auto i = 0;
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.FirstArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.SecondArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.ThirdArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i]), fileSystemSample.FourthArguments()[0]);
}

/**
 * @tc.name: ParseFileSystemWithTypeClose
 * @tc.desc: Test parse Ebpf data has one file system data with type close and no ips and return value little to zero
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithTypeClose, TestSize.Level1)
{
    TS_LOGI("test30-2");

    ResetData();
    fsFixedHeader_.type = SYS_CLOSE;
    UpdateData();

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto fileSystemSample = stream_.traceDataCache_->GetConstFileSystemSample();
    EXPECT_EQ(fileSystemSample.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(fileSystemSample.Types()[0], CLOSE);
    EXPECT_EQ(fileSystemSample.StartTs()[0], START_TIME_02);
    EXPECT_EQ(fileSystemSample.EndTs()[0], END_TIME_02);
    EXPECT_EQ(fileSystemSample.Durs()[0], END_TIME_02 - START_TIME_02);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(0), fileSystemSample.ReturnValues()[0]);
    EXPECT_EQ(fileSystemSample.ErrorCodes()[0], parser_->ConvertToHexTextIndex(-RET_02));
    EXPECT_EQ(fileSystemSample.Fds()[0], ARGS_02[1]);
    EXPECT_EQ(fileSystemSample.FileIds()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Sizes()[0], MAX_SIZE_T);

    auto i = 0;
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.FirstArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.SecondArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.ThirdArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i]), fileSystemSample.FourthArguments()[0]);
}

/**
 * @tc.name: ParseFileSystemWithTypeRead
 * @tc.desc: Test parse Ebpf data has one file system data with type read and no ips
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithTypeRead, TestSize.Level1)
{
    TS_LOGI("test30-3");

    InitData();
    fsFixedHeader_.type = SYS_READ;
    UpdateData();

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto fileSystemSample = stream_.traceDataCache_->GetConstFileSystemSample();
    EXPECT_EQ(fileSystemSample.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(fileSystemSample.Types()[0], READ);
    EXPECT_EQ(fileSystemSample.StartTs()[0], START_TIME_01);
    EXPECT_EQ(fileSystemSample.EndTs()[0], END_TIME_01);
    EXPECT_EQ(fileSystemSample.Durs()[0], END_TIME_01 - START_TIME_01);
    EXPECT_EQ(fileSystemSample.ReturnValues()[0], parser_->ConvertToHexTextIndex(RET_01));
    EXPECT_EQ(fileSystemSample.ErrorCodes()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Fds()[0], ARGS_01[0]);
    EXPECT_EQ(fileSystemSample.FileIds()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Sizes()[0], RET_01);

    auto i = 0;
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.FirstArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.SecondArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i++]), fileSystemSample.ThirdArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_01[i]), fileSystemSample.FourthArguments()[0]);
}

/**
 * @tc.name: ParseFileSystemWithTypeWrite
 * @tc.desc: Test parse Ebpf data has one file system data with type read and no ips
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithTypeWrite, TestSize.Level1)
{
    TS_LOGI("test30-4");

    ResetData();
    fsFixedHeader_.type = SYS_WRITE;
    UpdateData();

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    auto fileSystemSample = stream_.traceDataCache_->GetConstFileSystemSample();
    EXPECT_EQ(fileSystemSample.CallChainIds()[0], INVALID_UINT32);
    EXPECT_EQ(fileSystemSample.Types()[0], WRITE);
    EXPECT_EQ(fileSystemSample.StartTs()[0], START_TIME_02);
    EXPECT_EQ(fileSystemSample.EndTs()[0], END_TIME_02);
    EXPECT_EQ(fileSystemSample.Durs()[0], END_TIME_02 - START_TIME_02);
    EXPECT_EQ(fileSystemSample.ReturnValues()[0], parser_->ConvertToHexTextIndex(0));
    EXPECT_EQ(fileSystemSample.ErrorCodes()[0], parser_->ConvertToHexTextIndex(-RET_02));
    EXPECT_EQ(fileSystemSample.Fds()[0], ARGS_02[0]);
    EXPECT_EQ(fileSystemSample.FileIds()[0], INVALID_UINT64);
    EXPECT_EQ(fileSystemSample.Sizes()[0], MAX_SIZE_T);

    auto i = 0;
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.FirstArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.SecondArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i++]), fileSystemSample.ThirdArguments()[0]);
    EXPECT_EQ(parser_->ConvertToHexTextIndex(ARGS_02[i]), fileSystemSample.FourthArguments()[0]);
}

/**
 * @tc.name: ParseFileSystemWithErrorType
 * @tc.desc: Test parse Ebpf data has one file system data with error type and no ips
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithErrorType, TestSize.Level1)
{
    TS_LOGI("test30-5");

    InitData();
    fsFixedHeader_.type = 0;
    UpdateData();

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    EXPECT_FALSE(stream_.traceDataCache_->GetConstFileSystemSample().Size());
}

/**
 * @tc.name: ParseFileSystemWithIPsButNoSymTable
 * @tc.desc: Test parse Ebpf data has one file system data with ips but no maps
 * @tc.type: FUNC
 */
HWTEST_F(EbpfFileSystemTest, ParseFileSystemWithIPsButNoMaps, TestSize.Level1)
{
    TS_LOGI("test30-6");

    InitData(IPS_NUM_02);
    fsFixedHeader_.type = SYS_OPENAT2;
    ebpfTypeAndLength_.length = sizeof(fsFixedHeader_) + IPS_NUM_02 * sizeof(uint64_t);
    UpdateData();
    dequeBuffer_.insert(dequeBuffer_.end(), reinterpret_cast<const uint8_t*>(IPS_02),
                        reinterpret_cast<const uint8_t*>(&IPS_02 + 1));

    EXPECT_TRUE(parser_->Init(dequeBuffer_, dequeBuffer_.size()));
    EXPECT_TRUE(parser_->reader_->GetFileSystemEventMap().size());
    parser_->ParseFileSystemEvent();
    parser_->Finish();
    EXPECT_TRUE(parser_->reader_->ebpfDataHeader_->header.clock == EBPF_CLOCK_BOOTTIME);
    EXPECT_EQ(stream_.traceDataCache_->GetConstFileSystemSample().CallChainIds()[0], 0);
    auto ebpfCallStackData = stream_.traceDataCache_->GetConstEbpfCallStackData();
    EXPECT_EQ(ebpfCallStackData.CallChainIds()[0], 0);
    EXPECT_EQ(ebpfCallStackData.CallChainIds()[1], 0);
    EXPECT_EQ(ebpfCallStackData.Depths()[0], 0);
    EXPECT_EQ(ebpfCallStackData.Depths()[1], 1);
    EXPECT_EQ(ebpfCallStackData.Ips()[0], parser_->ConvertToHexTextIndex(IPS_02[1]));
    EXPECT_EQ(ebpfCallStackData.Ips()[1], parser_->ConvertToHexTextIndex(IPS_02[0]));
    EXPECT_EQ(ebpfCallStackData.SymbolIds()[0], INVALID_UINT64);
    EXPECT_EQ(ebpfCallStackData.SymbolIds()[1], INVALID_UINT64);
    EXPECT_EQ(ebpfCallStackData.FilePathIds()[0], INVALID_UINT64);
    EXPECT_EQ(ebpfCallStackData.FilePathIds()[1], INVALID_UINT64);
}
} // namespace TraceStreamer
} // namespace SysTuning
