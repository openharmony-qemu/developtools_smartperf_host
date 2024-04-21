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

#include "data_dict_table.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, STR };
DataDictTable::DataDictTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("data", "TEXT"));
    tablePriKey_.push_back("id");
}

DataDictTable::~DataDictTable() {}

void DataDictTable::FilterByConstraint(FilterConstraints &dictfc,
                                       double &dictfilterCost,
                                       size_t dictrowCount,
                                       uint32_t dictcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &dictc = dictfc.GetConstraints()[dictcurrenti];
    switch (static_cast<Index>(dictc.col)) {
        case Index::ID: {
            if (CanFilterId(dictc.op, dictrowCount)) {
                dictfc.UpdateConstraint(dictcurrenti, true);
                dictfilterCost += 1; // id can position by 1 step
            } else {
                dictfilterCost += dictrowCount; // scan all rows
            }
            break;
        }
        default:                            // other column
            dictfilterCost += dictrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> DataDictTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

DataDictTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->DataDictSize()))
{
}

DataDictTable::Cursor::~Cursor() {}

int32_t DataDictTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &dataDictTabCs = fc.GetConstraints();
    for (size_t i = 0; i < dataDictTabCs.size(); i++) {
        const auto &c = dataDictTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto dataDictTabOrderbys = fc.GetOrderBys();
    for (auto i = dataDictTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(dataDictTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(dataDictTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t DataDictTable::Cursor::Column(int32_t col) const
{
    DataIndex index = static_cast<DataIndex>(CurrentRow());
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(CurrentRow()));
            break;
        case Index::STR:
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(index).c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        default:
            TS_LOGF("Unknown column %d", col);
            break;
    }
    return SQLITE_OK;
}
void DataDictTable::GetOrbyes(FilterConstraints &dictfc, EstimatedIndexInfo &dictei)
{
    auto dictorderbys = dictfc.GetOrderBys();
    for (auto i = 0; i < dictorderbys.size(); i++) {
        switch (static_cast<Index>(dictorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                dictei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
