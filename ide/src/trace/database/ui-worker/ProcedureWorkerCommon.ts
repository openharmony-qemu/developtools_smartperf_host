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

import { CpuStruct, WakeupBean } from './cpu/ProcedureWorkerCPU';
import { RangeSelectStruct, TraceRow } from '../../component/trace/base/TraceRow';
import { TimerShaftElement } from '../../component/trace/TimerShaftElement';
import { Flag } from '../../component/trace/timer-shaft/Flag';
import { drawVSync } from '../../component/chart/VSync';
import { FuncStruct } from './ProcedureWorkerFunc';
import { ProcessMemStruct } from './ProcedureWorkerMem';
import { ThreadStruct } from '../../database/ui-worker/ProcedureWorkerThread';
import { Utils } from '../../component/trace/base/Utils';

export abstract class Render {
  abstract renderMainThread(req: unknown, row: unknown): void;
}

export abstract class PerfRender {
  abstract render(req: RequestMessage, list: Array<unknown>, filter: Array<unknown>, dataList2: Array<unknown>): void;
}

export class RequestMessage {
  type: string | undefined | null;
  lazyRefresh: boolean | undefined;
  intervalPerf: unknown;
  canvas: unknown;
  context!: CanvasRenderingContext2D;
  params: unknown;
  online: unknown;
  buf: unknown;
  isRangeSelect!: boolean;
  isHover!: boolean;
  xs?: Array<number>;
  frame!: Rect;
  flagMoveInfo?: Flag;
  flagSelectedInfo?: Flag;
  hoverX: unknown;
  hoverY: unknown;
  startNS!: number;
  endNS!: number;
  totalNS!: number;
  slicesTime:
    | {
      startTime: number | null;
      endTime: number | null;
      color: string | null;
    }
    | undefined;
  range: unknown;
  scale: unknown;
  chartColor: unknown;
  canvasWidth: unknown;
  canvasHeight: unknown;
  useCache: unknown;
  lineColor!: string;
  wakeupBean: WakeupBean | undefined | null;
  id: unknown;
  postMessage:
    | {
      (message: unknown, targetOrigin: string, transfer?: Transferable[]): void;
      (message: unknown, options?: WindowPostMessageOptions): void;
    }
    | undefined;
}

export function ns2s(ns: number): string {
  let second1 = 1_000_000_000; // 1 second
  let millisecond = 1_000_000; // 1 millisecond
  let microsecond = 1_000; // 1 microsecond
  let res;
  if (ns >= second1) {
    res = `${(ns / 1000 / 1000 / 1000).toFixed(1)} s`;
  } else if (ns >= millisecond) {
    res = `${(ns / 1000 / 1000).toFixed(1)} ms`;
  } else if (ns >= microsecond) {
    res = `${(ns / 1000).toFixed(1)} μs`;
  } else if (ns > 0) {
    res = `${ns.toFixed(1)} ns`;
  } else {
    res = `${ns.toFixed(0)}`;
  }
  return res;
}

