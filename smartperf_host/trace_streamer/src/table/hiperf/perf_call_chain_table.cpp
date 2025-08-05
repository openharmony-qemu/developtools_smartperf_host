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

#include "perf_call_chain_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    DEPTH,
    IP,
    VADDR_IN_FILE,
    OFFSET_TO_VADDR,
    FILE_ID,
    SYMBOL_ID,
    NAME,
    SOURCE_FILE_ID,
    LINE_NUMBER
};
PerfCallChainTable::PerfCallChainTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("depth", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ip", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("vaddr_in_file", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("offset_to_vaddr", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("symbol_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("source_file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("line_number", "INTEGER"));
    tablePriKey_.push_back("id");
}

PerfCallChainTable::~PerfCallChainTable() {}

void PerfCallChainTable::FilterByConstraint(FilterConstraints &chainfc,
                                            double &chainfilterCost,
                                            size_t chainrowCount,
                                            uint32_t chaincurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &chainc = chainfc.GetConstraints()[chaincurrenti];
    switch (static_cast<Index>(chainc.col)) {
        case Index::ID: {
            if (CanFilterId(chainc.op, chainrowCount)) {
                chainfc.UpdateConstraint(chaincurrenti, true);
                chainfilterCost += 1; // id can position by 1 step
            } else {
                chainfilterCost += chainrowCount; // scan all rows
            }
            break;
        }
        default:                              // other column
            chainfilterCost += chainrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> PerfCallChainTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

PerfCallChainTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstPerfCallChainData().Size())),
      perfCallChainObj_(dataCache->GetConstPerfCallChainData())
{
}

PerfCallChainTable::Cursor::~Cursor() {}

int32_t PerfCallChainTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto perfCallChainCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(perfCallChainCs, sId);
    for (size_t i = 0; i < perfCallChainCs.size(); i++) {
        const auto &c = perfCallChainCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::CALLCHAIN_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfCallChainObj_.CallChainIds());
                break;
            case Index::FILE_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfCallChainObj_.FileIds());
                break;
            case Index::SYMBOL_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfCallChainObj_.SymbolIds());
                break;
            default:
                break;
        }
    }

    auto perfCallChainOrderbys = fc.GetOrderBys();
    for (auto i = perfCallChainOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(perfCallChainOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(perfCallChainOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t PerfCallChainTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.CallChainIds()[CurrentRow()]));
            break;
        case Index::DEPTH:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.Depths()[CurrentRow()]));
            break;
        case Index::IP:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.Ips()[CurrentRow()]));
            break;
        case Index::VADDR_IN_FILE:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.VaddrInFiles()[CurrentRow()]));
            break;
        case Index::OFFSET_TO_VADDR:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.OffsetToVaddrs()[CurrentRow()]));
            break;
        case Index::FILE_ID:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.FileIds()[CurrentRow()]));
            break;
        case Index::SYMBOL_ID:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.SymbolIds()[CurrentRow()]));
            break;
        case Index::NAME:
            sqlite3_result_int64(context_, static_cast<uint64_t>(perfCallChainObj_.Names()[CurrentRow()]));
            break;
        case Index::SOURCE_FILE_ID:
            SetTypeColumnInt64(perfCallChainObj_.SourceFileIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::LINE_NUMBER:
            SetTypeColumnInt64(perfCallChainObj_.LineNumbers()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void PerfCallChainTable::GetOrbyes(FilterConstraints &chainfc, EstimatedIndexInfo &chainei)
{
    auto chainorderbys = chainfc.GetOrderBys();
    for (auto i = 0; i < chainorderbys.size(); i++) {
        switch (static_cast<Index>(chainorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                chainei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
