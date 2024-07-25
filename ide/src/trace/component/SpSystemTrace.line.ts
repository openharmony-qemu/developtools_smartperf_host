/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use sp file except in compliance with the License.
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

import { JankStruct } from '../database/ui-worker/ProcedureWorkerJank';
import { SpSystemTrace } from './SpSystemTrace';
import { TraceRow } from './trace/base/TraceRow';
import { LineType, PairPoint, ns2xByTimeShaft } from '../database/ui-worker/ProcedureWorkerCommon';
import { TabPaneTaskFrames } from './trace/sheet/task/TabPaneTaskFrames';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { queryBySelectExecute } from '../database/sql/ProcessThread.sql';
import { queryTaskPoolOtherRelationData, queryTaskPoolRelationData } from '../database/sql/Func.sql';
import { queryBySelectAllocationOrReturn } from '../database/sql/SqlLite.sql';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';
import { Utils } from './trace/base/Utils';
import { TraceMode } from '../SpApplicationPublicFunc';
import { BaseStruct } from '../bean/BaseStruct';
import { getTimeString } from './trace/sheet/TabPaneCurrentSelection';

//@ts-ignore
function collectionHasJank(jankRow: unknown, collectList: TraceRow<unknown>[]): boolean {
  for (let item of collectList!) {
    //@ts-ignore
    if (item.rowId === jankRow.rowId && item.rowType === jankRow.rowType) {
      return false;
    }
  }
  return true;
}

function setPoint(
  x: number,
  y: number,
  offsetY: number,
  ns: number,
  rowEL: unknown,
  isRight: boolean,
  business: string
): PairPoint {
  return {
    x: x,
    y: y,
    offsetY: offsetY,
    ns: ns,
    rowEL: rowEL!,
    isRight: isRight,
    business: business,
  } as PairPoint;
}

function addPointHandle(
  sp: SpSystemTrace,
  sourceData: FuncStruct,
  sourceThreadRow: TraceRow<BaseStruct>,
  targetData: FuncStruct,
  targetThreadRow: TraceRow<BaseStruct>,
  lineType?: string
): void {
  let sourceParentRow: TraceRow<BaseStruct> | null | undefined;
  let targetParentRow: TraceRow<BaseStruct> | null | undefined;
  if (Utils.currentTraceMode === TraceMode.DISTRIBUTED) {
    sourceParentRow = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>(
      `trace-row[row-id='${sourceData.pid}-${sourceData.traceId}'][row-type='process'][folder]`
    );
    targetParentRow = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>(
      `trace-row[row-id='${targetData.pid}-${targetData.traceId}'][row-type='process'][folder]`
    );
  } else {
    sourceParentRow = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>(
      `trace-row[row-id='${sourceData.pid}'][row-type='process'][folder]`
    );
    targetParentRow = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>(
      `trace-row[row-id='${targetData.pid}'][row-type='process'][folder]`
    );
  }
  let [startY, startOffSetY, startRowEl, isThreadRow] =
    getPointModel(sp, sourceThreadRow, sourceParentRow, sourceData, 0.9);
  let [endY, endOffSetY, endRowEl] =
    getPointModel(sp, targetThreadRow, targetParentRow, targetData, 0.1);
  let startX = Math.floor(ns2xByTimeShaft(sourceData.ts || sourceData.startTs || 0, sp.timerShaftEL!));
  let endX = Math.floor(ns2xByTimeShaft(targetData.ts! || targetData.startTs!, sp.timerShaftEL!));
  const startPoint = setPoint(startX, startY, startOffSetY, sourceData.ts || sourceData.startTs || 0, startRowEl, true, 'distributed');
  const endPoint = setPoint(endX, endY, endOffSetY, targetData.ts! || targetData.startTs!, endRowEl, true, 'distributed');
  startPoint.rangeTime = `${getTimeString((targetData.ts || targetData.startTs! || 0) - (sourceData.ts || sourceData.startTs || 0))}`;
  if (startPoint && endPoint) {
    startPoint.lineType = endPoint.lineType = LineType.brokenLine;
    startPoint.lineColor = endPoint.lineColor = '#ff0000';
    sp.addPointPair(startPoint, endPoint, lineType);
  }
}

