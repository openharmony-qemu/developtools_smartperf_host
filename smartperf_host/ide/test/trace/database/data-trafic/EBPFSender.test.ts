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

import { threadPool } from '../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { EBPFChartStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEBPF';
import {
  diskIoSender,
  fileSystemSender,
  fileSysVMSender
} from '../../../../src/trace/database/data-trafic/EBPFSender';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('EBPFSender Test', () => {
  let EBPFData = {
    size: 3,
    dur: null,
    endNS: 107000,
    startNS: 106000,
    height: 1,
    frame: {
      y: 0,
      height: 1,
      x: 403,
      width: 4
    },
    group10Ms: true,
  }
  it('EBPFSenderTest01 ', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(EBPFData, 1, true);
    });
    let type = 1;
    let scale = 1;
    let fileSystemTraceRow = TraceRow.skeleton<EBPFChartStruct>();
    fileSystemSender(type, scale, fileSystemTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
  it('EBPFSenderTest02 ', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(EBPFData, 1, true);
    });
    let scale = 1;
    let all = true;
    let ipid = 5;
    let typeArr = [1, 2, 3, 4];
    let DiskIoDataTraceRow = TraceRow.skeleton<EBPFChartStruct>();
    diskIoSender(all, ipid, typeArr, scale, DiskIoDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('EBPFSenderTest03 ', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(EBPFData, 1, true);
    });
    let scale = 1;
    let DiskIoDataTraceRow = TraceRow.skeleton<EBPFChartStruct>();
    fileSysVMSender(scale, DiskIoDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
});
