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

#include "filter_filter.h"
#include "measure_filter.h"
#include "process_filter.h"
#include "slice_filter.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
uint64_t TS_01 = 168758663018000;
uint32_t PID_01 = 2532;
uint32_t TGID_01 = 2519;
uint64_t TS_02 = 168758663028000;
uint32_t PID_02 = 2533;
uint32_t TGID_02 = 2529;
uint64_t TS_03 = 168758679303000;
uint64_t TS_04 = 168758682456000;
uint64_t TS_05 = 168758682466000;
uint64_t TS_06 = 168758679343000;
uint64_t TS_07 = 168758682456000;
uint64_t TS_08 = 168758682466000;
uint64_t TS_09 = 168758682476000;
uint64_t TS_10 = 168758679343000;
uint64_t TS_11 = 168758679344000;
uint64_t TS_12 = 168758689323000;

class SliceFilterTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

public:
    TraceStreamerSelector stream_;
};

/**
 * @tc.name: SliceTestOnceCall
 * @tc.desc: Parse once method call stack
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, SliceTestOnceCall, TestSize.Level1)
{
    TS_LOGI("test28-1");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_01, PID_01, TGID_01, cat, splitStrIndex);
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_02, PID_01, TGID_01);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 1);
    EXPECT_TRUE(slices->DursData()[0] == TS_02 - TS_01);
}

/**
 * @tc.name: SliceTestNestedTwoMethod
 * @tc.desc: Parse Nested call stack of two methods
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, SliceTestNestedTwoMethod, TestSize.Level1)
{
    TS_LOGI("test28-2");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_01, PID_01, TGID_01, cat, splitStrIndex);
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("call_function_two");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_02, PID_01, TGID_01, cat, splitStrIndex);
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_03, PID_01, TGID_01);
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_04, PID_01, TGID_01);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 2);
    EXPECT_TRUE(slices->DursData()[0] == TS_04 - TS_01);
    EXPECT_TRUE(slices->DursData()[1] == TS_03 - TS_02);
    EXPECT_TRUE(slices->Depths()[1] == 1);
}

/**
 * @tc.name: SliceTestNestedTwoMethodStackAndOneMethodStack
 * @tc.desc: Parse Nested call stack of two methods and one method call stack
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, SliceTestNestedTwoMethodStackAndOneMethodStack, TestSize.Level1)
{
    TS_LOGI("test28-3");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_01, PID_01, TGID_01, cat, splitStrIndex); // slice 0
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_02, PID_02, TGID_02, cat, splitStrIndex);
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_two");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_03, PID_01, TGID_01, cat, splitStrIndex); // slice 2
    // end thread_one_call_function_two
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_04, PID_01, TGID_01);
    // end thread_one_call_function_one
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_05, PID_01, TGID_01);
    // end thread_two_call_function_one slice 1
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_06, PID_02, TGID_02);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 3);
    EXPECT_TRUE(slices->DursData()[0] == TS_05 - TS_01); // slice 0
    EXPECT_TRUE(slices->Depths()[0] == 0);
    EXPECT_TRUE(slices->DursData()[1] == TS_06 - TS_02); // slice 1
    EXPECT_TRUE(slices->Depths()[1] == 0);
    EXPECT_TRUE(slices->DursData()[2] == TS_04 - TS_03); // slice 2
    EXPECT_TRUE(slices->Depths()[2] == 1);
}

/**
 * @tc.name: SliceTestWithoutBeginSlice
 * @tc.desc: Test EndSlice without BeginSlice
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, SliceTestWithoutBeginSlice, TestSize.Level1)
{
    TS_LOGI("test28-4");
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_01, PID_01, TGID_01);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 0);
}

/**
 * @tc.name: SliceTestWithMultiNestedCall
 * @tc.desc: Parse multi nested call stack
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, SliceTestWithMultiNestedCall, TestSize.Level1)
{
    TS_LOGI("test28-5");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_01, PID_01, TGID_01, cat, splitStrIndex); // slice 0
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_one");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_02, PID_02, TGID_02, cat, splitStrIndex);
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_two");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_03, PID_01, TGID_01, cat, splitStrIndex); // slice 2
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_two");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_04, PID_02, TGID_02, cat, splitStrIndex);
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_three");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_05, PID_01, TGID_01, cat, splitStrIndex); // slice 4
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_three");
    stream_.streamFilters_->sliceFilter_->BeginSlice("comm", TS_06, PID_02, TGID_02, cat, splitStrIndex);
    // end thread_one_call_function_three
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_07, PID_01, TGID_01);
    // end thread_one_call_function_two
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_08, PID_01, TGID_01);
    // end thread_one_call_function_one
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_09, PID_01, TGID_01);
    // end thread_two_call_function_three slice 5
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_10, PID_02, TGID_02);
    // end thread_two_call_function_two slice 3
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_11, PID_02, TGID_02);
    // end thread_two_call_function_one slice 1
    stream_.streamFilters_->sliceFilter_->EndSlice(TS_12, PID_02, TGID_02);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 6);
    EXPECT_TRUE(slices->DursData()[0] == TS_09 - TS_01); // slice 0
    EXPECT_TRUE(slices->Depths()[0] == 0);
    EXPECT_TRUE(slices->DursData()[1] == TS_12 - TS_02); // slice 1
    EXPECT_TRUE(slices->Depths()[1] == 0);
    EXPECT_TRUE(slices->DursData()[2] == TS_08 - TS_03); // slice 2
    EXPECT_TRUE(slices->Depths()[2] == 1);
    EXPECT_TRUE(slices->DursData()[3] == TS_11 - TS_04); // slice 3
    EXPECT_TRUE(slices->Depths()[3] == 1);
    EXPECT_TRUE(slices->DursData()[4] == TS_07 - TS_05); // slice 4
    EXPECT_TRUE(slices->DursData()[5] == TS_10 - TS_06); // slice 5
}

/**
 * @tc.name: AsyncTest
 * @tc.desc: Test once asynchronous method call stack
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, AsyncTest, TestSize.Level1)
{
    TS_LOGI("test28-6");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("async_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_01, PID_01, TGID_01, cat, splitStrIndex); // slice 0
    splitStrIndex = stream_.traceDataCache_->GetDataIndex("async_call_function_one");
    // end thread_one_call_function_three
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_02, PID_01, TGID_01, cat, splitStrIndex);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 1);
    EXPECT_TRUE(slices->DursData()[0] == TS_02 - TS_01); // slice 0
}

/**
 * @tc.name: FinishAsyncSliceWithoutStart
 * @tc.desc: Finish async slice without start
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, FinishAsyncSliceWithoutStart, TestSize.Level1)
{
    TS_LOGI("test28-7");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("async_call_function_one");
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_01, PID_01, TGID_01, cat, splitStrIndex);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 0);
}

/**
 * @tc.name: AsyncTestTwiceCallStack
 * @tc.desc: Test Twice asynchronous call stack
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, AsyncTestTwiceCallStack, TestSize.Level1)
{
    TS_LOGI("test28-8");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_01, PID_01, TGID_01, cat, splitStrIndex); // slice 0
    DataIndex index2 = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_02, PID_02, TGID_02, cat, index2);
    // end thread_one_call_function_three
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_03, PID_01, TGID_01, cat, splitStrIndex);
    // end thread_two_call_function_three slice 5
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_04, PID_02, TGID_02, cat, index2);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 2);
    EXPECT_TRUE(slices->DursData()[0] == TS_03 - TS_01); // slice 0
    EXPECT_TRUE(slices->Depths()[0] == 0);
    EXPECT_TRUE(slices->DursData()[1] == TS_04 - TS_02); // slice 1
}

/**
 * @tc.name: BeginAsyncSliceThreeTimes
 * @tc.desc: Test asynchronous call three times
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, BeginAsyncSliceThreeTimes, TestSize.Level1)
{
    TS_LOGI("test28-9");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex splitStrIndex = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_01, PID_01, TGID_01, cat, splitStrIndex); // slice 0
    DataIndex index2 = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_02, PID_02, TGID_02, cat, index2);
    DataIndex index3 = stream_.traceDataCache_->GetDataIndex("thread_three_call_function_two");
    DataIndex cat2 = stream_.traceDataCache_->GetDataIndex("Catalog2");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_03, PID_01, TGID_01, cat2, index3); // slice 2
    // end thread_one_call_function_three
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_04, PID_01, TGID_01, cat, splitStrIndex);
    // end thread_one_call_function_two
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_05, PID_01, TGID_01, cat2, index3);
    // end thread_two_call_function_three slice 5
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_06, PID_02, TGID_02, cat, index2);
    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 3);
    EXPECT_TRUE(slices->DursData()[0] == TS_04 - TS_01); // slice 0
    EXPECT_TRUE(slices->Depths()[0] == 0);
    EXPECT_TRUE(slices->DursData()[1] == TS_06 - TS_02); // slice 1
    EXPECT_TRUE(slices->Depths()[1] == 0);
    EXPECT_TRUE(slices->DursData()[2] == TS_05 - TS_03); // slice 2
}

/**
 * @tc.name: BeginSliceMultiTimes
 * @tc.desc: Test asynchronous call muti times
 * @tc.type: FUNC
 */
