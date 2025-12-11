/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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
import { queryHeapSizeByIpid, queryNativeHookStatistics, queryNativeHookStatisticsMalloc, queryNativeHookStatisticsSubType } from '../../../../database/sql/gpuMemory.sql';
import { SpGpuMemoryChart } from '../../../chart/SpGpuMemoryChart';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { TabPaneGMSampleList } from './TabPaneGMSampleList';

@element('tabpane-gpu-statistics')
export class TabPaneGMStatstics extends BaseElement {
    private gpuStatisticsTbl: LitTable | null | undefined;
    private gpuType: Array<string> = ['Graphic Memory', 'VulKan', 'OpenGLES', 'OpenCL'];
    private gpuStatisticsSource: Array<NativeHookStatisticsTableData> = [];
    private currentSelection: SelectionParam | undefined;
    private currentSelectIPid = 1;
    private allMax: number = 0;
    private sortColumn: string = '';
    private sortType: number = 0;

    set data(gpuStatisticsParam: SelectionParam) {
        if (gpuStatisticsParam === this.currentSelection) {
            return;
        }
        this.currentSelectIPid = gpuStatisticsParam.gpuMemoryCurrentIPid;
        this.currentSelection = gpuStatisticsParam;
        this.allMax = 0;
        TabPaneGMSampleList.clearData();
        this.recordEventHeap(gpuStatisticsParam.gpuMemoryCurrentIPid);
        if (gpuStatisticsParam.gpuMemory.length > 0) {
            Utils.getInstance().setGpuCurrentSelectIPid(this.currentSelectIPid);
            Utils.getInstance().initGpuResponseTypeList(gpuStatisticsParam);
        }
        if (this.gpuStatisticsTbl) {
            // @ts-ignore
            this.gpuStatisticsTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 25
                }px`;
            // @ts-ignore
            this.gpuStatisticsTbl.recycleDataSource = [];
        }
        this.gpuStatisticsTbl!.loading = true;
        this.queryData(gpuStatisticsParam);
    }

    async recordEventHeap(ipid: number): Promise<void> {
        SpGpuMemoryChart.EVENT_HEAP = await queryHeapSizeByIpid(ipid);
        SpGpuMemoryChart.EVENT_HEAP.map((heap) => {
            this.allMax += heap.sumHeapSize;
        });
    }

    queryData(gpuStatisticsParam: SelectionParam): void {
        Promise.all([
            queryNativeHookStatistics(gpuStatisticsParam.leftNs, gpuStatisticsParam.rightNs, this.currentSelectIPid),
            queryNativeHookStatisticsSubType(
                gpuStatisticsParam.leftNs,
                gpuStatisticsParam.rightNs,
                this.currentSelectIPid
            ),
            queryNativeHookStatisticsMalloc(
                gpuStatisticsParam.leftNs,
                gpuStatisticsParam.rightNs,
                this.currentSelectIPid
            ),
        ]).then((values) => {
            this.gpuStatisticsTbl!.loading = false;
            let arr: Array<NativeHookStatisticsTableData> = [];
            this.setMemoryTypeData(gpuStatisticsParam, values[0], arr);
            let typeFilter = [];
            for (let type of gpuStatisticsParam.gpuMemory) {
                if (type === 'Graphic Memory') {
                    typeFilter = [0, 1, 2, 3];
                    break;
                } else if (type === 'VulKan') {
                    typeFilter.push(1);
                } else if (type === 'OpenGLES') {
                    typeFilter.push(2);
                } else {
                    typeFilter.push(3);
                }
            }
            this.setSubTypeTableData(values[1], arr, typeFilter);
            this.setMallocTableData(values[2], arr, typeFilter);
            this.gpuStatisticsSource = this.mergeMemoryData(arr);
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
              totalCount: mergedItem.totalCount
            };
          });
        }

    setMallocTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>, types: Array<number>): void {
        result.map((malloc) => {
            let data = new NativeHookStatisticsTableData();
            if (malloc.eventType === 'GPU_VK_Alloc_Event') {
                data.memoryTap = `VulKan ${Utils.getByteWithUnit(malloc.heapSize)}`;
            } else if (malloc.eventType === 'GPU_GLES_Alloc_Event') {
                data.memoryTap = `OpenGLES ${Utils.getByteWithUnit(malloc.heapSize)}`;
            } else if (malloc.eventType === 'GPU_CL_Alloc_Event') {
                data.memoryTap = `OpenCL ${Utils.getByteWithUnit(malloc.heapSize)}`;
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
            if (types && types.length > 0) {
                const sortedTypes: number[] = [...new Set(types)].sort((a, b) => a - b);
                if (sortedTypes.includes(0)) {
                    arr.push(data);
                } else {
                    if (sortedTypes.includes(1) && malloc.eventType === 'GPU_VK_Alloc_Event') arr.push(data);
                    if (sortedTypes.includes(2) && malloc.eventType === 'GPU_GLES_Alloc_Event') arr.push(data);
                    if (sortedTypes.includes(3) && malloc.eventType === 'GPU_CL_Alloc_Event') arr.push(data);
                }
            }
        });
    }

    setSubTypeTableData(result: Array<NativeHookMalloc>, arr: Array<NativeHookStatisticsTableData>, types: Array<number>): void {
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
                if (types && types.length > 0) {
                    const sortedTypes: number[] = [...new Set(types)].sort((a, b) => a - b);
                    if (sortedTypes.includes(0)) {
                        arr.push(data);
                    } else {
                        if (sortedTypes.includes(1) && sub.eventType === 'GPU_VK_Alloc_Event') arr.push(data);
                        if (sortedTypes.includes(2) && sub.eventType === 'GPU_GLES_Alloc_Event') arr.push(data);
                        if (sortedTypes.includes(3) && sub.eventType === 'GPU_CL_Alloc_Event') arr.push(data);
                    }
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
        let vk: NativeHookStatisticsTableData | null = null;
        let OG: NativeHookStatisticsTableData | null = null;
        let OC: NativeHookStatisticsTableData | null = null;
        if (val.gpuMemory.indexOf(this.gpuType[0]) !== -1) {
            all = new NativeHookStatisticsTableData();
            all.memoryTap = this.gpuType[0];
        }
        if (val.gpuMemory.indexOf(this.gpuType[1]) !== -1) {
            vk = new NativeHookStatisticsTableData();
            vk.memoryTap = this.gpuType[1];
        }
        if (val.gpuMemory.indexOf(this.gpuType[2]) !== -1) {
            OG = new NativeHookStatisticsTableData();
            OG.memoryTap = this.gpuType[2];
        }
        if (val.gpuMemory.indexOf(this.gpuType[3]) !== -1) {
            OC = new NativeHookStatisticsTableData();
            OC.memoryTap = this.gpuType[3];
        }
        for (let hook of result) {
            if (all !== null) {
                this.processHookData(hook, all);
            }
            if (vk !== null && hook.eventType === 'GPU_VK_Alloc_Event') {
                this.processHookData(hook, vk);
            }
            if (OG !== null && hook.eventType === 'GPU_GLES_Alloc_Event') {
                this.processHookData(hook, OG);
            }
            if (OC !== null && hook.eventType === 'GPU_CL_Alloc_Event') {
                this.processHookData(hook, OC);
            }
        }
        if (all?.maxStr === '' && all?.max === 0) {
            all.maxStr = Utils.getByteWithUnit(all?.max);
        }
        if (vk?.maxStr === '' && vk?.max === 0) {
            vk.maxStr = Utils.getByteWithUnit(vk?.max);
        }
        if (OG?.maxStr === '' && OG?.max === 0) {
            OG.maxStr = Utils.getByteWithUnit(OG?.max);
        }
        if (OC?.maxStr === '' && OC?.max === 0) {
            OC.maxStr = Utils.getByteWithUnit(OC?.max);
        }
        if (all !== null) {
            this.updateHookData(all, arr);
        }
        if (vk !== null) {
            this.updateHookData(vk, arr);
        }
        if (OG !== null) {
            this.updateHookData(OG, arr);
        }
        if (OC !== null) {
            this.updateHookData(OC, arr);
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
        this.gpuStatisticsTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpu-statstics');
        this.gpuStatisticsTbl!.addEventListener('column-click', (evt) => {
            // @ts-ignore
            this.sortByColumn(evt.detail.key, evt.detail.sort);
        });
        this.gpuStatisticsTbl!.exportTextHandleMap.set('existingString', (value) => {
            // @ts-ignore
            return `${value.existing}`;
        });
        this.gpuStatisticsTbl!.exportTextHandleMap.set('freeByteString', (value) => {
            // @ts-ignore
            return `${value.totalBytes - value.existing}`;
        });
        this.gpuStatisticsTbl!.exportTextHandleMap.set('totalBytesString', (value) => {
            // @ts-ignore
            return `${value.totalBytes}`;
        });
        this.gpuStatisticsTbl!.exportTextHandleMap.set('maxStr', (value) => {
            // @ts-ignore
            return `${value.max}`;
        });
    }

    connectedCallback(): void {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.gpuStatisticsTbl!, 25);
    }

    sortByColumn(gmStatColumn: string, gmStatSort: number): void {
        this.sortColumn = gmStatColumn;
        this.sortType = gmStatSort;
        if (gmStatSort === 0) {
            this.gpuStatisticsTbl!.recycleDataSource = this.gpuStatisticsSource;
        } else {
            let arr = [...this.gpuStatisticsSource];
            let compareFunction = (
                gpuStatisticsLeftData: unknown,
                gpuStatisticsRightData: unknown,
                column: string,
                sortType: number
            ): number => {
                if (sortType === 1) {
                    // @ts-ignore
                    return gpuStatisticsLeftData[column] - gpuStatisticsRightData[column];
                } else {
                    // @ts-ignore
                    return gpuStatisticsRightData[column] - gpuStatisticsLeftData[column];
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
            let sortColumnKey = columnMap[gmStatColumn];
            this.gpuStatisticsTbl!.recycleDataSource = arr.sort((leftData, rightData) =>
                compareFunction(leftData, rightData, sortColumnKey, gmStatSort)
            );
        }
    }
    initHtml(): string {
        return `
    <style>
    .gm-stat-tbl {
        height: auto
    }
    :host{
        display: flex;
        flex-direction: column;
        padding: 10px 10px;
    }
    </style>
    <lit-table id="tb-gpu-statstics" class="nm-stat-tbl">
        <lit-table-column class="gm-stat-column" width="25%" title="Memory Type" 
        data-index="memoryTap" key="memoryTap"  align="flex-start"></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="Existing" 
        data-index="existingString" key="existingString"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="# Existing" 
        data-index="allocCount" key="allocCount"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="Transient" 
        data-index="freeByteString" key="freeByteString"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="# Transient" 
        data-index="freeCount" key="freeCount"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="Total Bytes" 
        data-index="totalBytesString" key="totalBytesString"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="# Total" 
        data-index="totalCount" key="totalCount"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="1fr" title="Peak Value" 
        data-index="maxStr" key="maxStr"  align="flex-start" order></lit-table-column>
        <lit-table-column class="gm-stat-column" width="160px" title="Existing / Total" 
        data-index="existingValue" key="existingValue"  align="flex-start" >
        <template><tab-progress-bar data="{{existingValue}}"></tab-progress-bar></template>
        </lit-table-column>
    </lit-table>
            `;
    }

}