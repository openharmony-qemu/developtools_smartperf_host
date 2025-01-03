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
  'AUDIO',
  'BLUETOOTH',
  'CAMERA',
  'CPU',
  'DISPLAY',
  'FLASHLIGHT',
  'GPU',
  'LOCATION',
  'WIFISCAN',
  'WIFI',
  'MODEM',
}

export class XpowerStatisticRender extends Render {
  renderMainThread(
    xpowerStasticReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
    },
    row: TraceRow<XpowerStatisticStruct>
  ): void {
    // offsetW控制图例的横向偏移量 确保图例不超过画布边界 因收藏和非收藏时泳道的宽度不一致 offsetW根据情况调整
    let offsetW: number = row.collect ? 40 : 266;
    let checkedType = row.rowSettingCheckedBoxList;
    let checkedValue = row.rowSettingCheckBoxList;
    let xpowerStatisticList = row.dataListCache.filter(
      // @ts-ignore
      (item) => checkedType[checkedValue?.indexOf(item.typeStr)]
    );
    let xpowerStasticMap = new Map<number, XpowerStatisticStruct[]>();
    setGroupByTime(xpowerStasticMap, xpowerStatisticList);
    let filter = Array.from({ length: xpowerStasticMap.size }, () => new XpowerStatisticStruct());
    setDataFilter(filter, xpowerStasticMap);
    setDataFrameAndHoverHtml(filter, row, checkedValue!);
    drawLoadingFrame(xpowerStasticReq.context, filter, row);
    setMaxEnergyInfo(xpowerStasticReq.context, filter);
    xpowerStasticReq.context.beginPath();
    let find = false;
    for (let re of filter) {
      XpowerStatisticStruct.draw(xpowerStasticReq, re, row, isFrameContainPoint(re.frame!, row.hoverX, row.hoverY));
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        XpowerStatisticStruct.hoverXpowerStruct = re;
        find = true;
      }
    }
    if (!find) {
      XpowerStatisticStruct.hoverXpowerStruct = undefined;
    }
    xpowerStasticReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication && spApplication.hasAttribute('dark');
    drawLegend(xpowerStasticReq, checkedType!, checkedValue!, offsetW, isDark);
  }
}

function setGroupByTime(
  xpowerStasticMap: Map<number, XpowerStatisticStruct[]>,
  xpowerStatisticList: XpowerStatisticStruct[]
): void {
  xpowerStatisticList.forEach((item) => {
    if (xpowerStasticMap.has(item.startTime)) {
      let data = xpowerStasticMap.get(item.startTime);
      data!.push(item);
      xpowerStasticMap.set(item.startTime, data!);
    } else {
      xpowerStasticMap.set(item.startTime, []);
      let data = xpowerStasticMap.get(item.startTime);
      data!.push(item);
      xpowerStasticMap.set(item.startTime, data!);
    }
  });
}

function setDataFilter(
  filter: XpowerStatisticStruct[],
  xpowerStasticMap: Map<number, XpowerStatisticStruct[]>
): XpowerStatisticStruct[] {
  let index = 0;
  xpowerStasticMap.forEach((value, key) => {
    const entry = filter[index];
    entry.startTime = key;
    entry.totalEnergy = 0;
    value.forEach((it) => updateEntry(entry, it));
    index += 1;
  });
  return filter;
}

function updateEntry(entry: XpowerStatisticStruct, it: XpowerStatisticStruct): void {
  switch (it.typeStr) {
    case 'audio':
      entry.audio = it.energy;
      entry.audioDur = it.dur;
      break;
    case 'bluetooth':
      entry.bluetooth = it.energy;
      entry.bluetoothDur = it.dur;
      break;
    case 'camera':
      entry.camera = it.energy;
      entry.cameraDur = it.dur;
      break;
    case 'cpu':
      entry.cpu = it.energy;
      entry.cpuDur = it.dur;
      break;
    case 'display':
      entry.display = it.energy;
      entry.displayDur = it.dur;
      break;
    case 'flashlight':
      entry.flashlight = it.energy;
      entry.flashlightDur = it.dur;
      break;
    case 'gpu':
      entry.gpu = it.energy;
      entry.gpuDur = it.dur;
      break;
    case 'location':
      entry.location = it.energy;
      entry.locationDur = it.dur;
      break;
    case 'wifiscan':
      entry.wifiscan = it.energy;
      entry.wifiscanDur = it.dur;
      break;
    case 'wifi':
      entry.wifi = it.energy;
      entry.wifiDur = it.dur;
      break;
    case 'modem':
      entry.modem = it.energy;
      entry.modemDur = it.dur;
      break;
  }
  entry.totalEnergy += it.energy;
}

