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
      minValue: number;
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
      XpowerStruct.draw(xpowerReq.context, re, xpowerReq.maxValue, xpowerReq.minValue);
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
export function XpowerStructOnClick(clickRowType: string, sp: SpSystemTrace, entry?: XpowerStruct): Promise<unknown> {
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

  static draw(xpowerContext: CanvasRenderingContext2D, data: XpowerStruct, maxValue: number, minValue: number): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      xpowerContext.fillStyle = ColorUtils.colorForTid(XpowerStruct.index);
      xpowerContext.strokeStyle = ColorUtils.colorForTid(XpowerStruct.index);
      if ((data.value || 0) < 0) {
        //数据为负数时显示不同颜色
        xpowerContext.fillStyle = ColorUtils.colorForTid(XpowerStruct.index + 6);
        xpowerContext.strokeStyle = ColorUtils.colorForTid(XpowerStruct.index + 6);
      }
      let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0) * 1.0) / maxValue);
      if (drawHeight === 0) {
        drawHeight = 1;
      }
      let minHeight: number = 0;
      let maxHeight: number = 0;
      let sumHeight: number = 0;
      let cutHeight: number = 0;
      if (minValue < 0) {
        // 数据包含负数时
        minHeight = Math.floor(((minValue || 0) * (data.frame.height || 0) * 1.0) / maxValue);
        maxHeight = Math.floor(((maxValue || 0) * (data.frame.height || 0) * 1.0) / maxValue);
        sumHeight = Math.abs(minHeight) + Math.abs(maxHeight);
        let num = this.cal(Math.abs(minHeight), Math.abs(maxHeight));
        drawHeight = Math.floor(drawHeight / num); //根据比例缩小绘制高度避免超出泳道

        cutHeight = Math.abs(Math.floor(((minValue || 0) * (data.frame.height || 0) * 1.0) / maxValue) / num) + 1;
        if (maxValue < 0) {
          // 全部数据都是负数时
          drawHeight = -drawHeight;
          cutHeight = 30;
        }
      }
      if (XpowerStruct.isHover(data)) {
        xpowerContext.lineWidth = 1;
        xpowerContext.globalAlpha = 0.6;
        xpowerContext.fillRect(
          data.frame.x,
          data.frame.y + data.frame.height - drawHeight - cutHeight,
          width,
          drawHeight
        );
        xpowerContext.beginPath();
        xpowerContext.arc(
          data.frame.x,
          data.frame.y + data.frame.height - drawHeight - cutHeight,
          3,
          0,
          2 * Math.PI,
          true
        );
        xpowerContext.fill();
        xpowerContext.globalAlpha = 1.0;
        xpowerContext.stroke();
        xpowerContext.beginPath();
        xpowerContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight - cutHeight);
        xpowerContext.lineWidth = 3;
        xpowerContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight - cutHeight);
        xpowerContext.stroke();
      } else {
        xpowerContext.lineWidth = 1;
        xpowerContext.globalAlpha = 1.0;
        xpowerContext.strokeRect(
          data.frame.x,
          data.frame.y + data.frame.height - drawHeight - cutHeight,
          width,
          drawHeight
        );
        xpowerContext.globalAlpha = 0.6;
        xpowerContext.fillRect(
          data.frame.x,
          data.frame.y + data.frame.height - drawHeight - cutHeight,
          width,
          drawHeight
        );
      }
    }
    xpowerContext.globalAlpha = 1.0;
    xpowerContext.lineWidth = 1;
  }

  static cal(minHeight: number, maxHeight: number): number {
    let multiplier = 1; // 初始倍数为1
    let newSum: number;
    do {
      newSum = minHeight / multiplier + maxHeight / multiplier;
      multiplier += 2; // 每次循环，倍数增加2
    } while (newSum > 30 && multiplier <= (minHeight + maxHeight) * 2); // 确保不会除以0或过大数导致无限循环

    // 检查是否找到了合适的倍数使得newSum <= 30
    if (newSum <= 30) {
      // 如果最后一次循环使multiplier超出了实际需要的值，需要调整回正确的倍数
      multiplier -= 2;
      while (minHeight / (multiplier + 2) + maxHeight / (multiplier + 2) > 30) {
        multiplier += 2;
      }
      return multiplier;
    } else {
      // 如果没有找到合适的倍数，返回2
      return 2;
    }
  }

  static isHover(xpower: XpowerStruct): boolean {
    return xpower === XpowerStruct.hoverXpowerStruct || xpower === XpowerStruct.selectXpowerStruct;
  }
}
