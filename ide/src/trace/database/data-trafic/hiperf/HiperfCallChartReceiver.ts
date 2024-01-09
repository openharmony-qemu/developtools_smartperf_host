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

import { TraficEnum } from "../utils/QueryEnum";

interface HiPerfSampleType {
  callchainId: number;
  startTs: number;
  eventCount: number;
  threadId: number;
  cpuId: number;
  eventTypeId: number;
}

const dataCache: {
  startTs: Array<number>;
  dur: Array<number>;
  depth: Array<number>;
  eventCount: Array<number>;
  symbolId: Array<number>;
  fileId: Array<number>;
  callchainId: Array<number>;
  selfDur: Array<number>;
  name: Array<number>;
  callstack: Map<string, any>;
  sampleList: Array<HiPerfSampleType>;
  maxDepth: number;
} = {
  callstack: new Map<string, any>(),
  sampleList: [],
  maxDepth: 1,
  startTs: [],
  dur: [],
  depth: [],
  eventCount: [],
  symbolId: [],
  fileId: [],
  callchainId: [],
  selfDur: [],
  name: [],
};

export const chartHiperfCallChartDataSql = (args: any): string => {
  const sql = `
    select callchain_id                             as callchainId,
           timestamp_trace - ${args.recordStartNS}  as startTs,
           event_count                              as eventCount,
           A.thread_id                              as threadId,
           cpu_id                                   as cpuId,
           event_type_id                            as eventTypeId
    from perf_sample A
    where callchain_id != -1 and A.thread_id != 0`;
  return sql;
};

export function hiPerfCallChartDataHandler(data: any, proc: Function): void {
  if (data.params.isCache) {
    let res: Array<any> = proc(chartHiperfCallChartDataSql(data.params));
    dataCache.sampleList = res.map(it => {
      if (data.params.trafic === TraficEnum.ProtoBuffer) {
        return {
          callchainId: it.hiperfCallChartData.callchainId || 0,
          startTs: it.hiperfCallChartData.startTs || 0,
          eventCount: it.hiperfCallChartData.eventCount || 0,
          threadId: it.hiperfCallChartData.threadId || 0,
          cpuId: it.hiperfCallChartData.cpuId || 0,
          eventTypeId: it.hiperfCallChartData.eventTypeId || 0,
        }
      } else {
        return it;
      }
    });
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
    let res: Array<any> = [];
    if (!data.params.isComplete) {
      res = dataCache.sampleList.filter((it) => {
        let cpuThreadFilter = data.params.type === 0 ? it.cpuId === data.params.id : it.threadId === data.params.id;
        let eventTypeFilter = data.params.eventTypeId === -2 ? true : it.eventTypeId === data.params.eventTypeId;
        return cpuThreadFilter && eventTypeFilter;
      });
    }
    arrayBufferHandler(data, res, true, !data.params.isComplete);
  }
}

export function hiPerfCallStackCacheHandler(data: any, proc: Function): void {
  if (data.params.isCache) {
    hiPerfCallChartClearCache(true);
    arrayBufferCallStackHandler(data, proc(hiPerfCallStackDataCacheSql()));
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean, loadData: boolean): void {
  if (loadData) {
    let result = combinePerfSampleByCallChainId(res, data.params);
    hiPerfCallChartClearCache(false);
    const getArrayData = (combineData: Array<any>): void => {
      for (let item of combineData) {
        if (item.depth > -1) {
          dataCache.startTs.push(item.startTime);
          dataCache.dur.push(item.totalTime);
          dataCache.depth.push(item.depth);
          dataCache.eventCount.push(item.eventCount);
          dataCache.symbolId.push(item.symbolId);
          dataCache.fileId.push(item.fileId);
          dataCache.callchainId.push(item.callchainId);
          dataCache.name.push(item.name);
          let self = item.totalTime || 0;
          if (item.children) {
            (item.children as Array<any>).forEach((child) => {
              self -= child.totalTime;
            });
          }
          dataCache.selfDur.push(self);
        }
        if (item.depth + 1 > dataCache.maxDepth) {
          dataCache.maxDepth = item.depth + 1;
        }
        if (item.children && item.children.length > 0) {
          getArrayData(item.children);
        }
      }
    };
    getArrayData(result);
  }
  setTimeout((): void => {
    arrayBufferCallback(data, transfer);
  }, 150);
}

function arrayBufferCallback(data: any, transfer: boolean): void {
  let dataFilter = filterPerfCallChartData(
    data.params.startNS,
    data.params.endNS,
    data.params.totalNS,
    data.params.frame,
    data.params.expand
  );
  let len = dataFilter.startTs.length;
  let startTs = new Float64Array(len);
  let dur = new Float64Array(len);
  let depth = new Int32Array(len);
  let eventCount = new Int32Array(len);
  let symbolId = new Int32Array(len);
  let fileId = new Int32Array(len);
  let callchainId = new Int32Array(len);
  let selfDur = new Int32Array(len);
  let name = new Int32Array(len);
  for (let i = 0; i < len; i++) {
    startTs[i] = dataFilter.startTs[i];
    dur[i] = dataFilter.dur[i];
    depth[i] = dataFilter.depth[i];
    eventCount[i] = dataFilter.eventCount[i];
    symbolId[i] = dataFilter.symbolId[i];
    fileId[i] = dataFilter.fileId[i];
    callchainId[i] = dataFilter.callchainId[i];
    selfDur[i] = dataFilter.selfDur[i];
    name[i] = dataFilter.name[i];
  }
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTs: startTs.buffer,
            dur: dur.buffer,
            depth: depth.buffer,
            callchainId: callchainId.buffer,
            eventCount: eventCount.buffer,
            symbolId: symbolId.buffer,
            fileId: fileId.buffer,
            selfDur: selfDur.buffer,
            name: name.buffer,
            maxDepth: dataCache.maxDepth,
          }
        : {},
      len: len,
    },
    transfer
      ? [
          startTs.buffer,
          dur.buffer,
          depth.buffer,
          callchainId.buffer,
          eventCount.buffer,
          symbolId.buffer,
          fileId.buffer,
          selfDur.buffer,
          name.buffer,
        ]
      : []
  );
}

