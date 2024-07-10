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
import { query } from '../../database/SqlLite';
import { TraceRow } from '../trace/base/TraceRow';
import { FlagsConfig } from '../../component/SpFlags';
interface VSyncData {
  startTime: number;
  dur: number;
  value?: number;
}

let vSyncDataList: VSyncData[] = [];
let vSyncEnable = false;
let isSingle = false;

export function resetVSync(): void {
  vSyncEnable = false;
}

export const querySfVSyncData = (): Promise<Array<VSyncData>> =>
  query(
    'querySfVSyncData',
    `SELECT value, c.ts - tb.start_ts startTime
     FROM process_measure c,
          trace_range tb
     WHERE c.filter_id IN (SELECT process_measure_filter.id AS traceId
                           FROM process_measure_filter
                                    JOIN process USING (ipid)
                           WHERE process.name = ${
                             `'` +
                             String.fromCharCode(115, 117, 114, 102, 97, 99, 101, 102, 108, 105, 110, 103, 101, 114) +
                             `'`
                           }
                             AND process_measure_filter.name = ${
                               `'` + String.fromCharCode(86, 83, 89, 78, 67, 45, 97, 112, 112) + `'`
                             })`
  );

  export const querySingleVSyncData = (): Promise<Array<VSyncData>> => {
    let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagsItemJson = JSON.parse(flagsItem!);
    let vsyncValue = flagsItemJson.vsyncValue;  
    let vsyncCondition = '';
    if (vsyncValue === 'H:VsyncGenerator' || vsyncValue === '') {
      vsyncCondition = ` AND (callstack.name like 'H:GenerateVsyncCount%'))`;
    } else {
      vsyncCondition = ` AND callstack.name like '${vsyncValue}%' )`;
    }
  
    let sql =
      `SELECT c.ts - tb.start_ts startTime
     FROM callstack c,
          trace_range tb
     WHERE c.id IN (SELECT callstack.id AS trackId
                    FROM callstack
                             JOIN process
                    WHERE process.name = 'render_service'`
      + vsyncCondition;
    return query('querySingleVSyncData', sql);
  }

/**
 * load single vsync data
 */
export async function setVSyncData(): Promise<void> {
  let sfvSyncData = await querySfVSyncData();
  if (sfvSyncData.length === 0) {
    sfvSyncData = await querySingleVSyncData();
    isSingle = true;
  }
  sfvSyncData.forEach((it, index, array): void => {
    if (index < array.length - 1) {
      it.dur = array[index + 1].startTime - it.startTime;
    } else {
      it.dur = window.totalNS - it.startTime;
    }
  });
  vSyncDataList = sfvSyncData;
}

/**
 * draw chart
 */
export function drawVSync(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  if (!vSyncEnable) {
    return;
  }
  function draw(it: VSyncData): void {
    let x = ns2x(it.startTime, width);
    let x2 = ns2x(it.startTime + it.dur, width);
    ctx.fillRect(x, 0, x2 - x, height);
  }
  ctx.beginPath();
  ctx.fillStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  if (isSingle) {
    // 单框架灰白交替
    for (let i = 0; i < vSyncDataList.length; i++) {
      if (i % 2 === 1) {
        continue;
      }
      draw(vSyncDataList[i]);
    }
  } else {
    // 双框架绘制vSync 信号为1的数据为灰
    vSyncDataList
      ?.filter((it) => it.value === 1)
      .forEach((it) => {
        draw(it);
      });
  }
  ctx.stroke();
  ctx.globalAlpha = 1.0;
  ctx.closePath();
}

/**
 * enable/disable SingleVSync
 */
export function enableVSync(press: boolean, ev: KeyboardEvent, handler?: Function): void {
  if (ev.key.toLocaleLowerCase() === 'v' && !ev.ctrlKey) {
    window.publish(window.SmartEvent.UI.Loading, { loading: true, text: 'Query VSync' });
    setVSyncData();
    window.publish(window.SmartEvent.UI.Loading, { loading: false, text: 'Query VSync' });
    vSyncEnable = !vSyncEnable;
    handler?.();
  }
}

/**
 * ns to px
 */
function ns2x(ns: number, width: number): number {
  let startNS = TraceRow.range?.startNS || 0;
  let endNS = TraceRow.range?.endNS || 0;
  if (endNS === 0) {
    //@ts-ignore
    endNS = (window as unknown).totalNS;
  }
  let xWidth: number = ((ns - startNS) * width) / (endNS - startNS);
  if (xWidth < 0) {
    xWidth = 0;
  } else if (xWidth > width) {
    xWidth = width;
  }
  return xWidth;
}
