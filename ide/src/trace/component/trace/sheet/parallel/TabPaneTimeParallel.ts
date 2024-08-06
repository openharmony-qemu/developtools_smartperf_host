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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import '../../../../../base-ui/checkbox/LitCheckBox';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import '../../../../../base-ui/popover/LitPopoverV';
import { LitPopover } from '../../../../../base-ui/popover/LitPopoverV';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { queryRunningThread, queryCoreRunningThread } from '../../../../database/sql/ProcessThread.sql';
import { ClassifyCoreSettingHtml } from '../TabPaneTime.html';
import { HanldParalLogic, MeterHeaderClick } from './ParallelUtil';
import { TabPaneFilter } from '../TabPaneFilter';
import { Utils } from '../../base/Utils';


const UNIT: number = 1000000.0;
const NUM_DIGITS: number = 3;
const CORE_NUM: number = 12;
const SMALL_CPU_NUM: Array<number> = [0, 1, 2, 3];
const MID_CPU_NUM12: Array<number> = [4, 5, 6, 7, 8, 9];
const LARGE_CPU_NUM12: Array<number> = [10, 11];

@element('tabpane-time-parallel')
export class TabPaneTimeParallel extends BaseElement {
    private bottomFilterEl: TabPaneFilter | undefined | null;
    private parallelTable: LitTable | null | undefined;
    private coreParallelTable: LitTable | null | undefined;
    private litPopoverEl: LitPopover | null | undefined;
    private selectionParam: SelectionParam | undefined;
    private initMap: Map<string, unknown> = new Map<string, unknown>();
    private leftStartNs: number = 0;
    private rightEndNs: number = 0;
    private midCores: Array<number> = [];
    private largeCores: Array<number> = [];
    private smallCores: Array<number> = [];
    private initStatus: boolean = true;

    set data(threadStatesParam: SelectionParam) {
        if (this.selectionParam === threadStatesParam) { return; };
        this.selectionParam = threadStatesParam;
        this.leftStartNs = this.selectionParam!.leftNs + this.selectionParam!.recordStartNs;
        this.rightEndNs = this.selectionParam!.rightNs + this.selectionParam!.recordStartNs;
        //每次新款选线程时清空Map对象
        this.initMap.clear();
        this.initStatus = true;
        this.initDefaultConfig();
        this.parallelTable!.recycleDataSource = [];
        this.coreParallelTable!.recycleDataSource = [];
        this.switchTableInfo();
    }
    initElements(): void {
        this.parallelTable = this.shadowRoot!.querySelector<LitTable>('#tb-parallel');
        this.coreParallelTable = this.shadowRoot!.querySelector<LitTable>('#tb-core-parallel');
        this.bottomFilterEl = this.shadowRoot?.querySelector('#filter');
        this.litPopoverEl = this.bottomFilterEl?.shadowRoot?.querySelector('#data-core-popover');
        this.litPopoverEl!.querySelector<HTMLDivElement>('#core-mining')!.onclick = (e): void => {
            if (this.initStatus) {
                this.initDefaultConfig();
                this.initStatus = false;
                this.bottomFilterEl!.setCoreConfigList(Utils.getInstance().getWinCpuCount(), this.smallCores, this.midCores, this.largeCores);
            }
        };
        this.litPopoverEl!.querySelector<HTMLDivElement>('.confirm-button')!.addEventListener('click', (e: unknown) => {
            this.switchTableInfo();
        });
        this.litPopoverEl!.querySelector<HTMLDivElement>('.reset-button')!.addEventListener('click', (e: unknown) => {
            this.initStatus = true;
            this.reset();
        });
    }
    switchTableInfo(): void {
        // @ts-ignore
        this.litPopoverEl!.visible = false;
        //当大中小核未分组时，默认查询所有核
        if (!this.midCores.length && !this.largeCores.length && !this.smallCores.length) {
            this.assignAllCore();
        } else {
            this.assignGroupCore();
        }
    }

