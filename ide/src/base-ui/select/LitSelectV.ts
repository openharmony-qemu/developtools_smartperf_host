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
import { LitSelectOption } from './LitSelectOption';
import {selectHtmlStr, selectVHtmlStr} from './LitSelectHtml';

@element('lit-select-v')
export class LitSelectV extends BaseElement {
  showItems: Array<string> = [];
  itemValue: Array<string> = [];
  customItem: Array<string> = [];
  private focused: any;
  private selectVInputEl: any;
  private selectVSearchInputEl: any;
  private selectVIconEl: any;
  private selectVOptions: HTMLDivElement | undefined;
  private selectVBody: HTMLDivElement | undefined;

  private valueStr: string = '';

  static get observedAttributes() {
    return ['value', 'default-value', 'placeholder', 'disabled', 'show-search', 'border', 'mode'];
  }

  get value() {
    return this.selectVInputEl!.value || this.defaultValue;
  }

  get rounded() {
    return this.hasAttribute('rounded');
  }

  set rounded(selectVRounded: boolean) {
    if (selectVRounded) {
      this.setAttribute('rounded', '');
    } else {
      this.removeAttribute('rounded');
    }
  }

  get placement(): string {
    return this.getAttribute('placement') || '';
  }

  set placement(selectVPlacement: string) {
    if (selectVPlacement) {
      this.setAttribute('placement', selectVPlacement);
    } else {
      this.removeAttribute('placement');
    }
  }

  get border() {
    return this.getAttribute('border') || 'true';
  }

  set border(selectVBorder) {
    if (selectVBorder) {
      this.setAttribute('border', 'true');
    } else {
      this.setAttribute('border', 'false');
    }
  }

  get defaultPlaceholder() {
    return this.getAttribute('placeholder') || '';
  }

  get defaultValue() {
    return this.getAttribute('default-value') || '';
  }

  set defaultValue(selectVDefaultValue) {
    this.setAttribute('default-value', selectVDefaultValue);
  }

  get placeholder() {
    return this.getAttribute('placeholder') || this.defaultPlaceholder;
  }

  set placeholder(selectVPlaceholder) {
    this.setAttribute('placeholder', selectVPlaceholder);
  }

  set all(isAll: boolean) {
    if (isAll) {
      this.setAttribute('is-all', '');
    } else {
      this.removeAttribute('is-all');
    }
  }

  get all() {
    return this.hasAttribute('is-all');
  }

  dataSource(selectVData: Array<string>, valueStr: string) {
    this.selectVOptions!.innerHTML = '';
    if (selectVData.length > 0) {
      this.selectVBody!.style.display = 'block';
      this.valueStr = valueStr;
      this.itemValue = selectVData;
      if (valueStr != '') {
        let option = document.createElement('lit-select-option');
        if (this.all) {
          option.setAttribute('selected', '');
          this.showItems = selectVData;
        }
        option.setAttribute('value', valueStr);
        option.textContent = valueStr;
        this.selectVOptions!.appendChild(option);
        this.initDataItem(selectVData);
        this.initCustomOptions();
      } else {
        this.initDataItem(selectVData);
        this.initOptions();
      }
    } else {
      this.selectVBody!.style.display = 'none';
    }
    if (this.title == 'Event List') {
      let inputElement = this.shadowRoot?.querySelector('input') as HTMLInputElement;
      inputElement.readOnly = false;
    }
  }

  initDataItem(selectVDataItem: Array<string>) {
    selectVDataItem.forEach((item) => {
      let selectVOption = document.createElement('lit-select-option');
      if (this.showItems.indexOf(item) > -1 || this.all) {
        selectVOption.setAttribute('selected', '');
      }
      selectVOption.className = 'option';
      selectVOption.setAttribute('value', item);
      selectVOption.textContent = item;
      this.selectVOptions!.appendChild(selectVOption);
    });
  }

