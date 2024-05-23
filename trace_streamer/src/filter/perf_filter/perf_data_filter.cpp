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
#include "perf_data_filter.h"
#include "measure_filter.h"
#include "process_filter.h"
#include "slice_filter.h"
#include "string_to_numerical.h"
namespace SysTuning {
namespace TraceStreamer {
PerfDataFilter::PerfDataFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter), fileIdToRowInFileTable_(INVALID_UINT64)
{
}
PerfDataFilter::~PerfDataFilter() = default;

size_t PerfDataFilter::AppendPerfFiles(uint64_t fileId, uint32_t serial, DataIndex symbols, DataIndex filePath)
{
    fileIds_.emplace(fileId);
    auto size = traceDataCache_->GetPerfFilesData()->AppendNewPerfFiles(fileId, serial, symbols, filePath);
    fileIdToRowInFileTable_.Insert(fileId, serial, size);
    if (!serial || serial == INVALID_UINT32) {
        fileIdToRow_.insert(std::make_pair(fileId, size));
    }
    return size;
}

void PerfDataFilter::BeforeReload()
{
    traceDataCache_->GetPerfCallChainData()->Clear();
    traceDataCache_->GetPerfFilesData()->Clear();
    fileIdToRowInFileTable_.Clear();
    fileIds_.clear();
    fileIdToRow_.clear();
}
void PerfDataFilter::Finish()
{
    auto fileIds = traceDataCache_->GetPerfCallChainData()->FileIds();
    auto ips = traceDataCache_->GetPerfCallChainData()->Ips();
    auto symbolsIds = traceDataCache_->GetPerfCallChainData()->SymbolIds();
    auto vaddrs = traceDataCache_->GetPerfCallChainData()->VaddrInFiles();
    auto size = traceDataCache_->GetPerfCallChainData()->Size();
    auto filePath = traceDataCache_->GetPerfFilesData()->FilePaths();
    auto sambols = traceDataCache_->GetPerfFilesData()->Symbols();
    uint64_t flag = 1;
    flag = ~(flag << FLAG_SHIFT_LEFT);
    for (auto i = 0; i < size; i++) {
        if (fileIds[i] == INVALID_UINT64) {
            auto nameIndex = traceDataCache_->GetDataIndex("@0x" + base::number(ips[i], base::INTEGER_RADIX_TYPE_HEX));
            traceDataCache_->GetPerfCallChainData()->SetName(i, nameIndex);
            continue;
        }
        if (vaddrs[i] == 0 || symbolsIds[i] == -1) {
            auto pathIndex = filePath[fileIdToRow_.at(fileIds[i])];
            auto fullPath = traceDataCache_->GetDataFromDict(pathIndex);
            auto iPos = fullPath.find_last_of('/');
            fullPath = fullPath.substr(iPos + 1, -1);
            auto nameIndex = traceDataCache_->GetDataIndex(fullPath + "@0x" +
                                                           base::number(ips[i] & flag, base::INTEGER_RADIX_TYPE_HEX));
            traceDataCache_->GetPerfCallChainData()->SetName(i, nameIndex);
            continue;
        }
        // if there has the file Id to which the function belongs,and the symboleid is not -1 and vaddrinfile is not -1.
        // Set the function name as the virtual address of this function
        auto value = fileIdToRowInFileTable_.Find(fileIds[i], symbolsIds[i]);
        if (value == INVALID_UINT64) {
            auto nameIndex = traceDataCache_->GetDataIndex(
                "+0x" + base::number(traceDataCache_->GetPerfCallChainData()->VaddrInFiles()[i] & flag));
            traceDataCache_->GetPerfCallChainData()->SetName(i, nameIndex);
            continue;
        }
        // The function name is not empty
        traceDataCache_->GetPerfCallChainData()->SetName(i, sambols[value]);
    }
    fileIdToRowInFileTable_.Clear();
    fileIds_.clear();
    fileIdToRow_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
