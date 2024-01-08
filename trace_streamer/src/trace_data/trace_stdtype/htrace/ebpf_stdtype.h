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

#ifndef EBPF_STDTYPE_H
#define EBPF_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class FileSystemSample : public CacheBase {
public:
    size_t AppendNewData(uint32_t callChainId,
                         uint16_t type,
                         uint32_t ipid,
                         uint32_t itid,
                         uint64_t startTs,
                         uint64_t endTs,
                         uint64_t dur,
                         DataIndex returnValue,
                         DataIndex errorCode,
                         size_t size,
                         int32_t fd,
                         DataIndex fileId,
                         DataIndex firstArgument,
                         DataIndex secondArgument,
                         DataIndex thirdArgument,
                         DataIndex fourthArgument);
    const std::deque<uint32_t>& CallChainIds() const;
    const std::deque<uint16_t>& Types() const;
    const std::deque<uint32_t>& Ipids() const;
    const std::deque<uint32_t>& Itids() const;
    const std::deque<uint64_t>& StartTs() const;
    const std::deque<uint64_t>& EndTs() const;
    const std::deque<uint64_t>& Durs() const;
    const std::deque<DataIndex>& ReturnValues() const;
    const std::deque<DataIndex>& ErrorCodes() const;
    const std::deque<int32_t>& Fds() const;
    const std::deque<DataIndex>& FileIds() const;
    const std::deque<size_t>& Sizes() const;
    const std::deque<DataIndex>& FirstArguments() const;
    const std::deque<DataIndex>& SecondArguments() const;
    const std::deque<DataIndex>& ThirdArguments() const;
    const std::deque<DataIndex>& FourthArguments() const;
    void Clear() override
    {
        CacheBase::Clear();
        callChainIds_.clear();
        types_.clear();
        ipids_.clear();
        itids_.clear();
        startTs_.clear();
        endTs_.clear();
        durs_.clear();
        returnValues_.clear();
        errorCodes_.clear();
        fds_.clear();
        Sizes_.clear();
        firstArguments_.clear();
        secondArguments_.clear();
        thirdArguments_.clear();
        fourthArguments_.clear();
    }

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint16_t> types_ = {};
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint32_t> itids_ = {};
    std::deque<uint64_t> startTs_ = {};
    std::deque<uint64_t> endTs_ = {};
    std::deque<uint64_t> durs_ = {};
    std::deque<DataIndex> returnValues_ = {};
    std::deque<DataIndex> errorCodes_ = {};
    std::deque<int32_t> fds_ = {};
    std::deque<DataIndex> fileIds_ = {};
    std::deque<size_t> Sizes_ = {};
    std::deque<DataIndex> firstArguments_ = {};
    std::deque<DataIndex> secondArguments_ = {};
    std::deque<DataIndex> thirdArguments_ = {};
    std::deque<DataIndex> fourthArguments_ = {};
};

class PagedMemorySampleData : public CacheBase {
public:
    size_t AppendNewData(uint32_t callChainId,
                         uint16_t type,
                         uint32_t ipid,
                         uint64_t startTs,
                         uint64_t endTs,
                         uint64_t dur,
                         size_t size,
                         DataIndex addr,
                         uint32_t itid);
    const std::deque<uint32_t>& CallChainIds() const;
    const std::deque<uint16_t>& Types() const;
    const std::deque<uint32_t>& Ipids() const;
    const std::deque<uint64_t>& StartTs() const;
    const std::deque<uint64_t>& EndTs() const;
    const std::deque<uint64_t>& Durs() const;
    const std::deque<size_t>& Sizes() const;
    const std::deque<DataIndex>& Addr() const;
    const std::deque<uint32_t>& Itids() const;
    void Clear() override
    {
        CacheBase::Clear();
        callChainIds_.clear();
        types_.clear();
        ipids_.clear();
        startTs_.clear();
        endTs_.clear();
        durs_.clear();
        Sizes_.clear();
        addrs_.clear();
        itids_.clear();
    }

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint16_t> types_ = {};
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint64_t> startTs_ = {};
    std::deque<uint64_t> endTs_ = {};
    std::deque<uint64_t> durs_ = {};
    std::deque<size_t> Sizes_ = {};
    std::deque<DataIndex> addrs_ = {};
    std::deque<uint32_t> itids_ = {};
};
class BioLatencySampleData : public CacheBase {
public:
    void AppendNewData(uint32_t callChainId,
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
                       uint64_t durPer4k);
    const std::deque<uint32_t>& CallChainIds() const;
    const std::deque<uint64_t>& Types() const;
    const std::deque<uint32_t>& Ipids() const;
    const std::deque<uint32_t>& Itids() const;
    const std::deque<uint64_t>& StartTs() const;
    const std::deque<uint64_t>& EndTs() const;
    const std::deque<uint64_t>& LatencyDurs() const;
    const std::deque<uint32_t>& Tiers() const;
    const std::deque<uint64_t>& Sizes() const;
    const std::deque<uint64_t>& BlockNumbers() const;
    const std::deque<uint64_t>& FilePathIds() const;
    const std::deque<uint64_t>& DurPer4k() const;
    void Clear() override
    {
        CacheBase::Clear();
        callChainIds_.clear();
        types_.clear();
        ipids_.clear();
        itids_.clear();
        startTs_.clear();
        endTs_.clear();
        latencyDurs_.clear();
        tiers_.clear();
        sizes_.clear();
        blockNumbers_.clear();
        filePathIds_.clear();
        durPer4ks_.clear();
    }

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint64_t> types_ = {};
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint32_t> itids_ = {};
    std::deque<uint64_t> startTs_ = {};
    std::deque<uint64_t> endTs_ = {};
    std::deque<uint64_t> latencyDurs_ = {};
    std::deque<uint32_t> tiers_ = {};
    std::deque<uint64_t> sizes_ = {};
    std::deque<uint64_t> blockNumbers_ = {};
    std::deque<uint64_t> filePathIds_ = {};
    std::deque<uint64_t> durPer4ks_ = {};
    uint32_t rowCount_ = 0;
};
class EbpfCallStackData : public CacheBase {
public:
    size_t AppendNewData(uint32_t callChainId,
                         uint32_t depth,
                         DataIndex ip,
                         DataIndex symbolId,
                         DataIndex filePathId,
                         uint64_t vaddr);
    void UpdateEbpfSymbolInfo(size_t row, DataIndex symbolId);
    const std::deque<uint32_t>& CallChainIds() const;
    const std::deque<uint32_t>& Depths() const;
    const std::deque<DataIndex>& Ips() const;
    const std::deque<DataIndex>& SymbolIds() const;
    const std::deque<DataIndex>& FilePathIds() const;
    const std::deque<uint64_t>& Vaddrs() const;
    void Clear() override
    {
        CacheBase::Clear();
        callChainIds_.clear();
        depths_.clear();
        symbolIds_.clear();
        filePathIds_.clear();
        vaddrs_.clear();
    }

private:
    std::deque<uint32_t> callChainIds_ = {};
    std::deque<uint32_t> depths_ = {};
    std::deque<DataIndex> ips_ = {};
    std::deque<DataIndex> symbolIds_ = {};
    std::deque<DataIndex> filePathIds_ = {};
    std::deque<uint64_t> vaddrs_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // EBPF_STDTYPE_H
