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

import { SpFrameTimeChart } from '../../../../src/trace/component/chart/SpFrameTimeChart';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { FlagsConfig } from '../../../../src/trace/component/SpFlags';

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
const jankSqlite = require('../../../../src/trace/database/sql/Janks.sql');
jest.mock('../../../../src/trace/database/sql/Janks.sql');
const processSqlite = require('../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpFrameTimeChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let spFrameTimeChart = new SpFrameTimeChart(htmlElement);
  let queryFrameTime = sqlite.queryFrameTimeData;
  let queryFrameTimeData = [
    {
      pid: 256,
    },
  ];
  queryFrameTime.mockResolvedValue(queryFrameTimeData);

  let queryExpectedFrame = jankSqlite.queryExpectedFrameDate;
  let queryExpectedFrameDate = [
    {
      dur: 2585,
      depth: 1,
    },
    {
      dur: 6688,
      depth: 1,
    },
  ];
  queryExpectedFrame.mockResolvedValue(queryExpectedFrameDate);

  let queryActualFrame = jankSqlite.queryActualFrameDate;
  let queryActualFrameDate = [
    {
      dur: 6878,
      depth: 1,
    },
    {
      dur: 6238,
      depth: 1,
    },
  ];
  queryActualFrame.mockResolvedValue(queryActualFrameDate);

  let frameApp = sqlite.queryFrameApp;
  let frameAppData = [
    {
      appName: 'test0',
    },
    {
      appName: 'test1',
    },
    {
      appName: 'test2',
    },
  ];
  frameApp.mockResolvedValue(frameAppData);

  let frameAnimation = sqlite.queryFrameAnimationData;
  let frameAnimationData = [
    {animationId: 1, dynamicEndTs: 4774481414, dynamicStartTs: 4091445476, ts: 4091445476},
    {
      animationId: 2,
      dynamicEndTs: 8325095997,
      dynamicStartTs: 7652588184,
      ts: 7652588184,
    },
  ];
  frameAnimation.mockResolvedValue(frameAnimationData);

  let allProcessNames = processSqlite.queryAllProcessNames;
  let allProcessNameData = [
    {
      id: 12,
      name: 'test name',
      pid: 255
    }
  ];
  allProcessNames.mockResolvedValue(allProcessNameData);

  let dynamicIdAndName = sqlite.queryDynamicIdAndNameData;
  let data = [
    {
      id: 12,
      appName: 'name'
    }
  ];
  dynamicIdAndName.mockResolvedValue(data);

  let animationTimeRange = sqlite.queryAnimationTimeRangeData;
  let rangeData = [
    {
      status: 'Response delay',
      startTs: 225,
      endTs: 6355
    }
  ];
  animationTimeRange.mockResolvedValue(rangeData);


  let animationIdAndName = sqlite.queryAnimationIdAndNameData;
  let animationIdAndNameData = [
    {
      id: 12,
      name: 'test',
      info: '{}'
    }
  ];
  animationIdAndName.mockResolvedValue(animationIdAndNameData);

  let frameDynamic = sqlite.queryFrameDynamicData;
  let frameDynamicData = [
    {alpha: '1.00', appName: 'test0', height: 2772, id: 74, ts: 28565790, width: 1344, x: 0, y: 0},
    {
      alpha: '1.00',
      appName: 'test0',
      height: 2772,
      id: 75,
      ts: 42341310,
      width: 1344,
      x: 0,
      y: 0,
    },
  ];
  frameDynamic.mockResolvedValue(frameDynamicData);

  let frameSpacing = sqlite.queryFrameSpacing;
  let frameSpacingData = [
    {
      currentFrameHeight: 2768,
      currentFrameWidth: 1344,
      currentTs: 17535295995,
      frameSpacingResult: 0.1,
      id: 1216,
      nameId: 'test0',
      preFrameHeight: 2767,
      preFrameWidth: 1343,
      preTs: 17523356412,
      x: 0,
      y: 1,
    },
    {
      currentFrameHeight: 2768,
      currentFrameWidth: 1344,
      currentTs: 17546478287,
      frameSpacingResult: 0,
      id: 1217,
      nameId: 'test0',
      preFrameHeight: 2768,
      preFrameWidth: 1344,
      preTs: 17535295995,
      x: 0,
      y: 1,
    },
  ];
  frameSpacing.mockResolvedValue(frameSpacingData);

  let physical = sqlite.queryPhysicalData;
  let physicalData = [{physicalFrameRate: 90, physicalHeight: 2772, physicalWidth: 1344}];
  physical.mockResolvedValue(physicalData);

  it('TabPaneFramesTest01', function () {
    expect(spFrameTimeChart.init()).toBeTruthy();
  });

  it('TabPaneFramesTest02', function () {
    FlagsConfig.updateFlagsConfig('AnimationAnalysis', 'Enabled');
    spFrameTimeChart.initAnimatedScenesChart(
      TraceRow.skeleton(),
      {
        pid: 1,
        processName: 'render_service',
      },
      TraceRow.skeleton()
    );
  });
  it('TabPaneFramesTest03', function () {
    expect(spFrameTimeChart.frameNoExpandTimeOut()).toBeTruthy();
  });
  it('TabPaneFramesTest04', function () {
    expect(spFrameTimeChart.frameExpandTimeOut()).toBeTruthy();
  });
});
