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

#include "hilog_parser/pbreader_hilog_parser.h"
#include "hilog_plugin_result.pb.h"
#include "hilog_plugin_result.pbreader.h"
#include "parser/ptreader_parser/ptreader_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
const uint32_t PID = 2716;
const uint32_t TID = 1532;
const uint64_t LOG_ID = 1;
const uint32_t LOG_LEVEL_D = 68;
const uint64_t TV_SEC = 1632675525;
const uint64_t TV_NSEC = 996560700;
const std::string LOG_TAG = "HwMSDPMovementService";
const std::string LOG_CONTEXT = "handleGetSupportedModule";
const uint32_t PID_02 = 2532;
const uint32_t TID_02 = 1716;
const uint64_t LOG_ID_02 = 2;
const uint32_t LOG_LEVEL_E = 69;
const uint64_t TV_SEC_02 = 1632688888;
const uint64_t TV_NSEC_02 = 996588888;
const std::string LOG_TAG_02 = "ProfilerService";
const std::string LOG_CONTEXT_02 = "POST_RECV_MESSAGE method: /IProfilerService/CreateSession";

class HilogParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    void InitData(std::string &hilogData, bool isRepeatedData = false)
    {
        HilogInfo *hilogInfo = new HilogInfo();
        HilogDetails *hilogDetails = new HilogDetails();
        hilogDetails->set_tv_sec(TV_SEC);
        hilogDetails->set_tv_nsec(TV_NSEC);
        hilogDetails->set_pid(PID);
        hilogDetails->set_tid(TID);
        hilogDetails->set_level(LOG_LEVEL_D);
        hilogDetails->set_tag(LOG_TAG);

        auto hilogLine = hilogInfo->add_info();
        hilogLine->set_allocated_detail(hilogDetails);
        hilogLine->set_context(LOG_CONTEXT);
        hilogLine->set_id(LOG_ID);

        if (isRepeatedData) {
            HilogDetails *hilogDetailsSecond = new HilogDetails();
            hilogDetailsSecond->set_tv_sec(TV_SEC_02);
            hilogDetailsSecond->set_tv_nsec(TV_NSEC_02);
            hilogDetailsSecond->set_pid(PID_02);
            hilogDetailsSecond->set_tid(TID_02);
            hilogDetailsSecond->set_level(LOG_LEVEL_E);
            hilogDetailsSecond->set_tag(LOG_TAG_02);

            auto hilogLineSecond = hilogInfo->add_info();
            hilogLineSecond->set_allocated_detail(hilogDetailsSecond);
            hilogLineSecond->set_context(LOG_CONTEXT_02);
            hilogLineSecond->set_id(LOG_ID_02);
        }

        hilogInfo->SerializeToString(&hilogData);
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: ParseHilogInfoWithoutHilogLine
 * @tc.desc: Parse a HilogInfo that does not contain any hiloglines
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoWithoutHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-1");
    HilogInfo *hilogInfo = new HilogInfo();
    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hilogData = "";
    hilogInfo->SerializeToString(&hilogData);
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);
    auto size = stream_.traceDataCache_->GetConstHilogData().Size();
    EXPECT_FALSE(size);
}

