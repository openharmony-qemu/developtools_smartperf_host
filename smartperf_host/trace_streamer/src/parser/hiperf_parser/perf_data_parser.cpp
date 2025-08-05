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
#include "perf_data_parser.h"
#include "clock_filter_ex.h"
#include "file.h"
#ifdef ENABLE_ADDR2LINE
#include "llvm/DebugInfo/Symbolize/Symbolize.h"
#endif
#include "perf_data_filter.h"
#include "perf_file_format.h"
#include "stat_filter.h"
#include "utilities.h"
#include <string>

namespace SysTuning {
namespace TraceStreamer {
PerfDataParser::PerfDataParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx),
      configNameIndex_(traceDataCache_->dataDict_.GetStringIndex("config_name")),
      workloaderIndex_(traceDataCache_->dataDict_.GetStringIndex("workload_cmd")),
      cmdlineIndex_(traceDataCache_->dataDict_.GetStringIndex("cmdline")),
      runingStateIndex_(traceDataCache_->dataDict_.GetStringIndex("Running")),
      suspendStatIndex_(traceDataCache_->dataDict_.GetStringIndex("Suspend")),
      unknownStateIndex_(traceDataCache_->dataDict_.GetStringIndex("-")),
      pidAndStackHashToCallChainId_(INVALID_UINT32)
{
    SymbolsFile::onRecording_ = false;
}
uint64_t PerfDataParser::InitPerfDataAndLoad(const std::deque<uint8_t> &dequeBuffer,
                                             uint64_t size,
                                             uint64_t offset,
                                             bool isSplitFile,
                                             bool isFinish)
{
    if (isSplitFile) {
        return SplitPerfData(dequeBuffer, size, offset, isFinish);
    }

    bufferSize_ = size;
    buffer_ = std::make_unique<uint8_t[]>(size);
    std::copy(dequeBuffer.begin(), dequeBuffer.begin() + size, buffer_.get());
    LoadPerfData();
    buffer_.reset();
    return size;
}

uint64_t PerfDataParser::DataProcessingLength(const std::deque<uint8_t> &dequeBuffer,
                                              uint64_t size,
                                              uint64_t offset,
                                              bool isFinish)
{
    using PerfSplitFunc = bool (PerfDataParser::*)(const std::deque<uint8_t> &, uint64_t, uint64_t &, bool &);
    std::vector<PerfSplitFunc> splitFunc = {&PerfDataParser::SplitPerfStarting,
                                            &PerfDataParser::SplitPerfParsingHead,
                                            &PerfDataParser::SplitPerfWaitForAttr,
                                            &PerfDataParser::SplitPerfParsingAttr,
                                            &PerfDataParser::SplitPerfWaitForData,
                                            &PerfDataParser::SplitPerfParsingData,
                                            &PerfDataParser::SplitPerfParsingFeatureSection,
                                            &PerfDataParser::SplitPerfWaitForFinish};

    if (static_cast<size_t>(splitState_) >= splitFunc.size()) {
        TS_LOGE("Invalid split state %d", static_cast<int>(splitState_));
        perfSplitError_ = true;
        SplitDataWithdraw();
        return size;
    }
    uint64_t processedLen = 0;
    bool ret = true;
    bool invalid = false;
    while (ret) {
        if (isFinish && splitState_ == SplitPerfState::WAIT_FOR_FINISH) {
            uint64_t currentDataOffset = perfDataOffset_ + processedLength_ + processedLen;
            HtraceSplitResult offsetData = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_JSON,
                                            .originSeg = {.offset = currentDataOffset, .size = size - processedLen}};
            splitResult_.emplace_back(offsetData);
            processedLength_ += size;
            return size;
        }

        ret = (this->*splitFunc[static_cast<int32_t>(splitState_)])(dequeBuffer, size, processedLen, invalid);
        if (invalid) {
            perfSplitError_ = true;
            SplitDataWithdraw();
            return size;
        }
    }

    if (isFinish) {
        TS_LOGE("split not finish but data end");
        perfSplitError_ = true;
        SplitDataWithdraw();
        return size;
    }

    processedLength_ += processedLen;
    return processedLen;
}

uint64_t PerfDataParser::SplitPerfData(const std::deque<uint8_t> &dequeBuffer,
                                       uint64_t size,
                                       uint64_t offset,
                                       bool isFinish)
{
    if (processedLength_ == 0) {
        perfDataOffset_ = offset;
        perfSplitError_ = false;
    }

    if (perfSplitError_) {
        return size;
    }

    uint64_t datalength = DataProcessingLength(dequeBuffer, size, offset, isFinish);
    return datalength;
}

