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
#include "pbreader_mem_parser.h"
#include "clock_filter_ex.h"
#include "measure_filter.h"
#include "memory_plugin_common.pbreader.h"
#include "memory_plugin_config.pbreader.h"
#include "memory_plugin_result.pbreader.h"
#include "process_filter.h"
#include "stat_filter.h"
#include "system_event_measure_filter.h"

namespace SysTuning {
namespace TraceStreamer {
std::vector<std::string> g_unknownAnonMemInfo = {
    "[anon]",
    "[anon:libwebview reservation]",
    "[anon:atexit handlers]",
    "[anon:cfi shadow]",
    "[anon:thread signal stack]",
    "[anon:bionic_alloc_small_objects]",
    "[anon:bionic_alloc_lob]",
    "[anon:linker_alloc]",
    "[anon:System property context nodes]",
    "[anon:arc4random data]",
};
std::map<std::string, uint32_t> g_checkMemStart = {
    {"[stack", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_STACK},
    {"[anon:stack_and_tls:", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_STACK},
    {"[anon:stack:", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_STACK},
    {"[anon:signal_stack:", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_STACK},
    {"[anon:maple_alloc_ros]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-allocspace", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-main space", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-large object", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-free list large", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-non moving", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-zygote space", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:dalvik-", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JAVA_VM},
    {"/dev/ashmem/jit-zygote-cache", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JAVA_VM},
    {"/memfd:jit-cache", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JAVA_VM},
    {"/memfd:jit-zygote-cache", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JAVA_VM},
    {"[heap]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"[anon:libc_malloc", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"[anon:scudo", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"[anon:GWP-Asan", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
};
std::map<std::string, uint32_t> g_checkMemEnd = {
    {".art", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {".art]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {".tty", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_FONT},
};
std::map<std::string, uint32_t> g_checkMemContain = {
    {"[anon:ArkJS Heap]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_JS_HEAP},
    {"[anon:native_heap:jemalloc]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"[heap]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"[anon:native_heap:musl]", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP},
    {"/dev/ashmem/", (uint32_t)PbreaderMemParser::SmapsMemType::SMAPS_MEM_TYPE_ASHMEM},
};
PbreaderMemParser::PbreaderMemParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx)
{
    for (auto i = 0; i < MEM_MAX; i++) {
        memNameDictMap_.insert(
            std::make_pair(static_cast<MemInfoType>(i),
                           traceDataCache_->GetDataIndex(config_.memNameMap_.at(static_cast<MemInfoType>(i)))));
    }
    for (auto i = 0; i < ProtoReader::PMEM_PINED_PURG + 1; i++) {
        sysMemNameDictMap_.insert(std::make_pair(i, traceDataCache_->GetDataIndex(config_.sysMemNameMap_.at(i))));
    }
    for (auto i = 0; i < ProtoReader::VMEMINFO_WORKINGSET_RESTORE + 1; i++) {
        sysVMemNameDictMap_.insert(
            std::make_pair(i, traceDataCache_->GetDataIndex(config_.sysVirtualMemNameMap_.at(i))));
    }
}

PbreaderMemParser::~PbreaderMemParser()
{
    TS_LOGI("mem ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}
void PbreaderMemParser::Parse(PbreaderDataSegment &seg, uint64_t timeStamp, BuiltinClocks clock)
{
    ProtoReader::MemoryData_Reader memData(seg.protoData.data_, seg.protoData.size_);
    auto newTimeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(clock, timeStamp);
    UpdatePluginTimeRange(clock, timeStamp, newTimeStamp);
    zram_ = memData.zram();
    gpuLimit_ = memData.has_gpu_limit_size() ? memData.gpu_limit_size() : 0;
    gpuUsed_ = memData.has_gpu_used_size() ? memData.gpu_used_size() : 0;
    if (memData.has_processesinfo()) {
        ParseProcessInfo(&memData, newTimeStamp);
    }
    if (memData.has_meminfo()) {
        ParseMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_vmeminfo()) {
        ParseVMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_ashmeminfo()) {
        ParseAshmemInfo(&memData, newTimeStamp);
    }
    if (memData.has_dmainfo()) {
        ParseDmaMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_gpumemoryinfo()) {
        ParseGpuProcessMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_gpudumpinfo()) {
        ParseGpuWindowMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_windowinfo()) {
        ParseWindowManagerServiceInfo(&memData, newTimeStamp);
    }
    if (memData.has_cpudumpinfo()) {
        ParseCpuDumpInfo(&memData, newTimeStamp);
    }
    if (memData.has_profilememinfo()) {
        ParseProfileMemInfo(&memData, newTimeStamp);
    }
    if (memData.has_rsdumpinfo()) {
        ParseRSImageDumpInfo(&memData, newTimeStamp);
    }
}

void PbreaderMemParser::SpecialDataAddition(ProtoReader::ProcessMemoryInfo_Reader &processMemoryInfo,
                                            uint64_t timeStamp,
                                            uint32_t ipid,
                                            uint32_t hasValue) const
{
    // processMemoryInfo Special data addition
    if (processMemoryInfo.has_purg_sum_kb()) {
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_PURG_SUM), timeStamp,
                                                                         processMemoryInfo.purg_sum_kb());
    }
    if (processMemoryInfo.has_purg_pin_kb()) {
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_PURG_PIN), timeStamp,
                                                                         processMemoryInfo.purg_pin_kb());
    }
    if (processMemoryInfo.has_gl_pss_kb()) {
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::PROCESS, ipid, memNameDictMap_.at(MEM_GL_PSS), timeStamp, processMemoryInfo.gl_pss_kb());
    }
    if (processMemoryInfo.has_graph_pss_kb()) {
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_GRAPH_PSS), timeStamp,
                                                                         processMemoryInfo.graph_pss_kb());
    }
    if (hasValue) {
        streamFilters_->processFilter_->AddProcessMemory(ipid);
    }
    if (processMemoryInfo.has_smapinfo()) {
        ParseSmapsInfoEasy(&processMemoryInfo, timeStamp, ipid);
    }
}

void PbreaderMemParser::ParseProcessInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    if (tracePacket->has_processesinfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_MEMORY, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->processesinfo(); i; ++i) {
        ProtoReader::ProcessMemoryInfo_Reader processMemoryInfo(i->ToBytes().data_, i->ToBytes().size_);
        auto ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(
            processMemoryInfo.pid(), processMemoryInfo.name().ToStdString());
        uint32_t hasValue = 0;
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_VM_SIZE), timeStamp,
                                                                         processMemoryInfo.vm_size_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::PROCESS, ipid, memNameDictMap_.at(MEM_VM_RSS), timeStamp, processMemoryInfo.vm_rss_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_VM_ANON), timeStamp,
                                                                         processMemoryInfo.rss_anon_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_RSS_FILE), timeStamp,
                                                                         processMemoryInfo.rss_file_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_RSS_SHMEM), timeStamp,
                                                                         processMemoryInfo.rss_shmem_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_VM_SWAP), timeStamp,
                                                                         processMemoryInfo.vm_swap_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_VM_LOCKED), timeStamp,
                                                                         processMemoryInfo.vm_locked_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(
            EnumMeasureFilter::PROCESS, ipid, memNameDictMap_.at(MEM_VM_HWM), timeStamp, processMemoryInfo.vm_hwm_kb());
        hasValue += streamFilters_->measureFilter_->AppendNewMeasureData(EnumMeasureFilter::PROCESS, ipid,
                                                                         memNameDictMap_.at(MEM_OOM_SCORE_ADJ),
                                                                         timeStamp, processMemoryInfo.oom_score_adj());

        SpecialDataAddition(processMemoryInfo, timeStamp, ipid, hasValue);
    }
}
uint32_t PbreaderMemParser::ParseSmapsPathTypeByPrefix(bool hasX, const std::string &path, const bool hasAppName) const
{
    if (EndWith(path, ".so")) {
        if (hasX) {
            if (StartWith(path, "/data/app/") || hasAppName) {
                return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_CODE_APP);
            } else {
                return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_CODE_SYS);
            }
        } else {
            if (StartWith(path, "[anon:.bss]/data/app/") || StartWith(path, "/data/app/") || hasAppName) {
                return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_APP);
            } else {
                return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_SYS);
            }
        }
    }
    return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID);
}
uint32_t PbreaderMemParser::ParseSmapsPathTypeBySuffix(bool hasX, const std::string &path, const bool hasAppName) const
{
    if ((EndWith(path, ".jar")) || (EndWith(path, ".apk")) || (EndWith(path, ".vdex")) || (EndWith(path, ".odex")) ||
        (EndWith(path, ".oat")) || (path.find("dex") != std::string::npos)) {
        return hasX ? (hasAppName ? static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_CODE_APP)
                                  : static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_CODE_SYS))
                    : (hasAppName ? static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_APP)
                                  : static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_SYS));
    }
    return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID);
}

