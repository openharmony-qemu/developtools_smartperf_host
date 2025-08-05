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

import { BaseElement, element } from '../BaseElement';

@element('lit-popover-title')
export class LitPopoverTitle extends BaseElement {
  private titleText: HTMLElement | null | undefined;

  static get observedAttributes(): string[] {
    return ['title'];
  }

  initElements(): void {
    this.titleText = this.shadowRoot?.querySelector('.pop-title');
  }

  initHtml(): string {
    return `
        <style>
           .pop-title{
               font-family: Helvetica,serif;
               font-size: 14px;
               opacity: 0.6;
               color: #000000;
               text-align: left;
               line-height: 14px; 
               font-weight: 400;
               padding-bottom: 5px;
           }
        </style>
        <div class="pop-title"></div>
        `;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    switch (name) {
      case 'title':
        if (this.titleText) {
          this.titleText.textContent = newValue;
        }
        break;
      default:
        break;
    }
  }
}
