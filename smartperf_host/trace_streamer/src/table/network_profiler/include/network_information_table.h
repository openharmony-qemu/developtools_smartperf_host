/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#ifndef NETWORK_INFORMATION_TABLE_H
#define NETWORK_INFORMATION_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class NetworkInformationTable : public TableBase {
public:
    explicit NetworkInformationTable(const TraceDataCache *dataCache);
    ~NetworkInformationTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        int32_t Column(int32_t column) const override;

    private:
        void HandleIdColumn() const;
        void HandleTextColumn(int32_t column) const;
        void HandleIntColumn(int32_t column) const;
        const NetworkInformationData &networkInformationDataObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // NETWORK_INFORMATION_TABLE_H