function getPointModel(
  sp: SpSystemTrace,
  threadRow: TraceRow<BaseStruct> | null | undefined,
  parentRow: TraceRow<BaseStruct> | null | undefined,
  dataStruct: FuncStruct,
  pointYHeight: number,
): [number, number, TraceRow<BaseStruct>, boolean] {
  let pointY: number = 0;
  let isThreadRow = false;
  let pointRowEl: TraceRow<BaseStruct> | null | undefined;
  let pointOffSetY: number = 0;
  if (threadRow) {
    pointY = threadRow?.translateY + 20 * (dataStruct.depth! + pointYHeight);
    pointRowEl = threadRow;
    pointOffSetY = 20 * (dataStruct.depth! + pointYHeight);
    isThreadRow = true;
  } else if (parentRow) {
    if (!parentRow.expansion) {
      pointY = parentRow?.translateY! + 4 * (dataStruct.depth! + 0.5);
      pointRowEl = parentRow!;
      pointOffSetY = 4 * (dataStruct.depth! + 0.5);
    }
  } else {
    pointRowEl = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>(
      `trace-row[row-id='trace-${dataStruct.traceId}'][row-type='trace-${dataStruct.traceId}'][folder]`
    );
    pointY = pointRowEl?.translateY! + 4 * (dataStruct.depth! + 0.5);
    pointOffSetY = 4 * (dataStruct.depth! + 0.5);
  }
  return [pointY, pointOffSetY, pointRowEl!, isThreadRow];
}

