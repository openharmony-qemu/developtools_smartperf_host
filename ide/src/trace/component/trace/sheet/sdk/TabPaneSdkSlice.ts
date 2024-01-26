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
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { LitTableColumn } from '../../../../../base-ui/table/lit-table-column';
import { Utils } from '../../base/Utils';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { TabUtil } from './TabUtil';
import { resizeObserver } from '../SheetUtils';
import { getTabSdkSliceData } from '../../../../database/sql/Sdk.sql';
import { queryTotalTime } from '../../../../database/sql/SqlLite.sql';
import { SdkSliceSummary } from '../../../../bean/SdkSummary.js';

@element('tabpane-sdk-slice')
export class TabPaneSdkSlice extends BaseElement {
  private tblSdkSlice: LitTable | null | undefined;
  private sdkSliceRange: HTMLLabelElement | null | undefined;
  private keyList: Array<string> | undefined;
  private statDataArray: any = [];
  private columnMap: any = {};
  private sqlMap: Map<number, string> = new Map<number, string>();

  set data(valSdkSlice: SelectionParam | any) {
    let millisecond = 1000_000;
    this.sdkSliceRange!.textContent =
      'Selected range: ' + ((valSdkSlice.rightNs - valSdkSlice.leftNs) / millisecond).toFixed(5) + ' ms';
    this.queryDataByDB(valSdkSlice);
  }

