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
import { BaseStruct, Rect, Render, drawLoadingFrame, isFrameContainPoint, ns2x } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';
import { MemoryConfig } from '../../bean/MemoryConfig';
import {SpSystemTrace} from "../../component/SpSystemTrace";

export class SnapshotRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<SnapshotStruct>
  ): void {
    let filter = row.dataListCache;
    let maxValue = 0;
    for (let item of filter) {
      maxValue = Math.max(maxValue, item.value || 0);
    }
    snapshot(
      filter,
      maxValue,
      TraceRow.range?.startNS ?? 0,
      (TraceRow.range?.endNS ?? 0) - (TraceRow.range?.startNS! ?? 0),
      row.frame
    );
    drawLoadingFrame(req.context, row.dataListCache, row);
    req.context!.beginPath();
    let find = false;
    for (let re of filter) {
      SnapshotStruct.draw(req.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        SnapshotStruct.hoverSnapshotStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      SnapshotStruct.hoverSnapshotStruct = undefined;
    }
    req.context!.closePath();
  }
}
export function snapshot(
  filter: Array<SnapshotStruct>,
  maxValue: number,
  startNs: number,
  totalNs: number,
  frame: Rect
): void {
  for (let file of filter) {
    SnapshotStruct.setFrame(file, maxValue, startNs || 0, totalNs || 0, frame);
  }
}
const padding = 2;
export function snapshotStructOnClick(clickRowType: string, sp: SpSystemTrace) {
  return new Promise((resolve, reject) => {
    if (SnapshotStruct.hoverSnapshotStruct) {
      switch (clickRowType) {
        case TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL:
          handleGpuTotalClick(SnapshotStruct.hoverSnapshotStruct, sp)
            .then(resolve)
            .catch(reject);
          break;
        case TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW:
          handleGpuWindowClick(SnapshotStruct.hoverSnapshotStruct, sp)
            .then(resolve)
            .catch(reject);
          break;
        case TraceRow.ROW_TYPE_VM_TRACKER_SMAPS:
          handleSmapsClick(SnapshotStruct.hoverSnapshotStruct, sp)
            .then(resolve)
            .catch(reject);
          break;
        // Add more cases for other clickRowType values here...

        default:
          resolve(null);
          break;
      }
    } else {
      reject();
    }
  });
}

function handleGpuTotalClick(snapshotStruct: SnapshotStruct, sp: SpSystemTrace) {
  return new Promise<void>((resolve, reject) => {
    const querySelector = `trace-row[row-id='Skia Gpu Dump Total']`;
    const gpuDumpTotalRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(querySelector);

    if (gpuDumpTotalRow) {
      handleGpuClick(snapshotStruct, sp, 'total', gpuDumpTotalRow.dataListCache)
        .then(resolve)
        .catch(reject);
    } else {
      reject();
    }
  });
}

function handleGpuWindowClick(snapshotStruct: SnapshotStruct, sp: SpSystemTrace) {
  return new Promise<void>((resolve, reject) => {
    const querySelector = `trace-row[row-id='Skia Gpu Dump Window']`;
    const gpuDumpWindowRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(querySelector);

    if (gpuDumpWindowRow) {
      handleGpuClick(snapshotStruct, sp, 'window', gpuDumpWindowRow.dataListCache)
        .then(resolve)
        .catch(reject);
    } else {
      reject();
    }
  });
}

function handleGpuClick(
  snapshotStruct: SnapshotStruct,
  sp: SpSystemTrace,
  dataType: string,
  dataListCache: any[]
) {
  return new Promise<void>((resolve, reject) => {
    SnapshotStruct.selectSnapshotStruct = snapshotStruct;
    sp.traceSheetEL?.displayGpuSelectedData(dataType, snapshotStruct.startNs, dataListCache);
    sp.timerShaftEL?.modifyFlagList(undefined);
    resolve();
  });
}

function handleSmapsClick(snapshotStruct: SnapshotStruct, sp: SpSystemTrace) {
  return new Promise<void>((resolve, reject) => {
    const querySelector = `trace-row[row-id='Dirty']`;
    const smapsRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(querySelector);

    if (smapsRow) {
      SnapshotStruct.selectSnapshotStruct = snapshotStruct;
      sp.traceSheetEL?.displaySmapsData(snapshotStruct, smapsRow.dataListCache);
      resolve();
    } else {
      reject();
    }
  });
}

