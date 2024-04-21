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
#include "activity_monitor_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t Hidump::AppendNewHidumpInfo(uint64_t timeStamp, uint32_t fps)
{
    timeStamps_.emplace_back(timeStamp);
    fpss_.emplace_back(fps);
    return Size() - 1;
}
const std::deque<uint32_t> &Hidump::Fpss() const
{
    return fpss_;
}
void Hidump::Clear()
{
    CacheBase::Clear();
    fpss_.clear();
}

void DiskIOData::AppendNewData(const DiskIoRow &diskioRow)
{
    timeStamps_.emplace_back(diskioRow.ts);
    durs_.emplace_back(diskioRow.dur);
    rdDatas_.emplace_back(diskioRow.rd);
    wrDatas_.emplace_back(diskioRow.wr);
    rdPerSec_.emplace_back(diskioRow.rdPerSec);
    wrPerSec_.emplace_back(diskioRow.wrPerSec);
    rdCountPerSec_.emplace_back(diskioRow.rdCountPerSec);
    wrCountPerSec_.emplace_back(diskioRow.wrCountPerSec);
    rdCountDatas_.emplace_back(diskioRow.rdCount);
    wrCountDatas_.emplace_back(diskioRow.wrCount);
}
const std::deque<uint64_t> &DiskIOData::Durs() const
{
    return durs_;
}
const std::deque<uint64_t> &DiskIOData::RdDatas() const
{
    return rdDatas_;
}
const std::deque<uint64_t> &DiskIOData::WrDatas() const
{
    return wrDatas_;
}
const std::deque<double> &DiskIOData::RdSpeedDatas() const
{
    return rdPerSec_;
}
const std::deque<double> &DiskIOData::WrSpeedDatas() const
{
    return wrPerSec_;
}

const std::deque<double> &DiskIOData::RdCountPerSecDatas() const
{
    return rdCountPerSec_;
}
const std::deque<double> &DiskIOData::WrCountPerSecDatas() const
{
    return wrCountPerSec_;
}
const std::deque<uint64_t> &DiskIOData::RdCountDatas() const
{
    return rdCountDatas_;
}
const std::deque<uint64_t> &DiskIOData::WrCountDatas() const
{
    return wrCountDatas_;
}
void DiskIOData::Clear()
{
    CacheBase::Clear();
    durs_.clear();
    rdDatas_.clear();
    wrDatas_.clear();
    wrPerSec_.clear();
    rdPerSec_.clear();
    wrCountPerSec_.clear();
    rdCountPerSec_.clear();
    rdCountDatas_.clear();
    wrCountDatas_.clear();
}
size_t LiveProcessDetailData::AppendNewData(const LiveProcessDetailRow &liveProcessDetailRow)
{
    timeStamps_.emplace_back(liveProcessDetailRow.newTimeStamp);
    durs_.emplace_back(liveProcessDetailRow.dur);
    processID_.emplace_back(liveProcessDetailRow.processID);
    processName_.emplace_back(liveProcessDetailRow.processName);
    parentProcessID_.emplace_back(liveProcessDetailRow.parentProcessID);
    uid_.emplace_back(liveProcessDetailRow.uid);
    userName_.emplace_back(liveProcessDetailRow.userName);
    cpuUsage_.emplace_back(liveProcessDetailRow.cpuUsage);
    pssInfo_.emplace_back(liveProcessDetailRow.pssInfo);
    threads_.emplace_back(liveProcessDetailRow.threads);
    diskWrites_.emplace_back(liveProcessDetailRow.diskWrites);
    diskReads_.emplace_back(liveProcessDetailRow.diskReads);
    cpuTimes_.emplace_back(liveProcessDetailRow.cpuTime);
    return Size() - 1;
}
const std::deque<uint64_t> &LiveProcessDetailData::Durs() const
{
    return durs_;
}
const std::deque<int32_t> &LiveProcessDetailData::ProcessID() const
{
    return processID_;
}
const std::deque<std::string> &LiveProcessDetailData::ProcessName() const
{
    return processName_;
}
const std::deque<int32_t> &LiveProcessDetailData::ParentProcessID() const
{
    return parentProcessID_;
}
const std::deque<int32_t> &LiveProcessDetailData::Uid() const
{
    return uid_;
}
const std::deque<std::string> &LiveProcessDetailData::UserName() const
{
    return userName_;
}
const std::deque<double> &LiveProcessDetailData::CpuUsage() const
{
    return cpuUsage_;
}
const std::deque<int32_t> &LiveProcessDetailData::PssInfo() const
{
    return pssInfo_;
}
const std::deque<int32_t> &LiveProcessDetailData::Threads() const
{
    return threads_;
}
const std::deque<int64_t> &LiveProcessDetailData::DiskWrites() const
{
    return diskWrites_;
}
const std::deque<int64_t> &LiveProcessDetailData::DiskReads() const
{
    return diskReads_;
}

