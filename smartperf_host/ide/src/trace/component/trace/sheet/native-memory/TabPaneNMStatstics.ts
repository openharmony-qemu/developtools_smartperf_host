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
import { queryHeapSizeByIpid } from '../../../../database/sql/SqlLite.sql';
import { getCurrentTypes, MemoryBasicType, MemoryTraceRowType, MemoryType } from '../../../../bean/MemoryEnum';
import { MemoryAnalysisDataLogic } from '../../base/MemoryAnalysisData';


@element('tabpane-native-statistics')
export class TabPaneNMStatstics extends BaseElement {
  private nativeStatisticsTbl: LitTable | null | undefined;
  private nativeStatisticsSource: Array<NativeHookStatisticsTableData> = [];
  private nativeType: Array<string> = [...MemoryBasicType.NATIVE_MEMORY];
  private allMax: number = 0;
  private sortColumn: string = '';
  private sortType: number = 0;
  private currentSelection: SelectionParam | undefined;
  private currentSelectIPid = 1;
  private dataLogic?: MemoryAnalysisDataLogic;
  private types: Array<string> = [];


  // 显示tab页时初始化数据
  set data(nativeStatisticsParam: SelectionParam) {
    // 框选范围没有变化时不触发更新
    if (nativeStatisticsParam === this.currentSelection) {
      return;
    }
    if (!this.dataLogic) {
      this.dataLogic = new MemoryAnalysisDataLogic();
    }
    this.currentSelectIPid = nativeStatisticsParam.nativeMemoryCurrentIPid;
    this.currentSelection = nativeStatisticsParam;
    this.allMax = 0;
    TabPaneNMSampleList.clearData();
    this.recordEventHeap(nativeStatisticsParam.nativeMemoryCurrentIPid);
    this.dataLogic.init(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    this.dataLogic.setCurrentSelectIPid(nativeStatisticsParam.nativeMemoryCurrentIPid);
    this.dataLogic.initResponseTypeList(nativeStatisticsParam);
    if (this.nativeStatisticsTbl) {
      //@ts-ignore
      this.nativeStatisticsTbl.shadowRoot!.querySelector('.table')!.style.height = `${this.parentElement!.clientHeight - 25}px`;
      this.nativeStatisticsTbl.recycleDataSource = [];
    }
    this.nativeStatisticsTbl!.loading = true;
    this.queryData(nativeStatisticsParam);
  }

  async recordEventHeap(iPid: number): Promise<void> {
    SpNativeMemoryChart.EVENT_HEAP = await queryHeapSizeByIpid(iPid);
    SpNativeMemoryChart.EVENT_HEAP.map((heap) => {
      this.allMax += heap.sumHeapSize;
    });
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
      this.setMemoryTypeData(nativeStatisticsParam, values[0], arr);
      this.types = getCurrentTypes(nativeStatisticsParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false) as string[];
      this.setSubTypeTableData(values[1], arr, this.types);
      this.setMallocTableData(values[2], arr, this.types);
      this.nativeStatisticsSource = arr;
      this.nativeStatisticsSource = this.mergeMemoryData(arr);
      this.sortByColumn(this.sortColumn, this.sortType);
    });
  }

  mergeMemoryData(dataArray: Array<NativeHookStatisticsTableData>): Array<NativeHookStatisticsTableData> {
    const mergedMap = new Map<string, NativeHookStatisticsTableData>();
    for (const originalItem of dataArray) {
      const key = originalItem.memoryTap;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          ...originalItem,
          existingValue: [...originalItem.existingValue]
        });
      } else {
        const mergedItem = mergedMap.get(key)!;
        mergedItem.allocCount += originalItem.allocCount;
        mergedItem.existing += originalItem.existing;
        mergedItem.freeByte += originalItem.freeByte;
        mergedItem.freeCount += originalItem.freeCount;
        mergedItem.totalBytes += originalItem.totalBytes;
        mergedItem.totalCount += originalItem.totalCount;
        mergedItem.existingValue = [
          mergedItem.existingValue[0] + originalItem.existingValue[0],
          mergedItem.existingValue[1] + originalItem.existingValue[1],
          originalItem.existingValue[2]
        ];
        mergedItem.max = Math.max(mergedItem.max, originalItem.max);
      }
    }

    return Array.from(mergedMap.values()).map(mergedItem => {
      return {
        allocCount: mergedItem.allocCount,
        existing: mergedItem.existing,
        existingString: Utils.getByteWithUnit(mergedItem.existing),
        existingValue: [...mergedItem.existingValue],
        freeByte: mergedItem.freeByte,
        freeByteString: Utils.getByteWithUnit(mergedItem.freeByte),
        freeCount: mergedItem.freeCount,
        isHover: false,
        max: mergedItem.max,
        maxStr: Utils.getByteWithUnit(mergedItem.max),
        memoryTap: mergedItem.memoryTap,
        totalBytes: mergedItem.totalBytes,
        totalBytesString: Utils.getByteWithUnit(mergedItem.totalBytes),
        totalCount: mergedItem.totalCount,
        eventType: mergedItem.eventType
      };
    });
  }

  setMallocTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>, types: Array<string>): void {
    result.map((malloc) => {
      let data = new NativeHookStatisticsTableData();
      if (malloc.eventType === MemoryType.MEMORY_M_ALLOC_NAME) {
        data.memoryTap = `Malloc ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.MEMORY_M_MAP_NAME) {
        data.memoryTap = `Mmap ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.ARKTS_Alloc_NAME) {
        data.memoryTap = `Arkts ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.JS_Alloc_NAME) {
        data.memoryTap = `Js ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.KMP_Alloc_NAME) {
        data.memoryTap = `Kmp ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.ION_Alloc_NAME) {
        data.memoryTap = `Ion ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.SO_Alloc_NAME) {
        data.memoryTap = `So ${Utils.getByteWithUnit(malloc.heapSize)}`;
      } else if (malloc.eventType === MemoryType.ASHMEM_Alloc_NAME) {
        data.memoryTap = `Ashmem ${Utils.getByteWithUnit(malloc.heapSize)}`;
      }
      data.eventType = malloc.eventType;
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
      if (MemoryType.APPLY_NM_EVENTS.every(item => types.includes(item))) {
        arr.push(data);
      } else if ((types.includes(MemoryType.MEMORY_M_ALLOC_NAME) && malloc.eventType === MemoryType.MEMORY_M_ALLOC_NAME) || (types.includes(MemoryType.ARKTS_Alloc_NAME) && malloc.eventType === MemoryType.ARKTS_Alloc_NAME) || (types.includes(MemoryType.JS_Alloc_NAME) && malloc.eventType === MemoryType.JS_Alloc_NAME) || (types.includes(MemoryType.KMP_Alloc_NAME) && malloc.eventType === MemoryType.KMP_Alloc_NAME)) {
        arr.push(data);
      } else if (types.includes(MemoryType.MEMORY_M_ALLOC_NAME) && malloc.eventType === MemoryType.MEMORY_M_ALLOC_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.ARKTS_Alloc_NAME) && malloc.eventType === MemoryType.ARKTS_Alloc_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.JS_Alloc_NAME) && malloc.eventType === MemoryType.JS_Alloc_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.KMP_Alloc_NAME) && malloc.eventType === MemoryType.KMP_Alloc_NAME) {
        arr.push(data);
      } else if ((types.includes(MemoryType.ION_Alloc_NAME) && malloc.eventType === MemoryType.ION_Alloc_NAME) || (types.includes(MemoryType.SO_Alloc_NAME) && malloc.eventType === MemoryType.SO_Alloc_NAME) || (types.includes(MemoryType.ASHMEM_Alloc_NAME) && malloc.eventType === MemoryType.ASHMEM_Alloc_NAME) || (types.includes(MemoryType.MEMORY_M_MAP_NAME) && malloc.eventType === MemoryType.MEMORY_M_MAP_NAME)) {
        arr.push(data);
      } else if (types.includes(MemoryType.ION_Alloc_NAME) && malloc.eventType === MemoryType.ION_Alloc_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.SO_Alloc_NAME) && malloc.eventType === MemoryType.SO_Alloc_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.ASHMEM_Alloc_NAME) && malloc.eventType === MemoryType.ASHMEM_Alloc_NAME) {
        arr.push(data);
      } else if (types.includes(MemoryType.MEMORY_M_MAP_NAME) && malloc.eventType === MemoryType.MEMORY_M_MAP_NAME) {
        arr.push(data);
      }
    });
  }

  setSubTypeTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>, types: Array<string>): void {
    result.map((sub) => {
      let subType = SpSystemTrace.DATA_DICT.get(sub.subTypeId);
      if (subType !== null && subType !== undefined) {
        let data = new NativeHookStatisticsTableData();
        data.eventType = subType;
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
        if (MemoryType.APPLY_NM_EVENTS.every(item => types.includes(item))) {
          arr.push(data);
        } else if ((types.includes(MemoryType.MEMORY_M_ALLOC_NAME) && sub.eventType === MemoryType.MEMORY_M_ALLOC_NAME) || (types.includes(MemoryType.ARKTS_Alloc_NAME) && sub.eventType === MemoryType.ARKTS_Alloc_NAME) || (types.includes(MemoryType.JS_Alloc_NAME) && sub.eventType === MemoryType.JS_Alloc_NAME) || (types.includes(MemoryType.KMP_Alloc_NAME) && sub.eventType === MemoryType.KMP_Alloc_NAME)) {
          arr.push(data);
        } else if (types.includes(MemoryType.MEMORY_M_ALLOC_NAME) && sub.eventType === MemoryType.MEMORY_M_ALLOC_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.ARKTS_Alloc_NAME) && sub.eventType === MemoryType.ARKTS_Alloc_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.JS_Alloc_NAME) && sub.eventType === MemoryType.JS_Alloc_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.KMP_Alloc_NAME) && sub.eventType === MemoryType.KMP_Alloc_NAME) {
          arr.push(data);
        } else if ((types.includes(MemoryType.ION_Alloc_NAME) && sub.eventType === MemoryType.ION_Alloc_NAME) || (types.includes(MemoryType.SO_Alloc_NAME) && sub.eventType === MemoryType.SO_Alloc_NAME) || (types.includes(MemoryType.ASHMEM_Alloc_NAME) && sub.eventType === MemoryType.ASHMEM_Alloc_NAME) || (types.includes(MemoryType.MEMORY_M_MAP_NAME) && sub.eventType === MemoryType.MEMORY_M_MAP_NAME)) {
          arr.push(data);
        } else if (types.includes(MemoryType.ION_Alloc_NAME) && sub.eventType === MemoryType.ION_Alloc_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.SO_Alloc_NAME) && sub.eventType === MemoryType.SO_Alloc_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.ASHMEM_Alloc_NAME) && sub.eventType === MemoryType.ASHMEM_Alloc_NAME) {
          arr.push(data);
        } else if (types.includes(MemoryType.MEMORY_M_MAP_NAME) && sub.eventType === MemoryType.MEMORY_M_MAP_NAME) {
          arr.push(data);
        }
      }
    });
  }

  setMemoryTypeData(
    val: SelectionParam,
    result: Array<NativeHookMalloc>,
    arr: Array<NativeHookStatisticsTableData>
  ): void {
    let all: NativeHookStatisticsTableData | null = null;
    let allHeap: NativeHookStatisticsTableData | null = null;
    let allAnonymous: NativeHookStatisticsTableData | null = null;
    let nativeHeap: NativeHookStatisticsTableData | null = null;
    let arktsHeap: NativeHookStatisticsTableData | null = null;
    let jsHeap: NativeHookStatisticsTableData | null = null;
    let kmpHeap: NativeHookStatisticsTableData | null = null;
    let ion: NativeHookStatisticsTableData | null = null;
    let ashmem: NativeHookStatisticsTableData | null = null;
    let so: NativeHookStatisticsTableData | null = null;
    let others: NativeHookStatisticsTableData | null = null;
    if (val.nativeMemory.indexOf(this.nativeType[0]) !== -1) {
      all = new NativeHookStatisticsTableData();
      all.memoryTap = this.nativeType[0];
    }
    if (val.nativeMemory.indexOf(this.nativeType[1]) !== -1) {
      allHeap = new NativeHookStatisticsTableData();
      allHeap.memoryTap = this.nativeType[1];
    }
    if (val.nativeMemory.indexOf(this.nativeType[2]) !== -1) {
      nativeHeap = new NativeHookStatisticsTableData();
      nativeHeap.memoryTap = this.nativeType[2];
    }
    if (val.nativeMemory.indexOf(this.nativeType[3]) !== -1) {
      arktsHeap = new NativeHookStatisticsTableData();
      arktsHeap.memoryTap = this.nativeType[3];
    }
    if (val.nativeMemory.indexOf(this.nativeType[4]) !== -1) {
      jsHeap = new NativeHookStatisticsTableData();
      jsHeap.memoryTap = this.nativeType[4];
    }
    if (val.nativeMemory.indexOf(this.nativeType[5]) !== -1) {
      kmpHeap = new NativeHookStatisticsTableData();
      kmpHeap.memoryTap = this.nativeType[5];
    }
    if (val.nativeMemory.indexOf(this.nativeType[6]) !== -1) {
      allAnonymous = new NativeHookStatisticsTableData();
      allAnonymous.memoryTap = this.nativeType[6];
    }
    if (val.nativeMemory.indexOf(this.nativeType[7]) !== -1) {
      ion = new NativeHookStatisticsTableData();
      ion.memoryTap = this.nativeType[7];
    }
    if (val.nativeMemory.indexOf(this.nativeType[8]) !== -1) {
      ashmem = new NativeHookStatisticsTableData();
      ashmem.memoryTap = this.nativeType[8];
    }
    if (val.nativeMemory.indexOf(this.nativeType[9]) !== -1) {
      so = new NativeHookStatisticsTableData();
      so.memoryTap = this.nativeType[9];
    }
    if (val.nativeMemory.indexOf(this.nativeType[10]) !== -1) {
      others = new NativeHookStatisticsTableData();
      others.memoryTap = this.nativeType[10];
    }
    for (let hook of result) {
      if (all !== null) {
        this.processHookData(hook, all);
      }
      if (allHeap !== null && (hook.eventType === MemoryType.MEMORY_M_ALLOC_NAME || hook.eventType === MemoryType.ARKTS_Alloc_NAME || hook.eventType === MemoryType.JS_Alloc_NAME || hook.eventType === MemoryType.KMP_Alloc_NAME)) {
        this.processHookData(hook, allHeap);
      }
      if (nativeHeap !== null && hook.eventType === MemoryType.MEMORY_M_ALLOC_NAME) {
        this.processHookData(hook, nativeHeap);
      }
      if (arktsHeap !== null && hook.eventType === MemoryType.ARKTS_Alloc_NAME) {
        this.processHookData(hook, arktsHeap);
      }
      if (jsHeap !== null && hook.eventType === MemoryType.JS_Alloc_NAME) {
        this.processHookData(hook, jsHeap);
      }
      if (kmpHeap !== null && hook.eventType === MemoryType.KMP_Alloc_NAME) {
        this.processHookData(hook, kmpHeap);
      }
      if (allAnonymous !== null && (hook.eventType === MemoryType.ION_Alloc_NAME || hook.eventType === MemoryType.ASHMEM_Alloc_NAME || hook.eventType === MemoryType.SO_Alloc_NAME || hook.eventType === MemoryType.MEMORY_M_MAP_NAME)) {
        this.processHookData(hook, allAnonymous);
      }
      if (ion !== null && hook.eventType === MemoryType.ION_Alloc_NAME) {
        this.processHookData(hook, ion);
      }
      if (ashmem !== null && hook.eventType === MemoryType.ASHMEM_Alloc_NAME) {
        this.processHookData(hook, ashmem);
      }
      if (so !== null && hook.eventType === MemoryType.SO_Alloc_NAME) {
        this.processHookData(hook, so);
      }
      if (others !== null && hook.eventType === MemoryType.MEMORY_M_MAP_NAME) {
        this.processHookData(hook, others);
      }
    }
    if (all?.maxStr === '' && all?.max === 0) {
      all.maxStr = Utils.getByteWithUnit(all?.max);
    }
    if (allHeap?.maxStr === '' && allHeap?.max === 0) {
      allHeap.maxStr = Utils.getByteWithUnit(allHeap?.max);
    }
    if (nativeHeap?.maxStr === '' && nativeHeap?.max === 0) {
      nativeHeap.maxStr = Utils.getByteWithUnit(nativeHeap?.max);
    }
    if (arktsHeap?.maxStr === '' && arktsHeap?.max === 0) {
      arktsHeap.maxStr = Utils.getByteWithUnit(arktsHeap?.max);
    }
    if (jsHeap?.maxStr === '' && jsHeap?.max === 0) {
      jsHeap.maxStr = Utils.getByteWithUnit(jsHeap?.max);
    }
    if (kmpHeap?.maxStr === '' && kmpHeap?.max === 0) {
      kmpHeap.maxStr = Utils.getByteWithUnit(kmpHeap?.max);
    }
    if (allAnonymous?.maxStr === '' && allAnonymous?.max === 0) {
      allAnonymous.maxStr = Utils.getByteWithUnit(allAnonymous?.max);
    }
    if (ion?.maxStr === '' && ion?.max === 0) {
      ion.maxStr = Utils.getByteWithUnit(ion?.max);
    }
    if (ashmem?.maxStr === '' && ashmem?.max === 0) {
      ashmem.maxStr = Utils.getByteWithUnit(ashmem?.max);
    }
    if (so?.maxStr === '' && so?.max === 0) {
      so.maxStr = Utils.getByteWithUnit(so?.max);
    }
    if (others?.maxStr === '' && others?.max === 0) {
      others.maxStr = Utils.getByteWithUnit(others?.max);
    }
    if (all !== null) {
      this.updateHookData(all, arr);
    }
    if (allHeap !== null) {
      this.updateHookData(allHeap, arr);
    }
    if (nativeHeap !== null) {
      this.updateHookData(nativeHeap, arr);
    }
    if (arktsHeap !== null) {
      this.updateHookData(arktsHeap, arr);
    }
    if (jsHeap !== null) {
      this.updateHookData(jsHeap, arr);
    }
    if (kmpHeap !== null) {
      this.updateHookData(kmpHeap, arr);
    }
    if (allAnonymous !== null) {
      this.updateHookData(allAnonymous, arr);
    }
    if (ion !== null) {
      this.updateHookData(ion, arr);
    }
    if (ashmem !== null) {
      this.updateHookData(ashmem, arr);
    }
    if (so !== null) {
      this.updateHookData(so, arr);
    }
    if (others !== null) {
      this.updateHookData(others, arr);
    }
  }

  private processHookData(hook: NativeHookMalloc, data: NativeHookStatisticsTableData): void {
    data.totalBytes += hook.allocByte;
    data.totalCount += hook.allocCount;
    data.freeByte += hook.freeByte;
    data.freeCount += hook.freeCount;
    if (hook.max > data.max) {
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
    this.nativeStatisticsTbl!.exportTextHandleMap.set('existingString', (value: NativeHookStatisticsTableData) => {
      return `${value.existing}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('freeByteString', (value) => {
      return `${value.totalBytes - value.existing}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('totalBytesString', (value) => {
      return `${value.totalBytes}`;
    });
    this.nativeStatisticsTbl!.exportTextHandleMap.set('maxStr', (value) => {
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
        nativeStatisticsLeftData: NativeHookStatisticsTableData,
        nativeStatisticsRightData: NativeHookStatisticsTableData,
        column: keyof NativeHookStatisticsTableData,
        sortType: number
      ): number => {
        if (sortType === 1) {
          return (nativeStatisticsLeftData[column] as number) - (nativeStatisticsRightData[column] as number);
        } else {
          return (nativeStatisticsRightData[column] as number) - (nativeStatisticsLeftData[column] as number);
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
        compareFunction(leftData, rightData, sortColumnKey as keyof NativeHookStatisticsTableData, nmStatSort)
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