  initElements(): void {
    this.tabIndex = 0;
    this.focused = false;
    this.selectVInputEl = this.shadowRoot!.querySelector('#select-input') as HTMLInputElement;
    this.selectVSearchInputEl = this.shadowRoot!.querySelector('#search-input') as HTMLInputElement;
    this.selectVBody = this.shadowRoot!.querySelector('.body') as HTMLDivElement;
    this.selectVOptions = this.shadowRoot!.querySelector('.body-opt') as HTMLDivElement;
    this.selectVIconEl = this.shadowRoot!.querySelector('.icon');
    this.selectVInputEl!.oninput = (ev: InputEvent) => {
      // @ts-ignore
      if (this.selectVInputEl!.value === '00') {
        this.selectVInputEl!.value = '0';
        ev.preventDefault();
      }
      if (this.selectVInputEl!.value === '') {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((it) => {
          it.removeAttribute('selected');
          this.showItems = [];
        });
      }
    };
    this.selectVSearchInputEl!.onkeydown = (ev: KeyboardEvent) => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    this.onclick = (ev: any) => {
      if (this.focused === false) {
        this.focused = true;
      } else {
        this.focused = false;
      }
    };
    this.selectVSearchInputEl?.addEventListener('keyup', () => {
      let options = [...this.shadowRoot!.querySelectorAll<LitSelectOption>('.option')];
      options.filter((a: LitSelectOption) => {
        if (a.textContent!.indexOf(this.selectVSearchInputEl!.value) <= -1) {
          a.style.display = 'none';
        } else {
          a.style.display = 'flex';
        }
      });
    });
    this.setEvent();
  }

  setEvent():void{
    this.onmouseout = this.onblur = (ev) => {
      this.focused = false;
    };
    this.selectVInputEl.onfocus = (ev: any) => {
      if (this.hasAttribute('disabled')) return;
    };
    this.selectVInputEl.onblur = (ev: any) => {
      if (this.hasAttribute('disabled')) return;
    };
  }

  initHtml() {
    return `
        ${selectVHtmlStr}
        <div class="root noSelect" tabindex="0" hidefocus="true">
            <input id="select-input" placeholder="${this.placeholder}" tabindex="0" readonly="readonly">
            <lit-icon class="icon" name='down' color="#c3c3c3"></lit-icon>
        </div>
        <div class="body">
            <div class="body-select">
             <input id="search-input" placeholder="Search">
           </div>
            <div class="body-opt">
               <slot></slot>
               <slot name="footer"></slot>
            </div>
        </div>     
        `;
  }

  connectedCallback() {}

  initCustomOptions() {
    let querySelector = this.shadowRoot?.querySelector(
      `lit-select-option[value="${this.valueStr}"]`
    ) as LitSelectOption;
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
      a.setAttribute('check', '');
      a.addEventListener('onSelected', (e: any) => {
        if (a.hasAttribute('selected')) {
          let number = this.showItems.indexOf(a.textContent!);
          if (number > -1) {
            this.showItems!.splice(number, 1);
            this.selectVInputEl!.value = this.showItems;
          }
          this.all = false;
          querySelector.removeAttribute('selected');
          a.removeAttribute('selected');
          return;
        } else {
          let index = this.itemValue.indexOf(a.textContent!);
          let value = this.showItems.indexOf(a.textContent!);
          if (index > -1 && value == -1) {
            this.showItems.push(a.textContent!);
            this.selectVInputEl!.value = this.showItems;
          }
          if (this.showItems.length >= this.itemValue.length) {
            querySelector.setAttribute('selected', '');
            this.all = true;
          } else {
            querySelector.removeAttribute('selected');
            this.all = false;
          }
          a.setAttribute('selected', '');
        }
      });
    });
    this.selectAll(querySelector);
  }

  initOptions() {
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
      a.setAttribute('check', '');
      a.addEventListener('onSelected', (e: any) => {
        if (a.hasAttribute('selected')) {
          let number = this.showItems.indexOf(a.textContent!);
          if (number > -1) {
            this.showItems.splice(number, 1);
          }
          a.removeAttribute('selected');
        } else {
          let index = this.itemValue.indexOf(a.textContent!);
          if (index > -1) {
            this.showItems.push(a.textContent!);
          }
          a.setAttribute('selected', '');
        }
        let items = this.selectVInputEl!.value.split(',');
        this.customItem = [];
        items.forEach((item: string) => {
          if (item.trim() != '') {
            let indexItem = this.itemValue.indexOf(item.trim());
            if (indexItem == -1) {
              this.customItem.push(item.trim());
            }
          }
        });
        if (this.customItem.length > 0) {
          this.selectVInputEl.value = this.customItem.concat(this.showItems);
        } else {
          this.selectVInputEl.value = this.showItems;
        }
      });
    });
  }

  selectAll(querySelector: LitSelectOption) {
    querySelector?.addEventListener('click', (ev) => {
      if (querySelector.hasAttribute('selected')) {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
          a.setAttribute('selected', '');
          this.all = true;
        });
        this.itemValue.forEach((i) => {
          this.showItems.push(i);
        });
        this.selectVInputEl.value = this.itemValue;
      } else {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((i) => {
          i.removeAttribute('selected');
          this.all = false;
        });
        this.showItems = [];
        this.selectVInputEl.value = '';
      }
    });
  }

  attributeChangedCallback(name: any, oldValue: any, newValue: any) {}
}
