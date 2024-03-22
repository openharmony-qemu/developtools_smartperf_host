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
  diskIoDataGroupBy10MSProtoSql,
  diskIoDataProtoSql,
  diskIoReceiver,
  eBPFVmDataGroupBy10MSProtoSql,
  eBPFVmDataProtoSql,
  eBPFVmReceiver,
  fileSystemDataGroupBy10MSProtoSql,
  fileSystemDataProtoSql,
  fileSystemDataReceiver
} from '../../../../src/trace/database/data-trafic/EBPFReceiver';
import { TraficEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';

describe('EBPFReceiver Test', () => {
  let data;
  let proc;

  beforeEach(() => {
    data = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
        typeArr:[]
      },
    };
    proc = jest.fn((sql) => [
      {EBPFVm: {startNs: 440000000, endNs: 450000000, size: 4, px: 172}},
      {EBPFVm: {startNs: 450000000, endNs: 460000000, size: 3, px: 176}},
    ]);
  });
  it('EBPFReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      typeArr:[]
    };
    expect(fileSystemDataGroupBy10MSProtoSql(args)).toBeTruthy();
    expect(fileSystemDataProtoSql(args)).toBeTruthy();
    expect(diskIoDataGroupBy10MSProtoSql (args)).toBeTruthy();
    expect(diskIoDataProtoSql  (args)).toBeTruthy();
    expect(eBPFVmDataGroupBy10MSProtoSql   (args)).toBeTruthy();
    expect(eBPFVmDataProtoSql   (args)).toBeTruthy();
  });
  it('EBPFReceiverTest02 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    fileSystemDataReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EBPFReceiverTest03 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    diskIoReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EBPFReceiverTest04 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    eBPFVmReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});