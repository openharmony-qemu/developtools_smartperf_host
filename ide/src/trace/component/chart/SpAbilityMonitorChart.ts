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
import {queryMemoryMaxData} from "../../database/sql/Memory.sql";
import {queryDiskIoMaxData, queryNetWorkMaxData} from "../../database/sql/SqlLite.sql";
import {queryAbilityExits, queryCPuAbilityMaxData, queryPurgeableSysData} from "../../database/sql/Ability.sql";
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

  async init() {
    let time = new Date().getTime();
    let result = await queryAbilityExits();
    info('Ability Monitor Exits Tables size is: ', result!.length);
    if (result.length <= 0) return;
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

  private hasTable(result: Array<any>, tableName: string) {
    return result.find((o) => {
      return o.event_name === tableName;
    });
  }

  private initAbilityRow = (): TraceRow<ProcessStruct> => {
    let abilityRow = TraceRow.skeleton<ProcessStruct>();
    abilityRow.rowId = 'abilityMonitor';
    abilityRow.rowType = TraceRow.ROW_TYPE_MONITOR;
    abilityRow.style.height = '40px';
    abilityRow.rowParentId = '';
    abilityRow.folder = true;
    abilityRow.name = 'Ability Monitor';
    abilityRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    abilityRow.selectChangeHandler = this.trace.selectChangeHandler;
    abilityRow.supplier = (): Promise<any[]> => new Promise<Array<any>>((resolve) => resolve([]));
    abilityRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (abilityRow.currentContext) {
        context = abilityRow.currentContext;
      } else {
        context = abilityRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      abilityRow.canvasSave(context);
      if (abilityRow.expansion) {
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
    let userLoad = cpuMaxData[0].userLoad;
    if (userLoad > 0) {
      hasUserLoad = true;
    }
    let systemLoad = cpuMaxData[0].systemLoad;
    if (systemLoad > 0) {
      hasSystemLoad = true;
    }
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

  private initUserMonitorTraceRow(
    processRow: TraceRow<ProcessStruct>,
    cpuNameList: Array<string>,
    hasUserLoad: boolean
  ): void {
    let userTraceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    userTraceRow.rowParentId = `abilityMonitor`;
    userTraceRow.rowHidden = !processRow.expansion;
    userTraceRow.rowId = cpuNameList[1];
    userTraceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    userTraceRow.style.height = '40px';
    userTraceRow.style.width = `100%`;
    userTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    userTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    userTraceRow.setAttribute('children', '');
    userTraceRow.name = `CPU ${cpuNameList[1]} Load`;
    userTraceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(userTraceRow, 'CpuAbilityUserData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    userTraceRow.focusHandler = (ev): void => {
      let monitorCpuTip = (CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2) + '%';
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
      (renders['monitorCpu'] as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorCpu1`,
          maxCpuUtilization: 100,
          maxCpuUtilizationName: hasUserLoad ? '100%' : '0%',
        },
        userTraceRow
      );
      userTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(userTraceRow);
  }

  private initTotalMonitorTraceRow(
    processRow: TraceRow<ProcessStruct>,
    cpuNameList: Array<string>,
    hasTotal: boolean
  ): void {
    let traceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    traceRow.rowParentId = `abilityMonitor`;
    traceRow.rowHidden = !processRow.expansion;
    traceRow.rowId = cpuNameList[0];
    traceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.style.height = '40px';
    traceRow.style.width = `100%`;
    traceRow.setAttribute('children', '');
    traceRow.name = `CPU ${cpuNameList[0]} Load`;
    traceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(traceRow, 'CpuAbilityMonitorData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    traceRow.focusHandler = (ev): void => {
      let monitorCpuTip = (CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2) + '%';
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
      (renders['monitorCpu'] as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorCpu0`,
          maxCpuUtilization: 100,
          maxCpuUtilizationName: hasTotal ? '100%' : '0%',
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(traceRow);
  }

  private initSysMonitorTraceRow(
    processRow: TraceRow<ProcessStruct>,
    cpuNameList: Array<string>,
    hasSystemLoad: boolean
  ): void {
    let sysTraceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    sysTraceRow.rowParentId = `abilityMonitor`;
    sysTraceRow.rowHidden = !processRow.expansion;
    sysTraceRow.rowId = cpuNameList[2];
    sysTraceRow.rowType = TraceRow.ROW_TYPE_CPU_ABILITY;
    sysTraceRow.style.height = '40px';
    sysTraceRow.style.width = `100%`;
    sysTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    sysTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    sysTraceRow.setAttribute('children', '');
    sysTraceRow.name = `CPU ${cpuNameList[2]} Load`;
    sysTraceRow.supplierFrame = (): Promise<CpuAbilityMonitorStruct[]> =>
      cpuAbilityUserDataSender(sysTraceRow, 'CpuAbilitySystemData').then((res): CpuAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    sysTraceRow.focusHandler = (): void => {
      this.trace?.displayTip(sysTraceRow, CpuAbilityMonitorStruct.hoverCpuAbilityStruct,
        `<span>${(CpuAbilityMonitorStruct.hoverCpuAbilityStruct?.value || 0).toFixed(2) + '%'}</span>`);
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
      (renders['monitorCpu'] as CpuAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorCpu2`,
          maxCpuUtilization: 100,
          maxCpuUtilizationName: hasSystemLoad ? '100%' : '0%',
        },
        sysTraceRow
      );
      sysTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(sysTraceRow);
  }

  private initMemoryAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    // sys.mem.total  sys.mem.cached  sys.mem.swap.total
    let memoryNameList: Array<string> = ['MemoryTotal', 'Cached', 'SwapTotal'];
    let memoryTotal = await queryMemoryMaxData('sys.mem.total');
    let memoryTotalValue = memoryTotal[0].maxValue;
    let memoryTotalId = memoryTotal[0].filter_id;
    let memoryTotalValueName = this.memoryMath(memoryTotalValue);
    let memoryUsedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    memoryUsedTraceRow.rowParentId = `abilityMonitor`;
    memoryUsedTraceRow.rowHidden = !processRow.expansion;
    memoryUsedTraceRow.rowId = memoryNameList[0];
    memoryUsedTraceRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    memoryUsedTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    memoryUsedTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    memoryUsedTraceRow.style.height = '40px';
    memoryUsedTraceRow.style.width = `100%`;
    memoryUsedTraceRow.setAttribute('children', '');
    memoryUsedTraceRow.name = memoryNameList[0];
    memoryUsedTraceRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> => {
      return abilityMemoryUsedDataSender(memoryTotalId, memoryUsedTraceRow).then(
        (res): MemoryAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    };
    memoryUsedTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        memoryUsedTraceRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    memoryUsedTraceRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = memoryUsedTraceRow.getHoverStruct();
    };
    memoryUsedTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (memoryUsedTraceRow.currentContext) {
        context = memoryUsedTraceRow.currentContext;
      } else {
        context = memoryUsedTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      memoryUsedTraceRow.canvasSave(context);
      (renders['monitorMemory'] as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorMemory0`,
          maxMemoryByte: memoryTotalValue,
          maxMemoryByteName: memoryTotalValueName,
        },
        memoryUsedTraceRow
      );
      memoryUsedTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(memoryUsedTraceRow);
    let cached = await queryMemoryMaxData('sys.mem.cached');
    let cachedValue = cached[0].maxValue;
    let cachedValueName = this.memoryMath(cachedValue);
    let cachedId = cached[0].filter_id;
    let cachedFilesTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    cachedFilesTraceRow.rowParentId = `abilityMonitor`;
    cachedFilesTraceRow.rowHidden = !processRow.expansion;
    cachedFilesTraceRow.rowId = memoryNameList[1];
    cachedFilesTraceRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    cachedFilesTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    cachedFilesTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    cachedFilesTraceRow.style.height = '40px';
    cachedFilesTraceRow.style.width = `100%`;
    cachedFilesTraceRow.setAttribute('children', '');
    cachedFilesTraceRow.name = memoryNameList[1];
    cachedFilesTraceRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> =>
      abilityMemoryUsedDataSender(cachedId, cachedFilesTraceRow).then((res): MemoryAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    cachedFilesTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        cachedFilesTraceRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    cachedFilesTraceRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = cachedFilesTraceRow.getHoverStruct();
    };
    cachedFilesTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (cachedFilesTraceRow.currentContext) {
        context = cachedFilesTraceRow.currentContext;
      } else {
        context = cachedFilesTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      cachedFilesTraceRow.canvasSave(context);
      (renders['monitorMemory'] as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorMemory1`,
          maxMemoryByte: cachedValue,
          maxMemoryByteName: cachedValueName,
        },
        cachedFilesTraceRow
      );
      cachedFilesTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(cachedFilesTraceRow);
    let swap = await queryMemoryMaxData('sys.mem.swap.total');
    let swapValue = swap[0].maxValue;
    let swapValueName = this.memoryMath(swapValue);
    let swapId = swap[0].filter_id;
    let compressedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    compressedTraceRow.rowParentId = `abilityMonitor`;
    compressedTraceRow.rowHidden = !processRow.expansion;
    compressedTraceRow.rowId = memoryNameList[2];
    compressedTraceRow.rowType = TraceRow.ROW_TYPE_MEMORY_ABILITY;
    compressedTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    compressedTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    compressedTraceRow.style.height = '40px';
    compressedTraceRow.style.width = `100%`;
    compressedTraceRow.setAttribute('children', '');
    compressedTraceRow.name = memoryNameList[2];
    compressedTraceRow.supplierFrame = (): Promise<MemoryAbilityMonitorStruct[]> =>
      abilityMemoryUsedDataSender(swapId, compressedTraceRow).then((res): MemoryAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    compressedTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        compressedTraceRow,
        MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct,
        `<span>${Utils.getBinaryKBWithUnit(MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct?.value || 0)}</span>`
      );
    };
    compressedTraceRow.findHoverStruct = (): void => {
      MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = compressedTraceRow.getHoverStruct();
    };
    compressedTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (compressedTraceRow.currentContext) {
        context = compressedTraceRow.currentContext;
      } else {
        context = compressedTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      compressedTraceRow.canvasSave(context);
      (renders['monitorMemory'] as MemoryAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorMemory2`,
          maxMemoryByte: swapValue,
          maxMemoryByteName: swapValueName,
        },
        compressedTraceRow
      );
      compressedTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(compressedTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability Memory is: ', durTime);
  };

  private initDiskAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    let maxList = await queryDiskIoMaxData();
    let maxBytesRead = maxList[0].bytesRead;
    let maxBytesReadName = this.diskIOMath(maxBytesRead);
    let diskIONameList: Array<string> = ['Bytes Read/Sec', 'Bytes Written/Sec', 'Read Ops/Sec', 'Written Ops/Sec'];
    let bytesReadTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    bytesReadTraceRow.rowParentId = `abilityMonitor`;
    bytesReadTraceRow.rowHidden = !processRow.expansion;
    bytesReadTraceRow.rowId = diskIONameList[0];
    bytesReadTraceRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    bytesReadTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesReadTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesReadTraceRow.style.height = '40px';
    bytesReadTraceRow.style.width = `100%`;
    bytesReadTraceRow.setAttribute('children', '');
    bytesReadTraceRow.name = 'Disk ' + diskIONameList[0];
    bytesReadTraceRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(bytesReadTraceRow, 'AbilityBytesReadData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    bytesReadTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesReadTraceRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    bytesReadTraceRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = bytesReadTraceRow.getHoverStruct();
    };
    bytesReadTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesReadTraceRow.currentContext) {
        context = bytesReadTraceRow.currentContext;
      } else {
        context = bytesReadTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesReadTraceRow.canvasSave(context);
      (renders['monitorDiskIo'] as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorDiskIo0`,
          maxDiskRate: maxBytesRead,
          maxDiskRateName: maxBytesReadName,
        },
        bytesReadTraceRow
      );
      bytesReadTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(bytesReadTraceRow);
    let maxBytesWrite = maxList[0].bytesWrite;
    let maxBytesWriteName = this.diskIOMath(maxBytesWrite);
    let bytesWrittenTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    bytesWrittenTraceRow.rowParentId = `abilityMonitor`;
    bytesWrittenTraceRow.rowHidden = !processRow.expansion;
    bytesWrittenTraceRow.rowId = diskIONameList[1];
    bytesWrittenTraceRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    bytesWrittenTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesWrittenTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesWrittenTraceRow.style.height = '40px';
    bytesWrittenTraceRow.style.width = `100%`;
    bytesWrittenTraceRow.setAttribute('children', '');
    bytesWrittenTraceRow.name = 'Disk ' + diskIONameList[1];
    bytesWrittenTraceRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(bytesWrittenTraceRow, 'AbilityBytesWrittenData').then(
        (res): DiskAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    bytesWrittenTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesWrittenTraceRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    bytesWrittenTraceRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = bytesWrittenTraceRow.getHoverStruct();
    };
    bytesWrittenTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesWrittenTraceRow.currentContext) {
        context = bytesWrittenTraceRow.currentContext;
      } else {
        context = bytesWrittenTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesWrittenTraceRow.canvasSave(context);
      (renders['monitorDiskIo'] as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorDiskIo1`,
          maxDiskRate: maxBytesWrite,
          maxDiskRateName: maxBytesWriteName,
        },
        bytesWrittenTraceRow
      );
      bytesWrittenTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(bytesWrittenTraceRow);
    let maxReadOps = maxList[0].readOps;
    let maxReadOpsName = this.diskIOMath(maxReadOps);
    let readOpsTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    readOpsTraceRow.rowParentId = `abilityMonitor`;
    readOpsTraceRow.rowHidden = !processRow.expansion;
    readOpsTraceRow.rowId = diskIONameList[2];
    readOpsTraceRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    readOpsTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    readOpsTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    readOpsTraceRow.style.height = '40px';
    readOpsTraceRow.style.width = `100%`;
    readOpsTraceRow.setAttribute('children', '');
    readOpsTraceRow.name = 'Disk ' + diskIONameList[2];
    readOpsTraceRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(readOpsTraceRow, 'AbilityReadOpsData').then((res): DiskAbilityMonitorStruct[] => {
        this.computeDur(res);
        return res;
      });
    readOpsTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        readOpsTraceRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    readOpsTraceRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = readOpsTraceRow.getHoverStruct();
    };
    readOpsTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (readOpsTraceRow.currentContext) {
        context = readOpsTraceRow.currentContext;
      } else {
        context = readOpsTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      readOpsTraceRow.canvasSave(context);
      (renders['monitorDiskIo'] as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorDiskIo2`,
          maxDiskRate: maxReadOps,
          maxDiskRateName: maxReadOpsName,
        },
        readOpsTraceRow
      );
      readOpsTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(readOpsTraceRow);
    let maxWriteOps = maxList[0].writeOps;
    let maxWriteOpsName = this.diskIOMath(maxWriteOps);
    let writtenOpsTraceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    writtenOpsTraceRow.rowParentId = `abilityMonitor`;
    writtenOpsTraceRow.rowHidden = !processRow.expansion;
    writtenOpsTraceRow.rowId = diskIONameList[3];
    writtenOpsTraceRow.rowType = TraceRow.ROW_TYPE_DISK_ABILITY;
    writtenOpsTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    writtenOpsTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    writtenOpsTraceRow.style.height = '40px';
    writtenOpsTraceRow.style.width = `100%`;
    writtenOpsTraceRow.setAttribute('children', '');
    writtenOpsTraceRow.name = 'Disk ' + diskIONameList[3];
    writtenOpsTraceRow.supplierFrame = (): Promise<DiskAbilityMonitorStruct[]> =>
      abilityBytesReadDataSender(writtenOpsTraceRow, 'AbilityWrittenOpsData').then(
        (res): DiskAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    writtenOpsTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        writtenOpsTraceRow,
        DiskAbilityMonitorStruct.hoverDiskAbilityStruct,
        `<span>${DiskAbilityMonitorStruct.hoverDiskAbilityStruct?.value || '0'} KB/S</span>`
      );
    };
    writtenOpsTraceRow.findHoverStruct = (): void => {
      DiskAbilityMonitorStruct.hoverDiskAbilityStruct = writtenOpsTraceRow.getHoverStruct();
    };
    writtenOpsTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (writtenOpsTraceRow.currentContext) {
        context = writtenOpsTraceRow.currentContext;
      } else {
        context = writtenOpsTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      writtenOpsTraceRow.canvasSave(context);
      (renders['monitorDiskIo'] as DiskIoAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorDiskIo3`,
          maxDiskRate: maxWriteOps,
          maxDiskRateName: maxWriteOpsName,
        },
        writtenOpsTraceRow
      );
      writtenOpsTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(writtenOpsTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability DiskIO is: ', durTime);
  };

  private initNetworkAbility = async (processRow: TraceRow<ProcessStruct>): Promise<void> => {
    let time = new Date().getTime();
    let maxList = await queryNetWorkMaxData();
    let maxBytesIn = maxList[0].maxIn;
    let maxInByteName = this.networkMath(maxBytesIn);
    let networkNameList: Array<string> = ['Bytes In/Sec', 'Bytes Out/Sec', 'Packets In/Sec', 'Packets Out/Sec'];
    let bytesInTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    bytesInTraceRow.rowParentId = `abilityMonitor`;
    bytesInTraceRow.rowHidden = !processRow.expansion;
    bytesInTraceRow.rowId = networkNameList[0];
    bytesInTraceRow.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    bytesInTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesInTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesInTraceRow.style.height = '40px';
    bytesInTraceRow.style.width = `100%`;
    bytesInTraceRow.setAttribute('children', '');
    bytesInTraceRow.name = 'Network ' + networkNameList[0];
    bytesInTraceRow.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(bytesInTraceRow, 'AbilityBytesInTraceData').then(
        (res): NetworkAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    bytesInTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesInTraceRow,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    bytesInTraceRow.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = bytesInTraceRow.getHoverStruct();
    };
    bytesInTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesInTraceRow.currentContext) {
        context = bytesInTraceRow.currentContext;
      } else {
        context = bytesInTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesInTraceRow.canvasSave(context);
      (renders['monitorNetwork'] as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorNetwork0`,
          maxNetworkRate: maxBytesIn,
          maxNetworkRateName: maxInByteName,
        },
        bytesInTraceRow
      );
      bytesInTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(bytesInTraceRow);
    let bytesOutTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    let maxBytesOut = maxList[0].maxOut;
    let maxOutByteName = this.networkMath(maxBytesOut);
    bytesOutTraceRow.rowParentId = `abilityMonitor`;
    bytesOutTraceRow.rowHidden = !processRow.expansion;
    bytesOutTraceRow.rowId = networkNameList[1];
    bytesOutTraceRow.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    bytesOutTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    bytesOutTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    bytesOutTraceRow.style.height = '40px';
    bytesOutTraceRow.style.width = `100%`;
    bytesOutTraceRow.setAttribute('children', '');
    bytesOutTraceRow.name = 'Network ' + networkNameList[1];
    bytesOutTraceRow.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(bytesOutTraceRow, 'AbilityBytesOutTraceData').then(
        (res): NetworkAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    bytesOutTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        bytesOutTraceRow,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    bytesOutTraceRow.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = bytesOutTraceRow.getHoverStruct();
    };
    bytesOutTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (bytesOutTraceRow.currentContext) {
        context = bytesOutTraceRow.currentContext;
      } else {
        context = bytesOutTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      bytesOutTraceRow.canvasSave(context);
      (renders['monitorNetwork'] as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorNetwork1`,
          maxNetworkRate: maxBytesOut,
          maxNetworkRateName: maxOutByteName,
        },
        bytesOutTraceRow
      );
      bytesOutTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(bytesOutTraceRow);
    let packetInTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    let maxPacketIn = maxList[0].maxPacketIn;
    let maxInPacketName = this.networkMath(maxPacketIn);
    packetInTraceRow.rowParentId = `abilityMonitor`;
    packetInTraceRow.rowHidden = !processRow.expansion;
    packetInTraceRow.rowId = networkNameList[2];
    packetInTraceRow.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    packetInTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    packetInTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    packetInTraceRow.style.height = '40px';
    packetInTraceRow.style.width = `100%`;
    packetInTraceRow.setAttribute('children', '');
    packetInTraceRow.name = 'Network ' + networkNameList[2];
    packetInTraceRow.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(packetInTraceRow, 'AbilityPacketInTraceData').then(
        (res): NetworkAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    packetInTraceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        packetInTraceRow,
        NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
        `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct?.value || 0)}</span>`
      );
    };
    packetInTraceRow.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = packetInTraceRow.getHoverStruct();
    };
    packetInTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (packetInTraceRow.currentContext) {
        context = packetInTraceRow.currentContext;
      } else {
        context = packetInTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      packetInTraceRow.canvasSave(context);
      (renders['monitorNetwork'] as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorNetwork-Packet2`,
          maxNetworkRate: maxPacketIn,
          maxNetworkRateName: maxInPacketName,
        },
        packetInTraceRow
      );
      packetInTraceRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(packetInTraceRow);
    let packetOutTraceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    let maxPacketOut = maxList[0].maxPacketOut;
    let maxOutPacketName = this.networkMath(maxPacketOut);
    packetOutTraceRow.rowParentId = `abilityMonitor`;
    packetOutTraceRow.rowHidden = !processRow.expansion;
    packetOutTraceRow.rowId = networkNameList[3];
    packetOutTraceRow.rowType = TraceRow.ROW_TYPE_NETWORK_ABILITY;
    packetOutTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    packetOutTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    packetOutTraceRow.style.height = '40px';
    packetOutTraceRow.style.width = `100%`;
    packetOutTraceRow.setAttribute('children', '');
    packetOutTraceRow.name = 'Network ' + networkNameList[3];
    packetOutTraceRow.supplierFrame = (): Promise<NetworkAbilityMonitorStruct[]> =>
      abilityBytesInTraceDataSender(packetOutTraceRow, 'AbilityPacketsOutTraceData').then(
        (res): NetworkAbilityMonitorStruct[] => {
          this.computeDur(res);
          return res;
        }
      );
    packetOutTraceRow.focusHandler = (ev): void => {
      if (NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct) {
        this.trace?.displayTip(
          packetOutTraceRow,
          NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct,
          `<span>${Utils.getBinaryByteWithUnit(NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct!.value!)}</span>`
        );
      }
    };
    packetOutTraceRow.findHoverStruct = (): void => {
      NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = packetOutTraceRow.getHoverStruct();
    };
    packetOutTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (packetOutTraceRow.currentContext) {
        context = packetOutTraceRow.currentContext;
      } else {
        context = packetOutTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      packetOutTraceRow.canvasSave(context);
      (renders['monitorNetwork'] as NetworkAbilityRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `monitorNetwork3`,
          maxNetworkRate: maxPacketOut,
          maxNetworkRateName: maxOutPacketName,
        },
        packetOutTraceRow
      );
      packetOutTraceRow.canvasRestore(context, this.trace);
    };
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
    );
    totalTraceRow.supplierFrame = (): Promise<any[]> =>
      new Promise<Array<any>>((resolve): void =>
        resolve(
          abilityPurgeableDataSender(totalTraceRow, snapshotDur, false).then((res: any[]) => {
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
    );
    pinTraceRow.supplierFrame = (): Promise<any[]> =>
      new Promise<Array<any>>((resolve): void =>
        resolve(
          abilityPurgeableDataSender(pinTraceRow, snapshotDur, true).then((res: any[]) => {
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
    let dmaTraceRow = this.initTraceRow('abilityMonitorDma', 'DMA', TraceRow.ROW_TYPE_DMA_ABILITY, processRow);
    dmaTraceRow.supplierFrame = (): Promise<any[]> =>
      new Promise<Array<any>>((resolve): void =>
        resolve(
          abilityDmaDataSender(dmaTraceRow, snapshotDur).then((res: any[]) => {
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
    );
    gpuMemoryTraceRow.supplierFrame = (): Promise<any[]> =>
      new Promise<Array<any>>((resolve): void =>
        resolve(
          abilityGpuMemoryDataSender(gpuMemoryTraceRow, snapshotDur).then((res: any[]) => {
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
    abilityMonitor.rowParentId = 'abilityMonitor';
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
    abilityMonitor.findHoverStruct = () => {
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

  private setName(data: Array<any>): void {
    if (data.length > 0) {
      data.forEach((item, index) => {
        item.name = `SnapShot ${index}`;
      });
    }
  }

  private computeDur(list: Array<any>): void {
    let endNS = TraceRow.range?.endNS || 0;
    list.forEach((it, i) => {
      if (i === list.length - 1) {
        it.dur = (endNS || 0) - (it.startNS || 0);
      } else {
        it.dur = (list[i + 1].startNS || 0) - (it.startNS || 0);
      }
    });
  }
}
