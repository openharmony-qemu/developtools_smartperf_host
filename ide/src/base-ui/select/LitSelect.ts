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
import { selectHtmlStr } from './LitSelectHtml';
import { LitSelectOption } from './LitSelectOption';

@element('lit-select')
export class LitSelect extends BaseElement {
  private focused: unknown;
  private selectInputEl: unknown;
  private selectSearchInputEl: HTMLInputElement | null | undefined;
  private selectOptions: HTMLDivElement | null | undefined;
  private selectItem: string = '';
  private selectClearEl: unknown;
  private selectIconEl: unknown;
  private bodyEl: unknown;
  private selectSearchEl: unknown;
  private selectMultipleRootEl: unknown;
  private currentSelectedValue: string = '';

  static get observedAttributes(): string[] {
    return [
      'value',
      'default-value',
      'placeholder',
      'disabled',
      'loading',
      'allow-clear',
      'show-search',
      'list-height',
      'border',
      'mode',
      'showSearchInput',
    ];
  }

  get value(): string {
    return this.getAttribute('value') || this.defaultValue;
  }

  set value(selectValue) {
    this.setAttribute('value', selectValue);
  }

  get rounded(): boolean {
    return this.hasAttribute('rounded');
  }

  set rounded(selectRounded: boolean) {
    if (selectRounded) {
      this.setAttribute('rounded', '');
    } else {
      this.removeAttribute('rounded');
    }
  }

  get placement(): string {
    return this.getAttribute('placement') || '';
  }

  set placement(selectPlacement: string) {
    if (selectPlacement) {
      this.setAttribute('placement', selectPlacement);
    } else {
      this.removeAttribute('placement');
    }
  }

  get border(): string {
    return this.getAttribute('border') || 'true';
  }

  set border(selectBorder) {
    if (selectBorder) {
      this.setAttribute('border', 'true');
    } else {
      this.setAttribute('border', 'false');
    }
  }

  get listHeight(): string {
    return this.getAttribute('list-height') || '256px';
  }

  set listHeight(selectListHeight) {
    this.setAttribute('list-height', selectListHeight);
  }

  get defaultPlaceholder(): string {
    return this.getAttribute('placeholder') || '请选择';
  }

  set canInsert(can: boolean) {
    if (can) {
      this.setAttribute('canInsert', '');
    } else {
      this.removeAttribute('canInsert');
    }
  }

  get canInsert(): boolean {
    return this.hasAttribute('canInsert');
  }
  get showSearch(): boolean {
    return this.hasAttribute('show-search');
  }

  get defaultValue(): string {
    return this.getAttribute('default-value') || '';
  }

  set defaultValue(selectDefaultValue) {
    this.setAttribute('default-value', selectDefaultValue);
  }

  get placeholder(): string {
    return this.getAttribute('placeholder') || this.defaultPlaceholder;
  }

  set placeholder(selectPlaceHolder) {
    this.setAttribute('placeholder', selectPlaceHolder);
  }

  get loading(): boolean {
    return this.hasAttribute('loading');
  }

  set loading(selectLoading) {
    if (selectLoading) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
  }

  get showSearchInput(): boolean {
    return this.hasAttribute('showSearchInput');
  }

  set showSearchInput(isHide: boolean) {
    if (isHide) {
      this.setAttribute('showSearchInput', '');
    } else {
      this.removeAttribute('showSearchInput');
    }
  }

  set showItem(item: string) {
    this.selectItem = item;
  }

