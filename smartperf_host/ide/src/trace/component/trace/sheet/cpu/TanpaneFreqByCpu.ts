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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { queryRunningCpuData, querySelectCpuFreqFilterId } from '../../../../database/sql/Cpu.sql';
import {
    queryCpuFreqUsageData,
    queryCpuFreqFilterId,
} from '../../../../database/sql/Cpu.sql';
import { CpuFreqData, CpuFreqTd, RunningFreqData } from '../frequsage/TabPaneFreqUsageConfig';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { getCpuData } from '../../../../database/sql/CpuAndIrq.sql';
import { TabPaneFreqUsage } from '../frequsage/TabPaneFreqUsage';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-frequency-cpu')
export class TabPaneFreqByCpu extends BaseElement {
    private threadStatesTbl: LitTable | null | undefined;
    static element: TabPaneFreqUsage;
    private selectionParam: SelectionParam | null | undefined;
    private worker: Worker | undefined;
    private sortConsumpowerFlags: number = 0;
    private sortConsumptionFlags: number = 0;
    private sortCpuloadFlags: number = 0;
    private sortDurFlags: number = 0;
    private sortPercentFlags: number = 0;

    set data(frequencySampleValue: SelectionParam) {
        if (frequencySampleValue === this.selectionParam) {
            return;
        }
        // @ts-ignore
        this.selectionParam = frequencySampleValue;
        this.threadStatesTbl!.loading = true;
        this.threadStatesTbl!.recycleDataSource = [];
        this.handleAsyncRequest(frequencySampleValue);
    }

    private async handleAsyncRequest(freqCpuDataValue: SelectionParam): Promise<void> {
        let runningFreqCpuData = await queryRunningCpuData(freqCpuDataValue?.cpus, freqCpuDataValue?.leftNs, freqCpuDataValue?.rightNs);
        // 查询cpu及id信息
        let cpuIdResult: Array<{ id: number; cpu: number }> =
            await queryCpuFreqFilterId();
        // 以键值对形式将cpu及id进行对应，后续会将频点数据与其对应cpu进行整合
        let IdMap: Map<number, number> = new Map();
        let queryId: Array<number> = [];
        let allCpuArray: Array<number> = [];
        for (let i = 0; i < cpuIdResult.length; i++) {
            queryId.push(cpuIdResult[i].id);
            IdMap.set(cpuIdResult[i].id, cpuIdResult[i].cpu);
            allCpuArray.push(cpuIdResult[i].cpu);
        }
        // 通过id去查询频点数据
        let cpuFreqResult: Array<CpuFreqTd> = await queryCpuFreqUsageData(queryId);
        let cpuFreqData: Array<CpuFreqData> = [];
        for (let i of cpuFreqResult) {
            cpuFreqData.push({
                ts: i.startNS + freqCpuDataValue.recordStartNs,
                cpu: IdMap.get(i.filter_id)!,
                value: i.value,
                dur: i.dur,
            });
        }
        const cpuData = await getCpuData(allCpuArray, freqCpuDataValue.leftNs, freqCpuDataValue.rightNs);
        const LEFT_TIME: number = freqCpuDataValue.leftNs + freqCpuDataValue.recordStartNs;
        const RIGHT_TIME: number = freqCpuDataValue.rightNs + freqCpuDataValue.recordStartNs;
        const comPower =
            SpSegmentationChart.freqInfoMapData.size > 0
                ? SpSegmentationChart.freqInfoMapData
                : undefined;
        const args = {
            runData: runningFreqCpuData,
            cpuFreqData: cpuFreqData,
            leftNs: LEFT_TIME,
            rightNs: RIGHT_TIME,
            cpuArray: freqCpuDataValue.cpus,
            comPower: comPower,
            broCpuData: cpuData,
            // @ts-ignore
            recordStartNS: (window as unknown).recordStartNS
        };
        this.worker?.postMessage(args);
        // @ts-ignore
        this.worker.onmessage = (e: MessageEvent): void => {
            let resultArr: Array<RunningFreqData> = e.data;
            this.fixedDeal(resultArr);
            this.threadClick(resultArr);
            // @ts-ignore
            this.threadStatesTbl!.recycleDataSource = resultArr;
            this.threadStatesTbl!.loading = false;
        }
    }

