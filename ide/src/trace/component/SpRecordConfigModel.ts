/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
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

import {
  ArkTSConfig,
  CreateSessionRequest, FFRTConfig,
  FpsConfig,
  HiebpfConfig,
  HilogConfig,
  HiperfPluginConfig,
  levelFromJSON,
  MemoryConfig,
  NativeHookConfig,
  ProfilerSessionConfig,
  ProfilerSessionConfigBufferConfig,
  ProfilerSessionConfigBufferConfigPolicy,
  ProfilerSessionConfigMode,
  sysMeminfoTypeFromJSON,
  sysVMeminfoTypeFromJSON,
  TracePluginConfig,
} from './setting/bean/ProfilerServiceTypes';
import { SpRecordSetting } from './setting/SpRecordSetting';
import { SpVmTracker } from './setting/SpVmTracker';
import { SpProbesConfig } from './setting/SpProbesConfig';
import { info } from '../../log/Log';
import { SpAllocations } from './setting/SpAllocations';
import { SpApplication } from '../SpApplication';
import { PerfConfig, SpRecordPerf } from './setting/SpRecordPerf';
import { SpFileSystem } from './setting/SpFileSystem';
import { SpSdkConfig } from './setting/SpSdkConfig';
import { SpHisysEvent } from './setting/SpHisysEvent';
import { SpArkTs } from './setting/SpArkTs';
import { SpHilogRecord } from './setting/SpHilogRecord';
import { SpFFRTConfig } from './setting/SpFFRTConfig';
import { SpXPowerRecord } from './setting/SpXPowerRecord';

export const MEM_INFO = [
  'MEMINFO_ACTIVE',
  'MEMINFO_ACTIVE_ANON',
  'MEMINFO_ACTIVE_FILE',
  'MEMINFO_ANON_PAGES',
  'MEMINFO_BUFFERS',
  'MEMINFO_CACHED',
  'MEMINFO_CMA_FREE',
  'MEMINFO_CMA_TOTAL',
  'MEMINFO_COMMIT_LIMIT',
  'MEMINFO_COMMITED_AS',
  'MEMINFO_DIRTY',
  'MEMINFO_INACTIVE',
  'MEMINFO_INACTIVE_ANON',
  'MEMINFO_INACTIVE_FILE',
  'MEMINFO_KERNEL_STACK',
  'MEMINFO_MAPPED',
  'MEMINFO_MEM_AVAILABLE',
  'MEMINFO_MEM_FREE',
  'MEMINFO_MEM_TOTAL',
  'MEMINFO_MLOCKED',
  'MEMINFO_PAGE_TABLES',
  'MEMINFO_SHMEM',
  'MEMINFO_SLAB',
  'MEMINFO_SLAB_RECLAIMABLE',
  'MEMINFO_SLAB_UNRECLAIMABLE',
  'MEMINFO_SWAP_CACHED',
  'MEMINFO_SWAP_FREE',
  'MEMINFO_SWAP_TOTAL',
  'MEMINFO_UNEVICTABLE',
  'MEMINFO_VMALLOC_CHUNK',
  'MEMINFO_VMALLOC_TOTAL',
  'MEMINFO_VMALLOC_USED',
  'MEMINFO_WRITEBACK',
  'MEMINFO_KERNEL_RECLAIMABLE',
  'PMEM_ACTIVE_PURG',
  'PMEM_INACTIVE_PURG',
  'PMEM_PINED_PURG',
];

