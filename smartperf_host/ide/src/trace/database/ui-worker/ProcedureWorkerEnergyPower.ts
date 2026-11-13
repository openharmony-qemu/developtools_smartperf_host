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

import {
  BaseStruct,
  ns2x,
  Render,
  RequestMessage,
  isFrameContainPoint,
  drawLoadingFrame,
  Rect,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class EnergyPowerRender extends Render {
  renderMainThread(
    powerReq: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
    row: TraceRow<EnergyPowerStruct>
  ): void {
    let list = row.dataList;
    let filter = row.dataListCache;
    power(
      list,
      filter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      powerReq.useCache || !TraceRow.range!.refresh,
      powerReq.appName
    );
    drawLoadingFrame(powerReq.context, row.dataListCache, row);
    powerReq.context.beginPath();
    let find = false;
    for (let i = 0; i < list.length; i++) {
      let re = list[i];
      EnergyPowerStruct.draw(powerReq, i, re, row);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        EnergyPowerStruct.hoverEnergyPowerStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      EnergyPowerStruct.hoverEnergyPowerStruct = undefined;
    }
    TraceRow.range!.refresh = true;
    if (EnergyPowerStruct.maxPower !== 0) {
      let s = EnergyPowerStruct.maxPower + 'mAs';
      let textMetrics = powerReq.context.measureText(s);
      powerReq.context.globalAlpha = 1.0;
      powerReq.context.fillStyle = '#f0f0f0';
      powerReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
      powerReq.context.globalAlpha = 1;
      powerReq.context.fillStyle = '#333';
      powerReq.context.textBaseline = 'middle';
      powerReq.context.fillText(s, 4, 5 + 9);
    }
    powerReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication.hasAttribute('dark');
    drawLegend(powerReq, isDark);
  }
}

export function drawLegend(
  req: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
  isDark?: boolean
): void {
  let textList = ['CPU', 'LOCATION', 'GPU', 'DISPLAY', 'CAMERA', 'BLUETOOTH', 'FLASHLIGHT', 'AUDIO', 'WIFISCAN'];
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = EnergyPowerStruct.getHistogramColor(textList[index]);
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - EnergyPowerStruct.OFFSET_WIDTH;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index === 0) {
      req!.context.fillRect(canvasEndX - EnergyPowerStruct.powerItemNumber * 80, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - EnergyPowerStruct.powerItemNumber * 80 + 10, 18);
      EnergyPowerStruct.currentTextWidth = canvasEndX - EnergyPowerStruct.powerItemNumber * 80 + 40 + text.width;
    } else {
      req!.context.fillRect(EnergyPowerStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], EnergyPowerStruct.currentTextWidth + 12, 18);
      EnergyPowerStruct.currentTextWidth = EnergyPowerStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

export function power(
  list: Array<EnergyPowerStruct>,
  res: Array<EnergyPowerStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean,
  appName: string
): void {
  EnergyPowerStruct.maxPower = 0;
  list.length = 0;
  let firstData = [];
  if (use && res.length > 0) {
    for (let index = 0; index < res.length; index++) {
      let item = res[index];
      //@ts-ignore
      let obj = item[appName];
      if (obj !== undefined && obj.ts + 1000000000 > (startNS || 0) && (obj.ts || 0) < (endNS || 0)) {
        firstData.push(obj);
      }
    }
    let array = firstData.sort((a, b) => a.ts - b.ts);
    setFirstDataArray(array, list);
    computeMaxPower(array, list, startNS, endNS, totalNS, frame);
  }
}

function setFirstDataArray(array: EnergyPowerStruct[], list: Array<EnergyPowerStruct>): void {
  array.forEach((item) => {
    if (
      list.length > 0 &&
      item.ts + 500000000 >= list[list.length - 1].ts &&
      item.ts - 500000000 <= list[list.length - 1].ts
    ) {
      list[list.length - 1].cpu = item.cpu === 0 ? list[list.length - 1].cpu : item.cpu;
      list[list.length - 1].location = item.location === 0 ? list[list.length - 1].location : item.location;
      list[list.length - 1].gpu = item.gpu === 0 ? list[list.length - 1].gpu : item.gpu;
      list[list.length - 1].display = item.display === 0 ? list[list.length - 1].display : item.display;
      list[list.length - 1].camera = item.camera === 0 ? list[list.length - 1].camera : item.camera;
      list[list.length - 1].bluetooth = item.bluetooth === 0 ? list[list.length - 1].bluetooth : item.bluetooth;
      list[list.length - 1].flashlight = item.flashlight === 0 ? list[list.length - 1].flashlight : item.flashlight;
      list[list.length - 1].audio = item.audio === 0 ? list[list.length - 1].audio : item.audio;
      list[list.length - 1].wifiscan = item.wifiscan === 0 ? list[list.length - 1].wifiscan : item.wifiscan;
    } else {
      list.push(item);
    }
  });
}

function computeMaxPower(
  array: Array<EnergyPowerStruct>,
  list: Array<EnergyPowerStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  array.forEach((item) => {
    if (list.indexOf(item) >= 0) {
      EnergyPowerStruct.setPowerFrame(item, 5, startNS || 0, endNS || 0, totalNS || 0, frame);
      let max =
        (item.cpu || 0) +
        (item.location || 0) +
        (item.gpu || 0) +
        (item.display || 0) +
        (item.camera || 0) +
        (item.bluetooth || 0) +
        (item.flashlight || 0) +
        (item.audio || 0) +
        (item.wifiscan || 0);
      if (max > EnergyPowerStruct.maxPower) {
        EnergyPowerStruct.maxPower = max;
      }
    }
  });
}

export class EnergyPowerStruct extends BaseStruct {
  static maxPower: number = 0;
  static maxPowerName: string = '0';
  static powerItemNumber: number = 9;
  static currentTextWidth: number = 0;
  static rowHeight: number = 200;
  static appName: string | undefined;
  static hoverEnergyPowerStruct: EnergyPowerStruct | undefined;
  static selectEnergyPowerStruct: EnergyPowerStruct | undefined;
  static OFFSET_WIDTH: number = 266;
  name: string | undefined;
  appKey: string | undefined;
  eventValue: string | undefined;
  eventName: string | undefined;
  id: number | undefined;
  ts: number = 0;
  cpu: number = 0;
  location: number = 0;
  gpu: number = 0;
  display: number = 0;
  camera: number = 0;
  bluetooth: number = 0;
  flashlight: number = 0;
  audio: number = 0;
  wifiscan: number = 0;

  static draw(
    req: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
    index: number,
    data: EnergyPowerStruct,
    row: TraceRow<EnergyPowerStruct>
  ): void {
    if (data.frame) {
      req!.context.globalAlpha = 1.0;
      req!.context.lineWidth = 1;
      this.currentTextWidth = 0;
      let cpuHeight = this.drawHistogram(req, data, -1, data.cpu!, 'CPU', row.frame);
      let locationHeight = this.drawHistogram(req, data, cpuHeight, data.location!, 'LOCATION', row.frame);
      let gpuHeight = this.drawHistogram(req, data, cpuHeight - locationHeight, data.gpu!, 'GPU', row.frame);
      let dHight = cpuHeight - locationHeight - gpuHeight;
      let displayHeight = this.drawHistogram(req, data, dHight, data.display!, 'DISPLAY', row.frame);
      let cHight = cpuHeight - locationHeight - gpuHeight - displayHeight;
      let cameraHeight = this.drawHistogram(req, data, cHight, data.camera!, 'CAMERA', row.frame);
      let bHeight = cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight;
      let bluetoothHeight = this.drawHistogram(req, data, bHeight, data.bluetooth!, 'BLUETOOTH', row.frame);
      let fHeight = cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight - bluetoothHeight;
      let flashlightHeight = this.drawHistogram(req, data, fHeight, data.flashlight!, 'FLASHLIGHT', row.frame);
      let aHeight =
        cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight - bluetoothHeight - flashlightHeight;
      let audioHeight = this.drawHistogram(req, data, aHeight, data.audio!, 'AUDIO', row.frame);
      let wHeight =
        cpuHeight -
        locationHeight -
        gpuHeight -
        displayHeight -
        cameraHeight -
        bluetoothHeight -
        flashlightHeight -
        audioHeight;
      let wifiHeight = this.drawHistogram(req, data, wHeight, data.wifiscan!, 'WIFISCAN', row.frame);
      let maxPointY = this.drawPolyline(req, index, data, row.frame, wifiHeight);
      let startNS = TraceRow.range!.startNS;
      let endNS = TraceRow.range!.endNS;
      let totalNS = TraceRow.range!.totalNS;
      if (data.ts === EnergyPowerStruct.hoverEnergyPowerStruct?.ts) {
        let endPointX = ns2x((data.ts || 0) + 500000000, startNS, endNS, totalNS, row.frame);
        let startPointX = ns2x((data.ts || 0) - 500000000, startNS, endNS, totalNS, row.frame);
        let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
        req.context.globalAlpha = 1;
        req!.context.lineWidth = 2;
        req.context.fillStyle = '#333';
        req!.context.strokeRect(startPointX, maxPointY, frameWidth, req.context.canvas.width - maxPointY);
      }
    }
    req!.context.globalAlpha = 1.0;
    req!.context.lineWidth = 1;
  }

  static drawHistogram(
    req: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
    data: EnergyPowerStruct,
    height: number,
    itemValue: number,
    textItem: string,
    rowFrame: Rect
  ): number {
    let endPointX = ns2x(
      (data.ts || 0) + 500000000,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let startPointX = ns2x(
      (data.ts || 0) - 500000000,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    let histogramColor = this.getHistogramColor(textItem);
    req!.context.fillStyle = histogramColor;
    req!.context.strokeStyle = histogramColor;
    let dataHeight: number = Math.floor(((itemValue || 0) * (this.rowHeight - 40)) / EnergyPowerStruct.maxPower);
    if (itemValue !== 0 && dataHeight < 15) {
      dataHeight = 15;
    }
    let drawStartY = 0;

    if (height === -1) {
      drawStartY = data.frame!.y + this.rowHeight - dataHeight + 4;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      return drawStartY;
    } else {
      drawStartY = height - dataHeight;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      if (textItem === 'WIFISCAN') {
        return drawStartY;
      }
      return dataHeight;
    }
  }

  static drawPolyline(
    req: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
    index: number,
    data: EnergyPowerStruct,
    rowFrame: Rect,
    totalHeight: number
  ): number {
    let pointX = ns2x(data.ts || 0, TraceRow.range!.startNS, TraceRow.range!.endNS, TraceRow.range!.totalNS, rowFrame);
    let maxHeight =
      (data.cpu || 0) +
      (data.location || 0) +
      (data.gpu || 0) +
      (data.display || 0) +
      (data.camera || 0) +
      (data.bluetooth || 0) +
      (data.flashlight || 0) +
      (data.audio || 0) +
      (data.wifiscan || 0);
    let drawHeight: number = Math.floor(((maxHeight || 0) * (this.rowHeight - 40)) / EnergyPowerStruct.maxPower);
    let drawY = data.frame!.y + this.rowHeight - drawHeight + 5;
    req!.context.fillStyle = '#ED6F21';
    req!.context.strokeStyle = '#ED6F21';

    if (index === 0) {
      req.context.beginPath();
      req.context.arc(pointX, totalHeight, 4, 0, 2 * Math.PI);
      req.context.fill();
      req.context.moveTo(pointX, totalHeight);
    } else {
      req.context.lineTo(pointX, totalHeight);
      req.context.stroke();
      req.context.beginPath();
      req.context.arc(pointX, totalHeight, 4, 0, 2 * Math.PI);
      req.context.fill();
    }
    return totalHeight;
  }

  static setPowerFrame(
    powerNode: unknown,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: unknown
  ): void {
    let startPointX: number;
    let endPointX: number;
    //@ts-ignore
    if ((powerNode.ts || 0) < startNS) {
      startPointX = 0;
    } else {
      //@ts-ignore
      startPointX = ns2x((powerNode.ts || 0) - 500000000, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if (powerNode.ts + 500000000 > endNS) {
      //@ts-ignore
      endPointX = frame.width;
    } else {
      //@ts-ignore
      endPointX = ns2x(powerNode.ts + 500000000, startNS, endNS, totalNS, frame);
    }
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    //@ts-ignore
    if (!powerNode.frame) {
      //@ts-ignore
      powerNode.frame = {};
    }
    //@ts-ignore
    powerNode.frame.x = Math.floor(startPointX);
    //@ts-ignore
    powerNode.frame.y = frame.y + padding;
    //@ts-ignore
    powerNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    powerNode.frame.height = Math.floor(frame.height - padding * 2);
  }

  static getHistogramColor(textItem: string): string {
    switch (textItem) {
      case 'CPU':
        return '#92D6CC';
      case 'LOCATION':
        return '#61CFBE';
      case 'GPU':
        return '#86C5E3';
      case 'DISPLAY':
        return '#46B1E3';
      case 'CAMERA':
        return '#C386F0';
      case 'BLUETOOTH':
        return '#8981F7';
      case 'AUDIO':
        return '#AC49F5';
      case 'WIFISCAN':
        return '#92C4BD';
      default:
        return '#564AF7';
    }
  }
}
