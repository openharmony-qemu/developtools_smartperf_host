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
import { type EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { type HeapTimelineRender, HeapTimelineStruct } from '../../database/ui-worker/ProcedureWorkerHeapTimeline';
import { HeapDataInterface, type ParseListener } from '../../../js-heap/HeapDataInterface';
import { LoadDatabase } from '../../../js-heap/LoadDatabase';
import { type FileInfo } from '../../../js-heap/model/UiStruct';
import { type HeapSnapshotRender, HeapSnapshotStruct } from '../../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { Utils } from '../trace/base/Utils';
import { type JsCpuProfilerChartFrame } from '../../bean/JsStruct';
import { type JsCpuProfilerRender, JsCpuProfilerStruct } from '../../database/ui-worker/ProcedureWorkerCpuProfiler';
import { ns2s } from '../../database/ui-worker/ProcedureWorkerCommon';
import { cpuProfilerDataSender } from '../../database/data-trafic/ArkTsSender';
import { queryJsCpuProfilerConfig, queryJsCpuProfilerData } from '../../database/sql/Cpu.sql';
import { queryJsMemoryData } from '../../database/sql/Memory.sql';
import { type HeapSample } from '../../../js-heap/model/DatabaseStruct';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

const TYPE_SNAPSHOT = 0;
const TYPE_TIMELINE = 1;
const LAMBDA_FUNCTION_NAME = '(anonymous)';
export class SpArkTsChart implements ParseListener {
  private trace: SpSystemTrace; // @ts-ignore
  private folderRow: TraceRow<unknown> | undefined;
  private jsCpuProfilerRow: TraceRow<JsCpuProfilerStruct> | undefined;
  private heapTimelineRow: TraceRow<HeapTimelineStruct> | undefined;
  private heapSnapshotRow: TraceRow<HeapSnapshotStruct> | undefined;
  private loadJsDatabase: LoadDatabase;
  private allCombineDataMap = new Map<number, JsCpuProfilerChartFrame>();
  private process: string = '';

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
    this.loadJsDatabase = LoadDatabase.getInstance();
  }

  public get chartFrameMap(): Map<number, JsCpuProfilerChartFrame> {
    return this.allCombineDataMap;
  }

  private cpuProfilerSupplierFrame(): void {
    // @ts-ignore
    this.jsCpuProfilerRow!.supplierFrame = (): Promise<Array<unknown>> => {
      return cpuProfilerDataSender(this.jsCpuProfilerRow!).then((res: unknown) => {
        // @ts-ignore
        let maxHeight = res.maxDepth * 20;
        this.jsCpuProfilerRow!.style.height = `${maxHeight}px`; // @ts-ignore
        if (res.dataList.length > 0) {
          this.allCombineDataMap = new Map<number, JsCpuProfilerChartFrame>(); // @ts-ignore
          for (let data of res.dataList) {
            this.allCombineDataMap.set(data.id, data);
            SpSystemTrace.jsProfilerMap.set(data.id, data);
          } // @ts-ignore
          res.dataList.forEach((data: unknown) => {
            // @ts-ignore
            data.children = []; // @ts-ignore
            if (data.childrenIds.length > 0) {
              // @ts-ignore
              for (let id of data.childrenIds) {
                let child = SpSystemTrace.jsProfilerMap.get(Number(id)); // @ts-ignore
                data.children.push(child);
              }
            } // @ts-ignore
            data.name = SpSystemTrace.DATA_DICT.get(data.nameId) || LAMBDA_FUNCTION_NAME; // @ts-ignore
            data.url = SpSystemTrace.DATA_DICT.get(data.urlId) || 'unknown'; // @ts-ignore
            if (data.url && data.url !== 'unknown') {
              // @ts-ignore
              let dirs = data.url.split('/'); // @ts-ignore
              data.scriptName = dirs.pop() || '';
            }
          });
        } // @ts-ignore
        return res.dataList;
      });
    };
  }

  private folderThreadHandler(): void {
    this.folderRow!.onThreadHandler = (useCache): void => {
      this.folderRow!.canvasSave(this.trace.canvasPanelCtx!);
      if (this.folderRow!.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, this.folderRow!.frame.width, this.folderRow!.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          this.folderRow!
        );
      }
      this.folderRow!.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
  }

  public async initFolder(): Promise<void> {
    let jsConfig = await queryJsCpuProfilerConfig();
    let jsCpu = await queryJsCpuProfilerData();
    let jsMemory = await queryJsMemoryData();
    if (jsMemory.length > 0 || jsCpu.length > 0) {
      this.folderRow = TraceRow.skeleton();
      //@ts-ignore
      this.process = jsConfig[0].pid;
      this.folderRow.rowId = this.process;
      this.folderRow.rowType = TraceRow.ROW_TYPE_ARK_TS;
      this.folderRow.style.height = '40px';
      this.folderRow.rowParentId = '';
      this.folderRow.folder = true;
      this.folderRow.name = `Ark Ts ${this.process}`;
      this.folderRow.addTemplateTypes('ArkTs');
      this.folderRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      this.folderRow.selectChangeHandler = this.trace.selectChangeHandler;
      this.folderRow.supplierFrame = (): Promise<Array<unknown>> =>
        new Promise<Array<unknown>>((resolve) => resolve([]));
      this.folderThreadHandler();
      this.trace.rowsEL?.appendChild(this.folderRow); //@ts-ignore
      if (this.folderRow && jsConfig[0].type !== -1 && jsMemory.length > 0) {
        this.folderRow.addTemplateTypes('Memory');
        if (
          //@ts-ignore
          jsConfig[0].type === TYPE_SNAPSHOT
        ) {
          // snapshot
          await this.initSnapshotChart();
        } else if (
          //@ts-ignore
          jsConfig[0].type === TYPE_TIMELINE
        ) {
          // timeline
          await this.initTimelineChart();
        }
      }
      //@ts-ignore
      if (this.folderRow && jsConfig[0].enableCpuProfiler === 1 && jsCpu.length > 0) {
        await this.initJsCpuChart();
      }
      if ((this.heapSnapshotRow || this.heapTimelineRow) && jsMemory.length > 0) {
        await this.loadJsDatabase.loadDatabase(this);
      }
      if (this.jsCpuProfilerRow && jsCpu.length > 0) {
        this.cpuProfilerSupplierFrame();
      }
    }
  }

  private async initTimelineChart(): Promise<void> {
    this.heapTimelineRow = TraceRow.skeleton<HeapTimelineStruct>();
    this.heapTimelineRow.rowParentId = this.process;
    this.heapTimelineRow.rowHidden = !this.folderRow!.expansion;
    this.heapTimelineRow.style.height = '40px';
    this.heapTimelineRow.name = 'Heaptimeline';
    this.heapTimelineRow.folder = false;
    this.heapTimelineRow.rowType = TraceRow.ROW_TYPE_HEAP_TIMELINE;
    this.heapTimelineRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    this.heapTimelineRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.heapTimelineRow.setAttribute('children', '');
    this.heapTimelineRow!.focusHandler = (): void => {
      this.trace?.displayTip(
        this.heapTimelineRow!,
        HeapTimelineStruct.hoverHeapTimelineStruct,
        `<span>Size: ${Utils.getBinaryByteWithUnit(HeapTimelineStruct.hoverHeapTimelineStruct?.size || 0)}</span>`
      );
    };
    this.heapTimelineRow!.findHoverStruct = (): void => {
      HeapTimelineStruct.hoverHeapTimelineStruct = this.heapTimelineRow!.getHoverStruct();
    };
    this.folderRow!.addChildTraceRow(this.heapTimelineRow!);
  }

  private async initSnapshotChart(): Promise<void> {
    this.heapSnapshotRow = TraceRow.skeleton<HeapSnapshotStruct>();
    this.heapSnapshotRow.rowParentId = this.process;
    this.heapSnapshotRow.rowHidden = !this.folderRow!.expansion;
    this.heapSnapshotRow.style.height = '40px';
    this.heapSnapshotRow.name = 'Heapsnapshot';
    this.heapSnapshotRow.rowId = 'heapsnapshot';
    this.heapSnapshotRow.folder = false;

    this.heapSnapshotRow.rowType = TraceRow.ROW_TYPE_HEAP_SNAPSHOT;
    this.heapSnapshotRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    this.heapSnapshotRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.heapSnapshotRow.setAttribute('children', '');
    this.heapSnapshotRow!.focusHandler = (): void => {
      this.trace?.displayTip(
        this.heapSnapshotRow!,
        HeapSnapshotStruct.hoverSnapshotStruct,
        `<span>Name: ${HeapSnapshotStruct.hoverSnapshotStruct?.name || ''}</span>
            <span>Size: ${Utils.getBinaryByteWithUnit(HeapSnapshotStruct.hoverSnapshotStruct?.size || 0)}</span>`
      );
    };
    this.heapSnapshotRow!.findHoverStruct = (): void => {
      HeapSnapshotStruct.hoverSnapshotStruct = this.heapSnapshotRow!.getHoverStruct();
    };
    this.folderRow!.addChildTraceRow(this.heapSnapshotRow);
  }

  private heapLineThreadHandler(samples: HeapSample[]): void {
    this.heapTimelineRow!.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (this.heapTimelineRow?.currentContext) {
        context = this.heapTimelineRow!.currentContext;
      } else {
        context = this.heapTimelineRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      this.heapTimelineRow!.canvasSave(context);
      (renders['heap-timeline'] as HeapTimelineRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'heap-timeline',
          samples: samples,
        },
        this.heapTimelineRow!
      );
      this.heapTimelineRow!.canvasRestore(context, this.trace);
    };
  }

  private heapSnapshotThreadHandler(): void {
    this.heapSnapshotRow!.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (this.heapSnapshotRow?.currentContext) {
        context = this.heapSnapshotRow!.currentContext;
      } else {
        context = this.heapSnapshotRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      this.heapSnapshotRow!.canvasSave(context);
      (renders['heap-snapshot'] as HeapSnapshotRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'heap-snapshot',
        },
        this.heapSnapshotRow!
      );
      this.heapSnapshotRow!.canvasRestore(context, this.trace);
    };
  }

  public async parseDone(fileModule: Array<FileInfo>): Promise<void> {
    if (fileModule.length > 0) {
      let heapFile = HeapDataInterface.getInstance().getFileStructs();
      let file = heapFile[0];
      this.trace.snapshotFile = file;
      if (file.type === TYPE_TIMELINE) {
        let samples = HeapDataInterface.getInstance().getSamples(file.id);
        this.heapTimelineRow!.rowId = `heaptimeline${file.id}`; // @ts-ignore
        this.heapTimelineRow!.supplierFrame = (): Promise<unknown> =>
          new Promise<unknown>((resolve) => resolve(samples));
        this.heapLineThreadHandler(samples);
      } else if (file.type === TYPE_SNAPSHOT) {
        // @ts-ignore
        this.heapSnapshotRow!.supplierFrame = (): Promise<Array<unknown>> =>
          new Promise<Array<unknown>>((resolve) => resolve(heapFile));
        this.heapSnapshotThreadHandler();
      }
    }
  }

  private initJsCpuChart = async (): Promise<void> => {
    this.jsCpuProfilerRow = TraceRow.skeleton<JsCpuProfilerStruct>();
    this.jsCpuProfilerRow.rowParentId = this.process;
    this.jsCpuProfilerRow.rowHidden = !this.folderRow!.expansion;
    this.jsCpuProfilerRow.name = 'CpuProfiler';
    this.jsCpuProfilerRow.rowId = 'JsCpuProfiler';
    this.jsCpuProfilerRow.folder = false;
    this.jsCpuProfilerRow.rowType = TraceRow.ROW_TYPE_JS_CPU_PROFILER;
    this.jsCpuProfilerRow!.style.height = '40px';
    this.jsCpuProfilerRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    this.jsCpuProfilerRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.jsCpuProfilerRow.setAttribute('children', '');
    this.jsCpuProfilerRow.focusHandler = (): void => {
      this.trace?.displayTip(
        this.jsCpuProfilerRow!,
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct,
        `<span style='font-weight: bold;'>Name: </span>
        <span>${JsCpuProfilerStruct.hoverJsCpuProfilerStruct?.name || ''}</span><br>
        <span style='font-weight: bold;'>Self Time: </span>
        <span>${ns2s(JsCpuProfilerStruct.hoverJsCpuProfilerStruct?.selfTime || 0)}</span><br>
        <span style='font-weight: bold;'>Total Time: </span>
        <span>${ns2s(JsCpuProfilerStruct.hoverJsCpuProfilerStruct?.totalTime || 0)}</span><br>
        <span style='font-weight: bold;'>Url: </span>
        <span>${JsCpuProfilerStruct.hoverJsCpuProfilerStruct?.url || 0}</span>`
      );
    };
    this.jsCpuProfilerRow!.findHoverStruct = (): void => {
      JsCpuProfilerStruct.hoverJsCpuProfilerStruct = this.jsCpuProfilerRow!.getHoverStruct();
    };
    this.jsCpuProfilerRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (this.jsCpuProfilerRow?.currentContext) {
        context = this.jsCpuProfilerRow!.currentContext;
      } else {
        context = this.jsCpuProfilerRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      this.jsCpuProfilerRow!.canvasSave(context);
      (renders['js-cpu-profiler'] as JsCpuProfilerRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'js-cpu-profiler',
        },
        this.jsCpuProfilerRow!
      );
      this.jsCpuProfilerRow!.canvasRestore(context, this.trace);
    };
    this.folderRow!.addChildTraceRow(this.jsCpuProfilerRow);
  };
}
