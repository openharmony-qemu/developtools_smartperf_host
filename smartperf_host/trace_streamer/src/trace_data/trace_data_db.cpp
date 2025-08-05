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

#include "trace_data_db.h"
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <functional>
#include <string_view>
#include <unistd.h>
#include <regex>

#include "codec_cov.h"
#include "file.h"
#include "sph_data.pb.h"
#include "sqlite3.h"
#include "sqlite_ext_funcs.h"
#include "string_help.h"
#include "ts_common.h"

namespace {
const std::string UPDATE_MEM_PROC_NAME =
    "update process set name = (select name from thread t where t.ipid = process.id and t.name is not null and "
    "is_main_thread = 1)";
const std::string CREATE_MEM_ARGS_VIEW =
    "create view args_view AS select A.argset, V2.data as keyName, A.id, D.desc, (case when "
    "A.datatype==1 then V.data else A.value end) as strValue from args as A left join data_type as D on "
    "(D.typeId "
    "= A.datatype) left join data_dict as V on V.id = A.value left join data_dict as V2 on V2.id = A.key";
// notice 'systuning_export' is 'ATTACH DATABASE name'
const std::string CREATE_EXPORT_DB_ARGS_VIEW =
    "create view systuning_export.args_view AS select A.argset, V2.data as keyName, A.id, D.desc, (case when "
    "A.datatype==1 then V.data else A.value end) as strValue from args as A left join data_type as D on (D.typeId "
    "= A.datatype) left join data_dict as V on V.id = A.value left join data_dict as V2 on V2.id = A.key";
const std::string CREATE_BATCH_EXPORT_DB_ARGS_VIEW =
    "create view systuning_export.args_view AS select A.argset, V2.data as keyName, A.id, D.desc, (case when "
    "A.datatype==1 then V.data else A.value end) as strValue from args_ as A left join data_type_ as D on "
    "(D.typeId "
    "= A.datatype) left join data_dict_ as V on V.id = A.value left join data_dict_ as V2 on V2.id = A.key";
} // namespace

namespace SysTuning {
namespace TraceStreamer {
const int32_t ONCE_MAX_MB = 1024 * 1024 * 4;
constexpr int32_t DEFAULT_LEN_ROW_STRING = 1024;

enum class DBFiledType : uint8_t { INT = 0, TEXT };
using namespace SysTuning::base;

TraceDataDB::TraceDataDB() : db_(nullptr)
{
    if (sqlite3_threadsafe() > 0) {
        int32_t retCode = sqlite3_config(SQLITE_CONFIG_SERIALIZED);
        if (retCode == SQLITE_OK) {
            TS_LOGI("Can now use sqlite on multiple threads, using the same connection");
        } else {
            TS_LOGE("setting sqlite thread safe mode to serialized failed!!! return code: %d", retCode);
        }
    } else {
        TS_LOGE("Your SQLite database is not compiled to be threadsafe.");
    }
    if (sqlite3_open(":memory:", &db_)) {
        TS_LOGF("open :memory db failed");
    }
    ts_create_extend_function(db_);
    InitTableToCompletedSize();
}
void TraceDataDB::InitTableToCompletedSize()
{
    tableToCompletedSize_.insert({"measure", 0});
}
TraceDataDB::~TraceDataDB()
{
    sqlite3_close(db_);
}

void TraceDataDB::AppendNewTable(std::string tableName)
{
    internalTables_.push_back(tableName);
}
void TraceDataDB::EnableMetaTable(bool enabled)
{
    exportMetaTable_ = enabled;
}

void TraceDataDB::SendDatabase(ResultCallBack resultCallBack)
{
    int32_t fd(base::OpenFile(wasmDBName_, O_RDWR, TS_PERMISSION_RW));
    if (!fd) {
        TS_LOGD("Failed to open file: %s", wasmDBName_.c_str());
        return;
    }

    while (true) {
        uint8_t data[DATABASE_BASE];
        auto size = base::Read(fd, data, DATABASE_BASE);
        if (size == 0) {
            resultCallBack(std::string((char *)data, size), SEND_FINISH);
            break;
        } else if (size < 0) {
            TS_LOGD("Reading trace file failed (errno: %d, %s)", errno, strerror(errno));
            break;
        }
        resultCallBack(std::string((char *)data, DATABASE_BASE), SEND_CONTINUE);
    }
    close(fd);
    (void)remove(wasmDBName_.c_str());
    wasmDBName_.clear();
}
int32_t TraceDataDB::CreatEmptyBatchDB(const std::string &outputName)
{
    {
        int32_t fd(base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW));
        if (!fd) {
            fprintf(stdout, "Failed to create file: %s", outputName.c_str());
            return 1;
        }
        auto ret = ftruncate(fd, 0);
        Unused(ret);
        close(fd);
    }
    std::string attachSql("ATTACH DATABASE '" + outputName + "' AS systuning_export");
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t *>(attachSql.c_str()), attachSql.length())) {
        attachSql = base::GbkToUtf8(attachSql.c_str());
    }
