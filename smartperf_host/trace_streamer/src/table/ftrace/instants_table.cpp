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

#include "instants_table.h"
#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { TS = 0, NAME, REF, WAKEUP_FROM, REF_TYPE, VALUE };
InstantsTable::InstantsTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("name", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("ref", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("wakeup_from", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ref_type", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("value", "REAL"));
    tablePriKey_.push_back("ts");
    tablePriKey_.push_back("ref");
}

InstantsTable::~InstantsTable() {}

std::unique_ptr<TableBase::Cursor> InstantsTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

InstantsTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstInstantsData().Size())),
      InstantsObj_(dataCache->GetConstInstantsData())
{
}

InstantsTable::Cursor::~Cursor() {}

void InstantsTable::FilterByConstraint(FilterConstraints &instantsfc,
                                       double &instantsfilterCost,
                                       size_t instantsrowCount,
                                       uint32_t instantscurrenti)
{
    const auto &instantsc = instantsfc.GetConstraints()[instantscurrenti];
    switch (static_cast<Index>(instantsc.col)) {
        case Index::TS: {
            auto instantsoldRowCount = instantsrowCount;
            if (CanFilterSorted(instantsc.op, instantsrowCount)) {
                instantsfc.UpdateConstraint(instantscurrenti, true);
                instantsfilterCost += log2(instantsoldRowCount); // binary search
            } else {
                instantsfilterCost += instantsoldRowCount;
            }
            break;
        }
        default:                                    // other column
            instantsfilterCost += instantsrowCount; // scan all rows
            break;
    }
}

void InstantsTable::Cursor::SortOfIndexMap(const FilterConstraints &fc)
{
    auto orderbys = fc.GetOrderBys();
    for (auto i = orderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::TS:
                indexMap_->SortBy(orderbys[i].desc);
                break;
            default:
                break;
        }
    }
}

int32_t InstantsTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);
    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }
    auto instantsTabCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::TS)};
    SwapIndexFront(instantsTabCs, sId);
    for (size_t i = 0; i < instantsTabCs.size(); i++) {
        const auto &c = instantsTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::TS:
                FilterTS(c.op, argv[c.idxInaConstraint], InstantsObj_.TimeStampData());
                break;
            case Index::NAME:
                indexMap_->MixRange(c.op,
                                    dataCache_->GetConstDataIndex(std::string(
                                        reinterpret_cast<const char *>(sqlite3_value_text(argv[c.idxInaConstraint])))),
                                    InstantsObj_.NameIndexsData());
                break;
            case Index::REF:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int(argv[c.idxInaConstraint])),
                                    InstantsObj_.InternalTidsData());
                break;
            case Index::WAKEUP_FROM:
                indexMap_->MixRange(c.op, static_cast<int64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    InstantsObj_.WakeupFromPidsData());
                break;
            default:
                break;
        }
    }
    SortOfIndexMap(fc);

    return SQLITE_OK;
}

int32_t InstantsTable::Cursor::Column(int32_t column) const
{
    size_t stringIdentity = static_cast<size_t>(InstantsObj_.NameIndexsData()[CurrentRow()]);
    switch (static_cast<Index>(column)) {
        case Index::TS:
            sqlite3_result_int64(context_, static_cast<int64_t>(InstantsObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::NAME: {
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(stringIdentity).c_str(), STR_DEFAULT_LEN,
                                nullptr);
            break;
        }
        case Index::REF:
            sqlite3_result_int64(context_, static_cast<int32_t>(InstantsObj_.InternalTidsData()[CurrentRow()]));
            break;
        case Index::WAKEUP_FROM:
            sqlite3_result_int64(context_, static_cast<int32_t>(InstantsObj_.WakeupFromPidsData()[CurrentRow()]));
            break;
        case Index::REF_TYPE: {
            sqlite3_result_text(context_, "itid", STR_DEFAULT_LEN, nullptr);
            break;
        }
        case Index::VALUE: {
            sqlite3_result_double(context_, 0.0);
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void InstantsTable::GetOrbyes(FilterConstraints &instantsfc, EstimatedIndexInfo &instantsei)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    auto instantsorderbys = instantsfc.GetOrderBys();
    for (auto i = 0; i < instantsorderbys.size(); i++) {
        switch (static_cast<Index>(instantsorderbys[i].iColumn)) {
            case Index::TS:
                break;
            default: // other columns can be sorted by SQLite
                instantsei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
