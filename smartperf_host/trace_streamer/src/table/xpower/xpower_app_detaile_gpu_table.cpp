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

#include "xpower_app_detaile_gpu_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, FREQUENCY, START_TIME, IDLE_TIME, RUN_TIME };
XpowerAppDetaileGpuTable::XpowerAppDetaileGpuTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("frequency", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("idle_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("run_time", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerAppDetaileGpuTable::~XpowerAppDetaileGpuTable() {}

std::unique_ptr<TableBase::Cursor> XpowerAppDetaileGpuTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerAppDetaileGpuTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstXPowerAppDetailGPUInfo().Size())),
      xPowerAppDetailGPUObj_(dataCache->GetConstXPowerAppDetailGPUInfo())
{
}

XpowerAppDetaileGpuTable::Cursor::~Cursor() {}
int32_t XpowerAppDetaileGpuTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerAppDetailGPUObj_.IdsData()[CurrentRow()]);
            break;
        case Index::FREQUENCY:
            SetTypeColumnInt64(xPowerAppDetailGPUObj_.FrequencysData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::START_TIME:
            SetTypeColumnInt64(xPowerAppDetailGPUObj_.TimeStampData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::IDLE_TIME:
            SetTypeColumnInt64(xPowerAppDetailGPUObj_.IdleTimesData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::RUN_TIME:
            SetTypeColumnInt64(xPowerAppDetailGPUObj_.RuntimesData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
