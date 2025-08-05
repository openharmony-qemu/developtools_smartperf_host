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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import { TimeRuler } from './timer-shaft/TimeRuler';
import { Rect } from './timer-shaft/Rect';
import { RangeRuler, TimeRange } from './timer-shaft/RangeRuler';
import { SlicesTime, SportRuler } from './timer-shaft/SportRuler';
import { procedurePool } from '../../database/Procedure';
import { Flag } from './timer-shaft/Flag';
import { info } from '../../../log/Log';
import { TraceSheet } from './base/TraceSheet';
import { SelectionParam } from '../../bean/BoxSelection';
import { type SpSystemTrace, CurrentSlicesTime } from '../SpSystemTrace';
import './timer-shaft/CollapseButton';
import { TimerShaftElementHtml } from './TimerShaftElement.html';
import { SpChartList } from './SpChartList';
//随机生成十六位进制颜色
//@ts-ignore
export function randomRgbColor(): string {
  let r = Math.floor(Math.random() * 255);
  let g = Math.floor(Math.random() * 255);
  let b = Math.floor(Math.random() * 255);
  let color = '';
  if (r * 0.299 + g * 0.587 + b * 0.114 < 192) {
    let r16 = r.toString(16).length === 1 && r.toString(16) <= 'f' ? 0 + r.toString(16) : r.toString(16);
    let g16 = g.toString(16).length === 1 && g.toString(16) <= 'f' ? 0 + g.toString(16) : g.toString(16);
    let b16 = b.toString(16).length === 1 && b.toString(16) <= 'f' ? 0 + b.toString(16) : b.toString(16);
    color = '#' + r16 + g16 + b16;
  } else {
    randomRgbColor();
  }
  return color;
}

export function ns2s(ns: number): string {
  let oneSecond = 1_000_000_000; // 1 second
  let oneMillisecond = 1_000_000; // 1 millisecond
  let oneMicrosecond = 1_000; // 1 microsecond
  let nanosecond1 = 1000.0;
  let result;
  if (ns >= oneSecond) {
    result = (ns / 1000 / 1000 / 1000).toFixed(1) + ' s';
  } else if (ns >= oneMillisecond) {
    result = (ns / 1000 / 1000).toFixed(1) + ' ms';
  } else if (ns >= oneMicrosecond) {
    result = (ns / 1000).toFixed(1) + ' μs';
  } else if (ns > 0) {
    result = ns.toFixed(1) + ' ns';
  } else {
    result = ns.toFixed(1) + ' s';
  }
  return result;
}

export function ns2UnitS(ns: number, scale: number): string {
  let oneSecond = 1_000_000_000; // 1 second
  let result;
  if (scale >= 10_000_000_000) {
    result = (ns / oneSecond).toFixed(0) + ' s';
  } else if (scale >= 1_000_000_000) {
    result = (ns / oneSecond).toFixed(1) + ' s';
  } else if (scale >= 100_000_000) {
    result = (ns / oneSecond).toFixed(2) + ' s';
  } else if (scale >= 10_000_000) {
    result = (ns / oneSecond).toFixed(3) + ' s';
  } else if (scale >= 1_000_000) {
    result = (ns / oneSecond).toFixed(4) + ' s';
  } else if (scale >= 100_000) {
    result = (ns / oneSecond).toFixed(5) + ' s';
  } else {
    result = (ns / oneSecond).toFixed(6) + ' s';
  }
  return result;
}

export function ns2x(ns: number, startNS: number, endNS: number, duration: number, rect: Rect): number {
  if (endNS === 0) {
    endNS = duration;
  }
  let xSize: number = ((ns - startNS) * rect.width) / (endNS - startNS);
  if (xSize < 0) {
    xSize = 0;
  }
  if (xSize > rect.width) {
    xSize = rect.width;
  }
  return xSize;
}