bool PerfDataParser::SplitPerfStarting(const std::deque<uint8_t> &dequeBuffer,
                                       uint64_t size,
                                       uint64_t &processedLen,
                                       bool &invalid)
{
    if (hasProfilerHead_) {
        HtraceSplitResult htraceHead = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_DATA,
                                        .buffer = {.address = reinterpret_cast<uint8_t *>(&profilerHeader_),
                                                   .size = sizeof(ProfilerTraceFileHeader)}};
        splitResult_.emplace_back(htraceHead);
    }

    splitState_ = SplitPerfState::PARSING_HEAD;
    return true;
}

bool PerfDataParser::SplitPerfParsingHead(const std::deque<uint8_t> &dequeBuffer,
                                          uint64_t size,
                                          uint64_t &processedLen,
                                          bool &invalid)
{
    processedLen = 0;
    if (size < sizeof(perf_file_header)) {
        return false;
    }

    std::copy_n(dequeBuffer.begin(), sizeof(perf_file_header), reinterpret_cast<char *>(&perfHeader_));

    if (memcmp(perfHeader_.magic, PERF_MAGIC, sizeof(perfHeader_.magic))) {
        TS_LOGE("invalid magic id");
        invalid = true;
        return false;
    }

    const int fetureMax = 256;
    const int sizeFetureCount = 8;
    featureCount_ = 0;
    for (auto i = 0; i < fetureMax / sizeFetureCount; i++) {
        std::bitset<sizeFetureCount> features(perfHeader_.features[i]);
        for (auto j = 0; j < sizeFetureCount; j++) {
            if (features.test(j)) {
                featureCount_++;
            }
        }
    }

    HtraceSplitResult perfHead = {
        .type = (int32_t)SplitDataDataType::SPLIT_FILE_DATA,
        .buffer = {.address = reinterpret_cast<uint8_t *>(&perfHeader_), .size = sizeof(perf_file_header)}};
    splitResult_.emplace_back(perfHead);
    processedLen += sizeof(perf_file_header);
    splitState_ = SplitPerfState::WAIT_FOR_ATTR;
    return true;
}

bool PerfDataParser::SplitPerfWaitForAttr(const std::deque<uint8_t> &dequeBuffer,
                                          uint64_t size,
                                          uint64_t &processedLen,
                                          bool &invalid)
{
    if (processedLength_ + processedLen > perfHeader_.attrs.offset) {
        TS_LOGE("offset of attr is wrong %" PRIu64 "", perfHeader_.attrs.offset);
        invalid = true;
        return false;
    }

    if (processedLength_ + size < perfHeader_.attrs.offset) {
        processedLen = size;
        return false;
    }

    processedLen += perfHeader_.attrs.offset - (processedLength_ + processedLen);
    splitState_ = SplitPerfState::PARSING_ATTR;
    return true;
}

bool PerfDataParser::SplitPerfParsingAttr(const std::deque<uint8_t> &dequeBuffer,
                                          uint64_t size,
                                          uint64_t &processedLen,
                                          bool &invalid)
{
    int attrCount = perfHeader_.attrs.size / perfHeader_.attrSize;
    if (attrCount == 0) {
        TS_LOGE("no attr in file");
        invalid = true;
        return false;
    }

    uint64_t lengthRemain = size - processedLen;
    if (lengthRemain < perfHeader_.attrs.size) {
        return false;
    }

    auto buffer = std::make_unique<uint8_t[]>(perfHeader_.attrs.size);
    std::copy_n(dequeBuffer.begin() + processedLen, perfHeader_.attrs.size, buffer.get());
    std::vector<perf_file_attr> vecAttr;
    for (int index = 0; index < attrCount; ++index) {
        perf_file_attr *attr = reinterpret_cast<perf_file_attr *>(buffer.get() + perfHeader_.attrSize * index);
        vecAttr.push_back(*attr);
        // for Update Clock Type
        if (index == 0) {
            useClockId_ = attr->attr.use_clockid;
            clockId_ = attr->attr.clockid;
            TS_LOGI("useClockId_ = %u, clockId_ = %u", useClockId_, clockId_);
        }
    }

    sampleType_ = vecAttr[0].attr.sample_type;
    if (!(sampleType_ & PERF_SAMPLE_TIME)) {
        TS_LOGE("no time in sample data, not support split, sampleType_ = %" PRIx64 "", sampleType_);
        invalid = true;
        return false;
    }
    sampleTimeOffset_ = (((sampleType_ & PERF_SAMPLE_IDENTIFIER) != 0) + ((sampleType_ & PERF_SAMPLE_IP) != 0) +
                         ((sampleType_ & PERF_SAMPLE_TID) != 0)) *
                        sizeof(uint64_t);

    processedLen += perfHeader_.attrs.size;
    splitState_ = SplitPerfState::WAIT_FOR_DATA;
    return true;
}

