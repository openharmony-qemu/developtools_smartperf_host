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
import {
  BaseStruct,
  dataFilterHandler,
  drawLoadingFrame,
  isFrameContainPoint,
  Render,
  RequestMessage,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import {SpSystemTrace} from "../../component/SpSystemTrace";

export class FreqRender extends Render {
  renderMainThread(
    freqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<CpuFreqStruct>
  ) {
    let freqList = row.dataList;
    let freqFilter = row.dataListCache;
    dataFilterHandler(freqList, freqFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: freqReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(freqReq.context, freqFilter, row);
    freqReq.context.beginPath();
    let find = false;
    for (let re of freqFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        CpuFreqStruct.hoverCpuFreqStruct = re;
        find = true;
      }
      CpuFreqStruct.draw(freqReq.context, re);
    }
    if (!find && row.isHover) CpuFreqStruct.hoverCpuFreqStruct = undefined;
    freqReq.context.closePath();
    let s = CpuFreqStruct.maxFreqName;
    let textMetrics = freqReq.context.measureText(s);
    freqReq.context.globalAlpha = 0.8;
    freqReq.context.fillStyle = '#f0f0f0';
    freqReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
    freqReq.context.globalAlpha = 1;
    freqReq.context.fillStyle = '#333';
    freqReq.context.textBaseline = 'middle';
    freqReq.context.fillText(s, 4, 5 + 9);
  }
}
export function CpuFreqStructOnClick(clickRowType: string, sp: SpSystemTrace) {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_CPU_FREQ && CpuFreqStruct.hoverCpuFreqStruct) {
      CpuFreqStruct.selectCpuFreqStruct = CpuFreqStruct.hoverCpuFreqStruct;
      sp.traceSheetEL?.displayFreqData();
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject();
    }else{
      resolve(null);
    }
  });
}
export class CpuFreqStruct extends BaseStruct {
  static maxFreq: number = 0;
  static maxFreqName: string = '0 GHz';
  static hoverCpuFreqStruct: CpuFreqStruct | undefined;
  static selectCpuFreqStruct: CpuFreqStruct | undefined;
  cpu: number | undefined;
  value: number | undefined;
  startNS: number | undefined;
  dur: number | undefined; //自补充，数据库没有返回

  static draw(freqContext: CanvasRenderingContext2D, data: CpuFreqStruct) {
    if (data.frame) {
      let width = data.frame.width || 0;
      let index = data.cpu || 0;
      index += 2;
      freqContext.fillStyle = ColorUtils.colorForTid(index);
      freqContext.strokeStyle = ColorUtils.colorForTid(index);
      if (data === CpuFreqStruct.hoverCpuFreqStruct || data === CpuFreqStruct.selectCpuFreqStruct) {
        freqContext.lineWidth = 1;
        freqContext.globalAlpha = 0.6;
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0) * 1.0) / CpuFreqStruct.maxFreq
        );
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
        freqContext.beginPath();
        freqContext.arc(data.frame.x, data.frame.y + data.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        freqContext.fill();
        freqContext.globalAlpha = 1.0;
        freqContext.stroke();
        freqContext.beginPath();
        freqContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight);
        freqContext.lineWidth = 3;
        freqContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight);
        freqContext.stroke();
      } else {
        freqContext.globalAlpha = 0.6;
        freqContext.lineWidth = 1;
        let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0)) / CpuFreqStruct.maxFreq);
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    freqContext.globalAlpha = 1.0;
    freqContext.lineWidth = 1;
  }
}

const textPadding = 2;
