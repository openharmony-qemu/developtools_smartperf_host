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
  private searchCount: Element | undefined | null;
  private sourceData: Array<SmapsTreeObj> = [];

  public initElements(): void {
    this.tblSmapsStatistics = this.shadowRoot?.querySelector<LitTable>('lit-table');
    this.tabTitle = this.tblSmapsStatistics!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.searchCount = this.shadowRoot?.querySelector('#search-count');
    this.tblSmapsStatistics!.addEventListener('column-click', (evt) => {
      //   @ts-ignore
      this.sortByColumn(evt.detail.key, evt.detail.sort, this.tblSmapsStatistics);
    });
    let filterInput = this.shadowRoot?.querySelector('#filterName');
    filterInput?.addEventListener('input', (e) => {
      // @ts-ignore
      this.findPath(e.target.value);
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
      this.sourceData = Array.from(this.totalTree);
      let filterInput = this.shadowRoot?.querySelector('#filterName') as HTMLInputElement;
      if (filterInput && filterInput.value.trim() !== '') {
        this.findPath(filterInput.value);
      }
    } else {
      table.recycleDataSource = [];
      table.reMeauseHeight();
      this.sourceData = [];
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

  private checkPathMatch(pathValue: unknown, searchStr: string): boolean {
    if (Array.isArray(pathValue)) {
      let pathStr = pathValue.join(',');
      return pathStr.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1;
    } else if (typeof pathValue === 'string') {
      return pathValue.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1;
    }
    return false;
  }

  private filterTree(item: SmapsTreeObj, searchStr: string): SmapsTreeObj | null {
    let matchedChildren: Array<SmapsTreeObj> = [];
    let selfMatched = this.checkPathMatch(item.path, searchStr);
    
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        let filteredChild = this.filterTree(child, searchStr);
        if (filteredChild) {
          matchedChildren.push(filteredChild);
        }
      });
    }
    
    if (selfMatched || matchedChildren.length > 0) {
      let filteredItem = new SmapsTreeObj(item.id, item.pid, item.typeName);
      filteredItem.path = item.path;
      filteredItem.children = matchedChildren;
      
      if (selfMatched && matchedChildren.length === 0) {
        filteredItem.size = item.size;
        filteredItem.sizeStr = item.sizeStr;
        filteredItem.sizePro = item.sizePro;
        filteredItem.sizeProStr = item.sizeProStr;
        filteredItem.count = 1;
        filteredItem.rss = item.rss;
        filteredItem.rssStr = item.rssStr;
        filteredItem.pss = item.pss;
        filteredItem.pssStr = item.pssStr;
        filteredItem.sharedClean = item.sharedClean;
        filteredItem.sharedCleanStr = item.sharedCleanStr;
        filteredItem.sharedDirty = item.sharedDirty;
        filteredItem.sharedDirtyStr = item.sharedDirtyStr;
        filteredItem.privateClean = item.privateClean;
        filteredItem.privateCleanStr = item.privateCleanStr;
;
        filteredItem.privateDirty = item.privateDirty;
        filteredItem.privateDirtyStr = item.privateDirtyStr;
        filteredItem.swap = item.swap;
        filteredItem.swapStr = item.swapStr;
        filteredItem.swapPss = item.swapPss;
        filteredItem.swapPssStr = item.swapPssStr;
      } else {
        filteredItem.size = 0;
        filteredItem.count = 0;
        filteredItem.rss = 0;
        filteredItem.pss = 0;
        filteredItem.sharedClean = 0;
        filteredItem.sharedDirty = 0;
        filteredItem.privateClean = 0;
        filteredItem.privateDirty = 0;
        filteredItem.swap = 0;
        filteredItem.swapPss = 0;
        
        matchedChildren.forEach((child) => {
          filteredItem.size += child.size;
          filteredItem.count += child.count;
          filteredItem.rss += child.rss;
          filteredItem.pss += child.pss;
          filteredItem.sharedClean += child.sharedClean;
          filteredItem.sharedDirty += child.sharedDirty;
          filteredItem.privateClean += child.privateClean;
          filteredItem.privateDirty += child.privateDirty;
          filteredItem.swap += child.swap;
          filteredItem.swapPss += child.swapPss;
        });
        
        if (selfMatched) {
          filteredItem.count += 1;
          filteredItem.size += item.size;
          filteredItem.rss += item.rss;
          filteredItem.pss += item.pss;
          filteredItem.sharedClean += item.sharedClean;
          filteredItem.sharedDirty += item.sharedDirty;
          filteredItem.privateClean += item.privateClean;
          filteredItem.privateDirty += item.privateDirty;
          filteredItem.swap += item.swap;
          filteredItem.swapPss += item.swapPss;
        }
        
        filteredItem.sizeStr = Utils.getBinaryByteWithUnit(filteredItem.size);
        filteredItem.sizePro = this.calculatePercentage(filteredItem.size, this.sumSize);
        filteredItem.sizeProStr = filteredItem.sizePro.toFixed(2) + '%' === '0.00%' ? '0%' : filteredItem.sizePro.toFixed(2) + '%';
        filteredItem.rssStr = Utils.getBinaryByteWithUnit(filteredItem.rss);
        filteredItem.pssStr = Utils.getBinaryByteWithUnit(filteredItem.pss);
        filteredItem.sharedCleanStr = Utils.getBinaryByteWithUnit(filteredItem.sharedClean);
        filteredItem.sharedDirtyStr = Utils.getBinaryByteWithUnit(filteredItem.sharedDirty);
        filteredItem.privateCleanStr = Utils.getBinaryByteWithUnit(filteredItem.privateClean);
        filteredItem.privateDirtyStr = Utils.getBinaryByteWithUnit(filteredItem.privateDirty);
        filteredItem.swapStr = Utils.getBinaryByteWithUnit(filteredItem.swap);
        filteredItem.swapPssStr = Utils.getBinaryByteWithUnit(filteredItem.swapPss);
      }
      
      return filteredItem;
    }
    return null;
  }

  private calculateTreeSum(item: SmapsTreeObj): number {
    let sum = item.size;
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        sum += this.calculateTreeSum(child);
      });
    }
    return sum;
  }

  private updateSizePro(item: SmapsTreeObj, totalSize: number): void {
    item.sizePro = this.calculatePercentage(item.size, totalSize);
    item.sizeProStr = item.sizePro.toFixed(2) + '%' === '0.00%' ? '0%' : item.sizePro.toFixed(2) + '%';
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        this.updateSizePro(child, totalSize);
      });
    }
  }

  private calculateLeafCount(item: SmapsTreeObj): number {
    if (!item.children || item.children.length === 0) {
      return 1;
    }
    let count = 0;
    item.children.forEach((child) => {
      count += this.calculateLeafCount(child);
    });
    return count;
  }

  private updateCount(item: SmapsTreeObj): void {
    if (item.children && item.children.length > 0) {
      item.count = 0;
      item.children.forEach((child) => {
        this.updateCount(child);
        item.count += child.count;
      });
    }
  }

  private calculateTotalNodeCount(items: Array<SmapsTreeObj>): number {
    let count = 0;
    items.forEach((item) => {
      count += 1;
      if (item.children && item.children.length > 0) {
        count += this.calculateTotalNodeCount(item.children);
      }
    });
    return count;
  }

  findPath(str: string): void {
    if (str === '') {
      let displayData = Array.from(this.sourceData);
      if (this.allTree) {
        let allTreeCopy = new SmapsTreeObj(this.allTree.id, this.allTree.pid, this.allTree.typeName);
        allTreeCopy.path = this.allTree.path;
        allTreeCopy.size = this.allTree.size;
        allTreeCopy.sizeStr = this.allTree.sizeStr;
        allTreeCopy.sizePro = this.allTree.sizePro;
        allTreeCopy.sizeProStr = this.allTree.sizeProStr;
        allTreeCopy.count = this.allTree.count;
        allTreeCopy.rss = this.allTree.rss;
        allTreeCopy.rssStr = this.allTree.rssStr;
        allTreeCopy.pss = this.allTree.pss;
        allTreeCopy.pssStr = this.allTree.pssStr;
        allTreeCopy.sharedClean = this.allTree.sharedClean;
        allTreeCopy.sharedCleanStr = this.allTree.sharedCleanStr;
        allTreeCopy.sharedDirty = this.allTree.sharedDirty;
        allTreeCopy.sharedDirtyStr = this.allTree.sharedDirtyStr;
        allTreeCopy.privateClean = this.allTree.privateClean;
        allTreeCopy.privateCleanStr = this.allTree.privateCleanStr;
        allTreeCopy.privateDirty = this.allTree.privateDirty;
        allTreeCopy.privateDirtyStr = this.allTree.privateDirtyStr;
        allTreeCopy.swap = this.allTree.swap;
        allTreeCopy.swapStr = this.allTree.swapStr;
        allTreeCopy.swapPss = this.allTree.swapPss;
        allTreeCopy.swapPssStr = this.allTree.swapPssStr;
        allTreeCopy.children = [];
        displayData.unshift(allTreeCopy);
      }
      this.tblSmapsStatistics!.recycleDataSource = displayData;
      let totalCount = this.calculateTotalNodeCount(this.sourceData);
      this.searchCount!.textContent = totalCount + '';
    } else {
      let searchData: Array<SmapsTreeObj> = [];
      
      this.sourceData.forEach((item) => {
        let filteredItem = this.filterTree(item, str);
        if (filteredItem) {
          searchData.push(filteredItem);
        }
      });
      
      let matchedCount = 0;
      if (searchData.length > 0 && this.allTree) {
        let allTreeCopy = new SmapsTreeObj(this.allTree.id, this.allTree.pid, this.allTree.typeName);
        allTreeCopy.path = this.allTree.path;
        allTreeCopy.size = 0;
        allTreeCopy.count = 0;
        allTreeCopy.rss = 0;
        allTreeCopy.pss = 0;
        allTreeCopy.sharedClean = 0;
        allTreeCopy.sharedDirty = 0;
        allTreeCopy.privateClean = 0;
        allTreeCopy.privateDirty = 0;
        allTreeCopy.swap = 0;
        allTreeCopy.swapPss = 0;
        allTreeCopy.children = [];
        
        searchData.forEach((item) => {
          allTreeCopy.size += item.size;
          allTreeCopy.count += item.count;
          allTreeCopy.rss += item.rss;
          allTreeCopy.pss += item.pss;
          allTreeCopy.sharedClean += item.sharedClean;
          allTreeCopy.sharedDirty += item.sharedDirty;
          allTreeCopy.privateClean += item.privateClean;
          allTreeCopy.privateDirty += item.privateDirty;
          allTreeCopy.swap += item.swap;
          allTreeCopy.swapPss += item.swapPss;
        });
        
        allTreeCopy.sizeStr = Utils.getBinaryByteWithUnit(allTreeCopy.size);
        allTreeCopy.sizePro = 100;
        allTreeCopy.sizeProStr = '100%';
        allTreeCopy.rssStr = Utils.getBinaryByteWithUnit(allTreeCopy.rss);
        allTreeCopy.pssStr = Utils.getBinaryByteWithUnit(allTreeCopy.pss);
        allTreeCopy.sharedCleanStr = Utils.getBinaryByteWithUnit(allTreeCopy.sharedClean);
        allTreeCopy.sharedDirtyStr = Utils.getBinaryByteWithUnit(allTreeCopy.sharedDirty);
        allTreeCopy.privateCleanStr = Utils.getBinaryByteWithUnit(allTreeCopy.privateClean);
        allTreeCopy.privateDirtyStr = Utils.getBinaryByteWithUnit(allTreeCopy.privateDirty);
        allTreeCopy.swapStr = Utils.getBinaryByteWithUnit(allTreeCopy.swap);
        allTreeCopy.swapPssStr = Utils.getBinaryByteWithUnit(allTreeCopy.swapPss);
        
        searchData.forEach((item) => {
          this.updateSizePro(item, allTreeCopy.size);
          this.updateCount(item);
        });
        
        searchData.unshift(allTreeCopy);
        matchedCount = allTreeCopy.count;
      }
      
      this.tblSmapsStatistics!.recycleDataSource = searchData;
      this.searchCount!.textContent = matchedCount + '';
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
        #filterName:focus{
          outline: none;
        }
        </style>
        <div style="display:flex; justify-content:space-between;">
        <div style="width: 40%;">
          <input id="filterName" type="text" style="width:60%;height:18px;border:1px solid #c3c3c3;border-radius:9px" placeholder="Search" value="" />
          &nbsp;&nbsp;<span style="font-size: 10pt;margin-bottom: 5px">Count:&nbsp;<span id="search-count">0</span></span>
        </div>
        </div>
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
