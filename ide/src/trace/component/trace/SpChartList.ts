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

import { BaseElement, element } from '../../../base-ui/BaseElement.js';
import { TraceRow } from './base/TraceRow.js';
import { dpr } from './base/Extension.js';
import {
  drawFlagLineSegment,
  drawLines,
  drawLinkLines, drawLogsLineSegment,
  drawWakeUp,
  drawWakeUpList,
  PairPoint,
  Rect
} from '../../database/ui-worker/ProcedureWorkerCommon.js';
import { Flag } from './timer-shaft/Flag.js';
import { TimerShaftElement } from './TimerShaftElement.js';
import { CpuStruct } from '../../database/ui-worker/ProcedureWorkerCPU.js';
import { WakeupBean } from '../../bean/WakeupBean.js';

@element('sp-chart-list')
export class SpChartList extends BaseElement {
  private rootEl: HTMLDivElement | null | undefined;
  private fragment: DocumentFragment = document.createDocumentFragment();
  private canvas: HTMLCanvasElement | null | undefined; //绘制收藏泳道图
  private canvasCtx: CanvasRenderingContext2D | undefined | null;
  private canResize: boolean = false;
  private isPress: boolean = false;
  private startPageY = 0;
  private startClientHeight: number = 0;
  private scrollTimer: any;

  initElements(): void {
    this.rootEl = this.shadowRoot?.querySelector<HTMLDivElement>('.root');
    this.canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>('.panel-canvas');
    this.canvasCtx = this.canvas?.getContext('2d');
    window.subscribe(window.SmartEvent.UI.RowHeightChange, (data) => {
      let rowTotalHeight = 0;
      this.rootEl!.childNodes.forEach((item) => rowTotalHeight += (item as any).clientHeight);
      if (rowTotalHeight < this.clientHeight) {
        this.scrollTop = 0;
        this.style.height = `${rowTotalHeight}px`;
      } else {
        if (data.expand && this.clientHeight < rowTotalHeight) {
          this.style.height = `${Math.min(this.clientHeight + data.value, this.parentElement!.clientHeight - 150)}px`;
        }
      }
      this.refreshFavoriteCanvas();
    });
  }

  getCollectRows(condition: string) {
    return this.rootEl?.querySelectorAll<TraceRow<any>>(condition) || []
  }

  getCollectRow(condition: string) {
    return this.rootEl!.querySelector<TraceRow<any>>(condition);
  }

  insertRowBefore(node: Node, child: Node) {
    this.rootEl!.insertBefore(node,child);
  }

  reset() {
    this.clearRect();
    this.fragment.childNodes.forEach(node => this.fragment.removeChild(node));
    this.rootEl!.querySelectorAll<TraceRow<any>>(`trace-row`).forEach((row) => {
      row.clearMemory();
      this.rootEl!.removeChild(row);
    });
  }

  resizeHeight() {
    let totalHeight = 0;
    this.rootEl!.childNodes.forEach((item) => totalHeight += (item as any).clientHeight);
    if (totalHeight <= this.clientHeight) {
      this.scrollTop = 0;
      this.style.height = `${totalHeight}px`;
    } else {
      this.style.height = `${Math.min(totalHeight, this.parentElement!.clientHeight - 150)}px`;
    }
  }

  context() {
    return this.canvasCtx;
  }

  getCanvas() {
    return this.canvas;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.addEventListener('scroll', this.onScroll, {passive: true});
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.removeEventListener('scroll', this.onScroll);
  }

