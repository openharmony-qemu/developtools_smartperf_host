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

#include "base/log.h"
#include "parser/pbreader_parser/network_profiler_parser/tlv_parser.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace TlvParserTest {

class TlvParserTestSuite : public ::testing::Test {
public:
    void SetUp() override {}
    void TearDown() override {}

protected:
    std::vector<uint8_t> BuildTlvData(uint32_t type, uint32_t length, const uint8_t *value)
    {
        std::vector<uint8_t> data;
        data.resize(8 + length);
        std::memcpy(data.data(), &type, sizeof(type));
        std::memcpy(data.data() + 4, &length, sizeof(length));
        if (value && length > 0) {
            std::memcpy(data.data() + 8, value, length);
        }
        return data;
    }

    std::vector<uint8_t> BuildUint64Tlv(uint64_t value)
    {
        uint32_t type = static_cast<uint32_t>(TlvType::UINT64);
        return BuildTlvData(type, 8, reinterpret_cast<const uint8_t *>(&value));
    }

    std::vector<uint8_t> BuildUint32Tlv(uint32_t value)
    {
        uint32_t type = static_cast<uint32_t>(TlvType::UINT32);
        return BuildTlvData(type, 4, reinterpret_cast<const uint8_t *>(&value));
    }

    std::vector<uint8_t> BuildStringTlv(const std::string &value)
    {
        uint32_t type = static_cast<uint32_t>(TlvType::STRING);
        return BuildTlvData(type, static_cast<uint32_t>(value.size()),
                            reinterpret_cast<const uint8_t *>(value.data()));
    }

    std::vector<uint8_t> BuildWrongLengthTlv(uint32_t type, uint32_t wrongLength)
    {
        std::vector<uint8_t> data;
        data.resize(8 + wrongLength);
        std::memcpy(data.data(), &type, sizeof(type));
        std::memcpy(data.data() + 4, &wrongLength, sizeof(wrongLength));
        for (uint32_t i = 0; i < wrongLength; i++) {
            data[8 + i] = static_cast<uint8_t>(i);
        }
        return data;
    }
};

HWTEST_F(TlvParserTestSuite, ParseUint64, TestSize.Level1)
{
    TS_LOGI("test19-1");
    const uint64_t expectedValue = 123456789;
    auto data = BuildUint64Tlv(expectedValue);

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, expectedValue);
}

HWTEST_F(TlvParserTestSuite, ParseUint64WithWrongLength, TestSize.Level1)
{
    TS_LOGI("test19-2");
    uint32_t type = static_cast<uint32_t>(TlvType::UINT64);
    auto data = BuildWrongLengthTlv(type, 5);

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, 0);
}

