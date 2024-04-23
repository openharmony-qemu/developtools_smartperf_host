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

#include <fcntl.h>
#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <iostream>
#include <string>
#include <unistd.h>

#include "ptreader_parser.h"
#include "file.h"
#include "pbreader_parser.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
constexpr size_t G_FILE_PERMISSION = 664;
const uint32_t PROFILE_HEADER = 1024;
constexpr size_t READ_SIZE = 1024;

class SplitFileDataTest : public testing::Test {
protected:
    static void SetUpTestCase() {}
    static void TearDownTestCase() {}

    void ParseData(std::unique_ptr<TraceStreamerSelector> &ta, const std::string path)
    {
        ta->EnableMetaTable(false);

        size_t readSize = 0;
        int32_t fd(base::OpenFile(path, O_RDONLY, G_FILE_PERMISSION));
        while (true) {
            std::unique_ptr<uint8_t[]> buf = std::make_unique<uint8_t[]>(READ_SIZE);
            auto rsize = base::Read(fd, buf.get(), READ_SIZE);
            if (rsize == 0) {
                break;
            }
            if (rsize < 0) {
                TS_LOGD("Reading trace file over (errno: %d, %s)", errno, strerror(errno));
                break;
            }
            if (!ta->ParseTraceDataSegment(std::move(buf), rsize, 1, 1)) {
                break;
            };

            dataBuf_ = std::make_unique<uint8_t[]>(readSize + rsize);
            memcpy_s(dataBuf_.get() + readSize, rsize, buf.get(), rsize);
            readSize += rsize;
        }

        ta->WaitForParserEnd();
        close(fd);
    }

    bool CheckData(std::unique_ptr<TraceStreamerSelector> &ta, const std::string path)
    {
        std::ifstream inputFile(path, std::ios::binary);
        if (!inputFile.is_open()) {
            std::cerr << "Failed to open file: " << path << std::endl;
            return false;
        }

        auto splitResult = ta->GetPbreaderParser()->GetEbpfDataParser()->GetEbpfSplitResult();
        uint64_t headDataSize = 0;
        for (const auto &itemHtrace : ta->GetPbreaderParser()->GetPbreaderSplitData()) {
            headDataSize += itemHtrace.second;
        }
        auto profilerHeader = ta->GetPbreaderParser()->GetProfilerHeader();
        profilerHeader.data.length = PROFILE_HEADER + headDataSize;
        std::string bufferData(reinterpret_cast<char *>(&profilerHeader), sizeof(profilerHeader));
        uint64_t dataSize = 0;
        for (auto it = splitResult.begin(); it != splitResult.end(); ++it) {
            if (it->type == (int32_t)SplitDataDataType::SPLIT_FILE_JSON) {
                dataSize += it->originSeg.size;
            }
        }
        auto combinedBuf = std::make_unique<uint8_t[]>(dataSize + PROFILE_HEADER + headDataSize);
        std::copy(bufferData.begin(), bufferData.end(), combinedBuf.get());
        std::streamsize currentOffset = PROFILE_HEADER;
        for (const auto &itemHtrace : ta->GetPbreaderParser()->GetPbreaderSplitData()) {
            inputFile.seekg(itemHtrace.first);
            inputFile.read(reinterpret_cast<char *>(combinedBuf.get()) + currentOffset, itemHtrace.second);
            currentOffset += itemHtrace.second;
        }
        for (auto it = splitResult.begin(); it != splitResult.end(); ++it) {
            if (it->type == (int32_t)SplitDataDataType::SPLIT_FILE_JSON) {
                inputFile.seekg(it->originSeg.offset);
                inputFile.read(reinterpret_cast<char *>(combinedBuf.get()) + currentOffset, it->originSeg.size);
                currentOffset += it->originSeg.size;
            }
            if (!inputFile) {
                std::cerr << "Error reading from file." << std::endl;
                return false;
            }
        }
        std::unique_ptr<TraceStreamerSelector> ts = std::make_unique<TraceStreamerSelector>();
        bool ret = ts->ParseTraceDataSegment(std::move(combinedBuf), dataSize + PROFILE_HEADER + headDataSize, 1, 1);
        return ret;
    }

public:
    std::unique_ptr<uint8_t[]> dataBuf_;
};

/**
 * @tc.name: SplitFileDataByHtraceTest
 * @tc.desc: Test htrace parsing binary file export database
 * @tc.type: FUNC
 */
