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

import { element } from '../BaseElement';

@element('lit-table-group')
export class LitTableGroup extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
        <style>
        :host{ }
        </style>
        <slot id="sl"></slot>
        `;
  }

  static get observedAttributes(): string[] {
    return ['title'];
  }

  get title(): string {
    return this.getAttribute('title') || '';
  }

  set title(value: string) {
    this.setAttribute('title', value);
  }

  connectedCallback(): void {}

  disconnectedCallback(): void {}

  adoptedCallback(): void {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {}
}
