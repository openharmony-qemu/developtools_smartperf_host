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

#ifndef SYS_CALL_STRATEGY_H
#define SYS_CALL_STRATEGY_H
#include <map>
#include <string>
#include <vector>

namespace SysTuning {
namespace TraceStreamer {
struct FunctionItem {
    std::string functionName;
    int32_t durMax = -1;
    int32_t durMin = -1;
    int32_t durAvg = -1;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // SYS_CALL_STRATEGY_H
