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

import { BaseStruct, drawLoadingFrame, isFrameContainPoint, Rect, Render, ns2x } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

enum Type {
  'C180HZ',
  'C120HZ',
  'C90HZ',
  'C60HZ',
  'C45HZ',
  'C30HZ',
  'C24HZ',
  'C15HZ',
  'C10HZ',
  'C5HZ',
  'C1HZ',
}

export class XpowerAppDetailRender extends Render {
  renderMainThread(
    xpowerAppDetailReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
    },
    row: TraceRow<XpowerAppDetailStruct>
  ): void {
    let checkedType = row.rowSettingCheckedBoxList;
    let checkedValue = row.rowSettingCheckBoxList;
    // offsetW控制图例的横向偏移量 确保图例不超过画布边界 因收藏和非收藏时泳道的宽度不一致 offsetW根据情况调整
    let offsetW: number = row.collect ? 60 : 300;
    let xpowerAppDetailList: XpowerAppDetailStruct[] = row.dataListCache.map((item) => ({ ...item }));
    xpowerAppDetailList.forEach((item) => {
      checkedValue?.forEach((type, index) => {
        if (!checkedType![index]) {
          // @ts-ignore
          item['c' + type] = 0;
        }
      });
    });
    setDataFrameAndHoverHtml(xpowerAppDetailList, row, checkedValue!);
    drawLoadingFrame(xpowerAppDetailReq.context, xpowerAppDetailList, row);
    setMaxEnergyInfo(xpowerAppDetailReq.context, xpowerAppDetailList);
    xpowerAppDetailReq.context.beginPath();
    let find = false;
    for (let re of xpowerAppDetailList) {
      XpowerAppDetailStruct.draw(xpowerAppDetailReq, re, row, isFrameContainPoint(re.frame!, row.hoverX, row.hoverY));
      if (row.isHover && re.frame && isFrameContainPoint(re.frame!, row.hoverX, row.hoverY)) {
        XpowerAppDetailStruct.hoverXpowerStruct = re;
        find = true;
      }
    }
    if (!find) {
      XpowerAppDetailStruct.hoverXpowerStruct = undefined;
    }
    xpowerAppDetailReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication && spApplication.hasAttribute('dark');
    drawLegend(xpowerAppDetailReq, checkedType!, checkedValue!, offsetW, isDark);
  }
}

function setDataFrameAndHoverHtml(
  filter: XpowerAppDetailStruct[],
  row: TraceRow<XpowerAppDetailStruct>,
  checkedValue: string[]
): void {
  filter.forEach((item) => {
    XpowerAppDetailStruct.setXPowerAppDetailFrame(
      item,
      5,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame
    );
    if (!item.hoverHtml) {
      XpowerAppDetailStruct.setHoverHtml(item, checkedValue);
    }
  });
}

export function drawLegend(
  req: { context: CanvasRenderingContext2D; useCache: boolean },
  checked: boolean[],
  checkedValue: string[],
  offsetW: number,
  isDark?: boolean
): void {
  let textList: string[] = [];
  checkedValue.forEach((item, index) => {
    if (checked[index]) {
      textList.push(item);
    }
  });
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = ColorUtils.colorForTid(checkedValue.indexOf(textList[index]));
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - offsetW;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index === 0) {
      let padding = 0;
      if (textList.length === 1) {
        padding = 20;
      }
      req!.context.fillRect(canvasEndX - textList.length * 60 - padding, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - textList.length * 60 + 10 - padding, 18);
      XpowerAppDetailStruct.currentTextWidth = canvasEndX - textList.length * 60 + 40 + text.width;
    } else {
      req!.context.fillRect(XpowerAppDetailStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], XpowerAppDetailStruct.currentTextWidth + 12, 18);
      XpowerAppDetailStruct.currentTextWidth = XpowerAppDetailStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

function setMaxEnergyInfo(context: CanvasRenderingContext2D, filter: XpowerAppDetailStruct[]): void {
  filter.forEach((item) => {
    item.total =
      item.c1hz +
      item.c5hz +
      item.c10hz +
      item.c15hz +
      item.c24hz +
      item.c30hz +
      item.c45hz +
      item.c60hz +
      item.c90hz +
      item.c120hz +
      item.c180hz;
  });
  let max = 0;
  filter.forEach((item) => {
    if (max < item.total) {
      max = item.total;
    }
  });
  XpowerAppDetailStruct.maxEnergy = max;
  let s = XpowerAppDetailStruct.maxEnergy + ' ms';
  let textMetrics = context.measureText(s);
  context.globalAlpha = 0.8;
  context.fillStyle = '#f0f0f0';
  context.fillRect(0, 5, textMetrics.width + 8, 18);
  context.globalAlpha = 1;
  context.fillStyle = '#333';
  context.textBaseline = 'middle';
  context.fillText(s, 4, 5 + 9);
}

