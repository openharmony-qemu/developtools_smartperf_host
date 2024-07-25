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
import '../../../../../base-ui/radiobox/LitRadioBox';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import '../../../../../base-ui/popover/LitPopoverV';
import { LitPopover } from '../../../../../base-ui/popover/LitPopoverV';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { queryCoreRunningThread } from '../../../../database/sql/ProcessThread.sql';
import { MtSettingHtml } from '../TabPaneMt.html';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import '../../../../../base-ui/checkbox/LitCheckBox';
import { MeterHeaderClick, HanldParalLogic } from './ParallelUtil';
import { TabPaneFilter } from '../TabPaneFilter';
import { Utils } from '../../base/Utils';

const UNIT: number = 1000000.0;
const NUM_DIGITS: number = 3;
const CORE_NUM: number = 12;
const SMALL_CPU_NUM: Array<number> = [0, 1, 2, 3];
const MID_CPU_NUM12: Array<number> = [4, 5, 6, 7, 8, 9];
const LARGE_CPU_NUM12: Array<number> = [10, 11];
const CORE_JSON = {
    'group1': [4, 5],
    'group2': [6, 7],
    'group3': [8, 9],
    'group4': [10, 11],
};
export class CpuStatus {
    cpu: number = 0;
    small: boolean = false;
    medium: boolean = false;
    large: boolean = false;
}
@element('tabpane-mt-parallel')
export class TabPaneMtParallel extends BaseElement {
    private parallelTable: LitTable | null | undefined;
    private litSettingPopoverEl: LitPopover | null | undefined;
    private litGourpPopoverEl: LitPopover | null | undefined;
    private cpuTbl: HTMLDivElement | null | undefined;
    private groupContentDiv: HTMLDivElement | null | undefined;
    private selectionParam: SelectionParam | undefined;
    private dataSourceMap: Map<string, unknown> = new Map<string, unknown>();
    private leftStartNs: number = 0;
    private rightEndNs: number = 0;
    private midCores: Array<number> = [];
    private largeCores: Array<number> = [];
    private smallCores: Array<number> = [];
    private isCreateCpu: boolean = true;
    private isCreateGroup: boolean = true;
    private coreTypeMap: Map<string, unknown> = new Map<string, unknown>();
    private bottomFilterEl: TabPaneFilter | null | undefined;
    private addGroupArr: Array<number> = [];
    // @ts-ignore
    private bufferGroupMap: Map<string, Array<unknown>> = new Map<string, unknown>();
    private isReset: boolean = true;

