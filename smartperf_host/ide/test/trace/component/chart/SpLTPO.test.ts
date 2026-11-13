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

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { SpLtpoChart } from '../../../../src/trace/component/chart/SpLTPO';
import { LtpoStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerLTPO';
import { Rect } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

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
const sqlit = require('../../../../src/trace/database/sql/Ltpo.sql');
jest.mock('../../../../src/trace/database/sql/Ltpo.sql');

describe('SpLtpoChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let ltPoChart = new SpLtpoChart(htmlElement);
  let fanceNameList = sqlit.queryFanceNameList;
  fanceNameList.mockResolvedValue([
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence',
    },
  ]);

  let fpsNameList = sqlit.queryFpsNameList;
  fpsNameList.mockResolvedValue([
    {
      ts: 1224,
      dur: 2445,
      name: 'Layers,ra:te',
    },
  ]);

  let realFpsList = sqlit.queryRealFpsList;
  realFpsList.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'CommitAndReleaseLayers SetScreenRefreshRate',
    },
  ]);
  let presentInfo = sqlit.queryPresentInfo;
  presentInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence',
    },
  ]);
  let rSNowTimeListInfo = sqlit.queryRSNowTimeList;
  rSNowTimeListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf',
    },
  ]);
  let signaledListInfo = sqlit.querySignaledList;
  signaledListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf',
    },
  ]);
  let skipDataListInfo = sqlit.querySkipDataList;
  skipDataListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf',
    },
  ]);
  SpLtpoChart.fanceNameList = [
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence signaled',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];
  SpLtpoChart.fpsnameList = [
    {
      ts: 122,
      dur: 245,
      name: 'Present = Fence = signaled',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      ts: 122,
      dur: 245,
      name: 'Present  fps: 10 Fence , fps: 20',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];
  SpLtpoChart.realFpsList = [
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence signaled',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];
  SpLtpoChart.rsNowTimeList = [
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence fps: 10',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      ts: 122,
      dur: 245,
      name: 'Present Fence',
      presentId: 10,
      fanceId: 10,
      fps: 10,
      startTs: 10,
      nextStartTs: '20',
      nextDur: 10,
      value: 10,
      pid: 10,
      itid: 10,
      startTime: 10,
      signaled: 10,
      nowTime: 10,
      cutTime: 10,
      cutSendDur: 10,
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];
  it('SpLtpoChartTest01', function () {
    ltPoChart.init();
    expect(SpLtpoChart.ltpoDataArr).toEqual([]);
  });
  it('SpLtpoChartTest02', function () {
    expect(ltPoChart.setRealFps()).toBeUndefined();
  });
  it('SpLtpoChartTest3', function () {
    expect(ltPoChart.deleteUselessFence(SpLtpoChart.fpsnameList, SpLtpoChart.fpsnameList)).toBeUndefined();
  });
  it('SpLtpoChartTest04', function () {
    expect(SpLtpoChart.presentArr).toEqual([]);
  });
  it('SpLtpoChartTest05', function () {
    expect(ltPoChart.initFenceName()).toBeUndefined();
  });
  it('SpLtpoChartTest06', function () {
    expect(ltPoChart.initFpsName()).toBeUndefined();
  });
  it('SpLtpoChartTest07', function () {
    expect(ltPoChart.initRealFps()).toBeUndefined();
  });
  it('SpLtpoChartTest08', function () {
    expect(ltPoChart.setRealFps()).toBeUndefined();
  });
  it('SpLtpoChartTest09', function () {
    let lptoArr = [];
    let fanceId = 10;
    let fps = 10;
    let signaled = 10;
    let startTs = 0;
    let dur = 10;
    let nextStartTs = 10;
    let nextDur = 10;
    expect(ltPoChart.pushLtpoData(lptoArr, fanceId, fps, signaled, startTs, dur, nextStartTs, nextDur)).toBeUndefined();
  });

  it('SpLtpoChartTest10', function () {
    expect(ltPoChart.specialValue(0.2)).toBe(0);
    expect(ltPoChart.specialValue(0.5)).toBe(0);
    expect(ltPoChart.specialValue(0.7)).toBe(1);
    expect(ltPoChart.specialValue(1.8)).toBe(2);
  });
});
