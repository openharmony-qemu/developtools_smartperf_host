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

#include "slice_object_table.h"
#include <cmath>

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { SLICE_ID = 0, SLICE_NAME = 1 };
SliceObjectTable::SliceObjectTable(const TraceDataCache *dataCache) : DemoTableBase(dataCache)
{
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("slice_id", "INTEGER"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("slice_name", "REAL"));
    demoTablePriKey_.push_back("slice_id");
}

SliceObjectTable::~SliceObjectTable() {}

std::unique_ptr<DemoTableBase::Cursor> SliceObjectTable::CreateCursor()
{
    return std::make_unique<Cursor>(demoTraceDataCache_, this);
}

SliceObjectTable::Cursor::Cursor(const TraceDataCache *dataCache, DemoTableBase *table)
    : DemoTableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstSliceObjectData().Size())),
      sliceObjectDataObj_(dataCache->GetConstSliceObjectData())
{
}

SliceObjectTable::Cursor::~Cursor() {}

int32_t SliceObjectTable::Cursor::Column(int32_t sliceObjColumn) const
{
    switch (static_cast<Index>(sliceObjColumn)) {
        case Index::SLICE_ID: {
            sqlite3_result_int64(demoContext_, static_cast<int64_t>(sliceObjectDataObj_.SliceId()[CurrentRow()]));
            break;
        }
        case Index::SLICE_NAME: {
            sqlite3_result_text(demoContext_, sliceObjectDataObj_.SliceName()[CurrentRow()].c_str(), STR_DEFAULT_LEN,
                                nullptr);
            break;
        }
        default:
            TS_LOGF("Unregistered sliceObjColumn : %d", sliceObjColumn);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
