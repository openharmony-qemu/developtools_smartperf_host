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

#ifndef NETWORK_TIME_INFORMATION_TABLE_H
#define NETWORK_TIME_INFORMATION_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class NetworkTimeInformationTable : public TableBase {
public:
    explicit NetworkTimeInformationTable(const TraceDataCache *dataCache);
    ~NetworkTimeInformationTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        int32_t Column(int32_t column) const override;

    private:
        void HandleIdColumn() const;
        void HandlePidTidColumn(int32_t column) const;
        void HandleTimeColumn(int32_t column) const;
        void HandleCacheHitColumn() const;
        const NetworkTimeInformationData &networkTimeInformationDataObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // NETWORK_TIME_INFORMATION_TABLE_H