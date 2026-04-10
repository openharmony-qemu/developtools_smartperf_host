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
throttle(fn: Function, t: number, ev ?: unknown): Function {
  let timerId: unknown = null;
  return (): void => {
    if (!timerId) {
      timerId = setTimeout(function (): void {
        if (ev) {
          fn(ev);
        } else {
          fn();
        }
        timerId = null;
      }, t); // @ts-ignore
      this.times.add(timerId);
    }
  };
}

// 防抖处理
debounce(fn: Function, ms: number, ev ?: unknown): Function {
  let timerId: undefined | number;
  return (): void => {
    if (timerId) {
      window.clearTimeout(timerId);
    } else {
      timerId = window.setTimeout((): void => {
        if (ev) {
          fn(ev);
        } else {
          fn();
        }
        timerId = undefined;
      }, ms);
      this.times.add(timerId);
    }
  };
}

addPointPair(startPoint: PairPoint, endPoint: PairPoint, lineType ?: string): void {
  if(startPoint !== null && startPoint.rowEL !== null && endPoint !== null && endPoint.rowEL !== null) {
  const LinkNodes: PairPoint[][] = [];
  LinkNodes.push([startPoint, endPoint]);
  startPoint.sourceOffsetY = startPoint.offsetY;
  endPoint.sourceOffsetY = endPoint.offsetY;
  startPoint.offsetY = startPoint.rowEL.funcExpand ? startPoint.sourceOffsetY : startPoint.rowEL._frame!.height;
  endPoint.offsetY = endPoint.rowEL.funcExpand ? endPoint.sourceOffsetY : endPoint.rowEL._frame!.height;
  this.handleCollectFunc(LinkNodes);
  startPoint.y = startPoint.rowEL!.translateY! + startPoint.offsetY;
  endPoint.y = endPoint.rowEL!.translateY! + endPoint.offsetY;
  startPoint.backrowEL = startPoint.rowEL;
  endPoint.backrowEL = endPoint.rowEL;
  startPoint.sourcebackrowEL = startPoint.rowEL;
  endPoint.sourcebackrowEL = endPoint.rowEL;
  //判断是否是分布式连线，分布式连线需有rangeTime
  if (!lineType) {
    this.linkNodes.push([startPoint, endPoint]);
  } else {
    if (startPoint.rangeTime) {
      this.linkNodes.push([startPoint, endPoint]);
    }
  }
  this.refreshCanvas(true);
}
}

clearPointPair(): void {
  this.linkNodes.length = 0;
}

removeLinkLinesByBusinessType(...businessTypes: string[]): void {
  this.linkNodes = this.linkNodes.filter((pointPair) => {
    if (businessTypes.indexOf('distributed') >= 0) {
      FuncStruct.selectLineFuncStruct = [];
    }
    return businessTypes.indexOf(pointPair[0].business) <= -1;
  });
}

hiddenLinkLinesByBusinessType(...businessTypes: string[]): void {
  this.linkNodes.map((value) => {
    if (businessTypes.indexOf(value[0].business) !== -1) {
      value[0].hidden = true;
      value[1].hidden = true;
    }
  });
}

showLinkLinesByBusinessType(...businessTypes: string[]): void {
  this.linkNodes.map((value) => {
    if (businessTypes.indexOf(value[0].business) !== -1) {
      value[0].hidden = false;
      value[1].hidden = false;
    }
  });
}

initElements(): void {
  spSystemTraceInitElement(this);
}

// 清除上一次点击调用栈产生的三角旗子
clearTriangle(flagList: Array<Flag>): void {
  this.timerShaftEL!.sportRuler!.times = [];
  for(let i = 0; i <flagList.length; i++) {
  if (flagList[i].type === 'triangle') {
    flagList.splice(i, 1);
    this.timerShaftELFlagChange(this.hoverFlag, null);
    i--;
  }
}
}

pushPidToSelection(selection: SelectionParam, id: string, originalId ?: string | Array<string>): void {
  let add = (it: string): void => {
    let pid = parseInt(it ? it : id);
    if (!isNaN(pid!)) {
      if (!selection.processIds.includes(pid!)) {
        selection.processIds.push(pid!);
      }
    }
  };
  if(Array.isArray(originalId)) {
  originalId.forEach(item => {
    add(item);
  });
} else {
  add(originalId!);
}
}
// @ts-ignore
getCollectRows(condition: (row: TraceRow<unknown>) => boolean): Array < TraceRow < unknown >> {
  return this.favoriteChartListEL!.getCollectRows(condition);
}
// @ts-ignore
createPointEvent(it: TraceRow<unknown>): unknown {
  // @ts-ignore
  let event = this.eventMap[`${it.rowType}`];
  if (event) {
    return event;
  } else {
    if (it.rowType === TraceRow.ROW_TYPE_HEAP) {
      event = it.name;
    } else if (it.rowType === TraceRow.ROW_TYPE_HIPERF_CPU) {
      event = 'HiPerf Cpu';
      if (it.rowId === 'HiPerf-cpu-merge') {
        event = 'HiPerf';
      }
    } else if (it.rowType === TraceRow.ROW_TYPE_FILE_SYSTEM) {
      event = this.handleFileSystemType(it, event);
    } else if (it.rowType === TraceRow.ROW_TYPE_STATE_ENERGY) {
      event = it.name;
    } else if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER) {
      if (it.rowParentId === '') {
        event = 'VM Tracker';
      } else {
        event = it.name;
      }
    } else if (it.rowType === TraceRow.ROW_TYPE_JANK) {
      if (it.rowId === 'frameTime' || it.rowParentId === 'frameTime') {
        event = 'FrameTimeLine';
      } else if (it.hasAttribute('frame_type')) {
        event = `${it.getAttribute('frame_type')}`;
      }
    } else if (it.rowType === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
      event = 'DeliverInputEvent';
      if (it.rowParentId === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
        event = 'DeliverInputEvent Func';
      }
    } else if (it.rowType === TraceRow.ROW_TYPE_TOUCH_EVENT_DISPATCH) {
      event = 'TouchEventDispatch';
      if (it.rowParentId === TraceRow.ROW_TYPE_TOUCH_EVENT_DISPATCH) {
        event = 'TouchEventDispatch Func';
      }
    } else {
      event = it.name;
    }
    return event;
  }
}
// @ts-ignore
private handleFileSystemType(it: TraceRow<unknown>, event: unknown): void {
  if(it.rowId === 'FileSystemLogicalWrite') {
  event = 'FileSystem Logical Write';
} else if (it.rowId === 'FileSystemLogicalRead') {
  event = 'FileSystem Logical Read';
} else if (it.rowId === 'FileSystemVirtualMemory') {
  event = 'Page Fault Trace';
} else if (it.rowId!.startsWith('FileSystemDiskIOLatency')) {
  event = 'Disk I/O Latency';
  if (it.rowId!.startsWith('FileSystemDiskIOLatency-')) {
    event = 'Bio Process';
  }
} // @ts-ignore
return event;
}

refreshFavoriteCanvas(): void {
  this.favoriteChartListEL!.refreshFavoriteCanvas();
}
// @ts-ignore
expansionAllParentRow(currentRow: TraceRow<unknown>): void {
  // @ts-ignore
  let parentRow = this.rowsEL!.querySelector<TraceRow<unknown>>(
    `trace-row[row-id='${currentRow.rowParentId}'][folder][scene]`
  );
  if(parentRow) {
    parentRow.expansion = true; // @ts-ignore
    if (this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${parentRow.rowParentId}'][folder]`)) {
      this.expansionAllParentRow(parentRow);
    }
  }
}

canvasPanelConfig(): void {
  this.canvasPanel!.style.left = `${this.timerShaftEL!.canvas!.offsetLeft!}px`;
  this.canvasPanel!.width = this.canvasPanel!.offsetWidth * dpr();
  this.canvasPanel!.height = this.canvasPanel!.offsetHeight * dpr();
  this.canvasPanelCtx!.scale(dpr(), dpr());
}

getScrollWidth(): number {
  let overflowDiv = document.createElement('div');
  overflowDiv.style.cssText = 'position:absolute; top:-2000px;width:200px; height:200px; overflow:hidden;';
  let totalScrollDiv = document.body.appendChild(overflowDiv).clientWidth;
  overflowDiv.style.overflowY = 'scroll';
  let scrollDiv = overflowDiv.clientWidth;
  document.body.removeChild(overflowDiv);
  return totalScrollDiv - scrollDiv;
}

getShowTab(): Array < string > {
  let tabpane = this.traceSheetEL!.shadowRoot!.querySelectorAll('lit-tabpane') as NodeListOf<LitTabpane>;
  let showTab: Array<string> = [];
  for(let pane of tabpane) {
    if (pane.getAttribute('hidden') === 'false') {
      showTab.push(pane.getAttribute('id') || '');
    }
  }
  return showTab;
}

timerShaftELFlagClickHandler = (flag: FlagAlias): void => {
  if (flag) {
    setTimeout(() => {
      if (TraceRow.rangeSelectObject) {
        let showTab = this.getShowTab();
        this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag', ...showTab).setCurrentFlag(flag);
      } else {
        this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag').setCurrentFlag(flag);
      }
    }, 100);
  }
};

