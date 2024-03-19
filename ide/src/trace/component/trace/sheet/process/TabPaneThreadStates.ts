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
import { Utils } from '../../base/Utils';
import { StackBar } from '../../../StackBar';
import { log } from '../../../../../log/Log';
import { resizeObserver } from '../SheetUtils';
import { getTabThreadStatesDetail } from '../../../../database/sql/ProcessThread.sql';

@element('tabpane-thread-states')
export class TabPaneThreadStates extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private stackBar: StackBar | null | undefined;
  private threadStatesTblSource: Array<SelectionData> = [];
  private currentSelectionParam: SelectionParam | undefined;

  set data(threadStatesParam: SelectionParam | any) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    this.currentSelectionParam = threadStatesParam;
    //@ts-ignore
    this.threadStatesTbl?.shadowRoot?.querySelector('.table')?.style?.height =
      `${this.parentElement!.clientHeight - 45  }px`;
    // // @ts-ignore
    this.range!.textContent =
      `Selected range: ${  ((threadStatesParam.rightNs - threadStatesParam.leftNs) / 1000000.0).toFixed(5)  } ms`;
    this.threadStatesTbl!.loading = true;
    this.initThreadStates(threadStatesParam);
  }

  async initThreadStates(threadStatesParam: SelectionParam | any): Promise<void> {
    let leftStartNs = threadStatesParam.leftNs + threadStatesParam.recordStartNs;
    let rightEndNs = threadStatesParam.rightNs + threadStatesParam.recordStartNs;

    let threadStatesDetail = await getTabThreadStatesDetail(
      threadStatesParam.threadIds,
      threadStatesParam.leftNs,
      threadStatesParam.rightNs
    );

    let targetListTemp = this.updateThreadStates(threadStatesDetail, leftStartNs, rightEndNs);

    let compare = (threadState1: SelectionData, threadState2: SelectionData): number => {
      let wallDuration1 = threadState1.wallDuration;
      let wallDuration2 = threadState2.wallDuration;
      if (wallDuration1 < wallDuration2) {
        return 1;
      } else if (wallDuration1 > wallDuration2) {
        return -1;
      } else {
        return 0;
      }
    };
    targetListTemp.sort(compare);
    this.addSumLine(threadStatesParam, targetListTemp);
  }

  updateThreadStates(threadStatDetail: Array<any>, leftNs: number, rightNs: number): Array<SelectionData> {
    let targetListTemp: any[] = [];
    if (threadStatDetail.length > 0) {
      let durExceptionDataMap: Map<string, any> = new Map<string, any>();
      let source: Map<string, any> = new Map<string, any>();
      let target = threadStatDetail.reduce((map, current) => {
        let mapKey = `${current.pid}-${current.tid}`;
        let key = `${current.state}-${mapKey}`;
        if (durExceptionDataMap.has(mapKey)) {
          // 如果某线程中间有dur 为 -1的数据，则重新计算dur值，并给统计的值加上重新计算的dur
          let pre = durExceptionDataMap.get(mapKey);
          pre.dur = current.ts - pre.ts;
          if (pre.ts < leftNs && pre.dur > 0) {
            pre.dur = pre.dur - (leftNs - pre.ts);
          }
          if (pre.ts + pre.dur > rightNs && pre.dur > 0) {
            pre.dur = pre.dur - (pre.ts + pre.dur - rightNs);
          }
          map.get(`${pre.state}-${mapKey}`).wallDuration += pre.dur;
          durExceptionDataMap['delete'](mapKey);
        }
        if (current.dur === -1) {
          //如果出现dur 为-1的数据，dur先以0计算,在后续循环中碰到相同线程数据，则补上dur的值
          current.dur = 0;
          durExceptionDataMap.set(mapKey, current);
        } else {
          if (current.ts < leftNs && current.dur > 0) {
            current.dur = current.dur - (leftNs - current.ts);
          }
          if (current.ts + current.dur > rightNs && current.dur > 0) {
            current.dur = current.dur - (current.ts + current.dur - rightNs);
          }
        }
        if (map.has(key)) {
          map.get(key).wallDuration += current.dur;
          map.get(key).occurrences += 1;
        } else {
          map.set(key, {
            pid: current.pid,
            tid: current.tid,
            state: current.state,
            wallDuration: current.dur || 0,
            avgDuration: 0,
            occurrences: 1
          });
        }
        return map;
      }, source);
      targetListTemp = this.updateThreadStatesExtend(durExceptionDataMap, target, leftNs, rightNs, targetListTemp);
    }
    return targetListTemp;
  }

  private updateThreadStatesExtend(
    durExceptionDataMap: Map<string, any>,
    target: any,
    leftNs: number,
    rightNs: number,
    targetListTemp: any[]
  ): any[] {
    // 通过上面循环之后，durExceptionDataMap 中的值即为 该线程 在框选时间内最后一条数据且dur 为-1，需要根据框选的时间把dur计算出来加上，
    let arr = Array.from(durExceptionDataMap.values());
    for (let item of arr) {
      let key = `${item.state}-${item.pid}-${item.tid}`;
      if (target.has(key)) {
        target.get(key).wallDuration += (rightNs - Math.max(item.ts, leftNs));
      } else {
        target.set(key, {
          pid: item.pid,
          tid: item.tid,
          state: item.state,
          wallDuration: rightNs - Math.max(item.ts, leftNs),
          avgDuration: 0,
          occurrences: 1
        });
      }
    }
    durExceptionDataMap.clear();
    targetListTemp = Array.from(target.values());
    return targetListTemp;
  }

  addSumLine(threadStatesParam: SelectionParam | any, targetListTemp: Array<any>): void {
    log(targetListTemp);

    if (targetListTemp !== null && targetListTemp.length > 0) {
      log('getTabThreadStates result size : ' + targetListTemp.length);
      let sumWall = 0.0;
      let sumOcc = 0;
      let targetList = [];

      for (let e of targetListTemp) {
        if (threadStatesParam.processIds.includes(e.pid)) {
          let process = Utils.PROCESS_MAP.get(e.pid);
          let thread = Utils.THREAD_MAP.get(e.tid);
          e.process = process == null || process.length == 0 ? '[NULL]' : process;
          e.thread = thread == null || thread.length == 0 ? '[NULL]' : thread;

          e.stateJX = e.state;
          e.state = Utils.getEndState(e.stateJX);
          e.avgDuration = parseFloat(((e.wallDuration / e.occurrences) / 1000000.0).toFixed(5));
          e.wallDuration = parseFloat((e.wallDuration / 1000000.0).toFixed(5));
          sumWall += e.wallDuration;
          sumOcc += e.occurrences;
          targetList.push(e);
        }
      }
      if (targetList.length > 0) {
        let count: any = {};
        count.process = ' ';
        count.state = ' ';
        count.wallDuration = parseFloat(sumWall.toFixed(5));
        count.occurrences = sumOcc;
        targetList.splice(0, 0, count);
      }
      this.threadStatesTblSource = targetList;
      this.threadStatesTbl!.recycleDataSource = targetList;
      this.stackBar!.data = targetList;
    } else {
      this.threadStatesTblSource = [];
      this.stackBar!.data = [];
      this.threadStatesTbl!.recycleDataSource = [];
    }
    this.threadStatesTbl!.loading = false;
  }

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-thread-states');
    this.range = this.shadowRoot?.querySelector('#thread-states-time-range');
    this.stackBar = this.shadowRoot?.querySelector('#thread-states-stack-bar');
    this.threadStatesTbl!.addEventListener('column-click', (evt: any) => {
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .tread-states-table{
            display: flex;
            height: 20px;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <div class="tread-states-table" style="display: flex;height: 20px;align-items: center;
        flex-direction: row;margin-bottom: 5px;justify-content: space-between">
            <stack-bar id="thread-states-stack-bar" style="width: calc(100vw - 520px)"></stack-bar>
            <label id="thread-states-time-range"  style="width: 250px;text-align: end;
            font-size: 10pt;">Selected range:0.0 ms</label>
        </div>
        <lit-table id="tb-thread-states" style="height: auto;overflow-x: auto;width: 100%">
            <lit-table-column class="tread-states-column" width="240px" title="Process" 
            data-index="process" key="process"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="120px" title="PID" 
            data-index="pid" key="pid"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="240px" title="Thread" 
            data-index="thread" key="thread"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="120px" title="TID" 
            data-index="tid" key="tid"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="240px" title="State" 
            data-index="state" key="state"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="120px" title="Wall duration(ms)" 
            data-index="wallDuration" key="wallDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="120px" title="Avg Wall duration(ms)" 
            data-index="avgDuration" key="avgDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="tread-states-column" width="120px" title="Occurrences" 
            data-index="occurrences" key="occurrences"  align="flex-start" order >
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(treadStatesDetail: any): void {
    function compare(property: any, treadStatesSort: any, type: any) {
      return function (threadStatesLeftData: SelectionData | any, threadStatesRightData: SelectionData | any) {
        if (threadStatesLeftData.process === ' ' || threadStatesRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return treadStatesSort === 2
            ? parseFloat(threadStatesRightData[property]) - parseFloat(threadStatesLeftData[property])
            : parseFloat(threadStatesLeftData[property]) - parseFloat(threadStatesRightData[property]);
        } else {
          if (threadStatesRightData[property] > threadStatesLeftData[property]) {
            return treadStatesSort === 2 ? 1 : -1;
          } else if (threadStatesRightData[property] == threadStatesLeftData[property]) {
            return 0;
          } else {
            return treadStatesSort === 2 ? -1 : 1;
          }
        }
      };
    }

    if (treadStatesDetail.key === 'name' || treadStatesDetail.key === 'thread' || treadStatesDetail.key === 'state') {
      this.threadStatesTblSource.sort(compare(treadStatesDetail.key, treadStatesDetail.sort, 'string'));
    } else {
      this.threadStatesTblSource.sort(compare(treadStatesDetail.key, treadStatesDetail.sort, 'number'));
    }
    this.threadStatesTbl!.recycleDataSource = this.threadStatesTblSource;
  }
}
