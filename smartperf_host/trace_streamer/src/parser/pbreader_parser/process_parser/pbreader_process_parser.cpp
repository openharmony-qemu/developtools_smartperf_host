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
#include "pbreader_process_parser.h"
#include "clock_filter_ex.h"
#include "process_filter.h"
#include "process_plugin_config.pbreader.h"
#include "process_plugin_result.pbreader.h"
#include "stat_filter.h"
namespace SysTuning {
namespace TraceStreamer {
PbreaderProcessParser::PbreaderProcessParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx)
{
}

PbreaderProcessParser::~PbreaderProcessParser()
{
    TS_LOGI("process ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
    TS_LOGI("process real ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(MinTs()),
            static_cast<unsigned long long>(MaxTs()));
}
void PbreaderProcessParser::Parse(ProtoReader::BytesView tracePacket, uint64_t ts)
{
    ProtoReader::ProcessData_Reader processData(tracePacket.data_, tracePacket.size_);
    for (auto i = processData.processesinfo(); i; ++i) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_PROCESS, STAT_EVENT_START);
        ProtoReader::ProcessInfo_Reader processInfoParser(i->ToBytes());
        ProtoReader::CpuInfo_Reader cpuInfoParser(processInfoParser.cpuinfo());
        ProtoReader::PssInfo_Reader pssInfoParser(processInfoParser.pssinfo());
        ProtoReader::DiskioInfo_Reader diskioInfoParser(processInfoParser.diskinfo());
        auto liveProcess = std::make_unique<TsLiveProcessData>();
        auto processInfo =
            std::make_unique<ProcessInfo>(processInfoParser.pid(), processInfoParser.name().ToStdString(),
                                          processInfoParser.ppid(), processInfoParser.uid());
        auto cpuInfo = std::make_unique<CpuInfo>(cpuInfoParser.cpu_usage(), cpuInfoParser.thread_sum(),
                                                 cpuInfoParser.cpu_time_ms());
        auto pssInfo = std::make_unique<PssInfo>(pssInfoParser.pss_info());
        auto diskioInfo = std::make_unique<DiskioInfo>(
            diskioInfoParser.rchar(), diskioInfoParser.wchar(), diskioInfoParser.syscr(), diskioInfoParser.syscw(),
            diskioInfoParser.rbytes(), diskioInfoParser.wbytes(), diskioInfoParser.cancelled_wbytes());
        liveProcess->SetLiveProcess(ts, std::move(processInfo), std::move(cpuInfo), std::move(pssInfo),
                                    std::move(diskioInfo));
        liveProcessData_.push_back(std::move(liveProcess));
    }
}
void PbreaderProcessParser::Finish()
{
    if (!liveProcessData_.size()) {
        TS_LOGW("process no data");
        return;
    }
    auto cmp = [](const std::unique_ptr<TsLiveProcessData> &a, const std::unique_ptr<TsLiveProcessData> &b) {
        return a->ts_ < b->ts_;
    };
    std::stable_sort(liveProcessData_.begin(), liveProcessData_.end(), cmp);
    bool first = true;
    uint64_t lastTs = 0;
    for (auto itor = liveProcessData_.begin(); itor != liveProcessData_.end(); itor++) {
        auto tsOld = (*itor)->ts_;
        (*itor)->ts_ = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, (*itor)->ts_);
        UpdatePluginTimeRange(TS_CLOCK_REALTIME, tsOld, (*itor)->ts_);
        if (first) {
            lastTs = (*itor)->ts_;
            first = false;
            continue;
        }
        auto dur = (*itor)->ts_ - lastTs;
        lastTs = (*itor)->ts_;
        if (!(*itor)->processInfo_->pid) {
            continue;
        }
        LiveProcessDetailRow row;
        row.newTimeStamp = (*itor)->ts_;
        row.dur = dur;
        row.processID = (*itor)->processInfo_->pid;
        row.processName = (*itor)->processInfo_->name;
        row.parentProcessID = (*itor)->processInfo_->ppid;
        row.uid = (*itor)->processInfo_->uid;
        row.userName = std::to_string((*itor)->processInfo_->uid);
        row.cpuUsage = (*itor)->cpuUsageData_->cpuUsage;
        row.pssInfo = (*itor)->pssInfo_->pssInfo;
        row.cpuTime = (*itor)->cpuUsageData_->cpuTimeMs;
        row.threads = (*itor)->cpuUsageData_->threadSum;
        row.diskWrites = (*itor)->diskio_->wbytes;
        row.diskReads = (*itor)->diskio_->rbytes;
        traceDataCache_->GetLiveProcessData()->AppendNewData(row);
    }
    liveProcessData_.clear();
    traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
}
} // namespace TraceStreamer
} // namespace SysTuning
