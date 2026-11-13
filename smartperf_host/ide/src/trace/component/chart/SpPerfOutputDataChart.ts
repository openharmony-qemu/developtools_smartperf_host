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
import { PerfToolRender, PerfToolStruct } from '../../database/ui-worker/ProcedureWorkerPerfTool';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { queryPerfOutputData, queryPerfToolsDur } from '../../database/sql/SqlLite.sql';

export class SpPerfOutputDataChart {
  private trace: SpSystemTrace;
  private startTime: number | undefined;
  private perfOutputArr: Array<string> | undefined;
  private dur: number | undefined;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let perfOutputData = await queryPerfOutputData();
    if (perfOutputData.length === 0) {
      return;
    }
    let perfToolsDur = await queryPerfToolsDur();
    if (perfToolsDur.length > 0) {
      // @ts-ignore
      this.dur = perfToolsDur[0].dur;
    } else {
      this.dur = 3000000000;
    }
    // @ts-ignore
    this.perfOutputArr = perfOutputData[0].name.includes(':') ? perfOutputData[0].name.split(':')[2].includes(',') ? perfOutputData[0].name.split(':')[2].split(',') : [] : [];
    // @ts-ignore
    let endTime: number = perfOutputData[0].ts;
    this.startTime = endTime - window.recordStartNS - this.dur!;
    if (this.startTime < 0) {
      this.startTime = 0;
    }
    let folder = await this.initFolder();
    this.trace.rowsEL?.appendChild(folder);
    this.initData(folder);
  }

  private clockThreadHandler(
    traceRow: TraceRow<PerfToolStruct>,
    it: {
      name: string;
    },
    perfId: number
  ): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.perfTool as PerfToolRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: it.name,
          index: perfId,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }
  //@ts-ignore
  async initData(folder: TraceRow<unknown>): Promise<void> {
    let perfToolStartTime = new Date().getTime();
    let perfToolList = [
      { name: 'Application Process CPU Power Consumption(MAS)', idx: 27 },
      { name: 'RS Process CPU Power Consumption(MAS)', idx: 28 },
      { name: 'Media Process CPU Power Consumption(MAS)', idx: 29 },
      { name: 'Foundation Process CPU Power Consumption(MAS)', idx: 30 },
      { name: 'Gpu Power Consumption(MAS)', idx: 31 },
      { name: 'DDR Power Consumption(MAS)', idx: 32 },
      { name: 'IO Count', idx: 35 },
      { name: 'Block Count', idx: 36 },
      { name: 'IPI Count(Application Main Thread)', idx: 51 },
      { name: 'IPI Count(RS)', idx: 52 },
    ];
    info('perfTools data size is: ', perfToolList!.length);
    for (let i = 0; i < perfToolList.length; i++) {
      const it = perfToolList[i];
      let traceRow = TraceRow.skeleton<PerfToolStruct>();
      traceRow.rowId = i + '';
      traceRow.rowType = TraceRow.ROW_TYPE_PERF_TOOL;
      traceRow.rowParentId = folder.rowId;
      traceRow.style.height = '24px';
      traceRow.name = it.name;
      traceRow.rowHidden = !folder.expansion;
      traceRow.setAttribute('children', '');
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      traceRow.supplierFrame = (): Promise<PerfToolStruct[]> => {
        let data = new PerfToolStruct();
        data.startTs = this.startTime;
        data.dur = this.dur;
        data.count = this.perfOutputArr![it.idx];
        data.id = i + 1;
        data.name = it.name;
        //@ts-ignore
        return new Promise<Array<unknown>>((resolve) => resolve([data]));
      };
      traceRow.findHoverStruct = (): void => {
        PerfToolStruct.hoverPerfToolStruct = traceRow.getHoverStruct();
      };
      this.clockThreadHandler(traceRow, it, i);
      folder.addChildTraceRow(traceRow);
    }
    let durTime = new Date().getTime() - perfToolStartTime;
    info('The time to load the ClockData is: ', durTime);
  }
  //@ts-ignore
  async initFolder(): Promise<TraceRow<unknown>> {
    let perfFolder = TraceRow.skeleton();
    perfFolder.rowId = 'perfTool';
    perfFolder.index = 0;
    perfFolder.rowType = TraceRow.ROW_TYPE_PERF_TOOL_GROUP;
    perfFolder.rowParentId = '';
    perfFolder.style.height = '40px';
    perfFolder.folder = true;
    perfFolder.name = 'Perf Tools';
    perfFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    perfFolder.selectChangeHandler = this.trace.selectChangeHandler;
    //@ts-ignore
    perfFolder.supplier = (): Promise<unknown[]> => new Promise<Array<unknown>>((resolve) => resolve([]));
    perfFolder.onThreadHandler = (useCache): void => {
      perfFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (perfFolder.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, perfFolder.frame.width, perfFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          perfFolder
        );
      }
      perfFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    return perfFolder;
  }
}
