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
import { hiPerf, HiPerfStruct, PerfRender, RequestMessage } from '../ProcedureWorkerCommon';
import { TraceRow } from '../../../component/trace/base/TraceRow';

export class HiperfEventRender extends PerfRender {
  renderMainThread(hiPerfEventReq: unknown, row: TraceRow<HiPerfEventStruct>): void {
    let list = row.dataList;
    let list2 = row.dataList2;
    let filter = row.dataListCache;
    //@ts-ignore
    let groupBy10MS = hiPerfEventReq.scale > 30_000_000;
    if (list && row.dataList2.length === 0) {
      //@ts-ignore
      row.dataList2 = HiPerfEventStruct.eventGroupBy10MS(list, hiPerfEventReq.intervalPerf, hiPerfEventReq.type);
    }
    hiPerf(
      list,
      list2,
      filter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      row.frame,
      groupBy10MS,
      //@ts-ignore
      hiPerfEventReq.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawHiPerfEvent(hiPerfEventReq, groupBy10MS, filter, row);
  }

  render(
    hiPerfEventRequest: RequestMessage,
    list: Array<unknown>,
    filter: Array<unknown>,
    dataList2: Array<unknown>
  ): void {}
}

function drawHiPerfEvent(
  hiPerfEventReq: unknown,
  groupBy10MS: boolean,
  filter: HiPerfEventStruct[],
  row: TraceRow<HiPerfEventStruct>
): void {
  //@ts-ignore
  const ctx = hiPerfEventReq.context as CanvasRenderingContext2D;
  ctx.beginPath();
  ctx.fillStyle = ColorUtils.FUNC_COLOR[0];
  ctx.strokeStyle = ColorUtils.FUNC_COLOR[0];
  let offset = groupBy10MS ? 0 : 3;
  let normalPath = new Path2D();
  let specPath = new Path2D();
  let find = false;
  for (let re of filter) {
    HiPerfEventStruct.draw(ctx, normalPath, specPath, re, groupBy10MS);
    if (row.isHover) {
      if (re.frame && row.hoverX >= re.frame.x - offset && row.hoverX <= re.frame.x + re.frame.width + offset) {
        HiPerfEventStruct.hoverStruct = re;
        find = true;
      }
    }
  }
  if (!find && row.isHover) {
    HiPerfEventStruct.hoverStruct = undefined;
  }
  if (groupBy10MS) {
    ctx.fill(normalPath);
  } else {
    ctx.stroke(normalPath);
    HiPerfStruct.drawSpecialPath(ctx, specPath);
  }
  //@ts-ignore
  let maxEvent = `${HiPerfEventStruct.maxEvent!.get(hiPerfEventReq.type!) || 0}`;
  let textMetrics = ctx.measureText(maxEvent);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 5, textMetrics.width + 8, 18);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#333';
  ctx.textBaseline = 'middle';
  ctx.fillText(maxEvent, 4, 5 + 9);
  ctx.stroke();
  ctx.closePath();
}

export class HiPerfEventStruct extends HiPerfStruct {
  static hoverStruct: HiPerfEventStruct | undefined;
  static selectStruct: HiPerfEventStruct | undefined;

  static maxEvent: Map<string, number> | undefined = new Map();
  sum: number | undefined;
  max: number | undefined;

  static eventGroupBy10MS(array: Array<HiPerfEventStruct>, intervalPerf: number, type: string): Array<unknown> {
    let obj = array
      .map((hiPerfDataItem) => {
        //@ts-ignore
        hiPerfDataItem.timestamp_group = Math.trunc(hiPerfDataItem.startNS / 1_000_000_0) * 1_000_000_0;
        return hiPerfDataItem;
      })
      .reduce((pre, current) => {
        //@ts-ignore
        (pre[current.timestamp_group] = pre[current.timestamp_group] || []).push(current);
        return pre;
      }, {});
    let eventArr: unknown[] = [];
    let max = 0;
    for (let aKey in obj) {
      //@ts-ignore
      let sum = obj[aKey].reduce((pre: unknown, cur: unknown) => {
        //@ts-ignore
        return pre + cur.event_count;
      }, 0);
      if (sum > max) {
        max = sum;
      }
      let ns = parseInt(aKey);
      eventArr.push({
        startNS: ns,
        dur: 1_000_000_0,
        height: 0,
        sum: sum,
      });
    }
    if (typeof HiPerfEventStruct.maxEvent!.get(type) === 'undefined') {
      HiPerfEventStruct.maxEvent!.set(type, max);
    }
    eventArr.map((it) => {
      //@ts-ignore
      it.height = Math.floor((40 * it.sum) / max);
      //@ts-ignore
      it.max = max;
      return it;
    });
    return eventArr;
  }
}
