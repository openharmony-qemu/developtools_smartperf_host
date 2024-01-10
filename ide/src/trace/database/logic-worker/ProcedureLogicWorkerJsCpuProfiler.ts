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
import { JsCpuProfilerChartFrame, JsCpuProfilerTabStruct } from '../../bean/JsStruct';
import { DataCache, type JsProfilerSymbol, LogicHandler, convertJSON } from './ProcedureLogicWorkerCommon';

const ROOT_ID = 1;
const LAMBDA_FUNCTION_NAME = '(anonymous)';
export class ProcedureLogicWorkerJsCpuProfiler extends LogicHandler {
  private currentEventId!: string;
  private dataCache = DataCache.getInstance();
  private samples = Array<JsCpuProfilerSample>(); // Array index equals id;
  private chartId = 0;
  private tabDataId = 0;
  private chartData: Array<JsCpuProfilerChartFrame> = [];
  private leftNs: number = 0;
  private rightNs: number = 0;

  public handle(msg: any): void {
    this.currentEventId = msg.id;
    if (msg && msg.type) {
      switch (msg.type) {
        case 'jsCpuProfiler-call-chain':
          this.jsCpuProfilerCallChain(msg);
          break;
        case 'jsCpuProfiler-call-tree':
          this.jsCpuProfilerCallTree(msg);
          break;
        case 'jsCpuProfiler-bottom-up':
          this.jsCpuProfilerBottomUp(msg);
          break;
        case 'jsCpuProfiler-statistics':
          this.jsCpuProfilerStatistics(msg);
          break;
      }
    }
  }
  private jsCpuProfilerCallChain(msg: any): void {
    if (!this.dataCache.jsCallChain || this.dataCache.jsCallChain.length === 0) {
      this.dataCache.jsCallChain = convertJSON(msg.params.list) || [];
      this.createCallChain();
    }
  }
  private jsCpuProfilerCallTree(msg: any): void {
    this.tabDataId = 0;
    self.postMessage({
      id: msg.id,
      action: msg.action,
      results: this.combineTopDownData(msg.params, null),
    });
  }
  private jsCpuProfilerBottomUp(msg: any): void {
    this.tabDataId = 0;
    self.postMessage({
      id: msg.id,
      action: msg.action,
      results: this.combineBottomUpData(msg.params),
    });
  }
  private jsCpuProfilerStatistics(msg: any): void {
    if (!this.dataCache.jsCallChain || this.dataCache.jsCallChain.length === 0) {
      this.initCallChain();
    }
    if (msg.params.data) {
      this.chartData = msg.params.data;
      this.leftNs = msg.params.leftNs;
      this.rightNs = msg.params.rightNs;
    }
    if (msg.params.list) {
      this.samples = convertJSON(msg.params.list) || [];
      this.setChartDataType();
      self.postMessage({
        id: msg.id,
        action: msg.action,
        results: this.calStatistic(this.chartData, this.leftNs, this.rightNs),
      });
    } else {
      this.queryChartData();
    }
  }
  public clearAll(): void {
    this.dataCache.clearAll();
    this.samples.length = 0;
    this.chartData.length = 0;
  }

  private calStatistic(
    chartData: Array<JsCpuProfilerChartFrame>,
    leftNs: number | undefined,
    rightNs: number | undefined
  ): Map<SampleType, number> {
    const typeMap = new Map<SampleType, number>();
    const samplesIdsArr: Array<any> = [];
    const samplesIds = this.findSamplesIds(chartData, [], []);
    for (const id of samplesIds) {
      const sample = this.samples[id];
      if (!sample || sample.type === undefined) {
        continue;
      }
      let sampleTotalTime = sample.dur;
      if (leftNs && rightNs) {
        // 不在框选范围内的不做处理
        if (sample.startTime > rightNs || sample.endTime < leftNs) {
          continue;
        }
        // 在框选范围内的被只框选到一部分的根据框选范围调整时间
        const startTime = sample.startTime < leftNs ? leftNs : sample.startTime;
        const endTime = sample.endTime > rightNs ? rightNs : sample.endTime;
        sampleTotalTime = endTime - startTime;
      }

      if (!samplesIdsArr.includes(sample)) {
        samplesIdsArr.push(sample);
        let typeDur = typeMap.get(sample.type);
        if (typeDur) {
          typeMap.set(sample.type, typeDur + sampleTotalTime);
        } else {
          typeMap.set(sample.type, sampleTotalTime);
        }
      }
    }
    return typeMap;
  }

  private findSamplesIds(
    chartData: Array<JsCpuProfilerChartFrame>,
    lastLayerData: Array<JsCpuProfilerChartFrame>,
    samplesIds: Array<number>
  ): number[] {
    for (const data of chartData) {
      if (data.isSelect && data.selfTime > 0 && !lastLayerData.includes(data)) {
        lastLayerData.push(data);
        samplesIds.push(...data.samplesIds);
      } else if (data.children.length > 0) {
        this.findSamplesIds(data.children, lastLayerData, samplesIds);
      }
    }
    return samplesIds;
  }

