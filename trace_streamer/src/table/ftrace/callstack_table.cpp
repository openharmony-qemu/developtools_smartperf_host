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

#include "callstack_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    TS,
    DURS,
    CALL_IDS,
    CATS,
    NAME,
    DEPTHS,
    COOKIES_ID,
    PARENT_ID,
    ARGSET,
    CHAIN_IDS,
    SPAN_IDS,
    PARENT_SPAN_IDS,
    FLAGS
};
CallStackTable::CallStackTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cat", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("depth", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cookie", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("parent_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("argsetid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("chainId", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("spanId", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("parentSpanId", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("flag", "TEXT"));
    tablePriKey_.push_back("callid");
    tablePriKey_.push_back("ts");
    tablePriKey_.push_back("depth");
}

CallStackTable::~CallStackTable() {}

void CallStackTable::FilterByConstraint(FilterConstraints &callfc,
                                        double &callfilterCost,
                                        size_t callrowCount,
                                        uint32_t callCurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &callc = callfc.GetConstraints()[callCurrenti];
    switch (static_cast<Index>(callc.col)) {
        case Index::ID: {
            if (CanFilterId(callc.op, callrowCount)) {
                callfc.UpdateConstraint(callCurrenti, true);
                callfilterCost += 1; // id can position by 1 step
            } else {
                callfilterCost += callrowCount; // scan all rows
            }
            break;
        }
        default:                            // other column
            callfilterCost += callrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> CallStackTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

CallStackTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstInternalSlicesData().Size())),
      slicesObj_(dataCache->GetConstInternalSlicesData())
{
}

CallStackTable::Cursor::~Cursor() {}

int32_t CallStackTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto callStackTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(callStackTabCs, sId);
    for (size_t i = 0; i < callStackTabCs.size(); i++) {
        const auto &c = callStackTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::TS:
                FilterTS(c.op, argv[c.idxInaConstraint], slicesObj_.TimeStampData());
                break;
            case Index::CALL_IDS:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    slicesObj_.CallIds());
                break;
            case Index::COOKIES_ID:
                indexMap_->MixRange(c.op, static_cast<int64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    slicesObj_.Cookies());
                break;
            default:
                break;
        }
    }

    auto callStackTableOrderbys = fc.GetOrderBys();
    for (auto i = callStackTableOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(callStackTableOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(callStackTableOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t CallStackTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(slicesObj_.IdsData()[CurrentRow()]));
            break;
        case Index::TS:
            SetTypeColumnInt64(slicesObj_.TimeStampData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::DURS:
            SetTypeColumnInt64(slicesObj_.DursData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CALL_IDS:
            SetTypeColumnInt64(slicesObj_.CallIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CATS: {
            SetTypeColumnText(slicesObj_.CatsData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::NAME: {
            SetTypeColumnText(slicesObj_.NamesData()[CurrentRow()], INVALID_UINT64);
            break;
            default:
                HandleTypeColumns(col);
        }
    }
    return SQLITE_OK;
}
void CallStackTable::Cursor::HandleTypeColumns(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::DEPTHS:
            SetTypeColumnInt64(slicesObj_.Depths()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::COOKIES_ID:
            SetTypeColumnInt64(slicesObj_.Cookies()[CurrentRow()], INVALID_INT64);
            break;
        case Index::PARENT_ID: {
            if (slicesObj_.ParentIdData()[CurrentRow()].has_value()) {
                sqlite3_result_int64(context_, static_cast<int64_t>(slicesObj_.ParentIdData()[CurrentRow()].value()));
            }
            break;
        }
        case Index::ARGSET:
            SetTypeColumnInt64(slicesObj_.ArgSetIdsData()[CurrentRow()], INVALID_UINT32);
            break;
        case Index::CHAIN_IDS:
            SetTypeColumnTextNotEmpty(slicesObj_.ChainIds()[CurrentRow()].empty(),
                                      slicesObj_.ChainIds()[CurrentRow()].c_str());
            break;
        case Index::SPAN_IDS:
            SetTypeColumnTextNotEmpty(slicesObj_.SpanIds()[CurrentRow()].empty(),
                                      slicesObj_.SpanIds()[CurrentRow()].c_str());
            break;
        case Index::PARENT_SPAN_IDS:
            SetTypeColumnTextNotEmpty(slicesObj_.ParentSpanIds()[CurrentRow()].empty(),
                                      slicesObj_.ParentSpanIds()[CurrentRow()].c_str());
            break;
        case Index::FLAGS:
            SetTypeColumnTextNotEmpty(slicesObj_.Flags()[CurrentRow()].empty(),
                                      slicesObj_.Flags()[CurrentRow()].c_str());
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
}
void CallStackTable::GetOrbyes(FilterConstraints &callfc, EstimatedIndexInfo &callei)
{
    auto orderbys = callfc.GetOrderBys();
    for (auto i = 0; i < orderbys.size(); i++) {
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                callei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