bool PerfDataParser::SplitPerfWaitForData(const std::deque<uint8_t> &dequeBuffer,
                                          uint64_t size,
                                          uint64_t &processedLen,
                                          bool &invalid)
{
    if (processedLength_ + processedLen > perfHeader_.data.offset) {
        TS_LOGE("offset of data is wrong %" PRIu64 "", perfHeader_.data.offset);
        invalid = true;
        return false;
    }

    if (processedLength_ + size < perfHeader_.data.offset) {
        processedLen = size;
        return false;
    }

    HtraceSplitResult offsetData = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_JSON,
                                    .originSeg = {.offset = perfDataOffset_ + sizeof(perf_file_header),
                                                  .size = perfHeader_.data.offset - sizeof(perf_file_header)}};
    splitResult_.emplace_back(offsetData);

    processedLen += perfHeader_.data.offset - (processedLength_ + processedLen);
    splitState_ = SplitPerfState::PARSING_DATA;
    return true;
}

SplitPerfState PerfDataParser::DataLengthProcessing(const std::deque<uint8_t> &dequeBuffer,
                                                    perf_event_header &dataHeader,
                                                    uint64_t size,
                                                    uint64_t &processedLen,
                                                    bool &invalid)
{
    uint64_t totalDataRemain = perfHeader_.data.offset + perfHeader_.data.size - processedLength_ - processedLen;
    if (totalDataRemain < sizeof(perf_event_header)) {
        processedLen += totalDataRemain;
        splitDataSize_ += totalDataRemain;
        splitState_ = SplitPerfState::PARSING_FEATURE_SECTION;
        return SplitPerfState::PARSING_HEAD;
    }

    uint64_t lengthRemain = size - processedLen;
    if (lengthRemain < sizeof(perf_event_header)) {
        return SplitPerfState::STARTING;
    }
    std::copy_n(dequeBuffer.begin() + processedLen, sizeof(perf_event_header), reinterpret_cast<char *>(&dataHeader));
    if (dataHeader.size < sizeof(perf_event_header)) {
        TS_LOGE("invalid data size %u", dataHeader.size);
        invalid = true;
        return SplitPerfState::STARTING;
    }
    if (lengthRemain < dataHeader.size) {
        return SplitPerfState::STARTING;
    }
    if (totalDataRemain < sizeof(perf_event_header)) {
        processedLen += totalDataRemain;
        splitDataSize_ += totalDataRemain;
        splitState_ = SplitPerfState::PARSING_FEATURE_SECTION;
        return SplitPerfState::PARSING_HEAD;
    }
    return SplitPerfState::WAIT_FOR_ATTR;
}

bool PerfDataParser::SplitPerfParsingData(const std::deque<uint8_t> &dequeBuffer,
                                          uint64_t size,
                                          uint64_t &processedLen,
                                          bool &invalid)
{
    perf_event_header dataHeader;
    auto ret = DataLengthProcessing(dequeBuffer, dataHeader, size, processedLen, invalid);
    if (SplitPerfState::STARTING == ret) {
        return false;
    } else if (SplitPerfState::PARSING_HEAD == ret) {
        return true;
    }
    bool needRecord = true;
    if (splitDataEnd_) {
        needRecord = false;
    } else if (dataHeader.type == PERF_RECORD_SAMPLE) {
        auto buffer = std::make_unique<uint8_t[]>(dataHeader.size);
        std::copy_n(dequeBuffer.begin() + processedLen + sizeof(perf_event_header),
                    dataHeader.size - sizeof(perf_event_header), buffer.get());
        uint64_t time = *(reinterpret_cast<uint64_t *>(buffer.get() + sampleTimeOffset_));
        uint64_t newTimeStamp = 0;
        if (useClockId_ != 0) {
            newTimeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(perfToTSClockType_.at(clockId_), time);
        }
        UpdatePluginTimeRange(perfToTSClockType_.at(clockId_), time, newTimeStamp);
        if (newTimeStamp < traceDataCache_->SplitFileMinTime()) {
            needRecord = false;
        } else if (newTimeStamp > traceDataCache_->SplitFileMaxTime()) {
            splitDataEnd_ = true;
            needRecord = false;
        }
    }

    if (needRecord) {
        uint64_t currentDataOffset = perfDataOffset_ + processedLength_ + processedLen;
        if (splitResult_.rbegin() != splitResult_.rend() &&
            (splitResult_.rbegin()->originSeg.offset + splitResult_.rbegin()->originSeg.size == currentDataOffset)) {
            splitResult_.rbegin()->originSeg.size += dataHeader.size;
        } else {
            HtraceSplitResult offsetData = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_JSON,
                                            .originSeg = {.offset = currentDataOffset, .size = dataHeader.size}};
            splitResult_.emplace_back(offsetData);
        }
        splitDataSize_ += dataHeader.size;
    }
    processedLen += dataHeader.size;
    return true;
}

