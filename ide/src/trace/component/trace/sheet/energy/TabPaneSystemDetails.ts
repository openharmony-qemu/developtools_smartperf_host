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

import { SystemDetailsEnergy } from '../../../../bean/EnergyStruct';
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SpHiSysEnergyChart } from '../../../chart/SpHiSysEnergyChart';
import { resizeObserver } from '../SheetUtils';
import { type LitSlicerTrack } from '../../../../../base-ui/slicer/lit-slicer';
import {
  querySysLocationDetailsData,
  querySysLockDetailsData,
  querySystemWorkData,
} from '../../../../database/sql/SqlLite.sql';

@element('tabpane-system-details')
export class TabPaneSystemDetails extends BaseElement {
  private tblSystemDetails: LitTable | null | undefined;
  private detailsTbl: LitTable | null | undefined;
  private eventSource: Array<unknown> = [];
  private detailsSource: Array<unknown> = [];
  private boxDetails: HTMLDivElement | null | undefined;
  private slicerTrack: LitSlicerTrack | null | undefined;

  set data(valSystemDetails: SelectionParam | unknown) {
    this.slicerTrack!.style.visibility = 'hidden';
    this.queryDataByDB(valSystemDetails);
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tblSystemDetails!);
  }

  initElements(): void {
    this.boxDetails = this.shadowRoot?.querySelector<HTMLDivElement>('.box-details');
    this.tblSystemDetails = this.shadowRoot?.querySelector<LitTable>('#tb-system-data');
    this.detailsTbl = this.shadowRoot?.querySelector<LitTable>('#tb-system-details-data');
    this.slicerTrack = this.shadowRoot?.querySelector<LitSlicerTrack>('lit-slicer-track');
    this.tblSystemDetails!.addEventListener('row-click', (e): void => {
      this.detailsSource = [];
      // @ts-ignore
      let data = e.detail.data as SystemDetailsEnergy;
      this.convertData(data);
    });
  }

  convertData(data: SystemDetailsEnergy): void {
    if (data.eventName === 'Event Name') {
      this.slicerTrack!.style.visibility = 'hidden';
      this.detailsTbl!.dataSource = [];
      this.boxDetails!.style.width = '100%';
    } else {
      this.slicerTrack!.style.visibility = 'visible';
      this.detailsSource.push({
        key: 'EVENT_NAME : ',
        value: data.eventName,
      });
      this.detailsSource.push({ key: 'PID : ', value: data.pid });
      this.detailsSource.push({ key: 'UID : ', value: data.uid });
      if (data.eventName === 'GNSS_STATE') {
        this.detailsSource.push({ key: 'STATE : ', value: data.state });
      } else if (data.eventName === 'POWER_RUNNINGLOCK') {
        this.detailsSource.push({ key: 'TYPE : ', value: data.type });
        this.detailsSource.push({ key: 'STATE : ', value: data.state });
        this.detailsSource.push({
          key: 'LOG_LEVEL : ',
          value: data.log_level,
        });
        this.detailsSource.push({ key: 'NAME : ', value: data.name });
        this.detailsSource.push({
          key: 'MESSAGE : ',
          value: data.message,
        });
        this.detailsSource.push({ key: 'TAG : ', value: data.tag });
      } else {
        this.detailsSource.push({ key: 'TYPE : ', value: data.type });
        this.detailsSource.push({
          key: 'WORK_ID : ',
          value: data.workId,
        });
        this.detailsSource.push({ key: 'NAME : ', value: data.name });
        this.detailsSource.push({
          key: 'INTERVAL : ',
          value: data.interval,
        });
      }
      this.detailsTbl!.dataSource = this.detailsSource;
      this.boxDetails!.style.width = '65%';
    }
    this.detailsTblStyle();
  }

  detailsTblStyle(): void {
    this.detailsTbl!.shadowRoot?.querySelectorAll<HTMLDivElement>('.tr').forEach((tr): void => {
      tr.style.gridTemplateColumns = '120px 1fr';
    });
    this.detailsTbl!.shadowRoot?.querySelectorAll<HTMLDivElement>('.td').forEach((td): void => {
      let item = td.getAttribute('title');
      td.style.fontSize = '14px';
      td.style.fontWeight = '400';
      if (item !== null && item.indexOf(':') > -1) {
        td.style.opacity = '0.9';
        td.style.lineHeight = '16px';
      } else {
        td.style.opacity = '0.6';
        td.style.lineHeight = '20px';
      }
    });
  }

  queryDataByDB(val: SelectionParam | unknown): void {
    Promise.all([
      // @ts-ignore
      querySystemWorkData(val.rightNs),
      // @ts-ignore
      querySysLockDetailsData(val.rightNs, 'POWER_RUNNINGLOCK'),
      // @ts-ignore
      querySysLocationDetailsData(val.rightNs, 'GNSS_STATE'),
    ]).then((result): void => {
      let itemList: Array<unknown> = [];
      // @ts-ignore
      let systemWorkData = this.getSystemWorkData(result[0], val.leftNs, val.rightNs);
      if (systemWorkData.length > 0) {
        systemWorkData.forEach((item) => {
          itemList.push(item);
        });
      }
      // @ts-ignore
      let systemLockData = this.getSystemLockData(result[1], val.leftNs);
      if (systemLockData.length > 0) {
        systemLockData.forEach((item): void => {
          itemList.push(item);
        });
      }
      // @ts-ignore
      let systemLocationData = this.getSystemLocationData(result[2], val.leftNs);
      if (systemLocationData.length > 0) {
        systemLocationData.forEach((item): void => {
          itemList.push(item);
        });
      }
      itemList.sort((leftData: unknown, rightData: unknown) => {
        // @ts-ignore
        return leftData.ts - rightData.ts;
      });
      this.eventSource = [];
      this.eventSource.push({
        ts: 'Time',
        interval: 0,
        level: 0,
        name: '',
        state: 0,
        tag: '',
        type: '',
        uid: 0,
        pid: 0,
        workId: '',
        message: '',
        log_level: '',
        eventName: 'Event Name',
      });
      this.tblSystemDetails!.recycleDataSource = this.eventSource.concat(itemList);
      this.detailsTbl!.dataSource = [];
      this.boxDetails!.style.width = '100%';
      this.tblSystemDetailsStyle();
    });
  }

  tblSystemDetailsStyle(): void {
    this.tblSystemDetails?.shadowRoot?.querySelectorAll<HTMLDivElement>('.td').forEach((td): void => {
      td.style.fontSize = '14px';
      if (td.getAttribute('title') === 'Event Name' || td.getAttribute('title') === 'Time') {
        td.style.fontWeight = '700';
      } else {
        td.style.fontWeight = '400';
        td.style.opacity = '0.9';
        td.style.lineHeight = '16px';
      }
    });
  }

  private getSystemWorkData(data: Array<unknown>, leftNs: number, rightNs: number): unknown[] {
    let values = this.getConvertData(data);
    let lifeCycleData: Array<unknown> = [];
    let watchIndex: Array<string> = [];
    for (let index = 0; index < values.length; index++) {
      let filterData: unknown = values[index];
      // @ts-ignore
      if (filterData.name === SpHiSysEnergyChart.app_name) {
        // @ts-ignore
        if (filterData.eventName.indexOf('WORK_ADD') > -1) {
          // @ts-ignore
          watchIndex.push(filterData.workId);
          // @ts-ignore
          let number = watchIndex.indexOf(filterData.workId);
          lifeCycleData[number] = {
            startData: {},
            endData: {},
            rangeData: [],
          };
          // @ts-ignore
          lifeCycleData[number].startData = filterData;
          let virtualEndData = JSON.parse(JSON.stringify(filterData));
          virtualEndData.ts = rightNs;
          virtualEndData.eventName = 'WORK_REMOVE';
          // @ts-ignore
          lifeCycleData[number].endData = virtualEndData;
          // @ts-ignore
        } else if (filterData.eventName.indexOf('WORK_REMOVE') > -1) {
          // @ts-ignore
          let number = watchIndex.indexOf(filterData.workId);
          if (number > -1) {
            // @ts-ignore
            lifeCycleData[number].endData = filterData;
            // @ts-ignore
            watchIndex[number] = number + filterData.ts;
          }
        } else {
          lifeCycleData = this.getSysDataExtend(rightNs, watchIndex, filterData, lifeCycleData);
        }
      }
    }
    let resultData: Array<unknown> = [];
    lifeCycleData.forEach((life: unknown): void => {
      // @ts-ignore
      if (life.endData.ts >= leftNs) {
        // @ts-ignore
        let midData = life.rangeData;
        midData.forEach((rang: unknown, index: number): void => {
          // @ts-ignore
          if (rang.eventName.indexOf('WORK_STOP') > -1 && rang.ts >= leftNs) {
            // @ts-ignore
            resultData.push(life.startData);
            if (index - 1 >= 0 && midData[index - 1].eventName.indexOf('WORK_START') > -1) {
              resultData.push(midData[index - 1]);
            }
            resultData.push(rang);
          }
        });
      }
    });
    return resultData;
  }

  getSysDataExtend(
    rightNs: number,
    watchIndex: Array<string>,
    filterData: unknown,
    lifeCycleData: unknown[]
  ): unknown[] {
    // @ts-ignore
    let number = watchIndex.indexOf(filterData.workId);
    if (number > -1) {
      // @ts-ignore
      lifeCycleData[number].rangeData.push(filterData);
      let virtualEndData = JSON.parse(JSON.stringify(filterData));
      virtualEndData.ts = rightNs;
      virtualEndData.eventName = 'WORK_REMOVE';
      // @ts-ignore
      lifeCycleData[number].endData = virtualEndData;
    } else {
      // @ts-ignore
      if (filterData.eventName.indexOf('WORK_START') > -1) {
        lifeCycleData.push({
          startData: {},
          endData: {},
          rangeData: [],
        });
        // @ts-ignore
        watchIndex.push(filterData.workId);
        // @ts-ignore
        number = watchIndex.indexOf(filterData.workId);
        let virtualData = JSON.parse(JSON.stringify(filterData));
        // @ts-ignore
        if (filterData.ts > 0) {
          virtualData.ts = 0;
        } else {
          // @ts-ignore
          virtualData.ts = filterData.ts - 1;
        }
        virtualData.eventName = 'WORK_ADD';
        // @ts-ignore
        lifeCycleData[number].startData = virtualData;
        // @ts-ignore
        lifeCycleData[number].rangeData.push(filterData);
        let virtualEndData = JSON.parse(JSON.stringify(filterData));
        virtualEndData.ts = rightNs;
        virtualEndData.eventName = 'WORK_REMOVE';
        // @ts-ignore
        lifeCycleData[number].endData = virtualEndData;
      }
    }
    return lifeCycleData;
  }

  private getSystemLocationData(data: Array<unknown>, leftNs: number): unknown[] {
    let values = this.getConvertData(data);
    let fillMap: Map<unknown, unknown> = new Map<unknown, unknown>();
    let leftMap: Map<unknown, unknown> = new Map<unknown, unknown>();
    let watchIndex: Array<string> = [];
    for (let index = 0; index < values.length; index++) {
      let filterData: unknown = values[index];
      // @ts-ignore
      if (filterData.state.indexOf('start') > -1) {
        // @ts-ignore
        leftMap.set(filterData.pid, filterData);
        // @ts-ignore
        watchIndex.push(filterData.pid);
      } else {
        // @ts-ignore
        let i = watchIndex.indexOf(filterData.pid);
        if (i > -1) {
          // @ts-ignore
          fillMap.set(leftMap.get(filterData.pid), filterData);
          // @ts-ignore
          watchIndex.splice(i, 1, undefined);
          // @ts-ignore
          leftMap.delete(filterData.pid);
        }
      }
    }

    let locationData: Array<unknown> = [];
    fillMap.forEach((value, key): void => {
      // @ts-ignore
      if (value.ts >= leftNs) {
        locationData.push(key);
        locationData.push(value);
      }
    });
    leftMap.forEach((value, key): void => {
      locationData.push(value);
    });
    return locationData;
  }

  private getSystemLockData(data: Array<unknown>, leftNs: number): unknown[] {
    let values = this.getConvertData(data);
    let watchIndex: Array<string> = [];
    let fillMap: Map<unknown, unknown> = new Map<unknown, unknown>();
    let leftMap: Map<unknown, unknown> = new Map<unknown, unknown>();
    for (let index = 0; index < values.length; index++) {
      let filterData: unknown = values[index];
      // @ts-ignore
      if (filterData.tag.indexOf('ADD') > -1) {
        // @ts-ignore
        leftMap.set(filterData.message, filterData);
        // @ts-ignore
        watchIndex.push(filterData.message);
      } else {
        // @ts-ignore
        let i = watchIndex.indexOf(filterData.message);
        if (i > -1) {
          // @ts-ignore
          fillMap.set(leftMap.get(filterData.message), filterData);
          // @ts-ignore
          watchIndex.splice(i, 1, undefined);
          // @ts-ignore
          leftMap.delete(filterData.message);
        }
      }
    }
    let lockData: Array<unknown> = [];
    fillMap.forEach((value, key): void => {
      // @ts-ignore
      if (value.ts >= leftNs) {
        lockData.push(key);
        lockData.push(value);
      }
    });
    leftMap.forEach((value, key): void => {
      lockData.push(value);
    });
    return lockData;
  }

  private getConvertData(data: Array<unknown>): unknown[] {
    let convertItem: unknown = {};
    data.forEach((item: unknown): void => {
      // @ts-ignore
      if (convertItem[item.ts + item.eventName] === undefined) {
        // @ts-ignore
        convertItem[item.ts + item.eventName] = {};
        // @ts-ignore
        convertItem[item.ts + item.eventName].ts = item.ts;
        // @ts-ignore
        convertItem[item.ts + item.eventName].eventName = item.eventName;
        // @ts-ignore
        convertItem[item.ts + item.eventName][item.appKey.toLocaleLowerCase()] = item.appValue;
      } else {
        // @ts-ignore
        convertItem[item.ts + item.eventName][item.appKey.toLocaleLowerCase()] = item.appValue;
      }
    });
    // @ts-ignore
    return Object.values(convertItem);
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px 0 10px;
        }
        .sys-detail-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        </style>
        <div class="sys-detail-content" style="display: flex;flex-direction: column">
            <div style="display: flex;flex-direction: row">
                <lit-slicer style="width:100%">
                    <div class="box-details" style="width: 100%">
                        <lit-table id="tb-system-data" style="height: auto">
                            <lit-table-column class="sys-detail-column" width="300px" title="" data-index="eventName" key="eventName"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column class="sys-detail-column" width="300px" title="" data-index="ts" key="ts"  align="flex-start" order>
                            </lit-table-column>
                        </lit-table>
                    </div>
                    <lit-slicer-track ></lit-slicer-track>
                    <lit-table id="tb-system-details-data" no-head hideDownload style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)">
                        <lit-table-column class="sys-detail-column" width="100px" title="" data-index="key" key="key"  align="flex-start" >
                        </lit-table-column>
                        <lit-table-column class="sys-detail-column" width="1fr" title="" data-index="value" key="value"  align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </lit-slicer>
            </div>
            <lit-progress-bar class="progress sys-detail-progress"></lit-progress-bar>
        </div>
        `;
  }
}
