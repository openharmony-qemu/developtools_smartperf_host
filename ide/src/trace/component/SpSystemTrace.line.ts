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

export function SpSystemTraceDrawJankLine(
  sp: SpSystemTrace,
  endParentRow: any,
  selectJankStruct: JankStruct,
  data: any
) {
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

  function collectionHasJank(jankRow: any): boolean {
    for (let item of collectList!) {
      if (item.rowId === jankRow.rowId && item.rowType === jankRow.rowType) {
        return false;
      }
    }
    return true;
  }
  if (endParentRow) {
    endParentRow.expansion = true;
    //终点的父泳道过滤出选中的Struct
    let endRowStruct: any;
    //泳道展开的情况，查找endRowStruct
    if (data.frame_type == 'frameTime') {
      endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
        "trace-row[row-id='actual frameTime'][row-type='janks']"
      );
    } else {
      endRowStruct = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
        `trace-row[row-id='${data.type}-${data.pid}'][row-type='janks']`
      );
    }
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
    let addPointLink = () => {
      let findJankEntry = endRowStruct!.dataListCache!.find((dat: any) => dat.name == data.name && dat.pid == data.pid);
      //连线规则：frametimeline的头----app的头，app的尾----renderservice的头
      let tts: number = 0;
      if (findJankEntry) {
        if (selectJankStruct.frame_type == 'app') {
          tts =
            findJankEntry.frame_type == 'frameTime'
              ? selectJankStruct.ts!
              : selectJankStruct.ts! + selectJankStruct.dur!;
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
          let expansionFlag = collectionHasJank(endRowStruct);
          if (!endParentRow.expansion && expansionFlag) {
            endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
            endRowEl = endParentRow;
            endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
          }
          let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
          let startRowEl = startRow;
          let startOffSetY = 20 * (selectJankStruct!.depth! + 0.5);
          expansionFlag = collectionHasJank(startRow);
          if (startParentRow && !startParentRow.expansion && expansionFlag) {
            startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
            startRowEl = startParentRow;
            startOffSetY = 10 * (selectJankStruct!.depth! + 0.5);
          }
          sp.addPointPair(
            {
              x: ns2xByTimeShaft(tts, sp.timerShaftEL!),
              y: startY,
              offsetY: startOffSetY,
              ns: tts,
              rowEL: startRowEl!,
              isRight: selectJankStruct.ts == tts,
              business: 'janks',
            },
            {
              x: ns2xByTimeShaft(findJankEntry.ts!, sp.timerShaftEL!),
              y: endY,
              offsetY: endOffSetY,
              ns: findJankEntry.ts!,
              rowEL: endRowEl,
              isRight: true,
              business: 'janks',
            }
          );
        }
        if (findJankEntry.frame_type == 'app') {
          tts = selectJankStruct.frame_type == 'frameTime' ? findJankEntry.ts : findJankEntry.ts! + findJankEntry.dur!;
          let endY = endRowStruct!.translateY! + 20 * (findJankEntry!.depth! + 0.5);
          let endRowEl = endRowStruct;
          let endOffSetY = 20 * (findJankEntry!.depth! + 0.5);
          let expansionFlag = collectionHasJank(endRowStruct);
          if (!endParentRow.expansion && expansionFlag) {
            endY = endParentRow!.translateY! + 10 * (findJankEntry!.depth! + 0.5);
            endRowEl = endParentRow;
            endOffSetY = 10 * (findJankEntry!.depth! + 0.5);
          }
          let startY = startRow!.translateY! + 20 * (selectJankStruct!.depth! + 0.5);
          let startRowEl = startRow;
          expansionFlag = collectionHasJank(startRow);
          let startOffsetY = 20 * (selectJankStruct!.depth! + 0.5);
          let startParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
            `trace-row[row-id='${startRow.rowParentId}'][folder]`
          );
          if (startParentRow && !startParentRow.expansion && expansionFlag) {
            startY = startParentRow!.translateY! + 10 * (selectJankStruct!.depth! + 0.5);
            startRowEl = startParentRow;
            startOffsetY = 10 * (selectJankStruct!.depth! + 0.5);
          }
          sp.addPointPair(
            {
              x: ns2xByTimeShaft(selectJankStruct.ts!, sp.timerShaftEL!),
              y: startY,
              offsetY: startOffsetY,
              ns: selectJankStruct.ts!,
              rowEL: startRowEl!,
              isRight: true,
              business: 'janks',
            },
            {
              x: ns2xByTimeShaft(tts, sp.timerShaftEL!),
              y: endY,
              offsetY: endOffSetY,
              ns: tts,
              rowEL: endRowEl!,
              isRight: selectJankStruct.ts == tts,
              business: 'janks',
            }
          );
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
    };
    if (endRowStruct) {
      if (endRowStruct.isComplete) {
        addPointLink();
      } else {
        endRowStruct.supplierFrame!().then((res: any) => {
          endRowStruct.dataListCache = res;
          endRowStruct.loadingFrame = false;
          addPointLink();
        });
      }
    }
  }
}

