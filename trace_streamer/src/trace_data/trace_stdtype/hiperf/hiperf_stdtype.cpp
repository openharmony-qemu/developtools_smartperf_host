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
#include "hiperf_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t PerfCallChain::AppendNewPerfCallChain(const PerfCallChainRow &context)
{
    ids_.emplace_back(Size());
    callChainIds_.emplace_back(context.callChainId);
    depths_.emplace_back(context.depth);
    ips_.emplace_back(context.ip);
    vaddrInFiles_.emplace_back(context.vaddrInFile);
    offsetToVaddrs_.emplace_back(context.offsetToVaddr);
    fileIds_.emplace_back(context.fileId);
    symbolIds_.emplace_back(context.symbolId);
    names_.emplace_back(INVALID_UINT64);
    sourceFileIds_.emplace_back(INVALID_DATAINDEX);
    lineNumbers_.emplace_back(INVALID_UINT64);
    return Size() - 1;
}
const std::deque<uint32_t> &PerfCallChain::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t> &PerfCallChain::Depths() const
{
    return depths_;
}
const std::deque<uint64_t> &PerfCallChain::Ips() const
{
    return ips_;
}
const std::deque<uint64_t> &PerfCallChain::VaddrInFiles() const
{
    return vaddrInFiles_;
}
const std::deque<uint64_t> &PerfCallChain::OffsetToVaddrs() const
{
    return offsetToVaddrs_;
}
const std::deque<uint64_t> &PerfCallChain::FileIds() const
{
    return fileIds_;
}
const std::deque<uint64_t> &PerfCallChain::SymbolIds() const
{
    return symbolIds_;
}