export const VMEM_INFO = [
  'VMEMINFO_UNSPECIFIED',
  'VMEMINFO_NR_FREE_PAGES',
  'VMEMINFO_NR_ALLOC_BATCH',
  'VMEMINFO_NR_INACTIVE_ANON',
  'VMEMINFO_NR_ACTIVE_ANON',
  'VMEMINFO_NR_INACTIVE_FILE',
  'VMEMINFO_NR_ACTIVE_FILE',
  'VMEMINFO_NR_UNEVICTABLE',
  'VMEMINFO_NR_MLOCK',
  'VMEMINFO_NR_ANON_PAGES',
  'VMEMINFO_NR_MAPPED',
  'VMEMINFO_NR_FILE_PAGES',
  'VMEMINFO_NR_DIRTY',
  'VMEMINFO_NR_WRITEBACK',
  'VMEMINFO_NR_SLAB_RECLAIMABLE',
  'VMEMINFO_NR_SLAB_UNRECLAIMABLE',
  'VMEMINFO_NR_PAGE_TABLE_PAGES',
  'VMEMINFO_NR_KERNEL_STACK',
  'VMEMINFO_NR_OVERHEAD',
  'VMEMINFO_NR_UNSTABLE',
  'VMEMINFO_NR_BOUNCE',
  'VMEMINFO_NR_VMSCAN_WRITE',
  'VMEMINFO_NR_VMSCAN_IMMEDIATE_RECLAIM',
  'VMEMINFO_NR_WRITEBACK_TEMP',
  'VMEMINFO_NR_ISOLATED_ANON',
  'VMEMINFO_NR_ISOLATED_FILE',
  'VMEMINFO_NR_SHMEM',
  'VMEMINFO_NR_DIRTIED',
  'VMEMINFO_NR_WRITTEN',
  'VMEMINFO_NR_PAGES_SCANNED',
  'VMEMINFO_WORKINGSET_REFAULT',
  'VMEMINFO_WORKINGSET_ACTIVATE',
  'VMEMINFO_WORKINGSET_NODERECLAIM',
  'VMEMINFO_NR_ANON_TRANSPARENT_HUGEPAGES',
  'VMEMINFO_NR_FREE_CMA',
  'VMEMINFO_NR_SWAPCACHE',
  'VMEMINFO_NR_DIRTY_THRESHOLD',
  'VMEMINFO_NR_DIRTY_BACKGROUND_THRESHOLD',
  'VMEMINFO_PGPGIN',
  'VMEMINFO_PGPGOUT',
  'VMEMINFO_PGPGOUTCLEAN',
  'VMEMINFO_PSWPIN',
  'VMEMINFO_PSWPOUT',
  'VMEMINFO_PGALLOC_DMA',
];

export const VMEM_INFO_SECOND = [
  'VMEMINFO_PGALLOC_NORMAL',
  'VMEMINFO_PGALLOC_MOVABLE',
  'VMEMINFO_PGFREE',
  'VMEMINFO_PGACTIVATE',
  'VMEMINFO_PGDEACTIVATE',
  'VMEMINFO_PGFAULT',
  'VMEMINFO_PGMAJFAULT',
  'VMEMINFO_PGREFILL_DMA',
  'VMEMINFO_PGREFILL_NORMAL',
  'VMEMINFO_PGREFILL_MOVABLE',
  'VMEMINFO_PGSTEAL_KSWAPD_DMA',
  'VMEMINFO_PGSTEAL_KSWAPD_NORMAL',
  'VMEMINFO_PGSTEAL_KSWAPD_MOVABLE',
  'VMEMINFO_PGSTEAL_DIRECT_DMA',
  'VMEMINFO_PGSTEAL_DIRECT_NORMAL',
  'VMEMINFO_PGSTEAL_DIRECT_MOVABLE',
  'VMEMINFO_PGSCAN_KSWAPD_DMA',
  'VMEMINFO_PGSCAN_KSWAPD_NORMAL',
  'VMEMINFO_PGSCAN_KSWAPD_MOVABLE',
  'VMEMINFO_PGSCAN_DIRECT_DMA',
  'VMEMINFO_PGSCAN_DIRECT_NORMAL',
  'VMEMINFO_PGSCAN_DIRECT_MOVABLE',
  'VMEMINFO_PGSCAN_DIRECT_THROTTLE',
  'VMEMINFO_PGINODESTEAL',
  'VMEMINFO_SLABS_SCANNED',
  'VMEMINFO_KSWAPD_INODESTEAL',
  'VMEMINFO_KSWAPD_LOW_WMARK_HIT_QUICKLY',
  'VMEMINFO_KSWAPD_HIGH_WMARK_HIT_QUICKLY',
  'VMEMINFO_PAGEOUTRUN',
  'VMEMINFO_ALLOCSTALL',
  'VMEMINFO_PGROTATED',
  'VMEMINFO_DROP_PAGECACHE',
  'VMEMINFO_DROP_SLAB',
  'VMEMINFO_PGMIGRATE_SUCCESS',
  'VMEMINFO_PGMIGRATE_FAIL',
  'VMEMINFO_COMPACT_MIGRATE_SCANNED',
  'VMEMINFO_COMPACT_FREE_SCANNED',
  'VMEMINFO_COMPACT_ISOLATED',
  'VMEMINFO_COMPACT_STALL',
  'VMEMINFO_COMPACT_FAIL',
  'VMEMINFO_COMPACT_SUCCESS',
  'VMEMINFO_COMPACT_DAEMON_WAKE',
  'VMEMINFO_UNEVICTABLE_PGS_CULLED',
  'VMEMINFO_UNEVICTABLE_PGS_SCANNED',
  'VMEMINFO_UNEVICTABLE_PGS_RESCUED',
  'VMEMINFO_UNEVICTABLE_PGS_MLOCKED',
  'VMEMINFO_UNEVICTABLE_PGS_MUNLOCKED',
];

