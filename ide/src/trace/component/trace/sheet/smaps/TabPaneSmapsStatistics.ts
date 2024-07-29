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
import { type Smaps, SmapsTreeObj, SmapsType, TYPE_STRING } from '../../../../bean/SmapsStruct';

import { Utils } from '../../base/Utils';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { SpSystemTrace } from '../../../SpSystemTrace';
import {
  getTabSmapsMaxSize,
  getTabSmapsStatisticData,
  getTabSmapsStatisticMaxSize,
  getTabSmapsStatisticSelectData,
} from '../../../../database/sql/Smaps.sql';
@element('tabpane-smaps-statistics')
export class TabPaneSmapsStatistics extends BaseElement {
  private tblSmapsStatistics: LitTable | null | undefined;
  private isClick = false;
  private currentSelection: SelectionParam | null | undefined;
  private sumSize: number = 0;
  private sortArray: Array<SmapsTreeObj> = [];
  private totalTree: Array<SmapsTreeObj> = [];
  public tabTitle: HTMLDivElement | undefined | null;
  private allTree: SmapsTreeObj | undefined | null;

  public initElements(): void {
    this.tblSmapsStatistics = this.shadowRoot?.querySelector<LitTable>('lit-table');
    this.tabTitle = this.tblSmapsStatistics!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.tblSmapsStatistics!.addEventListener('column-click', (evt) => {
      //   @ts-ignore
      this.sortByColumn(evt.detail.key, evt.detail.sort, this.tblSmapsStatistics);
    });
  }

