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

#include "demo_meta_table.h"
#include "trace_stdtype.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { NAMEINDEX = 0, VALUE };
DemoMetaTable::DemoMetaTable(const TraceDataCache *dataCache) : DemoTableBase(dataCache)
{
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("name", "TEXT"));
    demoTableColumn_.push_back(DemoTableBase::ColumnInfo("value", "TEXT"));
    demoTablePriKey_.push_back("name");
}

DemoMetaTable::~DemoMetaTable() {}

std::unique_ptr<DemoTableBase::Cursor> DemoMetaTable::CreateCursor()
{
    return std::make_unique<Cursor>(demoTraceDataCache_, this);
}

DemoMetaTable::Cursor::Cursor(const TraceDataCache *dataCache, DemoTableBase *table)
    : DemoTableBase::Cursor(dataCache, table, MetaDataItem::METADATA_ITEM_MAX)
{
}

DemoMetaTable::Cursor::~Cursor() {}

int32_t DemoMetaTable::Cursor::Column(int32_t demoMetaColumn) const
{
    switch (static_cast<Index>(demoMetaColumn)) {
        case Index::NAMEINDEX:
            sqlite3_result_text(demoContext_, demoDataCache_->GetConstMetaData().Name(CurrentRow()).c_str(),
                                STR_DEFAULT_LEN, nullptr);
            break;
        case Index::VALUE:
            sqlite3_result_text(demoContext_, demoDataCache_->GetConstMetaData().Value(CurrentRow()).c_str(),
                                STR_DEFAULT_LEN, nullptr);
            break;
        default:
            TS_LOGF("Unregistered demoMetaColumn : %d", demoMetaColumn);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
