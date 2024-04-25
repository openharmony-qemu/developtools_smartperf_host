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

#ifndef HISYSEVENT_STDTYPE_H
#define HISYSEVENT_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class HiSysEventSubkeys : public CacheBase {
public:
    uint32_t AppendSysEventSubkey(DataIndex eventSource, DataIndex appName);
    const std::deque<DataIndex> &SysEventNameId() const;
    const std::deque<DataIndex> &SysEventSubkeyId() const;
    void Clear() override
    {
        CacheBase::Clear();
        sysEventNameIds_.clear();
        subkeyNameIds_.clear();
    }

private:
    std::deque<DataIndex> sysEventNameIds_ = {};
    std::deque<DataIndex> subkeyNameIds_ = {};
};

struct HiSysEventMeasureDataRow {
    /* data */
    uint64_t serial = INVALID_UINT64;
    uint64_t ts = INVALID_UINT64;
    uint32_t nameId = INVALID_UINT32;
    uint32_t keyId = INVALID_UINT32;
    int32_t type = INVALID_UINT32;
    double numericValue;
    DataIndex stringValue = INVALID_DATAINDEX;
};

class HiSysEventMeasureData : public CacheBase {
public:
    void AppendData(const HiSysEventMeasureDataRow &context);
    const std::deque<uint64_t> &Serial() const;
    const std::deque<uint64_t> &Ts() const;
    const std::deque<uint32_t> &NameFilterId() const;
    const std::deque<uint32_t> &AppKeyFilterId() const;
    const std::deque<int32_t> &Type() const;
    const std::deque<double> &NumValue() const;
    const std::deque<DataIndex> &StringValue() const;
    void Clear() override
    {
        CacheBase::Clear();
        serial_.clear();
        ts_.clear();
        nameFilterIds_.clear();
        appKeyFilterIds_.clear();
        types_.clear();
        numValues_.clear();
        stringValues_.clear();
    }

private:
    std::deque<uint64_t> serial_ = {};
    std::deque<uint64_t> ts_ = {};
    std::deque<uint32_t> nameFilterIds_ = {};
    std::deque<uint32_t> appKeyFilterIds_ = {};
    std::deque<int32_t> types_ = {};
    std::deque<double> numValues_ = {};
    std::deque<DataIndex> stringValues_ = {};
    uint32_t rowCount_ = 0;
};

struct HiSysEventDeviceStateDataRow {
    /* data */
    int32_t brightness = INVALID_UINT32;
    int32_t btState = INVALID_UINT32;
    int32_t location = INVALID_UINT32;
    int32_t wifi = INVALID_UINT32;
    int32_t streamDefault = INVALID_UINT32;
    int32_t voiceCall = INVALID_UINT32;
    int32_t music = INVALID_UINT32;
    int32_t streamRing = INVALID_UINT32;
    int32_t media = INVALID_UINT32;
    int32_t voiceAssistant = INVALID_UINT32;
    int32_t system = INVALID_UINT32;
    int32_t alarm = INVALID_UINT32;
    int32_t notification = INVALID_UINT32;
    int32_t btSco = INVALID_UINT32;
    int32_t enforcedAudible = INVALID_UINT32;
    int32_t streamDtmf = INVALID_UINT32;
    int32_t streamTts = INVALID_UINT32;
    int32_t accessibility = INVALID_UINT32;
    int32_t recording = INVALID_UINT32;
    int32_t streamAll = INVALID_UINT32;
};

