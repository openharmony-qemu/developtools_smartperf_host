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

#include "process_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, IPID, PID, NAME, START_TS, SWITCH_COUNT, THREAD_COUNT, SLICE_COUNT, MEM_COUNT };
ProcessTable::ProcessTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("pid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("switch_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("slice_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("mem_count", "INTEGER"));
    tablePriKey_.push_back("id");
}

ProcessTable::~ProcessTable() {}

void ProcessTable::FilterByConstraint(FilterConstraints &processfc,
                                      double &processfilterCost,
                                      size_t processrowCount,
                                      uint32_t processcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &processc = processfc.GetConstraints()[processcurrenti];
    switch (static_cast<Index>(processc.col)) {
        case Index::IPID:
        case Index::ID: {
            if (CanFilterId(processc.op, processrowCount)) {
                processfc.UpdateConstraint(processcurrenti, true);
                processfilterCost += 1; // id can position by 1 step
            } else {
                processfilterCost += processrowCount; // scan all rows
            }
            break;
        }
        default:                                  // other column
            processfilterCost += processrowCount; // scan all rows
            break;
    }
}

int32_t ProcessTable::Update(int32_t argc, sqlite3_value **argv, sqlite3_int64 *pRowid)
{
    if (argc <= 1) {
        return SQLITE_READONLY;
    }
    if (sqlite3_value_type(argv[0]) == SQLITE_NULL) {
        return SQLITE_READONLY;
    }
    auto id = sqlite3_value_int64(argv[0]);
    auto process = wdataCache_->GetProcessData(static_cast<InternalPid>(id));
    constexpr int32_t colOffset = 2;
    for (auto i = colOffset; i < argc; i++) {
        auto col = i - colOffset;
        if (static_cast<Index>(col) != Index::NAME) {
            continue;
        }
        const char *name = reinterpret_cast<const char *>(sqlite3_value_text(argv[i]));
        if (name == nullptr) {
            process->cmdLine_.clear();
        } else {
            process->cmdLine_ = name;
        }
        break;
    }
    return SQLITE_OK;
}

std::unique_ptr<TableBase::Cursor> ProcessTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

ProcessTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, dataCache->ProcessSize())
{
}

ProcessTable::Cursor::~Cursor() {}

int32_t ProcessTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto processTableCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(processTableCs, sId);
    for (size_t i = 0; i < processTableCs.size(); i++) {
        const auto &c = processTableCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
            case Index::IPID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::PID:
                FilterIndex(c.col, c.op, argv[c.idxInaConstraint]);
                break;
            default:
                break;
        }
    }

    auto processTableOrderbys = fc.GetOrderBys();
    for (auto i = processTableOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(processTableOrderbys[i].iColumn)) {
            case Index::ID:
            case Index::IPID:
                indexMap_->SortBy(processTableOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t ProcessTable::Cursor::Column(int32_t col) const
{
    const auto &process = dataCache_->GetConstProcessData(CurrentRow());
    switch (static_cast<Index>(col)) {
        case Index::ID:
        case Index::IPID:
            sqlite3_result_int64(context_, CurrentRow());
            break;
        case Index::PID:
            sqlite3_result_int64(context_, process.pid_);
            break;
        case Index::NAME:
            if (process.cmdLine_.size()) {
                sqlite3_result_text(context_, process.cmdLine_.c_str(), static_cast<int32_t>(process.cmdLine_.length()),
                                    nullptr);
            }
            break;
        case Index::START_TS:
            if (process.startT_) {
                sqlite3_result_int64(context_, static_cast<int64_t>(process.startT_));
            }
            break;
        case Index::SWITCH_COUNT:
            sqlite3_result_int64(context_, process.switchCount_);
            break;
        case Index::THREAD_COUNT:
            sqlite3_result_int64(context_, process.threadCount_);
            break;
        case Index::SLICE_COUNT:
            sqlite3_result_int64(context_, process.sliceSize_);
            break;
        case Index::MEM_COUNT:
            sqlite3_result_int64(context_, process.memSize_);
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}

void ProcessTable::Cursor::FilterPid(unsigned char op, uint64_t value)
{
    bool remove = false;
    if (indexMap_->HasData()) {
        indexMap_->CovertToIndexMap();
        remove = true;
    }
    switch (op) {
        case SQLITE_INDEX_CONSTRAINT_EQ:
            HandleIndexConstraintEQ(remove, value);
            break;
        case SQLITE_INDEX_CONSTRAINT_NE:
            HandleIndexConstraintNQ(remove, value);
            break;
        case SQLITE_INDEX_CONSTRAINT_ISNOTNULL:
            break;
        default:
            break;
    } // end of switch (op)
}
void ProcessTable::Cursor::HandleIndexConstraintEQ(bool remove, uint64_t value)
{
    if (remove) {
        for (auto i = indexMap_->rowIndex_.begin(); i != indexMap_->rowIndex_.end();) {
            if (dataCache_->GetConstProcessData()[*i].pid_ != value) {
                i = indexMap_->rowIndex_.erase(i);
            } else {
                i++;
            }
        }
    } else {
        for (auto i = 0; i < dataCache_->GetConstProcessData().size(); i++) {
            if (dataCache_->GetConstProcessData()[i].pid_ == value) {
                indexMap_->rowIndex_.push_back(i);
            }
        }
    }
    indexMap_->FixSize();
}
void ProcessTable::Cursor::HandleIndexConstraintNQ(bool remove, uint64_t value)
{
    if (remove) {
        for (auto i = indexMap_->rowIndex_.begin(); i != indexMap_->rowIndex_.end();) {
            if (dataCache_->GetConstProcessData()[*i].pid_ == value) {
                i = indexMap_->rowIndex_.erase(i);
            } else {
                i++;
            }
        }
    } else {
        for (auto i = 0; i < dataCache_->GetConstProcessData().size(); i++) {
            if (dataCache_->GetConstProcessData()[i].pid_ != value) {
                indexMap_->rowIndex_.push_back(i);
            }
        }
    }
    indexMap_->FixSize();
}
void ProcessTable::Cursor::FilterIndex(int32_t col, unsigned char op, sqlite3_value *argv)
{
    switch (static_cast<Index>(col)) {
        case Index::PID:
            /* code */
            FilterPid(op, static_cast<uint64_t>(sqlite3_value_int64(argv)));
            break;

        default:
            break;
    }
}
void ProcessTable::Cursor::FilterId(unsigned char op, sqlite3_value *argv)
{
    auto procArgv = static_cast<TableRowId>(sqlite3_value_int64(argv));
    switch (op) {
        case SQLITE_INDEX_CONSTRAINT_EQ:
            indexMap_->Intersect(procArgv, procArgv + 1);
            break;
        case SQLITE_INDEX_CONSTRAINT_GE:
            indexMap_->Intersect(procArgv, rowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_GT:
            procArgv++;
            indexMap_->Intersect(procArgv, rowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_LE:
            procArgv++;
            indexMap_->Intersect(0, procArgv);
            break;
        case SQLITE_INDEX_CONSTRAINT_LT:
            indexMap_->Intersect(0, procArgv);
            break;
        default:
            // can't filter, all rows
            break;
    }
}

void ProcessTable::GetOrbyes(FilterConstraints &processfc, EstimatedIndexInfo &processei)
{
    auto processorderbys = processfc.GetOrderBys();
    for (auto i = 0; i < processorderbys.size(); i++) {
        switch (static_cast<Index>(processorderbys[i].iColumn)) {
            case Index::IPID:
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                processei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