    set data(threadStatesParam: SelectionParam) {
        if (this.selectionParam === threadStatesParam) { return; };
        this.selectionParam = threadStatesParam;
        this.leftStartNs = this.selectionParam!.leftNs + this.selectionParam!.recordStartNs;
        this.rightEndNs = this.selectionParam!.rightNs + this.selectionParam!.recordStartNs;
        this.isCreateCpu = true;
        this.parallelTable!.recycleDataSource = [];
        this.initDefaultConfig();
        this.resetSomeConfig(false);
    }
    initElements(): void {
        this.parallelTable = this.shadowRoot!.querySelector<LitTable>('#tb-parallel');
        this.bottomFilterEl = this.shadowRoot?.querySelector('#filter');
        this.litSettingPopoverEl = this.bottomFilterEl?.shadowRoot?.querySelector('#data-core-popover');
        this.litGourpPopoverEl = this.bottomFilterEl?.shadowRoot?.querySelector('#group-mining-popover');
        this.cpuTbl = this.litGourpPopoverEl!.querySelector<HTMLDivElement>('#tb_cpu');
        this.groupContentDiv = this.litGourpPopoverEl!.querySelector<HTMLDivElement>('.add_content');
        this.cpuSettingElListener();
        this.groupSettingElListener();
    }
    //Cpu Setting 气泡相关按钮监听
    cpuSettingElListener(): void {
        this.litSettingPopoverEl!.querySelector<HTMLDivElement>('#core-mining')!.onclick = (e): void => {
            if (this.isCreateCpu) {
                this.initDefaultConfig();
                this.isCreateCpu = false;
                this.bottomFilterEl!.setCoreConfigList(Utils.getInstance().getWinCpuCount(), this.smallCores, this.midCores, this.largeCores);
            };
        };
        this.litSettingPopoverEl!.querySelector<HTMLDivElement>('.confirm-button')!.addEventListener('click', (e: unknown) => {
            this.resetSomeConfig(true);
        });
        this.litSettingPopoverEl!.querySelector<HTMLDivElement>('.reset-button')!.addEventListener('click', (e: unknown) => {
            this.isCreateCpu = true;
            this.initDefaultConfig();
            this.resetSomeConfig(false);
        });
    }
    //Group Setting 气泡相关按钮监听
    groupSettingElListener(): void {
        this.litGourpPopoverEl!.querySelector<HTMLDivElement>('#group-mining')!.addEventListener('click', (e: unknown) => {
            this.addGroupArr = [];
            if (this.isCreateGroup) {
                this.groupContentDiv!.innerHTML = '';
                this.getGroupTableLine();
                //如果核数为12，默认配置分组
                if (Utils.getInstance().getWinCpuCount() === CORE_NUM && this.isReset) {
                    this.isReset = false;
                    const myMap = new Map(Object.entries(CORE_JSON));
                    for (const val of myMap.values()) {
                        this.initGroupFn(val);
                    }
                }
            } else {
                this.getGroupTableLine();
            }
        });
        this.litGourpPopoverEl!.querySelector<HTMLDivElement>('.add_group_button')!.addEventListener('click', (e: unknown) => {
            this.initGroupFn(this.addGroupArr);
            //每次需要添加的数组，在每次添加完后清空
            this.addGroupArr = [];
        });
        this.litGourpPopoverEl!.querySelector<HTMLDivElement>('.cut_group_button')!.addEventListener('click', (e: unknown) => {
            //支持撤回已配置好的分组
            if (!this.groupContentDiv!.childNodes.length) { return };
            let parts: unknown = this.groupContentDiv!.lastChild!.textContent?.split(':');
            // @ts-ignore
            if (this.bufferGroupMap.has(parts[0])) { this.bufferGroupMap.delete(parts[0]) };
            this.groupContentDiv!.removeChild(this.groupContentDiv!.lastChild!);
            this.addGroupArr = [];
            this.getGroupTableLine('cut');
        });
        this.litGourpPopoverEl!.querySelector<HTMLDivElement>('.confirm-group-button')!.addEventListener('click', (e: unknown) => {
            this.updateDataSource(true);
            // @ts-ignore
            this.litGourpPopoverEl!.visible = false;
        });
        this.litGourpPopoverEl!.querySelector<HTMLDivElement>('.reset-group-button')!.addEventListener('click', (e: unknown) => {
            this.resetGroup(false);
            this.isCreateCpu = true;
            this.initDefaultConfig();
            this.updateDataSource(false);
            // @ts-ignore
            this.litGourpPopoverEl!.visible = false;
        });
    }
    //group setting 重置
    resetGroup(isRest: boolean): void {
        this.isCreateGroup = true;
        this.bufferGroupMap.clear();
        this.isReset = !isRest;
    }
    //当cpu setting点击重置或者确认时，需要重置Group setting的数据
    resetSomeConfig(isRest: boolean): void {
        this.resetGroup(isRest);
        this.updateDataSource(isRest);
        // @ts-ignore
        this.litSettingPopoverEl!.visible = false;
    }
    //更新treeData
    updateDataSource(flag: boolean): void {
        let param = flag ? this.bufferGroupMap.size !== 0 : Utils.getInstance().getWinCpuCount() === CORE_NUM;
        let value = flag ? this.bufferGroupMap : new Map(Object.entries(CORE_JSON));
        if ((this.midCores.length || this.largeCores.length || this.smallCores.length) && param) {
            this.coreTypeMap.clear();
            this.dataSourceMap.clear();
            this.parallelTable!.loading = true;
            this.getMtParallelData(value).then(() => {
                this.parallelTable!.recycleDataSource = [...this.dataSourceMap.values()];
                this.parallelTable!.loading = false;
                MeterHeaderClick(this.parallelTable, [...this.dataSourceMap.values()]);
            });
        } else {
            this.parallelTable!.recycleDataSource = [];
            MeterHeaderClick(this.parallelTable, []);
        }
    }
    async getMtParallelData(obj: Map<string, unknown>) :Promise<void> {
        let cpuObj: unknown = { 'L': this.largeCores, 'M': this.midCores, 'S': this.smallCores };
        let processIds: Array<number> = [...new Set(this.selectionParam!.processIds)];
        for (const [key, cpuGroup] of obj.entries()) {
            //判断配的的组是否在同一个核分类中，如果在，返回是那个核分类，反之，返回null
            // @ts-ignore
            let core = this.handleSamePhysicsCore(cpuGroup, cpuObj);
            if (core === null) { continue };
            // @ts-ignore
            let res: unknown = await queryCoreRunningThread(processIds, this.selectionParam!.threadIds, cpuGroup, this.leftStartNs, this.rightEndNs);
            // @ts-ignore
            this.handleTreeProcessData(res, core, key, cpuGroup);
        }
        //计算根节点数据并处理第二层数据的单位及保留位数
        for (const [i, item] of this.coreTypeMap) {
            // @ts-ignore
            if (this.dataSourceMap.has(`${item.pid}`)) {
                // @ts-ignore
                let obj = this.dataSourceMap.get(`${item.pid}`);
                // @ts-ignore
                item.allParallel = ((item.parallelDur * item.parallelNum / item.dur) * 100).toFixed(NUM_DIGITS);
                // @ts-ignore
                obj.dur += item.dur;
                // @ts-ignore
                obj.parallelDur += item.parallelDur;
                // @ts-ignore
                obj.load += item.load;
                // @ts-ignore
                obj.parallelNum = item.parallelNum;
                // @ts-ignore
                item.dur = (item.dur / UNIT).toFixed(NUM_DIGITS);
                // @ts-ignore
                item.parallelDur = (item.parallelDur / UNIT).toFixed(NUM_DIGITS);
                // @ts-ignore
                item.load = item.load.toFixed(NUM_DIGITS);
                // @ts-ignore
                obj.children.push(item);
            }
        }
        //处理根节点数据的单位及保留位数
        for (const [i, item] of this.dataSourceMap) {
            // @ts-ignore
            item.allParallel = ((item.parallelDur * item.parallelNum / item.dur) * 100).toFixed(NUM_DIGITS);
            // @ts-ignore
            item.dur = (item.dur / UNIT).toFixed(NUM_DIGITS);
            // @ts-ignore
            item.parallelDur = (item.parallelDur / UNIT).toFixed(NUM_DIGITS);
            // @ts-ignore
            item.load = item.load.toFixed(NUM_DIGITS);
        }
    }

