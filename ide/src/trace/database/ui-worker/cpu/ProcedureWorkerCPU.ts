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

import { ColorUtils } from '../../../component/trace/base/ColorUtils';
import {
  BaseStruct,
  dataFilterHandler,
  drawFlagLine,
  drawLines,
  drawLoadingFrame,
  drawSelection,
  drawWakeUp,
  drawWakeUpList,
  Rect,
  Render,
  RequestMessage,
} from '../ProcedureWorkerCommon';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { SpSystemTrace } from '../../../component/SpSystemTrace';
import { Utils } from '../../../component/trace/base/Utils';

export class EmptyRender extends Render {
  //@ts-ignore
  renderMainThread(req: unknown, row: TraceRow<unknown>): void {
    //@ts-ignore
    drawLoadingFrame(req.context, [], row);
  }
  render(cpuReqMessage: RequestMessage, list: Array<CpuStruct>, filter: Array<CpuStruct>): void {
    if (cpuReqMessage.canvas) {
      cpuReqMessage.context.clearRect(0, 0, cpuReqMessage.frame.width, cpuReqMessage.frame.height);
      cpuReqMessage.context.beginPath();
      drawLines(cpuReqMessage.context, cpuReqMessage.xs!, cpuReqMessage.frame.height, cpuReqMessage.lineColor);
      drawSelection(cpuReqMessage.context, cpuReqMessage.params);
      cpuReqMessage.context.closePath();
      drawFlagLine(
        cpuReqMessage.context,
        cpuReqMessage.flagMoveInfo!,
        cpuReqMessage.flagSelectedInfo!,
        cpuReqMessage.startNS,
        cpuReqMessage.endNS,
        cpuReqMessage.totalNS,
        cpuReqMessage.frame,
        cpuReqMessage.slicesTime
      );
    }
    // @ts-ignore
    self.postMessage({
      id: cpuReqMessage.id,
      type: cpuReqMessage.type,
      results: cpuReqMessage.canvas ? undefined : filter,
      hover: null,
    });
  }
}

