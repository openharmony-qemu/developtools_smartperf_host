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

@element('tab-progress-bar')
export class TabProgressBar extends BaseElement {
  initElements(): void {
    let data: Array<string> = this.getAttribute('data')!.split(',');
    let first: HTMLDivElement | undefined | null = this.shadowRoot?.querySelector<HTMLDivElement>('#first');
    let second: HTMLDivElement | undefined | null = this.shadowRoot?.querySelector<HTMLDivElement>('#second');
    if (data!.length > 0 && data && data![2] != '0') {
      if (parseInt(data[0]) < 0) {
        first!.style.width = Number((Math.abs(parseInt(data[0])) / parseInt(data[2])) * 100).toFixed(2) + '%';
        first!.style.background = '#FC74FF';
      } else {
        first!.style.width = Number((parseInt(data[0]) / parseInt(data[2])) * 100).toFixed(2) + '%';
      }
      if (parseInt(data[1]) < 0) {
        second!.style.width = Number((Math.abs(parseInt(data[1])) / parseInt(data[2])) * 100).toFixed(2) + '%';
        first!.style.background = '#CC34CF';
      } else {
        second!.style.width = Number((parseInt(data[1]) / parseInt(data[2])) * 100).toFixed(2) + '%';
      }
    }
  }

  initHtml(): string {
    return `
        <style>
        :host{
        width: 100%;height: 15px;display: flex;
        }
        </style>
        <div style="width: 0%;background: #AC49F5;" id="first">
        </div>
        <div style="width: 0%;background: #8D32FF;" id="second">
        </div>
        `;
  }
}
