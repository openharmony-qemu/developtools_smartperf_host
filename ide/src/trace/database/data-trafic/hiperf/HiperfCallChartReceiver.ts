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
  callstack: Map<string, unknown>;
  sampleList: Array<HiPerfSampleType>;
  maxDepth: number;
} = {
  callstack: new Map<string, unknown>(),
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

export const chartHiperfCallChartDataSql = (args: unknown): string => {
  const sql = `
    select callchain_id                             as callchainId,
           timestamp_trace - ${
    // @ts-ignore
    args.recordStartNS
    }  as startTs,
           event_count                              as eventCount,
           A.thread_id                              as threadId,
           cpu_id                                   as cpuId,
           event_type_id                            as eventTypeId
    from perf_sample A
    where callchain_id != -1 and A.thread_id != 0
    order by cpuId, startTs`;
  return sql;
};

export function hiPerfCallChartDataHandler(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.isCache) {
    // @ts-ignore
    let res: Array<unknown> = proc(chartHiperfCallChartDataSql(data.params));
    for (let i = 0; i < res.length; i++) {
      if (i > 0) {
        // @ts-ignore
        if (res[i].cpuId === res[i - 1].cpuId) {
          // @ts-ignore
          res[i - 1].dur = res[i].startTs - res[i - 1].startTs;
        } else {
          // @ts-ignore
          res[i - 1].dur = data.params.recordEndNS - data.params.recordStartNS - res[i - 1].startTs;
        }
      }
      if (i === res.length - 1) {
        // @ts-ignore
        res[i].dur = data.params.recordEndNS - data.params.recordStartNS - res[i].startTs;
      }
    }
    // @ts-ignore
    dataCache.sampleList = res;
    (self as unknown as Worker).postMessage(
      {
        len: 0,
        // @ts-ignore
        id: data.id,
        // @ts-ignore
        action: data.action,
        results: 'ok',
      },
      []
    );
  } else {
    let res: Array<unknown> = [];
    // @ts-ignore
    if (!data.params.isComplete) {
      res = dataCache.sampleList.filter((it) => {
        // @ts-ignore
        let cpuThreadFilter = data.params.type === 0 ? it.cpuId === data.params.id : it.threadId === data.params.id;
        // @ts-ignore
        let eventTypeFilter = data.params.eventTypeId === -2 ? true : it.eventTypeId === data.params.eventTypeId;
        return cpuThreadFilter && eventTypeFilter;
      });
    }
    // @ts-ignore
    arrayBufferHandler(data, res, true, !data.params.isComplete);
  }
}

