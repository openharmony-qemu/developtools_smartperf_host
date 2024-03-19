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
#include "htrace_event_parser.h"
#include <cinttypes>
#include <string>
#include "app_start_filter.h"
#include "binder_filter.h"
#include "binder.pbreader.h"
#include "clk.pbreader.h"
#include "clock_filter_ex.h"
#include "cpu_filter.h"
#include "ftrace.pbreader.h"
#include "ftrace_event.pbreader.h"
#include "sched.pbreader.h"
#include "ipi.pbreader.h"
#include "irq_filter.h"
#include "irq.pbreader.h"
#include "log.h"
#include "measure_filter.h"
#include "oom.pbreader.h"
#include "power.pbreader.h"
#include "process_filter.h"
#include "raw_syscalls.pbreader.h"
#include "signal.pbreader.h"
#include "slice_filter.h"
#include "stat_filter.h"
#include "system_event_measure_filter.h"
#include "task.pbreader.h"
#include "thread_state_flag.h"
#include "trace_plugin_result.pbreader.h"
#include "workqueue.pbreader.h"
namespace SysTuning {
namespace TraceStreamer {
static constexpr uint8_t MIN_DATA_AREA = 10;
static constexpr uint8_t DATA_AREA_START = 1;
static constexpr uint8_t DATA_AREA_END = 11;
static constexpr size_t MAX_BUFF_SIZE = 1000 * 1000;
static constexpr size_t MAX_DATA_CACHE = 2 * MAX_BUFF_SIZE;

HtraceEventParser::HtraceEventParser(TraceDataCache* dataCache, const TraceStreamerFilters* filter)
    : EventParserBase(dataCache, filter),
      workQueueId_(dataCache->dataDict_.GetStringIndex("workqueue")),
      printEventParser_(traceDataCache_, streamFilters_)
{
    eventToFunctionMap_ = {
        {TRACE_EVENT_TASK_RENAME, std::bind(&HtraceEventParser::TaskRenameEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_TASK_NEWTASK, std::bind(&HtraceEventParser::TaskNewtaskEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SCHED_SWITCH, std::bind(&HtraceEventParser::SchedSwitchEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SCHED_BLOCKED_REASON,
         std::bind(&HtraceEventParser::SchedBlockReasonEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SCHED_WAKEUP, std::bind(&HtraceEventParser::SchedWakeupEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SCHED_WAKING, std::bind(&HtraceEventParser::SchedWakingEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SCHED_WAKEUP_NEW, std::bind(&HtraceEventParser::SchedWakeupNewEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_PROCESS_EXIT, std::bind(&HtraceEventParser::ProcessExitEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_IPI_ENTRY, std::bind(&HtraceEventParser::IpiHandlerEntryEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_IPI_EXIT, std::bind(&HtraceEventParser::IpiHandlerExitEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_PROCESS_FREE, std::bind(&HtraceEventParser::ProcessFreeEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SUSPEND_RESUME, std::bind(&HtraceEventParser::SuspendResumeEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SYS_ENTRY, std::bind(&HtraceEventParser::SysEnterEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_SYS_EXIT, std::bind(&HtraceEventParser::SysExitEvent, this, std::placeholders::_1)},
        {TRACE_EVENT_OOM_SCORE_ADJ_UPDATE,
         std::bind(&HtraceEventParser::OomScoreAdjUpdate, this, std::placeholders::_1)}};
    InterruptEventInitialization();
    ClockEventInitialization();
    CpuEventInitialization();
    LockEventInitialization();
    BinderEventInitialization();
    StackEventsInitialization();
}

void HtraceEventParser::InterruptEventInitialization()
{
    // Interrupt and soft interrupt event initialization
    eventToFunctionMap_.emplace(TRACE_EVENT_IRQ_HANDLER_ENTRY,
                                std::bind(&HtraceEventParser::IrqHandlerEntryEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_IRQ_HANDLER_EXIT,
                                std::bind(&HtraceEventParser::IrqHandlerExitEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_SOFTIRQ_RAISE,
                                std::bind(&HtraceEventParser::SoftIrqRaiseEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_SOFTIRQ_ENTRY,
                                std::bind(&HtraceEventParser::SoftIrqEntryEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_SOFTIRQ_EXIT,
                                std::bind(&HtraceEventParser::SoftIrqExitEvent, this, std::placeholders::_1));
}

void HtraceEventParser::ClockEventInitialization()
{
    // Clock event initialization
    eventToFunctionMap_.emplace(TRACE_EVENT_CLOCK_SET_RATE,
                                std::bind(&HtraceEventParser::ClockSetRateEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CLOCK_ENABLE,
                                std::bind(&HtraceEventParser::ClockEnableEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CLOCK_DISABLE,
                                std::bind(&HtraceEventParser::ClockDisableEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CLK_SET_RATE,
                                std::bind(&HtraceEventParser::ClkSetRateEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CLK_ENABLE,
                                std::bind(&HtraceEventParser::ClkEnableEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CLK_DISABLE,
                                std::bind(&HtraceEventParser::ClkDisableEvent, this, std::placeholders::_1));
}

void HtraceEventParser::CpuEventInitialization()
{
    eventToFunctionMap_.emplace(TRACE_EVENT_CPU_IDLE,
                                std::bind(&HtraceEventParser::CpuIdleEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CPU_FREQUENCY,
                                std::bind(&HtraceEventParser::CpuFrequencyEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_CPU_FREQUENCY_LIMITS,
                                std::bind(&HtraceEventParser::CpuFrequencyLimitsEvent, this, std::placeholders::_1));
}

void HtraceEventParser::LockEventInitialization()
{
    // Initialize lock events
    eventToFunctionMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_LOCK,
                                std::bind(&HtraceEventParser::BinderTractionLockEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_LOCKED,
                                std::bind(&HtraceEventParser::BinderTractionLockedEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_UNLOCK,
                                std::bind(&HtraceEventParser::BinderTractionUnLockEvent, this, std::placeholders::_1));
}

void HtraceEventParser::BinderEventInitialization()
{
    // Binder event initialization
    eventToFunctionMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION,
                                std::bind(&HtraceEventParser::BinderTractionEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(
        TRACE_EVENT_BINDER_TRANSACTION_RECEIVED,
        std::bind(&HtraceEventParser::BinderTractionReceivedEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(
        TRACE_EVENT_BINDER_TRANSACTION_ALLOC_BUF,
        std::bind(&HtraceEventParser::BinderTractionAllocBufEvent, this, std::placeholders::_1));
}

void HtraceEventParser::StackEventsInitialization()
{
    eventToFunctionMap_.emplace(TRACE_EVENT_PRINT,
                                std::bind(&HtraceEventParser::ParsePrintEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_WORKQUEUE_EXECUTE_START,
                                std::bind(&HtraceEventParser::WorkqueueExecuteStartEvent, this, std::placeholders::_1));
    eventToFunctionMap_.emplace(TRACE_EVENT_WORKQUEUE_EXECUTE_END,
                                std::bind(&HtraceEventParser::WorkqueueExecuteEndEvent, this, std::placeholders::_1));
}

HtraceEventParser::~HtraceEventParser()
{
    TS_LOGI("thread count:%u", static_cast<uint32_t>(tids_.size()));
    TS_LOGI("process count:%u", static_cast<uint32_t>(pids_.size()));
    TS_LOGI("ftrace ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(ftraceStartTime_),
            static_cast<unsigned long long>(ftraceEndTime_));
    TS_LOGI("ftrace origin ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(ftraceOriginStartTime_),
            static_cast<unsigned long long>(ftraceOriginEndTime_));
}

void HtraceEventParser::ParserCpuEvent(HtraceDataSegment& tracePacket,
                                       SysTuning::ProtoReader::FtraceCpuDetailMsg_Reader& msg,
                                       bool& haveSplitSeg)
{
    // parser cpu event
    for (auto eventItor = msg.event(); eventItor; eventItor++) {
        ProtoReader::FtraceEvent_Reader ftraceEvent(eventItor->Data(), eventItor->Size());
        std::unique_ptr<EventInfo> eventInfo = std::make_unique<EventInfo>();
        ProtoReader::BytesView detaiBytesView;
        if (!SetEventType(ftraceEvent, *eventInfo, detaiBytesView)) {
            continue;
        }
        ftraceOriginStartTime_ = std::min(ftraceOriginStartTime_.load(), ftraceEvent.timestamp());
        ftraceOriginEndTime_ = std::max(ftraceOriginEndTime_.load(), ftraceEvent.timestamp());
        eventInfo->timeStamp_ =
            streamFilters_->clockFilter_->ToPrimaryTraceTime(tracePacket.clockId, ftraceEvent.timestamp());
        ftraceStartTime_ = std::min(ftraceStartTime_.load(), eventInfo->timeStamp_);
        ftraceEndTime_ = std::max(ftraceEndTime_.load(), eventInfo->timeStamp_);
        traceDataCache_->UpdateTraceTime(eventInfo->timeStamp_);
        if (traceDataCache_->isSplitFile_) {
            if (eventInfo->timeStamp_ >= traceDataCache_->SplitFileMinTime() &&
                eventInfo->timeStamp_ <= traceDataCache_->SplitFileMaxTime()) {
                haveSplitSeg = true;
                return;
            }
            continue;
        }
        ProtoReader::FtraceEvent_CommonFileds_Reader commFileds(ftraceEvent.common_fields().data_,
                                                                ftraceEvent.common_fields().size_);
        eventInfo->pid_ = commFileds.pid();
        eventInfo->tgid_ = ftraceEvent.tgid();
        eventInfo->cpu_ = msg.cpu();
        auto pos = (const char*)detaiBytesView.Data() - tracePacket.seg->data();
        eventInfo->detail_ = std::move(tracePacket.seg->substr(pos, detaiBytesView.Size()));
#ifdef SUPPORTTHREAD
        std::lock_guard<std::mutex> muxLockGuard(mutex_);
#endif
        eventInfo->taskNameIndex_ = traceDataCache_->GetDataIndex(ftraceEvent.comm().ToStdString());
        htraceEventList_.emplace_back(std::move(eventInfo));
    }
}

void HtraceEventParser::ParseDataItem(HtraceDataSegment& tracePacket,
                                      ProtoReader::TracePluginResult_Reader& tracePluginResult,
                                      bool& haveSplitSeg)
{
    if (tracePacket.clockId != clock_) {
        clock_ = tracePacket.clockId.load();
#ifdef SUPPORTTHREAD
        std::lock_guard<std::mutex> muxLockGuard(mutex_);
#endif
        printEventParser_.SetTraceType(TRACE_FILETYPE_H_TRACE);
        printEventParser_.SetTraceClockId(tracePacket.clockId);
    }
    for (auto it = tracePluginResult.ftrace_cpu_detail(); it; ++it) {
        ProtoReader::FtraceCpuDetailMsg_Reader msg(it->ToBytes());
        if (!msg.has_event()) {
            return;
        }
        if (msg.overwrite()) {
            if (!lastOverwrite_) {
                lastOverwrite_ = msg.overwrite();
            }
            if (lastOverwrite_ != msg.overwrite()) {
                TS_LOGW("lost events:%" PRIu64 "", msg.overwrite() - lastOverwrite_);
                lastOverwrite_ = msg.overwrite();
            }
            streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_DATA_LOST);
        }
        // parser cpu event
        ParserCpuEvent(tracePacket, msg, haveSplitSeg);
    }
}

bool HtraceEventParser::BytesViewEventInfo(ProtoReader::BytesView& bytesView,
                                           ProtoReader::BytesView bytesViewChange,
                                           EventInfo& eventInfo,
                                           const SupportedTraceEventType& enumerationClass)
{
    bytesView = bytesViewChange;
    eventInfo.eventType_ = enumerationClass;
    return true;
}

bool HtraceEventParser::ConstructEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                          EventInfo& eventInfo,
                                          ProtoReader::BytesView& bytesView)
{
    // Construct Set the corresponding byte view and event type based on the event type
    bool judgment = false;
    if (event.has_task_rename_format()) {
        judgment = BytesViewEventInfo(bytesView, event.task_rename_format(), eventInfo, TRACE_EVENT_TASK_RENAME);
    } else if (event.has_task_newtask_format()) {
        judgment = BytesViewEventInfo(bytesView, event.task_newtask_format(), eventInfo, TRACE_EVENT_TASK_NEWTASK);
    } else if (event.has_binder_alloc_lru_end_format()) {
        judgment = BytesViewEventInfo(bytesView, event.wakeup_format(), eventInfo, TRACE_EVENT_SCHED_SWITCH);
    } else if (event.has_sched_switch_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sched_switch_format(), eventInfo, TRACE_EVENT_SCHED_SWITCH);
    } else if (event.has_sched_blocked_reason_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sched_blocked_reason_format(), eventInfo,
                                      TRACE_EVENT_SCHED_BLOCKED_REASON);
    } else if (event.has_wakeup_format()) {
        judgment = BytesViewEventInfo(bytesView, event.wakeup_format(), eventInfo, TRACE_EVENT_SCHED_WAKEUP);
    } else if (event.has_sched_wakeup_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sched_wakeup_format(), eventInfo, TRACE_EVENT_SCHED_WAKEUP);
    } else if (event.has_sched_wakeup_new_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sched_wakeup_new_format(), eventInfo, TRACE_EVENT_SCHED_WAKEUP);
    } else if (event.has_sched_waking_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sched_waking_format(), eventInfo, TRACE_EVENT_SCHED_WAKING);
    } else if (event.has_sched_process_exit_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.sched_process_exit_format(), eventInfo, TRACE_EVENT_PROCESS_EXIT);
    } else if (event.has_sched_process_free_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.sched_process_free_format(), eventInfo, TRACE_EVENT_PROCESS_FREE);
    } else if (event.has_suspend_resume_format()) {
        judgment = BytesViewEventInfo(bytesView, event.suspend_resume_format(), eventInfo, TRACE_EVENT_SUSPEND_RESUME);
    } else if (event.has_sys_enter_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sys_enter_format(), eventInfo, TRACE_EVENT_SYS_ENTRY);
    } else if (event.has_sys_exit_format()) {
        judgment = BytesViewEventInfo(bytesView, event.sys_exit_format(), eventInfo, TRACE_EVENT_SYS_EXIT);
    } else if (event.has_oom_score_adj_update_format()) {
        judgment = BytesViewEventInfo(bytesView, event.oom_score_adj_update_format(), eventInfo,
                                      TRACE_EVENT_OOM_SCORE_ADJ_UPDATE);
    }
    return judgment;
}

bool HtraceEventParser::InterruptEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                          EventInfo& eventInfo,
                                          ProtoReader::BytesView& bytesView)
{
    // Interrupt Set the corresponding byte view and event type based on the event type
    bool judgment = false;
    if (event.has_irq_handler_entry_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.irq_handler_entry_format(), eventInfo, TRACE_EVENT_IRQ_HANDLER_ENTRY);
    } else if (event.has_irq_handler_exit_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.irq_handler_exit_format(), eventInfo, TRACE_EVENT_IRQ_HANDLER_EXIT);
    } else if (event.has_softirq_exit_format()) {
        judgment = BytesViewEventInfo(bytesView, event.softirq_exit_format(), eventInfo, TRACE_EVENT_SOFTIRQ_EXIT);
    } else if (event.has_softirq_entry_format()) {
        judgment = BytesViewEventInfo(bytesView, event.softirq_entry_format(), eventInfo, TRACE_EVENT_SOFTIRQ_ENTRY);
    }

    return judgment;
}

bool HtraceEventParser::ClockEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                      EventInfo& eventInfo,
                                      ProtoReader::BytesView& bytesView)
{
    // Clock Set the corresponding byte view and event type based on the event type
    bool judgment = false;
    if (event.has_clock_set_rate_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clock_set_rate_format(), eventInfo, TRACE_EVENT_CLOCK_SET_RATE);
    } else if (event.has_clock_enable_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clock_enable_format(), eventInfo, TRACE_EVENT_CLOCK_ENABLE);
    } else if (event.has_clock_disable_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clock_disable_format(), eventInfo, TRACE_EVENT_CLOCK_DISABLE);
    } else if (event.has_clk_set_rate_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clk_set_rate_format(), eventInfo, TRACE_EVENT_CLK_SET_RATE);
    } else if (event.has_clk_enable_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clk_enable_format(), eventInfo, TRACE_EVENT_CLK_ENABLE);
    } else if (event.has_clk_disable_format()) {
        judgment = BytesViewEventInfo(bytesView, event.clk_disable_format(), eventInfo, TRACE_EVENT_CLK_DISABLE);
    }

    return judgment;
}

bool HtraceEventParser::CpuEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                    EventInfo& eventInfo,
                                    ProtoReader::BytesView& bytesView)
{
    bool judgment = false;
    if (event.has_cpu_idle_format()) {
        judgment = BytesViewEventInfo(bytesView, event.cpu_idle_format(), eventInfo, TRACE_EVENT_CPU_IDLE);
    } else if (event.has_cpu_frequency_format()) {
        judgment = BytesViewEventInfo(bytesView, event.cpu_frequency_format(), eventInfo, TRACE_EVENT_CPU_FREQUENCY);
    } else if (event.has_cpu_frequency_limits_format()) {
        judgment = BytesViewEventInfo(bytesView, event.cpu_frequency_limits_format(), eventInfo,
                                      TRACE_EVENT_CPU_FREQUENCY_LIMITS);
    }

    return judgment;
}

bool HtraceEventParser::LockEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                     EventInfo& eventInfo,
                                     ProtoReader::BytesView& bytesView)
{
    bool judgment = false;

    if (event.has_binder_lock_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.binder_lock_format(), eventInfo, TRACE_EVENT_BINDER_TRANSACTION_LOCK);
    } else if (event.has_binder_locked_format()) {
        judgment = BytesViewEventInfo(bytesView, event.binder_locked_format(), eventInfo,
                                      TRACE_EVENT_BINDER_TRANSACTION_LOCKED);
    } else if (event.has_binder_unlock_format()) {
        judgment = BytesViewEventInfo(bytesView, event.binder_unlock_format(), eventInfo,
                                      TRACE_EVENT_BINDER_TRANSACTION_UNLOCK);
    }

    return judgment;
}

bool HtraceEventParser::BinderEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                       EventInfo& eventInfo,
                                       ProtoReader::BytesView& bytesView)
{
    bool judgment = false;

    if (event.has_binder_transaction_format()) {
        judgment =
            BytesViewEventInfo(bytesView, event.binder_transaction_format(), eventInfo, TRACE_EVENT_BINDER_TRANSACTION);
    } else if (event.has_binder_transaction_received_format()) {
        judgment = BytesViewEventInfo(bytesView, event.binder_transaction_received_format(), eventInfo,
                                      TRACE_EVENT_BINDER_TRANSACTION_RECEIVED);
    } else if (event.has_binder_transaction_alloc_buf_format()) {
        judgment = BytesViewEventInfo(bytesView, event.binder_transaction_alloc_buf_format(), eventInfo,
                                      TRACE_EVENT_BINDER_TRANSACTION_ALLOC_BUF);
    }

    return judgment;
}

bool HtraceEventParser::StackEventSet(const ProtoReader::FtraceEvent_Reader& event,
                                      EventInfo& eventInfo,
                                      ProtoReader::BytesView& bytesView)
{
    bool judgment = false;

    if (event.has_print_format()) {
        judgment = BytesViewEventInfo(bytesView, event.print_format(), eventInfo, TRACE_EVENT_PRINT);
    } else if (event.has_workqueue_execute_start_format()) {
        judgment = BytesViewEventInfo(bytesView, event.workqueue_execute_start_format(), eventInfo,
                                      TRACE_EVENT_WORKQUEUE_EXECUTE_START);
    } else if (event.has_workqueue_execute_end_format()) {
        judgment = BytesViewEventInfo(bytesView, event.workqueue_execute_end_format(), eventInfo,
                                      TRACE_EVENT_WORKQUEUE_EXECUTE_END);
    }

    return judgment;
}

bool HtraceEventParser::SetEventType(const ProtoReader::FtraceEvent_Reader& event,
                                     EventInfo& eventInfo,
                                     ProtoReader::BytesView& bytesView)
{
    // If all conditions are false, execute the data in else
    if (ConstructEventSet(event, eventInfo, bytesView) || InterruptEventSet(event, eventInfo, bytesView) ||
        ClockEventSet(event, eventInfo, bytesView) || CpuEventSet(event, eventInfo, bytesView) ||
        LockEventSet(event, eventInfo, bytesView) || BinderEventSet(event, eventInfo, bytesView) ||
        StackEventSet(event, eventInfo, bytesView)) {
        return true;
    }

    // Tracking event signal generation and transmission
    if (event.has_signal_generate_format()) {
        bytesView = event.signal_generate_format();
        eventInfo.eventType_ = TRACE_EVENT_SIGNAL_GENERATE;
    } else if (event.has_signal_deliver_format()) {
        bytesView = event.signal_deliver_format();
        eventInfo.eventType_ = TRACE_EVENT_SIGNAL_DELIVER;
    } else {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_NOTSUPPORTED);
        return false;
    }

    return true;
}
bool HtraceEventParser::BinderTractionAllocBufEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION_ALLOC_BUF, STAT_EVENT_RECEIVED);
    ProtoReader::BinderTransactionAllocBufFormat_Reader msg(event.detail_);
    uint64_t dataSize = msg.data_size();
    uint64_t offsetsSize = msg.offsets_size();
    streamFilters_->binderFilter_->TransactionAllocBuf(event.timeStamp_, event.pid_, dataSize, offsetsSize);
    TS_LOGD("dataSize:%lu, offsetSize:%lu", dataSize, offsetsSize);
    return true;
}
bool HtraceEventParser::BinderTractionEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION, STAT_EVENT_RECEIVED);
    ProtoReader::BinderTransactionFormat_Reader msg(event.detail_);
    int32_t destNode = msg.target_node();
    int32_t destTgid = msg.to_proc();
    int32_t destTid = msg.to_thread();
    int32_t transactionId = msg.debug_id();
    bool isReply = msg.reply() == 1;
    uint32_t flags = msg.flags();
    TS_LOGD("destNode:%d, destTgid:%d, destTid:%d, transactionId:%d, isReply:%d flags:%d, code:%d", destNode, destTgid,
            destTid, transactionId, isReply, flags, msg.code());
    streamFilters_->binderFilter_->SendTraction(event.timeStamp_, event.pid_, transactionId, destNode, destTgid,
                                                destTid, isReply, flags, msg.code());
    if (traceDataCache_->BinderRunnableTraceEnabled() && !streamFilters_->binderFilter_->IsAsync(flags)) {
        streamFilters_->cpuFilter_->InsertRunnableBinderEvent(
            transactionId, streamFilters_->processFilter_->GetInternalTid(event.pid_));
    }
    return true;
}
bool HtraceEventParser::BinderTractionReceivedEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION_RECEIVED, STAT_EVENT_RECEIVED);
    ProtoReader::BinderTransactionReceivedFormat_Reader msg(event.detail_);
    int32_t transactionId = msg.debug_id();
    streamFilters_->binderFilter_->ReceiveTraction(event.timeStamp_, event.pid_, transactionId);
    if (traceDataCache_->BinderRunnableTraceEnabled()) {
        streamFilters_->cpuFilter_->InsertRunnableBinderRecvEvent(
            transactionId, streamFilters_->processFilter_->GetInternalTid(event.pid_));
    }
    TS_LOGD("transactionId:%d", transactionId);
    return true;
}
bool HtraceEventParser::BinderTractionLockEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION_LOCK, STAT_EVENT_RECEIVED);
    ProtoReader::BinderLockFormat_Reader msg(event.detail_);
    std::string tag = msg.tag().ToStdString();
    streamFilters_->binderFilter_->TractionLock(event.timeStamp_, event.pid_, tag);
    TS_LOGD("tag:%s", tag.c_str());
    return true;
}
bool HtraceEventParser::BinderTractionLockedEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION_LOCKED, STAT_EVENT_RECEIVED);
    ProtoReader::BinderLockedFormat_Reader msg(event.detail_);
    std::string tag = msg.tag().ToStdString();
    streamFilters_->binderFilter_->TractionLocked(event.timeStamp_, event.pid_, tag);
    return true;
}
bool HtraceEventParser::BinderTractionUnLockEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_BINDER_TRANSACTION_UNLOCK, STAT_EVENT_RECEIVED);
    ProtoReader::BinderUnlockFormat_Reader msg(event.detail_);
    std::string tag = msg.tag().ToStdString();
    streamFilters_->binderFilter_->TractionUnlock(event.timeStamp_, event.pid_, tag);
    return true;
}
bool HtraceEventParser::SchedSwitchEvent(const EventInfo& event)
{
    ProtoReader::SchedSwitchFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_SWITCH, STAT_EVENT_RECEIVED);
    uint32_t prevPrioValue = msg.prev_prio();
    uint32_t nextPrioValue = msg.next_prio();
    uint32_t prevPidValue = msg.prev_pid();
    uint32_t nextPidValue = msg.next_pid();
    if (!tids_.count(prevPidValue)) {
        tids_.insert(prevPidValue);
    }
    if (!tids_.count(nextPidValue)) {
        tids_.insert(nextPidValue);
    }
    std::string prevCommStr = msg.prev_comm().ToStdString();
    std::string nextCommStr = msg.next_comm().ToStdString();
    auto prevState = msg.prev_state();

    auto nextInternalTid =
        streamFilters_->processFilter_->UpdateOrCreateThreadWithName(event.timeStamp_, nextPidValue, nextCommStr);
    auto uprevtid =
        streamFilters_->processFilter_->UpdateOrCreateThreadWithName(event.timeStamp_, prevPidValue, prevCommStr);
    streamFilters_->cpuFilter_->InsertSwitchEvent(event.timeStamp_, event.cpu_, uprevtid,
                                                  static_cast<uint64_t>(prevPrioValue), prevState, nextInternalTid,
                                                  static_cast<uint64_t>(nextPrioValue), INVALID_DATAINDEX);
    return true;
}
bool HtraceEventParser::SchedBlockReasonEvent(const EventInfo& event)
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_BLOCKED_REASON, STAT_EVENT_RECEIVED);
    ProtoReader::SchedBlockedReasonFormat_Reader msg(event.detail_);
    uint32_t pid = msg.pid();
    uint32_t ioWait = msg.io_wait();
    auto caller = traceDataCache_->GetDataIndex(
        std::string_view("0x" + SysTuning::base::number(msg.caller(), SysTuning::base::INTEGER_RADIX_TYPE_HEX)));
    auto itid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, pid);
    if (!streamFilters_->cpuFilter_->InsertBlockedReasonEvent(event.timeStamp_, event.cpu_, itid, ioWait, caller,
                                                              INVALID_UINT32)) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_BLOCKED_REASON, STAT_EVENT_NOTMATCH);
    }
    return true;
}
bool HtraceEventParser::ProcessExitEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_PROCESS_EXIT, STAT_EVENT_RECEIVED);
    ProtoReader::SchedProcessExitFormat_Reader msg(event.detail_);
    uint32_t pidValue = msg.pid();
    // The tostdstring() here cannot use temporary variables, which will cause occasional garbled characters under
    // wasm
    auto iTid = streamFilters_->processFilter_->UpdateOrCreateThreadWithName(event.timeStamp_, pidValue,
                                                                             msg.comm().ToStdString());
    if (streamFilters_->cpuFilter_->InsertProcessExitEvent(event.timeStamp_, event.cpu_, iTid)) {
        return true;
    } else {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_PROCESS_EXIT, STAT_EVENT_NOTMATCH);
        return false;
    }
}
bool HtraceEventParser::ProcessFreeEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_PROCESS_FREE, STAT_EVENT_RECEIVED);
    ProtoReader::SchedProcessFreeFormat_Reader msg(event.detail_);
    uint32_t pidValue = msg.pid();
    // The tostdstring() here cannot use temporary variables, which will cause occasional garbled characters under
    // wasm
    auto iTid = streamFilters_->processFilter_->UpdateOrCreateThreadWithName(event.timeStamp_, pidValue,
                                                                             msg.comm().ToStdString());
    if (streamFilters_->cpuFilter_->InsertProcessFreeEvent(event.timeStamp_, iTid)) {
        return true;
    } else {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_PROCESS_FREE, STAT_EVENT_NOTMATCH);
        return false;
    }
}
bool HtraceEventParser::TaskRenameEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_TASK_RENAME, STAT_EVENT_RECEIVED);
    ProtoReader::TaskRenameFormat_Reader msg(event.detail_);
    auto commStr = msg.newcomm();
    auto pidValue = msg.pid();
    streamFilters_->processFilter_->UpdateOrCreateThreadWithName(event.timeStamp_, pidValue, commStr.ToStdString());
    return true;
}
bool HtraceEventParser::TaskNewtaskEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_TASK_NEWTASK, STAT_EVENT_RECEIVED);
    // the clone flag from txt trace from kernel original is HEX, but when it is converted from proto
    // based trace, it will be OCT number, it is not stable, so we decide to ignore it
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_TASK_NEWTASK, STAT_EVENT_NOTSUPPORTED);
    return true;
}
bool HtraceEventParser::ParsePrintEvent(const EventInfo& event)
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_PRINT, STAT_EVENT_RECEIVED);
    ProtoReader::PrintFormat_Reader msg(event.detail_);
    BytraceLine line;
    line.tgid = event.tgid_;
    line.pid = event.pid_;
    line.ts = event.timeStamp_;
    const auto& taskName = traceDataCache_->GetDataFromDict(event.taskNameIndex_);
    printEventParser_.ParsePrintEvent(taskName, event.timeStamp_, event.pid_, msg.buf().ToStdString(), line);
    if (!tids_.count(event.pid_)) {
        tids_.insert(event.pid_);
    }
    return true;
}
bool HtraceEventParser::SchedWakeupEvent(const EventInfo& event) const
{
    ProtoReader::SchedWakeupFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_WAKEUP, STAT_EVENT_RECEIVED);
    auto instants = traceDataCache_->GetInstantsData();

    InternalTid internalTid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, msg.pid());
    InternalTid wakeupFromPid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, event.pid_);
    instants->AppendInstantEventData(event.timeStamp_, schedWakeupName_, internalTid, wakeupFromPid);
    streamFilters_->cpuFilter_->InsertWakeupEvent(event.timeStamp_, internalTid);
    uint32_t targetCpu = msg.target_cpu();
    traceDataCache_->GetRawData()->AppendRawData(event.timeStamp_, RAW_SCHED_WAKEUP, targetCpu, internalTid);
    return true;
}
bool HtraceEventParser::SchedWakeupNewEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_WAKEUP_NEW, STAT_EVENT_RECEIVED);
    ProtoReader::SchedWakeupNewFormat_Reader msg(event.detail_);
    auto instants = traceDataCache_->GetInstantsData();

    auto internalTid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, msg.pid());
    auto wakeupFromPid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, event.pid_);
    instants->AppendInstantEventData(event.timeStamp_, schedWakeupNewName_, internalTid, wakeupFromPid);
    streamFilters_->cpuFilter_->InsertWakeupEvent(event.timeStamp_, internalTid);
    uint32_t targetCpu = msg.target_cpu();
    traceDataCache_->GetRawData()->AppendRawData(event.timeStamp_, RAW_SCHED_WAKEUP, targetCpu, internalTid);
    return true;
}
bool HtraceEventParser::SchedWakingEvent(const EventInfo& event) const
{
    ProtoReader::SchedWakingFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SCHED_WAKING, STAT_EVENT_RECEIVED);
    uint32_t wakePidValue = msg.pid();
    auto instants = traceDataCache_->GetInstantsData();
    auto internalTid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, wakePidValue);
    auto wakeupFromPid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, event.pid_);
    streamFilters_->cpuFilter_->InsertWakeupEvent(event.timeStamp_, internalTid, true);
    instants->AppendInstantEventData(event.timeStamp_, schedWakingName_, internalTid, wakeupFromPid);
    uint32_t targetCpu = msg.target_cpu();
    traceDataCache_->GetRawData()->AppendRawData(event.timeStamp_, RAW_SCHED_WAKING, targetCpu, wakeupFromPid);
    return true;
}
bool HtraceEventParser::CpuIdleEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_IDLE, STAT_EVENT_RECEIVED);
    ProtoReader::CpuIdleFormat_Reader msg(event.detail_);
    std::optional<uint32_t> eventCpuValue = msg.cpu_id();
    std::optional<uint64_t> newStateValue = msg.state();
    if (!eventCpuValue.has_value()) {
        TS_LOGW("Failed to convert event cpu");
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_IDLE, STAT_EVENT_DATA_INVALID);
        return false;
    }
    if (!newStateValue.has_value()) {
        TS_LOGW("Failed to convert state");
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_IDLE, STAT_EVENT_DATA_INVALID);
        return false;
    }

    streamFilters_->cpuMeasureFilter_->AppendNewMeasureData(eventCpuValue.value(), cpuIdleName_, event.timeStamp_,
                                                            config_.GetStateValue(newStateValue.value()));

    // Add cpu_idle event to raw_data_table
    traceDataCache_->GetRawData()->AppendRawData(event.timeStamp_, RAW_CPU_IDLE, eventCpuValue.value(), 0);
    return true;
}
bool HtraceEventParser::CpuFrequencyEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_FREQUENCY, STAT_EVENT_RECEIVED);
    ProtoReader::CpuFrequencyFormat_Reader msg(event.detail_);
    std::optional<uint64_t> newStateValue = msg.state();
    std::optional<uint32_t> eventCpuValue = msg.cpu_id();

    if (!newStateValue.has_value()) {
        TS_LOGW("Failed to convert state");
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_FREQUENCY, STAT_EVENT_DATA_INVALID);
        return false;
    }
    if (!eventCpuValue.has_value()) {
        TS_LOGW("Failed to convert event cpu");
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_FREQUENCY, STAT_EVENT_DATA_INVALID);
        return false;
    }

    streamFilters_->cpuMeasureFilter_->AppendNewMeasureData(eventCpuValue.value(), cpuFrequencyName_, event.timeStamp_,
                                                            newStateValue.value());
    return true;
}
bool HtraceEventParser::CpuFrequencyLimitsEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CPU_FREQUENCY_LIMITS, STAT_EVENT_RECEIVED);
    ProtoReader::CpuFrequencyLimitsFormat_Reader msg(event.detail_);
    uint32_t maxFreq = msg.max_freq();
    uint32_t minFreq = msg.min_freq();
    uint32_t eventCpuValue = msg.cpu_id();
    streamFilters_->cpuMeasureFilter_->AppendNewMeasureData(eventCpuValue, cpuFrequencyLimitMaxNameId, event.timeStamp_,
                                                            maxFreq);
    streamFilters_->cpuMeasureFilter_->AppendNewMeasureData(eventCpuValue, cpuFrequencyLimitMinNameId, event.timeStamp_,
                                                            minFreq);
    return true;
}
bool HtraceEventParser::SuspendResumeEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SUSPEND_RESUME, STAT_EVENT_RECEIVED);
    ProtoReader::SuspendResumeFormat_Reader msg(event.detail_);
    int32_t val = msg.val();
    uint32_t start = msg.start();
    std::string action = msg.action().ToStdString();
    Unused(val);
    Unused(start);
    Unused(action);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SUSPEND_RESUME, STAT_EVENT_NOTSUPPORTED);
    return true;
}
bool HtraceEventParser::WorkqueueExecuteStartEvent(const EventInfo& event) const
{
    ProtoReader::WorkqueueExecuteStartFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_WORKQUEUE_EXECUTE_START, STAT_EVENT_RECEIVED);
    auto funcNameIndex = traceDataCache_->GetSymbolsData()->GetFunc(msg.function());
    size_t result = INVALID_UINT32;
    const auto& taskName = traceDataCache_->GetDataFromDict(event.taskNameIndex_);
    if (funcNameIndex == INVALID_UINT64) {
        std::string addrStr = "0x" + base::number(msg.function(), base::INTEGER_RADIX_TYPE_HEX);
        auto addStrIndex = traceDataCache_->GetDataIndex(addrStr);
        result = streamFilters_->sliceFilter_->BeginSlice(taskName, event.timeStamp_, event.tgid_, event.tgid_,
                                                          workQueueId_, addStrIndex);
    } else {
        result = streamFilters_->sliceFilter_->BeginSlice(taskName, event.timeStamp_, event.tgid_, event.tgid_,
                                                          workQueueId_, funcNameIndex);
    }

    traceDataCache_->GetInternalSlicesData()->AppendDistributeInfo();
    if (result == INVALID_UINT32) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_TRACING_MARK_WRITE, STAT_EVENT_DATA_LOST);
    }
    return true;
}
bool HtraceEventParser::WorkqueueExecuteEndEvent(const EventInfo& event) const
{
    ProtoReader::WorkqueueExecuteEndFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_WORKQUEUE_EXECUTE_END, STAT_EVENT_RECEIVED);
    if (streamFilters_->sliceFilter_->EndSlice(event.timeStamp_, event.tgid_, event.tgid_, workQueueId_)) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_WORKQUEUE_EXECUTE_END, STAT_EVENT_NOTMATCH);
    }
    return true;
}
bool HtraceEventParser::ClockSetRateEvent(const EventInfo& event) const
{
    ProtoReader::ClockSetRateFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLOCK_SET_RATE, STAT_EVENT_RECEIVED);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clockRateFilter_->AppendNewMeasureData(msg.cpu_id(), nameIndex, event.timeStamp_, msg.state());
    return true;
}
bool HtraceEventParser::ClockEnableEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLOCK_ENABLE, STAT_EVENT_RECEIVED);
    ProtoReader::ClockEnableFormat_Reader msg(event.detail_);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clockEnableFilter_->AppendNewMeasureData(msg.cpu_id(), nameIndex, event.timeStamp_, msg.state());
    return true;
}
bool HtraceEventParser::ClockDisableEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLOCK_DISABLE, STAT_EVENT_RECEIVED);
    ProtoReader::ClockDisableFormat_Reader msg(event.detail_);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clockDisableFilter_->AppendNewMeasureData(msg.cpu_id(), nameIndex, event.timeStamp_, msg.state());
    return true;
}
bool HtraceEventParser::ClkSetRateEvent(const EventInfo& event) const
{
    ProtoReader::ClkSetRateFormat_Reader msg(event.detail_);
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLK_SET_RATE, STAT_EVENT_RECEIVED);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clkRateFilter_->AppendNewMeasureData(event.cpu_, nameIndex, event.timeStamp_, msg.rate());
    return true;
}
bool HtraceEventParser::ClkEnableEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLK_ENABLE, STAT_EVENT_RECEIVED);
    ProtoReader::ClkEnableFormat_Reader msg(event.detail_);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clkEnableFilter_->AppendNewMeasureData(event.cpu_, nameIndex, event.timeStamp_, 1);
    return true;
}
bool HtraceEventParser::ClkDisableEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_CLK_DISABLE, STAT_EVENT_RECEIVED);
    ProtoReader::ClkDisableFormat_Reader msg(event.detail_);
    DataIndex nameIndex = traceDataCache_->GetDataIndex(msg.name().ToStdString());
    streamFilters_->clkDisableFilter_->AppendNewMeasureData(event.cpu_, nameIndex, event.timeStamp_, 0);
    return true;
}

