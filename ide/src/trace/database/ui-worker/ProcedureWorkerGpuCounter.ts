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
import { SpSystemTrace } from "../../component/SpSystemTrace";

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

  render(eBPFRequest: RequestMessage, list: Array<any>, filter: Array<any>, dataList2: Array<any>): void {}
}

function drawGpuCounter(
  req: {
    context: CanvasRenderingContext2D,
    useCache: boolean,
    type: string,
    startTime: number,
    maxValue: number,
  },
  filter: any[],
  row: TraceRow<GpuCounterStruct>
) {
  req.context.beginPath();
  let find = false;
  for (let i = 0; i < filter.length; i++) {
    let it = filter[i];
    if (
      row.isHover && it.frame && 
      row.hoverX >= it.frame.x &&
      row.hoverX <= it.frame.x + it.frame.width
    ) {
      GpuCounterStruct.hoverGpuCounterStruct = it;
      find = true;
    }
    GpuCounterStruct.draw(req.context, it);
  }
  if (!find && row.isHover) GpuCounterStruct.hoverGpuCounterStruct = undefined;
  req.context.closePath();
}

export function gpuCounterChart(
  dataList: Array<any>,
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

function setFrameGroup(dataList: Array<any>, startTime: number, type: string, startNS: number, endNS: number, frame: Rect, maxValue: number) {
  let pns = (endNS - startNS) / frame.width;
  let y = frame.y;
  for (let i = 0; i < dataList.length; i++) {
    let it = dataList[i];
    if ((it.startNS || 0) + (it.dur || 0) - startTime > startNS && (it.startNS || 0) - startTime < endNS) {
      if (!it.frame) {
        it.frame = {};
        it.frame.y = y;
      }
      it.frame.height = Math.ceil((it.height / maxValue) * 38) || 1;
      it.startTime = startTime;
      it.type = type;
      GpuCounterStruct.setFrame(it, startTime, pns, startNS, endNS, frame);
    } else {
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
    }else{
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
    eBPFtemNode: any,
    startTime: number,
    pns: number,
    startNS: number,
    endNS: number,
    frame: any
  ): void {
    if ((eBPFtemNode.startNS - startTime || 0) < startNS) {
      eBPFtemNode.frame.x = 0;
    } else {
      eBPFtemNode.frame.x = Math.floor((((eBPFtemNode.startNS - startTime) || 0) - startNS) / pns);
    }
    if ((eBPFtemNode.startNS || 0) + (eBPFtemNode.dur || 0) - startTime > endNS) {
      eBPFtemNode.frame.width = frame.width - eBPFtemNode.frame.x;
    } else {
      eBPFtemNode.frame.width = Math.ceil(((eBPFtemNode.startNS + eBPFtemNode.dur - startTime) - startNS) / pns - eBPFtemNode.frame.x);
    }
    if (eBPFtemNode.frame.width < 1) {
      eBPFtemNode.frame.width = 1;
    }
  }
}

export class maleoon_counter_obj {
  [key: string]: Array<any>;
  gpu_clocks: Array<any>;
  tiler_utilization: Array<any>;
  binning_utilization: Array<any>;
  rendering_utilization: Array<any>;
  compute_utilization: Array<any>;
  drawcall_count: Array<any>;
  vertex_count: Array<any>;
  primitives_count: Array<any>;
  visible_primitives_count: Array<any>;
  compute_invocations_count: Array<any>;
  shader_utilization: Array<any>;
  eu_utilization: Array<any>;
  eu_stall_utilization: Array<any>;
  eu_idle_utilization: Array<any>;
  control_flow_instr_utilization: Array<any>;
  half_float_instr_utilization: Array<any>;
  tu_utilization: Array<any>;
  concurrent_warps: Array<any>;
  instruction_count: Array<any>;
  quads_count: Array<any>;
  texels_count: Array<any>;
  memory_read: Array<any>;
  memory_write: Array<any>;
  memory_traffic: Array<any>;
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

export class gpu_counter_type {
  [key: string]: Array<any>;
  'cycle': Array<any>;
  'drawcall': Array<any>;
  'shader_cycle': Array<any>;
  'local_count': Array<any>;
  'local_wr': Array<any>;
  constructor() {
    this.cycle = [];
    this.drawcall = [];
    this.shader_cycle = [];
    this.local_count = [];
    this.local_wr = [];
  }
}
