/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitHeadLine } from '../../../../../base-ui/headline/lit-headline';
import '../../../../../base-ui/headline/lit-headline';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { ChartMode } from '../../../../bean/FrameChartStruct';
import { FilterByAnalysis, NativeMemoryExpression } from '../../../../bean/NativeHook';
import { FileMerageBean } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { procedurePool } from '../../../../database/Procedure';
import { queryNativeHookStatisticSubType, queryNativeHookSubType } from '../../../../database/sql/gpuMemory.sql';
import { FrameChart } from '../../../chart/FrameChart';
import { ParseExpression } from '../SheetUtils';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { TabPaneGMCallTreeHtml } from './TabPaneGMCallTree.html';

const InvertOpyionIndex: number = 0;
const HideSystemSoOptionIndex: number = 1;
const HideThreadOptionIndex: number = 3;

@element('tabpane-gm-calltree')
export class TabpaneGMCalltree extends BaseElement {
    private gmCallTreeTbl: LitTable | null | undefined;
    private gpuMemoryTbr: LitTable | null | undefined;
    private gmCallTreeFilter: TabPaneFilter | null | undefined;
    private gmCallTreeProgressEL: LitProgressBar | null | undefined;
    private currentSelection: SelectionParam | undefined;
    private gmCallTreeSource: unknown[] = [];
    private currentSelectIPid = 1;
    private headLine: LitHeadLine | null | undefined;
    private isHideThread: boolean = false;
    private searchValue: string = '';
    private gmCallTreeLoadingPage: unknown;
    private currentGMCallTreeFilter: TabPaneFilter | undefined | null;
    private subTypeResult: Array<{ subTypeId: number; subType: string | null; }> = [];
    private responseTypes: unknown[] = [];
    private filterLifespanType: string = '0';
    private filterGpuType: string = '0';
    private filterResponseType: number = -1;
    private filterResponseSelect: string = '0';
    private gpuType: Array<string> = ['Graphic Memory', 'VulKan', 'OpenGLES', 'OpenCL'];
    private _analysisTabWidth: number = 0;
    private loadingList: number[] = [];
    private sortKey: string = 'heapSizeStr';
    private sortType: number = 0;
    private systmeRuleName: string = '/system/';
    private numRuleName: string = '/max/min/';
    private gmCallTreeFrameChart: FrameChart | null | undefined;
    private _initFromAnalysis = false;
    private _filterData: FilterByAnalysis | undefined;
    private isChartShow: boolean = false;
    private needShowMenu: boolean = true;
    private expressionStruct: NativeMemoryExpression | null = null;
    private lastIsExpression = false;
    private currentSelectedData: unknown = undefined;
    private eventList: string[] | null | undefined;
    private types: Array<string | number> = [];

    set analysisTabWidth(width: number) {
        this._analysisTabWidth = width;
    }

    set titleTxt(value: string) {
        this.headLine!.titleTxt = value;
    }

    set filterData(data: FilterByAnalysis) {
        // click from analysis
        this._filterData = data;
    }

    set titleBoxShow(value: Boolean) {
        this.headLine!.isShow = value;
    }

    set initFromAnalysis(flag: boolean) {
        this._initFromAnalysis = flag;
    }

    set data(gmCallTreeParam: SelectionParam) {
        // this.types = [];
        const isShow = gmCallTreeParam.gpuMemory.length > 0;
        this.gmCallTreeFrameChart!.dispatchEvent(
            new CustomEvent('show-calibration', {
                detail: {
                    isShow: isShow
                },
                bubbles: false
            })
        );
        if (gmCallTreeParam === this.currentSelection && !this._initFromAnalysis) {
            return;
        }
        this.types = [];
        // 火焰图数据
        this.gmCallTreeSource = [];
        // 框选内容赋值
        this.currentSelection = gmCallTreeParam;
        // 拿到框选的pid
        this.currentSelectIPid = gmCallTreeParam.gpuMemoryCurrentIPid;
        this.init(gmCallTreeParam);
    }

    private async init(gmCallTreeParam: SelectionParam): Promise<void> {
        // 初始化样式
        this.initUI();
        this.initTypes(gmCallTreeParam);
        // 初始化选择框内容
        await this.initFilterTypes(this.types);
        const initWidth = this._analysisTabWidth > 0 ? this._analysisTabWidth : this.clientWidth;
        // 获取tab页数据
        this.getDataByWorkerQuery(
            {
                leftNs: gmCallTreeParam.leftNs,
                rightNs: gmCallTreeParam.rightNs,
                types: this.types,
            },
            (results: unknown[]): void => {
                this.setLTableData(results);
                this.gpuMemoryTbr!.recycleDataSource = [];

                this.gmCallTreeFrameChart?.updateCanvas(true, initWidth);
                if (this._initFromAnalysis) {
                    this.filterByAnalysis();
                } else {
                    // @ts-ignore
                    this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
                    this.switchFlameChart();
                    this.gmCallTreeFilter!.icon = 'block';
                }
            }
        );
    }

