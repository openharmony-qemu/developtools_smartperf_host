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
import { CpuFreqStruct, FreqRender } from '../../database/ui-worker/ProcedureWorkerFreq';
import { CpuStateRender, CpuStateStruct } from '../../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { folderSupplier, folderThreadHandler, rowThreadHandler } from './SpChartManager';
import { Utils } from '../trace/base/Utils';
import { cpuFreqDataSender } from '../../database/data-trafic/cpu/CpuFreqDataSender';
import { cpuStateSender } from '../../database/data-trafic/cpu/CpuStateSender';
import { cpuFreqLimitSender } from '../../database/data-trafic/cpu/CpuFreqLimitDataSender';
import {
  getCpuLimitFreqId,
  getCpuLimitFreqMax,
  queryCpuFreq,
  queryCpuMaxFreq,
  queryCpuStateFilter,
} from '../../database/sql/Cpu.sql';
import { BaseStruct } from '../../bean/BaseStruct';

export class SpFreqChart {
  private readonly trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(parentRow?: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let freqList = await queryCpuFreq(traceId);
    let cpuStateFilterIds = await queryCpuStateFilter(traceId);
    //@ts-ignore
    this.trace.stateRowsId = cpuStateFilterIds;
    let cpuFreqLimits = await getCpuLimitFreqId(traceId);
    let cpuFreqLimitsMax = await getCpuLimitFreqMax(cpuFreqLimits.map((limit) => limit.maxFilterId).join(','), traceId);
    if (freqList.length > 0) {
      let folderRow = this.createFolderRow(traceId);
      folderRow.rowId = 'Cpu Frequency';
      folderRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ_ALL;
      folderRow.name = 'Cpu Frequency';
      folderRow.selectChangeHandler = this.trace.selectChangeHandler;
      this.trace.rowsEL?.appendChild(folderRow);
      info('Cpu Freq data size is: ', freqList!.length);
      await this.addFreqRows(freqList, folderRow, traceId);
      if (parentRow) {
        parentRow.addChildTraceRow(folderRow);
      } else {
        this.trace.rowsEL?.appendChild(folderRow);
      }
    }
    if (cpuStateFilterIds.length > 0) {
      let folderRowState = this.createFolderRow();
      folderRowState.rowId = 'Cpu State';
      folderRowState.rowType = TraceRow.ROW_TYPE_CPU_STATE_ALL;
      folderRowState.name = 'Cpu State';
      folderRowState.selectChangeHandler = this.trace.selectChangeHandler;
      this.trace.rowsEL?.appendChild(folderRowState);
      this.addStateRows(cpuStateFilterIds, folderRowState, traceId);
      if (parentRow) {
        parentRow.addChildTraceRow(folderRowState);
      } else {
        this.trace.rowsEL?.appendChild(folderRowState);
      }
    }
    if (cpuFreqLimits.length > 0) {
      let folderRowLimit = this.createFolderRow();
      folderRowLimit.rowId = 'Cpu Freq Limit';
      folderRowLimit.rowType = TraceRow.ROW_TYPE_CPU_FREQ_LIMITALL;
      folderRowLimit.name = 'Cpu Freq Limit';
      folderRowLimit.selectChangeHandler = this.trace.selectChangeHandler;
      this.trace.rowsEL?.appendChild(folderRowLimit);
      this.addFreqLimitRows(cpuFreqLimits, cpuFreqLimitsMax, folderRowLimit, traceId);
      if (parentRow) {
        parentRow.addChildTraceRow(folderRowLimit);
      } else {
        this.trace.rowsEL?.appendChild(folderRowLimit);
      }
    }
  }

  createFolderRow(traceId?: string): TraceRow<BaseStruct> {
    let folder = TraceRow.skeleton<BaseStruct>(traceId);
    folder.rowParentId = '';
    folder.folder = true;
    folder.style.height = '40px';
    folder.rowHidden = folder.expansion;
    folder.setAttribute('children', '');
    folder.supplier = folderSupplier();
    folder.onThreadHandler = folderThreadHandler(folder, this.trace);
    return folder;
  }