  private setChartDataType(): void {
    for (let sample of this.samples) {
      const chartData = this.dataCache.jsSymbolMap.get(sample.functionId);
      if (chartData?.id === ROOT_ID) {
        sample.type = SampleType.OTHER;
        continue;
      }
      if (chartData) {
        let type: string;
        chartData.name = this.dataCache.dataDict.get(chartData.nameId) || LAMBDA_FUNCTION_NAME;
        if (chartData.name) {
          type = chartData.name.substring(chartData.name!.lastIndexOf('(') + 1, chartData.name!.lastIndexOf(')'));
          switch (type) {
            case 'NAPI':
              sample.type = SampleType.NAPI;
              break;
            case 'ARKUI_ENGINE':
              sample.type = SampleType.ARKUI_ENGINE;
              break;
            case 'BUILTIN':
              sample.type = SampleType.BUILTIN;
              break;
            case 'GC':
              sample.type = SampleType.GC;
              break;
            case 'AINT':
              sample.type = SampleType.AINT;
              break;
            case 'CINT':
              sample.type = SampleType.CINT;
              break;
            case 'AOT':
              sample.type = SampleType.AOT;
              break;
            case 'RUNTIME':
              sample.type = SampleType.RUNTIME;
              break;
            default:
              if (chartData.name !== '(program)') {
                sample.type = SampleType.OTHER;
              }
              break;
          }
        }
      }
    }
  }

  /**
   * 建立callChain每个函数的联系，设置depth跟children
   */
  private createCallChain(): void {
    const jsSymbolMap = this.dataCache.jsSymbolMap;
    for (const item of this.dataCache.jsCallChain!) {
      jsSymbolMap.set(item.id, item);
    }
  }

  /**
   * 同级使用广度优先算法，非同级使用深度优先算法，遍历泳道图树结构所有数据，
   * 将name,url,depth,parent相同的函数合并，构建成一个top down的树结构
   * @param combineSample 泳道图第一层数据，非第一层为null
   * @param parent 泳道图合并过的函数，第一层为null
   * @returns 返回第一层树结构(第一层数据通过children囊括了所有的函数)
   */
  private combineTopDownData(
    combineSample: Array<JsCpuProfilerChartFrame> | null,
    parent: JsCpuProfilerTabStruct | null
  ): Array<JsCpuProfilerTabStruct> {
    const sameSymbolMap = new Map<string, JsCpuProfilerTabStruct>();
    const currentLevelData = new Array<JsCpuProfilerTabStruct>();
    const chartArray = combineSample || parent?.chartFrameChildren;
    if (!chartArray) {
      return [];
    }
    // 同级广度优先 便于数据合并
    for (const chartFrame of chartArray) {
      if (!chartFrame.isSelect) {
        continue;
      }
      // 该递归函数已经保证depth跟parent相同，固只需要判断name跟url相同即可
      let symbolKey = chartFrame.nameId + ' ' + chartFrame.urlId;
      //   // lambda 表达式需要根据行列号区分是不是同一个函数
      if (chartFrame.nameId === 0) {
        symbolKey += ' ' + chartFrame.line + ' ' + chartFrame.column;
      }
      let tabCallFrame: JsCpuProfilerTabStruct;
      if (sameSymbolMap.has(symbolKey)) {
        tabCallFrame = sameSymbolMap.get(symbolKey)!;
        tabCallFrame.totalTime += chartFrame.totalTime;
        tabCallFrame.selfTime += chartFrame.selfTime;
      } else {
        tabCallFrame = this.chartFrameToTabStruct(chartFrame);
        sameSymbolMap.set(symbolKey, tabCallFrame);
        currentLevelData.push(tabCallFrame);
        if (parent) {
          parent.children.push(tabCallFrame);
        }
      }
      tabCallFrame.chartFrameChildren?.push(...chartFrame.children);
    }
    // 非同级深度优先，便于设置children，同时保证下一级函数depth跟parent都相同
    for (const data of currentLevelData) {
      this.combineTopDownData(null, data);
      data.chartFrameChildren = [];
    }
    if (combineSample) {
      // 第一层为返回给Tab页的数据
      return currentLevelData;
    } else {
      return [];
    }
  }

  /**
   * copy整体调用链，从栈顶函数一直copy到栈底函数，
   * 给Parent设置selfTime，totalTime设置为children的selfTime,totalTime
   *  */
  private copyParent(frame: JsCpuProfilerChartFrame, chartFrame: JsCpuProfilerChartFrame): void {
    frame.children = [];
    if (chartFrame.parent) {
      const copyParent = this.cloneChartFrame(chartFrame.parent);
      copyParent.selfTime = frame.selfTime;
      copyParent.totalTime = frame.totalTime;
      frame.children.push(copyParent);
      this.copyParent(copyParent, chartFrame.parent);
    }
  }

