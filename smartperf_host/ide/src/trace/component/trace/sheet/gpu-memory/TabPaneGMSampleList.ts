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

import '../../../../../base-ui/table/lit-table-column';
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { NativeHookCallInfo, NativeHookSampleQueryInfo, NativeHookSamplerInfo, NativeMemory } from '../../../../bean/NativeHook';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { queryGpuAllHookData, queryGpuSnapshotTypes } from '../../../../database/sql/gpuMemory.sql';
import { Utils } from '../../base/Utils';
import { SpGpuMemoryChart } from '../../../chart/SpGpuMemoryChart';
import { formatRealDateMs, getTimeString } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { procedurePool } from '../../../../database/Procedure';

@element('tabpane-gpu-sample')
export class TabPaneGMSampleList extends BaseElement {
    private currentSelection: SelectionParam | undefined;
    static selectionParam: SelectionParam | undefined = undefined;
    static tblData: LitTable | null | undefined;
    static sampleTbl: LitTable | null | undefined;
    static types: Array<string> = [];
    static gpuType: Array<string> = ['Graphic Memory', 'VulKan', 'OpenGLES', 'OpenCL'];
    static samplerInfoSource: Array<NativeHookSamplerInfo> = [];
    static sampleTypesList: unknown[] = [];
    static tableMarkData: Array<NativeMemory> = [];
    static filter: unknown;
    static sampleTypes: Array<NativeHookSampleQueryInfo> = [];
    static filterSelect: string = '0';

    set data(sampleParam: SelectionParam) {
        if (sampleParam === this.currentSelection) {
            return;
        } // @ts-ignore
        this.currentSelection = sampleParam;
        TabPaneGMSampleList.serSelection(sampleParam);
        this.filterAllList();
    }

    static serSelection(sampleParam: SelectionParam): void {
        if (this.selectionParam !== sampleParam) {
            this.clearData();
            this.selectionParam = sampleParam;
            this.initTypes(sampleParam.gpuMemoryCurrentIPid);
        }
        if (sampleParam.gpuMemory.indexOf(this.gpuType[0]) !== -1) {
            this.types.push("'GPU_VK_Alloc_Event'");
            this.types.push("'GPU_GLES_Alloc_Event'");
            this.types.push("'GPU_CL_Alloc_Event'");
        } else if (sampleParam.gpuMemory.indexOf(this.gpuType[1]) !== -1) {
            this.types.push("'GPU_VK_Alloc_Event'");
        } else if (sampleParam.gpuMemory.indexOf(this.gpuType[2]) !== -1) {
            this.types.push("'GPU_GLES_Alloc_Event'");
        } else if (sampleParam.gpuMemory.indexOf(this.gpuType[3]) !== -1) {
            this.types.push("'GPU_CL_Alloc_Event'");
        }
    }

    static initTypes(ipid: number): void {
        queryGpuSnapshotTypes(ipid).then((result) => {
            if (result.length > 0) {
                this.sampleTypes = result;
            }
        });
    }

    static clearData(): void {
        this.types = [];
        this.samplerInfoSource = [];
        this.tblData!.dataSource = [];
        this.sampleTbl!.recycleDataSource = [];
        TabPaneGMSampleList.sampleTbl!.recycleDataSource = [];
        this.sampleTypesList = [];
        this.tableMarkData = []; // @ts-ignore
        TabPaneGMSampleList.filter!.firstSelect = '0';
    }

    static addSampleData(data: unknown, ipid: number): void {
        // @ts-ignore
        if (TabPaneGMSampleList.tableMarkData.indexOf(data) !== -1) {
            return;
        } // @ts-ignore
        TabPaneGMSampleList.tableMarkData.push(data);
        let rootSample = new NativeHookSamplerInfo();
        rootSample.snapshot = `Snapshot${this.numberToWord(this.samplerInfoSource.length + 1)}`; // @ts-ignore
        rootSample.startTs = data.startTs;
        rootSample.timestamp =
            SpGpuMemoryChart.REAL_TIME_DIF === 0 // @ts-ignore
                ? getTimeString(data.startTs) // @ts-ignore
                : formatRealDateMs(data.startTs + SpGpuMemoryChart.REAL_TIME_DIF); // @ts-ignore
        rootSample.eventId = data.eventId; // @ts-ignore
        rootSample.threadId = data.threadId; // @ts-ignore
        rootSample.threadName = data.threadName;
        this.queryAllHookInfo(data, rootSample, ipid);
    }

