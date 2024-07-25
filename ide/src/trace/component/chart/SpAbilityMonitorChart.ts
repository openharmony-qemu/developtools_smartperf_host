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
import { info } from '../../../log/Log';
import { TraceRow } from '../trace/base/TraceRow';
import { Utils } from '../trace/base/Utils';
import { type EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { type ProcessStruct } from '../../database/ui-worker/ProcedureWorkerProcess';
import { CpuAbilityMonitorStruct, CpuAbilityRender } from '../../database/ui-worker/ProcedureWorkerCpuAbility';
import { MemoryAbilityMonitorStruct, MemoryAbilityRender } from '../../database/ui-worker/ProcedureWorkerMemoryAbility';
import { DiskAbilityMonitorStruct, DiskIoAbilityRender } from '../../database/ui-worker/ProcedureWorkerDiskIoAbility';
import {
  NetworkAbilityMonitorStruct,
  NetworkAbilityRender,
} from '../../database/ui-worker/ProcedureWorkerNetworkAbility';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { type SnapshotRender, SnapshotStruct } from '../../database/ui-worker/ProcedureWorkerSnapshot';
import {
  abilityBytesInTraceDataSender,
  abilityBytesReadDataSender,
  abilityMemoryUsedDataSender,
  cpuAbilityUserDataSender,
} from '../../database/data-trafic/AbilityMonitorSender';
import {
  abilityDmaDataSender,
  abilityGpuMemoryDataSender,
  abilityPurgeableDataSender,
} from '../../database/data-trafic/VmTrackerDataSender';
import { MemoryConfig } from '../../bean/MemoryConfig';
import { queryMemoryMaxData } from '../../database/sql/Memory.sql';
import { queryDiskIoMaxData, queryNetWorkMaxData } from '../../database/sql/SqlLite.sql';
import { queryAbilityExits, queryCPuAbilityMaxData, queryPurgeableSysData } from '../../database/sql/Ability.sql';
const networkNameList: Array<string> = ['Bytes In/Sec', 'Bytes Out/Sec', 'Packets In/Sec', 'Packets Out/Sec'];
const memoryNameList: Array<string> = ['MemoryTotal', 'Cached', 'SwapTotal'];
const diskIONameList: Array<string> = ['Bytes Read/Sec', 'Bytes Written/Sec', 'Read Ops/Sec', 'Written Ops/Sec'];
const key = 'abilityMonitor';

export class SpAbilityMonitorChart {
  private trace: SpSystemTrace;
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }
  memoryMath = (maxByte: number): string => {
    let maxByteName = '';
    if (maxByte > 0) {
      maxByteName = Utils.getBinaryKBWithUnit(maxByte);
    }
    return maxByteName;
  };

  diskIOMath = (maxByte: number): string => {
    let maxByteName = '';
    if (maxByte > 0) {
      maxByteName = `${maxByte}KB/S`;
    }
    return maxByteName;
  };

  networkMath = (maxValue: number): string => {
    let maxByteName = '';
    if (maxValue > 0) {
      maxByteName = Utils.getBinaryByteWithUnit(maxValue);
    }
    return maxByteName;
  };

  async init(): Promise<void> {
    let time = new Date().getTime();
    let result = await queryAbilityExits();
    info('Ability Monitor Exits Tables size is: ', result!.length);
    if (result.length <= 0) {
      return;
    }
    let processRow = this.initAbilityRow();
    if (this.hasTable(result, 'trace_cpu_usage')) {
      await this.initCpuAbility(processRow);
    }
    if (this.hasTable(result, 'sys_memory')) {
      await this.initMemoryAbility(processRow);
    }
    if (this.hasTable(result, 'trace_diskio')) {
      await this.initDiskAbility(processRow);
    }
    if (this.hasTable(result, 'trace_network')) {
      await this.initNetworkAbility(processRow);
    }
    // 初始化PurgeableToTal和PurgeablePin泳道图
    let totalDataList = await queryPurgeableSysData(false);
    let pinDataList = await queryPurgeableSysData(true);
    if (totalDataList.length > 0) {
      await this.initPurgeableTotal(processRow);
    }
    if (pinDataList.length > 0) {
      await this.initPurgeablePin(processRow);
    }
    await this.initDmaAbility(processRow);
    await this.initGpuMemoryAbility(processRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the AbilityMonitor data is: ', durTime);
  }

  private hasTable(result: Array<unknown>, tableName: string): boolean {
    // @ts-ignore
    return result.find((o) => {
      // @ts-ignore
      return o.event_name === tableName;
    });
  }

  private initAbilityRow = (): TraceRow<ProcessStruct> => {
    let abilityRow = TraceRow.skeleton<ProcessStruct>();
    abilityRow.rowId = key;
    abilityRow.rowType = TraceRow.ROW_TYPE_MONITOR;
    abilityRow.style.height = '40px';
    abilityRow.rowParentId = '';
    abilityRow.folder = true;
    abilityRow.name = 'Ability Monitor';
    abilityRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    abilityRow.selectChangeHandler = this.trace.selectChangeHandler; // @ts-ignore
    abilityRow.supplier = (): Promise<unknown[]> => new Promise<Array<unknown>>((resolve) => resolve([]));
    abilityRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (abilityRow.currentContext) {
        context = abilityRow.currentContext;
      } else {
        context = abilityRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      abilityRow.canvasSave(context);
      if (abilityRow.expansion) {
        // @ts-ignore
        context?.clearRect(0, 0, abilityRow.frame.width, abilityRow.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: '',
          },
          abilityRow
        );
      }
      abilityRow.canvasRestore(context, this.trace);
    };
    this.trace.rowsEL?.appendChild(abilityRow);
    return abilityRow;
  };

  private initCpuAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    let cpuMaxData = await queryCPuAbilityMaxData();
    let hasTotal = false;
    let hasUserLoad = false;
    let hasSystemLoad = false;
    //@ts-ignore
    let userLoad = cpuMaxData[0].userLoad;
    if (userLoad > 0) {
      hasUserLoad = true;
    } //@ts-ignore
    let systemLoad = cpuMaxData[0].systemLoad;
    if (systemLoad > 0) {
      hasSystemLoad = true;
    } //@ts-ignore
    let totalLoad = cpuMaxData[0].totalLoad;
    if (totalLoad > 0) {
      hasTotal = true;
    }
    let cpuNameList: Array<string> = ['Total', 'User', 'System'];
    this.initTotalMonitorTraceRow(processRow, cpuNameList, hasTotal);
    this.initUserMonitorTraceRow(processRow, cpuNameList, hasUserLoad);
    this.initSysMonitorTraceRow(processRow, cpuNameList, hasSystemLoad);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability Cpu is: ', durTime);
  };

  private initUserMonitorTraceRow(processRow: TraceRow<ProcessStruct>, cpuList: Array<string>, load: boolean): void {
    let userTraceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    userTraceRow.rowParentId = key;
    userTraceRow.rowHidden = !processRow.expansion;
    userTraceRow.rowId = cpuList[1];
    userTraceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    userTraceRow.style.height = '40px';
    userTraceRow.style.width = '100%';
    userTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    userTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    userTraceRow.setAttribute('children', '');
    userTraceRow.name = `CPU ${cpuList[1]} Load`;
    userTraceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(userTraceRow, 'CpuAbilityUserData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    userTraceRow.focusHandler = (ev): void => {
      let monitorCpuTip = `${(CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2)}%`;
      this.trace?.displayTip(
        userTraceRow,
        CpuAbilityMonitorStruct.hoverCpuAbilityStruct,
        `<span>${monitorCpuTip}</span>`
      );
    };
    userTraceRow.findHoverStruct = (): void => {
      CpuAbilityMonitorStruct.hoverCpuAbilityStruct = userTraceRow.getHoverStruct();
    };
    userTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (userTraceRow.currentContext) {
        context = userTraceRow.currentContext;
      } else {
        context = userTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      userTraceRow.canvasSave(context);
      (renders.monitorCpu as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorCpu1',
          maxCpuUtilization: 100,
          maxCpuUtilizationName: load ? '100%' : '0%',
        },
        userTraceRow
      );
      userTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(userTraceRow);
  }

  private initTotalMonitorTraceRow(parent: TraceRow<ProcessStruct>, cpuList: Array<string>, hasTotal: boolean): void {
    let traceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    traceRow.rowParentId = key;
    traceRow.rowHidden = !parent.expansion;
    traceRow.rowId = cpuList[0];
    traceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.style.height = '40px';
    traceRow.style.width = '100%';
    traceRow.setAttribute('children', '');
    traceRow.name = `CPU ${cpuList[0]} Load`;
    traceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(traceRow, 'CpuAbilityMonitorData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    traceRow.focusHandler = (ev): void => {
      let monitorCpuTip = `${(CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2)}'%'`;
      this.trace?.displayTip(traceRow, CpuAbilityMonitorStruct.hoverCpuAbilityStruct, `<span>${monitorCpuTip}</span>`);
    };
    traceRow.findHoverStruct = (): void => {
      CpuAbilityMonitorStruct.hoverCpuAbilityStruct = traceRow.getHoverStruct();
    };
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.monitorCpu as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorCpu0',
          maxCpuUtilization: 100,
          maxCpuUtilizationName: hasTotal ? '100%' : '0%',
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    parent.addChildTraceRow(traceRow);
  }

  private initSysMonitorTraceRow(parent: TraceRow<ProcessStruct>, cpuList: Array<string>, hasLoad: boolean): void {
    let sysTraceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    sysTraceRow.rowParentId = key;
    sysTraceRow.rowHidden = !parent.expansion;
    sysTraceRow.rowId = cpuList[2];
    sysTraceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    sysTraceRow.style.height = '40px';
    sysTraceRow.style.width = '100%';
    sysTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    sysTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    sysTraceRow.setAttribute('children', '');
    sysTraceRow.name = `CPU ${cpuList[2]} Load`;
    sysTraceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(sysTraceRow, 'CpuAbilitySystemData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    sysTraceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        sysTraceRow,
        CpuAbilityMonitorStruct.hoverCpuAbilityStruct,
        `<span>${(CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2)}%</span>`
      );
    };
    sysTraceRow.findHoverStruct = (): void => {
      CpuAbilityMonitorStruct.hoverCpuAbilityStruct = sysTraceRow.getHoverStruct();
    };
    sysTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (sysTraceRow.currentContext) {
        context = sysTraceRow.currentContext;
      } else {
        context = sysTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      sysTraceRow.canvasSave(context);
      (renders.monitorCpu as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorCpu2',
          maxCpuUtilization: 100,
          maxCpuUtilizationName: hasLoad ? '100%' : '0%',
        },
        sysTraceRow
      );
      sysTraceRow.canvasRestore(context, this.trace);
    };
    parent.addChildTraceRow(sysTraceRow);
  }

  private memoryUsedThreadHandle(memoryUsedRow: TraceRow<MemoryAbilityMonitorStruct>, memoryTotal: unknown[]): void {
    // @ts-ignore
    let memoryTotalValue = memoryTotal[0].maxValue;
    let memoryTotalValueName = this.memoryMath(memoryTotalValue);
    memoryUsedRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (memoryUsedRow.currentContext) {
        context = memoryUsedRow.currentContext;
      } else {
        context = memoryUsedRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      memoryUsedRow.canvasSave(context);
      (renders.monitorMemory as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorMemory0',
          maxMemoryByte: memoryTotalValue,
          maxMemoryByteName: memoryTotalValueName,
        },
        memoryUsedRow
      );
      memoryUsedRow.canvasRestore(context, this.trace);
    };
  }

  private async initMemoryUsedRow(
    memoryUsedRow: TraceRow<MemoryAbilityMonitorStruct>, // @ts-ignore
    parent: TraceRow<unknown>
  ): Promise<void> {
    let memoryTotal = await queryMemoryMaxData('sys.mem.total');
    //@ts-ignore
    let memoryTotalId = memoryTotal[0].filter_id;

    memoryUsedRow.rowParentId = key;
    memoryUsedRow.rowHidden = !parent.expansion;
    memoryUsedRow.rowId = memoryNameList[0];
    memoryUsedRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    memoryUsedRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    memoryUsedRow.selectChangeHandler = this.trace.selectChangeHandler;
    memoryUsedRow.style.height = '40px';
    memoryUsedRow.style.width = '100%';
    memoryUsedRow.setAttribute('children', '');
    memoryUsedRow.name = memoryNameList[0];
    memoryUsedRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> => {
      return abilityMemoryUsedDataSender(memoryTotalId, memoryUsedRow).then((res): MemoryAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    };
    memoryUsedRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        memoryUsedRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    memoryUsedRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = memoryUsedRow.getHoverStruct();
    };
    this.memoryUsedThreadHandle(memoryUsedRow, memoryTotal);
  }

  private cachedThreadHandler(cachedFilesTraceRow: TraceRow<MemoryAbilityMonitorStruct>, cached: unknown[]): void {
    // @ts-ignore
    let cachedValue = cached[0].maxValue;
    let cachedValueName = this.memoryMath(cachedValue);
    cachedFilesTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (cachedFilesTraceRow.currentContext) {
        context = cachedFilesTraceRow.currentContext;
      } else {
        context = cachedFilesTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      cachedFilesTraceRow.canvasSave(context);
      (renders.monitorMemory as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorMemory1',
          maxMemoryByte: cachedValue,
          maxMemoryByteName: cachedValueName,
        },
        cachedFilesTraceRow
      );
      cachedFilesTraceRow.canvasRestore(context, this.trace);
    };
  }

  private async initCachedRow(
    cachedFilesRow: TraceRow<MemoryAbilityMonitorStruct>, // @ts-ignore
    parent: TraceRow<unknown>
  ): Promise<void> {
    let cached = await queryMemoryMaxData('sys.mem.cached');

    //@ts-ignore
    let cachedId = cached[0].filter_id;
    cachedFilesRow.rowParentId = key;
    cachedFilesRow.rowHidden = !parent.expansion;
    cachedFilesRow.rowId = memoryNameList[1];
    cachedFilesRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    cachedFilesRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    cachedFilesRow.selectChangeHandler = this.trace.selectChangeHandler;
    cachedFilesRow.style.height = '40px';
    cachedFilesRow.style.width = '100%';
    cachedFilesRow.setAttribute('children', '');
    cachedFilesRow.name = memoryNameList[1];
    cachedFilesRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> =>
      abilityMemoryUsedDataSender(cachedId, cachedFilesRow).then((res): MemoryAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    cachedFilesRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        cachedFilesRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    cachedFilesRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = cachedFilesRow.getHoverStruct();
    };
    this.cachedThreadHandler(cachedFilesRow, cached);
  }

  private compressThreadHandler(compressedRow: TraceRow<MemoryAbilityMonitorStruct>, swap: unknown[]): void {
    // @ts-ignore
    let swapValue = swap[0].maxValue;
    let swapValueName = this.memoryMath(swapValue);
    compressedRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (compressedRow.currentContext) {
        context = compressedRow.currentContext;
      } else {
        context = compressedRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      compressedRow.canvasSave(context);
      (renders.monitorMemory as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorMemory2',
          maxMemoryByte: swapValue,
          maxMemoryByteName: swapValueName,
        },
        compressedRow
      );
      compressedRow.canvasRestore(context, this.trace);
    };
  }

  private async initCompressedRow(
    compressedRow: TraceRow<MemoryAbilityMonitorStruct>, // @ts-ignore
    parent: TraceRow<unknown>
  ): Promise<void> {
    let swap = await queryMemoryMaxData('sys.mem.swap.total');
    //@ts-ignore
    let swapId = swap[0].filter_id;
    compressedRow.rowParentId = key;
    compressedRow.rowHidden = !parent.expansion;
    compressedRow.rowId = memoryNameList[2];
    compressedRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    compressedRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    compressedRow.selectChangeHandler = this.trace.selectChangeHandler;
    compressedRow.style.height = '40px';
    compressedRow.style.width = '100%';
    compressedRow.setAttribute('children', '');
    compressedRow.name = memoryNameList[2];
    compressedRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> =>
      abilityMemoryUsedDataSender(swapId, compressedRow).then((res): MemoryAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    compressedRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        compressedRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    compressedRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = compressedRow.getHoverStruct();
    };
    this.compressThreadHandler(compressedRow, swap);
  }

  private initMemoryAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    // sys.mem.total  sys.mem.cached  sys.mem.swap.total
    let memoryUsedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    this.initMemoryUsedRow(memoryUsedTraceRow, processRow);
    processRow.addChildTraceRow(memoryUsedTraceRow);

    let cachedFilesTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    this.initCachedRow(cachedFilesTraceRow, processRow);
    processRow.addChildTraceRow(cachedFilesTraceRow);

    let compressedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    this.initCompressedRow(compressedTraceRow, processRow);
    processRow.addChildTraceRow(compressedTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability Memory is: ', durTime);
  };

  private bytesReadThreadHandler(bytesReadRow: TraceRow<DiskAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxBytesRead = maxList[0].bytesRead;
    let maxBytesReadName = this.diskIOMath(maxBytesRead);
    bytesReadRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesReadRow.currentContext) {
        context = bytesReadRow.currentContext;
      } else {
        context = bytesReadRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesReadRow.canvasSave(context);
      (renders.monitorDiskIo as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorDiskIo0',
          maxDiskRate: maxBytesRead,
          maxDiskRateName: maxBytesReadName,
        },
        bytesReadRow
      );
      bytesReadRow.canvasRestore(context, this.trace);
    };
  }

  private initBytesReadRow(
    bytesReadRow: TraceRow<DiskAbilityMonitorStruct>, // @ts-ignore
    parentRow: TraceRow<unknown>,
    maxList: unknown[]
  ): void {
    bytesReadRow.rowParentId = key;
    bytesReadRow.rowHidden = !parentRow.expansion;
    bytesReadRow.rowId = diskIONameList[0];
    bytesReadRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    bytesReadRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesReadRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesReadRow.style.height = '40px';
    bytesReadRow.style.width = '100%';
    bytesReadRow.setAttribute('children', '');
    bytesReadRow.name = `Disk ${diskIONameList[0]}`;
    bytesReadRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(bytesReadRow, 'AbilityBytesReadData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    bytesReadRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesReadRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    bytesReadRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = bytesReadRow.getHoverStruct();
    };
    this.bytesReadThreadHandler(bytesReadRow, maxList);
  }
  private bytesWriteThreadHandler(bytesWriteRow: TraceRow<DiskAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxBytesWrite = maxList[0].bytesWrite;
    let maxBytesWriteName = this.diskIOMath(maxBytesWrite);
    bytesWriteRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesWriteRow.currentContext) {
        context = bytesWriteRow.currentContext;
      } else {
        context = bytesWriteRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesWriteRow.canvasSave(context);
      (renders.monitorDiskIo as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorDiskIo1',
          maxDiskRate: maxBytesWrite,
          maxDiskRateName: maxBytesWriteName,
        },
        bytesWriteRow
      );
      bytesWriteRow.canvasRestore(context, this.trace);
    };
  }

  private initBytesWriteRow(
    bytesWriteRow: TraceRow<DiskAbilityMonitorStruct>, // @ts-ignore
    parent: TraceRow<unknown>,
    maxList: unknown[]
  ): void {
    bytesWriteRow.rowParentId = key;
    bytesWriteRow.rowHidden = !parent.expansion;
    bytesWriteRow.rowId = diskIONameList[1];
    bytesWriteRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    bytesWriteRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesWriteRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesWriteRow.style.height = '40px';
    bytesWriteRow.style.width = '100%';
    bytesWriteRow.setAttribute('children', '');
    bytesWriteRow.name = `Disk ${diskIONameList[1]}`;
    bytesWriteRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(bytesWriteRow, 'AbilityBytesWrittenData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    bytesWriteRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesWriteRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    bytesWriteRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = bytesWriteRow.getHoverStruct();
    };
    this.bytesWriteThreadHandler(bytesWriteRow, maxList);
  }

  private initReadOspRow(
    readOpsRow: TraceRow<DiskAbilityMonitorStruct>,
    // @ts-ignore
    parent: TraceRow<unknown>,
    maxList: unknown[]
  ): void {
    // @ts-ignore
    let maxReadOps = maxList[0].readOps;
    let maxReadOpsName = this.diskIOMath(maxReadOps);
    readOpsRow.rowParentId = key;
    readOpsRow.rowHidden = !parent.expansion;
    readOpsRow.rowId = diskIONameList[2];
    readOpsRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    readOpsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    readOpsRow.selectChangeHandler = this.trace.selectChangeHandler;
    readOpsRow.style.height = '40px';
    readOpsRow.style.width = '100%';
    readOpsRow.setAttribute('children', '');
    readOpsRow.name = `Disk ${diskIONameList[2]}`;
    readOpsRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(readOpsRow, 'AbilityReadOpsData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    readOpsRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        readOpsRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    readOpsRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = readOpsRow.getHoverStruct();
    };
    readOpsRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (readOpsRow.currentContext) {
        context = readOpsRow.currentContext;
      } else {
        context = readOpsRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      readOpsRow.canvasSave(context);
      (renders.monitorDiskIo as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorDiskIo2',
          maxDiskRate: maxReadOps,
          maxDiskRateName: maxReadOpsName,
        },
        readOpsRow
      );
      readOpsRow.canvasRestore(context, this.trace);
    };
  }

  private writeOspThreadHandler(writeOpsRow: TraceRow<DiskAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxWriteOps = maxList[0].writeOps;
    let maxWriteOpsName = this.diskIOMath(maxWriteOps);
    writeOpsRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (writeOpsRow.currentContext) {
        context = writeOpsRow.currentContext;
      } else {
        context = writeOpsRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      writeOpsRow.canvasSave(context);
      (renders.monitorDiskIo as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorDiskIo3',
          maxDiskRate: maxWriteOps,
          maxDiskRateName: maxWriteOpsName,
        },
        writeOpsRow
      );
      writeOpsRow.canvasRestore(context, this.trace);
    };
  }

  private initWriteOspRow(
    writeOpsRow: TraceRow<DiskAbilityMonitorStruct>, // @ts-ignore
    parent: TraceRow<unknown>,
    maxList: unknown[]
  ): void {
    writeOpsRow.rowParentId = key;
    writeOpsRow.rowHidden = !parent.expansion;
    writeOpsRow.rowId = diskIONameList[3];
    writeOpsRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    writeOpsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    writeOpsRow.selectChangeHandler = this.trace.selectChangeHandler;
    writeOpsRow.style.height = '40px';
    writeOpsRow.style.width = '100%';
    writeOpsRow.setAttribute('children', '');
    writeOpsRow.name = `Disk ${diskIONameList[3]}`;
    writeOpsRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(writeOpsRow, 'AbilityWrittenOpsData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    writeOpsRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        writeOpsRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    writeOpsRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = writeOpsRow.getHoverStruct();
    };
    this.writeOspThreadHandler(writeOpsRow, maxList);
  }
  private initDiskAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    let maxList = await queryDiskIoMaxData();

    let bytesReadTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    this.initBytesReadRow(bytesReadTraceRow, processRow, maxList);
    processRow.addChildTraceRow(bytesReadTraceRow);

    let bytesWrittenTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    this.initBytesWriteRow(bytesWrittenTraceRow, processRow, maxList);
    processRow.addChildTraceRow(bytesWrittenTraceRow);

    let readOpsTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    this.initReadOspRow(readOpsTraceRow, processRow, maxList);
    processRow.addChildTraceRow(readOpsTraceRow);

    let writtenOpsTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    this.initWriteOspRow(writtenOpsTraceRow, processRow, maxList);
    processRow.addChildTraceRow(writtenOpsTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability DiskIO is: ', durTime);
  };

  private bytesInRowThreadHandler(row: TraceRow<NetworkAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxBytesIn = maxList[0].maxIn;
    let maxInByteName = this.networkMath(maxBytesIn);
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.monitorNetwork as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorNetwork0',
          maxNetworkRate: maxBytesIn,
          maxNetworkRateName: maxInByteName,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  private initBytesInRow(
    row: TraceRow<NetworkAbilityMonitorStruct>,
    parent: TraceRow<ProcessStruct>,
    maxList: unknown[]
  ): void {
    row.rowParentId = key;
    row.rowHidden = !parent.expansion;
    row.rowId = networkNameList[0];
    row.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    row.selectChangeHandler = this.trace.selectChangeHandler;
    row.style.height = '40px';
    row.style.width = '100%';
    row.setAttribute('children', '');
    row.name = `Network ${networkNameList[0]}`;
    row.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(row, 'AbilityBytesInTraceData').then((res): NetworkAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    row.focusHandler = (ev): void => {
      this.trace?.displayTip(
        row,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    row.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = row.getHoverStruct();
    };
    this.bytesInRowThreadHandler(row, maxList);
  }
  private bytesOutRowThreadHandler(row: TraceRow<NetworkAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxBytesOut = maxList[0].maxOut;
    let maxOutByteName = this.networkMath(maxBytesOut);
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.monitorNetwork as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorNetwork1',
          maxNetworkRate: maxBytesOut,
          maxNetworkRateName: maxOutByteName,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  private initBytesOutRow(
    row: TraceRow<NetworkAbilityMonitorStruct>,
    parent: TraceRow<ProcessStruct>,
    maxList: unknown[]
  ): void {
    row.rowParentId = key;
    row.rowHidden = !parent.expansion;
    row.rowId = networkNameList[1];
    row.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    row.selectChangeHandler = this.trace.selectChangeHandler;
    row.style.height = '40px';
    row.style.width = '100%';
    row.setAttribute('children', '');
    row.name = `Network ${networkNameList[1]}`;
    row.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(row, 'AbilityBytesOutTraceData').then((res): NetworkAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    row.focusHandler = (ev): void => {
      this.trace?.displayTip(
        row,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    row.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = row.getHoverStruct();
    };
    this.bytesOutRowThreadHandler(row, maxList);
  }

  private packetInRowThreadHandler(row: TraceRow<NetworkAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxPacketIn = maxList[0].maxPacketIn;
    let maxInPacketName = this.networkMath(maxPacketIn);
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.monitorNetwork as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorNetwork-Packet2',
          maxNetworkRate: maxPacketIn,
          maxNetworkRateName: maxInPacketName,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  private initPacketInRow(
    row: TraceRow<NetworkAbilityMonitorStruct>,
    parent: TraceRow<ProcessStruct>,
    maxList: unknown[]
  ): void {
    row.rowParentId = key;
    row.rowHidden = !parent.expansion;
    row.rowId = networkNameList[2];
    row.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    row.selectChangeHandler = this.trace.selectChangeHandler;
    row.style.height = '40px';
    row.style.width = '100%';
    row.setAttribute('children', '');
    row.name = `Network ${networkNameList[2]}`;
    row.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(row, 'AbilityPacketInTraceData').then((res): NetworkAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    row.focusHandler = (ev): void => {
      this.trace?.displayTip(
        row,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    row.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = row.getHoverStruct();
    };
    this.packetInRowThreadHandler(row, maxList);
  }

  private packetOutRowThreadHandler(row: TraceRow<NetworkAbilityMonitorStruct>, maxList: unknown[]): void {
    // @ts-ignore
    let maxPacketOut = maxList[0].maxPacketOut;
    let maxOutPacketName = this.networkMath(maxPacketOut);
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.monitorNetwork as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'monitorNetwork3',
          maxNetworkRate: maxPacketOut,
          maxNetworkRateName: maxOutPacketName,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  private initPacketOutRow(
    row: TraceRow<NetworkAbilityMonitorStruct>,
    parent: TraceRow<ProcessStruct>,
    maxList: unknown[]
  ): void {
    row.rowParentId = key;
    row.rowHidden = !parent.expansion;
    row.rowId = networkNameList[3];
    row.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    row.selectChangeHandler = this.trace.selectChangeHandler;
    row.style.height = '40px';
    row.style.width = '100%';
    row.setAttribute('children', '');
    row.name = `Network ${networkNameList[3]}`;
    row.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(row, 'AbilityPacketsOutTraceData').then((res): NetworkAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    row.focusHandler = (ev): void => {
      if (NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct) {
        this.trace?.displayTip(
          row,
          NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
          `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct!.value!)}</span>`
        );
      }
    };
    row.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = row.getHoverStruct();
    };
    this.packetOutRowThreadHandler(row, maxList);
  }
  private initNetworkAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    let maxList = await queryNetWorkMaxData();
    let bytesInTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    this.initBytesInRow(bytesInTraceRow, processRow, maxList);
    processRow.addChildTraceRow(bytesInTraceRow);

    let bytesOutTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    this.initBytesOutRow(bytesOutTraceRow, processRow, maxList);
    processRow.addChildTraceRow(bytesOutTraceRow);
    let packetInTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    this.initPacketInRow(packetInTraceRow, processRow, maxList);
    processRow.addChildTraceRow(packetInTraceRow);
    let packetOutTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    this.initPacketOutRow(packetOutTraceRow, processRow, maxList);
    processRow.addChildTraceRow(packetOutTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability Network is: ', durTime);
  };

  private async initPurgeableTotal(processRow: TraceRow<ProcessStruct>): Promise<void> {
    let snapshotDur = MemoryConfig.getInstance().snapshotDur;
    let totalTraceRow = this.initTraceRow(
      'System Purgeable Total',
      'Purgeable Total',
      TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY,
      processRow
    ); // @ts-ignore
    totalTraceRow.supplierFrame = (): Promise<unknown[]> =>
      new Promise<Array<unknown>>((resolve): void =>
        resolve(
          abilityPurgeableDataSender(totalTraceRow, snapshotDur, false).then((res: unknown[]) => {
            this.setName(res);
            return res;
          })
        )
      );
    processRow.addChildTraceRow(totalTraceRow);
  }

  private async initPurgeablePin(processRow: TraceRow<ProcessStruct>): Promise<void> {
    let snapshotDur = MemoryConfig.getInstance().snapshotDur;
    let pinTraceRow = this.initTraceRow(
      'System Purgeable Pin',
      'Purgeable Pin',
      TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY,
      processRow
    ); // @ts-ignore
    pinTraceRow.supplierFrame = (): Promise<unknown[]> =>
      new Promise<Array<unknown>>((resolve): void =>
        resolve(
          abilityPurgeableDataSender(pinTraceRow, snapshotDur, true).then((res: unknown[]) => {
            this.setName(res);
            return res;
          })
        )
      );
    processRow.addChildTraceRow(pinTraceRow);
  }

  /**
   * DMA
   * @param processRow
   */
  private initDmaAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let snapshotDur = MemoryConfig.getInstance().snapshotDur;
    let dmaTraceRow = this.initTraceRow('abilityMonitorDma', 'DMA', TraceRow.ROW_TYPE_DMA_ABILITY, processRow); // @ts-ignore
    dmaTraceRow.supplierFrame = (): Promise<unknown[]> =>
      new Promise<Array<unknown>>((resolve): void =>
        resolve(
          abilityDmaDataSender(dmaTraceRow, snapshotDur).then((res: unknown[]) => {
            this.setName(res);
            return res;
          })
        )
      );
    processRow.addChildTraceRow(dmaTraceRow);
  };

  /**
   * Skia Gpu Memory
   * @param processRow
   */
  private initGpuMemoryAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let snapshotDur = MemoryConfig.getInstance().snapshotDur;
    let gpuMemoryTraceRow = this.initTraceRow(
      'abilityMonitorGpuMemory',
      'Skia Gpu Memory',
      TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY,
      processRow
    ); // @ts-ignore
    gpuMemoryTraceRow.supplierFrame = (): Promise<unknown[]> =>
      new Promise<Array<unknown>>((resolve): void =>
        resolve(
          abilityGpuMemoryDataSender(gpuMemoryTraceRow, snapshotDur).then((res: unknown[]) => {
            this.setName(res);
            return res;
          })
        )
      );
    processRow.addChildTraceRow(gpuMemoryTraceRow);
  };

  private initTraceRow(
    rowId: string,
    rowName: string,
    type: string,
    processRow: TraceRow<ProcessStruct>
  ): TraceRow<SnapshotStruct> {
    let abilityMonitor = TraceRow.skeleton<SnapshotStruct>();
    abilityMonitor.rowParentId = key;
    abilityMonitor.rowHidden = !processRow.expansion;
    abilityMonitor.rowId = rowId;
    abilityMonitor.rowType = type;
    abilityMonitor.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    abilityMonitor.selectChangeHandler = this.trace.selectChangeHandler;
    abilityMonitor.style.height = '40px';
    abilityMonitor.style.width = '100%';
    abilityMonitor.setAttribute('children', '');
    abilityMonitor.name = rowName;
    abilityMonitor.addTemplateTypes('Memory');
    abilityMonitor.focusHandler = (): void => {
      this.showTip(abilityMonitor);
    };
    abilityMonitor.findHoverStruct = (): void => {
      SnapshotStruct.hoverSnapshotStruct = abilityMonitor.getHoverStruct();
    };
    abilityMonitor.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (abilityMonitor.currentContext) {
        context = abilityMonitor.currentContext;
      } else {
        context = abilityMonitor.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      abilityMonitor.canvasSave(context);
      (renders.snapshot as SnapshotRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'snapshot',
        },
        abilityMonitor
      );
      abilityMonitor.canvasRestore(context, this.trace);
    };
    return abilityMonitor;
  }

  private showTip(traceRow: TraceRow<SnapshotStruct>): void {
    this.trace?.displayTip(
      traceRow,
      SnapshotStruct.hoverSnapshotStruct,
      `<span>Name: ${SnapshotStruct.hoverSnapshotStruct?.name || ''}</span>
      <span>Size: ${Utils.getBinaryByteWithUnit(SnapshotStruct.hoverSnapshotStruct?.value || 0)}</span>`
    );
  }

  private setName(data: Array<unknown>): void {
    if (data.length > 0) {
      data.forEach((item, index) => {
        // @ts-ignore
        item.name = `SnapShot ${index}`;
      });
    }
  }

  private computeDur(list: Array<unknown>): void {
    let endNS = TraceRow.range?.endNS || 0;
    list.forEach((it, i) => {
      if (i === list.length - 1) {
        // @ts-ignore
        it.dur = (endNS || 0) - (it.startNS || 0);
      } else {
        // @ts-ignore
        it.dur = (list[i + 1].startNS || 0) - (it.startNS || 0);
      }
    });
  }
}