uint32_t PbreaderMemParser::ParseSmapsBlockDetail(ProtoReader::SmapsInfo_Reader &smapsInfo,
                                                  const std::string &path,
                                                  const bool hasAppName) const
{
    bool hasX = smapsInfo.permission().ToStdString().find("x") != std::string::npos;
    auto type = ParseSmapsPathTypeByPrefix(hasX, path, hasAppName);
    if (type != static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID)) {
        return type;
    }
    type = ParseSmapsPathTypeBySuffix(hasX, path, hasAppName);
    if (type != static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID)) {
        return type;
    }
    if (hasX && path.find("/bin/") != std::string::npos) {
        return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_CODE_SYS);
    }
    if ((!hasX) && (path.find("/bin/") != std::string::npos || path.find("[anon:.bss]") != std::string::npos)) {
        return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_SYS);
    }
    if (path.find("[bss]") != std::string::npos) {
        return hasAppName ? static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_APP)
                          : static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_DATA_SYS);
    }
    if ((path.find("[anon]") != std::string::npos) || (path.find("[anon:") != std::string::npos)) {
        if (std::find(g_unknownAnonMemInfo.begin(), g_unknownAnonMemInfo.end(), path) != g_unknownAnonMemInfo.end()) {
            return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_UNKNOWN_ANON);
        }
        return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_NATIVE_HEAP);
    }
    return static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID);
}

