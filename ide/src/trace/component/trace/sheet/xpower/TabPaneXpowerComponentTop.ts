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
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitSelect } from '../../../../../base-ui/select/LitSelect';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { queryXpowerComponentTop } from '../../../../database/sql/Xpower.sql';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { LitTabs } from '../../../../../base-ui/tabs/lit-tabs';
import { LitTabpane } from '../../../../../base-ui/tabs/lit-tabpane';
import { TabPaneXpowerComponentAudio } from './TabPaneXpowerComponentAudio';
import { TabPaneXpowerComponentCamera } from './TabPaneXpowerComponentCamera';
import { TabPaneXpowerComponentCpu } from './TabPaneXpowerComponentCpu';
import { TabPaneXpowerComponentDisplay } from './TabPaneXpowerComponentDisplay';
import { LitTable } from '../../../../../base-ui/table/lit-table';

@element('tabpane-xpower-component-top')
export class TabPaneXpowerComponentTop extends BaseElement {
  private currentSelection: Array<XpowerComponentTopStruct> = [];
  private currentXpowerComponentTopValue: SelectionParam | undefined;
  private xpowerComponentTopTbl: HTMLDivElement | null | undefined;
  private xpowerComponentTopRange: HTMLLabelElement | null | undefined;
  private xpowerComponentTopSelect: LitSelect | null | undefined;
  private options: Set<string> = new Set();
  private componentTypeList: Array<string> = [];
  private currentTabKey: string | undefined;
  private currentTabPane?: BaseElement;
  private tabMap: Map<string, BaseElement> = new Map<string, BaseElement>();

