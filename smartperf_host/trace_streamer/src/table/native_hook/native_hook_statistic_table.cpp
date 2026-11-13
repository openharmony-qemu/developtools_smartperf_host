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

#include "native_hook_statistic_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    IPID,
    TS,
    MEMORY_TYPE,
    MEMORY_SUB_TYPE,
    APPLY_COUNT,
    RELEASE_COUNT,
    APPLY_SIZE,
    RELEASE_SIZE,
    LAST_LIB_ID,
    LAST_SYMBOL_ID
};
NativeHookStatisticTable::NativeHookStatisticTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("type", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("sub_type_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("apply_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("release_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("apply_size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("release_size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("last_lib_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("last_symbol_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

NativeHookStatisticTable::~NativeHookStatisticTable() {}

void NativeHookStatisticTable::FilterByConstraint(FilterConstraints &statisticfc,
                                                  double &statisticfilterCost,
                                                  size_t statisticrowCount,
                                                  uint32_t statisticcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &statisticc = statisticfc.GetConstraints()[statisticcurrenti];
    switch (static_cast<Index>(statisticc.col)) {
        case Index::ID: {
            if (CanFilterId(statisticc.op, statisticrowCount)) {
                statisticfc.UpdateConstraint(statisticcurrenti, true);
                statisticfilterCost += 1; // id can position by 1 step
            } else {
                statisticfilterCost += statisticrowCount; // scan all rows
            }
            break;
        }
        default:                                      // other column
            statisticfilterCost += statisticrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> NativeHookStatisticTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

NativeHookStatisticTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstNativeHookStatisticData().Size())),
      nativeHookStatisticInfoObj_(dataCache->GetConstNativeHookStatisticData())
{
}

NativeHookStatisticTable::Cursor::~Cursor() {}

int32_t NativeHookStatisticTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto nativeHookStatisticCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(nativeHookStatisticCs, sId);
    for (size_t i = 0; i < nativeHookStatisticCs.size(); i++) {
        const auto &c = nativeHookStatisticCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::CALLCHAIN_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    nativeHookStatisticInfoObj_.CallChainIds());
                break;
            default:
                break;
        }
    }

    auto nativeHookStatisticOrderbys = fc.GetOrderBys();
    for (auto i = nativeHookStatisticOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(nativeHookStatisticOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(nativeHookStatisticOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t NativeHookStatisticTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(nativeHookStatisticInfoObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            SetTypeColumn(nativeHookStatisticInfoObj_.CallChainIds()[CurrentRow()], INVALID_UINT32,
                          INVALID_CALL_CHAIN_ID);
            break;
        case Index::IPID:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.Ipids()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::TS:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.TimeStampData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::MEMORY_TYPE:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.MemoryTypes()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::MEMORY_SUB_TYPE:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.MemorySubTypes()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::APPLY_COUNT:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.ApplyCounts()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::RELEASE_COUNT:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.ReleaseCounts()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::APPLY_SIZE:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.ApplySizes()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::RELEASE_SIZE:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.ReleaseSizes()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::LAST_LIB_ID:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.LastCallerPathIndexs()[CurrentRow()], INVALID_DATAINDEX);
            break;
        case Index::LAST_SYMBOL_ID:
            SetTypeColumnInt64(nativeHookStatisticInfoObj_.LastSymbolIndexs()[CurrentRow()], INVALID_DATAINDEX);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void NativeHookStatisticTable::GetOrbyes(FilterConstraints &statisticfc, EstimatedIndexInfo &statisticei)
{
    auto statisticorderbys = statisticfc.GetOrderBys();
    for (auto i = 0; i < statisticorderbys.size(); i++) {
        switch (static_cast<Index>(statisticorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                statisticei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
