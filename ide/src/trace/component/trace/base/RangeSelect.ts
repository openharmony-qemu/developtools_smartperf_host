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

import { RangeSelectStruct, TraceRow } from './TraceRow';
import { Rect } from '../timer-shaft/Rect';
import { TimerShaftElement } from '../TimerShaftElement';
import { info } from '../../../../log/Log';
import './Extension';
import { SpSystemTrace } from '../../SpSystemTrace';
import { fuzzyQueryFuncRowData, queryFuncRowData } from '../../../database/sql/Func.sql';
import { SpLtpoChart } from '../../chart/SpLTPO';
import { isEmpty, isNotEmpty } from './Extension';

export class RangeSelect {
  private rowsEL: HTMLDivElement | undefined | null;
  private rowsPaneEL: HTMLDivElement | undefined | null;
  isMouseDown: boolean = false; // @ts-ignore
  public rangeTraceRow: Array<TraceRow<unknown>> | undefined; // @ts-ignore
  public selectHandler: ((ds: Array<TraceRow<unknown>>, refreshCheckBox: boolean) => void) | undefined;
  private startPageX: number = 0;
  private startPageY: number = 0;
  private endPageX: number = 0;
  private endPageY: number = 0;
  private timerShaftEL: TimerShaftElement | null | undefined;
  private isHover: boolean = false;
  private movingMark: string = '';
  private mark: { startMark: number; endMark: number } = {
    startMark: 0,
    endMark: 0,
  };
  private trace: SpSystemTrace | null | undefined;
  drag = false;
  docomList: Array<number> = [];
  repaintList: Array<number> = [];
  presentList: Array<number> = [];

  constructor(trace: SpSystemTrace | null | undefined) {
    this.trace = trace;
    this.timerShaftEL = trace?.timerShaftEL;
    this.rowsEL = trace?.rowsEL;
    this.rowsPaneEL = trace?.rowsPaneEL;
  }

  isInRowsEl(ev: MouseEvent): boolean {
    return this.rowsPaneEL!.containPoint(ev, { left: 248 });
  }

  isInSpacerEL(ev: MouseEvent): boolean {
    return this.trace!.favoriteChartListEL!.containPoint(ev, { left: 248 });
  }

  mouseDown(eventDown: MouseEvent): void {
    this.startPageX = eventDown.pageX;
    this.startPageY = eventDown.pageY;
    if (TraceRow.rangeSelectObject) {
      this.handleTouchMark(eventDown);
    } else {
      this.isHover = false;
    }
    if (this.isHover) {
      this.isMouseDown = true;
      return;
    }
    this.rangeTraceRow = [];
    this.isMouseDown = true;
    TraceRow.rangeSelectObject = undefined;
    // 遍历当前可视区域所有的泳道，如果有render_service进程，查询该进程下对应泳道的方法存起来，以便框选时直接使用
    this.trace?.visibleRows.forEach((row) => {
      if (row.getAttribute('name')?.startsWith('render_service')) {
        if (row.getAttribute('row-type') === 'process') {
          this.queryRowsData(row.childrenList);
        } else {
          this.queryRowsData(row.parentRowEl!.childrenList);
        }
        return;
      }
    });
  }

  // 对应查询方法行所有的数据
  // @ts-ignore
  queryRowsData(rowList: Array<TraceRow<unknown>>): void {
    rowList.forEach((row): void => {
      if (row.getAttribute('row-type') === 'func') {
        if (row.getAttribute('name')?.startsWith('render_service')) {
          this.saveFrameRateData(row, 'H:RSMainThread::DoComposition');
        } else if (row.getAttribute('name')?.startsWith('RSHardwareThrea')) {
          this.saveFrameRateData(row, 'H:Repaint');
        } else if (row.getAttribute('name')?.startsWith('Present')) {
          this.savePresentData(row, 'H:Waiting for Present Fence');
        }
      }
    });
  }

  // 查到所有的数据存储起来
  // @ts-ignore
  saveFrameRateData(row: TraceRow<unknown>, funcName: string): void {
    let dataList: unknown = [];
    queryFuncRowData(funcName, Number(row?.getAttribute('row-id'))).then((res): void => {
      if (res.length) {
        res.forEach((item): void => {
          // @ts-ignore
          dataList?.push({ startTime: item.startTime!, tid: item.tid });
        });
        if (funcName === 'H:RSMainThread::DoComposition') {
          // @ts-ignore
          this.docomList = dataList;
        } else {
          // @ts-ignore
          this.repaintList = dataList;
        }
      }
    });
  }
  // 查到present泳道所有的数据存储起来
  // @ts-ignore
  savePresentData(row: TraceRow<unknown>, funcName: string): void {
    let dataList: unknown = [];
    fuzzyQueryFuncRowData(funcName, Number(row?.getAttribute('row-id'))).then((res): void => {
      if (res.length) {
        res.forEach((item): void => {
          // @ts-ignore
          dataList?.push({ endTime: item.endTime!, tid: item.tid });
        }); // @ts-ignore
        this.presentList = dataList;
      }
    });
  }