const std::deque<uint64_t> &LiveProcessDetailData::CpuTimes() const
{
    return cpuTimes_;
}
void LiveProcessDetailData::Clear()
{
    CacheBase::Clear();
    durs_.clear();
    processID_.clear();
    processName_.clear();
    parentProcessID_.clear();
    uid_.clear();
    userName_.clear();
    cpuUsage_.clear();
    pssInfo_.clear();
    threads_.clear();
    diskWrites_.clear();
    diskReads_.clear();
}

size_t CpuUsageDetailData::AppendNewData(const CpuUsageDetailRow &cpuUsageDetailRow)
{
    timeStamps_.emplace_back(cpuUsageDetailRow.newTimeStamp);
    durs_.emplace_back(cpuUsageDetailRow.dur);
    totalLoad_.emplace_back(cpuUsageDetailRow.totalLoad);
    userLoad_.emplace_back(cpuUsageDetailRow.userLoad);
    systemLoad_.emplace_back(cpuUsageDetailRow.systemLoad);
    threads_.emplace_back(cpuUsageDetailRow.threads);
    return Size() - 1;
}
const std::deque<uint64_t> &CpuUsageDetailData::Durs() const
{
    return durs_;
}
const std::deque<double> &CpuUsageDetailData::TotalLoad() const
{
    return totalLoad_;
}
const std::deque<double> &CpuUsageDetailData::UserLoad() const
{
    return userLoad_;
}
const std::deque<double> &CpuUsageDetailData::SystemLoad() const
{
    return systemLoad_;
}
const std::deque<int64_t> &CpuUsageDetailData::Threads() const
{
    return threads_;
}
void CpuUsageDetailData::Clear()
{
    CacheBase::Clear();
    durs_.clear();
    totalLoad_.clear();
    userLoad_.clear();
    systemLoad_.clear();
    threads_.clear();
}

