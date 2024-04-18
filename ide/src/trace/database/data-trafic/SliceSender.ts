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
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';

export function sliceSender(): Promise<unknown> {
  let trafic: number = TraficEnum.Memory;
  return new Promise((resolve): void => {
    threadPool.submitProto(
      QueryEnum.SliceData,
      {
        trafic: trafic,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
      },
      (res: unknown): void => {
        resolve(res);
      }
    );
  });
}

export function sliceSPTSender(leftNs: number, rightNs: number, cpus: Array<number>, func: string): Promise<unknown[]> {
  return new Promise((resolve): void => {
    threadPool.submitProto(
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
