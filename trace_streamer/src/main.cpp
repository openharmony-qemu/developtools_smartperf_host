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
#include <chrono>
#include <cinttypes>
#include <dirent.h>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <memory>
#include <regex>
#include <stdio.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include "codec_cov.h"
#include "file.h"
#include "filter/slice_filter.h"
#include "http_server.h"
#include "log.h"
#include "metrics.h"
#include "parser/bytrace_parser/bytrace_event_parser.h"
#include "parser/bytrace_parser/bytrace_parser.h"
#include "parting_string.h"
#include "rpc_server.h"
#include "string_help.h"

#include "thread_state_flag.h"
#include "trace_streamer/trace_streamer_selector.h"
#include "trace_streamer_filters.h"
#include "version.h"
using namespace SysTuning::TraceStreamer;
using namespace SysTuning;
namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::TraceStreamer;
using namespace SysTuning::base;
constexpr int G_MIN_PARAM_NUM = 2;
constexpr size_t G_FILE_PERMISSION = 664;
constexpr uint8_t RAW_TRACE_PARSE_MAX = 2;
// set version info in meta.cpp please
void ExportStatusToLog(const std::string& dbPath, TraceParserStatus status)
{
    std::string path = dbPath + ".ohos.ts";
    std::ofstream out(path, std::ios_base::trunc);
    out << (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
               .count()
        << ":" << status << std::endl;
    using std::chrono::system_clock;

    system_clock::time_point today = system_clock::now();

    std::time_t tt = system_clock::to_time_t(today);
    out << "last running  time  is: " << ctime(&tt);
    out << "last running status is: " << status;
    out.close();
}
void ShowHelpInfo(const char* argv)
{
    printf(
        "trace analyze tool, it can transfer a bytrace/htrace file into a "
        "SQLite database and save result to a local file trace_streamer.log.\n"
        "Usage: %s FILE -e sqlite_out.db\n"
        " or    %s FILE -c\n"
        "Options:\n"
        " -e    transfer a trace file into a SQLiteBased DB. with -nm to except meta table\n"
        " -c    command line mode.\n"
        " -D    Specify the directory path with multiple long trace files"
        " -d    dump perf/hook/ebpf readable text.Default dump file path is src path name + `_ReadableText.txt`\n"
        " -h    start HTTP server.\n"
        " -l <level>, --level=<level>\n"
        "       Show specific level/levels logs with format: level1,level2,level3\n"
        "       Long level string coule be: DEBUG/INFO/WARN/ERROR/FATAL/OFF.\n"
        "       Short level string coule be: D/I/W/E/F/O.\n"
        "       Default level is OFF.\n"
        " -o    set dump file path.\n"
        " -s    separate arkts-plugin data, and save it in current dir with default filename.\n"
        " -p    Specify the port of HTTP server, default is 9001.\n"
        " -q    select sql from file.\n"
        " -m    Perform operations that query metrics through linux,supports querying multiple metrics items.For "
        "example:-m x,y,z.\n"
        " -i    show information.\n"
        " -v    show version.\n",
        argv, argv);
}
void PrintInformation()
{
    TraceStreamerConfig cfg;
    cfg.PrintInfo();
}
void PrintVersion()
{
    fprintf(stderr, "version %s\n", g_traceStreamerVersion.c_str());
}

bool ReadAndParser(SysTuning::TraceStreamer::TraceStreamerSelector& ta, int fd)
{
    auto startTime =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    auto isFinish = false;
    g_loadSize = 0;
    auto curParseCnt = 1;
    while (true) {
        // for rawtrace next parse.the first parse is for last comm data;
        if (isFinish && ta.GetFileType() == TRACE_FILETYPE_RAW_TRACE && curParseCnt < RAW_TRACE_PARSE_MAX) {
            ++curParseCnt;
            isFinish = false;
            g_loadSize = 0;
            TS_CHECK_TRUE(lseek(fd, 0, SEEK_SET) != -1, false, "lseek error:%s", strerror(errno));
        }
        std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(G_CHUNK_SIZE);
        auto rsize = Read(fd, buf.get(), G_CHUNK_SIZE);
        if (rsize == 0) {
            break;
        }

        if (rsize < 0) {
            TS_LOGE("Reading trace file failed (errno: %d, %s)", errno, strerror(errno));
            return false;
        }
        g_loadSize += rsize;
        if (g_loadSize == g_fileSize) {
            isFinish = true;
        }
        if (!ta.ParseTraceDataSegment(std::move(buf), static_cast<size_t>(rsize), false, isFinish)) {
            return false;
        };
        printf("\rLoadingFile:\t%.2f MB\r", static_cast<double>(g_loadSize) / 1E6);
    }
    ta.WaitForParserEnd();
    auto endTime =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    (void)fprintf(stdout, "\nParserDuration:\t%u ms\n", static_cast<unsigned int>(endTime - startTime));
    (void)fprintf(stdout, "ParserSpeed:\t%.2f MB/s\n", (g_loadSize / (endTime - startTime) / 1E3));
    return true;
}
bool SetFileSize(const std::string& traceFilePath)
{
    if (traceFilePath.empty()) {
        g_fileSize = 0;
        return false;
    }
    struct stat statBuff;
    stat(traceFilePath.c_str(), &statBuff);
    g_fileSize = statBuff.st_size;
    return true;
}
int OpenAndParserFile(TraceStreamerSelector& ts, const std::string& traceFilePath)
{
    if (!SetFileSize(traceFilePath)) {
        return 0;
    }
    int fd(OpenFile(traceFilePath, O_RDONLY, G_FILE_PERMISSION));
    if (fd < 0) {
        TS_LOGE("%s does not exist", traceFilePath.c_str());
        SetAnalysisResult(TRACE_PARSER_ABNORMAL);
        return 1;
    }
    if (!ReadAndParser(ts, fd)) {
        close(fd);
        SetAnalysisResult(TRACE_PARSER_ABNORMAL);
        return 1;
    }
    MetaData* metaData = ts.GetMetaData();

    std::string fileNameTmp = traceFilePath;
#ifdef _WIN32
    if (!base::GetCoding(reinterpret_cast<const uint8_t*>(fileNameTmp.c_str()), fileNameTmp.length())) {
        fileNameTmp = base::GbkToUtf8(fileNameTmp.c_str());
    }
#endif
    metaData->SetSourceFileName(fileNameTmp);
    metaData->SetTraceType((ts.DataType() == TRACE_FILETYPE_H_TRACE) ? "proto-based-trace" : "txt-based-trace");

    close(fd);
    return 0;
}
int ExportDatabase(TraceStreamerSelector& ts, const std::string& sqliteFilePath)
{
    auto startTime =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    if (!sqliteFilePath.empty()) {
        MetaData* metaData = ts.GetMetaData();
        std::string fileNameTmp = sqliteFilePath;
#ifdef _WIN32
        if (!base::GetCoding(reinterpret_cast<const uint8_t*>(fileNameTmp.c_str()), fileNameTmp.length())) {
            fileNameTmp = base::GbkToUtf8(fileNameTmp.c_str());
        }
#endif
        metaData->SetOutputFileName(fileNameTmp);
        metaData->SetParserToolVersion(g_traceStreamerVersion);
        metaData->SetParserToolPublishDateTime(g_traceStreamerPublishVersion);
        metaData->SetTraceDataSize(g_loadSize);
        if (ts.ExportDatabase(sqliteFilePath)) {
            fprintf(stdout, "ExportDatabase failed\n");
            ExportStatusToLog(sqliteFilePath, TRACE_PARSER_ABNORMAL);
            return 1;
        }
    }
    auto endTime =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    endTime += 1; // for any exception of endTime == startTime
    fprintf(stdout, "ExportDuration:\t%u ms\n", static_cast<unsigned int>(endTime - startTime));
    fprintf(stdout, "ExportSpeed:\t%.2f MB/s\n", (g_loadSize / (endTime - startTime)) / 1E3);
    return 0;
}
bool LongTraceExportDatabase(TraceStreamerSelector& ts, const std::string& sqliteFilePath)
{
    if (!sqliteFilePath.empty()) {
        std::string fileNameTmp = sqliteFilePath;
#ifdef _WIN32
        if (!base::GetCoding(reinterpret_cast<const uint8_t*>(fileNameTmp.c_str()), fileNameTmp.length())) {
            fileNameTmp = base::GbkToUtf8(fileNameTmp.c_str());
        }
#endif
        if (ts.BatchExportDatabase(sqliteFilePath)) {
            fprintf(stdout, "ExportDatabase failed\n");
            ExportStatusToLog(sqliteFilePath, TRACE_PARSER_ABNORMAL);
            return false;
        }
    }
    return true;
}
enum DumpFileType { UNKONW_TYPE = 0, PERF_TYPE, NATIVE_HOOK_TYPE, EBPF_TYPE };
struct TraceExportOption {
    std::string longTraceDir;
    std::string traceFilePath;
    std::string sqliteFilePath;
    DumpFileType dumpFileType = DumpFileType::UNKONW_TYPE;
    std::string outputFilePath;
    std::string metricsIndex;
    std::string sqlOperatorFilePath;
    bool interactiveState = false;
    bool exportMetaTable = true;
    bool separateFile = false;
};
struct HttpOption {
    bool enable = false;
    int port = 9001;
};
bool SetDumpFileType(char** argv, const std::string& dumpFileType, TraceExportOption& traceExportOption)
{
    if (dumpFileType == "perf") {
        traceExportOption.dumpFileType = DumpFileType::PERF_TYPE;
    } else if (dumpFileType == "hook") {
        traceExportOption.dumpFileType = DumpFileType::NATIVE_HOOK_TYPE;
    } else if (dumpFileType == "ebpf") {
        traceExportOption.dumpFileType = DumpFileType::EBPF_TYPE;
    } else {
        ShowHelpInfo(argv[0]);
        return false;
    }
    return true;
}
int CheckFinal(char** argv, TraceExportOption& traceExportOption, HttpOption& httpOption)
{
    if (((traceExportOption.traceFilePath.empty() && traceExportOption.longTraceDir.empty()) ||
         (!traceExportOption.interactiveState && traceExportOption.sqliteFilePath.empty())) &&
        !httpOption.enable && !traceExportOption.separateFile && traceExportOption.metricsIndex.empty() &&
        traceExportOption.sqlOperatorFilePath.empty() && traceExportOption.outputFilePath.empty() &&
        traceExportOption.dumpFileType == DumpFileType::UNKONW_TYPE) {
        ShowHelpInfo(argv[0]);
        return 1;
    }
    return 0;
}

bool CheckArgc(int argc, char** argv, int curArgNum)
{
    if (curArgNum == argc) {
        ShowHelpInfo(argv[0]);
        return false;
    }
    return true;
}

int CheckArgs(int argc, char** argv, TraceExportOption& traceExportOption, HttpOption& httpOption)
{
    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "-e")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            traceExportOption.sqliteFilePath = std::string(argv[i]);
            continue;
        } else if (!strcmp(argv[i], "-c") || !strcmp(argv[i], "--command")) {
            traceExportOption.interactiveState = true;
            continue;
        } else if (!strcmp(argv[i], "-D") || !strcmp(argv[i], "--directory")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            traceExportOption.longTraceDir = std::string(argv[i]);
            continue;
        } else if (!strcmp(argv[i], "-d") || !strcmp(argv[i], "--dump")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            TS_CHECK_TRUE_RET(SetDumpFileType(argv, std::string(argv[i]), traceExportOption), 1);
            continue;
        } else if (!strcmp(argv[i], "-q") || !strcmp(argv[i], "--query-file")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            traceExportOption.sqlOperatorFilePath = std::string(argv[i]);
            continue;
        } else if (!strcmp(argv[i], "-o") || !strcmp(argv[i], "--out")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            traceExportOption.outputFilePath = std::string(argv[i]);
            continue;
        } else if (!strcmp(argv[i], "-i") || !strcmp(argv[i], "--info")) {
            PrintInformation();
        } else if (!strcmp(argv[i], "-l") || !strcmp(argv[i], "--level")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            if (!SetLogLevel(std::string(argv[i]))) {
                ShowHelpInfo(argv[0]);
                return 1;
            }
            continue;
        } else if (!strcmp(argv[i], "-s") || !strcmp(argv[i], "--s")) {
            traceExportOption.separateFile = true;
            continue;
        } else if (!strcmp(argv[i], "-nm") || !strcmp(argv[i], "--nometa")) {
            traceExportOption.exportMetaTable = false;
            continue;
        } else if (!strcmp(argv[i], "-m") || !strcmp(argv[i], "--run-metrics")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            traceExportOption.metricsIndex = std::string(argv[i]);
            continue;
        } else if (!strcmp(argv[i], "-v") || !strcmp(argv[i], "--v") || !strcmp(argv[i], "-version") ||
                   !strcmp(argv[i], "--version")) {
            PrintVersion();
            return 1;
        } else if (!strcmp(argv[i], "-h")) {
            httpOption.enable = true;
            continue;
        } else if (!strcmp(argv[i], "-p")) {
            TS_CHECK_TRUE_RET(CheckArgc(argc, argv, ++i), 1);
            httpOption.port = std::stoi(argv[i]);
            continue;
        }
        traceExportOption.traceFilePath = std::string(argv[i]);
        auto strVec = SplitStringToVec(traceExportOption.traceFilePath, ".");
        traceExportOption.outputFilePath = strVec.front() + "_ReadableText.txt";
    }
    return CheckFinal(argv, traceExportOption, httpOption);
}
bool GetLongTraceFilePaths(const TraceExportOption& traceExportOption, std::map<int, std::string>& seqToFilePathMap)
{
    std::regex traceInvalidStr("\\\\");
    auto strEscape = std::regex_replace(traceExportOption.longTraceDir, traceInvalidStr, "\\\\\\\\");
    DIR* dir = opendir(strEscape.c_str());
    if (dir == nullptr) {
        TS_LOGE("long trace dir is not exist or not dir");
        return false;
    }
    struct dirent* entry;
    while ((entry = readdir(dir)) != nullptr) {
        std::regex pattern("^hiprofiler_data_(\\d{8})_(\\d{6})_(\\d+)\\.htrace$");
        std::smatch matches;
        std::string name = entry->d_name;
        if (std::regex_match(name, matches, pattern)) {
            std::string seqStr = matches[3].str();
            int seq = std::stoi(seqStr);
            std::string path = std::string(strEscape) + "/" + name;
            seqToFilePathMap.insert({seq, path});
        }
    }
    closedir(dir);
    if (!seqToFilePathMap.size()) {
        TS_LOGE("%s has no matched file!", strEscape.c_str());
        return false;
    }
    auto seq = seqToFilePathMap.begin()->first;
    for (auto itor = seqToFilePathMap.begin(); itor != seqToFilePathMap.end(); itor++) {
        if (itor->first != seq++) {
            seqToFilePathMap.erase(itor, seqToFilePathMap.end());
            break;
        }
    }
    return true;
}