class HiSysEventDeviceStateData : public CacheBase {
public:
    void AppendNewData(const HiSysEventDeviceStateDataRow &context);
    const std::deque<int32_t> &Brightness() const;
    const std::deque<int32_t> &BtState() const;
    const std::deque<int32_t> &Location() const;
    const std::deque<int32_t> &Wifi() const;
    const std::deque<int32_t> &StreamDefault() const;
    const std::deque<int32_t> &VoiceCall() const;
    const std::deque<int32_t> &Music() const;
    const std::deque<int32_t> &StreamRing() const;
    const std::deque<int32_t> &Media() const;
    const std::deque<int32_t> &VoiceAssistant() const;
    const std::deque<int32_t> &System() const;
    const std::deque<int32_t> &Alarm() const;
    const std::deque<int32_t> &Notification() const;
    const std::deque<int32_t> &BtSco() const;
    const std::deque<int32_t> &EnforcedAudible() const;
    const std::deque<int32_t> &StreamDtmf() const;
    const std::deque<int32_t> &StreamTts() const;
    const std::deque<int32_t> &Accessibility() const;
    const std::deque<int32_t> &Recordings() const;
    const std::deque<int32_t> &StreamAll() const;
    void Clear() override
    {
        CacheBase::Clear();
        brightness_.clear();
        btStates_.clear();
        locations_.clear();
        wifis_.clear();
        streamDefaults_.clear();
        voiceCalls_.clear();
        musics_.clear();
        streamRings_.clear();
        medias_.clear();
        voiceAssistants_.clear();
        systems_.clear();
        alarms_.clear();
        notifications_.clear();
        btScos_.clear();
        enforcedAudibles_.clear();
        streamDtmfs_.clear();
        streamTts_.clear();
        accessibilitys_.clear();
        recordings_.clear();
        streamAlls_.clear();
    }

private:
    std::deque<uint32_t> stringValues_ = {};
    std::deque<int32_t> brightness_ = {};
    std::deque<int32_t> btStates_ = {};
    std::deque<int32_t> locations_ = {};
    std::deque<int32_t> wifis_ = {};
    std::deque<int32_t> streamDefaults_ = {};
    std::deque<int32_t> voiceCalls_ = {};
    std::deque<int32_t> musics_ = {};
    std::deque<int32_t> streamRings_ = {};
    std::deque<int32_t> medias_ = {};
    std::deque<int32_t> voiceAssistants_ = {};
    std::deque<int32_t> systems_ = {};
    std::deque<int32_t> alarms_ = {};
    std::deque<int32_t> notifications_ = {};
    std::deque<int32_t> btScos_ = {};
    std::deque<int32_t> enforcedAudibles_ = {};
    std::deque<int32_t> streamDtmfs_ = {};
    std::deque<int32_t> streamTts_ = {};
    std::deque<int32_t> accessibilitys_ = {};
    std::deque<int32_t> recordings_ = {};
    std::deque<int32_t> streamAlls_ = {};
    uint32_t rowCounts_ = 0;
};
struct HiSysEventAllEventDataRow {
    DataIndex domainId = INVALID_UINT64;
    DataIndex eventNameId = INVALID_UINT64;
    uint64_t timeStamp = INVALID_UINT64;
    uint32_t type = INVALID_UINT32;
    std::string timeZone;
    uint32_t pid = INVALID_UINT32;
    uint32_t tid = INVALID_UINT32;
    uint32_t uid = INVALID_UINT32;
    std::string level;
    std::string tag;
    std::string eventId;
    uint64_t seq = INVALID_UINT64;
    std::string info;
    std::string content;
};
class HiSysEventAllEventData : public CacheBase {
public:
    uint32_t AppendHiSysEventData(const HiSysEventAllEventDataRow &hiSysEventAllEventDataRow);
    const std::deque<DataIndex> &DomainIds() const;
    const std::deque<DataIndex> &EventNameIds() const;
    const std::deque<uint32_t> &Types() const;
    const std::deque<std::string> &TimeZones() const;
    const std::deque<uint32_t> &Pids() const;
    const std::deque<uint32_t> &Tids() const;
    const std::deque<uint32_t> &Uids() const;
    const std::deque<std::string> &Levels() const;
    const std::deque<std::string> &Tags() const;
    const std::deque<std::string> &EventIds() const;
    const std::deque<uint64_t> &Seqs() const;
    const std::deque<std::string> &Infos() const;
    const std::deque<std::string> &Contents() const;
    void Clear() override
    {
        CacheBase::Clear();
        domainIds_.clear();
        eventNameIds_.clear();
        types_.clear();
        timeZones_.clear();
        pids_.clear();
        tids_.clear();
        uids_.clear();
        levels_.clear();
        tags_.clear();
        eventIds_.clear();
        seqs_.clear();
        infos_.clear();
        contents_.clear();
    }

private:
    std::deque<DataIndex> domainIds_ = {};
    std::deque<DataIndex> eventNameIds_ = {};
    std::deque<uint32_t> types_ = {};
    std::deque<std::string> timeZones_ = {};
    std::deque<uint32_t> pids_ = {};
    std::deque<uint32_t> tids_ = {};
    std::deque<uint32_t> uids_ = {};
    std::deque<std::string> levels_ = {};
    std::deque<std::string> tags_ = {};
    std::deque<std::string> eventIds_ = {};
    std::deque<uint64_t> seqs_ = {};
    std::deque<std::string> infos_ = {};
    std::deque<std::string> contents_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // HISYSEVENT_STDTYPE_H
