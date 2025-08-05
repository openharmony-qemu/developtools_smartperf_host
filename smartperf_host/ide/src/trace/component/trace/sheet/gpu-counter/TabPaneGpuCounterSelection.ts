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
import { GpuCounter, SelectionParam } from '../../../../bean/BoxSelection';
import { ns2x, Rect } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { TraceRow } from '../../base/TraceRow';
import { TraceSheet } from '../../base/TraceSheet';
import { Flag } from '../../timer-shaft/Flag';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-gpu-counter-selection')
export class TabPaneGpuCounterSelection extends BaseElement {
  private gpuCounterCounterTbl: LitTable | null | undefined;
  private clockCounterSource: Array<GpuCounter> = [];
  private traceSheetEl: TraceSheet | undefined | null;
  private spSystemTrace: SpSystemTrace | undefined | null;

  set data(gpuCounterValue: SelectionParam) {
    //@ts-ignore
    this.gpuCounterCounterTbl?.shadowRoot?.querySelector('.table')?.style?.height =
      this.parentElement!.clientHeight - 45 + 'px';
    this.getCounterData(gpuCounterValue).then();
  }

  async getCounterData(gpuCounterValue: SelectionParam): Promise<void> {
    let collect = gpuCounterValue.gpuCounter;
    let dataSource: Array<GpuCounter> = [];
    collect.forEach((it) => {
      let selectData = new GpuCounter();
      //@ts-ignore
      selectData.startNS = it.startNS;
      //@ts-ignore
      selectData.height = it.height;
      //@ts-ignore
      selectData.dur = it.dur;
      //@ts-ignore
      selectData.type = it.type;
      //@ts-ignore
      selectData.frame = it.frame;
      //@ts-ignore
      selectData.startTime = it.startTime;
      dataSource.push(selectData);
    });
    this.clockCounterSource = dataSource;
    this.gpuCounterCounterTbl!.recycleDataSource = dataSource;
  }

  initElements(): void {
    this.gpuCounterCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.spSystemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector<SpSystemTrace>('#sp-system-trace');
    this.traceSheetEl = this.spSystemTrace?.shadowRoot?.querySelector('.trace-sheet');
    this.gpuCounterCounterTbl!.addEventListener('column-click', (event) => {
      // @ts-ignore
      this.sortByColumn(event.detail.key, event.detail.sort);
    });
    this.addRowClickEventListener(this.gpuCounterCounterTbl!);
    this.gpuCounterCounterTbl?.addEventListener('mouseout', () => {
      this.refreshTable();
    });
  }

  refreshTable(): void {
    if (this.traceSheetEl) {
      this.traceSheetEl.systemLogFlag = undefined;
      this.spSystemTrace?.refreshCanvas(false);
    }
  }

  addRowClickEventListener(table: LitTable): void {
    table.addEventListener('row-hover', (evt) => {
      // @ts-ignore
      const data = evt.detail.data;
      if (data) {
        let pointX: number = ns2x(
          data.startNS - data.startTime || 0,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
        );
        this.traceSheetEl!.systemLogFlag = new Flag(
          Math.floor(pointX),
          0,
          0,
          0,
          data.startNS - data.startTime,
          '#666666',
          '',
          true,
          ''
        );
      }
      this.spSystemTrace?.refreshCanvas(false);
    });
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
            <lit-table-column order title="type" data-index="type" key="type"  align="flex-start" width="20%">
            </lit-table-column>
            <lit-table-column order title="timestamp(μs)" data-index="startNS" key="startNS"  align="flex-start" width="20%">
            </lit-table-column>
            <lit-table-column data-index="height" order title="value"  key="height"  align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(sortColumn: string, sortType: number): void {
    let key = sortColumn;
    let type = sortType;
    let arr = Array.from(this.clockCounterSource);
    arr.sort((gpuCounterLeftData, gpuCounterRightData): number => {
      if (key === 'startNS' || type === 0) {
        return (type === 1 ? 1 : -1) * (gpuCounterLeftData.startNS - gpuCounterRightData.startNS);
      } else if (key === 'height') {
        return (type === 1 ? 1 : -1) * (gpuCounterLeftData.height - gpuCounterRightData.height);
      } else {
        return 0;
      }
    });
    this.gpuCounterCounterTbl!.recycleDataSource = arr;
  }
}
