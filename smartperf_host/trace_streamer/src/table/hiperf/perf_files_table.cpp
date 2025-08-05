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

#include "perf_files_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, FILE_ID, SERIAL_ID, SYMBOL, PATH };
PerfFilesTable::PerfFilesTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("serial_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("symbol", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("path", "TEXT"));
    tablePriKey_.push_back("id");
}

PerfFilesTable::~PerfFilesTable() {}

void PerfFilesTable::FilterByConstraint(FilterConstraints &filesfc,
                                        double &filesfilterCost,
                                        size_t filesrowCount,
                                        uint32_t filescurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &filesc = filesfc.GetConstraints()[filescurrenti];
    switch (static_cast<Index>(filesc.col)) {
        case Index::ID: {
            if (CanFilterId(filesc.op, filesrowCount)) {
                filesfc.UpdateConstraint(filescurrenti, true);
                filesfilterCost += 1; // id can position by 1 step
            } else {
                filesfilterCost += filesrowCount; // scan all rows
            }
            break;
        }
        default:                              // other column
            filesfilterCost += filesrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> PerfFilesTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

PerfFilesTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstPerfFilesData().Size())),
      perfFilesObj_(dataCache->GetConstPerfFilesData())
{
}

PerfFilesTable::Cursor::~Cursor() {}

int32_t PerfFilesTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto perfFilesTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(perfFilesTabCs, sId);
    for (size_t i = 0; i < perfFilesTabCs.size(); i++) {
        const auto &c = perfFilesTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::FILE_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfFilesObj_.FileIds());
                break;
            default:
                break;
        }
    }

    auto perfFilesTabOrderbys = fc.GetOrderBys();
    for (auto i = perfFilesTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(perfFilesTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(perfFilesTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t PerfFilesTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(perfFilesObj_.IdsData()[CurrentRow()]));
            break;
        case Index::FILE_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfFilesObj_.FileIds()[CurrentRow()]));
            break;
        case Index::SERIAL_ID:
            sqlite3_result_int(context_, static_cast<int32_t>(perfFilesObj_.Serials()[CurrentRow()]));
            break;
        case Index::SYMBOL:
            if (perfFilesObj_.Symbols()[CurrentRow()] != INVALID_UINT64) {
                auto symbolIndex = static_cast<size_t>(perfFilesObj_.Symbols()[CurrentRow()]);
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(symbolIndex).c_str(), STR_DEFAULT_LEN,
                                    nullptr);
            }
            break;
        case Index::PATH:
            if (perfFilesObj_.FilePaths()[CurrentRow()] != INVALID_UINT64) {
                auto pathIndex = static_cast<size_t>(perfFilesObj_.FilePaths()[CurrentRow()]);
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(pathIndex).c_str(), STR_DEFAULT_LEN, nullptr);
            }
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void PerfFilesTable::GetOrbyes(FilterConstraints &filesfc, EstimatedIndexInfo &filesei)
{
    auto filesorderbys = filesfc.GetOrderBys();
    for (auto i = 0; i < filesorderbys.size(); i++) {
        switch (static_cast<Index>(filesorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                filesei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
