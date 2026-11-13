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
#include "common_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
MetaData::MetaData()
{
    columnNames_.resize(METADATA_ITEM_MAX);
    values_.resize(METADATA_ITEM_MAX);
    columnNames_[METADATA_ITEM_DATASIZE] = METADATA_ITEM_DATASIZE_COLNAME;
    columnNames_[METADATA_ITEM_PARSETOOL_NAME] = METADATA_ITEM_PARSETOOL_NAME_COLNAME;
    columnNames_[METADATA_ITEM_PARSERTOOL_VERSION] = METADATA_ITEM_PARSERTOOL_VERSION_COLNAME;
    columnNames_[METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME] = METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME_COLNAME;
    columnNames_[METADATA_ITEM_SOURCE_FILENAME] = METADATA_ITEM_SOURCE_FILENAME_COLNAME;
    columnNames_[METADATA_ITEM_OUTPUT_FILENAME] = METADATA_ITEM_OUTPUT_FILENAME_COLNAME;
    columnNames_[METADATA_ITEM_PARSERTIME] = METADATA_ITEM_PARSERTIME_COLNAME;
    columnNames_[METADATA_ITEM_TRACE_DURATION] = METADATA_ITEM_TRACE_DURATION_COLNAME;
    columnNames_[METADATA_ITEM_SOURCE_DATETYPE] = METADATA_ITEM_SOURCE_DATETYPE_COLNAME;
    values_[METADATA_ITEM_PARSETOOL_NAME] = "trace_streamer";
}
void MetaData::SetTraceType(const std::string &traceType)
{
    values_[METADATA_ITEM_SOURCE_DATETYPE] = traceType;
}
void MetaData::SetSourceFileName(const std::string &fileName)
{
    MetaData::values_[METADATA_ITEM_SOURCE_FILENAME] = fileName;
}
void MetaData::SetOutputFileName(const std::string &fileName)
{
    MetaData::values_[METADATA_ITEM_OUTPUT_FILENAME] = fileName;
}
void MetaData::SetParserToolVersion(const std::string &version)
{
    values_[METADATA_ITEM_PARSERTOOL_VERSION] = version;
}
void MetaData::SetParserToolPublishDateTime(const std::string &datetime)
{
    values_[METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME] = datetime;
}
void MetaData::SetTraceDataSize(uint64_t dataSize)
{
    std::stringstream ss;
    ss << dataSize;
    values_[METADATA_ITEM_DATASIZE] = ss.str();
    // 	Function 'time' may return error. It is not allowed to do anything that might fail inside the constructor.
    time_t rawtime;
    tm *timeinfo = nullptr;
    (void)time(&rawtime);
    timeinfo = localtime(&rawtime);
    char buffer[MAX_SIZE_LEN];
    (void)strftime(buffer, MAX_SIZE_LEN, "%Y-%m-%d %H:%M:%S", timeinfo);
    values_[METADATA_ITEM_PARSERTIME].append(buffer);
    // sometimes there will be a extra \n at last
    values_[METADATA_ITEM_PARSERTIME].pop_back();
}
void MetaData::SetTraceDuration(uint64_t dur)
{
    values_[METADATA_ITEM_TRACE_DURATION] = std::to_string(dur) + " s";
}
const std::string &MetaData::Value(uint64_t row) const
{
    return values_[row];
}
const std::string &MetaData::Name(uint64_t row) const
{
    return columnNames_[row];
}
DataIndex DataDict::GetStringIndex(std::string_view str)
{
#ifdef SUPPORTTHREAD
    std::lock_guard<std::mutex> dictLockGuard(mutex_);
#endif
    auto itor = dataDictInnerMap_.find(str);
    if (itor != dataDictInnerMap_.end()) {
        return itor->second;
    }
    dataDict_.emplace_back(std::string(str));
    DataIndex stringIdentity = dataDict_.size() - 1;
    dataDictInnerMap_.emplace(std::string_view(dataDict_.back()), stringIdentity);
    return stringIdentity;
}
DataIndex DataDict::GetStringIndexNoWrite(std::string_view str) const
{
    auto itor = dataDictInnerMap_.find(str);
    if (itor != dataDictInnerMap_.end()) {
        return itor->second;
    }
    return INVALID_UINT64;
}
void DataDict::Finish()
{
    std::string::size_type pos;
    for (auto i = 0; i < dataDict_.size(); i++) {
        while ((pos = dataDict_[i].find("\"")) != std::string::npos) {
            dataDict_[i].replace(pos, 1, "\'");
        }
        while (!dataDict_[i].empty() && ((dataDict_[i].back() >= spasciiStart_ && dataDict_[i].back() <= spasciiEnd_) ||
                                         dataDict_[i].back() == '\r')) {
            dataDict_[i].pop_back();
        }
    }
}

