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

import '../../../../../base-ui/table/lit-table-column';
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import {
  NativeHookCallInfo,
  NativeHookSampleQueryInfo,
  NativeHookSamplerInfo,
  NativeMemory,
} from '../../../../bean/NativeHook';
import { Utils } from '../../base/Utils';
import '../TabPaneFilter';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import '../../../../../base-ui/slicer/lit-slicer';
import { procedurePool } from '../../../../database/Procedure';
import { formatRealDateMs, getTimeString } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { SpNativeMemoryChart } from '../../../chart/SpNativeMemoryChart';
import { queryAllHookData, queryNativeHookSnapshotTypes } from '../../../../database/sql/NativeHook.sql';
import { getCurrentTypes, MemoryBasicType, MemoryTraceRowType, MemoryType } from '../../../../bean/MemoryEnum';

@element('tabpane-native-sample')
export class TabPaneNMSampleList extends BaseElement {
  static tblData: LitTable | null | undefined;
  static sampleTbl: LitTable | null | undefined;
  static filter: TabPaneFilter | null | undefined;
  static filterSelect: string = '0';
  static samplerInfoSource: Array<NativeHookSamplerInfo> = [];
  static types: Array<string> = [];
  static nativeType: Array<string> = [...MemoryBasicType.NATIVE_MEMORY];
  static tableMarkData: Array<NativeMemory> = [];
  static selectionParam: SelectionParam | undefined = undefined;
  static sampleTypes: Array<NativeHookSampleQueryInfo> = [];
  static sampleTypesList: NativeHookSampleQueryInfo[][] = [];
  private currentSelection: SelectionParam | undefined;
  private memoryType = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;

  set data(sampleParam: SelectionParam) {
    if (sampleParam === this.currentSelection) {
      return;
    } 
    this.currentSelection = sampleParam;
    TabPaneNMSampleList.serSelection(sampleParam);
    this.filterAllList();
  }

  static serSelection(sampleParam: SelectionParam): void {
    if (this.selectionParam !== sampleParam) {
      this.clearData();
      this.selectionParam = sampleParam;
      this.initTypes(sampleParam.nativeMemoryCurrentIPid);
    }
    this.types = getCurrentTypes(sampleParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false) as string[];
  }

  static initTypes(iPid: number): void {
    queryNativeHookSnapshotTypes(iPid).then((result) => {
      if (result.length > 0) {
        this.sampleTypes = result;
      }
    });
  }

  static addSampleData(data: NativeMemory, iPid: number): void {
    if (TabPaneNMSampleList.tableMarkData.indexOf(data) !== -1) {
      return;
    }
    TabPaneNMSampleList.tableMarkData.push(data);
    let rootSample = new NativeHookSamplerInfo();
    rootSample.snapshot = `Snapshot${this.numberToWord(this.samplerInfoSource.length + 1)}`;
    rootSample.startTs = data.startTs;
    rootSample.timestamp =
      SpNativeMemoryChart.REAL_TIME_DIF === 0
        ? getTimeString(data.startTs)
        : formatRealDateMs(data.startTs + SpNativeMemoryChart.REAL_TIME_DIF);
    rootSample.eventId = data.eventId;
    rootSample.threadId = data.threadId;
    rootSample.threadName = data.threadName;
    this.queryAllHookInfo(data, rootSample, iPid);
  }

  static mergeSampleData(
    leftTime: number,
    startNs: number,
    rootSample: NativeHookSampleQueryInfo,
    mergeSample: NativeHookSampleQueryInfo
  ): void {
    if (mergeSample.endTs >= startNs) {
      rootSample.growth += mergeSample.growth;
    }
    if (mergeSample.startTs > leftTime) {
      rootSample.existing++;
      let childSample = new NativeHookSamplerInfo(); //新增最下层的叶子节点
      childSample.snapshot = `0x${mergeSample.addr}`;
      childSample.eventId = mergeSample.eventId;
      childSample.heapSize = mergeSample.growth;
      childSample.growth = Utils.getByteWithUnit(mergeSample.growth);
      childSample.totalGrowth = childSample.growth;
      childSample.startTs = mergeSample.startTs;
      childSample.timestamp =
        SpNativeMemoryChart.REAL_TIME_DIF === 0
          ? getTimeString(mergeSample.startTs)
          : formatRealDateMs(mergeSample.startTs + SpNativeMemoryChart.REAL_TIME_DIF);
      childSample.threadId = mergeSample.threadId;
      childSample.threadName = mergeSample.threadName;
      childSample.existing = 0;
      rootSample.children.push(childSample);
    }
    rootSample.total += mergeSample.growth;
  }