timerShaftELFlagChange = (hoverFlag: FlagAlias, selectFlag: FlagAlias): void => {
  this.hoverFlag = hoverFlag;
  this.selectFlag = selectFlag;
  this.refreshCanvas(true, 'flagChange');
};

timerShaftELRangeClick = (sliceTime: SlicesTimeAlias): void => {
  if (sliceTime) {
    setTimeout(() => {
      if (TraceRow.rangeSelectObject) {
        let showTab = this.getShowTab();
        this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current', ...showTab).setCurrentSlicesTime(sliceTime);
      } else {
        this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current').setCurrentSlicesTime(sliceTime);
      }
    }, 0);
  }
};

timerShaftELRangeChange = (e: unknown): void => {
  // @ts-ignore
  TraceRow.range = e;
  if (TraceRow.rangeSelectObject) {
    TraceRow.rangeSelectObject!.startX = Math.floor(
      ns2x(
        TraceRow.rangeSelectObject!.startNS!,
        TraceRow.range?.startNS!,
        TraceRow.range?.endNS!,
        TraceRow.range?.totalNS!,
        this.timerShaftEL!.sportRuler!.frame
      )
    );
    TraceRow.rangeSelectObject!.endX = Math.floor(
      ns2x(
        TraceRow.rangeSelectObject!.endNS!,
        TraceRow.range?.startNS!,
        TraceRow.range?.endNS!,
        TraceRow.range?.totalNS!,
        this.timerShaftEL!.sportRuler!.frame
      )
    );
  }
  if (!TraceRow.rangeSelectObject) {
    SpAiAnalysisPage.selectChangeListener(TraceRow.range?.startNS!, TraceRow.range?.endNS!);
  }
  //在rowsEL显示范围内的 trace-row组件将收到时间区间变化通知
  this.linkNodes.forEach((it) => {
    it[0].x = ns2xByTimeShaft(it[0].ns, this.timerShaftEL!);
    it[1].x = ns2xByTimeShaft(it[1].ns, this.timerShaftEL!);
  });
  this.invisibleRows.forEach((it) => (it.needRefresh = true));
  this.visibleRows.forEach((it) => (it.needRefresh = true));
  this.refreshCanvas(false, 'rangeChange');
};
top: number = 0;
handler: number = -1;
rowsElOnScroll = (e: unknown): void => {
  this.rangeSelect.isMouseDown = false;
  // @ts-ignore
  const currentScrollY = e.target.scrollTop;
  const deltaY = currentScrollY - this.prevScrollY;
  this.handleCollectFunc(this.linkNodes);
  this.hoverStructNull();
  if (this.scrollTimer) {
    // @ts-ignore
    clearTimeout(this.scrollTimer);
  }
  this.scrollTimer = setTimeout(() => {
    TraceRow.range!.refresh = true;
    requestAnimationFrame(() => this.refreshCanvas(false));
  }, 200);
  spSystemTraceParentRowSticky(this, deltaY);
  this.prevScrollY = currentScrollY;
};

handleCollectFunc(linkNodes: PairPoint[][]): void {
  let margin = this.timerShaftEL?._checkExpand ? this.timerShaftEL!._usageFoldHeight! - 195 : 0 - 195;
  linkNodes.forEach((itln) => {
    itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
    itln[0].offsetY = itln[0].rowEL.funcExpand ? itln[0].offsetY! : itln[0].rowEL._frame!.height - 5;
    if (itln[1].rowEL.collect) {
      if (itln[1].rowEL.collectGroup === '1') {
        if (this.favoriteChartListEL?.collect1Expand) {
          itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top + margin;
          itln[1].offsetY = itln[1].rowEL.funcExpand ? itln[1].sourceOffsetY! : itln[1].rowEL._frame!.height - 5;
        } else {
          itln[1].rowEL.translateY = this.groupTitle1!.getBoundingClientRect().top + margin;
          itln[1].offsetY = this.groupTitle1!.offsetHeight / 2;
        }
      } else {
        if (this.favoriteChartListEL?.collect2Expand) {
          itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top + margin;
          itln[1].offsetY = itln[1].rowEL.funcExpand ? itln[1].sourceOffsetY! : itln[1].rowEL._frame!.height - 5;
        } else {
          itln[1].rowEL.translateY = this.groupTitle2!.getBoundingClientRect().top + margin;
          itln[1].offsetY = this.groupTitle2!.offsetHeight / 2;
        }
      }

    } else {
      itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      itln[1].offsetY = itln[1].rowEL.funcExpand ? itln[1].offsetY! : itln[1].rowEL._frame!.height - 5;
    }
  }
    itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
  itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
};

favoriteRowsElOnScroll = (e: unknown): void => {
  this.rowsElOnScroll(e);
};

offset = 147;

getRowsContentHeight(): number {
  // @ts-ignore
  return [...this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row:not([sleeping])')]
    .map((it) => it.clientHeight)
    .reduce((acr, cur) => acr + cur, 0);
}

// refresh main canvas and favorite canvas
refreshCanvas(cache: boolean, from ?: string): void {
  if(this.visibleRows.length === 0) {
  return;
}
//clear main canvas
this.canvasPanelCtx!.clearRect(0, 0, this.canvasPanel!.offsetWidth, this.canvasPanel!.offsetHeight);
this.favoriteChartListEL!.clearRect();
//draw lines for main canvas
let rowsContentHeight = this.getRowsContentHeight();
let canvasHeight =
  rowsContentHeight > this.canvasPanel!.clientHeight ? this.canvasPanel!.clientHeight : rowsContentHeight;
drawLines(this.canvasPanelCtx!, TraceRow.range?.xs || [], canvasHeight, this.timerShaftEL!.lineColor());
//draw lines for favorite canvas
this.favoriteChartListEL?.drawLines(TraceRow.range?.xs, this.timerShaftEL!.lineColor()); // chart list

//canvas translate
this.canvasPanel!.style.transform = `translateY(${this.rowsPaneEL!.scrollTop}px)`;
//draw trace row
this.visibleRows.forEach((v, i) => {
  if (v.collect) {
    v.translateY =
      v.getBoundingClientRect().top -
      this.timerShaftEL?.clientHeight! -
      this.parentElement!.previousElementSibling!.clientHeight -
      1;
  } else {
    v.translateY = v.offsetTop - this.rowsPaneEL!.scrollTop;
  }
  v.draw(cache);
});
this.drawAllLines();
}

drawWakeUpLine(): void {
  //draw wakeup for main canvas
  drawWakeUp(
    this.canvasPanelCtx,
  CpuStruct.wakeupBean,
  TraceRow.range!.startNS,
  TraceRow.range!.endNS,
  TraceRow.range!.totalNS,
    {
  x: 0,
    y: 0,
      width: TraceRow.FRAME_WIDTH,
        height: this.canvasPanel!.clientHeight!,
    } as Rect
  );
this.favoriteChartListEL?.drawWakeUp();
// draw wakeuplist for main canvas
for (let i = 0; i < SpSystemTrace.wakeupList.length; i++) {
  if (i + 1 === SpSystemTrace.wakeupList.length) {
    return;
  }
  drawWakeUpList(
    this.canvasPanelCtx,
    SpSystemTrace.wakeupList[i + 1],
    TraceRow.range!.startNS,
    TraceRow.range!.endNS,
    TraceRow.range!.totalNS,
    {
      x: 0,
      y: 0,
      width: this.timerShaftEL!.canvas!.clientWidth,
      height: this.canvasPanel!.clientHeight!,
    } as Rect
  );
  this.favoriteChartListEL?.drawWakeUpList(SpSystemTrace.wakeupList[i + 1]);
}
}

drawAllLines(): void {
  // draw flag line segment for canvas
  drawFlagLineSegment(
    this.canvasPanelCtx,
  this.hoverFlag,
  this.selectFlag,
    {
  x: 0,
    y: 0,
      width: this.timerShaftEL?.canvas?.clientWidth,
        height: this.canvasPanel?.clientHeight,
    } as Rect,
  this.timerShaftEL!
  );
this.favoriteChartListEL?.drawFlagLineSegment(this.hoverFlag, this.selectFlag, this.timerShaftEL!);
this.drawWakeUpLine();
//draw system logs line segment for canvas
drawLogsLineSegment(
  this.canvasPanelCtx,
  this.traceSheetEL?.systemLogFlag,
  {
    x: 0,
    y: 0,
    width: this.timerShaftEL?.canvas?.clientWidth,
    height: this.canvasPanel?.clientHeight,
  },
  this.timerShaftEL!
);
this.favoriteChartListEL?.drawLogsLineSegment(this.traceSheetEL!.systemLogFlag, this.timerShaftEL!);

// Draw the connection curve
if (this.linkNodes && this.linkNodes.length > 0) {
  drawLinkLines(
    this.canvasPanelCtx!,
    this.linkNodes,
    this.timerShaftEL!,
    false,
    this.favoriteChartListEL!.clientHeight
  );
  this.favoriteChartListEL?.drawLinkLines(
    this.linkNodes,
    this.timerShaftEL!,
    true,
    this.favoriteChartListEL!.clientHeight
  );
}
// draw prio curve
if (
  ThreadStruct.isClickPrio &&
  this.currentRow!.parentRowEl!.expansion &&
  ThreadStruct.selectThreadStruct &&
  ThreadStruct.contrast(ThreadStruct.selectThreadStruct, this.currentRow!.rowParentId, this.currentRow!.rowId)
) {
  let context: CanvasRenderingContext2D;
  if (this.currentRow!.currentContext) {
    context = this.currentRow!.currentContext;
  } else {
    context = this.currentRow!.collect ? this.canvasFavoritePanelCtx! : this.canvasPanelCtx!;
  }
  this.drawPrioCurve(context, this.currentRow!);
}
}

// draw prio curve
// @ts-ignore
drawPrioCurve(context: unknown, row: TraceRow<unknown>): void {
  let curveDrawList: unknown = [];
  let oldVal: number = -1;
  // @ts-ignore
  let threadFilter = row.dataListCache.filter((it: unknown) => it.state === 'Running'); //筛选状态是Running的数据
  //计算每个点的坐标
  // @ts-ignore
  prioClickHandlerFun(ThreadStruct.prioCount, row, threadFilter, curveDrawList, oldVal);
  //绘制曲线透明度设置1，根据计算的曲线坐标开始画图
  // @ts-ignore
  context.globalAlpha = 1;
  // @ts-ignore
  context.beginPath();
  let x0;
  let y0;
  // @ts-ignore
  if(curveDrawList[0] && curveDrawList[0].frame) {
  // @ts-ignore
  x0 = curveDrawList[0].frame.x;
  // @ts-ignore
  y0 = curveDrawList[0].curveFloatY;
}
// @ts-ignore
context!.moveTo(x0!, y0!);
// @ts-ignore
if (curveDrawList.length < 90) {
  // @ts-ignore
  for (let i = 0; i < curveDrawList.length - 1; i++) {
    // @ts-ignore
    let re = curveDrawList[i];
    // @ts-ignore
    let nextRe = curveDrawList[i + 1];
    // @ts-ignore
    drawThreadCurve(context, re, nextRe);
  }
  // @ts-ignore
  context.closePath();
  // @ts-ignore
} else if (curveDrawList.length >= 90) {
  let x;
  let y;
  // @ts-ignore
  if (curveDrawList[curveDrawList.length - 1] && curveDrawList[curveDrawList.length - 1].frame) {
    // @ts-ignore
    x = curveDrawList[curveDrawList.length - 1].frame.x;
    // @ts-ignore
    y = curveDrawList[curveDrawList.length - 1].curveFloatY;
  }
  // @ts-ignore
  context.lineWidth = 1;
  // @ts-ignore
  context.strokeStyle = '#ffc90e';
  // @ts-ignore
  context.lineCap = 'round';
  // @ts-ignore
  context.lineTo(x, y);
  // @ts-ignore
  context.stroke();
}
}

documentOnMouseDown = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseDown(this, ev);

onContextMenuHandler = (e: Event): void => {
  setTimeout(() => {
    for (let key of this.keyPressMap.keys()) {
      if (this.keyPressMap.get(key)) {
        this.timerShaftEL?.stopWASD({ key: key });
        this.keyPressMap.set(key, false);
      }
    }
  }, 100);
};

documentOnMouseUp = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseUp(this, ev);

cancelDrag(): void {
  this.rangeSelect.drag = false;
  this.rangeSelect.isMouseDown = false;
  TraceRow.rangeSelectObject = {
    startX: 0,
    endX: 0,
    startNS: 0,
    endNS: 0,
  };
}

documentOnMouseOut = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseOut(this, ev);

documentOnPointercancel = (ev: any): void => {
  if (ev.pointerType == 'mouse') {
    this.dispatchEvent(
      new CustomEvent('abnormal-mouseup', {
        detail: {
          value: true,
        },
      })
    );
  }
};

keyPressMap: Map<string, boolean> = new Map([
  ['w', false],
  ['s', false],
  ['a', false],
  ['d', false],
  ['f', false],
]);

documentOnKeyDown = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyDown(this, ev);

documentOnKeyPress = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyPress(this, ev);

verticalScrollToRow(): void {
  if(this.currentRow && !this.currentRow.folder) {
  //@ts-ignore
  this.currentRow.scrollIntoViewIfNeeded();
}
}
private calculateSlicesTime(selected: unknown, shiftKey: boolean): void {
  if(selected) {
    let startTs = 0;
    // @ts-ignore
    if (selected.begin && selected.end) {
      // @ts-ignore
      startTs = selected.begin - selected.startTs;
      // @ts-ignore
      let end = selected.end - selected.startTs;
      this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, end, shiftKey);
      // @ts-ignore
    } else if (selected.startNS && selected.dur) {
      // @ts-ignore
      startTs = selected.startNS - selected.startTime;
      // @ts-ignore
      let end = selected.startNS + selected.dur - selected.startTime;
      this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, end, shiftKey);
    } else {
      // @ts-ignore
      startTs = selected.startTs || selected.startTime || selected.startNS || selected.ts || 0;
      // @ts-ignore
      let dur = selected.dur || selected.totalTime || selected.endNS - selected.startNS || 0;
      this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, startTs + dur, shiftKey);
    }
  } else {
    this.slicestime = this.timerShaftEL?.setSlicesMark();
  }
}

