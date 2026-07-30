/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2024. All rights reserved.
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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#include "export_test.h"
#include "file.h"
#include "log.h"

using namespace testing::ext;

namespace SysTuning {
namespace TraceStreamer {
namespace FileDataUnitTest {
class FileTest : public ::testing::Test {
public:
    void SetUp() {}
    void TearDown() {}

public:
    const std::string zlibPath_ = "../../test/resource/zlib.htrace";
    const std::string zipPath_ = "../../test/resource/htrace.zip";
    const std::string tempPath_ = "../../test/resource/ts_tmp";
};

HWTEST_F(FileTest, UnZlibFile, TestSize.Level1)
{
    TS_LOGE("test46-1");
    std::string zlibFile("invalidpath");
    std::string traceFile;
    auto ret = base::UnZlibFile(zlibFile, traceFile);
    EXPECT_FALSE(ret);
    ret = base::UnZlibFile(zlibPath_, traceFile);
    EXPECT_TRUE(ret);
    RemoveDirectory(tempPath_);
}

HWTEST_F(FileTest, UnZipFile, TestSize.Level1)
{
    TS_LOGE("test46-2");
    std::string zipFile("invalidpath");
    std::string traceFile;
    auto ret = base::UnZipFile(zipFile, traceFile);
    EXPECT_FALSE(ret);
    ret = base::UnZipFile(zipPath_, traceFile);
    EXPECT_TRUE(ret);
    RemoveDirectory(tempPath_);
}

HWTEST_F(FileTest, UnZipFileMulti, TestSize.Level1)
{
    TS_LOGE("test_UnZipFileMulti");
    std::string multiZipPath_ = "../../test/resource/multi_file.zip";
    std::string traceFile;
    auto ret = base::UnZipFile(multiZipPath_, traceFile);
    EXPECT_TRUE(ret);
    EXPECT_TRUE(base::IsHtraceFile(traceFile));
    RemoveDirectory(tempPath_);
}

HWTEST_F(FileTest, IsHtraceFile, TestSize.Level1)
{
    TS_LOGE("test_IsHtraceFile");
    EXPECT_FALSE(base::IsHtraceFile("invalidpath"));
    EXPECT_FALSE(base::IsHtraceFile("../../test/resource/ut_bytrace_input_full.txt"));
    EXPECT_TRUE(base::IsHtraceFile("../../test/resource/pbreader_ffrt.htrace"));
}
} // namespace FileDataUnitTest
} // namespace TraceStreamer
} // namespace SysTuning
