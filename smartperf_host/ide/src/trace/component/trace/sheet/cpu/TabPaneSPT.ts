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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SliceGroup } from '../../../../bean/StateProcessThread';
import { resizeObserver } from '../SheetUtils';
import { Utils } from '../../base/Utils';
import { sliceSPTSender } from '../../../../database/data-trafic/SliceSender';

@element('tabpane-spt')
export class TabPaneSPT extends BaseElement {
  private sptTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private selectionParam: SelectionParam | null | undefined;

  set data(sptValue: SelectionParam | unknown) {
    if (sptValue === this.selectionParam) {
      return;
    }
    // @ts-ignore
    this.selectionParam = sptValue;
    if (this.sptTbl) {
      // @ts-ignore
      this.sptTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45}px`;
    }
    this.range!.textContent =
      // @ts-ignore
      `Selected range: ${parseFloat(((sptValue.rightNs - sptValue.leftNs) / 1000000.0).toFixed(5))} ms`;
    // @ts-ignore
    this.getDataBySPT(sptValue.leftNs, sptValue.rightNs, sptValue.cpus, sptValue.traceId);
  }

  initElements(): void {
    this.sptTbl = this.shadowRoot?.querySelector<LitTable>('#spt-tbl');
    this.range = this.shadowRoot?.querySelector('#spt-time-range');
    this.sptTbl!.itemTextHandleMap.set('title', Utils.transferPTSTitle);
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.sptTbl!);
  }

  getDataBySPT(leftNs: number, rightNs: number, cpus: Array<number>, traceId?: string): void {
    this.sptTbl!.loading = true;
    sliceSPTSender(leftNs, rightNs, cpus, 'spt-getSPT', traceId).then((res): void => {
      this.sptTbl!.loading = false;
      this.sptTbl!.recycleDataSource = res;
      //@ts-ignore
      this.theadClick(res);
    });
  }

  private theadClick(data: Array<SliceGroup>): void {
    let labels = this.sptTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (): void => {
          if (label.includes('State') && i === 0) {
            this.sptTbl!.setStatus(data, false);
            this.sptTbl!.recycleDs = this.sptTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Process') && i === 1) {
            this.sptTbl!.setStatus(data, false, 0, 1);
            this.sptTbl!.recycleDs = this.sptTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Thread') && i === 2) {
            this.sptTbl!.setStatus(data, true);
            this.sptTbl!.recycleDs = this.sptTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
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
        <label id="spt-time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="spt-tbl" style="height: auto" tree>
            <lit-table-column class="spt-column" width="27%" data-index="title" key="title" align="flex-start" title="State/Process/Thread" retract>
            </lit-table-column>
            <lit-table-column class="spt-column" width="1fr" data-index="count" key="count" align="flex-start" title="Count" tdJump>
            </lit-table-column>
            <lit-table-column class="spt-column" width="1fr" data-index="wallDuration" key="wallDuration" align="flex-start" title="Duration(ns)">
            </lit-table-column>
            <lit-table-column class="spt-column" width="1fr" data-index="minDuration" key="minDuration" align="flex-start" title="Min Duration(ns)">
            </lit-table-column>
            <lit-table-column class="spt-column" width="1fr" data-index="avgDuration" key="avgDuration" align="flex-start" title="Avg Duration(ns)">
            </lit-table-column>
            <lit-table-column class="spt-column" width="1fr" data-index="maxDuration" key="maxDuration" align="flex-start" title="Max Duration(ns)">
            </lit-table-column>
        </lit-table>
        `;
  }
}
