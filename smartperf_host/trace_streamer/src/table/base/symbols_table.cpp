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

#include "symbols_table.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, STR, ADDR };
SymbolsTable::SymbolsTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("funcname", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("addr", "INTEGER"));
    tablePriKey_.push_back("id");
}

SymbolsTable::~SymbolsTable() {}

void SymbolsTable::FilterByConstraint(FilterConstraints &symfc,
                                      double &symfilterCost,
                                      size_t symrowCount,
                                      uint32_t symcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &symc = symfc.GetConstraints()[symcurrenti];
    switch (static_cast<Index>(symc.col)) {
        case Index::ID: {
            if (CanFilterId(symc.op, symrowCount)) {
                symfc.UpdateConstraint(symcurrenti, true);
                symfilterCost += 1; // id can position by 1 step
            } else {
                symfilterCost += symrowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            symfilterCost += symrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> SymbolsTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

SymbolsTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSymbolsData().Size()))
{
}

SymbolsTable::Cursor::~Cursor() {}

int32_t SymbolsTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &symTabCs = fc.GetConstraints();
    for (size_t i = 0; i < symTabCs.size(); i++) {
        const auto &c = symTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto symTabOrderbys = fc.GetOrderBys();
    for (auto i = symTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(symTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(symTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t SymbolsTable::Cursor::Column(int32_t col) const
{
    DataIndex index = static_cast<DataIndex>(CurrentRow());
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(CurrentRow()));
            break;
        case Index::STR:
            sqlite3_result_text(
                context_,
                dataCache_->GetDataFromDict(dataCache_->GetConstSymbolsData().GetConstFuncNames()[index]).c_str(),
                STR_DEFAULT_LEN, nullptr);
            break;
        case Index::ADDR:
            sqlite3_result_int64(context_,
                                 static_cast<sqlite3_int64>(dataCache_->GetConstSymbolsData().GetConstAddrs()[index]));
            break;
        default:
            TS_LOGF("Unknown column %d", col);
            break;
    }
    return SQLITE_OK;
}

void SymbolsTable::GetOrbyes(FilterConstraints &symfc, EstimatedIndexInfo &symei)
{
    auto symorderbys = symfc.GetOrderBys();
    for (auto i = 0; i < symorderbys.size(); i++) {
        switch (static_cast<Index>(symorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                symei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
