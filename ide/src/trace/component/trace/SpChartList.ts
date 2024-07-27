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
import { TraceRow } from './base/TraceRow';
import { dpr } from './base/Extension';
import {
  drawFlagLineSegment,
  drawLines,
  drawLinkLines,
  drawLogsLineSegment,
  drawWakeUp,
  drawWakeUpList,
  PairPoint,
  Rect,
} from '../../database/ui-worker/ProcedureWorkerCommon';
import { Flag } from './timer-shaft/Flag';
import { TimerShaftElement } from './TimerShaftElement';
import { CpuStruct } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { WakeupBean } from '../../bean/WakeupBean';
import { LitIcon } from '../../../base-ui/icon/LitIcon';

const maxScale = 0.8; //收藏最大高度为界面最大高度的80%
const topHeight = 150; // 顶部cpu使用率部分高度固定为150px
const minHeight = 40; //泳道最低高度为40
const mouseMoveRange = 5;

@element('sp-chart-list')
export class SpChartList extends BaseElement {
  private static COLLECT_G1 = '1';
  private static COLLECT_G2 = '2';
  private collectEl1: HTMLDivElement | null | undefined;
  private collectEl2: HTMLDivElement | null | undefined;
  private groupTitle1: HTMLDivElement | null | undefined;
  private groupTitle2: HTMLDivElement | null | undefined;
  private icon1: LitIcon | null | undefined;
  private icon2: LitIcon | null | undefined;
  private removeCollectIcon1: LitIcon | null | undefined;
  private removeCollectIcon2: LitIcon | null | undefined;
  private rootEl: HTMLDivElement | null | undefined;
  private fragmentGroup1: DocumentFragment = document.createDocumentFragment();
  private fragmentGroup2: DocumentFragment = document.createDocumentFragment();
  private canvas: HTMLCanvasElement | null | undefined; //绘制收藏泳道图
  private canvasCtx: CanvasRenderingContext2D | undefined | null;
  private canResize: boolean = false;
  private isPress: boolean = false;
  private startPageY = 0;
  private startClientHeight: number = 0;
  private scrollTimer: unknown;
  private collect1Expand: boolean = true;
  private collect2Expand: boolean = true;
  // @ts-ignore
  private collectRowList1: Array<TraceRow<unknown>> = [];
  // @ts-ignore
  private collectRowList2: Array<TraceRow<unknown>> = [];
  private maxHeight = 0;
  private manualHeight = 0;

  initElements(): void {
    this.collectEl1 = this.shadowRoot?.querySelector<HTMLDivElement>('#collect-group-1');
    this.collectEl2 = this.shadowRoot?.querySelector<HTMLDivElement>('#collect-group-2');
    this.groupTitle1 = this.shadowRoot?.querySelector<HTMLDivElement>('#group-1-title');
    this.groupTitle2 = this.shadowRoot?.querySelector<HTMLDivElement>('#group-2-title');
    this.icon1 = this.shadowRoot?.querySelector<LitIcon>('#group_1_expand');
    this.icon2 = this.shadowRoot?.querySelector<LitIcon>('#group_2_expand');
    this.removeCollectIcon1 = this.shadowRoot?.querySelector<LitIcon>('#group_1_collect');
    this.removeCollectIcon2 = this.shadowRoot?.querySelector<LitIcon>('#group_2_collect');
    this.rootEl = this.shadowRoot?.querySelector<HTMLDivElement>('.root');
    this.canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>('.panel-canvas');
    this.canvasCtx = this.canvas?.getContext('2d'); //@ts-ignore
    window.subscribe(window.SmartEvent.UI.RowHeightChange, (data: { expand: number; value: number }) => {
      this.resizeHeight();
      if (!data.expand) {
        let offset = this.scrollTop - data.value;
        offset = offset < 0 ? 0 : offset;
        this.scrollTop = offset;
      }
      this.refreshFavoriteCanvas();
    });
    this.initChartListListener();
  }