@element('timer-shaft-element')
export class TimerShaftElement extends BaseElement {
  // @ts-ignore
  offscreen: OffscreenCanvas | undefined;
  isOffScreen: boolean = false;
  public ctx: CanvasRenderingContext2D | undefined | null;
  public canvas: HTMLCanvasElement | null | undefined;
  public totalEL: HTMLDivElement | null | undefined;
  public timeTotalEL: HTMLSpanElement | null | undefined;
  public timeOffsetEL: HTMLSpanElement | null | undefined;
  public collectGroup: HTMLDivElement | null | undefined;
  public collect1: HTMLInputElement | null | undefined;
  public loadComplete: boolean = false;
  public collecBtn: HTMLElement | null | undefined;
  rangeChangeHandler: ((timeRange: TimeRange) => void) | undefined = undefined;
  rangeClickHandler: ((sliceTime: SlicesTime | undefined | null) => void) | undefined = undefined;
  flagChangeHandler: ((hoverFlag: Flag | undefined | null, selectFlag: Flag | undefined | null) => void) | undefined =
    undefined;
  flagClickHandler: ((flag: Flag | undefined | null) => void) | undefined = undefined;
  /**
   * 离线渲染需要的变量
   */
  dpr = window.devicePixelRatio || 1;
  frame: Rect = new Rect(0, 0, 0, 0);
  must: boolean = true;
  hoverX: number = 0;
  hoverY: number = 0;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  _cpuUsage: Array<{ cpu: number; ro: number; rate: number }> = [];
  protected timeRuler: TimeRuler | undefined;
  protected _rangeRuler: RangeRuler | undefined;
  protected _sportRuler: SportRuler | undefined;
  private root: HTMLDivElement | undefined | null;
  private _totalNS: number = 10_000_000_000;
  private _startNS: number = 0;
  private _endNS: number = 10_000_000_000;
  private traceSheetEL: TraceSheet | undefined | null;
  private sliceTime: SlicesTime | undefined | null;
  public selectionList: Array<SelectionParam> = [];
  public selectionMap: Map<string, SelectionParam> = new Map<string, SelectionParam>();
  public usageEL: HTMLDivElement | null | undefined;
  public timerShaftEL: TimerShaftElement | null | undefined;
  public rowsPaneEL: HTMLDivElement | null | undefined;
  public favoriteChartListEL: SpChartList | undefined | null;
  _checkExpand: boolean = false; //是否展开
  _usageFoldHeight: number = 56.25; //初始化时折叠的负载区高度
  usageExpandHeight: number = 75; //给定的展开的负载区高度
  _cpuUsageCount: Array<{ cpu: number; ro: number; rate: number }> = [];

  get sportRuler(): SportRuler | undefined {
    return this._sportRuler;
  }

  get rangeRuler(): RangeRuler | undefined {
    return this._rangeRuler;
  }

  set cpuUsage(value: Array<{ cpu: number; ro: number; rate: number }>) {
    info('set cpuUsage values :', value);
    this._cpuUsage = value;

    this._cpuUsageCount = value;
    if (this._cpuUsageCount.length) {
      this.usageEL!.innerHTML = 'CPU Usage';
    }

    if (this._rangeRuler) {
      this._rangeRuler.cpuUsage = this._cpuUsage;
    }
  }

  get checkExpand(): boolean {
    return this._checkExpand;
  }

  set checkExpand(value: boolean) {
    this._checkExpand = value;
  }

  get usageFoldHeight(): number {
    return this._usageFoldHeight;
  }
  set usageFoldHeight(value: number) {
    this._usageFoldHeight = value;
  }

  get totalNS(): number {
    return this._totalNS;
  }

  set totalNS(value: number) {
    info('set totalNS values :', value);
    this._totalNS = value;
    if (this.timeRuler) {
      this.timeRuler.totalNS = value;
    }
    if (this._rangeRuler) {
      this._rangeRuler.range.totalNS = value;
    }
    if (this.timeTotalEL) {
      this.timeTotalEL.textContent = `${ns2s(value)}`;
    }
    requestAnimationFrame(() => this.render());
  }

