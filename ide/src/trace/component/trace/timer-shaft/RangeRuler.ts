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

import { Graph } from './Graph';
import { Rect } from './Rect';
import { ns2UnitS, TimerShaftElement } from '../TimerShaftElement';
import { ColorUtils, interpolateColorBrightness } from '../base/ColorUtils';
import { CpuStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { CurrentSlicesTime, SpSystemTrace } from '../../SpSystemTrace';

const MarkPadding = 5;
const FIT_TOTALX_MIN: number = 280;
const FIT_TOTALX_MAX: number = 300;
const MID_OFFSET: number = 10;

export class Mark extends Graph {
  name: string | undefined;
  inspectionFrame: Rect;
  private _isHover: boolean = false;

  constructor(canvas: HTMLCanvasElement | undefined | null, name: string, c: CanvasRenderingContext2D, frame: Rect) {
    super(canvas, c, frame);
    this.name = name;
    this.inspectionFrame = new Rect(frame.x - MarkPadding, frame.y, frame.width + MarkPadding * 2, frame.height);
  }

  get isHover(): boolean {
    return this._isHover;
  }

  set isHover(value: boolean) {
    this._isHover = value;
    if (value) {
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  draw(): void {
    this.context2D.beginPath();
    this.context2D.strokeStyle = '#999999';
    this.context2D.lineWidth = 7;
    this.context2D.moveTo(this.frame.x, this.frame.y);
    this.context2D.lineTo(this.frame.x, this.frame.y + this.frame.height / 3);
    this.context2D.stroke();
    this.context2D.strokeStyle = '#999999';
    this.context2D.lineWidth = 1;
    this.context2D.moveTo(this.frame.x, this.frame.y);
    this.context2D.lineTo(this.frame.x, this.frame.y + this.frame.height);
    this.context2D.stroke();
    this.context2D.closePath();
  }
}

export interface TimeRange {
  slicesTime: {
    color: string | null | undefined;
    startTime: number | null | undefined;
    endTime: number | null | undefined;
  };
  scale: number;
  totalNS: number;
  startX: number;
  endX: number;
  startNS: number;
  endNS: number;
  xs: Array<number>;
  refresh: boolean;
  xsTxt: Array<string>;
}

export class RangeRuler extends Graph {
  public rangeRect: Rect;
  public currentSlicesTime: CurrentSlicesTime;
  public markAObj: Mark;
  public markBObj: Mark;
  public drawMark: boolean = false;
  public range: TimeRange;
  private pressedKeys: Array<string> = [];
  mouseDownOffsetX = 0;
  mouseDownMovingMarkX = 0;
  movingMark: Mark | undefined | null;
  isMouseDown: boolean = false;
  isMovingRange: boolean = false;
  isNewRange: boolean = false;
  markAX: number = 0;
  markBX: number = 0;
  isPress: boolean = false;
  pressFrameIdF: number = -1;
  pressFrameIdW: number = -1;
  pressFrameIdS: number = -1;
  pressFrameIdA: number = -1;
  pressFrameIdD: number = -1;
  upFrameIdW: number = -1;
  upFrameIdS: number = -1;
  upFrameIdA: number = -1;
  upFrameIdD: number = -1;
  currentDuration: number = 0;
  cacheInterval: { interval: number; value: number; flag: boolean } = {
    interval: 200,
    value: 0,
    flag: false,
  };
  centerXPercentage: number = 0;
  animaStartTime: number | undefined;
  p: number = 1000;
  private readonly notifyHandler: (r: TimeRange) => void;
  private scale: number = 0;
  private delayTimer: any = null;
  private rulerW = 0;

  //缩放级别
  private scales: Array<number> = [
    50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000,
    5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000, 200_000_000, 500_000_000, 1_000_000_000, 2_000_000_000,
    5_000_000_000, 10_000_000_000, 20_000_000_000, 50_000_000_000, 100_000_000_000, 200_000_000_000, 500_000_000_000,
    1_000_000_000_000, 2_000_000_000_000, 5_000_000_000_000,
  ];
  private _cpuUsage: Array<{ cpu: number; ro: number; rate: number }> = [];

  constructor(timerShaftEL: TimerShaftElement, frame: Rect, range: TimeRange, notifyHandler: (r: TimeRange) => void) {
    super(timerShaftEL.canvas, timerShaftEL.ctx!, frame);
    this.range = range;
    this.notifyHandler = notifyHandler;
    this.markAObj = new Mark(
      timerShaftEL.canvas,
      'A',
      timerShaftEL.ctx!,
      new Rect(range.startX, frame.y, 1, frame.height)
    );
    this.markBObj = new Mark(
      timerShaftEL.canvas,
      'B',
      timerShaftEL.ctx!,
      new Rect(range.endX, frame.y, 1, frame.height)
    );
    this.rangeRect = new Rect(range.startX, frame.y, range.endX - range.startX, frame.height);
    this.currentSlicesTime = new CurrentSlicesTime();
  }

  set cpuUsage(value: Array<{ cpu: number; ro: number; rate: number }>) {
    this._cpuUsage = value;
    this.draw();
  }

  drawCpuUsage(): void {
    this.context2D.clearRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
    let miniHeight = Math.round(this.frame.height / CpuStruct.cpuCount); //每格高度
    let miniWidth = Math.ceil(this.frame.width / 100); //每格宽度
    for (let index = 0; index < this._cpuUsage.length; index++) {
      let cpuUsageItem = this._cpuUsage[index];
      const color = interpolateColorBrightness(ColorUtils.MD_PALETTE[cpuUsageItem.cpu], cpuUsageItem.rate);
      this.context2D.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      this.context2D.globalAlpha = cpuUsageItem.rate;
      this.context2D.fillRect(
        this.frame.x + miniWidth * cpuUsageItem.ro,
        this.frame.y + cpuUsageItem.cpu * miniHeight,
        miniWidth,
        miniHeight
      );
    }
  }

  draw(discardNotify: boolean = false): void {
    this.context2D.clearRect(
      this.frame.x - MarkPadding,
      this.frame.y,
      this.frame.width + MarkPadding * 2,
      this.frame.height
    );
    this.context2D.beginPath();
    if (this._cpuUsage.length > 0) {
      this.drawCpuUsage();
      this.context2D.globalAlpha = 0;
    } else {
      this.context2D.globalAlpha = 1;
    }
    //绘制选中区域
    if (this.drawMark) {
      this.drawSelectionRange();
    }
    if (this.notifyHandler) {
      this.range.startX = this.rangeRect.x;
      this.range.endX = this.rangeRect.x + this.rangeRect.width;
      this.range.startNS = (this.range.startX * this.range.totalNS) / (this.canvas?.clientWidth || 0);
      this.range.endNS = (this.range.endX * this.range.totalNS) / (this.canvas?.clientWidth || 0);
      this.calculateScale();
      this.updateRange();
      if (!discardNotify) {
        this.notifyHandler(this.range);
      }
    }
  }

  private updateRange(): void {
    let tempNs = 0;
    let rangeStartX = 0;
    let rangeYu = this.range.startNS % this.scale;
    let rangeRealW = (this.scale * this.frame.width) / (this.range.endNS - this.range.startNS);
    if (this.range.xsTxt) {
      this.range.xsTxt.length = 0;
    } else {
      this.range.xsTxt = [];
    }
    if (this.range.xs) {
      this.range.xs.length = 0;
    } else {
      this.range.xs = [];
    }
    this.range.scale = this.scale;
    if (rangeYu !== 0) {
      let first_NodeWidth = ((this.scale - rangeYu) / this.scale) * rangeRealW;
      rangeStartX += first_NodeWidth;
      tempNs += this.scale - rangeYu;
      this.range.xs.push(rangeStartX);
      this.range.xsTxt.push(ns2UnitS(tempNs + this.range.startNS, this.scale));
    }
    while (tempNs < this.range.endNS - this.range.startNS) {
      rangeStartX += rangeRealW;
      tempNs += this.scale;
      this.range.xs.push(rangeStartX);
      this.range.xsTxt.push(ns2UnitS(tempNs + this.range.startNS, this.scale));
    }
  }

  private calculateScale(): void {
    let l20 = (this.range.endNS - this.range.startNS) / 20;
    let minScale = 0;
    let maxScale = 0;
    let weight = 0;
    for (let scalesIndex = 0; scalesIndex < this.scales.length; scalesIndex++) {
      if (this.scales[scalesIndex] > l20) {
        if (scalesIndex > 0) {
          minScale = this.scales[scalesIndex - 1];
        } else {
          minScale = 0;
        }
        maxScale = this.scales[scalesIndex];
        weight = ((l20 - minScale) * 1.0) / (maxScale - minScale);
        if (weight > 0.243) {
          this.scale = maxScale;
        } else {
          this.scale = minScale;
        }
        break;
      }
    }
    if (this.scale === 0) {
      this.scale = this.scales[0];
    }
  }

  private drawSelectionRange(): void {
    this.context2D.fillStyle = window.getComputedStyle(this.canvas!, null).getPropertyValue('background-color');
    this.rangeRect.x = this.markAObj.frame.x < this.markBObj.frame.x ? this.markAObj.frame.x : this.markBObj.frame.x;
    this.rangeRect.width = Math.abs(this.markBObj.frame.x - this.markAObj.frame.x);
    this.context2D.fillRect(this.rangeRect.x, this.rangeRect.y, this.rangeRect.width, this.rangeRect.height);
    this.context2D.globalAlpha = 1;
    this.context2D.globalAlpha = 0.5;
    this.context2D.fillStyle = '#999999';
    this.context2D.fillRect(this.frame.x, this.frame.y, this.rangeRect.x, this.rangeRect.height);
    this.context2D.fillRect(
      this.rangeRect.x + this.rangeRect.width,
      this.frame.y,
      this.frame.width - this.rangeRect.width,
      this.rangeRect.height
    );
    this.context2D.globalAlpha = 1;
    this.context2D.closePath();
    this.markAObj.draw();
    this.markBObj.draw();
  }

  getScale(): number {
    return this.scale;
  }

  mouseDown(mouseEventDown: MouseEvent): void {
    let mouseDown_x = mouseEventDown.offsetX - (this.canvas?.offsetLeft || 0);
    let mouseDown_y = mouseEventDown.offsetY - (this.canvas?.offsetTop || 0);
    this.isMouseDown = true;
    this.mouseDownOffsetX = mouseDown_x;
    if (this.markAObj.isHover) {
      this.movingMark = this.markAObj;
      this.mouseDownMovingMarkX = this.movingMark.frame.x || 0;
    } else if (this.markBObj.isHover) {
      this.movingMark = this.markBObj;
      this.mouseDownMovingMarkX = this.movingMark.frame.x || 0;
    } else {
      this.movingMark = null;
    }
    if (this.rangeRect.containsWithPadding(mouseDown_x, mouseDown_y, 5, 0)) {
      this.isMovingRange = true;
      this.markAX = this.markAObj.frame.x;
      this.markBX = this.markBObj.frame.x;
      document.body.style.cursor = 'move';
    } else if (
      this.frame.containsWithMargin(mouseDown_x, mouseDown_y, 20, 0, 0, 0) &&
      !this.rangeRect.containsWithMargin(mouseDown_x, mouseDown_y, 0, MarkPadding, 0, MarkPadding)
    ) {
      this.isNewRange = true;
    }
  }

  mouseUp(ev: MouseEvent) {
    this.isMouseDown = false;
    this.isMovingRange = false;
    this.isNewRange = false;
    this.movingMark = null;
  }

  mouseMove(ev: MouseEvent, trace: SpSystemTrace): void {
    this.range.refresh = false;
    let move_x = ev.offsetX - (this.canvas?.offsetLeft || 0);
    let move_y = ev.offsetY - (this.canvas?.offsetTop || 0);
    this.centerXPercentage = move_x / (this.canvas?.clientWidth || 0);
    if (this.centerXPercentage <= 0) {
      this.centerXPercentage = 0;
    } else if (this.centerXPercentage >= 1) {
      this.centerXPercentage = 1;
    }
    let maxX = this.canvas?.clientWidth || 0;
    if (this.markAObj.inspectionFrame.contains(move_x, move_y)) {
      this.markAObj.isHover = true;
    } else if (this.markBObj.inspectionFrame.contains(move_x, move_y)) {
      this.markBObj.isHover = true;
    } else {
      this.markAObj.isHover = false;
      this.markBObj.isHover = false;
    }
    this.handleMovingMark(move_x, move_y, maxX, trace);
    this.handleMovingFresh(move_x, maxX);
  }

  private handleMovingFresh(move_x: number, maxX: number): void {
    if (this.isMovingRange && this.isMouseDown) {
      let result = move_x - this.mouseDownOffsetX;
      let mA = result + this.markAX;
      let mB = result + this.markBX;
      if (mA >= 0 && mA <= maxX) {
        this.markAObj.frame.x = mA;
      } else if (mA < 0) {
        this.markAObj.frame.x = 0;
      } else {
        this.markAObj.frame.x = maxX;
      }
      this.markAObj.inspectionFrame.x = this.markAObj.frame.x - MarkPadding;
      if (mB >= 0 && mB <= maxX) {
        this.markBObj.frame.x = mB;
      } else if (mB < 0) {
        this.markBObj.frame.x = 0;
      } else {
        this.markBObj.frame.x = maxX;
      }
      this.markBObj.inspectionFrame.x = this.markBObj.frame.x - MarkPadding;
      this.recordMovingS();
      requestAnimationFrame(() => {
        this.draw();
        this.range.refresh = false;
        this.delayDraw();
      });
    } else if (this.isNewRange) {
      this.markAObj.frame.x = this.mouseDownOffsetX;
      this.markAObj.inspectionFrame.x = this.mouseDownOffsetX - MarkPadding;
      if (move_x >= 0 && move_x <= maxX) {
        this.markBObj.frame.x = move_x;
      } else if (move_x < 0) {
        this.markBObj.frame.x = 0;
      } else {
        this.markBObj.frame.x = maxX;
      }
      this.markBObj.inspectionFrame.x = this.markBObj.frame.x - MarkPadding;
      this.recordMovingS();
      requestAnimationFrame(() => {
        this.draw();
        this.range.refresh = false;
        this.delayDraw();
      });
    }
  }

  private handleMovingMark(
    move_x: number,
    move_y: number,
    maxX: number,
    trace: SpSystemTrace
  ): void {
    if (this.movingMark) {
      let result = move_x - this.mouseDownOffsetX + this.mouseDownMovingMarkX;
      if (result >= 0 && result <= maxX) {
        this.movingMark.frame.x = result;
      } else if (result < 0) {
        this.movingMark.frame.x = 0;
      } else {
        this.movingMark.frame.x = maxX;
      }
      this.movingMark.inspectionFrame.x = this.movingMark.frame.x - MarkPadding;
      this.recordMovingS();
      requestAnimationFrame(() => {
        this.draw();
        this.range.refresh = false;
        this.delayDraw();
      });
    } else if (this.rangeRect.containsWithPadding(move_x, move_y, MarkPadding, 0)) {
      trace.style.cursor = 'move';
      document.body.style.cursor = 'move';
    } else if (
      this.frame.containsWithMargin(move_x, move_y, 20, 0, 0, 0) &&
      !this.rangeRect.containsWithMargin(move_x, move_y, 0, MarkPadding, 0, MarkPadding)
    ) {
      trace.style.cursor = 'crosshair';
      document.body.style.cursor = 'crosshair';
    }
  }

  recordMovingS() {
    if (this.animaStartTime == undefined) {
      let dat = new Date();
      dat.setTime(dat.getTime() - 400);
      this.animaStartTime = dat.getTime();
    }
    this.currentDuration = new Date().getTime() - this.animaStartTime;
    this.setCacheInterval();
    this.range.refresh = this.cacheInterval.flag;
  }

  setCacheInterval() {
    if (Math.trunc(this.currentDuration / this.cacheInterval.interval) !== this.cacheInterval.value) {
      this.cacheInterval.flag = true;
      this.cacheInterval.value = Math.trunc(this.currentDuration / this.cacheInterval.interval);
    } else {
      this.cacheInterval.flag = false;
    }
  }

  delayDraw() {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
    }
    this.delayTimer = setTimeout(() => {
      this.range.refresh = true;
      this.draw();
      this.range.refresh = false;
      this.animaStartTime = undefined;
    }, this.cacheInterval.interval + 50);
  }

  mouseOut(ev: MouseEvent): void {
    this.movingMark = null;
  }

  fillX() {
    if (this.range.endNS < 0) this.range.endNS = 0;
    if (this.range.startNS < 0) this.range.startNS = 0;
    if (this.range.endNS > this.range.totalNS) this.range.endNS = this.range.totalNS;
    if (this.range.startNS > this.range.totalNS) this.range.startNS = this.range.totalNS;
    this.range.startX = (this.range.startNS * (this.canvas?.clientWidth || 0)) / this.range.totalNS;
    this.range.endX = (this.range.endNS * (this.canvas?.clientWidth || 0)) / this.range.totalNS;
    this.markAObj.frame.x = this.range.startX;
    this.markAObj.inspectionFrame.x = this.markAObj.frame.x - MarkPadding;
    this.markBObj.frame.x = this.range.endX;
    this.markBObj.inspectionFrame.x = this.markBObj.frame.x - MarkPadding;
  }

  setRangeNS(startNS: number, endNS: number) {
    this.range.startNS = startNS;
    this.range.endNS = endNS;
    this.fillX();
    this.draw();
  }

  getRange(): TimeRange {
    return this.range;
  }

  cancelPressFrame(): void {
    if (this.pressFrameIdA !== -1) cancelAnimationFrame(this.pressFrameIdA);
    if (this.pressFrameIdD !== -1) cancelAnimationFrame(this.pressFrameIdD);
    if (this.pressFrameIdW !== -1) cancelAnimationFrame(this.pressFrameIdW);
    if (this.pressFrameIdS !== -1) cancelAnimationFrame(this.pressFrameIdS);
    if (this.pressFrameIdF !== -1) cancelAnimationFrame(this.pressFrameIdF);
  }

  cancelUpFrame(): void {
    if (this.upFrameIdA !== -1) cancelAnimationFrame(this.upFrameIdA);
    if (this.upFrameIdD !== -1) cancelAnimationFrame(this.upFrameIdD);
    if (this.upFrameIdW !== -1) cancelAnimationFrame(this.upFrameIdW);
    if (this.upFrameIdS !== -1) cancelAnimationFrame(this.upFrameIdS);
  }

  cancelTimeOut: any = undefined;
  isKeyPress: boolean = false;

  keyPress(keyboardEvent: KeyboardEvent, currentSlicesTime?: CurrentSlicesTime) {
    //第一个按键或者最后一个按下的和当前按键不一致
    if (
      this.pressedKeys.length == 0 ||
      this.pressedKeys[this.pressedKeys.length - 1] !== keyboardEvent.key.toLocaleLowerCase()
    ) {
      this.setCacheInterval();
      this.range.refresh = this.cacheInterval.flag;
      if (currentSlicesTime) {
        this.currentSlicesTime = currentSlicesTime;
      }
      this.cancelPressFrame();
      this.cancelUpFrame();
      this.pressedKeys.push(keyboardEvent.key.toLocaleLowerCase());
      this.animaStartTime = new Date().getTime(); //记录按下的时间
      this.keyboardKeyPressMap[this.pressedKeys[this.pressedKeys.length - 1]]?.bind(this)();
    }
    this.isPress = true;
  }

  keyPressF(): void {
    let animF = () => {
      let clientWidth = this.canvas?.clientWidth || 0;
      let midX = Math.round(clientWidth / 2);
      let startTime = 0;
      let endTime = 0;
      this.rulerW = this.canvas!.offsetWidth;
      if (this.currentSlicesTime.startTime) {
        startTime = this.currentSlicesTime.startTime;
      } else {
        return;
      }
      if (this.currentSlicesTime.endTime) {
        endTime = this.currentSlicesTime.endTime;
      } else {
        return;
      }
      let startX = midX - 150;
      let endX = midX + 150;
      this.range.startNS = (endX * startTime - startX * endTime) / (endX - startX);
      this.range.endNS = ((this.rulerW * (endTime - this.range.startNS)) + this.range.startNS * endX) / endX;
      this.fillX();
      this.draw();
      this.range.refresh = true;
      this.notifyHandler(this.range);
      this.range.refresh = false;
      this.pressFrameIdF = requestAnimationFrame(animF);
    };
    this.pressFrameIdF = requestAnimationFrame(animF);
  }

  fixReg = 76; //速度上线
  f = 11; //加速度系数,值越小加速度越大

  keyPressW() {
    let animW = (): void => {
      if (this.scale === 50) {
        this.fillX();
        this.range.refresh = true;
        this.notifyHandler(this.range);
        this.range.refresh = false;
        return;
      }
      this.currentDuration = (Date.now() - this.animaStartTime!) / this.f; //reg
      if (this.currentDuration >= this.fixReg) {
        this.currentDuration = this.fixReg;
      }
      let bb = Math.tan((Math.PI / 180) * this.currentDuration);
      this.range.startNS += this.centerXPercentage * bb * this.scale;
      this.range.endNS -= (1 - this.centerXPercentage) * bb * this.scale;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      this.pressFrameIdW = requestAnimationFrame(animW);
    };
    this.pressFrameIdW = requestAnimationFrame(animW);
  }

  keyPressS(): void {
    let animS = (): void => {
      if (this.range.startNS <= 0 && this.range.endNS >= this.range.totalNS) {
        this.fillX();
        this.range.refresh = true;
        this.notifyHandler(this.range);
        this.range.refresh = false;
        return;
      }
      this.currentDuration = (Date.now() - this.animaStartTime!) / this.f;
      if (this.currentDuration >= this.fixReg) {
        this.currentDuration = this.fixReg;
      }
      let bb = Math.tan((Math.PI / 180) * this.currentDuration);
      this.range.startNS -= this.centerXPercentage * bb * this.scale;
      this.range.endNS += (1 - this.centerXPercentage) * bb * this.scale;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      this.pressFrameIdS = requestAnimationFrame(animS);
    };
    this.pressFrameIdS = requestAnimationFrame(animS);
  }

  keyPressA(): void {
    let animA = (): void => {
      if (this.range.startNS <= 0) {
        this.fillX();
        this.range.refresh = true;
        this.notifyHandler(this.range);
        this.range.refresh = false;
        return;
      }
      this.currentDuration = (Date.now() - this.animaStartTime!) / this.f;
      if (this.currentDuration >= this.fixReg) {
        this.currentDuration = this.fixReg;
      }
      let bb = Math.tan((Math.PI / 180) * this.currentDuration);
      let s = this.scale * bb;
      this.range.startNS -= s;
      this.range.endNS -= s;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      this.pressFrameIdA = requestAnimationFrame(animA);
    };
    this.pressFrameIdA = requestAnimationFrame(animA);
  }

  keyPressD(): void {
    let animD = (): void => {
      if (this.range.endNS >= this.range.totalNS) {
        this.fillX();
        this.range.refresh = true;
        this.notifyHandler(this.range);
        this.range.refresh = false;
        return;
      }
      this.currentDuration = (Date.now() - this.animaStartTime!) / this.f;
      if (this.currentDuration >= this.fixReg) this.currentDuration = this.fixReg;
      let bb = Math.tan((Math.PI / 180) * this.currentDuration);
      let s = this.scale * bb;
      this.range.startNS += s;
      this.range.endNS += s;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      this.pressFrameIdD = requestAnimationFrame(animD);
    };
    this.pressFrameIdD = requestAnimationFrame(animD);
  }

  keyboardKeyPressMap: any = {
    w: this.keyPressW,
    s: this.keyPressS,
    a: this.keyPressA,
    d: this.keyPressD,
    f: this.keyPressF,
  };

  keyboardKeyUpMap: any = {
    w: this.keyUpW,
    s: this.keyUpS,
    a: this.keyUpA,
    d: this.keyUpD,
  };

  keyUp(ev: KeyboardEvent): void {
    this.cacheInterval.value = 0;
    if (this.pressedKeys.length > 0) {
      let number = this.pressedKeys.findIndex((value) => value === ev.key.toLocaleLowerCase());
      if (number == this.pressedKeys.length - 1) {
        this.animaStartTime = undefined;
        this.cancelPressFrame();
        this.keyboardKeyUpMap[ev.key]?.bind(this)();
      }
      if (number != -1) {
        this.pressedKeys.splice(number, 1);
      }
    }
    this.isPress = false;
  }

  keyUpW(): void {
    let startTime = new Date().getTime();
    let animW = () => {
      if (this.scale === 50) {
        this.fillX();
        this.keyUpEnd();
        return;
      }
      let dur = new Date().getTime() - startTime;
      if (dur > 150) dur = 150;
      let offset = Math.tan((Math.PI / 180) * (150 - dur) * 0.2) * this.scale;
      this.range.startNS += this.centerXPercentage * offset;
      this.range.endNS -= (1 - this.centerXPercentage) * offset;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      if (dur < 150) {
        this.upFrameIdW = requestAnimationFrame(animW);
      } else {
        this.keyUpEnd();
      }
    };
    this.upFrameIdW = requestAnimationFrame(animW);
  }

  keyUpS(): void {
    let startTime = new Date().getTime();
    let animS = (): void => {
      if (this.range.startNS <= 0 && this.range.endNS >= this.range.totalNS) {
        this.fillX();
        this.keyUpEnd();
        return;
      }
      let dur = new Date().getTime() - startTime;
      if (dur > 150) dur = 150;
      let offset = Math.tan((Math.PI / 180) * (150 - dur) * 0.2) * this.scale;
      this.range.startNS -= this.centerXPercentage * offset;
      this.range.endNS += (1 - this.centerXPercentage) * offset;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      if (dur < 150) {
        this.upFrameIdS = requestAnimationFrame(animS);
      } else {
        this.keyUpEnd();
      }
    };
    this.upFrameIdS = requestAnimationFrame(animS);
  }

  keyUpA(): void {
    let startTime = new Date().getTime();
    let animA = (): void => {
      if (this.range.startNS <= 0) {
        this.fillX();
        this.keyUpEnd();
        return;
      }
      let dur = new Date().getTime() - startTime;
      if (dur > 150) dur = 150;
      let offset = Math.tan((Math.PI / 180) * (150 - dur) * 0.15) * this.scale;
      this.range.startNS -= offset;
      this.range.endNS -= offset;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      if (dur < 150) {
        this.upFrameIdA = requestAnimationFrame(animA);
      } else {
        this.keyUpEnd();
      }
    };
    this.upFrameIdA = requestAnimationFrame(animA);
  }

  keyUpEnd(): void {
    this.range.refresh = true;
    window.isLastFrame = true;
    this.notifyHandler(this.range);
    this.range.refresh = false;
    window.isLastFrame = false;
  }

  keyUpD(): void {
    let startTime = new Date().getTime();
    let animD = (): void => {
      if (this.range.endNS >= this.range.totalNS) {
        this.keyUpEnd();
        return;
      }
      let dur = new Date().getTime() - startTime;
      let offset = Math.tan((Math.PI / 180) * (150 - dur) * 0.15) * this.scale;
      this.range.startNS += offset;
      this.range.endNS += offset;
      this.fillX();
      this.draw();
      this.range.refresh = false;
      if (dur < 150) {
        this.upFrameIdD = requestAnimationFrame(animD);
      } else {
        this.keyUpEnd();
      }
    };
    this.upFrameIdD = requestAnimationFrame(animD);
  }

  translate(distance: number): void {
    const rangeDur = this.range.endNS - this.range.startNS;
    const time = (distance / this.canvas!.width) * rangeDur;
    if (
      this.range.startNS < 0 ||
      this.range.endNS < 0 ||
      this.range.startNS > this.range.totalNS ||
      this.range.endNS > this.range.totalNS
    ) {
      return;
    }
    this.range.startNS -= time;
    this.range.endNS -= time;
    this.fillX();
    this.draw();
    this.range.refresh = true;
    this.notifyHandler(this.range);
    this.range.refresh = false;
  }
}