  private initChartListListener(): void {
    const foldCollect1 = (): void => {
      this.collect1Expand = !this.collect1Expand;
      if (this.collect1Expand) {
        this.icon1!.style.transform = 'rotateZ(0deg)';
        this.collectEl1?.appendChild(this.fragmentGroup1);
      } else {
        this.icon1!.style.transform = 'rotateZ(-90deg)';
        this.collectRowList1.forEach((row) => this.fragmentGroup1.appendChild(row));
      }
      this.resizeHeight();
    };
    this.icon1?.addEventListener('click', () => foldCollect1());
    const foldCollect2 = (): void => {
      this.collect2Expand = !this.collect2Expand;
      if (this.collect2Expand) {
        this.icon2!.style.transform = 'rotateZ(0deg)';
        this.collectEl2?.appendChild(this.fragmentGroup2);
        this.scrollTop = this.scrollHeight;
      } else {
        this.icon2!.style.transform = 'rotateZ(-90deg)';
        this.collectRowList2.forEach((row) => this.fragmentGroup2.appendChild(row));
        this.scrollTop = 0;
      }
      this.resizeHeight();
    };
    this.icon2?.addEventListener('click', () => foldCollect2());
    document.addEventListener('keyup', (e) => {
      if (e.key.toLowerCase() === 'b' && e.ctrlKey === false) {
        // 收藏夹有泳道时 为true
        const hasChildNode1 = this.collectEl1?.hasChildNodes() || this.fragmentGroup1.hasChildNodes();
        const hasChildNode2 = this.collectEl2?.hasChildNodes() || this.fragmentGroup2.hasChildNodes();
        // 两个收藏夹都有泳道时
        if (hasChildNode1 && hasChildNode2) {
          const flag = this.collect1Expand === this.collect2Expand;
          if (flag) {
            foldCollect1();
            foldCollect2();
          } else {
            // 两收藏夹的折叠状态不一致 优先一起折叠
            if (this.collect1Expand) {
              foldCollect1();
            }
            else {
              foldCollect2();
            }
          }
          return;
        }
        // 只影响有泳道的收藏夹
        if (hasChildNode1) {
          foldCollect1();
        }
        if (hasChildNode2) {
          foldCollect2();
        }
      }
    });

    this.removeCollectIcon1?.addEventListener('click', () => {
      Array.from(this.collectRowList1).forEach(row => {
        row.collectEL?.click();
      });
    });
    this.removeCollectIcon2?.addEventListener('click', () => {
      Array.from(this.collectRowList2).forEach(row => {
        row.collectEL?.click();
      });
    });
  }

  removeAllCollectRow(): void {
    Array.from(this.collectRowList1).forEach(row => {
      row.collectEL?.click();
    });
    Array.from(this.collectRowList2).forEach(row => {
      row.collectEL?.click();
    });
  }

  private resizeHeight(): void {
    this.maxHeight = 0;
    // @ts-ignore
    this.collectEl1!.childNodes.forEach((item) => (this.maxHeight += (item as unknown).clientHeight));
    // @ts-ignore
    this.collectEl2!.childNodes.forEach((item) => (this.maxHeight += (item as unknown).clientHeight));
    if (this.groupTitle1) {
      this.maxHeight += this.groupTitle1.clientHeight;
    }
    if (this.groupTitle2) {
      this.maxHeight += this.groupTitle2.clientHeight;
    }

    this.maxHeight = Math.min(this.getMaxLimitHeight(), this.maxHeight);
    if (this.manualHeight > 0) {
      this.style.height = `${Math.min(this.maxHeight, this.manualHeight)}px`;
    } else {
      this.style.height = `${this.maxHeight}px`;
    }
  }

  private getMaxLimitHeight(): number {
    return (this.parentElement!.clientHeight - topHeight) * maxScale;
  }

