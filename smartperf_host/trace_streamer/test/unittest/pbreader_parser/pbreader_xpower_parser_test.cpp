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

#include <fcntl.h>
#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <string>

#define private public
#include "parser/common_types.h"
#include "pbreader_xpower_parser.h"
#include "trace_streamer_selector.h"
#include "xpower_plugin_result.pb.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace PbReaderXPowerDataParserUnitTest {
const int64_t START_TS1 = 1;
const int64_t END_TS1 = 3;
const int64_t BATTERY_CAPACITY = 0;
const int64_t BATTERY_CHARGE = 1;
const int64_t BATTERY_GAS_GAUGE = 2;
const int64_t BATTERY_LEVEL = 3;
const int64_t BATTERY_SCREEN = 4;
const int64_t BATTERY_REAL_CURRENT1 = 5;
const int32_t BATTERY_REAL_CURRENT2 = 6;
const std::string BUNDLE_NAME = "test";
const int64_t SHELL_TEMP = 0;
const int64_t THERMAL_LEVEL = 1;
const int64_t AUDIO_ENERGY = 2;
const int64_t WIFI_ENERGY = 1;
const int64_t THREAD_LOAD = 2;
const std::string THREAD_NAME = "thread";
const int64_t THREAD_TIME = 1;
const int64_t THREAD_ENERGY = 2;
const int64_t GPU_FREQUENCY = 100;
const int64_t GPU_IDLE_TIME = 101;
const int64_t GPU_RUN_TIME = 102;
const int64_t WIFI_TX_PACKETS = 200;
const int64_t WIFI_RX_PACKETS = 201;
const int64_t WIFI_TX_BYTES = 202;
const int64_t WIFI_RX_BYTES = 203;
const int64_t DISPLAY_COUNT_1HZ = 301;
const int64_t DISPLAY_COUNT_5HZ = 302;
const int64_t DISPLAY_COUNT_10HZ = 303;
const int64_t DISPLAY_COUNT_15HZ = 304;
const int64_t DISPLAY_COUNT_24HZ = 305;
const int64_t DISPLAY_COUNT_30HZ = 306;
const int64_t DISPLAY_COUNT_45HZ = 307;
const int64_t DISPLAY_COUNT_60HZ = 308;
const int64_t DISPLAY_COUNT_90HZ = 309;
const int64_t DISPLAY_COUNT_120HZ = 310;
const int64_t DISPLAY_COUNT_180HZ = 311;
const uint64_t START_TIME = 585717485310726;
const uint64_t END_TIME = 585717485310900;
const int64_t BACKGROUN_DDURATION = 9000;
const int64_t BACKGROUND_ENERGY = 57;
const int64_t FOREGROUND_DURATION = 11109;
const int64_t FOREGROUND_ENERGY = 2884;
const int64_t SCREEN_OFF_DURATION = 2884;
const int64_t SCREEN_OFF_ENERGY = 2884;
const int64_t SCREEN_ON_DURATION = 2884;
const int64_t SCREEN_ON_ENERGY = 2884;
const int64_t UID = 2001;
const int64_t LOAD = 112;

class PbReaderXPowerParserTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
        optimizeReport_ = std::make_unique<OptimizeReport>();
        optimizeReport_->set_start_time(START_TS1);
        optimizeReport_->set_end_time(END_TS1);
        optimizeReport_->set_bundle_name(BUNDLE_NAME.c_str());
        dataSeg_ = std::make_unique<PbreaderDataSegment>();
        dataSeg_->dataType = DATA_SOURCE_TYPE_XPOWER;
        dataSeg_->clockId = TS_CLOCK_BOOTTIME;
        dataSeg_->status = TS_PARSE_STATUS_PARSED;
        dataSeg_->timeStamp = START_TS1;
        xPowerParser_ =
            std::make_unique<PbreaderXpowerParser>(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    }
    void InitPbReaderAndParse()
    {
        std::string optimizeReportStrMsg = "";
        optimizeReport_->SerializeToString(&optimizeReportStrMsg);
        ProtoReader::BytesView optimizeReportBytesView(reinterpret_cast<const uint8_t *>(optimizeReportStrMsg.data()),
                                                       optimizeReportStrMsg.size());
        if (dataSeg_ != nullptr && xPowerParser_ != nullptr) {
            dataSeg_->protoData = optimizeReportBytesView;
            xPowerParser_->Parse(*dataSeg_.get(), dataSeg_->timeStamp, dataSeg_->clockId);
        }
    }
    void TearDown()
    {
        optimizeReport_.reset();
        dataSeg_.reset();
        xPowerParser_.reset();
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
    std::unique_ptr<OptimizeReport> optimizeReport_ = nullptr;
    std::unique_ptr<PbreaderDataSegment> dataSeg_ = nullptr;
    std::unique_ptr<PbreaderXpowerParser> xPowerParser_ = nullptr;
};

