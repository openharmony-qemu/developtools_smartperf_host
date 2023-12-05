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
import '../../../StackBar.js'
import { getTabRunningPercent, queryCpuFreqUsageData, queryCpuFreqFilterId } from '../../../../database/SqlLite.js';
import { Utils } from '../../base/Utils.js';
import { resizeObserver } from '../SheetUtils.js';
import { SliceGroup } from '../../../../bean/StateProcessThread.js';
import { SegMenTaTion } from "../../../chart/SpSegmentationChart.js";
import { TabPaneFreqUsageConfig, TabPaneRunningConfig, TabPaneCpuFreqConfig } from "./TabPaneFreqUsageConfig.js";

@element('tabpane-frequsage')
export class TabPaneFreqUsage extends BaseElement {
    private threadStatesTbl: LitTable | null | undefined;
    private threadStatesTblSource: Array<SelectionData> = [];
    private currentSelectionParam: Selection | undefined;
    private threadArr: Array<TabPaneFreqUsageConfig> = [];

    set data(threadStatesParam: SelectionParam | any) {
        if (this.currentSelectionParam === threadStatesParam) {
            return;
        }
        this.threadStatesTbl!.loading = true;
        this.currentSelectionParam = threadStatesParam;
        this.threadStatesTblSource = [];
        this.threadStatesTbl!.recycleDataSource = [];
        let tableValue: any = this.threadStatesTbl;
        tableValue.value = [];
        this.threadArr = [];
        this.init(threadStatesParam);
    }
    /**
     * 初始化数据
     */
    async init(threadStatesParam: SelectionParam | any): Promise<void> {
        let [runningData, sum] = await this.queryRunningData(threadStatesParam);
        let cpuFreqData: Array<TabPaneCpuFreqConfig> = await this.queryCpuFreqData(threadStatesParam);
        let cpuMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
        if (runningData.size > 0) {
            // 创建进程级的数组
            let pidArr: Array<any> = [], processArr: Array<number> = threadStatesParam.processIds.length > 1 ? [...new Set(threadStatesParam.processIds)] : threadStatesParam.processIds;
            for (let i of processArr) {
                pidArr.push(new TabPaneFreqUsageConfig(Utils.PROCESS_MAP.get(i) === null ? 'Process ' + i : Utils.PROCESS_MAP.get(i) + ' ' + i, '', i, '', 0, '', '', 0, '', 0, 'process', -1, []));
            }
            // 将cpu频点数据与running状态数据整合，保证其上该段时长内有对应的cpu频点数据
            this.mergeFreqData(runningData, cpuMap, cpuFreqData, sum, threadStatesParam);
            // 将频点数据放置到对应cpu层级下
            this.mergeCpuData(cpuMap, runningData);
            // 将cpu层级数据放置到线程分组下
            this.mergeThreadData(this.threadArr, cpuMap);
            // 将线程层级数据放置到进程级分组下
            this.mergePidData(pidArr, this.threadArr);
            // 百分比保留两位小数
            this.fixedDeal(pidArr)
            this.threadStatesTblSource = pidArr;
            this.threadStatesTbl!.recycleDataSource = pidArr;
            this.threadStatesTbl!.loading = false;
            this.theadClick(pidArr);
            this.threadStatesTbl!.loading = false;
        } else {
            this.threadStatesTblSource = [];
            this.threadStatesTbl!.recycleDataSource = [];
            this.threadStatesTbl!.loading = false;
        }
    }
    /**
     * 查询cpu频点信息
     */
    async queryCpuFreqData(threadStatesParam: SelectionParam | any): Promise<Array<TabPaneCpuFreqConfig>> {
        // 查询cpu及id信息
        let result: Array<any> = await queryCpuFreqFilterId();
        // 以键值对形式将cpu及id进行对应，后续会将频点数据与其对应cpu进行整合
        let IdMap: Map<number, number> = new Map();
        let queryId: Array<number> = [];
        for (let i = 0; i < result.length; i++) {
            queryId.push(result[i].id);
            IdMap.set(result[i].id, result[i].cpu);
        }
        let dealArr: Array<TabPaneCpuFreqConfig> = [];
        // 通过id去查询频点数据
        let res: Array<any> = await queryCpuFreqUsageData(queryId);
        for (let i of res) {
            let obj = new TabPaneCpuFreqConfig(i.startNS + threadStatesParam.recordStartNs, IdMap.get(i.filter_id)!, i.value, i.dur)
            dealArr.push(obj);
        }
        return dealArr;
    }

