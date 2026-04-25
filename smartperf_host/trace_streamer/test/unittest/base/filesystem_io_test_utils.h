/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#ifndef TRACE_STREAMER_FILESYSTEM_IO_TEST_UTILS_H
#define TRACE_STREAMER_FILESYSTEM_IO_TEST_UTILS_H

#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>

#include "cpu_detail_parser.h"
#include "parser/common_types.h"
#include "trace_streamer_selector.h"

namespace SysTuning {
namespace TraceStreamer {
using ArgsMap = std::unordered_map<std::string, std::string>;

inline uint64_t MakeDev(uint32_t mainDev, uint32_t subDev)
{
    return (static_cast<uint64_t>(mainDev) << DEV_MAJOR_SHIFT) | static_cast<uint64_t>(subDev);
}

inline std::unique_ptr<TraceStreamerSelector> CreateSelectorForFsIo()
{
    auto selector = std::make_unique<TraceStreamerSelector>();
    selector->InitFilter();
    selector->EnableMetaTable(false);
    return selector;
}

inline BytraceLine MakeBytraceLine(uint64_t ts, uint32_t pid, const std::string &eventName, const std::string &argsStr)
{
    BytraceLine line{};
    line.ts = ts;
    line.pid = pid;
    line.cpu = 0;
    line.task = "ut-0";
    line.eventName = eventName;
    line.argsStr = argsStr;
    return line;
}
} // namespace TraceStreamer
} // namespace SysTuning

#endif // TRACE_STREAMER_FILESYSTEM_IO_TEST_UTILS_H
