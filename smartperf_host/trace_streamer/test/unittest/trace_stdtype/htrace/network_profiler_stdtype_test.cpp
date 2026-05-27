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

#include "network_profiler_stdtype.h"

using namespace testing::ext;
namespace SysTuning {
namespace TraceStdtype {

class NetworkProfilerStdtypeTest : public ::testing::Test {
public:
    void SetUp() {}
    void TearDown() {}
};

HWTEST_F(NetworkProfilerStdtypeTest, AppendTimeInformation, TestSize.Level1)
{
    TS_LOGI("test NetworkTimeInformationData AppendNewData");
    NetworkTimeInformationData timeData;
    NetworkTimeInformationRow row;
    row.ipid = 100;
    row.itid = 200;
    row.beginTime = 1000;
    row.dnsEndTime = 1100;
    row.tcpConnectEndTime = 1200;
    row.tlsHandshakeEndTime = 1300;
    row.firstSendTime = 1400;
    row.firstRecvTime = 1500;
    row.endTime = 1600;
    row.cacheHit = 1;

    size_t index = timeData.AppendNewData(row);
    EXPECT_EQ(index, static_cast<size_t>(0));
    EXPECT_EQ(timeData.Size(), static_cast<size_t>(1));

    EXPECT_EQ(timeData.Ipids().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.Ipids()[0], static_cast<InternalPid>(100));
    EXPECT_EQ(timeData.Itids().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.Itids()[0], static_cast<InternalTid>(200));
    EXPECT_EQ(timeData.BeginTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.BeginTimes()[0], static_cast<uint64_t>(1000));
    EXPECT_EQ(timeData.DnsEndTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.DnsEndTimes()[0], static_cast<uint64_t>(1100));
    EXPECT_EQ(timeData.TcpConnectEndTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.TcpConnectEndTimes()[0], static_cast<uint64_t>(1200));
    EXPECT_EQ(timeData.TlsHandshakeEndTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.TlsHandshakeEndTimes()[0], static_cast<uint64_t>(1300));
    EXPECT_EQ(timeData.FirstSendTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.FirstSendTimes()[0], static_cast<uint64_t>(1400));
    EXPECT_EQ(timeData.FirstRecvTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.FirstRecvTimes()[0], static_cast<uint64_t>(1500));
    EXPECT_EQ(timeData.EndTimes().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.EndTimes()[0], static_cast<uint64_t>(1600));
    EXPECT_EQ(timeData.CacheHits().size(), static_cast<size_t>(1));
    EXPECT_EQ(timeData.CacheHits()[0], static_cast<uint8_t>(1));
}

HWTEST_F(NetworkProfilerStdtypeTest, AppendInformation, TestSize.Level1)
{
    TS_LOGI("test NetworkInformationData AppendNewData");
    NetworkInformationData infoData;
    NetworkInformationRow row;
    row.requestId = "req-001";
    row.protocol = "HTTP/1.1";
    row.domain = "example.com";
    row.requestUri = "/api/test";
    row.requestMethod = "GET";
    row.requestHeader = "Content-Type: application/json";
    row.responseHeader = "Content-Type: application/json";
    row.responseEffectiveUrl = "https://example.com/api/test";
    row.ipAddress = "192.168.1.1";
    row.httpVersion = "HTTP/1.1";
    row.responseReasonPhrase = "OK";
    row.responseStatusCode = 200;

    size_t index = infoData.AppendNewData(row);
    EXPECT_EQ(index, static_cast<size_t>(0));
    EXPECT_EQ(infoData.Size(), static_cast<size_t>(1));

    EXPECT_EQ(infoData.RequestIds().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.RequestIds()[0], "req-001");
    EXPECT_EQ(infoData.Protocols().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.Protocols()[0], "HTTP/1.1");
    EXPECT_EQ(infoData.Domains().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.Domains()[0], "example.com");
    EXPECT_EQ(infoData.RequestUris().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.RequestUris()[0], "/api/test");
    EXPECT_EQ(infoData.RequestMethods().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.RequestMethods()[0], "GET");
    EXPECT_EQ(infoData.RequestHeaders().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.RequestHeaders()[0], "Content-Type: application/json");
    EXPECT_EQ(infoData.ResponseHeaders().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.ResponseHeaders()[0], "Content-Type: application/json");
    EXPECT_EQ(infoData.ResponseEffectiveUrls().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.ResponseEffectiveUrls()[0], "https://example.com/api/test");
    EXPECT_EQ(infoData.IpAddresses().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.IpAddresses()[0], "192.168.1.1");
    EXPECT_EQ(infoData.HttpVersions().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.HttpVersions()[0], "HTTP/1.1");
    EXPECT_EQ(infoData.ResponseReasonPhrases().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.ResponseReasonPhrases()[0], "OK");
    EXPECT_EQ(infoData.ResponseStatusCodes().size(), static_cast<size_t>(1));
    EXPECT_EQ(infoData.ResponseStatusCodes()[0], static_cast<uint32_t>(200));
}

HWTEST_F(NetworkProfilerStdtypeTest, ClearTimeInformation, TestSize.Level1)
{
    TS_LOGI("test NetworkTimeInformationData Clear");
    NetworkTimeInformationData timeData;
    NetworkTimeInformationRow row;
    row.ipid = 100;
    row.itid = 200;
    row.beginTime = 1000;

    timeData.AppendNewData(row);
    EXPECT_EQ(timeData.Size(), static_cast<size_t>(1));

    timeData.Clear();
    EXPECT_EQ(timeData.Size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.Ipids().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.Itids().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.BeginTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.DnsEndTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.TcpConnectEndTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.TlsHandshakeEndTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.FirstSendTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.FirstRecvTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.EndTimes().size(), static_cast<size_t>(0));
    EXPECT_EQ(timeData.CacheHits().size(), static_cast<size_t>(0));
}

HWTEST_F(NetworkProfilerStdtypeTest, ClearInformation, TestSize.Level1)
{
    TS_LOGI("test NetworkInformationData Clear");
    NetworkInformationData infoData;
    NetworkInformationRow row;
    row.requestId = "req-001";
    row.protocol = "HTTP/1.1";

    infoData.AppendNewData(row);
    EXPECT_EQ(infoData.Size(), static_cast<size_t>(1));

    infoData.Clear();
    EXPECT_EQ(infoData.Size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.RequestIds().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.Protocols().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.Domains().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.RequestUris().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.RequestMethods().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.RequestHeaders().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.ResponseHeaders().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.ResponseEffectiveUrls().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.IpAddresses().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.HttpVersions().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.ResponseReasonPhrases().size(), static_cast<size_t>(0));
    EXPECT_EQ(infoData.ResponseStatusCodes().size(), static_cast<size_t>(0));
}

} // namespace TraceStdtype
} // namespace SysTuning