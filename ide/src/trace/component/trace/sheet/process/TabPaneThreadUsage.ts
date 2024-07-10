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
import '../../../StackBar';
import { log } from '../../../../../log/Log';
import { getThreadUsageProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { Utils } from '../../base/Utils';
import { CpuStruct } from '../../../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { resizeObserver } from '../SheetUtils';
import { getTabRunningPersent, getTabThreadStatesCpu } from '../../../../database/sql/ProcessThread.sql';

@element('tabpane-thread-usage')
export class TabPaneThreadUsage extends BaseElement {
  private threadUsageTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private threadUsageSource: Array<SelectionData> = [];
  private cpuCount = 0;
  private currentSelectionParam: SelectionParam | undefined;
  private pubColumns = `
            <lit-table-column width="200px" title="Process" data-index="process" key="process" 
            align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="100px" title="PID" data-index="pid" key="pid" 
            align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="200px" title="Thread" data-index="thread" key="thread" 
            align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="100px" title="TID" data-index="tid" key="tid" 
            align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="160px" title="Wall duration(μs)" data-index="wallDurationTimeStr" 
            key="wallDurationTimeStr"  align="flex-start" order >
            </lit-table-column>
    `;

  set data(threadUsageParam: SelectionParam | unknown) {
    if (this.currentSelectionParam === threadUsageParam) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = threadUsageParam;
    // @ts-ignore
    let traceId = threadUsageParam.traceId;
    if (this.cpuCount !== Utils.getInstance().getCpuCount(traceId)) {
      this.cpuCount = Utils.getInstance().getCpuCount(traceId); // @ts-ignore
      this.threadUsageTbl!.innerHTML = this.getTableColumns(traceId);
    }
    //@ts-ignore
    this.threadUsageTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    // 框选区域内running的时间
    // @ts-ignore
    getTabRunningPersent(threadUsageParam.threadIds, threadUsageParam.leftNs, threadUsageParam.rightNs).then(
      (result) => {
        // 数组套对象
        // 开始的时间leftStartNs
        // @ts-ignore
        let leftStartNs = threadUsageParam.leftNs + threadUsageParam.recordStartNs;
        // 结束的时间rightEndNs
        // @ts-ignore
        let rightEndNs = threadUsageParam.rightNs + threadUsageParam.recordStartNs;
        let sum = rightEndNs - leftStartNs;
        this.range!.textContent = `Selected range: ${(sum / 1000000.0).toFixed(5)} ms`;
      }
    );
    this.threadUsageTbl!.loading = true;
    // @ts-ignore
    getTabThreadStatesCpu(threadUsageParam.threadIds, threadUsageParam.leftNs, threadUsageParam.rightNs).then(
      (result) => {
        this.threadUsageTbl!.loading = false;
        this.threadStatesCpuDataHandler(result, threadUsageParam);
      }
    );
  }

  private threadStatesCpuDataHandler(result: unknown[], threadUsageParam: SelectionParam | unknown): void {
    if (result !== null && result.length > 0) {
      log(`getTabThreadStates result size : ${result.length}`);
      // @ts-ignore
      let filterArr = result.filter((it) => threadUsageParam.processIds.includes(it.pid));
      let totalDurtion = 0;
      filterArr.forEach((item) => {
        // @ts-ignore
        totalDurtion = totalDurtion + item.wallDuration;
      });
      let map: Map<number, unknown> = new Map<number, unknown>();
      for (let resultEl of filterArr) {
        // @ts-ignore
        if (threadUsageParam.processIds.includes(resultEl.pid)) {
          // @ts-ignore
          if (map.has(resultEl.tid)) {
            // @ts-ignore
            map.get(resultEl.tid)[`cpu${resultEl.cpu}`] = resultEl.wallDuration || 0;
            // @ts-ignore
            map.get(resultEl.tid)[`cpu${resultEl.cpu}TimeStr`] = getThreadUsageProbablyTime(resultEl.wallDuration || 0);
            // @ts-ignore
            map.get(resultEl.tid).wallDuration = map.get(resultEl.tid).wallDuration + (resultEl.wallDuration || 0);
            // @ts-ignore
            map.get(resultEl.tid).wallDurationTimeStr = getThreadUsageProbablyTime(map.get(resultEl.tid).wallDuration);
          } else {
            // @ts-ignore
            let process = Utils.getInstance().getProcessMap(threadUsageParam.traceId).get(resultEl.pid);
            // @ts-ignore
            let thread = Utils.getInstance().getThreadMap(threadUsageParam.traceId).get(resultEl.tid);
            let threadStatesStruct: unknown = {
              // @ts-ignore
              tid: resultEl.tid,
              // @ts-ignore
              pid: resultEl.pid,
              thread: thread || 'null',
              process: process || 'null',
              // @ts-ignore
              wallDuration: resultEl.wallDuration || 0,
              // @ts-ignore
              wallDurationTimeStr: getThreadUsageProbablyTime(resultEl.wallDuration || 0),
            };
            for (let i = 0; i < this.cpuCount; i++) {
              // @ts-ignore
              threadStatesStruct[`cpu${i}`] = 0;
              // @ts-ignore
              threadStatesStruct[`cpu${i}TimeStr`] = '0';
              // @ts-ignore
              threadStatesStruct[`cpu${i}Ratio`] = '0';
            }
            // @ts-ignore
            threadStatesStruct[`cpu${resultEl.cpu}`] = resultEl.wallDuration || 0;
            // @ts-ignore
            threadStatesStruct[`cpu${resultEl.cpu}TimeStr`] = getThreadUsageProbablyTime(resultEl.wallDuration || 0);
            // @ts-ignore
            map.set(resultEl.tid, threadStatesStruct);
          }
        }
      }
      map.forEach((val) => {
        for (let i = 0; i < this.cpuCount; i++) {
          // @ts-ignore
          val[`cpu${i}Ratio`] = ((100.0 * val[`cpu${i}`]) / val.wallDuration).toFixed(2);
        }
      });
      // @ts-ignore
      this.threadUsageSource = Array.from(map.values());
      this.threadUsageTbl!.recycleDataSource = this.threadUsageSource;
    } else {
      this.threadUsageSource = [];
      this.threadUsageTbl!.recycleDataSource = [];
    }
  }

  getTableColumns(traceId?: string | null): string {
    let threadUsageHtml = `${this.pubColumns}`;
    let cpuCount = Utils.getInstance().getCpuCount(traceId);
    for (let index = 0; index < cpuCount; index++) {
      threadUsageHtml = `${threadUsageHtml}
            <lit-table-column width="100px" title="cpu${index}(μs)" data-index="cpu${index}TimeStr" 
            key="cpu${index}TimeStr"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="100px" title="%" data-index="cpu${index}Ratio" 
            key="cpu${index}Ratio"  align="flex-start" order>
            </lit-table-column>
            `;
    }
    return threadUsageHtml;
  }

  initElements(): void {
    this.threadUsageTbl = this.shadowRoot?.querySelector<LitTable>('#tb-thread-states');
    this.range = this.shadowRoot?.querySelector('#thread-usage-time-range');
    this.threadUsageTbl!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadUsageTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .thread-usage-table{
          flex-direction: row;
          margin-bottom: 5px;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <div class="thread-usage-table" style="display: flex;height: 20px;align-items: center;
        flex-direction: row;margin-bottom: 5px">
            <stack-bar id="thread-usage-stack-bar" style="flex: 1"></stack-bar>
            <label id="thread-usage-time-range"  style="width: auto;text-align: end;
            font-size: 10pt;">Selected range:0.0 ms</label>
        </div>
        <div style="overflow: auto">
            <lit-table id="tb-thread-states" style="height: auto"></lit-table>
        </div>
        `;
  }

  sortByColumn(treadUsageDetail: unknown): void {
    function compare(property: unknown, treadUsageSort: unknown, type: unknown) {
      return function (threadUsageLeftData: SelectionData | unknown, threadUsageRightData: SelectionData | unknown) {
        // @ts-ignore
        if (threadUsageLeftData.process === ' ' || threadUsageRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return treadUsageSort === 2
            ? // @ts-ignore
              parseFloat(threadUsageRightData[property]) - parseFloat(threadUsageLeftData[property])
            : // @ts-ignore
              parseFloat(threadUsageLeftData[property]) - parseFloat(threadUsageRightData[property]);
        } else {
          // @ts-ignore
          if (threadUsageRightData[property] > threadUsageLeftData[property]) {
            return treadUsageSort === 2 ? 1 : -1;
            // @ts-ignore
          } else if (threadUsageRightData[property] === threadUsageLeftData[property]) {
            return 0;
          } else {
            return treadUsageSort === 2 ? -1 : 1;
          }
        }
      };
    }

    if (
      // @ts-ignore
      treadUsageDetail.key === 'process' ||
      // @ts-ignore
      treadUsageDetail.key === 'thread' ||
      // @ts-ignore
      (treadUsageDetail.key as string).includes('Ratio')
    ) {
      // @ts-ignore
      this.threadUsageSource.sort(compare(treadUsageDetail.key, treadUsageDetail.sort, 'string'));
    } else {
      this.threadUsageSource.sort(
        // @ts-ignore
        compare((treadUsageDetail.key as string).replace('TimeStr', ''), treadUsageDetail.sort, 'number')
      );
    }
    this.threadUsageTbl!.recycleDataSource = this.threadUsageSource;
  }
}

export function judgement(result: Array<unknown>, leftStart: unknown, rightEnd: unknown): number {
  let sum = 0;
  if (result !== null && result.length > 0) {
    log(`getTabRunningTime result size : ${result.length}`);
    let rightEndNs = rightEnd;
    let leftStartNs = leftStart;
    // 尾部running的结束时间
    // @ts-ignore
    let RunningEnds = result[result.length - 1].dur - (rightEndNs - result[result.length - 1].ts) + rightEndNs;
    // 如果截取了开头和结尾的长度
    // @ts-ignore
    let beigin = result[0].dur - (leftStartNs - result[0].ts);
    // @ts-ignore
    let end = rightEndNs - result[result.length - 1].ts;
    // 用来存储数据的新数组
    let arr = [];
    // 如果开头和结尾都截取了
    // @ts-ignore
    if (leftStartNs > result[0].ts && rightEndNs < RunningEnds) {
      // 首尾的running长度
      let beginAndEnd = beigin + end;

      // 截取的除了开头和结尾的数据
      arr = result.slice(1, result.length - 1);
      let res = arr.reduce((total, item) => {
        // @ts-ignore
        return total + item.dur;
      }, 0);
      // @ts-ignore
      sum = beginAndEnd + res;
      // @ts-ignore
    } else if (leftStartNs > result[0].ts) {
      // 如果只是截取了开头
      arr = result.slice(1);
      let res = arr.reduce((total, item) => {
        // @ts-ignore
        return total + item.dur;
      }, 0);
      // @ts-ignore
      sum = beigin + res;
      // @ts-ignore
    } else if (rightEndNs < RunningEnds) {
      // 如果只是截取了结尾
      arr = result.slice(0, result.length - 1);
      let res = arr.reduce((total, item) => {
        // @ts-ignore
        return total + item.dur;
      }, 0);
      // @ts-ignore
      sum = end + res;
    } else {
      // 如果都没截取
      for (let i of result) {
        // @ts-ignore
        sum += i.dur;
      }
    }
  }
  return sum;
}
