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

#include "slice_table.h"
#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { TS = 0, ENDTS = 1, VALUE = 2, SLICE_ID = 3 };
SliceTable::SliceTable(const TraceDataCache* dataCache) : DemoTableBase(dataCache)
{
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("start_ts", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("end_ts", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("value", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("slice_id", "INTEGER"));
    demoTablePriKey_.push_back("start_ts");
    demoTablePriKey_.push_back("slice_id");
}

SliceTable::~SliceTable() {}

std::unique_ptr<DemoTableBase::Cursor> SliceTable::CreateCursor()
{
    return std::make_unique<Cursor>(demoTraceDataCache_, this);
}

SliceTable::Cursor::Cursor(const TraceDataCache* dataCache, DemoTableBase* table)
    : DemoTableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSliceData().Size())),
      sliceDataObj_(dataCache->GetConstSliceData())
{
}

SliceTable::Cursor::~Cursor() {}

int32_t SliceTable::Cursor::Column(int32_t SliceTabColumn) const
{
    switch (static_cast<Index>(SliceTabColumn)) {
        case Index::TS: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(sliceDataObj_.TimeStamp()[CurrentRow()]));
            break;
        }
        case Index::ENDTS: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(sliceDataObj_.EndTs()[CurrentRow()]));
            break;
        }
        case Index::VALUE: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(sliceDataObj_.Value()[CurrentRow()]));
            break;
        }
        case Index::SLICE_ID: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(sliceDataObj_.SliceId()[CurrentRow()]));
            break;
        }
        default:
            TS_LOGF("Unregistered SliceTabColumn : %d", SliceTabColumn);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
