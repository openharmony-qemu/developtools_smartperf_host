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
import {
  BaseStruct,
  Render,
  ns2x,
  Rect,
  drawString,
  isFrameContainPoint,
  drawLoadingFrame,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { SpUserFileChart } from '../../component/chart/SpUserPluginChart';

const SAMPLE_STRUCT_HEIGHT = 20;
const Y_PADDING = 2;

export class SampleRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      start_ts: number;
      uniqueProperty: Array<unknown>;
      flattenTreeArray: Array<SampleStruct>;
    },
    row: TraceRow<SampleStruct>
  ): void {
    let startTs = req.start_ts;
    let sampleList = row.dataList;
    let sampleFilter = row.dataListCache;
    SampleStruct.reqProperty = req;
    func(
      sampleList,
      sampleFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      startTs,
      row.frame,
      req.useCache || TraceRow.range!.refresh
    );
    drawLoadingFrame(req.context, sampleFilter, row, true);
    req.context.beginPath();
    let find = false;
    for (let re of sampleFilter) {
      SampleStruct.draw(req.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        SampleStruct.hoverSampleStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      SampleStruct.hoverSampleStruct = undefined;
    }
    req.context.closePath();
  }
}

export function func(
  sampleList: Array<SampleStruct>,
  sampleFilter: Array<SampleStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  startTS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && sampleFilter.length > 0) {
    for (let i = 0, len = sampleFilter.length; i < len; i++) {
      //@ts-ignore
      if ((sampleFilter[i].end - startTS || 0) >= startNS && (sampleFilter[i].begin - startTS || 0) <= endNS) {
        SampleStruct.setSampleFrame(sampleFilter[i], 0, startNS, endNS, totalNS, startTS, frame);
      } else {
        sampleFilter[i].frame = undefined;
      }
    }
    return;
  }
  sampleFilter.length = 0;
  setSampleFilter(sampleList, sampleFilter, startNS, startTS, endNS, totalNS, frame);
}

function setSampleFilter(
  sampleList: Array<SampleStruct>,
  sampleFilter: Array<SampleStruct>,
  startNS: number,
  startTS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (sampleList) {
    sampleList.forEach((func) => {
      let funcProperty: Array<unknown> = func.property!;
      let groups = funcProperty
        //@ts-ignore
        .filter((it) => (it.end - startTS ?? 0) >= startNS && (it.begin - startTS ?? 0) <= endNS)
        .map((it) => {
          //@ts-ignore
          SampleStruct.setSampleFrame(it, 0, startNS, endNS, totalNS, startTS, frame);
          return it;
        })
        .reduce((pre, current) => {
          //@ts-ignore
          (pre[`${current.frame.x}-${current.depth}`] = pre[`${current.frame.x}-${current.depth}`] || []).push(current);
          return pre;
        }, {});
      //@ts-ignore
      Reflect.ownKeys(groups).map((kv) => {
        //@ts-ignore
        let arr = groups[kv].sort((a: unknown, b: unknown) => b.end - b.start - (a.end - a.start));
        sampleFilter.push(arr[0]);
      });
    });
  }
}

export function sampleStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: TraceRow<SampleStruct> | undefined,
  entry?: SampleStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_SAMPLE && (SampleStruct.hoverSampleStruct || entry)) {
      SampleStruct.selectSampleStruct = entry || SampleStruct.hoverSampleStruct;
      if (row?.rowId === 'userPlugin') {
        SpUserFileChart.userPluginData!.map((v: unknown) => {
          //@ts-ignore
          if (v.func_name === SampleStruct.selectSampleStruct!.name &&
            //@ts-ignore
            v.begin === SampleStruct.selectSampleStruct?.begin) {
            sp.traceSheetEL?.displayUserPlugin(v)
          }
        })
      } else {
        sp.traceSheetEL?.displaySampleData(SampleStruct.selectSampleStruct!, SampleStruct.reqProperty);
        sp.timerShaftEL?.modifyFlagList(undefined);
      }
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class SampleStruct extends BaseStruct {
  static hoverSampleStruct: SampleStruct | undefined;
  static selectSampleStruct: SampleStruct | undefined;
  static reqProperty: unknown | undefined;
  name: string | undefined;
  detail: string | undefined;
  property: Array<unknown> | undefined;
  begin: number | undefined;
  end: number | undefined;
  depth: number | undefined;
  startTs: number | undefined;
  instructions: number | undefined;
  cycles: number | undefined;
  static setSampleFrame(
    sampleNode: SampleStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    startTS: number,
    frame: Rect
  ): void {
    let x1: number, x2: number;
    if ((sampleNode.begin! - startTS || 0) > startNS && (sampleNode.begin! - startTS || 0) < endNS) {
      x1 = ns2x(sampleNode.begin! - startTS || 0, startNS, endNS, totalNS, frame);
    } else {
      x1 = 0;
    }
    if ((sampleNode.end! - startTS || 0) > startNS && (sampleNode.end! - startTS || 0) < endNS) {
      x2 = ns2x(sampleNode.end! - startTS || 0, startNS, endNS, totalNS, frame);
    } else {
      x2 = frame.width;
    }
    if (!sampleNode.frame) {
      sampleNode.frame! = new Rect(0, 0, 0, 0);
    }
    let getV: number = x2 - x1 < 1 ? 1 : x2 - x1;
    sampleNode.frame!.x = Math.floor(x1);
    sampleNode.frame!.y = sampleNode.depth! * SAMPLE_STRUCT_HEIGHT;
    sampleNode.frame!.width = Math.ceil(getV);
    sampleNode.frame!.height = SAMPLE_STRUCT_HEIGHT;
    sampleNode.startTs = startTS;
  }
  static draw(ctx: CanvasRenderingContext2D, data: SampleStruct): void {
    if (data.depth === undefined || data.depth === null) {
      return;
    }
    if (data.frame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle =
        ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', data.depth, ColorUtils.FUNC_COLOR.length)];
      const textColor =
        ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', data.depth, ColorUtils.FUNC_COLOR.length)];
      if (SampleStruct.hoverSampleStruct && data.name === SampleStruct.hoverSampleStruct.name) {
        ctx.globalAlpha = 0.7;
      }
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, SAMPLE_STRUCT_HEIGHT - Y_PADDING);
      ctx.fillStyle = ColorUtils.funcTextColor(textColor);
      drawString(ctx, `${data.detail + '(' + data.name + ')' || ''}`, 5, data.frame, data);
      if (data === SampleStruct.selectSampleStruct) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.frame.x, data.frame.y + 1, data.frame.width, SAMPLE_STRUCT_HEIGHT - Y_PADDING - 2);
      }
    }
  }
  static equals(d1: SampleStruct, d2: SampleStruct): boolean {
    return d1 && d2 && d1.name === d2.name && d1.begin === d2.begin;
  }
}
