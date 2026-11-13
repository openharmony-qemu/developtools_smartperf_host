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

#define private public
#include "cpu_detail_parser.h"
#include "filesystem_io_filter.h"
#include "filesystem_io_test_utils.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
class FileSystemIoCpuDetailParserTest : public ::testing::Test {
public:
    void SetUp() override
    {
        selector_.InitFilter();
        selector_.EnableMetaTable(false);
        parser_ = std::make_unique<CpuDetailParser>(selector_.traceDataCache_.get(), selector_.streamFilters_.get());
    }
    void TearDown() override {}

protected:
    TraceStreamerSelector selector_{};
    std::unique_ptr<CpuDetailParser> parser_{};
};

HWTEST_F(FileSystemIoCpuDetailParserTest, ParseDev_SplitsMajorMinor, TestSize.Level1)
{
    uint32_t mainDev = 0;
    uint32_t subDev = 0;
    parser_->ParseDev(MakeDev(8, 1), mainDev, subDev);
    EXPECT_EQ(mainDev, 8u);
    EXPECT_EQ(subDev, 1u);

    parser_->ParseDev(MakeDev(0, 0xfffff), mainDev, subDev);
    EXPECT_EQ(mainDev, 0u);
    EXPECT_EQ(subDev, 0xfffffu);
}

HWTEST_F(FileSystemIoCpuDetailParserTest, BlockRqIssueComplete_IsWriteAndCmdBranches, TestSize.Level1)
{
    parser_->eventTid_ = 1234;
    auto *fsIoFilter = selector_.streamFilters_->fileSystemIoFilter_.get();
    ASSERT_NE(fsIoFilter, nullptr);

    RawTraceEventInfo issueEvent{};
    issueEvent.msgPtr = std::make_unique<FtraceEvent>();
    issueEvent.msgPtr->set_timestamp(100);
    auto *issue = issueEvent.msgPtr->mutable_block_rq_issue_format();
    issue->set_dev(MakeDev(8, 1));
    issue->set_sector(16);
    issue->set_nr_sector(8);
    issue->set_bytes(4096);
    issue->set_rwbs("W");
    issue->set_cmd("");

    EXPECT_TRUE(parser_->BlockRqIssueEvent(issueEvent));
    EXPECT_EQ(fsIoFilter->pendingBlockIssueEvents_.size(), 1u);

    RawTraceEventInfo completeEvent{};
    completeEvent.msgPtr = std::make_unique<FtraceEvent>();
    completeEvent.msgPtr->set_timestamp(200);
    auto *complete = completeEvent.msgPtr->mutable_block_rq_complete_format();
    complete->set_dev(MakeDev(8, 1));
    complete->set_sector(16);
    complete->set_nr_sector(8);
    complete->set_rwbs("W");
    complete->set_cmd("cmd_from_complete");

    EXPECT_TRUE(parser_->BlockRqCompleteEvent(completeEvent));

    const auto &fsIo = selector_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_TRUE(fsIo.IsBlocksData()[0]);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
    EXPECT_EQ(fsIo.MainDevsData()[0], 8u);
    EXPECT_EQ(fsIo.SubDevsData()[0], 1u);
    EXPECT_EQ(fsIo.SectorsData()[0], 16u);
    EXPECT_EQ(fsIo.NrSectorsData()[0], 8u);
    EXPECT_NE(fsIo.CmdIdsData()[0], INVALID_DATAINDEX);
    EXPECT_EQ(selector_.traceDataCache_->GetDataFromDict(fsIo.CmdIdsData()[0]), "cmd_from_complete");
}

HWTEST_F(FileSystemIoCpuDetailParserTest, HmfsEnterExit_EntryNameAndValidResCreatesRow, TestSize.Level1)
{
    parser_->eventTid_ = 1234;

    RawTraceEventInfo enterEvent{};
    enterEvent.msgPtr = std::make_unique<FtraceEvent>();
    enterEvent.msgPtr->set_timestamp(100);
    auto *enter = enterEvent.msgPtr->mutable_hmfs_read_enter_format();
    enter->set_dev(MakeDev(8, 1));
    enter->set_ino(1);
    enter->set_off(0);
    enter->set_size(4);
    enter->set_i_size(1024);
    enter->set_name("hello.txt");

    EXPECT_TRUE(parser_->HmfsReadEnterEvent(enterEvent));
    EXPECT_EQ(selector_.streamFilters_->fileSystemIoFilter_->pendingEnterEvents_.size(), 1u);

    RawTraceEventInfo exitEvent{};
    exitEvent.msgPtr = std::make_unique<FtraceEvent>();
    exitEvent.msgPtr->set_timestamp(200);
    auto *exit = exitEvent.msgPtr->mutable_hmfs_read_exit_format();
    exit->set_dev(MakeDev(8, 1));
    exit->set_ino(1);
    exit->set_off(4);
    exit->set_size(4);
    exit->set_res(4);

    EXPECT_TRUE(parser_->HmfsReadExitEvent(exitEvent));

    const auto &fsIo = selector_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_FALSE(fsIo.IsBlocksData()[0]);
    EXPECT_FALSE(fsIo.IsWritesData()[0]);
    EXPECT_NE(fsIo.fileIdsData()[0], INVALID_DATAINDEX);
    EXPECT_EQ(selector_.traceDataCache_->GetDataFromDict(fsIo.fileIdsData()[0]), "hello.txt");
    EXPECT_EQ(fsIo.ActualBytesData()[0], 4);
}

