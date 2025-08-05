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
import { selectHtmlStr, selectVHtmlStr } from './LitSelectHtml';

@element('lit-select-v')
export class LitSelectV extends BaseElement {
  showItems: Array<string> = [];
  ignoreValues: Array<string> = [];
  itemValue: Array<string> = [];
  customItem: Array<string> = [];
  private focused: unknown;
  private selectVInputEl: unknown;
  private selectVSearchInputEl: unknown;
  private selectVIconEl: unknown;
  private selectVOptions: HTMLDivElement | undefined;
  private selectVBody: HTMLDivElement | undefined;

  private valueStr: string = '';
  private currentvalueStr: string = '';

  static get observedAttributes(): string[] {
    return ['value', 'default-value', 'placeholder', 'disabled', 'show-search', 'border', 'mode'];
  }

  get value(): string {
    // @ts-ignore
    return this.selectVInputEl!.value || this.defaultValue;
  }

  get rounded(): boolean {
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

  get border(): string {
    return this.getAttribute('border') || 'true';
  }

  set border(selectVBorder) {
    if (selectVBorder) {
      this.setAttribute('border', 'true');
    } else {
      this.setAttribute('border', 'false');
    }
  }

  get defaultPlaceholder(): string {
    return this.getAttribute('placeholder') || '';
  }

  get defaultValue(): string {
    return this.getAttribute('default-value') || '';
  }

  set defaultValue(selectVDefaultValue) {
    this.setAttribute('default-value', selectVDefaultValue);
  }

  get placeholder(): string {
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

  get all(): boolean {
    return this.hasAttribute('is-all');
  }

  dataSource(selectVData: Array<string>, valueStr: string, isSingle?: boolean): void {
    this.selectVOptions!.innerHTML = '';
    if (selectVData.length > 0) {
      this.selectVBody!.style.display = 'block';
      this.valueStr = valueStr;
      this.itemValue = selectVData;
      if (valueStr !== '') {
        let option = document.createElement('lit-select-option');
        if (this.all) {
          option.setAttribute('selected', '');
          this.showItems = selectVData;
        }
        option.setAttribute('value', valueStr);
        option.textContent = valueStr;
        this.selectVOptions!.appendChild(option);
        this.initDataItem(selectVData);
        if (isSingle) {
          this.initSingleCustomOptions();
        } else {
          this.initCustomOptions();
        }
      } else {
        this.initDataItem(selectVData);
        if (isSingle) {
          this.initSingleCustomOptions();
        } else {
          this.initOptions();
        }
      }
    } else {
      this.selectVBody!.style.display = 'none';
    }
    if (this.title === 'Event List') {
      let inputElement = this.shadowRoot?.querySelector('input') as HTMLInputElement;
      inputElement.readOnly = false;
    }
  }

  setIgnoreValues(values: string[]) {
    this.ignoreValues = values;
  }

  setSelectedOptions(selectArray: Array<string>) {
    let allSelected = true;
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
      if (selectArray.includes(a.textContent!)) {
        a.setAttribute('selected', '');
      } else {
        allSelected = false;
        a.removeAttribute('selected');
      }
    });
    this.all = allSelected;
    selectArray.forEach((i) => {
      this.showItems.push(i);
    }); 
    // @ts-ignore
    this.selectVInputEl.value = selectArray.filter(it => !this.ignoreValues.includes(it));
  }

  initDataItem(selectVDataItem: Array<string>): void {
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
    this.selectVIconEl = this.shadowRoot!.querySelector('.icon'); // @ts-ignore
    this.selectVInputEl?.addEventListener('keyup', (e) => {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {// @ts-ignore
        this.selectVInputEl.blur();
      }
    });// @ts-ignore
    this.selectVInputEl!.oninput = (ev: InputEvent): void => {
      // @ts-ignore
      if (this.selectVInputEl!.value === '00') {
        // @ts-ignore
        this.selectVInputEl!.value = '0';
        ev.preventDefault();
      } // @ts-ignore
      if (this.selectVInputEl!.value === '') {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((it) => {
          it.removeAttribute('selected');
          this.showItems = [];
          this.currentvalueStr = '';
        });
      }
    }; // @ts-ignore
    this.selectVSearchInputEl!.onkeydown = (ev: KeyboardEvent): void => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    this.onclick = (ev: unknown): void => {
      if (this.focused === false) {
        this.focused = true;
      } else {
        this.focused = false;
      }
    }; // @ts-ignore
    this.selectVSearchInputEl?.addEventListener('keyup', () => {
      let options = [...this.shadowRoot!.querySelectorAll<LitSelectOption>('.option')];
      options.filter((a: LitSelectOption) => {
        // @ts-ignore
        if (a.textContent!.indexOf(this.selectVSearchInputEl!.value) <= -1) {
          a.style.display = 'none';
        } else {
          a.style.display = 'flex';
        }
      });
    });
    this.setEvent();
  }