  set dataSource(selectDataSource: unknown) {
    this.innerHTML = '<slot></slot><slot name="footer"></slot>'; // @ts-ignore
    if (selectDataSource.length > 0) {
      // @ts-ignore
      this.bodyEl!.style.display = 'flex';
      this.querySelectorAll('lit-select-option').forEach((a) => {
        this.removeChild(a);
      });
      let valuesSet = new Set();
      let flag = true; // 假设所有 value 都是唯一的  
      // @ts-ignore
      selectDataSource.forEach(item => {
        if (valuesSet.has(item.value)) {
          flag = false; // 如果value有重复，就设置flag为false  
          return;
        }
        valuesSet.add(item.value);
      });
      // @ts-ignore
      selectDataSource.forEach((dateSourceBean: unknown) => {
        if (dateSourceBean) {
          let selectOption = document.createElement('lit-select-option');
          let optionData = {
            // @ts-ignore
            value: dateSourceBean.value ? dateSourceBean.value : dateSourceBean.name || dateSourceBean, // @ts-ignore
            name: dateSourceBean.name ? dateSourceBean.name : dateSourceBean,
          };
          if (!flag) { // 如果数组的value值不是唯一的，就用name做为value值，避免多个选项被选中
            optionData = {
              // @ts-ignore
              value: dateSourceBean.name ? dateSourceBean.name : dateSourceBean, // @ts-ignore
              name: dateSourceBean.name ? dateSourceBean.name : dateSourceBean,
            };
          }
          selectOption.textContent = optionData.name;
          selectOption.setAttribute('value', optionData.value);
          if (this.currentSelectedValue === optionData.value) {
            selectOption.setAttribute('selected', '');
          }
          // @ts-ignore
          this.selectInputEl!.value = '';
          this.append(selectOption);
        }
      });
      this.initOptions();
    } else {
      // @ts-ignore
      this.bodyEl!.style.display = 'none';
    }
  }

  initElements(): void {
    if (this.showSearchInput) {
      this.shadowRoot!.querySelector<HTMLDivElement>('.body-select')!.style.display = 'block';
      this.selectSearchInputEl = this.shadowRoot!.querySelector('#search-input') as HTMLInputElement;
      this.selectSearchInputEl?.addEventListener('keyup', (evt) => {
        let options = [];
        options = [...this.querySelectorAll<LitSelectOption>('lit-select-option')];
        options.filter((a: LitSelectOption) => {
          if (a.textContent!.indexOf(this.selectSearchInputEl!.value) <= -1) {
            a.style.display = 'none';
          } else {
            a.style.display = 'flex';
          }
        });
        evt.preventDefault();
        evt.stopPropagation();
      });
    }
  }

  initHtml(): string {
    return `
        ${selectHtmlStr(this.listHeight)}
        <div class="root noSelect" tabindex="0" hidefocus="true">
            <div class="multipleRoot">
            <input placeholder="${this.placeholder}" autocomplete="off" ${this.showSearch || this.canInsert ? '' : 'readonly'} tabindex="0">
            </div>
            <lit-loading class="loading" size="12"></lit-loading>
            <lit-icon class="icon" name='down' color="#c3c3c3"></lit-icon>
            <lit-icon class="clear" name='close-circle-fill'></lit-icon>
            <lit-icon class="search" name='search'></lit-icon>
        </div>
        <div class="body">
            <div class="body-select" style="display: none;">
                <input id="search-input" placeholder="Search">
            </div>
            <div class="body-opt">
                <slot></slot>
                <slot name="footer"></slot>
            </div>
        </div>
        `;
  }

  isMultiple(): boolean {
    return this.hasAttribute('mode') && this.getAttribute('mode') === 'multiple';
  }

  newTag(value: unknown, text: unknown): HTMLDivElement {
    let tag: unknown = document.createElement('div');
    let icon: unknown = document.createElement('lit-icon'); // @ts-ignore
    icon.classList.add('tag-close'); // @ts-ignore
    icon.name = 'close';
    let span = document.createElement('span'); // @ts-ignore
    tag.classList.add('tag'); // @ts-ignore
    span.dataset.value = value; // @ts-ignore
    span.textContent = text; // @ts-ignore
    tag.append(span); // @ts-ignore
    tag.append(icon); // @ts-ignore
    icon.onclick = (ev: unknown): void => {
      // @ts-ignore
      tag.parentElement.removeChild(tag);
      this.querySelector(`lit-select-option[value=${value}]`)!.removeAttribute('selected');
      if (this.shadowRoot!.querySelectorAll('.tag').length === 0) {
        // @ts-ignore
        this.selectInputEl.style.width = 'auto'; // @ts-ignore
        this.selectInputEl.placeholder = this.defaultPlaceholder;
      } // @ts-ignore
      ev.stopPropagation();
    }; // @ts-ignore
    tag.value = value; // @ts-ignore
    tag.dataset.value = value; // @ts-ignore
    tag.text = text; // @ts-ignore
    tag.dataset.text = text; // @ts-ignore
    return tag;
  }

