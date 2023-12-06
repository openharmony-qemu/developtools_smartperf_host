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
 * limitations under the License.翻译
 */

import { SpSystemTrace } from '../SpSystemTrace.js';
import { TraceRow } from '../trace/base/TraceRow.js';
import { renders } from '../../database/ui-worker/ProcedureWorker.js';
import { CpuFreqStruct } from '../../database/ui-worker/ProcedureWorkerFreq.js';
import { ColorUtils } from '../trace/base/ColorUtils.js';
import {
    queryPresentInfo,
    queryVsNameList,
    queryFanceNameList,
    queryFpsNameList
} from '../../database/SqlLite.js';
import { LtpoRender, LtpoStruct } from '../../database/ui-worker/ProcedureWorkerLTPO.js'

export class SpLtpoChart {
    private readonly trace: SpSystemTrace | undefined;
    static APP_STARTUP_PID_ARR: Array<number> = [];
    static jsonRow: TraceRow<CpuFreqStruct> | undefined;
    static trace: SpSystemTrace;
    static presentArr: Array<any> = [];
    static vsyncNameList: Array<any> = [];
    static fanceNameList: Array<any> = [];
    static fpsnameList: Array<any> = [];
    static ltpoDataArr: Array<any> = [];
    static sendDataArr: Array<any> = [];
    constructor(trace: SpSystemTrace) {
        SpLtpoChart.trace = trace;
    }

    async init() {
        SpLtpoChart.ltpoDataArr = [];
        SpLtpoChart.vsyncNameList = await queryVsNameList();
        SpLtpoChart.fanceNameList = await queryFanceNameList();
        SpLtpoChart.fpsnameList = await queryFpsNameList();
        SpLtpoChart.vsyncNameList.map((item) => {
            let cutNameArr = item.name!.split(":");
            item.vsyncId = cutNameArr[cutNameArr.length - 1];
        })
        SpLtpoChart.fanceNameList.map((item) => {
            let cutFanceNameArr = item.name!.split(" ");
            item.fanceId = cutFanceNameArr[cutFanceNameArr.length - 1];
        })
        SpLtpoChart.fpsnameList.map((item) => {
            let cutFpsNameArr = item.name!.split(",")[0].split(":");
            item.fps = cutFpsNameArr[cutFpsNameArr.length - 1]
        })
        let vsyncIndex = 0;
        let fanceIndex = 0;
        if (SpLtpoChart.vsyncNameList && SpLtpoChart.vsyncNameList.length && SpLtpoChart.fanceNameList && SpLtpoChart.fanceNameList.length) {
            while (vsyncIndex < SpLtpoChart.vsyncNameList.length) {
                if ((Number(SpLtpoChart.vsyncNameList[vsyncIndex].ts!) + Number(SpLtpoChart.vsyncNameList[vsyncIndex].dur!)) > SpLtpoChart.fanceNameList[fanceIndex].ts!) {
                    this.pushLtpoData(SpLtpoChart.ltpoDataArr,
                        Number(SpLtpoChart.fanceNameList[fanceIndex].fanceId),
                        Number(SpLtpoChart.vsyncNameList[vsyncIndex].vsyncId),
                        0, 0, 0, 0, 0
                    )
                    vsyncIndex++;
                    if (fanceIndex < SpLtpoChart.fanceNameList.length - 1) fanceIndex++;
                } else {
                    this.pushLtpoData(SpLtpoChart.ltpoDataArr,
                        -1,
                        Number(SpLtpoChart.vsyncNameList[vsyncIndex].vsyncId),
                        0, 0, 0, 0, 0
                    )
                    vsyncIndex++;
                }
            }
        }
        if (SpLtpoChart.fpsnameList && SpLtpoChart.fpsnameList.length && SpLtpoChart.ltpoDataArr && SpLtpoChart.ltpoDataArr.length) {
            for (let i = 0; i < SpLtpoChart.ltpoDataArr.length; i++) {
                if (i === 0) {
                    SpLtpoChart.ltpoDataArr[i].fps = 60
                } else {
                    SpLtpoChart.ltpoDataArr[i].fps = SpLtpoChart.fpsnameList[i - 1]?SpLtpoChart.fpsnameList[i - 1].fps:60;
                }
            }
        }

        if (SpLtpoChart.vsyncNameList && SpLtpoChart.vsyncNameList.length) await this.initFolder();
    }
    pushLtpoData(
        lptoArr: any[] | undefined,
        fanceId: Number,
        vsyncId: Number,
        fps: Number,
        startTs: Number,
        dur: Number,
        nextStartTs: Number,
        nextDur: number
    ):void {
        lptoArr?.push(
            {
                lptoArr: lptoArr,
                fanceId: fanceId,
                vsyncId: vsyncId,
                fps: fps,
                startTs: startTs,
                dur: dur,
                nextStartTs: nextStartTs,
                nextDur: nextDur
            }
        )
    }