#endif
    ExecuteSql(attachSql);
    for (auto itor = internalTables_.begin(); itor != internalTables_.end(); itor++) {
        if (*itor == "meta" && !exportMetaTable_) {
            continue;
        } else {
            std::string exportSql("CREATE TABLE systuning_export." + (*itor) + "_ AS SELECT * FROM " + *itor);
            ExecuteSql(exportSql);
        }
    }
    std::string detachSql("DETACH DATABASE systuning_export");
    ExecuteSql(detachSql);
    return 0;
}
void TraceDataDB::CloseBatchDB()
{
    std::string detachSql("DETACH DATABASE systuning_export");
    ExecuteSql(detachSql);
}
int32_t TraceDataDB::BatchExportDatabase(const std::string &outputName)
{
    // for update mem db
    ExecuteSql(UPDATE_MEM_PROC_NAME);
    // for drop mem db to disk db
    std::string attachSql("ATTACH DATABASE '" + outputName + "' AS systuning_export");
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t *>(attachSql.c_str()), attachSql.length())) {
        attachSql = base::GbkToUtf8(attachSql.c_str());
    }
#endif
    ExecuteSql(attachSql);
    for (auto itor = internalTables_.begin(); itor != internalTables_.end(); itor++) {
        if (*itor == "meta" && !exportMetaTable_) {
            continue;
        } else {
            if (needClearTable_.count(*itor)) {
                std::string clearSql("DELETE FROM systuning_export." + (*itor) + "_");
                ExecuteSql(clearSql);
            }
            if (tableToCompletedSize_.count(*itor)) {
                std::string exportSql("INSERT INTO systuning_export." + (*itor) + "_ SELECT * FROM " + *itor +
                                      " LIMIT " + std::to_string(tableToCompletedSize_.at(*itor)));
                ExecuteSql(exportSql);
            } else {
                std::string exportSql("INSERT INTO systuning_export." + (*itor) + "_ SELECT * FROM " + *itor);
                ExecuteSql(exportSql);
            }
        }
    }
    ExecuteSql(CREATE_BATCH_EXPORT_DB_ARGS_VIEW);
    std::string detachSql("DETACH DATABASE systuning_export");
    ExecuteSql(detachSql);
    return 0;
}
void TraceDataDB::RevertTableName(const std::string &outputName)
{
    std::string attachSql("ATTACH DATABASE '" + outputName + "' AS systuning_export");
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t *>(attachSql.c_str()), attachSql.length())) {
        attachSql = base::GbkToUtf8(attachSql.c_str());
    }
