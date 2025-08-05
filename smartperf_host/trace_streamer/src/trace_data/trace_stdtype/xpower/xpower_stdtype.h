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

#ifndef XPOWER_STDTYPE_H
#define XPOWER_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class XPowerAppStatistic : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewAppStatisticData(DataIndex componentType, uint64_t startTime, uint64_t dur, int64_t energy);
    const std::deque<DataIndex> &ComponentTypesData() const;
    const std::deque<int64_t> &DurationsData() const;
    const std::deque<int64_t> &EnergysData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<DataIndex> componentTypes_ = {};
    std::deque<int64_t> durs_ = {};
    std::deque<int64_t> energys_ = {};
};

class XPowerAppDetailCPU : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewAppDetailCPUData(DataIndex threadName,
                                     uint64_t startTime,
                                     uint64_t threadTime,
                                     int64_t threadLoad,
                                     int64_t threadEnergy);
    const std::deque<DataIndex> &ThreadNamesData() const;
    const std::deque<int64_t> &ThreadTimesData() const;
    const std::deque<int64_t> &ThreadLoadsData() const;
    const std::deque<int64_t> &ThreadEnergysData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<DataIndex> threadNames_ = {};
    std::deque<int64_t> threadTimes_ = {};
    std::deque<int64_t> threadLoads_ = {};
    std::deque<int64_t> threadEnergys_ = {};
};

class XPowerAppDetailGPU : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewAppDetailGPUData(int64_t frequency, uint64_t startTime, int64_t idleTime, int64_t runTime);
    const std::deque<int64_t> &FrequencysData() const;
    const std::deque<int64_t> &IdleTimesData() const;
    const std::deque<int64_t> &RuntimesData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<int64_t> frequencys_ = {};
    std::deque<int64_t> idleTimes_ = {};
    std::deque<int64_t> runTimes_ = {};
};

class XPowerAppDetailWifi : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewAppDetailWifiData(uint64_t startTime,
                                      int64_t txPackets,
                                      int64_t rxPackets,
                                      int64_t txBytes,
                                      int64_t rxBytes);
    const std::deque<int64_t> &TxPacketsData() const;
    const std::deque<int64_t> &RxPacketsData() const;
    const std::deque<int64_t> &TxBytesData() const;
    const std::deque<int64_t> &RxBytesData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<int64_t> txPackets_ = {};
    std::deque<int64_t> rxPackets_ = {};
    std::deque<int64_t> txBytes_ = {};
    std::deque<int64_t> rxBytes_ = {};
};

struct XPowerAppDetailDisplayRow {
    uint64_t startTime = INVALID_UINT64;
    int64_t count1Hertz = INVALID_INT64;
    int64_t count5Hertz = INVALID_INT64;
    int64_t count10Hertz = INVALID_INT64;
    int64_t count15Hertz = INVALID_INT64;
    int64_t count24Hertz = INVALID_INT64;
    int64_t count30Hertz = INVALID_INT64;
    int64_t count45Hertz = INVALID_INT64;
    int64_t count60Hertz = INVALID_INT64;
    int64_t count90Hertz = INVALID_INT64;
    int64_t count120Hertz = INVALID_INT64;
    int64_t count180Hertz = INVALID_INT64;
};