    //判断自配的相同物理核是否符合计算MT并行度的要求
    handleSamePhysicsCore(arr: unknown, obj: { 'L': Array<number>; 'M': Array<number>; 'S': Array<number> }): string | null {
        let core = null;
        // @ts-ignore
        if (arr.length > 2) { return null }
        for (const [key, val] of Object.entries(obj)) {
            // @ts-ignore
            let isSet = val.includes(arr[0]) && val.includes(arr[1]);
            if (isSet) {
                core = key;
            }
        }
        return core;
    }

    handleTreeProcessData(result: unknown, key: string, gourpKey: string, gourp: Array<number>): void {
        let coreMap: Map<string, unknown> = new Map<string, unknown>();
        // @ts-ignore
        for (let i = 0; i < result.length; i++) {
            // @ts-ignore
            let stateItem = result[i];
            //处理框选区域前后的边界ts
            if (stateItem.ts < this.leftStartNs) {
                stateItem.ts = this.leftStartNs;
            }
            if (stateItem.endTs > this.rightEndNs) {
                stateItem.endTs = this.rightEndNs;
            }
            let dur = stateItem.endTs - stateItem.ts;
            //以pid为key值添加MTTable数据源的最外层数据结构
            if (!this.dataSourceMap.has(`${stateItem.pid}`)) {
                this.dataSourceMap.set(`${stateItem.pid}`, {
                    pid: stateItem.pid,
                    tid: stateItem.tid,
                    title: stateItem.pName ? `${stateItem.pName} ${stateItem.pid}` : `[NULL] ${stateItem.pid}`,
                    group: '',
                    dur: null,
                    parallelNum: null,
                    parallelDur: null,
                    allParallel: null,
                    load: null,
                    tCount: null,
                    children: []
                });
            };
            if (coreMap.has(`${stateItem.pid}`)) {
                let obj = coreMap.get(`${stateItem.pid}`);
                // @ts-ignore
                let setArr = new Set(obj.tidArr);
                if (!(setArr.has(stateItem.tid))) {
                    setArr.add(stateItem.tid);
                    // @ts-ignore
                    obj.tidArr.push(stateItem.tid);
                }
                // @ts-ignore
                obj.gourpDur += dur;
                // @ts-ignore
                obj.stateItem.push(stateItem);
            } else {
                coreMap.set(`${stateItem.pid}`, {
                    pid: stateItem.pid,
                    tid: stateItem.tid,
                    gourpDur: dur,
                    tidArr: [stateItem.tid],
                    stateItem: [stateItem],
                });
            };
        };
        this.mergeTreeCoreData(coreMap, key, gourpKey, gourp);
    }
    //处理树结构最终需要的信息数据
    // @ts-ignore
    mergeTreeCoreData(map: Map<string, unknown>, coreKey: string, gourpKey: string, gourp: Array<number>): void {
        let str = gourp.join(',');
        for (const [key, value] of map) {
            let pDur: number = 0;
            // @ts-ignore
            pDur = HanldParalLogic(this.hanldMapLogic, value, pDur);
            // @ts-ignore
            let paral = (pDur * gourp.length / value.gourpDur) * 100;
            // @ts-ignore
            let load = value.gourpDur / ((100 * UNIT) * Utils.getInstance().getWinCpuCount());
            let groupObj = {
                // @ts-ignore
                pid: value.pid,
                // @ts-ignore
                tid: value.tid,
                title: '',
                group: `${gourpKey}:${str}`,
                // @ts-ignore
                dur: (value.gourpDur / UNIT).toFixed(NUM_DIGITS),
                parallelNum: gourp.length,
                parallelDur: (pDur / UNIT).toFixed(NUM_DIGITS),
                allParallel: paral.toFixed(NUM_DIGITS),
                load: load.toFixed(NUM_DIGITS),
                // @ts-ignore
                tCount: value.tidArr.length,
                children: []
            };
            // @ts-ignore
            if (this.coreTypeMap.has(`${value.pid} ${coreKey}`)) {
                // @ts-ignore
                let obj = this.coreTypeMap.get(`${value.pid} ${coreKey}`);
                // @ts-ignore
                obj.dur += value.gourpDur;
                // @ts-ignore
                obj.parallelDur += pDur;
                // @ts-ignore
                obj.load += load;
                // @ts-ignore
                obj.children.push(groupObj);
            } else {
                // @ts-ignore
                this.coreTypeMap.set(`${value.pid} ${coreKey}`, {
                    // @ts-ignore
                    pid: value.pid,
                    // @ts-ignore
                    tid: value.tid,
                    title: `${coreKey}`,
                    group: '',
                    // @ts-ignore
                    dur: value.gourpDur,
                    parallelNum: gourp.length,
                    parallelDur: pDur,
                    allParallel: null,
                    load: load,
                    tCount: null,
                    children: [groupObj]
                });
            }
        }
    }

