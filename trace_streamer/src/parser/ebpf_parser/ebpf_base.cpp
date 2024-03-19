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
#include "ebpf_base.h"

namespace SysTuning {
namespace TraceStreamer {
EbpfBase::EbpfBase(TraceDataCache* dataCache, const TraceStreamerFilters* ctx)
    : EventParserBase(dataCache, ctx),
      pidAndIpToEbpfSymbolInfo_(EbpfSymbolInfo(false)),
      filePathIndexAndStValueToSymAddr_(nullptr),
      pidAndipsToCallId_(INVALID_UINT64)
{
}
EbpfBase::~EbpfBase()
{
    pidAndipsToCallId_.Clear();
    pidAndIpToEbpfSymbolInfo_.Clear();
    filePathIndexToPidAndIpMap_.clear();
    filePathIndexAndStValueToSymAddr_.Clear();
}
bool EbpfBase::InitEbpfDataParser(EbpfDataReader* reader)
{
    auto clockId = reader->GetEbpfDataHeader()->header.clock;
    auto itor = ebpfToTSClockType_.find(clockId);
    if (itor == ebpfToTSClockType_.end()) {
        return false;
    }
    clockId_ = ebpfToTSClockType_.at(clockId);
    reader_ = std::move(reader);
    return true;
}

void EbpfBase::ParseCallStackData(const uint64_t* userIpsAddr, uint16_t count, uint32_t pid, uint32_t callId)
{
    uint64_t depth = 0;
    for (auto i = count - 1; i >= 0; i--) {
        if (userIpsAddr[i] > MIN_USER_IP) {
            auto ebpfSymbolInfo = GetEbpfSymbolInfo(pid, userIpsAddr[i]);
            auto ipIndex = ConvertToHexTextIndex(userIpsAddr[i]);
            ipStrIndexToIpMap_.insert(std::make_pair(ipIndex, userIpsAddr[i]));
            auto row =
                traceDataCache_->GetEbpfCallStack()->AppendNewData(callId, depth++, ipIndex, ebpfSymbolInfo.symbolIndex,
                                                                   ebpfSymbolInfo.filePathIndex, ebpfSymbolInfo.vaddr);
            if (ebpfSymbolInfo.filePathIndex != INVALID_UINT64) {
                if (filePathIndexToCallStackRowMap_.count(ebpfSymbolInfo.filePathIndex) == 0) {
                    auto rows = std::make_shared<std::set<size_t>>();
                    rows->insert(row);
                    filePathIndexToCallStackRowMap_[ebpfSymbolInfo.filePathIndex] = rows;
                } else {
                    filePathIndexToCallStackRowMap_[ebpfSymbolInfo.filePathIndex]->insert(row);
                }
            }
        }
    }
    // Only one successful insertion is required, without considering repeated insertion failures
    callIdToPid_.insert(std::make_pair(callId, pid));
}

EbpfSymbolInfo EbpfBase::GetEbpfSymbolInfo(uint32_t pid, uint64_t ip)
{
    auto value = pidAndIpToEbpfSymbolInfo_.Find(pid, ip);
    if (value.flag) {
        return value;
    }
    return GetSymbolNameIndexFromElfSym(pid, ip);
}

DataIndex EbpfBase::GetSymbolNameIndexFromSymVaddr(const ElfEventFixedHeader* elfHeaderAddr, uint64_t symVaddr)
{
    uint32_t symbolStart = INVALID_UINT32;
    auto startValueToSymAddr = reader_->GetElfAddrAndStartValueToSymAddr().Find(elfHeaderAddr);
    if (!startValueToSymAddr) {
        return INVALID_UINT64;
    }
    auto end = startValueToSymAddr->upper_bound(symVaddr);
    auto symEntLen = elfHeaderAddr->symEntLen;
    auto length = std::distance(startValueToSymAddr->begin(), end);
    if (length > 0) {
        end--;
        if (symEntLen == ELF32_SYM) {
            GetSymbolStartIndex(reinterpret_cast<const Elf32_Sym*>(end->second), symbolStart, symVaddr);
        } else {
            GetSymbolStartIndex(reinterpret_cast<const Elf64_Sym*>(end->second), symbolStart, symVaddr);
        }
    }
    if (symbolStart == INVALID_UINT32) {
        return INVALID_UINT64;
    }
    // Take out the string according to the subscript
    auto strTabAddr = reinterpret_cast<const char*>(elfHeaderAddr + 1);
    if (symbolStart > elfHeaderAddr->strTabLen) {
        TS_LOGE("symbolStart = %u, elfHeaderAddr->strTabLen = %u", symbolStart, elfHeaderAddr->strTabLen);
        return INVALID_UINT64;
    }
    auto mangle = reinterpret_cast<const char*>(strTabAddr) + symbolStart;
    auto demangle = GetDemangleSymbolIndex(mangle);
    auto index = traceDataCache_->GetDataIndex(demangle);
    if (demangle != mangle) {
        free(demangle);
    }
    return index;
}
void EbpfBase::UpdateFilePathIndexToPidAndIpMap(DataIndex filePathIndex, uint32_t pid, uint64_t ip)
{
    auto itor = filePathIndexToPidAndIpMap_.find(filePathIndex);
    if (itor != filePathIndexToPidAndIpMap_.end()) {
        itor->second->insert(std::make_tuple(pid, ip));
    } else {
        auto pidAndIpSet = std::make_shared<std::set<std::tuple<uint32_t, uint64_t>>>();
        pidAndIpSet->insert(std::make_tuple(pid, ip));
        filePathIndexToPidAndIpMap_.insert(std::make_pair(filePathIndex, pidAndIpSet));
    }
}

template <typename StartToMapsAddr>
void EbpfBase::GetSymbolSave(EbpfSymbolInfo& ebpfSymbolInfo,
                             StartToMapsAddr& startToMapsAddr,
                             uint32_t pid,
                             uint64_t ip)
{
    // Obtain symbol information based on the given IP value and store the relevant information in the EbpfSymbolInfo
    // object
    uint64_t vmStart = INVALID_UINT64;
    uint64_t vmOffset = INVALID_UINT64;
    auto end = startToMapsAddr->upper_bound(ip);
    auto length = std::distance(startToMapsAddr->begin(), end);
    if (length > 0) {
        end--;
        // Follow the rules of front closing and rear opening, [start, end)
        if (ip < end->second->end) {
            vmStart = end->first;
            vmOffset = end->second->offset;
            ebpfSymbolInfo.filePathIndex =
                traceDataCache_->GetDataIndex(reinterpret_cast<const char*>((end->second) + 1));
        }
    }
    ebpfSymbolInfo.flag = true;
    if (ebpfSymbolInfo.filePathIndex == INVALID_INT64) {
        pidAndIpToEbpfSymbolInfo_.Insert(pid, ip, ebpfSymbolInfo);
        UpdateFilePathIndexToPidAndIpMap(ebpfSymbolInfo.filePathIndex, pid, ip);
        return;
    }

    auto itor = reader_->GetElfPathIndexToElfAddr().find(ebpfSymbolInfo.filePathIndex);
    if (itor == reader_->GetElfPathIndexToElfAddr().end()) {
        pidAndIpToEbpfSymbolInfo_.Insert(pid, ip, ebpfSymbolInfo);
        UpdateFilePathIndexToPidAndIpMap(ebpfSymbolInfo.filePathIndex, pid, ip);
        return;
    }
    uint64_t symVaddr = ip - vmStart + vmOffset + itor->second->textVaddr - itor->second->textOffset;
    ebpfSymbolInfo.vaddr = symVaddr;
    auto symbolIndex = GetSymbolNameIndexFromSymVaddr(itor->second, symVaddr);
    if (symbolIndex != INVALID_UINT64) {
        ebpfSymbolInfo.symbolIndex = symbolIndex;
    }
    pidAndIpToEbpfSymbolInfo_.Insert(pid, ip, ebpfSymbolInfo);
    UpdateFilePathIndexToPidAndIpMap(ebpfSymbolInfo.filePathIndex, pid, ip);
    return;
}

EbpfSymbolInfo EbpfBase::GetSymbolNameIndexFromElfSym(uint32_t pid, uint64_t ip)
{
    EbpfSymbolInfo ebpfSymbolInfo(false);
    // Follow the rules of front closing and rear opening, [start, end)
    if (ip < reader_->maxKernelAddr_ && ip >= reader_->minKernelAddr_) {
        ebpfSymbolInfo = reader_->GetSymbolNameIndexFromElfSym(ip);
        pidAndIpToEbpfSymbolInfo_.Insert(pid, ip, ebpfSymbolInfo);
        UpdateFilePathIndexToPidAndIpMap(ebpfSymbolInfo.filePathIndex, pid, ip);
        return ebpfSymbolInfo;
    }

    auto& pidAndStartAddrToMapsAddr = reader_->GetPidAndStartAddrToMapsAddr();
    auto startToMapsAddr = pidAndStartAddrToMapsAddr.Find(pid);
    if (!startToMapsAddr) {
        ebpfSymbolInfo.flag = true;
        pidAndIpToEbpfSymbolInfo_.Insert(pid, ip, ebpfSymbolInfo);
        UpdateFilePathIndexToPidAndIpMap(ebpfSymbolInfo.filePathIndex, pid, ip);
        return ebpfSymbolInfo;
    }

    GetSymbolSave(ebpfSymbolInfo, startToMapsAddr, pid, ip);
    return ebpfSymbolInfo;
}

DataIndex EbpfBase::ConvertToHexTextIndex(uint64_t number)
{
    if (number == INVALID_UINT64) {
        return number;
    }
    std::string str = "0x" + base::number(number, base::INTEGER_RADIX_TYPE_HEX);
    return traceDataCache_->GetDataIndex(str.c_str());
}
template <class T>
void EbpfBase::UpdateFilePathIndexAndStValueToSymAddrMap(T* firstSymbolAddr, const int size, uint32_t filePathIndex)
{
    for (auto i = 0; i < size; i++) {
        auto symAddr = firstSymbolAddr + i;
        if ((symAddr->st_info & STT_FUNC) && (symAddr->st_value)) {
            filePathIndexAndStValueToSymAddr_.Insert(filePathIndex, symAddr->st_value,
                                                     reinterpret_cast<const uint8_t*>(symAddr));
        }
    }
}
bool EbpfBase::EBPFReloadElfSymbolTable(const std::vector<std::unique_ptr<SymbolsFile>>& symbolsFiles)
{
    auto ebpfCallStackDate = traceDataCache_->GetEbpfCallStack();
    auto size = ebpfCallStackDate->Size();
    auto filePathIndexs = ebpfCallStackDate->FilePathIds();
    auto vaddrs = ebpfCallStackDate->Vaddrs();
    for (const auto& symbolsFile : symbolsFiles) {
        std::shared_ptr<std::set<size_t>> rows = nullptr;
        for (const auto& item : filePathIndexToCallStackRowMap_) {
            auto originFilePath = traceDataCache_->GetDataFromDict(item.first);
            if (EndWith(originFilePath, symbolsFile->filePath_)) {
                rows = item.second;
                break;
            }
        }
        if (rows == nullptr) {
            continue;
        }
        for (auto row : *rows) {
            auto dfxSymbol = symbolsFile->GetSymbolWithVaddr(vaddrs[row]);
            if (dfxSymbol.IsValid()) {
                auto symbolIndex = traceDataCache_->GetDataIndex(dfxSymbol.GetName());
                ebpfCallStackDate->UpdateEbpfSymbolInfo(row, symbolIndex);
            }
        }
    }
    return true;
}

template <class T>
void EbpfBase::GetSymbolStartIndex(T* elfSym, uint32_t& symbolStart, uint64_t symVaddr)
{
    if (elfSym->st_value + elfSym->st_size >= symVaddr) {
        symbolStart = elfSym->st_name;
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
