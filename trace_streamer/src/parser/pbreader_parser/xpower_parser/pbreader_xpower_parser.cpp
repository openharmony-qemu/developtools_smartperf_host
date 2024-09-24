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
#include <cstdint>
#include <string>

#include "pbreader_xpower_parser.h"
#include "clock_filter_ex.h"
#include "measure_filter.h"
#include "proto_reader_help.h"
#include "ts_common.h"
#include "xpower_plugin_result.pbreader.h"

namespace SysTuning {
namespace TraceStreamer {
PbreaderXpowerParser::PbreaderXpowerParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx)
{
}

PbreaderXpowerParser::~PbreaderXpowerParser()
{
    TS_LOGI("mem ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}
void PbreaderXpowerParser::Parse(PbreaderDataSegment &seg, uint64_t timestamp, BuiltinClocks clock)
{
    ProtoReader::OptimizeReport_Reader optimizeReport(seg.protoData.data_, seg.protoData.size_);
    if (!optimizeReport.has_start_time() || !optimizeReport.has_end_time()) {
        return;
    }
    auto startTime =
        streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, optimizeReport.start_time() * MSEC_TO_NS);
    auto endTime =
        streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, optimizeReport.end_time() * MSEC_TO_NS);
    if (timeSet_.find(startTime) != timeSet_.end()) {
        return;
    }
    timeSet_.emplace(startTime);
    UpdatePluginTimeRange(TS_CLOCK_BOOTTIME, startTime, startTime);
    UpdatePluginTimeRange(TS_CLOCK_BOOTTIME, endTime, endTime);
    traceDataCache_->UpdateTraceTime(startTime);
    traceDataCache_->UpdateTraceTime(endTime);
    if (optimizeReport.has_real_battery()) {
        ProcessRealBattery(optimizeReport.real_battery(), startTime);
    }
    if (optimizeReport.has_thermal_report()) {
        ProcessThermalReport(optimizeReport.thermal_report(), startTime);
    }
    if (optimizeReport.has_app_statistic()) {
    }
    if (optimizeReport.has_app_detail()) {
    }
}

void PbreaderXpowerParser::ProcessRealBattery(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::RealBattery_Reader realBattery(bytesView);
    auto capacity = realBattery.capacity();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaCapDataIndex_, timestamp,
                                                         capacity);
    auto charge = realBattery.charge();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaChaDataIndex_, timestamp,
                                                         charge);
    auto gasGauge = realBattery.gas_gauge();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaGasDataIndex_, timestamp,
                                                         gasGauge);
    auto level = realBattery.level();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaLevDataIndex_, timestamp,
                                                         level);
    auto screen = realBattery.screen();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaScrDataIndex_, timestamp,
                                                         screen);
    bool errorInfo = false;
    auto realCurrent = realBattery.real_current(&errorInfo);
    uint64_t count = 0;
    while (realCurrent) {
        streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, rBaRealCurDataIndex_,
                                                             timestamp + 100 * MSEC_TO_NS * count, *realCurrent);
        realCurrent++;
        count++;
    }
}

void PbreaderXpowerParser::ProcessThermalReport(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::ThermalReport_Reader thermalReport(bytesView);
    auto shellTemp = thermalReport.shell_temp();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, tReSheDataIndex_, timestamp,
                                                         shellTemp);
    auto thermalLevel = thermalReport.thermal_level();
    streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::XPOWER, 0, tReTheDataIndex_, timestamp,
                                                         thermalLevel);
}

void PbreaderXpowerParser::ProcessAppStatistic(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppStatistic_Reader appStatistic(bytesView);
    if (appStatistic.has_audio()) {
        ProcessAppStatisticCommon(appStatistic.audio(), timestamp, audioStr_);
    }
    if (appStatistic.has_bluetooth()) {
        ProcessAppStatisticCommon(appStatistic.bluetooth(), timestamp, bluetoothStr_);
    }
    if (appStatistic.has_camera()) {
        ProcessAppStatisticCommon(appStatistic.camera(), timestamp, cameraStr_);
    }
    if (appStatistic.has_cpu()) {
        ProcessAppStatisticCommon(appStatistic.cpu(), timestamp, cpuStr_);
    }
    if (appStatistic.has_display()) {
        ProcessAppStatisticCommon(appStatistic.audio(), timestamp, displayStr_);
    }
    if (appStatistic.has_flashlight()) {
        ProcessAppStatisticCommon(appStatistic.flashlight(), timestamp, flashlightStr_);
    }
    if (appStatistic.has_gpu()) {
        ProcessAppStatisticCommon(appStatistic.gpu(), timestamp, gpuStr_);
    }
    if (appStatistic.has_location()) {
        ProcessAppStatisticCommon(appStatistic.location(), timestamp, locationStr_);
    }
    if (appStatistic.has_wifiscan()) {
        ProcessAppStatisticCommon(appStatistic.wifiscan(), timestamp, wifiscanStr_);
    }
    if (appStatistic.has_wifi()) {
        ProcessAppStatisticCommon(appStatistic.wifi(), timestamp, wifiStr_);
    }
    if (appStatistic.has_modem()) {
        ProcessAppStatisticCommon(appStatistic.modem(), timestamp, modemStr_);
    }
}