function selectJankApp(
  endParentRow: unknown,
  sp: SpSystemTrace,
  data: unknown,
  startRow: unknown,
  selectJankStruct: JankStruct,
  endRowStruct: unknown
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  //@ts-ignore
  let findJankEntry = endRowStruct!.dataListCache!.find(
    //@ts-ignore
    (dat: unknown) => `${dat.name}` === `${data.name}` && `${dat.pid}` === `${data.pid}`
  );
  let tts =
    findJankEntry.frameType === 'frameTime' ? selectJankStruct.ts! : selectJankStruct.ts! + selectJankStruct.dur!;
  let startParentRow: unknown;
  // startRow为子泳道，子泳道不存在，使用父泳道
  if (startRow) {
    startParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      //@ts-ignore
      `trace-row[row-type='process'][row-id='${startRow.rowParentId}'][folder]`
    );
  } else {
    startRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-type='process'][row-id='${selectJankStruct?.pid}'][folder]`
    );
  }
  //@ts-ignore
  let endY = endRowStruct!.translateY! + 20 * (findJankEntry!.depth! + 0.5);
  let endRowEl = endRowStruct;
  let endOffSetY = 20 * (findJankEntry!.depth! + 0.5);
  let expansionFlag = collectionHasJank(endRowStruct, collectList);
  //@ts-ignore
  if (!endParentRow.expansion && expansionFlag) {
    //@ts-ignore
    endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
    endRowEl = endParentRow;
    endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
  }
  //@ts-ignore
  let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
  let startRowEl = startRow;
  let startOffSetY = 20 * (selectJankStruct!.depth! + 0.5);
  expansionFlag = collectionHasJank(startRow, collectList);
  //@ts-ignore
  if (startParentRow && !startParentRow.expansion && expansionFlag) {
    //@ts-ignore
    startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
    startRowEl = startParentRow;
    startOffSetY = 10 * (selectJankStruct!.depth! + 0.5);
  }
  let startX = ns2xByTimeShaft(tts, sp.timerShaftEL!);
  let endX = ns2xByTimeShaft(findJankEntry.ts!, sp.timerShaftEL!);
  const startPoint = setPoint(startX, startY, startOffSetY, tts, startRowEl, selectJankStruct.ts === tts, 'janks');
  const endPoint = setPoint(endX, endY, endOffSetY, findJankEntry.ts!, endRowEl, true, 'janks');
  //@ts-ignore
  sp.addPointPair(startPoint, endPoint);
}

function findJankApp(
  endParentRow: unknown,
  sp: SpSystemTrace,
  data: unknown,
  startRow: unknown,
  selectJankStruct: JankStruct,
  endRowStruct: unknown
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  //@ts-ignore
  let findJankEntry = endRowStruct!.dataListCache!.find(
    //@ts-ignore
    (dat: unknown) => dat.name === data.name && dat.pid === data.pid
  );
  let tts = selectJankStruct.frameType === 'frameTime' ? findJankEntry.ts : findJankEntry.ts! + findJankEntry.dur!;
  //@ts-ignore
  let endY = endRowStruct!.translateY! + 20 * (findJankEntry!.depth! + 0.5);
  let endRowEl = endRowStruct;
  let endOffSetY = 20 * (findJankEntry!.depth! + 0.5);
  let expansionFlag = collectionHasJank(endRowStruct, collectList);
  //@ts-ignore
  if (!endParentRow.expansion && expansionFlag) {
    //@ts-ignore
    endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
    endRowEl = endParentRow;
    endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
  }
  //@ts-ignore
  let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
  let startRowEl = startRow;
  expansionFlag = collectionHasJank(startRow, collectList);
  let startOffsetY = 20 * (selectJankStruct!.depth! + 0.5);
  let startParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
    //@ts-ignore
    `trace-row[row-type='process'][row-id='${startRow.rowParentId}'][folder]`
  );
  if (startParentRow && !startParentRow.expansion && expansionFlag) {
    startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
    startRowEl = startParentRow;
    startOffsetY = 10 * (selectJankStruct!.depth! + 0.5);
  }
  let startX = ns2xByTimeShaft(selectJankStruct.ts!, sp.timerShaftEL!);
  let endX = ns2xByTimeShaft(tts, sp.timerShaftEL!);
  const startPoint = setPoint(startX, startY, startOffsetY, selectJankStruct.ts!, startRowEl, true, 'janks');
  const endPoint = setPoint(endX, endY, endOffSetY, tts, endRowEl, selectJankStruct.ts === tts, 'janks');
  //@ts-ignore
  sp.addPointPair(startPoint, endPoint);
}

function addPointLink(
  endParentRow: unknown,
  sp: SpSystemTrace,
  data: unknown,
  startRow: unknown,
  selectJankStruct: JankStruct,
  endRowStruct: unknown
): void {
  //@ts-ignore
  let findJankEntry = endRowStruct!.dataListCache!.find(
    //@ts-ignore
    (dat: unknown) => dat.name === data.name && dat.pid === data.pid
  );
  //连线规则：frametimeline的头----app的头，app的尾----renderservice的头
  let tts: number = 0;
  if (findJankEntry) {
    if (selectJankStruct.frameType === 'app') {
      selectJankApp(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    }
    if (findJankEntry.frameType === 'app') {
      //@ts-ignore
      findJankApp(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    }
    //@ts-ignore
    if (data.children.length >= 1) {
      let endP;
      //@ts-ignore
      if (data.children[0].frameType === 'frameTime') {
        //@ts-ignore
        endP = sp.shadowRoot?.querySelector<TraceRow<unknown>>(`trace-row[row-type='janks'][row-id='frameTime']`);
      } else {
        //@ts-ignore
        endP = sp.shadowRoot?.querySelector<TraceRow<unknown>>(
          //@ts-ignore
          `trace-row[row-type='process'][row-id='${data.children[0].pid}'][folder]`
        );
      }
      //@ts-ignore
      sp.drawJankLine(endP, findJankEntry, data.children[0]);
    }
  }
}

function getEndStruct(data: unknown, sp: SpSystemTrace): unknown {
  let endRowStruct: unknown;
  //@ts-ignore
  if (data.frameType === 'frameTime') {
    endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      "trace-row[row-id='actual frameTime'][row-type='janks']"
    );
  } else {
    endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      //@ts-ignore
      `trace-row[row-id='${data.type}-${data.pid}'][row-type='janks']`
    );
  }
  return endRowStruct;
}

function drawJankLineEndParent(
  endParentRow: unknown,
  sp: SpSystemTrace,
  data: unknown,
  startRow: unknown,
  selectJankStruct: JankStruct,
  isBinderClick: boolean = false
): void {
  if (isBinderClick) {
    //@ts-ignore
    endParentRow.expansion = true;
  }
  //终点的父泳道过滤出选中的Struct
  let endRowStruct = getEndStruct(data, sp);
  //泳道未展开的情况，查找endRowStruct
  if (!endRowStruct) {
    //@ts-ignore
    if (data.frameType === 'frameTime') {
      //@ts-ignore
      endParentRow.childrenList.forEach((item: TraceRow<JankStruct>) => {
        if (item.rowId === 'actual frameTime' && item.rowType === 'janks') {
          endRowStruct = item;
        }
      });
      //frameTime未展开
      if (!endRowStruct) {
        endParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>("trace-row[row-id='frameTime'][folder]");
        //@ts-ignore
        endParentRow?.childrenList?.forEach((item: TraceRow<JankStruct>): void => {
          if (item.rowId === 'actual frameTime' && item.rowType === 'janks') {
            endRowStruct = item;
          }
        });
      }
    } else {
      //@ts-ignore
      endParentRow.childrenList.forEach((item: TraceRow<JankStruct>) => {
        if (item.name.startsWith('Actual Timeline') && item.rowType === 'janks') {
          endRowStruct = item;
        }
      });
    }
  }
  if (endRowStruct) {
    //@ts-ignore
    if (endRowStruct.isComplete) {
      addPointLink(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    } else {
      //@ts-ignore
      endRowStruct.supplierFrame!().then((res: unknown) => {
        //@ts-ignore
        endRowStruct.dataListCache = res;
        //@ts-ignore
        endRowStruct.loadingFrame = false;
        addPointLink(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
      });
    }
  }
}

export function spSystemTraceDrawJankLine(
  sp: SpSystemTrace,
  endParentRow: unknown,
  selectJankStruct: JankStruct,
  data: unknown,
  isBinderClick: boolean = false
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  let startRow: unknown;
  if (!selectJankStruct) {
    return;
  }
  let selectRowId = 'actual frameTime';
  if (selectJankStruct.frameType === 'frameTime') {
    startRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${selectRowId}'][row-type='janks']`
    );
  } else {
    selectRowId = `${selectJankStruct.type}-${selectJankStruct.pid}`;
    startRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${selectRowId}'][row-type='janks']`
    );
  }
  if (!startRow) {
    for (let collectChart of collectList) {
      if (collectChart.rowId === selectRowId && collectChart.rowType === 'janks') {
        startRow = collectChart;
        break;
      }
    }
  }
  if (endParentRow) {
    drawJankLineEndParent(endParentRow, sp, data, startRow, selectJankStruct, isBinderClick);
  }
}

