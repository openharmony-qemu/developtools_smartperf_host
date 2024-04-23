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

#include "thread_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, ITID, TID, NAME, START_TS, END_TS, INTERNAL_PID, IS_MAIN_THREAD, SWITCH_COUNT };
ThreadTable::ThreadTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("is_main_thread", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("switch_count", "INTEGER"));
    tablePriKey_.push_back("id");
}

ThreadTable::~ThreadTable() {}

void ThreadTable::FilterByConstraint(FilterConstraints &threadfc,
                                     double &threadfilterCost,
                                     size_t threadrowCount,
                                     uint32_t threadcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &threadc = threadfc.GetConstraints()[threadcurrenti];
    switch (static_cast<Index>(threadc.col)) {
        case Index::ITID:
        case Index::ID: {
            if (CanFilterId(threadc.op, threadrowCount)) {
                threadfc.UpdateConstraint(threadcurrenti, true);
                threadfilterCost += 1; // id can position by 1 step
            } else {
                threadfilterCost += threadrowCount; // scan all rows
            }
            break;
        }
        default:                                // other column
            threadfilterCost += threadrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> ThreadTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

ThreadTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, dataCache->ThreadSize())
{
}

ThreadTable::Cursor::~Cursor() {}

int32_t ThreadTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMapBack_
    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }
    indexMapBack_ = indexMap_.get();
    if (indexMap_->HasData()) {
        indexMapBack_ = std::make_unique<IndexMap>(0, rowCount_).get();
    }
    auto cs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(cs, sId);
    for (size_t i = 0; i < cs.size(); i++) {
        const auto &c = cs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
            case Index::ITID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            default:
                break;
        }
    }
    if (indexMap_->HasData()) {
        indexMap_->Merge(indexMapBack_);
    }

    auto orderbys = fc.GetOrderBys();
    for (auto i = orderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::ID:
            case Index::ITID:
                indexMap_->SortBy(orderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t ThreadTable::Cursor::Column(int32_t col) const
{
    const auto &thread = dataCache_->GetConstThreadData(CurrentRow());
    switch (static_cast<Index>(col)) {
        case Index::ID:
        case Index::ITID: {
            sqlite3_result_int64(context_, CurrentRow());
            break;
        }
        case Index::TID: {
            SetTypeColumnInt64(thread.tid_, INVALID_UINT32);
            break;
        }
        case Index::NAME: {
            SetNameColumn(thread);
            break;
        }
        case Index::START_TS:
            SetTypeColumnInt64NotZero(thread.startT_);
            break;
        case Index::END_TS:
            SetTypeColumnInt64NotZero(thread.endT_);

            break;
        case Index::INTERNAL_PID:
            SetTypeColumnInt32(thread.internalPid_, INVALID_UINT32);
            break;
        case Index::IS_MAIN_THREAD: {
            // When it is not clear which process the thread belongs to, is_main_thread should be set to null
            if (thread.internalPid_ == INVALID_UINT32) {
                break;
            }
            const auto &process = dataCache_->GetConstProcessData(thread.internalPid_);
            sqlite3_result_int(context_, thread.tid_ == process.pid_);
            break;
        }
        case Index::SWITCH_COUNT: {
            // When it is not clear which process the thread belongs to, is_main_thread should be set to null
            sqlite3_result_int(context_, thread.switchCount_);
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void ThreadTable::Cursor::SetNameColumn(const Thread &thread) const
{
    const auto &name = dataCache_->GetDataFromDict(thread.nameIndex_);
    if (name.size()) {
        sqlite3_result_text(context_, name.c_str(), static_cast<int32_t>(name.length()), nullptr);
    }
}

void ThreadTable::Cursor::FilterId(unsigned char op, sqlite3_value *argv)
{
    auto type = sqlite3_value_type(argv);
    if (type != SQLITE_INTEGER) {
        // other type consider it NULL
        indexMapBack_->Intersect(0, 0);
        return;
    }

    auto threadTabArgv = static_cast<TableRowId>(sqlite3_value_int64(argv));
    switch (op) {
        case SQLITE_INDEX_CONSTRAINT_EQ:
            indexMapBack_->Intersect(threadTabArgv, threadTabArgv + 1);
            break;
        case SQLITE_INDEX_CONSTRAINT_GE:
            indexMapBack_->Intersect(threadTabArgv, rowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_GT:
            threadTabArgv++;
            indexMapBack_->Intersect(threadTabArgv, rowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_LE:
            threadTabArgv++;
            indexMapBack_->Intersect(0, threadTabArgv);
            break;
        case SQLITE_INDEX_CONSTRAINT_LT:
            indexMapBack_->Intersect(0, threadTabArgv);
            break;
        default:
            // can't filter, all rows
            break;
    }
}
void ThreadTable::GetOrbyes(FilterConstraints &fc, EstimatedIndexInfo &ei)
{
    auto orderbys = fc.GetOrderBys();
    for (auto i = 0; i < orderbys.size(); i++) {
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::ITID:
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                ei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
