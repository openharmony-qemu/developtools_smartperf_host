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

import { BaseElement, element } from '../../../base-ui/BaseElement';

@element('table-no-data')
export class TableNoData extends BaseElement {
  static get observedAttributes(): string[] {
    return ['noData', 'contentWidth', 'height'];
  }

  private dataSlot: HTMLDivElement | null | undefined;
  private noDataIcon: HTMLDivElement | null | undefined;

  initElements(): void {
    this.dataSlot = this.shadowRoot!.querySelector<HTMLDivElement>('.no-data');
    this.noDataIcon = this.shadowRoot!.querySelector<HTMLDivElement>('.d-box');
  }

  get noData(): boolean {
    return this.hasAttribute('noData');
  }

  set noData(value: boolean) {
    if (value) {
      this.setAttribute('noData', '');
    } else {
      this.removeAttribute('noData');
    }
  }

  get contentWidth(): string {
    return this.getAttribute('contentWidth') || '100%';
  }
  set contentWidth(value) {
    this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.width = value;
    this.setAttribute('contentWidth', value);
  }
  get contentHeight(): string {
    return this.getAttribute('contentHeight') || '80%';
  }
  set contentHeight(value) {
    this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.height = value;
    this.setAttribute('contentHeight', value);
  }

  initHtml(): string {
    return `
        <style>
        :host {
            width: 100%;
            height: 100%;
            display: block;
        }
        :host(:not([noData])) .no-data{
            display: block;
            height: 100%;
            width: 100%;
        }
        :host([noData]) .no-data{
            display: none;
        }
        :host(:not([noData])) .d-box{
            display: none;
        }
        :host([noData]) .d-box{
            width: ${this.contentWidth};
            height: ${this.contentHeight};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        .no-data-icon{
            background-image: url("img/table_no_data.svg");
            width: 60%;
            height: 60%;
            min-height: 200px;
            min-width: 200px;
            background-size: 100% 100%;
        }
        .no-data-text{
            color: var(--dark-color1,#252525);
            opacity: 0.6;
            font-weight: 400;
        }
        </style>
        <slot class="no-data"></slot>
        <div class="d-box">
            <div class="no-data-icon"></div>
            <div class="no-data-text">Sorry, no data</div>
        </div>
        `;
  }
}
