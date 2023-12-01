import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table.js';
import { Utils } from '../../base/Utils.js';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { BinderGroup, DataSource, FuncNameCycle, BinderColumn } from '../../../../bean/BinderProcessThread.js';
import { querySingleFuncNameCycle, queryBinderByThreadId, queryLoopFuncNameCycle } from '../../../../database/SqlLite.js';
import { resizeObserver } from '../SheetUtils.js';
import { LitChartColumn } from '../../../../../base-ui/chart/column/LitChartColumn.js';
import '../../../../../base-ui/chart/column/LitChartColumn.js';
// import { SegMenTaTion } from '../../../chart/SpSegmentationChart.js';

@element('tabpane-binder-datacut')
export class TabPaneBinderDataCut extends BaseElement {
    private threadBindersTbl: LitTable | null | undefined;
    private currentSelectionParam: SelectionParam | any;
    private threadStatesDIV: Element | null | undefined;
    private cycleARangeArr: BinderGroup[] | undefined;
    private cycleBRangeArr: BinderGroup[] | undefined;
    private cycleAStartRangeDIV: HTMLInputElement | null | undefined;
    private cycleAEndRangeDIV: HTMLInputElement | null | undefined;
    private cycleBStartRangeDIV: HTMLInputElement | null | undefined;
    private cycleBEndRangeDIV: HTMLInputElement | null | undefined;
    private chartTotal: LitChartColumn | null | undefined;
    private dataSource: DataSource[] | undefined;
    private rowCycleData: BinderGroup[] | undefined;
    private funcNameCycleArr: FuncNameCycle[] | undefined;
    private cacheBinderArr: BinderGroup[] | undefined;
    private currentThreadId: string | undefined;

    set data(threadStatesParam: SelectionParam | any) {
        let threadIdDIV = this.shadowRoot!.querySelector('.thread-id-input') as HTMLElement;
        threadIdDIV.style.border = '1px solid rgb(151,151,151)';
        let cycleNameDIV = this.shadowRoot!.querySelector('.cycle-name-input') as HTMLElement;
        cycleNameDIV.style.border = '1px solid rgb(151,151,151)';
        if (this.currentSelectionParam === threadStatesParam) {
            return;
        }
        this.dispalyQueryArea(true);
        this.clickLoop(false);
        this.clickSingle(false);
        this.currentSelectionParam = threadStatesParam;
        this.threadBindersTbl!.recycleDataSource = [];
        this.theadClick(this.threadBindersTbl!.recycleDataSource);
    }

    dispalyQueryArea(b: boolean) {
        if (b) {
            this.setAttribute('dispalyQueryArea', '');
        } else {
            this.removeAttribute('dispalyQueryArea');
        }
    }

    clickSingle(b: boolean) {
        if (b) {
            this.setAttribute('clickSingle', '');
        } else {
            this.removeAttribute('clickSingle');
        }
    }

    clickLoop(b: boolean) {
        if (b) {
            this.setAttribute('clickLoop', '');
        } else {
            this.removeAttribute('clickLoop');
        }
    }

