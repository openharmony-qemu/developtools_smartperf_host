/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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
import { SpSystemTrace } from '../../component/SpSystemTrace';

export function IOStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: IOStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_FILE_SYSTEM_IO && (IOStruct.hoverIOStruct || entry)) {
      IOStruct.selectIOStruct = entry || IOStruct.hoverIOStruct;
      sp.traceSheetEL?.displayIoStatiicsData([IOStruct.selectIOStruct!]);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}


function buildAccumulatedSegmentsNoOverlap(events: IOStruct[], startNS: number, endNS: number): IOStruct[] {
  if (events.length === 0) return [];
  type Point = { t: number; d: number };
  const points: Point[] = [];
  for (const ev of events) {
    const s = ev.startNS ?? 0;
    const e = ev.endNS && ev.endNS > 0 ? ev.endNS : s + (ev.dur ?? 0);
    const v = ev.size ?? 0;
    if (v <= 0) continue;
    if (e <= startNS || s >= endNS) continue;
    points.push({ t: Math.max(startNS, s), d: +v });
    points.push({ t: Math.min(endNS, e), d: -v });
  }
  if (points.length === 0) return [];
  points.sort((a, b) => a.t - b.t);

  const segs: IOStruct[] = [];
  let cur = 0;
  let lastT = points[0].t;
  for (let i = 0; i < points.length; ) {
    const t = points[i].t;
    if (t > lastT && cur > 0) {
      const s = new IOStruct();
      s.startNS = lastT;
      s.dur = t - lastT;
      s.endNS = t;
      s.size = cur;
      segs.push(s);
    }
    while (i < points.length && points[i].t === t) {
      cur += points[i].d;
      i++;
    }
    lastT = t;
  }
  return segs;
}

function setFrameForIOSegments(segs: IOStruct[], startNS: number, endNS: number, frame: { x: number; y: number; width: number; height: number }, paddingTop: number): void {
  if (segs.length === 0) return;
  const pns = (endNS - startNS) / frame.width;
  const innerH = Math.max(2, frame.height - paddingTop * 2);
  let max = 0;
  for (const s of segs) max = Math.max(max, s.size ?? 0);
  if (max <= 0) max = 1;
  const baseY = frame.y + paddingTop;
  for (const s of segs) {
    // @ts-ignore
    s.frame = s.frame || {};
    // @ts-ignore
    s.frame.x = Math.floor((s.startNS - startNS) / pns);
    // @ts-ignore
    s.frame.width = Math.ceil((s.dur ?? 0) / pns);
    // @ts-ignore
    if (s.frame.width < 1) s.frame.width = 1;
    const h = Math.max(1, Math.floor(((s.size ?? 0) / max) * innerH));
    // @ts-ignore
    s.frame.height = h;
    // @ts-ignore
    s.frame.y = baseY + innerH - h;
  }
}

export class IOStruct extends BaseStruct {
  static hoverIOStruct: IOStruct | null = null;
  static selectIOStruct: IOStruct | null = null;
  static selectIOStructList: IOStruct[] = [];

  size: number = 0; // 请求读取或写入的字节数 (request_bytes)
  dur: number = 0; // 持续时长
  endNS: number = 0; // 结束时间戳
  startNS: number = 0; // 开始时间戳
  height: number = 0; // 绘制高度
  group10Ms: boolean = false;
  isWrite: boolean = false; // 是否为写操作
  isPhysical: boolean = false; // 是否为物理IO
  itid: number = 0; // 线程号
  minDuration: number = 0; // 最小持续时长
  maxDuration: number = 0; // 最大持续时长
  avgDuration: number = 0; // 平均持续时长
}

export class IORender {
  renderMainThread(args: {
    context: CanvasRenderingContext2D;
    useCache: boolean;
    type: string;
    chartColor: string;
  }, row: TraceRow<IOStruct>): void {
    let ioList = row.dataList;
    let ioFilter = row.dataListCache;
    
    // 数据过滤和处理
    dataFilterHandler(ioList, ioFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 3,
      useCache: args.useCache || !(TraceRow.range?.refresh ?? false),
    });
    
    const paddingTop = 3;
    const startNS = TraceRow.range?.startNS ?? 0;
    const endNS = TraceRow.range?.endNS ?? 0;

    // 参考 EBPF：把区间事件聚合成不重叠的连续时间段（同一时刻的值做累加）
    const accumulatedRects = buildAccumulatedSegmentsNoOverlap(ioFilter, startNS, endNS);
    setFrameForIOSegments(accumulatedRects, startNS, endNS, row.frame as unknown as { x: number; y: number; width: number; height: number }, paddingTop);
    // 绘制背景和边框
    row.dataListCache = accumulatedRects;
    drawLoadingFrame(args.context, accumulatedRects, row);
    // 绘制IO操作矩形条
    args.context.beginPath();
    let find: boolean = false;
    for (let re of accumulatedRects) {
      IORender.drawIO(args.context, re, args.chartColor);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame!, row.hoverX, row.hoverY)) {
        IOStruct.hoverIOStruct = re;
        find = true;
      }
    }
    args.context.closePath();
  }

  static drawIO(ctx: CanvasRenderingContext2D, data: IOStruct, color: string): void {
    if (data.frame) {
      // 设置填充颜色
      ctx.fillStyle = color;
      // 绘制矩形条：宽度代表持续时间，高度代表字节数
      ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      // 添加边框以增强可读性
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
    }
  }

  renderWorkerThread(): void {}
}
