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
  PerfRender,
  Rect,
  RequestMessage,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class GpuCounterRender extends PerfRender {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D,
      useCache: boolean,
      type: string,
      startTime: number,
      maxValue: number,
    },
    row: TraceRow<GpuCounterStruct>
  ): void {
    let filter = row.dataListCache;
    let startTime = req.startTime;
    let maxValue = req.maxValue;
    let type = req.type;
    gpuCounterChart(
      filter,
      startTime,
      type,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      maxValue,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawGpuCounter(req, filter, row);
  }

  render(eBPFRequest: RequestMessage, list: Array<unknown>, filter: Array<unknown>, dataList2: Array<unknown>): void { }
}

function drawGpuCounter(
  req: {
    context: CanvasRenderingContext2D,
    useCache: boolean,
    type: string,
    startTime: number,
    maxValue: number,
  },
  filter: unknown[],
  row: TraceRow<GpuCounterStruct>
): void {
  req.context.beginPath();
  let find = false;
  for (let i = 0; i < filter.length; i++) {
    let it = filter[i];
    if (
      //@ts-ignore
      row.isHover && it.frame &&
      //@ts-ignore
      row.hoverX >= it.frame.x &&
      //@ts-ignore
      row.hoverX <= it.frame.x + it.frame.width
    ) {
      //@ts-ignore
      GpuCounterStruct.hoverGpuCounterStruct = it;
      find = true;
    }
    //@ts-ignore
    GpuCounterStruct.draw(req.context, it);
  }
  if (!find && row.isHover) {
    GpuCounterStruct.hoverGpuCounterStruct = undefined;
  }
  req.context.closePath();
}

export function gpuCounterChart(
  dataList: Array<unknown>,
  startTime: number,
  type: string,
  startNS: number,
  endNS: number,
  totalNS: number,
  maxValue: number,
  frame: Rect,
  use: boolean
): void {
  setFrameGroup(dataList, startTime, type, startNS, endNS, frame, maxValue);
}

function setFrameGroup(dataList: Array<unknown>, startTime: number, type: string, startNS: number, endNS: number, frame: Rect, maxValue: number): void {
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  for (let i = 0; i < dataList.length; i++) {
    let it = dataList[i];
    //@ts-ignore
    if ((it.startNS || 0) + (it.dur || 0) - startTime > startNS && (it.startNS || 0) - startTime < endNS) {
      //@ts-ignore
      if (!it.frame) {
        //@ts-ignore
        it.frame = {};
        //@ts-ignore
        it.frame.y = y;
      }
      //@ts-ignore
      it.frame.height = Math.ceil((it.height / maxValue) * 38) || 1;
      //@ts-ignore
      it.startTime = startTime;
      //@ts-ignore
      it.type = type;
      GpuCounterStruct.setFrame(it, startTime, pns, startNS, endNS, frame);
    } else {
      //@ts-ignore
      it.frame = null;
    }
  }
}

