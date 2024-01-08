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

#ifndef EXPORT_TEST_H
#define EXPORT_TEST_H

#include <string>
#include "trace_streamer_selector.h"
namespace SysTuning {
namespace TraceStreamer {
constexpr size_t G_FILE_PERMISSION = 664;
constexpr uint8_t RAW_TRACE_PARSE_MAX = 2;
constexpr size_t G_CHUNK_SIZE = 1024 * 1024;
bool ParseTraceFile(TraceStreamerSelector& ts, const std::string& tracePath);
} // namespace TraceStreamer
} // namespace SysTuning

#endif // EXPORT_TEST_H
