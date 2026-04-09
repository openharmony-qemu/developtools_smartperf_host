/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

import { SpStatisticsHttpUtil } from '../../src/statistics/util/SpStatisticsHttpUtil';
import fetch from 'node-fetch';

SpStatisticsHttpUtil.initStatisticsServerConfig = jest.fn(() => true);
SpStatisticsHttpUtil.addUserVisitAction = jest.fn(() => true);
global.fetch = fetch;
global.Worker = jest.fn();
window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
}));
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('../../src/trace/component/SpQuerySQL', () => ({
  SpQuerySQL: class {},
}));
jest.mock('../../src/trace/component/SpSystemTrace', () => ({
  SpSystemTrace: class {},
}));
jest.mock('../../src/trace/component/SpMetrics', () => ({
  SpMetrics: class {},
}));
jest.mock('../../src/trace/component/SpHelp', () => ({
  SpHelp: class {},
}));
jest.mock('../../src/trace/component/SpInfoAndStas', () => ({
  SpInfoAndStats: class {},
}));
jest.mock('../../src/trace/component/SpRecordTrace', () => ({
  SpRecordTrace: class {},
}));
jest.mock('../../src/trace/component/SpWelcomePage', () => ({
  SpWelcomePage: class {},
}));
jest.mock('../../src/trace/component/trace/search/Search', () => ({
  LitSearch: class {},
}));
jest.mock('../../src/trace/component/schedulingAnalysis/SpSchedulingAnalysis', () => ({
  SpSchedulingAnalysis: class {},
}));
jest.mock('../../src/trace/component/SpFlags', () => ({
  SpFlags: class {},
}));
jest.mock('../../src/trace/component/SpKeyboard', () => ({
  SpKeyboard: class {},
}));
jest.mock('../../src/trace/component/SpThirdParty', () => ({
  SpThirdParty: class {},
}));
jest.mock('../../src/trace/component/SpAiAnalysisPage', () => ({
  SpAiAnalysisPage: class {},
}));
jest.mock('../../src/trace/component/SpSnapShotView', () => ({
  SpSnapShotView: class {},
}));
jest.mock('../../src/trace/component/trace/base/TraceRow', () => ({
  TraceRow: class {},
}));
jest.mock('../../src/trace/component/trace/base/TraceRowConfig', () => ({
  TraceRowConfig: class {},
}));
jest.mock('../../src/trace/database/SqlLite', () => ({
  getThreadPoolTraceBuffer: jest.fn(),
  getThreadPoolTraceBufferCacheKey: jest.fn(),
  setThreadPoolTraceBuffer: jest.fn(),
  threadPool: {},
  threadPool2: {},
}));
jest.mock('../../src/trace/database/Convert', () => ({
  convertPool: {},
}));
jest.mock('../../src/trace/component/trace/base/Utils', () => ({
  Utils: {
    isDistributedMode: jest.fn(() => false),
  },
}));
jest.mock('../../src/trace/component/SpSystemTrace.init', () => ({
  cancelCurrentTraceRowHighlight: jest.fn(),
}));
jest.mock('../../src/webSocket/WebSocketManager', () => ({
  WebSocketManager: class {},
}));

import { SpApplication } from '../../src/trace/SpApplication';
import { LongTraceFilter } from '../../src/trace/longtrace/LongTraceFilter';
import {
  buildLongTracePageNotReadyMessage,
  LONG_TRACE_FIRST_PAGE_NUMBER,
  LONG_TRACE_HEADER_SIZE_BYTES,
  LONG_TRACE_STATUS_NO_PATCH,
  LONG_TRACE_STATUS_PATCH_READY,
} from '../../src/trace/longtrace/LongTraceConstants';
import { LongTraceTransfer } from '../../src/trace/longtrace/LongTraceTransfer';

const TEST_LONG_TRACE_FILE_BYTES = [1, 2, 3];
const TEST_INVALID_TRACE_FILE_NAME = 'a.htrace';
const TEST_NORMAL_TRACE_FILE_ONE = 'hiprofiler_data_20260101_010101_1.htrace';
const TEST_NORMAL_TRACE_FILE_TWO = 'hiprofiler_data_20260101_010101_2.htrace';
const TEST_NORMAL_TRACE_FILE_SEVEN = 'hiprofiler_data_20260101_010101_7.htrace';
const TEST_SPECIAL_TRACE_FILE = 'hiprofiler_data_arkts.htrace';
const TEST_PROGRESS_LABEL = 'progress';
const TEST_PROGRESS_DONE = 1;
const TEST_PROGRESS_TOTAL = 2;
const TEST_PROGRESS_PERCENT = 50;
const TEST_PAGE_TWO = 2;
const TEST_TRACE_BUFFER_LENGTH = 1030;
const TEST_PATCH_PAYLOAD = [1, 2, 3, 4];
const TEST_PATCH_RESULT_PAYLOAD = [10, 20, 30];

