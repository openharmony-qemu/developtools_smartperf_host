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

export interface ProfilerSessionConfigBufferConfig {
  pages: number;
  policy: ProfilerSessionConfigBufferConfigPolicy;
}

export enum ProfilerSessionConfigBufferConfigPolicy {
  RECYCLE = 0,
  FLATTEN = 1,
  UNRECOGNIZED = 2,
}

export interface ProfilerSessionConfig {
  buffers: ProfilerSessionConfigBufferConfig[];
  sessionMode: ProfilerSessionConfigMode;
  splitFile?: boolean;
  splitFileMaxSizeMb?: number;
  splitFileMaxNum?: number;
  /** for OFFLINE mode, result file max size in KB */
  resultMaxSize: number;
  /** if set to non-zero value, session will auto-destroyed after CreateSession in ms */
  keepAliveTime: number;
}

export enum ProfilerSessionConfigMode {
  /** OFFLINE - save all plugin results to result file. */
  OFFLINE = 0,
  /** ONLINE - push all plugin results to host PC with streamed FetchDataResponse. */
  ONLINE = 1,
  UNRECOGNIZED = -1,
}

export interface TracePluginConfig {
  /** kernel event set */
  ftraceEvents: string[];
  /** bytrace event set */
  hitraceCategories: string[];
  /** bytrace app set */
  hitraceApps: string[];
  /** kernel trace buffer size */
  bufferSizeKb: number;
  /** time interval in milliseconds to notify service process */
  flushIntervalMs: number;
  /** buffer water mark threshold to notify service process */
  flushThresholdKb: number;
  /** parse /proc/kallsyms or not */
  parseKsyms: boolean;
  /** value for trace_clock */
  clock: string;
  /** time interval in milliseconds to read kernel trace buffer */
  tracePeriodMs: number;
  /** raw data file prefix for debug */
  rawDataPrefix: string;
  /** time duration in millisconds for trace actions */
  traceDurationMs: number;
  /** enable debug options */
  debugOn: boolean;
}

export interface CreateSessionRequest {
  requestId: number;
  sessionConfig: ProfilerSessionConfig | undefined;
  pluginConfigs: ProfilerPluginConfig<unknown>[];
}

export interface ProfilerPluginConfig<T> {
  pluginName: string;
  sampleInterval?: number;
  configData: T;
  is_protobuf_serialize?: boolean;
}

export interface HiebpfConfig {
  cmdLine: string;
  outfileName: string;
  splitOutfileName?: string;
}

export interface MemoryConfig {
  /** set true to report process list */
  reportProcessTree: boolean;
  /** set true to report memory counter from /proc/meminfo */
  reportSysmemMemInfo: boolean;
  /** set required counter list of system meminfo, eg:MemTotal, MemFree, etc. */
  sysMeminfoCounters: SysMeminfoType[];
  /** set true to report memory counter from /proc/vmstat */
  reportSysmemVmemInfo: boolean;
  /** set required counter list of virtual system meminfo, eg:nr_free_pages, nr_anon_pages, etc. */
  sysVmeminfoCounters: SysVMeminfoType[];
  /** set true to report process meminfo from /proc/${pid}/stat */
  reportProcessMemInfo: boolean;
  /** set true to report application memory usage summary, eg:java heap memory, native heap, stack memory, etc. */
  reportAppMemInfo: boolean;
  /**
   * set true to report application memory by memory service, otherwise,
   * application memory will count up by /proc/${pid}/smaps information
   */
  reportAppMemByMemoryService: boolean;
  /** set required pid list */
  pid: number[];
  /** set true to report smaps meminfo from /proc/${pid}/smaps */
  reportSmapsMemInfo?: boolean;
  /** set true to report ashmem meminfo from /proc/purgeable_ashmem_trigger*/
  reportPurgeableAshmemInfo?: boolean;
  /** set true to report DMA meminfo from /proc/process_dmabuf_info. */
  reportDmaMemInfo?: boolean;
  /** set true to report gpu meminfo from /proc/gpu_memory. */
  reportGpuMemInfo?: boolean;
  /** set true to report gpu info from hidumper. */
  reportGpuDumpInfo?: boolean;
}

