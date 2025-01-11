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

import { TraficEnum } from '../utils/QueryEnum';
import { filterDataByGroup } from '../utils/DataFilter';
import { Args } from '../CommonArgs';

export const chartXpowerGpuFreqCountDataSql = (args: Args): string => {
  return `
    select
      start_time - ${args.recordStartNS} as startNs,
      0 as dur,
      COUNT(start_time) as value
    from
      xpower_app_detail_gpu
    group by
      startNs
    order by
      startNs
      `;
};

export const chartXpowerGpuFreqDataSql = (args: Args): string => {
  return `
    select
      start_time - ${args.recordStartNS} as startNs,
      run_time as runTime,
      idle_time as idleTime,
      0 as dur,
      frequency
    from
      xpower_app_detail_gpu
      `;
};

export function xpowerDataGpuFreqCountReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    list = proc(chartXpowerGpuFreqCountDataSql(data.params));
    for (let j = 0; j < list.length; j++) {
      if (j === list.length - 1) {
        // @ts-ignore
        list[j].dur = (data.params.totalNS || 0) - (list[j].startNs || 0);
      } else {
        // @ts-ignore
        list[j].dur = (list[j + 1].startNs || 0) - (list[j].startNs || 0);
      }
    }
    // @ts-ignore
    if (data.params.queryAll) {
      //框选时候取数据，只需要根据时间过滤数据
      res = (list || []).filter(
        // @ts-ignore
        (it) => it.startNs + it.dur >= data.params.selectStartNS && it.startNs <= data.params.selectEndNS
      );
    } else {
      res = filterDataByGroup(
        list || [],
        'startNs',
        'dur',
        // @ts-ignore
        data.params.startNS,
        // @ts-ignore
        data.params.endNS,
        // @ts-ignore
        data.params.width,
        'value'
      );
    }
    gpuFreqCountArrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerGpuFreqCountDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    gpuFreqCountArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function gpuFreqCountArrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerGpuFreqCountData);
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            dur: dur.buffer,
            value: value.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startNS.buffer, value.buffer] : []
  );
}

export function xpowerDataGpuFreqReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    list = proc(chartXpowerGpuFreqDataSql(data.params));
    for (let j = 0; j < list.length; j++) {
      // @ts-ignore
      list[j].dur = 3000000000;
    }
    // @ts-ignore
    if (data.params.queryAll) {
      //框选时候取数据，只需要根据时间过滤数据
      res = (list || []).filter(
        // @ts-ignore
        (it) => it.startNs + it.dur >= data.params.selectStartNS && it.startNs <= data.params.selectEndNS
      );
    } else {
      res = list;
    }
    gpuFreqArrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerGpuFreqDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    gpuFreqArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function gpuFreqArrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let runTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.runTime);
  // @ts-ignore
  let idleTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.idleTime);
  // @ts-ignore
  let frequency = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.frequency);

  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerGpuFreqData);
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    runTime[i] = it.runTime;
    // @ts-ignore
    idleTime[i] = it.idleTime;
    // @ts-ignore
    frequency[i] = it.frequency;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            dur: dur.buffer,
            runTime: runTime.buffer,
            idleTime: idleTime.buffer,
            frequency: frequency.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startNS.buffer, runTime.buffer, idleTime.buffer, frequency.buffer] : []
  );
}
