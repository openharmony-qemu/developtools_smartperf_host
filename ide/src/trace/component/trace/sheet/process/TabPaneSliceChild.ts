/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import { SelectionData, SliceBoxJumpParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { getTabDetails, getCatDetails } from '../../../../database/sql/Func.sql';

@element('box-slice-child')
export class TabPaneSliceChild extends BaseElement {
  private sliceChildTbl: LitTable | null | undefined;
  private boxChildSource: Array<unknown> = [];
  private sliceChildParam: SliceBoxJumpParam | null | undefined;

  set data(boxChildValue: SliceBoxJumpParam) {
    //切换Tab页 保持childTab数据不变 除非重新点击跳转
    if (boxChildValue === this.sliceChildParam || !boxChildValue.isJumpPage) {
      return;
    }
    // @ts-ignore
    this.sliceChildParam = boxChildValue;
    this.sliceChildTbl!.recycleDataSource = [];
    this.getDataByDB(boxChildValue);
  }

  initElements(): void {
    this.sliceChildTbl = this.shadowRoot?.querySelector<LitTable>('#tb-slice-child');
    this.sliceChildTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    //监听row的点击事件，在对应起始时间上画标记棋子
    this.sliceChildTbl!.addEventListener('row-click', (evt): void => {
      //@ts-ignore
      let param = evt.detail.data;
      param.isSelected = true;
      this.sliceChildTbl!.clearAllSelection(param);
      this.sliceChildTbl!.setCurrentSelection(param);
      document.dispatchEvent(
        new CustomEvent('triangle-flag', {
          detail: { time: [param.startNs], type: 'triangle' },
        })
      );
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.sliceChildTbl!, 25);
  }

  getDataByDB(val: SliceBoxJumpParam): void {
    this.sliceChildTbl!.loading = true;
    //处理异步方法
    getTabDetails(val.name!, val.processId, val.leftNs, val.rightNs, 'async').then((res1: unknown) => {//@ts-ignore
      //处理cat方法
      getCatDetails(val.name!, val.asyncCatNames!, val.processId, val.leftNs, val.rightNs).then((res2) => {//@ts-ignore
        //处理同步方法
        getTabDetails(val.name!, val.processId, val.leftNs, val.rightNs, 'sync', val.threadId).then(
          (res3: unknown) => {//@ts-ignore
            let result: unknown = (res1 || []).concat(res2 || []).concat(res3 || []);
            this.sliceChildTbl!.loading = false;//@ts-ignore
            if (result.length !== null && result.length > 0) {//@ts-ignore
              result.map((e: unknown) => {//@ts-ignore
                e.startTime = Utils.getTimeString(e.startNs);
                // @ts-ignore
                e.absoluteTime = ((window as unknown).recordStartNS + e.startNs) / 1000000000;//@ts-ignore
                e.duration = e.duration / 1000000;//@ts-ignore
                e.state = Utils.getEndState(e.state)!;//@ts-ignore
                e.processName = `${e.process === undefined || e.process === null ? 'process' : e.process}(${e.processId})`;//@ts-ignore
                e.threadName = `${e.thread === undefined || e.thread === null ? 'thread' : e.thread}(${e.threadId})`;
              });//@ts-ignore
              this.boxChildSource = result;
              if (this.sliceChildTbl) {
                // @ts-ignore
                this.sliceChildTbl.recycleDataSource = result;
              }
            } else {
              this.boxChildSource = [];
              if (this.sliceChildTbl) {
                // @ts-ignore
                this.sliceChildTbl.recycleDataSource = [];
              }
            }
          }
        );
      });
    });
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
        <lit-table id="tb-slice-child" style="height: auto">
            <lit-table-column order title="StartTime(Relative)" width="15%" data-index="startTime" key="startTime" align="flex-start" >
            </lit-table-column>
            <lit-table-column order title="StartTime(Absolute)" width="15%" data-index="absoluteTime" key="absoluteTime" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="15%" data-index="processName" key="processName" title="Process" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="15%" data-index="threadName" key="threadName" align="flex-start" title="Thread" >
            </lit-table-column>
            <lit-table-column order width="1fr" data-index="name" key="name" align="flex-start" title="Name">
            </lit-table-column>
            <lit-table-column order width="1fr" data-index="duration" key="duration" title="duration(ms)" align="flex-start">
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (boxChildLeftData: SelectionData, boxChildRightData: SelectionData): number {
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(boxChildRightData[property]) - parseFloat(boxChildLeftData[property]) // @ts-ignore
            : parseFloat(boxChildLeftData[property]) - parseFloat(boxChildRightData[property]);
        } else {
          // @ts-ignore
          if (boxChildRightData[property] > boxChildLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (boxChildRightData[property] === boxChildLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    //@ts-ignore
    if (detail.key === 'startTime' || detail.key === 'processName' || detail.key === 'threadName' || //@ts-ignore
      detail.key === 'name') {
      // @ts-ignore
      this.boxChildSource.sort(compare(detail.key, detail.sort, 'string'));// @ts-ignore
    } else if (detail.key === 'absoluteTime' || detail.key === 'duration') {// @ts-ignore
      this.boxChildSource.sort(compare(detail.key, detail.sort, 'number'));
    }
    // @ts-ignore
    this.boxChildSource.sort(compare(detail.key, detail.sort, 'string'));
    this.sliceChildTbl!.recycleDataSource = this.boxChildSource;
  }
}
