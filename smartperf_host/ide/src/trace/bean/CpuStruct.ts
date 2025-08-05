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

import { ColorUtils } from '../component/trace/base/ColorUtils';
import { BaseStruct } from './BaseStruct';
import { WakeupBean } from './WakeupBean';

export class CpuStruct extends BaseStruct {
  static cpuCount: number; //最大cpu数量
  static hoverCpuStruct: CpuStruct | undefined;
  static selectCpuStruct: CpuStruct | undefined;
  static wakeupBean: WakeupBean | null | undefined;
  cpu: number | undefined;
  dur: number | undefined;
  end_state: string | undefined;
  id: number | undefined;
  name: string | undefined;
  priority: number | undefined;
  processCmdLine: string | undefined;
  processId: number | undefined;
  processName: string | undefined;
  schedId: number | undefined;
  startTime: number | undefined;
  tid: number | undefined;
  type: string | undefined;

  static draw(cpuCtx: CanvasRenderingContext2D, cpuStruct: CpuStruct): void {
    if (cpuStruct.frame) {
      let cpuWidth = cpuStruct.frame.width || 0;
      if (cpuStruct.processId === CpuStruct.hoverCpuStruct?.processId || !CpuStruct.hoverCpuStruct) {
        cpuCtx.fillStyle = ColorUtils.colorForTid(
          (cpuStruct.processId || 0) > 0 ? cpuStruct.processId || 0 : cpuStruct.tid || 0
        );
      } else {
        cpuCtx.fillStyle = '#e0e0e0';
      }
      cpuCtx.fillRect(cpuStruct.frame.x, cpuStruct.frame.y, cpuWidth, cpuStruct.frame.height);
      if (cpuWidth > textPadding * 2) {
        let cpuProcess = `${cpuStruct.processName || 'Process'} [${cpuStruct.processId}]`;
        let cpuThread = `${cpuStruct.name || 'Thread'} [${cpuStruct.tid}]`;
        let processMeasure = cpuCtx.measureText(cpuProcess);
        let threadMeasure = cpuCtx.measureText(cpuThread);
        let pChartWidth = Math.round(processMeasure.width / cpuProcess.length);
        let tChartWidth = Math.round(threadMeasure.width / cpuThread.length);
        cpuCtx.fillStyle = '#ffffff';
        let y = cpuStruct.frame.height / 2 + cpuStruct.frame.y;
        if (processMeasure.width < cpuWidth - textPadding * 2) {
          let x1 = Math.floor(cpuWidth / 2 - processMeasure.width / 2 + cpuStruct.frame.x + textPadding);
          cpuCtx.textBaseline = 'bottom';
          cpuCtx.fillText(cpuProcess, x1, y, cpuWidth - textPadding * 2);
        } else if (cpuWidth - textPadding * 2 > pChartWidth * 4) {
          let chatNum = (cpuWidth - textPadding * 2) / pChartWidth;
          let x1 = cpuStruct.frame.x + textPadding;
          cpuCtx.textBaseline = 'bottom';
          cpuCtx.fillText(`${cpuProcess.substring(0, chatNum - 4)}...`, x1, y, cpuWidth - textPadding * 2);
        }
        if (threadMeasure.width < cpuWidth - textPadding * 2) {
          cpuCtx.textBaseline = 'top';
          let x2 = Math.floor(cpuWidth / 2 - threadMeasure.width / 2 + cpuStruct.frame.x + textPadding);
          cpuCtx.fillText(cpuThread, x2, y + 2, cpuWidth - textPadding * 2);
        } else if (cpuWidth - textPadding * 2 > tChartWidth * 4) {
          let chatNum = (cpuWidth - textPadding * 2) / tChartWidth;
          let x1 = cpuStruct.frame.x + textPadding;
          cpuCtx.textBaseline = 'top';
          cpuCtx.fillText(`${cpuThread.substring(0, chatNum - 4)}...`, x1, y + 2, cpuWidth - textPadding * 2);
        }
      }
      if (CpuStruct.selectCpuStruct && CpuStruct.equals(CpuStruct.selectCpuStruct, cpuStruct)) {
        cpuCtx.strokeStyle = '#232c5d';
        cpuCtx.lineWidth = 2;
        cpuCtx.strokeRect(cpuStruct.frame.x, cpuStruct.frame.y, cpuWidth - 2, cpuStruct.frame.height);
      }
    }
  }

  static equals(d1: CpuStruct, d2: CpuStruct): boolean {
    if (
      d1 &&
      d2 &&
      d1.cpu === d2.cpu &&
      d1.tid === d2.tid &&
      d1.processId === d2.processId &&
      d1.startTime === d2.startTime &&
      d1.dur === d2.dur
    ) {
      return true;
    } else {
      return false;
    }
  }
}

const textPadding = 2;