    //每次stateItem计算的的结果
    hanldMapLogic(dumpObj: unknown, value?: unknown, param?: unknown): void {
        // @ts-ignore
        if (dumpObj.len !== 1) {
            // @ts-ignore
            param += dumpObj.endTs - dumpObj.ts;
        }
        // @ts-ignore
        return param;
    }
    //初始化cpu check状态
    initDefaultConfig(): void {
        if (this.isCreateCpu) {
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

    //初始化分组
    initGroupFn(arr: unknown): void {
        let info = [...this.bufferGroupMap.values()].reduce((acc, val) => acc.concat(val), []);
        // @ts-ignore
        let flag = arr.filter((item: unknown) => info.includes(item)).length > 0;
        // @ts-ignore
        if (arr.length && arr.length > 1 && !flag) {
            let len = this.groupContentDiv!.childNodes.length + 1;
            // @ts-ignore
            let str = arr.join(',');
            // @ts-ignore
            this.bufferGroupMap.set(`group${len}`, arr);
            this.groupContentDiv!.innerHTML += `<div style="border-bottom: 1px solid black;">group${len}:${str}</div>`;
        }
    }
    //更新Group Setting Cpu列的展示与操作状态
    getGroupTableLine(str?: string): void {
        this.isCreateGroup = false;
        this.cpuTbl!.innerHTML = '';
        this.creatCpuHeaderDiv();
        let bufferInfo = [...this.bufferGroupMap.values()].reduce((acc, val) => acc.concat(val), []);
        let switchArr = Object.values(CORE_JSON).flat();
        for (let i = 0; i < Utils.getInstance().getWinCpuCount(); i++) {
            let obj = {
                cpu: i,
                isCheck: Utils.getInstance().getWinCpuCount() === CORE_NUM && str !== 'cut' && this.isReset ? switchArr.includes(i) : bufferInfo.includes(i),
                disabled:
                    Utils.getInstance().getWinCpuCount() === CORE_NUM && str !== 'cut' && this.isReset ?
                        !(switchArr.includes(i)) :
                        !([...this.smallCores, ...this.midCores, ...this.largeCores].includes(i))
            };
            this.creatGroupLineDIv(obj);
        }
    }
    //创建cpu表头
    creatCpuHeaderDiv(): void {
        let cpuIdLine = document.createElement('div');
        cpuIdLine.className = 'core_line';
        cpuIdLine.style.fontWeight = 'bold';
        cpuIdLine.style.fontStyle = '12px';
        cpuIdLine.textContent = 'Cpu';
        cpuIdLine.style.textAlign = 'center';
        this.cpuTbl?.append(...[cpuIdLine]);
    }
    //Gropu容器中新增Tbl的cpu Line值
    creatGroupLineDIv(obj: unknown): void {
        // @ts-ignore
        let id = `${obj.cpu}`.toString();
        let checkBoxId = `box${id}`;
        // 创建一个包裹div来容纳checkbox和cpuLine  
        let wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'check-content';
        wrapperDiv.id = checkBoxId;
        // 创建checkBox实例   
        let checkBox: LitCheckBox = new LitCheckBox();
        // @ts-ignore
        checkBox.checked = obj.isCheck;
        // @ts-ignore
        checkBox.disabled = obj.disabled;
        checkBox.setAttribute('not-close', '');
        // 添加事件监听器到checkBox  
        checkBox.addEventListener('change', (e: unknown) => {
            // @ts-ignore
            checkBox.checked = e.detail.checked;
            // @ts-ignore
            this.bottomFilterEl!.canUpdateCheckList(e.detail.checked, this.addGroupArr, obj.cpu);
        });
        wrapperDiv.appendChild(checkBox);
        // 创建cpuLine div  
        let cpuLine = document.createElement('div');
        // @ts-ignore
        cpuLine.textContent = obj.cpu + '';
        cpuLine.style.textAlign = 'center';
        cpuLine.style.fontWeight = 'normal';
        // 将cpuLine也添加到wrapperDiv 
        wrapperDiv.appendChild(cpuLine);
        this.cpuTbl!.append(wrapperDiv);
    }
    //回调函数，首次插入DOM时执行的初始化回调
    connectedCallback(): void {
        new ResizeObserver(() => {
            if (this.parentElement?.clientHeight !== 0) {
                // @ts-ignore
                this.parallelTable!.shadowRoot!.querySelector('.table')!.style.height = `${this.parentElement!.clientHeight - 31}px`;
                this.parallelTable?.reMeauseHeight();
                if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
                    this.bottomFilterEl!.style.display = 'none';
                } else {
                    this.bottomFilterEl!.style.display = 'flex';
                }
            }
        }).observe(this.parentElement!);
    }
    initHtml(): string {
        return MtSettingHtml;
    }
}
