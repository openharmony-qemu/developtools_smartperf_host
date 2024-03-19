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

import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { BaseStruct, dataFilterHandler, isFrameContainPoint, Render, RequestMessage } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class FreqExtendRender extends Render {
  renderMainThread(
    freqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<CpuFreqExtendStruct>
  ) {
    let freqExtendList = row.dataList;
    let freqExtendFilter = row.dataListCache;
    dataFilterHandler(freqExtendList, freqExtendFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: freqReq.useCache || !(TraceRow.range?.refresh ?? false),
    });

    if (row.isHover) {
      CpuFreqExtendStruct.cycle = -1;
      CpuFreqExtendStruct.isTabHover = false;
    }
    freqReq.context.beginPath();
    for (let re of freqExtendFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        CpuFreqExtendStruct.hoverCpuFreqStruct = re;
      }
      if (!row.isHover && !CpuFreqExtendStruct.isTabHover) CpuFreqExtendStruct.hoverCpuFreqStruct = undefined;
      CpuFreqExtendStruct.draw(freqReq.context, re);
    }
    freqReq.context.closePath();
  }
}

export class CpuFreqExtendStruct extends BaseStruct {
  static maxValue: number = 0;
  static cycle: number = -1;
  static isTabHover: boolean = false;
  static hoverCpuFreqStruct: CpuFreqExtendStruct | undefined;
  freq: number = 0;
  static selectCpuFreqStruct: CpuFreqExtendStruct | undefined;
  cpu: number | undefined;
  value: number = 0;
  startNS: number | undefined;
  dur: number | undefined; //自补充，数据库没有返回
  cycle: number | undefined;
  type: string | undefined;
  count: number = 0;

  static draw(freqContext: CanvasRenderingContext2D, data: CpuFreqExtendStruct) {
    if (data.frame) {
      let width = data.frame.width || 0;
      let index = data.cpu || 0;
      index += 2;
      let color = ColorUtils.colorForTid(index);
      freqContext.fillStyle = color;
      freqContext.strokeStyle = color;
      if (
        data === CpuFreqExtendStruct.hoverCpuFreqStruct ||
        data === CpuFreqExtendStruct.selectCpuFreqStruct ||
        data === CpuFreqExtendStruct.selectCpuFreqStruct ||
        (data.cycle === CpuFreqExtendStruct.cycle && CpuFreqExtendStruct.cycle !== -1)
      ) {
        freqContext.fillStyle = '#ff0000';
        freqContext.strokeStyle = '#ff0000';
        freqContext.lineWidth = 3;
        freqContext.globalAlpha = 0.6;
        if (data.type === 'SCHED-SWITCH' || data.type === 'GPU-FREQ') {
          freqContext.globalAlpha = 1;
          freqContext.fillStyle = color;
          freqContext.strokeStyle = color;
        }
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0) * 1.0) / CpuFreqExtendStruct.maxValue
        );
        if (drawHeight < 1) {
          drawHeight = 1;
        }
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
        freqContext.globalAlpha = 0.8;
        freqContext.strokeRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      } else {
        freqContext.globalAlpha = 0.6;
        freqContext.lineWidth = 1;
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0)) / CpuFreqExtendStruct.maxValue
        );
        if (drawHeight < 1) {
          drawHeight = 1;
        }
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    freqContext.globalAlpha = 1.0;
    freqContext.lineWidth = 1;
  }
}
