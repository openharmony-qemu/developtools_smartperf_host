/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import '../../../StackBar';
import { getTabRunningPercent } from '../../../../database/sql/ProcessThread.sql';
import { queryCpuFreqUsageData, queryCpuFreqFilterId } from '../../../../database/sql/Cpu.sql';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { type CpuFreqData, type RunningFreqData, type RunningData, type CpuFreqTd } from './TabPaneFreqUsageConfig';

@element('tabpane-frequsage')
export class TabPaneFreqUsage extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | undefined;
  private result: Array<RunningFreqData> = [];

  set data(threadStatesParam: SelectionParam) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    this.threadStatesTbl!.loading = true;
    this.currentSelectionParam = threadStatesParam;
    this.threadStatesTbl!.recycleDataSource = [];
    // @ts-ignore
    this.threadStatesTbl.value = [];
    this.result = [];
    this.queryAllData(threadStatesParam);
  }
  async queryAllData(threadStatesParam: SelectionParam): Promise<void> {
    let runningResult: Array<RunningData> = await getTabRunningPercent(
      threadStatesParam.threadIds,
      threadStatesParam.processIds,
      threadStatesParam.leftNs,
      threadStatesParam.rightNs
    );
    // 查询cpu及id信息
    let cpuIdResult: Array<{ id: number; cpu: number }> = await queryCpuFreqFilterId();
    // 以键值对形式将cpu及id进行对应，后续会将频点数据与其对应cpu进行整合
    let IdMap: Map<number, number> = new Map();
    let queryId: Array<number> = [];
    let cpuArray: Array<number> = [];
    for (let i = 0; i < cpuIdResult.length; i++) {
      queryId.push(cpuIdResult[i].id);
      IdMap.set(cpuIdResult[i].id, cpuIdResult[i].cpu);
      cpuArray.push(cpuIdResult[i].cpu);
    }
    // 通过id去查询频点数据
    let cpuFreqResult: Array<CpuFreqTd> = await queryCpuFreqUsageData(queryId);
    let cpuFreqData: Array<CpuFreqData> = [];
    for (let i of cpuFreqResult) {
      cpuFreqData.push({
        ts: i.startNS + threadStatesParam.recordStartNs,
        cpu: IdMap.get(i.filter_id)!,
        value: i.value,
        dur: i.dur,
      });
    }
    const LEFT_TIME: number = threadStatesParam.leftNs + threadStatesParam.recordStartNs;
    const RIGHT_TIME: number = threadStatesParam.rightNs + threadStatesParam.recordStartNs;
    const args = { leftNs: LEFT_TIME, rightNs: RIGHT_TIME, cpuArray: cpuArray };
    let resultArr: Array<RunningFreqData> = orgnazitionMap(runningResult, cpuFreqData, args);
    // 递归拿出来最底层的数据，并以进程层级的数据作为分割
    this.recursion(resultArr);
    this.result = JSON.parse(JSON.stringify(this.result));
    mergeTotal(resultArr, fixTotal(this.result));
    this.fixedDeal(resultArr, threadStatesParam.traceId);
    this.threadClick(resultArr);
    this.threadStatesTbl!.recycleDataSource = resultArr;
    this.threadStatesTbl!.loading = false;
  }

  /**
   * 递归整理数据小数位
   */
  fixedDeal(arr: Array<RunningFreqData>, traceId?: string | null): void {
    if (arr == undefined) {
      return;
    }
    const TIME_MUTIPLE: number = 1000000;
    // KHz->MHz  *  ns->ms
    const CONS_MUTIPLE: number = 1000000000;
    const FREQ_MUTIPLE: number = 1000;
    const MIN_PERCENT: number = 2;
    const MIN_FREQ: number = 3;
    for (let i = 0; i < arr.length; i++) {
      let trackId: number;
      // 若存在空位元素则进行删除处理
      if (arr[i] === undefined) {
        arr.splice(i, 1);
        i--;
        continue;
      }
      if (arr[i].thread?.indexOf('P') !== -1) {
        trackId = Number(arr[i].thread?.slice(1)!);
        arr[i].thread = `${Utils.getInstance().getProcessMap(traceId).get(trackId) || 'Process'} ${trackId}`;
      } else if (arr[i].thread === 'summary data') {
      } else {
        trackId = Number(arr[i].thread!.split('_')[1]);
        arr[i].thread = `${Utils.getInstance().getThreadMap(traceId).get(trackId) || 'Thread'} ${trackId}`;
      }
      if (arr[i].cpu < 0) {
        // @ts-ignore
        arr[i].cpu = '';
      }
      // @ts-ignore
      if (arr[i].frequency < 0) {
        arr[i].frequency = '';
      }
      // @ts-ignore
      arr[i].percent = arr[i].percent.toFixed(MIN_PERCENT);
      // @ts-ignore
      arr[i].dur = (arr[i].dur / TIME_MUTIPLE).toFixed(MIN_FREQ);
      // @ts-ignore
      arr[i].consumption = (arr[i].consumption / CONS_MUTIPLE).toFixed(MIN_FREQ);
      if (arr[i].frequency !== '') {
        if (arr[i].frequency === 'unknown') {
          arr[i].frequency = 'unknown';
        } else {
          arr[i].frequency = Number(arr[i].frequency) / FREQ_MUTIPLE;
        }
      }
      this.fixedDeal(arr[i].children!, traceId);
    }
  }

  /**
   * 表头点击事件
   */
  private threadClick(data: Array<RunningFreqData>): void {
    let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process') && i === 0) {
            this.threadStatesTbl!.setStatus(data, false);
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Thread') && i === 1) {
            for (let item of data) {
              // @ts-ignore
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadStatesTbl!.setStatus(item.children, false);
              }
            }
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('CPU') && i === 2) {
            this.threadStatesTbl!.setStatus(data, true);
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }

  /**
   *
   * @param arr 待整理的数组，会经过递归取到最底层的数据
   */
  recursion(arr: Array<RunningFreqData>): void {
    for (let idx = 0; idx < arr.length; idx++) {
      if (arr[idx].cpu === -1) {
        this.result.push(arr[idx]);
      }
      if (arr[idx].children) {
        this.recursion(arr[idx].children!);
      } else {
        this.result.push(arr[idx]);
      }
    }
  }

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-running-percent');
  }
  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!);
  }
  initHtml(): string {
    return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-running-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="running-percent-column" width="320px" title="Process/Thread/CPU" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="120px" title="CPU" data-index="cpu" key="cpu" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="240px" title="Consumption" data-index="consumption" key="consumption" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="200px" title="Freq(MHz)" data-index="frequency" key="frequency" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="200px" title="duration(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="240px" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `;
  }
}

