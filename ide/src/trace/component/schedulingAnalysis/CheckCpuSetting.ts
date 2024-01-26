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
import { LitCheckBox } from '../../../base-ui/checkbox/LitCheckBox';
import '../../../base-ui/checkbox/LitCheckBox';
import { SpSchedulingAnalysis } from './SpSchedulingAnalysis';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';
import { CheckCpuSettingHtml } from './CheckCpuSetting.html';

export class CpuSetting {
  cpu: number = 0;
  big: boolean = false;
  middle: boolean = true;
  small: boolean = false;
}

@element('check-cpu-setting')
export class CheckCpuSetting extends BaseElement {
  static mid_cores: number[] = [];
  static big_cores: number[] = [];
  static small_cores: number[] = [];
  static init_setting: boolean = false;

  private table: HTMLDivElement | null | undefined;
  private setUpload: HTMLDivElement | null | undefined;
  private listener?: () => void | undefined;

  initElements(): void {
    this.table = this.shadowRoot!.querySelector<HTMLDivElement>('#tb_cpu_setting');
    this.setUpload = this.shadowRoot!.querySelector<HTMLDivElement>('#set_upload');
    this.setUpload!.addEventListener('click', (e) => {
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: 'Analysis Upload',
        action: 'scheduling_analysis',
      });
      CheckCpuSetting.init_setting = true;
      this.listener?.();
    });
  }

  set cpuSetListener(listener: () => void | undefined) {
    this.listener = listener;
  }

  init() {
    this.initDefaultSetting();
    let data: any[] = [];
    this.table!.innerHTML = '';
    this.createHeaderDiv();
    for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
      let obj = {
        cpu: i,
        // @ts-ignore
        big: CheckCpuSetting.big_cores.includes(i),
        // @ts-ignore
        middle: CheckCpuSetting.mid_cores.includes(i),
        // @ts-ignore
        small: CheckCpuSetting.small_cores.includes(i),
      };
      data.push(obj);
      this.createTableLine(obj);
    }
  }

  initDefaultSetting() {
    if (!CheckCpuSetting.init_setting) {
      CheckCpuSetting.mid_cores = [];
      CheckCpuSetting.big_cores = [];
      CheckCpuSetting.small_cores = [];
      for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
        CheckCpuSetting.mid_cores.push(i);
      }
    }
  }

  createTableLine(cpuSetting: CpuSetting) {
    let div = document.createElement('div');
    div.className = 'setting_line';
    div.textContent = cpuSetting.cpu + '';
    let bigCheckBox: LitCheckBox = new LitCheckBox();
    bigCheckBox.checked = cpuSetting.big;
    let midCheckBox: LitCheckBox = new LitCheckBox();
    midCheckBox.checked = cpuSetting.middle;
    let smallCheckBox: LitCheckBox = new LitCheckBox();
    smallCheckBox.checked = cpuSetting.small;
    bigCheckBox.addEventListener('change', (e) => {
      midCheckBox.checked = false;
      smallCheckBox.checked = false;
      cpuSetting.big = true;
      CheckCpuSetting.big_cores.push(cpuSetting.cpu);
      CheckCpuSetting.mid_cores = CheckCpuSetting.mid_cores.filter((it) => it !== cpuSetting.cpu);
      CheckCpuSetting.small_cores = CheckCpuSetting.small_cores.filter((it) => it !== cpuSetting.cpu);
    });
    midCheckBox.addEventListener('change', (e) => {
      bigCheckBox.checked = false;
      smallCheckBox.checked = false;
      cpuSetting.middle = true;
      CheckCpuSetting.mid_cores.push(cpuSetting.cpu);
      CheckCpuSetting.big_cores = CheckCpuSetting.big_cores.filter((it) => it !== cpuSetting.cpu);
      CheckCpuSetting.small_cores = CheckCpuSetting.small_cores.filter((it) => it !== cpuSetting.cpu);
    });
    smallCheckBox.addEventListener('change', (e) => {
      midCheckBox.checked = false;
      bigCheckBox.checked = false;
      cpuSetting.small = true;
      CheckCpuSetting.small_cores.push(cpuSetting.cpu);
      CheckCpuSetting.mid_cores = CheckCpuSetting.mid_cores.filter((it) => it !== cpuSetting.cpu);
      CheckCpuSetting.big_cores = CheckCpuSetting.big_cores.filter((it) => it !== cpuSetting.cpu);
    });
    this.table?.append(...[div, bigCheckBox, midCheckBox, smallCheckBox]);
  }

  createHeaderDiv() {
    let column1 = document.createElement('div');
    column1.className = 'setting_line';
    column1.style.fontWeight = 'bold';
    column1.textContent = 'cpu_id';
    let column2 = document.createElement('div');
    column2.className = 'setting_line';
    column2.style.fontWeight = 'bold';
    column2.textContent = 'big';
    let column3 = document.createElement('div');
    column3.className = 'setting_line';
    column3.style.fontWeight = 'bold';
    column3.textContent = 'middle';
    let column4 = document.createElement('div');
    column4.className = 'setting_line';
    column4.style.fontWeight = 'bold';
    column4.textContent = 'small';
    this.table?.append(...[column1, column2, column3, column4]);
  }

  static resetCpuSettings() {
    CheckCpuSetting.init_setting = false;
    CheckCpuSetting.big_cores = [];
    CheckCpuSetting.small_cores = [];
    CheckCpuSetting.mid_cores = [];
  }

  initHtml(): string {
    return CheckCpuSettingHtml;
  }
}
