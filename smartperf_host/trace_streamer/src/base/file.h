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

#ifndef INCLUDE_TUNING_BASE_FILE_UTILS_H
#define INCLUDE_TUNING_BASE_FILE_UTILS_H

#include <cstdint>
#include <memory>
#include <string>
#include <vector>
#include <filesystem>

#include "contrib/minizip/unzip.h"

namespace SysTuning {
namespace base {
#define TS_PERMISSION_RW 0600
#define TS_PERMISSION_RWX 777
#define ZLIB_CMF 0x78
#define ZLIB_FLG 0x9C
#define ZLIB_MAGIC_NUM_LEN 2
constexpr uint32_t K_FILE_MODE_INVALID = 0xFFFFFFFF;
enum TraceParserStatus {
    TRACE_PARSER_NORMAL = 0,
    TRACE_PARSER_FILE_TYPE_ERROR = 1,
    TRACE_PARSE_ERROR = 2,
    TRACE_PARSER_ABNORMAL = 3
};

void SetAnalysisResult(TraceParserStatus stat);

TraceParserStatus GetAnalysisResult();

ssize_t Read(int32_t fd, uint8_t *dst, size_t dstSize);

int32_t OpenFile(const std::string &path, int32_t flags, uint32_t mode = K_FILE_MODE_INVALID);

std::string GetExecutionDirectoryPath();

#if defined(is_linux) || defined(_WIN32)
std::vector<std::string> GetFilesNameFromDir(const std::string &path, bool onlyFileName = true);
#endif

bool UnZipFile(const std::string &zipFile, std::string &traceFile);
bool UnZlibFile(const std::string &zlibFile, std::string &traceFile);

bool LocalUnzip(const std::string &zipFile, const std::string &dstDir);

class LocalZip {
public:
    explicit LocalZip(const std::string &file);
    bool Unzip(std::string &traceFile);
    bool Unzlib(std::string &traceFile);

private:
    bool IsFileExist();
    bool IsZipFile();
    bool IsZlibFile();
    static bool CreateDir(const std::filesystem::path &dirName, bool del = false);
    bool WriteFile(const unzFile &uzf, const std::filesystem::path &fileName);
    bool WriteFile(std::ifstream &srcFile, std::ofstream &destFile);
    std::string filePath_;
    std::string tmpDir_;
    uint32_t bufSize_ = 512000000;
    uint8_t magicNumLen_ = 2;
    std::unique_ptr<char[]> buf_;
};

} // namespace base
} // namespace SysTuning
#endif // INCLUDE_TUNING_BASE_FILE_UTILS_H_
