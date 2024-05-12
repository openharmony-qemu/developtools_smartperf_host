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

import { Args } from '../CommonArgs';
import { TraficEnum } from '../utils/QueryEnum';

export const chartHiperfCpuData10MSProtoSql = (args: Args): string => {
  return `select 
                 startNS as startNS,
                 max(event_count) as eventCount,
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
export const chartHiperfCpuDataProtoSql = (args: Args): string => {
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

export function hiperfCpuDataReceiver(data: unknown, proc: Function): void {
  let sql: string;
  // @ts-ignore
  if (data.params.scale > 30_000_000) {
    // @ts-ignore
    sql = chartHiperfCpuData10MSProtoSql(data.params);
  } else {
    // @ts-ignore
    sql = chartHiperfCpuDataProtoSql(data.params);
  }
  let res = proc(sql);
  // @ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let maxCpuCount = data.params.maxCpuCount;
  // @ts-ignore
  let intervalPerf = data.params.intervalPerf;
  // @ts-ignore
  let usage = data.params.drawType === -2;
  let perfCpu = new PerfCpu(data, transfer, res.length);
  let maxEventCount = Math.max(
    ...res.map((it) => {
      // @ts-ignore
      data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
      // @ts-ignore
      return it.eventCount;
    })
  );
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
    // @ts-ignore
    perfCpu.startNS[i] = it.startNS || it.startNs; //startNS
    // @ts-ignore
    perfCpu.eventCount[i] = it.eventCount; //event_count
    // @ts-ignore
    perfCpu.sampleCount[i] = it.sampleCount; //sample_count
    // @ts-ignore
    perfCpu.eventTypeId[i] = it.eventTypeId; //event_type_id
    // @ts-ignore
    perfCpu.callChainId[i] = it.callchainId; //callchain_id
    if (usage) {
      if (maxCpuCount === -1) {
        // @ts-ignore
        perfCpu.height[i] = Math.floor((it.sampleCount / (10 / intervalPerf)) * 40);
      } else {
        // @ts-ignore
        perfCpu.height[i] = Math.floor((it.sampleCount / (10 / intervalPerf) / maxCpuCount) * 40);
      }
    } else {
      // @ts-ignore
      perfCpu.height[i] = Math.floor((it.eventCount / maxEventCount) * 40);
    }
  });
  postPerfCpuMessage(data, transfer, perfCpu, res.length);
}
function postPerfCpuMessage(data: unknown, transfer: boolean, perfCpu: PerfCpu, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer,
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startNS: perfCpu.startNS.buffer,
            eventCount: perfCpu.eventCount.buffer,
            sampleCount: perfCpu.sampleCount.buffer,
            eventTypeId: perfCpu.eventTypeId.buffer,
            callChainId: perfCpu.callChainId.buffer,
            height: perfCpu.height.buffer,
          }
        : {},
      len: len,
    },
    transfer
      ? [
          perfCpu.startNS.buffer,
          perfCpu.eventCount.buffer,
          perfCpu.sampleCount.buffer,
          perfCpu.eventTypeId.buffer,
          perfCpu.callChainId.buffer,
          perfCpu.height.buffer,
        ]
      : []
  );
}
class PerfCpu {
  startNS: Float64Array;
  eventCount: Int32Array;
  sampleCount: Int32Array;
  eventTypeId: Int32Array;
  callChainId: Int32Array;
  height: Int32Array;
  constructor(data: unknown, transfer: boolean, len: number) {
    // @ts-ignore
    this.startNS = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startNS);
    // @ts-ignore
    this.eventCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventCount);
    // @ts-ignore
    this.sampleCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.sampleCount);
    // @ts-ignore
    this.eventTypeId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventTypeId);
    // @ts-ignore
    this.callChainId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.callChainId);
    // @ts-ignore
    this.height = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.height);
  }
}