uint32_t PbreaderMemParser::ParseSmapsBlockType(ProtoReader::SmapsInfo_Reader &smapsInfo) const
{
    std::string path(smapsInfo.path().ToStdString());
    path.erase(0, path.find_first_not_of(" "));
    path.erase(path.find_last_not_of(" ") + 1);
    if (path.empty()) {
        path = "[anon]";
    }
    for (const auto &iter : g_checkMemStart) {
        if (StartWith(path, iter.first)) {
            return iter.second;
        }
    }
    for (const auto &iter : g_checkMemEnd) {
        if (EndWith(path, iter.first)) {
            return iter.second;
        }
    }
    for (const auto &iter : g_checkMemContain) {
        if (path.find(iter.first) != std::string::npos) {
            return iter.second;
        }
    }
    bool hasAppName = path.find("com.huawei.wx") != std::string::npos;
    uint32_t detailRet = ParseSmapsBlockDetail(smapsInfo, path, hasAppName);
    if (detailRet != static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_INVALID)) {
        return detailRet;
    }
    return hasAppName ? static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_OTHER_APP)
                      : static_cast<uint32_t>(SmapsMemType::SMAPS_MEM_TYPE_OTHER_SYS);
}

void PbreaderMemParser::ParseSmapsInfoEasy(const ProtoReader::ProcessMemoryInfo_Reader *memInfo,
                                           uint64_t timeStamp,
                                           uint64_t ipid) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_SMAPS, STAT_EVENT_RECEIVED);
    for (auto i = memInfo->smapinfo(); i; ++i) {
        SmapsRow row;
        row.timeStamp = timeStamp;
        row.ipid = ipid;
        ProtoReader::SmapsInfo_Reader smapsInfo(i->ToBytes().data_, i->ToBytes().size_);
        row.startAddr = "0x" + smapsInfo.start_addr().ToStdString();
        row.endAddr = "0x" + smapsInfo.end_addr().ToStdString();
        row.dirty = smapsInfo.dirty();
        row.swapper = smapsInfo.swapper();
        row.rss = smapsInfo.rss();
        row.pss = smapsInfo.pss();
        row.size = smapsInfo.size();
        row.reside = smapsInfo.reside();
        row.protectionId = traceDataCache_->GetDataIndex(smapsInfo.permission().ToStdString());
        row.pathId = traceDataCache_->GetDataIndex(smapsInfo.path().ToStdString());
        row.sharedClean = smapsInfo.has_private_clean() ? smapsInfo.private_clean() : 0;
        row.sharedDirty = smapsInfo.has_private_dirty() ? smapsInfo.private_dirty() : 0;
        row.privateClean = smapsInfo.has_shared_clean() ? smapsInfo.shared_clean() : 0;
        row.privateDirty = smapsInfo.has_shared_dirty() ? smapsInfo.shared_dirty() : 0;
        row.swap = smapsInfo.has_swap() ? smapsInfo.swap() : 0;
        row.swapPss = smapsInfo.has_swap_pss() ? smapsInfo.swap_pss() : 0;
        row.type = ParseSmapsBlockType(smapsInfo);
        traceDataCache_->GetSmapsData()->AppendNewData(row);
    }
}

