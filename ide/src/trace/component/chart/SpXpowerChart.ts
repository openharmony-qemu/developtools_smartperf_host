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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { info } from '../../../log/Log';
import { XpowerRender, XpowerStruct } from '../../database/ui-worker/ProcedureWorkerXpower';
import { ColorUtils } from '../trace/base/ColorUtils';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { xpowerDataSender } from '../../database/data-trafic/XpowerDataSender';
import { queryXpowerData, queryXpowerMeasureData } from '../../database/sql/Xpower.sql';
import { BaseStruct } from '../../bean/BaseStruct';

export class SpXpowerChart {
    private readonly trace: SpSystemTrace;
    private rowFolder!: TraceRow<BaseStruct>;
    private systemFolder!: TraceRow<BaseStruct>;

    constructor(trace: SpSystemTrace) {
        this.trace = trace;
    }

    async init(traceId?: string): Promise<void> {
        let XpowerMeasureData = await queryXpowerMeasureData(traceId);
        if (XpowerMeasureData.length <= 0) {
            return;
        }
        let xpowerList = await queryXpowerData(traceId);
        if (xpowerList.length <= 0) {
            return;
        }
        await this.initXpowerFolder(traceId);
        await this.initSystemFolder(traceId);
        await this.initSystemData(this.systemFolder, xpowerList, traceId);
    }

    initXpowerFolder = async (traceId?: string): Promise<void> => {
        let xpowerFolder = TraceRow.skeleton(traceId);
        xpowerFolder.rowId = 'Xpowers';
        xpowerFolder.index = 0;
        xpowerFolder.rowType = TraceRow.ROW_TYPE_XPOWER;
        xpowerFolder.rowParentId = '';
        xpowerFolder.style.height = '40px';
        xpowerFolder.folder = true;
        xpowerFolder.name = 'Xpower';
        xpowerFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        xpowerFolder.selectChangeHandler = this.trace.selectChangeHandler;
        xpowerFolder.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
        xpowerFolder.onThreadHandler = (useCache): void => {
            xpowerFolder.canvasSave(this.trace.canvasPanelCtx!);
            if (xpowerFolder.expansion) {
                this.trace.canvasPanelCtx?.clearRect(0, 0, xpowerFolder.frame.width, xpowerFolder.frame.height);
            } else {
                (renders.empty as EmptyRender).renderMainThread(
                    {
                        context: this.trace.canvasPanelCtx,
                        useCache: useCache,
                        type: '',
                    },
                    xpowerFolder
                );
            }
            xpowerFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
        };
        this.rowFolder = xpowerFolder;
        this.trace.rowsEL?.appendChild(xpowerFolder);
    }

    initSystemFolder = async (traceId?: string): Promise<void> => {
        let systemFolder = TraceRow.skeleton(traceId);
        systemFolder.rowId = 'system';
        systemFolder.rowParentId = 'Xpowers';
        systemFolder.rowHidden = !this.rowFolder.expansion;
        systemFolder.rowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP;
        systemFolder.folder = true;
        systemFolder.name = 'System';
        systemFolder.folderPaddingLeft = 20;
        systemFolder.style.height = '40px';
        systemFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        systemFolder.selectChangeHandler = this.trace.selectChangeHandler;
        systemFolder.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
        systemFolder.onThreadHandler = (useCache): void => {
            systemFolder.canvasSave(this.trace.canvasPanelCtx!);
            if (systemFolder.expansion) {
                this.trace.canvasPanelCtx?.clearRect(0, 0, systemFolder.frame.width, systemFolder.frame.height);
            } else {
                (renders.empty as EmptyRender).renderMainThread(
                    {
                        context: this.trace.canvasPanelCtx,
                        useCache: useCache,
                        type: '',
                    },
                    systemFolder
                );
            }
            systemFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
        };
        this.systemFolder = systemFolder;
        this.rowFolder?.addChildTraceRow(systemFolder);
    }