    reset(): void {
        // @ts-ignore
        this.litPopoverEl!.visible = false;
        if (Utils.getInstance().getWinCpuCount() === CORE_NUM) {
            this.coreParallelTable!.style.display = 'grid';
            this.parallelTable!.style.display = 'none';
            this.coreParallelTable!.loading = true;
            this.coreParallelTable!.recycleDataSource = [...this.initMap.values()];
            this.coreParallelTable!.loading = false;
            MeterHeaderClick(this.coreParallelTable, [...this.initMap.values()]);
        } else {
            this.parallelTable!.style.display = 'grid';
            this.coreParallelTable!.style.display = 'none';
            this.parallelTable!.loading = true;
            this.parallelTable!.recycleDataSource = [...this.initMap.values()];
            this.parallelTable!.loading = false;
        }
    }

    assignAllCore(): void {
        this.parallelTable!.style.display = 'grid';
        this.coreParallelTable!.style.display = 'none';
        this.parallelTable!.loading = true;
        this.getAllCoreData().then((res) => {
            // @ts-ignore
            if (this.initMap.size === 0) { this.initMap = res; }
            // @ts-ignore
            this.parallelTable!.recycleDataSource = [...res.values()];
            this.parallelTable!.loading = false;
        });
    }

    assignGroupCore(): void {
        this.coreParallelTable!.style.display = 'grid';
        this.parallelTable!.style.display = 'none';
        this.coreParallelTable!.loading = true;
        this.getCoreGroupData().then((res) => {
            // @ts-ignore
            if (this.initMap.size === 0) { this.initMap = res; }
            // @ts-ignore
            this.coreParallelTable!.recycleDataSource = [...res.values()];
            this.coreParallelTable!.loading = false;
            // @ts-ignore
            MeterHeaderClick(this.coreParallelTable, [...res.values()]);
        });
    }

    initDefaultConfig(): void {
        if (this.initStatus) {
            if (Utils.getInstance().getWinCpuCount() === CORE_NUM) {
                this.smallCores = [...SMALL_CPU_NUM];
                this.midCores = [...MID_CPU_NUM12];
                this.largeCores = [...LARGE_CPU_NUM12];
            } else {
                this.smallCores = [];
                this.midCores = [];
                this.largeCores = [];
            }
        }
    }