  get startNS(): number {
    return this._startNS;
  }

  set startNS(value: number) {
    this._startNS = value;
  }

  get endNS(): number {
    return this._endNS;
  }

  set endNS(value: number) {
    this._endNS = value;
  }

  reset(): void {
    this.loadComplete = false;
    this.totalNS = 10_000_000_000;
    this.startNS = 0;
    this.endNS = 10_000_000_000;
    if (this._rangeRuler) {
      this._rangeRuler.drawMark = false;
      this._rangeRuler.range.totalNS = this.totalNS;
      this._rangeRuler.markAObj.frame.x = 0;
      this._rangeRuler.markBObj.frame.x = this._rangeRuler.frame.width;
      this._rangeRuler.cpuUsage = [];
      this.sportRuler!.flagList.length = 0;
      this.sportRuler!.slicesTimeList.length = 0;
      this.selectionList.length = 0;
      this.selectionMap.clear();
      this._rangeRuler.rangeRect = new Rect(0, 25, this.canvas?.clientWidth || 0, 75);
      this.sportRuler!.isRangeSelect = false;
      this.setSlicesMark();
    }
    this.removeTriangle('inverted');
    this.setRangeNS(0, this.endNS);
    //---------------每次导入trace时触发渲染-----------------
    if (this._rangeRuler && this._sportRuler) {
      this.canvas!.width = this.canvas!.clientWidth || 0;
      sessionStorage.setItem('foldHeight', String(56.25));
      if (this._checkExpand && this._checkExpand === true) {
        this._checkExpand = false;
        sessionStorage.setItem('expand', String(this._checkExpand));
      }
      sessionStorage.setItem('expand', String(this._checkExpand));
      this.usageEL!.innerHTML = '';
      this.usageEL!.style.height = `${100 - 56.25}px`;
      this.usageEL!.style.lineHeight = `${100 - 56.25}px`;
      this.timerShaftEL!.style.height = `${146 - 56.25 + 2}px`;
      this.canvas!.style.height = `${146 - 56.25}px`;
      this.canvas!.height = 146 - 56.25;
      this.rowsPaneEL!.style.maxHeight = '100%';
      this._sportRuler.frame.y = 43.75;

      this.render();
      this._checkExpand = true;
      this._cpuUsageCount = []; //清空判断数据
    }
  }