export function spSystemTraceDrawDistributedLine(
  sp: SpSystemTrace,
  sourceData: FuncStruct,
  targetData: FuncStruct,
  selectFuncStruct: FuncStruct,
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows() as TraceRow<BaseStruct>[];
  if (!selectFuncStruct) {
    return;
  }
  let sourceThreadRow;
  let targetThreadRow;
  let sourceRowId;
  let targetRowId;
  if (Utils.currentTraceMode === TraceMode.DISTRIBUTED) {
    sourceRowId = `${sourceData.tid}-${sourceData.traceId}`;
    targetRowId = `${targetData.tid}-${targetData.traceId}`;
    sourceThreadRow = sp.shadowRoot?.querySelector(
      `trace-row[row-id='${sourceRowId}'][row-type='func']`
    ) as TraceRow<BaseStruct>;
    targetThreadRow = sp.shadowRoot?.querySelector(
      `trace-row[row-id='${targetRowId}'][row-type='func']`
    ) as TraceRow<BaseStruct>;
  } else {
    sourceRowId = `${sourceData.tid}`;
    targetRowId = `${targetData.tid}`;
    sourceThreadRow = sp.shadowRoot?.querySelector(
      `trace-row[row-id='${sourceData.tid}'][row-type='func']`
    ) as TraceRow<BaseStruct>;
    targetThreadRow = sp.shadowRoot?.querySelector(
      `trace-row[row-id='${targetData.tid}'][row-type='func']`
    ) as TraceRow<BaseStruct>;
  }
  if (!sourceThreadRow || !targetThreadRow) {
    for (let collectChart of collectList) {
      if (
        !sourceThreadRow &&
        (Utils.currentTraceMode !== TraceMode.DISTRIBUTED || collectChart.traceId === sourceData.traceId) &&
        collectChart.rowId === sourceRowId &&
        collectChart.rowType === 'func'
      ) {
        sourceThreadRow = collectChart;
      }
      if (
        !targetThreadRow &&
        (Utils.currentTraceMode !== TraceMode.DISTRIBUTED || collectChart.traceId === targetData.traceId) &&
        collectChart.rowId === targetRowId &&
        collectChart.rowType === 'func'
      ) {
        targetThreadRow = collectChart;
      }
    }
  }
  addPointHandle(sp, sourceData, sourceThreadRow, targetData, targetThreadRow, 'distributedLine');
}