    //获取每次被框选线程对应的state数据
    async getAllCoreData(): Promise<unknown> {
        let dataSourceMap: Map<string, unknown> = new Map<string, unknown>();
        let processIds: Array<number> = [...new Set(this.selectionParam!.processIds)];
        let res: unknown = await queryRunningThread(processIds, this.selectionParam!.threadIds, this.leftStartNs, this.rightEndNs);
        this.handleAllParallelData(res, dataSourceMap);
        return dataSourceMap;
    }
    //获取核分类数据
    async getCoreGroupData(): Promise<unknown> {
        let dataSourceMap: Map<string, unknown> = new Map<string, unknown>();
        let processIds: Array<number> = [...new Set(this.selectionParam!.processIds)];
        let cpuObj: Object = {
            'L': this.largeCores,
            'M': this.midCores,
            'S': this.smallCores
        };
        for (const [key, val] of Object.entries(cpuObj)) {
            if (val.length) {
                let res: unknown = await queryCoreRunningThread(processIds, this.selectionParam!.threadIds, val, this.leftStartNs, this.rightEndNs);
                this.hanldeGroupParalleData(res, key, dataSourceMap);
            };
        }
        //转换最外层数据单位即保留三位小数
        for (const [i, item] of dataSourceMap) {
            // @ts-ignore
            item.dur = (item.dur / UNIT).toFixed(NUM_DIGITS);
            // @ts-ignore
            item.load = item.load.toFixed(NUM_DIGITS);
        }
        return dataSourceMap;
    }
    //处理未按核分组的数据
    handleAllParallelData(param: unknown, dataSourceMap: Map<string, unknown>): void {
        // @ts-ignore
        for (let i = 0; i < param.length; i++) {
            // @ts-ignore
            let stateItem = param[i];
            if (stateItem.ts < this.leftStartNs) {
                stateItem.ts = this.leftStartNs;
            }
            if (stateItem.endTs > this.rightEndNs) {
                stateItem.endTs = this.rightEndNs;
            }
            let dur = stateItem.endTs - stateItem.ts;
            if (dataSourceMap.has(`${stateItem.pid}`)) {
                let obj = dataSourceMap.get(`${stateItem.pid}`);
                // @ts-ignore
                let setArr = new Set(obj.tidArr);
                if (!(setArr.has(stateItem.tid))) {
                    setArr.add(stateItem.tid);
                    // @ts-ignore
                    obj.tidArr.push(stateItem.tid);
                }
                // @ts-ignore
                obj.dur += dur;
                // @ts-ignore
                obj!.stateItem.push(stateItem);
            } else {
                dataSourceMap.set(`${stateItem.pid}`, {
                    pid: stateItem.pid,
                    tid: stateItem.tid,
                    title: stateItem.pName ? `${stateItem.pName} ${stateItem.pid}` : `[NULL] ${stateItem.pid}`,
                    tidArr: [stateItem.tid],
                    dur: dur,
                    parallelNum: null,
                    allParallel: null,
                    stateItem: [stateItem],
                    tCount: null,
                    load: null,
                    pDur: null,
                    children: []
                });
            };
        };
        this.showTreeChart(dataSourceMap);
    }
    //处理核分组数据
    hanldeGroupParalleData(val: unknown, key: string, dataSourceMap: Map<string, unknown>): void {
        let coreMap: Map<string, unknown> = new Map<string, unknown>();
        // @ts-ignore
        for (let i = 0; i < val.length; i++) {
            // @ts-ignore
            let stateItem = val[i];
            if (stateItem.ts < this.leftStartNs) {
                stateItem.ts = this.leftStartNs;
            }
            if (stateItem.endTs > this.rightEndNs) {
                stateItem.endTs = this.rightEndNs;
            }
            let dur = stateItem.endTs - stateItem.ts;
            if (!dataSourceMap.has(`${stateItem.pid}`)) {
                dataSourceMap.set(`${stateItem.pid}`, {
                    pid: stateItem.pid,
                    tid: stateItem.tid,
                    title: stateItem.pName ? `${stateItem.pName} ${stateItem.pid}` : `[NULL] ${stateItem.pid}`,
                    dur: null,
                    parallelNum: null,
                    parallelDur: null,
                    allParallel: null,
                    tCount: null,
                    load: null,
                    pDur: null,
                    children: []
                });
            };
            if (coreMap.has(`${stateItem.pid} ${key}`)) {
                let obj = coreMap.get(`${stateItem.pid} ${key}`);
                // @ts-ignore
                let setArr = new Set(obj.tidArr);
                if (!(setArr.has(stateItem.tid))) {
                    setArr.add(stateItem.tid);
                    // @ts-ignore
                    obj.tidArr.push(stateItem.tid);
                }
                // @ts-ignore
                obj.dur += dur;
                // @ts-ignore
                obj!.stateItem.push(stateItem);
            } else {
                coreMap.set(`${stateItem.pid} ${key}`, {
                    pid: stateItem.pid,
                    tid: stateItem.tid,
                    title: `${key}`,
                    tidArr: [stateItem.tid],
                    dur: dur,
                    parallelNum: null,
                    parallelDur: null,
                    allParallel: null,
                    stateItem: [stateItem],
                    tCount: null,
                    load: null,
                    pDur: null,
                    children: []
                });
            };
        };
        this.showCoreTreeChart(coreMap, dataSourceMap);
    }

    showTreeChart(param: Map<string, unknown>): void {
        for (let [key, value] of param) {
            let pMap: Map<string, unknown> = new Map<string, unknown>();
            HanldParalLogic(this.hanldMapLogic, value, pMap);
            // @ts-ignore
            value.tCount = value.tidArr.length;
            // @ts-ignore
            value.load = (value.dur / ((100 * UNIT) * Utils.getInstance().getWinCpuCount())).toFixed(NUM_DIGITS);
            // @ts-ignore
            value.dur = (value.dur / UNIT).toFixed(NUM_DIGITS);
            if (pMap.size === 0) {
                // @ts-ignore
                value.allParallel = 0.000.toFixed(NUM_DIGITS);
            } else {
                for (const [i, item] of pMap) {
                    // @ts-ignore
                    value.allParallel += item.allParallel;
                    // @ts-ignore
                    item.allParallel = item.allParallel.toFixed(NUM_DIGITS);
                }
                // @ts-ignore
                value.allParallel = value.allParallel.toFixed(NUM_DIGITS);
                // @ts-ignore
                value.children = [...pMap.values()];
            }
        }
    }

