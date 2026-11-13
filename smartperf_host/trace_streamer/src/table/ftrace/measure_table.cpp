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

#include "measure_table.h"
#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { TYPE = 0, TS, DUR, VALUE, FILTER_ID };
MeasureTable::MeasureTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("type", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("value", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("filter_id", "INTEGER"));
    tablePriKey_.push_back("ts");
    tablePriKey_.push_back("filter_id");
}

MeasureTable::~MeasureTable() {}

std::unique_ptr<TableBase::Cursor> MeasureTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

MeasureTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache,
                        table,
                        static_cast<uint32_t>(table->name_ == "measure"
                                                  ? dataCache->GetConstMeasureData().Size()
                                                  : (table->name_ == "process_measure"
                                                         ? dataCache->GetConstProcessMeasureData().Size()
                                                         : (table->name_ == "sys_mem_measure"
                                                                ? dataCache->GetConstSysMemMeasureData().Size()
                                                                : dataCache->GetConstXpowerMeasureData().Size())))),
      measureObj(table->name_ == "measure"
                     ? dataCache->GetConstMeasureData()
                     : (table->name_ == "process_measure"
                            ? dataCache->GetConstProcessMeasureData()
                            : (table->name_ == "sys_mem_measure" ? dataCache->GetConstSysMemMeasureData()
                                                                 : dataCache->GetConstXpowerMeasureData())))
{
}

MeasureTable::Cursor::~Cursor() {}

void MeasureTable::FilterByConstraint(FilterConstraints &measurefc,
                                      double &measurefilterCost,
                                      size_t measurerowCount,
                                      uint32_t measurecurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &measurec = measurefc.GetConstraints()[measurecurrenti];
    switch (static_cast<Index>(measurec.col)) {
        case Index::TS: {
            auto measureoldRowCount = measurerowCount;
            if (CanFilterSorted(measurec.op, measurerowCount)) {
                measurefc.UpdateConstraint(measurecurrenti, true);
                measurefilterCost += log2(measureoldRowCount); // binary search
            } else {
                measurefilterCost += measureoldRowCount;
            }
            break;
        }
        default:                                  // other column
            measurefilterCost += measurerowCount; // scan all rows
            break;
    }
}

int32_t MeasureTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }
    auto measureTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(measureTabCs, sId);
    for (size_t i = 0; i < measureTabCs.size(); i++) {
        const auto &c = measureTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::TS:
                FilterTS(c.op, argv[c.idxInaConstraint], measureObj.TimeStampData());
                break;
            case Index::FILTER_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    measureObj.FilterIdData());
                break;
            default:
                break;
        }
    }

    auto orderbys = fc.GetOrderBys();
    for (auto i = orderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::TS:
                indexMap_->SortBy(orderbys[i].desc);
                break;
            case Index::FILTER_ID:
                indexMap_->SortBy(orderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t MeasureTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::TYPE:
            sqlite3_result_text(context_, "measure", STR_DEFAULT_LEN, nullptr);
            break;
        case Index::TS:
            sqlite3_result_int64(context_, static_cast<int64_t>(measureObj.TimeStampData()[CurrentRow()]));
            break;
        case Index::DUR:
            if (measureObj.DursData()[CurrentRow()] != INVALID_UINT64) {
                sqlite3_result_int64(context_, static_cast<int64_t>(measureObj.DursData()[CurrentRow()]));
            }
            break;
        case Index::VALUE:
            sqlite3_result_int64(context_, static_cast<int64_t>(measureObj.ValuesData()[CurrentRow()]));
            break;
        case Index::FILTER_ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(measureObj.FilterIdData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void MeasureTable::GetOrbyes(FilterConstraints &measurefc, EstimatedIndexInfo &measureei)
{
    auto measureorderbys = measurefc.GetOrderBys();
    for (auto i = 0; i < measureorderbys.size(); i++) {
        switch (static_cast<Index>(measureorderbys[i].iColumn)) {
            case Index::TS:
                break;
            default: // other columns can be sorted by SQLite
                measureei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
