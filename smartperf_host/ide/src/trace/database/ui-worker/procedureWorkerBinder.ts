
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
import { drawString, Rect, ns2x } from './ProcedureWorkerCommon';
import { SpSegmentationChart } from '../../component/chart/SpSegmentationChart';
import { Flag } from '../../component/trace/timer-shaft/Flag';
import { CpuFreqExtendStruct } from './ProcedureWorkerFreqExtend';
import { AllstatesStruct } from './ProcedureWorkerAllStates';
export class BinderRender extends Render {
  renderMainThread(
    freqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<BinderStruct>
  ) {
    let binderList = row.dataList;
    let binderFilter = row.dataListCache;
    dataFilterHandler(binderList, binderFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: freqReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    let find = false;
    BinderStruct.hoverCpuFreqStruct = undefined;
    if (SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key !== '') {
      if (!SpSegmentationChart.trace.isMousePointInSheet) {
        SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
      }
      if (SpSegmentationChart.tabHoverObj.key === freqReq.type) {
        for (let re of binderFilter) {
          if (!row.isHover && re.cycle === SpSegmentationChart.tabHoverObj.cycle) {
            BinderStruct.hoverCpuFreqStruct = re;
            find = true;
          }
          BinderStruct.draw(freqReq.context, re);
        }
        // dur太小，从datalist里面找
        if (!find) {
          let hoverData = binderList.filter(v => {
            return v.cycle === SpSegmentationChart.tabHoverObj.cycle;
          })[0];
          if (hoverData) {
            let pointX: number = ns2x(
              hoverData.startNS || 0,
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
              hoverData.startNS,
              '#666666',
              '',
              true,
              ''
            );
          }
        }
      } else {
        for (let re of binderFilter) {
          BinderStruct.draw(freqReq.context, re);
        }
      }
    } else {
      for (let re of binderFilter) {
        if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
          BinderStruct.hoverCpuFreqStruct = re;
          find = true;
        }
        BinderStruct.draw(freqReq.context, re);
      }
    }
    if (!find &&
      SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key === '' &&
      CpuFreqExtendStruct.hoverStruct === undefined && !AllstatesStruct.hoverThreadStruct) {
      BinderStruct.hoverCpuFreqStruct = undefined;
      SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
      find = false;
    }
    freqReq.context.closePath();
  }
}
export class BinderStruct extends BaseStruct {
  static hoverCpuFreqStruct: BinderStruct | undefined;
  static selectCpuFreqStruct: BinderStruct | undefined;
  static maxHeight: number = 0;
  static hoverCycle: number = -1;
  static isTabHover: boolean = false;
  value: number = 0;
  cycle: number = 0;
  startNS: number = 0;
  dur: number | undefined; //自补充，数据库没有返回
  name: string | undefined;
  depth: number = 0;
  static draw(freqContext: CanvasRenderingContext2D, data: BinderStruct) {
    if (data.frame) {
      let color = '';
      if (data.name === 'binder transaction') {
        color = '#e86b6a';
      }
      if (data.name === 'binder transaction async') {
        color = '#36baa4';
      }
      if (data.name === 'binder reply') {
        color = '#8770d3';
      }
      if (data.name === 'binder async rcv') {
        color = '#0cbdd4';
      }
      freqContext.fillStyle = color;
      if (
        data === BinderStruct.hoverCpuFreqStruct ||
        data === BinderStruct.selectCpuFreqStruct
      ) {
        let pointX: number = ns2x(
          data.startNS || 0,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
        );
        if (BinderStruct.isTabHover || data === BinderStruct.hoverCpuFreqStruct) {
          SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = new Flag(
            Math.floor(pointX),
            0,
            0,
            0,
            data.startNS,
            '#666',
            '',
            true,
            ''
          );
          freqContext.globalAlpha = 1;
          freqContext.lineWidth = 1;
          freqContext.fillRect(
            data.frame.x,
            BinderStruct.maxHeight * 20 - data.depth * 20 + 20,
            data.frame.width,
            data.value * 20
          );
        }
      } else {
        freqContext.globalAlpha = 0.6;
        freqContext.lineWidth = 1;
        freqContext.fillRect(
          data.frame.x,
          BinderStruct.maxHeight * 20 - data.depth * 20 + 20,
          data.frame.width,
          data.value * 20
        );
      }
      if (data.frame.width > 8) {
        freqContext.lineWidth = 1;
        freqContext.fillStyle = ColorUtils.funcTextColor(
          ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)]
        );
        freqContext.textBaseline = 'middle';
        drawString(
          freqContext,
          `${data.name || ''}`,
          6,
          new Rect(data.frame.x, BinderStruct.maxHeight * 20 - data.depth * 20 + 20, data.frame.width, data.value * 20),
          data
        );
      }
      freqContext.globalAlpha = 1.0;
      freqContext.lineWidth = 1;
    }
  }
}