export const VMEM_INFO_THIRD = [
  'VMEMINFO_UNEVICTABLE_PGS_CLEARED',
  'VMEMINFO_UNEVICTABLE_PGS_STRANDED',
  'VMEMINFO_NR_ZSPAGES',
  'VMEMINFO_NR_ION_HEAP',
  'VMEMINFO_NR_GPU_HEAP',
  'VMEMINFO_ALLOCSTALL_DMA',
  'VMEMINFO_ALLOCSTALL_MOVABLE',
  'VMEMINFO_ALLOCSTALL_NORMAL',
  'VMEMINFO_COMPACT_DAEMON_FREE_SCANNED',
  'VMEMINFO_COMPACT_DAEMON_MIGRATE_SCANNED',
  'VMEMINFO_NR_FASTRPC',
  'VMEMINFO_NR_INDIRECTLY_RECLAIMABLE',
  'VMEMINFO_NR_ION_HEAP_POOL',
  'VMEMINFO_NR_KERNEL_MISC_RECLAIMABLE',
  'VMEMINFO_NR_SHADOW_CALL_STACK_BYTES',
  'VMEMINFO_NR_SHMEM_HUGEPAGES',
  'VMEMINFO_NR_SHMEM_PMDMAPPED',
  'VMEMINFO_NR_UNRECLAIMABLE_PAGES',
  'VMEMINFO_NR_ZONE_ACTIVE_ANON',
  'VMEMINFO_NR_ZONE_ACTIVE_FILE',
  'VMEMINFO_NR_ZONE_INACTIVE_ANON',
  'VMEMINFO_NR_ZONE_INACTIVE_FILE',
  'VMEMINFO_NR_ZONE_UNEVICTABLE',
  'VMEMINFO_NR_ZONE_WRITE_PENDING',
  'VMEMINFO_OOM_KILL',
  'VMEMINFO_PGLAZYFREE',
  'VMEMINFO_PGLAZYFREED',
  'VMEMINFO_PGREFILL',
  'VMEMINFO_PGSCAN_DIRECT',
  'VMEMINFO_PGSCAN_KSWAPD',
  'VMEMINFO_PGSKIP_DMA',
  'VMEMINFO_PGSKIP_MOVABLE',
  'VMEMINFO_PGSKIP_NORMAL',
  'VMEMINFO_PGSTEAL_DIRECT',
  'VMEMINFO_PGSTEAL_KSWAPD',
  'VMEMINFO_SWAP_RA',
  'VMEMINFO_SWAP_RA_HIT',
  'VMEMINFO_WORKINGSET_RESTORE',
];
// sys.mem.total   sys.mem.free sys.mem.buffers sys.mem.cached  sys.mem.shmem  sys.mem.slab  sys.mem.swap.total
// sys.mem.swap.free sys.mem.mapped  sys.mem.vmalloc.used  sys.mem.page.tables  sys.mem.kernel.stack
// sys.mem.active sys.mem.inactive  sys.mem.unevictable  sys.mem.vmalloc.total sys.mem.slab.unreclaimable
// sys.mem.cma.total sys.mem.cma.free
export const ABALITY_MEM_INFO = [
  'MEMINFO_MEM_TOTAL',
  'MEMINFO_MEM_FREE',
  'MEMINFO_BUFFERS',
  'MEMINFO_CACHED',
  'MEMINFO_SHMEM',
  'MEMINFO_SLAB',
  'MEMINFO_SWAP_TOTAL',
  'MEMINFO_SWAP_FREE',
  'MEMINFO_MAPPED',
  'MEMINFO_VMALLOC_USED',
  'MEMINFO_PAGE_TABLES',
  'MEMINFO_KERNEL_STACK',
  'MEMINFO_ACTIVE',
  'MEMINFO_INACTIVE',
  'MEMINFO_UNEVICTABLE',
  'MEMINFO_VMALLOC_TOTAL',
  'MEMINFO_SLAB_UNRECLAIMABLE',
  'MEMINFO_CMA_TOTAL',
  'MEMINFO_CMA_FREE',
  'MEMINFO_KERNEL_RECLAIMABLE',
  'PMEM_ACTIVE_PURG',
  'PMEM_INACTIVE_PURG',
  'PMEM_PINED_PURG',
];

export const schedulingEvents = [
  'sched/sched_switch',
  'power/suspend_resume',
  'sched/sched_wakeup',
  'sched/sched_wakeup_new',
  'sched/sched_waking',
  'sched/sched_process_exit',
  'sched/sched_process_free',
  'task/task_newtask',
  'task/task_rename',
];

export const powerEvents = [
  'regulator/regulator_set_voltage',
  'regulator/regulator_set_voltage_complete',
  'power/clock_enable',
  'power/clock_disable',
  'power/clock_set_rate',
  'power/suspend_resume',
];