  initElements(): void {
    this.root = this.shadowRoot?.querySelector('.root');
    this.canvas = this.shadowRoot?.querySelector('.panel');
    this.totalEL = this.shadowRoot?.querySelector('.total');
    this.collect1 = this.shadowRoot?.querySelector('#collect1');
    this.timeTotalEL = this.shadowRoot?.querySelector('.time-total');
    this.timeOffsetEL = this.shadowRoot?.querySelector('.time-offset');
    this.collecBtn = this.shadowRoot?.querySelector('.time-collect');
    this.collectGroup = this.shadowRoot?.querySelector('.collect_group');
    this.collectGroup?.addEventListener('click', (e) => {
      // @ts-ignore
      if (e.target && e.target.tagName === 'INPUT') {
        // @ts-ignore
        window.publish(window.SmartEvent.UI.CollectGroupChange, e.target.value);
      }
    });
    // @ts-ignore
    procedurePool.timelineChange = (a: unknown): void => this.rangeChangeHandler?.(a);
    // @ts-ignore
    window.subscribe(window.SmartEvent.UI.TimeRange, (b) => this.setRangeNS(b.startNS, b.endNS));
    // -----------------------------点击负载区展开折叠---------------------------------
    this.usageEL = this.shadowRoot?.querySelector('.cpu-usage');
    this.timerShaftEL = this.shadowRoot!.host.parentNode?.querySelector('.timer-shaft');
    this.rowsPaneEL = this.shadowRoot!.host.parentNode?.querySelector('.rows-pane');
    this.favoriteChartListEL = this.shadowRoot!.host.parentNode?.querySelector('#favorite-chart-list');
    const height = this.canvas?.clientHeight || 0;
    // 点击cpu usage部分，切换折叠展开
    this.usageEL?.addEventListener('click', (e) => {
      if (this._rangeRuler && this.sportRuler && this._cpuUsageCount.length) {
        // 计算需要被收起来的高度：总高度75-（总高度/cpu数量）* 2
        this._usageFoldHeight = this.usageExpandHeight - (this.usageExpandHeight / this._rangeRuler.cpuCountData!) * 2;
        this.canvas!.width = this.canvas!.clientWidth || 0;
        if (this._checkExpand) {
          sessionStorage.setItem('expand', String(this._checkExpand));
          sessionStorage.setItem('foldHeight', String(this._usageFoldHeight));
          this.usageEL!.style.height = '100px';
          this.usageEL!.style.lineHeight = '100px';
          this.timerShaftEL!.style.height = `${height + 2}px`;
          this.canvas!.style.height = `${height}px`;
          this.canvas!.height = height;
          this._rangeRuler.frame.height = 75;
          this.sportRuler.frame.y = 100;
          this.render();
          this._checkExpand = false;
          this.favoriteChartListEL?.refreshFavoriteCanvas(); //刷新收藏泳道画布高度
        } else {
          sessionStorage.setItem('expand', String(this._checkExpand));
          sessionStorage.setItem('foldHeight', String(this._usageFoldHeight));
          this.usageEL!.style.height = `${100 - this._usageFoldHeight}px`;
          this.usageEL!.style.lineHeight = `${100 - this._usageFoldHeight}px`;
          this.timerShaftEL!.style.height = `${height - this._usageFoldHeight + 2}px`;
          this.canvas!.style.height = `${height - this._usageFoldHeight}px`;
          this.canvas!.height = height - this._usageFoldHeight;
          this._rangeRuler.frame.height = 75 - this._usageFoldHeight;
          this.sportRuler.frame.y = 100 - this._usageFoldHeight;
          this.render();
          this._checkExpand = true;
          this.favoriteChartListEL?.refreshFavoriteCanvas(); //刷新收藏泳道画布高度
        }
      }
    });
  }

  getRangeRuler(): RangeRuler | undefined {
    return this._rangeRuler;
  }

  connectedCallback(): RangeRuler | undefined {
    if (this.canvas) {
      if (this.isOffScreen) {
        // @ts-ignore
        this.offscreen = this.canvas.transferControlToOffscreen();
        return;
      } else {
        this.ctx = this.canvas?.getContext('2d', { alpha: true });
      }
    }
    if (this.timeTotalEL) {
      this.timeTotalEL.textContent = ns2s(this._totalNS);
    }
    if (this.timeOffsetEL && this._rangeRuler) {
      this.timeOffsetEL.textContent = ns2UnitS(this._startNS, this._rangeRuler.getScale());
    }
    const width = this.canvas?.clientWidth || 0;
    const height = this.canvas?.clientHeight || 0;
    this.setTimeRuler(width);
    this.setSportRuler(width, height);
    this.setRangeRuler(width);
  }

  private setTimeRuler(width: number): void {
    if (!this.timeRuler) {
      this.timeRuler = new TimeRuler(this, new Rect(0, 0, width, 20), this._totalNS);
    }
    this.timeRuler.frame.width = width;
  }

  private setSportRuler(width: number, height: number): void {
    if (!this._sportRuler) {
      this._sportRuler = new SportRuler(
        this,
        new Rect(0, 100, width, height - 100),
        (hoverFlag, selectFlag) => {
          this.flagChangeHandler?.(hoverFlag, selectFlag);
        },
        (flag) => {
          this.flagClickHandler?.(flag);
        },
        (slicetime) => {
          this.rangeClickHandler?.(slicetime);
        }
      );
    }
    this._sportRuler.frame.width = width;
  }