    private xpowerSupplierFrame(
        traceRow: TraceRow<XpowerStruct>,
        it: {
            name: string;
            num: number;
            maxValue?: number;
        },
    ): void {
        traceRow.supplierFrame = (): Promise<XpowerStruct[]> => {
            let promiseData = null;
            // @ts-ignore
            promiseData = xpowerDataSender(it.name, traceRow);
            if (promiseData === null) {
                // @ts-ignore
                return new Promise<Array<unknown>>((resolve) => resolve([]));
            } else {
                // @ts-ignore
                return promiseData.then((resultXpower: Array<unknown>) => {
                    for (let j = 0; j < resultXpower.length; j++) {
                        // @ts-ignore
                        if ((resultXpower[j].value || 0) > it.maxValue!) {
                            // @ts-ignore
                            it.maxValue = resultXpower[j].value || 0;
                        }
                        if (j > 0) {
                            // @ts-ignore
                            resultXpower[j].delta = (resultXpower[j].value || 0) - (resultXpower[j - 1].value || 0);
                        } else {
                            // @ts-ignore
                            resultXpower[j].delta = 0;
                        }
                    }
                    return resultXpower;
                });
            }
        };
    }

    private xpowerThreadHandler(
        traceRow: TraceRow<XpowerStruct>,
        it: {
            name: string;
            num: number;
            maxValue?: number;
        },
        xpowerId: number
    ): void {
        traceRow.onThreadHandler = (useCache): void => {
            let context: CanvasRenderingContext2D;
            if (traceRow.currentContext) {
                context = traceRow.currentContext;
            } else {
                context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
            }
            traceRow.canvasSave(context);
            (renders.xpower as XpowerRender).renderMainThread(
                {
                    context: context,
                    useCache: useCache,
                    type: it.name,
                    maxValue: it.maxValue === 0 ? 1 : it.maxValue!,
                    index: xpowerId,
                    maxName: it.maxValue!.toString()
                },
                traceRow
            );
            traceRow.canvasRestore(context, this.trace);
        };
    }

    async initSystemData(folder: TraceRow<BaseStruct>, xpowerList: Array<{
        name: string;
        num: number;
        maxValue?: number;
    }>, traceId?: string): Promise<void> {
        info('xpowerList data size is: ', xpowerList!.length);
        XpowerStruct.maxValue = xpowerList.map((item) => item.num).reduce((a, b) => Math.max(a, b));
        for (let i = 0; i < xpowerList.length; i++) {
            const it = xpowerList[i];
            it.maxValue = 0;
            let traceRow = TraceRow.skeleton<XpowerStruct>(traceId);
            traceRow.rowId = it.name;
            traceRow.rowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM;
            traceRow.rowParentId = folder.rowId;
            traceRow.style.height = '40px';
            traceRow.name = it.name;
            traceRow.rowHidden = !folder.expansion;
            traceRow.folderTextLeft = 40;
            traceRow.xpowerRowTitle = convertTitle(it.name);
            traceRow.setAttribute('children', '');
            traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
            traceRow.selectChangeHandler = this.trace.selectChangeHandler;
            this.xpowerSupplierFrame(traceRow, it);
            traceRow.getCacheData = (args: unknown): Promise<XpowerStruct[]> | undefined => {
                let result: Promise<XpowerStruct[]> | undefined;
                result = xpowerDataSender(it.name, traceRow, args);
                return result;
            };
            traceRow.focusHandler = (ev): void => {
                this.trace?.displayTip(
                    traceRow,
                    XpowerStruct.hoverXpowerStruct,
                    `<span>${it.name === 'ThermalReport.ShellTemp' ? XpowerStruct.hoverXpowerStruct?.value! :
                        ColorUtils.formatNumberComma(XpowerStruct.hoverXpowerStruct?.value!)}</span>`
                );
            };
            traceRow.findHoverStruct = (): void => {
                XpowerStruct.hoverXpowerStruct = traceRow.getHoverStruct();
            };
            this.xpowerThreadHandler(traceRow, it, i);
            folder.addChildTraceRow(traceRow);
        }
    }
}

// 鼠标悬浮时转换xpower泳道名
export function convertTitle(title: string): string {
    switch (title) {
        case 'Battery.Capacity':
            return '电池容量(单位mAh)';
        case 'Battery.Charge':
            return '充电状态(充电1,非充电0)';
        case 'Battery.GasGauge':
            return '电池剩余电量(单位mAh)';
        case 'Battery.Level':
            return '电池百分比';
        case 'Battery.RealCurrent':
            return '实时电流(单位mAh,充电时为正数,耗电时为负数)';
        case 'Battery.Screen':
            return '屏幕状态(亮屏1,灭屏0)';
        case 'ThermalReport.ShellTemp':
            return '外壳温度(单位℃)';
        case 'ThermalReport.ThermalLevel':
            return '温度等级';
        default:
            return title;
    }
}
