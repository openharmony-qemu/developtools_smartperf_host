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

SpStatisticsHttpUtil.initStatisticsServerConfig = jest.fn(() => true);
SpStatisticsHttpUtil.addUserVisitAction = jest.fn(() => true);

const intersectionObserverMock = () => ({
    observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
import { SpApplication } from '../../src/trace/SpApplication';
import { LongTraceDBUtils } from '../../src/trace/database/LongTraceDBUtils';
// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

describe('spApplication Test', () => {
    LongTraceDBUtils.getInstance().indexedDBHelp = jest.fn(()=>{})
    LongTraceDBUtils.getInstance().indexedDBHelp.open = jest.fn(()=>{})
    LongTraceDBUtils.getInstance().createDBAndTable = jest.fn(()=>{
        return {
            then: Function
        }
    })
    document.body.innerHTML = '<sp-application id="sss"></sp-application>';
    let spApplication = document.querySelector('#sss') as SpApplication;
    it('spApplicationTest01', function () {
        spApplication.dark = true;
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
        spApplication.dark = false;
        expect(spApplication.dark).toBeFalsy();
    });

    it('spApplicationTest16', function () {
        spApplication.querySql = false;
        expect(spApplication.querySql).toBeFalsy();
    });
});
