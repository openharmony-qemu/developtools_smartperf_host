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

#include "filter_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TYPE, NAME, SOURCE_ARG_SET_ID };
FilterTable::FilterTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("type", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("source_arg_set_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

FilterTable::~FilterTable() {}

void FilterTable::FilterByConstraint(FilterConstraints &filterfc,
                                     double &filterfilterCost,
                                     size_t filterrowCount,
                                     uint32_t filtercurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &filterc = filterfc.GetConstraints()[filtercurrenti];
    switch (static_cast<Index>(filterc.col)) {
        case Index::ID: {
            if (CanFilterId(filterc.op, filterrowCount)) {
                filterfc.UpdateConstraint(filtercurrenti, true);
                filterfilterCost += 1; // id can position by 1 step
            } else {
                filterfilterCost += filterrowCount; // scan all rows
            }
            break;
        }
        default:                                // other column
            filterfilterCost += filterrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> FilterTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

FilterTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstFilterData().Size())),
      filterObj_(dataCache->GetConstFilterData())
{
}

FilterTable::Cursor::~Cursor() {}

int32_t FilterTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &filterCs = fc.GetConstraints();
    for (size_t i = 0; i < filterCs.size(); i++) {
        const auto &c = filterCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto filterTabOrderbys = fc.GetOrderBys();
    for (auto i = filterTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(filterTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(filterTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t FilterTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, filterObj_.IdsData()[CurrentRow()]); // IdsData() will be optimized
            break;
        case Index::TYPE:
            sqlite3_result_text(context_, filterObj_.TypeData()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::NAME:
            sqlite3_result_text(context_, filterObj_.NameData()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::SOURCE_ARG_SET_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(filterObj_.SourceArgSetIdData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}
void FilterTable::GetOrbyes(FilterConstraints &filterfc, EstimatedIndexInfo &filterei)
{
    auto filterorderbys = filterfc.GetOrderBys();
    for (auto i = 0; i < filterorderbys.size(); i++) {
        switch (static_cast<Index>(filterorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                filterei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
