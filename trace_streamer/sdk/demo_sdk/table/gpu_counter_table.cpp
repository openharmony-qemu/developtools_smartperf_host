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

#include "gpu_counter_table.h"
#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { TS = 0, COUNTER_ID = 1, VALUE = 2 };
GpuCounterTable::GpuCounterTable(const TraceDataCache* dataCache) : DemoTableBase(dataCache)
{
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("ts", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("counter_id", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("value", "REAL"));
    demoTablePriKey_.push_back("ts");
    demoTablePriKey_.push_back("counter_id");
}

GpuCounterTable::~GpuCounterTable() {}

std::unique_ptr<DemoTableBase::Cursor> GpuCounterTable::CreateCursor()
{
    return std::make_unique<Cursor>(demoTraceDataCache_, this);
}

GpuCounterTable::Cursor::Cursor(const TraceDataCache* dataCache, DemoTableBase* table)
    : DemoTableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstGpuCounterData().Size())),
      gpuCounterDataObj_(dataCache->GetConstGpuCounterData())
{
}

GpuCounterTable::Cursor::~Cursor() {}

int32_t GpuCounterTable::Cursor::Column(int32_t GpuCntColumn) const
{
    switch (static_cast<Index>(GpuCntColumn)) {
        case Index::TS: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(gpuCounterDataObj_.TimeStamp()[CurrentRow()]));
            break;
        }
        case Index::COUNTER_ID: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(gpuCounterDataObj_.CounterId()[CurrentRow()]));
            break;
        }
        case Index::VALUE: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(gpuCounterDataObj_.Value()[CurrentRow()]));
            break;
        }
        default:
            TS_LOGF("Unregistered GpuCntColumn : %d", GpuCntColumn);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
