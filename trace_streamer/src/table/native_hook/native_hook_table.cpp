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

#include "native_hook_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    IPID,
    ITID,
    EVENT_TYPE,
    SUB_TYPE_ID,
    START_TS,
    END_TS,
    DURATION,
    ADDR,
    MEM_SIZE,
    ALL_MEM_SIZE,
    CURRENT_SIZE_DUR,
    LAST_LIB_ID,
    LAST_SYMBOL_ID
};
NativeHookTable::NativeHookTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("event_type", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("sub_type_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("addr", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("heap_size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("all_heap_size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("current_size_dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("last_lib_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("last_symbol_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

NativeHookTable::~NativeHookTable() {}

void NativeHookTable::FilterByConstraint(FilterConstraints& hookfc,
                                         double& hookfilterCost,
                                         size_t hookrowCount,
                                         uint32_t hookcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& hookc = hookfc.GetConstraints()[hookcurrenti];
    switch (static_cast<Index>(hookc.col)) {
        case Index::ID: {
            if (CanFilterId(hookc.op, hookrowCount)) {
                hookfc.UpdateConstraint(hookcurrenti, true);
                hookfilterCost += 1; // id can position by 1 step
            } else {
                hookfilterCost += hookrowCount; // scan all rows
            }
            break;
        }
        default:                            // other column
            hookfilterCost += hookrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> NativeHookTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

NativeHookTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstNativeHookData().Size())),
      nativeHookObj_(dataCache->GetConstNativeHookData())
{
}

NativeHookTable::Cursor::~Cursor() {}

int32_t NativeHookTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto nativeHookCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(nativeHookCs, sId);
    for (size_t i = 0; i < nativeHookCs.size(); i++) {
        const auto& c = nativeHookCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            case Index::IPID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[i])), nativeHookObj_.Ipids());
                break;
            case Index::ITID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[i])),
                                    nativeHookObj_.InternalTidsData());
                break;
            case Index::CALLCHAIN_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[i])),
                                    nativeHookObj_.CallChainIds());
                break;
            default:
                break;
        }
    }

    auto nativeHookOrderbys = fc.GetOrderBys();
    for (auto i = nativeHookOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(nativeHookOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(nativeHookOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t NativeHookTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(nativeHookObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            SetTypeColumn(nativeHookObj_.CallChainIds()[CurrentRow()], INVALID_UINT32, INVALID_CALL_CHAIN_ID);
            break;
        case Index::IPID:
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.Ipids()[CurrentRow()]));
            break;
        case Index::ITID:
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.InternalTidsData()[CurrentRow()]));
            break;
        case Index::EVENT_TYPE: {
            SetTypeColumnTextNotEmpty(nativeHookObj_.EventTypes()[CurrentRow()].empty(),
                                      nativeHookObj_.EventTypes()[CurrentRow()].c_str());
            break;
        }
        case Index::SUB_TYPE_ID: {
            SetTypeColumnInt64(nativeHookObj_.SubTypes()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::START_TS:
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::END_TS:
            if (static_cast<int64_t>(nativeHookObj_.EndTimeStamps()[CurrentRow()]) != 0) {
                sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.EndTimeStamps()[CurrentRow()]));
            }
            break;
        default:
            HandleTypeColumns(column);
    }
    return SQLITE_OK;
}

void NativeHookTable::Cursor::HandleTypeColumns(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::DURATION:
            if (static_cast<int64_t>(nativeHookObj_.Durations()[CurrentRow()]) != 0) {
                sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.Durations()[CurrentRow()]));
            }
            break;
        case Index::ADDR: {
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.Addrs()[CurrentRow()]));
            break;
        }
        case Index::MEM_SIZE: {
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.MemSizes()[CurrentRow()]));
            break;
        }
        case Index::ALL_MEM_SIZE: {
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.AllMemSizes()[CurrentRow()]));
            break;
        }
        case Index::CURRENT_SIZE_DUR: {
            sqlite3_result_int64(context_, static_cast<int64_t>(nativeHookObj_.CurrentSizeDurs()[CurrentRow()]));
            break;
        }
        case Index::LAST_LIB_ID: {
            SetTypeColumnInt64(nativeHookObj_.LastCallerPathIndexs()[CurrentRow()], INVALID_DATAINDEX);
            break;
        }
        case Index::LAST_SYMBOL_ID: {
            SetTypeColumnInt64(nativeHookObj_.LastSymbolIndexs()[CurrentRow()], INVALID_DATAINDEX);
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
}
void NativeHookTable::GetOrbyes(FilterConstraints& hookfc, EstimatedIndexInfo& hookei)
{
    auto hookorderbys = hookfc.GetOrderBys();
    for (auto i = 0; i < hookorderbys.size(); i++) {
        switch (static_cast<Index>(hookorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                hookei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