// 创建 LongTrace 文件
function createLongTraceFile(name: string): File {
  return new File([new Uint8Array(TEST_LONG_TRACE_FILE_BYTES)], name);
}

// 创建 LongTrace 应用
function createLongTraceApp(): any {
  const app = Object.create(SpApplication.prototype) as any;
  app.longTracePreprocessEnabled = false;
  app.longTracePreprocessTotalFiles = 0;
  app.longTracePreprocessDoneFiles = 0;
  app.longTracePatchPayloadByPageNum = new Map<number, Uint8Array>();
  app.longTraceReadyPageNums = new Set<number>();
  app.longTraceSequenceToPageNum = new Map<number, number>();
  app.longTraceSequenceNumbers = [];
  app.longTraceHeadMessageList = [];
  app.litSearch = undefined;
  return app;
}

// 测试 SpApplication LongTrace 功能
describe('SpApplication longtrace', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceFilter 实例能够正确合并补丁数据并回调结果。
   */
  it('preprocessAndOpenLongTrace 在无 normal 文件时应直接失败', async () => {
    const app = createLongTraceApp();
    jest.spyOn(LongTraceFilter, 'filter').mockReturnValue({
      normalFiles: [],
      specialFiles: [],
      logs: [{ message: 'ignored', fileNames: [TEST_INVALID_TRACE_FILE_NAME] }],
    });
    const failSpy = jest.spyOn(app, 'traceFileLoadFailedHandler').mockImplementation(() => {});
    const openSpy = jest.spyOn(app, 'openLongTraceFromDetail').mockImplementation(() => {});

    await app.preprocessAndOpenLongTrace([] as unknown as FileList);

    expect(failSpy).toHaveBeenCalledWith('No available LongTrace slice files found in the current directory');
    expect(openSpy).not.toHaveBeenCalled();
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceFilter 实例能够正确合并补丁数据并回调结果。
   */
  it('preprocessAndOpenLongTrace 在单个 normal 文件时不应启动后台预处理', async () => {
    const app = createLongTraceApp();
    const normalFile = createLongTraceFile(TEST_NORMAL_TRACE_FILE_ONE);
    const specialFile = createLongTraceFile(TEST_SPECIAL_TRACE_FILE);
    jest.spyOn(LongTraceFilter, 'filter').mockReturnValue({
      normalFiles: [normalFile],
      specialFiles: [specialFile],
      logs: [],
    });
    const openSpy = jest.spyOn(app, 'openLongTraceFromDetail').mockImplementation(() => {});
    const backgroundSpy = jest.spyOn(app, 'startLongTraceBackgroundPreprocess').mockImplementation(() => {});

    await app.preprocessAndOpenLongTrace([normalFile, specialFile] as unknown as FileList);

    expect(app.longTracePreprocessEnabled).toBeFalsy();
    expect(app.longTracePreprocessTotalFiles).toBe(LONG_TRACE_FIRST_PAGE_NUMBER);
    expect(app.longTracePreprocessDoneFiles).toBe(0);
    expect(app.longTracePatchPayloadByPageNum.size).toBe(0);
    expect(app.longTraceReadyPageNums.has(LONG_TRACE_FIRST_PAGE_NUMBER)).toBeTruthy();
    expect(openSpy).toHaveBeenCalledWith([normalFile, specialFile], false);
    expect(backgroundSpy).not.toHaveBeenCalled();
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceFilter 实例能够正确合并补丁数据并回调结果。
   */
  it('preprocessAndOpenLongTrace 在多个 normal 文件时应启动后台预处理', async () => {
    const app = createLongTraceApp();
    const normalFileOne = createLongTraceFile(TEST_NORMAL_TRACE_FILE_ONE);
    const normalFileTwo = createLongTraceFile(TEST_NORMAL_TRACE_FILE_TWO);
    jest.spyOn(LongTraceFilter, 'filter').mockReturnValue({
      normalFiles: [normalFileOne, normalFileTwo],
      specialFiles: [],
      logs: [],
    });
    jest.spyOn(app, 'openLongTraceFromDetail').mockImplementation(() => {});
    const backgroundSpy = jest.spyOn(app, 'startLongTraceBackgroundPreprocess').mockImplementation(() => {});

    await app.preprocessAndOpenLongTrace([normalFileOne, normalFileTwo] as unknown as FileList);

    expect(app.longTracePreprocessEnabled).toBeTruthy();
    expect(backgroundSpy).toHaveBeenCalledWith([normalFileOne, normalFileTwo]);
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确处理 LongTrace 文件。
   */
  it('startLongTraceBackgroundPreprocess 应更新进度并转发结果回调', async () => {
    const app = createLongTraceApp();
    const setPercent = jest.fn();
    app.litSearch = { setPercent };
    const resultSpy = jest.spyOn(app, 'handleLongTracePreprocessResult').mockImplementation(() => {});
    jest.spyOn(LongTraceTransfer.prototype, 'preprocessInBackground').mockImplementation(async (_files, options = {}) => {
      options.onProgress?.({
        done: TEST_PROGRESS_DONE,
        total: TEST_PROGRESS_TOTAL,
        message: TEST_PROGRESS_LABEL,
      });
      options.onResult?.({
        n: 7,
        fileName: TEST_NORMAL_TRACE_FILE_SEVEN,
        status: LONG_TRACE_STATUS_NO_PATCH,
      });
    });

    app.startLongTraceBackgroundPreprocess([createLongTraceFile(TEST_NORMAL_TRACE_FILE_ONE)]);
    await Promise.resolve();

    expect(app.longTracePreprocessDoneFiles).toBe(TEST_PROGRESS_DONE);
    expect(setPercent).toHaveBeenCalledWith(TEST_PROGRESS_LABEL, TEST_PROGRESS_PERCENT);
    expect(resultSpy).toHaveBeenCalledWith({
      n: 7,
      fileName: TEST_NORMAL_TRACE_FILE_SEVEN,
      status: LONG_TRACE_STATUS_NO_PATCH,
    });
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确处理 LongTrace 文件。
   */
  it('handleLongTracePreprocessResult 应按页码缓存补丁并标记页面就绪', () => {
    const app = createLongTraceApp();
    const patchPayload = new Uint8Array(TEST_PATCH_RESULT_PAYLOAD);
    app.longTraceSequenceToPageNum = new Map<number, number>([[7, TEST_PAGE_TWO]]);
    app.longTraceReadyPageNums = new Set<number>([LONG_TRACE_FIRST_PAGE_NUMBER]);
    const applySpy = jest.spyOn(app, 'applyLongTracePageLockStyle').mockImplementation(() => {});

    app.handleLongTracePreprocessResult({
      n: 7,
      fileName: TEST_NORMAL_TRACE_FILE_SEVEN,
      status: LONG_TRACE_STATUS_PATCH_READY,
      patchPayload,
    });

    expect(app.longTracePatchPayloadByPageNum.get(TEST_PAGE_TWO)).toBe(patchPayload);
    expect(app.longTraceReadyPageNums.has(TEST_PAGE_TWO)).toBeTruthy();
    expect(applySpy).toHaveBeenCalled();
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确处理 LongTrace 文件。
   */
  it('buildAssembledTraceBlobParts 应重写头部总长度并插入补丁', () => {
    const app = createLongTraceApp();
    const traceArray = new Uint8Array(TEST_TRACE_BUFFER_LENGTH);
    for (let i = 0; i < traceArray.length; i += 1) {
      traceArray[i] = i % 256;
    }
    const patchPayload = new Uint8Array(TEST_PATCH_PAYLOAD);

    const parts = app.buildAssembledTraceBlobParts(traceArray, patchPayload) as Uint8Array[];
    const header = parts[0] as Uint8Array;
    const remain = parts[2] as Uint8Array;
    const view = new DataView(header.buffer);

    expect(parts).toHaveLength(3);
    expect(parts[1]).toBe(patchPayload);
    expect(remain).toEqual(traceArray.subarray(LONG_TRACE_HEADER_SIZE_BYTES));
    expect(view.getUint32(8, true)).toBe(traceArray.byteLength + patchPayload.byteLength);
    expect(view.getUint32(12, true)).toBe(0);
  });

  /**
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceTransfer 实例能够正确处理 LongTrace 文件。
   */
  it('getTraceFileByPage 在页面未就绪时应阻止读取并刷新锁定样式', () => {
    const app = createLongTraceApp();
    const setPercent = jest.fn();
    app.litSearch = { setPercent };
    app.longTracePreprocessEnabled = true;
    app.longTraceReadyPageNums = new Set<number>([LONG_TRACE_FIRST_PAGE_NUMBER]);
    const applySpy = jest.spyOn(app, 'applyLongTracePageLockStyle').mockImplementation(() => {});
    const openInitSpy = jest.spyOn(app, 'openFileInit').mockImplementation(() => {});

    app.getTraceFileByPage(TEST_PAGE_TWO);

    expect(setPercent).toHaveBeenCalledWith(buildLongTracePageNotReadyMessage(TEST_PAGE_TWO), 0);
    expect(applySpy).toHaveBeenCalled();
    expect(openInitSpy).not.toHaveBeenCalled();
  });
});