  connectedCallback(): void {
    this.tabIndex = 0;
    this.focused = false;
    this.bodyEl = this.shadowRoot!.querySelector('.body');
    this.selectInputEl = this.shadowRoot!.querySelector('input');
    this.selectClearEl = this.shadowRoot!.querySelector('.clear');
    this.selectIconEl = this.shadowRoot!.querySelector('.icon');
    this.selectSearchEl = this.shadowRoot!.querySelector('.search');
    this.selectMultipleRootEl = this.shadowRoot!.querySelector('.multipleRoot');
    this.selectOptions = this.shadowRoot!.querySelector('.body-opt') as HTMLDivElement;
    this.setEventClick();
    this.setEvent(); // @ts-ignore
    this.selectInputEl.onblur = (ev: unknown): void => {
      if (this.hasAttribute('disabled')) {
        return;
      }
      if (this.isMultiple()) {
        if (this.hasAttribute('show-search')) {
          // @ts-ignore
          this.selectSearchEl.style.display = 'none'; // @ts-ignore
          this.selectIconEl.style.display = 'flex';
        }
      } else {
        // @ts-ignore
        if (this.selectInputEl.placeholder !== this.defaultPlaceholder) {
          // @ts-ignore
          this.selectInputEl.value = this.selectInputEl.placeholder; // @ts-ignore
          this.selectInputEl.placeholder = this.defaultPlaceholder;
        }
        if (this.hasAttribute('show-search')) {
          // @ts-ignore
          this.selectSearchEl.style.display = 'none'; // @ts-ignore
          this.selectIconEl.style.display = 'flex';
        }
      }
    };
    this.setOninput();
    this.setOnkeydown();
  }

  setOninput(): void {
    // @ts-ignore
    this.selectInputEl.oninput = (ev: unknown): void => {
      let els: Element[] = [...this.querySelectorAll('lit-select-option')];
      if (this.hasAttribute('show-search')) {
        // @ts-ignore
        if (!ev.target.value) {
          // @ts-ignore
          els.forEach((a: unknown) => (a.style.display = 'flex'));
        } else {
          this.setSelectItem(els, ev);
        }
      } else {
        // @ts-ignore
        this.value = ev.target.value;
      }
    };
  }

  setSelectItem(els: Element[], ev: unknown): void {
    els.forEach((a: unknown) => {
      // @ts-ignore
      let value = a.getAttribute('value');
      if (
        // @ts-ignore
        value.toLowerCase().indexOf(ev.target.value.toLowerCase()) !== -1 || // @ts-ignore
        a.textContent.toLowerCase().indexOf(ev.target.value.toLowerCase()) !== -1
      ) {
        // @ts-ignore
        a.style.display = 'flex';
      } else {
        // @ts-ignore
        a.style.display = 'none';
      }
    });
  }

  setEventClick(): void {
    // @ts-ignore
    this.selectClearEl.onclick = (ev: unknown): void => {
      if (this.isMultiple()) {
        let delNodes: Array<unknown> = []; // @ts-ignore
        this.selectMultipleRootEl.childNodes.forEach((a: unknown) => {
          // @ts-ignore
          if (a.tagName === 'DIV') {
            delNodes.push(a);
          }
        });
        for (let i = 0; i < delNodes.length; i++) {
          // @ts-ignore
          delNodes[i].remove();
        }
        if (this.shadowRoot!.querySelectorAll('.tag').length === 0) {
          // @ts-ignore
          this.selectInputEl.style.width = 'auto'; // @ts-ignore
          this.selectInputEl.placeholder = this.defaultPlaceholder;
        }
      }
      this.querySelectorAll('lit-select-option').forEach((a) => a.removeAttribute('selected')); // @ts-ignore
      this.selectInputEl.value = ''; // @ts-ignore
      this.selectClearEl.style.display = 'none'; // @ts-ignore
      this.selectIconEl.style.display = 'flex';
      this.blur(); // @ts-ignore
      ev.stopPropagation();
      this.dispatchEvent(new CustomEvent('onClear', { detail: ev }));
    };
    this.initOptions();
    this.onclick = (ev: unknown): void => {
      // @ts-ignore
      if (ev.target.tagName === 'LIT-SELECT') {
        if (this.focused === false) {
          // @ts-ignore
          this.selectInputEl.focus();
          this.focused = true; // @ts-ignore
          this.bodyEl!.style.display = 'flex';
        } else {
          this.focused = false;
        }
      }
    };
  }

