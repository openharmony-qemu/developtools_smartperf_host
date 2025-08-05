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

#include <memory>
#include <set>
#include <string>
#include <vector>

#include "filter_constraints.h"
#include "index_map.h"
#include "sqlite3.h"
#include "trace_data_cache.h"
namespace SysTuning {
namespace TraceStreamer {
class TableBase;
using TabTemplate = std::unique_ptr<TableBase> (*)(const TraceDataCache *dataCache);
class TableBase : public sqlite3_vtab {
public:
    virtual ~TableBase();
    TableBase(const TableBase &) = delete;
    TableBase &operator=(const TableBase &) = delete;

    template <typename T>
    static void TableDeclare(sqlite3 &db, TraceDataCache *dataCache, const std::string &tableName)
    {
        TableRegister(db, dataCache, tableName, [](const TraceDataCache *cache) {
            return std::unique_ptr<TableBase>(std::make_unique<T>(cache));
        });
        dataCache->AppendNewTable(tableName);
    }
    std::string CreateTableSql() const;
    bool CanFilterId(const char op, size_t &rowCount);
    bool CanFilterSorted(const char op, size_t &rowCount);

    class Cursor : public sqlite3_vtab_cursor {
    public:
        Cursor(const TraceDataCache *dataCache, TableBase *table, uint32_t rowCount);
        virtual ~Cursor();
        virtual void Reset()
        {
            indexMap_ = std::make_unique<IndexMap>(0, rowCount_);
        }

        virtual int32_t Next();

        virtual int32_t Eof();

        virtual uint32_t CurrentRow() const;
        virtual void FilterTS(unsigned char op, sqlite3_value *argv, const std::deque<InternalTime> &times);

        virtual int32_t RowId(sqlite3_int64 *id);
        virtual int32_t Filter(const FilterConstraints &fc, sqlite3_value **argv)
        {
            Unused(fc);
            Unused(argv);
            return 0;
        }
        virtual int32_t Column(int32_t n) const = 0;
        template <typename T1, typename T2>
        void SetTypeColumnInt64(const T1 &data, const T2 &invalidValue) const
        {
            if (data != invalidValue) {
                sqlite3_result_int64(context_, static_cast<int64_t>(data));
            }
        }
        template <typename T1, typename T2>
        void SetTypeColumnInt32(const T1 &data, const T2 &invalidValue) const
        {
            if (data != invalidValue) {
                sqlite3_result_int(context_, static_cast<int32_t>(data));
            }
        }
        template <typename T>
        void SetTypeColumnInt64NotZero(const T &data) const
        {
            if (data) {
                sqlite3_result_int64(context_, static_cast<int64_t>(data));
            }
        }
        template <typename T1, typename T2>
        void SetTypeColumnText(const T1 &data, const T2 &invalidValue) const
        {
            if (data != invalidValue) {
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(data).c_str(), STR_DEFAULT_LEN, nullptr);
            }
        }
        template <typename T1, typename T2, typename T3>
        void SetTypeColumn(const T1 &data, const T2 &invalidValue, const T3 invalidTypeId) const
        {
            if (data != invalidValue) {
                sqlite3_result_int64(context_, static_cast<int64_t>(data));
            } else {
                sqlite3_result_int64(context_, static_cast<int64_t>(invalidTypeId));
            }
        }
        template <typename T1, typename T2>
        void SetTypeColumnTextNotEmpty(const T1 &data, const T2 &dataToString) const
        {
            if (!data) {
                sqlite3_result_text(context_, dataToString, STR_DEFAULT_LEN, nullptr);
            }
        }
        virtual void FilterId(unsigned char op, sqlite3_value *argv);
        virtual void FilterEnd();
        void SwapIndexFront(std::vector<FilterConstraints::Constraint> &cs, const std::set<uint32_t> &sId)
        {
            uint32_t index = 0;
            for (size_t i = 0; i < cs.size(); i++) {
                const auto &c = cs[i];
                if (sId.count(c.col)) {
                    std::swap(cs[index], cs[i]);
                    index++;
                    break;
                }
            }
        }

    public:
        sqlite3_context *context_;
        TableBase *table_ = nullptr;

    protected:
        const TraceDataCache *dataCache_;
        std::unique_ptr<IndexMap> indexMap_;
        uint32_t rowCount_;
    };

    struct ColumnInfo {
        ColumnInfo(const std::string &name, const std::string &type) : name_(name), type_(type) {}
        std::string name_;
        std::string type_;
    };

protected:
    explicit TableBase(const TraceDataCache *dataCache) : dataCache_(dataCache), cursor_(nullptr) {}

    struct EstimatedIndexInfo {
        int64_t estimatedRows = 0;
        double estimatedCost = 0.0;
        bool isOrdered = false;
    };

    static void TableRegister(sqlite3 &db, TraceDataCache *cache, const std::string &tableName, TabTemplate tmplate);
    static void SetModuleCallbacks(sqlite3_module &module, const std::string &tableName);
    virtual int32_t Update(int32_t argc, sqlite3_value **argv, sqlite3_int64 *pRowid)
    {
        return SQLITE_READONLY;
    }

    int32_t BestIndex(sqlite3_index_info *idxInfo);
    // needs to correspond to Cursor::Filter()
    virtual void FilterByConstraint(FilterConstraints &fc, double &filterCost, size_t rowCount, uint32_t currenti)
    {
        Unused(fc);
        Unused(filterCost);
        Unused(rowCount);
        Unused(currenti);
    }

    virtual int64_t GetSize()
    {
        return -1;
    }

    virtual void GetOrbyes(FilterConstraints &fc, EstimatedIndexInfo &ei)
    {
        Unused(fc);
        Unused(ei);
    }
    // needs to correspond to Cursor::Filter()
    virtual void EstimateFilterCost(FilterConstraints &fc, EstimatedIndexInfo &ei);
    double CalculateFilterCost(int64_t rowCount, FilterConstraints &fc);

    virtual std::unique_ptr<Cursor> CreateCursor() = 0;
    int32_t Open(sqlite3_vtab_cursor **ppCursor);
    virtual void Init(int32_t, const char *const *)
    {
        return;
    };

public:
    std::string name_;

protected:
    std::vector<ColumnInfo> tableColumn_ = {};
    std::vector<std::string> tablePriKey_ = {};
    const TraceDataCache *dataCache_;
    TraceDataCache *wdataCache_ = nullptr;
    std::unique_ptr<Cursor> cursor_;

private:
    uint16_t bestIndexNum_ = 0;
    int32_t cacheIdxNum_ = 0;
    FilterConstraints cacheConstraint_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // TABLE_H
