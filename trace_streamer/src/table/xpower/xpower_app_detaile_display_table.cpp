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

#include "xpower_app_detaile_display_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    START_TIME,
    COUNT_1_HZ,
    COUNT_5_HZ,
    COUNT_10_HZ,
    COUNT_15_HZ,
    COUNT_24_HZ,
    COUNT_30_HZ,
    COUNT_45_HZ,
    COUNT_60_HZ,
    COUNT_90_HZ,
    COUNT_120_HZ,
    COUNT_180_HZ
};
XpowerAppDetaileDisplayTable::XpowerAppDetaileDisplayTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_1hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_5hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_10hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_15hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_24hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_30hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_45hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_60hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_90hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_120hz", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("count_180hz", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerAppDetaileDisplayTable::~XpowerAppDetaileDisplayTable() {}

std::unique_ptr<TableBase::Cursor> XpowerAppDetaileDisplayTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerAppDetaileDisplayTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache,
                        table,
                        static_cast<uint32_t>(dataCache->GetConstXPowerAppDetailDisplayInfo().Size())),
      xPowerAppDetailDisplayObj_(dataCache->GetConstXPowerAppDetailDisplayInfo())
{
}

XpowerAppDetaileDisplayTable::Cursor::~Cursor() {}
int32_t XpowerAppDetaileDisplayTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerAppDetailDisplayObj_.IdsData()[CurrentRow()]);
            break;
        case Index::START_TIME:
            sqlite3_result_int64(context_, xPowerAppDetailDisplayObj_.TimeStampData()[CurrentRow()]);
            break;
        case Index::COUNT_1_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count1HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_5_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count5HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_10_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count10HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_15_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count15HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_24_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count24HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_30_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count30HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_45_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count45HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_60_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count60HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_90_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count90HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_120_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count120HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::COUNT_180_HZ:
            SetTypeColumnInt64(xPowerAppDetailDisplayObj_.Count180HertzsData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
