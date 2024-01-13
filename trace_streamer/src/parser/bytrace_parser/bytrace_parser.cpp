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

#include "bytrace_parser.h"
#include <cmath>
#include <sstream>
#include <unistd.h>
#include "app_start_filter.h"
#include "binder_filter.h"
#include "cpu_filter.h"
#include "hi_sysevent_measure_filter.h"
#include "parting_string.h"
#include "stat_filter.h"
#include "system_event_measure_filter.h"
namespace SysTuning {
namespace TraceStreamer {
BytraceParser::BytraceParser(TraceDataCache* dataCache, const TraceStreamerFilters* filters, TraceFileType fileType)
    : ParserBase(filters),
      fileType_(fileType),
      traceDataCache_(dataCache),
      eventParser_(std::make_unique<BytraceEventParser>(dataCache, filters)),
      hilogParser_(std::make_unique<BytraceHilogParser>(dataCache, filters)),
      hiSysEventParser_(std::make_unique<BytraceHiSysEventParser>(dataCache, filters))
{
    if (traceDataCache_->supportThread_) {
        dataSegArray_ = std::make_unique<DataSegment[]>(maxSegArraySize);
    } else {
        dataSegArray_ = std::make_unique<DataSegment[]>(1);
    }
}

BytraceParser::~BytraceParser() = default;

void BytraceParser::WaitForParserEnd()
{
    if (parseThreadStarted_ || filterThreadStarted_) {
        toExit_ = true;
        while (!exited_) {
            usleep(sleepDur_ * sleepDur_);
        }
    }
    eventParser_->FilterAllEvents();
    eventParser_->Clear();
    hilogParser_->FilterAllHilogData();
    hiSysEventParser_->Finish();
    traceDataCache_->MixTraceTime(traceDataCache_->traceStartTime_, traceDataCache_->traceEndTime_);
    dataSegArray_.reset();
    ClearByTraceData();
}
bool BytraceParser::UpdateSplitPos()
{
    maxSplitPos_ = mTraceDataBytrace_.size() - 1;
    TS_CHECK_TRUE_RET(minSplitPos_ == INVALID_INT32, true);
    minSplitPos_ = mTraceDataBytrace_.size() - 1;
    TS_LOGI("minSplitPos_=%d", minSplitPos_);
    return true;
}

template <typename Iterator>
int32_t BytraceParser::WhileDetermine(Iterator& packagesLine,
                                      Iterator& packagesBegin,
                                      bool& isParsingOver_,
                                      bool isFinish)
{
    // While loop break and continue
    if (packagesLine == packagesBuffer_.end()) {
        if (isFinish) {
            isParsingOver_ = true;
        } else {
            return 1;
        }
    }
    if (packagesLine == packagesBuffer_.begin()) {
        packagesLine++;
        curFileOffset_ += std::distance(packagesBegin, packagesLine);
        packagesBegin = packagesLine;
        return DETERMINE_CONTINUE;
    }
    return DETERMINE_RETURN;
}

int32_t BytraceParser::GotoDetermine(std::string& bufferLine, bool& haveSplitSeg)
{
    if (traceDataCache_->isSplitFile_) {
        mTraceDataBytrace_.emplace_back(curFileOffset_, curDataSize_);
    }
    if (isFirstLine_) {
        isFirstLine_ = false;
        if (IsHtmlTrace(bufferLine)) {
            isHtmlTrace_ = true;
            return 1;
        }
    }
    if (isHtmlTrace_) {
        if (!isHtmlTraceContent_) {
            if (IsHtmlTraceBegin(bufferLine)) {
                isHtmlTraceContent_ = true;
            }
            return 1;
        }
        auto pos = bufferLine.find(script_.c_str());
        if (pos != std::string::npos) {
            isHtmlTraceContent_ = false;
            bufferLine = bufferLine.substr(0, pos);
            if (std::all_of(bufferLine.begin(), bufferLine.end(), isspace)) {
                return 1;
            }
        }
    }
    if (IsTraceComment(bufferLine)) {
        traceCommentLines_++;
        mTraceDataBytrace_.clear();
        return 1;
    }
    if (bufferLine.empty()) {
        parsedTraceInvalidLines_++;
        return 1;
    }
    if (fileType_ == TRACE_FILETYPE_HILOG) {
        hilogParser_->ParseHilogDataItem(bufferLine, seq_, haveSplitSeg);
    } else if (fileType_ == TRACE_FILETYPE_HI_SYSEVENT) {
        hiSysEventParser_->ParseHiSysEventDataItem(bufferLine, seq_, haveSplitSeg);
    } else if (isBytrace_) {
        if (!traceBegan_) {
            traceBegan_ = true;
        }
        ParseTraceDataItem(bufferLine);
    }
    return DETERMINE_RETURN;
}

void BytraceParser::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish)
{
    if (isParsingOver_) {
        return;
    }
    packagesBuffer_.insert(packagesBuffer_.end(), &bufferStr[0], &bufferStr[size]);
    auto packagesBegin = packagesBuffer_.begin();
    while (true) {
        auto packagesLine = std::find(packagesBegin, packagesBuffer_.end(), '\n');
        int32_t determine = WhileDetermine(packagesLine, packagesBegin, isParsingOver_, isFinish);
        if (1 == determine) {
            break;
        } else if (DETERMINE_CONTINUE == determine) {
            continue;
        }
        // Support parsing windows file format(ff=dos)
        auto extra = 0;
        if (packagesLine != packagesBuffer_.end() && *(packagesLine - 1) == '\r') {
            extra = 1;
        }
        bool haveSplitSeg = false;
        std::string bufferLine(packagesBegin, packagesLine - extra);
        curDataSize_ = std::distance(packagesBegin, packagesLine) + 1;
        int32_t op = GotoDetermine(bufferLine, haveSplitSeg);
        if (1 == op) {
            goto NEXT_LINE;
        }
        if (haveSplitSeg) {
            UpdateSplitPos();
        }
    NEXT_LINE:
        if (isParsingOver_) {
            break;
        }
        curFileOffset_ += curDataSize_;
        packagesBegin = packagesLine + 1;
        seq_++;
        continue;
    }
    if (isParsingOver_) {
        packagesBuffer_.clear();
    } else {
        packagesBuffer_.erase(packagesBuffer_.begin(), packagesBegin);
    }
    return;
}

void BytraceParser::ParseTraceDataItem(const std::string& buffer)
{
    if (!traceDataCache_->supportThread_ || traceDataCache_->isSplitFile_) {
        dataSegArray_[rawDataHead_].seg = std::move(buffer);
        ParserData(dataSegArray_[rawDataHead_]);
        return;
    }
    int32_t head = rawDataHead_;
    while (!toExit_) {
        if (dataSegArray_[head].status.load() != TS_PARSE_STATUS_INIT) {
            TS_LOGD("rawDataHead_:\t%d, parseHead_:\t%d, filterHead_:\t%d status:\t%d\n", rawDataHead_, parseHead_,
                    filterHead_, dataSegArray_[head].status.load());
            usleep(sleepDur_);
            continue;
        }
        dataSegArray_[head].seg = std::move(buffer);
        dataSegArray_[head].status = TS_PARSE_STATUS_SEPRATED;
        rawDataHead_ = (rawDataHead_ + 1) % maxSegArraySize;
        break;
    }
    if (!parseThreadStarted_) {
        parseThreadStarted_ = true;
        int32_t tmp = traceDataCache_->parserThreadNum_;
        while (tmp--) {
            parserThreadCount_++;
            std::thread MatchLineThread(&BytraceParser::ParseThread, this);
            MatchLineThread.detach();
            TS_LOGI("parser Thread:%d/%d start working ...\n", traceDataCache_->parserThreadNum_ - tmp,
                    traceDataCache_->parserThreadNum_);
        }
    }
    if (!filterThreadStarted_) {
        filterThreadStarted_ = true;
        std::thread ParserThread(&BytraceParser::FilterThread, this);
        ParserThread.detach();
    }
    return;
}
int32_t BytraceParser::GetNextSegment()
{
    int32_t head;
    std::lock_guard<std::mutex> muxLockGuard(dataSegMux_);
    head = parseHead_;
    DataSegment& seg = dataSegArray_[head];
    if (seg.status.load() != TS_PARSE_STATUS_SEPRATED) {
        if (toExit_) {
            parserThreadCount_--;
            TS_LOGI("exiting parser, parserThread Count:%d\n", parserThreadCount_);
            if (!parserThreadCount_ && !filterThreadStarted_) {
                exited_ = true;
            }
            return ERROR_CODE_EXIT;
        }
        TS_LOGD("ParseThread watting:\t%d, parseHead_:\t%d, filterHead_:\t%d status:\t%d\n", rawDataHead_, parseHead_,
                filterHead_, seg.status.load());
        usleep(sleepDur_);
        return ERROR_CODE_NODATA;
    }
    parseHead_ = (parseHead_ + 1) % maxSegArraySize;
    seg.status = TS_PARSE_STATUS_PARSING;
    return head;
}

void BytraceParser::GetDataSegAttr(DataSegment& seg, const std::smatch& matcheLine) const
{
    const uint64_t S_TO_NS = 1e9;
    size_t index = 0;
    std::string pidStr = matcheLine[++index].str();
    std::optional<uint32_t> optionalPid = base::StrToInt<uint32_t>(pidStr);
    if (!optionalPid.has_value()) {
        TS_LOGD("Illegal pid: %s", pidStr.c_str());
        seg.status = TS_PARSE_STATUS_INVALID;
        return;
    }

    std::string tGidStr = matcheLine[++index].str();
    std::string cpuStr = matcheLine[++index].str();
    std::optional<uint32_t> optionalCpu = base::StrToInt<uint32_t>(cpuStr);
    if (!optionalCpu.has_value()) {
        TS_LOGD("Illegal cpu %s", cpuStr.c_str());
        seg.status = TS_PARSE_STATUS_INVALID;
        return;
    }
    std::string timeStr = matcheLine[++index].str();
    // Directly parsing double may result in accuracy loss issues
    std::optional<double> optionalTime = base::StrToDouble(timeStr);
    if (!optionalTime.has_value()) {
        TS_LOGD("Illegal ts %s", timeStr.c_str());
        seg.status = TS_PARSE_STATUS_INVALID;
        return;
    }
    std::string eventName = matcheLine[++index].str();
    seg.bufLine.task = StrTrim(matcheLine.prefix());
    if (seg.bufLine.task == "<...>") {
        seg.bufLine.task = "";
    }
    seg.bufLine.argsStr = StrTrim(matcheLine.suffix());
    seg.bufLine.pid = optionalPid.value();
    seg.bufLine.cpu = optionalCpu.value();
    seg.bufLine.ts = optionalTime.value() * S_TO_NS;
    seg.bufLine.tGidStr = tGidStr;
    seg.bufLine.eventName = eventName;
    seg.status = TS_PARSE_STATUS_PARSED;
}
void BytraceParser::ParseThread()
{
    while (true) {
        int32_t head = GetNextSegment();
        if (head < 0) {
            if (head == ERROR_CODE_NODATA) {
                continue;
            }
            if (!filterThreadStarted_) {
                exited_ = true;
            }
            return;
        }
        DataSegment& seg = dataSegArray_[head];
        ParserData(seg);
    }
}

void BytraceParser::ParserData(DataSegment& seg)
{
    std::smatch matcheLine;
    if (!std::regex_search(seg.seg, matcheLine, bytraceMatcher_)) {
        TS_LOGD("Not support this event (line: %s)", seg.seg.c_str());
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_DATA_INVALID);
        seg.status = TS_PARSE_STATUS_INVALID;
        parsedTraceInvalidLines_++;
        return;
    } else {
        parsedTraceValidLines_++;
    }
    GetDataSegAttr(seg, matcheLine);
    if (traceDataCache_->isSplitFile_) {
        if (seg.bufLine.ts >= traceDataCache_->SplitFileMinTime() &&
            seg.bufLine.ts <= traceDataCache_->SplitFileMaxTime()) {
            UpdateSplitPos();
        }
        return;
    }