  /**
   * 步骤1：框选/点选的chart树逆序
   * 步骤2：将name,url,parent，层级相同的函数合并
   * @param chartTreeArray ui传递的树结构
   * @returns 合并的Array<JsCpuProfilerChartFrame>树结构
   */
  private combineBottomUpData(chartTreeArray: Array<JsCpuProfilerChartFrame>): Array<JsCpuProfilerTabStruct> {
    const reverseTreeArray = new Array<JsCpuProfilerChartFrame>();
    // 将树结构逆序，parent变成children
    this.reverseChartFrameTree(chartTreeArray, reverseTreeArray);
    // 将逆序的树结构合并返回
    return this.combineTopDownData(reverseTreeArray, null);
  }

  /**
   * 树结构逆序
   * @param chartTreeArray 正序的树结构
   * @param reverseTreeArray 逆序的树结构
   */
  private reverseChartFrameTree(
    chartTreeArray: Array<JsCpuProfilerChartFrame>,
    reverseTreeArray: Array<JsCpuProfilerChartFrame>
  ): void {
    const that = this;
    function recursionTree(chartFrame: JsCpuProfilerChartFrame) {
      // isSelect为框选/点选范围内的函数，其他都不需要处理
      if (!chartFrame.isSelect) {
        return;
      }
      //界面第一层只显示栈顶函数，只有栈顶函数的selfTime > 0
      if (chartFrame.selfTime > 0) {
        const copyFrame = that.cloneChartFrame(chartFrame);
        // 每个栈顶函数的parent的时间为栈顶函数的时间
        copyFrame.selfTime = chartFrame.selfTime;
        copyFrame.totalTime = chartFrame.totalTime;
        reverseTreeArray.push(copyFrame);
        // 递归处理parent的的totalTime selfTime
        that.copyParent(copyFrame, chartFrame);
      }

      if (chartFrame.children.length > 0) {
        for (const children of chartFrame.children) {
          children.parent = chartFrame;
          recursionTree(children);
        }
      }
    }

    //递归树结构
    for (const chartFrame of chartTreeArray) {
      recursionTree(chartFrame);
    }
  }
  /**
   * 将泳道图数据JsCpuProfilerChartFrame转化为JsCpuProfilerTabStruct 作为绘制Ta页的结构
   * @param chartCallChain 泳道图函数信息
   * @returns JsCpuProfilerTabStruct
   */
  private chartFrameToTabStruct(chartCallChain: JsCpuProfilerChartFrame): JsCpuProfilerTabStruct {
    const tabData = new JsCpuProfilerTabStruct(
      chartCallChain.nameId,
      chartCallChain.selfTime,
      chartCallChain.totalTime,
      chartCallChain.depth,
      chartCallChain.urlId,
      chartCallChain.line,
      chartCallChain.column,
      chartCallChain.scriptName,
      this.tabDataId++
    );
    return tabData;
  }

  private cloneChartFrame(frame: JsCpuProfilerChartFrame): JsCpuProfilerChartFrame {
    const copyFrame = new JsCpuProfilerChartFrame(
      frame.id,
      frame.nameId,
      frame.startTime,
      frame.endTime,
      frame.totalTime,
      frame.depth,
      frame.urlId,
      frame.line,
      frame.column
    );
    copyFrame.parentId = frame.parentId;
    copyFrame.isSelect = true;
    copyFrame.scriptName = frame.scriptName;
    return copyFrame;
  }

  private initCallChain(): void {
    const sql = `SELECT function_id AS id,
                        function_index AS nameId,
                        script_id AS scriptId,
                        url_index AS urlId,
                        line_number as line,
                        column_number as column,
                        hit_count AS hitCount,
                        children AS childrenString,
                        parent_id AS parentId
                    FROM
                        js_cpu_profiler_node`;
    this.queryData(this.currentEventId!, 'jsCpuProfiler-call-chain', sql, {});
  }

  private queryChartData(): void {
    const sql = `SELECT id,
                    function_id AS functionId,
                    start_time - start_ts AS startTime,
                    end_time - start_ts AS endTime,
                    dur
                    FROM js_cpu_profiler_sample,trace_range`;
    this.queryData(this.currentEventId!, 'jsCpuProfiler-statistics', sql, {});
  }
}

export class JsCpuProfilerSample {
  id: number = 0;
  functionId: number = 0;
  functionIndex: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  dur: number = 0;
  type: SampleType = SampleType.OTHER;
  stack?: Array<JsProfilerSymbol>;
  cpuProfilerData?: JsCpuProfilerSample;
}

export enum SampleType {
  OTHER = 'OTHER',
  NAPI = 'NAPI',
  ARKUI_ENGINE = 'ARKUI_ENGINE',
  BUILTIN = 'BUILTIN',
  GC = 'GC',
  AINT = 'AINT',
  CINT = 'CINT',
  AOT = 'AOT',
  RUNTIME = 'RUNTIME',
}