HWTEST_F(FileSystemIoCpuDetailParserTest, HmfsReadExit_NegativeResDoesNotMatchNoRow, TestSize.Level1)
{
    parser_->eventTid_ = 1234;

    RawTraceEventInfo enterEvent{};
    enterEvent.msgPtr = std::make_unique<FtraceEvent>();
    enterEvent.msgPtr->set_timestamp(100);
    auto *enter = enterEvent.msgPtr->mutable_hmfs_read_enter_format();
    enter->set_dev(MakeDev(8, 1));
    enter->set_ino(1);
    enter->set_off(5);
    enter->set_size(4);
    enter->set_i_size(1024);

    EXPECT_TRUE(parser_->HmfsReadEnterEvent(enterEvent));
    ASSERT_EQ(selector_.streamFilters_->fileSystemIoFilter_->pendingEnterEvents_.size(), 1u);

    RawTraceEventInfo exitEvent{};
    exitEvent.msgPtr = std::make_unique<FtraceEvent>();
    exitEvent.msgPtr->set_timestamp(200);
    auto *exit = exitEvent.msgPtr->mutable_hmfs_read_exit_format();
    exit->set_dev(MakeDev(8, 1));
    exit->set_ino(1);
    exit->set_off(4);
    exit->set_size(4);
    exit->set_res(-1);

    EXPECT_TRUE(parser_->HmfsReadExitEvent(exitEvent));

    EXPECT_EQ(selector_.traceDataCache_->GetConstFileSystemIoData().Size(), 0u);
    EXPECT_EQ(selector_.streamFilters_->fileSystemIoFilter_->pendingEnterEvents_.size(), 1u);
}

HWTEST_F(FileSystemIoCpuDetailParserTest, HmfsWriteEnterExit_WithName, TestSize.Level1)
{
    parser_->eventTid_ = 1234;

    RawTraceEventInfo enterEvent{};
    enterEvent.msgPtr = std::make_unique<FtraceEvent>();
    enterEvent.msgPtr->set_timestamp(100);
    auto *enter = enterEvent.msgPtr->mutable_hmfs_write_enter_format();
    enter->set_dev(MakeDev(8, 1));
    enter->set_ino(1);
    enter->set_off(0);
    enter->set_size(4);
    enter->set_i_size(1024);
    enter->set_name("hello.txt");
    EXPECT_TRUE(parser_->HmfsWriteEnterEvent(enterEvent));

    RawTraceEventInfo exitEvent{};
    exitEvent.msgPtr = std::make_unique<FtraceEvent>();
    exitEvent.msgPtr->set_timestamp(200);
    auto *exit = exitEvent.msgPtr->mutable_hmfs_write_exit_format();
    exit->set_dev(MakeDev(8, 1));
    exit->set_ino(1);
    exit->set_off(4);
    exit->set_size(4);
    exit->set_res(4);
    EXPECT_TRUE(parser_->HmfsWriteExitEvent(exitEvent));

    const auto &fsIo = selector_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_FALSE(fsIo.IsBlocksData()[0]);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
}

HWTEST_F(FileSystemIoCpuDetailParserTest, HmfsWriteEnterExit_WithEmptyName, TestSize.Level1)
{
    parser_->eventTid_ = 1234;

    RawTraceEventInfo enterEvent{};
    enterEvent.msgPtr = std::make_unique<FtraceEvent>();
    enterEvent.msgPtr->set_timestamp(300);
    auto *enter = enterEvent.msgPtr->mutable_hmfs_write_enter_format();
    enter->set_dev(MakeDev(8, 1));
    enter->set_ino(2);
    enter->set_off(10);
    enter->set_size(8);
    enter->set_i_size(2048);
    enter->set_name("");
    EXPECT_TRUE(parser_->HmfsWriteEnterEvent(enterEvent));

    RawTraceEventInfo exitEvent{};
    exitEvent.msgPtr = std::make_unique<FtraceEvent>();
    exitEvent.msgPtr->set_timestamp(400);
    auto *exit = exitEvent.msgPtr->mutable_hmfs_write_exit_format();
    exit->set_dev(MakeDev(8, 1));
    exit->set_ino(2);
    exit->set_off(18);
    exit->set_size(8);
    exit->set_res(8);
    EXPECT_TRUE(parser_->HmfsWriteExitEvent(exitEvent));

    const auto &fsIo = selector_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
}
} // namespace TraceStreamer
} // namespace SysTuning