function taskPoolOtherRelationData(
  selectRow: unknown,
  sp: SpSystemTrace,
  //@ts-ignore
  row: TraceRow<unknown>,
  relationDataList: FuncStruct[],
  res: unknown
): void {
  sp.clearPointPair();
  //@ts-ignore
  selectRow!.fixedList = relationDataList;
  if (FuncStruct.selectFuncStruct === undefined || FuncStruct.selectFuncStruct === null) {
    return;
  }
  relationDataList.forEach((value) => {
    TabPaneTaskFrames.TaskArray.push(value);
    // allocation to execute
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    //@ts-ignore
    const selectRowY = selectRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const selectDur = FuncStruct.selectFuncStruct!.dur!;
    //@ts-ignore
    if (value.id === res[0].allocation_task_row) {
      sp.addPointPair(
        sp.makePoint(value.startTs!, 0, selectRowY, selectRow, offSetY, 'task', LineType.bezierCurve, true),
        sp.makePoint(selectStartTs, 0, row?.translateY!, row, selectY, 'task', LineType.bezierCurve, true)
      );
    } else {
      sp.addPointPair(
        sp.makePoint(selectStartTs, selectDur, row?.translateY!, row, selectY, 'task', LineType.bezierCurve, false),
        sp.makePoint(value.startTs!, value.dur!, selectRowY, selectRow, offSetY, 'task', LineType.bezierCurve, false)
      );
    }
  });
  sp.refreshCanvas(true);
}

