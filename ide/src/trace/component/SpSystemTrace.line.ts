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
import { LineType, ns2xByTimeShaft } from '../database/ui-worker/ProcedureWorkerCommon';
import { TabPaneTaskFrames } from './trace/sheet/task/TabPaneTaskFrames';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { queryBySelectExecute } from '../database/sql/ProcessThread.sql';
import { queryTaskPoolOtherRelationData, queryTaskPoolRelationData } from '../database/sql/Func.sql';
import { queryBySelectAllocationOrReturn } from '../database/sql/SqlLite.sql';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';

function collectionHasJank(jankRow: any, collectList: TraceRow<any>[]): boolean {
  for (let item of collectList!) {
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
  rowEL: any,
  isRight: boolean,
  business: string
): any {
  return {
    x: x,
    y: y,
    offsetY: offsetY,
    ns: ns,
    rowEL: rowEL!,
    isRight: isRight,
    business: business,
  };
}

function selectJankApp(
  endParentRow: any,
  sp: SpSystemTrace,
  data: any,
  startRow: any,
  selectJankStruct: JankStruct,
  endRowStruct: any
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  let findJankEntry = endRowStruct!.dataListCache!.find((dat: any) => dat.name == data.name && dat.pid == data.pid);
  let tts =
    findJankEntry.frame_type == 'frameTime' ? selectJankStruct.ts! : selectJankStruct.ts! + selectJankStruct.dur!;
  let startParentRow: any;
  // startRow为子泳道，子泳道不存在，使用父泳道
  if (startRow) {
    startParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${startRow.rowParentId}'][folder]`
    );
  } else {
    startRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${selectJankStruct?.pid}'][folder]`
    );
  }
  let endY = endRowStruct!.translateY! + 20 * (findJankEntry!.depth! + 0.5);
  let endRowEl = endRowStruct;
  let endOffSetY = 20 * (findJankEntry!.depth! + 0.5);
  let expansionFlag = collectionHasJank(endRowStruct, collectList);
  if (!endParentRow.expansion && expansionFlag) {
    endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
    endRowEl = endParentRow;
    endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
  }
  let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
  let startRowEl = startRow;
  let startOffSetY = 20 * (selectJankStruct!.depth! + 0.5);
  expansionFlag = collectionHasJank(startRow, collectList);
  if (startParentRow && !startParentRow.expansion && expansionFlag) {
    startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
    startRowEl = startParentRow;
    startOffSetY = 10 * (selectJankStruct!.depth! + 0.5);
  }
  let startX = ns2xByTimeShaft(tts, sp.timerShaftEL!);
  let endX = ns2xByTimeShaft(findJankEntry.ts!, sp.timerShaftEL!);
  const startPoint = setPoint(startX, startY, startOffSetY, tts, startRowEl, selectJankStruct.ts == tts, 'janks');
  const endPoint = setPoint(endX, endY, endOffSetY, findJankEntry.ts!, endRowEl, true, 'janks');
  sp.addPointPair(startPoint, endPoint);
}

function findJankApp(
  endParentRow: any,
  sp: SpSystemTrace,
  data: any,
  startRow: any,
  selectJankStruct: JankStruct,
  endRowStruct: any
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  let findJankEntry = endRowStruct!.dataListCache!.find((dat: any) => dat.name == data.name && dat.pid == data.pid);
  let tts = selectJankStruct.frame_type == 'frameTime' ? findJankEntry.ts : findJankEntry.ts! + findJankEntry.dur!;
  let endY = endRowStruct!.translateY! + 20 * (findJankEntry!.depth! + 0.5);
  let endRowEl = endRowStruct;
  let endOffSetY = 20 * (findJankEntry!.depth! + 0.5);
  let expansionFlag = collectionHasJank(endRowStruct, collectList);
  if (!endParentRow.expansion && expansionFlag) {
    endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
    endRowEl = endParentRow;
    endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
  }
  let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
  let startRowEl = startRow;
  expansionFlag = collectionHasJank(startRow, collectList);
  let startOffsetY = 20 * (selectJankStruct!.depth! + 0.5);
  let startParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
    `trace-row[row-id='${startRow.rowParentId}'][folder]`
  );
  if (startParentRow && !startParentRow.expansion && expansionFlag) {
    startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
    startRowEl = startParentRow;
    startOffsetY = 10 * (selectJankStruct!.depth! + 0.5);
  }
  let startX = ns2xByTimeShaft(selectJankStruct.ts!, sp.timerShaftEL!);
  let endX = ns2xByTimeShaft(tts, sp.timerShaftEL!);
  const startPoint = setPoint(startX, startY, startOffsetY, selectJankStruct.ts!, startRowEl, true, 'janks');
  const endPoint = setPoint(endX, endY, endOffSetY, tts, endRowEl, selectJankStruct.ts == tts, 'janks');
  sp.addPointPair(startPoint, endPoint);
}

