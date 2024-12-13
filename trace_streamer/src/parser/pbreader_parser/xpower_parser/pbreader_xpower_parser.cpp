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
#include "xpower_plugin_result.pb.h"

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
    UpdatePluginTimeRange(TS_CLOCK_REALTIME, optimizeReport.start_time() * MSEC_TO_NS, startTime);
    UpdatePluginTimeRange(TS_CLOCK_REALTIME, optimizeReport.end_time() * MSEC_TO_NS, endTime);
    traceDataCache_->UpdateTraceTime(startTime);
    traceDataCache_->UpdateTraceTime(endTime);
    timeSet_.emplace(startTime);
    static bool initBundleName = false;
    if (!initBundleName && optimizeReport.has_bundle_name()) {
        traceDataCache_->GetTraceConfigData()->AppendNewData("xpower_config", "bundle_name",
                                                             optimizeReport.bundle_name().ToStdString());
        initBundleName = true;
    }
    if (optimizeReport.has_real_battery()) {
        ProcessRealBattery(optimizeReport.real_battery(), startTime);
    }
    if (optimizeReport.has_thermal_report()) {
        ProcessThermalReport(optimizeReport.thermal_report(), startTime);
    }
    if (optimizeReport.has_app_statistic()) {
        ProcessAppStatistic(optimizeReport.app_statistic(), startTime);
    }
    if (optimizeReport.has_app_detail()) {
        ProcessAppDetail(optimizeReport.app_detail(), startTime);
    }
    if (optimizeReport.has_component_top()) {
        ProcessComponentTop(optimizeReport.component_top(), startTime);
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
    int64_t duration = INVALID_INT64;
    int64_t energy = INVALID_INT64;
    if (appStatisticCommon.has_energy()) {
        energy = appStatisticCommon.energy();
    }
    if (appStatisticCommon.has_time()) {
        duration = appStatisticCommon.time();
    }
    if (appStatisticCommon.has_energy() || appStatisticCommon.has_time()) {
        traceDataCache_->GetXPowerAppStatisticInfo()->AppendNewAppStatisticData(traceDataCache_->GetDataIndex(name),
                                                                                timestamp, duration, energy);
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
        auto naneIndex = traceDataCache_->GetDataIndex(threadName->ToStdString());
        traceDataCache_->GetXPowerAppDetailCPUInfo()->AppendNewAppDetailCPUData(naneIndex, timestamp, *threadTime,
                                                                                *threadLoad, *threadEnergy);
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
        traceDataCache_->GetXPowerAppDetailGPUInfo()->AppendNewAppDetailGPUData(*frequency, timestamp, *idleTime,
                                                                                *runTime);
        frequency++;
        idleTime++;
        runTime++;
    }
}
void PbreaderXpowerParser::ProcessAppDetailWifi(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailWifi_Reader appDetailWifi(bytesView);
    int64_t txPackets = INVALID_INT64;
    int64_t rxPackets = INVALID_INT64;
    int64_t txBytes = INVALID_INT64;
    int64_t rxBytes = INVALID_INT64;
    if (appDetailWifi.has_tx_packets()) {
        txPackets = appDetailWifi.tx_packets();
    }
    if (appDetailWifi.has_rx_packets()) {
        rxPackets = appDetailWifi.rx_packets();
    }
    if (appDetailWifi.has_tx_bytes()) {
        txBytes = appDetailWifi.tx_bytes();
    }
    if (appDetailWifi.has_rx_bytes()) {
        rxBytes = appDetailWifi.rx_bytes();
    }
    traceDataCache_->GetXPowerAppDetailWifiInfo()->AppendNewAppDetailWifiData(timestamp, txPackets, rxPackets, txBytes,
                                                                              rxBytes);
}

