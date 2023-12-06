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
import { LitRadioBox } from './LitRadioBox';

@element('lit-radio-group')
export class LitRadioGroup extends BaseElement {
  static get observedAttributes() {
    return ['direction'];
  }

  set layout(vale: string) {
    this.setAttribute('layout', vale);
  }

  get direction() {
    return this.getAttribute('direction');
  }

  get value(): Array<string> {
    const radio = this.querySelector('lit-radio[checked]') as LitRadioBox;
    return radio ? [radio.value] : [];
  }

  initElements(): void {}

  //方向
  initHtml(): string {
    return `
        <style>   
        :host([direction]) {
            flex-direction: ${this.direction};
        }
        :host {
            display: -webkit-flex; 
            display: flex;
            flex-direction: column;
        }
        :host([layout="compact"]) {
            gap:5px;
        }
        :host([layout="dispersion"]) {
           gap:10px;
        }
        :host(:not([direction])) {
            flex-direction: column;
        }
        </style>
        <slot class="radio-group"></slot>`;
  }
}