export const cpuFreqEvents = ['power/cpu_frequency', 'power/cpu_idle', 'power/suspend_resume'];

export const sysCallsEvents = ['raw_syscalls/sys_enter', 'raw_syscalls/sys_exit'];

export const highFrequencyEvents = [
  'mm_event/mm_event_record',
  'kmem/rss_stat',
  'ion/ion_stat',
  'dmabuf_heap/dma_heap_stat',
  'kmem/ion_heap_grow',
  'kmem/ion_heap_shrink',
];

export const advancedConfigEvents = [
  'sched/sched_switch',
  'sched/sched_wakeup',
  'sched/sched_wakeup_new',
  'sched/sched_waking',
  'sched/sched_process_exit',
  'sched/sched_process_free',
  'irq/irq_handler_entry',
  'irq/irq_handler_exit',
  'irq/softirq_entry',
  'irq/softirq_exit',
  'irq/softirq_raise',
  'power/clock_disable',
  'power/clock_enable',
  'power/clock_set_rate',
  'power/cpu_frequency',
  'power/cpu_idle',
  'clk/clk_disable',
  'clk/clk_disable_complete',
  'clk/clk_enable',
  'clk/clk_enable_complete',
  'clk/clk_set_rate',
  'clk/clk_set_rate_complete',
  'binder/binder_transaction',
  'binder/binder_transaction_alloc_buf',
  'binder/binder_transaction_received',
  'binder/binder_lock',
  'binder/binder_locked',
  'binder/binder_unlock',
  'workqueue/workqueue_execute_start',
  'workqueue/workqueue_execute_end',
  'oom/oom_score_adj_update',
  'ftrace/print',
];

export function createSessionRequest(recordSetting: SpRecordSetting): CreateSessionRequest {
  let bufferConfig: ProfilerSessionConfigBufferConfig = {
    pages: recordSetting.bufferSize * 256,
    policy: ProfilerSessionConfigBufferConfigPolicy.RECYCLE,
  };
  let sessionConfig: ProfilerSessionConfig = {
    buffers: [bufferConfig],
    sessionMode: ProfilerSessionConfigMode.OFFLINE,
    resultMaxSize: 0,
    keepAliveTime: 0,
  };
  return {
    requestId: 1,
    sessionConfig: sessionConfig,
    pluginConfigs: [],
  };
}

export function createMemoryPluginConfig(
  reportingFrequency: number,
  spVmTracker: SpVmTracker,
  probesConfig: SpProbesConfig,
  request: CreateSessionRequest
): void {
  let hasSamp = spVmTracker!.startSamp && spVmTracker!.process !== '';
  if (probesConfig!.memoryConfig.length > 0 || hasMonitorMemory || hasSamp) {
    let memoryConfig = initMemoryPluginConfig(hasSamp, spVmTracker, probesConfig);
    if (hasMonitorMemory) {
      ABALITY_MEM_INFO.forEach((va) => {
        memoryConfig.sysMeminfoCounters.push(sysMeminfoTypeFromJSON(va));
      });
    }
    probesConfig!.memoryConfig.forEach((value) => {
      if (value.indexOf('Kernel meminfo') !== -1) {
        if (hasMonitorMemory) {
          memoryConfig.sysMeminfoCounters = [];
        }
        MEM_INFO.forEach((va) => {
          memoryConfig.sysMeminfoCounters.push(sysMeminfoTypeFromJSON(va));
        });
      }
      if (value.indexOf('Virtual memory stats') !== -1) {
        VMEM_INFO.forEach((me) => {
          memoryConfig.sysVmeminfoCounters.push(sysVMeminfoTypeFromJSON(me));
        });
        VMEM_INFO_SECOND.forEach((me) => {
          memoryConfig.sysVmeminfoCounters.push(sysVMeminfoTypeFromJSON(me));
        });
        VMEM_INFO_THIRD.forEach((me) => {
          memoryConfig.sysVmeminfoCounters.push(sysVMeminfoTypeFromJSON(me));
        });
      }
    });
    request.pluginConfigs.push({
      pluginName: 'memory-plugin',
      sampleInterval: reportingFrequency * 1000,
      configData: memoryConfig,
    });
  }
}