    async initFolder() {
        SpLtpoChart.presentArr = [];
        let row: TraceRow<LtpoStruct> = TraceRow.skeleton<LtpoStruct>();
        row.setAttribute('hasStartup', 'true');
        row.rowId = ``;
        row.index = 0;
        row.rowType = TraceRow.ROW_TYPE_LTPO;
        row.rowParentId = '';
        row.folder = false;
        row.style.height = '40px';
        row.name = `LTPO`;
        row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
        row.supplier = async (): Promise<Array<LtpoStruct>> => {
            SpLtpoChart.presentArr = await queryPresentInfo();
            SpLtpoChart.presentArr.map((item) => {
                let cutPresentArr = item.name.split(" ")
                item.presentFance = cutPresentArr[cutPresentArr.length - 1]
            })
            let ltpoIndex = 0;
            let presentIndex = 0;
            SpLtpoChart.sendDataArr = [];
            if (SpLtpoChart.presentArr && SpLtpoChart.presentArr.length) {
                while (ltpoIndex < SpLtpoChart.ltpoDataArr.length) {
                    if (SpLtpoChart.ltpoDataArr[ltpoIndex].fanceId === Number(SpLtpoChart.presentArr[presentIndex].presentFance)) {
                        SpLtpoChart.ltpoDataArr[ltpoIndex].startTs = SpLtpoChart.presentArr[presentIndex].ts - (window as any).recordStartNS;
                        SpLtpoChart.ltpoDataArr[ltpoIndex].dur = SpLtpoChart.presentArr[presentIndex].dur;
                        SpLtpoChart.ltpoDataArr[ltpoIndex].nextStartTs = SpLtpoChart.presentArr[presentIndex + 1] ? SpLtpoChart.presentArr[presentIndex + 1].ts - (window as any).recordStartNS : '';
                        SpLtpoChart.ltpoDataArr[ltpoIndex].nextDur = SpLtpoChart.presentArr[presentIndex + 1] ? SpLtpoChart.presentArr[presentIndex + 1].dur : 0;
                        ltpoIndex++;
                        if (presentIndex < SpLtpoChart.presentArr.length - 1) presentIndex++;
                    } else {
                        ltpoIndex++;
                    }
                }
            }

            for (let i = 0; i < SpLtpoChart.ltpoDataArr.length; i++) {
                if (SpLtpoChart.ltpoDataArr[i].fanceId != -1 && SpLtpoChart.ltpoDataArr[i].nextDur) {
                    let sendStartTs: number | undefined = 0;
                    let sendDur: number | undefined = 0;
                    let sendLossFrames: number | undefined = 0;
                    sendStartTs = Number(SpLtpoChart.ltpoDataArr[i].startTs) + Number(SpLtpoChart.ltpoDataArr[i].dur);
                    sendDur = Number(SpLtpoChart.ltpoDataArr[i].nextStartTs) + Number(SpLtpoChart.ltpoDataArr[i].nextDur) - sendStartTs;
                    let tmpDur = Math.ceil(sendDur / 1000000)
                    sendLossFrames = (tmpDur * SpLtpoChart.ltpoDataArr[i].fps / 1000 - 1) < 1 ? 0 : Math.floor(tmpDur * SpLtpoChart.ltpoDataArr[i].fps / 1000 - 1)
                    if (tmpDur < 170) {
                        SpLtpoChart.sendDataArr.push(
                            {
                                dur: sendDur,
                                value: sendLossFrames,
                                startTs: sendStartTs,
                                pid: SpLtpoChart.ltpoDataArr[i].vsyncId,
                                process: undefined,
                                itid: SpLtpoChart.ltpoDataArr[i].vsyncId,
                                endItid: undefined,
                                tid: undefined,
                                startName: undefined,
                                stepName: undefined,
                            }
                        )
                    }
                }
            }
            return SpLtpoChart.sendDataArr
        }
        row.focusHandler = (ev) => {
            SpLtpoChart.trace?.displayTip(
                row!,
                LtpoStruct.hoverLtpoStruct,
                `<span>${ColorUtils.formatNumberComma(Number(LtpoStruct.hoverLtpoStruct?.value!))}</span>`
            )
        };
        row.onThreadHandler = (useCache): void => {
            let context: CanvasRenderingContext2D;
            if (row.currentContext) {
                context = row.currentContext;
            } else {
                context = row.collect ? SpLtpoChart.trace.canvasFavoritePanelCtx! : SpLtpoChart.trace.canvasPanelCtx!;
            }
            row.canvasSave(context);
            (renders['ltpo-present'] as LtpoRender).renderMainThread(
                {
                    appStartupContext: context,
                    useCache: useCache,
                    type: `ltpo-present ${row.rowId}`,
                },
                row
            );
            row.canvasRestore(context);
        };
        SpLtpoChart.trace.rowsEL?.appendChild(row);
    }
}
