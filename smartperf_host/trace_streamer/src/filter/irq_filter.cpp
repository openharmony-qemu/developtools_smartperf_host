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
#include "irq_filter.h"
#include "measure_filter.h"
#include "process_filter.h"
#include "slice_filter.h"
#include "string_to_numerical.h"
namespace SysTuning {
namespace TraceStreamer {
IrqFilter::IrqFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter) : FilterBase(dataCache, filter)
{
    for (size_t i = 0; i < irqActionNames_.size(); i++) {
        irqActionNameIds_.push_back(traceDataCache_->GetDataIndex(irqActionNames_[i]));
    }
}
IrqFilter::~IrqFilter() = default;

void IrqFilter::IrqHandlerEntry(int64_t ts, uint32_t cpu, DataIndex nameId)
{
    streamFilters_->sliceFilter_->IrqHandlerEntry(ts, cpu, irqCatalog_, nameId);
}
void IrqFilter::IrqHandlerExit(int64_t ts, uint32_t cpu, uint32_t irq, uint32_t ret)
{
    DataIndex irqRet = INVALID_DATAINDEX;
    if (ret == 1) {
        irqRet = irqHandled_;
    } else {
        irqRet = irqUnHandled_;
    }
    ArgsSet args;
    args.AppendArg(irqRet_, BASE_DATA_TYPE_STRING, irqRet);
    args.AppendArg(irq_, BASE_DATA_TYPE_INT, irq);
    streamFilters_->sliceFilter_->IrqHandlerExit(ts, cpu, args);
}

void IrqFilter::IpiHandlerEntry(int64_t ts, uint32_t cpu, DataIndex nameId)
{
    streamFilters_->sliceFilter_->IpiHandlerEntry(ts, cpu, ipiCatalog_, nameId);
}
void IrqFilter::IpiHandlerExit(int64_t ts, uint32_t cpu)
{
    streamFilters_->sliceFilter_->IpiHandlerExit(ts, cpu);
}
void IrqFilter::SoftIrqEntry(int64_t ts, uint32_t cpu, uint32_t vec)
{
    if (vec >= irqActionNames_.size()) {
        return;
    }
    streamFilters_->sliceFilter_->SoftIrqEntry(ts, cpu, softIrqCatalog_, irqActionNameIds_[vec]);
}
void IrqFilter::SoftIrqExit(int64_t ts, uint32_t cpu, uint32_t vec)
{
    if (vec >= irqActionNames_.size()) {
        traceDataCache_->GetStatAndInfo()->IncreaseStat(TRACE_EVENT_SOFTIRQ_EXIT, STAT_EVENT_NOTMATCH);
        return;
    }
    ArgsSet args;
    args.AppendArg(irqRet_, BASE_DATA_TYPE_STRING, irqActionNameIds_[vec]);
    args.AppendArg(irqVec_, BASE_DATA_TYPE_INT, vec);
    streamFilters_->sliceFilter_->SoftIrqExit(ts, cpu, args);
    return;
}
void IrqFilter::Clear()
{
    lastEventTs_.clear();
    transReplyWaitingReply_.clear();
    transWaitingRcv_.clear();
    transNoNeedReply_.clear();
    binderFlagDescs_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
