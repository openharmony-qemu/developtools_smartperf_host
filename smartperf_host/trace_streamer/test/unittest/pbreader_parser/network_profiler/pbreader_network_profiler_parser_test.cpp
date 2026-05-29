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
#include <cstdint>
#include <cstring>
#include <vector>

#define PRIVATE public
#include "base/log.h"
#include "filter/process_filter.h"
#include "parser/pbreader_parser/network_profiler_parser/pbreader_network_profiler_parser.h"
#include "parser/pbreader_parser/network_profiler_parser/tlv_parser.h"
#include "trace_streamer_selector.h"
#include "network_profiler.pb.h"
#include "network_profiler.pbreader.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace NetworkProfilerParserTest {

class NetworkProfilerParserTestSuite : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }
    void TearDown() override {}

protected:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlFullUrl, TestSize.Level1)
{
    TS_LOGI("test20-1");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string fullUrl = "https://example.com/api/test";
    UrlParts urlParts = parser.ParseUrl(fullUrl);

    EXPECT_EQ(urlParts.protocol, "https");
    EXPECT_EQ(urlParts.domain, "example.com");
    EXPECT_EQ(urlParts.requestUri, "/api/test");
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlWithoutPath, TestSize.Level1)
{
    TS_LOGI("test20-2");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string urlWithoutPath = "https://example.com";
    UrlParts urlParts = parser.ParseUrl(urlWithoutPath);

    EXPECT_EQ(urlParts.protocol, "https");
    EXPECT_EQ(urlParts.domain, "example.com");
    EXPECT_EQ(urlParts.requestUri, "");
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlWithoutProtocol, TestSize.Level1)
{
    TS_LOGI("test20-3");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string urlWithoutProtocol = "example.com/api";
    UrlParts urlParts = parser.ParseUrl(urlWithoutProtocol);

    EXPECT_EQ(urlParts.protocol, "");
    EXPECT_EQ(urlParts.domain, "");
    EXPECT_EQ(urlParts.requestUri, "example.com/api");
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlEmpty, TestSize.Level1)
{
    TS_LOGI("test20-4");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string emptyUrl = "";
    UrlParts urlParts = parser.ParseUrl(emptyUrl);

    EXPECT_EQ(urlParts.protocol, "");
    EXPECT_EQ(urlParts.domain, "");
    EXPECT_EQ(urlParts.requestUri, "");
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlWithQuery, TestSize.Level1)
{
    TS_LOGI("test20-5");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string urlWithQuery = "https://example.com/api/test?key=value&foo=bar";
    UrlParts urlParts = parser.ParseUrl(urlWithQuery);

    EXPECT_EQ(urlParts.protocol, "https");
    EXPECT_EQ(urlParts.domain, "example.com");
    EXPECT_EQ(urlParts.requestUri, "/api/test?key=value&foo=bar");
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlHttpProtocol, TestSize.Level1)
{
    TS_LOGI("test20-6");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string httpUrl = "http://localhost:8080/resource";
    UrlParts urlParts = parser.ParseUrl(httpUrl);

    EXPECT_EQ(urlParts.protocol, "http");
    EXPECT_EQ(urlParts.domain, "localhost:8080");
    EXPECT_EQ(urlParts.requestUri, "/resource");
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitAllZeros, TestSize.Level1)
{
    TS_LOGI("test20-7");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(1));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithNonZero, TestSize.Level1)
{
    TS_LOGI("test20-8");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithEndTime, TestSize.Level1)
{
    TS_LOGI("test20-9");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 5000;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithDnsTime, TestSize.Level1)
{
    TS_LOGI("test20-10");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 2000;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithTcpConnectTime, TestSize.Level1)
{
    TS_LOGI("test20-11");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 3000;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithTlsHandshakeTime, TestSize.Level1)
{
    TS_LOGI("test20-12");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 4000;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithFirstSendTime, TestSize.Level1)
{
    TS_LOGI("test20-13");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 5000;
    result.firstRecvTime = 0;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithFirstRecvTime, TestSize.Level1)
{
    TS_LOGI("test20-14");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 6000;
    result.endTime = 0;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, StoreTimeInformation, TestSize.Level1)
{
    TS_LOGI("test20-15");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.dnsEndTime = 2000;
    result.tcpConnectEndTime = 3000;
    result.tlsHandshakeEndTime = 4000;
    result.firstSendTime = 5000;
    result.firstRecvTime = 6000;
    result.endTime = 7000;

    uint32_t pid = 1234;
    uint32_t tid = 5678;

    parser.StoreTimeInformation(result, pid, tid);

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
    EXPECT_EQ(timeInfoData->BeginTimes()[0], 1000);
    EXPECT_EQ(timeInfoData->DnsEndTimes()[0], 2000);
    EXPECT_EQ(timeInfoData->TcpConnectEndTimes()[0], 3000);
    EXPECT_EQ(timeInfoData->TlsHandshakeEndTimes()[0], 4000);
    EXPECT_EQ(timeInfoData->FirstSendTimes()[0], 5000);
    EXPECT_EQ(timeInfoData->FirstRecvTimes()[0], 6000);
    EXPECT_EQ(timeInfoData->EndTimes()[0], 7000);
    EXPECT_EQ(timeInfoData->CacheHits()[0], 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, StoreInformation, TestSize.Level1)
{
    TS_LOGI("test20-16");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.requestId = "req123";
    result.requestMethod = "GET";
    result.requestHeader = "Content-Type: application/json";
    result.responseStatusCode = 200;
    result.responseHeader = "X-Custom-Header: value";
    result.responseEffectiveUrl = "https://redirect.com";
    result.ipAddress = "192.168.1.1";
    result.httpVersion = "HTTP/1.1";
    result.responseReasonPhrase = "OK";

    UrlParts urlParts;
    urlParts.protocol = "https";
    urlParts.domain = "example.com";
    urlParts.requestUri = "/api/test";

    parser.StoreInformation(result, urlParts);

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->Size(), 1);
    EXPECT_EQ(infoData->RequestIds()[0], "req123");
    EXPECT_EQ(infoData->Protocols()[0], "https");
    EXPECT_EQ(infoData->Domains()[0], "example.com");
    EXPECT_EQ(infoData->RequestUris()[0], "/api/test");
    EXPECT_EQ(infoData->RequestMethods()[0], "GET");
    EXPECT_EQ(infoData->RequestHeaders()[0], "Content-Type: application/json");
    EXPECT_EQ(infoData->ResponseStatusCodes()[0], 200);
    EXPECT_EQ(infoData->ResponseHeaders()[0], "X-Custom-Header: value");
    EXPECT_EQ(infoData->ResponseEffectiveUrls()[0], "https://redirect.com");
    EXPECT_EQ(infoData->IpAddresses()[0], "192.168.1.1");
    EXPECT_EQ(infoData->HttpVersions()[0], "HTTP/1.1");
    EXPECT_EQ(infoData->ResponseReasonPhrases()[0], "OK");
}