/**
 *
 * @param runData 数据库查询上来的running数据，此函数会将数据整理成map结构，分组规则：'pid_tid'为键，running数据数字为值
 * @returns 返回map对象及所有running数据的dur和，后续会依此计算百分比
 */
function orgnazitionMap(
  runData: Array<RunningData>,
  cpuFreqData: Array<CpuFreqData>,
  args: {
    leftNs: number,
    rightNs: number,
    cpuArray: number[]
  }
): Array<RunningFreqData> {
  let result: Map<string, Array<RunningData>> = new Map();
  let sum: number = 0;
  // 循环分组
  for (let i = 0; i < runData.length; i++) {
    let mapKey: string = runData[i].pid + '_' + runData[i].tid;
    // 该running数据若在map对象中不包含其'pid_tid'构成的键，则新加key-value值
    if (!result.has(mapKey)) {
      result.set(mapKey, new Array());
    }
    // 整理左右边界数据问题, 因为涉及多线程，所以必须放在循环里
    if (runData[i].ts < args.leftNs && runData[i].ts + runData[i].dur > args.leftNs) {
      runData[i].dur = runData[i].ts + runData[i].dur - args.leftNs;
      runData[i].ts = args.leftNs;
    }
    if (runData[i].ts + runData[i].dur > args.rightNs) {
      runData[i].dur = args.rightNs - runData[i].ts;
    }
    // 特殊处理数据表中dur为负值的情况
    if (runData[i].dur < 0) {
      runData[i].dur = 0;
    }
    // 分组整理数据
    result.get(mapKey)?.push({
      pid: runData[i].pid,
      tid: runData[i].tid,
      cpu: runData[i].cpu,
      dur: runData[i].dur,
      ts: runData[i].ts,
    });
    sum += runData[i].dur;
  }
  return dealCpuFreqData(cpuFreqData, result, sum, args.cpuArray);
}

