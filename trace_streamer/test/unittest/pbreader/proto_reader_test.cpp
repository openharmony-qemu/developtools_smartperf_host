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
const int32_t COUNT_01 = 100;
const int32_t NUMBER_01 = 100;
const uint64_t TV_NSEC_01 = 1000000;
const std::string NAME_01 = "1000";
const int32_t ALLOC_EVENT_01 = 10000;
const int32_t NUMBER_02 = 200;
const uint64_t TV_NSEC_02 = 2000000;
const std::string NAME_02 = "2000";
const std::string FREE_EVENT_02 = "20000";
const int32_t ALLOC_EVENT_02 = 20000;
const int32_t NUMBER_03 = 300;
const uint64_t TV_NSEC_03 = 3000000;
const std::string NAME_03 = "3000";
const int32_t ALLOC_EVENT_03 = 30000;

struct CoreTest {
    int32_t number;
    uint64_t tvNsec;
    std::string name;
    bool isTest;
    ::Test_State state;
    int32_t allocEvent;
    std::string freeEvent;
};

class ProtoReaderTest : public ::testing::Test {
protected:
    static void SetUpTestCase() {}
    static void TearDownTestCase() {}

    void AddCoreTest(::CpuInfoTest* cores, const CoreTest coreTest)
    {
        auto test = cores->add_test();
        test->set_number(coreTest.number);
        test->set_tv_nsec(coreTest.tvNsec);
        test->set_name(coreTest.name);
        test->set_is_test(coreTest.isTest);
        test->set_state(coreTest.state);
        if (coreTest.freeEvent == "") {
            test->set_alloc_event(coreTest.allocEvent);
        } else {
            test->set_free_event(coreTest.freeEvent);
        }
    }
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
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    std::string str = "";
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(COUNT_01, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);

    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(NUMBER_01, cpuInfoReader1.number());
    EXPECT_EQ(TV_NSEC_01, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(NAME_01, cpuInfoReader1.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(ALLOC_EVENT_01, cpuInfoReader1.alloc_event());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    AddCoreTest(cores, {NUMBER_02, TV_NSEC_02, NAME_02, false, ::Test_State(1), ALLOC_EVENT_02, ""});
    AddCoreTest(cores, {NUMBER_03, TV_NSEC_03, NAME_03, true, ::Test_State(0), ALLOC_EVENT_03, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(COUNT_01, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(NUMBER_01, cpuInfoReader1.number());
    EXPECT_EQ(TV_NSEC_01, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(NAME_01, cpuInfoReader1.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(ALLOC_EVENT_01, cpuInfoReader1.alloc_event());
    itor++;
    Test_Reader cpuInfoReader2(itor->ToBytes());
    EXPECT_EQ(NUMBER_02, cpuInfoReader2.number());
    EXPECT_EQ(TV_NSEC_02, cpuInfoReader2.tv_nsec());
    EXPECT_EQ(NAME_02, cpuInfoReader2.name().ToStdString());
    EXPECT_FALSE(cpuInfoReader2.is_test());
    EXPECT_EQ(::Test_State(1), cpuInfoReader2.state());
    EXPECT_EQ(ALLOC_EVENT_02, cpuInfoReader2.alloc_event());
    itor++;
    Test_Reader cpuInfoReader3(itor->ToBytes());
    EXPECT_EQ(NUMBER_03, cpuInfoReader3.number());
    EXPECT_EQ(TV_NSEC_03, cpuInfoReader3.tv_nsec());
    EXPECT_EQ(NAME_03, cpuInfoReader3.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader3.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader3.state());
    EXPECT_EQ(ALLOC_EVENT_03, cpuInfoReader3.alloc_event());
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
    EXPECT_FALSE(cpuInfoReader1.is_test());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    AddCoreTest(cores, {NUMBER_02, TV_NSEC_02, NAME_02, false, ::Test_State(1), 0, FREE_EVENT_02});
    AddCoreTest(cores, {NUMBER_03, TV_NSEC_03, NAME_03, true, ::Test_State(0), ALLOC_EVENT_03, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(COUNT_01, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(NUMBER_01, cpuInfoReader1.number());
    EXPECT_EQ(TV_NSEC_01, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(NAME_01, cpuInfoReader1.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(ALLOC_EVENT_01, cpuInfoReader1.alloc_event());
    itor++;
    Test_Reader cpuInfoReader2(itor->ToBytes());
    EXPECT_EQ(NUMBER_02, cpuInfoReader2.number());
    EXPECT_EQ(TV_NSEC_02, cpuInfoReader2.tv_nsec());
    EXPECT_EQ(NAME_02, cpuInfoReader2.name().ToStdString());
    EXPECT_FALSE(cpuInfoReader2.is_test());
    EXPECT_EQ(::Test_State(1), cpuInfoReader2.state());
    EXPECT_EQ(FREE_EVENT_02, cpuInfoReader2.free_event().ToStdString());
    itor++;
    Test_Reader cpuInfoReader3(itor->ToBytes());
    EXPECT_EQ(NUMBER_03, cpuInfoReader3.number());
    EXPECT_EQ(TV_NSEC_03, cpuInfoReader3.tv_nsec());
    EXPECT_EQ(NAME_03, cpuInfoReader3.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader3.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader3.state());
    EXPECT_EQ(ALLOC_EVENT_03, cpuInfoReader3.alloc_event());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(COUNT_01, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(NUMBER_01, cpuInfoReader1.number());
    EXPECT_EQ(TV_NSEC_01, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(NAME_01, cpuInfoReader1.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(ALLOC_EVENT_01, cpuInfoReader1.alloc_event());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TestParser_Reader testParserReader(str);
    EXPECT_EQ(COUNT_01, testParserReader.count());
    auto core = testParserReader.cores();
    CpuInfoTest_Reader cpuInfoTest(core.data_, core.size_);
    auto itor = cpuInfoTest.test();
    Test_Reader cpuInfoReader1(itor->ToBytes());
    EXPECT_EQ(NUMBER_01, cpuInfoReader1.number());
    EXPECT_EQ(TV_NSEC_01, cpuInfoReader1.tv_nsec());
    EXPECT_EQ(NAME_01, cpuInfoReader1.name().ToStdString());
    EXPECT_TRUE(cpuInfoReader1.is_test());
    EXPECT_EQ(::Test_State(0), cpuInfoReader1.state());
    EXPECT_EQ(ALLOC_EVENT_01, cpuInfoReader1.alloc_event());
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
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    std::string str = "";
    testParser.SerializeToString(&str);

    auto kCountFieldNumber = TestParser_Reader::kCountDataAreaNumber;
    uint64_t count2 = 0;
    auto tsTag = CreateTagVarInt(kCountFieldNumber);
    if (str.size() > 10 && str.data()[0] == tsTag) {
        const uint8_t* nextData = VarIntDecode(reinterpret_cast<const uint8_t*>(str.data() + 1),
                                               reinterpret_cast<const uint8_t*>(str.data() + 11), &count2);
    }
    EXPECT_EQ(COUNT_01, count2);
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
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.FindDataArea(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    EXPECT_EQ(typedProtoTestReader.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32(), NUMBER_01);
    EXPECT_EQ(typedProtoTestReader.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64(), TV_NSEC_01);
    EXPECT_EQ(typedProtoTestReader.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString(), NAME_01);
    EXPECT_TRUE(typedProtoTestReader.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_01, typedProtoTestReader.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    AddCoreTest(cores, {NUMBER_02, TV_NSEC_02, NAME_02, false, ::Test_State(1), ALLOC_EVENT_02, ""});
    AddCoreTest(cores, {NUMBER_03, TV_NSEC_03, NAME_03, true, ::Test_State(0), ALLOC_EVENT_03, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto repeate = typedProtoCpuInfoTest.GetRepeated<BytesView>(CpuInfoTest_Reader::kTestDataAreaNumber);

    TypedProtoReader<7> typedProtoTestReader1(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_01, typedProtoTestReader1.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_01, typedProtoTestReader1.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_01, typedProtoTestReader1.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_TRUE(typedProtoTestReader1.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader1.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_01, typedProtoTestReader1.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32());

    repeate++;
    TypedProtoReader<7> typedProtoTestReader2(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_02, typedProtoTestReader2.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_02, typedProtoTestReader2.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_02, typedProtoTestReader2.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_FALSE(typedProtoTestReader2.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(1), typedProtoTestReader2.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_02, typedProtoTestReader2.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32());

    repeate++;
    TypedProtoReader<7> typedProtoTestReader3(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_03, typedProtoTestReader3.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_03, typedProtoTestReader3.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_03, typedProtoTestReader3.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_TRUE(typedProtoTestReader3.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader3.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_03, typedProtoTestReader3.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    EXPECT_EQ(0, typedProtoTest.FindDataArea(TestParser_Reader::kCountDataAreaNumber).ToInt32());
    auto core = typedProtoTest.FindDataArea(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.FindDataArea(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    EXPECT_EQ(0, typedProtoTestReader.FindDataArea(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(0, typedProtoTestReader.FindDataArea(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ("", typedProtoTestReader.FindDataArea(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_FALSE(typedProtoTestReader.FindDataArea(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader.FindDataArea(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(0, typedProtoTestReader.FindDataArea(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    testParser.set_allocated_cores(cores);
    std::string str = "";
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(COUNT_01, typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32());
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.Get(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    EXPECT_EQ(NUMBER_01, typedProtoTestReader.Get(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_01, typedProtoTestReader.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_01, typedProtoTestReader.Get(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_TRUE(typedProtoTestReader.Get(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader.Get(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_01, typedProtoTestReader.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::CpuInfoTest* cores = new ::CpuInfoTest();
    AddCoreTest(cores, {NUMBER_01, TV_NSEC_01, NAME_01, true, ::Test_State(0), ALLOC_EVENT_01, ""});
    AddCoreTest(cores, {NUMBER_02, TV_NSEC_02, NAME_02, false, ::Test_State(1), ALLOC_EVENT_02, ""});
    AddCoreTest(cores, {NUMBER_03, TV_NSEC_03, NAME_03, true, ::Test_State(0), ALLOC_EVENT_03, ""});
    testParser.set_allocated_cores(cores);
    testParser.SerializeToString(&str);

    TypedProtoReader<2> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(COUNT_01, typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32());
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto repeate = typedProtoCpuInfoTest.GetRepeated<BytesView>(CpuInfoTest_Reader::kTestDataAreaNumber);

    TypedProtoReader<7> typedProtoTestReader1(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_01, typedProtoTestReader1.Get(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_01, typedProtoTestReader1.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_01, typedProtoTestReader1.Get(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_TRUE(typedProtoTestReader1.Get(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader1.Get(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_01, typedProtoTestReader1.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32());

    repeate++;
    TypedProtoReader<7> typedProtoTestReader2(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_02, typedProtoTestReader2.Get(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_02, typedProtoTestReader2.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_02, typedProtoTestReader2.Get(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_FALSE(typedProtoTestReader2.Get(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(1), typedProtoTestReader2.Get(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_02, typedProtoTestReader2.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32());

    repeate++;
    TypedProtoReader<7> typedProtoTestReader3(repeate->ToBytes().data_, repeate->ToBytes().size_);
    EXPECT_EQ(NUMBER_03, typedProtoTestReader3.Get(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(TV_NSEC_03, typedProtoTestReader3.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ(NAME_03, typedProtoTestReader3.Get(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_TRUE(typedProtoTestReader3.Get(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader3.Get(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(ALLOC_EVENT_03, typedProtoTestReader3.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    EXPECT_EQ(0, typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32());
    auto core = typedProtoTest.Get(TestParser_Reader::kCoresDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(core.data_), core.size_);
    auto typtest = typedProtoCpuInfoTest.Get(CpuInfoTest_Reader::kTestDataAreaNumber).ToBytes();
    TypedProtoReader<7> typedProtoTestReader(reinterpret_cast<const uint8_t*>(typtest.data_), typtest.size_);
    EXPECT_EQ(0, typedProtoTestReader.Get(Test_Reader::kNumberDataAreaNumber).ToInt32());
    EXPECT_EQ(0, typedProtoTestReader.Get(Test_Reader::kTvNsecDataAreaNumber).ToUint64());
    EXPECT_EQ("", typedProtoTestReader.Get(Test_Reader::kNameDataAreaNumber).ToStdString());
    EXPECT_FALSE(typedProtoTestReader.Get(Test_Reader::kIsTestDataAreaNumber).ToBool());
    EXPECT_EQ(::Test_State(0), typedProtoTestReader.Get(Test_Reader::kStateDataAreaNumber).ToInt32());
    EXPECT_EQ(0, typedProtoTestReader.Get(Test_Reader::kAllocEventDataAreaNumber).ToInt32());
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
    const int32_t number = 1000;
    const int32_t number1 = 1001;
    const int32_t nameber2 = 1002;
    const int32_t number3 = 1003;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::NumberTest* numberTest = new ::NumberTest();
    numberTest->add_numbertext(number);
    numberTest->add_numbertext(number1);
    numberTest->add_numbertext(nameber2);
    numberTest->add_numbertext(number3);
    testParser.set_allocated_numbertest(numberTest);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<3> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto numberType = typedProtoTest.Get(TestParser_Reader::kNumberTestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(numberType.data_), numberType.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kVarInt, int32_t>(
        NumberTest_Reader::kNumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate++);
    EXPECT_EQ(number1, *packedRepeate++);
    EXPECT_EQ(nameber2, *packedRepeate++);
    EXPECT_EQ(number3, *packedRepeate);
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
    const double number = 1000.01;
    const double number1 = 1001.01;
    const double nameber2 = 1002.01;
    const double number3 = 1003.01;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::Fixed64Test* fixed64Test = new ::Fixed64Test();
    fixed64Test->add_fixed64numbertext(number);
    fixed64Test->add_fixed64numbertext(number1);
    fixed64Test->add_fixed64numbertext(nameber2);
    fixed64Test->add_fixed64numbertext(number3);
    testParser.set_allocated_fixed64test(fixed64Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(COUNT_01, typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32());
    auto fix64Type = typedProtoTest.Get(TestParser_Reader::kFixed64TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix64Type.data_), fix64Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed64, double>(
        Fixed64Test_Reader::kFixed64NumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate++);
    EXPECT_EQ(number1, *packedRepeate++);
    EXPECT_EQ(nameber2, *packedRepeate++);
    EXPECT_EQ(number3, *packedRepeate);
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
    const float number = 1000.01;
    const float number1 = 1001.01;
    const float nameber2 = 1002.01;
    const float number3 = 1003.01;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::Fixed32Test* fixed32Test = new ::Fixed32Test();
    fixed32Test->add_fixed32numbertext(number);
    fixed32Test->add_fixed32numbertext(number1);
    fixed32Test->add_fixed32numbertext(nameber2);
    fixed32Test->add_fixed32numbertext(number3);
    testParser.set_allocated_fixed32test(fixed32Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto fix32Type = typedProtoTest.Get(TestParser_Reader::kFixed32TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix32Type.data_), fix32Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed32, float>(
        Fixed32Test_Reader::kFixed32NumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate++);
    EXPECT_EQ(number1, *packedRepeate++);
    EXPECT_EQ(nameber2, *packedRepeate++);
    EXPECT_EQ(number3, *packedRepeate);
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
    const int32_t number = 1000;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::NumberTest* numberTest = new ::NumberTest();
    numberTest->add_numbertext(number);
    testParser.set_allocated_numbertest(numberTest);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<3> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto numberType = typedProtoTest.Get(TestParser_Reader::kNumberTestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(numberType.data_), numberType.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kVarInt, int32_t>(
        NumberTest_Reader::kNumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate);
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
    const double number = 1000.01;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::Fixed64Test* fixed64Test = new ::Fixed64Test();
    fixed64Test->add_fixed64numbertext(number);
    testParser.set_allocated_fixed64test(fixed64Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto fix64Type = typedProtoTest.Get(TestParser_Reader::kFixed64TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix64Type.data_), fix64Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed64, double>(
        Fixed64Test_Reader::kFixed64NumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate);
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
    const float number = 1000.01;
    std::string str = "";
    testParser.set_count(COUNT_01);
    ::Fixed32Test* fixed32Test = new ::Fixed32Test();
    fixed32Test->add_fixed32numbertext(number);
    testParser.set_allocated_fixed32test(fixed32Test);
    testParser.SerializeToString(&str);
    bool parserError = true;

    TypedProtoReader<5> typedProtoTest(reinterpret_cast<const uint8_t*>(str.data()), str.size());
    EXPECT_EQ(typedProtoTest.Get(TestParser_Reader::kCountDataAreaNumber).ToInt32(), COUNT_01);
    auto fix32Type = typedProtoTest.Get(TestParser_Reader::kFixed32TestDataAreaNumber).ToBytes();
    TypedProtoReader<1> typedProtoCpuInfoTest(reinterpret_cast<const uint8_t*>(fix32Type.data_), fix32Type.size_);
    auto packedRepeate = typedProtoCpuInfoTest.GetPackedRepeated<ProtoWireType::kFixed32, float>(
        Fixed32Test_Reader::kFixed32NumberTextDataAreaNumber, &parserError);
    EXPECT_EQ(number, *packedRepeate);
}
} // namespace TraceStreamer
} // namespace SysTuning
