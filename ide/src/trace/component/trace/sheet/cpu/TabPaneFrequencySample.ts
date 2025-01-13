/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import { getTabPaneFrequencySampleData } from '../../../../database/sql/SqlLite.sql';
import { getTabPaneCounterSampleData } from '../../../../database/sql/Cpu.sql';
import { ColorUtils } from '../../base/ColorUtils';
import { resizeObserver } from '../SheetUtils';
import { CpuFreqStruct } from '../../../../database/ui-worker/ProcedureWorkerFreq';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { TraceRow } from '../../base/TraceRow';
import { drawLines } from '../../../../database/ui-worker/ProcedureWorkerCommon';

@element('tabpane-frequency-sample')
export class TabPaneFrequencySample extends BaseElement {
  private frequencySampleTbl: LitTable | null | undefined;
  private selectionParam: SelectionParam | null | undefined;
  private frequencyLoadingPage: unknown;
  private frequencySampleSource: unknown[] = [];
  private frequencySampleSortKey: string = 'counter';
  private frequencySampleSortType: number = 0;
  private systemTrace: SpSystemTrace | undefined | null; // @ts-ignore
  private _rangeRow: Array<TraceRow<unknown>> | undefined | null;
  private frequencySampleClickType: boolean = false;
  private busyTimeLoadingHide: boolean = false;
  private freqBusyDataList: Array<unknown> = [];
  private worker: Worker | undefined;
  private freqResult: Array<unknown> = [];

