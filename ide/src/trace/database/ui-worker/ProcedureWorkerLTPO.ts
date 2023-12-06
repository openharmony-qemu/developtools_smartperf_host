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

import { BaseStruct, dataFilterHandler, drawString } from './ProcedureWorkerCommon.js';
import { TraceRow } from '../../component/trace/base/TraceRow.js';

export class LtpoRender {
    renderMainThread(
        req: {
            appStartupContext: CanvasRenderingContext2D;
            useCache: boolean;
            type: string;
        },
        ltpoRow: TraceRow<LtpoStruct>
    ): void {
        let list = ltpoRow.dataList;
        LtpoStruct.maxVal = 0;
        for (let i = 0; i < list.length; i++) {
            if (Number(list[i].value) > LtpoStruct.maxVal) LtpoStruct.maxVal = Number(list[i].value);
        }
        let filter = ltpoRow.dataListCache;
        dataFilterHandler(list, filter, {
            startKey: 'startTs',
            durKey: 'dur',
            startNS: TraceRow.range?.startNS ?? 0,
            endNS: TraceRow.range?.endNS ?? 0,
            totalNS: TraceRow.range?.totalNS ?? 0,
            frame: ltpoRow.frame,
            paddingTop: 5,
            useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
        });
        req.appStartupContext.globalAlpha = 0.6;
        let find = false;
        let offset = 3;
        for (let re of filter) {
            if (re.frame) {
                re.frame.height = Number(re.value) === 0 ? 1 : Number(re.value) * 30 / LtpoStruct.maxVal;
                re.frame.y = 35 - re.frame.height;
            }
            if (ltpoRow.isHover) {
                if (
                    re.frame &&
                    ltpoRow.hoverX >= re.frame.x - offset &&
                    ltpoRow.hoverX <= re.frame.x + re.frame.width + offset
                ) {
                    LtpoStruct.hoverLtpoStruct = re;
                    find = true;
                }
            }
            if(!ltpoRow.isHover) LtpoStruct.hoverLtpoStruct = undefined
            if (!find && ltpoRow.isHover) {
                LtpoStruct.hoverLtpoStruct = undefined;
            }
            req.appStartupContext.beginPath()
            LtpoStruct.draw(req.appStartupContext, re);
            req.appStartupContext.closePath()
        }
    }
}


export class LtpoStruct extends BaseStruct {
    static hoverLtpoStruct: LtpoStruct | undefined;
    static selectLtpoStruct: LtpoStruct | undefined;
    static maxVal: number | undefined;
    dur: number | undefined;
    value: string | undefined;
    name: string | undefined;
    presentFance: number | undefined;
    ts: number | undefined;
    vsyncId: number | undefined;
    fanceId: number | undefined;

    static draw(ctx: CanvasRenderingContext2D, data: LtpoStruct): void {
        if (data.frame) {
            ctx.fillStyle = '#9933FA';
            if (data === LtpoStruct.hoverLtpoStruct || data === LtpoStruct.selectLtpoStruct) {
                let drawHeight: number = Math.floor(
                    ((Number(data.value) || 0) * (data.frame.height || 0) * 1.0) / LtpoStruct.maxVal!
                );
                drawHeight = drawHeight < 1 ? 1 : drawHeight
                ctx.globalAlpha = 1.0;
                ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '	#0000FF';
                ctx.strokeRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight)
            } else {
                ctx.globalAlpha = 0.6;
                let drawHeight: number = Math.floor(((Number(data.value) || 0) * (data.frame.height || 0)) / LtpoStruct.maxVal!);
                drawHeight = drawHeight < 1 ? 1 : drawHeight
                ctx.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight, data.frame.width, drawHeight)
            }

        }
    }

}
