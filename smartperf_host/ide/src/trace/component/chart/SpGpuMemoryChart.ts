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
import { procedurePool } from '../../database/Procedure';
import { GpuMemoryEventHeap, queryBootTime, queryCount, queryGpuMemoryGroupByEvent, queryGpuMemoryRealTime, queryGpuType, queryProcess, queryStatisticType } from '../../database/sql/gpuMemory.sql';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { GpuMemoryRender, GpuMemoryStruct } from '../../database/ui-worker/ProcedureWorkerGpuMemory';
import { Utils } from '../trace/base/Utils';
import { gpuMemoryChartDataCacheSender, GpuMemorySender } from '../../database/data-trafic/GpuMemoryDataSender';

export class SpGpuMemoryChart {
  private trace: SpSystemTrace;
  static REAL_TIME_DIF: number = 0;
  static EVENT_HEAP: Array<GpuMemoryEventHeap> = [];
  static gpuDataMap = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initChart = async (): Promise<void> => {
    let isShowGpu = false;
    let isShowStatic = false;
    let result = await queryGpuType();
    let result1 = await queryStatisticType();
    if (result.length > 0) {
      isShowGpu = Object.values(result[0]).some(value => value === 1);
    }
    if (result1.length > 0) {
      isShowStatic = Object.values(result1[0]).some(value => value === 1);
    }
    if (!isShowGpu && !isShowStatic) {
      return;
    }
    let gpuMemoryType = 'native_hook';
    let count = await queryCount();
    if (count && count[0] && count[0].num > 0) {
      gpuMemoryType = 'native_hook_statistic';
    }
    let gpuProcess = await queryProcess(gpuMemoryType);
    info('gpuMemory Process data size is: ', gpuProcess!.length);
    if (gpuProcess.length === 0) {
      return;
    }
    await this.initGpuMemory();
    await gpuMemoryChartDataCacheSender(
      gpuProcess.map((it) => it.ipid),
      gpuMemoryType
    );
    SpGpuMemoryChart.EVENT_HEAP = await queryGpuMemoryGroupByEvent(gpuMemoryType);
    for (const process of gpuProcess) {
      const floder = this.initGpuMemoryFolder(process.pid, process.ipid);
      this.initData(floder, gpuMemoryType, process);
    }
  }

  initGpuMemory = async (): Promise<void> => {
    let time = new Date().getTime();
    let isRealtime = false;
    let realTimeDif = 0;
    SpGpuMemoryChart.REAL_TIME_DIF = 0;
    let queryTime = await queryGpuMemoryRealTime();
    let bootTime = await queryBootTime();
    if (queryTime.length > 0) {
      //@ts-ignore
      isRealtime = queryTime[0].clock_name === 'realtime';
    }
    if (bootTime.length > 0 && isRealtime) {
      //@ts-ignore
      realTimeDif = queryTime[0].ts - bootTime[0].ts;
      SpGpuMemoryChart.REAL_TIME_DIF = realTimeDif;
    }
    await new Promise<unknown>((resolve) => {
      procedurePool.submitWithName(
        'logic0',
        'gpu-memory-init',
        { isRealtime, realTimeDif },
        undefined,
        (res: unknown) => {
          resolve(res);
        }
      );
    });
    let durTime = new Date().getTime() - time;
    info('The time to init the gpu memory data is: ', durTime);
  };

  initGpuMemoryFolder(process: number, ipid: number): TraceRow<BaseStruct> {
    const gpuMemoryRow = TraceRow.skeleton();
    gpuMemoryRow.rowId = `gpu-memory ${process} ${ipid}`;
    gpuMemoryRow.index = 0;
    gpuMemoryRow.rowType = TraceRow.ROW_TYPE_GPU_MEMORY;
    gpuMemoryRow.drawType = 0;
    gpuMemoryRow.style.height = '40px';
    gpuMemoryRow.rowParentId = '';
    gpuMemoryRow.folder = true;
    gpuMemoryRow.addTemplateTypes('GpuMemory');
    gpuMemoryRow.name = `Gpu Memory (${process})`;
    gpuMemoryRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    gpuMemoryRow.selectChangeHandler = this.trace.selectChangeHandler;
    gpuMemoryRow.addRowSettingPop();
    gpuMemoryRow.rowSetting = 'enable';
    gpuMemoryRow.rowSettingPopoverDirection = 'bottomLeft';
    gpuMemoryRow.rowSettingList = [
      {
        key: '0',
        title: 'Current Bytes',
        checked: true,
      },
      {
        key: '1',
        title: 'Gpu Memory Density',
      },
    ];
    gpuMemoryRow.onRowSettingChangeHandler = (value): void => {
      gpuMemoryRow.childrenList.forEach((row) => (row.drawType = parseInt(value[0])));
      this.trace
        .getCollectRows((row) => row.rowType === 'gpu_heap')
        .forEach((it) => {
          it.drawType = parseInt(value[0]);
        });
      this.trace.refreshCanvas(false);
    };
    gpuMemoryRow.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    this.folderThreadHandler(gpuMemoryRow);
    this.trace.rowsEL?.appendChild(gpuMemoryRow);
    return gpuMemoryRow;
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
    const chartList = ['Graphic Memory', 'VulKan', 'OpenGLES', 'OpenCL'];
    for (let i = 0; i < chartList.length; i++) {
      const gm = chartList[i];
      const allGpuRow = TraceRow.skeleton<GpuMemoryStruct>();
      allGpuRow.index = i;
      allGpuRow.rowParentId = `gpu-memory ${process.pid} ${process.ipid}`;
      allGpuRow.rowHidden = !folder.expansion;
      allGpuRow.style.height = '40px';
      allGpuRow.name = gm;
      allGpuRow.rowId = gm;
      allGpuRow.drawType = 0;
      allGpuRow.isHover = true;
      allGpuRow.folder = false;
      allGpuRow.rowType = TraceRow.ROW_TYPE_GPU_HEAP;
      allGpuRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      allGpuRow.selectChangeHandler = this.trace.selectChangeHandler;
      allGpuRow.setAttribute('gpuMemory-type', type);
      allGpuRow.setAttribute('children', '');
      allGpuRow.focusHandler = (): void => {
        let tip = '';
        if (GpuMemoryStruct.hoverGpuMemoryStruct) {
          if (allGpuRow.drawType === 1) {
            tip = `<span>${GpuMemoryStruct.hoverGpuMemoryStruct.density}</span>`;
          } else {
            tip = `<span>${Utils.getByteWithUnit(GpuMemoryStruct.hoverGpuMemoryStruct.heapsize!)}</span>`;
          }
        }
        this.trace?.displayTip(allGpuRow, GpuMemoryStruct.hoverGpuMemoryStruct, tip);
      };
      allGpuRow.findHoverStruct = (): void => {
        GpuMemoryStruct.hoverGpuMemoryStruct = allGpuRow.getHoverStruct();
      }; //@ts-ignore
      allGpuRow.supplierFrame = (): Promise<unknown> =>
        GpuMemorySender(allGpuRow, {
          eventType: i,
          ipid: process.ipid,
          model: type,
          drawType: allGpuRow.drawType,
        });
      this.chartThreadHandler(allGpuRow);
      folder.addChildTraceRow(allGpuRow);
    }
  }

  chartThreadHandler(row: TraceRow<GpuMemoryStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.gpuMemory as GpuMemoryRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'gpuMemory'
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }
}