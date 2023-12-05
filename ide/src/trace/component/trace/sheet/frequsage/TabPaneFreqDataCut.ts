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
import { getTabRunningPercent, queryCpuFreqUsageData, queryCpuFreqFilterId, querySearchFuncData } from '../../../../database/SqlLite.js';
import { Utils } from '../../base/Utils.js';
import { resizeObserver } from '../SheetUtils.js';
import { SliceGroup } from '../../../../bean/StateProcessThread.js';
import { LitChartScatter } from '../../../../../base-ui/chart/scatter/LitChartScatter.js';
import { SegMenTaTion } from "../../../chart/SpSegmentationChart.js";
import { TabPaneFreqUsageConfig, TabPaneRunningConfig, TabPaneCpuFreqConfig } from "./TabPaneFreqUsageConfig.js";

@element('tabpane-freqdatacut')
export class TabPaneFreqDataCut extends BaseElement {
    private threadStatesTbl: LitTable | null | undefined;
    private threadStatesTblSource: Array<SelectionData> = [];
    private currentSelectionParam: SelectionParam | any;
    private threadStatesDIV: HTMLDivElement | null | undefined;
    private scatterInput: HTMLInputElement | null | undefined;
    private initData: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
    private processArr: Array<TabPaneFreqUsageConfig> = [];
    private threadArr: Array<TabPaneFreqUsageConfig> = [];
    private statisticsScatter: LitChartScatter | null | undefined;

