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

#ifndef TABLE_H
#define TABLE_H

#include <log.h>
#include <memory>
#include <string>
#include <vector>

#include "filter_constraints.h"
#include "index_map.h"
#include "sqlite3.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class DemoTableBase;
using TabTemplate = std::unique_ptr<DemoTableBase> (*)(const TraceDataCache *dataCache);
class DemoTableBase : public sqlite3_vtab {
public:
    virtual ~DemoTableBase();
    DemoTableBase(const DemoTableBase &) = delete;
    DemoTableBase &operator=(const DemoTableBase &) = delete;

    template <typename T>
    static void TableDeclare(sqlite3 &db, TraceDataCache *dataCache, const std::string &name)
    {
        DemoTableRegister(db, dataCache, name, [](const TraceDataCache *cache) {
            return std::unique_ptr<DemoTableBase>(std::make_unique<T>(cache));
        });
        dataCache->DemoAppendNewTable(name);
    }
    static void SetModuleCallbacks(sqlite3_module &demoModule, const std::string &demoTableName);
    std::string DemoCreateTableSql() const;

    class Cursor : public sqlite3_vtab_cursor {
    public:
        Cursor(const TraceDataCache *dataCache, DemoTableBase *table, uint32_t rowCount);
        virtual ~Cursor();
        virtual void Reset()
        {
            demoIndexMap_ = std::make_unique<IndexMap>(0, demoRowCount_);
        }

        virtual int32_t Next()
        {
            demoIndexMap_->Next();
            return SQLITE_OK;
        }

        virtual int32_t Eof()
        {
            return demoDataCache_->DemoCancel() || demoIndexMap_->Eof();
        }

        virtual uint32_t CurrentRow() const
        {
            return demoIndexMap_->CurrentRow();
        }
        virtual void DemoFilterTS(unsigned char op, sqlite3_value *argv, const std::deque<InternalTime> &times);

        virtual int32_t DemoRowId(sqlite3_int64 *id);
        virtual int32_t DemoFilter(const FilterConstraints &fc, sqlite3_value **argv)
        {
            Unused(fc);
            Unused(argv);
            return 0;
        }
        virtual int32_t Column(int32_t n) const = 0;
        virtual void DemoFilterId(unsigned char op, sqlite3_value *argv);

    public:
        sqlite3_context *demoContext_;
        DemoTableBase *demoTable_ = nullptr;

    protected:
        const TraceDataCache *demoDataCache_;
        std::unique_ptr<IndexMap> demoIndexMap_;
        uint32_t demoRowCount_;
    };

    struct ColumnInfo {
        ColumnInfo(const std::string &name, const std::string &type) : columnName(name), columnType(type) {}
        std::string columnName;
        std::string columnType;
    };

protected:
    explicit DemoTableBase(const TraceDataCache *dataCache) : demoTraceDataCache_(dataCache), demoCursor_(nullptr) {}

    struct EstimatedIndexInfo {
        int64_t estimatedRows = 0;
        double estimatedCost = 0.0;
        bool isOrdered = false;
    };

    static void DemoTableRegister(sqlite3 &db,
                                  TraceDataCache *cache,
                                  const std::string &tableName,
                                  TabTemplate tmplate);
    virtual int32_t DemoUpdate(int32_t argc, sqlite3_value **argv, sqlite3_int64 *pRowid)
    {
        return SQLITE_READONLY;
    }
    int32_t DemoBestIndex(sqlite3_index_info *idxInfo);
    // needs to correspond to Cursor::DemoFilter()
    virtual void DemoEstimateFilterCost(FilterConstraints &fc, EstimatedIndexInfo &ei)
    {
        Unused(fc);
        Unused(ei);
    }
    virtual std::unique_ptr<Cursor> CreateCursor() = 0;
    int32_t DemoOpen(sqlite3_vtab_cursor **ppCursor);
    virtual void DemoInit(int32_t, const char *const *)
    {
        return;
    };

protected:
    std::vector<ColumnInfo> demoTableColumn_ = {};
    std::vector<std::string> demoTablePriKey_ = {};
    const TraceDataCache *demoTraceDataCache_;
    TraceDataCache *demoWdataCache_ = nullptr;
    std::unique_ptr<Cursor> demoCursor_;

private:
    uint16_t demoBestIndexNum_ = 0;
    int32_t demoCacheIdxNum_ = 0;
    FilterConstraints demoCacheConstraint_;
    std::string name_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // TABLE_H
