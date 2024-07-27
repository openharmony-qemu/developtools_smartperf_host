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
  drawLoadingFrame,
  ns2x,
  PerfRender,
  Rect,
  RequestMessage,
} from '../ProcedureWorkerCommon';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { ColorUtils } from '../../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../../component/SpSystemTrace';

export class CpuStateRender extends PerfRender {
  renderMainThread(
    req: {
      useCache: boolean;
      cpuStateContext: CanvasRenderingContext2D;
      type: string;
      cpu: number;
    },
    cpuStateRow: TraceRow<CpuStateStruct>
  ): void {
    let list = cpuStateRow.dataList;
    let filter = cpuStateRow.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startTs',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: cpuStateRow.frame,
      paddingTop: 5,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(req.cpuStateContext, filter, cpuStateRow);
    let path = new Path2D();
    let find = false;
    let offset = 3;
    let heights = [4, 8, 12, 16, 20, 24, 28, 32];
    for (let re of filter) {
      //@ts-ignore
      re.height = heights[re.value];
      CpuStateStruct.draw(req.cpuStateContext, path, re);
      if (cpuStateRow.isHover) {
        if (
          re.frame &&
          cpuStateRow.hoverX >= re.frame.x - offset &&
          cpuStateRow.hoverX <= re.frame.x + re.frame.width + offset
        ) {
          CpuStateStruct.hoverStateStruct = re;
          find = true;
        }
      }
    }
    if (!find && cpuStateRow.isHover) {
      CpuStateStruct.hoverStateStruct = undefined;
    }
    req.cpuStateContext.fill(path);
  }

  render(
    cpuStateReq: RequestMessage,
    list: Array<CpuStateStruct>,
    filter: Array<CpuStateStruct>,
    dataList2: Array<CpuStateStruct>
  ): void { }

