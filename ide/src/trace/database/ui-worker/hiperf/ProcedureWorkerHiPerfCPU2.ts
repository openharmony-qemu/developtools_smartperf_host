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
import { PerfRender, RequestMessage, hiPerf2, drawLoadingFrame, HiPerfStruct } from '../ProcedureWorkerCommon';
import { TraceRow } from '../../../component/trace/base/TraceRow';

export class HiperfCpuRender2 extends PerfRender {
  renderMainThread(req: any, row: TraceRow<HiPerfCpuStruct>): void {
    let hiperfCpu2Filter = row.dataListCache;
    let groupBy10MS = req.scale > 30_000_000;
    let textMetrics;
    if (!groupBy10MS) {
      req.context.font = 'normal 12px Arial';
      textMetrics = req.context.measureText('🄿');
    }
    hiPerf2(hiperfCpu2Filter, TraceRow.range?.startNS ?? 0, TraceRow.range?.endNS ?? 0, row.frame);
    drawLoadingFrame(req.context, hiperfCpu2Filter, row);
    req.context.beginPath();
    req.context.fillStyle = ColorUtils.FUNC_COLOR[0];
    req.context.strokeStyle = ColorUtils.FUNC_COLOR[0];
    let normalPath = new Path2D();
    let find = false;
    let offset = groupBy10MS ? 0 : 3;
    for (let re of hiperfCpu2Filter) {
      if (
        row.isHover &&
        re.frame &&
        row.hoverX >= re.frame.x - offset &&
        row.hoverX <= re.frame.x + re.frame.width + offset
      ) {
        HiPerfCpuStruct.hoverStruct = re;
        find = true;
      }
      HiPerfCpuStruct.draw(req.context, normalPath, normalPath, re, groupBy10MS, textMetrics);
    }
    if (!find && row.isHover) HiPerfCpuStruct.hoverStruct = undefined;
    if (groupBy10MS) {
      req.context.fill(normalPath);
    } else {
      req.context.stroke(normalPath);
      HiPerfStruct.drawSpecialPath(req.context, normalPath);
    }
    req.context.closePath();
  }

  render(hiPerfCpuRequest: RequestMessage, list: Array<any>, filter: Array<any>, dataList2: Array<any>): void {}
}

export class HiPerfCpuStruct extends HiPerfStruct {
  static hoverStruct: HiPerfCpuStruct | undefined;
  static selectStruct: HiPerfCpuStruct | undefined;

  cpu: number | undefined;
}
