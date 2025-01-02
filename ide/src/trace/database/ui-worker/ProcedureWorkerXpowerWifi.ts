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

export class XpowerWifiRender extends Render {
  renderMainThread(
    xpowerWifiReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      name: string;
    },
    row: TraceRow<XpowerWifiStruct>
  ): void {
    // offsetW控制图例的横向偏移量 确保图例不超过画布边界 因收藏和非收藏时泳道的宽度不一致 offsetW根据情况调整
    let offsetW: number = row.collect ? 40 : 260;
    let checkedType = row.rowSettingCheckedBoxList;
    let xpowerWifiList = row.dataListCache.map((item) => ({ ...item }));
    xpowerWifiList.forEach((item) => {
      if (!checkedType![0]) {
        item.tx = 0;
      }
      if (!checkedType![1]) {
        item.rx = 0;
      }
    });
    setDataFrameAndHoverHtml(xpowerWifiList, row, xpowerWifiReq.name);
    drawLoadingFrame(xpowerWifiReq.context, xpowerWifiList, row);
    setMaxInfo(xpowerWifiReq.context, xpowerWifiList, xpowerWifiReq.name);
    xpowerWifiReq.context.beginPath();
    let find = false;
    for (let re of xpowerWifiList) {
      XpowerWifiStruct.draw(xpowerWifiReq, re, row, isFrameContainPoint(re.frame!, row.hoverX, row.hoverY));
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        xpowerWifiReq.name === 'WIFIPackets'
          ? (XpowerWifiStruct.hoverPacketsStruct = re)
          : (XpowerWifiStruct.hoverBytesStruct = re);
        find = true;
      }
    }
    if (!find) {
      xpowerWifiReq.name === 'WIFIPackets'
        ? (XpowerWifiStruct.hoverPacketsStruct = undefined)
        : (XpowerWifiStruct.hoverBytesStruct = undefined);
    }
    xpowerWifiReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication.hasAttribute('dark');
    drawLegend(xpowerWifiReq, checkedType!, offsetW, isDark);
  }
}

function setDataFrameAndHoverHtml(filter: XpowerWifiStruct[], row: TraceRow<XpowerWifiStruct>, name: string): void {
  filter.forEach((item) => {
    XpowerWifiStruct.setXPowerStatisticFrame(
      item,
      5,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame
    );
    if ((name === 'WIFIPackets' && !item.hoverHtmlPackets) || (name === 'WIFIBytes' && !item.hoverHtmlBytes)) {
      XpowerWifiStruct.setHoverHtml(item, name);
    }
  });
}

export function drawLegend(
  req: { context: CanvasRenderingContext2D; useCache: boolean; name: string },
  checkedType: boolean[],
  offsetW: number,
  isDark?: boolean
): void {
  let textList: string[] = [];
  checkedType[0] && textList.push('tx');
  checkedType[1] && textList.push('rx');
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = textList[index] === 'tx' ? ColorUtils.colorForTid(index) : ColorUtils.colorForTid(10);
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - offsetW;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index === 0) {
      req!.context.fillRect(canvasEndX - textList.length * 60, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - textList.length * 60 + 10, 18);
      XpowerWifiStruct.currentTextWidth = canvasEndX - textList.length * 60 + 40 + text.width;
    } else {
      req!.context.fillRect(XpowerWifiStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], XpowerWifiStruct.currentTextWidth + 12, 18);
      XpowerWifiStruct.currentTextWidth = XpowerWifiStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

function setMaxInfo(context: CanvasRenderingContext2D, dataList: XpowerWifiStruct[], name: string): void {
  let maxNumber = 0;
  dataList.forEach((item) => {
    item.total = item.rx + item.tx;
    if (maxNumber < item.total) {
      maxNumber = item.total;
    }
  });
  XpowerWifiStruct.max = maxNumber;
  let s = name === 'WIFIBytes' ? XpowerWifiStruct.max + ' B' : XpowerWifiStruct.max.toString();
  let textMetrics = context.measureText(s);
  context.globalAlpha = 0.8;
  context.fillStyle = '#f0f0f0';
  context.fillRect(0, 5, textMetrics.width + 8, 18);
  context.globalAlpha = 1;
  context.fillStyle = '#333';
  context.textBaseline = 'middle';
  context.fillText(s, 4, 5 + 9);
}