  async addFreqRows(
    freqList: Array<{ cpu: number; filterId: number }>,
    folderRow: TraceRow<BaseStruct>,
    traceId?: string
  ): Promise<void> {
    let freqMaxList = await queryCpuMaxFreq(traceId);
    CpuFreqStruct.maxFreq = freqMaxList[0].maxFreq;
    let maxFreqObj = Utils.getFrequencyWithUnit(freqMaxList[0].maxFreq);
    CpuFreqStruct.maxFreq = maxFreqObj.maxFreq;
    CpuFreqStruct.maxFreqName = maxFreqObj.maxFreqName;
    for (let i = 0; i < freqList.length; i++) {
      const it = freqList[i];
      let traceRow = TraceRow.skeleton<CpuFreqStruct>(traceId);
      traceRow.rowId = `${it.filterId}`;
      traceRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ;
      traceRow.rowParentId = '';
      traceRow.style.height = '40px';
      traceRow.name = `Cpu ${it.cpu} Frequency`;
      traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      traceRow.selectChangeHandler = this.trace.selectChangeHandler;
      traceRow.supplierFrame = (): Promise<CpuFreqStruct[]> => cpuFreqDataSender(it.cpu, traceRow);
      traceRow.focusHandler = (): void => {
        this.trace?.displayTip(
          traceRow,
          CpuFreqStruct.hoverCpuFreqStruct,
          `<span>${ColorUtils.formatNumberComma(CpuFreqStruct.hoverCpuFreqStruct?.value!)} kHz</span>`
        );
      };
      traceRow.findHoverStruct = (): void => {
        CpuFreqStruct.hoverCpuFreqStruct = traceRow.getHoverStruct(true, false, 'value');
      };
      traceRow.onThreadHandler = rowThreadHandler<FreqRender>(
        'freq',
        'context',
        {
          type: `freq${it.cpu}`,
        },
        traceRow,
        this.trace
      );
      folderRow!.addChildTraceRow(traceRow);
    }
  }

  addStateRows(
    cpuStateFilterIds: Array<{ cpu: number; filterId: number }>,
    folderRowState: TraceRow<BaseStruct>,
    traceId?: string
  ): void {
    for (let it of cpuStateFilterIds) {
      let cpuStateRow = TraceRow.skeleton<CpuStateStruct>(traceId);
      cpuStateRow.rowId = `${it.filterId}`;
      cpuStateRow.rowType = TraceRow.ROW_TYPE_CPU_STATE;
      cpuStateRow.rowParentId = '';
      cpuStateRow.style.height = '40px';
      cpuStateRow.name = `Cpu ${it.cpu} State`;
      cpuStateRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      cpuStateRow.selectChangeHandler = this.trace.selectChangeHandler;
      cpuStateRow.supplierFrame = async (): Promise<CpuStateStruct[]> => {
        let rs = await cpuStateSender(it.filterId, cpuStateRow);
        rs.forEach((t) => (t.cpu = it.cpu));
        return rs;
      };
      cpuStateRow.focusHandler = (): void => {
        this.trace.displayTip(
          cpuStateRow,
          CpuStateStruct.hoverStateStruct,
          `<span>State: ${CpuStateStruct.hoverStateStruct?.value}</span>`
        );
      };
      cpuStateRow.findHoverStruct = (): void => {
        CpuStateStruct.hoverStateStruct = cpuStateRow.getHoverStruct();
      };
      cpuStateRow.onThreadHandler = rowThreadHandler<CpuStateRender>(
        'cpu-state',
        'cpuStateContext',
        {
          type: `cpu-state-${it.cpu}`,
          cpu: it.cpu,
        },
        cpuStateRow,
        this.trace
      );
      folderRowState!.addChildTraceRow(cpuStateRow);
    }
  }

  addFreqLimitRows(
    cpuFreqLimits: Array<CpuFreqRowLimit>,
    cpuFreqLimitsMax: Array<{ maxValue: number; filterId: number }>,
    folderRowLimit: TraceRow<BaseStruct>,
    traceId?: string
  ): void {
    for (let limit of cpuFreqLimits) {
      let findMax = Utils.getFrequencyWithUnit(
        cpuFreqLimitsMax.find((maxLimit) => maxLimit.filterId === limit.maxFilterId)?.maxValue || 0
      );
      let cpuFreqLimitRow = TraceRow.skeleton<CpuFreqLimitsStruct>(traceId);
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
      cpuFreqLimitRow.supplierFrame = async (): Promise<CpuFreqLimitsStruct[]> => {
        const res =
          await cpuFreqLimitSender(limit.maxFilterId, limit.minFilterId, limit.cpu, cpuFreqLimitRow);
        res.forEach((item) => (item.cpu = limit.cpu));
        return res;
      };
      cpuFreqLimitRow.focusHandler = (ev): void => {
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
      cpuFreqLimitRow.findHoverStruct = (): void => {
        CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = cpuFreqLimitRow.getHoverStruct();
      };
      cpuFreqLimitRow.onThreadHandler = rowThreadHandler<CpuFreqLimitRender>(
        'cpu-limit-freq',
        'context',
        {
          type: `cpu-limit-freq-${limit.cpu}`,
          cpu: limit.cpu,
          maxFreq: findMax?.maxFreq || 0,
          maxFreqName: findMax?.maxFreqName || '',
        },
        cpuFreqLimitRow,
        this.trace
      );
      folderRowLimit!.addChildTraceRow(cpuFreqLimitRow);
    }
  }
}

export class CpuFreqRowLimit {
  cpu: number = 0;
  maxFilterId: number = 0;
  minFilterId: number = 0;
}
