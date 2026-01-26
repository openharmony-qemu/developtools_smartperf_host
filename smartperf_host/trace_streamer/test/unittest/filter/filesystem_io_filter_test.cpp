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

#include <string>

#define private public
#include "filesystem_io_filter.h"
#include "process_filter.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace {
struct HmfsEnterSpec {
    uint64_t ts{};
    InternalTid itid{};
    uint32_t mainDev{};
    uint32_t subDev{};
    uint64_t ino{};
    uint64_t enterSize{};
    uint64_t offset{};
    uint64_t requestBytes{};
    DataIndex fileId{INVALID_DATAINDEX};
    bool isWrite{};
};

static HmfsIoEnterEvent MakeEnter(const HmfsEnterSpec &s)
{
    return {s.ts, s.itid, s.mainDev, s.subDev, s.ino, s.enterSize, s.offset, s.requestBytes, s.fileId, s.isWrite};
}

struct HmfsExitSpec {
    uint64_t ts{};
    InternalTid itid{};
    uint32_t mainDev{};
    uint32_t subDev{};
    uint64_t ino{};
    uint64_t offset{};
    uint64_t requestBytes{};
    int64_t actualBytes{};
    bool isWrite{};
};

static HmfsIoExitEvent MakeExit(const HmfsExitSpec &s)
{
    return {s.ts, s.itid, s.mainDev, s.subDev, s.ino, s.offset, s.requestBytes, s.actualBytes, s.isWrite};
}

struct BlockIssueSpec {
    uint64_t ts{};
    InternalTid itid{};
    uint32_t mainDev{};
    uint32_t subDev{};
    uint64_t beginSector{};
    uint32_t sectors{};
    uint32_t bytes{};
    std::string rwbs;
    std::string cmd;
    bool isWrite{};
};

static BlockIoIssueEvent MakeIssue(const BlockIssueSpec &s)
{
    return {s.ts, s.itid, s.mainDev, s.subDev, s.beginSector, s.sectors, s.bytes, s.rwbs, s.cmd, s.isWrite};
}

struct BlockCompleteSpec {
    uint64_t ts{};
    uint32_t mainDev{};
    uint32_t subDev{};
    uint64_t beginSector{};
    uint32_t sectors{};
    int32_t error{};
    std::string rwbs;
    std::string cmd;
    bool isWrite{};
};

static BlockIoCompleteEvent MakeComplete(const BlockCompleteSpec &s)
{
    return {s.ts, s.mainDev, s.subDev, s.beginSector, s.sectors, s.error, s.rwbs, s.cmd, s.isWrite};
}
} // namespace

class FileSystemIoFilterTest : public ::testing::Test {
public:
    void SetUp() override
    {
        streamFilters_.processFilter_ = std::make_unique<ProcessFilter>(&traceDataCache_, &streamFilters_);
        filter_ = std::make_unique<FileSystemIoFilter>(&traceDataCache_, &streamFilters_);
    }

    void TearDown() override {}

protected:
    TraceStreamerFilters streamFilters_{};
    TraceDataCache traceDataCache_{};
    std::unique_ptr<FileSystemIoFilter> filter_{};
};

HWTEST_F(FileSystemIoFilterTest, HmfsEnterExit_MatchCreatesRow, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    filter_->ProcessReadEnter(MakeEnter({100, itid, 8u, 1u, 1u, 1024u, 0u, 4u}));
    EXPECT_EQ(filter_->pendingEnterEvents_.size(), 1u);

    filter_->ProcessReadExit(MakeExit({200, itid, 8u, 1u, 1u, 4u, 4u, 4u, false}));
    EXPECT_EQ(filter_->pendingEnterEvents_.size(), 0u);

    const auto &fsIo = traceDataCache_.GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_FALSE(fsIo.IsBlocksData()[0]);
    EXPECT_FALSE(fsIo.IsWritesData()[0]);
    EXPECT_EQ(fsIo.MainDevsData()[0], 8u);
    EXPECT_EQ(fsIo.SubDevsData()[0], 1u);
    EXPECT_EQ(fsIo.InosData()[0], 1u);
    EXPECT_EQ(fsIo.EnterOffsetsData()[0], 0u);
    EXPECT_EQ(fsIo.ExitOffsetsData()[0], 4u);
    EXPECT_EQ(fsIo.RequestBytesData()[0], 4u);
    EXPECT_EQ(fsIo.ActualBytesData()[0], 4u);
}

