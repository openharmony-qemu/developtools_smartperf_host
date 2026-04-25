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

#include "filesystem_io_filter.h"
#include "filesystem_io_stdtype.h"
#include "stat_filter.h"
#include "ts_common.h"

#include <algorithm>

namespace SysTuning {
namespace TraceStreamer {
FileSystemIoFilter::FileSystemIoFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
}

FileSystemIoFilter::~FileSystemIoFilter() {}

void FileSystemIoFilter::ProcessReadEnter(const HmfsIoEnterEvent &params)
{
    HmfsIoEnterEvent enterEvent = params;
    enterEvent.isWrite = false;
    pendingEnterEvents_.push_back(enterEvent);
}

void FileSystemIoFilter::ProcessReadExit(const HmfsIoExitEvent &params)
{
    HmfsIoExitEvent exitEvent = params;
    exitEvent.isWrite = false;
    ProcessExit(exitEvent);
}

void FileSystemIoFilter::ProcessWriteEnter(const HmfsIoEnterEvent &params)
{
    HmfsIoEnterEvent enterEvent = params;
    enterEvent.isWrite = true;
    pendingEnterEvents_.push_back(enterEvent);
}

void FileSystemIoFilter::ProcessWriteExit(const HmfsIoExitEvent &params)
{
    HmfsIoExitEvent exitEvent = params;
    exitEvent.isWrite = true;
    ProcessExit(exitEvent);
}

void FileSystemIoFilter::ProcessExit(const HmfsIoExitEvent &params)
{
    const size_t bestMatchIndex = FindBestMatchEnterEvent(params);
    if (bestMatchIndex != MAX_SIZE_T) {
        const auto &enterEvent = pendingEnterEvents_[bestMatchIndex];
        FileSystemIoRow fileSystemIoRow = CreateCompleteIoRow(enterEvent, params.ts, params.offset, params.actualBytes);
        traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(fileSystemIoRow);
        pendingEnterEvents_.erase(pendingEnterEvents_.begin() + bestMatchIndex);
    } else {
        TS_LOGD("Unmatched HmfsIoExitEvent, ts: %lu", params.ts);
    }
}

size_t FileSystemIoFilter::FindBestMatchEnterEvent(const HmfsIoExitEvent &params) const
{
    size_t bestMatchIndex = MAX_SIZE_T;
    uint64_t bestMatchTime = 0;

    for (size_t i = 0; i < pendingEnterEvents_.size(); i++) {
        const auto &enterEvent = pendingEnterEvents_[i];

        if (enterEvent.itid != params.itid || enterEvent.ts >= params.ts || enterEvent.isWrite != params.isWrite) {
            continue;
        }
        if (enterEvent.mainDev != params.mainDev || enterEvent.subDev != params.subDev ||
            enterEvent.ino != params.ino) {
            continue;
        }
        if (params.actualBytes < 0) {
            continue;
        }
        if ((enterEvent.offset + static_cast<uint64_t>(params.actualBytes)) != params.offset ||
            enterEvent.requestBytes != params.requestBytes) {
            continue;
        }

        if (bestMatchIndex == MAX_SIZE_T || enterEvent.ts > bestMatchTime) {
            bestMatchIndex = i;
            bestMatchTime = enterEvent.ts;
        }
    }

    return bestMatchIndex;
}

FileSystemIoRow FileSystemIoFilter::CreateCompleteIoRow(const HmfsIoEnterEvent &enterEvent,
                                                        uint64_t endTime,
                                                        uint64_t exitOffset,
                                                        int64_t actualBytes) const
{
    uint64_t duration =
        (endTime != INVALID_UINT64 && enterEvent.ts != INVALID_UINT64) ? (endTime - enterEvent.ts) : INVALID_UINT64;
    return {enterEvent.ts,
            endTime,
            duration,
            false,
            enterEvent.isWrite,
            enterEvent.mainDev,
            enterEvent.subDev,
            enterEvent.ino,
            enterEvent.enterSize,
            enterEvent.offset,
            exitOffset,
            enterEvent.requestBytes,
            actualBytes,
            enterEvent.fileId,
            INVALID_UINT64,
            INVALID_UINT32,
            INVALID_DATAINDEX,
            INVALID_DATAINDEX,
            enterEvent.itid,
            INVALID_UINT32};
}

void FileSystemIoFilter::ProcessBlockRqIssue(const BlockIoIssueEvent &params)
{
    if (params.nrSector == 0 || params.sector == 0 || params.sector == INVALID_UINT64) {
        return;
    }
    if (!IsReadWriteRwbs(params.rwbs)) {
        return;
    }
    for (const auto &pendingIssue : pendingBlockIssueEvents_) {
        if (IsSameBlockIoMatchKey(pendingIssue, params) && pendingIssue.itid == params.itid &&
            pendingIssue.ts > params.ts) {
            return;
        }
    }
    for (auto issueIter = pendingBlockIssueEvents_.begin(); issueIter != pendingBlockIssueEvents_.end();) {
        if (IsSameBlockIoMatchKey(*issueIter, params) && issueIter->itid == params.itid && issueIter->ts <= params.ts) {
            issueIter = pendingBlockIssueEvents_.erase(issueIter);
        } else {
            ++issueIter;
        }
    }
    pendingBlockIssueEvents_.push_back(params);
}

void FileSystemIoFilter::ProcessBlockRqComplete(const BlockIoCompleteEvent &params)
{
    if (params.nrSector == 0 || params.sector == 0 || params.sector == INVALID_UINT64) {
        return;
    }
    if (!IsReadWriteRwbs(params.rwbs)) {
        return;
    }

    std::vector<size_t> matchIndices;
    matchIndices.reserve(pendingBlockIssueEvents_.size());
    for (size_t issueIndex = 0; issueIndex < pendingBlockIssueEvents_.size(); issueIndex++) {
        const auto &issueEvent = pendingBlockIssueEvents_[issueIndex];
        if (issueEvent.ts >= params.ts) {
            continue;
        }
        if (issueEvent.mainDev != params.mainDev || issueEvent.subDev != params.subDev ||
            issueEvent.rwbs != params.rwbs || issueEvent.sector != params.sector ||
            issueEvent.nrSector != params.nrSector) {
            continue;
        }
        matchIndices.push_back(issueIndex);
    }

    if (matchIndices.empty()) {
        TS_LOGD("Unmatched BlockIoCompleteEvent, ts: %lu", params.ts);
        return;
    }

    std::sort(matchIndices.begin(), matchIndices.end(), [this](size_t lhsIndex, size_t rhsIndex) {
        return pendingBlockIssueEvents_[lhsIndex].ts < pendingBlockIssueEvents_[rhsIndex].ts;
    });
    for (size_t matchIndex : matchIndices) {
        const auto &issueEvent = pendingBlockIssueEvents_[matchIndex];
        FileSystemIoRow fileSystemIoRow = CreateBlockIoRow(issueEvent, params);
        traceDataCache_->GetFileSystemIoData()->AppendFileSystemIoData(fileSystemIoRow);
    }

    std::sort(matchIndices.begin(), matchIndices.end(),
              [](size_t lhsIndex, size_t rhsIndex) { return lhsIndex > rhsIndex; });
    for (size_t matchIndex : matchIndices) {
        pendingBlockIssueEvents_.erase(pendingBlockIssueEvents_.begin() + matchIndex);
    }
}

bool FileSystemIoFilter::IsReadWriteRwbs(const std::string &rwbs) const
{
    if (rwbs.empty()) {
        return false;
    }
    return rwbs.find('R') != std::string::npos || rwbs.find('W') != std::string::npos;
}

bool FileSystemIoFilter::IsSameBlockIoMatchKey(const BlockIoIssueEvent &pendingIssue,
                                               const BlockIoIssueEvent &params) const
{
    return pendingIssue.mainDev == params.mainDev && pendingIssue.subDev == params.subDev &&
           pendingIssue.rwbs == params.rwbs && pendingIssue.sector == params.sector &&
           pendingIssue.nrSector == params.nrSector;
}

void FileSystemIoFilter::InitBlockIoRowCommonFields(FileSystemIoRow &fileSystemIoRow) const
{
    fileSystemIoRow.ino = INVALID_UINT64;
    fileSystemIoRow.enterSize = INVALID_UINT64;
    fileSystemIoRow.enterOffset = INVALID_UINT64;
    fileSystemIoRow.exitOffset = INVALID_UINT64;
    fileSystemIoRow.actualBytes = INVALID_INT64;
    fileSystemIoRow.fileId = INVALID_DATAINDEX;
}

FileSystemIoRow FileSystemIoFilter::CreateBlockIoRow(const BlockIoIssueEvent &enterEvent,
                                                     const BlockIoCompleteEvent &completeEvent) const
{
    uint64_t duration = (completeEvent.ts != INVALID_UINT64 && enterEvent.ts != INVALID_UINT64)
                            ? (completeEvent.ts - enterEvent.ts)
                            : INVALID_UINT64;
    FileSystemIoRow fileSystemIoRow = {enterEvent.ts,      completeEvent.ts,   duration,         true,
                                       enterEvent.isWrite, enterEvent.mainDev, enterEvent.subDev};
    InitBlockIoRowCommonFields(fileSystemIoRow);
    fileSystemIoRow.requestBytes = enterEvent.bytes;
    DataIndex rwbsId = traceDataCache_->GetDataIndex(enterEvent.rwbs);
    fileSystemIoRow.sector = enterEvent.sector;
    fileSystemIoRow.nrSector = enterEvent.nrSector;
    fileSystemIoRow.rwbsId = rwbsId;
    DataIndex cmdId = INVALID_DATAINDEX;
    if (!enterEvent.cmd.empty()) {
        cmdId = traceDataCache_->GetDataIndex(enterEvent.cmd);
    } else if (!completeEvent.cmd.empty()) {
        cmdId = traceDataCache_->GetDataIndex(completeEvent.cmd);
    }
    fileSystemIoRow.cmdId = cmdId;
    fileSystemIoRow.itid = enterEvent.itid;
    fileSystemIoRow.ipid = INVALID_UINT32;
    return fileSystemIoRow;
}

void FileSystemIoFilter::Finish()
{
    pendingEnterEvents_.clear();
    pendingBlockIssueEvents_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
