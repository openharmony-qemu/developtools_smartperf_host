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
#include <cerrno>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <sys/stat.h>
#include <unistd.h>

#include "log.h"
#if defined(_WIN32)
#include <direct.h>
#include <io.h>
#include <windows.h>
#endif
#if defined(is_linux) || defined(_WIN32)
#include <filesystem>
#endif
#include "zlib.h"
#include "contrib/minizip/zip.h"
#include "contrib/minizip/unzip.h"

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
#if defined(is_linux) || defined(_WIN32)
std::vector<std::string> GetFilesNameFromDir(const std::string &path, bool onlyFileName)
{
    std::vector<std::string> soFiles;

    std::filesystem::path dirPath(path);
    // 检查文件是否存在
    if (!std::filesystem::exists(dirPath)) {
        TS_LOGI("!std::filesystem::exists(dirPath), dirPath: %s\n", path.data());
        return soFiles;
    }
    // 遍历目录
    for (const auto &entry : std::filesystem::recursive_directory_iterator(dirPath)) {
        if (entry.is_directory()) {
            continue;
        }
        soFiles.emplace_back(onlyFileName ? entry.path().filename().string() : entry.path().string());
    }
    return soFiles;
}
#endif

bool UnZipFile(const std::string &zipFile, std::string &traceFile)
{
    std::filesystem::path stdZipFile(zipFile);
    // 检查文件是否存在
    if (!std::filesystem::exists(stdZipFile)) {
        TS_LOGI("!std::filesystem::exists(dirPath), dirPath: %s\n", zipFile.data());
        return false;
    }
    std::ifstream zipIfstream(stdZipFile);
    char buf[2];
    zipIfstream.read(buf, 2);
    if (buf[0] != 'P' || buf[1] != 'K') {
        // 不是zip文件, 返回true走正常解析流程
        return true;
    } else {
        auto unzipDirPath = stdZipFile.parent_path().append("tmp").string();
        LocalUnzip(zipFile, unzipDirPath);
        auto files = GetFilesNameFromDir(unzipDirPath, false);
        if (files.size() == 1) {
            traceFile = files[0];
            return true;
        }
        return false;
    }
}

bool LocalUnzip(const std::string &zipFile, const std::string &dstDir)
{
    int err = 0;
    void *buf;
    uInt size_buf;
    // 创建 dstDir
    if (std::filesystem::exists(dstDir)) {
        std::filesystem::remove_all(dstDir);
        std::filesystem::create_directories(dstDir);
    }

    // 打开zip文件
    unzFile uf = unzOpen(zipFile.c_str());
    if (uf == NULL) {
        std::cout << "unzOpen error." << std::endl;
        return false;
    }

    // 获取zip文件信息
    unz_global_info gi;
    err = unzGetGlobalInfo(uf, &gi);
    if (err != UNZ_OK) {
        std::cout << "unzGetGlobalInfo error." << std::endl;
        return false;
    }

    size_buf = 512000000;
    buf = (void *)malloc(size_buf);

    // 遍历zip
    for (int i = 0; i < gi.number_entry; i++) {
        char filename_inzip[256];
        unz_file_info file_info;
        uLong ratio = 0;
        const char *string_method = "";
        char charCrypt = ' ';
        err = unzGetCurrentFileInfo(uf, &file_info, filename_inzip, sizeof(filename_inzip), NULL, 0, NULL, 0);
        if (err != UNZ_OK) {
            std::cout << "error " << err << " with zipfile in unzGetCurrentFileInfo." << std::endl;
            break;
        }
        std::string isdir;
        std::string filename = filename_inzip;
        if (filename.back() == '/' || filename.back() == '\\') {
            //* 是目录，则创建目录
            isdir = " is directory";
            std::string dir = dstDir + "/" + filename;
            if (!std::filesystem::exists(dir)) {
                std::filesystem::create_directories(dir);
            }
        } else {
            //* 是文件，打开 -> 读取 -> 写入解压文件 -> 关闭
            isdir = " is file";

            err = unzOpenCurrentFile(uf);
            if (err != UNZ_OK) {
                std::cout << "error " << err << " with zipfile in unzOpenCurrentFile." << std::endl;
            } else {
                std::string writefile = dstDir + "/" + filename;
                std::filesystem::path fpath(writefile);
                std::string par = fpath.parent_path().string();
                if (!fpath.parent_path().empty() && !std::filesystem::exists(fpath.parent_path())) {
                    std::filesystem::create_directories(fpath.parent_path());
                }
                err = unzReadCurrentFile(uf, buf, size_buf);
                if (err < 0) {
                    std::cout << "error " << err << " with zipfile in unzReadCurrentFile." << std::endl;
                    break;
                }
                if (err > 0) {
                    FILE *fout = fopen(writefile.c_str(), "wb");
                    if (fwrite(buf, (unsigned)err, 1, fout) != 1) {
                        std::cout << "error in writing extracted filee." << std::endl;
                        err = UNZ_ERRNO;
                        break;
                    }
                    fclose(fout);
                }
                unzCloseCurrentFile(uf);
            }
        }

        if ((i + 1) < gi.number_entry) {
            err = unzGoToNextFile(uf);
            if (err != UNZ_OK) {
                std::cout << "error " << err << " with zipfile in unzGoToNextFile." << std::endl;
                break;
            }
        }
    }

    unzClose(uf);

    return true;
}
} // namespace base
} // namespace SysTuning
