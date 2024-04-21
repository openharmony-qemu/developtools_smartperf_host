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
import { replacePlaceholders } from '../utils/Template';

let css = `
<style>
      :host{
          display: flex;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 2001;
          pointer-events: none;
       }
       :host([mask]) .bg{
          position:absolute;
          top: 0;
          right: 0;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background-color: #00000055;
       }
       :host(:not([mask])) .bg{
          display: none;
       }
       .title{
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: var(--dark-border1,#f0f0f0) 1px solid;
          font-size: 18px;
          font-weight: bold;
          color: var(--dark-color1,#262626);
       }
       slot{
          padding: {1};
          display: block;
       }
       :host([visible]) .bg{
          transition: all .3s;
          opacity: 1;
          visibility: visible;
       }
       :host(:not([visible])) .bg{
          transition: all .3s;
          opacity: 0;
          visibility: hidden;
       }
       /*
          right（默认）
       */
       :host(:not([placement])) .drawer,
       :host([placement='right']) .drawer{
          width: {2};
          box-sizing: border-box;
          position: absolute;
          display: flex;
          flex-direction: column;
          right: 0px;
          top: 0px;
          bottom: 0px;
          height: 100%;
          overflow: auto;
          background-color: var(--dark-background,#FFFFFF);
          -webkit-transform: translateZ(0);
          -moz-transform: translateZ(0);
          -ms-transform: translateZ(0);
          -o-transform: translateZ(0);
          transform: translateZ(0);
          transform: translateX(100%);
          transition: transform .3s;
       }
       :host(:not([placement])[visible]) .drawer,
       :host([placement='right'][visible]) .drawer{
          transform: translateX(0%);
          box-shadow: 0px 0 20px 0px #00000055;
       }
       :host(:not([visible]):not([placement])) .drawer,
       :host(:not([visible])[placement='right']) .drawer{
          transform: translateX(100%);
       }
       /*
          左边
       */
       :host([placement='left']) .drawer{
          width: {2};
          box-sizing: border-box;
          position: absolute;
          display: flex;
          flex-direction: column;
          left: 0px;
          top: 0px;
          bottom: 0px;
          right: auto;
          height: 100%;
          background-color: var(--dark-background,#FFFFFF);
          webkit-transform: translate3d(0,0,0);
          -moz-transform: translate3d(0,0,0);
          -ms-transform: translate3d(0,0,0);
          -o-transform: translate3d(0,0,0);
          transform: translate3d(0,0,0);
          transform: translate(0%,0%);
       }
       :host([placement='left']) .drawer{
          transition: transform .3s;
       }
       :host([placement='left'][visible]) .drawer{
          box-shadow: 0px 0 60px 0px #00000055;
          transform: translate(0%,0%);
       }
       :host(:not([visible])[placement='left']) .drawer{
          transform: translate(-100%,0%);
       }
       
       /*
          top
       */
       :host([placement='top']) .drawer{
          box-sizing: border-box;
          position: absolute;
          display: flex;
          flex-direction: column;
          left: 0px;
          top: 0px;
          right: 0px;
          width: 100%;
          background-color: var(--dark-background,#FFFFFF);
          webkit-transform: translate3d(0,0,0);
          -moz-transform: translate3d(0,0,0);
          -ms-transform: translate3d(0,0,0);
          -o-transform: translate3d(0,0,0);
          transform: translate3d(0,0,0);
       }
       :host([placement='top']) .drawer{
          transform: translateY(-100%);
          transition: transform .3s;
       }
       :host([placement='top'][visible]) .drawer{
          box-shadow: 0px 0 60px 0px #00000055;
          transform: translateY(0%);
       }
       :host(:not([visible])[placement='top']) .drawer{
          transform: translateY(-100%);
       }
       
       /*
          bottom
       */
       :host([placement='bottom']) .drawer{
          box-sizing: border-box;
          position: absolute;
          display: flex;
          flex-direction: column;
          left: 0px;
          bottom: 0px;
          right: 0px;
          top: auto;
          width: 100%;
          background-color: var(--dark-background,#FFFFFF);
          webkit-transform: translate3d(0,0,0);
          -moz-transform: translate3d(0,0,0);
          -ms-transform: translate3d(0,0,0);
          -o-transform: translate3d(0,0,0);
          transform: translate3d(0,0,0);
          transform: translate(0%,0%);
          transition: transform .3s;
       }
       :host([placement='bottom'][visible]) .drawer{
          box-shadow: 0px 0 60px 0px #00000055;
          transform: translate(0%,0%);
       }
       :host(:not([visible])[placement='bottom']) .drawer{
          transform: translate(0%,100%);
       }
       
       :host([closeable]) .close-icon{
          display: flex;
          color: #8c8c8c;
          padding: 5px;
       }
       :host([closeable]) .close-icon:hover{
          color: #414141;
       }
       :host(:not([closeable])) .close-icon{
          display: none;
       }
      </style>
`;

