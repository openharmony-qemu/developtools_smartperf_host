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

#include "ebpf_callstack_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    DEPTH,
    IP,
    SYMBOLS_ID,
    FILE_PATH_ID,
};
EbpfCallStackTable::EbpfCallStackTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("depth", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ip", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("symbols_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_path_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

EbpfCallStackTable::~EbpfCallStackTable() {}

void EbpfCallStackTable::FilterByConstraint(FilterConstraints &callfc,
                                            double &callfilterCost,
                                            size_t callRowCnt,
                                            uint32_t callcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto &callc = callfc.GetConstraints()[callcurrenti];
    switch (static_cast<Index>(callc.col)) {
        case Index::ID: {
            if (CanFilterId(callc.op, callRowCnt)) {
                callfc.UpdateConstraint(callcurrenti, true);
                callfilterCost += 1; // id can position by 1 step
            } else {
                callfilterCost += callRowCnt; // scan all rows
            }
            break;
        }
        default:                          // other column
            callfilterCost += callRowCnt; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> EbpfCallStackTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

EbpfCallStackTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstEbpfCallStackData().Size())),
      ebpfCallStackObj_(dataCache->GetConstEbpfCallStackData())
{
}

EbpfCallStackTable::Cursor::~Cursor() {}

int32_t EbpfCallStackTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &ebpfCallStackCs = fc.GetConstraints();
    for (size_t i = 0; i < ebpfCallStackCs.size(); i++) {
        const auto &c = ebpfCallStackCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto ebpfCallStackTabOrderbys = fc.GetOrderBys();
    for (auto i = ebpfCallStackTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(ebpfCallStackTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(ebpfCallStackTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t EbpfCallStackTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(ebpfCallStackObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfCallStackObj_.CallChainIds()[CurrentRow()]));
            break;
        case Index::DEPTH:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfCallStackObj_.Depths()[CurrentRow()]));
            break;
        case Index::IP: {
            if (ebpfCallStackObj_.Ips()[CurrentRow()] != INVALID_UINT64) {
                auto returnValueIndex = ebpfCallStackObj_.Ips()[CurrentRow()];
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(returnValueIndex).c_str(), STR_DEFAULT_LEN,
                                    nullptr);
            }
            break;
        }
        case Index::SYMBOLS_ID: {
            if (ebpfCallStackObj_.SymbolIds()[CurrentRow()] != INVALID_UINT64) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfCallStackObj_.SymbolIds()[CurrentRow()]));
            }
            break;
        }
        case Index::FILE_PATH_ID: {
            if (ebpfCallStackObj_.FilePathIds()[CurrentRow()] != INVALID_UINT64) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfCallStackObj_.FilePathIds()[CurrentRow()]));
            }
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void EbpfCallStackTable::GetOrbyes(FilterConstraints &ebpfCallfc, EstimatedIndexInfo &ebpfCalleInfo)
{
    auto ebpfCallOrderbys = ebpfCallfc.GetOrderBys();
    for (auto i = 0; i < ebpfCallOrderbys.size(); i++) {
        switch (static_cast<Index>(ebpfCallOrderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLitep
                ebpfCalleInfo.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
