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
import { info } from '../../../log/Log';
import { procedurePool } from '../../database/Procedure';
import { type NativeEventHeap } from '../../bean/NativeHook';
import { HeapRender, HeapStruct } from '../../database/ui-worker/ProcedureWorkerHeap';
import { Utils } from '../trace/base/Utils';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { type BaseStruct } from '../../bean/BaseStruct';
import {
  MemoryBasicType,
  MemoryStatisticType,
  MemoryTableName,
  MemoryTraceRowType,
  MemoryType,
  NATIVE_MEMORY_HEAP_INDICES,
  NATIVE_MEMORY_ANONYMOUS_VM_INDICES,
  NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX,
  NATIVE_MEMORY_ALL_HEAP_IDX
} from '../../bean/MemoryEnum';
import {
  nativeMemoryChartDataCacheSender,
  nativeMemoryChartDataSender,
} from '../../database/data-trafic/NativeMemoryDataSender';
import { queryNativeHookProcess, queryNativeType, queryStatisticType } from '../../database/sql/NativeHook.sql';
import { queryHeapGroupByEvent } from '../../database/sql/SqlLite.sql';
import { queryNativeMemoryRealTime } from '../../database/sql/Memory.sql';
import { queryBootTime } from '../../database/sql/Clock.sql';
import { SpOtherSourceChart } from './SpOtherSourceChart';
import { SpGpuMemoryChart } from './SpGpuMemoryChart';

export class SpNativeMemoryChart {
  static EVENT_HEAP: Array<NativeEventHeap> = [];
  static REAL_TIME_DIF: number = 0;
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
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
          type: 'heap',
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  initNativeMemoryFolder(process: number, ipid: number): TraceRow<BaseStruct> {
    const nativeRow = TraceRow.skeleton();
    nativeRow.rowId = `native-memory ${process} ${ipid}`;
    nativeRow.index = 0;
    nativeRow.rowType = TraceRow.ROW_TYPE_NATIVE_MEMORY;
    nativeRow.drawType = 0;
    nativeRow.style.height = '40px';
    nativeRow.rowParentId = '';
    nativeRow.folder = true;
    nativeRow.addTemplateTypes('NativeMemory', 'Memory');
    nativeRow.name = `Native Memory (${process})`;
    nativeRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    nativeRow.selectChangeHandler = this.trace.selectChangeHandler;
    nativeRow.addRowSettingPop();
    nativeRow.rowSetting = 'enable';
    nativeRow.rowSettingPopoverDirection = 'bottomLeft';
    // 大小跟分配次数配置
    nativeRow.rowSettingList = [
      {
        key: '0',
        title: 'Current Bytes',
        checked: true,
      },
      {
        key: '1',
        title: 'Native Memory Density',
      },
    ];
    // 泳道图显示方式切换
    nativeRow.onRowSettingChangeHandler = (value): void => {
      nativeRow.childrenList.forEach((row) => (row.drawType = parseInt(value[0])));
      this.trace
        .getCollectRows((row) => row.rowType === 'heap')
        .forEach((it) => {
          it.drawType = parseInt(value[0]);
        });
      this.trace.refreshCanvas(false);
    };
    nativeRow.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    this.folderThreadHandler(nativeRow);
    this.trace.rowsEL?.appendChild(nativeRow);
    return nativeRow;
  }

