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
import { SystemDiskIOSummary } from '../../../../bean/AbilityMonitor';
import { Utils } from '../../base/Utils';
import { ColorUtils } from '../../base/ColorUtils';
import { log } from '../../../../../log/Log';
import { resizeObserver } from '../SheetUtils';
import { getTabDiskAbilityData } from '../../../../database/sql/Ability.sql';

@element('tabpane-disk-ability')
export class TabPaneDiskAbility extends BaseElement {
  private diskAbilityTbl: LitTable | null | undefined;
  private diskAbilitySource: Array<SystemDiskIOSummary> = [];
  private queryDiskResult: Array<SystemDiskIOSummary> = [];
  private search: HTMLInputElement | undefined | null;

  set data(diskAbilityValue: SelectionParam) {
    if (this.diskAbilityTbl) {
      // @ts-ignore
      this.diskAbilityTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 45 + 'px';
    }
    this.queryDataByDB(diskAbilityValue);
  }

  initElements(): void {
    this.diskAbilityTbl = this.shadowRoot?.querySelector<LitTable>('#tb-disk-ability');
    this.diskAbilityTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.diskAbilityTbl!);
  }

  filterData(): void {
    if (this.queryDiskResult.length > 0) {
      let filterDisk = this.queryDiskResult.filter((item) => {
        let array = this.toDiskAbilityArray(item);
        let isInclude = array.filter((value) => value.indexOf(this.search!.value) > -1);
        return isInclude.length > 0;
      });
      if (filterDisk.length > 0) {
        this.diskAbilitySource = filterDisk;
        this.diskAbilityTbl!.recycleDataSource = this.diskAbilitySource;
      } else {
        this.diskAbilitySource = [];
        this.diskAbilityTbl!.recycleDataSource = [];
      }
    }
  }

  toDiskAbilityArray(systemDiskIOSummary: SystemDiskIOSummary): string[] {
    let array: Array<string> = [];
    array.push(systemDiskIOSummary.startTimeStr);
    array.push(systemDiskIOSummary.durationStr);
    array.push(systemDiskIOSummary.dataReadStr);
    array.push(systemDiskIOSummary.dataReadSecStr);
    array.push(systemDiskIOSummary.dataWriteStr);
    array.push(systemDiskIOSummary.readsInStr);
    array.push(systemDiskIOSummary.readsInSecStr);
    array.push(systemDiskIOSummary.writeOutStr);
    array.push(systemDiskIOSummary.writeOutSecStr);
    return array;
  }

  queryDataByDB(val: SelectionParam): void {
    getTabDiskAbilityData(val.leftNs, val.rightNs).then((result) => {
      log('getTabDiskAbilityData result size : ' + result.length);
      if (result.length !== null && result.length > 0) {
        for (const systemDiskIOSummary of result) {
          if (systemDiskIOSummary.startTime <= 0) {
            systemDiskIOSummary.startTimeStr = '0:000.000.000';
          } else {
            systemDiskIOSummary.startTimeStr = Utils.getTimeStampHMS(systemDiskIOSummary.startTime);
          }
          systemDiskIOSummary.durationStr = Utils.getDurString(systemDiskIOSummary.duration);
          systemDiskIOSummary.dataReadStr = systemDiskIOSummary.dataRead + 'KB';
          systemDiskIOSummary.dataReadSecStr = systemDiskIOSummary.dataReadSec + 'KB/S';
          systemDiskIOSummary.dataWriteStr = systemDiskIOSummary.dataWrite + 'KB';
          systemDiskIOSummary.dataWriteSecStr = systemDiskIOSummary.dataWriteSec + 'KB/S';
          systemDiskIOSummary.readsInStr = ColorUtils.formatNumberComma(systemDiskIOSummary.readsIn);
          systemDiskIOSummary.readsInSecStr = systemDiskIOSummary.readsInSec.toString();
          systemDiskIOSummary.writeOutStr = ColorUtils.formatNumberComma(systemDiskIOSummary.writeOut);
          systemDiskIOSummary.writeOutSecStr = systemDiskIOSummary.writeOutSec.toString();
        }
        this.diskAbilitySource = result;
        this.queryDiskResult = result;
        this.diskAbilityTbl!.recycleDataSource = result;
      } else {
        this.diskAbilitySource = [];
        this.queryDiskResult = [];
        this.diskAbilityTbl!.recycleDataSource = [];
      }
    });
  }

  initHtml(): string {
    return `
        <style>
        .disk-ability-table{
            height: auto;
        }
        :host{
            flex-direction: column;
            display: flex;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="tb-disk-ability" class="disk-ability-table">
            <lit-table-column order width="1fr"
            title="StartTime" data-index="startTimeStr" key="startTimeStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Duration" data-index="durationStr" key="durationStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Data Read" data-index="dataReadStr" key="dataReadStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Data Read/sec" data-index="dataReadSecStr" key="dataReadSecStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Data Write" data-index="dataWriteStr" key="dataWriteStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Data Write/sec" data-index="dataWriteSecStr" key="dataWriteSecStr" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Reads In" data-index="readsIn" key="readsInStr" align="flex-startStr" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Reads In/sec" data-index="readsInSecStr" key="readsInSecStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Write Out" data-index="writeOutStr" key="writeOutStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="1fr"
            title="Write Out/sec" data-index="writeOutSecStr" key="writeOutSecStr" align="flex-start" >
            </lit-table-column>
        </lit-table>
        `;
  }

  getPropertyByType =
    (property: string, type: string) =>
    (data: SystemDiskIOSummary): number | string => {
      let typeMap = {
        // @ts-ignore
        number: parseFloat(data[property]),
        durationStr: data.duration,
        dataReadStr: data.dataRead,
        dataReadSecStr: data.dataReadSec,
        dataWriteStr: data.dataWrite,
        dataWriteSecStr: data.dataWriteSec,
        readsInStr: data.readsIn,
        readsInSecStr: data.readsInSec,
        writeOutStr: data.writeOut,
        writeOutSecStr: data.writeOutSec,
      };
      // @ts-ignore
      return typeMap[type] || data[property];
    };

  compareFunction =
    (sort: number, getProperty: (data: SystemDiskIOSummary) => number | string) =>
    (diskAbilityLeftData: SystemDiskIOSummary, diskAbilityRightData: SystemDiskIOSummary): number => {
      let leftValue = getProperty(diskAbilityLeftData);
      let rightValue = getProperty(diskAbilityRightData);
      let result = 0;
      if (leftValue > rightValue) {
        result = sort === 2 ? -1 : 1;
      } else if (leftValue < rightValue) {
        result = sort === 2 ? 1 : -1;
      }
      return result;
    };

  compareDisk(
    property: string,
    sort: number,
    type: string
  ): (diskAbilityLeftData: SystemDiskIOSummary, diskAbilityRightData: SystemDiskIOSummary) => number {
    let getProperty = this.getPropertyByType(property, type);
    return this.compareFunction(sort, getProperty);
  }

  sortByColumn(detail: unknown): void {
    let typeMapping = {
      startTime: 'string',
      durationStr: 'durationStr',
      dataReadStr: 'dataReadStr',
      dataReadSecStr: 'dataReadSecStr',
      dataWriteStr: 'dataWriteStr',
      dataWriteSecStr: 'dataWriteSecStr',
      readsInStr: 'readsInStr',
      readsInSecStr: 'readsInSecStr',
      writeOutStr: 'writeOutStr',
      writeOutSecStr: 'writeOutSecStr',
    };
    // @ts-ignore
    let type = typeMapping[detail.key] || 'number'; // @ts-ignore
    this.diskAbilitySource.sort(this.compareDisk(detail.key, detail.sort, type));
    this.diskAbilityTbl!.recycleDataSource = this.diskAbilitySource;
  }
}