  // @ts-ignore
  getCollectRows(filter?: (row: TraceRow<unknown>) => boolean): Array<TraceRow<unknown>> | [] {
    if (filter) {
      return [...this.collectRowList1.filter(filter), ...this.collectRowList2.filter(filter)];
    } else {
      return this.getAllCollectRows();
    }
  }

  getRowScrollTop(): number {
    return this.rootEl?.scrollTop || 0;
  }

  // @ts-ignore
  expandSearchRowGroup(row: TraceRow<unknown>): void {
    this.updateGroupDisplay();
    if (row.collectGroup === SpChartList.COLLECT_G1) {
      if (!this.collect1Expand) {
        this.collect1Expand = true;
        this.icon1!.style.transform = 'rotateZ(0deg)';
        this.collectEl1?.appendChild(this.fragmentGroup1);
      }
    } else {
      if (!this.collect2Expand) {
        this.collect2Expand = true;
        this.icon2!.style.transform = 'rotateZ(0deg)';
        this.collectEl2?.appendChild(this.fragmentGroup2);
        this.scrollTop = this.scrollHeight;
      }
    }
    this.resizeHeight();
  }

  // @ts-ignore
  getCollectRow(filter: (row: TraceRow<unknown>) => boolean): TraceRow<unknown> | undefined {
    return this.collectRowList1.find(filter) || this.collectRowList2.find(filter);
  }

  // @ts-ignore
  getAllCollectRows(): Array<TraceRow<unknown>> {
    return [...this.collectRowList1, ...this.collectRowList2];
  }

  getCollectRowsInfo(group: string): unknown {
    return (group === SpChartList.COLLECT_G1 ? this.collectRowList1 : this.collectRowList2).map((row) => {
      let rowJson = {
        type: row.rowType,
        name: row.name,
        id: row.rowId,
        parents: [],
      };
      this.getRowParent(rowJson, row);
      rowJson.parents.reverse();
      return rowJson;
    });
  }

  // @ts-ignore
  getRowParent(obj: unknown, row: TraceRow<unknown>): void {
    if (row.parentRowEl) {
      // @ts-ignore
      if (obj.parents) {
        let parent: unknown = {
          type: row.parentRowEl.rowType,
          name: row.parentRowEl.name,
          id: row.parentRowEl.rowId,
        };
        // @ts-ignore
        (obj.parents as Array<unknown>).push(parent);
      } else {
        // @ts-ignore
        obj.parents = [parent];
      }
      this.getRowParent(obj, row.parentRowEl);
    }
  }

  // @ts-ignore
  getAllSelectCollectRows(): Array<TraceRow<unknown>> {
    // @ts-ignore
    const rows: Array<TraceRow<unknown>> = [];
    for (const row of this.collectRowList1) {
      if (row.checkType === '2') {
        rows.push(row);
      }
    }
    for (const row of this.collectRowList2) {
      if (row.checkType === '2') {
        rows.push(row);
      }
    }
    return rows;
  }

  insertRowBefore(node: Node, child: Node): void {
    // @ts-ignore
    if (child === null || (child as TraceRow<unknown>).collectGroup === (node as TraceRow<unknown>).collectGroup) {
      // @ts-ignore
      if ((node as TraceRow<unknown>).collectGroup === SpChartList.COLLECT_G1) {
        this.collectEl1!.insertBefore(node, child);
        // @ts-ignore
        this.collectRowList1 = Array.from(this.collectEl1!.children) as TraceRow<unknown>[];
      } else {
        this.collectEl2!.insertBefore(node, child);
        // @ts-ignore
        this.collectRowList2 = Array.from(this.collectEl2!.children) as TraceRow<unknown>[];
      }
    }
  }

  reset(): void {
    this.maxHeight = 0;
    this.clearRect();
    this.collect1Expand = true;
    this.collect2Expand = true;
    this.icon1!.style.transform = 'rotateZ(0deg)';
    this.icon2!.style.transform = 'rotateZ(0deg)';
    this.collectRowList1.forEach((row) => {
      row.clearMemory();
    });
    this.collectRowList2.forEach((row) => {
      row.clearMemory();
    });
    this.collectRowList1 = [];
    this.collectRowList2 = [];
    this.fragmentGroup1 = document.createDocumentFragment();
    this.fragmentGroup2 = document.createDocumentFragment();
    this.collectEl1!.innerHTML = '';
    this.collectEl2!.innerHTML = '';
    this.updateGroupDisplay();
    this.style.height = 'auto';
  }

