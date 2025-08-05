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

#include "system_event_filter_table.h"

#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TYPE, NAME };
SystemEventFilterTable::SystemEventFilterTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("type", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tablePriKey_.push_back("id");
}

SystemEventFilterTable::~SystemEventFilterTable() {}

void SystemEventFilterTable::FilterByConstraint(FilterConstraints &eventfc,
                                                double &eventfilterCost,
                                                size_t eventrowCount,
                                                uint32_t eventcurrenti)
{
    const auto &eventc = eventfc.GetConstraints()[eventcurrenti];
    switch (static_cast<Index>(eventc.col)) {
        case Index::ID: {
            auto eventoldRowCount = eventrowCount;
            if (CanFilterSorted(eventc.op, eventrowCount)) {
                eventfc.UpdateConstraint(eventcurrenti, true);
                eventfilterCost += log2(eventoldRowCount); // binary search
            } else {
                eventfilterCost += eventoldRowCount;
            }
            break;
        }
        default:                              // other column
            eventfilterCost += eventrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> SystemEventFilterTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

SystemEventFilterTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSysMeasureFilterData().Size())),
      sysEventObj_(dataCache->GetConstSysMeasureFilterData())
{
}

SystemEventFilterTable::Cursor::~Cursor() {}

int32_t SystemEventFilterTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &systemEventFilterCs = fc.GetConstraints();
    for (size_t i = 0; i < systemEventFilterCs.size(); i++) {
        const auto &c = systemEventFilterCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterSorted(c.col, c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto sysEventFilterOrderbys = fc.GetOrderBys();
    for (auto i = sysEventFilterOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(sysEventFilterOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(sysEventFilterOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t SystemEventFilterTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, sysEventObj_.IdsData()[CurrentRow()]);
            break;
        case Index::TYPE:
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(sysEventObj_.TypesData()[CurrentRow()]).c_str(),
                                STR_DEFAULT_LEN, nullptr);
            break;
        case Index::NAME:
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(sysEventObj_.NamesData()[CurrentRow()]).c_str(),
                                STR_DEFAULT_LEN, nullptr);
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void SystemEventFilterTable::Cursor::FilterSorted(int32_t col, unsigned char op, sqlite3_value *argv)
{
    auto type = sqlite3_value_type(argv);
    if (type != SQLITE_INTEGER) {
        // other type consider it NULL, filter out nothing
        indexMap_->Intersect(0, 0);
        return;
    }

    switch (static_cast<Index>(col)) {
        case Index::ID: {
            auto v = static_cast<uint64_t>(sqlite3_value_int64(argv));
            auto getValue = [](const uint32_t &row) { return row; };
            switch (op) {
                case SQLITE_INDEX_CONSTRAINT_EQ:
                    indexMap_->IntersectabcEqual(sysEventObj_.IdsData(), v, getValue);
                    break;
                case SQLITE_INDEX_CONSTRAINT_GT:
                    v++;
                case SQLITE_INDEX_CONSTRAINT_GE: {
                    indexMap_->IntersectGreaterEqual(sysEventObj_.IdsData(), v, getValue);
                    break;
                }
                case SQLITE_INDEX_CONSTRAINT_LE:
                    v++;
                case SQLITE_INDEX_CONSTRAINT_LT: {
                    indexMap_->IntersectLessEqual(sysEventObj_.IdsData(), v, getValue);
                    break;
                }
                default:
                    break;
            } // end of switch (op)
        }     // end of case TS
        default:
            // can't filter, all rows
            break;
    }
}

void SystemEventFilterTable::GetOrbyes(FilterConstraints &eventfc, EstimatedIndexInfo &eventei)
{
    auto eventorderbys = eventfc.GetOrderBys();
    for (auto i = 0; i < eventorderbys.size(); i++) {
        switch (static_cast<Index>(eventorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                eventei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
