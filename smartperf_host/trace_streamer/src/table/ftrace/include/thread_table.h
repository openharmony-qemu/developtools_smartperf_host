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

#ifndef SRC_THREAD_TABLE_H
#define SRC_THREAD_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class ThreadTable : public TableBase {
public:
    explicit ThreadTable(const TraceDataCache *dataCache);
    ~ThreadTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->ThreadSize();
    }
    void GetOrbyes(FilterConstraints &fc, EstimatedIndexInfo &ei) override;
    void FilterByConstraint(FilterConstraints &threadfc,
                            double &threadfilterCost,
                            size_t threadrowCount,
                            uint32_t threadcurrenti) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        void FilterIndex(int32_t col, unsigned char op, sqlite3_value *argv);
        int32_t Filter(const FilterConstraints &fc, sqlite3_value **argv) override;
        int32_t Column(int32_t col) const override;
        void FilterId(unsigned char op, sqlite3_value *argv) override;

    private:
        void SetNameColumn(const Thread &thread) const;
        IndexMap *indexMapBack_ = nullptr;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // SRC_THREAD_TABLE_H
