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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { log } from '../../../../../log/Log';
import { getProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { getTabCpuByThread } from '../../../../database/sql/Cpu.sql';
import { getCpuData, getIrqAndSoftIrqData } from "../../../../database/sql/CpuAndIrq.sql";
import { byCpuGroupBean, CpuAndIrqBean, softirqAndIrq, finalResultBean } from "./CpuAndIrqBean";
import { FlagsConfig } from '../../../SpFlags';

@element('tabpane-cpu-thread')
export class TabPaneCpuByThread extends BaseElement {
  private cpuByThreadTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private cpuByThreadSource: Array<SelectionData> = [];
  private currentSelectionParam: SelectionParam | undefined;
  private cpuByIrqSource: Array<finalResultBean> = [];
  private loadIrq: boolean = false;//flag开关
  private pubColumns = `
            <lit-table-column order width="250px" title="Process" data-index="process" key="process" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="PID" data-index="pid" key="pid" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="250px" title="Thread" data-index="thread" key="thread" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="TID" data-index="tid" key="tid" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="200px" title="Wall duration(ms)" data-index="wallDuration" key="wallDuration" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="200px" title="Avg Wall duration(ms)" data-index="avgDuration" key="avgDuration" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="Occurrences" data-index="occurrences" key="occurrences" align="flex-start" order >
            </lit-table-column>
    `;

  set data(cpuByThreadValue: SelectionParam | unknown) {
    if (this.currentSelectionParam === cpuByThreadValue) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = cpuByThreadValue;
    // @ts-ignore
    this.cpuByThreadTbl!.innerHTML = this.getTableColumns(cpuByThreadValue.cpus);
    this.cpuByThreadTbl!.injectColumns();
    this.range!.textContent =
      // @ts-ignore
      `Selected range: ${parseFloat(((cpuByThreadValue.rightNs - cpuByThreadValue.leftNs) / 1000000.0).toFixed(5))} ms`;
    this.cpuByThreadTbl!.loading = true;
    this.loadIrq = FlagsConfig.getFlagsConfigEnableStatus('CPU by Irq');//flag开关
    this.handleAsyncRequest(cpuByThreadValue, this.loadIrq);
  }

  private handleAsyncRequest(cpuByThreadValue: unknown, loadIrq: boolean): void {
    if (loadIrq) {
      //查询cpu数据和irq数据
      Promise.all([
        // @ts-ignore
        getCpuData(cpuByThreadValue.cpus, cpuByThreadValue.leftNs, cpuByThreadValue.rightNs),
        // @ts-ignore
        getIrqAndSoftIrqData(cpuByThreadValue.cpus, cpuByThreadValue.leftNs, cpuByThreadValue.rightNs)
      ]).then(([cpuData, interruptData]) => {
        this.cpuByThreadTbl!.loading = false;
        const resArr = cpuData.concat(interruptData);
        if (resArr != null && resArr.length > 0) {
          const cutData: finalResultBean[] = this.groupByCpu(resArr);//切割后数据
          this.aggregateData(cutData, cpuByThreadValue);//整合数据
        } else {
          this.cpuByIrqSource = [];
          this.cpuByThreadTbl!.recycleDataSource = this.cpuByIrqSource;
        }
      });
    } else {
      // @ts-ignore
      getTabCpuByThread(cpuByThreadValue.cpus, cpuByThreadValue.leftNs, // @ts-ignore
        cpuByThreadValue.rightNs, cpuByThreadValue.traceId).then((result): void => {
          this.cpuByThreadTbl!.loading = false;
          if (result !== null && result.length > 0) {
            log(`getTabCpuByThread size :${result.length}`);
            this.processResult(result, cpuByThreadValue);
          } else {
            this.cpuByThreadSource = [];
            this.cpuByThreadTbl!.recycleDataSource = this.cpuByThreadSource;
          }
        });
    }

  }

  //将所有数据按cpu重新分组
  private groupByCpu(data: Array<CpuAndIrqBean>): finalResultBean[] {
    const cpuObject: { [cpu: number]: byCpuGroupBean } =
      data.reduce((groups, item) => {
        const { cpu, ...restProps } = item;
        const newCpuAndIrqBean: CpuAndIrqBean = { cpu, ...restProps };

        if (!groups[cpu]) {
          groups[cpu] = { CPU: [] };
        }
        groups[cpu].CPU!.push(newCpuAndIrqBean);

        return groups;
      }, {} as { [cpu: number]: byCpuGroupBean })
    const cutObj: { [cpu: number]: finalResultBean[] } = {};
    Object.entries(cpuObject).forEach(([cpuStr, { CPU }]) => {
      const cpu = Number(cpuStr);
      cutObj[cpu] = this.cpuByIrq(CPU);
    })
    const cutList: finalResultBean[] = Object.values(cutObj).flat();
    return cutList;
  }

  //具体切割方法
  private cpuByIrq(data: CpuAndIrqBean[]): finalResultBean[] {
    let sourceData = data.sort((a, b) => a.startTime - b.startTime);
    let waitArr: CpuAndIrqBean[] = [];
    let completedArr: finalResultBean[] = [];
    let globalTs: number = 0;
    let index: number = 0;
    while (index < sourceData.length || waitArr.length > 0) {
      let minEndTs = Math.min(...waitArr.map((item: CpuAndIrqBean) => item.endTime));
      let minIndex = waitArr.findIndex((item: CpuAndIrqBean) => item.endTime === minEndTs);
      //当waitArr为空时
      if (waitArr.length === 0) {
        globalTs = sourceData[index].startTime;
        waitArr.push(sourceData[index]);
        index++;
        continue;
      }
      //当全局Ts等于minEndTs时，只做删除处理
      if (globalTs === minEndTs) {
        if (minIndex !== -1) {  
          const item = waitArr[minIndex];  
          if (item.endTime > item.startTime) { 
            waitArr.splice(minIndex, 1);  
          } else {  
            // wallDuration为0，需要特别处理  
            const obj: finalResultBean = {  
              cat: item.cat,  
              cpu: item.cpu,  
              dur: 0, 
              pid: item.pid ? item.pid : '[NULL]',
              tid: item.tid ? item.tid : '[NULL]',
              occurrences: item.isFirstObject === 1 ? 1 : 0  
            };  
            completedArr.push(obj);  
            waitArr.splice(minIndex, 1);
          }  
          continue;
        }
      }
      let obj: finalResultBean = {
        cat: '',
        dur: 0,
        cpu: 0,
        pid: 0,
        tid: 0,
        occurrences: 0
      };
      if (index < sourceData.length) {
        if (sourceData[index].startTime < minEndTs) {
          if (globalTs === sourceData[index].startTime) {
            waitArr.push(sourceData[index]);
            index++;
            continue;
          } else {
            const maxPriorityItem = this.findMaxPriority(waitArr);
            obj = {
              cat: maxPriorityItem.cat,
              dur: sourceData[index].startTime - globalTs,
              cpu: maxPriorityItem.cpu,
              pid: maxPriorityItem.pid ? maxPriorityItem.pid : '[NULL]',
              tid: maxPriorityItem.tid ? maxPriorityItem.tid : '[NULL]',
              occurrences: maxPriorityItem.isFirstObject === 1 ? 1 : 0
            }
            completedArr.push(obj);
            maxPriorityItem.isFirstObject = 0;
            waitArr.push(sourceData[index]);
            globalTs = sourceData[index].startTime;
            index++;
          }
        } else {
          const maxPriorityItem = this.findMaxPriority(waitArr);
          obj = {
            cat: maxPriorityItem.cat,
            dur: minEndTs - globalTs,
            cpu: maxPriorityItem.cpu,
            pid: maxPriorityItem.pid ? maxPriorityItem.pid : '[NULL]',
            tid: maxPriorityItem.tid ? maxPriorityItem.tid : '[NULL]',
            occurrences: maxPriorityItem.isFirstObject === 1 ? 1 : 0
          }
          completedArr.push(obj);
          maxPriorityItem.isFirstObject = 0;
          globalTs = minEndTs;
          if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
        }
      } else {
        const maxPriorityItem = this.findMaxPriority(waitArr);
        obj = {
          cat: maxPriorityItem.cat,
          dur: minEndTs - globalTs,
          cpu: maxPriorityItem.cpu,
          pid: maxPriorityItem.pid ? maxPriorityItem.pid : '[NULL]',
          tid: maxPriorityItem.tid ? maxPriorityItem.tid : '[NULL]',
          occurrences: maxPriorityItem.isFirstObject === 1 ? 1 : 0
        }
        completedArr.push(obj);
        maxPriorityItem.isFirstObject = 0;
        globalTs = minEndTs;
        if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
      }
    }
    return completedArr;
  }

  private findMaxPriority(arr: CpuAndIrqBean[]): CpuAndIrqBean {
    return arr.reduce((maxItem: CpuAndIrqBean, currentItem: CpuAndIrqBean) => {
      return maxItem.priority > currentItem.priority ? maxItem : currentItem;
    }, arr[0]);
  }

  // 聚合数据
  private aggregateData(data: any[], cpuByThreadValue: SelectionParam | any): void {
    const cpuAggregations: { [tidPidKey: string]: softirqAndIrq } = {};
    //@ts-ignore
    let softirqAggregations: softirqAndIrq = {
      occurrences: 0,
      wallDuration: 0,
      avgDuration: 0,
      cpus: {}
    };
    //@ts-ignore
    let irqAggregations: softirqAndIrq = {
      occurrences: 0,
      wallDuration: 0,
      avgDuration: 0,
      cpus: {}
    };
    data.forEach((obj) => {
      // 聚合 cpu 数据
      if (obj.cat === 'cpu') {
        const tidPidKey = `${obj.tid}-${obj.pid}`;
        const cpuDurationKey = `cpu${obj.cpu}`;
        const cpuPercentKey = `cpu${obj.cpu}Ratio`;

        if (!cpuAggregations[tidPidKey]) {
          cpuAggregations[tidPidKey] = {
            tid: obj.tid,
            pid: obj.pid,
            wallDuration: 0,
            occurrences: 0,
            avgDuration: 0,
            cpus: {},
            [cpuDurationKey]: 0, 
            [cpuPercentKey]: 100,
          };
        }

        cpuAggregations[tidPidKey].wallDuration += obj.dur; 
        cpuAggregations[tidPidKey].occurrences += obj.occurrences; 
        cpuAggregations[tidPidKey].avgDuration = cpuAggregations[tidPidKey].wallDuration / cpuAggregations[tidPidKey].occurrences; 
        cpuAggregations[tidPidKey].cpus[obj.cpu] = (cpuAggregations[tidPidKey].cpus[obj.cpu] || 0) + obj.dur;
        cpuAggregations[tidPidKey][cpuDurationKey] = cpuAggregations[tidPidKey].cpus[obj.cpu];
        cpuAggregations[tidPidKey][cpuPercentKey] = (cpuAggregations[tidPidKey][cpuDurationKey] / (cpuByThreadValue.rightNs - cpuByThreadValue.leftNs)) * 100; 
      }

      // 聚合 softirq 数据
      if (obj.cat === 'softirq') {
        this.updateIrqAndSoftirq(softirqAggregations, obj, cpuByThreadValue);
      }
      // 聚合 irq 数据
      if (obj.cat === 'irq') {
        this.updateIrqAndSoftirq(irqAggregations, obj, cpuByThreadValue);
      }

    });

    // 将聚合数据转换为最终结果格式
    const result: Array<{ [key: string]: any }> = [];

    // 添加 CPU 数据
    for (const tidPidKey in cpuAggregations) {
      const aggregation = cpuAggregations[tidPidKey];
      const { tid, pid, occurrences, wallDuration, avgDuration, ...cpuDurations } = aggregation;
      result.push({ tid, pid, occurrences, wallDuration, avgDuration, ...cpuDurations });
    }

    // 添加softirq
    if (softirqAggregations.wallDuration >= 0) {
      result.push({ process: 'softirq', thread: 'softirq', tid: '[NULL]', pid: '[NULL]', ...softirqAggregations, });
    }

    // 添加 irq 数据
    if (irqAggregations.wallDuration >= 0) {
      result.push({ process: 'irq', thread: 'irq', tid: '[NULL]', pid: '[NULL]', ...irqAggregations });
    }
    this.handleFunction(result, cpuByThreadValue);

  }

  //irq和softirq聚合方法
  private updateIrqAndSoftirq(aggregation: softirqAndIrq, obj: CpuAndIrqBean, cpuByThreadValue: SelectionParam): void {
    const callid = obj.cpu;
    const callidDurKey = `cpu${callid}`;
    const callidPercentKey = `cpu${callid}Ratio`;

    aggregation.wallDuration += obj.dur;
    aggregation.occurrences += obj.occurrences;
    aggregation.avgDuration = aggregation.wallDuration / aggregation.occurrences;

    if (!aggregation.cpus[callid]) {
      aggregation.cpus[callid] = 0;
    }
    aggregation.cpus[callid] += obj.dur;
 
    if (!(callidDurKey in aggregation)) {
      aggregation[callidDurKey] = 0;
    }
    aggregation[callidDurKey] += obj.dur;

    aggregation[callidPercentKey] = (aggregation[callidDurKey] / (cpuByThreadValue.rightNs - cpuByThreadValue.leftNs)) * 100;
  }

  //最后将所有数据进行统一整理
  private handleFunction(data: Array<{ [key: string]: any }>, cpuByThreadValue: SelectionParam): void {
    let index = 0;
    let totalWallDuration = 0;
    let totalOccurrences = 0;
    const finalData: Array<finalResultBean> = [];
    while (index < data.length) {
      const obj = data[index];
      totalWallDuration += obj.wallDuration;
      totalOccurrences += obj.occurrences;
      if (obj.tid !== '[NULL]' && obj.pid !== '[NULL]') {
        // @ts-ignore
        let process = Utils.getInstance().getProcessMap(cpuByThreadValue.traceId).get(obj.pid);
        // @ts-ignore
        let thread = Utils.getInstance().getThreadMap(cpuByThreadValue.traceId).get(obj.tid);
        obj.thread = thread == null || thread.length === 0 ? '[NULL]' : thread;
        obj.process = process == null || process.length === 0 ? '[NULL]' : process;
      }
      obj.wallDuration /= 1000000;
      obj.wallDuration = obj.wallDuration.toFixed(6);
      obj.avgDuration /= 1000000;
      obj.avgDuration = obj.avgDuration.toFixed(6);
      for (const cpu in obj.cpus) {
        if (obj.cpus.hasOwnProperty(cpu)) {
          obj[`cpu${cpu}TimeStr`] = getProbablyTime(obj[`cpu${cpu}`]);
          obj[`cpu${cpu}Ratio`] = obj[`cpu${cpu}Ratio`].toFixed(2);
        }
      }
      for (const cpuNumber of cpuByThreadValue.cpus) {
        const cpuKey = `cpu${cpuNumber}TimeStr`;
        const percentKey = `cpu${cpuNumber}Ratio`;
        if (!obj.hasOwnProperty(cpuKey)) {
          obj[cpuKey] = "0.00";
          obj[percentKey] = "0.00";
        }
      }
      delete obj.cpus;
      finalData.push(obj);
      index++;
    }
    finalData.unshift({
      wallDuration: (totalWallDuration / 1000000).toFixed(6),
      occurrences: totalOccurrences,
    });
    this.cpuByIrqSource = finalData;
    this.cpuByThreadTbl!.recycleDataSource = this.cpuByIrqSource;
  }

  //点击表头进行排序
  private reSortByColum(key: string, type: number): void {
    // 如果数组为空，则直接返回 
    if (!this.cpuByIrqSource.length) return;
    let sortObject: finalResultBean[] = JSON.parse(JSON.stringify(this.cpuByIrqSource)).splice(1);
    let sortList: Array<finalResultBean> = [];
    sortList.push(...sortObject);
    if (type === 0) {
      this.cpuByThreadTbl!.recycleDataSource = this.cpuByIrqSource;
    } else {
      sortList.sort((a, b) => {
        let aValue: number | string, bValue: number | string;
        if (key === 'process' || key === 'thread') {
          // @ts-ignore
          aValue = a[key];
          // @ts-ignore
          bValue = b[key];
        } else {
          // @ts-ignore
          aValue = parseFloat(a[key]);
          // @ts-ignore
          bValue = parseFloat(b[key]);
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return type === 1 ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return type === 1 ? aValue - bValue : bValue - aValue;
        } else {
          return 0;
        }
      });
      this.cpuByThreadTbl!.recycleDataSource = [this.cpuByIrqSource[0]].concat(sortList);
    }
  }

  private processResult(result: Array<unknown>, cpuByThreadValue: unknown): void {
    let sumWall = 0.0;
    let sumOcc = 0;
    let map: Map<string, unknown> = new Map<string, unknown>();
    for (let e of result) {
      // @ts-ignore
      sumWall += e.wallDuration;
      // @ts-ignore
      sumOcc += e.occurrences;
      this.updateThreadMap(e, cpuByThreadValue, map);
    }
    this.calculateCount(map, sumWall, sumOcc);
  }

  private updateThreadMap(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    if (map.has(`${e.tid}`)) {
      this.updateExistingThread(e, cpuByThreadValue, map);
    } else {
      this.createThread(e, cpuByThreadValue, map);
    }
  }

  private updateExistingThread(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    let thread = map.get(`${e.tid}`)!;
    // @ts-ignore
    thread.wallDuration += e.wallDuration;
    // @ts-ignore
    thread.occurrences += e.occurrences;
    this.updateCpuValues(e, cpuByThreadValue, thread);
  }

  private createThread(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    let process = Utils.getInstance().getProcessMap(cpuByThreadValue.traceId).get(e.pid);
    // @ts-ignore
    let thread = Utils.getInstance().getThreadMap(cpuByThreadValue.traceId).get(e.tid);
    let cpuByThreadObject: unknown = {
      // @ts-ignore
      tid: e.tid,
      // @ts-ignore
      pid: e.pid,
      thread: !thread || thread.length === 0 ? '[NULL]' : thread,
      process: !process || process.length === 0 ? '[NULL]' : process,
      // @ts-ignore
      wallDuration: e.wallDuration || 0,
      // @ts-ignore
      occurrences: e.occurrences || 0,
      avgDuration: 0,
    };
    this.initializeCpuValues(cpuByThreadValue, cpuByThreadObject);
    this.updateCpuValues(e, cpuByThreadValue, cpuByThreadObject);
    // @ts-ignore
    map.set(`${e.tid}`, cpuByThreadObject);
  }

  private initializeCpuValues(cpuByThreadValue: unknown, cpuByThreadObject: unknown): void {
    // @ts-ignore
    for (let i of cpuByThreadValue.cpus) {
      // @ts-ignore
      cpuByThreadObject[`cpu${i}`] = 0;
      // @ts-ignore
      cpuByThreadObject[`cpu${i}TimeStr`] = '0';
      // @ts-ignore
      cpuByThreadObject[`cpu${i}Ratio`] = '0';
    }
  }

  private updateCpuValues(e: unknown, cpuByThreadValue: unknown, cpuByThreadObject: unknown): void {
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}`] = e.wallDuration || 0;
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}TimeStr`] = getProbablyTime(e.wallDuration || 0);
    // @ts-ignore
    let ratio = ((100.0 * (e.wallDuration || 0)) / (cpuByThreadValue.rightNs - cpuByThreadValue.leftNs)).toFixed(2);
    if (ratio === '0.00') {
      ratio = '0';
    }
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}Ratio`] = ratio;
  }

  private calculateCount(map: Map<string, unknown>, sumWall: number, sumOcc: number): void {
    // @ts-ignore
    let arr = Array.from(map.values()).sort((a, b) => b.wallDuration - a.wallDuration);
    for (let e of arr) {
      // @ts-ignore
      e.avgDuration = (e.wallDuration / (e.occurrences || 1.0) / 1000000.0).toFixed(5);
      // @ts-ignore
      e.wallDuration = parseFloat((e.wallDuration / 1000000.0).toFixed(5));
    }
    let count: unknown = {};
    // @ts-ignore
    count.process = ' ';
    // @ts-ignore
    count.wallDuration = parseFloat((sumWall / 1000000.0).toFixed(7));
    // @ts-ignore
    count.occurrences = sumOcc;
    // @ts-ignore
    arr.splice(0, 0, count);
    // @ts-ignore
    this.cpuByThreadSource = arr;
    this.cpuByThreadTbl!.recycleDataSource = arr;
  }

  getTableColumns(cpus: Array<number>): string {
    let cpuByThreadTblHtml = `${this.pubColumns}`;
    let cpuByThreadList = cpus.sort((cpuByThreadA, cpuByThreadB) => cpuByThreadA - cpuByThreadB);
    for (let index of cpuByThreadList) {
      cpuByThreadTblHtml = `${cpuByThreadTblHtml}
            <lit-table-column width="100px" title="cpu${index}" data-index="cpu${index}TimeStr" key="cpu${index}TimeStr"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="100px" title="%" data-index="cpu${index}Ratio" key="cpu${index}Ratio"  align="flex-start" order>
            </lit-table-column>
            `;
    }
    return cpuByThreadTblHtml;
  }

  initElements(): void {
    this.cpuByThreadTbl = this.shadowRoot?.querySelector<LitTable>('#tb-cpu-thread');
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.cpuByThreadTbl!.addEventListener('column-click', (evt): void => {
      if (!this.loadIrq) {
        // @ts-ignore
        this.sortByColumn(evt.detail);
      } else {
        // @ts-ignore
        this.reSortByColum(evt.detail.key, evt.detail.sort);
      }
    });
    this.cpuByThreadTbl!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      this.cpuByThreadTbl?.clearAllSelection(data);
      this.cpuByThreadTbl?.setCurrentSelection(data);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.cpuByThreadTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .cpu-by-thread-label{
            width: 100%;
            height: 20px;
        }
        :host{
            width: auto;
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <label id="time-range" class="cpu-by-thread-label" style="text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="tb-cpu-thread" style="height:calc( 30vh - 25px )" >
            
        </lit-table>
        `;
  }
  compare(property: unknown, sort: unknown, type: string) {
    return function (cpuByThreadLeftData: SelectionData, cpuByThreadRightData: SelectionData): number {
      if (cpuByThreadLeftData.process === ' ' || cpuByThreadRightData.process === ' ') {
        return 0;
      }
      if (type === 'number') {
        return sort === 2 // @ts-ignore
          ? parseFloat(cpuByThreadRightData[property]) - parseFloat(cpuByThreadLeftData[property]) // @ts-ignore
          : parseFloat(cpuByThreadLeftData[property]) - parseFloat(cpuByThreadRightData[property]);
      } else {
        // @ts-ignore
        if (cpuByThreadRightData[property] > cpuByThreadLeftData[property]) {
          return sort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (cpuByThreadRightData[property] === cpuByThreadLeftData[property]) {
            return 0;
          } else {
            return sort === 2 ? -1 : 1;
          }
        }
      }
    };
  }
  sortByColumn(detail: unknown): void {
    // @ts-ignore
    if ((detail.key as string).includes('cpu')) {
      // @ts-ignore
      if ((detail.key as string).includes('Ratio')) {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'string'));
      } else {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare((detail.key as string).replace('TimeStr', ''), detail.sort, 'number'));
      }
    } else {
      if (
        // @ts-ignore
        detail.key === 'pid' ||
        // @ts-ignore
        detail.key === 'tid' ||
        // @ts-ignore
        detail.key === 'wallDuration' ||
        // @ts-ignore
        detail.key === 'avgDuration' ||
        // @ts-ignore
        detail.key === 'occurrences'
      ) {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'number'));
      } else {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'string'));
      }
    }

    this.cpuByThreadTbl!.recycleDataSource = this.cpuByThreadSource;
  }
}
