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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, isFrameContainPoint } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class LtpoRender {
  renderMainThread(
    req: {
      ltpoContext: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    ltpoRow: TraceRow<LtpoStruct>
  ): void {
    let list = ltpoRow.dataListCache;
    LtpoStruct.maxVal = 0;
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].value) > LtpoStruct.maxVal) LtpoStruct.maxVal = Number(list[i].value);
    }
    let filter = ltpoRow.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startTs',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: ltpoRow.frame,
      paddingTop: 5,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    req.ltpoContext.globalAlpha = 0.6;
    drawLoadingFrame(req.ltpoContext, filter, ltpoRow);
    req.ltpoContext.beginPath();
    let find = false;
    for (let re of filter) {
      if (ltpoRow.isHover && re.frame && isFrameContainPoint(re.frame, ltpoRow.hoverX, ltpoRow.hoverY)) {
        LtpoStruct.hoverLtpoStruct = re;
        find = true;
      }
      LtpoStruct.draw(req.ltpoContext, re);
      if (!find && ltpoRow.isHover) {
        LtpoStruct.hoverLtpoStruct = undefined;
      }
      req.ltpoContext.closePath();
    }
  }
}

export class LtpoStruct extends BaseStruct {
  static hoverLtpoStruct: LtpoStruct | undefined;
  static selectLtpoStruct: LtpoStruct | undefined;
  static maxVal: number | undefined;
  dur: number | undefined;
  name: string | undefined;
  presentId: number | undefined;
  ts: number | undefined;
  fanceId: number | undefined;
  fps: number | undefined;
  startTs: number | undefined;
  nextStartTs: string | number | undefined;
  nextDur: number | undefined;
  value: number | undefined;
  pid: number | undefined;
  itid: number | undefined;
  startTime: number | undefined;
  signaled: number | undefined;
  nowTime: number | undefined;
  cutTime: number | undefined;
  cutSendDur: number | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: LtpoStruct): void {
    if (data.frame) {
      ctx.fillStyle = '#9933FA';
      if (data === LtpoStruct.hoverLtpoStruct || data === LtpoStruct.selectLtpoStruct) {
        let drawHeight: number =
          LtpoStruct.maxVal !== 0
            ? Math.floor(((Number(data.value) || 0) * (data.frame.height || 0) * 1.0) / LtpoStruct.maxVal!)
            : 0;
        drawHeight = drawHeight < 1 ? 1 : drawHeight;
        ctx.globalAlpha = 1.0;
        ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '	#0000FF';
        ctx.strokeRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight);
      } else {
        ctx.globalAlpha = 0.6;
        let drawHeight: number = 0;
        if (LtpoStruct.maxVal !== 0) {
          drawHeight = Math.floor(((Number(data.value) || 0) * (data.frame.height || 0)) / LtpoStruct.maxVal!);
        }
        drawHeight = drawHeight < 1 ? 1 : drawHeight;
        ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight);
      }
    }
  }
}
