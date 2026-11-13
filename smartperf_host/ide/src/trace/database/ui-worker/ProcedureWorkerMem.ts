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
import { TraceRow } from '../../component/trace/base/TraceRow';
import { isFrameContainPoint, Render, mem, drawLoadingFrame } from './ProcedureWorkerCommon';
import { ProcessMemStruct as BaseProcessMemStruct } from '../../bean/ProcessMemStruct';
export class MemRender {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
    },
    row: TraceRow<ProcessMemStruct>
  ): void {
    let memList = row.dataList;
    let memFilter = row.dataListCache;
    mem(
      memList,
      memFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      req.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(req.context, memFilter, row);
    req.context.beginPath();
    let memFind = false;
    for (let re of memFilter) {
      ProcessMemStruct.draw(req.context, re);
      if (row.isHover) {
        if (re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
          ProcessMemStruct.hoverProcessMemStruct = re;
          memFind = true;
        }
      }
    }
    if (!memFind && row.isHover) {
      ProcessMemStruct.hoverProcessMemStruct = undefined;
    }
    req.context.closePath();
  }
}

export class ProcessMemStruct extends BaseProcessMemStruct {
  static draw(memContext: CanvasRenderingContext2D, data: ProcessMemStruct): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      memContext.fillStyle = ColorUtils.colorForTid(data.maxValue || 0);
      memContext.strokeStyle = ColorUtils.colorForTid(data.maxValue || 0);
      data.maxValue = data.maxValue === 0 ? 1 : data.maxValue;
      if ((data.value || 0) < 0) {
        memContext.fillStyle = ColorUtils.colorForTid(data.minValue || 0);
        memContext.strokeStyle = ColorUtils.colorForTid(data.minValue || 0);
      }
      let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0) * 1.0) / data.maxValue!);
      if (drawHeight === 0) {
        drawHeight = 1;
      }
      let minHeight: number = 0;
      let maxHeight: number = 0;
      let sumHeight: number = 0;
      let cutHeight: number = 0;
      if (data.minValue! < 0) {
        minHeight = Math.floor(((data.minValue || 0) * (data.frame.height || 0) * 1.0) / data.maxValue!);
        maxHeight = Math.floor(((data.maxValue || 0) * (data.frame.height || 0) * 1.0) / data.maxValue!);
        sumHeight = Math.abs(minHeight) + Math.abs(maxHeight);
        let num = this.cal(Math.abs(minHeight), Math.abs(maxHeight));
        drawHeight = Math.floor(drawHeight / num);
        cutHeight = Math.abs(Math.floor(((data.minValue || 0) * (data.frame.height || 0) * 1.0) / data.maxValue!) / num) + 1;
        if (data.maxValue! < 0) {
          drawHeight = -drawHeight;
          cutHeight = 30;
        }
      }
      if (data === ProcessMemStruct.hoverProcessMemStruct) {
        memContext.lineWidth = 1;
        memContext.globalAlpha = 0.6;
        memContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight - cutHeight, width, drawHeight);
        memContext.beginPath();
        memContext.arc(data.frame.x, data.frame.y + data.frame.height - drawHeight - cutHeight, 3, 0, 2 * Math.PI, true);
        memContext.fill();
        memContext.globalAlpha = 1.0;
        memContext.stroke();
        memContext.closePath();
        memContext.beginPath();
        memContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight - cutHeight);
        memContext.lineWidth = 3;
        memContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight - cutHeight);
        memContext.stroke();
        memContext.closePath();
      } else {
        memContext.globalAlpha = 0.6;
        memContext.lineWidth = 1;
        memContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight - cutHeight, width, drawHeight);
        if (width > 2) {
          memContext.lineWidth = 1;
          memContext.globalAlpha = 1.0;
          memContext.strokeRect(data.frame.x, data.frame.y + data.frame.height - drawHeight - cutHeight, width, drawHeight);
        }
      }
    }
    memContext.globalAlpha = 1.0;
    memContext.lineWidth = 1;
  }

  static cal(minHeight: number, maxHeight: number): number {
    let multiplier = 1;
    let newSum: number;
    do {
      newSum = minHeight / multiplier + maxHeight / multiplier;
      multiplier += 2;
    } while (newSum > 30 && multiplier <= (minHeight + maxHeight) * 2);
    if (newSum <= 30) {
      multiplier -= 2;
      while (minHeight / (multiplier + 2) + maxHeight / (multiplier + 2) > 30) {
        multiplier += 2;
      }
      return multiplier;
    } else {
      return 2;
    }
  }
}
