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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import './TabCpuDetailsFrequency';
import './TabCpuDetailsIdle';
import './TabCpuDetailsIrq';
import { TabCpuDetailsFrequency } from './TabCpuDetailsFrequency';
import { TabCpuDetailsIdle } from './TabCpuDetailsIdle';
import { LitTabs } from '../../../base-ui/tabs/lit-tabs';
import { TabCpuDetailsIrq } from './TabCpuDetailsIrq';

@element('drawer-cpu-tabs')
export class DrawerCpuTabs extends BaseElement {
  private cpuNumber: number = 0;
  private tabs: LitTabs | null | undefined;
  private tabCpuDetailsFrequency: TabCpuDetailsFrequency | null | undefined;
  private tabCpuDetailsIdle: TabCpuDetailsIdle | null | undefined;
  private tabCpuDetailsIrq: TabCpuDetailsIrq | null | undefined;

  initElements(): void {
    this.tabs = this.shadowRoot?.querySelector<LitTabs>('#tabs');
    this.tabCpuDetailsFrequency = this.shadowRoot?.querySelector<TabCpuDetailsFrequency>('#tab-cpu-details-frequency');
    this.tabCpuDetailsIdle = this.shadowRoot?.querySelector<TabCpuDetailsIdle>('#tab-cpu-details-idle');
    this.tabCpuDetailsIrq = this.shadowRoot?.querySelector<TabCpuDetailsIrq>('#tab-cpu-details-irq');

    this.tabs!.onTabClick = (e: any) => {
      if (e.detail.key == '1') {
        this.tabCpuDetailsIdle?.init(this.cpuNumber);
      } else if (e.detail.key == '2') {
        this.tabCpuDetailsFrequency?.init(this.cpuNumber);
      } else if (e.detail.key == '3') {
        this.tabCpuDetailsIrq?.init(this.cpuNumber);
      }
    };
  }

  init(cpu: number, value: string) {
    this.tabs!.activekey = value;
    this.cpuNumber = cpu;
    if (value == '1') {
      this.tabCpuDetailsIdle?.init(this.cpuNumber);
    } else if (value == '2') {
      this.tabCpuDetailsFrequency?.init(this.cpuNumber);
    } else if (value == '3') {
      this.tabCpuDetailsIrq?.init(this.cpuNumber);
    }
  }

  clearData() {
    this.tabCpuDetailsFrequency!.clearData();
    this.tabCpuDetailsIdle!.clearData();
    this.tabCpuDetailsIrq!.clearData();
  }

  initHtml(): string {
    return `
        <style>
        :host {
            width: 100%;
            height: 100%;
            background: var(--dark-background5,#F6F6F6);
        }
        
        #tabs{
            width: 100%;
            height: calc(100% - 55px);
            background-color: var(--dark-background5,#F6F6F6);
        }
        .tab-pane{
            background-color: var(--dark-background,#FFFFFF);
        }
        </style>
        <div >
            <lit-tabs id="tabs" position="top-left" activekey="1" mode="card" >
                    <lit-tabpane key="1" tab="CPU Idle" class="tab-pane">
                        <tab-cpu-details-idle id="tab-cpu-details-idle"></tab-cpu-details-idle>
                    </lit-tabpane>
                    <lit-tabpane key="2" tab="CPU Frequency" class="tab-pane">
                        <tab-cpu-details-frequency id="tab-cpu-details-frequency"></tab-cpu-details-frequency>
                    </lit-tabpane>
                    <lit-tabpane key="3" tab="CPU Irq" class="tab-pane">
                        <tab-cpu-details-irq id="tab-cpu-details-irq"></tab-cpu-details-irq>
                    </lit-tabpane>
            </lit-tabs>
        </div>
        `;
  }
}