/**
 *
 * @param cpuFreqData cpu频点数据的数组
 * @param result running数据的map对象
 * @param sum running数据的时间和
 * @returns 返回cpu频点数据map，'pid_tid'为键，频点算力值数据的数组为值
 */
function dealCpuFreqData(
  cpuFreqData: Array<CpuFreqData>,
  result: Map<string, Array<RunningData>>,
  sum: number,
  cpuList: number[]
): Array<RunningFreqData> {
  let runningFreqData: Map<string, Array<RunningFreqData>> = new Map();
  result.forEach((item, key) => {
    let resultList: Array<RunningFreqData> = new Array();
    for (let i = 0; i < item.length; i++) {
      for (let j = 0; j < cpuFreqData.length; j++) {
        let flag: number;
        if (item[i].cpu === cpuFreqData[j].cpu) {
          // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间小于频点结束时间减去running数据开始时间的差值的情况
          if (
            item[i].ts > cpuFreqData[j].ts &&
            item[i].ts < cpuFreqData[j].ts + cpuFreqData[j].dur &&
            item[i].dur < cpuFreqData[j].ts + cpuFreqData[j].dur - item[i].ts
          ) {
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 1))!);
            item.splice(i, 1);
            i--;
            break;
          }
          if (
            item[i].ts > cpuFreqData[j].ts &&
            item[i].ts < cpuFreqData[j].ts + cpuFreqData[j].dur &&
            item[i].dur >= cpuFreqData[j].ts + cpuFreqData[j].dur - item[i].ts
          ) {
            // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间大于等于频点结束时间减去running数据开始时间的差值的情况
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 2))!);
          }
          // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值小于频点数据持续时间的情况
          if (
            item[i].ts <= cpuFreqData[j].ts &&
            item[i].ts + item[i].dur > cpuFreqData[j].ts &&
            item[i].dur + item[i].ts - cpuFreqData[j].ts < cpuFreqData[j].dur
          ) {
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 3))!);
            item.splice(i, 1);
            i--;
            break;
          }
          if (
            item[i].ts <= cpuFreqData[j].ts &&
            item[i].ts + item[i].dur > cpuFreqData[j].ts &&
            item[i].dur + item[i].ts - cpuFreqData[j].ts >= cpuFreqData[j].dur
          ) {
            // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值大于等于频点数据持续时间的情况
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 4))!);
          }
          if (item[i].ts <= cpuFreqData[j].ts && item[i].ts + item[i].dur <= cpuFreqData[j].ts) {
            // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间小于等于频点开始时间的情况
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 5))!);
            item.splice(i, 1);
            i--;
            break;
          }
        } else {
          if (!cpuList.includes(item[i].cpu)) {
            resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 5))!);
            item.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
    runningFreqData.set(key, mergeSameData(resultList));
  });
  return dealTree(runningFreqData);
}

/**
 *
 * @param item running数据
 * @param cpuFreqData 频点数据
 * @param sum running总和
 * @param flag 标志位，根据不同值返回不同结果
 * @returns 返回新的对象
 */