/**
 * @tc.name: ParseHilogInfoWithOneHilogLine
 * @tc.desc: Parse a HilogInfo with only one Hilogline
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoWithOneHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-2");

    std::string hilogData = "";
    InitData(hilogData);
    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);

    auto constHilogData = stream_.traceDataCache_->GetConstHilogData();
    EXPECT_EQ(constHilogData.HilogLineSeqs()[0], LOG_ID);
    EXPECT_EQ(constHilogData.TimeStampData()[0], (TV_NSEC + TV_SEC * SEC_TO_NS));
    EXPECT_EQ(constHilogData.Pids()[0], PID);
    EXPECT_EQ(constHilogData.Tids()[0], TID);

    auto iter = htraceHiLogParser.logLevelString_.find(LOG_LEVEL_D);
    if (iter == htraceHiLogParser.logLevelString_.end()) {
        EXPECT_FALSE(0);
    }
    auto &dataDict = stream_.traceDataCache_->dataDict_;
    EXPECT_EQ(constHilogData.Levels()[0], dataDict.GetStringIndex(iter->second.c_str()));
    EXPECT_EQ(constHilogData.Tags()[0], dataDict.GetStringIndex(LOG_TAG));
    EXPECT_EQ(constHilogData.Contexts()[0], dataDict.GetStringIndex(LOG_CONTEXT));
    EXPECT_EQ(stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_RECEIVED), 1);
}

/**
 * @tc.name: ParseHilogInfoWithMultipleHilogLine
 * @tc.desc: Parse a HilogInfo with multiple Hiloglines
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoWithMultipleHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-3");

    std::string hilogData = "";
    InitData(hilogData, true);
    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);

    auto constHilogData = stream_.traceDataCache_->GetConstHilogData();
    EXPECT_EQ(constHilogData.HilogLineSeqs()[0], LOG_ID);
    EXPECT_EQ(constHilogData.HilogLineSeqs()[1], LOG_ID_02);
    EXPECT_EQ(constHilogData.TimeStampData()[0], (TV_NSEC + TV_SEC * SEC_TO_NS));
    EXPECT_EQ(constHilogData.TimeStampData()[1], (TV_NSEC_02 + TV_SEC_02 * SEC_TO_NS));
    EXPECT_EQ(constHilogData.Pids()[0], PID);
    EXPECT_EQ(constHilogData.Pids()[1], PID_02);
    EXPECT_EQ(constHilogData.Tids()[0], TID);
    EXPECT_EQ(constHilogData.Tids()[1], TID_02);

    auto iterFirst = htraceHiLogParser.logLevelString_.find(LOG_LEVEL_D);
    if (iterFirst == htraceHiLogParser.logLevelString_.end()) {
        EXPECT_FALSE(0);
    }
    auto &dataDict = stream_.traceDataCache_->dataDict_;
    EXPECT_EQ(constHilogData.Levels()[0], dataDict.GetStringIndex(iterFirst->second.c_str()));

    auto iterSecond = htraceHiLogParser.logLevelString_.find(LOG_LEVEL_E);
    if (iterSecond == htraceHiLogParser.logLevelString_.end()) {
        EXPECT_FALSE(0);
    }
    EXPECT_EQ(constHilogData.Levels()[1], dataDict.GetStringIndex(iterSecond->second.c_str()));

    EXPECT_EQ(constHilogData.Tags()[0], dataDict.GetStringIndex(LOG_TAG));
    EXPECT_EQ(constHilogData.Tags()[1], dataDict.GetStringIndex(LOG_TAG_02));
    EXPECT_EQ(constHilogData.Contexts()[0], dataDict.GetStringIndex(LOG_CONTEXT));
    EXPECT_EQ(constHilogData.Contexts()[1], dataDict.GetStringIndex(LOG_CONTEXT_02));
    EXPECT_EQ(stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_RECEIVED), 2);
}

/**
 * @tc.name: ParseHilogInfoWithErrLevelHilogLine
 * @tc.desc: Parse a HilogInfo with error level Hiloglines
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoWithErrLevelHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-4");

    HilogDetails *hilogDetails = new HilogDetails();
    hilogDetails->set_tv_sec(TV_SEC);
    hilogDetails->set_tv_nsec(TV_NSEC);
    hilogDetails->set_pid(PID);
    hilogDetails->set_tid(TID);
    hilogDetails->set_tag(LOG_TAG);

    HilogInfo *hilogInfo = new HilogInfo();
    auto hilogLine = hilogInfo->add_info();
    hilogLine->set_allocated_detail(hilogDetails);
    hilogLine->set_context(LOG_CONTEXT);
    hilogLine->set_id(LOG_ID);

    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hilogData = "";
    hilogInfo->SerializeToString(&hilogData);
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_DATA_INVALID);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseHilogInfoLostHilogLine
 * @tc.desc: Parse a HilogInfo that lost a Hiloglines
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoLostHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-5");

    HilogDetails *hilogDetails = new HilogDetails();
    hilogDetails->set_tv_sec(TV_SEC);
    hilogDetails->set_tv_nsec(TV_NSEC);
    hilogDetails->set_pid(PID);
    hilogDetails->set_tid(TID);
    hilogDetails->set_level(LOG_LEVEL_D);
    hilogDetails->set_tag(LOG_TAG);

    HilogInfo *hilogInfo = new HilogInfo();
    auto hilogLine = hilogInfo->add_info();
    hilogLine->set_allocated_detail(hilogDetails);
    hilogLine->set_context(LOG_CONTEXT);
    hilogLine->set_id(LOG_ID_02);

    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hilogData = "";
    hilogInfo->SerializeToString(&hilogData);
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(1 == eventCount);
    eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_DATA_LOST);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseHilogInfoHasDuplicateHilogLine
 * @tc.desc: Parse a HilogInfo has duplicate HilogLine
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseHilogInfoHasDuplicateHilogLine, TestSize.Level1)
{
    TS_LOGI("test8-6");

    HilogDetails *hilogDetails = new HilogDetails();
    hilogDetails->set_tv_sec(TV_SEC);
    hilogDetails->set_tv_nsec(TV_NSEC);
    hilogDetails->set_pid(PID);
    hilogDetails->set_tid(TID);
    hilogDetails->set_level(LOG_LEVEL_D);
    hilogDetails->set_tag(LOG_TAG);

    HilogInfo *hilogInfo = new HilogInfo();
    auto hilogLineFirst = hilogInfo->add_info();
    hilogLineFirst->set_allocated_detail(hilogDetails);
    hilogLineFirst->set_context(LOG_CONTEXT);
    hilogLineFirst->set_id(LOG_ID);
    auto hilogLineSecond = hilogInfo->add_info();
    hilogLineSecond->set_allocated_detail(hilogDetails);
    hilogLineSecond->set_context(LOG_CONTEXT);
    hilogLineSecond->set_id(LOG_ID);

    PbreaderHiLogParser htraceHiLogParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    std::string hilogData = "";
    hilogInfo->SerializeToString(&hilogData);
    ProtoReader::BytesView hilogInfoData(reinterpret_cast<const uint8_t *>(hilogData.data()), hilogData.size());
    bool issplit = false;
    htraceHiLogParser.Parse(hilogInfoData, issplit);

    auto eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_RECEIVED);
    EXPECT_TRUE(2 == eventCount);
    eventCount = stream_.traceDataCache_->GetConstStatAndInfo().GetValue(TRACE_HILOG, STAT_EVENT_NOTMATCH);
    EXPECT_TRUE(1 == eventCount);
}

/**
 * @tc.name: ParseTxtHilogInfo
 * @tc.desc: Parse a text format HilogInfo
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseTxtHilogInfo, TestSize.Level1)
{
    TS_LOGI("test8-7");
    constexpr size_t readSize = 1024;
    constexpr uint32_t lineLength = 256;
    char data[] = "08-07 11:04:45.947   523   640 E C04200/Root: <205>cannot find windowNode\n";

    std::unique_ptr<SysTuning::TraceStreamer::TraceStreamerSelector> ta =
        std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
    ta->EnableMetaTable(false);

    std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(readSize);
    memcpy_s(buf.get(), readSize, data, sizeof(data));

    EXPECT_TRUE(ta->ParseTraceDataSegment(std::move(buf), sizeof(data), 0, 1));
    ta->WaitForParserEnd();

    EXPECT_TRUE(ta->traceDataCache_->GetConstHilogData().HilogLineSeqs().size() == 1);
}

/**
 * @tc.name: ParseTxtHilogInfoWithTimeFormat
 * @tc.desc: Parse a text format HilogInfo with different time format
 * @tc.type: FUNC
 */
