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

@element('lit-pop-content')
export class LitPopContent extends BaseElement {
  static get observedAttributes() {
    return ['open'];
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    if (value === null || !value) {
      this.removeAttribute('open');
      let parentElement = this.parentNode as Element;
      parentElement?.removeAttribute('open');
    } else {
      this.setAttribute('open', '');
      let parentElement = this.parentNode as Element;
      parentElement?.setAttribute('open', '');
    }
  }

  initElements(): void {}

  initHtml(): string {
    return `
        <style>
        :host{
            font-family: Helvetica,serif;
            position:absolute;
            display:flex;
            background:#ffffff;
            box-shadow: -2px 0 3px -1px white, 0 -2px 3px -1px white, 0 2px 3px -1px white, 2px 0 3px -1px white;
            box-sizing: border-box;
            border-radius: 5px;
            transition:0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            transform:scale(0);
            transform-origin:inherit;
            visibility:hidden;
            z-index:10;
    
        }
        .pop-content-body{
            display:flex;
            flex:1;
            padding: 20px;
            flex-direction:column;
            width: max-content;
            box-sizing: border-box;
            border: 1px solid #000000;
        }
        </style>
        <div class="pop-content-body" >
            <slot></slot>
        </div>
        `;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'open':
        if (newValue === null || newValue === 'false') {
          let parentElement = this.parentNode as Element;
          parentElement?.removeAttribute('open');
        } else {
          let parentElement = this.parentNode as Element;
          parentElement?.setAttribute('open', '');
        }
        break;
      default:
        break;
    }
  }
}