stopWASD = (): void => {
  setTimeout((): void => {
    for (let key of this.keyPressMap.keys()) {
      if (this.keyPressMap.get(key)) {
        this.timerShaftEL?.stopWASD({ key: key });
        this.keyPressMap.set(key, false);
      }
    }
  }, 100);
};

// 一直按着回车键的时候执行搜索功能
continueSearch = (ev: KeyboardEvent): void => {
  if (!this.keyboardEnable) {
    return;
  }
  if (ev.key === 'Enter') {
    if (ev.shiftKey) {
      this.dispatchEvent(
        new CustomEvent('trace-previous-data', {
          detail: { down: true },
          composed: false,
        })
      );
    } else {
      this.dispatchEvent(
        new CustomEvent('trace-next-data', {
          detail: { down: true },
          composed: false,
        })
      );
    }
  }
};

documentOnKeyUp = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyUp(this, ev);
if (type === 'flag') {
  let currentPane = this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag');
  list.forEach((flag, index) => {
    // @ts-ignore
    this.timerShaftEL!.sportRuler!.drawTriangle(flag.time, flag.type); // @ts-ignore
    if (flag.selected) {
      // 修改当前选中的旗子对应的表格中某行的背景
      currentPane!.setTableSelection(index + 1);
    }
  });
} else if (type === 'slice') {
  this.refreshCanvas(true);
  let currentPane = this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current');
  list.forEach((slice, index) => {
    // @ts-ignore
    if (slice.selected) {
      // 修改当前选中的卡尺对应的表格中某行的背景
      currentPane!.setTableSelection(index + 1);
    }
  });
}
}

ifSliceInView(data: unknown, type: string, ev: KeyboardEvent): void {
  let timeRangeEndNS = this.timerShaftEL?.getRangeRuler()?.range.endNS;
  let timeRangeStartNS = this.timerShaftEL?.getRangeRuler()?.range.startNS;
  if(type === 'flag') {
  // @ts-ignore
  data.startTime = data.time; // @ts-ignore
  data.endTime = data.time;
} // @ts-ignore
let endTime = data.endTime; // @ts-ignore
let startTime = data.startTime;
if (endTime > timeRangeEndNS! || startTime < timeRangeStartNS!) {
  // @ts-ignore
  this.timerShaftEL!.documentOnKeyPress(ev, data);
  setTimeout(() => {
    this.timerShaftEL!.documentOnKeyUp(ev);
  }, 1000);
}
}

isMouseInSheet = (ev: MouseEvent): boolean => {
  this.isMousePointInSheet =
    this.traceSheetEL?.getAttribute('mode') !== 'hidden' &&
    ev.offsetX > this.traceSheetEL!.offsetLeft &&
    ev.offsetY > this.traceSheetEL!.offsetTop;
  return this.isMousePointInSheet;
};
// @ts-ignore
favoriteChangeHandler = (row: TraceRow<unknown>): void => {
  info('favoriteChangeHandler', row.frame, row.offsetTop, row.offsetHeight);
};
/**
 * 处理点击checkbox的逻辑
 * @param row 当前点击checkbox的row
 */