void PbreaderMemParser::ParseMemInfoEasy(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    if (tracePacket->has_meminfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_MEMORY, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->meminfo(); i; ++i) {
        ProtoReader::SysMeminfo_Reader sysMeminfo(i->ToBytes());
        if (config_.sysMemNameMap_.find(sysMeminfo.key()) != config_.sysMemNameMap_.end()) {
            streamFilters_->sysEventVMemMeasureFilter_->AppendNewMeasureData(sysMemNameDictMap_.at(sysMeminfo.key()),
                                                                             timeStamp, sysMeminfo.value());
        } else {
            streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_MEMORY, STAT_EVENT_DATA_INVALID);
        }
    }
}

void PbreaderMemParser::ParseVMemInfoEasy(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    traceDataCache_->UpdateTraceTime(timeStamp);
    if (tracePacket->has_vmeminfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_VIRTUAL_MEMORY, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->vmeminfo(); i; ++i) {
        ProtoReader::SysVMeminfo_Reader sysVMeminfo(i->ToBytes());
        if (config_.sysVirtualMemNameMap_.find(sysVMeminfo.key()) != config_.sysVirtualMemNameMap_.end()) {
            streamFilters_->sysEventVMemMeasureFilter_->AppendNewMeasureData(sysVMemNameDictMap_.at(sysVMeminfo.key()),
                                                                             timeStamp, sysVMeminfo.value());
        } else {
            streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_VIRTUAL_MEMORY, STAT_EVENT_DATA_INVALID);
        }
    }
}

void PbreaderMemParser::ParseMemInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_MEMORY, STAT_EVENT_RECEIVED);
    for (auto i = tracePacket->meminfo(); i; ++i) {
        ProtoReader::SysMeminfo_Reader sysMeminfo(i->ToBytes());
        if (sysMeminfo.key() >= ProtoReader::PMEM_UNSPECIFIED && sysMeminfo.key() <= ProtoReader::PMEM_PINED_PURG) {
            streamFilters_->sysEventMemMeasureFilter_->AppendNewMeasureData(sysMemNameDictMap_.at(sysMeminfo.key()),
                                                                            timeStamp, sysMeminfo.value());
        } else {
            streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_MEMORY, STAT_EVENT_DATA_INVALID);
        }
    }
    streamFilters_->sysEventMemMeasureFilter_->AppendNewMeasureData(zramIndex_, timeStamp, zram_);
    streamFilters_->sysEventMemMeasureFilter_->AppendNewMeasureData(gpuLimitSizeIndex_, timeStamp, gpuLimit_);
    streamFilters_->sysEventMemMeasureFilter_->AppendNewMeasureData(gpuUsedSizeIndex_, timeStamp, gpuUsed_);
}