  initAllocMapChart(folder: TraceRow<BaseStruct>, type: string, process: { pid: number; ipid: number; }): void {
    // 创建总和泳道 (All Heap & Anonymous VM)
    const sumRow = this.createHeapRow(0, MemoryBasicType.NATIVE_MEMORY[0], folder, type, process);
    folder.addChildTraceRow(sumRow);

    // 创建 All Heap 二级泳道组
    const allHeapFolder = TraceRow.skeleton<HeapStruct>();
    allHeapFolder.index = NATIVE_MEMORY_ALL_HEAP_IDX;
    allHeapFolder.rowParentId = `native-memory ${process.pid} ${process.ipid}`;
    allHeapFolder.rowHidden = !folder.expansion;
    allHeapFolder.style.height = '40px';
    allHeapFolder.name = MemoryBasicType.NATIVE_MEMORY[NATIVE_MEMORY_ALL_HEAP_IDX]; // 'All Heap'
    allHeapFolder.rowId = MemoryBasicType.NATIVE_MEMORY[NATIVE_MEMORY_ALL_HEAP_IDX];
    allHeapFolder.folder = true;
    allHeapFolder.rowType = TraceRow.ROW_TYPE_HEAP;
    allHeapFolder.drawType = 0;
    allHeapFolder.isHover = true;
    allHeapFolder.setAttribute('heap-type', type);
    allHeapFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    allHeapFolder.selectChangeHandler = this.trace.selectChangeHandler;
    allHeapFolder.supplier = (): Promise<HeapStruct[]> => new Promise<Array<HeapStruct>>((resolve) => resolve([]));

    // 添加 supplierFrame 和 focusHandler 为 All Heap 泳道组提供聚合数据
    allHeapFolder.focusHandler = (): void => {
      let tip = '';
      if (HeapStruct.hoverHeapStruct) {
        if (allHeapFolder.drawType === 1) {
          tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
        } else {
          tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
        }
      }
      this.trace?.displayTip(allHeapFolder, HeapStruct.hoverHeapStruct, tip);
    };

    allHeapFolder.findHoverStruct = (): void => {
      HeapStruct.hoverHeapStruct = allHeapFolder.getHoverStruct();
    };

    //@ts-ignore
    allHeapFolder.supplierFrame = (): Promise<unknown> => {
      // All Heap 的后缀就是索引值 1
      const suffix = NATIVE_MEMORY_ALL_HEAP_IDX;
      return nativeMemoryChartDataSender(allHeapFolder, {
        memoryType: MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY,
        eventType: suffix,
        ipid: process.ipid,
        model: type,
        drawType: allHeapFolder.drawType,
      });
    };

    this.chartThreadHandler(allHeapFolder);
    folder.addChildTraceRow(allHeapFolder);

    // 创建 All Heap 子泳道 (Native Heap, ArkTs Heap, ArkWeb Heap, RN Heap, KMP Heap)
    for (const idx of NATIVE_MEMORY_HEAP_INDICES) {
      const childRow = this.createHeapRow(idx, MemoryBasicType.NATIVE_MEMORY[idx], allHeapFolder, type, process);
      allHeapFolder.addChildTraceRow(childRow);
    }

    // 创建 All Anonymous VM 二级泳道组
    const allAnonymousVMFolder = TraceRow.skeleton<HeapStruct>();
    allAnonymousVMFolder.index = NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX;
    allAnonymousVMFolder.rowParentId = `native-memory ${process.pid} ${process.ipid}`;
    allAnonymousVMFolder.rowHidden = !folder.expansion;
    allAnonymousVMFolder.style.height = '40px';
    allAnonymousVMFolder.name = MemoryBasicType.NATIVE_MEMORY[NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX]; // 'All Anonymous VM'
    allAnonymousVMFolder.rowId = MemoryBasicType.NATIVE_MEMORY[NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX];
    allAnonymousVMFolder.folder = true;
    allAnonymousVMFolder.rowType = TraceRow.ROW_TYPE_HEAP;
    allAnonymousVMFolder.drawType = 0;
    allAnonymousVMFolder.isHover = true;
    allAnonymousVMFolder.setAttribute('heap-type', type);
    allAnonymousVMFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    allAnonymousVMFolder.selectChangeHandler = this.trace.selectChangeHandler;
    allAnonymousVMFolder.supplier = (): Promise<HeapStruct[]> => new Promise<Array<HeapStruct>>((resolve) => resolve([]));

    // 添加 supplierFrame 和 focusHandler 为 All Anonymous VM 泳道组提供聚合数据
    allAnonymousVMFolder.focusHandler = (): void => {
      let tip = '';
      if (HeapStruct.hoverHeapStruct) {
        if (allAnonymousVMFolder.drawType === 1) {
          tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
        } else {
          tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
        }
      }
      this.trace?.displayTip(allAnonymousVMFolder, HeapStruct.hoverHeapStruct, tip);
    };

    allAnonymousVMFolder.findHoverStruct = (): void => {
      HeapStruct.hoverHeapStruct = allAnonymousVMFolder.getHoverStruct();
    };

    //@ts-ignore
    allAnonymousVMFolder.supplierFrame = (): Promise<unknown> => {
      // All Anonymous VM 的后缀就是索引值 6
      const suffix = NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX;
      return nativeMemoryChartDataSender(allAnonymousVMFolder, {
        memoryType: MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY,
        eventType: suffix,
        ipid: process.ipid,
        model: type,
        drawType: allAnonymousVMFolder.drawType,
      });
    };

    this.chartThreadHandler(allAnonymousVMFolder);
    folder.addChildTraceRow(allAnonymousVMFolder);

    // 创建 All Anonymous VM 子泳道 (VM ION, VM Ashmem, VM SO, VM Others)
    for (const idx of NATIVE_MEMORY_ANONYMOUS_VM_INDICES) {
      const childRow = this.createHeapRow(idx, MemoryBasicType.NATIVE_MEMORY[idx], allAnonymousVMFolder, type, process);
      allAnonymousVMFolder.addChildTraceRow(childRow);
    }
  }

