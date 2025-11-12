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

import { BaseElement, element } from "../../../../../base-ui/BaseElement";
import { LitHeadLine } from "../../../../../base-ui/headline/lit-headline";
import { LitProgressBar } from "../../../../../base-ui/progress-bar/LitProgressBar";
import { LitTable } from "../../../../../base-ui/table/lit-table";
import { SelectionParam } from "../../../../bean/BoxSelection";
import { ChartMode } from "../../../../bean/FrameChartStruct";
import { FilterByAnalysis, NativeMemoryExpression } from "../../../../bean/NativeHook";
import { FileMerageBean } from "../../../../database/logic-worker/ProcedureLogicWorkerFileSystem";
import { procedurePool } from "../../../../database/Procedure";
import { queryNativeHookStatisticSubType } from "../../../../database/sql/otherSource.sql";
import { FrameChart } from "../../../chart/FrameChart";
import { ParseExpression } from "../SheetUtils";
import { FilterData, TabPaneFilter } from "../TabPaneFilter";
import { TabPaneOSCallTreeHtml } from './TabPaneOSCallTree.html';

const InvertOpyionIndex: number = 0;
const HideSystemSoOptionIndex: number = 1;
const HideThreadOptionIndex: number = 3;

@element('tabpane-os-calltree')
export class TabpaneOSCalltree extends BaseElement {
    private osCallTreeTbl: LitTable | null | undefined;
    private otherSourceTbr: LitTable | null | undefined;
    private osCallTreeFilter: TabPaneFilter | null | undefined;
    private osCallTreeProgressEL: LitProgressBar | null | undefined;
    private osCallTreeLoadingPage: unknown;
    private currentOSCallTreeFilter: TabPaneFilter | undefined | null;
    private subTypeArr: number[] = [];
    private responseTypes: unknown[] = [];
    private filterLifespanType: string = '0';
    private filterOthersourceType: string = '0';
    private filterResponseType: number = -1;
    private filterResponseSelect: string = '0';
    private otherSourceType: Array<string> = ['FD', 'THREAD'];
    private _analysisTabWidth: number = 0;
    private loadingList: number[] = [];
    private sortKey: string = 'heapSizeStr';
    private sortType: number = 0;
    private systmeRuleName: string = '/system/';
    private numRuleName: string = '/max/min/';
    private osCallTreeFrameChart: FrameChart | null | undefined;
    private _initFromAnalysis = false;
    private _filterData: FilterByAnalysis | undefined;
    private isChartShow: boolean = false;
    private needShowMenu: boolean = true;
    private expressionStruct: NativeMemoryExpression | null = null;
    private currentSelection: SelectionParam | undefined;
    private osCallTreeSource: unknown[] = [];
    private currentSelectIPid = 1;
    private headLine: LitHeadLine | null | undefined;
    private isHideThread: boolean = false;
    private searchValue: string = '';
    private lastIsExpression = false;
    private currentSelectedData: unknown = undefined;
    private eventList: string[] | null | undefined;

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

    set data(osCallTreeParam: SelectionParam) {
        const isShow = osCallTreeParam.otherSource.length > 0;
        this.osCallTreeFrameChart!.dispatchEvent(
            new CustomEvent('show-calibration', {
                detail: {
                    isShow: isShow
                },
                bubbles: false
            })
        );
        if (osCallTreeParam === this.currentSelection) {
            return;
        }
        // 火焰图数据
        this.osCallTreeSource = [];
        // 框选内容赋值
        this.currentSelection = osCallTreeParam;
        // 拿到框选的pid
        this.currentSelectIPid = osCallTreeParam.otherSourceCurrentIPid;
        this.init(osCallTreeParam);
    }

    private async init(osCallTreeParam: SelectionParam): Promise<void> {
        // 初始化样式
        this.initUI();
        // 初始化选择框内容
        await this.initFilterTypes(osCallTreeParam);
        let types: Array<string | number> = [];
        this.initTypes(osCallTreeParam, types);
        const initWidth = this._analysisTabWidth > 0 ? this._analysisTabWidth : this.clientWidth;
        // 获取tab页数据
        this.getDataByWorkerQuery(
            {
                leftNs: osCallTreeParam.leftNs,
                rightNs: osCallTreeParam.rightNs,
                types,
            },
            (results: unknown[]): void => {
                this.setLTableData(results);
                this.otherSourceTbr!.recycleDataSource = [];

                this.osCallTreeFrameChart?.updateCanvas(true, initWidth);
                if (this._initFromAnalysis) {
                    this.filterByAnalysis();
                } else {
                    // @ts-ignore
                    this.osCallTreeFrameChart!.data = this.osCallTreeSource;
                    this.switchFlameChart();
                    this.osCallTreeFilter!.icon = 'block';
                }
            }
        );
    }