export function filterPerfCallChartData(
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  expand: boolean
): {
  startTs: Array<number>;
  dur: Array<number>;
  depth: Array<number>;
  eventCount: Array<number>;
  symbolId: Array<number>;
  fileId: Array<number>;
  callchainId: Array<number>;
  selfDur: Array<number>;
  name: Array<number>;
} {
  let dataSource: {
    startTs: Array<number>;
    dur: Array<number>;
    depth: Array<number>;
    eventCount: Array<number>;
    symbolId: Array<number>;
    fileId: Array<number>;
    callchainId: Array<number>;
    selfDur: Array<number>;
    name: Array<number>;
  } = {
    startTs: [],
    dur: [],
    depth: [],
    eventCount: [],
    symbolId: [],
    fileId: [],
    callchainId: [],
    selfDur: [],
    name: [],
  };
  let data: any = {};
  dataCache.startTs.reduce((pre, current, index) => {
    if (
      dataCache.dur[index] > 0 &&
      current + dataCache.dur[index] >= startNS &&
      current <= endNS &&
      ((!expand && dataCache.depth[index] === 0) || expand)
    ) {
      let x = 0;
      if (current > startNS && current < endNS) {
        x = Math.trunc(ns2x(current, startNS, endNS, totalNS, frame));
      } else {
        x = 0;
      }
      let key = `${x}-${dataCache.depth[index]}`;
      let preIndex = pre[key];
      if (preIndex !== undefined) {
        pre[key] = dataCache.dur[preIndex] > dataCache.dur[index] ? preIndex : index;
      } else {
        pre[key] = index;
      }
    }
    return pre;
  }, data);
  Reflect.ownKeys(data).map((kv: string | symbol): void => {
    let index = data[kv as string] as number;
    dataSource.startTs.push(dataCache.startTs[index]);
    dataSource.dur.push(dataCache.dur[index]);
    dataSource.depth.push(dataCache.depth[index]);
    dataSource.eventCount.push(dataCache.eventCount[index]);
    dataSource.symbolId.push(dataCache.symbolId[index]);
    dataSource.fileId.push(dataCache.fileId[index]);
    dataSource.callchainId.push(dataCache.callchainId[index]);
    dataSource.selfDur.push(dataCache.selfDur[index]);
    dataSource.name.push(dataCache.name[index]);
  });
  return dataSource;
}

// 将perf_sample表的数据根据callchain_id分组并赋值startTime,endTime等等
function combinePerfSampleByCallChainId(sampleList: Array<any>, params: any): any[] {
  let arr: any = new Array();
  let newPerfData = (sample: any): any => {
    let perfSample: any = {};
    perfSample.children = new Array<any>();
    perfSample.children[0] = {};
    perfSample.depth = -1;
    perfSample.callchainId = sample.callchainId;
    perfSample.threadId = sample.threadId;
    perfSample.id = sample.id;
    perfSample.startTime = sample.startTs;
    perfSample.eventCount = sample.eventCount;
    return perfSample;
  };
  for (let i = 0; i < sampleList.length; i++) {
    if (arr.length > 0) {
      let last = arr[arr.length - 1];
      last.endTime = sampleList[i].startTs;
      last.totalTime = last.endTime - last.startTime;
      if (last.callchainId === sampleList[i].callchainId) {
        last.eventCount += sampleList[i].eventCount;
      } else {
        arr.push(newPerfData(sampleList[i]));
      }
    } else {
      arr.push(newPerfData(sampleList[i]));
    }
  }
  let last = arr[arr.length - 1];
  if (last && (last.endTime === 0 || last.endTime === undefined)) {
    last.endTime = params.totalNS;
    last.totalTime = last.endTime - last.startTime;
  }
  return combineChartData(arr, params);
}

