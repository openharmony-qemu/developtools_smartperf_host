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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#define private public
#include "filter_filter.h"
#include "measure_filter.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
constexpr int32_t CPU_ID_0 = 0;
constexpr int32_t CPU_ID_1 = 1;
constexpr std::string_view CPU_TYPE_0 = "cpu_idle";
constexpr std::string_view CPU_TYPE_1 = "cpu_frequency";
constexpr int32_t INTERNAL_THREAD_ID_0 = 1;
constexpr int32_t INTERNAL_THREAD_ID_1 = 2;
constexpr int32_t INTERNAL_PROCESS_ID_0 = 1;
constexpr int32_t INTERNAL_PROCESS_ID_1 = 2;
constexpr std::string_view TASK_NAME_0 = "softbus_server";
constexpr std::string_view TASK_NAME_1 = "hiprofilerd";

class MeasureFilterTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: CpuFilter
 * @tc.desc: Test GetOrCreateFilterId interface of class CpuFilter
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, CpuFilter, TestSize.Level1)
{
    TS_LOGI("test23-3");
    auto nameIndex_0 = stream_.traceDataCache_->GetDataIndex(CPU_TYPE_0);
    auto &measureFilter = stream_.streamFilters_->measureFilter_;
    uint32_t filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CPU, CPU_ID_0, nameIndex_0);
    EXPECT_TRUE(filterId == 0);

    auto nameIndex_1 = stream_.traceDataCache_->GetDataIndex(CPU_TYPE_1);
    filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CPU, CPU_ID_1, nameIndex_1);
    EXPECT_TRUE(filterId == 1);

    Filter *filterTable = stream_.traceDataCache_->GetFilterData();
    EXPECT_TRUE(filterTable->Size() == 2);

    CpuMeasureFilter *cpuMeasureTable = stream_.traceDataCache_->GetCpuMeasuresData();
    EXPECT_TRUE(cpuMeasureTable->Size() == 2);
    EXPECT_TRUE(cpuMeasureTable->IdsData()[0] == 0);
    EXPECT_TRUE(cpuMeasureTable->IdsData()[1] == 1);
    EXPECT_TRUE(cpuMeasureTable->CpuData()[0] == CPU_ID_0);
    EXPECT_TRUE(cpuMeasureTable->CpuData()[1] == CPU_ID_1);
}

