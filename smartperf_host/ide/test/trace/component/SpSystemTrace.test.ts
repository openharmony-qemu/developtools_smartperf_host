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

jest.mock('../../../src/trace/component/trace/TimerShaftElement', () => {
  return {
    sportRuler: {
      frame: {
        contains: {}
      }
    },
    canvas: {
      offsetLeft: 0
    },
    isScaling: true,
    displayCollect: ()=>{},
    removeEventListener: ()=>{},
    drawTriangle: ()=>{},
    setSlicesMark: ()=>{},
    removeTriangle: ()=>{},
  };
});
jest.mock('../../../src/trace/component/trace/base/TraceSheet', () => {
  return {
    clearMemory: () => {}
  };
});
import { SpSystemTrace } from '../../../src/trace/component/SpSystemTrace';
import { TraceRow } from '../../../src/trace/component/trace/base/TraceRow';
import { RangeSelect } from '../../../src/trace/component/trace/base/RangeSelect';

jest.mock('../../../src/base-ui/table/lit-table', () => {
  return {
    recycleDataSource: () => {
    },
  };
});
jest.mock('../../../src/js-heap/logic/HeapLoader', () => {
  return {};
});
jest.mock('../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../src/trace/database/SqlLite');

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpSystemTrace Test', () => {
  let spSystemTrace = new SpSystemTrace<any>({
    canvasNumber: 1,
    alpha: true,
    contextId: '2d',
    isOffScreen: true,
  });
  const offset = 1;
  const callback = true;
  const rowId = '';
  const rowParentId = '';
  const rowType = '';
  let smooth = true;
  spSystemTrace.searchCPU = jest.fn();
  spSystemTrace.initElements = jest.fn(() => true);

  it('SpSystemTraceTest01', function () {
    expect(spSystemTrace.getScrollWidth()).toBe(0);
  });

  it('SpSystemTraceTest02', function () {
    let resultLength = spSystemTrace.getRowsContentHeight();
    expect(resultLength).toBe(0);
  });

  it('SpSystemTraceTest03', function () {
    expect(spSystemTrace.timerShaftELRangeChange('')).toBeUndefined();
  });

  it('SpSystemTraceTest04', function () {
    expect(spSystemTrace.rowsElOnScroll({
      target: {
        scrollTop: {}
      }
    })).toBeUndefined();
  });

  it('SpSystemTraceTest05', function () {
    expect(spSystemTrace.documentOnMouseDown('MouseDown')).toBeUndefined();
  });

  it('SpSystemTraceTest06', function () {
    spSystemTrace.documentOnMouseUp = jest.fn(() => true);
    expect(spSystemTrace.documentOnMouseUp('MouseUp')).toBeTruthy();
  });

  it('SpSystemTraceTest07', function () {
    expect(spSystemTrace.documentOnMouseMove('MouseMove')).toBeUndefined();
  });

  it('SpSystemTraceTest08', function () {
    expect(spSystemTrace.hoverStructNull()).not.toBeUndefined();
  });

  it('SpSystemTraceTest09', function () {
    expect(spSystemTrace.selectStructNull()).not.toBeUndefined();
  });

  it('SpSystemTraceTest11', function () {
    expect(spSystemTrace.connectedCallback()).toBeUndefined();
  });

  it('SpSystemTraceTest12', function () {
    expect(spSystemTrace.disconnectedCallback()).toBeUndefined();
  });

  it('SpSystemTraceTest14', function () {
    expect(spSystemTrace.loadDatabaseUrl).toBeTruthy();
  });

  it('SpSystemTraceTest15', function () {
    spSystemTrace.rowsPaneEL = jest.fn(() => true);
    spSystemTrace.rowsPaneEL.scrollTo = jest.fn(() => offset);
    spSystemTrace.rowsPaneEL.removeEventListener = jest.fn(() => true);
    spSystemTrace.rowsPaneEL.addEventListener = jest.fn(() => true);
    let funcStract = {
      dur: 152,
      totalNS: 4252,
      startTs: 522,
      flag: '',
      funName: 'binder async'
    }
    expect(spSystemTrace.scrollToActFunc(funcStract, true)).toBeUndefined();
  });

  it('SpSystemTraceTest16', function () {
    expect(spSystemTrace.onClickHandler()).toBeUndefined();
  });

  it('SpSystemTraceTest17', function () {
    expect(spSystemTrace.search()).toBeUndefined();
  });

  it('SpSystemTraceTest22', function () {
    spSystemTrace.traceSheetEL!.clearMemory = jest.fn(() => true);
    spSystemTrace.traceSheetEL.setMode = jest.fn(() => true);
    spSystemTrace.rangeSelect = new RangeSelect(spSystemTrace);
    spSystemTrace.timerShaftEL!.displayCollect = jest.fn(() => true);
    spSystemTrace.timerShaftEL!.collecBtn = jest.fn(() => {});
    spSystemTrace.timerShaftEL!.reset = jest.fn(() => {});
    spSystemTrace.timerShaftEL!.collecBtn.removeAttribute = jest.fn(() => {});
    expect(spSystemTrace.reset(()=>{})).toBeUndefined();
  });
  it('SpSystemTraceTest23', function () {
    let structs = [
      {
        length: 1,
        startTime: 1,
      },
    ];
    let previous = 1;
    let currentIndex = 0;
    TraceRow.range = jest.fn(() => undefined);
    TraceRow.range.startNS = jest.fn(() => 1);
    spSystemTrace.timerShaftEL.drawTriangle = jest.fn(()=>{});
    expect(spSystemTrace.showStruct(previous, currentIndex, structs)).not.toBeUndefined();
  });
  it('SpSystemTraceTest24', function () {
    TraceRow.range = jest.fn(() => undefined);
    TraceRow.range.startNS = jest.fn(() => 1);
    expect(spSystemTrace.closeAllExpandRows()).toBeUndefined();
  });
  it('SpSystemTraceTest25', function () {
    spSystemTrace.rowsPaneEL = jest.fn(() => true);
    spSystemTrace.rowsPaneEL.scroll = jest.fn(() => true);
    expect(spSystemTrace.scrollToProcess()).toBeUndefined();
  });
  it('SpSystemTraceTest26', function () {
    spSystemTrace.rowsPaneEL = jest.fn(() => true);
    spSystemTrace.rowsPaneEL.scroll = jest.fn(() => true);
    let anomalyTraceRow = TraceRow.skeleton();
    anomalyTraceRow.collect = true;
    spSystemTrace.appendChild(anomalyTraceRow);
    expect(spSystemTrace.scrollToDepth()).toBeUndefined();
  });
  it('SpSystemTraceTest28', function () {
    expect(spSystemTrace.refreshFavoriteCanvas()).toBeUndefined();
  });
  it('SpSystemTraceTest29', function () {
    expect(spSystemTrace.expansionAllParentRow({id: 1})).toBeUndefined();
  });
  it('SpSystemTraceTest30', function () {
    let it = {
      name: '',
      rowType: '',
      rowId: 'FileSystemLogicalWrite',
      rowParentId: 'frameTime',
    };
    expect(spSystemTrace.createPointEvent(it)).toBe('');
  });
  it('SpSystemTraceTest31', function () {
    let a = {
      rowEL: {
        translateY: 1,
        offsetTop: 0,
      },
      y: 1,
      offsetY: 0,
    };
    let b = {
      rowEL: {
        translateY: 1,
        offsetTop: 0,
      },
      y: 1,
      offsetY: 0,
    };
    expect(spSystemTrace.addPointPair(a, b)).toBeUndefined();
  });
  it('SpSystemTraceTest32', function () {
    spSystemTrace.timerShaftEL.setSlicesMark = jest.fn(()=>{})
    expect(spSystemTrace.setSLiceMark()).toBeUndefined();
  });
  it('SpSystemTraceTest33', function () {
    spSystemTrace.rangeSelect = new RangeSelect(spSystemTrace);
    spSystemTrace.timerShaftEL.removeTriangle = jest.fn(()=>{})
    expect(spSystemTrace.clickEmptyArea()).toBeUndefined();
  });
  it('SpSystemTraceTest34', function () {
    expect(spSystemTrace.isWASDKeyPress()).toBeFalsy();
  });
  it('SpSystemTraceTest35', function () {
    let selectJankStruct = {
      frame_type: 'frameTime',
      type: '',
      pid: 1,
      ts: 1,
      dur: 0,
      depth: 1,
    };
    let data = {
      frame_type: 'frameTime',
      type: '',
      pid: 1,
      name: '',
      children: {
        frame_type: 'frameTime',
        pid: 1,
        length: 1,
      },
    };

    expect(spSystemTrace.drawJankLine(null, selectJankStruct, data)).toBeUndefined();
  });
  it('SpSystemTraceTest36', function () {
    let ev = {
      maxDuration: 1,
      timestamp: '',
    };
    spSystemTrace.rangeSelect = new RangeSelect(spSystemTrace);
    spSystemTrace.traceSheetEL.setMode = jest.fn(() => true);
    expect(spSystemTrace.sliceMarkEventHandler(ev)).toBeUndefined();
  });
  it('SpSystemTraceTest37', function () {
    expect(spSystemTrace.searchSdk([''], '')).toStrictEqual(['']);
  });
  it('SpSystemTraceTest38', function () {
    let funcStract = {
      tid: 1,
      pid: 0,
      cookie: '',
      funName: '',
      type: '',
      startTime: 2,
      depth: 1,
    };
    expect(spSystemTrace.scrollToActFunc(funcStract, true)).toBeUndefined();
  });
});
