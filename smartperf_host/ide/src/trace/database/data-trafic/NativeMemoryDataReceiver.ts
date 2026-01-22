// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { 
  handlerConfig, 
  memoryConfig, 
  MemoryTableName, 
  MemoryTraceRowType, 
  MemoryType, 
  statisticTypeMap,
  NATIVE_MEMORY_HEAP_INDICES,
  NATIVE_MEMORY_ANONYMOUS_VM_INDICES,
  NATIVE_MEMORY_ALL_HEAP_IDX,
  NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX
} from '../../bean/MemoryEnum';
import { TraficEnum } from './utils/QueryEnum';

interface SenderParam {
  params: {
    frame: { width: number };
    drawType: number;
    endNS: number;
    startNS: number;
    eventType: number;
    memoryType: string
    ipid: number;
    processes: number[];
    totalNS: number;
    trafic: TraficEnum;
    recordEndNS: number;
    recordStartNS: number;
    model: string;
    isCache: boolean;
  };
  id: string;
  action: string;
}

interface NativeMemoryCacheType {
  maxSize: number;
  minSize: number;
  maxDensity: number;
  minDensity: number;
  dataList: Array<NativeMemoryChartDataType>;
}

class NativeMemoryChartDataType {
  startTime: number = 0;
  dur: number = 0;
  heapSize: number = 0;
  density: number = 0;
}

class NMData {
  callchainId: number = 0;
  startTs: number = 0;
  startTime: number = 0;
  applyCount: number = 0;
  applySize: number = 0;
  releaseCount: number = 0;
  releaseSize: number = 0;
  heapSize: number = 0;
  eventTypeName: string = '';
  eventType: number = 0;
  isRelease: number = 0;
  type: number = 0;
  ipid: number = 0;
}

const dataCache: {
  normalCache: Map<string, NativeMemoryCacheType>;
  statisticsCache: Map<string, NativeMemoryCacheType>;
} = {
  normalCache: new Map<string, NativeMemoryCacheType>(),
  statisticsCache: new Map<string, NativeMemoryCacheType>(),
};

let tempSize: number = 0;
let tempDensity: number = 0;

function nativeMemoryChartDataCacheSql(tableName: string, startNS: number, endNS: number): string {
  if (!tableName.includes('statistic')) {
    return `select * from (
                select 
                    h.start_ts - ${startNS} as startTime,
                    h.heap_size as heapSize,
                    h.event_type as eventTypeName,
                    0 as isRelease,
                    ipid
                from ${tableName} h
                where h.start_ts between ${startNS} and ${endNS}
                  and h.event_type in (${MemoryType.APPLY_EVENTS.map(item => `'${item}'`).join(', ')})
                union all
                select 
                    h.end_ts - ${startNS} as startTime,
                    h.heap_size as heapSize,
                    h.event_type as eventTypeName,
                    1 as isRelease,
                    ipid
                from ${tableName} h
                where 
                  h.start_ts between ${startNS} and ${endNS}
                  and h.end_ts between ${startNS} and ${endNS}
                  and h.event_type in (${MemoryType.APPLY_EVENTS.map(item => `'${item}'`).join(', ')})
            )
            order by startTime;`;
  } else {
    return `select callchain_id    as callchainId,
                ts - ${startNS}    as startTs,
                apply_count        as applyCount,
                apply_size         as applySize,
                release_count      as releaseCount,
                release_size       as releaseSize,
                ipid,
                type               
            from ${tableName}
            where ts between ${startNS} and ${endNS};
    `;
  }
}

function normalChartDataHandler(data: Array<NMData>, key: string, totalNS: number): void {
  const nmFilterLen = data.length;
  const nmFilterLevel = getFilterLevel(nmFilterLen);
  tempSize = 0;
  tempDensity = 0;
  data.map((ne: NMData, index: number): void =>
    mergeNormalChartData(ne, nmFilterLevel, index === nmFilterLen - 1, key)
  );
  let cache = dataCache.normalCache.get(key);
  if (cache && cache.dataList.length > 0) {
    cache.dataList[cache.dataList.length - 1].dur = totalNS - cache.dataList[cache.dataList.length - 1].startTime!;
  }
}