  mouseUp(mouseEventUp?: MouseEvent): void {
    if (mouseEventUp) {
      this.endPageX = mouseEventUp.pageX;
      this.endPageY = mouseEventUp.pageY;
    }
    if (this.drag) {
      if (this.selectHandler) {
        this.selectHandler(this.rangeTraceRow || [], !this.isHover);
      }
      //查询render_service数据
      if (this.rangeTraceRow?.length) {
        this.checkRowsName(this.rangeTraceRow);
      }
    }
    this.isMouseDown = false;
    this.isHover = false;
  }
  // @ts-ignore
  checkRowsName(rowList: Array<TraceRow<unknown>>): void {
    rowList.forEach((row): void => {
      if (
        row.getAttribute('row-type') === 'func' &&
        row.parentRowEl?.getAttribute('name')?.startsWith('render_service')
      ) {
        row.frameRateList = [];
        if (row.getAttribute('name')?.startsWith('render_service')) {
          this.filterRateData(row, this.docomList);
        } else if (row.getAttribute('name')?.startsWith('RSHardwareThrea')) {
          this.filterRateData(row, this.repaintList);
        } else if (row.getAttribute('name')?.startsWith('Present')) {
          this.filterPresentData(row, this.presentList);
        }
      }
    });
  }

  // 过滤处理数据
  // @ts-ignore
  filterRateData(row: TraceRow<unknown>, data: unknown): void {
    // @ts-ignore
    data.forEach((it: unknown): void => {
      if (
        // @ts-ignore
        it.startTime >= TraceRow.rangeSelectObject!.startNS! && // @ts-ignore
        it.startTime <= TraceRow.rangeSelectObject!.endNS! && // @ts-ignore
        Number(row.rowId) === Number(it.tid)
      ) {
        // @ts-ignore
        row.frameRateList?.push(it.startTime);
      }
    });
    if (row.frameRateList?.length) {
      if (row.frameRateList.length < 2) {
        row.frameRateList = [];
      } else {
        const CONVERT_SECONDS = 1000000000;
        let cutres: number = row.frameRateList[row.frameRateList.length - 1] - row.frameRateList[0];
        row.avgRateTxt = `${(((row.frameRateList.length - 1) / cutres) * CONVERT_SECONDS).toFixed(1)}fps`;
      }
    }
  }

  // 过滤并处理present数据
  // @ts-ignore
  filterPresentData(row: TraceRow<unknown>, data: unknown): void {
    // @ts-ignore
    data.forEach((it: unknown): void => {
      if (
        // @ts-ignore
        it.endTime >= TraceRow.rangeSelectObject!.startNS! && // @ts-ignore
        it.endTime <= TraceRow.rangeSelectObject!.endNS! && // @ts-ignore
        Number(row.rowId) === Number(it.tid)
      ) {
        // @ts-ignore
        row.frameRateList?.push(it.endTime);
      }
    });
    if (row.frameRateList?.length) {
      if (row.frameRateList?.length < 2) {
        row.frameRateList = [];
      } else {
        let hitchTimeList: Array<number> = [];
        for (let i = 0; i < SpLtpoChart.sendHitchDataArr.length; i++) {
          if (
            SpLtpoChart.sendHitchDataArr[i].startTs! >= row.frameRateList[0]! &&
            SpLtpoChart.sendHitchDataArr[i].startTs! < row.frameRateList[row.frameRateList.length - 1]!
          ) {
            hitchTimeList.push(SpLtpoChart.sendHitchDataArr[i].value!);
          } else if (SpLtpoChart.sendHitchDataArr[i].startTs! >= row.frameRateList[row.frameRateList.length - 1]!) {
            break;
          }
        }
        const CONVERT_SECONDS = 1000000000;
        let cutres: number = row.frameRateList[row.frameRateList.length - 1] - row.frameRateList[0];
        let avgRate: string = `${(((row.frameRateList.length - 1) / cutres) * CONVERT_SECONDS).toFixed(1)}fps`;
        let sum: number = hitchTimeList.reduce((accumulator, currentValue) => accumulator + currentValue, 0); // ∑hitchTimeData
        let hitchRate: number =
          sum / ((TraceRow.rangeSelectObject!.endNS! - TraceRow.rangeSelectObject!.startNS!) / 1000000000);
        row.avgRateTxt =
          `${avgRate} ` + ',' + ' ' + 'HitchTime:' + ` ${sum.toFixed(1)}ms` + ' ' + ',' + ` ${hitchRate.toFixed(2)}ms/s`;
      }
    }
  }

