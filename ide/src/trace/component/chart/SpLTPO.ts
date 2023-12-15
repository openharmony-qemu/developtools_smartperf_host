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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { CpuFreqStruct } from '../../database/ui-worker/ProcedureWorkerFreq';
import {
    queryPresentInfo,
    queryFanceNameList,
    queryFpsNameList
} from '../../database/SqlLite';
import { LtpoRender, LtpoStruct } from '../../database/ui-worker/ProcedureWorkerLTPO'
import { HitchTimeStruct, hitchTimeRender } from '../../database/ui-worker/ProcedureWorkerHitchTime';

export class SpLtpoChart {
    private readonly trace: SpSystemTrace | undefined;
    static APP_STARTUP_PID_ARR: Array<number> = [];
    static jsonRow: TraceRow<CpuFreqStruct> | undefined;
    static trace: SpSystemTrace;
    static presentArr: Array<LtpoStruct> = [];
    static fanceNameList: Array<LtpoStruct> = [];
    static fpsnameList: Array<LtpoStruct> = [];
    static ltpoDataArr: Array<LtpoStruct> = [];
    static sendLTPODataArr: Array<LtpoStruct> = [];
    static sendHitchDataArr: Array<LtpoStruct> = [];
    constructor(trace: SpSystemTrace) {
        SpLtpoChart.trace = trace;
    }

    async init() {
        SpLtpoChart.ltpoDataArr = [];
        SpLtpoChart.fanceNameList = await queryFanceNameList();
        SpLtpoChart.fpsnameList = await queryFpsNameList();
        SpLtpoChart.fanceNameList.map((item) => {
            let cutFanceNameArr = item.name!.split(" ");
            item.fanceId = Number(cutFanceNameArr[cutFanceNameArr.length - 1]);
        })
        SpLtpoChart.fpsnameList.map((item) => {
            let cutFpsNameArr = item.name!.split(",")[0].split(":");
            item.fps = Number(cutFpsNameArr[cutFpsNameArr.length - 1]);
        })
        if (SpLtpoChart.fanceNameList && SpLtpoChart.fanceNameList.length && SpLtpoChart.fpsnameList && SpLtpoChart.fpsnameList.length) {
            for (let i = 0; i < SpLtpoChart.fanceNameList.length; i++) {
                let tmpFps = SpLtpoChart.fpsnameList[i]!.fps ? Number(SpLtpoChart.fpsnameList[i]!.fps) : 60;
                this.pushLtpoData(
                    SpLtpoChart.ltpoDataArr,
                    Number(SpLtpoChart.fanceNameList[i]!.fanceId!),
                    tmpFps,
                    0, 0, 0, 0
                );
            }
        }
        if (SpLtpoChart.fanceNameList && SpLtpoChart.fanceNameList.length) {
            await this.initFolder();
            await this.initHitchTime();
        }
    }
    pushLtpoData(
        lptoArr: any[] | undefined,
        fanceId: Number,
        fps: Number,
        startTs: Number,
        dur: Number,
        nextStartTs: Number,
        nextDur: number
    ): void {
        lptoArr?.push(
            {
                fanceId: fanceId,
                fps: fps,
                startTs: startTs,
                dur: dur,
                nextStartTs: nextStartTs,
                nextDur: nextDur
            }
        );
    }
    sendDataHandle(_presentArr: LtpoStruct[], _ltpoDataArr: LtpoStruct[]): Array<LtpoStruct> {
        let ltpoIndex = 0;
        let presentIndex = 0;
        let sendDataArr = [];
        if (_presentArr && _presentArr.length) {
            while (ltpoIndex < _ltpoDataArr.length) {
                if (_ltpoDataArr[ltpoIndex].fanceId === Number(_presentArr[presentIndex].presentFance)) {
                    _ltpoDataArr[ltpoIndex].startTs = Number(_presentArr[presentIndex].ts) - (window as any).recordStartNS;
                    _ltpoDataArr[ltpoIndex].dur = _presentArr[presentIndex].dur;
                    _ltpoDataArr[ltpoIndex].nextStartTs = _presentArr[presentIndex + 1] ? Number(_presentArr[presentIndex + 1].ts) - (window as any).recordStartNS : '';
                    _ltpoDataArr[ltpoIndex].nextDur = _presentArr[presentIndex + 1] ? _presentArr[presentIndex + 1].dur : 0;
                    ltpoIndex++;
                    if (presentIndex < _presentArr.length - 1) {
                        presentIndex++;
                    }
                } else {
                    ltpoIndex++;
                }
            }
        }
        for (let i = 0; i < _ltpoDataArr.length; i++) {
            if (_ltpoDataArr[i].fanceId !== -1 && _ltpoDataArr[i].nextDur) {
                let sendStartTs: number | undefined = 0;
                let sendDur: number | undefined = 0;
                sendStartTs = Number(SpLtpoChart.ltpoDataArr[i].startTs) + Number(SpLtpoChart.ltpoDataArr[i].dur);
                sendDur = Number(SpLtpoChart.ltpoDataArr[i].nextStartTs) + Number(SpLtpoChart.ltpoDataArr[i].nextDur) - sendStartTs;
                let tmpDur = (Math.ceil(sendDur / 100000)) / 10;
                if (tmpDur < 170) {
                    sendDataArr.push(
                        {
                            dur: sendDur,
                            value: 0,
                            startTs: sendStartTs,
                            pid: SpLtpoChart.ltpoDataArr[i].fanceId,
                            itid: SpLtpoChart.ltpoDataArr[i].fanceId,
                            name: undefined,
                            presentFance: SpLtpoChart.ltpoDataArr[i].fanceId,
                            ts: undefined,
                            fanceId: SpLtpoChart.ltpoDataArr[i].fanceId,
                            fps: SpLtpoChart.ltpoDataArr[i].fps,
                            nextStartTs: SpLtpoChart.ltpoDataArr[i].nextStartTs,
                            nextDur: SpLtpoChart.ltpoDataArr[i].nextDur,
                            translateY: undefined,
                            frame: undefined,
                            isHover: false
                        }
                    );
                }
            }
        }
        return sendDataArr;
    }

