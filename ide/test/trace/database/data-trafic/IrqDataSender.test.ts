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
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { irqDataSender } from '../../../../src/trace/database/data-trafic/IrqDataSender';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { IrqStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerIrq';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('irqDataSender Test', () => {
  let IrqData = [
    {
      argSetId: 74,
      depth: 0,
      dur: 3646,
      frame: { x: 0, y: 5, width: 1, height: 30 },
      id: 74,
      name: 'IPI',
      startNS: 4255208,
    },
    {
      argSetId: 400,
      depth: 0,
      dur: 3125,
      frame: { x: 1, y: 5, width: 1, height: 30 },
      id: 397,
      name: 'IPI',
      startNS: 38229687,
    },
  ];
  it('IrqDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(IrqData, IrqData.length, true);
    });
    let traceRow = TraceRow.skeleton<IrqStruct>();
    irqDataSender(0, 'irq', traceRow).then((res) => {
      expect(res).toHaveLength(2);
    });
  });
});
