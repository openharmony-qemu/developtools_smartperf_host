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

#include "wasm_func.h"

#ifndef NAME_MAX
#define NAME_MAX 255
#endif
namespace SysTuning {
namespace TraceStreamer {
RpcServer g_wasmTraceStreamer;
extern "C" {
using ReplyFunction = void (*)(const char *data, uint32_t len, int32_t finish);
using TLVReplyFunction = void (*)(const char *data, uint32_t len, uint32_t type, int32_t finish);
ReplyFunction g_reply;
ReplyFunction g_ffrtConvertedReply;
TLVReplyFunction g_replyTLV;
uint8_t *g_reqBuf;
uint32_t g_reqBufferSize;

using SplitFileFunction = void (*)(const char *data, uint32_t len, int32_t dataType, int32_t isFinish);
SplitFileFunction g_splitFile;
uint8_t *g_splitFileBuf;
uint32_t g_splitFileBufferSize;

uint8_t *g_parserConfigBuf;
uint32_t g_parserConfigSize;

using SendDataCallBack = void (*)(const char *data, int32_t len, int32_t componentId);
SendDataCallBack g_sendData = nullptr;
uint8_t *g_sendDataBuf;
uint32_t g_sendDataBufSize;

using ExportDBCallback = void (*)(const char *data, uint32_t len, int32_t finish);
ExportDBCallback g_dbCallback;

using ParseELFFunction = void (*)(const char *data, uint32_t len, int32_t finish);
ParseELFFunction g_parseELFCallback;
uint8_t *g_fileNameBuf;
uint32_t g_fileNameSize;
bool g_isSystrace = false;
bool g_hasDeterminedSystrace = false;

void ResultCallback(const std::string &jsonResult, int32_t finish)
{
    g_reply(jsonResult.data(), jsonResult.size(), finish);
}
void TLVResultCallback(const char *data, uint32_t len, uint32_t type, int32_t finish)
{
    g_replyTLV(data, len, type, finish);
}
void FfrtConvertedResultCallback(const std::string &content, int32_t finish)
{
    g_ffrtConvertedReply(content.data(), content.size(), finish);
}
void SplitFileCallback(const std::string &jsonResult, int32_t dataType, int32_t finish)
{
    g_splitFile(jsonResult.data(), jsonResult.size(), dataType, finish);
}

void ParseELFCallback(const std::string &soDataResult, int32_t finish)
{
    g_parseELFCallback(soDataResult.data(), soDataResult.size(), finish);
}
EMSCRIPTEN_KEEPALIVE uint8_t *Initialize(uint32_t reqBufferSize,
                                         ReplyFunction replyFunction,
                                         TLVReplyFunction replyTLVFunction,
                                         ReplyFunction ffrtConvertedReply)
{
    g_reqBuf = new uint8_t[reqBufferSize];
    g_reqBufferSize = reqBufferSize;
    g_reply = replyFunction;
    g_replyTLV = replyTLVFunction;
    g_ffrtConvertedReply = ffrtConvertedReply;
    return g_reqBuf;
}

EMSCRIPTEN_KEEPALIVE uint8_t *InitializeSplitFile(SplitFileFunction splitFileFunction, uint32_t reqBufferSize)
{
    g_splitFile = splitFileFunction;
    g_splitFileBuf = new uint8_t[reqBufferSize];
    g_splitFileBufferSize = reqBufferSize;
    return g_splitFileBuf;
}

EMSCRIPTEN_KEEPALIVE int TraceStreamerSplitFileEx(int dataLen)
{
    std::string timeSnaps(reinterpret_cast<const char *>(g_splitFileBuf), dataLen);
    if (g_wasmTraceStreamer.SplitFile(timeSnaps)) {
        return 0;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE int TraceStreamerReciveFileEx(int32_t dataLen, int32_t isFinish)
{
    if (g_wasmTraceStreamer.ParseSplitFileData(g_splitFileBuf, dataLen, isFinish, &SplitFileCallback, true)) {
        return 0;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE uint8_t *InitializeParseConfig(uint32_t reqBufferSize)
{
    g_parserConfigBuf = new uint8_t[reqBufferSize];
    g_parserConfigSize = reqBufferSize;
    return g_parserConfigBuf;
}

EMSCRIPTEN_KEEPALIVE int TraceStreamerParserConfigEx(int dataLen)
{
    std::string parserConfig(reinterpret_cast<const char *>(g_parserConfigBuf), dataLen);
    if (g_wasmTraceStreamer.ParserConfig(parserConfig)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int TraceStreamerGetLongTraceTimeSnapEx(int dataLen)
{
    std::string dataString(reinterpret_cast<const char *>(g_splitFileBuf), dataLen);
    if (g_wasmTraceStreamer.GetLongTraceTimeSnap(dataString)) {
        return 0;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE int TraceStreamerLongTraceSplitFileEx(int dataLen, int32_t isFinish, uint32_t pageNum)
{
    if (g_wasmTraceStreamer.LongTraceSplitFile(g_splitFileBuf, dataLen, isFinish, pageNum, &SplitFileCallback)) {
        return 0;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE uint8_t *InitFileName(ParseELFFunction parseELFCallback, uint32_t reqBufferSize)
{
    g_parseELFCallback = parseELFCallback;
    if (reqBufferSize > NAME_MAX) {
        return nullptr;
    }
    g_fileNameBuf = new uint8_t[reqBufferSize];
    if (!g_fileNameBuf) {
        return nullptr;
    }
    g_fileNameSize = reqBufferSize;
    return g_fileNameBuf;
}

EMSCRIPTEN_KEEPALIVE int32_t UpdateTraceTime(int32_t len)
{
    return g_wasmTraceStreamer.UpdateTraceTime(g_reqBuf, len);
}

void ThirdParySendDataCallback(const char *pluginData, int32_t len, int32_t componentId)
{
    if (g_sendData) {
        g_sendData(pluginData, len, componentId);
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *TraceStreamerSetThirdPartyDataDealer(SendDataCallBack sendDataCallBack,
                                                                   uint32_t reqBufferSize)
{
    g_sendData = sendDataCallBack;
    g_sendDataBuf = new uint8_t[reqBufferSize];
    g_sendDataBufSize = reqBufferSize;
    return g_sendDataBuf;
}

EMSCRIPTEN_KEEPALIVE void TraceStreamerSetLogLevel(uint32_t level)
{
    if (level >= LOG_DEBUG && level <= LOG_OFF) {
        g_curLogLevel = static_cast<enum LogLevel>(level);
    }
}

int32_t TraceStreamerPluginOutFilter(const char *pluginData, int32_t len, const std::string &componentName)
{
    std::map<int32_t, std::string>::iterator itor = g_wasmTraceStreamer.g_thirdPartyConfig.begin();
    int32_t componentId;
    for (; itor != g_wasmTraceStreamer.g_thirdPartyConfig.end(); ++itor) {
        if (itor->second == componentName) {
            componentId = itor->first;
            return TraceStreamerPluginOutSendData(pluginData, len, componentId);
        }
    }
    return -1;
}

// Tell js to call the corresponding third-party parser interface according to the compositeId
int32_t TraceStreamerPluginOutSendData(const char *pluginData, int32_t len, int32_t componentId)
{
    ThirdParySendDataCallback(pluginData, len, componentId);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerInitThirdPartyConfig(int32_t dataLen)
{
    return g_wasmTraceStreamer.TraceStreamerInitThirdPartyConfig(g_reqBuf, dataLen);
}

// return 0 while ok, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerParseData(const uint8_t *data, int32_t dataLen)
{
    if (g_wasmTraceStreamer.ParseData(data, dataLen, nullptr, false)) {
        return 0;
    }
    return -1;
}
// return 0 while ok, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerParseDataEx(int32_t dataLen, bool isFinish)
{
    if (!g_hasDeterminedSystrace) {
        g_isSystrace = g_wasmTraceStreamer.DetermineSystrace(g_reqBuf, dataLen);
        g_hasDeterminedSystrace = true;
    }
    if (g_wasmTraceStreamer.GetFfrtConvertStatus() && g_isSystrace) {
#if IS_WASM
        return g_wasmTraceStreamer.SaveAndParseFfrtData(g_reqBuf, dataLen, &FfrtConvertedResultCallback, isFinish);
#endif
    } else if (g_wasmTraceStreamer.ParseData(g_reqBuf, dataLen, nullptr, isFinish)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerDownloadELFEx(int32_t totalLen,
                                                        int32_t fileNameLen,
                                                        int32_t dataLen,
                                                        int32_t finish)
{
    std::string fileName(reinterpret_cast<const char *>(g_fileNameBuf), fileNameLen);
#if IS_WASM
    if (g_wasmTraceStreamer.DownloadELFCallback(fileName, totalLen, g_reqBuf, dataLen, finish, &ParseELFCallback)) {
        return 0;
    }
#endif
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerParseDataOver()
{
    if (g_wasmTraceStreamer.ParseDataOver(nullptr, 0, nullptr)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlOperateEx(int32_t sqlLen)
{
    if (g_wasmTraceStreamer.SqlOperate(g_reqBuf, sqlLen, nullptr)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerReset()
{
    g_wasmTraceStreamer.Reset(nullptr, 0, nullptr);
    return 0;
}
// return the length of result, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlQuery(const uint8_t *sql, int32_t sqlLen, uint8_t *out, int32_t outLen)
{
    return g_wasmTraceStreamer.WasmSqlQuery(sql, sqlLen, out, outLen);
}
// return the length of result, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlQueryEx(int32_t sqlLen)
{
    return g_wasmTraceStreamer.WasmSqlQueryWithCallback(g_reqBuf, sqlLen, &ResultCallback);
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlQueryToProtoCallback(int32_t sqlLen)
{
    return g_wasmTraceStreamer.WasmSqlQueryToProtoCallback(g_reqBuf, sqlLen, &TLVResultCallback);
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlMetricsQuery(int32_t sqlLen)
{
    if (g_wasmTraceStreamer.SqlMetricsQueryWithCallback(g_reqBuf, sqlLen, &ResultCallback)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerCancel()
{
    g_wasmTraceStreamer.CancelSqlQuery();
    return 0;
}

void ExportDatabaseCallback(const std::string &jsonResult, int32_t finish)
{
    g_dbCallback(jsonResult.data(), jsonResult.size(), finish);
}

EMSCRIPTEN_KEEPALIVE int32_t WasmExportDatabase(ExportDBCallback fun)
{
    g_dbCallback = fun;
    return g_wasmTraceStreamer.WasmExportDatabase(&ExportDatabaseCallback);
}
} // extern "C"
} // namespace TraceStreamer
} // namespace SysTuning
