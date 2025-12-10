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
import { BoxJumpParam } from '../../../../bean/BoxSelection';
import { taskList } from '../../../../database/data-trafic/utils/AllMemoryCache';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-box-schedtask-child')

export class TabPaneSchedTaskChild extends BaseElement{

    private taskChildParam: BoxJumpParam | null | undefined;
    private boxChildRange: HTMLLabelElement | null | undefined;
    boxChildTbl: LitTable | null | undefined;

    set data(taskChildValue: BoxJumpParam){
        //切换Tab页 保持childTab数据不变 除非重新点击跳转
    if (taskChildValue === this.taskChildParam || !taskChildValue.isJumpPage) {
        return;
      }
      this.taskChildParam = taskChildValue;
      //显示框选范围对应的时间
    this.boxChildRange!.textContent = `Selected range: ${parseFloat(
        ((taskChildValue.rightNs - taskChildValue.leftNs) / 1000000.0).toFixed(5)
      )} ms`;
      let schedTaskList = taskList.get(0);
      this.boxChildTbl!.recycleDataSource = this.filterSourceData(taskChildValue,schedTaskList);
    }
    filterSourceData(val: BoxJumpParam, schedTaskList:unknown[] | undefined): Array<unknown>{
        let recordStartNs = Utils.getInstance().getRecordStartNS(Utils.currentSelectTrace);
        let resultList = [];
        if(val.threadId === null){
            // @ts-ignore
            resultList = schedTaskList?.filter((item) => item.pid === val.processId);
        }else{
            // @ts-ignore
            resultList = schedTaskList?.filter((item) => item.pid === val.processId && item.tid === val.threadId);
        }
        if(resultList.length > 0){
            resultList.forEach((item) => {
                item.sTime = Utils.getTimeString(item.startTime - recordStartNs);
                item.absoluteTime = item.startTime / 1000000000;
                item.processName = Utils.getInstance().getProcessMap().get(Number(item.pid))?`${Utils.getInstance().getProcessMap().get(Number(item.pid))}[${item.pid}]`:`process[${item.pid}]`;
                item.threadName = Utils.getInstance().getThreadMap().get(Number(item.tid))?`${Utils.getInstance().getThreadMap().get(Number(item.tid))}[${item.tid}]`:`Thread[${item.tid}]`;
            })
        }
        return resultList
    }
    initElements(): void{
        this.boxChildTbl = this.shadowRoot?.querySelector<LitTable>('#tb-task-list');
        this.boxChildRange = this.shadowRoot?.querySelector('#time-range');
    }

    connectedCallback(): void {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.boxChildTbl!, 20);
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
            <lit-table id="tb-task-list" style="height: auto">
              <lit-table-column order title="StartTime(Relative)" width="15%" data-index="sTime" key="sTime" align="flex-start" >
              </lit-table-column>
              <lit-table-column order title="StartTime(Absolute)" width="15%" data-index="absoluteTime" key="absoluteTime" align="flex-start" >
              </lit-table-column>
              <lit-table-column order width="15%" data-index="processName" key="processName" title="Process">
              </lit-table-column>
              <lit-table-column order width="15%" data-index="threadName" key="threadName" title="Thread">
              </lit-table-column>
              <lit-table-column order width="1fr" data-index="interval" key="interval" title="interval">
              </lit-table-column>
              <lit-table-column order width="1fr" data-index="curr_mono" key="curr_mono" align="flex-start" title="curr_mono">
              </lit-table-column>
              <lit-table-column order width="1fr"data-index="expire_mono"  title="expire_mono" key="expire_mono" align="flex-start" >
              </lit-table-column>
            </lit-table>
            `;
      }
}