void PbreaderXpowerParser::ProcessAppDetailDisplay(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::AppDetailDisplay_Reader appDetailDisplay(bytesView);
    XPowerAppDetailDisplayRow row;
    row.startTime = timestamp;
    if (appDetailDisplay.has_count_1hz()) {
        row.count1Hertz = appDetailDisplay.count_1hz();
    }
    if (appDetailDisplay.has_count_5hz()) {
        row.count5Hertz = appDetailDisplay.count_5hz();
    }
    if (appDetailDisplay.has_count_10hz()) {
        row.count10Hertz = appDetailDisplay.count_10hz();
    }
    if (appDetailDisplay.has_count_15hz()) {
        row.count15Hertz = appDetailDisplay.count_15hz();
    }
    if (appDetailDisplay.has_count_24hz()) {
        row.count24Hertz = appDetailDisplay.count_24hz();
    }
    if (appDetailDisplay.has_count_30hz()) {
        row.count30Hertz = appDetailDisplay.count_30hz();
    }
    if (appDetailDisplay.has_count_45hz()) {
        row.count45Hertz = appDetailDisplay.count_45hz();
    }
    if (appDetailDisplay.has_count_60hz()) {
        row.count60Hertz = appDetailDisplay.count_60hz();
    }
    if (appDetailDisplay.has_count_90hz()) {
        row.count90Hertz = appDetailDisplay.count_90hz();
    }
    if (appDetailDisplay.has_count_120hz()) {
        row.count120Hertz = appDetailDisplay.count_120hz();
    }
    if (appDetailDisplay.has_count_180hz()) {
        row.count180Hertz = appDetailDisplay.count_180hz();
    }
    traceDataCache_->GetXPowerAppDetailDisplayInfo()->AppendNewAppDetailDisplayData(row);
}

void PbreaderXpowerParser::ProcessComponentTop(const ProtoReader::BytesView &bytesView, uint64_t timestamp)
{
    ProtoReader::ComponentTop_Reader componentTop(bytesView);
    if (componentTop.has_audio()) {
        ProcessComponentTopComm(traceDataCache_->GetDataIndex(audioStr_), componentTop.audio(), timestamp);
    }
    if (componentTop.has_bluetooth()) {
        ProcessComponentTopComm(traceDataCache_->GetDataIndex(bluetoothStr_), componentTop.bluetooth(), timestamp);
    }
    if (componentTop.has_flashlight()) {
        ProcessComponentTopComm(traceDataCache_->GetDataIndex(flashlightStr_), componentTop.flashlight(), timestamp);
    }
    if (componentTop.has_location()) {
        ProcessComponentTopComm(traceDataCache_->GetDataIndex(locationStr_), componentTop.location(), timestamp);
    }
    if (componentTop.has_wifiscan()) {
        ProcessComponentTopComm(traceDataCache_->GetDataIndex(wifiscanStr_), componentTop.wifiscan(), timestamp);
    }
    if (componentTop.has_display()) {
        ProcessComponentTopDisplay(traceDataCache_->GetDataIndex(displayStr_), componentTop.display(), timestamp);
    }
    if (componentTop.has_gpu()) {
        ProcessComponentTopDisplay(traceDataCache_->GetDataIndex(gpuStr_), componentTop.gpu(), timestamp);
    }
    if (componentTop.has_camera()) {
        ProcessComponentTopCamera(traceDataCache_->GetDataIndex(cameraStr_), componentTop.camera(), timestamp);
    }
    if (componentTop.has_cpu()) {
        ProcessComponentTopCpu(traceDataCache_->GetDataIndex(cpuStr_), componentTop.cpu(), timestamp);
    }
}