/**
 * @tc.name: ParseRealBatteryTest
 * @tc.desc: test RealBattery message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseRealBatteryTest, TestSize.Level1)
{
    TS_LOGI("test47-1");
    RealBattery *realBattery = new RealBattery();
    realBattery->set_capacity(BATTERY_CAPACITY);
    realBattery->set_charge(BATTERY_CHARGE);
    realBattery->set_gas_gauge(BATTERY_GAS_GAUGE);
    realBattery->set_level(BATTERY_LEVEL);
    realBattery->set_screen(BATTERY_SCREEN);
    auto realCurrent = realBattery->mutable_real_current();
    realCurrent->Add(BATTERY_REAL_CURRENT1);
    realCurrent->Add(BATTERY_REAL_CURRENT2);
    optimizeReport_->set_allocated_real_battery(realBattery);
    InitPbReaderAndParse();
    EXPECT_STREQ(stream_.traceDataCache_->GetConstTraceConfigData().Value()[0].c_str(), BUNDLE_NAME.c_str());
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().TimeStampData()[0], START_TS1 * MSEC_TO_NS);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_CAPACITY], BATTERY_CAPACITY);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_CHARGE], BATTERY_CHARGE);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_GAS_GAUGE], BATTERY_GAS_GAUGE);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_LEVEL], BATTERY_LEVEL);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_SCREEN], BATTERY_SCREEN);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_REAL_CURRENT1],
              BATTERY_REAL_CURRENT1);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[BATTERY_REAL_CURRENT2],
              BATTERY_REAL_CURRENT2);
}

/**
 * @tc.name: ParseThermalReportTest
 * @tc.desc: test ThermalReport message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseThermalReportTest, TestSize.Level1)
{
    TS_LOGI("test47-2");
    ThermalReport *thermalReport = new ThermalReport();
    thermalReport->set_shell_temp(SHELL_TEMP);
    thermalReport->set_thermal_level(THERMAL_LEVEL);
    optimizeReport_->set_allocated_thermal_report(thermalReport);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[SHELL_TEMP], SHELL_TEMP);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXpowerMeasureData().ValuesData()[THERMAL_LEVEL], THERMAL_LEVEL);
}

/**
 * @tc.name: ParseAppStatisticTest
 * @tc.desc: test AppStatistic message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseAppStatisticTest, TestSize.Level1)
{
    TS_LOGI("test47-3");
    AppStatisticCommon *audio = new AppStatisticCommon();
    audio->set_energy(AUDIO_ENERGY);
    audio->set_time(START_TS1);
    AppStatisticCommon *wifi = new AppStatisticCommon();
    wifi->set_energy(WIFI_ENERGY);
    wifi->set_time(END_TS1);

    AppStatistic *appStatistic = new AppStatistic();
    appStatistic->set_allocated_audio(audio);
    appStatistic->set_allocated_wifi(wifi);

    optimizeReport_->set_allocated_app_statistic(appStatistic);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppStatisticInfo().EnergysData()[0], AUDIO_ENERGY);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppStatisticInfo().EnergysData()[WIFI_ENERGY], WIFI_ENERGY);
}

/**
 * @tc.name: ParseAppDetailCPUTest
 * @tc.desc: test AppDetailCPU message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseAppDetailCPUTest, TestSize.Level1)
{
    TS_LOGI("test47-4");
    AppDetailCPU *cpuDetail = new AppDetailCPU();
    cpuDetail->add_thread_load(THREAD_LOAD);
    cpuDetail->add_thread_name(THREAD_NAME.c_str());
    cpuDetail->add_thread_time(THREAD_TIME);
    cpuDetail->add_thread_energy(THREAD_ENERGY);

    AppDetail *appDetail = new AppDetail();
    appDetail->set_allocated_cpu(cpuDetail);

    optimizeReport_->set_allocated_app_detail(appDetail);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailCPUInfo().ThreadNamesData()[0],
              stream_.traceDataCache_->GetDataIndex(THREAD_NAME.c_str()));
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailCPUInfo().ThreadTimesData()[0], THREAD_TIME);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailCPUInfo().ThreadLoadsData()[0], THREAD_LOAD);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailCPUInfo().ThreadEnergysData()[0], THREAD_ENERGY);
}

/**
 * @tc.name: ParseAppDetailGPUTest
 * @tc.desc: test AppDetailGPU message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseAppDetailGPUTest, TestSize.Level1)
{
    TS_LOGI("test47-5");
    AppDetailGPU *gpuDetail = new AppDetailGPU();
    gpuDetail->add_frequency(GPU_FREQUENCY);
    gpuDetail->add_idle_time(GPU_IDLE_TIME);
    gpuDetail->add_run_time(GPU_RUN_TIME);

    AppDetail *appDetail = new AppDetail();
    appDetail->set_allocated_gpu(gpuDetail);

    optimizeReport_->set_allocated_app_detail(appDetail);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailGPUInfo().FrequencysData()[0], GPU_FREQUENCY);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailGPUInfo().IdleTimesData()[0], GPU_IDLE_TIME);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailGPUInfo().RuntimesData()[0], GPU_RUN_TIME);
}

/**
 * @tc.name: ParseAppDetailWifiTest
 * @tc.desc: test AppDetailWifi message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseAppDetailWifiTest, TestSize.Level1)
{
    TS_LOGI("test47-6");
    AppDetailWifi *wifiDetail = new AppDetailWifi();
    wifiDetail->set_tx_packets(WIFI_TX_PACKETS);
    wifiDetail->set_rx_packets(WIFI_RX_PACKETS);
    wifiDetail->set_tx_bytes(WIFI_TX_BYTES);
    wifiDetail->set_rx_bytes(WIFI_RX_BYTES);

    AppDetail *appDetail = new AppDetail();
    appDetail->set_allocated_wifi(wifiDetail);

    optimizeReport_->set_allocated_app_detail(appDetail);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailWifiInfo().TxPacketsData()[0], WIFI_TX_PACKETS);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailWifiInfo().RxPacketsData()[0], WIFI_RX_PACKETS);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailWifiInfo().TxBytesData()[0], WIFI_TX_BYTES);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailWifiInfo().RxBytesData()[0], WIFI_RX_BYTES);
}

/**
 * @tc.name: ParseAppDetailDisplayTest
 * @tc.desc: test AppDetailDisplay message parse
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseAppDetailDisplayTest, TestSize.Level1)
{
    TS_LOGI("test47-7");
    AppDetailDisplay *displayDetail = new AppDetailDisplay();
    displayDetail->set_count_1hz(DISPLAY_COUNT_1HZ);
    displayDetail->set_count_5hz(DISPLAY_COUNT_5HZ);
    displayDetail->set_count_10hz(DISPLAY_COUNT_10HZ);
    displayDetail->set_count_15hz(DISPLAY_COUNT_15HZ);
    displayDetail->set_count_24hz(DISPLAY_COUNT_24HZ);
    displayDetail->set_count_30hz(DISPLAY_COUNT_30HZ);
    displayDetail->set_count_45hz(DISPLAY_COUNT_45HZ);
    displayDetail->set_count_60hz(DISPLAY_COUNT_60HZ);
    displayDetail->set_count_90hz(DISPLAY_COUNT_90HZ);
    displayDetail->set_count_120hz(DISPLAY_COUNT_120HZ);
    displayDetail->set_count_180hz(DISPLAY_COUNT_180HZ);

    AppDetail *appDetail = new AppDetail();
    appDetail->set_allocated_display(displayDetail);

    optimizeReport_->set_allocated_app_detail(appDetail);
    InitPbReaderAndParse();
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count1HertzsData()[0], DISPLAY_COUNT_1HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count5HertzsData()[0], DISPLAY_COUNT_5HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count10HertzsData()[0], DISPLAY_COUNT_10HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count15HertzsData()[0], DISPLAY_COUNT_15HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count24HertzsData()[0], DISPLAY_COUNT_24HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count30HertzsData()[0], DISPLAY_COUNT_30HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count45HertzsData()[0], DISPLAY_COUNT_45HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count60HertzsData()[0], DISPLAY_COUNT_60HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count90HertzsData()[0], DISPLAY_COUNT_90HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count120HertzsData()[0],
              DISPLAY_COUNT_120HZ);
    EXPECT_EQ(stream_.traceDataCache_->GetConstXPowerAppDetailDisplayInfo().Count180HertzsData()[0],
              DISPLAY_COUNT_180HZ);
}

void FillComponentTopAudioData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_audio()->set_count(1);
    report.mutable_component_top()->mutable_audio()->add_appname("audio_app");
    report.mutable_component_top()->mutable_audio()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_audio()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_audio()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_audio()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_audio()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_audio()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_audio()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_audio()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopBluetoothData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_bluetooth()->set_count(1);
    report.mutable_component_top()->mutable_bluetooth()->add_appname("bluetooth_app");
    report.mutable_component_top()->mutable_bluetooth()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_bluetooth()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_bluetooth()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_bluetooth()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_bluetooth()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_bluetooth()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_bluetooth()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_bluetooth()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopFlashlightData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_flashlight()->set_count(1);
    report.mutable_component_top()->mutable_flashlight()->add_appname("flashlight_app");
    report.mutable_component_top()->mutable_flashlight()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_flashlight()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_flashlight()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_flashlight()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_flashlight()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_flashlight()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_flashlight()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_flashlight()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopLocationData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_location()->set_count(1);
    report.mutable_component_top()->mutable_location()->add_appname("location_app");
    report.mutable_component_top()->mutable_location()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_location()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_location()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_location()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_location()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_location()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_location()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_location()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopWifiscanData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_wifiscan()->set_count(1);
    report.mutable_component_top()->mutable_wifiscan()->add_appname("wifiscan_app");
    report.mutable_component_top()->mutable_wifiscan()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_wifiscan()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_wifiscan()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_wifiscan()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_wifiscan()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_wifiscan()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_wifiscan()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_wifiscan()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopDisplayData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_display()->set_count(1);
    report.mutable_component_top()->mutable_display()->add_appname("display_app");
    report.mutable_component_top()->mutable_display()->add_time(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_display()->add_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopGpuData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_gpu()->set_count(1);
    report.mutable_component_top()->mutable_gpu()->add_appname("gpu_app");
    report.mutable_component_top()->mutable_gpu()->add_time(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_gpu()->add_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopCameraData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_camera()->set_count(1);
    report.mutable_component_top()->mutable_camera()->add_appname("camera_app");
    report.mutable_component_top()->mutable_camera()->add_camera_id(0);
    report.mutable_component_top()->mutable_camera()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_camera()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_camera()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_camera()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_camera()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_camera()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_camera()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_camera()->add_screen_on_energy(SCREEN_ON_ENERGY);
}

void FillComponentTopCpuData(OptimizeReport &report)
{
    report.mutable_component_top()->mutable_cpu()->set_count(1);
    report.mutable_component_top()->mutable_cpu()->add_appname("cpu_app");
    report.mutable_component_top()->mutable_cpu()->add_uid(UID);
    report.mutable_component_top()->mutable_cpu()->add_background_duration(BACKGROUN_DDURATION);
    report.mutable_component_top()->mutable_cpu()->add_background_energy(BACKGROUND_ENERGY);
    report.mutable_component_top()->mutable_cpu()->add_foreground_duration(FOREGROUND_DURATION);
    report.mutable_component_top()->mutable_cpu()->add_foreground_energy(FOREGROUND_ENERGY);
    report.mutable_component_top()->mutable_cpu()->add_screen_off_duration(SCREEN_OFF_DURATION);
    report.mutable_component_top()->mutable_cpu()->add_screen_off_energy(SCREEN_OFF_ENERGY);
    report.mutable_component_top()->mutable_cpu()->add_screen_on_duration(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_cpu()->add_screen_on_energy(SCREEN_ON_ENERGY);
    report.mutable_component_top()->mutable_cpu()->add_load(LOAD);
}

/**
 * @tc.name: ParseXpowerParseComponentTopData
 * @tc.desc: Parse Xpower Parse ComponentTop Data
 * @tc.type: FUNC
 */
