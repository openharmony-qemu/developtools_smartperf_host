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

export const chartXpowerThreadCountDataSql = (args: Args): string => {
  return `
    select
      start_time - ${args.recordStartNS} as startNs,
      0 as dur,
      COUNT(start_time) as value
    from
      xpower_app_detail_cpu
    left join
      data_dict
    on data_dict.id = xpower_app_detail_cpu.thread_name_id
    left join
      trace_range r
    group by
      startNs
    order by
      startNs
      `;
};
export const chartXpowerThreadInfoDataSql = (args: Args): string => {
  return `
    select
      start_time - ${args.recordStartNS} as startNs,
      thread_time as threadTime,
      0 as dur,
      ${args.valueType} as value,
      thread_name_id as threadNameId
    from
      xpower_app_detail_cpu
      `;
};

export function xpowerDataThreadCountReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    list = proc(chartXpowerThreadCountDataSql(data.params));
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
    threadCountArrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerThreadCountDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    threadCountArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function threadCountArrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerThreadCountData);
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

export function xpowerDataThreadInfoReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    list = proc(chartXpowerThreadInfoDataSql(data.params));
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
    threadInfoArrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerThreadInfoDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    threadInfoArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function threadInfoArrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let threadTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.threadTime);
  // @ts-ignore
  let threadNameId = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.threadNameId);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerThreadInfoData);
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    value[i] = it.value;
    // @ts-ignore
    threadTime[i] = it.threadTime;
    // @ts-ignore
    threadNameId[i] = it.threadNameId;
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
            threadTime: threadTime.buffer,
            threadNameId: threadNameId.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startNS.buffer, value.buffer, threadTime.buffer, threadNameId.buffer] : []
  );
}
