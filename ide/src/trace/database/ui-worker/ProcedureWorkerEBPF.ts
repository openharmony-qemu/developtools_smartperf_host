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

import { BaseStruct, drawLoadingFrame, PerfRender, Rect, RequestMessage } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class EBPFRender extends PerfRender {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      chartColor: string;
    },
    eBPFtemRow: TraceRow<EBPFChartStruct>
  ): void {
    let filter = eBPFtemRow.dataListCache;
    let groupBy10MS = (TraceRow.range?.scale || 50) > 40_000_000;
    let isDiskIO: boolean = req.type.includes('disk-io');
    eBPFChart(
      filter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0, // @ts-ignore
      eBPFtemRow.frame,
      groupBy10MS,
      isDiskIO,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawLoadingFrame(req.context, filter, eBPFtemRow);
    drawEBPF(req, filter, groupBy10MS, eBPFtemRow);
  }

  render(
    eBPFRequest: RequestMessage,
    list: Array<EBPFChartStruct>,
    filter: Array<EBPFChartStruct>,
    dataList2: Array<EBPFChartStruct>
  ): void {}
}

function drawEBPF(
  req: {
    context: CanvasRenderingContext2D;
    useCache: boolean;
    type: string;
    chartColor: string;
  },
  filter: EBPFChartStruct[],
  groupBy10MS: boolean,
  eBPFtemRow: TraceRow<EBPFChartStruct>
): void {
  req.context.beginPath();
  let find = false;
  let hoverRect: EBPFChartStruct | undefined = undefined;
  for (let re of filter) {
    re.group10Ms = groupBy10MS;
    if (
      eBPFtemRow.isHover &&
      re.frame &&
      eBPFtemRow.hoverX >= re.frame.x &&
      eBPFtemRow.hoverX <= re.frame.x + re.frame.width
    ) {
      if (hoverRect === undefined || re.size! > hoverRect.size!) {
        hoverRect = re;
        find = true;
      }
    }
    if (re.frame && re.frame!.x > eBPFtemRow.hoverX + 3) {
      break;
    }
  }
  if (hoverRect) {
    EBPFChartStruct.hoverEBPFStruct = hoverRect;
  }

  for (let re of filter) {
    EBPFChartStruct.draw(req.context, re, req.chartColor);
  }
  if (!find && eBPFtemRow.isHover) {
    EBPFChartStruct.hoverEBPFStruct = undefined;
  }
  req.context.closePath();
}

export function eBPFChart(
  eBPFFilters: Array<EBPFChartStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  groupBy10MS: boolean,
  isDiskIO: boolean,
  use: boolean
): void {
  if (use && eBPFFilters.length > 0 && groupBy10MS) {
    setFrameGroupBy10MS(eBPFFilters, startNS, endNS, frame);
    return;
  }
  if (!groupBy10MS && eBPFFilters[0] && eBPFFilters[0].dur && eBPFFilters[0].endNS) {
    setFrameByArr(eBPFFilters, startNS, endNS, frame, totalNS, isDiskIO);
  }
}

function setFrameGroupBy10MS(eBPFFilters: Array<EBPFChartStruct>, startNS: number, endNS: number, frame: Rect): void {
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  for (let i = 0; i < eBPFFilters.length; i++) {
    let it = eBPFFilters[i];
    if ((it.startNS || 0) + (it.dur || 0) > startNS && (it.startNS || 0) < endNS) {
      if (!it.frame) {
        it.frame = new Rect(0, 0, 0, 0);
        it.frame.y = y;
      }
      it.frame.height = it.height!;
      EBPFChartStruct.setFrame(it, pns, startNS, endNS, frame, true);
    } else {
      it.frame = undefined;
    }
  }
}

function setFrameByArr(
  eBPFFilters: Array<EBPFChartStruct>,
  startNS: number,
  endNS: number,
  frame: Rect,
  totalNS: number,
  isDiskIO: boolean
): void {
  let list: Array<EBPFChartStruct> = [];
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  let filter: EBPFChartStruct[] = [];
  for (let index = 0; index < eBPFFilters.length; index++) {
    if (
      eBPFFilters[index].endNS! > startNS &&
      (eBPFFilters[index].startNS || 0) < endNS &&
      eBPFFilters[index].dur! > 0
    ) {
      if (index >= 1 && eBPFFilters[index - 1].endNS === eBPFFilters[index].startNS) {
        continue;
      } else {
        eBPFFilters[index].size = 0;
        filter.push(eBPFFilters[index]);
      }
    }
  }
  eBPFFilters.length = 0;
  list = isDiskIO
    ? (EBPFChartStruct.computeHeightNoGroupLatency(filter, totalNS) as Array<EBPFChartStruct>)
    : (EBPFChartStruct.computeHeightNoGroup(filter, totalNS) as Array<EBPFChartStruct>);
  list.map((it) => {
    if (!it.frame) {
      it.frame = new Rect(0, 0, 0, 0);
      it.frame.y = y;
    }
    if (it.size && it.size > 0) {
      EBPFChartStruct.setFrame(it, pns, startNS, endNS, frame, false);
      eBPFFilters.push(it);
    }
  });
}

