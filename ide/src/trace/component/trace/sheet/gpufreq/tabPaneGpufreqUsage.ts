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

import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table.js';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection.js';
import { getGpufreqData } from '../../../../database/SqlLite.js';
import { resizeObserver } from '../SheetUtils.js';
import { SliceGroup } from '../../../../bean/StateProcessThread.js';

@element('tabpane-gpufreq')
export class TabPaneGpufreq extends BaseElement {
    private threadStatesTbl: LitTable | null | undefined;
    private currentSelectionParam: Selection | undefined;

    set data(clockCounterValue: SelectionParam | any) {
        let dataSource: Array<SelectionData> = [];
        if (this.currentSelectionParam === clockCounterValue) {
            return;
        }
        this.currentSelectionParam = clockCounterValue;
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = true;
        getGpufreqData(clockCounterValue.leftNs, clockCounterValue.rightNs, false).then((result) => {
            if (result != null && result.length > 0) {
                let resultList = JSON.parse(JSON.stringify(result))
                if (result.length == 1) {
                    resultList[0].dur = clockCounterValue.rightNs - clockCounterValue.leftNs
                    resultList[0].count = resultList[0].dur * resultList[0].value
                } else {
                    resultList[0].dur = resultList[1].startNS - clockCounterValue.leftNs
                    resultList[0].count = resultList[0].dur * resultList[0].value

                    resultList[resultList.length - 1].dur = clockCounterValue.rightNs - resultList[resultList.length - 1].startNS
                    resultList[resultList.length - 1].count = resultList[resultList.length - 1].dur * resultList[resultList.length - 1].value 
                }
                let sd: any = this.createTree(resultList);
                dataSource = sd;
                this.threadStatesTbl!.recycleDataSource = dataSource;
                this.threadStatesTbl!.loading = false;
                let List = new Array();
                List.push(...dataSource)
                this.theadClick(List)
            } else {
                this.threadStatesTbl!.recycleDataSource = [];
                this.threadStatesTbl!.loading = false;
            }

        })

    }

    initElements(): void {
        this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
    }

    connectedCallback() {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.threadStatesTbl!);
    }

    initHtml(): string {
        return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-gpufreq-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="gpufreq-percent-column" width='25%' title="All/Freq/Thread" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="consumption(MHz·ms)" data-index="count" key="count" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `
    }

    private createTree(sourceList: Array<any>) {
        let selectGpufreqData = new Array();
        if (sourceList.length > 0) {
            function createTree(data: Array<any>) {
                const root = {
                    thread: "gpufreq Frequency",
                    count: '0',
                    freq: '',
                    dur: '0',
                    percent: '100',
                    children: <any>[],
                };

                const valueMap = <any>{};
                data.forEach((item: any) => {
                    const freq = item.freq;
                    const unit = 1000000
                    const kunit= 1000000000000
                    item.dur = (item.dur / unit).toFixed(3)
                    item.count = (item.count / kunit).toFixed(3)
                    item.freq = (item.freq).toFixed(3)
                    item.thread = `${item.thread} Frequency`
                    if (!valueMap[freq]) {
                        valueMap[freq] = {
                            thread: "gpufreq Frequency",
                            count: item.count,
                            gpufreq: item.freq,
                            dur: item.dur,
                            percent: '100',
                            children: [],
                        };
                    } else {
                        let fdur = Number(valueMap[freq].dur)
                        let fcount = Number(valueMap[freq].count)
                        let idur = Number(item.dur)
                        let icount = Number(item.count)
                        fdur += idur;
                        valueMap[freq].dur = fdur.toFixed(3);
                        fcount += icount;
                        valueMap[freq].count = fcount.toFixed(3);
                    }
                    valueMap[freq].children.push(item);
                });

                function calculatePercent(node: any) {
                    if (node.count === 0 || node.count === undefined) {
                        return;
                    }
                    node.percent = (Number(node.count) / Number(root.count) * 100).toFixed(2);

                    if (node.children && node.children.length > 0) {
                        node.children.forEach(calculatePercent);
                    } else {
                        return
                    }
                }

                Object.values(valueMap).forEach((node: any) => {
                    const parentNode = valueMap[node.value - 1];
                    if (parentNode) {
                        parentNode.children.push(node);
                        let pdur = Number(parentNode.dur)
                        let pcount = Number(parentNode.count)
                        let ndur = Number(node.dur)
                        let ncount = Number(node.count)
                        pdur += ndur;
                        parentNode.dur = pdur.toFixed(3);
                        pcount += ncount;
                        parentNode.count += pcount.toFixed(3);
                    } else {
                        root.children.push(node);
                        let rdur = Number(root.dur)
                        let rcount = Number(root.count)
                        let ndur = Number(node.dur)
                        let ncount = Number(node.count)
                        rdur += ndur;
                        root.dur = rdur.toFixed(3);
                        rcount += ncount;
                        root.count = rcount.toFixed(3);
                    }

                });
                calculatePercent(root);

                return root;
            }
            const tree = createTree(sourceList);
            selectGpufreqData.push(tree)

        }
        return selectGpufreqData
    }

    private theadClick(data: Array<SliceGroup>) {
        let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');

        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i].innerHTML;
                labels[i].addEventListener('click', (e) => {

                    if (label.includes('All') && i === 0) {
                        this.threadStatesTbl!.setStatus(data, false);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);

                    } else if (label.includes('Freq') && i === 1) {

                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.threadStatesTbl!.setStatus(item.children, false);
                            }
                        }
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);

                    } else if (label.includes('Thread') && i === 2) {
                        this.threadStatesTbl!.setStatus(data, true);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
                    }
                });
            }
        }
    }
}