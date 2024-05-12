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

#include "frame_maps_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, SRC_ROW, DST_ROW };
FrameMapsTable::FrameMapsTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("src_row", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dst_row", "INTEGER"));
    tablePriKey_.push_back("id");
}

FrameMapsTable::~FrameMapsTable() {}

void FrameMapsTable::FilterByConstraint(FilterConstraints &mapfc,
                                        double &mapfilterCost,
                                        size_t maprowCount,
                                        uint32_t mapcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &mapc = mapfc.GetConstraints()[mapcurrenti];
    switch (static_cast<Index>(mapc.col)) {
        case Index::ID: {
            if (CanFilterId(mapc.op, maprowCount)) {
                mapfc.UpdateConstraint(mapcurrenti, true);
                mapfilterCost += 1; // id can position by 1 step
            } else {
                mapfilterCost += maprowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            mapfilterCost += maprowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> FrameMapsTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

FrameMapsTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstFrameMapsData().Size())),
      frameMapsObj_(dataCache->GetConstFrameMapsData())
{
}

FrameMapsTable::Cursor::~Cursor() {}

int32_t FrameMapsTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto frameMapsTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(frameMapsTabCs, sId);
    for (size_t i = 0; i < frameMapsTabCs.size(); i++) {
        const auto &c = frameMapsTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::SRC_ROW:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    frameMapsObj_.SrcIndexs());
                break;
            case Index::DST_ROW:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    frameMapsObj_.DstIndexs());
                break;
            default:
                break;
        }
    }

    auto frameMapsTabOrderbys = fc.GetOrderBys();
    for (auto i = frameMapsTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(frameMapsTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(frameMapsTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t FrameMapsTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(frameMapsObj_.IdsData()[CurrentRow()]));
            break;
        case Index::SRC_ROW:
            sqlite3_result_int64(context_, static_cast<int64_t>(frameMapsObj_.SrcIndexs()[CurrentRow()]));
            break;
        case Index::DST_ROW:
            sqlite3_result_int64(context_, static_cast<int64_t>(frameMapsObj_.DstIndexs()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void FrameMapsTable::GetOrbyes(FilterConstraints &mapfc, EstimatedIndexInfo &mapei)
{
    auto maporderbys = mapfc.GetOrderBys();
    for (auto i = 0; i < maporderbys.size(); i++) {
        switch (static_cast<Index>(maporderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                mapei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
