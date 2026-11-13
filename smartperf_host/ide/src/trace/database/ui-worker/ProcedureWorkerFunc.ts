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
import { TraceRow } from '../../component/trace/base/TraceRow';
import {
  isFrameContainPoint,
  ns2x,
  Render,
  RequestMessage,
  drawFunString,
  drawLoadingFrame,
  Rect,
} from './ProcedureWorkerCommon';
import { FuncStruct as BaseFuncStruct } from '../../bean/FuncStruct';
import { FlagsConfig } from '../../component/SpFlags';
import { TabPaneTaskFrames } from '../../component/trace/sheet/task/TabPaneTaskFrames';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { Utils } from '../../component/trace/base/Utils';

export class FuncRender {
  renderMainThread(
    req: { useCache: boolean; context: CanvasRenderingContext2D; type: string },
    row: TraceRow<FuncStruct>
  ): void {
    let funcList = row.dataList;
    let funcFilter = row.dataListCache;
    func(
      funcList,
      funcFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      req.useCache || !TraceRow.range!.refresh,
      row.funcExpand,
      row.rowParentId
    );
    drawLoadingFrame(req.context, funcFilter, row, true);
    req.context.beginPath();
    let funcFind = false;
    let flagConfig = FlagsConfig.getFlagsConfig('TaskPool');
    for (let re of funcFilter) {
      FuncStruct.draw(req.context, re, flagConfig);
      if (row.isHover) {
        if (re.dur === 0 || re.dur === null || re.dur === undefined) {
          if (
            re.frame &&
            re.itid &&
            row.hoverX >= re.frame.x - 5 &&
            row.hoverX <= re.frame.x + 5 &&
            row.hoverY >= re.frame.y &&
            row.hoverY <= re.frame.y + re.frame.height
          ) {
            FuncStruct.hoverFuncStruct = re;
            funcFind = true;
          }
        } else {
          if (re.frame && re.itid && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
            FuncStruct.hoverFuncStruct = re;
            funcFind = true;
          }
        }
      }
    }
    if (!funcFind && row.isHover) {
      FuncStruct.hoverFuncStruct = undefined;
    }
    req.context.closePath();
  }

  render(req: RequestMessage, list: Array<FuncStruct>, filter: Array<FuncStruct>): void { }
}