export function XpowerAppDetailStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerAppDetailStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (
      clickRowType === TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY &&
      (XpowerAppDetailStruct.hoverXpowerStruct || entry)
    ) {
      XpowerAppDetailStruct.selectXpowerStruct = entry || XpowerAppDetailStruct.hoverXpowerStruct;
      sp.traceSheetEL?.displayXpowerDisplayData(XpowerAppDetailStruct.selectXpowerStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerAppDetailStruct extends BaseStruct {
  static rowHeight: number = 200;
  static maxEnergy: number = 0;
  static currentTextWidth: number = 0;

  startTime: number = 0;
  total: number = 0;
  hoverHtml: string = '';
  static hoverXpowerStruct: XpowerAppDetailStruct | undefined;
  static selectXpowerStruct: XpowerAppDetailStruct | undefined;

  c1hz: number = 0;
  c5hz: number = 0;
  c10hz: number = 0;
  c15hz: number = 0;
  c24hz: number = 0;
  c30hz: number = 0;
  c45hz: number = 0;
  c60hz: number = 0;
  c90hz: number = 0;
  c120hz: number = 0;
  c180hz: number = 0;

  static draw(
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    data: XpowerAppDetailStruct,
    row: TraceRow<XpowerAppDetailStruct>,
    ishover: boolean
  ): void {
    if (data.frame) {
      req!.context.globalAlpha = 0.8;
      req!.context.lineWidth = 1;
      this.currentTextWidth = 0;
      let c1Height = this.drawHistogram(req, data, -1, data.c1hz!, Type.C1HZ, row.frame);
      let c5Height = this.drawHistogram(req, data, c1Height, data.c5hz!, Type.C5HZ, row.frame);
      let c10Height = this.drawHistogram(req, data, c1Height - c5Height, data.c10hz!, Type.C10HZ, row.frame);
      let c15h = c1Height - c5Height - c10Height;
      let c15Height = this.drawHistogram(req, data, c15h, data.c15hz!, Type.C15HZ, row.frame);
      let c24h = c15h - c15Height;
      let c24Height = this.drawHistogram(req, data, c24h, data.c24hz!, Type.C24HZ, row.frame);
      let c30h = c24h - c24Height;
      let c30Height = this.drawHistogram(req, data, c30h, data.c30hz!, Type.C30HZ, row.frame);
      let c45h = c30h - c30Height;
      let c45Height = this.drawHistogram(req, data, c45h, data.c45hz!, Type.C45HZ, row.frame);
      let c60h = c45h - c45Height;
      let c60Height = this.drawHistogram(req, data, c60h, data.c60hz!, Type.C60HZ, row.frame);
      let c90h = c60h - c60Height;
      let c90Height = this.drawHistogram(req, data, c90h, data.c90hz!, Type.C90HZ, row.frame);
      let c120h = c90h - c90Height;
      let c120Height = this.drawHistogram(req, data, c120h, data.c120hz!, Type.C120HZ, row.frame);
      let c180hz = c120h - c120Height;
      let c180Height = this.drawHistogram(req, data, c180hz, data.c180hz!, Type.C180HZ, row.frame);
      let startNS = TraceRow.range!.startNS;
      let endNS = TraceRow.range!.endNS;
      let totalNS = TraceRow.range!.totalNS;
      if (
        (data.startTime === XpowerAppDetailStruct.hoverXpowerStruct?.startTime && ishover) ||
        (XpowerAppDetailStruct.selectXpowerStruct &&
          data.startTime === XpowerAppDetailStruct.selectXpowerStruct.startTime)
      ) {
        let endPointX = ns2x((data.startTime || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
        let startPointX = ns2x(data.startTime || 0, startNS, endNS, totalNS, row.frame);
        let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
        req.context.globalAlpha = 0.8;
        req!.context.lineWidth = 2;
        req.context.strokeStyle = '#9899a0';
        req!.context.strokeRect(startPointX, c180Height, frameWidth, data.frame.height);
      }
    }
    req!.context.globalAlpha = 0.8;
    req!.context.lineWidth = 1;
  }

  static drawHistogram(
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    data: XpowerAppDetailStruct,
    height: number,
    itemValue: number,
    type: number,
    rowFrame: Rect
  ): number {
    let endPointX = ns2x(
      data.startTime + 3000000000 || 0,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let startPointX = ns2x(
      data.startTime || 0,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    let histogramColor = ColorUtils.colorForTid(type);
    req!.context.fillStyle = histogramColor;
    let dataHeight: number = Math.floor(((itemValue || 0) * (this.rowHeight - 52)) / XpowerAppDetailStruct.maxEnergy);
    if (itemValue !== 0 && dataHeight < 15) {
      dataHeight = 15;
    }
    let drawStartY = 0;
    if (height === -1) {
      drawStartY = data.frame!.y + this.rowHeight - dataHeight + 4;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      data.frame!.y = drawStartY;
      data.frame!.height += dataHeight;
      return drawStartY;
    } else {
      drawStartY = height - dataHeight;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      if (type === Type.C180HZ) {
        data.frame!.y = drawStartY;
        data.frame!.height += dataHeight;
        return drawStartY;
      }
      data.frame!.y = drawStartY;
      data.frame!.height += dataHeight;
      return dataHeight;
    }
  }
  static setHoverHtml(node: XpowerAppDetailStruct, checkedValue: string[]): void {
    let hoverHtml = '';
    for (let key of checkedValue) {
      // @ts-ignore
      let value = node['c' + key];
      if (value !== 0) {
        hoverHtml += `<div style="display: grid; width:auto; grid-template-columns: 1fr 1fr;">
          <div style="text-align: left">${key}:&nbsp;&nbsp;</div>
          <div style="text-align: left">${value + ' ms'}</div>
        </div>`;
      }
    }
    node.hoverHtml = hoverHtml;
  }

  static setXPowerAppDetailFrame(
    node: XpowerAppDetailStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let startPointX: number;
    let endPointX: number;
    if ((node.startTime || 0) <= startNS) {
      startPointX = 0;
    } else {
      startPointX = ns2x(node.startTime, startNS, endNS, totalNS, frame);
    }
    if (node.startTime + 3000000000 > endNS) {
      endPointX = frame.width;
    } else {
      endPointX = ns2x(node.startTime + 3000000000, startNS, endNS, totalNS, frame);
    }
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    if (!node.frame) {
      node.frame = new Rect(0, 0, 0, 0);
    }
    node.frame.x = Math.floor(startPointX);
    node.frame.y = frame.y + padding;
    node.frame.width = Math.ceil(frameWidth);
    node.frame.height = Math.floor(frame.height - padding * 2);
  }
}
