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
import { Utils } from '../../base/Utils';
import { log } from '../../../../../log/Log';
import { Smaps, TYPE_STRING } from '../../../../bean/SmapsStruct';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { getTabSmapsData, getTabSmapsSampleData } from '../../../../database/sql/Smaps.sql';
@element('tabpane-smaps-sample')
export class TabPaneSmapsSample extends BaseElement {
  private tblSmapsSample: LitTable | null | undefined;
  private sourceSmapsSample: Array<Smaps> = [];
  private querySmapsSampleResult: Array<Smaps> = [];
  private isClick = false;
  private tabTitle: HTMLDivElement | undefined | null;
  private searchCount: Element | undefined | null;
  private allSmaps: Smaps | undefined | null;
  set data(valSmapsSample: SelectionParam) {
    this.parentElement!.style.overflow = 'unset';
    this.isClick = valSmapsSample.smapsType.length === 0;
    this.init();
    this.tblSmapsSample!.loading = true;
    if (!this.isClick) {
      if (valSmapsSample.smapsType.length > 0) {
        this.queryDataByDB(valSmapsSample);
      }
    } else {
      this.setSmaps(valSmapsSample);
    }
  }
  initElements(): void {
    this.tblSmapsSample = this.shadowRoot?.querySelector<LitTable>('#tb-smaps-record');
    this.tabTitle = this.tblSmapsSample!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.searchCount = this.shadowRoot?.querySelector('#search-count');
    this.tblSmapsSample!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    let filterInput = this.shadowRoot?.querySelector('#filterName');
    filterInput?.addEventListener('input', (e) => {
      // @ts-ignore
      this.findPath(e.target.value);
    });
  }
  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        // @ts-ignore
        this.tblSmapsSample?.shadowRoot?.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 15 + 'px';
        this.tblSmapsSample?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }
  queryDataByDB(srVal: SelectionParam | unknown): void {
    // @ts-ignore
    getTabSmapsData(srVal.leftNs, srVal.rightNs, (MemoryConfig.getInstance().interval * 1000_000) / 5).then(
      (result) => {
        log('getTabSmapsData size :' + result.length);
        this.tblSmapsSample!.loading = false;
        this.filteredData(result);
      }
    );
  }
  setSmaps(data: SelectionParam): void {
    getTabSmapsSampleData(data.leftNs).then((result) => {
      this.tblSmapsSample!.loading = false;
      this.filteredData(result);
    });
  }
  private init(): void {
    const thTable = this.tabTitle!.querySelector('.th');
    const smapsSampleTblNodes = thTable!.querySelectorAll('div');
    if (this.tabTitle!.hasAttribute('sort')) {
      this.tabTitle!.removeAttribute('sort');
      smapsSampleTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }
  filteredData(result: unknown): void {
    // @ts-ignore
    if (result.length !== null && result.length > 0) {
      // @ts-ignore
      for (const smaps of result) {
        smaps.typeName = TYPE_STRING[smaps.type];
        smaps.address = smaps.startAddr + ' - ' + smaps.endAddr;
        smaps.swapStr = Utils.getBinaryByteWithUnit(smaps.swap);
        smaps.rssStr = Utils.getBinaryByteWithUnit(smaps.rss);
        smaps.pssStr = Utils.getBinaryByteWithUnit(smaps.pss);
        smaps.sizeStr = Utils.getBinaryByteWithUnit(smaps.size);
        smaps.sharedCleanStr = Utils.getBinaryByteWithUnit(smaps.sharedClean);
        smaps.sharedDirtyStr = Utils.getBinaryByteWithUnit(smaps.sharedDirty);
        smaps.privateCleanStr = Utils.getBinaryByteWithUnit(smaps.privateClean);
        smaps.privateDirtyStr = Utils.getBinaryByteWithUnit(smaps.privateDirty);
        smaps.swapPssStr = Utils.getBinaryByteWithUnit(smaps.swapPss);
        smaps.time = Utils.getTimeString(smaps.startNs);
        smaps.path = SpSystemTrace.DATA_DICT.get(smaps.path)?.split('/');
        smaps.permission = SpSystemTrace.DATA_DICT.get(smaps.pid)?.split('/');
        let resideS = smaps.reside.toFixed(2);
        if (resideS === '0.00') {
          smaps.resideStr = '0%';
        } else {
          smaps.resideStr = resideS + '%';
        }
      }
      // @ts-ignore
      this.sourceSmapsSample = result;
      // @ts-ignore
      this.querySmapsSampleResult = result;
      
      this.allSmaps = new Smaps();
      this.allSmaps.typeName = '*All*';
      this.allSmaps.address = '';
      this.allSmaps.path = '';
      this.allSmaps.permission = '';
      this.allSmaps.time = '';
      this.allSmaps.size = 0;
      this.allSmaps.rss = 0;
      this.allSmaps.pss = 0;
      this.allSmaps.sharedClean = 0;
      this.allSmaps.sharedDirty = 0;
      this.allSmaps.privateClean = 0;
      this.allSmaps.privateDirty = 0;
      this.allSmaps.swap = 0;
      this.allSmaps.swapPss = 0;
      this.allSmaps.reside = 0;
      
      // @ts-ignore
      this.sourceSmapsSample.forEach((item) => {
        this.allSmaps!.size += item.size;
        this.allSmaps!.rss += item.rss;
        this.allSmaps!.pss += item.pss;
        this.allSmaps!.sharedClean += item.sharedClean;
        this.allSmaps!.sharedDirty += item.sharedDirty;
        this.allSmaps!.privateClean += item.privateClean;
        this.allSmaps!.privateDirty += item.privateDirty;
        this.allSmaps!.swap += item.swap;
        this.allSmaps!.swapPss += item.swapPss;
      });
      
      this.allSmaps.sizeStr = Utils.getBinaryByteWithUnit(this.allSmaps.size);
      this.allSmaps.rssStr = Utils.getBinaryByteWithUnit(this.allSmaps.rss);
      this.allSmaps.pssStr = Utils.getBinaryByteWithUnit(this.allSmaps.pss);
      this.allSmaps.sharedCleanStr = Utils.getBinaryByteWithUnit(this.allSmaps.sharedClean);
      this.allSmaps.sharedDirtyStr = Utils.getBinaryByteWithUnit(this.allSmaps.sharedDirty);
      this.allSmaps.privateCleanStr = Utils.getBinaryByteWithUnit(this.allSmaps.privateClean);
      this.allSmaps.privateDirtyStr = Utils.getBinaryByteWithUnit(this.allSmaps.privateDirty);
      this.allSmaps.swapStr = Utils.getBinaryByteWithUnit(this.allSmaps.swap);
      this.allSmaps.swapPssStr = Utils.getBinaryByteWithUnit(this.allSmaps.swapPss);
      
      let displayData = Array.from(this.sourceSmapsSample);
      displayData.unshift(this.allSmaps);
      this.tblSmapsSample!.recycleDataSource = displayData;
      let filterInput = this.shadowRoot?.querySelector('#filterName') as HTMLInputElement;
      if (filterInput && filterInput.value.trim() !== '') {
        this.findPath(filterInput.value);
      }
    } else {
      this.sourceSmapsSample = [];
      this.querySmapsSampleResult = [];
      this.allSmaps = undefined;
      this.tblSmapsSample!.recycleDataSource = [];
    }
  }

  findPath(str: string): void {
    let searchData: Array<Smaps> = [];
    if (str === '') {
      let displayData = Array.from(this.sourceSmapsSample);
      if (this.allSmaps) {
        displayData.unshift(this.allSmaps);
      }
      this.tblSmapsSample!.recycleDataSource = displayData;
      this.searchCount!.textContent = this.sourceSmapsSample.length + '';
    } else {
      this.sourceSmapsSample.forEach((item) => {
        // @ts-ignore
        let pathValue = item.path;
        let match = false;
        
        if (Array.isArray(pathValue)) {
          let pathStr = pathValue.join(',');
          match = pathStr.toLowerCase().indexOf(str.toLowerCase()) !== -1;
        } else if (typeof pathValue === 'string') {
          match = pathValue.toLowerCase().indexOf(str.toLowerCase()) !== -1;
        }
        
        if (match) {
          searchData.push(item);
        }
      });
      
      if (searchData.length > 0 && this.allSmaps) {
        let allSmapsCopy = new Smaps();
        allSmapsCopy.typeName = this.allSmaps.typeName;
        allSmapsCopy.address = this.allSmaps.address;
        allSmapsCopy.path = this.allSmaps.path;
        allSmapsCopy.permission = this.allSmaps.permission;
        allSmapsCopy.time = this.allSmaps.time;
        allSmapsCopy.size = 0;
        allSmapsCopy.rss = 0;
        allSmapsCopy.pss = 0;
        allSmapsCopy.sharedClean = 0;
        allSmapsCopy.sharedDirty = 0;
        allSmapsCopy.privateClean = 0;
        allSmapsCopy.privateDirty = 0;
        allSmapsCopy.swap = 0;
        allSmapsCopy.swapPss = 0;
        allSmapsCopy.reside = 0;
        
        searchData.forEach((item) => {
          allSmapsCopy.size += item.size;
          allSmapsCopy.rss += item.rss;
          allSmapsCopy.pss += item.pss;
          allSmapsCopy.sharedClean += item.sharedClean;
          allSmapsCopy.sharedDirty += item.sharedDirty;
          allSmapsCopy.privateClean += item.privateClean;
          allSmapsCopy.privateDirty += item.privateDirty;
          allSmapsCopy.swap += item.swap;
          allSmapsCopy.swapPss += item.swapPss;
        });
        
        allSmapsCopy.sizeStr = Utils.getBinaryByteWithUnit(allSmapsCopy.size);
        allSmapsCopy.rssStr = Utils.getBinaryByteWithUnit(allSmapsCopy.rss);
        allSmapsCopy.pssStr = Utils.getBinaryByteWithUnit(allSmapsCopy.pss);
        allSmapsCopy.sharedCleanStr = Utils.getBinaryByteWithUnit(allSmapsCopy.sharedClean);
        allSmapsCopy.sharedDirtyStr = Utils.getBinaryByteWithUnit(allSmapsCopy.sharedDirty);
        allSmapsCopy.privateCleanStr = Utils.getBinaryByteWithUnit(allSmapsCopy.privateClean);
        allSmapsCopy.privateDirtyStr = Utils.getBinaryByteWithUnit(allSmapsCopy.privateDirty);
        allSmapsCopy.swapStr = Utils.getBinaryByteWithUnit(allSmapsCopy.swap);
        allSmapsCopy.swapPssStr = Utils.getBinaryByteWithUnit(allSmapsCopy.swapPss);
        
        searchData.unshift(allSmapsCopy);
      }
      
      this.tblSmapsSample!.recycleDataSource = searchData;
      this.searchCount!.textContent = searchData.length - (searchData.length > 0 && this.allSmaps ? 1 : 0) + '';
    }
  }

  initHtml(): string {
    return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        .smaps-record-table{
            height: auto;
        }
        #filterName:focus{
          outline: none;
        }
        </style>
        <div style="display:flex; justify-content:space-between;">
        <div style="width: 40%;">
          <input id="filterName" type="text" style="width:60%;height:18px;border:1px solid #c3c3c3;border-radius:9px" placeholder="Search" value="" />
          &nbsp;&nbsp;<span style="font-size: 10pt;margin-bottom: 5px">Count:&nbsp;<span id="search-count">0<span></span>
        </div>
        </div>
        <lit-table id="tb-smaps-record" class="smaps-record-table" style="overflow: auto">
            <lit-table-column order width="100px" title="TimeStamp" data-index="time" key="time" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Type" data-index="typeName" key="typeName" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Path" data-index="path" key="path" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="250px" title="Address Range" data-index="address" key="address" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Rss" data-index="rssStr" key="rssStr" align="flex-start" >
            </lit-table-column>
              <lit-table-column order width="150px" title="Pss" data-index="pssStr" key="pssStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column  width="150px" title="SharedClean" data-index="sharedCleanStr" key="sharedCleanStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="150px" title="SharedDirty" data-index="sharedDirtyStr" key="sharedDirtyStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="150px" title="PrivateClean" data-index="privateCleanStr" key="privateCleanStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="150px" title="PrivateDirty" data-index="privateDirtyStr" key="privateDirtyStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="150px" title="Swap" data-index="swapStr" key="swapStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="150px" title="SwapPss" data-index="swapPssStr" key="swapPssStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column order width="150px" title="Reside" data-index="resideStr" key="resideStr" align="flex-start" >
            </lit-table-column>
             <lit-table-column order width="150px" title="Protection" data-index="permission" key="permission" align="flex-start" >
            </lit-table-column>
        </lit-table>
        `;
  }
  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (aSmapsSample: Smaps, bSmapsSample: Smaps) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
            ? // @ts-ignore
              parseFloat(bSmapsSample[property]) - parseFloat(aSmapsSample[property])
            : // @ts-ignore
              parseFloat(aSmapsSample[property]) - parseFloat(bSmapsSample[property]);
        } else {
          // @ts-ignore
          if (bSmapsSample[property] > aSmapsSample[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (bSmapsSample[property] === aSmapsSample[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    // @ts-ignore
    if (detail.key === 'rssStr' || detail.key === 'sizeStr' || detail.key === 'resideStr') {
      // @ts-ignore
      let key = detail.key.substring(0, detail.key.indexOf('Str'));
      // @ts-ignore
      this.sourceSmapsSample.sort(compare(key, detail.sort, 'number'));
    } else {
      // @ts-ignore
      this.sourceSmapsSample.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.tblSmapsSample!.recycleDataSource = this.sourceSmapsSample;
  }
}