export function func(
  funcList: Array<FuncStruct>,
  funcFilter: Array<FuncStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean,
  expand: boolean,
  rowParentId: string | null | undefined
): void {
  if (use && funcFilter.length > 0) {
    if (rowParentId === 'UserPluginsRows' && !expand) {
      funcFilter = funcFilter.filter((it) => it.depth === 0);
    }
    for (let i = 0, len = funcFilter.length; i < len; i++) {
      if ((funcFilter[i].startTs || 0) + (funcFilter[i].dur || 0) >= startNS && (funcFilter[i].startTs || 0) <= endNS) {
        FuncStruct.setFuncFrame(funcFilter[i], 0, startNS, endNS, totalNS, frame);
      } else {
        funcFilter[i].frame = undefined;
      }
    }
    return;
  }
  funcFilter.length = 0;
  if (funcList) {
    let groups = funcList
      .filter(
        (it) =>
          (it.startTs ?? 0) + (it.dur ?? 0) >= startNS &&
          (it.startTs ?? 0) <= endNS &&
          ((!expand && it.depth === 0) || expand)
      )
      .map((it) => {
        FuncStruct.setFuncFrame(it, 0, startNS, endNS, totalNS, frame);
        return it;
      })
      .reduce((pre, current, index, arr) => {
        //@ts-ignore
        (pre[`${current.frame.x}-${current.depth}`] = pre[`${current.frame.x}-${current.depth}`] || []).push(current);
        return pre;
      }, {});
    Reflect.ownKeys(groups).map((kv) => {
      //@ts-ignore
      let arr = groups[kv].sort((a: FuncStruct, b: FuncStruct) => b.dur - a.dur);
      funcFilter.push(arr[0]);
    });
  }
}
export function funcStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row: TraceRow<FuncStruct> | undefined,
  scrollToFuncHandler: Function,
  entry?: FuncStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_FUNC && (FuncStruct.hoverFuncStruct || entry)) {
      if (FuncStruct.funcSelect) {
        sp.observerScrollHeightEnable = false;
        TabPaneTaskFrames.TaskArray = [];
        sp.removeLinkLinesByBusinessType('task');
        FuncStruct.firstSelectFuncStruct = FuncStruct.selectFuncStruct;
        let hoverFuncStruct = entry || FuncStruct.hoverFuncStruct;
        FuncStruct.selectFuncStruct = hoverFuncStruct;
        sp.timerShaftEL?.drawTriangle(FuncStruct.selectFuncStruct!.startTs || 0, 'inverted');
        TraceRow.rangeSelectObject = undefined;
        let flagConfig = FlagsConfig.getFlagsConfig('TaskPool');
        let showTabArray: Array<string> = ['current-selection'];
        if (flagConfig!.TaskPool === 'Enabled') {
          if (FuncStruct.selectFuncStruct?.funName) {
            if (FuncStruct.selectFuncStruct.funName.indexOf('H:Task ') >= 0) {
              showTabArray.push('box-task-frames');
              sp.drawTaskPollLine(row);
            }
          }
        }
        sp.traceSheetEL?.displayFuncData(
          showTabArray,
          // @ts-ignore
          row?.namePrefix,
          FuncStruct.selectFuncStruct!,
          scrollToFuncHandler,
          (datas: unknown, str: string, binderTid: number) => {
            sp.removeLinkLinesByBusinessType('func');
            if (str === 'binder-to') {
              //@ts-ignore
              datas.forEach((data: { tid: unknown; pid: unknown }) => {
                //@ts-ignore
                let endParentRow = sp.shadowRoot?.querySelector<TraceRow<unknown>>(
                  `trace-row[row-id='${data.pid}'][folder]`
                );
                sp.drawFuncLine(endParentRow, hoverFuncStruct, data, binderTid);
              });
            }
          },
          (dataList: FuncStruct[]): void => {
            dataList.sort((leftData: FuncStruct, rightData: FuncStruct) => leftData.ts! - rightData.ts!);
            FuncStruct.selectLineFuncStruct = dataList;
            sp.resetDistributedLine();
          }
        );
        sp.refreshCanvas(true);
        sp.timerShaftEL?.modifyFlagList(undefined);
      }
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}
export class FuncStruct extends BaseFuncStruct {
  static textColor: string;
  [x: string]: unknown;
  static hoverFuncStruct: FuncStruct | undefined;
  static selectFuncStruct: FuncStruct | undefined;
  static selectLineFuncStruct: Array<FuncStruct> = [];
  static firstSelectFuncStruct: FuncStruct | undefined;
  flag: string | undefined; // 570000
  textMetricsWidth: number | undefined;
  static funcSelect: boolean = true;
  pid: number | undefined;
  static setFuncFrame(
    funcNode: FuncStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let x1: number;
    let x2: number;
    if ((funcNode.startTs || 0) > startNS && (funcNode.startTs || 0) <= endNS) {
      x1 = ns2x(funcNode.startTs || 0, startNS, endNS, totalNS, frame);
    } else {
      x1 = 0;
    }
    if (
      (funcNode.startTs || 0) + (funcNode.dur || 0) > startNS &&
      (funcNode.startTs || 0) + (funcNode.dur || 0) <= endNS
    ) {
      x2 = ns2x((funcNode.startTs || 0) + (funcNode.dur || 0), startNS, endNS, totalNS, frame);
    } else {
      x2 = frame.width;
    }
    if (!funcNode.frame) {
      funcNode.frame = new Rect(0, 0, 0, 0);
    }
    let getV: number = x2 - x1 < 1 ? 1 : x2 - x1;
    funcNode.frame.x = Math.floor(x1);
    funcNode.frame.y = funcNode.depth! * 18 + 3;
    funcNode.frame.width = Math.ceil(getV);
    funcNode.frame.height = 18;
  }

