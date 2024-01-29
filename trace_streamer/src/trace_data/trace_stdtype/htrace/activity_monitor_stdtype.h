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

#ifndef ACTIVITY_MONITOR_STDTYPE_H
#define ACTIVITY_MONITOR_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class Hidump : public CacheBase {
public:
    size_t AppendNewHidumpInfo(uint64_t timeStamp, uint32_t fps);
    const std::deque<uint32_t>& Fpss() const;
    void Clear() override;

private:
    std::deque<uint32_t> fpss_ = {};
};

class DiskIOData : public CacheBase {
public:
    DiskIOData() = default;
    ~DiskIOData() = default;
    void AppendNewData(uint64_t ts,
                       uint64_t dur,
                       uint64_t rd,
                       uint64_t wr,
                       uint64_t rdPerSec,
                       uint64_t wrPerSec,
                       double rdCountPerSec,
                       double wrCountPerSec,
                       uint64_t rdCount,
                       uint64_t wrCount);
    const std::deque<uint64_t>& Durs() const;
    const std::deque<uint64_t>& RdDatas() const;
    const std::deque<uint64_t>& WrDatas() const;
    const std::deque<double>& RdSpeedDatas() const;
    const std::deque<double>& WrSpeedDatas() const;
    const std::deque<double>& RdCountPerSecDatas() const;
    const std::deque<double>& WrCountPerSecDatas() const;
    const std::deque<uint64_t>& RdCountDatas() const;
    const std::deque<uint64_t>& WrCountDatas() const;
    void Clear() override;

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<uint64_t> rdDatas_ = {};
    std::deque<uint64_t> wrDatas_ = {};
    std::deque<double> wrPerSec_ = {};
    std::deque<double> rdPerSec_ = {};
    std::deque<double> wrCountPerSec_ = {};
    std::deque<double> rdCountPerSec_ = {};
    std::deque<uint64_t> rdCountDatas_ = {};
    std::deque<uint64_t> wrCountDatas_ = {};
};

class LiveProcessDetailData : public CacheBase {
public:
    size_t AppendNewData(uint64_t newTimeStamp,
                         uint64_t dur,
                         int32_t processID,
                         std::string processName,
                         int32_t parentProcessID,
                         int32_t uid,
                         std::string userName,
                         double cpuUsage,
                         int32_t pssInfo,
                         uint64_t cpuTime,
                         int32_t threads,
                         int64_t diskWrites,
                         int64_t diskReads);
    const std::deque<uint64_t>& Durs() const;
    const std::deque<int32_t>& ProcessID() const;
    const std::deque<std::string>& ProcessName() const;
    const std::deque<int32_t>& ParentProcessID() const;
    const std::deque<int32_t>& Uid() const;
    const std::deque<std::string>& UserName() const;
    const std::deque<double>& CpuUsage() const;
    const std::deque<int32_t>& PssInfo() const;
    const std::deque<int32_t>& Threads() const;
    const std::deque<int64_t>& DiskWrites() const;
    const std::deque<int64_t>& DiskReads() const;
    const std::deque<uint64_t>& CpuTimes() const;
    void Clear() override;

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<int32_t> processID_ = {};
    std::deque<std::string> processName_ = {};
    std::deque<int32_t> parentProcessID_ = {};
    std::deque<int32_t> uid_ = {};
    std::deque<std::string> userName_ = {};
    std::deque<double> cpuUsage_ = {};
    std::deque<int32_t> pssInfo_ = {};
    std::deque<int32_t> threads_ = {};
    std::deque<int64_t> diskWrites_ = {};
    std::deque<int64_t> diskReads_ = {};
    std::deque<uint64_t> cpuTimes_ = {};
};