HWTEST_F(FileSystemIoFilterTest, HmfsMultipleEnter_BestMatchUsesLatestEnter, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    filter_->ProcessWriteEnter(MakeEnter({100, itid, 8u, 1u, 1u, 0u, 0u, 4u, INVALID_DATAINDEX, true}));
    filter_->ProcessWriteEnter(MakeEnter({150, itid, 8u, 1u, 1u, 0u, 0u, 4u, INVALID_DATAINDEX, true}));
    ASSERT_EQ(filter_->pendingEnterEvents_.size(), 2u);

    filter_->ProcessWriteExit(MakeExit({200, itid, 8u, 1u, 1u, 4u, 4u, 4u, true}));

    const auto &fsIo = traceDataCache_.GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_EQ(fsIo.startTimesData()[0], 150u);
    EXPECT_TRUE(fsIo.IsWritesData()[0]);
    ASSERT_EQ(filter_->pendingEnterEvents_.size(), 1u);
    EXPECT_EQ(filter_->pendingEnterEvents_[0].ts, 100u);
}

HWTEST_F(FileSystemIoFilterTest, HmfsExit_NoMatchDoesNotCreateRow, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    filter_->ProcessReadEnter(MakeEnter({100, itid, 8u, 1u, 1u, 0u, 0u, 4u}));

    filter_->ProcessReadExit(MakeExit({200, itid, 8u, 1u, 1u, 4u, 999u, 4u, false}));
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().Size(), 0u);
    EXPECT_EQ(filter_->pendingEnterEvents_.size(), 1u);
}

HWTEST_F(FileSystemIoFilterTest, HmfsExit_NegativeActualBytesWillNotMatch, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    filter_->ProcessReadEnter(MakeEnter({100, itid, 8u, 1u, 1u, 0u, 0u, 4u}));

    filter_->ProcessReadExit(MakeExit({200, itid, 8u, 1u, 1u, 4u, 4u, -1, false}));
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().Size(), 0u);
    ASSERT_EQ(filter_->pendingEnterEvents_.size(), 1u);
    EXPECT_EQ(filter_->pendingEnterEvents_[0].ts, 100u);
}

HWTEST_F(FileSystemIoFilterTest, BlockIssueComplete_FiltersInvalidAndNonReadWriteRwbs, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);

    filter_->ProcessBlockRqIssue(MakeIssue({100, itid, 8u, 1u, 0u, 8u, 4096u, "R", "cmd", true}));
    filter_->ProcessBlockRqIssue(MakeIssue({100, itid, 8u, 1u, 16u, 0u, 4096u, "R", "cmd", true}));
    filter_->ProcessBlockRqIssue(MakeIssue({100, itid, 8u, 1u, 16u, 8u, 4096u, "Z", "cmd", true}));
    EXPECT_TRUE(filter_->pendingBlockIssueEvents_.empty());

    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 1u, 16u, 0u, 0, "R", "cmd", true}));
    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 1u, 0u, 8u, 0, "R", "cmd", true}));
    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 1u, 16u, 8u, 0, "Z", "cmd", true}));
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().Size(), 0u);
}

HWTEST_F(FileSystemIoFilterTest, BlockIssueComplete_MatchCreatesRowAndCmdFallback, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    const DataIndex cmd2 = traceDataCache_.GetDataIndex("cmd2");

    filter_->ProcessBlockRqIssue(MakeIssue({100, itid, 8u, 1u, 16u, 8u, 4096u, "W", "", true}));
    ASSERT_EQ(filter_->pendingBlockIssueEvents_.size(), 1u);

    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 1u, 16u, 8u, 0, "W", "cmd2", true}));
    const auto &fsIo = traceDataCache_.GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 1u);
    EXPECT_TRUE(fsIo.IsBlocksData()[0]);
    EXPECT_EQ(fsIo.RequestBytesData()[0], 4096u);
    EXPECT_EQ(fsIo.CmdIdsData()[0], cmd2);
}