function addPointLink(
  endParentRow: any,
  sp: SpSystemTrace,
  data: any,
  startRow: any,
  selectJankStruct: JankStruct,
  endRowStruct: any
): void {
  let findJankEntry = endRowStruct!.dataListCache!.find((dat: any) => dat.name == data.name && dat.pid == data.pid);
  //连线规则：frametimeline的头----app的头，app的尾----renderservice的头
  let tts: number = 0;
  if (findJankEntry) {
    if (selectJankStruct.frame_type == 'app') {
      selectJankApp(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    }
    if (findJankEntry.frame_type == 'app') {
      findJankApp(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    }
    if (data.children.length >= 1) {
      let endP;
      if (data.children[0].frame_type == 'frameTime') {
        endP = sp.shadowRoot?.querySelector<TraceRow<any>>("trace-row[row-id='frameTime']");
      } else {
        endP = sp.shadowRoot?.querySelector<TraceRow<any>>(`trace-row[row-id='${data.children[0].pid}'][folder]`);
      }
      sp.drawJankLine(endP, findJankEntry, data.children[0]);
    }
  }
}

function getEndStruct(data: any, sp: SpSystemTrace): any {
  let endRowStruct: any;
  if (data.frame_type == 'frameTime') {
    endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      "trace-row[row-id='actual frameTime'][row-type='janks']"
    );
  } else {
    endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${data.type}-${data.pid}'][row-type='janks']`
    );
  }
  return endRowStruct;
}

function drawJankLineEndParent(
  endParentRow: any,
  sp: SpSystemTrace,
  data: any,
  startRow: any,
  selectJankStruct: JankStruct
): void {
  endParentRow.expansion = true;
  //终点的父泳道过滤出选中的Struct
  let endRowStruct = getEndStruct(data, sp);
  //泳道未展开的情况，查找endRowStruct
  if (!endRowStruct) {
    if (data.frame_type == 'frameTime') {
      endParentRow.childrenList.forEach((item: TraceRow<JankStruct>) => {
        if (item.rowId === 'actual frameTime' && item.rowType === 'janks') {
          endRowStruct = item;
        }
      });
      //frameTime未展开
      if (!endRowStruct) {
        endParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>("trace-row[row-id='frameTime'][folder]");
        endParentRow?.childrenList?.forEach((item: TraceRow<JankStruct>) => {
          if (item.rowId === 'actual frameTime' && item.rowType === 'janks') {
            endRowStruct = item;
          }
        });
      }
    } else {
      endParentRow.childrenList.forEach((item: TraceRow<JankStruct>) => {
        if (item.name.startsWith('Actual Timeline') && item.rowType === 'janks') {
          endRowStruct = item;
        }
      });
    }
  }
  if (endRowStruct) {
    if (endRowStruct.isComplete) {
      addPointLink(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
    } else {
      endRowStruct.supplierFrame!().then((res: any) => {
        endRowStruct.dataListCache = res;
        endRowStruct.loadingFrame = false;
        addPointLink(endParentRow, sp, data, startRow, selectJankStruct, endRowStruct);
      });
    }
  }
}

export function spSystemTraceDrawJankLine(
  sp: SpSystemTrace,
  endParentRow: any,
  selectJankStruct: JankStruct,
  data: any
): void {
  let collectList = sp.favoriteChartListEL!.getAllCollectRows();
  let startRow: any;
  if (selectJankStruct == undefined || selectJankStruct == null) {
    return;
  }
  let selectRowId = 'actual frameTime';
  if (selectJankStruct.frame_type == 'frameTime') {
    startRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
      `trace-row[row-id='${selectRowId}'][row-type='janks']`
    );
  } else {
    selectRowId = selectJankStruct?.type + '-' + selectJankStruct?.pid;
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
    drawJankLineEndParent(endParentRow, sp, data, startRow, selectJankStruct);
  }
}

