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
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { BoxJumpParam, SelectionData } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { sliceChildBoxSender, threadNearData } from '../../../../database/data-trafic/SliceSender';
import { queryThreadStateArgsBatch } from '../../../../database/sql/ProcessThread.sql';
import { BinderArgBean } from '../../../../bean/BinderArgBean';

@element('tabpane-box-child')
export class TabPaneBoxChild extends BaseElement {
  private boxChildTbl: LitTable | null | undefined;
  private boxChildRange: HTMLLabelElement | null | undefined;
  private boxChildSource: Array<unknown> = [];
  private boxChildParam: BoxJumpParam | null | undefined;

  set data(boxChildValue: BoxJumpParam) {
    //切换Tab页 保持childTab数据不变 除非重新点击跳转
    if (boxChildValue === this.boxChildParam || !boxChildValue.isJumpPage) {
      return;
    } // @ts-ignore
    this.boxChildParam = boxChildValue;
    //显示框选范围对应的时间
    this.boxChildRange!.textContent = `Selected range: ${parseFloat(
      ((boxChildValue.rightNs - boxChildValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.boxChildTbl!.recycleDataSource = [];
    this.boxChildTbl!.loading = true;
    this.getDataByDB(boxChildValue);
  }

  initElements(): void {
    this.boxChildTbl = this.shadowRoot?.querySelector<LitTable>('#tb-cpu-thread');
    this.boxChildRange = this.shadowRoot?.querySelector('#time-range');
    this.boxChildTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    //监听row的点击事件，在对应起始时间上画标记棋子
    this.boxChildTbl!.addEventListener('row-click', (evt): void => {
      //@ts-ignore
      let param = evt.detail.data;
      param.isSelected = true;
      this.boxChildTbl!.clearAllSelection(param);
      this.boxChildTbl!.setCurrentSelection(param);
      document.dispatchEvent(
        new CustomEvent('triangle-flag', {
          detail: { time: [param.startTime], type: 'triangle' },
        })
      );
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.boxChildTbl!);
  }

  // 处理next_info的展示
  parseSchedSwitchHmNew(num: bigint): string {
    // 将数字拆分为高32位和低32位
    // @ts-ignore
    const low = Number(num & 0xFFFFFFFFn);
    // @ts-ignore
    const high = Number((num >> 32n) & 0xFFFFFFFFn);

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

  async getDataByDB(val: BoxJumpParam): Promise<void> {
    sliceChildBoxSender('state-box', val.leftNs, val.rightNs, val.threadId!, val.processId!,
      val.cpus, val.state, val.traceId!).then(async (result: unknown): Promise<void> => {
        // @ts-ignore
        if (result.length !== null && result.length > 0) {
          // @ts-ignore
          const argSetIds = result.filter((e: unknown) => e!.argSetId && e!.state === 'Running').map((e: unknown) => e!.argSetId);

          const argsMap = new Map<number, BinderArgBean[]>();
          if (argSetIds.length > 0) {
            const argsList = await queryThreadStateArgsBatch(argSetIds);
            argsList.forEach((arg: BinderArgBean) => {
              // @ts-ignore
              if (!argsMap.has(arg.argset)) {
                // @ts-ignore
                argsMap.set(arg.argset, []);
              }
              // @ts-ignore
              argsMap.get(arg.argset)!.push(arg);
            });
          }

          // @ts-ignore
          const processedResult = result.map((e: unknown) => {
            // 获取优先级数据
            // @ts-ignore
            let prioObj = Utils.getInstance().getSchedSliceMap().get(`${e.id}-${e.startTime}`);
            // thread statesTab页 dur截取的问题 与thread states保持一致
            if (val.currentId === 'box-thread-states') {
              // @ts-ignore
              if (e.startTime < val.leftNs && (e.startTime + e.dur) < val.rightNs) {
                // @ts-ignore
                e.dur = (e.startTime + e.dur) - val.leftNs;
                // @ts-ignore
              } else if ((e.startTime + e.dur) > val.rightNs && e.startTime > val.leftNs) {
                // @ts-ignore
                e.dur = val.rightNs - e.startTime;
                // @ts-ignore
              } else if (e.startTime < val.leftNs && (e.startTime + e.dur) > val.rightNs) {
                // @ts-ignore
                e.dur = val.rightNs - val.leftNs;
              }
            }
            // @ts-ignore
            if (e!.argSetId && e!.state === 'Running') {
              // @ts-ignore
              const args = argsMap.get(e!.argSetId);
              // @ts-ignore
              if (args && args.length > 0) {
                // @ts-ignore
                let argStrArr = this.parseSchedSwitchHmNew(BigInt(args[0].strValue)).split(',');
                // @ts-ignore
                e.affinity = argStrArr[0];
                // @ts-ignore
                e.schedSub = argStrArr[2];
                // @ts-ignore
                e.cGroup = argStrArr[5];
              }
            }
            // @ts-ignore
            e.sTime = Utils.getTimeString(e.startTime);
            // @ts-ignore
            e.absoluteTime = ((window as unknown).recordStartNS + e.startTime) / 1000000000;
            // @ts-ignore
            e.state = Utils.getEndState(e.state)!;
            // @ts-ignore
            e.duration = e.dur / 1000000;
            // @ts-ignore
            e.prior = prioObj ? prioObj.priority : '-';
            // @ts-ignore
            e.core = e.cpu === undefined || e.cpu === null ? '-' : `CPU${e.cpu}`;
            // @ts-ignore
            let processInfo: string | undefined = Utils.getInstance().getProcessMap().get(e.pid);
            // @ts-ignore
            e.processName = `${processInfo === undefined || processInfo === null ? 'process' : processInfo}[${e.pid}]`;
            // @ts-ignore
            let threadInfo: string | undefined = Utils.getInstance().getThreadMap().get(e.tid);
            // @ts-ignore
            e.threadName = `${threadInfo === undefined || threadInfo === null ? 'thread' : threadInfo}[${e.tid}]`;
            // @ts-ignore
            e.note = '-';
            return e;
          });
          this.boxChildSource = processedResult;

          if (this.boxChildTbl) {
            // @ts-ignore
            this.boxChildTbl.recycleDataSource = processedResult;
          }
          this.boxChildTbl!.loading = false;
        } else {
          this.boxChildSource = [];
          if (this.boxChildTbl) {
            // @ts-ignore
            this.boxChildTbl.recycleDataSource = [];
          }
          this.boxChildTbl!.loading = false;
        }
      });
  }

  initHtml(): string {
    return `
        <style>
        .box-child-label{
          text-align: end;
          width: 100%;
          height: 20px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="box-child-label" style="font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="tb-cpu-thread" style="height: auto">
          <lit-table-column order title="StartTime(Relative)" width="15%" data-index="sTime" key="sTime" align="flex-start" >
          </lit-table-column>
          <lit-table-column order title="StartTime(Absolute)" width="15%" data-index="absoluteTime" key="absoluteTime" align="flex-start" >
          </lit-table-column>
          <lit-table-column order width="10%" data-index="processName" key="processName" title="Process" align="flex-start" >
          </lit-table-column>
          <lit-table-column order width="10%" data-index="threadName" key="threadName" align="flex-start" title="Thread">
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="duration" key="duration" title="duration(ms)" align="flex-start" >
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="state" key="state" align="flex-start" title="State">
          </lit-table-column>
          <lit-table-column order width="1fr"data-index="core"  title="Core" key="core" align="flex-start" >
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="prior" title="Priority" key="prior" align="flex-start" >
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="note" key="note" align="flex-start" title="Note">
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="affinity" key="affinity" align="flex-start" title="Affinity">
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="schedSub" key="schedSub" align="flex-start" title="SchedSub">
          </lit-table-column>
          <lit-table-column order width="1fr" data-index="cGroup" key="cGroup" align="flex-start" title="Cgroup">
          </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (boxChildLeftData: SelectionData, boxChildRightData: SelectionData): number {
        if (type === 'number') {
          return sort === 2
            // @ts-ignore
            ? parseFloat(boxChildRightData[property]) - parseFloat(boxChildLeftData[property])
            // @ts-ignore
            : parseFloat(boxChildLeftData[property]) - parseFloat(boxChildRightData[property]);
        } else {
          // @ts-ignore
          if (boxChildRightData[property] > boxChildLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (boxChildRightData[property] === boxChildLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }

    // @ts-ignore
    this.boxChildSource.sort(compare(detail.key, detail.sort, 'string'));
    this.boxChildTbl!.recycleDataSource = this.boxChildSource;
  }
}