function mergeNormalChartData(ne: NMData, filterLevel: number, finish: boolean, key: string): void {
  let item: NativeMemoryChartDataType = {
    startTime: ne.startTime,
    density: 0,
    heapSize: 0,
    dur: 0,
  };
  if (!dataCache.normalCache.has(key)) {
    // 存在则累加
    if (!ne.isRelease) {
      item.density = 1;
      item.heapSize = ne.heapSize;
    } else {
      item.density = -1;
      item.heapSize = 0 - ne.heapSize;
    }
    dataCache.normalCache.set(key, {
      maxSize: item.heapSize,
      minSize: item.heapSize,
      maxDensity: item.density,
      minDensity: item.density,
      dataList: [item],
    });
  } else {
    mergeData(item, ne, filterLevel, finish, key);
  }
}

function mergeData(
  item: NativeMemoryChartDataType,
  ne: NMData,
  filterLevel: number,
  finish: boolean,
  key: string
): void {
  let data = dataCache.normalCache.get(key);
  if (data) {
    let last = data.dataList[data.dataList.length - 1];
    last.dur = item.startTime! - last.startTime!;
    if (last.dur >= filterLevel || finish) {
      // 存在则累加
      if (!ne.isRelease) {
        item.density = last.density! + tempDensity + 1;
        item.heapSize = last.heapSize! + tempSize + ne.heapSize;
      } else { // 释放则减少
        item.density = last.density! + tempDensity - 1;
        item.heapSize = last.heapSize! + tempSize - ne.heapSize;
      }
      tempDensity = 0;
      tempSize = 0;
      data.maxDensity = Math.max(item.density, data.maxDensity);
      data.minDensity = Math.min(item.density, data.minDensity);
      data.maxSize = Math.max(item.heapSize, data.maxSize);
      data.minSize = Math.min(item.heapSize, data.minSize);
      data.dataList.push(item);
    } else {
      // 存在则累加
      if (!ne.isRelease) {
        tempDensity += 1;
        tempSize += ne.heapSize;
      } else { // 释放则减少
        tempDensity -= 1;
        tempSize -= ne.heapSize;
      }
    }
  }
}

function statisticChartHandler(arr: Array<NMData>, key: string, timeArr: number[]): void {
  let callGroupMap: Map<string, NMData[]> = new Map<string, NMData[]>();
  let obj: Map<number, NativeMemoryChartDataType> = new Map<number, NativeMemoryChartDataType>();
  for (let hook of arr) {
    const compositeKey = `${hook.type}|${hook.callchainId}`;
    if (obj.has(hook.startTs)) {
      let data = obj.get(hook.startTs)!;
      data.startTime = hook.startTs;
      data.dur = 0;
      if (callGroupMap.has(compositeKey)) {
        let calls = callGroupMap.get(compositeKey);
        let last = calls![calls!.length - 1];
        data.heapSize += hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        data.density += hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        data.heapSize += hook.applySize - hook.releaseSize;
        data.density += hook.applyCount - hook.releaseCount;
        callGroupMap.set(compositeKey, [hook]);
      }
    } else {
      let data: NativeMemoryChartDataType = new NativeMemoryChartDataType();
      data.startTime = hook.startTs;
      data.dur = 0;
      if (callGroupMap.has(compositeKey)) {
        let calls = callGroupMap.get(compositeKey);
        let last = calls![calls!.length - 1];
        data.heapSize = hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        data.density = hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        data.heapSize = hook.applySize - hook.releaseSize;
        data.density = hook.applyCount - hook.releaseCount;
        callGroupMap.set(compositeKey, [hook]);
      }
      obj.set(hook.startTs, data);
    }
  }
  saveStatisticsCacheMapValue(key, obj, timeArr);
}

