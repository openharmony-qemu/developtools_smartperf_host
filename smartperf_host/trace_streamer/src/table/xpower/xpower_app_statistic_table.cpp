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

#include "xpower_app_statistic_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, COMPONENT_TYPE, START_TIME, DURATION, ENERGYS };
XpowerAppStatisticTable::XpowerAppStatisticTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("component_type_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("energy", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerAppStatisticTable::~XpowerAppStatisticTable() {}

std::unique_ptr<TableBase::Cursor> XpowerAppStatisticTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerAppStatisticTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstXPowerAppStatisticInfo().Size())),
      xPowerAppStatisticObj_(dataCache->GetConstXPowerAppStatisticInfo())
{
}

XpowerAppStatisticTable::Cursor::~Cursor() {}
int32_t XpowerAppStatisticTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerAppStatisticObj_.IdsData()[CurrentRow()]);
            break;
        case Index::COMPONENT_TYPE:
            sqlite3_result_int64(context_, xPowerAppStatisticObj_.ComponentTypesData()[CurrentRow()]);
            break;
        case Index::START_TIME:
            SetTypeColumnInt64(xPowerAppStatisticObj_.TimeStampData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::DURATION:
            SetTypeColumnInt64(xPowerAppStatisticObj_.DurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::ENERGYS:
            SetTypeColumnInt64(xPowerAppStatisticObj_.EnergysData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
