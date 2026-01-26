/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#ifndef FILESYSTEM_IO_FILTER_H
#define FILESYSTEM_IO_FILTER_H

#include "common_types.h"
#include "filter_base.h"
#include "trace_streamer_filters.h"

#include <string>
#include <vector>

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;

struct HmfsIoEnterEvent {
    uint64_t ts;
    InternalTid itid;
    uint32_t mainDev;
    uint32_t subDev;
    uint64_t ino;
    uint64_t enterSize;
    uint64_t offset;
    uint64_t requestBytes;
    DataIndex fileId;
    bool isWrite;
};

struct HmfsIoExitEvent {
    uint64_t ts;
    InternalTid itid;
    uint32_t mainDev;
    uint32_t subDev;
    uint64_t ino;
    uint64_t offset;
    uint64_t requestBytes;
    int64_t actualBytes;
    bool isWrite;
};

struct BlockIoIssueEvent {
    uint64_t ts;
    InternalTid itid;
    uint32_t mainDev;
    uint32_t subDev;
    uint64_t sector;
    uint32_t nrSector;
    uint32_t bytes;
    std::string rwbs;
    std::string cmd;
    bool isWrite;
};

struct BlockIoCompleteEvent {
    uint64_t ts;
    uint32_t mainDev;
    uint32_t subDev;
    uint64_t sector;
    uint32_t nrSector;
    int32_t error;
    std::string rwbs;
    std::string cmd;
    bool isWrite;
};

class FileSystemIoFilter : private FilterBase {
public:
    FileSystemIoFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ~FileSystemIoFilter() override;
    void ProcessReadEnter(const HmfsIoEnterEvent &params);
    void ProcessReadExit(const HmfsIoExitEvent &params);
    void ProcessWriteEnter(const HmfsIoEnterEvent &params);
    void ProcessWriteExit(const HmfsIoExitEvent &params);
    void ProcessBlockRqIssue(const BlockIoIssueEvent &params);
    void ProcessBlockRqComplete(const BlockIoCompleteEvent &params);
    void Finish();

private:
    void ProcessExit(const HmfsIoExitEvent &params);
    size_t FindBestMatchEnterEvent(const HmfsIoExitEvent &params) const;
    FileSystemIoRow CreateCompleteIoRow(const HmfsIoEnterEvent &enterEvent,
                                        uint64_t endTime,
                                        uint64_t exitOffset,
                                        int64_t res) const;
    bool IsSameBlockIoMatchKey(const BlockIoIssueEvent &pendingIssue, const BlockIoIssueEvent &params) const;
    bool IsReadWriteRwbs(const std::string &rwbs) const;
    FileSystemIoRow CreateBlockIoRow(const BlockIoIssueEvent &enterEvent,
                                     const BlockIoCompleteEvent &completeEvent) const;
    void InitBlockIoRowCommonFields(FileSystemIoRow &fileSystemIoRow) const;
    std::vector<HmfsIoEnterEvent> pendingEnterEvents_;
    std::vector<BlockIoIssueEvent> pendingBlockIssueEvents_;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FILESYSTEM_IO_FILTER_H