function saveStatisticsCacheMapValue(
  key: string,
  obj: Map<number, NativeMemoryChartDataType>,
  timeArr: number[]
): void {
  let source = Array.from(obj.values());
  let arr: NativeMemoryChartDataType[] = [];
  let cache = {
    maxSize: 0,
    minSize: 0,
    maxDensity: 0,
    minDensity: 0,
    dataList: arr,
  };
  for (let i = 0, len = source.length; i < len; i++) {
    let startTsIndex = timeArr.findIndex((time) => source[i].startTime === time);
    let realStartTs = startTsIndex > 0 ? timeArr[startTsIndex - 1] : 0;
    let item = {
      startTime: realStartTs,
      heapSize: i > 0 ? source[i].heapSize + arr[i - 1].heapSize : source[i].heapSize,
      density: i > 0 ? source[i].density + arr[i - 1].density : source[i].density,
      dur: source[i].startTime - realStartTs,
    };
    arr.push(item);
    cache.maxSize = Math.max(cache.maxSize, item.heapSize);
    cache.maxDensity = Math.max(cache.maxDensity, item.density);
    cache.minSize = Math.min(cache.minSize, item.heapSize);
    cache.minDensity = Math.min(cache.minDensity, item.density);
  }
  source.length = 0;
  dataCache.statisticsCache.set(key, cache);
}

function cacheSumRowData(
  key: string,
  timeArr: number[],
  dataListArray: NativeMemoryChartDataType[][]
): void {
  // 如果没有有效数据，直接返回
  if (dataListArray.length === 0) {
    dataCache.statisticsCache.set(key, {
      maxSize: 0,
      minSize: 0,
      maxDensity: 0,
      minDensity: 0,
      dataList: []
    });
    return;
  }

  const arr: NativeMemoryChartDataType[] = [];
  const sumCache = {
    maxSize: 0,
    minSize: 0,
    maxDensity: 0,
    minDensity: 0,
    dataList: arr,
  };

  timeArr.unshift(0);

  timeArr.forEach((time) => {
    const item: NativeMemoryChartDataType = {
      startTime: time,
      heapSize: 0,
      density: 0,
      dur: 0,
    };

    // 遍历所有数据列表，累加对应时间点的数据
    dataListArray.forEach(dataList => {
      const dataItem = dataList.find((it) => it.startTime === time);
      if (dataItem) {
        item.heapSize += dataItem.heapSize;
        item.density += dataItem.density;
        // 如果当前项目还没有设置dur，或者找到的项目的dur更大，则更新dur
        if (!item.dur || dataItem.dur > item.dur) {
          item.dur = dataItem.dur;
        }
      }
    });

    arr.push(item);
    sumCache.maxSize = Math.max(sumCache.maxSize, item.heapSize);
    sumCache.maxDensity = Math.max(sumCache.maxDensity, item.density);
    sumCache.minSize = Math.min(sumCache.minSize, item.heapSize);
    sumCache.minDensity = Math.min(sumCache.minDensity, item.density);
  });

  dataCache.statisticsCache.set(key, sumCache);
}

function memoryNormalDataFilterByType(
  memoryType: MemoryTraceRowType,
  data: Array<NMData>
): Array<NMData> {
  const allowedValues = memoryConfig[memoryType]?.filters ?? [];
  return data.filter((item) =>
    allowedValues.includes(item.eventTypeName as MemoryType)
  );
}