/**
 * @tc.name: ClockRateFilter
 * @tc.desc: Test GetOrCreateFilterId interface of class ClockRateFilter
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, ClockRateFilter, TestSize.Level1)
{
    TS_LOGI("test23-5");
    auto nameIndex_0 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_0);
    auto &measureFilter = stream_.streamFilters_->measureFilter_;
    uint32_t filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_RATE, CPU_ID_0, nameIndex_0);
    EXPECT_TRUE(filterId == 0);

    auto nameIndex_1 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_1);
    filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_RATE, CPU_ID_1, nameIndex_1);
    EXPECT_TRUE(filterId == 1);

    Filter *filterTable = stream_.traceDataCache_->GetFilterData();
    EXPECT_TRUE(filterTable->Size() == 2);

    ClockEventData *clockEventTable = stream_.traceDataCache_->GetClockEventFilterData();
    EXPECT_TRUE(clockEventTable->Size() == 2);
    EXPECT_TRUE(clockEventTable->CpusData()[0] == CPU_ID_0);
    EXPECT_TRUE(clockEventTable->CpusData()[1] == CPU_ID_1);
    EXPECT_TRUE(clockEventTable->NamesData()[0] == nameIndex_0);
    EXPECT_TRUE(clockEventTable->NamesData()[1] == nameIndex_1);
}

/**
 * @tc.name: ClockEnableFilter
 * @tc.desc: Test GetOrCreateFilterId interface of class ClockEnableFilter
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, ClockEnableFilter, TestSize.Level1)
{
    TS_LOGI("test23-6");
    auto &measureFilter = stream_.streamFilters_->measureFilter_;
    auto nameIndex_0 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_0);
    uint32_t filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_ENABLE, CPU_ID_0, nameIndex_0);
    EXPECT_TRUE(filterId == 0);

    auto nameIndex_1 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_1);
    filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_ENABLE, CPU_ID_1, nameIndex_1);
    EXPECT_TRUE(filterId == 1);

    Filter *filterTable = stream_.traceDataCache_->GetFilterData();
    EXPECT_TRUE(filterTable->Size() == 2);

    ClockEventData *clockEventTable = stream_.traceDataCache_->GetClockEventFilterData();
    EXPECT_TRUE(clockEventTable->Size() == 2);
    EXPECT_TRUE(clockEventTable->CpusData()[0] == CPU_ID_0);
    EXPECT_TRUE(clockEventTable->CpusData()[1] == CPU_ID_1);
    EXPECT_TRUE(clockEventTable->NamesData()[0] == nameIndex_0);
    EXPECT_TRUE(clockEventTable->NamesData()[1] == nameIndex_1);
}

/**
 * @tc.name: ClockDisableFilter
 * @tc.desc: Test GetOrCreateFilterId interface of class ClockDisableFilter
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, ClockDisableFilter, TestSize.Level1)
{
    TS_LOGI("test23-7");
    auto &measureFilter = stream_.streamFilters_->measureFilter_;
    auto nameIndex_0 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_0);
    uint32_t filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_DISABLE, CPU_ID_0, nameIndex_0);
    EXPECT_TRUE(filterId == 0);

    auto nameIndex_1 = stream_.traceDataCache_->GetDataIndex(TASK_NAME_1);
    filterId = measureFilter->GetOrCreateFilterId(EnumMeasureFilter::CLOCK_DISABLE, CPU_ID_1, nameIndex_1);
    EXPECT_TRUE(filterId == 1);

    Filter *filterTable = stream_.traceDataCache_->GetFilterData();
    EXPECT_TRUE(filterTable->Size() == 2);

    ClockEventData *clockEventTable = stream_.traceDataCache_->GetClockEventFilterData();
    EXPECT_TRUE(clockEventTable->Size() == 2);
    EXPECT_TRUE(clockEventTable->CpusData()[0] == CPU_ID_0);
    EXPECT_TRUE(clockEventTable->CpusData()[1] == CPU_ID_1);
    EXPECT_TRUE(clockEventTable->NamesData()[0] == nameIndex_0);
    EXPECT_TRUE(clockEventTable->NamesData()[1] == nameIndex_1);
}

/**
 * @tc.name: MeasureFilterTest
 * @tc.desc: Test GetOrCreateFilterId interface of class MeasureFilterTest
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, MeasureFilterTest, TestSize.Level1)
{
    TS_LOGI("test23-8");
    uint64_t itid = 1;
    const std::string_view MEASURE_ITEM_NAME = "mem_rss";
    auto nameIndex0 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, itid, nameIndex0,
                                                                 168758682476000, 1200);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().Size() == 1);
}

/**
 * @tc.name: MeasureFilterAddMultiMemToSingleThread
 * @tc.desc: Test GetOrCreateFilterId interface of class MeasureFilterTest, Adding multiple memory information tests to
 * the same thread
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, MeasureFilterAddMultiMemToSingleThread, TestSize.Level1)
{
    TS_LOGI("test23-9");
    uint64_t itid = 1;
    const std::string_view MEASURE_ITEM_NAME = "mem_rss";
    auto nameIndex0 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, itid, nameIndex0,
                                                                 168758682476000, 1200);
    const std::string_view MEASURE_ITEM_NAME2 = "mem_vm";
    auto nameIndex1 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME2);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, itid, nameIndex1,
                                                                 168758682477000, 9200);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().Size() == 2);
}

/**
 * @tc.name: MeasureFilterAddMultiMemToMultiThread
 * @tc.desc: Test GetOrCreateFilterId interface of class MeasureFilterTest, Adding multiple memory information to multi
 * thread
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, MeasureFilterAddMultiMemToMultiThread, TestSize.Level1)
{
    TS_LOGI("test23-10");
    uint64_t itid = 1;
    uint64_t itid2 = 2;
    const std::string_view MEASURE_ITEM_NAME = "mem_rss";
    auto nameIndex0 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, itid, nameIndex0,
                                                                 168758682476000, 1200);
    const std::string_view MEASURE_ITEM_NAME2 = "mem_vm";
    auto nameIndex1 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME2);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, itid2, nameIndex1,
                                                                 168758682477000, 9200);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().Size() == 2);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().ValuesData()[0] == 1200);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstProcessMeasureData().ValuesData()[1] == 9200);
}

/**
 * @tc.name: MeasureFilterAddPerfclLfMux
 * @tc.desc: Add perfcl_ lf_mux status test
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, MeasureFilterAddPerfclLfMux, TestSize.Level1)
{
    TS_LOGI("test23-11");
    uint64_t cpuId = 1;
    int64_t state = 0;
    const std::string_view MEASURE_ITEM_NAME = "perfcl_lf_mux";
    auto nameIndex0 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::CLOCK_DISABLE, cpuId, nameIndex0,
                                                                 168758682476000, state);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstMeasureData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstMeasureData().ValuesData()[0] == state);
}

/**
 * @tc.name: MeasureFilterAddPerfclPll
 * @tc.desc: Add perfcl_pll status test
 * @tc.type: FUNC
 */
HWTEST_F(MeasureFilterTest, MeasureFilterAddPerfclPll, TestSize.Level1)
{
    TS_LOGI("test23-12");
    uint64_t cpuId = 1;
    int64_t state = 1747200000;
    const std::string_view MEASURE_ITEM_NAME = "perfcl_pll";
    auto nameIndex0 = stream_.traceDataCache_->GetDataIndex(MEASURE_ITEM_NAME);
    stream_.streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::CLOCK_RATE, cpuId, nameIndex0,
                                                                 168758682476000, state);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstMeasureData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstMeasureData().ValuesData()[0] == state);
}
} // namespace TraceStreamer
} // namespace SysTuning
