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
  drawLoading,
  isFrameContainPoint,
  ns2x,
  drawLines,
  Render,
  drawFlagLine,
  RequestMessage,
  drawSelection, drawLoadingFrame,
} from '../ProcedureWorkerCommon';
import { ColorUtils } from '../../../component/trace/base/ColorUtils';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { convertJSON } from '../../logic-worker/ProcedureLogicWorkerCommon';
import {SpSystemTrace} from "../../../component/SpSystemTrace";

export class CpuFreqLimitRender extends Render {
  renderMainThread(
    cpuFreqLimitReq: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      cpu: number;
      type: string;
      maxFreq: number;
      maxFreqName: string;
    },
    row: TraceRow<CpuFreqLimitsStruct>
  ) {
    let list = row.dataList;
    let filter = row.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startNs',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: cpuFreqLimitReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(cpuFreqLimitReq.context, filter, row);
    cpuFreqLimitReq.context.beginPath();
    let maxFreq = cpuFreqLimitReq.maxFreq;
    let maxFreqName = cpuFreqLimitReq.maxFreqName;
    if (row.isHover) {
      for (let re of filter) {
        if (re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
          CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = re;
          break;
        }
      }
    }
    for (let re of filter) {
      CpuFreqLimitsStruct.draw(cpuFreqLimitReq.context, re, maxFreq);
    }
    cpuFreqLimitReq.context.closePath();
    let s = maxFreqName;
    let textMetrics = cpuFreqLimitReq.context.measureText(s);
    cpuFreqLimitReq.context.globalAlpha = 0.8;
    cpuFreqLimitReq.context.fillStyle = '#f0f0f0';
    cpuFreqLimitReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
    cpuFreqLimitReq.context.globalAlpha = 1;
    cpuFreqLimitReq.context.fillStyle = '#333';
    cpuFreqLimitReq.context.textBaseline = 'middle';
    cpuFreqLimitReq.context.fillText(s, 4, 5 + 9);
  }
}
export function CpuFreqLimitsStructOnClick(clickRowType: string, sp: SpSystemTrace) {
    return new Promise((resolve, reject) => {
      if (clickRowType === TraceRow.ROW_TYPE_CPU_FREQ_LIMIT && CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct) {
        CpuFreqLimitsStruct.selectCpuFreqLimitsStruct = CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct;
        sp.traceSheetEL?.displayFreqLimitData();
        sp.timerShaftEL?.modifyFlagList(undefined);
        reject();
      }else{
        resolve(null);
      }
    });
}
export class CpuFreqLimitsStruct extends BaseStruct {
  static hoverCpuFreqLimitsStruct: CpuFreqLimitsStruct | undefined;
  static selectCpuFreqLimitsStruct: CpuFreqLimitsStruct | undefined;
  static minAlpha = 0.4;
  static maxAlpha = 0.8;
  startNs: number | undefined;
  dur: number = 0;
  max: number | undefined;
  min: number | undefined;
  cpu: number = 0;

  static draw(ctx: CanvasRenderingContext2D, data: CpuFreqLimitsStruct, maxFreq: number) {
    if (data.frame) {
      let width = data.frame.width || 0;
      let drawMaxHeight: number = Math.floor(((data.max || 0) * (data.frame.height || 0)) / maxFreq);
      let drawMinHeight: number = Math.floor(((data.min || 0) * (data.frame.height || 0)) / maxFreq);
      let index = data.cpu || 0;
      index += 2;
      ctx.fillStyle = ColorUtils.colorForTid(index);
      ctx.strokeStyle = ColorUtils.colorForTid(index);
      if (
        data === CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct ||
        data === CpuFreqLimitsStruct.selectCpuFreqLimitsStruct
      ) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = this.minAlpha;
        this.drawArcLine(ctx, data, drawMaxHeight, drawMaxHeight - drawMinHeight);
        ctx.globalAlpha = this.maxAlpha;
        this.drawArcLine(ctx, data, drawMinHeight, drawMinHeight);
      } else {
        ctx.globalAlpha = this.minAlpha;
        ctx.lineWidth = 1;
        ctx.fillRect(
          data.frame.x,
          data.frame.y + data.frame.height - drawMaxHeight,
          width,
          drawMaxHeight - drawMinHeight
        );
        ctx.globalAlpha = this.maxAlpha;
        ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawMinHeight, width, drawMinHeight);
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
  }

  static drawArcLine(
    ctx: CanvasRenderingContext2D,
    data: CpuFreqLimitsStruct,
    yStartHeight: number,
    drawHeight: number
  ) {
    if (data.frame) {
      let width = data.frame.width || 0;
      ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - yStartHeight, width, drawHeight);
      ctx.globalAlpha = this.maxAlpha;
      ctx.beginPath();
      ctx.arc(data.frame.x, data.frame.y + data.frame.height - yStartHeight, 3, 0, 2 * Math.PI, true);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - yStartHeight);
      ctx.lineWidth = 3;
      ctx.lineTo(data.frame.x + width, data.frame.y + data.frame.height - yStartHeight);
      ctx.stroke();
    }
  }

  static setFreqLimitFrame(
    freqLimitNode: any,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: any
  ) {
    let x1: number, x2: number;
    if ((freqLimitNode.startNs || 0) < startNS) {
      x1 = 0;
    } else {
      x1 = ns2x(freqLimitNode.startNs || 0, startNS, endNS, totalNS, frame);
    }
    if ((freqLimitNode.startNs || 0) + (freqLimitNode.dur || 0) > endNS) {
      x2 = frame.width;
    } else {
      x2 = ns2x((freqLimitNode.startNs || 0) + (freqLimitNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let cpuFreqLimitsGetV: number = x2 - x1 <= 1 ? 1 : x2 - x1;
    if (!freqLimitNode.frame) {
      freqLimitNode.frame = {};
    }
    freqLimitNode.frame.x = Math.floor(x1);
    freqLimitNode.frame.y = frame.y + padding;
    freqLimitNode.frame.width = Math.ceil(cpuFreqLimitsGetV);
    freqLimitNode.frame.height = Math.floor(frame.height - padding * 2);
  }
}
