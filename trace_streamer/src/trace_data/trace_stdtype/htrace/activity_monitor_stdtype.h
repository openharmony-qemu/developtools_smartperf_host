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

#ifndef ACTIVITY_MONITOR_STDTYPE_H
#define ACTIVITY_MONITOR_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class Hidump : public CacheBase {
public:
    size_t AppendNewHidumpInfo(uint64_t timeStamp, uint32_t fps);
    const std::deque<uint32_t> &Fpss() const;
    void Clear() override;

private:
    std::deque<uint32_t> fpss_ = {};
};
struct DiskIoRow {
    uint64_t ts = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    uint64_t rd = INVALID_UINT64;
    uint64_t wr = INVALID_UINT64;
    uint64_t rdPerSec = INVALID_UINT64;
    uint64_t wrPerSec = INVALID_UINT64;
    double rdCountPerSec = 0;
    double wrCountPerSec = 0;
    uint64_t rdCount = INVALID_UINT64;
    uint64_t wrCount = INVALID_UINT64;
};

class DiskIOData : public CacheBase {
public:
    DiskIOData() = default;
    ~DiskIOData() = default;
    void AppendNewData(const DiskIoRow &diskioRow);
    const std::deque<uint64_t> &Durs() const;
    const std::deque<uint64_t> &RdDatas() const;
    const std::deque<uint64_t> &WrDatas() const;
    const std::deque<double> &RdSpeedDatas() const;
    const std::deque<double> &WrSpeedDatas() const;
    const std::deque<double> &RdCountPerSecDatas() const;
    const std::deque<double> &WrCountPerSecDatas() const;
    const std::deque<uint64_t> &RdCountDatas() const;
    const std::deque<uint64_t> &WrCountDatas() const;
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
struct LiveProcessDetailRow {
    uint64_t newTimeStamp = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    int32_t processID = INVALID_INT32;
    std::string processName = "";
    int32_t parentProcessID = INVALID_INT32;
    int32_t uid = INVALID_INT32;
    std::string userName = "";
    double cpuUsage = 0;
    int32_t pssInfo = INVALID_INT32;
    uint64_t cpuTime = INVALID_UINT64;
    int32_t threads = INVALID_INT32;
    int64_t diskWrites = INVALID_INT64;
    int64_t diskReads = INVALID_INT64;
};
class LiveProcessDetailData : public CacheBase {
public:
    size_t AppendNewData(const LiveProcessDetailRow &liveProcessDetailRow);
    const std::deque<uint64_t> &Durs() const;
    const std::deque<int32_t> &ProcessID() const;
    const std::deque<std::string> &ProcessName() const;
    const std::deque<int32_t> &ParentProcessID() const;
    const std::deque<int32_t> &Uid() const;
    const std::deque<std::string> &UserName() const;
    const std::deque<double> &CpuUsage() const;
    const std::deque<int32_t> &PssInfo() const;
    const std::deque<int32_t> &Threads() const;
    const std::deque<int64_t> &DiskWrites() const;
    const std::deque<int64_t> &DiskReads() const;
    const std::deque<uint64_t> &CpuTimes() const;
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
struct CpuUsageDetailRow {
    uint64_t newTimeStamp = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    double totalLoad = 0;
    double userLoad = 0;
    double systemLoad = 0;
    int64_t threads = INVALID_INT64;
};
class CpuUsageDetailData : public CacheBase {
public:
    size_t AppendNewData(const CpuUsageDetailRow &cpuUsageDetailRow);
    const std::deque<uint64_t> &Durs() const;
    const std::deque<double> &TotalLoad() const;
    const std::deque<double> &UserLoad() const;
    const std::deque<double> &SystemLoad() const;
    const std::deque<int64_t> &Threads() const;
    void Clear() override;

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<double> totalLoad_ = {};
    std::deque<double> userLoad_ = {};
    std::deque<double> systemLoad_ = {};
    std::deque<int64_t> threads_ = {};
};
struct NetDetailRow {
    uint64_t newTimeStamp = INVALID_UINT64;
    uint64_t tx = INVALID_UINT64;
    uint64_t rx = INVALID_UINT64;
    uint64_t dur = INVALID_UINT64;
    double rxSpeed = 0;
    double txSpeed = 0;
    uint64_t packetIn = INVALID_UINT64;
    double packetInSec = 0;
    uint64_t packetOut = INVALID_UINT64;
    double packetOutSec = 0;
    std::string netType = "";
};
class NetDetailData : public CacheBase {
public:
    size_t AppendNewNetData(const NetDetailRow &NetDetailRow);
    const std::deque<uint64_t> &Durs() const;
    const std::deque<double> &RxSpeed() const;
    const std::deque<double> &TxSpeed() const;
    const std::deque<std::string> &NetTypes() const;
    const std::deque<uint64_t> &RxDatas() const;
    const std::deque<uint64_t> &TxDatas() const;
    const std::deque<uint64_t> &PacketIn() const;
    const std::deque<double> &PacketInSec() const;
    const std::deque<uint64_t> &PacketOut() const;
    const std::deque<double> &PacketOutSec() const;
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
struct SmapsRow {
    uint64_t timeStamp = INVALID_UINT64;
    uint64_t ipid = INVALID_UINT64;
    std::string startAddr = "";
    std::string endAddr = "";
    uint64_t dirty = INVALID_UINT64;
    uint64_t swapper = INVALID_UINT64;
    uint64_t rss = INVALID_UINT64;
    uint64_t pss = INVALID_UINT64;
    uint64_t size = INVALID_UINT64;
    double reside = 0;
    DataIndex protectionId = INVALID_UINT64;
    DataIndex pathId = INVALID_UINT64;
    uint64_t sharedClean = INVALID_UINT64;
    uint64_t sharedDirty = INVALID_UINT64;
    uint64_t privateClean = INVALID_UINT64;
    uint64_t privateDirty = INVALID_UINT64;
    uint64_t swap = INVALID_UINT64;
    uint64_t swapPss = INVALID_UINT64;
    uint32_t type = INVALID_UINT32;
};

class SmapsData : public CacheBase {
public:
    void AppendNewData(const SmapsRow &smapsRow);
    const std::deque<uint64_t> &TimeStamps() const;
    const std::deque<uint64_t> &Ipids() const;
    const std::deque<std::string> &StartAddrs() const;
    const std::deque<std::string> &EndAddrs() const;
    const std::deque<uint64_t> &Dirtys() const;
    const std::deque<uint64_t> &Swappers() const;
    const std::deque<uint64_t> &Rss() const;
    const std::deque<uint64_t> &Pss() const;
    const std::deque<uint64_t> &Sizes() const;
    const std::deque<double> &Resides() const;
    const std::deque<DataIndex> &ProtectionIds() const;
    const std::deque<DataIndex> &PathIds() const;
    const std::deque<uint64_t> &SharedClean() const;
    const std::deque<uint64_t> &SharedDirty() const;
    const std::deque<uint64_t> &PrivateClean() const;
    const std::deque<uint64_t> &PrivateDirty() const;
    const std::deque<uint64_t> &Swap() const;
    const std::deque<uint64_t> &SwapPss() const;
    const std::deque<uint32_t> &Type() const;
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

struct AshMemRow {
    InternalPid ipid = INVALID_IPID;
    uint64_t ts = INVALID_UINT64;
    uint32_t adj = INVALID_UINT32;
    uint32_t fd = INVALID_UINT32;
    DataIndex ashmemNameId = INVALID_UINT64;
    uint64_t size = INVALID_UINT64;
    uint64_t pss = INVALID_UINT64;
    uint32_t ashmemId = INVALID_UINT32;
    uint64_t time = INVALID_UINT64;
    uint64_t refCount = INVALID_UINT64;
    uint64_t purged = INVALID_UINT64;
    uint32_t flag = INVALID_UINT32;
};

class AshMemData : public CacheBase {
public:
    void AppendNewData(const AshMemRow &ashMemRow);
    const std::deque<InternalPid> &Ipids() const;
    const std::deque<uint32_t> &Adjs() const;
    const std::deque<uint32_t> &Fds() const;
    const std::deque<DataIndex> &AshmemNameIds() const;
    const std::deque<uint64_t> &Sizes() const;
    const std::deque<uint64_t> &Psss() const;
    const std::deque<uint32_t> &AshmemIds() const;
    const std::deque<uint64_t> &Times() const;
    const std::deque<uint64_t> &RefCounts() const;
    const std::deque<uint64_t> &Purgeds() const;
    const std::deque<uint32_t> &Flags() const;
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

struct DmaMemRow {
    InternalPid ipid = INVALID_IPID;
    uint64_t ts = INVALID_UINT64;
    uint32_t fd = INVALID_UINT32;
    uint64_t size = INVALID_UINT64;
    uint32_t ino = INVALID_UINT32;
    uint32_t expPid = INVALID_UINT32;
    DataIndex expTaskCommId = INVALID_DATAINDEX;
    DataIndex bufNameId = INVALID_DATAINDEX;
    DataIndex expNameId = INVALID_DATAINDEX;
    uint32_t flag = INVALID_UINT32;
};

class DmaMemData : public CacheBase {
public:
    void AppendNewData(const DmaMemRow &dmaMemRow);
    const std::deque<InternalPid> &Ipids() const;
    const std::deque<uint32_t> &Fds() const;
    const std::deque<uint64_t> &Sizes() const;
    const std::deque<uint32_t> &Inos() const;
    const std::deque<uint32_t> &ExpPids() const;
    const std::deque<DataIndex> &ExpTaskCommIds() const;
    const std::deque<DataIndex> &BufNameIds() const;
    const std::deque<DataIndex> &ExpNameIds() const;
    const std::deque<uint32_t> &Flags() const;
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

struct GpuProcessMemRow {
    uint64_t ts = INVALID_UINT64;
    DataIndex gpuNameId = INVALID_DATAINDEX;
    uint64_t allGpuSize = INVALID_UINT64;
    std::string addr = "";
    InternalPid ipid = INVALID_IPID;
    InternalPid itid = INVALID_ITID;
    uint64_t usedGpuSize = INVALID_UINT64;
};
class GpuProcessMemData : public CacheBase {
public:
    void AppendNewData(const GpuProcessMemRow &gpuProcessMemRow);
    const std::deque<DataIndex> &GpuNameIds() const;
    const std::deque<uint64_t> &AllGpuSizes() const;
    const std::deque<std::string> &Addrs() const;
    const std::deque<InternalPid> &Ipids() const;
    const std::deque<InternalPid> &Itids() const;
    const std::deque<uint64_t> &UsedGpuSizes() const;
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
struct GpuWindowMemRow {
    uint64_t ts = INVALID_UINT64;
    DataIndex windowNameId = INVALID_UINT64;
    uint64_t windowId = INVALID_UINT64;
    DataIndex moduleNameId = INVALID_UINT64;
    DataIndex categoryNameId = INVALID_UINT64;
    uint64_t size = INVALID_UINT64;
    uint32_t count = INVALID_UINT32;
    uint64_t purgeableSize = INVALID_UINT64;
};
class GpuWindowMemData : public CacheBase {
public:
    void AppendNewData(const GpuWindowMemRow &gpuWindowMemRow);
    void RevicesIpid(const std::map<DataIndex, InternalPid> &windowIdToIpidMap);
    const std::deque<DataIndex> &WindowNameIds() const;
    const std::deque<uint64_t> &WindowIds() const;
    const std::deque<DataIndex> &ModuleNameIds() const;
    const std::deque<DataIndex> &CategoryNameIds() const;
    const std::deque<uint64_t> &Sizes() const;
    const std::deque<uint32_t> &Counts() const;
    const std::deque<uint64_t> &PurgeableSizes() const;
    const std::deque<InternalPid> &Ipids() const;
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
    const std::deque<uint64_t> &TotalSizes() const;
    void Clear() override;

private:
    std::deque<uint64_t> totalSizes_ = {};
};

class ProfileMemInfo : public CacheBase {
public:
    void AppendNewData(uint64_t timestamp, DataIndex channelIndex, uint64_t size);
    const std::deque<uint64_t> &ChannelIndexs() const;
    const std::deque<uint64_t> &TotalSizes() const;
    void Clear() override;

private:
    std::deque<DataIndex> channelIndexs_ = {};
    std::deque<uint64_t> totalSizes_ = {};
};
class RSImageDumpInfo : public CacheBase {
public:
    void AppendNewData(uint64_t timestamp, uint64_t memSize, DataIndex typeIndex, InternalPid ipid, DataIndex name);
    const std::deque<uint64_t> &MemSizes() const;
    const std::deque<DataIndex> &TypeIndexs() const;
    const std::deque<InternalPid> &Ipids() const;
    const std::deque<DataIndex> &SurfaceNameIndexs() const;
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
