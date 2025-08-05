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
import '../../../../../base-ui/table/lit-table';
import { type ConstructorItem, FileInfo } from '../../../../../js-heap/model/UiStruct';
import { HeapDataInterface } from '../../../../../js-heap/HeapDataInterface';
import '../../../../../base-ui/table/lit-table-column';
import { TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import '../TabPaneJsMemoryFilter';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import '../../../../../base-ui/progress-bar/LitProgressBar';
import '../../../../../base-ui/slicer/lit-slicer';
import { HeapSnapshotStruct } from '../../../../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { HeapTraceFunctionInfo } from '../../../../../js-heap/model/DatabaseStruct';
import { TabPaneSummaryHtml } from './TabPaneSummary.html';

@element('tabpane-summary')
export class TabPaneSummary extends BaseElement {
  private tblSummary: LitTable | null | undefined;
  private tbs: LitTable | null | undefined;
  private stackTable: LitTable | null | undefined;
  private summary: Array<ConstructorItem> = [];
  private retainsData: Array<ConstructorItem> = [];
  private stackData: Array<HeapTraceFunctionInfo> = [];
  private stackText: HTMLElement | undefined;
  private fileSize: number = 0;
  private tabFilter: TabPaneJsMemoryFilter | undefined | null;
  private progressEL: LitProgressBar | null | undefined;
  private summaryFilter: Array<ConstructorItem> = [];
  private summaryData: Array<ConstructorItem> = [];
  private search: HTMLInputElement | null | undefined;
  private tbsTable: HTMLDivElement | null | undefined;
  private tblTable: HTMLDivElement | null | undefined;
  private rightTheadTable: HTMLDivElement | null | undefined;
  private leftTheadTable: HTMLDivElement | null | undefined;
  private leftArray: ConstructorItem[] = [];
  private rightArray: ConstructorItem[] = [];
  private stack: HTMLLIElement | null | undefined;
  private retainers: HTMLLIElement | null | undefined;
  private file: FileInfo | undefined | null;
  private leftTable: HTMLDivElement | null | undefined;

  initElements(): void {
    this.tblSummary = this.shadowRoot?.querySelector<LitTable>('#summary_left');
    this.tbs = this.shadowRoot?.querySelector<LitTable>('#summary_right');
    this.stackTable = this.shadowRoot?.querySelector<LitTable>('#stackTable');
    this.stackText = this.shadowRoot?.querySelector('.stackText') as HTMLElement;
    this.tabFilter = this.shadowRoot?.querySelector('#filter') as TabPaneJsMemoryFilter;
    this.progressEL = this.shadowRoot?.querySelector('.summary_progress') as LitProgressBar;
    this.search = this.tabFilter?.shadowRoot?.querySelector('#js-memory-filter-input') as HTMLInputElement;
    this.stack = this.shadowRoot?.querySelector('#stack') as HTMLLIElement;
    this.retainers = this.shadowRoot?.querySelector('#retainers') as HTMLLIElement;
    this.tblTable = this.tblSummary!.shadowRoot?.querySelector('.table') as HTMLDivElement;
    this.rightTheadTable = this.tbs!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.leftTheadTable = this.tblSummary!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.tbsTable = this.tbs!.shadowRoot?.querySelector('.table') as HTMLDivElement;
    this.leftTable = this.shadowRoot?.querySelector('#summary_left_table') as HTMLDivElement;
    this.classFilter();
  }

  setSnapshotData(
    data: HeapSnapshotStruct,
    dataListCache: Array<HeapSnapshotStruct>,
    scrollCallback: ((d: HeapSnapshotStruct, ds: Array<HeapSnapshotStruct>) => void) | undefined
  ): void {
    if (scrollCallback) {
      scrollCallback(data, dataListCache);
    }
    this.summary = [];
    this.initSummaryData(data);
  }

  initSummaryData(file: FileInfo | HeapSnapshotStruct, minNodeId?: number, maxNodeId?: number): void {
    this.file = file as FileInfo;
    this.clear();
    this.summary = [];
    this.progressEL!.loading = true;
    this.summary = HeapDataInterface.getInstance().getClassesListForSummary(file.id, minNodeId, maxNodeId);
    this.fileSize = file.size;
    this.summary.forEach((summaryEl: unknown) => {
      // @ts-ignore
      if (summaryEl.childCount > 1) {
        // @ts-ignore
        let count = `${summaryEl.nodeName} ×${summaryEl.childCount}`; // @ts-ignore
        summaryEl.objectName = count; // @ts-ignore
        summaryEl.count = ` ×${summaryEl.childCount}`; // @ts-ignore
      } else {
        // @ts-ignore
        summaryEl.objectName = summaryEl.nodeName; // @ts-ignore
      } // @ts-ignore
      let shallow = `${Math.round((summaryEl.shallowSize / file.size) * 100)}%`; // @ts-ignore
      let retained = `${Math.round((summaryEl.retainedSize / file.size) * 100)}%`; // @ts-ignore
      summaryEl.shallowPercent = shallow; // @ts-ignore
      summaryEl.retainedPercent = retained; // @ts-ignore
      if (summaryEl.distance >= 100000000 || summaryEl.distance === -5) {
        // @ts-ignore
        summaryEl.distance = '-';
      }
    });
    if (this.summary.length > 0) {
      this.summaryData = this.summary;
      this.tblSummary!.snapshotDataSource = this.summary;
      this.progressEL!.loading = false;
    } else {
      this.tblSummary!.snapshotDataSource = [];
      this.progressEL!.loading = false;
    }
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        this.tblSummary!.style.height = '100%';
        this.tblSummary!.reMeauseHeight();
      }
    }).observe(this.parentElement!);
    if (this.file!.name.includes('Timeline')) {
      this.retainers!.classList.add('active');
      this.stack!.style.display = 'flex';
      this.retainers!.style.pointerEvents = 'auto';
    } else {
      this.stack!.style.display = 'none';
      this.retainers!.classList.remove('active');
      this.retainers!.style.pointerEvents = 'none';
    }
    this.clickToggleTable();
  }

  private retainsTableByDistance(currentLeftItem: ConstructorItem, sort: number): void {
    const getList = function (list: Array<ConstructorItem>): void {
      list.sort((leftA, rightB) => {
        return sort === 1 ? leftA.distance - rightB.distance : rightB.distance - leftA.distance;
      });
      list.forEach(function (row) {
        if (row.children.length > 0) {
          getList(row.children);
        }
      });
    };
    getList(currentLeftItem.children);
  }

  private retainsTableByShallowSize(currentLeftItem: ConstructorItem, sort: number): void {
    const getList = function (list: Array<ConstructorItem>): void {
      list.sort((leftA, rightB) => {
        return sort === 1 ? leftA.shallowSize - rightB.shallowSize : rightB.shallowSize - leftA.shallowSize;
      });
      list.forEach(function (row) {
        if (row.children.length > 0) {
          getList(row.children);
        }
      });
    };
    getList(currentLeftItem.children);
  }

  private retainsTableByRetainedSize(currentLeftItem: ConstructorItem, sort: number): void {
    const getList = function (list: Array<ConstructorItem>): void {
      list.sort((leftA, rightB) => {
        return sort === 1 ? leftA.retainedSize - rightB.retainedSize : rightB.retainedSize - leftA.retainedSize;
      });
      list.forEach(function (row) {
        if (row.children.length > 0) {
          getList(row.children);
        }
      });
    };
    getList(currentLeftItem.children);
  }

  private retainsTableByObjectName(currentLeftItem: ConstructorItem, sort: number): void {
    const getList = function (list: Array<ConstructorItem>): void {
      list.sort((leftA, rightB) => {
        return sort === 1
          ? `${leftA.objectName}`.localeCompare(`${rightB.objectName}`)
          : `${rightB.objectName}`.localeCompare(`${leftA.objectName}`);
      });
      list.forEach(function (row) {
        if (row.children.length > 0) {
          getList(row.children);
        }
      });
    };
    getList(currentLeftItem.children);
  }

  sortByLeftTable(column: string, sort: number): void {
    switch (sort) {
      case 0:
        if (this.search!.value === '') {
          this.tblSummary!.snapshotDataSource = this.summary;
        } else {
          this.tblSummary!.snapshotDataSource = this.summaryFilter;
        }
        break;
      default:
        if (this.search!.value === '') {
          this.leftArray = [...this.summary];
        } else {
          this.leftArray = [...this.summaryFilter];
        }
        switch (column) {
          case 'distance':
            this.sortLeftByDistanceColum(sort);
            break;
          case 'shallowSize':
            this.sortLeftByShallowSizeColum(sort);
            break;
          case 'retainedSize':
            this.sortLeftByRetainedSizeColum(sort);
            break;
          case 'objectName':
            this.sortLeftByObjectNameColum(sort);
            break;
        }
        break;
    }
  }
  private sortLeftByObjectNameColum(sort: number): void {
    this.tblSummary!.snapshotDataSource = this.leftArray.sort((leftData, rightData) => {
      return sort === 1
        ? `${leftData.objectName}`.localeCompare(`${rightData.objectName}`)
        : `${rightData.objectName}`.localeCompare(`${leftData.objectName}`);
    });
    this.leftArray.forEach((currentLeftItem) => {
      this.retainsTableByObjectName(currentLeftItem, sort);
    });
    this.tblSummary!.snapshotDataSource = this.leftArray;
  }

  private sortLeftByRetainedSizeColum(sort: number): void {
    this.tblSummary!.snapshotDataSource = this.leftArray.sort((leftData, rightData) => {
      return sort === 1
        ? leftData.retainedSize - rightData.retainedSize
        : rightData.retainedSize - leftData.retainedSize;
    });
    this.leftArray.forEach((currentLeftItem) => {
      this.retainsTableByRetainedSize(currentLeftItem, sort);
    });
    this.tblSummary!.snapshotDataSource = this.leftArray;
  }

  private sortLeftByShallowSizeColum(sort: number): void {
    this.tblSummary!.snapshotDataSource = this.leftArray.sort((leftData, rightData) => {
      return sort === 1 ? leftData.shallowSize - rightData.shallowSize : rightData.shallowSize - leftData.shallowSize;
    });
    this.leftArray.forEach((currentLeftItem) => {
      this.retainsTableByShallowSize(currentLeftItem, sort);
    });
    this.tblSummary!.snapshotDataSource = this.leftArray;
  }

  private sortLeftByDistanceColum(sort: number): void {
    this.tblSummary!.snapshotDataSource = this.leftArray.sort((leftData, rightData) => {
      return sort === 1 ? leftData.distance - rightData.distance : rightData.distance - leftData.distance;
    });
    this.leftArray.forEach((currentLeftItem) => {
      this.retainsTableByDistance(currentLeftItem, sort);
    });
    this.tblSummary!.snapshotDataSource = this.leftArray;
  }

  sortByRightTable(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.tbs!.snapshotDataSource = this.retainsData;
        break;
      default:
        this.rightArray = [...this.retainsData];
        switch (column) {
          case 'distance':
            this.tbs!.snapshotDataSource = this.rightArray.sort((a, b) => {
              return sort === 1 ? a.distance - b.distance : b.distance - a.distance;
            });
            this.rightArray.forEach((list) => {
              this.retainsTableByDistance(list, sort);
            });
            this.tbs!.snapshotDataSource = this.rightArray;
            break;
          case 'shallowSize':
            this.tbs!.snapshotDataSource = this.rightArray.sort((a, b) => {
              return sort === 1 ? a.shallowSize - b.shallowSize : b.shallowSize - a.shallowSize;
            });
            this.rightArray.forEach((list) => {
              this.retainsTableByShallowSize(list, sort);
            });
            this.tbs!.snapshotDataSource = this.rightArray;
            break;
          case 'retainedSize':
            this.tbs!.snapshotDataSource = this.rightArray.sort((a, b) => {
              return sort === 1 ? a.retainedSize - b.retainedSize : b.retainedSize - a.retainedSize;
            });
            this.rightArray.forEach((list) => {
              this.retainsTableByRetainedSize(list, sort);
            });
            this.tbs!.snapshotDataSource = this.rightArray;
            break;
          case 'objectName':
            this.tbs!.snapshotDataSource = this.rightArray.sort((a, b) => {
              return sort === 1
                ? `${a.objectName}`.localeCompare(`${b.objectName}`)
                : `${b.objectName}`.localeCompare(`${a.objectName}`);
            });
            this.rightArray.forEach((list) => {
              this.retainsTableByObjectName(list, sort);
            });
            this.tbs!.snapshotDataSource = this.rightArray;
            break;
        }
        break;
    }
  }

  clickToggleTable(): void {
    let lis = this.shadowRoot?.querySelectorAll<HTMLElement>('li')!;
    for (const item of lis) {
      item.onclick = (): void => {
        item.className = '';
        switch (item.textContent) {
          case 'Retainers':
            this.stackTable!.style.display = 'none';
            this.stackText!.style.display = 'none';
            this.tbs!.style.display = 'flex';
            this.tbs!.snapshotDataSource = this.retainsData;
            break;
          case 'Allocation stack':
            if (this.stackData.length > 0) {
              this.stackText!.style.display = 'none';
              this.stackTable!.style.display = 'flex';
              this.stackTable!.recycleDataSource = this.stackData;
            } else {
              this.stackText!.style.display = 'flex';
              if (this.retainsData === undefined || this.retainsData.length === 0) {
                this.stackText!.textContent = '';
              } else {
                this.stackText!.textContent =
                  'Stack was not recorded for this object because it had been allocated before ' +
                  'this profile recording started.';
              }
            }
            this.tbs!.style.display = 'none';
            break;
        }
        // @ts-ignore
        this.className = 'active';
      };
    }
  }

  classFilter(): void {
    this.search!.addEventListener('keyup', () => {
      this.summaryFilter = [];
      this.summaryData.forEach((a) => {
        if (a.objectName.toLowerCase().includes(this.search!.value.toLowerCase())) {
          this.summaryFilter.push(a);
        } else {
        }
      });
      this.tblSummary!.snapshotDataSource = this.summaryFilter;
      let summaryTable = this.tblSummary!.shadowRoot?.querySelector('.table') as HTMLDivElement;
      summaryTable.scrollTop = 0;
      this.tblSummary!.reMeauseHeight();
    });
  }

  clear(): void {
    this.tbs!.snapshotDataSource = [];
    this.stackTable!.recycleDataSource = [];
    this.retainsData = [];
    this.stackText!.textContent = '';
    this.search!.value = '';
    this.stack!.classList.remove('active');
    this.tblTable!.scrollTop = 0;
    this.stackTable!.style.display = 'none';
    this.stackText!.style.display = 'none';
    this.tbs!.style.display = 'flex';
    this.rightTheadTable!.removeAttribute('sort');
    this.leftTheadTable!.removeAttribute('sort');
  }

  connectedCallback(): void {
    super.connectedCallback();
    let filterHeight = 0;
    let parentWidth = `${this.parentElement!.clientWidth}px`;
    let system = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector('#app-content > sp-system-trace');
    new ResizeObserver(() => {
      let summaryPaneFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      if (summaryPaneFilter.clientHeight > 0) {
        filterHeight = summaryPaneFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        summaryPaneFilter.style.display = 'flex';
      } else {
        summaryPaneFilter.style.display = 'none';
      }
      parentWidth = `${this.parentElement!.clientWidth}px`;
      this.tbs!.style.height = 'calc(100% - 30px)';
      this.tbsTable!.style.width = `calc(${parentWidth} - ${this.leftTable!.style.width} - 5px)`;
      this.tbs!.reMeauseHeight();
      this.tblSummary!.reMeauseHeight();
    }).observe(this.parentElement!);
    new ResizeObserver(() => {
      this.parentElement!.style.width = `${system!.clientWidth}px`;
      this.style.width = `${system!.clientWidth}px`;
    }).observe(system!);
    new ResizeObserver(() => {
      this.tbsTable!.style.width = `calc(${parentWidth} - ${this.leftTable!.style.width} - 5px)`;
    }).observe(this.leftTable!);

    this.tblSummary!.addEventListener('row-click', this.tblSummaryRowClick);
    this.tbs!.addEventListener('row-click', this.tbsRowClick);
    this.tblSummary!.addEventListener('icon-click', this.tblSummaryIconClick);
    this.tbs!.addEventListener('icon-click', this.tbsIconClick);
    this.tblSummary!.addEventListener('column-click', this.tblSummaryColumnClick);
    this.tbs!.addEventListener('column-click', this.tblColumnClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.tblSummary!.removeEventListener('row-click', this.tblSummaryRowClick);
    this.tbs!.removeEventListener('row-click', this.tbsRowClick);
    this.tblSummary!.removeEventListener('icon-click', this.tblSummaryIconClick);
    this.tbs!.removeEventListener('icon-click', this.tbsIconClick);
    this.tblSummary!.removeEventListener('column-click', this.tblSummaryColumnClick);
    this.tbs!.removeEventListener('column-click', this.tblColumnClick);
  }

  tblColumnClick = (evt: Event): void => {
    // @ts-ignore
    this.sortByRightTable(evt.detail.key, evt.detail.sort);
    this.tbs!.reMeauseHeight();
  };

  tblSummaryColumnClick = (evt: Event): void => {
    // @ts-ignore
    this.sortByLeftTable(evt.detail.key, evt.detail.sort);
    this.tblSummary!.reMeauseHeight();
  };

  tbsIconClick = (evt: Event): void => {
    // @ts-ignore
    let data = evt.detail.data;
    if (data.status) {
      data.getChildren();
      let i = 0;
      let retainsTable = (): void => {
        const getList = (list: Array<ConstructorItem>): void => {
          list.forEach((currentRow: ConstructorItem) => {
            let shallow = `${Math.round((currentRow.shallowSize / this.fileSize) * 100)}%`;
            let retained = `${Math.round((currentRow.retainedSize / this.fileSize) * 100)}%`;
            currentRow.shallowPercent = shallow;
            currentRow.retainedPercent = retained;
            let nodeId = `${currentRow.nodeName} @${currentRow.id}`;
            currentRow.objectName = `${currentRow.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
            if (currentRow.distance >= 100000000 || currentRow.distance === -5) {
              // @ts-ignore
              currentRow.distance = '-';
            }
            i++;
            // @ts-ignore
            if (i < evt.detail.data.distance - 1 && list[0].distance !== '-') {
              list[0].getChildren();
              list[0].expanded = false;
              if (currentRow.hasNext) {
                getList(currentRow.children);
              }
            } else {
              return;
            }
          });
        };
        getList(data.children);
      };
      retainsTable();
    } else {
      data.status = true;
    }
    if (this.rightTheadTable!.hasAttribute('sort')) {
      this.tbs!.snapshotDataSource = this.rightArray;
    } else {
      this.tbs!.snapshotDataSource = this.retainsData;
    }
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        this.tbs!.style.height = 'calc(100% - 30px)';
        this.tbs!.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  };

  tblSummaryIconClick = (evt: Event): void => {
    // @ts-ignore
    let data = evt.detail.data;
    if (data.status) {
      data.getChildren();
      if (data.children.length > 0) {
        data.children.sort(function (a: ConstructorItem, b: ConstructorItem) {
          return b.retainedSize - a.retainedSize;
        });
        data.children.forEach((summaryDataEl: any) => {
          let shallow = `${Math.round((summaryDataEl.shallowSize / this.fileSize) * 100)}%`;
          let retained = `${Math.round((summaryDataEl.retainedSize / this.fileSize) * 100)}%`;
          summaryDataEl.shallowPercent = shallow;
          summaryDataEl.retainedPercent = retained;
          if (summaryDataEl.distance >= 100000000 || summaryDataEl.distance === -5) {
            summaryDataEl.distance = '-';
          }
          let nodeId = `${summaryDataEl.nodeName} @${summaryDataEl.id}`;
          summaryDataEl.nodeId = ` @${summaryDataEl.id}`;
          if (data.isString()) {
            summaryDataEl.objectName = `"${summaryDataEl.nodeName}"` + ` @${summaryDataEl.id}`;
          } else {
            summaryDataEl.objectName = nodeId;
          }
          if (summaryDataEl.edgeName !== '') {
            summaryDataEl.objectName = `${summaryDataEl.edgeName}\xa0` + '::' + `\xa0${nodeId}`;
          }
        });
      } else {
        this.tblSummary!.snapshotDataSource = [];
      }
    } else {
      data.status = true;
    }
    this.tblSummaryIconClickExtend();
  };

  tblSummaryIconClickExtend(): void {
    if (this.search!.value !== '') {
      if (this.leftTheadTable!.hasAttribute('sort')) {
        this.tblSummary!.snapshotDataSource = this.leftArray;
      } else {
        this.tblSummary!.snapshotDataSource = this.summaryFilter;
      }
    } else {
      if (this.leftTheadTable!.hasAttribute('sort')) {
        this.tblSummary!.snapshotDataSource = this.leftArray;
      } else {
        this.tblSummary!.snapshotDataSource = this.summary;
      }
    }
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        this.tblSummary!.style.height = '100%';
        this.tblSummary!.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }

  tbsRowClick = (rowEvent: Event): void => {
    // @ts-ignore
    let data = rowEvent.detail.data as ConstructorItem;
    (data as any).isSelected = true;
    // @ts-ignore
    if ((rowEvent.detail as any).callBack) {
      // @ts-ignore
      (rowEvent.detail as any).callBack(true);
    }
  };

  tblSummaryRowClick = (evt: Event): void => {
    this.rightTheadTable!.removeAttribute('sort');
    this.tbsTable!.scrollTop = 0;
    //@ts-ignore
    let data = evt.detail.data as ConstructorItem;
    (data as any).isSelected = true;
    this.initRetainsData(data);
    if (this.retainsData.length > 0) {
      if (this.retainsData[0].distance > 1) {
        this.retainsData[0].getChildren();
        this.retainsData[0].expanded = false;
      }
      let i = 0;
      let retainsTable = (): void => {
        const getList = (list: Array<ConstructorItem>): void => {
          list.forEach((summaryRow: ConstructorItem) => {
            let retainsShallow = `${Math.round((summaryRow.shallowSize / this.fileSize) * 100)}%`;
            let retained = `${Math.round((summaryRow.retainedSize / this.fileSize) * 100)}%`;
            summaryRow.shallowPercent = retainsShallow;
            summaryRow.retainedPercent = retained;
            let nodeId = `${summaryRow.nodeName} @${summaryRow.id}`;
            summaryRow.objectName = `${summaryRow.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
            if (summaryRow.distance >= 100000000 || summaryRow.distance === -5) {
              //@ts-ignore
              summaryRow.distance = '-';
            }
            i++;
            //@ts-ignore
            if (i < this.retainsData[0].distance - 1 && list[0].distance !== '-') {
              list[0].getChildren();
              list[0].expanded = false;
              if (summaryRow.hasNext) {
                getList(summaryRow.children);
              }
            } else {
              return;
            }
          });
        };
        getList(this.retainsData[0].children);
      };
      retainsTable();
      this.tbs!.snapshotDataSource = this.retainsData;
    } else {
      this.tbs!.snapshotDataSource = [];
    }
    //@ts-ignore
    this.tblSummaryRowClickExtend(evt.detail);
  };

  private initRetainsData(data: ConstructorItem): void {
    this.retainsData = [];
    this.retainsData = HeapDataInterface.getInstance().getRetains(data);
    this.retainsData.forEach((element) => {
      let shallow = `${Math.round((element.shallowSize / this.fileSize) * 100)}%`;
      let retained = `${Math.round((element.retainedSize / this.fileSize) * 100)}%`;
      element.shallowPercent = shallow;
      element.retainedPercent = retained;
      if (element.distance >= 100000000 || element.distance === -5) {
        //@ts-ignore
        element.distance = '-';
      }
      let nodeId = `${element.nodeName} @${element.id}`;
      element.objectName = `${element.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
    });
  }

  private tblSummaryRowClickExtend(detail: any): void {
    if (this.file!.name.includes('Timeline')) {
      this.stackData = HeapDataInterface.getInstance().getAllocationStackData(detail.data);
      if (this.stackData.length > 0) {
        this.stackTable!.recycleDataSource = this.stackData;
        this.stackText!.textContent = '';
        this.stackText!.style.display = 'none';
        if (this.stack!.className === 'active') {
          this.stackTable!.style.display = 'grid';
          this.tbs!.style.display = 'none';
        }
      } else {
        this.stackText!.style.display = 'flex';
        this.stackTable!.recycleDataSource = [];
        this.stackTable!.style.display = 'none';
        if (this.retainers!.className === 'active') {
          this.stackText!.style.display = 'none';
        }
        if (this.retainsData === undefined || this.retainsData.length === 0) {
          this.stackText!.textContent = '';
        } else {
          this.stackText!.textContent =
            'Stack was not recorded for this object because it had been allocated before ' +
            'this profile recording started.';
        }
      }
    }
    new ResizeObserver(() => {
      this.tbs!.style.height = 'calc(100% - 30px)';
      this.tbs!.reMeauseHeight();
      this.stackTable!.style.height = 'calc(100% - 30px)';
      this.stackTable!.reMeauseHeight();
    }).observe(this.parentElement!);
    if (detail.callBack) {
      detail.callBack(true);
    }
  }

  initHtml(): string {
    return TabPaneSummaryHtml;
  }
}