  private createHeapRow(
    index: number,
    name: string,
    parent: TraceRow<BaseStruct>,
    type: string,
    process: { pid: number; ipid: number; }
  ): TraceRow<HeapStruct> {
    const heapRow = TraceRow.skeleton<HeapStruct>();
    heapRow.index = index;
    heapRow.rowParentId = parent.rowId;
    heapRow.rowHidden = !parent.expansion;
    heapRow.style.height = '40px';
    heapRow.name = name;
    heapRow.rowId = name;
    heapRow.drawType = 0;
    heapRow.isHover = true;
    heapRow.folder = false;
    heapRow.rowType = TraceRow.ROW_TYPE_HEAP;
    heapRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    heapRow.selectChangeHandler = this.trace.selectChangeHandler;
    heapRow.setAttribute('heap-type', type);
    heapRow.setAttribute('children', '');
    heapRow.focusHandler = (): void => {
      let tip = '';
      if (HeapStruct.hoverHeapStruct) {
        if (heapRow.drawType === 1) {
          tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
        } else {
          tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
        }
      }
      this.trace?.displayTip(heapRow, HeapStruct.hoverHeapStruct, tip);
    };
    heapRow.findHoverStruct = (): void => {
      HeapStruct.hoverHeapStruct = heapRow.getHoverStruct();
    };
    //@ts-ignore
    heapRow.supplierFrame = (): Promise<unknown> => {
      // 直接使用索引作为后缀
      const suffix = index;
      return nativeMemoryChartDataSender(heapRow, {
        memoryType: MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY,
        eventType: suffix,
        ipid: process.ipid,
        model: type,
        drawType: heapRow.drawType,
      });
    };
    this.chartThreadHandler(heapRow);
    return heapRow;
  }