HWTEST_F(HilogParserTest, ParseTxtHilogInfoWithTimeFormat, TestSize.Level1)
{
    TS_LOGI("test8-7");
    constexpr size_t readSize = 1024;
    constexpr uint32_t lineLength = 256;
    char data[] =
        "08-07 11:04:45.947   523   640 E C04200/Root: <205>cannot find windowNode\n"
        "CST 08-05 17:41:00.039   955   955 I C03900/Ace: [list_layout_algorithm.cpp(Measure)-(0)] child size is "
        "empty\n"
        "CST 2017-08-05 17:41:19.409   840   926 I C01560/WifiDeviceServiceImpl: thread work normally\n"
        "1501926013.969  1585  1585 I C02d10/HiView-DOCDB: close ejdb success\n"
        "2337.006   601   894 E C01200/Ces: [access_token_helper.cpp:(RecordSensitivePermissionUsage):52] permission "
        "denied\n";

    std::unique_ptr<SysTuning::TraceStreamer::TraceStreamerSelector> ta =
        std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
    ta->EnableMetaTable(false);

    std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(readSize);
    memcpy_s(buf.get(), readSize, data, sizeof(data));

    EXPECT_TRUE(ta->ParseTraceDataSegment(std::move(buf), sizeof(data), 0, 1));
    ta->WaitForParserEnd();

    EXPECT_TRUE(ta->traceDataCache_->GetConstHilogData().HilogLineSeqs().size() == 5);
}

} // namespace TraceStreamer
} // namespace SysTuning