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

import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { JankRender, JankStruct } from '../../database/ui-worker/ProcedureWorkerJank';
import { SpSystemTrace } from '../SpSystemTrace';
import { JanksStruct } from '../../bean/JanksStruct';
import { ns2xByTimeShaft, type PairPoint } from '../../database/ui-worker/ProcedureWorkerCommon';
import { FrameDynamicRender, FrameDynamicStruct } from '../../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameAnimationRender, FrameAnimationStruct } from '../../database/ui-worker/ProcedureWorkerFrameAnimation';
import { type BaseStruct } from '../../bean/BaseStruct';
import { FrameSpacingRender, FrameSpacingStruct } from '../../database/ui-worker/ProcedureWorkerFrameSpacing';
import { FlagsConfig, type Params } from '../SpFlags';
import { type AnimationRanges, type DeviceStruct } from '../../bean/FrameComponentBean';
import { type EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { TreeItemData } from '../../../base-ui/tree/LitTree';
import { QueryEnum } from '../../database/data-trafic/utils/QueryEnum';
import {
  frameAnimationSender,
  frameDynamicSender,
  frameSpacingSender,
} from '../../database/data-trafic/FrameDynamicEffectSender';
import { frameJanksSender } from '../../database/data-trafic/FrameJanksSender';
import {
  queryAnimationIdAndNameData,
  queryAnimationTimeRangeData,
  queryDynamicIdAndNameData,
  queryFrameApp,
  queryFrameTimeData,
  queryPhysicalData,
  querySourceTypen,
} from '../../database/sql/SqlLite.sql';
import { queryAllProcessNames } from '../../database/sql/ProcessThread.sql';

export class SpFrameTimeChart {
  private trace: SpSystemTrace;
  private flagConfig: Params | undefined;
  private pidToProcessNameMap: Map<number, string> = new Map();
  private idToProcessNameMap: Map<number, string> = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let frameTimeData = await queryFrameTimeData();
    this.pidToProcessNameMap.clear();
    this.idToProcessNameMap.clear();
    if (frameTimeData.length > 0) {
      let processNamesArray = await queryAllProcessNames();
      processNamesArray.forEach((it) => {
        //@ts-ignore
        this.pidToProcessNameMap.set(it.pid, it.name); //@ts-ignore
        this.idToProcessNameMap.set(it.id, it.name);
      });
      let frameTimeLineRow: TraceRow<JanksStruct> = await this.initFrameTimeLine();
      await this.initExpectedChart(frameTimeLineRow);
      await this.initActualChart(frameTimeLineRow);
    }
  }

  async initFrameTimeLine(): Promise<TraceRow<JanksStruct>> {
    let frameTimeLineRow: TraceRow<JanksStruct> = TraceRow.skeleton<JanksStruct>();
    frameTimeLineRow.rowId = 'frameTime';
    frameTimeLineRow.rowType = TraceRow.ROW_TYPE_JANK;
    frameTimeLineRow.rowParentId = '';
    frameTimeLineRow.style.width = '100%';
    frameTimeLineRow.style.height = '40px';
    frameTimeLineRow.folder = true;
    frameTimeLineRow.name = 'FrameTimeline';
    frameTimeLineRow.setAttribute('children', '');
    frameTimeLineRow.supplier = (): Promise<JanksStruct[]> =>
      new Promise((resolve) => {
        resolve([]);
      });
    frameTimeLineRow.addTemplateTypes('AppStartup');
    frameTimeLineRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    frameTimeLineRow.selectChangeHandler = this.trace.selectChangeHandler;
    frameTimeLineRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (frameTimeLineRow.currentContext) {
        context = frameTimeLineRow.currentContext;
      } else {
        context = frameTimeLineRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      frameTimeLineRow!.canvasSave(context);
      (renders.jank as JankRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'expected_frame_timeline_slice',
        },
        frameTimeLineRow!
      );
      frameTimeLineRow!.canvasRestore(context, this.trace);
    };
    this.trace.rowsEL?.appendChild(frameTimeLineRow);
    return frameTimeLineRow;
  }

  private expectedChartSupplierFrame(expectedTimeLineRow: TraceRow<JanksStruct>): void {
    expectedTimeLineRow.supplierFrame = async (): Promise<JanksStruct[]> => {
      const res = await frameJanksSender(QueryEnum.FrameExpectedData, expectedTimeLineRow);
      let maxDepth: number = 1;
      let unitHeight: number = 20;
      res.forEach((item) => {
        if (item.depth! >= maxDepth) {
          maxDepth = item.depth! + 1;
        }
        item.frameType = 'frameTime';
        item.cmdline = this.pidToProcessNameMap.get(item.pid!);
        item.rs_name = this.idToProcessNameMap.get(Number(item.rs_name)!);
      });
      if (expectedTimeLineRow && !expectedTimeLineRow.isComplete && res.length > 0) {
        let maxHeight: number = maxDepth * unitHeight;
        expectedTimeLineRow.style.height = `${maxHeight}px`;
        expectedTimeLineRow.setAttribute('height', `${maxHeight}`);
      }
      return res;
    };
  }

  async initExpectedChart(frameTimeLineRow: TraceRow<JanksStruct>): Promise<void> {
    let expectedTimeLineRow = TraceRow.skeleton<JanksStruct>();
    expectedTimeLineRow.rowId = 'expected frameTime';
    expectedTimeLineRow.rowType = TraceRow.ROW_TYPE_JANK;
    expectedTimeLineRow.rowHidden = !frameTimeLineRow.expansion;
    expectedTimeLineRow.rowParentId = 'frameTime';
    expectedTimeLineRow.style.width = '100%';
    expectedTimeLineRow.name = 'Expected Timeline';
    expectedTimeLineRow.addTemplateTypes('FrameTimeline');
    expectedTimeLineRow.setAttribute('children', '');
    this.expectedChartSupplierFrame(expectedTimeLineRow);
    expectedTimeLineRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    expectedTimeLineRow.selectChangeHandler = this.trace.selectChangeHandler;
    expectedTimeLineRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (expectedTimeLineRow.currentContext) {
        context = expectedTimeLineRow.currentContext;
      } else {
        context = expectedTimeLineRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      expectedTimeLineRow!.canvasSave(context);
      (renders.jank as JankRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'expected_frame_timeline_slice',
        },
        expectedTimeLineRow!
      );
      expectedTimeLineRow!.canvasRestore(context, this.trace);
    };
    frameTimeLineRow.addChildTraceRow(expectedTimeLineRow);
  }

  private actualChartSupplierFrame(row: TraceRow<JanksStruct>): void {
    row.supplierFrame = async (): Promise<JanksStruct[]> => {
      const res = await frameJanksSender(QueryEnum.FrameActualData, row);
      let maxDepth: number = 1;
      let unitHeight: number = 20;
      res.forEach((item) => {
        if (item.depth! >= maxDepth) {
          maxDepth = item.depth! + 1;
        }
        item.frameType = 'frameTime';
        item.cmdline = this.pidToProcessNameMap.get(item.pid!);
        item.rs_name = this.idToProcessNameMap.get(Number(item.rs_name)!);
        item.type = '0';
        if (item.pid !== item.tid) {
          item.name = `${item.name}-${item.tid}`;
        }
      });
      if (row && !row.isComplete && res.length > 0) {
        let maxHeight: number = maxDepth * unitHeight;
        row.style.height = `${maxHeight}px`;
        row.setAttribute('height', `${maxHeight}`);
      }
      return res;
    };
  }

  async initActualChart(frameTimeLineRow: TraceRow<JanksStruct>): Promise<void> {
    let actualTimeLineRow = TraceRow.skeleton<JanksStruct>();
    actualTimeLineRow.rowId = 'actual frameTime';
    actualTimeLineRow.rowType = TraceRow.ROW_TYPE_JANK;
    actualTimeLineRow.rowHidden = !frameTimeLineRow.expansion;
    actualTimeLineRow.rowParentId = 'frameTime';
    actualTimeLineRow.style.width = '100%';
    actualTimeLineRow.name = 'Actual Timeline';
    actualTimeLineRow.addTemplateTypes('FrameTimeline');
    actualTimeLineRow.setAttribute('children', '');
    this.actualChartSupplierFrame(actualTimeLineRow);
    actualTimeLineRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    actualTimeLineRow.selectChangeHandler = this.trace.selectChangeHandler;
    actualTimeLineRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (actualTimeLineRow.currentContext) {
        context = actualTimeLineRow.currentContext;
      } else {
        context = actualTimeLineRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      actualTimeLineRow!.canvasSave(context);
      (renders.jank as JankRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'expected_frame_timeline_slice',
        },
        actualTimeLineRow!
      );
      actualTimeLineRow!.canvasRestore(context, this.trace);
    };
    frameTimeLineRow.addChildTraceRow(actualTimeLineRow);
    let offsetYTimeOut: number = 0;
    frameTimeLineRow.addEventListener('expansion-change', (customEventInit: CustomEventInit) => {
      JankStruct.delJankLineFlag = false;
      if (offsetYTimeOut) {
        clearTimeout(offsetYTimeOut);
      }
      if (customEventInit.detail?.expansion) {
        offsetYTimeOut = this.frameExpandTimeOut(customEventInit, actualTimeLineRow);
      } else {
        offsetYTimeOut = this.frameNoExpandTimeOut(customEventInit, frameTimeLineRow);
      }
    });
  }

  async initAnimatedScenesChart(
    processRow: TraceRow<BaseStruct>,
    process: { pid: number | null; processName: string | null },
    firstRow: TraceRow<BaseStruct>,
    secondRow: TraceRow<BaseStruct>
  ): Promise<void> {
    let sourceTypeName = await querySourceTypen();
    this.flagConfig = FlagsConfig.getFlagsConfig('AnimationAnalysis');
    let appNameMap: Map<number, string> = new Map();
     // @ts-ignore
    if (this.flagConfig?.AnimationAnalysis === 'Enabled' && sourceTypeName && sourceTypeName[0].value !== 'txt-based-trace') {
      if (process.processName?.startsWith('render_service')) {
        let targetRowList = processRow.childrenList.filter(
          (childRow) => childRow.rowType === 'thread' && childRow.name.startsWith('render_service')
        );
        let nameArr: { name: string }[] = await queryFrameApp();
        if (nameArr && nameArr.length > 0) {
          let currentName = nameArr[0].name;
          let frameChart = await this.initFrameChart(processRow, nameArr);
          if (firstRow !== null) {
            processRow.addChildTraceRowBefore(frameChart, firstRow);
          } else if (secondRow !== null) {
            processRow.addChildTraceRowBefore(frameChart, secondRow);
          } else {
            // @ts-ignore
            processRow.addChildTraceRowBefore(frameChart, targetRowList[0]);
          }
          let appNameList = await queryDynamicIdAndNameData();
          appNameList.forEach((item) => {
            appNameMap.set(item.id, item.appName);
          });
          let animationRanges = await this.initAnimationChart(processRow);
          await this.initDynamicCurveChart(appNameMap, frameChart, currentName, animationRanges);
          await this.initFrameSpacing(appNameMap, frameChart, currentName, animationRanges);
        }
      }
    }
  }

  private async initFrameChart(
    processRow: TraceRow<BaseStruct>,
    nameArr: { name: string }[]
  ): Promise<TraceRow<BaseStruct>> {
    let frameChart: TraceRow<BaseStruct> = TraceRow.skeleton<BaseStruct>();
    let labelName = frameChart.shadowRoot?.querySelector('.name') as HTMLLabelElement;
    labelName.style.marginRight = '77px';
    this.addSystemConfigButton(frameChart, nameArr, 'model-name', true);
    frameChart.rowId = 'frame';
    frameChart.rowType = TraceRow.ROW_TYPE_FRAME;
    frameChart.rowHidden = !processRow.expansion;
    frameChart.rowParentId = processRow.rowId;
    frameChart.style.width = '100%';
    frameChart.style.height = '40px';
    frameChart.folder = true;
    frameChart.name = nameArr[0].name;
    frameChart.setAttribute('children', '');
    frameChart.supplier = (): Promise<BaseStruct[]> =>
      new Promise((resolve) => {
        resolve([]);
      });
    frameChart.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    frameChart.selectChangeHandler = this.trace.selectChangeHandler;
    frameChart.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D = frameChart!.collect
        ? this.trace.canvasFavoritePanelCtx!
        : this.trace.canvasPanelCtx!;
      frameChart!.canvasSave(context);
      (renders.empty as EmptyRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'frame',
        },
        frameChart!
      );
      frameChart!.canvasRestore(context, this.trace);
    };
    this.trace.rowsEL?.appendChild(frameChart);
    return frameChart;
  }

  private animationChartSupplierFrame(
    row: TraceRow<FrameAnimationStruct>,
    animationIdNameMap: Map<number, string>,
    animationIdInfoMap: Map<number, string>
  ): void {
    const unitIndex: number = 1;
    const unitHeight: number = 20;
    row.supplierFrame = async (): Promise<FrameAnimationStruct[]> => {
      const result = await frameAnimationSender(row);
      let maxDepth = 0;
      result.forEach((item) => {
        if (`${item.status}` === '1') {
          item.status = 'Completion delay';
        } else if (`${item.status}` === '0') {
          item.status = 'Response delay';
        }
        if (item.depth > maxDepth) {
          maxDepth = item.depth;
        }
        if (animationIdNameMap.has(item.animationId!)) {
          item.name = animationIdNameMap.get(item.animationId!);
          item.frameInfo = item.status === 'Completion delay' ? animationIdInfoMap.get(item.animationId!) : '0';
        }
      });
      let maxHeight: number = (maxDepth + unitIndex) * unitHeight;
      row.style.height = `${maxHeight}px`;
      row.setAttribute('height', `${maxHeight}`);
      return result;
    };
  }
  private animationThreadHandler(row: TraceRow<FrameAnimationStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D = row!.collect
        ? this.trace.canvasFavoritePanelCtx!
        : this.trace.canvasPanelCtx!;
      row!.canvasSave(context);
      (renders.frameAnimation as FrameAnimationRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'frameAnimation',
        },
        row!
      );
      row!.canvasRestore(context, this.trace);
    };
  }

  async initAnimationChart(processRow: TraceRow<BaseStruct>): Promise<AnimationRanges[]> {
    let animationRanges: AnimationRanges[] = [];
    let frameAnimationRow = TraceRow.skeleton<FrameAnimationStruct>();

    frameAnimationRow.rowId = 'Animation';
    frameAnimationRow.rowType = TraceRow.ROW_TYPE_FRAME_ANIMATION;
    frameAnimationRow.rowHidden = !processRow.expansion;
    frameAnimationRow.rowParentId = processRow.rowId;
    frameAnimationRow.style.width = '100%';
    frameAnimationRow.name = 'Animation';
    frameAnimationRow.addTemplateTypes('AnimationEffect');
    frameAnimationRow.setAttribute('children', '');
    let timeRangeData = await queryAnimationTimeRangeData();
    timeRangeData.forEach((rangeTime) => {
      if (rangeTime.status === 'Completion delay') {
        animationRanges.push({
          start: rangeTime.startTs,
          end: rangeTime.endTs,
        });
      }
    });
    let animationIdNameMap: Map<number, string> = new Map<number, string>();
    let animationIdInfoMap: Map<number, string> = new Map<number, string>();
    let animationNameData = await queryAnimationIdAndNameData();
    animationNameData.forEach((item) => {
      animationIdNameMap.set(item.id, item.name);
      animationIdInfoMap.set(item.id, item.info);
    });
    this.animationChartSupplierFrame(frameAnimationRow, animationIdNameMap, animationIdInfoMap);
    frameAnimationRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    frameAnimationRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.animationThreadHandler(frameAnimationRow);
    processRow.addChildTraceRowSpecifyLocation(frameAnimationRow, 0);
    return animationRanges;
  }

  private dynamicCurveChartThreadHandler(
    dynamicCurveRow: TraceRow<FrameDynamicStruct>,
    animationRanges: AnimationRanges[]
  ): void {
    dynamicCurveRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D = dynamicCurveRow!.collect
        ? this.trace.canvasFavoritePanelCtx!
        : this.trace.canvasPanelCtx!;
      dynamicCurveRow!.canvasSave(context);
      (renders.frameDynamicCurve as FrameDynamicRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'dynamicEffectCurve',
          animationRanges: animationRanges,
        },
        dynamicCurveRow!
      );
      dynamicCurveRow!.canvasRestore(context, this.trace);
    };
  }

  async initDynamicCurveChart(
    appNameMap: Map<number, string>,
    frameChart: TraceRow<BaseStruct>,
    name: string,
    animationRanges: AnimationRanges[]
  ): Promise<void> {
    let systemConfigList: {
      name: string;
    }[] = [{ name: 'x' }, { name: 'y' }, { name: 'width' }, { name: 'height' }, { name: 'alpha' }];
    let dynamicCurveRow: TraceRow<FrameDynamicStruct> = TraceRow.skeleton<FrameDynamicStruct>();
    this.addSystemConfigButton(dynamicCurveRow, systemConfigList, 'model-type');
    dynamicCurveRow.setAttribute('model-type', systemConfigList[0].name);
    dynamicCurveRow.rowId = 'animation-Effect-Curve';
    dynamicCurveRow.rowType = TraceRow.ROW_TYPE_FRAME_DYNAMIC;
    dynamicCurveRow.rowHidden = !frameChart.expansion;
    dynamicCurveRow.rowParentId = frameChart.rowId;
    dynamicCurveRow.style.width = '100%';
    dynamicCurveRow.style.height = '40px';
    dynamicCurveRow.style.height = '100px';
    let labelName = dynamicCurveRow.shadowRoot?.querySelector('.name') as HTMLLabelElement;
    labelName.style.marginRight = '77px';
    dynamicCurveRow.name = 'Animation Effect Curve';
    dynamicCurveRow.addTemplateTypes('AnimationEffect');
    dynamicCurveRow.setAttribute('height', '100px');
    dynamicCurveRow.setAttribute('children', '');
    dynamicCurveRow.setAttribute('model-type', systemConfigList[0].name);
    dynamicCurveRow.setAttribute('model-name', name);
    dynamicCurveRow.supplierFrame = async (): Promise<FrameDynamicStruct[]> => {
      const result = await frameDynamicSender(dynamicCurveRow);
      result.forEach((dataItem) => {
        if (appNameMap.has(dataItem.id!)) {
          dataItem.appName = appNameMap.get(dataItem.id!);
        }
      });
      return result;
    };
    dynamicCurveRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.dynamicCurveChartThreadHandler(dynamicCurveRow, animationRanges);
    frameChart.addChildTraceRow(dynamicCurveRow);
  }

  private FrameSpacingThreadHandler(
    frameSpacingRow: TraceRow<FrameSpacingStruct>,
    animationRanges: AnimationRanges[],
    rate: number
  ): void {
    frameSpacingRow.onThreadHandler = (useCache: boolean): void => {
      let context = frameSpacingRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      frameSpacingRow!.canvasSave(context);
      (renders.frameSpacing as FrameSpacingRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'frame_spacing_slice',
          frameRate: rate,
          animationRanges: animationRanges,
        },
        frameSpacingRow!
      );
      frameSpacingRow!.canvasRestore(context, this.trace);
    };
  }

  async initFrameSpacing(
    appNameMap: Map<number, string>,
    frameChart: TraceRow<BaseStruct>,
    name: string,
    animationRanges: AnimationRanges[]
  ): Promise<void> {
    let deviceStructArray = await queryPhysicalData();
    let deviceStruct: DeviceStruct = deviceStructArray[0];
    let frameSpacingRow = TraceRow.skeleton<FrameSpacingStruct>();
    frameSpacingRow.rowId = 'frame spacing';
    frameSpacingRow.rowType = TraceRow.ROW_TYPE_FRAME_SPACING;
    frameSpacingRow.rowHidden = !frameChart.expansion;
    frameSpacingRow.rowParentId = frameChart.rowId;
    frameSpacingRow.style.width = '100%';
    frameSpacingRow.style.height = '140px';
    frameSpacingRow.name = 'Frame spacing';
    frameSpacingRow.addTemplateTypes('AnimationEffect');
    frameSpacingRow.setAttribute('height', '140');
    frameSpacingRow.setAttribute('children', '');
    frameSpacingRow.setAttribute('model-name', name);
    let physicalConfigWidth = Number(this.flagConfig!.physicalWidth);
    let physicalConfigHeight = Number(this.flagConfig!.physicalHeight);
    let physicalWidth = physicalConfigWidth !== 0 ? physicalConfigWidth : deviceStruct.physicalWidth;
    let physicalHeight = physicalConfigHeight !== 0 ? physicalConfigHeight : deviceStruct.physicalHeight;
    frameSpacingRow.supplierFrame = async (): Promise<FrameSpacingStruct[]> => {
      const result = await frameSpacingSender(physicalWidth, physicalHeight, frameSpacingRow);
      result.forEach((dataItem) => {
        if (appNameMap.has(dataItem.id!)) {
          dataItem.nameId = appNameMap.get(dataItem.id!);
        }
        dataItem.physicalWidth = physicalWidth;
        dataItem.physicalHeight = physicalHeight;
      });
      return result;
    };
    frameSpacingRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    frameSpacingRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.FrameSpacingThreadHandler(frameSpacingRow, animationRanges, deviceStruct.physicalFrameRate);
    frameChart.addChildTraceRow(frameSpacingRow);
  }

  addSystemConfigButton(
    systemTraceRow: TraceRow<BaseStruct>,
    systemConfigList: { name: string }[],
    attributeKey: string,
    allowChangeName: boolean = false
  ): void {
    let componentList: Array<TreeItemData> = [];
    for (let index = 0; index < systemConfigList.length; index++) {
      let componentName = systemConfigList[index].name;
      componentList.push({
        key: `${componentName}`,
        title: `${componentName}`,
        checked: index === 0,
      });
    }
    systemTraceRow.addRowSettingPop();
    systemTraceRow.rowSetting = 'enable';
    systemTraceRow.rowSettingPopoverDirection = 'bottomLeft';
    systemTraceRow.rowSettingList = componentList;
    systemTraceRow.onRowSettingChangeHandler = (value: string[]): void => {
      if (allowChangeName) {
        systemTraceRow.name = value[0];
      }
      systemTraceRow.setAttribute(attributeKey, `${value[0]}`);
      systemTraceRow.childrenList.forEach((row): void => {
        row.setAttribute(attributeKey, `${value[0]}`);
      });
      this.trace.refreshCanvas(false);
    };
  }

  private frameNoExpandTimeOut(event: CustomEventInit<unknown>, frameTimeLineRow: TraceRow<JanksStruct>): number {
    if (JankStruct!.selectJankStruct) {
      JankStruct.selectJankStructList?.push(<JankStruct>JankStruct!.selectJankStruct);
    }
    let topPadding: number = 195;
    let halfNumber: number = 2;
    let offsetYTime: number = 300;
    let refreshTime: number = 360;
    let offsetYTimeOut: number = window.setTimeout(() => {
      this.trace.linkNodes.forEach((linkNode: PairPoint[]) => {
        if (linkNode[0].rowEL.collect) {
          linkNode[0].rowEL.translateY = linkNode[0].rowEL.getBoundingClientRect().top - topPadding;
        } else {
          linkNode[0].rowEL.translateY = linkNode[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
        }
        linkNode[0].y = linkNode[0].rowEL!.translateY! + linkNode[0].offsetY;
        if (linkNode[1].rowEL.collect) {
          linkNode[1].rowEL.translateY = linkNode[1].rowEL.getBoundingClientRect().top - topPadding;
        } else {
          linkNode[1].rowEL.translateY = linkNode[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
        }
        linkNode[1].y = linkNode[1].rowEL!.translateY! + linkNode[1].offsetY; //@ts-ignore
        if (linkNode[0].rowEL.rowParentId === event.detail?.rowId) {
          if (!linkNode[0].rowEL.collect) {
            linkNode[0].x = ns2xByTimeShaft(linkNode[0].ns, this.trace.timerShaftEL!);
            linkNode[0].y = frameTimeLineRow!.translateY! + linkNode[0].offsetY / halfNumber;
            linkNode[0].offsetY = linkNode[0].offsetY / halfNumber; //@ts-ignore
            linkNode[0].rowEL = frameTimeLineRow;
          } //@ts-ignore
        } else if (linkNode[1].rowEL.rowParentId === event.detail?.rowId) {
          if (!linkNode[1].rowEL.collect) {
            linkNode[1].x = ns2xByTimeShaft(linkNode[1].ns, this.trace.timerShaftEL!);
            linkNode[1].y = frameTimeLineRow!.translateY! + linkNode[1].offsetY / halfNumber;
            linkNode[1].offsetY = linkNode[1].offsetY / halfNumber; //@ts-ignore
            linkNode[1].rowEL = frameTimeLineRow!;
          }
        }
      });
    }, offsetYTime);
    let refreshTimeOut: number = window.setTimeout(() => {
      this.trace.refreshCanvas(true);
      clearTimeout(refreshTimeOut);
    }, refreshTime);
    return offsetYTimeOut;
  }

  private frameExpandTimeOut(
    event: CustomEventInit<{ expansion: boolean; rowType: string; rowId: string; rowParentId: string }>,
    actualTimeLineRow: TraceRow<JanksStruct>
  ): number {
    let topPadding: number = 195;
    let halfNumber: number = 2;
    let offsetYTime: number = 300;
    let refreshTime: number = 360;
    let offsetYTimeOut: number = window.setTimeout(() => {
      this.trace.linkNodes.forEach((linkFrameNode: PairPoint[]) => {
        JankStruct.selectJankStructList?.forEach((dat: JankStruct) => {
          if (event.detail?.rowId === dat.pid) {
            JankStruct.selectJankStruct = dat;
            JankStruct.hoverJankStruct = dat;
          }
        });
        if (linkFrameNode[0].rowEL.collect) {
          linkFrameNode[0].rowEL.translateY = linkFrameNode[0].rowEL.getBoundingClientRect().top - topPadding;
        } else {
          linkFrameNode[0].rowEL.translateY = linkFrameNode[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
        }
        linkFrameNode[0].y = linkFrameNode[0].rowEL!.translateY! + linkFrameNode[0].offsetY;
        if (linkFrameNode[1].rowEL.collect) {
          linkFrameNode[1].rowEL.translateY = linkFrameNode[1].rowEL.getBoundingClientRect().top - topPadding;
        } else {
          linkFrameNode[1].rowEL.translateY = linkFrameNode[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
        }
        linkFrameNode[1].y = linkFrameNode[1].rowEL!.translateY! + linkFrameNode[1].offsetY;
        if (linkFrameNode[0].rowEL.rowId === event.detail?.rowId) {
          linkFrameNode[0].x = ns2xByTimeShaft(linkFrameNode[0].ns, this.trace.timerShaftEL!);
          linkFrameNode[0].y = actualTimeLineRow!.translateY! + linkFrameNode[0].offsetY * halfNumber;
          linkFrameNode[0].offsetY = linkFrameNode[0].offsetY * halfNumber;
          //@ts-ignore
          linkFrameNode[0].rowEL = actualTimeLineRow;
        } else if (linkFrameNode[1].rowEL.rowId === event.detail?.rowId) {
          linkFrameNode[1].x = ns2xByTimeShaft(linkFrameNode[1].ns, this.trace.timerShaftEL!);
          linkFrameNode[1].y = actualTimeLineRow!.translateY! + linkFrameNode[1].offsetY * halfNumber;
          linkFrameNode[1].offsetY = linkFrameNode[1].offsetY * halfNumber;
          //@ts-ignore
          linkFrameNode[1].rowEL = actualTimeLineRow!;
        }
      });
    }, offsetYTime);
    let refreshTimeOut: number = window.setTimeout(() => {
      this.trace.refreshCanvas(true);
      clearTimeout(refreshTimeOut);
    }, refreshTime);
    return offsetYTimeOut;
  }
}