void PbreaderXpowerParser::ProcessComponentTopComm(const DataIndex type,
                                                   const ProtoReader::BytesView &bytesView,
                                                   uint64_t timestamp)
{
    ProtoReader::ComponentTopCommon_Reader comm(bytesView);
    XPowerComponentTopRow commRow;
    commRow.startTime = timestamp;
    commRow.componentType = type;
    bool errorInfo = false;
    auto appname = comm.appname();
    auto backgroundDuration = comm.background_duration(&errorInfo);
    auto backgroundEnergy = comm.background_energy(&errorInfo);
    auto foregroundDuration = comm.foreground_duration(&errorInfo);
    auto foregroundEnergy = comm.foreground_energy(&errorInfo);
    auto screenOffDuration = comm.screen_off_duration(&errorInfo);
    auto screenOffEnergy = comm.screen_off_energy(&errorInfo);
    auto screenOnDuration = comm.screen_on_duration(&errorInfo);
    auto screenOnEnergy = comm.screen_on_energy(&errorInfo);
    while (appname && backgroundDuration && backgroundEnergy && foregroundDuration && foregroundEnergy &&
           screenOffDuration && screenOffEnergy && screenOnDuration && screenOnEnergy) {
        commRow.appname = traceDataCache_->GetDataIndex(appname->ToStdString());
        commRow.backgroundDuration = *backgroundDuration;
        commRow.backgroundEnergy = *backgroundEnergy;
        commRow.foregroundDuration = *foregroundDuration;
        commRow.foregroundEnergy = *foregroundEnergy;
        commRow.screenOffDuration = *screenOffDuration;
        commRow.screenOffEnergy = *screenOffEnergy;
        commRow.screenOnDuration = *screenOnDuration;
        commRow.screenOnEnergy = *screenOnEnergy;
        traceDataCache_->GetXPowerComponentTopInfo()->AppendNewComponentTopData(commRow);
        ++appname;
        ++backgroundDuration;
        ++backgroundEnergy;
        ++foregroundDuration;
        ++foregroundEnergy;
        ++screenOffDuration;
        ++screenOffEnergy;
        ++screenOnDuration;
        ++screenOnEnergy;
    }
}

void PbreaderXpowerParser::ProcessComponentTopDisplay(const DataIndex type,
                                                      const ProtoReader::BytesView &bytesView,
                                                      uint64_t timestamp)
{
    ProtoReader::ComponentTopDisplay_Reader display(bytesView);
    XPowerComponentTopRow displayRow;
    displayRow.startTime = timestamp;
    displayRow.componentType = type;
    bool errorInfo = false;
    auto appname = display.appname();
    auto appUsageDuration = display.time(&errorInfo);
    auto appUsageEnergy = display.energy(&errorInfo);
    while (appname && appUsageDuration && appUsageEnergy) {
        displayRow.appname = traceDataCache_->GetDataIndex(appname->ToStdString());
        displayRow.appUsageDuration = *appUsageDuration;
        displayRow.appUsageEnergy = *appUsageEnergy;
        traceDataCache_->GetXPowerComponentTopInfo()->AppendNewComponentTopData(displayRow);
        ++appname;
        ++appUsageDuration;
        ++appUsageEnergy;
    }
}

