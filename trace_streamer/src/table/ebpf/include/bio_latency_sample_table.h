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

#ifndef BIO_LATENCY_SAMPLE_TABLE_H
#define BIO_LATENCY_SAMPLE_TABLE_H

#include "table_base.h"
#include "ebpf_stdtype.h"

namespace SysTuning {
namespace TraceStreamer {
class BioLatencySampleTable : public TableBase {
public:
    explicit BioLatencySampleTable(const TraceDataCache* dataCache);
    ~BioLatencySampleTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->GetConstBioLatencySampleData().Size();
    }
    void GetOrbyes(FilterConstraints& biofc, EstimatedIndexInfo& bioei) override;
    void FilterByConstraint(FilterConstraints& biofc,
                            double& biofilterCost,
                            size_t biorowCount,
                            uint32_t biocurrenti) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache* dataCache, TableBase* table);
        ~Cursor() override;
        int32_t Filter(const FilterConstraints& fcs, sqlite3_value** argv) override;
        int32_t Column(int32_t column) const override;

    private:
        const BioLatencySampleData& bioLatencySampleObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // BIO_LATENCY_SAMPLE_TABLE_H
