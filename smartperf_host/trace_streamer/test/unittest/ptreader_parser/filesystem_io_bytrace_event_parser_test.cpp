/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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
#include <unordered_map>

#define private public
#include "filesystem_io_filter.h"
#include "parser/ptreader_parser/bytrace_parser/bytrace_event_parser.h"
#include "filesystem_io_test_utils.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
class FileSystemIoBytraceEventParserTest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }
    void TearDown() override {}

protected:
    TraceStreamerSelector stream_ = {};
};

HWTEST_F(FileSystemIoBytraceEventParserTest, ParseHmfsEnterParams_DeviceMissingOrInvalid, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(100, 10, "hmfs_read_enter", "");

    {
        ArgsMap args = {{"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}, {"entry_name", "f"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "a,b"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_TRUE(parser.ParseHmfsEnterParams(args, line, params));
        EXPECT_EQ(params.mainDev, 8u);
        EXPECT_EQ(params.subDev, 1u);
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, ParseHmfsEnterParams_CommonFieldsAndOptionalEntryName, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(100, 10, "hmfs_read_enter", "");

    {
        ArgsMap args = {{"dev", "8,1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "x"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "bad"}};
        HmfsIoEnterEvent params{};
        EXPECT_FALSE(parser.ParseHmfsEnterParams(args, line, params));
    }

    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
        HmfsIoEnterEvent params{};
        EXPECT_TRUE(parser.ParseHmfsEnterParams(args, line, params));
        EXPECT_EQ(params.fileId, INVALID_DATAINDEX);
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"},       {"offset", "0"},
                        {"size", "4"},  {"i_size", "1024"}, {"entry_name", "hello.txt"}};
        HmfsIoEnterEvent params{};
        EXPECT_TRUE(parser.ParseHmfsEnterParams(args, line, params));
        EXPECT_NE(params.fileId, INVALID_DATAINDEX);
        EXPECT_EQ(stream_.traceDataCache_->GetDataFromDict(params.fileId), "hello.txt");
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, HmfsReadEnterExitEvent_ArgsCountAndParseFailBranches, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(100, 10, "hmfs_read_enter", "");

    {
        ArgsMap args{};
        EXPECT_FALSE(parser.HmfsReadEnterEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_READ_ENTER, STAT_EVENT_DATA_INVALID),
            1);
    }

    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "bad"}};
        EXPECT_FALSE(parser.HmfsReadEnterEvent(args, line));
        EXPECT_EQ(stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_READ_ENTER, STAT_EVENT_RECEIVED),
                  1);
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_READ_ENTER, STAT_EVENT_DATA_INVALID),
            2);
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, HmfsReadEnterExitEvent_SuccessCallsFilter, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    auto *fsIoFilter = stream_.streamFilters_->fileSystemIoFilter_.get();
    ASSERT_NE(fsIoFilter, nullptr);

    BytraceLine enterLine = MakeBytraceLine(100, 10, "hmfs_read_enter", "");
    ArgsMap enterArgs = {{"dev", "8,1"}, {"ino", "1"},       {"offset", "0"},
                         {"size", "4"},  {"i_size", "1024"}, {"entry_name", "f"}};
    EXPECT_TRUE(parser.HmfsReadEnterEvent(enterArgs, enterLine));
    EXPECT_EQ(fsIoFilter->pendingEnterEvents_.size(), 1u);
    EXPECT_FALSE(fsIoFilter->pendingEnterEvents_[0].isWrite);

    BytraceLine exitLine = MakeBytraceLine(200, 10, "hmfs_read_exit", "");
    ArgsMap exitArgs = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}, {"res", "4"}};
    EXPECT_TRUE(parser.HmfsReadExitEvent(exitArgs, exitLine));
    EXPECT_TRUE(fsIoFilter->pendingEnterEvents_.empty());
    EXPECT_EQ(stream_.traceDataCache_->GetConstFileSystemIoData().Size(), 1u);
}

