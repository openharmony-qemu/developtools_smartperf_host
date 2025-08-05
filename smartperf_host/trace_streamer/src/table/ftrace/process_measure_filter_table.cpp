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

#include "process_measure_filter_table.h"

#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, NAME, INTERNAL_PID };
ProcessMeasureFilterTable::ProcessMeasureFilterTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tablePriKey_.push_back("id");
}

ProcessMeasureFilterTable::~ProcessMeasureFilterTable() {}

void ProcessMeasureFilterTable::FilterByConstraint(FilterConstraints &filterfc,
                                                   double &filterfilterCost,
                                                   size_t filterrowCount,
                                                   uint32_t filtercurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &filterc = filterfc.GetConstraints()[filtercurrenti];
    switch (static_cast<Index>(filterc.col)) {
        case Index::ID: {
            auto filteroldRowCount = filterrowCount;
            if (CanFilterSorted(filterc.op, filterrowCount)) {
                filterfc.UpdateConstraint(filtercurrenti, true);
                filterfilterCost += log2(filteroldRowCount); // binary search
            } else {
                filterfilterCost += filteroldRowCount;
            }
            break;
        }
        default:                                // other column
            filterfilterCost += filterrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> ProcessMeasureFilterTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

ProcessMeasureFilterTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstProcessMeasureFilterData().Size()))
{
}

ProcessMeasureFilterTable::Cursor::~Cursor() {}

int32_t ProcessMeasureFilterTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &procMeasureFilterCs = fc.GetConstraints();
    for (size_t i = 0; i < procMeasureFilterCs.size(); i++) {
        const auto &c = procMeasureFilterCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[i])),
                                    dataCache_->GetConstProcessMeasureFilterData().IdsData());
                break;
            case Index::INTERNAL_PID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[i])),
                                    dataCache_->GetConstProcessMeasureFilterData().UpidsData());
                break;
            case Index::NAME:
                indexMap_->MixRange(c.op,
                                    dataCache_->GetConstDataIndex(
                                        std::string(reinterpret_cast<const char *>(sqlite3_value_text(argv[i])))),
                                    dataCache_->GetConstProcessMeasureFilterData().NamesData());
                break;
            default:
                break;
        }
    }

    auto procMeasureFilterOrderbys = fc.GetOrderBys();
    for (auto i = procMeasureFilterOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(procMeasureFilterOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(procMeasureFilterOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t ProcessMeasureFilterTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(
                                               dataCache_->GetConstProcessMeasureFilterData().IdsData()[CurrentRow()]));
            break;
        case Index::NAME: {
            size_t strId =
                static_cast<size_t>(dataCache_->GetConstProcessMeasureFilterData().NamesData()[CurrentRow()]);
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(strId).c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        }
        case Index::INTERNAL_PID:
            sqlite3_result_int64(
                context_,
                static_cast<sqlite3_int64>(dataCache_->GetConstProcessMeasureFilterData().UpidsData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", col);
            break;
    }
    return SQLITE_OK;
}
void ProcessMeasureFilterTable::GetOrbyes(FilterConstraints &filterfc, EstimatedIndexInfo &filterei)
{
    auto procMeasurefilterOrdbys = filterfc.GetOrderBys();
    for (auto i = 0; i < procMeasurefilterOrdbys.size(); i++) {
        switch (static_cast<Index>(procMeasurefilterOrdbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                filterei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
