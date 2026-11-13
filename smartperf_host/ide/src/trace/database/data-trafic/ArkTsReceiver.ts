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

import { DataCache, JsProfilerSymbol, convertJSON } from '../../database/logic-worker/ProcedureLogicWorkerCommon';
import { JsCpuProfilerChartFrame, type JsCpuProfilerUIStruct } from '../../bean/JsStruct';
import { JsCpuProfilerSample, SampleType } from '../logic-worker/ProcedureLogicWorkerJsCpuProfiler';
import { TraficEnum } from './utils/QueryEnum';
import { Args } from './CommonArgs';

const dataCache = DataCache.getInstance();
const ROOT_ID = 1;
let samples = Array<JsCpuProfilerSample>(); // Array index equals id;
const jsCallChain: Array<JsCpuProfilerChartFrame> = [];
let chartId: number = 0;
const jsDataCache: {
  childrenIds: Array<Array<number>>;
  column: Array<number>;
  depth: Array<number>;
  endTime: Array<number>;
  id: Array<number>;
  line: Array<number>;
  nameId: Array<number>;
  parentId: Array<number>;
  samplesIds: Array<Array<number>>;
  selfTime: Array<number>;
  startTime: Array<number>;
  totalTime: Array<number>;
  urlId: Array<number>;
  maxDepth: number;
} = {
  samplesIds: [],
  childrenIds: [],
  column: [],
  depth: [],
  endTime: [],
  id: [],
  line: [],
  nameId: [],
  parentId: [],
  selfTime: [],
  startTime: [],
  totalTime: [],
  urlId: [],
  maxDepth: 1,
};

export const initCallChainDataSql = (args: unknown):unknown => {
  const sql = `SELECT function_id AS id,
              0 As functionId,
            0 AS startTime,
            0 As endTime,
            0 As dur,
            function_index AS nameId,
            url_index AS urlId,
            line_number as line,
            column_number as column,
            hit_count AS hitCount,
            children AS childrenString,
            parent_id AS parentId
            FROM js_cpu_profiler_node`;
  return sql;
};

export const queryChartDataSqlMem = (args: Args):unknown => {
  const sql = `SELECT id,
            function_id AS functionId,
            start_time - ${args.recordStartNS} AS startTime,
            end_time - ${args.recordStartNS} AS endTime,
            dur
            FROM js_cpu_profiler_sample`;
  return sql;
};

export function cpuProfilerDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  let sql = initCallChainDataSql(data.params);
  let res = proc(sql);
  if (res.length > 0) {
    if (!dataCache.jsCallChain || dataCache.jsCallChain.length === 0) {
      dataCache.jsCallChain = res;
      //@ts-ignore
      createCallChain(data.params.trafic);
    }
    //@ts-ignore
    let sql = queryChartDataSqlMem(data.params);
    let chartData = proc(sql);
    if (chartData.length > 0) {
      //@ts-ignore
      samples = convertJSON(chartData);
      arrayBufferHandler(data, samples, true);
    }
  }
}

/**
 * 建立callChain每个函数的联系，设置depth跟children
 */
function createCallChain(trafic: TraficEnum): void {
  const jsSymbolMap = dataCache.jsSymbolMap;
  const symbol = new JsProfilerSymbol();
  for (let data of dataCache.jsCallChain!) {
    let sample = (trafic !== TraficEnum.Memory ? data.cpuProfilerData : data) || symbol;
    let item = data.cpuProfilerData || data;
    if (!item.childrenString) {
      item.childrenString = '';
    }
    jsSymbolMap.set(item.id, item);
    //root不需要显示,depth为-1
    if (item.id === ROOT_ID) {
      item.depth = -1;
    }
    if (item.parentId > 0) {
      let parentSymbol = jsSymbolMap.get(item.parentId);
      if (parentSymbol) {
        if (!parentSymbol.children) {
          parentSymbol.children = new Array<JsProfilerSymbol>();
          parentSymbol.childrenIds = new Array<number>();
          parentSymbol.childrenString = '';
        }
        parentSymbol.children.push(item);
        parentSymbol.childrenString! += `${item.id},`;
        parentSymbol.childrenIds.push(item.id);
        item.depth = parentSymbol.depth + 1;
      }
    }
  }
}