class CpuUsageDetailData : public CacheBase {
public:
    size_t AppendNewData(uint64_t newTimeStamp,
                         uint64_t dur,
                         double totalLoad,
                         double userLoad,
                         double systemLoad,
                         int64_t threads);
    const std::deque<uint64_t>& Durs() const;
    const std::deque<double>& TotalLoad() const;
    const std::deque<double>& UserLoad() const;
    const std::deque<double>& SystemLoad() const;
    const std::deque<int64_t>& Threads() const;
    void Clear() override;

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<double> totalLoad_ = {};
    std::deque<double> userLoad_ = {};
    std::deque<double> systemLoad_ = {};
    std::deque<int64_t> threads_ = {};
};

class NetDetailData : public CacheBase {
public:
    size_t AppendNewNetData(uint64_t newTimeStamp,
                            uint64_t tx,
                            uint64_t rx,
                            uint64_t dur,
                            double rxSpeed,
                            double txSpeed,
                            uint64_t packetIn,
                            double packetInSec,
                            uint64_t packetOut,
                            double packetOutSec,
                            const std::string& netType);
    const std::deque<uint64_t>& Durs() const;
    const std::deque<double>& RxSpeed() const;
    const std::deque<double>& TxSpeed() const;
    const std::deque<std::string>& NetTypes() const;
    const std::deque<uint64_t>& RxDatas() const;
    const std::deque<uint64_t>& TxDatas() const;
    const std::deque<uint64_t>& PacketIn() const;
    const std::deque<double>& PacketInSec() const;
    const std::deque<uint64_t>& PacketOut() const;
    const std::deque<double>& PacketOutSec() const;
    void Clear() override;

private:
    std::deque<uint64_t> rxs_ = {};
    std::deque<uint64_t> txs_ = {};
    std::deque<uint64_t> durs_ = {};
    std::deque<double> rxSpeeds_ = {};
    std::deque<double> txSpeeds_ = {};
    std::deque<uint64_t> packetIn_ = {};
    std::deque<double> packetInSec_ = {};
    std::deque<uint64_t> packetOut_ = {};
    std::deque<double> packetOutSec_ = {};
    std::deque<std::string> netTypes_ = {};
};

class SmapsData : public CacheBase {
public:
    void AppendNewData(uint64_t timeStamp,
                       uint64_t ipid,
                       std::string startAddr,
                       std::string endAddr,
                       uint64_t dirty,
                       uint64_t swapper,
                       uint64_t rss,
                       uint64_t pss,
                       uint64_t size,
                       double reside,
                       DataIndex protectionId,
                       DataIndex pathId,
                       uint64_t sharedClean,
                       uint64_t sharedDirty,
                       uint64_t privateClean,
                       uint64_t privateDirty,
                       uint64_t swap,
                       uint64_t swapPss,
                       uint32_t type);
    const std::deque<uint64_t>& Id() const;
    const std::deque<uint64_t>& TimeStamps() const;
    const std::deque<uint64_t>& Ipids() const;
    const std::deque<std::string>& StartAddrs() const;
    const std::deque<std::string>& EndAddrs() const;
    const std::deque<uint64_t>& Dirtys() const;
    const std::deque<uint64_t>& Swappers() const;
    const std::deque<uint64_t>& Rss() const;
    const std::deque<uint64_t>& Pss() const;
    const std::deque<uint64_t>& Sizes() const;
    const std::deque<double>& Resides() const;
    const std::deque<DataIndex>& ProtectionIds() const;
    const std::deque<DataIndex>& PathIds() const;
    const std::deque<uint64_t>& SharedClean() const;
    const std::deque<uint64_t>& SharedDirty() const;
    const std::deque<uint64_t>& PrivateClean() const;
    const std::deque<uint64_t>& PrivateDirty() const;
    const std::deque<uint64_t>& Swap() const;
    const std::deque<uint64_t>& SwapPss() const;
    const std::deque<uint32_t>& Type() const;
    void Clear() override;

private:
    std::deque<uint64_t> ipids_ = {};
    std::deque<std::string> startAddrs_ = {};
    std::deque<std::string> endAddrs_ = {};
    std::deque<uint64_t> dirtys_ = {};
    std::deque<uint64_t> swappers_ = {};
    std::deque<uint64_t> rss_ = {};
    std::deque<uint64_t> pss_ = {};
    std::deque<uint64_t> sizes_ = {};
    std::deque<double> resides_ = {};
    std::deque<DataIndex> protectionIds_ = {};
    std::deque<DataIndex> pathIds_ = {};
    std::deque<uint64_t> sharedClean_ = {};
    std::deque<uint64_t> sharedDirty_ = {};
    std::deque<uint64_t> privateClean_ = {};
    std::deque<uint64_t> privateDirty_ = {};
    std::deque<uint64_t> swap_ = {};
    std::deque<uint64_t> swapPss_ = {};
    std::deque<uint32_t> type_ = {};
    uint32_t rowCount_ = 0;
};

