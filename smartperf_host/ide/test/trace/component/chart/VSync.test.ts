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

import {querySingleVSyncData, drawVSync, enableVSync, setVSyncData } from '../../../../src/trace/component/chart/VSync';
import { DbPool } from '../../../../src/trace/database/SqlLite';

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {
    queryFunc: ()=>{}
  };
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {}
});

const sqlit = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');

describe('VSync Test', () => {
  DbPool.prototype.submit = jest.fn();
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');
  it('VSyncTest01 ', function () {
    let cc = {
      "vsyncValue": 20
    };
    window.localStorage.setItem('FlagsConfig', JSON.stringify(cc));
    querySingleVSyncData();
    setVSyncData();
    drawVSync(ctx, 20, 20);
    window.SmartEvent = {
      UI: {
        loading: true
      }
    }
    window.publish = jest.fn();
    enableVSync(true, {
      key: 'k'
    }, () => {});
  });
});
