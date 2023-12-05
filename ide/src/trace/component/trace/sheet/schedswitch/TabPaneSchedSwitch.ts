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

import { log } from 'console';
import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { LitButton } from '../../../../../base-ui/button/LitButton.js';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table.js';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { querySchedThreadStates, querySingleCutData, queryLoopCutData } from '../../../../database/SqlLite.js';
import { Utils } from '../../base/Utils.js';
import { resizeObserver } from '../SheetUtils.js';
import { LitChartColumn } from '../../../../../base-ui/chart/column/LitChartColumn.js';
import { TableNoData } from '../../../schedulingAnalysis/TableNoData.js';
import { getProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon.js';
import { SchedSwitchStack, schedThreadInitData } from '../../../../bean/SchedSwitchStruet.js';
import { SegMenTaTion } from '../../../../../trace/component/chart/SpSegmentationChart.js'


@element('tabpane-schedswitch')
export class TabPaneSchedSwitch extends BaseElement {
    private schedSwitchTbl: LitTable | null | undefined;
    private threadQueryDIV: Element | null | undefined;
    private rightDIV: HTMLDivElement | null | undefined;
    private threadIdInput: HTMLInputElement | null | undefined;
    private funcNameInput: HTMLInputElement | null | undefined;
    private singleBtn: LitButton | null | undefined;
    private loopBtn: LitButton | null | undefined;
    private cycleALeftInput: HTMLInputElement | null | undefined;
    private cycleARightInput: HTMLInputElement | null | undefined;
    private cycleBLeftInput: HTMLInputElement | null | undefined;
    private cycleBRightInput: HTMLInputElement | null | undefined;
    private queryButton: LitButton | null | undefined;
    private threadFlag: string = '';
    private selectionParam: SelectionParam | undefined;
    private canvansName: HTMLDivElement | null | undefined;
    private singleSourceData: Array<any> = [];
    private loopSourceData: Array<any> = [];
    private chartTotal: LitChartColumn | null | undefined;
    private histogramSource: Array<any> = [];
    private rangeA: object = {};
    private rangeB: object = {};
    private rangeTotal: object = {};
    private clickThreadChildren: Array<any> = [];
    private isThreadStatesData: boolean = false;
    private clickHighlightCondition: string = '';


    set data(threadStatesParam: SelectionParam | any) {
        if (this.selectionParam === threadStatesParam) return;
        let tblVal: any = this.schedSwitchTbl;
        let threadIdInput: any = this.threadIdInput;
        let funcNameInput: any = this.funcNameInput;
        this.schedSwitchTbl!.recycleDataSource = [];
        this.queryButton!.style.pointerEvents = 'none';
        this.schedSwitchTbl!.loading = false;
        this.isThreadStatesData = false;
        tblVal.value = [];
        threadIdInput.value = '';
        funcNameInput.value = '';
        funcNameInput.style.border = '1px solid rgb(151,151,151)';
        threadIdInput.style.border = '1px solid rgb(151,151,151)';
        this.selectionParam = threadStatesParam;
        this.canvansName!.textContent = 'sched switch平均分布图';
        this.isQueryButtonClick(false);
        this.isSingleButtonFn(false);
        this.isLoopButtonFn(false);
        this.isCanvansDisplayFn(false);
    }
    initElements(): void {
        this.schedSwitchTbl = this.shadowRoot!.querySelector<LitTable>('#tb-running');
        this.threadQueryDIV = this.shadowRoot?.querySelector('#data-cut');
        this.rightDIV = this.shadowRoot?.querySelector('#right');
        this.canvansName = this.shadowRoot!.querySelector<HTMLDivElement>('.sched-subheading');
        this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_total');
        this.threadIdInput = this.shadowRoot?.getElementById('cut-threadid') as HTMLInputElement;
        this.funcNameInput = this.shadowRoot?.querySelector('#cut-thread-func') as HTMLInputElement;
        this.singleBtn = this.shadowRoot?.querySelector<LitButton>('.single-btn');
        this.loopBtn = this.shadowRoot?.querySelector<LitButton>('.loop-btn');
        this.cycleALeftInput = this.shadowRoot?.getElementById('leftA') as HTMLInputElement;
        this.cycleARightInput = this.shadowRoot?.getElementById('rightA') as HTMLInputElement;
        this.cycleBLeftInput = this.shadowRoot?.getElementById('leftB') as HTMLInputElement;
        this.cycleBRightInput = this.shadowRoot?.getElementById('rightB') as HTMLInputElement;
        this.queryButton = this.shadowRoot?.querySelector<LitButton>('.query-btn');
        this.singleBtn?.addEventListener('click', (e) => { this.queryCutInfoFn(this.singleBtn!.innerHTML) });
        this.loopBtn?.addEventListener('click', (e) => { this.queryCutInfoFn(this.loopBtn!.innerHTML) });
        this.queryButton!.addEventListener('click', (e) => { this.queryCycleRangeData() });
        this.schedSwitchTbl!.addEventListener('row-click', (evt: any) => {
            let data = evt.detail.data as SchedSwitchStack;
            if (data.level == 'process') {
                this.isCanvansDisplayFn(false);
                this.threadFlag = '';
            } else if (data.level == 'thread') {
                this.cycleALeftInput!.value = '';
                this.cycleARightInput!.value = '';
                this.cycleBLeftInput!.value = '';
                this.cycleBRightInput!.value = '';
                this.histogramSource = [];
                this.clickThreadChildren = data.children;
                this.queryButton!.style.pointerEvents = 'none';
                this.isCanvansDisplayFn(true);
                this.isQueryButtonClick(false);
                this.threadFlag = 'thread';
                this.clickHighlightCondition = `${data.process} - ${data.pid} - ${data.thread} - ${data.tid}`;
                this.rangeTotal = {
                    count: evt.detail.count,
                    cycleNum: evt.detail.cycleNum,
                    average: evt.detail.cycleNum ? Math.ceil(evt.detail.count / evt.detail.cycleNum) : 0,
                    size: 'Total',
                    isHover: false,
                    color: '#2f72f8'
                };
                this.histogramSource.push(this.rangeTotal);
                data.isSelected = true;
                this.schedSwitchTbl!.clearAllSelection(data);
                this.schedSwitchTbl!.setCurrentSelection(data);
                // SegMenTaTion.setChartData('SCHED-SWITCH', evt.detail.children);
                this.queryHistogramData()
            } else if (data.level == 'cycle') {
                if (this.threadFlag == 'thread') {
                    this.isCanvansDisplayFn(true);
                }
                if (this.clickHighlightCondition == `${data.process} - ${data.pid} - ${data.thread} - ${data.tid}`) {
                    data.isSelected = true;
                    this.schedSwitchTbl!.clearAllSelection(data);
                    this.schedSwitchTbl!.setCurrentSelection(data);
                    // SegMenTaTion.tabHover('SCHED-SWITCH', true, data!.cycle);
                }
            }
        })
        this.cycleALeftInput!.addEventListener('input', (evt: any) => {
            this.checkInputRangeFn(this.cycleALeftInput, this.cycleARightInput, this.cycleBLeftInput, this.cycleBRightInput, this.cycleALeftInput!.value, this.cycleARightInput!.value)
        })
        this.cycleARightInput!.addEventListener('input', (evt: any) => {
            this.checkInputRangeFn(this.cycleARightInput, this.cycleALeftInput, this.cycleBLeftInput, this.cycleBRightInput, this.cycleALeftInput!.value, this.cycleARightInput!.value)
        })
        this.cycleBLeftInput!.addEventListener('input', (evt: any) => {
            this.checkInputRangeFn(this.cycleBLeftInput, this.cycleBRightInput, this.cycleALeftInput, this.cycleARightInput, this.cycleBLeftInput!.value, this.cycleBRightInput!.value)
        })
        this.cycleBRightInput!.addEventListener('input', (evt: any) => {
            this.checkInputRangeFn(this.cycleBRightInput, this.cycleBLeftInput, this.cycleALeftInput, this.cycleARightInput, this.cycleBLeftInput!.value, this.cycleBRightInput!.value)
        })
    }

    checkInputRangeFn(firstInput: any, secondInput: any, thirdInput: any, fourInput: any, lVal: string, rVal: string): void {
        let leftVal = Number(lVal);
        let rightVal = Number(rVal);
        if (firstInput!.value != '' && secondInput!.value != '') {
            if (firstInput!.value != '' && secondInput!.value != '') {
                if (leftVal >= rightVal) {
                    firstInput!.style.color = 'red';
                    this.queryButton!.style.pointerEvents = 'none';
                    this.isQueryButtonClick(false);
                } else if (leftVal < rightVal) {
                    firstInput!.style.color = 'black';
                    secondInput!.style.color = 'black';
                    this.queryButton!.style.pointerEvents = 'auto';
                    this.isQueryButtonClick(true);
                }
            }
        } else if ((firstInput.value == '' && secondInput!.value != '') || (firstInput!.value != '' && secondInput!.value == '')) {
            this.queryButton!.style.pointerEvents = 'none';
            this.isQueryButtonClick(false);
        } else if (firstInput!.value == '' && secondInput!.value == '' && thirdInput!.value != '' && fourInput!.value != '') {
            this.queryButton!.style.pointerEvents = 'auto';
            this.isQueryButtonClick(true);
        }
    }

    async initThreadStateData(threadParam: SelectionParam | null | undefined): Promise<void> {
        let leftStartNs = threadParam!.leftNs + threadParam!.recordStartNs;
        let rightEndNs = threadParam!.rightNs + threadParam!.recordStartNs;
        let res = await querySchedThreadStates(threadParam!.threadIds, leftStartNs, rightEndNs);
        if (res.length == 0) {
            this.schedSwitchTbl!.recycleDataSource = [];
            this.schedSwitchTbl!.loading = false;
            this.clickTreeTitleFn(this.schedSwitchTbl!.recycleDataSource);
            return
        }
        this.singleSourceData = JSON.parse(JSON.stringify(res));
        this.loopSourceData = JSON.parse(JSON.stringify(res));
        this.isThreadStatesData = true;
    }

    async queryCutInfoFn(btnHtml: string): Promise<void> {
        let threadId = this.threadIdInput!.value.trim();
        let threadFunName = this.funcNameInput!.value.trim();
        let leftStartNs = this.selectionParam!.leftNs + this.selectionParam!.recordStartNs;
        let rightEndNs = this.selectionParam!.rightNs + this.selectionParam!.recordStartNs;
        let cutData: Array<any> = [];
        let tblVal: any = this.schedSwitchTbl;
        this.threadFlag = '';
        if (threadId != "" && threadFunName != "") {
            this.threadIdInput!.style.border = '1px solid rgb(151,151,151)';
            this.funcNameInput!.style.border = '1px solid rgb(151,151,151)';
            tblVal!.value = [];
            this.isCanvansDisplayFn(false);
            this.schedSwitchTbl!.loading = true;
            if (!this.isThreadStatesData) this.initThreadStateData(this.selectionParam);
            if (btnHtml == 'Single') {
                this.isSingleButtonFn(true);
                this.isLoopButtonFn(false);
                let res = await querySingleCutData(threadFunName, threadId, leftStartNs, rightEndNs);
                if (res.length == 0) {
                    this.schedSwitchTbl!.recycleDataSource = [];
                    this.schedSwitchTbl!.loading = false;
                    this.clickTreeTitleFn(this.schedSwitchTbl!.recycleDataSource);
                    return
                };
                for (let idx = 0; idx < res.length; idx++) {
                    for (let i = 0; i < this.singleSourceData.length; i++) {
                        let singleItem = this.singleSourceData[i]
                        if (!(singleItem.endTs < res[idx].cycleStartTime || singleItem.ts > res[idx].cycleEndTime)) {
                            let info = {
                                pid: singleItem.pid,
                                tid: singleItem.tid,
                                state: singleItem.state,
                                cycleStartTime: res[idx].cycleStartTime,
                                cycleEndTime: res[idx].cycleEndTime,
                                name: res[idx].name,
                                funId: res[idx].id,
                                runningCnt: singleItem.state == 'Running' ? 1 : 0,
                            }
                            cutData.push(info)
                        }
                    }
                }
            };
            if (btnHtml == 'Loop') {
                this.isLoopButtonFn(true);
                this.isSingleButtonFn(false);
                this.schedSwitchTbl!.loading = true;
                let res = await queryLoopCutData(threadFunName, threadId, leftStartNs, rightEndNs);
                if (res.length == 0) {
                    this.schedSwitchTbl!.recycleDataSource = [];
                    this.schedSwitchTbl!.loading = false;
                    this.clickTreeTitleFn(this.schedSwitchTbl!.recycleDataSource);
                    return
                };
                for (let idx = 0; idx < res.length - 1; idx++) {
                    res[idx].cycleEndTime = res[idx + 1].cycleStartTime;
                    for (let i = 0; i < this.loopSourceData.length; i++) {
                        let loopItem = this.loopSourceData[i]
                        if (!(loopItem.endTs < res[idx].cycleStartTime || loopItem.ts > res[idx].cycleEndTime)) {
                            let info = {
                                pid: loopItem.pid,
                                tid: loopItem.tid,
                                state: loopItem.state,
                                cycleStartTime: res[idx].cycleStartTime,
                                cycleEndTime: res[idx + 1].cycleStartTime,
                                name: res[idx].name,
                                funId: res[idx].id,
                                runningCnt: loopItem.state == 'Running' ? 1 : 0,
                            }
                            cutData.push(info)
                        }
                    }
                }
            };
            this.handleSchedThreadData(cutData)
        } else {
            if (threadId == "") {
                this.threadIdInput!.style.border = '2px solid rgb(255,0,0)';
                this.threadIdInput!.setAttribute('placeholder', 'Please input thread id');
            } else {
                this.threadIdInput!.style.border = '1px solid rgb(151,151,151)';
            };
            if (threadFunName == '') {
                this.funcNameInput!.style.border = '2px solid rgb(255,0,0)';
                this.funcNameInput!.setAttribute('placeholder', 'Please input function name');
            } else {
                this.funcNameInput!.style.border = '1px solid rgb(151,151,151)';
            }
        }
    }

    handleSchedThreadData(result: Array<schedThreadInitData>): void {
        let resultData: Array<any> = [];
        if (result != null && result.length > 0) {
            for (let e of result) {
                if (this.selectionParam!.processIds.includes(e.pid)) {
                    let process = Utils.PROCESS_MAP.get(e.pid);
                    let thread = Utils.THREAD_MAP.get(e.tid);
                    e.process = process == null || process.length == 0 ? '[NULL]' : process;
                    e.thread = thread == null || thread.length == 0 ? '[NULL]' : thread;
                    e.dur = e.cycleEndTime - e.cycleStartTime;
                    e.leftNS = e.cycleStartTime - this.selectionParam!.recordStartNs;
                    resultData.push(e);
                }
            }
            this.translateIntoTreeData(resultData);
        }
    }

    translateIntoTreeData(data: Array<schedThreadInitData>): void {
        let group: any = {};
        if (data != null && data.length > 0) {
            data.forEach((slice: any) => {
                let item = {
                    title: `${slice.thread}`,
                    count: slice.runningCnt,
                    cycleNum: 1,
                    state: slice.state,
                    tid: slice.tid,
                    pid: slice.pid,
                    thread: slice.thread,
                    process: slice.process,
                    cycleStartTime: slice.leftNS,
                    duration: slice.dur,
                    level: 'cycle',
                };
                if (group[`${slice.pid}`]) {
                    let process = group[`${slice.pid}`];
                    process.count += slice.runningCnt;
                    let thread = process.children.find((child: any) => child.title === `${slice.thread}` + `[${slice.tid}]`);
                    if (thread) {
                        thread.count += slice.runningCnt;
                        let cycle = thread.children.find((child: any) => child.cycleStartTime === slice.leftNS);
                        if (cycle) {
                            cycle.count += slice.runningCnt;
                        } else {
                            thread.cycleNum += 1;
                            process.cycleNum += 1;
                            thread.duration += slice.dur;
                            process.duration += slice.dur;
                            thread.children.push(item);
                        }
                    } else {
                        process.cycleNum += 1;
                        process.duration += slice.dur;
                        process.children.push({
                            title: `${slice.thread}` + `[${slice.tid}]`,
                            count: slice.runningCnt,
                            cycleNum: 1,
                            pid: slice.pid,
                            tid: slice.tid,
                            thread: slice.thread,
                            process: slice.process,
                            duration: slice.dur,
                            level: 'thread',
                            cycleStartTime: '',
                            children: [item]
                        });
                    }
                } else {
                    group[`${slice.pid}`] = {
                        title: `${slice.process}` + `[${slice.pid}]`,
                        count: slice.runningCnt,
                        cycleNum: 1,
                        tid: slice.tid,
                        pid: slice.pid,
                        thread: slice.thread,
                        process: slice.process,
                        duration: slice.dur,
                        level: 'process',
                        cycleStartTime: '',
                        children: [
                            {
                                title: `${slice.thread}` + `[${slice.tid}]`,
                                count: slice.runningCnt,
                                cycleNum: 1,
                                tid: slice.tid,
                                pid: slice.pid,
                                thread: slice.thread,
                                process: slice.process,
                                duration: slice.dur,
                                level: 'thread',
                                cycleStartTime: '',
                                children: [item]
                            },
                        ],
                    };
                }
            });
            group = Object.values(group);
            for (let i = 0; i < group.length; i++) {
                this.addCycleNumber([group[i]]);
            }
            this.schedSwitchTbl!.recycleDataSource = group;
            this.schedSwitchTbl!.loading = false;
            this.clickTreeTitleFn(this.schedSwitchTbl!.recycleDataSource);
        }
    }
    addCycleNumber(groupItem: Array<SchedSwitchStack>): void {
        let flagNumber = 0;
        for (let idx = 0; idx < groupItem.length; idx++) {
            groupItem[idx].duration = (groupItem[idx].duration / 1000000.0).toFixed(3);
            if (!(groupItem[idx].children)) {
                flagNumber += 1;
                groupItem[idx].cycle = flagNumber;
                groupItem[idx].title = `cycle ${flagNumber}-` + groupItem[idx].title;
                groupItem[idx].cycleStartTime = (groupItem[idx].cycleStartTime / 1000000.0).toFixed(3);
            } else {
                this.addCycleNumber(groupItem[idx].children)
            }
        }
    }

    clickTreeTitleFn(data: Array<SchedSwitchStack>): void {
        let labelList = this.schedSwitchTbl!.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
        if (labelList) {
            for (let i = 0; i < labelList.length; i++) {
                let lable = labelList[i].innerHTML;
                labelList[i].addEventListener('click', (e) => {
                    if (lable.includes('Process') && i == 0) {
                        this.schedSwitchTbl!.setStatus(data, false);
                        this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (lable.includes('Thread') && i == 1) {
                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.schedSwitchTbl!.setStatus(item.children, false);
                            }
                        }
                        this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (lable.includes('Cycle') && i == 2) {
                        this.schedSwitchTbl!.setStatus(data, true);
                        this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand)
                    }
                })

            }
        }

    }

    queryCycleRangeData(): void {
        let cycleALeft = this.cycleALeftInput!.value.trim();
        let cycleARight = this.cycleARightInput!.value.trim();
        let cycleBLeft = this.cycleBLeftInput!.value.trim();
        let cycleBRight = this.cycleBRightInput!.value.trim();
        this.histogramSource = [];
        this.histogramSource.push(this.rangeTotal)
        if (cycleALeft != '' && cycleARight != '' && cycleALeft != cycleARight) {
            let countA = 0;
            let rangeFilterA = this.clickThreadChildren.filter((it: any) => Number(it.duration) >= Number(cycleALeft) && Number(it.duration) < Number(cycleARight));
            rangeFilterA.forEach((item: any) => {
                countA += item.count
            })
            this.rangeA = {
                count: countA,
                cycleNum: rangeFilterA.length,
                average: rangeFilterA.length ? Math.ceil(countA / rangeFilterA.length) : 0,
                size: 'Cycle A',
                isHover: false,
                color: '#ffab67'
            }
            this.histogramSource.push(this.rangeA);
        }

        if (cycleBLeft != '' && cycleBRight != '' && cycleBLeft != cycleBRight) {
            let countB = 0;
            let rangeFilterB = this.clickThreadChildren.filter((it: any) => Number(it.duration) >= Number(cycleBLeft) && Number(it.duration) < Number(cycleBRight))
            rangeFilterB.forEach((item: any) => {
                countB += item.count
            })
            this.rangeB = {
                count: countB,
                cycleNum: rangeFilterB.length,
                average: rangeFilterB.length ? Math.ceil(countB / rangeFilterB.length) : 0,
                size: 'Cycle B',
                isHover: false,
                color: '#a285d2'
            }
            this.histogramSource.push(this.rangeB)
        }
        this.queryHistogramData();
    }

    queryHistogramData(): void {
        let source = [];
        source = this.histogramSource.map((it: any, index: number) => {
            let data: any = {
                cycle: it.size,
                average: it.average,
                visible: 1,
                color: it.color,
            };
            return data;
        });
        this.chartTotal!.config = {
            data: source,
            appendPadding: 10,
            xField: 'cycle',
            yField: 'average',
            notSort: true,
            removeUnit: true,
            seriesField: '',
            color: (a) => {
                if (a.cycle === 'Total') {
                    return '#2f72f8';
                } else if (a.cycle === 'Cycle A') {
                    return '#ffab67';
                } else if (a.cycle === 'Cycle B') {
                    return '#a285d2';
                } else {
                    return '#0a59f7';
                }
            },
            tip: (a) => {
                if (a && a[0]) {
                    let tip = '';
                    for (let obj of a) {
                        tip =
                            `${tip}
                                        <div style="display:flex;flex-direction: row;align-items: center;">
                                            <div style="width: 10px;height: 5px;background-color: ${obj.obj.color
                            };margin-right: 5px"></div>
                                            <div>${obj.xLabel}:${obj.obj.average}</div>
                                        </div>
                                    `;
                    }
                    return tip;
                } else {
                    return '';
                }
            },
            label: null,
        };
    }

    isCanvansDisplayFn(flag: boolean): void {
        if (!flag) {
            this.setAttribute('isCanvansDisplay', '')
        } else {
            this.removeAttribute('isCanvansDisplay')
        }
    }

    isSingleButtonFn(flag: boolean): void {
        if (flag) {
            this.setAttribute('isSingleButton', '')
        } else {
            this.removeAttribute('isSingleButton')
        }
    }

    isLoopButtonFn(flag: boolean): void {
        if (flag) {
            this.setAttribute('isLoopButton', '')
        } else {
            this.removeAttribute('isLoopButton')
        }
    }

    isQueryButtonClick(flag: boolean): void {
        if (flag) {
            this.setAttribute('isQueryButton', '')
        } else {
            this.removeAttribute('isQueryButton')
        }
    }

    connectedCallback() {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.schedSwitchTbl!);
    }
    initHtml(): string {
        return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        #data-cut{
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
        #content-section{
            display: flex;
            width: 100%;
        }
        #query-section{
            height: 78px;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            padding: 20px 0px 10px 20px;
        }
        .sched-subheading{
            font-weight: bold;
            text-align: center;
        }
        .labels{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            padding-right: 15px;
        }
        #right {
            height: auto;
            padding-right: 10px;
            flex-grow: 1;
        }
        .range-input {
            width: 120px; 
            height: 18px;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%; 
        }
        #cut-threadid {
            width: 15%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3% 
        }
        #cut-thread-func {
            width: 20%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%
        }
        .hint-label {
            width: 20px;
            height: 10px;
            margin-right: 5px
        }
        .cycle-title {
            display: inline-block;
            width: 61px;
            height: 100%;
        }
        .range {
            display:flex;
            align-items: center;
        }
        .query-btn{
            height: 20px;
            width: 90px;
            border: solid 1px #666666;
            background-color: rgba(0,0,0,0);
            border-radius:10px;
        }
        button:hover{
            background-color:#666666;
            color:white;
        }
        :host([isCanvansDisplay]) #right {
            display: none
        }
        :host([isSingleButton]) .single-btn {
            background-color: #666666;
            color: white
        }
        :host([isLoopButton]) .loop-btn {
            background-color: #666666;
            color: white
        }
        :host([isQueryButton]) .query-btn:hover {
            cursor: pointer;
        }
        </style>
        <div id='data-cut'>
            <input id="cut-threadid" type="text" placeholder="Please input threadId" value='' oninput="this.value=this.value.replace(/\\D/g,'')"/>
            <input id="cut-thread-func" type="text" placeholder="Please input funcName" value='' />
            <div style="width:20%;height: 100%;display:flex;justify-content: space-around;">
                <button class="single-btn cut-button">Single</button>
                <button class="loop-btn cut-button">Loop</button>
            </div>
        </div>
        <div id="content-section">
            <div style="height: auto; width: 60%; overflow: auto">
                <lit-table id="tb-running" style="min-height: 380px; width: 100%" tree>
                    <lit-table-column class="running-percent-column" width="450px" title="Process/Thread/Cycle" data-index="title" key="title" align="flex-start" width="27%" retract>
                    </lit-table-column>
                    <lit-table-column class="running-percent-column" width="1fr" title="Cycle start time(ms)" data-index="cycleStartTime" key="cycleStartTime" align="flex-start">
                    </lit-table-column>
                    <lit-table-column class="running-percent-column" width="1fr" title="Duration(ms)" data-index="duration" key="dur" align="flex-start">
                    </lit-table-column>
                    <lit-table-column class="running-percent-column" width="1fr" title="Count" data-index="count" key="count" align="flex-start">
                    </lit-table-column>
                </lit-table>
            </div>
            <lit-slicer-track ></lit-slicer-track>
            <div id="right">
                <div id="query-section">
                    <div>
                        <span class="cycle-title">Cycle A:</span>
                        <input id="leftA" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="Duration(ms)"/>
                        <span>~</span>
                        <input id="rightA" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="Duration(ms)"/>
                    </div>
                    <div style="display: flex; justify-content: space-between">
                        <div>
                            <span class="cycle-title">Cycle B:</span>
                            <input id="leftB" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="Duration(ms)"/> 
                            <span>~</span>
                            <input id="rightB" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="Duration(ms)"/>
                        </div>
                    <button class="query-btn">Query</button>
                    </div>
                </div>
                <div class="sched-subheading"></div>
                    <lit-chart-column id="chart_total" style="width:100%;height:300px"></lit-chart-column>
                    <div style="height: 30px;width: 100%;display: flex;flex-direction: row;align-items: center;justify-content: center">
                        <div class="labels"><div class="hint-label" style="background-color: #2f72f8"></div>Total</div>
                        <div class="labels"><div class="hint-label" style="background-color: #ffab67"></div>Cycle A</div>
                        <div class="labels"><div class="hint-label" style="background-color: #a285d2"></div>Cycle B</div>
                    </div>
                </div>
            </div>
        </div>
        `
    }
}
