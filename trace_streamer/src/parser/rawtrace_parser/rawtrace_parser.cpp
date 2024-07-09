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

#include "rawtrace_parser.h"
#include <cinttypes>
#if IS_WASM
#include "wasm_func.h"
#endif
#include "string_help.h"
namespace SysTuning {
namespace TraceStreamer {
RawTraceParser::RawTraceParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters)
    : ParserBase(filters),
      cpuDetail_(std::make_unique<FtraceCpuDetailMsg>()),
      cpuDetailParser_(std::make_unique<CpuDetailParser>(dataCache, filters)),
      ftraceProcessor_(std::make_unique<FtraceProcessor>(dataCache)),
      ksymsProcessor_(std::make_unique<KernelSymbolsProcessor>(dataCache, filters)),
      traceDataCache_(dataCache)
{
}

RawTraceParser::~RawTraceParser() {}
void RawTraceParser::ParseTraceDataItem(const std::string &buffer) {}
void RawTraceParser::WaitForParserEnd()
{
    cpuDetailParser_->FilterAllEvents(*cpuDetail_.get(), true);
    cpuDetailParser_->FinishCpuDetailParser();
    UpdateTraceMinRange();
    restCommDataCnt_ = 0;
    hasGotHeader_ = false;
    curCpuCoreNum_ = 0;
    ClearRawTraceData();
    TS_LOGI("Parser raw trace end!");
}
void RawTraceParser::UpdateTraceMinRange()
{
    if (!traceDataCache_->RawTraceCutStartTsEnabled()) {
        return;
    }
    auto schedSlice = traceDataCache_->GetConstSchedSliceData();
    std::set<uint32_t> uniqueCpuIdSet;
    uint64_t cpuRunningStatMinTime = INVALID_TIME;
    for (size_t i = 0; i < schedSlice.Size() && uniqueCpuIdSet.size() <= curCpuCoreNum_; i++) {
        auto iter = uniqueCpuIdSet.find(schedSlice.CpusData()[i]);
        if (iter != uniqueCpuIdSet.end()) {
            continue;
        }
        uniqueCpuIdSet.emplace(schedSlice.CpusData()[i]);
        cpuRunningStatMinTime = schedSlice.TimeStampData()[i];
        TS_LOGW("curCpuId=%u, cpuRunningStatMinTime=%" PRIu64 "", schedSlice.CpusData()[i], cpuRunningStatMinTime);
    }
    if (cpuRunningStatMinTime != INVALID_TIME) {
        traceDataCache_->UpdateTraceMinTime(cpuRunningStatMinTime);
    }
}
bool RawTraceParser::InitRawTraceFileHeader(std::deque<uint8_t>::iterator &packagesCurIter)
{
    TS_CHECK_TRUE(packagesBuffer_.size() >= sizeof(RawTraceFileHeader), false,
                  "buffer size less than rawtrace file header");
    RawTraceFileHeader header;
    std::copy(packagesBuffer_.begin(), packagesBuffer_.begin() + sizeof(RawTraceFileHeader),
              reinterpret_cast<uint8_t *>(&header));
    TS_LOGI("magicNumber=%d fileType=%d", header.magicNumber, header.fileType);

    fileType_ = header.fileType;
    if (traceDataCache_->isSplitFile_) {
        // To resolve the second incoming file, it is necessary to reset the previously set variables to zero
        ClearRawTraceData();
        rawTraceSplitCommData_.emplace_back(SpliteDataInfo(curFileOffset_, sizeof(RawTraceFileHeader)));
        curFileOffset_ += sizeof(RawTraceFileHeader);
    }
    packagesCurIter += sizeof(RawTraceFileHeader);
    packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
    hasGotHeader_ = true;
    return true;
}
bool RawTraceParser::InitEventFormats(const std::string &buffer)
{
#ifdef IS_WASM
    restCommDataCnt_ = INVALID_UINT8; // ensure that the restCommData is parsed only once
#endif
    std::string line;
    std::istringstream iss(buffer);
    std::stringstream eventFormat;
    while (std::getline(iss, line)) {
        eventFormat << line << '\n';
        if (base::StartWith(line, eventEndCmd_)) {
            ftraceProcessor_->SetupEvent(eventFormat.str());
            eventFormat.str("");
        }
    }
    return true;
}
bool RawTraceParser::UpdateCpuCoreMax(uint32_t cpuId)
{
    if (cpuId >= curCpuCoreNum_) {
        curCpuCoreNum_++;
        TS_LOGI("cpuId=%u, curCpuCoreNum_=%u", cpuId, curCpuCoreNum_);
        return false;
    }
    if (cpuDetailParser_->cpuCoreMax_ == CPU_CORE_MAX) {
        cpuDetailParser_->ResizeStandAloneCpuEventList(curCpuCoreNum_);
    }
    return true;
}

bool RawTraceParser::ParseCpuRawData(uint32_t cpuId, const std::string &buffer, uint32_t curType)
{
    UpdateCpuCoreMax(cpuId);
    // splice the data curType adn size of each cup that matches the timestamp
    uint32_t curFileOffset = curFileOffset_ + sizeof(curType) + sizeof(uint32_t);
    uint32_t splitOffset = 0;
    uint32_t splitSize = 0;
    bool isSplitPosition = false;
    if (0 == buffer.size() && traceDataCache_->isSplitFile_) {
        // For rawtrace. fileType_=0, in order to count the number of CPUs and maintain the CPU data structure (which
        // will also be passed to data types with CPU size 0), it is necessary to save the data during the cutting
        // process and exit the buffer directly.
        rawTraceSplitCpuData_.emplace_back(SpliteDataInfo(curFileOffset, 0, curType));
    }
    TS_CHECK_TRUE(buffer.size() > 0, true, "cur cpu(%u) raw data is null!", cpuId);
    auto startPtr = reinterpret_cast<const uint8_t *>(buffer.c_str());
    auto endPtr = startPtr + buffer.size();
    cpuDetail_->set_cpu(cpuId);
    for (uint8_t *page = const_cast<uint8_t *>(startPtr); page < endPtr; page += FTRACE_PAGE_SIZE) {
        bool haveSplitSeg = false;
        TS_CHECK_TRUE(ftraceProcessor_->HandlePage(*cpuDetail_.get(), *cpuDetailParser_.get(), page, haveSplitSeg),
                      false, "handle page failed!");
        if (haveSplitSeg) {
            splitSize += FTRACE_PAGE_SIZE;
            if (!isSplitPosition) {
                // splitOffset = first Save the migration amount of CPURAW that currently matches the timestamp
                isSplitPosition = true;
                splitOffset = curFileOffset;
            }
        }
        curFileOffset += FTRACE_PAGE_SIZE;
    }
    if (traceDataCache_->isSplitFile_) {
        // Skip parsing data for timestamp or non timestamp compliant data
        if (splitSize > 0) {
            rawTraceSplitCpuData_.emplace_back(SpliteDataInfo(splitOffset, splitSize, curType));
        } else {
            // For rawtrace. fileType_=0,In order to count the number of CPUs and maintain the CPU data structure (also
            // through For CPU data types with a size of 0, it is necessary to set the size to 0 during the cutting
            // process to save CPU data that does not meet the cutting event stamp
            rawTraceSplitCpuData_.emplace_back(SpliteDataInfo(curFileOffset, 0, curType));
        }
        return true;
    }
    if (cpuDetailParser_->cpuCoreMax_ != CPU_CORE_MAX) {
        cpuDetailParser_->FilterAllEvents(*cpuDetail_.get());
    }
    return true;
}

bool RawTraceParser::HmParseCpuRawData(const std::string &buffer, uint32_t curType)
{
    TS_CHECK_TRUE(buffer.size() > 0, true, "hm raw data is null!");
    auto startPtr = reinterpret_cast<const uint8_t *>(buffer.c_str());
    auto endPtr = startPtr + buffer.size();
    // splice the data curType adn size of each cup that matches the timestamp
    uint32_t curFileOffset = curFileOffset_ + sizeof(curType) + sizeof(uint32_t);
    uint32_t splitOffset = 0;
    uint32_t splitSize = 0;
    bool isSplitPosition = false;
    for (uint8_t *data = const_cast<uint8_t *>(startPtr); data < endPtr; data += FTRACE_PAGE_SIZE) {
        bool haveSplitSeg = false;
        TS_CHECK_TRUE(ftraceProcessor_->HmParsePageData(*cpuDetail_.get(), *cpuDetailParser_.get(), data, haveSplitSeg),
                      false, "hm parse page failed!");
        if (haveSplitSeg) {
            splitSize += FTRACE_PAGE_SIZE;
            if (!isSplitPosition) {
                // splitOffset = first Save the migration amount of CPURAW that currently matches the timestamp
                isSplitPosition = true;
                splitOffset = curFileOffset;
            }
        }
        if (!traceDataCache_->isSplitFile_) {
            // No specific analysis is required for time cutting
            cpuDetailParser_->FilterAllEvents(*cpuDetail_.get());
        }
        curFileOffset += FTRACE_PAGE_SIZE;
    }
    if (traceDataCache_->isSplitFile_ && splitSize > 0) {
        rawTraceSplitCpuData_.emplace_back(SpliteDataInfo(splitOffset, splitSize, curType));
        // For rawtrace. fileType_=1,There is no need to record the total number of CPUs, so for data that does not meet
        // the cutting timestamp, there is no need to record and save it
        return true;
    }
    TS_LOGD("mark.debug. HmParseCpuRawData end success");
    return true;
}

bool RawTraceParser::ParseLastCommData(uint8_t type, const std::string &buffer)
{
    TS_CHECK_TRUE_RET(restCommDataCnt_ != INVALID_UINT8, false);
    switch (type) {
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CMDLINES):
            TS_CHECK_TRUE(ftraceProcessor_->HandleCmdlines(buffer), false, "parse cmdlines failed");
            break;
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_TGIDS):
            TS_CHECK_TRUE(ftraceProcessor_->HandleTgids(buffer), false, "parse tgid failed");
            break;
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_HEADER_PAGE):
            TS_CHECK_TRUE(ftraceProcessor_->HandleHeaderPageFormat(buffer), false, "init header page failed");
            break;
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_PRINTK_FORMATS):
            TS_CHECK_TRUE(PrintkFormatsProcessor::GetInstance().HandlePrintkSyms(buffer), false,
                          "init printk_formats failed");
            break;
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_KALLSYMS):
            TS_CHECK_TRUE(ksymsProcessor_->HandleKallSyms(buffer), false, "init printk_formats failed");
            break;
        default:
