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

#include "file.h"
#include <atomic>
#include <cerrno>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>

#include "log.h"
#if defined(_WIN32)
#include <direct.h>
#include <io.h>
#include <windows.h>
#endif

namespace SysTuning {
namespace base {
static TraceParserStatus g_status = TRACE_PARSER_ABNORMAL;

void SetAnalysisResult(TraceParserStatus stat)
{
    g_status = stat;
}
TraceParserStatus GetAnalysisResult()
{
    return g_status;
}

ssize_t Read(int32_t fd, uint8_t *dst, size_t dstSize)
{
#if defined(_WIN32)
    return _read(fd, dst, static_cast<unsigned>(dstSize));
#else
    ssize_t ret = -1;
    do {
        ret = read(fd, dst, dstSize);
    } while (ret == -1 && errno == EINTR);
    return ret;
#endif
}
int32_t OpenFile(const std::string &path, int32_t flags, uint32_t mode)
{
    TS_ASSERT((flags & O_CREAT) == 0 || mode != K_FILE_MODE_INVALID);
#if defined(_WIN32)
    int32_t fd(_open(path.c_str(), flags | O_BINARY, mode));
#else
    int32_t fd(open(path.c_str(), flags | O_CLOEXEC, mode));
#endif
    return fd;
}

std::string GetExecutionDirectoryPath()
{
    char currPath[1024] = {0};
#if defined(_WIN32)
    ::GetModuleFileNameA(NULL, currPath, MAX_PATH);
    (strrchr(currPath, '\\'))[1] = 0;
#else
    (void)readlink("/proc/self/exe", currPath, sizeof(currPath) - 1);
#endif
    std::string str(currPath);
    return str.substr(0, str.find_last_of('/'));
}
#ifdef is_linux
std::vector<std::string> GetFilesNameFromDir(const std::string &path)
{
    std::vector<std::string> soFiles;

    std::filesystem::path dirPath(path);
    // 检查文件是否存在
    if (!std::filesystem::exists(dirPath)) {
        TS_LOGI("!std::filesystem::exists(dirPath), dirPath: %s\n", path.data());
        return soFiles;
    }
    // 遍历目录
    for (const auto &entry : std::filesystem::directory_iterator(dirPath)) {
        soFiles.emplace_back(entry.path().string());
    }
    return soFiles;
}
#endif
} // namespace base
} // namespace SysTuning