DataSourceClockIdData::DataSourceClockIdData()
    : dataSource2ClockIdMap_({{DATA_SOURCE_TYPE_TRACE, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_FFRT, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_MEM, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_HILOG, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_NATIVEHOOK, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_FPS, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_NETWORK, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_DISKIO, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_CPU, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_PROCESS, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_HISYSEVENT, TS_CLOCK_UNKNOW},
                              {DATA_SOURCE_TYPE_JSMEMORY, TS_CLOCK_UNKNOW}}),
      dataSource2PluginNameMap_({
          {DATA_SOURCE_TYPE_TRACE, "ftrace-plugin"},
          {DATA_SOURCE_TYPE_FFRT, "ffrt-profiler"},
          {DATA_SOURCE_TYPE_MEM, "memory-plugin"},
          {DATA_SOURCE_TYPE_HILOG, "hilog-plugin"},
          {DATA_SOURCE_TYPE_NATIVEHOOK, "nativehook"},
          {DATA_SOURCE_TYPE_FPS, "hidump-plugin"},
          {DATA_SOURCE_TYPE_NETWORK, "network-plugin"},
          {DATA_SOURCE_TYPE_DISKIO, "diskio-plugin"},
          {DATA_SOURCE_TYPE_CPU, "cpu-plugin"},
          {DATA_SOURCE_TYPE_PROCESS, "process-plugin"},
          {DATA_SOURCE_TYPE_HISYSEVENT, "hisysevent-plugin"},
          {DATA_SOURCE_TYPE_JSMEMORY, "arkts-plugin"},
      })
{
}
void DataSourceClockIdData::Finish()
{
    for (auto i = dataSource2ClockIdMap_.begin(); i != dataSource2ClockIdMap_.end(); i++) {
        if (i->second) { // ignore the empty datasource, for which the clockid is default TS_CLOCK_UNKNOW 0
            dataSourceNames_.emplace_back(dataSource2PluginNameMap_.at(i->first));
            clockIds_.emplace_back(i->second);
        }
    }
}
void DataSourceClockIdData::SetDataSourceClockId(DataSourceType source, uint32_t id)
{
    dataSource2ClockIdMap_.at(source) = id;
}

StatAndInfo::StatAndInfo()
{
    // sched_switch_received | sched_switch_not_match | sched_switch_not_not_supported etc.
    for (int32_t i = TRACE_EVENT_START; i < TRACE_EVENT_MAX; i++) {
        event_[i] = config_.eventNameMap_.at(static_cast<SupportedTraceEventType>(i));
    }
    for (int32_t j = STAT_EVENT_START; j < STAT_EVENT_MAX; j++) {
        stat_[j] = config_.eventErrorDescMap_.at(static_cast<StatType>(j));
    }

    for (int32_t i = TRACE_EVENT_START; i < TRACE_EVENT_MAX; i++) {
        for (int32_t j = STAT_EVENT_START; j < STAT_EVENT_MAX; j++) {
            statSeverity_[i][j] = config_.eventParserStatSeverityDescMap_.at(static_cast<SupportedTraceEventType>(i))
                                      .at(static_cast<StatType>(j));
        }
    }

    for (int32_t i = TRACE_EVENT_START; i < TRACE_EVENT_MAX; i++) {
        for (int32_t j = STAT_EVENT_START; j < STAT_EVENT_MAX; j++) {
            statSeverityDesc_[i][j] = config_.serverityLevelDescMap_.at(statSeverity_[i][j]);
        }
    }

    for (int32_t i = TRACE_EVENT_START; i < TRACE_EVENT_MAX; i++) {
        for (int32_t j = STAT_EVENT_START; j < STAT_EVENT_MAX; j++) {
            statCount_[i][j] = 0;
        }
    }
    clockid2ClockNameMap_ = {
        {TS_CLOCK_UNKNOW, "unknown"},        {TS_CLOCK_BOOTTIME, "boottime"},
        {TS_CLOCK_REALTIME, "realtime"},     {TS_CLOCK_REALTIME_COARSE, "realtime_corse"},
        {TS_MONOTONIC, "monotonic"},         {TS_MONOTONIC_COARSE, "monotonic-coarse"},
        {TS_MONOTONIC_RAW, "monotonic-raw"},
    };
}
void StatAndInfo::IncreaseStat(SupportedTraceEventType eventType, StatType type)
{
#ifdef SUPPORTTHREAD
    std::lock_guard<SpinLock> lockGurand(spinlock_);
#endif
    statCount_[eventType][type]++;
}
const uint32_t &StatAndInfo::GetValue(SupportedTraceEventType eventType, StatType type) const
{
    return statCount_[eventType][type];
}
const std::string &StatAndInfo::GetEvent(SupportedTraceEventType eventType) const
{
    return event_[eventType];
}
const std::string &StatAndInfo::GetStat(StatType type) const
{
    return stat_[type];
}
const std::string &StatAndInfo::GetSeverityDesc(SupportedTraceEventType eventType, StatType type) const
{
    return statSeverityDesc_[eventType][type];
}
const StatSeverityLevel &StatAndInfo::GetSeverity(SupportedTraceEventType eventType, StatType type) const
{
    return statSeverity_[eventType][type];
}