void PbreaderMemParser::ParseVMemInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_VIRTUAL_MEMORY, STAT_EVENT_RECEIVED);
    for (auto i = tracePacket->vmeminfo(); i; ++i) {
        ProtoReader::SysVMeminfo_Reader sysVMeminfo(i->ToBytes());
        if (sysVMeminfo.key() >= ProtoReader::VMEMINFO_UNSPECIFIED &&
            sysVMeminfo.key() <= ProtoReader::VMEMINFO_WORKINGSET_RESTORE) {
            streamFilters_->sysEventVMemMeasureFilter_->AppendNewMeasureData(sysVMemNameDictMap_.at(sysVMeminfo.key()),
                                                                             timeStamp, sysVMeminfo.value());
        } else {
            // case SysVMeminfoType_INT_MAX_SENTINEL_DO_NOT_USE_:
            streamFilters_->statFilter_->IncreaseStat(TRACE_SYS_VIRTUAL_MEMORY, STAT_EVENT_DATA_INVALID);
        }
    }
}
void PbreaderMemParser::ParseAshmemInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    if (tracePacket->has_ashmeminfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_ASHMEM, STAT_EVENT_RECEIVED);
    }
    AshMemRow row;
    row.ts = timeStamp;
    for (auto i = tracePacket->ashmeminfo(); i; ++i) {
        ProtoReader::AshmemInfo_Reader AshmemInfo(i->ToBytes().data_, i->ToBytes().size_);
        row.ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(AshmemInfo.pid(),
                                                                                 AshmemInfo.name().ToStdString());
        row.adj = AshmemInfo.adj();
        row.fd = AshmemInfo.fd();
        row.ashmemNameId = traceDataCache_->GetDataIndex(AshmemInfo.ashmem_name().ToStdString());
        row.size = AshmemInfo.size();
        row.ashmemId = AshmemInfo.id();
        row.time = AshmemInfo.time();
        row.refCount = AshmemInfo.ref_count();
        row.purged = AshmemInfo.purged();
        row.flag = 0;
        row.pss = 0;
        auto smapsData = traceDataCache_->GetConstSmapsData();
        auto smapsCount = smapsData.Size();
        for (auto j = 0; j < smapsCount; j++) {
            auto path = traceDataCache_->GetDataFromDict(smapsData.PathIds()[j]);
            if ((smapsData.Ipids()[j] == row.ipid) && (path.find("/dev/ashmem/") != std::string::npos)) {
                row.pss += smapsData.Pss()[j] + smapsData.SwapPss()[j];
            }
        }
        traceDataCache_->GetAshMemData()->AppendNewData(row);
    }
    AshMemDeduplicate();
}
void PbreaderMemParser::AshMemDeduplicate() const
{
    auto ashMemData = traceDataCache_->GetAshMemData();
    auto ashMemCount = ashMemData->Size();
    if (ashMemCount <= 1) {
        return;
    }

    std::vector<std::pair<size_t, size_t>> dataByTs;
    size_t start = 0;
    auto ts = ashMemData->TimeStampData()[0];
    for (auto i = 0; i < ashMemCount; ++i) {
        auto tsTmp = ashMemData->TimeStampData()[i];
        if (tsTmp != ts) {
            dataByTs.emplace_back(std::make_pair(start, i - 1));
            start = i;
            ts = tsTmp;
        }
    }
    dataByTs.emplace_back(std::make_pair(start, ashMemCount - 1));

    for (const auto &iterator : dataByTs) {
        /* L1 map (key = id+time, value = L2 map)
           L2 map (key = ipid, value = index) */
        std::map<std::pair<uint32_t, uint64_t>, std::map<uint64_t, uint64_t>> AshMemMap;
        for (auto i = iterator.first; i <= iterator.second; ++i) {
            auto ashmemId = ashMemData->AshmemIds()[i];
            auto time = ashMemData->Times()[i];
            auto key = std::make_pair(ashmemId, time);
            auto ipid = ashMemData->Ipids()[i];
            auto &pidMap = AshMemMap[key];
            if (pidMap.find(ipid) == pidMap.end()) {
                pidMap.emplace(ipid, i);
            } else {
                ashMemData->SetFlag(i, (uint32_t)MemDeduplicateFlag::MEM_DEDUPLICATE_FLAG_DUP_SAME_PROCESS);
            }
        }

        for (const auto &item : AshMemMap) {
            auto &pidMap = item.second;
            auto iter = pidMap.begin();
            if (iter == pidMap.end()) {
                continue;
            }
            for (++iter; iter != pidMap.end(); ++iter) {
                ashMemData->SetFlag(iter->second, (uint32_t)MemDeduplicateFlag::MEM_DEDUPLICATE_FLAG_DUP_DIFF_PROCESS);
            }
        }
    }
}
PbreaderMemParser::MemProcessType PbreaderMemParser::GetMemProcessType(uint64_t ipid) const
{
    const auto &iterProcess = traceDataCache_->GetConstProcessData(ipid);
    if (iterProcess.cmdLine_ == "composer_host") {
        return MemProcessType::PID_TYPE_COMPOSER;
    } else if (iterProcess.cmdLine_ == "render_service") {
        return MemProcessType::PID_TYPE_RENDER_SERVICES;
    } else {
        return MemProcessType::PID_TYPE_APP;
    }
}