  static queryAllHookInfo(data: NativeMemory, rootSample: NativeHookSamplerInfo, ipid: number): void {
    let copyTypes = this.sampleTypes.map((type) => {
      let copyType = new NativeHookSampleQueryInfo();
      copyType.eventType = type.eventType;
      copyType.subType = type.subType;
      return copyType;
    });
    queryAllHookData(data.startTs, ipid).then((nmSamplerHookResult) => {
      if (nmSamplerHookResult.length > 0) {
        let nameGroup: Record<string, NativeHookSampleQueryInfo[]> = {};
        copyTypes.forEach((item) => {
          nameGroup[item.eventType] = nameGroup[item.eventType] || [];
          nameGroup[item.eventType].push(item);
        });
        let leftTime =
          TabPaneNMSampleList.tableMarkData.length === 1
            ? 0
            : TabPaneNMSampleList.tableMarkData[TabPaneNMSampleList.tableMarkData.length - 2].startTs;
        nmSamplerHookResult.forEach((item) => {
          item.threadId = rootSample.threadId;
          item.threadName = rootSample.threadName;
          if (nameGroup[item.eventType] !== undefined) {
            if (item.subType === null) {
              this.mergeSampleData(leftTime, data.startTs, nameGroup[item.eventType][0], item);
            } else {
              let filter = nameGroup[item.eventType].filter((type: NativeHookSampleQueryInfo) => {
                return type.subType === item.subType;
              });
              if (filter.length > 0) {
                this.mergeSampleData(leftTime, data.startTs, filter[0], item);
              }
            }
          }
        });
        this.updateSampleTypesList(copyTypes);
        this.createTree(nameGroup, rootSample);
        rootSample.tempList = [...rootSample.children];
        this.samplerInfoSource.push(rootSample);
        TabPaneNMSampleList.sampleTbl!.recycleDataSource = TabPaneNMSampleList.samplerInfoSource;
      }
    });
  }

  private static updateSampleTypesList(copyTypes: NativeHookSampleQueryInfo[]): void {
    if (this.sampleTypesList.length > 0) {
      let sampleTypesListElement = this.sampleTypesList[this.sampleTypesList.length - 1];
      sampleTypesListElement.forEach((item: NativeHookSampleQueryInfo, index: number) => {
        copyTypes[index].current = copyTypes[index].growth;
        if (index < copyTypes.length) {
          copyTypes[index].growth -= item.current;
          copyTypes[index].total -= item.total;
        }
      });
    } else {
      copyTypes.forEach((item: NativeHookSampleQueryInfo) => {
       
        item.current = item.growth;
      });
    }
    this.sampleTypesList.push(copyTypes);
  }

  static createTree(nameGroup: Record<string, NativeHookSampleQueryInfo[]>, rootSample: NativeHookSamplerInfo): void {
    Object.keys(nameGroup).forEach((key) => {
      let parentSample = new NativeHookSamplerInfo();
      parentSample.snapshot = key;
      if (nameGroup[key].length > 0) {
        nameGroup[key].forEach((child: NativeHookSampleQueryInfo) => {
          let childSample = new NativeHookSamplerInfo();
          childSample.snapshot = child.subType || child.eventType;
          childSample.heapSize = child.growth;
          childSample.growth = Utils.getByteWithUnit(child.growth);
          childSample.total = child.total;
          childSample.totalGrowth = Utils.getByteWithUnit(child.total);
          childSample.existing = child.existing;
          childSample.currentSize = child.current;
          childSample.current = Utils.getByteWithUnit(child.current);
          childSample.threadName = rootSample.threadName;
          childSample.threadId = rootSample.threadId;
          parentSample.merageObj(childSample);
          if (childSample.snapshot !== parentSample.snapshot) {
            //根据名称是否一致来判断是否需要添加子节点
            childSample.children.push(...child.children);
            parentSample.children.push(childSample);
          } else {
           
            parentSample.children.push(...child.children);
          }
        });
      }
      rootSample.merageObj(parentSample);
      rootSample.children.push(parentSample);
    });
  }

