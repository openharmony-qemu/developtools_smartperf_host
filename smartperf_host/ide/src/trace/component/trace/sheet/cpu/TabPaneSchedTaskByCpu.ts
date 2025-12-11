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
import { SelectionParam } from '../../../../bean/BoxSelection';
import { getSchedTaskData, getProcessSchedTaskData } from '../../../../database/sql/Cpu.sql';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { taskList } from './../../../../database/data-trafic/utils/AllMemoryCache';


@element('tabpane-schedtask-cpu')
export class TabPaneSchedTaskByCpu extends BaseElement {
    private selectionParam: SelectionParam | null | undefined;
    private range: HTMLLabelElement | null | undefined;
    private stcTab: LitTable | null | undefined;
    private worker: Worker | undefined;
    set data(stcValue: SelectionParam) {
        if (stcValue === this.selectionParam) {
            return;
        }
        taskList.clear();
        this.range!.textContent =
            // @ts-ignore
            `Selected range: ${parseFloat(((stcValue.rightNs - stcValue.leftNs) / 1000000.0).toFixed(5))} ms`;
        this.handleRequest(stcValue)
    }

    private async handleRequest(schedTaskValue: SelectionParam) {
        let leftNS = schedTaskValue.leftNs + schedTaskValue.recordStartNs;
        let rightNS = schedTaskValue.rightNs + schedTaskValue.recordStartNs;
        let schedTaskData = null;
        if (schedTaskValue.processIds.length > 0) {
            schedTaskData = await getProcessSchedTaskData(leftNS, rightNS, schedTaskValue.processIds, schedTaskValue.threadIds);
        } else {
            schedTaskData = await getSchedTaskData(leftNS, rightNS);
        };
        taskList.set(0, schedTaskData);
        const args = {
            leftNs: schedTaskValue.leftNs,
            rightNs: schedTaskValue.rightNs,
            recordStartNS: schedTaskValue.recordStartNs,
            schedTaskData: schedTaskData
        }
        this.worker?.postMessage(args);

        // @ts-ignore
        this.worker.onmessage = (e: MessageEvent): void => {
            let result = e.data;
            this.dealProcessData(result);
            // @ts-ignore
            this.stcTab?.recycleDataSource = result;
        }
    }
    dealProcessData(data: Array<unknown>) {
        for (let i = 0; i < data.length; i++) {
            // @ts-ignore
            if (data[i].pid && !data[i].tid) {
                // @ts-ignore
                let pName = Utils.getInstance().getProcessMap().get(Number(data[i].pid)) ? Utils.getInstance().getProcessMap().get(Number(data[i].pid)) : 'Process';
                // @ts-ignore
                data[i].process = `${pName}[${data[i].pid}]`;
                // @ts-ignore
            } else if (data[i].pid && data[i].tid) {
                // @ts-ignore
                let tName = Utils.getInstance().getThreadMap().get(Number(data[i].tid)) ? Utils.getInstance().getThreadMap().get(Number(data[i].tid)) : 'Thread';
                // @ts-ignore
                data[i].process = `${tName}[${data[i].tid}]`;
            }// @ts-ignore
            if (data[i].children && data[i].children.length > 0) {
                // @ts-ignore
                this.dealProcessData(data[i].children);
            }
        }
    }

    initElements(): void {
        this.range = this.shadowRoot?.querySelector('#stc-time-range');
        this.stcTab = this.shadowRoot?.querySelector<LitTable>('#stc-tbl');
        this.worker = new Worker(new URL('../../../../database/ProcedureWorkerCPUSchedTask', import.meta.url));
    }

    connectedCallback(): void {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.stcTab!, 20);
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
            <label id="stc-time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
            <lit-table id="stc-tbl" style="height: auto" tree>
                <lit-table-column class="stc-column" width="27%" data-index="process" key="title" align="flex-start" title="Process/Thread" retract>
                </lit-table-column>
                <lit-table-column class="stc-column" width="1fr" data-index="count" key="count" align="flex-start" title="Count" tdJump>
                </lit-table-column>
            </lit-table>
            `;
    }
}