bool HtraceEventParser::IrqHandlerEntryEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_IRQ_HANDLER_ENTRY, STAT_EVENT_RECEIVED);
    ProtoReader::IrqHandlerEntryFormat_Reader msg(event.detail_);
    // The tostdstring() here cannot use temporary variables, which will cause occasional garbled characters under
    // wasm
    streamFilters_->irqFilter_->IrqHandlerEntry(event.timeStamp_, event.cpu_,
                                                traceDataCache_->GetDataIndex(msg.name().ToStdString()));
    return true;
}
bool HtraceEventParser::IrqHandlerExitEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_IRQ_HANDLER_EXIT, STAT_EVENT_RECEIVED);
    ProtoReader::IrqHandlerExitFormat_Reader msg(event.detail_);
    streamFilters_->irqFilter_->IrqHandlerExit(event.timeStamp_, event.cpu_, msg.irq(),
                                               static_cast<uint32_t>(msg.ret()));
    return true;
}
bool HtraceEventParser::IpiHandlerEntryEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_IPI_ENTRY, STAT_EVENT_RECEIVED);
    ProtoReader::IpiEntryFormat_Reader msg(event.detail_);
    streamFilters_->irqFilter_->IpiHandlerEntry(event.timeStamp_, event.cpu_,
                                                traceDataCache_->GetDataIndex(msg.reason().ToStdString()));
    return true;
}
bool HtraceEventParser::IpiHandlerExitEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_IPI_EXIT, STAT_EVENT_RECEIVED);
    streamFilters_->irqFilter_->IpiHandlerExit(event.timeStamp_, event.cpu_);
    return true;
}
bool HtraceEventParser::SoftIrqEntryEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_SOFTIRQ_ENTRY, STAT_EVENT_RECEIVED);
    ProtoReader::SoftirqEntryFormat_Reader msg(event.detail_);
    streamFilters_->irqFilter_->SoftIrqEntry(event.timeStamp_, event.cpu_, static_cast<uint32_t>(msg.vec()));
    return true;
}
bool HtraceEventParser::SoftIrqRaiseEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_SOFTIRQ_RAISE, STAT_EVENT_RECEIVED);
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_SOFTIRQ_RAISE, STAT_EVENT_NOTSUPPORTED);
    return true;
}
bool HtraceEventParser::SoftIrqExitEvent(const EventInfo& event) const
{
    traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_SOFTIRQ_EXIT, STAT_EVENT_RECEIVED);
    ProtoReader::SoftirqExitFormat_Reader msg(event.detail_);
    streamFilters_->irqFilter_->SoftIrqExit(event.timeStamp_, event.cpu_, static_cast<uint32_t>(msg.vec()));
    return true;
}
bool HtraceEventParser::SysEnterEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SYS_ENTRY, STAT_EVENT_RECEIVED);
    ProtoReader::SysEnterFormat_Reader msg(event.detail_);
    auto ipid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, event.tgid_);
    traceDataCache_->GetSysCallData()->AppendSysCallData(msg.id(), sysEnterName_, ipid, event.timeStamp_, 0);
    return true;
}
bool HtraceEventParser::SysExitEvent(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_SYS_EXIT, STAT_EVENT_RECEIVED);
    ProtoReader::SysExitFormat_Reader msg(event.detail_);
    auto ipid = streamFilters_->processFilter_->UpdateOrCreateThread(event.timeStamp_, event.tgid_);
    traceDataCache_->GetSysCallData()->AppendSysCallData(msg.id(), sysExitName_, ipid, event.timeStamp_, msg.ret());
    return true;
}

