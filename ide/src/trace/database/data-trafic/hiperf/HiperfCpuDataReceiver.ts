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

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let maxCpuCount = data.params.maxCpuCount;
  let intervalPerf = data.params.intervalPerf;
  let usage = data.params.drawType === -2;
  let perfCpu = new PerfCpu(data, transfer, res.length);
  let maxEventCount = Math.max(
    ...res.map(it => {
      data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
      return it.eventCount;
    })
  );
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiperfData);
    perfCpu.startNS[i] = it.startNS || it.startNs; //startNS
    perfCpu.eventCount[i] = it.eventCount; //event_count
    perfCpu.sampleCount[i] = it.sampleCount; //sample_count
    perfCpu.eventTypeId[i] = it.eventTypeId; //event_type_id
    perfCpu.callChainId[i] = it.callchainId; //callchain_id
    if (usage) {
      if (maxCpuCount === -1) {
        perfCpu.height[i] = Math.floor((it.sampleCount / (10 / intervalPerf)) * 40);
      } else {
        perfCpu.height[i] = Math.floor((it.sampleCount / (10 / intervalPerf) / maxCpuCount) * 40);
      }
    } else {
      perfCpu.height[i] = Math.floor((it.eventCount / maxEventCount) * 40);
    }
  });
  postPerfCpuMessage(data, transfer, perfCpu, res.length);
}
function postPerfCpuMessage(data: any, transfer: boolean, perfCpu: PerfCpu, len: number) {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer,
      id: data.id,
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
  constructor(data: any, transfer: boolean, len: number) {
    this.startNS = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startNS);
    this.eventCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventCount);
    this.sampleCount = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.sampleCount);
    this.eventTypeId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.eventTypeId);
    this.callChainId = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.callChainId);
    this.height = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.height);
  }
}
