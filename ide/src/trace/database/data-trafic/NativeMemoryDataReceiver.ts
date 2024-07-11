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

import { TraficEnum } from './utils/QueryEnum';

interface SenderParam {
  params: {
    frame: { width: number };
    drawType: number;
    endNS: number;
    startNS: number;
    eventType: number;
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
  eventType: number = 0;
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

function nativeMemoryChartDataCacheSql(model: string, startNS: number, endNS: number): string {
  if (model === 'native_hook') {
    return `select * from (
                select 
                    h.start_ts - ${startNS} as startTime,
                    h.heap_size as heapSize,
                    (case when h.event_type = 'AllocEvent' then 0 else 1 end) as eventType,
                    ipid
                from native_hook h
                where h.start_ts between ${startNS} and ${endNS}
                    and (h.event_type = 'AllocEvent' or h.event_type = 'MmapEvent')
                union all
                select 
                    h.end_ts - ${startNS} as startTime,
                    h.heap_size as heapSize,
                    (case when h.event_type = 'AllocEvent' then 2 else 3 end) as eventType,
                    ipid
                from native_hook h
                where 
                  h.start_ts between ${startNS} and ${endNS}
                  and h.end_ts between ${startNS} and ${endNS}
                  and (h.event_type = 'AllocEvent' or h.event_type = 'MmapEvent')
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
            from native_hook_statistic
            where ts between ${startNS} and ${endNS};
    `;
  }
}

function normalChartDataHandler(data: Array<NMData>, key: string, totalNS: number): void {
  let nmFilterLen = data.length;
  let nmFilterLevel = getFilterLevel(nmFilterLen);
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
    if (ne.eventType === 0 || ne.eventType === 1) {
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
    if (last.dur > filterLevel || finish) {
      if (ne.eventType === 0 || ne.eventType === 1) {
        item.density = last.density! + tempDensity + 1;
        item.heapSize = last.heapSize! + tempSize + ne.heapSize;
      } else {
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
      if (ne.eventType === 0 || ne.eventType === 1) {
        tempDensity += 1;
        tempSize += ne.heapSize;
      } else {
        tempDensity -= 1;
        tempSize -= ne.heapSize;
      }
    }
  }
}

function statisticChartHandler(arr: Array<NMData>, key: string, timeArr: number[]): void {
  let callGroupMap: Map<number, NMData[]> = new Map<number, NMData[]>();
  let obj: Map<number, NativeMemoryChartDataType> = new Map<number, NativeMemoryChartDataType>();
  for (let hook of arr) {
    if (obj.has(hook.startTs)) {
      let data = obj.get(hook.startTs)!;
      data.startTime = hook.startTs;
      data.dur = 0;
      if (callGroupMap.has(hook.callchainId)) {
        let calls = callGroupMap.get(hook.callchainId);
        let last = calls![calls!.length - 1];
        data.heapSize += hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        data.density += hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        data.heapSize += hook.applySize - hook.releaseSize;
        data.density += hook.applyCount - hook.releaseCount;
        callGroupMap.set(hook.callchainId, [hook]);
      }
    } else {
      let data: NativeMemoryChartDataType = new NativeMemoryChartDataType();
      data.startTime = hook.startTs;
      data.dur = 0;
      if (callGroupMap.has(hook.callchainId)) {
        let calls = callGroupMap.get(hook.callchainId);
        let last = calls![calls!.length - 1];
        data.heapSize = hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        data.density = hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        data.heapSize = hook.applySize - hook.releaseSize;
        data.density = hook.applyCount - hook.releaseCount;
        callGroupMap.set(hook.callchainId, [hook]);
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

function cacheSumRowData(ipid: number, key: string, timeArr: number[]): void {
  let ah = dataCache.statisticsCache.get(`${ipid}-1`)?.dataList;
  let mmap = dataCache.statisticsCache.get(`${ipid}-2`)?.dataList;
  let arr: NativeMemoryChartDataType[] = [];
  let sumCache = {
    maxSize: 0,
    minSize: 0,
    maxDensity: 0,
    minDensity: 0,
    dataList: arr,
  };
  timeArr.unshift(0);
  timeArr.forEach((time, index) => {
    let item = {
      startTime: time,
      heapSize: 0,
      density: 0,
      dur: 0,
    };
    let ahItem = ah?.find((it) => it.startTime === time);
    let mmapItem = mmap?.find((it) => it.startTime === time);
    if (ahItem) {
      item.heapSize += ahItem.heapSize;
      item.density += ahItem.density;
    }
    if (mmapItem) {
      item.heapSize += mmapItem.heapSize;
      item.density += mmapItem.density;
    }
    item.dur = ahItem?.dur || mmapItem?.dur || 0;
    arr.push(item);
    sumCache.maxSize = Math.max(sumCache.maxSize, item.heapSize);
    sumCache.maxDensity = Math.max(sumCache.maxDensity, item.density);
    sumCache.minSize = Math.min(sumCache.minSize, item.heapSize);
    sumCache.minDensity = Math.min(sumCache.minDensity, item.density);
  });
  dataCache.statisticsCache.set(key, sumCache);
}

function cacheNativeMemoryChartData(model: string, totalNS: number, processes: number[], data: Array<NMData>): void {
  processes.forEach((ipid) => {
    let processData = data.filter((ne) => ne.ipid === ipid);
    if (model === 'native_hook') {
      //正常模式
      normalChartDataHandler(processData, `${ipid}-0`, totalNS);
      normalChartDataHandler(
        processData.filter((ne) => ne.eventType === 0 || ne.eventType === 2),
        `${ipid}-1`,
        totalNS
      );
      normalChartDataHandler(
        processData.filter((ne) => ne.eventType === 1 || ne.eventType === 3),
        `${ipid}-2`,
        totalNS
      );
    } else {
      //统计模式
      let timeSet: Set<number> = new Set<number>();
      let alData: NMData[] = [];
      let mmapData: NMData[] = [];
      processData.forEach((ne) => {
        timeSet.add(ne.startTs);
        if (ne.type === 0) {
          alData.push(ne);
        } else {
          mmapData.push(ne);
        }
      });
      let timeArr = Array.from(timeSet).sort((a, b) => a - b);
      statisticChartHandler(alData, `${ipid}-1`, timeArr);
      statisticChartHandler(mmapData, `${ipid}-2`, timeArr);
      cacheSumRowData(ipid, `${ipid}-0`, timeArr);
      timeArr.length = 0;
      timeSet.clear();
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
    let res: Array<
      | {
          nativeMemoryNormal: NMData;
          nativeMemoryStatistic: NMData;
        }
      | NMData
    > = proc(nativeMemoryChartDataCacheSql(data.params.model, data.params.recordStartNS, data.params.recordEndNS));
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      arr = (
        res as Array<{
          nativeMemoryNormal: NMData;
          nativeMemoryStatistic: NMData;
        }>
      ).map((item) => {
        let nm = new NMData();
        if (data.params.model === 'native_hook') {
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
  let cacheKey = `${data.params.ipid}-${data.params.eventType}`;
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
  let cacheSource = data.params.model === 'native_hook' ? dataCache.normalCache : dataCache.statisticsCache;
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
            maxSize: cache!.maxSize,
            minSize: cache!.minSize,
            maxDensity: cache!.maxDensity,
            minDensity: cache!.minDensity,
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
  let cache = model === 'native_hook' ? dataCache.normalCache.get(key) : dataCache.statisticsCache.get(key);
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