function taskPoolRelationDataAllocation(
  executeRow: TraceRow<FuncStruct> | null | undefined,
  sp: SpSystemTrace,
  //@ts-ignore
  row: TraceRow<unknown>,
  relationDataList: FuncStruct[],
  res: unknown
): void {
  sp.clearPointPair();
  if (FuncStruct.selectFuncStruct === undefined || FuncStruct.selectFuncStruct === null) {
    return;
  }
  //@ts-ignore
  let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
  relationDataList.forEach((value) => {
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    const executeRowY = executeRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const executeY = (executeStruct.depth! + 0.5) * 20;
    TabPaneTaskFrames.TaskArray.push(value);
    //@ts-ignore
    if (value.id === res[0].execute_task_row) {
      sp.addPointPair(
        sp.makePoint(selectStartTs, 0, row?.translateY!, row, selectY, 'task', LineType.bezierCurve, true),
        sp.makePoint(value.startTs!, 0, executeRowY, executeRow, offSetY, 'task', LineType.bezierCurve, true)
      );
    } else {
      sp.addPointPair(
        sp.makePoint(
          executeStruct.startTs!,
          executeStruct.dur!,
          executeRowY,
          executeRow,
          executeY,
          'task',
          LineType.bezierCurve,
          false
        ),
        sp.makePoint(value.startTs!, value.dur!, row?.translateY!, row, offSetY, 'task', LineType.bezierCurve, false)
      );
    }
  });
}

function taskPoolRelationDataPerformTask(
  executeRow: TraceRow<FuncStruct> | null | undefined,
  sp: SpSystemTrace,
  //@ts-ignore
  row: TraceRow<unknown>,
  relationDataList: FuncStruct[],
  res: unknown
): void {
  sp.clearPointPair();
  if (FuncStruct.selectFuncStruct === undefined || FuncStruct.selectFuncStruct === null) {
    return;
  }
  //@ts-ignore
  let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
  relationDataList.forEach((value) => {
    const executeRowY = executeRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const executeY = (executeStruct.depth! + 0.5) * 20;
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    TabPaneTaskFrames.TaskArray.push(value);
    //@ts-ignore
    if (value.id === res[0].execute_task_row) {
      sp.addPointPair(
        sp.makePoint(
          selectStartTs,
          FuncStruct.selectFuncStruct!.dur!,
          row?.translateY!,
          row,
          selectY,
          'task',
          LineType.bezierCurve,
          false
        ),
        sp.makePoint(value.startTs!, value.dur!, executeRowY, executeRow, offSetY, 'task', LineType.bezierCurve, false)
      );
    } else {
      sp.addPointPair(
        sp.makePoint(executeStruct.startTs!, 0, executeRowY, executeRow, executeY, 'task', LineType.bezierCurve, true),
        sp.makePoint(value.startTs!, 0, row?.translateY!, row, offSetY, 'task', LineType.bezierCurve, true)
      );
    }
  });
  sp.refreshCanvas(true);
}

//@ts-ignore
function taskAllocationOrPerformTask(sp: SpSystemTrace, row: TraceRow<unknown>, executeID: string): void {
  TabPaneTaskFrames.IsShowConcurrency = false;
  sp.clearPointPair();
  queryBySelectAllocationOrReturn(executeID, FuncStruct.selectFuncStruct!.itid!).then((res) => {
    if (!FuncStruct.selectFuncStruct) {
      return;
    }
    if (FuncStruct.selectFuncStruct!.funName!.indexOf('H:Task Allocation:') >= 0 && res.length > 0) {
      let executeRow = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(
        `trace-row[row-id='${res[0].tid}'][row-type='func']`
      );
      if (!executeRow) {
        return;
      }
      let idList: number[] = [];
      let tidList: number[] = [];
      if (res[0].execute_task_row) {
        idList.push(res[0].execute_task_row);
        tidList.push(Number(res[0].tid));
      }
      if (res[0].return_task_row) {
        idList.push(res[0].return_task_row);
        tidList.push(Number(row.rowId));
      }
      queryTaskPoolRelationData(idList, tidList).then((relationDataList) => {
        taskPoolRelationDataAllocation(executeRow, sp, row, relationDataList, res);
      });
    } else if (FuncStruct.selectFuncStruct!.funName!.indexOf('H:Task PerformTask End:') >= 0) {
      let executeRow = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(
        `trace-row[row-id='${res[0].tid}'][row-type='func']`
      );
      TabPaneTaskFrames.TaskArray.push(FuncStruct.selectFuncStruct!);
      let idList: number[] = [];
      let tidList: number[] = [];
      if (res[0].execute_task_row) {
        idList.push(res[0].execute_task_row);
        tidList.push(Number(res[0].tid));
      }
      if (res[0].allocation_task_row) {
        idList.push(res[0].allocation_task_row);
        tidList.push(Number(row.rowId));
      }
      queryTaskPoolRelationData(idList, tidList).then((relationDataList) => {
        taskPoolRelationDataPerformTask(executeRow, sp, row, relationDataList, res);
      });
    }
  });
}

