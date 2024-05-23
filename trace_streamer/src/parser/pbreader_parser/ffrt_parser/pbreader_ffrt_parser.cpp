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
#include "pbreader_ffrt_parser.h"
#include "ffrt_profiler_config.pbreader.h"
#include "clock_filter_ex.h"
namespace SysTuning {
namespace TraceStreamer {
PbreaderFfrtDetailParser::PbreaderFfrtDetailParser(TraceDataCache *dataCache,
                                                   const TraceStreamerFilters *ctx,
                                                   HtraceEventParser *eventParser)
    : EventParserBase(dataCache, ctx), eventParser_(eventParser), taskNameIndexMap_(INVALID_UINT64)
{
}
PbreaderFfrtDetailParser::~PbreaderFfrtDetailParser() {}
void PbreaderFfrtDetailParser::PaserCommData(bool &haveSplitSeg,
                                             std::unique_ptr<ProtoReader::FfrtProfilerEvent_Reader> &ffrtEventPtr)
{
    if (traceDataCache_->isSplitFile_) {
        haveSplitSeg = true;
        return;
    }
    auto processName = ffrtEventPtr->process_name().ToStdString();
    auto threadName = ffrtEventPtr->thread_name().ToStdString();
    auto taskName = processName.empty() ? threadName : processName;
    taskNameIndexMap_.Insert(ffrtEventPtr->tid(), ffrtEventPtr->pid(), traceDataCache_->GetDataIndex(taskName));
    streamFilters_->processFilter_->UpdateOrCreateThreadWithPidAndName(ffrtEventPtr->tid(), ffrtEventPtr->pid(),
                                                                       taskName);
}
void PbreaderFfrtDetailParser::ParserFfrtTrace(const PbreaderDataSegment &dataSeg,
                                               bool &haveSplitSeg,
                                               std::unique_ptr<ProtoReader::FfrtProfilerEvent_Reader> &ffrtEventPtr)
{
    auto eventInfoPtr = std::make_unique<HtraceEventParser::EventInfo>();
    auto timeStamp = ffrtEventPtr->tv_nsec() + ffrtEventPtr->tv_sec() * SEC_TO_NS;
    eventInfoPtr->timeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(ffrtClockid_, timeStamp);
    traceDataCache_->UpdateTraceTime(eventInfoPtr->timeStamp);
    if (traceDataCache_->isSplitFile_) {
        if (eventInfoPtr->timeStamp >= traceDataCache_->SplitFileMinTime() &&
            eventInfoPtr->timeStamp <= traceDataCache_->SplitFileMaxTime()) {
            haveSplitSeg = true;
        }
        return;
    }
    eventInfoPtr->pid = ffrtEventPtr->tid();
    eventInfoPtr->tgid = ffrtEventPtr->pid();
    eventInfoPtr->eventType = TRACE_EVENT_FFRT;
    auto taskNameIndex = taskNameIndexMap_.Find(eventInfoPtr->pid, eventInfoPtr->tgid);
    if (taskNameIndex == INVALID_UINT64) {
        taskNameIndex = traceDataCache_->GetDataIndex("");
    }
    eventInfoPtr->taskNameIndex = taskNameIndex;
    auto pos = (const char *)ffrtEventPtr->trace().Data() - dataSeg.seg->data();
    eventInfoPtr->detail = std::move(dataSeg.seg->substr(pos, ffrtEventPtr->trace().Size()));
    eventParser_->AppendEvent(std::move(eventInfoPtr));
}
void PbreaderFfrtDetailParser::Parser(const PbreaderDataSegment &dataSeg, bool &haveSplitSeg)
{
    ProtoReader::FfrtProfilerResult_Reader ffrtResultReader(dataSeg.protoData);
    for (auto ffrtResultItor = ffrtResultReader.ffrt_event(); ffrtResultItor; ++ffrtResultItor) {
        auto ffrtEventPtr = std::make_unique<ProtoReader::FfrtProfilerEvent_Reader>(ffrtResultItor->ToBytes());
        if (ffrtEventPtr->has_trace()) {
            ParserFfrtTrace(dataSeg, haveSplitSeg, ffrtEventPtr);
        } else if (!ffrtEventPtr->has_trace() && !ffrtEventPtr->has_raw()) {
            PaserCommData(haveSplitSeg, ffrtEventPtr);
        }
        if (haveSplitSeg) {
            return;
        }
    }
}
void PbreaderFfrtDetailParser::SetFfrtSrcClockid(PbreaderDataSegment &dataSeg)
{
    ProtoReader::FfrtProfilerConfig_Reader ffrtCfgReader(dataSeg.protoData);
    ffrtClockid_ = ffrtCfgReader.clock_id();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_FFRT, ffrtClockid_);
    TS_LOGI("ffrtClockid_=%u", ffrtClockid_);
}
void PbreaderFfrtDetailParser::FilterAllEventsReader()
{
    eventParser_->FilterAllEventsReader();
}
} // namespace TraceStreamer
} // namespace SysTuning