uint64_t SymbolsData::Size() const
{
    return addrs_.size();
}
void SymbolsData::UpdateSymbol(uint64_t addr, DataIndex funcNameDictIndex)
{
    if (symbolsMap_.find(addr) == symbolsMap_.end()) {
        symbolsMap_.insert(std::make_pair(addr, funcNameDictIndex));
        addrs_.emplace_back(addr);
        funcName_.emplace_back(funcNameDictIndex);
    } else {
        symbolsMap_.at(addr) = funcNameDictIndex;
    }
}
const DataIndex &SymbolsData::GetFunc(uint64_t addr) const
{
    if (symbolsMap_.find(addr) == symbolsMap_.end()) {
        auto lastAddr = symbolsMap_.lower_bound(addr);
        if (lastAddr == symbolsMap_.end()) {
            return INVALID_UINT64;
        }
        return lastAddr->second;
    } else {
        return symbolsMap_.at(addr);
    }
}
const std::deque<DataIndex> &SymbolsData::GetConstFuncNames() const
{
    return funcName_;
}
const std::deque<uint64_t> &SymbolsData::GetConstAddrs() const
{
    return addrs_;
}

void DataType::UpdateNewDataType(BaseDataType dataType, DataIndex dataDescIndex)
{
    if (typeToDesc_.count(dataType) == 0) {
        dataTypes_.emplace_back(dataType);
        descs_.emplace_back(dataDescIndex);
        typeToDesc_.insert({dataType, dataDescIndex});
    }
}
const std::deque<BaseDataType> &DataType::DataTypes() const
{
    return dataTypes_;
}
const std::deque<DataIndex> &DataType::DataDesc() const
{
    return descs_;
}

size_t ArgSet::AppendNewArg(DataIndex nameId, BaseDataType dataType, int64_t value, size_t argSet)
{
    dataTypes_.emplace_back(dataType);
    argset_.emplace_back(argSet);
    ids_.emplace_back(id_++);
    values_.emplace_back(value);
    names_.emplace_back(nameId);
    return Size() - 1;
}
const std::deque<BaseDataType> &ArgSet::DataTypes() const
{
    return dataTypes_;
}
const std::deque<int64_t> &ArgSet::ValuesData() const
{
    return values_;
}
const std::deque<uint64_t> &ArgSet::ArgsData() const
{
    return argset_;
}
const std::deque<DataIndex> &ArgSet::NamesData() const
{
    return names_;
}

void TraceConfig::AppendNewData(std::string traceSource, std::string key, std::string value)
{
    traceSource_.emplace_back(traceSource);
    key_.emplace_back(key);
    value_.emplace_back(value);
    ids_.emplace_back(rowCounts_);
    rowCounts_++;
}
const std::deque<std::string> &TraceConfig::TraceSource() const
{
    return traceSource_;
}
const std::deque<std::string> &TraceConfig::Key() const
{
    return key_;
}
const std::deque<std::string> &TraceConfig::Value() const
{
    return value_;
}
} // namespace TraceStdtype
} // namespace SysTuning
