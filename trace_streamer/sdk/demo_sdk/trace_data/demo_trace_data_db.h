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

#ifndef DEMO_TRACE_DATA_DB_H
#define DEMO_TRACE_DATA_DB_H

#include <functional>
#include <list>
#include <string>
#include "sqlite3.h"

namespace SysTuning {
namespace TraceStreamer {
const int32_t SEND_CONTINUE = 0;
const int32_t SEND_FINISH = 1;
class DemoTraceDataDB {
public:
    DemoTraceDataDB();
    DemoTraceDataDB(const DemoTraceDataDB&) = delete;
    DemoTraceDataDB& operator=(const DemoTraceDataDB&) = delete;
    virtual ~DemoTraceDataDB();
    virtual void DemoInitDB() = 0;
    void DemoPrepare();

public:
    int32_t DemoExportDatabase(const std::string& outputName);
    int32_t DemoSearchData();
    int32_t DemoOperateDatabase(const std::string& sql);
    using ResultCallBack = std::function<void(const std::string /* json result */, int32_t, int32_t)>;
    bool AddColumnsToJsonArray(sqlite3_stmt* stmtSql,
                               char* resValue,
                               const int32_t outLen,
                               int32_t& pos,
                               const int32_t colCount);
    bool AddRowsToJsonArray(sqlite3_stmt* stmtSql,
                            char* resValue,
                            const int32_t outLen,
                            int32_t& pos,
                            const int32_t colCount);
    int32_t DemoSearchDatabase(const std::string& sql, ResultCallBack resultCallBack);
    int32_t DemoSearchDatabase(const std::string& sql, uint8_t* out, int32_t outLen);
    void DemoSetCancel(bool cancel);
    void DemoAppendNewTable(std::string tableName);
    void DemoEnableMetaTable(bool enabled);
    bool DemoCancel() const
    {
        return demoCancelQuery_;
    }

public:
    sqlite3* demoDb_;

private:
    void DemoExecuteSql(const std::string_view& sql);
    static void DemoGetRowString(sqlite3_stmt* stmt, int32_t colCount, std::string& rowStr);
    int32_t DemoSearchDatabase(const std::string& sql, bool print);
    std::list<std::string> demoInternalTables_ = {};
    bool demoExportMetaTable_ = true;
    bool demoPared_ = false;
    bool demoCancelQuery_ = false;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