  set data(xpowerComponentTopValue: SelectionParam) {
    //@ts-ignore
    this.xpowerComponentTopTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.xpowerComponentTopRange!.textContent = `Selected range: ${parseFloat(
      ((xpowerComponentTopValue.rightNs - xpowerComponentTopValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    if (xpowerComponentTopValue === this.currentXpowerComponentTopValue) {
      return;
    }
    this.componentTypeList = [
      'audio',
      'bluetooth',
      'flashlight',
      'location',
      'wifiscan',
      'camera',
      'cpu',
      'display',
      'gpu',
    ];
    this.currentXpowerComponentTopValue = xpowerComponentTopValue;
    this.getComponentTopData(xpowerComponentTopValue);
  }

  async getComponentTopData(xpowerComponentTopValue: SelectionParam): Promise<void> {
    let componentTopList = await queryXpowerComponentTop(
      xpowerComponentTopValue.leftNs,
      xpowerComponentTopValue.rightNs,
      3000000000
    );
    this.createSelectComponentTopData(componentTopList || []).then(() => {
      this.currentTabKey = this.xpowerComponentTopSelect!.value;
      this.showTabPane();
    });
  }

  async createSelectComponentTopData(list: Array<XpowerComponentTopStruct>): Promise<XpowerComponentTopStruct[]> {
    this.options = new Set();
    let componentTopStructList: XpowerComponentTopStruct[] = [];
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const selectComponentTopData = {
          startNS: list[i].startNS,
          startMS: list[i].startNS / 1_000_000,
          componentTypeId: list[i].componentTypeId,
          appName: list[i].appName,
          componentTypeName: SpSystemTrace.DATA_DICT.get(list[i].componentTypeId) || '',
          appNameStr: SpSystemTrace.DATA_DICT.get(list[i].appName) || '',
          backgroundDuration: list[i].backgroundDuration,
          backgroundEnergy: list[i].backgroundEnergy,
          foregroundDuration: list[i].foregroundDuration,
          foregroundEnergy: list[i].foregroundEnergy,
          screenOffDuration: list[i].screenOffDuration,
          screenOffEnergy: list[i].screenOffEnergy,
          screenOnDuration: list[i].screenOnDuration,
          screenOnEnergy: list[i].screenOnEnergy,
          cameraId: list[i].cameraId,
          uId: list[i].uId,
          load: list[i].load,
          appUsageDuration: list[i].appUsageDuration,
          appUsageEnergy: list[i].appUsageEnergy,
        };
        this.options.add(selectComponentTopData.componentTypeName);
        componentTopStructList.push(selectComponentTopData);
      }
    }
    this.initOptions();
    this.currentSelection = componentTopStructList;
    return componentTopStructList;
  }

  initElements(): void {
    this.xpowerComponentTopTbl = this.shadowRoot?.querySelector<HTMLDivElement>('#tb-counter');
    this.xpowerComponentTopSelect = this.shadowRoot?.querySelector<LitSelect>('#tab-select');
    this.xpowerComponentTopRange = this.shadowRoot?.querySelector('#time-range');
  }

  private setColumns(table: LitTable): void {
    if (!table!.columns) {
      table!.gridTemplateColumns = [];
      table!.columns = table!.slotArr;
      table!.columns.forEach((a: unknown, i: unknown) => {
        // @ts-ignore
        if (a.tagName === 'LIT-TABLE-COLUMN') {
          // @ts-ignore
          table!.gridTemplateColumns.push(a.getAttribute('width') || '1fr');
        }
      });
    }
  }

  private initSortIcon(thead: HTMLDivElement, table: LitTable): void {
    const thTable = thead!.querySelector('.th');
    if (thead && thead!.hasAttribute('sort')) {
      const list = thTable!.querySelectorAll('div');
      thead!.removeAttribute('sort');
      list.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  private showTabPane(): void {
    if (
      this.currentTabPane &&
      this.xpowerComponentTopTbl!.children.length > 0 &&
      this.xpowerComponentTopTbl?.children[0] === this.currentTabPane
    ) {
      this.xpowerComponentTopTbl?.removeChild(this.currentTabPane);
    }
    if (this.currentTabKey && this.currentSelection) {
      if (this.tabMap.has(this.currentTabKey)) {
        this.currentTabPane = this.tabMap.get(this.currentTabKey);
      } else {
        let tab = this.createTabBySelector();
        if (tab) {
          this.currentTabPane = tab;
          this.tabMap.set(this.currentTabKey, tab);
        }
      }
      if (this.currentTabPane) {
        this.xpowerComponentTopTbl?.appendChild(this.currentTabPane);
        let table = this.currentTabPane.shadowRoot?.querySelector<LitTable>('lit-table')!;
        let theadEl = table!.shadowRoot?.querySelector<HTMLDivElement>('.thead')!;
        this.initSortIcon(theadEl, table);
        this.setColumns(table);
        // @ts-ignore
        this.currentTabPane.data = this.currentSelection.filter(
          (item) => item.componentTypeName === this.currentTabKey
        );
      }
      let tabs = document
        .querySelector('body > sp-application')
        ?.shadowRoot?.querySelector('#sp-system-trace')
        ?.shadowRoot?.querySelector('div > trace-sheet')
        ?.shadowRoot?.querySelector('#tabs') as LitTabs;
      let pane = document
        .querySelector('body > sp-application')
        ?.shadowRoot?.querySelector('#sp-system-trace')
        ?.shadowRoot?.querySelector('div > trace-sheet')
        ?.shadowRoot?.querySelector('#box-xpower-component-top') as LitTabpane;
      tabs.activeByKey(pane.key);
    }
  }

  private initOptions(): void {
    let optionsArr = Array.from(this.options);
    this.xpowerComponentTopSelect!.dataSource = optionsArr;
    // 默认选中第一个
    this.xpowerComponentTopSelect?.querySelector('lit-select-option')?.setAttribute('selected', '');
    this.currentTabKey = optionsArr[0];
    this.xpowerComponentTopSelect!.defaultValue = this.currentTabKey || '';
    this.xpowerComponentTopSelect!.value = this.currentTabKey || '';
    this.xpowerComponentTopSelect!.querySelectorAll('lit-select-option').forEach((option) => {
      option.addEventListener('onSelected', () => {
        this.xpowerComponentTopSelect?.shadowRoot!.querySelectorAll('lit-select-option').forEach((o) => {
          o.removeAttribute('selected');
        });
        option.setAttribute('selected', '');
        this.currentTabKey = option.getAttribute('value') || '';
        this.xpowerComponentTopSelect!.value = option.getAttribute('value') || '';
        this.showTabPane();
      });
    });
  }

  private createTabBySelector(): BaseElement {
    if (this.componentTypeList.slice(0, 5).includes(this.currentTabKey!)) {
      // 'audio','bluetooth', 'flashlight', 'location','wifiscan'
      return new TabPaneXpowerComponentAudio();
    } else if (this.componentTypeList.slice(5, 6).includes(this.currentTabKey!)) {
      // 'camera'
      return new TabPaneXpowerComponentCamera();
    } else if (this.componentTypeList.slice(6, 7).includes(this.currentTabKey!)) {
      // 'cpu'
      return new TabPaneXpowerComponentCpu();
    } else {
      // 'display', 'gpu'
      return new TabPaneXpowerComponentDisplay();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      // 32 select的高度
      if (this.parentElement!.clientHeight < 32) {
        this.shadowRoot!.querySelector<HTMLDivElement>('.bottom_select')!.style.display = 'none';
      } else {
        this.shadowRoot!.querySelector<HTMLDivElement>('.bottom_select')!.style.display = 'block';
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return `
        <style>
        .xpower-counter-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
            height: calc(100% - 32px);
        }
        #tb-counter{
            height: 100%;
        }
        .bottom_select{
            height: 30px;
            background: var(--dark-background4,#F2F2F2);
            border-top: 1px solid var(--dark-border1,#c9d0da);
            display: flex;
            align-items: center;
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
            z-index: 2;
        }
        #tab-select{
            margin-left: 10px;
            z-index: 2;
        }
        </style>
        <label id="time-range" class="xpower-counter-label" style="position: sticky; top: 0; width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <div id="tb-counter"></div>
        <div class="bottom_select">
            <lit-select id="tab-select" placeholder="please choose" tabselect></lit-select>
        </div>
        `;
  }
}

export class XpowerComponentTopStruct {
  startNS: number = 0;
  startMS: number = 0;
  componentTypeId: number = 0;
  componentTypeName: string = '';
  appNameStr: string = '';
  appName: number = 0;
  backgroundDuration: number = 0;
  backgroundEnergy: number = 0;
  foregroundDuration: number = 0;
  foregroundEnergy: number = 0;
  screenOffDuration: number = 0;
  screenOffEnergy: number = 0;
  screenOnDuration: number = 0;
  screenOnEnergy: number = 0;
  cameraId: number = 0;
  uId: number = 0;
  load: number = 0;
  appUsageDuration: number = 0;
  appUsageEnergy: number = 0;
}
