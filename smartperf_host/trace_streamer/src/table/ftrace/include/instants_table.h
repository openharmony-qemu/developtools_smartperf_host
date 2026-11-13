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

#ifndef INSTANTS_TABLE_H
#define INSTANTS_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class InstantsTable : public TableBase {
public:
    explicit InstantsTable(const TraceDataCache *dataCache);
    ~InstantsTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->GetConstInstantsData().Size();
    }
    void GetOrbyes(FilterConstraints &instantsfc, EstimatedIndexInfo &instantsei) override;
    void FilterByConstraint(FilterConstraints &instantsfc,
                            double &instantsfilterCost,
                            size_t instantsrowCount,
                            uint32_t instantscurrenti) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        int32_t Filter(const FilterConstraints &fc, sqlite3_value **argv) override;
        int32_t Column(int32_t column) const override;

    private:
        void SortOfIndexMap(const FilterConstraints &fc);
        const Instants &InstantsObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // INSTANTS_TABLE_H
