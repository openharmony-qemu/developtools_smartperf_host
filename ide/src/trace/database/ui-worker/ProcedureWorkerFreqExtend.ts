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
import { BaseStruct, dataFilterHandler, isFrameContainPoint, Render, RequestMessage } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { SpSegmentationChart } from '../../component/chart/SpSegmentationChart';
import { ns2x, Rect } from './ProcedureWorkerCommon';
import { Flag } from '../../component/trace/timer-shaft/Flag';
import { BinderStruct } from './procedureWorkerBinder';
import { ThreadStruct } from './ProcedureWorkerThread';
import { TabPaneFreqStatesDataCut } from '../../component/trace/sheet/states/TabPaneFreqStatesDataCut';
export class FreqExtendRender extends Render {
  renderMainThread(
    freqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<CpuFreqExtendStruct>
  ) {
    let freqExtendList = row.dataList;
    let freqExtendFilter = row.dataListCache;
    dataFilterHandler(freqExtendList, freqExtendFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: freqReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    if (row.isHover) {
      if (freqReq.type === 'cpu-freq') {
        CpuFreqExtendStruct.cpuCycle = -1;
      } else if (freqReq.type === 'gpu-freq') {
        CpuFreqExtendStruct.gpuCycle = -1;
      } else {
        CpuFreqExtendStruct.schedCycle = -1
      }
      CpuFreqExtendStruct.isTabHover = false;
    }
    freqReq.context.beginPath();
    for (let re of freqExtendList) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        CpuFreqExtendStruct.hoverCpuFreqStruct = re;
      }
      CpuFreqExtendStruct.draw(freqReq.context, re, freqReq.type, row);
    }
    // tab页不高亮也没有悬浮泳道，取消竖线
    if(!CpuFreqExtendStruct.isTabHover && 
      CpuFreqExtendStruct.hoverCpuFreqStruct === undefined && 
      CpuFreqExtendStruct.selectCpuFreqStruct === undefined && 
      !BinderStruct.isTabHover &&
      !BinderStruct.selectCpuFreqStruct &&
      !BinderStruct.hoverCpuFreqStruct &&
      !ThreadStruct.hoverThreadStruct && 
      !TabPaneFreqStatesDataCut.isStateTabHover){
      SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
    }
    // 鼠标不在tab页内，取消所有tab页联动的参数
    if(!SpSegmentationChart.trace.isMousePointInSheet) {
      CpuFreqExtendStruct.isTabHover = false;
      CpuFreqExtendStruct.cpuCycle = -1;
      CpuFreqExtendStruct.schedCycle = -1;
      CpuFreqExtendStruct.gpuCycle = -1;
    }
    freqReq.context.closePath();
  }
}

export class CpuFreqExtendStruct extends BaseStruct {
  static cpuMaxValue: number = 0;
  static gpuMaxValue: number = 0;
  static schedMaxValue: number = 0;
  static cpuCycle: number = -1;
  static gpuCycle: number = -1;
  static schedCycle: number = -1;
  static isTabHover: boolean = false;
  static hoverType: string = '';
  static hoverCpuFreqStruct: CpuFreqExtendStruct | undefined;
  static selectCpuFreqStruct: CpuFreqExtendStruct | undefined;
  value: number = 0;
  startNS: number = 0;
  dur: number | undefined; //自补充，数据库没有返回
  cycle: number | undefined;
  colorIndex: number = 0;

  static draw(freqContext: CanvasRenderingContext2D, data: CpuFreqExtendStruct, type: string, row: TraceRow<CpuFreqExtendStruct>) {
    if (data.frame) {
      let width = data.frame.width || 0;
      let index = data.colorIndex || 0;
      index += 2;
      let color = ColorUtils.colorForTid(index);
      freqContext.fillStyle = color;
      if (
        data === CpuFreqExtendStruct.hoverCpuFreqStruct ||
        data === CpuFreqExtendStruct.selectCpuFreqStruct ||
        (type === CpuFreqExtendStruct.hoverType &&
          ((data.cycle === CpuFreqExtendStruct.cpuCycle && CpuFreqExtendStruct.cpuCycle !== -1) ||
            (data.cycle === CpuFreqExtendStruct.gpuCycle && CpuFreqExtendStruct.gpuCycle !== -1) ||
            (data.cycle === CpuFreqExtendStruct.schedCycle && CpuFreqExtendStruct.schedCycle !== -1)))
      ) {
          if(data === CpuFreqExtendStruct.hoverCpuFreqStruct || CpuFreqExtendStruct.isTabHover){
            let pointX: number = ns2x(
              data.startNS || 0,
              TraceRow.range!.startNS,
              TraceRow.range!.endNS,
              TraceRow.range!.totalNS,
              new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
            );
            SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = new Flag(
              Math.floor(pointX),
              0,
              0,
              0,
              data.startNS,
              '#666666',
              '',
              true,
              ''
            ); 
          } else {
            SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
          }
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0) * 1.0) / (type === 'CPU-FREQ'
            ? CpuFreqExtendStruct.cpuMaxValue : type === 'GPU-FREQ'
              ? CpuFreqExtendStruct.gpuMaxValue : CpuFreqExtendStruct.schedMaxValue)
        );
        if (drawHeight < 1) {
          drawHeight = 1;
        }
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      } else {
        freqContext.globalAlpha = 0.6;
        freqContext.lineWidth = 1;
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0)) / (type === 'CPU-FREQ'
            ? CpuFreqExtendStruct.cpuMaxValue : type === 'GPU-FREQ'
              ? CpuFreqExtendStruct.gpuMaxValue : CpuFreqExtendStruct.schedMaxValue)
        );
        if (drawHeight < 1) {
          drawHeight = 1;
        }
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width, drawHeight);
      }
    }
    freqContext.globalAlpha = 1.0;
    freqContext.lineWidth = 1;
  }
}
