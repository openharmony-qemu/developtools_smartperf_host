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
import { SystemNetworkSummary } from '../../../../bean/AbilityMonitor';
import { Utils } from '../../base/Utils';
import { ColorUtils } from '../../base/ColorUtils';
import { log } from '../../../../../log/Log';
import { resizeObserver } from '../SheetUtils';
import { getTabNetworkAbilityData } from '../../../../database/sql/Ability.sql';

@element('tabpane-network-ability')
export class TabPaneNetworkAbility extends BaseElement {
  private networkAbilityTbl: LitTable | null | undefined;
  private networkAbilitySource: Array<SystemNetworkSummary> = [];
  private float: HTMLDivElement | null | undefined;
  private queryResult: Array<SystemNetworkSummary> = [];
  private search: HTMLInputElement | undefined | null;

  set data(networkAbilityValue: SelectionParam | unknown) {
    if (this.networkAbilityTbl) {
      // @ts-ignore
      this.networkAbilityTbl.shadowRoot?.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 45
      }px`;
    }
    this.queryDataByDB(networkAbilityValue);
  }

  initElements(): void {
    this.networkAbilityTbl = this.shadowRoot?.querySelector<LitTable>('#tb-network-ability');
    this.networkAbilityTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.networkAbilityTbl!);
  }

  filterData(): void {
    if (this.queryResult.length > 0) {
      let filterNetwork = this.queryResult.filter((item): boolean => {
        let array = this.toNetWorkAbilityArray(item); // @ts-ignore
        let isInclude = array.filter((value) => value.indexOf(this.search!.value) > -1);
        return isInclude.length > 0;
      });
      if (filterNetwork.length > 0) {
        this.networkAbilitySource = filterNetwork;
        this.networkAbilityTbl!.recycleDataSource = this.networkAbilitySource;
      } else {
        this.networkAbilitySource = [];
        this.networkAbilityTbl!.recycleDataSource = [];
      }
    }
  }

  toNetWorkAbilityArray(systemNetworkSummary: SystemNetworkSummary): unknown[] {
    let array: Array<string> = [];
    array.push(systemNetworkSummary.startTimeStr);
    array.push(systemNetworkSummary.durationStr);
    array.push(systemNetworkSummary.dataReceivedStr);
    array.push(systemNetworkSummary.dataReceivedSecStr);
    array.push(systemNetworkSummary.dataSendSecStr);
    array.push(systemNetworkSummary.dataSendStr);
    array.push(systemNetworkSummary.packetsIn.toString());
    array.push(systemNetworkSummary.packetsOut.toString());
    array.push(systemNetworkSummary.packetsOutSec.toString());
    return array;
  }

  queryDataByDB(val: SelectionParam | unknown): void {
    // @ts-ignore
    getTabNetworkAbilityData(val.leftNs, val.rightNs).then((item): void => {
      log(`getTabNetworkAbilityData result size : ${item.length}`);
      if (item.length !== null && item.length > 0) {
        for (const systemNetworkSummary of item) {
          if (systemNetworkSummary.startTime === 0) {
            systemNetworkSummary.startTimeStr = '0:000.000.000';
          } else {
            systemNetworkSummary.startTimeStr = Utils.getTimeStampHMS(systemNetworkSummary.startTime);
          }
          systemNetworkSummary.durationStr = Utils.getDurString(systemNetworkSummary.duration);
          systemNetworkSummary.dataReceivedStr = Utils.getBinaryByteWithUnit(systemNetworkSummary.dataReceived);
          systemNetworkSummary.dataReceivedSecStr = Utils.getBinaryByteWithUnit(systemNetworkSummary.dataReceivedSec);
          systemNetworkSummary.dataSendStr = Utils.getBinaryByteWithUnit(systemNetworkSummary.dataSend);
          systemNetworkSummary.dataSendSecStr = Utils.getBinaryByteWithUnit(systemNetworkSummary.dataSendSec);
          systemNetworkSummary.packetsInStr = ColorUtils.formatNumberComma(systemNetworkSummary.packetsIn);
          systemNetworkSummary.packetsInSecStr = systemNetworkSummary.packetsInSec.toFixed(2);
          systemNetworkSummary.packetsOutStr = ColorUtils.formatNumberComma(systemNetworkSummary.packetsOut);
          systemNetworkSummary.packetsOutSecStr = systemNetworkSummary.packetsOutSec.toFixed(2);
        }
        this.networkAbilitySource = item;
        this.queryResult = item;
        this.networkAbilityTbl!.recycleDataSource = this.networkAbilitySource;
      } else {
        this.networkAbilitySource = [];
        this.queryResult = [];
        this.networkAbilityTbl!.recycleDataSource = [];
      }
    });
  }

  initHtml(): string {
    return `
<style>
.network-ability-table{
    height: auto;
}
:host{
    padding: 10px 10px;
    display: flex;
    flex-direction: column;
}
</style>
<lit-table id="tb-network-ability" class="network-ability-table">
    <lit-table-column order width="1fr" title="StartTime" data-index="startTimeStr" key="startTimeStr" align="flex-start"></lit-table-column>
    <lit-table-column order width="1fr" title="Duration" data-index="durationStr" key="durationStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Data Received" data-index="dataReceivedStr" key="dataReceivedStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Data Received/sec" data-index="dataReceivedSecStr" key="dataReceivedSecStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Data Send" data-index="dataSendStr" key="dataSendStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Data Send/sec" data-index="dataSendSecStr" key="dataSendSecStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Packets In" data-index="packetsInStr" key="packetsInStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Packets In/sec" data-index="packetsInSecStr" key="packetsInSecStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Packets Out" data-index="packetsOutStr" key="packetsOutStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="1fr" title="Packets Out/sec" data-index="packetsOutSecStr" key="packetsOutSecStr" align="flex-start" ></lit-table-column>
</lit-table>
        `;
  }

  compare(property: string, sort: number, type: string): unknown {
    let getProperty = this.getPropertyByType(property, type);
    return this.compareFunction(sort, getProperty);
  }

  compareFunction =
    (sort: number, getProperty: (data: SystemNetworkSummary) => number | string) =>
    (networkAbilityLeftData: SystemNetworkSummary, networkAbilityRightData: SystemNetworkSummary): number => {
      let leftValue = getProperty(networkAbilityLeftData);
      let rightValue = getProperty(networkAbilityRightData);
      let result = 0;
      if (leftValue > rightValue) {
        result = sort === 2 ? -1 : 1;
      } else if (leftValue < rightValue) {
        result = sort === 2 ? 1 : -1;
      }
      return result;
    };

  getPropertyByType =
    (property: string, type: string) =>
    (data: SystemNetworkSummary): number | string => {
      let typeMap = {
        // @ts-ignore
        number: parseFloat(data[property]),
        durationStr: data.duration,
        dataReceivedStr: data.dataReceived,
        dataReceivedSecStr: data.dataReceivedSec,
        dataSendStr: data.dataSend,
        dataSendSecStr: data.dataSendSec,
        packetsInStr: data.packetsIn,
        packetsInSecStr: data.packetsInSec,
        packetsOutStr: data.packetsOut,
        packetsOutSecStr: data.packetsOutSec,
      };
      // @ts-ignore
      return typeMap[type] || data[property];
    };

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    if (detail.key === 'startTime') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'string')); // @ts-ignore
    } else if (detail.key === 'durationStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'durationStr')); // @ts-ignore
    } else if (detail.key === 'dataReceivedStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'dataReceivedStr')); // @ts-ignore
    } else if (detail.key === 'dataReceivedSecStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'dataReceivedSecStr')); // @ts-ignore
    } else if (detail.key === 'dataSendStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'dataSendStr')); // @ts-ignore
    } else if (detail.key === 'dataSendSecStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'dataSendSecStr')); // @ts-ignore
    } else if (detail.key === 'packetsInStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'packetsInStr')); // @ts-ignore
    } else if (detail.key === 'packetsInSecStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'packetsInSecStr')); // @ts-ignore
    } else if (detail.key === 'packetsOutStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'packetsOutStr')); // @ts-ignore
    } else if (detail.key === 'packetsOutSecStr') {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'packetsOutSecStr'));
    } else {
      // @ts-ignore
      this.networkAbilitySource.sort(this.compare(detail.key, detail.sort, 'number'));
    }
    this.networkAbilityTbl!.recycleDataSource = this.networkAbilitySource;
  }
}