export class EBPFChartStruct extends BaseStruct {
  static hoverEBPFStruct: EBPFChartStruct | undefined;
  startNS: number | undefined;
  endNS: number | undefined;
  dur: number | undefined;
  size: number | undefined;
  height: number | undefined;
  group10Ms: boolean | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: EBPFChartStruct, chartColor: string): void {
    if (data.frame) {
      ctx.fillStyle = chartColor;
      ctx.strokeStyle = chartColor;
      ctx.fillRect(data.frame.x, 40 - (data.height || 0), data.frame.width, data.height || 0);
    }
  }

  static setFrame(
    eBPFtemNode: EBPFChartStruct,
    pns: number,
    startNS: number,
    endNS: number,
    frame: Rect,
    groupBy10MS: boolean
  ): void {
    if ((eBPFtemNode.startNS || 0) < startNS) {
      eBPFtemNode.frame!.x = 0;
    } else {
      eBPFtemNode.frame!.x = Math.floor(((eBPFtemNode.startNS || 0) - startNS) / pns);
    }
    if ((eBPFtemNode.startNS || 0) + (eBPFtemNode.dur || 0) > endNS) {
      eBPFtemNode.frame!.width = frame.width - eBPFtemNode.frame!.x;
    } else {
      if (groupBy10MS) {
        eBPFtemNode.frame!.width = Math.ceil(((eBPFtemNode.endNS || 0) - (eBPFtemNode.startNS || 0)) / pns);
      } else {
        eBPFtemNode.frame!.width = Math.ceil(
          ((eBPFtemNode.startNS || 0) + (eBPFtemNode.dur || 0) - startNS) / pns - eBPFtemNode.frame!.x
        );
      }
    }
    if (eBPFtemNode.frame!.width < 1) {
      eBPFtemNode.frame!.width = 1;
    }
  }

  static computeHeightNoGroup(array: Array<EBPFChartStruct>, totalNS: number): Array<unknown> {
    if (array.length > 0) {
      let time: Array<{ time: number; type: number }> = [];
      array.map((item) => {
        time.push({ time: item.startNS!, type: 1 });
        time.push({ time: item.endNS || totalNS, type: -1 });
      });
      time = time.sort((a, b) => a.time - b.time);
      let arr: Array<{
        startNS: number;
        dur: number;
        size: number;
        group10Ms: boolean;
        height: number;
      }> = [];
      let first = {
        startNS: time[0].time ?? 0,
        dur: 0,
        size: 1,
        group10Ms: false,
        height: 1,
      };
      arr.push(first);
      let max = 2;
      for (let i = 1, len = time.length; i < len; i++) {
        let heap = {
          startNS: time[i].time,
          dur: 0,
          size: 0,
          group10Ms: false,
          height: 0,
        };
        arr[i - 1].dur = heap.startNS - arr[i - 1].startNS;
        if (i === len - 1) {
          heap.dur = totalNS - heap.startNS;
        }
        heap.size = arr[i - 1].size + time[i].type;
        heap.height = Math.floor((heap.size / 6) * 36);
        max = max > heap.size ? max : heap.size;
        arr.push(heap);
      }
      arr.map((it) => (it.height = Math.floor((it.size / max) * 36)));
      return arr;
    } else {
      return [];
    }
  }

  static computeHeightNoGroupLatency(array: Array<EBPFChartStruct>, totalNS: number): Array<unknown> {
    if (array.length > 0) {
      let max = 0;
      let arr: Array<{ startNS: number; dur: number; size: number; group10Ms: boolean; height: number }> = [];
      for (let io of array) {
        let ioItem = {
          startNS: io.startNS!,
          dur: io.endNS! > totalNS ? totalNS - io.startNS! : io.endNS! - io.startNS!,
          size: io.dur!,
          group10Ms: false,
          height: 0,
        };
        max = max > ioItem.size! ? max : ioItem.size!;
        arr.push(ioItem);
      }
      arr.map((it) => {
        let height = Math.floor((it.size / max) * 36);
        it.height = height < 1 ? 1 : height;
      });
      return arr;
    } else {
      return [];
    }
  }
}