bool ReadAndParserLongTrace(SysTuning::TraceStreamer::TraceStreamerSelector& ta,
                            int fd,
                            const std::string& traceFilePath)
{
    printf("Start Parse %s ...\n", traceFilePath.c_str());
    g_loadSize = 0;
    while (true) {
        std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(G_CHUNK_SIZE);
        auto rsize = Read(fd, buf.get(), G_CHUNK_SIZE);
        if (rsize == 0) {
            break;
        }
        if (rsize < 0) {
            TS_LOGE("Reading trace file failed (errno: %d, %s)", errno, strerror(errno));
            return false;
        }
        g_loadSize += rsize;
        if (!ta.BatchParseTraceDataSegment(std::move(buf), static_cast<size_t>(rsize))) {
            return false;
        }
        printf("\rLoadingFile:\t%.2f MB\r", static_cast<double>(g_loadSize) / 1E6);
    }
    return true;
}
bool OpenAndParserLongTraceFile(TraceStreamerSelector& ts, const std::string& traceFilePath)
{
    if (!SetFileSize(traceFilePath)) {
        return false;
    }
    int fd(OpenFile(traceFilePath, O_RDONLY, G_FILE_PERMISSION));
    if (fd < 0) {
        TS_LOGE("%s does not exist", traceFilePath.c_str());
        SetAnalysisResult(TRACE_PARSER_ABNORMAL);
        return false;
    }
    if (!ReadAndParserLongTrace(ts, fd, traceFilePath)) {
        close(fd);
        SetAnalysisResult(TRACE_PARSER_ABNORMAL);
        return false;
    }
    close(fd);
    return true;
}
void ParseLongTrace(TraceStreamerSelector& ts, const TraceExportOption& traceExportOption)
{
    std::map<int, std::string> seqToFilePathMap;
    if (traceExportOption.sqliteFilePath.empty()) {
        return;
    }
    if (!GetLongTraceFilePaths(traceExportOption, seqToFilePathMap)) {
        return;
    }
    ts.CreatEmptyBatchDB(traceExportOption.sqliteFilePath);
    for (auto itor = seqToFilePathMap.begin(); itor != seqToFilePathMap.end(); itor++) {
        ts.GetTraceDataCache()->UpdateAllPrevSize();
        if (!OpenAndParserLongTraceFile(ts, itor->second)) {
            break;
        }
        if (std::distance(itor, seqToFilePathMap.end()) == 1) {
            ts.WaitForParserEnd();
        }
        ts.GetTraceDataCache()->ClearAllPrevCacheData();
        ts.GetStreamFilter()->FilterClear();
        if (!LongTraceExportDatabase(ts, traceExportOption.sqliteFilePath)) {
            return;
        }
        if (std::distance(itor, seqToFilePathMap.end()) == 1) {
            ts.RevertTableName(traceExportOption.sqliteFilePath);
        }
    }
    if (!traceExportOption.sqliteFilePath.empty()) {
        ExportStatusToLog(traceExportOption.sqliteFilePath, GetAnalysisResult());
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
int main(int argc, char** argv)
{
    if (argc < G_MIN_PARAM_NUM) {
        ShowHelpInfo(argv[0]);
        return 1;
    }
    TraceExportOption tsOption;
    HttpOption httpOption;
    int ret = CheckArgs(argc, argv, tsOption, httpOption);
    if (ret) {
        if (!tsOption.sqliteFilePath.empty()) {
            ExportStatusToLog(tsOption.sqliteFilePath, GetAnalysisResult());
        }
        return 0;
    }
    if (httpOption.enable) {
        RpcServer rpcServer;
        HttpServer httpServer;
        httpServer.RegisterRpcFunction(&rpcServer);
        httpServer.Run(httpOption.port);
        return 0;
    }
    TraceStreamerSelector ts;
    ts.EnableMetaTable(tsOption.exportMetaTable);
    ts.EnableFileSave(tsOption.separateFile);
#ifndef IS_WASM
    if (!tsOption.longTraceDir.empty()) {
        ParseLongTrace(ts, tsOption);
        return 0;
    }
#endif
    std::regex traceInvalidStr("\\\\");
    auto strEscape = std::regex_replace(tsOption.traceFilePath, traceInvalidStr, "\\\\\\\\");
    if (OpenAndParserFile(ts, strEscape)) {
        if (!tsOption.sqliteFilePath.empty()) {
            ExportStatusToLog(tsOption.sqliteFilePath, GetAnalysisResult());
        }
        return 1;
    }
    if (tsOption.dumpFileType == DumpFileType::PERF_TYPE) {
        ts.ExportPerfReadableText(tsOption.outputFilePath);
    } else if (tsOption.dumpFileType == DumpFileType::NATIVE_HOOK_TYPE) {
        ts.ExportHookReadableText(tsOption.outputFilePath);
    } else if (tsOption.dumpFileType == DumpFileType::EBPF_TYPE) {
        ts.ExportEbpfReadableText(tsOption.outputFilePath);
    }
    if (tsOption.interactiveState) {
        MetaData* metaData = ts.GetMetaData();
        metaData->SetOutputFileName("command line mode");
        metaData->SetParserToolVersion(g_traceStreamerVersion.c_str());
        metaData->SetParserToolPublishDateTime(g_traceStreamerPublishVersion.c_str());
        metaData->SetTraceDataSize(g_loadSize);
        while (true) {
            auto values = ts.SearchData();
            std::string symbolsPath = "default";
            if (!values.empty()) {
                ts.ReloadSymbolFiles(symbolsPath, values);
            } else {
                return 0;
            }
        }
    }
    if (!tsOption.sqliteFilePath.empty()) {
        if (ExportDatabase(ts, tsOption.sqliteFilePath)) {
            ExportStatusToLog(tsOption.sqliteFilePath, GetAnalysisResult());
            return 1;
        }
        if (!tsOption.sqliteFilePath.empty()) {
            ExportStatusToLog(tsOption.sqliteFilePath, GetAnalysisResult());
        }
    }
    if (!tsOption.metricsIndex.empty()) {
        MetaData* metaData = ts.GetMetaData();
        metaData->SetOutputFileName("command line mode");
        metaData->SetParserToolVersion(g_traceStreamerVersion.c_str());
        metaData->SetParserToolPublishDateTime(g_traceStreamerPublishVersion.c_str());
        metaData->SetTraceDataSize(g_loadSize);
        ts.ParserAndPrintMetrics(tsOption.metricsIndex);
    }
    if (!tsOption.sqlOperatorFilePath.empty()) {
        ts.ReadSqlFileAndPrintResult(tsOption.sqlOperatorFilePath);
    }
    return 0;
}
