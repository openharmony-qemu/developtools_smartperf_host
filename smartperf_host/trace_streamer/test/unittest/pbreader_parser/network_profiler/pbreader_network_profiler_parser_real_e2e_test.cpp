/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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
#include <string>

#define private public
#include "export_test.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace {
const std::string REAL_TRACE_FILE = "../../test/resource/network_profiler.htrace";
}

class RealNetworkProfilerE2ETest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }

    void TearDown() override {}

protected:
    TraceStreamerSelector stream_;
};

HWTEST_F(RealNetworkProfilerE2ETest, ParseRealHtraceFile, TestSize.Level1)
{
    TS_LOGI("test-real-e2e-1");

    EXPECT_TRUE(ParseTraceFile(stream_, REAL_TRACE_FILE));

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Size(), 3);

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->Size(), 3);

    EXPECT_EQ(infoData->RequestIds()[0], "req-001");
    EXPECT_EQ(infoData->RequestMethods()[0], "GET");
    EXPECT_EQ(infoData->ResponseStatusCodes()[0], 200);

    EXPECT_EQ(infoData->RequestIds()[1], "req-002");
    EXPECT_EQ(infoData->RequestMethods()[1], "POST");
    EXPECT_EQ(infoData->ResponseStatusCodes()[1], 201);

    EXPECT_EQ(infoData->RequestIds()[2], "req-003");
    EXPECT_EQ(infoData->RequestMethods()[2], "GET");
    EXPECT_EQ(infoData->ResponseStatusCodes()[2], 200);
}

HWTEST_F(RealNetworkProfilerE2ETest, QueryDataFromDatabase, TestSize.Level1)
{
    TS_LOGI("test-real-e2e-2");

    EXPECT_TRUE(ParseTraceFile(stream_, REAL_TRACE_FILE));

    std::string sqlCountTime = "SELECT COUNT(*) FROM network_time_information";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlCountTime, false), 1);

    std::string sqlCountInfo = "SELECT COUNT(*) FROM network_information";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlCountInfo, false), 1);

    std::string sqlFirst = "SELECT request_id, request_method, response_status_code "
                           "FROM network_information WHERE id=1";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlFirst, false), 1);

    std::string sqlSecond = "SELECT request_id, request_method, response_status_code "
                            "FROM network_information WHERE id=2";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlSecond, false), 1);
}

HWTEST_F(RealNetworkProfilerE2ETest, VerifyRequestMethodAndUrl, TestSize.Level1)
{
    TS_LOGI("test-real-e2e-3");

    EXPECT_TRUE(ParseTraceFile(stream_, REAL_TRACE_FILE));

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    ASSERT_EQ(infoData->Size(), 3);

    EXPECT_EQ(infoData->Domains()[0], "api.example.com");
    EXPECT_EQ(infoData->RequestUris()[0], "/data");

    EXPECT_EQ(infoData->Domains()[1], "api.example.com");
    EXPECT_EQ(infoData->RequestUris()[1], "/upload");

    EXPECT_EQ(infoData->Domains()[2], "cdn.example.com");
    EXPECT_EQ(infoData->RequestUris()[2], "/image.png");
}

HWTEST_F(RealNetworkProfilerE2ETest, VerifyTimeInformation, TestSize.Level1)
{
    TS_LOGI("test-real-e2e-4");

    EXPECT_TRUE(ParseTraceFile(stream_, REAL_TRACE_FILE));

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    ASSERT_EQ(timeData->Size(), 3);

    for (size_t i = 0; i < 3; i++) {
        EXPECT_GT(timeData->BeginTimes()[i], 0);
        EXPECT_GT(timeData->EndTimes()[i], 0);
        EXPECT_GE(timeData->EndTimes()[i], timeData->BeginTimes()[i]);
    }
}