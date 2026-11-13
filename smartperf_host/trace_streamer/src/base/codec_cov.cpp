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

#include "codec_cov.h"

#include <memory>
#include <iostream>
#ifdef _WIN32
#include <windows.h>
#endif

namespace SysTuning {
namespace base {
int32_t PreNum(unsigned char byte)
{
    constexpr uint32_t BITS = 8;
    unsigned char mask = 0x80;
    int32_t num = 0;
    for (uint32_t i = 0; i < BITS; i++) {
        if ((byte & mask) == mask) {
            mask = mask >> 1;
            num++;
        } else {
            break;
        }
    }
    return num;
}

bool IsUTF8(const uint8_t *data, int32_t len)
{
    constexpr uint8_t mask = 0x80;
    constexpr uint8_t firstByte = 0xc0;
    constexpr int32_t target = 2;
    int32_t num = 0;
    int32_t i = 0;
    while (i < len) {
        if ((data[i] & mask) == 0x00) {
            i++;
            continue;
        }
        if ((num = PreNum(data[i])) <= target) {
            return false;
        }
        i++;
        for (int32_t j = 0; j < num - 1; j++) {
            if ((data[i] & firstByte) != mask) {
                return false;
            }
            i++;
        }
    }
    return true;
}

bool IsGBK(const uint8_t *data, int32_t len)
{
    constexpr int32_t step = 2;
    constexpr uint8_t asciiEnd = 0x7f;
    constexpr uint8_t firstByte = 0x81;
    constexpr uint8_t firstByteEnd = 0xfe;
    constexpr uint8_t secondByteOne = 0x40;
    constexpr uint8_t secondByteTwoEnd = 0xfe;
    constexpr uint8_t gbkMask = 0x7f;
    int32_t i = 0;
    while (i < len) {
        if (data[i] <= asciiEnd) {
            i++;
            continue;
        } else {
            if (data[i] >= firstByte && data[i] <= firstByteEnd && data[i + 1] >= secondByteOne &&
                data[i + 1] <= secondByteTwoEnd && data[i + 1] != gbkMask) {
                i += step;
                continue;
            } else {
                return false;
            }
        }
    }
    return true;
}

CODING GetCoding(const uint8_t *data, int32_t len)
{
    CODING coding;
    if (IsUTF8(data, len)) {
        coding = UTF8;
    } else if (IsGBK(data, len)) {
        coding = GBK;
    } else {
        coding = UNKOWN;
    }
    return coding;
}

#ifdef _WIN32
std::string GbkToUtf8(const char *srcStr)
{
    int32_t len = MultiByteToWideChar(CP_ACP, 0, srcStr, -1, NULL, 0);
    std::unique_ptr<wchar_t[]> wstr = std::make_unique<wchar_t[]>(len + 1);
    MultiByteToWideChar(CP_ACP, 0, srcStr, -1, wstr.get(), len);
    len = WideCharToMultiByte(CP_UTF8, 0, wstr.get(), -1, NULL, 0, NULL, NULL);
    std::unique_ptr<char[]> str = std::make_unique<char[]>(len + 1);
    WideCharToMultiByte(CP_UTF8, 0, wstr.get(), -1, str.get(), len, NULL, NULL);
    return std::string(str.get());
}
std::string Utf8ToGbk(const char *srcStr)
{
    int32_t len = MultiByteToWideChar(CP_UTF8, 0, srcStr, -1, NULL, 0);
    std::unique_ptr<wchar_t[]> wstr = std::make_unique<wchar_t[]>(len + 1);
    MultiByteToWideChar(CP_UTF8, 0, srcStr, -1, wstr.get(), len);
    len = WideCharToMultiByte(CP_ACP, 0, wstr.get(), -1, NULL, 0, NULL, NULL);
    std::unique_ptr<char[]> str = std::make_unique<char[]>(len + 1);
    WideCharToMultiByte(CP_ACP, 0, wstr.get(), -1, str.get(), len, NULL, NULL);
    return std::string(str.get());
}
/** @fn        std::wstring String2WString(const std::string& strInput)
 *  @brief    string转换为wstring
 *  @param    (IN) const std::string&
 *  @return    std::wstring
 */
std::wstring String2WString(const std::string &strInput)
{
    auto codePage = IsGBK(reinterpret_cast<const uint8_t *>(strInput.c_str()), strInput.length()) ? CP_ACP : CP_UTF8;
    if (strInput.empty()) {
        std::cout << "strInput is empty" << std::endl;
        return L"";
    }

    // 获取待转换的数据的长度
    int len_in = MultiByteToWideChar(codePage, 0, (LPCSTR)strInput.c_str(), -1, NULL, 0);
    if (len_in <= 0) {
        std::cout << "The result of WideCharToMultiByte is Invalid!" << std::endl;
        return L"";
    }

    // 为输出数据申请空间
    std::wstring wstr_out;
    wstr_out.resize(len_in - 1, L'\0');

    // 数据格式转换
    int to_result = MultiByteToWideChar(codePage, 0, (LPCSTR)strInput.c_str(), -1, (LPWSTR)wstr_out.c_str(), len_in);
    // 判断转换结果
    if (0 == to_result) {
        std::cout << "Can't transfer String to WString" << std::endl;
    }

    return wstr_out;
}
#endif
} // namespace base
} // namespace SysTuning
