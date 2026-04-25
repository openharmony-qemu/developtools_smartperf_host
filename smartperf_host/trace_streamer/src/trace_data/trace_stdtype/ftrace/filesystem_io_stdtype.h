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

#ifndef FILESYSTEM_IO_STDTYPE_H
#define FILESYSTEM_IO_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
struct FileSystemIoRow {
    uint64_t startTime = INVALID_UINT64;
    uint64_t endTime = INVALID_UINT64;
    uint64_t duration = INVALID_UINT64;
    bool isBlock = false;
    bool isWrite = false;
    uint32_t mainDev = INVALID_UINT32;
    uint32_t subDev = INVALID_UINT32;
    uint64_t ino = INVALID_UINT64;
    uint64_t enterSize = INVALID_UINT64;
    uint64_t enterOffset = INVALID_UINT64;
    uint64_t exitOffset = INVALID_UINT64;
    uint64_t requestBytes = INVALID_UINT64;
    int64_t actualBytes = INVALID_INT64;
    DataIndex fileId = INVALID_DATAINDEX;
    uint64_t sector = INVALID_UINT64;
    uint32_t nrSector = INVALID_UINT32;
    DataIndex rwbsId = INVALID_DATAINDEX;
    DataIndex cmdId = INVALID_DATAINDEX;
    uint32_t itid = INVALID_UINT32;
    uint32_t ipid = INVALID_UINT32;
};

class FileSystemIo : public CacheBase, public BatchCacheBase {
public:
    size_t AppendFileSystemIoData(const FileSystemIoRow &fileSystemIoRow);
    const std::deque<uint64_t> &startTimesData() const
    {
        return startTimes_;
    }
    const std::deque<uint64_t> &EndTimesData() const
    {
        return endTimes_;
    }
    const std::deque<uint64_t> &DurationsData() const
    {
        return durations_;
    }
    const std::deque<bool> &IsBlocksData() const
    {
        return isBlocks_;
    }
    const std::deque<bool> &IsWritesData() const
    {
        return isWrites_;
    }
    const std::deque<uint32_t> &MainDevsData() const
    {
        return mainDevs_;
    }
    const std::deque<uint32_t> &SubDevsData() const
    {
        return subDevs_;
    }
    const std::deque<uint64_t> &InosData() const
    {
        return inos_;
    }
    const std::deque<uint64_t> &EnterSizesData() const
    {
        return enterSizes_;
    }
    const std::deque<uint64_t> &EnterOffsetsData() const
    {
        return enterOffsets_;
    }
    const std::deque<uint64_t> &ExitOffsetsData() const
    {
        return exitOffsets_;
    }
    const std::deque<uint64_t> &RequestBytesData() const
    {
        return requestBytes_;
    }
    const std::deque<int64_t> &ActualBytesData() const
    {
        return actualBytes_;
    }
    const std::deque<DataIndex> &fileIdsData() const
    {
        return fileIds_;
    }
    const std::deque<uint64_t> &SectorsData() const
    {
        return sectors_;
    }
    const std::deque<uint32_t> &NrSectorsData() const
    {
        return nrSectors_;
    }
    const std::deque<DataIndex> &RwbsIdsData() const
    {
        return rwbsIds_;
    }
    const std::deque<DataIndex> &CmdIdsData() const
    {
        return cmdIds_;
    }
    const std::deque<uint32_t> &ItidsData() const
    {
        return itids_;
    }
    const std::deque<uint32_t> &IpidsData() const
    {
        return ipids_;
    }
    void Clear() override
    {
        CacheBase::Clear();
        startTimes_.clear();
        endTimes_.clear();
        durations_.clear();
        isBlocks_.clear();
        isWrites_.clear();
        mainDevs_.clear();
        subDevs_.clear();
        inos_.clear();
        enterSizes_.clear();
        enterOffsets_.clear();
        exitOffsets_.clear();
        requestBytes_.clear();
        actualBytes_.clear();
        fileIds_.clear();
        sectors_.clear();
        nrSectors_.clear();
        rwbsIds_.clear();
        cmdIds_.clear();
        itids_.clear();
        ipids_.clear();
    }

    void ClearExportedData() override
    {
        EraseElements(ids_, itids_, ipids_, startTimes_, endTimes_, durations_, isBlocks_, isWrites_, mainDevs_,
                      subDevs_, inos_, enterSizes_, enterOffsets_, exitOffsets_, requestBytes_, actualBytes_, fileIds_,
                      sectors_, nrSectors_, rwbsIds_, cmdIds_);
    }

private:
    struct TempData {
        std::deque<uint64_t> startTimes;
        std::deque<uint64_t> endTimes;
        std::deque<uint64_t> durations;
        std::deque<bool> isBlocks;
        std::deque<bool> isWrites;
        std::deque<uint32_t> mainDevs;
        std::deque<uint32_t> subDevs;
        std::deque<uint64_t> inos;
        std::deque<uint64_t> enterSizes;
        std::deque<uint64_t> enterOffsets;
        std::deque<uint64_t> exitOffsets;
        std::deque<uint64_t> requestBytes;
        std::deque<int64_t> actualBytes;
        std::deque<DataIndex> fileIds;
        std::deque<uint64_t> sectors;
        std::deque<uint32_t> nrSectors;
        std::deque<DataIndex> rwbsIds;
        std::deque<DataIndex> cmdIds;
        std::deque<uint32_t> itids;
        std::deque<uint32_t> ipids;
    };

    std::deque<uint64_t> startTimes_;
    std::deque<uint64_t> endTimes_;
    std::deque<uint64_t> durations_;
    std::deque<bool> isBlocks_;
    std::deque<bool> isWrites_;
    std::deque<uint32_t> mainDevs_;
    std::deque<uint32_t> subDevs_;
    std::deque<uint64_t> inos_;
    std::deque<uint64_t> enterSizes_;
    std::deque<uint64_t> enterOffsets_;
    std::deque<uint64_t> exitOffsets_;
    std::deque<uint64_t> requestBytes_;
    std::deque<int64_t> actualBytes_;
    std::deque<DataIndex> fileIds_;
    std::deque<uint64_t> sectors_;
    std::deque<uint32_t> nrSectors_;
    std::deque<DataIndex> rwbsIds_;
    std::deque<DataIndex> cmdIds_;
    std::deque<uint32_t> itids_;
    std::deque<uint32_t> ipids_;
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // FILESYSTEM_IO_STDTYPE_H
