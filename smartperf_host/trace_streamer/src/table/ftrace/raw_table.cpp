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

#include "raw_table.h"
namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TS, NAME, CPU, INTERNAL_TID };
enum RawType { RAW_CPU_IDLE = 1, RAW_SCHED_WAKEUP = 2, RAW_SCHED_WAKING = 3 };
uint32_t GetNameIndex(const std::string &name)
{
    if (name == "cpu_idle") {
        return RAW_CPU_IDLE;
    } else if (name == "sched_wakeup") {
        return RAW_SCHED_WAKEUP;
    } else if (name == "sched_waking") {
        return RAW_SCHED_WAKING;
    } else {
        return INVALID_UINT32;
    }
}
RawTable::RawTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("cpu", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tablePriKey_.push_back("id");
}

RawTable::~RawTable() {}

void RawTable::FilterByConstraint(FilterConstraints &rawfc,
                                  double &rawfilterCost,
                                  size_t rawrowCount,
                                  uint32_t rawcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &rawc = rawfc.GetConstraints()[rawcurrenti];
    switch (static_cast<Index>(rawc.col)) {
        case Index::ID: {
            if (CanFilterId(rawc.op, rawrowCount)) {
                rawfc.UpdateConstraint(rawcurrenti, true);
                rawfilterCost += 1; // id can position by 1 step
            } else {
                rawfilterCost += rawrowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            rawfilterCost += rawrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> RawTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

RawTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstRawTableData().Size())),
      rawObj_(dataCache->GetConstRawTableData())
{
}

RawTable::Cursor::~Cursor() {}
int32_t RawTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto RawTableCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(RawTableCs, sId);
    for (size_t i = 0; i < RawTableCs.size(); i++) {
        const auto &c = RawTableCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::NAME:
                indexMap_->MixRange(c.op,
                                    GetNameIndex(std::string(
                                        reinterpret_cast<const char *>(sqlite3_value_text(argv[c.idxInaConstraint])))),
                                    rawObj_.NameData());
                break;
            case Index::TS:
                FilterTS(c.op, argv[c.idxInaConstraint], rawObj_.TimeStampData());
                break;
            case Index::INTERNAL_TID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    rawObj_.InternalTidsData());
                break;
            default:
                break;
        }
    }

    auto rawTableOrderbys = fc.GetOrderBys();
    for (auto i = rawTableOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(rawTableOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(rawTableOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t RawTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(rawObj_.IdsData()[CurrentRow()]));
            break;
        case Index::TS:
            sqlite3_result_int64(context_, static_cast<int64_t>(rawObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::NAME: {
            if (rawObj_.NameData()[CurrentRow()] == RAW_CPU_IDLE) {
                sqlite3_result_text(context_, "cpu_idle", STR_DEFAULT_LEN, nullptr);
            } else if (rawObj_.NameData()[CurrentRow()] == RAW_SCHED_WAKEUP) {
                sqlite3_result_text(context_, "sched_wakeup", STR_DEFAULT_LEN, nullptr);
            } else if (rawObj_.NameData()[CurrentRow()] == RAW_SCHED_WAKING) {
                sqlite3_result_text(context_, "sched_waking", STR_DEFAULT_LEN, nullptr);
            }
            break;
        }
        case Index::CPU:
            sqlite3_result_int64(context_, static_cast<int32_t>(rawObj_.CpuData()[CurrentRow()]));
            break;
        case Index::INTERNAL_TID:
            sqlite3_result_int64(context_, static_cast<int32_t>(rawObj_.InternalTidsData()[CurrentRow()]));
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void RawTable::GetOrbyes(FilterConstraints &rawfc, EstimatedIndexInfo &rawei)
{
    auto raworderbys = rawfc.GetOrderBys();
    for (auto i = 0; i < raworderbys.size(); i++) {
        switch (static_cast<Index>(raworderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                rawei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
