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

import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { BaseStruct, drawLoadingFrame, ns2x, Rect, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';

export class ProcessRender extends Render {
  renderMainThread(req: unknown, row: TraceRow<ProcessStruct>): void {
    if (row.expansion) {
      return;
    }
    let list = row.dataList;
    let filter = row.dataListCache;
    proc(
      list,
      filter,
      TraceRow.range!.startNS || 0,
      TraceRow.range!.endNS || 0,
      TraceRow.range!.totalNS || 0,
      row.frame,
      //@ts-ignore
      req.useCache || !TraceRow.range!.refresh
    );
    //@ts-ignore
    drawLoadingFrame(req.context, filter, row, true);
    //@ts-ignore
    req.context.beginPath();
    let path = new Path2D();
    let miniHeight = Math.round((row.frame.height - Utils.getInstance().getCpuCount() * 2) /
      Utils.getInstance().getCpuCount());
    //@ts-ignore
    req.context.fillStyle = ColorUtils.colorForTid(req.pid || 0);
    for (let re of filter) {
      //@ts-ignore
      ProcessStruct.draw(req.context, path, re, miniHeight);
    }
    //@ts-ignore
    req.context.fill(path);
    //@ts-ignore
    req.context.closePath();
  }
}
export function proc(
  list: Array<unknown>,
  res: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && res.length > 0) {
    //@ts-ignore
    res.forEach((it) => ProcessStruct.setProcessFrame(it, 5, startNS, endNS, totalNS, frame));
    return;
  }
  res.length = 0;
  if (list) {
    for (let i = 0, len = list.length; i < len; i++) {
      let it = list[i];
      //@ts-ignore
      if ((it.startTime || 0) + (it.dur || 0) > startNS && (it.startTime || 0) < endNS) {
        //@ts-ignore
        ProcessStruct.setProcessFrame(list[i], 5, startNS, endNS, totalNS, frame);
        if (
          !(
            i > 0 &&
            //@ts-ignore
            (list[i - 1].frame.x || 0) === (list[i].frame.x || 0) &&
            //@ts-ignore
            (list[i - 1].frame.width || 0) === (list[i].frame.width || 0)
          )
        ) {
          res.push(list[i]);
        }
      }
    }
  }
}

const padding = 1;

export class ProcessStruct extends BaseStruct {
  cpu: number | undefined;
  dur: number | undefined;
  id: number | undefined;
  pid: number | undefined;
  process: string | undefined;
  startTime: number | undefined;
  state: string | undefined;
  thread: string | undefined;
  tid: number | undefined;
  ts: number | undefined;
  type: string | undefined;
  utid: number | undefined;

  static draw(ctx: CanvasRenderingContext2D, path: Path2D, data: ProcessStruct, miniHeight: number): void {
    if (data.frame) {
      path.rect(data.frame.x, data.frame.y + (data.cpu || 0) * miniHeight + padding, data.frame.width, miniHeight);
    }
  }

  static setFrame(processNode: ProcessStruct, pns: number, startNS: number, endNS: number, frame: Rect): void {
    if ((processNode.startTime || 0) < startNS) {
      processNode.frame!.x = 0;
    } else {
      processNode.frame!.x = Math.floor(((processNode.startTime || 0) - startNS) / pns);
    }
    if ((processNode.startTime || 0) + (processNode.dur || 0) > endNS) {
      processNode.frame!.width = frame.width - processNode.frame!.x;
    } else {
      processNode.frame!.width = Math.ceil(
        ((processNode.startTime || 0) + (processNode.dur || 0) - startNS) / pns - processNode.frame!.x
      );
    }
    if (processNode.frame!.width < 1) {
      processNode.frame!.width = 1;
    }
  }

  static setProcessFrame(
    processNode: ProcessStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let x1: number;
    let x2: number;
    if ((processNode.startTime || 0) < startNS) {
      x1 = 0;
    } else {
      x1 = ns2x(processNode.startTime || 0, startNS, endNS, totalNS, frame);
    }
    if ((processNode.startTime || 0) + (processNode.dur || 0) > endNS) {
      x2 = frame.width;
    } else {
      x2 = ns2x((processNode.startTime || 0) + (processNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let processGetV: number = x2 - x1 <= 1 ? 1 : x2 - x1;
    if (!processNode.frame) {
      processNode.frame = new Rect(0, 0, 0, 0);
    }
    processNode.frame.x = Math.floor(x1);
    processNode.frame.y = Math.floor(frame.y + 2);
    processNode.frame.width = Math.ceil(processGetV);
    processNode.frame.height = Math.floor(frame.height - padding * 2);
  }
}