    initUI(): void {
        this.headLine!.clear();
        this.isHideThread = false;
        this.searchValue = '';
        this.gmCallTreeTbl!.style.visibility = 'visible';
        if (this.parentElement!.clientHeight > this.gmCallTreeFilter!.clientHeight) {
            this.gmCallTreeFilter!.style.display = 'flex';
        } else {
            this.gmCallTreeFilter!.style.display = 'none';
        }
        procedurePool.submitWithName('logic0', 'gpu-memory-reset', [], undefined, () => { });
        this.gmCallTreeFilter!.disabledTransfer(true);
        this.gmCallTreeFilter!.initializeFilterTree(true, true, this.currentSelection!.gpuMemory.length > 0);
        this.gmCallTreeFilter!.filterValue = '';

        this.gmCallTreeProgressEL!.loading = true; // @ts-ignore
        this.gmCallTreeLoadingPage.style.visibility = 'visible';
    }

    initElements(): void {
        this.headLine = this.shadowRoot?.querySelector<LitHeadLine>('.titleBox');
        this.gmCallTreeTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpuMemory-calltree');
        this.gmCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#gm-call-tree-filter');
        this.gpuMemoryTbr = this.shadowRoot?.querySelector<LitTable>('#tb-gpuMemory-list');
        this.gmCallTreeProgressEL = this.shadowRoot?.querySelector('.gm-call-tree-progress') as LitProgressBar;
        this.gmCallTreeFrameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
        this.gmCallTreeFrameChart!.mode = ChartMode.Byte;
        this.gmCallTreeLoadingPage = this.shadowRoot?.querySelector('.gm-call-tree-loading');
        this.gmCallTreeFrameChart!.addChartClickListener((needShowMenu: boolean): void => {
            this.parentElement!.scrollTo(0, 0);
            this.showBottomMenu(needShowMenu);
            this.needShowMenu = needShowMenu;
        });
        this.gmCallTreeTbl!.rememberScrollTop = true;
        this.gmCallTreeTbl!.exportTextHandleMap.set('heapSizeStr', (value) => {
            // @ts-ignore
            return `${value.size}`;
        });
        this.gmCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#gm-call-tree-filter');
        let filterFunc = (gmCallTreeFuncData: unknown): void => {
            let gmCallTreeFuncArgs: unknown[] = []; // @ts-ignore
            if (gmCallTreeFuncData.type === 'check') {
                gmCallTreeFuncArgs = this.filterFuncByCheckType(gmCallTreeFuncData, gmCallTreeFuncArgs); // @ts-ignore
            } else if (gmCallTreeFuncData.type === 'select') {
                gmCallTreeFuncArgs = this.filterFuncBySelectType(gmCallTreeFuncData, gmCallTreeFuncArgs); // @ts-ignore
            } else if (gmCallTreeFuncData.type === 'button') {
                gmCallTreeFuncArgs = this.filterFuncByButtonType(gmCallTreeFuncData, gmCallTreeFuncArgs);
            }
            this.getDataByWorker(gmCallTreeFuncArgs, (result: unknown[]): void => {
                this.setLTableData(result); // @ts-ignore
                this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
                if (this.isChartShow) {
                    this.gmCallTreeFrameChart?.calculateChartData();
                }
                this.gmCallTreeTbl!.move1px();
                if (this.currentSelectedData) {
                    // @ts-ignore
                    this.currentSelectedData.isSelected = false;
                    this.gmCallTreeTbl?.clearAllSelection(this.currentSelectedData);
                    this.gpuMemoryTbr!.recycleDataSource = [];
                    this.currentSelectedData = undefined;
                }
            });
        };
        this.gmCallTreeFilter!.getDataLibrary(filterFunc.bind(this));
        this.gmCallTreeFilter!.getDataMining(filterFunc.bind(this));
        this.gmCallTreeFilter!.getCallTreeData(this.getCallTreeByGMCallTreeFilter.bind(this));
        this.gmCallTreeFilter!.getCallTreeConstraintsData(this.getCallTreeConByGMCallTreeFilter.bind(this));
        this.gmCallTreeFilter!.getFilterData(this.getFilterDataByGMCallTreeFilter.bind(this));
        this.initCloseCallBackByHeadLine();
    }

    private getFilterDataByGMCallTreeFilter(gmCallTreeData: FilterData): void {
        if (
            (this.isChartShow && gmCallTreeData.icon === 'tree') ||
            (!this.isChartShow && gmCallTreeData.icon === 'block')
        ) {
            this.switchFlameChart(gmCallTreeData);
        } else {
            this.initGetFilterByGMCallTreeFilter(gmCallTreeData);
        }
    }

