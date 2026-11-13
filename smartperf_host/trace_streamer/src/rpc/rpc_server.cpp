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

#include "rpc_server.h"

#include <cstdint>
#include <cstring>
#include <functional>
#if IS_WASM
#include <filesystem>
#include "file.h"
#endif
#include "common_types.h"
#include "hilog_parser/ptreader_hilog_parser.h"
#include "ptreader_parser.h"
#include "pbreader_parser.h"
#include "json.hpp"
#ifdef ENABLE_RAWTRACE
#include "rawtrace_parser.h"
#endif
#include "string_help.h"
#include "trace_streamer_selector.h"
#include "ts_common.h"
#include "version.h"

namespace SysTuning {
namespace TraceStreamer {
uint32_t g_fileLen = 0;
FILE *g_importFileFd = nullptr;
const size_t PACKET_HEADER_LENGTH = 1024;
const std::string VALUE_STR = "{\"value\":[";
const std::string OFFSET = "{\"offset\":";
const std::string SIZE = ",\"size\":";
const std::string TYPE = ",\"type\":";
const std::string EMPTY_VALUE = "{\"value\":[]}";

using json = nlohmann::json;
namespace jsonns {
struct ParserConfig {
    int32_t taskConfigValue;
    int32_t appConfigValue;
    int32_t aniConfigValue;
    int32_t binderConfigValue;
    int32_t ffrtConvertConfigValue;
    int32_t HMKernelConfigValue;
    int32_t rawTraceCutStartTsValue;
};
void from_json(const json &j, ParserConfig &v)
{
    j.at("TaskPool").get_to(v.taskConfigValue);
    j.at("AppStartup").get_to(v.appConfigValue);
    j.at("AnimationAnalysis").get_to(v.aniConfigValue);
    j.at("BinderRunnable").get_to(v.binderConfigValue);
    j.at("FfrtConvert").get_to(v.ffrtConvertConfigValue);
    j.at("HMKernel").get_to(v.HMKernelConfigValue);
    if (j.contains("RawTraceCutStartTs")) {
        v.rawTraceCutStartTsValue = j.at("RawTraceCutStartTs");
    }
}
} // namespace jsonns
#if IS_WASM
bool RpcServer::SaveAndParseFfrtData(const uint8_t *data, size_t len, ResultCallBack resultCallBack, bool isFinish)
{
    auto ffrtFileName = "ffrtFile.txt";
    static std::ofstream ffrtFile(ffrtFileName, std::ios::binary | std::ios::app);
    if (!ffrtFile.is_open()) {
        TS_LOGE("ffrtFile open filed!");
        return false;
    }
    ffrtFile.write(reinterpret_cast<const char *>(data), len);
    if (ffrtFile.fail() || ffrtFile.bad()) {
        TS_LOGE("Failed to write data!");
        ffrtFile.close();
        return false;
    }
    if (!isFinish) {
        return true;
    }
    ffrtFile.close();
    auto outTraceName = "outTrace.txt";
    std::ofstream outFile(outTraceName);
    if (!outFile.is_open()) {
        ffrtFile.close();
        std::filesystem::remove_all(ffrtFileName);
        TS_LOGE("prepare outFile failed.");
        return false;
    }
    FfrtConverter ffrtConverter;
    auto ret = ffrtConverter.RecoverTraceAndGenerateNewFile(ffrtFileName, outFile);
    outFile.close();
    std::filesystem::remove_all(ffrtFileName);
    if (!ret) {
        std::filesystem::remove_all(outTraceName);
        return false;
    }
    outFile.close();
    if (!ReadAndParseData(outTraceName) || !SendConvertedFfrtFile(outTraceName, resultCallBack)) {
        std::filesystem::remove_all(outTraceName);
        return false;
    }
    std::filesystem::remove_all(outTraceName);
    return true;
}
bool RpcServer::SaveAndParseZipTraceData(const uint8_t *data, size_t len, ResultCallBack resultCallBack, bool isFinish)
{
    auto zipFileName = "zipFile.zip";
    static std::ofstream zipFile(zipFileName, std::ios::binary | std::ios::app);
    if (!zipFile.is_open()) {
        TS_LOGE("zipFile open filed!");
        return false;
    }
    zipFile.write(reinterpret_cast<const char *>(data), len);
    if (zipFile.fail() || zipFile.bad()) {
        TS_LOGE("Failed to write data!");
        zipFile.close();
        return false;
    }
    if (!isFinish) {
        return true;
    }
    zipFile.close();
    std::string outTraceName;
    UnZipFile(zipFileName, outTraceName);
    if (!ReadAndParseData(outTraceName)) {
        std::filesystem::remove_all(outTraceName);
        return false;
    }
    std::filesystem::remove_all(outTraceName);
    return true;
}
bool RpcServer::DetermineZlibTrace(const uint8_t *data, size_t len)
{
    if (len < ZLIB_MAGIC_NUM_LEN) {
        return false;
    }
    return data[0] == ZLIB_CMF && data[1] == ZLIB_FLG;
}
bool RpcServer::SaveAndParseZlibTraceData(const uint8_t *data, size_t len, ResultCallBack resultCallBack, bool isFinish)
{
    auto zlibFileName = "zlibFile.zlib";
    static std::ofstream zlibFile(zlibFileName, std::ios::binary | std::ios::app);
    if (!zlibFile.is_open()) {
        TS_LOGE("zlibFile open filed!");
        return false;
    }
    zlibFile.write(reinterpret_cast<const char *>(data), len);
    if (zlibFile.fail() || zlibFile.bad()) {
        TS_LOGE("Failed to write data!");
        zlibFile.close();
        return false;
    }
    if (!isFinish) {
        return true;
    }
    zlibFile.close();
    std::string outTraceName;
    UnZlibFile(zlibFileName, outTraceName);
    if (!ReadAndParseData(outTraceName)) {
        std::filesystem::remove_all(outTraceName);
        return false;
    }
    std::filesystem::remove_all(outTraceName);
    return true;
}
bool RpcServer::SendConvertedFfrtFile(const std::string &fileName, ResultCallBack resultCallBack)
{
    if (!resultCallBack) {
        TS_LOGE("resultCallBack is nullptr!");
        return false;
    }
    std::ifstream inputFile(fileName);
    if (!inputFile.is_open()) {
        TS_LOGE("open file : %s failed!", fileName.c_str());
        return false;
    }
    char outData[G_CHUNK_SIZE];
    while (true) {
        inputFile.read(outData, G_CHUNK_SIZE);
        auto readSize = inputFile.gcount();
        resultCallBack(std::string(outData, readSize), SEND_CONTINUE);
        if (inputFile.eof()) {
            break;
        }
    }
    resultCallBack("ok\r\n", SEND_FINISH);
    return true;
}
bool RpcServer::ReadAndParseData(const std::string &filePath)
{
    std::ifstream inputFile(filePath);
    if (!inputFile.is_open()) {
        TS_LOGE("can not open %s.", filePath.c_str());
        return false;
    }
    uint8_t curParseCnt = 1;
    while (true) {
        std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(G_CHUNK_SIZE);
        inputFile.read(reinterpret_cast<char *>(buf.get()), G_CHUNK_SIZE);
        auto readSize = inputFile.gcount();
        if (!ts_->ParseTraceDataSegment(std::move(buf), readSize, false, inputFile.eof(), true)) {
            return false;
        }
        // for rawtrace next parse.the first parse is for last comm data;
        if (inputFile.eof() && ts_->GetFileType() == TRACE_FILETYPE_RAW_TRACE && curParseCnt < RAW_TRACE_PARSE_MAX) {
            ++curParseCnt;
            inputFile.clear();
            inputFile.seekg(0, std::ios::beg);
        } else if (inputFile.eof()) {
            break;
        }
    }
    inputFile.close();
    return true;
}
#endif
bool RpcServer::ParseData(const uint8_t *data, size_t len, ResultCallBack resultCallBack, bool isFinish)
{
    g_loadSize += len;
    do {
        size_t parseSize = std::min(len, G_CHUNK_SIZE);
        std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(parseSize);
        std::copy(data, data + parseSize, buf.get());
        if (!ts_->ParseTraceDataSegment(std::move(buf), parseSize, false, isFinish && (len <= G_CHUNK_SIZE))) {
            if (resultCallBack) {
                resultCallBack("formaterror\r\n", SEND_FINISH);
            }
            return false;
        }
        data += parseSize;
        len -= parseSize;
        lenParseData_ += parseSize;
    } while (len > 0);
    if (resultCallBack) {
        resultCallBack("ok\r\n", SEND_FINISH);
    }
    return true;
}
bool RpcServer::ParseDataWithoutCallback(const uint8_t *data, size_t len, int32_t isFinish, bool isSplitFile)
{
    g_loadSize += len;
    do {
        size_t parseSize = std::min(len, G_CHUNK_SIZE);
        std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(parseSize);
        std::copy(data, data + parseSize, buf.get());
        if (!ts_->ParseTraceDataSegment(std::move(buf), parseSize, isSplitFile, isFinish && (len == parseSize))) {
            return false;
        }
        data += parseSize;
        len -= parseSize;
        lenParseData_ += parseSize;
    } while (len > 0);
    return true;
}

bool RpcServer::GetLongTraceTimeSnap(std::string dataString)
{
    int count = dataString.size() / PACKET_HEADER_LENGTH;
    for (int i = 0; i < count; i++) {
        if (!GetTimeSnap(dataString)) {
            TS_LOGE("GetLongTraceTimeSnap error");
            return false;
        }
        dataString = dataString.substr(PACKET_HEADER_LENGTH);
    }
    return true;
}
bool RpcServer::GetTimeSnap(std::string dataString)
{
    if (dataString.size() < PACKET_HEADER_LENGTH) {
        TS_LOGE("buffer size less than profiler trace file header");
        return false;
    }
    uint8_t buffer[PACKET_HEADER_LENGTH];
    (void)memset_s(buffer, sizeof(buffer), 0, sizeof(buffer));
    int32_t i = 0;
    for (auto it = dataString.begin(); it != dataString.begin() + PACKET_HEADER_LENGTH; ++it, ++i) {
        buffer[i] = *it;
    }
    ProfilerTraceFileHeader *pHeader = reinterpret_cast<ProfilerTraceFileHeader *>(buffer);
    if (pHeader->data.length <= PACKET_HEADER_LENGTH || pHeader->data.magic != ProfilerTraceFileHeader::HEADER_MAGIC) {
        TS_LOGE("Profiler Trace data is truncated or invalid magic! len = %" PRIu64 ", maigc = %" PRIx64 "",
                pHeader->data.length, pHeader->data.magic);
        return false;
    }
    std::unique_ptr<TraceTimeSnap> longTraceTimeSnap = std::make_unique<TraceTimeSnap>();
    longTraceTimeSnap->startTime = pHeader->data.boottime;
    longTraceTimeSnap->endTime = pHeader->data.boottime + pHeader->data.durationNs;
    vTraceTimeSnap_.emplace_back(std::move(longTraceTimeSnap));
    return true;
}
bool RpcServer::LongTraceSplitFile(const uint8_t *data,
                                   size_t len,
                                   int32_t isFinish,
                                   uint32_t pageNum,
                                   SplitFileCallBack splitFileCallBack)
{
    if (vTraceTimeSnap_.size() <= pageNum) {
        return false;
    }
    ts_->minTs_ = vTraceTimeSnap_[pageNum]->startTime;
    ts_->maxTs_ = vTraceTimeSnap_[pageNum]->endTime;
    ParseSplitFileData(data, len, isFinish, splitFileCallBack, true);
    return true;
}

bool RpcServer::DetermineSystrace(const uint8_t *data, size_t len)
{
    std::string startStr(reinterpret_cast<const char *>(data), std::min<size_t>(len, 20));
    if (startStr.find("# tracer") != std::string::npos) {
        return true;
    }
    if (startStr.find("# TRACE") != std::string::npos) {
        return true;
    }
    const std::regex systraceMatcher = std::regex(R"(-(\d+)\s+\(?\s*(\d+|-+)?\)?\s?\[(\d+)\]\s*)"
                                                  R"([a-zA-Z0-9.]{0,5}\s+(\d+\.\d+):\s+(\S+):)");
    std::smatch matcheLine;
    std::string bytraceMode(reinterpret_cast<const char *>(data), len);
    if (std::regex_search(bytraceMode, matcheLine, systraceMatcher)) {
        return true;
    }
    return false;
}

bool RpcServer::DetermineZipTrace(const uint8_t *data, size_t len)
{
    if (len < 2) {
        return false;
    }
    return data[0] == 'P' && data[1] == 'K';
}

bool RpcServer::SendBytraceSplitFileData(SplitFileCallBack splitFileCallBack, int32_t isFinish)
{
    int32_t firstPos = ts_->GetPtreaderParser()->MinSplitPos();
    int32_t lastPos = ts_->GetPtreaderParser()->MaxSplitPos();
    TS_CHECK_TRUE(firstPos != INVALID_INT32 && lastPos != INVALID_INT32 && lastPos >= firstPos, false,
                  "firstPos(%d) or lastPos(%d) is INVALID_INT32!", firstPos, lastPos);
    const auto &mTraceDataBytrace = ts_->GetPtreaderParser()->GetPtreaderSplitData();
    // for 10% data
    int32_t tenPercentDataNum = 0.1 * (lastPos - firstPos);
    firstPos -= tenPercentDataNum;
    lastPos += tenPercentDataNum;
    if (firstPos < 0) {
        firstPos = 0;
    }
    if (lastPos >= mTraceDataBytrace.size()) {
        lastPos = mTraceDataBytrace.size() - 1;
    }
    std::string result = VALUE_STR;
    for (size_t index = firstPos; index <= lastPos; index++) {
        result += OFFSET + std::to_string(mTraceDataBytrace[index].first);
        result += SIZE + std::to_string(mTraceDataBytrace[index].second);
        result += "},";
    }
    if (result != VALUE_STR && !ts_->GetPtreaderParser()->GetPtreaderSplitData().empty()) {
        result.pop_back();
        result += "]}\r\n";
        splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, isFinish);
    }
    TS_LOGI("MinSplitPos=%d, MaxSplitPos=%d, tenPercentDataNum=%d, firstPos=%d, lastPos=%d\nresult=%s",
            ts_->GetPtreaderParser()->MinSplitPos(), ts_->GetPtreaderParser()->MaxSplitPos(), tenPercentDataNum,
            firstPos, lastPos, result.data());
    return true;
}

#ifdef ENABLE_RAWTRACE
bool RpcServer::SendRawtraceSplitFileData(SplitFileCallBack splitFileCallBack, int32_t isFinish)
{
    const auto &mTraceRawCpuData = ts_->GetRawtraceData()->GetRawtraceCpuData();
    const auto &mTraceRawCommData = ts_->GetRawtraceData()->GetRawtraceCommData();
    std::string result = VALUE_STR;

    for (size_t commDataIndex = 0; commDataIndex < mTraceRawCommData.size(); commDataIndex++) {
        result += OFFSET + std::to_string(mTraceRawCommData.at(commDataIndex).splitDataOffset_);
        result += SIZE + std::to_string(mTraceRawCommData.at(commDataIndex).splitDataSize_);
        result += TYPE + std::to_string(mTraceRawCommData.at(commDataIndex).splitType_);
        result += "},";
    }

    for (size_t cpuDataIndex = 0; cpuDataIndex < mTraceRawCpuData.size(); cpuDataIndex++) {
        result += OFFSET + std::to_string(mTraceRawCpuData.at(cpuDataIndex).splitDataOffset_);
        result += SIZE + std::to_string(mTraceRawCpuData.at(cpuDataIndex).splitDataSize_);
        result += TYPE + std::to_string(mTraceRawCpuData.at(cpuDataIndex).splitType_);
        result += "},";
    }
    if (result != VALUE_STR && !ts_->GetRawtraceData()->GetRawtraceCommData().empty()) {
        result.pop_back();
        result += "]}\r\n";
        splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, isFinish);
    }
    TS_LOGI("mTraceRawCpuData.size()= %zu, mTraceRawCommData.size()=%zu\n result=%s\n", mTraceRawCpuData.size(),
            mTraceRawCommData.size(), result.data());
    return true;
}
#endif
bool RpcServer::ParseSplitFileData(const uint8_t *data,
                                   size_t len,
                                   int32_t isFinish,
                                   SplitFileCallBack splitFileCallBack,
                                   bool isSplitFile)
{
    if (!ParseDataWithoutCallback(data, len, isFinish, isSplitFile)) {
        TS_LOGE("ParserData failed!");
        return false;
    }
    if (!isSplitFile || !isFinish) {
        return false;
    }
    if ((ts_->GetFileType() == TRACE_FILETYPE_BY_TRACE || ts_->GetFileType() == TRACE_FILETYPE_HILOG ||
         ts_->GetFileType() == TRACE_FILETYPE_HI_SYSEVENT)) {
        SendBytraceSplitFileData(splitFileCallBack, 0);
        splitFileCallBack(EMPTY_VALUE, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 1);
        ts_->GetPtreaderParser()->ClearPtreaderSplitData();
        ts_->GetTraceDataCache()->isSplitFile_ = false;
        return true;
    }
#ifdef ENABLE_RAWTRACE
    if (ts_->GetFileType() == TRACE_FILETYPE_RAW_TRACE) {
        SendRawtraceSplitFileData(splitFileCallBack, 0);
        splitFileCallBack(EMPTY_VALUE, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 1);
        ts_->GetRawtraceData()->ClearRawTraceData();
        ts_->GetTraceDataCache()->isSplitFile_ = false;
        return true;
    }
#endif
    if (ts_->GetFileType() == TRACE_FILETYPE_H_TRACE) {
        ProcPbreaderSplitResult(splitFileCallBack);
    }
#ifdef ENABLE_HIPERF
    if (ts_->GetFileType() == TRACE_FILETYPE_PERF) {
        ProcPerfSplitResult(splitFileCallBack, true);
    }
#endif
    splitFileCallBack(EMPTY_VALUE, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 1);
    ts_->GetPbreaderParser()->ClearPbreaderSplitData();
#ifdef ENABLE_ARKTS
    ts_->GetPbreaderParser()->GetJsMemoryData()->ClearArkTsSplitFileData();
#endif
    ts_->GetTraceDataCache()->isSplitFile_ = false;
    return true;
}
void RpcServer::ProcPbreaderSplitResult(SplitFileCallBack splitFileCallBack)
{
    uint64_t dataSize = 0;
    std::string result = VALUE_STR;
#ifdef ENABLE_NATIVE_HOOK
    ts_->GetPbreaderParser()->ClearNativehookData();
#endif
    for (const auto &itemPbreader : ts_->GetPbreaderParser()->GetPbreaderSplitData()) {
        dataSize += itemPbreader.second;
        result += OFFSET + std::to_string(itemPbreader.first);
        result += SIZE + std::to_string(itemPbreader.second);
        result += "},";
    }
    auto dataSourceType = ts_->GetPbreaderParser()->GetDataSourceType();
    auto profilerHeader = ts_->GetPbreaderParser()->GetProfilerHeader();
#ifdef ENABLE_ARKTS
    if (dataSourceType == DATA_SOURCE_TYPE_JSMEMORY) {
        dataSize += ts_->GetPbreaderParser()->GetArkTsConfigData().size() +
                    ts_->GetPbreaderParser()->GetJsMemoryData()->GetArkTsSize();
    }
#endif
#ifdef ENABLE_NATIVE_HOOK
    for (auto &commProto : ts_->GetTraceDataCache()->HookCommProtos()) {
        dataSize += (sizeof(uint32_t) + commProto->size());
    }
#endif
    // Send Header
    profilerHeader.data.length = PACKET_HEADER_LENGTH + dataSize;
    std::string buffer(reinterpret_cast<char *>(&profilerHeader), sizeof(profilerHeader));
    splitFileCallBack(buffer, (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
    // Send Datas
#ifdef ENABLE_NATIVE_HOOK
    ProcHookCommSplitResult(splitFileCallBack);
#endif
    if (result != VALUE_STR && !ts_->GetPbreaderParser()->GetPbreaderSplitData().empty()) {
        result.pop_back();
        result += "]}\r\n";
        splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 0);
    }
#ifdef ENABLE_ARKTS
    if (dataSourceType == DATA_SOURCE_TYPE_JSMEMORY) {
        splitFileCallBack(ts_->GetPbreaderParser()->GetArkTsConfigData() +
                              ts_->GetPbreaderParser()->GetJsMemoryData()->GetArkTsSplitFileData(),
                          (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
    }
#endif
#ifdef ENABLE_HIPERF
    ProcPerfSplitResult(splitFileCallBack, true);
#endif
#ifdef ENABLE_EBPF
    ProcEbpfSplitResult(splitFileCallBack, true);
#endif
}
#ifdef ENABLE_NATIVE_HOOK
void RpcServer::ProcHookCommSplitResult(SplitFileCallBack splitFileCallBack)
{
    std::string lenBuffer(sizeof(uint32_t), 0);
    for (auto &commProto : ts_->GetTraceDataCache()->HookCommProtos()) {
        uint32_t len = commProto->size();
        memcpy_s(const_cast<char *>(lenBuffer.data()), sizeof(uint32_t), &len, sizeof(uint32_t));
        splitFileCallBack(lenBuffer, (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
        splitFileCallBack(*commProto, (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
    }
    ts_->GetTraceDataCache()->ClearHookCommProtos();
}
#endif
#ifdef ENABLE_EBPF
void RpcServer::ProcEbpfSplitResult(SplitFileCallBack splitFileCallBack, bool isLast)
{
    auto ebpfSplitResult = ts_->GetPbreaderParser()->GetEbpfDataParser()->GetEbpfSplitResult();
    std::string result = VALUE_STR;
    for (auto ebpfIter = ebpfSplitResult.begin(); ebpfIter != ebpfSplitResult.end(); ++ebpfIter) {
        if (ebpfIter->type == (int32_t)SplitDataDataType::SPLIT_FILE_JSON) {
            result += OFFSET + std::to_string(ebpfIter->originSeg.offset);
            result += SIZE + std::to_string(ebpfIter->originSeg.size);
            result += "},";
        } else {
            if (result != VALUE_STR) {
                result.pop_back();
                result += "]}\r\n";
                splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 0);
                result = VALUE_STR;
            }
            std::string buffer(reinterpret_cast<char *>(ebpfIter->buffer.address), ebpfIter->buffer.size);
            splitFileCallBack(buffer, (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
        }
    }
    if (result != VALUE_STR) {
        result.pop_back();
        result += "]}\r\n";
        splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 0);
    }
}
#endif
#ifdef ENABLE_HIPERF
void RpcServer::ProcPerfSplitResult(SplitFileCallBack splitFileCallBack, bool isLast)
{
    auto perfSplitResult = ts_->GetPbreaderParser()->GetPerfSplitResult();
    std::string result = VALUE_STR;
    for (auto perfIter = perfSplitResult.begin(); perfIter != perfSplitResult.end(); ++perfIter) {
        if (perfIter->type == (int32_t)SplitDataDataType::SPLIT_FILE_JSON) {
            result += OFFSET + std::to_string(perfIter->originSeg.offset);
            result += SIZE + std::to_string(perfIter->originSeg.size);
            result += "},";
        } else {
            if (result != VALUE_STR) {
                result.pop_back();
                result += "]}\r\n";
                splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 0);
                result = VALUE_STR;
            }
            std::string buffer(reinterpret_cast<char *>(perfIter->buffer.address), perfIter->buffer.size);
            splitFileCallBack(buffer, (int32_t)SplitDataDataType::SPLIT_FILE_DATA, 0);
        }
    }

    if (result != VALUE_STR) {
        result.pop_back();
        result += "]}\r\n";
        splitFileCallBack(result, (int32_t)SplitDataDataType::SPLIT_FILE_JSON, 0);
    }
}
#endif

int32_t RpcServer::UpdateTraceTime(const uint8_t *data, int32_t len)
{
    std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(len);
    std::copy(data, data + len, buf.get());
    ts_->UpdateTraceRangeTime(buf.get(), len);
    return 0;
}

int32_t RpcServer::TraceStreamerInitThirdPartyConfig(const uint8_t *data, int32_t len)
{
    TS_LOGI("TraceStreamerInitThirdPartyConfig is comming!");
    std::string thirdPartyConfig = reinterpret_cast<const char *>(data);
    TS_LOGI("thirdPartyConfig = %s", thirdPartyConfig.c_str());
    std::vector<std::string> comPonentStr = SplitStringToVec(thirdPartyConfig, ";");
    const int32_t eventCountPair = 2;
    if (comPonentStr.size() % eventCountPair != 0) {
        TS_LOGI("thirdPartyConfig is wrong!");
        return -1;
    }
    for (int32_t m = 0; m < comPonentStr.size(); m += eventCountPair) {
        int32_t componentId = std::stoi(comPonentStr.at(m));
        std::string componentName = comPonentStr.at(m + 1);
        TS_LOGI("comPonentStr[m] = %d, comPonentStr[m + 1] = %s", componentId, componentName.c_str());
        g_thirdPartyConfig.insert((std::map<int32_t, std::string>::value_type(componentId, componentName)));
    }
    return 0;
}

bool RpcServer::ParseDataOver(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    Unused(data);
    Unused(len);
    MetaData *metaData = ts_->GetMetaData();
    metaData->SetSourceFileName("input stream mode");
    metaData->SetOutputFileName("wasm mode");
    metaData->SetParserToolVersion(TRACE_STREAMER_VERSION);
    metaData->SetParserToolPublishDateTime(TRACE_STREAMER_PUBLISH_VERSION);
    metaData->SetTraceDataSize(g_loadSize);
    metaData->SetTraceType((ts_->DataType() == TRACE_FILETYPE_H_TRACE) ? "proto-based-trace" : "txt-based-trace");
    TS_LOGI("RPC ParseDataOver, has parsed len %zu", lenParseData_);
    ts_->WaitForParserEnd();
    if (resultCallBack) {
        resultCallBack("ok\r\n", SEND_FINISH);
    }
    endParseTime_ =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    TS_LOGW("ExportDuration:\t%u ms", static_cast<unsigned int>(endParseTime_ - startParseTime_));
    TS_LOGW("ExportSpeed:\t%.2f MB/s", (lenParseData_ / (endParseTime_ - startParseTime_)) / 1E3);
    lenParseData_ = 0;
    g_loadSize = 0;
    return true;
}

bool RpcServer::SqlOperate(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    ts_->SetCancel(false);
    std::string sql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("RPC SqlOperate(%s, %zu)", sql.c_str(), len);

    int32_t ret = ts_->OperateDatabase(sql);
    if (resultCallBack) {
        std::string response = "ok\r\n";
        if (ret != 0) {
            response = "dberror\r\n";
        }
        resultCallBack(response, SEND_FINISH);
    }
    return (ret == 0);
}

bool RpcServer::SqlQuery(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    ts_->SetCancel(false);
    std::string sql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("RPC SqlQuery %zu:%s", len, sql.c_str());

    int32_t ret = ts_->SearchDatabase(sql, resultCallBack);
    if (resultCallBack && ret != 0) {
        resultCallBack("dberror\r\n", SEND_FINISH);
    }
    ts_->SetCancel(false);
    return (ret == 0);
}

void RpcServer::CancelSqlQuery()
{
    ts_->SetCancel(true);
}

bool RpcServer::Reset(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    Unused(data);
    Unused(len);
    TS_LOGI("RPC reset trace_streamer");

    ts_->WaitForParserEnd();
    ts_ = std::make_unique<TraceStreamerSelector>();
    if (resultCallBack) {
        resultCallBack("ok\r\n", SEND_FINISH);
    }
    return true;
}

int32_t RpcServer::WasmSqlQuery(const uint8_t *data, size_t len, uint8_t *out, int32_t outLen)
{
    ts_->SetCancel(false);
    std::string sql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("WASM RPC SqlQuery outlen(%d) sql(%zu:%s)", outLen, len, sql.c_str());

    int32_t ret = ts_->SearchDatabase(sql, out, outLen);
    return ret;
}
bool RpcServer::SqlMetricsQueryWithCallback(const uint8_t *data, size_t len, ResultCallBack callback) const
{
    ts_->SetCancel(false);
    std::string metricsName(reinterpret_cast<const char *>(data), len);
    std::string result = ts_->SearchDatabase(ts_->MetricsSqlQuery(metricsName));
    if (result == "") {
        return false;
    }
    Metrics metricsOperator;
    metricsOperator.ParserJson(metricsName, result);
    for (auto item : metricsOperator.GetMetricsMap()) {
        if (item.second == metricsName) {
            metricsOperator.PrintMetricsResult(item.first, callback);
            return true;
        }
    }
    return true;
}
int32_t RpcServer::WasmSqlQueryWithCallback(const uint8_t *data, size_t len, ResultCallBack callback) const
{
    ts_->SetCancel(false);
    std::string sql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("WASM RPC SqlQuery sql(%zu:%s)", len, sql.c_str());

    int32_t ret = ts_->SearchDatabase(sql, callback);
    return ret;
}
int32_t RpcServer::WasmSqlQueryToProtoCallback(const uint8_t *data,
                                               size_t len,
                                               SqllitePreparCacheData::TLVResultCallBack callback) const
{
    ts_->SetCancel(false);
    std::string strData(reinterpret_cast<const char *>(data), len);

    int32_t ret = ts_->SearchDatabaseToProto(strData, callback);
    return ret;
}

int32_t RpcServer::WasmExportDatabase(ResultCallBack resultCallBack)
{
    return ts_->ExportDatabase("default.db", resultCallBack);
}

#if IS_WASM
void RpcServer::CreateFilePath(const std::string &directory)
{
    if (std::filesystem::exists(directory)) {
        return;
    }
    if (std::filesystem::create_directories(directory)) {
        TS_LOGI("create directory success.");
    } else {
        TS_LOGI("create directory failed!");
    }
}

bool RpcServer::WriteToFile(const std::string &fileName, const uint8_t *data, size_t len)
{
    if (g_importFileFd == nullptr) {
        g_importFileFd = fopen(fileName.c_str(), "a+");
        if (g_importFileFd == nullptr) {
            TS_LOGE("wasm file create failed");
            return false;
        }
    }
    int32_t writeLength = fwrite(data, len, 1, g_importFileFd);
    if (!writeLength) {
        fclose(g_importFileFd);
        TS_LOGE("wasm write file failed");
        return false;
    }
    return false;
}

bool RpcServer::ReloadSymbolsAndClearELFs(const std::string &directory,
                                          const std::string &fileName,
                                          int32_t finish,
                                          ParseELFFileCallBack &parseELFFile)
{
    if (finish) {
        if (!ts_->ReloadSymbolFiles(directory, {fileName})) {
            if (parseELFFile) {
                parseELFFile("formaterror\r\n", SEND_FINISH);
            }
            return false;
        }
        if (parseELFFile) {
            parseELFFile("ok\r\n", SEND_FINISH);
        }
        std::filesystem::remove_all(directory);
    }
    return true;
}

bool RpcServer::DownloadELFCallback(const std::string &filePath,
                                    size_t totalLen,
                                    const uint8_t *data,
                                    size_t len,
                                    int32_t finish,
                                    ParseELFFileCallBack parseELFFile)
{
    g_fileLen += len;
    std::filesystem::path stdFilePath(filePath);
    const std::string fileName = stdFilePath.filename().string();
    const std::string directory = stdFilePath.parent_path().string();
    CreateFilePath(directory);
    if (g_fileLen < totalLen) {
        return WriteToFile(filePath, data, len);
    }
    g_fileLen = 0;
    if (g_importFileFd == nullptr) {
        g_importFileFd = fopen(filePath.c_str(), "a+");
        if (g_importFileFd == nullptr) {
            TS_LOGE("wasm file create failed");
            return false;
        }
    }
    int32_t writeLength = fwrite(data, len, 1, g_importFileFd);
    (void)fclose(g_importFileFd);
    g_importFileFd = nullptr;
    if (!writeLength) {
        TS_LOGE("wasm write file failed");
        return false;
    }
    parseELFFile("file send over\r\n", SEND_FINISH);
    // When the transfer is completed, reload the symbol file, clear the symbol path file list, call the callback
    // function, and delete the symbol path and all files under it
    if (!ReloadSymbolsAndClearELFs(directory, fileName, finish, parseELFFile)) {
        return false;
    }
    return true;
}
#endif

bool RpcServer::SplitFile(std::string timeSnaps)
{
    std::vector<std::string> vTimesnaps = SplitStringToVec(timeSnaps, ";");
    if (vTimesnaps.size() <= 1) {
        return false;
    }
    ts_->minTs_ = std::stoull(vTimesnaps.at(0));
    ts_->maxTs_ = std::stoull(vTimesnaps.at(1));
    TS_LOGI("minTs_=%" PRIu64 ", maxTs_=%" PRIu64 "", ts_->minTs_, ts_->maxTs_);
    return true;
}

bool RpcServer::ParserConfig(std::string parserConfigJson)
{
    TS_LOGI("parserConfigJson=%s", parserConfigJson.c_str());
    ts_->SetConfigFile(parserConfigJson);
    ffrtConvertEnabled_ = ts_->GetFfrtConfig();
    startParseTime_ =
        (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()))
            .count();
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