// chart 数据处理复用 chartConfigs
function cacheNormalChartData(
  totalNS: number,
  ipid: number,
  processData: Array<NMData>
): void {
  Object.entries(memoryConfig).forEach(([memoryType, { chartConfigs }]) => {
    const currentTypeData = memoryNormalDataFilterByType(
      memoryType as MemoryTraceRowType,
      processData
    );

    chartConfigs.forEach(({ filter, suffix }) => {
      const data = filter
        ? currentTypeData.filter((ne) => ne.eventTypeName === filter)
        : currentTypeData;

      normalChartDataHandler(data, `${memoryType}-${ipid}-${suffix}`, totalNS);
    });

    // 为 Native Memory 计算 All Heap 和 All Anonymous VM 的总和
    if (memoryType === MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY) {
      // All Heap 总和 - 使用常量数组
      const allHeapSuffixes = [...NATIVE_MEMORY_HEAP_INDICES]; // Native Heap, ArkTs Heap, ArkWeb Heap, RN Heap, KMP Heap
      const allHeapFolderSuffix = NATIVE_MEMORY_ALL_HEAP_IDX; // All Heap folder suffix
      const allHeapDataListArray: NativeMemoryChartDataType[][] = allHeapSuffixes.map(suffix =>
        dataCache.normalCache.get(`${memoryType}-${ipid}-${suffix}`)?.dataList || []
      ).filter(dataList => dataList.length > 0);
      if (allHeapDataListArray.length > 0) {
        cacheNormalSumRowData(`${memoryType}-${ipid}-${allHeapFolderSuffix}`, totalNS, allHeapDataListArray);
      }

      // All Anonymous VM 总和 - 使用常量数组
      const allAnonymousVMSuffixes = [...NATIVE_MEMORY_ANONYMOUS_VM_INDICES]; // VM ION, VM Ashmem, VM SO, VM Others
      const allAnonymousVMFolderSuffix = NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX; // All Anonymous VM folder suffix
      const allAnonymousVMDataListArray: NativeMemoryChartDataType[][] = allAnonymousVMSuffixes.map(suffix =>
        dataCache.normalCache.get(`${memoryType}-${ipid}-${suffix}`)?.dataList || []
      ).filter(dataList => dataList.length > 0);
      if (allAnonymousVMDataListArray.length > 0) {
        cacheNormalSumRowData(`${memoryType}-${ipid}-${allAnonymousVMFolderSuffix}`, totalNS, allAnonymousVMDataListArray);
      }
    }
  });
}