export function ns2Timestamp(ns: number): string {
  let hour = Math.floor(ns / 3600000000000);
  let minute = Math.floor((ns % 3600000000000) / 60000000000);
  let second = Math.floor((ns % 60000000000) / 1000000000);
  let millisecond = Math.floor((ns % 1000000000) / 1000000);
  let microsecond = Math.floor((ns % 1000000) / 1000);
  let nanosecond = ns % 1000;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second
    .toString()
    .padStart(2, '0')}:${millisecond.toString().padStart(3, '0')}:${microsecond
      .toString()
      .padStart(3, '0')}:${nanosecond.toString().padStart(3, '0')}`;
}

const offsetX = 5;

export function isFrameContainPoint(
  frame: Rect,
  x: number,
  y: number,
  strict: boolean = true,
  offset: boolean = false
): boolean {
  if (strict) {
    if (offset) {
      return (
        x >= frame.x - offsetX && x <= frame.x + frame.width + offsetX && y >= frame.y && y <= frame.y + frame.height
      );
    } else {
      return x >= frame.x && x <= frame.x + frame.width && y >= frame.y && y <= frame.y + frame.height;
    }
  } else {
    if (offset) {
      return x >= frame.x - offsetX && x <= frame.x + frame.width + offsetX;
    } else {
      return x >= frame.x && x <= frame.x + frame.width;
    }
  }
}

export const isSurroundingPoint = function (pointX: number, currentRect: Rect, unitPointXRange: number): boolean {
  return pointX >= currentRect?.x - unitPointXRange && pointX <= currentRect?.x + unitPointXRange;
};

export const computeUnitWidth = function (
  preTs: number,
  currentTs: number,
  frameWidth: number,
  selectUnitWidth: number
): number {
  let max = 150;
  let unitWidth = ((currentTs - preTs) * frameWidth) / (TraceRow.range!.endNS - TraceRow.range!.startNS);
  if (unitWidth < selectUnitWidth) {
    return unitWidth > max || unitWidth === 0 ? max : unitWidth;
  }
  return selectUnitWidth > max || selectUnitWidth === 0 ? max : selectUnitWidth;
};

class FilterConfig {
  startNS: number = 0;
  endNS: number = 0;
  totalNS: number = 0;
  frame: Rect = new Rect(0, 0, 0, 0);
  useCache: boolean = false;
  startKey: string = 'startNS';
  durKey: string = 'dur';
  paddingTop: number = 0;
}

interface CommonStruct {
  frame: Rect;
}

export function fillCacheData(filterList: Array<unknown>, condition: FilterConfig): boolean {
  if (condition.useCache && filterList.length > 0) {
    let pns = (condition.endNS - condition.startNS) / condition.frame.width;
    let y = condition.frame.y + condition.paddingTop;
    let height = condition.frame.height - condition.paddingTop * 2;
    for (let i = 0, len = filterList.length; i < len; i++) {
      let it = filterList[i] as BaseStruct;
      if (
        //@ts-ignore
        (it[condition.startKey] || 0) + (it[condition.durKey] || 0) > condition.startNS &&
        //@ts-ignore
        (it[condition.startKey] || 0) < condition.endNS
      ) {
        if (!it.frame) {
          it.frame = new Rect(0, 0, 0, 0);
          it.frame.y = y;
          it.frame.height = height;
        }
        setNodeFrame(
          it,
          pns,
          condition.startNS,
          condition.endNS,
          condition.frame,
          condition.startKey,
          condition.durKey
        );
      } else {
        it.frame = undefined;
      }
    }
    return true;
  }
  return false;
}

export function fillCacheDataIdx(filterData: Array<unknown>, slice: number[], condition: FilterConfig): boolean {
  if (condition.useCache && filterData.length > 0) {
    let pns = (condition.endNS - condition.startNS) / condition.frame.width;
    let y = condition.frame.y + condition.paddingTop;
    let height = condition.frame.height - condition.paddingTop * 2;
    for (let i = slice[0]; i <= slice[1]; i++) {
      let it = filterData[i] as BaseStruct;
      if (!it) {
        continue;
      }
      if (
        //@ts-ignore
        (it[condition.startKey] || 0) + (it[condition.durKey] || 0) > condition.startNS &&
        //@ts-ignore
        (it[condition.startKey] || 0) < condition.endNS
      ) {
        if (!it.frame) {
          it.frame = new Rect(0, 0, 0, 0);
          it.frame.y = y;
          it.frame.height = height;
        }
        setNodeFrame(
          it,
          pns,
          condition.startNS,
          condition.endNS,
          condition.frame,
          condition.startKey,
          condition.durKey
        );
      } else {
        it.frame = undefined;
      }
    }
    return true;
  }
  return false;
}

export function bsearch(haystack: ArrayLike<unknown>, needle: FilterConfig): number {
  return searchImpl(haystack, needle, 0, haystack.length);
}

function searchImpl(stack: ArrayLike<unknown>, cfg: FilterConfig, i: number, j: number): number {
  if (i === j) {
    return -1;
  }
  if (i + 1 === j) {
    //@ts-ignore
    return cfg.endNS >= stack[i][cfg.startKey] ? i : -1;
  }
  const middle = Math.floor((j - i) / 2) + i;
  //@ts-ignore
  const middleValue = stack[middle][cfg.startKey];
  if (cfg.endNS < middleValue) {
    return searchImpl(stack, cfg, i, middle);
  } else {
    return searchImpl(stack, cfg, middle, j);
  }
}

export function findRangeIdx(fullData: Array<unknown>, condition: FilterConfig): number[] {
  //@ts-ignore
  let a = fullData.findIndex((it) => it[condition.startKey] + it[condition.durKey] >= condition.startNS);
  let b = bsearch(fullData, condition);
  return [a, b + 1];
}

export function findRange(fullData: Array<unknown>, condition: FilterConfig): Array<unknown> {
  let left = 0;
  let right = 0;
  for (let i = 0, j = fullData.length - 1, ib = true, jb = true; i < fullData.length, j >= 0; i++, j--) {
    //@ts-ignore
    if (fullData[j][condition.startKey] <= condition.endNS && jb) {
      right = j;
      jb = false;
    }
    //@ts-ignore
    if (fullData[i][condition.startKey] + fullData[i][condition.durKey] >= condition.startNS && ib) {
      left = i;
      ib = false;
    }
    if (!ib && !jb) {
      break;
    }
  }
  return fullData.slice(left, right + 1);
}

export const dataFilterHandler = (
  fullData: Array<BaseStruct>,
  filterData: Array<BaseStruct>,
  condition: FilterConfig
): void => {
  if (fillCacheData(filterData, condition)) {
    return;
  }
  if (fullData && fullData.length > 0) {
    filterData.length = 0;
    let pns = (condition.endNS - condition.startNS) / condition.frame.width; //每个像素多少ns
    let y = condition.frame.y + condition.paddingTop;
    let height = condition.frame.height - condition.paddingTop * 2;
    let slice = findRange(fullData, condition);
    for (let i = 0; i < slice.length; i++) {
      const item = slice[i] as BaseStruct;
      if (!item.frame) {
        item.frame = new Rect(0, 0, 0, 0);
        item.frame.y = y;
        item.frame.height = height;
      }
      //@ts-ignore
      if (item[condition.durKey] === undefined || item[condition.durKey] === null) {
        if (i === slice.length - 1) {
          //@ts-ignore
          item[condition.durKey] = (condition.endNS || 0) - (item[condition.startKey] || 0);
        } else {
          //@ts-ignore
          item[condition.durKey] = (slice[i + 1][condition.startKey] || 0) - (item[condition.startKey] || 0);
        }
      }
      setSliceFrame(slice, condition, pns, i);
    }
    //@ts-ignore
    filterData.push(...slice.filter((it) => it.v));
  }
};

function setSliceFrame(slice: Array<unknown>, condition: FilterConfig, pns: number, i: number): void {
  let sum = 0;
  //@ts-ignore
  if (slice[i][condition.durKey] >= pns || slice.length < 100) {
    //@ts-ignore
    slice[i].v = true;
    setNodeFrame(
      slice[i],
      pns,
      condition.startNS,
      condition.endNS,
      condition.frame,
      condition.startKey,
      condition.durKey
    );
  } else {
    if (i > 0) {
      //@ts-ignore
      let c = slice[i][condition.startKey] - slice[i - 1][condition.startKey] - slice[i - 1][condition.durKey];
      if (c < pns && sum < pns) {
        //@ts-ignore
        sum += c + slice[i - 1][condition.durKey];
        //@ts-ignore
        slice[i].v = false;
      } else {
        //@ts-ignore
        slice[i].v = true;
        setNodeFrame(
          slice[i],
          pns,
          condition.startNS,
          condition.endNS,
          condition.frame,
          condition.startKey,
          condition.durKey
        );
        sum = 0;
      }
    }
  }
}

function setNodeFrame(
  nodeItem: unknown,
  pns: number,
  startNS: number,
  endNS: number,
  frame: Rect,
  startKey: string,
  durKey: string
): void {
  const node = nodeItem as BaseStruct;
  if (!node.frame) {
    return;
  }
  //@ts-ignore
  const start = node[startKey] as number;
  //@ts-ignore
  const dur = node[durKey] as number;
  if ((start || 0) < startNS) {
    node.frame.x = 0;
  } else {
    node.frame.x = Math.floor(((start || 0) - startNS) / pns);
  }
  if ((start || 0) + (dur || 0) > endNS) {
    node.frame.width = frame.width - node.frame.x;
  } else {
    node.frame.width = Math.ceil(((start || 0) + (dur || 0) - startNS) / pns - node.frame.x);
  }
  if (node.frame.width < 1) {
    node.frame.width = 1;
  }
}

export function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: Rect): number {
  if (endNS === 0) {
    endNS = duration;
  }
  let xSize: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSize < 0) {
    xSize = 0;
  } else if (xSize > rect.width) {
    xSize = rect.width;
  }
  return xSize;
}

export function nsx(ns: number, width: number): number {
  let startNS = TraceRow.range?.startNS || 0;
  let endNS = TraceRow.range?.endNS || 0;
  let duration = TraceRow.range?.totalNS || 0;
  if (endNS === 0) {
    endNS = duration;
  }
  let xSize: number = ((ns - startNS) * width) / (endNS - startNS);
  if (xSize < 0) {
    xSize = 0;
  } else if (xSize > width) {
    xSize = width;
  }
  return xSize;
}

export function ns2xByTimeShaft(ns: number, tse: TimerShaftElement): number {
  let startNS = tse.getRange()!.startNS;
  let endNS = tse.getRange()!.endNS;
  let duration = tse.getRange()!.totalNS;
  if (endNS === 0) {
    endNS = duration;
  }
  let width = tse.getBoundingClientRect().width - 258;
  let xSize: number = ((ns - startNS) * width) / (endNS - startNS);
  if (xSize < 0) {
    xSize = 0;
  } else if (xSize > width) {
    xSize = width;
  }
  return xSize;
}

export class Rect {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  static intersect(r1: Rect, rect: Rect): boolean {
    let minX = r1.x <= rect.x ? r1.x : rect.x;
    let minY = r1.y <= rect.y ? r1.y : rect.y;
    let maxX = r1.x + r1.width >= rect.x + rect.width ? r1.x + r1.width : rect.x + rect.width;
    let maxY = r1.y + r1.height >= rect.y + rect.height ? r1.y + r1.height : rect.y + rect.height;
    return maxX - minX <= rect.width + r1.width && maxY - minY <= r1.height + rect.height;
  }

  static contains(rect: Rect, x: number, y: number): boolean {
    return rect.x <= x && x <= rect.x + rect.width && rect.y <= y && y <= rect.y + rect.height;
  }

  static containsWithMargin(rect: Rect, x: number, y: number, t: number, r: number, b: number, l: number): boolean {
    return rect.x - l <= x && x <= rect.x + rect.width + r && rect.y - t <= y && y <= rect.y + rect.height + b;
  }

  static containsWithPadding(
    rect: Rect,
    x: number,
    y: number,
    paddingLeftRight: number,
    paddingTopBottom: number
  ): boolean {
    return (
      rect.x + paddingLeftRight <= x &&
      rect.y + paddingTopBottom <= y &&
      x <= rect.x + rect.width - paddingLeftRight &&
      y <= rect.y + rect.height - paddingTopBottom
    );
  }

  /**
   * 判断是否相交
   * @param rect
   */
  intersect(rect: Rect): boolean {
    let minX = this.x <= rect.x ? this.x : rect.x;
    let minY = this.y <= rect.y ? this.y : rect.y;
    let maxX = this.x + this.width >= rect.x + rect.width ? this.x + this.width : rect.x + rect.width;
    let maxY = this.y + this.height >= rect.y + rect.height ? this.y + this.height : rect.y + rect.height;
    return maxX - minX <= rect.width + this.width && maxY - minY <= this.height + rect.height;
  }

  contains(x: number, y: number): boolean {
    return this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height;
  }

  containsWithMargin(x: number, y: number, t: number, r: number, b: number, l: number): boolean {
    return this.x - l <= x && x <= this.x + this.width + r && this.y - t <= y && y <= this.y + this.height + b;
  }

  containsWithPadding(x: number, y: number, paddingLeftRight: number, paddingTopBottom: number): boolean {
    return (
      this.x + paddingLeftRight <= x &&
      x <= this.x + this.width - paddingLeftRight &&
      this.y + paddingTopBottom <= y &&
      y <= this.y + this.height - paddingTopBottom
    );
  }
}

export class Point {
  x: number = 0;
  y: number = 0;
  isRight: boolean = true;

  constructor(x: number, y: number, isRight: boolean = true) {
    this.x = x;
    this.y = y;
    this.isRight = isRight;
  }
}

export enum LineType {
  brokenLine,
  bezierCurve,
  straightLine,
}

export class PairPoint {
  x: number = 0;
  ns: number = 0;
  y: number = 0;
  offsetY: number = 0;
  rowEL: TraceRow<BaseStruct>;
  isRight: boolean = true;
  lineType?: LineType;
  lineColor?: string;
  business: string = '';
  hidden?: boolean = false;
  backrowEL?: TraceRow<BaseStruct>;
  rangeTime?: string;
  sourcebackrowEL?: TraceRow<BaseStruct>;

  constructor(
    rowEL: TraceRow<BaseStruct>,
    x: number,
    y: number,
    ns: number,
    offsetY: number,
    isRight: boolean,
    business: string
  ) {
    this.rowEL = rowEL;
    this.x = x;
    this.y = y;
    this.ns = ns;
    this.offsetY = offsetY;
    this.isRight = isRight;
    this.business = business;
  }
}

export class BaseStruct {
  translateY: number | undefined;
  frame: Rect | undefined;
  isHover: boolean = false;
}

export function drawLines(ctx: CanvasRenderingContext2D, xs: Array<number>, height: number, lineColor: string): void {
  if (ctx) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineColor || '#dadada';
    xs?.forEach((it) => {
      ctx.moveTo(Math.floor(it), 0);
      ctx.lineTo(Math.floor(it), height);
    });
    ctx.stroke();
    ctx.closePath();
  }
}

export function drawFlagLine(
  commonCtx: CanvasRenderingContext2D,
  hoverFlag: Flag,
  selectFlag: Flag,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  slicesTime:
    | {
      startTime: number | null | undefined;
      endTime: number | null | undefined;
      color: string | null | undefined;
    }
    | undefined
): void {
  if (commonCtx) {
    if (hoverFlag) {
      setHoverFlag(hoverFlag, commonCtx, frame);
    }
    if (selectFlag) {
      commonCtx.beginPath();
      commonCtx.lineWidth = 2;
      commonCtx.strokeStyle = selectFlag?.color || '#dadada';
      selectFlag.x = ns2x(selectFlag.time, startNS, endNS, totalNS, frame);
      commonCtx.moveTo(Math.floor(selectFlag.x), 0);
      commonCtx.lineTo(Math.floor(selectFlag.x), frame.height);
      commonCtx.stroke();
      commonCtx.closePath();
    }
    if (slicesTime && slicesTime.startTime && slicesTime.endTime) {
      commonCtx.beginPath();
      commonCtx.lineWidth = 1;
      commonCtx.strokeStyle = slicesTime.color || '#dadada';
      let x1 = ns2x(slicesTime.startTime, startNS, endNS, totalNS, frame);
      let x2 = ns2x(slicesTime.endTime, startNS, endNS, totalNS, frame);
      commonCtx.moveTo(Math.floor(x1), 0);
      commonCtx.lineTo(Math.floor(x1), frame.height);
      commonCtx.moveTo(Math.floor(x2), 0);
      commonCtx.lineTo(Math.floor(x2), frame.height);
      commonCtx.stroke();
      commonCtx.closePath();
    }
  }
}

export function drawFlagLineSegment(
  ctx: CanvasRenderingContext2D | null | undefined,
  hoverFlag: Flag | null | undefined,
  selectFlag: Flag | null | undefined,
  frame: Rect,
  tse: TimerShaftElement
): void {
  if (ctx) {
    setHoverFlag(hoverFlag, ctx, frame);
    setSelectFlag(selectFlag, ctx, frame);
    tse.sportRuler!.slicesTimeList.forEach((slicesTime) => {
      if (slicesTime && slicesTime.startTime && slicesTime.endTime) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = slicesTime.color || '#dadada';
        let x1 = ns2x(
          slicesTime.startTime,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          frame
        );
        let x2 = ns2x(
          slicesTime.endTime,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          frame
        );
        // 划线逻辑
        ctx.moveTo(Math.floor(x1), 0);
        ctx.lineTo(Math.floor(x1), frame.height!); //左边的线
        ctx.moveTo(Math.floor(x2), 0);
        ctx.lineTo(Math.floor(x2), frame.height!); // 右边的线
        ctx.stroke();
        ctx.closePath();
      }
    });
  }
}

function setHoverFlag(hoverFlag: Flag | null | undefined, ctx: CanvasRenderingContext2D, frame: Rect): void {
  if (hoverFlag) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hoverFlag?.color || '#dadada';
    ctx.moveTo(Math.floor(hoverFlag.x), 0);
    ctx.lineTo(Math.floor(hoverFlag.x), frame.height);
    ctx.stroke();
    ctx.closePath();
  }
}

function setSelectFlag(selectFlag: Flag | null | undefined, ctx: CanvasRenderingContext2D, frame: Rect): void {
  if (selectFlag) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = selectFlag?.color || '#dadada';
    selectFlag.x = ns2x(
      selectFlag.time,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      frame
    );
    ctx.moveTo(Math.floor(selectFlag.x), 0);
    ctx.lineTo(Math.floor(selectFlag.x), frame.height);
    ctx.stroke();
    ctx.closePath();
  }
}

export function drawLogsLineSegment(
  ctx: CanvasRenderingContext2D | undefined | null,
  systemLogFlag: Flag | undefined | null,
  frame: {
    x: number;
    y: number;
    width: number | undefined;
    height: number | undefined;
  },
  timerShaftEl: TimerShaftElement
): void {
  timerShaftEl.sportRuler?.draw();
  if (systemLogFlag) {
    if (ctx) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = systemLogFlag?.color || '#dadada';
      ctx.moveTo(Math.floor(systemLogFlag.x), 0);
      ctx.lineTo(Math.floor(systemLogFlag.x), frame.height || 0);
      ctx.stroke();
      ctx.closePath();
    }
    if (timerShaftEl.ctx) {
      let timeText = `| ${ns2Timestamp(systemLogFlag.time)}`;
      let textPointX = systemLogFlag.x;
      let textMetrics = timerShaftEl.ctx.measureText(timeText);
      if (timerShaftEl.ctx.canvas.width - systemLogFlag.x <= textMetrics.width) {
        textPointX = systemLogFlag.x - textMetrics.width;
        timeText = `${ns2Timestamp(systemLogFlag.time)} |`;
      }
      let locationY = 120;
      timerShaftEl.ctx.beginPath();
      timerShaftEl.ctx.lineWidth = 0;
      timerShaftEl.ctx.fillStyle = '#FFFFFF';
      let textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      timerShaftEl.ctx.fillRect(textPointX, locationY - textHeight, textMetrics.width, textHeight);
      timerShaftEl.ctx.lineWidth = 2;
      timerShaftEl.ctx.fillStyle = systemLogFlag?.color || '#dadada';
      timerShaftEl.ctx.fillText(timeText, textPointX, locationY);
      timerShaftEl.ctx.stroke();
      timerShaftEl.ctx.closePath();
    }
  }
}

interface SelectionParams {
  isRangeSelect: boolean;
  rangeSelectObject?: RangeSelectStruct;
  startNS: number;
  endNS: number;
  totalNS: number;
  frame: Rect;
}

export function drawSelection(ctx: CanvasRenderingContext2D, params: unknown): void {
  const param = params as SelectionParams;
  if (param.isRangeSelect && param.rangeSelectObject) {
    param.rangeSelectObject!.startX = Math.floor(
      ns2x(param.rangeSelectObject!.startNS!, param.startNS, param.endNS, param.totalNS, param.frame)
    );
    param.rangeSelectObject!.endX = Math.floor(
      ns2x(param.rangeSelectObject!.endNS!, param.startNS, param.endNS, param.totalNS, param.frame)
    );
    if (ctx) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#666666';
      ctx.fillRect(
        param.rangeSelectObject!.startX!,
        param.frame.y,
        param.rangeSelectObject!.endX! - param.rangeSelectObject!.startX!,
        param.frame.height
      );
      ctx.globalAlpha = 1;
    }
  }
}

// draw range select
export function drawSelectionRange(context: CanvasRenderingContext2D, params: unknown): void {
  const param = params as TraceRow<BaseStruct>;
  if (param.rangeSelect && TraceRow.rangeSelectObject) {
    setStartXEndX(param);
    if (context) {
      context.globalAlpha = 0.5;
      context.fillStyle = '#666666';
      context.fillRect(
        TraceRow.rangeSelectObject!.startX!,
        param.frame.y,
        TraceRow.rangeSelectObject!.endX! - TraceRow.rangeSelectObject!.startX!,
        param.frame.height
      );
      context.globalAlpha = 1;
    }
    // 绘制线程中方法平均帧率的箭头指示线条
    if (param.avgRateTxt && param.frameRateList && param.frameRateList.length) {
      drawAvgFrameRate(param.frameRateList, context, param);
    }
  }
}

function setStartXEndX(params: TraceRow<BaseStruct>): void {
  TraceRow.rangeSelectObject!.startX = Math.floor(
    ns2x(
      TraceRow.rangeSelectObject!.startNS!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      params.frame
    )
  );
  TraceRow.rangeSelectObject!.endX = Math.floor(
    ns2x(
      TraceRow.rangeSelectObject!.endNS!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      params.frame
    )
  );
}

function setAvgRateStartXEndX(rateList: number[], params: TraceRow<BaseStruct>): number[] {
  let avgRateStartX = Math.floor(
    ns2x(
      rateList[0]!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      params.frame
    )
  );
  let avgRateEndX = Math.floor(
    ns2x(
      rateList[rateList.length - 1]!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      params.frame
    )
  );
  return [avgRateStartX, avgRateEndX];
}

function setTextXY(rateList: number[], params: TraceRow<BaseStruct>, textWidth: number): number[] {
  let textX =
    Math.floor(
      ns2x(
        (rateList[0]! + rateList[rateList.length - 1]!) / 2,
        TraceRow.range?.startNS ?? 0,
        TraceRow.range?.endNS ?? 0,
        TraceRow.range?.totalNS ?? 0,
        params.frame
      )
    ) -
    textWidth / 2; // @ts-ignore
  let textY = params.frame.y + 25;
  return [textX, textY];
}

// 转换起始点坐标
function changeFrameRatePoint(arrList: Array<number>, selectParams: TraceRow<BaseStruct>): number[] {
  let avgRateStartX = Math.floor(
    ns2x(
      arrList[0]!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      selectParams.frame
    )
  ); // 起始坐标
  let avgRateEndX = Math.floor(
    ns2x(
      arrList[arrList.length - 1]!,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      selectParams.frame
    )
  ); // 结束坐标
  return [avgRateStartX, avgRateEndX];
}

// 处理文字坐标
function handleTextCoordinate(arrList: Array<number>, selectParams: TraceRow<BaseStruct>, textWidth: number): number[] {
  const TEXT_WIDTH_HALF = 2;
  let textX = Math.floor(
    ns2x(
      (arrList[0]! + arrList[arrList.length - 1]!) / 2,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      selectParams.frame
    )
  ); //根据帧率范围的中间值转换文本的起始x坐标
  textX = textX <= textWidth / TEXT_WIDTH_HALF ? textX : textX - textWidth / TEXT_WIDTH_HALF; // @ts-ignore
  let textY = selectParams.frame.y + 11;
  if (selectParams.avgRateTxt?.includes('HitchTime')) {
    // @ts-ignore
    textY = selectParams.frame.y + 11;
  } else {
    // 展开时显示在第二行，折叠显示第一行
    if (selectParams.funcExpand) {
      // @ts-ignore
      textY = selectParams.frame.y + 29;
    } else {
      // @ts-ignore
      textY = selectParams.frame.y + 11;
    }
  }
  return [textX, textY];
}

// 绘制平均帧率箭头指示线条
export function drawAvgFrameRate(
  arrList: Array<number>,
  ctx: CanvasRenderingContext2D,
  selectParams: TraceRow<BaseStruct>
): void {
  let rateList: Array<number> = [...new Set(arrList)];
  let startX = changeFrameRatePoint(rateList, selectParams)[0];
  let endX = changeFrameRatePoint(rateList, selectParams)[1];
  const textWidth = ctx.measureText(selectParams.avgRateTxt!).width;

  const textHeight = 25;
  const padding = 5;
  let textX = handleTextCoordinate(rateList, selectParams, textWidth)[0];
  let textY = handleTextCoordinate(rateList, selectParams, textWidth)[1];
  //左移到边界，不画线和文字
  startX = startX <= 0 ? -100 : startX;
  endX = endX <= 0 ? -100 : endX;
  textX = textX <= 0 ? -200 : textX;
  //右移到边界，不画线和文字
  const ADD_DISTANCE = 100;
  textX = textX + textWidth / 2 >= selectParams.frame.width ?
    selectParams.frame.width + ADD_DISTANCE : textX;
  startX = startX >= selectParams.frame.width ?
    selectParams.frame.width + ADD_DISTANCE : startX;
  endX = endX >= selectParams.frame.width ?
    selectParams.frame.width + ADD_DISTANCE : endX;

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(startX, textY);
  ctx.lineTo(endX, textY);
  ctx.stroke();

  const arrowSize = 5.5;
  const arrowHead = (x: number, y: number, direction: 'left' | 'right'): void => {
    ctx.beginPath();
    const headX = x + (direction === 'left' ? arrowSize : -arrowSize);
    const headY = y - arrowSize / 2;
    ctx.moveTo(x, y);
    ctx.lineTo(headX, headY);
    ctx.lineTo(headX, y + arrowSize);
    ctx.closePath();
    ctx.fillStyle = 'yellow';
    ctx.fill();
  };
  arrowHead(startX, textY - 1, 'left');
  arrowHead(endX, textY - 1, 'right');

  const TEXT_RECT_PADDING = 2;
  ctx.fillStyle = 'red';
  ctx.fillRect(
    textX - padding,
    textY - textHeight / TEXT_RECT_PADDING + padding,
    textWidth + padding * TEXT_RECT_PADDING,
    textHeight - padding * TEXT_RECT_PADDING
  );

  ctx.fillStyle = 'white';
  ctx.fillText(selectParams.avgRateTxt!, textX, textY + 4);
}

function drawAvgFrameRateArrow(
  ctx: CanvasRenderingContext2D,
  textX: number,
  textY: number,
  textWidth: number,
  startX: number,
  endX: number,
  avgFrameRate: string
): void {
  const textHeight = 25;
  const padding = 5;
  const TEXT_RECT_PADDING = 2;
  ctx.fillStyle = 'red';
  ctx.fillRect(
    textX - padding,
    textY - textHeight + padding,
    textWidth + padding * TEXT_RECT_PADDING,
    textHeight - padding * TEXT_RECT_PADDING
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(startX, textY);
  ctx.lineTo(endX, textY);
  ctx.stroke();
  arrowHead(ctx, startX, textY - 1, 'left');
  arrowHead(ctx, endX, textY - 1, 'right');
  ctx.fillStyle = 'white';
  ctx.fillText(avgFrameRate, textX, textY - 8);
}

const arrowSize = 5.5;
const arrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'left' | 'right'): void => {
  ctx.beginPath();
  const headX = x + (direction === 'left' ? arrowSize : -arrowSize);
  const headY = y - arrowSize / 2;
  ctx.moveTo(x, y);
  ctx.lineTo(headX, headY);
  ctx.lineTo(headX, y + arrowSize);
  ctx.closePath();
  ctx.fillStyle = 'yellow';
  ctx.fill();
};

export function drawWakeUp(
  wakeUpContext: CanvasRenderingContext2D | undefined | null,
  wake: WakeupBean | undefined | null,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  selectCpuStruct: CpuStruct | undefined = undefined,
  wakeUpCurrentCpu: number | undefined = undefined,
  noVerticalLine = false
): void {
  if (wake && wakeUpContext) {
    let x1 = Math.floor(ns2x(wake.wakeupTime || 0, startNS, endNS, totalNS, frame));
    wakeUpContext.beginPath();
    wakeUpContext.lineWidth = 2;
    wakeUpContext.fillStyle = '#000000';
    if (x1 > 0 && x1 < frame.x + frame.width) {
      if (!noVerticalLine) {
        wakeUpContext.moveTo(x1, frame.y);
        wakeUpContext.lineTo(x1, frame.y + frame.height);
      }
      if (wakeUpCurrentCpu === wake.cpu) {
        let centerY = Math.floor(frame.y + frame.height / 2);
        wakeUpContext.moveTo(x1, centerY - 6);
        wakeUpContext.lineTo(x1 + 4, centerY);
        wakeUpContext.lineTo(x1, centerY + 6);
        wakeUpContext.lineTo(x1 - 4, centerY);
        wakeUpContext.lineTo(x1, centerY - 6);
        wakeUpContext.fill();
      }
    }
    if (selectCpuStruct) {
      drawWakeUpIfSelect(selectCpuStruct, startNS, endNS, totalNS, frame, wakeUpContext, wake, x1);
    }
    wakeUpContext.strokeStyle = '#000000';
    wakeUpContext.stroke();
    wakeUpContext.closePath();
  }
}

function drawWakeUpIfSelect(
  selectCpuStruct: CpuStruct,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  wakeUpContext: CanvasRenderingContext2D,
  wake: unknown,
  x1: number
): void {
  let x2 = Math.floor(ns2x(selectCpuStruct.startTime || 0, startNS, endNS, totalNS, frame));
  let y = frame.y + frame.height - 10;
  wakeUpContext.moveTo(x1, y);
  wakeUpContext.lineTo(x2, y);
  //@ts-ignore
  let s = ns2s((selectCpuStruct.startTime || 0) - (wake.wakeupTime || 0));
  let distance = x2 - x1;
  if (distance > 12) {
    wakeUpContext.moveTo(x1, y);
    wakeUpContext.lineTo(x1 + 6, y - 3);
    wakeUpContext.moveTo(x1, y);
    wakeUpContext.lineTo(x1 + 6, y + 3);
    wakeUpContext.moveTo(x2, y);
    wakeUpContext.lineTo(x2 - 6, y - 3);
    wakeUpContext.moveTo(x2, y);
    wakeUpContext.lineTo(x2 - 6, y + 3);
    let measure = wakeUpContext.measureText(s);
    let tHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
    let xStart = x1 + Math.floor(distance / 2 - measure.width / 2);
    if (distance > measure.width + 4) {
      wakeUpContext.fillStyle = '#ffffff';
      wakeUpContext.fillRect(xStart - 2, y - 4 - tHeight, measure.width + 4, tHeight + 4);
      wakeUpContext.font = '10px solid';
      wakeUpContext.fillStyle = '#000000';
      wakeUpContext.textBaseline = 'bottom';
      wakeUpContext.fillText(s, xStart, y - 2);
    }
  }
}

const wid = 5;
const linkLineColor = '#ff0000';

export function drawLinkLines(
  context: CanvasRenderingContext2D,
  nodes: PairPoint[][],
  tm: TimerShaftElement,
  isFavorite: boolean,
  favoriteHeight: number
): void {
  let percentage =
    (tm.getRange()!.totalNS - Math.abs(tm.getRange()!.endNS - tm.getRange()!.startNS)) / tm.getRange()!.totalNS;
  let maxWidth = tm.getBoundingClientRect().width - 258;
  setLinkLinesNodes(nodes, isFavorite, favoriteHeight, maxWidth, context, percentage);
}

function setLinkLinesNodes(
  nodes: PairPoint[][],
  isFav: boolean,
  favH: number,
  max: number,
  context: CanvasRenderingContext2D,
  perc: number
): void {
  for (let i = 0; i < nodes.length; i++) {
    let it = nodes[i];
    const traceRow0 = it[0].rowEL as TraceRow<BaseStruct>;
    const traceRow1 = it[1].rowEL as TraceRow<BaseStruct>;
    it[0].y = traceRow0.translateY + it[0].offsetY;
    it[1].y = traceRow1.translateY + it[1].offsetY;
    let newFirstNode = new PairPoint(
      traceRow0,
      it[0].x,
      it[0].y,
      it[0].ns,
      it[0].offsetY,
      it[0].isRight,
      it[0].business
    );
    let newSecondNode = new PairPoint(
      traceRow1,
      it[1].x,
      it[1].y,
      it[1].ns,
      it[1].offsetY,
      it[1].isRight,
      it[1].business
    );
    if (it[0].lineColor) {
      newFirstNode.lineColor = it[0].lineColor;
      newSecondNode.lineColor = it[0].lineColor;
    }
    if (it[0].rangeTime) {
      newFirstNode.rangeTime = it[0].rangeTime;
    }
    if (it[0].hidden) {
      continue;
    }
    if (isFav) {
      if (traceRow0.collect && traceRow1.collect) {
      } else if (!traceRow0.collect && !traceRow1.collect) {
        continue;
      } else {
        traceRow0.collect ? (newSecondNode.y = Math.max(it[1].y + favH, favH)) :
          (newFirstNode.y = Math.max(it[0].y + favH, favH));
      }
    } else {
      if (traceRow0.collect && traceRow1.collect) {
        continue;
      } else if (!traceRow0.collect && !traceRow1.collect) {
      } else {
        traceRow0.collect ? (newFirstNode.y = it[0].y - favH) : (newSecondNode.y = it[1].y - favH);
      }
    }
    drawLinesByType(it[0].lineType, newFirstNode, newSecondNode, max, context, perc);
  }
}

function drawLinesByType(
  lineType: LineType | undefined,
  newFirstNode: PairPoint,
  newSecondNode: PairPoint,
  maxWidth: number,
  context: CanvasRenderingContext2D,
  percentage: number
): void {
  switch (lineType) {
    case LineType.brokenLine:
      drawBrokenLine([newFirstNode, newSecondNode], maxWidth, context);
      break;
    case LineType.bezierCurve:
      drawBezierCurve([newFirstNode, newSecondNode], maxWidth, context, percentage);
      break;
    case LineType.straightLine:
      drawStraightLine([newFirstNode, newSecondNode], maxWidth, context);
      break;
    default:
      drawBezierCurve([newFirstNode, newSecondNode], maxWidth, context, percentage);
  }
}

function drawBezierCurve(
  it: PairPoint[],
  maxWidth: number,
  context: CanvasRenderingContext2D,
  percentage: number
): void {
  let bezierCurveStart = it[0].x > it[1].x ? it[1] : it[0];
  let bezierCurveEnd = it[0].x > it[1].x ? it[0] : it[1];
  if (bezierCurveStart && bezierCurveEnd) {
    //左移到边界，不画线
    if (bezierCurveStart.x <= 0) {
      bezierCurveStart.x = -100;
    }
    if (bezierCurveEnd.x <= 0) {
      bezierCurveEnd.x = -100;
    }
    //右移到边界，不画线
    if (bezierCurveStart.x >= maxWidth) {
      bezierCurveStart.x = maxWidth + 100;
    }
    if (bezierCurveEnd.x >= maxWidth) {
      bezierCurveEnd.x = maxWidth + 100;
    }
    drawBezierCurveContext(context, bezierCurveStart, bezierCurveEnd, percentage);
  }
}

function drawBezierCurveContext(
  context: CanvasRenderingContext2D,
  bezierCurveStart: PairPoint,
  bezierCurveEnd: PairPoint,
  percentage: number
): void {
  context.beginPath();
  context.lineWidth = 2;
  context.fillStyle = linkLineColor;
  context.strokeStyle = linkLineColor;
  let x0 = bezierCurveStart.x ?? 0;
  let y0 = bezierCurveStart.y ?? 0;
  let x3 = bezierCurveEnd.x ?? 0;
  let y3 = bezierCurveEnd.y ?? 0;
  let x2 = bezierCurveEnd.isRight ? x3 - 100 * percentage : x3 + 100 * percentage;
  let y2 = y3 - 40 * percentage;
  let x1 = bezierCurveStart.isRight ? x0 - 100 * percentage : x0 + 100 * percentage;
  let y1 = y0 + 40 * percentage;
  if (!bezierCurveStart.isRight) {
    x0 -= 5;
  }
  context.moveTo(x0, y0);
  if (bezierCurveStart.isRight) {
    context.lineTo(x0 - wid, y0 + wid);
    context.moveTo(x0, y0);
    context.lineTo(x0 - wid, y0 - wid);
  } else {
    context.lineTo(x0 + wid, y0 + wid);
    context.moveTo(x0, y0);
    context.lineTo(x0 + wid, y0 - wid);
  }
  context.moveTo(x0, y0);
  context.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  context.moveTo(x3, y3);
  if (bezierCurveEnd.isRight) {
    context.lineTo(x3 - wid, y3 + wid);
    context.moveTo(x3, y3);
    context.lineTo(x3 - wid, y3 - wid);
  } else {
    context.lineTo(x3 + wid, y3 + wid);
    context.moveTo(x3, y3);
    context.lineTo(x3 + wid, y3 - wid);
  }
  context.moveTo(x3, y3);
  context.stroke();
  context.closePath();
}

function drawStraightLine(it: PairPoint[], maxWidth: number, context: CanvasRenderingContext2D): void {
  let startPoint = it[0].x > it[1].x ? it[1] : it[0];
  let endPoint = it[0].x > it[1].x ? it[0] : it[1];
  let arrowSize = 8;
  if (startPoint && endPoint) {
    //左移到边界，不画线
    if (startPoint.x <= 0) {
      startPoint.x = -100;
    }
    if (endPoint.x <= 0) {
      endPoint.x = -100;
    }
    //右移到边界，不画线
    if (startPoint.x >= maxWidth) {
      startPoint.x = maxWidth + 100;
    }
    if (endPoint.x >= maxWidth) {
      endPoint.x = maxWidth + 100;
    }
    drawArrow(context, startPoint, endPoint, arrowSize);
  }
}

function drawArrow(
  context: CanvasRenderingContext2D,
  startPoint: PairPoint,
  endPoint: PairPoint,
  arrowSize: number
): void {
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = '#0000FF';
  context.moveTo(startPoint.x, startPoint.y);
  context.lineTo(endPoint.x, endPoint.y);
  // 绘制箭头
  let arrow = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  context.moveTo(endPoint.x, endPoint.y);
  context.lineTo(
    endPoint.x - arrowSize * Math.cos(arrow - Math.PI / 6),
    endPoint.y - arrowSize * Math.sin(arrow - Math.PI / 6)
  );
  context.moveTo(endPoint.x, endPoint.y);
  context.lineTo(
    endPoint.x - arrowSize * Math.cos(arrow + Math.PI / 6),
    endPoint.y - arrowSize * Math.sin(arrow + Math.PI / 6)
  );
  // 绘制另一端箭头
  arrow = Math.atan2(startPoint.y - endPoint.y, startPoint.x - endPoint.x);
  context.moveTo(startPoint.x, startPoint.y);
  context.lineTo(
    startPoint.x - arrowSize * Math.cos(arrow - Math.PI / 6),
    startPoint.y - arrowSize * Math.sin(arrow - Math.PI / 6)
  );
  context.moveTo(startPoint.x, startPoint.y);
  context.lineTo(
    startPoint.x - arrowSize * Math.cos(arrow + Math.PI / 6),
    startPoint.y - arrowSize * Math.sin(arrow + Math.PI / 6)
  );
  context.stroke();
  context.closePath();
}

function drawBrokenLine(it: PairPoint[], maxWidth: number, context: CanvasRenderingContext2D): void {
  let brokenLineStart = it[0].x > it[1].x ? it[1] : it[0];
  let brokenLineEnd = it[0].x > it[1].x ? it[0] : it[1];
  if (brokenLineStart && brokenLineEnd) {
    if (brokenLineStart.x <= 0) {
      brokenLineStart.x = -100;
    }
    if (brokenLineEnd.x <= 0) {
      brokenLineEnd.x = -100;
    }
    if (brokenLineStart.x >= maxWidth) {
      brokenLineStart.x = maxWidth + 100;
    }
    if (brokenLineEnd.x >= maxWidth) {
      brokenLineEnd.x = maxWidth + 100;
    }
    drawBrokenLineContext(context, brokenLineStart, brokenLineEnd);
  }
}

function drawBrokenLineContext(
  context: CanvasRenderingContext2D,
  brokenLineStart: PairPoint,
  brokenLineEnd: PairPoint
): void {
  context.beginPath();
  context.lineWidth = 2;
  context.fillStyle = brokenLineStart.lineColor ? brokenLineStart.lineColor : '#46B1E3';
  context.strokeStyle = brokenLineStart.lineColor ? brokenLineStart.lineColor : '#46B1E3';
  let x0 = brokenLineStart.x ?? 0;
  let y0 = brokenLineStart.y ?? 0;
  let y2 = brokenLineEnd.y ?? 0;
  let x2 = brokenLineEnd.x ?? 0;
  let x1;
  let y1;
  let leftEndpointX;
  let leftEndpointY;
  let rightEndpointX;
  let rightEndpointY;
  if (brokenLineStart.y < brokenLineEnd.y) {
    x1 = brokenLineStart.x ?? 0;
    y1 = brokenLineEnd.y ?? 0;
    leftEndpointX = x2 - wid;
    leftEndpointY = y2 - wid;
    rightEndpointX = x2 - wid;
    rightEndpointY = y2 + wid;
  } else {
    // @ts-ignore
    x2 = brokenLineEnd.x - wid ?? 0;
    // @ts-ignore
    x1 = brokenLineEnd.x - wid ?? 0;
    y1 = brokenLineStart.y ?? 0;
    leftEndpointX = x2 - wid;
    leftEndpointY = y2 + wid;
    rightEndpointX = x2 + wid;
    rightEndpointY = y2 + wid;
  }
  x1 = drawDistributedLineTime(brokenLineStart.business, brokenLineStart.rangeTime!, [x0, y0, x1, y1, x2, y2], context);
  context.moveTo(x0 - 2, y0);
  context.lineTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
  context.beginPath();
  context.lineWidth = 2;
  context.fillStyle = brokenLineStart.lineColor ? brokenLineStart.lineColor : '#46B1E3';
  context.strokeStyle = brokenLineStart.lineColor ? brokenLineStart.lineColor : '#46B1E3';
  context.moveTo(x2, y2);
  context.lineTo(leftEndpointX, leftEndpointY);
  context.lineTo(rightEndpointX, rightEndpointY);
  context.lineTo(x2, y2);
  context.fill();
  context.closePath();
}

let loadingText = 'Loading...';
let loadingTextWidth = 0;
let loadingBackground = '#f1f1f1';
let loadingFont = 'bold 11pt Arial';
let loadingFontColor = '#696969';

function drawDistributedLineTime(
  business: string,
  rangeTime: string,
  [x0, y0, x1, y1, x2, y2]: [number, number, number, number, number, number],
  context: CanvasRenderingContext2D
): number {
  if (business === 'distributed') {
    if (y0 === y1) {
      drawString(context, rangeTime, 0,
        new Rect(x0, y0 + 2, x1 - x0, 12), { textMetricsWidth: undefined });
    } else {
      drawString(context, rangeTime, 0,
        new Rect(x1, y1 + 2, x2 - x1, 12), { textMetricsWidth: undefined });
      x1 = x1 - 2;
    }
  }
  return x1;
}

export function drawLoadingFrame(
  ctx: CanvasRenderingContext2D,
  list: Array<unknown>,
  traceRow: unknown,
  sort: boolean = false
): void {
  const row = traceRow as TraceRow<BaseStruct>;
  ctx.beginPath();
  ctx.clearRect(0, 0, row.frame.width, row.frame.height);
  drawLines(ctx, TraceRow.range?.xs || [], row.frame.height, '#dadada');
  drawVSync(ctx, row.frame.width, row.frame.height);
  if (row.loadingFrame) {
    if (loadingTextWidth === 0) {
      loadingTextWidth = ctx.measureText(loadingText).width;
    }
    let firstPx = nsx(row.loadingPin1, row.frame.width);
    let lastPx = nsx(row.loadingPin2, row.frame.width);
    ctx.fillStyle = loadingBackground;
    ctx.fillRect(0, 1, firstPx, row.frame.height - 2);
    ctx.fillRect(lastPx, 1, row.frame.width - lastPx, row.frame.height - 2);
    ctx.fillStyle = loadingFontColor;
    if (firstPx > loadingTextWidth) {
      ctx.fillText(loadingText, (firstPx - loadingTextWidth) / 2, row.frame.height / 2);
    }
    if (row.frame.width - lastPx > loadingTextWidth) {
      ctx.fillText(loadingText, lastPx + (row.frame.width - lastPx) / 2 - loadingTextWidth / 2, row.frame.height / 2);
    }
  }
  ctx.closePath();
}

export function drawString(
  ctx: CanvasRenderingContext2D,
  str: string,
  textPadding: number,
  frame: Rect,
  data: unknown
): void {
  //@ts-ignore
  if (data.textMetricsWidth === undefined) {
    //@ts-ignore
    data.textMetricsWidth = ctx.measureText(str);
  }
  //@ts-ignore
  const textMetricsWidth = (data.textMetricsWidth as TextMetrics).width;
  const yPos = 1.5;
  let charWidth = Math.round(textMetricsWidth / str.length);
  let fillTextWidth = frame.width - textPadding * 2;
  if (textMetricsWidth < fillTextWidth) {
    let x2 = Math.floor(frame.width / 2 - textMetricsWidth / 2 + frame.x + textPadding);
    ctx.fillText(str, x2, Math.floor(frame.y + frame.height / yPos), fillTextWidth);
  } else {
    if (fillTextWidth >= charWidth) {
      let chatNum = fillTextWidth / charWidth;
      let x1 = frame.x + textPadding;

      if (chatNum < 2) {
        ctx.fillText(str.substring(0, 1), x1, Math.floor(frame.y + frame.height / yPos), fillTextWidth);
      } else {
        ctx.fillText(
          `${str.substring(0, chatNum - 1)}...`,
          x1,
          Math.floor(frame.y + frame.height / yPos),
          fillTextWidth
        );
      }
    }
  }
}

export function drawFunString(
  ctx: CanvasRenderingContext2D,
  str: string,
  textPadding: number,
  frame: Rect,
  data: FuncStruct
): void {
  if (data.textMetricsWidth === undefined) {
    data.textMetricsWidth = ctx.measureText(str).width;
  }
  let charWidth = Math.round(data.textMetricsWidth / str.length);
  let fillTextWidth = frame.width - textPadding * 2;
  if (data.textMetricsWidth < fillTextWidth) {
    let x2 = Math.floor(frame.width / 2 - data.textMetricsWidth / 2 + frame.x + textPadding);
    ctx.fillText(str, x2, Math.floor(data.frame!.height * (data.depth! + 0.5) + 3), fillTextWidth);
  } else {
    if (fillTextWidth >= charWidth) {
      let chatNum = fillTextWidth / charWidth;
      let x1 = frame.x + textPadding;
      if (chatNum < 2) {
        ctx.fillText(str.substring(0, 1), x1, Math.floor(data.frame!.height * (data.depth! + 0.5) + 3), fillTextWidth);
      } else {
        ctx.fillText(
          `${str.substring(0, chatNum - 1)}...`,
          x1,
          Math.floor(data.frame!.height * (data.depth! + 0.5) + 3),
          fillTextWidth
        );
      }
    }
  }
}

export function hiPerf(
  arr: Array<HiPerfStruct>,
  arr2: Array<HiPerfStruct>,
  res: Array<HiPerfStruct>,
  startNS: number,
  endNS: number,
  frame: Rect,
  groupBy10MS: boolean,
  use: boolean
): void {
  if (use && res.length > 0) {
    setFrameByRes(res, startNS, endNS, frame);
    return;
  }
  res.length = 0;
  if (arr) {
    setFrameByArr(arr, arr2, res, startNS, endNS, frame, groupBy10MS);
  }
}

function setFrameByRes(res: Array<HiPerfStruct>, startNS: number, endNS: number, frame: Rect): void {
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  for (let i = 0; i < res.length; i++) {
    let item = res[i];
    if ((item.startNS || 0) + (item.dur || 0) > startNS && (item.startNS || 0) < endNS) {
      if (!item.frame) {
        item.frame = new Rect(0, 0, 0, 0);
        item.frame.y = y;
      }
      item.frame.height = item.height!;
      HiPerfStruct.setFrame(item, pns, startNS, endNS, frame);
    } else {
      item.frame = undefined;
    }
  }
}

function setFrameByArr(
  arr: Array<HiPerfStruct>,
  arr2: Array<HiPerfStruct>,
  res: Array<HiPerfStruct>,
  startNS: number,
  endNS: number,
  frame: Rect,
  groupBy10MS: boolean
): void {
  let list = groupBy10MS ? arr2 : arr;
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  for (let i = 0, len = list.length; i < len; i++) {
    let it = list[i];
    if ((it.startNS || 0) + (it.dur || 0) > startNS && (it.startNS || 0) < endNS) {
      if (!list[i].frame) {
        list[i].frame = new Rect(0, 0, 0, 0);
        list[i].frame!.y = y;
      }
      list[i].frame!.height = it.height!;
      HiPerfStruct.setFrame(list[i], pns, startNS, endNS, frame);
      setResultArr(groupBy10MS, list, i, res);
    }
  }
}

function setResultArr(groupBy10MS: boolean, list: Array<HiPerfStruct>, i: number, res: Array<HiPerfStruct>): void {
  const itemI = list[i];
  const itemBeforeI = list[i - 1];
  if (itemI.frame && itemBeforeI.frame) {
    if (groupBy10MS) {
      let flag: boolean =
        i > 0 &&
        (itemBeforeI.frame.x || 0) === (itemI.frame.x || 0) &&
        (itemBeforeI.frame.width || 0) === (itemI.frame.width || 0) &&
        (itemBeforeI.frame.height || 0) === (itemI.frame.height || 0);
      if (!flag) {
        res.push(itemI);
      }
    } else {
      if (!(i > 0 && Math.abs((itemBeforeI.frame.x || 0) - (itemI.frame.x || 0)) < 4)) {
        res.push(itemI);
      }
    }
  }
}

export function hiPerf2(filter: Array<HiPerfStruct>, startNS: number, endNS: number, frame: Rect): void {
  if (filter.length > 0) {
    let pns = (endNS - startNS) / frame.width;
    let y = frame.y;
    for (let i = 0; i < filter.length; i++) {
      let it = filter[i];
      if ((it.startNS || 0) + (it.dur || 0) > startNS && (it.startNS || 0) < endNS) {
        if (!it.frame) {
          it.frame = new Rect(0, 0, 0, 0);
          it.frame.y = y;
        }
        it.frame.height = it.height!;
        HiPerfStruct.setFrame(it, pns, startNS, endNS, frame);
      } else {
        it.frame = undefined;
      }
    }
    return;
  }
}

export class HiPerfStruct extends BaseStruct {
  static hoverStruct: HiPerfStruct | undefined;
  static selectStruct: HiPerfStruct | undefined;
  static bottomFindCount: number = 0;
  id: number | undefined;
  callchain_id: number | undefined;
  timestamp: number | undefined;
  thread_id: number | undefined;
  event_count: number | undefined;
  event_type_id: number | undefined;
  cpu_id: number | undefined;
  thread_state: string | undefined;
  startNS: number | undefined;
  endNS: number | undefined;
  dur: number | undefined;
  height: number | undefined;
  eventCount: number | undefined;
  sampleCount: number | undefined;

  static drawRoundRectPath(cxt: Path2D, x: number, y: number, width: number, height: number, radius: number): void {
    cxt.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
    cxt.lineTo(x + radius, y + height);
    cxt.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
    cxt.lineTo(x, y + radius);
    cxt.arc(x + radius, y + radius, radius, Math.PI, (Math.PI * 3) / 2);
    cxt.lineTo(x + width - radius, y);
    cxt.arc(x + width - radius, y + radius, radius, (Math.PI * 3) / 2, Math.PI * 2);
    cxt.lineTo(x + width, y + height - radius);
    cxt.moveTo(x + width / 3, y + height / 5);
    cxt.lineTo(x + width / 3, y + (height / 5) * 4);
    cxt.moveTo(x + width / 3, y + height / 5);
    cxt.bezierCurveTo(
      x + width / 3 + 7,
      y + height / 5 - 2,
      x + width / 3 + 7,
      y + height / 5 + 6,
      x + width / 3,
      y + height / 5 + 4
    );
  }

  static draw(
    ctx: CanvasRenderingContext2D,
    normalPath: Path2D,
    specPath: Path2D,
    data: HiPerfStruct,
    groupBy10MS: boolean,
    textMetrics?: TextMetrics
  ): void {
    if (data.frame) {
      if (groupBy10MS) {
        let width = data.frame.width;
        normalPath.rect(data.frame.x, 40 - (data.height || 0), width, data.height || 0);
      } else {
        data.frame.width > 4 ? (data.frame.width = 4) : (data.frame.width = data.frame.width);
        let path = data.callchain_id === -1 ? specPath : normalPath;
        path.moveTo(data.frame.x + 7, 20);
        if (textMetrics) {
          ctx.fillText('🄿', data.frame.x - textMetrics!.width / 2, 26); //℗©®℗®🄿
        } else {
          HiPerfStruct.drawRoundRectPath(path, data.frame.x - 7, 20 - 7, 14, 14, 3);
        }
        path.moveTo(data.frame.x, 27);
        path.lineTo(data.frame.x, 33);
      }
    }
  }

  static drawSpecialPath(ctx: CanvasRenderingContext2D, specPath: Path2D): void {
    ctx.strokeStyle = '#9fafc4';
    ctx.globalAlpha = 0.5;
    ctx.stroke(specPath);
    ctx.globalAlpha = 1;
  }

  static setFrame(node: HiPerfStruct, pns: number, startNS: number, endNS: number, frame: Rect): void {
    if (!node.frame) {
      return;
    }
    if ((node.startNS || 0) < startNS) {
      node.frame.x = 0;
    } else {
      node.frame.x = Math.floor(((node.startNS || 0) - startNS) / pns);
    }
    if ((node.startNS || 0) + (node.dur || 0) > endNS) {
      node.frame.width = frame.width - node.frame.x;
    } else {
      node.frame.width = Math.ceil(((node.startNS || 0) + (node.dur || 0) - startNS) / pns - node.frame.x);
    }
    if (node.frame.width < 1) {
      node.frame.width = 1;
    }
  }

  static groupBy10MS(
    groupArray: Array<HiPerfStruct>,
    intervalPerf: number,
    maxCpu?: number | undefined,
    usage?: boolean,
    event?: number
  ): Array<HiPerfStruct> {
    let maxEventCount = 0;
    let obj = filterGroupArray(groupArray, maxEventCount, usage, event);
    let arr = [];
    for (let aKey in obj) {
      let ns = parseInt(aKey);
      let height: number = 0;
      if (usage) {
        if (maxCpu !== undefined) {
          //@ts-ignore
          height = Math.floor((obj[aKey].sampleCount / (10 / intervalPerf) / maxCpu) * 40);
        } else {
          //@ts-ignore
          height = Math.floor((obj[aKey].sampleCount / (10 / intervalPerf)) * 40);
        }
      } else {
        //@ts-ignore
        height = Math.floor((obj[aKey].eventCount / maxEventCount) * 40);
      }
      arr.push({
        startNS: ns,
        dur: 10_000_000,
        //@ts-ignore
        eventCount: obj[aKey].eventCount,
        //@ts-ignore
        sampleCount: obj[aKey].sampleCount,
        height: height,
      });
    }
    return arr as HiPerfStruct[];
  }
}

function filterGroupArray(
  groupArray: Array<HiPerfStruct>,
  maxEventCount: number,
  usage?: boolean,
  event?: number
): HiPerfStruct {
  const map = groupArray.map((it) => {
    //@ts-ignore
    it.timestamp_group = Math.trunc(it.startNS / 10_000_000) * 10_000_000;
    return it;
  });
  const reduce = map.reduce((pre: HiPerfStruct, current: HiPerfStruct) => {
    if (usage || current.event_type_id === event || event === -1) {
      //@ts-ignore
      if (pre[current.timestamp_group]) {
        //@ts-ignore
        pre[current.timestamp_group].sampleCount += 1;
        //@ts-ignore
        pre[current.timestamp_group].eventCount += current.event_count;
      } else {
        //@ts-ignore
        pre[current.timestamp_group] = {
          sampleCount: 1,
          eventCount: current.event_count,
        };
      }
      //@ts-ignore
      maxEventCount = Math.max(pre[current.timestamp_group].eventCount, maxEventCount);
    }
    return pre;
  }, new HiPerfStruct());
  return reduce;
}

function setMemFrame(
  node: ProcessMemStruct,
  padding: number,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  let x1: number;
  let x2: number;
  if ((node.startTime || 0) <= startNS) {
    x1 = 0;
  } else {
    x1 = ns2x(node.startTime || 0, startNS, endNS, totalNS, frame);
  }
  if ((node.startTime || 0) + (node.duration || 0) >= endNS) {
    x2 = frame.width;
  } else {
    x2 = ns2x((node.startTime || 0) + (node.duration || 0), startNS, endNS, totalNS, frame);
  }
  let getV: number = x2 - x1 <= 1 ? 1 : x2 - x1;
  if (!node.frame) {
    node.frame = new Rect(0, 0, 0, 0);
  }
  node.frame.x = Math.floor(x1);
  node.frame.y = Math.floor(frame.y + padding);
  node.frame.width = Math.ceil(getV);
  node.frame.height = Math.floor(frame.height - padding * 2);
}

export function mem(
  list: Array<unknown>,
  memFilter: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && memFilter.length > 0) {
    for (let i = 0, len = memFilter.length; i < len; i++) {
      if (
        //@ts-ignore
        (memFilter[i].startTime || 0) + (memFilter[i].duration || 0) > startNS &&
        //@ts-ignore
        (memFilter[i].startTime || 0) < endNS
      ) {
        //@ts-ignore
        setMemFrame(memFilter[i], 5, startNS, endNS, totalNS, frame);
      } else {
        //@ts-ignore
        memFilter[i].frame = undefined;
      }
    }
    return;
  }
  memFilter.length = 0;
  //@ts-ignore
  setMemFilter(list, memFilter, startNS, endNS, totalNS, frame);
}

function setMemFilter(
  list: Array<ProcessMemStruct>,
  memFilter: Array<ProcessMemStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (list) {
    for (let i = 0, len = list.length; i < len; i++) {
      let it = list[i];
      if ((it.startTime || 0) + (it.duration || 0) > startNS && (it.startTime || 0) < endNS) {
        setMemFrame(list[i], 5, startNS, endNS, totalNS, frame);
        if (
          i > 0 &&
          (list[i - 1].frame?.x || 0) === (list[i].frame?.x || 0) &&
          (list[i - 1].frame?.width || 0) === (list[i].frame?.width || 0)
        ) {
        } else {
          memFilter.push(list[i]);
        }
      }
    }
  }
}

export function drawWakeUpList(
  wakeUpListContext: CanvasRenderingContext2D | undefined | null,
  wake: WakeupBean | undefined | null,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  wakeup: WakeupBean | undefined = undefined,
  currentCpu: number | undefined | null = undefined,
  noVerticalLine = false
): void {
  if (!wakeUpListContext) {
    return;
  }
  if (wake) {
    let x1 = Math.floor(ns2x(wake.wakeupTime || 0, startNS, endNS, totalNS, frame));
    wakeUpListContext.beginPath();
    wakeUpListContext.lineWidth = 2;
    wakeUpListContext.fillStyle = '#000000';
    if (x1 > 0 && x1 < frame.x + frame.width) {
      if (!noVerticalLine) {
        wakeUpListContext.moveTo(x1, frame.y);
        wakeUpListContext.lineTo(x1, frame.y + frame.height);
      }
      if (currentCpu === wake.cpu) {
        let centerY = Math.floor(frame.y + frame.height / 2);
        wakeUpListContext.moveTo(x1, centerY - 6);
        wakeUpListContext.lineTo(x1 + 4, centerY);
        wakeUpListContext.lineTo(x1, centerY + 6);
        wakeUpListContext.lineTo(x1 - 4, centerY);
        wakeUpListContext.lineTo(x1, centerY - 6);
        wakeUpListContext.fill();
      }
    }
    if (wakeup) {
      drawWakeUpListIfWakeUp(wakeUpListContext, wake, startNS, endNS, totalNS, frame, wakeup, x1);
    }
    wakeUpListContext.strokeStyle = '#000000';
    wakeUpListContext.stroke();
    wakeUpListContext.closePath();
  }
}

function drawWakeUpListIfWakeUp(
  wakeUpListContext: CanvasRenderingContext2D,
  wake: WakeupBean,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  wakeup: WakeupBean,
  x1: number
): void {
  let x2 = Math.floor(ns2x(wakeup.ts || 0, startNS, endNS, totalNS, frame));
  let y = frame.y + frame.height - 10;
  wakeUpListContext.moveTo(x1, y);
  wakeUpListContext.lineTo(x2, y);
  wakeUpListContext.moveTo(x2, y - 25);
  wakeUpListContext.lineTo(x2, y + 5);
  let s = ns2s((wakeup.ts || 0) - (wake.wakeupTime || 0));
  let wakeUpListDistance = x2 - x1;
  if (wakeUpListDistance > 12) {
    wakeUpListContext.moveTo(x1, y);
    wakeUpListContext.lineTo(x1 + 6, y - 3);
    wakeUpListContext.moveTo(x1, y);
    wakeUpListContext.lineTo(x1 + 6, y + 3);
    wakeUpListContext.moveTo(x2, y);
    wakeUpListContext.lineTo(x2 - 6, y - 3);
    wakeUpListContext.moveTo(x2, y);
    wakeUpListContext.lineTo(x2 - 6, y + 3);
    let measure = wakeUpListContext.measureText(s);
    let tHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
    let xStart = x1 + Math.floor(wakeUpListDistance / 2 - measure.width / 2);
    if (wakeUpListDistance > measure.width + 4) {
      wakeUpListContext.fillStyle = '#ffffff';
      wakeUpListContext.fillRect(xStart - 2, y - 4 - tHeight, measure.width + 4, tHeight + 4);
      wakeUpListContext.font = '10px solid';
      wakeUpListContext.fillStyle = '#000000';
      wakeUpListContext.textBaseline = 'bottom';
      wakeUpListContext.fillText(s, xStart, y - 2);
    }
  }
}
interface SearchNode {
  symbolName?: string;
  children: SearchNode[];
  searchShow?: boolean;
  isSearch?: boolean;
  parent?: SearchNode;
}

export function findSearchNode(data: unknown[], search: string, parentSearch: boolean): void {
  search = search.toLocaleLowerCase();
  data.forEach((nodeIt) => {
    const node = nodeIt as SearchNode;
    if ((node.symbolName && node.symbolName.toLocaleLowerCase().includes(search) && search !== '') || parentSearch) {
      node.searchShow = true;
      node.isSearch = node.symbolName !== undefined && node.symbolName.toLocaleLowerCase().includes(search);
      let parentNode = node.parent;
      while (parentNode && !parentNode.searchShow) {
        parentNode.searchShow = true;
        parentNode = parentNode.parent;
      }
      if (node.isSearch && search !== '') {
        HiPerfStruct.bottomFindCount += 1;
      }
    } else {
      node.searchShow = false;
      node.isSearch = false;
    }
    if (node.children.length > 0) {
      findSearchNode(node.children, search, node.searchShow);
    }
  });
}

// draw prio curve
// @ts-ignore
export function prioClickHandlerFun(param: unknown, row: TraceRow<unknown>, threadFilter: Array<ThreadStruct>, arr: unknown, oldVal: number): void {
  //@ts-ignore
  let maxCount = Math.max(...param.map((obj: unknown) => obj.count));
  //@ts-ignore
  let maxCountPrio = param.find((obj: unknown) => obj.count === maxCount).prio;//找出出现次数最多的优先级，为中位值
  //@ts-ignore
  let maxPrioDiff = Math.max(...param.map((obj: unknown) => Math.abs(obj.prio - Number(maxCountPrio))));//找出与中位值的最大diff
  let maxPointInterval = Math.ceil(maxPrioDiff / 4);//diff分成4份,每一份占多少px

  for (let i = 0; i < threadFilter.length; i++) {
    const item = threadFilter[i];
    const preItem = threadFilter[i - 1];
    //给原始数据添加prio值
    let slice = Utils.getInstance().getSchedSliceMap().get(`${item.id}-${item.startTime}`);
    if (slice) {
      item.prio = slice!.priority;
    }
    //合并prio值相同的项提高画图速度
    if (
      item.prio &&
      (oldVal !== item.prio || i === threadFilter.length - 2 || i === threadFilter.length - 1)
    ) {
      configCurveY(row, item, maxCountPrio, maxPointInterval);
      //处理prio值变化前的
      if (i !== 0) {
        configCurveY(row, preItem, maxCountPrio, maxPointInterval);
        //@ts-ignore
        arr.push(preItem);
      }
      //@ts-ignore
      arr.push(item);
      oldVal = item.prio;
    }
  }
}

//确定曲线波动时的y轴
//@ts-ignore
function configCurveY(row: TraceRow<unknown>, item: ThreadStruct, maxCountPrio: number, maxPointInterval: number): void {
  if (item.prio === Number(maxCountPrio)) {
    item.curveFloatY = 3 + 12 / 2 + row.translateY;
  } else if (item.prio! > Number(maxCountPrio)) {
    let prioHeight = Math.floor((item.prio! - Number(maxCountPrio)) / maxPointInterval) * 2;
    item.curveFloatY = 3 + 12 / 2 - prioHeight + row.translateY;
  } else if (item.prio! < Number(maxCountPrio)) {
    let prioHeight = Math.floor((Number(maxCountPrio) - item.prio!) / maxPointInterval) * 2;
    item.curveFloatY = 3 + 12 / 2 + prioHeight + row.translateY;
  }
}

export function drawThreadCurve(context: CanvasRenderingContext2D, threadFilter: ThreadStruct, nextFilter: ThreadStruct): void {
  // 绘制曲线
  if (threadFilter.frame && nextFilter.frame) {
    let p1 = threadFilter;
    let p2 = nextFilter;
    let diff = p2.curveFloatY! >= p1.curveFloatY! ? p2.curveFloatY! - p1.curveFloatY! : p1.curveFloatY! - p2.curveFloatY!;
    let cp1x = p1.frame!.x + (p2.frame!.x - p1.frame!.x) / 5;
    let cp1y = p2.curveFloatY! >= p1.curveFloatY! ? p1.curveFloatY! - diff / 5 : p1.curveFloatY! + diff / 5;
    let cp2x = p2.frame!.x - (p2.frame!.x - p1.frame!.x) / 5;
    let cp2y = p2.curveFloatY! >= p1.curveFloatY! ? p2.curveFloatY! + diff / 5 : p2.curveFloatY! - diff / 5;
    context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.frame!.x, p2.curveFloatY!);
    context.lineWidth = 1;
    context.strokeStyle = '#ffc90e';
    context.lineCap = 'round';
  }
  context.stroke();
}
