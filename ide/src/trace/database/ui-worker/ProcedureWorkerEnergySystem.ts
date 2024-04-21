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
  drawLoadingFrame,
  isFrameContainPoint,
  ns2x,
  Rect,
  Render,
  RequestMessage,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class EnergySystemRender extends Render {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
    },
    row: TraceRow<EnergySystemStruct>
  ): void {
    let systemList = row.dataList;
    let systemFilter = row.dataListCache;
    system(
      systemList,
      systemFilter,
      TraceRow.range!.startNS || 0,
      TraceRow.range!.endNS || 0,
      TraceRow.range!.totalNS || 0,
      row.frame,
      req.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(req.context, row.dataListCache, row);
    drawProcedureWorkerEnergy(req, systemFilter, row);
  }
}

function drawProcedureWorkerEnergy(
  req: {
    useCache: boolean;
    context: CanvasRenderingContext2D;
    type: string;
  },
  systemFilter: Array<EnergySystemStruct>,
  row: TraceRow<EnergySystemStruct>
): void {
  req.context.beginPath();
  let find = false;
  let energySystemData: unknown = {};
  for (let i = 0; i < systemFilter.length; i++) {
    let energySysStruct = systemFilter[i];
    EnergySystemStruct.draw(req.context, energySysStruct);
    if (row.isHover && energySysStruct.frame && isFrameContainPoint(energySysStruct.frame, row.hoverX, row.hoverY)) {
      EnergySystemStruct.hoverEnergySystemStruct = energySysStruct;
      if (energySysStruct.type === 0) {
        if (energySysStruct.count !== undefined) {
          // @ts-ignore
          energySystemData.workScheduler = energySysStruct.count;
        } else {
          // @ts-ignore
          energySystemData.workScheduler = '0';
        }
      }
      if (energySysStruct.type === 1) {
        if (energySysStruct.count !== undefined) {
          // @ts-ignore
          energySystemData.power = energySysStruct.count + '';
        } else {
          // @ts-ignore
          energySystemData.power = '0';
        }
      }
      if (energySysStruct.type === 2) {
        if (energySysStruct.count !== undefined) {
          // @ts-ignore
          energySystemData.location = energySysStruct.count + '';
        } else {
          // @ts-ignore
          energySystemData.location = '0';
        }
      }
      find = true;
    }
  }
  if (!find && row.isHover) {
    EnergySystemStruct.hoverEnergySystemStruct = undefined;
  }
  if (EnergySystemStruct.hoverEnergySystemStruct) {
    EnergySystemStruct.hoverEnergySystemStruct!.workScheduler =
      // @ts-ignore
      energySystemData.workScheduler === undefined ? '0' : energySystemData.workScheduler;
    EnergySystemStruct.hoverEnergySystemStruct!.power =
      // @ts-ignore
      energySystemData.power === undefined ? '0' : energySystemData.power;
    EnergySystemStruct.hoverEnergySystemStruct!.location =
      // @ts-ignore
      energySystemData.location === undefined ? '0' : energySystemData.location;
  }
  let spApplication = document.getElementsByTagName('sp-application')[0];
  let isDark = spApplication.hasAttribute('dark');
  drawLegend(req, isDark);
  req.context.closePath();
}

