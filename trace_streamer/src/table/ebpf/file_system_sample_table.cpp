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

#include "file_system_sample_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    TYPE,
    IPID,
    ITID,
    START_TS,
    END_TS,
    DUR,
    RETURN_VALUE,
    ERROR_VALUE,
    FD,
    FILE_ID,
    SIZE,
    FIRST_ARGUMENT,
    SECOND_ARGUMENT,
    THIRD_ARGUMENT,
    FOURTH_ARGUMENT,
};
FileSystemSampleTable::FileSystemSampleTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("type", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("return_value", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("error_code", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("fd", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("first_argument", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("second_argument", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("third_argument", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("fourth_argument", "TEXT"));
    tablePriKey_.push_back("id");
}

FileSystemSampleTable::~FileSystemSampleTable() {}

void FileSystemSampleTable::FilterByConstraint(FilterConstraints& sysfc,
                                               double& sysfilterCost,
                                               size_t sysrowCount,
                                               uint32_t syscurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& sysc = sysfc.GetConstraints()[syscurrenti];
    switch (static_cast<Index>(sysc.col)) {
        case Index::ID: {
            if (CanFilterId(sysc.op, sysrowCount)) {
                sysfc.UpdateConstraint(syscurrenti, true);
                sysfilterCost += 1; // id can position by 1 step
            } else {
                sysfilterCost += sysrowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            sysfilterCost += sysrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> FileSystemSampleTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

FileSystemSampleTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstFileSystemSample().Size())),
      fileSystemSampleTableObj_(dataCache->GetConstFileSystemSample())
{
}

FileSystemSampleTable::Cursor::~Cursor() {}

int32_t FileSystemSampleTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto fileSystemSampleCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(fileSystemSampleCs, sId);
    for (size_t i = 0; i < fileSystemSampleCs.size(); i++) {
        const auto& c = fileSystemSampleCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            case Index::TYPE:
                indexMap_->MixRange(c.op, static_cast<uint16_t>(sqlite3_value_int(argv[i])),
                                    fileSystemSampleTableObj_.Types());
                break;
            default:
                break;
        }
    }

    auto fileSystemSampleOrderbys = fc.GetOrderBys();
    for (auto i = fileSystemSampleOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(fileSystemSampleOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(fileSystemSampleOrderbys[i].desc);
                break;
            default:
                break;
        }
    }
    return SQLITE_OK;
}

int32_t FileSystemSampleTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(fileSystemSampleTableObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            SetTypeColumn(fileSystemSampleTableObj_.CallChainIds()[CurrentRow()], INVALID_UINT32,
                          INVALID_CALL_CHAIN_ID);
            break;
        case Index::TYPE:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Types()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::IPID:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Ipids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::ITID:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Itids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::START_TS:
            SetTypeColumnInt64(fileSystemSampleTableObj_.StartTs()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::END_TS:
            SetTypeColumnInt64(fileSystemSampleTableObj_.EndTs()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::DUR:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Durs()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::RETURN_VALUE:
            SetTypeColumnText(fileSystemSampleTableObj_.ReturnValues()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::ERROR_VALUE:
            SetTypeColumnText(fileSystemSampleTableObj_.ErrorCodes()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            HandleTypeColumns(column);
            break;
    }
    return SQLITE_OK;
}
void FileSystemSampleTable::Cursor::HandleTypeColumns(int32_t fileSysSampleCol) const
{
    switch (static_cast<Index>(fileSysSampleCol)) {
        case Index::FD:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Fds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::FILE_ID:
            SetTypeColumnInt64(fileSystemSampleTableObj_.FileIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::SIZE:
            SetTypeColumnInt64(fileSystemSampleTableObj_.Sizes()[CurrentRow()], MAX_SIZE_T);

            break;
        case Index::FIRST_ARGUMENT:
            SetTypeColumnText(fileSystemSampleTableObj_.FirstArguments()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::SECOND_ARGUMENT:
            SetTypeColumnText(fileSystemSampleTableObj_.SecondArguments()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::THIRD_ARGUMENT:
            SetTypeColumnText(fileSystemSampleTableObj_.ThirdArguments()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::FOURTH_ARGUMENT:
            SetTypeColumnText(fileSystemSampleTableObj_.FourthArguments()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            TS_LOGF("Unregistered fileSysSampleCol : %d", fileSysSampleCol);
            break;
    }
}
void FileSystemSampleTable::GetOrbyes(FilterConstraints& sysfc, EstimatedIndexInfo& sysei)
{
    auto sysOrderbys = sysfc.GetOrderBys();
    for (auto i = 0; i < sysOrderbys.size(); i++) {
        switch (static_cast<Index>(sysOrderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                sysei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