  private setRangeRuler(width: number): void {
    if (!this._rangeRuler) {
      this._rangeRuler = new RangeRuler(
        this,
        new Rect(0, 25, width, 75 - this._usageFoldHeight),
        {
          slicesTime: {
            startTime: null,
            endTime: null,
            color: null,
          },
          scale: 0,
          startX: 0,
          endX: this.canvas?.clientWidth || 0,
          startNS: 0,
          endNS: this.totalNS,
          totalNS: this.totalNS,
          refresh: true,
          xs: [],
          xsTxt: [],
        },
        (a) => {
          if (a.startNS >= 0 && a.endNS >= 0) {
            if (this._sportRuler) {
              this._sportRuler.range = a;
            }
            if (this.timeOffsetEL && this._rangeRuler) {
              this.timeOffsetEL.textContent = ns2UnitS(a.startNS, this._rangeRuler.getScale());
            }
            if (this.loadComplete) {
              this.rangeChangeHandler?.(a);
            }
          }
        }
      );
    }
    this._rangeRuler.frame.width = width;
  }

  setRangeNS(startNS: number, endNS: number): void {
    info('set startNS values :' + startNS + 'endNS values : ' + endNS);
    this._rangeRuler?.setRangeNS(startNS, endNS);
  }

  getRange(): TimeRange | undefined {
    return this._rangeRuler?.getRange();
  }

  updateWidth(width: number): void {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas!.width = width - (this.totalEL?.clientWidth || 0);
    this.canvas!.height = this.shadowRoot!.host.clientHeight || 0;
    let oldWidth = this.canvas!.width;
    let oldHeight = this.canvas!.height;
    this.canvas!.width = Math.ceil(oldWidth * this.dpr);
    this.canvas!.height = Math.ceil(oldHeight * this.dpr);
    this.canvas!.style.width = oldWidth + 'px';
    this.canvas!.style.height = oldHeight + 'px';
    this.ctx?.scale(this.dpr, this.dpr);
    this.ctx?.translate(0, 0);
    this._rangeRuler!.frame.width = oldWidth;
    this._sportRuler!.frame.width = oldWidth;
    this.timeRuler!.frame.width = oldWidth;
    this._rangeRuler?.fillX();
    this.render();
  }

  documentOnMouseDown = (ev: MouseEvent): void => {
    // @ts-ignore
    if ((window as unknown).isSheetMove) {
      return;
    }
    this._rangeRuler?.mouseDown(ev);
  };

  documentOnMouseUp = (ev: MouseEvent): void => {
    // @ts-ignore
    if ((window as unknown).isSheetMove) {
      return;
    }
    this._rangeRuler?.mouseUp(ev);
    this.sportRuler?.mouseUp(ev);
  };

  documentOnMouseMove = (ev: MouseEvent, trace: SpSystemTrace): void => {
    trace.style.cursor = 'default';
    let x = ev.offsetX - (this.canvas?.offsetLeft || 0); // 鼠标的x轴坐标
    let y = ev.offsetY; // 鼠标的y轴坐标
    let findSlicestime = this.sportRuler?.findSlicesTime(x, y); // 查找帽子
    if (!findSlicestime) {
      // 如果在该位置没有找到一个“帽子”，则可以显示一个旗子。
      this.sportRuler?.showHoverFlag();
      this._rangeRuler?.mouseMove(ev, trace);
      if (this.sportRuler?.edgeDetection(ev)) {
        this.sportRuler?.mouseMove(ev);
      } else {
        this.sportRuler?.mouseOut(ev);
      }
    } else {
      this.sportRuler?.clearHoverFlag();
      this.sportRuler?.modifyFlagList(null); //重新绘制旗子，清除hover flag
    }
  };

  documentOnMouseOut = (ev: MouseEvent): void => {
    this._rangeRuler?.mouseOut(ev);
    this.sportRuler?.mouseOut(ev);
  };

