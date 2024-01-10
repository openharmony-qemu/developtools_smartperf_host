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
#ifndef HTRACE_EVENT_PARSER_H
#define HTRACE_EVENT_PARSER_H
#include <cstdint>
#include <functional>
#include <limits>
#include <stdexcept>
#include <string>
#include <unordered_set>
#include <vector>
#include <mutex>

#include "event_parser_base.h"
#include "ftrace_event.pbreader.h"
#include "google/protobuf/message_lite.h"
#include "log.h"
#include "print_event_parser.h"
#include "trace_data/trace_data_cache.h"
#include "trace_plugin_result.pbreader.h"
#include "trace_streamer_config.h"
#include "trace_streamer_filters.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace google::protobuf;
class HtraceEventParser : private EventParserBase {
public:
    HtraceEventParser(TraceDataCache* dataCache, const TraceStreamerFilters* filter);
    ~HtraceEventParser();
    void ParseDataItem(HtraceDataSegment& tracePacket,
                       ProtoReader::TracePluginResult_Reader& tracePluginResult,
                       bool& haveSplitSeg);
    void FilterAllEventsReader();
    void FilterAllEvents();
    void Clear();

private:
    struct EventInfo {
        int32_t pid_ = 0;
        int32_t tgid_ = 0;
        uint32_t cpu_ = 0;
        SupportedTraceEventType eventType_ = TRACE_EVENT_OTHER;
        uint64_t timeStamp_ = INVALID_UINT64;
        DataIndex taskNameIndex_;
        std::string detail_;
    };

    // Initialization
    void InterruptEventInitialization();
    void ClockEventInitialization();
    void CpuEventInitialization();
    void LockEventInitialization();
    void BinderEventInitialization();
    void StackEventsInitialization();

    bool BytesViewEventInfo(ProtoReader::BytesView& bytesView,
                            ProtoReader::BytesView bytesViewChange,
                            EventInfo& eventInfo,
                            const SupportedTraceEventType& enumerationClass);
    bool ConstructEventSet(const ProtoReader::FtraceEvent_Reader& event,
                           EventInfo& eventInfo,
                           ProtoReader::BytesView& bytesView);

    bool InterruptEventSet(const ProtoReader::FtraceEvent_Reader& event,
                           EventInfo& eventInfo,
                           ProtoReader::BytesView& bytesView);
    bool ClockEventSet(const ProtoReader::FtraceEvent_Reader& event,
                       EventInfo& eventInfo,
                       ProtoReader::BytesView& bytesView);
    bool CpuEventSet(const ProtoReader::FtraceEvent_Reader& event,
                     EventInfo& eventInfo,
                     ProtoReader::BytesView& bytesView);
    bool LockEventSet(const ProtoReader::FtraceEvent_Reader& event,
                      EventInfo& eventInfo,
                      ProtoReader::BytesView& bytesView);
    bool BinderEventSet(const ProtoReader::FtraceEvent_Reader& event,
                        EventInfo& eventInfo,
                        ProtoReader::BytesView& bytesView);
    bool StackEventSet(const ProtoReader::FtraceEvent_Reader& event,
                       EventInfo& eventInfo,
                       ProtoReader::BytesView& bytesView);

    bool SetEventType(const ProtoReader::FtraceEvent_Reader& event,
                      EventInfo& eventInfo,
                      ProtoReader::BytesView& bytesView);
    void ProtoReaderDealEvent(EventInfo* eventInfo);