bool PerfDataParser::SplitPerfParsingFeatureSection(const std::deque<uint8_t> &dequeBuffer,
                                                    uint64_t size,
                                                    uint64_t &processedLen,
                                                    bool &invalid)
{
    featureSectioSize_ = featureCount_ * sizeof(perf_file_section);
    if (featureSectioSize_ == 0) {
        TS_LOGI("no feature section in file");
        splitState_ = SplitPerfState::WAIT_FOR_FINISH;
        return false;
    }

    uint64_t lengthRemain = size - processedLen;
    if (lengthRemain < featureSectioSize_) {
        return false;
    }

    featureSection_ = std::make_unique<uint8_t[]>(featureSectioSize_);
    std::copy_n(dequeBuffer.begin() + processedLen, featureSectioSize_, featureSection_.get());
    uint64_t splitDropSize = perfHeader_.data.size - splitDataSize_;
    for (auto i = 0; i < featureCount_; ++i) {
        perf_file_section *featureSections = reinterpret_cast<perf_file_section *>(featureSection_.get());
        featureSections[i].offset -= splitDropSize;
    }
    HtraceSplitResult featureBuff = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_DATA,
                                     .buffer = {.address = featureSection_.get(), .size = featureSectioSize_}};
    splitResult_.emplace_back(featureBuff);

    processedLen += featureSectioSize_;
    perfHeader_.data.size = splitDataSize_;
    profilerHeader_.data.length -= splitDropSize;
    splitState_ = SplitPerfState::WAIT_FOR_FINISH;
    return true;
}

bool PerfDataParser::SplitPerfWaitForFinish(const std::deque<uint8_t> &dequeBuffer,
                                            uint64_t size,
                                            uint64_t &processedLen,
                                            bool &invalid)
{
    return false;
}

