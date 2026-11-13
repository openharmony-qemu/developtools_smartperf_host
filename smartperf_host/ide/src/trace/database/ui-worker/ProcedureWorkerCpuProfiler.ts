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
  Rect,
  Render,
  drawString,
  isFrameContainPoint,
  ns2x,
  drawLoadingFrame,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { type JsCpuProfilerChartFrame } from '../../bean/JsStruct';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class JsCpuProfilerRender extends Render {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
    },
    jsCpuProfilerRow: TraceRow<JsCpuProfilerStruct>
  ): void {
    let filter = jsCpuProfilerRow.dataListCache;
    jsCpuProfiler(
      filter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS, // @ts-ignore
      jsCpuProfilerRow.frame,
      req.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(req.context, filter, jsCpuProfilerRow);
    req.context.beginPath();
    let jsCpuProfilerFind = false;
    for (let re of filter) {
      JsCpuProfilerStruct.draw(req.context, re);
      setHoveStruct(jsCpuProfilerRow, re, jsCpuProfilerFind);
    }
    if (!jsCpuProfilerFind && jsCpuProfilerRow.isHover) {
      JsCpuProfilerStruct.hoverJsCpuProfilerStruct = undefined;
    }
    req.context.closePath();
  }
}
function setHoveStruct(
  jsCpuProfilerRow: TraceRow<JsCpuProfilerStruct>,
  re: JsCpuProfilerStruct,
  jsCpuProfilerFind: boolean
): void {
  if (jsCpuProfilerRow.isHover) {
    if (
      re.endTime - re.startTime === 0 ||
      re.endTime - re.startTime === null ||
      re.endTime - re.startTime === undefined
    ) {
      if (
        re.frame &&
        jsCpuProfilerRow.hoverX >= re.frame.x - 5 &&
        jsCpuProfilerRow.hoverX <= re.frame.x + 5 &&
        jsCpuProfilerRow.hoverY >= re.frame.y &&
        jsCpuProfilerRow.hoverY <= re.frame.y + re.frame.height
      ) {
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct = re;
        jsCpuProfilerFind = true;
      }
    } else {
      if (re.frame && isFrameContainPoint(re.frame, jsCpuProfilerRow.hoverX, jsCpuProfilerRow.hoverY)) {
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct = re;
        jsCpuProfilerFind = true;
      }
    }
  }
}
export function jsCpuProfiler(
  filter: Array<JsCpuProfilerStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  if (use && filter.length > 0) {
    for (let i = 0, len = filter.length; i < len; i++) {
      if ((filter[i].startTime || 0) + (filter[i].totalTime || 0) >= startNS && (filter[i].startTime || 0) <= endNS) {
        JsCpuProfilerStruct.setJsCpuProfilerFrame(filter[i], startNS, endNS, totalNS, frame);
      } else {
        filter[i].frame = undefined;
      }
    }
  }
}

