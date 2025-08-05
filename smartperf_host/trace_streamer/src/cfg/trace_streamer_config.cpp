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

#include "trace_streamer_config.h"
#ifdef ENABLE_MEMORY
#include "memory_plugin_common.pbreader.h"
#endif
namespace SysTuning {
namespace TraceCfg {
#ifdef ENABLE_MEMORY
using namespace ProtoReader;
#endif
TraceStreamerConfig::TraceStreamerConfig()
{
    InitEventNameMap();
    eventErrorDescMap_ = {
        {STAT_EVENT_RECEIVED, TRACE_STAT_TYPE_RECEIVED_DESC},
        {STAT_EVENT_DATA_LOST, TRACE_STAT_TYPE_LOST_DESC},
        {STAT_EVENT_NOTMATCH, TRACE_STAT_TYPE_NOTMATCH_DESC},
        {STAT_EVENT_NOTSUPPORTED, TRACE_STAT_TYPE_NOTSUPPORTED_DESC},
        {STAT_EVENT_DATA_INVALID, TRACE_STAT_TYPE_DATA_INVALID_DESC},
    };
    serverityLevelDescMap_ = {
        {STAT_SEVERITY_LEVEL_INFO, STAT_SEVERITY_LEVEL_INFO_DESC},
        {STAT_SEVERITY_LEVEL_WARN, STAT_SEVERITY_LEVEL_WARN_DESC},
        {STAT_SEVERITY_LEVEL_ERROR, STAT_SEVERITY_LEVEL_ERROR_DESC},
        {STAT_SEVERITY_LEVEL_FATAL, STAT_SEVERITY_LEVEL_FATAL_DESC},
    };
    memNameMap_ = {
        {MEM_VM_SIZE, MEM_INFO_VM_SIZE_DESC},   {MEM_VM_LOCKED, MEM_INFO_LOCKED_DESC},
        {MEM_VM_RSS, MEM_INFO_RSS_DESC},        {MEM_VM_ANON, MEM_INFO_RSS_ANON_DESC},
        {MEM_RSS_FILE, MEM_INFO_RSS_FILE_DESC}, {MEM_RSS_SHMEM, MEM_INFO_RSS_SCHEM_DESC},
        {MEM_VM_SWAP, MEM_INFO_SWAP_DESC},      {MEM_VM_VIRT, MEM_INFO_VIRT_DESC},
        {MEM_VM_HWM, MEM_INFO_HWM_DESC},        {MEM_OOM_SCORE_ADJ, MEM_INFO_SCORE_ADJ_DESC},
        {MEM_PURG_SUM, MEM_INFO_PURG_SUM_DESC}, {MEM_PURG_PIN, MEM_INFO_PURG_PIN_DESC},
        {MEM_GL_PSS, MEM_INFO_GL_PSS_DESC},     {MEM_GRAPH_PSS, MEM_INFO_GRAPH_PSS_DESC},
    };

#ifdef ENABLE_MEMORY
    InitSysMemMap();
    InitSysVmemMap();
#endif
    InitSecurityMap();
    if (eventNameMap_.size() != TRACE_EVENT_MAX) {
        TS_LOGF("eventNameMap_.size() max be %d, logic error", TRACE_EVENT_MAX);
    }
    if (eventErrorDescMap_.size() != STAT_EVENT_MAX) {
        TS_LOGF("eventErrorDescMap_.size() max be %d, logic error", STAT_EVENT_MAX);
    }
    if (serverityLevelDescMap_.size() != STAT_SEVERITY_LEVEL_MAX) {
        TS_LOGF("serverityLevelDescMap_.size() max be %d, logic error", STAT_SEVERITY_LEVEL_MAX);
    }
    if (eventParserStatSeverityDescMap_.size() != TRACE_EVENT_MAX) {
        TS_LOGF("eventParserStatSeverityDescMap_.size() max be %d, logic error", TRACE_EVENT_MAX);
    }
    if (memNameMap_.size() != MEM_MAX) {
        TS_LOGF("memNameMap_.size() max be %d, logic error", MEM_MAX);
    }
    for (int32_t i = TRACE_EVENT_START; i < TRACE_EVENT_MAX; i++) {
        if (eventParserStatSeverityDescMap_.at(static_cast<SupportedTraceEventType>(i)).size() != STAT_EVENT_MAX) {
            TS_LOGF("every item in eventParserStatSeverityDescMap_ max be %d, logic error", STAT_EVENT_MAX);
        }
    }
}

void TraceStreamerConfig::PrintInfo() const
{
    printf("---all kind of trace event info---\n");
    for (auto itor = eventNameMap_.begin(); itor != eventNameMap_.end(); itor++) {
        printf("%s\n", itor->second.c_str());
    }
    printf("\n");
    printf("---subdir of process mem info---\n");
    for (auto itor = memNameMap_.begin(); itor != memNameMap_.end(); itor++) {
        printf("%s\n", itor->second.c_str());
    }
    printf("\n");
    printf("---subdir of sys mem info---\n");
    for (auto itor = sysMemNameMap_.begin(); itor != sysMemNameMap_.end(); itor++) {
        printf("%s\n", itor->second.c_str());
    }
    printf("\n");
    printf("---subdir of sys vmem info---\n");
    for (auto itor = sysVirtualMemNameMap_.begin(); itor != sysVirtualMemNameMap_.end(); itor++) {
        printf("%s\n", itor->second.c_str());
    }
    printf("\n");
}

void TraceStreamerConfig::InitBinderEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION, TRACE_ACTION_BINDER_TRANSACTION);
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_RECEIVED, TRACE_ACTION_BINDER_TRANSACTION_RECEIVED);
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_ALLOC_BUF, TRACE_ACTION_BINDER_TRANSACTION_ALLOC_BUF);
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_LOCK, TRACE_ACTION_BINDER_TRANSACTION_LOCK);
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_LOCKED, TRACE_ACTION_BINDER_TRANSACTION_LOCKED);
    eventNameMap_.emplace(TRACE_EVENT_BINDER_TRANSACTION_UNLOCK, TRACE_ACTION_BINDER_TRANSACTION_UNLOCK);
}
void TraceStreamerConfig::InitSchedEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_SCHED_SWITCH, TRACE_ACTION_SCHED_SWITCH);
    eventNameMap_.emplace(TRACE_EVENT_SCHED_BLOCKED_REASON, TRACE_ACTION_SCHED_BLOCKED_REASON);
    eventNameMap_.emplace(TRACE_EVENT_SCHED_WAKEUP, TRACE_ACTION_SCHED_WAKEUP);
    eventNameMap_.emplace(TRACE_EVENT_SCHED_WAKING, TRACE_ACTION_SCHED_WAKING);
    eventNameMap_.emplace(TRACE_EVENT_SCHED_WAKEUP_NEW, TRACE_ACTION_SCHED_WAKEUP_NEW);
}
void TraceStreamerConfig::InitClkEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_CLOCK_SET_RATE, TRACE_ACTION_CLOCK_SET_RATE);
    eventNameMap_.emplace(TRACE_EVENT_CLOCK_ENABLE, TRACE_ACTION_CLOCK_ENABLE);
    eventNameMap_.emplace(TRACE_EVENT_CLOCK_DISABLE, TRACE_ACTION_CLOCK_DISABLE);
    eventNameMap_.emplace(TRACE_EVENT_CLK_SET_RATE, TRACE_ACTION_CLK_SET_RATE);
    eventNameMap_.emplace(TRACE_EVENT_CLK_ENABLE, TRACE_ACTION_CLK_ENABLE);
    eventNameMap_.emplace(TRACE_EVENT_CLK_DISABLE, TRACE_ACTION_CLK_DISABLE);
    eventNameMap_.emplace(TRACE_EVENT_CLOCK_SYNC, TRACE_ACTION_CLOCK_SYNC);
}
void TraceStreamerConfig::InitCpuEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_CPU_IDLE, TRACE_ACTION_CPU_IDLE);
    eventNameMap_.emplace(TRACE_EVENT_CPU_FREQUENCY, TRACE_ACTION_CPU_FREQUENCY);
    eventNameMap_.emplace(TRACE_EVENT_CPU_FREQUENCY_LIMITS, TRACE_ACTION_CPU_FREQUENCY_LIMITS);
    eventNameMap_.emplace(TRACE_CPU_USAGE, TRACE_ACTION_CPU_USAGE);
}
void TraceStreamerConfig::InitInterruptEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_IPI_ENTRY, TRACE_ACTION_IPI_ENTRY);
    eventNameMap_.emplace(TRACE_EVENT_IPI_EXIT, TRACE_ACTION_IPI_EXIT);
    eventNameMap_.emplace(TRACE_EVENT_IRQ_HANDLER_ENTRY, TRACE_ACTION_IRQ_HANDLER_ENTRY);
    eventNameMap_.emplace(TRACE_EVENT_IRQ_HANDLER_EXIT, TRACE_ACTION_IRQ_HANDLER_EXIT);
    eventNameMap_.emplace(TRACE_EVENT_SOFTIRQ_RAISE, TRACE_ACTION_SOFTIRQ_RAISE);
    eventNameMap_.emplace(TRACE_EVENT_SOFTIRQ_ENTRY, TRACE_ACTION_SOFTIRQ_ENTRY);
    eventNameMap_.emplace(TRACE_EVENT_SOFTIRQ_EXIT, TRACE_ACTION_SOFTIRQ_EXIT);
    eventNameMap_.emplace(TRACE_EVENT_DMA_FENCE_INIT, TRACE_ACTION_DMA_FENCE_INIT);
    eventNameMap_.emplace(TRACE_EVENT_DMA_FENCE_DESTROY, TRACE_ACTION_DMA_FENCE_DESTROY);
    eventNameMap_.emplace(TRACE_EVENT_DMA_FENCE_ENABLE, TRACE_ACTION_DMA_FENCE_ENABLE);
    eventNameMap_.emplace(TRACE_EVENT_DMA_FENCE_SIGNALED, TRACE_ACTION_DMA_FENCE_SIGNALED);
    eventNameMap_.emplace(TRACE_EVENT_DMA_FENCE, TRACE_ACTION_DMA_FENCE);
}
void TraceStreamerConfig::InitMemoryEventNameMap()
{
    eventNameMap_.emplace(TRACE_MEMORY, TRACE_ACTION_MEMORY);
    eventNameMap_.emplace(TRACE_SYS_MEMORY, TRACE_ACTION_SYS_MEMORY);
    eventNameMap_.emplace(TRACE_ASHMEM, TRACE_ACTION_ASHMEM);
    eventNameMap_.emplace(TRACE_DMAMEM, TRACE_ACTION_DMAMEM);
    eventNameMap_.emplace(TRACE_GPU_PROCESS_MEM, TRACE_ACTION_GPU_PROCESS_MEM);
    eventNameMap_.emplace(TRACE_GPU_WINDOW_MEM, TRACE_ACTION_GPU_WINDOW_MEM);
    eventNameMap_.emplace(TRACE_JS_MEMORY, TRACE_ACTION_JS_MEMORY);
    eventNameMap_.emplace(TRACE_SYS_VIRTUAL_MEMORY, TRACE_ACTION_SYS_VIRTUAL_MEMORY);
}
void TraceStreamerConfig::InitBlockEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_BACKMERGE, TRACE_ACTION_BLOCK_BIO_BACKMERGE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_BOUNCE, TRACE_ACTION_BLOCK_BIO_BOUNCE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_COMPLETE, TRACE_ACTION_BLOCK_BIO_COMPLETE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_FRONTMERGE, TRACE_ACTION_BLOCK_BIO_FRONTMERGE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_QUEUE, TRACE_ACTION_BLOCK_BIO_QUEUE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_BIO_REMAP, TRACE_ACTION_BLOCK_BIO_REMAP);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_DIRTY_BUFFER, TRACE_ACTION_BLOCK_DIRTY_BUFFER);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_GETRQ, TRACE_ACTION_BLOCK_GETRQ);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_PLUG, TRACE_ACTION_BLOCK_PLUG);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_RQ_COMPLETE, TRACE_ACTION_BLOCK_RQ_COMPLETE);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_RQ_INSERT, TRACE_ACTION_BLOCK_RQ_INSERT);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_RQ_REMAP, TRACE_ACTION_BLOCK_RQ_REMAP);
    eventNameMap_.emplace(TRACE_EVENT_BLOCK_RQ_ISSUE, TRACE_ACTION_BLOCK_RQ_ISSUE);
}
void TraceStreamerConfig::InitRegulatorEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_REGULATOR_SET_VOLTAGE, TRACE_ACTION_REGULATOR_SET_VOLTAGE);
    eventNameMap_.emplace(TRACE_EVENT_REGULATOR_SET_VOLTAGE_COMPLETE, TRACE_ACTION_REGULATOR_SET_VOLTAGE_COMPLETE);
    eventNameMap_.emplace(TRACE_EVENT_REGULATOR_DISABLE, TRACE_ACTION_REGULATOR_DISABLE);
    eventNameMap_.emplace(TRACE_EVENT_REGULATOR_DISABLE_COMPLETE, TRACE_ACTION_REGULATOR_DISABLE_COMPLETE);
}
void TraceStreamerConfig::InitOtherEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_FFRT, TRACE_ACTION_FFRT);
    eventNameMap_.emplace(TRACE_EVENT_PRINT, TRACE_ACTION_PRINT);
    eventNameMap_.emplace(TRACE_EVENT_TRACING_MARK_WRITE, TRACE_ACTION_TRACING_MARK_WRITE);
    eventNameMap_.emplace(TRACE_EVENT_TASK_RENAME, TRACE_ACTION_TASK_RENAME);
    eventNameMap_.emplace(TRACE_EVENT_TASK_NEWTASK, TRACE_ACTION_TASK_NEWTASK);
    eventNameMap_.emplace(TRACE_EVENT_SUSPEND_RESUME, TRACE_ACTION_SUSPEND_RESUME);
    eventNameMap_.emplace(TRACE_EVENT_WORKQUEUE_EXECUTE_START, TRACE_ACTION_WORKQUEUE_EXECUTE_START);
    eventNameMap_.emplace(TRACE_EVENT_WORKQUEUE_EXECUTE_END, TRACE_ACTION_WORKQUEUE_EXECUTE_END);
    eventNameMap_.emplace(TRACE_EVENT_SYS_ENTRY, TRACE_ACTION_SYS_ENTRY);
    eventNameMap_.emplace(TRACE_EVENT_SYS_EXIT, TRACE_ACTION_SYS_EXIT);
    eventNameMap_.emplace(TRACE_EVENT_OOM_SCORE_ADJ_UPDATE, TRACE_ACTION_OOM_SCORE_ADJ_UPDATE);
    eventNameMap_.emplace(TRACE_EVENT_PROCESS_EXIT, TRACE_ACTION_PROCESS_EXIT);
    eventNameMap_.emplace(TRACE_EVENT_PROCESS_FREE, TRACE_ACTION_PROCESS_FREE);
    eventNameMap_.emplace(TRACE_EVENT_SIGNAL_GENERATE, TRACE_ACTION_SIGNAL_GENERATE);
    eventNameMap_.emplace(TRACE_EVENT_SIGNAL_DELIVER, TRACE_ACTION_SIGNAL_DELIVER);
    eventNameMap_.emplace(TRACE_EVENT_OTHER, TRACE_ACTION_OTHER);
    eventNameMap_.emplace(TRACE_DISKIO, TRACE_ACTION_DISKIO);
    eventNameMap_.emplace(TRACE_PROCESS, TRACE_ACTION_PROCESS);
    eventNameMap_.emplace(TRACE_NETWORK, TRACE_ACTION_NETWORK);
    eventNameMap_.emplace(TRACE_PERF, TRACE_ACTION_PERF);
    eventNameMap_.emplace(TRACE_HILOG, TRACE_ACTION_HILOG);
    eventNameMap_.emplace(TRACE_HIDUMP_FPS, TRACE_ACTION_HIDUMP_FPS);
    eventNameMap_.emplace(TRACE_HISYSEVENT, TRACE_ACTION_HISYS_EVENT);
    eventNameMap_.emplace(TRACE_SMAPS, TRACE_ACTION_SMAPS);
    eventNameMap_.emplace(TRACE_WINDOW_MANAGER_SERVICE, TRACE_ACTION_WINDOW_MANAGER_SERVICE);
    eventNameMap_.emplace(TRACE_VSYNC, TRACE_ACTION_VSYNC);
    eventNameMap_.emplace(TRACE_ON_DO_COMPOSITION, TRACE_ACTION_ON_DO_COMPOSITION);
    eventNameMap_.emplace(TRACE_FRAMEQUEUE, TRACE_ACTION_FRAMEQUEUE);
}
void TraceStreamerConfig::InitEbpfEventNameMap()
{
    eventNameMap_.emplace(TRACE_EVENT_EBPF, TRACE_ACTION_EBPF);
    eventNameMap_.emplace(TRACE_EVENT_EBPF_FILE_SYSTEM, TRACE_ACTION_EBPF_FILE_SYSTEM);
    eventNameMap_.emplace(TRACE_EVENT_EBPF_PAGED_MEMORY, TRACE_ACTION_EBPF_PAGED_MEMORY);
    eventNameMap_.emplace(TRACE_EVENT_EBPF_BIO_LATENCY, TRACE_ACTION_EBPF_BIO_LATENCY);
}
void TraceStreamerConfig::InitHookEventNameMap()
{
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_MALLOC, TRACE_ACTION_NATIVE_HOOK_MALLOC);
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_FREE, TRACE_ACTION_NATIVE_HOOK_FREE);
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_MMAP, TRACE_ACTION_NATIVE_HOOK_MMAP);
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_MUNMAP, TRACE_ACTION_NATIVE_HOOK_MUNMAP);
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_RECORD_STATISTICS, TRACE_ACTION_NATIVE_HOOK_RECORD_STATISTICS);
    eventNameMap_.emplace(TRACE_NATIVE_HOOK_MEMTAG, TRACE_ACTION_NATIVE_HOOK_MEMTAG);
}
void TraceStreamerConfig::InitEventNameMap()
{
    InitBinderEventNameMap();
    InitSchedEventNameMap();
    InitClkEventNameMap();
    InitCpuEventNameMap();
    InitInterruptEventNameMap();
    InitMemoryEventNameMap();
    InitBlockEventNameMap();
    InitRegulatorEventNameMap();
    InitOtherEventNameMap();
    InitEbpfEventNameMap();
    InitHookEventNameMap();
}
#ifdef ENABLE_MEMORY
void TraceStreamerConfig::InitSysMemMap()
{
    sysMemNameMap_ = {{SysMeminfoType::PMEM_UNSPECIFIED, SYS_MEMINFO_UNSPECIFIED_DESC},
                      {SysMeminfoType::PMEM_MEM_TOTAL, SYS_MEMINFO_MEM_TOTAL_DESC},
                      {SysMeminfoType::PMEM_MEM_FREE, SYS_MEMINFO_MEM_FREE_DESC},
                      {SysMeminfoType::PMEM_MEM_AVAILABLE, SYS_MEMINFO_MEM_AVAILABLE_DESC},
                      {SysMeminfoType::PMEM_BUFFERS, SYS_MEMINFO_BUFFERS_DESC},
                      {SysMeminfoType::PMEM_CACHED, SYS_MEMINFO_CACHED_DESC},
                      {SysMeminfoType::PMEM_SWAP_CACHED, SYS_MEMINFO_SWAP_CACHED_DESC},
                      {SysMeminfoType::PMEM_ACTIVE, SYS_MEMINFO_ACTIVE_DESC},
                      {SysMeminfoType::PMEM_INACTIVE, SYS_MEMINFO_INACTIVE_DESC},
                      {SysMeminfoType::PMEM_ACTIVE_ANON, SYS_MEMINFO_ACTIVE_ANON_DESC},
                      {SysMeminfoType::PMEM_INACTIVE_ANON, SYS_MEMINFO_INACTIVE_ANON_DESC},
                      {SysMeminfoType::PMEM_ACTIVE_FILE, SYS_MEMINFO_ACTIVE_FILE_DESC},
                      {SysMeminfoType::PMEM_INACTIVE_FILE, SYS_MEMINFO_INACTIVE_FILE_DESC},
                      {SysMeminfoType::PMEM_UNEVICTABLE, SYS_MEMINFO_UNEVICTABLE_DESC},
                      {SysMeminfoType::PMEM_MLOCKED, SYS_MEMINFO_MLOCKED_DESC},
                      {SysMeminfoType::PMEM_SWAP_TOTAL, SYS_MEMINFO_SWAP_TOTAL_DESC},
                      {SysMeminfoType::PMEM_SWAP_FREE, SYS_MEMINFO_SWAP_FREE_DESC},
                      {SysMeminfoType::PMEM_DIRTY, SYS_MEMINFO_DIRTY_DESC},
                      {SysMeminfoType::PMEM_WRITEBACK, SYS_MEMINFO_WRITEBACK_DESC},
                      {SysMeminfoType::PMEM_ANON_PAGES, SYS_MEMINFO_ANON_PAGES_DESC},
                      {SysMeminfoType::PMEM_MAPPED, SYS_MEMINFO_MAPPED_DESC},
                      {SysMeminfoType::PMEM_SHMEM, SYS_MEMINFO_SHMEM_DESC},
                      {SysMeminfoType::PMEM_SLAB, SYS_MEMINFO_SLAB_DESC},
                      {SysMeminfoType::PMEM_SLAB_RECLAIMABLE, SYS_MEMINFO_SLAB_RECLAIMABLE_DESC},
                      {SysMeminfoType::PMEM_SLAB_UNRECLAIMABLE, SYS_MEMINFO_SLAB_UNRECLAIMABLE_DESC},
                      {SysMeminfoType::PMEM_KERNEL_STACK, SYS_MEMINFO_KERNEL_STACK_DESC},
                      {SysMeminfoType::PMEM_PAGE_TABLES, SYS_MEMINFO_PAGE_TABLES_DESC},
                      {SysMeminfoType::PMEM_COMMIT_LIMIT, SYS_MEMINFO_COMMIT_LIMIT_DESC},
                      {SysMeminfoType::PMEM_COMMITED_AS, SYS_MEMINFO_COMMITED_AS_DESC},
                      {SysMeminfoType::PMEM_VMALLOC_TOTAL, SYS_MEMINFO_VMALLOC_TOTAL_DESC},
                      {SysMeminfoType::PMEM_VMALLOC_USED, SYS_MEMINFO_VMALLOC_USED_DESC},
                      {SysMeminfoType::PMEM_VMALLOC_CHUNK, SYS_MEMINFO_VMALLOC_CHUNK_DESC},
                      {SysMeminfoType::PMEM_CMA_TOTAL, SYS_MEMINFO_CMA_TOTAL_DESC},
                      {SysMeminfoType::PMEM_CMA_FREE, SYS_MEMINFO_CMA_FREE_DESC},
                      {SysMeminfoType::PMEM_KERNEL_RECLAIMABLE, SYS_MEMINFO_KERNEL_RECLAIMABLE_DESC},
                      {SysMeminfoType::PMEM_ACTIVE_PURG, SYS_MEMINFO_ACTIVE_PURG_DESC},
                      {SysMeminfoType::PMEM_INACTIVE_PURG, SYS_MEMINFO_INACTIVE_PURG_DESC},
                      {SysMeminfoType::PMEM_PINED_PURG, SYS_MEMINFO_PINED_PURG_DESC}};
}
void TraceStreamerConfig::InitNrZoneEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_ACTIVE_ANON, SYS_VMEMINFO_NR_ZONE_ACTIVE_ANON_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_ACTIVE_FILE, SYS_VMEMINFO_NR_ZONE_ACTIVE_FILE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_INACTIVE_ANON,
                                  SYS_VMEMINFO_NR_ZONE_INACTIVE_ANON_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_INACTIVE_FILE,
                                  SYS_VMEMINFO_NR_ZONE_INACTIVE_FILE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_UNEVICTABLE, SYS_VMEMINFO_NR_ZONE_UNEVICTABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZONE_WRITE_PENDING,
                                  SYS_VMEMINFO_NR_ZONE_WRITE_PENDING_DESC);
}
void TraceStreamerConfig::InitNrDirtierEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_DIRTY, SYS_VMEMINFO_NR_DIRTY_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_DIRTY_THRESHOLD, SYS_VMEMINFO_NR_DIRTY_THRESHOLD_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_DIRTY_BACKGROUND_THRESHOLD,
                                  SYS_VMEMINFO_NR_DIRTY_BACKGROUND_THRESHOLD_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_DIRTIED, SYS_VMEMINFO_NR_DIRTIED_DESC);
}
void TraceStreamerConfig::InitNrOtherEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_FREE_PAGES, SYS_VMEMINFO_NR_FREE_PAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ALLOC_BATCH, SYS_VMEMINFO_NR_ALLOC_BATCH_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_INACTIVE_ANON, SYS_VMEMINFO_NR_INACTIVE_ANON_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ACTIVE_ANON, SYS_VMEMINFO_NR_ACTIVE_ANON_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_INACTIVE_FILE, SYS_VMEMINFO_NR_INACTIVE_FILE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ACTIVE_FILE, SYS_VMEMINFO_NR_ACTIVE_FILE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_UNEVICTABLE, SYS_VMEMINFO_NR_UNEVICTABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_MLOCK, SYS_VMEMINFO_NR_MLOCK_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ANON_PAGES, SYS_VMEMINFO_NR_ANON_PAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_MAPPED, SYS_VMEMINFO_NR_MAPPED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_FILE_PAGES, SYS_VMEMINFO_NR_FILE_PAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_WRITEBACK, SYS_VMEMINFO_NR_WRITEBACK_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SLAB_RECLAIMABLE, SYS_VMEMINFO_NR_SLAB_RECLAIMABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SLAB_UNRECLAIMABLE,
                                  SYS_VMEMINFO_NR_SLAB_UNRECLAIMABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_PAGE_TABLE_PAGES, SYS_VMEMINFO_NR_PAGE_TABLE_PAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_KERNEL_STACK, SYS_VMEMINFO_NR_KERNEL_STACK_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_OVERHEAD, SYS_VMEMINFO_NR_OVERHEAD_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_UNSTABLE, SYS_VMEMINFO_NR_UNSTABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_BOUNCE, SYS_VMEMINFO_NR_BOUNCE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_VMSCAN_WRITE, SYS_VMEMINFO_NR_VMSCAN_WRITE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_VMSCAN_IMMEDIATE_RECLAIM,
                                  SYS_VMEMINFO_NR_VMSCAN_IMMEDIATE_RECLAIM_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_WRITEBACK_TEMP, SYS_VMEMINFO_NR_WRITEBACK_TEMP_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ISOLATED_ANON, SYS_VMEMINFO_NR_ISOLATED_ANON_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ISOLATED_FILE, SYS_VMEMINFO_NR_ISOLATED_FILE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SHMEM, SYS_VMEMINFO_NR_SHMEM_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_WRITTEN, SYS_VMEMINFO_NR_WRITTEN_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_PAGES_SCANNED, SYS_VMEMINFO_NR_PAGES_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ANON_TRANSPARENT_HUGEPAGES,
                                  SYS_VMEMINFO_NR_ANON_TRANSPARENT_HUGEPAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_FREE_CMA, SYS_VMEMINFO_NR_FREE_CMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SWAPCACHE, SYS_VMEMINFO_NR_SWAPCACHE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ZSPAGES, SYS_VMEMINFO_NR_ZSPAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ION_HEAP, SYS_VMEMINFO_NR_ION_HEAP_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_GPU_HEAP, SYS_VMEMINFO_NR_GPU_HEAP_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_FASTRPC, SYS_VMEMINFO_NR_FASTRPC_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_INDIRECTLY_RECLAIMABLE,
                                  SYS_VMEMINFO_NR_INDIRECTLY_RECLAIMABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_ION_HEAP_POOL, SYS_VMEMINFO_NR_ION_HEAP_POOL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_KERNEL_MISC_RECLAIMABLE,
                                  SYS_VMEMINFO_NR_KERNEL_MISC_RECLAIMABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SHADOW_CALL_STACK_BYTES,
                                  SYS_VMEMINFO_NR_SHADOW_CALL_STACK_BYTES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SHMEM_HUGEPAGES, SYS_VMEMINFO_NR_SHMEM_HUGEPAGES_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_SHMEM_PMDMAPPED, SYS_VMEMINFO_NR_SHMEM_PMDMAPPED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_NR_UNRECLAIMABLE_PAGES,
                                  SYS_VMEMINFO_NR_UNRECLAIMABLE_PAGES_DESC);
}
void TraceStreamerConfig::InitPgscanEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_KSWAPD_DMA, SYS_VMEMINFO_PGSCAN_KSWAPD_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_KSWAPD_NORMAL,
                                  SYS_VMEMINFO_PGSCAN_KSWAPD_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_KSWAPD_MOVABLE,
                                  SYS_VMEMINFO_PGSCAN_KSWAPD_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_DIRECT_DMA, SYS_VMEMINFO_PGSCAN_DIRECT_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_DIRECT_NORMAL,
                                  SYS_VMEMINFO_PGSCAN_DIRECT_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_DIRECT_MOVABLE,
                                  SYS_VMEMINFO_PGSCAN_DIRECT_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_DIRECT_THROTTLE,
                                  SYS_VMEMINFO_PGSCAN_DIRECT_THROTTLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_DIRECT, SYS_VMEMINFO_PGSCAN_DIRECT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSCAN_KSWAPD, SYS_VMEMINFO_PGSCAN_KSWAPD_DESC);
}
void TraceStreamerConfig::InitPgstealEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_KSWAPD_DMA, SYS_VMEMINFO_PGSTEAL_KSWAPD_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_KSWAPD_NORMAL,
                                  SYS_VMEMINFO_PGSTEAL_KSWAPD_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_KSWAPD_MOVABLE,
                                  SYS_VMEMINFO_PGSTEAL_KSWAPD_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_DIRECT_DMA, SYS_VMEMINFO_PGSTEAL_DIRECT_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_DIRECT_NORMAL,
                                  SYS_VMEMINFO_PGSTEAL_DIRECT_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_DIRECT_MOVABLE,
                                  SYS_VMEMINFO_PGSTEAL_DIRECT_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_DIRECT, SYS_VMEMINFO_PGSTEAL_DIRECT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSTEAL_KSWAPD, SYS_VMEMINFO_PGSTEAL_KSWAPD_DESC);
}
void TraceStreamerConfig::InitCompactEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_MIGRATE_SCANNED,
                                  SYS_VMEMINFO_COMPACT_MIGRATE_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_FREE_SCANNED,
                                  SYS_VMEMINFO_COMPACT_FREE_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_ISOLATED, SYS_VMEMINFO_COMPACT_ISOLATED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_STALL, SYS_VMEMINFO_COMPACT_STALL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_FAIL, SYS_VMEMINFO_COMPACT_FAIL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_SUCCESS, SYS_VMEMINFO_COMPACT_SUCCESS_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_DAEMON_WAKE, SYS_VMEMINFO_COMPACT_DAEMON_WAKE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_DAEMON_FREE_SCANNED,
                                  SYS_VMEMINFO_COMPACT_DAEMON_FREE_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_COMPACT_DAEMON_MIGRATE_SCANNED,
                                  SYS_VMEMINFO_COMPACT_DAEMON_MIGRATE_SCANNED_DESC);
}
void TraceStreamerConfig::InitUnevictableEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_CULLED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_CULLED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_SCANNED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_RESCUED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_RESCUED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_MLOCKED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_MLOCKED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_MUNLOCKED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_MUNLOCKED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_CLEARED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_CLEARED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNEVICTABLE_PGS_STRANDED,
                                  SYS_VMEMINFO_UNEVICTABLE_PGS_STRANDED_DESC);
}
void TraceStreamerConfig::InitPgreFillEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGREFILL_DMA, SYS_VMEMINFO_PGREFILL_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGREFILL_NORMAL, SYS_VMEMINFO_PGREFILL_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGREFILL_MOVABLE, SYS_VMEMINFO_PGREFILL_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGREFILL, SYS_VMEMINFO_PGREFILL_DESC);
}
void TraceStreamerConfig::InitWorkingSetEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_WORKINGSET_REFAULT, SYS_VMEMINFO_WORKINGSET_REFAULT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_WORKINGSET_ACTIVATE, SYS_VMEMINFO_WORKINGSET_ACTIVATE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_WORKINGSET_NODERECLAIM,
                                  SYS_VMEMINFO_WORKINGSET_NODERECLAIM_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_WORKINGSET_RESTORE, SYS_VMEMINFO_WORKINGSET_RESTORE_DESC);
}
void TraceStreamerConfig::InitPgEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGPGIN, SYS_VMEMINFO_PGPGIN_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGPGOUT, SYS_VMEMINFO_PGPGOUT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGPGOUTCLEAN, SYS_VMEMINFO_PGPGOUTCLEAN_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGALLOC_DMA, SYS_VMEMINFO_PGALLOC_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGALLOC_NORMAL, SYS_VMEMINFO_PGALLOC_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGALLOC_MOVABLE, SYS_VMEMINFO_PGALLOC_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGFREE, SYS_VMEMINFO_PGFREE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGACTIVATE, SYS_VMEMINFO_PGACTIVATE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGDEACTIVATE, SYS_VMEMINFO_PGDEACTIVATE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGFAULT, SYS_VMEMINFO_PGFAULT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGMAJFAULT, SYS_VMEMINFO_PGMAJFAULT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGROTATED, SYS_VMEMINFO_PGROTATED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGMIGRATE_SUCCESS, SYS_VMEMINFO_PGMIGRATE_SUCCESS_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGMIGRATE_FAIL, SYS_VMEMINFO_PGMIGRATE_FAIL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGINODESTEAL, SYS_VMEMINFO_PGINODESTEAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGLAZYFREE, SYS_VMEMINFO_PGLAZYFREE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGLAZYFREED, SYS_VMEMINFO_PGLAZYFREED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSKIP_DMA, SYS_VMEMINFO_PGSKIP_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSKIP_MOVABLE, SYS_VMEMINFO_PGSKIP_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PGSKIP_NORMAL, SYS_VMEMINFO_PGSKIP_NORMAL_DESC);
}
void TraceStreamerConfig::InitOtherEventSysVmemMap()
{
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_UNSPECIFIED, SYS_VMEMINFO_UNSPECIFIED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PSWPIN, SYS_VMEMINFO_PSWPIN_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PSWPOUT, SYS_VMEMINFO_PSWPOUT_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_SLABS_SCANNED, SYS_VMEMINFO_SLABS_SCANNED_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_KSWAPD_INODESTEAL, SYS_VMEMINFO_KSWAPD_INODESTEAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_KSWAPD_LOW_WMARK_HIT_QUICKLY,
                                  SYS_VMEMINFO_KSWAPD_LOW_WMARK_HIT_QUICKLY_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_KSWAPD_HIGH_WMARK_HIT_QUICKLY,
                                  SYS_VMEMINFO_KSWAPD_HIGH_WMARK_HIT_QUICKLY_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_PAGEOUTRUN, SYS_VMEMINFO_PAGEOUTRUN_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_ALLOCSTALL, SYS_VMEMINFO_ALLOCSTALL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_DROP_PAGECACHE, SYS_VMEMINFO_DROP_PAGECACHE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_DROP_SLAB, SYS_VMEMINFO_DROP_SLAB_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_ALLOCSTALL_DMA, SYS_VMEMINFO_ALLOCSTALL_DMA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_ALLOCSTALL_MOVABLE, SYS_VMEMINFO_ALLOCSTALL_MOVABLE_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_ALLOCSTALL_NORMAL, SYS_VMEMINFO_ALLOCSTALL_NORMAL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_OOM_KILL, SYS_VMEMINFO_OOM_KILL_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_SWAP_RA, SYS_VMEMINFO_SWAP_RA_DESC);
    sysVirtualMemNameMap_.emplace(SysVMeminfoType::VMEMINFO_SWAP_RA_HIT, SYS_VMEMINFO_SWAP_RA_HIT_DESC);
}
void TraceStreamerConfig::InitSysVmemMap()
{
    InitNrZoneEventSysVmemMap();
    InitNrDirtierEventSysVmemMap();
    InitNrOtherEventSysVmemMap();
    InitPgscanEventSysVmemMap();
    InitPgstealEventSysVmemMap();
    InitCompactEventSysVmemMap();
    InitUnevictableEventSysVmemMap();
    InitPgreFillEventSysVmemMap();
    InitWorkingSetEventSysVmemMap();
    InitPgEventSysVmemMap();
    InitOtherEventSysVmemMap();
}
#endif
void TraceStreamerConfig::InitSecurityMap()
{
    statSeverityDescMap_ = {
        {STAT_EVENT_RECEIVED, STAT_SEVERITY_LEVEL_INFO},      {STAT_EVENT_DATA_LOST, STAT_SEVERITY_LEVEL_ERROR},
        {STAT_EVENT_NOTMATCH, STAT_SEVERITY_LEVEL_INFO},      {STAT_EVENT_NOTSUPPORTED, STAT_SEVERITY_LEVEL_WARN},
        {STAT_EVENT_DATA_INVALID, STAT_SEVERITY_LEVEL_ERROR},
    };
    for (int i = 0; i < TRACE_EVENT_MAX; i++) {
        eventParserStatSeverityDescMap_.emplace(static_cast<SupportedTraceEventType>(i), statSeverityDescMap_);
    }
}
} // namespace TraceCfg
} // namespace SysTuning
