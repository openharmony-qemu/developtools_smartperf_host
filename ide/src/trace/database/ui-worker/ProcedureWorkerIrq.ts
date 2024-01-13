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

import {
  BaseStruct,
  dataFilterHandler,
  isFrameContainPoint,
  Rect,
  Render,
  drawString,
  drawLoadingFrame,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import {SpSystemTrace} from "../../component/SpSystemTrace";

export class IrqRender extends Render {
  renderMainThread(
    irqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      index: number;
    },
    row: TraceRow<IrqStruct>
  ) {
    IrqStruct.index = irqReq.index;
    let irqList = row.dataList;
    let irqFilter = row.dataListCache;
    dataFilterHandler(irqList, irqFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: irqReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(irqReq.context, irqFilter, row);
    irqReq.context.beginPath();
    let find = false;
    for (let re of irqFilter) {
      IrqStruct.draw(irqReq.context, re, row.isHover);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        IrqStruct.hoverIrqStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) IrqStruct.hoverIrqStruct = undefined;
    irqReq.context.closePath();
    irqReq.context.globalAlpha = 0.8;
    irqReq.context.fillStyle = '#f0f0f0';
    irqReq.context.globalAlpha = 1;
    irqReq.context.fillStyle = '#333';
    irqReq.context.textBaseline = 'middle';
  }
}

const padding = 3;
export function IrqStructOnClick(clickRowType: string,sp:SpSystemTrace) {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_IRQ && IrqStruct.hoverIrqStruct) {
      IrqStruct.selectIrqStruct = IrqStruct.hoverIrqStruct;
      sp.traceSheetEL?.displayIrqData(IrqStruct.selectIrqStruct);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject();
    }else{
      resolve(null);
    }
  });
}
export class IrqStruct extends BaseStruct {
  static maxValue: number = 0;
  static maxName: string = '';
  static hoverIrqStruct: IrqStruct | undefined;
  static selectIrqStruct: IrqStruct | undefined;
  static index = 0;
  id: number | undefined;
  startNS: number | undefined;
  name: string | undefined;
  dur: number | undefined; //自补充，数据库没有返回
  textMetricsWidth: number | undefined; //自补充
  argSetId: number | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: IrqStruct, isHover: boolean) {
    if (data.frame) {
      ctx.fillStyle = ColorUtils.colorForName(data.name || '');
      ctx.strokeStyle = '#232c5d';
      if ((data === IrqStruct.hoverIrqStruct && isHover) || data === IrqStruct.selectIrqStruct) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(data.frame.x, data.frame.y + padding, data.frame.width, data.frame.height - padding * 2);
        ctx.lineWidth = 2;
        ctx.strokeRect(data.frame.x, data.frame.y + padding, data.frame.width - 2, data.frame.height - padding * 2);
      } else {
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        ctx.fillRect(data.frame.x, data.frame.y + padding, data.frame.width, data.frame.height - padding * 2);
      }
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 1;
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.font = '8px sans-serif';
      data.frame.width > 7 && drawString(ctx, data.name || '', 2, data.frame, data);
    }
  }
}
