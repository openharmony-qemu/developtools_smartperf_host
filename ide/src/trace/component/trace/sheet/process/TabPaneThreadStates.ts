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

  set data(threadStatesParam: SelectionParam | unknown) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = threadStatesParam;
    //@ts-ignore
    this.threadStatesTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    // // @ts-ignore
    this.range!.textContent = `Selected range: ${// @ts-ignore
    ((threadStatesParam.rightNs - threadStatesParam.leftNs) / 1000000.0).toFixed(5)} ms`;
    this.threadStatesTbl!.loading = true;
    this.initThreadStates(threadStatesParam);
  }

  async initThreadStates(threadStatesParam: SelectionParam | unknown): Promise<void> {
    // @ts-ignore
    let leftStartNs = threadStatesParam.leftNs + threadStatesParam.recordStartNs;
    // @ts-ignore
    let rightEndNs = threadStatesParam.rightNs + threadStatesParam.recordStartNs;

    let threadStatesDetail = await getTabThreadStatesDetail(
      // @ts-ignore
      threadStatesParam.threadIds,
      // @ts-ignore
      threadStatesParam.leftNs,
      // @ts-ignore
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

  updateThreadStates(threadStatDetail: Array<unknown>, leftNs: number, rightNs: number): Array<SelectionData> {
    let targetListTemp: unknown[] = [];
    if (threadStatDetail.length > 0) {
      let durExceptionDataMap: Map<string, unknown> = new Map<string, unknown>();
      let source: Map<string, unknown> = new Map<string, unknown>();
      let target = threadStatDetail.reduce((map, current) => {
        // @ts-ignore
        let mapKey = `${current.pid}-${current.tid}`;
        // @ts-ignore
        let key = `${current.state}-${mapKey}`;
        if (durExceptionDataMap.has(mapKey)) {
          // 如果某线程中间有dur 为 -1的数据，则重新计算dur值，并给统计的值加上重新计算的dur
          let pre = durExceptionDataMap.get(mapKey);
          // @ts-ignore
          pre.dur = current.ts - pre.ts;
          // @ts-ignore
          if (pre.ts < leftNs && (pre.ts + pre.dur) < rightNs) {
            // @ts-ignore
            pre.dur = (pre.ts + pre.dur) - leftNs;// @ts-ignore
          } else if (pre.ts + pre.dur > rightNs && pre.ts > leftNs) {
            // @ts-ignore
            pre.dur = rightNs - pre.ts;// @ts-ignore
          } else if (pre.ts < leftNs && (pre.ts + pre.dur) > rightNs ) {
            // @ts-ignore
            pre.dur = rightNs - leftNs;
          }
          // @ts-ignore
          map.get(`${pre.state}-${mapKey}`).wallDuration += pre.dur;
          durExceptionDataMap.delete(mapKey);
        }
        // @ts-ignore
        if (current.dur === null || current.dur === undefined || current.dur === -1) {
          //如果出现dur 为-1的数据，dur先以0计算,在后续循环中碰到相同线程数据，则补上dur的值
          // @ts-ignore
          current.dur = 0;
          durExceptionDataMap.set(mapKey, current);
        } else {
          // @ts-ignore
          if (current.ts < leftNs && (current.ts + current.dur) < rightNs) {
            // @ts-ignore
            current.dur = (current.dur + current.ts) - leftNs ;// @ts-ignore
          } else if (current.ts + current.dur > rightNs && current.ts > leftNs) {
            // @ts-ignore
            current.dur =  rightNs - current.ts;
            // @ts-ignore
          } else if (current.ts < leftNs && (current.ts + current.dur) > rightNs ) {
            // @ts-ignore
            current.dur = rightNs - leftNs;
          }
        }
        // @ts-ignore
        if (map.has(key)) {
          // @ts-ignore
          map.get(key).wallDuration += current.dur;
          // @ts-ignore
          map.get(key).occurrences += 1;
        } else {
          // @ts-ignore
          map.set(key, {
            // @ts-ignore
            pid: current.pid,
            // @ts-ignore
            tid: current.tid,
            // @ts-ignore
            state: current.state,
            // @ts-ignore
            wallDuration: current.dur || 0,
            avgDuration: 0,
            occurrences: 1,
          });
        }
        return map;
      }, source);
      targetListTemp = this.updateThreadStatesExtend(durExceptionDataMap, target, leftNs, rightNs, targetListTemp);
    }
    // @ts-ignore
    return targetListTemp;
  }

  private updateThreadStatesExtend(
    durExceptionDataMap: Map<string, unknown>,
    target: unknown,
    leftNs: number,
    rightNs: number,
    targetListTemp: unknown[]
  ): unknown[] {
    // 通过上面循环之后，durExceptionDataMap 中的值即为 该线程 在框选时间内最后一条数据且dur 为-1，需要根据框选的时间把dur计算出来加上，
    let arr = Array.from(durExceptionDataMap.values());
    for (let item of arr) {
      // @ts-ignore
      let key = `${item.state}-${item.pid}-${item.tid}`;
      // @ts-ignore
      if (target.has(key)) {
        // @ts-ignore
        target.get(key).wallDuration += rightNs - Math.max(item.ts, leftNs);
      } else {
        // @ts-ignore
        target.set(key, {
          // @ts-ignore
          pid: item.pid,
          // @ts-ignore
          tid: item.tid,
          // @ts-ignore
          state: item.state,
          // @ts-ignore
          wallDuration: rightNs - Math.max(item.ts, leftNs),
          avgDuration: 0,
          occurrences: 1,
        });
      }
    }
    durExceptionDataMap.clear();
    // @ts-ignore
    targetListTemp = Array.from(target.values());
    return targetListTemp;
  }

  addSumLine(threadStatesParam: SelectionParam | unknown, targetListTemp: Array<unknown>): void {
    log(targetListTemp);

    if (targetListTemp !== null && targetListTemp.length > 0) {
      log('getTabThreadStates result size : ' + targetListTemp.length);
      let sumWall = 0.0;
      let sumOcc = 0;
      let targetList = [];
      // @ts-ignore
      let traceId = threadStatesParam.traceId;
      for (let e of targetListTemp) {
        // @ts-ignore
        if (threadStatesParam.processIds.includes(e.pid)) {
          // @ts-ignore
          let process = Utils.getInstance().getProcessMap(traceId).get(e.pid);
          // @ts-ignore
          let thread = Utils.getInstance().getThreadMap(traceId).get(e.tid);
          // @ts-ignore
          e.process = process || '[NULL]';
          // @ts-ignore
          e.thread = thread || '[NULL]';

          // @ts-ignore
          e.stateJX = e.state;
          // @ts-ignore
          e.state = Utils.getEndState(e.stateJX);
          // @ts-ignore
          e.avgDuration = parseFloat((e.wallDuration / e.occurrences / 1000000.0).toFixed(5));
          // @ts-ignore
          e.wallDuration = parseFloat((e.wallDuration / 1000000.0).toFixed(5));
          // @ts-ignore
          sumWall += e.wallDuration;
          // @ts-ignore
          sumOcc += e.occurrences;
          targetList.push(e);
        }
      }
      if (targetList.length > 0) {
        let count: unknown = {};
        // @ts-ignore
        count.process = ' ';
        // @ts-ignore
        count.state = ' ';
        // @ts-ignore
        count.wallDuration = parseFloat(sumWall.toFixed(5));
        // @ts-ignore
        count.occurrences = sumOcc;
        targetList.splice(0, 0, count);
      }
      // @ts-ignore
      this.threadStatesTblSource = targetList;
      this.threadStatesTbl!.recycleDataSource = targetList;
      // @ts-ignore
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
    this.threadStatesTbl!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
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

  sortByColumn(treadStatesDetail: unknown): void {
    function compare(property: unknown, treadStatesSort: unknown, type: unknown) {
      return function (threadStatesLeftData: SelectionData | unknown, threadStatesRightData: SelectionData | unknown): number {
        // @ts-ignore
        if (threadStatesLeftData.process === ' ' || threadStatesRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return treadStatesSort === 2
            ? // @ts-ignore
              parseFloat(threadStatesRightData[property]) - parseFloat(threadStatesLeftData[property])
            : // @ts-ignore
              parseFloat(threadStatesLeftData[property]) - parseFloat(threadStatesRightData[property]);
        } else {
          // @ts-ignore
          if (threadStatesRightData[property] > threadStatesLeftData[property]) {
            return treadStatesSort === 2 ? 1 : -1;
            // @ts-ignore
          } else if (threadStatesRightData[property] === threadStatesLeftData[property]) {
            return 0;
          } else {
            return treadStatesSort === 2 ? -1 : 1;
          }
        }
      };
    }

    // @ts-ignore
    if (treadStatesDetail.key === 'name' || treadStatesDetail.key === 'thread' || treadStatesDetail.key === 'state') {
      // @ts-ignore
      this.threadStatesTblSource.sort(compare(treadStatesDetail.key, treadStatesDetail.sort, 'string'));
    } else {
      // @ts-ignore
      this.threadStatesTblSource.sort(compare(treadStatesDetail.key, treadStatesDetail.sort, 'number'));
    }
    this.threadStatesTbl!.recycleDataSource = this.threadStatesTblSource;
  }
}