    if (!traceDataCache_->supportThread_) {
        FilterData(seg);
        return;
    }
}
void BytraceParser::FilterThread()
{
    while (true) {
        DataSegment& seg = dataSegArray_[filterHead_];
        if (!FilterData(seg)) {
            return;
        }
    }
}
bool BytraceParser::FilterData(DataSegment& seg)
{
    if (!traceDataCache_->supportThread_ || traceDataCache_->isSplitFile_) {
        if (seg.status.load() != TS_PARSE_STATUS_INVALID) {
            eventParser_->ParseDataItem(seg.bufLine);
            seg.status = TS_PARSE_STATUS_INIT;
            return true;
        }
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_DATA_INVALID);
        return false;
    }
    if (seg.status.load() == TS_PARSE_STATUS_INVALID) {
        filterHead_ = (filterHead_ + 1) % maxSegArraySize;
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_DATA_INVALID);
        seg.status = TS_PARSE_STATUS_INIT;
        return true;
    }
    if (seg.status.load() != TS_PARSE_STATUS_PARSED) {
        if (toExit_ && !parserThreadCount_) {
            TS_LOGI("exiting FilterThread Thread\n");
            exited_ = true;
            filterThreadStarted_ = false;
            return false;
        }
        usleep(sleepDur_);
        return true;
    }
    eventParser_->ParseDataItem(seg.bufLine);
    filterHead_ = (filterHead_ + 1) % maxSegArraySize;
    seg.status = TS_PARSE_STATUS_INIT;
    return true;
}
// Remove space at the beginning and end of the string
std::string BytraceParser::StrTrim(const std::string& input) const
{
    std::string str = input;
    if (str.empty()) {
        return str;
    }
    str.erase(0, str.find_first_not_of(" "));
    str.erase(str.find_last_not_of(" ") + 1);
    return str;
}
} // namespace TraceStreamer
} // namespace SysTuning
