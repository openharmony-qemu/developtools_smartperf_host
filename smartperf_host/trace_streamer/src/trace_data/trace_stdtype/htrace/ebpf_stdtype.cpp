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
#include "ebpf_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t FileSystemSample::AppendNewData(const FileSystemSampleRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    types_.emplace_back(context.type);
    ipids_.emplace_back(context.ipid);
    itids_.emplace_back(context.itid);
    startTs_.emplace_back(context.startTs);
    endTs_.emplace_back(context.endTs);
    durs_.emplace_back(context.dur);
    returnValues_.emplace_back(context.returnValue);
    errorCodes_.emplace_back(context.errorCode);
    fds_.emplace_back(context.fd);
    fileIds_.emplace_back(context.fileId);
    Sizes_.emplace_back(context.size);
    firstArguments_.emplace_back(context.firstArgument);
    secondArguments_.emplace_back(context.secondArgument);
    thirdArguments_.emplace_back(context.thirdArgument);
    fourthArguments_.emplace_back(context.fourthArgument);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &FileSystemSample::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t> &FileSystemSample::Types() const
{
    return types_;
}
const std::deque<uint32_t> &FileSystemSample::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> &FileSystemSample::Itids() const
{
    return itids_;
}
const std::deque<uint64_t> &FileSystemSample::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t> &FileSystemSample::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t> &FileSystemSample::Durs() const
{
    return durs_;
}
const std::deque<DataIndex> &FileSystemSample::ReturnValues() const
{
    return returnValues_;
}
const std::deque<DataIndex> &FileSystemSample::ErrorCodes() const
{
    return errorCodes_;
}
const std::deque<int32_t> &FileSystemSample::Fds() const
{
    return fds_;
}
const std::deque<DataIndex> &FileSystemSample::FileIds() const
{
    return fileIds_;
}
const std::deque<size_t> &FileSystemSample::Sizes() const
{
    return Sizes_;
}
const std::deque<DataIndex> &FileSystemSample::FirstArguments() const
{
    return firstArguments_;
}
const std::deque<DataIndex> &FileSystemSample::SecondArguments() const
{
    return secondArguments_;
}
const std::deque<DataIndex> &FileSystemSample::ThirdArguments() const
{
    return thirdArguments_;
}
const std::deque<DataIndex> &FileSystemSample::FourthArguments() const
{
    return fourthArguments_;
}

size_t PagedMemorySampleData::AppendNewData(const PagedMemorySampleDataRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    types_.emplace_back(context.type);
    ipids_.emplace_back(context.ipid);
    startTs_.emplace_back(context.startTs);
    endTs_.emplace_back(context.endTs);
    durs_.emplace_back(context.dur);
    Sizes_.emplace_back(context.size);
    addrs_.emplace_back(context.addr);
    itids_.emplace_back(context.itid);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &PagedMemorySampleData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t> &PagedMemorySampleData::Types() const
{
    return types_;
}
const std::deque<uint32_t> &PagedMemorySampleData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> &PagedMemorySampleData::Itids() const
{
    return itids_;
}
const std::deque<uint64_t> &PagedMemorySampleData::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t> &PagedMemorySampleData::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t> &PagedMemorySampleData::Durs() const
{
    return durs_;
}
const std::deque<size_t> &PagedMemorySampleData::Sizes() const
{
    return Sizes_;
}
const std::deque<DataIndex> &PagedMemorySampleData::Addr() const
{
    return addrs_;
}

void BioLatencySampleData::AppendNewData(const BioLatencySampleDataRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    types_.emplace_back(context.type);
    ipids_.emplace_back(context.ipid);
    itids_.emplace_back(context.itid);
    startTs_.emplace_back(context.startTs);
    endTs_.emplace_back(context.endTs);
    latencyDurs_.emplace_back(context.latencyDur);
    tiers_.emplace_back(context.tier);
    sizes_.emplace_back(context.size);
    blockNumbers_.emplace_back(context.blockNumber);
    filePathIds_.emplace_back(context.filePathId);
    durPer4ks_.emplace_back(context.durPer4k);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<uint32_t> &BioLatencySampleData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint64_t> &BioLatencySampleData::Types() const
{
    return types_;
}
const std::deque<uint32_t> &BioLatencySampleData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> &BioLatencySampleData::Itids() const
{
    return itids_;
}
const std::deque<uint64_t> &BioLatencySampleData::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t> &BioLatencySampleData::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t> &BioLatencySampleData::LatencyDurs() const
{
    return latencyDurs_;
}
const std::deque<uint32_t> &BioLatencySampleData::Tiers() const
{
    return tiers_;
}
const std::deque<uint64_t> &BioLatencySampleData::Sizes() const
{
    return sizes_;
}
const std::deque<uint64_t> &BioLatencySampleData::BlockNumbers() const
{
    return blockNumbers_;
}
const std::deque<uint64_t> &BioLatencySampleData::FilePathIds() const
{
    return filePathIds_;
}
const std::deque<uint64_t> &BioLatencySampleData::DurPer4k() const
{
    return durPer4ks_;
}

size_t EbpfCallStackData::AppendNewData(const EbpfCallStackDataRow &context)
{
    callChainIds_.emplace_back(context.callChainId);
    depths_.emplace_back(context.depth);
    ips_.emplace_back(context.ip);
    symbolIds_.emplace_back(context.symbolId);
    filePathIds_.emplace_back(context.filePathId);
    vaddrs_.emplace_back(context.vaddr);
    ids_.emplace_back(Size());
    return Size() - 1;
}
void EbpfCallStackData::UpdateEbpfSymbolInfo(size_t row, DataIndex symbolId)
{
    if (row >= Size()) {
        TS_LOGE("The updated row does not exist!");
        return;
    }
    symbolIds_[row] = symbolId;
}
const std::deque<uint32_t> &EbpfCallStackData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t> &EbpfCallStackData::Depths() const
{
    return depths_;
}
const std::deque<DataIndex> &EbpfCallStackData::Ips() const
{
    return ips_;
}
const std::deque<DataIndex> &EbpfCallStackData::SymbolIds() const
{
    return symbolIds_;
}
const std::deque<DataIndex> &EbpfCallStackData::FilePathIds() const
{
    return filePathIds_;
}
const std::deque<uint64_t> &EbpfCallStackData::Vaddrs() const
{
    return vaddrs_;
}
} // namespace TraceStdtype
} // namespace SysTuning