    static numberToWord(num: number): string {
        let word = '';
        while (num > 0) {
            let end = num % 26;
            end = end === 0 ? (end = 26) : end;
            word = String.fromCharCode(96 + end) + word;
            num = (num - end) / 26;
        }
        return word.toUpperCase();
    }

    static queryAllHookInfo(data: unknown, rootSample: NativeHookSamplerInfo, ipid: number): void {
        let copyTypes = this.sampleTypes.map((type) => {
            let copyType = new NativeHookSampleQueryInfo();
            copyType.eventType = type.eventType;
            copyType.subType = type.subType;
            return copyType;
        }); // @ts-ignore
        queryGpuAllHookData(data.startTs, ipid).then((gmSamplerHookResult) => {
            if (gmSamplerHookResult.length > 0) {
                let nameGroup: unknown = {};
                copyTypes.forEach((item) => {
                    // @ts-ignore
                    nameGroup[item.eventType] = nameGroup[item.eventType] || []; // @ts-ignore
                    nameGroup[item.eventType].push(item);
                });
                let leftTime =
                    TabPaneGMSampleList.tableMarkData.length === 1
                        ? 0
                        : TabPaneGMSampleList.tableMarkData[TabPaneGMSampleList.tableMarkData.length - 2].startTs;
                gmSamplerHookResult.forEach((item) => {
                    item.threadId = rootSample.threadId;
                    item.threadName = rootSample.threadName; // @ts-ignore
                    if (nameGroup[item.eventType] !== undefined) {
                        if (item.subType === null) {
                            // @ts-ignore
                            this.merageSampleData(leftTime, data.startTs, nameGroup[item.eventType][0], item);
                        } else {
                            // @ts-ignore
                            let filter = nameGroup[item.eventType].filter((type: unknown) => {
                                // @ts-ignore
                                return type.subType === item.subType;
                            });
                            if (filter.length > 0) {
                                // @ts-ignore
                                this.merageSampleData(leftTime, data.startTs, filter[0], item);
                            }
                        }
                    }
                });
                this.updateSampleTypesList(copyTypes);
                this.createTree(nameGroup, rootSample);
                rootSample.tempList = [...rootSample.children];
                this.samplerInfoSource.push(rootSample);
                TabPaneGMSampleList.sampleTbl!.recycleDataSource = TabPaneGMSampleList.samplerInfoSource;
            }
        });
    }

    private static updateSampleTypesList(copyTypes: NativeHookSampleQueryInfo[]): void {
        if (this.sampleTypesList.length > 0) {
            let sampleTypesListElement = this.sampleTypesList[this.sampleTypesList.length - 1]; // @ts-ignore
            sampleTypesListElement.forEach((item: unknown, index: number) => {
                copyTypes[index].current = copyTypes[index].growth;
                if (index < copyTypes.length) {
                    // @ts-ignore
                    copyTypes[index].growth -= item.current; // @ts-ignore
                    copyTypes[index].total -= item.total;
                }
            });
        } else {
            copyTypes.forEach((item: unknown) => {
                // @ts-ignore
                item.current = item.growth;
            });
        }
        this.sampleTypesList.push(copyTypes);
    }

    static merageSampleData(
        leftTime: number,
        startNs: number,
        rootSample: NativeHookSampleQueryInfo,
        merageSample: NativeHookSampleQueryInfo
    ): void {
        if (merageSample.endTs >= startNs) {
            rootSample.growth += merageSample.growth;
        }
        if (merageSample.startTs > leftTime) {
            rootSample.existing++;
            let childSample = new NativeHookSamplerInfo(); //新增最下层的叶子节点
            childSample.snapshot = `0x${merageSample.addr}`;
            childSample.eventId = merageSample.eventId;
            childSample.heapSize = merageSample.growth;
            childSample.growth = Utils.getByteWithUnit(merageSample.growth);
            childSample.totalGrowth = childSample.growth;
            childSample.startTs = merageSample.startTs;
            childSample.timestamp =
                SpGpuMemoryChart.REAL_TIME_DIF === 0
                    ? getTimeString(merageSample.startTs)
                    : formatRealDateMs(merageSample.startTs + SpGpuMemoryChart.REAL_TIME_DIF);
            childSample.threadId = merageSample.threadId;
            childSample.threadName = merageSample.threadName; // @ts-ignore
            (childSample as unknown).existing = '';
            rootSample.children.push(childSample);
        }
        rootSample.total += merageSample.growth;
    }

