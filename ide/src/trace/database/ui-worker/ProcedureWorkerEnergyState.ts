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
  drawLines,
  drawLoading,
  drawFlagLine,
  drawSelection,
  isFrameContainPoint,
  drawLoadingFrame,
  ns2x,
  Render,
  RequestMessage,
} from './ProcedureWorkerCommon';
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
  ) {
    let stateList = row.dataList;
    let stateFilter = row.dataListCache;
    state(
      stateList,
      stateFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
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
    if (!find && row.isHover) EnergyStateStruct.hoverEnergyStateStruct = undefined;
    if (req.maxStateName != 'enable' && req.maxStateName != 'disable' && req.maxStateName != '-1') {
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

  render(energyStateRequest: RequestMessage, stateList: Array<any>, filter: Array<any>) {
    if (energyStateRequest.lazyRefresh) {
      state(
        stateList,
        filter,
        energyStateRequest.startNS,
        energyStateRequest.endNS,
        energyStateRequest.totalNS,
        energyStateRequest.frame,
        energyStateRequest.useCache || !energyStateRequest.range.refresh
      );
    } else {
      if (!energyStateRequest.useCache) {
        state(
          stateList,
          filter,
          energyStateRequest.startNS,
          energyStateRequest.endNS,
          energyStateRequest.totalNS,
          energyStateRequest.frame,
          false
        );
      }
    }
    if (energyStateRequest.canvas) {
      energyStateRequest.context.clearRect(0, 0, energyStateRequest.canvas.width, energyStateRequest.canvas.height);
      let energyStateArr = filter;
      if (
        energyStateArr.length > 0 &&
        !energyStateRequest.range.refresh &&
        !energyStateRequest.useCache &&
        energyStateRequest.lazyRefresh
      ) {
        drawLoading(
          energyStateRequest.context,
          energyStateRequest.startNS,
          energyStateRequest.endNS,
          energyStateRequest.totalNS,
          energyStateRequest.frame,
          energyStateArr[0].startNS,
          energyStateArr[energyStateArr.length - 1].startNS + energyStateArr[energyStateArr.length - 1].dur
        );
      }
      drawLines(
        energyStateRequest.context,
        energyStateRequest.xs,
        energyStateRequest.frame.height,
        energyStateRequest.lineColor
      );
      energyStateRequest.context.beginPath();
      EnergyStateStruct.maxState = energyStateRequest.params.maxState;
      EnergyStateStruct.maxStateName = energyStateRequest.params.maxStateName;
      drawLines(
        energyStateRequest.context,
        energyStateRequest.xs,
        energyStateRequest.frame.height,
        energyStateRequest.lineColor
      );
      EnergyStateStruct.hoverEnergyStateStruct = undefined;
      if (energyStateRequest.isHover) {
        for (let re of filter) {
          if (
            re.frame &&
            energyStateRequest.hoverX >= re.frame.x &&
            energyStateRequest.hoverX <= re.frame.x + re.frame.width &&
            energyStateRequest.hoverY >= re.frame.y &&
            energyStateRequest.hoverY <= re.frame.y + re.frame.height
          ) {
            EnergyStateStruct.hoverEnergyStateStruct = re;
            break;
          }
        }
      }
      EnergyStateStruct.selectEnergyStateStruct = energyStateRequest.params.selectEnergyStateStruct;
      for (let re of filter) {
        EnergyStateStruct.draw(energyStateRequest.context, re, 0, '');
      }
      drawSelection(energyStateRequest.context, energyStateRequest.params);
      energyStateRequest.context.closePath();
      if (
        EnergyStateStruct.maxStateName != 'enable' &&
        EnergyStateStruct.maxStateName != 'disable' &&
        EnergyStateStruct.maxStateName != '-1'
      ) {
        let s = EnergyStateStruct.maxStateName;
        let textMetrics = energyStateRequest.context.measureText(s);
        energyStateRequest.context.globalAlpha = 1.0;
        energyStateRequest.context.fillStyle = '#f0f0f0';
        energyStateRequest.context.fillRect(0, 5, textMetrics.width + 8, 18);
        energyStateRequest.context.fillStyle = '#333';
        energyStateRequest.context.textBaseline = 'middle';
        energyStateRequest.context.fillText(s, 4, 5 + 9);
      }
      drawFlagLine(
        energyStateRequest.context,
        energyStateRequest.flagMoveInfo,
        energyStateRequest.flagSelectedInfo,
        energyStateRequest.startNS,
        energyStateRequest.endNS,
        energyStateRequest.totalNS,
        energyStateRequest.frame,
        energyStateRequest.slicesTime
      );
    }
    // @ts-ignore
    self.postMessage({
      id: energyStateRequest.id,
      type: energyStateRequest.type,
      results: energyStateRequest.canvas ? undefined : filter,
      hover: EnergyStateStruct.hoverEnergyStateStruct,
    });
  }
}

export function state(
  stateList: Array<any>,
  res: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  use: boolean
) {
  if (use && res.length > 0) {
    for (let i = 0; i < res.length; i++) {
      let stateItem = res[i];
      if (i === res.length - 1) {
        stateItem.dur = (endNS || 0) - (stateItem.startNs || 0);
      } else {
        stateItem.dur = (res[i + 1].startNs || 0) - (stateItem.startNs || 0);
      }
      if ((stateItem.startNs || 0) + (stateItem.dur || 0) > (startNS || 0) && (stateItem.startNs || 0) < (endNS || 0)) {
        EnergyStateStruct.setStateFrame(res[i], 5, startNS || 0, endNS || 0, totalNS || 0, frame);
      }
    }
    return;
  }
  res.length = 0;
  if (stateList) {
    for (let index = 0; index < stateList.length; index++) {
      let item = stateList[index];
      if (index === stateList.length - 1) {
        item.dur = (endNS || 0) - (item.startNs || 0);
      } else {
        item.dur = (stateList[index + 1].startNs || 0) - (item.startNs || 0);
      }
      if ((item.startNs || 0) + (item.dur || 0) > (startNS || 0) && (item.startNs || 0) < (endNS || 0)) {
        EnergyStateStruct.setStateFrame(stateList[index], 5, startNS || 0, endNS || 0, totalNS || 0, frame);
        if (
          index > 0 &&
          (stateList[index - 1].frame?.x || 0) == (stateList[index].frame?.x || 0) &&
          (stateList[index - 1].frame?.width || 0) == (stateList[index].frame?.width || 0)
        ) {
        } else {
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
  ) {
    if (data.frame) {
      let width = data.frame.width || 0;
      let drawColor = this.setDrawColor(data.type!);
      energyStateContext.fillStyle = drawColor;
      energyStateContext.strokeStyle = drawColor;
      energyStateContext.globalAlpha = 1.0;
      energyStateContext.lineWidth = 1;
      let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0)) / maxState);
      if (maxStateName === 'enable' || maxStateName === 'disable') {
        if (data.value == 0) {
          drawHeight = data.frame.height;
          energyStateContext.fillRect(data.frame.x, data.frame.y + 4, width, data.frame.height);
        }
      } else {
        energyStateContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, width, drawHeight);
      }
      if (data.startNs === EnergyStateStruct.hoverEnergyStateStruct?.startNs) {
        let pointy = data.frame.y + data.frame.height + 4;
        if (data.value == 0) {
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

  static setStateFrame(stateNode: any, padding: number, startNS: number, endNS: number, totalNS: number, frame: any) {
    let stateStartPointX: number, stateEndPointX: number;

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
      stateNode.frame = {};
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