    initUI(): void {
        this.headLine!.clear();
        this.isHideThread = false;
        this.searchValue = '';
        this.osCallTreeTbl!.style.visibility = 'visible';
        if (this.parentElement!.clientHeight > this.osCallTreeFilter!.clientHeight) {
            this.osCallTreeFilter!.style.display = 'flex';
        } else {
            this.osCallTreeFilter!.style.display = 'none';
        }
        procedurePool.submitWithName('logic0', 'other-source-reset', [], undefined, () => { });
        this.osCallTreeFilter!.disabledTransfer(true);
        this.osCallTreeFilter!.initializeFilterTree(true, true, this.currentSelection!.otherSource.length > 0);
        this.osCallTreeFilter!.filterValue = '';

        this.osCallTreeProgressEL!.loading = true; // @ts-ignore
        this.osCallTreeLoadingPage.style.visibility = 'visible';
    }

    initElements(): void {
        this.headLine = this.shadowRoot?.querySelector<LitHeadLine>('.titleBox');
        this.osCallTreeTbl = this.shadowRoot?.querySelector<LitTable>('#tb-otherSource-calltree');
        this.osCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#os-call-tree-filter');
        this.otherSourceTbr = this.shadowRoot?.querySelector<LitTable>('#tb-otherSource-list');
        this.osCallTreeProgressEL = this.shadowRoot?.querySelector('.os-call-tree-progress') as LitProgressBar;
        this.osCallTreeFrameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
        this.osCallTreeFrameChart!.mode = ChartMode.Byte;
        this.osCallTreeLoadingPage = this.shadowRoot?.querySelector('.os-call-tree-loading');
        this.osCallTreeFrameChart!.addChartClickListener((needShowMenu: boolean): void => {
            this.parentElement!.scrollTo(0, 0);
            this.showBottomMenu(needShowMenu);
            this.needShowMenu = needShowMenu;
        });
        this.osCallTreeTbl!.rememberScrollTop = true;
        this.osCallTreeTbl!.exportTextHandleMap.set('heapSizeStr', (value) => {
            // @ts-ignore
            return `${value.size}`;
        });
        this.osCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#os-call-tree-filter');
        let filterFunc = (osCallTreeFuncData: unknown): void => {
            let osCallTreeFuncArgs: unknown[] = []; // @ts-ignore
            if (osCallTreeFuncData.type === 'check') {
                osCallTreeFuncArgs = this.filterFuncByCheckType(osCallTreeFuncData, osCallTreeFuncArgs); // @ts-ignore
            } else if (osCallTreeFuncData.type === 'select') {
                osCallTreeFuncArgs = this.filterFuncBySelectType(osCallTreeFuncData, osCallTreeFuncArgs); // @ts-ignore
            } else if (osCallTreeFuncData.type === 'button') {
                osCallTreeFuncArgs = this.filterFuncByButtonType(osCallTreeFuncData, osCallTreeFuncArgs);
            }
            this.getDataByWorker(osCallTreeFuncArgs, (result: unknown[]): void => {
                this.setLTableData(result); // @ts-ignore
                this.osCallTreeFrameChart!.data = this.osCallTreeSource;
                if (this.isChartShow) {
                    this.osCallTreeFrameChart?.calculateChartData();
                }
                this.osCallTreeTbl!.move1px();
                if (this.currentSelectedData) {
                    // @ts-ignore
                    this.currentSelectedData.isSelected = false;
                    this.osCallTreeTbl?.clearAllSelection(this.currentSelectedData);
                    this.otherSourceTbr!.recycleDataSource = [];
                    this.currentSelectedData = undefined;
                }
            });
        };
        this.osCallTreeFilter!.getDataLibrary(filterFunc.bind(this));
        this.osCallTreeFilter!.getDataMining(filterFunc.bind(this));
        this.osCallTreeFilter!.getCallTreeData(this.getCallTreeByOSCallTreeFilter.bind(this));
        this.osCallTreeFilter!.getCallTreeConstraintsData(this.getCallTreeConByOSCallTreeFilter.bind(this));
        this.osCallTreeFilter!.getFilterData(this.getFilterDataByOSCallTreeFilter.bind(this));
        this.initCloseCallBackByHeadLine();
    }

