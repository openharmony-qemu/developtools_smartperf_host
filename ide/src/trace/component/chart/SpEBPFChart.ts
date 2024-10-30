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
import { procedurePool } from '../../database/Procedure';
import { EBPFChartStruct, EBPFRender } from '../../database/ui-worker/ProcedureWorkerEBPF';
import { ColorUtils } from '../trace/base/ColorUtils';
import { Utils } from '../trace/base/Utils';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { diskIoSender, fileSysVMSender, fileSystemSender } from '../../database/data-trafic/EBPFSender';
import { hasFileSysData } from '../../database/sql/Memory.sql';
import { getDiskIOProcess } from '../../database/sql/SqlLite.sql';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

export class SpEBPFChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let sys = await hasFileSysData();
    if (sys.length > 0) {
      //@ts-ignore
      let fsCount = sys[0].fsCount ?? 0;
      //@ts-ignore
      let vmCount = sys[0].vmCount ?? 0;
      //@ts-ignore
      let ioCount = sys[0].ioCount ?? 0;
      if (sys && sys.length > 0 && (fsCount > 0 || vmCount > 0 || ioCount > 0)) {
        let folder = await this.initFolder();
        await this.initFileCallchain();
        if (fsCount > 0) {
          await this.initLogicalRead(folder);
          await this.initLogicalWrite(folder);
        }
        if (vmCount > 0) {
          await this.initVirtualMemoryTrace(folder);
        }
        if (ioCount > 0) {
          await this.initDiskIOLatency(folder);
          await this.initProcessDiskIOLatency(folder);
        }
      }
    }
  }

  async initFileCallchain(): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      procedurePool.submitWithName('logic0', 'fileSystem-init', null, undefined, (res: unknown) => {
        resolve(res);
      });
    });
  }

  //@ts-ignore
  async initFolder(): Promise<TraceRow<unknown>> {
    let fsFolder = TraceRow.skeleton();
    fsFolder.rowId = 'FileSystem';
    fsFolder.index = 0;
    fsFolder.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM_GROUP;
    fsFolder.rowParentId = '';
    fsFolder.style.height = '40px';
    fsFolder.folder = true;
    fsFolder.name = 'EBPF'; /* & I/O Latency */
    fsFolder.addTemplateTypes('HiEBpf');
    fsFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    fsFolder.selectChangeHandler = this.trace.selectChangeHandler; //@ts-ignore
    fsFolder.supplierFrame = (): Promise<Array<unknown>> => new Promise<Array<unknown>>((resolve) => resolve([]));
    fsFolder.onThreadHandler = (useCache): void => {
      fsFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (fsFolder.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, fsFolder.frame.width, fsFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          fsFolder
        );
      }
      fsFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    this.trace.rowsEL?.appendChild(fsFolder);
    return fsFolder;
  }

  //@ts-ignore
  async initLogicalRead(folder: TraceRow<unknown>): Promise<void> {
    let logicalReadRow = TraceRow.skeleton<EBPFChartStruct>();
    logicalReadRow.rowId = 'FileSystemLogicalRead';
    logicalReadRow.index = 1;
    logicalReadRow.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    logicalReadRow.rowParentId = folder.rowId;
    logicalReadRow.rowHidden = !folder.expansion;
    logicalReadRow.style.height = '40px';
    logicalReadRow.setAttribute('children', '');
    logicalReadRow.name = 'FileSystem Logical Read';
    logicalReadRow.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      const res = await fileSystemSender(2, TraceRow.range?.scale || 50, logicalReadRow);
      return res;
    };
    logicalReadRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    logicalReadRow.selectChangeHandler = this.trace.selectChangeHandler;
    logicalReadRow.focusHandler = (): void => this.focusHandler(logicalReadRow);
    logicalReadRow.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = logicalReadRow.getHoverStruct(false);
    };
    logicalReadRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (logicalReadRow.currentContext) {
        context = logicalReadRow.currentContext;
      } else {
        context = logicalReadRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      logicalReadRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-logical-read`,
          chartColor: ColorUtils.MD_PALETTE[0],
        },
        logicalReadRow
      );
      logicalReadRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(logicalReadRow);
  }

  //@ts-ignore
  async initLogicalWrite(folder: TraceRow<unknown>): Promise<void> {
    let logicalWriteRow = TraceRow.skeleton<EBPFChartStruct>();
    logicalWriteRow.rowId = 'FileSystemLogicalWrite';
    logicalWriteRow.index = 2;
    logicalWriteRow.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    logicalWriteRow.rowParentId = folder.rowId;
    logicalWriteRow.rowHidden = !folder.expansion;
    logicalWriteRow.style.height = '40px';
    logicalWriteRow.setAttribute('children', '');
    logicalWriteRow.name = 'FileSystem Logical Write';
    logicalWriteRow.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      const res = await fileSystemSender(3, TraceRow.range?.scale || 50, logicalWriteRow);
      return res;
    };
    logicalWriteRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    logicalWriteRow.selectChangeHandler = this.trace.selectChangeHandler;
    logicalWriteRow.focusHandler = (): void => this.focusHandler(logicalWriteRow);
    logicalWriteRow.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = logicalWriteRow.getHoverStruct(false);
    };
    logicalWriteRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (logicalWriteRow.currentContext) {
        context = logicalWriteRow.currentContext;
      } else {
        context = logicalWriteRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      logicalWriteRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-logical-write`,
          chartColor: ColorUtils.MD_PALETTE[8],
        },
        logicalWriteRow
      );
      logicalWriteRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(logicalWriteRow);
  }

  //@ts-ignore
  async initDiskIOLatency(folder: TraceRow<unknown>): Promise<void> {
    let diskIoRow = TraceRow.skeleton<EBPFChartStruct>();
    diskIoRow.rowId = 'FileSystemDiskIOLatency';
    diskIoRow.index = 4;
    diskIoRow.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    diskIoRow.rowParentId = folder.rowId;
    diskIoRow.rowHidden = !folder.expansion;
    diskIoRow.style.height = '40px';
    diskIoRow.style.width = '100%';
    diskIoRow.setAttribute('children', '');
    diskIoRow.name = 'Disk I/O Latency';
    diskIoRow.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      const res = await diskIoSender(true, 0, [1, 2, 3, 4], TraceRow.range?.scale || 50, diskIoRow);
      return res;
    };
    diskIoRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    diskIoRow.selectChangeHandler = this.trace.selectChangeHandler;
    diskIoRow.focusHandler = (): void => this.focusHandler(diskIoRow);
    diskIoRow.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = diskIoRow.getHoverStruct(false);
    };
    diskIoRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (diskIoRow.currentContext) {
        context = diskIoRow.currentContext;
      } else {
        context = diskIoRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      diskIoRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-disk-io`,
          chartColor: ColorUtils.MD_PALETTE[0],
        },
        diskIoRow
      );
      diskIoRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(diskIoRow);
  }

  //@ts-ignore
  initProcessDiskIOLatencyRead(i: number, folder: TraceRow<unknown>, process: unknown): TraceRow<EBPFChartStruct> {
    let rowRead = TraceRow.skeleton<EBPFChartStruct>();
    rowRead.index = 5 + 2 * i; //@ts-ignore
    rowRead.rowId = `FileSystemDiskIOLatency-read-${process.ipid}`;
    rowRead.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    rowRead.rowParentId = folder.rowId;
    rowRead.rowHidden = !folder.expansion;
    rowRead.style.height = '40px';
    rowRead.style.width = '100%';
    rowRead.setAttribute('children', ''); //@ts-ignore
    rowRead.name = `${process.name ?? 'Process'}(${process.ipid}) Max Read Latency`;
    rowRead.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      //@ts-ignore
      const res = await diskIoSender(false, process.ipid, [1, 3], TraceRow.range?.scale || 50, rowRead);
      return res;
    };
    rowRead.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    rowRead.selectChangeHandler = this.trace.selectChangeHandler;
    rowRead.focusHandler = (): void => this.focusHandler(rowRead);
    rowRead.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = rowRead.getHoverStruct(false);
    };
    rowRead.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (rowRead.currentContext) {
        context = rowRead.currentContext;
      } else {
        context = rowRead.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      rowRead.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache, //@ts-ignore
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-disk-io-process-read-${process.pid}`,
          chartColor: ColorUtils.MD_PALETTE[0],
        },
        rowRead
      );
      rowRead.canvasRestore(context, this.trace);
    };
    return rowRead;
  }

  //@ts-ignore
  private initProcessDiskIOWrite(i: number, folder: TraceRow<unknown>, process: unknown): TraceRow<EBPFChartStruct> {
    let rowWrite = TraceRow.skeleton<EBPFChartStruct>();
    rowWrite.index = 5 + 2 * i + 1; //@ts-ignore
    rowWrite.rowId = `FileSystemDiskIOLatency-write-${process.ipid}`;
    rowWrite.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    rowWrite.rowParentId = folder.rowId;
    rowWrite.rowHidden = !folder.expansion;
    rowWrite.style.height = '40px';
    rowWrite.style.width = '100%';
    rowWrite.setAttribute('children', ''); //@ts-ignore
    rowWrite.name = `${process.name ?? 'Process'}(${process.pid}) Max Write Latency`;
    rowWrite.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      //@ts-ignore
      const res = await diskIoSender(false, process.ipid, [2, 4], TraceRow.range?.scale || 50, rowWrite);
      return res;
    };
    rowWrite.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    rowWrite.selectChangeHandler = this.trace.selectChangeHandler;
    rowWrite.focusHandler = (): void => this.focusHandler(rowWrite);
    rowWrite.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = rowWrite.getHoverStruct(false);
    };
    rowWrite.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (rowWrite.currentContext) {
        context = rowWrite.currentContext;
      } else {
        context = rowWrite.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      rowWrite.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache, //@ts-ignore
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-disk-io-process-write-${process.pid}`,
          chartColor: ColorUtils.MD_PALETTE[8],
        },
        rowWrite
      );
      rowWrite.canvasRestore(context, this.trace);
    };
    return rowWrite;
  }

  //@ts-ignore
  async initProcessDiskIOLatency(folder: TraceRow<unknown>): Promise<void> {
    let processes = (await getDiskIOProcess()) || [];
    for (let i = 0, len = processes.length; i < len; i++) {
      let process = processes[i];
      const rowRead = this.initProcessDiskIOLatencyRead(i, folder, process);
      folder.addChildTraceRow(rowRead);
      const rowWrite = this.initProcessDiskIOWrite(i, folder, process);
      folder.addChildTraceRow(rowWrite);
    }
  }

  //@ts-ignore
  async initVirtualMemoryTrace(folder: TraceRow<unknown>): Promise<void> {
    let vmTraceRow = TraceRow.skeleton<EBPFChartStruct>();
    vmTraceRow.rowId = 'FileSystemVirtualMemory';
    vmTraceRow.index = 3;
    vmTraceRow.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM;
    vmTraceRow.rowParentId = folder.rowId;
    vmTraceRow.rowHidden = !folder.expansion;
    vmTraceRow.rangeSelect = true;
    vmTraceRow.style.height = '40px';
    vmTraceRow.style.width = '100%';
    vmTraceRow.setAttribute('children', '');
    vmTraceRow.name = 'Page Fault Trace';
    vmTraceRow.supplierFrame = async (): Promise<EBPFChartStruct[]> => {
      const res = await fileSysVMSender(TraceRow.range?.scale || 50, vmTraceRow);
      return res;
    };
    vmTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    vmTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    vmTraceRow.focusHandler = (): void => this.focusHandler(vmTraceRow);
    vmTraceRow.findHoverStruct = (): void => {
      EBPFChartStruct.hoverEBPFStruct = vmTraceRow.getHoverStruct(false, false, 'size');
    };
    vmTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (vmTraceRow.currentContext) {
        context = vmTraceRow.currentContext;
      } else {
        context = vmTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      vmTraceRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_FILE_SYSTEM] as EBPFRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `${TraceRow.ROW_TYPE_FILE_SYSTEM}-virtual-memory`,
          chartColor: ColorUtils.MD_PALETTE[0],
        },
        vmTraceRow
      );
      vmTraceRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(vmTraceRow);
  }

  focusHandler(row: TraceRow<EBPFChartStruct>): void {
    let num = 0;
    let tip = '';
    if (EBPFChartStruct.hoverEBPFStruct) {
      num = EBPFChartStruct.hoverEBPFStruct.size ?? 0;
      let group10Ms = EBPFChartStruct.hoverEBPFStruct.group10Ms ?? false;
      if (row.rowId!.startsWith('FileSystemDiskIOLatency')) {
        if (num > 0) {
          let tipStr = Utils.getProbablyTime(num);
          if (group10Ms) {
            tip = `<span>${tipStr} (10.00ms)</span>`;
          } else {
            tip = `<span>${tipStr}</span>`;
          }
        }
      } else {
        if (num > 0) {
          if (group10Ms) {
            tip = `<span>${num} (10.00ms)</span>`;
          } else {
            tip = `<span>${num}</span>`;
          }
        }
      }
    }
    this.trace?.displayTip(row, EBPFChartStruct.hoverEBPFStruct, tip);
  }
}
