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

#include "cpu_measure_filter_table.h"

#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, NAME, CPU };
CpuMeasureFilterTable::CpuMeasureFilterTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("cpu", "INTEGER"));
    tablePriKey_.push_back("id");
}

CpuMeasureFilterTable::~CpuMeasureFilterTable() {}

void CpuMeasureFilterTable::FilterByConstraint(FilterConstraints &cpufc,
                                               double &cpufilterCost,
                                               size_t cpurowCount,
                                               uint32_t cpucurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &cpuc = cpufc.GetConstraints()[cpucurrenti];
    switch (static_cast<Index>(cpuc.col)) {
        case Index::ID: {
            auto cpuoldRowCount = cpurowCount;
            if (CanFilterSorted(cpuc.op, cpurowCount)) {
                cpufc.UpdateConstraint(cpucurrenti, true);
                cpufilterCost += log2(cpuoldRowCount); // binary search
            } else {
                cpufilterCost += cpuoldRowCount;
            }
            break;
        }
        default:                          // other column
            cpufilterCost += cpurowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> CpuMeasureFilterTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

CpuMeasureFilterTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstCpuMeasuresData().Size())),
      cpuMeasureObj_(dataCache->GetConstCpuMeasuresData())
{
}

CpuMeasureFilterTable::Cursor::~Cursor() {}

int32_t CpuMeasureFilterTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &cpuMeasureFilterCs = fc.GetConstraints();
    for (size_t i = 0; i < cpuMeasureFilterCs.size(); i++) {
        const auto &c = cpuMeasureFilterCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterSorted(c.col, c.op, argv[i]);
                break;
            case Index::CPU:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[i])), cpuMeasureObj_.CpuData());
                break;
            default:
                break;
        }
    }

    auto cpuMeasureFilterTabOrderbys = fc.GetOrderBys();
    for (auto i = cpuMeasureFilterTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(cpuMeasureFilterTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(cpuMeasureFilterTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t CpuMeasureFilterTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(cpuMeasureObj_.IdsData()[CurrentRow()]));
            break;
        case Index::NAME: {
            const std::string &str =
                dataCache_->GetDataFromDict(static_cast<size_t>(cpuMeasureObj_.NameData()[CurrentRow()]));
            sqlite3_result_text(context_, str.c_str(), STR_DEFAULT_LEN, nullptr);
            break;
        }
        case Index::CPU:
            sqlite3_result_int64(context_, static_cast<int32_t>(cpuMeasureObj_.CpuData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}

void CpuMeasureFilterTable::Cursor::FilterSorted(int32_t columns, unsigned char option, sqlite3_value *argv)
{
    auto valType = sqlite3_value_type(argv);
    if (valType != SQLITE_INTEGER) {
        // other valType consider it NULL, filter out nothing
        indexMap_->Intersect(0, 0);
        return;
    }

    switch (static_cast<Index>(columns)) {
        case Index::ID: {
            auto v = static_cast<uint64_t>(sqlite3_value_int64(argv));
            auto getValue = [](const uint32_t &row) { return row; };
            switch (option) {
                case SQLITE_INDEX_CONSTRAINT_EQ:
                    indexMap_->IntersectabcEqual(cpuMeasureObj_.IdsData(), v, getValue);
                    break;
                case SQLITE_INDEX_CONSTRAINT_GT:
                    v++;
                case SQLITE_INDEX_CONSTRAINT_GE: {
                    indexMap_->IntersectGreaterEqual(cpuMeasureObj_.IdsData(), v, getValue);
                    break;
                }
                case SQLITE_INDEX_CONSTRAINT_LE:
                    v++;
                case SQLITE_INDEX_CONSTRAINT_LT: {
                    indexMap_->IntersectLessEqual(cpuMeasureObj_.IdsData(), v, getValue);
                    break;
                }
                default:
                    break;
            } // end of switch (option)
        }     // end of case TS
        default:
            // can't filter, all rows
            break;
    }
}
void CpuMeasureFilterTable::GetOrbyes(FilterConstraints &cpufc, EstimatedIndexInfo &cpuei)
{
    auto cpuorderbys = cpufc.GetOrderBys();
    for (auto i = 0; i < cpuorderbys.size(); i++) {
        switch (static_cast<Index>(cpuorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                cpuei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