const padding = 1;
export function JsCpuProfilerStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: TraceRow<JsCpuProfilerStruct>,
  entry?: JsCpuProfilerStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER) {
      if (row.findHoverStruct) {
        row.findHoverStruct();
      } else {
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct =
          JsCpuProfilerStruct.hoverJsCpuProfilerStruct || row.getHoverStruct();
      }
    }
    if (clickRowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER && (JsCpuProfilerStruct.hoverJsCpuProfilerStruct || entry)) {
      JsCpuProfilerStruct.selectJsCpuProfilerStruct = entry || JsCpuProfilerStruct.hoverJsCpuProfilerStruct;
      let selectStruct = JsCpuProfilerStruct.selectJsCpuProfilerStruct;
      let dataArr: Array<JsCpuProfilerChartFrame> = [];
      let parentIdArr: Array<number> = [];
      let that = sp;
      getTopJsCpuProfilerStruct(selectStruct!.parentId, selectStruct!, that, dataArr, parentIdArr);
      that.traceSheetEL?.displayJsProfilerData(dataArr);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

function getTopJsCpuProfilerStruct(
  parentId: number,
  selectStruct: JsCpuProfilerStruct,
  that: SpSystemTrace,
  dataArr: Array<JsCpuProfilerChartFrame> = [],
  parentIdArr: Array<number> = []
): void {
  if (parentId === -1 && selectStruct.parentId === -1) {
    // 点击的函数是第一层，直接设置其children的isSelect为true，不用重新算totalTime
    let data = that.chartManager!.arkTsChart.chartFrameMap.get(selectStruct!.id);
    if (data && dataArr.length === 0) {
      let copyData = JSON.parse(JSON.stringify(data));
      setSelectChildrenState(copyData);
      dataArr.push(copyData);
    }
  } else {
    let parent = that.chartManager!.arkTsChart.chartFrameMap.get(parentId);
    if (parent) {
      parentIdArr.push(parent.id);
      getTopJsCpuProfilerStruct(parent.parentId!, selectStruct, that, dataArr, parentIdArr);
      if (parent.parentId === -1 && dataArr.length === 0) {
        let data = that.chartManager!.arkTsChart.chartFrameMap.get(parent.id);
        let copyParent = JSON.parse(JSON.stringify(data));
        copyParent.totalTime = selectStruct.totalTime;
        copyParent.selfTime = 0;
        // depth为0的isSelect改为true
        copyParent.isSelect = true;
        if (copyParent.children.length > 0) {
          getSelectStruct(copyParent, selectStruct, parentIdArr);
        }
        dataArr.push(copyParent);
      }
    }
  }
}

function getSelectStruct(
  data: JsCpuProfilerChartFrame,
  selectStruct: JsCpuProfilerStruct,
  parentIdArr: number[]
): void {
  for (let child of data.children) {
    if (child === null) {
      continue;
    }
    if (child.id === selectStruct!.id) {
      // 将点击的函数的children的isSelect改为true
      setSelectChildrenState(child);
    } else {
      getSelectStruct(child, selectStruct, parentIdArr);
    }
    if (parentIdArr.includes(child.id)) {
      child.isSelect = true;
      child.totalTime = selectStruct.totalTime;
      child.selfTime = 0;
    }
  }
}

function setSelectChildrenState(data: JsCpuProfilerChartFrame): void {
  data.isSelect = true;
  if (data.children.length > 0) {
    for (let child of data.children) {
      if (child === null) {
        continue;
      }
      setSelectChildrenState(child);
    }
  }
}

export class JsCpuProfilerStruct extends BaseStruct {
  static lastSelectJsCpuProfilerStruct: JsCpuProfilerStruct | undefined;
  static selectJsCpuProfilerStruct: JsCpuProfilerStruct | undefined;
  static hoverJsCpuProfilerStruct: JsCpuProfilerStruct | undefined;
  id: number = 0;
  name: string = '';
  startTime: number = 0;
  endTime: number = 0;
  selfTime: number = 0;
  totalTime: number = 0;
  url: string = '';
  depth: number = 0;
  parentId: number = 0;
  children!: Array<JsCpuProfilerChartFrame>;
  isSelect: boolean = false;

  static setJsCpuProfilerFrame(
    jsCpuProfilerNode: JsCpuProfilerStruct,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let x1: number;
    let x2: number;
    if ((jsCpuProfilerNode.startTime || 0) > startNS && (jsCpuProfilerNode.startTime || 0) < endNS) {
      x1 = ns2x(jsCpuProfilerNode.startTime || 0, startNS, endNS, totalNS, frame);
    } else {
      x1 = 0;
    }
    if (
      (jsCpuProfilerNode.startTime || 0) + (jsCpuProfilerNode.totalTime || 0) > startNS &&
      (jsCpuProfilerNode.startTime || 0) + (jsCpuProfilerNode.totalTime || 0) < endNS
    ) {
      x2 = ns2x(
        (jsCpuProfilerNode.startTime || 0) + (jsCpuProfilerNode.totalTime || 0),
        startNS,
        endNS,
        totalNS,
        frame
      );
    } else {
      x2 = frame.width;
    }
    if (!jsCpuProfilerNode.frame) {
      jsCpuProfilerNode.frame = new Rect(0, 0, 0, 0);
    }
    let getV: number = x2 - x1 < 1 ? 1 : x2 - x1;
    jsCpuProfilerNode.frame.x = Math.floor(x1);
    jsCpuProfilerNode.frame.y = jsCpuProfilerNode.depth * 20;
    jsCpuProfilerNode.frame.width = Math.ceil(getV);
    jsCpuProfilerNode.frame.height = 20;
  }

  static draw(jsCpuProfilerCtx: CanvasRenderingContext2D, data: JsCpuProfilerStruct): void {
    if (data.frame) {
      if (data.endTime - data.startTime === undefined || data.endTime - data.startTime === null) {
      } else {
        jsCpuProfilerCtx.globalAlpha = 1;
        if (data.name === '(program)') {
          jsCpuProfilerCtx.fillStyle = '#ccc';
        } else if (data.name === '(idle)') {
          jsCpuProfilerCtx.fillStyle = '#f0f0f0';
        } else {
          jsCpuProfilerCtx.fillStyle =
            ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)];
        }
        let miniHeight = 20;
        if (JsCpuProfilerStruct.hoverJsCpuProfilerStruct && data === JsCpuProfilerStruct.hoverJsCpuProfilerStruct) {
          jsCpuProfilerCtx.globalAlpha = 0.7;
        }
        jsCpuProfilerCtx.fillRect(data.frame.x, data.frame.y, data.frame.width, miniHeight - padding * 2);
        if (data.frame.width > 8) {
          jsCpuProfilerCtx.lineWidth = 1;
          jsCpuProfilerCtx.fillStyle = ColorUtils.funcTextColor(
            ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)]
          );
          jsCpuProfilerCtx.textBaseline = 'middle';
          drawString(jsCpuProfilerCtx, `${data.name || ''}`, 4, data.frame, data);
        }
        if (
          JsCpuProfilerStruct.selectJsCpuProfilerStruct &&
          JsCpuProfilerStruct.equals(JsCpuProfilerStruct.selectJsCpuProfilerStruct, data)
        ) {
          jsCpuProfilerCtx.strokeStyle = '#000';
          jsCpuProfilerCtx.lineWidth = 2;
          jsCpuProfilerCtx.strokeRect(
            data.frame.x + 1,
            data.frame.y + 1,
            data.frame.width - 2,
            miniHeight - padding * 2 - 2
          );
        }
      }
    }
  }
  static equals(d1: JsCpuProfilerStruct, d2: JsCpuProfilerStruct): boolean {
    return (
      d1 &&
      d2 &&
      d1.id === d2.id &&
      d1.name === d2.name &&
      d1.url === d2.url &&
      d1.depth === d2.depth &&
      d1.totalTime === d2.totalTime &&
      d1.selfTime === d2.selfTime &&
      d1.startTime === d2.startTime &&
      d1.endTime === d2.endTime
    );
  }
}
