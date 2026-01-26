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
#include "filesystem_io_filter.h"
#include "filesystem_io_test_utils.h"
#include "htrace_cpu_detail_parser.h"
#include "trace_plugin_result.pb.h"
#include "trace_plugin_result.pbreader.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
class FileSystemIoHtraceEventParserTest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }
    void TearDown() override {}

protected:
    TraceStreamerSelector stream_ = {};
};

static void BuildDataSegment(PbreaderDataSegment &dataSeg, TracePluginResult &packet)
{
    dataSeg.clockId.store(TS_CLOCK_BOOTTIME);
    std::string msg;
    packet.SerializeToString(&msg);
    dataSeg.seg = std::make_shared<std::string>(msg);
    ProtoReader::BytesView view(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()), dataSeg.seg->size());
    dataSeg.protoData = view;
}

HWTEST_F(FileSystemIoHtraceEventParserTest, HmfsReadEnterExit_EntryNameBranchAndMatch, TestSize.Level1)
{
    TracePluginResult packet;
    auto *cpuDetail = packet.add_ftrace_cpu_detail();
    cpuDetail->set_cpu(0);
    cpuDetail->set_overwrite(0);

    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(100);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *enter = new HmfsReadEnterFormat();
        enter->set_dev(MakeDev(8, 1));
        enter->set_ino(1);
        enter->set_off(0);
        enter->set_size(4);
        enter->set_i_size(1024);
        enter->set_name("hello.txt");
        event->unsafe_arena_set_allocated_hmfs_read_enter_format(enter);
    }
    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(200);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *exit = new HmfsReadExitFormat();
        exit->set_dev(MakeDev(8, 1));
        exit->set_ino(1);
        exit->set_off(4);
        exit->set_size(4);
        exit->set_res(4);
        event->unsafe_arena_set_allocated_hmfs_read_exit_format(exit);
    }

    PbreaderDataSegment dataSeg;
    BuildDataSegment(dataSeg, packet);
    ProtoReader::TracePluginResult_Reader reader(dataSeg.protoData);
    HtraceCpuDetailParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    parser.Parse(dataSeg, reader, haveSplit);
    parser.FilterAllEvents();

    const auto &fsIo = stream_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_FALSE(fsIo.IsWritesData()[0]);
    EXPECT_NE(fsIo.fileIdsData()[0], INVALID_DATAINDEX);
    EXPECT_EQ(stream_.traceDataCache_->GetDataFromDict(fsIo.fileIdsData()[0]), "hello.txt");
}

HWTEST_F(FileSystemIoHtraceEventParserTest, HmfsReadExit_NegativeResDoesNotMatchNoRow, TestSize.Level1)
{
    TracePluginResult packet;
    auto *cpuDetail = packet.add_ftrace_cpu_detail();
    cpuDetail->set_cpu(0);
    cpuDetail->set_overwrite(0);

    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(100);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *enter = new HmfsReadEnterFormat();
        enter->set_dev(MakeDev(8, 1));
        enter->set_ino(1);
        enter->set_off(5);
        enter->set_size(4);
        enter->set_i_size(1024);
        event->unsafe_arena_set_allocated_hmfs_read_enter_format(enter);
    }
    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(200);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *exit = new HmfsReadExitFormat();
        exit->set_dev(MakeDev(8, 1));
        exit->set_ino(1);
        exit->set_off(4);
        exit->set_size(4);
        exit->set_res(-1);
        event->unsafe_arena_set_allocated_hmfs_read_exit_format(exit);
    }

    PbreaderDataSegment dataSeg;
    BuildDataSegment(dataSeg, packet);
    ProtoReader::TracePluginResult_Reader reader(dataSeg.protoData);
    HtraceCpuDetailParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    parser.Parse(dataSeg, reader, haveSplit);
    parser.FilterAllEvents();

    EXPECT_EQ(stream_.traceDataCache_->GetConstFileSystemIoData().Size(), 0u);
}

HWTEST_F(FileSystemIoHtraceEventParserTest, BlockRqIssueComplete_IsWriteAndCmdFallback, TestSize.Level1)
{
    TracePluginResult packet;
    auto *cpuDetail = packet.add_ftrace_cpu_detail();
    cpuDetail->set_cpu(0);
    cpuDetail->set_overwrite(0);

    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(100);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *issue = new BlockRqIssueFormat();
        issue->set_dev(MakeDev(8, 1));
        issue->set_sector(16);
        issue->set_nr_sector(8);
        issue->set_bytes(4096);
        issue->set_rwbs("W");
        issue->set_cmd("");
        event->unsafe_arena_set_allocated_block_rq_issue_format(issue);
    }
    {
        auto *event = cpuDetail->add_event();
        event->set_timestamp(200);
        event->set_tgid(10);
        event->set_comm("ut");
        auto *complete = new BlockRqCompleteFormat();
        complete->set_dev(MakeDev(8, 1));
        complete->set_sector(16);
        complete->set_nr_sector(8);
        complete->set_rwbs("W");
        complete->set_cmd("cmd2");
        event->unsafe_arena_set_allocated_block_rq_complete_format(complete);
    }

    PbreaderDataSegment dataSeg;
    BuildDataSegment(dataSeg, packet);
    ProtoReader::TracePluginResult_Reader reader(dataSeg.protoData);
    HtraceCpuDetailParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    parser.Parse(dataSeg, reader, haveSplit);
    parser.FilterAllEvents();

    const auto &fsIo = stream_.traceDataCache_->GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_TRUE(fsIo.IsBlocksData()[0]);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
    EXPECT_EQ(stream_.traceDataCache_->GetDataFromDict(fsIo.CmdIdsData()[0]), "cmd2");
}
} // namespace TraceStreamer
} // namespace SysTuning