PerfDataParser::~PerfDataParser()
{
    recordDataReader_.reset();
    if (remove(tmpPerfData_.c_str()) == -1) {
        TS_LOGE("remove %s err:%s\n", tmpPerfData_.c_str(), strerror(errno));
    }
    TS_LOGI("perf data ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}

std::tuple<uint64_t, DataIndex> PerfDataParser::GetFileIdWithLikelyFilePath(const std::string &inputFilePath)
{
    auto perfFilesData = traceDataCache_->GetConstPerfFilesData();
    for (auto row = 0; row < perfFilesData.Size(); row++) {
        auto filePath = traceDataCache_->GetDataFromDict(perfFilesData.FilePaths()[row]);
        if (EndsWith(filePath, inputFilePath)) {
            return std::make_tuple(perfFilesData.FileIds()[row], perfFilesData.FilePaths()[row]);
        }
    }
    return std::make_tuple(INVALID_UINT64, INVALID_DATAINDEX);
}

bool PerfDataParser::ReloadPerfFile(const std::unique_ptr<SymbolsFile> &symbolsFile,
                                    uint64_t &fileId,
                                    DataIndex &filePathIndex)
{
    std::tie(fileId, filePathIndex) = GetFileIdWithLikelyFilePath(symbolsFile->filePath_);
    if (fileId == INVALID_UINT64) {
        return false;
    }
    // clean perf file same fileId data
    if (!traceDataCache_->GetPerfFilesData()->EraseFileIdSameData(fileId)) {
        return false;
    }
    // add new symbol Data to PerfFile table
    for (auto dfxSymbol : symbolsFile->GetSymbols()) {
        auto symbolNameIndex = traceDataCache_->GetDataIndex(dfxSymbol.GetName());
        traceDataCache_->GetPerfFilesData()->AppendNewPerfFiles(fileId, dfxSymbol.index_, symbolNameIndex,
                                                                filePathIndex);
    }
    return true;
}

void PerfDataParser::ReloadPerfCallChain(const std::unique_ptr<SymbolsFile> &symbolsFile,
                                         uint64_t fileId,
                                         DataIndex filePathIndex)
{
    // Associate perf_callchain with perf_file
    auto perfCallChainData = traceDataCache_->GetPerfCallChainData();

    for (auto row = 0; row < perfCallChainData->Size(); row++) {
        if (perfCallChainData->FileIds()[row] == fileId) {
            // Get the current call stack's pid and tid
            if (!callChainIdToThreadInfo_.count(perfCallChainData->CallChainIds()[row])) {
                continue;
            }
            pid_t pid;
            pid_t tid;
            std::tie(pid, tid) = callChainIdToThreadInfo_.at(perfCallChainData->CallChainIds()[row]);
            // Get VirtualThread object
            auto &virtualThread = report_->virtualRuntime_.GetThread(pid, tid);
            // Get dfxMap object
            auto dfxMap = virtualThread.FindMapByAddr(perfCallChainData->Ips()[row]);
            auto vaddr = symbolsFile->GetVaddrInSymbols(perfCallChainData->Ips()[row], dfxMap->begin, dfxMap->offset);
            auto dfxSymbol = symbolsFile->GetSymbolWithVaddr(vaddr);
            auto nameIndex = traceDataCache_->GetDataIndex(dfxSymbol.GetName());
            perfCallChainData->UpdateSymbolRelatedData(row, dfxSymbol.funcVaddr_, dfxSymbol.offsetToVaddr_,
                                                       dfxSymbol.index_, nameIndex);
        }
    }
}

void PerfDataParser::PerfReloadSymbolFile(const std::unique_ptr<SymbolsFile> &symbolsFile)
{
    if (symbolsFile == nullptr) {
        return;
    }
    uint64_t fileId;
    DataIndex filePathIndex;
    if (!ReloadPerfFile(symbolsFile, fileId, filePathIndex)) {
        return;
    }
    ReloadPerfCallChain(symbolsFile, fileId, filePathIndex);
}
#ifdef ENABLE_ADDR2LINE
void PerfDataParser::ParseSourceLocation(const std::string &directory, const std::string &fileName)
{
    uint64_t fileId;
    DataIndex filePathIndex;
    std::tie(fileId, filePathIndex) = GetFileIdWithLikelyFilePath(fileName);
    if (fileId == INVALID_UINT64 || filePathIndex == INVALID_UINT64) {
        return;
    }
    llvm::symbolize::LLVMSymbolizer::Options Opts;
    llvm::symbolize::LLVMSymbolizer symbolizer(Opts);

    // Associate perf_callchain with perf_file
    auto perfCallChainData = traceDataCache_->GetPerfCallChainData();
    auto path = directory + "/" + fileName;
    for (auto row = 0; row < perfCallChainData->Size(); row++) {
        if (perfCallChainData->FileIds()[row] != fileId) {
            continue;
        }
        uint64_t vaddrInFile = perfCallChainData->VaddrInFiles()[row];
        uint64_t offsetToVaddr = perfCallChainData->OffsetToVaddrs()[row];
        if (vaddrInFile == 0 || offsetToVaddr == 0) {
            continue;
        }
        llvm::object::SectionedAddress address = {vaddrInFile + offsetToVaddr,
                                                  llvm::object::SectionedAddress::UndefSection};
        auto inlinedContext = symbolizer.symbolizeInlinedCode(path, address);
        if (inlinedContext && inlinedContext->getNumberOfFrames()) {
            auto firstFrame = inlinedContext->getFrame(0);
            auto sourceFileIndex = traceDataCache_->GetDataIndex(firstFrame.FileName);
            perfCallChainData->SetSourceFileNameAndLineNumber(row, sourceFileIndex,
                                                              static_cast<uint64_t>(firstFrame.Line));
        } else {
            TS_LOGD("symbolizeInlinedCode execute failed!");
        }
    }
}
#endif
bool PerfDataParser::LoadPerfData()
{
    // try load the perf data
    int32_t fd(base::OpenFile(tmpPerfData_, O_CREAT | O_RDWR, TS_PERMISSION_RW));
    if (!fd) {
        fprintf(stdout, "Failed to create file: %s", tmpPerfData_.c_str());
        return false;
    }
    (void)ftruncate(fd, 0);
    if (bufferSize_ != (size_t)write(fd, buffer_.get(), bufferSize_)) {
        close(fd);
        return false;
    }
    close(fd);
    recordDataReader_ = PerfFileReader::Instance(tmpPerfData_);
    if (recordDataReader_ == nullptr) {
        return false;
    }
    report_ = std::make_unique<Report>();
    return Reload();
}
bool PerfDataParser::Reload()
{
    pidAndStackHashToCallChainId_.Clear();
    fileDataDictIdToFileId_.clear();
    tidToPid_.clear();
    streamFilters_->perfDataFilter_->BeforeReload();
    traceDataCache_->GetPerfSampleData()->Clear();
    traceDataCache_->GetPerfThreadData()->Clear();

    if (!recordDataReader_->ReadFeatureSection()) {
        printf("record format error.\n");
        return false;
    }
    // update perf report table
    UpdateEventConfigInfo();
    UpdateReportWorkloadInfo();
    UpdateCmdlineInfo();
    SetHM();

    // update perf Files table
    UpdateSymbolAndFilesData();

    TS_LOGD("process record");
    UpdateClockType();
    recordDataReader_->ReadDataSection(std::bind(&PerfDataParser::RecordCallBack, this, std::placeholders::_1));
    TS_LOGD("process record completed");
    TS_LOGI("load perf data done");
    return true;
}

void PerfDataParser::UpdateEventConfigInfo()
{
    auto features = recordDataReader_->GetFeatures();
    cpuOffMode_ = find(features.begin(), features.end(), FEATURE::HIPERF_CPU_OFF) != features.end();
    if (cpuOffMode_) {
        TS_LOGD("this is cpuOffMode ");
    }
    const PerfFileSection *featureSection = recordDataReader_->GetFeatureSection(FEATURE::EVENT_DESC);
    if (featureSection) {
        TS_LOGI("have EVENT_DESC");
        LoadEventDesc();
    } else {
        TS_LOGE("Do not have EVENT_DESC !!!");
    }
}

void PerfDataParser::LoadEventDesc()
{
    const auto featureSection = recordDataReader_->GetFeatureSection(FEATURE::EVENT_DESC);
    const auto &sectionEventdesc = *static_cast<const PerfFileSectionEventDesc *>(featureSection);
    TS_LOGI("Event descriptions: %zu", sectionEventdesc.eventDesces_.size());
    for (size_t i = 0; i < sectionEventdesc.eventDesces_.size(); i++) {
        const auto &fileAttr = sectionEventdesc.eventDesces_[i];
        TS_LOGI("event name[%zu]: %s ids: %s", i, fileAttr.name.c_str(), VectorToString(fileAttr.ids).c_str());
        for (uint64_t id : fileAttr.ids) {
            report_->configIdIndexMaps_[id] = report_->configs_.size(); // setup index
            TS_LOGI("add config id map %" PRIu64 " to %zu", id, report_->configs_.size());
        }
        // when cpuOffMode_ , don't use count mode , use time mode.
        auto &config = report_->configs_.emplace_back(fileAttr.name, fileAttr.attr.type, fileAttr.attr.config,
                                                      cpuOffMode_ ? false : true);
        config.ids_ = fileAttr.ids;
        TS_ASSERT(config.ids_.size() > 0);

        auto perfReportData = traceDataCache_->GetPerfReportData();
        auto configValueIndex = traceDataCache_->dataDict_.GetStringIndex(fileAttr.name.c_str());
        perfReportData->AppendNewPerfReport(configNameIndex_, configValueIndex);
    }
}

void PerfDataParser::UpdateReportWorkloadInfo() const
{
    // workload
    auto featureSection = recordDataReader_->GetFeatureSection(FEATURE::HIPERF_WORKLOAD_CMD);
    std::string workloader = "";
    if (featureSection) {
        TS_LOGI("found HIPERF_META_WORKLOAD_CMD");
        auto sectionString = static_cast<const PerfFileSectionString *>(featureSection);
        workloader = sectionString->ToString();
    } else {
        TS_LOGW("NOT found HIPERF_META_WORKLOAD_CMD");
    }
    if (workloader.empty()) {
        TS_LOGW("NOT found HIPERF_META_WORKLOAD_CMD");
        return;
    }
    auto perfReportData = traceDataCache_->GetPerfReportData();
    auto workloaderValueIndex = traceDataCache_->dataDict_.GetStringIndex(workloader.c_str());
    perfReportData->AppendNewPerfReport(workloaderIndex_, workloaderValueIndex);
}

void PerfDataParser::UpdateCmdlineInfo() const
{
    auto cmdline = recordDataReader_->GetFeatureString(FEATURE::CMDLINE);
    auto perfReportData = traceDataCache_->GetPerfReportData();
    auto cmdlineValueIndex = traceDataCache_->dataDict_.GetStringIndex(cmdline.c_str());
    perfReportData->AppendNewPerfReport(cmdlineIndex_, cmdlineValueIndex);
}

void PerfDataParser::UpdateSymbolAndFilesData()
{
    // we need unwind it (for function name match) even not give us path
    report_->virtualRuntime_.SetDisableUnwind(false);

    // found symbols in file
    const auto featureSection = recordDataReader_->GetFeatureSection(FEATURE::HIPERF_FILES_SYMBOL);
    if (featureSection != nullptr) {
        const PerfFileSectionSymbolsFiles *sectionSymbolsFiles =
            static_cast<const PerfFileSectionSymbolsFiles *>(featureSection);
        report_->virtualRuntime_.UpdateFromPerfData(sectionSymbolsFiles->symbolFileStructs_);
    }
    // fileid, symbolIndex, filePathIndex
    uint64_t fileId = 0;
    for (auto &symbolsFile : report_->virtualRuntime_.GetSymbolsFiles()) {
        auto filePathIndex = traceDataCache_->dataDict_.GetStringIndex(symbolsFile->filePath_.c_str());
        uint32_t serial = 0;
        for (auto &symbol : symbolsFile->GetSymbols()) {
            auto symbolIndex = traceDataCache_->dataDict_.GetStringIndex(symbol.GetName());
            streamFilters_->statFilter_->IncreaseStat(TRACE_PERF, STAT_EVENT_RECEIVED);
            streamFilters_->perfDataFilter_->AppendPerfFiles(fileId, serial++, symbolIndex, filePathIndex);
        }
        if (symbolsFile->GetSymbols().size() == 0) {
            streamFilters_->perfDataFilter_->AppendPerfFiles(fileId, INVALID_UINT32, INVALID_DATAINDEX, filePathIndex);
        }
        fileDataDictIdToFileId_.insert(std::make_pair(filePathIndex, fileId));
        ++fileId;
    }
}
void PerfDataParser::UpdateClockType()
{
    const auto &attrIds_ = recordDataReader_->GetAttrSection();
    if (attrIds_.size() > 0) {
        useClockId_ = attrIds_[0].attr.use_clockid;
        clockId_ = attrIds_[0].attr.clockid;
        TS_LOGI("useClockId_ = %u, clockId_ = %u", useClockId_, clockId_);
    }
}
bool PerfDataParser::RecordCallBack(PerfEventRecord &record)
{
    // tell process tree what happend for rebuild symbols
    report_->virtualRuntime_.UpdateFromRecord(record);

    if (record.GetType() == PERF_RECORD_SAMPLE) {
        auto *sample = static_cast<PerfRecordSample *>(&record);
        uint32_t callChainId = UpdateCallChainUnCompressed(sample);
        UpdatePerfSampleData(callChainId, sample);
    } else if (record.GetType() == PERF_RECORD_COMM) {
        auto recordComm = static_cast<PerfRecordComm *>(&record);
        auto range = tidToPid_.equal_range(recordComm->data_.tid);
        for (auto it = range.first; it != range.second; it++) {
            if (it->second == recordComm->data_.pid) {
                return true;
            }
        }
        tidToPid_.insert(std::make_pair(recordComm->data_.tid, recordComm->data_.pid));
        auto perfThreadData = traceDataCache_->GetPerfThreadData();
        auto threadNameIndex = traceDataCache_->dataDict_.GetStringIndex(recordComm->data_.comm);
        perfThreadData->AppendNewPerfThread(recordComm->data_.pid, recordComm->data_.tid, threadNameIndex);
    }
    return true;
}

uint32_t PerfDataParser::UpdateCallChainUnCompressed(const PerfRecordSample *sample)
{
    std::string stackStr = "";
    for (auto &callFrame : sample->callFrames_) {
        stackStr += "+" + base::number(callFrame.pc, base::INTEGER_RADIX_TYPE_HEX);
    }
    auto stackHash = hashFun_(stackStr);
    auto pid = sample->data_.pid;
    auto callChainId = pidAndStackHashToCallChainId_.Find(pid, stackHash);
    if (callChainId != INVALID_UINT32) {
        return callChainId;
    }
    callChainId = ++callChainId_;
    pidAndStackHashToCallChainId_.Insert(pid, stackHash, callChainId);
    callChainIdToThreadInfo_.insert({callChainId, std::make_tuple(pid, sample->data_.tid)});
    uint32_t depth = 0;
    for (auto frame = sample->callFrames_.rbegin(); frame != sample->callFrames_.rend(); ++frame) {
        uint64_t fileId = INVALID_UINT64;
        auto fileDataIndex = traceDataCache_->dataDict_.GetStringIndex(frame->mapName);
        if (fileDataDictIdToFileId_.count(fileDataIndex) != 0) {
            fileId = fileDataDictIdToFileId_.at(fileDataIndex);
        }
        PerfCallChainRow perfCallChainRow = {callChainId,      depth++, frame->pc,   frame->funcOffset,
                                             frame->mapOffset, fileId,  frame->index};
        if (frame->funcOffset == 0 || frame->index == -1) {
            auto iPos = frame->funcName.find_last_of('/');
            auto nameIndex = traceDataCache_->dataDict_.GetStringIndex(frame->funcName.substr(iPos + 1, -1));
            streamFilters_->perfDataFilter_->AppendInvalidVaddrIpToFuncName(frame->pc, nameIndex);
        }
        traceDataCache_->GetPerfCallChainData()->AppendNewPerfCallChain(perfCallChainRow);
    }
    return callChainId;
}

void PerfDataParser::UpdatePerfSampleData(uint32_t callChainId, const PerfRecordSample *sample)
{
    auto perfSampleData = traceDataCache_->GetPerfSampleData();
    uint64_t newTimeStamp = 0;
    if (useClockId_ == 0) {
        newTimeStamp = sample->data_.time;
    } else {
        newTimeStamp =
            streamFilters_->clockFilter_->ToPrimaryTraceTime(perfToTSClockType_.at(clockId_), sample->data_.time);
    }
    UpdatePluginTimeRange(perfToTSClockType_.at(clockId_), sample->data_.time, newTimeStamp);

    DataIndex threadStatIndex = unknownStateIndex_;
    auto threadState = report_->GetConfigName(sample->data_.id);
    if (threadState.compare(wakingEventName_) == 0) {
        threadStatIndex = runingStateIndex_;
    } else if (threadState.compare(cpuOffEventName_) == 0) {
        threadStatIndex = suspendStatIndex_;
    }
    auto configIndex = report_->GetConfigIndex(sample->data_.id);
    PerfSampleRow perfSampleRow = {callChainId, sample->data_.time, sample->data_.tid, sample->data_.period,
                                   configIndex, newTimeStamp,       sample->data_.cpu, threadStatIndex};
    perfSampleData->AppendNewPerfSample(perfSampleRow);
}

void PerfDataParser::Finish()
{
    if (!traceDataCache_->isSplitFile_) {
        streamFilters_->perfDataFilter_->Finish();
    }
    // Update trace_range when there is only perf data in the trace file
    if (traceDataCache_->traceStartTime_ == INVALID_UINT64 || traceDataCache_->traceEndTime_ == 0) {
        traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
    } else {
        TS_LOGI("perfData time is not updated, maybe this trace file has other data");
    }
    pidAndStackHashToCallChainId_.Clear();
}

void PerfDataParser::SetHM()
{
    std::string os = recordDataReader_->GetFeatureString(FEATURE::OSRELEASE);
    auto isHM = os.find(HMKERNEL) != std::string::npos;
    isHM = isHM || os.find("hmkernel") != std::string::npos;
    isHM = isHM || os.find("HongMeng") != std::string::npos;
    report_->virtualRuntime_.SetHM(isHM);
    if (isHM) {
        pid_t devhost = -1;
        std::string str = recordDataReader_->GetFeatureString(FEATURE::HIPERF_HM_DEVHOST);
        if (str != EMPTY_STRING) {
            devhost = std::stoi(str);
        }
        report_->virtualRuntime_.SetDevhostPid(devhost);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