    /**
     * 查询框选区域内的所有running状态数据
     */
    async queryRunningData(threadStatesParam: SelectionParam | any): Promise<Array<any>> {
        // 查询running状态线程数据
        let result: Array<any> = await getTabRunningPercent(threadStatesParam.threadIds, threadStatesParam.leftNs, threadStatesParam.rightNs);
        let needDeal: Map<string, Array<TabPaneRunningConfig>> = new Map(), sum: number = 0;
        if (result != null && result.length > 0) {
            // 将running线程数据存到map中
            for (let e of result) {
                if(threadStatesParam.processIds.includes(e.pid)){
                    if (needDeal.get(e.pid + '_' + e.tid) === undefined) {
                        this.threadArr.push(new TabPaneFreqUsageConfig(Utils.THREAD_MAP.get(e.tid) + ' ' + e.tid, '', e.pid, e.tid, 0, '', '', 0, '', 0, 'thread', -1, []));
                        needDeal.set(e.pid + '_' + e.tid, new Array());
                    }
                    if ((e.ts < (threadStatesParam.leftNs + threadStatesParam.recordStartNs)) && ((e.ts + e.dur) > (threadStatesParam.leftNs + threadStatesParam.recordStartNs))) {
                        const ts = e.ts;
                        e.ts = threadStatesParam.leftNs + threadStatesParam.recordStartNs;
                        e.dur = ts + e.dur - (threadStatesParam.leftNs + threadStatesParam.recordStartNs);
                    }
                    if ((e.ts + e.dur) > (threadStatesParam.rightNs + threadStatesParam.recordStartNs)) {
                        e.dur = threadStatesParam.rightNs + threadStatesParam.recordStartNs - e.ts;
                    }
                    let process = Utils.PROCESS_MAP.get(e.pid);
                    let thread = Utils.THREAD_MAP.get(e.tid);
                    e.process = process == null || process.length == 0 ? '[NULL]' : process;
                    e.thread = thread == null || thread.length == 0 ? '[NULL]' : thread;
                    let arr: any = needDeal.get(e.pid + '_' + e.tid);
                    sum += e.dur;
                    arr.push(e);
                }
            }
        }
        return [needDeal, sum];
    }