// 正常模式的总和计算函数
function cacheNormalSumRowData(
  key: string,
  totalNS: number,
  dataListArray: NativeMemoryChartDataType[][]
): void {
  // 如果没有有效数据，直接返回
  if (dataListArray.length === 0) {
    dataCache.normalCache.set(key, {
      maxSize: 0,
      minSize: 0,
      maxDensity: 0,
      minDensity: 0,
      dataList: []
    });
    return;
  }

  // 收集所有时间点
  const timeSet = new Set<number>();
  dataListArray.forEach(dataList => {
    dataList.forEach(item => {
      timeSet.add(item.startTime);
      if (item.dur > 0) {
        timeSet.add(item.startTime + item.dur);
      }
    });
  });
  const timeArr = Array.from(timeSet).sort((a, b) => a - b);

  // 为每个数据列表创建排序后的数组，用于二分查找
  const sortedDataArrays = dataListArray.map(dataList => {
    return [...dataList].sort((a, b) => a.startTime - b.startTime);
  });

  const arr: NativeMemoryChartDataType[] = [];
  const sumCache = {
    maxSize: 0,
    minSize: 0,
    maxDensity: 0,
    minDensity: 0,
    dataList: arr,
  };

  // 计算每个时间点的累计值
  timeArr.forEach((time, index) => {
    let heapSize = 0;
    let density = 0;

    // 对于每个数据列表，找到该时间点或之前最近的累计值
    sortedDataArrays.forEach(sortedData => {
      // 使用二分查找找到小于等于当前时间点的最大时间点
      let left = 0;
      let right = sortedData.length - 1;
      let bestIndex = -1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (sortedData[mid].startTime <= time) {
          bestIndex = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      if (bestIndex >= 0) {
        heapSize += sortedData[bestIndex].heapSize;
        density += sortedData[bestIndex].density;
      }
    });

    const item: NativeMemoryChartDataType = {
      startTime: time,
      heapSize: heapSize,
      density: density,
      dur: index < timeArr.length - 1 ? timeArr[index + 1] - time : totalNS - time,
    };

    arr.push(item);
    sumCache.maxSize = Math.max(sumCache.maxSize, item.heapSize);
    sumCache.maxDensity = Math.max(sumCache.maxDensity, item.density);
    sumCache.minSize = Math.min(sumCache.minSize, item.heapSize);
    sumCache.minDensity = Math.min(sumCache.minDensity, item.density);
  });

  // 设置最后一个数据项的 dur
  if (arr.length > 0) {
    arr[arr.length - 1].dur = totalNS - arr[arr.length - 1].startTime;
  }

  dataCache.normalCache.set(key, sumCache);
}

function cacheStatisticChartData(processData: Array<NMData>, ipid: number): void {
  const timeSet = new Set<number>();
  const buckets: Record<string, NMData[]> = {
    alloc: [],
    mmap: [],
    fd: [],
    thread: [],
    gpuCl: [],
    gpuGles: [],
    gpuVk: [],
    // 新增类型
    arkts: [],
    js: [],
    kmp: [],
    so: [],
    ashmem: [],
    ion: [],
  };

  processData.forEach((item) => {
    timeSet.add(item.startTs);
    const key = statisticTypeMap[item.type];
    if (key) {
      buckets[key].push(item);
    }
  });

  const timeArr = Array.from(timeSet).sort((a, b) => a - b);

  handlerConfig.forEach(({ rowType, suffixes, sum }) => {
    suffixes.forEach(({ key, suffix }) => {
      statisticChartHandler(buckets[key], `${rowType}-${ipid}-${suffix}`, timeArr);
    });

    // 若 sum 存在，则从 suffixes 提取
    if (sum) {
      const allSuffixes = suffixes.map(s => s.suffix);
      const selected = sum === true ? allSuffixes : sum.filter(s => allSuffixes.includes(s));
      if (selected.length > 0) {
        const dataListArray: NativeMemoryChartDataType[][] = selected.map(dataKey =>
          dataCache.statisticsCache.get(`${rowType}-${ipid}-${dataKey}`)?.dataList || []
        ).filter(dataList => dataList.length > 0);
        cacheSumRowData(`${rowType}-${ipid}-0`, [...timeArr], dataListArray);
      }
    }

    // 为 Native Memory 计算 All Heap 和 All Anonymous VM 的总和
    if (rowType === MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY) {
      // All Heap 总和 - 使用常量数组
      const allHeapSuffixes = [...NATIVE_MEMORY_HEAP_INDICES].map(i => i.toString()); // Native Heap, ArkTs Heap, ArkWeb Heap, RN Heap, KMP Heap
      const allHeapFolderSuffix = NATIVE_MEMORY_ALL_HEAP_IDX.toString(); // All Heap folder suffix
      const allHeapDataListArray: NativeMemoryChartDataType[][] = allHeapSuffixes.map(dataKey =>
        dataCache.statisticsCache.get(`${rowType}-${ipid}-${dataKey}`)?.dataList || []
      ).filter(dataList => dataList.length > 0);
      if (allHeapDataListArray.length > 0) {
        cacheSumRowData(`${rowType}-${ipid}-${allHeapFolderSuffix}`, [...timeArr], allHeapDataListArray);
      }

      // All Anonymous VM 总和 - 使用常量数组
      const allAnonymousVMSuffixes = [...NATIVE_MEMORY_ANONYMOUS_VM_INDICES].map(i => i.toString()); // VM ION, VM Ashmem, VM SO, VM Others
      const allAnonymousVMFolderSuffix = NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX.toString(); // All Anonymous VM folder suffix
      const allAnonymousVMDataListArray: NativeMemoryChartDataType[][] = allAnonymousVMSuffixes.map(dataKey =>
        dataCache.statisticsCache.get(`${rowType}-${ipid}-${dataKey}`)?.dataList || []
      ).filter(dataList => dataList.length > 0);
      if (allAnonymousVMDataListArray.length > 0) {
        cacheSumRowData(`${rowType}-${ipid}-${allAnonymousVMFolderSuffix}`, [...timeArr], allAnonymousVMDataListArray);
      }
    }
  });
  timeSet.clear();
}

function cacheNativeMemoryChartData(model: string, totalNS: number, processes: number[], data: Array<NMData>): void {
  processes.forEach((ipid) => {
    let processData = data.filter((ne) => ne.ipid === ipid);
    if (!model.includes('statistic')) {
      //正常模式
      cacheNormalChartData(totalNS, ipid, processData);
    } else {
      //统计模式
      cacheStatisticChartData(processData, ipid);
    }
    processData.length = 0;
  });
}

function getFilterLevel(len: number): number {
  if (len > 300_0000) {
    return 50_0000;
  } else if (len > 200_0000) {
    return 30_0000;
  } else if (len > 100_0000) {
    return 10_0000;
  } else if (len > 50_0000) {
    return 5_0000;
  } else if (len > 30_0000) {
    return 2_0000;
  } else if (len > 15_0000) {
    return 1_0000;
  } else {
    return 0;
  }
}

export function nativeMemoryCacheClear(): void {
  dataCache.normalCache.clear();
  dataCache.statisticsCache.clear();
}

export function nativeMemoryDataHandler(data: SenderParam, proc: Function): void {
  if (data.params.isCache) {
    dataCache.normalCache.clear();
    dataCache.statisticsCache.clear();
    let arr: NMData[] = [];
    let tableName = '';
    switch (data.params.memoryType){
      case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
      case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
      case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
        tableName = data.params.model.includes('statistic') ? MemoryTableName.NATIVE_HOOK_STATISTIC : MemoryTableName.NATIVE_HOOK;
      default:
        tableName = data.params.model.includes('statistic') ? MemoryTableName.NATIVE_HOOK_STATISTIC : MemoryTableName.NATIVE_HOOK;
        break;
    }
    let res: Array<
      | {
        nativeMemoryNormal: NMData;
        nativeMemoryStatistic: NMData;
      }
      | NMData
    > = proc(nativeMemoryChartDataCacheSql(tableName, data.params.recordStartNS, data.params.recordEndNS));
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      arr = (
        res as Array<{
          nativeMemoryNormal: NMData;
          nativeMemoryStatistic: NMData;
        }>
      ).map((item) => {
        let nm = new NMData();
        if (data.params.model === MemoryTableName.NATIVE_HOOK) {
          Object.assign(nm, item.nativeMemoryNormal);
        } else {
          Object.assign(nm, item.nativeMemoryStatistic);
        }
        return nm;
      });
    } else {
      arr = res as Array<NMData>;
    }
    cacheNativeMemoryChartData(data.params.model, data.params.totalNS, data.params.processes, arr);
    res.length = 0;
    (self as unknown as Worker).postMessage(
      {
        id: data.id,
        action: data.action,
        results: 'ok',
        len: 0,
      },
      []
    );
  } else {
    arrayBufferCallback(data, true);
  }
}

