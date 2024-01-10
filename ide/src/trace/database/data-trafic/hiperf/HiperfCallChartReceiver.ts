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

import { ConstructorComparison } from '../../../../js-heap/model/UiStruct';
import { TraficEnum } from '../utils/QueryEnum';

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
    where callchain_id != -1 and A.thread_id != 0
    order by cpuId, startTs`;
  return sql;
};

export function hiPerfCallChartDataHandler(data: any, proc: Function): void {
  if (data.params.isCache) {
    let res: Array<any> = proc(chartHiperfCallChartDataSql(data.params));
    for (let i = 0; i < res.length; i++) {
      if (i > 0) {
        if (res[i].cpuId === res[i - 1].cpuId) {
          res[i - 1].dur = res[i].startTs - res[i - 1].startTs;
        } else {
          res[i - 1].dur = data.params.endNS - res[i - 1].startTs;
        }
      }
      if (i === res.length - 1) {
        res[i].dur = data.params.endNS - res[i].startTs;
      }
    }
    dataCache.sampleList = res;
    (self as unknown as Worker).postMessage(
      {
        len: 0,
        id: data.id,
        action: data.action,
        results: 'ok',
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
  let params = data.params;
  let dataFilter = filterPerfCallChartData(params.startNS, params.endNS, params.totalNS, params.frame, params.expand);
  let len = dataFilter.startTs.length;
  let perfCallChart = new PerfCallChart(len);
  for (let i = 0; i < len; i++) {
    perfCallChart.startTs[i] = dataFilter.startTs[i];
    perfCallChart.dur[i] = dataFilter.dur[i];
    perfCallChart.depth[i] = dataFilter.depth[i];
    perfCallChart.eventCount[i] = dataFilter.eventCount[i];
    perfCallChart.symbolId[i] = dataFilter.symbolId[i];
    perfCallChart.fileId[i] = dataFilter.fileId[i];
    perfCallChart.callchainId[i] = dataFilter.callchainId[i];
    perfCallChart.selfDur[i] = dataFilter.selfDur[i];
    perfCallChart.name[i] = dataFilter.name[i];
  }
  postPerfCallChartMessage(data, transfer, perfCallChart, len);
}
function postPerfCallChartMessage(data: any, transfer: boolean, perfCallChart: PerfCallChart, len: number) {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTs: perfCallChart.startTs.buffer,
            dur: perfCallChart.dur.buffer,
            depth: perfCallChart.depth.buffer,
            callchainId: perfCallChart.callchainId.buffer,
            eventCount: perfCallChart.eventCount.buffer,
            symbolId: perfCallChart.symbolId.buffer,
            fileId: perfCallChart.fileId.buffer,
            selfDur: perfCallChart.selfDur.buffer,
            name: perfCallChart.name.buffer,
            maxDepth: dataCache.maxDepth,
          }
        : {},
      len: len,
    },
    transfer
      ? [
          perfCallChart.startTs.buffer,
          perfCallChart.dur.buffer,
          perfCallChart.depth.buffer,
          perfCallChart.callchainId.buffer,
          perfCallChart.eventCount.buffer,
          perfCallChart.symbolId.buffer,
          perfCallChart.fileId.buffer,
          perfCallChart.selfDur.buffer,
          perfCallChart.name.buffer,
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
): DataSource {
  let dataSource = new DataSource();
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
  setDataSource(data, dataSource);
  return dataSource;
}
function setDataSource(data: any, dataSource: DataSource) {
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
}
// 将perf_sample表的数据根据callchain_id分组并赋值startTime,endTime等等
function combinePerfSampleByCallChainId(sampleList: Array<any>, params: any): any[] {
  return combineChartData(
    sampleList.map((sample) => {
      let perfSample: any = {};
      perfSample.children = new Array<any>();
      perfSample.children[0] = {};
      perfSample.depth = -1;
      perfSample.callchainId = sample.callchainId;
      perfSample.threadId = sample.threadId;
      perfSample.id = sample.id;
      perfSample.cpuId = sample.cpuId;
      perfSample.startTime = sample.startTs;
      perfSample.endTime = sample.startTs + sample.dur;
      perfSample.totalTime = sample.dur;
      perfSample.eventCount = sample.eventCount;
      return perfSample;
    }),
    params
  );
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
      stackTopSymbol.totalTime = sample.totalTime;
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
        let pre = combineSample[combineSample.length - 1];
        if (params.type === 0) {
          if (pre.threadId === sample.threadId && pre.endTime === sample.startTime) {
            combinePerfCallData(combineSample[combineSample.length - 1], sample);
          } else {
            combineSample.push(sample);
          }
        } else {
          if (pre.cpuId === sample.cpuId && pre.endTime === sample.startTime) {
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
    data1.totalTime = data1.endTime - data1.startTime;
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
      data1.totalTime = data1.endTime - data1.startTime;
      data1.children = new Array<any>();
      data1.children.push(data2.children[0]);
    } else {
    }
  }
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
      };
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
  let xSizeHiperf: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSizeHiperf < 0) {
    xSizeHiperf = 0;
  } else if (xSizeHiperf > rect.width) {
    xSizeHiperf = rect.width;
  }
  return xSizeHiperf;
}
class PerfCallChart {
  startTs: Float64Array;
  dur: Float64Array;
  depth: Int32Array;
  eventCount: Int32Array;
  symbolId: Int32Array;
  fileId: Int32Array;
  callchainId: Int32Array;
  selfDur: Int32Array;
  name: Int32Array;
  constructor(len: number) {
    this.startTs = new Float64Array(len);
    this.dur = new Float64Array(len);
    this.depth = new Int32Array(len);
    this.eventCount = new Int32Array(len);
    this.symbolId = new Int32Array(len);
    this.fileId = new Int32Array(len);
    this.callchainId = new Int32Array(len);
    this.selfDur = new Int32Array(len);
    this.name = new Int32Array(len);
  }
}
class DataSource {
  startTs: Array<number>;
  dur: Array<number>;
  depth: Array<number>;
  eventCount: Array<number>;
  symbolId: Array<number>;
  fileId: Array<number>;
  callchainId: Array<number>;
  selfDur: Array<number>;
  name: Array<number>;
  constructor() {
    this.startTs = [];
    this.dur = [];
    this.depth = [];
    this.eventCount = [];
    this.symbolId = [];
    this.fileId = [];
    this.callchainId = [];
    this.selfDur = [];
    this.name = [];
  }
}
