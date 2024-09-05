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
import { SpStatisticsHttpUtil } from '../../../../statistics/util/SpStatisticsHttpUtil';
import './Top10LongestRunTimeProcess.ts';
import './Top10ProcessSwitchCount.ts';
import { Top10LongestRunTimeProcess } from './Top10LongestRunTimeProcess';
import { Top10ProcessSwitchCount } from './Top10ProcessSwitchCount';

@element('tab-process-analysis')
export class TabProcessAnalysis extends BaseElement {
  private currentTabID: string | undefined;
  private currentTab: BaseElement | undefined;
  private btn1: HTMLDivElement | null | undefined;
  private btn2: HTMLDivElement | null | undefined;
  private Top10LongestRunTimeProcess: Top10LongestRunTimeProcess | undefined | null;
  private Top10ProcessSwitchCount: Top10ProcessSwitchCount | undefined | null;

  /**
   * 元素初始化，将html节点与内部变量进行绑定
   */
  initElements(): void {
    this.btn1 = this.shadowRoot!.querySelector<HTMLDivElement>('#btn1');
    this.btn2 = this.shadowRoot!.querySelector<HTMLDivElement>('#btn2');
    this.Top10LongestRunTimeProcess = this.shadowRoot!.querySelector<Top10LongestRunTimeProcess>('#top10_process_runTime');
    this.Top10ProcessSwitchCount = this.shadowRoot!.querySelector<Top10ProcessSwitchCount>('#top10_process_switchCount');
    this.btn1!.addEventListener('click', (event) => {
      this.setClickTab(this.btn1!, this.Top10ProcessSwitchCount!);
    });
    this.btn2!.addEventListener('click', (event) => {
      this.setClickTab(this.btn2!, this.Top10LongestRunTimeProcess!);
    });
  }

  /**
   * 初始化操作，清空该标签页下所有面板数据，只有首次导入新trace后执行一次
   */
  init(): void {
    this.Top10ProcessSwitchCount?.clearData();
    this.Top10LongestRunTimeProcess?.clearData();
    this.hideCurrentTab();
    this.currentTabID = undefined;
    this.setClickTab(this.btn1!, this.Top10ProcessSwitchCount!);
  }

  /**
   * 隐藏当前面板，将按钮样式设置为未选中状态
   */
  hideCurrentTab(): void {
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

  /**
   * 
   * @param btn 当前点击的数据类型按钮
   * @param showContent 需要展示的面板对象
   */
  setClickTab(btn: HTMLDivElement, showContent: Top10ProcessSwitchCount | Top10LongestRunTimeProcess): void {
    // 将前次点击的按钮样式设置为未选中样式状态
    if (this.currentTabID) {
      let clickTab = this.shadowRoot!.querySelector<HTMLDivElement>(`#${this.currentTabID}`);
      if (clickTab) {
        clickTab.className = 'tag_bt';
      }
    }
    // 切换当前点击按钮的类名，应用点击样式
    btn.className = 'tab_click';
    // 切换记录的好的当前点击面板id，并设置其显隐
    if (btn.id !== this.currentTabID) {
      this.currentTabID = btn.id;
      if (this.currentTab) {
        this.currentTab.style.display = 'none';
      }
      this.currentTab = showContent;
      showContent.style.display = 'inline';
      showContent.init();
    }
  }

  /**
   * 用于将元素节点挂载
   * @returns 返回字符串形式的元素节点
   */
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
        <div class="tag_bt" id="btn1">Top10切换次数进程</div>
        <div class="tag_bt" id="btn2">Top10运行超长进程</div>
    </div>
    <div id="content">
        <top10-process-switch-count id="top10_process_switchCount" style="display: none"></top10-process-switch-count>
        <top10-longest-runtime-process id="top10_process_runTime" style="display: none"></top10-longest-runtime-process>
    </div>
    `;
  }
}