//@ts-ignore
export function spSystemTraceDrawTaskPollLine(sp: SpSystemTrace, row?: TraceRow<unknown>): void {
  if (FuncStruct.selectFuncStruct === undefined || FuncStruct.selectFuncStruct === null) {
    return;
  }
  let relationId = TabPaneTaskFrames.getRelationId(FuncStruct.selectFuncStruct!.funName!);
  TabPaneTaskFrames.TaskArray.push(FuncStruct.selectFuncStruct!);
  if (!row) {
    return;
  }
  if (FuncStruct.selectFuncStruct!.funName!.indexOf('H:Task Perform:') >= 0) {
    TabPaneTaskFrames.IsShowConcurrency = true;
    queryBySelectExecute(relationId, FuncStruct.selectFuncStruct!.itid!).then((res) => {
      if (res.length === 1) {
        let allocationRowId = res[0].tid;
        let selectRow = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(
          `trace-row[row-id='${allocationRowId}'][row-type='func']`
        );
        if (!selectRow) {
          let collectList = sp.favoriteChartListEL!.getAllCollectRows();
          for (let selectCollectRow of collectList) {
            if (selectCollectRow.rowId === allocationRowId.toString() && selectCollectRow.rowType === 'func') {
              // @ts-ignore
              selectRow = selectCollectRow;
              break;
            }
          }
        }
        let idList: number[] = [];
        if (res[0].allocation_task_row) {
          idList.push(res[0].allocation_task_row);
        }
        if (res[0].return_task_row) {
          idList.push(res[0].return_task_row);
        }
        queryTaskPoolOtherRelationData(idList, allocationRowId).then((relationDataList) => {
          taskPoolOtherRelationData(selectRow, sp, row, relationDataList, res);
        });
      }
    });
  } else {
    taskAllocationOrPerformTask(sp, row, relationId);
  }
}

function jankPoint(
  endRowStruct: unknown,
  selectThreadStruct: ThreadStruct,
  startRow: unknown,
  endParentRow: unknown,
  sp: SpSystemTrace
): void {
  //@ts-ignore
  let findJankEntry = endRowStruct!.fixedList[0];
  let ts: number = 0;
  if (findJankEntry) {
    ts = selectThreadStruct.startTime! + selectThreadStruct.dur! / 2;
    const [startY, startRowEl, startOffSetY] = sp.calculateStartY(startRow, selectThreadStruct.pid);
    const [endY, endRowEl, endOffSetY] = sp.calculateEndY(endParentRow, endRowStruct);
    sp.addPointPair(
      sp.makePoint(
        ns2xByTimeShaft(ts, sp.timerShaftEL!),
        ts,
        startY,
        startRowEl!,
        startOffSetY,
        'thread',
        LineType.straightLine,
        selectThreadStruct.startTime === ts
      ),
      sp.makePoint(
        ns2xByTimeShaft(findJankEntry.startTime!, sp.timerShaftEL!),
        findJankEntry.startTime!,
        endY,
        endRowEl,
        endOffSetY,
        'thread',
        LineType.straightLine,
        true
      )
    );
  }
}

