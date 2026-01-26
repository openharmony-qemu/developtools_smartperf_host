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

#include "filesystem_io_table.h"
#include <string>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID,
    ITID,
    IPID,
    START_TIME,
    END_TIME,
    DURATION,
    IS_BLOCK,
    IS_WRITE,
    MAIN_DEV,
    SUB_DEV,
    INO,
    ENTER_SIZE,
    ENTER_OFFSET,
    EXIT_OFFSET,
    REQUEST_BYTES,
    ACTUAL_BYTES,
    FILE_ID,
    SECTOR,
    NR_SECTOR,
    RWBS_ID,
    CMD_ID
};
FileSystemIoTable::FileSystemIoTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("is_block", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("is_write", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("main_dev", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("sub_dev", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ino", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("enter_size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("enter_offset", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("exit_offset", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("request_bytes", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("actual_bytes", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("sector", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("nr_sector", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("rwbs_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cmd_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

FileSystemIoTable::~FileSystemIoTable() {}

std::unique_ptr<TableBase::Cursor> FileSystemIoTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

FileSystemIoTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstFileSystemIoData().Size())),
      fileSystemIoObj_(dataCache->GetConstFileSystemIoData())
{
}

FileSystemIoTable::Cursor::~Cursor() {}

void FileSystemIoTable::Cursor::HandleCommonColumns(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, fileSystemIoObj_.IdsData()[CurrentRow()]);
            break;
        case Index::ITID:
            SetTypeColumnInt64(fileSystemIoObj_.ItidsData()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::IPID: {
            const auto itid = fileSystemIoObj_.ItidsData()[CurrentRow()];
            if (itid != INVALID_UINT32 && itid < dataCache_->GetConstThreadData().size()) {
                const auto &thread = dataCache_->GetConstThreadData(itid);
                if (thread.internalPid_ != INVALID_UINT32) {
                    sqlite3_result_int64(context_, thread.internalPid_);
                    break;
                }
            }
            sqlite3_result_null(context_);
        } break;
        case Index::START_TIME:
            SetTypeColumnInt64(fileSystemIoObj_.startTimesData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::END_TIME:
            SetTypeColumnInt64(fileSystemIoObj_.EndTimesData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::DURATION:
            SetTypeColumnInt64(fileSystemIoObj_.DurationsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::IS_BLOCK:
            sqlite3_result_int(context_, fileSystemIoObj_.IsBlocksData()[CurrentRow()] ? 1 : 0);
            break;
        case Index::IS_WRITE: {
            sqlite3_result_int(context_, fileSystemIoObj_.IsWritesData()[CurrentRow()] ? 1 : 0);
            break;
        }
        case Index::MAIN_DEV:
            SetTypeColumnInt64(fileSystemIoObj_.MainDevsData()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::SUB_DEV:
            SetTypeColumnInt64(fileSystemIoObj_.SubDevsData()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::REQUEST_BYTES:
            SetTypeColumnInt64(fileSystemIoObj_.RequestBytesData()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            break;
    }
}

void FileSystemIoTable::Cursor::HandleHmfsIoColumns(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::INO:
            SetTypeColumnInt64(fileSystemIoObj_.InosData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::ENTER_SIZE:
            SetTypeColumnInt64(fileSystemIoObj_.EnterSizesData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::ENTER_OFFSET:
            SetTypeColumnInt64(fileSystemIoObj_.EnterOffsetsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::EXIT_OFFSET:
            SetTypeColumnInt64(fileSystemIoObj_.ExitOffsetsData()[CurrentRow()], INVALID_UINT64);
            break;

        case Index::ACTUAL_BYTES:
            SetTypeColumnInt64(fileSystemIoObj_.ActualBytesData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::FILE_ID:
            SetTypeColumnInt64(fileSystemIoObj_.fileIdsData()[CurrentRow()], INVALID_DATAINDEX);
            break;
        default:
            break;
    }
}

void FileSystemIoTable::Cursor::HandleBlockIoColumns(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::SECTOR:
            SetTypeColumnInt64(fileSystemIoObj_.SectorsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::NR_SECTOR:
            SetTypeColumnInt64(fileSystemIoObj_.NrSectorsData()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::RWBS_ID: {
            DataIndex rwbsId = fileSystemIoObj_.RwbsIdsData()[CurrentRow()];
            SetTypeColumnInt64(rwbsId, INVALID_DATAINDEX);
            break;
        }
        case Index::CMD_ID: {
            DataIndex cmdId = fileSystemIoObj_.CmdIdsData()[CurrentRow()];
            SetTypeColumnInt64(cmdId, INVALID_DATAINDEX);
            break;
        }
        default:
            break;
    }
}

int32_t FileSystemIoTable::Cursor::Column(int32_t column) const
{
    HandleCommonColumns(column);
    HandleHmfsIoColumns(column);
    HandleBlockIoColumns(column);

    Index colIndex = static_cast<Index>(column);
    if (colIndex < Index::ID || colIndex > Index::CMD_ID) {
        TS_LOGF("Unregistered column : %d", column);
    }

    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
