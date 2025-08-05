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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import '../../../../base-ui/select/LitSelect';
import '../../../../base-ui/select/LitSelectOption';
import '../../../../base-ui/icon/LitIcon';
import { LitIcon } from '../../../../base-ui/icon/LitIcon';
import '../../../../base-ui/popover/LitPopoverV';
import { LitCheckBox } from '../../../../base-ui/checkbox/LitCheckBox';
import { LitSelect } from '../../../../base-ui/select/LitSelect';
import { queryTransferList } from '../../../database/sql/Perf.sql';
import { TabPaneFilterHtml } from './TabPaneFilter.html';
import { SpSystemTrace } from '../../SpSystemTrace';

export interface FilterData {
  inputValue: string;
  firstSelect: string | null | undefined;
  secondSelect: string | null | undefined;
  thirdSelect: string | null | undefined;
  mark: boolean | null | undefined;
  icon: string | null;
  type: string;
}

export interface MiningData {
  type: string;
  item: unknown | null | undefined;
  remove?: Array<unknown> | null | undefined;
}

export class CpuStatus {
  cpu: number = 0;
  little: boolean = false;
  medium: boolean = false;
  big: boolean = false;
}

@element('tab-pane-filter')
export class TabPaneFilter extends BaseElement {
  private filterInputEL: HTMLInputElement | null | undefined;
  private firstSelectEL: HTMLSelectElement | null | undefined;
  private secondSelectEL: HTMLSelectElement | null | undefined;
  private thirdSelectEL: LitSelect | null | undefined;
  private markButtonEL: HTMLButtonElement | null | undefined;
  private iconEL: LitIcon | null | undefined;
  private statisticsName: HTMLDivElement | null | undefined;
  private getFilter: ((e: FilterData) => void) | undefined;
  private getMining: ((e: MiningData) => void) | undefined;
  private getLibrary: ((e: MiningData) => void) | undefined;
  private getCallTree: ((e: unknown) => void) | undefined;
  private getCallTreeConstraints: ((e: unknown) => void) | undefined;
  private getStatisticsType: ((e: unknown) => void) | undefined;
  private getCallTransfer: ((e: unknown) => void) | undefined;

  private cutList: Array<unknown> | undefined;
  private libraryList: Array<unknown> | undefined;
  private transferChecked: string | undefined;
  private isStatisticsMem: boolean = false;

  get isStatisticsMemory(): boolean {
    return this.isStatisticsMem;
  }
  set isStatisticsMemory(value) {
    let hideThreadEL = this.shadowRoot?.querySelector('.popover .tree-check:nth-child(4)');
    if (value) {
      hideThreadEL?.classList.add('hide');
    } else {
      if (hideThreadEL!.classList.contains('hide')) {
        hideThreadEL!.classList.remove('hide');
      }
    }
  }

  filterData(
    type: string,
    data: object = {}
  ): {
    type: string;
    inputValue: string;
    firstSelect: string | undefined;
    secondSelect: string | undefined;
    thirdSelect: string | undefined;
    mark: boolean;
    icon: string;
  } {
    return {
      type: type,
      inputValue: this.filterInputEL!.value,
      firstSelect: this.firstSelectEL?.value,
      secondSelect: this.secondSelectEL?.value,
      thirdSelect: this.thirdSelectEL?.value,
      mark: false,
      icon: this.icon,
      ...data,
    };
  }

  showThird(b: boolean): void {
    if (b) {
      if (this.thirdSelectEL?.value) {
        this.setAttribute('third', '');
      } else {
        this.removeAttribute('third');
      }
    } else {
      this.removeAttribute('third');
    }
  }

  disabledTransfer(b: boolean, str?: string): void {
    if (b) {
      this.setAttribute('disableTransfer', '');
    } else {
      if (str === 'perf') {
        this.setAttribute('perf', 'perf');
      }
      this.removeAttribute('disableTransfer');
    }
  }