function returnObj(
  item: RunningData,
  cpuFreqData: CpuFreqData,
  sum: number,
  flag: number
): RunningFreqData | undefined {
  const PERCENT: number = 100;
  const consumption: number = (
    SpSegmentationChart.freqInfoMapData.size > 0
      ? SpSegmentationChart.freqInfoMapData.get(item.cpu)?.get(cpuFreqData.value)
      : cpuFreqData.value
  )!;
  let result: RunningFreqData | undefined;
  switch (flag) {
    case 1:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: consumption * item.dur,
        cpu: item.cpu,
        frequency: cpuFreqData.value,
        dur: item.dur,
        percent: (item.dur / sum) * PERCENT,
      };
    case 2:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: consumption * (cpuFreqData.ts + cpuFreqData.dur - item.ts),
        cpu: item.cpu,
        frequency: cpuFreqData.value,
        dur: cpuFreqData.ts + cpuFreqData.dur - item.ts,
        percent: ((cpuFreqData.ts + cpuFreqData.dur - item.ts) / sum) * PERCENT,
      };
    case 3:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: consumption * (item.dur + item.ts - cpuFreqData.ts),
        cpu: item.cpu,
        frequency: cpuFreqData.value,
        dur: item.dur + item.ts - cpuFreqData.ts,
        percent: ((item.dur + item.ts - cpuFreqData.ts) / sum) * PERCENT,
      };
    case 4:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: consumption * cpuFreqData.dur,
        cpu: item.cpu,
        frequency: cpuFreqData.value,
        dur: cpuFreqData.dur,
        percent: (cpuFreqData.dur / sum) * PERCENT,
      };
    case 5:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: 0,
        cpu: item.cpu,
        frequency: 'unknown',
        dur: item.dur,
        percent: (item.dur / sum) * PERCENT,
      };
  }
  return result;
}

/**
 *
 * @param resultList 单线程内running数据与cpu频点数据整合成的数组
 */
function mergeSameData(resultList: Array<RunningFreqData>): Array<RunningFreqData> {
  let cpuFreqArr: Array<RunningFreqData> = [];
  let cpuArr: Array<number> = [];
  //合并同一线程内，当运行所在cpu和频点相同时，dur及percent进行累加求和
  for (let i = 0; i < resultList.length; i++) {
    if (!cpuArr.includes(resultList[i].cpu)) {
      cpuArr.push(resultList[i].cpu);
      cpuFreqArr.push(creatNewObj(resultList[i].cpu));
    }
    for (let j = i + 1; j < resultList.length; j++) {
      if (resultList[i].cpu === resultList[j].cpu && resultList[i].frequency === resultList[j].frequency) {
        resultList[i].dur += resultList[j].dur;
        resultList[i].percent += resultList[j].percent;
        resultList[i].consumption += resultList[j].consumption;
        resultList.splice(j, 1);
        j--;
      }
    }
    cpuFreqArr.find(function (item) {
      if (item.cpu === resultList[i].cpu) {
        item.children?.push(resultList[i]);
        item.children?.sort((a, b) => b.consumption - a.consumption);
        item.dur += resultList[i].dur;
        item.percent += resultList[i].percent;
        item.consumption += resultList[i].consumption;
        item.thread = resultList[i].thread;
      }
    });
  }
  cpuFreqArr.sort((a, b) => a.cpu - b.cpu);
  return cpuFreqArr;
}

/**
 *
 * @param params cpu层级的数据
 * @returns 整理好的进程级数据
 */
