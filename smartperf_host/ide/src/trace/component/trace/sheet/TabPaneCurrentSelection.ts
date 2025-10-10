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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { type LitTable } from '../../../../base-ui/table/lit-table';
import '../../../../base-ui/table/lit-table-column';
import { AllAppStartupStruct } from '../../../database/ui-worker/ProcedureWorkerAllAppStartup';

import { type WakeupBean } from '../../../bean/WakeupBean';
import { SpApplication } from '../../../SpApplication';
import { TraceRow } from '../base/TraceRow';
import { CpuStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { ThreadStruct } from '../../../database/ui-worker/ProcedureWorkerThread';
import { FuncStruct } from '../../../database/ui-worker/ProcedureWorkerFunc';
import { ProcessMemStruct } from '../../../database/ui-worker/ProcedureWorkerMem';
import { ClockStruct } from '../../../database/ui-worker/ProcedureWorkerClock';
import { DmaFenceStruct } from '../../../database/ui-worker/ProcedureWorkerDmaFence';
import { ColorUtils } from '../base/ColorUtils';
import { IrqStruct } from '../../../database/ui-worker/ProcedureWorkerIrq';
import { BinderArgBean } from '../../../bean/BinderArgBean';
import { JankStruct } from '../../../database/ui-worker/ProcedureWorkerJank';
import { Utils } from '../base/Utils';
import { SpSystemTrace } from '../../SpSystemTrace';
import { AppStartupStruct } from '../../../database/ui-worker/ProcedureWorkerAppStartup';
import { SoStruct } from '../../../database/ui-worker/ProcedureWorkerSoInit';
import { type SelectionParam } from '../../../bean/BoxSelection';
import { type FrameAnimationStruct } from '../../../database/ui-worker/ProcedureWorkerFrameAnimation';
import {
  queryBinderByArgsId,
  queryBinderBySliceId,
  queryFlowsData,
  queryPrecedingData,
  queryThreadByItid,
  queryFpsSourceList,
  queryStateFreqList,
} from '../../../database/sql/SqlLite.sql';
import {
  queryBinderArgsByArgset,
  queryDistributedRelationAllData,
  queryRWakeUpFrom,
  queryRunnableTimeByRunning,
  querySysCallEventDetail,
  queryThreadStateArgs,
  queryThreadWakeUp,
  queryThreadWakeUpFrom,
  sqlPrioCount,
} from '../../../database/sql/ProcessThread.sql';
import { queryGpuDur } from '../../../database/sql/Gpu.sql';
import { queryWakeupListPriority } from '../../../database/sql/Cpu.sql';
import { TabPaneCurrentSelectionHtml } from './TabPaneCurrentSelection.html';
import { queryRealTime } from '../../../database/sql/Clock.sql';
import { PerfToolStruct } from '../../../database/ui-worker/ProcedureWorkerPerfTool';
import { TraceMode } from '../../../SpApplicationPublicFunc';
import { threadPool, threadPool2 } from '../../../database/SqlLite';
import { threadNearData } from '../../../database/data-trafic/SliceSender';
import { HangStruct } from '../../../database/ui-worker/ProcedureWorkerHang';
import { XpowerStruct } from '../../../database/ui-worker/ProcedureWorkerXpower';
import { XpowerAppDetailStruct } from '../../../database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { XpowerWifiStruct } from '../../../database/ui-worker/ProcedureWorkerXpowerWifi';
import { XpowerThreadCountStruct } from '../../../database/ui-worker/ProcedureWorkerXpowerThreadCount';
import { XpowerGpuFreqCountStruct } from '../../../database/ui-worker/ProcedureWorkerXpowerGpuFreqCount';
import { ThreadSysCallStruct } from '../../../database/ui-worker/ProcedureWorkerThreadSysCall';
import { InterfaceConfigManager } from '../../../../utils/interfaceConfiguration';

const INPUT_WORD =
  'This is the interval from when the task became eligible to run \n(e.g.because of notifying a wait queue it was a suspended on) to\n when it started running.';

const CLOCK_STARTTIME_ABSALUTED_ID: string = 'clockStartTimeAbsaluteId';
const CLOCK_TRANSF_BTN_ID: string = 'clockTransfBtnId';
const CPU_STARTTIME_ABSALUTED_ID: string = 'cpuStartTimeAbsaluteId';
const CPU_TRANSF_BTN_ID: string = 'cpuTransfBtnId';
const THREAD_STARTTIME_ABSALUTED_ID: string = 'threadStartTimeAbsaluteId';
const THREAD_TRANSF_BTN_ID: string = 'threadTransfBtnId';
const FUN_STARTTIME_ABSALUTED_ID: string = 'funStartTimeAbsaluteId';
const FUN_TRANSF_BTN_ID: string = 'funTransfBtnId';

export function getTimeString(ns: number): string {
  if (ns === 0) {
    return '0';
  }
  let currentTimeNs = ns;
  let hour1 = 3600_000_000_000;
  let minute1 = 60_000_000_000;
  let second1 = 1_000_000_000; // 1 second
  let millisecond1 = 1_000_000; // 1 millisecond
  let microsecond1 = 1_000; // 1 microsecond
  let res = '';
  if (currentTimeNs >= hour1) {
    res += Math.floor(currentTimeNs / hour1) + 'h ';
    currentTimeNs = currentTimeNs - Math.floor(currentTimeNs / hour1) * hour1;
  }
  if (currentTimeNs >= minute1) {
    res += Math.floor(currentTimeNs / minute1) + 'm ';
    currentTimeNs = currentTimeNs - Math.floor(ns / minute1) * minute1;
  }
  if (currentTimeNs >= second1) {
    res += Math.floor(currentTimeNs / second1) + 's ';
    currentTimeNs = currentTimeNs - Math.floor(currentTimeNs / second1) * second1;
  }
  if (currentTimeNs >= millisecond1) {
    res += Math.floor(currentTimeNs / millisecond1) + 'ms ';
    currentTimeNs = currentTimeNs - Math.floor(currentTimeNs / millisecond1) * millisecond1;
  }
  if (currentTimeNs >= microsecond1) {
    res += Math.floor(currentTimeNs / microsecond1) + 'μs ';
    currentTimeNs = currentTimeNs - Math.floor(currentTimeNs / microsecond1) * microsecond1;
  }
  if (currentTimeNs > 0) {
    res += currentTimeNs.toFixed(0) + 'ns ';
  }
  return res;
}

function compare(property: string, sort: number, type: string) {
  return function (xpowerSortLeftData: SortData, xpowerSortRightData: SortData): number {
    if (type === 'number') {
      return sort === 2 // @ts-ignore
        ? parseFloat(xpowerSortRightData[property]) - parseFloat(xpowerSortLeftData[property]) // @ts-ignore
        : parseFloat(xpowerSortLeftData[property]) - parseFloat(xpowerSortRightData[property]);
    } else if (type === 'duration') {
      return sort === 2
        ? xpowerSortRightData.dur - xpowerSortLeftData.dur
        : xpowerSortLeftData.dur - xpowerSortRightData.dur;
    } else if (type === 'bytes') {
      return sort === 2
        ? xpowerSortRightData.bytes - xpowerSortLeftData.bytes
        : xpowerSortLeftData.bytes - xpowerSortRightData.bytes;
    } {
      // @ts-ignore
      if (xpowerSortRightData[property] > xpowerSortLeftData[property]) {
        return sort === 2 ? 1 : -1;
      } else {
        // @ts-ignore
        if (xpowerSortRightData[property] === xpowerSortLeftData[property]) {
          return 0;
        } else {
          return sort === 2 ? -1 : 1;
        }
      }
    }
  };
}

@element('tabpane-current-selection')
export class TabPaneCurrentSelection extends BaseElement {
  weakUpBean: WakeupBean | null | undefined;
  selectWakeupBean: unknown;
  private currentSelectionTbl: LitTable | null | undefined;
  private tableObserver: MutationObserver | undefined;
  private wakeupListTbl: LitTable | undefined | null;
  private scrollView: HTMLDivElement | null | undefined;
  // @ts-ignore
  private dpr = window.devicePixelRatio || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1;
  private wakeUp: string = '';
  private isFpsAvailable: boolean = true;
  private realTime: number = 0;
  private bootTime: number = 0;
  private funcDetailMap: Map<string, Array<object>> = new Map();
  private topChainStr: string = '';
  private fpsResult: Array<unknown> = [];

  set data(selection: unknown) {
    // @ts-ignore
    if (selection !== undefined && selection.constructor && selection.constructor.name !== 'SelectionParam') {
      // @ts-ignore
      this.setCpuData(selection);
    }
  }

  /**
   * 创建StartTime的Dom节点
   * @param selectTable面板的dom树对象
   * @param startTs 开始时间
   * @param transfBtnId 转换按钮id
   * @param startTimeAbsaluteId 开始时间的id
   */
  createStartTimeNode(list: unknown[], startTs: number, transfBtnId: string, startTimeAbsaluteId: string): void {
    let timeStr: string = '';
    let startTimeValue: string = '';
    let startTimeAbsolute = startTs + Utils.getInstance().getRecordStartNS();
    if (this.realTime > 0) {
      if (Utils.isTransformed) {
        timeStr = this.getRealTimeStr(startTimeAbsolute);
      } else {
        timeStr = startTimeAbsolute / 1000000000 + 's';
      }
      startTimeValue = `<div style="white-space: nowrap;display: flex;align-items: center">
                            <div id="${startTimeAbsaluteId}" style="white-space:pre-wrap" >${timeStr}</div>                             
                            <lit-icon id="${transfBtnId}" class="temp-icon" title="Convert to realtime" name="restore" size="30" 
                                  style="position: relative; top: 5px; left: 10px;"></lit-icon>
                        </div>`;
    } else {
      startTimeValue = startTimeAbsolute / 1000000000 + 's';
    }
    list.push({
      name: 'StartTime(Absolute)',
      value: startTimeValue,
    });
  }

  /**
   * 给转换按钮添加点击事件
   * @param startTimeAbsolute 开始时间
   * @param transfBtnId 转换按钮id
   * @param startTimeAbsaluteId 开始时间ID
   */
  addClickToTransfBtn(startTimeAbsolute: number, transfBtnId: string, startTimeAbsaluteId: string): void {
    let transfBtn = this.currentSelectionTbl?.shadowRoot?.querySelector(`#${transfBtnId}`);
    transfBtn?.addEventListener('click', () => {
      let startTimeAbsalute = this.currentSelectionTbl?.shadowRoot?.querySelector(`#${startTimeAbsaluteId}`);
      if (startTimeAbsalute) {
        if (Utils.isTransformed) {
          startTimeAbsalute!.innerHTML = startTimeAbsolute / 1000000000 + 's';
          Utils.isTransformed = false;
        } else {
          startTimeAbsalute!.innerHTML = this.getRealTimeStr(startTimeAbsolute);
          Utils.isTransformed = true;
        }
      }
    });
  }

  // 处理next_info的展示
  parseSchedSwitchHmNew(num: number): string {
    let numBig = BigInt(num);
    // 将数字拆分为高32位和低32位
    // @ts-ignore
    const low = Number(numBig & 0xFFFFFFFFn);
    // @ts-ignore
    const high = Number((numBig >> 32n) & 0xFFFFFFFFn);

    // 创建一个8字节的Uint8Array
    const buffer = new Uint8Array(8);
    const view = new DataView(buffer.buffer);

    // 写入低32位（小端序）
    view.setUint32(0, low, true);
    // 写入高32位（小端序）
    view.setUint32(4, high, true);

    // 读取前4个字节作为tmpAffinity（小端序）
    const tmpAffinity = view.getUint32(0, true);
    let affinity = tmpAffinity.toString(16);
    affinity = affinity.replace(/^0+/, '');
    affinity = affinity === '' ? '0' : affinity;

    // 读取后4个字节作为remaining（小端序）
    const remaining = view.getUint32(4, true);

    // 定义位域掩码
    const loadMask = (1 << 10) - 1;
    const groupMask = (1 << 2) - 1;
    const restrictedMask = 1;
    const expelMask = (1 << 3) - 1;
    const cgidMask = (1 << 5) - 1;

    // 按位域偏移量解析
    const load = ((remaining >> 0) & loadMask) << 1;
    const group = (remaining >> 10) & groupMask;
    const restricted = (remaining >> 12) & restrictedMask;
    const expel = (remaining >> 13) & expelMask;
    const cgid = (remaining >> 16) & cgidMask;

    // 拼接结果字符串
    const result = `${affinity},${load},${group},${restricted},${expel},${cgid}`;
    return result;
  }

  async setCpuData(
    data: CpuStruct,
    callback: ((data: WakeupBean | null) => void) | undefined = undefined,
    scrollCallback?: (data: CpuStruct) => void
  ): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('650px');
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    if (leftTitle) {
      leftTitle.innerText = 'Slice Details';
    }
    this.currentSelectionTbl!.loading = true;
    let list: unknown[] = [];
    this.updateUI(data, list);
    Promise.all([this.queryThreadStateDArgs(data.argSetID), this.queryCPUWakeUpFromData(data)]).then((resArr) => {
      let args = resArr[0];
      let bean = resArr[1];
      if (callback) {
        callback(bean);
      }
      if (args.length > 0) {
        args.forEach((arg) => {
          if (arg.keyName === 'next_info') {
            list.push({ name: arg.keyName, value: arg.strValue?.indexOf(',') === -1 ? this.parseSchedSwitchHmNew(Number(arg.strValue)) : arg.strValue });
          } else {
            list.push({ name: arg.keyName, value: arg.strValue })
          }
        });
      }
      this.currentSelectionTbl!.dataSource = list;
      this.currentSelectionTbl!.loading = false;
      let startTimeAbsolute = (data.startTime || 0) + Utils.getInstance().getRecordStartNS();
      this.addClickToTransfBtn(startTimeAbsolute, CPU_TRANSF_BTN_ID, CPU_STARTTIME_ABSALUTED_ID);

      let rightArea: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#table-right');
      let rightTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightTitle');
      let rightButton: HTMLElement | null | undefined = this?.shadowRoot
        ?.querySelector('#rightButton')
        ?.shadowRoot?.querySelector('#custom-button');
      let rightStar: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#right-star');
      this.threadClickEvent(scrollCallback, data);
      let canvas = this.initCanvas();
      if (bean !== null) {
        this.selectWakeupBean = {
          process: `${this.transferString(data.processName || 'Process')}(${data.processId})`,
          thread: `${this.transferString(data.name || 'Thread')}(${data.tid})`,
          cpu: data.cpu,
          dur: data.dur,
          priority: data.priority,
          isSelected: false,
        };

        this.weakUpBean = bean;
        this.updateRightTitleUI(rightArea!, rightTitle!, rightButton!, rightStar!);
        this.drawRight(canvas, bean);
      } else {
        this.handleNullBeanUI(rightArea!, rightTitle!, rightButton!, rightStar!);
      }
    });
  }

  private threadClickEvent(scrollCallback: ((data: CpuStruct) => void) | undefined, data: CpuStruct): void {
    let threadClick = this.currentSelectionTbl?.shadowRoot?.querySelector('#thread-id');
    threadClick?.addEventListener('click', () => {
      //cpu点击
      if (scrollCallback) {
        data.state = 'Running';
        scrollCallback(data);
      }
    });
  }

  private updateRightTitleUI(
    rightArea: HTMLElement,
    rightTitle: HTMLElement,
    rightButton: HTMLElement,
    rightStar: HTMLElement
  ): void {
    if (rightArea !== null && rightArea) {
      rightArea.style.visibility = 'visible';
    }
    if (rightTitle !== null && rightTitle) {
      rightTitle.style.visibility = 'visible';
      rightButton!.style.visibility = 'visible';
      rightStar!.style.visibility = 'hidden';
      SpSystemTrace.btnTimer = null;
    }
  }

  private handleNullBeanUI(
    rightArea: HTMLElement,
    rightTitle: HTMLElement,
    rightButton: HTMLElement,
    rightStar: HTMLElement
  ): void {
    this.weakUpBean = null;
    if (rightArea !== null && rightArea) {
      rightArea.style.visibility = 'hidden';
    }
    if (rightTitle !== null && rightTitle) {
      rightTitle.style.visibility = 'hidden';
      rightButton!.style.visibility = 'hidden';
      rightStar!.style.visibility = 'hidden';
    }
  }

  private updateUI(data: CpuStruct, list: unknown[]): void {
    let process = this.transferString(data.processName || 'Process');
    let processId = data.processId || data.tid;
    let state = '';
    if (data.end_state) {
      state = Utils.getEndState(data.end_state);
    } else if (data.end_state === '' || data.end_state === null) {
      state = '';
    } else {
      state = 'Unknown State';
    }
    list.push({
      name: 'Process',
      value: `${process || 'Process'} [${processId}]`,
    });
    let name = this.transferString(data.name ?? '');
    if (data.processId) {
      list.push({
        name: 'Thread',
        value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${name || 'Process'} [${data.tid}]</div>
<lit-icon style="cursor:pointer;margin-left: 5px" id="thread-id" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`,
      });
    } else {
      list.push({
        name: 'Thread',
        value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${name || 'Process'} [${data.tid}]</div>
</div>`,
      });
    }

    list.push({ name: 'StartTime(Relative)', value: getTimeString(data.startTime || 0) });
    this.createStartTimeNode(list, data.startTime || 0, CPU_TRANSF_BTN_ID, CPU_STARTTIME_ABSALUTED_ID);
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    list.push({ name: 'Prio', value: data.priority || 0 });
    list.push({ name: 'End State', value: state });
  }
  // 设置真实时间和启动时间的值
  private async setRealTime(): Promise<unknown> {
    return queryRealTime().then((result) => {
      if (result && result.length > 0) {
        result.forEach((item) => {
          if (item.name === 'realtime') {
            this.realTime = item.ts;
          } else {
            this.bootTime = item.ts;
          }
        });
      }
    });
  }

  async setFunctionData(
    data: FuncStruct,
    threadName: string,
    scrollCallback: Function,
    callback?: (data: Array<unknown>, str: string, binderTid: number) => void,
    distributedCallback?: Function,
  ): Promise<void> {
    //方法信息
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.tabCurrentSelectionInit('Slice Details');
    let list: unknown[] = [];
    let name = this.transferString(data.funName ?? '');
    // 从缓存中拿到详细信息的表
    let information: string = '';
    let FunDetailList: Array<FunDetail> = new Array();
    if (this.funcDetailMap.size === 0) {
      await caches.match('/funDetail').then((res) => {
        let result: Promise<string> | undefined;
        if (res) {
          result = res!.text();
        }
        return result;
      }).then((res) => {
        if (res) {
          let funcDetail = JSON.parse(res);
          for (let key in funcDetail) {
            this.funcDetailMap.set(key, funcDetail[key]);
          }
        }
      });
    }
    // @ts-ignore
    FunDetailList = this.funcDetailMap.has(threadName) ? this.funcDetailMap.get('threadName') : this.funcDetailMap.get('anothers');
    if (Array.isArray(FunDetailList)) {
      // 筛选当前函数块的信息项
      let informationList: Array<FunDetail> = FunDetailList.filter((v: FunDetail) => {
        return v.slice.indexOf(name) > -1 || name.indexOf(v.slice) > -1;
      });
      const currentConfig = InterfaceConfigManager.getConfig()?.traceInfoConfig;
      information = informationList && informationList.length > 0 ? informationList[0].CN :
        `<div style="white-space: nowrap;display: flex;align-items: center">
           <div style="white-space:pre-wrap">无相关描述，如您知道具体含义可点击反馈</div>
               ${currentConfig!.content || ''}
               <lit-icon style="cursor:pointer;margin-left: 5px; margin-top:5px" id="informationJump" name="select" color="#7fa1e7" size="20">
               </lit-icon>
           </a>
       </div>`;
    }
    let isBinder = FuncStruct.isBinder(data);
    let jankJumperList = new Array<ThreadTreeNode>();
    let isAsyncBinder = isBinder && FuncStruct.isBinderAsync(data);
    if (data.argsetid !== undefined && data.argsetid !== null && data.argsetid >= 0) {
      this.setTableHeight('700px');
      if (isAsyncBinder) {
        this.handleAsyncBinder(data, list, jankJumperList, name, scrollCallback, information, callback);
      } else if (isBinder) {
        this.handleBinder(data, list, jankJumperList, name, scrollCallback, information, callback);
      } else {
        this.handleNonBinder(data, list, name, information);
      }
    } else if (data.funName && data.funName!.startsWith('H:Et') && (data.depth === 1 || data.depth === 0)) {
      list.push({
        name: 'StartTime(Relative)',
        value: getTimeString(data.startTs || 0),
      });
      this.createStartTimeNode(list, data.startTs || 0, FUN_TRANSF_BTN_ID, FUN_STARTTIME_ABSALUTED_ID);
      list.push({
        name: 'Duration',
        value: getTimeString(data.dur || 0),
      });
      data.funName!.split(',').map((item, index) => ({
        name: [
          'Sender tid',
          'Send time',
          'Expect handle time',
          'Task name/ID',
          'Prio',
          'Sender'
        ][index],
        value: item,
      })).forEach((item, index) => {
        if (index === 0) {
          item.value = item.value.split(':').at(-1)!;
        }
        list.push(item);
      });
      this.addTabSliceDetail(data, list)
      this.currentSelectionTbl!.dataSource = list;
      // @ts-ignore
      let startTimeAbsolute = (data.startTs || 0) + (window as unknown).recordStartNS;
      this.addClickToTransfBtn(startTimeAbsolute, FUN_TRANSF_BTN_ID, FUN_STARTTIME_ABSALUTED_ID);
    } else {
      this.setTableHeight('auto');
      list.push({ name: 'Name', value: name });
      if (data.cookie || data.cookie === 0) {
        list.push({ name: 'TaskId', value: data.cookie });
      }
      let processName = Utils.getInstance().getProcessMap().get(data.pid!);
      let threadName = Utils.getInstance().getThreadMap().get(data.tid!);
      let dataTid = isNaN(data.tid!) ? 'NULL' : data.tid;
      list.push({
        name: 'Process',
        value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
      });
      list.push({
        name: 'Thread',
        value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + dataTid + '] ',
      });
      this.addTabSliceDetail(data, list)
      list.push({
        name: 'StartTime(Relative)',
        value: getTimeString(data.startTs || 0),
      });
      this.createStartTimeNode(list, data.startTs || 0, FUN_TRANSF_BTN_ID, FUN_STARTTIME_ABSALUTED_ID);
      list.push({
        name: 'Duration',
        value: getTimeString(data.dur || 0),
      });
      list.push({ name: 'depth', value: data.depth });
      list.push({ name: 'information:', value: information });
      if (data.chainId) {
        list.push({ name: 'ChainId', value: data.chainId });
        list.push({ name: 'SpanId', value: data.spanId });
        list.push({ name: 'ParentSpanId', value: data.parentSpanId });
        list.push({ name: 'ChainFlag', value: data.chainFlag });
        await this.chainSpanListCallBackHandle(data, distributedCallback);
      }
      this.currentSelectionTbl!.dataSource = list;
      // @ts-ignore
      let startTimeAbsolute = (data.startTs || 0) + (window as unknown).recordStartNS;
      this.addClickToTransfBtn(startTimeAbsolute, FUN_TRANSF_BTN_ID, FUN_STARTTIME_ABSALUTED_ID);
    }
  }

  // 计算真实时间
  private getRealTimeStr(startTs: number): string {
    let time = (startTs || 0) - Utils.getInstance().getRecordStartNS() - this.bootTime + this.realTime;
    const formateDateStr =
      this.getDate(parseInt(time.toString().substring(0, 13))) + '.' + time.toString().substring(10);
    return formateDateStr;
  }

  // 格式化时间戳为字符串格式 yyyy/mm/dd hh:mi:ss
  private getDate(timestamp: number): string {
    let date = new Date(timestamp);
    let gmt = date.toLocaleString();
    return gmt;
  }

  private async chainSpanListCallBackHandle(data: FuncStruct, callBack: Function | undefined): Promise<void> {
    let allMainChainList: FuncStruct[];
    if (Utils.currentTraceMode === TraceMode.DISTRIBUTED) {
      let chainAllData = await Promise.all([
        queryDistributedRelationAllData(data.chainId!, threadPool.traceId),
        queryDistributedRelationAllData(data.chainId!, threadPool2.traceId),
      ]);
      allMainChainList = [...chainAllData[0], ...chainAllData[1]];
    } else {
      allMainChainList = await queryDistributedRelationAllData(data.chainId!);
    }
    let finalChainSpanList: FuncStruct[] = allMainChainList.filter((spanNode) => spanNode.spanId === data.spanId);
    let setParentChainList = (currentData: FuncStruct): void => {
      let currentParentSpanList = allMainChainList.filter((spanNode) => spanNode.spanId === currentData.parentSpanId);
      for (let index = currentParentSpanList.length - 1; index >= 0; index--) {
        let spanStruct = currentParentSpanList[index];
        if (finalChainSpanList.indexOf(spanStruct) < 0) {
          finalChainSpanList.unshift(spanStruct);
        }
      }
      if (
        currentParentSpanList.length > 0 &&
        currentParentSpanList[0].parentSpanId !== '' &&
        currentParentSpanList[0].parentSpanId !== '0'
      ) {
        setParentChainList(currentParentSpanList[0]);
      }
    };
    setParentChainList(data);
    let setChildChainList = (currentData: FuncStruct): void => {
      let currentChildSpanList = allMainChainList.filter((spanNode) => spanNode.parentSpanId === currentData.spanId);
      currentChildSpanList.forEach((childSpan) => {
        if (finalChainSpanList.indexOf(childSpan) < 0) {
          finalChainSpanList.push(childSpan);
        }
      });
      if (
        currentChildSpanList.length > 0 &&
        currentChildSpanList[0].spanId !== '' &&
        currentChildSpanList[0].spanId !== '0'
      ) {
        setChildChainList(currentChildSpanList[0]);
      }
    };
    setChildChainList(data);
    if (callBack) {
      callBack(finalChainSpanList);
    }
  }

  private handleNonBinder(data: FuncStruct, list: unknown[], name: string, information: string): void {
    queryBinderArgsByArgset(data.argsetid!).then((argset) => {
      list.push({ name: 'Name', value: name });
      let processName = Utils.getInstance().getProcessMap().get(data.pid!);
      let threadName = Utils.getInstance().getThreadMap().get(data.tid!);
      list.push({ name: 'Name', value: name }, {
        name: 'Process',
        value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
      }, {
        name: 'Thread',
        value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
      });
      argset.forEach((item) => {
        list.push({ name: item.keyName, value: item.strValue });
      });
      this.addTabSliceDetail(data, list)
      this.addTabPanelContent(list, data, information);
      this.currentSelectionTbl!.dataSource = list;
    });
  }

  private handleBinder(
    data: FuncStruct,
    list: unknown[],
    jankJumperList: ThreadTreeNode[],
    name: string,
    scrollCallback: Function,
    information: string,
    callback?: (data: Array<unknown>, str: string, binderTid: number) => void
  ): void {
    queryBinderArgsByArgset(data.argsetid!).then((argset) => {
      let binderSliceId = -1;
      let binderTid = -1;
      let processName = Utils.getInstance().getProcessMap().get(data.pid!);
      let threadName = Utils.getInstance().getThreadMap().get(data.tid!);
      argset.forEach((item) => {
        if (item.keyName === 'calling tid') {
          binderTid = Number(item.strValue);
        }
        if (item.keyName === 'destination slice id') {
          binderSliceId = Number(item.strValue);
          list.unshift({
            name: 'Name',
            value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${name || 'binder'}</div>
<lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="function-jump" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`,
          }, {
            name: 'Process',
            value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
          }, {
            name: 'Thread',
            value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
          }
          );
        }
        list.push({ name: item.keyName, value: item.strValue });
      });
      if (binderSliceId === -1) {
        list.unshift({
          name: 'Name', value: name
        }, {
          name: 'Process',
          value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
        }, {
          name: 'Thread',
          value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
        }
        );
      }
      this.addTabSliceDetail(data, list)
      this.addTabPanelContent(list, data, information);
      this.currentSelectionTbl!.dataSource = list;
      let funcClick = this.currentSelectionTbl?.shadowRoot?.querySelector('#function-jump');
      funcClick?.addEventListener('click', () => {
        if (!Number.isNaN(binderSliceId) && binderSliceId !== -1) {
          queryBinderBySliceId(binderSliceId).then((result: unknown[]) => {
            if (result.length > 0) {
              // @ts-ignore
              result[0].type = TraceRow.ROW_TYPE_FUNC;
              scrollCallback(result[0]);
              let timeLineNode = new ThreadTreeNode(
                // @ts-ignore
                result[0]?.tid,
                // @ts-ignore
                result[0]?.pid,
                // @ts-ignore
                result[0].startTs,
                // @ts-ignore
                result[0]?.depth
              );
              jankJumperList.push(timeLineNode);
              if (callback) {
                let linkTo = 'binder-to';
                callback(jankJumperList, linkTo, binderTid);
                linkTo = '';
              }
            }
          });
        }
      });
    });
  }

  private addTabSliceDetail(data: FuncStruct, list: unknown[]) {
    const properties = [
      { key: 'trace_level', name: 'TraceLevel' },
      { key: 'trace_tag', name: 'TraceTag' },
      { key: 'category', name: 'Category' },
      { key: 'custom_args', name: 'CustomArgs' },
    ];
    properties.forEach(prop => {
      if (data[prop.key] && list !== undefined) {
        list!.push({ name: prop.name, value: data[prop.key] });
      }
    });
    return list;
  }

  private handleAsyncBinder(
    data: FuncStruct,
    list: unknown[],
    jankJumperList: ThreadTreeNode[],
    name: string,
    scrollCallback: Function,
    information: string,
    callback?: (data: Array<unknown>, str: string, binderTid: number) => void
  ): void {
    let binderTid = -1;
    Promise.all([
      queryBinderByArgsId(data.argsetid!, data.startTs!, !data.funName!.endsWith('rcv')),
      queryBinderArgsByArgset(data.argsetid!),
    ]).then((result) => {
      let asyncBinderRes = result[0];
      let argsBinderRes = result[1];
      let asyncBinderStract: unknown;
      let processName = Utils.getInstance().getProcessMap().get(data.pid!);
      let threadName = Utils.getInstance().getThreadMap().get(data.tid!);
      if (asyncBinderRes.length > 0) {
        //@ts-ignore
        asyncBinderRes[0].type = TraceRow.ROW_TYPE_FUNC;
        asyncBinderStract = asyncBinderRes[0];
      }
      if (argsBinderRes.length > 0) {
        argsBinderRes.forEach((item) => {
          list.push({
            name: item.keyName,
            value: item.strValue,
          });
          if (item.keyName === 'calling tid') {
            binderTid = Number(item.strValue);
          }
        });
      }

      if (asyncBinderStract !== undefined) {
        list.unshift({
          name: 'Name',
          value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${name || 'binder'}</div>
<lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="function-jump" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`,
        }, {
          name: 'Process',
          value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
        }, {
          name: 'Thread',
          value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
        });
      } else {
        list.unshift({
          name: 'Name',
          value: name
        }, {
          name: 'Process',
          value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
        }, {
          name: 'Thread',
          value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
        });
      }
      this.addTabSliceDetail(data, list)
      this.addTabPanelContent(list, data, information);
      this.currentSelectionTbl!.dataSource = list;
      let funcClick = this.currentSelectionTbl?.shadowRoot?.querySelector('#function-jump');
      funcClick?.addEventListener('click', () => {
        scrollCallback(asyncBinderStract);
        let timeLineNode = new ThreadTreeNode(
          // @ts-ignore
          asyncBinderStract.tid,
          // @ts-ignore
          asyncBinderStract.pid,
          // @ts-ignore
          asyncBinderStract.startTs,
          // @ts-ignore
          asyncBinderStract.depth
        );
        jankJumperList.push(timeLineNode);
        if (callback) {
          let linkTo = 'binder-to';
          callback(jankJumperList, linkTo, binderTid);
          linkTo = '';
        }
      });

    });
  }

  private addTabPanelContent(contentList: unknown[], data: FuncStruct, information: string): void {
    contentList.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTs || 0),
    });
    contentList.push({
      name: 'StartTime(Absolute)',
      // @ts-ignore
      value: ((data.startTs || 0) + (window as unknown).recordStartNS) / 1000000000 + 's',
    });
    contentList.push({
      name: 'Duration',
      value: getTimeString(data.dur || 0),
    });
    contentList.push({ name: 'depth', value: data.depth });
    if (data.argsetid && data.argsetid > -1) {
      contentList.push({ name: 'arg_set_id', value: data.argsetid });
    }
    contentList.push({ name: 'information', value: information });
  }

  private tabCurrentSelectionInit(leftTitleStr: string): void {
    this.initCanvas();
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    this.setTitleAndButtonStyle();
    if (leftTitle) {
      leftTitle.innerText = leftTitleStr;
    }
  }

  private setTitleAndButtonStyle(): void {
    let rightTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightTitle');
    let rightButton: HTMLElement | null | undefined = this?.shadowRoot
      ?.querySelector('#rightButton')
      ?.shadowRoot?.querySelector('#custom-button');
    let rightStar: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#right-star');
    if (rightTitle) {
      rightTitle.style.visibility = 'hidden';
      rightButton!.style.visibility = 'hidden';
      rightStar!.style.visibility = 'hidden';
    }
  }

  async setClockData(data: ClockStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    //时钟信息
    this.tabCurrentSelectionInit('Counter Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startNS || 0),
    });
    this.createStartTimeNode(list, data.startNS || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    list.push({
      name: 'Value',
      value: ColorUtils.formatNumberComma(data.value || 0),
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startNS || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  setDmaFenceData(data: DmaFenceStruct, rowData: unknown[]): void {
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Slice Details');
    let list: unknown[] = [];
    list.push({
      name: 'Title',
      value: data.sliceName,
    });
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      // @ts-ignore
      value: ((data.startTime || 0) + (window as unknown).recordStartNS) / 1000000000 + 's',
    });
    if (data.dur !== 0) {
      list.push({
        name: 'Wall Duration',
        value: getTimeString(data.dur || 0)
      });
    }
    list.push({
      name: 'driver',
      value: data.driver,
    });
    list.push({
      name: 'context',
      value: data.context,
    });
    this.currentSelectionTbl!.dataSource = list;
  }

  async setXpowerData(data: XpowerStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Counter Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startNS || 0),
    });
    this.createStartTimeNode(list, data.startNS || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    list.push({
      name: 'Value',
      value: String(data.value).indexOf('.') > -1 ? data.value || 0 : ColorUtils.formatNumberComma(data.value || 0),
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startNS || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }


  async setXpowerTreadCountData(data: XpowerThreadCountStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Counter Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startNS || 0),
    });
    this.createStartTimeNode(list, data.startNS || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    list.push({
      name: 'Value',
      value: String(data.value).indexOf('.') > -1 ? data.value || 0 : ColorUtils.formatNumberComma(data.value || 0),
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startNS || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  async setXpowerGpuFreqCountData(data: XpowerGpuFreqCountStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Counter Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startNS || 0),
    });
    this.createStartTimeNode(list, data.startNS || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    list.push({
      name: 'Value',
      value: String(data.value).indexOf('.') > -1 ? data.value || 0 : ColorUtils.formatNumberComma(data.value || 0),
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startNS || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  async setXpowerDisplayData(data: XpowerAppDetailStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Display Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    this.createStartTimeNode(list, data.startTime || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    let vals: { name: string, dur: number, value: string }[] = [];
    let column = ['1hz', '5hz', '10hz', '15hz', '24hz', '30hz', '45hz', '60hz', '90hz', '120hz', '180hz'];
    column.forEach((item) => {
      // @ts-ignore
      data['c' + item] !== 0 && vals.push({
        name: item,
        // @ts-ignore
        dur: data['c' + item],
        // @ts-ignore
        value: data['c' + item] + ' ms',
      });
    });
    // @ts-ignore
    vals.sort(compare('value', 2, 'duration'));
    list.push(...vals);
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startTime || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  async setXpowerWifiBytesData(data: XpowerWifiStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('WIFIBytes Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    this.createStartTimeNode(list, data.startTime || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    let vals: { name: string, bytes: number, value: string }[] = [];
    data.tx !== 0 && vals.push({
      name: 'send',
      bytes: data.tx,
      value: data.tx + ' B',
    });
    data.rx !== 0 && vals.push({
      name: 'receiver',
      bytes: data.rx,
      value: data.rx + ' B',
    });
    // @ts-ignore
    vals.sort(compare('value', 2, 'bytes'));
    list.push(...vals);
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startTime || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  async setXpowerWifiPacketsData(data: XpowerWifiStruct): Promise<void> {
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('WIFIPackets Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    this.createStartTimeNode(list, data.startTime || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    let vals: { name: string, value: string }[] = [];
    data.tx !== 0 && vals.push({
      name: 'send',
      value: data.tx.toString(),
    });
    data.rx !== 0 && vals.push({
      name: 'receiver',
      value: data.rx.toString(),
    });
    // @ts-ignore
    vals.sort(compare('value', 2, 'number'));
    list.push(...vals);
    this.currentSelectionTbl!.dataSource = list;
    let startTimeAbsolute = (data.startTime || 0) + Utils.getInstance().getRecordStartNS();
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
  }

  async setHangData(data: HangStruct, sp: SpSystemTrace, scrollCallback: Function): Promise<void> {
    await this.setRealTime();
    this.setTableHeight('auto');
    this.tabCurrentSelectionInit('Hang Details');
    let list: unknown[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    this.createStartTimeNode(list, data.startTime || 0, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    list.push({
      name: 'Hang type',
      value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${data.type}</div>
<lit-icon style="cursor:pointer;margin-left: 5px" id="scroll-to-process" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`
    });
    data.content!.split(',').map((item, index) => ({
      name: [
        'Sender tid',
        'Send time',
        'Expect handle time',
        'Task name/ID',
        'Prio',
        'Sender'
      ][index],
      value: item,
    })).forEach((item, index) => {
      if (index === 0) {
        item.value = item.value.split(':').at(-1)!;
      }
      list.push(item);
    });

    this.currentSelectionTbl!.dataSource = list;
    // @ts-ignore
    let startTimeAbsolute = (data.startTime || 0) + window.recordStartNS;
    this.addClickToTransfBtn(startTimeAbsolute, CLOCK_TRANSF_BTN_ID, CLOCK_STARTTIME_ABSALUTED_ID);
    this.hangScrollHandler(data, sp, scrollCallback);
  }

  private hangScrollHandler(data: HangStruct, sp: SpSystemTrace, scrollCallback: Function): void {
    let scrollIcon = this.currentSelectionTbl?.shadowRoot?.querySelector('#scroll-to-process');
    scrollIcon?.addEventListener('click', async () => {
      //@ts-ignore
      let folderRow = sp.shadowRoot?.querySelector<TraceRow<unknown>>(
        `trace-row[row-id='${Utils.getDistributedRowId(data.pid)}'][row-type='process']`
      );
      if (folderRow) {
        folderRow.expansion = true;
      }
      let funcRow = sp.queryAllTraceRow<TraceRow<FuncStruct>>(
        `trace-row[row-id='${Utils.getDistributedRowId(data.tid)}'][row-type='func']`,
        (row) => row.rowId === `${data.tid}` && row.rowType === 'func'
      )[0];
      sp.currentRow = funcRow;
      if (!funcRow.dataListCache || funcRow.dataListCache.length === 0) {
        funcRow.dataListCache = await funcRow.supplierFrame!();
      }
      const findEntry = funcRow?.dataListCache.find((funcstruct: unknown) => {
        //@ts-ignore
        return (funcstruct.startTs === data.startTime && funcstruct.funName === data.content);
      })
      scrollCallback({
        //@ts-ignore
        pid: findEntry.pid,
        //@ts-ignore
        tid: findEntry.tid,
        type: 'func',
        //@ts-ignore
        dur: findEntry.dur,
        //@ts-ignore
        depth: findEntry.depth,
        //@ts-ignore
        funName: findEntry.funName,
        //@ts-ignore
        startTs: findEntry.startTs,
        keepOpen: true
      })
    })
  }

  setPerfToolsData(data: PerfToolStruct): void {
    this.setTableHeight('auto');
    //Perf Tools info
    this.tabCurrentSelectionInit('Slice Details');
    let list: unknown[] = [];
    list.push({
      name: 'Name',
      value: data.name,
    });
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTs || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      // @ts-ignore
      value: ((data.startTs || 0) + (window as unknown).recordStartNS) / 1000000000 + 's',
    });
    list.push({
      name: 'Value',
      value: data.count,
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
  }

  setMemData(data: ProcessMemStruct): void {
    this.setTableHeight('auto');
    //时钟信息
    this.initCanvas();
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    if (leftTitle) {
      leftTitle.innerText = 'Counter Details';
    }
    let list: object[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startTime || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Value', value: data.value });
    list.push({ name: 'Delta', value: data.delta });
    list.push({
      name: 'Duration',
      value: getTimeString(data.duration || 0),
    });
    this.currentSelectionTbl!.dataSource = list;
  }

  setIrqData(data: IrqStruct): void {
    this.setTableHeight('550px');
    this.initCanvas();
    this.setTitleAndButtonStyle();
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    if (leftTitle) {
      leftTitle.innerText = 'Counter Details';
    }
    let list: object[] = [];
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startNS || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startNS || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Name', value: data.name });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    queryBinderArgsByArgset(data.argSetId || 0).then((argsBinderRes) => {
      if (argsBinderRes.length > 0) {
        argsBinderRes.forEach((item) => {
          list.push({ name: item.keyName, value: item.strValue });
        });
      }
      this.currentSelectionTbl!.dataSource = list;
    });
  }

  async setSysCallData(data: ThreadSysCallStruct) {
    this.setTableHeight('350px');
    this.initCanvas();
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    this.setTitleAndButtonStyle();
    if (leftTitle) {
      leftTitle.innerText = 'SysCall Event';
    }
    let list: unknown[] = [];
    list.push({ name: 'Name', value: `${data.name} [${data.id}]` });
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTs || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startTs || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    const eventValue = await querySysCallEventDetail(data.itid!, data.startTs! + Utils.getInstance().getRecordStartNS(), data.dur!);
    if (eventValue[0]) {
      list.push({ name: 'Process', value: `${eventValue[0].pName} [${data.pid}]` });
      list.push({ name: 'Thread', value: `${eventValue[0].tName} [${data.tid}]` });
      list.push({ name: 'args', value: eventValue[0].args });
      list.push({ name: 'ret', value: eventValue[0].ret });
    }
    this.currentSelectionTbl!.dataSource = list;
  }

  async setThreadData(
    data: ThreadStruct,
    scrollCallback: ((d: unknown) => void) | undefined,
    scrollWakeUp: (d: unknown) => void | undefined,
    scrollPrio: (d: unknown) => void | undefined,
    callback?: (data: Array<unknown>, str: string) => void
  ): Promise<void> {
    //线程信息
    if (SpApplication.traceType.indexOf('SQLite') === -1) {
      await this.setRealTime();
    }
    this.setTableHeight('550px');
    this.initCanvas();
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    this.setTitleAndButtonStyle();
    if (leftTitle) {
      leftTitle.innerText = 'Thread State';
    }
    let list: unknown[] = [];
    let jankJumperList: Array<ThreadTreeNode> = [];
    this.prepareThreadInfo(list, data);
    let cpu = new CpuStruct();
    cpu.id = data.id;
    cpu.startTime = data.startTime;
    this.queryThreadDetails(data, list, jankJumperList, callback, scrollWakeUp, scrollPrio, scrollCallback);
  }

  private sortByNearData(nearData: unknown[], data: ThreadStruct, list: unknown[]): unknown[] {
    let preData: unknown = undefined;
    let nextData: unknown = undefined;

    nearData
      // @ts-ignore
      .sort((near1, near2) => near1.startTime - near2.startTime)
      .forEach((near) => {
        // @ts-ignore
        if (near.id === data.id) {
          // @ts-ignore
          if (near.startTime < data.startTime!) {
            preData = near;
            list.push({
              name: 'Previous State',
              value: `<div style="white-space: nowrap;display: flex;align-items: center">
              <div style="white-space:pre-wrap">${
                // @ts-ignore
                Utils.getEndState(near.state)
                }</div>
              <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="previous-state-click" name="select" color="#7fa1e7" size="20"></lit-icon>
              </div>`,
            });
          } else {
            nextData = near;
            list.push({
              name: 'Next State',
              value: `<div style="white-space: nowrap;display: flex;align-items: center">
              <div style="white-space:pre-wrap">${
                // @ts-ignore
                Utils.getEndState(near.state)
                }</div>
              <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="next-state-click" name="select" color="#7fa1e7" size="20"></lit-icon>
              </div>`,
            });
          }
        }
      });
    return [preData, nextData];
  }

  private setWakeupData(fromBean: WakeupBean | undefined, wakeUps: WakeupBean[], list: unknown[]): void {
    if (fromBean !== null && fromBean !== undefined && fromBean.pid !== 0 && fromBean.tid !== 0) {
      list.push({
        name: 'wakeup from tid',
        value: `<div style="white-space: nowrap;display: flex;align-items: center">
            <div style="white-space:pre-wrap">${fromBean.tid}</div>
            <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="wakeup-from"  
            class="wakeup-click"  name="select" color="#7fa1e7" size="20"></lit-icon>
            </div>`,
      });
      list.push({
        name: 'wakeup from top',
        value: `<div style="white-space: nowrap;display: flex;align-items: center">
            <div style="white-space:pre-wrap" id="wakeup-top-content" style="display: none"></div>
            <lit-icon id="wakeup-top" class="temp-icon" title="Get to chain" name="restore" size="30" 
              style="position: relative; top: 5px; left: 10px;"></lit-icon>
            </div>`,
      });
    }
    if (wakeUps !== null) {
      wakeUps.map((e) => {
        list.push({
          name: 'wakeup tid',
          value: `<div style="white-space: nowrap;display: flex;align-items: center">
            <div style="white-space:pre-wrap">${e.tid}</div>
            <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="wakeup-${e.tid}" 
            class="wakeup-click" name="select" color="#7fa1e7" size="20"></lit-icon>
            </div>`,
        });
      });
    }
  }

  private queryThreadDetails(
    data: ThreadStruct,
    list: unknown[],
    jankJumperList: ThreadTreeNode[],
    callback: ((data: Array<unknown>, str: string) => void) | undefined,
    scrollWakeUp: (d: unknown) => void | undefined,
    scrollPrio: (d: unknown) => void | undefined,
    scrollCallback: ((d: unknown) => void) | undefined
  ): void {
    Promise.all([
      this.queryThreadWakeUpFromData(data.id!, data.startTime!, data.dur!),
      this.queryThreadWakeUpData(data.id!, data.startTime!, data.dur!),
      this.queryThreadStateDArgs(data.argSetID),
      threadNearData('near-data', data.pid!, data.tid!, data.startTime!),
    ]).then((result) => {
      let fromBean = result[0];
      let wakeUps = result[1];
      let args = result[2];
      let [preData, nextData] = this.sortByNearData(result[3], data, list);
      this.setWakeupData(fromBean, wakeUps, list);
      if (args.length > 0) {
        args.forEach((arg: unknown) => {
          // @ts-ignore
          if (arg.keyName === 'next_info') {
            // @ts-ignore
            list.push({ name: arg.keyName, value: arg.strValue?.indexOf(',') === -1 ? this.parseSchedSwitchHmNew(Number(arg.strValue)) : arg.strValue });
          } else {
            // @ts-ignore
            list.push({ name: arg.keyName, value: arg.strValue })
          }
        });
      }
      this.currentSelectionTbl!.dataSource = list;
      let startTimeAbsolute = (data.startTime || 0) + Utils.getInstance().getRecordStartNS();
      this.addClickToTransfBtn(startTimeAbsolute, THREAD_TRANSF_BTN_ID, THREAD_STARTTIME_ABSALUTED_ID);
      let timeLineNode = new ThreadTreeNode(data.tid!, data.pid!, data.startTime!);
      jankJumperList.push(timeLineNode);
      if (callback) {
        callback(jankJumperList, this.wakeUp);
        this.wakeUp = '';
      }
      this.stateClickHandler(preData, nextData, data, scrollWakeUp, scrollCallback, scrollPrio);
      this.wakeupClickHandler(wakeUps, fromBean, scrollWakeUp);
      this.getWakeupChainClickHandler(fromBean, list);
    });
  }

  private wakeupClickHandler(
    wakeUps: WakeupBean[],
    fromBean: WakeupBean | undefined,
    scrollWakeUp: (d: unknown) => void | undefined
  ): void {
    this.currentSelectionTbl?.shadowRoot?.querySelector('#wakeup-from')?.addEventListener('click', () => {
      //点击跳转，唤醒和被唤醒的 线程
      if (fromBean && scrollWakeUp) {
        scrollWakeUp({
          processId: fromBean.pid,
          tid: fromBean.tid,
          startTime: fromBean.ts,
          dur: fromBean.dur,
          cpu: fromBean.cpu,
          id: fromBean.itid,
          state: 'Running',
          argSetID: fromBean.argSetID,
        });
      }
      this.wakeUp = 'wakeup tid';
    });
    if (wakeUps) {
      wakeUps.map((up) => {
        this.currentSelectionTbl?.shadowRoot?.querySelector(`#wakeup-${up.tid}`)?.addEventListener('click', () => {
          //点击跳转，唤醒和被唤醒的 线程
          if (up && scrollWakeUp !== undefined) {
            scrollWakeUp({
              processId: up.pid,
              tid: up.tid,
              startTime: up.ts,
              dur: up.dur,
              cpu: up.cpu,
              id: up.itid,
              state: up.state,
              argSetID: up.argSetID,
            });
          }
          this.wakeUp = 'wakeup tid';
        });
      });
    }
  }

  private stateClickHandler(
    preData: unknown,
    nextData: unknown,
    data: ThreadStruct,
    scrollWakeUp: (d: unknown) => void | undefined,
    scrollCallback: ((d: unknown) => void) | undefined,
    scrollPrio: (d: unknown) => void | undefined
  ): void {
    this.currentSelectionTbl?.shadowRoot?.querySelector('#next-state-click')?.addEventListener('click', () => {
      if (nextData && scrollWakeUp !== undefined) {
        scrollWakeUp({
          // @ts-ignore
          processId: nextData.pid,
          // @ts-ignore
          tid: nextData.tid,
          // @ts-ignore
          startTime: nextData.startTime,
          // @ts-ignore
          dur: nextData.dur,
          // @ts-ignore
          cpu: nextData.cpu,
          // @ts-ignore
          id: nextData.id,
          // @ts-ignore
          state: nextData.state,
          // @ts-ignore
          argSetID: nextData.argSetID,
        });
      }
    });

    this.currentSelectionTbl?.shadowRoot?.querySelector('#previous-state-click')?.addEventListener('click', () => {
      if (preData && scrollWakeUp !== undefined) {
        scrollWakeUp({
          // @ts-ignore
          processId: preData.pid,
          // @ts-ignore
          tid: preData.tid,
          // @ts-ignore
          startTime: preData.startTime,
          // @ts-ignore
          dur: preData.dur,
          // @ts-ignore
          cpu: preData.cpu,
          // @ts-ignore
          id: preData.id,
          // @ts-ignore
          state: preData.state,
          // @ts-ignore
          argSetID: preData.argSetID,
        });
      }
    });

    this.currentSelectionTbl?.shadowRoot?.querySelector('#state-click')?.addEventListener('click', () => {
      //线程点击
      if (scrollCallback) {
        scrollCallback(data);
      }
    });
    this.currentSelectionTbl?.shadowRoot?.querySelector('#prio-click')?.addEventListener('click', (ev) => {
      if (scrollPrio) {
        sqlPrioCount(data).then((res: unknown) => {
          scrollPrio(res);
        });
      }
    });
  }
  //点击事件获取唤醒链
  private getWakeupChainClickHandler(fromBean: WakeupBean | undefined, list: unknown[]): void {
    this.currentSelectionTbl?.shadowRoot?.querySelector('#wakeup-top')?.addEventListener('click', async () => {
      this.topChainStr = '';
      //@ts-ignore
      let currentThread = list.filter((item) => item.name === 'Thread')?.[0].value;//点击的当前线程
      let previouosWakeupThread = Utils.getInstance().getThreadMap().get(fromBean!.tid!) || 'Thread';//唤醒当前线程的上个线程
      this.topChainStr = `-->${previouosWakeupThread} [${fromBean!.tid}]-->${currentThread}`;
      this.getRWakeUpChain(fromBean);
    })
  }
  private async prepareThreadInfo(list: unknown[], data: ThreadStruct): Promise<void> {
    let processName = Utils.getInstance().getProcessMap().get(data.pid!);
    let threadName = Utils.getInstance().getThreadMap().get(data.tid!);
    list.push({
      name: 'Process',
      value: (this.transferString(processName ?? '') || 'NULL') + ' [' + data.pid + '] ',
    });
    list.push({
      name: 'Thread',
      value: (this.transferString(threadName ?? '') || 'NULL') + ' [' + data.tid + '] ',
    });
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTime || 0),
    });
    this.createStartTimeNode(list, data.startTime || 0, THREAD_TRANSF_BTN_ID, THREAD_STARTTIME_ABSALUTED_ID);
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    let state;
    if (data.state) {
      state = Utils.getEndState(data.state);
    } else if (data.state === '' || data.state === null) {
      state = '';
    } else {
      state = 'Unknown State';
    }
    if ('Running' === state) {
      state = state + ' on CPU ' + data.cpu;
      list.push({
        name: 'State',
        value: `<div style="white-space: nowrap;display: flex;align-items: center">
            <div style="white-space:pre-wrap">${state}</div>
            <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="state-click" name="select" color="#7fa1e7" size="20"></lit-icon>
            </div>`,
      });
    } else {
      list.push({ name: 'State', value: `${state}` });
    }
    if (state.includes('Running')) {
      let startTime: number = data.startTime || 0;
      let endTime: number = (data.startTime || 0) + (data.dur || 0);
      let freqList: Array<unknown> = [];
      let str = '';
      freqList = await queryStateFreqList(startTime, endTime, data.cpu || 0);
      freqList.forEach((it) => {
        // @ts-ignore
        if (it.startTime < startTime! && it.endTime > endTime!) {
          // @ts-ignore
          it.stateDur = data.dur;
          // @ts-ignore
        } else if (it.startTime < startTime! && startTime! < it.endTime && it.endTime < endTime!) {
          // @ts-ignore
          it.stateDur = it.endTime - startTime!;
          // @ts-ignore
        } else if (it.startTime > startTime! && startTime! < it.endTime && it.endTime < endTime!) {
          // @ts-ignore
          it.stateDur = it.dur;
          // @ts-ignore
        } else if (it.startTime > startTime! && endTime! > it.startTime && it.endTime > endTime!) {
          // @ts-ignore
          it.stateDur = endTime! - it.startTime;
        }
        // @ts-ignore
        str += '[' + it.value + ', ' + (it.stateDur || 0) / 1000 + ']' + ',';
      });
      list.push({ name: 'Freq [KHz, μs]', value: str.substring(0, str.length - 1) });
    }
    let slice = Utils.getInstance().getSchedSliceMap().get(`${data.id}-${data.startTime}`);
    if (slice) {
      list.push({
        name: 'Prio',
        value: `<div style="white-space: nowrap;display: flex;align-item: center">
        <div style="white-space: pre-wrap">${slice.priority}</div>
        <lit-icon style="cursor:pointer;transform: scalex(-1);margin-left: 5px" id="prio-click" name="select" color="#7fa1e7" size="20"></lit-icon>
        </div>`,
      });
    }
  }

  setJankData(
    data: JankStruct,
    callback: ((data: Array<unknown>) => void) | undefined = undefined,
    scrollCallback: ((d: unknown) => void) | undefined
  ): void {
    //线程信息
    this.setTableHeight('750px');
    this.tabCurrentSelectionInit('Slice Details');
    let list: unknown[] = [];
    this.setJankCommonMessage(list, data);
    if (`${data.type}` === '0') {
      this.handleTypeJank(data, list, scrollCallback, callback);
    } else {
      this.currentSelectionTbl!.dataSource = list;
    }
  }

  private handleTypeJank(
    data: JankStruct,
    list: unknown[],
    scrollCallback: ((d: unknown) => void) | undefined,
    callback: ((data: Array<unknown>) => void) | undefined
  ): void {
    this.setJankType(data, list);
    let jankJumperList: Array<JankTreeNode> = [];
    if (data.frameType === 'render_service') {
      queryGpuDur(data.id!).then((it) => {
        if (it.length > 0) {
          //@ts-ignore
          list.push({ name: 'Gpu Duration', value: getTimeString(it[0].gpu_dur) });
        }
      });
      this.handleRenderServiceJank(data, list, jankJumperList, scrollCallback, callback);
    } else if (data.frameType === 'app') {
      this.handleAppJank(list, data, jankJumperList, scrollCallback, callback);
    } else if (data.frameType === 'frameTime') {
      this.handleFrameTimeJank(data, list, jankJumperList, scrollCallback, callback);
    }
  }

  private handleFrameTimeJank(
    data: JankStruct,
    list: unknown[],
    jankJumperList: JankTreeNode[],
    scrollCallback: ((d: unknown) => void) | undefined,
    callback: ((data: Array<unknown>) => void) | undefined
  ): void {
    queryGpuDur(data.id!).then((it) => {
      if (it.length > 0) {
        list.push({
          name: 'Gpu Duration',
          //@ts-ignore
          value: getTimeString(it[0].gpu_dur),
        });
      }
      this.addAppFrameDetails(data, list);
      this.addRenderServiceFrameDetails(data, list);
      this.addFollowingDetails(list, data);
      let appNode = new JankTreeNode(data.name!, data.pid!, 'app');
      let rsNode = new JankTreeNode(data.rs_vsync!, data.rs_pid!, 'render_service');
      appNode.children.push(rsNode);
      jankJumperList.push(appNode);
      this.currentSelectionTbl!.dataSource = list;
      this.addJankScrollCallBackEvent(scrollCallback, callback, jankJumperList);
    });
  }

  private addRenderServiceFrameDetails(data: JankStruct, list: unknown[]): void {
    if (data.rs_name) {
      list.push({
        name: 'RenderService Frame',
        value: '',
      });
      list.push({
        name: 'Process',
        value: 'render_service ' + data.rs_pid,
      });
      list.push({
        name: 'StartTime(Relative)',
        value: getTimeString(data.rs_ts || 0),
      });
      list.push({
        name: 'StartTime(Absolute)',
        value: ((data.rs_ts || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
      });
      list.push({
        name: 'end time',
        value: getTimeString(data.rs_ts! + data.rs_dur! || 0),
      });
    }
  }

  private addFollowingDetails(list: unknown[], data: JankStruct): void {
    list.push({
      name: 'Following',
      value: '',
    });
    list.push({
      name: 'Slice',
      value:
        data.cmdline +
        ' [' +
        data.name +
        ']' +
        `<lit-icon class="jank_cla" style="display: inline-flex;cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="${data.type}-${data.pid}" slice_name="${data.name}"  pid="${data.pid}" name="select" color="#7fa1e7" size="20"></lit-icon>`,
    });
  }

  private addAppFrameDetails(data: JankStruct, list: unknown[]): void {
    if (data.name) {
      list.push({
        name: 'App Frame',
        value: '',
      });
      list.push({
        name: 'Process',
        value: data.cmdline + ' ' + data.pid,
      });
      list.push({
        name: 'StartTime(Relative)',
        value: getTimeString(data.ts || 0),
      });
      list.push({
        name: 'StartTime(Absolute)',
        value: ((data.ts || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
      });
      list.push({
        name: 'end time',
        value: getTimeString(data!.ts! + data.dur! || 0),
      });
    }
  }

  private handleAppJank(
    list: unknown[],
    data: JankStruct,
    jankJumperList: JankTreeNode[],
    scrollCallback: ((d: unknown) => void) | undefined,
    callback: ((data: Array<unknown>) => void) | undefined
  ): void {
    list.push({
      name: 'FrameTimeLine flows',
      value: '',
    });
    list.push({
      name: 'Slice',
      value:
        data.cmdline +
        ' [' +
        data.name +
        ']' +
        `<lit-icon  class="jank_cla" style="display: inline-flex;cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="actual frameTime"  slice_name="${data.name}"  pid="${data.pid}" name="select" color="#7fa1e7" size="20"></lit-icon>`,
    });
    let timeLineNode = new JankTreeNode(data.name!, data.pid!, 'frameTime');
    jankJumperList.push(timeLineNode);
    if (data.dst_slice) {
      queryPrecedingData(data.dst_slice).then((it) => {
        if (it.length > 0) {
          list.push({
            name: 'Preceding flows',
            value: '',
          });
          it.forEach((a: unknown) => {
            // @ts-ignore
            let rsNode = new JankTreeNode(a.name, a.pid, 'render_service');
            jankJumperList.push(rsNode);
            list.push({
              name: 'Slice',
              value:
                // @ts-ignore
                a.cmdline +
                ' [' +
                // @ts-ignore
                a.name +
                ']' +
                // @ts-ignore
                `<lit-icon class="jank_cla" style="display: inline-flex;cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="${a.type}-${a.pid}" slice_name="${a.name}" pid="${a.pid}" name="select" color="#7fa1e7" size="20"></lit-icon>`,
            });
          });
          this.currentSelectionTbl!.dataSource = list;
          this.addJankScrollCallBackEvent(scrollCallback, callback, jankJumperList);
        }
      });
    } else {
      this.currentSelectionTbl!.dataSource = list;
      this.addJankScrollCallBackEvent(scrollCallback, callback, jankJumperList);
    }
  }

  private handleRenderServiceJank(
    data: JankStruct,
    list: unknown[],
    jankJumperList: JankTreeNode[],
    scrollCallback: ((d: unknown) => void) | undefined,
    callback: ((data: Array<unknown>) => void) | undefined
  ): void {
    if (data.src_slice) {
      queryFlowsData(data.src_slice!.split(',')).then((it) => {
        if (it.length > 0) {
          list.push({
            name: 'FrameTimeLine flows',
            value: '',
          });
          it.forEach((a: unknown) => {
            // @ts-ignore
            let appNode = new JankTreeNode(a.name, a.pid, 'app');
            // @ts-ignore
            appNode.children.push(new JankTreeNode(a.name, a.pid, 'frameTime'));
            jankJumperList.push(appNode);
            list.push({
              name: 'Slice',
              value:
                // @ts-ignore
                a.cmdline +
                ' [' +
                // @ts-ignore
                a.name +
                ']' +
                // @ts-ignore
                `<lit-icon  class="jank_cla" style="display: inline-flex;cursor: pointer;transform: scaleX(-1);margin-left: 5px" id="actual frameTime" slice_name="${a.name}" pid="${a.pid}" name="select" color="#7fa1e7" size="20"></lit-icon>`,
            });
          });
          list.push({
            name: 'Following flows',
            value: '',
          });
          it.forEach((a: unknown) => {
            list.push({
              name: 'Slice',
              value:
                // @ts-ignore
                a.cmdline +
                ' [' +
                // @ts-ignore
                a.name +
                ']' +
                // @ts-ignore
                `<lit-icon class="jank_cla" style="display: inline-flex;cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="${a.type}-${a.pid}" slice_name="${a.name}"  pid="${a.pid}" name="select" color="#7fa1e7" size="20"></lit-icon>`,
            });
          });
          this.currentSelectionTbl!.dataSource = list;
          this.addJankScrollCallBackEvent(scrollCallback, callback, jankJumperList);
        }
      });
    } else {
      this.currentSelectionTbl!.dataSource = list;
    }
  }

  setAllStartupData(data: AllAppStartupStruct, scrollCallback: Function): void {
    this.setTableHeight('550px');
    this.initCanvas();
    let allStartUpLeftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    let allStartUpmiddleTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightText');
    let allStartUpRightButton: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightButton');
    let rightButton: HTMLElement | null | undefined = this?.shadowRoot
      ?.querySelector('#rightButton')
      ?.shadowRoot?.querySelector('#custom-button');
    let rightStar: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#right-star');
    if (rightButton) {
      rightButton!.style.visibility = 'hidden';
    }
    if (rightStar) {
      rightStar!.style.visibility = 'hidden';
    }
    if (allStartUpmiddleTitle) {
      allStartUpmiddleTitle.style.visibility = 'hidden';
    }
    if (allStartUpRightButton) {
      allStartUpRightButton.style.visibility = 'hidden';
    }
    if (allStartUpLeftTitle) {
      allStartUpLeftTitle.innerText = 'Details';
    }
    let list: unknown[] = [];
    list.push({ name: 'Name', value: data.stepName! });
    list.push({
      name: 'StartTime(Relative)',
      value: getTimeString(data.startTs || 0),
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startTs || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({
      name: 'EndTime(Relative)',
      value: getTimeString((data.startTs || 0) + (data.dur || 0)),
    });
    list.push({
      name: 'EndTime(Abslute)',
      value: ((data.startTs || 0) + (data.dur || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({
      name: 'Dur',
      value: getTimeString(data.dur || 0),
    });
    this.currentSelectionTbl!.dataSource = list;
  }

  setStartupData(data: AppStartupStruct, scrollCallback: Function, rowData: unknown): void {
    this.setTableHeight('550px');
    this.initCanvas();
    this.setStartUpStyle();
    let list: unknown[] = [];
    list.push({ name: 'Name', value: AppStartupStruct.getStartupName(data.startName) });
    list.push({
      name: 'StartTime(Relative)',
      value: `
      <div style="display: flex;white-space: nowrap;align-items: center">
<div style="white-space:pre-wrap">${getTimeString(data.startTs || 0)}</div>
<lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="start-jump" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`,
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startTs || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    if (data.dur && data.dur > 0) {
      if (data.startName > 6) {
        list.push({
          name: 'EndTime(Relative)',
          value: `<div style="white-space: nowrap;display: flex;align-items: center">
  <div style="white-space:pre-wrap">${getTimeString((data.startTs || 0) + (data.dur || 0))}</div>
  </div>`,
        });
      } else {
        list.push({
          name: 'EndTime(Relative)',
          value: `<div style="white-space: nowrap;display: flex;align-items: center">
  <div style="white-space:pre-wrap">${getTimeString((data.startTs || 0) + (data.dur || 0))}</div>
  <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="end-jump" name="select" color="#7fa1e7" size="20"></lit-icon>
  </div>`,
        });
      }
      list.push({
        name: 'EndTime(Absolute)',
        value: ((data.startTs || 0) + (data.dur || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
      });
    } else {
      list.push({
        name: 'EndTime(Relative)',
        value: 'Unknown Time',
      });
      list.push({
        name: 'EndTime(Absolute)',
        value: 'Unknown Time',
      });
    }
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    // @ts-ignore
    let sortedArray = rowData.slice().sort(function (a: { startTs: number }, b: { startTs: number }) {
      return a.startTs - b.startTs;
    });
    sortedArray.forEach((item: unknown, index: number) => {
      // @ts-ignore
      if (item.startName === data.startName) {
        list.push({
          name: 'StartSlice',
          value:
            index === 0
              ? 'NULL'
              : `${AppStartupStruct.getStartupName(sortedArray[index - 1].startName)}     ${getTimeString(
                sortedArray[index - 1].startTs + sortedArray[index - 1].dur
              )}`,
        });
        list.push({
          name: 'EndSlice',
          value:
            index === sortedArray.length - 1
              ? 'NULL'
              : `${AppStartupStruct.getStartupName(sortedArray[index + 1].startName)}      ${getTimeString(
                sortedArray[index + 1].startTs
              )}`,
        });
        if (data.startName === 6) {
          data.endstartTs = sortedArray[index + 1].startTs;
          data.endItid = sortedArray[index + 1].itid;
        } else {
          data.endstartTs = data.startTs! + data.dur!;
        }
      }
    });
    this.currentSelectionTbl!.dataSource = list;
    this.attachScrollHandlers(data, scrollCallback);
  }

  private setStartUpStyle(): void {
    let rightButton: HTMLElement | null | undefined = this?.shadowRoot
      ?.querySelector('#rightButton')
      ?.shadowRoot?.querySelector('#custom-button');
    let startUpRightTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightTitle');
    if (startUpRightTitle) {
      startUpRightTitle.style.visibility = 'hidden';
      rightButton!.style.visibility = 'hidden';
    }
    let startUpLeftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    if (startUpLeftTitle) {
      startUpLeftTitle.innerText = 'Details';
    }
  }

  private attachScrollHandlers(data: AppStartupStruct, scrollCallback: Function): void {
    let startIcon = this.currentSelectionTbl?.shadowRoot?.querySelector('#start-jump');
    let endIcon = this.currentSelectionTbl?.shadowRoot?.querySelector('#end-jump');
    let scrollClick = (type: number): void => {
      let recordNs: number = Utils.getInstance().getRecordStartNS();
      queryThreadByItid(
        type === 0 ? data.itid! : data.endItid!,
        type === 0 ? recordNs + data.startTs! : recordNs + data.endstartTs!
      ).then((result) => {
        if (result.length > 0) {
          //@ts-ignore
          let pt: {
            pid: number;
            tid: number;
            dur: number;
            name: string;
            depth: number;
          } = result[0];
          scrollCallback({
            pid: pt.pid,
            tid: pt.tid,
            type: 'func',
            dur: pt.dur,
            depth: pt.depth,
            funName: pt.name,
            startTs: type === 0 ? data.startTs! : data.endstartTs!,
            keepOpen: true,
          });
        }
      });
    };
    if (startIcon) {
      startIcon.addEventListener('click', () => scrollClick(0));
    }
    if (endIcon) {
      endIcon.addEventListener('click', () => scrollClick(1));
    }
  }

  setStaticInitData(data: SoStruct, scrollCallback: Function): void {
    this.setTableHeight('550px');
    this.initCanvas();
    this.setStaticInitStyle();
    let list: unknown[] = [];
    list.push({ name: 'Name', value: data.soName });
    list.push({
      name: 'StartTime(Relative)',
      value: `<div style="white-space: nowrap;display: flex;align-items: center">
<div style="white-space:pre-wrap">${getTimeString(data.startTs || 0)}</div>
<lit-icon id="start-jump" style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" name="select" color="#7fa1e7" size="20"></lit-icon>
</div>`,
    });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.startTs || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Duration', value: getTimeString(data.dur || 0) });
    this.currentSelectionTbl!.dataSource = list;
    this.startIconClickEvent(data, scrollCallback);
  }

  private setStaticInitStyle(): void {
    let rightTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#rightTitle');
    let rightButton: HTMLElement | null | undefined = this?.shadowRoot
      ?.querySelector('#rightButton')
      ?.shadowRoot?.querySelector('#custom-button');
    if (rightTitle) {
      rightTitle.style.visibility = 'hidden';
      rightButton!.style.visibility = 'hidden';
    }
    let leftTitle: HTMLElement | null | undefined = this?.shadowRoot?.querySelector('#leftTitle');
    if (leftTitle) {
      leftTitle.innerText = 'Details';
    }
  }

  private startIconClickEvent(data: SoStruct, scrollCallback: Function): void {
    let startIcon = this.currentSelectionTbl?.shadowRoot?.querySelector('#start-jump');
    if (startIcon) {
      startIcon.addEventListener('click', () => {
        let recordNs: number = Utils.getInstance().getRecordStartNS();
        queryThreadByItid(data.itid!, recordNs + data.startTs!).then((result) => {
          if (result.length > 0) {
            //@ts-ignore
            let pt: {
              pid: number;
              tid: number;
              dur: number;
              name: string;
              depth: number;
            } = result[0];
            scrollCallback({
              pid: pt.pid,
              tid: pt.tid,
              type: 'func',
              dur: pt.dur,
              depth: pt.depth,
              funName: pt.name,
              startTs: data.startTs,
              keepOpen: true,
            });
          }
        });
      });
    }
  }

  async setFrameAnimationData(data: FrameAnimationStruct, scrollCallback: Function): Promise<void> {
    this.setTableHeight('550px');
    this.tabCurrentSelectionInit('Animation Details');
    let list = [];
    let dataTs: number = data.startTs < 0 ? 0 : data.startTs;
    list.push({ name: 'Name', value: data.name });
    list.push({ name: 'Start time(Relative)', value: `${Utils.getTimeString(dataTs)}` });
    list.push({
      name: 'Start time(Absolute)',
      value: ((dataTs || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({
      name: 'End time(Relative)',
      value: `${Utils.getTimeString(dataTs + (data.dur || 0))}`,
    });
    list.push({
      name: 'End time(Absolute)',
      value: (dataTs + (data.dur || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Duration', value: `${Utils.getTimeString(data.dur || 0)}` });
    if (data.status === 'Completion delay') {
      let queryJoinName = `${data.frameInfo?.split(':')[1]}: ${data.name?.split(':')![1]}`;
      let frameFpsMessage = data.frameInfo?.split(':');
      await queryFpsSourceList(data.inputTime, data.endTime, queryJoinName).then((result) => {
        if (result.length > 0) {
          this.isFpsAvailable = true;
          this.fpsResult = result;
        } else {
          this.isFpsAvailable = false;
        }
      });
      if (frameFpsMessage) {
        if (frameFpsMessage[1] !== '0') {
          if (this.isFpsAvailable) {
            list.push({
              name: 'FPS',
              value: `<div style="white-space: nowrap;display: flex;align-items: center">
            <div style="white-space:pre-wrap">${frameFpsMessage[1]}</div>
            <lit-icon style="cursor:pointer;transform: scaleX(-1);margin-left: 5px" id="fps-jump" name="select" color="#7fa1e7" size="20"></lit-icon>
            </div>`,
            });
          } else {
            list.push({ name: 'FPS', value: `${frameFpsMessage[1]}` });
          }
        } else {
          let fixedNumber: number = 2;
          let fpsValue: number = Number(frameFpsMessage[0]) / (data.dur / 1000_000_000);
          list.push({ name: 'FPS', value: `${fpsValue.toFixed(fixedNumber) || 0}` });
        }
      }
    }
    this.currentSelectionTbl!.dataSource = list;
    this.fpsClickEvent(data, scrollCallback);
  }

  private fpsClickEvent(data: FrameAnimationStruct, scrollCallback: Function): void {
    let recordNs: number = Utils.getInstance().getRecordStartNS();
    this.currentSelectionTbl?.shadowRoot?.querySelector('#fps-jump')?.addEventListener('click', () => {// @ts-ignore
      let pt: {
        pid: number;
        tid: number;
        name: string;
        ts: number;
        dur: number;
        depth: number;
      } = this.fpsResult[0];
      scrollCallback({
        pid: pt.tid,
        tid: pt.tid,
        dur: pt.dur,
        type: 'func',
        depth: pt.depth,
        funName: pt.name,
        startTs: pt.ts - recordNs,
        keepOpen: true,
      });
    });
  }

  private setJankType(data: JankStruct, list: unknown[]): void {
    if (data.jank_tag === 1) {
      if (data.frameType === 'render_service') {
        list.push({ name: 'Jank Type', value: 'RenderService Deadline Missed' });
      } else if (data.frameType === 'app') {
        list.push({ name: 'Jank Type', value: 'APP Deadline Missed' });
      } else if (data.frameType === 'frameTime') {
        list.push({ name: 'Jank Type', value: 'Deadline Missed' });
      }
    } else if (data.jank_tag === 3) {
      list.push({ name: 'Jank Type', value: 'Deadline Missed' });
    } else {
      list.push({ name: 'Jank Type', value: 'NONE' });
    }
  }

  private setJankCommonMessage(list: unknown[], data: JankStruct): void {
    list.push({ name: 'Name', value: data.name });
    list.push({ name: 'StartTime(Relative)', value: getTimeString(data.ts || 0) });
    list.push({
      name: 'StartTime(Absolute)',
      value: ((data.ts || 0) + Utils.getInstance().getRecordStartNS()) / 1000000000 + 's',
    });
    list.push({ name: 'Duration', value: data.dur ? getTimeString(data.dur) : ' ' });
    if (data.frameType !== 'frameTime') {
      list.push({ name: 'Process', value: data.cmdline + ' ' + data.pid });
    }
  }

  private setTableHeight(height: string): void {
    this.scrollView!.scrollTop = 0;
    this.currentSelectionTbl!.style.height = height;
    this.wakeupListTbl!.style.display = 'none';
  }

  private addJankScrollCallBackEvent(
    scrollCallback: ((d: unknown) => void) | undefined,
    callback: ((data: Array<unknown>) => void) | undefined,
    jankJumperList: JankTreeNode[]
  ): void {
    let all = this.currentSelectionTbl?.shadowRoot?.querySelectorAll('.jank_cla');
    all!.forEach((a) => {
      a.addEventListener('click', () => {
        if (scrollCallback) {
          scrollCallback({
            rowId: a.id,
            name: a.getAttribute('slice_name'),
            pid: a.getAttribute('pid'),
          });
        }
      });
    });
    if (callback) {
      callback(jankJumperList);
    }
  }

  async queryThreadStateDArgs(argSetID: number | undefined): Promise<BinderArgBean[]> {
    let list: Array<BinderArgBean> = [];
    if (argSetID !== undefined && argSetID > 0) {
      list = await queryThreadStateArgs(argSetID);
    }
    return list;
  }

  /**
   * 查询出 线程被唤醒的 线程信息
   * @param data
   */
  async queryCPUWakeUpFromData(data: CpuStruct): Promise<WakeupBean | null> {
    let wb: WakeupBean | null = null;
    if (data.id === undefined || data.startTime === undefined) {
      return null;
    }
    let wakeup = await queryRunnableTimeByRunning(data.tid!, data.startTime);
    if (wakeup && wakeup[0]) {
      let wakeupTs = wakeup[0].ts as number;
      let recordStartTs = Utils.getInstance().getRecordStartNS();
      let wf = await queryThreadWakeUpFrom(data.id, wakeupTs);
      // @ts-ignore
      if (wf && wf[0]) {
        // @ts-ignore
        wb = wf[0];
        if (wb !== null) {
          wb.wakeupTime = wakeupTs - recordStartTs;
          wb.process = Utils.getInstance().getProcessMap().get(wb.pid!) || 'Process';
          wb.thread = Utils.getInstance().getThreadMap().get(wb.tid!) || 'Thread';
          wb.schedulingLatency = (data.startTime || 0) - (wb.wakeupTime || 0);
          wb.schedulingDesc = INPUT_WORD;
        }
      }
    }
    return wb;
  }

  /**
   * 查询出 线程被唤醒的 线程链信息
   * @param data
   */
  static async queryCPUWakeUpListFromBean(data: WakeupBean): Promise<WakeupBean | null> {
    let wb: WakeupBean | null = null;
    let wakeup = await queryRunnableTimeByRunning(data.tid!, data.ts!);
    if (wakeup && wakeup[0]) {
      let wakeupTs = wakeup[0].ts as number;
      let recordStartTs = Utils.getInstance().getRecordStartNS();
      let wf = await queryThreadWakeUpFrom(data.itid!, wakeupTs);
      // @ts-ignore
      if (wf && wf[0]) {
        // @ts-ignore
        wb = wf[0];
        if (wb !== null) {
          wb.wakeupTime = wakeupTs - recordStartTs;
          wb.process = Utils.getInstance().getProcessMap().get(wb.pid!) || 'Process';
          wb.thread = Utils.getInstance().getThreadMap().get(wb.tid!) || 'Thread';
          wb.schedulingLatency = (data.ts || 0) - (wb.wakeupTime || 0);
          wb.schedulingDesc = INPUT_WORD;
        }
      }
    }
    return wb;
  }

  /**
   * 查询出 线程唤醒了哪些线程信息
   */
  async queryThreadWakeUpFromData(itid: number, startTime: number, dur: number): Promise<WakeupBean | undefined> {
    let wakeUps = await queryThreadWakeUpFrom(itid, startTime + Utils.getInstance().getRecordStartNS());
    let item;
    // @ts-ignore
    if (wakeUps !== undefined && wakeUps.length > 0) {
      // @ts-ignore
      item = wakeUps[0];
    }
    return item;
  }

  /**
   * 查询出 线程唤醒了哪些线程信息
   */
  async queryThreadWakeUpData(itid: number, startTime: number, dur: number): Promise<Array<WakeupBean>> {
    let list: Array<WakeupBean> = [];
    if (itid === undefined || startTime === undefined) {
      return list;
    }
    let wakeUps = await queryThreadWakeUp(itid, startTime, dur); //  3,4835380000
    if (wakeUps !== undefined && wakeUps.length > 0) {
      list.push(...wakeUps);
    }
    return list;
  }
  //递归查找R唤醒链
  getRWakeUpChain(data: WakeupBean | undefined): void {
    this.getRWakeUpChainData(data).then((wakeupFrom: unknown) => {
      if (wakeupFrom === null) {//当查不到数据时，处理容器状态与样式，展示内容
        let wakeupTopContent = this.currentSelectionTbl?.shadowRoot?.getElementById('wakeup-top-content');
        let wakeupTopIcon = this.currentSelectionTbl?.shadowRoot?.querySelector<HTMLDivElement>('#wakeup-top');
        wakeupTopContent!.innerText = 'idle' + this.topChainStr;//处理链顶部
        wakeupTopIcon!.style.display = 'none';
        wakeupTopContent!.style.display = 'block';
        wakeupTopContent!.style.maxHeight = '100px';//设置最大高度，超出出现滚动条
        wakeupTopContent!.style.overflow = 'auto';
        return;
      }
      //@ts-ignore
      this.topChainStr = `-->${wakeupFrom!.thread} [${wakeupFrom!.tid}]` + this.topChainStr;//链的拼接
      // @ts-ignore
      this.getRWakeUpChain(wakeupFrom);
    });
  }

  /**
   * 获取 R的唤醒链
   * @param data
  */
  async getRWakeUpChainData(data: unknown): Promise<WakeupBean | null> {
    let wakeupFrom: WakeupBean | null = null;
    //@ts-ignore
    let wakeup = await queryRunnableTimeByRunning(data.tid!, data.ts!);//通过链上的Running块，查找前一条R信息
    if (wakeup && wakeup[0]) {
      let wakeupTs = wakeup[0].ts as number;
      //@ts-ignore
      let wf = await queryRWakeUpFrom(data.itid!, wakeupTs);//查找到的前一条R信息，对应的唤醒信息
      //@ts-ignore
      if (wf && wf[0]) {
        //@ts-ignore
        wakeupFrom = wf[0];
        //@ts-ignore
        wakeupFrom.thread = Utils.getInstance().getThreadMap().get(wakeupFrom.tid!) || 'Thread';
      }
    }
    return wakeupFrom;
  }

  initCanvas(): HTMLCanvasElement | null {
    let canvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#rightDraw');
    let width = getComputedStyle(this.currentSelectionTbl!).getPropertyValue('width');
    if (canvas !== null) {
      canvas.width = Math.round(Number(width.replace('px', '')) * this.dpr);
      canvas.height = Math.round(Number(200 * this.dpr));
      canvas.style.width = width;
      canvas.style.height = '200px';
      canvas.getContext('2d')!.scale(this.dpr, this.dpr);
    }
    SpApplication.skinChange = (val: boolean): void => {
      this.drawRight(canvas, this.weakUpBean!);
    };
    return canvas;
  }

  drawRight(cavs: HTMLCanvasElement | null, wakeupBean: WakeupBean | null): void {
    if (cavs === null) {
      return;
    }
    let context = cavs.getContext('2d');
    if (context !== null) {
      //绘制竖线
      this.drawVerticalLine(context);
      //绘制菱形
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(10, 30);
      context.lineTo(4, 40);
      context.lineTo(10, 50);
      context.lineTo(16, 40);
      context.lineTo(10, 30);
      context.closePath();
      context.fill();
      context.font = 12 + 'px sans-serif';
      //绘制wake up 文字
      let strList = [];
      strList.push('wakeup @ ' + getTimeString(wakeupBean?.wakeupTime || 0) + ' on CPU ' + wakeupBean?.cpu + ' by');
      strList.push('P:' + wakeupBean?.process + ' [ ' + wakeupBean?.pid + ' ]');
      strList.push('T:' + wakeupBean?.thread + ' [ ' + wakeupBean?.tid + ' ]');
      strList.forEach((str, index) => {
        if (context !== null) {
          context.fillText(str, 40, 40 + 16 * index);
        }
      });
      context.lineWidth = 2;
      context.lineJoin = 'bevel';
      context.moveTo(10, 95);
      context.lineTo(20, 90);
      context.moveTo(10, 95);
      context.lineTo(20, 100);
      context.moveTo(10, 95);
      context.lineTo(80, 95);
      context.lineTo(70, 90);
      context.moveTo(80, 95);
      context.lineTo(70, 100);
      context.stroke();
      //绘制latency
      context.font = 12 + 'px sans-serif';
      context.fillText('Scheduling latency:' + getTimeString(wakeupBean?.schedulingLatency || 0), 90, 100);
      //绘制最下方提示语句
      context.font = 10 + 'px sans-serif';
      INPUT_WORD.split('\n').forEach((str, index) => {
        context?.fillText(str, 90, 120 + 12 * index);
      });
    }
  }

  private drawVerticalLine(context: CanvasRenderingContext2D): void {
    if (document.querySelector<SpApplication>('sp-application')!.dark) {
      context.strokeStyle = '#ffffff';
      context.fillStyle = '#ffffff';
    } else {
      context.strokeStyle = '#000000';
      context.fillStyle = '#000000';
    }
    context.lineWidth = 2;
    context.moveTo(10, 15);
    context.lineTo(10, 125);
    context.stroke();
  }

  transferString(str: string): string {
    let s = '';
    if (str.length === 0) {
      return '';
    }
    s = str.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/\'/g, '&#39;');
    s = s.replace(/\"/g, '&#quat;');
    return s;
  }

  initElements(): void {
    this.currentSelectionTbl = this.shadowRoot?.querySelector<LitTable>('#selectionTbl');
    this.wakeupListTbl = this.shadowRoot?.querySelector<LitTable>('#wakeupListTbl');
    this.scrollView = this.shadowRoot?.querySelector<HTMLDivElement>('#scroll_view');
    this.currentSelectionTbl?.addEventListener('column-click', (ev: unknown): void => { }); //@ts-ignore
    window.subscribe(window.SmartEvent.UI.WakeupList, (data: Array<WakeupBean>) => this.showWakeupListTableData(data));
  }

  showWakeupListTableData(data: Array<WakeupBean>): void {
    this.wakeupListTbl!.style.display = 'flex';
    let cpus: number[] = [];
    let itids: number[] = [];
    let ts: number[] = [];
    let maxPriority = 0;
    let maxPriorityDuration = 0;
    let maxDuration = 0;
    data.forEach((it) => {
      cpus.push(it.cpu!);
      itids.push(it.itid!);
      ts.push(it.ts!);
    });
    queryWakeupListPriority(itids, ts, cpus).then((res) => {
      let resource = data.map((it) => {
        let wake = {
          process: `${it.process}(${it.pid})`,
          thread: `${it.thread}(${it.tid})`,
          cpu: it.cpu,
          dur: it.dur,
          priority: 0,
          isSelected: false,
        };
        //@ts-ignore
        let find = res.find((re) => re.cpu === it.cpu && re.itid === it.itid && re.ts === it.ts);
        if (find) {
          //@ts-ignore
          wake.priority = find.priority;
        }
        maxDuration = Math.max(maxDuration, it.dur!);
        maxPriority = Math.max(maxPriority, wake.priority);
        return wake;
      });
      if (this.selectWakeupBean) {
        // 点击第一层唤醒树时向数组头部添加当前点击信息
        if (data[0].schedulingLatency) {
          // @ts-ignore
          resource.unshift(this.selectWakeupBean);
        }
        // @ts-ignore
        maxDuration = Math.max(maxDuration, this.selectWakeupBean.dur);
        // @ts-ignore
        maxPriority = Math.max(maxPriority, this.selectWakeupBean.priority);
      }
      resource.forEach((it) => {
        if (it.priority === maxPriority) {
          maxPriorityDuration = Math.max(it.dur || 0, maxPriorityDuration);
        }
      });
      this.updateTableSettings(maxPriority, maxPriorityDuration, maxDuration);
      this.wakeupListTbl!.style.display = 'flex';
      this.wakeupListTbl!.recycleDataSource = resource;
    });
  }

  private updateTableSettings(maxPriority: number, maxPriorityDuration: number, maxDuration: number): void {
    this.wakeupListTbl!.getItemTextColor = (data: unknown): string => {
      // @ts-ignore
      if ((data.priority === maxPriority && data.dur === maxPriorityDuration) || data.dur === maxDuration) {
        return '#f44336';
      } else {
        return '#262626';
      }
    };
  }

  addTableObserver(): void {
    let leftTable = this.shadowRoot?.querySelector('.table-left');
    this.tableObserver?.observe(leftTable!, {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: true,
    });
  }

  initHtml(): string {
    return TabPaneCurrentSelectionHtml;
  }
}

export class JankTreeNode {
  name: string = '';
  pid: number = -1;
  frameType: string = '';
  type: number = 0;

  constructor(name: string, pid: number, frameType: string) {
    this.name = name;
    this.pid = pid;
    this.frameType = frameType;
  }

  children: Array<JankTreeNode> = [];
}

export class ThreadTreeNode {
  tid: number = 0;
  pid: number = -1;
  startTime: number = 1;
  depth: number = 0;

  constructor(tid: number, pid: number, startTime: number, depth: number = 0) {
    this.tid = tid;
    this.pid = pid;
    this.startTime = startTime;
    this.depth = depth;
  }
}

class FunDetail {
  slice: string = '';
  CN: string = '';
  EN: string = '';
}

class SortData {
  value: string = '';
  dur: number = 0;
  bytes: number = 0;
}