    startWorker(args: Map<string, unknown>, handler: Function): void {
        procedurePool.submitWithName('logic0', 'gpu-memory-action', args, undefined, (res: unknown) => {
            handler(res);
        });
    }

    setRightTableData(hookSamplerInfo: NativeHookSamplerInfo): void {
        let gmSamplerArgs = new Map<string, unknown>();
        gmSamplerArgs.set('eventId', hookSamplerInfo.eventId);
        gmSamplerArgs.set('actionType', 'memory-stack');
        this.startWorker(gmSamplerArgs, (results: unknown[]) => {
            let source = [];
            if (results.length > 0) {
                let hookCallInfo = new NativeHookCallInfo();
                hookCallInfo.threadId = hookSamplerInfo.threadId;
                hookCallInfo.threadName = hookSamplerInfo.threadName;
                hookCallInfo.symbol = `${hookSamplerInfo.threadName ?? ''}【${hookSamplerInfo.threadId}】`;
                hookCallInfo.type = -1;
                source.push(hookCallInfo);
                source.push(...results);
            }
            // @ts-ignore
            TabPaneGMSampleList.tblData?.dataSource = source;
        });
    }

    initElements(): void {
        TabPaneGMSampleList.sampleTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpu-sample');
        TabPaneGMSampleList.sampleTbl!.addEventListener('row-click', (evt: unknown) => {
            // @ts-ignore
            this.setRightTableData(evt.detail.data);
        });
        TabPaneGMSampleList.tblData = this.shadowRoot?.querySelector<LitTable>('#tb-gpu-data');
        TabPaneGMSampleList.filter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
        this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.setSelectList(TabPaneGMSampleList.gpuType, null, 'Gpu Type');
        this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.getFilterData((data: FilterData) => {
            if (data.firstSelect) {
                TabPaneGMSampleList.filterSelect = data.firstSelect;
                this.filterAllList();
            }
        });// @ts-ignore
        TabPaneGMSampleList.filter!.firstSelect = TabPaneGMSampleList.filterSelect;
        TabPaneGMSampleList.sampleTbl!.exportTextHandleMap.set('totalGrowth', (value) => {
            // @ts-ignore
            return `${value.total}`;
        });
        TabPaneGMSampleList.sampleTbl!.exportTextHandleMap.set('growth', (value) => {
            // @ts-ignore
            return `${value.heapSize}`;
        });
    }

    connectedCallback(): void {
        super.connectedCallback();
        new ResizeObserver((entries) => {
            if (this.parentElement?.clientHeight !== 0) {
                // @ts-ignore
                TabPaneGMSampleList.sampleTbl?.shadowRoot.querySelector('.table').style.height =
                    this.parentElement!.clientHeight - 10 - 31 + 'px';
                TabPaneGMSampleList.sampleTbl?.reMeauseHeight();
                // @ts-ignore
                TabPaneGMSampleList.tblData?.shadowRoot.querySelector('.table').style.height =
                    this.parentElement!.clientHeight - 10 + 'px';
                TabPaneGMSampleList.tblData?.reMeauseHeight();
            }
        }).observe(this.parentElement!);
    }

    static createTree(nameGroup: unknown, rootSample: NativeHookSamplerInfo): void {
        // @ts-ignore
        Object.keys(nameGroup).forEach((key) => {
            let parentSample = new NativeHookSamplerInfo();
            parentSample.snapshot = key; // @ts-ignore
            if (nameGroup[key].length > 0) {
                // @ts-ignore
                nameGroup[key].forEach((child: unknown) => {
                    let childSample = new NativeHookSamplerInfo(); // @ts-ignore
                    childSample.snapshot = child.subType || child.eventType; // @ts-ignore
                    childSample.heapSize = child.growth; // @ts-ignore
                    childSample.growth = Utils.getByteWithUnit(child.growth); // @ts-ignore
                    childSample.total = child.total; // @ts-ignore
                    childSample.totalGrowth = Utils.getByteWithUnit(child.total); // @ts-ignore
                    childSample.existing = child.existing; // @ts-ignore
                    childSample.currentSize = child.current; // @ts-ignore
                    childSample.current = Utils.getByteWithUnit(child.current);
                    childSample.threadName = rootSample.threadName;
                    childSample.threadId = rootSample.threadId;
                    parentSample.merageObj(childSample);
                    if (childSample.snapshot !== parentSample.snapshot) {
                        //根据名称是否一致来判断是否需要添加子节点
                        // @ts-ignore
                        childSample.children.push(...child.children);
                        parentSample.children.push(childSample);
                    } else {
                        // @ts-ignore
                        parentSample.children.push(...child.children);
                    }
                });
            }
            rootSample.merageObj(parentSample);
            rootSample.children.push(parentSample);
        });
    }

