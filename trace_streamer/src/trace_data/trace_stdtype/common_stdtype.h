/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef COMMON_STDTYPE_H
#define COMMON_STDTYPE_H

#include <mutex>
#include <unordered_map>
#include <sstream>
#include "base_stdtype.h"
#include "cfg/trace_streamer_config.h"

namespace SysTuning {
namespace TraceStdtype {
using namespace SysTuning::TraceCfg;
using namespace SysTuning::TraceStreamer;
constexpr int32_t MAX_SIZE_LEN = 80;
class Thread {
public:
    explicit Thread(uint32_t t) : tid_(t) {}
    InternalPid internalPid_ = INVALID_UINT32;
    uint32_t tid_ = 0;
    DataIndex nameIndex_ = 0;
    InternalTime startT_ = 0;
    InternalTime endT_ = 0;
    uint32_t switchCount_ = 0;
    uint32_t sliceSize_ = 0;
    uint32_t cpuStatesCount_ = 0;
};

class Process {
public:
    explicit Process(uint32_t p) : pid_(p) {}
    std::string cmdLine_ = "";
    InternalTime startT_ = 0;
    uint32_t pid_ = 0;
    uint32_t memSize_ = 0;
    uint32_t threadSize_ = 0;
    uint32_t sliceSize_ = 0;
    uint32_t switchCount_ = 0;
    int32_t threadCount_ = -1;
    uint32_t cpuStatesCount_ = 0;
};

class DataDict {
public:
    size_t Size() const
    {
        return dataDict_.size();
    }
    DataIndex GetStringIndex(std::string_view str);
    DataIndex GetStringIndexNoWrite(std::string_view str) const;
    const std::string& GetDataFromDict(DataIndex id) const
    {
        TS_ASSERT(id < dataDict_.size());
        return dataDict_[id];
    }
    void Finish();
    void Clear()
    {
        dataDict_.clear();
    }

public:
    std::deque<std::string> dataDict_;
    std::unordered_map<std::string_view, DataIndex> dataDictInnerMap_;

private:
    std::hash<std::string_view> hashFun;
    std::mutex mutex_;
    const int8_t SPASCII_START = 0;
    const int8_t SPASCII_END = 32;
};

class MetaData {
public:
    MetaData();
    ~MetaData() = default;
    void SetTraceType(const std::string& traceType);
    void SetSourceFileName(const std::string& fileName);
    void SetOutputFileName(const std::string& fileName);
    void SetParserToolVersion(const std::string& version);
    void SetParserToolPublishDateTime(const std::string& datetime);
    void SetTraceDataSize(uint64_t dataSize);
    void SetTraceDuration(uint64_t dur);
    const std::string& Value(uint64_t row) const;
    const std::string& Name(uint64_t row) const;
    void Clear()
    {
        columnNames_.clear();
        values_.clear();
    }

private:
    const std::string METADATA_ITEM_DATASIZE_COLNAME = "datasize";
    const std::string METADATA_ITEM_PARSETOOL_NAME_COLNAME = "parse_tool";
    const std::string METADATA_ITEM_PARSERTOOL_VERSION_COLNAME = "tool_version";
    const std::string METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME_COLNAME = "tool_publish_time";
    const std::string METADATA_ITEM_SOURCE_FILENAME_COLNAME = "source_name";
    const std::string METADATA_ITEM_OUTPUT_FILENAME_COLNAME = "output_name";
    const std::string METADATA_ITEM_PARSERTIME_COLNAME = "runtime";
    const std::string METADATA_ITEM_TRACE_DURATION_COLNAME = "trace_duration";
    const std::string METADATA_ITEM_SOURCE_DATETYPE_COLNAME = "source_type";
    std::deque<std::string> columnNames_ = {};
    std::deque<std::string> values_ = {};
};

class ClockSnapshotData {
public:
    size_t AppendNewSnapshot(uint8_t clockId, uint64_t ts, const std::string& name)
    {
        clockIds_.emplace_back(clockId);
        ts_.emplace_back(ts);
        names_.emplace_back(name);
        return ts_.size();
    }
    size_t Size() const
    {
        return ts_.size();
    }
    const std::deque<uint8_t>& ClockIds() const
    {
        return clockIds_;
    }
    const std::deque<uint64_t>& Ts() const
    {
        return ts_;
    }
    const std::deque<std::string>& Names() const
    {
        return names_;
    }

private:
    std::deque<uint8_t> clockIds_ = {};
    std::deque<uint64_t> ts_ = {};
    std::deque<std::string> names_ = {};
};

class DataSourceClockIdData {
public:
    DataSourceClockIdData();
    size_t AppendNewDataSourceClockId(const std::string& dataSoruceName, uint8_t clockId)
    {
        dataSourceNames_.emplace_back(dataSoruceName);
        clockIds_.emplace_back(clockId);
        return dataSourceNames_.size();
    }
    size_t Size() const
    {
        return dataSourceNames_.size();
    }
    const std::deque<uint8_t>& ClockIds() const
    {
        return clockIds_;
    }
    const std::deque<std::string>& Names() const
    {
        return dataSourceNames_;
    }
    void SetDataSourceClockId(DataSourceType source, uint32_t id);
    void Finish();

private:
    std::deque<std::string> dataSourceNames_ = {};
    std::deque<uint8_t> clockIds_ = {};
    std::map<DataSourceType, uint8_t> dataSource2ClockIdMap_ = {};
    std::map<DataSourceType, std::string> dataSource2PluginNameMap_ = {};
};

class StatAndInfo {
public:
    StatAndInfo();
    ~StatAndInfo() = default;
    void IncreaseStat(SupportedTraceEventType eventType, StatType type);
    const uint32_t& GetValue(SupportedTraceEventType eventType, StatType type) const;
    const std::string& GetEvent(SupportedTraceEventType eventType) const;
    const std::string& GetStat(StatType type) const;
    const std::string& GetSeverityDesc(SupportedTraceEventType eventType, StatType type) const;
    const StatSeverityLevel& GetSeverity(SupportedTraceEventType eventType, StatType type) const;
    std::map<BuiltinClocks, std::string> clockid2ClockNameMap_ = {};

private:
    uint32_t statCount_[TRACE_EVENT_MAX][STAT_EVENT_MAX];
    std::string event_[TRACE_EVENT_MAX];
    std::string stat_[STAT_EVENT_MAX];
    std::string statSeverityDesc_[TRACE_EVENT_MAX][STAT_EVENT_MAX];
    StatSeverityLevel statSeverity_[TRACE_EVENT_MAX][STAT_EVENT_MAX];
    TraceStreamerConfig config_{};
#ifdef SUPPORTTHREAD
    SpinLock spinlock_;
#endif
};

class SymbolsData {
public:
    SymbolsData() = default;
    ~SymbolsData() = default;
    uint64_t Size() const;
    void UpdateSymbol(uint64_t addr, DataIndex funcNameDictIndex);
    const DataIndex& GetFunc(uint64_t addr) const;
    const std::deque<DataIndex>& GetConstFuncNames() const;
    const std::deque<uint64_t>& GetConstAddrs() const;
    void Clear()
    {
        addrs_.clear();
        funcName_.clear();
        symbolsMap_.clear();
    }

private:
    std::deque<uint64_t> addrs_ = {};
    std::deque<DataIndex> funcName_ = {};
    std::map<uint64_t, DataIndex> symbolsMap_ = {};
};

class DataType {
public:
    void UpdateNewDataType(BaseDataType dataType, DataIndex dataDescIndex);
    const std::deque<BaseDataType>& DataTypes() const;
    const std::deque<DataIndex>& DataDesc() const;
    size_t Size() const
    {
        return typeToDesc_.size();
    }
    void Clear()
    {
        dataTypes_.clear();
        descs_.clear();
        typeToDesc_.clear();
    }

private:
    std::deque<BaseDataType> dataTypes_ = {};
    std::deque<DataIndex> descs_ = {};
    std::unordered_map<BaseDataType, DataIndex> typeToDesc_ = {};
};

class ArgSet : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewArg(DataIndex nameId, BaseDataType dataType, int64_t value, size_t argSet);
    const std::deque<BaseDataType>& DataTypes() const;
    const std::deque<int64_t>& ValuesData() const;
    const std::deque<uint64_t>& ArgsData() const;
    const std::deque<DataIndex>& NamesData() const;

    void Clear() override
    {
        CacheBase::Clear();
        names_.clear();
        dataTypes_.clear();
        values_.clear();
        argset_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, names_, dataTypes_, values_, argset_);
    }

private:
    std::deque<uint64_t> names_ = {};
    std::deque<BaseDataType> dataTypes_ = {};
    std::deque<int64_t> values_ = {};
    std::deque<uint64_t> argset_ = {};
};

// memory-plugin and hisysevent update this
class TraceConfig : public CacheBase {
public:
    void AppendNewData(std::string traceSource, std::string key, std::string value);
    const std::deque<std::string>& TraceSource() const;
    const std::deque<std::string>& Key() const;
    const std::deque<std::string>& Value() const;
    void Clear() override
    {
        CacheBase::Clear();
        traceSource_.clear();
        key_.clear();
        value_.clear();
    }

private:
    std::deque<std::string> traceSource_ = {};
    std::deque<std::string> key_ = {};
    std::deque<std::string> value_ = {};
    uint32_t rowCounts_ = 0;
};
} // namespace TraceStdtype
} // namespace SysTuning

#endif // COMMON_STDTYPE_H
