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
}