void PbreaderXpowerParser::ProcessComponentTopCamera(const DataIndex type,
                                                     const ProtoReader::BytesView &bytesView,
                                                     uint64_t timestamp)
{
    ProtoReader::ComponentTopCamera_Reader camera(bytesView);
    XPowerComponentTopRow cameraRow;
    cameraRow.startTime = timestamp;
    cameraRow.componentType = type;
    bool errorInfo = false;
    auto appname = camera.appname();
    auto cameraId = camera.camera_id(&errorInfo);
    auto backgroundDuration = camera.background_duration(&errorInfo);
    auto backgroundEnergy = camera.background_energy(&errorInfo);
    auto foregroundDuration = camera.foreground_duration(&errorInfo);
    auto foregroundEnergy = camera.foreground_energy(&errorInfo);
    auto screenOffDuration = camera.screen_off_duration(&errorInfo);
    auto screenOffEnergy = camera.screen_off_energy(&errorInfo);
    auto screenOnDuration = camera.screen_on_duration(&errorInfo);
    auto screenOnEnergy = camera.screen_on_energy(&errorInfo);
    while (appname && cameraId && backgroundDuration && backgroundEnergy && foregroundDuration && foregroundEnergy &&
           screenOffDuration && screenOffEnergy && screenOnDuration && screenOnEnergy) {
        cameraRow.appname = traceDataCache_->GetDataIndex(appname->ToStdString());
        cameraRow.cameraId = *cameraId;
        cameraRow.backgroundDuration = *backgroundDuration;
        cameraRow.backgroundEnergy = *backgroundEnergy;
        cameraRow.foregroundDuration = *foregroundDuration;
        cameraRow.foregroundEnergy = *foregroundEnergy;
        cameraRow.screenOffDuration = *screenOffDuration;
        cameraRow.screenOffEnergy = *screenOffEnergy;
        cameraRow.screenOnDuration = *screenOnDuration;
        cameraRow.screenOnEnergy = *screenOnEnergy;
        traceDataCache_->GetXPowerComponentTopInfo()->AppendNewComponentTopData(cameraRow);
        ++appname;
        ++backgroundDuration;
        ++backgroundEnergy;
        ++foregroundDuration;
        ++cameraId;
        ++foregroundEnergy;
        ++screenOffDuration;
        ++screenOffEnergy;
        ++screenOnDuration;
        ++screenOnEnergy;
    }
}

void PbreaderXpowerParser::ProcessComponentTopCpu(const DataIndex type,
                                                  const ProtoReader::BytesView &bytesView,
                                                  uint64_t timestamp)
{
    ProtoReader::ComponentTopCpu_Reader cpu(bytesView);
    XPowerComponentTopRow cpuRow;
    cpuRow.startTime = timestamp;
    cpuRow.componentType = type;
    bool errorInfo = false;
    auto appname = cpu.appname();
    auto uid = cpu.uid(&errorInfo);
    auto backgroundDuration = cpu.background_duration(&errorInfo);
    auto backgroundEnergy = cpu.background_energy(&errorInfo);
    auto foregroundDuration = cpu.foreground_duration(&errorInfo);
    auto foregroundEnergy = cpu.foreground_energy(&errorInfo);
    auto screenOffDuration = cpu.screen_off_duration(&errorInfo);
    auto screenOffEnergy = cpu.screen_off_energy(&errorInfo);
    auto screenOnDuration = cpu.screen_on_duration(&errorInfo);
    auto screenOnEnergy = cpu.screen_on_energy(&errorInfo);
    auto load = cpu.load(&errorInfo);
    while (appname && uid && backgroundDuration && backgroundEnergy && foregroundDuration && foregroundEnergy &&
           screenOffDuration && screenOffEnergy && screenOnDuration && screenOnEnergy && load) {
        cpuRow.appname = traceDataCache_->GetDataIndex(appname->ToStdString());
        cpuRow.uid = *uid;
        cpuRow.backgroundDuration = *backgroundDuration;
        cpuRow.backgroundEnergy = *backgroundEnergy;
        cpuRow.foregroundDuration = *foregroundDuration;
        cpuRow.foregroundEnergy = *foregroundEnergy;
        cpuRow.screenOffDuration = *screenOffDuration;
        cpuRow.screenOffEnergy = *screenOffEnergy;
        cpuRow.screenOnDuration = *screenOnDuration;
        cpuRow.screenOnEnergy = *screenOnEnergy;
        cpuRow.load = *load;
        traceDataCache_->GetXPowerComponentTopInfo()->AppendNewComponentTopData(cpuRow);
        ++appname;
        ++backgroundDuration;
        ++backgroundEnergy;
        ++uid;
        ++foregroundDuration;
        ++foregroundEnergy;
        ++load;
        ++screenOffDuration;
        ++screenOffEnergy;
        ++screenOnDuration;
        ++screenOnEnergy;
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
