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
import { initSort, resizeObserver } from '../SheetUtils';
import { queryIrqDataBoxSelect, querySoftIrqDataBoxSelect, queryIrqSelectData, querySoftirqSelectData } from '../../../../database/sql/Irq.sql';
import { FlagsConfig } from '../../../SpFlags';
import { IrqAndSoftirqBean, byCallidGroupBean, finalResultBean } from './irqAndSoftirqBean';

@element('tabpane-irq-counter')
export class TabPaneIrqCounter extends BaseElement {
  private irqCounterTbl: LitTable | null | undefined;
  private irqRange: HTMLLabelElement | null | undefined;
  private irqCounterSource: Array<SelectionData> = [];
  private sortColumn: string = 'wallDurationFormat';
  private sortType: number = 2;
  private loadIrq: boolean = false;//flag开关
  private irqAndSoftirqSource: Array<finalResultBean> = [];

  set data(irqParam: SelectionParam | unknown) {
    if (this.irqCounterTbl) {
      //@ts-ignore
      this.irqCounterTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45}px`;
    }
    this.irqRange!.textContent = `Selected range: ${parseFloat(
      // @ts-ignore
      ((irqParam.rightNs - irqParam.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.irqCounterTbl!.loading = true;
    let dataSource: Array<SelectionData> = [];
    this.loadIrq = FlagsConfig.getFlagsConfigEnableStatus('CPU by Irq');//flag开关
    if (this.loadIrq) {//@ts-ignore
      let irqCallIds = irqParam.softIrqCallIds.length > 0 ? irqParam.softIrqCallIds : irqParam.irqCallIds;
      Promise.all([//@ts-ignore
        queryIrqSelectData(irqCallIds, irqParam.leftNs, irqParam.rightNs),//@ts-ignore
        querySoftirqSelectData(irqParam.softIrqCallIds, irqParam.leftNs, irqParam.rightNs),
      ]).then(([irqData, softirqData]) => {
        this.irqCounterTbl!.loading = false;
        const resArr = irqData.concat(softirqData);
        if (resArr != null && resArr.length > 0) {//@ts-ignore
          let isSelectIrq = irqParam.irqCallIds.length > 0 ? true : false;
          const cutData: finalResultBean[] = this.groupByCallid(resArr);
          this.aggregateData(cutData, isSelectIrq);//整合数据
        } else {
          this.irqAndSoftirqSource = [];
          this.irqCounterTbl!.recycleDataSource = this.irqAndSoftirqSource;
        }
      });
    } else {
      Promise.all([
        // @ts-ignore
        queryIrqDataBoxSelect(irqParam.irqCallIds, irqParam.leftNs, irqParam.rightNs), // @ts-ignore
        querySoftIrqDataBoxSelect(irqParam.softIrqCallIds, irqParam.leftNs, irqParam.rightNs),
      ]).then((resArr) => {
        this.irqCounterTbl!.loading = false;
        resArr.forEach((res) => {
          res.forEach((item) => {
            let selectData = new SelectionData();
            //@ts-ignore
            selectData.name = item.irqName;
            //@ts-ignore
            selectData.cat = item.cat;
            //@ts-ignore
            selectData.count = item.count;
            //@ts-ignore
            selectData.wallDuration = item.wallDuration;
            //@ts-ignore
            selectData.wallDurationFormat = (item.wallDuration / 1000).toFixed(2);
            //@ts-ignore
            selectData.maxDuration = item.wallDuration;
            //@ts-ignore
            selectData.maxDurationFormat = (item.maxDuration / 1000).toFixed(2);
            //@ts-ignore
            selectData.avgDuration = (item.avgDuration / 1000).toFixed(2);
            dataSource.push(selectData);
          });
        });
        initSort(this.irqCounterTbl!, this.sortColumn, this.sortType);
        this.irqCounterSource = dataSource;
        this.irqCounterTbl!.recycleDataSource = dataSource;
        this.sortByColumn(this.sortColumn, this.sortType);
      });
    }
  }

  initElements(): void {
    this.irqCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-irq-counter');
    this.irqRange = this.shadowRoot?.querySelector('#time-range');
    this.irqCounterTbl!.addEventListener('column-click', (event) => {
      if (!this.loadIrq) {
        // @ts-ignore
        this.sortByColumn(event.detail.key, event.detail.sort);
      } else {
        // @ts-ignore
        this.reSortByColum(event.detail.key, event.detail.sort);
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.irqCounterTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .irq-counter-label{
            font-size: 10pt;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <label id="time-range" class="irq-counter-label" style="width: 100%;height: 20px;text-align: end;margin-bottom: 5px;">Selected range:0.0 ms</label>
        <lit-table id="tb-irq-counter" style="height: auto">
            <lit-table-column width="30%" title="Name" data-index="name" key="name"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="10%" title="Type" data-index="cat" key="cat"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="1fr" title="Duration(μs)" data-index="wallDurationFormat" key="wallDurationFormat"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Max Duration(μs)" data-index="maxDurationFormat" key="maxDurationFormat"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Average Duration(μs)" data-index="avgDuration" key="avgDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Occurrences" data-index="count" key="count"  align="flex-start" order >
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(sortColumn: string, sortType: number): void {
    let key = sortColumn;
    let type = sortType;
    let arr = Array.from(this.irqCounterSource);
    arr.sort((irqCounterLeftData, irqCounterRightData): number => {
      if (key === 'wallDurationFormat' || type === 0) {
        return (type === 1 ? 1 : -1) * (irqCounterLeftData.wallDuration - irqCounterRightData.wallDuration);
      } else if (key === 'count') {
        return (type === 1 ? 1 : -1) * (parseInt(irqCounterLeftData.count) - parseInt(irqCounterRightData.count));
      } else if (key === 'maxDurationFormat') {
        return (type === 1 ? 1 : -1) * (irqCounterLeftData.maxDuration - irqCounterRightData.maxDuration);
      } else if (key === 'avgDuration') {
        const avgDiff =
          irqCounterLeftData.wallDuration / parseInt(irqCounterLeftData.count) -
          irqCounterRightData.wallDuration / parseInt(irqCounterRightData.count);
        return (type === 1 ? 1 : -1) * avgDiff;
      } else if (key === 'name') {
        const nameDiff = irqCounterLeftData.name.localeCompare(irqCounterRightData.name);
        return (type === 2 ? -1 : 1) * nameDiff;
      } else {
        return 0;
      }
    });
    this.irqCounterTbl!.recycleDataSource = arr;
  }

    //将所有数据按callid重新分组
    private groupByCallid(data: Array<IrqAndSoftirqBean>): finalResultBean[] {
      const callidObject: { [callid: number]: byCallidGroupBean } =
        data.reduce((groups, item) => {
          const { callid, ...restProps } = item;
          const newIrqAndSoftirqBean: IrqAndSoftirqBean = { callid, ...restProps };
  
          if (!groups[callid]) {
            groups[callid] = { Callid: [] };
          }
          groups[callid].Callid!.push(newIrqAndSoftirqBean);
  
          return groups;
        }, {} as { [callid: number]: byCallidGroupBean });
      const cutObj: { [callid: number]: finalResultBean[] } = {};
      Object.entries(callidObject).forEach(([callidStr, { Callid }]) => {
        const callid = Number(callidStr);
        cutObj[callid] = this.callidByIrq(Callid);
      });
      const cutList: finalResultBean[] = Object.values(cutObj).flat();
      return cutList;
    }
  
    //具体切割方法
    private callidByIrq(data: IrqAndSoftirqBean[]): finalResultBean[] {
      let sourceData = data.sort((a, b) => a.startTime - b.startTime);
      let waitArr: IrqAndSoftirqBean[] = [];
      let completedArr: finalResultBean[] = [];
      let globalTs: number = 0;
      let index: number = 0;
      while (index < sourceData.length || waitArr.length > 0) {
        let minEndTs = Math.min(...waitArr.map((item: IrqAndSoftirqBean) => item.endTime));
        let minIndex = waitArr.findIndex((item: IrqAndSoftirqBean) => item.endTime === minEndTs);
        //当waitArr为空时
        if (waitArr.length === 0) {
          globalTs = sourceData[index].startTime;
          waitArr.push(sourceData[index]);
          index++;
          continue;
        }
        //当全局Ts等于minEndTs时，只做删除处理
        if (globalTs === minEndTs) {
          if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
          continue;
        }
        let obj: finalResultBean = {
          cat: '',
          name: '',
          wallDuration: 0,
          count: 0,
        };
        if (index < sourceData.length) {
          if (sourceData[index].startTime < minEndTs) {
            if (globalTs === sourceData[index].startTime) {
              waitArr.push(sourceData[index]);
              index++;
              continue;
            } else {
              const maxPriorityItem = this.findMaxPriority(waitArr);
              obj = {
                cat: maxPriorityItem.cat,
                name: maxPriorityItem.name,
                wallDuration: sourceData[index].startTime - globalTs,
                count: maxPriorityItem.isFirstObject === 1 ? 1 : 0
              }
              completedArr.push(obj);
              maxPriorityItem.isFirstObject = 0;
              waitArr.push(sourceData[index]);
              globalTs = sourceData[index].startTime;
              index++;
            }
          } else {
            const maxPriorityItem = this.findMaxPriority(waitArr);
            obj = {
              cat: maxPriorityItem.cat,
              name: maxPriorityItem.name,
              wallDuration: minEndTs - globalTs,
              count: maxPriorityItem.isFirstObject === 1 ? 1 : 0
            }
            completedArr.push(obj);
            maxPriorityItem.isFirstObject = 0;
            globalTs = minEndTs;
            if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
          }
        } else {
          const maxPriorityItem = this.findMaxPriority(waitArr);
          obj = {
            cat: maxPriorityItem.cat,
            name: maxPriorityItem.name,
            wallDuration: minEndTs - globalTs,
            count: maxPriorityItem.isFirstObject === 1 ? 1 : 0
          }
          completedArr.push(obj);
          maxPriorityItem.isFirstObject = 0;
          globalTs = minEndTs;
          if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
        }
      }
      return completedArr;
    }
  
    private findMaxPriority(arr: IrqAndSoftirqBean[]): IrqAndSoftirqBean {
      return arr.reduce((maxItem: IrqAndSoftirqBean, currentItem: IrqAndSoftirqBean) => {
        return maxItem.priority > currentItem.priority ? maxItem : currentItem;
      }, arr[0]);;
    }
  
    // 聚合数据
    private aggregateData(data: finalResultBean[], isSelectIrq: boolean): void {
      function groupAndSumDurations(items: finalResultBean[]): finalResultBean[] {
        const grouped: Record<string, finalResultBean> = items.reduce((acc, item) => {
          if (item.wallDuration !== 0) {
            if (item.cat === 'irq' && !isSelectIrq) {//若没有框选irq，则不对其进行处理
              return acc;
            }
            if (!acc[item.name]) {
              acc[item.name] = {
                wallDuration: 0,
                maxDuration: 0,
                name: item.name,
                cat: item.cat,
                count: 0,
                avgDuration: 0
              };
            }  
            acc[item.name].wallDuration += item.wallDuration;
            acc[item.name].wallDurationFormat = (acc[item.name].wallDuration / 1000).toFixed(2);
            acc[item.name].count += item.count;
            acc[item.name].avgDuration = (acc[item.name].wallDuration / acc[item.name].count / 1000).toFixed(2);
            if (item.wallDuration > acc[item.name].maxDuration!) {
              acc[item.name].maxDuration = item.wallDuration;
              acc[item.name].maxDurationFormat = (acc[item.name].maxDuration! / 1000).toFixed(2);
            }
          }
          return acc;
        }, {} as Record<string, finalResultBean>);
        return Object.values(grouped);
      }
      this.irqAndSoftirqSource = groupAndSumDurations(data);
      this.irqCounterTbl!.recycleDataSource = this.irqAndSoftirqSource;
    }
  
    private reSortByColum(key: string, type: number): void {
      // 如果数组为空，则直接返回 
      if (!this.irqAndSoftirqSource.length) return;
      let sortObject: finalResultBean[] = JSON.parse(JSON.stringify(this.irqAndSoftirqSource));
      let sortList: Array<finalResultBean> = [];
      sortList.push(...sortObject);
      if (type === 0) {
        this.irqCounterTbl!.recycleDataSource = this.irqAndSoftirqSource;
      } else {
        sortList.sort((a, b) => {
          let aValue: number | string, bValue: number | string;
          if (key === 'name' || key === 'cat') {
            aValue = a[key];
            bValue = b[key];
          } else {
            // @ts-ignore
            aValue = parseFloat(a[key]);
            // @ts-ignore
            bValue = parseFloat(b[key]);
          }
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return type === 1 ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return type === 1 ? aValue - bValue : bValue - aValue;
          } else {
            return 0;
          }
        });
        this.irqCounterTbl!.recycleDataSource = sortList;
      }
  }
}
