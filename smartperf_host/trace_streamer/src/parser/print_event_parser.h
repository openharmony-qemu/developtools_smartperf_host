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
#ifndef SRC_PRINT_EVENT_PARSER_H
#define SRC_PRINT_EVENT_PARSER_H
#include <regex>
#include <set>
#include <string_view>
#include "common_types.h"
#include "event_parser_base.h"
#include "measure_filter.h"
#include "process_filter.h"
#include "slice_filter.h"
#include "task_pool_filter.h"
#include "string_to_numerical.h"
#include "trace_streamer_config.h"
namespace SysTuning {
namespace TraceStreamer {
class PrintEventParser : private EventParserBase {
public:
    PrintEventParser(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    bool ParsePrintEvent(const std::string &comm,
                         uint64_t ts,
                         uint32_t pid,
                         std::string_view event,
                         const BytraceLine &line);
    void ParseBeginEvent(const std::string &comm,
                         uint64_t ts,
                         uint32_t pid,
                         TracePoint &point,
                         const BytraceLine &line);
    void ParseEndEvent(uint64_t ts, uint32_t pid, const TracePoint &point);
    void ParseStartEvent(const std::string &comm,
                         uint64_t ts,
                         uint32_t pid,
                         const TracePoint &point,
                         const BytraceLine &line);
    void ParseFinishEvent(uint64_t ts, uint32_t pid, const TracePoint &point, const BytraceLine &line);
    void ParseCreateEvent(uint64_t ts, const TracePoint &point);
    void ParseGEvent(uint64_t ts, uint32_t pid, TracePoint &point);
    void ParseHEvent(uint64_t ts, const TracePoint &point);
    void Finish();
    void SetTraceType(TraceFileType traceType);
    void SetTraceClockId(BuiltinClocks clock);
    void ParseSplitTraceMetaData(const std::string &dataStr, TracePoint &outPoint, bool isAsynEvent) const;

private:
    using FrameFuncCall = std::function<bool(const size_t callStackRow, std::string &args, const BytraceLine &line)>;
    ParseResult GetTracePoint(std::string_view pointStr, TracePoint &outPoint) const;
    ParseResult CheckTracePoint(std::string_view pointStr) const;
    uint32_t GetThreadGroupId(std::string_view pointStr, size_t &length) const;
    std::string_view GetPointNameForBegin(std::string_view pointStr, size_t tGidlength) const;
    ParseResult HandlerB(std::string_view pointStr, TracePoint &outPoint, size_t tGidlength) const;
    bool HandleFrameSliceBeginEvent(DataIndex eventName,
                                    size_t callStackRow,
                                    std::string &args,
                                    const BytraceLine &line);
    void HandleFrameSliceEndEvent(uint64_t ts, uint64_t pid, uint64_t tid, size_t callStackRow);
    void HandleFrameQueueEndEvent(uint64_t ts, uint64_t pid, uint64_t tid, size_t callStackRow);
    bool HandleAnimationBeginEvent(const TracePoint &point, size_t callStackRow, const BytraceLine &line);
    static ParseResult HandlerE(void);
    ParseResult HandlerCSF(std::string_view pointStr, TracePoint &outPoint, size_t tGidlength) const;
    static size_t GetNameLength(std::string_view pointStr, size_t nameIndex);
    static size_t GetGHNameLength(std::string_view pointStr, size_t nameIndex);
    ParseResult HandlerGH(std::string_view pointStr, TracePoint &outPoint, size_t tGidlength) const;
    size_t GetValueLength(std::string_view pointStr, size_t valueIndex) const;
    bool ReciveVsync(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool RSReciveOnDoComposition(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool OnRwTransaction(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool OnMainThreadProcessCmd(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool OnFrameQueueStart(uint64_t ts, size_t callStackRow, uint64_t pid);
    bool OnVsyncEvent(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool DealUvTraceEvent(size_t callStackRow, std::string &args, const BytraceLine &line);
    bool DealUIVsyncTaskEvent(DataIndex eventName, const BytraceLine &line);

private:
    std::map<DataIndex, FrameFuncCall> eventToFrameFunctionMap_ = {};
    TraceStreamerConfig config_{};
    const DataIndex recvievVsync_ = traceDataCache_->GetDataIndex("H:ReceiveVsync");
    const DataIndex onVsyncEvent_ = traceDataCache_->GetDataIndex("H:OnVsyncEvent");
    const std::string uiVsyncTaskStr_ = "H:UIVsyncTask";
    const std::string rsOnDoCompositionStr_ = "H:RSMainThread::DoComposition";
    DataIndex rsOnDoCompositionEvent_ = INVALID_DATAINDEX;
    const std::string onFrameQueeuStartEvent_ = "H:M: Frame queued";
    const std::string onAnimationProcEvent_ = "render_service";     // 并行化前动效过程异步trace打点线程
    const std::string newOnAnimationProcEvent_ = "RSUniRenderThre"; // 并行化后动效过程异步trace打点线程
    const DataIndex marshRwTransactionData_ = traceDataCache_->GetDataIndex("H:MarshRSTransactionData");
    const DataIndex rsMainThreadProcessCmd_ = traceDataCache_->GetDataIndex("H:RSMainThread::ProcessCommandUni");
    const std::regex recvVsyncPattern_ = std::regex(R"((\w+):\s*(\w+))");
    const std::regex uiVsyncTaskPattern_ = std::regex("\\[(\\w+):(\\d+)\\]");
    const std::regex transFlagPattern_ = std::regex(R"(transactionFlag:\[(\d+),(\d+)\])");
    const std::regex newTransFlagPattern_ =
        std::regex(R"(transactionFlag:\[(\d+),(\d+)\],\s*tid:(\d+),\s*timestamp:(\d+))");
    const std::regex mainProcessCmdPattern_ = std::regex("\\[(\\d+),(\\d+)\\]");
    const std::regex distributeMatcher_ = std::regex(R"(H:\[([a-z0-9]+),([a-z0-9]+),([a-z0-9]+)\]#([CS]?)##(.*))");
    const std::regex newDistributeMatcher_ = std::regex(R"(H:\[([a-z0-9]+),([a-z0-9]+),([a-z0-9]+)\]#(.*))");
    std::vector<uint64_t> frameCallIds_ = {};
    std::unordered_map<uint64_t, std::vector<uint64_t>> vsyncSliceMap_ = {};
    TraceFileType traceType_ = TRACE_FILETYPE_H_TRACE;
    BuiltinClocks clock_ = TS_CLOCK_BOOTTIME;
    const uint32_t maxVsyncEventSize_ = 2;
    const uint32_t namePosition = 4;
    // if convert vsync's now and expectEnd
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // SRC_PRINT_EVENT_PARSER_H
