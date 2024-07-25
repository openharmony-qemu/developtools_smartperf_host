/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import { type LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { resizeObserver } from '../SheetUtils';
import { queryDmaFenceData } from '../../../../database/sql/dmaFence.sql';
import { DmaFenceDataBean, DmaFenceTreeBean, DmaFenceStringBean } from './DmaFenceBean';

@element('tabpane-dmafrence')
export class TabPaneDmaFence extends BaseElement {
    private dmaFenceTbl: LitTable | null | undefined;
    private currentSelectionParam: SelectionParam | undefined;
    private timeSelection: HTMLLabelElement | null | undefined;
    private finaldmaFenceData: Array<DmaFenceStringBean> = [];
    private sortKey: string = 'name';
    private sortType: number = 0;

    set data(dmaFenceValue: SelectionParam) {
        if (this.currentSelectionParam === dmaFenceValue) {
            return;
        };
        this.currentSelectionParam = dmaFenceValue;
        this.dmaFenceTbl!.recycleDataSource = [];
        this.dmaFenceTbl!.loading = true;
        //@ts-ignore
        this.dmaFenceTbl?.shadowRoot?.querySelector('.table')?.style?.height = this.parentElement!.clientHeight - 45 + 'px';
        queryDmaFenceData(dmaFenceValue.leftNs, dmaFenceValue.rightNs, dmaFenceValue.dmaFenceNameData).then((result: Array<DmaFenceDataBean>) => {
            if (result !== null && result.length > 0) {
                this.dmaFenceTbl!.loading = false;
                let resultList: Array<DmaFenceDataBean> = JSON.parse(JSON.stringify(result));
                this.finaldmaFenceData = this.createTree(resultList);
                this.timeSelection!.innerHTML =
                    'Selection start: ' + (resultList[0].startTime / 1000000).toFixed(3) + ' ms' + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 'Selection extent: ' + ((resultList[resultList.length - 1].endTime / 1000000) - (resultList[0].startTime / 1000000)).toFixed(3) + ' ms';
                this.sortByColumn(this.sortKey, this.sortType, false);
            } else {
                this.dmaFenceTbl!.recycleDataSource = [];
                this.dmaFenceTbl!.loading = false;
                this.timeSelection!.innerHTML =
                    'Selection start: ' + 0 + ' ms' + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 'Selection extent: ' + 0 + ' ms';
            }
        });
    }

    private createTree(data: Array<DmaFenceDataBean>): Array<DmaFenceStringBean> {
        const treeMap = new Map<string, { dur: number; occurrences: number; children: Array<DmaFenceTreeBean> }>();
        data.forEach(item => {
            const timeline = item.timeline;
            const nameBase = item.cat.startsWith('dma_fence_signaled') ? 'fence_signal' : item.cat.split('dma_')[1];
            const name = `${nameBase}(${item.seqno})`;
            const durValue = item.dur / 1000000;

            let timelineRecord = treeMap.get(timeline);
            if (!timelineRecord) {
                timelineRecord = {
                    dur: 0,
                    occurrences: 0,
                    children: []
                };
                treeMap.set(timeline, timelineRecord);
            }

            let node = timelineRecord.children.find(child => child.name === name);
            if (!node) {
                node = {
                    name,
                    dur: durValue,
                    occurrences: 1,
                    average: durValue,
                    status: item.status,
                };
                timelineRecord.children.push(node);
            } else {
                node.dur += durValue;
                node.occurrences += 1;
                node.average = node.dur / node.occurrences;
            }
            timelineRecord.dur += durValue;
            timelineRecord.occurrences += 1;
        });
        const root: DmaFenceTreeBean = {
            name: 'totals',
            dur: 0,
            occurrences: 0,
            children: [],
            average: 0,
            status: false
        };

        // 遍历treeMap来创建子节点，并按timeline分组  
        treeMap.forEach((timelineRecord, timeline) => {
            const timelineAverage = timelineRecord.dur / timelineRecord.occurrences;
            const timelineNode: DmaFenceTreeBean = {
                name: timeline,
                dur: timelineRecord.dur,
                occurrences: timelineRecord.occurrences,
                average: timelineAverage,
                children: timelineRecord.children,
                status: false
            };
            root.dur += timelineNode.dur;
            root.occurrences += timelineNode.occurrences;

            root.children!.push(timelineNode);
        });
        root.average = root.occurrences > 0 ? root.dur / root.occurrences : 0;
        let rootList: Array<DmaFenceStringBean> = this.convertString([root]);
        return rootList;
    }

    private convertString(data: Array<DmaFenceTreeBean>): Array<DmaFenceStringBean> {
        const result: Array<DmaFenceStringBean> = [];
        data.forEach(item => {
            const stringBean: DmaFenceStringBean = {
                name: item.name,
                dur: item.dur.toFixed(3),
                average: item.average.toFixed(3),
                occurrences: String(item.occurrences),
                children: item.children ? this.convertString(item.children) : undefined,
                status: item.status
            };
            result.push(stringBean);
        });
        return result;
    }

    private sortByColumn(key: string, type: number, isExpand: boolean): void {
        let sortObject = JSON.parse(JSON.stringify(this.finaldmaFenceData));
        let sortList: Array<DmaFenceStringBean> = [];
        sortList.push(sortObject[0]);
        if (type === 0) {
            this.dmaFenceTbl!.recycleDataSource = this.finaldmaFenceData;
            this.expandFunction(isExpand, this.finaldmaFenceData);
            return;
        } else {
            sortList.forEach((item) => {
                if (item.children) {
                    item.children.forEach((child) => {
                        if (child.children) {
                            child.children.sort((a, b) => {
                                let aValue: number | string;
                                let bValue: number | string;
                                if (key === 'name') {
                                    aValue = a[key];
                                    bValue = b[key];
                                } else {
                                    // @ts-ignore
                                    aValue = parseFloat(a[key]);
                                    // @ts-ignore
                                    bValue = parseFloat(b[key]);
                                }
                                if (typeof aValue === 'string' && typeof bValue === 'string') {
                                    return type === 1 ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                                    return type === 1 ? aValue - bValue : bValue - aValue;
                                } else {
                                    return 0;
                                }
                            });
                        }
                    });
                }
            });
            this.dmaFenceTbl!.recycleDataSource = sortList;
            this.expandFunction(isExpand, sortList);
        }
    }

    private expandFunction(isExpand: boolean, list: Array<DmaFenceStringBean>): void {
        if (isExpand) {
            this.dmaFenceTbl!.setStatus(list, true);
            this.dmaFenceTbl!.recycleDs = this.dmaFenceTbl!.meauseTreeRowElement(list, RedrawTreeForm.Expand);
        }
    }

    initElements(): void {
        this.dmaFenceTbl = this.shadowRoot?.querySelector<LitTable>('#tb-dmafence-slices');
        this.timeSelection = this.shadowRoot?.querySelector('#time-selection');
        this.dmaFenceTbl!.addEventListener('column-click', (evt) => {
            // @ts-ignore
            this.sortKey = evt.detail.key;
            // @ts-ignore
            this.sortType = evt.detail.sort;
            // @ts-ignore
            this.sortByColumn(evt.detail.key, evt.detail.sort, true);
        });
    }

    connectedCallback(): void {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.dmaFenceTbl!);
    }

    initHtml(): string {
        return `
        <style>
        .dmafence-select-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-selection" class="dmafence-select-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selection start:0.0 ms  Selection extent:0.0 ms</label>
        <lit-table id="tb-dmafence-slices" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column order class="dmafence-slices-column" width='25%' title="Name" data-index="name" key="name" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column order class="dmafence-slices-column" width='1fr' title="Wall Duration(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column order class="dmafence-slices-column" width='1fr' title="Average Wall Duration(ms)" data-index="average" key="average" align="flex-start">
            </lit-table-column>
            <lit-table-column order class="dmafence-slices-column" width='1fr' title="Occurrences" data-index="occurrences" key="occurrences" align="flex-start">
            </lit-table-column>
        </lit-table>
        `;
    }

}