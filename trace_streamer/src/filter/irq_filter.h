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

#ifndef IRQ_FILTER_H
#define IRQ_FILTER_H

#include <unordered_set>
#include "args_set.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
namespace SysTuning {
namespace TraceStreamer {
class IrqFilter : private FilterBase {
public:
    IrqFilter(TraceDataCache*, const TraceStreamerFilters*);
    IrqFilter(const IrqFilter&) = delete;
    IrqFilter& operator=(const IrqFilter&) = delete;
    ~IrqFilter() override;

public:
    void IrqHandlerEntry(int64_t ts, uint32_t cpu, DataIndex nameId);
    void IrqHandlerExit(int64_t ts, uint32_t cpu, uint32_t irq, uint32_t ret);
    void IpiHandlerEntry(int64_t ts, uint32_t cpu, DataIndex nameId);
    void IpiHandlerExit(int64_t ts, uint32_t cpu);
    void SoftIrqEntry(int64_t ts, uint32_t cpu, uint32_t vec);
    void SoftIrqExit(int64_t ts, uint32_t cpu, uint32_t vec);
    void Clear();

private:
    const DataIndex irqId_ = traceDataCache_->GetDataIndex("irq_id");
    const DataIndex irqRet_ = traceDataCache_->GetDataIndex("irq_ret");
    const DataIndex irq_ = traceDataCache_->GetDataIndex("irq");
    const DataIndex irqVec_ = traceDataCache_->GetDataIndex("vec");
    const DataIndex irqHandled_ = traceDataCache_->GetDataIndex("handled");
    const DataIndex irqUnHandled_ = traceDataCache_->GetDataIndex("unhandled");
    const DataIndex irqCatalog_ = traceDataCache_->GetDataIndex("irq");
    const DataIndex ipiCatalog_ = traceDataCache_->GetDataIndex("ipi");
    const DataIndex softIrqCatalog_ = traceDataCache_->GetDataIndex("softirq");
    std::unordered_map<uint64_t, int64_t> lastEventTs_ = {};
    std::unordered_set<uint64_t> transReplyWaitingReply_ = {};
    std::unordered_map<uint64_t, FilterId> transWaitingRcv_ = {};
    std::unordered_map<uint64_t, ArgsSet> transNoNeedReply_ = {};
    std::unordered_map<int32_t, std::string> binderFlagDescs_ = {};
    std::vector<std::string> irqActionNames_ = {"HI",           "TIMER",   "NET_TX", "NET_RX",  "BLOCK",
                                                "BLOCK_IOPOLL", "TASKLET", "SCHED",  "HRTIMER", "RCU"};
    std::vector<DataIndex> irqActionNameIds_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // IRQ_FILTER_H