    showCoreTreeChart(param: unknown, dataSourceMap: Map<string, unknown>): void {
        // @ts-ignore
        for (let [key, value] of param) {
            let pMap: Map<string, unknown> = new Map<string, unknown>();
            // @ts-ignore
            pMap = HanldParalLogic(this.hanldMapLogic, value, pMap);
            value.load = (value.dur / ((100 * UNIT) * Utils.getInstance().getWinCpuCount()));
            if (pMap.size === 0) {
                value.allParallel = 0.000;
                value.parallelNum = '-';
                value.parallelDur = '-';
            } else {
                for (const [i, item] of pMap) {
                    // @ts-ignore
                    value.allParallel += item.allParallel;
                    // @ts-ignore
                    item.allParallel = item.allParallel;
                    // @ts-ignore
                    item.allParallel = item.allParallel.toFixed(NUM_DIGITS);
                }
                value.children = [...pMap.values()];
            }
            if (dataSourceMap.has(`${value.pid}`)) {
                let obj = dataSourceMap.get(`${value.pid}`);
                value.tCount = value.tidArr.length;
                // @ts-ignore
                obj.dur += value.dur;
                // @ts-ignore
                obj.load += value.load;
                value.allParallel = value.allParallel.toFixed(NUM_DIGITS);
                value.dur = (value.dur / UNIT).toFixed(NUM_DIGITS);
                value.load = value.load.toFixed(NUM_DIGITS);
                // @ts-ignore
                obj.children.push(value);
            }
        }
    }
    //每次stateItem计算的的结果，处理对应map的值
    hanldMapLogic(dumpObj: unknown, value?: unknown, pMap?: unknown): unknown {
        // @ts-ignore
        let pDur = dumpObj.endTs - dumpObj.ts;
        // @ts-ignore
        let pSlice = ((dumpObj.len * pDur) / value.dur) * 100;
        // @ts-ignore
        if (pMap!.has(dumpObj.len.toString())) {
            // @ts-ignore
            let pObj = pMap!.get(dumpObj.len.toString());
            pObj.allParallel += pSlice;
            pObj.pDur += pDur;
            pObj.parallelDur = `${((pObj.pDur) / UNIT).toFixed(NUM_DIGITS)}`;
        } else {
            // @ts-ignore
            if (dumpObj.len !== 1) {
                // @ts-ignore
                pMap!.set(dumpObj.len.toString(), {
                    pid: null,
                    tid: null,
                    title: '',
                    // @ts-ignore
                    tidArr: value.tidArr,
                    dur: null,
                    allParallel: pSlice,
                    // @ts-ignore
                    parallelNum: dumpObj.len,
                    parallelDur: ((pDur) / UNIT).toFixed(NUM_DIGITS),
                    pDur: pDur,
                    // @ts-ignore
                    stateItem: value.stateItem,
                    tCount: null,
                    load: '-',
                    children: []
                });
            }
        }
        return pMap;
    }

    //回调函数，首次插入DOM时执行的初始化回调
    connectedCallback(): void {
        super.connectedCallback();
        new ResizeObserver(() => {
            if (this.parentElement?.clientHeight !== 0) {
                // @ts-ignore
                this.parallelTable!.shadowRoot!.querySelector('.table')!.style.height = `${this.parentElement!.clientHeight - 31}px`;
                this.parallelTable?.reMeauseHeight();
                // @ts-ignore
                this.coreParallelTable!.shadowRoot!.querySelector('.table')!.style.height = `${this.parentElement!.clientHeight - 31}px`;
                this.coreParallelTable?.reMeauseHeight();
                if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
                    this.bottomFilterEl!.style.display = 'none';
                } else {
                    this.bottomFilterEl!.style.display = 'flex';
                }
            }
        }).observe(this.parentElement!);
    }
    initHtml(): string {
        return ClassifyCoreSettingHtml;
    }
}