function initMemoryPluginConfig(
  hasSamp: boolean,
  spVmTracker: SpVmTracker,
  probesConfig: SpProbesConfig
): MemoryConfig {
  let memoryConfig: MemoryConfig = {
    reportProcessTree: false,
    reportSysmemMemInfo: false,
    sysMeminfoCounters: [],
    reportSysmemVmemInfo: false,
    sysVmeminfoCounters: [],
    reportProcessMemInfo: false,
    reportAppMemInfo: false,
    reportAppMemByMemoryService: false,
    pid: [],
  };
  if (probesConfig!.memoryConfig.length > 0 || hasMonitorMemory) {
    memoryConfig.reportProcessTree = true;
    memoryConfig.reportSysmemMemInfo = true;
    memoryConfig.reportSysmemVmemInfo = true;
    memoryConfig.reportProcessMemInfo = true;
  }
  if (spVmTracker!.startSamp) {
    memoryConfig.reportProcessMemInfo = true;
  }
  if (hasSamp || hasMonitorMemory) {
    memoryConfig.reportPurgeableAshmemInfo = true;
    memoryConfig.reportDmaMemInfo = true;
    memoryConfig.reportGpuMemInfo = true;
  }
  if (hasSamp) {
    memoryConfig.reportSmapsMemInfo = true;
    memoryConfig.reportGpuDumpInfo = true;
    let pid = Number(spVmTracker?.process);
    memoryConfig.pid.push(pid);
  }
  return memoryConfig;
}

export function createHTracePluginConfig(probesConfig: SpProbesConfig, request: CreateSessionRequest): void {
  if (probesConfig!.traceConfig.length > 0 && probesConfig!.traceConfig.find((value) => value !== 'FPS')) {
    let tracePluginConfig: TracePluginConfig = {
      ftraceEvents: createTraceEvents(probesConfig!.traceConfig),
      hitraceCategories: [],
      hitraceApps: [],
      bufferSizeKb: probesConfig!.ftraceBufferSize,
      flushIntervalMs: 1000,
      flushThresholdKb: 4096,
      parseKsyms: true,
      clock: 'boot',
      tracePeriodMs: 200,
      rawDataPrefix: '',
      traceDurationMs: 0,
      debugOn: false,
    };
    if (probesConfig!.traceEvents.length > 0) {
      tracePluginConfig.hitraceCategories = probesConfig!.traceEvents;
    }
    request.pluginConfigs.push({
      pluginName: 'ftrace-plugin',
      sampleInterval: 1000,
      configData: tracePluginConfig,
    });
  }
}

export function createFpsPluginConfig(probesConfig: SpProbesConfig, request: CreateSessionRequest): void {
  let fpsConfig: FpsConfig = {
    reportFps: true,
  };
  if (probesConfig!.traceConfig.length > 0 && probesConfig!.traceConfig.indexOf('FPS') !== -1) {
    request.pluginConfigs.push({
      pluginName: 'hidump-plugin',
      sampleInterval: 1000,
      configData: fpsConfig,
    });
  }
}

export function createMonitorPlugin(probesConfig: SpProbesConfig, request: CreateSessionRequest): void {
  hasMonitorMemory = probesConfig.recordAbility;
  if (!probesConfig.recordAbility) {
    return;
  }
  let cpuPlugin = {
    pluginName: 'cpu-plugin',
    sampleInterval: 1000,
    configData: {
      pid: 0,
      reportProcessInfo: true,
    },
  };
  let processPlugin = {
    pluginName: 'process-plugin',
    sampleInterval: 1000,
    configData: {
      report_process_tree: true,
      report_cpu: true,
      report_diskio: true,
      report_pss: true,
    },
  };
  let diskIoPlugin = {
    pluginName: 'diskio-plugin',
    sampleInterval: 1000,
    configData: {
      reportIoStats: 'IO_REPORT',
    },
  };
  let netWorkPlugin = {
    pluginName: 'network-plugin',
    sampleInterval: 1000,
    configData: {},
  };
  request.pluginConfigs.push(processPlugin);
  request.pluginConfigs.push(cpuPlugin);
  request.pluginConfigs.push(diskIoPlugin);
  request.pluginConfigs.push(netWorkPlugin);
}

