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

export const chartHiperfCpuData10MSProtoSql = (args: any): string => {
  return `select 
                 startNS as startNS,
                 max(event_count)                                                         eventCount,
                 sample_count as sampleCount,
                 event_type_id as eventTypeId,
                 callchain_id as callchainId,
                 (startNS / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
          from (select s.callchain_id,
                       (s.timestamp_trace - ${args.recordStartNS}) / 10000000 * 10000000 startNS,
                       sum(event_count)                                                  event_count,
                       count(event_count)                                                sample_count,
                       event_type_id
                from perf_sample s
                where s.thread_id != 0 ${args.cpu >= 0 ? 'and cpu_id =' + args.cpu : ''} ${
    args.drawType >= 0 ? 'and event_type_id =' + args.drawType : ''
  }
                group by startNS)
          where startNS + 10000000 >= ${Math.floor(args.startNS)}
            and startNS <= ${Math.floor(args.endNS)}
          group by px;`;
};
export const chartHiperfCpuDataProtoSql = (args: any): string => {
  return `select 
                 (s.timestamp_trace - ${args.recordStartNS})          startNS,
                 event_count as eventCount,
                 1 as sampleCount,
                 event_type_id as eventTypeId,
                 s.callchain_id as callchainId,
                 (s.timestamp_trace - ${args.recordStartNS}) / (${Math.floor(
    (args.endNS - args.startNS) / args.width
  )}) AS      px
          from perf_sample s
          where s.thread_id != 0 ${args.cpu >= 0 ? 'and cpu_id =' + args.cpu : ''} ${
    args.drawType >= 0 ? 'and event_type_id =' + args.drawType : ''
  }
            and startNS >= ${Math.floor(args.startNS)}
            and startNS <= ${Math.floor(args.endNS)}
          group by px;
  `;
};

export function hiperfCpuDataReceiver(data: any, proc: Function): void {
  let sql: string;
  if (data.params.scale > 30_000_000) {
    sql = chartHiperfCpuData10MSProtoSql(data.params);
  } else {
    sql = chartHiperfCpuDataProtoSql(data.params);
  }
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function protoBufferHandler(data: any, res: any[]): void {}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let maxCpuCount = data.params.maxCpuCount;
  let intervalPerf = data.params.intervalPerf;
  let usage = data.params.drawType === -2;
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  let eventCount = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.eventCount);
  let sampleCount = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.sampleCount);
  let eventTypeId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.eventTypeId);
  let callChainId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.callChainId);
  let height = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.height);
  let maxEventCount = Math.max(
    ...res.map((it) => {
      data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
      return it.eventCount;
    })
  );
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
    startNS[i] = it.startNS || it.startNs; //startNS
    eventCount[i] = it.eventCount; //event_count
    sampleCount[i] = it.sampleCount; //sample_count
    eventTypeId[i] = it.eventTypeId; //event_type_id
    callChainId[i] = it.callchainId; //callchain_id
    if (usage) {
      if (maxCpuCount === -1) {
        height[i] = Math.floor((it.sampleCount / (10 / intervalPerf)) * 40);
      } else {
        height[i] = Math.floor((it.sampleCount / (10 / intervalPerf) / maxCpuCount) * 40);
      }
    } else {
      height[i] = Math.floor((it.eventCount / maxEventCount) * 40);
    }
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            eventCount: eventCount.buffer,
            sampleCount: sampleCount.buffer,
            eventTypeId: eventTypeId.buffer,
            callChainId: callChainId.buffer,
            height: height.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [startNS.buffer, eventCount.buffer, sampleCount.buffer, eventTypeId.buffer, callChainId.buffer, height.buffer]
      : []
  );
}
