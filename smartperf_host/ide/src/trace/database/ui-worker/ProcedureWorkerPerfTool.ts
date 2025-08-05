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
  dataFilterHandler,
  drawLoadingFrame,
  drawString,
  isFrameContainPoint,
  Render,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class PerfToolRender extends Render {
  renderMainThread(
    perfReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      index: number;
    },
    row: TraceRow<PerfToolStruct>
  ): void {
    PerfToolStruct.index = perfReq.index;
    let perfToolList = row.dataList;
    let perfToolFilter = row.dataListCache;
    dataFilterHandler(perfToolList, perfToolFilter, {
      startKey: 'startTs',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 3,
      useCache: perfReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(perfReq.context, perfToolFilter, row);
    perfReq.context.beginPath();
    let find = false;
    for (let re of perfToolFilter) {
      PerfToolStruct.draw(perfReq.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        PerfToolStruct.hoverPerfToolStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      PerfToolStruct.hoverPerfToolStruct = undefined;
    }
    perfReq.context.closePath();
  }
}
export function PerfToolsStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: PerfToolStruct,
): Promise<unknown> {

  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_PERF_TOOL && (PerfToolStruct.hoverPerfToolStruct || entry)) {
      PerfToolStruct.selectPerfToolStruct = entry || PerfToolStruct.hoverPerfToolStruct;
      sp.traceSheetEL?.displayPerfToolsData(PerfToolStruct.selectPerfToolStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class PerfToolStruct extends BaseStruct {
  static hoverPerfToolStruct: PerfToolStruct | undefined;
  static selectPerfToolStruct: PerfToolStruct | undefined;
  static index = 0;
  count: string | undefined;
  startTs: number | undefined;
  dur: number | undefined;
  id: number | undefined;
  name: string | undefined;

  static draw(PerfContext: CanvasRenderingContext2D, data: PerfToolStruct): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      PerfContext.globalAlpha = 1;
      PerfContext.fillStyle = ColorUtils.colorForTid(PerfToolStruct.index);
      PerfContext.fillRect(data.frame.x, data.frame.y, width, data.frame.height);
      if (data.frame.width > 7) {
        PerfContext.textBaseline = 'middle';
        PerfContext.lineWidth = 1;
        let countText: string | undefined = '';
        if (data.count) {
          countText = `${data.count}`;
        }
        PerfContext.fillStyle = ColorUtils.funcTextColor('#000');
        drawString(PerfContext, countText, 2, data.frame, data);
      }
      if (
        data.id === PerfToolStruct.selectPerfToolStruct?.id &&
        data.name === PerfToolStruct.selectPerfToolStruct?.name
      ) {
        PerfContext.strokeStyle = '#000';
        PerfContext.lineWidth = 2;
        PerfContext.strokeRect(data.frame.x, data.frame.y + 1, data.frame.width, data.frame.height - 2);
      }
    }
  }

  static isHover(clock: PerfToolStruct): boolean {
    return clock === PerfToolStruct.hoverPerfToolStruct || clock === PerfToolStruct.selectPerfToolStruct;
  }
}
