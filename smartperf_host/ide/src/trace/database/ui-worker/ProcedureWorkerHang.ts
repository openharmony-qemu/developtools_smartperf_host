/*
 * Copyright (C) 2024 Shenzhen Kaihong Digital Industry Development Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License")  
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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, drawString, isFrameContainPoint, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { HangType } from '../../component/chart/SpHangChart';

/// Render类 用于处理Hang子泳道的绘制逻辑
export class HangRender extends Render {
  renderMainThread(
    hangReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      index: number;
    },
    row: TraceRow<HangStruct>,
  ): void {
    HangStruct.index = hangReq.index;
    let hangList = row.dataList;
    let hangFilter = row.dataListCache;
    let filterConfig = {
      startKey: 'startTime',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 2,
      useCache: hangReq.useCache || !(TraceRow.range?.refresh ?? false),
    };
    dataFilterHandler(hangList, hangFilter, filterConfig);
    drawLoadingFrame(hangReq.context, hangFilter, row);
    hangReq.context.beginPath();
    let find = false;
    for (let re of hangFilter) {
      HangStruct.draw(hangReq.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        HangStruct.hoverHangStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) {
      HangStruct.hoverHangStruct = undefined;
    }
    hangReq.context.closePath();
  }
}

export function HangStructOnClick(clickRowType: string, sp: SpSystemTrace, scrollCallback: Function): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if ((clickRowType === TraceRow.ROW_TYPE_HANG || clickRowType === TraceRow.ROW_TYPE_HANG_INNER) && HangStruct.hoverHangStruct) {
      HangStruct.selectHangStruct = HangStruct.hoverHangStruct;
      sp.traceSheetEL?.displayHangData(HangStruct.selectHangStruct, sp, scrollCallback);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

/// BaseStruct类 存储每个Hang事件详细信息 管理Hang色块绘制细节
export class HangStruct extends BaseStruct {
  static hoverHangStruct: HangStruct | undefined;
  static selectHangStruct: HangStruct | undefined;
  static index = 0;
  id: number | undefined;
  startTime: number | undefined;
  dur: number | undefined;
  tid: number | undefined;
  pid: number | undefined;
  // 手动补充 按时间分类
  type: HangType | undefined;
  // 手动补充
  pname: string | undefined;
  // 手动补充 在tab页中需要手动解析内容
  content: string | undefined;
  name: string | undefined;

  static getFrameColor(data: HangStruct): string {
    return ({
      'Instant': '#559CFF',
      'Circumstantial': '#E8BE44',
      'Micro': '#FEB354',
      'Severe': '#FC7470',
      '': '',
    })[data.type!];
  }

  static draw(ctx: CanvasRenderingContext2D, data: HangStruct): void {
    if (data.frame) {
      ctx.fillStyle = HangStruct.getFrameColor(data);
      ctx.strokeStyle = HangStruct.getFrameColor(data);

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;

      if (data === HangStruct.hoverHangStruct) {
        ctx.globalAlpha = 0.7;
      }

      ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      if (data.frame.width > 10) {
        ctx.fillStyle = '#000';
        drawString(ctx, `${data.type || ''}`, 1, data.frame, data);
      }

      if (data === HangStruct.selectHangStruct && HangStruct.equals(HangStruct.selectHangStruct, data)) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          data.frame.x + 1,
          data.frame.y + 1,
          data.frame.width - 2,
          data.frame.height - 2,
        );
      }

      ctx.globalAlpha = 1;
    }
  }

  static isHover(data: HangStruct): boolean {
    return data === HangStruct.hoverHangStruct || data === HangStruct.selectHangStruct;
  }
  static equals(d1: HangStruct, d2: HangStruct): boolean {
    return (
      d1 &&
      d2 &&
      d1.pid === d2.pid &&
      d1.tid === d2.tid &&
      d1.pname === d2.pname &&
      d1.startTime === d2.startTime &&
      d1.dur === d2.dur &&
      d1.type === d2.type &&
      d1.id === d2.id &&
      d1.name === d2.name
    );
  }
}