export function createNativePluginConfig(
  reportingFrequency: number,
  spAllocations: SpAllocations,
  selectVersion: string | null,
  request: CreateSessionRequest
): void {
  if (spAllocations!.appProcess !== '' && spAllocations!.startSamp) {
    let nativeConfig = initNativePluginConfig(spAllocations, selectVersion);
    let maxProcessSize = 4;
    if (selectVersion !== undefined && selectVersion !== '3.2' && selectVersion !== 'unknown') {
      nativeConfig.callframeCompress = true;
      nativeConfig.recordAccurately = spAllocations!.record_accurately;
      nativeConfig.offlineSymbolization = spAllocations!.offline_symbolization;
      if (spAllocations!.record_statistics) {
        nativeConfig.statisticsInterval = spAllocations!.statistics_interval;
      }
      nativeConfig.startupMode = spAllocations!.startup_mode;
      if (spAllocations!.response_lib_mode) {
        nativeConfig.responseLibraryMode = spAllocations!.response_lib_mode;
        maxProcessSize = 8;
      }
      if (spAllocations && spAllocations.sample_interval) {
        if (spAllocations.record_statistics) {
          nativeConfig.sampleInterval = spAllocations.sample_interval;
        } else {
          nativeConfig.mallocFreeMatchingInterval = spAllocations.sample_interval;
        }
      }
      nativeConfig.jsStackReport = spAllocations!.recordJsStack ? 1 : 0;
      if (spAllocations!.recordJsStack) {
        nativeConfig.maxJsStackDepth = spAllocations!.max_js_stack_depth;
        nativeConfig.filterNapiName = spAllocations!.filter_napi_name;
      }
    }
    if (spAllocations!.expandPids.length > 1) {
      nativeConfig.expandPids = spAllocations!.expandPids.splice(0, maxProcessSize);
    }
    request.pluginConfigs.push({
      pluginName: 'nativehook',
      sampleInterval: reportingFrequency * 1000,
      configData: nativeConfig,
    });
  }
}

function initNativePluginConfig(spAllocations: SpAllocations, selectVersion: string | null): NativeHookConfig {
  let appProcess = spAllocations!.appProcess;
  let processName = '';
  let processId = '';
  if (spAllocations!.startup_mode && selectVersion !== '3.2' && selectVersion !== 'unknown') {
    processName = appProcess;
  } else {
    if (appProcess.indexOf('(') !== -1) {
      processId = appProcess.slice(appProcess.lastIndexOf('(') + 1, appProcess.lastIndexOf(')'));
    } else {
      processId = appProcess;
    }
    if (/^[0-9]+.?[0-9]*/.test(processId)) {
      let pid = Number(processId);
    } else {
      processName = appProcess;
    }
  }
  let nativeConfig: NativeHookConfig;
  if (spAllocations!.expandPids.length === 1) {
    nativeConfig = {
      pid: spAllocations!.expandPids[0],
      saveFile: false,
      fileName: '',
      filterSize: spAllocations!.filter,
      smbPages: spAllocations!.shared,
      maxStackDepth: spAllocations!.unwind,
      processName: processName,
      stringCompressed: true,
      fpUnwind: spAllocations!.fp_unwind,
      blocked: true,
    };
  } else {
    nativeConfig = {
      saveFile: false,
      fileName: '',
      filterSize: spAllocations!.filter,
      smbPages: spAllocations!.shared,
      maxStackDepth: spAllocations!.unwind,
      processName: processName,
      stringCompressed: true,
      fpUnwind: spAllocations!.fp_unwind,
      blocked: true,
    };
  }
  return nativeConfig;
}

function initHiPerfConfig(perfConfig: PerfConfig | undefined, recordArgs: string): string {
  if (!perfConfig) {
    return '';
  }
  if (perfConfig.cpu && !perfConfig.cpu.includes('ALL') && perfConfig.cpu.length > 0) {
    recordArgs = `${recordArgs} -c ${perfConfig.cpu}`;
  }
  if (perfConfig.cpuPercent !== 0) {
    recordArgs = `${recordArgs} --cpu-limit ${perfConfig.cpuPercent}`;
  }
  if (perfConfig.eventList && !perfConfig.eventList.includes('NONE') && perfConfig.eventList.length > 0) {
    recordArgs = `${recordArgs} -e ${perfConfig.eventList}`;
    if (perfConfig.isOffCpu) {
      recordArgs = `${recordArgs},sched:sched_waking`;
    }
  } else {
    recordArgs = `${recordArgs} -e hw-cpu-cycles`;
    if (perfConfig.isOffCpu) {
      recordArgs = `${recordArgs},sched:sched_waking`;
    }
  }
  if (perfConfig.callStack !== 'none') {
    recordArgs = `${recordArgs} --call-stack ${perfConfig.callStack}`;
  }
  if (perfConfig.branch !== 'none') {
    recordArgs = `${recordArgs} -j ${perfConfig.branch}`;
  }
  if (perfConfig.clockType) {
    recordArgs = `${recordArgs} --clockid ${perfConfig.clockType}`;
  }
  if (perfConfig.isOffCpu) {
    recordArgs = `${recordArgs} --offcpu`;
  }
  if (perfConfig?.isKernelChain) {
    recordArgs = `${recordArgs} --kernel-callchain`;
  }
  if (perfConfig.noInherit) {
    recordArgs = `${recordArgs} --no-inherit`;
  }
  if (perfConfig.mmap) {
    recordArgs = `${recordArgs} -m ${perfConfig.mmap}`;
  }
  return recordArgs;
}

