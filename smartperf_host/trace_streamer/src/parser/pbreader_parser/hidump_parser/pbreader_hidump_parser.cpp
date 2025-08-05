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
#include "pbreader_hidump_parser.h"
#include "clock_filter_ex.h"
#include "hidump_plugin_result.pbreader.h"
#include "process_filter.h"
#include "stat_filter.h"
namespace SysTuning {
namespace TraceStreamer {
PbreaderHidumpParser::PbreaderHidumpParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx), clockId_(0)
{
}

PbreaderHidumpParser::~PbreaderHidumpParser()
{
    TS_LOGI("Fps data ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}
void PbreaderHidumpParser::Parse(ProtoReader::BytesView tracePacket)
{
    ProtoReader::HidumpInfo_Reader hidumpInfo(tracePacket.data_, tracePacket.size_);
    if (!hidumpInfo.has_fps_event()) {
        return;
    }
    for (auto i = hidumpInfo.fps_event(); i; ++i) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_HIDUMP_FPS, STAT_EVENT_RECEIVED);
        ProtoReader::FpsData_Reader hidumpData(i->ToBytes());
        auto hidumpTime = ProtoReader::FpsData_TimeSpec_Reader(hidumpData.time());
        auto timeStamp = hidumpTime.tv_nsec() + hidumpTime.tv_sec() * SEC_TO_NS;
        auto newTimeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(hidumpData.id(), timeStamp);
        UpdatePluginTimeRange(hidumpData.id(), timeStamp, newTimeStamp);
        clockId_ = hidumpData.id();
        auto fps = hidumpData.fps();
        traceDataCache_->GetHidumpData()->AppendNewHidumpInfo(newTimeStamp, fps);
    }
}
void PbreaderHidumpParser::Finish()
{
    traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
}
} // namespace TraceStreamer
} // namespace SysTuning