  setEvent(): void {
    this.onmouseout = this.onblur = (ev): void => {
      this.focused = false;
    }; // @ts-ignore
    this.selectVInputEl.onfocus = (ev: unknown): void => {
      if (this.hasAttribute('disabled')) {
        return;
      }
    }; // @ts-ignore
    this.selectVInputEl.onblur = (ev: unknown): void => {
      if (this.hasAttribute('disabled')) {
        return;
      }
    };
  }

  initHtml(): string {
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

  connectedCallback(): void { }

  initCustomOptions(): void {
    let querySelector = this.shadowRoot?.querySelector(
      `lit-select-option[value="${this.valueStr}"]`
    ) as LitSelectOption;
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
      a.setAttribute('check', '');
      a.addEventListener('onSelected', (e: unknown) => {
        if (a.hasAttribute('selected')) {
          let number = this.showItems.indexOf(a.textContent!);
          if (number > -1) {
            this.showItems!.splice(number, 1); // @ts-ignore
            this.selectVInputEl!.value = this.showItems.filter(it => !this.ignoreValues.includes(it));
          }
          this.all = false;
          querySelector.removeAttribute('selected');
          a.removeAttribute('selected');
          return;
        } else {
          let index = this.itemValue.indexOf(a.textContent!);
          let value = this.showItems.indexOf(a.textContent!);
          if (index > -1 && value === -1) {
            this.showItems.push(a.textContent!); // @ts-ignore
            this.selectVInputEl!.value = this.showItems.filter(it => !this.ignoreValues.includes(it));
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

  initSingleCustomOptions(): void {
    let selectedOption = this.shadowRoot?.querySelector(
      `lit-select-option[value="${this.currentvalueStr}"]`
    ) as LitSelectOption | null;
    if (selectedOption) {
      selectedOption.setAttribute('selected', '');
    }
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((option) => {
      option.addEventListener('onSelected', () => {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((o) => {
          o.removeAttribute('selected');
        });
        option.setAttribute('selected', '');
        this.dispatchEvent(new CustomEvent('valueChange', {
          detail: { value: option.textContent! },
          bubbles: true,
          composed: true
        }));
        //@ts-ignore
        this.selectVInputEl!.value = option.textContent!;
        this.currentvalueStr = option.textContent!;
      });
    });
  }

  initOptions(): void {
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
      a.setAttribute('check', '');
      a.addEventListener('onSelected', (e: unknown) => {
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
        } // @ts-ignore
        let items = this.selectVInputEl!.value.split(',');
        this.customItem = [];
        items.forEach((item: string) => {
          if (item.trim() !== '') {
            let indexItem = this.itemValue.indexOf(item.trim());
            if (indexItem === -1) {
              this.customItem.push(item.trim());
            }
          }
        });
        if (this.customItem.length > 0) {
          // @ts-ignore
          this.selectVInputEl.value = this.customItem.concat(this.showItems)
            .filter(it => !this.ignoreValues.includes(it));
        } else {
          // @ts-ignore
          this.selectVInputEl.value = this.showItems.filter(it => !this.ignoreValues.includes(it));
        }
      });
    });
  }

  selectAll(querySelector: LitSelectOption): void {
    querySelector?.addEventListener('click', (ev) => {
      if (querySelector.hasAttribute('selected')) {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
          a.setAttribute('selected', '');
          this.all = true;
        });
        this.itemValue.forEach((i) => {
          this.showItems.push(i);
        }); // @ts-ignore
        this.selectVInputEl.value = this.itemValue.filter(it => !this.ignoreValues.includes(it));;
      } else {
        this.shadowRoot?.querySelectorAll('lit-select-option').forEach((i) => {
          i.removeAttribute('selected');
          this.all = false;
        });
        this.showItems = []; // @ts-ignore
        this.selectVInputEl.value = '';
      }
    });
  }

  clearVal(): void {// @ts-ignore
    this.selectVInputEl!.value = '';
    this.shadowRoot?.querySelectorAll('lit-select-option').forEach((a) => {
        if (a.hasAttribute('selected')) {
          a.removeAttribute('selected');
        }
    });
    this.dataSource([], '');
  }

  attributeChangedCallback(name: unknown, oldValue: unknown, newValue: unknown): void { }
}
