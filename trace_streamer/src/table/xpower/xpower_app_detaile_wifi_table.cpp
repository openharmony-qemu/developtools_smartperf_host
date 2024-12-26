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

#include "xpower_app_detaile_wifi_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, START_TIME, TX_PACKETS, RX_PACKETS, TX_BYTES, RX_BYTES };
XpowerAppDetaileWifiTable::XpowerAppDetaileWifiTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tx_packets", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("rx_packets", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tx_bytes", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("rx_bytes", "INTEGER"));
    tablePriKey_.push_back("id");
}

XpowerAppDetaileWifiTable::~XpowerAppDetaileWifiTable() {}

std::unique_ptr<TableBase::Cursor> XpowerAppDetaileWifiTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

XpowerAppDetaileWifiTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstXPowerAppDetailWifiInfo().Size())),
      xPowerAppDetailWifiObj_(dataCache->GetConstXPowerAppDetailWifiInfo())
{
}

XpowerAppDetaileWifiTable::Cursor::~Cursor() {}
int32_t XpowerAppDetaileWifiTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, xPowerAppDetailWifiObj_.IdsData()[CurrentRow()]);
            break;
        case Index::START_TIME:
            sqlite3_result_int64(context_, xPowerAppDetailWifiObj_.TimeStampData()[CurrentRow()]);
            break;
        case Index::TX_PACKETS:
            SetTypeColumnInt64(xPowerAppDetailWifiObj_.TxPacketsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::RX_PACKETS:
            SetTypeColumnInt64(xPowerAppDetailWifiObj_.RxPacketsData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::TX_BYTES:
            SetTypeColumnInt64(xPowerAppDetailWifiObj_.TxBytesData()[CurrentRow()], INVALID_INT64);
            break;
        case Index::RX_BYTES:
            SetTypeColumnInt64(xPowerAppDetailWifiObj_.RxBytesData()[CurrentRow()], INVALID_INT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
