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
  BaseStruct,
  isFrameContainPoint,
  Render,
  RequestMessage,
  drawString,
  drawLoadingFrame,
} from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class ThreadSysCallRender extends Render {
  renderMainThread(
    threadReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      translateY: number;
    },
    row: TraceRow<ThreadSysCallStruct>
  ): void {
    let threadList = row.dataList;
    let threadFilter = row.dataListCache;
    dataFilterHandler(threadList, threadFilter, {
      startKey: 'startTs',
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
      ThreadSysCallStruct.drawThread(threadReq.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame!, row.hoverX, row.hoverY)) {
        ThreadSysCallStruct.hoverStruct = re;
        find = true;
      }
    }
    threadReq.context.closePath();
  }

  render(threadReq: RequestMessage, threadList: Array<unknown>, threadFilter: Array<unknown>): void {}
}

export function ThreadSysCallStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: ThreadSysCallStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_THREAD_SYS_CALL && (ThreadSysCallStruct.hoverStruct || entry)) {
      ThreadSysCallStruct.selectStruct = entry || ThreadSysCallStruct.hoverStruct;
      sp.timerShaftEL?.drawTriangle(ThreadSysCallStruct.selectStruct!.startTs || 0, 'inverted');
      sp.traceSheetEL?.displaySysCallData(ThreadSysCallStruct.selectStruct!);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class ThreadSysCallStruct extends BaseStruct {
  static hoverStruct: ThreadSysCallStruct | undefined;
  static selectStruct: ThreadSysCallStruct | undefined;
  name: string | undefined;
  tid: number | undefined;
  id: number | undefined;
  pid: number | undefined;
  itid: number | undefined;
  startTs: number | undefined;
  dur: number | undefined;
  args: string | undefined;
  ret: number | undefined;

  static drawThread(threadContext: CanvasRenderingContext2D, data: ThreadSysCallStruct): void {
    if (data.frame) {
      threadContext.globalAlpha = 1;
      threadContext.fillStyle = ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)];
      let textColor = ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)];
      if (ThreadSysCallStruct.hoverStruct && data.name === ThreadSysCallStruct.hoverStruct.name) {
        threadContext.globalAlpha = 0.7;
      }
      threadContext.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      threadContext.fillStyle = ColorUtils.funcTextColor(textColor);
      threadContext.textBaseline = 'middle';
      threadContext.font = '8px sans-serif';
      data.frame.width > 7 && data.name && drawString(threadContext, data.name, 2, data.frame, data);
      if (
        ThreadSysCallStruct.selectStruct &&
        ThreadSysCallStruct.equals(ThreadSysCallStruct.selectStruct, data) 
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
    }
  }

  static equals(d1: ThreadSysCallStruct, d2: ThreadSysCallStruct): boolean {
    return (
      d1 &&
      d2 &&
      d1.tid === d2.tid &&
      d1.name === d2.name &&
      d1.startTs === d2.startTs &&
      d1.dur === d2.dur
    );
  }
}