function setDataFrameAndHoverHtml(
  filter: XpowerStatisticStruct[],
  row: TraceRow<XpowerStatisticStruct>,
  text: string[]
): void {
  filter.forEach((item) => {
    XpowerStatisticStruct.setXPowerStatisticFrame(
      item,
      5,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame
    );
    if (item.hoverHtml === '') {
      XpowerStatisticStruct.setHoverHtml(item, text);
    }
  });
}

function setMaxEnergyInfo(context: CanvasRenderingContext2D, filter: XpowerStatisticStruct[]): void {
  XpowerStatisticStruct.computeMaxEnergy(filter);
  let s = XpowerStatisticStruct.maxEnergy + ' mAh';
  let textMetrics = context.measureText(s);
  context.globalAlpha = 0.8;
  context.fillStyle = '#f0f0f0';
  context.fillRect(0, 5, textMetrics.width + 8, 18);
  context.globalAlpha = 1;
  context.fillStyle = '#333';
  context.textBaseline = 'middle';
  context.fillText(s, 4, 5 + 9);
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
      textList.push(item.toUpperCase());
    }
  });
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = ColorUtils.colorForTid(checkedValue.indexOf(textList[index].toLowerCase()));
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - offsetW;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index === 0) {
      req!.context.fillRect(canvasEndX - textList.length * 80, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - textList.length * 80 + 10, 18);
      XpowerStatisticStruct.currentTextWidth = canvasEndX - textList.length * 80 + 40 + text.width;
    } else {
      req!.context.fillRect(XpowerStatisticStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], XpowerStatisticStruct.currentTextWidth + 12, 18);
      XpowerStatisticStruct.currentTextWidth = XpowerStatisticStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