HWTEST_F(NetworkProfilerParserTestSuite, FinishMethod, TestSize.Level1)
{
    TS_LOGI("test20-17");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.endTime = 7000;

    parser.StoreTimeInformation(result, 1234, 5678);
    parser.Finish();

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, StoreTimeInformationWithCacheHit, TestSize.Level1)
{
    TS_LOGI("test20-18");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 0;
    result.dnsEndTime = 0;
    result.tcpConnectEndTime = 0;
    result.tlsHandshakeEndTime = 0;
    result.firstSendTime = 0;
    result.firstRecvTime = 0;
    result.endTime = 0;

    parser.StoreTimeInformation(result, 1234, 5678);

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
    EXPECT_EQ(timeInfoData->CacheHits()[0], 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, MultipleStoreTimeInformation, TestSize.Level1)
{
    TS_LOGI("test20-19");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result1;
    result1.beginTime = 1000;
    result1.endTime = 7000;

    TlvResult result2;
    result2.beginTime = 2000;
    result2.endTime = 8000;

    parser.StoreTimeInformation(result1, 1000, 2000);
    parser.StoreTimeInformation(result2, 3000, 4000);

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 2);
    EXPECT_EQ(timeInfoData->BeginTimes()[0], 1000);
    EXPECT_EQ(timeInfoData->BeginTimes()[1], 2000);
}

