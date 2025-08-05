// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { QueryEnum, TraficEnum } from './utils/QueryEnum';
import { getThreadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';

export function sliceSender(traceId?: string): Promise<unknown> {
  let trafic: number = TraficEnum.Memory;
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.SliceData,
      {
        trafic: trafic,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(traceId),
      },
      (res: unknown): void => {
        resolve(res);
      }
    );
  });
}

export function sliceSPTSender(leftNs: number, rightNs: number, cpus: Array<number>,
  func: string, traceId?: string): Promise<unknown[]> {
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.SliceSPTData,
      {
        leftNs: leftNs,
        rightNs: rightNs,
        cpus: cpus,
        func: func,
        trafic: TraficEnum.Memory,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        //@ts-ignore
        resolve(res);
      }
    );
  });
}

export function sliceChildBoxSender(func: string, leftNs: number, rightNs: number, threadId?: number | number[], processId?: number | number[],
  cpus?: Array<number>, state?: string, traceId?: string): Promise<unknown[]> {
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.SliceChildBoxData,
      {
        leftNs: leftNs,
        rightNs: rightNs,
        cpus: cpus ? cpus : [],
        processId: processId ? processId : [],
        threadId: threadId ? threadId : [],
        state: state ? state : '',
        func: func ? func : '',
        trafic: TraficEnum.Memory,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        //@ts-ignore
        resolve(res);
      }
    );
  });
}

export function threadNearData(func: string, pid: number, tid: number, startTime: number, traceId?: string): Promise<unknown[]> {
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.ThreadNearData,
      {
        pid: pid,
        tid: tid,
        startTime: startTime,
        func: func,
        trafic: TraficEnum.Memory,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        //@ts-ignore
        resolve(res);
      }
    );
  });
}