export function XpowerStatisticStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: TraceRow<XpowerStatisticStruct>,
  entry?: XpowerStatisticStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_STATISTIC && (XpowerStatisticStruct.hoverXpowerStruct || entry)) {
      XpowerStatisticStruct.selectXpowerStruct = entry || XpowerStatisticStruct.hoverXpowerStruct;
      sp.traceSheetEL?.displayXpowerStatisticData(XpowerStatisticStruct.selectXpowerStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerStatisticStruct extends BaseStruct {
  static rowHeight: number = 200;
  static maxEnergy: number = 0;
  static currentTextWidth: number = 0;
  type: number = 0;
  typeStr: string = '';
  startTime: number = 0;
  dur: number = 0;
  energy: number = 0;
  static hoverXpowerStruct: XpowerStatisticStruct | undefined;
  static selectXpowerStruct: XpowerStatisticStruct | undefined;

  audio: number = 0;
  bluetooth: number = 0;
  camera: number = 0;
  cpu: number = 0;
  display: number = 0;
  flashlight: number = 0;
  gpu: number = 0;
  location: number = 0;
  wifiscan: number = 0;
  wifi: number = 0;
  modem: number = 0;

  audioDur: number = 0;
  bluetoothDur: number = 0;
  cameraDur: number = 0;
  cpuDur: number = 0;
  displayDur: number = 0;
  flashlightDur: number = 0;
  gpuDur: number = 0;
  locationDur: number = 0;
  wifiscanDur: number = 0;
  wifiDur: number = 0;
  modemDur: number = 0;

  totalEnergy: number = 0;
  hoverHtml: string = '';

  static draw(
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    data: XpowerStatisticStruct,
    row: TraceRow<XpowerStatisticStruct>,
    isHover: boolean
  ): void {
    if (data.frame) {
      req!.context.globalAlpha = 0.8;
      req!.context.lineWidth = 1;
      this.currentTextWidth = 0;
      let cpuHeight = this.drawHistogram(req, data, -1, data.cpu!, Type.CPU, row.frame);
      let locationHeight = this.drawHistogram(req, data, cpuHeight, data.location!, Type.LOCATION, row.frame);
      let gpuHeight = this.drawHistogram(req, data, cpuHeight - locationHeight, data.gpu!, Type.GPU, row.frame);
      let dHight = cpuHeight - locationHeight - gpuHeight;
      let displayHeight = this.drawHistogram(req, data, dHight, data.display!, Type.DISPLAY, row.frame);
      let cHight = dHight - displayHeight;
      let cameraHeight = this.drawHistogram(req, data, cHight, data.camera!, Type.CAMERA, row.frame);
      let bHeight = cHight - cameraHeight;
      let bluetoothHeight = this.drawHistogram(req, data, bHeight, data.bluetooth!, Type.BLUETOOTH, row.frame);
      let fHeight = bHeight - bluetoothHeight;
      let flashlightHeight = this.drawHistogram(req, data, fHeight, data.flashlight!, Type.FLASHLIGHT, row.frame);
      let aHeight = fHeight - flashlightHeight;
      let audioHeight = this.drawHistogram(req, data, aHeight, data.audio!, Type.AUDIO, row.frame);
      let wsHeight = aHeight - audioHeight;
      let wifiScanHeight = this.drawHistogram(req, data, wsHeight, data.wifiscan!, Type.WIFISCAN, row.frame);
      let mHeight = wsHeight - wifiScanHeight;
      let modemHeight = this.drawHistogram(req, data, mHeight, data.modem!, Type.MODEM, row.frame);
      let wHeight = mHeight - modemHeight;
      let wifiHeight = this.drawHistogram(req, data, wHeight, data.wifi!, Type.WIFI, row.frame);
      this.drawHoverFrame(data, isHover, wifiHeight, req, row);
    }
    req!.context.globalAlpha = 0.8;
    req!.context.lineWidth = 1;
  }

  static drawHoverFrame(
    data: XpowerStatisticStruct,
    isHover: boolean,
    wifiHeight: number,
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    row: TraceRow<XpowerStatisticStruct>
  ): void {
    let startNS = TraceRow.range!.startNS;
    let endNS = TraceRow.range!.endNS;
    let totalNS = TraceRow.range!.totalNS;
    if (
      (data.startTime === XpowerStatisticStruct.hoverXpowerStruct?.startTime && isHover) ||
      (XpowerStatisticStruct.selectXpowerStruct &&
        data.startTime === XpowerStatisticStruct.selectXpowerStruct?.startTime)
    ) {
      let endPointX = ns2x((data.startTime || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
      let startPointX = ns2x(data.startTime || 0, startNS, endNS, totalNS, row.frame);
      let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
      req.context.globalAlpha = 1;
      req!.context.lineWidth = 2;
      req.context.strokeStyle = '#9899a0';
      req!.context.strokeRect(startPointX, wifiHeight, frameWidth, data.frame!.height);
    }
  }

  static drawHistogram(
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    data: XpowerStatisticStruct,
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
    let dataHeight: number = Math.floor(((itemValue || 0) * (this.rowHeight - 40)) / XpowerStatisticStruct.maxEnergy);
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
      if (type === Type.WIFI) {
        data.frame!.y = drawStartY;
        data.frame!.height += dataHeight;
        return drawStartY;
      }
      data.frame!.y = drawStartY;
      data.frame!.height += dataHeight;
      return dataHeight;
    }
  }
  static setHoverHtml(node: XpowerStatisticStruct, text: string[]): void {
    let hoverHtml = '';
    for (let key of text) {
      // @ts-ignore
      let energy = node[key];
      // @ts-ignore
      let dur = node[key + 'Dur'];
      if (energy !== 0) {
        hoverHtml += `<div style=" display: flex; flex-wrap: nowrap; justify-content: space-between;">
        <div style="line-height: 15px; flex-grow: 2; flex-shrink: 1; flex-basis: auto;">${key}:&nbsp;&nbsp;</div>
        <div style="line-height: 15px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">${
          energy || 0
        } mAh&nbsp;&nbsp;</div>
        <div style="line-height: 15px; flex-grow: 1; flex-shrink: 1; flex-basis: auto;">&nbsp;&nbsp;${dur + ' ms'}</div>
    </div>`;
      }
    }
    node.hoverHtml = hoverHtml;
  }

  static computeMaxEnergy(dataList: XpowerStatisticStruct[]): void {
    let maxEnergy = 0;
    dataList.forEach((item) => {
      if (maxEnergy < item.totalEnergy) {
        maxEnergy = item.totalEnergy;
      }
    });
    XpowerStatisticStruct.maxEnergy = maxEnergy;
  }

  static setXPowerStatisticFrame(
    node: XpowerStatisticStruct,
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
