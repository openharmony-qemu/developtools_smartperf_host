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
#include "process_filter.h"
#include "trace_stdtype/ftrace/filesystem_io_stdtype.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace {
static bool Contains(const std::string &haystack, const std::string &needle)
{
    return haystack.find(needle) != std::string::npos;
}
} // namespace

class FileSystemIoTableCursorTest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
        stream_.traceDataCache_->InitDB();
    }
    void TearDown() override {}

protected:
    TraceStreamerSelector stream_{};
};

HWTEST_F(FileSystemIoTableCursorTest, CursorColumns_Int64AndSpecialColumns, TestSize.Level1)
{
    const auto itid = stream_.streamFilters_->processFilter_->UpdateOrCreateThread(1, 10);
    auto *thread = stream_.traceDataCache_->GetThreadData(itid);
    ASSERT_NE(thread, nullptr);
    thread->internalPid_ = 123;

    TraceStdtype::FileSystemIoRow row1;
    row1.startTime = 100;
    row1.endTime = 200;
    row1.duration = 100;
    row1.isBlock = false;
    row1.isWrite = false;
    row1.mainDev = 8;
    row1.subDev = 1;
    row1.ino = 1;
    row1.enterSize = 1024;
    row1.enterOffset = 0;
    row1.exitOffset = 4;
    row1.requestBytes = 4;
    row1.actualBytes = 4;
    row1.fileId = stream_.traceDataCache_->GetDataIndex("hello.txt");
    row1.itid = itid;
    stream_.traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(row1);

    TraceStdtype::FileSystemIoRow row2;
    row2.startTime = 300;
    row2.endTime = 350;
    row2.duration = 50;
    row2.isBlock = true;
    row2.isWrite = true;
    row2.mainDev = 8;
    row2.subDev = 1;
    row2.requestBytes = 4096;
    row2.sector = 16;
    row2.nrSector = 8;
    row2.rwbsId = stream_.traceDataCache_->GetDataIndex("W");
    row2.cmdId = stream_.traceDataCache_->GetDataIndex("cmd");
    row2.itid = itid;
    stream_.traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(row2);

    std::string res = stream_.traceDataCache_->SearchDatabase(
        "select start_time,end_time,duration,main_dev,sub_dev,ino,enter_size,enter_offset,exit_offset,request_bytes,"
        "actual_bytes,file_id,sector,nr_sector,is_block,is_write,rwbs_id,cmd_id,itid,ipid from filesystem_io order by "
        "start_time");

    EXPECT_TRUE(Contains(res, "\"columns\""));
    EXPECT_TRUE(Contains(res, "\"values\""));
    // file_id/cmd_id/rwbs_id are DataIndex numbers, not dict strings
    EXPECT_TRUE(Contains(res, std::to_string(row1.fileId)));
    EXPECT_TRUE(Contains(res, std::to_string(row2.cmdId)));
    EXPECT_TRUE(Contains(res, "123"));
}

HWTEST_F(FileSystemIoTableCursorTest, CursorIPID_NullWhenThreadMissingOrInvalidPid, TestSize.Level1)
{
    TraceStdtype::FileSystemIoRow row;
    row.startTime = 1;
    row.isBlock = false;
    row.itid = INVALID_UINT32;
    stream_.traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(row);

    std::string res = stream_.traceDataCache_->SearchDatabase("select ipid from filesystem_io where start_time = 1");
    EXPECT_TRUE(Contains(res, "null"));

    const auto itid = stream_.streamFilters_->processFilter_->UpdateOrCreateThread(1, 20);
    auto *thread = stream_.traceDataCache_->GetThreadData(itid);
    ASSERT_NE(thread, nullptr);
    thread->internalPid_ = INVALID_UINT32;

    TraceStdtype::FileSystemIoRow row2;
    row2.startTime = 2;
    row2.itid = itid;
    stream_.traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(row2);

    res = stream_.traceDataCache_->SearchDatabase("select ipid from filesystem_io where start_time = 2");
    EXPECT_TRUE(Contains(res, "null"));
}
} // namespace TraceStreamer
} // namespace SysTuning