// @ts-ignore
selectChangeHandler = (row: TraceRow<unknown>): void => {
  this.setParentCheckStatus(row);
  // @ts-ignore
  const foldSelectParentRowList: Array<TraceRow<unknown>> = this.shadowRoot!.querySelectorAll<TraceRow<unknown>>("trace-row[check-type='1']");
  // @ts-ignore
  const foldSelectRowList: Array<TraceRow<unknown>> = [];
  // @ts-ignore
  foldSelectParentRowList.length && foldSelectParentRowList.forEach((item) => item.childrenList.filter((child: { checkType: string }) => child!.checkType === '2' && foldSelectRowList.push(child)));
  const rows = [
    ...foldSelectRowList,
    // @ts-ignore
    ...this.shadowRoot!.querySelectorAll<TraceRow<unknown>>("trace-row[check-type='2']"),
    ...this.favoriteChartListEL!.getAllSelectCollectRows(),
  ];
  this.isSelectClick = true;
  this.rangeSelect.rangeTraceRow = rows;
  this.rangeSelect.checkRowsName(this.rangeSelect.rangeTraceRow);
  // @ts-ignore
  let changeTraceRows: Array<TraceRow<unknown>> = [];
  if (this.rangeTraceRow!.length < rows.length) {
    // @ts-ignore
    rows!.forEach((currentTraceRow: TraceRow<unknown>) => {
      let changeFilter = this.rangeTraceRow!.filter(
        // @ts-ignore
        (prevTraceRow: TraceRow<unknown>) => prevTraceRow === currentTraceRow
      );
      if (changeFilter.length < 1) {
        changeTraceRows.push(currentTraceRow);
      }
    });
    if (changeTraceRows.length > 0) {
      // @ts-ignore
      changeTraceRows!.forEach((changeTraceRow: TraceRow<unknown>) => {
        let pointEvent = this.createPointEvent(changeTraceRow);
        SpStatisticsHttpUtil.addOrdinaryVisitAction({
          action: 'trace_row', // @ts-ignore
          event: pointEvent,
        });
      });
    }
  }
  this.rangeTraceRow = rows;
  let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
  if (search?.isClearValue) {
    spSystemTraceDocumentOnMouseMoveMouseDown(this, search!);
  }
  this.rangeSelect.selectHandler?.(this.rangeSelect.rangeTraceRow, false);
};
inFavoriteArea: boolean | undefined;
documentOnMouseMove = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseMove(this, ev);
isWASDKeyPress(): boolean | undefined {
  return (
    this.keyPressMap.get('w') || this.keyPressMap.get('a') || this.keyPressMap.get('d') || this.keyPressMap.get('s')
  );
}

documentOnClick = (ev: MouseEvent): void => spSystemTraceDocumentOnClick(this, ev);

clickEmptyArea(): void {
  this.queryAllTraceRow().forEach((it) => {
    it.checkType = '-1';
    it.rangeSelect = false;
  });
  this.rangeSelect.rangeTraceRow = [];
  TraceRow.rangeSelectObject = undefined;
  SpAiAnalysisPage.selectChangeListener(TraceRow.range?.startNS!, TraceRow.range?.endNS!);
  this.selectStructNull();
  this.wakeupListNull();
  this.observerScrollHeightEnable = false;
  this.selectFlag = null;
  this.timerShaftEL?.removeTriangle('inverted');
  //   如果鼠标在SportRuler区域不隐藏tab页
  if(!SportRuler.isMouseInSportRuler) {
  this.traceSheetEL?.setMode('hidden');
}
this.removeLinkLinesByBusinessType('task', 'thread', 'func');
this.removeLinkLinesByBusinessType('task', 'thread', 'distributed');
this.refreshCanvas(true, 'click empty');
JankStruct.delJankLineFlag = true;
}
// @ts-ignore
onClickHandler(clickRowType: string, row ?: TraceRow<unknown>, entry ?: unknown): void {
  spSystemTraceOnClickHandler(this, clickRowType, row as TraceRow<BaseStruct>, entry);
}

makePoint(
  ts: number,
  dur: number,
  translateY: number,
  rowStruct: unknown,
  offsetY: number,
  business: string,
  lineType: LineType,
  isRight: boolean
): PairPoint {
  return {
    x: ns2xByTimeShaft(ts + dur, this.timerShaftEL!),
    y: translateY!,
    offsetY: offsetY,
    ns: ts + dur, // @ts-ignore
    rowEL: rowStruct!,
    isRight: isRight,
    business: business,
    lineType: lineType,
  };
}
// @ts-ignore
drawTaskPollLine(row ?: TraceRow<unknown>): void {
  spSystemTraceDrawTaskPollLine(this, row);
}
drawJankLine(
  endParentRow: unknown,
  selectJankStruct: JankStruct,
  data: unknown,
  isBinderClick: boolean = false
): void {
  spSystemTraceDrawJankLine(this, endParentRow, selectJankStruct, data, isBinderClick);
}

drawDistributedLine(
  sourceData: FuncStruct,
  targetData: FuncStruct,
  selectFuncStruct: FuncStruct,
): void {
  spSystemTraceDrawDistributedLine(this, sourceData, targetData, selectFuncStruct);
}

drawThreadLine(endParentRow: unknown, selectThreadStruct: ThreadStruct | undefined, data: unknown): void {
  spSystemTraceDrawThreadLine(this, endParentRow, selectThreadStruct, data);
}

drawFuncLine(endParentRow: unknown, selectFuncStruct: FuncStruct | undefined, data: unknown, binderTid: Number): void {
  spSystemTraceDrawFuncLine(this, endParentRow, selectFuncStruct, data, binderTid);
}

getStartRow(selectRowId: number | undefined, selectRowPid: number | undefined, collectList: unknown[]): unknown {
  let startRow = this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
    `trace-row[row-id='${selectRowId}'][row-parent-id='${selectRowPid}'][row-type='thread']`
  );
  if (!startRow) {
    for (let collectChart of collectList) {
      // @ts-ignore
      if (collectChart.rowId === selectRowId?.toString() && collectChart.rowParentId === selectRowPid?.toString() && collectChart.rowType === 'thread') {
        // @ts-ignore
        startRow = collectChart;
        break;
      }
    }
  }
  return startRow;
}

calculateStartY(startRow: unknown, pid: number | undefined, tid: number | undefined, selectFuncStruct ?: FuncStruct): [number, unknown, number] {
  // @ts-ignore
  let startY = startRow ? startRow!.translateY! : 0;
  let startRowEl = startRow;
  let startOffSetY = selectFuncStruct ? 20 * (0.5 + Number(selectFuncStruct.depth)) : 20 * 0.5;
  // @ts-ignore
  let startParentRow = startRow ? this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(`trace-row[row-id='${startRow.rowParentId}'][folder]`) : this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
    `trace-row[row-id='${pid}'][folder]`
  );
  if (startParentRow && startParentRow.expansion) {
    let filterRow = startParentRow?.childrenList.filter((item) => item.rowId === tid)[0];
    !filterRow && startParentRow?.childrenList.forEach((i) => {
      if (i.rowId === 'sameThreadProcess') {// @ts-ignore
        filterRow = startParentRow?.childrenList.concat(i.childrenList).filter((item) => item.rowId === String(tid))[0];
        // @ts-ignore
        startParentRow = filterRow!.parentRowEl!;
      }
    });
  }
  const expansionFlag = this.collectionHasThread(startRow);
  if (startParentRow && !startParentRow.expansion && expansionFlag) {
    startY = startParentRow.translateY!;
    startRowEl = startParentRow;
    startOffSetY = selectFuncStruct ? 10 * (0.5 + Number(selectFuncStruct.depth)) : 10 * 0.5;
  }
  return [startY, startRowEl, startOffSetY];
}

calculateEndY(endParentRow: unknown, endRowStruct: unknown, data ?: unknown): [number, unknown, number] {
  // @ts-ignore
  let endY = endRowStruct.translateY!;
  let endRowEl = endRowStruct;
  // @ts-ignore
  let endOffSetY = data ? 20 * (0.5 + Number(data.depth)) : 20 * 0.5;
  const expansionFlag = this.collectionHasThread(endRowStruct);
  // @ts-ignore
  if (!endParentRow.expansion && expansionFlag) {
    // @ts-ignore
    endY = endParentRow.translateY!;
    endRowEl = endParentRow;
    // @ts-ignore
    endOffSetY = data ? 10 * (0.5 + Number(data.depth)) : 10 * 0.5;
  }
  return [endY, endRowEl, endOffSetY];
}

collectionHasThread(threadRow: unknown): boolean {
  const collectList = this.favoriteChartListEL!.getCollectRows();
  for (let item of collectList!) {
    // @ts-ignore
    if (threadRow && item.rowId === threadRow.rowId && item.rowType === threadRow.rowType) {
      return false;
    }
  }
  return true;
}

translateByMouseMove(ev: MouseEvent): void {
  ev.preventDefault();
  let offset = 0;
  if(this.offsetMouse === 0) {
  this.offsetMouse = ev.clientX;
  offset = ev.clientX - this.mouseCurrentPosition;
} else {
  offset = ev.clientX - this.offsetMouse;
}
this.offsetMouse = ev.clientX;
const rangeRuler = this.timerShaftEL?.getRangeRuler()!;
rangeRuler.translate(offset);
}
private subRecordExportListener(): void {
  window.subscribe(window.SmartEvent.UI.ExportRecord, (params) => {
    let range = this.timerShaftEL?.rangeRuler?.range;
    // @ts-ignore
    let searchVal = document.querySelector('body > sp-application').shadowRoot.querySelector('#lit-search').shadowRoot.querySelector('div.root > input')!.value;
    if (range) {
      let expandRows =
        Array.from(this.rowsEL!.querySelectorAll<TraceRow<BaseStruct>>('trace-row[folder][expansion]')) || [];
      let data = JSON.stringify({
        leftNS: range.startNS,
        rightNS: range.endNS,
        G1: this.favoriteChartListEL!.getCollectRowsInfo('1'),
        G2: this.favoriteChartListEL!.getCollectRowsInfo('2'),
        expand: expandRows.map((row) => {
          return {
            type: row.rowType,
            name: row.name,
            id: row.rowId,
          };
        }),
        scrollTop: this.rowsEL!.scrollTop,
        favoriteScrollTop: this.favoriteChartListEL!.scrollTop,
        //下载时存旗帜的信息
        drawFlag: this.timerShaftEL!.sportRuler!.flagList,
        //下载时存M和shiftM的信息
        markFlag: this.timerShaftEL!.sportRuler!.slicesTimeList,
        search: searchVal ? searchVal : ''
      });
      this.downloadRecordFile(data).then(() => { });
    }
  });
}

