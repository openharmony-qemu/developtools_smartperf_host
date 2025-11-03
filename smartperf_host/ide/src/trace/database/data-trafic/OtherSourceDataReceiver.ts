/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { TraficEnum } from "./utils/QueryEnum";

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

interface OtherSourceCacheType {
  maxSize: number;
  minSize: number;
  maxDensity: number;
  minDensity: number;
  dataList: Array<OtherSourceChartDataType>;
}

class OtherSourceChartDataType {
  startTime: number = 0;
  dur: number = 0;
  heapSize: number = 0;
  density: number = 0;
}


const dataCache: {
  normalCache: Map<string, OtherSourceCacheType>;
  statisticsCache: Map<string, OtherSourceCacheType>;
} = {
  normalCache: new Map<string, OtherSourceCacheType>(),
  statisticsCache: new Map<string, OtherSourceCacheType>(),
};

class OSData {
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

class OSDataSource {
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

function otherSourceCacheSql(model: string, startNS: number, endNS: number): string {
  if (model === 'native_hook') {
    return '';
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
            where type in ( 4, 5 )
            and ts between ${startNS} and ${endNS};
    `;
  }
}

export function otherSourceDataHandler(data: SenderParam, proc: Function): void {
  if (data.params.isCache) {
    dataCache.normalCache.clear();
    dataCache.statisticsCache.clear();
    let arr: OSData[] = [];
    let res: Array<
      | {
        otherSourceNormal: OSData;
        otherSourceStatistic: OSData;
      }
      | OSData
    > = proc(otherSourceCacheSql(data.params.model, data.params.recordStartNS, data.params.recordEndNS));
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      arr = (
        res as Array<{
          otherSourceNormal: OSData;
          otherSourceStatistic: OSData;
        }>
      ).map((item) => {
        let os = new OSData();
        if (data.params.model === 'native_hook') {
          Object.assign(os, item.otherSourceNormal);
        } else {
          Object.assign(os, item.otherSourceStatistic);
        }
        return os;
      });
    } else {
      arr = res as Array<OSData>;
    }
    cacheOtherSourceChartData(data.params.model, data.params.totalNS, data.params.processes, arr);
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

function cacheOtherSourceChartData(model: string, totalNS: number, processes: number[], data: Array<OSData>): void {
  processes.forEach((ipid) => {
    let processData = data.filter((ne) => ne.ipid === ipid);
    if (model === 'native_hook') {
      
    } else {
      let timeSet: Set<number> = new Set<number>();
      let dfData: OSData[] = [];
      let threadData: OSData[] = [];
      processData.forEach((ne) => {
        timeSet.add(ne.startTs);
        if (ne.type === 4) {
          dfData.push(ne);
        } else if (ne.type === 5) {
          threadData.push(ne);
        }
      });
      let timeArr = Array.from(timeSet).sort((a, b) => a - b);
      statisticChartHandler(dfData, `${ipid}-0`, timeArr);
      statisticChartHandler(threadData, `${ipid}-1`, timeArr);
      timeArr.length = 0;
      timeSet.clear();
    }
    processData.length = 0;
  });
}

function statisticChartHandler(arr: Array<OSData>, key: string, timeArr: number[]): void {
  let callGroupMap: Map<number, OSData[]> = new Map<number, OSData[]>();
  let obj: Map<number, OtherSourceChartDataType> = new Map<number, OtherSourceChartDataType>();
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
      let data: OtherSourceChartDataType = new OtherSourceChartDataType();
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
  obj: Map<number, OtherSourceChartDataType>,
  timeArr: number[]
): void {
  let source = Array.from(obj.values());
  let arr: OtherSourceChartDataType[] = [];
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

function arrayBufferCallback(data: SenderParam, transfer: boolean): void {
  let cacheKey = `${data.params.ipid}-${data.params.eventType}`;
  let dataFilter = filteOtherSourceChartData(
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

export function filteOtherSourceChartData(
  model: string,
  startNS: number,
  endNS: number,
  totalNS: number,
  drawType: number,
  frame: { width: number },
  key: string
): OSDataSource {
  let dataSource = new OSDataSource();
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

function dur2Width(startTime: number, dur: number, startNS: number, endNS: number, rect: { width: number }): number {
  let realDur = startTime + dur - Math.max(startTime, startNS);
  return Math.trunc((realDur * rect.width) / (endNS - startNS));
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

function setDataSource(
  data: Map<string, number>,
  dataSource: OSDataSource,
  cache: OtherSourceCacheType
): void {
  Array.from(data.values()).forEach((idx) => {
    dataSource.startTime.push(cache!.dataList[idx].startTime);
    dataSource.dur.push(cache!.dataList[idx].dur);
    dataSource.density.push(cache!.dataList[idx].density);
    dataSource.heapSize.push(cache!.dataList[idx].heapSize);
  });
}