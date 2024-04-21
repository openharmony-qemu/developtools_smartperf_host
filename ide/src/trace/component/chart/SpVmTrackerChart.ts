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
import { type BaseStruct } from '../../bean/BaseStruct';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { Utils } from '../trace/base/Utils';
import { type EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { info } from '../../../log/Log';
import { type SnapshotRender, SnapshotStruct } from '../../database/ui-worker/ProcedureWorkerSnapshot';
import { type TreeItemData } from '../../../base-ui/tree/LitTree';
import { MemoryConfig } from '../../bean/MemoryConfig';
import { TabPaneSmapsRecord } from '../trace/sheet/smaps/TabPaneSmapsRecord';
import {
  dmaDataSender,
  gpuGpuDataSender,
  gpuMemoryDataSender,
  gpuResourceDataSender,
  gpuTotalDataSender,
  gpuWindowDataSender,
  purgeableDataSender,
  sMapsDataSender,
  shmDataSender,
} from '../../database/data-trafic/VmTrackerDataSender';
import { resetVmTracker } from '../../database/data-trafic/VmTrackerDataReceiver';
import { querySmapsExits } from '../../database/sql/Smaps.sql';
import {
  queryisExistsGpuMemoryData,
  queryisExistsPurgeableData,
  queryisExistsShmData,
} from '../../database/sql/Memory.sql';
import { queryisExistsDmaData } from '../../database/sql/Dma.sql';
import {
  queryGpuTotalType,
  queryGpuWindowType,
  queryisExistsGpuData,
  queryisExistsGpuResourceData,
} from '../../database/sql/Gpu.sql';

export class VmTrackerChart {
  private trace: SpSystemTrace;
  private rowFolder!: TraceRow<BaseStruct>;
  private sMapsFolder!: TraceRow<BaseStruct>;
  private gpuFolder!: TraceRow<BaseStruct>;
  private memoryConfig: MemoryConfig = MemoryConfig.getInstance();
  static gpuTotalModule: number | null = null; //ns
  static gpuWindow: number | null = null; //ns
  static gpuWindowModule: number | null = null; //ns
  private smapsRecordTab: TabPaneSmapsRecord | undefined | null;
  private scratchId = -1;
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    this.smapsRecordTab = this.trace
      .shadowRoot!.querySelector('div > trace-sheet')!
      .shadowRoot!.querySelector<TabPaneSmapsRecord>('#box-smaps-record > tabpane-smaps-record');
    if (this.scratchId === -1) {
      for (let [key, value] of SpSystemTrace.DATA_DICT) {
        if (value === 'Scratch') {
          this.scratchId = key;
          break;
        }
      }
    }
    const result = await querySmapsExits();
    if (result.length <= 0) {
      return;
    }
    await this.initVmTrackerFolder();
    await this.initSMapsFolder();
    const rowNameList: Array<string> = ['Dirty', 'Swapped', 'RSS', 'PSS', 'USS'];
    for (const rowName of rowNameList) {
      await this.initSmapsRows(rowName);
    }
    const isExistsShm = await queryisExistsShmData(this.memoryConfig.iPid);
    const isExistsDma = await queryisExistsDmaData(this.memoryConfig.iPid);
    //@ts-ignore
    if (isExistsShm[0].data_exists) {
      await this.initShmRows();
    }
    await this.initPurgeableVM();
    // @ts-ignore
    if (isExistsDma[0].data_exists) {
      await this.initDmaRow();
    }
    await this.initGpuData();
  }

  private async initGpuData(): Promise<void> {
    const isExistsGpuMemory = await queryisExistsGpuMemoryData(this.memoryConfig.iPid);
    const isExistsGpuResource = await queryisExistsGpuResourceData(this.scratchId);
    const isExistsGraph = await queryisExistsGpuData(MemoryConfig.getInstance().iPid, "'mem.graph_pss'");
    const isExistsGl = await queryisExistsGpuData(MemoryConfig.getInstance().iPid, "'mem.gl_pss'");
    if (
      // @ts-ignore
      isExistsGpuMemory[0].data_exists ||
      // @ts-ignore
      isExistsGpuResource[0].data_exists ||
      // @ts-ignore
      isExistsGraph[0].data_exists ||
      // @ts-ignore
      isExistsGl[0].data_exists
    ) {
      await this.initGpuFolder();
      //   @ts-ignore
      if (isExistsGpuMemory[0].data_exists) {
        await this.initGpuMemoryRow();
      }
      // @ts-ignore
      if (isExistsGpuResource[0].data_exists) {
        await this.initGpuResourceRow(this.scratchId);
      } else {
        this.smapsRecordTab!.GLESHostCache = [];
      }
      // @ts-ignore
      if (isExistsGraph[0].data_exists) {
        await this.addGpuGraphRow();
      }
      // @ts-ignore
      if (isExistsGl[0].data_exists) {
        await this.addGpuGLRow();
        await this.addGpuTotalRow();
        await this.addGpuWindowRow();
      }
    }
  }

  private initVmTrackerFolder = async (): Promise<void> => {
    let VmTrackerRow = TraceRow.skeleton();
    VmTrackerRow.rowId = 'VmTrackerRow';
    VmTrackerRow.rowType = TraceRow.ROW_TYPE_VM_TRACKER;
    VmTrackerRow.addTemplateTypes('ProcessMemory');
    VmTrackerRow.addTemplateTypes('Memory');
    VmTrackerRow.rowParentId = '';
    VmTrackerRow.style.height = '40px';
    VmTrackerRow.index = 0;
    VmTrackerRow.folder = true;
    VmTrackerRow.name = `VM Tracker (${this.memoryConfig.processName} ${this.memoryConfig.pid})`;
    VmTrackerRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    VmTrackerRow.selectChangeHandler = this.trace.selectChangeHandler;
    VmTrackerRow.supplierFrame = (): Promise<Array<SnapshotStruct>> =>
      new Promise<Array<SnapshotStruct>>((resolve) => resolve([]));
    VmTrackerRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (VmTrackerRow.currentContext) {
        context = VmTrackerRow.currentContext;
      } else {
        context = VmTrackerRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      VmTrackerRow.canvasSave(context);
      if (VmTrackerRow.expansion) {
        // @ts-ignore
        context?.clearRect(0, 0, VmTrackerRow.frame.width, VmTrackerRow.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: '',
          },
          VmTrackerRow
        );
      }
      VmTrackerRow.canvasRestore(context, this.trace);
    };
    this.rowFolder = VmTrackerRow;
    this.trace.rowsEL?.appendChild(VmTrackerRow);
  };

  private initSMapsFolder = async (): Promise<void> => {
    let sMapsRow = TraceRow.skeleton<SnapshotStruct>();
    sMapsRow.rowId = 'smapsRow';
    sMapsRow.rowParentId = 'VmTrackerRow';
    sMapsRow.rowHidden = !this.rowFolder.expansion;
    sMapsRow.rowType = TraceRow.ROW_TYPE_VM_TRACKER_SMAPS;
    sMapsRow.folder = true;
    sMapsRow.name = 'Smaps';
    sMapsRow.folderPaddingLeft = 20;
    sMapsRow.style.height = '40px';
    sMapsRow.style.width = '100%';
    sMapsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    sMapsRow.selectChangeHandler = this.trace.selectChangeHandler;
    sMapsRow.supplierFrame = (): Promise<Array<SnapshotStruct>> =>
      new Promise<Array<SnapshotStruct>>((resolve) => resolve([]));
    sMapsRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (sMapsRow.currentContext) {
        context = sMapsRow.currentContext;
      } else {
        context = sMapsRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      sMapsRow.canvasSave(context);
      if (sMapsRow.expansion) {
        // @ts-ignore
        context?.clearRect(0, 0, sMapsRow.frame.width, sMapsRow.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: '',
          },
          sMapsRow
        );
      }
      sMapsRow.canvasRestore(context, this.trace);
    };
    this.sMapsFolder = sMapsRow;
    this.rowFolder?.addChildTraceRow(sMapsRow);
  };

  private initGpuFolder = async (): Promise<TraceRow<SnapshotStruct>> => {
    let gpuTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuTraceRow.rowId = 'skiaGpuTraceRow';
    gpuTraceRow.rowType = TraceRow.ROW_TYPE_SYS_MEMORY_GPU;
    gpuTraceRow.rowParentId = 'VmTrackerRow';
    gpuTraceRow.style.height = '40px';
    gpuTraceRow.folder = true;
    gpuTraceRow.folderPaddingLeft = 20;
    gpuTraceRow.rowHidden = !this.rowFolder.expansion;
    gpuTraceRow.name = 'GPU';
    gpuTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    gpuTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    gpuTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> =>
      new Promise<Array<SnapshotStruct>>((resolve) => resolve([]));
    gpuTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (gpuTraceRow.currentContext) {
        context = gpuTraceRow.currentContext;
      } else {
        context = gpuTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      gpuTraceRow.canvasSave(context);
      if (gpuTraceRow.expansion) {
        // @ts-ignore
        context?.clearRect(0, 0, gpuTraceRow.frame.width, gpuTraceRow.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: '',
          },
          gpuTraceRow
        );
      }
      gpuTraceRow.canvasRestore(context, this.trace);
    };
    this.gpuFolder = gpuTraceRow;
    this.rowFolder.addChildTraceRow(gpuTraceRow);
    return gpuTraceRow;
  };

  private getSmapsKeyName(rowName: string): string {
    let columnName = rowName.toLowerCase();
    let keyName = '';
    switch (rowName) {
      case 'USS':
        keyName = 'private_clean + private_dirty';
        break;
      case 'RSS':
        keyName = 'resident_size';
        break;
      case 'Swapped':
        keyName = 'swap + swap_pss';
        break;
      default:
        keyName = columnName;
    }
    return keyName;
  }

  private initSmapsRows = async (rowName: string): Promise<void> => {
    let sMapsTraceRow = this.initTraceRow(rowName, TraceRow.ROW_TYPE_VM_TRACKER_SMAPS, 'smapsRow');
    sMapsTraceRow.rowHidden = !this.sMapsFolder.expansion;
    sMapsTraceRow.folderTextLeft = 40;
    sMapsTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return sMapsDataSender(this.getSmapsKeyName(rowName), sMapsTraceRow).then((sMaps: unknown[]) => {
        this.setName(sMaps);
        return sMaps;
      });
    };
    this.sMapsFolder.addChildTraceRow(sMapsTraceRow);
  };

  private initShmRows = async (): Promise<void> => {
    let shmTraceRow = this.initTraceRow('SHM', TraceRow.ROW_TYPE_VMTRACKER_SHM, 'VmTrackerRow');
    shmTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return shmDataSender(this.memoryConfig.iPid, shmTraceRow).then((shmData: unknown[]) => {
        this.setName(shmData);
        return shmData;
      });
    };
    this.rowFolder.addChildTraceRow(shmTraceRow);
  };

  private async initPurgeableTotal(): Promise<void> {
    let totalTraceRow = this.initTraceRow('Purgeable Total', TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM, 'VmTrackerRow');
    totalTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return purgeableDataSender(this.memoryConfig.iPid, totalTraceRow, false).then((purgeableTotalData: unknown[]) => {
        this.setName(purgeableTotalData);
        return purgeableTotalData;
      });
    };
    this.rowFolder.addChildTraceRow(totalTraceRow);
  }

  private async initPurgeablePin(): Promise<void> {
    let pinTraceRow = this.initTraceRow('Purgeable Pin', TraceRow.ROW_TYPE_PURGEABLE_PIN_VM, 'VmTrackerRow');
    pinTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return purgeableDataSender(this.memoryConfig.iPid, pinTraceRow, true).then((purgeablePinData: unknown[]) => {
        this.setName(purgeablePinData);
        return purgeablePinData;
      });
    };
    this.rowFolder.addChildTraceRow(pinTraceRow);
  }

  private initPurgeableVM = async (): Promise<void> => {
    let time = new Date().getTime();
    const isExistsPurgeableTotal = await queryisExistsPurgeableData(this.memoryConfig.iPid, false);
    const isExistsPurgeablePin = await queryisExistsPurgeableData(this.memoryConfig.iPid, true); //@ts-ignore
    if (isExistsPurgeableTotal[0].data_exists) {
      await this.initPurgeableTotal();
    } //@ts-ignore
    if (isExistsPurgeablePin[0].data_exists) {
      await this.initPurgeablePin();
    }
    let durTime = new Date().getTime() - time;
    info('The time to load the VM Purgeable is: ', durTime);
  };

  private initDmaRow = async (): Promise<void> => {
    let dmaTraceRow = this.initTraceRow('DMA', TraceRow.ROW_TYPE_DMA_VMTRACKER, 'VmTrackerRow');
    dmaTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return dmaDataSender(this.memoryConfig.iPid, dmaTraceRow).then((dmaData: unknown[]) => {
        this.setName(dmaData);
        return dmaData;
      });
    };
    this.rowFolder.addChildTraceRow(dmaTraceRow);
  };

  private initGpuMemoryRow = async (): Promise<void> => {
    let gpuMemoryTraceRow = this.initTraceRow(
      'Skia Gpu Memory',
      TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER,
      'skiaGpuTraceRow'
    );
    gpuMemoryTraceRow.rowHidden = !this.gpuFolder.expansion;
    gpuMemoryTraceRow.folderTextLeft = 40;
    gpuMemoryTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return gpuMemoryDataSender(this.memoryConfig.iPid, gpuMemoryTraceRow).then((gpuMemoryData: unknown[]) => {
        this.setName(gpuMemoryData);
        return gpuMemoryData;
      });
    };
    this.gpuFolder.addChildTraceRow(gpuMemoryTraceRow);
  };

  private initGpuResourceRow = async (scratchId: number): Promise<void> => {
    let gpuMemoryTraceRow = this.initTraceRow(
      'Gpu Resource',
      TraceRow.ROW_TYPE_GPU_RESOURCE_VMTRACKER,
      this.gpuFolder.rowId!
    );
    gpuMemoryTraceRow.rowHidden = !this.gpuFolder.expansion;
    gpuMemoryTraceRow.folderTextLeft = 40;
    gpuMemoryTraceRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return gpuResourceDataSender(scratchId, gpuMemoryTraceRow).then((gpuResourceData: unknown[]) => {
        this.setName(gpuResourceData);
        // 将泳道图数据传递给Native Heap Tab页
        //@ts-ignore
        this.smapsRecordTab!.GLESHostCache = gpuResourceData;
        return gpuResourceData;
      });
    };
    this.gpuFolder.addChildTraceRow(gpuMemoryTraceRow);
  };

  private async addGpuGraphRow(): Promise<void> {
    let graphRow = this.initTraceRow('Graph', TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH, this.gpuFolder.rowId!);
    graphRow.addTemplateTypes('sys-memory');
    graphRow.folderTextLeft = 40;
    graphRow.supplierFrame = (): Promise<SnapshotStruct[]> => {
      //@ts-ignore
      return gpuGpuDataSender(this.memoryConfig.iPid, "'mem.graph_pss'", graphRow).then((graphData: unknown[]) => {
        this.setName(graphData);
        return graphData;
      });
    };
    this.gpuFolder.addChildTraceRow(graphRow);
  }

  private async addGpuGLRow(): Promise<void> {
    let glRow = this.initTraceRow('GL', TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL, this.gpuFolder.rowId!);
    glRow.addTemplateTypes('sys-memory');
    glRow.folderTextLeft = 40;
    glRow.supplierFrame = (): Promise<SnapshotStruct[]> => {
      //@ts-ignore
      return gpuGpuDataSender(this.memoryConfig.iPid, "'mem.gl_pss'", glRow).then((glData: unknown[]) => {
        this.setName(glData);
        return glData;
      });
    };
    this.gpuFolder.addChildTraceRow(glRow);
  }

  private async addGpuTotalRow(): Promise<void> {
    let types = await queryGpuTotalType();
    if (!types || types.length === 0) {
      return;
    }
    let gpuTotalRow = this.initTraceRow(
      'Skia Gpu Dump Total',
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL,
      this.gpuFolder.rowId!
    );
    gpuTotalRow.folderTextLeft = 40;
    gpuTotalRow.addTemplateTypes('sys-memory');
    gpuTotalRow.addRowSettingPop();
    gpuTotalRow.rowSetting = 'enable';
    gpuTotalRow.rowSettingList = [
      {
        key: 'total',
        title: 'Total',
        checked: true,
      },
      ...types.map(
        (
          it
        ): {
          key: string;
          title: string;
        } => {
          return {
            key: `${it.id}`,
            title: it.data,
          };
        }
      ),
    ];
    this.addHandleEventByGpuTotalRow(gpuTotalRow);
    this.gpuFolder.addChildTraceRow(gpuTotalRow);
  }

  private addHandleEventByGpuTotalRow(gpuTotalRow: TraceRow<SnapshotStruct>): void {
    gpuTotalRow.onRowSettingChangeHandler = (setting): void => {
      if (setting && setting.length > 0) {
        gpuTotalRow.dataListCache = [];
        gpuTotalRow.dataList = [];
        gpuTotalRow.isComplete = false;
        VmTrackerChart.gpuTotalModule = setting[0] === 'total' ? null : parseInt(setting[0]);
        gpuTotalRow.needRefresh = true;
        gpuTotalRow.drawFrame();
      }
    };
    gpuTotalRow.supplierFrame = (): Promise<Array<SnapshotStruct>> => {
      //@ts-ignore
      return gpuTotalDataSender(VmTrackerChart.gpuTotalModule, gpuTotalRow).then((gpuTotalData: unknown[]) => {
        this.setName(gpuTotalData);
        return gpuTotalData;
      });
    };
  }

  private async addGpuWindowRow(): Promise<void> {
    let types = await queryGpuWindowType();
    if (!types || types.length === 0) {
      return;
    }
    let settings: TreeItemData[] = types
      .filter((it) => it.pid === null)
      .map((it) => {
        return {
          key: `${it.id}`,
          title: it.data,
          children: [],
        };
      });
    settings.forEach((it) => {
      it.children = types
        .filter((child) => `${child.pid}` === it.key)
        .map((item) => {
          return {
            key: `${it.key}-${item.id}`,
            title: item.data,
          };
        });
    });
    settings[0].checked = true;
    VmTrackerChart.gpuWindow = parseInt(settings[0].key);
    VmTrackerChart.gpuWindowModule = null;
    let gpuWindowRow = this.initTraceRow(
      'Skia Gpu Dump Window',
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW,
      this.gpuFolder.rowId!
    );
    gpuWindowRow.folderTextLeft = 40;
    gpuWindowRow.addRowSettingPop();
    gpuWindowRow.rowSetting = 'enable';
    gpuWindowRow.rowSettingList = settings;
    gpuWindowRow.addTemplateTypes('sys-memory');
    this.addHandleEventByGpuWindowRow(gpuWindowRow);
    this.gpuFolder.addChildTraceRow(gpuWindowRow);
  }

  private addHandleEventByGpuWindowRow(gpuWindowRow: TraceRow<SnapshotStruct>): void {
    gpuWindowRow.onRowSettingChangeHandler = (setting): void => {
      if (setting && setting.length > 0) {
        let split = setting[0].split('-');
        VmTrackerChart.gpuWindow = parseInt(split[0]);
        VmTrackerChart.gpuWindowModule = split.length > 1 ? parseInt(split[1]) : null;
        gpuWindowRow.dataListCache = [];
        gpuWindowRow.dataList = [];
        gpuWindowRow.isComplete = false;
        gpuWindowRow.needRefresh = true;
        gpuWindowRow.drawFrame();
      }
    };
    gpuWindowRow.supplierFrame = (): Promise<SnapshotStruct[]> => {
      //@ts-ignore
      return gpuWindowDataSender(VmTrackerChart.gpuWindow!, VmTrackerChart.gpuWindowModule, gpuWindowRow).then(
        (gpuWindowData: unknown[]) => {
          this.setName(gpuWindowData);
          return gpuWindowData;
        }
      );
    };
  }

  private initTraceRow(rowName: string, type: string, rowParentId: string): TraceRow<SnapshotStruct> {
    let vmTrackerTraceRow = TraceRow.skeleton<SnapshotStruct>();
    vmTrackerTraceRow.rowParentId = rowParentId;
    vmTrackerTraceRow.rowId = rowName;
    vmTrackerTraceRow.rowType = type;
    vmTrackerTraceRow.folderTextLeft = 20;
    vmTrackerTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    vmTrackerTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    vmTrackerTraceRow.style.height = '40px';
    vmTrackerTraceRow.style.width = '100%';
    vmTrackerTraceRow.setAttribute('children', '');
    vmTrackerTraceRow.name = rowName;
    vmTrackerTraceRow.focusHandler = (): void => {
      this.showTip(vmTrackerTraceRow);
    };
    vmTrackerTraceRow.findHoverStruct = (): void => {
      SnapshotStruct.hoverSnapshotStruct = vmTrackerTraceRow.getHoverStruct();
    };
    vmTrackerTraceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (vmTrackerTraceRow.currentContext) {
        context = vmTrackerTraceRow.currentContext;
      } else {
        context = vmTrackerTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      vmTrackerTraceRow.canvasSave(context);
      (renders.snapshot as SnapshotRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'snapshot',
        },
        vmTrackerTraceRow
      );
      vmTrackerTraceRow.canvasRestore(context, this.trace);
    };
    return vmTrackerTraceRow;
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
        //@ts-ignore
        item.name = `SnapShot ${index}`;
      });
    }
  }
}
