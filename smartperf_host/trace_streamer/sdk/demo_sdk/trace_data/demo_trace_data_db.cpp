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

#include "demo_trace_data_db.h"
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <functional>
#include <iostream>
#include <string_view>
#include <unistd.h>

#include "file.h"
#include "log.h"
#include "sqlite3.h"
#include "sqlite_ext/sqlite_ext_funcs.h"
#include "string_help.h"

const int32_t ONCE_MAX_MB = 1024 * 1024 * 4;
namespace SysTuning {
namespace TraceStreamer {
#define UNUSED(expr)             \
    do {                         \
        static_cast<void>(expr); \
    } while (0)
using namespace SysTuning::base;
DemoTraceDataDB::DemoTraceDataDB() : demoDb_(nullptr)
{
    if (sqlite3_threadsafe() > 0) {
        int32_t ret = sqlite3_config(SQLITE_CONFIG_SERIALIZED);
        if (ret == SQLITE_OK) {
            TS_LOGI("Can now use sqlite on multiple threads, using the same connection");
        } else {
            TS_LOGE("setting sqlite thread safe mode to serialized failed!!! return code: %d", ret);
        }
    } else {
        TS_LOGE("Your SQLite database is not compiled to be threadsafe.");
    }
    if (sqlite3_open(":memory:", &demoDb_)) {
        TS_LOGF("open :memory db failed");
    }
    ts_create_extend_function(demoDb_);
}

DemoTraceDataDB::~DemoTraceDataDB()
{
    sqlite3_close(demoDb_);
}

void DemoTraceDataDB::DemoSetCancel(bool cancel)
{
    demoCancelQuery_ = cancel;
}

void DemoTraceDataDB::DemoAppendNewTable(std::string tableName)
{
    demoInternalTables_.push_back(tableName);
}
void DemoTraceDataDB::DemoEnableMetaTable(bool enabled)
{
    demoExportMetaTable_ = enabled;
}
int32_t DemoTraceDataDB::DemoExportDatabase(const std::string &outputName)
{
    {
        int32_t demoFd(base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW));
        if (!demoFd) {
            fprintf(stdout, "Failed to create file: %s", outputName.c_str());
            return 1;
        }
        auto ret = ftruncate(demoFd, 0);
        UNUSED(ret);
        close(demoFd);
    }

    std::string demoAttachSql("ATTACH DATABASE '" + outputName + "' AS systuning_export");
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t *>(demoAttachSql.c_str()), demoAttachSql.length())) {
        demoAttachSql = base::GbkToUtf8(demoAttachSql.c_str());
    }
