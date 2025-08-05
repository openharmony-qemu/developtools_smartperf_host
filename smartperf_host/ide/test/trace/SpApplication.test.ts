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
import { SpStatisticsHttpUtil } from '../../src/statistics/util/SpStatisticsHttpUtil';
import fetch from 'node-fetch';
SpStatisticsHttpUtil.initStatisticsServerConfig = jest.fn(() => true);
SpStatisticsHttpUtil.addUserVisitAction = jest.fn(() => true);
global.fetch = fetch;
global.Worker = jest.fn();
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
import { SpApplication } from '../../src/trace/SpApplication';
import { Theme } from '../../src/trace/component/trace/base/CustomThemeColor';
import { LongTraceDBUtils } from '../../src/trace/database/LongTraceDBUtils';
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('spApplication Test', () => {
  LongTraceDBUtils.getInstance().indexedDBHelp = jest.fn(() => {});
  LongTraceDBUtils.getInstance().indexedDBHelp.open = jest.fn(() => {});
  LongTraceDBUtils.getInstance().createDBAndTable = jest.fn(() => {
    return {
      then: Function,
    };
  });
  document.body.innerHTML = '<sp-application id="sss"></sp-application>';
  let spApplication = document.querySelector('#sss') as SpApplication;
  it('spApplicationTest01', function () {
    expect(SpApplication.name).toEqual('SpApplication');
  });

  it('spApplicationTest02', function () {
    spApplication.dark = false;
    expect(spApplication.dark).toBeFalsy();
  });

  it('spApplicationTest03', function () {
    spApplication.server = true;
    expect(spApplication.server).toBeTruthy();
  });

  it('spApplicationTest04', function () {
    spApplication.server = false;
    expect(spApplication.server).toBeFalsy();
  });

  it('spApplicationTest05', function () {
    spApplication.querySql = true;
    expect(spApplication.querySql).toBeTruthy();
  });

  it('spApplicationTest06', function () {
    spApplication.querySql = false;
    expect(spApplication.querySql).toBeFalsy();
  });

  it('spApplicationTest07', function () {
    spApplication.search = true;
    expect(spApplication.search).toBeTruthy();
  });

  it('spApplicationTest08', function () {
    spApplication.search = false;
    expect(spApplication.search).toBeFalsy();
  });

  it('spApplicationTest09', function () {
    expect(spApplication.removeSkinListener([])).toBeUndefined();
  });

  it('spApplicationTest10', function () {
    expect(spApplication.freshMenuDisable(true)).toBeUndefined();
  });

  it('spApplicationTest11', function () {
    expect(spApplication.addSkinListener()).toBeUndefined();
  });

  it('spApplicationTest12', function () {
    expect(spApplication.removeSkinListener()).toBeUndefined();
  });

  it('spApplicationTest13', function () {
    spApplication.dispatchEvent(new Event('dragleave'));
  });

  it('spApplicationTest14', function () {
    spApplication.dispatchEvent(new Event('drop'));
    spApplication.removeSkinListener = jest.fn(() => undefined);
    expect(spApplication.removeSkinListener({})).toBeUndefined();
  });

  it('spApplicationTest15', function () {
    spApplication.dark = true;
    expect(spApplication.dark).toBeTruthy();
  });

  it('spApplicationTest16', function () {
    spApplication.querySql = false;
    expect(spApplication.querySql).toBeFalsy();
  });

  it('spApplicationTest17', function () {
    expect(spApplication.initHtml()).not.toBeUndefined();
  });

  it('spApplicationTest18', function () {
    const mockFn = jest.fn();
    SpStatisticsHttpUtil.initStatisticsServerConfig = mockFn;
    SpStatisticsHttpUtil.addUserVisitAction = mockFn;
    LongTraceDBUtils.getInstance().createDBAndTable().then = mockFn;
    expect(spApplication.initPlugin()).toBeUndefined();
    spApplication.initPlugin();
    expect(mockFn).toHaveBeenCalled();
  });

  it('spApplicationTest19', function () {
    expect(spApplication.initElements()).toBeUndefined();
  });

  it('spApplicationTest20', function () {
    expect(spApplication.getFileTypeAndPages('aa_gg', false, [100, 200, 300])).not.toBeUndefined();
    expect(spApplication.getFileTypeAndPages('aa_gg', true, [100, 200, 300])).not.toBeUndefined();
  });

  it('spApplicationTest21', function () {
    let str = 'aaa';
    let buffer = new ArrayBuffer(str.length * 2);
    expect(spApplication.longTraceFileReadMessagePush(100, false, 1, 100, 20, 'i', buffer)).toBeUndefined();
    expect(spApplication.longTraceFileReadMessagePush(1, true, 1, 100, 20, 'i', buffer)).toBeUndefined();
  });

  it('spApplicationTest22', function () {
    spApplication.longTraceTypeMessageMap = null;
    expect(spApplication.longTraceFileReadMessageHandler(2, 'sss')).toBeUndefined();
  });

  it('spApplicationTest23', function () {
    spApplication.longTraceTypeMessageMap!.set(2, [
      {
        startIndex: 1,
        endIndex: 2,
        size: 5,
        fileType: 's',
      },
    ]);
    expect(spApplication.longTraceFileReadMessageHandler(2, 'sss')).toBeUndefined();
  });

  it('spApplicationTest24', function () {
    spApplication.longTraceTypeMessageMap!.set(2, [
      {
        startIndex: 1,
        endIndex: 2,
        size: 5,
        fileType: 's',
      },
    ]);
    expect(spApplication.longTraceFileReadMessageHandler(1, 'sss')).toBeUndefined();
  });

  it('spApplicationTest25', function () {
    expect(spApplication.changeTheme(Theme.DARK)).toBeUndefined();
  });

  it('spApplicationTest26', function () {
    expect(spApplication.changeTheme(Theme.DARK, ['#00ff00'])).toBeUndefined();
  });

  it('spApplicationTest27', function () {
    expect(spApplication.changeTheme(Theme.LIGHT, ['#00ff00'])).toBeUndefined();
  });

  it('spApplicationTest28', function () {
    expect(spApplication.freshMenuDisable(true)).toBeUndefined();
  });

  it('spApplicationTest29', function () {
    spApplication.initElements();
    expect(spApplication.freshMenuDisable(false)).toBeUndefined();
  });

  it('spApplicationTest30', function () {
    spApplication.initElements();
    expect(spApplication.sqlite).not.toBeUndefined();
  });

  it('spApplicationTest31', function () {
    spApplication.initElements();
    expect(spApplication.wasm).not.toBeUndefined();
  });

  it('spApplicationTest33', function () {
    spApplication.initElements();
    expect(spApplication.changeUrl()).toBeUndefined();
  });
});
