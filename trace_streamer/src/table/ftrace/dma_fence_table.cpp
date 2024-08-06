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

#include "dma_fence_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TS, DURS, CAT, DRIVER, TIMELINE, CONTEXT, SEQNO };
DmaFenceTable::DmaFenceTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.emplace_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("cat", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("driver", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("timeline", "TEXT"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("context", "INTEGER"));
    tableColumn_.emplace_back(TableBase::ColumnInfo("seqno", "INTEGER"));
    tablePriKey_.push_back("id");
}

DmaFenceTable::~DmaFenceTable() {}

void DmaFenceTable::FilterByConstraint(FilterConstraints &dmaFencefc,
                                       double &dmaFencefilterCost,
                                       size_t dmaFencerowCount,
                                       uint32_t dmaFencecurrenti)
{
    const auto &dmaFencec = dmaFencefc.GetConstraints()[dmaFencecurrenti];
    switch (static_cast<Index>(dmaFencec.col)) {
        case Index::ID: {
            if (CanFilterId(dmaFencec.op, dmaFencerowCount)) {
                dmaFencefc.UpdateConstraint(dmaFencecurrenti, true);
                dmaFencefilterCost += 1; // id can position by 1 step
            } else {
                dmaFencefilterCost += dmaFencerowCount; // scan all rows
            }
            break;
        }
        default:                                    // other column
            dmaFencefilterCost += dmaFencerowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> DmaFenceTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

DmaFenceTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstDmaFenceData().Size())),
      dmaFenceObj_(dataCache->GetConstDmaFenceData())
{
}

DmaFenceTable::Cursor::~Cursor() {}

int32_t DmaFenceTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto DmaFenceTabCs = fc.GetConstraints();
    for (size_t i = 0; i < DmaFenceTabCs.size(); i++) {
        const auto &c = DmaFenceTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            case Index::TS:
                FilterTS(c.op, argv[i], dmaFenceObj_.TimelinesData());
                break;
            default:
                break;
        }
    }

    auto DmaFenceTabOrderbys = fc.GetOrderBys();
    for (auto i = DmaFenceTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(DmaFenceTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(DmaFenceTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t DmaFenceTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, CurrentRow());
            break;
        case Index::TS:
            SetTypeColumnInt64(dmaFenceObj_.TimeStampData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::DURS:
            SetTypeColumnInt64(dmaFenceObj_.DursData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CAT: {
            SetTypeColumnText(dmaFenceObj_.CatsData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::DRIVER: {
            SetTypeColumnText(dmaFenceObj_.DriversData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::TIMELINE: {
            SetTypeColumnText(dmaFenceObj_.TimelinesData()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::CONTEXT: {
            SetTypeColumnInt32(dmaFenceObj_.ContextsData()[CurrentRow()], INVALID_UINT32);
            break;
        }
        case Index::SEQNO: {
            SetTypeColumnInt32(dmaFenceObj_.SeqnosData()[CurrentRow()], INVALID_UINT32);
            break;
        }
        default:
            break;
    }
    return SQLITE_OK;
}

void DmaFenceTable::GetOrbyes(FilterConstraints &dmaFencefc, EstimatedIndexInfo &dmaFenceei)
{
    auto dmaFenceorderbys = dmaFencefc.GetOrderBys();
    for (auto i = 0; i < dmaFenceorderbys.size(); i++) {
        switch (static_cast<Index>(dmaFenceorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                dmaFenceei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning