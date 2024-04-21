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
import { SelectionParam } from '../../../../bean/BoxSelection';
import { NativeHookMalloc, NativeHookStatisticsTableData } from '../../../../bean/NativeHook';
import { Utils } from '../../base/Utils';
import { SpSystemTrace } from '../../../SpSystemTrace';
import '../TabProgressBar';
import { SpNativeMemoryChart } from '../../../chart/SpNativeMemoryChart';
import { resizeObserver } from '../SheetUtils';
import { TabPaneNMSampleList } from './TabPaneNMSampleList';
import {
  queryNativeHookStatistics,
  queryNativeHookStatisticsMalloc,
  queryNativeHookStatisticsSubType,
} from '../../../../database/sql/NativeHook.sql';

@element('tabpane-native-statistics')
export class TabPaneNMStatstics extends BaseElement {
  private nativeStatisticsTbl: LitTable | null | undefined;
  private nativeStatisticsSource: Array<NativeHookStatisticsTableData> = [];
  private nativeType: Array<string> = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'];
  private allMax: number = 0;
  private sortColumn: string = '';
  private sortType: number = 0;
  private currentSelection: SelectionParam | undefined;
  private currentSelectIPid = 1;

  set data(nativeStatisticsParam: SelectionParam) {
    if (nativeStatisticsParam === this.currentSelection) {
      return;
    }
    this.currentSelectIPid = nativeStatisticsParam.nativeMemoryCurrentIPid;
    this.currentSelection = nativeStatisticsParam;
    this.allMax = 0;
    TabPaneNMSampleList.clearData();
    SpNativeMemoryChart.EVENT_HEAP.map((heap) => {
      this.allMax += heap.sumHeapSize;
    });
    if (nativeStatisticsParam.nativeMemory.length > 0) {
      Utils.getInstance().setCurrentSelectIPid(this.currentSelectIPid);
      Utils.getInstance().initResponseTypeList(nativeStatisticsParam);
    }
    if (this.nativeStatisticsTbl) {
      // @ts-ignore
      this.nativeStatisticsTbl.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 25
      }px`;
      // @ts-ignore
      this.nativeStatisticsTbl.recycleDataSource = [];
    }
    this.nativeStatisticsTbl!.loading = true;
    this.queryData(nativeStatisticsParam);
  }

  queryData(nativeStatisticsParam: SelectionParam): void {
    Promise.all([
      queryNativeHookStatistics(nativeStatisticsParam.leftNs, nativeStatisticsParam.rightNs, this.currentSelectIPid),
      queryNativeHookStatisticsSubType(
        nativeStatisticsParam.leftNs,
        nativeStatisticsParam.rightNs,
        this.currentSelectIPid
      ),
      queryNativeHookStatisticsMalloc(
        nativeStatisticsParam.leftNs,
        nativeStatisticsParam.rightNs,
        this.currentSelectIPid
      ),
    ]).then((values) => {
      this.nativeStatisticsTbl!.loading = false;
      let arr: Array<NativeHookStatisticsTableData> = [];
      let index1 = nativeStatisticsParam.nativeMemory.indexOf(this.nativeType[0]);
      let index2 = nativeStatisticsParam.nativeMemory.indexOf(this.nativeType[1]);
      let index3 = nativeStatisticsParam.nativeMemory.indexOf(this.nativeType[2]);
      this.setMemoryTypeData(nativeStatisticsParam, values[0], arr);
      if (index1 !== -1 || index3 !== -1) {
        this.setSubTypeTableData(values[1], arr);
      }
      let type = 0;
      if (index1 !== -1 || (index2 !== -1 && index3 !== -1)) {
        type = 0;
      } else {
        type = index2 !== -1 ? 1 : 2;
      }
      this.setMallocTableData(values[2], arr, type);
      this.nativeStatisticsSource = arr;
      this.sortByColumn(this.sortColumn, this.sortType);
    });
  }

  setMallocTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>, type: number): void {
    result.map((malloc) => {
      let data = new NativeHookStatisticsTableData();
      if (malloc.eventType === 'AllocEvent') {
        data.memoryTap = `Malloc ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else {
        data.memoryTap = `Mmap ${Utils.getByteWithUnit(malloc.heapSize)}`;
      }
      data.existing = malloc.allocByte - malloc.freeByte;
      data.allocCount = malloc.allocCount - malloc.freeCount;
      data.freeCount = malloc.freeCount;
      data.freeByte = malloc.freeByte;
      data.totalBytes = malloc.allocByte;
      data.totalCount = malloc.allocCount;
      data.max = malloc.heapSize;
      data.existingString = Utils.getByteWithUnit(data.existing);
      data.freeByteString = Utils.getByteWithUnit(malloc.freeByte);
      data.totalBytesString = Utils.getByteWithUnit(data.totalBytes);
      data.maxStr = Utils.getByteWithUnit(malloc.heapSize);
      data.existingValue = [data.existing, data.totalBytes, this.allMax];
      if (type === 0) {
        arr.push(data);
      } else if (type === 1 && malloc.eventType === 'AllocEvent') {
        arr.push(data);
      } else if (type === 2 && malloc.eventType === 'MmapEvent') {
        arr.push(data);
      } else {
      }
    });
  }

  setSubTypeTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>): void {
    result.map((sub) => {
      let subType = SpSystemTrace.DATA_DICT.get(sub.subTypeId);
      if (subType !== null && subType !== undefined) {
        let data = new NativeHookStatisticsTableData();
        data.memoryTap = subType;
        data.existing = sub.allocByte - sub.freeByte;
        data.allocCount = sub.allocCount - sub.freeCount;
        data.freeCount = sub.freeCount;
        data.freeByte = sub.freeByte;
        data.totalBytes = sub.allocByte;
        data.totalCount = sub.allocCount;
        data.max = sub.max;
        data.freeByteString = Utils.getByteWithUnit(sub.freeByte);
        data.existingString = Utils.getByteWithUnit(data.existing);
        data.totalBytesString = Utils.getByteWithUnit(data.totalBytes);
        data.maxStr = Utils.getByteWithUnit(sub.max);
        data.existingValue = [data.existing, data.totalBytes, this.allMax];
        arr.push(data);
      }
    });
  }

  setMemoryTypeData(
    val: SelectionParam,
    result: Array<NativeHookMalloc>,
    arr: Array<NativeHookStatisticsTableData>
  ): void {
    let all: NativeHookStatisticsTableData | null = null;
    let heap: NativeHookStatisticsTableData | null = null;
    let anonymous: NativeHookStatisticsTableData | null = null;
    if (val.nativeMemory.indexOf(this.nativeType[0]) !== -1) {
      all = new NativeHookStatisticsTableData();
      all.memoryTap = this.nativeType[0];
    }
    if (val.nativeMemory.indexOf(this.nativeType[1]) !== -1) {
      heap = new NativeHookStatisticsTableData();
      heap.memoryTap = this.nativeType[1];
    }
    if (val.nativeMemory.indexOf(this.nativeType[2]) !== -1) {
      anonymous = new NativeHookStatisticsTableData();
      anonymous.memoryTap = this.nativeType[2];
    }
    for (let hook of result) {
      if (all !== null) {
        this.processHookData(hook, all);
      }
      if (heap !== null && hook.eventType === 'AllocEvent') {
        this.processHookData(hook, heap);
      }
      if (anonymous !== null && hook.eventType === 'MmapEvent') {
        this.processHookData(hook, anonymous);
      }
    }
    if (all !== null) {
      this.updateHookData(all, arr);
    }
    if (heap !== null) {
      this.updateHookData(heap, arr);
    }
    if (anonymous !== null) {
      this.updateHookData(anonymous, arr);
    }
  }

  private processHookData(hook: unknown, data: NativeHookStatisticsTableData): void {
    // @ts-ignore
    data.totalBytes += hook.allocByte;
    // @ts-ignore
    data.totalCount += hook.allocCount;
    // @ts-ignore
    data.freeByte += hook.freeByte;
    // @ts-ignore
    data.freeCount += hook.freeCount; // @ts-ignore
    if (hook.max > data.max) {
      // @ts-ignore
      data.max = hook.max;
      data.maxStr = Utils.getByteWithUnit(data.max);
    }
  }

  private updateHookData(data: NativeHookStatisticsTableData, arr: Array<NativeHookStatisticsTableData>): void {
    data.existing = data.totalBytes - data.freeByte;
    data.allocCount = data.totalCount - data.freeCount;
    data.existingString = Utils.getByteWithUnit(data.existing);
    data.totalBytesString = Utils.getByteWithUnit(data.totalBytes);
    data.freeByteString = Utils.getByteWithUnit(data.freeByte);
    data.existingValue = [data.existing, data.totalBytes, this.allMax];
    arr.push(data);
  }

  initElements(): void {
    this.nativeStatisticsTbl = this.shadowRoot?.querySelector<LitTable>('#tb-native-statstics');
    this.nativeStatisticsTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail.key, evt.detail.sort);
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('existingString', (value) => {
      // @ts-ignore
      return `${value.existing}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('freeByteString', (value) => {
      // @ts-ignore
      return `${value.totalBytes - value.existing}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('totalBytesString', (value) => {
      // @ts-ignore
      return `${value.totalBytes}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('maxStr', (value) => {
      // @ts-ignore
      return `${value.max}`;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.nativeStatisticsTbl!, 25);
  }

  sortByColumn(nmStatColumn: string, nmStatSort: number): void {
    this.sortColumn = nmStatColumn;
    this.sortType = nmStatSort;
    if (nmStatSort === 0) {
      this.nativeStatisticsTbl!.recycleDataSource = this.nativeStatisticsSource;
    } else {
      let arr = [...this.nativeStatisticsSource];
      let compareFunction = (
        nativeStatisticsLeftData: unknown,
        nativeStatisticsRightData: unknown,
        column: string,
        sortType: number
      ): number => {
        if (sortType === 1) {
          // @ts-ignore
          return nativeStatisticsLeftData[column] - nativeStatisticsRightData[column];
        } else {
          // @ts-ignore
          return nativeStatisticsRightData[column] - nativeStatisticsLeftData[column];
        }
      };

      let columnMap: { [key: string]: string } = {
        existingString: 'existing',
        allocCount: 'allocCount',
        freeByteString: 'totalBytes',
        freeCount: 'freeCount',
        totalBytesString: 'totalBytes',
        maxStr: 'max',
        totalCount: 'totalCount',
      };
      let sortColumnKey = columnMap[nmStatColumn];
      this.nativeStatisticsTbl!.recycleDataSource = arr.sort((leftData, rightData) =>
        compareFunction(leftData, rightData, sortColumnKey, nmStatSort)
      );
    }
  }

  initHtml(): string {
    return `
<style>
.nm-stat-tbl {
    height: auto
}
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 10px;
}
</style>
<lit-table id="tb-native-statstics" class="nm-stat-tbl">
    <lit-table-column class="nm-stat-column" width="25%" title="Memory Type" 
    data-index="memoryTap" key="memoryTap"  align="flex-start"></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="Existing" 
    data-index="existingString" key="existingString"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="# Existing" 
    data-index="allocCount" key="allocCount"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="Transient" 
    data-index="freeByteString" key="freeByteString"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="# Transient" 
    data-index="freeCount" key="freeCount"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="Total Bytes" 
    data-index="totalBytesString" key="totalBytesString"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="# Total" 
    data-index="totalCount" key="totalCount"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="1fr" title="Peak Value" 
    data-index="maxStr" key="maxStr"  align="flex-start" order></lit-table-column>
    <lit-table-column class="nm-stat-column" width="160px" title="Existing / Total" 
    data-index="existingValue" key="existingValue"  align="flex-start" >
    <template><tab-progress-bar data="{{existingValue}}"></tab-progress-bar></template>
    </lit-table-column>
</lit-table>
        `;
  }
}
