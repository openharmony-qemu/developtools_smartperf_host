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

#ifndef EBPF_SPLITTER_H
#define EBPF_SPLITTER_H
#ifndef is_linux
#include "dfx_nonlinux_define.h"
#else
#include <elf.h>
#endif
#include <string>
#include "ebpf_data_structure.h"
#include "event_parser_base.h"
#include "process_filter.h"
#include "quatra_map.h"
#include "string_help.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "unordered_map"
#include "pbreader_file_header.h"
#include "common_types.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::EbpfStdtype;
class EbpfSplitter {
public:
    void SetEbpfDataOffset(uint64_t offset);
    void SetSpliteTimeRange(uint64_t splitFileMinTs, uint64_t splitFileMaxTs);
    bool AddAndSplitEbpfData(std::deque<uint8_t> &dequeBuffer);
    void RecordEbpfProfilerHeader(uint8_t *buffer, uint32_t len)
    {
        (void)memcpy_s(&profilerHeader_, sizeof(profilerHeader_), buffer, len);
    }
    const auto &GetEbpfSplitResult()
    {
        return ebpfSplitResult_;
    }
    auto ClearEbpfSplitResult()
    {
        splittedLen_ = 0;
        usefulDataLen_ = 0;
        ebpfBuffer_.clear();
        ebpfSplitResult_.clear();
        splitEbpfHeader_ = nullptr;
        offsetOfEbpfDataInFile_ = 0;
    }

private:
    bool SplitEbpfHeader(std::deque<uint8_t> &dequeBuffer);
    void SplitEbpfBodyData(std::deque<uint8_t> &dequeBuffer);
    void AppendSplitOriginSegResult(uint32_t segLen);
    template <typename FixedHeader>
    void AppendSplitResultWithFixedHeader(uint32_t segLen, std::deque<uint8_t> &dequeBuffer, FixedHeader &fixedHeader)
    {
        std::copy_n(dequeBuffer.begin() + EBPF_TITLE_SIZE, sizeof(FixedHeader), reinterpret_cast<char *>(&fixedHeader));
        if (fixedHeader.endTime <= splitFileMaxTs_ && fixedHeader.startTime >= splitFileMinTs_) {
            AppendSplitOriginSegResult(segLen);
        }
    }
    uint64_t splittedLen_ = 0;
    uint64_t usefulDataLen_ = 0;
    std::deque<uint8_t> ebpfBuffer_;
    uint64_t offsetOfEbpfDataInFile_ = 0;
    uint64_t splitFileMinTs_ = INVALID_UINT64;
    uint64_t splitFileMaxTs_ = INVALID_UINT64;
    std::vector<HtraceSplitResult> ebpfSplitResult_;
    std::unique_ptr<EbpfDataHeader> splitEbpfHeader_;
    ProfilerTraceFileHeader profilerHeader_;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // EBPF_SPLITTER_H