void PbreaderMemParser::ParseDmaMemInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    if (tracePacket->has_dmainfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_DMAMEM, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->dmainfo(); i; ++i) {
        ProtoReader::DmaInfo_Reader DmaMemInfo(i->ToBytes().data_, i->ToBytes().size_);
        DmaMemRow row;
        row.ipid = streamFilters_->processFilter_->UpdateOrCreateProcessWithName(DmaMemInfo.pid(),
                                                                                 DmaMemInfo.name().ToStdString());
        row.ts = timeStamp;
        row.fd = DmaMemInfo.fd();
        row.size = DmaMemInfo.size();
        row.ino = DmaMemInfo.ino();
        row.expPid = DmaMemInfo.exp_pid();
        row.expTaskCommId = traceDataCache_->GetDataIndex(DmaMemInfo.exp_task_comm().ToStdString());
        row.bufNameId = traceDataCache_->GetDataIndex(DmaMemInfo.buf_name().ToStdString());
        row.expNameId = traceDataCache_->GetDataIndex(DmaMemInfo.exp_name().ToStdString());
        row.flag = 0;
        traceDataCache_->GetDmaMemData()->AppendNewData(row);
    }
    DmaMemDeduplicate();
}
void PbreaderMemParser::DmaMemDeduplicate() const
{
    auto dmaMemData = traceDataCache_->GetDmaMemData();
    auto dmaCount = dmaMemData->Size();
    if (dmaCount <= 1) {
        return;
    }

    std::vector<std::pair<size_t, size_t>> dataByTs;
    size_t start = 0;
    auto ts = dmaMemData->TimeStampData()[0];
    for (auto i = 0; i < dmaCount; ++i) {
        auto tsTmp = dmaMemData->TimeStampData()[i];
        if (tsTmp != ts) {
            dataByTs.emplace_back(std::make_pair(start, i - 1));
            start = i;
            ts = tsTmp;
        }
    }
    dataByTs.emplace_back(std::make_pair(start, dmaCount - 1));

    for (const auto &iterator : dataByTs) {
        /* L1 map (key = ino, value = L2 map)
           L2 map (key = ipid, value = pair(index, MemProcessType)) */
        std::map<uint32_t, std::map<uint64_t, std::pair<uint64_t, MemProcessType>>> inoMap;
        std::map<uint32_t /*ino*/, MemProcessType> processTypeMap;
        for (auto i = iterator.first; i <= iterator.second; ++i) {
            auto ino = dmaMemData->Inos()[i];
            auto ipid = dmaMemData->Ipids()[i];
            auto &pidMap = inoMap[ino];
            if (pidMap.find(ipid) != pidMap.end()) {
                dmaMemData->SetFlag(i, (uint32_t)MemDeduplicateFlag::MEM_DEDUPLICATE_FLAG_DUP_SAME_PROCESS);
            } else {
                auto processType = GetMemProcessType(ipid);
                pidMap.emplace(ipid, std::make_pair(i, processType));
                if (processTypeMap[ino] < processType) {
                    processTypeMap[ino] = processType;
                }
            }
        }

        for (const auto &item : inoMap) {
            auto maxPidType = processTypeMap[item.first];
            const auto &pidMap = item.second;
            for (const auto &pidItem : pidMap) {
                if (pidItem.second.second < maxPidType) {
                    dmaMemData->SetFlag(pidItem.second.first,
                                        (uint32_t)MemDeduplicateFlag::MEM_DEDUPLICATE_FLAG_DUP_DIFF_PROCESS);
                }
            }
        }
    }
}