    async initFolder() {
        SpLtpoChart.presentArr = [];
        let row: TraceRow<LtpoStruct> = TraceRow.skeleton<LtpoStruct>();
        row.rowId = `LTPO ${SpLtpoChart.fanceNameList[0].fanceId}`;
        row.rowParentId = '';
        row.rowType = TraceRow.ROW_TYPE_LTPO;
        row.folder = false;
        row.style.height = '40px';
        row.name = `Lost Frames`;
        row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
        row.selectChangeHandler = SpLtpoChart.trace.selectChangeHandler;
        row.supplier = async (): Promise<Array<LtpoStruct>> => {
            SpLtpoChart.presentArr = await queryPresentInfo();
            SpLtpoChart.presentArr.map((item) => {
                let cutPresentArr = item.name!.split(" ");
                item.presentFance = Number(cutPresentArr[cutPresentArr.length - 1]);
            })
            SpLtpoChart.sendLTPODataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
            for (let i = 0; i < SpLtpoChart.sendLTPODataArr.length; i++) {
                let tmpDur = SpLtpoChart.sendLTPODataArr[i].dur! / 1000000;
                SpLtpoChart.sendLTPODataArr[i].value = (Math.round(tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1)) < 1 ? 0 : Math.round(tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1);
            }
            return SpLtpoChart.sendLTPODataArr;
        }
        row.focusHandler = (ev) => {
            SpLtpoChart.trace?.displayTip(
                row!,
                LtpoStruct.hoverLtpoStruct,
                `<span>${(LtpoStruct.hoverLtpoStruct?.value!)}</span>`
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
    async initHitchTime() {
        SpLtpoChart.presentArr = [];
        let row: TraceRow<HitchTimeStruct> = TraceRow.skeleton<HitchTimeStruct>();
        row.rowId = `hitch-time ${SpLtpoChart.fanceNameList[1].fanceId}`;
        row.rowParentId = '';
        row.rowType = TraceRow.ROW_TYPE_HITCH_TIME;
        row.folder = false;
        row.style.height = '40px';
        row.name = `Hitch Time`;
        row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
        row.selectChangeHandler = SpLtpoChart.trace.selectChangeHandler;
        row.supplier = async (): Promise<Array<HitchTimeStruct>> => {
            SpLtpoChart.presentArr = await queryPresentInfo();
            SpLtpoChart.presentArr.map((item) => {
                let cutPresentArr = item.name!.split(" ");
                item.presentFance = Number(cutPresentArr[cutPresentArr.length - 1]);
            })
            SpLtpoChart.sendHitchDataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
            for (let i = 0; i < SpLtpoChart.sendHitchDataArr.length; i++) {
                let tmpVale = Number((Math.ceil(((SpLtpoChart.sendHitchDataArr[i].dur! / 1000000) - (1000 / SpLtpoChart.sendHitchDataArr[i].fps!)) * 10)) / 10);
                SpLtpoChart.sendHitchDataArr[i].value = tmpVale < 0 ? 0 : tmpVale;
            }
            return SpLtpoChart.sendHitchDataArr;
        }
        row.focusHandler = (ev) => {
            SpLtpoChart.trace?.displayTip(
                row!,
                HitchTimeStruct.hoverHitchTimeStruct,
                `<span>${(HitchTimeStruct.hoverHitchTimeStruct?.value!)}</span>`
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
            (renders['hitch'] as hitchTimeRender).renderMainThread(
                {
                    appStartupContext: context,
                    useCache: useCache,
                    type: `hitch ${row.rowId}`,
                },
                row
            );
            row.canvasRestore(context);
        };
        SpLtpoChart.trace.rowsEL?.appendChild(row);
    }
}
