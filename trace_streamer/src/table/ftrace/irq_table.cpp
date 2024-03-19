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

#include "irq_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    TS,
    DURS,
    CALL_IDS,
    CAT,
    NAME,
    DEPTH,
    COOKIE_ID,
    PARENT_ID,
    ARGSET,
    CHAIN_IDS,
    SPAN_IDS,
    PARENT_SPAN_IDS,
    FLAG,
    ARGS
};
IrqTable::IrqTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.emplace_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("callid", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("cat", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("depth", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("cookie", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("parent_id", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("argsetid", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("spanId", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("parentSpanId", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("flag", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("args", "TEXT"));
    tablePriKey_.emplace_back("callid");
    tablePriKey_.emplace_back("ts");
    tablePriKey_.emplace_back("depth");
}

IrqTable::~IrqTable() {}

void IrqTable::FilterByConstraint(FilterConstraints& irqfc,
                                  double& irqfilterCost,
                                  size_t irqrowCount,
                                  uint32_t irqcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& irqc = irqfc.GetConstraints()[irqcurrenti];
    switch (static_cast<Index>(irqc.col)) {
        case Index::ID: {
            if (CanFilterId(irqc.op, irqrowCount)) {
                irqfc.UpdateConstraint(irqcurrenti, true);
                irqfilterCost += 1; // id can position by 1 step
            } else {
                irqfilterCost += irqrowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            irqfilterCost += irqrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> IrqTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

IrqTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstIrqData().Size())),
      slicesObj_(dataCache->GetConstIrqData())
{
}

IrqTable::Cursor::~Cursor() {}

int32_t IrqTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto& irqCs = fc.GetConstraints();
    for (size_t i = 0; i < irqCs.size(); i++) {
        const auto& c = irqCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto irqTableOrderbys = fc.GetOrderBys();
    for (auto i = irqTableOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(irqTableOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(irqTableOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t IrqTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, CurrentRow());
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
        case Index::CAT: {
            SetTypeColumnText(slicesObj_.CatsData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::NAME: {
            SetTypeColumnText(slicesObj_.NamesData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::DEPTH:
            sqlite3_result_int64(context_, static_cast<int64_t>(slicesObj_.Depths()[CurrentRow()]));
            break;
        default:
            HandleTypeColumns(column);
    }
    return SQLITE_OK;
}
void IrqTable::Cursor::HandleTypeColumns(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::COOKIE_ID:
            SetTypeColumnInt64(slicesObj_.Cookies()[CurrentRow()], INVALID_UINT64);
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
            sqlite3_result_text(context_, slicesObj_.ChainIds()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::SPAN_IDS:
            sqlite3_result_text(context_, slicesObj_.SpanIds()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::PARENT_SPAN_IDS:
            sqlite3_result_text(context_, slicesObj_.ParentSpanIds()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::FLAG:
            sqlite3_result_text(context_, slicesObj_.Flags()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        case Index::ARGS:
            sqlite3_result_text(context_, slicesObj_.ArgsData()[CurrentRow()].c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
}
void IrqTable::GetOrbyes(FilterConstraints& irqfc, EstimatedIndexInfo& irqei)
{
    auto irqorderbys = irqfc.GetOrderBys();
    for (auto i = 0; i < irqorderbys.size(); i++) {
        switch (static_cast<Index>(irqorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                irqei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