bool HtraceEventParser::OomScoreAdjUpdate(const EventInfo& event) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OOM_SCORE_ADJ_UPDATE, STAT_EVENT_RECEIVED);
    ProtoReader::OomScoreAdjUpdateFormat_Reader msg(event.detail_);
    streamFilters_->processMeasureFilter_->AppendNewMeasureData(msg.pid(), oomScoreAdjName_, event.timeStamp_,
                                                                msg.oom_score_adj());
    return true;
}

void HtraceEventParser::FilterAllEventsReader()
{
#ifdef SUPPORTTHREAD
    std::lock_guard<std::mutex> muxLockGuard(mutex_);
#endif
    if (htraceEventList_.size() < MAX_DATA_CACHE) {
        return;
    }
    auto cmp = [](const std::unique_ptr<EventInfo>& a, const std::unique_ptr<EventInfo>& b) {
        return a->timeStamp_ < b->timeStamp_;
    };
    std::stable_sort(htraceEventList_.begin(), htraceEventList_.end(), cmp);

    auto endOfList = htraceEventList_.begin() + MAX_BUFF_SIZE;
    for (auto eventItor = htraceEventList_.begin(); eventItor != endOfList; ++eventItor) {
        auto event = eventItor->get();
        if (event->tgid_ != INVALID_INT32) {
            if (!pids_.count(event->tgid_)) {
                pids_.insert(event->tgid_);
            }
            streamFilters_->processFilter_->GetOrCreateThreadWithPid(event->tgid_, event->tgid_);
        }
        ProtoReaderDealEvent(event);
        eventItor->reset();
    }
    htraceEventList_.erase(htraceEventList_.begin(), endOfList);
}
void HtraceEventParser::FilterAllEvents()
{
    auto cmp = [](const std::unique_ptr<EventInfo>& a, const std::unique_ptr<EventInfo>& b) {
        return a->timeStamp_ < b->timeStamp_;
    };
#ifdef SUPPORTTHREAD
    std::lock_guard<std::mutex> muxLockGuard(mutex_);
#endif
    std::stable_sort(htraceEventList_.begin(), htraceEventList_.end(), cmp);
    while (htraceEventList_.size()) {
        int32_t size = std::min(MAX_BUFF_SIZE, htraceEventList_.size());
        auto endOfList = htraceEventList_.begin() + size;
        for (auto eventIter = htraceEventList_.begin(); eventIter != endOfList; ++eventIter) {
            auto event = eventIter->get();
            if (event->tgid_ != INVALID_INT32) {
                if (!pids_.count(event->tgid_)) {
                    pids_.insert(event->tgid_);
                }
                streamFilters_->processFilter_->GetOrCreateThreadWithPid(event->tgid_, event->tgid_);
            }
            ProtoReaderDealEvent(event);
            eventIter->reset();
        }
        htraceEventList_.erase(htraceEventList_.begin(), endOfList);
    }
    htraceEventList_.clear();
    streamFilters_->cpuFilter_->Finish();
    traceDataCache_->dataDict_.Finish();
    traceDataCache_->UpdataZeroThreadInfo();
    if (traceDataCache_->AppStartTraceEnabled()) {
        streamFilters_->appStartupFilter_->FilterAllAPPStartupData();
    }
    traceDataCache_->GetThreadStateData()->SortAllRowByTs();
}

void HtraceEventParser::ProtoReaderDealEvent(EventInfo* eventInfo)
{
    if (eventInfo->pid_ != INVALID_INT32) {
        if (!tids_.count(eventInfo->pid_)) {
            tids_.insert(eventInfo->pid_);
        }
        streamFilters_->processFilter_->UpdateOrCreateThread(eventInfo->timeStamp_, eventInfo->pid_);
    }
    if (eventInfo->pid_ != INVALID_INT32 && eventInfo->tgid_ != INVALID_INT32) {
        streamFilters_->processFilter_->GetOrCreateThreadWithPid(eventInfo->pid_, eventInfo->tgid_);
    }
    auto eventToFuncItor = eventToFunctionMap_.find(eventInfo->eventType_);
    if (eventToFuncItor != eventToFunctionMap_.end()) {
        eventToFuncItor->second(*eventInfo);
    }
}

void HtraceEventParser::Clear()
{
    const_cast<TraceStreamerFilters*>(streamFilters_)->FilterClear();
    streamFilters_->sysEventMemMeasureFilter_->Clear();
    streamFilters_->sysEventVMemMeasureFilter_->Clear();
    printEventParser_.Finish();
}
} // namespace TraceStreamer
} // namespace SysTuning
