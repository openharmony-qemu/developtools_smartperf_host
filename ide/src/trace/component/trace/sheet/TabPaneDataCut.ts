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
import { SelectionParam } from '../../../bean/BoxSelection';
import { LitSelect } from '../../../../base-ui/select/LitSelect';
import { TabPaneSchedSwitch } from './schedswitch/TabPaneSchedSwitch';
import { TabPaneBinderDataCut } from './binder/TabPaneBinderDataCut';
import { TabPaneFreqDataCut } from './frequsage/TabPaneFreqDataCut';
import { TabPaneFreqStatesDataCut } from './states/TabPaneFreqStatesDataCut';
import { TabPaneGpufreqDataCut } from './gpufreq/TabPaneGpufreqDataCut';
import { TraceSheet } from '../base/TraceSheet';

@element('tabpane-datacut')
export class TabPaneDataCut extends BaseElement {
  private currentSelection: SelectionParam | undefined;
  private tabSelector: LitSelect | undefined | null;
  private tabContainer: HTMLDivElement | undefined | null;
  private currentTabKey: string | undefined;
  private currentTabPane: any;
  private tabMap: Map<string, any> = new Map<string, any>();
  private traceSheetEl: TraceSheet | undefined | null;

  set data(dataCutSelection: SelectionParam | any) {
    if (dataCutSelection === this.currentSelection || dataCutSelection === undefined || dataCutSelection == null) {
      return;
    }
    this.currentSelection = dataCutSelection;
    this.initTabSelectorOptions();
    this.showTabPane();
  }

  initTabSheetEl(traceSheet: TraceSheet): void {
    this.traceSheetEl = traceSheet;
  }

  showTabPane(): void {
    if (this.currentTabPane) {
      this.tabContainer?.removeChild(this.currentTabPane);
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
        this.tabContainer?.appendChild(this.currentTabPane);
        this.currentTabPane.data = this.currentSelection;
      }
    }
  }

  createTabBySelector(): any {
    switch (this.currentTabKey) {
      case 'Sched Switch':
        return new TabPaneSchedSwitch();
      case 'Thread Binder':
        return new TabPaneBinderDataCut();
      case 'Cpu Freq':
        return new TabPaneFreqDataCut();
      case 'Thread States':
        let tab = new TabPaneFreqStatesDataCut();
        tab.initTabSheetEl(this.traceSheetEl!);
        return tab;
      case 'Gpu Freq':
        return new TabPaneGpufreqDataCut();
      default:
        return undefined;
    }
  }

  initTabSelectorOptions(): void {
    let options = [];
    if (this.currentSelection!.threadIds.length > 0) {
      options.push(
        ...[
          {
            name: 'Sched Switch',
          },
          {
            name: 'Thread Binder',
          },
          {
            name: 'Cpu Freq',
          },
          {
            name: 'Thread States',
          },
        ]
      );
    }
    if (
      this.currentSelection!.clockMapData.size > 0 &&
      this.currentSelection!.clockMapData.has('gpufreq Frequency') === true
    ) {
      options.push({
        name: 'Gpu Freq',
      });
    }
    this.currentTabKey = options[0].name;
    this.tabSelector!.defaultValue = this.currentTabKey || '';
    this.tabSelector!.value = this.currentTabKey || '';
    this.tabSelector!.dataSource = options;
  }

  initElements(): void {
    this.tabContainer = this.shadowRoot?.querySelector<HTMLDivElement>('#data_cut_tabpane_container');
    this.tabSelector = this.shadowRoot?.querySelector<LitSelect>('#tab-select');
    this.tabSelector!.onchange = () => {
      this.currentTabKey = this.tabSelector!.value;
      this.showTabPane();
    };
  }

  connectedCallback() {
    super.connectedCallback();
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .bottom_filter{
            height: 30px;
            background: var(--dark-background4,#F2F2F2);
            border-top: 1px solid var(--dark-border1,#c9d0da);
            display: flex;
            align-items: center;
        }
        </style>
        <div id="data_cut_tabpane_container" style="flex-grow: 1"></div>
        <div class="bottom_filter">
            <lit-select id="tab-select" style="margin-left: 10px" placeholder="please choose"></lit-select>
        </div>
        `;
  }
}