    private initCloseCallBackByHeadLine(): void {
        //点击之后删除掉筛选条件  将所有重置  将目前的title隐藏 高度恢复
        this.headLine!.closeCallback = (): void => {
            this.headLine!.clear();
            this.searchValue = '';
            this.currentOSCallTreeFilter!.filterValue = '';
            this._filterData = undefined;
            this.currentOSCallTreeFilter!.firstSelect = '0';
            this.currentOSCallTreeFilter!.secondSelect = '0';
            this.currentOSCallTreeFilter!.thirdSelect = '0';
            this.filterLifespanType = '0';
            this.refreshAllNode(this.osCallTreeFilter!.getFilterTreeData(), true);
            this.initFilterTypes(this.currentSelection!);
            this.osCallTreeFrameChart?.resizeChange();
        };
    }

    private getCallTreeByOSCallTreeFilter(callTreeData: unknown): void {
        // @ts-ignore
        if ([InvertOpyionIndex, HideSystemSoOptionIndex, HideThreadOptionIndex].includes(callTreeData.value)) {
            this.refreshAllNode({
                ...this.osCallTreeFilter!.getFilterTreeData(),
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
                this.osCallTreeFrameChart!.data = this.osCallTreeSource;
                if (this.isChartShow) {
                    this.osCallTreeFrameChart?.calculateChartData();
                }
            });
        }
    }

    private getFilterDataByOSCallTreeFilter(osCallTreeData: FilterData): void {
        if (
            (this.isChartShow && osCallTreeData.icon === 'tree') ||
            (!this.isChartShow && osCallTreeData.icon === 'block')
        ) {
            this.switchFlameChart(osCallTreeData);
        } else {
            this.initGetFilterByOSCallTreeFilter(osCallTreeData);
        }
    }

