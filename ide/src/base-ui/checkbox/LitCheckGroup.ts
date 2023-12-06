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
import { LitCheckBox } from './LitCheckBox';

@element('lit-check-group')
export class LitCheckGroup extends BaseElement {
  get direction() {
    return this.getAttribute('direction');
  }

  get value(): Array<string> {
    let checkGroupValues = [];
    for (const litCheckBoxElement of this.querySelectorAll<LitCheckBox>('lit-check-box[checked]')) {
      checkGroupValues.push(litCheckBoxElement.value);
    }
    return checkGroupValues;
  }

  initElements(): void {}

  connectedCallback() {}

  initHtml(): string {
    return `<style>   
        :host {
            display: -webkit-flex; 
            display: flex;
            flex-direction: column;
        }
        :host(:not([direction])) {
            flex-direction: column;
        }
        :host([direction]) {
            flex-direction: ${this.direction};
        }
        :host([layout="dispersion"]) {
           gap:10px;
        }
        :host([layout="compact"]) {
            gap:5px;
        }
        </style>
        <slot class="check-group"></slot>`;
  }
}
