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
import { xpowerWifiList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartXpowerWifiMemoryDataSql = (args: Args): string => {
  if (args.xpowerName === 'WIFIPackets') {
    return `
          SELECT start_time - start_ts as startTime,
                 ifnull(tx_packets, 0) as tx,
                 ifnull(rx_packets, 0) as rx
          FROM xpower_app_detail_wifi, trace_range`;
  } else {
    return `
          SELECT start_time - start_ts as startTime,
                 ifnull(tx_bytes, 0) as tx,
                 ifnull(rx_bytes, 0) as rx
          FROM xpower_app_detail_wifi, trace_range`;
  }
};

export const chartXpowerStatisticDataSql = (args: Args): string => {
  if (args.xpowerName === 'WIFIPackets') {
    return `
          SELECT start_time - start_ts as startTime,
                 ifnull(tx_packets, 0) as tx,
                 ifnull(rx_packets, 0) as rx
          FROM xpower_app_detail_wifi, trace_range`;
  } else {
    return `
          SELECT start_time - start_ts as startTime,
                 ifnull(tx_bytes, 0) as tx,
                 ifnull(rx_bytes, 0) as rx
          FROM xpower_app_detail_wifi, trace_range`;
  }
};

export function xpowerWifiDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let list: unknown[];
    // @ts-ignore
    if (!xpowerWifiList.has(data.params.xpowerName)) {
      // @ts-ignore
      list = proc(chartXpowerWifiMemoryDataSql(data.params));
      // @ts-ignore
      xpowerWifiList.set(data.params.xpowerName, list);
    } else {
      // @ts-ignore
      list = xpowerWifiList.get(data.params.xpowerName) || [];
    }
    // @ts-ignore
    if (data.params.queryAll) {
      list = (list || []).filter(
        // @ts-ignore
        (it) => it.startTime + 3000000000 >= data.params.selectStartNS && it.startTime <= data.params.selectEndNS
      );
    }
    arrayBufferHandler(data, list, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerStatisticDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let tx = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  // @ts-ignore
  let rx = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.energy);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerWifiData);
    // @ts-ignore
    startTime[i] = it.startTime;
    // @ts-ignore
    tx[i] = it.tx;
    // @ts-ignore
    rx[i] = it.rx;
  });

  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startTime: startTime.buffer,
            tx: tx.buffer,
            rx: rx.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, tx.buffer, rx.buffer] : []
  );
}
