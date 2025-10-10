/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { SpSystemTrace } from "../../component/SpSystemTrace";
import { TraceRow } from "../../component/trace/base/TraceRow";
import { BaseStruct, dataFilterHandler, drawLoadingFrame, isFrameContainPoint, Rect } from "./ProcedureWorkerCommon";

export class GpuMemoryRender {
    renderMainThread(
        req: {
            context: CanvasRenderingContext2D;
            useCache: boolean;
            type: string;
        },
        row: TraceRow<GpuMemoryStruct>
    ): void {
        let list = row.dataList;
        let filter = row.dataListCache;
        dataFilterHandler(list, filter, {
            startKey: 'startTime',
            durKey: 'dur',
            startNS: TraceRow.range?.startNS ?? 0,
            endNS: TraceRow.range?.endNS ?? 0,
            totalNS: TraceRow.range?.totalNS ?? 0,
            frame: row.frame,
            paddingTop: 8,
            useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
        });
        let find = false;
        let offset = 3;
        drawLoadingFrame(req.context, filter, row);
        setRenderGpuFrame(filter, row);
        for (let re of filter) {
            if (row.isHover && re.frame && !find && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
                GpuMemoryStruct.hoverGpuMemoryStruct = re;
              find = true;
            }
          }
          for (let re of filter) {
            GpuMemoryStruct.draw(req.context, re, row.drawType);
          }
          if (!find && row.isHover) {
            GpuMemoryStruct.hoverGpuMemoryStruct = undefined;
          }
          req.context.closePath();
    }
}

function setRenderGpuFrame(filter: GpuMemoryStruct[], row: TraceRow<GpuMemoryStruct>): void {
    // 多条数据,最后一条数据在结束点也需要绘制
    if (filter.length >= 2 && filter[filter.length - 1].dur === 0) {
        if (filter[filter.length - 2].frame && filter[filter.length - 1].frame) {
            filter[filter.length - 2].frame!.width = filter[filter.length - 2].frame!.width - 1;
            filter[filter.length - 1].frame!.width = 1;
            filter[filter.length - 1].frame!.x -= 1;
        }
    }
    // 只有一条数据并且数据在结束点
    // @ts-ignore
    if (filter.length === 1 && row.frame.width === filter[0].frame?.x) {
        filter[0].frame!.x -= 1;
    }
}

export function GMStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: undefined | TraceRow<GpuMemoryStruct>,
  entry?: GpuMemoryStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (
      clickRowType === TraceRow.ROW_TYPE_GPU_HEAP &&
      row &&
      row.getAttribute('gpuMemory-type') === 'native_hook_statistic' &&
      (GpuMemoryStruct.hoverGpuMemoryStruct || entry)
    ) {
      GpuMemoryStruct.selectGpuMemoryStruct = entry || GpuMemoryStruct.hoverGpuMemoryStruct;
      const key = row.rowParentId!.split(' ');
      let ipid = 1;
      if (key.length > 0) {
        ipid = Number(key[key.length - 1]);
      }
      sp.traceSheetEL?.displayGMHookData(GpuMemoryStruct.selectGpuMemoryStruct!, row.rowId!, ipid);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class GpuMemoryStruct extends BaseStruct {
  static hoverGpuMemoryStruct: GpuMemoryStruct | undefined;
  static selectGpuMemoryStruct: GpuMemoryStruct | undefined;
  startTime: number | undefined;
  endTime: number | undefined;
  dur: number | undefined;
  eventType: string | undefined;
  heapsize: number | undefined;
  density: number | undefined;
  maxHeapSize: number = 0;
  minHeapSize: number = 0;
  maxDensity: number = 0;
  minDensity: number = 0;

  static draw(ctx: CanvasRenderingContext2D, data: GpuMemoryStruct, drawType: number): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      ctx.fillStyle = '#2db3aa';
      ctx.strokeStyle = '#2db3aa';
      let drawHeight: number = 0;
      if (drawType === 0) {
        if (data.minHeapSize < 0) {
          drawHeight = Math.ceil(
            (((data.heapsize || 0) - data.minHeapSize) * (data.frame.height || 0)) /
              (data.maxHeapSize - data.minHeapSize)
          );
        } else {
          drawHeight = Math.ceil(((data.heapsize || 0) * (data.frame.height || 0)) / data.maxHeapSize);
        }
      } else {
        if (data.minDensity < 0) {
          drawHeight = Math.ceil(
            (((data.density || 0) - data.minDensity) * (data.frame.height || 0)) / (data.maxDensity - data.minDensity)
          );
        } else {
          drawHeight = Math.ceil(((data.density || 0) * (data.frame.height || 0)) / data.maxDensity);
        }
      }
      if (data === GpuMemoryStruct.hoverGpuMemoryStruct || data === GpuMemoryStruct.selectGpuMemoryStruct) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
        ctx.beginPath();
        ctx.arc(data.frame.x, data.frame.y + data.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight);
        ctx.lineWidth = 3;
        ctx.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
  }

}
