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

import { BaseStruct, isFrameContainPoint, drawLoadingFrame, ns2x, Render, Rect } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class EnergyStateRender extends Render {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
      maxState: number;
      maxStateName: string;
    },
    row: TraceRow<EnergyStateStruct>
  ): void {
    let stateList = row.dataList;
    let stateFilter = row.dataListCache;
    state(
      stateList,
      stateFilter,
      TraceRow.range!.startNS || 0,
      TraceRow.range!.endNS || 0,
      TraceRow.range!.totalNS || 0,
      row.frame,
      req.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(req.context, row.dataListCache, row);
    req.context.beginPath();
    let find = false;
    for (let i = 0; i < stateFilter.length; i++) {
      let re = stateFilter[i];
      EnergyStateStruct.draw(req.context, re, req.maxState, req.maxStateName);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        EnergyStateStruct.hoverEnergyStateStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      EnergyStateStruct.hoverEnergyStateStruct = undefined;
    }
    if (req.maxStateName !== 'enable' && req.maxStateName !== 'disable' && req.maxStateName !== '-1') {
      let s = req.maxStateName;
      let textMetrics = req.context.measureText(s);
      req.context.globalAlpha = 1.0;
      req.context.fillStyle = '#f0f0f0';
      req.context.fillRect(0, 5, textMetrics.width + 8, 18);
      req.context.fillStyle = '#333';
      req.context.textBaseline = 'middle';
      req.context.fillText(s, 4, 5 + 9);
    }
    req.context.closePath();
  }
}

export function state(
  stateList: Array<EnergyStateStruct>,
  res: Array<EnergyStateStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && res.length > 0) {
    for (let i = 0; i < res.length; i++) {
      let stateItem = res[i];
      if (i === res.length - 1) {
        stateItem.dur = endNS - (stateItem.startNs || 0);
      } else {
        stateItem.dur = (res[i + 1].startNs || 0) - (stateItem.startNs || 0);
      }
      if ((stateItem.startNs || 0) + (stateItem.dur || 0) > startNS && (stateItem.startNs || 0) < endNS) {
        EnergyStateStruct.setStateFrame(res[i], 5, startNS, endNS, totalNS, frame);
      }
    }
    return;
  }
  res.length = 0;
  stateFilter(stateList, startNS, endNS, totalNS, frame, res);
}
function stateFilter(
  stateList: Array<EnergyStateStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  res: Array<EnergyStateStruct>
): void {
  if (stateList) {
    for (let index = 0; index < stateList.length; index++) {
      let item = stateList[index];
      item.dur =
        index === stateList.length - 1
          ? endNS - (item.startNs || 0)
          : (stateList[index + 1].startNs || 0) - (item.startNs || 0);
      if ((item.startNs || 0) + (item.dur || 0) > startNS && (item.startNs || 0) < endNS) {
        EnergyStateStruct.setStateFrame(stateList[index], 5, startNS, endNS, totalNS, frame);
        if (
          !(
            index > 0 &&
            (stateList[index - 1].frame?.x || 0) === (stateList[index].frame?.x || 0) &&
            (stateList[index - 1].frame?.width || 0) === (stateList[index].frame?.width || 0)
          )
        ) {
          res.push(item);
        }
      }
    }
  }
}

export class EnergyStateStruct extends BaseStruct {
  static maxState: number = 0;
  static maxStateName: string = '0';
  static hoverEnergyStateStruct: EnergyStateStruct | undefined;
  static selectEnergyStateStruct: EnergyStateStruct | undefined;
  type: string | undefined;
  value: number | undefined;
  startNs: number | undefined;
  dur: number | undefined;

  sensorType: number | undefined;
  pkg_name: string | undefined;
  deviceState: number | undefined;
  deviceType: number | undefined;

  static draw(
    energyStateContext: CanvasRenderingContext2D,
    data: EnergyStateStruct,
    maxState: number,
    maxStateName: string
  ): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      let drawColor = this.setDrawColor(data.type!);
      energyStateContext.fillStyle = drawColor;
      energyStateContext.strokeStyle = drawColor;
      energyStateContext.globalAlpha = 1.0;
      energyStateContext.lineWidth = 1;
      let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0)) / maxState);
      if (maxStateName === 'enable' || maxStateName === 'disable') {
        if (data.value === 0) {
          drawHeight = data.frame.height;
          energyStateContext.fillRect(data.frame.x, data.frame.y + 4, width, data.frame.height);
        }
      } else {
        energyStateContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, width, drawHeight);
      }
      if (data.startNs === EnergyStateStruct.hoverEnergyStateStruct?.startNs) {
        let pointy = data.frame.y + data.frame.height + 4;
        if (data.value === 0) {
          pointy -= drawHeight;
        }
        energyStateContext.beginPath();
        energyStateContext.arc(data.frame.x, pointy, 3, 0, 2 * Math.PI, true);
        energyStateContext.fill();
        energyStateContext.globalAlpha = 1.0;
        energyStateContext.stroke();
        energyStateContext.beginPath();
        energyStateContext.moveTo(data.frame.x + 3, pointy);
        energyStateContext.lineWidth = 3;
        energyStateContext.lineTo(data.frame.x + width, pointy);
        energyStateContext.stroke();
      }
    }
    energyStateContext.globalAlpha = 1.0;
    energyStateContext.lineWidth = 1;
  }

  static setStateFrame(
    stateNode: EnergyStateStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let stateStartPointX: number;
    let stateEndPointX: number;

    if ((stateNode.startNs || 0) < startNS) {
      stateStartPointX = 0;
    } else {
      stateStartPointX = ns2x(stateNode.startNs || 0, startNS, endNS, totalNS, frame);
    }
    if ((stateNode.startNs || 0) + (stateNode.dur || 0) > endNS) {
      stateEndPointX = frame.width;
    } else {
      stateEndPointX = ns2x((stateNode.startNs || 0) + (stateNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number = stateEndPointX - stateStartPointX <= 1 ? 1 : stateEndPointX - stateStartPointX;
    if (!stateNode.frame) {
      stateNode.frame = new Rect(0, 0, 0, 0);
    }
    stateNode.frame.x = Math.floor(stateStartPointX);
    stateNode.frame.y = frame.y + padding;
    stateNode.frame.width = Math.ceil(frameWidth);
    stateNode.frame.height = Math.floor(frame.height - padding * 2);
  }

  static setDrawColor(eventType: string): string {
    switch (eventType) {
      case 'BRIGHTNESS_NIT':
        return '#92D6CC';
      case 'SIGNAL_LEVEL':
        return '#61CFBE';
      case 'WIFI_EVENT_RECEIVED':
        return '#46B1E3';
      case 'AUDIO_STREAM_CHANGE':
        return '#ED6F21';
      case 'WIFI_STATE':
        return '#61CFBE';
      case 'LOCATION_SWITCH_STATE':
        return '#61CFBE';
      case 'SENSOR_STATE':
        return '#61CFBE';
      default:
        return '#61CFBE';
    }
  }
}