export function XpowerWifiBytesStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerWifiStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_WIFI_BYTES && (XpowerWifiStruct.hoverBytesStruct || entry)) {
      XpowerWifiStruct.selectBytesXpowerStruct = entry || XpowerWifiStruct.hoverBytesStruct;
      sp.traceSheetEL?.displayXpowerBytesWifiData(XpowerWifiStruct.selectBytesXpowerStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export function XpowerWifiPacketsStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerWifiStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_WIFI_PACKETS && (XpowerWifiStruct.hoverPacketsStruct || entry)) {
      XpowerWifiStruct.selectPacketsXpowerStruct = entry || XpowerWifiStruct.hoverPacketsStruct;
      sp.traceSheetEL?.displayXpowerWifiPacketsData(XpowerWifiStruct.selectPacketsXpowerStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerWifiStruct extends BaseStruct {
  static rowHeight: number = 100;
  static currentTextWidth: number = 0;
  startTime: number = 0;
  rx: number = 0;
  tx: number = 0;
  static hoverPacketsStruct: XpowerWifiStruct | undefined;
  static hoverBytesStruct: XpowerWifiStruct | undefined;
  static selectPacketsXpowerStruct: XpowerWifiStruct | undefined;
  static selectBytesXpowerStruct: XpowerWifiStruct | undefined;

  hoverHtmlPackets: string = '';
  hoverHtmlBytes: string = '';
  total: number = 0;
  static max: number = 0;

  static draw(
    req: { context: CanvasRenderingContext2D; useCache: boolean; name: string },
    data: XpowerWifiStruct,
    row: TraceRow<XpowerWifiStruct>,
    ishover: boolean
  ): void {
    if (data.frame) {
      req!.context.globalAlpha = 0.8;
      req!.context.lineWidth = 1;
      this.currentTextWidth = 0;
      let txHeight = this.drawHistogram(req, data, -1, data.tx!, 'tx', row.frame);
      let rxHeight = this.drawHistogram(req, data, txHeight, data.rx!, 'rx', row.frame);
      let startNS = TraceRow.range!.startNS;
      let endNS = TraceRow.range!.endNS;
      let totalNS = TraceRow.range!.totalNS;
      let hoverTime =
        req.name === 'WIFIPackets'
          ? XpowerWifiStruct.hoverPacketsStruct?.startTime
          : XpowerWifiStruct.hoverBytesStruct?.startTime;
      let selectTime =
        req.name === 'WIFIPackets'
          ? XpowerWifiStruct.selectPacketsXpowerStruct?.startTime
          : XpowerWifiStruct.selectBytesXpowerStruct?.startTime;
      if ((data.startTime === hoverTime && ishover) || data.startTime === selectTime) {
        let endPointX = ns2x((data.startTime || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
        let startPointX = ns2x(data.startTime || 0, startNS, endNS, totalNS, row.frame);
        let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
        req.context.globalAlpha = 0.8;
        req!.context.lineWidth = 2;
        req.context.strokeStyle = '#9899a0';
        req!.context.strokeRect(startPointX, rxHeight, frameWidth, data.frame.height);
      }
    }
    req!.context.globalAlpha = 0.8;
    req!.context.lineWidth = 1;
  }

  static drawHistogram(
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    data: XpowerWifiStruct,
    height: number,
    itemValue: number,
    type: string,
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
    let histogramColor = type === 'tx' ? ColorUtils.colorForTid(0) : ColorUtils.colorForTid(10);
    req!.context.fillStyle = histogramColor;
    let dataHeight: number = Math.floor(((itemValue || 0) * (this.rowHeight - 40)) / XpowerWifiStruct.max);
    if (itemValue !== 0 && dataHeight < 10) {
      dataHeight = 10;
    }
    let drawStartY = 0;
    if (height === -1) {
      drawStartY = data.frame!.y + this.rowHeight - dataHeight;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      data.frame!.y = drawStartY;
      data.frame!.height += dataHeight;
      return drawStartY;
    } else {
      drawStartY = height - dataHeight;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      if (type === 'rx') {
        data.frame!.y = drawStartY;
        data.frame!.height += dataHeight;
        return drawStartY;
      }
      data.frame!.y = drawStartY;
      data.frame!.height += dataHeight;
      return dataHeight;
    }
  }

  static setHoverHtml(node: XpowerWifiStruct, name: string): void {
    let hoverHtml = '';
    if (name === 'WIFIPackets') {
      let hoverTx =
        node.tx !== 0
          ? `<div style="text-align: left">tx_packets:&nbsp;&nbsp;</div>
      <div style="text-align: left">${node.tx}</div>`
          : '';
      let hoverRx =
        node.rx !== 0
          ? `<div style="text-align: left">rx_packets:&nbsp;&nbsp;</div>
      <div style="text-align: left">${node.rx}</div>`
          : '';
      hoverHtml = `<div style="display: grid; width:auto; grid-template-columns: 1fr 1fr;">
        ${hoverTx}
        ${hoverRx}
      </div>`;
      node.hoverHtmlPackets = hoverHtml;
    } else {
      let hoverTx =
        node.tx !== 0
          ? `<div style="text-align: left">tx_bytes:&nbsp;&nbsp;</div>
      <div style="text-align: left">${node.tx + ' B'}</div>`
          : '';
      let hoverRx =
        node.rx !== 0
          ? `<div style="text-align: left">rx_bytes:&nbsp;&nbsp;</div>
      <div style="text-align: left">${node.rx + ' B'}</div>`
          : '';
      hoverHtml = `<div style="display: grid; width: auto; grid-template-columns: 1fr 1fr;">
        ${hoverTx}
        ${hoverRx}
        </div>`;
      node.hoverHtmlBytes = hoverHtml;
    }
  }

  static setXPowerStatisticFrame(
    node: XpowerWifiStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let startPointX: number;
    let endPointX: number;
    if ((node.startTime || 0) < startNS) {
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
