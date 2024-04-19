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
import { getRowContext, rowThreadHandler } from './SpChartManager';

export class SpIrqChart {
  private trace: SpSystemTrace;
  private irqNameMap: Map<number, { name: string; ipiName: string }> = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let folder = await this.initFolder();
    await this.initData(folder);
  }

  //@ts-ignore
  async initData(folder: TraceRow<unknown>): Promise<void> {
    let irqStartTime = new Date().getTime();
    let irqList = await queryIrqList();
    if (irqList.length === 0) {
      return;
    }
    //加载irq table所有id和name数据
    let irqNamesArray = await queryAllIrqNames();
    irqNamesArray.forEach((it) => {
      this.irqNameMap.set(it.id, { ipiName: it.ipiName, name: it.name });
    });
    info('irqList data size is: ', irqList!.length);
    this.trace.rowsEL?.appendChild(folder);
    for (let i = 0; i < irqList.length; i++) {
      const it = irqList[i];
      this.addIrqRow(it, i, folder);
    }
    let durTime = new Date().getTime() - irqStartTime;
    info('The time to load the ClockData is: ', durTime);
  }

  //@ts-ignore
  addIrqRow(it: unknown, index: number, folder: TraceRow<unknown>): void {
    let traceRow = TraceRow.skeleton<IrqStruct>();
    //@ts-ignore
    traceRow.rowId = it.name + it.cpu;
    traceRow.rowType = TraceRow.ROW_TYPE_IRQ;
    traceRow.rowParentId = folder.rowId;
    traceRow.style.height = '40px';//@ts-ignore
    traceRow.name = `${it.name} Cpu ${it.cpu}`;
    traceRow.rowHidden = !folder.expansion;
    traceRow.setAttribute('children', '');//@ts-ignore
    traceRow.setAttribute('callId', `${it.cpu}`);//@ts-ignore
    traceRow.setAttribute('cat', `${it.name}`);
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.supplierFrame = (): Promise<IrqStruct[]> => {//@ts-ignore
      return irqDataSender(it.cpu, it.name, traceRow).then((irqs) => {
        irqs.forEach((irq): void => {
          let irqData = this.irqNameMap.get(irq.id!);//@ts-ignore
          irq.name = (it.name === 'irq' ? irqData?.ipiName : irqData?.name) || '';
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
      {//@ts-ignore
        type: it.name,
        index: index,
      },
      traceRow,
      this.trace
    );
    folder.addChildTraceRow(traceRow);
  }

  //@ts-ignore
  async initFolder(): Promise<TraceRow<unknown>> {
    let irqFolder = TraceRow.skeleton();
    irqFolder.rowId = 'Irs';
    irqFolder.index = 0;
    irqFolder.rowType = TraceRow.ROW_TYPE_IRQ_GROUP;
    irqFolder.rowParentId = '';
    irqFolder.style.height = '40px';
    irqFolder.folder = true;
    irqFolder.name = 'Irs'; /* & I/O Latency */
    irqFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    irqFolder.selectChangeHandler = this.trace.selectChangeHandler;//@ts-ignore
    irqFolder.supplier = (): Promise<Array<unknown>> => new Promise<Array<unknown>>((resolve) => resolve([]));
    irqFolder.onThreadHandler = (useCache): void => {
      irqFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (irqFolder.expansion) {// @ts-ignore
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
