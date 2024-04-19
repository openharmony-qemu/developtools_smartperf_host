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
import { ColorUtils } from '../../base/ColorUtils';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-freq-limit')
export class TabPaneFreqLimit extends BaseElement {
  private freqLimitTbl: LitTable | null | undefined;

  set data(freqLimit: unknown) {
    if (freqLimit) {
      this.freqLimitTbl!.recycleDataSource = [
        {
          // @ts-ignore
          startNs: Utils.getTimeString(freqLimit.startNs >= 0 ? freqLimit.startNs : 0),
          // @ts-ignore
          absoluteTime: (freqLimit.startNs + (window as unknown).recordStartNS) / 1000000000,
          // @ts-ignore
          dur: Utils.getProbablyTime(freqLimit.dur),
          // @ts-ignore
          maxFreq: `${ColorUtils.formatNumberComma(freqLimit.max!)} kHz`,
          // @ts-ignore
          minFreq: `${ColorUtils.formatNumberComma(freqLimit.min!)} kHz`,
          // @ts-ignore
          cpu: `Cpu ${freqLimit.cpu}`,
        },
      ];
    }
  }

  initElements(): void {
    this.freqLimitTbl = this.shadowRoot?.querySelector<LitTable>('#tb-freq-limit');
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.freqLimitTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .freq-limit-table{
            height: auto;
        }
        :host{
            flex-direction: column;
            display: flex;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="tb-freq-limit" class="freq-limit-table">
            <lit-table-column class="freq-limit-column" width="1fr" title="StartTime(Relative)" data-index="startNs" key="startNs" align="flex-start">
            </lit-table-column>
            <lit-table-column class="freq-limit-column" width="1fr" title="StartTime(Absolute)" data-index="absoluteTime" key="absoluteTime" align="flex-start">
            </lit-table-column>
            <lit-table-column class="freq-limit-column" width="1fr" title="Duration" data-index="dur" key="dur" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="freq-limit-column" width="1fr" title="Cpu" data-index="cpu" key="cpu" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="freq-limit-column" width="1fr" title="Max Frequency" data-index="maxFreq" key="maxFreq" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="freq-limit-column" width="1fr" title="Min Frequency" data-index="minFreq" key="minFreq" align="flex-start" >
            </lit-table-column>
        </lit-table>
        `;
  }
}
