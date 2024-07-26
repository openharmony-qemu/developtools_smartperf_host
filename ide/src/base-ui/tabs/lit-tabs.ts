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
import { LitTabpane } from './lit-tabpane';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { LitTabsHtml } from './lit-tabs.html';

@element('lit-tabs')
export class LitTabs extends HTMLElement {
  private tabPos: unknown;
  private nav: HTMLDivElement | undefined | null;
  private line: HTMLDivElement | undefined | null;
  private slots: HTMLSlotElement | undefined | null;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = LitTabsHtml;
  }

  static get observedAttributes(): string[] {
    return ['activekey', 'mode', 'position'];
  }

  get position(): string {
    return this.getAttribute('position') || 'top';
  }

  set position(value) {
    this.setAttribute('position', value);
  }

  get mode(): string {
    return this.getAttribute('mode') || 'flat';
  }

  set mode(value) {
    this.setAttribute('mode', value);
  }

  get activekey(): string {
    return this.getAttribute('activekey') || '';
  }

  set activekey(value: string) {
    this.setAttribute('activekey', value);
  }

  set onTabClick(fn: unknown) {
    //@ts-ignore
    this.addEventListener('onTabClick', fn);
  }

  updateLabel(key: string, value: string): void {
    if (this.nav) {
      let item = this.nav.querySelector(`.nav-item[data-key='${key}']`);
      if (item) {
        item.querySelector<HTMLSpanElement>('span')!.innerHTML = value;
        this.initTabPos();
      }
    }
  }

  updateDisabled(key: string, value: string): void {
    if (this.nav) {
      let item = this.nav.querySelector(`.nav-item[data-key='${key}']`);
      if (item) {
        if (value) {
          item.setAttribute('data-disabled', '');
        } else {
          item.removeAttribute('data-disabled');
        }
        this.initTabPos();
      }
    }
  }

  updateCloseable(key: string, value: string): void {
    if (this.nav) {
      let item = this.nav.querySelector(`.nav-item[data-key='${key}']`);
      if (item) {
        if (value) {
          item.setAttribute('data-closeable', '');
        } else {
          item.removeAttribute('data-closeable');
        }
        this.initTabPos();
      }
    }
  }

  updateHidden(key: string, value: string): void {
    if (this.nav) {
      let item = this.nav.querySelector(`.nav-item[data-key='${key}']`);
      if (item) {
        if (value === 'true') {
          item.setAttribute('data-hidden', '');
        } else {
          item.removeAttribute('data-hidden');
        }
        this.initTabPos();
      }
    }
  }

  initTabPos(): void {
    const items = this.nav!.querySelectorAll<HTMLDivElement>('.nav-item');
    Array.from(items).forEach((a, index) => {
      // @ts-ignore
      this.tabPos[a.dataset.key] = {
        index: index,
        width: a.offsetWidth,
        height: a.offsetHeight,
        left: a.offsetLeft,
        top: a.offsetTop,
        label: a.textContent,
      };
    });
    if (this.activekey) {
      if (this.position.startsWith('left')) {
        this.line?.setAttribute(
          'style', //@ts-ignore
          `height:${this.tabPos[this.activekey].height}px;transform:translate(100%,${
            //@ts-ignore
            this.tabPos[this.activekey].top
          }px)`
        );
      } else if (this.position.startsWith('top')) {
        //@ts-ignore
        if (this.tabPos[this.activekey]) {
          this.line?.setAttribute(
            'style', //@ts-ignore
            `width:${this.tabPos[this.activekey].width}px;transform:translate(${
              //@ts-ignore
              this.tabPos[this.activekey].left
            }px,100%)`
          );
        }
      } else if (this.position.startsWith('right')) {
        this.line?.setAttribute(
          'style', //@ts-ignore
          `height:${this.tabPos[this.activekey].height}px;transform:translate(-100%,${
            //@ts-ignore
            this.tabPos[this.activekey].top
          }px)`
        );
      } else if (this.position.startsWith('bottom')) {
        this.line?.setAttribute(
          'style', //@ts-ignore
          `width:${this.tabPos[this.activekey].width}px;transform:translate(${this.tabPos[this.activekey].left}px,100%)`
        );
      }
    }
  }

  connectedCallback(): void {
    this.tabPos = {};
    this.nav = this.shadowRoot?.querySelector('#nav');
    this.line = this.shadowRoot?.querySelector('#tab-line');
    this.slots = this.shadowRoot?.querySelector('#slot');
    this.slots?.addEventListener('slotchange', () => {
      const elements: Element[] | undefined = this.slots?.assignedElements();
      let panes = this.querySelectorAll<LitTabpane>('lit-tabpane');
      if (this.activekey) {
        panes.forEach((a) => {
          if (a.key === this.activekey) {
            a.style.display = 'block';
          } else {
            a.style.display = 'none';
          }
        });
      } else {
        panes.forEach((a, index) => {
          if (index === 0) {
            a.style.display = 'block';
            this.activekey = a.key || '';
          } else {
            a.style.display = 'none';
          }
        });
      }
      this.setItemNode(elements);
    });
    this.nav!.onclick = (e): void => {
      if ((e.target! as HTMLElement).closest('div')!.hasAttribute('data-disabled')) {
        return;
      }
      let key = (e.target! as HTMLElement).closest('div')!.dataset.key;
      if (key) {
        this.activeByKey(key);
      }
      let label = (e.target! as HTMLElement).closest('div')!.querySelector('span')!.textContent;
      this.dispatchEvent(
        new CustomEvent('onTabClick', {
          detail: { key: key, tab: label },
        })
      );
    };

    new ResizeObserver((entries) => {
      let filling = this.shadowRoot!.querySelector<HTMLDivElement>('#tab-filling');

      this.shadowRoot!.querySelector<HTMLDivElement>('.tab-nav-vessel')!.style.height = filling!.offsetWidth + 'px';
    }).observe(this.shadowRoot!.querySelector('#tab-filling')!);
  }

  setItemNode(elements: Element[] | undefined): void {
    let navHtml: string = '';
    elements
      ?.map((it) => it as LitTabpane)
      .forEach((a) => {
        if (a.disabled) {
          navHtml += `<div class="nav-item" data-key="${a.key}" data-disabled ${a.closeable ? 'data-closeable' : ''}> 
                    ${a.icon ? `<lit-icon name='${a.icon}'></lit-icon>` : ''} 
                    <span>${a.tab}</span>
                    <lit-icon class="close-icon" name='close' size="16"></lit-icon><div class="no-close-icon" style="margin-right: 12px"></div>
                    </div>`;
        } else if (a.hidden) {
          navHtml += `<div class="nav-item" data-key="${a.key}" data-hidden ${a.closeable ? 'data-closeable' : ''}> 
                    ${a.icon ? `<lit-icon name='${a.icon}'></lit-icon>` : ''} 
                    <span>${a.tab}</span>
                    <lit-icon class="close-icon" name='close' size="16"></lit-icon><div class="no-close-icon" style="margin-right: 12px"></div>
                    </div>`;
        } else {
          if (a.key === this.activekey) {
            navHtml += `<div class="nav-item" data-key="${a.key}" data-selected ${a.closeable ? 'data-closeable' : ''}>
                        ${a.icon ? `<lit-icon name='${a.icon}'></lit-icon>` : ''}
                        <span>${a.tab}</span>
                        <lit-icon class="close-icon" name='close' size="16"></lit-icon><div class="no-close-icon" style="margin-right: 12px"></div>
                        </div>`;
          } else {
            navHtml += `<div class="nav-item" data-key="${a.key}" ${a.closeable ? 'data-closeable' : ''}>
                            ${a.icon ? `<lit-icon name='${a.icon}'></lit-icon>` : ''}
                            <span>${a.tab}</span>
                            <lit-icon class="close-icon" name='close' size="16"></lit-icon><div class="no-close-icon" style="margin-right: 12px"></div>
                            </div>`;
          }
        }
      });
    this.nav!.innerHTML = navHtml;
    this.initTabPos();
    this.nav!.querySelectorAll<HTMLElement>('.close-icon').forEach((a) => {
      a.onclick = (e): void => {
        e.stopPropagation();
        const closeKey = (e.target! as HTMLElement).parentElement!.dataset.key;
        this.dispatchEvent(
          new CustomEvent('close-handler', {
            detail: { key: closeKey },
            composed: true,
          })
        );
      };
    });
  }

  activeByKey(key: string, isValid: boolean = true): void {
    if (key === null || key === undefined) {
      return;
    } //如果没有key 不做相应
    this.nav!.querySelectorAll('.nav-item').forEach((a) => {
      if (a.querySelector('span')?.innerText === 'Comparison') {
        a.setAttribute('id', 'nav-comparison');
      }
      if (a.getAttribute('data-key') === key) {
        a.setAttribute('data-selected', 'true');
        this.byKeyIsValid(isValid, a);
      } else {
        a.removeAttribute('data-selected');
      }
    });
    let tbp = this.querySelector(`lit-tabpane[key='${key}']`);
    let panes = this.querySelectorAll<LitTabpane>('lit-tabpane');
    panes.forEach((a) => {
      if (a.key === key) {
        a.style.display = 'block';
        this.activekey = a.key;
        this.initTabPos();
      } else {
        a.style.display = 'none';
      }
    });
  }

  byKeyIsValid(isValid: boolean, a: Element): void {
    if (isValid) {
      let span = a.querySelector('span') as HTMLSpanElement;
      let title = span.innerText;
      let rowType = document
        .querySelector<HTMLElement>('sp-application')!
        .shadowRoot?.querySelector<HTMLElement>('sp-system-trace')!
        .getAttribute('clickRow');
      if (title === 'Counters' || title === 'Thread States') {
        title += `(${rowType})`;
      }
      if (title === 'Analysis') {
        let rowId = document
          .querySelector<HTMLElement>('sp-application')!
          .shadowRoot?.querySelector<HTMLElement>('sp-system-trace')!
          .getAttribute('rowId');
        if (rowId!.indexOf('DiskIOLatency') > -1) {
          title += '(disk-io)';
        } else if (rowId!.indexOf('VirtualMemory') > -1) {
          title += '(virtual-memory-cell)';
        } else {
          title += `(${rowType})`;
        }
      }
      if (title === 'Slices' || title === 'Current Selection') {
        let rowName = document
          .querySelector<HTMLElement>('sp-application')!
          .shadowRoot?.querySelector<HTMLElement>('sp-system-trace')!
          .getAttribute('rowName');
        if (rowName && rowName!.indexOf('deliverInputEvent') > -1) {
          title += '(deliverInputEvent)';
        } else {
          let rowType = document
            .querySelector<HTMLElement>('sp-application')!
            .shadowRoot?.querySelector<HTMLElement>('sp-system-trace')!
            .getAttribute('clickRow');
          title += `(${rowType})`;
        }
      }
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: title,
        action: 'trace_tab',
      });
    }
  }

  activePane(key: string): boolean {
    if (key === null || key === undefined) {
      return false;
    }
    let tbp = this.querySelector(`lit-tabpane[key='${key}']`);
    if (tbp) {
      this.activeByKey(key);
      return true;
    } else {
      return false;
    }
  }

  disconnectedCallback(): void {}

  adoptedCallback(): void {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'activekey' && this.nav && oldValue !== newValue && newValue !== '') {
      this.activeByKey(newValue, false);
    }
  }
}