const switchCase = (object: unknown): SysVMeminfoType => {
  if (typeof object === 'number') {
    let sysVMemInfos = Object.keys(SysVMeminfoType);
    if (object < 0) {
      let sysInfo = sysVMemInfos[0];
      // @ts-ignore
      return SysVMeminfoType[sysInfo];
    } else {
      let infoType = sysVMemInfos[object + 1];
      if (infoType) {
        // @ts-ignore
        return SysVMeminfoType[infoType];
      }
    }
    return SysVMeminfoType.UNRECOGNIZED;
  } else {
    // @ts-ignore
    return SysVMeminfoType[object];
  }
};

export function sysVMeminfoTypeFromJSON(object: unknown): SysVMeminfoType {
  return switchCase(object);
}

export enum SysVMeminfoType {
  UNRECOGNIZED = 'UNRECOGNIZED',
  VMEMINFO_UNSPECIFIED = 'VMEMINFO_UNSPECIFIED',
  VMEMINFO_NR_FREE_PAGES = 'VMEMINFO_NR_FREE_PAGES',
  VMEMINFO_NR_ALLOC_BATCH = 'VMEMINFO_NR_ALLOC_BATCH',
  VMEMINFO_NR_INACTIVE_ANON = 'VMEMINFO_NR_INACTIVE_ANON',
  VMEMINFO_NR_ACTIVE_ANON = 'VMEMINFO_NR_ACTIVE_ANON',
  VMEMINFO_NR_INACTIVE_FILE = 'VMEMINFO_NR_INACTIVE_FILE',
  VMEMINFO_NR_ACTIVE_FILE = 'VMEMINFO_NR_ACTIVE_FILE',
  VMEMINFO_NR_UNEVICTABLE = 'VMEMINFO_NR_UNEVICTABLE',
  VMEMINFO_NR_MLOCK = 'VMEMINFO_NR_MLOCK',
  VMEMINFO_NR_ANON_PAGES = 'VMEMINFO_NR_ANON_PAGES',
  VMEMINFO_NR_MAPPED = 'VMEMINFO_NR_MAPPED',
  VMEMINFO_NR_FILE_PAGES = 'VMEMINFO_NR_FILE_PAGES',
  VMEMINFO_NR_DIRTY = 'VMEMINFO_NR_DIRTY',
  VMEMINFO_NR_WRITEBACK = 'VMEMINFO_NR_WRITEBACK',
  VMEMINFO_NR_SLAB_RECLAIMABLE = 'VMEMINFO_NR_SLAB_RECLAIMABLE',
  VMEMINFO_NR_SLAB_UNRECLAIMABLE = 'VMEMINFO_NR_SLAB_UNRECLAIMABLE',
  VMEMINFO_NR_PAGE_TABLE_PAGES = 'VMEMINFO_NR_PAGE_TABLE_PAGES',
  VMEMINFO_NR_KERNEL_STACK = 'VMEMINFO_NR_KERNEL_STACK',
  VMEMINFO_NR_OVERHEAD = 'VMEMINFO_NR_OVERHEAD',
  VMEMINFO_NR_UNSTABLE = 'VMEMINFO_NR_UNSTABLE',
  VMEMINFO_NR_BOUNCE = 'VMEMINFO_NR_BOUNCE',
  VMEMINFO_NR_VMSCAN_WRITE = 'VMEMINFO_NR_VMSCAN_WRITE',
  VMEMINFO_NR_VMSCAN_IMMEDIATE_RECLAIM = 'VMEMINFO_NR_VMSCAN_IMMEDIATE_RECLAIM',
  VMEMINFO_NR_WRITEBACK_TEMP = 'VMEMINFO_NR_WRITEBACK_TEMP',
  VMEMINFO_NR_ISOLATED_ANON = 'VMEMINFO_NR_ISOLATED_ANON',
  VMEMINFO_NR_ISOLATED_FILE = 'VMEMINFO_NR_ISOLATED_FILE',
  VMEMINFO_NR_SHMEM = 'VMEMINFO_NR_SHMEM',
  VMEMINFO_NR_DIRTIED = 'VMEMINFO_NR_DIRTIED',
  VMEMINFO_NR_WRITTEN = 'VMEMINFO_NR_WRITTEN',
  VMEMINFO_NR_PAGES_SCANNED = 'VMEMINFO_NR_PAGES_SCANNED',
  VMEMINFO_WORKINGSET_REFAULT = 'VMEMINFO_WORKINGSET_REFAULT',
  VMEMINFO_WORKINGSET_ACTIVATE = 'VMEMINFO_WORKINGSET_ACTIVATE',
  VMEMINFO_WORKINGSET_NODERECLAIM = 'VMEMINFO_WORKINGSET_NODERECLAIM',
  VMEMINFO_NR_ANON_TRANSPARENT_HUGEPAGES = 'VMEMINFO_NR_ANON_TRANSPARENT_HUGEPAGES',
  VMEMINFO_NR_FREE_CMA = 'VMEMINFO_NR_FREE_CMA',
  VMEMINFO_NR_SWAPCACHE = 'VMEMINFO_NR_SWAPCACHE',
  VMEMINFO_NR_DIRTY_THRESHOLD = 'VMEMINFO_NR_DIRTY_THRESHOLD',
  VMEMINFO_NR_DIRTY_BACKGROUND_THRESHOLD = 'VMEMINFO_NR_DIRTY_BACKGROUND_THRESHOLD',
  VMEMINFO_PGPGIN = 'VMEMINFO_PGPGIN',
  VMEMINFO_PGPGOUT = 'VMEMINFO_PGPGOUT',
  VMEMINFO_PGPGOUTCLEAN = 'VMEMINFO_PGPGOUTCLEAN',
  VMEMINFO_PSWPIN = 'VMEMINFO_PSWPIN',
  VMEMINFO_PSWPOUT = 'VMEMINFO_PSWPOUT',
  VMEMINFO_PGALLOC_DMA = 'VMEMINFO_PGALLOC_DMA',
  VMEMINFO_PGALLOC_NORMAL = 'VMEMINFO_PGALLOC_NORMAL',
  VMEMINFO_PGALLOC_MOVABLE = 'VMEMINFO_PGALLOC_MOVABLE',
  VMEMINFO_PGFREE = 'VMEMINFO_PGFREE',
  VMEMINFO_PGACTIVATE = 'VMEMINFO_PGACTIVATE',
  VMEMINFO_PGDEACTIVATE = 'VMEMINFO_PGDEACTIVATE',
  VMEMINFO_PGFAULT = 'VMEMINFO_PGFAULT',
  VMEMINFO_PGMAJFAULT = 'VMEMINFO_PGMAJFAULT',
  VMEMINFO_PGREFILL_DMA = 'VMEMINFO_PGREFILL_DMA',
  VMEMINFO_PGREFILL_NORMAL = 'VMEMINFO_PGREFILL_NORMAL',
  VMEMINFO_PGREFILL_MOVABLE = 'VMEMINFO_PGREFILL_MOVABLE',
  VMEMINFO_PGSTEAL_KSWAPD_DMA = 'VMEMINFO_PGSTEAL_KSWAPD_DMA',
  VMEMINFO_PGSTEAL_KSWAPD_NORMAL = 'VMEMINFO_PGSTEAL_KSWAPD_NORMAL',
  VMEMINFO_PGSTEAL_KSWAPD_MOVABLE = 'VMEMINFO_PGSTEAL_KSWAPD_MOVABLE',
  VMEMINFO_PGSTEAL_DIRECT_DMA = 'VMEMINFO_PGSTEAL_DIRECT_DMA',
  VMEMINFO_PGSTEAL_DIRECT_NORMAL = 'VMEMINFO_PGSTEAL_DIRECT_NORMAL',
  VMEMINFO_PGSTEAL_DIRECT_MOVABLE = 'VMEMINFO_PGSTEAL_DIRECT_MOVABLE',
  VMEMINFO_PGSCAN_KSWAPD_DMA = 'VMEMINFO_PGSCAN_KSWAPD_DMA',
  VMEMINFO_PGSCAN_KSWAPD_NORMAL = 'VMEMINFO_PGSCAN_KSWAPD_NORMAL',
  VMEMINFO_PGSCAN_KSWAPD_MOVABLE = 'VMEMINFO_PGSCAN_KSWAPD_MOVABLE',
  VMEMINFO_PGSCAN_DIRECT_DMA = 'VMEMINFO_PGSCAN_DIRECT_DMA',
  VMEMINFO_PGSCAN_DIRECT_NORMAL = 'VMEMINFO_PGSCAN_DIRECT_NORMAL',
  VMEMINFO_PGSCAN_DIRECT_MOVABLE = 'VMEMINFO_PGSCAN_DIRECT_MOVABLE',
  VMEMINFO_PGSCAN_DIRECT_THROTTLE = 'VMEMINFO_PGSCAN_DIRECT_THROTTLE',
  VMEMINFO_PGINODESTEAL = 'VMEMINFO_PGINODESTEAL',
  VMEMINFO_SLABS_SCANNED = 'VMEMINFO_SLABS_SCANNED',
  VMEMINFO_KSWAPD_INODESTEAL = 'VMEMINFO_KSWAPD_INODESTEAL',
  VMEMINFO_KSWAPD_LOW_WMARK_HIT_QUICKLY = 'VMEMINFO_KSWAPD_LOW_WMARK_HIT_QUICKLY',
  VMEMINFO_KSWAPD_HIGH_WMARK_HIT_QUICKLY = 'VMEMINFO_KSWAPD_HIGH_WMARK_HIT_QUICKLY',
  VMEMINFO_PAGEOUTRUN = 'VMEMINFO_PAGEOUTRUN',
  VMEMINFO_ALLOCSTALL = 'VMEMINFO_ALLOCSTALL',
  VMEMINFO_PGROTATED = 'VMEMINFO_PGROTATED',
  VMEMINFO_DROP_PAGECACHE = 'VMEMINFO_DROP_PAGECACHE',
  VMEMINFO_DROP_SLAB = 'VMEMINFO_DROP_SLAB',
  VMEMINFO_PGMIGRATE_SUCCESS = 'VMEMINFO_PGMIGRATE_SUCCESS',
  VMEMINFO_PGMIGRATE_FAIL = 'VMEMINFO_PGMIGRATE_FAIL',
  VMEMINFO_COMPACT_MIGRATE_SCANNED = 'VMEMINFO_COMPACT_MIGRATE_SCANNED',
  VMEMINFO_COMPACT_FREE_SCANNED = 'VMEMINFO_COMPACT_FREE_SCANNED',
  VMEMINFO_COMPACT_ISOLATED = 'VMEMINFO_COMPACT_ISOLATED',
  VMEMINFO_COMPACT_STALL = 'VMEMINFO_COMPACT_STALL',
  VMEMINFO_COMPACT_FAIL = 'VMEMINFO_COMPACT_FAIL',
  VMEMINFO_COMPACT_SUCCESS = 'VMEMINFO_COMPACT_SUCCESS',
  VMEMINFO_COMPACT_DAEMON_WAKE = 'VMEMINFO_COMPACT_DAEMON_WAKE',
  VMEMINFO_UNEVICTABLE_PGS_CULLED = 'VMEMINFO_UNEVICTABLE_PGS_CULLED',
  VMEMINFO_UNEVICTABLE_PGS_SCANNED = 'VMEMINFO_UNEVICTABLE_PGS_SCANNED ',
  VMEMINFO_UNEVICTABLE_PGS_RESCUED = 'VMEMINFO_UNEVICTABLE_PGS_RESCUED',
  VMEMINFO_UNEVICTABLE_PGS_MLOCKED = 'VMEMINFO_UNEVICTABLE_PGS_MLOCKED',
  VMEMINFO_UNEVICTABLE_PGS_MUNLOCKED = 'VMEMINFO_UNEVICTABLE_PGS_MUNLOCKED',
  VMEMINFO_UNEVICTABLE_PGS_CLEARED = 'VMEMINFO_UNEVICTABLE_PGS_CLEARED',
  VMEMINFO_UNEVICTABLE_PGS_STRANDED = 'VMEMINFO_UNEVICTABLE_PGS_STRANDED',
  VMEMINFO_NR_ZSPAGES = 'VMEMINFO_NR_ZSPAGES',
  VMEMINFO_NR_ION_HEAP = 'VMEMINFO_NR_ION_HEAP',
  VMEMINFO_NR_GPU_HEAP = 'VMEMINFO_NR_GPU_HEAP',
  VMEMINFO_ALLOCSTALL_DMA = 'VMEMINFO_ALLOCSTALL_DMA',
  VMEMINFO_ALLOCSTALL_MOVABLE = 'VMEMINFO_ALLOCSTALL_MOVABLE',
  VMEMINFO_ALLOCSTALL_NORMAL = 'VMEMINFO_ALLOCSTALL_NORMAL',
  VMEMINFO_COMPACT_DAEMON_FREE_SCANNED = 'VMEMINFO_COMPACT_DAEMON_FREE_SCANNED',
  VMEMINFO_COMPACT_DAEMON_MIGRATE_SCANNED = 'VMEMINFO_COMPACT_DAEMON_MIGRATE_SCANNED',
  VMEMINFO_NR_FASTRPC = 'VMEMINFO_NR_FASTRPC',
  VMEMINFO_NR_INDIRECTLY_RECLAIMABLE = 'VMEMINFO_NR_INDIRECTLY_RECLAIMABLE',
  VMEMINFO_NR_ION_HEAP_POOL = 'VMEMINFO_NR_ION_HEAP_POOL',
  VMEMINFO_NR_KERNEL_MISC_RECLAIMABLE = 'VMEMINFO_NR_KERNEL_MISC_RECLAIMABLE',
  VMEMINFO_NR_SHADOW_CALL_STACK_BYTES = 'VMEMINFO_NR_SHADOW_CALL_STACK_BYTES',
  VMEMINFO_NR_SHMEM_HUGEPAGES = 'VMEMINFO_NR_SHMEM_HUGEPAGES',
  VMEMINFO_NR_SHMEM_PMDMAPPED = 'VMEMINFO_NR_SHMEM_PMDMAPPED',
  VMEMINFO_NR_UNRECLAIMABLE_PAGES = 'VMEMINFO_NR_UNRECLAIMABLE_PAGES',
  VMEMINFO_NR_ZONE_ACTIVE_ANON = 'VMEMINFO_NR_ZONE_ACTIVE_ANON',
  VMEMINFO_NR_ZONE_ACTIVE_FILE = 'VMEMINFO_NR_ZONE_ACTIVE_FILE',
  VMEMINFO_NR_ZONE_INACTIVE_ANON = 'VMEMINFO_NR_ZONE_INACTIVE_ANON',
  VMEMINFO_NR_ZONE_INACTIVE_FILE = 'VMEMINFO_NR_ZONE_INACTIVE_FILE',
  VMEMINFO_NR_ZONE_UNEVICTABLE = 'VMEMINFO_NR_ZONE_UNEVICTABLE',
  VMEMINFO_NR_ZONE_WRITE_PENDING = 'VMEMINFO_NR_ZONE_WRITE_PENDING',
  VMEMINFO_OOM_KILL = 'VMEMINFO_OOM_KILL ',
  VMEMINFO_PGLAZYFREE = 'VMEMINFO_PGLAZYFREE',
  VMEMINFO_PGLAZYFREED = 'VMEMINFO_PGLAZYFREED',
  VMEMINFO_PGREFILL = 'VMEMINFO_PGREFILL',
  VMEMINFO_PGSCAN_DIRECT = 'VMEMINFO_PGSCAN_DIRECT',
  VMEMINFO_PGSCAN_KSWAPD = 'VMEMINFO_PGSCAN_KSWAPD',
  VMEMINFO_PGSKIP_DMA = 'VMEMINFO_PGSKIP_DMA',
  VMEMINFO_PGSKIP_MOVABLE = 'VMEMINFO_PGSKIP_MOVABLE',
  VMEMINFO_PGSKIP_NORMAL = 'VMEMINFO_PGSKIP_NORMAL',
  VMEMINFO_PGSTEAL_DIRECT = 'VMEMINFO_PGSTEAL_DIRECT',
  VMEMINFO_PGSTEAL_KSWAPD = 'VMEMINFO_PGSTEAL_KSWAPD',
  VMEMINFO_SWAP_RA = 'VMEMINFO_SWAP_RA',
  VMEMINFO_SWAP_RA_HIT = 'VMEMINFO_SWAP_RA_HIT',
  VMEMINFO_WORKINGSET_RESTORE = 'VMEMINFO_WORKINGSET_RESTORE',
}