function junkBinder(
  endRowStruct: unknown,
  selectFuncStruct: FuncStruct,
  startRow: unknown,
  endParentRow: unknown,
  sp: SpSystemTrace,
  data: unknown
): void {
  // @ts-ignore
  let findJankEntry = endRowStruct!.fixedList[0];
  let ts: number = 0;
  if (findJankEntry) {
    ts = selectFuncStruct.startTs! + selectFuncStruct.dur! / 2;
    const [startY, startRowEl, startOffSetY] = sp.calculateStartY(startRow, selectFuncStruct.pid, selectFuncStruct);
    const [endY, endRowEl, endOffSetY] = sp.calculateEndY(endParentRow, endRowStruct, data);
    sp.addPointPair(
      sp.makePoint(
        ns2xByTimeShaft(ts, sp.timerShaftEL!),
        ts,
        startY,
        startRowEl!,
        startOffSetY,
        'func',
        LineType.straightLine,
        selectFuncStruct.startTs === ts
      ),
      sp.makePoint(
        ns2xByTimeShaft(findJankEntry.startTs!, sp.timerShaftEL!),
        findJankEntry.startTs!,
        endY,
        endRowEl,
        endOffSetY,
        'func',
        LineType.straightLine,
        true
      )
    );
  }
}

export function spSystemTraceDrawThreadLine(
  sp: SpSystemTrace,
  endParentRow: unknown,
  selectThreadStruct: ThreadStruct | undefined,
  data: unknown
): void {
  let collectList = sp.favoriteChartListEL!.getCollectRows();
  if (!selectThreadStruct) {
    return;
  }
  let selectRowId = selectThreadStruct.tid;
  let startRow = sp.getStartRow(selectRowId, collectList);

  if (endParentRow) {
    //@ts-ignore
    endParentRow.expansion = true;
    let endRowStruct: unknown = sp.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
      //@ts-ignore
      `trace-row[row-id='${data.tid}'][row-type='thread']`
    );
    if (!endRowStruct) {
      //@ts-ignore
      endRowStruct = endParentRow.childrenList.find((item: TraceRow<ThreadStruct>) => {
        //@ts-ignore
        return item.rowId === `${data.tid}` && item.rowType === 'thread';
      });
    }
    if (endRowStruct) {
      //@ts-ignore
      if (endRowStruct.isComplete) {
        jankPoint(endRowStruct, selectThreadStruct, startRow, endParentRow, sp);
      }
    }
  }
}

export function spSystemTraceDrawFuncLine(
  sp: SpSystemTrace,
  endParentRow: unknown,
  selectFuncStruct: FuncStruct | undefined,
  data: unknown,
  binderTid: Number
): void {
  let collectList = sp.favoriteChartListEL!.getCollectRows();
  if (selectFuncStruct === undefined || selectFuncStruct === null) {
    return;
  }
  let selectRowId = selectFuncStruct?.tid ? selectFuncStruct?.tid : binderTid.toString();
  let startRow = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(`trace-row[row-id='${selectRowId}'][row-type='func']`);
  if (!startRow) {
    for (let collectChart of collectList) {
      if (collectChart.rowId === selectRowId.toString() && collectChart.rowType === 'func') {
        startRow = collectChart as TraceRow<FuncStruct>;
        break;
      }
    }
  }
  if (endParentRow) {
    // @ts-ignore
    endParentRow.expansion = true;
    let endRowStruct: unknown = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(
      // @ts-ignore
      `trace-row[row-id='${data.tid}'][row-type='func']`
    );
    if (!endRowStruct) {
      // @ts-ignore
      endRowStruct = endParentRow.childrenList.find((item: TraceRow<FuncStruct>) => {
        // @ts-ignore
        return item.rowId === `${data.tid}` && item.rowType === 'func';
      });
    }
    if (endRowStruct) {
      junkBinder(endRowStruct, selectFuncStruct, startRow, endParentRow, sp, data);
    }
  }
}