#endif
    ExecuteSql(attachSql);
    for (auto itor = internalTables_.begin(); itor != internalTables_.end(); itor++) {
        if (*itor == "meta" && !exportMetaTable_) {
            continue;
        } else {
            std::string revertTableNameSql("ALTER TABLE systuning_export." + (*itor) + "_ RENAME TO  " + (*itor));
            ExecuteSql(revertTableNameSql);
        }
    }
    std::string detachSql("DETACH DATABASE systuning_export");
    ExecuteSql(detachSql);
}
int32_t TraceDataDB::ExportDatabase(const std::string &outputName, ResultCallBack resultCallBack)
{
    {
        int32_t fd(base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW));
        if (!fd) {
            fprintf(stdout, "Failed to create file: %s", outputName.c_str());
            return 1;
        }
        auto ret = ftruncate(fd, 0);
        Unused(ret);
        close(fd);
    }

    ExecuteSql(UPDATE_MEM_PROC_NAME);
    std::string attachSql("ATTACH DATABASE '" + outputName + "' AS systuning_export");
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t *>(attachSql.c_str()), attachSql.length())) {
        attachSql = base::GbkToUtf8(attachSql.c_str());
    }
#endif
    ExecuteSql(attachSql);
    for (auto itor = internalTables_.begin(); itor != internalTables_.end(); itor++) {
        if (*itor == "meta" && !exportMetaTable_) {
            continue;
        } else {
            std::string exportSql("CREATE TABLE systuning_export." + (*itor) + " AS SELECT * FROM " + *itor);
            ExecuteSql(exportSql);
        }
    }
    ExecuteSql(CREATE_EXPORT_DB_ARGS_VIEW);
    std::string detachSql("DETACH DATABASE systuning_export");
    ExecuteSql(detachSql);

    if (resultCallBack != nullptr) {
        wasmDBName_ = outputName;
        SendDatabase(resultCallBack);
    }
    return 0;
}

