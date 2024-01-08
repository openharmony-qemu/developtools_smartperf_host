/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <string>
#include <unistd.h>

#include "file.h"
#include "test.pb.h"
#include "test.pbreader.h"
#include "trace_streamer_selector.h"

class ProtoReader;
using namespace testing::ext;
using namespace SysTuning;
using namespace SysTuning::TraceStreamer;
using namespace SysTuning::ProtoReader;
namespace SysTuning {
namespace TraceStreamer {
class ProtoReaderTest : public ::testing::Test {
protected:
    static void SetUpTestCase() {}
    static void TearDownTestCase() {}
};
/**
 * @tc.name: ParserDataByPBReader
 * @tc.desc: ParserData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-1");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 100;
    const uint64_t tvnsec = 1000000;
    const std::string name = "1000";
    const int32_t allocEvent = 10000;
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test = cores->add_test();
    test->set_number(number);
    test->set_tv_nsec(tvnsec);
    test->set_name(name);
    test->set_is_test(true);
    test->set_state(::Test_State(0));
    test->set_alloc_event(allocEvent);
    testParser.set_allocated_cores(cores);

    std::string str = "";
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(count, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);

    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(number, cpuInfoReader1.number());
    EXPECT_EQ(tvnsec, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(name, cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(allocEvent, cpuInfoReader1.alloc_event());
}

/**
 * @tc.name: ParserRepeatedDataByPBReader
 * @tc.desc: ParserRepeatedData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserRepeatedDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-2");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t allocEvent1 = 10000;
    const int32_t nameber2 = 200;
    const uint64_t tvnsec2 = 2000000;
    const std::string name2 = "2000";
    const int32_t allocEvent2 = 20000;
    const int32_t number3 = 300;
    const uint64_t tvnsec3 = 3000000;
    const std::string name3 = "3000";
    const int32_t allocEvent3 = 30000;
    std::string str = "";
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(allocEvent1);

    auto test2 = cores->add_test();
    test2->set_number(nameber2);
    test2->set_tv_nsec(tvnsec2);
    test2->set_name(name2);
    test2->set_is_test(false);
    test2->set_state(::Test_State(1));
    test2->set_alloc_event(allocEvent2);

    auto test3 = cores->add_test();
    test3->set_number(number3);
    test3->set_tv_nsec(tvnsec3);
    test3->set_name(name3);
    test3->set_is_test(true);
    test3->set_state(::Test_State(0));
    test3->set_alloc_event(allocEvent3);
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(count, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(number1, cpuInfoReader1.number());
    EXPECT_EQ(tvnsec1, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(name1, cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(allocEvent1, cpuInfoReader1.alloc_event());
    itor++;
    Test_Reader cpuInfoReader2(itor->ToBytes());
    EXPECT_EQ(nameber2, cpuInfoReader2.number());
    EXPECT_EQ(tvnsec2, cpuInfoReader2.tv_nsec());
    EXPECT_EQ(name2, cpuInfoReader2.name().ToStdString());
    EXPECT_EQ(false, cpuInfoReader2.is_test());
    EXPECT_EQ(::Test_State(1), cpuInfoReader2.state());
    EXPECT_EQ(allocEvent2, cpuInfoReader2.alloc_event());
    itor++;
    Test_Reader cpuInfoReader3(itor->ToBytes());
    EXPECT_EQ(number3, cpuInfoReader3.number());
    EXPECT_EQ(tvnsec3, cpuInfoReader3.tv_nsec());
    EXPECT_EQ(name3, cpuInfoReader3.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader3.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader3.state());
    EXPECT_EQ(allocEvent3, cpuInfoReader3.alloc_event());
}

/**
 * @tc.name: NoDataByPBReader
 * @tc.desc: ParserNoData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, NoDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-3");
    TestParser testParser;

    std::string str = "";
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(0, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);

    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(0, cpuInfoReader1.number());
    EXPECT_EQ(0, cpuInfoReader1.tv_nsec());
    EXPECT_EQ("", cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(false, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(0, cpuInfoReader1.alloc_event());
}

/**
 * @tc.name: ParserOneofForMutiDataByPBReader
 * @tc.desc: ParserOneofForMutiData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserOneofForMutiDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-4");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t allocEvent1 = 10000;
    const int32_t nameber2 = 200;
    const uint64_t tvnsec2 = 2000000;
    const std::string name2 = "2000";
    const std::string freeEvent = "20000";
    const int32_t number3 = 300;
    const uint64_t tvnsec3 = 3000000;
    const std::string name3 = "3000";
    const int32_t allocEvent3 = 30000;
    std::string str = "";
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(allocEvent1);

    auto test2 = cores->add_test();
    test2->set_number(nameber2);
    test2->set_tv_nsec(tvnsec2);
    test2->set_name(name2);
    test2->set_is_test(false);
    test2->set_state(::Test_State(1));
    test2->set_free_event(freeEvent);

    auto test3 = cores->add_test();
    test3->set_number(number3);
    test3->set_tv_nsec(tvnsec3);
    test3->set_name(name3);
    test3->set_is_test(true);
    test3->set_state(::Test_State(0));
    test3->set_alloc_event(allocEvent3);
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(count, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(number1, cpuInfoReader1.number());
    EXPECT_EQ(tvnsec1, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(name1, cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(allocEvent1, cpuInfoReader1.alloc_event());
    itor++;
    Test_Reader cpuInfoReader2(itor->ToBytes());
    EXPECT_EQ(nameber2, cpuInfoReader2.number());
    EXPECT_EQ(tvnsec2, cpuInfoReader2.tv_nsec());
    EXPECT_EQ(name2, cpuInfoReader2.name().ToStdString());
    EXPECT_EQ(false, cpuInfoReader2.is_test());
    EXPECT_EQ(::Test_State(1), cpuInfoReader2.state());
    EXPECT_EQ(freeEvent, cpuInfoReader2.free_event().ToStdString());
    itor++;
    Test_Reader cpuInfoReader3(itor->ToBytes());
    EXPECT_EQ(number3, cpuInfoReader3.number());
    EXPECT_EQ(tvnsec3, cpuInfoReader3.tv_nsec());
    EXPECT_EQ(name3, cpuInfoReader3.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader3.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader3.state());
    EXPECT_EQ(allocEvent3, cpuInfoReader3.alloc_event());
}

/**
 * @tc.name: Parser One of Data For alloc event By PBReader
 * @tc.desc: ParserOneofData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserOneofDataForAllocEventByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-5");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t allocEvent = 10000;
    std::string str = "";
    testParser.set_count(count);

    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(allocEvent);

    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(count, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(number1, cpuInfoReader1.number());
    EXPECT_EQ(tvnsec1, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(name1, cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(allocEvent, cpuInfoReader1.alloc_event());
}

/**
 * @tc.name: Parser One of Data For Free event By PBReader
 * @tc.desc: ParserOneofData by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserOneofDataForFreeEventByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-6");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t freeEvent = 10000;
    std::string str = "";
    testParser.set_count(count);

    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(freeEvent);

    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(count, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(number1, cpuInfoReader1.number());
    EXPECT_EQ(tvnsec1, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(name1, cpuInfoReader1.name().ToStdString());
    EXPECT_EQ(true, cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(freeEvent, cpuInfoReader1.alloc_event());
}

/**
 * @tc.name: ParserNoDataByVarInt
 * @tc.desc: ParserNoData by VarInt
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserNoDataByVarInt, TestSize.Level1)
{
    TS_LOGI("test33-7");
    TestParser testParser;

    std::string str = "";
    testParser.SerializeToString(&str);

    auto kCountFieldNumber = TestParser_Reader::kCountDataAreaNumber;
    uint64_t count = 0;
    auto tsTag = CreateTagVarInt(kCountFieldNumber);
    if (str.size() > 10 && str.data()[0] == tsTag) {
        const uint8_t* nextData = VarIntDecode(reinterpret_cast<const uint8_t*>(str.data() + 1),
                                               reinterpret_cast<const uint8_t*>(str.data() + 11), &count);
    }
    EXPECT_EQ(0, count);
}

/**
 * @tc.name: ParserDataByVarInt
 * @tc.desc: ParserData by VarInt
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserDataByVarInt, TestSize.Level1)
{
    TS_LOGI("test33-8");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 100;
    const uint64_t tvnsec = 1000000;
    const std::string name = "1000";
    const int32_t allocEvent = 10000;
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test = cores->add_test();
    test->set_number(number);
    test->set_tv_nsec(tvnsec);
    test->set_name(name);
    test->set_is_test(true);
    test->set_state(::Test_State(0));
    test->set_alloc_event(allocEvent);
    testParser.set_allocated_cores(cores);

    std::string str = "";
    testParser.SerializeToString(&str);

    auto kCountFieldNumber = TestParser_Reader::kCountDataAreaNumber;
    uint64_t count = 0;
    auto tsTag = CreateTagVarInt(kCountFieldNumber);
    if (str.size() > 10 && str.data()[0] == tsTag) {
        const uint8_t* nextData = VarIntDecode(reinterpret_cast<const uint8_t*>(str.data() + 1),
                                               reinterpret_cast<const uint8_t*>(str.data() + 11), &count);
    }
    EXPECT_EQ(count, count);
}

/**
 * @tc.name: ParserDataByPBReaderBase
 * @tc.desc: ParserData by pbreader Base
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserDataByPBReaderBase, TestSize.Level1)
{
    TS_LOGI("test33-9");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 100;
    const uint64_t tvnsec = 1000000;
    const std::string name = "1000";
    const int32_t allocEvent = 10000;
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test = cores->add_test();
    test->set_number(number);
    test->set_tv_nsec(tvnsec);
    test->set_name(name);
    test->set_is_test(true);
    test->set_state(::Test_State(0));
    test->set_alloc_event(allocEvent);
    testParser.set_allocated_cores(cores);

    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.FindDataArea(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    auto number = typedProtoTestReader.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32();
    auto tvNsec = typedProtoTestReader.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    auto name = typedProtoTestReader.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString();
    auto isTest = typedProtoTestReader.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool();
    auto state = typedProtoTestReader.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32();
    auto allocEvent = typedProtoTestReader.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32();

    EXPECT_EQ(number, number);
    EXPECT_EQ(tvnsec, tvNsec);
    EXPECT_EQ(name, name);
    EXPECT_EQ(true, isTest);
    EXPECT_EQ(::Test_State(0), state);
    EXPECT_EQ(allocEvent, allocEvent);
}

/**
 * @tc.name: ParserMutiDataByPBReaderBase
 * @tc.desc: ParserMutiData by pbreader Base
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserMutiDataByPBReaderBase, TestSize.Level1)
{
    TS_LOGI("test33-10");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t allocEvent1 = 10000;
    const int32_t nameber2 = 200;
    const uint64_t tvnsec2 = 2000000;
    const std::string name2 = "2000";
    const int32_t allocEvent2 = 20000;
    const int32_t number3 = 300;
    const uint64_t tvnsec3 = 3000000;
    const std::string name3 = "3000";
    const int32_t allocEvent3 = 30000;
    std::string str = "";
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(allocEvent1);

    auto test2 = cores->add_test();
    test2->set_number(nameber2);
    test2->set_tv_nsec(tvnsec2);
    test2->set_name(name2);
    test2->set_is_test(false);
    test2->set_state(::Test_State(1));
    test2->set_alloc_event(allocEvent2);

    auto test3 = cores->add_test();
    test3->set_number(number3);
    test3->set_tv_nsec(tvnsec3);
    test3->set_name(name3);
    test3->set_is_test(true);
    test3->set_state(::Test_State(0));
    test3->set_alloc_event(allocEvent3);

    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto repeate = typedProtoCpuInfoTest.GetRepeated<BytesView>(CpuInfoTest_Reader::kTestDataAreaNumber);

    TypedProtoReader<7> typedProtoTestReader1(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number1 = typedProtoTestReader1.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(number1, number1);
    auto tvNsec1 = typedProtoTestReader1.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec1, tvNsec1);
    auto name1 = typedProtoTestReader1.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name1, name1);
    auto isTest1 = typedProtoTestReader1.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(true, isTest1);
    auto state1 = typedProtoTestReader1.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(0), state1);
    auto allocEvent1 = typedProtoTestReader1.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent1, allocEvent1);

    repeate++;
    TypedProtoReader<7> typedProtoTestReader2(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number2 = typedProtoTestReader2.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(nameber2, number2);
    auto tvNsec2 = typedProtoTestReader2.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec2, tvNsec2);
    auto name2 = typedProtoTestReader2.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name2, name2);
    auto isTest2 = typedProtoTestReader2.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(false, isTest2);
    auto state2 = typedProtoTestReader2.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(1), state2);
    auto allocEvent2 = typedProtoTestReader2.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent2, allocEvent2);

    repeate++;
    TypedProtoReader<7> typedProtoTestReader3(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number3 = typedProtoTestReader3.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(number3, number3);
    auto tvNsec3 = typedProtoTestReader3.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec3, tvNsec3);
    auto name3 = typedProtoTestReader3.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name3, name3);
    auto isTest3 = typedProtoTestReader3.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(true, isTest3);
    auto state3 = typedProtoTestReader3.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(0), state3);
    auto allocEvent3 = typedProtoTestReader3.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent3, allocEvent3);
}

/**
 * @tc.name: ParserNoDataByPBReaderBase
 * @tc.desc: ParserNoData by pbreader Base
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserNoDataByPBReaderBase, TestSize.Level1)
{
    TS_LOGI("test33-11");
    TestParser testParser;

    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(0, count);
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.FindDataArea(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    auto number = typedProtoTestReader.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32();
    auto tvNsec = typedProtoTestReader.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    auto name = typedProtoTestReader.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString();
    auto isTest = typedProtoTestReader.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool();
    auto state = typedProtoTestReader.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32();
    auto allocEvent = typedProtoTestReader.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32();

    EXPECT_EQ(0, number);
    EXPECT_EQ(0, tvNsec);
    EXPECT_EQ("", name);
    EXPECT_EQ(false, isTest);
    EXPECT_EQ(::Test_State(0), state);
    EXPECT_EQ(0, allocEvent);
}

/**
 * @tc.name: ParserDataByGet
 * @tc.desc: ParserData by Get
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserDataByGet, TestSize.Level1)
{
    TS_LOGI("test33-12");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 100;
    const uint64_t tvnsec = 1000000;
    const std::string name = "1000";
    const int32_t allocEvent = 10000;
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test = cores->add_test();
    test->set_number(number);
    test->set_tv_nsec(tvnsec);
    test->set_name(name);
    test->set_is_test(true);
    test->set_state(::Test_State(0));
    test->set_alloc_event(allocEvent);
    testParser.set_allocated_cores(cores);

    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.Get(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    auto number = typedProtoTestReader.Get(Test_Reader::kNumberDataAreaNumber).ToInt32();
    auto tvNsec = typedProtoTestReader.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    auto name = typedProtoTestReader.Get(Test_Reader::kNameDataAreaNumber).ToStdString();
    auto isTest = typedProtoTestReader.Get(Test_Reader::kIsTestDataAreaNumber).ToBool();
    auto state = typedProtoTestReader.Get(Test_Reader::kStateDataAreaNumber).ToInt32();
    auto allocEvent = typedProtoTestReader.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32();

    EXPECT_EQ(number, number);
    EXPECT_EQ(tvnsec, tvNsec);
    EXPECT_EQ(name, name);
    EXPECT_EQ(true, isTest);
    EXPECT_EQ(::Test_State(0), state);
    EXPECT_EQ(allocEvent, allocEvent);
}

/**
 * @tc.name: ParserMutiDataByGet
 * @tc.desc: ParserMutiData by Get
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserMutiDataByGet, TestSize.Level1)
{
    TS_LOGI("test33-13");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number1 = 100;
    const uint64_t tvnsec1 = 1000000;
    const std::string name1 = "1000";
    const int32_t allocEvent1 = 10000;
    const int32_t nameber2 = 200;
    const uint64_t tvnsec2 = 2000000;
    const std::string name2 = "2000";
    const int32_t allocEvent2 = 20000;
    const int32_t number3 = 300;
    const uint64_t tvnsec3 = 3000000;
    const std::string name3 = "3000";
    const int32_t allocEvent3 = 30000;
    std::string str = "";
    testParser.set_count(count);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    auto test1 = cores->add_test();
    test1->set_number(number1);
    test1->set_tv_nsec(tvnsec1);
    test1->set_name(name1);
    test1->set_is_test(true);
    test1->set_state(::Test_State(0));
    test1->set_alloc_event(allocEvent1);

    auto test2 = cores->add_test();
    test2->set_number(nameber2);
    test2->set_tv_nsec(tvnsec2);
    test2->set_name(name2);
    test2->set_is_test(false);
    test2->set_state(::Test_State(1));
    test2->set_alloc_event(allocEvent2);

    auto test3 = cores->add_test();
    test3->set_number(number3);
    test3->set_tv_nsec(tvnsec3);
    test3->set_name(name3);
    test3->set_is_test(true);
    test3->set_state(::Test_State(0));
    test3->set_alloc_event(allocEvent3);

    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto repeate = typedProtoCpuInfoTest.GetRepeated<BytesView>(CpuInfoTest_Reader::kTestDataAreaNumber);

    TypedProtoReader<7> typedProtoTestReader1(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number1 = typedProtoTestReader1.Get(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(number1, number1);
    auto tvNsec1 = typedProtoTestReader1.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec1, tvNsec1);
    auto name1 = typedProtoTestReader1.Get(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name1, name1);
    auto isTest1 = typedProtoTestReader1.Get(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(true, isTest1);
    auto state1 = typedProtoTestReader1.Get(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(0), state1);
    auto allocEvent1 = typedProtoTestReader1.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent1, allocEvent1);

    repeate++;
    TypedProtoReader<7> typedProtoTestReader2(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number2 = typedProtoTestReader2.Get(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(nameber2, number2);
    auto tvNsec2 = typedProtoTestReader2.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec2, tvNsec2);
    auto name2 = typedProtoTestReader2.Get(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name2, name2);
    auto isTest2 = typedProtoTestReader2.Get(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(false, isTest2);
    auto state2 = typedProtoTestReader2.Get(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(1), state2);
    auto allocEvent2 = typedProtoTestReader2.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent2, allocEvent2);

    repeate++;
    TypedProtoReader<7> typedProtoTestReader3(repeate->ToBytes().data_, repeate->ToBytes().size_);
    auto number3 = typedProtoTestReader3.Get(Test_Reader::kNumberDataAreaNumber).ToInt32();
    EXPECT_EQ(number3, number3);
    auto tvNsec3 = typedProtoTestReader3.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    EXPECT_EQ(tvnsec3, tvNsec3);
    auto name3 = typedProtoTestReader3.Get(Test_Reader::kNameDataAreaNumber).ToStdString();
    EXPECT_EQ(name3, name3);
    auto isTest3 = typedProtoTestReader3.Get(Test_Reader::kIsTestDataAreaNumber).ToBool();
    EXPECT_EQ(true, isTest3);
    auto state3 = typedProtoTestReader3.Get(Test_Reader::kStateDataAreaNumber).ToInt32();
    EXPECT_EQ(::Test_State(0), state3);
    auto allocEvent3 = typedProtoTestReader3.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32();
    EXPECT_EQ(allocEvent3, allocEvent3);
}

/**
 * @tc.name: ParserNoDataByGet
 * @tc.desc: ParserNoData by Get
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserNoDataByGet, TestSize.Level1)
{
    TS_LOGI("test33-14");
    TestParser testParser;

    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(0, count);
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.Get(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    auto number = typedProtoTestReader.Get(Test_Reader::kNumberDataAreaNumber).ToInt32();
    auto tvNsec = typedProtoTestReader.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64();
    auto name = typedProtoTestReader.Get(Test_Reader::kNameDataAreaNumber).ToStdString();
    auto isTest = typedProtoTestReader.Get(Test_Reader::kIsTestDataAreaNumber).ToBool();
    auto state = typedProtoTestReader.Get(Test_Reader::kStateDataAreaNumber).ToInt32();
    auto allocEvent = typedProtoTestReader.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32();

    EXPECT_EQ(0, number);
    EXPECT_EQ(0, tvNsec);
    EXPECT_EQ("", name);
    EXPECT_EQ(false, isTest);
    EXPECT_EQ(::Test_State(0), state);
    EXPECT_EQ(0, allocEvent);
}

/**
 * @tc.name: ParserPackedRepeatedInt32DataByPBReader
 * @tc.desc: ParserPackedRepeatedInt32Data by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedInt32DataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-15");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 1000;
    const int32_t number1 = 1001;
    const int32_t nameber2 = 1002;
    const int32_t number3 = 1003;
    std::string str = "";
    testParser.set_count(count);
    ::NumberTest* numberTest = new ::NumberTest();
    numberTest->add_numbertext(number);
    numberTest->add_numbertext(number1);
    numberTest->add_numbertext(nameber2);
    numberTest->add_numbertext(number3);

    testParser.set_allocated_numbertest(numberTest);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<3> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto numberType = typedProtoTest.Get(TestParser_Reader::kNumberTestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(numberType.data_), numberType.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kVarInt, int32_t>(
        NumberTest_Reader::kNumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
    packedRepeate++;
    auto numberValue1 = *packedRepeate;
    EXPECT_EQ(number1, numberValue1);
    packedRepeate++;
    auto numberValue2 = *packedRepeate;
    EXPECT_EQ(nameber2, numberValue2);
    packedRepeate++;
    auto numberValue3 = *packedRepeate;
    EXPECT_EQ(number3, numberValue3);
}

/**
 * @tc.name: ParserPackedRepeatedFixed64DataByPBReader
 * @tc.desc: ParserPackedRepeatedFixed64Data by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedFixed64DataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-16");
    TestParser testParser;
    const int32_t count = 100;
    const double number = 1000.01;
    const double number1 = 1001.01;
    const double nameber2 = 1002.01;
    const double number3 = 1003.01;
    std::string str = "";
    testParser.set_count(count);
    ::Fixed64Test* fixed64Test = new ::Fixed64Test();
    fixed64Test->add_fixed64numbertext(number);
    fixed64Test->add_fixed64numbertext(number1);
    fixed64Test->add_fixed64numbertext(nameber2);
    fixed64Test->add_fixed64numbertext(number3);

    testParser.set_allocated_fixed64test(fixed64Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto fix64Type = typedProtoTest.Get(TestParser_Reader::kFixed64TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix64Type.data_), fix64Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed64, double>(
        Fixed64Test_Reader::kFixed64NumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
    packedRepeate++;
    auto numberValue1 = *packedRepeate;
    EXPECT_EQ(number1, numberValue1);
    packedRepeate++;
    auto numberValue2 = *packedRepeate;
    EXPECT_EQ(nameber2, numberValue2);
    packedRepeate++;
    auto numberValue3 = *packedRepeate;
    EXPECT_EQ(number3, numberValue3);
}

/**
 * @tc.name: ParserPackedRepeatedFixed32DataByPBReader
 * @tc.desc: ParserPackedRepeatedFixed32Data by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedFixed32DataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-17");
    TestParser testParser;
    const int32_t count = 100;
    const float number = 1000.01;
    const float number1 = 1001.01;
    const float nameber2 = 1002.01;
    const float number3 = 1003.01;
    std::string str = "";
    testParser.set_count(count);
    ::Fixed32Test* fixed32Test = new ::Fixed32Test();
    fixed32Test->add_fixed32numbertext(number);
    fixed32Test->add_fixed32numbertext(number1);
    fixed32Test->add_fixed32numbertext(nameber2);
    fixed32Test->add_fixed32numbertext(number3);

    testParser.set_allocated_fixed32test(fixed32Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto fix32Type = typedProtoTest.Get(TestParser_Reader::kFixed32TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix32Type.data_), fix32Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed32, float>(
        Fixed32Test_Reader::kFixed32NumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
    packedRepeate++;
    auto numberValue1 = *packedRepeate;
    EXPECT_EQ(number1, numberValue1);
    packedRepeate++;
    auto numberValue2 = *packedRepeate;
    EXPECT_EQ(nameber2, numberValue2);
    packedRepeate++;
    auto numberValue3 = *packedRepeate;
    EXPECT_EQ(number3, numberValue3);
}

/**
 * @tc.name: ParserPackedRepeatedInt32OneDataByPBReader
 * @tc.desc: ParserPackedRepeatedInt32 with one set of Data  by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedInt32OneDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-18");
    TestParser testParser;
    const int32_t count = 100;
    const int32_t number = 1000;
    std::string str = "";
    testParser.set_count(count);
    ::NumberTest* numberTest = new ::NumberTest();
    numberTest->add_numbertext(number);

    testParser.set_allocated_numbertest(numberTest);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<3> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto numberType = typedProtoTest.Get(TestParser_Reader::kNumberTestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(numberType.data_), numberType.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kVarInt, int32_t>(
        NumberTest_Reader::kNumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
}

/**
 * @tc.name: ParserPackedRepeatedFixed64OneDataByPBReader
 * @tc.desc: ParserPackedRepeatedFixed64 with one set of Data by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedFixed64OneDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-19");
    TestParser testParser;
    const int32_t count = 100;
    const double number = 1000.01;
    std::string str = "";
    testParser.set_count(count);
    ::Fixed64Test* fixed64Test = new ::Fixed64Test();
    fixed64Test->add_fixed64numbertext(number);
    testParser.set_allocated_fixed64test(fixed64Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto fix64Type = typedProtoTest.Get(TestParser_Reader::kFixed64TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix64Type.data_), fix64Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed64, double>(
        Fixed64Test_Reader::kFixed64NumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
}

/**
 * @tc.name: ParserPackedRepeatedFixed32OneDataByPBReader
 * @tc.desc: ParserPackedRepeatedFixed32 with one set of Data by pbreader
 * @tc.type: FUNC
 */
HWTEST_F(ProtoReaderTest, ParserPackedRepeatedFixed32OneDataByPBReader, TestSize.Level1)
{
    TS_LOGI("test33-20");
    TestParser testParser;
    const int32_t count = 100;
    const float number = 1000.01;
    std::string str = "";
    testParser.set_count(count);
    ::Fixed32Test* fixed32Test = new ::Fixed32Test();
    fixed32Test->add_fixed32numbertext(number);
    testParser.set_allocated_fixed32test(fixed32Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    auto count = typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32();
    EXPECT_EQ(count, count);
    auto fix32Type = typedProtoTest.Get(TestParser_Reader::kFixed32TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix32Type.data_), fix32Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed32, float>(
        Fixed32Test_Reader::kFixed32NumberTextDataAreaNumber, &parserError);
    auto numberValue = *packedRepeate;
    EXPECT_EQ(number, numberValue);
}
} // namespace TraceStreamer
} // namespace SysTuning
