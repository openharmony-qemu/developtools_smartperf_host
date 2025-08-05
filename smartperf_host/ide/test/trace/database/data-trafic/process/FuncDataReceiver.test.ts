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

import {
  chartFuncDataSql,
  chartFuncDataSqlMem, funcDataReceiver
} from '../../../../../src/trace/database/data-trafic/process/FuncDataReceiver';

describe('FuncDataReceiver Test', () => {
  let data;
  let proc;

  beforeEach(() => {
    data = {
      id: '55febc1a-1eea-4c9f-ad29-33cd10b95b39',
      name: 31,
      action: 'exec-proto',
      params: {
        tid: 8182,
        ipid: 52,
        startNS: 0,
        endNS: 9427688540,
        recordStartNS: 4049847357191,
        recordEndNS: 4059275045731,
        width: 549,
        trafic: 0
      }
    };
    proc = jest.fn((sql: any) => [
      {
        FuncData: {
          startTs: 129966146,
          dur: 0,
          argsetid: 2128,
          depth: 0,
          id: 1090,
          px: 7,
          durTmp: 0
        }
      },
      {
        FuncData: {
          startTs: 155282292,
          dur: 0,
          argsetid: 3260,
          depth: 0,
          id: 1778,
          px: 9,
          durTmp: 0
        }
      },
    ]);
  });
  it('FuncDataReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(chartFuncDataSql(args)).toBeTruthy();
    expect(chartFuncDataSqlMem(args)).toBeTruthy();
  });
  it('FuncDataReceiverTest02 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    funcDataReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});