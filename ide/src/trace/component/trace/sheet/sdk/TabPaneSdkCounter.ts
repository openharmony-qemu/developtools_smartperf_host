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
import { getTabSdkCounterData, getTabSdkCounterLeftData } from '../../../../database/sql/Sdk.sql';
import { queryStartTime } from '../../../../database/sql/SqlLite.sql';

@element('tabpane-sdk-counter')
export class TabPaneSdkCounter extends BaseElement {
  private tblSdkCounter: LitTable | null | undefined;
  private sdkRange: HTMLLabelElement | null | undefined;
  private keyList: Array<string> | undefined;
  private statDataArray: unknown = [];
  private columnMap: unknown = {};
  private sqlMap: Map<number, unknown> = new Map<number, unknown>();

  set data(valSdkCounter: SelectionParam | unknown) {
    this.sdkRange!.textContent =
      // @ts-ignore
      'Selected range: ' + ((valSdkCounter.rightNs - valSdkCounter.leftNs) / 1000000.0).toFixed(5) + ' ms';
    this.queryDataByDB(valSdkCounter);
  }

  initElements(): void {
    this.tblSdkCounter = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.sdkRange = this.shadowRoot?.querySelector('#sdk-counter-time-range');
    this.tblSdkCounter!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tblSdkCounter!);
  }

  getStatDataArray(counterItem: unknown): void {
    this.keyList = [];
    this.tblSdkCounter!.innerHTML = '';
    this.statDataArray = [];
    // @ts-ignore
    if (counterItem.length !== null && counterItem.length > 0) {
      // @ts-ignore
      for (let counterItemIndex = 0; counterItemIndex < counterItem.length; counterItemIndex++) {
        // @ts-ignore
        const dataResult = counterItem[counterItemIndex];
        let keys = Object.keys(dataResult);
        // @ts-ignore
        let values = Object.values(dataResult);
        let counterJsonText = '{';
        for (let counterKeyIndex = 0; counterKeyIndex < keys.length; counterKeyIndex++) {
          let counterKey = keys[counterKeyIndex];
          if (this.keyList.indexOf(counterKey) <= -1) {
            this.keyList.push(counterKey);
          }
          let counterValue = values[counterKeyIndex];
          // @ts-ignore
          if (this.columnMap[counterKey] === 'TimeStamp') {
            counterValue = Utils.getTimeString(Number(counterValue));
            // @ts-ignore
          } else if (this.columnMap[counterKey] === 'ClockTime') {
            counterValue = Utils.getTimeStampHMS(Number(counterValue));
            // @ts-ignore
          } else if (this.columnMap[counterKey] === 'RangTime') {
            // @ts-ignore
            counterValue = Utils.getDurString(Number(counterValue));
            // @ts-ignore
          } else if (this.columnMap[counterKey] === 'PercentType') {
            counterValue = counterValue + '%';
            // @ts-ignore
          } else if (this.columnMap[counterKey] === 'CurrencyType') {
            // @ts-ignore
            counterValue = counterValue.toString().replace(/\B(?=(\d{3})+$)/g, ',');
          }
          if (typeof counterValue === 'string') {
            counterValue = counterValue.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
          }
          counterJsonText += '"' + counterKey + '"' + ': ' + '"' + counterValue + '"';
          if (counterKeyIndex !== keys.length - 1) {
            counterJsonText += ',';
          } else {
            counterJsonText += '}';
          }
        }
        // @ts-ignore
        this.statDataArray.push(JSON.parse(counterJsonText));
      }
      // @ts-ignore
      this.tblSdkCounter!.recycleDataSource = this.statDataArray;
    } else {
      this.tblSdkCounter!.recycleDataSource = [];
    }
  }

  queryDataByDB(sdkVal: SelectionParam | unknown): void {
    queryStartTime().then((res) => {
      //@ts-ignore
      let startTime = res[0].start_ts;
      // @ts-ignore
      this.parseJson(SpSystemTrace.SDK_CONFIG_MAP);
      let counters: Array<string> = [];
      let componentId: number = -1;
      // @ts-ignore
      for (let index = 0; index < sdkVal.sdkCounterIds.length; index++) {
        // @ts-ignore
        let values = sdkVal.sdkCounterIds[index].split('-');
        let value = values[0];
        componentId = Number(values[1]);
        counters.push(value);
      }
      let sqlObj = this.sqlMap.get(componentId);
      // @ts-ignore
      let sql = sqlObj.TabCounterLeftData;
      // @ts-ignore
      getTabSdkCounterLeftData(sql, sdkVal.leftNs + startTime, counters, componentId).then((res) => {
        //@ts-ignore
        let leftTime = res[res.length - 1].max_value - startTime;
        // @ts-ignore
        let sql = sqlObj.TabCounterData;
        // @ts-ignore
        getTabSdkCounterData(sql, startTime, leftTime, sdkVal.rightNs, counters, componentId).then((counterItem) => {
          this.getStatDataArray(counterItem);
          this.initDataElement();
          setTimeout(() => {
            // @ts-ignore
            this.tblSdkCounter!.recycleDataSource = this.statDataArray;
            new ResizeObserver(() => {
              if (this.parentElement?.clientHeight !== 0) {
                this.tblSdkCounter!.style.height = '100%';
                this.tblSdkCounter!.reMeauseHeight();
              }
            }).observe(this.parentElement!);
          }, 200);
        });
      });
    });
  }

  parseJson(configMap: Map<number, string>): string {
    let keys = configMap.keys();
    for (let key of keys) {
      let counterConfigObject: unknown = configMap.get(key);
      if (counterConfigObject !== undefined) {
        // @ts-ignore
        let configStr = counterConfigObject.jsonConfig;
        let configJson = JSON.parse(configStr);
        let counterTableConfig = configJson.tableConfig;
        if (counterTableConfig !== null) {
          let showTypes = counterTableConfig.showType;
          for (let counterTypesIndex = 0; counterTypesIndex < showTypes.length; counterTypesIndex++) {
            let showType = showTypes[counterTypesIndex];
            let type = TabUtil.getTableType(showType);
            if (type === 'counter') {
              let selectSql = 'select ';
              for (let counterColumnsIndex = 0; counterColumnsIndex < showType.columns.length; counterColumnsIndex++) {
                // @ts-ignore
                this.columnMap[showType.columns[counterColumnsIndex].column] =
                  showType.columns[counterColumnsIndex].displayName;
                if (showType.columns[counterColumnsIndex].showType.indexOf(3) > -1) {
                  selectSql += showType.columns[counterColumnsIndex].column + ',';
                }
              }
              let counterLeftSql =
                'select max(ts) as max_value,counter_id from ' +
                showType.tableName +
                ' where ts <= $leftNs and counter_id in' +
                ' ($counters) group by counter_id order by max_value desc';
              let tabCounterDataSql =
                selectSql.substring(0, selectSql.length - 1) +
                ' from ' +
                showType.tableName +
                ' where counter_id in ($counters) and (ts - $startTime) between $leftNs and $rightNs';
              this.sqlMap.set(key, {
                TabCounterData: tabCounterDataSql,
                TabCounterLeftData: counterLeftSql,
              });
            }
          }
        }
      }
    }
    return '';
  }

  initDataElement(): void {
    if (this.keyList) {
      this.keyList.forEach((sdkCounterItemKey) => {
        let sdkCounterEl = document.createElement('lit-table-column') as LitTableColumn;
        sdkCounterEl.setAttribute('title', sdkCounterItemKey);
        sdkCounterEl.setAttribute('data-index', sdkCounterItemKey);
        sdkCounterEl.setAttribute('key', sdkCounterItemKey);
        sdkCounterEl.setAttribute('align', 'flex-start');
        sdkCounterEl.setAttribute('width', '1fr');
        sdkCounterEl.setAttribute('order', '');
        this.tblSdkCounter!.appendChild(sdkCounterEl);
      });
    }
  }

  initHtml(): string {
    return `
<style>
.sdk-counter-table{
    display: flex;
    margin-bottom: 5px;
}
:host{
    padding: 10px 10px;
    display: flex;
    flex-direction: column;
}
</style>
<div class="sdk-counter-table" style="height: 20px;align-items: center;flex-direction: row;">
            <stack-bar id="sdk-counter-stack-bar" style="flex: 1"></stack-bar>
            <label id="sdk-counter-time-range"  style="width: auto;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        </div>
<lit-table id="tb-counter" class="sdk-counter-tbl" style="height: auto">
</lit-table>
        `;
  }

  sortByColumn(counterDetail: unknown): void {
    // @ts-ignore
    function compare(property, countreSort, type) {
      return function (aSdkCounter: SelectionData, bSdkCounter: SelectionData): number {
        if (aSdkCounter.process === ' ' || bSdkCounter.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return countreSort === 2
            ? // @ts-ignore
              parseFloat(bSdkCounter[property]) - parseFloat(aSdkCounter[property])
            : // @ts-ignore
              parseFloat(aSdkCounter[property]) - parseFloat(bSdkCounter[property]);
        }
        // @ts-ignore
        if (bSdkCounter[property] > aSdkCounter[property]) {
          return countreSort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (bSdkCounter[property] === aSdkCounter[property]) {
            return 0;
          } else {
            return countreSort === 2 ? -1 : 1;
          }
        }
      };
    }

    // @ts-ignore
    if (counterDetail.key.indexOf('name') !== -1) {
      // @ts-ignore
      this.statDataArray.sort(compare(counterDetail.key, counterDetail.sort, 'string'));
    } else {
      // @ts-ignore
      this.statDataArray.sort(compare(counterDetail.key, counterDetail.sort, 'number'));
    }
    // @ts-ignore
    this.tblSdkCounter!.recycleDataSource = this.statDataArray;
  }
}