  setEvent(): void {
    this.onmouseover = this.onfocus = (ev): void => {
      if (this.focused === false && this.hasAttribute('adaptive-expansion')) {
        // @ts-ignore
        if (this.parentElement!.offsetTop < this.bodyEl!.clientHeight) {
          // @ts-ignore
          this.bodyEl!.classList.add('body-bottom');
        } else {
          // @ts-ignore
          this.bodyEl!.classList.remove('body-bottom');
        }
      }
      if (this.hasAttribute('allow-clear')) {
        // @ts-ignore
        if (this.selectInputEl.value.length > 0 || this.selectInputEl.placeholder !== this.defaultPlaceholder) {
          // @ts-ignore
          this.selectClearEl.style.display = 'flex'; // @ts-ignore
          this.selectIconEl.style.display = 'none';
        } else {
          // @ts-ignore
          this.selectClearEl.style.display = 'none'; // @ts-ignore
          this.selectIconEl.style.display = 'flex';
        }
      }
    };
    this.onmouseout = this.onblur = (ev): void => {
      if (this.hasAttribute('allow-clear')) {
        // @ts-ignore
        this.selectClearEl.style.display = 'none'; // @ts-ignore
        this.selectIconEl.style.display = 'flex';
      }
      this.focused = false;
    }; // @ts-ignore
    this.selectInputEl.onfocus = (ev: unknown): void => {
      if (this.hasAttribute('disabled')) {
        return;
      } // @ts-ignore
      if (this.selectInputEl.value.length > 0) {
        // @ts-ignore
        this.selectInputEl.placeholder = this.selectInputEl.value; // @ts-ignore
        this.selectInputEl.value = '';
      }
      if (this.hasAttribute('show-search')) {
        // @ts-ignore
        this.selectSearchEl.style.display = 'flex'; // @ts-ignore
        this.selectIconEl.style.display = 'none';
      }
      this.querySelectorAll('lit-select-option').forEach((a) => {
        // @ts-ignore
        a.style.display = 'flex';
      });
    };
  }

