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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { info } from '../../../log/Log';
import { ClockRender, ClockStruct } from '../../database/ui-worker/ProcedureWorkerClock';
import { ColorUtils } from '../trace/base/ColorUtils';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { Utils } from '../trace/base/Utils';
import { clockDataSender } from '../../database/data-trafic/ClockDataSender';
import { queryClockData } from '../../database/sql/Clock.sql';
import { DmaFenceRender, DmaFenceStruct } from '../../database/ui-worker/ProcedureWorkerDmaFence';
import { dmaFenceSender } from '../../database/data-trafic/dmaFenceSender';
import { queryDmaFenceName } from '../../database/sql/dmaFence.sql';
import { BaseStruct } from '../../bean/BaseStruct';
import { promises } from 'dns';

export class SpClockChart {
  private readonly trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(parentRow?: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let clockList = await queryClockData(traceId);
    if (clockList.length === 0) {
      return;
    }
    let folder = await this.initFolder(traceId);
    if (parentRow) {
      parentRow.addChildTraceRow(folder);
    } else {
      this.trace.rowsEL?.appendChild(folder);
    }
    // heca_freq Frequency移动到数组末尾
    const index = clockList.findIndex(item => item.name === 'heca_freq Frequency');
    if (index !== -1) {
      const item = clockList.splice(index, 1);
      if (item && item.length) {
        clockList.push(item[0]);
      }
    }
    await this.initDmaFence(folder);
    await this.initData(folder, clockList, traceId);
  }

  private clockSupplierFrame(
    traceRow: TraceRow<ClockStruct>,
    it: {
      name: string;
      num: number;
      srcname: string;
      maxValue?: number;
    },
    isState: boolean,
    isScreenState: boolean,
  ): void {
    traceRow.supplierFrame = (): Promise<ClockStruct[]> => {
      let promiseData = null;
      if (it.name.endsWith(' Frequency')) {
        promiseData = clockDataSender(it.srcname, 'clockFrequency', traceRow);
      } else if (isState) {
        promiseData = clockDataSender(it.srcname, 'clockState', traceRow);
      } else if (isScreenState) {
        promiseData = clockDataSender('', 'screenState', traceRow);
      }
      if (promiseData === null) {
        // @ts-ignore
        return new Promise<Array<unknown>>((resolve) => resolve([]));
      } else {
        // @ts-ignore
        return promiseData.then((resultClock: Array<unknown>) => {
          for (let j = 0; j < resultClock.length; j++) {
            // @ts-ignore
            resultClock[j].type = 'measure'; // @ts-ignore
            if ((resultClock[j].value || 0) > it.maxValue!) {
              // @ts-ignore
              it.maxValue = resultClock[j].value || 0;
            }
            if (j > 0) {
              // @ts-ignore
              resultClock[j].delta = (resultClock[j].value || 0) - (resultClock[j - 1].value || 0);
            } else {
              // @ts-ignore
              resultClock[j].delta = 0;
            }
          }
          return resultClock;
        });
      }
    };
  }

  private clockThreadHandler(
    traceRow: TraceRow<ClockStruct>,
    it: {
      name: string;
      num: number;
      srcname: string;
      maxValue?: number;
    },
    isState: boolean,
    isScreenState: boolean,
    clockId: number
  ): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.clock as ClockRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: it.name,
          maxValue: it.maxValue === 0 ? 1 : it.maxValue!,
          index: clockId,
          maxName:
            isState || isScreenState
              ? it.maxValue!.toString()
              : Utils.getFrequencyWithUnit(it.maxValue! / 1000).maxFreqName,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initData(folder: TraceRow<BaseStruct>, clockList: Array<{
    name: string;
    num: number;
    srcname: string;
    maxValue?: number;
  }>, traceId?: string): Promise<void> {
    let clockStartTime = new Date().getTime();
    info('clockList data size is: ', clockList!.length);
    if (!traceId) {
      this.trace.rowsEL?.appendChild(folder);
    }
    ClockStruct.maxValue = clockList.map((item) => item.num).reduce((a, b) => Math.max(a, b));
    for (let i = 0; i < clockList.length; i++) {
      const it = clockList[i];
      it.maxValue = 0;
      let traceRow = TraceRow.skeleton<ClockStruct>(traceId);
      let isState = it.name.endsWith(' State');
      let isScreenState = it.name.endsWith('ScreenState');
      traceRow.rowId = it.name;
      traceRow.rowType = TraceRow.ROW_TYPE_CLOCK;
      traceRow.rowParentId = folder.rowId;
      traceRow.style.height = '40px';
      traceRow.name = it.name;
      traceRow.rowHidden = !folder.expansion;
      traceRow.setAttribute('children', '');
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      this.clockSupplierFrame(traceRow, it, isState, isScreenState);
      traceRow.getCacheData = (args: unknown): Promise<ClockStruct[]> | undefined => {
        let result: Promise<ClockStruct[]> | undefined;
        if (it.name.endsWith(' Frequency')) {
          result = clockDataSender(it.srcname, 'clockFrequency', traceRow, args);
        } else if (isState) {
          result = clockDataSender(it.srcname, 'clockState', traceRow, args);
        } else if (isScreenState) {
          result = clockDataSender('', 'screenState', traceRow, args);
        }
        return result;
      };
      traceRow.focusHandler = (ev): void => {
        this.trace?.displayTip(
          traceRow,
          ClockStruct.hoverClockStruct,
          `<span>${ColorUtils.formatNumberComma(ClockStruct.hoverClockStruct?.value!)}</span>`
        );
      };
      traceRow.findHoverStruct = (): void => {
        ClockStruct.hoverClockStruct = traceRow.getHoverStruct();
      };
      this.clockThreadHandler(traceRow, it, isState, isScreenState, i);
      folder.addChildTraceRow(traceRow);
    }
    let durTime = new Date().getTime() - clockStartTime;
    info('The time to load the ClockData is: ', durTime);
  }

