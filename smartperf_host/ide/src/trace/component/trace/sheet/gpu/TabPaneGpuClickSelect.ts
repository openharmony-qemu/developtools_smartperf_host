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
import { RedrawTreeForm, type LitTable } from '../../../../../base-ui/table/lit-table';
import { resizeObserver } from '../SheetUtils';
import { VmTrackerChart } from '../../../chart/SpVmTrackerChart';
import { log } from '../../../../../log/Log';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { Utils } from '../../base/Utils';
import { queryGpuDataByTs } from '../../../../database/sql/Gpu.sql';
interface GpuTreeItem {
  name: string;
  id: number;
  size: number;
  sizeStr: string;
  children?: GpuTreeItem[] | undefined;
}

@element('tabpane-gpu-click-select')
export class TabPaneGpuClickSelect extends BaseElement {
  private gpuTbl: LitTable | null | undefined;
  private gpuSource: Array<GpuTreeItem> = [];
  gpuClickData(gpu: { type: string; startTs: number }): void {
    let td = this.gpuTbl!.shadowRoot!.querySelector('.thead')?.firstChild?.firstChild as HTMLDivElement;
    let title = gpu.type === 'total' ? 'Module / Category' : 'Window / Module / Category';
    let titleArr = title.split('/');
    if (td) {
      let labelEls = td.querySelectorAll('label');
      if (labelEls) {
        for (let el of labelEls) {
          td.removeChild(el);
        }
      }
      for (let i = 0; i < titleArr.length; i++) {
        let label = document.createElement('label');
        label.style.cursor = 'pointer';
        i === 0 ? (label.innerHTML = titleArr[i]) : (label.innerHTML = '/' + titleArr[i]);
        td.appendChild(label);
      }
    }
    //@ts-ignore
    this.gpuTbl?.shadowRoot?.querySelector('.table')?.style?.height = this.parentElement!.clientHeight - 45 + 'px';
    this.gpuTbl!.loading = true;
    let window = gpu.type === 'total' ? 0 : VmTrackerChart.gpuWindow;
    let module = gpu.type === 'total' ? VmTrackerChart.gpuTotalModule : VmTrackerChart.gpuWindowModule;
    queryGpuDataByTs(gpu.startTs, window || 0, module).then((result) => {
      this.gpuTbl!.loading = false;
      if (result !== null && result.length > 0) {
        log('queryGpuDataByTs result size : ' + result.length);
        let items = this.createTreeData(result);
        // @ts-ignore
        this.gpuSource = (gpu.type === 'total' ? items[0].children : items) || [];
        this.gpuTbl!.recycleDataSource = this.gpuSource;
        this.theadClick(this.gpuTbl!, this.gpuSource);
      } else {
        this.gpuSource = [];
        this.gpuTbl!.recycleDataSource = [];
      }
    });
  }
  protected createTreeData(result: unknown): Array<unknown> {
    // @ts-ignore
    let gpuDataObj = result.reduce(
      (
        group: unknown,
        item: { categoryId: number; size: number; windowNameId: number; moduleId: number; windowId: unknown }
      ) => {
        let categoryItem: GpuTreeItem = this.setGpuTreeItem(item);
        // @ts-ignore
        if (group[`${item.windowNameId}(${item.windowId})`]) {
          // @ts-ignore
          let windowGroup = group[`${item.windowNameId}(${item.windowId})`] as GpuTreeItem;
          windowGroup.size += item.size;
          windowGroup.sizeStr = Utils.getBinaryByteWithUnit(windowGroup.size);
          let moduleGroup = windowGroup.children!.find((it) => it.id === item.moduleId);
          if (moduleGroup) {
            moduleGroup.size += item.size;
            moduleGroup.sizeStr = Utils.getBinaryByteWithUnit(moduleGroup.size);
            moduleGroup.children?.push(categoryItem);
          } else {
            windowGroup.children?.push({
              name: SpSystemTrace.DATA_DICT.get(item.moduleId) || 'null',
              id: item.moduleId,
              size: item.size,
              sizeStr: Utils.getBinaryByteWithUnit(item.size),
              children: [categoryItem],
            });
          }
        } else {
          // @ts-ignore
          group[`${item.windowNameId}(${item.windowId})`] = {
            name: SpSystemTrace.DATA_DICT.get(item.windowNameId) + `(${item.windowId})`,
            id: item.windowNameId,
            size: item.size,
            sizeStr: Utils.getBinaryByteWithUnit(item.size),
            children: [
              {
                name: SpSystemTrace.DATA_DICT.get(item.moduleId),
                id: item.moduleId,
                size: item.size,
                sizeStr: Utils.getBinaryByteWithUnit(item.size),
                children: [categoryItem],
              },
            ],
          };
        }
        return group;
      },
      {}
    );
    return Object.values(gpuDataObj) as GpuTreeItem[];
  }

  private setGpuTreeItem(item: unknown): GpuTreeItem {
    return {
      // @ts-ignore
      name: SpSystemTrace.DATA_DICT.get(item.categoryId) || 'null',
      // @ts-ignore
      id: item.categoryId,
      // @ts-ignore
      size: item.size,
      // @ts-ignore
      sizeStr: Utils.getBinaryByteWithUnit(item.size),
    };
  }
  initElements(): void {
    this.gpuTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpu');
    this.gpuTbl!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }
  connectedCallback(): void {
    super.connectedCallback();
    this.parentElement!.style.overflow = 'hidden';
    resizeObserver(this.parentElement!, this.gpuTbl!, 18);
  }
  public theadClick(table: LitTable, data: Array<unknown>): void {
    let labels = table?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if ((label.includes('Window') && i === 0) || (label.includes('Module') && i === 0)) {
            table!.setStatus(data, false);
            table!.recycleDs = table!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Module') && i === 1) {
            table!.setStatus(data, false, 0, 1);
            table!.recycleDs = table!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if ((label.includes('Category') && i === 2) || (label.includes('Category') && i === 1)) {
            table!.setStatus(data, true);
            table!.recycleDs = table!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
          e.stopPropagation();
        });
      }
    }
  }
  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="tb-gpu" style="height: auto" tree>
                <lit-table-column width="50%" title="" data-index="name" key="name" align="flex-start" order retract>
                </lit-table-column>
                <lit-table-column width="1fr" title="Size" data-index="sizeStr" key="sizeStr"  align="flex-start" order>
                </lit-table-column>
        </lit-table>
        `;
  }
  sortByColumn(gpuDetail: unknown): void {
    let compare = (gpuA: GpuTreeItem, gpuB: GpuTreeItem): number => {
      // @ts-ignore
      if (gpuDetail.sort === 0) {
        return gpuA.size - gpuB.size;
        // @ts-ignore
      } else if (gpuDetail.sort === 1) {
        return gpuA.size - gpuB.size;
      } else {
        return gpuB.size - gpuA.size;
      }
    };
    let deepCompare = (arr: GpuTreeItem[]): void => {
      arr.forEach((it) => {
        if (it.children) {
          deepCompare(it.children);
        }
      });
      arr.sort(compare);
    };
    deepCompare(this.gpuSource);
    this.gpuTbl!.recycleDataSource = this.gpuSource;
  }
}
