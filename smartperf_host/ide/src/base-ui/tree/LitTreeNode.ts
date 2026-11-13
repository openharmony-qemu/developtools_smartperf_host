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

import '../icon/LitIcon';
import { BaseElement, element } from '../BaseElement';
import { type LitIcon } from '../icon/LitIcon';
import { type TreeItemData } from './LitTree';
import { LitTreeNodeHtmlStyle } from './LitTreeNode.html';

@element('lit-tree-node')
export class LitTreeNode extends BaseElement {
  private arrowElement: HTMLSpanElement | null | undefined;
  private itemElement: HTMLDivElement | null | undefined;
  private checkboxElement: HTMLInputElement | null | undefined;
  private iconElement: LitIcon | null | undefined;
  private _data: TreeItemData | null | undefined;

  static get observedAttributes(): string[] {
    return [
      'icon-name',
      'icon-size',
      'color',
      'path',
      'title',
      'arrow',
      'checkable',
      'selected',
      'checked',
      'missing',
      'multiple',
      'top-depth',
    ];
  }

  get checkable(): string {
    return this.getAttribute('checkable') || 'false';
  }

  set data(value: TreeItemData | null | undefined) {
    this._data = value;
  }

  get data(): TreeItemData | null | undefined {
    return this._data;
  }

  set checkable(value) {
    if (value === 'true') {
      this.setAttribute('checkable', 'true');
    } else {
      this.setAttribute('checkable', 'false');
    }
  }

  set multiple(value: boolean) {
    if (value) {
      this.setAttribute('multiple', '');
    } else {
      this.removeAttribute('multiple');
    }
  }

  get multiple(): boolean {
    return this.hasAttribute('multiple');
  }

  get iconName(): string {
    return this.getAttribute('icon-name') || '';
  }

  set iconName(value) {
    this.setAttribute('icon-name', value);
  }

  get topDepth(): boolean {
    return this.hasAttribute('top-depth');
  }

  set topDepth(value) {
    if (value) {
      this.setAttribute('top-depth', '');
    } else {
      this.removeAttribute('top-depth');
    }
  }

  get arrow(): boolean {
    return this.hasAttribute('arrow');
  }

  set arrow(value) {
    if (value) {
      this.setAttribute('arrow', 'true');
    } else {
      this.removeAttribute('arrow');
    }
  }

  get open(): string {
    return this.getAttribute('open') || 'true';
  }

  set open(value) {
    this.setAttribute('open', value);
  }

  get selected(): boolean {
    return this.hasAttribute('selected');
  }

