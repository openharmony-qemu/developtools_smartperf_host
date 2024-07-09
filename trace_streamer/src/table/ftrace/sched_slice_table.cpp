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

#include "sched_slice_table.h"

#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TS, DUR, TS_END, CPU, INTERNAL_TID, INTERNAL_PID, END_STATE, PRIORITY, ARGSETID };
SchedSliceTable::SchedSliceTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts_end", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cpu", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_state", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("priority", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("arg_setid", "INTEGER"));
    tablePriKey_.push_back("id");
}

SchedSliceTable::~SchedSliceTable() {}

void SchedSliceTable::FilterByConstraint(FilterConstraints &schedfc,
                                         double &schedfilterCost,
                                         size_t schedrowCount,
                                         uint32_t schedcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &schedc = schedfc.GetConstraints()[schedcurrenti];
    switch (static_cast<Index>(schedc.col)) {
        case Index::ID: {
            if (CanFilterId(schedc.op, schedrowCount)) {
                schedfc.UpdateConstraint(schedcurrenti, true);
                schedfilterCost += 1; // id can position by 1 step
            } else {
                schedfilterCost += schedrowCount; // scan all rows
            }
            break;
        }
        case Index::TS: {
            auto schedoldRowCount = schedrowCount;
            if (CanFilterSorted(schedc.op, schedrowCount)) {
                schedfc.UpdateConstraint(schedcurrenti, true);
                schedfilterCost += log2(schedoldRowCount); // binary search
            } else {
                schedfilterCost += schedoldRowCount;
            }
            break;
        }
        default:                              // other column
            schedfilterCost += schedrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> SchedSliceTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

SchedSliceTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSchedSliceData().Size())),
      schedSliceObj_(dataCache->GetConstSchedSliceData())
{
}

SchedSliceTable::Cursor::~Cursor() {}

int32_t SchedSliceTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto schedSliceTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(schedSliceTabCs, sId);
    for (size_t i = 0; i < schedSliceTabCs.size(); i++) {
        const auto &c = schedSliceTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::TS:
                FilterTS(c.op, argv[c.idxInaConstraint], schedSliceObj_.TimeStampData());
                break;
            case Index::CPU:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    schedSliceObj_.CpusData());
                break;
            case Index::INTERNAL_TID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    schedSliceObj_.InternalTidsData());
                break;
            case Index::INTERNAL_PID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    schedSliceObj_.InternalPidsData());
                break;
            case Index::DUR:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    schedSliceObj_.DursData());
                break;
            default:
                break;
        }
    }

    auto schedSliceOrderbys = fc.GetOrderBys();
    for (auto i = static_cast<int32_t>(schedSliceOrderbys.size()) - 1; i >= 0; i--) {
        switch (static_cast<Index>(schedSliceOrderbys[i].iColumn)) {
            case Index::ID:
            case Index::TS:
                indexMap_->SortBy(schedSliceOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t SchedSliceTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(schedSliceObj_.IdsData()[CurrentRow()]));
            break;
        case Index::TS:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(schedSliceObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::DUR:
            SetTypeColumnInt64(schedSliceObj_.DursData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::TS_END:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(schedSliceObj_.TsEndData()[CurrentRow()]));
            break;
        case Index::CPU:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(schedSliceObj_.CpusData()[CurrentRow()]));
            break;
        case Index::INTERNAL_TID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(schedSliceObj_.InternalTidsData()[CurrentRow()]));
            break;
        case Index::INTERNAL_PID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(schedSliceObj_.InternalPidsData()[CurrentRow()]));
            break;
        case Index::END_STATE: {
            const std::string &str = dataCache_->GetConstSchedStateData(schedSliceObj_.EndStatesData()[CurrentRow()]);
            sqlite3_result_text(context_, str.c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        }
        case Index::PRIORITY:
            sqlite3_result_int(context_, schedSliceObj_.PriorityData()[CurrentRow()]);
            break;
        case Index::ARGSETID: {
            const uint32_t &argSetId = schedSliceObj_.ArgSetData()[CurrentRow()];
            if (argSetId != INVALID_UINT32) {
                sqlite3_result_int(context_, argSetId);
            }
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void SchedSliceTable::GetOrbyes(FilterConstraints &schedfc, EstimatedIndexInfo &schedei)
{
    auto schedorderbys = schedfc.GetOrderBys();
    for (auto i = 0; i < schedorderbys.size(); i++) {
        switch (static_cast<Index>(schedorderbys[i].iColumn)) {
            case Index::ID:
            case Index::TS:
                break;
            default: // other columns can be sorted by SQLite
                schedei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
