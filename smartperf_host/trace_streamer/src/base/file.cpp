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
#include <memory>
#include <sys/stat.h>
#include <unistd.h>
#include <zlib.h>

#include "log.h"
#include "codec_cov.h"
#if defined(_WIN32)
#include <direct.h>
#include <io.h>
#include <windows.h>
#endif

namespace SysTuning {
namespace base {
#define ZLIB_CHUNK_SIZE 65536
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

bool UnZipFile(const std::string &zipFile, std::string &traceFile)
{
    LocalZip localZip(zipFile);
    return localZip.Unzip(traceFile);
}

bool UnZlibFile(const std::string &zlibFile, std::string &traceFile)
{
    LocalZip localZip(zlibFile);
    return localZip.Unzlib(traceFile);
}

LocalZip::LocalZip(const std::string &file) : filePath_(file)
{
    buf_ = std::make_unique<char[]>(bufSize_);
    tmpDir_ = std::filesystem::path(file).parent_path().append("ts_tmp").string();
}

// 检查文件是否存在
bool LocalZip::IsFileExist()
{
#ifdef _WIN32
    std::filesystem::path zipFile(String2WString(filePath_));
#else
    std::filesystem::path zipFile(filePath_);
#endif
    if (!std::filesystem::exists(zipFile)) {
        TS_LOGE("!std::filesystem::exists(zipFile), filePath: %s\n", filePath_.data());
        return false;
    }
    return true;
}

// 检查是否为zip文件
bool LocalZip::IsZipFile()
{
    std::ifstream zipIfstream(filePath_);
    char buf[magicNumLen_];
    zipIfstream.read(buf, magicNumLen_);
    return buf[0] == 'P' && buf[1] == 'K';
}

bool LocalZip::IsZlibFile()
{
    std::ifstream zlibIfstream(filePath_);
    unsigned char buf[ZLIB_MAGIC_NUM_LEN];
    zlibIfstream.read(reinterpret_cast<char *>(buf), ZLIB_MAGIC_NUM_LEN);
    return buf[0] == ZLIB_CMF && buf[1] == ZLIB_FLG;
}

bool LocalZip::CreateDir(const std::filesystem::path &dirName, bool del)
{
    std::filesystem::path dir = dirName;
    if (dirName.u8string().back() == '/' || dirName.u8string().back() == '\\') {
        auto tmpStr = dirName.u8string().substr(0, dirName.u8string().size() - 1);
#ifdef _WIN32
        dir = std::filesystem::path(String2WString(tmpStr));
#else
        dir = std::filesystem::path(tmpStr);
#endif
    }
    if (std::filesystem::exists(dir)) {
        if (del) {
            std::filesystem::remove_all(dir);
        } else {
            return true;
        }
    }
    return std::filesystem::create_directories(dir);
}

bool LocalZip::WriteFile(const unzFile &uzf, const std::filesystem::path &fileName)
{
    if (unzOpenCurrentFile(uzf) != UNZ_OK) {
        TS_LOGE("unzOpenCurrentFile error.");
    } else {
        auto parentPath = fileName.parent_path();
        if (!parentPath.empty()) {
            CreateDir(parentPath);
        }
#ifdef _WIN32
        FILE *fout = fopen(Utf8ToGbk(fileName.u8string().c_str()).c_str(), "wb");
#else
        FILE *fout = fopen(fileName.c_str(), "wb");
#endif
        if (fout == nullptr) {
            unzCloseCurrentFile(uzf);
            return false;
        }
        int err = 1;
        while (err >= 0) {
            err = unzReadCurrentFile(uzf, buf_.get(), bufSize_);
            if (fwrite(buf_.get(), (unsigned)err, 1, fout) != 1) {
                TS_LOGE("error in writing extracted filee.");
                break;
            }
        }
        fclose(fout);
        unzCloseCurrentFile(uzf);
    }
    return true;
}

bool LocalZip::Unzip(std::string &traceFile)
{
    if (!IsFileExist() || !IsZipFile() || !CreateDir(tmpDir_, true)) {
        return false;
    }
    // 打开zip文件
    unzFile uzf = unzOpen(filePath_.c_str());
    if (uzf == nullptr) {
        TS_LOGE("unzOpen error.");
        return false;
    }
    // 获取zip文件信息
    unz_global_info ugi;
    if (unzGetGlobalInfo(uzf, &ugi) != UNZ_OK) {
        TS_LOGE("unzGetGlobalInfo error.");
        return false;
    }
    for (int i = 0; i < ugi.number_entry; i++) {
        char filenameInZip[256];
        unz_file_info file_info;
        if (unzGetCurrentFileInfo(uzf, &file_info, filenameInZip, sizeof(filenameInZip), NULL, 0, NULL, 0) != UNZ_OK) {
            TS_LOGE("unzGetCurrentFileInfo error.");
            break;
        }
#ifdef _WIN32
        auto fileName = std::filesystem::path(tmpDir_).append(String2WString(filenameInZip));
#else
        std::string tempFileName = filenameInZip;
        if (base::GetCoding(reinterpret_cast<const uint8_t *>(tempFileName.c_str()), tempFileName.length()) !=
            base::CODING::UTF8) {
            tempFileName =
                "temp_" + std::to_string(i) + ((tempFileName.back() == '/' || tempFileName.back() == '\\') ? "/" : "");
        }
        auto fileName = std::filesystem::path(tmpDir_).append(tempFileName);
#endif
        // 是目录，则创建目录; 是文件，打开 -> 读取 -> 写入解压文件 -> 关闭
        auto isDir = fileName.string().back() == '/' || fileName.string().back() == '\\';
        if (!(isDir ? CreateDir(fileName) : WriteFile(uzf, fileName))) {
            break;
        }
        // uzf迭代
        if ((i + 1) < ugi.number_entry) {
            if (unzGoToNextFile(uzf) != UNZ_OK) {
                TS_LOGE("unzGoToNextFile error.");
                break;
            }
        }
    }
    unzClose(uzf);
    auto files = GetFilesNameFromDir(tmpDir_, false);
    if (files.size() == 1) {
        traceFile = files[0];
#ifdef _WIN32
        traceFile = Utf8ToGbk(traceFile.c_str());
#endif
        return true;
    }
    return false;
}

bool LocalZip::Unzlib(std::string &traceFile)
{
    if (!IsFileExist() || !IsZlibFile() || !CreateDir(tmpDir_, true)) {
        return false;
    }
    std::ifstream srcFile(filePath_, std::ios::binary);
    TS_CHECK_TRUE(srcFile.is_open(), false, "Failed to open source file: %s.", filePath_.c_str());
    auto writeFilePath = std::filesystem::path(tmpDir_).append("unzlib_file.txt");
    std::ofstream destFile(writeFilePath.string(), std::ios::binary);
    TS_CHECK_TRUE(destFile.is_open(), false, "Failed to open destination file: %s.", writeFilePath.string().c_str());
    if (!WriteFile(srcFile, destFile)) {
        return false;
    }
    traceFile = writeFilePath.string();
    return true;
}

bool LocalZip::WriteFile(std::ifstream &srcFile, std::ofstream &destFile)
{
    auto strmDeleterFunc = [](z_stream *strmPtr) {
        if (strmPtr) {
            if (inflateEnd(strmPtr) != Z_OK) {
                TS_LOGE("Error inflateEnd!");
            }
            delete strmPtr;
            strmPtr = nullptr;
        }
    };
    std::unique_ptr<z_stream, decltype(strmDeleterFunc)> strmPtr(new z_stream, strmDeleterFunc);
    TS_CHECK_TRUE(strmPtr != nullptr, false, "Error construct strmPtr!");
    strmPtr->zalloc = Z_NULL;
    strmPtr->zfree = Z_NULL;
    strmPtr->opaque = Z_NULL;
    TS_CHECK_TRUE(inflateInit(strmPtr.get()) == Z_OK, false, "inflateInit failed.");

    unsigned char inputBuf[ZLIB_CHUNK_SIZE];
    unsigned char outBuf[ZLIB_CHUNK_SIZE];
    int flushFlag = Z_NO_FLUSH;
    do {
        srcFile.read(reinterpret_cast<char *>(inputBuf), ZLIB_CHUNK_SIZE);
        TS_CHECK_TRUE(!srcFile.bad(), false, "Error reading source file!");
        strmPtr->avail_in = srcFile.gcount();
        flushFlag = srcFile.eof() ? Z_FINISH : Z_NO_FLUSH;
        strmPtr->next_in = inputBuf;
        do {
            strmPtr->avail_out = ZLIB_CHUNK_SIZE;
            strmPtr->next_out = outBuf;
            auto ret = inflate(strmPtr.get(), flushFlag);
            // Z_BUF_ERROR means that there is still data that needs to be unziped
            TS_CHECK_TRUE(ret >= Z_OK || ret == Z_BUF_ERROR, false, "Error inflate: %d!", ret);
            size_t haveUnzlibSize = ZLIB_CHUNK_SIZE - strmPtr->avail_out;
            destFile.write(reinterpret_cast<char *>(outBuf), haveUnzlibSize);
            TS_CHECK_TRUE(!destFile.bad(), false, "DestFile error write!");
        } while (strmPtr->avail_out == 0);
    } while (flushFlag != Z_FINISH);
    return true;
}
} // namespace base
} // namespace SysTuning