    set data(threadStatesParam: SelectionParam | any) {
        if (this.currentSelectionParam === threadStatesParam) {
            return;
        }
        this.currentSelectionParam = threadStatesParam;
        this.initData = new Map();
        this.threadArr = [];
        this.initUI();
        this.init(threadStatesParam);
        let pidArr: Array<TabPaneFreqUsageConfig> = [];
        // 整理进程级的数组信息
        let processArr: Array<number> = threadStatesParam.processIds.length > 1 ? [...new Set(threadStatesParam.processIds)] : threadStatesParam.processIds;
        for (let i of processArr) {
            pidArr.push(new TabPaneFreqUsageConfig(Utils.PROCESS_MAP.get(i) === null ? 'Process ' + i : Utils.PROCESS_MAP.get(i) + ' ' + i, '', i, '', 0, '', '', 0, '', 0, 'process', -1, []));
        }
        // 拷贝给私有属性，以便后续进行数据切割时免除整理进程层级数据
        this.processArr = pidArr;
    }
    /**
     * 初始化数据
     */
    async init(threadStatesParam: SelectionParam | any): Promise<void> {
        let [runningData, sum]: Array<any> = await this.queryRunningData(threadStatesParam);
        let cpuFreqData: Array<TabPaneCpuFreqConfig> = await this.queryCpuFreqData(threadStatesParam);
        if (runningData.size > 0) {
            // 将cpu频点数据与running状态数据整合，保证其上该段时长内有对应的cpu频点数据
            this.mergeFreqData(runningData, cpuFreqData, sum);
            this.threadStatesTbl!.loading = false;
        } else {
            this.threadStatesTblSource = [];
            this.threadStatesTbl!.recycleDataSource = [];
            this.threadStatesTbl!.loading = false;
        }
    }
    /**
     * 重置UI输入框等组件为默认状态
     */
    initUI(): void {
        this.threadStatesTblSource = [];
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = true;
        let tableValue: any = this.threadStatesTbl;
        tableValue.value = [];
        let divRoot1: any = this.shadowRoot?.querySelector('#dataCutThreadId');
        divRoot1.value = '';
        divRoot1.style.border = '1px solid rgb(151,151,151)';
        let divRoot2: any = this.shadowRoot?.querySelector('#dataCutThreadFunc');
        divRoot2.value = '';
        divRoot2.style.border = '1px solid rgb(151,151,151)';
        let divRoot3: any = this.shadowRoot?.querySelector('#maxFreq');
        divRoot3.style.border = '1px solid rgb(151,151,151)';
        let divRoot4: any = this.shadowRoot?.querySelector('#maxHz');
        divRoot4.style.border = '1px solid rgb(151,151,151)';
        let divRoot5: any = this.shadowRoot?.querySelector('#cycle-a-start-range');
        divRoot5.value = ''
        let divRoot6: any = this.shadowRoot?.querySelector('#cycle-a-end-range');
        divRoot6.value = '';
        let divRoot7: any = this.shadowRoot?.querySelector('#cycle-b-start-range');
        divRoot7.value = '';
        let divRoot8: any = this.shadowRoot?.querySelector('#cycle-b-end-range');
        divRoot8.value = '';
        // @ts-ignore
        this.shadowRoot?.querySelector('#cycleQuery')!.style.display = 'none';
        // @ts-ignore
        this.statisticsScatter!.config = undefined;
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
        let result: Array<any> = await getTabRunningPercent(threadStatesParam.threadIds, threadStatesParam.leftNs, threadStatesParam.rightNs);
        let needDeal: Map<string, Array<TabPaneRunningConfig>> = new Map(), sum: number = 0;
        if (result != null && result.length > 0) {
            let processArr: Array<number> = threadStatesParam.processIds.length > 1 ? [...new Set(threadStatesParam.processIds)] : threadStatesParam.processIds;
            for (let e of result) {
                if (processArr.includes(e.pid)) {
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
     * 将cpu频点数据与running状态数据整合，保证其上该段时长内有对应的cpu频点数据
     */
    mergeFreqData(needDeal: Map<string, Array<TabPaneRunningConfig>>, dealArr: Array<any>, sum: number): void {
        needDeal.forEach((value: Array<TabPaneRunningConfig>, key: string) => {
            let resultList: Array<TabPaneFreqUsageConfig> = [];
            for (let i = 0; i < value.length; i++) {
                for (let j = 0; j < dealArr.length; j++) {
                    // 只需要判断running状态数据与频点数据cpu相同的情况
                    if (value[i].cpu === dealArr[j].cpu) {
                        // running状态数据的开始时间大于频点数据开始时间，小于频点结束时间。且running状态数据的持续时间小于频点结束时间减去running状态数据开始时间的情况
                        if (value[i].ts > dealArr[j].startNS && value[i].ts < (dealArr[j].startNS + dealArr[j].dur) && value[i].dur < (dealArr[j].startNS + dealArr[j].dur - value[i].ts)) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].thread, value[i].ts, value[i].pid, value[i].tid, 0, value[i].cpu, dealArr[j].value, value[i].dur, '', value[i].dur / sum * 100, 'freqdata', -1, undefined));
                            break;
                        }
                        // running状态数据的开始时间大于频点数据开始时间，小于频点结束时间。且running状态数据的持续时间大于频点结束时间减去running状态数据开始时间的情况
                        if (value[i].ts > dealArr[j].startNS && value[i].ts < (dealArr[j].startNS + dealArr[j].dur) && value[i].dur > (dealArr[j].startNS + dealArr[j].dur - value[i].ts)) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].thread, value[i].ts, value[i].pid, value[i].tid, 0, value[i].cpu, dealArr[j].value, (dealArr[j].startNS + dealArr[j].dur - value[i].ts), '', (dealArr[j].startNS + dealArr[j].dur - value[i].ts) / sum * 100, 'freqdata', -1, undefined));
                        }
                        // running状态数据的开始时间小于频点数据开始时间，running状态数据的结束时间大于频点数据开始时间。且running状态数据在频点数据开始时间后的持续时间小于频点数据持续时间的情况
                        if (value[i].ts < dealArr[j].startNS && (value[i].ts + value[i].dur) > dealArr[j].startNS && (value[i].dur + value[i].ts - dealArr[j].startNS) < dealArr[j].dur) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].thread, dealArr[j].startNS, value[i].pid, value[i].tid, 0, value[i].cpu, dealArr[j].value, (value[i].dur + value[i].ts - dealArr[j].startNS), '', (value[i].dur + value[i].ts - dealArr[j].startNS) / sum * 100, 'freqdata', -1, undefined));
                            break;
                        }
                        // running状态数据的开始时间小于频点数据开始时间，running状态数据的结束时间大于频点数据开始时间。且running状态数据在频点数据开始时间后的持续时间大于频点数据持续时间的情况
                        if (value[i].ts < dealArr[j].startNS && (value[i].ts + value[i].dur) > dealArr[j].startNS && (value[i].dur + value[i].ts - dealArr[j].startNS) > dealArr[j].dur) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].thread, dealArr[j].startNS, value[i].pid, value[i].tid, 0, value[i].cpu, dealArr[j].value, dealArr[j].dur, '', dealArr[j].dur / sum * 100, 'freqdata', -1, undefined));
                        }
                        // running状态数据的开始时间小于频点数据开始时间，running状态数据的持续时间小于频点数据开始时间的情况
                        if (value[i].ts < dealArr[j].startNS && (value[i].ts + value[i].dur) < dealArr[j].startNS) {
                            resultList.push(new TabPaneFreqUsageConfig(value[i].thread, value[i].ts, value[i].pid, value[i].tid, 0, value[i].cpu, 'unknown', value[i].dur, '', value[i].dur / sum * 100, 'freqdata', -1, undefined));
                            break;
                        }
                    }
                }
            }
            this.initData.set(key, resultList);
        })
    }
    /**
     * single方式切割数据功能
     */
    dataSingleCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement, resultList: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        threadId.style.border = '1px solid rgb(151,151,151)';
        threadFunc.style.border = '1px solid rgb(151,151,151)';
        let threadIdValue = threadId.value.trim();
        let threadFuncName = threadFunc.value.trim();
        let leftNS = this.currentSelectionParam.leftNs;
        let rightNS = this.currentSelectionParam.rightNs;
        let tableValue: any = this.threadStatesTbl;
        tableValue.value = [];
        if (threadIdValue != '' && threadFuncName != '') {
            // 根据用户输入的线程ID，方法名去查询数据库，得到对应的方法起始时间，持续时间等数据，以便作为依据进行后续数据切割
            querySearchFuncData(threadFuncName, Number(threadIdValue), leftNS, rightNS).then(result => {
                if (result != null && result.length > 0) {
                    // targetMap为全局initData的拷贝对象，dealArr数组用来存放周期切割依据数据
                    let targetMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map(), dealArr: Array<any> = [];
                    // 新创建map对象接收传过来的实参map
                    resultList.forEach((item: Array<TabPaneFreqUsageConfig>, key: string) => {
                        targetMap.set(key, JSON.parse(JSON.stringify(item)));
                    })
                    // 整理周期切割依据的数据
                    for (let i of result) {
                        if (i.startTime + this.currentSelectionParam.recordStartNs + i.dur < this.currentSelectionParam.rightNs + this.currentSelectionParam.recordStartNs) {
                            dealArr.push({ 'ts': i.startTime + this.currentSelectionParam.recordStartNs, 'dur': i.dur });
                        }
                    }
                    let cycleMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map(), totalList: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
                    this.mergeSingleData(dealArr, targetMap, cycleMap, totalList);
                    // 拷贝线程数组，防止数据污染
                    let threadArr = JSON.parse(JSON.stringify(this.threadArr));
                    // 拷贝进程数组，防止数据污染
                    let processArr = JSON.parse(JSON.stringify(this.processArr));
                    // 将周期层级防止到线程层级下
                    this.mergeThreadData(threadArr, cycleMap);
                    // 将原始数据放置到对应的线程层级下，周期数据前
                    let totalData = this.merge(totalList);
                    this.mergeTotalData(threadArr, totalData);
                    // 合并数据到进程层级下
                    this.mergePidData(processArr, threadArr);
                    this.fixedDeal(processArr);
                    this.threadStatesTblSource = processArr;
                    this.threadStatesTbl!.recycleDataSource = processArr;
                    this.threadStatesTbl!.loading = false;
                    this.threadClick(processArr);
                } else {
                    this.threadStatesTblSource = [];
                    this.threadStatesTbl!.recycleDataSource = [];
                    this.threadStatesTbl!.loading = false;
                }
            })
        } else {
            this.threadStatesTbl!.loading = false;
            if (threadIdValue == '') {
                threadId.style.border = '2px solid rgb(255,0,0)';
            }
            if (threadFuncName == '') {
                threadFunc.style.border = '2px solid rgb(255,0,0)';
            }
        }
    }
    /**
     * 整合Single切割方式中的频点数据与方法周期数据
     */
    mergeSingleData(dealArr: Array<any>, targetMap: Map<string, Array<any>>, cycleMap: Map<string, Array<TabPaneFreqUsageConfig>>, totalList: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        let timeDur = this.currentSelectionParam.recordStartNs;
        targetMap.forEach((value, key) => {
            cycleMap.set(key, new Array());
            totalList.set(key, new Array());
            for (let i = 0; i < dealArr.length; i++) {
                let cpuArr: Array<number> = [], resList: Array<TabPaneFreqUsageConfig> = [], cpuMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
                // 时间倍数值
                const countMutiple = 1000000;
                cpuMap.set(key, new Array());
                cycleMap.get(key)?.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[0].thread, ((dealArr[i].ts - timeDur) / 1000000).toFixed(3), key.split('_')[0], key.split('_')[1], 0, '', '', 0, (dealArr[i].dur / 1000000).toFixed(3), 0, 'cycle', i + 1, []));
                for (let j = 0; j < value.length; j++) {
                    // 判断若用户导入json文件，则替换为对应cpu下的对应频点的算力值进行算力消耗计算
                    let consumptionMap: Map<number, number> = SegMenTaTion.freqInfoMapData.size > 0 && SegMenTaTion.freqInfoMapData.get(value[j].cpu);
                    // 若存在算力值，则直接取值做计算。若不存在算力值，且频点值不为unknown的情况，则取频点值做计算，若为unknown，则取0做兼容
                    const consumption = (consumptionMap && consumptionMap.get(value[j].freq)) ? consumptionMap.get(value[j].freq) : (value[j].freq == 'unknown' ? 0 : value[j].freq);
                    if (!cpuArr.includes(value[j].cpu)) {
                        cpuArr.push(value[j].cpu);
                        cpuMap.get(key)?.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, 0, value[j].cpu, '', 0, '', 0, 'cpu', -1, []));
                    }
                    // 以下为频点数据按Single周期切割数据如何取舍的判断条件，dealArr为周期切割依据，value为某一线程下的频点汇总数据
                    // 如果频点数据开始时间大于某一周期起始时间，小于该周期的结束时间。且频点数据结束时间小于周期结束时间的情况
                    if (dealArr[i].ts < value[j].ts && dealArr[i].ts + dealArr[i].dur > value[j].ts && dealArr[i].ts + dealArr[i].dur > value[j].ts + value[j].dur) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (consumption * value[j].dur) / countMutiple, value[j].cpu, value[j].freq, value[j].dur, '', value[j].percent, 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (consumption * value[j].dur) / countMutiple, value[j].cpu, value[j].freq, value[j].dur, '', value[j].percent, 'freqdata', i, undefined));
                    }
                    // 如果频点数据开始时间大于某一周期起始时间，小于该周期的结束时间。且频点数据结束时间大于等于周期结束时间的情况
                    if (dealArr[i].ts < value[j].ts && dealArr[i].ts + dealArr[i].dur > value[j].ts && dealArr[i].ts + dealArr[i].dur <= value[j].ts + value[j].dur) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (dealArr[i].ts + dealArr[i].dur - value[j].ts) * consumption / countMutiple, value[j].cpu, value[j].freq, dealArr[i].ts + dealArr[i].dur - value[j].ts, '', (dealArr[i].ts + dealArr[i].dur - value[j].ts) / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (dealArr[i].ts + dealArr[i].dur - value[j].ts) * consumption / countMutiple, value[j].cpu, value[j].freq, dealArr[i].ts + dealArr[i].dur - value[j].ts, '', (dealArr[i].ts + dealArr[i].dur - value[j].ts) / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                        break;
                    }
                    // 如果频点数据开始时间小于某一周期起始时间，结束时间大于该周期的开始时间。且频点数据结束时间大于周期结束时间的情况
                    if (dealArr[i].ts > value[j].ts && value[j].ts + value[j].dur > dealArr[i].ts && value[j].ts + value[j].dur > dealArr[i].ts + dealArr[i].dur) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, dealArr[i].dur * consumption / countMutiple, value[j].cpu, value[j].freq, dealArr[i].dur, '', dealArr[i].dur / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, dealArr[i].dur * consumption / countMutiple, value[j].cpu, value[j].freq, dealArr[i].dur, '', dealArr[i].dur / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                        break;
                    }
                    // 如果频点数据开始时间小于某一周期起始时间，结束时间大于该周期的开始时间。且频点数据结束时间小于等于周期结束时间的情况
                    if (dealArr[i].ts > value[j].ts && value[j].ts + value[j].dur > dealArr[i].ts && value[j].ts + value[j].dur <= dealArr[i].ts + dealArr[i].dur) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (value[j].ts + value[j].dur - dealArr[i].ts) * consumption / countMutiple, value[j].cpu, value[j].freq, value[j].ts + value[j].dur - dealArr[i].ts, '', (value[j].ts + value[j].dur - dealArr[i].ts) / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (value[j].ts + value[j].dur - dealArr[i].ts) * consumption / countMutiple, value[j].cpu, value[j].freq, value[j].ts + value[j].dur - dealArr[i].ts, '', (value[j].ts + value[j].dur - dealArr[i].ts) / value[j].dur * value[j].percent, 'freqdata', i, undefined));
                    }
                }
                this.mergeData(resList);
                // 整理排序相同周期下的数据
                this.mergeCpuData(cpuMap.get(key)!, resList);
                // 将cpu数据放置到对应周期层级下
                this.mergeCycleData(cycleMap.get(key)![i], cpuMap.get(key));
            }
        });
    }
    /**
     * Loop方式切割数据功能
     */
    dataLoopCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement, resultList: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        threadId.style.border = '1px solid rgb(151,151,151)';
        threadFunc.style.border = '1px solid rgb(151,151,151)';
        let threadIdValue = threadId!.value.trim();
        let threadFuncName = threadFunc.value.trim();
        let leftNS = this.currentSelectionParam.leftNs;
        let rightNS = this.currentSelectionParam.rightNs;
        let tableValue: any = this.threadStatesTbl;
        tableValue.value = [];
        if (threadIdValue !== '' && threadFuncName !== '') {
            querySearchFuncData(threadFuncName, Number(threadIdValue), leftNS, rightNS).then(res => {
                if (res !== null && res.length > 0) {
                    // targetMap为全局initData的拷贝对象，cutArr数组用来存放周期切割依据数据
                    let targetMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map(), cutArr: Array<any> = [];
                    // 新创建map对象接收传过来的实参map
                    resultList.forEach((item: Array<TabPaneFreqUsageConfig>, key: string) => {
                        targetMap.set(key, JSON.parse(JSON.stringify(item)));
                    })
                    // 根据线程id及方法名获取的数据，处理后用作切割时间依据，时间跨度为整个方法开始时间到末个方法开始时间
                    for (let i of res) {
                        cutArr[cutArr.length - 1] && (cutArr[cutArr.length - 1].dur = i.startTime ? i.startTime + this.currentSelectionParam.recordStartNs - cutArr[cutArr.length - 1].ts : 0);
                        cutArr.push({ 'ts': i.startTime + this.currentSelectionParam.recordStartNs });
                    }
                    let cycleMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
                    let totalList: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
                    this.mergeLoopData(cutArr, targetMap, cycleMap, totalList);
                    let threadArr: Array<any> = JSON.parse(JSON.stringify(this.threadArr));
                    let processArr: Array<any> = JSON.parse(JSON.stringify(this.processArr));
                    this.mergeThreadData(threadArr, cycleMap);
                    let totalData = this.merge(totalList);
                    this.mergeTotalData(threadArr, totalData);
                    this.mergePidData(processArr, threadArr);
                    this.fixedDeal(processArr);
                    this.threadStatesTblSource = processArr;
                    this.threadStatesTbl!.recycleDataSource = processArr;
                    this.threadStatesTbl!.loading = false;
                    this.threadClick(processArr);
                } else {
                    this.threadStatesTblSource = [];
                    this.threadStatesTbl!.recycleDataSource = [];
                    this.threadStatesTbl!.loading = false;
                }
            })
        } else {
            this.threadStatesTbl!.loading = false;
            if (threadIdValue === '') {
                threadId.style.border = '2px solid rgb(255,0,0)';
            }
            if (threadFuncName === '') {
                threadFunc.style.border = '2px solid rgb(255,0,0)';
            }
        }
    }
    /**
     * 整合Loop切割方式中的频点数据与方法周期数据
     */
    mergeLoopData(cutArr: Array<any>, targetMap: Map<string, Array<any>>, cycleMap: Map<string, Array<TabPaneFreqUsageConfig>>, totalList: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        let timeDur: number = this.currentSelectionParam.recordStartNs;
        targetMap.forEach((value, key) => {
            cycleMap.set(key, new Array());
            totalList.set(key, new Array());
            for (let i = 0; i < cutArr.length - 1; i++) {
                let cpuArr: Array<number> = [], resList: Array<TabPaneFreqUsageConfig> = [], cpuMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map();
                // 时间倍数值
                const countMutiple = 1000000;
                cpuMap.set(key, new Array());
                // 创建周期层级数据
                cycleMap.get(key)?.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[0].thread, ((cutArr[i].ts - timeDur) / 1000000).toFixed(3), key.split('_')[0], key.split('_')[1], 0, '', '', 0, (cutArr[i].dur / 1000000).toFixed(3), 0, 'cycle', i + 1, []));
                for (let j = 0; j < value.length; j++) {
                    // 判断若用户导入json文件，则替换为对应cpu下的对应频点的算力值进行算力消耗计算
                    let consumptionMap: Map<number, number> = SegMenTaTion.freqInfoMapData.size > 0 && SegMenTaTion.freqInfoMapData.get(value[j].cpu);
                    // 若存在算力值，则直接取值做计算。若不存在算力值，且频点值不为unknown的情况，则取频点值做计算，若为unknown，则取0做兼容
                    const consumption = (consumptionMap && consumptionMap.get(value[j].freq)) ? consumptionMap.get(value[j].freq) : (value[j].freq == 'unknown' ? 0 : value[j].freq);
                    if (!cpuArr.includes(value[j].cpu)) {
                        cpuArr.push(value[j].cpu);
                        // 创建cpu层级数据，以便后续生成树结构
                        cpuMap.get(key)?.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, 0, value[j].cpu, '', 0, '', 0, 'cpu', -1, []));
                    }
                    // 以下为频点数据按Loop周期切割数据如何取舍的判断条件，cutArr为周期切割依据，value为某一线程下的频点汇总数据
                    // 如果频点数据开始时间大于某一周期起始时间，且结束时间小于等于下一同名方法开始时间的情况
                    if (value[j].ts >= cutArr[i].ts && (value[j].ts + value[j].dur) <= cutArr[i + 1].ts) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (consumption * value[j].dur) / countMutiple, value[j].cpu, value[j].freq, value[j].dur, '', value[j].percent, 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (consumption * value[j].dur) / countMutiple, value[j].cpu, value[j].freq, value[j].dur, '', value[j].percent, 'freqdata', i, undefined));
                    }
                    // 如果频点数据开始时间大于某一周期起始时间，且结束时间大于下一同名方法开始时间的情况
                    if (value[j].ts >= cutArr[i].ts && (value[j].ts + value[j].dur) > cutArr[i + 1].ts) {
                        if (cutArr[i + 1].ts - value[j].ts > 0) {
                            resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (consumption * (cutArr[i + 1].ts - value[j].ts)) / countMutiple, value[j].cpu, value[j].freq, cutArr[i + 1].ts - value[j].ts, '', value[j].percent * ((cutArr[i + 1].ts - value[j].ts) / value[j].dur), 'freqdata', i, undefined));
                            totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (consumption * (cutArr[i + 1].ts - value[j].ts)) / countMutiple, value[j].cpu, value[j].freq, cutArr[i + 1].ts - value[j].ts, '', value[j].percent * ((cutArr[i + 1].ts - value[j].ts) / value[j].dur), 'freqdata', i, undefined));
                            break;
                        }
                    }
                    // 如果频点数据开始时间小于某一周期起始时间，且结束时间大于下一同名方法开始时间的情况
                    if (value[j].ts < cutArr[i].ts && (value[j].ts + value[j].dur) > cutArr[i + 1].ts) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (consumption * (cutArr[i + 1].ts - cutArr[i].ts)) / countMutiple, value[j].cpu, value[j].freq, cutArr[i + 1].ts - cutArr[i].ts, '', value[j].percent * ((cutArr[i + 1].ts - cutArr[i].ts) / value[j].dur), 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (consumption * (cutArr[i + 1].ts - cutArr[i].ts)) / countMutiple, value[j].cpu, value[j].freq, cutArr[i + 1].ts - cutArr[i].ts, '', value[j].percent * ((cutArr[i + 1].ts - cutArr[i].ts) / value[j].dur), 'freqdata', i, undefined));
                    }
                    // 如果频点数据开始时间小于某一周期起始时间，结束时间大于该方法开始时间。且频点数据结束时间小于下一同名方法开始时间
                    if (value[j].ts < cutArr[i].ts && (value[j].ts + value[j].dur) > cutArr[i].ts && (value[j].ts + value[j].dur) < cutArr[i + 1].ts) {
                        resList.push(new TabPaneFreqUsageConfig('cycle' + (i + 1) + '—' + value[j].thread, '', value[j].pid, value[j].tid, (consumption * (value[j].dur + value[j].ts - cutArr[i].ts)) / countMutiple, value[j].cpu, value[j].freq, value[j].dur + value[j].ts - cutArr[i].ts, '', value[j].percent * ((value[j].dur + value[j].ts - cutArr[i].ts) / value[j].dur), 'freqdata', i, undefined));
                        totalList.get(key)?.push(new TabPaneFreqUsageConfig(value[j].thread, '', value[j].pid, value[j].tid, (consumption * (value[j].dur + value[j].ts - cutArr[i].ts)) / countMutiple, value[j].cpu, value[j].freq, value[j].dur + value[j].ts - cutArr[i].ts, '', value[j].percent * ((value[j].dur + value[j].ts - cutArr[i].ts) / value[j].dur), 'freqdata', i, undefined));
                    }
                }
                // 合并相同周期内的数据
                this.mergeData(resList);
                // 整理排序相同周期下的数据
                this.mergeCpuData(cpuMap.get(key)!, resList);
                // 将cpu数据放置到对应周期层级下
                this.mergeCycleData(cycleMap.get(key)![i], cpuMap.get(key));
            }
        });
    }
    /**
     * 切割后整合好的周期频点数据放置到对应的线程下
     */
    mergeThreadData(threadArr: Array<any>, cycleMap: Map<string, Array<TabPaneFreqUsageConfig>>): void {
        for (let i = 0; i < threadArr.length; i++) {
            let cycleMapData = cycleMap.get(threadArr[i].pid + '_' + threadArr[i].tid);
            for (let j = 0; j < cycleMapData!.length; j++) {
                threadArr[i].children.push(cycleMapData![j]);
                threadArr[i].count += cycleMapData![j].count;
                threadArr[i].dur += cycleMapData![j].dur;
                threadArr[i].percent += cycleMapData![j].percent;
            }
        }
    }
    /**
     * 切割后整合好的线程级频点数据放置到对应的进程
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
     * 合并相同周期内运行所在cpu相同、频点相同的数据
     */
    mergeData(resList: Array<any>): void {
        // 合并相同周期内的数据
        for (let i = 0; i < resList.length; i++) {
            for (let j = i + 1; j < resList.length; j++) {
                if (resList[i].cpu === resList[j].cpu && resList[i].freq === resList[j].freq && resList[i].id === resList[j].id) {
                    resList[i].dur += resList[j].dur;
                    resList[i].percent += resList[j].percent;
                    resList[i].count += resList[j].count;
                    resList.splice(j, 1);
                    j--;
                }
            }
        }
    }
    /**
     * 将cpu层级数据放到对应的周期层级下
     */
    mergeCycleData(obj: TabPaneFreqUsageConfig, arr: Array<any> | undefined): void {
        for (let i = 0; i < arr!.length; i++) {
            if (arr![i].count === 0 && arr![i].dur === 0) {
                continue;
            }
            obj.children?.push(arr![i]);
            obj.count += arr![i].count;
            obj.dur += arr![i].dur;
            obj.percent += arr![i].percent;
        }
    }
    /**
     * 将切割好的不区分周期的数据作为total数据放到对应的线程层级下，周期数据前
     */
    mergeTotalData(threadArr: Array<any>, totalData: Array<TabPaneFreqUsageConfig>): void {
        for (let i = 0; i < threadArr.length; i++) {
            for (let j = 0; j < totalData.length; j++) {
                if (Number(threadArr[i].pid) === Number(totalData[j].pid) && Number(threadArr[i].tid) === Number(totalData[j].tid)) {
                    totalData[j].thread = 'TotalData';
                    threadArr[i].children.unshift(totalData[j]);
                }
            }
        }
    }
    /**
     * 整理排序相同周期下的数据
     */
    mergeCpuData(cpuArray: Array<TabPaneFreqUsageConfig>, resList: Array<TabPaneFreqUsageConfig>): void {
        // 以算力消耗降序排列
        resList.sort((a, b) => b.count - a.count);
        // 以cpu升序排列
        cpuArray.sort((a: any, b: any) => a.cpu - b.cpu);
        cpuArray.forEach((item: any) => {
            for (let s = 0; s < resList.length; s++) {
                if (item.cpu === resList[s].cpu) {
                    item.children.push(resList[s]);
                    item.count += resList[s].count;
                    item.dur += resList[s].dur;
                    item.percent += resList[s].percent;
                }
            }
        });

    }
    /**
     * 切割好的不区分周期的数据，以相同cpu相同频点的进行整合
     */
    merge(totalList: Map<string, Array<TabPaneFreqUsageConfig>>): Array<TabPaneFreqUsageConfig> {
        let result: Array<TabPaneFreqUsageConfig> = new Array();
        totalList.forEach((value: any, key: any) => {
            let countNum = result.push(new TabPaneFreqUsageConfig('', '', key.split('_')[0], key.split('_')[1], 0, '', '', 0, '', 0, 'cycle', 0, []));
            let cpuArr: Array<any> = [];
            let flagArr: Array<any> = [];
            for (let i = 0; i < value.length; i++) {
                if (!flagArr.includes(value[i].cpu)) {
                    flagArr.push(value[i].cpu);
                    let flag = cpuArr.push(new TabPaneFreqUsageConfig(value[i].thread, '', value[i].pid, value[i].tid, 0, value[i].cpu, '', 0, '', 0, 'cpu', -1, []));
                    result[countNum - 1].children?.push(cpuArr[flag - 1]);
                }
                for (let j = i + 1; j < value.length; j++) {
                    if (value[i].cpu === value[j].cpu && value[i].freq === value[j].freq) {
                        value[i].dur += value[j].dur;
                        value[i].percent += value[j].percent;
                        value[i].count += value[j].count;
                        value.splice(j, 1);
                        j--;
                    }
                }
            }
            result[countNum - 1].children?.sort((a: any, b: any) => a.cpu - b.cpu);
            for (let i = 0; i < cpuArr.length; i++) {
                for (let j = 0; j < value.length; j++) {
                    if (cpuArr[i].cpu === value[j].cpu) {
                        cpuArr[i].children.push(value[j]);
                        cpuArr[i].dur += value[j].dur;
                        cpuArr[i].count += value[j].count;
                        cpuArr[i].percent += value[j].percent;
                    }
                }
                result[countNum - 1].dur += cpuArr[i].dur;
                result[countNum - 1].count += cpuArr[i].count;
                result[countNum - 1].percent += cpuArr[i].percent;
            }
        });
        return result;
    }
    /**
     * 递归整理数据，取小数位数，转换单位
     */
    fixedDeal(arr: Array<any>): void {
        if (arr === undefined) {
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            arr[i].percent = arr[i].percent > 100 ? 100 : arr[i].percent;
            arr[i].percent = arr[i].percent.toFixed(2);
            arr[i].dur = (arr[i].dur / 1000000).toFixed(3);
            if (arr[i].freq !== '') {
                if (arr[i].freq === 'unknown') {
                    arr[i].freq = 'unknown';
                } else {
                    arr[i].freq = arr[i].freq / 1000;
                }
            }
            if (!(SegMenTaTion.freqInfoMapData.size > 0)) {
                arr[i].count = (arr[i].count / 1000).toFixed(3);
            } else {
                arr[i].count = (arr[i].count).toFixed(3);
            }
            this.fixedDeal(arr[i].children);
        }
    }

    /**
     * 绑定表格点击事件
     */
    private threadClick(data: Array<SliceGroup>): void {
        let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i].innerHTML;
                labels[i].addEventListener('click', (e) => {
                    if (!this.threadStatesTblSource.length && !this.threadStatesTbl!.recycleDataSource.length) {
                        data = [];
                    }
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
                    } else if (label.includes('Cycle') && i === 2) {
                        for (let item of data) {
                            item.status = true;
                            for (let value of item.children ? item.children : []) {
                                value.status = true;
                                if (value.children != undefined && value.children.length > 0) {
                                    this.threadStatesTbl!.setStatus(value.children, false);
                                }
                            }
                        }
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('CPU') && i === 3) {
                        this.threadStatesTbl!.setStatus(data, true);
                        this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
                    }
                });
            }
        }
    }
    /**
     * 散点图渲染数据整理
     */
    render(res: Array<any>, str: string, queryCycleScatter: Array<number>): void {
        let maxFreq: HTMLInputElement = this.scatterInput!.querySelector('#maxFreq')!;
        let maxHz: HTMLInputElement = this.scatterInput!.querySelector('#maxHz')!;
        maxFreq.style.border = '1px solid rgb(151,151,151)';
        maxHz.style.border = '1px solid rgb(151,151,151)';
        if (maxFreq.value && maxHz.value) {
            if (/^[0-9]*$/.test(maxFreq.value) && /^[0-9]*$/.test(maxHz.value)) {
                // @ts-ignore
                this.shadowRoot?.querySelector('#cycleQuery')!.style.display = 'block';
                let freq: Map<number, number> = (SegMenTaTion.freqInfoMapData.size > 0 && SegMenTaTion.freqInfoMapData.get(SegMenTaTion.freqInfoMapData.size - 1));
                // @ts-ignore
                let yAxis: number = (freq && freq.get(Number(maxFreq.value) * 1000)) ? freq.get(Number(maxFreq.value) * 1000) : Number(maxFreq.value);
                let xAxis: number = yAxis * 1000 / Number(maxHz.value);//MHz·s
                // 需要做筛选时，会利用下面的cycleA、cycleB数组 
                let scatterArr: Array<Array<number>> = [], traceRowdata: Array<object> = [], cycleA: Array<Array<number>> = [], cycleB: Array<Array<number>> = [];
                let cycleAStart: number = queryCycleScatter[0] || 0, cycleAEnd: number = queryCycleScatter[1] || 0, cycleBStart: number = queryCycleScatter[2] || 0, cycleBEnd: number = queryCycleScatter[3] || 0;
                for (let i = 1; i < res.length; i++) {
                    const count: number = Number(res[i].count), dur: number = Number(res[i].cdur), r_dur: number = Number(res[i].dur);//MHz·ms   ms   ms
                    scatterArr.push([count, count / dur, i, dur, r_dur]);
                    traceRowdata.push(
                        {
                            'dur': dur * 1000000,
                            'value': count,
                            'freq': Math.round(count / dur) * 1000,
                            'startNS': Number(res[i].ts) * 1000000,
                            'cycle': i - 1
                        }
                    );
                    if (dur >= cycleAStart && dur < cycleAEnd) {
                        cycleA.push([count, count / dur, i, dur, r_dur]);
                    }
                    if (dur >= cycleBStart && dur < cycleBEnd) {
                        cycleB.push([count, count / dur, i, dur, r_dur]);
                    }
                }
                this.setConfig(Number(maxHz.value), str, scatterArr, yAxis, xAxis, cycleA, cycleB);
                SegMenTaTion.setChartData('CPU-FREQ', traceRowdata);
            } else {
                if (!/^[0-9]*$/.test(maxFreq.value)) {
                    maxFreq.style.border = '2px solid rgb(255,0,0)';
                }
                if (!/^[0-9]*$/.test(maxHz.value)) {
                    maxHz.style.border = '2px solid rgb(255,0,0)';
                }
            }
        } else {
            if (maxFreq.value === '') {
                maxFreq.style.border = '2px solid rgb(255,0,0)';
                maxFreq.setAttribute('placeholder', 'Please input maxFreq');
            }
            if (maxHz.value === '') {
                maxHz.style.border = '2px solid rgb(255,0,0)';
                maxHz.setAttribute('placeholder', 'Please input Fps');
            }
            SegMenTaTion.setChartData('CPU-FREQ', []);
        }
    }

    /**
     * 配置散点图
     */
    setConfig(maxHz: number, str: string, scatterArr: Array<Array<number>>, yAxis: number, xAxis: number, cycleA: Array<Array<number>>, cycleB: Array<Array<number>>): void {
        this.statisticsScatter!.config = {
            // 纵轴坐标值
            yAxisLabel: [Math.round(yAxis / 5), Math.round(yAxis * 2 / 5), Math.round(yAxis * 3 / 5), Math.round(yAxis * 4 / 5), Math.round(yAxis)],
            // 横轴坐标值
            xAxisLabel: [Math.round(xAxis / 5), Math.round(xAxis * 2 / 5), Math.round(xAxis * 3 / 5), Math.round(xAxis * 4 / 5), Math.round(xAxis), Math.round(xAxis * 6 / 5)],
            // 横轴字段、纵轴字段
            AxisLabel: ['负载', '算力供给'],
            // 是否加载最大负载线及均衡线
            drawload: true,
            // 最大负载线及均衡线值
            load: [xAxis, maxHz],
            // 绘制点数据信息存储数组
            paintingData: [],
            // 当前移入点坐标信息
            hoverData: {},
            // 颜色池
            colorPool: () => ['#2f72f8', '#ffab67', '#a285d2'],
            // 移入数据点时是否触发函数
            //@ts-ignore
            hoverEvent: SegMenTaTion.tabHover,
            // 渐变色背景信息
            globalGradient: undefined,
            // 渲染数据点
            data: [scatterArr, cycleA, cycleB],
            // 散点图title
            title: str,
            colorPoolText: () => ['Total', 'CycleA', 'CycleB'],
            tip: (data: any) => {
                return `
                    <div>
                        <span>Cycle: ${data.c[2]};</span></br>
                        <span>Comsumption: ${data.c[0]};</span></br>
                        <span>Cycle_dur: ${data.c[3]} ms;</span></br>
                        <span>Running_dur: ${data.c[4]} ms;</span></br>
                    </div>
                `
            }
        };

    }

    initElements(): void {
        this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-running-datacut');
        // 绑定single、loop按钮点击事件
        this.threadStatesDIV = this.shadowRoot?.querySelector('#dataCut');
        this.threadStatesDIV?.children[2].children[0].addEventListener('click', (e) => {
            this.threadStatesTbl!.loading = true;
            // @ts-ignore
            this.dataSingleCut(this.threadStatesDIV?.children[0]!, this.threadStatesDIV?.children[1]!, this.initData);
        })
        this.threadStatesDIV?.children[2].children[1].addEventListener('click', (e) => {
            this.threadStatesTbl!.loading = true;
            // @ts-ignore
            this.dataLoopCut(this.threadStatesDIV?.children[0]!, this.threadStatesDIV?.children[1]!, this.initData);
        })
        this.statisticsScatter = this.shadowRoot?.querySelector('#chart-scatter');
        // 增加表格thread层级点击更新散点图事件、周期层级点击高亮泳道图对应段事件
        let scatterData: Array<TabPaneRunningConfig> = new Array();
        let str: string = '';
        this.threadStatesTbl!.addEventListener('row-click', (evt): void => {
            // @ts-ignore
            if (evt.detail.flag === 'thread') {
                // @ts-ignore
                scatterData = evt.detail.children;
                // @ts-ignore
                str = evt.detail.thread;
                this.render(scatterData, str, []);
            }
            // @ts-ignore
            if (evt.detail.flag === 'cycle' && evt.detail.pid === scatterData[evt.detail.id - 1].pid && evt.detail.tid === scatterData[evt.detail.id - 1].tid) {
                // @ts-ignore
                SegMenTaTion.tabHover('CPU-FREQ', true, evt.detail.id - 1);

            }
        });
        this.scatterInput = this.shadowRoot?.querySelector('.chart-box');
        this.shadowRoot?.querySelector('#query-btn')!.addEventListener('click', (e) => {
            // @ts-ignore
            let cycleAStartValue = this.shadowRoot?.querySelector('#cycle-a-start-range')!.value;
            // @ts-ignore
            let cycleAEndValue = this.shadowRoot?.querySelector('#cycle-a-end-range')!.value;
            // @ts-ignore
            let cycleBStartValue = this.shadowRoot?.querySelector('#cycle-b-start-range')!.value;
            // @ts-ignore
            let cycleBEndValue = this.shadowRoot?.querySelector('#cycle-b-end-range')!.value;
            let queryCycleScatter = [Number(cycleAStartValue), Number(cycleAEndValue), Number(cycleBStartValue), Number(cycleBEndValue)];
            this.render(scatterData, str, queryCycleScatter);
        })
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
            height: 100%;
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
        .d-box{
            display: flex;
            margin: 20px;
            margin-left: 0;
            /*height: calc(100vh - 165px);*/
            height: 100%';
        }
        .chart-box{
            width: 35%;
            min-width: 35%
        }
        .table-box{
            width: 65%;
            border-right: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
        }
        #chart-scatter{
            height: 390px;
        }
        #query-btn{
            width:90px;
        }
        </style>
        <div id='dataCut'>
            <input id="dataCutThreadId" type="text" style="width: 15%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="Please input thread id" value='' />
            <input id="dataCutThreadFunc" type="text" style="width: 20%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="Please input function name" value='' />
            <div style="width:20%;height: 100%;display:flex;justify-content: space-around;">
                <button>Single</button>
                <button>Loop</button>
            </div>
        </div>
        <selector class="d-box">
        <lit-slicer style="width:100%">
        <div class="table-box" style="width: 65%">
            <lit-table id="tb-running-datacut" style="height: auto; overflow:auto;margin-top:5px" tree>
                <lit-table-column class="running-percent-column" width="290px" title="Process/Thread/Cycle/CPU" data-index="thread" key="thread" align="flex-start" retract>
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="100px" title="Cycle_st(ms)" data-index="ts" key="ts" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="120px" title="Cycle_dur(ms)" data-index="cdur" key="cdur" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="60px" title="CPU" data-index="cpu" key="cpu" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="140px" title="Consumption" data-index="count" key="count" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="100px" title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="120px" title="Running_dur(ms)" data-index="dur" key="dur" align="flex-start">
                </lit-table-column>
                <lit-table-column class="running-percent-column" width="90px" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
                </lit-table-column>
            </lit-table>
            </div>
                <lit-slicer-track ></lit-slicer-track>
                <div class="chart-box" style="flex">
                <div>
                    <span>maxFreq: </span>
                    <input id="maxFreq" type="text" style="width: 27%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;margin-right:17%" placeholder="Please input maxFreq" value='' />
                    <span>Fps: </span>
                    <input id="maxHz" type="text" style="width: 27%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;" placeholder="Please input Fps" value='' />
                </div>
                <div style="flex: 1;display: flex; flex-direction: row;">
                </div>
                <lit-chart-scatter id="chart-scatter"></lit-chart-scatter>
                <div id= "cycleQuery" style="margin-bottom:5px;margin-top:5px;display:none">
                        <div id="cycle-a">
                            <span>Cycle A: </span>
                            <input id="cycle-a-start-range" type="text" class="cycle-range-input" style="width: 15%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;"  placeholder="Time(ms)" value='' />
                            <span>~</span>
                            <input id="cycle-a-end-range" type="text" class="cycle-range-input" style="width: 15%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;" placeholder="Time(ms)" value='' />
                        </div>
                        <div style="margin-top: 5px; display:flex; flex-derection:row; justify-content:space-between">
                            <div id="cycle-b">
                                <span>Cycle B: </span>
                                <input id="cycle-b-start-range" type="text" class="cycle-range-input" style="width: 18%;height:77%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;" placeholder="Time(ms)" value='' />
                                <span>~</span>
                                <input id="cycle-b-end-range" type="text" class="cycle-range-input" style="width: 18%;height:77%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%;" placeholder="Time(ms)" value='' />
                            </div>
                            <div>
                                <button id="query-btn">Query</button>
                            </div>
                        </div>
                </div>
            </div>
        </lit-slicer>
     </selector>
        `
    }
}