void PbreaderMemParser::ParseGpuProcessMemInfo(const ProtoReader::MemoryData_Reader *tracePacket,
                                               uint64_t timeStamp) const
{
    if (tracePacket->has_gpumemoryinfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_GPU_PROCESS_MEM, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->gpumemoryinfo(); i; ++i) {
        ProtoReader::GpuMemoryInfo_Reader GpuMemoryInfo(i->ToBytes().data_, i->ToBytes().size_);
        DataIndex gpuNameId = traceDataCache_->GetDataIndex(GpuMemoryInfo.gpu_name().ToStdString());
        uint64_t allGpuSize = GpuMemoryInfo.all_gpu_size();
        if (GpuMemoryInfo.has_gpu_process_info()) {
            for (auto j = GpuMemoryInfo.gpu_process_info(); j; ++j) {
                ProtoReader::GpuProcessInfo_Reader GpuProcessInfo(j->ToBytes().data_, j->ToBytes().size_);
                GpuProcessMemRow row;
                row.ts = timeStamp;
                row.gpuNameId = gpuNameId;
                row.allGpuSize = allGpuSize;
                row.addr = GpuProcessInfo.addr().ToStdString();
                uint32_t pid = GpuProcessInfo.pid();
                uint32_t tid = GpuProcessInfo.tid();
                row.itid = streamFilters_->processFilter_->GetOrCreateThreadWithPid(tid, pid);
                row.ipid = streamFilters_->processFilter_->GetOrCreateInternalPid(timeStamp, pid);
                row.usedGpuSize = GpuProcessInfo.used_gpu_size();
                traceDataCache_->GetGpuProcessMemData()->AppendNewData(row);
            }
        }
    }
}
void PbreaderMemParser::FillGpuWindowMemInfo(const ProtoReader::GpuDumpInfo_Reader &gpuDumpInfo,
                                             uint64_t timeStamp) const
{
    DataIndex windowNameId = traceDataCache_->GetDataIndex(gpuDumpInfo.window_name().ToStdString());
    GpuWindowMemRow row;
    row.windowNameId = windowNameId;
    row.ts = timeStamp;
    row.windowId = gpuDumpInfo.id();
    row.purgeableSize = gpuDumpInfo.gpu_purgeable_size();
    for (auto i = gpuDumpInfo.gpu_detail_info(); i; ++i) {
        ProtoReader::GpuDetailInfo_Reader GpuDetailInfo(i->ToBytes().data_, i->ToBytes().size_);
        row.moduleNameId = traceDataCache_->GetDataIndex(GpuDetailInfo.module_name().ToStdString());
        if (!GpuDetailInfo.has_gpu_sub_info()) {
            continue;
        }
        for (auto j = GpuDetailInfo.gpu_sub_info(); j; ++j) {
            ProtoReader::GpuSubInfo_Reader gpuSubInfo(j->ToBytes().data_, j->ToBytes().size_);

            row.categoryNameId = traceDataCache_->GetDataIndex(gpuSubInfo.category_name().ToStdString());
            row.size = gpuSubInfo.size();
            row.count = gpuSubInfo.entry_num();
            traceDataCache_->GetGpuWindowMemData()->AppendNewData(row);
        }
    }
}
void PbreaderMemParser::ParseGpuWindowMemInfo(const ProtoReader::MemoryData_Reader *tracePacket,
                                              uint64_t timeStamp) const
{
    if (tracePacket->has_gpudumpinfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_GPU_WINDOW_MEM, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->gpudumpinfo(); i; ++i) {
        ProtoReader::GpuDumpInfo_Reader GpuDumpInfo(i->ToBytes().data_, i->ToBytes().size_);
        if (!GpuDumpInfo.has_gpu_detail_info()) {
            continue;
        }
        FillGpuWindowMemInfo(GpuDumpInfo, timeStamp);
    }
}
void PbreaderMemParser::ParseWindowManagerServiceInfo(const ProtoReader::MemoryData_Reader *tracePacket,
                                                      uint64_t timeStamp)
{
    if (tracePacket->has_windowinfo()) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_WINDOW_MANAGER_SERVICE, STAT_EVENT_RECEIVED);
    }
    for (auto i = tracePacket->windowinfo(); i; ++i) {
        ProtoReader::WindowManagerServiceInfo_Reader windowInfo(i->ToBytes().data_, i->ToBytes().size_);
        if (!windowInfo.has_pid() || !windowInfo.has_window_name()) {
            continue;
        }
        auto windowNameId = traceDataCache_->GetDataIndex(windowInfo.window_name().ToStdString());
        auto ipid =
            streamFilters_->processFilter_->GetOrCreateInternalPid(timeStamp, static_cast<uint32_t>(windowInfo.pid()));
        windowIdToipidMap_.insert({windowNameId, ipid});
    }
}
void PbreaderMemParser::ParseCpuDumpInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    for (auto i = tracePacket->cpudumpinfo(); i; ++i) {
        ProtoReader::CpuDumpInfo_Reader cpuDumpInfo(i->ToBytes().data_, i->ToBytes().size_);
        auto totalSize = cpuDumpInfo.total_cpu_memory_size();
        traceDataCache_->GetCpuDumpInfo()->AppendNewData(timeStamp, totalSize);
    }
}
void PbreaderMemParser::ParseProfileMemInfo(const ProtoReader::MemoryData_Reader *tracePacket, uint64_t timeStamp) const
{
    for (auto i = tracePacket->profilememinfo(); i; ++i) {
        ProtoReader::ProfileMemInfo_Reader profileMemInfo(i->ToBytes().data_, i->ToBytes().size_);
        auto channelIndex = traceDataCache_->GetDataIndex(profileMemInfo.channel().ToStdString());
        auto totalSize = profileMemInfo.total_memory_size();
        traceDataCache_->GetProfileMemInfo()->AppendNewData(timeStamp, channelIndex, totalSize);
    }
}