function taskPoolOtherRelationData(
  selectRow: any,
  sp: SpSystemTrace,
  row: TraceRow<any>,
  relationDataList: FuncStruct[],
  res: any
): void {
  selectRow!.fixedList = relationDataList;
  relationDataList.forEach((value) => {
    TabPaneTaskFrames.TaskArray.push(value);
    // allocation to execute
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    const selectRowY = selectRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const selectDur = FuncStruct.selectFuncStruct!.dur!;

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
  row: TraceRow<any>,
  relationDataList: FuncStruct[],
  res: any
): void {
  let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
  relationDataList.forEach((value) => {
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    const executeRowY = executeRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const executeY = (executeStruct.depth! + 0.5) * 20;
    TabPaneTaskFrames.TaskArray.push(value);
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
  row: TraceRow<any>,
  relationDataList: FuncStruct[],
  res: any
): void {
  let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
  relationDataList.forEach((value) => {
    const executeRowY = executeRow?.translateY!;
    const selectStartTs = FuncStruct.selectFuncStruct!.startTs!;
    const executeY = (executeStruct.depth! + 0.5) * 20;
    const selectY = (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20;
    const offSetY = (value.depth! + 0.5) * 20;
    TabPaneTaskFrames.TaskArray.push(value);
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

function taskAllocationOrPerformTask(sp: SpSystemTrace, row: TraceRow<any>, executeID: string): void {
  TabPaneTaskFrames.IsShowConcurrency = false;
  queryBySelectAllocationOrReturn(executeID, FuncStruct.selectFuncStruct!.itid!).then((res) => {
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

export function spSystemTraceDrawTaskPollLine(sp: SpSystemTrace, row?: TraceRow<any>): void {
  let executeID = TabPaneTaskFrames.getExecuteId(FuncStruct.selectFuncStruct!.funName!);
  TabPaneTaskFrames.TaskArray.push(FuncStruct.selectFuncStruct!);
  if (!row) {
    return;
  }
  if (FuncStruct.selectFuncStruct!.funName!.indexOf('H:Task Perform:') >= 0) {
    TabPaneTaskFrames.IsShowConcurrency = true;
    queryBySelectExecute(executeID, FuncStruct.selectFuncStruct!.itid!).then((res) => {
      if (res.length === 1) {
        let allocationRowId = res[0].tid;
        let selectRow = sp.shadowRoot?.querySelector<TraceRow<FuncStruct>>(
          `trace-row[row-id='${allocationRowId}'][row-type='func']`
        );
        if (!selectRow) {
          let collectList = sp.favoriteChartListEL!.getAllCollectRows();
          for (let selectCollectRow of collectList) {
            if (selectCollectRow.rowId === allocationRowId.toString() && selectCollectRow.rowType === 'func') {
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
    taskAllocationOrPerformTask(sp, row, executeID);
  }
}

function jankPoint(
  endRowStruct: any,
  data: any,
  sp: SpSystemTrace,
  selectThreadStruct: ThreadStruct,
  startRow: any,
  endParentRow: any
): void {
  if (endRowStruct) {
    let findJankEntry = endRowStruct!.dataListCache!.find(
      (dat: any) => dat.startTime == data.startTime && dat.dur! > 0
    );
    let ts: number = 0;
    if (findJankEntry) {
      ts = selectThreadStruct.startTime! + selectThreadStruct.dur! / 2;
      const [startY, startRowEl, startOffSetY] = sp.calculateStartY(startRow, selectThreadStruct);
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
          selectThreadStruct.startTime == ts
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
      sp.refreshCanvas(true);
    }
  }
}

export function spSystemTraceDrawThreadLine(
  sp: SpSystemTrace,
  endParentRow: any,
  selectThreadStruct: ThreadStruct | undefined,
  data: any
): void {
  const collectList = sp.favoriteChartListEL!.getCollectRows();
  if (!selectThreadStruct) {
    return;
  }
  const selectRowId = selectThreadStruct?.tid;
  let startRow = sp.getStartRow(selectRowId, collectList);
  if (!endParentRow) {
    return;
  }
  let endRowStruct: any = sp.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
    `trace-row[row-id='${data.tid}'][row-type='thread']`
  );
  if (!endRowStruct) {
    endRowStruct = endParentRow.childrenList.find((item: TraceRow<ThreadStruct>) => {
      return item.rowId === `${data.tid}` && item.rowType === 'thread';
    });
  }
  jankPoint(endParentRow, data, sp, selectThreadStruct, startRow, endParentRow);
}