  isDrag(): boolean {
    return this.startPageX !== this.endPageX;
  }

  isTouchMark(ev: MouseEvent): boolean {
    let notTimeHeight: boolean = this.rowsPaneEL!.containPoint(ev, {
      left: 248,
      top: -45,
    });
    if (!notTimeHeight) {
      return false;
    }
    if ((isEmpty(this.rangeTraceRow) ?? false) && !this.isMouseDown) {
      this.isHover = false;
    }
    return notTimeHeight && (isNotEmpty(this.rangeTraceRow) ?? false) && !this.isMouseDown;
  }

  mouseOut(mouseEventOut: MouseEvent): void {
    this.endPageX = mouseEventOut.pageX;
    this.endPageY = mouseEventOut.pageY;
    if (this.drag) {
      if (this.selectHandler && this.isMouseDown) {
        this.selectHandler(this.rangeTraceRow || [], !this.isHover);
      }
    }
    document.getSelection()?.removeAllRanges();
    this.isMouseDown = false;
    this.isHover = false;
  }
  // @ts-ignore
  mouseMove(rows: Array<TraceRow<unknown>>, ev: MouseEvent): void {
    this.endPageX = ev.pageX;
    this.endPageY = ev.pageY;
    if (this.isTouchMark(ev) && TraceRow.rangeSelectObject) {
      this.handleTouchMark(ev);
    } else {
      document.body.style.cursor = 'default';
    }
    if (this.isHover && this.isMouseDown) {
      this.handleRangeSelectAndDraw(rows, ev);
      return;
    }
    if (!this.isMouseDown) {
      this.isHover = false;
      this.handleDrawForNotMouseDown();
      return;
    }
    this.handleRangeSelect(rows);
    this.timerShaftEL!.sportRuler!.isRangeSelect = this.rangeTraceRow!.length > 0;
    this.timerShaftEL!.sportRuler!.draw();
  }
  // @ts-ignore
  private handleRangeSelect(rows: Array<TraceRow<unknown>>): void {
    let rangeSelect: RangeSelectStruct | undefined;
    let favoriteRect = this.trace?.favoriteChartListEL?.getBoundingClientRect();
    let favoriteLimit = favoriteRect!.top + favoriteRect!.height;
    this.rangeTraceRow = rows.filter((it): boolean => {
      let domRect = it.getBoundingClientRect();
      let itRect = { x: domRect.x, y: domRect.y, width: domRect.width, height: domRect.height };
      if (itRect.y < favoriteLimit && !it.collect) {
        let offset = favoriteLimit - itRect.y;
        itRect.y = itRect.y + offset;
        itRect.height = itRect.height - offset;
      }
      if (it.sticky) {
        itRect.y = 0;
        itRect.height = 0;
      }
      let result: boolean;
      if (
        Rect.intersect(
          itRect as Rect,
          {
            x: Math.min(this.startPageX, this.endPageX),
            y: Math.min(this.startPageY, this.endPageY),
            width: Math.abs(this.startPageX - this.endPageX),
            height: Math.abs(this.startPageY - this.endPageY),
          } as Rect
        )
      ) {
        if (!rangeSelect) {
          it.setTipLeft(0, null);
          rangeSelect = new RangeSelectStruct();
          let startX = Math.min(this.startPageX, this.endPageX) - it.describeEl!.getBoundingClientRect().right;
          let endX = Math.max(this.startPageX, this.endPageX) - it.describeEl!.getBoundingClientRect().right;
          if (startX <= 0) {
            startX = 0;
          }
          if (endX > it.frame.width) {
            endX = it.frame.width;
          }
          rangeSelect.startX = startX;
          rangeSelect.endX = endX;
          rangeSelect.startNS = RangeSelect.SetNS(it, startX);
          rangeSelect.endNS = RangeSelect.SetNS(it, endX);
        }
        TraceRow.rangeSelectObject = rangeSelect;
        it.rangeSelect = true;
        result = true;
      } else {
        it.rangeSelect = false;
        result = false;
      }
      return result;
    });
    if (this.rangeTraceRow && this.rangeTraceRow.length) {
      if (this.rangeTraceRow[0].parentRowEl) {
        for (let i = 0; i < this.rangeTraceRow[0].parentRowEl.childrenList.length; i++) {
          this.rangeTraceRow[0].parentRowEl.childrenList[i].frameRateList = [];
          this.rangeTraceRow[0].parentRowEl.childrenList[i].avgRateTxt = null;
        }
      }
    }
  }

