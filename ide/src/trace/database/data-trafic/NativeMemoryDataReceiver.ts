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

function normalChartDataHandler(data: Array<any>, key: string, totalNS: number): void {
  let nmFilterLen = data.length;
  let nmFilterLevel = getFilterLevel(nmFilterLen);
  tempSize = 0;
  tempDensity = 0;
  data.map((ne: any, index: number): void => mergeNormalChartData(ne, nmFilterLevel, index === nmFilterLen - 1, key));
  let cache = dataCache.normalCache.get(key);
  if (cache && cache.dataList.length > 0) {
    cache.dataList[cache.dataList.length - 1].dur = totalNS - cache.dataList[cache.dataList.length - 1].startTime!;
  }
}

function mergeNormalChartData(ne: any, filterLevel: number, finish: boolean, key: string): void {
  let item = {
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

function mergeData(item: any, ne: any, filterLevel: number, finish: boolean, key: string): void {
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

function statisticChartHandler(arr: Array<any>, key: string, totalNS: number): void {
  let callGroupMap: Map<number, any[]> = new Map<number, any[]>();
  let obj: any = {};
  for (let hook of arr) {
    if (obj[hook.startTs]) {
      let data = obj[hook.startTs];
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
      let data: any = {};
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
      obj[hook.startTs] = data;
    }
  }
  let cache = setStatisticsCacheMapValue(obj, totalNS);
  dataCache.statisticsCache.set(key, cache);
}

function setStatisticsCacheMapValue(obj: any, totalNS: number): any {
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

function cacheNativeMemoryChartData(model: string, totalNS: number, processes: number[], data: Array<any>): void {
  processes.forEach(ipid => {
    let processData = data.filter(ne => ne.ipid === ipid);
    if (model === 'native_hook') {
      //正常模式
      normalChartDataHandler(processData, `${ipid}-0`, totalNS);
      normalChartDataHandler(
        processData.filter(ne => ne.eventType === 0 || ne.eventType === 2),
        `${ipid}-1`,
        totalNS
      );
      normalChartDataHandler(
        processData.filter(ne => ne.eventType === 1 || ne.eventType === 3),
        `${ipid}-2`,
        totalNS
      );
    } else {
      //统计模式
      statisticChartHandler(processData, `${ipid}-0`, totalNS);
      statisticChartHandler(
        processData.filter(ne => ne.type === 0),
        `${ipid}-1`,
        totalNS
      );
      statisticChartHandler(
        processData.filter(ne => ne.type > 0),
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

export function nativeMemoryDataHandler(data: any, proc: Function): void {
  if (data.params.isCache) {
    dataCache.normalCache.clear();
    dataCache.statisticsCache.clear();
    let res: Array<any> = proc(
      nativeMemoryChartDataCacheSql(data.params.model, data.params.recordStartNS, data.params.recordEndNS)
    );
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      res = res.map((item) => {
        if (data.params.model === 'native_hook') {
          return {
            startTime: item.nativeMemoryNormal.startTime || 0,
            heapSize: item.nativeMemoryNormal.heapSize || 0,
            eventType: item.nativeMemoryNormal.eventType || 0,
            ipid: item.nativeMemoryNormal.ipid || 0,
          };
        } else {
          return {
            callchainId: item.nativeMemoryStatistic.callchainId || 0,
            startTs: item.nativeMemoryStatistic.startTs || 0,
            applyCount: item.nativeMemoryStatistic.applyCount || 0,
            applySize: item.nativeMemoryStatistic.applySize || 0,
            releaseCount: item.nativeMemoryStatistic.releaseCount || 0,
            releaseSize: item.nativeMemoryStatistic.releaseSize || 0,
            ipid: item.nativeMemoryStatistic.ipid || 0,
            type: item.nativeMemoryStatistic.type || 0,
          };
        }
      });
    }
    cacheNativeMemoryChartData(data.params.model, data.params.totalNS, data.params.processes, res);
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

function arrayBufferCallback(data: any, transfer: boolean): void {
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
  let heapSize = new Int32Array(len);
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
  frame: any,
  key: string
): NativeMemoryDataSource {
  let dataSource = new NativeMemoryDataSource();
  let cache = model === 'native_hook' ? dataCache.normalCache.get(key) : dataCache.statisticsCache.get(key);
  if (cache !== undefined) {
    let data: any = {};
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
          let preIndex = pre[key];
          if (preIndex !== undefined) {
            if (drawType === 0) {
              pre[key] = cache!.dataList[preIndex].heapSize > cache!.dataList[index].heapSize ? preIndex : index;
            } else {
              pre[key] = cache!.dataList[preIndex].density > cache!.dataList[index].density ? preIndex : index;
            }
          } else {
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

function setDataSource(data: any, dataSource: NativeMemoryDataSource, cache: any) {
  Reflect.ownKeys(data).map((kv: string | symbol): void => {
    let index = data[kv as string] as number;
    dataSource.startTime.push(cache!.dataList[index].startTime);
    dataSource.dur.push(cache!.dataList[index].dur);
    dataSource.density.push(cache!.dataList[index].density);
    dataSource.heapSize.push(cache!.dataList[index].heapSize);
  });
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: any): number {
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

function dur2Width(startTime: number, dur: number, startNS: number, endNS: number, rect: any): number {
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