    void ParserCpuEvent(HtraceDataSegment& tracePacket,
                        SysTuning::ProtoReader::FtraceCpuDetailMsg_Reader& msg,
                        bool& haveSplitSeg);
    bool BinderTractionEvent(const EventInfo& event) const;
    bool BinderTractionReceivedEvent(const EventInfo& event) const;
    bool BinderTractionAllocBufEvent(const EventInfo& event) const;
    bool BinderTractionLockEvent(const EventInfo& event) const;
    bool BinderTractionLockedEvent(const EventInfo& event) const;
    bool BinderTractionUnLockEvent(const EventInfo& event) const;
    bool SchedSwitchEvent(const EventInfo& event);
    bool SchedBlockReasonEvent(const EventInfo& event);
    bool ProcessExitEvent(const EventInfo& event) const;
    bool ProcessFreeEvent(const EventInfo& event) const;
    bool TaskRenameEvent(const EventInfo& event) const;
    bool TaskNewtaskEvent(const EventInfo& event) const;
    bool ParsePrintEvent(const EventInfo& event);
    bool SchedWakeupEvent(const EventInfo& event) const;
    bool SchedWakeupNewEvent(const EventInfo& event) const;
    bool SchedWakingEvent(const EventInfo& event) const;
    bool CpuIdleEvent(const EventInfo& event) const;
    bool CpuFrequencyEvent(const EventInfo& event) const;
    bool CpuFrequencyLimitsEvent(const EventInfo& event) const;
    bool SuspendResumeEvent(const EventInfo& event) const;
    bool WorkqueueExecuteStartEvent(const EventInfo& event) const;
    bool WorkqueueExecuteEndEvent(const EventInfo& event) const;
    bool ClockSetRateEvent(const EventInfo& event) const;
    bool ClockEnableEvent(const EventInfo& event) const;
    bool ClockDisableEvent(const EventInfo& event) const;
    bool ClkSetRateEvent(const EventInfo& event) const;
    bool ClkEnableEvent(const EventInfo& event) const;
    bool ClkDisableEvent(const EventInfo& event) const;
    bool IrqHandlerEntryEvent(const EventInfo& event) const;
    bool IrqHandlerExitEvent(const EventInfo& event) const;
    bool IpiHandlerEntryEvent(const EventInfo& event) const;
    bool IpiHandlerExitEvent(const EventInfo& event) const;
    bool SoftIrqEntryEvent(const EventInfo& event) const;
    bool SoftIrqRaiseEvent(const EventInfo& event) const;
    bool SoftIrqExitEvent(const EventInfo& event) const;
    bool SysEnterEvent(const EventInfo& event) const;
    bool SysExitEvent(const EventInfo& event) const;
    bool OomScoreAdjUpdate(const EventInfo& event) const;
    using FuncCall = std::function<bool(const EventInfo& event)>;
    std::map<uint32_t, FuncCall> eventToFunctionMap_ = {};
    std::unordered_set<uint32_t> tids_ = {};
    std::unordered_set<uint32_t> pids_ = {};
    DataIndex workQueueId_ = 0;
    PrintEventParser printEventParser_;
    std::atomic<uint64_t> lastOverwrite_{0};
    std::atomic<uint64_t> ftraceStartTime_{std::numeric_limits<uint64_t>::max()};
    std::atomic<uint64_t> ftraceEndTime_{0};
    std::atomic<uint64_t> ftraceOriginStartTime_{std::numeric_limits<uint64_t>::max()};
    std::atomic<uint64_t> ftraceOriginEndTime_{0};
    std::deque<std::unique_ptr<EventInfo>> htraceEventList_ = {};
    const DataIndex signalGenerateId_ = traceDataCache_->GetDataIndex("signal_generate");
    const DataIndex signalDeliverId_ = traceDataCache_->GetDataIndex("signal_deliver");
    const DataIndex schedWakeupName_ = traceDataCache_->GetDataIndex("sched_wakeup");
    const DataIndex schedWakingName_ = traceDataCache_->GetDataIndex("sched_waking");
    const DataIndex schedWakeupNewName_ = traceDataCache_->GetDataIndex("sched_wakeup_new");
    const DataIndex cpuIdleName_ = traceDataCache_->GetDataIndex("cpu_idle");
    const DataIndex cpuFrequencyName_ = traceDataCache_->GetDataIndex("cpu_frequency");
    const DataIndex cpuFrequencyLimitMaxNameId = traceDataCache_->GetDataIndex("cpu_frequency_limits_max");
    const DataIndex cpuFrequencyLimitMinNameId = traceDataCache_->GetDataIndex("cpu_frequency_limits_min");
    const DataIndex sysEnterName_ = traceDataCache_->GetDataIndex("sys_enter");
    const DataIndex sysExitName_ = traceDataCache_->GetDataIndex("sys_exit");
    const DataIndex oomScoreAdjName_ = traceDataCache_->GetDataIndex("oom_score_adj");
    TraceStreamerConfig config_{};
    std::atomic<BuiltinClocks> clock_{TS_CLOCK_BOOTTIME};
    std::mutex mutex_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // HTRACE_EVENT_PARSER_H_
