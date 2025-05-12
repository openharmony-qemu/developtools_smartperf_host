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

#include "system_call_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { SYSCALL_NUMBER, TS, DUR, ITID, ARGS, RET };
SystemCallTable::SystemCallTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("syscall_number", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("args", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("ret", "INTEGER"));
    tablePriKey_.push_back("ts");
}

SystemCallTable::~SystemCallTable() {}

std::unique_ptr<TableBase::Cursor> SystemCallTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

SystemCallTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSysCallData().Size())),
      sysCallObj_(dataCache->GetConstSysCallData())
{
}

SystemCallTable::Cursor::~Cursor() {}

int32_t SystemCallTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::SYSCALL_NUMBER:
            sqlite3_result_int(context_, dataCache_->GetConstSysCallData().SysCallNumbersData()[CurrentRow()]);
            break;
        case Index::TS:
            sqlite3_result_int64(context_, dataCache_->GetConstSysCallData().TimeStampData()[CurrentRow()]);
            break;
        case Index::DUR:
            sqlite3_result_int64(context_, dataCache_->GetConstSysCallData().DursData()[CurrentRow()]);
            break;
        case Index::ITID:
            sqlite3_result_int(context_, dataCache_->GetConstSysCallData().ItidsData()[CurrentRow()]);
            break;
        case Index::ARGS:
            SetTypeColumnText(dataCache_->GetConstSysCallData().ArgsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::RET:
            sqlite3_result_int64(context_, dataCache_->GetConstSysCallData().RetsData()[CurrentRow()]);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