#ifdef IS_WASM
            return false;
#else
            break;
#endif
    }
    ++restCommDataCnt_;
    return true;
}

void RawTraceParser::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish)
{
    packagesBuffer_.insert(packagesBuffer_.end(), &bufferStr[0], &bufferStr[size]);
    auto packagesCurIter = packagesBuffer_.begin();
    if (ParseDataRecursively(packagesCurIter)) {
        packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
    }
    if (isFinish) {
        restCommDataCnt_ = INVALID_UINT8;
        hasGotHeader_ = false;
        packagesBuffer_.clear();
    }
    return;
}

bool RawTraceParser::ProcessRawTraceContent(std::string &bufferLine, uint8_t curType)
{
    if (curType >= static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CPU_RAW) &&
        curType < static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_HEADER_PAGE)) {
        curType = static_cast<uint32_t>(curType);
        if (fileType_ == static_cast<uint8_t>(RawTraceFileType::FILE_RAW_TRACE)) {
            auto cpuId = curType - static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CPU_RAW);
            TS_CHECK_TRUE(ParseCpuRawData(cpuId, bufferLine, curType), false, "cpu raw parse failed");
        } else if (fileType_ == static_cast<uint8_t>(RawTraceFileType::HM_FILE_RAW_TRACE)) {
            TS_CHECK_TRUE(HmParseCpuRawData(bufferLine, curType), false, "hm raw trace parse failed");
        }
        if (traceDataCache_->isSplitFile_) {
            curFileOffset_ += sizeof(uint32_t) + sizeof(uint32_t) + bufferLine.size();
        }
    } else if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_EVENTS_FORMAT)) {
        TS_CHECK_TRUE(InitEventFormats(bufferLine), false, "init event format failed");
    } else {
        TS_LOGW("Raw Trace Type(%d) Unknown or has been parsed.", curType);
    }
    return true;
}
bool RawTraceParser::ParseDataRecursively(std::deque<uint8_t>::iterator &packagesCurIter)
{
    uint32_t type = 0;
    uint32_t len = 0;
    if (!hasGotHeader_) {
        TS_CHECK_TRUE(InitRawTraceFileHeader(packagesCurIter), false, "get rawtrace file header failed");
    }
    while (true) {
        std::copy(packagesCurIter, packagesCurIter + sizeof(type), reinterpret_cast<uint8_t *>(&type));
        packagesCurIter += sizeof(type);
        std::copy(packagesCurIter, packagesCurIter + sizeof(len), reinterpret_cast<uint8_t *>(&len));
        packagesCurIter += sizeof(len);
        uint32_t restDataLen = std::distance(packagesCurIter, packagesBuffer_.end());
        TS_CHECK_TRUE_RET(len <= restDataLen && packagesBuffer_.size() > 0, false);
        std::string bufferLine(packagesCurIter, packagesCurIter + len);
        packagesCurIter += len;
        packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
        uint8_t curType = static_cast<uint8_t>(type);
        if (ParseLastCommData(curType, bufferLine)) {
            continue;
        }
        // for jump first comm data
        if (traceDataCache_->isSplitFile_ &&
            (curType < static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CPU_RAW) ||
             curType >= static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_HEADER_PAGE))) {
            uint32_t curSegSize = sizeof(type) + sizeof(len) + bufferLine.size();
            rawTraceSplitCommData_.emplace_back(SpliteDataInfo(curFileOffset_, curSegSize));
            curFileOffset_ += curSegSize;
            if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_EVENTS_FORMAT)) {
                restCommDataCnt_ = INVALID_UINT8;
            }
            continue;
        }
        if (!ProcessRawTraceContent(bufferLine, curType)) {
            return false;
        }
    }
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
