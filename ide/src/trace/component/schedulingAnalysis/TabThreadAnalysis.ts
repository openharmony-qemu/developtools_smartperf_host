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
import './Top20ThreadCpuUsage';
import './Top20ThreadRunTime';
import './Top20ProcessSwitchCount';
import './Top20ProcessThreadCount';
import './Top20FrequencyThread';
import { Top20ThreadCpuUsage } from './Top20ThreadCpuUsage';
import { Top20ThreadRunTime } from './Top20ThreadRunTime';
import { Top20ProcessThreadCount } from './Top20ProcessThreadCount';
import { Top20ProcessSwitchCount } from './Top20ProcessSwitchCount';
import { Top20FrequencyThread } from './Top20FrequencyThread';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

@element('tab-thread-analysis')
export class TabThreadAnalysis extends BaseElement {
  private currentTabID: string | undefined;
  private currentTab: BaseElement | undefined;
  private contentDiv: HTMLDivElement | null | undefined;
  private tab1: HTMLDivElement | null | undefined;
  private tab2: HTMLDivElement | null | undefined;
  private tab3: HTMLDivElement | null | undefined;
  private tab4: HTMLDivElement | null | undefined;
  private tab5: HTMLDivElement | null | undefined;
  private top20ThreadCpuUsage: Top20ThreadCpuUsage | undefined | null;
  private top20ThreadRunTime: Top20ThreadRunTime | undefined | null;
  private top20ProcessThreadCount: Top20ProcessThreadCount | undefined | null;
  private top20ProcessSwitchCount: Top20ProcessSwitchCount | undefined | null;
  private top20FrequencyThread: Top20FrequencyThread | undefined | null;

  initElements(): void {
    this.contentDiv = this.shadowRoot!.querySelector<HTMLDivElement>('#content');
    this.tab1 = this.shadowRoot!.querySelector<HTMLDivElement>('#tab1');
    this.tab2 = this.shadowRoot!.querySelector<HTMLDivElement>('#tab2');
    this.tab3 = this.shadowRoot!.querySelector<HTMLDivElement>('#tab3');
    this.tab4 = this.shadowRoot!.querySelector<HTMLDivElement>('#tab4');
    this.tab5 = this.shadowRoot!.querySelector<HTMLDivElement>('#tab5');
    this.top20ThreadCpuUsage = this.shadowRoot!.querySelector<Top20ThreadCpuUsage>('#top20_thread_cpu_usage');
    this.top20ThreadRunTime = this.shadowRoot!.querySelector<Top20ThreadRunTime>('#top20_thread_run_time');
    this.top20ProcessThreadCount =
      this.shadowRoot!.querySelector<Top20ProcessThreadCount>('#top20_process_thread_count');
    this.top20ProcessSwitchCount =
      this.shadowRoot!.querySelector<Top20ProcessSwitchCount>('#top20_process_switch_count');
    this.top20FrequencyThread = this.shadowRoot!.querySelector<Top20FrequencyThread>('#top20_frequency_thread');

    this.tab1!.addEventListener('click', (event) => {
      this.setClickTab(this.tab1!, this.top20ThreadCpuUsage!);
    });
    this.tab2!.addEventListener('click', (event) => {
      this.setClickTab(this.tab2!, this.top20ThreadRunTime!);
    });
    this.tab3!.addEventListener('click', (event) => {
      this.setClickTab(this.tab3!, this.top20ProcessThreadCount!);
    });
    this.tab4!.addEventListener('click', (event) => {
      this.setClickTab(this.tab4!, this.top20ProcessSwitchCount!);
    });
    this.tab5!.addEventListener('click', (event) => {
      this.setClickTab(this.tab5!, this.top20FrequencyThread!);
    });
  }

  init() {
    this.top20FrequencyThread!.clearData();
    this.top20ThreadCpuUsage!.clearData();
    this.top20ThreadRunTime!.clearData();
    this.top20ProcessSwitchCount!.clearData();
    this.top20ProcessThreadCount!.clearData();
    this.hideCurrentTab();
    this.currentTabID = undefined;
    this.setClickTab(this.tab1!, this.top20ThreadCpuUsage!, true);
  }

  hideCurrentTab() {
    if (this.currentTabID) {
      let clickTab = this.shadowRoot!.querySelector<HTMLDivElement>(`#${this.currentTabID}`);
      if (clickTab) {
        clickTab.className = 'tag_bt';
      }
    }
    if (this.currentTab) {
      this.currentTab.style.display = 'none';
    }
  }

  setClickTab(
    tab: HTMLDivElement,
    showContent:
      | Top20ThreadCpuUsage
      | Top20ThreadRunTime
      | Top20ProcessSwitchCount
      | Top20ProcessThreadCount
      | Top20FrequencyThread,
    isInit: boolean = false
  ) {
    if (!isInit) {
      let event = showContent.id
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: event,
        action: 'scheduling_analysis',
      });
    }
    if (this.currentTabID) {
      let clickTab = this.shadowRoot!.querySelector<HTMLDivElement>(`#${this.currentTabID}`);
      if (clickTab) {
        clickTab.className = 'tag_bt';
      }
    }
    tab.className = 'tab_click';
    if (tab.id !== this.currentTabID) {
      this.currentTabID = tab.id;
      if (this.currentTab) {
        this.currentTab.style.display = 'none';
      }
      this.currentTab = showContent;
      showContent.style.display = 'inline';
      showContent.init();
    }
  }

  initHtml(): string {
    return `
        <style>
        .tag_bt{
            height: 45px;
            border-radius: 10px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            line-height: 45px;
            text-align: center;
            color: var(--dark-color,#000000);
            background-color: var(--dark-background5,#FFFFFF);
            cursor: pointer;
        }
        :host {
            width: 100%;
            height: 100%;
            background: var(--dark-background5,#F6F6F6);
        }
        .tab_click{
            height: 45px;
            border-radius: 10px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            line-height: 45px;
            text-align: center;
            color: #FFFFFF;
            background-color: #0d47a1;
            cursor: pointer;
        }
        #content{
            background-color: var(--dark-background,#FFFFFF);
        }
        .grid-box{
            display: grid;grid-template-columns: auto auto auto auto auto;grid-column-gap: 15px;padding: 10px;
            background-color: var(--dark-background,#FFFFFF);
        }
        </style>
        <div class="grid-box">
            <div class="tag_bt" id="tab1">Top20线程大中小核占用率</div>
            <div class="tag_bt" id="tab5">单个线程频点分布</div>
            <div class="tag_bt" id="tab2">Top20单次运行超长线程</div>
            <div class="tag_bt" id="tab3">Top20进程线程数</div>
            <div class="tag_bt" id="tab4">Top20切换次数线程</div>
        </div>
        <div id="content">
            <top20-thread-cpu-usage id="top20_thread_cpu_usage" style="display: none"></top20-thread-cpu-usage>
            <top20-thread-run-time id="top20_thread_run_time" style="display: none"></top20-thread-run-time>
            <top20-process-thread-count id="top20_process_thread_count" style="display: none"></top20-process-thread-count>
            <top20-process-switch-count id="top20_process_switch_count" style="display: none"></top20-process-switch-count>
            <top20-frequency-thread id="top20_frequency_thread" style="display: none"></top20-frequency-thread>
        </div>
        `;
  }
}
