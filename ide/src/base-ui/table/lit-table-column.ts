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

@element('lit-table-column')
export class LitTableColumn extends HTMLElement {
  template: Element | undefined | null;
  private st: HTMLSlotElement | undefined | null;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
        <style>
        :host{
            overflow: auto;
            width: 100%;
         }
        </style>
        <slot id="slot"></slot>
        `;
  }

  static get observedAttributes() {
    return ['name', 'order'];
  }

  connectedCallback() {
    this.template = null;
    this.st = this.shadowRoot?.querySelector('#slot');
    this.st?.addEventListener('slotchange', () => {
      const elements = this.st!.assignedElements({ flatten: false });
      if (elements!.length > 0) {
        this.template = elements[0];
      }
    });
  }

  disconnectedCallback() {}

  adoptedCallback() {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {}
}
