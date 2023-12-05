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

import { ColorUtils } from '../../component/trace/base/ColorUtils.js';
import { BaseStruct, dataFilterHandler, isFrameContainPoint, Render, RequestMessage } from './ProcedureWorkerCommon.js';
import { TraceRow } from '../../component/trace/base/TraceRow.js';
import { drawString, Rect } from './ProcedureWorkerCommon.js';

export class BinderRender extends Render {
    renderMainThread(
        freqReq: {
            context: CanvasRenderingContext2D;
            useCache: boolean;
            type: string;
        },
        row: TraceRow<binderStruct>
    ) {
        let freqList = row.dataList;
        let freqFilter = row.dataListCache;
        dataFilterHandler(freqList, freqFilter, {
            startKey: 'startNS',
            durKey: 'dur',
            startNS: TraceRow.range?.startNS ?? 0,
            endNS: TraceRow.range?.endNS ?? 0,
            totalNS: TraceRow.range?.totalNS ?? 0,
            frame: row.frame,
            paddingTop: 5,
            useCache: freqReq.useCache || !(TraceRow.range?.refresh ?? false),
        });
        freqReq.context.beginPath();
        for (let re of freqFilter) {
            if (row.isHover
                && re.frame
                && (re.frame.x < row.hoverX
                    && (binderStruct.maxHeight * 20 - re.depth * 20 + 20) < row.hoverY
                    && re.frame.x + re.frame.width > row.hoverX
                    && binderStruct.maxHeight * 20 - re.depth * 20 + re.value * 20 + 20 > row.hoverY)) {
                binderStruct.hoverCpuFreqStruct = re;
            } else {
                binderStruct.hoverCpuFreqStruct = undefined;
            }
            binderStruct.draw(freqReq.context, re);
        }
        freqReq.context.closePath();
    }
}
export class binderStruct extends BaseStruct {
    static hoverCpuFreqStruct: binderStruct | undefined;
    static selectCpuFreqStruct: binderStruct | undefined;
    static maxHeight: number = 0;
    static hoverCycle: number = -1;
    static isTableHover: boolean = false;
    cpu: number | undefined;
    value: number = 0;
    cycle: number = -1;
    startNS: number | undefined;
    dur: number | undefined; //自补充，数据库没有返回
    name: string | undefined;
    depth: number = 0;
    static draw(freqContext: CanvasRenderingContext2D, data: binderStruct) {
        if (data.frame) {
            let index = data.cpu || 0;
            let color = '';
            if (data.name === 'binder transaction') {
                color = '#e86b6a';
            }
            if (data.name === 'binder transaction async') {
                color = '#7da6f4';
            }
            if (data.name === 'binder reply') {
                color = '#0cbdd4';
            }
            if (data.name === 'binder async rcv') {
                color = '#8770d3';
            }
            freqContext.fillStyle = color
            if (data === binderStruct.hoverCpuFreqStruct || data === binderStruct.selectCpuFreqStruct || (data.cycle === binderStruct.hoverCycle && binderStruct.isTableHover)) {
                freqContext.globalAlpha = 1;
                freqContext.lineWidth = 1;
                freqContext.fillRect(data.frame.x, binderStruct.maxHeight * 20 - data.depth * 20 + 20, data.frame.width, data.value * 20);
            } else {
                freqContext.globalAlpha = 0.6;
                freqContext.lineWidth = 1;
                freqContext.fillRect(data.frame.x, binderStruct.maxHeight * 20 - data.depth * 20 + 20, data.frame.width, data.value * 20);
            }
            if (data.frame.width > 8) {
                freqContext.lineWidth = 1;
                freqContext.fillStyle = ColorUtils.funcTextColor(
                    ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', 0, ColorUtils.FUNC_COLOR.length)]
                );
                freqContext.textBaseline = 'middle';
                drawString(freqContext, `${data.name || ''}`, 6, new Rect(data.frame.x, binderStruct.maxHeight * 20 - data.depth * 20 + 20, data.frame.width, data.value * 20), data);
            }
            freqContext.globalAlpha = 1.0;
            freqContext.lineWidth = 1;
        }
    }
}