const initHtmlStyle = (padding: string, width: string): string => {
  return replacePlaceholders(css, padding, width);
};

@element('lit-drawer')
export class LitDrawer extends BaseElement {
  static get observedAttributes(): string[] {
    return [
      'drawer-title',
      'visible',
      'placement',
      'mask',
      'mask-closable',
      'closeable',
      'content-padding',
      'content-width',
    ];
  }

  initHtml(): string {
    return `
        ${initHtmlStyle(this.contentPadding, this.contentWidth)}
        <div class="bg"></div>
        <div class="drawer">
            <div class="title">
                <label id="drawer-tittle-text">${this.title}</label>
                <lit-icon class="close-icon" name="close"></lit-icon>
            </div>
            <div style="overflow-x: hidden;overflow-y: auto">
                <slot></slot>
            </div>
        </div>
        `;
  }
  get contentWidth(): string {
    return this.getAttribute('content-width') || '400px';
  }
  set contentWidth(value) {
    this.shadowRoot!.querySelector<HTMLDivElement>('.drawer')!.style.width = value;
    this.setAttribute('content-width', value);
  }
  get contentPadding(): string {
    return this.getAttribute('content-padding') || '20px';
  }
  set contentPadding(value) {
    this.shadowRoot!.querySelector('slot')!.style.padding = value;
    this.setAttribute('content-padding', value);
  }
  get placement(): string | null {
    return this.getAttribute('placement');
  }
  set placement(value: unknown) {
    // @ts-ignore
    this.setAttribute('placement', value);
  }
  get drawerTitle(): string {
    return this.getAttribute('drawer-title') || '';
  }
  set drawerTitle(value) {
    this.shadowRoot!.querySelector('#drawer-tittle-text')!.textContent = value;
    this.setAttribute('drawer-title', value);
  }
  get visible(): boolean {
    return this.getAttribute('visible') !== null;
  }
  set visible(value: unknown) {
    if (value) {
      // @ts-ignore
      this.setAttribute('visible', value);
    } else {
      this.removeAttribute('visible');
    }
  }
  get mask(): boolean {
    return this.getAttribute('mask') !== null;
  }
  set mask(value) {
    if (value) {
      this.setAttribute('mask', '');
    } else {
      this.removeAttribute('mask');
    }
  }
  get maskCloseable(): boolean {
    return this.getAttribute('mask-closeable') !== null;
  }
  set maskCloseable(value) {
    if (value) {
      this.setAttribute('mask-closeable', '');
    } else {
      this.removeAttribute('mask-closeable');
    }
  }
  get closeable(): boolean {
    return this.getAttribute('closeable') !== null;
  }

  set closeable(value) {
    if (value) {
      this.setAttribute('closeable', '');
    } else {
      this.removeAttribute('closeable');
    }
  }

  //当 custom element首次被插入文档DOM时，被调用。
  initElements(): void {
    let bg: HTMLDivElement | null = this.shadowRoot!.querySelector('.bg');
    if (this.maskCloseable) {
      bg!.onclick = (e: unknown): void => {
        // @ts-ignore
        e.stopPropagation();
        this.visible = false; // @ts-ignore
        this.dispatchEvent(new CustomEvent('onClose', e));
      };
    }
    if (this.closeable) {
      // @ts-ignore
      (this.shadowRoot!.querySelector('.close-icon') as unknown).onclick = (e: unknown): void => {
        this.visible = false; // @ts-ignore
        this.dispatchEvent(new CustomEvent('onClose', e));
      };
    }
  }
  set onClose(fn: unknown) {
    // @ts-ignore
    this.addEventListener('onClose', fn);
  }
  //当 custom element从文档DOM中删除时，被调用。
  disconnectedCallback(): void {}

  //当 custom element被移动到新的文档时，被调用。
  adoptedCallback(): void {}

  //当 custom element增加、删除、修改自身属性时，被调用。
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (this.mask) {
      if (name === 'visible') {
        if (newValue !== null) {
          this.style.pointerEvents = 'all';
        } else {
          this.style.pointerEvents = 'none';
        }
      } else if (name === 'placement') {
        if (newValue === 'bottom') {
          let el = this.shadowRoot!.querySelector('.drawer');
        }
      }
    }
  }
}

if (!customElements.get('lit-drawer')) {
  customElements.define('lit-drawer', LitDrawer);
}
