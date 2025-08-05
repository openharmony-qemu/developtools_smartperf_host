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
#ifndef SRC_TRACE_BASE_STRINGHELP_H
#define SRC_TRACE_BASE_STRINGHELP_H

#include <cstdint>
#include <cxxabi.h>
#include <string>
#include <vector>
#include "securec.h"
namespace SysTuning {
namespace base {
char *GetDemangleSymbolIndex(const char *mangled);
std::vector<std::string> SplitStringToVec(const std::string &str,
                                          const std::string &pat,
                                          uint32_t expectedCount = UINT32_MAX);
bool StartWith(const std::string &str, const std::string &res);
bool EndWith(const std::string &str, const std::string &res);
std::string FormatString(const char *p);
std::string Strip(const std::string &str);
std::string StrTrim(const std::string &input);
void StrTrim(std::string &input);
std::string TrimInvisibleCharacters(const std::string &str);
void RemoveNullTerminator(std::string &str);
uint32_t StrHash(const std::string &str, uint32_t maxValue = 20);
} // namespace base
} // namespace SysTuning
#endif // SRC_TRACE_BASE_STRINGHELP_H
