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

import { LitChartScatter } from '../../../../src/base-ui/chart/scatter/LitChartScatter';
import { LitChartScatterConfig } from '../../../../src/base-ui/chart/scatter/LitChartScatterConfig';

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('LitChartScatter Test', () => {
  let litChartScatter = new LitChartScatter();
  litChartScatter.canvas = litChartScatter.shadowRoot!.querySelector<HTMLCanvasElement>('#canvas');
  litChartScatter.ctx = litChartScatter.canvas!.getContext('2d', { alpha: true });
  litChartScatter.connectedCallback();
  litChartScatter.options = {
    yAxisLabel: [20000, 40000, 60000, 80000, 100000],
    xAxisLabel: [20000, 40000, 60000, 80000, 100000, 120000],
    axisLabel: ['负载', '算力供给'],
    drawload: true,
    load: [100000, 1000],
    colorPool: () => ['#2f72f8', '#ffab67', '#a285d2'],
    colorPoolText: () => ['Total', 'CycleA', 'CycleB'],
    paintingData: [
      {
        x: 111.11939333333333,
        y: 173.71615585811537,
        r: 6,
        c: [16655.818, 2983.844141884629, 1, 5.582, 5.361],
        color: '#2f72f8',
      },
      {
        x: 77.52432666666667,
        y: 174.7453794947994,
        r: 6,
        c: [6577.298, 1954.6205052005942, 2, 3.365, 2.585],
        color: '#2f72f8',
      },
      {
        x: 100.43357333333333,
        y: 174.20508773882395,
        r: 6,
        c: [13450.072, 2494.912261176034, 3, 5.391, 5.287],
        color: '#2f72f8',
      },
    ],
    hoverData: {},
    globalGradient: {},
    data: [
      [
        [16655.818, 2983.844141884629, 1, 5.582, 5.361],
        [6577.298, 1954.6205052005942, 2, 3.365, 2.585],
        [13450.072, 2494.912261176034, 3, 5.391, 5.287],
      ],
      [],
      [],
    ],
    title: 'render_service 1155',
    tip: (data) => {
      return `
      <div>
          <span>Cycle: ${data.c[2]};</span></br>
          <span>Comsumption: ${data.c[0]};</span></br>
          <span>Cycle_dur: ${data.c[3]} ms;</span></br>
          <span>Running_dur: ${data.c[4]} ms;</span></br>
      </div>
      `;
    },
  };
  let options = litChartScatter.options!;
  it('LitChartScatter 01', function () {
    expect(litChartScatter.init()).toBeUndefined();
  });

  it('LitChartScatter 02', function () {
    const drawBackgroundMock = jest.fn();
    litChartScatter.drawBackground = drawBackgroundMock;
    const drawScatterChartMock = jest.fn();
    litChartScatter.drawScatterChart = drawScatterChartMock;
    const setOffScreenMock = jest.fn();
    litChartScatter.setOffScreen = setOffScreenMock;
    const clearRectMock = jest.fn();
    litChartScatter.ctx!.clearRect = clearRectMock;
    litChartScatter.init();
    expect(drawBackgroundMock).toHaveBeenCalled();
    expect(drawScatterChartMock).toHaveBeenCalled();
    expect(setOffScreenMock).toHaveBeenCalled();
    expect(clearRectMock).toHaveBeenCalled();
  });

  it('LitChartScatter 03', function () {
    expect(litChartScatter.setOffScreen()).toBeUndefined();
    litChartScatter.setOffScreen();
    expect(litChartScatter.canvas2?.height).toEqual(litChartScatter.clientHeight);
    expect(litChartScatter.canvas2?.width).toEqual(litChartScatter.clientWidth);
  });

  it('LitChartScatter 04', function () {
    let hoverPoint = {
      x: 163.42456666666666,
      y: 160.69372623574142,
      r: 6,
      c: [3234.737, 559.0627376425856, 95, 5.786, 3.916],
      color: '#2f72f8',
    };
    expect(litChartScatter.drawBackground()).toBeUndefined();
    expect(litChartScatter.drawScatterChart(litChartScatter.options!)).toBeUndefined();
    expect(litChartScatter.drawAxis(litChartScatter.options!)).toBeUndefined();
    expect(litChartScatter.drawYLabels(litChartScatter.options!)).toBeUndefined();
    expect(litChartScatter.drawXLabels(litChartScatter.options!)).toBeUndefined();
    expect(litChartScatter.drawData(litChartScatter.options!)).toBeUndefined();
    expect(litChartScatter.drawCycle(2, 10, 1, 1, '#000000')).toBeUndefined();
    expect(litChartScatter.drawLoadLine(litChartScatter.options!.load)).toBeUndefined();
    expect(litChartScatter.drawBalanceLine(litChartScatter.options!.load)).toBeUndefined();
    expect(litChartScatter.resetHoverWithOffScreen()).toBeUndefined();
    expect(litChartScatter.paintHover()).toBeUndefined();
    expect(litChartScatter.connectedCallback()).toBeUndefined();
    expect(litChartScatter.initElements()).toBeUndefined();
  });

  it('LitChartScatter 05', function () {
    litChartScatter.drawBackground();
    expect(litChartScatter.ctx?.save).toHaveBeenCalled();
    expect(litChartScatter.ctx?.fillRect).toHaveBeenCalled();
    expect(litChartScatter.ctx?.restore).toHaveBeenCalled();
  });

  it('LitChartScatter 06', function () {
    litChartScatter.drawAxis(litChartScatter.options!);
    let ctx = litChartScatter.ctx!;
    expect(ctx.font).toEqual('10px KATTI');
    expect(ctx.fillStyle).toEqual('#000000');
    expect(ctx.strokeStyle).toEqual('#000000');
  });

  it('LitChartScatter 07', function () {
    litChartScatter.drawYLabels(litChartScatter.options!);
    let ctx = litChartScatter.ctx!;
    expect(ctx.font).toEqual('12px KATTI');
    expect(ctx.fillStyle).toEqual('#000000');
    expect(ctx.strokeStyle).toEqual('#000000');
  });

  it('LitChartScatter 08', function () {
    litChartScatter.drawXLabels(litChartScatter.options!);
    let ctx = litChartScatter.ctx!;
    expect(ctx.fillStyle).toEqual('#000000');
    expect(ctx.strokeStyle).toEqual('#000000');
    expect(ctx.beginPath).toHaveBeenCalled();
  });

  it('LitChartScatter 9', function () {
    const mockInit = jest.fn();
    litChartScatter.init = mockInit;
    litChartScatter.config = options;
    expect(mockInit).toHaveBeenCalled();
    expect(litChartScatter.options).toEqual(options);
  });
});
