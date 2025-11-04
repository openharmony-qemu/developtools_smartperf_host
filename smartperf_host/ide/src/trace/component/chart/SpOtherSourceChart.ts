/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { info } from '../../../log/Log';
import { BaseStruct } from '../../bean/BaseStruct';
import { otherSourceChartDataCacheSender, otherSourceSender } from '../../database/data-trafic/OtherSourceDataSender';
import { procedurePool } from '../../database/Procedure';
import { queryBootTime, queryCount, queryOtherSourceRealTime, queryProcess, queryStatisticType } from '../../database/sql/otherSource.sql';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { OtherSourceRender, OtherSourceStruct } from '../../database/ui-worker/ProcedureWorkerOtherSource';
import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { Utils } from '../trace/base/Utils';

export class SpOtherSourceChart {
  private trace: SpSystemTrace;
  static REAL_TIME_DIF: number = 0;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initChart = async (): Promise<void> => {
    let isShowOtherSource = false;
    let isShowStatic = false;
    let result1 = await queryStatisticType();
    if (result1.length > 0) {
      isShowStatic = Object.values(result1[0]).some(value => value === 1);
    }
    if (!isShowOtherSource && !isShowStatic) {
      return;
    }
    let memoryType = 'native_hook';
    let count = await queryCount();
    if (count && count[0] && count[0].num > 0) {
      memoryType = 'native_hook_statistic';
    }
    let otherProcess = await queryProcess(memoryType);
    info('otherSource Process data size is: ', otherProcess!.length);
    if (otherProcess.length === 0) {
      return;
    }
    await this.initOtherSource();
    await otherSourceChartDataCacheSender(
      otherProcess.map((it) => it.ipid),
      memoryType
    );
    for (const process of otherProcess) {
      const floder = this.initOtherSourceFolder(process.pid, process.ipid);
      this.initData(floder, memoryType, process);
    }
  }

  initOtherSource = async (): Promise<void> => {
    let time = new Date().getTime();
    let isRealtime = false;
    let realTimeDif = 0;
    SpOtherSourceChart.REAL_TIME_DIF = 0;
    let queryTime = await queryOtherSourceRealTime();
    let bootTime = await queryBootTime();
    if (queryTime.length > 0) {
      //@ts-ignore
      isRealtime = queryTime[0].clock_name === 'realtime';
    }
    if (bootTime.length > 0 && isRealtime) {
      //@ts-ignore
      realTimeDif = queryTime[0].ts - bootTime[0].ts;
      SpOtherSourceChart.REAL_TIME_DIF = realTimeDif;
    }
    await new Promise<unknown>((resolve) => {
      procedurePool.submitWithName(
        'logic0',
        'other-source-init',
        { isRealtime, realTimeDif },
        undefined,
        (res: unknown) => {
          resolve(res);
        }
      );
    });
    let durTime = new Date().getTime() - time;
    info('The time to init the other source data is: ', durTime);
  };

  initOtherSourceFolder(process: number, ipid: number): TraceRow<BaseStruct> {
    const otherSourceRow = TraceRow.skeleton();
    otherSourceRow.rowId = `other-source ${process} ${ipid}`;
    otherSourceRow.index = 0;
    otherSourceRow.rowType = TraceRow.ROW_TYPE_OTHER_SOURCE;
    otherSourceRow.drawType = 1;
    otherSourceRow.style.height = '40px';
    otherSourceRow.rowParentId = '';
    otherSourceRow.folder = true;
    otherSourceRow.name = `Other Source (${process})`;
    otherSourceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    otherSourceRow.selectChangeHandler = this.trace.selectChangeHandler;
    otherSourceRow.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    this.folderThreadHandler(otherSourceRow);
    this.trace.rowsEL?.appendChild(otherSourceRow);
    return otherSourceRow;
  }

  folderThreadHandler(row: TraceRow<BaseStruct>): void {
    row.onThreadHandler = (useCache): void => {
      row.canvasSave(this.trace.canvasPanelCtx!);
      if (row.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          row
        );
      }
      row.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
  }

  initData(folder: TraceRow<BaseStruct>, type: string, process: { pid: number; ipid: number }): void {
    const chartList = ['FD', 'THREAD'];
    for (let i = 0; i < chartList.length; i++) {
      const os = chartList[i];
      const allOtherSourceRow = TraceRow.skeleton<OtherSourceStruct>();
      allOtherSourceRow.index = i;
      allOtherSourceRow.rowParentId = `other-source ${process.pid} ${process.ipid}`;
      allOtherSourceRow.rowHidden = !folder.expansion;
      allOtherSourceRow.style.height = '40px';
      allOtherSourceRow.name = os;
      allOtherSourceRow.rowId = os;
      allOtherSourceRow.drawType = 1;
      allOtherSourceRow.isHover = true;
      allOtherSourceRow.folder = false;
      allOtherSourceRow.rowType = TraceRow.ROW_TYPE_OTHER_SOURCE_HEAP;
      allOtherSourceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      allOtherSourceRow.selectChangeHandler = this.trace.selectChangeHandler;
      allOtherSourceRow.setAttribute('otherSource-type', type);
      allOtherSourceRow.setAttribute('children', '');
      allOtherSourceRow.focusHandler = (): void => {
        let tip = '';
        if (OtherSourceStruct.hoverOtherSourceStruct) {
          if (allOtherSourceRow.drawType === 1) {
            tip = `<span>${OtherSourceStruct.hoverOtherSourceStruct.density}</span>`;
          } else {
            tip = `<span>${Utils.getByteWithUnit(OtherSourceStruct.hoverOtherSourceStruct.heapsize!)}</span>`;
          }
        }
        this.trace?.displayTip(allOtherSourceRow, OtherSourceStruct.hoverOtherSourceStruct, tip);
      };
      allOtherSourceRow.findHoverStruct = (): void => {
        OtherSourceStruct.hoverOtherSourceStruct = allOtherSourceRow.getHoverStruct();
      }; //@ts-ignore
      allOtherSourceRow.supplierFrame = (): Promise<unknown> =>
        otherSourceSender(allOtherSourceRow, {
          eventType: i,
          ipid: process.ipid,
          model: type,
          drawType: allOtherSourceRow.drawType,
        });
      this.chartThreadHandler(allOtherSourceRow);
      folder.addChildTraceRow(allOtherSourceRow);
    }
  }

  chartThreadHandler(row: TraceRow<OtherSourceStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.otherSource as OtherSourceRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'otherSource'
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }
}