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
import { BaseStruct } from '../../bean/BaseStruct';
import { GpuMemoryEventHeap, queryGpuMemoryGroupByEvent} from '../../database/sql/gpuMemory.sql';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { Utils } from '../trace/base/Utils';
import { nativeMemoryChartDataSender } from '../../database/data-trafic/NativeMemoryDataSender';
import { MemoryBasicType, MemoryTraceRowType } from '../../bean/MemoryEnum';
import { NativeHookProcess } from '../../bean/NativeHook';
import { HeapRender, HeapStruct } from '../../database/ui-worker/ProcedureWorkerHeap';

export class SpGpuMemoryChart {
  private trace: SpSystemTrace;
  static REAL_TIME_DIF: number = 0;
  static EVENT_HEAP: Array<GpuMemoryEventHeap> = [];
  static gpuDataMap = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initChart = async (gpuMemoryType: string, process: NativeHookProcess): Promise<void> => {
    SpGpuMemoryChart.EVENT_HEAP = await queryGpuMemoryGroupByEvent(gpuMemoryType);
    const floder = this.initGpuMemoryFolder(process.pid, process.ipid);
    this.initData(floder, gpuMemoryType, process);

  }

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
    for (let i = 0; i < MemoryBasicType.GPU_MEMORY.length; i++) {
      const gm = MemoryBasicType.GPU_MEMORY[i];
      const allGpuRow = TraceRow.skeleton<HeapStruct>();
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
      allGpuRow.setAttribute('heap-type', type);
      allGpuRow.setAttribute('children', '');
      allGpuRow.focusHandler = (): void => {
        let tip = '';
        if (HeapStruct.hoverHeapStruct) {
          if (allGpuRow.drawType === 1) {
            tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
          } else {
            tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
          }
        }
        this.trace?.displayTip(allGpuRow, HeapStruct.hoverHeapStruct, tip);
      };
      allGpuRow.findHoverStruct = (): void => {
        HeapStruct.hoverHeapStruct = allGpuRow.getHoverStruct();
      }; //@ts-ignore
      allGpuRow.supplierFrame = (): Promise<unknown> =>
        nativeMemoryChartDataSender(allGpuRow, {
          memoryType: MemoryTraceRowType.ROW_TYPE_GPU_MEMORY,
          eventType: i,
          ipid: process.ipid,
          model: type,
          drawType: allGpuRow.drawType,
        });
      this.chartThreadHandler(allGpuRow);
      folder.addChildTraceRow(allGpuRow);
    }
  }

  chartThreadHandler(row: TraceRow<HeapStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.heap as HeapRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: MemoryTraceRowType.ROW_TYPE_GPU_MEMORY,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }
}