export enum SysMeminfoType {
  MEMINFO_UNSPECIFIED = 'PMEM_UNSPECIFIED',
  MEMINFO_MEM_TOTAL = 'PMEM_MEM_TOTAL',
  MEMINFO_MEM_FREE = 'PMEM_MEM_FREE',
  MEMINFO_MEM_AVAILABLE = 'PMEM_MEM_AVAILABLE',
  MEMINFO_BUFFERS = 'PMEM_BUFFERS',
  MEMINFO_CACHED = 'PMEM_CACHED',
  MEMINFO_SWAP_CACHED = 'PMEM_SWAP_CACHED',
  MEMINFO_ACTIVE = 'PMEM_ACTIVE',
  MEMINFO_INACTIVE = 'PMEM_INACTIVE',
  MEMINFO_ACTIVE_ANON = 'PMEM_ACTIVE_ANON',
  MEMINFO_INACTIVE_ANON = 'PMEM_INACTIVE_ANON',
  MEMINFO_ACTIVE_FILE = 'PMEM_ACTIVE_FILE',
  MEMINFO_INACTIVE_FILE = 'PMEM_INACTIVE_FILE',
  MEMINFO_UNEVICTABLE = 'PMEM_UNEVICTABLE',
  MEMINFO_MLOCKED = 'PMEM_MLOCKED',
  MEMINFO_SWAP_TOTAL = 'PMEM_SWAP_TOTAL',
  MEMINFO_SWAP_FREE = 'PMEM_SWAP_FREE',
  MEMINFO_DIRTY = 'PMEM_DIRTY',
  MEMINFO_WRITEBACK = 'PMEM_WRITEBACK',
  MEMINFO_ANON_PAGES = 'PMEM_ANON_PAGES',
  MEMINFO_MAPPED = 'PMEM_MAPPED',
  MEMINFO_SHMEM = 'PMEM_SHMEM',
  MEMINFO_SLAB = 'PMEM_SLAB',
  MEMINFO_SLAB_RECLAIMABLE = 'PMEM_SLAB_RECLAIMABLE',
  MEMINFO_SLAB_UNRECLAIMABLE = 'PMEM_SLAB_UNRECLAIMABLE',
  MEMINFO_KERNEL_STACK = 'PMEM_KERNEL_STACK',
  MEMINFO_PAGE_TABLES = 'PMEM_PAGE_TABLES',
  MEMINFO_COMMIT_LIMIT = 'PMEM_COMMIT_LIMIT',
  MEMINFO_COMMITED_AS = 'PMEM_COMMITED_AS',
  MEMINFO_VMALLOC_TOTAL = 'PMEM_VMALLOC_TOTAL',
  MEMINFO_VMALLOC_USED = 'PMEM_VMALLOC_USED',
  MEMINFO_VMALLOC_CHUNK = 'PMEM_VMALLOC_CHUNK',
  MEMINFO_CMA_TOTAL = 'PMEM_CMA_TOTAL',
  MEMINFO_CMA_FREE = 'PMEM_CMA_FREE',
  MEMINFO_KERNEL_RECLAIMABLE = 'PMEM_KERNEL_RECLAIMABLE',
  PMEM_ACTIVE_PURG = 'PMEM_ACTIVE_PURG',
  PMEM_INACTIVE_PURG = 'PMEM_INACTIVE_PURG',
  PMEM_PINED_PURG = 'PMEM_PINED_PURG',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

const sysMemInfo = [
  SysMeminfoType.MEMINFO_UNSPECIFIED,
  SysMeminfoType.MEMINFO_MEM_TOTAL,
  SysMeminfoType.MEMINFO_MEM_FREE,
  SysMeminfoType.MEMINFO_MEM_AVAILABLE,
  SysMeminfoType.MEMINFO_BUFFERS,
  SysMeminfoType.MEMINFO_CACHED,
  SysMeminfoType.MEMINFO_SWAP_CACHED,
  SysMeminfoType.MEMINFO_ACTIVE,
  SysMeminfoType.MEMINFO_INACTIVE,
  SysMeminfoType.MEMINFO_ACTIVE_ANON,
  SysMeminfoType.MEMINFO_INACTIVE_ANON,
  SysMeminfoType.MEMINFO_ACTIVE_FILE,
  SysMeminfoType.MEMINFO_INACTIVE_FILE,
  SysMeminfoType.MEMINFO_UNEVICTABLE,
  SysMeminfoType.MEMINFO_MLOCKED,
  SysMeminfoType.MEMINFO_SWAP_TOTAL,
  SysMeminfoType.MEMINFO_SWAP_FREE,
  SysMeminfoType.MEMINFO_DIRTY,
  SysMeminfoType.MEMINFO_WRITEBACK,
  SysMeminfoType.MEMINFO_ANON_PAGES,
  SysMeminfoType.MEMINFO_MAPPED,
  SysMeminfoType.MEMINFO_SHMEM,
  SysMeminfoType.MEMINFO_SLAB,
  SysMeminfoType.MEMINFO_SLAB_RECLAIMABLE,
  SysMeminfoType.MEMINFO_SLAB_UNRECLAIMABLE,
  SysMeminfoType.MEMINFO_KERNEL_STACK,
  SysMeminfoType.MEMINFO_PAGE_TABLES,
  SysMeminfoType.MEMINFO_COMMIT_LIMIT,
  SysMeminfoType.MEMINFO_COMMITED_AS,
  SysMeminfoType.MEMINFO_VMALLOC_TOTAL,
  SysMeminfoType.MEMINFO_VMALLOC_USED,
  SysMeminfoType.MEMINFO_VMALLOC_CHUNK,
  SysMeminfoType.MEMINFO_CMA_TOTAL,
  SysMeminfoType.MEMINFO_CMA_FREE,
  SysMeminfoType.MEMINFO_KERNEL_RECLAIMABLE,
  SysMeminfoType.PMEM_ACTIVE_PURG,
  SysMeminfoType.PMEM_INACTIVE_PURG,
  SysMeminfoType.PMEM_PINED_PURG,
  SysMeminfoType.UNRECOGNIZED,
];

const sysMeminfoCase = (object: unknown): SysMeminfoType => {
  if (typeof object === 'number') {
    if (object >= 0) {
      let sysMemType = sysMemInfo[object];
      if (sysMemType) {
        return sysMemType;
      }
    }
    return SysMeminfoType.UNRECOGNIZED;
  } else {
    // @ts-ignore
    let sysMemType = SysMeminfoType[object];
    if (!sysMemType) {
      return SysMeminfoType.UNRECOGNIZED;
    }
    return sysMemType;
  }
};

export function sysMeminfoTypeFromJSON(object: unknown): SysMeminfoType {
  return sysMeminfoCase(object);
}

export enum Type {
  TYPE_UNSPECIFIED = 0,
  HI3516 = 1,
  P40 = 2,
  UNRECOGNIZED = -1,
}

export interface HilogConfig {
  pid: number;
  logLevel: Level;
  needClear: boolean;
}

export function levelFromJSON(object: unknown): Level {
  switch (object) {
    case 0:
    case 'LEVEL_UNSPECIFIED':
      return Level.LEVEL_UNSPECIFIED;
    case 1:
    case 'Error':
      return Level.LOG_ERROR;
    case 2:
    case 'Info':
      return Level.LOG_INFO;
    case 3:
    case 'Debug':
      return Level.LOG_DEBUG;
    case 4:
    case 'Warn':
      return Level.LOG_WARN;
    case 5:
    case 'Fatal':
      return Level.LOG_FATAL;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Level.UNRECOGNIZED;
  }
}

export enum Level {
  LEVEL_UNSPECIFIED = 'LEVEL_UNSPECIFIED',
  LOG_ERROR = 'ERROR',
  LOG_INFO = 'INFO',
  LOG_DEBUG = 'DEBUG',
  LOG_WARN = 'WARN',
  LOG_FATAL = 'FATAL',
  UNRECOGNIZED = -1,
}

export interface NativeHookConfig {
  pid?: number;
  saveFile: boolean;
  fileName: string;
  filterSize: number;
  smbPages: number;
  maxStackDepth: number;
  processName: string;
  stringCompressed: boolean;
  fpUnwind: boolean;
  blocked: boolean;
  recordAccurately?: boolean;
  offlineSymbolization?: boolean;
  callframeCompress?: boolean;
  startupMode?: boolean;
  statisticsInterval?: number;
  mallocFreeMatchingInterval?: number;
  sampleInterval?: number;
  expandPids?: number[];
  responseLibraryMode?: boolean;
  jsStackReport?: number;
  maxJsStackDepth?: number;
  filterNapiName?: string;
}

export interface FpsConfig {
  reportFps: boolean;
}

export interface ProcessConfig {
  report_process_tree: boolean;
  report_cpu: boolean;
  report_diskio: boolean;
  report_pss: boolean;
}

export interface CpuConfig {
  pid: number;
  reportProcessInfo: boolean;
}

enum IoReportType {
  UNSPECIFIED = 'UNSPECIFIED',
  IO_REPORT = 'IO_REPORT',
  IO_REPORT_EX = 'IO_REPORT_EX',
}

export interface DiskioConfig {
  reportIoStats: string;
}

export interface NetworkConfig {}

export interface HiperfPluginConfig {
  isRoot: boolean;
  outfileName: string;
  recordArgs: string;
  splitOutfileName?: string;
}

export interface NativePluginConfig {
  save_file: boolean;
  smb_pages: number;
  max_stack_depth: number;
  process_name?: string;
  string_compressed: boolean;
  fp_unwind: boolean;
  blocked: boolean;
  callframe_compress: boolean;
  record_accurately: boolean;
  offline_symbolization: boolean;
  startup_mode: boolean;
  js_stack_report: number;
  max_js_stack_depth: number;
  filter_napi_name: string;
  memtrace_enable: boolean;
  malloc_disable: boolean;
  pid?:number;
}

export interface HiSystemEventConfig {
  msg: string;
  subscribe_domain: string;
  subscribe_event: string;
}

export interface ArkTSConfig {
  pid: number;
  type: number;
  interval: number;
  capture_numeric_value: boolean;
  track_allocations: boolean;
  enable_cpu_profiler: boolean;
  cpu_profiler_interval: number;
  splitOutfileName?: string;
}

export interface FFRTConfig {
  pid?: number[];
  startupProcessName?: string[];
  restartProcessName?: string[];
  smbPages?: number;
  flushInterval?: number;
  block?: boolean;
  clockId?: string;
}
