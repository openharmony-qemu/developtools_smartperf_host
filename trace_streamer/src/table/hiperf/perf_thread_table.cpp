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

#include "perf_thread_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, THREAD_ID, PROCESS_ID, THREAD_NAME };
PerfThreadTable::PerfThreadTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("process_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_name", "TEXT"));
    tablePriKey_.push_back("id");
}

PerfThreadTable::~PerfThreadTable() {}

void PerfThreadTable::FilterByConstraint(FilterConstraints& threadfc,
                                         double& threadfilterCost,
                                         size_t threadRowCnt,
                                         uint32_t threadcurrenti)
{
    const auto& perfThreadc = threadfc.GetConstraints()[threadcurrenti];
    switch (static_cast<Index>(perfThreadc.col)) {
        case Index::ID: {
            if (CanFilterId(perfThreadc.op, threadRowCnt)) {
                threadfc.UpdateConstraint(threadcurrenti, true);
                threadfilterCost += 1; // id can position by 1 step
            } else {
                threadfilterCost += threadRowCnt; // scan all rows
            }
            break;
        }
        default:                              // other column
            threadfilterCost += threadRowCnt; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> PerfThreadTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

PerfThreadTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstPerfThreadData().Size())),
      perfThreadObj_(dataCache->GetConstPerfThreadData())
{
}

PerfThreadTable::Cursor::~Cursor() {}

int32_t PerfThreadTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto perfThreadCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(perfThreadCs, sId);
    for (size_t i = 0; i < perfThreadCs.size(); i++) {
        const auto& c = perfThreadCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            case Index::THREAD_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[i])), perfThreadObj_.Tids());
                break;
            case Index::PROCESS_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[i])), perfThreadObj_.Pids());
                break;
            default:
                break;
        }
    }

    auto perfThreadOrderbys = fc.GetOrderBys();
    for (auto i = perfThreadOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(perfThreadOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(perfThreadOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t PerfThreadTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(perfThreadObj_.IdsData()[CurrentRow()]));
            break;
        case Index::THREAD_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfThreadObj_.Tids()[CurrentRow()]));
            break;
        case Index::PROCESS_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfThreadObj_.Pids()[CurrentRow()]));
            break;
        case Index::THREAD_NAME:
            if (perfThreadObj_.ThreadNames()[CurrentRow()] != INVALID_UINT64) {
                auto threadNameIndex = static_cast<size_t>(perfThreadObj_.ThreadNames()[CurrentRow()]);
                if (dataCache_->GetDataFromDict(threadNameIndex).empty()) {
                    break;
                }
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(threadNameIndex).c_str(), STR_DEFAULT_LEN,
                                    nullptr);
            }
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void PerfThreadTable::GetOrbyes(FilterConstraints& threadfc, EstimatedIndexInfo& threadei)
{
    auto threadorderbys = threadfc.GetOrderBys();
    for (auto i = 0; i < threadorderbys.size(); i++) {
        switch (static_cast<Index>(threadorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                threadei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