    initElements(): void {
        this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>(
            '#tb-running-percent'
        );
        //开启一个线程
        this.worker = new Worker(new URL('../../../../database/TabPaneCpuUsageWorker', import.meta.url));
    }
    connectedCallback(): void {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.threadStatesTbl!, 20);
      }
    initHtml(): string {
        return `<style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-running-percent" style="height: auto; overflow-x:auto;" tree>
          <lit-table-column class="running-percent-column" width="250px" title="CPU/Thread" data-index="cpuThreadName" key="cpuThreadName" align="flex-start" retract>
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="200px" title="Process" data-index="process" key="process" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="260px" title="Consume(MHz*ms)" data-index="consumption" key="consumption" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="200px" title="Freq(MHz:Cap)" data-index="frequency" key="frequency" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="240px" title="Consume(cap*ms)" data-index="consumpower" key="consumpower" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="100px" title="TaskUtil(%)" data-index="cpuload" key="cpuload" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="200px" title="Dur(ms)" data-index="dur" key="dur" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="140px" title="Dur/All_Dur(%)" data-index="percent" key="percent" align="flex-start">
          </lit-table-column>
        </lit-table>`;
    }
    /**
     * 递归整理数据小数位
     */
    fixedDeal(arr: Array<RunningFreqData>): void {
        if (arr == undefined) {
            return;
        }
        const TIME_MUTIPLE: number = 1000000;
        // KHz->MHz  *  ns->ms
        const CONS_MUTIPLE: number = 1000000000;
        const MIN_PERCENT: number = 2;
        const MIN_FREQ: number = 3;
        const MIN_POWER: number = 6;
        for (let i = 0; i < arr.length; i++) {
            // 若存在空位元素则进行删除处理
            if (arr[i] === undefined) {
                arr.splice(i, 1);
                i--;
                continue;
            }
            if (arr[i].cpu < 0) {
                // @ts-ignore
                arr[i].cpu = '';
            }
            if(arr[i].tid){
                // @ts-ignore
                let threadName = Utils.getInstance().getThreadMap().get(arr[i].tid)?Utils.getInstance().getThreadMap().get(arr[i].tid):'Thread';
                // @ts-ignore
                let processName = Utils.getInstance().getProcessMap().get(arr[i].pid)?Utils.getInstance().getProcessMap().get(arr[i].pid):'Process';
                arr[i].cpuThreadName = `${threadName}[${arr[i].tid}]`;
                arr[i].process = `${processName}[${arr[i].pid}]`;
            }
            // @ts-ignore
            if (arr[i].frequency < 0) {
                arr[i].frequency = '';
            }
            if (!arr[i].cpuload) {
                // @ts-ignore
                arr[i].cpuload = '0.000000';
            } else {
                // @ts-ignore
                arr[i].cpuload = arr[i].cpuload.toFixed(MIN_POWER);
            }
            // @ts-ignore
            arr[i].percent = arr[i].percent.toFixed(MIN_PERCENT);
            // @ts-ignore
            arr[i].dur = (arr[i].dur / TIME_MUTIPLE).toFixed(MIN_FREQ);
            // @ts-ignore
            arr[i].consumption = (arr[i].consumption / CONS_MUTIPLE).toFixed(MIN_FREQ);
            // @ts-ignore
            arr[i].consumpower = (arr[i].consumpower / TIME_MUTIPLE).toFixed(MIN_FREQ);
            if (arr[i].frequency !== '') {
                if (arr[i].frequency === 'unknown') {
                    arr[i].frequency = 'unknown';
                } else {
                    arr[i].frequency = arr[i].frequency;
                }
            }
            this.fixedDeal(arr[i].children!);
        }
    }
    private threadClick(data: Array<RunningFreqData>): void {
        let tabHeads = this.threadStatesTbl?.shadowRoot
            ?.querySelector('.th')!.querySelectorAll('.td');
        if (tabHeads && tabHeads.length) {
            this.restoreFlags();
            tabHeads.forEach((item) => {
                // @ts-ignore
                switch (item.innerText) {
                    case 'Consume(cap*ms)':
                        item.addEventListener('click', () => { this.sortDataTree(data, 'Consume(cap*ms)') });
                        break;
                    case 'Consume(MHz*ms)':
                        item.addEventListener('click', () => { this.sortDataTree(data, 'Consume(MHz*ms)') });
                        break;
                    case 'TaskUtil(%)':
                        item.addEventListener('click', () => { this.sortDataTree(data, 'TaskUtil') });
                        break;
                    case 'Dur(ms)':
                        item.addEventListener('click', () => { this.sortDataTree(data, 'Dur') });
                        break;
                    case 'Dur\n/All_Dur(%)':
                        item.addEventListener('click', () => { this.sortDataTree(data, 'All_Dur') });
                        break;
                }
            })
        }
    }
    restoreFlags() {
        this.sortConsumpowerFlags = 0;
        this.sortConsumptionFlags = 0;
        this.sortCpuloadFlags = 0;
        this.sortDurFlags = 0;
        this.sortPercentFlags = 0;
    }
    sortDataTree(data: Array<RunningFreqData>, type: string) {
        this.threadStatesTbl!.recycleDs = this.sortTree(data, type);
        this.threadStatesTbl!.recycleDs =
            this.threadStatesTbl!.meauseTreeRowElement(
                data,
                RedrawTreeForm.Expand
            );
        switch (type) {
            case 'Consume(cap*ms)':
                this.sortConsumptionFlags = 0;
                this.sortCpuloadFlags = 0;
                this.sortDurFlags = 0;
                this.sortPercentFlags = 0;
                if (this.sortConsumpowerFlags === 2) {
                    this.sortConsumpowerFlags = 0;
                } else {
                    this.sortConsumpowerFlags++;
                }
                break;
            case 'Consume(MHz*ms)':
                this.sortConsumpowerFlags = 0;
                this.sortCpuloadFlags = 0;
                this.sortDurFlags = 0;
                this.sortPercentFlags = 0;
                if (this.sortConsumptionFlags === 2) {
                    this.sortConsumptionFlags = 0;
                } else {
                    this.sortConsumptionFlags++;
                }
                break;
            case 'TaskUtil':
                this.sortConsumpowerFlags = 0;
                this.sortConsumptionFlags = 0;
                this.sortDurFlags = 0;
                this.sortPercentFlags = 0;
                if (this.sortCpuloadFlags === 2) {
                    this.sortCpuloadFlags = 0;
                } else {
                    this.sortCpuloadFlags++;
                }
                break;
            case 'Dur':
                this.sortConsumpowerFlags = 0;
                this.sortConsumptionFlags = 0;
                this.sortCpuloadFlags = 0;
                this.sortPercentFlags = 0;
                if (this.sortDurFlags === 2) {
                    this.sortDurFlags = 0;
                } else {
                    this.sortDurFlags++;
                }
                break;
            case 'All_Dur':
                this.sortConsumpowerFlags = 0;
                this.sortConsumptionFlags = 0;
                this.sortCpuloadFlags = 0;
                this.sortDurFlags = 0;
                if (this.sortPercentFlags === 2) {
                    this.sortPercentFlags = 0;
                } else {
                    this.sortPercentFlags++;
                }
                break;
        }
    }

    sortTree(arr: Array<unknown>, type: string): Array<unknown> {
        if (arr.length > 1) {
            // @ts-ignore
            arr = arr.sort((sortArrA, sortArrB): number => {
                // @ts-ignore
                if (sortArrA.depth === sortArrB.depth) {
                    switch (type) {
                        case 'Consume(cap*ms)':
                            if (this.sortConsumpowerFlags === 0) {
                                //@ts-ignore
                                return Number(sortArrA.consumpower) - Number(sortArrB.consumpower);
                            } else if (this.sortConsumpowerFlags === 1) {
                                //@ts-ignore
                                return Number(sortArrB.consumpower) - Number(sortArrA.consumpower);
                            } else {
                                //@ts-ignore
                                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
                            }
                            break;
                        case 'Consume(MHz*ms)':
                            if (this.sortConsumptionFlags === 0) {
                                //@ts-ignore
                                return Number(sortArrA.consumption) - Number(sortArrB.consumption);
                            } else if (this.sortConsumptionFlags === 1) {
                                //@ts-ignore
                                return Number(sortArrB.consumption) - Number(sortArrA.consumption);
                            } else {
                                //@ts-ignore
                                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
                            }
                            break;
                        case 'TaskUtil':
                            if (this.sortCpuloadFlags === 0) {
                                //@ts-ignore
                                return Number(sortArrA.cpuload) - Number(sortArrB.cpuload);
                            } else if (this.sortCpuloadFlags === 1) {
                                //@ts-ignore
                                return Number(sortArrB.cpuload) - Number(sortArrA.cpuload);
                            } else {
                                //@ts-ignore
                                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
                            }
                            break;
                        case 'Dur':
                            if (this.sortDurFlags === 0) {
                                //@ts-ignore
                                return Number(sortArrA.dur) - Number(sortArrB.dur);
                            } else if (this.sortDurFlags === 1) {
                                //@ts-ignore
                                return Number(sortArrB.dur) - Number(sortArrA.dur);
                            } else {
                                //@ts-ignore
                                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
                            }
                            break;
                        case 'All_Dur':
                            if (this.sortPercentFlags === 0) {
                                //@ts-ignore
                                return Number(sortArrA.percent) - Number(sortArrB.percent);
                            } else if (this.sortPercentFlags === 1) {
                                //@ts-ignore
                                return Number(sortArrB.percent) - Number(sortArrA.percent);
                            } else {
                                //@ts-ignore
                                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
                            }
                            break;
                    }
                }
            })
        }
        arr.map((call: unknown): void => {
            // @ts-ignore
            if (call.children && call.children.length > 1 && call.status) {
                // @ts-ignore
                call.children = this.sortTree(call.children, type);
            }
        })
        return arr;
    }
}