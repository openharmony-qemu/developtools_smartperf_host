/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include "ebpf_elf_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    ELF_ID,
    TEXT_VADDR,
    TEXT_OFFSET,
    STR_TAB_LEN,
    SYM_TAB_LEN,
    FILE_NAME_LEN,
    SYM_ENT_LEN,
    FILE_PATH_ID,
};
EbpfElfTable::EbpfElfTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("elf_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("text_vaddr", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("text_offset", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("str_tab_len", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("sym_tab_len", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_name_len", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("sym_ent_len", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("file_path_id", "INTEGER"));
    tablePriKey_.push_back("id");
}

EbpfElfTable::~EbpfElfTable() {}

void EbpfElfTable::FilterByConstraint(FilterConstraints& elffc,
                                      double& elffilterCost,
                                      size_t elfrowCount,
                                      uint32_t elfcurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& elfc = elffc.GetConstraints()[elfcurrenti];
    switch (static_cast<Index>(elfc.col)) {
        case Index::ID: {
            if (CanFilterId(elfc.op, elfrowCount)) {
                elffc.UpdateConstraint(elfcurrenti, true);
                elffilterCost += 1; // id can position by 1 step
            } else {
                elffilterCost += elfrowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            elffilterCost += elfrowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> EbpfElfTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

EbpfElfTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstEbpfElf().Size())),
      ebpfElfObj_(dataCache->GetConstEbpfElf())
{
}

EbpfElfTable::Cursor::~Cursor() {}

int32_t EbpfElfTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(ebpfElfObj_.IdsData()[CurrentRow()]));
            break;
        case Index::ELF_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.ElfIds()[CurrentRow()]));
            break;
        case Index::TEXT_VADDR:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.TextVaddrs()[CurrentRow()]));
            break;
        case Index::TEXT_OFFSET:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.TextOffsets()[CurrentRow()]));
            break;
        case Index::STR_TAB_LEN:
            sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.StrTabLens()[CurrentRow()]));
            break;
        case Index::SYM_TAB_LEN: {
            if (ebpfElfObj_.SymTabLens()[CurrentRow()] != INVALID_UINT32) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.SymTabLens()[CurrentRow()]));
            }
            break;
        }
        case Index::FILE_NAME_LEN: {
            if (ebpfElfObj_.FileNameLens()[CurrentRow()] != INVALID_UINT32) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.FileNameLens()[CurrentRow()]));
            }
            break;
        }
        case Index::SYM_ENT_LEN: {
            if (ebpfElfObj_.SymEntLens()[CurrentRow()] != INVALID_UINT32) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.SymEntLens()[CurrentRow()]));
            }
            break;
        }
        case Index::FILE_PATH_ID: {
            if (ebpfElfObj_.FileNameIndexs()[CurrentRow()] != INVALID_UINT64) {
                sqlite3_result_int64(context_, static_cast<int64_t>(ebpfElfObj_.FileNameIndexs()[CurrentRow()]));
            }
            break;
        }
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void EbpfElfTable::GetOrbyes(FilterConstraints& elffc, EstimatedIndexInfo& elfei)
{
    auto elforderbys = elffc.GetOrderBys();
    for (auto i = 0; i < elforderbys.size(); i++) {
        switch (static_cast<Index>(elforderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                elfei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
