/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import { getGpufreqData, getGpufreqDataCut } from '../../../../database/SqlLite.js';
import { resizeObserver } from '../SheetUtils.js';
import { SliceGroup } from '../../../../bean/StateProcessThread.js';
import { SegMenTaTion } from '../../../chart/SpSegmentationChart.js';

@element('tabpane-gpufreqdatacut')
export class TabPaneGpufreqDataCut extends BaseElement {
    private threadStatesTbl: LitTable | null | undefined;
    private currentSelectionParam: SelectionParam | any;
    private _single: Element | null | undefined;
    private _loop: Element | null | undefined;
    private _threadId: HTMLInputElement | null | undefined;
    private _threadFunc: HTMLInputElement | null | undefined;
    private threadIdValue: string = '';
    private threadFuncName: string = '';
    private initData: Array<SelectionData> = [];

    set data(threadStatesParam: SelectionParam | any) {
        if (this.currentSelectionParam === threadStatesParam) {
            return;
        }
        this.currentSelectionParam = threadStatesParam;
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = true;
        getGpufreqData(threadStatesParam.leftNs, threadStatesParam.rightNs, false).then((result) => {
            if (result != null && result.length > 0) {
                let resultList = JSON.parse(JSON.stringify(result))
                if (result.length == 1) {
                    resultList[0].dur = threadStatesParam.rightNs - threadStatesParam.leftNs
                    resultList[0].count = resultList[0].dur * resultList[0].value 
                } else {
                    resultList[0].dur = resultList[1].startNS - threadStatesParam.leftNs
                    resultList[0].count = resultList[0].dur * resultList[0].value

                    resultList[resultList.length - 1].dur = threadStatesParam.rightNs - resultList[resultList.length - 1].startNS
                    resultList[resultList.length - 1].count = resultList[resultList.length - 1].dur * resultList[resultList.length - 1].value 
                }

                this.initData = resultList
                this.threadStatesTbl!.loading = false;

            } else {
                this.threadStatesTbl!.recycleDataSource = [];
                this.threadStatesTbl!.loading = false;
            }

        })
    }

