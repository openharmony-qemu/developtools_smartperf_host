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
#ifndef HTRACE_XPOWER_PARSER_H
#define HTRACE_XPOWER_PARSER_H

#include <cstdint>
#include <unordered_set>
#include "common_types.h"
#include "event_parser_base.h"
#include "htrace_plugin_time_parser.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;
class PbreaderXpowerParser : public EventParserBase, public HtracePluginTimeParser {
public:
    PbreaderXpowerParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~PbreaderXpowerParser();
    void Parse(PbreaderDataSegment &seg, uint64_t, BuiltinClocks clock);

private:
    void ProcessRealBattery(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessThermalReport(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppStatistic(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppStatisticCommon(const ProtoReader::BytesView &bytesView,
                                   uint64_t timestamp,
                                   const std::string &name);
    void ProcessAppDetail(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppDetailCpu(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppDetailGpu(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppDetailWifi(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessAppDetailDisplay(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessComponentTop(const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessComponentTopComm(const DataIndex type, const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessComponentTopDisplay(const DataIndex type, const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessComponentTopCamera(const DataIndex type, const ProtoReader::BytesView &bytesView, uint64_t timestamp);
    void ProcessComponentTopCpu(const DataIndex type, const ProtoReader::BytesView &bytesView, uint64_t timestamp);

    std::unordered_set<uint64_t> timeSet_;

    // RealBattery
    const DataIndex rBaCapDataIndex_ = traceDataCache_->GetDataIndex("Battery.Capacity");
    const DataIndex rBaChaDataIndex_ = traceDataCache_->GetDataIndex("Battery.Charge");
    const DataIndex rBaGasDataIndex_ = traceDataCache_->GetDataIndex("Battery.GasGauge");
    const DataIndex rBaLevDataIndex_ = traceDataCache_->GetDataIndex("Battery.Level");
    const DataIndex rBaScrDataIndex_ = traceDataCache_->GetDataIndex("Battery.Screen");
    const DataIndex rBaRealCurDataIndex_ = traceDataCache_->GetDataIndex("Battery.RealCurrent");
    // ThermalReport
    const DataIndex tReSheDataIndex_ = traceDataCache_->GetDataIndex("ThermalReport.ShellTemp");
    const DataIndex tReTheDataIndex_ = traceDataCache_->GetDataIndex("ThermalReport.ThermalLevel");
    // AppStatistic, ComponentTop
    const std::string appStatisticStr_ = "AppStatistic";
    const std::string audioStr_ = "audio";
    const std::string bluetoothStr_ = "bluetooth";
    const std::string cameraStr_ = "camera";
    const std::string cpuStr_ = "cpu";
    const std::string displayStr_ = "display";
    const std::string flashlightStr_ = "flashlight";
    const std::string gpuStr_ = "gpu";
    const std::string locationStr_ = "location";
    const std::string wifiscanStr_ = "wifiscan";
    const std::string wifiStr_ = "wifi";
    const std::string modemStr_ = "modem";
    const std::string energyStr_ = "energy";
    const std::string timeStr_ = "time";

    // AppDetail
    const std::string appDetailStr_ = "AppDetail";
    const std::string loadStr_ = "load";
    const std::string idleTimeStr_ = "idle_time";
    const std::string runTimeStr_ = "run_time";
    const std::string txPacketsStr_ = "tx_packets";
    const std::string rxPacketsStr_ = "rx_packets";
    const std::string txBytesStr_ = "tx_bytes";
    const std::string rxBytesStr_ = "rx_bytes";
    const std::string count1hzStr_ = "count_1hz";
    const std::string count5hzStr_ = "count_5hz";
    const std::string count10hzStr_ = "count_10hz";
    const std::string count15hzStr_ = "count_15hz";
    const std::string count24hzStr_ = "count_24hz";
    const std::string count30hzStr_ = "count_30hz";
    const std::string count45hzStr_ = "count_45hz";
    const std::string count60hzStr_ = "count_60hz";
    const std::string count90hzStr_ = "count_90hz";
    const std::string count120hzStr_ = "count_120hz";
    const std::string count180hzStr_ = "count_180hz";
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // HTRACE_XPOWER_PARSER_H