private async downloadRecordFile(jsonStr: string): Promise < void> {
  let a = document.createElement('a');
  let buffer = await readTraceFileBuffer();
  if(buffer) {
    let str = `MarkPositionJSON->${jsonStr}\n`;
    let mark = new Blob([str]);
    let markBuf = await mark.arrayBuffer();
    a.href = URL.createObjectURL(new Blob([`${markBuf.byteLength}`, mark, buffer])); // @ts-ignore
    a.download = (window as unknown).traceFileName || `${new Date().getTime()}`;
    a.click();
    window.publish(window.SmartEvent.UI.Loading, { loading: false, text: 'Downloading trace file with mark' });
  } else {
    let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
    let progressEL = document.querySelector("body > sp-application")!.shadowRoot!.querySelector<LitProgressBar>("div > div.search-vessel > lit-progress-bar");
    progressEL!.loading = false;
    search!.setPercent('import the trace file again...', -3);
  }
}

private subRecordImportListener(): void {
  //@ts-ignore
  window.subscribe(window.SmartEvent.UI.ImportRecord, (data: string) => {
    let record = JSON.parse(data);
    this.favoriteChartListEL?.removeAllCollectRow();
    let currentGroup = this.currentCollectGroup;
    if (record.G1) {
      this.currentCollectGroup = '1';
      this.restoreRecordCollectRows(record.G1);
    }
    if (record.G2) {
      this.currentCollectGroup = '2';
      this.restoreRecordCollectRows(record.G2);
    }
    this.restoreRecordExpandAndTimeRange(record);
    this.currentCollectGroup = currentGroup;
    if (record.drawFlag !== undefined) {
      this.timerShaftEL!.sportRuler!.flagList = record.drawFlag;//获取下载时存的旗帜信息
      this.selectFlag = this.timerShaftEL!.sportRuler!.flagList.find((it) => it.selected);//绘制被选中旗帜对应的线
    }
    if (record.markFlag !== undefined) {
      this.timerShaftEL!.sportRuler!.slicesTimeList = record.markFlag;//获取下载时存的M键信息
    }
    TraceRow.range!.refresh = true;
    this.refreshCanvas(true);
    this.restoreRecordScrollTop(record.scrollTop, record.favoriteScrollTop);
    // @ts-ignore
    document.querySelector('body > sp-application').shadowRoot.querySelector('#lit-search').shadowRoot.querySelector('div.root > input')!.value = record.search ? record.search : '';
    // @ts-ignore
    document.querySelector('body > sp-application').shadowRoot.querySelector('#lit-search')!.valueChangeHandler!(record.search ? record.search : '');
  });
}