HWTEST_F(FileSystemIoBytraceEventParserTest, ParseHmfsExitParams_ResMissingOrInvalid, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(200, 10, "hmfs_read_exit", "");

    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}};
        HmfsIoExitEvent params{};
        EXPECT_FALSE(parser.ParseHmfsExitParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}, {"res", "bad"}};
        HmfsIoExitEvent params{};
        EXPECT_FALSE(parser.ParseHmfsExitParams(args, line, params));
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}, {"res", "0"}};
        HmfsIoExitEvent params{};
        EXPECT_TRUE(parser.ParseHmfsExitParams(args, line, params));
        EXPECT_EQ(params.actualBytes, 0u);
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, HmfsWriteEnterExitEvent_ArgsCountAndParseFailBranches, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(100, 10, "hmfs_write_enter", "");

    {
        ArgsMap args{};
        EXPECT_FALSE(parser.HmfsWriteEnterEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_ENTER, STAT_EVENT_DATA_INVALID),
            1);
    }

    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "bad"}};
        EXPECT_FALSE(parser.HmfsWriteEnterEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_ENTER, STAT_EVENT_RECEIVED), 1);
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_ENTER, STAT_EVENT_DATA_INVALID),
            2);
    }

    BytraceLine exitLine = MakeBytraceLine(200, 10, "hmfs_write_exit", "");
    {
        ArgsMap args{};
        EXPECT_FALSE(parser.HmfsWriteExitEvent(args, exitLine));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_EXIT, STAT_EVENT_DATA_INVALID),
            1);
    }
    {
        ArgsMap args = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}, {"res", "bad"}};
        EXPECT_FALSE(parser.HmfsWriteExitEvent(args, exitLine));
        EXPECT_EQ(stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_EXIT, STAT_EVENT_RECEIVED),
                  1);
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_HMFS_WRITE_EXIT, STAT_EVENT_DATA_INVALID),
            2);
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, HmfsWriteEnterExitEvent_SuccessCallsFilterAndIsWriteTrue, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    auto *fsIoFilter = stream_.streamFilters_->fileSystemIoFilter_.get();
    ASSERT_NE(fsIoFilter, nullptr);

    BytraceLine enterLine = MakeBytraceLine(100, 10, "hmfs_write_enter", "");
    ArgsMap enterArgs = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "0"}, {"size", "4"}, {"i_size", "1024"}};
    EXPECT_TRUE(parser.HmfsWriteEnterEvent(enterArgs, enterLine));
    ASSERT_EQ(fsIoFilter->pendingEnterEvents_.size(), 1u);
    EXPECT_TRUE(fsIoFilter->pendingEnterEvents_[0].isWrite);

    BytraceLine exitLine = MakeBytraceLine(200, 10, "hmfs_write_exit", "");
    ArgsMap exitArgs = {{"dev", "8,1"}, {"ino", "1"}, {"offset", "4"}, {"size", "4"}, {"res", "4"}};
    EXPECT_TRUE(parser.HmfsWriteExitEvent(exitArgs, exitLine));
    EXPECT_TRUE(fsIoFilter->pendingEnterEvents_.empty());

    const auto &fsIo = stream_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_FALSE(fsIo.IsBlocksData()[0]);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
}

