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

#include "xpower_stdtype.h"
namespace SysTuning {
namespace TraceStdtype {
size_t XPowerAppStatistic::AppendNewAppStatisticData(DataIndex componentType,
                                                     uint64_t startTime,
                                                     uint64_t dur,
                                                     int64_t energy)
{
    ids_.emplace_back(id_++);
    componentTypes_.emplace_back(componentType);
    timeStamps_.emplace_back(startTime);
    durs_.emplace_back(dur);
    energys_.emplace_back(energy);
    return Size() - 1;
}

const std::deque<DataIndex> &XPowerAppStatistic::ComponentTypesData() const
{
    return componentTypes_;
}

const std::deque<int64_t> &XPowerAppStatistic::DurationsData() const
{
    return durs_;
}

const std::deque<int64_t> &XPowerAppStatistic::EnergysData() const
{
    return energys_;
}

void XPowerAppStatistic::Clear()
{
    CacheBase::Clear();
    componentTypes_.clear();
    durs_.clear();
    energys_.clear();
}

void XPowerAppStatistic::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, componentTypes_, durs_, energys_);
}

size_t XPowerAppDetailCPU::AppendNewAppDetailCPUData(DataIndex threadName,
                                                     uint64_t startTime,
                                                     uint64_t threadTime,
                                                     int64_t threadLoad,
                                                     int64_t threadEnergy)
{
    ids_.emplace_back(id_++);
    threadNames_.emplace_back(threadName);
    timeStamps_.emplace_back(startTime);
    threadTimes_.emplace_back(threadTime);
    threadLoads_.emplace_back(threadLoad);
    threadEnergys_.emplace_back(threadEnergy);
    return Size() - 1;
}

const std::deque<DataIndex> &XPowerAppDetailCPU::ThreadNamesData() const
{
    return threadNames_;
}

const std::deque<int64_t> &XPowerAppDetailCPU::ThreadTimesData() const
{
    return threadTimes_;
}

const std::deque<int64_t> &XPowerAppDetailCPU::ThreadLoadsData() const
{
    return threadLoads_;
}

const std::deque<int64_t> &XPowerAppDetailCPU::ThreadEnergysData() const
{
    return threadEnergys_;
}

void XPowerAppDetailCPU::Clear()
{
    CacheBase::Clear();
    threadNames_.clear();
    threadTimes_.clear();
    threadLoads_.clear();
    threadEnergys_.clear();
}

void XPowerAppDetailCPU::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, threadNames_, threadTimes_, threadLoads_, threadEnergys_);
}

size_t XPowerAppDetailGPU::AppendNewAppDetailGPUData(int64_t frequency,
                                                     uint64_t startTime,
                                                     int64_t idleTime,
                                                     int64_t runTime)
{
    ids_.emplace_back(id_++);
    frequencys_.emplace_back(frequency);
    timeStamps_.emplace_back(startTime);
    idleTimes_.emplace_back(idleTime);
    runTimes_.emplace_back(runTime);
    return Size() - 1;
}

const std::deque<int64_t> &XPowerAppDetailGPU::FrequencysData() const
{
    return frequencys_;
}

const std::deque<int64_t> &XPowerAppDetailGPU::IdleTimesData() const
{
    return idleTimes_;
}

const std::deque<int64_t> &XPowerAppDetailGPU::RuntimesData() const
{
    return runTimes_;
}

void XPowerAppDetailGPU::Clear()
{
    CacheBase::Clear();
    frequencys_.clear();
    idleTimes_.clear();
    runTimes_.clear();
}

void XPowerAppDetailGPU::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, frequencys_, idleTimes_, runTimes_);
}

size_t XPowerAppDetailWifi::AppendNewAppDetailWifiData(uint64_t startTime,
                                                       int64_t txPackets,
                                                       int64_t rxPackets,
                                                       int64_t txBytes,
                                                       int64_t rxBytes)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(startTime);
    txPackets_.emplace_back(txPackets);
    rxPackets_.emplace_back(rxPackets);
    txBytes_.emplace_back(txBytes);
    rxBytes_.emplace_back(rxBytes);
    return Size() - 1;
}

const std::deque<int64_t> &XPowerAppDetailWifi::TxPacketsData() const
{
    return txPackets_;
}

const std::deque<int64_t> &XPowerAppDetailWifi::RxPacketsData() const
{
    return rxPackets_;
}

const std::deque<int64_t> &XPowerAppDetailWifi::TxBytesData() const
{
    return txBytes_;
}

const std::deque<int64_t> &XPowerAppDetailWifi::RxBytesData() const
{
    return rxBytes_;
}

void XPowerAppDetailWifi::Clear()
{
    CacheBase::Clear();
    txPackets_.clear();
    rxPackets_.clear();
    txBytes_.clear();
    rxBytes_.clear();
}

void XPowerAppDetailWifi::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, txPackets_, rxPackets_, txBytes_, rxBytes_);
}