    filterAllList(): void {
        TabPaneGMSampleList.samplerInfoSource.forEach((gmRootSample) => {
            gmRootSample.heapSize = 0;
            gmRootSample.existing = 0;
            gmRootSample.total = 0;

            if (TabPaneGMSampleList.filterSelect === '0') {
                gmRootSample.children = [...gmRootSample.tempList];
                gmRootSample.tempList.forEach((parentSample) => {
                    gmRootSample.heapSize += parentSample.heapSize;
                    gmRootSample.existing += parentSample.existing;
                    gmRootSample.total += parentSample.total;
                });
                gmRootSample.growth = Utils.getByteWithUnit(gmRootSample.heapSize);
                gmRootSample.totalGrowth = Utils.getByteWithUnit(gmRootSample.total);
            } else {
                let targetSnapshot = '';
                switch (TabPaneGMSampleList.filterSelect) {
                    case '1':
                        targetSnapshot = 'GPU_VK_Alloc_Event';
                        break;
                    case '2':
                        targetSnapshot = 'GPU_GLES_Alloc_Event';
                        break;
                    case '3':
                        targetSnapshot = 'GPU_CL_Alloc_Event';
                        break;
                    default:
                        targetSnapshot = '';
                }
                const filteredSamples = gmRootSample.tempList.filter(item =>
                    item.snapshot === targetSnapshot
                );
                if (filteredSamples.length > 0) {
                    gmRootSample.children = filteredSamples;
                    filteredSamples.forEach((sample) => {
                        gmRootSample.heapSize += sample.heapSize;
                        gmRootSample.existing += sample.existing;
                        gmRootSample.total += sample.total;
                    });
                    gmRootSample.growth = Utils.getByteWithUnit(gmRootSample.heapSize);
                    gmRootSample.totalGrowth = Utils.getByteWithUnit(gmRootSample.total);
                } else {
                    gmRootSample.children = [];
                    gmRootSample.growth = '';
                    gmRootSample.totalGrowth = '';
                }
            }
        });
        TabPaneGMSampleList.sampleTbl!.recycleDataSource = TabPaneGMSampleList.samplerInfoSource;
    }

    initHtml(): string {
        return `
        <style>
        .gm-sample-tbl {
            height: auto;
        }
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-slicer style="width:100%">
        <div class="gm-sample-content" style="width: 65%">
            <lit-table id="tb-gpu-sample" class="gm-sample-tbl" tree>
                <lit-table-column class="gm-sample-column" width="25%" title="Snapshot" data-index="snapshot" key="snapshot"  align="flex-start"retract>
                </lit-table-column>
                <lit-table-column class="gm-sample-column" width="1fr" title="Timestamp" data-index="timestamp" key="timestamp"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="gm-sample-column" width="1fr" title="Net Growth" data-index="growth" key="growth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="gm-sample-column" width="1fr" title="Total Growth" data-index="totalGrowth" key="totalGrowth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="gm-sample-column" width="1fr" title="# Existing" data-index="existing" key="existing"  align="flex-start"  >
                </lit-table-column>
            </lit-table>
            <tab-pane-filter id="filter" first></tab-pane-filter>
        </div>
        <lit-slicer-track ></lit-slicer-track>
        <lit-table id="tb-gpu-data" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
            <lit-table-column class="gm-sample-column" width="80px" title="" data-index="type" key="type"  align="flex-start" >
                <template>
                    <div v-if=" type === -1 ">Thread:</div>
                    <img src="img/library.png" size="20" v-if=" type === 1 ">
                    <img src="img/function.png" size="20" v-if=" type === 0 ">
                </template>
            </lit-table-column>
            <lit-table-column class="gm-sample-column" width="1fr" title="" data-index="symbol" key="symbol"  align="flex-start">
            </lit-table-column>
        </lit-table>
        </lit-slicer>
        `;
    }
}