private restoreRecordExpandAndTimeRange(record: unknown): void {
  // @ts-ignore
  if(record.expand) {
  let expandRows = // @ts-ignore
    Array.from(this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row[folder][expansion]')) || [];
  // @ts-ignore
  let expands: Array<unknown> = record.expand;
  //关闭不在记录中的父泳道
  for (let expandRow of expandRows) {
    if (
      !expands.includes(
        (it: unknown) =>
          // @ts-ignore
          it.id === expandRow.rowId && it.name === expandRow.name && it.type === expandRow.rowType
      )
    ) {
      expandRow.expansion = false;
    }
  }
  //展开记录的泳道
  // @ts-ignore
  for (let it of record.expand) {
    // @ts-ignore
    let traceRow = this.rowsEL!.querySelector<TraceRow<unknown>>(
      `trace-row[folder][row-id='${it.id}'][row-type='${it.type}']`
    );
    if (traceRow && !traceRow.expansion) {
      traceRow.expansion = true;
    }
  }
}
// @ts-ignore
if (record.leftNS && record.rightNS) {
  // @ts-ignore
  this.timerShaftEL?.setRangeNS(record.leftNS, record.rightNS);
}
}

private restoreRecordScrollTop(mainScrollTop: number, favoriteScrollTop: number): void {
  if(mainScrollTop && mainScrollTop > 0) {
  this.rowsPaneEL!.scroll({
    top: mainScrollTop,
    left: 0,
    behavior: 'smooth',
  });
}
if (favoriteScrollTop && favoriteScrollTop > 0) {
  this.favoriteChartListEL?.scroll({
    top: favoriteScrollTop,
    left: 0,
    behavior: 'smooth',
  });
}
}

private restoreRecordCollectRows(group: Array<unknown>): void {
  group.forEach((it: unknown) => {
    // @ts-ignore
    let traceRow: TraceRow<unknown> | undefined | null = this.rowsEL!.querySelector<TraceRow<unknown>>( // @ts-ignore
      `trace-row[row-id='${it.id}'][row-type='${it.type}']`
    );
    if (traceRow === null || traceRow === undefined) {
      // @ts-ignore
      if (it.parents.length > 0) {
        // @ts-ignore
        let rootFolder = it.parents[0]; // @ts-ignore
        let folderRow: TraceRow<unknown> | undefined | null = this.rowsEL!.querySelector<TraceRow<unknown>>(
          `trace-row[row-id='${rootFolder.id}'][row-type='${rootFolder.type}']`
        );
        if (folderRow) {
          if (!folderRow!.expansion) {
            folderRow!.expansion = true;
          } // @ts-ignore
          for (let i = 1; i < it.parents.length; i++) {
            folderRow = folderRow!.childrenList.find(
              // @ts-ignore
              (child) => child.rowId === it.parents[i].id && child.rowType === it.parents[i].type
            );
            if (!folderRow!.expansion) {
              folderRow!.expansion = true;
            }
          }
        }
        if (folderRow) {
          // @ts-ignore
          traceRow = folderRow.childrenList.find((child) => child.rowId === it.id && child.rowType === it.type);
        }
      }
    }
    if (traceRow) {
      traceRow.collectEL?.click();
    }
  });
}

private wheelListener(): void {
  document.addEventListener(
    'wheel',
    (e): void => {
      if (e.ctrlKey) {
        if (e.deltaY > 0) {
          e.preventDefault();
          e.stopPropagation();
          let eventS = new KeyboardEvent('keypress', {
            key: 's',
            code: '83',
            keyCode: 83,
          });
          this.timerShaftEL!.documentOnKeyPress(eventS);
          setTimeout(() => this.timerShaftEL!.documentOnKeyUp(eventS), 200);
        }
        if (e.deltaY < 0) {
          e.preventDefault();
          e.stopPropagation();
          let eventW = new KeyboardEvent('keypress', {
            key: 'w',
            code: '87',
            keyCode: 87,
          });
          this.timerShaftEL!.documentOnKeyPress(eventW);
          setTimeout(() => this.timerShaftEL!.documentOnKeyUp(eventW), 200);
        }
      }
    },
    { passive: false }
  );
  window.subscribe(window.SmartEvent.UI.KeyPath, (data): void => {
    this.invisibleRows.forEach((it) => (it.needRefresh = true));
    this.visibleRows.forEach((it) => (it.needRefresh = true)); //@ts-ignore
    if (data.length === 0) {
      // clear
      SpSystemTrace.keyPathList = [];
      this.refreshCanvas(false);
    } else {
      // draw
      //@ts-ignore
      queryCpuKeyPathData(data).then((res): void => {
        SpSystemTrace.keyPathList = res;
        this.refreshCanvas(false);
      });
    }
  });
  window.subscribe(window.SmartEvent.UI.CheckALL, (data): void => {
    //@ts-ignore
    this.getCollectRows((row) => row.rowParentId === data.rowId).forEach((it) => {
      //@ts-ignore
      it.checkType = data.isCheck ? '2' : '0';
    });
  });
  window.subscribe(window.SmartEvent.UI.HoverNull, () => this.hoverStructNull());
  this.subscribeBottomTabVisibleEvent();
}

public scrollH: number = 0;

subscribeBottomTabVisibleEvent(): void {
  //@ts-ignore
  window.subscribe(window.SmartEvent.UI.ShowBottomTab, (data: { show: number; delta: number }): void => {
    let heightTimeOut: unknown = undefined;
    if (heightTimeOut) {
      //@ts-ignore
      clearTimeout(heightTimeOut);
    }
    if (data.show === 1) {
      //显示底部tab
      this.scrollH = this.rowsEL!.scrollHeight;
    } else {
      // 底部 tab 为 最小化 或者隐藏 时候
      if (this.rowsEL!.scrollHeight > this.scrollH) {
        heightTimeOut = setTimeout(() => {
          let litTab = this.traceSheetEL?.shadowRoot?.querySelector<LitTabs>('#tabs');
          if (this.traceSheetEL?.getAttribute('mode') === 'hidden') {
            this.rowsEL!.scrollTop = this.rowsEL!.scrollTop - data.delta;
          }
          if (litTab?.style.height && litTab?.style.height === '38px') {
            this.rowsEL!.scrollTop = this.rowsEL!.scrollTop - data.delta;
          }
        }, 50);
      }
    }
  });
}
// @ts-ignore
favoriteAreaSearchHandler(row: TraceRow<unknown>): void {
  if(this.timerShaftEL!.collecBtn!.hasAttribute('close')) {
  this.timerShaftEL!.collecBtn!.removeAttribute('close');
  this.favoriteChartListEL!.showCollectArea();
}
this.favoriteChartListEL?.expandSearchRowGroup(row);
}

scrollToProcess(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true): void {
  let id = Utils.getDistributedRowId(rowId);
  let parentId = Utils.getDistributedRowId(rowParentId);
  let traceRow = // @ts-ignore
  this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${id}'][row-parent-id='${parentId}'][row-type='${rowType}']`) ||
  this.favoriteChartListEL!.getCollectRow((row) => row.rowId === id && row.rowType === rowType);
  if(traceRow?.collect) {
    this.favoriteChartListEL!.scroll({
      top:
        (traceRow?.offsetTop || 0) -
        this.favoriteChartListEL!.getCanvas()!.offsetHeight +
        (traceRow?.offsetHeight || 0),
      left: 0,
      behavior: smooth ? 'smooth' : undefined,
    });
  } else {
    // @ts-ignore
    let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${parentId}'][folder]`);
    if(row && !row.expansion) {
  row.expansion = true;
}
if (traceRow && traceRow.offsetTop >= 0 && traceRow.offsetHeight >= 0) {
  this.rowsPaneEL!.scroll({
    top: (traceRow?.offsetTop || 0) - this.canvasPanel!.offsetHeight + (traceRow?.offsetHeight || 0),
    left: 0,
    behavior: smooth ? 'smooth' : undefined,
  });
}
  }
}

scrollToDepth(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true, depth: number): void {
  let rootRow = // @ts-ignore
  this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowId}'][row-type='${rowType}']`) ||
  this.favoriteChartListEL!.getCollectRow((row) => row.rowId === rowId && row.rowType === rowType);
  if(rootRow && rootRow!.collect) {
  this.favoriteAreaSearchHandler(rootRow);
  rootRow.expandFunc(rootRow, this);
  if (!this.isInViewport(rootRow)) {
    setTimeout(() => {
      rootRow!.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
} else {
  // @ts-ignore
  let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowParentId}'][folder]`);
  if (row && !row.expansion) {
    row.expansion = true;
  }
  if (rootRow) {
    rootRow.expandFunc(rootRow, this);
  }
  setTimeout(() => {
    rootRow!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 500);
}
}

isInViewport(e: unknown): boolean {
  // @ts-ignore
  const rect = e.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

scrollToFunction(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true): void {
  let id = Utils.getDistributedRowId(rowId);
  let parentId = Utils.getDistributedRowId(rowParentId);
  let condition = `trace-row[row-id='${id}'][row-type='${rowType}'][row-parent-id='${parentId}']`;
  let rootRow = // @ts-ignore
  this.rowsEL!.querySelector<TraceRow<unknown>>(condition) ||
  this.favoriteChartListEL!.getCollectRow((row) => {
    return row.rowId === id && row.rowType === rowType && row.rowParentId === parentId;
  });
  if(rootRow?.collect) {
    this.favoriteAreaSearchHandler(rootRow);
    this.favoriteChartListEL!.scroll({
      top:
        (rootRow?.offsetTop || 0) -
        this.favoriteChartListEL!.getCanvas()!.offsetHeight +
        (rootRow?.offsetHeight || 0),
      left: 0,
      behavior: smooth ? 'smooth' : undefined,
    });
  } else {
    // @ts-ignore
    let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowParentId}'][folder]`);
    if(row && !row.expansion) {
  row.expansion = true;
}
if (rootRow && rootRow.offsetTop >= 0 && rootRow.offsetHeight >= 0) {
  this.rowsPaneEL!.scroll({
    top: (rootRow?.offsetTop || 0) - this.canvasPanel!.offsetHeight + 20,
    left: 0,
    behavior: smooth ? 'smooth' : undefined,
  });
}
  }
}

disconnectedCallback(): void {
  this.timerShaftEL?.removeEventListener('range-change', this.timerShaftELRangeChange);
  this.rowsPaneEL?.removeEventListener('scroll', this.rowsElOnScroll);
  this.favoriteChartListEL?.removeEventListener('scroll', this.favoriteRowsElOnScroll);
  this.removeEventListener('mousemove', this.documentOnMouseMove);
  this.removeEventListener('click', this.documentOnClick);
  this.removeEventListener('mousedown', this.documentOnMouseDown);
  this.removeEventListener('mouseup', this.documentOnMouseUp);
  this.removeEventListener('mouseout', this.documentOnMouseOut);
  this.removeEventListener('pointercancel', this.documentOnPointercancel);
  document.removeEventListener('keypress', this.documentOnKeyPress);
  document.removeEventListener('keydown', this.documentOnKeyDown);
  document.removeEventListener('keyup', this.documentOnKeyUp);
  document.removeEventListener('contextmenu', this.onContextMenuHandler);
  window.unsubscribe(window.SmartEvent.UI.SliceMark, this.sliceMarkEventHandler.bind(this));
}

sliceMarkEventHandler(ev: unknown): void {
  SpSystemTrace.sliceRangeMark = ev; // @ts-ignore
  let startNS = ev.timestamp - (window as unknown).recordStartNS; // @ts-ignore
  let endNS = ev.maxDuration + startNS;
  TraceRow.rangeSelectObject = {
    startX: 0,
    startNS: startNS,
    endNS: endNS,
    endX: 0,
  };
  window.publish(window.SmartEvent.UI.MenuTrace, {});
  window.publish(window.SmartEvent.UI.TimeRange, {
    // @ts-ignore
    startNS: startNS - ev.maxDuration, // @ts-ignore
    endNS: endNS + ev.maxDuration,
  });
  this.queryAllTraceRow().forEach((it) => (it.checkType = '-1'));
  this.rangeSelect.rangeTraceRow = [];
  this.selectStructNull();
  this.wakeupListNull();
  this.traceSheetEL?.setMode('hidden');
  this.removeLinkLinesByBusinessType('janks');
  this.removeLinkLinesByBusinessType('distributed');
  TraceRow.range!.refresh = true;
  this.refreshCanvas(false, 'slice mark event');
}

loadDatabaseUrl(
  url: string,
  progress: Function,
  complete ?: ((res: { status: boolean; msg: string }) => void) | undefined
): void {
  this.observerScrollHeightEnable = false;
  this.init({ url: url }, '', '', progress, false).then((res) => {
    if (complete) {
      // @ts-ignore
      complete(res);
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: true,
      });
    }
  });
}

loadDatabaseArrayBuffer(
  buf: ArrayBuffer,
  thirdPartyWasmConfigUrl: string,
  configUrl: string,
  progress: (name: string, percent: number) => void,
  isDistributed: boolean,
  complete ?: ((res: { status: boolean; msg: string }) => void) | undefined,
  buf2 ?: ArrayBuffer,
  fileName1 ?: string,
  fileName2 ?: string
): void {
  this.observerScrollHeightEnable = false;
  if(isDistributed) {
    this.timerShaftEL?.setAttribute('distributed', '');
  } else {
    this.timerShaftEL?.removeAttribute('distributed');
  }
  this.init({ buf, buf2, fileName1, fileName2 }, thirdPartyWasmConfigUrl, configUrl, progress, isDistributed).then((res) => {
    // @ts-ignore
    this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
    if (complete) {
      // @ts-ignore
      complete(res);
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: true,
      });
    }
  });
}

loadSample = async (ev: File): Promise<void> => {
  this.observerScrollHeightEnable = false;
  await this.initSample(ev); // @ts-ignore
  this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
  window.publish(window.SmartEvent.UI.MouseEventEnable, {
    mouseEnable: true,
  });
};

initSample = async (ev: File): Promise<void> => {
  this.rowsPaneEL!.scroll({
    top: 0,
    left: 0,
  });
  this.chartManager?.initSample(ev).then((): void => {
    this.loadTraceCompleted = true; // @ts-ignore
    this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it): void => {
      this.intersectionObserver?.observe(it);
    });
  });
};

loadGpuCounter = async (ev: File): Promise<void> => {
  this.observerScrollHeightEnable = false;
  await this.initGpuCounter(ev);
  // @ts-ignore
  this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
  window.publish(window.SmartEvent.UI.MouseEventEnable, {
    mouseEnable: true,
  });
};
initGpuCounter = async (ev: File): Promise<void> => {
  this.rowsPaneEL!.scroll({
    top: 0,
    left: 0,
  });
  this.chartManager?.initGpuCounter(ev).then(() => {
    this.loadTraceCompleted = true;
    // @ts-ignore
    this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it) => {
      this.intersectionObserver?.observe(it);
    });
  });
};

// @ts-ignore
queryAllTraceRow<T>(selectors ?: string, filter ?: (row: TraceRow<unknown>) => boolean): TraceRow < unknown > [] {
  return [
    // @ts-ignore
    ...this.rowsEL!.querySelectorAll<TraceRow<unknown>>(selectors ?? 'trace-row'),
    ...this.favoriteChartListEL!.getCollectRows(filter),
  ];
}