  set selected(value) {
    if (value) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  get checked(): boolean {
    return this.hasAttribute('checked');
  }

  set checked(value) {
    if (value === null || !value) {
      this.removeAttribute('checked');
    } else {
      this.setAttribute('checked', '');
    }
  }

  initElements(): void {
    this.arrowElement = this.shadowRoot!.querySelector<HTMLSpanElement>('#arrow');
    this.iconElement = this.shadowRoot!.querySelector<LitIcon>('#icon');
    this.itemElement = this.shadowRoot!.querySelector<HTMLDivElement>('#item');
    this.checkboxElement = this.shadowRoot!.querySelector<HTMLInputElement>('#checkbox');
    this.arrowElement!.onclick = (e): void => {
      e.stopPropagation();
      this.autoExpand();
    };
    this.itemElement!.onclick = (e): void => {
      e.stopPropagation();
      if (this._data && this._data.disable === true) {
        return;
      }
      this.onChange(!this.data?.checked);
    };
  }

  onChange(checked: boolean): void {
    this.checked = checked;
    this.data!.checked = checked;
    this.checkHandler();
    this.dispatchEvent(new CustomEvent('change', { detail: checked }));
  }

  initHtml(): string {
    return `
         ${LitTreeNodeHtmlStyle}
        </style>
        <span id="arrow" style="margin-right: 2px"></span>
        <div id="item" style="display: flex;align-items: center;padding-left: 2px">
<!--            <lit-check-box id="checkbox"></lit-check-box>-->
            <input id="checkbox" type="radio" style="cursor: pointer; pointer-events: none"/>
            <lit-icon id="icon" name="${this.iconName}"></lit-icon>
            <span id="title">${this.title}</span>
        </div>
        `;
  }

  //当 custom element首次被插入文档DOM时，被调用。
  connectedCallback(): void {
    if (this.hasAttribute('checked')) {
      this.checkboxElement!.checked = true;
    }
    this.checkHandler();
  }

  checkHandler(): void {
    if (this.checked) {
      this.removeAttribute('missing');
    }
    if (this.hasAttribute('multiple')) {
      if (this.nextElementSibling) {
        if (this.checked) {
          this.nextElementSibling.querySelectorAll('lit-tree-node').forEach((a: unknown) => {
            //@ts-ignore
            a.checked = true; //@ts-ignore
            a.removeAttribute('missing');
          });
        } else {
          //@ts-ignore
          this.nextElementSibling.querySelectorAll('lit-tree-node').forEach((a: unknown) => (a.checked = false));
        }
      }
      let setCheckStatus = (element: unknown): void => {
        if (
          //@ts-ignore
          element.parentElement.parentElement.previousElementSibling && //@ts-ignore
          element.parentElement.parentElement.previousElementSibling.tagName === 'LIT-TREE-NODE'
        ) {
          //@ts-ignore
          let allChecked = Array.from(element.parentElement.parentElement.querySelectorAll('lit-tree-node')).every(
            //@ts-ignore
            (item: unknown) => item.checked
          ); //@ts-ignore
          let someChecked = Array.from(element.parentElement.parentElement.querySelectorAll('lit-tree-node')).some(
            //@ts-ignore
            (item: unknown, index, array) => item.checked
          );
          if (allChecked === true) {
            //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.checked = true; //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.removeAttribute('missing');
          } else if (someChecked) {
            //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.setAttribute('missing', ''); //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.removeAttribute('checked');
          } else {
            //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.removeAttribute('missing'); //@ts-ignore
            element.parentElement.parentElement.previousElementSibling.removeAttribute('checked');
          } //@ts-ignore
          setCheckStatus(element.parentElement.parentElement.previousElementSibling);
        }
      };
      setCheckStatus(this);
    }
  }

  expand(): void {
    if (this.open === 'true') {
      return;
    }
    let uul = this.parentElement!.querySelector('ul');
    this.expandSection(uul);
    this.arrowElement!.style.transform = 'translateX(-50%) rotateZ(0deg)';
  }

  collapse(): void {
    if (this.open === 'false') {
      return;
    }
    let uul = this.parentElement!.querySelector('ul');
    this.collapseSection(uul);
    this.arrowElement!.style.transform = 'translateX(-50%) rotateZ(-90deg)';
  }

  autoExpand(): void {
    let uul = this.parentElement!.querySelector('ul');
    if (this.open === 'true') {
      this.collapseSection(uul);
      this.arrowElement!.style.transform = 'translateX(-50%) rotateZ(-90deg)';
    } else {
      this.expandSection(uul);
      this.arrowElement!.style.transform = 'translateX(-50%) rotateZ(0deg)';
    }
  }

  //收起
  collapseSection(element: unknown): void {
    if (!element) {
      return;
    } //@ts-ignore
    let sectionHeight = element.scrollHeight; //@ts-ignore
    let elementTransition = element.style.transition; //@ts-ignore
    element.style.transition = '';
    requestAnimationFrame(function () {
      //@ts-ignore
      element.style.height = sectionHeight + 'px'; //@ts-ignore
      element.style.transition = elementTransition;
      requestAnimationFrame(function () {
        //@ts-ignore
        element.style.height = 0 + 'px';
      });
    });
    this.open = 'false';
  }

  //展开
  expandSection(element: unknown): void {
    if (!element) {
      return;
    } //@ts-ignore
    let sectionHeight = element.scrollHeight; //@ts-ignore
    element.style.height = sectionHeight + 'px'; //@ts-ignore
    element.ontransitionend = (e: unknown): void => {
      //@ts-ignore
      element.ontransitionend = null; //@ts-ignore
      element.style.height = null;
      this.open = 'true';
    };
  }

  //当 custom element从文档DOM中删除时，被调用。
  disconnectedCallback(): void {}

  //当 custom element被移动到新的文档时，被调用。
  adoptedCallback(): void {}

  //当 custom element增加、删除、修改自身属性时，被调用。
  attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown): void {
    if (name === 'title') {
      //@ts-ignore
      this.shadowRoot!.querySelector('#title')!.textContent = newValue;
    } else if (name === 'icon-name') {
      if (this.iconElement) {
        if (newValue !== null && newValue !== '' && newValue !== 'null') {
          //@ts-ignore
          this.iconElement!.setAttribute('name', newValue);
          this.iconElement!.style.display = 'flex';
        } else {
          this.iconElement!.style.display = 'none';
        }
      }
    } else if (name === 'checkable') {
      if (this.checkboxElement) {
        if (newValue === 'true' && this._data!.disable !== true) {
          this.checkboxElement!.style.display = 'inline-block';
        } else {
          this.checkboxElement!.style.display = 'none';
        }
      }
    } else if (name === 'checked') {
      if (this.checkboxElement) {
        this.checkboxElement.checked = this.hasAttribute('checked');
      }
    }
    if (this.arrow) {
      this.checkboxElement!.style.display = 'none';
    }
  }

  //在node top  top-right  bottom bottom-right 画线条
  drawLine(direction: string /*string[top|bottom|top-right|bottom-right]*/): void {
    let item = this.shadowRoot!.querySelector('#item');
    if (!item) {
      return;
    }
    item.removeAttribute('line-top');
    item.removeAttribute('line-top-right');
    item.removeAttribute('line-bottom');
    item.removeAttribute('line-bottom-right');
    switch (direction) {
      case 'top':
        item.setAttribute('line-top', '');
        break;
      case 'bottom':
        item.setAttribute('line-bottom', '');
        break;
      case 'top-right':
        item.setAttribute('line-top-right', '');
        break;
      case 'bottom-right':
        item.setAttribute('line-bottom-right', '');
        break;
    }
  }
}

if (!customElements.get('lit-tree-node')) {
  customElements.define('lit-tree-node', LitTreeNode);
}