class XPowerAppDetailDisplay : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewAppDetailDisplayData(const XPowerAppDetailDisplayRow &row);
    const std::deque<int64_t> &Count1HertzsData() const;
    const std::deque<int64_t> &Count5HertzsData() const;
    const std::deque<int64_t> &Count10HertzsData() const;
    const std::deque<int64_t> &Count15HertzsData() const;
    const std::deque<int64_t> &Count24HertzsData() const;
    const std::deque<int64_t> &Count30HertzsData() const;
    const std::deque<int64_t> &Count45HertzsData() const;
    const std::deque<int64_t> &Count60HertzsData() const;
    const std::deque<int64_t> &Count90HertzsData() const;
    const std::deque<int64_t> &Count120HertzsData() const;
    const std::deque<int64_t> &Count180HertzsData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<int64_t> count1Hertzs_ = {};
    std::deque<int64_t> count5Hertzs_ = {};
    std::deque<int64_t> count10Hertzs_ = {};
    std::deque<int64_t> count15Hertzs_ = {};
    std::deque<int64_t> count24Hertzs_ = {};
    std::deque<int64_t> count30Hertzs_ = {};
    std::deque<int64_t> count45Hertzs_ = {};
    std::deque<int64_t> count60Hertzs_ = {};
    std::deque<int64_t> count90Hertzs_ = {};
    std::deque<int64_t> count120Hertzs_ = {};
    std::deque<int64_t> count180Hertzs_ = {};
};

struct XPowerComponentTopRow {
    DataIndex componentType = INVALID_UINT64;
    uint64_t startTime = INVALID_UINT64;
    int64_t appname = INVALID_INT64;
    int64_t backgroundDuration = INVALID_INT64;
    int64_t backgroundEnergy = INVALID_INT64;
    int64_t foregroundDuration = INVALID_INT64;
    int64_t foregroundEnergy = INVALID_INT64;
    int64_t screenOffDuration = INVALID_INT64;
    int64_t screenOffEnergy = INVALID_INT64;
    int64_t screenOnDuration = INVALID_INT64;
    int64_t screenOnEnergy = INVALID_INT64;
    int64_t cameraId = INVALID_INT64;
    int64_t uid = INVALID_INT64;
    int64_t load = INVALID_INT64;
    int64_t appUsageDuration = INVALID_INT64;
    int64_t appUsageEnergy = INVALID_INT64;
};

class XPowerComponentTop : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewComponentTopData(const XPowerComponentTopRow &row);
    const std::deque<DataIndex> &ComponentTypesData() const;
    const std::deque<int64_t> &AppnamesData() const;
    const std::deque<int64_t> &BackgroundDurationsData() const;
    const std::deque<int64_t> &BackgroundEnergysData() const;
    const std::deque<int64_t> &ForegroundDurationsData() const;
    const std::deque<int64_t> &ForegroundEnergysData() const;
    const std::deque<int64_t> &ScreenOffDurationsData() const;
    const std::deque<int64_t> &ScreenOffEnergysData() const;
    const std::deque<int64_t> &ScreenOnDurationsData() const;
    const std::deque<int64_t> &ScreenOnEnergysData() const;
    const std::deque<int64_t> &CameraIdsData() const;
    const std::deque<int64_t> &UidsData() const;
    const std::deque<int64_t> &LoadsData() const;
    const std::deque<int64_t> &AppUsageDurationsData() const;
    const std::deque<int64_t> &AppUsageEnergysData() const;
    void Clear() override;
    void ClearExportedData() override;

private:
    std::deque<DataIndex> componentTypes_ = {};
    std::deque<int64_t> appnames_ = {};
    std::deque<int64_t> backgroundDurations_ = {};
    std::deque<int64_t> backgroundEnergys_ = {};
    std::deque<int64_t> foregroundDurations_ = {};
    std::deque<int64_t> foregroundEnergys_ = {};
    std::deque<int64_t> screenOffDurations_ = {};
    std::deque<int64_t> screenOffEnergys_ = {};
    std::deque<int64_t> screenOnDurations_ = {};
    std::deque<int64_t> screenOnEnergys_ = {};
    std::deque<int64_t> cameraIds_ = {};
    std::deque<int64_t> uids_ = {};
    std::deque<int64_t> loads_ = {};
    std::deque<int64_t> appUsageDurations_ = {};
    std::deque<int64_t> appUsageEnergys_ = {};
};

} // namespace TraceStdtype
} // namespace SysTuning
#endif // XPOWER_STDTYPE_H