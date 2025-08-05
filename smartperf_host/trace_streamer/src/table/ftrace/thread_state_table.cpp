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

#include "thread_state_table.h"
#include "thread_state_flag.h"

#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TS, DUR, CPU, INTERNAL_TID, TID, PID, STATE, ARGSETID };
ThreadStateTable::ThreadStateTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cpu", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("pid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("state", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("arg_setid", "INTEGER"));
    tablePriKey_.push_back("id");
}

ThreadStateTable::~ThreadStateTable() {}

void ThreadStateTable::FilterByConstraint(FilterConstraints &statefc,
                                          double &statefilterCost,
                                          size_t staterowCount,
                                          uint32_t statecurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &statec = statefc.GetConstraints()[statecurrenti];
    switch (static_cast<Index>(statec.col)) {
        case Index::ID: {
            if (CanFilterId(statec.op, staterowCount)) {
                statefc.UpdateConstraint(statecurrenti, true);
                statefilterCost += 1; // id can position by 1 step
            } else {
                statefilterCost += staterowCount; // scan all rows
            }
            break;
        }
        case Index::TS: {
            auto stateoldRowCount = staterowCount;
            if (CanFilterSorted(statec.op, staterowCount)) {
                statefc.UpdateConstraint(statecurrenti, true);
                statefilterCost += log2(stateoldRowCount); // binary search
            } else {
                statefilterCost += stateoldRowCount;
            }
            break;
        }
        default:                              // other column
            statefilterCost += staterowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> ThreadStateTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

ThreadStateTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, dataCache->GetConstThreadStateData().Size()),
      threadStateObj_(dataCache->GetConstThreadStateData())
{
}

ThreadStateTable::Cursor::~Cursor() {}

int32_t ThreadStateTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset
    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }
    IndexMap *indexMapBack = indexMap_.get();
    if (indexMap_->HasData()) {
        indexMapBack = std::make_unique<IndexMap>(0, rowCount_).get();
    }
    HandleIndex(fc, argv, indexMapBack);
    if (indexMap_->HasData()) {
        indexMap_->Merge(indexMapBack);
    }

    auto ThreadStateOrderbys = fc.GetOrderBys();
    for (auto i = ThreadStateOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(ThreadStateOrderbys[i].iColumn)) {
            case Index::ID:
            case Index::TS:
                indexMap_->SortBy(ThreadStateOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

void ThreadStateTable::Cursor::HandleIndex(const FilterConstraints &fc, sqlite3_value **argv, IndexMap *indexMapBack)
{
    auto cs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(cs, sId);
    for (size_t i = 0; i < cs.size(); i++) {
        const auto &c = cs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                indexMapBack->FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::TS:
                indexMapBack->FilterTS(c.op, argv[c.idxInaConstraint], threadStateObj_.TimeStampData());
                break;
            case Index::INTERNAL_TID:
                indexMapBack->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                       threadStateObj_.ItidsData());
                break;
            case Index::TID:
                indexMapBack->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                       threadStateObj_.TidsData());
                break;
            case Index::PID:
                indexMapBack->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                       threadStateObj_.PidsData());
                break;
            case Index::DUR:
                indexMapBack->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                       threadStateObj_.DursData());
                break;
            case Index::CPU:
                indexMapBack->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                       threadStateObj_.CpusData());
                break;
            case Index::STATE:
                indexMapBack->MixRange(
                    c.op,
                    static_cast<DataIndex>(dataCache_->GetThreadStateValue(
                        std::string(reinterpret_cast<const char *>(sqlite3_value_text(argv[c.idxInaConstraint]))))),
                    threadStateObj_.StatesData());
                break;
            case Index::ARGSETID:
                indexMapBack->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                       threadStateObj_.ArgSetsData());
                break;
            default:
                break;
        }
    }
}

int32_t ThreadStateTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(threadStateObj_.IdsData()[CurrentRow()]));
            break;
        case Index::TS:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::DUR:
            SetTypeColumnInt64(threadStateObj_.DursData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CPU:
            if (threadStateObj_.CpusData()[CurrentRow()] != INVALID_CPU) {
                sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.CpusData()[CurrentRow()]));
            }
            break;
        case Index::INTERNAL_TID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.ItidsData()[CurrentRow()]));
            break;
        case Index::TID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.TidsData()[CurrentRow()]));
            break;
        case Index::PID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.PidsData()[CurrentRow()]));
            break;
        case Index::STATE: {
            const std::string &str = dataCache_->GetConstSchedStateData(threadStateObj_.StatesData()[CurrentRow()]);
            sqlite3_result_text(context_, str.c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        }
        case Index::ARGSETID:
            if (threadStateObj_.ArgSetsData()[CurrentRow()] != INVALID_UINT32) {
                sqlite3_result_int64(context_, static_cast<sqlite3_int64>(threadStateObj_.ArgSetsData()[CurrentRow()]));
            }
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void ThreadStateTable::GetOrbyes(FilterConstraints &statefc, EstimatedIndexInfo &stateei)
{
    auto stateorderbys = statefc.GetOrderBys();
    for (auto i = 0; i < stateorderbys.size(); i++) {
        switch (static_cast<Index>(stateorderbys[i].iColumn)) {
            case Index::ID:
            case Index::TS:
                break;
            default: // other columns can be sorted by SQLite
                stateei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