class AshMemData : public CacheBase {
public:
    void AppendNewData(InternalPid ipid,
                       uint64_t ts,
                       uint32_t adj,
                       uint32_t fd,
                       DataIndex ashmemNameId,
                       uint64_t size,
                       uint64_t pss,
                       uint32_t ashmemId,
                       uint64_t time,
                       uint64_t refCount,
                       uint64_t purged,
                       uint32_t flag);
    const std::deque<InternalPid>& Ipids() const;
    const std::deque<uint32_t>& Adjs() const;
    const std::deque<uint32_t>& Fds() const;
    const std::deque<DataIndex>& AshmemNameIds() const;
    const std::deque<uint64_t>& Sizes() const;
    const std::deque<uint64_t>& Psss() const;
    const std::deque<uint32_t>& AshmemIds() const;
    const std::deque<uint64_t>& Times() const;
    const std::deque<uint64_t>& RefCounts() const;
    const std::deque<uint64_t>& Purgeds() const;
    const std::deque<uint32_t>& Flags() const;
    void SetFlag(uint64_t rowId, uint32_t flag);
    void Clear() override;

private:
    std::deque<InternalPid> ipids_ = {};
    std::deque<uint32_t> adjs_ = {};
    std::deque<uint32_t> fds_ = {};
    std::deque<DataIndex> ashmemNameIds_ = {};
    std::deque<uint64_t> sizes_ = {};
    std::deque<uint64_t> psss_ = {};
    std::deque<uint32_t> ashmemIds_ = {};
    std::deque<uint64_t> times_ = {};
    std::deque<uint64_t> refCounts_ = {};
    std::deque<uint64_t> purgeds_ = {};
    std::deque<uint32_t> flags_ = {};
    uint32_t rowCount_ = 0;
};

class DmaMemData : public CacheBase {
public:
    void AppendNewData(InternalPid ipid,
                       uint64_t ts,
                       uint32_t fd,
                       uint64_t size,
                       uint32_t ino,
                       uint32_t expPid,
                       DataIndex expTaskCommId,
                       DataIndex bufNameId,
                       DataIndex expNameId,
                       uint32_t flag);
    const std::deque<InternalPid>& Ipids() const;
    const std::deque<uint32_t>& Fds() const;
    const std::deque<uint64_t>& Sizes() const;
    const std::deque<uint32_t>& Inos() const;
    const std::deque<uint32_t>& ExpPids() const;
    const std::deque<DataIndex>& ExpTaskCommIds() const;
    const std::deque<DataIndex>& BufNameIds() const;
    const std::deque<DataIndex>& ExpNameIds() const;
    const std::deque<uint32_t>& Flags() const;
    void SetFlag(uint64_t rowId, uint32_t flag);
    void Clear() override;

private:
    std::deque<InternalPid> ipids_ = {};
    std::deque<uint32_t> fds_ = {};
    std::deque<uint64_t> sizes_ = {};
    std::deque<uint32_t> inos_ = {};
    std::deque<uint32_t> expPids_ = {};
    std::deque<DataIndex> expTaskCommIds_ = {};
    std::deque<DataIndex> bufNameIds_ = {};
    std::deque<DataIndex> expNameIds_ = {};
    std::deque<uint32_t> flags_ = {};
    uint32_t rowCount_ = 0;
};

