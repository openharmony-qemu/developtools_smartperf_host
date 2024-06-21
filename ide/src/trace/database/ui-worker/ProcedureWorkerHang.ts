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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, isFrameContainPoint, Render } from './ProcedureWorkerCommon'
import { TraceRow } from '../../component/trace/base/TraceRow'
import { SpSystemTrace } from '../../component/SpSystemTrace'
import { HangType } from '../../component/chart/SpHangChart'

export class HangRender extends Render {
  renderMainThread(
    hangReq: {
      context: CanvasRenderingContext2D
      useCache: boolean
      type: string
      index: number
      processName: string
    },
    row: TraceRow<HangStruct>
  ): void {
    HangStruct.index = hangReq.index
    let hangList = row.dataList
    let hangFilter = row.dataListCache
    let filterConfig = {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: hangReq.useCache || !(TraceRow.range?.refresh ?? false),
    }
    dataFilterHandler(hangList, hangFilter, filterConfig)
    drawLoadingFrame(hangReq.context, hangFilter, row)
    hangReq.context.beginPath()
    let find = false
    for (let re of hangFilter) {
      HangStruct.draw(hangReq.context, re)
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        HangStruct.hoverHangStruct = re
        find = true
      }
    }
    if (!find && row.isHover) {
      HangStruct.hoverHangStruct = undefined
    }
    hangReq.context.closePath()
    let s = hangReq.processName
    let textMetrics = hangReq.context.measureText(s)
    hangReq.context.globalAlpha = 0.8
    hangReq.context.fillStyle = '#f0f0f0'
    hangReq.context.fillRect(0, 5, textMetrics.width + 8, 18)
    hangReq.context.globalAlpha = 1
    hangReq.context.fillStyle = '#333'
    hangReq.context.textBaseline = 'middle'
    hangReq.context.fillText(s, 4, 5 + 9)
  }
}

export function HangStructOnClick(clickRowType: string, sp: SpSystemTrace): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_HANG && HangStruct.hoverHangStruct) {
      HangStruct.selectHangStruct = HangStruct.hoverHangStruct
      sp.traceSheetEL?.displayHangData(HangStruct.selectHangStruct)
      sp.timerShaftEL?.modifyFlagList(undefined)
      reject(new Error())
    } else {
      resolve(null)
    }
  })
}

export class HangStruct extends BaseStruct {
  static hoverHangStruct: HangStruct | undefined
  static selectHangStruct: HangStruct | undefined
  static index = 0
  id: number | undefined
  startNS: number | undefined
  dur: number | undefined
  tid: number | undefined
  pid: number | undefined
  type: HangType | undefined   // 手动补充 按时间分类
  pname: string | undefined    // 手动补充
  content: string | undefined    // 手动补充 在tab页中需要手动解析内容

  static getFrameColor(data: HangStruct): string {
    return ({
      "Instant": "#559CFF",
      "Circumstantial": "#FFE44D",
      "Micro": "#FEB354",
      "Severe": "#FC7470",
      "": "",
    })[data.type!]
  }

  static draw(hangContext: CanvasRenderingContext2D, data: HangStruct): void {
    if (data.frame) {
      hangContext.fillStyle = HangStruct.getFrameColor(data)
      hangContext.strokeStyle = HangStruct.getFrameColor(data)

      hangContext.globalAlpha = 0.6
      hangContext.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height)
      if (HangStruct.isHover(data)) {
        hangContext.lineWidth = 3
        hangContext.globalAlpha = 1
        hangContext.strokeRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height)
      }
      hangContext.globalAlpha = 1
      hangContext.lineWidth = 1
    }
  }

  static isHover(data: HangStruct): boolean {
    return data === HangStruct.hoverHangStruct || data === HangStruct.selectHangStruct
  }
}