  static prepChild(currentSample: NativeHookSamplerInfo, rootSample: NativeHookSamplerInfo): void {
    currentSample.heapSize -= rootSample.heapSize;
    currentSample.growth = Utils.getByteWithUnit(currentSample.heapSize);
    let currentMap: Record<string, NativeHookSamplerInfo> = {};
    currentSample.children.forEach((currentChild) => {
      currentMap[currentChild.snapshot] = currentChild;
    });
    rootSample.children.forEach((rootChild) => {
      if (currentMap[rootChild.snapshot] === undefined) {
        let perpSample = new NativeHookSamplerInfo();
        perpSample.snapshot = rootChild.snapshot;
        currentMap[rootChild.snapshot] = perpSample;
        currentSample.children.push(perpSample);
      }
      this.prepChild(currentMap[rootChild.snapshot], rootChild);
    });
  }

  static clearData(): void {
    this.types = [];
    this.samplerInfoSource = [];
    this.tblData!.dataSource = [];
    this.sampleTbl!.recycleDataSource = [];
    TabPaneNMSampleList.sampleTbl!.recycleDataSource = [];
    this.sampleTypesList = [];
    this.tableMarkData = []; // @ts-ignore
    TabPaneNMSampleList.filter!.firstSelect = '0';
  }

  static numberToWord(num: number): string {
    let word = '';
    while (num > 0) {
      let end = num % 26; // 26个字母
      end = end === 0 ? (end = 26) : end;
      word = String.fromCharCode(96 + end) + word;
      num = (num - end) / 26;
    }
    return word.toUpperCase();
  }

  startWorker(args: Map<string, unknown>, handler: Function): void {
    procedurePool.submitWithName('logic0', `${this.memoryType}-action`, args, undefined, (res: unknown) => {
      handler(res);
    });
  }

  setRightTableData(hookSamplerInfo: NativeHookSamplerInfo): void {
    let nmSamplerArgs = new Map<string, unknown>();
    nmSamplerArgs.set('eventId', hookSamplerInfo.eventId);
    nmSamplerArgs.set('actionType', 'memory-stack');
    this.startWorker(nmSamplerArgs, (results: NativeHookCallInfo[]) => {
      let source: NativeHookCallInfo[] = [];
      if (results.length > 0) {
        let hookCallInfo = new NativeHookCallInfo();
        hookCallInfo.threadId = hookSamplerInfo.threadId;
        hookCallInfo.threadName = hookSamplerInfo.threadName;
        hookCallInfo.symbol = `${hookSamplerInfo.threadName ?? ''}【${hookSamplerInfo.threadId}】`;
        hookCallInfo.type = -1;
        source.push(hookCallInfo);
        source.push(...results);
      }
      TabPaneNMSampleList.tblData!.dataSource = source;
    });
  }