#endif
    DemoExecuteSql(demoAttachSql);

    for (auto itor = demoInternalTables_.begin(); itor != demoInternalTables_.end(); itor++) {
        if (*itor == "meta" && !demoExportMetaTable_) {
            continue;
        } else {
            std::string demoExportSql("CREATE TABLE systuning_export." + (*itor) + " AS SELECT * FROM " + *itor);
            DemoExecuteSql(demoExportSql);
        }
    }
    std::string demoCreateArgsView =
        "create view systuning_export.args_view AS select A.argset, V2.data as keyName, A.id, D.desc, (case when "
        "A.datatype==1 then V.data else A.value end) as strValue from args as A left join data_type as D on (D.typeId "
        "= A.datatype) left join data_dict as V on V.id = A.value left join data_dict as V2 on V2.id = A.key";
    DemoExecuteSql(demoCreateArgsView);
    std::string demoUpdateProcessName =
        "update process set name =  (select name from thread t where t.ipid = process.id and t.name is not null and "
        "is_main_thread = 1)";
    DemoExecuteSql(demoUpdateProcessName);
    std::string demoDetachSql("DETACH DATABASE systuning_export");
    DemoExecuteSql(demoDetachSql);
    return 0;
}
void DemoTraceDataDB::DemoPrepare()
{
    if (demoPared_) {
        return;
    }
    demoPared_ = true;
    std::string demoCreateArgsView =
        "create view args_view AS select A.argset, V2.data as keyName, A.id, D.desc, (case when "
        "A.datatype==1 then V.data else A.value end) as strValue from args as A left join data_type as D on "
        "(D.typeId "
        "= A.datatype) left join data_dict as V on V.id = A.value left join data_dict as V2 on V2.id = A.key";
    DemoExecuteSql(demoCreateArgsView);

    std::string demoUpdateProcessNewName =
        "update process set name =  (select name from thread t where t.ipid = process.id and t.name is not "
        "null and "
        "is_main_thread = 1)";
    DemoExecuteSql(demoUpdateProcessNewName);
}
void DemoTraceDataDB::DemoExecuteSql(const std::string_view &sql)
{
    sqlite3_stmt *demoStmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(demoDb_, sql.data(), static_cast<int32_t>(sql.size()), &demoStmt, nullptr);

    while (!ret) {
        int32_t err = sqlite3_step(demoStmt);
        if (err == SQLITE_ROW) {
            continue;
        }
        if (err == SQLITE_DONE) {
            break;
        }
        ret = err;
    }

    sqlite3_finalize(demoStmt);
}
int32_t DemoTraceDataDB::DemoSearchData()
{
    DemoPrepare();
    std::string strLine;
    bool printResult = false;
    for (;;) {
        std::cout << "> ";
        getline(std::cin, strLine);
        if (strLine.empty()) {
            std::cout << "If you want to quit either type -q or press CTRL-Z" << std::endl;
            continue;
        }
        if (!strLine.compare("-q") || !strLine.compare("-quit")) {
            break;
        } else if (!strLine.compare("-e")) {
            TS_LOGI("the db file will be at current folder, the name is default.db");
            return DemoExportDatabase("default.db");
        } else if (!strLine.compare("-help") || !strLine.compare("-h")) {
            std::cout << "use info" << std::endl;
            continue;
        } else if (!strLine.compare("-p")) {
            std::cout << "will print result of query" << std::endl;
            printResult = true;
            continue;
        } else if (!strLine.compare("-up")) {
            std::cout << "will not print result of query" << std::endl;
            printResult = false;
            continue;
        } else if (strLine.find("-c:") != std::string::npos) {
            strLine = strLine.substr(strlen("-c:"));
            if (DemoOperateDatabase(strLine) == SQLITE_OK) {
                printf("operate SQL success\n");
            }
            continue;
        }

        using namespace std::chrono;
        const auto start = steady_clock::now();
        int32_t rowCount = DemoSearchDatabase(strLine, printResult);
        std::chrono::nanoseconds searchDur = duration_cast<nanoseconds>(steady_clock::now() - start);
        printf("\"%s\"\n\tused %.3fms row: %d\n", strLine.c_str(), searchDur.count() / 1E6, rowCount);
    }
    return 0;
}
int32_t DemoTraceDataDB::DemoSearchDatabase(const std::string &sql, bool print)
{
    DemoPrepare();
    int32_t demoRowCount = 0;
    sqlite3_stmt *demoStmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(demoDb_, sql.c_str(), static_cast<int32_t>(sql.size()), &demoStmt, nullptr);
    if (ret != SQLITE_OK) {
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(demoDb_));
        return 0;
    }
    int32_t demoColCount = sqlite3_column_count(demoStmt);
    if (demoColCount == 0) {
        TS_LOGI("sqlite3_column_count(%s) no column", sql.c_str());
        sqlite3_finalize(demoStmt);
        return 0;
    }
    if (print) {
        for (int32_t i = 0; i < demoColCount; i++) {
            printf("%s\t", sqlite3_column_name(demoStmt, i));
        }
        printf("\n");
    }
    while (sqlite3_step(demoStmt) == SQLITE_ROW) {
        demoRowCount++;
        for (int32_t i = 0; i < demoColCount; i++) {
            const char *sqlVal = reinterpret_cast<const char *>(sqlite3_column_text(demoStmt, i));
            int32_t type = sqlite3_column_type(demoStmt, i);
            if (!print) {
                continue;
            }
            if (sqlVal == nullptr) {
                printf("null\t");
                continue;
            }
            if (type == SQLITE_TEXT) {
                printf("\"%s\"\t", sqlVal);
            } else {
                printf("%s\t", sqlVal);
            }
        }
        if (print) {
            printf("\n");
        }
    }
    sqlite3_finalize(demoStmt);
    return demoRowCount;
}
int32_t DemoTraceDataDB::DemoOperateDatabase(const std::string &sql)
{
    DemoPrepare();
    char *errMsg = nullptr;
    int32_t ret = sqlite3_exec(demoDb_, sql.c_str(), NULL, NULL, &errMsg);
    if (ret != SQLITE_OK && errMsg) {
        TS_LOGE("sqlite3_exec(%s) failed: %d:%s", sql.c_str(), ret, errMsg);
        sqlite3_free(errMsg);
    }
    return ret;
}

int32_t DemoTraceDataDB::DemoSearchDatabase(const std::string &sql, ResultCallBack resultCallBack)
{
    DemoPrepare();
    sqlite3_stmt *stmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(demoDb_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    if (ret != SQLITE_OK) {
        resultCallBack("false\r\n", SEND_FINISH, 0);
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(demoDb_));
        return ret;
    }
    if (!resultCallBack) {
        return ret;
    }
    std::string resValue = "ok\r\n";
    int32_t colCount = sqlite3_column_count(stmt);
    if (colCount == 0) {
        resultCallBack(resValue, SEND_FINISH, 0);
        return ret;
    }
    resValue += "{\"columns\":[";
    for (int32_t i = 0; i < colCount; i++) {
        resValue += "\"";
        resValue += sqlite3_column_name(stmt, i);
        resValue += "\",";
    }
    resValue.pop_back(); // remove the last ","
    resValue += "],\"values\":[";
    bool hasRow = false;
    constexpr int32_t defaultLenRowString = 1024;
    std::string row;
    row.reserve(defaultLenRowString);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasRow = true;
        DemoGetRowString(stmt, colCount, row);
        resValue += row + ",";
        if (resValue.size() >= ONCE_MAX_MB) {
            resultCallBack(resValue, SEND_CONTINUE, 0);
            resValue = "";
        }
    }
    if (hasRow) {
        resValue.pop_back(); // remove the last ','
    }
    resValue += "]}\r\n";
    resultCallBack(resValue, SEND_FINISH, 0);
    sqlite3_finalize(stmt);
    return ret;
}

