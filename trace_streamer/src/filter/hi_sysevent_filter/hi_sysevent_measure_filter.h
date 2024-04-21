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

#ifndef HI_SYS_EVENT_MEASURE_FILTER_H
#define HI_SYS_EVENT_MEASURE_FILTER_H

#include <map>
#include <string_view>
#include <tuple>

#include "common_types.h"
#include "double_map.h"
#include "filter_base.h"
#include "htrace_plugin_time_parser.h"
#include "json.hpp"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "triple_map.h"

namespace SysTuning {
namespace TraceStreamer {

using json = nlohmann::json;
typedef struct {
    std::string eventName;
    uint64_t timeStamp;
    std::vector<std::string> appName;
    std::vector<std::string> key;
    std::vector<json> value;
} JsonData;

struct JsonMessage {
    DataIndex domainId = INVALID_DATAINDEX;
    DataIndex eventNameId = INVALID_DATAINDEX;
    uint64_t timeStamp = INVALID_UINT64;
    uint32_t type = INVALID_UINT32;
    std::string timeZone = "";
    uint32_t pid = INVALID_UINT32;
    uint32_t tid = INVALID_UINT32;
    uint32_t uid = INVALID_UINT32;
    std::string level = "";
    std::string tag = "";
    std::string eventId = "";
    uint64_t seq = INVALID_UINT64;
    std::string info = "";
    json content;
};

class HiSysEventMeasureFilter : private FilterBase, public HtracePluginTimeParser {
public:
    HiSysEventMeasureFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    HiSysEventMeasureFilter(const HiSysEventMeasureFilter &) = delete;
    HiSysEventMeasureFilter &operator=(const HiSysEventMeasureFilter &) = delete;
    ~HiSysEventMeasureFilter() override;
    DataIndex AppendNewValue(uint64_t serial,
                             uint64_t timeStamp,
                             DataIndex appNameId,
                             DataIndex key,
                             int32_t type,
                             double numericValue,
                             DataIndex strValue);
    void AppendNewValue(std::string msg, std::string processName);
    void AppendNewValue(int32_t brightnessState,
                        int32_t btState,
                        int32_t locationState,
                        int32_t wifiState,
                        int32_t streamDefault,
                        int32_t voiceCall,
                        int32_t music,
                        int32_t streamRing,
                        int32_t media,
                        int32_t voiceAssistant,
                        int32_t system,
                        int32_t alarm,
                        int32_t notification,
                        int32_t bluetoolthSco,
                        int32_t enforcedAudible,
                        int32_t streamDtmf,
                        int32_t streamTts,
                        int32_t accessibility,
                        int32_t recording,
                        int32_t streamAll);
    bool SaveAllHiSysEvent(json jMessage, bool &haveSplitSeg);
    void Clear();
    bool FilterAllHiSysEvent(const json &jMessage, uint64_t serial, bool &haveSplitSeg);

private:
    bool JGetData(const json &jMessage,
                  JsonData &jData,
                  size_t &maxArraySize,
                  std::vector<size_t> &noArrayIndex,
                  std::vector<size_t> &arrayIndex);
    void NoArrayDataParse(JsonData jData,
                          std::vector<size_t> noArrayIndex,
                          DataIndex eventSourceIndex,
                          uint64_t hiSysEventLineId);
    void ArrayDataParse(JsonData jData,
                        std::vector<size_t> arrayIndex,
                        DataIndex eventSourceIndex,
                        size_t maxArraySize,
                        uint64_t hiSysEventLineId);
    void CommonDataParser(JsonData jData, DataIndex eventSourceIndex, uint64_t hiSysEventLineId);
    void AppendStringValue(nlohmann::json &value,
                           uint64_t hiSysEventLineId,
                           DataIndex eventSourceIndex,
                           DataIndex keyIndex,
                           uint64_t timeStamp);
    void UpdataAllHiSysEvent(const JsonMessage &jsMessage, uint64_t newTimeStamp);
    void FillJsMessage(const json &jMessage, JsonMessage &jsMessage);

private:
    const uint64_t MSEC_TO_NS = 1000 * 1000;
    DataIndex GetOrCreateFilterIdInternal(DataIndex appNameId, DataIndex key);
    DoubleMap<DataIndex, DataIndex, DataIndex> appKey_;
    DoubleMap<DataIndex, DataIndex, DataIndex> appName_;
    std::map<DataIndex, DataIndex> eventSource_;
    std::vector<std::string> eventsAccordingAppNames_ = {"POWER_IDE_BATTERY",
                                                         "POWER_IDE_CPU",
                                                         "POWER_IDE_LOCATION",
                                                         "POWER_IDE_GPU",
                                                         "POWER_IDE_DISPLAY",
                                                         "POWER_IDE_CAMERA",
                                                         "POWER_IDE_BLUETOOTH",
                                                         "POWER_IDE_FLASHLIGHT",
                                                         "POWER_IDE_AUDIO",
                                                         "POWER_IDE_WIFISCAN",
                                                         "BRIGHTNESS_NIT",
                                                         "SIGNAL_LEVEL",
                                                         "WIFI_EVENT_RECEIVED",
                                                         "AUDIO_STREAM_CHANGE",
                                                         "AUDIO_VOLUME_CHANGE",
                                                         "WIFI_STATE",
                                                         "BR_SWITCH_STATE",
                                                         "BLUETOOTH_BR_SWITCH_STATE",
                                                         "LOCATION_SWITCH_STATE",
                                                         "ENABLE_SENSOR",
                                                         "DISABLE_SENSOR",
                                                         "WORK_REMOVE",
                                                         "WORK_START",
                                                         "WORK_STOP",
                                                         "WORK_ADD",
                                                         "POWER_RUNNINGLOCK",
                                                         "GNSS_STATE",
                                                         "ANOMALY_SCREEN_OFF_ENERGY",
                                                         "ANOMALY_ALARM_WAKEUP",
                                                         "ANOMALY_KERNEL_WAKELOCK",
                                                         "ANOMALY_RUNNINGLOCK",
                                                         "ANORMALY_APP_ENERGY",
                                                         "ANOMALY_GNSS_ENERGY",
                                                         "ANOMALY_CPU_HIGH_FREQUENCY",
                                                         "ANOMALY_CPU_ENERGY",
                                                         "ANOMALY_WAKEUP"};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // HI_SYS_EVENT_MEASURE_FILTER_H
