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

#include "native_hook_frame_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, CALLCHAIN_ID, DEPTH, IP, SYMBOL_ID, FILE_ID, OFFSET, SYMBOL_OFFSET, VADDR };
NativeHookFrameTable::NativeHookFrameTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("depth", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ip", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("symbol_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("offset", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("symbol_offset", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("vaddr", "TEXT"));
    tablePriKey_.push_back("id");
}

NativeHookFrameTable::~NativeHookFrameTable() {}

void NativeHookFrameTable::FilterByConstraint(FilterConstraints &framefc,
                                              double &framefilterCost,
                                              size_t framerowCount,
                                              uint32_t framecurrenti)
{
    const auto &framec = framefc.GetConstraints()[framecurrenti];
    switch (static_cast<Index>(framec.col)) {
        case Index::ID: {
            if (CanFilterId(framec.op, framerowCount)) {
                framefc.UpdateConstraint(framecurrenti, true);
                framefilterCost += 1; // id can position by 1 step
            } else {
                framefilterCost += framerowCount; // scan all rows
            }
            break;
        }
        default:                              // other column
            framefilterCost += framerowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> NativeHookFrameTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

NativeHookFrameTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstNativeHookFrameData().Size())),
      nativeHookFrameInfoObj_(dataCache->GetConstNativeHookFrameData())
{
}

NativeHookFrameTable::Cursor::~Cursor() {}

int32_t NativeHookFrameTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto nativeHookFrameCs = fc.GetConstraints();
    std::set<uint32_t> sId = {static_cast<uint32_t>(Index::ID)};
    SwapIndexFront(nativeHookFrameCs, sId);
    for (size_t i = 0; i < nativeHookFrameCs.size(); i++) {
        const auto &c = nativeHookFrameCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[c.idxInaConstraint]);
                break;
            case Index::CALLCHAIN_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    nativeHookFrameInfoObj_.CallChainIds());
                break;
            case Index::SYMBOL_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    nativeHookFrameInfoObj_.SymbolNames());
                break;
            case Index::FILE_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[c.idxInaConstraint])),
                                    nativeHookFrameInfoObj_.FilePaths());
                break;
            default:
                break;
        }
    }

    auto nativeHookFrameOrderbys = fc.GetOrderBys();
    for (auto i = nativeHookFrameOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(nativeHookFrameOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(nativeHookFrameOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t NativeHookFrameTable::Cursor::Column(int32_t nativeHookFrameCol) const
{
    switch (static_cast<Index>(nativeHookFrameCol)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(CurrentRow()));
            break;
        case Index::CALLCHAIN_ID:
            SetTypeColumn(nativeHookFrameInfoObj_.CallChainIds()[CurrentRow()], INVALID_UINT32, INVALID_CALL_CHAIN_ID);
            break;
        case Index::DEPTH:
            sqlite3_result_int(context_, static_cast<int32_t>(nativeHookFrameInfoObj_.Depths()[CurrentRow()]));
            break;
        case Index::IP:
            SetTypeColumnInt64(nativeHookFrameInfoObj_.Ips()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::SYMBOL_ID:
            SetTypeColumnInt64(nativeHookFrameInfoObj_.SymbolNames()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::FILE_ID: {
            SetTypeColumnInt64(nativeHookFrameInfoObj_.FilePaths()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::OFFSET: {
            SetTypeColumnInt64(nativeHookFrameInfoObj_.Offsets()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::SYMBOL_OFFSET: {
            SetTypeColumnInt64(nativeHookFrameInfoObj_.SymbolOffsets()[CurrentRow()], INVALID_UINT64);
            break;
        }
        case Index::VADDR: {
            SetTypeColumnTextNotEmpty(nativeHookFrameInfoObj_.Vaddrs()[CurrentRow()].empty(),
                                      nativeHookFrameInfoObj_.Vaddrs()[CurrentRow()].c_str());
            break;
        }
        default:
            TS_LOGF("Unregistered nativeHookFrameCol : %d", nativeHookFrameCol);
            break;
    }
    return SQLITE_OK;
}

void NativeHookFrameTable::GetOrbyes(FilterConstraints &framefc, EstimatedIndexInfo &frameei)
{
    auto frameorderbys = framefc.GetOrderBys();
    for (auto i = 0; i < frameorderbys.size(); i++) {
        switch (static_cast<Index>(frameorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                frameei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