function arrayBufferCallback(data: SenderParam, transfer: boolean): void {
  let cacheKey = `${data.params.memoryType}-${data.params.ipid}-${data.params.eventType}`;
  let dataFilter = filterNativeMemoryChartData(
    data.params.model,
    data.params.startNS,
    data.params.endNS,
    data.params.totalNS,
    data.params.drawType,
    data.params.frame,
    cacheKey
  );
  let len = dataFilter.startTime.length;
  let startTime = new Float64Array(len);
  let dur = new Float64Array(len);
  let density = new Int32Array(len);
  let heapSize = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    startTime[i] = dataFilter.startTime[i];
    dur[i] = dataFilter.dur[i];
    heapSize[i] = dataFilter.heapSize[i];
    density[i] = dataFilter.density[i];
  }
  let cacheSource = data.params.model.includes('statistic') ? dataCache.statisticsCache : dataCache.normalCache;
  let cache = cacheSource.get(cacheKey);
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
          startTime: startTime.buffer,
          dur: dur.buffer,
          density: density.buffer,
          heapSize: heapSize.buffer,
          maxSize: cache?.maxSize || 0,
          minSize: cache?.minSize || 0,
          maxDensity: cache?.maxDensity || 0,
          minDensity: cache?.minDensity || 0,
        }
        : {},
      len: len,
    },
    transfer ? [startTime.buffer, dur.buffer, density.buffer, heapSize.buffer] : []
  );
}