  initElements(): void {
    this.cutList = [];
    this.libraryList = [];
    this.filterInputEL = this.shadowRoot?.querySelector('#pane-filter-input');
    this.markButtonEL = this.shadowRoot?.querySelector('#mark');
    this.iconEL = this.shadowRoot?.querySelector<LitIcon>('#icon');
    this.statisticsName = this.shadowRoot?.querySelector<HTMLDivElement>('.statistics-name');
    let transferEL = this.shadowRoot?.querySelector<HTMLDivElement>('.transfer-text');
    transferEL!.onclick = (): void => {
      this.getTransferList();
    };
    this.setSelectList();
    this.initializeCallTree();
    this.initializeTreeConstraints();
    this.initializeMining();
    this.initializeLibrary();
    this.initBaseElListener();
    this.queryElListener();
    this.filterInputEL?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.stopPropagation();
      }
    });
  }

  private queryElListener(): void {
    this.shadowRoot!.querySelectorAll<HTMLDivElement>('.mining-button').forEach(
      (e: HTMLDivElement, idx: number): void => {
        this.miningButtonClickListener(e, idx);
      }
    );
    this.shadowRoot!.querySelector<HTMLDivElement>('.library-button')!.onclick = (ev): void => {
      // @ts-ignore
      const restoreList = this.libraryList!.filter((item) => item.highlight === true);
      // @ts-ignore
      const list = this.libraryList!.filter((item) => item.highlight === false);
      this.libraryList = list;
      if (this.getLibrary) {
        this.getLibrary({
          type: 'button',
          item: 'restore',
          remove: restoreList,
        });
      }
      this.initializeLibrary();
    };
    this.shadowRoot!.querySelector<HTMLDivElement>('#data-mining')!.onclick = (e): void => {
      if (this.getMining) {
        this.getMining({ type: 'button', item: 'symbol' });
      }
    };
    this.shadowRoot!.querySelector<HTMLDivElement>('#data-library')!.onclick = (e): void => {
      if (this.getLibrary) {
        this.getLibrary({ type: 'button', item: 'library' });
      }
    };
    this.shadowRoot!.querySelector<HTMLDivElement>('.sort')!.onclick = (e): void => {
      let statisticsType = this.statisticsName!.textContent === 'Statistics by Operation';
      this.statisticsName!.textContent = statisticsType ? 'Statistics by Thread' : 'Statistics by Operation';
      if (this.getStatisticsType) {
        this.getStatisticsType(statisticsType ? 'thread' : 'operation');
      }
    };
  }

  private initBaseElListener(): void {
    this.iconEL!.onclick = (): void => {
      if (this.iconEL!.name === 'statistics') {
        this.iconEL!.name = 'menu';
        this.iconEL!.size = 18;
        if (this.getFilter) {
          this.getFilter(this.filterData('icon'));
        }
        if (this.getAttribute('perf') === 'perf') {
          this.disabledTransfer(false);
        }
      } else if (this.iconEL!.name === 'menu') {
        this.iconEL!.name = 'statistics';
        this.iconEL!.size = 16;
        if (this.getFilter) {
          this.getFilter(this.filterData('icon'));
        }
        if (this.getAttribute('perf') === 'perf') {
          this.disabledTransfer(true);
        }
      }
    };
    this.markButtonEL!.onclick = (): void => {
      if (this.getFilter) {
        this.getFilter(this.filterData('mark', { mark: true }));
      }
    };
    this.filterInputEL?.addEventListener('keyup', (event: unknown): void => {
      // @ts-ignore
      if (event.keyCode === 13 && this.getFilter) {
        this.getFilter(
          this.filterData('inputValue', {
            // @ts-ignore
            inputValue: event.target.value,
          })
        );
      }
      // @ts-ignore
      event.stopPropagation();
    });
    this.filterInputEL?.addEventListener('keypress', (event: unknown): void => {
      // @ts-ignore
      event.stopPropagation();
    });
  }

  private miningButtonClickListener(e: HTMLDivElement, idx: number): void {
    e!.onclick = (ev): void => {
      if (idx === 0) {
        // @ts-ignore
        const restoreList = this.cutList!.filter((item: unknown): boolean => item.highlight === true);
        // @ts-ignore
        const list = this.cutList!.filter((item): boolean => item.highlight === false);
        this.cutList = list;
        if (this.getMining) {
          this.getMining({
            type: 'button',
            item: 'restore',
            remove: restoreList,
          });
        }
        this.initializeMining();
      }
    };
  }

  set firstSelect(value: string) {
    this.firstSelectEL!.value = value;
  }

  get firstSelect(): string {
    return this.firstSelectEL?.value || '';
  }

  set secondSelect(value: string) {
    this.secondSelectEL!.value = value;
  }

  get secondSelect(): string {
    return this.secondSelectEL?.value || '';
  }

  set filterValue(value: string) {
    this.filterInputEL!.value = value;
  }

  get filterValue(): string {
    return this.filterInputEL!.value;
  }

  set thirdSelect(value: string) {
    this.thirdSelectEL!.value = value;
  }

  get thirdSelect(): string {
    return this.thirdSelectEL?.value || '';
  }

  get inputPlaceholder(): string {
    return this.getAttribute('inputPlaceholder') || 'Detail Filter';
  }

  get icon(): string {
    if (this.getAttribute('icon') !== 'false') {
      if (this.iconEL!.name === 'statistics') {
        return 'tree';
      } else if (this.iconEL!.name === 'menu') {
        return 'block';
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  set icon(value: string) {
    if (value === 'block') {
      this.iconEL!.name = 'menu';
      this.iconEL!.size = 18;
    } else if (value === 'tree') {
      this.iconEL!.name = 'statistics';
      this.iconEL!.size = 16;
    }
  }

  get disabledMining(): boolean {
    return this.hasAttribute('disabledMining');
  }

  set disabledMining(value: boolean) {
    if (value) {
      this.setAttribute('disabledMining', '');
    } else {
      this.removeAttribute('disabledMining');
    }
  }

  setFilterModuleSelect(module: string, styleName: unknown, value: unknown): void {
    // @ts-ignore
    this.shadowRoot!.querySelector<HTMLDivElement>(module)!.style[styleName] = value;
  }

  getCallTreeData(getCallTree: (v: unknown) => void): void {
    this.getCallTree = getCallTree;
  }

  getCallTransferData(getCallTransfer: (v: unknown) => void): void {
    this.getCallTransfer = getCallTransfer;
  }

  getCallTreeConstraintsData(getCallTreeConstraints: (v: unknown) => void): void {
    this.getCallTreeConstraints = getCallTreeConstraints;
  }

  getFilterData(getFilter: (v: FilterData) => void): void {
    this.getFilter = getFilter;
  }

  getStatisticsTypeData(getStatisticsType: (v: unknown) => void): void {
    this.getStatisticsType = getStatisticsType;
  }

  setSelectList(
    firstList: Array<unknown> | null | undefined = ['All Allocations', 'Created & Existing', 'Created & Destroyed'],
    secondList: Array<unknown> | null | undefined = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'],
    firstTitle = 'Allocation Lifespan',
    secondTitle = 'Allocation Type',
    thirdList: Array<unknown> | null | undefined = null,
    thirdTitle = 'Responsible Library'
  ): void {
    let sLE = this.shadowRoot?.querySelector('#load');
    let html = '';
    html = this.getSelectFirstListHtml(firstTitle, firstList, html);
    html = this.getSelectSecondListHtml(secondTitle, secondList, html);
    let thtml = this.getSelectThirdListHtml(thirdTitle, thirdList);
    if (!firstList && !secondList) {
      this.thirdSelectEL!.outerHTML = thtml;
      this.thirdSelectEL = this.shadowRoot?.querySelector('#third-select');
      this.thirdSelectEL!.onchange = (e): void => {
        if (this.getFilter) {
          this.getFilter(this.filterData('thirdSelect'));
        }
      };
      return;
    }
    if (!firstList) {
      this.secondSelectEL!.outerHTML = html;
    } else if (!secondList) {
      this.firstSelectEL!.outerHTML = html;
    } else {
      sLE!.innerHTML = html + thtml;
    }
    this.thirdSelectEL = this.shadowRoot?.querySelector('#third-select');
    this.thirdSelectEL!.outerHTML = thtml;
    this.thirdSelectEL = this.shadowRoot?.querySelector('#third-select');

    this.firstSelectEL = this.shadowRoot?.querySelector('#first-select');
    this.secondSelectEL = this.shadowRoot?.querySelector('#second-select');
    this.initSelectElListener();
  }

  private getSelectThirdListHtml(thirdTitle: string, thirdList: Array<unknown> | null | undefined): string {
    let thtml = '';
    if (thirdList) {
      this.setAttribute('third', '');
    }
    thtml += `<lit-select show-search default-value="" id="third-select" class="spacing" placeholder="please choose">`;
    if (thirdList) {
      if (thirdTitle !== '') {
        thtml += `<lit-select-option  value="${thirdTitle}" disabled>${thirdTitle}</lit-select-option>`;
      }
      thirdList!.forEach((a, b) => {
        thtml += `<lit-select-option value="${b}">${a}</lit-select-option>`;
      });
    }
    thtml += '</lit-select>';
    return thtml;
  }

  private getSelectSecondListHtml(
    secondTitle: string,
    secondList: Array<unknown> | null | undefined,
    html: string
  ): string {
    if (secondList) {
      html += `<lit-select default-value="" id="second-select" class="spacing" placeholder="please choose" tabselect>`;
      if (secondTitle !== '') {
        html += `<lit-select-option value="${secondTitle}" disabled>${secondTitle}</lit-select-option>`;
      }
      secondList!.forEach((a, b) => {
        html += `<lit-select-option value="${b}">${a}</lit-select-option>`;
      });
      html += `</lit-select>`;
    }
    return html;
  }

  private getSelectFirstListHtml(
    firstTitle: string,
    firstList: Array<unknown> | null | undefined,
    html: string
  ): string {
    if (firstList) {
      html += `<lit-select default-value="" id="first-select" class="spacing" placeholder="please choose" tabselect>`;
      if (firstTitle !== '') {
        html += `<lit-select-option value="${firstTitle}" disabled>${firstTitle}</lit-select-option>`;
      }
      firstList!.forEach((a, b) => {
        html += `<lit-select-option value="${b}">${a}</lit-select-option>`;
      });
      html += `</lit-select>`;
    }
    return html;
  }

  private initSelectElListener(): void {
    this.firstSelectEL!.onchange = (e): void => {
      if (this.getFilter) {
        this.getFilter(this.filterData('firstSelect'));
      }
    };
    this.secondSelectEL!.onchange = (e): void => {
      if (this.getFilter) {
        this.getFilter(this.filterData('secondSelect'));
      }
    };
    this.thirdSelectEL!.onchange = (e): void => {
      if (this.getFilter) {
        this.getFilter(this.filterData('thirdSelect'));
      }
    };
  }

  setOptionsList(list: Array<unknown>): void {
    let divEl = this.shadowRoot!.querySelector('#check-popover > div');
    divEl!.innerHTML = '';
    for (let text of list) {
      // @ts-ignore
      let idName = text.replace(/\s/g, '');
      idName = idName[0].toLocaleLowerCase() + idName.slice(1);
      divEl!.innerHTML += `<div class="check-wrap"><lit-check-box class="lit-check-box" id=${idName} not-close></lit-check-box><div>${text}</div></div>`;
    }
  }

  //添加cpu列表
  setCoreConfigList(count: number, little: Array<number>, mid: Array<number>, big: Array<number>): void {
    let divEl = this.shadowRoot!.querySelector('#data-core-popover > div > #tb_core_setting');
    divEl!.innerHTML = '';
    this.createCoreHeaderDiv(divEl);
    for (let i = 0; i < count; i++) {
      let obj = {
        cpu: i,
        // @ts-ignore
        little: little.includes(i),
        // @ts-ignore
        medium: mid.includes(i),
        // @ts-ignore
        big: big.includes(i),
      };
      this.createCheckBoxLine(divEl, obj, little, mid, big);
    }
  }

  createCoreHeaderDiv(tab: unknown): void {
    let cpuIdLine = document.createElement('div');
    cpuIdLine.className = 'core_line';
    cpuIdLine.style.fontWeight = 'bold';
    cpuIdLine.style.fontSize = '12px';
    cpuIdLine.textContent = 'Cpu';
    cpuIdLine.style.textAlign = 'center';
    let littleLine = document.createElement('div');
    littleLine.className = 'core_line';
    littleLine.style.fontWeight = 'bold';
    littleLine.textContent = 'L';
    littleLine.style.fontSize = '12px';
    littleLine.style.textAlign = 'center';
    let mediumLine = document.createElement('div');
    mediumLine.className = 'core_line';
    mediumLine.style.fontWeight = 'bold';
    mediumLine.textContent = 'M';
    mediumLine.style.fontSize = '12px';
    mediumLine.style.textAlign = 'center';
    let bigLine = document.createElement('div');
    bigLine.className = 'core_line';
    bigLine.style.fontWeight = 'bold';
    bigLine.textContent = 'B';
    bigLine.style.fontSize = '12px';
    bigLine.style.textAlign = 'center';
    // @ts-ignore
    tab?.append(...[cpuIdLine, littleLine, mediumLine, bigLine]);
  }

  //添加对应的cpu checkbox,并添加对应的监听事件
  createCheckBoxLine(
    divEl: unknown,
    cpuStatus: CpuStatus,
    little: Array<number>,
    mid: Array<number>,
    big: Array<number>
  ): void {
    let div = document.createElement('div');
    div.textContent = cpuStatus.cpu + '';
    div.style.textAlign = 'center';
    div.style.fontWeight = 'normal';
    let littleCheckBox: LitCheckBox = new LitCheckBox();
    littleCheckBox.checked = cpuStatus.little;
    littleCheckBox.setAttribute('not-close', '');
    littleCheckBox.style.textAlign = 'center';
    littleCheckBox.style.marginLeft = 'auto';
    littleCheckBox.style.marginRight = 'auto';
    let midCheckBox: LitCheckBox = new LitCheckBox();
    midCheckBox.checked = cpuStatus.medium;
    midCheckBox.setAttribute('not-close', '');
    midCheckBox.style.textAlign = 'center';
    midCheckBox.style.marginLeft = 'auto';
    midCheckBox.style.marginRight = 'auto';
    let bigCheckBox: LitCheckBox = new LitCheckBox();
    bigCheckBox.checked = cpuStatus.big;
    bigCheckBox.setAttribute('not-close', '');
    bigCheckBox.style.marginLeft = 'auto';
    bigCheckBox.style.marginRight = 'auto';
    littleCheckBox.addEventListener('change', (e: unknown) => {
      midCheckBox.checked = false;
      bigCheckBox.checked = false;
      // @ts-ignore
      cpuStatus.little = e.detail.checked;
      // @ts-ignore
      this.canUpdateCheckList(e.detail.checked, little, cpuStatus.cpu);
      mid = mid.filter((it) => it !== cpuStatus.cpu);
      big = big.filter((it) => it !== cpuStatus.cpu);
    });
    midCheckBox.addEventListener('change', (e: unknown) => {
      bigCheckBox.checked = false;
      littleCheckBox.checked = false;
      // @ts-ignore
      cpuStatus.medium = e.detail.checked;
      // @ts-ignore
      this.canUpdateCheckList(e.detail.checked, mid, cpuStatus.cpu);
      big = big.filter((it) => it !== cpuStatus.cpu);
      little = little.filter((it) => it !== cpuStatus.cpu);
    });
    bigCheckBox.addEventListener('change', (e: unknown) => {
      midCheckBox.checked = false;
      littleCheckBox.checked = false;
      // @ts-ignore
      cpuStatus.big = e.detail.checked;
      // @ts-ignore
      this.canUpdateCheckList(e.detail.checked, big, cpuStatus.cpu);
      mid = mid.filter((it) => it !== cpuStatus.cpu);
      little = little.filter((it) => it !== cpuStatus.cpu);
    });
    // @ts-ignore
    divEl!.append(...[div, littleCheckBox, midCheckBox, bigCheckBox]);
  }

  //判断checkList数组是否需要push数据或删除数据
  canUpdateCheckList(check: boolean, coreArr: Array<number>, cpu: number): void {
    if (check) {
      const isFalse = coreArr.includes(cpu);
      if (!isFalse) {
        coreArr.push(cpu);
      }
    } else {
      const index = coreArr.indexOf(cpu);
      if (index !== -1) {
        coreArr.splice(index, 1);
      }
    }
  }

  private treeCheckClickSwitch(idx: number, check: boolean, row: NodeListOf<Element>): void {
    let checkList = [];
    for (let index = 0; index < 6; index++) {
      if (idx === index) {
        checkList.push(check);
      } else {
        checkList.push(row[index].querySelector<LitCheckBox>('lit-check-box')!.checked);
      }
    }
    this.getCallTree!({
      checks: checkList,
      value: idx,
    });
  }

  initializeCallTree(): void {
    let row = this.shadowRoot!.querySelectorAll('.tree-check');
    row.forEach((e, idx): void => {
      let check = e.querySelector<LitCheckBox>('lit-check-box');
      e.querySelector('div')!.onclick = (ev): void => {
        if (this.getCallTree) {
          this.treeCheckClickSwitch(idx, !check!.checked, row);
        }
        check!.checked = !check!.checked;
      };
      check!.onchange = (ev: unknown): void => {
        if (this.getCallTree) {
          // @ts-ignore
          this.treeCheckClickSwitch(idx, ev.target.checked, row);
        }
      };
    });
  }

  initializeTreeTransfer(): void {
    let radioList = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.radio');
    let divElement = this.shadowRoot!.querySelectorAll<HTMLDivElement>('.tree-radio');

    if (this.transferChecked && this.transferChecked !== 'count') {
      radioList![Number(this.transferChecked)].checked = true;
    } else if (this.transferChecked && this.transferChecked === 'count') {
      radioList![radioList.length - 1].checked = true;
    }

    divElement!.forEach((divEl, idx) => {
      divEl.addEventListener('click', () => {
        let filterData = this.getFilterTreeData();
        if (filterData.callTree[0] === true || filterData.callTree[1] === true) {
          let row = this.shadowRoot!.querySelectorAll<LitCheckBox>('.tree-check lit-check-box');
          row[0].checked = false;
          row[1].checked = false;
        }
        if (filterData.callTreeConstraints.checked === true) {
          let check = this.shadowRoot!.querySelector<LitCheckBox>('#constraints-check');
          let inputs = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.constraints-input');
          check!.checked = false;
          inputs[0].value = '0';
          inputs[1].value = '∞';
        }
        this.filterInputEL!.value = '';
        this.transferChecked = radioList![idx].value;
        radioList![idx].checked = true;
        if (this.getCallTransfer) {
          this.getCallTransfer({
            value: radioList![idx].value,
          });
        }
      });
    });
  }

  refreshTreeTransfer(): void {
    let radioList = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.radio');
    if (this.transferChecked && this.transferChecked !== 'count') {
      radioList![Number(this.transferChecked)].checked = false;
    } else if (this.transferChecked && this.transferChecked === 'count') {
      radioList![radioList.length - 1].checked = false;
    }
    this.transferChecked = '';
  }

  initializeTreeConstraints(): void {
    let inputs = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.constraints-input');
    let check = this.shadowRoot!.querySelector<LitCheckBox>('#constraints-check');
    check!.onchange = (ev: unknown): void => {
      inputs.forEach((e: unknown, idx: number): void => {
        if (inputs[idx].value === '') {
          inputs[idx].value = idx === 0 ? '0' : '∞';
        }
        // @ts-ignore
        ev.target.checked ? e.removeAttribute('disabled') : e.setAttribute('disabled', '');
      });
      if (this.getCallTreeConstraints) {
        this.getCallTreeConstraints({
          // @ts-ignore
          checked: ev.target.checked,
          min: inputs[0].value,
          max: inputs[1].value,
        });
      }
    };
    inputs.forEach((e: HTMLInputElement, idx: number): void => {
      e.oninput = function (): void {
        // @ts-ignore
        this.value = this.value.replace(/\D/g, '');
      };
      e.addEventListener('keyup', (event: unknown): void => {
        // @ts-ignore
        event.stopPropagation();
        // @ts-ignore
        if (event.keyCode === 13) {
          // @ts-ignore
          if (event?.target.value === '') {
            inputs[idx].value = idx === 0 ? '0' : '∞';
          }
          if (this.getCallTreeConstraints) {
            this.getCallTreeConstraints({
              checked: check!.checked,
              // @ts-ignore
              min: idx === 0 ? event?.target.value : inputs[0].value,
              // @ts-ignore
              max: idx === 1 ? event?.target.value : inputs[1].value,
            });
          }
        }
      });
    });
  }

  initializeMining(): void {
    let html = '';
    this.cutList!.forEach((a: unknown, b: number): void => {
      // @ts-ignore
      html += `<div style="display: flex;padding: 4px 7px;" class="mining-checked" ${a.highlight ? 'highlight' : ''}>
                        <lit-check-box class="lit-check-box" not-close ${
        // @ts-ignore
        a.checked ? 'checked' : ''
        } style="display: flex"></lit-check-box>
                        
                        <div id="title" title="${
        // @ts-ignore
        a.name
        }">${
        // @ts-ignore
        a.name
        }</div></div>`;
    });

    this.shadowRoot!.querySelector<HTMLDivElement>('#mining-row')!.innerHTML = html;

    let row = this.shadowRoot!.querySelector('#mining-row')!.childNodes;
    row!.forEach((e: unknown, idx: number): void => {
      // @ts-ignore
      e!.querySelector('#title')!.onclick = (ev: unknown): void => {
        // @ts-ignore
        if (e.getAttribute('highlight') === '') {
          // @ts-ignore
          e.removeAttribute('highlight');
          // @ts-ignore
          this.cutList![idx].highlight = false;
        } else {
          // @ts-ignore
          e.setAttribute('highlight', '');
          // @ts-ignore
          this.cutList![idx].highlight = true;
        }
      };
      // @ts-ignore
      e!.querySelector<LitCheckBox>('lit-check-box')!.onchange = (ev): void => {
        // @ts-ignore
        this.cutList[idx].checked = e!.querySelector<LitCheckBox>('lit-check-box')!.checked;
        if (this.getMining) {
          this.getMining({ type: 'check', item: this.cutList![idx] });
        }
      };
    });
  }

  initializeLibrary(): void {
    let html = '';
    this.libraryList!.forEach((a: unknown, b: number): void => {
      // @ts-ignore
      html += `<div style="display: flex;padding: 4px 7px;" class="library-checked" ${a.highlight ? 'highlight' : ''}>
                        <lit-check-box class="lit-check-box" not-close ${
        // @ts-ignore
        a.checked ? 'checked' : ''
        } style="display: flex"></lit-check-box>
                        <div id="title" title="${
        // @ts-ignore
        a.name
        }">${
        // @ts-ignore
        a.name
        }</div></div>`;
    });

    this.shadowRoot!.querySelector<HTMLDivElement>('#library-row')!.innerHTML = html;

    let row = this.shadowRoot!.querySelector('#library-row')!.childNodes;
    row!.forEach((e: unknown, idx: number): void => {
      // @ts-ignore
      e!.querySelector('#title')!.onclick = (ev: unknown): void => {
        // @ts-ignore
        if (e.getAttribute('highlight') === '') {
          // @ts-ignore
          e.removeAttribute('highlight');
          // @ts-ignore
          this.libraryList![idx].highlight = false;
        } else {
          // @ts-ignore
          e.setAttribute('highlight', '');
          // @ts-ignore
          this.libraryList![idx].highlight = true;
        }
      };

      // @ts-ignore
      e!.querySelector<LitCheckBox>('lit-check-box')!.onchange = (ev: unknown): void => {
        // @ts-ignore
        this.libraryList[idx].checked = e!.querySelector<LitCheckBox>('lit-check-box')!.checked;
        if (this.getLibrary) {
          this.getLibrary({
            type: 'check',
            item: this.libraryList![idx],
          });
        }
      };
    });
  }

  getDataMining(getMining: (v: MiningData) => void): void {
    this.getMining = getMining;
  }

  getDataLibrary(getLibrary: (v: MiningData) => void): void {
    this.getLibrary = getLibrary;
  }

  addDataMining(data: unknown, type: string): number {
    let list: Array<unknown> = (type === 'symbol' ? this.cutList : this.libraryList) || [];
    // @ts-ignore
    let idx = list!.findIndex((e) => e.name === data.name);
    if (idx === -1) {
      list!.push({
        type: type,
        // @ts-ignore
        name: data.name,
        checked: true,
        select: '1',
        data: data,
        highlight: false,
      });
    } else {
      list![idx] = {
        type: type,
        // @ts-ignore
        name: data.name,
        checked: true,
        select: '1',
        data: data,
        highlight: false,
      };
    }
    this.initializeMining();
    this.initializeLibrary();
    return idx;
  }

  getFilterTreeData(): {
    callTree: boolean[];
    callTreeConstraints: {
      checked: boolean;
      inputs: string[];
    };
    dataMining: unknown[] | undefined;
    dataLibrary: unknown[] | undefined;
  } {
    let row = this.shadowRoot!.querySelectorAll<LitCheckBox>('.tree-check lit-check-box');
    let inputs = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.constraints-input');
    let check = this.shadowRoot!.querySelector<LitCheckBox>('#constraints-check');
    let data = {
      callTree: [row[0]!.checked, row[1]!.checked, row[2]!.checked, row[3]!.checked, row[4]!.checked, row[5]!.checked],
      callTreeConstraints: {
        checked: check!.checked,
        inputs: [inputs[0].value === '' ? '0' : inputs[0].value, inputs[1].value === '' ? '∞' : inputs[1].value],
      },
      dataMining: this.cutList,
      dataLibrary: this.libraryList,
    };
    return data;
  }

  async getTransferList(): Promise<void> {
    let dataCmd: { id: number; cmdStr: string }[] = (await queryTransferList()) as { id: number; cmdStr: string }[];
    let html = '';
    dataCmd.forEach((item: { id: number; cmdStr: string }): void => {
      html += `<div id="cycles-btn" class="tree-radio">
      <input name="transfer" class="radio" type="radio" value="${item.id}" style="margin-right:8px" />${item.cmdStr}</div>`;
    });
    html += `<div id="cycles-btn" class="tree-radio">
    <input name="transfer" class="radio" type="radio" value="count" style="margin-right:8px" />Count</div>`;
    this.shadowRoot!.querySelector<HTMLDivElement>('#transfer-list')!.innerHTML = html;
    this.initializeTreeTransfer();
  }

  initializeFilterTree(callTree: boolean = true, treeConstraints: boolean = true, mining: boolean = true): void {
    if (callTree) {
      let row = this.shadowRoot!.querySelectorAll('.tree-check');
      row.forEach((e: Element, idx: number): void => {
        let check = e.querySelector<LitCheckBox>('lit-check-box');
        check!.checked = false;
      });
    }
    if (treeConstraints) {
      let inputs = this.shadowRoot!.querySelectorAll<HTMLInputElement>('.constraints-input');
      if (inputs.length > 0) {
        inputs[0].value = '0';
        inputs[1].value = '∞';
      }
      let check = this.shadowRoot!.querySelector<LitCheckBox>('#constraints-check');
      check!.checked = false;
    }
    if (mining) {
      this.cutList = [];
      this.libraryList = [];
      this.initializeMining();
      this.initializeLibrary();
    }
  }

  initHtml(): string {
    return TabPaneFilterHtml(this.inputPlaceholder);
  }
}
