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

import { BaseStruct, Rect, Render, drawLoadingFrame, isFrameContainPoint } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';
import { MemoryConfig } from '../../bean/MemoryConfig';
import { SpSystemTrace } from '../../component/SpSystemTrace';

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
      (TraceRow.range?.endNS ?? 0) - (TraceRow.range?.startNS! ?? 0), // @ts-ignore
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

const snapshotTypeHandlerMap = new Map<string, (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown) => void>(
  [
    [
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL,

      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayGpuDumpTotalSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayGpuDumpWindowSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_VM_TRACKER_SMAPS,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displaySmapsSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_VMTRACKER_SHM,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayShmSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayTotalAbilitySheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayPinAbilitySheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayTotalVMSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_PIN_VM,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayPinVMSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_DMA_ABILITY,
      // @ts-ignore
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayDmaAbilitySheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_DMA_VMTRACKER,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayDmaVmTrackerSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayGpuMemoryAbilitySheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void =>
        // @ts-ignore
        displayGpuMemoryVmTrackerSheet(sp, row, reject),
    ],
    [
      TraceRow.ROW_TYPE_GPU_RESOURCE_VMTRACKER,
      (sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: unknown): void => displayGpuResourceSheet(sp),
    ],
  ]
);

export function SnapshotStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: TraceRow<SnapshotStruct>,
  entry?: SnapshotStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (snapshotTypeHandlerMap.has(clickRowType)) {
      SnapshotStruct.selectSnapshotStruct =
        SnapshotStruct.hoverSnapshotStruct || (row.getHoverStruct() as SnapshotStruct);
      snapshotTypeHandlerMap.get(clickRowType)?.(sp, row, reject);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

function displayGpuDumpTotalSheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayGpuSelectedData('total', SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  sp.timerShaftEL?.modifyFlagList(undefined);
  reject();
}

function displayGpuDumpWindowSheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayGpuSelectedData('window', SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  sp.timerShaftEL?.modifyFlagList(undefined);
  reject();
}

function displaySmapsSheet(sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: (reason?: unknown) => void): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displaySmapsData(SnapshotStruct.selectSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayShmSheet(sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: (reason?: unknown) => void): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayShmData(SnapshotStruct.selectSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayTotalAbilitySheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayPurgTotalAbilityData(SnapshotStruct.hoverSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayPinAbilitySheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayPurgPinAbilityData(SnapshotStruct.hoverSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayTotalVMSheet(sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: (reason?: unknown) => void): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayPurgTotalVMData(SnapshotStruct.hoverSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayPinVMSheet(sp: SpSystemTrace, row: TraceRow<BaseStruct>, reject: (reason?: unknown) => void): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayPurgPinVMData(SnapshotStruct.hoverSnapshotStruct!, row!.dataListCache);
  reject();
}

function displayDmaAbilitySheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayDmaAbility(SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  reject();
}

function displayDmaVmTrackerSheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayDmaVmTracker(SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  reject();
}

function displayGpuMemoryAbilitySheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayGpuMemoryAbility(SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  reject();
}

function displayGpuMemoryVmTrackerSheet(
  sp: SpSystemTrace,
  row: TraceRow<BaseStruct>,
  reject: (reason?: unknown) => void
): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  // @ts-ignore
  sp.traceSheetEL?.displayGpuMemoryVmTracker(SnapshotStruct.selectSnapshotStruct!.startNs, row!.dataListCache);
  reject();
}

function displayGpuResourceSheet(sp: SpSystemTrace): void {
  SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
  sp.traceSheetEL?.displayGpuResourceVmTracker(SnapshotStruct.selectSnapshotStruct!.startNs);
}

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
