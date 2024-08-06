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

#include "perf_napi_async_table.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    TS,
    TRACEID,
    CPU_ID,
    THREAD_ID,
    PROCESS_ID,
    CALLER_CALLCHAINID,
    CALLEE_CALLCHAINID,
    PERF_SAMPLE_ID,
    EVENT_COUNT,
    EVENT_TYPE_ID,
};
PerfNapiAsyncTable::PerfNapiAsyncTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.emplace_back("id", "INTEGER");
    tableColumn_.emplace_back("ts", "INTEGER");
    tableColumn_.emplace_back("traceid", "TEXT");
    tableColumn_.emplace_back("cpu_id", "INTEGER");
    tableColumn_.emplace_back("thread_id", "INTEGER");
    tableColumn_.emplace_back("process_id", "INTEGER");
    tableColumn_.emplace_back("caller_callchainid", "INTEGER");
    tableColumn_.emplace_back("callee_callchainid", "INTEGER");
    tableColumn_.emplace_back("perf_sample_id", "INTEGER");
    tableColumn_.emplace_back("event_count", "INTEGER");
    tableColumn_.emplace_back("event_type_id", "INTEGER");
    tablePriKey_.emplace_back("id");
}

PerfNapiAsyncTable::~PerfNapiAsyncTable() {}

void PerfNapiAsyncTable::FilterByConstraint(FilterConstraints &napiAsyncFc,
                                            double &napiAsyncFilterCost,
                                            size_t napiAsyncRowCount,
                                            uint32_t napiAsyncCurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &napiAsyncC = napiAsyncFc.GetConstraints()[napiAsyncCurrenti];
    switch (static_cast<Index>(napiAsyncC.col)) {
        case Index::ID: {
            if (CanFilterId(napiAsyncC.op, napiAsyncRowCount)) {
                napiAsyncFc.UpdateConstraint(napiAsyncCurrenti, true);
                napiAsyncFilterCost += 1; // id can position by 1 step
            } else {
                napiAsyncFilterCost += napiAsyncRowCount; // scan all rows
            }
            break;
        }
        default:                                      // other column
            napiAsyncFilterCost += napiAsyncRowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> PerfNapiAsyncTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

PerfNapiAsyncTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstPerfNapiAsyncData().Size())),
      perfNapiAsyncObj_(dataCache->GetConstPerfNapiAsyncData())
{
}

PerfNapiAsyncTable::Cursor::~Cursor() {}

int32_t PerfNapiAsyncTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto perfNapiAsyncCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(perfNapiAsyncCs, sId);
    for (size_t i = 0; i < perfNapiAsyncCs.size(); i++) {
        const auto &c = perfNapiAsyncCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::TRACEID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfNapiAsyncObj_.Traceids());
                break;
            case Index::THREAD_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfNapiAsyncObj_.InternalTidsData());
                break;
            case Index::CALLER_CALLCHAINID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfNapiAsyncObj_.CallerCallchainids());
                break;
            case Index::CALLEE_CALLCHAINID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    perfNapiAsyncObj_.CalleeCallchainids());
                break;
            default:
                break;
        }
    }

    auto perfNapiAsyncOrderbys = fc.GetOrderBys();
    for (auto i = perfNapiAsyncOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(perfNapiAsyncOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(perfNapiAsyncOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t PerfNapiAsyncTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, perfNapiAsyncObj_.IdsData()[CurrentRow()]);
            break;
        case Index::TS:
            SetTypeColumnInt64(perfNapiAsyncObj_.TimeStampData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::TRACEID:
            SetTypeColumnText(perfNapiAsyncObj_.Traceids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CPU_ID:
            SetTypeColumnInt64(perfNapiAsyncObj_.CpuIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::THREAD_ID:
            SetTypeColumnInt64(perfNapiAsyncObj_.InternalTidsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::PROCESS_ID:
            SetTypeColumnInt64(perfNapiAsyncObj_.ProcessIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CALLER_CALLCHAINID:
            SetTypeColumnInt64(perfNapiAsyncObj_.CallerCallchainids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CALLEE_CALLCHAINID:
            SetTypeColumnInt64(perfNapiAsyncObj_.CalleeCallchainids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::PERF_SAMPLE_ID:
            SetTypeColumnInt64(perfNapiAsyncObj_.PerfSampleIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::EVENT_COUNT:
            SetTypeColumnInt64(perfNapiAsyncObj_.EventCounts()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::EVENT_TYPE_ID:
            SetTypeColumnInt64(perfNapiAsyncObj_.EventTypeIds()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void PerfNapiAsyncTable::GetOrbyes(FilterConstraints &napiAsyncFc, EstimatedIndexInfo &napiAsyncEi)
{
    auto napiAsyncOrderbys = napiAsyncFc.GetOrderBys();
    for (auto i = 0; i < napiAsyncOrderbys.size(); i++) {
        switch (static_cast<Index>(napiAsyncOrderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                napiAsyncEi.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