    private initGetFilterByGMCallTreeFilter(gmCallTreeData: FilterData): void {
        if (
            this.filterLifespanType !== gmCallTreeData.firstSelect ||
            this.filterGpuType !== gmCallTreeData.secondSelect ||
            this.filterResponseSelect !== gmCallTreeData.thirdSelect
        ) {
            this.filterLifespanType = gmCallTreeData.firstSelect || '0';
            this.filterGpuType = gmCallTreeData.secondSelect || '0';
            this.filterResponseSelect = gmCallTreeData.thirdSelect || '0';
            let thirdIndex = parseInt(gmCallTreeData.thirdSelect || '0');
            if (this.responseTypes.length > thirdIndex) {
                // @ts-ignore
                this.filterResponseType = this.responseTypes[thirdIndex].key || -1;
            }
            this.searchValue = this.gmCallTreeFilter!.filterValue;
            this.expressionStruct = new ParseExpression(this.searchValue).parse();
            this.refreshAllNode(this.gmCallTreeFilter!.getFilterTreeData());
        } else if (this.searchValue !== this.gmCallTreeFilter!.filterValue) {
            this.searchValue = this.gmCallTreeFilter!.filterValue;
            this.expressionStruct = new ParseExpression(this.searchValue).parse();
            let gmArgs = [];
            if (this.expressionStruct) {
                this.refreshAllNode(this.gmCallTreeFilter!.getFilterTreeData());
                this.lastIsExpression = true;
                return;
            } else {
                if (this.lastIsExpression) {
                    this.refreshAllNode(this.gmCallTreeFilter!.getFilterTreeData());
                    this.lastIsExpression = false;
                    return;
                }
                gmArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });
                gmArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
                this.lastIsExpression = false;
            }
            this.getDataByWorker(gmArgs, (result: unknown[]): void => {
                this.gmCallTreeTbl!.isSearch = true;
                this.gmCallTreeTbl!.setStatus(result, true);
                this.setLTableData(result); // @ts-ignore
                this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
                this.switchFlameChart(gmCallTreeData);
                result = [];
            });
        } else {
            this.gmCallTreeTbl!.setStatus(this.gmCallTreeSource, true);
            this.setLTableData(this.gmCallTreeSource);
            this.switchFlameChart(gmCallTreeData);
        }
    }

    private getCallTreeConByGMCallTreeFilter(gmCallTreeConstraintsData: unknown): void {
        let gmCallTreeConstraintsArgs: unknown[] = [
            {
                funcName: 'resotreAllNode',
                funcArgs: [[this.numRuleName]],
            },
            {
                funcName: 'clearSplitMapData',
                funcArgs: [this.numRuleName],
            },
        ]; // @ts-ignore
        if (gmCallTreeConstraintsData.checked) {
            gmCallTreeConstraintsArgs.push({
                funcName: 'hideNumMaxAndMin',
                // @ts-ignore
                funcArgs: [parseInt(gmCallTreeConstraintsData.min), gmCallTreeConstraintsData.max],
            });
        }
        gmCallTreeConstraintsArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
        });
        this.getDataByWorker(gmCallTreeConstraintsArgs, (result: unknown[]): void => {
            this.setLTableData(result); // @ts-ignore
            this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
            if (this.isChartShow) {
                this.gmCallTreeFrameChart?.calculateChartData();
            }
        });
    }

    private initCloseCallBackByHeadLine(): void {
        //点击之后删除掉筛选条件  将所有重置  将目前的title隐藏 高度恢复
        this.headLine!.closeCallback = (): void => {
            this.headLine!.clear();
            this.searchValue = '';
            this.currentGMCallTreeFilter!.filterValue = '';
            this._filterData = undefined;
            this.currentGMCallTreeFilter!.firstSelect = '0';
            this.currentGMCallTreeFilter!.secondSelect = '0';
            this.currentGMCallTreeFilter!.thirdSelect = '0';
            this.filterLifespanType = '0';
            this.refreshAllNode(this.gmCallTreeFilter!.getFilterTreeData(), true);
            this.initFilterTypes(this.types);
            this.gmCallTreeFrameChart?.resizeChange();
        };
    }

    private filterFuncByButtonType(gmCallTreeFuncData: unknown, gmCallTreeFuncArgs: unknown[]): unknown[] {
        // @ts-ignore
        if (gmCallTreeFuncData.item === 'symbol') {
            // @ts-ignore
            if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
                return gmCallTreeFuncArgs;
            }
            if (this.currentSelectedData !== undefined) {
                // @ts-ignore
                this.gmCallTreeFilter!.addDataMining({ name: this.currentSelectedData.symbol }, gmCallTreeFuncData.item);
                gmCallTreeFuncArgs.push({
                    funcName: 'splitTree',
                    // @ts-ignore
                    funcArgs: [this.currentSelectedData.symbol, false, true],
                });
            } else {
                return gmCallTreeFuncArgs;
            } // @ts-ignore
        } else if (gmCallTreeFuncData.item === 'library') {
            // @ts-ignore
            if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
                return gmCallTreeFuncArgs;
            } // @ts-ignore
            if (this.currentSelectedData !== undefined && this.currentSelectedData.libName !== '') {
                // @ts-ignore
                this.gmCallTreeFilter!.addDataMining({ name: this.currentSelectedData.libName }, gmCallTreeFuncData.item);
                gmCallTreeFuncArgs.push({
                    funcName: 'splitTree',
                    // @ts-ignore
                    funcArgs: [this.currentSelectedData.libName, false, false],
                });
            } else {
                return gmCallTreeFuncArgs;
            } // @ts-ignore
        } else if (gmCallTreeFuncData.item === 'restore') {
            // @ts-ignore
            if (gmCallTreeFuncData.remove !== undefined && gmCallTreeFuncData.remove.length > 0) {
                // @ts-ignore
                let list = gmCallTreeFuncData.remove.map((item: unknown): unknown => {
                    // @ts-ignore
                    return item.name;
                });
                gmCallTreeFuncArgs.push({ funcName: 'resotreAllNode', funcArgs: [list] });
                gmCallTreeFuncArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
                list.forEach((symbol: string): void => {
                    gmCallTreeFuncArgs.push({ funcName: 'clearSplitMapData', funcArgs: [symbol] });
                });
            }
        }
        return gmCallTreeFuncArgs;
    }

    private filterFuncBySelectType(gmCallTreeFuncData: unknown, gmCallTreeFuncArgs: unknown[]): unknown[] {
        gmCallTreeFuncArgs.push({
            funcName: 'resotreAllNode',
            // @ts-ignore
            funcArgs: [[gmCallTreeFuncData.item.name]],
        });
        gmCallTreeFuncArgs.push({
            funcName: 'clearSplitMapData',
            // @ts-ignore
            funcArgs: [gmCallTreeFuncData.item.name],
        });
        gmCallTreeFuncArgs.push({
            funcName: 'splitTree',
            funcArgs: [
                // @ts-ignore
                gmCallTreeFuncData.item.name, // @ts-ignore
                gmCallTreeFuncData.item.select === '0', // @ts-ignore
                gmCallTreeFuncData.item.type === 'symbol',
            ],
        });
        return gmCallTreeFuncArgs;
    }

    private getCallTreeByGMCallTreeFilter(callTreeData: unknown): void {
        // @ts-ignore
        if ([InvertOpyionIndex, HideSystemSoOptionIndex, HideThreadOptionIndex].includes(callTreeData.value)) {
            this.refreshAllNode({
                ...this.gmCallTreeFilter!.getFilterTreeData(),
                // @ts-ignore
                callTree: callTreeData.checks,
            });
        } else {
            let resultArgs: unknown[] = [];
            // @ts-ignore
            if (callTreeData.checks[1]) {
                resultArgs.push({
                    funcName: 'hideSystemLibrary',
                    funcArgs: [],
                });
                resultArgs.push({
                    funcName: 'resetAllNode',
                    funcArgs: [],
                });
            } else {
                resultArgs.push({
                    funcName: 'resotreAllNode',
                    funcArgs: [[this.systmeRuleName]],
                });
                resultArgs.push({
                    funcName: 'resetAllNode',
                    funcArgs: [],
                });
                resultArgs.push({
                    funcName: 'clearSplitMapData',
                    funcArgs: [this.systmeRuleName],
                });
            }
            this.getDataByWorker(resultArgs, (result: unknown[]): void => {
                this.setLTableData(result); // @ts-ignore
                this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
                if (this.isChartShow) {
                    this.gmCallTreeFrameChart?.calculateChartData();
                }
            });
        }
    }

    private refreshAllNode(filterData: unknown, isAnalysisReset?: boolean): void {
        let gmCallTreeArgs: unknown[] = []; // @ts-ignore
        let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
        let isHideSystemLibrary = filterData.callTree[1]; // @ts-ignore
        this.isHideThread = filterData.callTree[3]; // @ts-ignore
        let list = filterData.dataMining.concat(filterData.dataLibrary);
        let groupArgs = this.setGroupArgsByRefreshAllNode();
        if ((this.lastIsExpression && !this.expressionStruct) || isAnalysisReset) {
            gmCallTreeArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });
        }
        gmCallTreeArgs.push({ funcName: 'hideThread', funcArgs: [this.isHideThread] });
        gmCallTreeArgs.push(
            {
                funcName: 'groupCallchainSample',
                funcArgs: [groupArgs],
            },
            {
                funcName: 'getCallChainsBySampleIds',
                funcArgs: [isTopDown],
            }
        );
        this.gpuMemoryTbr!.recycleDataSource = [];
        if (isHideSystemLibrary) {
            gmCallTreeArgs.push({
                funcName: 'hideSystemLibrary',
                funcArgs: [],
            });
        } // @ts-ignore
        if (filterData.callTreeConstraints.checked) {
            gmCallTreeArgs.push({
                funcName: 'hideNumMaxAndMin', // @ts-ignore
                funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
            });
        }
        gmCallTreeArgs.push({ funcName: 'splitAllProcess', funcArgs: [list] });
        gmCallTreeArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
        this.getDataByWorker(gmCallTreeArgs, (result: unknown[]) => {
            this.setLTableData(result); // @ts-ignore
            this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
            if (this.isChartShow) {
                this.gmCallTreeFrameChart?.calculateChartData();
            }
        });
    }

    private setGroupArgsByRefreshAllNode(): Map<string, unknown> {
        let groupArgs = new Map<string, unknown>();
        groupArgs.set('filterAllocType', this.filterLifespanType);
        groupArgs.set('filterEventType', this.filterGpuType);
        if (this.expressionStruct) {
            groupArgs.set('filterExpression', this.expressionStruct);
            groupArgs.set('filterResponseType', -1);
            this.currentGMCallTreeFilter!.thirdSelect = '0';
        } else {
            groupArgs.set('filterResponseType', this.filterResponseType);
        }
        groupArgs.set('leftNs', this.currentSelection?.leftNs || 0);
        groupArgs.set('rightNs', this.currentSelection?.rightNs || 0);
        let selections: Array<unknown> = [];
        if (this.subTypeResult.length > 0) {
            this.subTypeResult.map((memory): void => {
                selections.push({
                    memoryTap: memory.subTypeId,
                    subType: memory.subType,
                });
            });
        }
        groupArgs.set('statisticsSelection', selections);
        if (this._filterData) {
            groupArgs.set('filterByTitleArr', this._filterData);
        }
        groupArgs.set(
            'nativeHookType',
            this.currentSelection!.gpuMemory.length > 0 ? 'native-hook' : 'native-hook-statistic'
        );
        return groupArgs;
    }

    private filterFuncByCheckType(gmCallTreeFuncData: unknown, gmCallTreeFuncArgs: unknown[]): unknown[] {
        // @ts-ignore
        if (gmCallTreeFuncData.item.checked) {
            gmCallTreeFuncArgs.push({
                funcName: 'splitTree',
                funcArgs: [
                    // @ts-ignore
                    gmCallTreeFuncData.item.name, // @ts-ignore
                    gmCallTreeFuncData.item.select === '0', // @ts-ignore
                    gmCallTreeFuncData.item.type === 'symbol',
                ],
            });
        } else {
            gmCallTreeFuncArgs.push({
                funcName: 'resotreAllNode', // @ts-ignore
                funcArgs: [[gmCallTreeFuncData.item.name]],
            });
            gmCallTreeFuncArgs.push({
                funcName: 'resetAllNode',
                funcArgs: [],
            });
            gmCallTreeFuncArgs.push({
                funcName: 'clearSplitMapData', // @ts-ignore
                funcArgs: [gmCallTreeFuncData.item.name],
            });
        }
        return gmCallTreeFuncArgs;
    }

    async initFilterTypes(types: Array<string | number>): Promise<void> {
        this.currentGMCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#gm-call-tree-filter');
        let secondFilterList = ['Graphic Memory', 'All VulKan', 'All OpenGLES', 'All OpenCL'];
        const addSubType = (subTypeList: unknown): void => {
            if (!subTypeList) {
                return;
            }
            // @ts-ignore
            for (let data of subTypeList) {
                secondFilterList.push(data.subType);
            }
        };
        if (this.currentSelection!.gpuMemory!.length > 0) {
            let subTypeList = await queryNativeHookSubType(
                this.currentSelection!.leftNs,
                this.currentSelection!.rightNs,
                this.currentSelectIPid,
                types
            );
            // @ts-ignore
            this.subTypeResult = subTypeList;
            addSubType(subTypeList);
        } else {
            let subTypeList = await queryNativeHookStatisticSubType(
                this.currentSelection!.leftNs,
                this.currentSelection!.rightNs,
                this.currentSelectIPid,
                types
            );
            // @ts-ignore
            this.subTypeResult = subTypeList;
            addSubType(subTypeList);
        }
        this.gMCallTreeFilterExtend(secondFilterList);
    }

    private gMCallTreeFilterExtend(secondFilterList: string[]): void {
        procedurePool.submitWithName('logic0', 'gpu-memory-get-responseType', {}, undefined, (res: unknown) => {
            // @ts-ignore
            this.responseTypes = res;
            this.eventList = ['All GpuMemory', 'Created & Existing', 'Created & Destroyed']
            let nullIndex = this.responseTypes.findIndex((item) => {
                // @ts-ignore
                return item.key === 0;
            });
            if (nullIndex !== -1) {
                this.responseTypes.splice(nullIndex, 1);
            }
            this.currentGMCallTreeFilter!.setSelectList(
                this.eventList,
                secondFilterList,
                'GpuMemory Lifespan',
                'GpuMemory Type',
                this.responseTypes.map((item: unknown) => {
                    // @ts-ignore
                    return item.value;
                })
            );
            this.currentGMCallTreeFilter!.setFilterModuleSelect('#first-select', 'width', '150px');
            this.currentGMCallTreeFilter!.setFilterModuleSelect('#second-select', 'width', '150px');
            this.currentGMCallTreeFilter!.setFilterModuleSelect('#third-select', 'width', '150px');
            this.currentGMCallTreeFilter!.firstSelect = '0';
            this.currentGMCallTreeFilter!.secondSelect = '0';
            this.currentGMCallTreeFilter!.thirdSelect = '0';
            this.filterLifespanType = '0';
            this.filterGpuType = '0';
            this.filterResponseSelect = '0';
            this.filterResponseType = -1;
        });
    }

    initTypes(gmCallTreeParam: SelectionParam): void {
        if (gmCallTreeParam.gpuMemory.length > 0) {
            this.gmCallTreeFilter!.isStatisticsMemory = false;
            if (gmCallTreeParam.gpuMemory.indexOf(this.gpuType[0]) !== -1) {
                this.types.push(0);
            }
            if (gmCallTreeParam.gpuMemory.indexOf(this.gpuType[1]) !== -1) {
                this.types.push(1);
            }
            if (gmCallTreeParam.gpuMemory.indexOf(this.gpuType[2]) !== -1) {
                this.types.push(2);
            }
            if (gmCallTreeParam.gpuMemory.indexOf(this.gpuType[3]) !== -1) {
                this.types.push(3);
            }
        } else {
            this.gmCallTreeFilter!.isStatisticsMemory = true;
            if (gmCallTreeParam.gpuMemoryStatistic.indexOf(this.gpuType[0]) !== -1) {
                this.types.push(0);
            }
            if (gmCallTreeParam.gpuMemoryStatistic.indexOf(this.gpuType[1]) !== -1) {
                this.types.push(1);
            }
            if (gmCallTreeParam.gpuMemoryStatistic.indexOf(this.gpuType[2]) !== -1) {
                this.types.push(2);
            }
            if (gmCallTreeParam.gpuMemoryStatistic.indexOf(this.gpuType[3]) !== -1) {
                this.types.push(3);
            }
        }
    }

    getDataByWorkerQuery(args: unknown, handler: Function): void {
        // 加载中样式设置
        this.loadingList.push(1);
        this.gmCallTreeProgressEL!.loading = true; // @ts-ignore
        this.gmCallTreeLoadingPage.style.visibility = 'visible';
        procedurePool.submitWithName(
            'logic0',
            this.currentSelection!.gpuMemory!.length > 0
                ? 'gpu-memory-queryCallchainsSamples'
                : 'gpu-memory-queryStatisticCallchainsSamples',
            args,
            undefined,
            (callChainsResults: unknown): void => {
                handler(callChainsResults);
                this.loadingList.splice(0, 1);
                if (this.loadingList.length === 0) {
                    this.gmCallTreeProgressEL!.loading = false; // @ts-ignore
                    this.gmCallTreeLoadingPage.style.visibility = 'hidden';
                }
            }
        );
    }

    setLTableData(resultData: unknown[], sort?: boolean): void {
        if (sort) {
            this.gmCallTreeSource = this.sortTree(resultData);
        } else {
            if (resultData && resultData[0]) {
                this.gmCallTreeSource =
                    this.currentSelection!.gpuMemory.length > 0 && !this.isHideThread
                        ? this.sortTree(resultData) // @ts-ignore
                        : this.sortTree(resultData[0].children || []);
            } else {
                this.gmCallTreeSource = [];
            }
        }
        this.gmCallTreeTbl!.recycleDataSource = this.gmCallTreeSource;
    }

    sortTree(arr: Array<unknown>): Array<unknown> {
        let gmCallTreeSortArr = arr.sort((callTreeLeftData, callTreeRightData): number => {
            if (this.sortKey === 'heapSizeStr' || this.sortKey === 'heapPercent') {
                if (this.sortType === 0) {
                    // @ts-ignore
                    return callTreeRightData.size - callTreeLeftData.size;
                } else if (this.sortType === 1) {
                    // @ts-ignore
                    return callTreeLeftData.size - callTreeRightData.size;
                } else {
                    // @ts-ignore
                    return callTreeRightData.size - callTreeLeftData.size;
                }
            } else {
                if (this.sortType === 0) {
                    // @ts-ignore
                    return callTreeRightData.count - callTreeLeftData.count;
                } else if (this.sortType === 1) {
                    // @ts-ignore
                    return callTreeLeftData.count - callTreeRightData.count;
                } else {
                    // @ts-ignore
                    return callTreeRightData.count - callTreeLeftData.count;
                }
            }
        });
        gmCallTreeSortArr.map((call): void => {
            // @ts-ignore
            call.children = this.sortTree(call.children);
        });
        return gmCallTreeSortArr;
    }

    async filterByAnalysis(params?: SelectionParam): Promise<void> {
        let filterContent: unknown[] = [];
        let param = new Map<string, unknown>();
        let selections: Array<unknown> = [];
        if (params) {
            this.types = [];
            this.initTypes(params!);
            await this.initFilterTypes(this.types);
        }
        if (this.subTypeResult.length > 0) {
            this.subTypeResult.map((memory): void => {
                selections.push({
                    memoryTap: memory.subTypeId,
                    subType: memory.subType,
                });
            });
        }
        this.setFilterType(selections, this._filterData!);
        param.set('filterByTitleArr', this._filterData);
        param.set('filterAllocType', '0');
        param.set('statisticsSelection', selections);
        param.set('leftNs', this.currentSelection?.leftNs);
        param.set('rightNs', this.currentSelection?.rightNs);
        filterContent.push(
            {
                funcName: 'groupCallchainSample',
                funcArgs: [param],
            },
            {
                funcName: 'getCallChainsBySampleIds',
                funcArgs: [true],
            }
        );
        this.getDataByWorker(filterContent, (result: unknown[]) => {
            this.setLTableData(result); // @ts-ignore
            this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
            this.switchFlameChart();
            this.banTypeAndLidSelect();
            this.gmCallTreeFilter!.icon = 'block';
            this.initFromAnalysis = false;
        });
        this.banTypeAndLidSelect();
    }

    setFilterType(selections: Array<unknown>, data: FilterByAnalysis): void {
        if (data.type === 'All VulKan') {
            data.type = '1';
        } else if (data.type === 'All OpenGLES') {
            data.type = '2';
        } else if (data.type === 'All OpenCL') {
            data.type = '3';
        } else {
            const index = this.subTypeResult.findIndex(item => item.subType === data.type);
            if (index !== -1) {
                data.type = (index + 4).toString();
            }
        }
    }

    getDataByWorker(args: unknown[], handler: Function): void {
        this.loadingList.push(1);
        this.gmCallTreeProgressEL!.loading = true; // @ts-ignore
        this.gmCallTreeLoadingPage.style.visibility = 'visible';
        procedurePool.submitWithName(
            'logic0',
            'gpu-memory-calltree-action',
            args,
            undefined,
            (callTreeActionResults: unknown): void => {
                handler(callTreeActionResults);
                this.loadingList.splice(0, 1);
                if (this.loadingList.length === 0) {
                    this.gmCallTreeProgressEL!.loading = false; // @ts-ignore
                    this.gmCallTreeLoadingPage.style.visibility = 'hidden';
                }
            }
        );
    }

    private switchFlameChart(flameChartData?: unknown): void {
        // 树状图
        let gmCallTreePageTab = this.shadowRoot?.querySelector('#show_table');
        // 火焰图
        let gmCallTreePageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
        if (!flameChartData || flameChartData.icon === 'block') {
            gmCallTreePageChart?.setAttribute('class', 'show');
            gmCallTreePageTab?.setAttribute('class', '');
            this.isChartShow = true;
            this.gmCallTreeFilter!.disabledMining = true;
            this.showBottomMenu(this.needShowMenu);
            this.gmCallTreeFrameChart?.calculateChartData(); // @ts-ignore
        } else if (flameChartData.icon === 'tree') {
            gmCallTreePageChart?.setAttribute('class', '');
            gmCallTreePageTab?.setAttribute('class', 'show');
            this.showBottomMenu(true);
            this.isChartShow = false;
            this.gmCallTreeFilter!.disabledMining = false;
            this.gmCallTreeFrameChart!.clearCanvas();
            this.gmCallTreeTbl!.reMeauseHeight();
        }
    }

    //底部的筛选菜单
    showBottomMenu(isShow: boolean): void {
        if (isShow) {
            this.gmCallTreeFilter?.showThird(true);
            this.gmCallTreeFilter?.setAttribute('first', '');
            this.gmCallTreeFilter?.setAttribute('second', '');
            this.gmCallTreeFilter?.setAttribute('tree', '');
            this.gmCallTreeFilter?.setAttribute('input', '');
            this.gmCallTreeFilter?.setAttribute('inputLeftText', '');
        } else {
            this.gmCallTreeFilter?.showThird(false);
            this.gmCallTreeFilter?.removeAttribute('first');
            this.gmCallTreeFilter?.removeAttribute('second');
            this.gmCallTreeFilter?.removeAttribute('tree');
            this.gmCallTreeFilter?.removeAttribute('input');
            this.gmCallTreeFilter?.removeAttribute('inputLeftText');
        }
    }

    banTypeAndLidSelect(): void {
        this.currentGMCallTreeFilter!.firstSelect = '0';
        let secondSelect = this.shadowRoot
            ?.querySelector('#gm-call-tree-filter')!
            .shadowRoot!.querySelector('#second-select');
        let thirdSelect = this.shadowRoot
            ?.querySelector('#gm-call-tree-filter')!
            .shadowRoot!.querySelector('#third-select');
        thirdSelect?.setAttribute('disabled', '');
        secondSelect?.setAttribute('disabled', '');
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.gmCallTreeTbl!.addEventListener('row-click', this.gmCallTreeTblRowClickHandler);
        this.gpuMemoryTbr!.addEventListener('row-click', this.gpuMemoryTbrRowClickHandler);
        this.gmCallTreeTbl!.addEventListener('column-click', this.gmCallTreeTblColumnClickHandler);
        let filterHeight = 0;
        new ResizeObserver((entries: ResizeObserverEntry[]): void => {
            let gmCallTreeTabFilter = this.shadowRoot!.querySelector('#gm-call-tree-filter') as HTMLElement;
            if (gmCallTreeTabFilter.clientHeight > 0) {
                filterHeight = gmCallTreeTabFilter.clientHeight;
            }
            if (this.parentElement!.clientHeight > filterHeight) {
                gmCallTreeTabFilter.style.display = 'flex';
            } else {
                gmCallTreeTabFilter.style.display = 'none';
            }
            if (this.gmCallTreeTbl!.style.visibility === 'hidden') {
                gmCallTreeTabFilter.style.display = 'none';
            }
            if (this.parentElement?.clientHeight !== 0) {
                if (this.isChartShow) {
                    this.gmCallTreeFrameChart?.updateCanvas(false, entries[0].contentRect.width);
                    this.gmCallTreeFrameChart?.calculateChartData();
                }
                let headLineHeight = 0;
                if (this.headLine?.isShow) {
                    headLineHeight = this.headLine!.clientHeight;
                }
                if (this.gmCallTreeTbl) {
                    // @ts-ignore
                    this.gmCallTreeTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 35 - headLineHeight
                        }px`;
                }
                this.gmCallTreeTbl?.reMeauseHeight();
                if (this.gpuMemoryTbr) {
                    // @ts-ignore
                    this.gpuMemoryTbr.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45 - 21 - headLineHeight
                        }px`;
                }
                this.gpuMemoryTbr?.reMeauseHeight(); // @ts-ignore
                this.gmCallTreeLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
            }
        }).observe(this.parentElement!);
        this.parentElement!.onscroll = (): void => {
            this.gmCallTreeFrameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
        };
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.gmCallTreeTbl!.removeEventListener('row-click', this.gmCallTreeTblRowClickHandler);
        this.gpuMemoryTbr!.removeEventListener('row-click', this.gpuMemoryTbrRowClickHandler);
        this.gmCallTreeTbl!.removeEventListener('column-click', this.gmCallTreeTblColumnClickHandler);
    }

    gmCallTreeTblColumnClickHandler = (event: unknown): void => {
        // @ts-ignore
        this.sortKey = event.detail.key; // @ts-ignore
        this.sortType = event.detail.sort;
        this.setLTableData(this.gmCallTreeSource, true); // @ts-ignore
        this.gmCallTreeFrameChart!.data = this.gmCallTreeSource;
    };

    gpuMemoryTbrRowClickHandler = (event: unknown): void => {
        // @ts-ignore
        let data = event.detail.data as FileMerageBean;
        this.gmCallTreeTbl?.clearAllSelection(data); // @ts-ignore
        (data as unknown).isSelected = true;
        this.gmCallTreeTbl!.scrollToData(data); // @ts-ignore
        if ((event.detail as unknown).callBack) {
            // @ts-ignore
            (event.detail as unknown).callBack(true);
        }
    };

    gmCallTreeTblRowClickHandler = (event: unknown): void => {
        // @ts-ignore
        let gmCallTreeData = event.detail.data as FileMerageBean;
        this.setRightTableData(gmCallTreeData);
        gmCallTreeData.isSelected = true;
        this.currentSelectedData = gmCallTreeData;
        this.gpuMemoryTbr?.clearAllSelection(gmCallTreeData);
        this.gpuMemoryTbr?.setCurrentSelection(gmCallTreeData);
        // @ts-ignore
        if ((event.detail as unknown).callBack) {
            // @ts-ignore
            (event.detail as unknown).callBack(true);
        }
        document.dispatchEvent(
            new CustomEvent('number_calibration', {
                // @ts-ignore
                detail: { time: event.detail.tsArray, counts: event.detail.countArray },
            })
        );
    };

    setRightTableData(fileMerageBean: FileMerageBean): void {
        let parents: Array<FileMerageBean> = [];
        let children: Array<FileMerageBean> = []; // @ts-ignore
        this.getParentTree(this.gmCallTreeSource, fileMerageBean, parents);
        let maxId = fileMerageBean.id;
        let maxDur = 0;

        function findMaxStack(merageBean: unknown): void {
            // @ts-ignore
            if (merageBean.children.length === 0) {
                // @ts-ignore
                if (merageBean.heapSize > maxDur) {
                    // @ts-ignore
                    maxDur = merageBean.heapSize; // @ts-ignore
                    maxId = merageBean.id;
                }
            } else {
                // @ts-ignore
                merageBean.children.map((callChild: unknown): void => {
                    findMaxStack(<FileMerageBean>callChild);
                });
            }
        }

        findMaxStack(fileMerageBean);
        this.getChildTree(fileMerageBean.children as Array<FileMerageBean>, maxId, children);
        let resultValue = parents.reverse().concat(children.reverse());
        for (let data of resultValue) {
            data.type = data.lib.endsWith('.so.1') || data.lib.endsWith('.dll') || data.lib.endsWith('.so') ? 0 : 1;
        }
        let resultLength = resultValue.length;
        this.gpuMemoryTbr!.dataSource = resultLength === 0 ? [] : resultValue;
    }

    getParentTree(
        gmCallTreeSrc: Array<FileMerageBean>,
        gmCallTreeTarget: FileMerageBean,
        parents: Array<FileMerageBean>
    ): boolean {
        for (let gmCallTreeBean of gmCallTreeSrc) {
            if (gmCallTreeBean.id === gmCallTreeTarget.id) {
                parents.push(gmCallTreeBean);
                return true;
            } else {
                if (this.getParentTree(gmCallTreeBean.children as Array<FileMerageBean>, gmCallTreeTarget, parents)) {
                    parents.push(gmCallTreeBean);
                    return true;
                }
            }
        }
        return false;
    }

    getChildTree(gmCallTreeSrc: Array<FileMerageBean>, id: string, children: Array<FileMerageBean>): boolean {
        for (let gmCallTreeBean of gmCallTreeSrc) {
            if (gmCallTreeBean.id === id && gmCallTreeBean.children.length === 0) {
                children.push(gmCallTreeBean);
                return true;
            } else {
                if (this.getChildTree(gmCallTreeBean.children as Array<FileMerageBean>, id, children)) {
                    children.push(gmCallTreeBean);
                    return true;
                }
            }
        }
        return false;
    }

    initHtml(): string {
        return TabPaneGMCallTreeHtml;
    }

}