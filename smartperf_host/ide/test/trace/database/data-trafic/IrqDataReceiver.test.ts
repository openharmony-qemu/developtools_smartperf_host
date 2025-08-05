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
  chartIrqDataSql,
  chartIrqDataSqlMem,
  irqDataReceiver,
} from '../../../../src/trace/database/data-trafic/IrqDataReceiver';
import { TraficEnum } from "../../../../src/trace/database/data-trafic/utils/QueryEnum";

describe('IrqReceiver Test', () => {
  let data1;
  let data2;
  let proc;

  beforeEach(() => {
    data1 = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        cpu: 0,
        endNS: 19473539059,
        name: 'irq',
        recordEndNS: 30167849973030,
        recordStartNS: 30148376433971,
        startNS: 0,
        t: 1703665514720,
        width: 708,
        sharedArrayBuffers: {},
      },
    };
    data2 = {
      params: {
        trafic: TraficEnum.Memory,
        cpu: 0,
        endNS: 19473539059,
        name: 'irq',
        recordEndNS: 30167849973030,
        recordStartNS: 30148376433971,
        startNS: 0,
        t: 1703665514720,
        width: 708,
        sharedArrayBuffers: {},
      },
    };
    proc = jest.fn((sql) => [
      { irqData: { argSetId: 74, dur: 3646, id: 74, startNs: 4255208 } },
      { irqData: { argSetId: 400, dur: 3125, id: 397, startNs: 38229687 } },
    ]);
  });
  test('IrqReceiverTest01', () => {
    const args = {
      trafic: TraficEnum.ProtoBuffer,
      cpu: 0,
      endNS: 19473539059,
      name: 'irq',
      recordEndNS: 30167849973030,
      recordStartNS: 30148376433971,
      startNS: 0,
      t: 1703665514720,
      width: 708,
      sharedArrayBuffers: {},
    };
    expect(chartIrqDataSql(args)).toBeTruthy();
  });
  test('IrqReceiverTest02', () => {
    const args = {
      trafic: TraficEnum.Memory,
      cpu: 0,
      endNS: 19473539059,
      name: 'irq',
      recordEndNS: 30167849973030,
      recordStartNS: 30148376433971,
      startNS: 0,
      t: 1703665514720,
      width: 708,
      sharedArrayBuffers: {},
    };
    expect(chartIrqDataSqlMem(args)).toBeTruthy();
  });
  test('IrqReceiverTest03', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    irqDataReceiver(data1, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  test('IrqReceiverTest04', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    irqDataReceiver(data2, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});