size_t XPowerAppDetailDisplay::AppendNewAppDetailDisplayData(const XPowerAppDetailDisplayRow &row)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(row.startTime);
    count1Hertzs_.emplace_back(row.count1Hertz);
    count5Hertzs_.emplace_back(row.count5Hertz);
    count10Hertzs_.emplace_back(row.count10Hertz);
    count15Hertzs_.emplace_back(row.count15Hertz);
    count24Hertzs_.emplace_back(row.count24Hertz);
    count30Hertzs_.emplace_back(row.count30Hertz);
    count45Hertzs_.emplace_back(row.count45Hertz);
    count60Hertzs_.emplace_back(row.count60Hertz);
    count90Hertzs_.emplace_back(row.count90Hertz);
    count120Hertzs_.emplace_back(row.count120Hertz);
    count180Hertzs_.emplace_back(row.count180Hertz);
    return Size() - 1;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count1HertzsData() const
{
    return count1Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count5HertzsData() const
{
    return count5Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count10HertzsData() const
{
    return count10Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count15HertzsData() const
{
    return count15Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count24HertzsData() const
{
    return count24Hertzs_;
}
const std::deque<int64_t> &XPowerAppDetailDisplay::Count30HertzsData() const
{
    return count30Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count45HertzsData() const
{
    return count45Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count60HertzsData() const
{
    return count60Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count90HertzsData() const
{
    return count90Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count120HertzsData() const
{
    return count120Hertzs_;
}

const std::deque<int64_t> &XPowerAppDetailDisplay::Count180HertzsData() const
{
    return count180Hertzs_;
}

void XPowerAppDetailDisplay::Clear()
{
    CacheBase::Clear();
    count1Hertzs_.clear();
    count5Hertzs_.clear();
    count10Hertzs_.clear();
    count15Hertzs_.clear();
    count24Hertzs_.clear();
    count30Hertzs_.clear();
    count45Hertzs_.clear();
    count60Hertzs_.clear();
    count90Hertzs_.clear();
    count120Hertzs_.clear();
    count180Hertzs_.clear();
}

void XPowerAppDetailDisplay::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, count1Hertzs_, count5Hertzs_, count10Hertzs_);
    EraseElements(count15Hertzs_, count24Hertzs_, count30Hertzs_, count45Hertzs_, count60Hertzs_);
    EraseElements(count90Hertzs_, count120Hertzs_, count180Hertzs_);
}

size_t XPowerComponentTop::AppendNewComponentTopData(const XPowerComponentTopRow &row)
{
    ids_.emplace_back(id_++);
    timeStamps_.emplace_back(row.startTime);
    componentTypes_.emplace_back(row.componentType);
    appnames_.emplace_back(row.appname);
    backgroundDurations_.emplace_back(row.backgroundDuration);
    backgroundEnergys_.emplace_back(row.backgroundEnergy);
    foregroundDurations_.emplace_back(row.foregroundDuration);
    foregroundEnergys_.emplace_back(row.foregroundEnergy);
    screenOffDurations_.emplace_back(row.screenOffDuration);
    screenOffEnergys_.emplace_back(row.screenOffEnergy);
    screenOnDurations_.emplace_back(row.screenOnDuration);
    screenOnEnergys_.emplace_back(row.screenOnEnergy);
    cameraIds_.emplace_back(row.cameraId);
    uids_.emplace_back(row.uid);
    loads_.emplace_back(row.load);
    appUsageDurations_.emplace_back(row.appUsageDuration);
    appUsageEnergys_.emplace_back(row.appUsageEnergy);
    return Size() - 1;
}

const std::deque<DataIndex> &XPowerComponentTop::ComponentTypesData() const
{
    return componentTypes_;
}

const std::deque<int64_t> &XPowerComponentTop::AppnamesData() const
{
    return appnames_;
}

const std::deque<int64_t> &XPowerComponentTop::BackgroundDurationsData() const
{
    return backgroundDurations_;
}

const std::deque<int64_t> &XPowerComponentTop::BackgroundEnergysData() const
{
    return backgroundEnergys_;
}

const std::deque<int64_t> &XPowerComponentTop::ForegroundDurationsData() const
{
    return foregroundDurations_;
}

const std::deque<int64_t> &XPowerComponentTop::ForegroundEnergysData() const
{
    return foregroundEnergys_;
}

const std::deque<int64_t> &XPowerComponentTop::ScreenOffDurationsData() const
{
    return screenOffDurations_;
}

const std::deque<int64_t> &XPowerComponentTop::ScreenOffEnergysData() const
{
    return screenOffEnergys_;
}

const std::deque<int64_t> &XPowerComponentTop::ScreenOnDurationsData() const
{
    return screenOnDurations_;
}

const std::deque<int64_t> &XPowerComponentTop::ScreenOnEnergysData() const
{
    return screenOnEnergys_;
}

const std::deque<int64_t> &XPowerComponentTop::CameraIdsData() const
{
    return cameraIds_;
}

const std::deque<int64_t> &XPowerComponentTop::UidsData() const
{
    return uids_;
}

const std::deque<int64_t> &XPowerComponentTop::LoadsData() const
{
    return loads_;
}

const std::deque<int64_t> &XPowerComponentTop::AppUsageDurationsData() const
{
    return appUsageDurations_;
}

const std::deque<int64_t> &XPowerComponentTop::AppUsageEnergysData() const
{
    return appUsageEnergys_;
}

void XPowerComponentTop::Clear()
{
    CacheBase::Clear();
    componentTypes_.clear();
    appnames_.clear();
    backgroundDurations_.clear();
    backgroundEnergys_.clear();
    foregroundDurations_.clear();
    foregroundEnergys_.clear();
    screenOffDurations_.clear();
    screenOffEnergys_.clear();
    screenOnDurations_.clear();
    screenOnEnergys_.clear();
    cameraIds_.clear();
    uids_.clear();
    loads_.clear();
    appUsageDurations_.clear();
    appUsageEnergys_.clear();
}

void XPowerComponentTop::ClearExportedData()
{
    EraseElements(ids_, timeStamps_, componentTypes_, appnames_, backgroundDurations_, backgroundEnergys_);
    EraseElements(foregroundDurations_, foregroundEnergys_, screenOffDurations_, screenOffEnergys_, uids_);
    EraseElements(screenOnDurations_, screenOnEnergys_, cameraIds_, loads_, appUsageDurations_, appUsageEnergys_);
}

} // namespace TraceStdtype
} // namespace SysTuning