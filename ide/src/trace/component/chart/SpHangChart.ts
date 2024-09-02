/*
 * Copyright (C) 2024 Shenzhen Kaihong Digital Industry Development Co., Ltd.
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
import { HangStruct } from '../../database/ui-worker/ProcedureWorkerHang';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { queryHangData } from '../../database/sql/Hang.sql';
import { hangDataSender } from '../../database/data-trafic/HangDataSender';
import { BaseStruct } from '../../bean/BaseStruct';
import { Utils } from '../trace/base/Utils';

export type HangType = 'Instant' | 'Circumstantial' | 'Micro' | 'Severe' | '';
const TIME_MS = 1000000;
/// Hangs聚合泳道
export class SpHangChart {
  private trace: SpSystemTrace;
  static funcNameMap: Map<number | string, string> = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  static calculateHangType(dur: number): HangType {
    const durMS = dur / TIME_MS;
    if (durMS < 33) {
      return '';
    }
    else if (durMS < 100) {
      return 'Instant';
    }
    else if (durMS < 250) {
      return 'Circumstantial';
    }
    else if (durMS < 500) {
      return 'Micro';
    }
    else {
      return 'Severe';
    }
  }

  async init(): Promise<void> {
    SpHangChart.funcNameMap = Utils.getInstance().getCallStatckMap();
    let folder = await this.initFolder();
    await this.initData(folder);
  }

  private hangSupplierFrame(
    traceRow: TraceRow<HangStruct>,
    it: {
      id: number;
      name: string;
      num: number;
    }
  ): void {
    traceRow.supplierFrame = (): Promise<HangStruct[]> => {
      let promiseData = hangDataSender(it.id, traceRow);
      if (promiseData === null) {
        return new Promise<Array<HangStruct>>((resolve) => resolve([]));
      } else {
        return promiseData.then((resultHang: Array<HangStruct>) =>
          resultHang.map(hangItem => ({
            ...hangItem,
            pname: it.name,
            type: SpHangChart.calculateHangType(hangItem.dur!),
            content: SpHangChart.funcNameMap.get(hangItem.id!)
          }))
        );
      }
    };
  }

  private hangThreadHandler(
    traceRow: TraceRow<HangStruct>,
    it: {
      id: number;
      name: string;
      num: number;
    },
    hangId: number
  ): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      renders.hang.renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: it.name,
          index: hangId,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  /// 初始化聚合泳道信息
  async initData(folder: TraceRow<BaseStruct>): Promise<void> {
    let hangStartTime = new Date().getTime();
    let hangList = await queryHangData();
    if (hangList.length === 0) {
      return;
    }
    this.trace.rowsEL?.appendChild(folder);
    for (let i = 0; i < hangList.length; i++) {
      const it: {
        id: number,
        name: string,
        num: number,
      } = hangList[i];
      let traceRow = TraceRow.skeleton<HangStruct>();
      traceRow.rowId = `${it.name ?? 'Process'} ${it.id}`;
      traceRow.rowType = TraceRow.ROW_TYPE_HANG;
      traceRow.rowParentId = folder.rowId;
      traceRow.style.height = '40px';
      traceRow.name = `${it.name ?? 'Process'} ${it.id}`;
      traceRow.rowHidden = !folder.expansion;
      traceRow.setAttribute('children', '');
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      this.hangSupplierFrame(traceRow, it);
      traceRow.getCacheData = (args: unknown): Promise<Array<unknown>> => hangDataSender(it.id, traceRow, args);
      traceRow.focusHandler = (ev): void => {
        let hangStruct = HangStruct.hoverHangStruct;
        this.trace?.displayTip(
          traceRow, hangStruct,
          `<span>${hangStruct?.type} ${hangStruct?.dur! / TIME_MS}ms</span>`
        );
      };
      traceRow.findHoverStruct = (): void => {
        HangStruct.hoverHangStruct = traceRow.getHoverStruct();
      };
      this.hangThreadHandler(traceRow, it, i);
      folder.addChildTraceRow(traceRow);
    }
    let durTime = new Date().getTime() - hangStartTime;
    info('The time to load the HangData is: ', durTime);
  }

  async initFolder(): Promise<TraceRow<BaseStruct>> {
    let hangFolder = TraceRow.skeleton();
    hangFolder.rowId = 'Hangs';
    hangFolder.index = 0;
    hangFolder.rowType = TraceRow.ROW_TYPE_HANG_GROUP;
    hangFolder.rowParentId = '';
    hangFolder.style.height = '40px';
    hangFolder.folder = true;
    hangFolder.name = 'Hangs';
    hangFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    hangFolder.selectChangeHandler = this.trace.selectChangeHandler; // @ts-ignore
    hangFolder.supplier = (): Promise<unknown[]> => new Promise<Array<unknown>>((resolve) => resolve([]));
    hangFolder.onThreadHandler = (useCache): void => {
      hangFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (hangFolder.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, hangFolder.frame.width, hangFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          hangFolder
        );
      }
      hangFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    return hangFolder;
  }
}