export class CpuRender {
  renderMainThread(
    req: {
      ctx: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      translateY: number;
    },
    row: TraceRow<CpuStruct>
  ): void {
    let cpuList = row.dataList;
    let cpuFilter = row.dataListCache;
    let startNS = TraceRow.range!.startNS ?? 0;
    let endNS = TraceRow.range!.endNS ?? 0;
    let totalNS = TraceRow.range!.totalNS ?? 0;
    dataFilterHandler(cpuList, cpuFilter, {
      startKey: 'startTime',
      durKey: 'dur',
      startNS: startNS,
      endNS: endNS,
      totalNS: totalNS,
      frame: row.frame,
      paddingTop: 3,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(req.ctx, cpuFilter, row);
    req.ctx.beginPath();
    req.ctx.font = '11px sans-serif';
    cpuFilter.forEach((re) => {
      re.translateY = req.translateY;
      CpuStruct.draw(req.ctx, re, req.translateY);
    });
    req.ctx.closePath();
    if (row.traceId === Utils.currentSelectTrace) {
      let currentCpu = parseInt(req.type!.replace('cpu-data-', ''));
      let wakeup = req.type === `cpu-data-${CpuStruct.selectCpuStruct?.cpu || 0}` ?
        CpuStruct.selectCpuStruct : undefined;
      drawWakeUp(req.ctx, CpuStruct.wakeupBean, startNS, endNS, totalNS, row.frame, wakeup, currentCpu, true);
      for (let i = 0; i < SpSystemTrace.wakeupList.length; i++) {
        if (i + 1 === SpSystemTrace.wakeupList.length) {
          return;
        }
        let wake = SpSystemTrace.wakeupList[i + 1];
        let wakeupListItem =
          req.type === `cpu-data-${SpSystemTrace.wakeupList[i]?.cpu || 0}` ? SpSystemTrace.wakeupList[i] : undefined;
        drawWakeUpList(req.ctx, wake, startNS, endNS, totalNS, row.frame, wakeupListItem, currentCpu, true);
      }
    }
  }

  cpu(
    cpuList: Array<CpuStruct>,
    cpuRes: Array<CpuStruct>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && cpuRes.length > 0) {
      this.setFrameCpuByRes(cpuRes, startNS, endNS, frame);
      return;
    }
    if (cpuList) {
      this.setFrameCpuByList(cpuRes, startNS, endNS, frame, cpuList);
    }
  }

  setFrameCpuByRes(cpuRes: Array<CpuStruct>, startNS: number, endNS: number, frame: Rect): void {
    let pns = (endNS - startNS) / frame.width;
    let y = frame.y + 5;
    let height = frame.height - 10;
    for (let i = 0, len = cpuRes.length; i < len; i++) {
      let it = cpuRes[i];
      if ((it.startTime || 0) + (it.dur || 0) > startNS && (it.startTime || 0) < endNS) {
        if (!cpuRes[i].frame) {
          cpuRes[i].frame = new Rect(0, 0, 0, 0);
          cpuRes[i].frame!.y = y;
          cpuRes[i].frame!.height = height;
        }
        CpuStruct.setCpuFrame(cpuRes[i], pns, startNS, endNS, frame);
      } else {
        cpuRes[i].frame = undefined;
      }
    }
  }

  setFrameCpuByList( cpuRes: Array<CpuStruct>, startNS: number, endNS: number, frame: Rect,
    cpuList: Array<CpuStruct>): void {
    cpuRes.length = 0;
    let pns = (endNS - startNS) / frame.width; //每个像素多少ns
    let y = frame.y + 5;
    let height = frame.height - 10;
    let left = 0;
    let right = 0;
    for (let i = 0, j = cpuList.length - 1, ib = true, jb = true; i < cpuList.length, j >= 0; i++, j--) {
      if (cpuList[j].startTime! <= endNS && jb) {
        right = j;
        jb = false;
      }
      if (cpuList[i].startTime! + cpuList[i].dur! >= startNS && ib) {
        left = i;
        ib = false;
      }
      if (!ib && !jb) {
        break;
      }
    }
    let slice = cpuList.slice(left, right + 1);
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      if (!slice[i].frame) {
        slice[i].frame = new Rect(0, 0, 0, 0);
        slice[i].frame!.y = y;
        slice[i].frame!.height = height;
      }
      if (slice[i].dur! >= pns) {
        slice[i].v = true;
        CpuStruct.setCpuFrame(slice[i], pns, startNS, endNS, frame);
      } else {
        if (i > 0) {
          let c = slice[i].startTime! - slice[i - 1].startTime! - slice[i - 1].dur!;
          if (c < pns && sum < pns) {
            sum += c + slice[i - 1].dur!;
            slice[i].v = false;
          } else {
            slice[i].v = true;
            CpuStruct.setCpuFrame(slice[i], pns, startNS, endNS, frame);
            sum = 0;
          }
        }
      }
    }
    cpuRes.push(...slice.filter((it) => it.v));
  }
}
export function CpuStructOnClick(
  rowType: string,
  sp: SpSystemTrace,
  cpuClickHandler: unknown,
  entry?: CpuStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (rowType === TraceRow.ROW_TYPE_CPU && (CpuStruct.hoverCpuStruct || entry)) {
      CpuStruct.selectCpuStruct = entry || CpuStruct.hoverCpuStruct;
      sp.timerShaftEL?.drawTriangle(CpuStruct.selectCpuStruct!.startTime || 0, 'inverted');
      sp.traceSheetEL?.displayCpuData(
        CpuStruct.selectCpuStruct!,
        (wakeUpBean) => {
          CpuStruct.wakeupBean = wakeUpBean;
          sp.refreshCanvas(false);
        },
        //@ts-ignore
        cpuClickHandler
      );
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class CpuStruct extends BaseStruct {
  static hoverCpuStruct: CpuStruct | undefined;
  static selectCpuStruct: CpuStruct | undefined;
  static wakeupBean: WakeupBean | null | undefined = null;
  cpu: number | undefined;
  dur: number | undefined;
  end_state: string | undefined;
  state: string | undefined;
  id: number | undefined;
  tid: number | undefined;
  name: string | undefined;
  priority: number | undefined;
  processCmdLine: string | undefined;
  processId: number | undefined;
  processName: string | undefined;
  displayProcess: string | undefined;
  displayThread: string | undefined;
  measurePWidth: number = 0;
  measureTWidth: number = 0;
  startTime: number | undefined;
  argSetID: number | undefined;
  type: string | undefined;
  v: boolean = false;
  nofinish: boolean = false;
  ts: number | undefined;
  itid: number | undefined;
  process: string | undefined;
  pid: number | undefined;
  thread: string | undefined;
  isKeyPath?: number;

  static draw(ctx: CanvasRenderingContext2D, data: CpuStruct, translateY: number): void {
    if (data.frame) {
      let pid = data.processId || 0;
      let tid = data.tid || 0;
      let width = data.frame.width || 0;
      if (data.tid === CpuStruct.hoverCpuStruct?.tid || !CpuStruct.hoverCpuStruct) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = ColorUtils.colorForTid(pid > 0 ? pid : tid);
      } else if (data.processId === CpuStruct.hoverCpuStruct?.processId) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = ColorUtils.colorForTid(pid > 0 ? pid : tid);
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e0e0e0';
      }
      ctx.fillRect(data.frame.x, data.frame.y, width, data.frame.height);
      ctx.globalAlpha = 1;
      CpuStruct.drawText(ctx, data, width, pid, tid);
      CpuStruct.drawRim(ctx, data, width);
    }
  }
  static drawText(ctx: CanvasRenderingContext2D, data: CpuStruct, width: number, pid: number, tid: number): void {
    let textFillWidth = width - textPadding * 2;
    if (data.frame && textFillWidth > 3) {
      if (data.displayProcess === undefined) {
        data.displayProcess = `${data.processName || 'Process'} [${data.processId}]`;
        data.measurePWidth = ctx.measureText(data.displayProcess).width;
      }
      if (data.displayThread === undefined) {
        data.displayThread = `${data.name || 'Thread'} [${data.tid}] [Prio:${data.priority || 0}]`;
        data.measureTWidth = ctx.measureText(data.displayThread).width;
      }
      let processCharWidth = Math.round(data.measurePWidth / data.displayProcess.length);
      let threadCharWidth = Math.round(data.measureTWidth / data.displayThread.length);
      ctx.fillStyle = ColorUtils.funcTextColor(ColorUtils.colorForTid(pid > 0 ? pid : tid));
      ctx.font = '9px sans-serif';
      ctx.textBaseline = 'bottom';
      let y = data.frame.height / 2 + data.frame.y;
      if (data.measurePWidth < textFillWidth) {
        let x1 = Math.floor(width / 2 - data.measurePWidth / 2 + data.frame.x + textPadding);
        ctx.fillText(data.displayProcess, x1, y, textFillWidth);
      } else {
        if (textFillWidth >= processCharWidth) {
          let chatNum = textFillWidth / processCharWidth;
          let x1 = data.frame.x + textPadding;
          if (chatNum < 2) {
            ctx.fillText(data.displayProcess.substring(0, 1), x1, y, textFillWidth);
          } else {
            ctx.fillText(`${data.displayProcess.substring(0, chatNum - 1)}...`, x1, y, textFillWidth);
          }
        }
      }
      ctx.textBaseline = 'top';
      if (data.measureTWidth < textFillWidth) {
        let x2 = Math.floor(width / 2 - data.measureTWidth / 2 + data.frame.x + textPadding);
        ctx.fillText(data.displayThread, x2, y + 2, textFillWidth);
      } else {
        if (textFillWidth >= threadCharWidth) {
          let chatNum = textFillWidth / threadCharWidth;
          let x1 = data.frame.x + textPadding;
          if (chatNum < 2) {
            ctx.fillText(data.displayThread.substring(0, 1), x1, y + 2, textFillWidth);
          } else {
            ctx.fillText( `${data.displayThread.substring(0, chatNum - 1)}...`, x1, y + 2, textFillWidth);
          }
        }
      }
    }
  }
  static drawRim(ctx: CanvasRenderingContext2D, data: CpuStruct, width: number): void {
    if (data.frame) {
      if (data.nofinish && width > 4) {
        ctx.fillStyle = '#fff';
        let ruptureWidth = 4;
        let ruptureNode = 8;
        ctx.moveTo(data.frame.x + data.frame.width - 1, data.frame.y);
        for (let i = 1; i <= ruptureNode; i++) {
          ctx.lineTo(
            data.frame.x + data.frame.width - 1 - (i % 2 === 0 ? 0 : ruptureWidth),
            data.frame.y + (data.frame.height / ruptureNode) * i
          );
        }
        ctx.closePath();
        ctx.fill();
      }
      if (data.isKeyPath) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 40);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#0000FF');
        gradient.addColorStop(1, '#FF0000');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.strokeRect(data.frame.x, data.frame.y - 2, width - 2, data.frame.height + 2);
      }
      if (CpuStruct.selectCpuStruct && CpuStruct.equals(CpuStruct.selectCpuStruct, data)) {
        ctx.strokeStyle = '#232c5d';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.frame.x, data.frame.y, width - 2, data.frame.height);
      }
    }
  }

  static setCpuFrame(cpuNode: CpuStruct, pns: number, startNS: number, endNS: number, frame: Rect): void {
    if (!cpuNode.frame) {
      return;
    }
    if ((cpuNode.startTime || 0) < startNS) {
      cpuNode.frame.x = 0;
    } else {
      cpuNode.frame.x = Math.floor(((cpuNode.startTime || 0) - startNS) / pns);
    }
    if ((cpuNode.startTime || 0) + (cpuNode.dur || 0) > endNS) {
      cpuNode.frame.width = frame.width - cpuNode.frame.x;
    } else {
      cpuNode.frame.width = Math.ceil(
        ((cpuNode.startTime || 0) + (cpuNode.dur || 0) - startNS) / pns - cpuNode.frame.x
      );
    }
    if (cpuNode.frame.width < 1) {
      cpuNode.frame.width = 1;
    }
  }

  static equals(d1: CpuStruct, d2: CpuStruct): boolean {
    return (
      d1 &&
      d2 &&
      d1.cpu === d2.cpu &&
      d1.tid === d2.tid &&
      d1.processId === d2.processId &&
      d1.startTime === d2.startTime &&
      d1.dur === d2.dur
    );
  }
}

export class WakeupBean {
  wakeupTime: number | undefined;
  cpu: number | undefined;
  process: string | undefined;
  pid: number | undefined;
  thread: string | undefined;
  dur: number | null | undefined;
  tid: number | undefined;
  schedulingLatency: number | undefined;
  ts: number | undefined;
  schedulingDesc: string | undefined;
  itid: number | undefined;
  state: string | undefined;
  argSetID: number | undefined;
}

const textPadding = 2;
