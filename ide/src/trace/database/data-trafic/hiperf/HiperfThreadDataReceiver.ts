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

import { TraficEnum } from '../utils/QueryEnum';

export const chartHiperfThreadData10MSProtoSql = (args: any): string => {
  return `select startNS as startNS,
                 max(event_count)                                                         eventCount,
                 sample_count as sampleCount,
                 event_type_id as eventTypeId,
                 callchain_id as callchainId,
                 (startNS / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
          from (SELECT sp.callchain_id,
                       (sp.timestamp_trace - ${args.recordStartNS}) / 10000000 * 10000000 startNS,
                       sum(event_count)                                                   event_count,
                       count(event_count)                                                 sample_count,
                       event_type_id
                from perf_sample sp
                where sp.thread_id = ${args.tid}
                  and sp.thread_id != 0 ${args.drawType >= 0 ? 'and event_type_id =' + args.drawType : ''}
                group by startNS)
          where startNS + 10000000 >= ${Math.floor(args.startNS)}
            and startNS <= ${Math.floor(args.endNS)}
          group by px;`;
};
export const chartHiperfThreadDataProtoSql = (args: any): string => {
  return `SELECT (sp.timestamp_trace - ${args.recordStartNS})          startNS,
                 event_count as eventCount,
                 1 as sampleCount,
                 event_type_id as eventTypeId,
                 sp.callchain_id as callchainId,
                 (sp.timestamp_trace - ${args.recordStartNS}) / (${Math.floor(
    (args.endNS - args.startNS) / args.width
  )}) AS px
          from perf_sample sp
          where sp.thread_id = ${args.tid}
            and sp.thread_id != 0 ${args.drawType >= 0 ? 'and event_type_id =' + args.drawType : ''}
            and startNS >= ${Math.floor(args.startNS)}
            and startNS <= ${Math.floor(args.endNS)}
          group by px;`;
};

export function hiperfThreadDataReceiver(data: any, proc: Function): void {
  let sql: string;
  if (data.params.scale > 30_000_000) {
    sql = chartHiperfThreadData10MSProtoSql(data.params);
  } else {
    sql = chartHiperfThreadDataProtoSql(data.params);
  }
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let maxCpuCount = data.params.maxCpuCount;
  let intervalPerf = data.params.intervalPerf;
  let usage = data.params.drawType === -2;
  let perfThread = new PerfThread(data, transfer, res.length);
  let maxEventCount = Math.max(
    ...res.map((it) => {
      data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
      return it.eventCount;
    })
  );
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
    perfThread.startNS[i] = it.startNS || it.startNs;
    perfThread.eventCount[i] = it.eventCount;
    perfThread.sampleCount[i] = it.sampleCount;
    perfThread.eventTypeId[i] = it.eventTypeId;
    perfThread.callChainId[i] = it.callchainId;
    if (usage) {
      perfThread.height[i] = maxCpuCount === -1
        ? Math.floor((it.sampleCount / (10 / intervalPerf)) * 40)
        : Math.floor((it.sampleCount / (10 / intervalPerf) / maxCpuCount) * 40);
    } else {
      perfThread.height[i] = Math.floor((it.eventCount / maxEventCount) * 40);
    }
  });
  postPerfThreadMessage(data, transfer, perfThread, res.length);
}
function postPerfThreadMessage(data: any, transfer: boolean, perfThread: PerfThread, len: number) {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: perfThread.startNS.buffer,
            eventCount: perfThread.eventCount.buffer,
            sampleCount: perfThread.sampleCount.buffer,
            eventTypeId: perfThread.eventTypeId.buffer,
            callChainId: perfThread.callChainId.buffer,
            height: perfThread.height.buffer,
          }
        : {},
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
          perfThread.startNS.buffer,
          perfThread.eventCount.buffer,
          perfThread.sampleCount.buffer,
          perfThread.eventTypeId.buffer,
          perfThread.callChainId.buffer,
          perfThread.height.buffer,
        ]
      : []
  );
}
class PerfThread {
  startNS: Float64Array;
  eventCount: Int32Array;
  sampleCount: Int32Array;
  eventTypeId: Int32Array;
  callChainId: Int32Array;
  height: Int32Array;
  constructor(data: any, transfer: boolean, len: number) {
    this.startNS = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startNS);
    this.eventCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventCount);
    this.sampleCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.sampleCount);
    this.eventTypeId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventTypeId);
    this.callChainId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.callChainId);
    this.height = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.height);
  }
}
