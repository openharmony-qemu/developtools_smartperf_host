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

#include "xpower_component_top_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    COMPONENT_TYPE,
    START_TIME,
    APPNAME,
    BACKGROUND_DURATION,
    BACKGROUND_ENERGY,
    FOREGROUND_DURATION,
    FOREGROUND_ENERGY,
    SCREEN_OFF_DURATION,
    SCREEN_OFF_ENERGY,
    SCREEN_ON_DURATION,
    SCREEN_ON_ENERGY,
    CAMERA_ID,
    UID,
    LOAD,
    APP_USAGE_DURATION,
    APP_USAGE_ENERGY
};
XpowerComponentTopTable::XpowerComponentTopTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("component_type_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("appname", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("background_duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("background_energy", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("foreground_duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("foreground_energy", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("screen_off_duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("screen_off_energy", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("screen_on_duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("screen_on_energy", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("camera_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("uid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("load", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("app_usage_duration", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("app_usage_energy", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerComponentTopTable::~XpowerComponentTopTable() {}

std::unique_ptr<TableBase::Cursor> XpowerComponentTopTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerComponentTopTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstXPowerComponentTopInfo().Size())),
      xPowerComponentTopObj_(dataCache->GetConstXPowerComponentTopInfo())
{
}

XpowerComponentTopTable::Cursor::~Cursor() {}
int32_t XpowerComponentTopTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerComponentTopObj_.IdsData()[CurrentRow()]);
            break;
        case Index::COMPONENT_TYPE:
            sqlite3_result_int64(context_, xPowerComponentTopObj_.ComponentTypesData()[CurrentRow()]);
            break;
        case Index::START_TIME:
            SetTypeColumnInt64(xPowerComponentTopObj_.TimeStampData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::APPNAME:
            SetTypeColumnInt64(xPowerComponentTopObj_.AppnamesData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::BACKGROUND_DURATION:
            SetTypeColumnInt64(xPowerComponentTopObj_.BackgroundDurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::BACKGROUND_ENERGY:
            SetTypeColumnInt64(xPowerComponentTopObj_.BackgroundEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::FOREGROUND_DURATION:
            SetTypeColumnInt64(xPowerComponentTopObj_.ForegroundDurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::FOREGROUND_ENERGY:
            SetTypeColumnInt64(xPowerComponentTopObj_.ForegroundEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::SCREEN_OFF_DURATION:
            SetTypeColumnInt64(xPowerComponentTopObj_.ScreenOffDurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::SCREEN_OFF_ENERGY:
            SetTypeColumnInt64(xPowerComponentTopObj_.ScreenOffEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::SCREEN_ON_DURATION:
            SetTypeColumnInt64(xPowerComponentTopObj_.ScreenOnDurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::SCREEN_ON_ENERGY:
            SetTypeColumnInt64(xPowerComponentTopObj_.ScreenOnEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::CAMERA_ID:
            SetTypeColumnInt64(xPowerComponentTopObj_.CameraIdsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::UID:
            SetTypeColumnInt64(xPowerComponentTopObj_.UidsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::LOAD:
            SetTypeColumnInt64(xPowerComponentTopObj_.LoadsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::APP_USAGE_DURATION:
            SetTypeColumnInt64(xPowerComponentTopObj_.AppUsageDurationsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::APP_USAGE_ENERGY:
            SetTypeColumnInt64(xPowerComponentTopObj_.AppUsageEnergysData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