function combineChartData(res: Array<JsCpuProfilerSample>, trafic: TraficEnum): Array<JsCpuProfilerChartFrame> {
  const combineSample = new Array<JsCpuProfilerChartFrame>();
  const symbol = new JsCpuProfilerSample();
  for (let data of res) {
    let sample = (trafic !== TraficEnum.Memory ? data.cpuProfilerData : data) || symbol;
    const stackTopSymbol = dataCache.jsSymbolMap.get(sample.functionId);
    // root 节点不需要显示
    if (stackTopSymbol?.id === ROOT_ID) {
      sample.type = SampleType.OTHER;
      continue;
    }
    if (stackTopSymbol) {
      // 获取栈顶函数的整条调用栈为一个数组 下标0为触发的栈底函数
      sample.stack = getFullCallChainOfNode(stackTopSymbol);
      if (combineSample.length === 0) {
        // 首次combineSample没有数据时，用第一条数据创建一个调用树
        createNewChartFrame(sample, combineSample);
      } else {
        const lastCallChart = combineSample[combineSample.length - 1];
        if (isSymbolEqual(sample.stack[0], lastCallChart) && lastCallChart.endTime === sample.startTime) {
          combineCallChain(lastCallChart, sample);
        } else {
          // 一个调用链栈底函数与前一个不同时，需要新加入到combineSample
          createNewChartFrame(sample, combineSample);
        }
      }
    }
  }
  return combineSample;
}

/**
 * 根据每个sample的栈顶函数，获取完整的调用栈
 * @param node 栈顶函数
 * @returns 完整的调用栈
 */
function getFullCallChainOfNode(node: JsProfilerSymbol): Array<JsProfilerSymbol> {
  const callChain = new Array<JsProfilerSymbol>();
  callChain.push(node);
  while (node.parentId !== 0) {
    const parent = dataCache.jsSymbolMap.get(node.parentId);
    // id 1 is root Node
    if (!parent || parent.id <= ROOT_ID) {
      break;
    }
    callChain.push(parent);
    node = parent;
  }
  callChain.reverse();
  return callChain;
}

function createNewChartFrame(sample: JsCpuProfilerSample, combineSample: Array<JsCpuProfilerChartFrame>): void {
  let lastSymbol: JsCpuProfilerChartFrame;
  for (const [idx, symbol] of sample.stack!.entries()) {
    if (idx === 0) {
      lastSymbol = symbolToChartFrame(sample, symbol);
      combineSample.push(lastSymbol);
    } else {
      const callFrame = symbolToChartFrame(sample, symbol);
      lastSymbol!.children.push(callFrame);
      lastSymbol!.childrenIds.push(callFrame.id);
      callFrame.parentId = lastSymbol!.id;
      lastSymbol = callFrame;
    }
    if (idx + 1 === sample.stack?.length) {
      lastSymbol.selfTime = sample.dur;
    }
  }
}

/**
 * 创建一个JsCpuProfilerChartFrame 作为绘制泳道图的结构
 * @param sample 数据库样本数据
 * @param symbol 样本的每一个函数
 * @returns JsCpuProfilerChartFrame
 */
function symbolToChartFrame(sample: JsCpuProfilerSample, symbol: JsProfilerSymbol): JsCpuProfilerChartFrame {
  const chartFrame = new JsCpuProfilerChartFrame(
    chartId++,
    symbol.nameId,
    sample.startTime,
    sample.endTime,
    sample.dur,
    symbol.depth,
    symbol.urlId,
    symbol.line,
    symbol.column
  );
  chartFrame.samplesIds.push(sample.id);
  return chartFrame;
}

function isSymbolEqual(symbol: JsProfilerSymbol, uiData: JsCpuProfilerUIStruct): boolean {
  return symbol.nameId === uiData.nameId && symbol.urlId === uiData.urlId;
}