HWTEST_F(FileSystemIoFilterTest, BlockIssueSameItid_KeepsLatestIssueOnly, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    const uint64_t sector = 16;
    const uint32_t nr = 8;

    filter_->ProcessBlockRqIssue(MakeIssue({100, itid, 8u, 1u, sector, nr, 4096u, "R", "cmd", false}));
    filter_->ProcessBlockRqIssue(MakeIssue({110, itid, 8u, 1u, sector, nr, 4096u, "R", "cmd", false}));
    filter_->ProcessBlockRqIssue(MakeIssue({120, itid, 8u, 1u, sector, nr, 4096u, "R", "cmd", false}));
    ASSERT_EQ(filter_->pendingBlockIssueEvents_.size(), 1u);
    EXPECT_EQ(filter_->pendingBlockIssueEvents_[0].ts, 120u);

    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 1u, sector, nr, 0, "R", "cmd", false}));
    EXPECT_TRUE(filter_->pendingBlockIssueEvents_.empty());
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().Size(), 1u);
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().startTimesData()[0], 120u);

    filter_->ProcessBlockRqComplete(MakeComplete({210, 8u, 1u, sector, nr, 0, "R", "cmd", false}));
    EXPECT_EQ(traceDataCache_.GetConstFileSystemIoData().Size(), 1u);
}

HWTEST_F(FileSystemIoFilterTest, BlockIssueOlderThanPending_Ignored, TestSize.Level1)
{
    const auto itid = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    const uint64_t sector = 16;
    const uint32_t nr = 8;

    filter_->ProcessBlockRqIssue(MakeIssue({120, itid, 8u, 1u, sector, nr, 4096u, "R", "cmd", false}));
    filter_->ProcessBlockRqIssue(MakeIssue({110, itid, 8u, 1u, sector, nr, 4096u, "R", "cmd", false}));
    ASSERT_EQ(filter_->pendingBlockIssueEvents_.size(), 1u);
    EXPECT_EQ(filter_->pendingBlockIssueEvents_[0].ts, 120u);
}

HWTEST_F(FileSystemIoFilterTest, BlockIssueDifferentItids_OneCompleteCreatesMultipleRows, TestSize.Level1)
{
    const auto itid1 = streamFilters_.processFilter_->UpdateOrCreateThread(100, 10);
    const auto itid2 = streamFilters_.processFilter_->UpdateOrCreateThread(200, 20);
    const auto itid3 = streamFilters_.processFilter_->UpdateOrCreateThread(300, 30);
    const uint64_t sector = 144685640;
    const uint32_t nr = 8;

    filter_->ProcessBlockRqIssue(MakeIssue({100, itid1, 8u, 0u, sector, nr, 4096u, "WA", "cmd", true}));
    filter_->ProcessBlockRqIssue(MakeIssue({105, itid2, 8u, 0u, sector, nr, 4096u, "WA", "cmd", true}));
    filter_->ProcessBlockRqIssue(MakeIssue({110, itid3, 8u, 0u, sector, nr, 4096u, "WA", "cmd", true}));
    ASSERT_EQ(filter_->pendingBlockIssueEvents_.size(), 3u);

    filter_->ProcessBlockRqComplete(MakeComplete({200, 8u, 0u, sector, nr, 0, "WA", "cmd", true}));

    EXPECT_TRUE(filter_->pendingBlockIssueEvents_.empty());
    const auto &fsIo = traceDataCache_.GetConstFileSystemIoData();
    ASSERT_EQ(fsIo.Size(), 3u);
    EXPECT_EQ(fsIo.startTimesData()[0], 100u);
    EXPECT_EQ(fsIo.startTimesData()[1], 105u);
    EXPECT_EQ(fsIo.startTimesData()[2], 110u);
    EXPECT_EQ(fsIo.ItidsData()[0], itid1);
    EXPECT_EQ(fsIo.ItidsData()[1], itid2);
    EXPECT_EQ(fsIo.ItidsData()[2], itid3);
}
} // namespace TraceStreamer
} // namespace SysTuning