const std::deque<DataIndex> &PerfCallChain::Names() const
{
    return names_;
}
const std::deque<DataIndex> &PerfCallChain::SourceFileIds() const
{
    return sourceFileIds_;
}
const std::deque<uint64_t> &PerfCallChain::LineNumbers() const
{
    return lineNumbers_;
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
    offsetToVaddrs_.clear();
    fileIds_.clear();
    symbolIds_.clear();
    names_.clear();
    sourceFileIds_.clear();
    lineNumbers_.clear();
}
void PerfCallChain::UpdateSymbolId(size_t index, DataIndex symbolId)
{
    if (index < Size()) {
        symbolIds_[index] = symbolId;
    }
}
void PerfCallChain::UpdateSymbolRelatedData(size_t index,
                                            uint64_t vaddrInFile,
                                            uint64_t offsetToVaddr,
                                            uint64_t symbolId,
                                            DataIndex nameIndex)
{
    if (index < Size()) {
        vaddrInFiles_[index] = vaddrInFile;
        offsetToVaddrs_[index] = offsetToVaddr;
        symbolIds_[index] = symbolId;
        names_[index] = nameIndex;
    }
}
void PerfCallChain::SetSourceFileNameAndLineNumber(size_t index, DataIndex SourceFileIndex, uint64_t lineNumber)
{
    if (index < Size()) {
        sourceFileIds_[index] = SourceFileIndex;
        lineNumbers_[index] = lineNumber;
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
const std::deque<uint64_t> &PerfFiles::FileIds() const
{
    return fileIds_;
}

const std::deque<uint32_t> &PerfFiles::Serials() const
{
    return serials_;
}
const std::deque<DataIndex> &PerfFiles::Symbols() const
{
    return symbols_;
}
const std::deque<DataIndex> &PerfFiles::FilePaths() const
{
    return filePaths_;
}

bool PerfFiles::EraseFileIdSameData(uint64_t fileId)
{
    uint64_t start = INVALID_UINT64;
    uint64_t end = INVALID_UINT64;
    for (auto row = 0; row < Size(); row++) {
        if (fileIds_[row] == fileId) {
            if (start == INVALID_UINT64) {
                start = row;
                end = row;
            } else {
                end = row;
            }
        }
    }
    end++;
    if (start <= end && end < Size()) {
        ids_.erase(ids_.begin() + start, ids_.begin() + end);
        fileIds_.erase(fileIds_.begin() + start, fileIds_.begin() + end);
        serials_.erase(serials_.begin() + start, serials_.begin() + end);
        symbols_.erase(symbols_.begin() + start, symbols_.begin() + end);
        filePaths_.erase(filePaths_.begin() + start, filePaths_.begin() + end);
        return true;
    }
    return false;
}
void PerfFiles::Clear()
{
    CacheBase::Clear();
    fileIds_.clear();
    serials_.clear();
    symbols_.clear();
    filePaths_.clear();
}

size_t PerfSample::AppendNewPerfSample(const PerfSampleRow &perfSampleRow)
{
    ids_.emplace_back(Size());
    sampleIds_.emplace_back(perfSampleRow.sampleId);
    timeStamps_.emplace_back(perfSampleRow.timeStamp);
    tids_.emplace_back(perfSampleRow.tid);
    eventCounts_.emplace_back(perfSampleRow.eventCount);
    eventTypeIds_.emplace_back(perfSampleRow.eventTypeId);
    timestampTraces_.emplace_back(perfSampleRow.timestampTrace);
    cpuIds_.emplace_back(perfSampleRow.cpuId);
    threadStates_.emplace_back(perfSampleRow.threadState);
    return Size() - 1;
}
const std::deque<uint32_t> &PerfSample::SampleIds() const
{
    return sampleIds_;
}
const std::deque<uint32_t> &PerfSample::Tids() const
{
    return tids_;
}
const std::deque<uint64_t> &PerfSample::EventCounts() const
{
    return eventCounts_;
}
const std::deque<uint64_t> &PerfSample::EventTypeIds() const
{
    return eventTypeIds_;
}
const std::deque<uint64_t> &PerfSample::TimestampTraces() const
{
    return timestampTraces_;
}
const std::deque<uint64_t> &PerfSample::CpuIds() const
{
    return cpuIds_;
}
const std::deque<DataIndex> &PerfSample::ThreadStates() const
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
const std::deque<uint32_t> &PerfThread::Pids() const
{
    return pids_;
}
const std::deque<uint32_t> &PerfThread::Tids() const
{
    return tids_;
}
const std::deque<DataIndex> &PerfThread::ThreadNames() const
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
const std::deque<DataIndex> &PerfReport::Types() const
{
    return types_;
}
const std::deque<DataIndex> &PerfReport::Values() const
{
    return values_;
}
size_t PerfNapiAsync::AppendNewPerfNapiAsync(const PerfNapiAsyncRow &perfNapiAsyncRow)
{
    ids_.emplace_back(Size());
    timeStamps_.emplace_back(perfNapiAsyncRow.timeStamp);
    traceids_.emplace_back(perfNapiAsyncRow.traceid);
    cpuIds_.emplace_back(perfNapiAsyncRow.cpuId);
    internalTids_.emplace_back(perfNapiAsyncRow.threadId);
    processIds_.emplace_back(perfNapiAsyncRow.processId);
    callerCallchainids_.emplace_back(perfNapiAsyncRow.callerCallchainid);
    calleeCallchainids_.emplace_back(perfNapiAsyncRow.calleeCallchainid);
    perfSampleIds_.emplace_back(perfNapiAsyncRow.perfSampleId);
    eventCounts_.emplace_back(perfNapiAsyncRow.eventCount);
    eventTypeIds_.emplace_back(perfNapiAsyncRow.eventTypeId);
    return Size() - 1;
}
const std::deque<DataIndex> &PerfNapiAsync::Traceids() const
{
    return traceids_;
}
const std::deque<uint8_t> &PerfNapiAsync::CpuIds() const
{
    return cpuIds_;
}
const std::deque<uint32_t> &PerfNapiAsync::ProcessIds() const
{
    return processIds_;
}
const std::deque<uint32_t> &PerfNapiAsync::CallerCallchainids() const
{
    return callerCallchainids_;
}
const std::deque<uint32_t> &PerfNapiAsync::CalleeCallchainids() const
{
    return calleeCallchainids_;
}
const std::deque<uint64_t> &PerfNapiAsync::PerfSampleIds() const
{
    return perfSampleIds_;
}
const std::deque<uint64_t> &PerfNapiAsync::EventCounts() const
{
    return eventCounts_;
}
const std::deque<uint64_t> &PerfNapiAsync::EventTypeIds() const
{
    return eventTypeIds_;
}
void PerfNapiAsync::Clear()
{
    CacheBase::Clear();
    traceids_.clear();
    processIds_.clear();
    callerCallchainids_.clear();
    calleeCallchainids_.clear();
    perfSampleIds_.clear();
    eventCounts_.clear();
    eventTypeIds_.clear();
}
} // namespace TraceStdtype
} // namespace SysTuning