HWTEST_F(SliceFilterTest, BeginSliceMultiTimes, TestSize.Level1)
{
    TS_LOGI("test28-10");
    DataIndex cat = stream_.traceDataCache_->GetDataIndex("Catalog");
    DataIndex index = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_01, PID_01, TGID_01, cat, index); // slice 0
    DataIndex index2 = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_one");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_02, PID_02, TGID_02, cat, index2); // slice 1
    DataIndex index3 = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_two");
    DataIndex cat2 = stream_.traceDataCache_->GetDataIndex("Catalog2");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_03, PID_01, TGID_01, cat2, index3); // slice 2
    DataIndex index4 = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_two");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_04, PID_02, TGID_02, cat2, index4); // slice 3
    DataIndex index5 = stream_.traceDataCache_->GetDataIndex("thread_one_call_function_three");
    DataIndex cat3 = stream_.traceDataCache_->GetDataIndex("Catalog3");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_05, PID_01, TGID_01, cat3, index5); // slice 4
    DataIndex index6 = stream_.traceDataCache_->GetDataIndex("thread_two_call_function_three");
    stream_.streamFilters_->sliceFilter_->StartAsyncSlice(TS_06, PID_02, TGID_02, cat3, index6); // slice 5

    // end thread_one_call_function_three
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_07, PID_01, TGID_01, cat, index); // end slice 0
    // end thread_one_call_function_two
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_08, PID_02, TGID_02, cat, index2); // end slice 1
    // end thread_one_call_function_one
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_09, PID_01, TGID_01, cat2, index3); // end slice 2
    // end thread_two_call_function_three slice 5
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_10, PID_02, TGID_02, cat2, index4); // end slice 3
    // end thread_two_call_function_two slice 3
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_11, PID_01, TGID_01, cat3, index5); // end slice 4
    // end thread_two_call_function_one slice 1
    stream_.streamFilters_->sliceFilter_->FinishAsyncSlice(TS_12, PID_02, TGID_02, cat3, index6); // end slice 5

    auto slices = stream_.traceDataCache_->GetInternalSlicesData();
    EXPECT_TRUE(slices->Size() == 6);
    EXPECT_TRUE(slices->DursData()[0] == TS_07 - TS_01); // slice 0
    EXPECT_TRUE(slices->Depths()[0] == 0);
    EXPECT_TRUE(slices->DursData()[1] == TS_08 - TS_02); // slice 1
    EXPECT_TRUE(slices->Depths()[1] == 0);
    EXPECT_TRUE(slices->DursData()[2] == TS_09 - TS_03); // slice 2
    EXPECT_TRUE(slices->Depths()[2] == 0);
    EXPECT_TRUE(slices->DursData()[3] == TS_10 - TS_04); // slice 3
    EXPECT_TRUE(slices->Depths()[3] == 0);
    EXPECT_TRUE(slices->DursData()[4] == TS_11 - TS_05); // slice 4
    EXPECT_TRUE(slices->DursData()[5] == TS_12 - TS_06); // slice 5
}
} // namespace TraceStreamer
} // namespace SysTuning
