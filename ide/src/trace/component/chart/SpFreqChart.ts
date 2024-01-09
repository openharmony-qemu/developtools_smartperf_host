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
import { ColorUtils } from '../trace/base/ColorUtils';
import { CpuFreqLimitRender, CpuFreqLimitsStruct } from '../../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { CpuFreqStruct, FreqRender } from '../../database/ui-worker/ProcedureWorkerFreq';
import { CpuStateRender, CpuStateStruct } from '../../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { FolderSupplier, FolderThreadHandler } from './SpChartManager';
import { Utils } from '../trace/base/Utils';
import { cpuFreqDataSender } from '../../database/data-trafic/cpu/CpuFreqDataSender';
import { cpuStateSender } from '../../database/data-trafic/cpu/CpuStateSender';
import { cpuFreqLimitSender } from '../../database/data-trafic/cpu/CpuFreqLimitDataSender';
import {
  getCpuLimitFreqId,
  getCpuLimitFreqMax,
  queryCpuFreq,
  queryCpuMaxFreq,
  queryCpuStateFilter
} from "../../database/sql/Cpu.sql";
export class SpFreqChart {
  private trace: SpSystemTrace;
  private folderRow: TraceRow<any> | undefined;
  private folderRowState: TraceRow<any> | undefined;
  private folderRowLimit: TraceRow<any> | undefined;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init() {
    let freqList = await queryCpuFreq();
    let cpuStateFilterIds = await queryCpuStateFilter();
    let cpuFreqLimits = await getCpuLimitFreqId();
    let cpuFreqLimitsMax = await getCpuLimitFreqMax(cpuFreqLimits.map((limit) => limit.maxFilterId).join(','));
    if (freqList.length > 0) {
      this.folderRow = TraceRow.skeleton();
      this.folderRow.rowId = 'Cpu Frequency';
      this.folderRow.rowParentId = '';
      this.folderRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ_ALL;
      this.folderRow.style.height = '40px';
      this.folderRow.style.width = '100%';
      this.folderRow.name = 'Cpu Frequency';
      this.folderRow.folder = true;
      this.folderRow.rowHidden = this.folderRow!.expansion;
      this.folderRow.setAttribute('children', '');
      this.folderRow.supplier = FolderSupplier();
      this.folderRow.onThreadHandler = FolderThreadHandler(this.folderRow, this.trace);
      this.trace.rowsEL?.appendChild(this.folderRow);

      info('Cpu Freq data size is: ', freqList!.length);
      let freqMaxList = await queryCpuMaxFreq();
      CpuFreqStruct.maxFreq = freqMaxList[0].maxFreq;
      let maxFreqObj = Utils.getFrequencyWithUnit(freqMaxList[0].maxFreq);
      CpuFreqStruct.maxFreq = maxFreqObj.maxFreq;
      CpuFreqStruct.maxFreqName = maxFreqObj.maxFreqName;
      this.trace.stateRowsId = cpuStateFilterIds;
      for (let i = 0; i < freqList.length; i++) {
        const it = freqList[i];
        let traceRow = TraceRow.skeleton<CpuFreqStruct>();
        traceRow.rowId = `${it.filterId}`;
        traceRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ;
        traceRow.rowParentId = '';
        traceRow.style.height = '40px';
        traceRow.name = `Cpu ${it.cpu} Frequency`;
        traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        traceRow.selectChangeHandler = this.trace.selectChangeHandler;
        traceRow.supplierFrame = () => {
          return cpuFreqDataSender(it.cpu, traceRow); //queryCpuFreqData
        };
        traceRow.focusHandler = (ev) => {
          this.trace?.displayTip(
            traceRow,
            CpuFreqStruct.hoverCpuFreqStruct,
            `<span>${ColorUtils.formatNumberComma(CpuFreqStruct.hoverCpuFreqStruct?.value!)} kHz</span>`
          );
        };
        traceRow.findHoverStruct = () => {
          CpuFreqStruct.hoverCpuFreqStruct = traceRow.getHoverStruct(true,false, 'value');
        };
        traceRow.onThreadHandler = (useCache) => {
          let context: CanvasRenderingContext2D;
          if (traceRow.currentContext) {
            context = traceRow.currentContext;
          } else {
            context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          traceRow.canvasSave(context);
          (renders['freq'] as FreqRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: `freq${it.cpu}`,
            },
            traceRow
          );
          traceRow.canvasRestore(context, this.trace);
        };
        this.trace.rowsEL?.appendChild(traceRow);
        this.folderRow!.addChildTraceRow(traceRow);
      }
    }
    if (cpuStateFilterIds.length > 0) {
      this.folderRowState = TraceRow.skeleton();
      this.folderRowState.rowId = 'Cpu State';
      this.folderRowState.rowType = TraceRow.ROW_TYPE_CPU_STATE_ALL;
      this.folderRowState.style.height = '40px';
      this.folderRowState.folder = true;
      this.folderRowState.style.width = '100%';
      this.folderRowState.rowParentId = '';
      this.folderRowState.name = 'Cpu State';
      this.folderRowState.rowHidden = this.folderRowState!.expansion;
      this.folderRowState.setAttribute('children', '');
      this.folderRowState.supplier = FolderSupplier();
      this.folderRowState.onThreadHandler = FolderThreadHandler(this.folderRowState, this.trace);
      this.trace.rowsEL?.appendChild(this.folderRowState);

      for (let it of cpuStateFilterIds) {
        let cpuStateRow = TraceRow.skeleton<CpuStateStruct>();
        cpuStateRow.rowId = `${it.filterId}`;
        cpuStateRow.rowType = TraceRow.ROW_TYPE_CPU_STATE;
        cpuStateRow.rowParentId = '';
        cpuStateRow.style.height = '40px';
        cpuStateRow.name = `Cpu ${it.cpu} State`;
        cpuStateRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        cpuStateRow.selectChangeHandler = this.trace.selectChangeHandler;
        cpuStateRow.isHover = true;
        cpuStateRow.supplierFrame = () => {
          return cpuStateSender(it.filterId, cpuStateRow).then((rs) => {
            rs.forEach((t) => {
              t.cpu = it.cpu;
            });
            return rs;
          });
        };
        cpuStateRow.focusHandler = (ev) => {
          this.trace.displayTip(
            cpuStateRow,
            CpuStateStruct.hoverStateStruct,
            `<span>State: ${CpuStateStruct.hoverStateStruct?.value}</span>`
          );
        };
        cpuStateRow.findHoverStruct = () => {
          CpuStateStruct.hoverStateStruct = cpuStateRow.getHoverStruct();
        };
        cpuStateRow.onThreadHandler = (useCache: boolean) => {
          let context: CanvasRenderingContext2D;
          if (cpuStateRow.currentContext) {
            context = cpuStateRow.currentContext;
          } else {
            context = cpuStateRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          cpuStateRow.canvasSave(context);
          (renders['cpu-state'] as CpuStateRender).renderMainThread(
            {
              cpuStateContext: context,
              useCache: useCache,
              type: `cpu-state-${it.cpu}`,
              cpu: it.cpu,
            },
            cpuStateRow
          );
          cpuStateRow.canvasRestore(context, this.trace);
        };
        this.folderRowState!.addChildTraceRow(cpuStateRow);
      }
    }
    if (cpuFreqLimits.length > 0) {
      this.folderRowLimit = TraceRow.skeleton();
      this.folderRowLimit.rowId = 'Cpu Freq Limit';
      this.folderRowLimit.rowType = TraceRow.ROW_TYPE_CPU_FREQ_LIMITALL;
      this.folderRowLimit.style.height = '40px';
      this.folderRowLimit.rowParentId = '';
      this.folderRowLimit.folder = true;
      this.folderRowLimit.name = 'Cpu Freq Limit';
      this.folderRowLimit.rowHidden = this.folderRowLimit!.expansion;
      this.folderRowLimit.setAttribute('children', '');
      this.folderRowLimit.supplier = FolderSupplier();
      this.folderRowLimit.onThreadHandler = FolderThreadHandler(this.folderRowLimit, this.trace);
      this.trace.rowsEL?.appendChild(this.folderRowLimit);

      for (let limit of cpuFreqLimits) {
        let findMax = Utils.getFrequencyWithUnit(
          cpuFreqLimitsMax.find((maxLimit) => {
            return maxLimit.filterId == limit.maxFilterId;
          })?.maxValue || 0
        );
        let cpuFreqLimitRow = TraceRow.skeleton<CpuFreqLimitsStruct>();
        cpuFreqLimitRow.rowId = `${limit.cpu}`;
        cpuFreqLimitRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ_LIMIT;
        cpuFreqLimitRow.rowParentId = '';
        cpuFreqLimitRow.style.height = '40px';
        cpuFreqLimitRow.name = `Cpu ${limit.cpu} Freq Limit`;
        cpuFreqLimitRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        cpuFreqLimitRow.selectChangeHandler = this.trace.selectChangeHandler;
        cpuFreqLimitRow.setAttribute('maxFilterId', `${limit.maxFilterId}`);
        cpuFreqLimitRow.setAttribute('minFilterId', `${limit.minFilterId}`);
        cpuFreqLimitRow.setAttribute('cpu', `${limit.cpu}`);
        cpuFreqLimitRow.isHover = true;
        cpuFreqLimitRow.supplierFrame = () => {
          return cpuFreqLimitSender(limit.maxFilterId, limit.minFilterId, limit.cpu, cpuFreqLimitRow).then((res) => {
            res.forEach((item) => {
              item.cpu = limit.cpu;
            });
            return res;
          });
        };
        cpuFreqLimitRow.focusHandler = (ev) => {
          this.trace.displayTip(
            cpuFreqLimitRow,
            CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct,
            `<span>Max Freq: ${ColorUtils.formatNumberComma(
              CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct?.max || 0
            )} kHz</span><span>Min Freq: ${ColorUtils.formatNumberComma(
              CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct?.min || 0
            )} kHz</span>`
          );
        };
        cpuFreqLimitRow.findHoverStruct = () => {
          CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = cpuFreqLimitRow.getHoverStruct();
        };
        cpuFreqLimitRow.onThreadHandler = (useCache: boolean) => {
          let context: CanvasRenderingContext2D;
          if (cpuFreqLimitRow.currentContext) {
            context = cpuFreqLimitRow.currentContext;
          } else {
            context = cpuFreqLimitRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          cpuFreqLimitRow.canvasSave(context);
          (renders['cpu-limit-freq'] as CpuFreqLimitRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: `cpu-limit-freq-${limit.cpu}`,
              cpu: limit.cpu,
              maxFreq: findMax?.maxFreq || 0,
              maxFreqName: findMax?.maxFreqName || '',
            },
            cpuFreqLimitRow
          );
          cpuFreqLimitRow.canvasRestore(context, this.trace);
        };
        this.folderRowLimit!.addChildTraceRow(cpuFreqLimitRow);
      }
    }
  }
}

export class CpuFreqRowLimit {
  cpu: number = 0;
  maxFilterId: number = 0;
  minFilterId: number = 0;
}
