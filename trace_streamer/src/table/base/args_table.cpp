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

#include "args_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, KEY, DATATYPE, VALUE, ARGSETID };
ArgsTable::ArgsTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("key", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("datatype", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("value", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("argset", "INTEGER"));
    tablePriKey_.push_back("id");
}

ArgsTable::~ArgsTable() {}

void ArgsTable::FilterByConstraint(FilterConstraints& argsfc,
                                   double& argsfilterCost,
                                   size_t argsrowCount,
                                   uint32_t argscurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& argsc = argsfc.GetConstraints()[argscurrenti];
    switch (static_cast<Index>(argsc.col)) {
        case Index::ID: {
            if (CanFilterId(argsc.op, argsrowCount)) {
                argsfc.UpdateConstraint(argscurrenti, true);
                argsfilterCost += 1; // id can position by 1 step
            } else {
                argsfilterCost += argsrowCount; // scan all rows
            }
            break;
        }
        default:                            // other column
            argsfilterCost += argsrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> ArgsTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

ArgsTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstArgSetData().Size())),
      argSet_(dataCache->GetConstArgSetData())
{
}

ArgsTable::Cursor::~Cursor() {}

int32_t ArgsTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto& argsTabCs = fc.GetConstraints();
    for (size_t i = 0; i < argsTabCs.size(); i++) {
        const auto& c = argsTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto argsTabOrderbys = fc.GetOrderBys();
    for (auto i = argsTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(argsTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(argsTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t ArgsTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, CurrentRow()); // IdsData() will be optimized
            break;
        case Index::KEY:
            sqlite3_result_int64(context_, static_cast<int64_t>(argSet_.NamesData()[CurrentRow()]));
            break;
        case Index::DATATYPE:
            sqlite3_result_int64(context_, static_cast<int64_t>(argSet_.DataTypes()[CurrentRow()]));
            break;
        case Index::VALUE:
            sqlite3_result_int64(context_, static_cast<int64_t>(argSet_.ValuesData()[CurrentRow()]));
            break;
        case Index::ARGSETID:
            sqlite3_result_int64(context_, static_cast<int64_t>(argSet_.ArgsData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void ArgsTable::GetOrbyes(FilterConstraints& argsfc, EstimatedIndexInfo& argsei)
{
    auto argsorderbys = argsfc.GetOrderBys();
    for (auto i = 0; i < argsorderbys.size(); i++) {
        switch (static_cast<Index>(argsorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                argsei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