    async dataLoopCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement) {
        this.currentThreadId = '';
        let threadIds = this.currentSelectionParam.threadIds;
        let processIds = this.currentSelectionParam.processIds;
        let threadIdValue = threadId.value.trim();
        let threadFuncName = threadFunc.value.trim();
        let leftNS = this.currentSelectionParam.leftNs;
        let rightNS = this.currentSelectionParam.rightNs;
        if (threadIdValue != '' && threadFuncName != '') {
            // SegMenTaTion.setChartData("BINDER", []);
            this.clickLoop(true);
            this.clickSingle(false);
            this.threadBindersTbl!.loading = true;
            threadId.style.border = '1px solid rgb(151,151,151)';
            threadFunc.style.border = '1px solid rgb(151,151,151)';
            this.funcNameCycleArr = await queryLoopFuncNameCycle(threadFuncName, threadIdValue, leftNS, rightNS);
            let binderArr = await queryBinderByThreadId(processIds, threadIds, leftNS, rightNS);
            if (this.funcNameCycleArr.length !== 0) {
                let binderCutArr = [];
                for (let j = 0; j < this.funcNameCycleArr.length - 1; j++) {
                    this.funcNameCycleArr[j].cycleDur = this.funcNameCycleArr[j + 1].cycleStartTime - this.funcNameCycleArr[j].cycleStartTime;
                    for (let i = 0; i < binderArr.length; i++) {
                        if (binderArr[i].ts > this.funcNameCycleArr[j].cycleStartTime
                            && binderArr[i].ts + binderArr[i].dur < this.funcNameCycleArr[j + 1].cycleStartTime) {
                            // calculate cycle duration
                            binderArr[i].cycleDur = this.funcNameCycleArr[j + 1].cycleStartTime - this.funcNameCycleArr[j].cycleStartTime;
                            binderArr[i].cycleStartTime = this.funcNameCycleArr[j].cycleStartTime;
                            binderArr[i].funcName = this.funcNameCycleArr[j].funcName;
                            binderArr[i].id = this.funcNameCycleArr[j].id;
                            binderArr[i].thread = Utils.THREAD_MAP.get(binderArr[i].tid) || 'Thread';
                            binderArr[i].process = Utils.PROCESS_MAP.get(binderArr[i].pid) || 'Process';
                            binderArr[i].count = 1;
                            binderCutArr.push(binderArr[i]);
                        }
                    }
                }
                let finalCutBinderArr = this.completionCycleName(binderCutArr, 'loop');
                this.threadBindersTbl!.recycleDataSource = this.transferToTreeData(finalCutBinderArr);
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            } else {
                this.threadBindersTbl!.recycleDataSource = [];
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            }
        } else {
            if (threadIdValue == '') {
                threadId.style.border = '1px solid rgb(255,0,0)';
                threadId.setAttribute('placeholder', 'Please input thread id');
            } else {
                threadId.style.border = '1px solid rgb(151,151,151)';
            }

            if (threadFuncName == '') {
                threadFunc.style.border = '1px solid rgb(255,0,0)';
                threadFunc.setAttribute('placeholder', 'Please input function name');
            } else {
                threadFunc.style.border = '1px solid rgb(151,151,151)';
            }
        }
    }

    async dataSingleCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement) {
        this.currentThreadId = '';
        let threadIds = this.currentSelectionParam.threadIds;
        let processIds = this.currentSelectionParam.processIds;
        let threadIdValue = threadId.value.trim();
        let threadFuncName = threadFunc.value.trim();
        let leftNS = this.currentSelectionParam.leftNs;
        let rightNS = this.currentSelectionParam.rightNs;
        if (threadIdValue != '' && threadFuncName != '') {
            // SegMenTaTion.setChartData("BINDER", []);
            this.clickLoop(false);
            this.clickSingle(true);
            threadId.style.border = '1px solid rgb(151,151,151)';
            threadFunc.style.border = '1px solid rgb(151,151,151)';
            this.threadBindersTbl!.loading = true;
            this.funcNameCycleArr = await querySingleFuncNameCycle(threadFuncName, threadIdValue, leftNS, rightNS);
            let binderArr = await queryBinderByThreadId(processIds, threadIds, leftNS, rightNS);
            if (this.funcNameCycleArr.length !== 0) {
                let binderCutArr: BinderGroup[] = [];
                for (let j = 0; j < this.funcNameCycleArr.length; j++) {
                    for (let i = 0; i < binderArr.length; i++) {
                        if (binderArr[i].ts > this.funcNameCycleArr[j].cycleStartTime
                            && binderArr[i].ts + binderArr[i].dur < this.funcNameCycleArr[j].cycleStartTime + this.funcNameCycleArr[j]!.cycleDur) {
                            binderArr[i].cycleDur = this.funcNameCycleArr[j].cycleDur;
                            binderArr[i].cycleStartTime = this.funcNameCycleArr[j].cycleStartTime;
                            binderArr[i].funcName = this.funcNameCycleArr[j].funcName;
                            binderArr[i].id = this.funcNameCycleArr[j].id;
                            binderArr[i].thread = Utils.THREAD_MAP.get(binderArr[i].tid) || 'Thread';
                            binderArr[i].process = Utils.PROCESS_MAP.get(binderArr[i].pid) || 'Process';
                            binderArr[i].count = 1;
                            binderCutArr.push(binderArr[i]);
                        }
                    }
                }

                let finalCutBinderArr = this.completionCycleName(binderCutArr, 'single');
                this.threadBindersTbl!.recycleDataSource = this.transferToTreeData(finalCutBinderArr);
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            } else {
                this.threadBindersTbl!.recycleDataSource = [];
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            }
        } else {
            if (threadIdValue == '') {
                threadId.style.border = '1px solid rgb(255,0,0)';
                threadId.setAttribute('placeholder', 'Please input thread id');
            } else {
                threadId.style.border = '1px solid rgb(151,151,151)';
            }

            if (threadFuncName == '') {
                threadFunc.style.border = '1px solid rgb(255,0,0)';
                threadFunc.setAttribute('placeholder', 'Please input function name');
            } else {
                threadFunc.style.border = '1px solid rgb(151,151,151)';
            }
        }
    }

    completionCycleName(binderCutArr: BinderGroup[], type: string): BinderGroup[] {
        let threadIds: number[] = this.currentSelectionParam.threadIds;
        let threadBinderCutArr: BinderGroup[][] = [];
        let childThreadbinderCutArr: BinderGroup[] = [];
        threadIds.forEach((tid: number, i: number) => {
            childThreadbinderCutArr = [];
            binderCutArr.forEach((binder: BinderGroup) => {
                if (binder.tid === tid) {
                    childThreadbinderCutArr.push(binder)
                }
            })
            if (childThreadbinderCutArr.length > 0) {
                threadBinderCutArr.push(childThreadbinderCutArr);
            }
        })
        // loop data cut need delete last function Name cycle data
        if (type === 'loop') {
            this.funcNameCycleArr?.pop();
        }
        let cloneThreadBinderCutArr: BinderGroup[][] = JSON.parse(JSON.stringify(threadBinderCutArr));
        let binderContainsFuncIdArr: any = [];
        threadBinderCutArr.forEach((binderArr: BinderGroup[], idx: number) => {
            binderArr.forEach((binder: BinderGroup) => {
                if (!binderContainsFuncIdArr.includes(binder.id)) {
                    binderContainsFuncIdArr.push(binder.id);
                }
            })
            // When the cycle data is incomplete
            if (this.funcNameCycleArr!.length !== binderContainsFuncIdArr.length) {
                this.completionAllFname(binderContainsFuncIdArr, idx, cloneThreadBinderCutArr);
            }
            binderContainsFuncIdArr = [];
        })
        cloneThreadBinderCutArr.forEach(arr => {
            arr.sort(this.compare('id'));
        })
        return cloneThreadBinderCutArr.flat();
    }

    completionAllFname(binderContainsFuncIdArr: number[], idx: number, cloneThreadBinderCutArr: BinderGroup[][]) {
        this.funcNameCycleArr!.forEach((it: FuncNameCycle) => {
            if (!binderContainsFuncIdArr.includes(it.id)) {
                let itemData = cloneThreadBinderCutArr[idx][0];
                let item: BinderGroup = {
                    title: '',
                    count: 0,
                    totalCount: 0,
                    cycleDur: it.cycleDur,
                    cycleStartTime: it.cycleStartTime,
                    id: it.id,
                    name: '',
                    pid: itemData.pid,
                    process: itemData.process,
                    thread: itemData.thread,
                    tid: itemData.tid,
                    idx: 0
                }
                cloneThreadBinderCutArr[idx].push(item);
            }
        })
    }

    compare(prop: string) {
        return function (obj1: any, obj2: any) {
            let val1 = obj1[prop];
            let val2 = obj2[prop];
            if (val1 < val2) {
                return -1;
            } else if (val1 > val2) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    transferToTreeData(binderList: Array<BinderGroup>): Array<BinderGroup> {
        let group: any = {};
        binderList.forEach((it: BinderGroup) => {
            let cycleItem = {
                title: it.thread + ' ' + '[' + it.tid + ']' + '[' + it.id + ']',
                totalCount: it.count,
                binderTransactionCount: it.name == 'binder transaction' ? it.count : 0,
                binderAsyncRcvCount: it.name == 'binder async rcv' ? it.count : 0,
                binderReplyCount: it.name == 'binder reply' ? it.count : 0,
                binderTransactionAsyncCount: it.name == 'binder transaction async' ? it.count : 0,
                tid: it.tid,
                pid: it.pid,
                thread: it.thread,
                cycleDur: it.cycleDur || 0,
                cycleStartTime: it.cycleStartTime,
                type: 'cycle',
            };
            if (group[`${it.pid}`]) {
                let process = group[`${it.pid}`];
                process.totalCount += it.count;
                let thread = process.children.find((child: BinderGroup) => child.title === it.thread + ' ' + '[' + it.tid + ']');
                if (thread) {
                    thread.totalCount += it.count;
                    let cycle = thread.children.find((child: BinderGroup) => child.title === it.thread + ' ' + '[' + it.tid + ']' + '[' + it.id + ']');
                    if (cycle) {
                        cycle.totalCount += it.count;
                        cycle.binderTransactionCount += it.name == 'binder transaction' ? it.count : 0;
                        cycle.binderAsyncRcvCount += it.name == 'binder async rcv' ? it.count : 0;
                        cycle.binderReplyCount += it.name == 'binder reply' ? it.count : 0;
                        cycle.binderTransactionAsyncCount += it.name == 'binder transaction async' ? it.count : 0;
                    } else {
                        thread.children.push(cycleItem);
                    }
                } else {
                    process.children.push({
                        title: it.thread + ' ' + '[' + it.tid + ']',
                        totalCount: it.count,
                        tid: it.tid,
                        pid: it.pid,
                        type: 'thread',
                        children: [cycleItem],
                    })
                }
            } else {
                group[`${it.pid}`] = {
                    title: it.process + ' ' + '[' + it.pid + ']',
                    totalCount: it.count,
                    tid: it.tid,
                    pid: it.pid,
                    type: 'process',
                    children: [
                        {
                            title: it.thread + ' ' + '[' + it.tid + ']',
                            totalCount: it.count,
                            tid: it.tid,
                            pid: it.pid,
                            type: 'thread',
                            children: [cycleItem],
                        }
                    ]
                }
            }
        });
        this.cacheBinderArr = JSON.parse(JSON.stringify(this.addCycleNumber(Object.values(group))));
        let groupArr = this.timeUnitConversion(Object.values(group))
        return groupArr;
    }

    addCycleNumber(groupArr: Array<BinderGroup>): Array<BinderGroup> {
        for (let i = 0; i < groupArr.length; i++) {
            if (groupArr[i].type === 'cycle') {
                groupArr[i].title = 'cycle ' + (i + 1) + '_' + groupArr[i].thread + ' ' + '[' + groupArr[i].tid + ']';
                groupArr[i].idx = i + 1;
            } else {
                this.addCycleNumber(groupArr[i].children!)
            }
        }
        return groupArr
    }

    timeUnitConversion(groupArr: Array<BinderGroup>): Array<BinderGroup> {
        for (let i = 0; i < groupArr.length; i++) {
            if (groupArr[i].type === 'cycle') {
                groupArr[i].cycleDur = Number((groupArr[i].cycleDur / 1000000).toFixed(3));
                groupArr[i].cycleStartTime = Number((groupArr[i].cycleStartTime / 1000000).toFixed(3));
            } else {
                this.timeUnitConversion(groupArr[i].children!)
            }
        }
        return groupArr
    }

    private theadClick(data: Array<BinderGroup>): void {
        let labels = this.threadBindersTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i].innerHTML;
                labels[i].addEventListener('click', (e) => {
                    if (label.includes('Process') && i === 0) {
                        this.threadBindersTbl!.setStatus(data, false);
                        this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('Thread') && i === 1) {
                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.threadBindersTbl!.setStatus(item.children, false);
                            }
                        }
                        this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('Cycle') && i === 2) {
                        this.threadBindersTbl!.setStatus(data, true);
                        this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
                    }
                });
            }
        }
    }

    binderWithCountList(rowCycleData: BinderGroup[]): Array<BinderColumn[]> {
        let binderWithCountList: Array<BinderColumn[]> = [];
        rowCycleData.forEach(it => {
            if (it.totalCount !== 0) {
                let cycleDataArr: BinderColumn[] = [];
                if (it.binderTransactionCount !== 0) {
                    cycleDataArr.push({
                        name: 'binder transaction',
                        count: it.binderTransactionCount!,
                        dur: it.cycleDur,
                        startNS: it.cycleStartTime,
                        idx: it.idx
                    })
                }
                if (it.binderTransactionAsyncCount !== 0) {
                    cycleDataArr.push({
                        name: 'binder transaction async',
                        count: it.binderTransactionAsyncCount!,
                        dur: it.cycleDur,
                        startNS: it.cycleStartTime,
                        idx: it.idx
                    })
                }
                if (it.binderReplyCount !== 0) {
                    cycleDataArr.push({
                        name: 'binder reply',
                        count: it.binderReplyCount!,
                        dur: it.cycleDur,
                        startNS: it.cycleStartTime,
                        idx: it.idx
                    })
                }
                if (it.binderAsyncRcvCount !== 0) {
                    cycleDataArr.push({
                        name: 'binder async rcv',
                        count: it.binderAsyncRcvCount!,
                        dur: it.cycleDur,
                        startNS: it.cycleStartTime,
                        idx: it.idx
                    })
                }
                binderWithCountList.push(cycleDataArr)
            }
        })
        return binderWithCountList;
    }

    findThreadByThreadId(groupArr: Array<BinderGroup>, threadId: number): BinderGroup[] {
        let currentSelectThread: BinderGroup[] = [];
        groupArr.forEach(p => {
            p.children?.forEach(th => {
                if (th.tid === threadId) {
                    currentSelectThread = th.children!
                }
            })
        })
        return currentSelectThread
    }

    initElements(): void {
        this.threadBindersTbl = this.shadowRoot?.querySelector<LitTable>('#tb-binder-count');
        this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_cycle');
        this.cycleAStartRangeDIV = this.shadowRoot?.querySelector('#cycle-a-start-range');
        this.cycleAEndRangeDIV = this.shadowRoot?.querySelector('#cycle-a-end-range');
        this.cycleBStartRangeDIV = this.shadowRoot?.querySelector('#cycle-b-start-range');
        this.cycleBEndRangeDIV = this.shadowRoot?.querySelector('#cycle-b-end-range');

        this.threadStatesDIV = this.shadowRoot!.querySelector('#dataCut');
        this.threadStatesDIV?.children[2].children[0].addEventListener('click', (e) => {
            this.dispalyQueryArea(true);
            this.dataSource = [];
            // @ts-ignore
            this.dataSingleCut(this.threadStatesDIV!.children[0], this.threadStatesDIV?.children[1]);
        })
        this.threadStatesDIV?.children[2].children[1].addEventListener('click', (e) => {
            this.dispalyQueryArea(true);
            this.dataSource = [];
            // @ts-ignore
            this.dataLoopCut(this.threadStatesDIV?.children[0], this.threadStatesDIV?.children[1]);
        })

        this.threadBindersTbl!.addEventListener('row-click', (evt: any) => {
            let currentData = evt.detail.data;
            if (currentData.type === 'thread') {
                this.currentThreadId = currentData.tid + '' + currentData.pid;
                this.clearCycleRange();
                currentData.isSelected = true;
                this.threadBindersTbl!.clearAllSelection(currentData);
                this.threadBindersTbl!.setCurrentSelection(currentData);
                this.rowCycleData = currentData.children;
                this.dispalyQueryArea(false);
                let totalCount = currentData.totalCount;
                this.dataSource = [];
                this.dataSource.push({
                    xName: 'Total',
                    yAverage: totalCount !== 0 ? Math.ceil(totalCount / this.rowCycleData!.length) : 0
                })
                if (this.dataSource!.length !== 0) {
                    this.drawColumn();
                }
                let threaId = currentData.tid;
                let rowThreadBinderArr = this.findThreadByThreadId(this.cacheBinderArr!, threaId);
                let binderList = this.binderWithCountList(rowThreadBinderArr!);
                // SegMenTaTion.setChartData('BINDER', binderList);
            }

            if (currentData.type === 'cycle' && currentData.tid + '' + currentData.pid === this.currentThreadId) {
                currentData.isSelected = true;
                this.threadBindersTbl!.clearAllSelection(currentData);
                this.threadBindersTbl!.setCurrentSelection(currentData);
                // SegMenTaTion.tabHover('BINDER', true, currentData.idx);
            }
        });

        this.shadowRoot?.querySelector('#query-btn')?.addEventListener('click', () => {
            this.cycleARangeArr = this.rowCycleData?.filter((it: BinderGroup) => {
                return it.cycleDur >= Number(this.cycleAStartRangeDIV!.value)
                    && it.cycleDur < Number(this.cycleAEndRangeDIV!.value);
            })
            this.cycleBRangeArr = this.rowCycleData?.filter((it: BinderGroup) => {
                return it.cycleDur >= Number(this.cycleBStartRangeDIV!.value)
                    && it.cycleDur < Number(this.cycleBEndRangeDIV!.value);
            })
            let cycleACount = 0;
            this.cycleARangeArr?.forEach((it: BinderGroup) => {
                cycleACount += it.totalCount;
            })
            let cycleBCount = 0;
            this.cycleBRangeArr?.forEach((it: BinderGroup) => {
                cycleBCount += it.totalCount;
            })
            this.dataSource!.length > 1 && this.dataSource?.splice(1);
            this.dataSource!.push({
                xName: 'cycleA',
                yAverage: cycleACount !== 0 ? Math.ceil(cycleACount / this.cycleARangeArr!.length) : 0
            })
            this.dataSource!.push({
                xName: 'cycleB',
                yAverage: cycleBCount !== 0 ? Math.ceil(cycleBCount / this.cycleBRangeArr!.length) : 0
            })
            if (this.dataSource!.length !== 0) {
                this.drawColumn();
            }
        })
    }

    clearCycleRange(): void {
        this.cycleAStartRangeDIV!.value = '';
        this.cycleAEndRangeDIV!.value = '';
        this.cycleBStartRangeDIV!.value = '';
        this.cycleBEndRangeDIV!.value = '';
    }

    drawColumn(): void {
        this.chartTotal!.dataSource = this.dataSource!;
        this.chartTotal!.config = {
            data: this.dataSource!,
            appendPadding: 10,
            xField: 'xName',
            yField: 'yAverage',
            seriesField: '',
            removeUnit: true,
            notSort: true,
            color: (a) => {
                if (a.xName === 'Total') {
                    return '#2f72f8';
                } else if (a.xName === 'cycleA') {
                    return '#ffab67';
                } else if (a.xName === 'cycleB') {
                    return '#a285d2';
                } else {
                    return '#0a59f7';
                }
            },
            tip: (a) => {
                if (a && a[0]) {
                    let tip = '';
                    tip = `<div>
                            <div>Average: ${a[0].obj.yAverage}</div>
                        </div>`;
                    return tip;
                } else {
                    return '';
                }
            },
            label: null,
        };
    }

    connectedCallback() {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.threadBindersTbl!);
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
            padding:auto;
            align-items:center;
        }
        button{
            width:40%;
            height:100%;
            border: solid 1px #666666;
            background-color: rgba(0,0,0,0);
            border-radius:10px;
            cursor: pointer;
        }
        button:hover{
            background-color:#666666;
            color:white;
        }
        :host([clickSingle]) .click_single{
            background-color:#666666;
            color:white;
        }
        :host([clickLoop]) .click_loop{
            background-color:#666666;
            color:white;
        }
        .thread-id-input{
            width: 15%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%
        }
        .cycle-name-input{
            width: 20%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%
        }
        .data-cut-area{
            width:20%;
            height: 100%;
            display:flex;
            justify-content: space-around;
        }
        .main-area{
            width:100%;
            display:flex;
            margin-top:5px;
        }
        lit-table{
            height: auto;
            overflow-x:auto;
            width:100%
        }
        #query-btn{
            width:90px;
        }
        .cycle-range-input {
            width: 120px;
            height: 18px;
            padding: 1px 5px;
            border-radius: 12px;
            border: solid 1px #979797;
            font-size: 15px;
            text-indent: 3%
        }
        :host([dispalyQueryArea]) .query-cycle-area{
            display: none;
        }
        #chart_cycle{
            width:100%;
            height:300px;
        }
        .chart_labels{
            height: 30px;
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-top:12px;
        }
        .labels{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            padding-right: 15px;
        }
        .labels_item{
            width: 20px;
            height: 10px;
            background-color: #2f72f8;
            margin-right: 5px;
        }
        .chart_area{
            margin-top:40px;
        }
        .chart_title{
            line-height: 40px;
            height: 40px;
            width: 100%;
            text-align: center;
        }
        </style>
        <div id='dataCut'>
            <input id="dataCutThreadId" type="text" class="thread-id-input" placeholder="Please input thread id" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
            <input id="dataCutThreadFunc" type="text" class="cycle-name-input" placeholder="Please input function name" value='' />
            <div class="data-cut-area">
                <button id="single-btn" class="click_single">Single</button>
                <button id="loop-btn" class="click_loop">Loop</button>
            </div>
        </div>
        <div class="main-area">
            <lit-slicer style="width:100%">
                <div style="width:65%;">
                    <lit-table id="tb-binder-count" style="height: auto; overflow-x:auto;width:100%" tree>
                        <lit-table-column title="Process/Thread/Cycle" data-index="title" key="title"  align="flex-start" width="30%" retract>
                        </lit-table-column>
                        <lit-table-column title="Total count" data-index="totalCount" key="totalCount" align="center">
                        </lit-table-column>
                        <lit-table-column title="Binder transaction count" data-index="binderTransactionCount" key="binderTransactionCount" align="center">
                        </lit-table-column>
                        <lit-table-column title="Binder transaction async count" data-index="binderTransactionAsyncCount" key="binderTransactionAsyncCount" align="center">
                        </lit-table-column>
                        <lit-table-column title="Binder reply count" data-index="binderReplyCount" key="binderReplyCount" align="center">
                        </lit-table-column>
                        <lit-table-column title="Binder async rcv count" data-index="binderAsyncRcvCount" key="binderAsyncRcvCount" align="center">
                        </lit-table-column>
                        <lit-table-column title="Cycle start time(ms)" data-index="cycleStartTime" key="cycleStartTime" align="flex-start">
                        </lit-table-column>
                        <lit-table-column title="Duration(ms)" data-index="cycleDur" key="cycleDur" align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </div>
                <lit-slicer-track ></lit-slicer-track>
                <div style="width:35%;padding: 16px;height:500px;overflow:auto;" class="query-cycle-area">
                    <div >
                        <div id="cycle-a">
                            <span>Cycle A: </span>
                            <input id="cycle-a-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                            <span>~</span>
                            <input id="cycle-a-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                        </div>
                        <div style="margin-top: 10px; display:flex; flex-derection:row; justify-content:space-between">
                            <div id="cycle-b">
                                <span>Cycle B: </span>
                                <input id="cycle-b-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                                <span>~</span>
                                <input id="cycle-b-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                            </div>
                            <div>
                                <button id="query-btn">Query</button>
                            </div>
                        </div>
                    </div>
                    <div class="chart_area">
                        <div class="chart_title">Average Binder Count</div>
                        <lit-chart-column id="chart_cycle"></lit-chart-column>
                        <div class="chart_labels">
                            <div class="labels"><div class="labels_item"></div>Total</div>
                            <div class="labels"><div class="labels_item" style="background-color: #ffab67;"></div>CycleA</div>
                            <div class="labels"><div class="labels_item" style="background-color: #a285d2;"></div>CycleB</div>
                        </div>
                    </div>
                </div>
            </lit-slicer>
        </div>
        `
    }
}