export function SpSystemTraceDrawTaskPollLine(sp: SpSystemTrace, row?: TraceRow<any>) {
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
          selectRow!.fixedList = relationDataList;
          selectRow!.fixedList.forEach((value) => {
            TabPaneTaskFrames.TaskArray.push(value);
            // allocation to execute
            if (value.id === res[0].allocation_task_row) {
              sp.addPointPair(
                sp.makePoint(
                  value.startTs!,
                  0,
                  selectRow?.translateY!,
                  selectRow,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                ),
                sp.makePoint(
                  FuncStruct.selectFuncStruct!.startTs!,
                  0,
                  row?.translateY!,
                  row,
                  (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                )
              );
            } else {
              sp.addPointPair(
                sp.makePoint(
                  FuncStruct.selectFuncStruct!.startTs!,
                  FuncStruct.selectFuncStruct!.dur!,
                  row?.translateY!,
                  row,
                  (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                ),
                sp.makePoint(
                  value.startTs!,
                  value.dur!,
                  selectRow?.translateY!,
                  selectRow,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                )
              );
            }
          });
          sp.refreshCanvas(true);
        });
      }
    });
  } else {
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
          let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
          relationDataList.forEach((value) => {
            TabPaneTaskFrames.TaskArray.push(value);
            if (value.id === res[0].execute_task_row) {
              sp.addPointPair(
                sp.makePoint(
                  FuncStruct.selectFuncStruct!.startTs!,
                  0,
                  row?.translateY!,
                  row,
                  (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                ),
                sp.makePoint(
                  value.startTs!,
                  0,
                  executeRow?.translateY!,
                  executeRow,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                )
              );
            } else {
              sp.addPointPair(
                sp.makePoint(
                  executeStruct.startTs!,
                  executeStruct.dur!,
                  executeRow?.translateY!,
                  executeRow,
                  (executeStruct.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                ),
                sp.makePoint(
                  value.startTs!,
                  value.dur!,
                  row?.translateY!,
                  row,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                )
              );
            }
          });
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
          let executeStruct = relationDataList.filter((item) => item.id === res[0].execute_task_row)[0];
          relationDataList.forEach((value) => {
            TabPaneTaskFrames.TaskArray.push(value);
            if (value.id === res[0].execute_task_row) {
              sp.addPointPair(
                sp.makePoint(
                  FuncStruct.selectFuncStruct!.startTs!,
                  FuncStruct.selectFuncStruct!.dur!,
                  row?.translateY!,
                  row,
                  (FuncStruct.selectFuncStruct!.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                ),
                sp.makePoint(
                  value.startTs!,
                  value.dur!,
                  executeRow?.translateY!,
                  executeRow,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  false
                )
              );
            } else {
              sp.addPointPair(
                sp.makePoint(
                  executeStruct.startTs!,
                  0,
                  executeRow?.translateY!,
                  executeRow,
                  (executeStruct.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                ),
                sp.makePoint(
                  value.startTs!,
                  0,
                  row?.translateY!,
                  row,
                  (value.depth! + 0.5) * 20,
                  'task',
                  LineType.bezierCurve,
                  true
                )
              );
            }
          });
          sp.refreshCanvas(true);
        });
      }
    });
  }
}

export function SpSystemTraceDrawThreadLine(
  sp: SpSystemTrace,
  endParentRow: any,
  selectThreadStruct: ThreadStruct | undefined,
  data: any
) {
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
