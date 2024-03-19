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

#ifndef HIPERF_STDTYPE_H
#define HIPERF_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class PerfCallChain : public CacheBase {
public:
    size_t AppendNewPerfCallChain(uint32_t callChainId,
                                  uint32_t depth,
                                  uint64_t ip,
                                  uint64_t vaddrInFile,
                                  uint64_t fileId,
                                  uint64_t symbolId);
    const std::deque<uint32_t>& CallChainIds() const;
    const std::deque<uint32_t>& Depths() const;
    const std::deque<uint64_t>& Ips() const;
    const std::deque<uint64_t>& VaddrInFiles() const;
    const std::deque<uint64_t>& FileIds() const;
    const std::deque<uint64_t>& SymbolIds() const;
    const std::deque<DataIndex>& Names() const;
    void SetName(uint64_t index, DataIndex name);
    void UpdateSymbolId(size_t index, DataIndex symbolId);
    void Clear() override;

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint32_t> depths_ = {};
    std::deque<uint64_t> ips_ = {};
    std::deque<uint64_t> vaddrInFiles_ = {};
    std::deque<uint64_t> fileIds_ = {};
    std::deque<uint64_t> symbolIds_ = {};
    std::deque<DataIndex> names_ = {};
};

class PerfFiles : public CacheBase {
public:
    size_t AppendNewPerfFiles(uint64_t fileIds, uint32_t serial, DataIndex symbols, DataIndex filePath);
    const std::deque<uint64_t>& FileIds() const;
    const std::deque<DataIndex>& Symbols() const;
    const std::deque<DataIndex>& FilePaths() const;
    const std::deque<uint32_t>& Serials() const;
    void Clear() override;

private:
    std::deque<uint64_t> fileIds_ = {};
    std::deque<uint32_t> serials_ = {};
    std::deque<DataIndex> symbols_ = {};
    std::deque<DataIndex> filePaths_ = {};
};

class PerfSample : public CacheBase {
public:
    size_t AppendNewPerfSample(uint32_t sampleId,
                               uint64_t timeStamp,
                               uint32_t tid,
                               uint64_t eventCount,
                               uint64_t eventTypeId,
                               uint64_t timestampTrace,
                               uint64_t cpuId,
                               uint64_t threadState);
    const std::deque<uint32_t>& SampleIds() const;
    const std::deque<uint32_t>& Tids() const;
    const std::deque<uint64_t>& EventCounts() const;
    const std::deque<uint64_t>& EventTypeIds() const;
    const std::deque<uint64_t>& TimestampTraces() const;
    const std::deque<uint64_t>& CpuIds() const;
    const std::deque<DataIndex>& ThreadStates() const;
    void Clear() override;

private:
    std::deque<uint32_t> sampleIds_ = {};
    std::deque<uint32_t> tids_ = {};
    std::deque<uint64_t> eventCounts_ = {};
    std::deque<uint64_t> eventTypeIds_ = {};
    std::deque<uint64_t> timestampTraces_ = {};
    std::deque<uint64_t> cpuIds_ = {};
    std::deque<DataIndex> threadStates_ = {};
};

class PerfThread : public CacheBase {
public:
    size_t AppendNewPerfThread(uint32_t pid, uint32_t tid, DataIndex threadName);
    const std::deque<uint32_t>& Pids() const;
    const std::deque<uint32_t>& Tids() const;
    const std::deque<DataIndex>& ThreadNames() const;
    void Clear() override;

private:
    std::deque<uint32_t> tids_ = {};
    std::deque<uint32_t> pids_ = {};
    std::deque<DataIndex> threadNames_ = {};
};

class PerfReport : public CacheBase {
public:
    size_t AppendNewPerfReport(DataIndex type, DataIndex value);
    const std::deque<DataIndex>& Types() const;
    const std::deque<DataIndex>& Values() const;

private:
    std::deque<DataIndex> types_ = {};
    std::deque<DataIndex> values_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // HIPERF_STDTYPE_H