function dealTree(params: Map<string, Array<RunningFreqData>>): Array<RunningFreqData> {
  let result: Array<RunningFreqData> = [];
  params.forEach((item, key) => {
    let process: RunningFreqData = creatNewObj(-1, false);
    let thread: RunningFreqData = creatNewObj(-2);
    for (let i = 0; i < item.length; i++) {
      thread.children?.push(item[i]);
      thread.dur += item[i].dur;
      thread.percent += item[i].percent;
      thread.consumption += item[i].consumption;
      thread.thread = item[i].thread;
    }
    process.children?.push(thread);
    process.dur += thread.dur;
    process.percent += thread.percent;
    process.consumption += thread.consumption;
    process.thread = process.thread! + key.split('_')[0];
    result.push(process);
  });
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].thread === result[j].thread) {
        result[i].children?.push(result[j].children![0]);
        result[i].dur += result[j].dur;
        result[i].percent += result[j].percent;
        result[i].consumption += result[j].consumption;
        result.splice(j, 1);
        j--;
      }
    }
  }
  return result;
}

/**
 *
 * @param cpu 根据cpu值创建层级结构,cpu < 0为线程、进程层级，其余为cpu层级
 * @returns
 */
function creatNewObj(cpu: number, flag: boolean = true): RunningFreqData {
  return {
    thread: flag ? '' : 'P',
    consumption: 0,
    cpu: cpu,
    frequency: -1,
    dur: 0,
    percent: 0,
    children: [],
  };
}

/**
 *
 * @param arr 需要整理汇总的频点级数据
 * @returns 返回一个total->cpu->频点的三级树结构数组
 */
function fixTotal(arr: Array<RunningFreqData>): Array<RunningFreqData> {
  let result: Array<RunningFreqData> = [];
  let flag: number = -1;
  // 数据入参的情况是，第一条为进程数据，其后是该进程下所有线程的数据。以进程数据做分割
  for (let i = 0; i < arr.length; i++) {
    // 判断如果是进程数据，则将其children的数组清空，并以其作为最顶层数据
    if (arr[i].thread?.indexOf('P') !== -1) {
      arr[i].children = [];
      arr[i].thread = arr[i].thread + '-summary data';
      result.push(arr[i]);
      // 标志判定当前数组的长度，也可用.length判断
      flag++;
    } else {
      // 非进程数据会进入到else中，去判断当前线程数据的cpu分组是否存在，不存在则进行创建
      if (result[flag].children![arr[i].cpu] === undefined) {
        result[flag].children![arr[i].cpu] = {
          thread: 'summary data',
          consumption: 0,
          cpu: arr[i].cpu,
          frequency: -1,
          dur: 0,
          percent: 0,
          children: [],
        };
      }
      // 每有一条数据要放到cpu分组下时，则将该cpu分组的各项数据累和
      result[flag].children![arr[i].cpu].consumption += arr[i].consumption;
      result[flag].children![arr[i].cpu].dur += arr[i].dur;
      result[flag].children![arr[i].cpu].percent += arr[i].percent;
      // 查找当前cpu分组下是否存在与当前数据的频点相同的数据，返回相同数据的索引值
      let index: number = result[flag].children![arr[i].cpu].children?.findIndex(
        (item) => item.frequency === arr[i].frequency
      )!;
      // 若存在相同频点的数据，则进行合并，不同直接push
      if (index === -1) {
        arr[i].thread = 'summary data';
        result[flag].children![arr[i].cpu].children?.push(arr[i]);
      } else {
        result[flag].children![arr[i].cpu].children![index].consumption += arr[i].consumption;
        result[flag].children![arr[i].cpu].children![index].dur += arr[i].dur;
        result[flag].children![arr[i].cpu].children![index].percent += arr[i].percent;
      }
    }
  }
  return result;
}

/**
 *
 * @param arr1 前次整理好的区分线程的数据
 * @param arr2 不区分线程的Total数据
 */
function mergeTotal(arr1: Array<RunningFreqData>, arr2: Array<RunningFreqData>): void {
  for (let i = 0; i < arr1.length; i++) {
    const num: number = arr2.findIndex((item) => item.thread?.includes(arr1[i].thread!));
    arr2[num].thread = 'summary data';
    arr1[i].children?.unshift(arr2[num]);
    arr2.splice(num, 1);
  }
}