  initElements(): void {
    this.tblSdkSlice = this.shadowRoot?.querySelector<LitTable>('#tb-sdk-slice');
    this.sdkSliceRange = this.shadowRoot?.querySelector('#sdk-slice-time-range');
    this.tblSdkSlice!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tblSdkSlice!);
  }

  queryDataByDB(sdkSliceVal: SelectionParam | any) {
    queryTotalTime().then((res) => {
      let startTime = res[0].recordStartNS;
      let totalTime = res[0].total;
      let componentId: number = -1;
      let slices: Array<string> = [];
      for (let index = 0; index < sdkSliceVal.sdkSliceIds.length; index++) {
        let values = sdkSliceVal.sdkSliceIds[index].split('-');
        let value = values[0];
        componentId = Number(values[1]);
        slices.push(value);
      }
      this.parseJson(SpSystemTrace.SDK_CONFIG_MAP);
      let sql = this.sqlMap.get(componentId);
      if (sql == undefined) {
        return;
      }
      getTabSdkSliceData(sql, startTime, sdkSliceVal.leftNs, sdkSliceVal.rightNs, slices, componentId).then(
        (sliceItem) => {
          this.keyList = [];
          this.tblSdkSlice!.innerHTML = '';
          this.statDataArray = [];
          if (sliceItem.length != null && sliceItem.length > 0) {
            this.initSdkSliceData(sliceItem, totalTime, sdkSliceVal);
          } else {
            this.tblSdkSlice!.recycleDataSource = [];
          }
          this.initDataElement();

          setTimeout(() => {
            this.tblSdkSlice!.recycleDataSource = this.statDataArray;
            new ResizeObserver(() => {
              if (this.parentElement?.clientHeight != 0) {
                this.tblSdkSlice!.style.height = '100%';
                this.tblSdkSlice!.reMeauseHeight();
              }
            }).observe(this.parentElement!);
          }, 200);
        }
      );
    });
  }

  initSdkSliceData(sliceItem: SdkSliceSummary[], totalTime: number, sdkSliceVal: SelectionParam | any): void {
    for (let sliceItemIndex = 0; sliceItemIndex < sliceItem.length; sliceItemIndex++) {
      const dataResult = sliceItem[sliceItemIndex];
      let keys = Object.keys(dataResult);
      // @ts-ignore
      let values = Object.values(dataResult);
      let sliceJsonText = '{';
      for (let sliceKeyIndex = 0; sliceKeyIndex < keys.length; sliceKeyIndex++) {
        let sliceKey = keys[sliceKeyIndex];
        if (this.keyList!.indexOf(sliceKey) <= -1) {
          this.keyList!.push(sliceKey);
        }
        let sliceValue = values[sliceKeyIndex];
        if (this.columnMap[sliceKey] == 'TimeStamp') {
          sliceValue = Utils.getTimeString(Number(sliceValue));
        } else if (this.columnMap[sliceKey] == 'ClockTime') {
          sliceValue = Utils.getTimeStampHMS(Number(sliceValue));
        } else if (this.columnMap[sliceKey] == 'RangTime') {
          sliceValue = Utils.getDurString(Number(sliceValue));
        } else if (this.columnMap[sliceKey] == 'PercentType') {
          sliceValue = sliceValue + '%';
        } else if (this.columnMap[sliceKey] == 'CurrencyType') {
          // @ts-ignore
          sliceValue = sliceValue.toString().replace(/\B(?=(\d{3})+$)/g, ',');
        } else if (this.columnMap[sliceKey] == 'FIXED') {
          sliceValue = sliceValue.toFixed(2);
        }
        if (typeof sliceValue == 'string') {
          sliceValue = sliceValue.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
        }
        sliceJsonText += '"' + sliceKey + '"' + ': ' + '"' + sliceValue + '"';
        if (sliceKeyIndex != keys.length - 1) {
          sliceJsonText += ',';
        } else {
          sliceJsonText += '}';
        }
      }
      let sliceParseData = JSON.parse(sliceJsonText);
      if (sliceParseData.start_ts != null && sliceParseData.end_ts != null &&
        sliceParseData.start_ts > sliceParseData.end_ts && sliceParseData.end_ts == 0) {
        sliceParseData.end_ts = totalTime;
      }
      if (this.isDateIntersection(sdkSliceVal.leftNs, sdkSliceVal.rightNs,
        sliceParseData.start_ts, sliceParseData.end_ts)) {
        this.statDataArray.push(sliceParseData);
      }
    }
    this.tblSdkSlice!.recycleDataSource = this.statDataArray;
  }

  private isDateIntersection(selectStartTime: number, selectEndTime: number, startTime: number, endTime: number) {
    if (selectStartTime > startTime && selectStartTime < endTime) {
      return true;
    }
    if (selectEndTime > startTime && selectEndTime < endTime) {
      return true;
    }
    if (selectStartTime < startTime && selectEndTime > endTime) {
      return true;
    }
    return false;
  }

  parseJson(map: Map<number, string>): string {
    for (let [key, value] of map) {
      let sliceConfigObj: any = value;
      if (sliceConfigObj !== undefined) {
        let {jsonConfig} = sliceConfigObj;
        let {tableConfig} = JSON.parse(jsonConfig);
        if (tableConfig) {
          for (let showType of tableConfig.showType) {
            let innerTableName = this.getInnerTableName(showType);
            let type = TabUtil.getTableType(showType);
            if (type === 'slice') {
              let sliceSelectSql = 'select ';
              for (let {column, displayName, showType: columnShowType} of showType.columns) {
                this.columnMap[column] = displayName;
                if (columnShowType.includes(3)) {
                  switch (column) {
                    case 'slice_id':
                      sliceSelectSql += 'a.slice_id,b.slice_name,';
                      break;
                    case 'start_ts':
                    case 'end_ts':
                      sliceSelectSql += `(a.${column} - $startTime) as ${column},`;
                      break;
                    default:
                      sliceSelectSql += `a.${column},`;
                      break;
                  }
                }
              }
              let sliceSql = `${sliceSelectSql.slice(0, -1)} from ${showType.tableName} as a,${innerTableName} as b
                           where a.slice_id in ($slices)
                           and a.slice_id = b.slice_id
                           and ((a.start_ts - $startTime) >= $leftNs and (a.end_ts - $startTime) <= $rightNs
                           or (a.start_ts - $startTime) <= $leftNs and $leftNs <= (a.end_ts - $startTime)
                           or (a.start_ts - $startTime) <= $rightNs and $rightNs <= (a.end_ts - $startTime))`;
              this.sqlMap.set(key, sliceSql);
            }
          }
        }
      }
    }
    return '';
  }

  initDataElement() {
    if (this.keyList) {
      this.keyList.forEach((sdkSliceItemKey) => {
        let sdkSliceEl = document.createElement('lit-table-column') as LitTableColumn;
        sdkSliceEl.setAttribute('title', sdkSliceItemKey);
        sdkSliceEl.setAttribute('data-index', sdkSliceItemKey);
        sdkSliceEl.setAttribute('key', sdkSliceItemKey);
        sdkSliceEl.setAttribute('align', 'flex-start');
        if (sdkSliceItemKey === 'slice_id') {
          sdkSliceEl.setAttribute('width', '0.5fr');
        } else {
          sdkSliceEl.setAttribute('width', '1fr');
        }
        sdkSliceEl.setAttribute('order', '');
        this.tblSdkSlice!.appendChild(sdkSliceEl);
      });
    }
  }

  initHtml(): string {
    return `
<style>
.sdk-slice-table{
    height: 20px;
    margin-bottom: 5px;
}
:host{
    padding: 10px 10px;
    flex-direction: column;
    display: flex;
}
</style>
<div class="sdk-slice-content" class="sdk-slice-table" style="display: flex;align-items: center;flex-direction: row;">
            <stack-bar id="sdk-slice-stack-bar" style="flex: 1"></stack-bar>
            <label id="sdk-slice-time-range"  style="width: auto;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        </div>
<lit-table id="tb-sdk-slice" class="sdk-slice-tbl" style="height: auto">
</lit-table>
        `;
  }

  sortByColumn(sliceDetail: any) {
    // @ts-ignore
    function compare(property, sliceSort, type) {
      return function (aSdkSlice: SelectionData, bSdkSlice: SelectionData) {
        if (aSdkSlice.process === ' ' || bSdkSlice.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return sliceSort === 2
            ? // @ts-ignore
            parseFloat(bSdkSlice[property]) - parseFloat(aSdkSlice[property])
            : // @ts-ignore
            parseFloat(aSdkSlice[property]) - parseFloat(bSdkSlice[property]);
        }
        // @ts-ignore
        if (bSdkSlice[property] > aSdkSlice[property]) {
          return sliceSort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (bSdkSlice[property] === aSdkSlice[property]) {
            return 0;
          } else {
            return sliceSort === 2 ? -1 : 1;
          }
        }
      };
    }

    if (sliceDetail.key.indexOf('name') !== -1) {
      this.statDataArray.sort(compare(sliceDetail.key, sliceDetail.sort, 'string'));
    } else {
      this.statDataArray.sort(compare(sliceDetail.key, sliceDetail.sort, 'number'));
    }
    this.tblSdkSlice!.recycleDataSource = this.statDataArray;
  }

  private getInnerTableName(showType: any) {
    let inner = showType.inner;
    if (inner !== null) {
      return inner.tableName;
    }
    return '';
  }

  filterSliceItem(sliceItem: Array<SdkSliceSummary>, totalTime: number, sdkSliceVal: any) {
    this.tblSdkSlice!.innerHTML = '';
    this.statDataArray = [];
    if (sliceItem.length > 0) {
      sliceItem.forEach((dataResult) => {
        let keys = Object.keys(dataResult);
        let values = Object.values(dataResult);
        let sliceJsonText = '{';
        keys.forEach((sliceKey, sliceKeyIndex) => {
          this.keyList = [];
          if (this.keyList.indexOf(sliceKey) <= -1) {
            this.keyList.push(sliceKey);
          }
          let sliceValue = values[sliceKeyIndex];
          sliceValue = this.getFormattedSliceValue(sliceKey, sliceValue);
          sliceJsonText += `"${sliceKey}": "${sliceValue}"`;
          if (sliceKeyIndex !== keys.length - 1) {
            sliceJsonText += ',';
          } else {
            sliceJsonText += '}';
          }
        });
        let sliceParseData = JSON.parse(sliceJsonText);
        if (sliceParseData.start_ts !== null && sliceParseData.end_ts !== null &&
          sliceParseData.start_ts > sliceParseData.end_ts && sliceParseData.end_ts === 0) {
          sliceParseData.end_ts = totalTime;
        }
        if (this.isDateIntersection(sdkSliceVal.leftNs, sdkSliceVal.rightNs, sliceParseData.start_ts, sliceParseData.end_ts)) {
          this.statDataArray.push(sliceParseData);
        }
      });
      this.tblSdkSlice!.recycleDataSource = this.statDataArray;
    } else {
      this.tblSdkSlice!.recycleDataSource = [];
    }
  }

  getFormattedSliceValue(sliceKey: string, sliceValue: any) {
    switch (this.columnMap[sliceKey]) {
      case 'TimeStamp':
        return Utils.getTimeString(Number(sliceValue));
      case 'ClockTime':
        return Utils.getTimeStampHMS(Number(sliceValue));
      case 'RangTime':
        return Utils.getDurString(Number(sliceValue));
      case 'PercentType':
        return `${sliceValue}%`;
      case 'CurrencyType':
        return sliceValue.toString().replace(/\B(?=(\d{3})+$)/g, ',');
      case 'FIXED':
        return sliceValue.toFixed(2);
      default:
        if (typeof sliceValue === 'string') {
          return sliceValue.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
        }
    }
  }
}