  onScroll = (ev: Event) => {
    this.canvas!.style.transform = `translateY(${this.scrollTop}px)`;
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      TraceRow.range!.refresh = true;
      window.publish(window.SmartEvent.UI.RefreshCanvas, {});
    }, 100);
    window.publish(window.SmartEvent.UI.RefreshCanvas, {});
  }

  onMouseDown = (ev: MouseEvent) => {
    this.isPress = true;
    this.startPageY = ev.pageY;
    this.startClientHeight = this.clientHeight;
    if (this.containPoint(ev)) {
      if (this.getBoundingClientRect().bottom > ev.pageY && this.getBoundingClientRect().bottom < ev.pageY + 20) {
        this.style.cursor = 'row-resize';
        this.canResize = true;
      } else {
        this.style.cursor = 'default';
        this.canResize = false;
      }
    }
  }

  onMouseMove = (ev: MouseEvent) => {
    if (this.containPoint(ev)) {
      if (this.getBoundingClientRect().bottom > ev.pageY && this.getBoundingClientRect().bottom < ev.pageY + 20) {
        this.style.cursor = 'row-resize';
      } else {
        this.style.cursor = 'default';
      }
    }
    if (this.canResize && this.isPress) {
      (window as any).rowResize = true;
      this!.style.height = `${this.startClientHeight + ev.pageY - this.startPageY}px`
    } else {
      (window as any).rowResize = false;
    }
  }

  onMouseUp = (ev: MouseEvent) => {
    this.isPress = false;
    this.canResize = false;
    (window as any).rowResize = false;
    this.refreshFavoriteCanvas();
  }

  insertRow(row: TraceRow<any>) {
    this.style.display = 'flex';
    this.fragment.appendChild(row);
    this.rootEl?.appendChild(this.fragment);
    this.scrollTo({ top: this.scrollHeight });
    this.refreshFavoriteCanvas();
    row.currentContext = this.canvasCtx;
  }

  deleteRow(row: TraceRow<any>) {
    this.fragment.appendChild(row);
    this.resizeHeight();
    this.refreshFavoriteCanvas();
    row.currentContext = undefined;
    if (this.rootEl?.children.length === 0) {
      this.style.height = 'auto';
      this.style.display = 'none';
    }
  }

  clearRect() {
    this.canvasCtx?.clearRect(0, 0, this.canvas?.clientWidth ?? 0, this.canvas?.clientHeight ?? 0);
  }

  drawLines(xs: number[] | undefined, color: string) {
    drawLines(this.canvasCtx!, xs ?? [], this.clientHeight, color)
  }

  drawFlagLineSegment(hoverFlag: Flag | undefined | null, selectFlag: Flag | undefined | null, tse: TimerShaftElement) {
    drawFlagLineSegment(this.canvasCtx, hoverFlag, selectFlag, {
        x: 0,
        y: 0,
        width: TraceRow.FRAME_WIDTH,
        height: this.canvas?.clientHeight,
      },
      tse
    );
  }

  drawWakeUp() {
    drawWakeUp(
      this.canvasCtx,
      CpuStruct.wakeupBean,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      {
        x: 0,
        y: 0,
        width: TraceRow.FRAME_WIDTH,
        height: this.canvas!.clientHeight!,
      } as Rect
    );
  }

  drawWakeUpList(bean: WakeupBean) {
    drawWakeUpList(
      this.canvasCtx,
      bean,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      {
        x: 0,
        y: 0,
        width: TraceRow.FRAME_WIDTH,
        height: this.canvas!.clientHeight!,
      } as Rect,
    )
  }
  drawLogsLineSegment(bean: Flag | null | undefined, timeShaft: TimerShaftElement) {
    drawLogsLineSegment(
      this.canvasCtx,
      bean,
      {
        x: 0,
        y: 0,
        width: TraceRow.FRAME_WIDTH,
        height: this.canvas!.clientHeight,
      },
      timeShaft
    );
  }


  drawLinkLines(nodes: PairPoint[][], tse: TimerShaftElement, isFavorite: boolean) {
    drawLinkLines(this.canvasCtx!, nodes, tse, isFavorite);
  }

  refreshFavoriteCanvas() {
    this.canvas!.style.width = `${(this.clientWidth) - 248}px`;
    this.canvas!.style.left = `248px`;
    this.canvas!.width = this.canvas?.clientWidth! * dpr();
    this.canvas!.height = this.clientHeight * dpr();
    this.canvas!.getContext('2d')!.scale(dpr(), dpr());
    window.publish(window.SmartEvent.UI.RefreshCanvas, {});
  }

  initHtml(): string {
    return `
<style>
:host{
    display: none;
    width: 100%;
    height: auto;
    overflow-anchor: none;
    z-index: 1;
    /*background-color: #00a3f5;*/
    box-shadow: 0 10px 10px #00000044;
    position: relative;
    overflow: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
}
.root{
    /*display: flex;*/
    /*flex-direction: column;*/
    width: 100%;
    box-sizing: border-box;
}
.panel-canvas{
    position: absolute;
    top: 0;
    right: 0px;
    bottom: 0px;
    /*width: 100%;*/
    /*left: 496px;*/
    /*height: calc(100vh - 195px);*/
    /*height: 100%;*/
    box-sizing: border-box;
    /*background: #ff0000;*/
    /*border: 2px solid #000000;*/
}
</style>
<canvas id="canvas-panel" class="panel-canvas" ondragstart="return false"></canvas>
<div class="root"></div>
`;
  }

}