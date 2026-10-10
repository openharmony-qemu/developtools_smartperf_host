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
#include "string_help.h"
#include <cctype>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include "log.h"
namespace SysTuning {
namespace base {
static bool IsOperatorPrefix(const std::string &str, size_t pos)
{
    constexpr size_t OPERATOR_LEN = 8;
    if (pos < OPERATOR_LEN) {
        return false;
    }
    return str.compare(pos - OPERATOR_LEN, OPERATOR_LEN, "operator") == 0;
}

static void NormalizeDoubleGreaterThan(std::string &result)
{
    constexpr size_t DOUBLE_GT_LEN = 2;
    constexpr size_t SPACED_GT_LEN = 3;
    size_t pos = 0;
    while ((pos = result.find(">>", pos)) != std::string::npos) {
        if (IsOperatorPrefix(result, pos)) {
            pos += DOUBLE_GT_LEN;
            continue;
        }
        result.replace(pos, DOUBLE_GT_LEN, "> >");
        pos += SPACED_GT_LEN - 1;
    }
}

static char *AllocAndCopyDemangled(const std::string &str, const char *fallback)
{
    char *ret = static_cast<char *>(malloc(str.size() + 1));
    if (!ret) {
        TS_LOGE("malloc failed, size: %zu", str.size() + 1);
        return const_cast<char *>(fallback);
    }
    if (memcpy_s(ret, str.size() + 1, str.c_str(), str.size() + 1) != EOK) {
        TS_LOGE("memcpy_s failed");
        free(ret);
        return const_cast<char *>(fallback);
    }
    return ret;
}

char *GetDemangleSymbolIndex(const char *mangled)
{
    if (mangled == nullptr) {
        return nullptr;
    }
    int status = 0;
    auto demangle = abi::__cxa_demangle(mangled, nullptr, nullptr, &status);
    if (status) {
        return const_cast<char *>(mangled);
    }
    std::string result(demangle);
    NormalizeDoubleGreaterThan(result);
    if (result != demangle) {
        free(demangle);
        return AllocAndCopyDemangled(result, mangled);
    }
    return demangle;
}

bool StartWith(const std::string &str, const std::string &res)
{
    if (res.size() > str.size()) {
        return false;
    }
    return str.compare(0, res.length(), res) == 0;
}

bool EndWith(const std::string &str, const std::string &res)
{
    if (res.size() > str.size()) {
        return false;
    }
    return str.compare(str.size() - res.size(), res.size(), res) == 0;
}

std::vector<std::string> SplitStringToVec(const std::string &str, const std::string &pat, uint32_t expectedCount)
{
    std::vector<std::string> result;
    size_t curPos = 0;
    size_t strSize = str.size();
    size_t patSize = pat.size();
    uint32_t endFlag = 0;
    while (curPos < strSize) {
        auto patPos = str.find(pat, curPos);
        if (patPos == std::string::npos || endFlag == expectedCount) {
            break;
        }
        result.emplace_back(str.substr(curPos, patPos - curPos));
        curPos = patPos + patSize;
        endFlag++;
    }
    if (curPos < strSize) {
        result.emplace_back(str.substr(curPos));
    }

    return result;
}
std::string TrimInvisibleCharacters(const std::string &str)
{
    size_t start = 0;
    size_t end = str.length() - 1;
    while (start <= end && !std::isgraph(str[start])) {
        start++;
    }
    while (end >= start && !std::isgraph(str[end])) {
        end--;
    }
    return str.substr(start, end - start + 1);
}

std::string FormatString(const char *p)
{
    std::string str = "\"";
    for (const char *c = p; *c != 0; c++) {
        if (*c == '\\' || *c == '\"') {
            str += "\\";
        }
        str += *c;
    }
    str += "\"";
    return str;
}

std::string Strip(const std::string &str)
{
    std::string blanks = " \f\v\t\r\n";

    auto first = str.find_first_not_of(blanks);
    if (first == std::string::npos) {
        return "";
    }

    auto last = str.find_last_not_of(blanks);
    if (last == std::string::npos) {
        return "";
    }
    return str.substr(first, last - first + 1);
}

std::string StrTrim(const std::string &input)
{
    std::string str = input;
    if (str.empty()) {
        return str;
    }
    str.erase(0, str.find_first_not_of(' '));
    str.erase(str.find_last_not_of(' ') + 1);
    return str;
}

// in-place版本, 直接修改str
void StrTrim(std::string &input)
{
    if (input.empty()) {
        return;
    }
    input.erase(0, input.find_first_not_of(' '));
    input.erase(input.find_last_not_of(' ') + 1);
}

void RemoveNullTerminator(std::string &str)
{
    size_t pos = str.rfind('\0');
    while (pos != std::string::npos) {
        str.erase(pos, 1);
        pos = str.rfind('\0');
    }
}

uint32_t StrHash(const std::string &str, uint32_t maxValue)
{
    if (maxValue == 0) {
        return 0;
    }
    static const uint32_t COLOR_A = 9876023;
    static const uint32_t COLOR_B = 0xffffffff;
    uint32_t hash = 0x11c9dc5;
    for (const auto &chr : str) {
        if (std::isdigit(chr)) {
            continue;
        }
        hash ^= chr;
        hash = (hash * COLOR_A) & COLOR_B;
    }
    return hash % maxValue;
}
} // namespace base
} // namespace SysTuning
