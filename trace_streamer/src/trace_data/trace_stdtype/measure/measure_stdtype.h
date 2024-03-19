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

#ifndef MEASURE_STDTYPE_H
#define MEASURE_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class Filter : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewFilterData(std::string type, std::string name, uint64_t sourceArgSetId);
    const std::deque<std::string>& NameData() const
    {
        return nameDeque_;
    }
    const std::deque<std::string>& TypeData() const
    {
        return typeDeque_;
    }
    const std::deque<uint64_t>& SourceArgSetIdData() const
    {
        return sourceArgSetId_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        nameDeque_.clear();
        typeDeque_.clear();
        sourceArgSetId_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, nameDeque_, typeDeque_, sourceArgSetId_);
    }

private:
    std::deque<std::string> nameDeque_ = {};
    std::deque<std::string> typeDeque_ = {};
    std::deque<uint64_t> sourceArgSetId_ = {};
};

class Measure : public CacheBase, public BatchCacheBase {
public:
    size_t AppendMeasureData(uint32_t type, uint64_t timeStamp, int64_t value, uint32_t filterId);
    const std::deque<uint32_t>& TypeData() const
    {
        return typeDeque_;
    }
    const std::deque<int64_t>& ValuesData() const
    {
        return valuesDeque_;
    }
    const std::deque<uint64_t>& DursData() const
    {
        return durDeque_;
    }
    void SetDur(uint32_t row, uint64_t timeStamp);
    const std::deque<uint32_t>& FilterIdData() const
    {
        return filterIdDeque_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        typeDeque_.clear();
        durDeque_.clear();
        valuesDeque_.clear();
        filterIdDeque_.clear();
    }
    void UpdateReadySize(size_t size) override
    {
        UpdatePrevSizeAndAdapterRows(size);
    }
    void ClearExportedData() override
    {
        EraseElements(timeStamps_, typeDeque_, durDeque_, valuesDeque_, filterIdDeque_);
    }
    std::map<uint32_t, uint32_t>* GetFilterIdToRow()
    {
        return &filterIdToRow_;
    }
    void ClearRowMap()
    {
        filterIdToRow_.clear();
    }

private:
    void UpdatePrevSizeAndAdapterRows(size_t size);
    std::deque<uint32_t> typeDeque_ = {};
    std::deque<uint64_t> durDeque_ = {};
    std::deque<int64_t> valuesDeque_ = {};
    std::deque<uint32_t> filterIdDeque_ = {};
    std::map<uint32_t, uint32_t> filterIdToRow_ = {};
};

class SysMeasureFilter : public CacheBase {
public:
    size_t AppendNewFilter(uint64_t filterId, DataIndex type, DataIndex nameId);
    const std::deque<DataIndex>& NamesData() const;
    const std::deque<DataIndex>& TypesData() const;
    void Clear() override
    {
        CacheBase::Clear();
        types_.clear();
        names_.clear();
    }

private:
    std::deque<DataIndex> types_ = {};
    std::deque<DataIndex> names_ = {};
};

class CpuMeasureFilter : public CacheBase, public BatchCacheBase {
public:
    inline size_t AppendNewFilter(uint64_t filterId, DataIndex name, uint32_t cpu)
    {
        ids_.emplace_back(filterId);
        cpu_.emplace_back(cpu);
        name_.emplace_back(name);
        return Size() - 1;
    }

    const std::deque<uint32_t>& CpuData() const
    {
        return cpu_;
    }

    const std::deque<DataIndex>& NameData() const
    {
        return name_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        cpu_.clear();
        name_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, cpu_, name_);
    }

private:
    std::deque<uint32_t> cpu_ = {};
    std::deque<DataIndex> name_ = {};
};

class ProcessMeasureFilter : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewFilter(uint64_t id, DataIndex name, uint32_t internalPid);

    const std::deque<uint32_t>& UpidsData() const
    {
        return internalPids_;
    }

    const std::deque<DataIndex>& NamesData() const
    {
        return names_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        internalPids_.clear();
        names_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(internalTids_, ids_, internalPids_, names_);
    }

private:
    std::deque<uint32_t> internalPids_ = {};
    std::deque<DataIndex> names_ = {};
};

class ClockEventData : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewFilter(uint64_t id, DataIndex type, DataIndex name, uint64_t cpu);

    const std::deque<uint64_t>& CpusData() const
    {
        return cpus_;
    }

    const std::deque<DataIndex>& NamesData() const
    {
        return names_;
    }
    const std::deque<DataIndex>& TypesData() const
    {
        return types_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        cpus_.clear();
        names_.clear();
        types_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, cpus_, names_, types_);
    }

private:
    std::deque<uint64_t> cpus_ = {}; // in clock_set_rate event, it save cpu
    std::deque<DataIndex> names_ = {};
    std::deque<DataIndex> types_ = {};
};

class ClkEventData : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNewFilter(uint64_t id, uint64_t rate, DataIndex name, uint64_t cpu);

    const std::deque<DataIndex>& NamesData() const
    {
        return names_;
    }
    const std::deque<uint64_t>& RatesData() const
    {
        return rates_;
    }
    const std::deque<uint64_t>& CpusData() const
    {
        return cpus_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        names_.clear();
        rates_.clear();
        cpus_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, cpus_, names_, rates_);
    }

private:
    std::deque<DataIndex> names_;
    std::deque<uint64_t> rates_;
    std::deque<uint64_t> cpus_;
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // MEASURE_STDTYPE_H
