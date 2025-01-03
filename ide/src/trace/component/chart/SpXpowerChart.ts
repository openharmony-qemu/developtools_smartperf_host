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
import { info } from '../../../log/Log';
import { XpowerRender, XpowerStruct } from '../../database/ui-worker/ProcedureWorkerXpower';
import { XpowerStatisticRender, XpowerStatisticStruct } from '../../database/ui-worker/ProcedureWorkerXpowerStatistic';
import { XpowerAppDetailRender, XpowerAppDetailStruct } from '../../database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { XpowerWifiRender, XpowerWifiStruct } from '../../database/ui-worker/ProcedureWorkerXpowerWifi';
import { ColorUtils } from '../trace/base/ColorUtils';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { xpowerDataSender } from '../../database/data-trafic/xpower/XpowerDataSender';
import { xpowerStatisticDataSender } from '../../database/data-trafic/xpower/XpowerStatisticDataSender';
import { xpowerWifiDataSender } from '../../database/data-trafic/xpower/XpowerWifiDataSender';
import { xpowerAppDetailDataSender } from '../../database/data-trafic/xpower/XpowerAppDetailDataSender';
import {
  XpowerThreadCountRender,
  XpowerThreadCountStruct,
} from '../../database/ui-worker/ProcedureWorkerXpowerThreadCount';
import {
  XpowerThreadInfoRender,
  XpowerThreadInfoStruct,
} from '../../database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import {
  xpowerThreadCountDataSender,
  xpowerThreadInfoDataSender,
} from '../../database/data-trafic/xpower/XpowerThreadSender';
import {
  xpowerGpuFreqDataSender,
  xpowerGpuFreqCountDataSender,
} from '../../database/data-trafic/xpower/XpowerGpuFrequencySender';
import { queryTraceConfig, queryXpowerData, queryXpowerMeasureData, queryFreq } from '../../database/sql/Xpower.sql';
import { BaseStruct } from '../../bean/BaseStruct';
import {
  XpowerGpuFreqCountRender,
  XpowerGpuFreqCountStruct,
} from '../../database/ui-worker/ProcedureWorkerXpowerGpuFreqCount';
import { XpowerGpuFreqStruct, XpowerGpuFreqRender } from '../../database/ui-worker/ProcedureWorkerXpowerGpuFreq';
export const THREAD_ENERGY = 'thread_energy';
export const THREAD_LOAD = 'thread_loads';
const ROW_HEIGHT = 200;

export class SpXpowerChart {
  private readonly trace: SpSystemTrace;
  private rowFolder!: TraceRow<BaseStruct>;
  private systemFolder!: TraceRow<BaseStruct>;
  private bundleNameFolder!: TraceRow<BaseStruct>;
  private threadInfoStructMap = new Map<number, XpowerThreadInfoStruct[]>();
  private threadEnergyStructMap = new Map<number, XpowerThreadInfoStruct[]>();
  private threadLoadStructMap = new Map<number, XpowerThreadInfoStruct[]>();
  private gpuFreqStructMap = new Map<number, XpowerGpuFreqStruct[]>();
  private valueTypeList: string[] = [THREAD_ENERGY, THREAD_LOAD];

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(traceId?: string): Promise<void> {
    let XpowerMeasureData = await queryXpowerMeasureData(traceId);
    if (XpowerMeasureData.length <= 0) {
      return;
    }
    let xpowerList = await queryXpowerData(traceId);
    if (xpowerList.length <= 0) {
      return;
    }
    await this.initXpowerFolder(traceId);
    let systemGroupRowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP;
    await this.initFolder('system', systemGroupRowType, 'System', traceId);
    await this.initSystemData(this.systemFolder, xpowerList, traceId);
    let traceConfig = await queryTraceConfig(traceId);
    let bundleNameRowType = TraceRow.ROW_TYPE_XPOWER_BUNDLE_NAME_GROUP;
    for (let i = 0; i < traceConfig.length; i++) {
      if (traceConfig[i].traceSource === 'xpower_config') {
        await this.initFolder('bundleName', bundleNameRowType, traceConfig[i].value, traceId);
        await this.initXpowerStatisticData(this.bundleNameFolder, traceId);
        await this.initXpowerWifiData(this.bundleNameFolder, traceId);
        await this.initXpowerAppDetatilDisplayData(this.bundleNameFolder, traceId);
        await this.initGpuFreqCountData(this.bundleNameFolder, traceId);
        await this.initGpuFreqData(this.bundleNameFolder, traceId);
        await this.initThreadCountData(this.bundleNameFolder, traceId);
        for (let value of this.valueTypeList) {
          await this.initThreadInfoData(this.bundleNameFolder, value, traceId);
        }
        break;
      }
    }
  }

