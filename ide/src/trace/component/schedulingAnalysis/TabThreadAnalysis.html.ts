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
export const TabThreadAnalysisHtml = `
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