// Add more functions for handling other clickRowType values here...
export class SnapshotStruct extends BaseStruct {
  startNs: number = 0;
  endNs: number = 0;
  dur: number = 0;
  name: string = '';
  aSize: number = 0;
  categoryNameId: number = 0;
  textWidth: number = 0;
  value: number = 0;
  type: string = '';
  static hoverSnapshotStruct: SnapshotStruct | undefined;
  static selectSnapshotStruct: SnapshotStruct | undefined;
  static setFrame(node: SnapshotStruct, maxValue: number, startNs: number, totalNs: number, frame: Rect): void {
    node.frame = undefined;
    frame.height = 40 - padding * 2;
    // sample_interval单位是ms,startNs和endNs单位是纳秒，每一次采样的时间按采样间隔的五分之一算
    node.dur = MemoryConfig.getInstance().snapshotDur;
    node.endNs = node.startNs + node.dur;
    if ((node.startNs - startNs || node.startNs - startNs === 0) && node.endNs - node.startNs) {
      let rectangle: Rect = new Rect(
        Math.floor(((node.startNs - startNs) / totalNs) * frame.width),
        Math.floor(((maxValue - node.value) / maxValue) * frame.height),
        Math.ceil(((node.endNs - node.startNs) / totalNs) * frame.width),
        Math.ceil((node.value / maxValue) * frame.height)
      );
      node.frame = rectangle;
    }
    if (node.value === 0) {
      let rectangle: Rect = new Rect(
        Math.floor(((node.startNs - startNs) / totalNs) * frame.width),
        30,
        Math.ceil((node.dur / totalNs) * frame.width),
        1
      );
      node.frame = rectangle;
    }
  }
  static draw(ctx: CanvasRenderingContext2D, data: SnapshotStruct): void {
    if (data.frame) {
      ctx.fillStyle = 'rgb(86,192,197)';
      ctx!.fillRect(data.frame!.x, data.frame!.y + padding, data.frame!.width, data.frame!.height);
      if (data.frame!.width > 7) {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 1;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        if (data.frame!.height > 10 && data.frame!.height < 25) {
          SnapshotStruct.drawString(ctx, data.name || '', 4, data.frame!, data, 4);
        } else if (data.frame!.height >= 25) {
          SnapshotStruct.drawString(ctx, data.name || '', 4, data.frame!, data, 4);
          SnapshotStruct.drawString(ctx, Utils.getBinaryByteWithUnit(data.value || 0), 11, data.frame!, data, 2);
        }
      }
      if (SnapshotStruct.selectSnapshotStruct && SnapshotStruct.equals(SnapshotStruct.selectSnapshotStruct, data)) {
        ctx.strokeStyle = '#232c5d';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.frame!.x, data.frame!.y + padding, data.frame!.width - 2, data.frame!.height);
      }
    }
  }
  /**
   *
   * @param ctx current context
   * @param str text
   * @param textPadding padding
   * @param frame rectangle
   * @param data PurgeableStruct
   * @param location the position of the string, the bigger the numerical value, the higher the position on the canvas
   */
  static drawString(
    ctx: CanvasRenderingContext2D,
    str: string,
    textPadding: number,
    frame: Rect,
    data: SnapshotStruct,
    location: number
  ): void {
    if (data.textWidth === undefined) {
      data.textWidth = ctx.measureText(str).width;
    }
    let textWidth = Math.round(data.textWidth / str.length);
    let fillTextWidth = frame.width - textPadding * 2;
    if (data.textWidth < fillTextWidth) {
      let x = Math.floor(frame.width / 2 - data.textWidth / 2 + frame.x + textPadding);
      ctx.fillText(str, x, Math.floor(frame.y + frame.height / location + textPadding), fillTextWidth);
    } else {
      if (fillTextWidth >= textWidth) {
        let characterNum = fillTextWidth / textWidth;
        let x = frame.x + textPadding;
        if (characterNum < 2) {
          ctx.fillText(
            str.substring(0, 1),
            x,
            Math.floor(frame.y + frame.height / location + textPadding),
            fillTextWidth
          );
        } else {
          ctx.fillText(
            `${str.substring(0, characterNum - 1)}...`,
            x,
            Math.floor(frame.y + frame.height / location + textPadding),
            fillTextWidth
          );
        }
      }
    }
  }
  static equals(baseSnapshot: SnapshotStruct, targetSnapshot: SnapshotStruct): boolean {
    return baseSnapshot === targetSnapshot;
  }
}
