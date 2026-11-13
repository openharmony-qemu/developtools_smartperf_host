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

import { FrameChart } from '../../../../src/trace/component/chart/FrameChart';
import { ChartMode } from '../../../../src/trace/bean/FrameChartStruct';

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});

jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});


const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

describe('FrameChart Test', () => {
  let node = [{ children: '' }, { children: { length: 0 } }];
  document.body.innerHTML = '<sp-application><tab-framechart id="ccc"></tab-framechart></sp-application>';
  let frameChart = new FrameChart();
  frameChart.data = [{
    isDraw : false,
    depth:  0,
    symbol:  '',
    lib: '',
    size:  0,
    count: 0,
    dur:  0,
    searchSize:  0,
    searchCount: 0,
    searchDur: 0,
    drawSize:  0,
    drawCount: 0,
    drawDur:  0,
    parent:  undefined,
    children:  [],
    percent:  0,
    addr: '',
    isSearch: false,
    isChartSelect: false,
    isChartSelectParent: false
  }]
  it('FrameChartTest01', function () {
    frameChart.tabPaneScrollTop = false;
    expect(frameChart.tabPaneScrollTop).toBeFalsy();
  });

  it('FrameChartTest02', function () {
    frameChart.createRootNode();
    let index = frameChart.scale(2);
    expect(index).toBe(undefined);
  });

  it('FrameChartTest03', function () {
    frameChart.translationDraw = jest.fn(() => true);
    expect(frameChart.translation()).toBeUndefined();
  });

  it('FrameChartTest04', function () {
    frameChart.translationDraw = jest.fn(() => true);
    expect(frameChart.translation(-1)).toBeUndefined();
  });

  it('FrameChartTest05', function () {
    frameChart.selectTotalCount = false;
    expect(frameChart.selectTotalCount).toBeFalsy();
  });

  it('FrameChartTest06', function () {
    frameChart._mode = 1;
    frameChart.drawScale = jest.fn(() => true);
    expect(frameChart.calculateChartData()).not.toBeUndefined();
  });

  it('FrameChartTest07', function () {
    expect(frameChart.updateCanvas(true, 23)).toBeUndefined();
  });

  it('FrameChartTest08', function () {
    frameChart.translationDraw = jest.fn(() => true);
    expect(frameChart.translationByScale()).toBe(undefined);
  });

  it('FrameChartTest09', function () {
    frameChart.translationDraw = jest.fn(() => true);
    frameChart.canvasX = 4;
    expect(frameChart.translationByScale()).toBe(undefined);
  });

  it('FrameChartTest10', function () {
    frameChart.translationDraw = jest.fn(() => true);
    expect(frameChart.translationByScale(1)).toBe(undefined);
  });

  it('FrameChartTest11', function () {
    frameChart.calculateChartData = jest.fn(() => true);
    frameChart.xPoint = 1;
    frameChart.createRootNode();
    expect(frameChart.translationDraw()).toBeTruthy();
  });

  it('FrameChartTest12', function () {
    expect(frameChart.onMouseClick({ button: 0 })).toBeUndefined();
  });

  it('FrameChartTest13', function () {
    expect(frameChart.drawFrameChart(node)).toBeUndefined();
  });


  it('FrameChartTest14', function () {
    expect(frameChart.onMouseClick({ button: 2 })).toBeUndefined();
  });

  it('FrameChartTest15 ', function () {
    expect(frameChart.mode).toBeUndefined();
  });

  it('FrameChartTest16', function () {
    expect(frameChart.data).toBeFalsy();
  });

  it('FrameChartTest18', function () {
    expect(frameChart.addChartClickListener(() => {})).toBeUndefined();
  });

  it('FrameChartTest19', function () {
    expect(frameChart.removeChartClickListener(() => {})).toBeUndefined();
  });

  it('FrameChartTest20', function () {
    expect(frameChart.resetTrans()).toBeUndefined();
  });

  it('FrameChartTest21', function () {
    expect(frameChart.onMouseClick({ button: 2 })).toBeUndefined();
  });

  it('FrameChartTest22', function () {
    frameChart._mode = ChartMode.Byte;
    frameChart.currentData = [
      {
        drawSize: 10,
        size: 20,
        frame: {
          x: 10,
          y: 40,
          width: 9,
          height: 3,
        },
      },
    ];
    expect(frameChart.calculateChartData()).not.toBeUndefined();
  });
  it('FrameChartTest23', function () {
    frameChart._mode = ChartMode.Count;
    frameChart.currentData = [
      {
        drawSize: 23,
        size: 12,
        frame: {
          x: 29,
          y: 40,
          width: 56,
          height: 3,
        },
      },
    ];
    expect(frameChart.calculateChartData()).not.toBeUndefined();
  });
  it('FrameChartTest24', function () {
    frameChart._mode = ChartMode.Duration;
    frameChart.currentData = [
      {
        drawSize: 78,
        size: 12,
        frame: {
          x: 29,
          y: 50,
          width: 56,
          height: 12,
        },
      },
    ];
    expect(frameChart.calculateChartData()).not.toBeUndefined();
  });
  it('FrameChartTest25 ', function () {
    let node = [
      {
        parent: [
          {
            drawCount: 23,
            drawDur: 12,
            drawSize: 45,
          },
        ],
      },
    ];
    let module = [{
      drawCount: 0,
      drawDur: 78,
      drawSize: 9,
    }]
    expect(frameChart.setParentDisplayInfo(node, module)).toBeUndefined();
  });

  it('FrameChartTest26 ', function () {
    let module = [{
      drawCount: 0,
      drawDur: 78,
      drawSize: 9,
    }];
    let nodeData = {
      children: [{
        isChartSelect: false,
        drawCount: 0,
        drawEventCount: 0,
        drawSize: 0,
        drawDur: 0,
        children: []
      },{
        isChartSelect: true,
        drawCount: 0,
        drawEventCount: 0,
        drawSize: 0,
        drawDur: 0,
        children: []
      }]
    }
    frameChart.selectInit();
    frameChart.setRootValue();
    frameChart.clearOtherDisplayInfo(nodeData);
    frameChart.setParentDisplayInfo(nodeData, module, true);
    frameChart.setChildrenDisplayInfo(nodeData);
    frameChart.searchDataByCoord([nodeData], 20, 10);
    frameChart.showTip();
    frameChart.setSelectStatusRecursive(nodeData, true);
    frameChart.clickRedraw();
    frameChart.scale(0);
    frameChart.translationDraw();
    frameChart.nodeInCanvas(nodeData);
    frameChart.nodeInCanvas({
      frame: {
        x: 0,
        y: 2,
        width: 20,
        height: 30
      }
    });
    frameChart.onMouseClick({
      button: 0
    });
    frameChart.updateTipContent();
    frameChart.getCurrentPercent(nodeData, true);
    frameChart.getCurrentPercentOfThread(nodeData);
    frameChart.resizeChange();
    expect(frameChart.getCurrentPercentOfProcess(nodeData)).toBe('');
  });
});
