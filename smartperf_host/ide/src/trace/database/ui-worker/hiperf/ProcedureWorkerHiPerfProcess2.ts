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

import { ColorUtils } from '../../../component/trace/base/ColorUtils';
import { drawLoadingFrame, hiPerf, hiPerf2, HiPerfStruct, PerfRender, RequestMessage } from '../ProcedureWorkerCommon';
import { TraceRow } from '../../../component/trace/base/TraceRow';

export class HiperfProcessRender2 extends PerfRender {
  renderMainThread(req: unknown, row: TraceRow<HiPerfProcessStruct>): void {
    //@ts-ignore
    const ctx = req.context as CanvasRenderingContext2D;
    let hiperfProcessFilter = row.dataListCache;
    //@ts-ignore
    let groupBy10MS = req.scale > 30_000_000;
    let textMetrics;
    if (!groupBy10MS) {
      ctx.font = 'normal 12px Arial';
      textMetrics = ctx.measureText('🄿');
    }
    hiPerf2(hiperfProcessFilter, TraceRow.range?.startNS ?? 0, TraceRow.range?.endNS ?? 0, row.frame);
    drawLoadingFrame(ctx, hiperfProcessFilter, row);
    ctx.beginPath();
    ctx.fillStyle = ColorUtils.FUNC_COLOR[0];
    ctx.strokeStyle = ColorUtils.FUNC_COLOR[0];
    let normalPath = new Path2D();
    let specPath = new Path2D();
    let offset = groupBy10MS ? 0 : 3;
    let find = false;
    for (let it of hiperfProcessFilter) {
      HiPerfProcessStruct.draw(ctx, normalPath, specPath, it, groupBy10MS, textMetrics,row);
      if (row.isHover) {
        if (it.frame && row.hoverX >= it.frame.x - offset && row.hoverX <= it.frame.x + it.frame.width + offset) {
          HiPerfProcessStruct.hoverStruct = it;
          find = true;
        }
      }
    }
    if (!find && row.isHover) {
      HiPerfProcessStruct.hoverStruct = undefined;
    }
    if (groupBy10MS) {
      ctx.fill(normalPath);
    } else {
      ctx.stroke(normalPath);
      HiPerfStruct.drawSpecialPath(ctx, specPath);
    }
    ctx.closePath();
  }

  render(
    hiPerfProcessRequest: RequestMessage,
    list: Array<unknown>,
    filter: Array<unknown>,
    dataList2: Array<unknown>
  ): void {}
}

export class HiPerfProcessStruct extends HiPerfStruct {
  static hoverStruct: HiPerfProcessStruct | undefined;
  static selectStruct: HiPerfProcessStruct | undefined;
}