size_t NetDetailData::AppendNewNetData(const NetDetailRow &netDetailRow)
{
    timeStamps_.emplace_back(netDetailRow.newTimeStamp);
    txs_.emplace_back(netDetailRow.tx);
    rxs_.emplace_back(netDetailRow.rx);
    durs_.emplace_back(netDetailRow.dur);
    txSpeeds_.emplace_back(netDetailRow.txSpeed);
    rxSpeeds_.emplace_back(netDetailRow.rxSpeed);
    netTypes_.emplace_back(netDetailRow.netType);
    packetIn_.emplace_back(netDetailRow.packetIn);
    packetInSec_.emplace_back(netDetailRow.packetInSec);
    packetOut_.emplace_back(netDetailRow.packetOut);
    packetOutSec_.emplace_back(netDetailRow.packetOutSec);
    return Size() - 1;
}
const std::deque<uint64_t> &NetDetailData::Durs() const
{
    return durs_;
}
const std::deque<double> &NetDetailData::RxSpeed() const
{
    return rxSpeeds_;
}
const std::deque<double> &NetDetailData::TxSpeed() const
{
    return txSpeeds_;
}
const std::deque<std::string> &NetDetailData::NetTypes() const
{
    return netTypes_;
}
const std::deque<uint64_t> &NetDetailData::RxDatas() const
{
    return rxs_;
}
const std::deque<uint64_t> &NetDetailData::TxDatas() const
{
    return txs_;
}
const std::deque<uint64_t> &NetDetailData::PacketIn() const
{
    return packetIn_;
}
const std::deque<double> &NetDetailData::PacketInSec() const
{
    return packetInSec_;
}
const std::deque<uint64_t> &NetDetailData::PacketOut() const
{
    return packetOut_;
}
const std::deque<double> &NetDetailData::PacketOutSec() const
{
    return packetOutSec_;
}
void NetDetailData::Clear()
{
    CacheBase::Clear();
    durs_.clear();
    rxSpeeds_.clear();
    txSpeeds_.clear();
    netTypes_.clear();
    packetIn_.clear();
    packetInSec_.clear();
    packetOut_.clear();
    packetOutSec_.clear();
}
void SmapsData::AppendNewData(const SmapsRow &smapsRow)
{
    timeStamps_.emplace_back(smapsRow.timeStamp);
    ipids_.emplace_back(smapsRow.ipid);
    startAddrs_.emplace_back(smapsRow.startAddr);
    endAddrs_.emplace_back(smapsRow.endAddr);
    dirtys_.emplace_back(smapsRow.dirty);
    swappers_.emplace_back(smapsRow.swapper);
    rss_.emplace_back(smapsRow.rss);
    pss_.emplace_back(smapsRow.pss);
    sizes_.emplace_back(smapsRow.size);
    resides_.emplace_back(smapsRow.reside);
    protectionIds_.emplace_back(smapsRow.protectionId);
    pathIds_.emplace_back(smapsRow.pathId);
    sharedClean_.emplace_back(smapsRow.sharedClean);
    sharedDirty_.emplace_back(smapsRow.sharedDirty);
    privateClean_.emplace_back(smapsRow.privateClean);
    privateDirty_.emplace_back(smapsRow.privateDirty);
    swap_.emplace_back(smapsRow.swap);
    swapPss_.emplace_back(smapsRow.swapPss);
    type_.emplace_back(smapsRow.type);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<uint64_t> &SmapsData::TimeStamps() const
{
    return timeStamps_;
}
const std::deque<uint64_t> &SmapsData::Ipids() const
{
    return ipids_;
}
const std::deque<std::string> &SmapsData::StartAddrs() const
{
    return startAddrs_;
}
const std::deque<std::string> &SmapsData::EndAddrs() const
{
    return endAddrs_;
}
const std::deque<uint64_t> &SmapsData::Dirtys() const
{
    return dirtys_;
}
const std::deque<uint64_t> &SmapsData::Swappers() const
{
    return swappers_;
}
const std::deque<uint64_t> &SmapsData::Rss() const
{
    return rss_;
}
const std::deque<uint64_t> &SmapsData::Pss() const
{
    return pss_;
}
const std::deque<uint64_t> &SmapsData::Sizes() const
{
    return sizes_;
}
const std::deque<double> &SmapsData::Resides() const
{
    return resides_;
}
const std::deque<DataIndex> &SmapsData::ProtectionIds() const
{
    return protectionIds_;
}
const std::deque<DataIndex> &SmapsData::PathIds() const
{
    return pathIds_;
}
const std::deque<uint64_t> &SmapsData::SharedClean() const
{
    return sharedClean_;
}
const std::deque<uint64_t> &SmapsData::SharedDirty() const
{
    return sharedDirty_;
}
const std::deque<uint64_t> &SmapsData::PrivateClean() const
{
    return privateClean_;
}
const std::deque<uint64_t> &SmapsData::PrivateDirty() const
{
    return privateDirty_;
}
const std::deque<uint64_t> &SmapsData::Swap() const
{
    return swap_;
}
const std::deque<uint64_t> &SmapsData::SwapPss() const
{
    return swapPss_;
}
const std::deque<uint32_t> &SmapsData::Type() const
{
    return type_;
}
void SmapsData::Clear()
{
    CacheBase::Clear();
    ipids_.clear();
    startAddrs_.clear();
    endAddrs_.clear();
    dirtys_.clear();
    swappers_.clear();
    rss_.clear();
    pss_.clear();
    sizes_.clear();
    resides_.clear();
    protectionIds_.clear();
    pathIds_.clear();
    sharedClean_.clear();
    sharedDirty_.clear();
    privateClean_.clear();
    privateDirty_.clear();
    swap_.clear();
    swapPss_.clear();
    type_.clear();
}
void AshMemData::AppendNewData(const AshMemRow &ashMemRow)
{
    ipids_.emplace_back(ashMemRow.ipid);
    timeStamps_.emplace_back(ashMemRow.ts);
    adjs_.emplace_back(ashMemRow.adj);
    fds_.emplace_back(ashMemRow.fd);
    ashmemNameIds_.emplace_back(ashMemRow.ashmemNameId);
    sizes_.emplace_back(ashMemRow.size);
    psss_.emplace_back(ashMemRow.pss);
    ashmemIds_.emplace_back(ashMemRow.ashmemId);
    times_.emplace_back(ashMemRow.time);
    refCounts_.emplace_back(ashMemRow.refCount);
    purgeds_.emplace_back(ashMemRow.purged);
    flags_.emplace_back(ashMemRow.flag);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
void AshMemData::SetFlag(uint64_t rowId, uint32_t flag)
{
    flags_[rowId] = flag;
}
const std::deque<InternalPid> &AshMemData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> &AshMemData::Adjs() const
{
    return adjs_;
}
const std::deque<uint32_t> &AshMemData::Fds() const
{
    return fds_;
}
const std::deque<DataIndex> &AshMemData::AshmemNameIds() const
{
    return ashmemNameIds_;
}
const std::deque<uint64_t> &AshMemData::Sizes() const
{
    return sizes_;
}
const std::deque<uint64_t> &AshMemData::Psss() const
{
    return psss_;
}
const std::deque<uint32_t> &AshMemData::AshmemIds() const
{
    return ashmemIds_;
}
const std::deque<uint64_t> &AshMemData::Times() const
{
    return times_;
}
const std::deque<uint64_t> &AshMemData::RefCounts() const
{
    return refCounts_;
}
const std::deque<uint64_t> &AshMemData::Purgeds() const
{
    return purgeds_;
}
const std::deque<uint32_t> &AshMemData::Flags() const
{
    return flags_;
}
void AshMemData::Clear()
{
    CacheBase::Clear();
    ipids_.clear();
    adjs_.clear();
    fds_.clear();
    ashmemNameIds_.clear();
    sizes_.clear();
    psss_.clear();
    ashmemIds_.clear();
    times_.clear();
    refCounts_.clear();
    purgeds_.clear();
    flags_.clear();
}
void DmaMemData::AppendNewData(const DmaMemRow &dmaMemRow)
{
    ipids_.emplace_back(dmaMemRow.ipid);
    timeStamps_.emplace_back(dmaMemRow.ts);
    fds_.emplace_back(dmaMemRow.fd);
    sizes_.emplace_back(dmaMemRow.size);
    inos_.emplace_back(dmaMemRow.ino);
    expPids_.emplace_back(dmaMemRow.expPid);
    expTaskCommIds_.emplace_back(dmaMemRow.expTaskCommId);
    bufNameIds_.emplace_back(dmaMemRow.bufNameId);
    expNameIds_.emplace_back(dmaMemRow.expNameId);
    flags_.emplace_back(dmaMemRow.flag);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
void DmaMemData::SetFlag(uint64_t rowId, uint32_t flag)
{
    flags_[rowId] = flag;
}
const std::deque<InternalPid> &DmaMemData::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> &DmaMemData::Fds() const
{
    return fds_;
}
const std::deque<uint64_t> &DmaMemData::Sizes() const
{
    return sizes_;
}
const std::deque<uint32_t> &DmaMemData::Inos() const
{
    return inos_;
}
const std::deque<uint32_t> &DmaMemData::ExpPids() const
{
    return expPids_;
}
const std::deque<DataIndex> &DmaMemData::ExpTaskCommIds() const
{
    return expTaskCommIds_;
}
const std::deque<DataIndex> &DmaMemData::BufNameIds() const
{
    return bufNameIds_;
}
const std::deque<DataIndex> &DmaMemData::ExpNameIds() const
{
    return expNameIds_;
}
const std::deque<uint32_t> &DmaMemData::Flags() const
{
    return flags_;
}
void DmaMemData::Clear()
{
    CacheBase::Clear();
    ipids_.clear();
    fds_.clear();
    sizes_.clear();
    inos_.clear();
    expPids_.clear();
    expTaskCommIds_.clear();
    bufNameIds_.clear();
    expNameIds_.clear();
    flags_.clear();
}

void GpuProcessMemData::AppendNewData(const GpuProcessMemRow &gpuProcessMemRow)
{
    timeStamps_.emplace_back(gpuProcessMemRow.ts);
    gpuNameIds_.emplace_back(gpuProcessMemRow.gpuNameId);
    allGpuSizes_.emplace_back(gpuProcessMemRow.allGpuSize);
    addrs_.emplace_back(gpuProcessMemRow.addr);
    ipids_.emplace_back(gpuProcessMemRow.ipid);
    itids_.emplace_back(gpuProcessMemRow.itid);
    usedGpuSizes_.emplace_back(gpuProcessMemRow.usedGpuSize);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<DataIndex> &GpuProcessMemData::GpuNameIds() const
{
    return gpuNameIds_;
}
const std::deque<uint64_t> &GpuProcessMemData::AllGpuSizes() const
{
    return allGpuSizes_;
}
const std::deque<std::string> &GpuProcessMemData::Addrs() const
{
    return addrs_;
}
const std::deque<InternalPid> &GpuProcessMemData::Ipids() const
{
    return ipids_;
}
const std::deque<InternalPid> &GpuProcessMemData::Itids() const
{
    return itids_;
}
const std::deque<uint64_t> &GpuProcessMemData::UsedGpuSizes() const
{
    return usedGpuSizes_;
}
void GpuProcessMemData::Clear()
{
    CacheBase::Clear();
    gpuNameIds_.clear();
    allGpuSizes_.clear();
    addrs_.clear();
    ipids_.clear();
    itids_.clear();
    usedGpuSizes_.clear();
}
void GpuWindowMemData::AppendNewData(const GpuWindowMemRow &gpuWindowMemRow)
{
    timeStamps_.emplace_back(gpuWindowMemRow.ts);
    windowNameIds_.emplace_back(gpuWindowMemRow.windowNameId);
    windowIds_.emplace_back(gpuWindowMemRow.windowId);
    moduleNameIds_.emplace_back(gpuWindowMemRow.moduleNameId);
    categoryNameIds_.emplace_back(gpuWindowMemRow.categoryNameId);
    sizes_.emplace_back(gpuWindowMemRow.size);
    counts_.emplace_back(gpuWindowMemRow.count);
    purgeableSizes_.emplace_back(gpuWindowMemRow.purgeableSize);
    ipids_.emplace_back(INVALID_IPID);
    ids_.emplace_back(rowCount_);
    rowCount_++;
}
const std::deque<DataIndex> &GpuWindowMemData::WindowNameIds() const
{
    return windowNameIds_;
}
const std::deque<uint64_t> &GpuWindowMemData::WindowIds() const
{
    return windowIds_;
}
const std::deque<DataIndex> &GpuWindowMemData::ModuleNameIds() const
{
    return moduleNameIds_;
}
const std::deque<DataIndex> &GpuWindowMemData::CategoryNameIds() const
{
    return categoryNameIds_;
}
const std::deque<uint64_t> &GpuWindowMemData::Sizes() const
{
    return sizes_;
}
const std::deque<uint32_t> &GpuWindowMemData::Counts() const
{
    return counts_;
}
const std::deque<uint64_t> &GpuWindowMemData::PurgeableSizes() const
{
    return purgeableSizes_;
}
const std::deque<InternalPid> &GpuWindowMemData::Ipids() const
{
    return ipids_;
}
void GpuWindowMemData::Clear()
{
    CacheBase::Clear();
    windowNameIds_.clear();
    windowIds_.clear();
    moduleNameIds_.clear();
    categoryNameIds_.clear();
    sizes_.clear();
    counts_.clear();
    purgeableSizes_.clear();
    ipids_.clear();
}
void GpuWindowMemData::RevicesIpid(const std::map<DataIndex, InternalPid> &windowIdToIpidMap)
{
    for (auto i = 0; i < Size(); i++) {
        if (windowIdToIpidMap.count(windowNameIds_[i])) {
            ipids_[i] = windowIdToIpidMap.at(windowNameIds_[i]);
        }
    }
}

void CpuDumpInfo::AppendNewData(uint64_t timestamp, uint64_t size)
{
    timeStamps_.emplace_back(timestamp);
    totalSizes_.emplace_back(size);
    ids_.emplace_back(Size());
}
const std::deque<uint64_t> &CpuDumpInfo::TotalSizes() const
{
    return totalSizes_;
}
void CpuDumpInfo::Clear()
{
    CacheBase::Clear();
    totalSizes_.clear();
}

void ProfileMemInfo::AppendNewData(uint64_t timestamp, DataIndex channelIndex, uint64_t size)
{
    timeStamps_.emplace_back(timestamp);
    totalSizes_.emplace_back(size);
    channelIndexs_.emplace_back(channelIndex);
    ids_.emplace_back(Size());
}
const std::deque<uint64_t> &ProfileMemInfo::ChannelIndexs() const
{
    return channelIndexs_;
}
const std::deque<uint64_t> &ProfileMemInfo::TotalSizes() const
{
    return totalSizes_;
}
void ProfileMemInfo::Clear()
{
    CacheBase::Clear();
    channelIndexs_.clear();
    totalSizes_.clear();
}

void RSImageDumpInfo::AppendNewData(uint64_t timestamp,
                                    uint64_t memSize,
                                    DataIndex typeIndex,
                                    InternalPid ipid,
                                    DataIndex name)
{
    timeStamps_.emplace_back(timestamp);
    memSizes_.emplace_back(memSize);
    typeIndexs_.emplace_back(typeIndex);
    ipids_.emplace_back(ipid);
    surfaceNameIndexs_.emplace_back(name);
    ids_.emplace_back(Size());
}
const std::deque<uint64_t> &RSImageDumpInfo::MemSizes() const
{
    return memSizes_;
}
const std::deque<DataIndex> &RSImageDumpInfo::TypeIndexs() const
{
    return typeIndexs_;
}
const std::deque<InternalPid> &RSImageDumpInfo::Ipids() const
{
    return ipids_;
}
const std::deque<DataIndex> &RSImageDumpInfo::SurfaceNameIndexs() const
{
    return surfaceNameIndexs_;
}
void RSImageDumpInfo::Clear()
{
    CacheBase::Clear();
    memSizes_.clear();
    typeIndexs_.clear();
    ipids_.clear();
    surfaceNameIndexs_.clear();
}
} // namespace TraceStdtype
} // namespace SysTuning
