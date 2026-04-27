/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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
import { ioSender } from '../../database/data-trafic/IOSender';
import { IORender, IOStruct } from '../../database/ui-worker/ProcedureWorkerIO';
import { ColorUtils } from '../trace/base/ColorUtils';
import { queryAllIOProcess } from '../../database/sql/IO.sql';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { BaseStruct } from 'src/trace/database/ui-worker/ProcedureWorkerCommon';

/**
 * System IO Chart:
 */
const SYSTEM_IO_LANE_HEIGHT = '48px';

export class SpSystemIOChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    const processes = await queryAllIOProcess();
    if (!processes || processes.length === 0) {
      return;
    }
    await this.initFolderAndLanes();
  }

  private async initFolderAndLanes(): Promise<void> {
    const folder = TraceRow.skeleton<BaseStruct>();
    folder.rowId = 'SystemIO';
    folder.index = 0;
    folder.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM_GROUP;
    folder.rowParentId = '';
    folder.rowHidden = false;
    folder.style.height = '40px';
    folder.folder = true;
    folder.name = 'System IO';
    folder.addTemplateTypes('HiEBpf');
    folder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    folder.selectChangeHandler = this.trace.selectChangeHandler;
    folder.supplierFrame = (): Promise<Array<BaseStruct>> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    folder.onThreadHandler = (useCache): void => {
      folder.canvasSave(this.trace.canvasPanelCtx!);
      if (folder.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, folder.frame.width, folder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          folder
        );
      }
      folder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };

    this.trace.rowsEL?.appendChild(folder);

    this.initLane(folder, 0, 'Logical Read', `io-system-logical-read`, ColorUtils.MD_PALETTE[0], 1);
    this.initLane(folder, 1, 'Logical Write', `io-system-logical-write`, ColorUtils.MD_PALETTE[8], 2);
    this.initLane(folder, 2, 'Physical Read', `io-system-physical-read`, ColorUtils.MD_PALETTE[2], 3);
    this.initLane(folder, 3, 'Physical Write', `io-system-physical-write`, ColorUtils.MD_PALETTE[10], 4);
  }

  private initLane(
    folder: TraceRow<BaseStruct>,
    type: number,
    name: string,
    rowId: string,
    chartColor: string,
    index: number
  ): void {
    const row = TraceRow.skeleton<IOStruct>();
    row.rowId = rowId;
    row.index = index;
    row.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM_IO;
    row.rowParentId = folder.rowId;
    row.rowHidden = !folder.expansion;
    row.style.height = SYSTEM_IO_LANE_HEIGHT;
    row.setAttribute('children', '');
    row.name = name;

    row.supplierFrame = async (): Promise<IOStruct[]> => {
      // pid = -1: 表示不按进程过滤，直接展示全局 filesystem_io
      return ioSender(type, TraceRow.range?.scale || 50, row, -1);
    };

    row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    row.selectChangeHandler = this.trace.selectChangeHandler;
    row.focusHandler = (): void => this.focusIOHandler(row);
    row.findHoverStruct = (): void => {
      IOStruct.hoverIOStruct = row.getHoverStruct(false) || null;
    };

    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      //@ts-ignore
      (renders['io'] as IORender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `io-system-${name}`,
          chartColor: chartColor,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };

    folder.addChildTraceRow(row);
  }

  private focusIOHandler(row: TraceRow<IOStruct>): void {
    let num = 0;
    let tip = '';
    if (IOStruct.hoverIOStruct) {
      num = IOStruct.hoverIOStruct.size ?? 0;
      const group10Ms = IOStruct.hoverIOStruct.group10Ms ?? false;
      if (num > 0) {
        tip = `<span>${num}${group10Ms ? ' (10.00ms)' : ''}</span>`;
      }
    }
    this.trace?.displayTip(row, IOStruct.hoverIOStruct, tip);
  }
}

