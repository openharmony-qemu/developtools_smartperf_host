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

#ifndef RPC_RPC_H
#define RPC_RPC_H

#include <functional>
#include <mutex>
#include "trace_streamer/trace_streamer_selector.h"
#include "sdk/sdk_data_parser.h"
namespace SysTuning {
namespace TraceStreamer {
class DemoRpcServer {
public:
    using ResultCallBack = std::function<void(const std::string /* result */, int32_t, int32_t)>;
    using TraceRangeCallbackFunction = std::function<void(const std::string)>;
    // In order to bind HTTP, maintain a unified interface, even if some parameters are useless
    bool DemoSqlOperate(const uint8_t* data, size_t len, ResultCallBack resultCallBack);
    bool DemoSqlQuery(const uint8_t* data, size_t len, ResultCallBack resultCallBack);
    bool DemoReset(const uint8_t* data, size_t len, ResultCallBack resultCallBack);
    void DemoCancelSqlQuery();

    // only for wasm, no callback
    int32_t DemoWasmSqlQuery(const uint8_t* data, size_t len, uint8_t* out, int32_t outLen);
    int32_t DemoWasmSqlQueryWithCallback(const uint8_t* data, size_t len, ResultCallBack callback) const;
    int32_t DemoWasmGetPluginNameWithCallback(const uint8_t* data, size_t len) const;

public:
    std::unique_ptr<TraceStreamerSelector> demoTs_ = std::make_unique<TraceStreamerSelector>();
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // RPC_RPC_H