search(query: string): void {
  this.queryAllTraceRow().forEach((item): void => {
    if (query === null || query === undefined || query === '') {
      if (
        item.rowType === TraceRow.ROW_TYPE_CPU ||
        item.rowType === TraceRow.ROW_TYPE_CPU_FREQ ||
        item.rowType === TraceRow.ROW_TYPE_NATIVE_MEMORY ||
        item.rowType === TraceRow.ROW_TYPE_FPS ||
        item.rowType === TraceRow.ROW_TYPE_PROCESS ||
        item.rowType === TraceRow.ROW_TYPE_CPU_ABILITY ||
        item.rowType === TraceRow.ROW_TYPE_MEMORY_ABILITY ||
        item.rowType === TraceRow.ROW_TYPE_DISK_ABILITY ||
        item.rowType === TraceRow.ROW_TYPE_NETWORK_ABILITY
      ) {
        item.expansion = false;
        item.rowHidden = false;
      } else {
        item.rowHidden = true;
      }
    } else {
      item.rowHidden = item.name.toLowerCase().indexOf(query.toLowerCase()) < 0;
    }
  });
  this.visibleRows.forEach((it) => (it.rowHidden = false && it.draw(true)));
}

async searchCPU(query: string): Promise < Array < unknown >> {
  let pidArr: Array<number> = [];
  let tidArr: Array<number> = [];
  let processMap = Utils.getInstance().getProcessMap(Utils.currentSelectTrace);
  let threadMap = Utils.getInstance().getThreadMap(Utils.currentSelectTrace);
  for(let key of processMap.keys()) {
  if (`${key}`.includes(query) || (processMap.get(key) || '').includes(query)) {
    pidArr.push(key);
  }
}
for (let key of threadMap.keys()) {
  if (`${key}`.includes(query) || (threadMap.get(key) || '').includes(query)) {
    tidArr.push(key);
  }
}
return await searchCpuDataSender(pidArr, tidArr, Utils.currentSelectTrace);
// @ts-ignore
return str.replace(/[$\^.*+?|()\[\]{}-]/g, (match: string) => specialChars[match as keyof typeof specialChars]); // 类型断言
  };
let regex = new RegExp(strNew(query), 'i');
SpProcessChart.asyncFuncCache.forEach((item: unknown) => {
  // @ts-ignore
  if (regex.test(item.funName)) {
    asyncFuncArr.push(item);
  }
});
return asyncFuncArr;
}

async searchFunction(cpuList: Array<unknown>, asynList: Array<unknown>, query: string): Promise < Array < unknown >> {
  let processList: Array<string> = [];
  let traceRow = // @ts-ignore
  this.shadowRoot!.querySelector<TraceRow<unknown>>('trace-row[scene]') ||
  this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
  if(traceRow) {
    // @ts-ignore
    this.shadowRoot!.querySelectorAll<TraceRow<unknown>>("trace-row[row-type='process'][scene]").forEach(
      (row): void => {
        let rowId = row.rowId;
        if (rowId && rowId.includes('-')) {
          rowId = rowId.split('-')[0];
        }
        processList.push(rowId as string);
      }
    );
    if (query.includes('_')) {
      query = query.replace(/_/g, '\\_');
    }
    if (query.includes('%')) {
      query = query.replace(/%/g, '\\%');
    }
    let list = await querySceneSearchFunc(query, processList);
    cpuList = cpuList.concat(asynList);
    cpuList = cpuList.concat(list); // @ts-ignore
    cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    return cpuList;
  } else {
    let list = await querySearchFunc(query);
    cpuList = cpuList.concat(asynList);
    cpuList = cpuList.concat(list); // @ts-ignore
    cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    return cpuList;
  }
}

searchTargetTraceHandler(): void {
  if(Utils.currentSelectTrace) {
  // @ts-ignore
  let traceFolder1 = this.shadowRoot!.querySelector<TraceRow<unknown>>(`trace-row[row-id='trace-1']`);
  // @ts-ignore
  let traceFolder2 = this.shadowRoot!.querySelector<TraceRow<unknown>>(`trace-row[row-id='trace-2']`);
  if (Utils.currentSelectTrace === '1') {
    if (traceFolder2?.expansion) {
      traceFolder2!.expansion = false;
    }
    traceFolder1!.expansion = true;
  } else {
    if (traceFolder1?.expansion) {
      traceFolder1!.expansion = false;
    }
    traceFolder2!.expansion = true;
  }
}
}

searchSdk(dataList: Array<unknown>, query: string): Array < unknown > {
  let traceRow = // @ts-ignore
  this.shadowRoot!.querySelector<TraceRow<unknown>>('trace-row[scene]') ||
  this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
  let dataAll = "trace-row[row-type^='sdk']";
  if(traceRow) {
    dataAll = "trace-row[row-type^='sdk'][scene]";
  }
  let allTraceRow: unknown = []; // @ts-ignore
  let parentRows = this.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`${dataAll}`); // @ts-ignore
  parentRows.forEach((parentRow: TraceRow<unknown>): void => {
    // @ts-ignore
    allTraceRow.push(parentRow);
    if (parentRow.childrenList && parentRow.childrenList.length > 0) {
      // @ts-ignore
      allTraceRow.push(...parentRow.childrenList);
    }
  }); // @ts-ignore
  allTraceRow.forEach((row: unknown): void => {
    // @ts-ignore
    if (row!.name.indexOf(query) >= 0) {
      let searchSdkBean = new SearchSdkBean();
      searchSdkBean.startTime = TraceRow.range!.startNS;
      searchSdkBean.dur = TraceRow.range!.totalNS; // @ts-ignore
      searchSdkBean.name = row.name; // @ts-ignore
      searchSdkBean.rowId = row.rowId;
      searchSdkBean.type = 'sdk'; // @ts-ignore
      searchSdkBean.rowType = row.rowType; // @ts-ignore
      searchSdkBean.rowParentId = row.rowParentId;
      dataList.push(searchSdkBean);
    }
  });
  return dataList;
}

showStruct(previous: boolean, currentIndex: number, structs: Array<unknown>, retargetIndex ?: number): number {
  let tagIndex = spSystemTraceShowStruct(this, previous, currentIndex, structs, retargetIndex);
  return tagIndex === -1 ? currentIndex : tagIndex;
}

private toTargetDepth = (entry: unknown, funcRowID: string, funcStract: unknown): void => {
  if (entry) {
    this.hoverStructNull();
    this.selectStructNull();
    this.wakeupListNull();
    // @ts-ignore
    FuncStruct.hoverFuncStruct = entry; // @ts-ignore
    FuncStruct.selectFuncStruct = entry;
    this.scrollToDepth(
      `${funcRowID}`, // @ts-ignore
      `${Utils.getDistributedRowId(funcStract.pid)}`,
      'func',
      true, // @ts-ignore
      entry.depth || 0
    );
    // 鼠标左键点击不需要触发点击事件
    if (FuncStruct.funcSelect) {
      this.onClickHandler(TraceRow.ROW_TYPE_FUNC, undefined, entry);
    } // @ts-ignore
    FuncStruct.funcSelect = true;
  }
};

scrollToActFunc(funcStract: unknown, highlight: boolean): void {
  if(!Utils.isBinder(funcStract)) {
  // @ts-ignore
  if (funcStract.dur === -1 || funcStract.dur === null || funcStract.dur === undefined) {
    // @ts-ignore
    funcStract.dur = (TraceRow.range?.totalNS || 0) - (funcStract.startTs || 0); // @ts-ignore
    funcStract.flag = 'Did not end';
  }
}
//@ts-ignore
let funId = funcStract.row_id === null ? `${funcStract.funName}-${funcStract.pid}` : funcStract.row_id;
//@ts-ignore
let funcRowID = (funcStract.cookie === null || funcStract.cookie === undefined) ? `${Utils.getDistributedRowId(funcStract.tid)}` : funId;
let targetRow = this.favoriteChartListEL?.getCollectRow((row) => {
  return row.rowId === funcRowID && row.rowType === 'func';
});
if (targetRow) {
  targetRow.fixedList[0] = funcStract;
  targetRow.highlight = highlight;
  //如果目标泳道图在收藏上面，则跳转至收藏
  this.toTargetDepth(funcStract, funcRowID, funcStract);
  return;
}
let parentRow = this.rowsEL!.querySelector<TraceRow<BaseStruct>>(
  // @ts-ignore
  `trace-row[row-id='${Utils.getDistributedRowId(funcStract.pid)}'][folder]`
);
if (!parentRow) {
  return;
}
// @ts-ignore
let filterRow: TraceRow<unknown> | undefined;
let isSameThreadProcess = false;
parentRow.childrenList.forEach((item) => {
  if (item.rowId === 'sameThreadProcess') {
    filterRow = parentRow.childrenList.concat(item.childrenList).filter((child) => child.rowId === funcRowID && child.rowType === 'func')[0];
    item.childrenList.forEach((i) => {
      if (filterRow!.rowId === i.rowId) {
        isSameThreadProcess = true;
      }
    });
  } else {
    filterRow = parentRow.childrenList.filter((child) => child.rowId === funcRowID && child.rowType === 'func')[0];
  }
});
if (!filterRow) {
  // @ts-ignore
  let funcRow = this.rowsEL?.querySelector<TraceRow<unknown>>(`trace-row[row-id='${funcRowID}'][row-type='func']`);
  if (funcRow) {
    filterRow = funcRow;
  } else {
    return;
  }
}
filterRow.fixedList = [funcStract];
filterRow!.highlight = highlight;
let row = this.rowsEL!.querySelector<TraceRow<BaseStruct>>( // @ts-ignore
  `trace-row[row-id='${Utils.getDistributedRowId(funcStract.pid)}'][folder]`
);
this.currentRow = row;
if (row && !row.expansion) {
  row.expansion = true;
}
if (row!.expansion) {
  if (isSameThreadProcess) {
    this.currentRow = this.rowsEL!.querySelector<TraceRow<BaseStruct>>( // @ts-ignore
      'trace-row[row-id="sameThreadProcess"][folder]');
    this.currentRow!.expansion = true;
  }
}
const completeEntry = (): void => {
  this.toTargetDepth(filterRow!.fixedList[0], funcRowID, funcStract);
};
if (filterRow!.isComplete) {
  completeEntry();
} else {
  // @ts-ignore
  this.scrollToProcess(`${funcStract.tid}`, `${funcStract.pid}`, 'thread', false); // @ts-ignore
  this.scrollToFunction(`${funcStract.tid}`, `${funcStract.pid}`, 'func', true);
  // filterRow!.onComplete = completeEntry;
  completeEntry();
}
}