/**
 * 相邻的两个sample的name,url，depth相同，且上一个的endTime等于下一个的startTime,
 * 则两个sample的调用栈合并
 * @param lastCallTree 上一个已经合并的树结构调用栈
 * @param sample 当前样本数据
 */
function combineCallChain(lastCallTree: JsCpuProfilerChartFrame, sample: JsCpuProfilerSample): void {
  let lastCallTreeSymbol = lastCallTree;
  let parentCallFrame: JsCpuProfilerChartFrame;
  let isEqual = true;
  for (const [idx, symbol] of sample.stack!.entries()) {
    // 是否为每次采样的栈顶函数
    const isLastSymbol = idx + 1 === sample.stack?.length;
    if (
      isEqual &&
      isSymbolEqual(symbol, lastCallTreeSymbol) &&
      lastCallTreeSymbol.depth === idx &&
      lastCallTreeSymbol.endTime === sample.startTime
    ) {
      // 如果函数名跟depth匹配，则更新函数的持续时间
      lastCallTreeSymbol.endTime = sample.endTime;
      lastCallTreeSymbol.totalTime = sample.endTime - lastCallTreeSymbol.startTime;
      lastCallTreeSymbol.samplesIds.push(sample.id);
      let lastChildren = lastCallTreeSymbol.children;
      parentCallFrame = lastCallTreeSymbol;
      if (lastChildren && lastChildren.length > 0) {
        lastCallTreeSymbol = lastChildren[lastChildren.length - 1];
      }
      isEqual = true;
    } else {
      // 如果不匹配,则作为新的分支添加到lastCallTree
      const deltaFrame = symbolToChartFrame(sample, symbol);
      parentCallFrame!.children.push(deltaFrame);
      parentCallFrame!.childrenIds.push(deltaFrame.id);
      deltaFrame.parentId = parentCallFrame!.id;
      parentCallFrame = deltaFrame;
      isEqual = false;
    }
    // 每次采样的栈顶函数的selfTime为该次采样数据的时间
    if (isLastSymbol) {
      parentCallFrame.selfTime += sample.dur;
    }
  }
}