function combineChartData(samples: any, params: any): Array<any> {
  let combineSample: any = [];
  // 遍历sample表查到的数据，并且为其匹配相应的callchain数据
  for (let sample of samples) {
    let stackTop = dataCache.callstack.get(`${sample.callchainId}-0`);
    if (stackTop) {
      let stackTopSymbol = JSON.parse(JSON.stringify(stackTop));
      stackTopSymbol.startTime = sample.startTime;
      stackTopSymbol.endTime = sample.endTime;
      stackTopSymbol.totalTime = sample.endTime - sample.startTime;
      stackTopSymbol.threadId = sample.threadId;
      stackTopSymbol.cpuId = sample.cpuId;
      stackTopSymbol.eventCount = sample.eventCount;
      setDur(stackTopSymbol);
      sample.children = new Array<any>();
      sample.children.push(stackTopSymbol);
      // 每一项都和combineSample对比
      if (combineSample.length === 0) {
        combineSample.push(sample);
      } else {
        if (params.type === 0) {
          if (combineSample[combineSample.length - 1].threadId === sample.threadId) {
            combinePerfCallData(combineSample[combineSample.length - 1], sample);
          } else {
            combineSample.push(sample);
          }
        } else {
          if (combineSample[combineSample.length - 1].cpuId === sample.cpuId) {
            combinePerfCallData(combineSample[combineSample.length - 1], sample);
          } else {
            combineSample.push(sample);
          }
        }
      }
    }
  }
  return combineSample;
}

// 递归设置dur,startTime,endTime
function setDur(data: any): void {
  if (data.children && data.children.length > 0) {
    data.children[0].totalTime = data.totalTime;
    data.children[0].startTime = data.startTime;
    data.children[0].endTime = data.endTime;
    data.children[0].threadId = data.threadId;
    data.children[0].cpuId = data.cpuId;
    data.children[0].eventCount = data.eventCount;
    setDur(data.children[0]);
  } else {
    return;
  }
}

// hiperf火焰图合并逻辑
function combinePerfCallData(data1: any, data2: any): void {
  if (fixMergeRuler(data1, data2)) {
    data1.endTime = data2.endTime;
    data1.eventCount += data2.eventCount;
    if (data1.children && data1.children.length > 0 && data2.children && data2.children.length > 0) {
      if (fixMergeRuler(data1.children[data1.children.length - 1], data2.children[0])) {
        combinePerfCallData(data1.children[data1.children.length - 1], data2.children[0]);
      } else {
        if (data1.children[data1.children.length - 1].depth === data2.children[0].depth) {
          data1.children.push(data2.children[0]);
        }
      }
    } else if (data2.children && data2.children.length > 0 && (!data1.children || data1.children.length === 0)) {
      data1.endTime = data2.endTime;
      data1.totalTime = data1.endTime - data1.endTime;
      data1.children = new Array<any>();
      data1.children.push(data2.children[0]);
    } else {
    }
  }
  data1.totalTime = data1.endTime - data1.startTime;
  return;
}

/**
 * 合并规则
 * @param data1
 * @param data2
 */
function fixMergeRuler(data1: any, data2: any): boolean {
  return data1.depth === data2.depth && data1.name === data2.name;
}

export const hiPerfCallStackDataCacheSql = (): string => {
  return `select c.callchain_id as callchainId,
                 c.file_id   as fileId,
                 c.depth,
                 c.symbol_id as symbolId,
                 c.name
          from perf_callchain c
          where callchain_id != -1;`;
};

export function hiPerfCallChartClearCache(clearStack: boolean): void {
  if (clearStack) {
    dataCache.callstack.clear();
    dataCache.sampleList.length = 0;
  }
  dataCache.startTs = [];
  dataCache.dur = [];
  dataCache.depth = [];
  dataCache.eventCount = [];
  dataCache.symbolId = [];
  dataCache.fileId = [];
  dataCache.callchainId = [];
  dataCache.selfDur = [];
  dataCache.name = [];
  dataCache.maxDepth = 1;
}

function arrayBufferCallStackHandler(data: any, res: any[]): void {
  for (const stack of res) {
    let item = stack;
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      item = {
        callchainId: stack.hiperfCallStackData.callchainId || 0,
        fileId: stack.hiperfCallStackData.fileId || 0,
        depth: stack.hiperfCallStackData.depth || 0,
        symbolId: stack.hiperfCallStackData.symbolId || 0,
        name: stack.hiperfCallStackData.name || 0,
      }
    }
    dataCache.callstack.set(`${item.callchainId}-${item.depth}`, item);
    let parentSymbol = dataCache.callstack.get(`${item.callchainId}-${item.depth - 1}`);
    if (parentSymbol && parentSymbol.callchainId === item.callchainId && parentSymbol.depth === item.depth - 1) {
      parentSymbol.children = new Array<any>();
      parentSymbol.children.push(item);
    }
  }
  for (let key of Array.from(dataCache.callstack.keys())) {
    if (!key.endsWith('-0')) {
      dataCache.callstack.delete(key);
    }
  }
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: 'ok',
      len: res.length,
    },
    []
  );
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: any): number {
  if (endNS === 0) {
    endNS = duration;
  }
  let xSize: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSize < 0) {
    xSize = 0;
  } else if (xSize > rect.width) {
    xSize = rect.width;
  }
  return xSize;
}
