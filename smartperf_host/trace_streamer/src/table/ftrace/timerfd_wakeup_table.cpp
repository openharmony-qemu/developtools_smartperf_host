/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
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

#include "timerfd_wakeup_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID, TS, PID, TID, THREAD_NAME, INTERVAL, CURR_MONO, EXPIRE_MONO };
TimerfdWakeupTable::TimerfdWakeupTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("pid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_name", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("interval", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("curr_mono", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("expire_mono", "INTEGER"));
    tablePriKey_.push_back("ts");
}

TimerfdWakeupTable::~TimerfdWakeupTable() {}

std::unique_ptr<TableBase::Cursor> TimerfdWakeupTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

TimerfdWakeupTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstTimerfdWakeupData().Size())),
      timerfdWakeupObj_(dataCache->GetConstTimerfdWakeupData())
{
}

TimerfdWakeupTable::Cursor::~Cursor() {}

int32_t TimerfdWakeupTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, timerfdWakeupObj_.IdsData()[CurrentRow()]);
            break;
        case Index::TS:
            sqlite3_result_int64(context_, timerfdWakeupObj_.TimeStampData()[CurrentRow()]);
            break;
        case Index::PID:
            sqlite3_result_int64(context_, timerfdWakeupObj_.PidsData()[CurrentRow()]);
            break;
        case Index::TID:
            sqlite3_result_int64(context_, timerfdWakeupObj_.TidsData()[CurrentRow()]);
            break;
        case Index::THREAD_NAME:
            SetTypeColumnText(timerfdWakeupObj_.ThreadNamesData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::INTERVAL:
            SetTypeColumnInt64(timerfdWakeupObj_.IntervalsData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::CURR_MONO:
            SetTypeColumnInt64(timerfdWakeupObj_.CurrMonosData()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::EXPIRE_MONO:
            SetTypeColumnInt64(timerfdWakeupObj_.ExpireMonosData()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