HWTEST_F(FileSystemIoBytraceEventParserTest,
         BlockRqIssueCompleteEvent_EmptyArgsStrAndParseFailBranches,
         TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());

    {
        BytraceLine line = MakeBytraceLine(100, 10, "block_rq_issue", "   ");
        ArgsMap args{};
        EXPECT_FALSE(parser.BlockRqIssueEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_BLOCK_RQ_ISSUE, STAT_EVENT_DATA_INVALID),
            1);
    }
    {
        BytraceLine line = MakeBytraceLine(100, 10, "block_rq_issue", "8  R  4 (cmd) 10 + 8 [x]");
        ArgsMap args{};
        EXPECT_FALSE(parser.BlockRqIssueEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_BLOCK_RQ_ISSUE, STAT_EVENT_DATA_INVALID),
            2);
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, ParseBlockIoHeaderFieldsAndTrailerFields_CoverBranches, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(100, 10, "block_rq_issue", "");

    {
        BlockIoIssueEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqIssueParams("8 R 4 (cmd) 10 + 8 [1]", line, params));
    }

    {
        BlockIoIssueEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqIssueParams("8,1", line, params));
    }

    {
        BlockIoIssueEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqIssueParams("8,1 R 4 cmd 10 + 8 [1]", line, params));
    }

    {
        BlockIoIssueEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqIssueParams("8,1 R 4 (cmd) bad + 8 [1]", line, params));
    }

    {
        BlockIoIssueEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqIssueParams("8,1 R 4 (cmd) 10 + bad [1]", line, params));
    }

    {
        BlockIoIssueEvent params{};
        EXPECT_TRUE(parser.ParseBlockRqIssueParams("8,1 R 4 () 10 + 8 [1]", line, params));
        EXPECT_FALSE(params.isWrite);
        EXPECT_TRUE(params.cmd.empty());
    }
    {
        BlockIoIssueEvent params{};
        EXPECT_TRUE(parser.ParseBlockRqIssueParams("8,1 W 4 (mycmd) 10 + 8 [1]", line, params));
        EXPECT_TRUE(params.isWrite);
        EXPECT_EQ(params.cmd, "mycmd");
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, BlockRqIssueCompleteEvent_SuccessCallsFilter, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    auto *fsIoFilter = stream_.streamFilters_->fileSystemIoFilter_.get();
    ASSERT_NE(fsIoFilter, nullptr);

    BytraceLine issueLine = MakeBytraceLine(100, 10, "block_rq_issue", "8,1 W 4 (cmd) 16 + 8 [1]");
    ArgsMap args{};
    EXPECT_TRUE(parser.BlockRqIssueEvent(args, issueLine));
    EXPECT_EQ(fsIoFilter->pendingBlockIssueEvents_.size(), 1u);

    BytraceLine completeLine = MakeBytraceLine(200, 10, "block_rq_complete", "8,1 W (cmd) 16 + 8 [1]");
    EXPECT_TRUE(parser.BlockRqCompleteEvent(args, completeLine));
    EXPECT_EQ(stream_.traceDataCache_->GetConstFileSystemIoData().Size(), 1u);
}

HWTEST_F(FileSystemIoBytraceEventParserTest, ParseBlockRqCompleteParams_CoverInvalidAndValidBranches, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    BytraceLine line = MakeBytraceLine(200, 10, "block_rq_complete", "");

    {
        BlockIoCompleteEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqCompleteParams("8,1 R cmd 16 + 8 [1]", line, params));
    }
    {
        BlockIoCompleteEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqCompleteParams("x,1 R (cmd) 16 + 8 [1]", line, params));
    }
    {
        BlockIoCompleteEvent params{};
        EXPECT_FALSE(parser.ParseBlockRqCompleteParams("8,1 R (cmd) bad + 8 [1]", line, params));
    }
    {
        BlockIoCompleteEvent params{};
        EXPECT_TRUE(parser.ParseBlockRqCompleteParams("8,1 W (  cmd2  ) 16 + 8 [1]", line, params));
        EXPECT_TRUE(params.isWrite);
        EXPECT_EQ(params.cmd, "cmd2");
    }
}

HWTEST_F(FileSystemIoBytraceEventParserTest, BlockRqCompleteEvent_EmptyArgsAndParseFail, TestSize.Level1)
{
    BytraceEventParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ArgsMap args{};
    {
        BytraceLine line = MakeBytraceLine(100, 10, "block_rq_complete", "   ");
        EXPECT_FALSE(parser.BlockRqCompleteEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_BLOCK_RQ_COMPLETE, STAT_EVENT_DATA_INVALID),
            1);
    }
    {
        BytraceLine line = MakeBytraceLine(100, 10, "block_rq_complete", "8  W  cmd  16 + 8 [1]");
        EXPECT_FALSE(parser.BlockRqCompleteEvent(args, line));
        EXPECT_EQ(
            stream_.traceDataCache_->GetStatAndInfo()->GetValue(TRACE_EVENT_BLOCK_RQ_COMPLETE, STAT_EVENT_DATA_INVALID),
            2);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
