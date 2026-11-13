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

#include "gpu_slice_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, FRAME_ROW, DUR };
GPUSliceTable::GPUSliceTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("frame_row", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tablePriKey_.push_back("id");
}

GPUSliceTable::~GPUSliceTable() {}

void GPUSliceTable::FilterByConstraint(FilterConstraints &gpufc,
                                       double &gpufilterCost,
                                       size_t gpurowCount,
                                       uint32_t gpucurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &gpuc = gpufc.GetConstraints()[gpucurrenti];
    switch (static_cast<Index>(gpuc.col)) {
        case Index::ID: {
            if (CanFilterId(gpuc.op, gpurowCount)) {
                gpufc.UpdateConstraint(gpucurrenti, true);
                gpufilterCost += 1; // id can position by 1 step
            } else {
                gpufilterCost += gpurowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            gpufilterCost += gpurowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> GPUSliceTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

GPUSliceTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstGPUSliceData().Size())),
      gpuSliceObj_(dataCache->GetConstGPUSliceData())
{
}

GPUSliceTable::Cursor::~Cursor() {}

int32_t GPUSliceTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto gpuSliceTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(gpuSliceTabCs, sId);
    for (size_t i = 0; i < gpuSliceTabCs.size(); i++) {
        const auto &c = gpuSliceTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::FRAME_ROW:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    gpuSliceObj_.FrameRows());
                break;
            case Index::DUR:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    gpuSliceObj_.Durs());
                break;
            default:
                break;
        }
    }

    auto gpuSliceTabOrderbys = fc.GetOrderBys();
    for (auto i = gpuSliceTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(gpuSliceTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(gpuSliceTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t GPUSliceTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(gpuSliceObj_.IdsData()[CurrentRow()]));
            break;
        case Index::FRAME_ROW:
            sqlite3_result_int64(context_, static_cast<int32_t>(gpuSliceObj_.FrameRows()[CurrentRow()]));
            break;
        case Index::DUR:
            if (gpuSliceObj_.Durs()[CurrentRow()] != INVALID_UINT64) {
                sqlite3_result_int64(context_, static_cast<int64_t>(gpuSliceObj_.Durs()[CurrentRow()]));
            }
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void GPUSliceTable::GetOrbyes(FilterConstraints &gpufc, EstimatedIndexInfo &gpuei)
{
    auto gpuorderbys = gpufc.GetOrderBys();
    for (auto i = 0; i < gpuorderbys.size(); i++) {
        switch (static_cast<Index>(gpuorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                gpuei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