void PbreaderXpowerParser::ProcessAppStatisticCommon(const ProtoReader::BytesView &bytesView,
                                                     uint64_t timestamp,
                                                     const std::string &name)
{
    ProtoReader::AppStatisticCommon_Reader appStatisticCommon(bytesView);
    if (appStatisticCommon.has_energy()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0, traceDataCache_->GetDataIndex("AppStatistic|" + name + "|" + energyStr_),
            timestamp, appStatisticCommon.energy());
    }
    if (appStatisticCommon.has_time()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0, traceDataCache_->GetDataIndex("AppStatistic|" + name + "|" + timeStr_),
            timestamp, appStatisticCommon.time());
    }
}

void PbreaderXpowerParser::ProcessAppDetail(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetail_Reader appDetail(bytesView);
    if (appDetail.has_cpu()) {
        ProcessAppDetailCpu(appDetail.cpu(), timestamp);
    }
    if (appDetail.has_gpu()) {
        ProcessAppDetailGpu(appDetail.gpu(), timestamp);
    }
    if (appDetail.has_wifi()) {
        ProcessAppDetailWifi(appDetail.wifi(), timestamp);
    }
    if (appDetail.has_display()) {
        ProcessAppDetailDisplay(appDetail.display(), timestamp);
    }
}
void PbreaderXpowerParser::ProcessAppDetailCpu(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailCPU_Reader appDetailCPU(bytesView);
    bool errorInfo = false;
    auto threadName = appDetailCPU.thread_name();
    auto threadLoad = appDetailCPU.thread_load(&errorInfo);
    auto threadTime = appDetailCPU.thread_time(&errorInfo);
    auto threadEnergy = appDetailCPU.thread_energy(&errorInfo);
    while (threadName && threadLoad && threadTime && threadEnergy) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + cpuStr_ + "|thread-" + threadName->ToStdString() + "|" +
                                          loadStr_),
            timestamp, *threadLoad);
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + cpuStr_ + "|thread-" + threadName->ToStdString() + "|" +
                                          timeStr_),
            timestamp, *threadTime);
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + cpuStr_ + "|thread-" + threadName->ToStdString() + "|" +
                                          energyStr_),
            timestamp, *threadEnergy);
        threadName++;
        threadLoad++;
        threadTime++;
        threadEnergy++;
    }
}
void PbreaderXpowerParser::ProcessAppDetailGpu(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailGPU_Reader appDetailGPU(bytesView);
    bool errorInfo = false;
    auto frequency = appDetailGPU.frequency(&errorInfo);
    auto idleTime = appDetailGPU.idle_time(&errorInfo);
    auto runTime = appDetailGPU.run_time(&errorInfo);
    while (frequency && idleTime && runTime) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + gpuStr_ + "|" + std::to_string(*frequency) + "Hz|" +
                                          idleTimeStr_),
            timestamp, *idleTime);
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + gpuStr_ + "|" + std::to_string(*frequency) + "Hz|" +
                                          runTimeStr_),
            timestamp, *runTime);
        frequency++;
        idleTime++;
        runTime++;
    }
}
void PbreaderXpowerParser::ProcessAppDetailWifi(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailWifi_Reader appDetailWifi(bytesView);
    if (appDetailWifi.has_tx_packets()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + wifiStr_ + "|" + txPacketsStr_), timestamp,
            appDetailWifi.tx_packets());
    }
    if (appDetailWifi.has_rx_packets()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + wifiStr_ + "|" + txPacketsStr_), timestamp,
            appDetailWifi.rx_packets());
    }
    if (appDetailWifi.has_tx_bytes()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + wifiStr_ + "|" + txBytesStr_), timestamp,
            appDetailWifi.tx_bytes());
    }
    if (appDetailWifi.has_rx_bytes()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + wifiStr_ + "|" + txBytesStr_), timestamp,
            appDetailWifi.rx_bytes());
    }
}

void PbreaderXpowerParser::ProcessAppDetailDisplay(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailDisplay_Reader appDetailDisplay(bytesView);
    if (appDetailDisplay.has_count_1hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count1hzStr_), timestamp,
            appDetailDisplay.count_1hz());
    }
    if (appDetailDisplay.has_count_5hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count5hzStr_), timestamp,
            appDetailDisplay.count_5hz());
    }
    if (appDetailDisplay.has_count_10hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count10hzStr_), timestamp,
            appDetailDisplay.count_10hz());
    }
    if (appDetailDisplay.has_count_15hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count15hzStr_), timestamp,
            appDetailDisplay.count_15hz());
    }
    if (appDetailDisplay.has_count_24hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count24hzStr_), timestamp,
            appDetailDisplay.count_24hz());
    }
    if (appDetailDisplay.has_count_30hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count30hzStr_), timestamp,
            appDetailDisplay.count_30hz());
    }
    if (appDetailDisplay.has_count_45hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count45hzStr_), timestamp,
            appDetailDisplay.count_45hz());
    }
    if (appDetailDisplay.has_count_60hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count60hzStr_), timestamp,
            appDetailDisplay.count_60hz());
    }
    if (appDetailDisplay.has_count_90hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count90hzStr_), timestamp,
            appDetailDisplay.count_90hz());
    }
    if (appDetailDisplay.has_count_120hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count120hzStr_), timestamp,
            appDetailDisplay.count_1hz());
    }
    if (appDetailDisplay.has_count_180hz()) {
        streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::XPOWER, 0,
            traceDataCache_->GetDataIndex(appDetailStr_ + "|" + displayStr_ + "|" + count180hzStr_), timestamp,
            appDetailDisplay.count_180hz());
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
