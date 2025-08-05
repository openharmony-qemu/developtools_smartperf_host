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
import { drawLoadingFrame } from './ProcedureWorkerCommon';
import { ns2x, Rect } from './ProcedureWorkerCommon';
import { Flag } from '../../component/trace/timer-shaft/Flag';
export class FreqExtendRender extends Render {
  renderMainThread(
    freqReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<CpuFreqExtendStruct>
  ): void {
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
    drawLoadingFrame(freqReq.context, freqExtendFilter, row);
    freqReq.context.beginPath();
    let find = false;
    // tab页点击周期
    if (SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key !== '' && SpSegmentationChart.tabHoverObj.key === freqReq.type) {
      // 鼠标不在tab页,清空高亮
      if (!SpSegmentationChart.trace.isMousePointInSheet) {
        SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
        CpuFreqExtendStruct.hoverStruct = undefined;
        SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
        find = false;
      }
      // tab页点击周期对应泳道
      if (SpSegmentationChart.tabHoverObj.key === freqReq.type) {
        for (let re of freqExtendFilter) {
          if (!row.isHover && re.cycle === SpSegmentationChart.tabHoverObj.cycle) {
            CpuFreqExtendStruct.hoverStruct = re;
            find = true;
          }
          CpuFreqExtendStruct.draw(freqReq.context, re, freqReq.type, row);
        }
        // dur太小，从datalist里面找
        if (!find) {
          let hoverData = freqExtendList.filter(v => {
            return v.cycle === SpSegmentationChart.tabHoverObj.cycle;
          })[0];
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
      } else {
        for (let re of freqExtendFilter) {
          CpuFreqExtendStruct.draw(freqReq.context, re, freqReq.type, row);
        }
      }
      // 正常悬浮或者tab页取消点击周期
    } else {
      // 鼠标悬浮色块
      for (let re of freqExtendFilter) {
        if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
          if (SpSegmentationChart.tabHoverObj) {
            // @ts-ignore
            SpSegmentationChart.tabHoverObj = { key: freqReq.type, cycle: re.cycle };
          }
          CpuFreqExtendStruct.hoverStruct = re;
          find = true;
        }
        CpuFreqExtendStruct.draw(freqReq.context, re, freqReq.type, row);
      }
      // 取消点击周期
      if ((row.isHover && !find) || (!row.isHover && SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key !== '' &&
        freqReq.type === SpSegmentationChart.tabHoverObj.key) ||
        (SpSegmentationChart.trace.isMousePointInSheet && SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key === '')
      ) {
        CpuFreqExtendStruct.hoverStruct = undefined;
        SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
        SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
      }
    }
    freqReq.context.closePath();
  }
}

export class CpuFreqExtendStruct extends BaseStruct {
  static hoverStruct: CpuFreqExtendStruct | undefined;
  static cpuMaxValue: number = 0;
  static gpuMaxValue: number = 0;
  static schedMaxValue: number = 0;
  static cpuCycle: number = -1;
  static gpuCycle: number = -1;
  static schedCycle: number = -1;
  static isTabHover: boolean = false;
  static hoverType: string = '';
  static tabCycle: number = -1;
  static selectCpuFreqStruct: CpuFreqExtendStruct | undefined;
  value: number = 0;
  startNS: number = 0;
  dur: number | undefined; //自补充，数据库没有返回
  cycle: number | undefined;
  colorIndex: number = 0;

  static draw(freqContext: CanvasRenderingContext2D, data: CpuFreqExtendStruct, type: string, row: TraceRow<CpuFreqExtendStruct>): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      let index = data.colorIndex || 0;
      index += 2;
      let color = ColorUtils.colorForTid(index);
      if (type === 'SCHED-SWITCH') {
        color = '#3ced33';
      }
      freqContext.fillStyle = color;
      if (
        data === CpuFreqExtendStruct.hoverStruct
      ) {
        freqContext.globalAlpha = 1.0;
        let drawHeight: number = Math.floor(
          ((data.value || 0) * (data.frame.height || 0) * 1.0) / (type === 'CPU-FREQ'
            ? CpuFreqExtendStruct.cpuMaxValue : type === 'GPU-FREQ'
              ? CpuFreqExtendStruct.gpuMaxValue : CpuFreqExtendStruct.schedMaxValue)
        );
        if (drawHeight < 1) {
          drawHeight = 1;
        }
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width < 1 ? 1 : width, drawHeight);
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
        freqContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, width < 1 ? 1 : width, drawHeight);
      }
    }
  }
}
