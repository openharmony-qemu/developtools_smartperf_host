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

#include "symbols_filter.h"
#include <cstdint>
#include <limits>
#include <optional>

#include "log.h"
#include "measure_filter.h"
#include "process_filter.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
SymbolsFilter::SymbolsFilter(TraceDataCache* dataCache, const TraceStreamerFilters* filter)
    : FilterBase(dataCache, filter)
{
}

SymbolsFilter::~SymbolsFilter() = default;
void SymbolsFilter::RegisterFunc(uint64_t addr, DataIndex funcNameDictIndex)
{
    if (symbolsMap_.find(addr) == symbolsMap_.end()) {
        symbolsMap_.insert(std::make_pair(addr, funcNameDictIndex));
        traceDataCache_->GetSymbolsData()->InsertSymbol(funcNameDictIndex, addr);
    } else {
        symbolsMap_.at(addr) = funcNameDictIndex;
    }
}

const DataIndex& SymbolsFilter::GetFunc(uint64_t addr) const
{
    if (symbolsMap_.find(addr) == symbolsMap_.end()) {
        auto lastAddr = symbolsMap_.lower_bound(addr);
        if (lastAddr == symbolsMap_.end()) {
            return INVALID_UINT64;
        }
        return lastAddr->second;
    } else {
        return symbolsMap_.at(addr);
    }
}
void SymbolsFilter::Clear()
{
    symbolsMap_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
