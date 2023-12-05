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

import { SpSystemTrace } from '../SpSystemTrace.js';
import { ColorUtils } from '../trace/base/ColorUtils.js';
import { TraceRow } from '../trace/base/TraceRow.js';
import { info } from '../../../log/Log.js';
import { renders } from '../../database/ui-worker/ProcedureWorker.js';
import { EmptyRender } from '../../database/ui-worker/ProcedureWorkerCPU.js';
import { FreqExtendRender, CpuFreqExtendStruct } from '../../database/ui-worker/ProcedureWorkerFreqExtend.js';
import { BinderRender, binderStruct } from '../../database/ui-worker/procedureWorkerBinder.js';
import { queryIrqList } from '../../database/SqlLite.js';

export class SegMenTaTion {
    static trace: SpSystemTrace;
    static jsonRow: TraceRow<CpuFreqExtendStruct> | undefined;
    static GpuRow: TraceRow<CpuFreqExtendStruct> | undefined;
    static binderRow: TraceRow<binderStruct> | undefined;
    static schedRow: TraceRow<CpuFreqExtendStruct> | undefined;
    static freqInfoMapData: any = new Map();
    private rowFolder!: TraceRow<any>;
    static chartData: Array<Object> = [];;
    // 数据切割联动
    static setChartData(type: string, data: any) {
        this.tabHover(type, false)
        let currentMaxValue = 0;
        if (type === 'CPU-FREQ') {
            let chartData = data.map((v: any) => {
                if (v.value > currentMaxValue) {
                    currentMaxValue = v.value
                }
                return {
                    cpu: 0,
                    dur: v.dur,
                    value: v.value,
                    startNS: v.startNS,
                    cycle: v.cycle,
                    freq: v.freq
                }
            })
            CpuFreqExtendStruct.maxValue = currentMaxValue;
            SegMenTaTion.jsonRow!.dataList = [];
            SegMenTaTion.jsonRow!.dataListCache = [];
            SegMenTaTion.jsonRow!.isComplete = false;
            SegMenTaTion.jsonRow!.supplier = (): Promise<Array<any>> =>
                new Promise<Array<any>>((resolve) => resolve(chartData));
        }
        else if (type === 'GPU-FREQ') {
            let chartData = data.map((v: any) => {
                let _count = Number(v.count)
                if (_count > currentMaxValue) {
                    currentMaxValue = _count
                }
                return {
                    cpu: 7,
                    dur: Number(v.dur * 1000000),
                    value: _count,
                    startNS: v.startNS,
                    cycle: v.cycle,
                    type
                }
            })
            CpuFreqExtendStruct.maxValue = currentMaxValue;
            SegMenTaTion.GpuRow!.dataList = [];
            SegMenTaTion.GpuRow!.dataListCache = [];
            SegMenTaTion.GpuRow!.isComplete = false;
            SegMenTaTion.GpuRow!.supplier = (): Promise<Array<any>> =>
                new Promise<Array<any>>((resolve) => resolve(chartData));
            SegMenTaTion.trace.refreshCanvas(true)
        } else if (type === 'SCHED-SWITCH') {
            let chartData = data.map((v: any) => {
                if (v.count > currentMaxValue) {
                    currentMaxValue = v.count
                }
                return {
                    cpu: 5,
                    dur: Number(v.duration) * 1000 * 1000,
                    value: v.count,
                    startNS: Number(v.cycleStartTime) * 1000 * 1000,
                    cycle: v.cycle,
                    type
                }
            })
            CpuFreqExtendStruct.maxValue = currentMaxValue;
            SegMenTaTion.schedRow!.dataList = [];
            SegMenTaTion.schedRow!.dataListCache = [];
            SegMenTaTion.schedRow!.isComplete = false;
            SegMenTaTion.schedRow!.supplier = (): Promise<Array<any>> =>
                new Promise<Array<any>>((resolve) => resolve(chartData));
        } else if (type === 'BINDER') {
            let binderList: any = [];
            let chartData: any;
            data.map((v: any) => {
                let listCount = 0
                v.map((t: any) => {
                    listCount += t.count
                    if (t.name === 'binder transaction') {
                        t.depth = t.count
                    }
                    if (t.name === 'binder transaction async') {
                        t.depth = t.count + ((v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        })[0].count) : 0);
                    }
                    if (t.name === 'binder reply') {
                        t.depth = t.count + ((v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        })[0].count) : 0) + ((v.filter((i: any) => {
                            return i.name === 'binder transaction async'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder transaction async'
                        })[0].count) : 0);
                    }
                    if (t.name === 'binder async rcv') {
                        t.depth = t.count + ((v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder transaction'
                        })[0].count) : 0) + ((v.filter((i: any) => {
                            return i.name === 'binder transaction async'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder transaction async'
                        })[0].count) : 0) + ((v.filter((i: any) => {
                            return i.name === 'binder reply'
                        }).length > 0) ? (v.filter((i: any) => {
                            return i.name === 'binder reply'
                        })[0].count) : 0)
                    }
                    binderList.push(t);
                });
                binderStruct.maxHeight = binderStruct.maxHeight > listCount ? binderStruct.maxHeight : JSON.parse(JSON.stringify(listCount));
                listCount = 0
            })
            chartData = binderList.map((v: any) => {
                return {
                    cpu: v.name === 'binder transaction' ?
                        0 : v.name === 'binder transaction async' ?
                            1 : v.name === 'binder reply' ?
                                2 : 3,
                    startNS: v.startNS,
                    dur: v.dur,
                    name: `${v.name}`,
                    value: v.count,
                    depth: v.depth,
                    cycle: v.idx,
                }
            })
            SegMenTaTion.binderRow!.dataList = [];
            SegMenTaTion.binderRow!.dataListCache = [];
            SegMenTaTion.binderRow!.isComplete = false;
            SegMenTaTion.binderRow!.style.height = `${binderStruct.maxHeight > 2 ? binderStruct.maxHeight * 20 + 20 : 40}px`;
            SegMenTaTion.binderRow!.supplier = (): Promise<Array<any>> =>
                new Promise<Array<any>>((resolve) => resolve([]));
        }
        SegMenTaTion.trace.refreshCanvas(true)
    }

    // 悬浮联动
    static tabHover(type: String, tableIsHover: any = false, cycle: number = -1) {
        CpuFreqExtendStruct.isTabHover = tableIsHover;
        if (type === 'CPU-FREQ' || type === 'GPU-FREQ' || type === 'SCHED-SWITCH') {
            if (tableIsHover) {
                SegMenTaTion.GpuRow!.isHover = false;
                CpuFreqExtendStruct.cycle = cycle
            } else {
                CpuFreqExtendStruct.cycle = -1
                CpuFreqExtendStruct.hoverCpuFreqStruct = undefined
            }
        } else if (type === 'BINDER') {
            if (tableIsHover) {
                binderStruct.hoverCycle = cycle
            } else {
                binderStruct.hoverCycle = -1;
            }
        }
        SegMenTaTion.trace.refreshCanvas(true, 'flagChange')
    }

    constructor(trace: SpSystemTrace) {
        SegMenTaTion.trace = trace;
    }

    async init() {
        let irqList = await queryIrqList();
        if (irqList.length == 0) {
            return;
        }
        else {
            await this.initFolder();
            await this.initCpuFreq();
            await this.initGpuTrace();
        }
    }

    async initFolder() {
        let row = TraceRow.skeleton();
        row.setAttribute('disabled-check', '');
        row.rowId = `unkown`;
        row.index = 0;
        row.rowType = TraceRow.ROW_TYPE_SEGMENTATION;
        row.rowParentId = '';
        row.folder = true;
        row.style.height = '40px';
        row.name = `Segmentation`;
        row.supplier = () => new Promise<Array<any>>((resolve) => resolve([]));
        row.onThreadHandler = (useCache) => {
            row.canvasSave(SegMenTaTion.trace.canvasPanelCtx!);
            if (row.expansion) {
                SegMenTaTion.trace.canvasPanelCtx!.clearRect(0, 0, row.frame.width, row.frame.height);
            } else {
                (renders['empty'] as EmptyRender).renderMainThread(
                    {
                        context: SegMenTaTion.trace.canvasPanelCtx,
                        useCache: useCache,
                        type: ``,
                    },
                    row
                );
            }
            row.canvasRestore(SegMenTaTion.trace.canvasPanelCtx!);
        };
        this.rowFolder = row;
        SegMenTaTion.trace.rowsEL!.appendChild(row);

    }

    async initCpuFreq() {
        // json文件泳道
        SegMenTaTion.jsonRow = TraceRow.skeleton<CpuFreqExtendStruct>();
        SegMenTaTion.jsonRow.rowId = `json0`;
        SegMenTaTion.jsonRow.rowType = TraceRow.ROW_TYPE_CPU_COMPUTILITY;
        SegMenTaTion.jsonRow.rowParentId = '';
        SegMenTaTion.jsonRow.style.height = '40px';
        SegMenTaTion.jsonRow.name = `Cpu Computility`;
        SegMenTaTion.jsonRow.favoriteChangeHandler = SegMenTaTion.trace.favoriteChangeHandler;
        SegMenTaTion.jsonRow.addRowCheckFilePop();
        SegMenTaTion.jsonRow.rowSetting = 'checkFile';
        // 拿到了用户传递的数据
        SegMenTaTion.jsonRow.onRowCheckFileChangeHandler = (e: any) => {
            let chartData = JSON.parse(e);
            let mapData = new Map();
            chartData.map((v: any) => {
                for (let key in v.freqInfo) {
                    mapData.set(Number(key), v.freqInfo[key])
                }
                SegMenTaTion.freqInfoMapData.set(v.cpuId, mapData)
                mapData = new Map()
            })
        }
        SegMenTaTion.jsonRow.focusHandler = (ev) => {
            SegMenTaTion.trace!.displayTip(
                SegMenTaTion.jsonRow!,
                CpuFreqExtendStruct.hoverCpuFreqStruct,
                `<span>${ColorUtils.formatNumberComma(CpuFreqExtendStruct.hoverCpuFreqStruct === undefined ? 0 : CpuFreqExtendStruct.hoverCpuFreqStruct.value! || 0)}</span>`
            );
        };
        SegMenTaTion.jsonRow.findHoverStruct = () => {
            CpuFreqExtendStruct.hoverCpuFreqStruct = SegMenTaTion.jsonRow!.getHoverStruct();
        };
        SegMenTaTion.jsonRow.onThreadHandler = (useCache) => {
            let context: CanvasRenderingContext2D;
            if (SegMenTaTion.jsonRow!.currentContext) {
                context = SegMenTaTion.jsonRow!.currentContext;
            } else {
                context = SegMenTaTion.jsonRow!.collect ? SegMenTaTion.trace.canvasFavoritePanelCtx! : SegMenTaTion.trace.canvasPanelCtx!;
            }
            SegMenTaTion.jsonRow!.canvasSave(context);
            (renders['freq-extend'] as FreqExtendRender).renderMainThread(
                {
                    context: context,
                    useCache: useCache,
                    type: `json0`,
                },
                SegMenTaTion.jsonRow!
            );
            SegMenTaTion.jsonRow!.canvasRestore(context);
        };
        SegMenTaTion.trace.rowsEL!.appendChild(SegMenTaTion.jsonRow);
        this.rowFolder!.addChildTraceRow(SegMenTaTion.jsonRow);
    }

    async initGpuTrace() {
        SegMenTaTion.GpuRow = TraceRow.skeleton<CpuFreqExtendStruct>();
        SegMenTaTion.GpuRow.rowId = `gpurow`;
        SegMenTaTion.GpuRow.rowType = TraceRow.ROW_TYPE_GPU_COMPUTILITY;
        SegMenTaTion.GpuRow.rowParentId = '';
        SegMenTaTion.GpuRow.style.height = '40px';
        SegMenTaTion.GpuRow.name = `Gpu Computility`;
        SegMenTaTion.GpuRow.favoriteChangeHandler = SegMenTaTion.trace.favoriteChangeHandler;
        SegMenTaTion.GpuRow.selectChangeHandler = SegMenTaTion.trace.selectChangeHandler;
        SegMenTaTion.GpuRow.supplier = (): Promise<Array<any>> =>
            new Promise<Array<any>>((resolve) => resolve([]));
        SegMenTaTion.GpuRow.focusHandler = (ev) => {
            SegMenTaTion.trace!.displayTip(
                SegMenTaTion.GpuRow!,
                CpuFreqExtendStruct.hoverCpuFreqStruct,
                `<span>${ColorUtils.formatNumberComma(CpuFreqExtendStruct.hoverCpuFreqStruct === undefined ? 0 : CpuFreqExtendStruct.hoverCpuFreqStruct.value!)} Hz·ms</span>`
            );
        };
        SegMenTaTion.GpuRow.findHoverStruct = () => {
            CpuFreqExtendStruct.hoverCpuFreqStruct = SegMenTaTion.GpuRow!.getHoverStruct();
        };
        SegMenTaTion.GpuRow.onThreadHandler = (useCache) => {
            let context: CanvasRenderingContext2D;
            if (SegMenTaTion.GpuRow!.currentContext) {
                context = SegMenTaTion.GpuRow!.currentContext;
            } else {
                context = SegMenTaTion.GpuRow!.collect ? SegMenTaTion.trace.canvasFavoritePanelCtx! : SegMenTaTion.trace.canvasPanelCtx!;
            }
            SegMenTaTion.GpuRow!.canvasSave(context);
            (renders['freq-extend'] as FreqExtendRender).renderMainThread(
                {
                    context: context,
                    useCache: useCache,
                    type: `json0`,
                },
                SegMenTaTion.GpuRow!
            );
            SegMenTaTion.GpuRow!.canvasRestore(context);
        };
        SegMenTaTion.trace.rowsEL.appendChild(SegMenTaTion.GpuRow);
        this.rowFolder!.addChildTraceRow(SegMenTaTion.GpuRow);
    }
}
