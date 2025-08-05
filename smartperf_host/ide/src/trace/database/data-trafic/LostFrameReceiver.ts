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

import { TraficEnum } from './utils/QueryEnum';
import { lostFrameList } from './utils/AllMemoryCache';

export const queryPresentInfo = (args: any): string => {
  return `SELECT ts,dur,name FROM callstack WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('${args.threadName}'))
    AND name LIKE('${args.funcName}')`;
};

export function lostFrameReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!lostFrameList.has(data.params.pid)) {
      lostFrameList.set(data.params.pid, proc(queryPresentInfo(data.params)));
    }
    let res = lostFrameList.get(data.params.pid)!;
    arrayBufferHandler(data, res, true);
  } else {
    let res = proc(queryPresentInfo(data.params));
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let argSetId = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetId);
  let nofinish = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.nofinish);
  let presentId = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.presentId);
  res.forEach((it, i) => {
    let nameCutArr = it.name.split(' ');
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuData);
    startTime[i] = it.ts;
    dur[i] = it.dur;
    nofinish[i] = it.nofinish;
    argSetId[i] = it.argSetId;
    presentId[i] = Number(nameCutArr[nameCutArr.length - 1].split('|')[0]);
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTime: startTime.buffer,
            dur: dur.buffer,
            argSetID: argSetId.buffer,
            presentId: presentId.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, dur.buffer, argSetId.buffer] : []
  );
}
