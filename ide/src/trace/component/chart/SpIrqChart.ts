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
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { IrqRender, IrqStruct } from '../../database/ui-worker/ProcedureWorkerIrq';
import { irqDataSender } from '../../database/data-trafic/IrqDataSender';
import { queryAllIrqNames, queryIrqList } from '../../database/sql/Irq.sql';
import { rowThreadHandler } from './SpChartManager';
import { BaseStruct } from '../../bean/BaseStruct';

export class SpIrqChart {
  private readonly trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(parentRow?: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
    let irqStartTime = new Date().getTime();
    let irqList = await queryIrqList(traceId);
    if (irqList.length === 0) {
      return;
    }
    let folder = await this.initFolder(traceId);
    parentRow?.addChildTraceRow(folder);
    await this.initData(folder, irqStartTime, irqList, traceId);
  }

  async initData(
    folder: TraceRow<BaseStruct>,
    irqStartTime: number,
    irqList: Array<{ name: string; cpu: number }>,
    traceId?: string,
  ): Promise<void> {
    //加载irq table所有id和name数据
    let irqNamesArray = await queryAllIrqNames(traceId);
    let irqNameMap: Map<number, string> = new Map();
    irqNamesArray.forEach((it) => {
      irqNameMap.set(it.id, it.ipiName);
    });
    info('irqList data size is: ', irqList!.length);
    if (!traceId) {
      this.trace.rowsEL?.appendChild(folder);
    }
    for (let i = 0; i < irqList.length; i++) {
      const it = irqList[i];
      this.addIrqRow(it, i, folder, irqNameMap, traceId);
    }
    let durTime = new Date().getTime() - irqStartTime;
    info('The time to load the ClockData is: ', durTime);
  }

  addIrqRow(
    it: { name: string; cpu: number },
    index: number,
    folder: TraceRow<BaseStruct>,
    irqNameMap: Map<number, string>,
    traceId?: string,
  ): void {
    let traceRow = TraceRow.skeleton<IrqStruct>(traceId);
    traceRow.rowId = it.name + it.cpu;
    traceRow.rowType = TraceRow.ROW_TYPE_IRQ;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '40px';
    traceRow.name = `${it.name} Cpu ${it.cpu}`;
    traceRow.rowHidden = !folder.expansion;
    traceRow.setAttribute('children', '');
    traceRow.setAttribute('callId', `${it.cpu}`);
    traceRow.setAttribute('cat', `${it.name}`);
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.supplierFrame = (): Promise<IrqStruct[]> => {
      return irqDataSender(it.cpu, it.name, traceRow).then((irqs) => {
        irqs.forEach((irq): void => {
          let irqName = irqNameMap.get(irq.id!);
          irq.name = irqName || '';
        });
        return irqs;
      });
    };
    traceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        traceRow,
        IrqStruct.hoverIrqStruct,
        `<span>${IrqStruct.hoverIrqStruct?.name || ''}</span>`
      );
    };
    traceRow.findHoverStruct = (): void => {
      IrqStruct.hoverIrqStruct = traceRow.getHoverStruct();
    };
    traceRow.onThreadHandler = rowThreadHandler<IrqRender>(
      'irq',
      'context',
      {
        type: it.name,
        index: index,
      },
      traceRow,
      this.trace
    );
    folder.addChildTraceRow(traceRow);
  }

  async initFolder(traceId?: string): Promise<TraceRow<BaseStruct>> {
    let irqFolder = TraceRow.skeleton(traceId);
    irqFolder.rowId = 'Irqs';
    irqFolder.index = 0;
    irqFolder.rowType = TraceRow.ROW_TYPE_IRQ_GROUP;
    irqFolder.rowParentId = '';
    irqFolder.style.height = '40px';
    irqFolder.folder = true;
    irqFolder.name = 'Irqs'; /* & I/O Latency */
    irqFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    irqFolder.selectChangeHandler = this.trace.selectChangeHandler;
    irqFolder.supplier = (): Promise<Array<BaseStruct>> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    irqFolder.onThreadHandler = (useCache): void => {
      irqFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (irqFolder.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, irqFolder.frame.width, irqFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          irqFolder
        );
      }
      irqFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    return irqFolder;
  }
}
