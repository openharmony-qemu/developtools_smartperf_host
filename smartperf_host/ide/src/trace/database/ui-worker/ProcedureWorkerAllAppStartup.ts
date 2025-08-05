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

import { BaseStruct, dataFilterHandler, drawString, drawLoadingFrame } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { querySingleAppStartupsName } from '../sql/ProcessThread.sql';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class AllAppStartupRender {
  renderMainThread(
    req: {
      appStartupContext: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    appStartUpRow: TraceRow<AllAppStartupStruct>
  ): void {
    let list = appStartUpRow.dataList;
    let filter = appStartUpRow.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startTs',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: appStartUpRow.frame,
      paddingTop: 5,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    req.appStartupContext.globalAlpha = 0.6;
    let find = false;
    let offset = 3;
    drawLoadingFrame(req.appStartupContext, filter, appStartUpRow);
    for (let re of filter) {
      AllAppStartupStruct.draw(req.appStartupContext, re);
      if (appStartUpRow.isHover) {
        if (
          re.frame &&
          appStartUpRow.hoverX >= re.frame.x - offset &&
          appStartUpRow.hoverX <= re.frame.x + re.frame.width + offset
        ) {
          AllAppStartupStruct.hoverStartupStruct = re;
          find = true;
        }
      }
    }
    if (!find && appStartUpRow.isHover) {
      AllAppStartupStruct.hoverStartupStruct = undefined;
    }
  }
}
export function allAppStartupStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  scrollToFuncHandler: Function,
  entry?: AllAppStartupStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_ALL_APPSTARTUPS && (AllAppStartupStruct.hoverStartupStruct || entry)) {
      AllAppStartupStruct.selectStartupStruct = entry || AllAppStartupStruct.hoverStartupStruct;
      sp.traceSheetEL?.displayAllStartupData(AllAppStartupStruct.selectStartupStruct!, scrollToFuncHandler);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class AllAppStartupStruct extends BaseStruct {
  static hoverStartupStruct: AllAppStartupStruct | undefined;
  static selectStartupStruct: AllAppStartupStruct | undefined;
  startTs: number | undefined;
  startName: number | undefined;
  dur: number | undefined;
  value: string | undefined;
  pid: number | undefined;
  process: string | undefined;
  tid: number | undefined;
  itid: number | undefined;
  endItid: number | undefined;
  stepName: string | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: AllAppStartupStruct): void {
    if (data.frame) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = ColorUtils.colorForTid(data.startName!);
      ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      if (data.frame.width > 7) {
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 1;
        let draAppName: string | undefined = '';
        if (data.stepName) {
          draAppName = `${data.stepName} (${(data.dur! / 1000000).toFixed(2)}ms)`;
        }
        let textColor =
          ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.stepName || '', 0, ColorUtils.FUNC_COLOR.length)];
        ctx.fillStyle = ColorUtils.funcTextColor(textColor);
        drawString(ctx, draAppName, 2, data.frame, data);
      }
      if (data === AllAppStartupStruct.selectStartupStruct) {
        ctx.strokeStyle = '#232c5d';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
      }
    }
  }
}
