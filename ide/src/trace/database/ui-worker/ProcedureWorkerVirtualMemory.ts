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
import { BaseStruct, Render, mem, isFrameContainPoint, drawLoadingFrame } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class VirtualMemoryRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<VirtualMemoryStruct>
  ): void {
    mem(
      row.dataList,
      row.dataListCache,
      TraceRow.range?.startNS || 0,
      TraceRow.range?.endNS || 0,
      TraceRow.range?.totalNS || 0,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawLoadingFrame(req.context, row.dataListCache, row);
    req.context.beginPath();
    let find = false;
    for (let re of row.dataListCache) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        VirtualMemoryStruct.hoverStruct = re;
        find = true;
      }
      VirtualMemoryStruct.draw(req.context, re);
    }
    if (!find && row.isHover) {
      VirtualMemoryStruct.hoverStruct = undefined;
    }
    req.context.closePath();
  }
}

export class VirtualMemoryStruct extends BaseStruct {
  static hoverStruct: VirtualMemoryStruct | undefined;
  filterID: number | undefined;
  value: number | undefined;
  startTime: number | undefined;
  duration: number | undefined;
  maxValue: number | undefined;
  delta: number | undefined;

  static draw(virtualMemoryContext: CanvasRenderingContext2D, data: VirtualMemoryStruct): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      virtualMemoryContext.fillStyle = ColorUtils.colorForTid(data.maxValue || 0);
      virtualMemoryContext.strokeStyle = ColorUtils.colorForTid(data.maxValue || 0);
      if (data === VirtualMemoryStruct.hoverStruct) {
        virtualMemoryContext.lineWidth = 1;
        virtualMemoryContext.globalAlpha = 0.6;
        let virtualMemoryDrawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0) * 1.0) / (data.maxValue || 1)
        );
        virtualMemoryContext.fillRect(
          data.frame.x,
          data.frame.y + data.frame.height - virtualMemoryDrawHeight,
          width,
          virtualMemoryDrawHeight
        );
        virtualMemoryContext.beginPath();
        virtualMemoryContext.arc(
          data.frame.x,
          data.frame.y + data.frame.height - virtualMemoryDrawHeight,
          3,
          0,
          2 * Math.PI,
          true
        );
        virtualMemoryContext.fill();
        virtualMemoryContext.globalAlpha = 1.0;
        virtualMemoryContext.stroke();
        virtualMemoryContext.beginPath();
        virtualMemoryContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - virtualMemoryDrawHeight);
        virtualMemoryContext.lineWidth = 3;
        virtualMemoryContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - virtualMemoryDrawHeight);
        virtualMemoryContext.stroke();
      } else {
        virtualMemoryContext.globalAlpha = 0.6;
        virtualMemoryContext.lineWidth = 1;
        let drawHeight: number = ((data.value || 0) * (data.frame.height || 0) * 1.0) / (data.maxValue || 1);
        virtualMemoryContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    virtualMemoryContext.globalAlpha = 1.0;
    virtualMemoryContext.lineWidth = 1;
  }
}
