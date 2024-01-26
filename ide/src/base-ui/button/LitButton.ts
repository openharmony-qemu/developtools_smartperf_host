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

@element('lit-button')
export class LitButton extends BaseElement {
  private slotHtml: HTMLElement | undefined;
  private button: HTMLButtonElement | null | undefined;
  private litIcon: LitButton | null | undefined;

  static get observedAttributes() {
    return [
      'text',
      'back',
      'icon',
      'height',
      'width',
      'color',
      'font_size',
      'border',
      'padding',
      'justify_content',
      'border_radius',
      'margin_icon',
      'opacity',
    ];
  }

  get text() {
    return this.getAttribute('text') || '';
  }

  set text(text: string) {
    this.setAttribute('text', text);
  }

  get back() {
    return this.getAttribute('back') || '';
  }

  set back(backColor: string) {
    this.button!.style.backgroundColor = backColor;
    this.setAttribute('back', backColor);
  }

  get icon() {
    return this.getAttribute('icon') || '';
  }

  set icon(icon: string) {
    this.litIcon?.setAttribute('name', icon);
    this.setAttribute('icon', icon);
    if (icon) {
      this.litIcon!.style.display = 'block';
    }
  }

  get height() {
    return this.getAttribute('height') || '';
  }

  set height(height: string) {
    this.setAttribute('height', height);
  }

  get width() {
    return this.getAttribute('width') || '';
  }

  set width(width: string) {
    this.setAttribute('width', width);
  }

  set color(color: string) {
    this.setAttribute('color', color);
  }

  set font_size(fontSize: string) {
    this.setAttribute('font_size', fontSize);
  }

  set border(border: string) {
    this.setAttribute('border', border);
  }

  set padding(padding: string) {
    this.setAttribute('padding', padding);
  }

  set justify_content(justifyContent: string) {
    this.setAttribute('justify_content', justifyContent);
  }

  set border_radius(borderRadius: string) {
    this.setAttribute('border_radius', borderRadius);
  }

  set margin_icon(value: string) {
    this.litIcon?.setAttribute('margin_icon', value);
  }

  set opacity(value: string) {
    this.litIcon?.setAttribute('opacity', value);
  }

  set hidden(hidden: boolean) {
    if (hidden) {
      this.setAttribute('hidden', 'true');
      this.style.display = 'none';
    } else {
      this.removeAttribute('hidden');
      this.style.display = 'block';
    }
  }

  initHtml(): string {
    return `
        ${this.initHtmlStyle()}
        <div id='custom-div'>
                <button id="custom-button" type="button">
                    <slot id="sl" tyle= "padding: 10px"></slot>
                    <lit-icon id="button-icon" name="" size="18" style= "margin-left: 10px" color="var(--dark-color1,#4D4D4D)"></lit-icon>
                 </button>
            </div>
            `;
  }

  private initHtmlStyle(): string {
    return `
    <style>
        :host{ 
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
            background: background: var(--dark-background3,#FFFFFF);
        }
        
        #custom-button{ 
            display: flex;
            flex-direction: row;
            align-items: center;
            align-content: center;
            justify-content: right;
            cursor: pointer;
            color: var(--dark-background3,#FFFFFF);
            background: var(--dark-background3,#FFFFFF);
            border: 2px solid #409eff;
            border-radius: 20px;
            padding: 15px;
            transition: opacity 0.2s;
            outline: none;
            position: relative;
         }
            #custom-button::before {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 100%;
              height: 100%;
              background-color: #000;
              border: inherit;
              border-color: #000;
              border-radius: inherit;
              transform: translate(-50%, -50%);
              opacity: 0;
              content: ' ';
            }
            #custom-button:active::before {
              opacity: 0.1;
            }
        </style>
    `
  }

  initElements(): void {
    this.slotHtml = this.shadowRoot?.querySelector('#sl') as HTMLElement;
    this.button = this.shadowRoot?.querySelector('#custom-button');
    this.litIcon = this.shadowRoot?.querySelector('#button-icon') as LitButton;
    if (this.litIcon.getAttribute('name') == '') {
      this.litIcon!.style.display = 'none';
    }
  }

  attributeChangedCallback(name: string, oldValue: string, value: string) {
    switch (name) {
      case 'text':
        this.slotHtml!.innerText = value;
        break;
      case 'back':
        this.button!.style.backgroundColor = value;
        break;
      case 'icon':
        this.litIcon?.setAttribute('name', value);
        if (value) {
          this.litIcon!.style.display = 'block';
        }
        break;
      case 'height':
        this.button!.style.height = value;
        break;
      case 'color':
        this.button!.style.color = value;
        break;
      case 'font_size':
        this.button!.style.fontSize = value;
        break;
      case 'border':
        this.button!.style.border = value;
        break;
      case 'padding':
        this.button!.style.padding = value;
        break;
      case 'justify_content':
        this.button!.style.justifyContent = value;
        break;
      case 'border_radius':
        this.button!.style.borderRadius = value;
        break;
      case 'margin_icon':
        this.litIcon!.style.margin = value;
        break;
      case 'opacity':
        this.button!.style.opacity = value;
        break;
    }
  }
}
