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
import { SelectionData, SelectionParam, SliceBoxJumpParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { getTabDetails, getGhDetails, getSfDetails, getParentDetail, getFuncChildren } from '../../../../database/sql/Func.sql';

@element('box-slice-child')
export class TabPaneSliceChild extends BaseElement {
  private sliceChildTbl: LitTable | null | undefined;
  private boxChildSource: Array<unknown> = [];
  private sliceChildParam: { param: SliceBoxJumpParam, selection: SelectionParam } | null | undefined;

  set data(boxChildValue: { param: SliceBoxJumpParam, selection: SelectionParam | null | undefined }) {
    //切换Tab页 保持childTab数据不变 除非重新点击跳转
    if (boxChildValue === this.sliceChildParam || !boxChildValue.param.isJumpPage) {
      return;
    }
    // @ts-ignore
    this.sliceChildParam = boxChildValue;
    this.sliceChildTbl!.recycleDataSource = [];
    //合并SF异步信息，相同pid和tid的name
    let sfAsyncFuncMap: Map<string, { name: string[]; pid: number, tid: number | undefined }> = new Map();
    let filterSfAsyncFuncName = boxChildValue.selection!.funAsync;
    if (!boxChildValue.param.isSummary!) {
      filterSfAsyncFuncName = filterSfAsyncFuncName.filter((item) => item.name === boxChildValue.param.name![0]);
    }
    filterSfAsyncFuncName.forEach((it: { name: string; pid: number, tid: number | undefined }) => {
      if (sfAsyncFuncMap.has(`${it.pid}-${it.tid}`)) {
        let item = sfAsyncFuncMap.get(`${it.pid}-${it.tid}`);
        item?.name.push(it.name);
      } else {
        sfAsyncFuncMap.set(`${it.pid}-${it.tid}`, {
          name: [it.name],
          pid: it.pid,
          tid: it.tid
        });
      }
    });
    //@ts-ignore
    this.getDataByDB(boxChildValue, sfAsyncFuncMap, boxChildValue.selection!.funCatAsync);
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

  getDataByDB(
    val: { param: SliceBoxJumpParam, selection: SelectionParam },
    sfAsyncFuncMap: Map<string, { name: string[]; pid: number, tid: number | undefined }>,
    ghAsyncFunc: { threadName: string; pid: number }[]): void {
    //获取点击跳转，SF异步Func数据
    let result1 = (): Array<unknown> => {
      let promises: unknown[] = [];
      sfAsyncFuncMap.forEach(async (item: { name: string[]; pid: number, tid: number | undefined }) => {
        let res = await getSfDetails(item.name, item.pid, item.tid, val.param.leftNs, val.param.rightNs);
        if (res !== undefined && res.length > 0) {
          promises.push(...res);
        }
      });
      return promises;
    };

    //获取点击跳转，GH异步Func数据
    let result2 = (): unknown => {
      let promises: unknown[] = [];
      ghAsyncFunc.forEach(async (item: { pid: number; threadName: string }) => {
        let res = await getGhDetails(val.param.name!, item.threadName, item.pid, val.param.leftNs, val.param.rightNs);
        if (res !== undefined && res.length > 0) {
          promises.push(...res);
        }
      });
      return promises;
    };

    //获取同步Func数据，同步Func数据
    let result3 = async (): Promise<unknown> => {
      let promises: unknown[] = [];
      let res = await getTabDetails(val.param.name!, val.param.processId, val.param.threadId, val.param.leftNs, val.param.rightNs);
      if (res !== undefined && res.length > 0) {
        promises.push(...res);
      }
      return promises;
    };
    this.sliceChildTbl!.loading = true;
    Promise.all([result1(), result2(), result3()]).then(async res => {
      this.sliceChildTbl!.loading = false;
      let result: unknown = (res[0] || []).concat(res[1] || []).concat(res[2] || []);
      this.sliceChildTbl!.loading = false;
      // @ts-ignore
      if (result.length !== null && result.length > 0) {
        let funcIdArr: Array<number> = [];
        let minStartTS = Infinity;
        let maxEndTS = -Infinity;
        // @ts-ignore
        let parentDetail: [{ 
          startTS: number, 
          endTS: number, 
          depth: number, 
          id: number, 
          name: string 
        }] = await getParentDetail(
          val.param.processId, 
          val.param.threadId, 
          val.param.leftNs, 
          val.param.rightNs
        );
        // @ts-ignore
        parentDetail.forEach(item => {
          funcIdArr.push(item.id);
          if (item.depth === 0) {
            if (item.startTS < minStartTS) {
              minStartTS = item.startTS;
            }
            if (item.endTS > maxEndTS) {
              maxEndTS = item.endTS;
            }
          }
        });

        let FuncChildrenList = await getFuncChildren(funcIdArr, val.param.processId, val.param.threadId, minStartTS, maxEndTS, true);
        let childDurMap = new Map<number, number>();
        FuncChildrenList.forEach((it: unknown) => {// @ts-ignore
          if (!childDurMap.has(it.parentId)) {// @ts-ignore
            childDurMap.set(it.parentId, it.duration);
          } else {// @ts-ignore
            let dur = childDurMap.get(it.parentId); // @ts-ignore
            dur += it.duration; // @ts-ignore
            childDurMap.set(it.parentId, dur!);
          }
        });
        // @ts-ignore
        result.map((e: unknown) => {
          // @ts-ignore
          e.selfTime = childDurMap.has(e.id) ? (e.duration - childDurMap.get(e.id)) / 1000000 : e.duration / 1000000;
          // @ts-ignore
          e.startTime = Utils.getTimeString(e.startNs);
          // @ts-ignore
          e.absoluteTime = ((window as unknown).recordStartNS + e.startNs) / 1000000000;
          // @ts-ignore
          e.duration = e.duration / 1000000;
          // @ts-ignore
          e.state = Utils.getEndState(e.state)!;
          // @ts-ignore
          e.processName = `${e.process === undefined || e.process === null ? 'process' : e.process}[${e.processId}]`;
          // @ts-ignore
          e.threadName = `${e.thread === undefined || e.thread === null ? 'thread' : e.thread}[${e.threadId}]`;
        });
        // @ts-ignore
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
        };
      }
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
            <lit-table-column order width="1fr" data-index="selfTime" key="selfTime" title="selfTime(ms)" align="flex-start">
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
    if (detail.key === 'startTime' || detail.key === 'processName' || detail.key === 'threadName' ||//@ts-ignore
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
