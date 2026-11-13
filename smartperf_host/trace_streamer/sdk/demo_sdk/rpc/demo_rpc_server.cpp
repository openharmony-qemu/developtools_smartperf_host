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
#include "demo_rpc_server.h"

#include <cstdint>
#include <cstring>
#include <functional>

#include "log.h"
#include "version.h"

#define UNUSED(expr)             \
    do {                         \
        static_cast<void>(expr); \
    } while (0)
namespace SysTuning {
namespace TraceStreamer {

bool DemoRpcServer::DemoSqlOperate(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    demoTs_->SetCancel(false);
    std::string demoSql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("RPC DemoSqlOperate(%s, %zu)", demoSql.c_str(), len);

    int32_t ret = demoTs_->OperateDatabase(demoSql);
    if (resultCallBack) {
        std::string response = "ok\r\n";
        if (ret != 0) {
            response = "dberror\r\n";
        }
        resultCallBack(response, SEND_FINISH, 0);
    }
    return (ret == 0);
}

bool DemoRpcServer::DemoSqlQuery(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    demoTs_->SetCancel(false);
    std::string demoSql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("RPC DemoSqlQuery %zu:%s", len, demoSql.c_str());

    int32_t ret = demoTs_->SearchDatabase(demoSql, resultCallBack);
    if (resultCallBack && ret != 0) {
        resultCallBack("dberror\r\n", SEND_FINISH, 0);
    }
    demoTs_->SetCancel(false);
    return (ret == 0);
}

void DemoRpcServer::DemoCancelSqlQuery()
{
    demoTs_->SetCancel(true);
}

bool DemoRpcServer::DemoReset(const uint8_t *data, size_t len, ResultCallBack resultCallBack)
{
    UNUSED(data);
    UNUSED(len);
    TS_LOGI("RPC DemoReset trace_streamer");
    demoTs_->WaitForParserEnd();
    demoTs_ = std::make_unique<TraceStreamerSelector>();
    if (resultCallBack) {
        resultCallBack("ok\r\n", SEND_FINISH, 0);
    }
    return true;
}

int32_t DemoRpcServer::DemoWasmSqlQuery(const uint8_t *data, size_t len, uint8_t *out, int32_t outLen)
{
    demoTs_->SetCancel(false);
    std::string demoSql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("WASM RPC DemoSqlQuery outlen(%d) demoSql(%zu:%s)", outLen, len, demoSql.c_str());
    int32_t ret = demoTs_->SearchDatabase(demoSql, out, outLen);
    return ret;
}

int32_t DemoRpcServer::DemoWasmGetPluginNameWithCallback(const uint8_t *data, size_t len) const
{
    std::string pluginName(reinterpret_cast<const char *>(data), len);
    TS_LOGI("WASM pluginName(%zu:%s)", len, pluginName.c_str());

    int32_t ret = demoTs_->sdkDataParser_->GetPluginName(pluginName);
    return ret;
}

int32_t DemoRpcServer::DemoWasmSqlQueryWithCallback(const uint8_t *data, size_t len, ResultCallBack callback) const
{
    demoTs_->SetCancel(false);
    std::string demoSql(reinterpret_cast<const char *>(data), len);
    TS_LOGI("WASM RPC DemoSqlQuery demoSql(%zu:%s)", len, demoSql.c_str());

    int32_t ret = demoTs_->SearchDatabase(demoSql, callback);
    return ret;
}

} // namespace TraceStreamer
} // namespace SysTuning