  set data(frequencySampleValue: SelectionParam | unknown) {
    if (frequencySampleValue === this.selectionParam) {
      return;
    }
    // @ts-ignore
    this.selectionParam = frequencySampleValue;
    if (this.frequencySampleTbl) {
      // @ts-ignore
      this.frequencySampleTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 25}px`;
    }
    this.queryDataByDB(frequencySampleValue);
  }
  // @ts-ignore
  set rangeTraceRow(rangeRow: Array<TraceRow<unknown>> | undefined) {
    this._rangeRow = rangeRow;
  }

  initElements(): void {
    this.frequencyLoadingPage = this.shadowRoot!.querySelector('.loadingFre');
    this.frequencySampleTbl = this.shadowRoot!.querySelector<LitTable>('#tb-states');
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.frequencySampleTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.frequencySampleSortKey = evt.detail.key;
      // @ts-ignore
      this.frequencySampleSortType = evt.detail.sort;
      // @ts-ignore
      this.sortTable(evt.detail.key, evt.detail.sort);
    });
    this.frequencySampleTbl!.addEventListener('row-click', (evt): void => {
      this.clickTblRowEvent(evt);
    });
    this.frequencySampleTbl!.addEventListener('button-click', (evt): void => {
      //@ts-ignore
      this.frequencySampleClickKey = evt.detail.key;
      this.frequencySampleClickType = !this.frequencySampleClickType;
      //@ts-ignore
      this.handleClick(evt.detail.key, this.frequencySampleClickType);
    });
    //开启一个线程计算busyTime
    this.worker = new Worker(new URL('../../../../database/StateBusyTimeWorker', import.meta.url));
  }
  clickTblRowEvent(evt: Event): void {
    // @ts-ignore
    let data = evt.detail.data;
    if (this._rangeRow && this._rangeRow!.length > 0) {
      let rangeTraceRow = this._rangeRow!.filter(function (item) {
        return item.name.includes('Frequency');
      });
      let freqFilter = [];
      for (let row of rangeTraceRow!) {
        let context = row.collect ? this.systemTrace!.canvasFavoritePanelCtx! : this.systemTrace!.canvasPanelCtx!;
        freqFilter.push(...row.dataListCache);
        row.canvasSave(context); // @ts-ignore
        context.clearRect(row.frame.x, row.frame.y, row.frame.width, row.frame.height); // @ts-ignore
        drawLines(context!, TraceRow.range?.xs || [], row.frame.height, this.systemTrace!.timerShaftEL!.lineColor());
        if (row.name.includes('Frequency') && parseInt(row.name.replace(/[^\d]/g, ' ')) === data.cpu) {
          CpuFreqStruct.hoverCpuFreqStruct = undefined;
          for (let i = 0; i < freqFilter!.length; i++) {
            if (
              // @ts-ignore
              freqFilter[i].value === data.value && // @ts-ignore
              freqFilter[i].cpu === data.cpu && // @ts-ignore
              Math.max(TraceRow.rangeSelectObject?.startNS!, freqFilter[i].startNS!) < // @ts-ignore
              Math.min(TraceRow.rangeSelectObject?.endNS!, freqFilter[i].startNS! + freqFilter[i].dur!)
            ) {
              // @ts-ignore
              CpuFreqStruct.hoverCpuFreqStruct = freqFilter[i];
            } // @ts-ignore
            if (freqFilter[i].cpu === data.cpu) {
              // @ts-ignore
              CpuFreqStruct.draw(context, freqFilter[i]);
            }
          }
        } else {
          for (let i = 0; i < freqFilter!.length; i++) {
            if (
              row.name.includes('Frequency') && // @ts-ignore
              freqFilter[i].cpu !== data.cpu && // @ts-ignore
              freqFilter[i].cpu === parseInt(row.name.replace(/[^\d]/g, ' '))
            ) {
              // @ts-ignore
              CpuFreqStruct.draw(context, freqFilter[i]);
            }
          }
        }
        this.metricsText(context, row);
      }
    }
  }
  // @ts-ignore
  private metricsText(context: CanvasRenderingContext2D, row: TraceRow<unknown>): void {
    let s = CpuFreqStruct.maxFreqName;
    let textMetrics = context.measureText(s);
    context.globalAlpha = 0.8;
    context.fillStyle = '#f0f0f0';
    context.fillRect(0, 5, textMetrics.width + 8, 18);
    context.globalAlpha = 1;
    context.fillStyle = '#333';
    context.textBaseline = 'middle';
    context.fillText(s, 4, 5 + 9);
    row.canvasRestore(context, this.systemTrace);
  }

  connectedCallback(): void {
    super.connectedCallback();
    // @ts-ignore
    resizeObserver(this.parentElement!, this.frequencySampleTbl!, 25, this.frequencyLoadingPage, 24);
  }

  async queryDataByDB(frqSampleParam: SelectionParam | unknown): Promise<void> {
    let sampleMap = new Map<unknown, unknown>();
    let weightMap = new Map<unknown, unknown>();
    let frqSampleList: unknown[] = [];
    this.frequencySampleTbl!.loading = true;
    if (this.frequencySampleClickType) {
      this.frequencySampleClickType = !this.frequencySampleClickType;
    }
    if (this.busyTimeLoadingHide) {
      this.busyTimeLoadingHide = !this.busyTimeLoadingHide;
    }
    let result = await getTabPaneFrequencySampleData(
      // @ts-ignore
      frqSampleParam.leftNs + frqSampleParam.recordStartNs,
      // @ts-ignore
      frqSampleParam.rightNs + frqSampleParam.recordStartNs,
      // @ts-ignore
      frqSampleParam.cpuFreqFilterIds
    );
    this.freqResult = result;
    // @ts-ignore
    frqSampleParam.cpuFreqFilterIds.forEach((a: number): void => {
      weightMap.set(`${a}`, { counter: '', filterId: a });
      this.getInitTime(
        //@ts-ignore
        result.filter((f) => f.filterId === a),
        sampleMap,
        // @ts-ignore
        frqSampleParam
      );
    });
    let tmpCpuArr = Array.from(sampleMap.entries());
    let weightMapArr = Array.from(weightMap.entries());
    for (let j = 0; j < weightMapArr.length; j++) {
      // @ts-ignore
      let singleCpuArr = tmpCpuArr.filter((item) => item[1].filterId && item[1].filterId === Number(weightMapArr[j][1].filterId));
      let tmpTotalTime = 0;
      let tmpTotalCount = 0;
      for (let i = 0; i < singleCpuArr.length; i++) {
        // @ts-ignore
        tmpTotalTime += singleCpuArr[i][1].time;
        // @ts-ignore
        tmpTotalCount += singleCpuArr[i][1].time / 1000000 * singleCpuArr[i][1].value;
      }
      // @ts-ignore
      let tmpPosition = tmpCpuArr.findIndex(item => item[1].filterId === weightMapArr[j][1].filterId);
      if (singleCpuArr[0] && singleCpuArr[0].length >= 2) {
      // @ts-ignore
        tmpCpuArr.splice(tmpPosition, 0, [`${weightMapArr[j][1].filterId}-0`, { counter: `${singleCpuArr[0][1].counter}:( WA )`, time: tmpTotalTime, valueStr: ColorUtils.formatNumberComma(Math.round(tmpTotalCount / (tmpTotalTime / 1000000))) }]);
      }
    };
    sampleMap = new Map(tmpCpuArr);
    sampleMap.forEach((a): void => {
      // @ts-ignore
      if (a.time) {
        // @ts-ignore
        a.timeStr = parseFloat((a.time / 1000000.0).toFixed(6));
      }
      frqSampleList.push(a);
    });
    this.frequencySampleSource = frqSampleList;
    this.frequencySampleTbl!.loading = false;
    this.sortTable(this.frequencySampleSortKey, this.frequencySampleSortType);
    // @ts-ignore
    this.getBusyTimeData(frqSampleParam, sampleMap, result);
  }

  async getBusyTimeData(
    frqSampleParam: SelectionParam,
    sampleMap: Map<unknown, unknown>,
    result: Array<unknown>
  ): Promise<void> {
    let stateFiliterIds: Array<unknown> = [];
    let cpuFiliterOrder: Array<unknown> = [];
    //找出框选的cpu fre所对应的cpu state
    this.freqBusyDataList = [];
    if (!frqSampleParam.cpuStateRowsId.length) {
      sampleMap.forEach((value: unknown): void => {
        // @ts-ignore
        value.busyTime = 'NULL';
        this.freqBusyDataList.push(value);
      });
    } else {
      frqSampleParam.cpuFreqFilterNames.forEach((item: string): void => {
        let cpuStateIds: unknown = frqSampleParam.cpuStateRowsId.filter(
          // @ts-ignore
          (it: unknown) => it.cpu === Number(item.replace(/[^\d]/g, ' ').trim())
        );
        // @ts-ignore
        stateFiliterIds.push(cpuStateIds[0].filterId);
        // @ts-ignore
        cpuFiliterOrder.push(cpuStateIds[0].cpu);
      });
      let res = await getTabPaneCounterSampleData(
        frqSampleParam.leftNs + frqSampleParam.recordStartNs,
        frqSampleParam.rightNs + frqSampleParam.recordStartNs,
        // @ts-ignore
        stateFiliterIds
      );
      let msg = {
        timeParam: {
          leftNs: frqSampleParam.leftNs,
          rightNs: frqSampleParam.rightNs,
          recordStartNs: frqSampleParam.recordStartNs,
        },
        result,
        sampleMap,
        res,
        cpuFiliterOrder,
      };
      this.worker!.postMessage(msg);
      this.worker!.onmessage = (event: MessageEvent): void => {
        sampleMap = event.data;
        this.freqBusyDataList = [...sampleMap.values()];
        this.busyTimeLoadingHide = true;
        //当busyTimebutton的状态为true但busyTime的计算未完成时
        if (this.frequencySampleClickType) {
          this.handleClick(this.frequencySampleSortKey, this.frequencySampleClickType);
        }
      };
    }
  }
  getInitTime(initFreqResult: Array<unknown>, sampleMap: Map<unknown, unknown>, selectionParam: SelectionParam): void {
    let leftStartNs = selectionParam.leftNs + selectionParam.recordStartNs;
    let rightEndNs = selectionParam.rightNs + selectionParam.recordStartNs;
    if (initFreqResult.length === 0) {
      return;
    }
    // @ts-ignore
    let includeData = initFreqResult.findIndex((a) => a.ts > leftStartNs);
    if (includeData !== 0) {
      initFreqResult = initFreqResult.slice(
        includeData === -1 ? initFreqResult.length - 1 : includeData - 1,
        initFreqResult.length
      );
    }
    // @ts-ignore
    if (initFreqResult[0].ts < leftStartNs && includeData !== 0) {
      // @ts-ignore
      initFreqResult[0].ts = leftStartNs;
    }
    initFreqResult.forEach((item, idx): void => {
      if (idx + 1 === initFreqResult.length) {
        // @ts-ignore
        item.time = rightEndNs - item.ts;
      } else {
        // @ts-ignore
        item.time = initFreqResult[idx + 1].ts - item.ts;
      }
      // @ts-ignore
      if (sampleMap.has(`${item.filterId}-${item.value}`)) {
        // @ts-ignore
        let obj = sampleMap.get(`${item.filterId}-${item.value}`);
        // @ts-ignore
        obj.time += item.time;
      } else {
        // @ts-ignore
        sampleMap.set(`${item.filterId}-${item.value}`, {
          // @ts-ignore
          ...item,
          // @ts-ignore
          counter: `Cpu ${item.cpu}`,
          // @ts-ignore
          valueStr: ColorUtils.formatNumberComma(item.value),
          busyTimeStr: '-',
          busyTime: 0,
        });
      }
    });
  }

  //点击按钮控制busyTime显示与否
  handleClick(key: string, type: boolean): void {
    let res: unknown[] = [];
    if (this.freqResult.length === 0) {
      return;
    }
    //当busyTime的值计算完毕后进入if判断
    if (this.busyTimeLoadingHide) {
      this.busyTimeLoadingHide = false;
      this.frequencySampleSource = this.freqBusyDataList;
      this.sortTable(this.frequencySampleSortKey, this.frequencySampleSortType);
    }
    this.frequencySampleTbl!.loading = this.freqBusyDataList.length <= 0;
    if (this.freqBusyDataList.length > 0) {
      this.frequencySampleTbl!.recycleDataSource.forEach((value): void => {
        // @ts-ignore
        if (value.counter.includes('( WA )')) {
          // @ts-ignore
          value.busyTimeStr = '-';
        } else {
          // @ts-ignore
          value.busyTimeStr = type ? value.busyTime : '-';
        }
        res.push(value);
      });
      this.frequencySampleTbl!.recycleDataSource = res;
    }
  }

  sortTable(key: string, type: number): void {
    if (type === 0) {
      this.frequencySampleTbl!.recycleDataSource = this.frequencySampleSource;
    } else {
      let arr = Array.from(this.frequencySampleSource);
      arr.sort((frequencySampleLeftData, frequencySampleRightData): number => {
        if (key === 'timeStr') {
          if (type === 1) {
            // @ts-ignore
            return frequencySampleLeftData.time - frequencySampleRightData.time;
          } else {
            // @ts-ignore
            return frequencySampleRightData.time - frequencySampleLeftData.time;
          }
        } else if (key === 'counter') {
          if (type === 1) {
            // @ts-ignore
            return frequencySampleLeftData.cpu - frequencySampleRightData.cpu;
          } else {
            // @ts-ignore
            return frequencySampleRightData.cpu - frequencySampleLeftData.cpu;
          }
        } else if (key === 'valueStr') {
          if (type === 1) {
            // @ts-ignore
            return frequencySampleLeftData.value - frequencySampleRightData.value;
          } else {
            // @ts-ignore
            return frequencySampleRightData.value - frequencySampleLeftData.value;
          }
        } else if (key === 'busyTimeStr') {
          if (type === 1) {
            // @ts-ignore
            return frequencySampleLeftData.busyTimeStr - frequencySampleRightData.busyTimeStr;
          } else {
            // @ts-ignore
            return frequencySampleRightData.busyTimeStr - frequencySampleLeftData.busyTimeStr;
          }
        } else {
          return 0;
        }
      });
      this.frequencySampleTbl!.recycleDataSource = arr;
    }
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            padding: 10px 10px;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-states" style="height: auto" >
            <lit-table-column class="freq-sample-column" width="20%" title="Cpu" data-index="counter" key="counter" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="freq-sample-column" width="1fr" title="Time(ms)" data-index="timeStr" key="timeStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="freq-sample-column" width="1fr" title="Value(kHz)" data-index="valueStr" key="valueStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="freq-sample-column" width="1fr" title="" data-index="busyTimeStr" key="busyTimeStr" align="flex-start" order button>
            </lit-table-column>
        </lit-table>
        `;
  }
}