closeAllExpandRows(pid: string): void {
  let expandRows = this.rowsEL?.querySelectorAll<TraceRow<ProcessStruct>>("trace-row[row-type='process'][expansion]");
  expandRows?.forEach((row): void => {
  if (row.rowId !== pid) {
    row.expansion = false;
  }
});
}

moveRangeToLeft(startTime: number, dur: number): void {
  let startNS = this.timerShaftEL?.getRange()?.startNS || 0;
  let endNS = this.timerShaftEL?.getRange()?.endNS || 0;
  let harfDur = Math.trunc(endNS - startNS - dur / 2);
  let leftNs = startTime;
  let rightNs = startTime + dur + harfDur;
  if(startTime - harfDur < 0) {
  leftNs = 0;
  rightNs += harfDur - startTime;
}
this.timerShaftEL?.setRangeNS(leftNs, rightNs);
TraceRow.range!.refresh = true;
this.refreshCanvas(true, 'move range to left');
}

moveRangeToCenter(startTime: number, dur: number): void {
  let startNS = this.timerShaftEL?.getRange()?.startNS || 0;
  let endNS = this.timerShaftEL?.getRange()?.endNS || 0;
  let harfDur = Math.trunc((endNS - startNS) / 2 - dur / 2);
  let leftNs = startTime - harfDur;
  let rightNs = startTime + dur + harfDur;
  if(startTime - harfDur < 0) {
  leftNs = 0;
  rightNs += harfDur - startTime;
}
this.timerShaftEL?.setRangeNS(leftNs, rightNs);
TraceRow.range!.refresh = true;
this.refreshCanvas(true, 'move range to center');
}

rechargeCpuData(it: CpuStruct, next: CpuStruct | undefined): void {
  let p = Utils.getInstance().getProcessMap().get(it.processId!);
  let t = Utils.getInstance().getThreadMap().get(it.tid!);
  let slice = Utils.getInstance().getSchedSliceMap().get(`${it.id}-${it.startTime}`);
  if(slice) {
    it.end_state = slice.endState;
    it.priority = slice.priority;
  }
  it.processName = p;
  it.processCmdLine = p;
  it.name = t;
  if(next) {
    if (it.startTime! + it.dur! > next!.startTime! || it.dur === -1 || it.dur === null || it.dur === undefined) {
      it.dur = next!.startTime! - it.startTime!;
      it.nofinish = true;
    }
  } else {
    if(it.dur === -1 || it.dur === null || it.dur === undefined) {
  it.dur = TraceRow.range!.endNS - it.startTime!;
  it.nofinish = true;
}
  }
}

reset(progress: Function | undefined | null): void {
  this.visibleRows.length = 0;
  this.tipEL!.style.display = 'none';
  this.canvasPanelCtx?.clearRect(0, 0, this.canvasPanel!.clientWidth, this.canvasPanel!.offsetHeight);
  this.loadTraceCompleted = false;
  this.collectRows = [];
  this.visibleRows = [];
  TraceRowConfig.allTraceRowList.forEach((it) => {
    it.clearMemory();
  });
  TraceRowConfig.allTraceRowList = [];
  this.favoriteChartListEL!.reset();
  if(this.rowsEL) {
  // @ts-ignore
  this.rowsEL.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((row) => {
    row.clearMemory();
    this.rowsEL!.removeChild(row);
  });
}
this.traceSheetEL?.clearMemory();
this.spacerEL!.style.height = '0px';
this.rangeSelect.rangeTraceRow = [];
SpSystemTrace.SDK_CONFIG_MAP = undefined;
SpSystemTrace.sliceRangeMark = undefined;
this.timerShaftEL?.displayCollect(false);
this.timerShaftEL!.collecBtn!.removeAttribute('close');
CpuStruct.wakeupBean = undefined;
this.selectStructNull();
this.hoverStructNull();
this.wakeupListNull();
this.traceSheetEL?.setMode('hidden');
progress?.('rest timershaft', 8);
this.timerShaftEL?.reset();
progress?.('clear cache', 10);
HeapDataInterface.getInstance().clearData();
procedurePool.clearCache();
Utils.clearData();
InitAnalysis.getInstance().isInitAnalysis = true;
InitAnalysis.getInstance().isInitGMAnalysis = true;
InitAnalysis.getInstance().isInitOSAnalysis = true;
procedurePool.submitWithName('logic0', 'clear', {}, undefined, (res: unknown) => { });
if (threadPool) {
  threadPool.submitProto(QueryEnum.ClearMemoryCache, {}, (res: unknown, len: number): void => { });
}
if (threadPool2) {
  threadPool2.submitProto(QueryEnum.ClearMemoryCache, {}, (res: unknown, len: number): void => { });
}
this.times.clear();
resetVSync();
SpSystemTrace.keyPathList = [];
Utils.isTransformed = false;
}

init = async (
  param: { buf?: ArrayBuffer; url?: string; buf2?: ArrayBuffer; fileName1?: string; fileName2?: string },
  wasmConfigUri: string,
  configUrl: string,
  progress: Function,
  isDistributed: boolean
): Promise<unknown> => {
  return spSystemTraceInit(this, param, wasmConfigUri, configUrl, progress, isDistributed);
};
// @ts-ignore
extracted(it: TraceRow<unknown>) {
  return (): void => {
    if (it.hasAttribute('expansion')) {
      it.childrenList.forEach((child): void => {
        if (child.hasAttribute('scene') && !child.collect) {
          child.rowHidden = false;
        }
        if (child.folder) {
          child.addEventListener('expansion-change', this.extracted(child));
        }
        this.intersectionObserver?.observe(child);
      });
    } else {
      //@ts-ignore
      let parentElTopHeight = it.hasParentRowEl ? //@ts-ignore
        (it.parentRowEl.getBoundingClientRect().top + it.parentRowEl.clientHeight) : this.rowsPaneEL!.getBoundingClientRect().top;
      it.childrenList.forEach((child): void => {
        if (child.hasAttribute('scene') && !child.collect) {
          child.rowHidden = true;
          this.intersectionObserver?.unobserve(child);
        }
        if (child.folder) {
          child.removeEventListener('expansion-change', this.extracted(child));
        }
      });
      if (it.getBoundingClientRect().top < 0) {
        this.rowsPaneEL!.scrollTop =
          this.rowsPaneEL!.scrollTop -
          (it.getBoundingClientRect().top * -1 + parentElTopHeight);
      } else if (it.getBoundingClientRect().top > 0) {
        this.rowsPaneEL!.scrollTop =
          parentElTopHeight <
            it.getBoundingClientRect().top ?
            this.rowsPaneEL!.scrollTop :
            this.rowsPaneEL!.scrollTop -
            (parentElTopHeight - it.getBoundingClientRect().top);
      } else {
        this.rowsPaneEL!.scrollTop =
          this.rowsPaneEL!.scrollTop -
          parentElTopHeight;
      }
      this.linkNodes.map((value): void => {
        if ('task' === value[0].business && value[0].rowEL.parentRowEl?.rowId === it.rowId) {
          value[0].hidden = true;
          value[1].hidden = true;
          this.clickEmptyArea();
        }
      });
    }
    this.resetDistributedLine();
    if (!this.collapseAll) {
      this.refreshCanvas(false, 'extracted');
    }
  };
}

resetDistributedLine(): void {
  if(FuncStruct.selectLineFuncStruct.length > 5) {
  return;
}
if (FuncStruct.selectFuncStruct) {
  let dataList = FuncStruct.selectLineFuncStruct;
  this.removeLinkLinesByBusinessType('distributed');
  FuncStruct.selectLineFuncStruct = dataList;
  for (let index = 0; index < FuncStruct.selectLineFuncStruct.length; index++) {
    let sourceData = FuncStruct.selectLineFuncStruct[index];
    if (index !== FuncStruct.selectLineFuncStruct.length - 1) {
      let targetData = FuncStruct.selectLineFuncStruct[index + 1];
      this.drawDistributedLine(sourceData, targetData, FuncStruct.selectFuncStruct!);
    }
  }
  this.refreshCanvas(true);
}
}