    initElements(): void {
        this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
        this._single = this.shadowRoot?.querySelector('#single');
        this._loop = this.shadowRoot?.querySelector('#loop');
        this._threadId = this.shadowRoot?.querySelector('#dataCutThreadId');
        this._threadFunc = this.shadowRoot?.querySelector('#dataCutThreadFunc');
        this.threadIdValue = this._threadId!.value.trim();
        this.threadFuncName = this._threadFunc!.value.trim();
        const originalThreadIdStyle = this._threadId!.style.border;
        const originalThreadFuncStyle = this._threadId!.style.border;
        const originalThreadIdPlaceholder = String(this._threadId!.getAttribute('placeholder'));
        const originalThreadFuncPlaceholder = String(this._threadId!.getAttribute('placeholder'));

        //点击single
        this._single?.addEventListener('click', (e) => {
            this.threadIdValue = this._threadId!.value.trim();
            this.threadFuncName = this._threadFunc!.value.trim();
            this.threadStatesTbl!.loading = true;

            this.validationFun(this.threadIdValue, this.threadFuncName, originalThreadIdStyle, originalThreadFuncStyle, originalThreadIdPlaceholder, originalThreadFuncPlaceholder, 'single')

        })

        //点击loop
        this._loop?.addEventListener('click', (e) => {
            this.threadIdValue = this._threadId!.value.trim();
            this.threadFuncName = this._threadFunc!.value.trim();
            this.threadStatesTbl!.loading = true;

            this.validationFun(this.threadIdValue, this.threadFuncName, originalThreadIdStyle, originalThreadFuncStyle, originalThreadIdPlaceholder, originalThreadFuncPlaceholder, 'loop')

        })

        this.threadStatesTbl?.addEventListener('row-click', (event: any) => {
            if (event.detail.level == 2 && event.detail.thread.includes('cycle')) {
                console.log(event.detail.thread)
                SegMenTaTion.tabHover('GPU-FREQ', true, event.detail.data.cycle)
            }
        })
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
        #dataCut{
            display: flex;
            justify-content: space-between;
            width:100%;
            height:20px;
            margin-bottom:2px;
            align-items:center;
        }
        button{
            width:40%;
            height:100%;
            border: solid 1px #666666;
            background-color: rgba(0,0,0,0);
            border-radius:10px;
        }
        button:hover{
            background-color:#666666;
            color:white;
        }
        </style>
        <div id='dataCut'>
            <input id="dataCutThreadId" type="text" style="width: 15%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="请输入线程ID" onkeyup="this.value=this.value.replace(/\\D/g,'')"/>
            <input id="dataCutThreadFunc" type="text" style="width: 20%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="请输入方法名"/>
            <div style="width:20%;height: 100%;display:flex;justify-content: space-around;">
                <button id="single">Single</button>
                <button id="loop">Loop</button>
            </div>
        </div>
        <lit-table id="tb-gpufreq-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="running-percent-column" width="25%" title="All/Cycle/Freq/Thread" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Cycle_st(ms)" data-index="startTime" key="ts" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="consumption(MHz·ms)" data-index="count" key="count" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `
    }

    private validationFun(threadIdValue: string, threadFuncName: string, originalThreadIdStyle: string, originalThreadFuncStyle: string, originalThreadIdPlaceholder: string, originalThreadFuncPlaceholder: string, fun: string) {
        if (threadIdValue == '') {
            this.threadStatesTbl!.loading = false;
            this._threadId!.style.border = '1px solid rgb(255,0,0)';
            this._threadId!.setAttribute('placeholder', 'Please input thread id');
            this.threadStatesTbl!.recycleDataSource = [];
        } else if (threadFuncName == '') {
            this.threadStatesTbl!.loading = false;
            this._threadFunc!.style.border = '1px solid rgb(255,0,0)';
            this._threadFunc!.setAttribute('placeholder', 'Please input function name');
            this.threadStatesTbl!.recycleDataSource = [];
        } else {
            this._threadId!.style.border = originalThreadIdStyle;
            this._threadFunc!.style.border = originalThreadFuncStyle;
            this._threadId!.setAttribute('placeholder', originalThreadIdPlaceholder);
            this._threadFunc!.setAttribute('placeholder', originalThreadFuncPlaceholder);
            if (fun == 'single') {
                getGpufreqDataCut(threadIdValue, threadFuncName, this.currentSelectionParam.leftNs, this.currentSelectionParam.rightNs, true, false).then((result) => {
                    let _initData = JSON.parse(JSON.stringify(this.initData))
                    this.dataCutFun(_initData, result)
                })
            }
            if (fun == 'loop') {
                getGpufreqDataCut(threadIdValue, threadFuncName, this.currentSelectionParam.leftNs, this.currentSelectionParam.rightNs, false, true).then((result) => {
                    let _initData = JSON.parse(JSON.stringify(this.initData))
                    this.dataCutFun(_initData, result)
                })
            }

        }
    }

    private dataCutFun(initData: Array<any>, dataCut: Array<any>) {
        let earliest: number = 0
        let selectGpufreqData = new Array();
        if (initData.length > 0 && dataCut.length > 0) {
            let lastList = <any>[]
            getGpufreqData(this.currentSelectionParam.leftNs, this.currentSelectionParam.rightNs, true).then((result) => {
                if (result.length > 0) {
                    earliest = result[0].startNS
                    let _dataCut = dataCut.filter(i => i.startTime >= earliest);
                    for (let i = 0; i < _dataCut.length; i++) {
                        let e = _dataCut[i];
                        for (let j of initData) {
                            if (e.startTime >= j.startNS && e.startTime <= j.endTime) {
                                if (e.endTime <= j.endTime) {
                                    let obj = {
                                        'startNS': e.startTime,
                                        'endTime': e.endTime,
                                        'dur': e.endTime - e.startTime,
                                        'count': (e.endTime - e.startTime) * j.value,
                                        'ts': e.startTime + this.currentSelectionParam.recordStartNs,
                                        'parentIndex': i,
                                        'thread': j.thread,
                                        'filterId': j.filterId,
                                        'freq': j.freq,
                                        'value': j.value
                                    }
                                    lastList.push(obj)
                                } else {
                                    let obj = {
                                        'startNS': e.startTime,
                                        'endTime': j.endTime,
                                        'dur': j.endTime - e.startTime,
                                        'count': (j.endTime - e.startTime) * j.value,
                                        'ts': e.startTime + this.currentSelectionParam.recordStartNs,
                                        'parentIndex': i,
                                        'thread': j.thread,
                                        'filterId': j.filterId,
                                        'freq': j.freq,
                                        'value': j.value
                                    }
                                    lastList.push(obj)
                                }
                            } else if (e.startTime <= j.startNS && j.endTime <= e.endTime) {
                                let obj = {
                                    'startNS': j.startNS,
                                    'endTime': j.endTime,
                                    'dur': j.endTime - j.startNS,
                                    'count': (j.endTime - j.startNS) * j.value,
                                    'ts': j.startNS + this.currentSelectionParam.recordStartNs,
                                    'parentIndex': i,
                                    'thread': j.thread,
                                    'filterId': j.filterId,
                                    'freq': j.freq,
                                    'value': j.value
                                }
                                lastList.push(obj)
                            }
                            else if (j.startNS <= e.endTime && e.endTime <= j.endTime) {
                                let obj = {
                                    'startNS': j.startNS,
                                    'endTime': e.endTime,
                                    'dur': e.endTime - j.startNS,
                                    'count': (e.endTime - j.startNS) * j.value,
                                    'ts': j.startNS + this.currentSelectionParam.recordStartNs,
                                    'parentIndex': i,
                                    'thread': j.thread,
                                    'filterId': j.filterId,
                                    'freq': j.freq,
                                    'value': j.value
                                }
                                lastList.push(obj)
                            }
                        }
                    }
                    let tree = this.createTree(lastList)
                    selectGpufreqData.push(tree)
                    this.threadStatesTbl!.recycleDataSource = selectGpufreqData;
                    this.threadStatesTbl!.loading = false;
                    this.theadClick(selectGpufreqData)
                } else {
                    this.threadStatesTbl!.recycleDataSource = []
                    this.threadStatesTbl!.loading = false;
                }

            })


        } else {
            this.threadStatesTbl!.recycleDataSource = []
            this.threadStatesTbl!.loading = false;
        }
    }

    private createTree(data: Array<any>) {
        if (data.length > 0) {
            const root = {
                thread: "gpufreq Frequency",
                count: '0',
                freq: '',
                dur: '0',
                percent: '100',
                level: 1,
                children: <any>[],
            };

            const valueMap = <any>{};
            data.forEach((item: any) => {
                const parentIndex = item.parentIndex;
                const freq = item.freq;
                const unit = 1000000
                const kunit= 1000000000000
                item.thread = `${item.thread} Frequency`;
                item.level = 4
                item.dur = (item.dur / unit).toFixed(3)
                item.count = (item.count / kunit).toFixed(3)
                item.freq = (item.freq).toFixed(3)
                if (!valueMap[parentIndex]) {
                    valueMap[parentIndex] = {
                        thread: `cycle ${parentIndex + 1} ${item.thread}`,
                        count: item.count,
                        dur: item.dur,
                        ts: item.ts,
                        startTime: (item.startNS / unit).toFixed(3),
                        startNS: item.startNS,
                        percent: '100',
                        level: 2,
                        cycle: parentIndex + 1,
                        children: <any>[],
                    };
                } else {
                    let fdur = Number(valueMap[parentIndex].dur)
                    let fcount = Number(valueMap[parentIndex].count)
                    let idur = Number(item.dur)
                    let icount = Number(item.count)
                    fdur += idur;
                    valueMap[parentIndex].dur = fdur.toFixed(3);
                    fcount += icount;
                    valueMap[parentIndex].count = fcount.toFixed(3);
                }

                if (!valueMap[parentIndex].children[freq]) {
                    valueMap[parentIndex].children[freq] = {
                        thread: item.thread,
                        count: item.count,
                        gpufreq: item.freq,
                        dur: item.dur,
                        percent: '100',
                        level: 3,
                        children: <any>[],
                    };
                } else {
                    let zdur = Number(valueMap[parentIndex].children[freq].dur)
                    let zcount = Number(valueMap[parentIndex].children[freq].count)
                    let idur = Number(item.dur)
                    let icount = Number(item.count)
                    zdur += idur;
                    valueMap[parentIndex].children[freq].dur = zdur.toFixed(3);
                    zcount += icount;
                    valueMap[parentIndex].children[freq].count = zcount.toFixed(3);
                }
                valueMap[parentIndex].children[freq].children.push(item);

            })
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
            // 移除 key 值 
            root.children.forEach((item: any) => {
                item.children = Object.values(item.children);
            })
            function calculatePercent(node: any) { 
                if (node.count === 0 || node.count === undefined) {
                    return;
                }
                node.percent = (Number(node.count) / Number(root.count) * 100).toFixed(2);

                if (node.children && node.children.length > 0) {
                    node.children.forEach(calculatePercent);
                } else {
                    return;
                }
            }
            calculatePercent(root);

            SegMenTaTion.setChartData('GPU-FREQ', root.children)
            return root;

        } else {
            return {}
        }
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

                    } else if (label.includes('Cycle') && i === 1) {
                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.threadStatesTbl!.setStatus(item.children, false);
                            }
                        }
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);

                    } else if (label.includes('Freq') && i === 2) {
                        for (let item of data) {
                            item.status = true;
                            for (let e of item.children ? item.children : []) {
                                e.status = true;
                                if (e.children != undefined && e.children.length > 0) {
                                    this.threadStatesTbl!.setStatus(e.children, false, 0);
                                }
                            }
                        }

                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);

                    } else if (label.includes('Thread') && i === 3) {
                        this.threadStatesTbl!.setStatus(data, true);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);

                    }
                });
            }
        }

    }

}