  initXpowerFolder = async (traceId?: string): Promise<void> => {
    let xpowerFolder = TraceRow.skeleton(traceId);
    xpowerFolder.rowId = 'Xpowers';
    xpowerFolder.index = 0;
    xpowerFolder.rowType = TraceRow.ROW_TYPE_XPOWER;
    xpowerFolder.rowParentId = '';
    xpowerFolder.style.height = '40px';
    xpowerFolder.folder = true;
    xpowerFolder.name = 'Xpower';
    xpowerFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    xpowerFolder.selectChangeHandler = this.trace.selectChangeHandler;
    xpowerFolder.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    xpowerFolder.onThreadHandler = (useCache): void => {
      xpowerFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (xpowerFolder.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, xpowerFolder.frame.width, xpowerFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          xpowerFolder
        );
      }
      xpowerFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    this.rowFolder = xpowerFolder;
    this.trace.rowsEL?.appendChild(xpowerFolder);
  };

  private initFolder = async (rowId: string, rowType: string, name: string, traceId?: string): Promise<void> => {
    let folder = TraceRow.skeleton(traceId);
    folder.rowId = rowId;
    folder.rowParentId = 'Xpowers';
    folder.rowHidden = !this.rowFolder.expansion;
    folder.rowType = rowType;
    folder.folder = true;
    folder.name = name;
    folder.folderPaddingLeft = 20;
    folder.style.height = '40px';
    folder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    folder.selectChangeHandler = this.trace.selectChangeHandler;
    folder.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    folder.onThreadHandler = (useCache): void => {
      folder.canvasSave(this.trace.canvasPanelCtx!);
      if (folder.expansion) {
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
    if (rowType === TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP) {
      this.systemFolder = folder;
    } else if (rowType === TraceRow.ROW_TYPE_XPOWER_BUNDLE_NAME_GROUP) {
      this.bundleNameFolder = folder;
    }
    this.rowFolder?.addChildTraceRow(folder);
  };

  private xpowerSupplierFrame(
    traceRow: TraceRow<XpowerStruct>,
    it: {
      name: string;
      num: number;
      maxValue?: number;
      minValue?: number;
    }
  ): void {
    traceRow.supplierFrame = (): Promise<XpowerStruct[]> => {
      let promiseData = null;
      // @ts-ignore
      promiseData = xpowerDataSender(it.name, traceRow);
      if (promiseData === null) {
        // @ts-ignore
        return new Promise<Array<unknown>>((resolve) => resolve([]));
      } else {
        // @ts-ignore
        return promiseData.then((resultXpower: Array<unknown>) => {
          for (let j = 0; j < resultXpower.length; j++) {
            if (j > 0) {
              // @ts-ignore
              resultXpower[j].delta = (resultXpower[j].value || 0) - (resultXpower[j - 1].value || 0);
            } else {
              // @ts-ignore
              resultXpower[j].delta = 0;
            }
          }
          return resultXpower;
        });
      }
    };
  }

  private xpowerThreadHandler(
    traceRow: TraceRow<XpowerStruct>,
    it: {
      name: string;
      num: number;
      maxValue?: number;
      minValue?: number;
    },
    xpowerId: number
  ): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpower as XpowerRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: it.name,
          maxValue: it.maxValue === 0 ? 1 : it.maxValue!,
          minValue: it.minValue || 0,
          index: xpowerId,
          maxName: it.maxValue!.toString(),
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initSystemData(
    folder: TraceRow<BaseStruct>,
    xpowerList: Array<{
      name: string;
      num: number;
      maxValue: number;
      minValue: number;
    }>,
    traceId?: string
  ): Promise<void> {
    info('xpowerList data size is: ', xpowerList!.length);
    XpowerStruct.maxValue = xpowerList.map((item) => item.num).reduce((a, b) => Math.max(a, b));
    for (let i = 0; i < xpowerList.length; i++) {
      const it = xpowerList[i];
      let traceRow = TraceRow.skeleton<XpowerStruct>(traceId);
      traceRow.rowId = it.name;
      traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM;
      traceRow.rowParentId = folder.rowId;
      traceRow.style.height = '40px';
      traceRow.name = it.name;
      traceRow.rowHidden = !folder.expansion;
      traceRow.folderTextLeft = 40;
      if (it.name === 'ThermalReport.ShellTemp') {
        it.maxValue = it.maxValue / 1000;
      }
      traceRow.xpowerRowTitle = convertTitle(it.name);
      traceRow.setAttribute('children', '');
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      this.xpowerSupplierFrame(traceRow, it);
      traceRow.getCacheData = (args: unknown): Promise<XpowerStruct[]> | undefined => {
        let result: Promise<XpowerStruct[]> | undefined;
        result = xpowerDataSender(it.name, traceRow, args);
        return result;
      };
      traceRow.focusHandler = (ev): void => {
        this.trace?.displayTip(
          traceRow,
          XpowerStruct.hoverXpowerStruct,
          `<span>${
            it.name === 'ThermalReport.ShellTemp'
              ? XpowerStruct.hoverXpowerStruct?.value!
              : it.name === 'ThermalReport.ThermalLevel'
              ? convertHoverValue(String(XpowerStruct.hoverXpowerStruct?.value!))
              : ColorUtils.formatNumberComma(XpowerStruct.hoverXpowerStruct?.value!)
          }</span>`
        );
      };
      traceRow.findHoverStruct = (): void => {
        XpowerStruct.hoverXpowerStruct = traceRow.getHoverStruct();
      };
      this.xpowerThreadHandler(traceRow, it, i);
      folder.addChildTraceRow(traceRow);
    }
  }

  async initThreadCountData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let traceRow = TraceRow.skeleton<XpowerThreadCountStruct>(traceId);
    traceRow.rowId = 'ThreadCount';
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_THREAD_COUNT;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '40px';
    traceRow.name = 'Thread Count';
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.setAttribute('children', '');
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.xpowerThreadCountSupplierFrame(traceRow);
    traceRow.getCacheData = (args: unknown): Promise<XpowerThreadCountStruct[]> | undefined => {
      let result: Promise<XpowerThreadCountStruct[]> | undefined;
      result = xpowerThreadCountDataSender(traceRow, args);
      return result;
    };
    traceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        traceRow,
        XpowerThreadCountStruct.hoverXpowerStruct,
        `<span>Count:${XpowerThreadCountStruct.hoverXpowerStruct?.value}</span>`
      );
    };
    traceRow.findHoverStruct = (): void => {
      XpowerThreadCountStruct.hoverXpowerStruct = traceRow.getHoverStruct();
    };
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerThreadCount as XpowerThreadCountRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(traceRow);
  }

  private xpowerThreadCountSupplierFrame(traceRow: TraceRow<XpowerThreadCountStruct>): void {
    traceRow.supplierFrame = (): Promise<XpowerThreadCountStruct[]> => {
      return xpowerThreadCountDataSender(traceRow).then((resultXpower: Array<XpowerThreadCountStruct>) => {
        return resultXpower;
      });
    };
  }

  async initGpuFreqCountData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let traceRow = TraceRow.skeleton<XpowerGpuFreqCountStruct>(traceId);
    traceRow.rowId = 'GpuFreqCount';
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_GPU_COUNT;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '40px';
    traceRow.name = 'Gpu Freq Count';
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.setAttribute('children', '');
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.xpowerGpuFreqCountSupplierFrame(traceRow);
    traceRow.getCacheData = (args: unknown): Promise<XpowerGpuFreqCountStruct[]> | undefined => {
      let result: Promise<XpowerGpuFreqCountStruct[]> | undefined;
      result = xpowerGpuFreqCountDataSender(traceRow, args);
      return result;
    };
    traceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        traceRow,
        XpowerGpuFreqCountStruct.hoverXpowerStruct,
        `<span>Count:${XpowerGpuFreqCountStruct.hoverXpowerStruct?.value}</span>`
      );
    };
    traceRow.findHoverStruct = (): void => {
      XpowerGpuFreqCountStruct.hoverXpowerStruct = traceRow.getHoverStruct();
    };
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerGpuFreqCount as XpowerGpuFreqCountRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    folder.addChildTraceRow(traceRow);
  }

  private xpowerGpuFreqCountSupplierFrame(traceRow: TraceRow<XpowerGpuFreqCountStruct>): void {
    traceRow.supplierFrame = (): Promise<XpowerGpuFreqCountStruct[]> => {
      return xpowerGpuFreqCountDataSender(traceRow).then((resultXpower: Array<XpowerGpuFreqCountStruct>) => {
        return resultXpower;
      });
    };
  }

  async initThreadInfoData(folder: TraceRow<BaseStruct>, valueType: string, traceId?: string): Promise<void> {
    let value = '';
    let rowId = '';
    let rowName = '';
    if (valueType === THREAD_ENERGY) {
      value = 'Energy';
      rowId = 'thread_energy';
      rowName = 'Thread Energy';
    } else if (valueType === THREAD_LOAD) {
      value = 'Load';
      rowId = 'thread_loads';
      rowName = 'Thread Load';
    }
    let traceRow = TraceRow.skeleton<XpowerThreadInfoStruct>(traceId);
    traceRow.rowId = rowId;
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_THREAD_INFO;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = `${ROW_HEIGHT}px`;
    traceRow.name = rowName;
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.setAttribute('children', '');
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.xpowerThreadInfoSupplierFrame(traceRow, valueType);
    traceRow.getCacheData = (args: unknown): Promise<XpowerThreadInfoStruct[]> | undefined => {
      let result: Promise<XpowerThreadInfoStruct[]>;
      result = xpowerThreadInfoDataSender(valueType, traceRow, args);
      return result.then((resultXpower: Array<XpowerThreadInfoStruct>) => {
        for (let index = 0; index < resultXpower.length; index++) {
          let item = resultXpower[index];
          item.threadName = SpSystemTrace.DATA_DICT.get(resultXpower[index].threadNameId!) || '';
          item.valueType = valueType;
        }
        return resultXpower;
      });
    };
    traceRow.focusHandler = (ev): void => {
      this.setTips(traceRow, value);
    };
    traceRow.findHoverStruct = (): void => {
      XpowerThreadInfoStruct.hoverXpowerStruct = traceRow.getHoverStruct();
    };
    this.xpowerThreadInfoThreadHandler(traceRow, valueType);
    folder.addChildTraceRow(traceRow);
  }

  private xpowerThreadInfoSupplierFrame(traceRow: TraceRow<XpowerThreadInfoStruct>, valueType: string): void {
    traceRow.supplierFrame = (): Promise<XpowerThreadInfoStruct[]> => {
      let promiseData = xpowerThreadInfoDataSender(valueType, traceRow);
      if (promiseData === null) {
        return new Promise<Array<XpowerThreadInfoStruct>>((resolve) => resolve([]));
      } else {
        return promiseData.then((resultXpower: Array<XpowerThreadInfoStruct>) => {
          for (let index = 0; index < resultXpower.length; index++) {
            let item = resultXpower[index];
            item.threadName = SpSystemTrace.DATA_DICT.get(resultXpower[index].threadNameId!) || '';
            item.valueType = valueType;
          }
          return this.getThreadInfoDrawData(resultXpower, valueType);
        });
      }
    };
  }

  private setDataMap(resultXpower: Array<XpowerThreadInfoStruct>): Map<number, Array<XpowerThreadInfoStruct>> {
    let threadInfoStructMap = new Map();
    resultXpower.forEach((item: XpowerThreadInfoStruct) => {
      const startNS = item.startNS;
      if (threadInfoStructMap.has(startNS)) {
        const data = threadInfoStructMap.get(startNS)!;
        data.push(item);
      } else {
        const data: XpowerThreadInfoStruct[] = [];
        data.push(item);
        threadInfoStructMap.set(startNS, data);
      }
    });
    return threadInfoStructMap;
  }

  private getThreadInfoDrawData(
    resultXpower: Array<XpowerThreadInfoStruct>,
    valueType: string
  ): XpowerThreadInfoStruct[] {
    let newArr: XpowerThreadInfoStruct[] = [];
    let sumOfRemainingValues = 0;
    let sumOfRemainingTimes = 0;
    let maxValue = 0;
    let itemArraySum = 0;
    this.threadInfoStructMap = this.setDataMap(resultXpower);
    for (let itemArray of this.threadInfoStructMap.values()) {
      itemArray.sort((a, b) => {
        return b.value - a.value;
      });
      if (itemArray.length > 10) {
        newArr = JSON.parse(JSON.stringify(itemArray.slice(0, 10)));
        sumOfRemainingValues = itemArray.slice(9).reduce((acc, obj) => acc + obj.value, 0);
        sumOfRemainingTimes = itemArray.slice(9).reduce((acc, obj) => acc + obj.threadTime, 0);
        newArr[9].value = sumOfRemainingValues;
        newArr[9].threadTime = sumOfRemainingTimes;
        newArr[9].threadName = 'other';
      } else {
        newArr = JSON.parse(JSON.stringify(itemArray));
      }
      itemArraySum = newArr.reduce((acc, obj) => acc + obj.value, 0);
      if (itemArraySum > maxValue) {
        maxValue = itemArraySum;
      }
      this.threadInfoStructMap.set(itemArray[0].startNS, newArr);
    }
    if (valueType === THREAD_ENERGY) {
      XpowerThreadInfoStruct.energyMaxValue = maxValue;
      this.threadEnergyStructMap = this.threadInfoStructMap;
      XpowerThreadInfoStruct.threadEnergyStructMap = this.setDataMap(resultXpower);
    } else if (valueType === THREAD_LOAD) {
      XpowerThreadInfoStruct.loadMaxValue = maxValue;
      this.threadLoadStructMap = this.threadInfoStructMap;
      XpowerThreadInfoStruct.threadLoadStructMap = this.setDataMap(resultXpower);
    }
    let resultXpowerLit = Array.from(this.threadInfoStructMap.values()).reduce(
      (acc, valueArray) => acc.concat(valueArray),
      []
    );
    //@ts-ignore
    return resultXpowerLit;
  }

  private setTips(traceRow: TraceRow<XpowerThreadInfoStruct>, value: string): void {
    let tipsHtml = '';
    if (XpowerThreadInfoStruct.hoverXpowerStruct) {
      let hoverData: XpowerThreadInfoStruct[] = [];
      let unit = '';
      if (XpowerThreadInfoStruct.hoverXpowerStruct.valueType === THREAD_ENERGY) {
        hoverData = this.threadEnergyStructMap!.get(XpowerThreadInfoStruct.hoverXpowerStruct.startNS) || [];
        unit = 'mAh';
      } else if (XpowerThreadInfoStruct.hoverXpowerStruct.valueType === THREAD_LOAD) {
        hoverData = this.threadLoadStructMap!.get(XpowerThreadInfoStruct.hoverXpowerStruct.startNS) || [];
        unit = '%';
      }
      hoverData = [...hoverData].reverse();
      for (let i = 0; i < hoverData.length; i++) {
        if (hoverData[i].value > 0) {
          tipsHtml += `<div style=" display: flex; flex-wrap: nowrap; justify-content: space-between;">
                <div style=" line-height: 20px; flex-grow: 2; flex-shrink: 1; flex-basis: auto;">Name: ${
                  hoverData[i].threadName! || ''
                }</div>
                <div style="line-height: 20px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">&nbsp;&nbsp;Duration: ${
                  hoverData[i].threadTime! || 0
                }&nbsp;ms</div>
                <div style="line-height: 20px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">&nbsp;&nbsp;${value}: ${
            hoverData[i].value! || 0
          }&nbsp;${unit}</div>
            </div>`;
        }
      }
    }
    this.trace?.displayTip(traceRow, XpowerThreadInfoStruct.hoverXpowerStruct, `${tipsHtml}`);
  }

  private xpowerThreadInfoThreadHandler(traceRow: TraceRow<XpowerThreadInfoStruct>, valueType: string): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerThreadInfo as XpowerThreadInfoRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: valueType,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  private xpowerGpuFreqSupplierFrame(traceRow: TraceRow<XpowerGpuFreqStruct>): void {
    traceRow.supplierFrame = (): Promise<XpowerGpuFreqStruct[]> => {
      let promiseData = xpowerGpuFreqDataSender(traceRow);
      if (promiseData === null) {
        return new Promise<Array<XpowerGpuFreqStruct>>((resolve) => resolve([]));
      } else {
        return promiseData.then((resultXpower: Array<XpowerGpuFreqStruct>) => {
          return this.getGpuFreqDrawData(resultXpower);
        });
      }
    };
  }

  private setGpuFreqDataMap(resultXpower: Array<XpowerGpuFreqStruct>): Map<number, Array<XpowerGpuFreqStruct>> {
    let gpuFreqStructMap = new Map();
    resultXpower.forEach((item: XpowerGpuFreqStruct, index: number) => {
      const startNS = item.startNS;
      if (gpuFreqStructMap.has(startNS)) {
        const data = gpuFreqStructMap.get(startNS)!;
        data.push(item);
      } else {
        const data = Array<XpowerGpuFreqStruct>();
        data.push(item);
        gpuFreqStructMap.set(startNS, data);
      }
      let hoverHtml = '';
      if (item.runTime > 0) {
        hoverHtml = `<div style=" display: flex; flex-wrap: nowrap; justify-content: space-between;">
            <div style="line-height: 20px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">frequency: ${
              item.frequency! || 0
            }</div>
            <div style=" line-height: 20px; flex-grow: 2; flex-shrink: 1; flex-basis: auto;">&nbsp;&nbsp;runTime: ${
              item.runTime! || 0
            }&nbsp;ms</div>
            <div style="line-height: 20px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">&nbsp;&nbsp;idleTime: ${
              item.idleTime! || 0
            }&nbsp;ms</div>
        </div>`;
      }
      item.hoverHtml = hoverHtml;
    });
    return gpuFreqStructMap;
  }

  private sumTime(arr: Array<XpowerGpuFreqStruct>): Array<XpowerGpuFreqStruct> {
    return arr.reduce((accumulator: Array<XpowerGpuFreqStruct>, current) => {
      const { frequency, runTime, idleTime } = current;
      const existingEntry = accumulator.find((entry) => entry.frequency === frequency);
      if (existingEntry) {
        existingEntry.runTime += runTime;
        existingEntry.idleTime += idleTime;
      } else {
        accumulator.push({ ...current });
      }
      return accumulator;
    }, []);
  }

  private getGpuFreqDrawData(resultXpower: Array<XpowerGpuFreqStruct>): XpowerGpuFreqStruct[] {
    this.gpuFreqStructMap = new Map();
    this.gpuFreqStructMap = this.setGpuFreqDataMap(resultXpower);
    for (let itemArray of this.gpuFreqStructMap.values()) {
      itemArray = this.sumTime(itemArray);
      itemArray.sort((a, b) => {
        return b.runTime - a.runTime;
      });
      this.gpuFreqStructMap.set(itemArray[0].startNS, itemArray);
    }
    XpowerGpuFreqStruct.gpuFreqStructMap = this.gpuFreqStructMap;
    let resultXpowerLit = Array.from(this.gpuFreqStructMap.values()).reduce(
      (acc, valueArray) => acc.concat(valueArray),
      []
    );
    return resultXpowerLit;
  }

  private xpowerStatisticThreadHandler(traceRow: TraceRow<XpowerStatisticStruct>): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerStatistic as XpowerStatisticRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initXpowerStatisticData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let traceRow = TraceRow.skeleton<XpowerStatisticStruct>(traceId);
    traceRow.rowId = 'Statistic';
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_STATISTIC;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '200px';
    traceRow.setAttribute('height', '200px');
    let element = traceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
    element!.style.height = '200px';
    traceRow.name = 'Statistic';
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.setAttribute('children', '');

    let list = [
      'audio',
      'bluetooth',
      'camera',
      'cpu',
      'display',
      'flashlight',
      'gpu',
      'location',
      'wifiscan',
      'wifi',
      'modem',
    ];
    traceRow.rowSettingCheckBoxList = list;
    traceRow.addRowSettingCheckBox();
    traceRow.rowSetting = 'enable';
    traceRow.rowSettingPopoverDirection = 'bottomLeft';
    traceRow.onRowSettingCheckBoxChangeHandler = (value: boolean[]): void => {
      this.trace.refreshCanvas(false);
    };
    traceRow.supplierFrame = (): Promise<XpowerStatisticStruct[]> =>
      xpowerStatisticDataSender(traceRow).then((res): XpowerStatisticStruct[] => {
        res.forEach((item) => {
          item.typeStr = SpSystemTrace.DATA_DICT.get(item.type)!;
        });
        return res;
      });
    traceRow.getCacheData = (args: unknown): Promise<XpowerStatisticStruct[]> | undefined => {
      let result: Promise<XpowerStatisticStruct[]> | undefined;
      result = xpowerStatisticDataSender(traceRow, args);
      return result;
    };
    traceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        traceRow,
        XpowerStatisticStruct.hoverXpowerStruct,
        XpowerStatisticStruct.hoverXpowerStruct?.hoverHtml!
      );
    };
    this.xpowerStatisticThreadHandler(traceRow);
    folder.addChildTraceRow(traceRow);
  }

  private xpowerAppDetailThreadHandler(traceRow: TraceRow<XpowerAppDetailStruct>): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerAppDetail as XpowerAppDetailRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initXpowerAppDetatilDisplayData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let traceRow = TraceRow.skeleton<XpowerAppDetailStruct>(traceId);
    traceRow.rowId = 'AppDetailDisplay';
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '200px';
    traceRow.setAttribute('height', '200px');
    let element = traceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
    element!.style.height = '200px';
    traceRow.name = 'Display';
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.setAttribute('children', '');

    let list = ['180hz', '120hz', '90hz', '60hz', '45hz', '30hz', '24hz', '15hz', '10hz', '5hz', '1hz'];
    traceRow.rowSettingCheckBoxList = list;
    traceRow.addRowSettingCheckBox();
    traceRow.rowSetting = 'enable';
    traceRow.rowSettingPopoverDirection = 'bottomLeft';
    traceRow.onRowSettingCheckBoxChangeHandler = (value: boolean[]): void => {
      this.trace.refreshCanvas(false);
    };

    traceRow.supplierFrame = (): Promise<XpowerAppDetailStruct[]> =>
      xpowerAppDetailDataSender(traceRow).then((res): XpowerAppDetailStruct[] => {
        return res;
      });
    traceRow.getCacheData = (args: unknown): Promise<XpowerAppDetailStruct[]> | undefined => {
      let result: Promise<XpowerAppDetailStruct[]> | undefined;
      result = xpowerAppDetailDataSender(traceRow, args);
      return result;
    };
    traceRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        traceRow,
        XpowerAppDetailStruct.hoverXpowerStruct,
        XpowerAppDetailStruct.hoverXpowerStruct?.hoverHtml!
      );
    };
    this.xpowerAppDetailThreadHandler(traceRow);
    folder.addChildTraceRow(traceRow);
  }

  private xpowerWifiThreadHandler(traceRow: TraceRow<XpowerWifiStruct>, name: string): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerWifi as XpowerWifiRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          name: name,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initXpowerWifiData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let name = ['WIFIPackets', 'WIFIBytes'];
    for (let it of name) {
      let traceRow = TraceRow.skeleton<XpowerWifiStruct>(traceId);
      traceRow.rowId = it;
      traceRow.rowType = it === name[0] ? TraceRow.ROW_TYPE_XPOWER_WIFI_PACKETS : TraceRow.ROW_TYPE_XPOWER_WIFI_BYTES;
      traceRow.rowParentId = folder.rowId;
      traceRow.style.height = '100px';
      traceRow.setAttribute('height', '100px');
      let element = traceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
      element!.style.height = '100px';
      traceRow.name = it;
      traceRow.rowHidden = !folder.expansion;
      traceRow.folderTextLeft = 40;
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      traceRow.setAttribute('children', '');
      traceRow.rowSettingCheckBoxList = ['tx', 'rx'];
      traceRow.addRowSettingCheckBox();
      traceRow.rowSetting = 'enable';
      traceRow.rowSettingPopoverDirection = 'bottomLeft';
      traceRow.onRowSettingCheckBoxChangeHandler = (value: boolean[]): void => {
        this.trace.refreshCanvas(false);
      };
      traceRow.supplierFrame = (): Promise<XpowerWifiStruct[]> =>
        xpowerWifiDataSender(traceRow, it).then((res): XpowerWifiStruct[] => {
          return res;
        });
      traceRow.getCacheData = (args: unknown): Promise<XpowerWifiStruct[]> | undefined => {
        let result: Promise<XpowerWifiStruct[]> | undefined;
        result = xpowerWifiDataSender(traceRow, it, args);
        return result;
      };
      traceRow.focusHandler = (ev): void => {
        it === 'WIFIPackets'
          ? this.trace?.displayTip(
              traceRow,
              XpowerWifiStruct.hoverPacketsStruct,
              XpowerWifiStruct.hoverPacketsStruct?.hoverHtmlPackets!
            )
          : this.trace?.displayTip(
              traceRow,
              XpowerWifiStruct.hoverBytesStruct,
              XpowerWifiStruct.hoverBytesStruct?.hoverHtmlBytes!
            );
      };
      this.xpowerWifiThreadHandler(traceRow, it);
      folder.addChildTraceRow(traceRow);
    }
  }

  private xpowerGpuFreqThreadHandler(traceRow: TraceRow<XpowerGpuFreqStruct>): void {
    traceRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      (renders.xpowerGpuFreq as XpowerGpuFreqRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
  }

  async initGpuFreqData(folder: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let traceRow = TraceRow.skeleton<XpowerGpuFreqStruct>(traceId);
    traceRow.rowId = 'gpu-frequency';
    traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_GPU_FREQUENCY;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = `${ROW_HEIGHT}px`;
    traceRow.name = 'GPU Freq';
    traceRow.rowHidden = !folder.expansion;
    traceRow.folderTextLeft = 40;
    traceRow.setAttribute('children', '');
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    let freqList = await queryFreq();
    // @ts-ignore
    const values = freqList.map((item) => item.frequency.toString());
    let freqSet = new Set(values);
    traceRow.rowSettingCheckBoxList = [...freqSet];
    traceRow.addRowSettingCheckBox();
    traceRow.rowSetting = 'enable';
    traceRow.rowSettingPopoverDirection = 'bottomLeft';
    traceRow.onRowSettingCheckBoxChangeHandler = (value: boolean[]): void => {
      this.trace.refreshCanvas(false);
    };
    this.xpowerGpuFreqSupplierFrame(traceRow);
    traceRow.getCacheData = (args: unknown): Promise<XpowerGpuFreqStruct[]> | undefined => {
      let result: Promise<XpowerGpuFreqStruct[]> | undefined;
      result = xpowerGpuFreqDataSender(traceRow, args);
      return result;
    };
    traceRow.focusHandler = (ev): void => {
      let html =
        (XpowerGpuFreqStruct.hoverXpowerStruct &&
          XpowerGpuFreqStruct.hoverMap.get(XpowerGpuFreqStruct.hoverXpowerStruct.startNS)) ||
        '';
      this.trace?.displayTip(traceRow, XpowerGpuFreqStruct.hoverXpowerStruct, html);
    };
    this.xpowerGpuFreqThreadHandler(traceRow);
    folder.addChildTraceRow(traceRow);
  }
}

// 鼠标悬浮时转换xpower泳道名
export function convertTitle(title: string): string {
  switch (title) {
    case 'Battery.Capacity':
      return '电池容量(单位mAh)';
    case 'Battery.Charge':
      return '充电状态(充电1,非充电0)';
    case 'Battery.GasGauge':
      return '电池剩余电量(单位mAh)';
    case 'Battery.Level':
      return '电池百分比';
    case 'Battery.RealCurrent':
      return '实时电流(单位mAh,充电时为正数,耗电时为负数)';
    case 'Battery.Screen':
      return '屏幕状态(亮屏1,灭屏0)';
    case 'ThermalReport.ShellTemp':
      return '外壳温度(单位℃)';
    case 'ThermalReport.ThermalLevel':
      return '温度等级';
    default:
      return title;
  }
}

// 鼠标悬浮ThermalReport.ThermalLevel泳道时转换悬浮框内容
export function convertHoverValue(value: string): string {
  switch (value) {
    case '0':
      return 'COOL';
    case '1':
      return 'WARM';
    case '2':
      return 'HOT';
    case '3':
      return 'OVERHEATED';
    default:
      return value;
  }
}