HWTEST_F(NetworkProfilerParserTestSuite, StoreTimeInformationWithExistingProcess, TestSize.Level1)
{
    TS_LOGI("test20-20");
    stream_.streamFilters_->processFilter_->UpdateOrCreateProcessWithName(1234, "test_process");

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.endTime = 7000;

    parser.StoreTimeInformation(result, 1234, 5678);

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseUrlWithPort, TestSize.Level1)
{
    TS_LOGI("test20-21");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    std::string urlWithPort = "https://example.com:8443/api/test";
    UrlParts urlParts = parser.ParseUrl(urlWithPort);

    EXPECT_EQ(urlParts.protocol, "https");
    EXPECT_EQ(urlParts.domain, "example.com:8443");
    EXPECT_EQ(urlParts.requestUri, "/api/test");
}

HWTEST_F(NetworkProfilerParserTestSuite, MultipleStoreInformation, TestSize.Level1)
{
    TS_LOGI("test20-22");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result1;
    result1.requestId = "req1";
    result1.requestMethod = "GET";
    result1.responseStatusCode = 200;

    TlvResult result2;
    result2.requestId = "req2";
    result2.requestMethod = "POST";
    result2.responseStatusCode = 404;

    UrlParts urlParts1;
    urlParts1.protocol = "https";
    urlParts1.domain = "example1.com";
    urlParts1.requestUri = "/api1";

    UrlParts urlParts2;
    urlParts2.protocol = "http";
    urlParts2.domain = "example2.com";
    urlParts2.requestUri = "/api2";

    parser.StoreInformation(result1, urlParts1);
    parser.StoreInformation(result2, urlParts2);

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->Size(), 2);
    EXPECT_EQ(infoData->RequestIds()[0], "req1");
    EXPECT_EQ(infoData->RequestIds()[1], "req2");
    EXPECT_EQ(infoData->Protocols()[0], "https");
    EXPECT_EQ(infoData->Protocols()[1], "http");
    EXPECT_EQ(infoData->RequestMethods()[0], "GET");
    EXPECT_EQ(infoData->RequestMethods()[1], "POST");
    EXPECT_EQ(infoData->ResponseStatusCodes()[0], 200);
    EXPECT_EQ(infoData->ResponseStatusCodes()[1], 404);
}

HWTEST_F(NetworkProfilerParserTestSuite, CalculateCacheHitWithAllNonZero, TestSize.Level1)
{
    TS_LOGI("test20-23");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.dnsEndTime = 2000;
    result.tcpConnectEndTime = 3000;
    result.tlsHandshakeEndTime = 4000;
    result.firstSendTime = 5000;
    result.firstRecvTime = 6000;
    result.endTime = 7000;

    uint8_t cacheHit = parser.CalculateCacheHit(result);
    EXPECT_EQ(cacheHit, static_cast<uint8_t>(0));
}

