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

interface NativeMemoryCacheType {
  maxSize: number;
  minSize: number;
  maxDensity: number;
  minDensity: number;
  dataList: Array<NativeMemoryChartDataType>;
}

interface NativeMemoryChartDataType {
  startTime: number;
  dur: number;
  heapSize: number;
  density: number;
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

function normalChartDataHandler(data: Array<unknown>, key: string, totalNS: number): void {
  let nmFilterLen = data.length;
  let nmFilterLevel = getFilterLevel(nmFilterLen);
  tempSize = 0;
  tempDensity = 0;
  data.map((ne: unknown, index: number): void => mergeNormalChartData(ne, nmFilterLevel, index === nmFilterLen - 1, key));
  let cache = dataCache.normalCache.get(key);
  if (cache && cache.dataList.length > 0) {
    cache.dataList[cache.dataList.length - 1].dur = totalNS - cache.dataList[cache.dataList.length - 1].startTime!;
  }
}

function mergeNormalChartData(ne: unknown, filterLevel: number, finish: boolean, key: string): void {
  let item = {
    // @ts-ignore
    startTime: ne.startTime,
    density: 0,
    heapSize: 0,
    dur: 0,
  };
  if (!dataCache.normalCache.has(key)) {
    // @ts-ignore
    if (ne.eventType === 0 || ne.eventType === 1) {
      item.density = 1;
      // @ts-ignore
      item.heapSize = ne.heapSize;
    } else {
      item.density = -1;
      // @ts-ignore
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

function mergeData(item: unknown, ne: unknown, filterLevel: number, finish: boolean, key: string): void {
  let data = dataCache.normalCache.get(key);
  if (data) {
    let last = data.dataList[data.dataList.length - 1];
    // @ts-ignore
    last.dur = item.startTime! - last.startTime!;
    if (last.dur > filterLevel || finish) {
      // @ts-ignore
      if (ne.eventType === 0 || ne.eventType === 1) {
        // @ts-ignore
        item.density = last.density! + tempDensity + 1;
        // @ts-ignore
        item.heapSize = last.heapSize! + tempSize + ne.heapSize;
      } else {
        // @ts-ignore
        item.density = last.density! + tempDensity - 1;
        // @ts-ignore
        item.heapSize = last.heapSize! + tempSize - ne.heapSize;
      }
      tempDensity = 0;
      tempSize = 0;
      // @ts-ignore
      data.maxDensity = Math.max(item.density, data.maxDensity);
      // @ts-ignore
      data.minDensity = Math.min(item.density, data.minDensity);
      // @ts-ignore
      data.maxSize = Math.max(item.heapSize, data.maxSize);
      // @ts-ignore
      data.minSize = Math.min(item.heapSize, data.minSize);
      // @ts-ignore
      data.dataList.push(item);
    } else {
      // @ts-ignore
      if (ne.eventType === 0 || ne.eventType === 1) {
        tempDensity += 1;
        // @ts-ignore
        tempSize += ne.heapSize;
      } else {
        tempDensity -= 1;
        // @ts-ignore
        tempSize -= ne.heapSize;
      }
    }
  }
}

function statisticChartHandler(arr: Array<unknown>, key: string, totalNS: number): void {
  let callGroupMap: Map<number, unknown[]> = new Map<number, unknown[]>();
  let obj: unknown = {};
  for (let hook of arr) {
    // @ts-ignore
    if (obj[hook.startTs]) {
      // @ts-ignore
      let data = obj[hook.startTs];
      // @ts-ignore
      data.startTime = hook.startTs;
      data.dur = 0;
      // @ts-ignore
      if (callGroupMap.has(hook.callchainId)) {
        // @ts-ignore
        let calls = callGroupMap.get(hook.callchainId);
        let last = calls![calls!.length - 1];
        // @ts-ignore
        data.heapSize += hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        // @ts-ignore
        data.density += hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        // @ts-ignore
        data.heapSize += hook.applySize - hook.releaseSize;
        // @ts-ignore
        data.density += hook.applyCount - hook.releaseCount;
        // @ts-ignore
        callGroupMap.set(hook.callchainId, [hook]);
      }
    } else {
      let data: unknown = {};
      // @ts-ignore
      data.startTime = hook.startTs;
      // @ts-ignore
      data.dur = 0;
      // @ts-ignore
      if (callGroupMap.has(hook.callchainId)) {
        // @ts-ignore
        let calls = callGroupMap.get(hook.callchainId);
        let last = calls![calls!.length - 1];
        // @ts-ignore
        data.heapSize = hook.applySize - last.applySize - (hook.releaseSize - last.releaseSize);
        // @ts-ignore
        data.density = hook.applyCount - last.applyCount - (hook.releaseCount - last.releaseCount);
        calls!.push(hook);
      } else {
        // @ts-ignore
        data.heapSize = hook.applySize - hook.releaseSize;
        // @ts-ignore
        data.density = hook.applyCount - hook.releaseCount;
        // @ts-ignore
        callGroupMap.set(hook.callchainId, [hook]);
      }
      // @ts-ignore
      obj[hook.startTs] = data;
    }
  }
  let cache = setStatisticsCacheMapValue(obj, totalNS);
  // @ts-ignore
  dataCache.statisticsCache.set(key, cache);
}

function setStatisticsCacheMapValue(obj: unknown, totalNS: number): unknown {
  // @ts-ignore
  let source = Object.values(obj) as {
    startTime: number;
    heapSize: number;
    density: number;
    dur: number;
  }[];
  let cache = {
    maxSize: 0,
    minSize: 0,
    maxDensity: 0,
    minDensity: 0,
    dataList: source,
  };
  for (let i = 0, len = source.length; i < len; i++) {
    if (i === len - 1) {
      source[i].dur = totalNS - source[i].startTime;
    } else {
      source[i + 1].heapSize = source[i].heapSize + source[i + 1].heapSize;
      source[i + 1].density = source[i].density + source[i + 1].density;
      source[i].dur = source[i + 1].startTime - source[i].startTime;
    }
    cache.maxSize = Math.max(cache.maxSize, source[i].heapSize);
    cache.maxDensity = Math.max(cache.maxDensity, source[i].density);
    cache.minSize = Math.min(cache.minSize, source[i].heapSize);
    cache.minDensity = Math.min(cache.minDensity, source[i].density);
  }
  return cache;
}

function cacheNativeMemoryChartData(model: string, totalNS: number, processes: number[], data: Array<unknown>): void {
  processes.forEach((ipid) => {
    // @ts-ignore
    let processData = data.filter((ne) => ne.ipid === ipid);
    if (model === 'native_hook') {
      //正常模式
      normalChartDataHandler(processData, `${ipid}-0`, totalNS);
      normalChartDataHandler(
        // @ts-ignore
        processData.filter((ne) => ne.eventType === 0 || ne.eventType === 2),
        `${ipid}-1`,
        totalNS
      );
      normalChartDataHandler(
        // @ts-ignore
        processData.filter((ne) => ne.eventType === 1 || ne.eventType === 3),
        `${ipid}-2`,
        totalNS
      );
    } else {
      //统计模式
      statisticChartHandler(processData, `${ipid}-0`, totalNS);
      statisticChartHandler(
        // @ts-ignore
        processData.filter((ne) => ne.type === 0),
        `${ipid}-1`,
        totalNS
      );
      statisticChartHandler(
        // @ts-ignore
        processData.filter((ne) => ne.type > 0),
        `${ipid}-2`,
        totalNS
      );
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

export function nativeMemoryCacheClear() {
  dataCache.normalCache.clear();
  dataCache.statisticsCache.clear();
}

export function nativeMemoryDataHandler(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.isCache) {
    dataCache.normalCache.clear();
    dataCache.statisticsCache.clear();
    let res: Array<unknown> = proc(
      // @ts-ignore
      nativeMemoryChartDataCacheSql(data.params.model, data.params.recordStartNS, data.params.recordEndNS)
    );
    // @ts-ignore
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      res = res.map((item) => {
        // @ts-ignore
        if (data.params.model === 'native_hook') {
          return {
            // @ts-ignore
            startTime: item.nativeMemoryNormal.startTime || 0,
            // @ts-ignore
            heapSize: item.nativeMemoryNormal.heapSize || 0,
            // @ts-ignore
            eventType: item.nativeMemoryNormal.eventType || 0,
            // @ts-ignore
            ipid: item.nativeMemoryNormal.ipid || 0,
          };
        } else {
          return {
            // @ts-ignore
            callchainId: item.nativeMemoryStatistic.callchainId || 0,
            // @ts-ignore
            startTs: item.nativeMemoryStatistic.startTs || 0,
            // @ts-ignore
            applyCount: item.nativeMemoryStatistic.applyCount || 0,
            // @ts-ignore
            applySize: item.nativeMemoryStatistic.applySize || 0,
            // @ts-ignore
            releaseCount: item.nativeMemoryStatistic.releaseCount || 0,
            // @ts-ignore
            releaseSize: item.nativeMemoryStatistic.releaseSize || 0,
            // @ts-ignore
            ipid: item.nativeMemoryStatistic.ipid || 0,
            // @ts-ignore
            type: item.nativeMemoryStatistic.type || 0,
          };
        }
      });
    }
    // @ts-ignore
    cacheNativeMemoryChartData(data.params.model, data.params.totalNS, data.params.processes, res);
    res.length = 0;
    (self as unknown as Worker).postMessage(
      {
        // @ts-ignore
        id: data.id,
        // @ts-ignore
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

function arrayBufferCallback(data: unknown, transfer: boolean): void {
  // @ts-ignore
  let cacheKey = `${data.params.ipid}-${data.params.eventType}`;
  let dataFilter = filterNativeMemoryChartData(
    // @ts-ignore
    data.params.model,
    // @ts-ignore
    data.params.startNS,
    // @ts-ignore
    data.params.endNS,
    // @ts-ignore
    data.params.totalNS,
    // @ts-ignore
    data.params.drawType,
    // @ts-ignore
    data.params.frame,
    cacheKey
  );
  let len = dataFilter.startTime.length;
  let startTime = new Float64Array(len);
  let dur = new Float64Array(len);
  let density = new Int32Array(len);
  let heapSize = new Int32Array(len);
  for (let i = 0; i < len; i++) {
    startTime[i] = dataFilter.startTime[i];
    dur[i] = dataFilter.dur[i];
    heapSize[i] = dataFilter.heapSize[i];
    density[i] = dataFilter.density[i];
  }
  // @ts-ignore
  let cacheSource = data.params.model === 'native_hook' ? dataCache.normalCache : dataCache.statisticsCache;
  let cache = cacheSource.get(cacheKey);
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
  frame: unknown,
  key: string
): NativeMemoryDataSource {
  let dataSource = new NativeMemoryDataSource();
  let cache = model === 'native_hook' ? dataCache.normalCache.get(key) : dataCache.statisticsCache.get(key);
  if (cache !== undefined) {
    let data: unknown = {};
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
          // @ts-ignore
          let preIndex = pre[key];
          if (preIndex !== undefined) {
            if (drawType === 0) {
              // @ts-ignore
              pre[key] = cache!.dataList[preIndex].heapSize > cache!.dataList[index].heapSize ? preIndex : index;
            } else {
              // @ts-ignore
              pre[key] = cache!.dataList[preIndex].density > cache!.dataList[index].density ? preIndex : index;
            }
          } else {
            // @ts-ignore
            pre[key] = index;
          }
        }
      }
      return pre;
    }, data);
    setDataSource(data, dataSource, cache);
  }
  return dataSource;
}

function setDataSource(data: unknown, dataSource: NativeMemoryDataSource, cache: unknown) {
  // @ts-ignore
  Reflect.ownKeys(data).map((kv: string | symbol): void => {
    // @ts-ignore
    let index = data[kv as string] as number;
    // @ts-ignore
    dataSource.startTime.push(cache!.dataList[index].startTime);
    // @ts-ignore
    dataSource.dur.push(cache!.dataList[index].dur);
    // @ts-ignore
    dataSource.density.push(cache!.dataList[index].density);
    // @ts-ignore
    dataSource.heapSize.push(cache!.dataList[index].heapSize);
  });
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: unknown): number {
  if (endNS === 0) {
    endNS = duration;
  }
  // @ts-ignore
  let xSizeNM: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSizeNM < 0) {
    xSizeNM = 0;
    // @ts-ignore
  } else if (xSizeNM > rect.width) {
    // @ts-ignore
    xSizeNM = rect.width;
  }
  return xSizeNM;
}

function dur2Width(startTime: number, dur: number, startNS: number, endNS: number, rect: unknown): number {
  let realDur = startTime + dur - Math.max(startTime, startNS);
  // @ts-ignore
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