class GpuProcessMemData : public CacheBase {
public:
    void AppendNewData(uint64_t ts,
                       DataIndex gpuNameId,
                       uint64_t allGpuSize,
                       std::string addr,
                       InternalPid ipid,
                       InternalPid itid,
                       uint64_t usedGpuSize);
    const std::deque<DataIndex>& GpuNameIds() const;
    const std::deque<uint64_t>& AllGpuSizes() const;
    const std::deque<std::string>& Addrs() const;
    const std::deque<InternalPid>& Ipids() const;
    const std::deque<InternalPid>& Itids() const;
    const std::deque<uint64_t>& UsedGpuSizes() const;
    void Clear() override;

private:
    std::deque<DataIndex> gpuNameIds_ = {};
    std::deque<uint64_t> allGpuSizes_ = {};
    std::deque<std::string> addrs_ = {};
    std::deque<InternalPid> ipids_ = {};
    std::deque<InternalPid> itids_ = {};
    std::deque<uint64_t> usedGpuSizes_ = {};
    uint32_t rowCount_ = 0;
};
class GpuWindowMemData : public CacheBase {
public:
    void AppendNewData(uint64_t ts,
                       DataIndex windowNameId,
                       uint64_t windowId,
                       DataIndex moduleNameId,
                       DataIndex categoryNameId,
                       uint64_t size,
                       uint32_t count,
                       uint64_t purgeableSize);
    void RevicesIpid(const std::map<DataIndex, InternalPid>& windowIdToIpidMap);
    const std::deque<DataIndex>& WindowNameIds() const;
    const std::deque<uint64_t>& WindowIds() const;
    const std::deque<DataIndex>& ModuleNameIds() const;
    const std::deque<DataIndex>& CategoryNameIds() const;
    const std::deque<uint64_t>& Sizes() const;
    const std::deque<uint32_t>& Counts() const;
    const std::deque<uint64_t>& PurgeableSizes() const;
    const std::deque<InternalPid>& Ipids() const;
    void Clear() override;

private:
    std::deque<DataIndex> windowNameIds_ = {};
    std::deque<uint64_t> windowIds_ = {};
    std::deque<DataIndex> moduleNameIds_ = {};
    std::deque<DataIndex> categoryNameIds_ = {};
    std::deque<uint64_t> sizes_ = {};
    std::deque<uint32_t> counts_ = {};
    std::deque<uint64_t> purgeableSizes_ = {};
    std::deque<InternalPid> ipids_ = {};
    uint32_t rowCount_ = 0;
};
class CpuDumpInfo : public CacheBase {
public:
    void AppendNewData(uint64_t timestamp, uint64_t size);
    const std::deque<uint64_t>& TotalSizes() const;
    void Clear() override;

private:
    std::deque<uint64_t> totalSizes_ = {};
};

class ProfileMemInfo : public CacheBase {
public:
    void AppendNewData(uint64_t timestamp, DataIndex channelIndex, uint64_t size);
    const std::deque<uint64_t>& ChannelIndexs() const;
    const std::deque<uint64_t>& TotalSizes() const;
    void Clear() override;

private:
    std::deque<DataIndex> channelIndexs_ = {};
    std::deque<uint64_t> totalSizes_ = {};
};
class RSImageDumpInfo : public CacheBase {
public:
    void AppendNewData(uint64_t timestamp, uint64_t memSize, DataIndex typeIndex, InternalPid ipid, DataIndex name);
    const std::deque<uint64_t>& MemSizes() const;
    const std::deque<DataIndex>& TypeIndexs() const;
    const std::deque<InternalPid>& Ipids() const;
    const std::deque<DataIndex>& SurfaceNameIndexs() const;
    void Clear() override;

private:
    std::deque<uint64_t> memSizes_ = {};
    std::deque<DataIndex> typeIndexs_ = {};
    std::deque<InternalPid> ipids_ = {};
    std::deque<DataIndex> surfaceNameIndexs_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // ACTIVITY_MONITOR_STDTYPE_H