HWTEST_F(NetworkProfilerParserTestSuite, DestructorTest, TestSize.Level1)
{
    TS_LOGI("test20-24");
    PbreaderNetworkProfilerParser *parser = new PbreaderNetworkProfilerParser(stream_.GetTraceDataCache(),
                                                                              stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.endTime = 7000;
    parser->StoreTimeInformation(result, 1234, 5678);
    parser->Finish();

    delete parser;

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseMethodIntegrationTest, TestSize.Level1)
{
    TS_LOGI("test20-25");
    NetworkProfilerResult profilerResult;
    auto event = profilerResult.add_network_event();
    event->set_pid(1234);
    event->set_tid(5678);
    event->set_tv_sec(1000);
    event->set_tv_nsec(500000000);

    std::vector<uint8_t> tlvPayload;
    auto appendTlvUint64 = [&tlvPayload](uint32_t tag, uint64_t val) mutable {
        tlvPayload.push_back(static_cast<uint8_t>(tag));
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(TLV_UINT64_LENGTH);
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        for (int i = 0; i < TLV_UINT64_LENGTH; i++) {
            tlvPayload.push_back(static_cast<uint8_t>(val >> (i * BYTE_SHIFT_8)));
        }
    };
    auto appendTlvString = [&tlvPayload](uint32_t tag, const std::string &s) {
        tlvPayload.push_back(static_cast<uint8_t>(tag));
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(static_cast<uint8_t>(s.size()));
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        tlvPayload.push_back(0);
        for (char c : s) {
            tlvPayload.push_back(static_cast<uint8_t>(c));
        }
    };

    appendTlvUint64(1, 1000000);
    appendTlvUint64(7, 2000000);
    appendTlvString(8, "req-test-001");

    event->set_payload(reinterpret_cast<const char*>(tlvPayload.data()), tlvPayload.size());

    std::string serializedData;
    profilerResult.SerializeToString(&serializedData);
    ProtoReader::BytesView bytesView(reinterpret_cast<const uint8_t*>(serializedData.data()),
                                      serializedData.size());

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    uint64_t timestamp = 1000 * 1000000000ULL + 500000000ULL;
    parser.Parse(bytesView, timestamp);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_GT(timeData->Size(), 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseMethodWithCompleteTlvTest, TestSize.Level1)
{
    TS_LOGI("test20-26");
    NetworkProfilerResult profilerResult;
    auto event = profilerResult.add_network_event();
    event->set_pid(100);
    event->set_tid(200);
    event->set_tv_sec(10);
    event->set_tv_nsec(0);

    std::vector<uint8_t> tlvData;
    auto appendTlvUint64 = [&tlvData](uint32_t tag, uint64_t val) {
        tlvData.push_back(static_cast<uint8_t>(tag));
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(TLV_UINT64_LENGTH);
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        for (int i = 0; i < TLV_UINT64_LENGTH; i++) {
            tlvData.push_back(static_cast<uint8_t>(val >> (i * BYTE_SHIFT_8)));
        }
    };
    auto appendTlvUint32 = [&tlvData](uint32_t tag, uint32_t val) {
        tlvData.push_back(static_cast<uint8_t>(tag));
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(TLV_UINT32_LENGTH);
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        for (int i = 0; i < TLV_UINT32_LENGTH; i++) {
            tlvData.push_back(static_cast<uint8_t>(val >> (i * BYTE_SHIFT_8)));
        }
    };
    auto appendTlvString = [&tlvData](uint32_t tag, const std::string &s) {
        tlvData.push_back(static_cast<uint8_t>(tag));
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(static_cast<uint8_t>(s.size()));
        tlvData.push_back(0);
        tlvData.push_back(0);
        tlvData.push_back(0);
        for (char c : s) tlvData.push_back(static_cast<uint8_t>(c));
    };

    appendTlvUint64(1, 1000);
    appendTlvUint64(2, 2000);
    appendTlvUint64(3, 3000);
    appendTlvUint64(4, 4000);
    appendTlvUint64(5, 5000);
    appendTlvUint64(6, 6000);
    appendTlvUint64(7, 7000);
    appendTlvString(8, "req-123");
    appendTlvString(9, "https://example.com/api/test");
    appendTlvString(10, "GET");
    appendTlvString(11, "header-data");
    appendTlvUint32(12, 200);
    appendTlvString(13, "resp-header");
    appendTlvString(14, "https://example.com/api/test/effective");
    appendTlvString(15, "192.168.1.1");
    appendTlvString(16, "HTTP/1.1");
    appendTlvString(17, "OK");
    appendTlvString(18, "response-body");

    event->set_payload(reinterpret_cast<const char*>(tlvData.data()), tlvData.size());

    std::string serialized;
    profilerResult.SerializeToString(&serialized);
    ProtoReader::BytesView view(reinterpret_cast<const uint8_t*>(serialized.data()), serialized.size());

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    parser.Parse(view, 10 * 1000000000ULL);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(timeData->Size(), 1);
    EXPECT_EQ(infoData->Size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserNullDataTest, TestSize.Level1)
{
    TS_LOGI("test20-27");
    TlvParser parser;
    TlvResult result = parser.ParseAll(nullptr, 0);
    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserEmptyDataTest, TestSize.Level1)
{
    TS_LOGI("test20-28");
    TlvParser parser;
    uint8_t emptyData[] = {};
    TlvResult result = parser.ParseAll(emptyData, 0);
    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserIncompleteTlvTest, TestSize.Level1)
{
    TS_LOGI("test20-29");
    TlvParser parser;
    uint8_t incompleteData[] = {1, 0, 0, 0, 100, 0, 0, 0};
    TlvResult result = parser.ParseAll(incompleteData, 8);
    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserUint64LengthMismatchTest, TestSize.Level1)
{
    TS_LOGI("test20-30");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    tlvData.push_back(1);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(TLV_UINT32_LENGTH);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    for (int i = 0; i < TLV_UINT32_LENGTH; i++) tlvData.push_back(static_cast<uint8_t>(i));

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_EQ(result.beginTime, 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserUint32LengthMismatchTest, TestSize.Level1)
{
    TS_LOGI("test20-31");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    tlvData.push_back(12);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(TLV_UINT64_LENGTH);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    for (int i = 0; i < TLV_UINT64_LENGTH; i++) tlvData.push_back(static_cast<uint8_t>(i));

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_EQ(result.responseStatusCode, 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserUnknownTagTest, TestSize.Level1)
{
    TS_LOGI("test20-32");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    tlvData.push_back(99);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(TLV_UINT64_LENGTH);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    for (int i = 0; i < TLV_UINT64_LENGTH; i++) tlvData.push_back(static_cast<uint8_t>(i));

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_TRUE(result.parseSuccess);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserIncompleteAtEndTest, TestSize.Level1)
{
    TS_LOGI("test20-33");
    TlvParser parser;
    uint8_t incompleteData[] = {1, 0, 0, 0, 8, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 2};
    TlvResult result = parser.ParseAll(incompleteData, 17);
    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, 578437695752307201ULL);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseWithoutNetworkEventTest, TestSize.Level1)
{
    TS_LOGI("test20-34");
    NetworkProfilerResult profilerResult;
    std::string serialized;
    profilerResult.SerializeToString(&serialized);
    ProtoReader::BytesView view(reinterpret_cast<const uint8_t*>(serialized.data()), serialized.size());

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    parser.Parse(view, 10 * 1000000000ULL);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Size(), 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseWithInvalidTlvPayloadTest, TestSize.Level1)
{
    TS_LOGI("test20-35");
    NetworkProfilerResult profilerResult;
    auto event = profilerResult.add_network_event();
    event->set_pid(100);
    event->set_tid(200);
    event->set_tv_sec(10);
    event->set_tv_nsec(0);
    event->set_payload("invalid");

    std::string serialized;
    profilerResult.SerializeToString(&serialized);
    ProtoReader::BytesView view(reinterpret_cast<const uint8_t*>(serialized.data()), serialized.size());

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    parser.Parse(view, 10 * 1000000000ULL);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Size(), 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, StoreTimeInformationNewProcessTest, TestSize.Level1)
{
    TS_LOGI("test20-36");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.endTime = 7000;
    uint32_t newPid = 9999;
    uint32_t newTid = 8888;

    parser.StoreTimeInformation(result, newPid, newTid);

    auto timeInfoData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeInfoData->Size(), 1);
    EXPECT_EQ(timeInfoData->BeginTimes()[0], 1000);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkInformationTableSqlQueryTest, TestSize.Level1)
{
    TS_LOGI("test20-37");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.requestId = "req-test-001";
    result.requestMethod = "POST";
    result.requestHeader = "Content-Type: application/json";
    result.responseStatusCode = 201;
    result.responseHeader = "Location: /resource";
    result.responseEffectiveUrl = "https://api.example.com/v2/resource";
    result.ipAddress = "10.0.0.1";
    result.httpVersion = "HTTP/2.0";
    result.responseReasonPhrase = "Created";

    UrlParts urlParts;
    urlParts.protocol = "https";
    urlParts.domain = "api.example.com";
    urlParts.requestUri = "/v1/resource";

    parser.StoreInformation(result, urlParts);
    parser.Finish();

    std::string sqlSelect = "SELECT id, request_id, protocol, domain, request_uri, request_method, "
                            "request_header, response_status_code, response_header, "
                            "response_effective_url, ip_address, version, reason_phrase "
                            "FROM network_information";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlSelect, false), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkTimeInformationTableSqlQueryTest, TestSize.Level1)
{
    TS_LOGI("test20-38");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.dnsEndTime = 2000;
    result.tcpConnectEndTime = 3000;
    result.tlsHandshakeEndTime = 4000;
    result.firstSendTime = 5000;
    result.firstRecvTime = 6000;
    result.endTime = 7000;

    parser.StoreTimeInformation(result, 1000, 2000);
    parser.Finish();

    std::string sqlSelect = "SELECT id, itid, ipid, begin_time, dns_end_time, tcp_end_time, "
                            "tls_end_time, first_send_time, first_recv_time, end_time, cache_hit "
                            "FROM network_time_information";
    EXPECT_EQ(stream_.traceDataCache_->SearchDatabase(sqlSelect, false), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkTimeInformationDataGetterTest, TestSize.Level1)
{
    TS_LOGI("test20-39");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;
    result.dnsEndTime = 2000;
    result.tcpConnectEndTime = 3000;
    result.tlsHandshakeEndTime = 4000;
    result.firstSendTime = 5000;
    result.firstRecvTime = 6000;
    result.endTime = 7000;

    parser.StoreTimeInformation(result, 1000, 2000);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Ipids().size(), 1);
    EXPECT_EQ(timeData->Itids().size(), 1);
    EXPECT_EQ(timeData->BeginTimes().size(), 1);
    EXPECT_EQ(timeData->DnsEndTimes().size(), 1);
    EXPECT_EQ(timeData->TcpConnectEndTimes().size(), 1);
    EXPECT_EQ(timeData->TlsHandshakeEndTimes().size(), 1);
    EXPECT_EQ(timeData->FirstSendTimes().size(), 1);
    EXPECT_EQ(timeData->FirstRecvTimes().size(), 1);
    EXPECT_EQ(timeData->EndTimes().size(), 1);
    EXPECT_EQ(timeData->CacheHits().size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkInformationDataGetterTest, TestSize.Level1)
{
    TS_LOGI("test20-40");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.requestId = "req-001";
    result.requestMethod = "GET";
    result.requestHeader = "Accept: */*";
    result.responseStatusCode = 200;
    result.responseHeader = "Content-Type: text/html";
    result.responseEffectiveUrl = "https://example.com/page";
    result.ipAddress = "127.0.0.1";
    result.httpVersion = "HTTP/1.0";
    result.responseReasonPhrase = "OK";

    UrlParts urlParts;
    urlParts.protocol = "http";
    urlParts.domain = "localhost";
    urlParts.requestUri = "/index.html";

    parser.StoreInformation(result, urlParts);

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->RequestIds().size(), 1);
    EXPECT_EQ(infoData->Protocols().size(), 1);
    EXPECT_EQ(infoData->Domains().size(), 1);
    EXPECT_EQ(infoData->RequestUris().size(), 1);
    EXPECT_EQ(infoData->RequestMethods().size(), 1);
    EXPECT_EQ(infoData->RequestHeaders().size(), 1);
    EXPECT_EQ(infoData->ResponseHeaders().size(), 1);
    EXPECT_EQ(infoData->ResponseEffectiveUrls().size(), 1);
    EXPECT_EQ(infoData->IpAddresses().size(), 1);
    EXPECT_EQ(infoData->HttpVersions().size(), 1);
    EXPECT_EQ(infoData->ResponseReasonPhrases().size(), 1);
    EXPECT_EQ(infoData->ResponseStatusCodes().size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, ParseMultipleEventsTest, TestSize.Level1)
{
    TS_LOGI("test20-41");
    NetworkProfilerResult profilerResult;
    auto event1 = profilerResult.add_network_event();
    event1->set_pid(100);
    event1->set_tid(200);
    event1->set_tv_sec(10);
    event1->set_tv_nsec(0);

    std::vector<uint8_t> tlvData1;
    auto appendTlvUint64 = [](std::vector<uint8_t> &data, uint32_t tag, uint64_t val) {
        data.push_back(static_cast<uint8_t>(tag));
        data.push_back(0);
        data.push_back(0);
        data.push_back(0);
        data.push_back(TLV_UINT64_LENGTH);
        data.push_back(0);
        data.push_back(0);
        data.push_back(0);
        for (int i = 0; i < TLV_UINT64_LENGTH; i++) {
            data.push_back(static_cast<uint8_t>(val >> (i * BYTE_SHIFT_8)));
        }
    };

    appendTlvUint64(tlvData1, 1, 1000);
    appendTlvUint64(tlvData1, 7, 2000);
    event1->set_payload(reinterpret_cast<const char*>(tlvData1.data()), tlvData1.size());

    auto event2 = profilerResult.add_network_event();
    event2->set_pid(300);
    event2->set_tid(400);
    event2->set_tv_sec(20);
    event2->set_tv_nsec(0);

    std::vector<uint8_t> tlvData2;
    appendTlvUint64(tlvData2, 1, 3000);
    appendTlvUint64(tlvData2, 7, 4000);
    event2->set_payload(reinterpret_cast<const char*>(tlvData2.data()), tlvData2.size());

    std::string serialized;
    profilerResult.SerializeToString(&serialized);
    ProtoReader::BytesView view(reinterpret_cast<const uint8_t*>(serialized.data()), serialized.size());

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    parser.Parse(view, 10 * 1000000000ULL);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Size(), 2);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserValidUint64Test, TestSize.Level1)
{
    TS_LOGI("test20-42");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    tlvData.push_back(1);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(TLV_UINT64_LENGTH);
    tlvData.push_back(0);
    tlvData.push_back(0);
    tlvData.push_back(0);
    for (int i = 0; i < TLV_UINT64_LENGTH; i++) {
        tlvData.push_back(static_cast<uint8_t>(expectedValue >> (i * BYTE_SHIFT_8)));
    }

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, expectedValue);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserValidUint32Test, TestSize.Level1)
{
    TS_LOGI("test20-43");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    
    for (int i = 0; i < IDX_RESPONSE_STATUS_CODE; i++) {
        uint32_t type = 1;
        uint32_t length = TLV_UINT64_LENGTH;
        uint64_t value = 1000 + i;
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&type),
                         reinterpret_cast<uint8_t*>(&type) + TLV_UINT32_LENGTH);
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&length),
                         reinterpret_cast<uint8_t*>(&length) + TLV_UINT32_LENGTH);
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&value),
                         reinterpret_cast<uint8_t*>(&value) + TLV_UINT64_LENGTH);
    }
    
    uint32_t type = IDX_RESPONSE_STATUS_CODE;
    uint32_t length = TLV_UINT32_LENGTH;
    uint32_t expectedValue = 404;
    tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&type),
                     reinterpret_cast<uint8_t*>(&type) + TLV_UINT32_LENGTH);
    tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&length),
                     reinterpret_cast<uint8_t*>(&length) + TLV_UINT32_LENGTH);
    tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&expectedValue),
                     reinterpret_cast<uint8_t*>(&expectedValue) + TLV_UINT32_LENGTH);

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.responseStatusCode, expectedValue);
}

