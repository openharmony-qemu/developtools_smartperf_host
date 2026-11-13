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

#ifndef TRACE_DATA_DB_H
#define TRACE_DATA_DB_H

#include <functional>
#include <list>
#include <map>
#include <memory>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>
#include "sqlite3.h"
#include "sqllite_prepar_cache_data.h"

struct ElfSymbolTable {
    uint64_t filePathIndex;
    uint64_t textVaddr;
    uint32_t textOffset;
    uint32_t symEntSize;
    std::string strTable;
    std::string symTable;
};

namespace SysTuning {
namespace TraceStreamer {
constexpr int32_t DATABASE_BASE = (1U << 20);
class TraceDataDB {
public:
    TraceDataDB();
    TraceDataDB(const TraceDataDB &) = delete;
    TraceDataDB &operator=(const TraceDataDB &) = delete;
    virtual ~TraceDataDB();
    void Prepare();

public:
    using ResultCallBack = std::function<void(const std::string & /* json or proto result */, int32_t)>;
    int32_t ExportDatabase(const std::string &outputName, ResultCallBack resultCallBack = nullptr);
    int32_t BatchExportDatabase(const std::string &outputName);
    int32_t CreatEmptyBatchDB(const std::string &outputName);
    void RevertTableName(const std::string &outputName);
    void CloseBatchDB();
    std::vector<std::string> SearchData();
    int32_t OperateDatabase(const std::string &sql);
    int32_t SearchDatabase(const std::string &sql, ResultCallBack resultCallBack);
    int32_t SearchDatabase(const std::string &sql, uint8_t *out, int32_t outLen);
    int32_t SearchDatabase(std::string &sql, bool print);
    int32_t SearchDatabaseToProto(const std::string &data, SqllitePreparCacheData::TLVResultCallBack resultCallBack);
    std::string SearchDatabase(const std::string &sql);
    void SetCancel(bool cancel);
    void AppendNewTable(std::string tableName);
    void EnableMetaTable(bool enabled);
    bool Cancel() const
    {
        return cancelQuery_;
    }

public:
    sqlite3 *db_;

protected:
    std::unordered_map<std::string, size_t> tableToCompletedSize_;

private:
    void ExecuteSql(const std::string_view &sql);
    void SendDatabase(ResultCallBack resultCallBack);
    void ParseCommandLine(std::string &option, std::string line, std::vector<std::string> &values);
    void PrintSearchResult(std::string line, bool printResult);
    int32_t HandleColumnNames(sqlite3_stmt *stmt, char *res, int32_t outLen, int32_t pos, int32_t colCount);
    int32_t HandleRowData(sqlite3_stmt *stmt, char *res, int32_t outLen, int32_t pos, int32_t colCount);
    static void GetRowString(sqlite3_stmt *stmt, int32_t colCount, std::string &rowStr);
    static void SqliteFinalize(sqlite3_stmt *ptr);
    void InitTableToCompletedSize();

private:
    std::list<std::string> internalTables_ = {};
    bool exportMetaTable_ = true;
    bool pared_ = false;
    bool cancelQuery_ = false;
    std::string wasmDBName_;
    SqllitePreparCacheData sqlPreparCacheData_;
    std::set<std::string> needClearTable_ = {"data_type", "device_info",  "data_dict", "meta",    "clock_snapshot",
                                             "callstack", "thread_state", "stat",      "symbols", "thread",
                                             "process",   "trace_range",  "args_view"};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