bool DemoTraceDataDB::AddColumnsToJsonArray(sqlite3_stmt *stmtSql,
                                            char *resValue,
                                            const int32_t outLen,
                                            int32_t &pos,
                                            const int32_t colCount)
{
    int32_t retSnprintf = snprintf_s(resValue + pos, outLen - pos, 1, "%s", "{\"columns\":[");
    if (retSnprintf < 0) {
        return false;
    }
    pos += retSnprintf;
    for (int32_t i = 0; i < colCount; i++) {
        retSnprintf =
            snprintf_s(resValue + pos, outLen - pos, 1, "%s%s%s", "\"", sqlite3_column_name(stmtSql, i), "\",");
        if (retSnprintf < 0) {
            return false;
        }
        pos += retSnprintf;
    }
    pos--; // remove the last ','
    retSnprintf = snprintf_s(resValue + pos, outLen - pos, 1, "],\"values\":[");
    if (retSnprintf < 0) {
        return false;
    }
    pos += retSnprintf;
    return true;
}
bool DemoTraceDataDB::AddRowsToJsonArray(sqlite3_stmt *stmtSql,
                                         char *resValue,
                                         const int32_t outLen,
                                         int32_t &pos,
                                         const int32_t colCount)
{
    bool hasRow = false;
    constexpr int32_t defaultLenRowString = 1024;
    std::string row;
    row.reserve(defaultLenRowString);
    while (sqlite3_step(stmtSql) == SQLITE_ROW) {
        hasRow = true;
        DemoGetRowString(stmtSql, colCount, row);
        if (pos + row.size() + strlen(",]}\r\n") >= size_t(outLen)) {
            int32_t retSnprintf = snprintf_s(resValue + pos, outLen - pos, 1, "]}\r\n");
            if (retSnprintf < 0) {
                return false;
            }
            pos += retSnprintf;
            return true;
        }
        int32_t retSnprintf = snprintf_s(resValue + pos, outLen - pos, 1, "%s%s", row.c_str(), ",");
        if (retSnprintf < 0) {
            return false;
        }
        pos += retSnprintf;
    }
    if (hasRow) {
        pos--; // remove the last ','
    }
    int32_t retSnprintf = snprintf_s(resValue + pos, outLen - pos, 1, "]}\r\n");
    if (retSnprintf < 0) {
        return false;
    }
    pos += retSnprintf;
    return true;
}
int32_t DemoTraceDataDB::DemoSearchDatabase(const std::string &sql, uint8_t *out, int32_t outLen)
{
    DemoPrepare();
    sqlite3_stmt *stmtSql = nullptr;
    int32_t ret = sqlite3_prepare_v2(demoDb_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmtSql, nullptr);
    if (ret != SQLITE_OK) {
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(demoDb_));
        return -1;
    }
    char *resValue = reinterpret_cast<char *>(out);
    int32_t retSnprintf = snprintf_s(resValue, outLen, 1, "ok\r\n");
    if (retSnprintf < 0) {
        return -1;
    }
    int32_t pos = retSnprintf;
    int32_t colCount = sqlite3_column_count(stmtSql);
    if (colCount == 0) {
        return pos;
    }
    if (!AddColumnsToJsonArray(stmtSql, resValue, outLen, pos, colCount)) {
        return -1;
    }
    if (!AddRowsToJsonArray(stmtSql, resValue, outLen, pos, colCount)) {
        return -1;
    }
    sqlite3_finalize(stmtSql);
    return pos;
}

void DemoTraceDataDB::DemoGetRowString(sqlite3_stmt *stmt, int32_t colCount, std::string &rowString)
{
    rowString.clear();
    rowString = "[";
    for (int32_t i = 0; i < colCount; i++) {
        const char *p = reinterpret_cast<const char *>(sqlite3_column_text(stmt, i));
        if (p == nullptr) {
            rowString += "null,";
            continue;
        }
        int32_t type = sqlite3_column_type(stmt, i);
        switch (type) {
            case SQLITE_TEXT:
                rowString += "\"";
                rowString += p;
                rowString += "\"";
                break;
            default:
                rowString += p;
                break;
        }
        rowString += ",";
    }
    rowString.pop_back(); // remove the last ','
    rowString += "]";
}
} // namespace TraceStreamer
} // namespace SysTuning
