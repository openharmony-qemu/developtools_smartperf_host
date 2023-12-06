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
import { LitTabs } from './lit-tabs';

@element('lit-tabpane')
export class LitTabpane extends BaseElement {
  static get observedAttributes() {
    return ['tab', 'key', 'disabled', 'icon', 'closeable', 'hidden'];
  }

  get tab() {
    return this.getAttribute('tab');
  }

  set tab(value) {
    this.setAttribute('tab', value || '');
  }

  get icon() {
    return this.getAttribute('icon');
  }

  get disabled() {
    return this.getAttribute('disabled') !== null;
  }

  set disabled(value) {
    if (value === null || value === false) {
      this.removeAttribute('disabled');
    } else {
      this.setAttribute('disabled', value + '');
    }
  }

  get hidden() {
    return this.getAttribute('hidden') !== null;
  }

  set hidden(value) {
    this.setAttribute('hidden', `${value}`);
  }

  get closeable() {
    return this.getAttribute('closeable') !== null;
  }

  set closeable(value) {
    if (value === null || value === false) {
      this.removeAttribute('closeable');
    } else {
      this.setAttribute('closeable', value + '');
    }
  }

  get key() {
    return this.getAttribute('key') || '';
  }

  set key(value) {
    this.setAttribute('key', value);
  }

  initElements(): void {}

  initHtml(): string {
    return `
        <style>
        :host(){
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            overflow: auto;
            width: 100%;
        }
        </style>
        <slot></slot>
        `;
  }

  connectedCallback() {}

  disconnectedCallback() {}

  adoptedCallback() {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && newValue !== undefined) {
      if (name === 'tab' && this.parentNode && this.parentNode instanceof LitTabs) {
        this.parentNode.updateLabel && this.parentNode.updateLabel(this.key, newValue);
      }
      if (name === 'disabled' && this.parentNode && this.parentNode instanceof LitTabs) {
        this.parentNode.updateDisabled && this.parentNode.updateDisabled(this.key, newValue);
      }
      if (name === 'closeable' && this.parentNode && this.parentNode instanceof LitTabs) {
        this.parentNode.updateCloseable && this.parentNode.updateCloseable(this.key, newValue);
      }
      if (name === 'hidden' && this.parentNode && this.parentNode instanceof LitTabs) {
        this.parentNode.updateHidden && this.parentNode.updateHidden(this.key, newValue);
      }
    }
  }
}