export function gpuCounterStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: GpuCounterStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_GPU_COUNTER && (GpuCounterStruct.hoverGpuCounterStruct || entry)) {
      GpuCounterStruct.selectGpuCounterStruct = entry || GpuCounterStruct.hoverGpuCounterStruct;
      sp.traceSheetEL?.displayGpuCounterData(GpuCounterStruct.selectGpuCounterStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class GpuCounterStruct extends BaseStruct {
  static hoverGpuCounterStruct: GpuCounterStruct | undefined;
  static selectGpuCounterStruct: GpuCounterStruct | undefined;
  startNS: number | undefined;
  endNS: number | undefined;
  dur: number | undefined;
  type: string | undefined;
  startTime: number | undefined;
  height: number | undefined;
  static draw(ctx: CanvasRenderingContext2D, data: GpuCounterStruct): void {
    if (data.frame) {
      ctx.fillStyle = ColorUtils.MD_PALETTE[0];
      ctx.strokeStyle = ColorUtils.MD_PALETTE[0];
      ctx.fillRect(data.frame.x, 40 - data.frame.height, data.frame.width, data.frame.height);
      if (data.type === GpuCounterStruct.selectGpuCounterStruct?.type && data.startNS === GpuCounterStruct.selectGpuCounterStruct?.startNS) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(data.frame.x, 40 - data.frame.height, data.frame.width - 2, data.frame.height);
      }
    }
  }

  static setFrame(
    eBPFtemNode: unknown,
    startTime: number,
    pns: number,
    startNS: number,
    endNS: number,
    frame: unknown
  ): void {
    //@ts-ignore
    if ((eBPFtemNode.startNS - startTime || 0) < startNS) {
      //@ts-ignore
      eBPFtemNode.frame.x = 0;
    } else {
      //@ts-ignore
      eBPFtemNode.frame.x = Math.floor((((eBPFtemNode.startNS - startTime) || 0) - startNS) / pns);
    }
    //@ts-ignore
    if ((eBPFtemNode.startNS || 0) + (eBPFtemNode.dur || 0) - startTime > endNS) {
      //@ts-ignore
      eBPFtemNode.frame.width = frame.width - eBPFtemNode.frame.x;
    } else {
      //@ts-ignore
      eBPFtemNode.frame.width = Math.ceil(((eBPFtemNode.startNS + eBPFtemNode.dur - startTime) - startNS) / pns - eBPFtemNode.frame.x);
    }
    //@ts-ignore
    if (eBPFtemNode.frame.width < 1) {
      //@ts-ignore
      eBPFtemNode.frame.width = 1;
    }
  }
}

export class MaleoonCounterObj {
  [key: string]: Array<unknown>;
  gpu_clocks: Array<unknown>;
  tiler_utilization: Array<unknown>;
  binning_utilization: Array<unknown>;
  rendering_utilization: Array<unknown>;
  compute_utilization: Array<unknown>;
  drawcall_count: Array<unknown>;
  vertex_count: Array<unknown>;
  primitives_count: Array<unknown>;
  visible_primitives_count: Array<unknown>;
  compute_invocations_count: Array<unknown>;
  shader_utilization: Array<unknown>;
  eu_utilization: Array<unknown>;
  eu_stall_utilization: Array<unknown>;
  eu_idle_utilization: Array<unknown>;
  control_flow_instr_utilization: Array<unknown>;
  half_float_instr_utilization: Array<unknown>;
  tu_utilization: Array<unknown>;
  concurrent_warps: Array<unknown>;
  instruction_count: Array<unknown>;
  quads_count: Array<unknown>;
  texels_count: Array<unknown>;
  memory_read: Array<unknown>;
  memory_write: Array<unknown>;
  memory_traffic: Array<unknown>;
  constructor() {
    this.gpu_clocks = [];
    this.tiler_utilization = [];
    this.binning_utilization = [];
    this.rendering_utilization = [];
    this.compute_utilization = [];

    this.drawcall_count = [];
    this.vertex_count = [];
    this.primitives_count = [];
    this.visible_primitives_count = [];
    this.compute_invocations_count = [];

    this.shader_utilization = [];
    this.eu_utilization = [];
    this.eu_stall_utilization = [];
    this.eu_idle_utilization = [];
    this.control_flow_instr_utilization = [];
    this.half_float_instr_utilization = [];
    this.tu_utilization = [];

    this.concurrent_warps = [];
    this.instruction_count = [];
    this.quads_count = [];
    this.texels_count = [];

    this.memory_read = [];
    this.memory_write = [];
    this.memory_traffic = [];
  }
}

export class GpuCounterType {
  [key: string]: Array<unknown>;
  'cycle': Array<unknown>;
  'drawcall': Array<unknown>;
  'shader_cycle': Array<unknown>;
  'local_count': Array<unknown>;
  'local_wr': Array<unknown>;
  constructor() {
    this.cycle = [];
    this.drawcall = [];
    this.shader_cycle = [];
    this.local_count = [];
    this.local_wr = [];
  }
}
