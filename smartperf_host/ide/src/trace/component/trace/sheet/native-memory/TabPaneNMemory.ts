/*
 * Copyright (C) 2022-2025 Huawei Device Co., Ltd.
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
import { tabPaneNMemoryHtml } from './TabPaneNMemory.html';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { getCurrentTypes, MemoryBasicType, MemoryTraceRowType, MemoryType } from '../../../../bean/MemoryEnum';

@element('tabpane-native-memory')
export class TabPaneNMemory extends BaseElement {
  private defaultTypes = MemoryBasicType.NATIVE_MEMORY;
  private memoryTbl: LitPageTable | null | undefined;
  private filter: TabPaneFilter | null | undefined;
  private tblData: LitTable | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private nmMemoryLoadingList: number[] = [];
  private loadingPage: unknown;
  private memorySource: Array<NativeMemory> = [];
  private nativeType: Array<string> = [...this.defaultTypes];
  private statisticsSelection: Array<unknown> = [];
  private filterAllocationType: string = '0';
  private filterNativeType: string = '0';
  private filterResponseType: number = -1;
  private filterResponseSelect: string = '0';
  private currentSelection: SelectionParam | undefined;
  private rowSelectData?: NativeMemory;
  private sortColumn: string = '';
  private sortType: number = 0;
  private responseTypes: unknown[] = [];
  private eventTypes: string[] = [];
  private systemTrace: SpSystemTrace | undefined | null;
  private memoryType = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;

  set data(memoryParam: SelectionParam) {
    if (memoryParam === this.currentSelection) {
      return;
    }
    this.currentSelection = memoryParam;
    this.queryData(memoryParam);
  }

  queryData(memoryParam: SelectionParam, resetFilter: boolean = true): void {
    this.eventTypes = getCurrentTypes(memoryParam, this.memoryType, false, false) as string[];

    TabPaneNMSampleList.serSelection(memoryParam);
    if (this.memoryTbl) {
      const tableElement = this.memoryTbl!.shadowRoot!.querySelector('.table') as HTMLElement | null;
      if (tableElement) {
        tableElement.style.height = `${this.parentElement!.clientHeight - 20 - 31}px`;
      }
      const tblElement = this.tblData!.shadowRoot!.querySelector('.table') as HTMLElement | null;
      if (tblElement) {
        tblElement.style.height = `${this.parentElement!.clientHeight - 20 - 31}px`;
      }
      this.tblData!.recycleDataSource = [];
      this.memoryTbl.recycleDataSource = [];
    }
    if (resetFilter) {
      this.resetFilter();
      this.setNmMemoryLoading(true);
      this.initFilterTypes(() => {
        this.filterSetSelectList(this.filter!, this.filterNativeType ? parseInt(this.filterNativeType) : 0);
        this.getDataByNativeMemoryWorker(memoryParam, resetFilter);
      });
    } else {
      this.getDataByNativeMemoryWorker(memoryParam, resetFilter);
    }
  }

  getDataByNativeMemoryWorker(val: SelectionParam | unknown, refresh = false): void {
    const filterTypeName = this.typeIndexToTypeName(this.filterNativeType)
    let args = new Map<string, unknown>();
    args.set('filterAllocType', this.filterAllocationType);
    args.set('filterEventType', filterTypeName);
    args.set('filterResponseType', this.filterResponseType); //@ts-ignore
    args.set('leftNs', val.leftNs); //@ts-ignore
    args.set('rightNs', val.rightNs);
    args.set('types', this.eventTypes);
    args.set('refresh', refresh);
    let selections: Array<unknown> = [];
    if (this.statisticsSelection.length > 0) {
      this.statisticsSelection.map((memory) => {
        selections.push({
          //@ts-ignore
          memoryTap: memory.memoryTap, //@ts-ignore
          max: memory.max, //@ts-ignore
          eventType: memory.eventType
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
    this.startNmMemoryWorker(`${this.memoryType}-queryNativeHookEvent`, args, (results: NativeMemory[]) => {
      this.tblData!.recycleDataSource = [];
      this.setNmMemoryLoading(false);
      if (results.length > 0) {
        let isTwoArray: boolean = results.some(item => {
          return Array.isArray(item);
        });
        let dataList: NativeMemory[] = [];
        if (isTwoArray) {
          results.forEach(v => {
            dataList = dataList.concat(v);
          });
        } else {
          dataList = results;
        }
        dataList.forEach((item) => {
          let tmpNumber = item.addr.split('x');
          item.addr = '0x' + Number(tmpNumber[1]).toString(16);
        });
        this.memorySource = results;
        this.memoryTbl!.recycleDataSource = this.memorySource;
      } else {
        this.memorySource = [];
        this.memoryTbl!.recycleDataSource = [];
      }
    });
  }

  private typeIndexToTypeName(typeIndex?: string | null): string {
    if (typeIndex) {
      return this.nativeType[parseInt(typeIndex)];
    } else {
      return this.defaultTypes[0];
    }
  }

  startNmMemoryWorker(type: string, args: unknown, handler: Function): void {
    this.setNmMemoryLoading(true);
    procedurePool.submitWithName('logic0', type, args, undefined, (res: unknown) => {
      //@ts-ignore
      if (Array.isArray(res) || (res.tag === 'end' && res.index === 0)) {
        //@ts-ignore
        handler(res.data ? res.data : res);
        this.setNmMemoryLoading(false);
      } else {
        //@ts-ignore
        this.memorySource.push(res.data); //@ts-ignore
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
      this.progressEL!.loading = true; //@ts-ignore
      this.loadingPage.style.visibility = 'visible';
    } else {
      this.nmMemoryLoadingList.splice(0, 1);
      if (this.nmMemoryLoadingList.length === 0) {
        this.progressEL!.loading = false; //@ts-ignore
        this.loadingPage.style.visibility = 'hidden';
      }
    }
  }

  fromStastics(val: SelectionParam): void {
    let nmFilterEl = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    if (this.currentSelection !== val) {
      this.resetFilter();
      this.initFilterTypes(() => {
        //@ts-ignore
        this.currentSelection = val;
        let typeIndexOf = this.setFilterNativeTypeSelection(this.currentSelection!);
        this.filterSetSelectList(nmFilterEl!, typeIndexOf);
        this.filterNativeType = `${typeIndexOf}`;
        this.rowSelectData = undefined;
        this.queryData(val, true);
        this.fromStastics(val);
      });
    } else {
      //@ts-ignore
      let typeIndexOf = this.setFilterNativeTypeSelection(val);
      this.tblData!.recycleDataSource = [];
      this.rowSelectData = undefined;
      this.filterSetSelectList(nmFilterEl!, typeIndexOf);
      this.filterNativeType = `${typeIndexOf}`;
      //直接将当前数据过滤即可
      this.getDataByNativeMemoryWorker(val);
    }
  }

  private setFilterNativeTypeSelection(val: SelectionParam): number {
    let typeIndexOf = -1;
    if (val.statisticsSelectData) {
      // @ts-ignore
      typeIndexOf = this.nativeType.indexOf(val.statisticsSelectData.memoryTap);
      if (this.statisticsSelection.indexOf(val.statisticsSelectData) === -1 && typeIndexOf === -1) {
        this.statisticsSelection.push(val.statisticsSelectData);
        // @ts-ignore
        this.nativeType.push(val.statisticsSelectData.memoryTap);
        typeIndexOf = this.nativeType.length - 1;
      } else {
        // @ts-ignore
        let index = this.statisticsSelection.findIndex((mt) => mt.memoryTap === val.statisticsSelectData.memoryTap);
        if (index !== -1) {
          this.statisticsSelection[index] = val.statisticsSelectData;
        }
      }
    }
    return typeIndexOf;
  }

  private filterSetSelectList(nmFilterEl: TabPaneFilter, typeIndexOf: number): void {
    nmFilterEl!.setSelectList(
      null,
      this.nativeType,
      'Allocation Lifespan',
      'Allocation Type',
      this.responseTypes.map((item: unknown) => {
        //@ts-ignore
        return item.value;
      })
    );
    nmFilterEl!.secondSelect = `${typeIndexOf}`;
    this.filterNativeType = `${typeIndexOf}`;
    nmFilterEl!.thirdSelect = this.filterResponseSelect;
  }

  initFilterTypes(initCallback?: () => void): void {
    this.nativeType = [...this.defaultTypes];
    this.statisticsSelection = [];
    if (this.currentSelection) {
      this.setFilterNativeTypeSelection(this.currentSelection);
    }
    procedurePool.submitWithName('logic0', `${this.memoryType}-get-responseType`, {}, undefined, (res: unknown) => {
      this.filter!.setSelectList(
        null,
        this.nativeType,
        'Allocation Lifespan',
        'Allocation Type', //@ts-ignore
        res.map((item: unknown) => {
          //@ts-ignore
          return item.value;
        })
      );
      this.filter!.setFilterModuleSelect('#first-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#second-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#third-select', 'width', '150px'); //@ts-ignore
      this.responseTypes = res;
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
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.loadingPage = this.shadowRoot?.querySelector('.loading');
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.memoryTbl = this.shadowRoot?.querySelector<LitPageTable>('#tb-native-memory');
    this.tblData = this.shadowRoot?.querySelector<LitTable>('#tb-native-data');
    this.filter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.memoryTbl!.addEventListener('row-click', (e) => {
      // @ts-ignore
      let data = e.detail.data as NativeMemory;
      data.isSelected = true;
      this.rowSelectData = data;
      this.setRightTableData(data);
      // @ts-ignore
      if ((e.detail as unknown).callBack) {
        // @ts-ignore
        (e.detail as unknown).callBack(true);
      }
      let flagList = this.systemTrace?.timerShaftEL!.sportRuler?.flagList || [];
      flagList.forEach((it, i) => {
        if (it.type === 'triangle') {
          flagList.splice(i, 1);
        }
      });

      for (let i = 0; i < flagList!.length; i++) {
        if (flagList[i].time === data.startTs) {
          flagList[i].type = 'triangle';
          flagList[i].selected = true;
        } else {
          flagList[i].type = '';
          flagList[i].selected = false;
        }
      }
      document.dispatchEvent(
        new CustomEvent('triangle-flag', {
          detail: { time: [data.startTs], type: 'triangle' },
        })
      );
    });
    this.memoryTbl!.addEventListener('column-click', (evt: unknown) => {
      //@ts-ignore
      this.sortColumn = evt.detail.key; //@ts-ignore
      this.sortType = evt.detail.sort;
      this.getDataByNativeMemoryWorker(this.currentSelection);
    });
    this.setItemTextHandleMapByMemoryTbl();
    this.memoryTbl!.exportTextHandleMap.set('heapSize', (value) => {
      // @ts-ignore
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
          this.filterResponseType = //@ts-ignore
            this.responseTypes[thirdIndex].key === undefined ? -1 : this.responseTypes[thirdIndex].key;
        }
        this.getDataByNativeMemoryWorker(this.currentSelection);
      }
    });
    this.filter!.firstSelect = '1';
  }

  private setItemTextHandleMapByMemoryTbl(): void {
    this.memoryTbl!.itemTextHandleMap.set('startTs', (startTs) => {
      return SpNativeMemoryChart.REAL_TIME_DIF === 0 // @ts-ignore
        ? getTimeString(startTs) // @ts-ignore
        : formatRealDateMs(startTs + SpNativeMemoryChart.REAL_TIME_DIF);
    });
    this.memoryTbl!.itemTextHandleMap.set('endTs', (endTs) => {
      // @ts-ignore
      return endTs > this.currentSelection!.leftNs && // @ts-ignore
        endTs <= this.currentSelection!.rightNs &&
        endTs !== 0 &&
        endTs !== null
        ? 'Freed'
        : 'Existing';
    });
    this.memoryTbl!.itemTextHandleMap.set('heapSize', (heapSize) => {
      // @ts-ignore
      return getByteWithUnit(heapSize);
    });
  }

  private getFilterDataByMark(): void {
    document.dispatchEvent(
      new CustomEvent('triangle-flag', {
        detail: {
          time: '',
          type: 'square',
          timeCallback: (timeArr: number[]): void => {
            let minItem: NativeMemory | undefined = undefined;
            if (timeArr && timeArr.length > 0) {
              let checkTs = timeArr[0];
              let minTs = 0;
              let filterTemp = this.memorySource.filter((tempItem) => {
                if (minTs === 0 || (tempItem.startTs - checkTs !== 0 && Math.abs(tempItem.startTs - checkTs) < minTs)) {
                  minTs = Math.abs(tempItem.startTs - checkTs);
                  minItem = tempItem;
                }
                return tempItem.startTs === checkTs;
              });

              if (filterTemp.length > 0) {
                filterTemp[0].isSelected = true;
              } else {
                if (minItem) {
                  (minItem as NativeMemory).isSelected = true;
                  filterTemp.push(minItem);
                }
              }
              if (filterTemp.length > 0) {
                this.rowSelectData = filterTemp[0];
                let args = new Map<string, unknown>(); //@ts-ignore
                args.set('startTs', this.rowSelectData.startTs);
                args.set('actionType', 'native-memory-state-change');
                this.startNmMemoryWorker(`${this.memoryType}-action`, args, (results: unknown[]) => { });
                TabPaneNMSampleList.addSampleData(this.rowSelectData, this.currentSelection!.nativeMemoryCurrentIPid);
                this.memoryTbl!.scrollToData(this.rowSelectData);
              }
            }
          },
        },
      })
    );
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.memoryTbl) {
          // @ts-ignore
          this.memoryTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 31
            }px`;
        }
        this.memoryTbl?.reMeauseHeight();
        if (this.tblData) {
          // @ts-ignore
          this.tblData.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 31
            }px`;
        }
        this.tblData?.reMeauseHeight(); //@ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  setRightTableData(nativeMemoryHook: NativeMemory): void {
    let args = new Map<string, unknown>();
    args.set('eventId', nativeMemoryHook.eventId);
    args.set('actionType', 'memory-stack');
    this.startNmMemoryWorker(`${this.memoryType}-action`, args, (results: unknown[]) => {
      let thread = new NativeHookCallInfo();
      thread.threadId = nativeMemoryHook.threadId;
      thread.threadName = Utils.getInstance().getThreadMap().get(thread.threadId) || 'Thread';
      thread.symbol = `${nativeMemoryHook.threadName ?? ''}【${nativeMemoryHook.threadId}】`;
      thread.type = -1;
      let currentSource = [];
      currentSource.push(thread);
      currentSource.push(...results);
      this.progressEL!.loading = false;
      this.tblData!.dataSource = currentSource;
    });
  }

  initHtml(): string {
    return tabPaneNMemoryHtml;
  }
}
