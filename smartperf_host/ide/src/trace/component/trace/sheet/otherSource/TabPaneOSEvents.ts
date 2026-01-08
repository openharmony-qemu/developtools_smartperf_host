/*
 * Copyright (C) 2025-2026 Huawei Device Co., Ltd.
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
import { BaseElement, element } from "../../../../../base-ui/BaseElement";
import { LitProgressBar } from "../../../../../base-ui/progress-bar/LitProgressBar";
import { LitTable } from "../../../../../base-ui/table/lit-table";
import { LitPageTable } from "../../../../../base-ui/table/LitPageTable";
import { SelectionParam } from "../../../../bean/BoxSelection";
import { MemoryBasicType, MemoryTableName, MemoryTraceRowType, MemoryType } from "../../../../bean/MemoryEnum";
import { NativeHookCallInfo, NativeMemory } from "../../../../bean/NativeHook";
import { procedurePool } from "../../../../database/Procedure";
import { SpNativeMemoryChart } from "../../../chart/SpNativeMemoryChart";
import { SpSystemTrace } from "../../../SpSystemTrace";
import { Utils } from "../../base/Utils";
import { FilterData, TabPaneFilter } from "../TabPaneFilter";
import { tabPaneOSHtml } from "./TabPaneOsEvent.html";
import {
  formatRealDateMs,
  getByteWithUnit,
  getTimeString,
} from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { querySubType } from "../../../../database/sql/NativeHook.sql";


@element('tabpane-os-events')
export class TabPaneOSEvents extends BaseElement {
  private defaultTypes = MemoryBasicType.OTHER_SOURCE;
  private selectTypeList:Array<string> = [...MemoryBasicType.OTHER_SOURCE];
  private memoryTbl: LitPageTable | null | undefined;
  private filter: TabPaneFilter | null | undefined;
  private tblData: LitTable | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private loadingList: number[] = [];
  private loadingPage: HTMLBaseElement | null | undefined;
  private memorySource: Array<NativeMemory> = [];
  private filterAllocationType: string = '0';
  private filterType: string = 'All Other Source';
  private filterResponseType: number = -1;
  private filterResponseSelect: string = '0';
  private currentSelection?: SelectionParam;
  private rowSelectData?: NativeMemory;
  private sortColumn: string = '';
  private sortType: number = 0;
  private responseTypes: { key: number; value: string }[] = [];
  private eventTypes: Array<string> = [];
  private systemTrace: SpSystemTrace | undefined | null;
  private memoryType = MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE;

  set data(memoryParam: SelectionParam) {
    if (memoryParam === this.currentSelection) {
      return;
    }
    this.currentSelection = memoryParam;
    this.queryData();
  }

  async queryData(resetFilter: boolean = true): Promise<void> {
    const selectData = this.currentSelection!.otherSource;
    this.eventTypes = [];
    if (selectData.indexOf(this.defaultTypes[0]) !== -1) {
      this.eventTypes.push(`${MemoryType.FD_OPEN_NAME}`);
      this.eventTypes.push(`${MemoryType.THREAD_CREATE_NAME}`);
    } else {
      if (selectData.indexOf(this.defaultTypes[1]) !== -1) {
        this.eventTypes.push(`${MemoryType.FD_OPEN_NAME}`);
      }
      if (selectData.indexOf(this.defaultTypes[2]) !== -1) {
        this.eventTypes.push(`${MemoryType.THREAD_CREATE_NAME}`);
      }
    }
    this.selectTypeList = [...MemoryBasicType.OTHER_SOURCE];
    await querySubType(this.currentSelection!.leftNs, this.currentSelection!.rightNs,
       this.currentSelection!.otherSourceCurrentIPid, MemoryTableName.NATIVE_HOOK, this.eventTypes).then((res:{subTypeId: number, subType: string}[]) => {
        this.selectTypeList.push(...res.map((item) => {
          return item.subType;
        }));
    });
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
    if (resetFilter) {
      this.resetFilter();
      this.setLoading(true);
      this.initFilterTypes(() => {
        this.filterSetSelectList(this.filter!, 0);
        this.getDataByNativeMemoryWorker(resetFilter);
      });
    } else {
      this.getDataByNativeMemoryWorker(resetFilter);
    }
  }

  getDataByNativeMemoryWorker(refresh = false): void {
    let args = new Map<string, unknown>();
    args.set('filterAllocType', this.filterAllocationType);
    args.set('filterEventType', this.filterType);
    args.set('filterResponseType', this.filterResponseType);
    args.set('leftNs', this.currentSelection!.leftNs);
    args.set('rightNs', this.currentSelection!.rightNs);
    args.set('types', this.eventTypes);
    args.set('refresh', refresh);
    args.set('sortColumn', this.sortColumn);
    args.set('sortType', this.sortType);
    this.memorySource = [];
    if (this.memoryTbl!.recycleDs.length > 1_0000) {
      this.memoryTbl!.recycleDataSource = [];
    }
    this.startNmMemoryWorker(`${this.memoryType}-queryNativeHookEvent`, args, (results: NativeMemory[]) => {
      this.tblData!.recycleDataSource = [];
      this.setLoading(false);
      if (results.length > 0) {
        let isTwoArray: boolean = results.some(item => {
          return Array.isArray(item);
        });
        let dataList: unknown = [];
        if (isTwoArray) {
          results.forEach(v => {
            // @ts-ignore
            dataList = dataList.concat(v);
          });
        } else {
          dataList = results;
        }
        // @ts-ignore
        dataList.forEach((item) => {
          //@ts-ignore
          let tmpNumber = item.addr.split('x');
          //@ts-ignore
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

  startNmMemoryWorker(type: string, args: unknown, handler: Function): void {
    this.setLoading(true);
    procedurePool.submitWithName('logic0', type, args, undefined, (res: unknown) => {
      //@ts-ignore
      if (Array.isArray(res) || (res.tag === 'end' && res.index === 0)) {
        //@ts-ignore
        handler(res.data ? res.data : res);
        this.setLoading(false);
      } else {
        //@ts-ignore
        this.memorySource.push(res.data); //@ts-ignore
        if (res.tag === 'end') {
          handler(this.memorySource);
          this.setLoading(false);
        }
      }
    });
  }

  setLoading(loading: boolean): void {
    if (loading) {
      this.loadingList.push(1);
      this.progressEL!.loading = true;
      this.loadingPage!.style.visibility = 'visible';
    } else {
      this.loadingList.splice(0, 1);
      if (this.loadingList.length === 0) {
        this.progressEL!.loading = false;
        this.loadingPage!.style.visibility = 'hidden';
      }
    }
  }


  private filterSetSelectList(nmFilterEl: TabPaneFilter, typeIndexOf: number): void {
    nmFilterEl!.setSelectList(
      null,
      this.selectTypeList,
      'OtherSource Lifespan',
      'OtherSource Type',
      this.responseTypes.map((item) => {
        return item.value;
      })
    );
    nmFilterEl!.secondSelect = `${typeIndexOf}`;
    nmFilterEl!.thirdSelect = this.filterResponseSelect;
  }

  initFilterTypes(initCallback?: () => void): void {
    procedurePool.submitWithName('logic0', `${this.memoryType}-get-responseType`, {}, undefined, (res: { key: number, value: string }[]) => {
      this.filter!.setSelectList(
        null,
        this.selectTypeList,
        'OtherSource Lifespan',
        'OtherSource Type',
        res.map((item) => {
          return item.value;
        })
      );
      this.filter!.setFilterModuleSelect('#first-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#second-select', 'width', '150px');
      this.filter!.setFilterModuleSelect('#third-select', 'width', '150px');
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
    this.filterType = 'All Other Source';
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
      this.getDataByNativeMemoryWorker();
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
        const typeName = this.typeIndexToTypeName(data.secondSelect);
        this.filterAllocationType = data.firstSelect || '0';
        this.filterType = typeName;
        this.filterResponseSelect = data.thirdSelect || '0';
        let thirdIndex = parseInt(data.thirdSelect || '0');
        if (this.responseTypes.length > thirdIndex) {
          this.filterResponseType =
            this.responseTypes[thirdIndex].key === undefined ? -1 : this.responseTypes[thirdIndex].key;
        }
        this.getDataByNativeMemoryWorker();
      }
    });
    this.filter!.firstSelect = '1';
  }

  private typeIndexToTypeName(typeIndex?: string | null): string {
    if (typeIndex) {
      return this.selectTypeList[parseInt(typeIndex)];
    } else {
      return 'ALL';
    }
  }
  private setItemTextHandleMapByMemoryTbl(): void {
    this.memoryTbl!.itemTextHandleMap.set('startTs', (startTs) => {
      return SpNativeMemoryChart.REAL_TIME_DIF === 0
        ? getTimeString(startTs as number)
        : formatRealDateMs(startTs as number + SpNativeMemoryChart.REAL_TIME_DIF);
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

  private getFilterDataByMark(): void {
    document.dispatchEvent(
      new CustomEvent('triangle-flag', {
        detail: {
          time: '',
          type: 'square',
          timeCallback: (timeArr: number[]): void => {
            if (timeArr && timeArr.length > 0) {
              let checkTs = timeArr[0];
              let minTs = 0;
              let minItem: NativeMemory | undefined = undefined;
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
                  filterTemp.push(minItem);
                  (minItem as NativeMemory).isSelected = true;
                }
              }
              if (filterTemp.length > 0) {
                this.rowSelectData = filterTemp[0];
                let args = new Map<string, unknown>();
                args.set('startTs', this.rowSelectData.startTs);
                args.set('actionType', 'native-memory-state-change');
                this.startNmMemoryWorker(`${this.memoryType}-action`, args, (results: unknown[]) => { });
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
    new ResizeObserver(() => {
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
        this.tblData?.reMeauseHeight();
        this.loadingPage!.style.height = `${this.parentElement!.clientHeight - 24}px`;
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
    return tabPaneOSHtml;
  }
}