export function filterNativeMemoryChartData(
  model: string,
  startNS: number,
  endNS: number,
  totalNS: number,
  drawType: number,
  frame: { width: number },
  key: string
): NativeMemoryDataSource {
  let dataSource = new NativeMemoryDataSource();
  let cache = model.includes('statistic') ? dataCache.statisticsCache.get(key) : dataCache.normalCache.get(key);
  if (cache !== undefined) {
    let data: Map<string, number> = new Map<string, number>();
    cache!.dataList.reduce((pre, current, index) => {
      if (current.dur > 0 && current.startTime + current.dur >= startNS && current.startTime <= endNS) {
        if (dur2Width(current.startTime, current.dur, startNS, endNS || totalNS, frame) >= 1) {
          //计算绘制宽度 大于 1px，则加入绘制列表
          dataSource.startTime.push(current.startTime);
          dataSource.dur.push(current.dur);
          dataSource.density.push(current.density);
          dataSource.heapSize.push(current.heapSize);
        } else {
          let x = 0;
          if (current.startTime > startNS && current.startTime < endNS) {
            x = Math.trunc(ns2x(current.startTime, startNS, endNS, totalNS, frame));
          } else {
            x = 0;
          }
          let key = `${x}`;
          let preIndex = pre.get(key);
          if (preIndex !== undefined) {
            if (drawType === 0) {
              pre.set(key, cache!.dataList[preIndex].heapSize > cache!.dataList[index].heapSize ? preIndex : index);
            } else {
              pre.set(key, cache!.dataList[preIndex].density > cache!.dataList[index].density ? preIndex : index);
            }
          } else {
            pre.set(key, index);
          }
        }
      }
      return pre;
    }, data);
    setDataSource(data, dataSource, cache);
  }
  return dataSource;
}

function setDataSource(
  data: Map<string, number>,
  dataSource: NativeMemoryDataSource,
  cache: NativeMemoryCacheType
): void {
  Array.from(data.values()).forEach((idx) => {
    dataSource.startTime.push(cache!.dataList[idx].startTime);
    dataSource.dur.push(cache!.dataList[idx].dur);
    dataSource.density.push(cache!.dataList[idx].density);
    dataSource.heapSize.push(cache!.dataList[idx].heapSize);
  });
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: { width: number }): number {
  if (endNS === 0) {
    endNS = duration;
  }
  let xSizeNM: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSizeNM < 0) {
    xSizeNM = 0;
  } else if (xSizeNM > rect.width) {
    xSizeNM = rect.width;
  }
  return xSizeNM;
}

function dur2Width(startTime: number, dur: number, startNS: number, endNS: number, rect: { width: number }): number {
  let realDur = startTime + dur - Math.max(startTime, startNS);
  return Math.trunc((realDur * rect.width) / (endNS - startNS));
}

class NativeMemoryDataSource {
  startTime: Array<number>;
  dur: Array<number>;
  heapSize: Array<number>;
  density: Array<number>;
  constructor() {
    this.startTime = [];
    this.dur = [];
    this.heapSize = [];
    this.density = [];
  }
}