HWTEST_F(NetworkProfilerParserTestSuite, TlvParserValidStringTest, TestSize.Level1)
{
    TS_LOGI("test20-44");
    TlvParser parser;
    std::vector<uint8_t> tlvData;
    std::string testString = "test-request-id";
    
    for (int i = 0; i < IDX_REQUEST_ID; i++) {
        uint32_t type = 1;
        uint32_t length = TLV_UINT64_LENGTH;
        uint64_t value = 1000 + i;
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&type),
                         reinterpret_cast<uint8_t*>(&type) + TLV_UINT32_LENGTH);
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&length),
                         reinterpret_cast<uint8_t*>(&length) + TLV_UINT32_LENGTH);
        tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&value),
                         reinterpret_cast<uint8_t*>(&value) + TLV_UINT64_LENGTH);
    }
    
    uint32_t type = IDX_REQUEST_ID;
    uint32_t length = static_cast<uint32_t>(testString.size());
    tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&type),
                     reinterpret_cast<uint8_t*>(&type) + TLV_UINT32_LENGTH);
    tlvData.insert(tlvData.end(), reinterpret_cast<uint8_t*>(&length),
                     reinterpret_cast<uint8_t*>(&length) + TLV_UINT32_LENGTH);
    for (char c : testString) tlvData.push_back(static_cast<uint8_t>(c));

    TlvResult result = parser.ParseAll(tlvData.data(), tlvData.size());
    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.requestId, testString);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkInformationTableMultipleRowsTest, TestSize.Level1)
{
    TS_LOGI("test20-45");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    for (int i = 0; i < 3; i++) {
        TlvResult result;
        result.requestId = "req-" + std::to_string(i);
        result.requestMethod = "GET";
        result.responseStatusCode = 200 + i;

        UrlParts urlParts;
        urlParts.protocol = "https";
        urlParts.domain = "example" + std::to_string(i) + ".com";
        urlParts.requestUri = "/api" + std::to_string(i);

        parser.StoreInformation(result, urlParts);
    }
    parser.Finish();

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->Size(), 3);
    EXPECT_EQ(infoData->RequestIds()[0], "req-0");
    EXPECT_EQ(infoData->RequestIds()[1], "req-1");
    EXPECT_EQ(infoData->RequestIds()[2], "req-2");
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkTimeInformationTableMultipleRowsTest, TestSize.Level1)
{
    TS_LOGI("test20-46");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    for (int i = 0; i < 3; i++) {
        TlvResult result;
        result.beginTime = 1000 + i * 1000;
        result.endTime = 2000 + i * 1000;

        parser.StoreTimeInformation(result, 1000 + i, 2000 + i);
    }
    parser.Finish();

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->Size(), 3);
    EXPECT_EQ(timeData->BeginTimes()[0], 1000);
    EXPECT_EQ(timeData->BeginTimes()[1], 2000);
    EXPECT_EQ(timeData->BeginTimes()[2], 3000);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkProfilerStdtypeClearTest, TestSize.Level1)
{
    TS_LOGI("test20-47");
    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();

    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());
    TlvResult result;
    result.beginTime = 1000;
    result.endTime = 2000;
    result.requestId = "test-req";

    UrlParts urlParts;
    urlParts.protocol = "http";
    urlParts.domain = "test.com";
    urlParts.requestUri = "/test";

    parser.StoreTimeInformation(result, 1000, 2000);
    parser.StoreInformation(result, urlParts);

    EXPECT_EQ(timeData->Size(), 1);
    EXPECT_EQ(infoData->Size(), 1);

    timeData->Clear();
    infoData->Clear();

    EXPECT_EQ(timeData->Size(), 0);
    EXPECT_EQ(infoData->Size(), 0);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkInformationDataIdsTest, TestSize.Level1)
{
    TS_LOGI("test20-48");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.requestId = "test-id-001";
    UrlParts urlParts;
    urlParts.protocol = "https";

    parser.StoreInformation(result, urlParts);

    auto infoData = stream_.traceDataCache_->GetNetworkInformationData();
    EXPECT_EQ(infoData->IdsData().size(), 1);
}

HWTEST_F(NetworkProfilerParserTestSuite, NetworkTimeInformationDataIdsTest, TestSize.Level1)
{
    TS_LOGI("test20-49");
    PbreaderNetworkProfilerParser parser(stream_.GetTraceDataCache(), stream_.GetStreamFilter());

    TlvResult result;
    result.beginTime = 1000;

    parser.StoreTimeInformation(result, 1000, 2000);

    auto timeData = stream_.traceDataCache_->GetNetworkTimeInformationData();
    EXPECT_EQ(timeData->IdsData().size(), 1);
}

} // namespace NetworkProfilerParserTest
} // namespace TraceStreamer
} // namespace SysTuning