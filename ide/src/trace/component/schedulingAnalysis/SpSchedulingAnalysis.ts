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
import './TabThreadAnalysis';
import './TabCpuAnalysis';
import { TabCpuAnalysis } from './TabCpuAnalysis';
import { TabThreadAnalysis } from './TabThreadAnalysis';
import { LitTabs } from '../../../base-ui/tabs/lit-tabs';
import { CheckCpuSetting } from './CheckCpuSetting';
import { Top20FrequencyThread } from './Top20FrequencyThread';
import { procedurePool } from '../../database/Procedure';
import { Utils } from '../trace/base/Utils';

@element('sp-scheduling-analysis')
export class SpSchedulingAnalysis extends BaseElement {
  static traceChange: boolean = false;
  static cpuCount: number = 0;
  static startTs: number = 0;
  static endTs: number = 0;
  static totalDur: number = 0;
  private tabs: LitTabs | null | undefined;
  private tabCpuAnalysis: TabCpuAnalysis | null | undefined;
  private tabThreadAnalysis: TabThreadAnalysis | null | undefined;

  initElements(): void {
    this.tabs = this.shadowRoot?.querySelector<LitTabs>('#tabs');
    this.tabCpuAnalysis = this.shadowRoot?.querySelector<TabCpuAnalysis>('#cpu-analysis');
    this.tabThreadAnalysis = this.shadowRoot?.querySelector<TabThreadAnalysis>('#thread-analysis');
  }

  static resetCpu(): void {
    SpSchedulingAnalysis.traceChange = true;
    CheckCpuSetting.resetCpuSettings();
    Top20FrequencyThread.threads = undefined;
    procedurePool.submitWithName('logic0', 'scheduling-clearData', {}, undefined, (res: unknown): void => {});
  }

  init(): void {
    if (SpSchedulingAnalysis.traceChange) {
      SpSchedulingAnalysis.traceChange = false;
      this.tabs!.activekey = '1'; //@ts-ignore
      SpSchedulingAnalysis.startTs = (window as unknown).recordStartNS; //@ts-ignore
      SpSchedulingAnalysis.endTs = (window as unknown).recordEndNS;
      SpSchedulingAnalysis.totalDur = SpSchedulingAnalysis.endTs - SpSchedulingAnalysis.startTs; //@ts-ignore
      SpSchedulingAnalysis.cpuCount = Utils.getInstance().getWinCpuCount();
      this.tabCpuAnalysis?.init();
      this.tabThreadAnalysis?.init();
    }
  }

  initHtml(): string {
    return `
        <style>
        .content{
            display: flex;
            flex-direction: column;
            background-color: var(--dark-background5,#F6F6F6);
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;        
        }
        #tabs{
            width: 100%;
            height: calc(100% - 55px);
            background-color: var(--dark-background,#FFFFFF);
        }
        :host {
            width: 100%;
            height: 100%;
            background: var(--dark-background5,#F6F6F6);
        }
        .interval{
            height: 55px;
            width: 100%;
            background-color: var(--dark-background,#FFFFFF);
        }
        </style>
        <div class="content">
            <div class="interval"></div>
            <lit-tabs id="tabs" position="top-left" activekey="1" mode="card">
                    <lit-tabpane key="1" tab="CPU Data">
                        <tab-cpu-analysis id="cpu-analysis"></tab-cpu-analysis>
                    </lit-tabpane>
                    <lit-tabpane key="2" tab="Thread Analysis">
                        <tab-thread-analysis id="thread-analysis"></tab-thread-analysis>
                    </lit-tabpane>
            </lit-tabs>
        </div>
        `;
  }
}
