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
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SystemCpuSummary } from '../../../../bean/AbilityMonitor';
import { Utils } from '../../base/Utils';
import { ColorUtils } from '../../base/ColorUtils';
import { log } from '../../../../../log/Log';
import { resizeObserver } from '../SheetUtils';
import { getTabCpuAbilityData } from '../../../../database/sql/Ability.sql';
import { NUM_2 } from '../../../../bean/NumBean';

@element('tabpane-cpu-ability')
export class TabPaneCpuAbility extends BaseElement {
  private cpuAbilityTbl: LitTable | null | undefined;
  private cpuAbilitySource: Array<SystemCpuSummary> = [];
  private queryCpuResult: Array<SystemCpuSummary> = [];
  private search: HTMLInputElement | undefined | null;

  set data(cpuAbilityValue: SelectionParam) {
    if (this.cpuAbilityTbl) {
      // @ts-ignore
      this.cpuAbilityTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 45 + 'px';
    }
    this.queryDataByDB(cpuAbilityValue);
  }

  initElements(): void {
    this.cpuAbilityTbl = this.shadowRoot?.querySelector<LitTable>('#tb-cpu-ability');
    this.cpuAbilityTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.cpuAbilityTbl!);
  }

  filterData(): void {
    if (this.queryCpuResult.length > 0) {
      let filterCpu = this.queryCpuResult.filter((item) => {
        let array = this.toCpuAbilityArray(item);
        let isInclude = array.filter((value) => value.indexOf(this.search!.value) > -1);
        return isInclude.length > 0;
      });
      if (filterCpu.length > 0) {
        this.cpuAbilitySource = filterCpu;
        this.cpuAbilityTbl!.recycleDataSource = this.cpuAbilitySource;
      } else {
        this.cpuAbilitySource = [];
        this.cpuAbilityTbl!.recycleDataSource = [];
      }
    }
  }

  toCpuAbilityArray(systemCpuSummary: SystemCpuSummary): string[] {
    let array: Array<string> = [];
    array.push(systemCpuSummary.startTimeStr);
    array.push(systemCpuSummary.durationStr);
    array.push(systemCpuSummary.totalLoadStr);
    array.push(systemCpuSummary.userLoadStr);
    array.push(systemCpuSummary.systemLoadStr);
    array.push(systemCpuSummary.threadsStr);
    return array;
  }

  queryDataByDB(val: SelectionParam): void {
    getTabCpuAbilityData(val.leftNs, val.rightNs).then((result) => {
      log('getTabCpuAbilityData size :' + result.length);
      if (result.length !== null && result.length > 0) {
        for (const systemCpuSummary of result) {
          if (systemCpuSummary.startTime === 0) {
            systemCpuSummary.startTimeStr = '0:000.000.000';
          } else {
            systemCpuSummary.startTimeStr = Utils.getTimeStampHMS(systemCpuSummary.startTime);
          }
          systemCpuSummary.durationStr = Utils.getDurString(systemCpuSummary.duration);
          systemCpuSummary.totalLoadStr = systemCpuSummary.totalLoad.toFixed(NUM_2) + '%';
          systemCpuSummary.userLoadStr = systemCpuSummary.userLoad.toFixed(NUM_2) + '%';
          systemCpuSummary.systemLoadStr = systemCpuSummary.systemLoad.toFixed(NUM_2) + '%';
          systemCpuSummary.threadsStr = ColorUtils.formatNumberComma(systemCpuSummary.threads);
        }
        this.cpuAbilitySource = result;
        this.queryCpuResult = result;
        this.cpuAbilityTbl!.recycleDataSource = this.cpuAbilitySource;
      } else {
        this.cpuAbilitySource = [];
        this.queryCpuResult = [];
        this.cpuAbilityTbl!.recycleDataSource = [];
      }
    });
  }

  initHtml(): string {
    return `
        <style>
        .cpu-ability{
            height: auto;
        }
        :host{
            padding: 10px 10px;
            flex-direction: column;
            display: flex;
        }
        </style>
        <lit-table id="tb-cpu-ability" class="cpu-ability">
            <lit-table-column order width="1fr" 
            title="Start Time" data-index="startTimeStr" key="startTimeStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr" 
            title="Duration" data-index="durationStr" key="durationStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr" 
            title="TotalLoad %" data-index="totalLoadStr" key="totalLoadStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr" 
            title="UserLoad %" data-index="userLoadStr" key="userLoadStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr" 
            title="SystemLoad %" data-index="systemLoadStr" key="systemLoadStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr" 
            title="Process" data-index="threadsStr" key="threadsStr" align="flex-start" >
            </lit-table-column>
        </lit-table>
        `;
  }

  getPropertyByType =
    (property: string, type: string) =>
    (data: SystemCpuSummary): number | string => {
      switch (type) {
        case 'number':
          // @ts-ignore
          return parseFloat(data[property]);
        case 'durationStr':
          return data.duration;
        case 'totalLoadStr':
          return data.totalLoad;
        case 'userLoadStr':
          return data.userLoad;
        case 'systemLoadStr':
          return data.systemLoad;
        default:
          // @ts-ignore
          return data[property];
      }
    };

  compareFunction =
    (sort: number, getProperty: (data: SystemCpuSummary) => number | string) =>
    (cpuAbilityLeftData: SystemCpuSummary, cpuAbilityRightData: SystemCpuSummary): number => {
      let leftValue = getProperty(cpuAbilityLeftData);
      let rightValue = getProperty(cpuAbilityRightData);
      let result = 0;
      if (leftValue > rightValue) {
        result = sort === 2 ? -1 : 1;
      } else if (leftValue < rightValue) {
        result = sort === 2 ? 1 : -1;
      }
      return result;
    };

  compare = (
    property: string,
    sort: number,
    type: string
  ): ((cpuAbilityLeftData: SystemCpuSummary, cpuAbilityRightData: SystemCpuSummary) => number) => {
    let getProperty = this.getPropertyByType(property, type);
    return this.compareFunction(sort, getProperty);
  };

  sortByColumn(detail: unknown): void {
    let typeMaping: { [key: string]: string } = {
      startTime: 'string',
      durationStr: 'durationStr',
      totalLoadStr: 'totalLoadStr',
      userLoadStr: 'userLoadStr',
      systemLoadStr: 'systemLoadStr',
    }; // @ts-ignore
    let type = typeMaping[detail.key] || 'number'; // @ts-ignore
    this.cpuAbilitySource.sort(this.compare(detail.key, detail.sort, type));
    this.cpuAbilityTbl!.recycleDataSource = this.cpuAbilitySource;
  }
}