export function createHiPerfConfig(
  reportingFrequency: number,
  spRecordPerf: SpRecordPerf,
  recordSetting: SpRecordSetting,
  request: CreateSessionRequest
): void {
  if (!spRecordPerf!.startSamp) {
    return;
  }
  let perfConfig = spRecordPerf!.getPerfConfig();
  let recordArgs = '';
  recordArgs = `${recordArgs}-f ${perfConfig?.frequency}`;
  if (perfConfig?.process && !perfConfig?.process.includes('ALL') && perfConfig?.process.length > 0) {
    let process = perfConfig.process;
    if (process.indexOf(',') !== -1) {
      let processIdOrName = process.split(',');
      if (!isNaN(Number(processIdOrName[0]))) {
        recordArgs = `${recordArgs} -p ${perfConfig?.process}`;
      } else {
        recordArgs = `${recordArgs} --app ${perfConfig?.process}`;
      }
    } else {
      if (!isNaN(Number(process))) {
        recordArgs = `${recordArgs} -p ${perfConfig?.process}`;
      } else {
        recordArgs = `${recordArgs} --app ${perfConfig?.process}`;
      }
    }
  } else {
    recordArgs = `${recordArgs} -a --exclude-hiperf`;
  }
  recordArgs = initHiPerfConfig(perfConfig, recordArgs);
  info('record config Args is: ', recordArgs);
  let hiPerf: HiperfPluginConfig = {
    isRoot: false,
    outfileName: '/data/local/tmp/perf.data',
    recordArgs: recordArgs,
  };
  if (SpApplication.isLongTrace) {
    hiPerf.splitOutfileName = `${recordSetting!.longOutPath}hiprofiler_data_hiperf.htrace`;
  }
  request.pluginConfigs.push({
    pluginName: 'hiperf-plugin',
    sampleInterval: reportingFrequency * 1000,
    configData: hiPerf,
  });
}

export function createSystemConfig(
  spFileSystem: SpFileSystem,
  recordSetting: SpRecordSetting,
  request: CreateSessionRequest
): void {
  if (!spFileSystem!.startRecord) {
    return;
  }
  let systemConfig = spFileSystem!.getSystemConfig();
  let recordArgs = 'hiebpf';
  let recordEvent = [];
  if (spFileSystem?.startFileSystem) {
    recordEvent.push('fs');
  }
  if (spFileSystem?.startVirtualMemory) {
    recordEvent.push('ptrace');
  }
  if (spFileSystem?.startIo) {
    recordEvent.push('bio');
  }
  if (recordEvent.length > 0) {
    recordArgs += ` --events ${recordEvent.toString()}`;
  }
  recordArgs += ` --duration ${recordSetting?.maxDur}`;
  if (systemConfig?.process && !systemConfig?.process.includes('ALL') && systemConfig?.process.length > 0) {
    recordArgs = `${recordArgs} --pids ${systemConfig?.process}`;
  }
  recordArgs += ` --max_stack_depth ${systemConfig?.unWindLevel}`;
  let systemPluginConfig: HiebpfConfig = {
    cmdLine: recordArgs,
    outfileName: '/data/local/tmp/ebpf.data',
  };
  if (SpApplication.isLongTrace) {
    systemPluginConfig.splitOutfileName = `${recordSetting?.longOutPath}hiprofiler_data_ebpf.htrace`;
  }
  request.pluginConfigs.push({
    pluginName: 'hiebpf-plugin',
    sampleInterval: 1000,
    configData: systemPluginConfig,
  });
}

export function createSdkConfig(spSdkConfig: SpSdkConfig, request: CreateSessionRequest): void {
  if (spSdkConfig.startSamp && spSdkConfig.getPlugName() !== '') {
    let gpuConfig = spSdkConfig!.getGpuConfig();
    request.pluginConfigs.push({
      pluginName: spSdkConfig!.getPlugName(),
      sampleInterval: spSdkConfig!.getSampleInterval(),
      configData: gpuConfig,
    });
  }
  return;
}

export function createHiSystemEventPluginConfig(spHiSysEvent: SpHisysEvent, request: CreateSessionRequest): void {
  if (!spHiSysEvent.startSamp) {
    return;
  }
  request.pluginConfigs.push({
    pluginName: 'hisysevent-plugin',
    configData: {
      msg: 'hisysevent-plugin',
      subscribe_domain: spHiSysEvent.domain,
      subscribe_event: spHiSysEvent.eventName,
    },
  });
}