export function drawLegend(
  req: {
    useCache: boolean;
    context: CanvasRenderingContext2D;
    type: string;
  },
  isDark?: boolean
): void {
  let textList = ['WORKSCHEDULER', 'POWER_RUNNINGLOCK', 'LOCATION'];
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = EnergySystemStruct.getColor(index);
    let canvasEndX = req.context.canvas.clientWidth - EnergySystemStruct.OFFSET_WIDTH;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (textList[index] === 'WORKSCHEDULER') {
      req.context.fillRect(canvasEndX - EnergySystemStruct.itemNumber * 120, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.textBaseline = 'middle';
      req.context.fillStyle = textColor;
      req.context.fillText(textList[index], canvasEndX - EnergySystemStruct.itemNumber * 120 + 10, 18);
      EnergySystemStruct.currentTextWidth = canvasEndX - EnergySystemStruct.itemNumber * 120 + 40 + text.width;
    } else {
      req.context.fillRect(EnergySystemStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], EnergySystemStruct.currentTextWidth + 12, 18);
      EnergySystemStruct.currentTextWidth = EnergySystemStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

export function systemData(
  data: Array<EnergySystemStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  for (let index = 0; index < data.length; index++) {
    let systemItem = data[index];
    if (index === data.length - 1) {
      systemItem.dur = (endNS || 0) - (systemItem.startNs || 0);
    } else {
      systemItem.dur = (data[index + 1].startNs! || 0) - (systemItem.startNs! || 0);
    }
    if (systemItem.count === 0) {
      systemItem.dur = 0;
    }
    if (
      (systemItem.startNs || 0) + (systemItem.dur || 0) > (startNS || 0) &&
      (systemItem.startNs || 0) < (endNS || 0)
    ) {
      EnergySystemStruct.setSystemFrame(systemItem, 10, startNS || 0, endNS || 0, totalNS || 0, frame);
    }
  }
}

export function system(
  systemList: Array<EnergySystemStruct>,
  res: Array<EnergySystemStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && res.length > 0) {
    let lockData: EnergySystemStruct[] = [];
    let locationData: EnergySystemStruct[] = [];
    let workData: EnergySystemStruct[] = [];
    res.forEach((item) => {
      if (item.dataType === 1) {
        lockData.push(item);
      } else if (item.dataType === 2) {
        locationData.push(item);
      } else {
        workData.push(item);
      }
    });
    if (lockData.length > 0) {
      systemData(lockData, startNS, endNS, totalNS, frame);
    }
    if (locationData.length > 0) {
      systemData(locationData, startNS, endNS, totalNS, frame);
    }
    if (workData.length > 0) {
      systemData(workData, startNS, endNS, totalNS, frame);
    }
    return;
  }
  res.length = 0;
  setEnergySystemFilter(systemList, res, startNS, endNS, totalNS, frame);
}
function setEnergySystemFilter(
  systemList: Array<unknown>,
  res: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (systemList) {
    for (let i = 0; i < 3; i++) {
      let arr = systemList[i];
      if (arr) {
        //@ts-ignore
        for (let index = 0; index < arr.length; index++) {
          //@ts-ignore
          let item = arr[index];
          //@ts-ignore
          if (index === arr.length - 1) {
            item.dur = endNS - (item.startNs || 0);
          } else {
            //@ts-ignore
            item.dur = (arr[index + 1].startNs || 0) - (item.startNs || 0);
          }
          if (item.count === 0) {
            item.dur = 0;
          }
          if ((item.startNs || 0) + (item.dur || 0) > startNS && (item.startNs || 0) < endNS) {
            EnergySystemStruct.setSystemFrame(item, 10, startNS, endNS, totalNS, frame);
            res.push(item);
          }
        }
      }
    }
  }
}

export class EnergySystemStruct extends BaseStruct {
  static hoverEnergySystemStruct: EnergySystemStruct | undefined;
  static selectEnergySystemStruct: EnergySystemStruct | undefined;
  static itemNumber: number = 3;
  static currentTextWidth: number = 0;
  static OFFSET_WIDTH: number = 266;
  type: number | undefined;
  startNs: number | undefined;
  dur: number | undefined;
  count: number | undefined;
  token: number | undefined;
  workScheduler: string | undefined;
  power: string | undefined;
  location: string | undefined;
  id: number | undefined;
  eventName: string | undefined;
  eventValue: string | undefined;
  appKey: string | undefined;
  dataType: number | undefined;

  static draw(energySystemContext: CanvasRenderingContext2D, data: EnergySystemStruct): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      energySystemContext.globalAlpha = 1.0;
      energySystemContext.lineWidth = 1;
      energySystemContext.fillStyle = this.getColor(data.type!);
      energySystemContext.strokeStyle = this.getColor(data.type!);
      energySystemContext.fillRect(data.frame.x, data.frame.y + 4, width, data.frame.height);
    }
    energySystemContext.globalAlpha = 1.0;
    energySystemContext.lineWidth = 1;
  }

  static setSystemFrame(
    systemNode: EnergySystemStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let systemStartPointX: number;
    let systemEndPointX: number;
    if ((systemNode.startNs || 0) < startNS) {
      systemStartPointX = 0;
    } else {
      systemStartPointX = ns2x(systemNode.startNs || 0, startNS, endNS, totalNS, frame);
    }
    if ((systemNode.startNs || 0) + (systemNode.dur || 0) > endNS) {
      systemEndPointX = frame.width;
    } else {
      systemEndPointX = ns2x((systemNode.startNs || 0) + (systemNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number = systemEndPointX - systemStartPointX <= 1 ? 1 : systemEndPointX - systemStartPointX;
    if (!systemNode.frame) {
      systemNode.frame = new Rect(0, 0, 0, 0);
    }
    systemNode.frame.x = Math.floor(systemStartPointX);
    if (systemNode.type === 0) {
      systemNode.frame.y = frame.y + padding * 2.5;
    } else if (systemNode.type === 1) {
      systemNode.frame.y = frame.y + padding * 4.5;
    } else if (systemNode.type === 2) {
      systemNode.frame.y = frame.y + padding * 6.5;
    }
    systemNode.frame.width = Math.ceil(frameWidth);
    systemNode.frame.height = Math.floor(padding);
  }

  static getColor(textItem: number): string {
    switch (textItem) {
      case 0:
        return '#E64566';
      case 1:
        return '#FFC880';
      default:
        return '#564AF7';
    }
  }
}
