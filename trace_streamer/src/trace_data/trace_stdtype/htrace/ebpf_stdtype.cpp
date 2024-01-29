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
#include "ebpf_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t FileSystemSample::AppendNewData(uint32_t callChainId,
                                       uint16_t type,
                                       uint32_t iPid,
                                       uint32_t iTid,
                                       uint64_t startTs,
                                       uint64_t endTs,
                                       uint64_t dur,
                                       DataIndex retValue,
                                       DataIndex errCode,
                                       size_t size,
                                       int32_t fd,
                                       DataIndex fileId,
                                       DataIndex firstArgument,
                                       DataIndex secondArgument,
                                       DataIndex thirdArgument,
                                       DataIndex fourthArgument)
{
    callChainIds_.emplace_back(callChainId);
    types_.emplace_back(type);
    ipids_.emplace_back(iPid);
    itids_.emplace_back(iTid);
    startTs_.emplace_back(startTs);
    endTs_.emplace_back(endTs);
    durs_.emplace_back(dur);
    returnValues_.emplace_back(retValue);
    errorCodes_.emplace_back(errCode);
    fds_.emplace_back(fd);
    fileIds_.emplace_back(fileId);
    Sizes_.emplace_back(size);
    firstArguments_.emplace_back(firstArgument);
    secondArguments_.emplace_back(secondArgument);
    thirdArguments_.emplace_back(thirdArgument);
    fourthArguments_.emplace_back(fourthArgument);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t>& FileSystemSample::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t>& FileSystemSample::Types() const
{
    return types_;
}
const std::deque<uint32_t>& FileSystemSample::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t>& FileSystemSample::Itids() const
{
    return itids_;
}
const std::deque<uint64_t>& FileSystemSample::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t>& FileSystemSample::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t>& FileSystemSample::Durs() const
{
    return durs_;
}
const std::deque<DataIndex>& FileSystemSample::ReturnValues() const
{
    return returnValues_;
}
const std::deque<DataIndex>& FileSystemSample::ErrorCodes() const
{
    return errorCodes_;
}
const std::deque<int32_t>& FileSystemSample::Fds() const
{
    return fds_;
}
const std::deque<DataIndex>& FileSystemSample::FileIds() const
{
    return fileIds_;
}
const std::deque<size_t>& FileSystemSample::Sizes() const
{
    return Sizes_;
}
const std::deque<DataIndex>& FileSystemSample::FirstArguments() const
{
    return firstArguments_;
}
const std::deque<DataIndex>& FileSystemSample::SecondArguments() const
{
    return secondArguments_;
}
const std::deque<DataIndex>& FileSystemSample::ThirdArguments() const
{
    return thirdArguments_;
}
const std::deque<DataIndex>& FileSystemSample::FourthArguments() const
{
    return fourthArguments_;
}

size_t PagedMemorySampleData::AppendNewData(uint32_t callChainId,
                                            uint16_t type,
                                            uint32_t ipid,
                                            uint64_t startTs,
                                            uint64_t endTs,
                                            uint64_t dur,
                                            size_t size,
                                            DataIndex addr,
                                            uint32_t itid)
{
    callChainIds_.emplace_back(callChainId);
    types_.emplace_back(type);
    ipids_.emplace_back(ipid);
    startTs_.emplace_back(startTs);
    endTs_.emplace_back(endTs);
    durs_.emplace_back(dur);
    Sizes_.emplace_back(size);
    addrs_.emplace_back(addr);
    itids_.emplace_back(itid);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t>& PagedMemorySampleData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint16_t>& PagedMemorySampleData::Types() const
{
    return types_;
}
const std::deque<uint32_t>& PagedMemorySampleData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t>& PagedMemorySampleData::Itids() const
{
    return itids_;
}
const std::deque<uint64_t>& PagedMemorySampleData::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t>& PagedMemorySampleData::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t>& PagedMemorySampleData::Durs() const
{
    return durs_;
}
const std::deque<size_t>& PagedMemorySampleData::Sizes() const
{
    return Sizes_;
}
const std::deque<DataIndex>& PagedMemorySampleData::Addr() const
{
    return addrs_;
}

void BioLatencySampleData::AppendNewData(uint32_t callChainId,
                                         uint64_t type,
                                         uint32_t ipid,
                                         uint32_t itid,
                                         uint64_t startTs,
                                         uint64_t endTs,
                                         uint64_t latencyDur,
                                         uint32_t tier,
                                         uint64_t size,
                                         uint64_t blockNumber,
                                         uint64_t filePathId,
                                         uint64_t durPer4k)
{
    callChainIds_.emplace_back(callChainId);
    types_.emplace_back(type);
    ipids_.emplace_back(ipid);
    itids_.emplace_back(itid);
    startTs_.emplace_back(startTs);
    endTs_.emplace_back(endTs);
    latencyDurs_.emplace_back(latencyDur);
    tiers_.emplace_back(tier);
    sizes_.emplace_back(size);
    blockNumbers_.emplace_back(blockNumber);
    filePathIds_.emplace_back(filePathId);
    durPer4ks_.emplace_back(durPer4k);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<uint32_t>& BioLatencySampleData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint64_t>& BioLatencySampleData::Types() const
{
    return types_;
}
const std::deque<uint32_t>& BioLatencySampleData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t>& BioLatencySampleData::Itids() const
{
    return itids_;
}
const std::deque<uint64_t>& BioLatencySampleData::StartTs() const
{
    return startTs_;
}
const std::deque<uint64_t>& BioLatencySampleData::EndTs() const
{
    return endTs_;
}
const std::deque<uint64_t>& BioLatencySampleData::LatencyDurs() const
{
    return latencyDurs_;
}
const std::deque<uint32_t>& BioLatencySampleData::Tiers() const
{
    return tiers_;
}
const std::deque<uint64_t>& BioLatencySampleData::Sizes() const
{
    return sizes_;
}
const std::deque<uint64_t>& BioLatencySampleData::BlockNumbers() const
{
    return blockNumbers_;
}
const std::deque<uint64_t>& BioLatencySampleData::FilePathIds() const
{
    return filePathIds_;
}
const std::deque<uint64_t>& BioLatencySampleData::DurPer4k() const
{
    return durPer4ks_;
}

size_t EbpfCallStackData::AppendNewData(uint32_t callChainId,
                                        uint32_t depth,
                                        DataIndex ip,
                                        DataIndex symbolId,
                                        DataIndex filePathId,
                                        uint64_t vaddr)
{
    callChainIds_.emplace_back(callChainId);
    depths_.emplace_back(depth);
    ips_.emplace_back(ip);
    symbolIds_.emplace_back(symbolId);
    filePathIds_.emplace_back(filePathId);
    vaddrs_.emplace_back(vaddr);
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
const std::deque<uint32_t>& EbpfCallStackData::CallChainIds() const
{
    return callChainIds_;
}
const std::deque<uint32_t>& EbpfCallStackData::Depths() const
{
    return depths_;
}
const std::deque<DataIndex>& EbpfCallStackData::Ips() const
{
    return ips_;
}
const std::deque<DataIndex>& EbpfCallStackData::SymbolIds() const
{
    return symbolIds_;
}
const std::deque<DataIndex>& EbpfCallStackData::FilePathIds() const
{
    return filePathIds_;
}
const std::deque<uint64_t>& EbpfCallStackData::Vaddrs() const
{
    return vaddrs_;
}
} // namespace TraceStdtype
} // namespace SysTuning