  static draw(ctx: CanvasRenderingContext2D, data: FuncStruct, flagConfig?: unknown): void {
    if (data.frame) {
      if (data.dur === undefined || data.dur === null) {
      } else {
        ctx.globalAlpha = 1;
        //@ts-ignore
        if (Utils.getInstance().getCallStatckMap().get(data.funName) !== undefined) {
          //@ts-ignore
          ctx.fillStyle = ColorUtils.FUNC_COLOR[Utils.getInstance().getCallStatckMap().get(data.funName)];
          //@ts-ignore
          this.textColor = ColorUtils.FUNC_COLOR[Utils.getInstance().getCallStatckMap().get(data.funName)];
        } else {
          ctx.fillStyle = ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.funName || '', 0, ColorUtils.FUNC_COLOR.length)];
          this.textColor = ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.funName || '', 0, ColorUtils.FUNC_COLOR.length)];
        }
        if (FuncStruct.hoverFuncStruct && data.funName === FuncStruct.hoverFuncStruct.funName) {
          ctx.globalAlpha = 0.7;
        }
        ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
        if (data.frame.width > 10) {
          ctx.fillStyle = ColorUtils.funcTextColor(this.textColor);
          ctx.textBaseline = 'middle';
          drawFunString(ctx, `${data.funName || ''}`, 5, data.frame, data);
        }
        if (
          data.callid === FuncStruct.selectFuncStruct?.callid &&
          data.startTs === FuncStruct.selectFuncStruct?.startTs &&
          data.depth === FuncStruct.selectFuncStruct?.depth
        ) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(data.frame.x, data.frame.y + 1, data.frame.width, data.frame.height - 2);
        }
        //@ts-ignore
        if (flagConfig!.TaskPool === 'Enabled') {
          if (data.funName!.indexOf('H:Task PerformTask End:') >= 0 && data.funName!.indexOf('Successful') < 0) {
            if (data.frame!.width < 10) {
              FuncStruct.drawTaskPoolUnSuccessFlag(ctx, data.frame!.x, (data.depth! + 0.5) * 18, 3, data!);
            } else {
              FuncStruct.drawTaskPoolUnSuccessFlag(ctx, data.frame!.x, (data.depth! + 0.5) * 18, 6, data!);
            }
          }
          if (data.funName!.indexOf('H:Thread Timeout Exit') >= 0) {
            FuncStruct.drawTaskPoolTimeOutFlag(ctx, data.frame!.x, (data.depth! + 0.5) * 18, 10, data!);
          }
        }
        // 如果该函数没有结束时间，则绘制锯齿。
        if (data.nofinish && data.frame!.width > 4) {
          FuncStruct.drawRupture(ctx, data.frame.x, data.frame.y, data.frame.width, data.frame.height);
        }
      }
    }
  }

  /**
   * 绘制锯齿
   * @param ctx 绘图上下文环境
   * @param x 水平坐标
   * @param y 垂直坐标
   * @param width 函数矩形框的宽度
   * @param height 函数矩形框的高度
   */
  static drawRupture(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.fillStyle = '#fff'; // 白色: '#fff' , 红色: '#FF0000';
    let ruptureWidth = 5;
    let ruptureNode = height / ruptureWidth;
    let len = height / ruptureNode;
    ctx.moveTo(x + width - 1, y);
    for (let i = 1; i <= ruptureNode; i++) {
      ctx.lineTo(x + width - 1 - (i % 2 === 0 ? 0 : ruptureWidth), y + len * i - 2);
    }
    ctx.closePath();
    ctx.fill();
  }

  static drawTaskPoolUnSuccessFlag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    data: FuncStruct
  ): void {
    ctx.strokeStyle = '#FFC880';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + data.frame!.width, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#E64566';
    ctx.fill();
    ctx.stroke();
  }

  static drawTaskPoolTimeOutFlag(
    canvas: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    data: FuncStruct
  ): void {
    canvas.strokeStyle = '#FFC880';
    canvas.lineWidth = 1;
    canvas.beginPath();
    canvas.arc(x + data.frame!.width + 20, y, radius, 0, Math.PI * 2);
    canvas.closePath();
    canvas.fillStyle = '#FFC880';
    canvas.fill();
    canvas.stroke();
    canvas.font = '18px Arial';
    canvas.fillStyle = ColorUtils.GREY_COLOR;
    canvas.textAlign = 'center';
    canvas.fillText('¡', x + data.frame!.width + 20, y);
  }

  static isSelected(data: FuncStruct): boolean {
    return (
      FuncStruct.selectFuncStruct !== undefined &&
      FuncStruct.selectFuncStruct.startTs === data.startTs &&
      FuncStruct.selectFuncStruct.depth === data.depth
    );
  }
}
