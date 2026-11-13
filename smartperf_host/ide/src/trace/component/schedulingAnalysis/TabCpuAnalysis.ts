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
import { SpSchedulingAnalysis } from './SpSchedulingAnalysis';
import { DrawerCpuTabs } from './DrawerCpuTabs';
import { LitChartPie } from '../../../base-ui/chart/pie/LitChartPie';
import { LitDrawer } from '../../../base-ui/drawer/LitDrawer';
import '../../../base-ui/drawer/LitDrawer';
import './DrawerCpuTabs';
import { procedurePool } from '../../database/Procedure';
import { info } from '../../../log/Log';
import { LitSelect } from '../../../base-ui/select/LitSelect';
import '../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import { pieChartColors } from '../../../base-ui/chart/pie/LitChartPieData';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';
import { TabCpuAnalysisHtml } from './TabCpuAnalysis.html';

@element('tab-cpu-analysis')
export class TabCpuAnalysis extends BaseElement {
  private cpuUsageGrid: HTMLDivElement | undefined;
  private cpuUsageChart: HTMLDivElement | undefined;
  private drawer: LitDrawer | undefined | null;
  private cpuPieMap: Map<number, LitChartPie> = new Map<number, LitChartPie>();
  private schedulingSelect: LitSelect | undefined | null;
  private drawerCpuTabs: DrawerCpuTabs | undefined | null;
  private progress: LitProgressBar | null | undefined;
  private loadingUsage: boolean = false;
  private loadingPieData: boolean = false;

  initElements(): void {
    this.progress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.cpuUsageGrid = this.shadowRoot?.querySelector('#cpu_usage_table') as HTMLDivElement;
    this.cpuUsageChart = this.shadowRoot?.querySelector('#cpu_usage_chart') as HTMLDivElement;
    this.schedulingSelect = this.shadowRoot?.querySelector<LitSelect>('#scheduling_select');
    this.drawer = this.shadowRoot!.querySelector<LitDrawer>('#drawer-right');
    this.drawerCpuTabs = this.shadowRoot?.querySelector<DrawerCpuTabs>('#drawer-cpu-tabs');
    this.schedulingSelect!.onchange = (e): void => {
      this.loadingPieData = true;
      this.progress!.loading = this.loadingUsage || this.loadingPieData; //@ts-ignore
      this.queryPieChartDataByType((e as unknown).detail.text);
    };
    this.drawer!.onClose = (): void => {
      this.drawerCpuTabs!.clearData();
    };
  }

  init(): void {
    this.cpuPieMap.clear();
    this.cpuUsageGrid!.innerHTML = '';
    this.cpuUsageChart!.innerHTML = '';
    this.schedulingSelect!.value = '1';
    this.cpuUsageGrid!.append(this.createUsageItem('usage', '%'));
    for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
      let cpuPie = new LitChartPie();
      cpuPie.className = 'pie-chart';
      this.cpuPieMap.set(i, cpuPie);
      this.cpuUsageGrid!.append(this.createUsageItem(`CPU: ${i}`, 0));
      this.cpuUsageChart!.append(this.createUsageChartItem(i, cpuPie));
    }
    this.loadingUsage = true;
    this.loadingPieData = true;
    this.progress!.loading = this.loadingUsage || this.loadingPieData;
    this.queryLogicWorker('scheduling-getCpuUsage', 'query Cpu Usage Time:', (res): void => {
      //@ts-ignore
      if (res && res.length > 0) {
        this.cpuUsageGrid!.innerHTML = '';
        this.cpuUsageGrid!.append(this.createUsageItem('usage', '%'));
        if (res instanceof Array) {
          for (let re of res) {
            this.cpuUsageGrid!.append(this.createUsageItem(`CPU: ${re.cpu}`, ((re.usage || 0) * 100).toFixed(2)));
          }
        }
      }
      this.loadingUsage = false;
      this.progress!.loading = this.loadingUsage || this.loadingPieData;
    });
    this.queryPieChartDataByType('CPU Idle');
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'CPU Data',
      action: 'trace_tab',
    });
  }

  queryPieChartDataByType(type: string): void {
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: `Analysis ${type}`,
      action: 'scheduling_analysis',
    });
    let tip = '';
    if (type === 'CPU Frequency') {
      tip = 'freq:';
    } else if (type === 'CPU Idle') {
      tip = 'idle:';
    } else {
      tip = 'irq:';
    }
    this.queryLogicWorker(`scheduling-${type}`, `query ${type} Analysis Time:`, (res): void => {
      for (let key of this.cpuPieMap.keys()) {
        this.cpuPieMap.get(key)!.config = {
          appendPadding: 10, //@ts-ignore
          data: res.get(key) || [],
          angleField: 'sum',
          colorField: 'value',
          radius: 0.8,
          tip: (obj): string => {
            return `<div>
                                    <div>${tip}${
              // @ts-ignore
              obj.obj.value
            }</div> 
                                    <div>ratio:${
                                      // @ts-ignore
                                      obj.obj.ratio
                                    }%</div>
                                </div>
                                `;
          },
          label: {
            type: 'outer',
            color:
              type !== 'CPU Idle'
                ? undefined
                : (it): string => {
                    //@ts-ignore
                    return pieChartColors[(it as unknown).value];
                  },
          },
          interactions: [
            {
              type: 'element-active',
            },
          ],
        };
      }
      this.loadingPieData = false;
      this.progress!.loading = this.loadingUsage || this.loadingPieData;
    });
  }

  queryLogicWorker(cpuAnalysisType: string, log: string, handler: (res: unknown) => void): void {
    let cpuAnalysisTime = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      cpuAnalysisType,
      {
        endTs: SpSchedulingAnalysis.endTs,
        total: SpSchedulingAnalysis.totalDur,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - cpuAnalysisTime;
    info(log, durTime);
  }

  createUsageItem(name: string, value: unknown): HTMLDivElement {
    let div = document.createElement('div');
    div.className = 'usage_item_box';
    div.innerHTML = `<div class="usage_item">${name}</div><div class="usage_item">${value}</div>`;
    return div;
  }

  createUsageChartItem(cpu: number, pie: LitChartPie): HTMLDivElement {
    let div = document.createElement('div');
    div.className = 'usage_chart';
    div.style.cursor = 'pointer';
    div.innerHTML = `
            <div style="height: 40px;line-height: 40px;margin-left: 10px">CPU: ${cpu}</div>
        `;
    div.append(pie);
    div.addEventListener('click', (): void => {
      if (this.loadingUsage || this.loadingPieData) {
        return;
      }
      this.drawer!.drawerTitle = `CPU: ${cpu}`;
      this.drawer!.visible = true;
      this.drawerCpuTabs!.init(cpu, this.schedulingSelect!.value);
    });
    return div;
  }

  initHtml(): string {
    return TabCpuAnalysisHtml;
  }
}
