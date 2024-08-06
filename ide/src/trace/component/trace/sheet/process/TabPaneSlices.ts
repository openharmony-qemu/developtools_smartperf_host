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
import { SpSystemTrace } from '../../../SpSystemTrace';
import { TraceRow } from '../../base/TraceRow';
import { LitSearch } from '../../search/Search';
import { resizeObserver } from '../SheetUtils';
import { getTabSlicesAsyncFunc, getTabSlicesAsyncCatFunc } from '../../../../database/sql/Func.sql';
import { getTabSlices } from '../../../../database/sql/ProcessThread.sql';
import { FuncStruct } from '../../../../database/ui-worker/ProcedureWorkerFunc';
import { Utils } from '../../base/Utils';

@element('tabpane-slices')
export class TabPaneSlices extends BaseElement {
  private slicesTbl: LitTable | null | undefined;
  private slicesRange: HTMLLabelElement | null | undefined;
  private slicesSource: Array<SelectionData> = [];
  private currentSelectionParam: SelectionParam | undefined;
  private sliceSearchCount: Element | undefined | null;

  set data(slicesParam: SelectionParam | unknown) {
    if (this.currentSelectionParam === slicesParam) {
      return;
    } //@ts-ignore
    this.currentSelectionParam = slicesParam;
    this.slicesRange!.textContent = `Selected range: ${parseFloat(
      //@ts-ignore
      ((slicesParam.rightNs - slicesParam.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    let asyncNames: Array<string> = [];
    let asyncPid: Array<number> = []; //@ts-ignore
    slicesParam.funAsync.forEach((it: unknown) => {
      //@ts-ignore
      asyncNames.push(it.name); //@ts-ignore
      asyncPid.push(it.pid);
    });
    let asyncCatNames: Array<string> = [];
    let asyncCatPid: Array<number> = [];//@ts-ignore
    slicesParam.funCatAsync.forEach((it: unknown) => { //@ts-ignore  
      asyncCatNames.push(it.threadName);//@ts-ignore
      asyncCatPid.push(it.pid);
    });
    this.slicesTbl!.loading = true;
    let filterNameEL: HTMLInputElement | undefined | null =
      this.shadowRoot?.querySelector<HTMLInputElement>('#filterName');
    filterNameEL?.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    //@ts-ignore
    getTabSlicesAsyncFunc(asyncNames, asyncPid, slicesParam.leftNs, slicesParam.rightNs).then((res) => {//@ts-ignore
      getTabSlicesAsyncCatFunc(asyncCatNames, asyncCatPid, slicesParam.leftNs, slicesParam.rightNs).then((res1) => {
        //@ts-ignore
        getTabSlices(slicesParam.funTids, slicesParam.processIds, slicesParam.leftNs, slicesParam.rightNs).then(
          (res2) => {
            this.slicesTbl!.loading = false;
            let processSlicesResult = (res || []).concat(res1 || []).concat(res2 || []);
            if (processSlicesResult !== null && processSlicesResult.length > 0) {
              let sumWall = 0.0;
              let sumOcc = 0;
              for (let processSliceItem of processSlicesResult) {
                //@ts-ignore
                processSliceItem.name = processSliceItem.name === null ? '' : processSliceItem.name;
                //@ts-ignore
                processSliceItem.tabTitle = processSliceItem.name;
                //@ts-ignore
                sumWall += processSliceItem.wallDuration;
                //@ts-ignore
                sumOcc += processSliceItem.occurrences;
                //@ts-ignore
                processSliceItem.wallDuration = parseFloat((processSliceItem.wallDuration / 1000000.0).toFixed(5));
                //@ts-ignore
                processSliceItem.avgDuration = parseFloat((processSliceItem.avgDuration / 1000000.0).toFixed(5));
                //@ts-ignore
                processSliceItem.asyncNames = asyncNames;
                //@ts-ignore
                processSliceItem.asyncCatNames = asyncCatNames;
              }
              let count = new SelectionData();
              count.process = ' ';
              count.wallDuration = parseFloat((sumWall / 1000000.0).toFixed(5));
              count.occurrences = sumOcc;
              count.tabTitle = 'Summary';//@ts-ignore
              count.allName = processSlicesResult.map((item: unknown) => item.name);
              count.asyncNames = asyncNames;
              count.asyncCatNames = asyncCatNames;
              processSlicesResult.splice(0, 0, count); //@ts-ignore
              this.slicesSource = processSlicesResult;
              this.slicesTbl!.recycleDataSource = processSlicesResult;
              this.sliceSearchCount!.textContent = this.slicesSource.length - 1 + '';
              if (filterNameEL && filterNameEL.value.trim() !== '') {
                this.findName(filterNameEL.value);
              }
            } else {
              this.slicesSource = [];
              this.slicesTbl!.recycleDataSource = this.slicesSource;
              this.sliceSearchCount!.textContent = '0';
            }
          }
        );
      });
    });
  }

  initElements(): void {
    this.sliceSearchCount = this.shadowRoot?.querySelector<LitTable>('#search-count');
    this.slicesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-slices');
    this.slicesRange = this.shadowRoot?.querySelector('#time-range');
    let slicesInput = this.shadowRoot?.querySelector('#filterName');
    let spApplication = document.querySelector('body > sp-application');
    let spSystemTrace = spApplication?.shadowRoot?.querySelector(
      'div > div.content > sp-system-trace'
    ) as SpSystemTrace;
    this.slicesTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    // @ts-ignore
    let data;
    this.slicesTbl!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      data = evt.detail.data;
    });
    this.slicesTbl!.addEventListener('click', () => {
      FuncStruct.funcSelect = false;
      // @ts-ignore
      data && this.orgnazitionData(data);
    });
    this.slicesTbl!.addEventListener('contextmenu', () => {
      FuncStruct.funcSelect = true;
      // @ts-ignore
      data && this.orgnazitionData(data);
    });
    slicesInput?.addEventListener('input', (e) => {
      // @ts-ignore
      this.findName(e.target.value);
    });
    slicesInput?.addEventListener('focus', (e) => {
      spSystemTrace.focusTarget = 'slicesInput';
    });
    slicesInput?.addEventListener('blur', (e) => {
      spSystemTrace.focusTarget = '';
    });
  }
  async orgnazitionData(data: Object): Promise<void> {
    let spApplication = document.querySelector('body > sp-application');
    let spSystemTrace = spApplication?.shadowRoot?.querySelector(
      'div > div.content > sp-system-trace'
    ) as SpSystemTrace;
    let search = spApplication!.shadowRoot?.querySelector('#lit-search') as LitSearch;
    spSystemTrace?.visibleRows.forEach((it) => {
      it.highlight = false;
      it.draw();
    });
    spSystemTrace?.timerShaftEL?.removeTriangle('inverted');
    // @ts-ignore
    let asyncFuncArr = spSystemTrace!.seachAsyncFunc(data.name);
    // @ts-ignore
    await spSystemTrace!.searchFunction([], asyncFuncArr, data.name).then((mixedResults) => {
      if (mixedResults && mixedResults.length === 0) {
        return;
      }
      // @ts-ignore
      search.list = mixedResults.filter((item) => item.funName === data.name); //@ts-ignore
      const sliceRowList: Array<TraceRow<unknown>> = [];
      // 框选的slice泳道
      for (let row of spSystemTrace.rangeSelect.rangeTraceRow!) {
        if (row.rowType === 'func') {
          sliceRowList.push(row);
        }
        if (row.childrenList) {
          for (const childrenRow of row.childrenList) {
            if (childrenRow.rowType === 'func') {
              sliceRowList.push(childrenRow);
            }
          }
        }
      }
      if (sliceRowList.length === 0) {
        return;
      }
      this.slicesTblFreshSearchSelect(search, sliceRowList, data, spSystemTrace);
    });
  }

  private slicesTblFreshSearchSelect(
    search: LitSearch, //@ts-ignore
    sliceRowList: Array<TraceRow<unknown>>,
    data: unknown,
    spSystemTrace: SpSystemTrace
  ): void {
    let input = search.shadowRoot?.querySelector('input') as HTMLInputElement;
    let rangeSelectList: Array<unknown> = []; // 框选范围的数据
    // search 到的内容与框选泳道的内容取并集
    for (const searchItem of search.list) {
      for (const traceRow of sliceRowList) {
        if (
          // @ts-ignore
          Math.max(TraceRow.rangeSelectObject?.startNS!, searchItem.startTime) <=
          // @ts-ignore
          Math.min(TraceRow.rangeSelectObject?.endNS!, searchItem.startTime + searchItem.dur) &&
          !rangeSelectList.includes(searchItem)
        ) {
          // 异步调用栈
          if (traceRow.asyncFuncName) {
            if (
              // @ts-ignore
              `${searchItem.pid}` === `${traceRow.asyncFuncNamePID}` &&
              traceRow.traceId === Utils.currentSelectTrace
            ) {
              rangeSelectList.push(searchItem);
            }
          } else {
            // 线程调用栈
            // @ts-ignore
            if (Utils.getDistributedRowId(searchItem.tid) === traceRow.rowId) {
              rangeSelectList.push(searchItem);
            }
          }
        }
      }
    }

    if (rangeSelectList.length === 0) {
      return;
    } //@ts-ignore
    input.value = data.name;
    //@ts-ignore
    search.currenSearchValue = data.name;
    search.list = rangeSelectList;
    search.total = search.list.length;
    search.index = spSystemTrace!.showStruct(false, -1, search.list);
    search.isClearValue = true;
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.slicesTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .slice-label{
            height: 20px;
        }
        :host{
            display: flex;
            padding: 10px 10px;
            flex-direction: column;
        }
        #filterName:focus{
          outline: none;
        }
        </style>
        <div style="display:flex; justify-content:space-between;">
        <div style="width: 40%;">
          <input id="filterName" type="text" style="width:60%;height:18px;border:1px solid #c3c3c3;border-radius:9px" placeholder="Search" value="" />
          &nbsp;&nbsp;<span style="font-size: 10pt;margin-bottom: 5px">Count:&nbsp;<span id="search-count">0<span></span>
        </div>
        <label id="time-range" class="slice-label" style="text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        </div>
        <lit-table id="tb-slices" style="height: auto">
            <lit-table-column class="slices-column" title="Name" width="500px" data-index="name" 
            key="name"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="slices-column" title="Wall duration(ms)" width="1fr" data-index="wallDuration" 
            key="wallDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="slices-column" title="Avg Wall duration(ms)" width="1fr" data-index="avgDuration" 
            key="avgDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column class="slices-column" title="Occurrences" width="1fr" data-index="occurrences" 
            key="occurrences"  align="flex-start" order tdJump>
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(slicesDetail: unknown): void {
    // @ts-ignore
    function compare(property, slicesSort, type) {
      return function (slicesLeftData: SelectionData, slicesRightData: SelectionData) {
        if (slicesLeftData.process === ' ' || slicesRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          // @ts-ignore
          return slicesSort === 2
            ? // @ts-ignore
            parseFloat(slicesRightData[property]) - parseFloat(slicesLeftData[property])
            : // @ts-ignore
            parseFloat(slicesLeftData[property]) - parseFloat(slicesRightData[property]);
        } else {
          // @ts-ignore
          if (slicesRightData[property] > slicesLeftData[property]) {
            return slicesSort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (slicesRightData[property] === slicesLeftData[property]) {
              return 0;
            } else {
              return slicesSort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    // 拷贝当前表格显示的数据
    let sortData: Array<SelectionData> = JSON.parse(JSON.stringify(this.slicesTbl!.recycleDataSource));
    // 取出汇总数据，同时将排序数据去掉汇总数据进行后续排序
    let headData: SelectionData = sortData.splice(0, 1)[0];
    //@ts-ignore
    if (slicesDetail.key === 'name') {
      //@ts-ignore
      sortData.sort(compare(slicesDetail.key, slicesDetail.sort, 'string'));
    } else {
      //@ts-ignore
      sortData.sort(compare(slicesDetail.key, slicesDetail.sort, 'number'));
    }
    // 排序完成后将汇总数据插入到头部
    sortData.unshift(headData);
    this.slicesTbl!.recycleDataSource = sortData;
    this.sliceSearchCount!.textContent = sortData.length - 1 + '';
  }

  findName(str: string): void {
    let searchData: Array<SelectionData> = [];
    let sumWallDuration: number = 0;
    let sumOccurrences: number = 0;
    let nameSet: Array<string> = [];
    if (str === '') {
      this.slicesTbl!.recycleDataSource = this.slicesSource;
      this.sliceSearchCount!.textContent = this.slicesSource.length - 1 + '';
    } else {
      this.slicesSource.forEach((item) => {
        if (item.name.toLowerCase().indexOf(str.toLowerCase()) !== -1) {
          searchData.push(item);
          nameSet.push(item.name);
          sumWallDuration += item.wallDuration;
          sumOccurrences += item.occurrences;
        }
      });
      let count: SelectionData = new SelectionData();
      count.process = '';
      count.name = '';
      count.allName = nameSet;
      count.tabTitle = 'Summary';
      count.wallDuration = Number(sumWallDuration.toFixed(3));
      count.occurrences = sumOccurrences;
      searchData.unshift(count);
      this.slicesTbl!.recycleDataSource = searchData;
      this.sliceSearchCount!.textContent = searchData.length - 1 + '';
    }
  }
}