HWTEST_F(PbReaderXPowerParserTest, ParseXpowerParseComponentTopData, TestSize.Level1)
{
    TS_LOGI("test47-8");
    OptimizeReport report;
    FillComponentTopAudioData(report);
    FillComponentTopBluetoothData(report);
    FillComponentTopFlashlightData(report);
    FillComponentTopLocationData(report);
    FillComponentTopWifiscanData(report);
    FillComponentTopDisplayData(report);
    FillComponentTopGpuData(report);
    FillComponentTopCameraData(report);
    FillComponentTopCpuData(report);

    std::string reportData;
    report.SerializeToString(&reportData);
    PbreaderDataSegment seg;
    seg.protoData.data_ = reinterpret_cast<const uint8_t *>(reportData.data());
    seg.protoData.size_ = reportData.size();
    PbreaderXpowerParser xpowerParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    xpowerParser.Parse(seg, START_TIME, TS_CLOCK_REALTIME);
    EXPECT_TRUE(xpowerParser.timeSet_.empty());

    report.set_start_time(START_TIME);
    report.SerializeToString(&reportData);
    seg.protoData.data_ = reinterpret_cast<const uint8_t *>(reportData.data());
    seg.protoData.size_ = reportData.size();
    xpowerParser.Parse(seg, START_TIME, TS_CLOCK_REALTIME);
    EXPECT_TRUE(xpowerParser.timeSet_.empty());

    report.set_end_time(END_TIME);
    report.SerializeToString(&reportData);
    seg.protoData.data_ = reinterpret_cast<const uint8_t *>(reportData.data());
    seg.protoData.size_ = reportData.size();
    xpowerParser.Parse(seg, START_TIME, TS_CLOCK_REALTIME);
    EXPECT_FALSE(xpowerParser.timeSet_.empty());
    XPowerComponentTop *cmpTopDataCache = xpowerParser.traceDataCache_->GetXPowerComponentTopInfo();
    EXPECT_TRUE(
        !cmpTopDataCache->ComponentTypesData().empty() && !cmpTopDataCache->AppnamesData().empty() &&
        !cmpTopDataCache->BackgroundDurationsData().empty() && !cmpTopDataCache->BackgroundEnergysData().empty() &&
        !cmpTopDataCache->ForegroundDurationsData().empty() && !cmpTopDataCache->ForegroundEnergysData().empty() &&
        !cmpTopDataCache->ScreenOffDurationsData().empty() && !cmpTopDataCache->ScreenOffEnergysData().empty() &&
        !cmpTopDataCache->ScreenOnDurationsData().empty() && !cmpTopDataCache->ScreenOnEnergysData().empty() &&
        !cmpTopDataCache->CameraIdsData().empty() && !cmpTopDataCache->UidsData().empty() &&
        !cmpTopDataCache->LoadsData().empty() && !cmpTopDataCache->AppUsageDurationsData().empty() &&
        !cmpTopDataCache->AppUsageEnergysData().empty());
    cmpTopDataCache->Clear();
    cmpTopDataCache->ClearExportedData();
}
} // namespace PbReaderXPowerDataParserUnitTest
} // namespace TraceStreamer
} // namespace SysTuning
