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
import { HeapDataInterface } from '../../../../../js-heap/HeapDataInterface';
import { ConstructorComparison, ConstructorItem, ConstructorType } from '../../../../../js-heap/model/UiStruct';
import '../../../../../base-ui/table/lit-table-column';
import { TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import '../TabPaneJsMemoryFilter';
import { HeapSnapshotStruct } from '../../../../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { LitSelectOption } from '../../../../../base-ui/select/LitSelectOption';
import { LitSelect } from '../../../../../base-ui/select/LitSelect';
import { TabPaneComparisonHtml } from './TabPaneComparison.html';

@element('tabpane-comparison')
export class TabPaneComparison extends BaseElement {
  private comparisonTableEl: LitTable | undefined | null;
  private retainerTableEl: LitTable | undefined | null;
  private comparisonsData: Array<ConstructorComparison> = [];
  private retainsData: Array<ConstructorItem> = [];
  private baseFileId: number | undefined | null;
  private targetFileId: number | undefined | null;
  private filterEl: TabPaneJsMemoryFilter | undefined | null;
  private selectEl: LitSelect | undefined | null;
  private search: HTMLInputElement | undefined | null;
  private comparisonData: Array<ConstructorItem> = [];
  private comparisonFilter: Array<ConstructorComparison> = [];
  private leftArray: Array<ConstructorComparison> = [];
  private rightArray: Array<ConstructorItem> = [];
  private rightTheadTable: HTMLDivElement | undefined | null;
  private leftTheadTable: HTMLDivElement | undefined | null;
  private comparisonTable: HTMLDivElement | undefined | null;
  private fileSize: number = 0;

  initElements(): void {
    this.comparisonTableEl = this.shadowRoot!.querySelector<LitTable>('#tb-comparison') as LitTable;
    this.retainerTableEl = this.shadowRoot!.querySelector<LitTable>('#tb-retainer') as LitTable;
    this.filterEl = this.shadowRoot!.querySelector<TabPaneJsMemoryFilter>('#filter');
    this.selectEl = this.filterEl?.shadowRoot?.querySelector<LitSelect>('lit-select');
    this.search = this.filterEl?.shadowRoot?.querySelector('#js-memory-filter-input') as HTMLInputElement;
    this.rightTheadTable = this.retainerTableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.leftTheadTable = this.comparisonTableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.comparisonTable = this.comparisonTableEl.shadowRoot?.querySelector('.table') as HTMLDivElement;
    this.classFilter();
  }

  initComparison(data: HeapSnapshotStruct, dataListCache: Array<HeapSnapshotStruct>): void {
    this.clear();
    this.retainerTableEl!.snapshotDataSource = [];
    let fileArr: HeapSnapshotStruct[] = [];
    for (let file of dataListCache) {
      if (file.id !== data.id) {
        fileArr.push(file);
      }
    }
    fileArr = fileArr.sort();
    this.fileSize = data.size;
    this.initSelect(data.id, fileArr);
    this.baseFileId = data.id;
    this.targetFileId = fileArr[0].id;
    this.updateComparisonData(data.id, fileArr[0].id);
    new ResizeObserver((): void => {
      this.comparisonTableEl!.style.height = '100%';
      this.comparisonTableEl!.reMeauseHeight();
    }).observe(this.parentElement!);
  }

  updateComparisonData(baseFileId: number, targetFileId: number): void {
    this.comparisonsData = HeapDataInterface.getInstance().getClassListForComparison(baseFileId, targetFileId);
    this.comparisonsData.forEach((dataList): void => {
      dataList.objectName = dataList.nodeName;
    });
    if (this.comparisonsData.length > 0) {
      this.comparisonData = this.comparisonsData;
      this.comparisonTableEl!.snapshotDataSource = this.comparisonsData;
    } else {
      this.comparisonTableEl!.snapshotDataSource = [];
    }
    this.comparisonTableEl!.reMeauseHeight();
  }

  initSelect(fileId: number, comFileArr: Array<HeapSnapshotStruct>): void {
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    this.selectEl!.defaultValue = comFileArr[0].name || '';
    this.selectEl!.placeholder = comFileArr[0].name || '';
    this.selectEl!.dataSource = comFileArr;
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.prepend(option);
    if (comFileArr[0].name) {
      option.setAttribute('value', comFileArr[0].name);
    }
    let selectOption = this.selectEl!.querySelectorAll('lit-select-option');
    for (const item of selectOption) {
      item.addEventListener('onSelected', (e): void => {
        this.comparisonTable!.scrollTop = 0;
        this.retainerTableEl!.snapshotDataSource = [];
        for (let f of comFileArr) {
          if (input.value === f.name) {
            this.updateComparisonData(fileId, f.id);
          }
        }
        e.stopPropagation();
      });
    }
  }

  sortComprisonByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        if (this.search!.value === '') {
          this.comparisonTableEl!.snapshotDataSource = this.comparisonsData;
        } else {
          this.comparisonTableEl!.snapshotDataSource = this.comparisonFilter;
        }
        break;
      default:
        if (this.search!.value === '') {
          this.leftArray = [...this.comparisonsData];
        } else {
          this.leftArray = [...this.comparisonFilter];
        }
        this.sortComprisonByColumnExtend(column, sort);
        break;
    }
  }

  private sortComprisonByColumnExtend(column: string, sort: number): void {
    switch (column) {
      case 'addedCount':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.addedCount - b.addedCount : b.addedCount - a.addedCount;
        });
        break;
      case 'removedCount':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.removedCount - b.removedCount : b.removedCount - a.removedCount;
        });
        break;
      case 'deltaCount':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.deltaCount - b.deltaCount : b.deltaCount - a.deltaCount;
        });
        break;
      case 'objectName':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1
            ? `${a.objectName}`.localeCompare(`${b.objectName}`)
            : `${b.objectName}`.localeCompare(`${a.objectName}`);
        });
        break;
      case 'addedSize':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.addedSize - b.addedSize : b.addedSize - a.addedSize;
        });
        break;
      case 'removedSize':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.removedSize - b.removedSize : b.removedSize - a.removedSize;
        });
        break;
      case 'deltaSize':
        this.comparisonTableEl!.snapshotDataSource = this.leftArray.sort((a, b): number => {
          return sort === 1 ? a.deltaSize - b.deltaSize : b.deltaSize - a.deltaSize;
        });
        break;
    }
  }

  sortRetainerByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.retainerTableEl!.snapshotDataSource = this.retainsData;
        break;
      default:
        this.rightArray = [...this.retainsData];
        switch (column) {
          case 'distance':
            this.sortRetainerByDistanceType(sort);
            break;
          case 'shallowSize':
            this.sortRetainerByShallowSizeType(sort);
            break;
          case 'retainedSize':
            this.sortRetainerByRetainedSizeType(sort);
            break;
          case 'objectName':
            this.sortRetainerByObjectNameType(sort);
            break;
        }
        break;
    }
  }

  private sortRetainerByObjectNameType(sort: number): void {
    this.retainerTableEl!.snapshotDataSource = this.rightArray.sort((rightArrA, rightArrB): number => {
      return sort === 1
        ? `${rightArrA.objectName}`.localeCompare(`${rightArrB.objectName}`)
        : `${rightArrB.objectName}`.localeCompare(`${rightArrA.objectName}`);
    });
    this.rightArray.forEach((list): void => {
      let retainsTable = (): void => {
        const getList = (listArr: Array<ConstructorItem>): void => {
          listArr.sort((listArrA, listArrB): number => {
            return sort === 1
              ? `${listArrA.objectName}`.localeCompare(`${listArrB.objectName}`)
              : `${listArrB.objectName}`.localeCompare(`${listArrA.objectName}`);
          });
          listArr.forEach(function (currentRow): void {
            if (currentRow.children.length > 0) {
              getList(currentRow.children);
            }
          });
        };
        getList(list.children);
      };
      retainsTable();
    });
    this.retainerTableEl!.snapshotDataSource = this.rightArray;
  }

  private sortRetainerByRetainedSizeType(sort: number): void {
    this.retainerTableEl!.snapshotDataSource = this.rightArray.sort((rightArrA, rightArrB): number => {
      return sort === 1
        ? rightArrA.retainedSize - rightArrB.retainedSize
        : rightArrB.retainedSize - rightArrA.retainedSize;
    });
    this.rightArray.forEach((list): void => {
      let retainsTable = (): void => {
        const getList = (listArr: Array<ConstructorItem>): void => {
          listArr.sort((listArrA, listArrB): number => {
            return sort === 1
              ? listArrA.retainedSize - listArrB.retainedSize
              : listArrB.retainedSize - listArrA.retainedSize;
          });
          listArr.forEach(function (row): void {
            if (row.children.length > 0) {
              getList(row.children);
            }
          });
        };
        getList(list.children);
      };
      retainsTable();
    });
    this.retainerTableEl!.snapshotDataSource = this.rightArray;
  }

  private sortRetainerByShallowSizeType(sort: number): void {
    this.retainerTableEl!.snapshotDataSource = this.rightArray.sort((rightArrA, rightArrB): number => {
      return sort === 1 ? rightArrA.shallowSize - rightArrB.shallowSize : rightArrB.shallowSize - rightArrA.shallowSize;
    });
    this.rightArray.forEach((list): void => {
      let retainsTable = (): void => {
        const getList = (listArr: Array<ConstructorItem>): void => {
          listArr.sort((listArrA, listArrB): number => {
            return sort === 1
              ? listArrA.shallowSize - listArrB.shallowSize
              : listArrB.shallowSize - listArrA.shallowSize;
          });
          listArr.forEach(function (rowEl): void {
            if (rowEl.children.length > 0) {
              getList(rowEl.children);
            }
          });
        };
        getList(list.children);
      };
      retainsTable();
    });
    this.retainerTableEl!.snapshotDataSource = this.rightArray;
  }

  private sortRetainerByDistanceType(sort: number): void {
    this.retainerTableEl!.snapshotDataSource = this.rightArray.sort((a, b): number => {
      return sort === 1 ? a.distance - b.distance : b.distance - a.distance;
    });
    this.rightArray.forEach((list): void => {
      let retainsTable = (): void => {
        const getList = (currentList: Array<ConstructorItem>): void => {
          currentList.sort((a, b): number => {
            return sort === 1 ? a.distance - b.distance : b.distance - a.distance;
          });
          currentList.forEach(function (currentRow): void {
            if (currentRow.children.length > 0) {
              getList(currentRow.children);
            }
          });
        };
        getList(list.children);
      };
      retainsTable();
    });
    this.retainerTableEl!.snapshotDataSource = this.rightArray;
  }

  classFilter(): void {
    this.search!.addEventListener('keyup', (): void => {
      this.comparisonFilter = [];
      this.comparisonData.forEach((a: unknown) => {
        // @ts-ignore
        if (a.objectName.toLowerCase().includes(this.search!.value.toLowerCase())) {
          // @ts-ignore
          this.comparisonFilter.push(a);
        } else {
        }
      });
      this.comparisonTableEl!.snapshotDataSource = this.comparisonFilter;
      let summaryTable = this.comparisonTableEl!.shadowRoot?.querySelector('.table') as HTMLDivElement;
      summaryTable.scrollTop = 0;
      this.comparisonTableEl!.reMeauseHeight();
    });
  }

  clear(): void {
    this.search!.value = '';
    this.rightTheadTable!.removeAttribute('sort');
    this.leftTheadTable!.removeAttribute('sort');
    this.comparisonTable!.scrollTop = 0;
  }

  connectedCallback(): void {
    super.connectedCallback();
    let filterHeight = 0;
    new ResizeObserver((): void => {
      let comparisonPanelFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      if (comparisonPanelFilter.clientHeight > 0) {
        filterHeight = comparisonPanelFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        comparisonPanelFilter.style.display = 'flex';
      } else {
        comparisonPanelFilter.style.display = 'none';
      }
    }).observe(this.parentElement!);
    this.comparisonTableEl!.addEventListener('icon-click', this.comparisonTblIconClickHandler);
    this.retainerTableEl!.addEventListener('icon-click', this.retainerTblIconClickHandler);
    this.comparisonTableEl!.addEventListener('column-click', this.comparisonTblColumnClickHandler);
    this.retainerTableEl!.addEventListener('column-click', this.retainerTblColumnClickHandler);
    this.comparisonTableEl!.addEventListener('row-click', this.comparisonTblRowClickHandler);
    this.retainerTableEl!.addEventListener('row-click', this.retainerTblRowClickHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.comparisonTableEl!.removeEventListener('icon-click', this.comparisonTblIconClickHandler);
    this.retainerTableEl!.removeEventListener('icon-click', this.retainerTblIconClickHandler);
    this.comparisonTableEl!.removeEventListener('column-click', this.comparisonTblColumnClickHandler);
    this.retainerTableEl!.removeEventListener('column-click', this.retainerTblColumnClickHandler);
    this.comparisonTableEl!.removeEventListener('row-click', this.comparisonTblRowClickHandler);
    this.retainerTableEl!.removeEventListener('row-click', this.retainerTblRowClickHandler);
  }

  private comparisonTblRowClickHandler = (e: Event): void => {
    this.rightTheadTable!.removeAttribute('sort');
    // @ts-ignore
    let item = e.detail.data as ConstructorItem; // @ts-ignore
    (item as unknown).isSelected = true;
    this.retainsData = HeapDataInterface.getInstance().getRetains(item);
    if (this.retainsData && this.retainsData.length > 0) {
      this.retainsDataInit();
      let i = 0;
      if (this.retainsData[0].distance > 1) {
        this.retainsData[0].getChildren();
        this.retainsData[0].expanded = false;
      }
      let retainsTable = (): void => {
        const getList = (list: Array<ConstructorItem>): void => {
          for (const item of list) {
            let shallow = `${Math.round((item.shallowSize / this.fileSize) * 100)}%`;
            let retained = `${Math.round((item.retainedSize / this.fileSize) * 100)}%`;
            item.shallowPercent = shallow;
            item.retainedPercent = retained;
            let nodeId = `${item.nodeName} @${item.id}`;
            item.objectName = `${item.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
            if (item.distance >= 100000000 || item.distance === -5) {
              // @ts-ignore
              item.distance = '-';
            }
            i++;
            // @ts-ignore
            if (i < this.retainsData[0].distance - 1 && list[0].distance !== '-') {
              list[0].getChildren();
              list[0].expanded = false;
              if (item.hasNext) {
                getList(item.children);
              }
            } else {
              return;
            }
          }
        };
        getList(this.retainsData[0].children);
      };
      retainsTable();
      this.retainerTableEl!.snapshotDataSource = this.retainsData;
    } else {
      this.retainerTableEl!.snapshotDataSource = [];
    }
    this.resizeObserverObserve();
    // @ts-ignore
    if ((e.detail as unknown).callBack) {
      // @ts-ignore
      (e.detail as unknown).callBack(true);
    }
  };

  private resizeObserverObserve(): void {
    new ResizeObserver((): void => {
      this.retainerTableEl!.style.height = 'calc(100% - 21px)';
      this.retainerTableEl!.reMeauseHeight();
    }).observe(this.parentElement!);
  }

  private retainsDataInit(): void {
    this.retainsData.forEach((comparisonRetainEl): void => {
      let shallow = `${Math.round((comparisonRetainEl.shallowSize / this.fileSize) * 100)}%`;
      let retained = `${Math.round((comparisonRetainEl.retainedSize / this.fileSize) * 100)}%`;
      comparisonRetainEl.shallowPercent = shallow;
      comparisonRetainEl.retainedPercent = retained;
      if (comparisonRetainEl.distance >= 100000000 || comparisonRetainEl.distance === -5) {
        // @ts-ignore
        comparisonRetainEl.distance = '-';
      }
      let nodeId = `${comparisonRetainEl.nodeName} @${comparisonRetainEl.id}`;
      comparisonRetainEl.objectName = `${comparisonRetainEl.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
    });
  }

  private retainerTblRowClickHandler = (evt: Event): void => {
    // @ts-ignore
    let data = evt.detail.data as ConstructorItem; // @ts-ignore
    (data as unknown).isSelected = true;
    // @ts-ignore
    if ((evt.detail as unknown).callBack) {
      // @ts-ignore
      (evt.detail as unknown).callBack(true);
    }
  };

  private comparisonTblColumnClickHandler = (e: Event): void => {
    // @ts-ignore
    this.sortComprisonByColumn(e.detail.key, e.detail.sort);
    this.comparisonTableEl!.reMeauseHeight();
  };

  private retainerTblColumnClickHandler = (e: Event): void => {
    // @ts-ignore
    this.sortRetainerByColumn(e.detail.key, e.detail.sort);
    this.retainerTableEl!.reMeauseHeight();
  };

  retainerTblIconClickHandler = (e: Event): void => {
    // @ts-ignore
    let retainerNext = e.detail.data as ConstructorItem;
    if (retainerNext) {
      if (this.retainsData.length > 0) {
        if (retainerNext.status) {
          retainerNext.getChildren();
          let i = 0;
          let retainsTable = (): void => {
            const getList = (comList: Array<ConstructorItem>): void => {
              comList.forEach((row): void => {
                let shallow = `${Math.round((row.shallowSize / this.fileSize) * 100)}%`;
                let retained = `${Math.round((row.retainedSize / this.fileSize) * 100)}%`;
                row.shallowPercent = shallow;
                row.retainedPercent = retained;
                let nodeId = `${row.nodeName} @${row.id}`;
                row.objectName = `${row.edgeName}\xa0` + 'in' + `\xa0${nodeId}`;
                if (row.distance >= 100000000 || row.distance === -5) {
                  // @ts-ignore
                  row.distance = '-';
                }
                i++;
                // @ts-ignore
                if (i < this.retainsData[0].distance - 1 && comList[0].distance !== '-') {
                  comList[0].getChildren();
                  comList[0].expanded = false;
                  if (row.hasNext) {
                    getList(row.children);
                  }
                } else {
                  return;
                }
              });
            };
            getList(retainerNext.children);
          };
          retainsTable();
        } else {
          retainerNext.status = true;
        }
        if (this.rightTheadTable!.hasAttribute('sort')) {
          this.retainerTableEl!.snapshotDataSource = this.rightArray;
        } else {
          this.retainerTableEl!.snapshotDataSource = this.retainsData;
        }
      } else {
        this.retainerTableEl!.snapshotDataSource = [];
      }
      this.resizeObserverObserve();
    }
  };

  comparisonTblIconClickHandler = (e: Event): void => {
    // @ts-ignore
    let clickRow = e.detail.data;
    if (clickRow.status) {
      clickRow.targetFileId = this.targetFileId;
      clickRow.children = HeapDataInterface.getInstance().getNextForComparison(clickRow);
      if (clickRow.children.length > 0) {
        for (let item of clickRow.children) {
          let nodeName = `${item.nodeName} @${item.id}`;
          item.nodeId = ` @${item.id}`;
          if (item.isString()) {
            item.objectName = `"${item.nodeName}"` + ` @${item.id}`;
          } else {
            item.objectName = nodeName;
          }
          item.deltaCount = '-';
          item.deltaSize = '-';
          if (item.edgeName !== '') {
            item.objectName = `${item.edgeName}\xa0` + '::' + `\xa0${nodeName}`;
          } else {
            if (item.fileId === this.baseFileId) {
              item.addedCount = '•';
              item.addedSize = item.shallowSize;
              item.removedCount = '-';
              item.removedSize = '-';
            } else if (item.fileId) {
              item.removedCount = '•';
              item.removedSize = item.shallowSize;
              item.addedCount = '-';
              item.addedSize = '-';
            }
          }
          if (item.type === ConstructorType.FiledType) {
            item.removedCount = '-';
            item.removedSize = '-';
            item.addedCount = '-';
            item.addedSize = '-';
          }
        }
      } else {
        this.comparisonTableEl!.snapshotDataSource = [];
      }
    } else {
      clickRow.status = true;
    }
    this.comparisonTblIconClickData();
  };

  private comparisonTblIconClickData(): void {
    if (this.search!.value !== '') {
      if (this.leftTheadTable!.hasAttribute('sort')) {
        this.comparisonTableEl!.snapshotDataSource = this.leftArray;
      } else {
        this.comparisonTableEl!.snapshotDataSource = this.comparisonFilter;
      }
    } else {
      if (this.leftTheadTable!.hasAttribute('sort')) {
        this.comparisonTableEl!.snapshotDataSource = this.leftArray;
      } else {
        this.comparisonTableEl!.snapshotDataSource = this.comparisonsData;
      }
    }
    new ResizeObserver((): void => {
      this.comparisonTableEl!.style.height = '100%';
      this.comparisonTableEl!.reMeauseHeight();
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneComparisonHtml;
  }
}