  initElements(): void {
    TabPaneNMSampleList.sampleTbl = this.shadowRoot?.querySelector<LitTable>('#tb-native-sample');
    TabPaneNMSampleList.sampleTbl!.addEventListener('row-click', (evt: unknown) => {
      // @ts-ignore
      this.setRightTableData(evt.detail.data);
    });
    TabPaneNMSampleList.tblData = this.shadowRoot?.querySelector<LitTable>('#tb-native-data');
    TabPaneNMSampleList.filter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.setSelectList(TabPaneNMSampleList.nativeType, null, 'Allocation Type');
    this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.getFilterData((data: FilterData) => {
      if (data.firstSelect) {
        TabPaneNMSampleList.filterSelect = data.firstSelect;
        this.filterAllList();
      }
    }); // @ts-ignore
    TabPaneNMSampleList.filter!.firstSelect = TabPaneNMSampleList.filterSelect;
    TabPaneNMSampleList.sampleTbl!.exportTextHandleMap.set('totalGrowth', (value) => {
      // @ts-ignore
      return `${value.total}`;
    });
    TabPaneNMSampleList.sampleTbl!.exportTextHandleMap.set('growth', (value) => {
      // @ts-ignore
      return `${value.heapSize}`;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight !== 0) {
        // @ts-ignore
        TabPaneNMSampleList.sampleTbl?.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 10 - 31 + 'px';
        TabPaneNMSampleList.sampleTbl?.reMeauseHeight();
        // @ts-ignore
        TabPaneNMSampleList.tblData?.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 10 + 'px';
        TabPaneNMSampleList.tblData?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }

  filterAllList(): void {
    TabPaneNMSampleList.samplerInfoSource.forEach(nmRootSample => {
      nmRootSample.heapSize = 0;
      nmRootSample.existing = 0;
      nmRootSample.total = 0;

      let childrenToShow: NativeHookSamplerInfo[] = [];
      const filterSelect = TabPaneNMSampleList.filterSelect;
      switch (filterSelect) {
        case '0':
          childrenToShow = [...nmRootSample.tempList];
          break;
        case '1':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => MemoryType.ALL_HEAP_EVENTS.includes(parentSample.snapshot)
          );
          break;
        case '2':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.MEMORY_M_ALLOC_NAME
          );
          break;
        case '3':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.ARKTS_Alloc_NAME
          );
          break;
        case '4':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.JS_Alloc_NAME
          );
          break;
        case '5':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.KMP_Alloc_NAME
          );
          break;
        case '6':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => MemoryType.ALL_ANONYMOUS_EVENTS.includes(parentSample.snapshot)
          );
          break;
        case '7':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.ION_Alloc_NAME
          );
          break;
        case '8':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.ASHMEM_Alloc_NAME
          );
          break;
        case '9':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.SO_Alloc_NAME
          );
          break;
        case '10':
          childrenToShow = nmRootSample.tempList.filter(
            parentSample => parentSample.snapshot === MemoryType.MEMORY_M_MAP_NAME
          );
          break;
        default:
          if (nmRootSample.tempList.length > 0) {
            childrenToShow = [nmRootSample.tempList[0]];
          }
      }
      if (childrenToShow.length > 0) {
        nmRootSample.children = childrenToShow;
        childrenToShow.forEach(parentSample => {
          nmRootSample.heapSize += parentSample.heapSize;
          nmRootSample.existing += parentSample.existing;
          nmRootSample.total += parentSample.total;
        });
        nmRootSample.growth = Utils.getByteWithUnit(nmRootSample.heapSize);
        nmRootSample.totalGrowth = Utils.getByteWithUnit(nmRootSample.total);
      } else {
        nmRootSample.children = [];
        nmRootSample.growth = '';
        nmRootSample.totalGrowth = '';
      }
    });

    TabPaneNMSampleList.sampleTbl!.recycleDataSource = TabPaneNMSampleList.samplerInfoSource;
  }

  initHtml(): string {
    return `
        <style>
        .nm-sample-tbl {
            height: auto;
        }
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-slicer style="width:100%">
        <div class="nm-sample-content" style="width: 65%">
            <lit-table id="tb-native-sample" class="nm-sample-tbl" tree>
                <lit-table-column class="nm-sample-column" width="25%" title="Snapshot" data-index="snapshot" key="snapshot"  align="flex-start"retract>
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Timestamp" data-index="timestamp" key="timestamp"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Net Growth" data-index="growth" key="growth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Total Growth" data-index="totalGrowth" key="totalGrowth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="# Existing" data-index="existing" key="existing"  align="flex-start"  >
                </lit-table-column>
            </lit-table>
            <tab-pane-filter id="filter" first></tab-pane-filter>
        </div>
        <lit-slicer-track ></lit-slicer-track>
        <lit-table id="tb-native-data" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
            <lit-table-column class="nm-sample-column" width="80px" title="" data-index="type" key="type"  align="flex-start" >
                <template>
                    <div v-if=" type === -1 ">Thread:</div>
                    <img src="img/library.png" size="20" v-if=" type === 1 ">
                    <img src="img/function.png" size="20" v-if=" type === 0 ">
                </template>
            </lit-table-column>
            <lit-table-column class="nm-sample-column" width="1fr" title="" data-index="symbol" key="symbol"  align="flex-start">
            </lit-table-column>
        </lit-table>
        </lit-slicer>
        `;
  }
}
