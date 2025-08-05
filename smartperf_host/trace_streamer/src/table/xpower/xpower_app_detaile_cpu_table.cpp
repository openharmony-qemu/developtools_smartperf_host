/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2024. All rights reserved.
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

#include "xpower_app_detaile_cpu_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, THREAD_NAME_ID, START_TIME, THREAD_TIME, THREAD_LOADS, THREAD_ENERGY };
XpowerAppDetaileCpuTable::XpowerAppDetaileCpuTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_name_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_loads", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_energy", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerAppDetaileCpuTable::~XpowerAppDetaileCpuTable() {}

std::unique_ptr<TableBase::Cursor> XpowerAppDetaileCpuTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerAppDetaileCpuTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstXPowerAppDetailCPUInfo().Size())),
      xPowerAppDetailCPUObj_(dataCache->GetConstXPowerAppDetailCPUInfo())
{
}

XpowerAppDetaileCpuTable::Cursor::~Cursor() {}
int32_t XpowerAppDetaileCpuTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerAppDetailCPUObj_.IdsData()[CurrentRow()]);
            break;
        case Index::THREAD_NAME_ID:
            sqlite3_result_int64(context_, xPowerAppDetailCPUObj_.ThreadNamesData()[CurrentRow()]);
            break;
        case Index::START_TIME:
            SetTypeColumnInt64(xPowerAppDetailCPUObj_.TimeStampData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::THREAD_TIME:
            SetTypeColumnInt64(xPowerAppDetailCPUObj_.ThreadTimesData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::THREAD_LOADS:
            SetTypeColumnInt64(xPowerAppDetailCPUObj_.ThreadLoadsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::THREAD_ENERGY:
            SetTypeColumnInt64(xPowerAppDetailCPUObj_.ThreadEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