function arrayBufferHandler(data: unknown, res: JsCpuProfilerSample[], transfer: boolean): void {
  //@ts-ignore
  let result = combineChartData(res, data.params.trafic);
  clearJsCacheData();
  const getArrayData = (combineData: Array<JsCpuProfilerChartFrame>): void => {
    for (let item of combineData) {
      if (item.depth > -1) {
        jsDataCache.id.push(item.id);
        jsDataCache.startTime.push(item.startTime);
        jsDataCache.endTime.push(item.endTime);
        jsDataCache.selfTime.push(item.selfTime);
        jsDataCache.totalTime.push(item.totalTime);
        jsDataCache.column.push(item.column);
        jsDataCache.line.push(item.line);
        jsDataCache.depth.push(item.depth);
        jsDataCache.parentId.push(item.parentId);
        jsDataCache.nameId.push(item.nameId);
        jsDataCache.samplesIds.push([...item.samplesIds]);
        jsDataCache.urlId.push(item.urlId);
        jsDataCache.childrenIds.push([...item.childrenIds]);
        if (item.depth + 1 > jsDataCache.maxDepth) {
          jsDataCache.maxDepth = item.depth + 1;
        }
        if (item.children && item.children.length > 0) {
          getArrayData(item.children);
        }
      }
    }
  };
  getArrayData(result);
  setTimeout((): void => {
    arrayBufferCallback(data, transfer);
  }, 150);
}
function arrayBufferCallback(data: unknown, transfer: boolean): void {
  let dataFilter = jsDataCache;
  let len = dataFilter!.startTime!.length;
  const arkTs = new ArkTS(len);
  for (let i = 0; i < len; i++) {
    arkTs.column[i] = dataFilter.column[i];
    arkTs.depth[i] = dataFilter.depth[i];
    arkTs.endTime[i] = dataFilter.endTime[i];
    arkTs.id[i] = dataFilter.id[i];
    arkTs.line[i] = dataFilter.line[i];
    arkTs.nameId[i] = dataFilter.nameId[i];
    arkTs.parentId[i] = dataFilter.parentId[i];
    arkTs.samplesIds[i] = [...dataFilter.samplesIds[i]];
    arkTs.selfTime[i] = dataFilter.selfTime[i];
    arkTs.startTime[i] = dataFilter.startTime[i];
    arkTs.totalTime[i] = dataFilter.totalTime[i];
    arkTs.urlId[i] = dataFilter.urlId[i];
    arkTs.childrenIds[i] = [...dataFilter.childrenIds[i]];
  }
  postMessage(data, transfer, arkTs, len);
  // 合并完泳道图数据之后，Tab页不再需要缓存数据
  if (jsCallChain) {
    dataCache.jsCallChain!.length = 0;
  }
  dataCache.jsSymbolMap!.clear();
}
function postMessage(data: unknown, transfer: boolean, arkTs: ArkTS, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            column: arkTs.column.buffer,
            depth: arkTs.depth.buffer,
            endTime: arkTs.endTime.buffer,
            id: arkTs.id.buffer,
            line: arkTs.line.buffer,
            nameId: arkTs.nameId.buffer,
            parentId: arkTs.parentId.buffer,
            samplesIds: arkTs.samplesIds,
            selfTime: arkTs.selfTime.buffer,
            startTime: arkTs.startTime.buffer,
            totalTime: arkTs.totalTime.buffer,
            urlId: arkTs.urlId.buffer,
            childrenIds: arkTs.childrenIds,
            maxDepth: jsDataCache.maxDepth,
          }
        : {},
      len: len,
    },
    transfer
      ? [
          arkTs.column.buffer,
          arkTs.depth.buffer,
          arkTs.endTime.buffer,
          arkTs.id.buffer,
          arkTs.line.buffer,
          arkTs.parentId.buffer,
          arkTs.selfTime.buffer,
          arkTs.startTime.buffer,
          arkTs.totalTime.buffer,
        ]
      : []
  );
}

function ns2x(ns: number, startNS: number, endNS: number, duration: number, width: number): number {
  if (endNS === 0) {
    endNS = duration;
  }
  let xSize: number = ((ns - startNS) * width) / (endNS - startNS);
  xSize = xSize < 0 ? 0 : xSize > width ? width : xSize;
  return xSize;
}

function clearJsCacheData(): void {
  chartId = 0;
  jsDataCache.childrenIds = [];
  jsDataCache.column = [];
  jsDataCache.depth = [];
  jsDataCache.endTime = [];
  jsDataCache.id = [];
  jsDataCache.line = [];
  jsDataCache.nameId = [];
  jsDataCache.parentId = [];
  jsDataCache.samplesIds = [];
  jsDataCache.selfTime = [];
  jsDataCache.startTime = [];
  jsDataCache.totalTime = [];
  jsDataCache.urlId = [];
  jsDataCache.maxDepth = 1;
}

class ArkTS {
  column: Int32Array;
  depth: Int32Array;
  endTime: Float64Array;
  id: Int32Array;
  line: Int32Array;
  nameId: Int32Array;
  parentId: Int32Array;
  samplesIds: Array<unknown>;
  selfTime: Float64Array;
  startTime: Float64Array;
  totalTime: Float64Array;
  urlId: Int32Array;
  childrenIds: Array<unknown>;

  constructor(len: number) {
    this.column = new Int32Array(len);
    this.depth = new Int32Array(len);
    this.endTime = new Float64Array(len);
    this.id = new Int32Array(len);
    this.line = new Int32Array(len);
    this.nameId = new Int32Array(len);
    this.parentId = new Int32Array(len);
    this.samplesIds = [];
    this.selfTime = new Float64Array(len);
    this.startTime = new Float64Array(len);
    this.totalTime = new Float64Array(len);
    this.urlId = new Int32Array(len);
    this.childrenIds = [];
  }
}