void TraceDataDB::Prepare()
{
    if (pared_) {
        return;
    }
    pared_ = true;
    ExecuteSql(
        "update thread set ipid = \
        (select id from process where \
        thread.tid = process.pid) where thread.ipid is null;");
    ExecuteSql(CREATE_MEM_ARGS_VIEW);
    ExecuteSql(UPDATE_MEM_PROC_NAME);
}
void TraceDataDB::ExecuteSql(const std::string_view &sql)
{
    sqlite3_stmt *stmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(db_, sql.data(), static_cast<int32_t>(sql.size()), &stmt, nullptr);

    while (!ret) {
        int32_t err = sqlite3_step(stmt);
        if (err == SQLITE_ROW) {
            continue;
        }
        if (err == SQLITE_DONE) {
            break;
        }
        ret = err;
    }

    sqlite3_finalize(stmt);
}
std::vector<std::string> TraceDataDB::SearchData()
{
    std::vector<std::string> values = {};
    Prepare();
    std::string line;
    bool printResult = false;
    for (;;) {
        std::cout << "> ";
        getline(std::cin, line);
        if (line.empty()) {
            std::cout << "If you want to quit either type -q or press CTRL-Z" << std::endl;
            continue;
        }
        values.clear();
        std::string option = "";
        ParseCommandLine(option, line, values);
        if (!line.compare("-q") || !line.compare("-quit")) {
            break;
        } else if (!line.compare("-e")) {
            TS_LOGI("the db file will be at current folder, the name is default.db");
            (void)ExportDatabase("default.db");
            return values;
        } else if (!line.compare("-help") || !line.compare("-h")) {
            std::cout << "use info" << std::endl;
            continue;
        } else if (!line.compare("-p")) {
            std::cout << "will print result of query" << std::endl;
            printResult = true;
            continue;
        } else if (!option.compare("-s")) {
            if (!values.empty()) {
                return values;
            }
            continue;
        } else if (!line.compare("-up")) {
            std::cout << "will not print result of query" << std::endl;
            printResult = false;
            continue;
        } else if (line.find("-c:") != std::string::npos) {
            line = line.substr(strlen("-c:"));
            if (OperateDatabase(line) == SQLITE_OK) {
                printf("operate SQL success\n");
            }
            continue;
        }
        PrintSearchResult(line, printResult);
    }
    return values;
}
void TraceDataDB::ParseCommandLine(std::string &option, std::string line, std::vector<std::string> &values)
{
    size_t pos = std::string::npos;
    if ((pos = line.find(" ")) != std::string::npos) {
        option = line.substr(0, pos);
        auto left = line.substr(pos + 1);
        while ((pos = left.find(",")) != std::string::npos) {
            values.push_back(left.substr(0, pos + 1));
            left = left.substr(pos + 1);
        }
        values.push_back(left);
    }
    printf("option:%s\n", option.c_str());
}
void TraceDataDB::PrintSearchResult(std::string line, bool printResult)
{
    using namespace std::chrono;
    const auto start = steady_clock::now();
    int32_t rowCount = SearchDatabase(line, printResult);
    std::chrono::nanoseconds searchDur = duration_cast<nanoseconds>(steady_clock::now() - start);
    printf("\"%s\"\n\tused %.3fms row: %d\n", line.c_str(), searchDur.count() / 1E6, rowCount);
}
int32_t TraceDataDB::SearchDatabase(std::string &sql, bool print)
{
    Prepare();
    int32_t rowCount = 0;
    sqlite3_stmt *stmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(db_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    printf("Executing sql: %s\n", sql.c_str());
    if (ret != SQLITE_OK) {
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(db_));
        return 0;
    }

    int32_t colCount = sqlite3_column_count(stmt);
    if (print) {
        for (int32_t i = 0; i < colCount; i++) {
            printf("%s\t", sqlite3_column_name(stmt, i));
        }
        printf("\n");
    }

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        rowCount++;
        for (int32_t i = 0; i < colCount; i++) {
            const char *p = reinterpret_cast<const char *>(sqlite3_column_text(stmt, i));
            int32_t type = sqlite3_column_type(stmt, i);
            if (!print) {
                continue;
            }
            if (p == nullptr) {
                printf("null\t");
                continue;
            }
            if (type == SQLITE_TEXT) {
                printf("\"%s\"\t", p);
            } else {
                printf("%s\t", p);
            }
        }
        if (print) {
            printf("\n");
        }
    }
    sqlite3_finalize(stmt);
    return rowCount;
}
int32_t TraceDataDB::OperateDatabase(const std::string &sql)
{
    Prepare();
    char *errmsg = nullptr;
    int32_t ret = sqlite3_exec(db_, sql.c_str(), NULL, NULL, &errmsg);
    if (ret != SQLITE_OK && errmsg) {
        TS_LOGE("sqlite3_exec(%s) failed: %d:%s", sql.c_str(), ret, errmsg);
        sqlite3_free(errmsg);
    }
    return ret;
}