  setOnkeydown(): void {
    // @ts-ignore
    this.selectInputEl.onkeydown = (ev: unknown): void => {
      // @ts-ignore
      if (ev.key === 'Backspace') {
        if (this.isMultiple()) {
          // @ts-ignore
          let tag = this.selectMultipleRootEl.lastElementChild.previousElementSibling;
          if (tag) {
            this.querySelector(`lit-select-option[value=${tag.value}]`)?.removeAttribute('selected');
            tag.remove();
            if (this.shadowRoot!.querySelectorAll('.tag').length === 0) {
              // @ts-ignore
              this.selectInputEl.style.width = 'auto'; // @ts-ignore
              this.selectInputEl.placeholder = this.defaultPlaceholder;
            }
          }
        } else {
          this.clear();
          this.dispatchEvent(new CustomEvent('onClear', { detail: ev })); //向外派发清理事件
        } // @ts-ignore
      } else if (ev.key === 'Enter') {
        if (!this.canInsert) {
          let filter = [...this.querySelectorAll('lit-select-option')].filter(
            // @ts-ignore
            (a: unknown) => a.style.display !== 'none'
          );
          if (filter.length > 0) {
            // @ts-ignore
            this.selectInputEl.value = filter[0].textContent; // @ts-ignore
            this.selectInputEl.placeholder = filter[0].textContent;
            this.blur();
            // @ts-ignore
            this.value = filter[0].getAttribute('value');
            this.dispatchEvent(
              new CustomEvent('change', {
                detail: {
                  selected: true,
                  value: filter[0].getAttribute('value'),
                  text: filter[0].textContent,
                },
              })
            );
          }
        } // @ts-ignore
      } else if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        // @ts-ignore
        ev.preventDefault();
      }
    };
  }

  initOptions(): void {
    this.querySelectorAll('lit-select-option').forEach((a) => {
      if (this.isMultiple()) {
        a.setAttribute('check', '');
        if (a.getAttribute('value') === this.defaultValue) {
          let tag = this.newTag(a.getAttribute('value'), a.textContent); // @ts-ignore
          this.selectMultipleRootEl.insertBefore(tag, this.selectInputEl); // @ts-ignore
          this.selectInputEl.placeholder = ''; // @ts-ignore
          this.selectInputEl.value = ''; // @ts-ignore
          this.selectInputEl.style.width = '1px';
          a.setAttribute('selected', '');
        }
      } else {
        if (a.hasAttribute('selected')) {
          a.removeAttribute('selected');
        }
        if (a.getAttribute('value') === this.defaultValue) {
          // @ts-ignore
          this.selectInputEl.value = a.textContent;
          a.setAttribute('selected', '');
        }
      }
      a.addEventListener('mouseup', (e) => {
        e.stopPropagation();
      });
      a.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      this.onSelectedEvent(a);
    });
  }

  onSelectedEvent(a: Element): void {
    a.addEventListener('onSelected', (e: unknown) => {
      if (this.isMultiple()) {
        if (a.hasAttribute('selected')) {
          // @ts-ignore
          let tag = this.shadowRoot!.querySelector(`div[data-value=${e.detail.value}]`) as HTMLElement;
          if (tag) {
            tag.parentElement!.removeChild(tag);
          } // @ts-ignore
          e.detail.selected = false;
        } else {
          // @ts-ignore
          let tag = this.newTag(e.detail.value, e.detail.text); // @ts-ignore
          this.selectMultipleRootEl.insertBefore(tag, this.selectInputEl); // @ts-ignore
          this.selectInputEl.placeholder = ''; // @ts-ignore
          this.selectInputEl.value = ''; // @ts-ignore
          this.selectInputEl.style.width = '1px';
        }
        if (this.shadowRoot!.querySelectorAll('.tag').length === 0) {
          // @ts-ignore
          this.selectInputEl.style.width = 'auto'; // @ts-ignore
          this.selectInputEl.placeholder = this.defaultPlaceholder;
        } // @ts-ignore
        this.selectInputEl.focus();
      } else {
        [...this.querySelectorAll('lit-select-option')].forEach((item) => {
          if (item.hasAttribute('selected')) {
            this.currentSelectedValue = item.getAttribute('value') || '';
          }
          item.removeAttribute('selected');
        });
        this.blur(); // @ts-ignore
        this.bodyEl!.style.display = 'none';
        // @ts-ignore
        this.selectInputEl.value = e.detail.text;
      }
      if (a.getAttribute('value') === this.currentSelectedValue) {
        a.removeAttribute('selected');
        this.currentSelectedValue = '';
        // @ts-ignore
        this.selectInputEl.value = '';
        // @ts-ignore
        this.selectInputEl.placeholder = this.defaultPlaceholder;
      } else {
        this.currentSelectedValue = a.getAttribute('value') || '';
        a.setAttribute('selected', '');
      }
      this.value = this.currentSelectedValue;
      // @ts-ignore
      this.dispatchEvent(new CustomEvent('change', { detail: { selectValue: this.currentSelectedValue, text: e.detail.text } })); //向外层派发change事件，返回当前选中项
    });
  }

  clear(): void {
    // @ts-ignore
    this.selectInputEl.value = ''; // @ts-ignore
    this.selectInputEl.placeholder = this.defaultPlaceholder;
  }

  reset(): void {
    this.querySelectorAll('lit-select-option').forEach((a) => {
      [...this.querySelectorAll('lit-select-option')].forEach((a) => a.removeAttribute('selected'));
      if (a.getAttribute('value') === this.defaultValue) {
        // @ts-ignore
        this.selectInputEl.value = a.textContent;
        a.setAttribute('selected', '');
      }
    });
  }

  disconnectedCallback(): void { }

  adoptedCallback(): void { }

  attributeChangedCallback(name: unknown, oldValue: unknown, newValue: unknown): void {
    if (name === 'value' && this.selectInputEl) {
      if (newValue) {
        [...this.querySelectorAll('lit-select-option')].forEach((a) => {
          if (a.getAttribute('value') === newValue) {
            this.currentSelectedValue = a.getAttribute('value') || '';
            a.setAttribute('selected', ''); // @ts-ignore
            this.selectInputEl.value = a.textContent;
          } else {
            a.removeAttribute('selected');
          }
        });
      } else {
        this.clear();
      }
    }
  }
}