  private handleDrawForNotMouseDown(): void {
    this.timerShaftEL!.sportRuler!.isRangeSelect = isNotEmpty(this.rangeTraceRow) ?? false;
    this.timerShaftEL!.sportRuler!.draw();
  }
  // @ts-ignore
  private handleRangeSelectAndDraw(rows: Array<TraceRow<unknown>>, ev: MouseEvent): void {
    let rangeSelect: RangeSelectStruct | undefined;
    let result: boolean;
    this.rangeTraceRow = rows.filter((it) => {
      if (it.rangeSelect) {
        if (!rangeSelect) {
          rangeSelect = new RangeSelectStruct();
          let mouseX = ev.pageX - this.rowsEL!.getBoundingClientRect().left - 248;
          mouseX = mouseX < 0 ? 0 : mouseX;
          let markA = this.movingMark === 'markA' ? mouseX : this.mark.startMark;
          let markB = this.movingMark === 'markB' ? mouseX : this.mark.endMark;
          let startX = markA < markB ? markA : markB;
          let endX = markB < markA ? markA : markB;
          rangeSelect.startX = startX;
          rangeSelect.endX = endX;
          rangeSelect.startNS = RangeSelect.SetNS(it, startX);
          rangeSelect.endNS = RangeSelect.SetNS(it, endX);
          if (rangeSelect.startNS <= TraceRow.range!.startNS) {
            rangeSelect.startNS = TraceRow.range!.startNS;
          }
          if (rangeSelect.endNS >= TraceRow.range!.endNS) {
            rangeSelect.endNS = TraceRow.range!.endNS;
          }
          if (startX < 0) {
            rangeSelect.startNS = TraceRow.rangeSelectObject!.startNS!;
          } // @ts-ignore
          if (endX > it.frame.width) {
            rangeSelect.endNS = TraceRow.rangeSelectObject!.endNS!;
          }
        }
        TraceRow.rangeSelectObject = rangeSelect;
        result = true;
      } else {
        result = false;
      }
      return result;
    });
    this.timerShaftEL!.sportRuler!.isRangeSelect = (this.rangeTraceRow?.length || 0) > 0;
    this.timerShaftEL!.sportRuler!.draw();
  }

  private handleTouchMark(ev: MouseEvent): void {
    info('isTouchMark');
    let x1 =
      ((TraceRow.rangeSelectObject!.startNS! - TraceRow.range!.startNS) *
        (this.timerShaftEL?.canvas?.clientWidth || 0)) /
      (TraceRow.range!.endNS - TraceRow.range!.startNS);
    let x2 =
      ((TraceRow.rangeSelectObject!.endNS! - TraceRow.range!.startNS) * (this.timerShaftEL?.canvas?.clientWidth || 0)) /
      (TraceRow.range!.endNS - TraceRow.range!.startNS);
    this.mark = { startMark: x1, endMark: x2 };
    let mouseX = ev.pageX - this.rowsPaneEL!.getBoundingClientRect().left - 248;
    if (mouseX > x1 - 5 && mouseX < x1 + 5) {
      this.isHover = true;
      document.body.style.cursor = 'ew-resize';
      this.movingMark = x1 < x2 ? 'markA' : 'markB';
    } else if (mouseX > x2 - 5 && mouseX < x2 + 5) {
      this.isHover = true;
      document.body.style.cursor = 'ew-resize';
      this.movingMark = x2 < x1 ? 'markA' : 'markB';
    } else {
      this.isHover = false;
      document.body.style.cursor = 'default';
    }
  }
  // @ts-ignore
  static SetNS(row: TraceRow<unknown>, num: number): number {
    return Math.floor(
      // @ts-ignore
      ((TraceRow.range!.endNS - TraceRow.range!.startNS) * num) / row.frame.width + TraceRow.range!.startNS!
    );
  }
}