  set data(valSmapsStatistics: SelectionParam) {
    if (!this.tblSmapsStatistics || valSmapsStatistics === this.currentSelection) {
      return;
    }
    this.parentElement!.style.overflow = 'unset';
    this.currentSelection = valSmapsStatistics;
    this.isClick = valSmapsStatistics.smapsType.length === 0;
    this.tblSmapsStatistics!.loading = true;
    this.init(this.tabTitle!);
    if (!this.isClick) {
      if (valSmapsStatistics.smapsType.length > 0) {
        this.queryDataByDB(valSmapsStatistics);
      }
    } else {
      this.setSmaps(valSmapsStatistics);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        // @ts-ignore
        this.tblSmapsStatistics?.shadowRoot?.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 15 + 'px';
        this.tblSmapsStatistics?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }
  async queryDataByDB(smapsVal: SelectionParam): Promise<void> {
    getTabSmapsMaxSize(smapsVal.leftNs, smapsVal.rightNs, (MemoryConfig.getInstance().interval * 1000_000) / 5).then(
      (maxRes) => {
        // @ts-ignore
        this.sumSize = maxRes[0].max_value;
      }
    );
    await getTabSmapsStatisticSelectData(
      smapsVal.leftNs,
      smapsVal.rightNs,
      (MemoryConfig.getInstance().interval * 1000_000) / 5
    ).then((result) => {
      this.tblSmapsStatistics!.loading = false;
      this.filteredData(result, this.tblSmapsStatistics!, this.sumSize);
    });
  }

  private calculatePercentage(divisor: number, dividend: number): number {
    if (dividend === 0) {
      return 0;
    } else {
      return (divisor / dividend) * 100;
    }
  }

  public init(tabTitle: HTMLDivElement): void {
    const thTable = tabTitle!.querySelector('.th');
    const list = thTable!.querySelectorAll('div');
    list.forEach((item) => {
      item.style.left = '-3px';
    });
    if (tabTitle!.hasAttribute('sort')) {
      tabTitle!.removeAttribute('sort');
      list.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  private handleSmapsTreeObj(smapsTreeObj: SmapsTreeObj, sumSize?: number): void {
    smapsTreeObj.sizeStr = Utils.getBinaryByteWithUnit(smapsTreeObj.size);
    smapsTreeObj.rssStr = Utils.getBinaryByteWithUnit(smapsTreeObj.rss);
    smapsTreeObj.pssStr = Utils.getBinaryByteWithUnit(smapsTreeObj.pss);
    smapsTreeObj.sizePro = this.calculatePercentage(smapsTreeObj.size, sumSize!);
    smapsTreeObj.sizeProStr = smapsTreeObj.sizePro.toFixed(2) + '%' === '0.00%' ? '0%' : smapsTreeObj.sizePro.toFixed(2) + '%';
    smapsTreeObj.sharedCleanStr = Utils.getBinaryByteWithUnit(smapsTreeObj.sharedClean);
    smapsTreeObj.sharedDirtyStr = Utils.getBinaryByteWithUnit(smapsTreeObj.sharedDirty);
    smapsTreeObj.privateCleanStr = Utils.getBinaryByteWithUnit(smapsTreeObj.privateClean);
    smapsTreeObj.privateDirtyStr = Utils.getBinaryByteWithUnit(smapsTreeObj.privateDirty);
    smapsTreeObj.swapStr = Utils.getBinaryByteWithUnit(smapsTreeObj.swap);
    smapsTreeObj.swapPssStr = Utils.getBinaryByteWithUnit(smapsTreeObj.swapPss);
  }

  private handleAllDataTree(
    smaps: Smaps,
    id: number,
    parentId: string,
    smapsStatAllDataTree: SmapsTreeObj,
    sumSize?: number
  ): void {
    let type = smaps.typeName;
    let objTree = new SmapsTreeObj(id + '', parentId, type);
    objTree.path = SpSystemTrace.DATA_DICT.get(Number(smaps.path))?.split('/');
    if (sumSize) {
      objTree.sizePro = this.calculatePercentage(smaps.size, sumSize);
      objTree.sizeProStr = objTree.sizePro.toFixed(2) + '%' === '0.00%' ? '0%' : objTree.sizePro.toFixed(2) + '%';
    }
    objTree.size = smaps.size;
    objTree.sizeStr = Utils.getBinaryByteWithUnit(smaps.size);
    objTree.rss = smaps.rss;
    objTree.rssStr = Utils.getBinaryByteWithUnit(smaps.rss);
    objTree.pss = smaps.pss;
    objTree.pssStr = Utils.getBinaryByteWithUnit(smaps.pss);
    if (smapsStatAllDataTree.children.length >= 1 && smapsStatAllDataTree.path !== '< multiple >') {
      smapsStatAllDataTree.path = '< multiple >';
    }

    smapsStatAllDataTree.size += smaps.size;
    smapsStatAllDataTree.count += smaps.count;
    smapsStatAllDataTree.rss += smaps.rss;
    smapsStatAllDataTree.pss += smaps.pss;
    smapsStatAllDataTree.sharedClean += smaps.sharedClean;
    smapsStatAllDataTree.sharedDirty += smaps.sharedDirty;
    smapsStatAllDataTree.privateClean += smaps.privateClean;
    smapsStatAllDataTree.privateDirty += smaps.privateDirty;
    smapsStatAllDataTree.swap += smaps.swap;
    smapsStatAllDataTree.swapPss += smaps.swapPss;
  }

  private handleTree(
    smaps: Smaps,
    id: number,
    parentId: string,
    smapsStatDataTree: SmapsTreeObj,
    sumSize?: number
  ): void {
    let type = TYPE_STRING[smaps.type];
    let treeObj = new SmapsTreeObj(id + '', parentId, type);
    treeObj.path = SpSystemTrace.DATA_DICT.get(Number(smaps.path))?.split('/');
    treeObj.size = smaps.size;
    treeObj.sizeStr = Utils.getBinaryByteWithUnit(smaps.size);
    treeObj.count = smaps.count;
    treeObj.rss = smaps.rss;
    treeObj.rssStr = Utils.getBinaryByteWithUnit(smaps.rss);
    treeObj.pss = smaps.pss;
    treeObj.pssStr = Utils.getBinaryByteWithUnit(smaps.pss);
    treeObj.sharedClean = smaps.sharedClean;
    treeObj.sharedCleanStr = Utils.getBinaryByteWithUnit(smaps.sharedClean);
    treeObj.sharedDirty = smaps.sharedDirty;
    treeObj.sharedDirtyStr = Utils.getBinaryByteWithUnit(smaps.sharedDirty);
    treeObj.privateClean = smaps.privateClean;
    treeObj.privateCleanStr = Utils.getBinaryByteWithUnit(smaps.privateClean);
    treeObj.privateDirty = smaps.privateDirty;
    treeObj.privateDirtyStr = Utils.getBinaryByteWithUnit(smaps.privateDirty);
    treeObj.swap = smaps.swap;
    treeObj.swapStr = Utils.getBinaryByteWithUnit(smaps.swap);
    treeObj.swapPss = smaps.swapPss;
    treeObj.swapPssStr = Utils.getBinaryByteWithUnit(smaps.swapPss);

    if (sumSize) {
      treeObj.sizePro = this.calculatePercentage(smaps.size, sumSize || 0);
      treeObj.sizeProStr = treeObj.sizePro.toFixed(2) + '%' === '0.00%' ? '0%' : treeObj.sizePro.toFixed(2) + '%';
    }

    if (smapsStatDataTree.children.length >= 1 && smapsStatDataTree.path !== '< multiple >') {
      smapsStatDataTree.path = '< multiple >';
    }

    smapsStatDataTree.size += smaps.size;
    smapsStatDataTree.count += smaps.count;
    smapsStatDataTree.rss += smaps.rss;
    smapsStatDataTree.pss += smaps.pss;
    smapsStatDataTree.sharedClean += smaps.sharedClean;
    smapsStatDataTree.sharedDirty += smaps.sharedDirty;
    smapsStatDataTree.privateClean += smaps.privateClean;
    smapsStatDataTree.privateDirty += smaps.privateDirty;
    smapsStatDataTree.swap += smaps.swap;
    smapsStatDataTree.swapPss += smaps.swapPss;
    smapsStatDataTree.children.push(treeObj);
  }

  async setSmaps(data: SelectionParam): Promise<void> {
    getTabSmapsStatisticMaxSize(data.leftNs).then((maxRes) => {
      // @ts-ignore
      this.sumSize = maxRes[0].max_value;
    });
    await getTabSmapsStatisticData(data.leftNs).then((result) => {
      this.tblSmapsStatistics!.loading = false;
      this.filteredData(result, this.tblSmapsStatistics!, this.sumSize);
    });
  }

  private initTreeObj(): Map<SmapsType, SmapsTreeObj> {
    let allTreeObjs: Map<SmapsType, SmapsTreeObj> = new Map<SmapsType, SmapsTreeObj>();
    allTreeObjs.set(SmapsType.TYPE_CODE_SYS, new SmapsTreeObj('CODE_SYS', '', 'CODE_SYS'));
    allTreeObjs.set(SmapsType.TYPE_CODE_APP, new SmapsTreeObj('CODE_APP', '', 'CODE_APP'));
    allTreeObjs.set(SmapsType.TYPE_DATA_SYS, new SmapsTreeObj('DATA_SYS', '', 'DATA_SYS'));
    allTreeObjs.set(SmapsType.TYPE_DATA_APP, new SmapsTreeObj('DATA_APP', '', 'DATA_APP'));
    allTreeObjs.set(SmapsType.TYPE_UNKNOWN_ANON, new SmapsTreeObj('UNKNOWN_ANON', '', 'UNKNOWN_ANON'));
    allTreeObjs.set(SmapsType.TYPE_STACK, new SmapsTreeObj('STACK', '', 'STACK'));
    allTreeObjs.set(SmapsType.TYPE_JS_HEAP, new SmapsTreeObj('JS_HEAP', '', 'JS_HEAP'));
    allTreeObjs.set(SmapsType.TYPE_JAVA_VM, new SmapsTreeObj('JAVA_VM', '', 'JAVA_VM'));
    allTreeObjs.set(SmapsType.TYPE_NATIVE_HEAP, new SmapsTreeObj('NATIVE_HEAP', '', 'NATIVE_HEAP'));
    allTreeObjs.set(SmapsType.TYPE_ASHMEM, new SmapsTreeObj('ASHMEM', '', 'ASHMEM'));
    allTreeObjs.set(SmapsType.TYPE_OTHER_SYS, new SmapsTreeObj('OTHER_SYS', '', 'OTHER_SYS'));
    allTreeObjs.set(SmapsType.TYPE_OTHER_APP, new SmapsTreeObj('OTHER_APP', '', 'OTHER_APP'));
    return allTreeObjs;
  }

  private handleAllSMapsTreeObj(sumSize: number, allTreeObjs: Map<SmapsType, SmapsTreeObj>): void {
    let codeSysTree = allTreeObjs.get(SmapsType.TYPE_CODE_SYS);
    let codeAppTree = allTreeObjs.get(SmapsType.TYPE_CODE_APP);
    let dataSysTree = allTreeObjs.get(SmapsType.TYPE_DATA_SYS);
    let dataAppTree = allTreeObjs.get(SmapsType.TYPE_DATA_APP);
    let unKownTree = allTreeObjs.get(SmapsType.TYPE_UNKNOWN_ANON);
    let stackTree = allTreeObjs.get(SmapsType.TYPE_STACK);
    let jsTree = allTreeObjs.get(SmapsType.TYPE_JS_HEAP);
    let javaVmTree = allTreeObjs.get(SmapsType.TYPE_JAVA_VM);
    let nativeTree = allTreeObjs.get(SmapsType.TYPE_NATIVE_HEAP);
    let ashMemTree = allTreeObjs.get(SmapsType.TYPE_ASHMEM);
    let otherSysTree = allTreeObjs.get(SmapsType.TYPE_OTHER_SYS);
    let otherAppTree = allTreeObjs.get(SmapsType.TYPE_OTHER_APP);
    this.handleSmapsTreeObj(codeSysTree!, sumSize);
    this.handleSmapsTreeObj(codeAppTree!, sumSize);
    this.handleSmapsTreeObj(dataSysTree!, sumSize);
    this.handleSmapsTreeObj(dataAppTree!, sumSize);
    this.handleSmapsTreeObj(unKownTree!, sumSize);
    this.handleSmapsTreeObj(stackTree!, sumSize);
    this.handleSmapsTreeObj(jsTree!, sumSize);
    this.handleSmapsTreeObj(javaVmTree!, sumSize);
    this.handleSmapsTreeObj(nativeTree!, sumSize);
    this.handleSmapsTreeObj(ashMemTree!, sumSize);
    this.handleSmapsTreeObj(otherSysTree!, sumSize);
    this.handleSmapsTreeObj(otherAppTree!, sumSize);
    this.handleSmapsTreeObj(this.allTree!, sumSize);
  }

  public filteredData(result: Array<unknown>, table: LitTable, sumSize?: number): void {
    this.allTree = new SmapsTreeObj('All', '', '*All*');
    let allTreeObjs = this.initTreeObj();
    if (result.length !== null && result.length > 0) {
      for (let id = 0; id < result.length; id++) {
        let smaps = result[id];
        // @ts-ignore
        smaps.typeName = TYPE_STRING[smaps.type];
        // @ts-ignore
        if (allTreeObjs.has(smaps.type)) {
          // @ts-ignore
          let newVar = allTreeObjs.get(smaps.type);
          // @ts-ignore
          this.handleTree(smaps, id, smaps.typeName, newVar!, sumSize);
        }
        // @ts-ignore
        this.handleAllDataTree(smaps, id, 'All', this.allTree, sumSize!);
        if (id === result.length - 1) {
          this.handleAllSMapsTreeObj(sumSize!, allTreeObjs);
        }
      }
      this.setTotalTreeList(allTreeObjs);
      // 深拷贝数组，不然在给表格赋值之后删除了all那行，表格的数据this.value也会少了all行
      let copyTotalTree = Array.from(this.totalTree);
      table.recycleDataSource = copyTotalTree;
      this.totalTree.shift();
      table.reMeauseHeight();
    } else {
      table.recycleDataSource = [];
      table.reMeauseHeight();
    }
  }

  private setTotalTreeList(allTreeObjs: Map<SmapsType, SmapsTreeObj>): void {
    let treeList = [
      this.allTree,
      allTreeObjs.get(SmapsType.TYPE_CODE_SYS),
      allTreeObjs.get(SmapsType.TYPE_CODE_APP),
      allTreeObjs.get(SmapsType.TYPE_DATA_SYS),
      allTreeObjs.get(SmapsType.TYPE_DATA_APP),
      allTreeObjs.get(SmapsType.TYPE_UNKNOWN_ANON),
      allTreeObjs.get(SmapsType.TYPE_STACK),
      allTreeObjs.get(SmapsType.TYPE_JS_HEAP),
      allTreeObjs.get(SmapsType.TYPE_JAVA_VM),
      allTreeObjs.get(SmapsType.TYPE_NATIVE_HEAP),
      allTreeObjs.get(SmapsType.TYPE_ASHMEM),
      allTreeObjs.get(SmapsType.TYPE_OTHER_SYS),
      allTreeObjs.get(SmapsType.TYPE_OTHER_APP),
    ];
    this.totalTree = [];
    for (let i = 0; i < treeList.length; i++) {
      let tree = treeList[i];
      if (tree && tree.children.length !== 0) {
        this.totalTree.push(tree);
      }
    }
    this.totalTree.sort((previous, next) => next.size - previous.size);
    this.totalTree.unshift(this.allTree!);
  }

  public sortByColumn(column: string, sort: number, table: LitTable): void {
    this.sortArray = [...this.totalTree];
    this.sortByKey(column, sort, table);
    this.sortArray.unshift(this.allTree!);
    let copySortArray = Array.from(this.sortArray);
    table!.recycleDataSource = copySortArray;
    this.sortArray.shift();
  }

  private sortByKey(column: string, sort: number, table: LitTable): void {
    switch (sort) {
      case 0:
        this.sortArray.sort((previous, next) => {
          return next.size - previous.size;
        });
        this.sortArray.unshift(this.allTree!);
        table!.recycleDataSource = this.totalTree;
        this.sortArray.shift();
        break;
      default:
        switch (column) {
          case 'sizeStr':
          case 'rssStr':
          case 'pssStr':
          case 'sharedCleanStr':
          case 'sharedDirtyStr':
          case 'privateCleanStr':
          case 'privateDirtyStr':
          case 'swapStr':
          case 'swapPssStr':
            let key = column.split('Str')[0];
            this.sortArray.sort((previous, next) => {
              // @ts-ignore
              return sort === 1 ? previous[key] - next[key] : next[key] - previous[key];
            });
            break;
          case 'sizeProStr':
            this.sortArray.sort((previous, next) => {
              return sort === 1 ? previous.size - next.size : next.size - previous.size;
            });
            break;
          case 'count':
            this.sortArray.sort((previous, next) => {
              return sort === 1 ? previous.count - next.count : next.count - previous.count;
            });
            break;
          case 'typeName':
            this.sortArray.sort((previous, next) => {
              return sort === 1
                ? previous.typeName.toString().localeCompare(next.typeName.toString())
                : next.typeName.toString().localeCompare(previous.typeName.toString());
            });
            break;
        }
        break;
    }
  }

  public initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <div style="overflow: auto;" class="d-box">
            <lit-table id="tb-smaps-statistics" class="smaps-statistics-table" style="height: auto;" tree>
                <lit-table-column width="250px" title="Type" data-index="typeName" key="typeName" align="flex-start" order retract>
                </lit-table-column>
                <lit-table-column width="150px" title="Path" data-index="path" key="path" align="flex-start">
                </lit-table-column>
                <lit-table-column  width="150px" title="Size" data-index="sizeStr" key="sizeStr" align="flex-start" order>
                </lit-table-column>
                <lit-table-column  width="150px" title="% of Size" data-index="sizeProStr" key="sizeProStr" align="flex-start" order>
                </lit-table-column>
                <lit-table-column  width="150px" title="Count" data-index="count" key="count" align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="150px" title="Rss" data-index="rssStr" key="rssStr" align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="150px" title="Pss" data-index="pssStr" key="pssStr" align="flex-start" order>
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
            </lit-table>
        </div>
        `;
  }
}