  documentOnKeyPress = (ev: KeyboardEvent, currentSlicesTime?: CurrentSlicesTime): void => {
    // @ts-ignore
    if ((window as unknown).flagInputFocus) {
      return;
    }
    this._rangeRuler?.keyPress(ev, currentSlicesTime);
    this.sportRuler?.clearHoverFlag();
  };

  documentOnKeyUp = (ev: KeyboardEvent): void => {
    // @ts-ignore
    if ((window as unknown).flagInputFocus) {
      return;
    }
    this._rangeRuler?.keyUp(ev);
  };

  disconnectedCallback(): void { }

  firstRender = true;

  lineColor(): string {
    return window.getComputedStyle(this.canvas!, null).getPropertyValue('color');
  }

  render(): void {
    this.dpr = window.devicePixelRatio || 1;
    if (this.ctx) {
      this.ctx.fillStyle = 'transparent';
      this.ctx?.fillRect(0, 0, this.canvas?.width || 0, this.canvas?.height || 0);
      this.timeRuler?.draw();
      this._rangeRuler?.draw();
      this._sportRuler?.draw();
    } else {
      procedurePool.submitWithName(
        'timeline',
        'timeline',
        {
          offscreen: this.must ? this.offscreen : undefined, //是否离屏
          dpr: this.dpr, //屏幕dpr值
          hoverX: this.hoverX,
          hoverY: this.hoverY,
          canvasWidth: this.canvasWidth,
          canvasHeight: this.canvasHeight,
          keyPressCode: null,
          keyUpCode: null,
          lineColor: '#dadada',
          startNS: this.startNS,
          endNS: this.endNS,
          totalNS: this.totalNS,
          frame: this.frame,
        },
        this.must ? this.offscreen : undefined,
        (res: unknown) => {
          this.must = false;
        }
      );
    }
  }

  modifyFlagList(flag: Flag | null | undefined): void {
    this._sportRuler?.modifyFlagList(flag);
  }

  modifySlicesList(slicestime: SlicesTime | null | undefined): void {
    this._sportRuler?.modifySicesTimeList(slicestime);
  }
  cancelPressFrame(): void {
    this._rangeRuler?.cancelPressFrame();
  }

  cancelUpFrame(): void {
    this._rangeRuler?.cancelUpFrame();
  }

  stopWASD(ev: unknown): void {
    // @ts-ignore
    this._rangeRuler?.keyUp(ev);
  }

  drawTriangle(time: number, type: string): unknown {
    return this._sportRuler?.drawTriangle(time, type);
  }

  removeTriangle(type: string): void {
    this._sportRuler?.removeTriangle(type);
  }

  setSlicesMark(
    startTime: null | number = null,
    endTime: null | number = null,
    shiftKey: null | boolean = false
  ): SlicesTime | null | undefined {
    let sliceTime = this._sportRuler?.setSlicesMark(startTime, endTime, shiftKey);
    if (sliceTime && sliceTime !== undefined) {
      this.traceSheetEL?.displayCurrent(sliceTime); // 给当前pane准备数据

      // 取最新创建的那个selection对象
      let selection = this.selectionList[this.selectionList.length - 1];
      if (selection) {
        selection.isCurrentPane = true; // 设置当前面板为可以显示的状态
        //把刚刚创建的slicetime和selection对象关联起来，以便后面再次选中“跑道”的时候显示对应的面板。
        this.selectionMap.set(sliceTime.id, selection);
        this.traceSheetEL?.rangeSelect(selection); // 显示选中区域对应的面板
      }
    }
    return sliceTime;
  }

  displayCollect(showCollect: boolean): void {
    if (showCollect) {
      this.collecBtn!.style.display = 'flex';
    } else {
      this.collecBtn!.style.display = 'none';
    }
  }

  initHtml(): string {
    return TimerShaftElementHtml;
  }
}
