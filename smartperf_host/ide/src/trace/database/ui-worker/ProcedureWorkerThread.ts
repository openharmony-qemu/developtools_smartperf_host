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
  dataFilterHandler,
  isFrameContainPoint,
  Rect,
  Render,
  RequestMessage,
  drawString,
  drawLoadingFrame,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';
import { ThreadStruct as BaseThreadStruct } from '../../bean/ThreadStruct';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { SpSegmentationChart } from '../../component/chart/SpSegmentationChart';
import { ns2x } from './ProcedureWorkerCommon';
import { Flag } from '../../component/trace/timer-shaft/Flag';
import { CpuFreqExtendStruct } from './ProcedureWorkerFreqExtend';
import { BinderStruct } from './procedureWorkerBinder';
import { TabPaneFreqStatesDataCut } from '../../component/trace/sheet/states/TabPaneFreqStatesDataCut';
export class ThreadRender extends Render {
  renderMainThread(
    threadReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      translateY: number;
    },
    row: TraceRow<ThreadStruct>
  ): void {
    let threadList = row.dataList;
    let threadFilter = row.dataListCache;
    dataFilterHandler(threadList, threadFilter, {
      startKey: 'startTime',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 3,
      useCache: threadReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(threadReq.context, threadFilter, row);
    threadReq.context.beginPath();
    let find: boolean = false;
    for (let re of threadFilter) {
      re.translateY = threadReq.translateY;
      ThreadStruct.drawThread(threadReq.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame!, row.hoverX, row.hoverY)) {
        ThreadStruct.hoverThreadStruct = re;
        find = true;
      }
    }
    threadReq.context.closePath();
  }

  render(threadReq: RequestMessage, threadList: Array<unknown>, threadFilter: Array<unknown>): void {}
}

export function ThreadStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  threadClickHandler: unknown,
  cpuClickHandler: unknown,
  prioClickHandlerFunc: unknown,
  entry?: ThreadStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_THREAD && (ThreadStruct.hoverThreadStruct || entry)) {
      sp.removeLinkLinesByBusinessType('thread');
      ThreadStruct.selectThreadStruct = entry || ThreadStruct.hoverThreadStruct;
      sp.timerShaftEL?.drawTriangle(ThreadStruct.selectThreadStruct!.startTime || 0, 'inverted');
      sp.traceSheetEL?.displayThreadData(ThreadStruct.selectThreadStruct!,
        //@ts-ignore
        threadClickHandler, cpuClickHandler, prioClickHandlerFunc);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class ThreadStruct extends BaseThreadStruct {
  static otherColor = '#673ab7';
  static uninterruptibleSleepColor = '#f19d38';
  static uninterruptibleSleepNonIOColor = '#795548';
  static traceColor = '#0d47a1';
  static sColor = '#FBFBFB';
  static hoverThreadStruct: ThreadStruct | undefined;
  static selectThreadStruct: ThreadStruct | undefined;
  static selectThreadStructList: Array<ThreadStruct> = [];
  static firstselectThreadStruct: ThreadStruct | undefined;
  static isClickPrio: boolean = false;
  static prioCount: Array<unknown> = [];
  argSetID: number | undefined;
  translateY: number | undefined;
  textMetricsWidth: number | undefined;
  static startCycleTime: number = 0;
  static endTime: number = 0;

  static drawThread(threadContext: CanvasRenderingContext2D, data: ThreadStruct): void {
    if (data.frame) {

      threadContext.globalAlpha = 1;
      let stateText = ThreadStruct.getEndState(data.state || '');
      threadContext.fillStyle = Utils.getStateColor(data.state || '');
      if ('S' === data.state) {
        threadContext.globalAlpha = 0.2;
      };
      threadContext.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      threadContext.fillStyle = '#fff';
      threadContext.textBaseline = 'middle';
      threadContext.font = '8px sans-serif';
      data.frame.width > 7 && drawString(threadContext, stateText, 2, data.frame, data);
      if (
        ThreadStruct.selectThreadStruct &&
        ThreadStruct.equals(ThreadStruct.selectThreadStruct, data) &&
        data.state !== 'S'
      ) {
        threadContext.strokeStyle = '#232c5d';
        threadContext.lineWidth = 2;
        threadContext.strokeRect(
          data.frame.x,
          data.frame.y,
          data.frame.width - 2,
          data.frame.height
        );
      }
      if (!ThreadStruct.selectThreadStruct) {
        ThreadStruct.isClickPrio = false;
      }
    }
  }
}