HWTEST_F(SplitFileDataTest, SplitFileDataByHtraceTest, TestSize.Level1)
{
    TS_LOGI("test43-1");
    const std::string tracePath = "../../test/resource/hiprofiler_data_ability.htrace";
    if (access(tracePath.c_str(), F_OK) == 0) {
        auto ta = std::make_unique<TraceStreamerSelector>();
        ta->minTs_ = 1502026311556913964;
        ta->maxTs_ = 1502026330073755298;
        ParseData(ta, tracePath);

        std::ifstream inputFile(tracePath, std::ios::binary);
        if (!inputFile.is_open()) {
            std::cerr << "Failed to open file: " << tracePath << std::endl;
            EXPECT_TRUE(false);
        }
        uint64_t dataSize = 0;
        auto profilerHeader = ta->GetPbreaderParser()->GetProfilerHeader();

        for (const auto &itemHtrace : ta->GetPbreaderParser()->GetPbreaderSplitData()) {
            dataSize += itemHtrace.second;
        }
        profilerHeader.data.length = PROFILE_HEADER + dataSize;
        std::string buffer(reinterpret_cast<char *>(&profilerHeader), sizeof(profilerHeader));
        std::unique_ptr<uint8_t[]> combinedBuf = std::make_unique<uint8_t[]>(dataSize + PROFILE_HEADER);
        std::copy(buffer.begin(), buffer.end(), combinedBuf.get());
        std::streamsize currentOffset = PROFILE_HEADER;
        for (const auto &itemHtrace : ta->GetPbreaderParser()->GetPbreaderSplitData()) {
            inputFile.seekg(itemHtrace.first);
            inputFile.read(reinterpret_cast<char *>(combinedBuf.get()) + currentOffset, itemHtrace.second);
            currentOffset += itemHtrace.second;
            if (!inputFile) {
                std::cerr << "Error reading from file." << std::endl;
                EXPECT_TRUE(false);
            }
        }
        std::unique_ptr<TraceStreamerSelector> ts = std::make_unique<TraceStreamerSelector>();
        EXPECT_TRUE(ts->ParseTraceDataSegment(std::move(combinedBuf), dataSize + PROFILE_HEADER, 1, 1));
    } else {
        EXPECT_TRUE(false);
    }
}

/**
 * @tc.name: SplitFileDataByHtraceTest
 * @tc.desc: Test htrace parsing binary file export database
 * @tc.type: FUNC
 */
HWTEST_F(SplitFileDataTest, SplitFileDataBySystraceTest, TestSize.Level1)
{
    TS_LOGI("test43-2");
    const std::string tracePath = "../../test/resource/trace_small_10.systrace";
    if (access(tracePath.c_str(), F_OK) == 0) {
        auto ta = std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
        ta->minTs_ = 88029692887000;
        ta->maxTs_ = 88032820831000;
        ParseData(ta, tracePath);

        std::unique_ptr<TraceStreamerSelector> ts = std::make_unique<TraceStreamerSelector>();
        EXPECT_TRUE(ts->ParseTraceDataSegment(std::move(dataBuf_),
                                              ta->GetPtreaderParser()->GetPtreaderSplitData().size(), 1, 1));
    } else {
        EXPECT_TRUE(false);
    }
}

/**
 * @tc.name: SplitFileDataByHtraceTest
 * @tc.desc: Test htrace parsing binary file export database
 * @tc.type: FUNC
 */
HWTEST_F(SplitFileDataTest, SplitFileDataByEbpfTest, TestSize.Level1)
{
    TS_LOGI("test43-3");
    const std::string tracePath = "../../test/resource/ebpf_bio.htrace";
    if (access(tracePath.c_str(), F_OK) == 0) {
        auto ta = std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
        ta->minTs_ = 800423789228;
        ta->maxTs_ = 810586732842;
        ParseData(ta, tracePath);
        EXPECT_TRUE(CheckData(ta, tracePath));
    } else {
        EXPECT_TRUE(false);
    }
}

/**
 * @tc.name: SplitFileDataByNativehookTest
 * @tc.desc: Test htrace parsing binary file export database
 * @tc.type: FUNC
 */
HWTEST_F(SplitFileDataTest, SplitFileDataByNativehookTest, TestSize.Level1)
{
    TS_LOGI("test43-4");
    const std::string tracePath = "../../test/resource/Mmap.htrace";
    ASSERT_EQ(access(tracePath.c_str(), F_OK), 0);

    auto ta = std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
    ta->minTs_ = 1502031384794922107;
    ta->maxTs_ = 1502031423412858932;
    ParseData(ta, tracePath);
    EXPECT_TRUE(CheckData(ta, tracePath));
}

/**
 * @tc.name: SplitFileDataByPerfTest
 * @tc.desc: Test htrace parsing binary file export database
 * @tc.type: FUNC
 */
HWTEST_F(SplitFileDataTest, SplitFileDataByPerfTest, TestSize.Level1)
{
    TS_LOGI("test43-5");
    const std::string tracePath = "../../test/resource/hiprofiler_data_perf.htrace";
    ASSERT_EQ(access(tracePath.c_str(), F_OK), 0);

    auto ta = std::make_unique<SysTuning::TraceStreamer::TraceStreamerSelector>();
    ta->minTs_ = 30389799963682;
    ta->maxTs_ = 30408971157414;
    ParseData(ta, tracePath);
    EXPECT_TRUE(CheckData(ta, tracePath));
}

} // namespace TraceStreamer
} // namespace SysTuning
