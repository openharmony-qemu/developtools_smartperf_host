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

import { LtpoStruct } from "../../../../src/trace/database/ui-worker/ProcedureWorkerLTPO";
import { Rect } from "../../../../src/trace/database/ui-worker/ProcedureWorkerCommon";
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
window.ResizeObserver = window.ResizeObserver ||
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
      name:'Present Fence'
    }
  ]);

  let fpsNameList = sqlit.queryFpsNameList;
  fpsNameList.mockResolvedValue([
    {
      ts: 1224,
      dur: 2445,
      name: 'Layers,ra:te'
    }
  ]);

  let realFpsList = sqlit.queryRealFpsList;
  realFpsList.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name:'CommitAndReleaseLayers SetScreenRefreshRate'
    }
  ]);
  let ltpoArr: LtpoStruct[] = [{
    translateY:2,
    frame: new Rect(0, 14, 10, 40),
    isHover:true,
    dur: 2122,
    name: 'name',
    presentId: 125,
    ts: 258,
    fanceId: 1245,
    fps: 52,
    startTs: 125,
    nextStartTs: 12,
    nextDur: 321,
    value: 10,
    pid: 1,
    itid: 23,
    startTime: 0
  }]
  let presentInfo = sqlit.queryPresentInfo;
  presentInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence'
    }
  ]);
  let rSNowTimeListInfo = sqlit.queryRSNowTimeList;
  rSNowTimeListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf'
    }
  ]);
  let signaledListInfo = sqlit.querySignaledList;
  signaledListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf'
    }
  ]);
  let skipDataListInfo = sqlit.querySkipDataList;
  skipDataListInfo.mockResolvedValue([
    {
      ts: 124,
      dur: 445,
      name: 'Present Fence ffdf'
    }
  ]);
  it('SpLtpoChartTest01', function () {
    ltPoChart.init();
    expect(SpLtpoChart.ltpoDataArr).toEqual([]);
  });
  it('SpLtpoChartTest02', function () {
    expect(ltPoChart.setRealFps()).toBeUndefined();
  });
  it('SpLtpoChartTest03', function () {
    expect(ltPoChart.sendDataHandle(ltpoArr, ltpoArr).length).toEqual(0);
  });

  it('SpLtpoChartTest04', function () {
    ltPoChart.initHitchTime();
    expect(SpLtpoChart.presentArr).toEqual([]);
  });
});
