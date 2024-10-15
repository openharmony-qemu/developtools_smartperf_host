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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, isFrameContainPoint, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class XpowerRender extends Render {
  renderMainThread(
    xpowerReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      maxValue: number;
      index: number;
      maxName: string;
    },
    row: TraceRow<XpowerStruct>
  ): void {
    XpowerStruct.index = xpowerReq.index;
    let xpowerList = row.dataList;
    let xpowerFilter = row.dataListCache;
    dataFilterHandler(xpowerList, xpowerFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: xpowerReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(xpowerReq.context, xpowerFilter, row);
    xpowerReq.context.beginPath();
    let find = false;
    for (let re of xpowerFilter) {
      XpowerStruct.draw(xpowerReq.context, re, xpowerReq.maxValue);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        XpowerStruct.hoverXpowerStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      XpowerStruct.hoverXpowerStruct = undefined;
    }
    xpowerReq.context.closePath();
    let s = xpowerReq.maxName;
    let textMetrics = xpowerReq.context.measureText(s);
    xpowerReq.context.globalAlpha = 0.8;
    xpowerReq.context.fillStyle = '#f0f0f0';
    xpowerReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
    xpowerReq.context.globalAlpha = 1;
    xpowerReq.context.fillStyle = '#333';
    xpowerReq.context.textBaseline = 'middle';
    xpowerReq.context.fillText(s, 4, 5 + 9);
  }
}
export function XpowerStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_SYSTEM && (XpowerStruct.hoverXpowerStruct || entry)) {
      XpowerStruct.selectXpowerStruct = entry || XpowerStruct.hoverXpowerStruct;
      sp.traceSheetEL?.displayXpowerData(XpowerStruct.selectXpowerStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class XpowerStruct extends BaseStruct {
  static maxValue: number = 0;
  static maxName: string = '';
  static hoverXpowerStruct: XpowerStruct | undefined;
  static selectXpowerStruct: XpowerStruct | undefined;
  static index = 0;
  filterId: number | undefined;
  value: number | undefined;
  startNS: number | undefined;
  dur: number | undefined; //自补充，数据库没有返回
  delta: number | undefined; //自补充，数据库没有返回

  static draw(xpowerContext: CanvasRenderingContext2D, data: XpowerStruct, maxValue: number): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      xpowerContext.fillStyle = ColorUtils.colorForTid(XpowerStruct.index);
      xpowerContext.strokeStyle = ColorUtils.colorForTid(XpowerStruct.index);
      let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0) * 1.0) / maxValue);
      if (drawHeight === 0) {
        drawHeight = 1;
      }
      if (XpowerStruct.isHover(data)) {
        xpowerContext.lineWidth = 1;
        xpowerContext.globalAlpha = 0.6;
        xpowerContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
        xpowerContext.beginPath();
        xpowerContext.arc(data.frame.x, data.frame.y + data.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        xpowerContext.fill();
        xpowerContext.globalAlpha = 1.0;
        xpowerContext.stroke();
        xpowerContext.beginPath();
        xpowerContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight);
        xpowerContext.lineWidth = 3;
        xpowerContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight);
        xpowerContext.stroke();
      } else {
        xpowerContext.lineWidth = 1;
        xpowerContext.globalAlpha = 1.0;
        xpowerContext.strokeRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
        xpowerContext.globalAlpha = 0.6;
        xpowerContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    xpowerContext.globalAlpha = 1.0;
    xpowerContext.lineWidth = 1;
  }

  static isHover(xpower: XpowerStruct): boolean {
    return xpower === XpowerStruct.hoverXpowerStruct || xpower === XpowerStruct.selectXpowerStruct;
  }
}