HWTEST_F(TlvParserTestSuite, ParseUint32WithWrongLength, TestSize.Level1)
{
    TS_LOGI("test19-3");
    uint32_t type = static_cast<uint32_t>(TlvType::UINT32);
    auto data = BuildWrongLengthTlv(type, 5);

    std::vector<uint8_t> fullData;
    for (int i = 0; i < 11; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        fullData.insert(fullData.end(), uint64Item.begin(), uint64Item.end());
    }
    fullData.insert(fullData.end(), data.begin(), data.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(fullData.data(), fullData.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.responseStatusCode, 0);
}

HWTEST_F(TlvParserTestSuite, ParseString, TestSize.Level1)
{
    TS_LOGI("test19-4");
    const std::string expectedValue = "test";
    
    std::vector<uint8_t> data;
    for (int i = 0; i < 7; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        data.insert(data.end(), uint64Item.begin(), uint64Item.end());
    }
    auto stringItem = BuildStringTlv(expectedValue);
    data.insert(data.end(), stringItem.begin(), stringItem.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.requestId, expectedValue);
}

HWTEST_F(TlvParserTestSuite, ParseUint32, TestSize.Level1)
{
    TS_LOGI("test19-5");
    const uint32_t expectedValue = 200;
    
    std::vector<uint8_t> data;
    for (int i = 0; i < 11; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        data.insert(data.end(), uint64Item.begin(), uint64Item.end());
    }
    auto uint32Item = BuildUint32Tlv(expectedValue);
    data.insert(data.end(), uint32Item.begin(), uint32Item.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.responseStatusCode, expectedValue);
}

HWTEST_F(TlvParserTestSuite, ParseEmptyPayload, TestSize.Level1)
{
    TS_LOGI("test19-6");

    TlvParser parser;
    TlvResult result = parser.ParseAll(nullptr, 0);

    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(TlvParserTestSuite, ParseIncompleteTlvHeader, TestSize.Level1)
{
    TS_LOGI("test19-7");
    std::vector<uint8_t> incompleteData = {0x01, 0x00, 0x00, 0x00};

    TlvParser parser;
    TlvResult result = parser.ParseAll(incompleteData.data(), incompleteData.size());

    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(TlvParserTestSuite, ParseIncompleteTlvPayload, TestSize.Level1)
{
    TS_LOGI("test19-8");
    uint32_t type = static_cast<uint32_t>(TlvType::UINT64);
    uint32_t length = 100;
    std::vector<uint8_t> data;
    data.resize(8 + 50);
    std::memcpy(data.data(), &type, sizeof(type));
    std::memcpy(data.data() + 4, &length, sizeof(length));
    for (size_t i = 8; i < data.size(); i++) {
        data[i] = static_cast<uint8_t>(i);
    }

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_FALSE(result.parseSuccess);
}

HWTEST_F(TlvParserTestSuite, ParseIncompleteTlvAtEnd, TestSize.Level1)
{
    TS_LOGI("test19-9");
    uint64_t value = 12345;
    std::vector<uint8_t> validData = BuildUint64Tlv(value);
    std::vector<uint8_t> data;
    data.insert(data.end(), validData.begin(), validData.end());
    data.insert(data.end(), {0x01, 0x00, 0x00});

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, value);
}

HWTEST_F(TlvParserTestSuite, ParseAllUint64Tags, TestSize.Level1)
{
    TS_LOGI("test19-10");
    std::vector<uint8_t> data;
    uint64_t beginTimeVal = 1000;
    uint64_t dnsEndTimeVal = 2000;
    uint64_t tcpConnectEndTimeVal = 3000;
    uint64_t tlsHandshakeEndTimeVal = 4000;
    uint64_t firstSendTimeVal = 5000;
    uint64_t firstRecvTimeVal = 6000;
    uint64_t endTimeVal = 7000;

    auto item0 = BuildUint64Tlv(beginTimeVal);
    auto item1 = BuildUint64Tlv(dnsEndTimeVal);
    auto item2 = BuildUint64Tlv(tcpConnectEndTimeVal);
    auto item3 = BuildUint64Tlv(tlsHandshakeEndTimeVal);
    auto item4 = BuildUint64Tlv(firstSendTimeVal);
    auto item5 = BuildUint64Tlv(firstRecvTimeVal);
    auto item6 = BuildUint64Tlv(endTimeVal);

    data.insert(data.end(), item0.begin(), item0.end());
    data.insert(data.end(), item1.begin(), item1.end());
    data.insert(data.end(), item2.begin(), item2.end());
    data.insert(data.end(), item3.begin(), item3.end());
    data.insert(data.end(), item4.begin(), item4.end());
    data.insert(data.end(), item5.begin(), item5.end());
    data.insert(data.end(), item6.begin(), item6.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, beginTimeVal);
    EXPECT_EQ(result.dnsEndTime, dnsEndTimeVal);
    EXPECT_EQ(result.tcpConnectEndTime, tcpConnectEndTimeVal);
    EXPECT_EQ(result.tlsHandshakeEndTime, tlsHandshakeEndTimeVal);
    EXPECT_EQ(result.firstSendTime, firstSendTimeVal);
    EXPECT_EQ(result.firstRecvTime, firstRecvTimeVal);
    EXPECT_EQ(result.endTime, endTimeVal);
}

HWTEST_F(TlvParserTestSuite, ParseAllStringTags, TestSize.Level1)
{
    TS_LOGI("test19-11");
    std::vector<uint8_t> data;
    std::string requestIdVal = "req123";
    std::string requestUrlVal = "https://example.com/api";
    std::string requestMethodVal = "GET";
    std::string requestHeaderVal = "Content-Type: application/json";
    uint32_t statusCodeVal = 200;
    std::string responseHeaderVal = "X-Custom-Header: value";
    std::string responseEffectiveUrlVal = "https://redirect.com";
    std::string ipAddressVal = "192.168.1.1";
    std::string httpVersionVal = "HTTP/1.1";
    std::string responseReasonPhraseVal = "OK";
    std::string responseBodyVal = "response body data";

    for (int i = 0; i < 7; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        data.insert(data.end(), uint64Item.begin(), uint64Item.end());
    }

    auto item7 = BuildStringTlv(requestIdVal);
    auto item8 = BuildStringTlv(requestUrlVal);
    auto item9 = BuildStringTlv(requestMethodVal);
    auto item10 = BuildStringTlv(requestHeaderVal);
    auto item11 = BuildUint32Tlv(statusCodeVal);
    auto item12 = BuildStringTlv(responseHeaderVal);
    auto item13 = BuildStringTlv(responseEffectiveUrlVal);
    auto item14 = BuildStringTlv(ipAddressVal);
    auto item15 = BuildStringTlv(httpVersionVal);
    auto item16 = BuildStringTlv(responseReasonPhraseVal);
    auto item17 = BuildStringTlv(responseBodyVal);

    data.insert(data.end(), item7.begin(), item7.end());
    data.insert(data.end(), item8.begin(), item8.end());
    data.insert(data.end(), item9.begin(), item9.end());
    data.insert(data.end(), item10.begin(), item10.end());
    data.insert(data.end(), item11.begin(), item11.end());
    data.insert(data.end(), item12.begin(), item12.end());
    data.insert(data.end(), item13.begin(), item13.end());
    data.insert(data.end(), item14.begin(), item14.end());
    data.insert(data.end(), item15.begin(), item15.end());
    data.insert(data.end(), item16.begin(), item16.end());
    data.insert(data.end(), item17.begin(), item17.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.requestId, requestIdVal);
    EXPECT_EQ(result.requestUrl, requestUrlVal);
    EXPECT_EQ(result.requestMethod, requestMethodVal);
    EXPECT_EQ(result.requestHeader, requestHeaderVal);
    EXPECT_EQ(result.responseStatusCode, statusCodeVal);
    EXPECT_EQ(result.responseHeader, responseHeaderVal);
    EXPECT_EQ(result.responseEffectiveUrl, responseEffectiveUrlVal);
    EXPECT_EQ(result.ipAddress, ipAddressVal);
    EXPECT_EQ(result.httpVersion, httpVersionVal);
    EXPECT_EQ(result.responseReasonPhrase, responseReasonPhraseVal);
    EXPECT_EQ(result.responseBody, responseBodyVal);
}

HWTEST_F(TlvParserTestSuite, ParseResponseStatusCode, TestSize.Level1)
{
    TS_LOGI("test19-12");
    const uint32_t expectedStatusCode = 404;
    
    std::vector<uint8_t> data;
    for (int i = 0; i < 11; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        data.insert(data.end(), uint64Item.begin(), uint64Item.end());
    }
    auto uint32Item = BuildUint32Tlv(expectedStatusCode);
    data.insert(data.end(), uint32Item.begin(), uint32Item.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.responseStatusCode, expectedStatusCode);
}

HWTEST_F(TlvParserTestSuite, ParseUnknownType, TestSize.Level1)
{
    TS_LOGI("test19-13");
    uint32_t unknownType = 100;
    uint64_t value = 12345;
    std::vector<uint8_t> data;
    data.resize(8 + 8);
    std::memcpy(data.data(), &unknownType, sizeof(unknownType));
    uint32_t length = 8;
    std::memcpy(data.data() + 4, &length, sizeof(length));
    std::memcpy(data.data() + 8, &value, sizeof(value));

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
}

HWTEST_F(TlvParserTestSuite, ParseCompletePayload, TestSize.Level1)
{
    TS_LOGI("test19-14");
    std::vector<uint8_t> data;
    uint64_t beginTimeVal = 1000;
    uint64_t endTimeVal = 7000;
    std::string requestUrlVal = "https://example.com/api";
    uint32_t statusCode = 200;

    auto item0 = BuildUint64Tlv(beginTimeVal);
    auto item1 = BuildUint64Tlv(2000);
    auto item2 = BuildUint64Tlv(3000);
    auto item3 = BuildUint64Tlv(4000);
    auto item4 = BuildUint64Tlv(5000);
    auto item5 = BuildUint64Tlv(6000);
    auto item6 = BuildUint64Tlv(endTimeVal);
    auto item7 = BuildStringTlv("req123");
    auto item8 = BuildStringTlv(requestUrlVal);
    auto item9 = BuildStringTlv("GET");
    auto item10 = BuildStringTlv("header");
    auto item11 = BuildUint32Tlv(statusCode);

    data.insert(data.end(), item0.begin(), item0.end());
    data.insert(data.end(), item1.begin(), item1.end());
    data.insert(data.end(), item2.begin(), item2.end());
    data.insert(data.end(), item3.begin(), item3.end());
    data.insert(data.end(), item4.begin(), item4.end());
    data.insert(data.end(), item5.begin(), item5.end());
    data.insert(data.end(), item6.begin(), item6.end());
    data.insert(data.end(), item7.begin(), item7.end());
    data.insert(data.end(), item8.begin(), item8.end());
    data.insert(data.end(), item9.begin(), item9.end());
    data.insert(data.end(), item10.begin(), item10.end());
    data.insert(data.end(), item11.begin(), item11.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, beginTimeVal);
    EXPECT_EQ(result.endTime, endTimeVal);
    EXPECT_EQ(result.requestUrl, requestUrlVal);
    EXPECT_EQ(result.responseStatusCode, statusCode);
}

HWTEST_F(TlvParserTestSuite, ParseMultipleSamePosition, TestSize.Level1)
{
    TS_LOGI("test19-15");
    std::vector<uint8_t> data;
    uint64_t firstValue = 1000;
    uint64_t secondValue = 2000;

    auto item0First = BuildUint64Tlv(firstValue);
    auto item0Second = BuildUint64Tlv(secondValue);

    data.insert(data.end(), item0First.begin(), item0First.end());
    data.insert(data.end(), item0Second.begin(), item0Second.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, firstValue);
    EXPECT_EQ(result.dnsEndTime, secondValue);
}

HWTEST_F(TlvParserTestSuite, ParseEmptyString, TestSize.Level1)
{
    TS_LOGI("test19-16");
    std::string emptyValue = "";
    
    std::vector<uint8_t> data;
    for (int i = 0; i < 7; i++) {
        auto uint64Item = BuildUint64Tlv(1000 + i);
        data.insert(data.end(), uint64Item.begin(), uint64Item.end());
    }
    auto stringItem = BuildStringTlv(emptyValue);
    data.insert(data.end(), stringItem.begin(), stringItem.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.requestId, emptyValue);
}

HWTEST_F(TlvParserTestSuite, ParseAll18FieldsCompletePayload, TestSize.Level1)
{
    TS_LOGI("test19-17");
    std::vector<uint8_t> data;

    uint64_t beginTimeVal = 1000;
    uint64_t dnsEndTimeVal = 2000;
    uint64_t tcpConnectEndTimeVal = 3000;
    uint64_t tlsHandshakeEndTimeVal = 4000;
    uint64_t firstSendTimeVal = 5000;
    uint64_t firstRecvTimeVal = 6000;
    uint64_t endTimeVal = 7000;
    std::string requestIdVal = "req123";
    std::string requestUrlVal = "https://example.com/api";
    std::string requestMethodVal = "GET";
    std::string requestHeaderVal = "Content-Type: application/json";
    uint32_t statusCodeVal = 200;
    std::string responseHeaderVal = "X-Custom-Header: value";
    std::string responseEffectiveUrlVal = "https://redirect.com";
    std::string ipAddressVal = "192.168.1.1";
    std::string httpVersionVal = "HTTP/1.1";
    std::string responseReasonPhraseVal = "OK";
    std::string responseBodyVal = "response body data";

    auto item0 = BuildUint64Tlv(beginTimeVal);
    auto item1 = BuildUint64Tlv(dnsEndTimeVal);
    auto item2 = BuildUint64Tlv(tcpConnectEndTimeVal);
    auto item3 = BuildUint64Tlv(tlsHandshakeEndTimeVal);
    auto item4 = BuildUint64Tlv(firstSendTimeVal);
    auto item5 = BuildUint64Tlv(firstRecvTimeVal);
    auto item6 = BuildUint64Tlv(endTimeVal);
    auto item7 = BuildStringTlv(requestIdVal);
    auto item8 = BuildStringTlv(requestUrlVal);
    auto item9 = BuildStringTlv(requestMethodVal);
    auto item10 = BuildStringTlv(requestHeaderVal);
    auto item11 = BuildUint32Tlv(statusCodeVal);
    auto item12 = BuildStringTlv(responseHeaderVal);
    auto item13 = BuildStringTlv(responseEffectiveUrlVal);
    auto item14 = BuildStringTlv(ipAddressVal);
    auto item15 = BuildStringTlv(httpVersionVal);
    auto item16 = BuildStringTlv(responseReasonPhraseVal);
    auto item17 = BuildStringTlv(responseBodyVal);

    data.insert(data.end(), item0.begin(), item0.end());
    data.insert(data.end(), item1.begin(), item1.end());
    data.insert(data.end(), item2.begin(), item2.end());
    data.insert(data.end(), item3.begin(), item3.end());
    data.insert(data.end(), item4.begin(), item4.end());
    data.insert(data.end(), item5.begin(), item5.end());
    data.insert(data.end(), item6.begin(), item6.end());
    data.insert(data.end(), item7.begin(), item7.end());
    data.insert(data.end(), item8.begin(), item8.end());
    data.insert(data.end(), item9.begin(), item9.end());
    data.insert(data.end(), item10.begin(), item10.end());
    data.insert(data.end(), item11.begin(), item11.end());
    data.insert(data.end(), item12.begin(), item12.end());
    data.insert(data.end(), item13.begin(), item13.end());
    data.insert(data.end(), item14.begin(), item14.end());
    data.insert(data.end(), item15.begin(), item15.end());
    data.insert(data.end(), item16.begin(), item16.end());
    data.insert(data.end(), item17.begin(), item17.end());

    TlvParser parser;
    TlvResult result = parser.ParseAll(data.data(), data.size());

    EXPECT_TRUE(result.parseSuccess);
    EXPECT_EQ(result.beginTime, beginTimeVal);
    EXPECT_EQ(result.dnsEndTime, dnsEndTimeVal);
    EXPECT_EQ(result.tcpConnectEndTime, tcpConnectEndTimeVal);
    EXPECT_EQ(result.tlsHandshakeEndTime, tlsHandshakeEndTimeVal);
    EXPECT_EQ(result.firstSendTime, firstSendTimeVal);
    EXPECT_EQ(result.firstRecvTime, firstRecvTimeVal);
    EXPECT_EQ(result.endTime, endTimeVal);
    EXPECT_EQ(result.requestId, requestIdVal);
    EXPECT_EQ(result.requestUrl, requestUrlVal);
    EXPECT_EQ(result.requestMethod, requestMethodVal);
    EXPECT_EQ(result.requestHeader, requestHeaderVal);
    EXPECT_EQ(result.responseStatusCode, statusCodeVal);
    EXPECT_EQ(result.responseHeader, responseHeaderVal);
    EXPECT_EQ(result.responseEffectiveUrl, responseEffectiveUrlVal);
    EXPECT_EQ(result.ipAddress, ipAddressVal);
    EXPECT_EQ(result.httpVersion, httpVersionVal);
    EXPECT_EQ(result.responseReasonPhrase, responseReasonPhraseVal);
    EXPECT_EQ(result.responseBody, responseBodyVal);
}

} // namespace TlvParserTest
} // namespace TraceStreamer
} // namespace SysTuning