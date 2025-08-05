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
import { GpuCounter } from '../../../../bean/BoxSelection';
import { GpuCounterStruct } from '../../../../database/ui-worker/ProcedureWorkerGpuCounter';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-gpu-counter')
export class TabPaneGpuCounter extends BaseElement {
  private gpuCounterCounterTbl: LitTable | null | undefined;
  private clockCounterSource: Array<GpuCounter> = [];

  set data(clickData: GpuCounterStruct) {
    //@ts-ignore
    this.gpuCounterCounterTbl?.shadowRoot?.querySelector('.table')?.style?.height =
      this.parentElement!.clientHeight - 45 + 'px';
    this.getCounterData(clickData).then();
  }

  async getCounterData(clickData: GpuCounterStruct): Promise<void> {
    let dataSource: Array<GpuCounter> = [];
    let selectData = new GpuCounter();
    selectData.startNS = clickData.startNS!;
    selectData.height = clickData.height!;
    selectData.dur = clickData.dur!;
    selectData.type = clickData.type!;
    selectData.frame = clickData.frame!;
    selectData.startTime = clickData.startTime!;
    dataSource.push(selectData);
    this.clockCounterSource = dataSource;
    this.gpuCounterCounterTbl!.recycleDataSource = dataSource;
  }

  initElements(): void {
    this.gpuCounterCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
  }



  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.gpuCounterCounterTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .gpu-counter-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-counter" style="height: auto">
            <lit-table-column order title="timestamp" data-index="startNS" key="startNS"  align="flex-start" width="20%">
            </lit-table-column>
            <lit-table-column data-index="height" order title="value"  key="height"  align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }
}