void PbreaderMemParser::ParseRSImageDumpInfo(const ProtoReader::MemoryData_Reader *tracePacket,
                                             uint64_t timeStamp) const
{
    for (auto i = tracePacket->rsdumpinfo(); i; ++i) {
        ProtoReader::RSImageDumpInfo_Reader rsImageDumpInfo(i->ToBytes().data_, i->ToBytes().size_);
        auto size = rsImageDumpInfo.size();
        auto typeIndex = traceDataCache_->GetDataIndex(rsImageDumpInfo.type().ToStdString());
        InternalPid ipid = INVALID_IPID;
        if (rsImageDumpInfo.has_pid()) {
            ipid = streamFilters_->processFilter_->GetOrCreateInternalPid(timeStamp,
                                                                          static_cast<uint32_t>(rsImageDumpInfo.pid()));
        }
        auto surfaceNameIndex = traceDataCache_->GetDataIndex(rsImageDumpInfo.surface_name().ToStdString());
        traceDataCache_->GetRSImageDumpInfo()->AppendNewData(timeStamp, size, typeIndex, ipid, surfaceNameIndex);
    }
}
void PbreaderMemParser::ParseMemoryConfig(PbreaderDataSegment &seg)
{
    ProtoReader::MemoryConfig_Reader memConfigData(seg.protoData.data_, seg.protoData.size_);
    if (memConfigData.has_pid()) {
        bool parseError = false;
        auto itor = memConfigData.pid(&parseError);
        if (parseError) {
            TS_LOGE("Parse pid in MemoryConfig function failed!!!");
            return;
        }
        while (itor) {
            int32_t pid = *itor;
            auto ipid = streamFilters_->processFilter_->GetOrCreateInternalPid(seg.timeStamp, pid);
            traceDataCache_->GetTraceConfigData()->AppendNewData("memory_config", "ipid", std::to_string(ipid));
            itor++;
        }
    }
}

void PbreaderMemParser::Finish()
{
    traceDataCache_->GetGpuWindowMemData()->RevicesIpid(windowIdToipidMap_);
    if (traceDataCache_->traceStartTime_ == INVALID_UINT64 || traceDataCache_->traceEndTime_ == 0) {
        traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
    } else {
        TS_LOGI("mem data time is not updated, maybe this trace file has other data");
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