    /**
     * 整合running数据与频点数据
     */
    mergeFreqData(needDeal: Map<string, Array<TabPaneRunningConfig>>, cpuMap: Map<string, Array<TabPaneFreqUsageConfig>>, dealArr: Array<TabPaneCpuFreqConfig>, sum: number, threadStatesParam: SelectionParam | any): void {
        needDeal.forEach((value: Array<TabPaneRunningConfig>, key: string) => {
            let resultList: Array<any> = [], cpuArr: Array<number> = [];
            cpuMap.set(key, new Array());
            const multiple: number = 1000;
            for (let i = 0; i < value.length; i++) {
                if (!cpuArr.includes(value[i].cpu)) {
                    cpuArr.push(value[i].cpu);
                    cpuMap.get(key)?.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + Utils.THREAD_MAP.get(value[i].tid), '', value[i].pid, value[i].tid, 0, value[i].cpu, '', 0, '', 0, 'cpu', -1, []));
                }
                for (let j = 0; j < dealArr.length; j++) {
                    const consumption = SegMenTaTion.freqInfoMapData.size > 0 ? SegMenTaTion.freqInfoMapData.get(value[i].cpu).get(dealArr[j].value) : dealArr[j].value;
                    // 只需要合并相同cpu的数据
                    if (value[i].cpu === dealArr[j].cpu) {
                        // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间小于频点结束时间减去running数据开始时间的差值的情况
                        if (value[i].ts > dealArr[j].startNS && value[i].ts < (dealArr[j].startNS + dealArr[j].dur) && value[i].dur < (dealArr[j].startNS + dealArr[j].dur - value[i].ts)) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + value[i].thread, value[i].ts, '', '', (consumption * value[i].dur) / multiple, value[i].cpu, dealArr[j].value, value[i].dur, '', value[i].dur / sum * 100, 'freqdata', -1, undefined));
                            break;
                        } 
                        // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间大于等于频点结束时间减去running数据开始时间的差值的情况
                        if (value[i].ts > dealArr[j].startNS && value[i].ts < (dealArr[j].startNS + dealArr[j].dur) && value[i].dur >= (dealArr[j].startNS + dealArr[j].dur - value[i].ts)) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + value[i].thread, value[i].ts, '', '', (consumption * (dealArr[j].startNS + dealArr[j].dur - value[i].ts)) / multiple, value[i].cpu, dealArr[j].value, (dealArr[j].startNS + dealArr[j].dur - value[i].ts), '', (dealArr[j].startNS + dealArr[j].dur - value[i].ts) / sum * 100, 'freqdata', -1, undefined));
                        }
                        // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值小于频点数据持续时间的情况
                        if (value[i].ts <= dealArr[j].startNS && (value[i].ts + value[i].dur) > dealArr[j].startNS && (value[i].dur + value[i].ts - dealArr[j].startNS) < dealArr[j].dur) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + value[i].thread, dealArr[j].startNS, '', '', (consumption * (value[i].dur + value[i].ts - dealArr[j].startNS)) / multiple, value[i].cpu, dealArr[j].value, (value[i].dur + value[i].ts - dealArr[j].startNS), '', (value[i].dur + value[i].ts - dealArr[j].startNS) / sum * 100, 'freqdata', -1, undefined));
                            break;
                        } 
                        // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值大于等于频点数据持续时间的情况
                        if (value[i].ts <= dealArr[j].startNS && (value[i].ts + value[i].dur) > dealArr[j].startNS && (value[i].dur + value[i].ts - dealArr[j].startNS) >= dealArr[j].dur)  {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + value[i].thread, dealArr[j].startNS, '', '', (consumption * dealArr[j].dur) / multiple, value[i].cpu, dealArr[j].value, dealArr[j].dur, '', dealArr[j].dur / sum * 100, 'freqdata', -1, undefined));
                        }
                        // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间小于等于频点开始时间的情况
                        if (value[i].ts <= dealArr[j].startNS && (value[i].ts + value[i].dur) <= dealArr[j].startNS){
                            resultList.push(new TabPaneFreqUsageConfig(value[i].tid + '_' + value[i].thread, value[i].ts, '', '', 0, value[i].cpu, 'unknown', value[i].dur, '', value[i].dur / sum * 100, 'freqdata', -1, undefined));
                            break;
                        }
                    }
                }
            }
            cpuMap.get(key)?.sort((a: any, b: any) => a.cpu - b.cpu);
            needDeal.set(key, this.mergeData(resultList, threadStatesParam));
        })
    }

    /**
     * 合并同一线程内，当运行所在cpu和频点相同时，dur及percent进行累加求和
     */
    mergeData(resultList: Array<any>, threadStatesParam: SelectionParam | any): Array<TabPaneRunningConfig>{
        for (let i = 0; i < resultList.length; i++) {
            for (let j = i + 1; j < resultList.length; j++) {
                if (resultList[i].cpu === resultList[j].cpu && resultList[i].freq === resultList[j].freq) {
                    resultList[i].dur += resultList[j].dur;
                    resultList[i].percent += resultList[j].percent;
                    resultList[i].count += resultList[j].count;
                    resultList.splice(j, 1);
                    j--;
                }
            }
            resultList[i].ts = resultList[i].ts - threadStatesParam.recordStartNs;
        }
        resultList.sort((a, b) => b.count - a.count);
        return resultList;
    }

    /**
     * 将整理好的running频点数据通过map的键放到对应的cpu分组层级下
     */
    mergeCpuData(cpuMap: Map<string, Array<TabPaneFreqUsageConfig>>, needDeal: Map<string, Array<any>>): void {
        cpuMap.forEach((value: Array<TabPaneFreqUsageConfig>, key: string) => {
            let arr = needDeal.get(key);
            for (let i = 0; i < value.length; i++) {
                for (let j = 0; j < arr!.length; j++) {
                    if (arr![j].cpu === value[i].cpu) {
                        value[i].children?.push(arr![j]);
                        value[i].count += arr![j].count;
                        value[i].dur += arr![j].dur;
                        value[i].percent += arr![j].percent;
                    }
                }
            }
        });
    }

    /**
     * 将整理好的cpu层级数据放到对应的线程下
     */
    mergeThreadData(threadArr: Array<any>, cpuMap: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        for (let i = 0; i < threadArr.length; i++) {
            let cpuMapData = cpuMap.get(threadArr[i].pid + '_' + threadArr[i].tid);
            for (let j = 0; j < cpuMapData!.length; j++) {
                threadArr[i].children.push(cpuMapData![j]);
                threadArr[i].count += cpuMapData![j].count;
                threadArr[i].dur += cpuMapData![j].dur;
                threadArr[i].percent += cpuMapData![j].percent;
            }
        }
    }

    /**
     * 将整理好的线程层级数据放到对应的进程下
     */
    mergePidData(pidArr: Array<any>, threadArr: Array<any>): void {
        for (let i = 0; i < pidArr.length; i++) {
            for (let j = 0; j < threadArr.length; j++) {
                if (pidArr[i].pid === threadArr[j].pid) {
                    pidArr[i].children.push(threadArr[j]);
                    pidArr[i].count += threadArr[j].count;
                    pidArr[i].dur += threadArr[j].dur;
                    pidArr[i].percent += threadArr[j].percent;
                }
            }
        }
    }

    /**
     * 递归整理数据小数位
     */
    fixedDeal(arr: Array<any>): void {
        if (arr == undefined) {
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            arr[i].percent = arr[i].percent > 100 ? 100 : arr[i].percent;
            arr[i].percent = arr[i].percent.toFixed(2);
            arr[i].dur = (arr[i].dur / 1000000).toFixed(3);
            arr[i].count = (arr[i].count / 1000000).toFixed(3);
            if (arr[i].freq !== '') {
                if (arr[i].freq === 'unknown') {
                    arr[i].freq = 'unknown';
                } else {
                    arr[i].freq = arr[i].freq / 1000;
                }
            }
            this.fixedDeal(arr[i].children);
        }
    }
    /**
     * 表头点击事件
     */
    private theadClick(data: Array<SliceGroup>): void {
        let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i].innerHTML;
                labels[i].addEventListener('click', (e) => {
                    if (label.includes('Process') && i === 0) {
                        this.threadStatesTbl!.setStatus(data, false);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('Thread') && i === 1) {
                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.threadStatesTbl!.setStatus(item.children, false);
                            }
                        }
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('CPU') && i === 2) {
                        this.threadStatesTbl!.setStatus(data, true);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
                    }
                });
            }
        }
    }
    initElements(): void {
        this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-running-percent');
    }
    connectedCallback(): void {
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
        <lit-table id="tb-running-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="running-percent-column" width="320px" title="Process/Thread/CPU" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="120px" title="CPU" data-index="cpu" key="cpu" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="240px" title="Consumption" data-index="count" key="count" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="200px" title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="200px" title="duration(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="240px" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `
    }
}