  initChart = async (): Promise<void> => {
    let time = new Date().getTime();
    const normalTypes = await queryNativeType(MemoryTableName.NATIVE_HOOK);
    const statisticTypes = await queryStatisticType(MemoryTableName.NATIVE_HOOK_STATISTIC);

    const isShowNative = normalTypes.length > 0;
    const isShowStatic = statisticTypes.length > 0;

    if (!isShowNative && !isShowStatic) {
      return;
    }

    const nativeMemoryType = isShowStatic ? MemoryTableName.NATIVE_HOOK_STATISTIC : MemoryTableName.NATIVE_HOOK;

    const nativeProcessResult = await queryNativeHookProcess(nativeMemoryType);

    if (!nativeProcessResult || nativeProcessResult.length === 0) {
      return;
    }

    info('NativeHook Process data size is: ', nativeProcessResult.length);
    // logic中缓存native_hook_frame表数据
    await this.initMemoryFrame();
    //
    await nativeMemoryChartDataCacheSender(
      nativeProcessResult.map((it) => it.ipid),
      nativeMemoryType,
      MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY
    );

    let hasNativeMemory = false;
    let hasGpuMemory = false;
    let hasOtherSource = false;

    if (isShowNative) {
      for (const event of normalTypes) {
        if ([`${MemoryType.MEMORY_M_ALLOC_NAME}`, `${MemoryType.MEMORY_M_MAP_NAME}`,
        `${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.JS_Alloc_NAME}`,
        `${MemoryType.DART_HEAP_Alloc_NAME}`, `${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}`, `${MemoryType.RN_HERMES_HEAP_Alloc_NAME}`, `${MemoryType.KMP_Alloc_NAME}`,
        `${MemoryType.SO_Alloc_NAME}`, `${MemoryType.ASHMEM_Alloc_NAME}`,
        `${MemoryType.ION_Alloc_NAME}`, `${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}`, `${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}`,
        `${MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME}`].includes(event.eventType)) {
          hasNativeMemory = true;
        }
        if ([`${MemoryType.GPU_VK_Alloc_NAME}`, `${MemoryType.GPU_GLES_Alloc_NAME}`, `${MemoryType.GPU_CL_Alloc_NAME}`, `${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}`].includes(event.eventType)) {
          hasGpuMemory = true;
        }
        if ([`${MemoryType.FD_OPEN_NAME}`, `${MemoryType.THREAD_CREATE_NAME}`,].includes(event.eventType)) {
          hasOtherSource = true;
        }
      };
    } else if (isShowStatic) {
      for (const event of statisticTypes) {
        if ([MemoryStatisticType.MALLOC, MemoryStatisticType.MMAP, MemoryStatisticType.FILE_PAGE_MSG, MemoryStatisticType.MEMORY_USING_MSG,
        MemoryStatisticType.ARKTS, MemoryStatisticType.JS, MemoryStatisticType.DART_HEAP, MemoryStatisticType.ARKTS_STATIC_HEAP, MemoryStatisticType.RN, MemoryStatisticType.KMP,
        MemoryStatisticType.SO, MemoryStatisticType.ASHMEM, MemoryStatisticType.DMA, MemoryStatisticType.ARK_GLOBAL_HANDLE, MemoryStatisticType.ARK_LOCAL_HANDLE].includes(event.type)) {
          hasNativeMemory = true;
        } else if ([MemoryStatisticType.GPU_VK, MemoryStatisticType.GPU_GLES, MemoryStatisticType.GPU_CL].includes(event.type)) {
          hasGpuMemory = true;
        } else if ([MemoryStatisticType.FD, MemoryStatisticType.THREAD].includes(event.type)) {
          hasOtherSource = true;
        }
      }
    }

    if (hasNativeMemory) {
      SpNativeMemoryChart.EVENT_HEAP = await queryHeapGroupByEvent(nativeMemoryType);
    }

    // 初始化一次即可
    let gpuMemoryInstance: SpGpuMemoryChart | null = null;
    let otherSourceInstance: SpOtherSourceChart | null = null;

    for (const process of nativeProcessResult) {
      if (hasNativeMemory) {
        const nativeRow = this.initNativeMemoryFolder(process.pid, process.ipid);
        this.initAllocMapChart(nativeRow, nativeMemoryType, process);
      }

      // 确保只初始化一次
      if (hasGpuMemory && !gpuMemoryInstance) {
        gpuMemoryInstance = new SpGpuMemoryChart(this.trace);
        await gpuMemoryInstance.initChart(nativeMemoryType, process);
      }

      if (hasOtherSource && !otherSourceInstance) {
        otherSourceInstance = new SpOtherSourceChart(this.trace);
        await otherSourceInstance.initChart(nativeMemoryType, process);
      }
    }

    let durTime = new Date().getTime() - time;
    info('The time to load the Native Memory data is: ', durTime);
  };

  initMemoryFrame = async (): Promise<void> => {
    let time = new Date().getTime();
    let isRealtime = false;
    let realTimeDif = 0;
    SpNativeMemoryChart.REAL_TIME_DIF = 0;
    let queryTime = await queryNativeMemoryRealTime();
    let bootTime = await queryBootTime();
    if (queryTime.length > 0) {
      //@ts-ignore
      isRealtime = queryTime[0].clock_name === 'realtime';
    }
    if (bootTime.length > 0 && isRealtime) {
      //@ts-ignore
      realTimeDif = queryTime[0].ts - bootTime[0].ts;
      SpNativeMemoryChart.REAL_TIME_DIF = realTimeDif;
    }
    await new Promise<unknown>((resolve) => {
      procedurePool.submitWithName(
        'logic0',
        `${MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY}-init`,
        { isRealtime, realTimeDif },
        undefined,
        (res: unknown) => {
          resolve(res);
        }
      );
    });
    let durTime = new Date().getTime() - time;
    info('The time to init the native memory data is: ', durTime);
  };
}