  context(): CanvasRenderingContext2D | undefined | null {
    return this.canvasCtx;
  }

  getCanvas(): HTMLCanvasElement | null | undefined {
    return this.canvas;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const vessel = this.parentNode as HTMLDivElement;
    vessel.addEventListener('mousedown', this.onMouseDown);
    vessel.addEventListener('mouseup', this.onMouseUp);
    vessel.addEventListener('mousemove', this.onMouseMove);
    this.addEventListener('scroll', this.onScroll, { passive: true });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    const vessel = this.parentNode as HTMLDivElement;
    vessel.removeEventListener('mousedown', this.onMouseDown);
    vessel.removeEventListener('mouseup', this.onMouseUp);
    vessel.removeEventListener('mousemove', this.onMouseMove);
    this.removeEventListener('scroll', this.onScroll);
  }

  onScroll = (ev: Event): void => {
    this.canvas!.style.transform = `translateY(${this.scrollTop}px)`;
    if (this.scrollTimer) {
      // @ts-ignore
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      TraceRow.range!.refresh = true;
      window.publish(window.SmartEvent.UI.RefreshCanvas, {});
    }, 100);
    window.publish(window.SmartEvent.UI.RefreshCanvas, {});
  };

  onMouseDown = (ev: MouseEvent): void => {
    this.isPress = true;
    this.startPageY = ev.pageY;
    this.startClientHeight = this.clientHeight;
    if (this.containPoint(ev)) {
      if (
        this.getBoundingClientRect().bottom > ev.pageY - mouseMoveRange &&
        this.getBoundingClientRect().bottom < ev.pageY + mouseMoveRange
      ) {
        this.style.cursor = 'row-resize';
        this.canResize = true;
      } else {
        this.style.cursor = 'default';
        this.canResize = false;
      }
      // @ts-ignore
      (window as unknown).collectResize = this.canResize;
    }
  };

  onMouseMove = (ev: MouseEvent): void => {
    if (this.containPoint(ev)) {
      let inResizeArea =
        this.getBoundingClientRect().bottom > ev.pageY - mouseMoveRange &&
        this.getBoundingClientRect().bottom < ev.pageY + mouseMoveRange;
      if ((this.isPress && this.canResize) || inResizeArea) {
        this.style.cursor = 'row-resize';
      } else {
        this.style.cursor = 'default';
      }
    }
    //防止点击触发move时间
    if (Math.abs(ev.pageY - this.startPageY) < 2) {
      return;
    }
    if (this.canResize && this.isPress) {
      // @ts-ignore
      (window as unknown).collectResize = true;
      // 拖动超过所有泳道最大高度 或小于一个泳道的高度，不支持拖动
      let newHeight = this.startClientHeight + ev.pageY - this.startPageY;
      if (newHeight > this.maxHeight) {
        newHeight = this.maxHeight;
      }
      if (newHeight > this.getMaxLimitHeight()) {
        newHeight = this.getMaxLimitHeight();
      }
      if (newHeight < minHeight) {
        newHeight = minHeight;
      }
      this!.style.height = `${newHeight}px`;
      this.manualHeight = newHeight;
    } else {
      // @ts-ignore
      (window as unknown).collectResize = false;
    }
  };

  onMouseUp = (ev: MouseEvent): void => {
    this.isPress = false;
    this.canResize = false;
    this.style.cursor = 'default';
    // @ts-ignore
    (window as unknown).collectResize = false;
    if (this.style.display === 'flex') {
      this.refreshFavoriteCanvas();
    }
  };

  // @ts-ignore
  insertRow(row: TraceRow<unknown>, group: string, updateGroup: boolean): void {
    this.style.display = 'flex';
    let collectGroup = !updateGroup && row.collectGroup ? row.collectGroup : group;
    if (row.collectGroup !== SpChartList.COLLECT_G1 && row.collectGroup !== SpChartList.COLLECT_G2) {
      row.collectGroup = group;
    }
    if (updateGroup) {
      row.collectGroup = group;
    }
    if (collectGroup === SpChartList.COLLECT_G1) {
      if (!this.collect1Expand) {
        this.collect1Expand = true;
        this.icon1!.style.transform = 'rotateZ(0deg)';
      }
      if (this.collectRowList1.indexOf(row) === -1) {
        this.collectRowList1.push(row);
      }
      if (!this.fragmentGroup1.contains(row)) {
        this.fragmentGroup1.appendChild(row);
      }
      this.collectEl1?.appendChild(this.fragmentGroup1);
      this.scrollTo({ top: this.collectEl1?.clientHeight });
    } else {
      if (!this.collect2Expand) {
        this.collect2Expand = true;
        this.icon2!.style.transform = 'rotateZ(0deg)';
      }
      if (this.collectRowList2.indexOf(row) === -1) {
        this.collectRowList2.push(row);
      }
      if (!this.fragmentGroup2.contains(row)) {
        this.fragmentGroup2.appendChild(row);
      }
      this.collectEl2!.appendChild(this.fragmentGroup2);
      this.scrollTo({ top: this.scrollHeight });
    }
    this.updateGroupDisplay();
    this.resizeHeight();
    this.refreshFavoriteCanvas();
    row.currentContext = this.canvasCtx;
  }

  // @ts-ignore
  deleteRow(row: TraceRow<unknown>, clearCollectGroup: boolean): void {
    if (row.collectGroup === SpChartList.COLLECT_G1) {
      this.collectRowList1.splice(this.collectRowList1.indexOf(row), 1);
      if (!this.fragmentGroup1.contains(row)) {
        this.fragmentGroup1.appendChild(row);
      }
      this.fragmentGroup1.removeChild(row);
    } else {
      this.collectRowList2.splice(this.collectRowList2.indexOf(row), 1);
      if (!this.fragmentGroup2.contains(row)) {
        this.fragmentGroup2.appendChild(row);
      }
      this.fragmentGroup2.removeChild(row);
    }
    if (clearCollectGroup) {
      row.collectGroup = undefined;
    }
    this.updateGroupDisplay();
    this.resizeHeight();
    this.scrollTop = 0;
    this.refreshFavoriteCanvas();
    row.currentContext = undefined;
    if (this.collectRowList1.length === 0 && this.collectRowList2.length === 0) {
      this.style.height = 'auto';
      this.style.display = 'none';
      this.manualHeight = 0;
    }
  }

  hideCollectArea(): void {
    if (this.collect1Expand) {
      this.collectRowList1.forEach((row) => this.fragmentGroup1.appendChild(row));
    }
    if (this.collect2Expand) {
      this.collectRowList2.forEach((row) => this.fragmentGroup2.appendChild(row));
    }
    this.groupTitle1!.style.display = 'none';
    this.groupTitle2!.style.display = 'none';
    this.resizeHeight();
  }

  showCollectArea(): void {
    if (this.collect1Expand) {
      this.collectEl1?.appendChild(this.fragmentGroup1);
    }
    if (this.collect2Expand) {
      this.collectEl2?.appendChild(this.fragmentGroup2);
    }
    this.updateGroupDisplay();
    this.resizeHeight();
  }

  updateGroupDisplay(): void {
    this.groupTitle1!.style.display = this.collectRowList1.length === 0 ? 'none' : 'flex';
    this.groupTitle2!.style.display = this.collectRowList2.length === 0 ? 'none' : 'flex';
  }

  hasCollectRow(): boolean {
    return this.collectRowList2.length > 0 || this.collectRowList1.length > 0;
  }

  clearRect(): void {
    this.canvasCtx?.clearRect(0, 0, this.canvas?.clientWidth ?? 0, this.canvas?.clientHeight ?? 0);
  }

  drawLines(xs: number[] | undefined, color: string): void {
    drawLines(this.canvasCtx!, xs ?? [], this.clientHeight, color);
  }

  drawFlagLineSegment(
    hoverFlag: Flag | undefined | null,
    selectFlag: Flag | undefined | null,
    tse: TimerShaftElement
  ): void {
    drawFlagLineSegment(
      this.canvasCtx,
      hoverFlag,
      selectFlag,
      new Rect(0, 0, TraceRow.FRAME_WIDTH, this.canvas?.clientHeight!),
      tse
    );
  }

  drawWakeUp(): void {
    drawWakeUp(
      this.canvasCtx,
      CpuStruct.wakeupBean,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      new Rect(0, 0, TraceRow.FRAME_WIDTH, this.canvas?.clientHeight!)
    );
  }

  drawWakeUpList(bean: WakeupBean): void {
    drawWakeUpList(this.canvasCtx, bean, TraceRow.range!.startNS, TraceRow.range!.endNS, TraceRow.range!.totalNS, {
      x: 0,
      y: 0,
      width: TraceRow.FRAME_WIDTH,
      height: this.canvas!.clientHeight!,
    } as Rect);
  }

  drawLogsLineSegment(bean: Flag | null | undefined, timeShaft: TimerShaftElement): void {
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

  drawLinkLines(nodes: PairPoint[][], tse: TimerShaftElement, isFavorite: boolean, favoriteHeight: number): void {
    drawLinkLines(this.canvasCtx!, nodes, tse, isFavorite, favoriteHeight);
  }

  refreshFavoriteCanvas(): void {
    this.canvas!.style.width = `${this.clientWidth - 248}px`;
    this.canvas!.style.left = `248px`;
    this.canvas!.width = this.canvas?.clientWidth! * dpr();
    this.canvas!.height = this.clientHeight * dpr();
    this.canvas!.getContext('2d')!.scale(dpr(), dpr());
    window.publish(window.SmartEvent.UI.RefreshCanvas, {});
  }

  private getHtmlCss(): string {
    return `<style>
    :host{
        display: none;
        width: 100%;
        height: auto;
        overflow-anchor: none;
        z-index: 3;
        box-shadow: 0 10px 10px #00000044;
        position: relative;
        overflow: auto;
        overflow-x: hidden;
        scroll-behavior: smooth;
    }
    .root{
        width: 100%;
        box-sizing: border-box;
    }
    .panel-canvas{
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        box-sizing: border-box;
    }
    .icon:hover {
     color:#ecb93f;
    }
    .icon {
        margin-right: 10px;
        cursor: pointer;
    }
    </style>`;
  }

  initHtml(): string {
    return `
 ${this.getHtmlCss()}
<canvas id="canvas-panel" class="panel-canvas" ondragstart="return false"></canvas>
<div class="root">
    <div id="group-1-title" style="background-color: #efefef;padding: 10px;align-items: center">
        <lit-icon id="group_1_expand" class="icon" name="caret-down" size="19"></lit-icon>
        <span style="width: 184px;font-size: 10px;color: #898989">G1</span>
        <lit-icon id="group_1_collect" name="star-fill" style="color: #5291FF;cursor: pointer" size="19"></lit-icon>
    </div>
    <div id="collect-group-1"></div>
    <div id="group-2-title" style="background-color: #efefef;padding: 10px;align-items: center">
        <lit-icon id="group_2_expand" class="icon" name="caret-down" size="19"></lit-icon>
        <span style="width: 184px;font-size: 10px;color: #898989">G2</span>
        <lit-icon id="group_2_collect" name="star-fill" style="color: #f56940;cursor: pointer" size="19"></lit-icon>
    </div>
    <div id="collect-group-2"></div>
</div>
`;
  }
}
