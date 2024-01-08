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
#include "hiperf_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t PerfCallChain::AppendNewPerfCallChain(uint32_t callChainId,
                                             uint32_t depth,
                                             uint64_t ip,
                                             uint64_t vaddrInFile,
                                             uint64_t fileId,
                                             uint64_t symbolId)
{
    ids_.emplace_back(Size());
    callChainIds_.emplace_back(callChainId);
    depths_.emplace_back(depth);
    ips_.emplace_back(ip);
    vaddrInFiles_.emplace_back(vaddrInFile);
    fileIds_.emplace_back(fileId);
    symbolIds_.emplace_back(symbolId);
    names_.emplace_back(INVALID_UINT64);
    return Size() - 1;
}
const std::deque<uint32_t>& PerfCallChain::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t>& PerfCallChain::Depths() const
{
    return depths_;
}
const std::deque<uint64_t>& PerfCallChain::Ips() const
{
    return ips_;
}
const std::deque<uint64_t>& PerfCallChain::VaddrInFiles() const
{
    return vaddrInFiles_;
}
const std::deque<uint64_t>& PerfCallChain::FileIds() const
{
    return fileIds_;
}
const std::deque<uint64_t>& PerfCallChain::SymbolIds() const
{
    return symbolIds_;
}

const std::deque<DataIndex>& PerfCallChain::Names() const
{
    return names_;
}
void PerfCallChain::SetName(uint64_t index, DataIndex name)
{
    names_[index] = name;
}
void PerfCallChain::Clear()
{
    CacheBase::Clear();
    callChainIds_.clear();
    depths_.clear();
    ips_.clear();
    vaddrInFiles_.clear();
    fileIds_.clear();
    symbolIds_.clear();
    names_.clear();
}
void PerfCallChain::UpdateSymbolId(size_t index, DataIndex symbolId)
{
    if (index < Size()) {
        symbolIds_[index] = symbolId;
    }
}
size_t PerfFiles::AppendNewPerfFiles(uint64_t fileIds, uint32_t serial, DataIndex symbols, DataIndex filePath)
{
    ids_.emplace_back(Size());
    fileIds_.emplace_back(fileIds);
    serials_.emplace_back(serial);
    symbols_.emplace_back(symbols);
    filePaths_.emplace_back(filePath);
    return Size() - 1;
}
const std::deque<uint64_t>& PerfFiles::FileIds() const
{
    return fileIds_;
}

const std::deque<uint32_t>& PerfFiles::Serials() const
{
    return serials_;
}
const std::deque<DataIndex>& PerfFiles::Symbols() const
{
    return symbols_;
}
const std::deque<DataIndex>& PerfFiles::FilePaths() const
{
    return filePaths_;
}

void PerfFiles::Clear()
{
    CacheBase::Clear();
    fileIds_.clear();
    serials_.clear();
    symbols_.clear();
    filePaths_.clear();
}

size_t PerfSample::AppendNewPerfSample(uint32_t sampleId,
                                       uint64_t timeStamp,
                                       uint32_t tid,
                                       uint64_t eventCount,
                                       uint64_t eventTypeId,
                                       uint64_t timestampTrace,
                                       uint64_t cpuId,
                                       uint64_t threadState)
{
    ids_.emplace_back(Size());
    sampleIds_.emplace_back(sampleId);
    timeStamps_.emplace_back(timeStamp);
    tids_.emplace_back(tid);
    eventCounts_.emplace_back(eventCount);
    eventTypeIds_.emplace_back(eventTypeId);
    timestampTraces_.emplace_back(timestampTrace);
    cpuIds_.emplace_back(cpuId);
    threadStates_.emplace_back(threadState);
    return Size() - 1;
}
const std::deque<uint32_t>& PerfSample::SampleIds() const
{
    return sampleIds_;
}
const std::deque<uint32_t>& PerfSample::Tids() const
{
    return tids_;
}
const std::deque<uint64_t>& PerfSample::EventCounts() const
{
    return eventCounts_;
}
const std::deque<uint64_t>& PerfSample::EventTypeIds() const
{
    return eventTypeIds_;
}
const std::deque<uint64_t>& PerfSample::TimestampTraces() const
{
    return timestampTraces_;
}
const std::deque<uint64_t>& PerfSample::CpuIds() const
{
    return cpuIds_;
}
const std::deque<DataIndex>& PerfSample::ThreadStates() const
{
    return threadStates_;
}

void PerfSample::Clear()
{
    CacheBase::Clear();
    sampleIds_.clear();
    tids_.clear();
    eventCounts_.clear();
    eventTypeIds_.clear();
    timestampTraces_.clear();
    cpuIds_.clear();
    threadStates_.clear();
}

size_t PerfThread::AppendNewPerfThread(uint32_t pid, uint32_t tid, DataIndex threadName)
{
    ids_.emplace_back(Size());
    pids_.emplace_back(pid);
    tids_.emplace_back(tid);
    threadNames_.emplace_back(threadName);
    return Size() - 1;
}
const std::deque<uint32_t>& PerfThread::Pids() const
{
    return pids_;
}
const std::deque<uint32_t>& PerfThread::Tids() const
{
    return tids_;
}
const std::deque<DataIndex>& PerfThread::ThreadNames() const
{
    return threadNames_;
}
void PerfThread::Clear()
{
    CacheBase::Clear();
    tids_.clear();
    pids_.clear();
    threadNames_.clear();
}
size_t PerfReport::AppendNewPerfReport(DataIndex type, DataIndex value)
{
    ids_.emplace_back(Size());
    types_.emplace_back(type);
    values_.emplace_back(value);
    return Size() - 1;
}
const std::deque<DataIndex>& PerfReport::Types() const
{
    return types_;
}
const std::deque<DataIndex>& PerfReport::Values() const
{
    return values_;
}
} // namespace TraceStdtype
} // namespace SysTuning
