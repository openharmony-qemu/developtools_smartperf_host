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

#include "filesystem_io_stdtype.h"
#include <map>
namespace SysTuning {
namespace TraceStdtype {
size_t FileSystemIo::AppendFileSystemIoData(const FileSystemIoRow &fileSystemIoRow)
{
    ids_.emplace_back(id_++);
    startTimes_.push_back(fileSystemIoRow.startTime);
    endTimes_.push_back(fileSystemIoRow.endTime);
    durations_.push_back(fileSystemIoRow.duration);
    isBlocks_.push_back(fileSystemIoRow.isBlock);
    isWrites_.push_back(fileSystemIoRow.isWrite);
    mainDevs_.push_back(fileSystemIoRow.mainDev);
    subDevs_.push_back(fileSystemIoRow.subDev);
    inos_.push_back(fileSystemIoRow.ino);
    enterSizes_.push_back(fileSystemIoRow.enterSize);
    enterOffsets_.push_back(fileSystemIoRow.enterOffset);
    exitOffsets_.push_back(fileSystemIoRow.exitOffset);
    requestBytes_.push_back(fileSystemIoRow.requestBytes);
    actualBytes_.push_back(fileSystemIoRow.actualBytes);
    fileIds_.push_back(fileSystemIoRow.fileId);
    sectors_.push_back(fileSystemIoRow.sector);
    nrSectors_.push_back(fileSystemIoRow.nrSector);
    rwbsIds_.push_back(fileSystemIoRow.rwbsId);
    cmdIds_.push_back(fileSystemIoRow.cmdId);
    itids_.push_back(fileSystemIoRow.itid);
    ipids_.push_back(fileSystemIoRow.ipid);
    return Size() - 1;
}
} // namespace TraceStdtype
} // namespace SysTuning
