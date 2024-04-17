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

@element('lit-icon')
export class LitIcon extends BaseElement {
  private view?: number;
  private icon: HTMLElement | undefined | null;
  private use: SVGUseElement | undefined | null;
  private d: SVGPathElement | undefined | null;
  private _name?: string;
  private _size?: number;
  private _color?: string;
  private _path?: string;

  static get observedAttributes(): string[] {
    return ['name', 'size', 'color', 'path'];
  }

  get name(): string {
    return this.getAttribute('name') || '';
  }

  set name(value: string) {
    this._name = value;
    this.setAttribute('name', value);
  }

  get size(): number {
    return parseInt(this.getAttribute('size') || '0', 10);
  }

  set size(value: number) {
    this._size = value;
    this.setAttribute('size', `${value}`);
  }

  set color(value: string) {
    this._color = value;
    this.setAttribute('color', value);
  }

  set path(value: string) {
    this._path = value;
    this.setAttribute('path', value);
  }

  initHtml(): string {
    return `
            <style>
                :host{
                    display: inline-block;
                    font-size: inherit;
                 }
                 .icon{
                    width: 1em;
                    height: 1em;
                    display: block;
                    fill: currentColor;
                    overflow: hidden;
                    margin: auto;
                 }
                 @keyframes rotate {
                    to{
                        transform: rotate(360deg);
                    }         
                 }
                 :host([spin]){
                    animation: rotate 1.75s linear infinite;
                 }
            </style>
            <svg class="icon" id="icon" aria-hidden="true" viewBox="0 0 ${this.view || 1024} ${this.view || 1024}">
                 ${this._path ? '<path id="path"></path>' : '<use id="use"></use>'}
            </svg>
            `;
  }

  initElements(): void {
    if (this.shadowRoot) {
      this.icon = this.shadowRoot.getElementById('icon');
      this.use = this.shadowRoot.querySelector('use');
      this.d = this.shadowRoot.querySelector('path');
    }
  }

  attributeChangedCallback(name: string, oldValue: string, value: string): void {
    switch (name) {
      case 'name':
        if (this.use) {
          this.use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `./base-ui/icon.svg#icon-${value}`);
        }
        break;
      case 'path':
        if (this.d) {
          this.d.setAttribute('d', value);
        }
        break;
      case 'color':
        if (this.icon) {
          this.icon.style.color = value as string;
        }
        break;
      case 'size':
        if (this.icon) {
          this.icon.style.fontSize = `${value}px`;
        }
        break;
    }
  }
}