  // @ts-ignore
  async initDmaFence(folder: TraceRow<unknown>): Promise<void> {
    let dmaFenceNameList = await queryDmaFenceName();
    if (dmaFenceNameList.length) {
      let dmaFenceList = [];
      const timelineValues = dmaFenceNameList.map(obj => obj.timeline);
      for (let i = 0; i < timelineValues.length; i++) {
        let traceRow: TraceRow<DmaFenceStruct> = TraceRow.skeleton<DmaFenceStruct>();
        traceRow.rowId = timelineValues[i];
        traceRow.rowType = TraceRow.ROW_TYPE_DMA_FENCE;
        traceRow.rowParentId = folder.rowId;
        traceRow.style.height = 40 + 'px';
        traceRow.name = `${timelineValues[i]}`;
        traceRow.folder = false;
        traceRow.rowHidden = !folder.expansion;
        traceRow.setAttribute('children', '');
        traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        traceRow.selectChangeHandler = this.trace.selectChangeHandler;
        // @ts-ignore
        traceRow.supplierFrame = (): Promise<DmaFenceStruct[]> => {
          return dmaFenceSender('dma_fence_init', `${timelineValues[i]}`, traceRow).then((res) => {
            res.forEach((item: unknown) => {
              // @ts-ignore
              let detail = Utils.DMAFENCECAT_MAP.get(item.id!);
              if (detail) {
                let catValue = (detail.cat.match(/^dma_(.*)$/))![1];
                // @ts-ignore
                item.sliceName = catValue.endsWith('ed') ? `${catValue.slice(0, -2)}(${detail.seqno})` : `${catValue}(${detail.seqno})`;
                // @ts-ignore
                item.driver = detail.driver;
                // @ts-ignore
                item.context = detail.context;
                // @ts-ignore
                item.depth = 0;
              }

            });
            return dmaFenceList = res;
          });

        };
        traceRow.onThreadHandler = (useCache): void => {
          let context: CanvasRenderingContext2D;
          if (traceRow.currentContext) {
            context = traceRow.currentContext;
          } else {
            context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          traceRow.canvasSave(context);
          (renders.dmaFence as DmaFenceRender).renderMainThread(
            {
              dmaFenceContext: context,
              useCache: useCache,
              type: 'dmaFence',
              maxValue: 20,
              index: 1,
              maxName: ''
            },
            traceRow
          );
          traceRow.canvasRestore(context, this.trace);
        };
        folder.addChildTraceRow(traceRow);
      }

    }

  }


  async initFolder(traceId?: string): Promise<TraceRow<BaseStruct>> {
    let clockFolder = TraceRow.skeleton(traceId);
    clockFolder.rowId = 'Clocks';
    clockFolder.index = 0;
    clockFolder.rowType = TraceRow.ROW_TYPE_CLOCK_GROUP;
    clockFolder.rowParentId = '';
    clockFolder.style.height = '40px';
    clockFolder.folder = true;
    clockFolder.name = 'Clocks';
    clockFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    clockFolder.selectChangeHandler = this.trace.selectChangeHandler;
    clockFolder.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    clockFolder.onThreadHandler = (useCache): void => {
      clockFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (clockFolder.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, clockFolder.frame.width, clockFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          clockFolder
        );
      }
      clockFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    return clockFolder;
  }
}