    private initGetFilterByOSCallTreeFilter(osCallTreeData: FilterData): void {
        if (
            this.filterLifespanType !== osCallTreeData.firstSelect ||
            this.filterOthersourceType !== osCallTreeData.secondSelect ||
            this.filterResponseSelect !== osCallTreeData.thirdSelect
        ) {
            this.filterLifespanType = osCallTreeData.firstSelect || '0';
            this.filterOthersourceType = osCallTreeData.secondSelect || '0';
            this.filterResponseSelect = osCallTreeData.thirdSelect || '0';
            let thirdIndex = parseInt(osCallTreeData.thirdSelect || '0');
            if (this.responseTypes.length > thirdIndex) {
                // @ts-ignore
                this.filterResponseType = this.responseTypes[thirdIndex].key || -1;
            }
            this.searchValue = this.osCallTreeFilter!.filterValue;
            this.expressionStruct = new ParseExpression(this.searchValue).parse();
            this.refreshAllNode(this.osCallTreeFilter!.getFilterTreeData());
        } else if (this.searchValue !== this.osCallTreeFilter!.filterValue) {
            this.searchValue = this.osCallTreeFilter!.filterValue;
            this.expressionStruct = new ParseExpression(this.searchValue).parse();
            let osArgs = [];
            if (this.expressionStruct) {
                this.refreshAllNode(this.osCallTreeFilter!.getFilterTreeData());
                this.lastIsExpression = true;
                return;
            } else {
                if (this.lastIsExpression) {
                    this.refreshAllNode(this.osCallTreeFilter!.getFilterTreeData());
                    this.lastIsExpression = false;
                    return;
                }// @ts-ignore
                osArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });// @ts-ignore
                osArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
                this.lastIsExpression = false;
            }
            this.getDataByWorker(osArgs, (result: unknown[]): void => {
                this.osCallTreeTbl!.isSearch = true;
                this.osCallTreeTbl!.setStatus(result, true);
                this.setLTableData(result); // @ts-ignore
                this.osCallTreeFrameChart!.data = this.osCallTreeSource;
                this.switchFlameChart(osCallTreeData);
                result = [];
            });
        } else {
            this.osCallTreeTbl!.setStatus(this.osCallTreeSource, true);
            this.setLTableData(this.osCallTreeSource);
            this.switchFlameChart(osCallTreeData);
        }
    }

    private refreshAllNode(filterData: unknown, isAnalysisReset?: boolean): void {
        let osCallTreeArgs: unknown[] = []; // @ts-ignore
        let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
        let isHideSystemLibrary = filterData.callTree[1]; // @ts-ignore
        this.isHideThread = filterData.callTree[3]; // @ts-ignore
        let list = filterData.dataMining.concat(filterData.dataLibrary);
        let groupArgs = this.setGroupArgsByRefreshAllNode();
        if ((this.lastIsExpression && !this.expressionStruct) || isAnalysisReset) {
            osCallTreeArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });
        }
        osCallTreeArgs.push({ funcName: 'hideThread', funcArgs: [this.isHideThread] });
        osCallTreeArgs.push(
            {
                funcName: 'groupCallchainSample',
                funcArgs: [groupArgs],
            },
            {
                funcName: 'getCallChainsBySampleIds',
                funcArgs: [isTopDown],
            }
        );
        this.otherSourceTbr!.recycleDataSource = [];
        if (isHideSystemLibrary) {
            osCallTreeArgs.push({
                funcName: 'hideSystemLibrary',
                funcArgs: [],
            });
        } // @ts-ignore
        if (filterData.callTreeConstraints.checked) {
            osCallTreeArgs.push({
                funcName: 'hideNumMaxAndMin', // @ts-ignore
                funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
            });
        }
        osCallTreeArgs.push({ funcName: 'splitAllProcess', funcArgs: [list] });
        osCallTreeArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
        this.getDataByWorker(osCallTreeArgs, (result: unknown[]) => {
            this.setLTableData(result); // @ts-ignore
            this.osCallTreeFrameChart!.data = this.osCallTreeSource;
            if (this.isChartShow) {
                this.osCallTreeFrameChart?.calculateChartData();
            }
        });
    }

    private setGroupArgsByRefreshAllNode(): Map<string, unknown> {
        let groupArgs = new Map<string, unknown>();
        groupArgs.set('filterAllocType', this.filterLifespanType);
        groupArgs.set('filterEventType', this.filterOthersourceType);
        if (this.expressionStruct) {
            groupArgs.set('filterExpression', this.expressionStruct);
            groupArgs.set('filterResponseType', -1);
            this.currentOSCallTreeFilter!.thirdSelect = '0';
        } else {
            groupArgs.set('filterResponseType', this.filterResponseType);
        }
        groupArgs.set('leftNs', this.currentSelection?.leftNs || 0);
        groupArgs.set('rightNs', this.currentSelection?.rightNs || 0);
        let selections: Array<unknown> = [];
        if (this.subTypeArr.length > 0) {
            this.subTypeArr.map((memory): void => {
                selections.push({
                    memoryTap: memory,
                });
            });
        }
        groupArgs.set('statisticsSelection', selections);
        if (this._filterData) {
            groupArgs.set('filterByTitleArr', this._filterData);
        }
        groupArgs.set(
            'nativeHookType',
            this.currentSelection!.otherSource.length > 0 ? 'native-hook' : 'native-hook-statistic'
        );
        return groupArgs;
    }

    private getCallTreeConByOSCallTreeFilter(osCallTreeConstraintsData: unknown): void {
        let osCallTreeConstraintsArgs: unknown[] = [
            {
                funcName: 'resotreAllNode',
                funcArgs: [[this.numRuleName]],
            },
            {
                funcName: 'clearSplitMapData',
                funcArgs: [this.numRuleName],
            },
        ]; // @ts-ignore
        if (osCallTreeConstraintsData.checked) {
            osCallTreeConstraintsArgs.push({
                funcName: 'hideNumMaxAndMin',
                // @ts-ignore
                funcArgs: [parseInt(osCallTreeConstraintsData.min), osCallTreeConstraintsData.max],
            });
        }
        osCallTreeConstraintsArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
        });
        this.getDataByWorker(osCallTreeConstraintsArgs, (result: unknown[]): void => {
            this.setLTableData(result); // @ts-ignore
            this.osCallTreeFrameChart!.data = this.osCallTreeSource;
            if (this.isChartShow) {
                this.osCallTreeFrameChart?.calculateChartData();
            }
        });
    }

    private filterFuncByButtonType(osCallTreeFuncData: unknown, osCallTreeFuncArgs: unknown[]): unknown[] {
        // @ts-ignore
        if (osCallTreeFuncData.item === 'symbol') {
            // @ts-ignore
            if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
                return osCallTreeFuncArgs;
            }
            if (this.currentSelectedData !== undefined) {
                // @ts-ignore
                this.osCallTreeFilter!.addDataMining({ name: this.currentSelectedData.symbol }, osCallTreeFuncData.item);
                osCallTreeFuncArgs.push({
                    funcName: 'splitTree',
                    // @ts-ignore
                    funcArgs: [this.currentSelectedData.symbol, false, true],
                });
            } else {
                return osCallTreeFuncArgs;
            } // @ts-ignore
        } else if (osCallTreeFuncData.item === 'library') {
            // @ts-ignore
            if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
                return osCallTreeFuncArgs;
            } // @ts-ignore
            if (this.currentSelectedData !== undefined && this.currentSelectedData.libName !== '') {
                // @ts-ignore
                this.osCallTreeFilter!.addDataMining({ name: this.currentSelectedData.libName }, osCallTreeFuncData.item);
                osCallTreeFuncArgs.push({
                    funcName: 'splitTree',
                    // @ts-ignore
                    funcArgs: [this.currentSelectedData.libName, false, false],
                });
            } else {
                return osCallTreeFuncArgs;
            } // @ts-ignore
        } else if (osCallTreeFuncData.item === 'restore') {
            // @ts-ignore
            if (osCallTreeFuncData.remove !== undefined && osCallTreeFuncData.remove.length > 0) {
                // @ts-ignore
                let list = osCallTreeFuncData.remove.map((item: unknown): unknown => {
                    // @ts-ignore
                    return item.name;
                });
                osCallTreeFuncArgs.push({ funcName: 'resotreAllNode', funcArgs: [list] });
                osCallTreeFuncArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
                list.forEach((symbol: string): void => {
                    osCallTreeFuncArgs.push({ funcName: 'clearSplitMapData', funcArgs: [symbol] });
                });
            }
        }
        return osCallTreeFuncArgs;
    }

    private filterFuncBySelectType(osCallTreeFuncData: unknown, osCallTreeFuncArgs: unknown[]): unknown[] {
        osCallTreeFuncArgs.push({
            funcName: 'resotreAllNode',
            // @ts-ignore
            funcArgs: [[osCallTreeFuncData.item.name]],
        });
        osCallTreeFuncArgs.push({
            funcName: 'clearSplitMapData',
            // @ts-ignore
            funcArgs: [osCallTreeFuncData.item.name],
        });
        osCallTreeFuncArgs.push({
            funcName: 'splitTree',
            funcArgs: [
                // @ts-ignore
                osCallTreeFuncData.item.name, // @ts-ignore
                osCallTreeFuncData.item.select === '0', // @ts-ignore
                osCallTreeFuncData.item.type === 'symbol',
            ],
        });
        return osCallTreeFuncArgs;
    }

    private filterFuncByCheckType(osCallTreeFuncData: unknown, osCallTreeFuncArgs: unknown[]): unknown[] {
        // @ts-ignore
        if (osCallTreeFuncData.item.checked) {
            osCallTreeFuncArgs.push({
                funcName: 'splitTree',
                funcArgs: [
                    // @ts-ignore
                    osCallTreeFuncData.item.name, // @ts-ignore
                    osCallTreeFuncData.item.select === '0', // @ts-ignore
                    osCallTreeFuncData.item.type === 'symbol',
                ],
            });
        } else {
            osCallTreeFuncArgs.push({
                funcName: 'resotreAllNode', // @ts-ignore
                funcArgs: [[osCallTreeFuncData.item.name]],
            });
            osCallTreeFuncArgs.push({
                funcName: 'resetAllNode',
                funcArgs: [],
            });
            osCallTreeFuncArgs.push({
                funcName: 'clearSplitMapData', // @ts-ignore
                funcArgs: [osCallTreeFuncData.item.name],
            });
        }
        return osCallTreeFuncArgs;
    }

    async initFilterTypes(osCallTreeParam: SelectionParam): Promise<void> {
        this.currentOSCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#os-call-tree-filter');// @ts-ignore
        let secondFilterList = ['ALL'];
        const addSubType = (subTypeList: unknown): void => {
            if (!subTypeList) {
                return;
            }
            this.subTypeArr = []; // @ts-ignore
            for (let data of subTypeList) {
                secondFilterList.push(data.subType);
                this.subTypeArr.push(data.subTypeId);
            }
        };
        if (this.currentSelection!.otherSource!.length > 0) {
        } else {
            let subTypeList = await queryNativeHookStatisticSubType(
                this.currentSelection!.leftNs,
                this.currentSelection!.rightNs,
                this.currentSelectIPid
            );
            addSubType(subTypeList);
        }// @ts-ignore
        this.oSCallTreeFilterExtend(secondFilterList, osCallTreeParam);
    }

    private oSCallTreeFilterExtend(secondFilterList: string[], osCallTreeParam: SelectionParam): void {
        procedurePool.submitWithName('logic0', 'other-source-get-responseType', {}, undefined, (res: unknown) => {
            // @ts-ignore
            this.responseTypes = res;
            this.eventList = ['All OtherSource', 'Created & Existing', 'Created & Destroyed']
            let nullIndex = this.responseTypes.findIndex((item) => {
                // @ts-ignore
                return item.key === 0;
            });
            if (nullIndex !== -1) {
                this.responseTypes.splice(nullIndex, 1);
            }
            this.currentOSCallTreeFilter!.setSelectList(
                this.eventList,
                secondFilterList,
                'OtherSource Lifespan',
                'OtherSource Type',
                this.responseTypes.map((item: unknown) => {
                    // @ts-ignore
                    return item.value;
                })
            );
            this.currentOSCallTreeFilter!.setFilterModuleSelect('#first-select', 'width', '150px');
            this.currentOSCallTreeFilter!.setFilterModuleSelect('#second-select', 'width', '150px');
            this.currentOSCallTreeFilter!.setFilterModuleSelect('#third-select', 'width', '150px');
            this.currentOSCallTreeFilter!.firstSelect = '0';
            this.currentOSCallTreeFilter!.secondSelect = '0';
            this.currentOSCallTreeFilter!.thirdSelect = '0';
            this.filterLifespanType = '0';
            this.filterOthersourceType = '0';
            this.filterResponseSelect = '0';
            this.filterResponseType = -1;
        });
    }

    initTypes(osCallTreeParam: SelectionParam, types: Array<string | number>): void {
        if (osCallTreeParam.otherSource.length > 0) {
        } else {
            this.osCallTreeFilter!.isStatisticsMemory = true;
            if (osCallTreeParam.otherSourceStatistic.indexOf(this.otherSourceType[0]) !== -1) {
                types.push(1);
            }
            if (osCallTreeParam.otherSourceStatistic.indexOf(this.otherSourceType[1]) !== -1) {
                types.push(2);
            }
        }
    }

    getDataByWorkerQuery(args: unknown, handler: Function): void {
        // 加载中样式设置
        this.loadingList.push(1);
        this.osCallTreeProgressEL!.loading = true; // @ts-ignore
        this.osCallTreeLoadingPage.style.visibility = 'visible';
        procedurePool.submitWithName(
            'logic0',
            this.currentSelection!.otherSource!.length > 0
                ? 'other-source-queryCallchainsSamples'
                : 'other-source-queryStatisticCallchainsSamples',
            args,
            undefined,
            (callChainsResults: unknown): void => {
                handler(callChainsResults);
                this.loadingList.splice(0, 1);
                if (this.loadingList.length === 0) {
                    this.osCallTreeProgressEL!.loading = false; // @ts-ignore
                    this.osCallTreeLoadingPage.style.visibility = 'hidden';
                }
            }
        );
    }

    setLTableData(resultData: unknown[], sort?: boolean): void {
        if (sort) {
            this.osCallTreeSource = this.sortTree(resultData);
        } else {
            if (resultData && resultData[0]) {
                this.osCallTreeSource =
                    this.currentSelection!.otherSource.length > 0 && !this.isHideThread
                        ? this.sortTree(resultData) // @ts-ignore
                        : this.sortTree(resultData[0].children || []);
            } else {
                this.osCallTreeSource = [];
            }
        }
        this.osCallTreeTbl!.recycleDataSource = this.osCallTreeSource;
    }

    sortTree(arr: Array<unknown>): Array<unknown> {
        let osCallTreeSortArr = arr.sort((callTreeLeftData, callTreeRightData): number => {
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
        osCallTreeSortArr.map((call): void => {
            // @ts-ignore
            call.children = this.sortTree(call.children);
        });
        return osCallTreeSortArr;
    }

    filterByAnalysis(): void {
        let filterContent: unknown[] = [];
        let param = new Map<string, unknown>();
        let selections: Array<unknown> = [];
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
            this.osCallTreeFrameChart!.data = this.osCallTreeSource;
            this.switchFlameChart();
            this.osCallTreeFilter!.icon = 'block';
            this.initFromAnalysis = false;
        });
        this.banTypeAndLidSelect();
    }

    setFilterType(selections: Array<unknown>, data: FilterByAnalysis): void {
        if (data.type === 'FD') {
            data.type = '1';
        } else if (data.type === 'THREAD') {
            data.type = '2';
        }
    }

    getDataByWorker(args: unknown[], handler: Function): void {
        this.loadingList.push(1);
        this.osCallTreeProgressEL!.loading = true; // @ts-ignore
        this.osCallTreeLoadingPage.style.visibility = 'visible';
        procedurePool.submitWithName(
            'logic0',
            'other-source-calltree-action',
            args,
            undefined,
            (callTreeActionResults: unknown): void => {
                handler(callTreeActionResults);
                this.loadingList.splice(0, 1);
                if (this.loadingList.length === 0) {
                    this.osCallTreeProgressEL!.loading = false; // @ts-ignore
                    this.osCallTreeLoadingPage.style.visibility = 'hidden';
                }
            }
        );
    }

    private switchFlameChart(flameChartData?: unknown): void {
        // 树状图
        let osCallTreePageTab = this.shadowRoot?.querySelector('#show_table');
        // 火焰图
        let osCallTreePageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
        if (!flameChartData || flameChartData.icon === 'block') {
            osCallTreePageChart?.setAttribute('class', 'show');
            osCallTreePageTab?.setAttribute('class', '');
            this.isChartShow = true;
            this.osCallTreeFilter!.disabledMining = true;
            this.showBottomMenu(this.needShowMenu);
            this.osCallTreeFrameChart?.calculateChartData(); // @ts-ignore
        } else if (flameChartData.icon === 'tree') {
            osCallTreePageChart?.setAttribute('class', '');
            osCallTreePageTab?.setAttribute('class', 'show');
            this.showBottomMenu(true);
            this.isChartShow = false;
            this.osCallTreeFilter!.disabledMining = false;
            this.osCallTreeFrameChart!.clearCanvas();
            this.osCallTreeTbl!.reMeauseHeight();
        }
    }

    //底部的筛选菜单
    showBottomMenu(isShow: boolean): void {
        if (isShow) {
            this.osCallTreeFilter?.showThird(true);
            this.osCallTreeFilter?.setAttribute('first', '');
            this.osCallTreeFilter?.setAttribute('second', '');
            this.osCallTreeFilter?.setAttribute('tree', '');
            this.osCallTreeFilter?.setAttribute('input', '');
            this.osCallTreeFilter?.setAttribute('inputLeftText', '');
        } else {
            this.osCallTreeFilter?.showThird(false);
            this.osCallTreeFilter?.removeAttribute('first');
            this.osCallTreeFilter?.removeAttribute('second');
            this.osCallTreeFilter?.removeAttribute('tree');
            this.osCallTreeFilter?.removeAttribute('input');
            this.osCallTreeFilter?.removeAttribute('inputLeftText');
        }
    }

    banTypeAndLidSelect(): void {
        this.currentOSCallTreeFilter!.firstSelect = '0';
        let secondSelect = this.shadowRoot
            ?.querySelector('#os-call-tree-filter')!
            .shadowRoot!.querySelector('#second-select');
        let thirdSelect = this.shadowRoot
            ?.querySelector('#os-call-tree-filter')!
            .shadowRoot!.querySelector('#third-select');
        thirdSelect?.setAttribute('disabled', '');
        secondSelect?.setAttribute('disabled', '');
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.osCallTreeTbl!.addEventListener('row-click', this.osCallTreeTblRowClickHandler);
        this.otherSourceTbr!.addEventListener('row-click', this.otherSourceTbrRowClickHandler);
        this.osCallTreeTbl!.addEventListener('column-click', this.osCallTreeTblColumnClickHandler);
        let filterHeight = 0;
        new ResizeObserver((entries: ResizeObserverEntry[]): void => {
            let osCallTreeTabFilter = this.shadowRoot!.querySelector('#os-call-tree-filter') as HTMLElement;
            if (osCallTreeTabFilter.clientHeight > 0) {
                filterHeight = osCallTreeTabFilter.clientHeight;
            }
            if (this.parentElement!.clientHeight > filterHeight) {
                osCallTreeTabFilter.style.display = 'flex';
            } else {
                osCallTreeTabFilter.style.display = 'none';
            }
            if (this.osCallTreeTbl!.style.visibility === 'hidden') {
                osCallTreeTabFilter.style.display = 'none';
            }
            if (this.parentElement?.clientHeight !== 0) {
                if (this.isChartShow) {
                    this.osCallTreeFrameChart?.updateCanvas(false, entries[0].contentRect.width);
                    this.osCallTreeFrameChart?.calculateChartData();
                }
                let headLineHeight = 0;
                if (this.headLine?.isShow) {
                    headLineHeight = this.headLine!.clientHeight;
                }
                if (this.osCallTreeTbl) {
                    // @ts-ignore
                    this.osCallTreeTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 35 - headLineHeight
                        }px`;
                }
                this.osCallTreeTbl?.reMeauseHeight();
                if (this.otherSourceTbr) {
                    // @ts-ignore
                    this.otherSourceTbr.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45 - 21 - headLineHeight
                        }px`;
                }
                this.otherSourceTbr?.reMeauseHeight(); // @ts-ignore
                this.osCallTreeLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
            }
        }).observe(this.parentElement!);
        this.parentElement!.onscroll = (): void => {
            this.osCallTreeFrameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
        };
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.osCallTreeTbl!.removeEventListener('row-click', this.osCallTreeTblRowClickHandler);
        this.otherSourceTbr!.removeEventListener('row-click', this.otherSourceTbrRowClickHandler);
        this.osCallTreeTbl!.removeEventListener('column-click', this.osCallTreeTblColumnClickHandler);
    }

    osCallTreeTblColumnClickHandler = (event: unknown): void => {
        // @ts-ignore
        this.sortKey = event.detail.key; // @ts-ignore
        this.sortType = event.detail.sort;
        this.setLTableData(this.osCallTreeSource, true); // @ts-ignore
        this.osCallTreeFrameChart!.data = this.osCallTreeSource;
    };

    otherSourceTbrRowClickHandler = (event: unknown): void => {
        // @ts-ignore
        let data = event.detail.data as FileMerageBean;
        this.osCallTreeTbl?.clearAllSelection(data); // @ts-ignore
        (data as unknown).isSelected = true;
        this.osCallTreeTbl!.scrollToData(data); // @ts-ignore
        if ((event.detail as unknown).callBack) {
            // @ts-ignore
            (event.detail as unknown).callBack(true);
        }
    };

    osCallTreeTblRowClickHandler = (event: unknown): void => {
        // @ts-ignore
        let osCallTreeData = event.detail.data as FileMerageBean;
        this.setRightTableData(osCallTreeData);
        osCallTreeData.isSelected = true;
        this.currentSelectedData = osCallTreeData;
        this.otherSourceTbr?.clearAllSelection(osCallTreeData);
        this.otherSourceTbr?.setCurrentSelection(osCallTreeData);
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
        this.getParentTree(this.osCallTreeSource, fileMerageBean, parents);
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
        this.otherSourceTbr!.dataSource = resultLength === 0 ? [] : resultValue;
    }

    getParentTree(
        osCallTreeSrc: Array<FileMerageBean>,
        osCallTreeTarget: FileMerageBean,
        parents: Array<FileMerageBean>
    ): boolean {
        for (let osCallTreeBean of osCallTreeSrc) {
            if (osCallTreeBean.id === osCallTreeTarget.id) {
                parents.push(osCallTreeBean);
                return true;
            } else {
                if (this.getParentTree(osCallTreeBean.children as Array<FileMerageBean>, osCallTreeTarget, parents)) {
                    parents.push(osCallTreeBean);
                    return true;
                }
            }
        }
        return false;
    }

    getChildTree(osCallTreeSrc: Array<FileMerageBean>, id: string, children: Array<FileMerageBean>): boolean {
        for (let osCallTreeBean of osCallTreeSrc) {
            if (osCallTreeBean.id === id && osCallTreeBean.children.length === 0) {
                children.push(osCallTreeBean);
                return true;
            } else {
                if (this.getChildTree(osCallTreeBean.children as Array<FileMerageBean>, id, children)) {
                    children.push(osCallTreeBean);
                    return true;
                }
            }
        }
        return false;
    }

    initHtml(): string {
        return TabPaneOSCallTreeHtml;
    }

}