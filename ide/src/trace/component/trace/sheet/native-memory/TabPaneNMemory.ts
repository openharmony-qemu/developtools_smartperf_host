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
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { type LitPageTable } from '../../../../../base-ui/table/LitPageTable';
import '../../../../../base-ui/table/LitPageTable';
import '../../../../../base-ui/slicer/lit-slicer';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { type NativeMemory, NativeHookCallInfo } from '../../../../bean/NativeHook';
import '../TabPaneFilter';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { TabPaneNMSampleList } from './TabPaneNMSampleList';
import { type LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { procedurePool } from '../../../../database/Procedure';
import {
  formatRealDateMs,
  getByteWithUnit,
  getTimeString,
} from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { SpNativeMemoryChart } from '../../../chart/SpNativeMemoryChart';
import { Utils } from '../../base/Utils';
import { TabPaneNMemoryHtml } from './TabPaneNMemory.html';

@element('tabpane-native-memory')
export class TabPaneNMemory extends BaseElement {
  private defaultNativeTypes = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'];
  private memoryTbl: LitPageTable | null | undefined;
  private filter: TabPaneFilter | null | undefined;
  private tblData: LitTable | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private nmMemoryLoadingList: number[] = [];
  private loadingPage: any;
  private memorySource: Array<any> = [];
  private nativeType: Array<string> = [...this.defaultNativeTypes];
  private statsticsSelection: Array<any> = [];
  private filterAllocationType: string = '0';
  private filterNativeType: string = '0';
  private filterResponseType: number = -1;
  private filterResponseSelect: string = '0';
  private currentSelection: SelectionParam | undefined;
  private rowSelectData: any = undefined;
  private sortColumn: string = '';
  private sortType: number = 0;
  private responseTypes: any[] = [];
  private eventTypes: string[] = [];

  set data(memoryParam: SelectionParam | any) {
    if (memoryParam === this.currentSelection) {
      return;
    }
    this.currentSelection = memoryParam;
    this.queryData(memoryParam);
  }

  queryData(memoryParam: SelectionParam | any): void {
    this.eventTypes = [];
    if (memoryParam.nativeMemory.indexOf(this.defaultNativeTypes[0]) !== -1) {
      this.eventTypes.push("'AllocEvent'");
      this.eventTypes.push("'MmapEvent'");
    } else {
      if (memoryParam.nativeMemory.indexOf(this.defaultNativeTypes[1]) !== -1) {
        this.eventTypes.push("'AllocEvent'");
      }
      if (memoryParam.nativeMemory.indexOf(this.defaultNativeTypes[2]) !== -1) {
        this.eventTypes.push("'MmapEvent'");
      }
    }
    TabPaneNMSampleList.serSelection(memoryParam);
    if (this.memoryTbl) {
      // @ts-ignore
      this.memoryTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement.clientHeight - 20 - 31}px`;
      // @ts-ignore
      this.tblData.shadowRoot.querySelector('.table').style.height = `${this.parentElement.clientHeight - 20 - 31}px`;
      // @ts-ignore
      this.tblData.recycleDataSource = [];
      // @ts-ignore
      this.memoryTbl.recycleDataSource = [];
    }
    this.resetFilter();
    this.getDataByNativeMemoryWorker(memoryParam, true);
  }

  getDataByNativeMemoryWorker(val: SelectionParam | any, refresh = false): void {
    let args = new Map<string, any>();
    args.set('filterAllocType', this.filterAllocationType);
    args.set('filterEventType', this.filterNativeType);
    args.set('filterResponseType', this.filterResponseType);
    args.set('leftNs', val.leftNs);
    args.set('rightNs', val.rightNs);
    args.set('types', this.eventTypes);
    args.set('refresh', refresh);
    let selections: Array<any> = [];
    if (this.statsticsSelection.length > 0) {
      this.statsticsSelection.map((memory) => {
        selections.push({
          memoryTap: memory.memoryTap,
          max: memory.max,
        });
      });
    }
    args.set('statisticsSelection', selections);
    args.set('sortColumn', this.sortColumn);
    args.set('sortType', this.sortType);
    this.memorySource = [];
    if (this.memoryTbl!.recycleDs.length > 1_0000) {
      this.memoryTbl!.recycleDataSource = [];
    }
    this.startNmMemoryWorker('native-memory-queryNativeHookEvent', args, (results: any[]) => {
      this.tblData!.recycleDataSource = [];
      if (refresh) {
        this.setNmMemoryLoading(true);
        this.initFilterTypes(() => this.setNmMemoryLoading(false));
      }
      if (results.length > 0) {
        this.memorySource = results;
        this.memoryTbl!.recycleDataSource = this.memorySource;
      } else {
        this.memorySource = [];
        this.memoryTbl!.recycleDataSource = [];
      }
    });
  }

  startNmMemoryWorker(type: string, args: any, handler: Function): void {
    this.setNmMemoryLoading(true);
    procedurePool.submitWithName('logic0', type, args, undefined, (res: any) => {
      if (Array.isArray(res) || (res.tag === 'end' && res.index === 0)) {
        handler(res.data ? res.data : res);
        this.setNmMemoryLoading(false);
      } else {
        this.memorySource.push(res.data);
        if (res.tag === 'end') {
          handler(this.memorySource);
          this.setNmMemoryLoading(false);
        }
      }
    });
  }

  setNmMemoryLoading(loading: boolean): void {
    if (loading) {
      this.nmMemoryLoadingList.push(1);
      this.progressEL!.loading = true;
      this.loadingPage.style.visibility = 'visible';
    } else {
      this.nmMemoryLoadingList.splice(0, 1);
      if (this.nmMemoryLoadingList.length === 0) {
        this.progressEL!.loading = false;
        this.loadingPage.style.visibility = 'hidden';
      }
    }
  }

  fromStastics(val: SelectionParam | any): void {
    let nmFilterEl = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    if (this.currentSelection != val) {
      this.initFilterTypes(() => {
        this.currentSelection = val;
        this.filterSetSelectList(nmFilterEl!, typeIndexOf);
        this.filterNativeType = `${typeIndexOf}`;
        this.queryData(val);
      });
    }
    let typeIndexOf = this.nativeType.indexOf(val.statisticsSelectData.memoryTap);
    if (this.statsticsSelection.indexOf(val.statisticsSelectData) === -1 && typeIndexOf === -1) {
      this.statsticsSelection.push(val.statisticsSelectData);
      this.nativeType.push(val.statisticsSelectData.memoryTap);
      typeIndexOf = this.nativeType.length - 1;
    } else {
      let index = this.statsticsSelection.findIndex((mt) => mt.memoryTap === val.statisticsSelectData.memoryTap);
      if (index !== -1) {
        this.statsticsSelection[index] = val.statisticsSelectData;
      }
    }
    if (this.currentSelection === val) {
      this.tblData!.recycleDataSource = [];
      this.rowSelectData = undefined;
      this.filterSetSelectList(nmFilterEl!, typeIndexOf);
      this.filterNativeType = `${typeIndexOf}`;
      //直接将当前数据过滤即可
      this.getDataByNativeMemoryWorker(val);
    }
  }

  private filterSetSelectList(nmFilterEl: TabPaneFilter, typeIndexOf: number): void {
    nmFilterEl!.setSelectList(
      null,
      this.nativeType,
      'Allocation Lifespan',
      'Allocation Type',
      this.responseTypes.map((item: any) => {
        return item.value;
      })
    );
    nmFilterEl!.secondSelect = `${typeIndexOf}`;
    nmFilterEl!.thirdSelect = this.filterResponseSelect;
  }

  initFilterTypes(initCallback?: () => void): void {
    this.nativeType = [...this.defaultNativeTypes];
    this.statsticsSelection = [];
    procedurePool.submitWithName('logic0', 'native-memory-get-responseType', {}, undefined, (res: any) => {
      this.filter!.setSelectList(
        null,
        this.nativeType,
        'Allocation Lifespan',
        'Allocation Type',
        res.map((item: any) => {
          return item.value;
        })
      );
      this.filter!.setFilterModuleSelect('#first-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#second-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#third-select', 'width', '150px');
      this.responseTypes = res;
      this.resetFilter();
      this.rowSelectData = undefined;
      if (initCallback) {
        initCallback();
      }
    });
  }

  resetFilter(): void {
    this.filter!.firstSelect = '0';
    this.filter!.secondSelect = '0';
    this.filter!.thirdSelect = '0';
    this.filterResponseSelect = '0';
    this.filterAllocationType = '0';
    this.filterNativeType = '0';
    this.filterResponseType = -1;
  }

  initElements(): void {
    this.loadingPage = this.shadowRoot?.querySelector('.loading');
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.memoryTbl = this.shadowRoot?.querySelector<LitPageTable>('#tb-native-memory');
    this.tblData = this.shadowRoot?.querySelector<LitTable>('#tb-native-data');
    this.filter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.memoryTbl!.addEventListener('row-click', (e) => {
      // @ts-ignore
      let data = e.detail.data as NativeMemory;
      this.rowSelectData = data;
      this.setRightTableData(data);
      document.dispatchEvent(
        new CustomEvent('triangle-flag', {
          detail: { time: [data.startTs], type: 'triangle' },
        })
      );
    });
    this.memoryTbl!.addEventListener('column-click', (evt: any) => {
      this.sortColumn = evt.detail.key;
      this.sortType = evt.detail.sort;
      this.getDataByNativeMemoryWorker(this.currentSelection);
    });
    this.setItemTextHandleMapByMemoryTbl();
    this.memoryTbl!.exportTextHandleMap.set('heapSize', (value) => {
      return `${value['heapSize']}`;
    });
    this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.getFilterData((data: FilterData) => {
      if (data.mark) {
        this.getFilterDataByMark();
      } else {
        this.filterAllocationType = data.firstSelect || '0';
        this.filterNativeType = data.secondSelect || '0';
        this.filterResponseSelect = data.thirdSelect || '0';
        let thirdIndex = parseInt(data.thirdSelect || '0');
        if (this.responseTypes.length > thirdIndex) {
          this.filterResponseType =
            this.responseTypes[thirdIndex].key === undefined ? -1 : this.responseTypes[thirdIndex].key;
        }
        this.getDataByNativeMemoryWorker(this.currentSelection);
      }
    });
    this.filter!.firstSelect = '1';
  }

  private setItemTextHandleMapByMemoryTbl(): void {
    this.memoryTbl!.itemTextHandleMap.set('startTs', (startTs) => {
      return SpNativeMemoryChart.REAL_TIME_DIF === 0
        ? getTimeString(startTs)
        : formatRealDateMs(startTs + SpNativeMemoryChart.REAL_TIME_DIF);
    });
    this.memoryTbl!.itemTextHandleMap.set('endTs', (endTs) => {
      return endTs > this.currentSelection!.leftNs &&
      endTs <= this.currentSelection!.rightNs &&
      endTs !== 0 &&
      endTs !== null
        ? 'Freed'
        : 'Existing';
    });
    this.memoryTbl!.itemTextHandleMap.set('heapSize', (heapSize) => {
      return getByteWithUnit(heapSize);
    });
  }

  private getFilterDataByMark(): void{
    document.dispatchEvent(
      new CustomEvent('triangle-flag', {
        detail: {
          time: '',
          type: 'square',
          timeCallback: (timeArr: number[]) => {
            if (timeArr && timeArr.length > 0) {
              let checkTs = timeArr[0];
              let minTs = 0;
              let minItem: any = undefined;
              let filterTemp = this.memorySource.filter((tempItem) => {
                if (
                  minTs === 0 ||
                  (tempItem.startTs - checkTs != 0 && Math.abs(tempItem.startTs - checkTs) < minTs)
                ) {
                  minTs = Math.abs(tempItem.startTs - checkTs);
                  minItem = tempItem;
                }
                return tempItem.startTs === checkTs;
              });
              if (filterTemp.length > 0) {
                filterTemp[0].isSelected = true;
              } else {
                if (minItem) {
                  filterTemp.push(minItem);
                  minItem.isSelected = true;
                }
              }
              if (filterTemp.length > 0) {
                this.rowSelectData = filterTemp[0];
                let args = new Map<string, any>();
                args.set('startTs', this.rowSelectData.startTs);
                args.set('actionType', 'native-memory-state-change');
                this.startNmMemoryWorker('native-memory-action', args, (results: any[]) => {});
                TabPaneNMSampleList.addSampleData(
                  this.rowSelectData,
                  this.currentSelection!.nativeMemoryCurrentIPid
                );
                this.memoryTbl!.scrollToData(this.rowSelectData);
              }
            }
          },
        },
      })
    );
  }

  connectedCallback() {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.memoryTbl) {
          // @ts-ignore
          this.memoryTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 31
          }px`;
        }
        this.memoryTbl?.reMeauseHeight();
        if (this.tblData) {
          // @ts-ignore
          this.tblData.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 31
          }px`;
        }
        this.tblData?.reMeauseHeight();
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  setRightTableData(nativeMemoryHook: NativeMemory): void {
    let args = new Map<string, any>();
    args.set('eventId', nativeMemoryHook.eventId);
    args.set('actionType', 'memory-stack');
    this.startNmMemoryWorker('native-memory-action', args, (results: any[]) => {
      let thread = new NativeHookCallInfo();
      thread.threadId = nativeMemoryHook.threadId;
      thread.threadName = Utils.THREAD_MAP.get(thread.threadId) || 'Thread';
      thread.title = `${nativeMemoryHook.threadName ?? ''}【${nativeMemoryHook.threadId}】`;
      thread.type = -1;
      let currentSource = [];
      currentSource.push(thread);
      currentSource.push(...results);
      this.progressEL!.loading = false;
      this.tblData!.dataSource = currentSource;
    });
  }

  initHtml(): string {
    return TabPaneNMemoryHtml;
  }
}
