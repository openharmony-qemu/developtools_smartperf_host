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
import { SysCallBoxJumpParam, SelectionData } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { querySysCallEventWithRange } from '../../../../database/sql/ProcessThread.sql';
import { SysCallMap } from '../../base/SysCallUtils';

interface SysCallChildItem {
  pName: string;
  tName: string;
  pid: number;
  tid: number;
  nameId: number;
  name: string;
  startTs: string;
  startTime: number;
  absoluteTs: number;
  dur: number;
  args: string;
  ret: number
}

@element('tabpane-syscall-child')
export class TabPaneSysCallChild extends BaseElement {
  private boxChildTbl: LitTable | null | undefined;
  private boxChildRange: HTMLLabelElement | null | undefined;
  private boxChildSource: Array<SysCallChildItem> = [];
  private boxChildParam: SysCallBoxJumpParam | null | undefined;

  set data(boxChildValue: SysCallBoxJumpParam) {
    //切换Tab页 保持childTab数据不变 除非重新点击跳转
    if (boxChildValue === this.boxChildParam || !boxChildValue.isJumpPage) {
      return;
    } // @ts-ignore
    this.boxChildParam = boxChildValue;
    //显示框选范围对应的时间
    this.boxChildRange!.textContent = `Selected range: ${parseFloat(
      ((boxChildValue.rightNs - boxChildValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.boxChildTbl!.recycleDataSource = [];
    this.getDataByDB(boxChildValue);
  }

  initElements(): void {
    this.boxChildTbl = this.shadowRoot?.querySelector<LitTable>('#tb-syscall-child');
    this.boxChildRange = this.shadowRoot?.querySelector('#time-range');
    this.boxChildTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    //监听row的点击事件，在对应起始时间上画标记棋子
    this.boxChildTbl!.addEventListener('row-click', (evt): void => {
      //@ts-ignore
      let param = evt.detail.data;
      param.isSelected = true;
      this.boxChildTbl!.clearAllSelection(param);
      this.boxChildTbl!.setCurrentSelection(param);
      document.dispatchEvent(
        new CustomEvent('triangle-flag', {
          detail: { time: [param.startTime], type: 'triangle' },
        })
      );
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.boxChildTbl!);
  }

  getDataByDB(val: SysCallBoxJumpParam): void {
    this.boxChildTbl!.loading = true;
    let ipidArr: number[] = [];
    let itidArr: number[] = [];
    Array.from(Utils.getInstance().sysCallEventTidsMap.values()).forEach(it => {
      if (val?.processId?.includes(it.pid)) {
        ipidArr.push(it.ipid);
      }
      if (val?.threadId?.includes(it.tid)) {
        itidArr.push(it.itid);
      }
    });
    querySysCallEventWithRange(ipidArr, itidArr, val.leftNs, val.rightNs, val.sysCallId).then(result => {
      this.boxChildTbl!.loading = false;
      const arr: Array<SysCallChildItem> = [];
      result.forEach(it => {
        arr.push({
          pName: it.pName,
          tName: it.tName,
          pid: it.pid,
          tid: it.tid,
          name: SysCallMap.get(it.nameId) || 'unknown event',
          nameId: it.nameId,
          startTime: it.startTs,
          startTs: Utils.getProbablyTime(it.startTs),
          // @ts-ignore
          absoluteTs:  ((window as unknown).recordStartNS + it.startTs) / 1000000000,
          dur: it.dur / 1000000,
          args: it.args,
          ret: it.ret
        });
      });
      this.boxChildSource = arr;
      if (this.boxChildTbl) {
        // @ts-ignore
        this.boxChildTbl.recycleDataSource = arr;
      }
    });
  }

  initHtml(): string {
    return `
        <style>
        .box-child-label{
          text-align: end;
          width: 100%;
          height: 20px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="box-child-label" style="font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <div style="overflow: auto">
          <lit-table id="tb-syscall-child" style="height: auto">
            <lit-table-column order width="150px" data-index="name" key="name" align="flex-start" title="Event Name">
            </lit-table-column>
            <lit-table-column order title="StartTime(Relative)" width="150px" data-index="startTs" key="startTs" align="flex-start" >
            </lit-table-column>
            <lit-table-column order title="StartTime(Absolute)" width="150px" data-index="absoluteTs" key="absoluteTs" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" data-index="pName" key="pName" title="Process" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" data-index="tName" key="tName" align="flex-start" title="Thread">
            </lit-table-column>
            <lit-table-column order width="80px" data-index="dur" key="dur" title="duration(ms)" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="200px" data-index="args" key="args" align="flex-start" title="args">
            </lit-table-column>
            <lit-table-column order width="80px" data-index="ret" title="ret" key="ret" align="flex-start" >
            </lit-table-column>
          </lit-table>
        </div>
        `;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (boxChildLeftData: SelectionData, boxChildRightData: SelectionData): number {
        if (type === 'number') {
          return sort === 2
            // @ts-ignore
            ? parseFloat(boxChildRightData[property]) - parseFloat(boxChildLeftData[property])
            // @ts-ignore
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

    // @ts-ignore
    this.boxChildSource.sort(compare(detail.key, detail.sort, 'string'));
    this.boxChildTbl!.recycleDataSource = this.boxChildSource;
  }
}
