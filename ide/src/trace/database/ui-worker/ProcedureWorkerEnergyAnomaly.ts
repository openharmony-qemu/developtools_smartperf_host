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
  drawFlagLine,
  drawLines,
  drawLoading,
  drawLoadingFrame,
  drawSelection,
  isFrameContainPoint,
  PerfRender,
  RequestMessage,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class EnergyAnomalyRender extends PerfRender {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
      appName: string;
      canvasWidth: number;
    },
    row: TraceRow<EnergyAnomalyStruct>
  ) {
    let list = row.dataList;
    let filter = row.dataListCache;
    anomaly(
      list,
      filter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      req.appName,
      req.useCache || !TraceRow.range!.refresh
    );
    if (list.length > 0) {
      filter.length = 0;
      list.forEach((item) => {
        filter.push(item);
      });
    }
    drawLoadingFrame(req.context, row.dataListCache, row);
    req.context.beginPath();
    let find = false;
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication.hasAttribute('dark');
    drawLegend(req, isDark);
    for (let re of filter) {
      EnergyAnomalyStruct.draw(req.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        EnergyAnomalyStruct.hoverEnergyAnomalyStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) EnergyAnomalyStruct.hoverEnergyAnomalyStruct = undefined;
    req.context.fillStyle = ColorUtils.FUNC_COLOR[0];
    req.context.strokeStyle = ColorUtils.FUNC_COLOR[0];
    req.context.closePath();
  }

  render(energyAnomalyRequest: RequestMessage, list: Array<any>, filter: Array<any>, dataList2: Array<any>) {}
}

export function drawLegend(req: any, isDark?: boolean) {
  req.context.font = '12px Arial';
  let text = req.context.measureText('System Abnormality');
  req.context.fillStyle = '#E64566';
  req.context.strokeStyle = '#E64566';
  let textColor = isDark ? '#FFFFFF' : '#333';
  let canvasEndX = req.context.canvas.clientWidth - EnergyAnomalyStruct.OFFSET_WIDTH;
  let rectPadding: number;
  let textPadding: number;
  let textMargin: number;
  let currentTextWidth: number;
  let lastTextMargin: number;
  rectPadding = 280;
  textPadding = 270;
  textMargin = 250;
  currentTextWidth = canvasEndX - textMargin + text.width;
  lastTextMargin = currentTextWidth + 12;
  req!.context.fillRect(canvasEndX - rectPadding, 12, 8, 8);
  req.context.globalAlpha = 1;
  req.context.fillStyle = textColor;
  req.context.textBaseline = 'middle';
  req.context.fillText('System Abnormality', canvasEndX - textPadding, 18);
  req.context.fillStyle = '#FFC880';
  req.context.strokeStyle = '#FFC880';
  req.context.fillRect(currentTextWidth, 12, 8, 8);
  req.context.globalAlpha = 1;
  req.context.fillStyle = textColor;
  req.context.textBaseline = 'middle';
  req.context.fillText('Application Abnormality', lastTextMargin, 18);
  req.context.fillStyle = '#333';
}

export function anomaly(
  arr: Array<any>,
  res: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  appName: string | undefined,
  use: boolean
) {
  arr.length = 0;
  if (use && res.length > 0) {
    let pns = (endNS - startNS) / frame.width;
    let y = frame.y;
    for (let i = 0; i < res.length; i++) {
      let it = res[i];
      if ((it.startNS || 0) > startNS && (it.startNS || 0) < endNS) {
        if (!it.frame) {
          it.frame = {};
          it.frame.y = y;
        }
        it.frame.height = 20 + radius * 2;
        if (it.startNS + 50000 > (startNS || 0) && (it.startNS || 0) < (endNS || 0)) {
          EnergyAnomalyStruct.setAnomalyFrame(it, pns, startNS || 0, endNS || 0, frame);
          if (it.appKey === 'APPNAME' && it.eventValue.split(',').indexOf(appName) >= 0) {
            arr.push(it);
          }
          if (it.appKey != 'APPNAME') {
            arr.push(it);
          }
        }
      } else {
        it.frame = null;
      }
    }
    return;
  }
}

export class EnergyAnomalyStruct extends BaseStruct {
  static hoverEnergyAnomalyStruct: EnergyAnomalyStruct | undefined;
  static selectEnergyAnomalyStruct: EnergyAnomalyStruct | undefined;
  static SYSTEM_EXCEPTION = new Set([
    'ANOMALY_SCREEN_OFF_ENERGY',
    'ANOMALY_ALARM_WAKEUP',
    'ANOMALY_KERNEL_WAKELOCK',
    'ANOMALY_CPU_HIGH_FREQUENCY',
    'ANOMALY_WAKEUP',
  ]);
  static OFFSET_WIDTH: number = 266;
  id: number | undefined;
  type: number | undefined;
  startNS: number | undefined;
  height: number | undefined;
  eventName: string | undefined;
  appKey: string | undefined;
  eventValue: string | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: EnergyAnomalyStruct) {
    if (data.frame) {
      EnergyAnomalyStruct.drawRoundRectPath(ctx, data.frame.x - 7, 20 - 7, radius, data);
    }
  }

  static drawRoundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    data: EnergyAnomalyStruct
  ) {
    ctx.beginPath();
    ctx.arc(x + 7, y + 22, radius, 0, Math.PI * 2);
    ctx.closePath();
    let color = '';
    if (EnergyAnomalyStruct.SYSTEM_EXCEPTION.has(<string>data.eventName)) {
      color = '#E64566';
    } else {
      color = '#FFC880';
    }
    // 填充背景颜色
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    // 填充文字颜色
    ctx.font = '12px Arial';
    ctx.fillStyle = ColorUtils.GREY_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('E', x + 7, y + 23);
  }

  static setAnomalyFrame(node: any, pns: number, startNS: number, endNS: number, frame: any) {
    if ((node.startNS || 0) < startNS) {
      node.frame.x = 0;
    } else {
      node.frame.x = Math.floor(((node.startNS || 0) - startNS) / pns);
    }
    if ((node.startNS || 0) > endNS) {
      node.frame.width = frame.width - node.frame.x;
    } else {
      node.frame.width = Math.ceil(((node.startNS || 0) - startNS) / pns - node.frame.x);
    }
    if (node.frame.width < 1) {
      node.frame.width = 1;
    }
  }
}
let radius = 12;