int32_t TraceDataDB::SearchDatabaseToProto(const std::string &data,
                                           SqllitePreparCacheData::TLVResultCallBack resultCallBack)
{
    TS_CHECK_TRUE(data.size() > SqllitePreparCacheData::typeSize_ && resultCallBack != nullptr, 1,
                  "data.size(%zu) <= sizeof(uint32_t) or resultCallBack is nullptr", data.size());
    uint32_t type = INVALID_UINT32;
    auto sqlItor = data.begin() + SqllitePreparCacheData::typeSize_;
    std::copy(data.begin(), sqlItor, reinterpret_cast<uint8_t *>(&type));
    std::string sql(sqlItor, data.end());
    TS_LOGI("type(%u), sql(%s)", type, sql.data());
    Prepare();
    sqlite3_stmt *stmt = nullptr;
    std::unique_ptr<sqlite3_stmt, void (*)(sqlite3_stmt *)> stmtScope(stmt, SqliteFinalize);
    int32_t ret = sqlite3_prepare_v2(db_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    TS_CHECK_TRUE(ret == SQLITE_OK, ret, "sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(db_));
    auto queryFuncItor = sqlPreparCacheData_.sphQueryFuncMap_.find(type);
    if (queryFuncItor != sqlPreparCacheData_.sphQueryFuncMap_.end()) {
        queryFuncItor->second(stmt, type, resultCallBack);
    } else {
        TS_LOGE("Can't find sph query type:%u", type);
        return 1;
    }
    return ret;
}

std::string TraceDataDB::SearchDatabase(const std::string &sql)
{
    Prepare();
    sqlite3_stmt *stmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(db_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    if (ret != SQLITE_OK) {
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(db_));
        return "";
    }

    std::string res = "ok\r\n";
    int32_t colCount = sqlite3_column_count(stmt);
    if (colCount == 0) {
        return "";
    }
    res += "{\"columns\":[";
    for (int32_t i = 0; i < colCount; i++) {
        res += "\"";
        res += sqlite3_column_name(stmt, i);
        res += "\",";
    }
    res.pop_back();
    res += "],\"values\":[";
    bool hasRow = false;
    std::string row;
    row.reserve(DEFAULT_LEN_ROW_STRING);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasRow = true;
        GetRowString(stmt, colCount, row);
        res += row + ",";
    }
    if (hasRow) {
        res.pop_back();
    }
    res += "]}\r\n";

    sqlite3_finalize(stmt);
    return res;
}

int32_t TraceDataDB::SearchDatabase(const std::string &sql, ResultCallBack resultCallBack)
{
    Prepare();
    sqlite3_stmt *stmt = nullptr;
    int32_t ret = sqlite3_prepare_v2(db_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    if (ret != SQLITE_OK) {
        resultCallBack("false\r\n", SEND_FINISH);
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(db_));
        return ret;
    }
    if (!resultCallBack) {
        return ret;
    }

    std::string res = "ok\r\n";
    int32_t colCount = sqlite3_column_count(stmt);
    if (colCount == 0) {
        resultCallBack(res, SEND_FINISH);
        return ret;
    }
    res += "{\"columns\":[";
    for (int32_t i = 0; i < colCount; i++) {
        res += "\"";
        res += sqlite3_column_name(stmt, i);
        res += "\",";
    }
    res.pop_back(); // remove the last ","
    res += "],\"values\":[";
    bool hasRow = false;
    std::string row;
    row.reserve(DEFAULT_LEN_ROW_STRING);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasRow = true;
        GetRowString(stmt, colCount, row);
        res += row + ",";
        if (res.size() >= ONCE_MAX_MB) {
            resultCallBack(res, SEND_CONTINUE);
            res = "";
        }
    }
    if (hasRow) {
        res.pop_back(); // remove the last ','
    }
    res += "]}\r\n";
    resultCallBack(res, SEND_FINISH);

    sqlite3_finalize(stmt);
    return ret;
}
int32_t TraceDataDB::SearchDatabase(const std::string &sql, uint8_t *out, int32_t outLen)
{
    Prepare();
    sqlite3_stmt *stmt = nullptr;
    std::unique_ptr<sqlite3_stmt, void (*)(sqlite3_stmt *)> stmtLocal(stmt, SqliteFinalize);
    int32_t ret = sqlite3_prepare_v2(db_, sql.c_str(), static_cast<int32_t>(sql.size()), &stmt, nullptr);
    if (ret != SQLITE_OK) {
        TS_LOGE("sqlite3_prepare_v2(%s) failed: %d:%s", sql.c_str(), ret, sqlite3_errmsg(db_));
        return -1;
    }
    stmtLocal.reset(stmt);
    std::string snprintfInfo("ok");
    char *res = reinterpret_cast<char *>(out);
    int32_t retSnprintf = snprintf_s(res, outLen, snprintfInfo.size(), snprintfInfo.data());
    if (retSnprintf < 0) {
        return -1;
    }
    int32_t pos = retSnprintf;
    int32_t colCount = sqlite3_column_count(stmt);
    if (colCount == 0) {
        return pos;
    }
    auto returnvalue = HandleColumnNames(stmt, res, outLen, pos, colCount);
    if (returnvalue == -1) {
        return -1;
    }
    pos = returnvalue;
    return HandleRowData(stmt, res, outLen, pos, colCount);
}
int32_t TraceDataDB::HandleColumnNames(sqlite3_stmt *stmt, char *res, int32_t outLen, int32_t pos, int32_t colCount)
{
    std::string snprintfInfo = "{\"columns\":[";
    int32_t retSnprintf = snprintf_s(res + pos, outLen - pos, snprintfInfo.size(), "%s", snprintfInfo.c_str());
    if (retSnprintf < 0) {
        return -1;
    }
    pos += retSnprintf;
    for (int32_t i = 0; i < colCount; i++) {
        snprintfInfo = "\"" + std::string(sqlite3_column_name(stmt, i)) + "\",";
        retSnprintf = snprintf_s(res + pos, outLen - pos, snprintfInfo.size(), "%s", snprintfInfo.c_str());
        if (retSnprintf < 0) {
            return -1;
        }
        pos += retSnprintf;
    }
    pos--; // Remove the last ','
    snprintfInfo = "],\"values\":[";
    retSnprintf = snprintf_s(res + pos, outLen - pos, snprintfInfo.size(), snprintfInfo.data());
    if (retSnprintf < 0) {
        return -1;
    }
    pos += retSnprintf;
    return pos;
}
int32_t TraceDataDB::HandleRowData(sqlite3_stmt *stmt, char *res, int32_t outLen, int32_t pos, int32_t colCount)
{
    std::string snprintfInfo;
    int32_t retSnprintf;
    bool hasRow = false;
    std::string row;
    row.reserve(DEFAULT_LEN_ROW_STRING);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasRow = true;
        GetRowString(stmt, colCount, row);
        if (pos + row.size() + strlen(",]}\r\n") >= size_t(outLen)) {
            retSnprintf = snprintf_s(res + pos, outLen - pos, 1, "]}\r\n");
            if (retSnprintf < 0) {
                return -1;
            }
            pos += retSnprintf;
            sqlite3_finalize(stmt);
            return pos;
        }
        snprintfInfo = row + ",";
        retSnprintf = snprintf_s(res + pos, outLen - pos, snprintfInfo.size(), "%s", snprintfInfo.c_str());
        if (retSnprintf < 0) {
            return -1;
        }
        pos += retSnprintf;
    }
    if (hasRow) {
        pos--; // remove the last ','
    }
    snprintfInfo = "]}\r\n";
    retSnprintf = snprintf_s(res + pos, outLen - pos, snprintfInfo.size(), snprintfInfo.c_str());
    if (retSnprintf < 0) {
        return -1;
    }
    pos += retSnprintf;
    return pos;
}
void TraceDataDB::SetCancel(bool cancel)
{
    cancelQuery_ = cancel;
}
void TraceDataDB::GetRowString(sqlite3_stmt *stmt, int32_t colCount, std::string &rowStr)
{
    rowStr.clear();
    rowStr = "[";
    for (int32_t i = 0; i < colCount; i++) {
        const char *p = reinterpret_cast<const char *>(sqlite3_column_text(stmt, i));
        if (p == nullptr) {
            rowStr += "null,";
            continue;
        }
        int32_t type = sqlite3_column_type(stmt, i);
        switch (type) {
            case SQLITE_TEXT:
                rowStr += FormatString(p);
                break;
            default:
                rowStr += p;
                break;
        }
        rowStr += ",";
    }
    rowStr.pop_back(); // remove the last ','
    rowStr += "]";
}
void TraceDataDB::SqliteFinalize(sqlite3_stmt *ptr)
{
    if (ptr != nullptr) {
        sqlite3_finalize(ptr);
        ptr = nullptr;
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
