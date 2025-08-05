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
export class AllStatesRender extends Render {
    renderMainThread(
        threadReq: {
            context: CanvasRenderingContext2D;
            useCache: boolean;
            type: string;
            translateY: number;
        },
        row: TraceRow<AllstatesStruct>
    ): void {
        let threadList = row.dataList;
        let threadFilter = row.dataListCache;
        dataFilterHandler(threadList, threadFilter, {
            startKey: 'startTime',
            durKey: 'chartDur',
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
            AllstatesStruct.drawThread(threadReq.context, re);
            if (row.isHover && re.frame && isFrameContainPoint(re.frame!, row.hoverX, row.hoverY)) {
                SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
                AllstatesStruct.hoverThreadStruct = re;
                find = true;
            }
        }
        if (row.rowId === 'statesrow' &&
            (!row.isHover || !find) &&
            CpuFreqExtendStruct.hoverStruct === undefined &&
            CpuFreqExtendStruct.selectCpuFreqStruct === undefined &&
            !BinderStruct.selectCpuFreqStruct &&
            !BinderStruct.hoverCpuFreqStruct &&
            !TabPaneFreqStatesDataCut.isStateTabHover &&
            (SpSegmentationChart.tabHoverObj && SpSegmentationChart.tabHoverObj.key === '')) {
            AllstatesStruct.hoverThreadStruct = undefined;
            SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
            SpSegmentationChart.trace.tipEL!.style.display = 'none';
            find = false;
        }
        threadReq.context.closePath();
    }
    render(threadReq: RequestMessage, threadList: Array<unknown>, threadFilter: Array<unknown>): void { }
}

export class AllstatesStruct extends BaseThreadStruct {
    static hoverThreadStruct: AllstatesStruct | undefined;
    static selectThreadStruct: AllstatesStruct | undefined;
    static selectThreadStructList: Array<AllstatesStruct> = new Array<AllstatesStruct>();
    static firstselectThreadStruct: AllstatesStruct | undefined;
    argSetID: number | undefined;
    translateY: number | undefined;
    textMetricsWidth: number | undefined;
    static startCycleTime: number = 0;
    static endTime: number = 0;

    static drawThread(threadContext: CanvasRenderingContext2D, data: AllstatesStruct): void {
        if (data.frame) {
            threadContext.globalAlpha = 1;
            let stateText = AllstatesStruct.getEndState(data.state || '');
            threadContext.fillStyle = Utils.getStateColor(data.state === 'S' ? 'Sleeping' : data.state || '');
            threadContext.fillRect(data.frame.x, data.frame.y, data.frame.width, data.frame.height);
            threadContext.fillStyle = '#fff';
            threadContext.textBaseline = 'middle';
            threadContext.font = '8px sans-serif';
            data.frame.width > 7 && drawString(threadContext, stateText, 2, data.frame, data);
            if (
                AllstatesStruct.selectThreadStruct &&
                AllstatesStruct.equals(AllstatesStruct.selectThreadStruct, data) &&
                (AllstatesStruct.selectThreadStruct.state !== 'S' || data.name === 'all-state')
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
            if (AllstatesStruct.hoverThreadStruct === data && data.name === 'all-state') {
                let pointX: number = ns2x(
                    data.startTime || 0,
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
                    data.startTime || 0,
                    '#000000',
                    '',
                    true,
                    ''
                );
            }
        }
    }
}
