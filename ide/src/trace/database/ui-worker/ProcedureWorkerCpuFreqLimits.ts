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
  drawSelection,
} from './ProcedureWorkerCommon';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { convertJSON } from '../logic-worker/ProcedureLogicWorkerCommon';

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

  render(freqLimitsReq: RequestMessage, list: Array<any>, filter: Array<any>) {
    if (freqLimitsReq.lazyRefresh) {
      freqLimits(
        list,
        filter,
        freqLimitsReq.startNS,
        freqLimitsReq.endNS,
        freqLimitsReq.totalNS,
        freqLimitsReq.frame,
        freqLimitsReq.useCache || !freqLimitsReq.range.refresh
      );
    } else {
      if (!freqLimitsReq.useCache) {
        freqLimits(
          list,
          filter,
          freqLimitsReq.startNS,
          freqLimitsReq.endNS,
          freqLimitsReq.totalNS,
          freqLimitsReq.frame,
          false
        );
      }
    }
    if (freqLimitsReq.canvas) {
      freqLimitsReq.context.clearRect(0, 0, freqLimitsReq.frame.width, freqLimitsReq.frame.height);
      let arr = filter;
      if (arr.length > 0 && !freqLimitsReq.range.refresh && !freqLimitsReq.useCache && freqLimitsReq.lazyRefresh) {
        drawLoading(
          freqLimitsReq.context,
          freqLimitsReq.startNS,
          freqLimitsReq.endNS,
          freqLimitsReq.totalNS,
          freqLimitsReq.frame,
          arr[0].startNs,
          arr[arr.length - 1].startNs + arr[arr.length - 1].dur
        );
      }
      freqLimitsReq.context.beginPath();
      let maxFreq = freqLimitsReq.params.maxFreq;
      let maxFreqName = freqLimitsReq.params.maxFreqName;
      drawLines(freqLimitsReq.context, freqLimitsReq.xs, freqLimitsReq.frame.height, freqLimitsReq.lineColor);
      CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = undefined;
      if (freqLimitsReq.isHover) {
        for (let re of filter) {
          if (
            re.frame &&
            freqLimitsReq.hoverX >= re.frame.x &&
            freqLimitsReq.hoverX <= re.frame.x + re.frame.width &&
            freqLimitsReq.hoverY >= re.frame.y &&
            freqLimitsReq.hoverY <= re.frame.y + re.frame.height
          ) {
            CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = re;
            break;
          }
        }
      } else {
        CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = freqLimitsReq.params.hoverCpuFreqLimitsStruct;
      }
      CpuFreqLimitsStruct.selectCpuFreqLimitsStruct = freqLimitsReq.params.selectCpuFreqLimitsStruct;
      for (let re of filter) {
        CpuFreqLimitsStruct.draw(freqLimitsReq.context, re, maxFreq);
      }
      drawSelection(freqLimitsReq.context, freqLimitsReq.params);
      freqLimitsReq.context.closePath();
      let s = maxFreqName;
      let textMetrics = freqLimitsReq.context.measureText(s);
      freqLimitsReq.context.globalAlpha = 0.8;
      freqLimitsReq.context.fillStyle = '#f0f0f0';
      freqLimitsReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
      freqLimitsReq.context.globalAlpha = 1;
      freqLimitsReq.context.fillStyle = '#333';
      freqLimitsReq.context.textBaseline = 'middle';
      freqLimitsReq.context.fillText(s, 4, 5 + 9);
      drawFlagLine(
        freqLimitsReq.context,
        freqLimitsReq.flagMoveInfo,
        freqLimitsReq.flagSelectedInfo,
        freqLimitsReq.startNS,
        freqLimitsReq.endNS,
        freqLimitsReq.totalNS,
        freqLimitsReq.frame,
        freqLimitsReq.slicesTime
      );
    }
    // @ts-ignore
    self.postMessage({
      id: freqLimitsReq.id,
      type: freqLimitsReq.type,
      results: freqLimitsReq.canvas ? undefined : filter,
      hover: CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct,
    });
  }
}

export function freqLimits(
  freqLimitsList: Array<any>,
  res: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  use: boolean
) {
  if (use && res.length > 0) {
    res.forEach((it) => CpuFreqLimitsStruct.setFreqLimitFrame(it, 5, startNS || 0, endNS || 0, totalNS || 0, frame));
    return;
  }
  res.length = 0;
  if (freqLimitsList) {
    for (let i = 0, len = freqLimitsList.length; i < len; i++) {
      let it = freqLimitsList[i];
      if (i === freqLimitsList.length - 1) {
        it.dur = (endNS || 0) - (it.startNs || 0);
      } else {
        it.dur = (freqLimitsList[i + 1].startNs || 0) - (it.startNs || 0);
      }
      if ((it.startNs || 0) + (it.dur || 0) > (startNS || 0) && (it.startNs || 0) < (endNS || 0)) {
        CpuFreqLimitsStruct.setFreqLimitFrame(freqLimitsList[i], 5, startNS || 0, endNS || 0, totalNS || 0, frame);
        if (
          i > 0 &&
          (freqLimitsList[i - 1].frame?.x || 0) == (freqLimitsList[i].frame?.x || 0) &&
          (freqLimitsList[i - 1].frame?.width || 0) == (freqLimitsList[i].frame?.width || 0)
        ) {
        } else {
          res.push(it);
        }
      }
    }
  }
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