export function hiPerfCallStackCacheHandler(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.isCache) {
    hiPerfCallChartClearCache(true);
    arrayBufferCallStackHandler(data, proc(hiPerfCallStackDataCacheSql()));
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean, loadData: boolean): void {
  if (loadData) {
    // @ts-ignore
    if (data.params.type !== 0) {
      // @ts-ignore
      res.sort((a, b) => a.startTs - b.startTs);
      for (let i = 0; i < res.length; i++) {
        if (i < res.length - 1) {
          // @ts-ignore
          res[i].dur = res[i + 1].startTs - res[i].startTs;
        } else {
          // @ts-ignore
          res[i].dur = data.params.endNS - data.params.startNS - res[i].startTs;
        }
      }
    }
    // @ts-ignore
    let result = combinePerfSampleByCallChainId(res, data.params);
    hiPerfCallChartClearCache(false);
    const getArrayData = (combineData: Array<unknown>): void => {
      for (let item of combineData) {
        // @ts-ignore
        if (item.depth > -1) {
          // @ts-ignore
          dataCache.startTs.push(item.startTime);
          // @ts-ignore
          dataCache.dur.push(item.totalTime);
          // @ts-ignore
          dataCache.depth.push(item.depth);
          // @ts-ignore
          dataCache.eventCount.push(item.eventCount);
          // @ts-ignore
          dataCache.symbolId.push(item.symbolId);
          // @ts-ignore
          dataCache.fileId.push(item.fileId);
          // @ts-ignore
          dataCache.callchainId.push(item.callchainId);
          // @ts-ignore
          dataCache.name.push(item.name);
          // @ts-ignore
          let self = item.totalTime || 0;
          // @ts-ignore
          if (item.children) {
            // @ts-ignore
            (item.children as Array<unknown>).forEach((child) => {
              // @ts-ignore
              self -= child.totalTime;
            });
          }
          dataCache.selfDur.push(self);
        }
        // @ts-ignore
        if (item.depth + 1 > dataCache.maxDepth) {
          // @ts-ignore
          dataCache.maxDepth = item.depth + 1;
        }
        // @ts-ignore
        if (item.children && item.children.length > 0) {
          // @ts-ignore
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

function arrayBufferCallback(data: unknown, transfer: boolean): void {
  // @ts-ignore
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
function postPerfCallChartMessage(data: unknown, transfer: boolean, perfCallChart: PerfCallChart, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
  frame: unknown,
  expand: boolean
): DataSource {
  let dataSource = new DataSource();
  let data: unknown = {};
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
      // @ts-ignore
      let preIndex = pre[key];
      if (preIndex !== undefined) {
        // @ts-ignore
        pre[key] = dataCache.dur[preIndex] > dataCache.dur[index] ? preIndex : index;
      } else {
        // @ts-ignore
        pre[key] = index;
      }
    }
    return pre;
  }, data);
  setDataSource(data, dataSource);
  return dataSource;
}
function setDataSource(data: unknown, dataSource: DataSource): void {
  // @ts-ignore
  Reflect.ownKeys(data).map((kv: string | symbol): void => {
    // @ts-ignore
    let index = data[kv as string] as number;
    // @ts-ignore
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
function combinePerfSampleByCallChainId(sampleList: Array<unknown>, params: unknown): unknown[] {
  return combineChartData(
    sampleList.map((sample) => {
      let perfSample: unknown = {};
      // @ts-ignore
      perfSample.children = [];
      // @ts-ignore
      perfSample.children[0] = {};
      // @ts-ignore
      perfSample.depth = -1;
      // @ts-ignore
      perfSample.callchainId = sample.callchainId;
      // @ts-ignore
      perfSample.threadId = sample.threadId;
      // @ts-ignore
      perfSample.id = sample.id;
      // @ts-ignore
      perfSample.cpuId = sample.cpuId;
      // @ts-ignore
      perfSample.startTime = sample.startTs;
      // @ts-ignore
      perfSample.endTime = sample.startTs + sample.dur;
      // @ts-ignore
      perfSample.totalTime = sample.dur;
      // @ts-ignore
      perfSample.eventCount = sample.eventCount;
      return perfSample;
    }),
    params
  );
}

function combineChartData(samples: unknown, params: unknown): Array<unknown> {
  let combineSample: unknown = [];
  // 遍历sample表查到的数据，并且为其匹配相应的callchain数据
  // @ts-ignore
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
      sample.children = [];
      sample.children.push(stackTopSymbol);
      // 每一项都和combineSample对比
      // @ts-ignore
      if (combineSample.length === 0) {
        // @ts-ignore
        combineSample.push(sample);
      } else {
        // @ts-ignore
        let pre = combineSample[combineSample.length - 1];
        // @ts-ignore
        if (params.type === 0) {
          if (pre.threadId === sample.threadId && pre.endTime === sample.startTime) {
            // @ts-ignore
            combinePerfCallData(combineSample[combineSample.length - 1], sample);
          } else {
            // @ts-ignore
            combineSample.push(sample);
          }
        } else {
          // @ts-ignore
          combinePerfCallData(combineSample[combineSample.length - 1], sample);
        }
      }
    }
  }
  // @ts-ignore
  return combineSample;
}

// 递归设置dur,startTime,endTime
function setDur(data: unknown): void {
  // @ts-ignore
  if (data.children && data.children.length > 0) {
    // @ts-ignore
    data.children[0].totalTime = data.totalTime;
    // @ts-ignore
    data.children[0].startTime = data.startTime;
    // @ts-ignore
    data.children[0].endTime = data.endTime;
    // @ts-ignore
    data.children[0].threadId = data.threadId;
    // @ts-ignore
    data.children[0].cpuId = data.cpuId;
    // @ts-ignore
    data.children[0].eventCount = data.eventCount;
    // @ts-ignore
    setDur(data.children[0]);
  } else {
    return;
  }
}

// hiperf火焰图合并逻辑
function combinePerfCallData(data1: unknown, data2: unknown): void {
  if (fixMergeRuler(data1, data2)) {
    // @ts-ignore
    data1.endTime = data2.endTime;
    // @ts-ignore
    data1.totalTime = data1.endTime - data1.startTime;
    // @ts-ignore
    data1.eventCount += data2.eventCount;
    // @ts-ignore
    if (data1.children && data1.children.length > 0 && data2.children && data2.children.length > 0) {
      // @ts-ignore
      if (fixMergeRuler(data1.children[data1.children.length - 1], data2.children[0])) {
        // @ts-ignore
        combinePerfCallData(data1.children[data1.children.length - 1], data2.children[0]);
      } else {
        // @ts-ignore
        if (data1.children[data1.children.length - 1].depth === data2.children[0].depth) {
          // @ts-ignore
          data1.children.push(data2.children[0]);
        }
      }
      // @ts-ignore
    } else if (data2.children && data2.children.length > 0 && (!data1.children || data1.children.length === 0)) {
      // @ts-ignore
      data1.endTime = data2.endTime;
      // @ts-ignore
      data1.totalTime = data1.endTime - data1.startTime;
      // @ts-ignore
      data1.children = [];
      // @ts-ignore
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
function fixMergeRuler(data1: unknown, data2: unknown): boolean {
  // @ts-ignore
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

function arrayBufferCallStackHandler(data: unknown, res: unknown[]): void {
  for (const stack of res) {
    let item = stack;
    // @ts-ignore
    if (data.params.trafic === TraficEnum.ProtoBuffer) {
      item = {
        // @ts-ignore
        callchainId: stack.hiperfCallStackData.callchainId || 0,
        // @ts-ignore
        fileId: stack.hiperfCallStackData.fileId || 0,
        // @ts-ignore
        depth: stack.hiperfCallStackData.depth || 0,
        // @ts-ignore
        symbolId: stack.hiperfCallStackData.symbolId || 0,
        // @ts-ignore
        name: stack.hiperfCallStackData.name || 0,
      };
    }
    // @ts-ignore
    dataCache.callstack.set(`${item.callchainId}-${item.depth}`, item);
    // @ts-ignore
    let parentSymbol = dataCache.callstack.get(`${item.callchainId}-${item.depth - 1}`);
    // @ts-ignore
    if (parentSymbol && parentSymbol.callchainId === item.callchainId && parentSymbol.depth === item.depth - 1) {
      // @ts-ignore
      parentSymbol.children = [];
      // @ts-ignore
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
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: 'ok',
      len: res.length,
    },
    []
  );
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: unknown): number {
  if (endNS === 0) {
    endNS = duration;
  }
  // @ts-ignore
  let xSizeHiperf: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSizeHiperf < 0) {
    xSizeHiperf = 0;
    // @ts-ignore
  } else if (xSizeHiperf > rect.width) {
    // @ts-ignore
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