export function createArkTsConfig(
  spArkTs: SpArkTs,
  recordSetting: SpRecordSetting,
  request: CreateSessionRequest
): void {
  if (spArkTs.process !== '' && spArkTs.startSamp) {
    let process = spArkTs!.process;
    let re = /^[0-9]+.?[0-9]*/;
    let pid = 0;
    let processId = '';
    if (process.indexOf('(') !== -1) {
      processId = process.slice(process.lastIndexOf('(') + 1, process.lastIndexOf(')'));
    } else {
      processId = process;
    }
    if (re.test(processId)) {
      pid = Number(processId);
    }
    let arkTSConfig: ArkTSConfig = {
      pid: pid,
      type: spArkTs.radioBoxType,
      interval: spArkTs.intervalValue,
      capture_numeric_value: spArkTs.grabNumeric,
      track_allocations: spArkTs.grabAllocations,
      enable_cpu_profiler: spArkTs.grabCpuProfiler,
      cpu_profiler_interval: spArkTs.intervalCpuValue,
    };
    if (SpApplication.isLongTrace) {
      arkTSConfig.splitOutfileName = `${recordSetting?.longOutPath}hiprofiler_data_arkts.htrace`;
    }
    request.pluginConfigs.push({
      pluginName: 'arkts-plugin',
      sampleInterval: 5000,
      configData: arkTSConfig,
    });
  }
  return;
}

export function createHiLogConfig(
  reportingFrequency: number,
  spHiLog: SpHilogRecord,
  request: CreateSessionRequest
): void {
  if (!spHiLog.recordHilog) {
    return;
  }
  let appProcess = spHiLog!.appProcess;
  let re = /^[0-9]+.?[0-9]*/;
  let pid = 0;
  let processId = '';
  if (appProcess.indexOf('(') !== -1) {
    processId = appProcess.slice(appProcess.lastIndexOf('(') + 1, appProcess.lastIndexOf(')'));
  } else {
    processId = appProcess;
  }
  if (re.test(processId)) {
    pid = Number(processId);
  }
  let hiLogConfig: HilogConfig = {
    pid: pid,
    logLevel: levelFromJSON(spHiLog!.appLogLevel),
    needClear: true,
  };
  request.pluginConfigs.push({
    pluginName: 'hilog-plugin',
    sampleInterval: reportingFrequency * 1000,
    configData: hiLogConfig,
  });
}

export function createFFRTPluginConfig(
  currentConfigPage: SpFFRTConfig,
  selectVersion: string | null,
  request: CreateSessionRequest
): void {
  if (currentConfigPage &&
    (
      currentConfigPage.processIds.length > 0 ||
      currentConfigPage.restartProcessNames.length > 0 ||
      currentConfigPage.startupProcessNames.length > 0
    ) &&
    currentConfigPage.startSamp) {
    let config: FFRTConfig = {};
    if (currentConfigPage.processIds.length > 0) {
      config.pid = currentConfigPage.processIds;
    }
    if (currentConfigPage.startupProcessNames.length > 0) {
      config.startupProcessName = currentConfigPage!.startupProcessNames;
    }
    if (currentConfigPage.restartProcessNames.length > 0) {
      config.restartProcessName = currentConfigPage.restartProcessNames;
    }
    config.smbPages = currentConfigPage.smbPages;
    config.flushInterval = currentConfigPage.flushInterval;
    config.block = currentConfigPage.useBlock;
    config.clockId = currentConfigPage!.clockType;
    request.pluginConfigs.push({
      pluginName: 'ffrt-profiler',
      configData: config,
    });
  }
}

export function createTraceEvents(traceConfig: Array<string>): Array<string> {
  let traceEvents = new Set<string>();
  traceConfig.forEach((config) => {
    switch (config) {
      case 'Scheduling details':
        schedulingEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
      case 'CPU Frequency and idle states':
        cpuFreqEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
      case 'High frequency memory':
        highFrequencyEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
      case 'Advanced ftrace config':
        advancedConfigEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
      case 'Syscalls':
        sysCallsEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
      case 'Board voltages & frequency':
        powerEvents.forEach((eve: string) => {
          traceEvents.add(eve);
        });
        break;
    }
  });
  let ftraceEventsArray: string[] = [];
  info('traceEvents length is: ', traceEvents.size);
  for (const ftraceEvent of traceEvents) {
    ftraceEventsArray.push(ftraceEvent);
  }
  return ftraceEventsArray;
}

export function createXPowerConfig(
  spXPower: SpXPowerRecord,
  request: CreateSessionRequest
): void {
  if (!spXPower.recordXPower) {
    return;
  }
  let type = spXPower.getXpowerConfig();
  let typeList: Array<string> = [];
  typeList = type!.split(',');
  let bundleName = spXPower.process || '';
  let xPowerConfig = {
    bundle_name: bundleName,
    messageType: typeList
  };
  request.pluginConfigs.push({
    pluginName: 'xpower-plugin',
    sampleInterval: 1000,
    is_protobuf_serialize: true,
    configData: xPowerConfig,
  });
}

let hasMonitorMemory = false;