  setFrameByArr(
    cpuStateRes: CpuStateStruct[],
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    arr2: CpuStateStruct[]
  ): void {
    let list: CpuStateStruct[] = arr2;
    cpuStateRes.length = 0;
    let pns = (endNS - startNS) / frame.width;
    let y = frame.y + 5;
    let frameHeight = frame.height - 10;
    let left = 0;
    let right = 0;
    for (let i = 0, j = list.length - 1, ib = true, jb = true; i < list.length, j >= 0; i++, j--) {
      if (list[j].startTs! <= endNS && jb) {
        right = j;
        jb = false;
      }
      if (list[i].startTs! + list[i].dur! >= startNS && ib) {
        left = i;
        ib = false;
      }
      if (!ib && !jb) {
        break;
      }
    }
    let slice = list.slice(left, right + 1);
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      if (!slice[i].frame) {
        slice[i].frame = new Rect(0, 0, 0, 0);
        slice[i].frame!.y = y;
        slice[i].frame!.height = frameHeight;
      }
      if (slice[i].dur! >= pns) {
        //@ts-ignore
        slice[i].v = true;
        CpuStateStruct.setFrame(slice[i], 5, startNS, endNS, totalNS, frame);
      } else {
        if (i > 0) {
          //@ts-ignore
          let c = slice[i].startTs - slice[i - 1].startTs - slice[i - 1].dur;
          if (c < pns && sum < pns) {
            //@ts-ignore
            sum += c + slice[i - 1].dur;
            //@ts-ignore
            slice[i].v = false;
          } else {
            //@ts-ignore
            slice[i].v = true;
            CpuStateStruct.setFrame(slice[i], 5, startNS, endNS, totalNS, frame);
            sum = 0;
          }
        }
      }
    }
    //@ts-ignore
    cpuStateRes.push(...slice.filter((it) => it.v));
  }

  setFrameByFilter(cpuStateRes: CpuStateStruct[], startNS: number, endNS: number, totalNS: number, frame: Rect): void {
    for (let i = 0, len = cpuStateRes.length; i < len; i++) {
      if (
        (cpuStateRes[i].startTs || 0) + (cpuStateRes[i].dur || 0) >= startNS &&
        (cpuStateRes[i].startTs || 0) <= endNS
      ) {
        CpuStateStruct.setFrame(cpuStateRes[i], 5, startNS, endNS, totalNS, frame);
      } else {
        cpuStateRes[i].frame = undefined;
      }
    }
  }

  cpuState(
    arr: CpuStateStruct[],
    arr2: CpuStateStruct[],
    type: string,
    cpuStateRes: CpuStateStruct[],
    cpu: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && cpuStateRes.length > 0) {
      this.setFrameByFilter(cpuStateRes, startNS, endNS, totalNS, frame);
      return;
    }
    cpuStateRes.length = 0;
    if (arr) {
      this.setFrameByArr(cpuStateRes, startNS, endNS, totalNS, frame, arr2);
    }
  }
}
export function CpuStateStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: CpuStateStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_CPU_STATE && (CpuStateStruct.hoverStateStruct || entry)) {
      CpuStateStruct.selectStateStruct = entry || CpuStateStruct.hoverStateStruct;
      sp.traceSheetEL?.displayCpuStateData();
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class CpuStateStruct extends BaseStruct {
  static hoverStateStruct: CpuStateStruct | undefined;
  static selectStateStruct: CpuStateStruct | undefined;
  dur: number | undefined;
  value: string | undefined;
  startTs: number | undefined;
  height: number | undefined;
  cpu: number | undefined;

  static draw(ctx: CanvasRenderingContext2D, path: Path2D, data: CpuStateStruct): void {
    if (data.frame) {
      let chartColor = ColorUtils.colorForTid(data.cpu!);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = chartColor;
      ctx.strokeStyle = chartColor;
      ctx.globalAlpha = 0.6;
      if (data === CpuStateStruct.hoverStateStruct || data === CpuStateStruct.selectStateStruct) {
        path.rect(data.frame.x, 35 - (data.height || 0), data.frame.width, data.height || 0);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(data.frame.x, 35 - (data.height || 0), 3, 0, 2 * Math.PI, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.frame.x + 3, 35 - (data.height || 0));
        ctx.lineWidth = 3;
        ctx.lineTo(data.frame.x + data.frame.width, 35 - (data.height || 0));
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(data.frame.x, 35 - (data.height || 0), data.frame.width, data.height || 0);
      } else {
        ctx.globalAlpha = 0.6;
        ctx.fillRect(data.frame.x, 35 - (data.height || 0), data.frame.width, data.height || 0);
      }
    }
  }

  static setCpuFrame(cpuStateNode: CpuStateStruct, pns: number, startNS: number, endNS: number, frame: Rect): void {
    if (!cpuStateNode.frame) {
      return;
    }
    //@ts-ignore
    if ((cpuStateNode.startTime || 0) < startNS) {
      cpuStateNode.frame.x = 0;
    } else {
      cpuStateNode.frame.x = Math.floor(((cpuStateNode.startTs || 0) - startNS) / pns);
    }
    //@ts-ignore
    if ((cpuStateNode.startTime || 0) + (cpuStateNode.dur || 0) > endNS) {
      cpuStateNode.frame.width = frame.width - cpuStateNode.frame.x;
    } else {
      cpuStateNode.frame.width = Math.ceil(
        ((cpuStateNode.startTs || 0) + (cpuStateNode.dur || 0) - startNS) / pns - cpuStateNode.frame.x
      );
    }
    if (cpuStateNode.frame.width < 1) {
      cpuStateNode.frame.width = 1;
    }
  }
  static setFrame(
    cpuStateNode: CpuStateStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let x1: number;
    let x2: number;
    if ((cpuStateNode.startTs || 0) < startNS) {
      x1 = 0;
    } else {
      x1 = ns2x(cpuStateNode.startTs || 0, startNS, endNS, totalNS, frame);
    }
    if ((cpuStateNode.startTs || 0) + (cpuStateNode.dur || 0) > endNS) {
      x2 = frame.width;
    } else {
      x2 = ns2x((cpuStateNode.startTs || 0) + (cpuStateNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let cpuStateGetV: number = x2 - x1 <= 1 ? 1 : x2 - x1;
    if (!cpuStateNode.frame) {
      cpuStateNode.frame = new Rect(0, 0, 0, 0);
    }
    cpuStateNode.frame.x = Math.ceil(x1);
    cpuStateNode.frame.y = frame.y + padding;
    cpuStateNode.frame.width = Math.floor(cpuStateGetV);
    cpuStateNode.frame.height = cpuStateNode.height!;
  }
}
