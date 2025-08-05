/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, drawString, Rect } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class DmaFenceRender {
  renderMainThread(
    req: {
      dmaFenceContext: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      maxValue: number;
      index: number;
      maxName: string;
    },
    DmaFenceRow: TraceRow<DmaFenceStruct>
  ): void {
    let list = DmaFenceRow.dataList;
    let filter = DmaFenceRow.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startTime',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: DmaFenceRow.frame,
      paddingTop: 8,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    let find = false;
    let offset = 3;
    drawLoadingFrame(req.dmaFenceContext, filter, DmaFenceRow);
    for (let re of filter) {
      let depth = re.dur === 0 ? 1 : 0;
      if (DmaFenceRow.isHover) {
        if (
          re.frame &&
          DmaFenceRow.hoverX >= re.frame.x - offset &&
          DmaFenceRow.hoverX <= re.frame.x + re.frame.width + offset &&
          DmaFenceRow.hoverY <= (depth + 1) * 24 + 8 &&
          DmaFenceRow.hoverY >= depth * 24 + 8
        ) {
          re.frame!.height = 24;
          re.frame!.y = re.dur === 0 ? 32 : 8;
          DmaFenceStruct.hoverDmaFenceStruct = re;
          find = true;
        }
      }
      req.dmaFenceContext.beginPath();
      req.dmaFenceContext.globalAlpha = 0.6;
      DmaFenceStruct.draw(req.dmaFenceContext, re, DmaFenceRow);
      if (!find && DmaFenceRow.isHover) {
        DmaFenceStruct.hoverDmaFenceStruct = undefined;
      }
      req.dmaFenceContext.closePath();
    }
  }
}

export function DmaFenceStructOnClick(
  rowType: string,
  sp: SpSystemTrace,
  entry?: DmaFenceStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (rowType === TraceRow.ROW_TYPE_DMA_FENCE && (DmaFenceStruct.hoverDmaFenceStruct || entry)) {
      DmaFenceStruct.selectDmaFenceStruct = entry || DmaFenceStruct.hoverDmaFenceStruct;
      sp.traceSheetEL?.displayDmaFenceData(DmaFenceStruct.selectDmaFenceStruct!, sp.currentRow!.dataListCache);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class DmaFenceStruct extends BaseStruct {
  static hoverDmaFenceStruct: DmaFenceStruct | undefined;
  static selectDmaFenceStruct: DmaFenceStruct | undefined;
  static maxVal: number | undefined = 0;
  static index = 0;
  static maxDepth: number = 0;
  value: number | undefined = 20;
  startTime: number | undefined;
  dur: number | undefined;
  id: number = 0;
  cat: string = '';
  seqno: string = '';
  sliceName: string = '';
  driver: string = '';
  context: string = '';
  depth: number = 0;

  static draw(ctx: CanvasRenderingContext2D, data: DmaFenceStruct, row: TraceRow<DmaFenceStruct>): void {
    if (data.frame) {
      if (data.dur === 0) {
        data.depth = 1;
      }
      if (data.depth > DmaFenceStruct.maxDepth) {
        DmaFenceStruct.maxDepth = data.depth;
        row.style.height = `${(DmaFenceStruct.maxDepth + 1) * 24 + 16}px`;
      }
      let colorIndex = Number(data.startTime?.toString().substring(-1));
      let color = ColorUtils.colorForTid(colorIndex);
      ctx.fillStyle = color;
      if (data === DmaFenceStruct.hoverDmaFenceStruct || data === DmaFenceStruct.selectDmaFenceStruct) {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#a56df5';
        ctx.fillRect(data.frame.x, data.depth * 24 + 8, data.frame.width < 1 ? 1 : data.frame.width, 24);
      } else {
        ctx.globalAlpha = 0.6;
        ctx.fillRect(data.frame.x, data.depth * 24 + 8, data.frame.width < 1 ? 1 : data.frame.width, 24);
      }
      //描边
      if (data.id === DmaFenceStruct.selectDmaFenceStruct?.id &&
        data.startTime === DmaFenceStruct.selectDmaFenceStruct?.startTime &&
        data.depth === DmaFenceStruct.selectDmaFenceStruct?.depth) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        let positionY = data.depth * 24 + 8;
        ctx.strokeRect(data.frame.x, positionY + 1, data.frame.width - 2, 22);
      }
      if (data.frame!.width > 8) {
        ctx.lineWidth = 1;
        ctx.fillStyle = ColorUtils.funcTextColor(
          ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.startTime!.toString() || '', 0, ColorUtils.FUNC_COLOR.length)]
        );
        ctx.textBaseline = 'middle';
        drawString(
          ctx,
          `${data.sliceName || ''}`,
          6,
          new Rect(data.frame!.x, data.depth * 24 + 8, data.frame!.width, 24),
          data
        );
      }
    }
  }
}
