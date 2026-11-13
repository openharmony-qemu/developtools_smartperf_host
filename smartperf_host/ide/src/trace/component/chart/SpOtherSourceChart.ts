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
import { MemoryBasicType, MemoryTraceRowType, MemoryType } from '../../bean/MemoryEnum';
import { NativeHookProcess } from '../../bean/NativeHook';
import { nativeMemoryChartDataSender } from '../../database/data-trafic/NativeMemoryDataSender';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { HeapRender, HeapStruct} from '../../database/ui-worker/ProcedureWorkerHeap';
import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { Utils } from '../trace/base/Utils';

export class SpOtherSourceChart {
  private trace: SpSystemTrace;
  static REAL_TIME_DIF: number = 0;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initChart = async (memoryType: string, process: NativeHookProcess): Promise<void> => {
    const folder = this.initOtherSourceFolder(process.pid, process.ipid);
    this.initData(folder, memoryType, process);
  }

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
    const chartList = [MemoryBasicType.OTHER_SOURCE[1], MemoryBasicType.OTHER_SOURCE[2]];
    for (let i = 0; i < chartList.length; i++) {
      const os = chartList[i];
      const allOtherSourceRow = TraceRow.skeleton<HeapStruct>();
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
      allOtherSourceRow.setAttribute('heap-type', type);
      allOtherSourceRow.setAttribute('children', '');
      allOtherSourceRow.focusHandler = (): void => {
        let tip = '';
        if (HeapStruct.hoverHeapStruct) {
          if (allOtherSourceRow.drawType === 1) {
            tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
          } else {
            tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
          }
        }
        this.trace?.displayTip(allOtherSourceRow, HeapStruct.hoverHeapStruct, tip);
      };
      allOtherSourceRow.findHoverStruct = (): void => {
        HeapStruct.hoverHeapStruct = allOtherSourceRow.getHoverStruct();
      }; //@ts-ignore
      allOtherSourceRow.supplierFrame = (): Promise<unknown> =>
        nativeMemoryChartDataSender(allOtherSourceRow, {
          memoryType: MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE,
          eventType: i,
          ipid: process.ipid,
          model: type,
          drawType: allOtherSourceRow.drawType,
        });
      this.chartThreadHandler(allOtherSourceRow);
      folder.addChildTraceRow(allOtherSourceRow);
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
          type: MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }
}