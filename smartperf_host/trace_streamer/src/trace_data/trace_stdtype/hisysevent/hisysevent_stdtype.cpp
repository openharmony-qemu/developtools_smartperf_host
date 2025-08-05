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
#include "hisysevent_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
uint32_t HiSysEventSubkeys::AppendSysEventSubkey(DataIndex eventSource, DataIndex appName)
{
    sysEventNameIds_.emplace_back(eventSource);
    subkeyNameIds_.emplace_back(appName);
    ids_.emplace_back(subkeyNameIds_.size() - 1);
    return Size() - 1;
}
const std::deque<DataIndex> &HiSysEventSubkeys::SysEventNameId() const
{
    return sysEventNameIds_;
}
const std::deque<DataIndex> &HiSysEventSubkeys::SysEventSubkeyId() const
{
    return subkeyNameIds_;
}

void HiSysEventMeasureData::AppendData(const HiSysEventMeasureDataRow &context)
{
    serial_.emplace_back(context.serial);
    ts_.emplace_back(context.ts);
    nameFilterIds_.emplace_back(context.nameId);
    appKeyFilterIds_.emplace_back(context.keyId);
    types_.emplace_back(context.type);
    numValues_.emplace_back(context.numericValue);
    stringValues_.emplace_back(context.stringValue);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<uint64_t> &HiSysEventMeasureData::Serial() const
{
    return serial_;
}
const std::deque<uint64_t> &HiSysEventMeasureData::Ts() const
{
    return ts_;
}
const std::deque<uint32_t> &HiSysEventMeasureData::NameFilterId() const
{
    return nameFilterIds_;
}
const std::deque<uint32_t> &HiSysEventMeasureData::AppKeyFilterId() const
{
    return appKeyFilterIds_;
}
const std::deque<int32_t> &HiSysEventMeasureData::Type() const
{
    return types_;
}
const std::deque<double> &HiSysEventMeasureData::NumValue() const
{
    return numValues_;
}
const std::deque<DataIndex> &HiSysEventMeasureData::StringValue() const
{
    return stringValues_;
}
void HiSysEventDeviceStateData::AppendNewData(const HiSysEventDeviceStateDataRow &context)
{
    brightness_.emplace_back(context.brightness);
    btStates_.emplace_back(context.btState);
    locations_.emplace_back(context.location);
    wifis_.emplace_back(context.wifi);
    streamDefaults_.emplace_back(context.streamDefault);
    voiceCalls_.emplace_back(context.voiceCall);
    musics_.emplace_back(context.music);
    streamRings_.emplace_back(context.streamRing);
    medias_.emplace_back(context.media);
    voiceAssistants_.emplace_back(context.voiceAssistant);
    systems_.emplace_back(context.system);
    alarms_.emplace_back(context.alarm);
    notifications_.emplace_back(context.notification);
    btScos_.emplace_back(context.btSco);
    enforcedAudibles_.emplace_back(context.enforcedAudible);
    streamDtmfs_.emplace_back(context.streamDtmf);
    streamTts_.emplace_back(context.streamTts);
    accessibilitys_.emplace_back(context.accessibility);
    recordings_.emplace_back(context.recording);
    streamAlls_.emplace_back(context.streamAll);
    ids_.emplace_back(rowCounts_);
    rowCounts_++;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Brightness() const
{
    return brightness_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::BtState() const
{
    return btStates_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Location() const
{
    return locations_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Wifi() const
{
    return wifis_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::StreamDefault() const
{
    return streamDefaults_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::VoiceCall() const
{
    return voiceCalls_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Music() const
{
    return musics_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::StreamRing() const
{
    return streamRings_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Media() const
{
    return medias_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::VoiceAssistant() const
{
    return voiceAssistants_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::System() const
{
    return systems_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Alarm() const
{
    return alarms_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Notification() const
{
    return notifications_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::BtSco() const
{
    return btScos_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::EnforcedAudible() const
{
    return enforcedAudibles_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::StreamDtmf() const
{
    return streamDtmfs_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::StreamTts() const
{
    return streamTts_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Accessibility() const
{
    return accessibilitys_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::Recordings() const
{
    return recordings_;
}
const std::deque<int32_t> &HiSysEventDeviceStateData::StreamAll() const
{
    return streamAlls_;
}

uint32_t HiSysEventAllEventData::AppendHiSysEventData(const HiSysEventAllEventDataRow &hiSysEventAllEventDataRow)
{
    domainIds_.emplace_back(hiSysEventAllEventDataRow.domainId);
    eventNameIds_.emplace_back(hiSysEventAllEventDataRow.eventNameId);
    timeStamps_.emplace_back(hiSysEventAllEventDataRow.timeStamp);
    types_.emplace_back(hiSysEventAllEventDataRow.type);
    timeZones_.emplace_back(hiSysEventAllEventDataRow.timeZone);
    pids_.emplace_back(hiSysEventAllEventDataRow.pid);
    tids_.emplace_back(hiSysEventAllEventDataRow.tid);
    uids_.emplace_back(hiSysEventAllEventDataRow.uid);
    levels_.emplace_back(hiSysEventAllEventDataRow.level);
    tags_.emplace_back(hiSysEventAllEventDataRow.tag);
    eventIds_.emplace_back(hiSysEventAllEventDataRow.eventId);
    seqs_.emplace_back(hiSysEventAllEventDataRow.seq);
    infos_.emplace_back(hiSysEventAllEventDataRow.info);
    contents_.emplace_back(hiSysEventAllEventDataRow.content);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<DataIndex> &HiSysEventAllEventData::DomainIds() const
{
    return domainIds_;
}
const std::deque<DataIndex> &HiSysEventAllEventData::EventNameIds() const
{
    return eventNameIds_;
}
const std::deque<uint32_t> &HiSysEventAllEventData::Types() const
{
    return types_;
}
const std::deque<std::string> &HiSysEventAllEventData::TimeZones() const
{
    return timeZones_;
}
const std::deque<uint32_t> &HiSysEventAllEventData::Pids() const
{
    return pids_;
}
const std::deque<uint32_t> &HiSysEventAllEventData::Tids() const
{
    return tids_;
}
const std::deque<uint32_t> &HiSysEventAllEventData::Uids() const
{
    return uids_;
}
const std::deque<std::string> &HiSysEventAllEventData::Levels() const
{
    return levels_;
}
const std::deque<std::string> &HiSysEventAllEventData::Tags() const
{
    return tags_;
}
const std::deque<std::string> &HiSysEventAllEventData::EventIds() const
{
    return eventIds_;
}
const std::deque<uint64_t> &HiSysEventAllEventData::Seqs() const
{
    return seqs_;
}
const std::deque<std::string> &HiSysEventAllEventData::Infos() const
{
    return infos_;
}
const std::deque<std::string> &HiSysEventAllEventData::Contents() const
{
    return contents_;
}
} // namespace TraceStdtype
} // namespace SysTuning
