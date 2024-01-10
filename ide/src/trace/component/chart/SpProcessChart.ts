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
import { Utils } from '../trace/base/Utils';
import { info } from '../../../log/Log';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { ProcessRender, ProcessStruct } from '../../database/ui-worker/ProcedureWorkerProcess';
import { ThreadRender, ThreadStruct } from '../../database/ui-worker/ProcedureWorkerThread';
import { FuncRender, FuncStruct } from '../../database/ui-worker/ProcedureWorkerFunc';
import { MemRender, ProcessMemStruct } from '../../database/ui-worker/ProcedureWorkerMem';
import { FolderSupplier, FolderThreadHandler, SpChartManager } from './SpChartManager';
import { JankRender, JankStruct } from '../../database/ui-worker/ProcedureWorkerJank';
import { ns2xByTimeShaft } from '../../database/ui-worker/ProcedureWorkerCommon';
import { AppStartupRender, AppStartupStruct } from '../../database/ui-worker/ProcedureWorkerAppStartup';
import { SoRender, SoStruct } from '../../database/ui-worker/ProcedureWorkerSoInit';
import { FlagsConfig } from '../SpFlags';
import { processDataSender } from '../../database/data-trafic/process/ProcessDataSender';
import { threadDataSender } from '../../database/data-trafic/process/ThreadDataSender';
import { funcDataSender } from '../../database/data-trafic/process/FuncDataSender';
import { processMemDataSender } from '../../database/data-trafic/process/ProcessMemDataSender';
import { processStartupDataSender } from '../../database/data-trafic/process/ProcessStartupDataSender';
import { processSoInitDataSender } from '../../database/data-trafic/process/ProcessSoInitDataSender';
import { processExpectedDataSender } from '../../database/data-trafic/process/ProcessExpectedDataSender';
import { processActualDataSender } from '../../database/data-trafic/process/ProcessActualDataSender';
import { processDeliverInputEventDataSender } from '../../database/data-trafic/process/ProcessDeliverInputEventDataSender';
import { getMaxDepthByTid, queryAllFuncNames, queryProcessAsyncFunc } from '../../database/sql/Func.sql';
import { queryMemFilterIdMaxValue } from '../../database/sql/Memory.sql';
import { queryAllSoInitNames, queryAllSrcSlices, queryEventCountMap } from '../../database/sql/SqlLite.sql';
import {
  queryAllProcessNames,
  queryAllThreadName,
  queryProcess,
  queryProcessByTable,
  queryProcessContentCount,
  queryProcessMem,
  queryProcessSoMaxDepth,
  queryProcessThreads,
  queryProcessThreadsByTable,
  queryStartupPidArray,
  queryRsProcess,
  queryTaskPoolProcessIds,
} from '../../database/sql/ProcessThread.sql';
import { queryAllJankProcess } from '../../database/sql/Janks.sql';

export class SpProcessChart {
  private readonly trace: SpSystemTrace;
  private processAsyncFuncMap: any = {};
  private processAsyncFuncArray: any[] = [];
  private eventCountMap: any;
  private processThreads: Array<ThreadStruct> = [];
  private processMem: Array<any> = [];
  private processThreadCountMap: Map<number, number> = new Map();
  private processThreadDataCountMap: Map<number, number> = new Map();
  private processFuncDataCountMap: Map<number, number> = new Map();
  private processMemDataCountMap: Map<number, number> = new Map();
  private threadFuncMaxDepthMap: Map<string, number> = new Map();
  private startupProcessArr: { pid: number }[] = [];
  private processSoMaxDepth: { pid: number; maxDepth: number }[] = [];
  private funcNameMap: Map<number, string> = new Map();
  private filterIdMaxValue: Map<number, number> = new Map();
  private soInitNameMap: Map<number, string> = new Map();
  private processNameMap: Map<number, string> = new Map();
  private threadNameMap: Map<number, string> = new Map();
  private processSrcSliceMap: Map<number, string> = new Map();
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initAsyncFuncData = async (): Promise<void> => {
    let asyncFuncList: any[] = await queryProcessAsyncFunc();
    info('AsyncFuncData Count is: ', asyncFuncList!.length);
    this.processAsyncFuncArray = asyncFuncList;
    this.processAsyncFuncMap = Utils.groupBy(asyncFuncList, 'pid');
  };

  initDeliverInputEvent = async (): Promise<void> => {
    let row = TraceRow.skeleton();
    row.setAttribute('disabled-check', '');
    row.rowId = 'DeliverInputEvent';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = 'DeliverInputEvent';
    row.supplier = FolderSupplier();
    row.onThreadHandler = FolderThreadHandler(row, this.trace);

    let asyncFuncGroup = Utils.groupBy(
      this.processAsyncFuncArray.filter((it) => it.funName === 'deliverInputEvent'),
      'tid'
    );
    if (Reflect.ownKeys(asyncFuncGroup).length > 0) {
      this.trace.rowsEL?.appendChild(row);
    }
    Reflect.ownKeys(asyncFuncGroup).map((key: any) => {
      let asyncFuncGroups: Array<any> = asyncFuncGroup[key];
      if (asyncFuncGroups.length > 0) {
        let funcRow = TraceRow.skeleton<FuncStruct>();
        funcRow.rowId = `${asyncFuncGroups[0].funName}-${key}`;
        funcRow.asyncFuncName = asyncFuncGroups[0].funName;
        funcRow.asyncFuncNamePID = key;
        funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
        funcRow.enableCollapseChart(); //允许折叠泳道图
        funcRow.rowParentId = `${row.rowId}`;
        funcRow.rowHidden = !row.expansion;
        funcRow.style.width = '100%';
        funcRow.name = `${asyncFuncGroups[0].funName} ${key}`;
        funcRow.setAttribute('children', '');
        funcRow.supplierFrame = () => {
          return processDeliverInputEventDataSender(key, funcRow!).then((res: Array<any>) => {
            let isIntersect = (left: any, right: any): boolean =>
              Math.max(left.startTs + left.dur, right.startTs + right.dur) - Math.min(left.startTs, right.startTs) <
              left.dur + right.dur;
            let depths: any = [];
            let createDepth = (currentDepth: number, index: number): void => {
              if (depths[currentDepth] == undefined || !isIntersect(depths[currentDepth], res[index])) {
                res[index].depth = currentDepth;
                depths[currentDepth] = res[index];
              } else {
                createDepth(++currentDepth, index);
              }
            };
            res.forEach((it, i) => {
              res[i].funName = this.funcNameMap.get(res[i].id!);
              res[i].threadName = this.threadNameMap.get(res[i].tid!);
              if (it.dur == -1) {
                it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
                it.flag = 'Did not end';
              }
              createDepth(0, i);
            });
            if (funcRow && !funcRow.isComplete) {
              let max = Math.max(...asyncFuncGroups.map((it) => it.depth || 0)) + 1;
              let maxHeight = max * 20;
              funcRow.style.height = `${maxHeight}px`;
              funcRow.setAttribute('height', `${maxHeight}`);
            }
            return res;
          });
        };
        funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        funcRow.selectChangeHandler = this.trace.selectChangeHandler;
        funcRow.onThreadHandler = (useCache): void => {
          let context: CanvasRenderingContext2D;
          if (funcRow.currentContext) {
            context = funcRow.currentContext;
          } else {
            context = funcRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          funcRow.canvasSave(context);
          (renders['func'] as FuncRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: `func-${asyncFuncGroups[0].funName}-${key}`,
            },
            funcRow
          );
          funcRow.canvasRestore(context, this.trace);
        };
        row.addChildTraceRow(funcRow);
      }
    });
  };

  async init(): Promise<void> {
    let maxValues = await queryMemFilterIdMaxValue();
    maxValues.forEach((it) => {
      this.filterIdMaxValue.set(it.filterId, it.maxValue);
    });
    let funcNamesArray = await queryAllFuncNames();
    funcNamesArray.forEach((it) => {
      this.funcNameMap.set(it.id, it.name);
    });
    let soInitNamesArray = await queryAllSoInitNames();
    soInitNamesArray.forEach((it) => {
      this.soInitNameMap.set(it.id, it.name);
    });
    let processNamesArray = await queryAllProcessNames();
    processNamesArray.forEach((it) => {
      this.processNameMap.set(it.pid, it.name);
    });
    let renderServiceProcess = await queryRsProcess();
    let processSrcSliceArray = await queryAllSrcSlices();
    processSrcSliceArray.forEach((it) => {
      this.processSrcSliceMap.set(it.id, it.src);
    });
    let threadNameArray = await queryAllThreadName();
    threadNameArray.forEach((it) => {
      this.threadNameMap.set(it.tid, it.name);
    });
    let threadFuncMaxDepthArray = await getMaxDepthByTid();
    info('Gets the maximum tier per thread , tid and maxDepth');
    threadFuncMaxDepthArray.forEach((it) => {
      this.threadFuncMaxDepthMap.set(`${it.ipid}-${it.tid}`, it.maxDepth);
    });
    info('convert tid and maxDepth array to map');
    let pidCountArray = await queryProcessContentCount();
    info('fetch per process  pid,switch_count,thread_count,slice_count,mem_count');
    pidCountArray.forEach((it) => {
      this.processThreadDataCountMap.set(it.pid, it.switch_count);
      this.processThreadCountMap.set(it.pid, it.thread_count);
      this.processFuncDataCountMap.set(it.pid, it.slice_count);
      this.processMemDataCountMap.set(it.pid, it.mem_count);
    });
    let queryProcessThreadResult = await queryProcessThreads();
    let queryProcessThreadsByTableResult = await queryProcessThreadsByTable();
    this.processMem = await queryProcessMem();
    let loadAppStartup: boolean = FlagsConfig.getFlagsConfigEnableStatus('AppStartup');
    if (loadAppStartup) {
      this.startupProcessArr = await queryStartupPidArray();
      this.processSoMaxDepth = await queryProcessSoMaxDepth();
    }
    info('The amount of initialized process memory data is : ', this.processMem!.length);
    let eventCountList: Array<any> = await queryEventCountMap();
    this.eventCountMap = eventCountList.reduce((pre, current) => {
      pre[`${current.eventName}`] = current.count;
      return pre;
    }, {});
    this.processThreads = Utils.removeDuplicates(queryProcessThreadResult, queryProcessThreadsByTableResult, 'tid');
    info('The amount of initialized process threads data is : ', this.processThreads!.length);
    if (
      this.eventCountMap['print'] == 0 &&
      this.eventCountMap['tracing_mark_write'] == 0 &&
      this.eventCountMap['sched_switch'] == 0
    ) {
      return;
    }
    let time = new Date().getTime();
    let processes = await queryProcess();
    let processFromTable = await queryProcessByTable();
    let processList = Utils.removeDuplicates(processes, processFromTable, 'pid');
    let allJankProcessData = await queryAllJankProcess();
    let allJankProcess: Array<number> = [];
    if (allJankProcessData.length > 0) {
      allJankProcessData.forEach((name, index) => {
        allJankProcess.push(name.pid!);
      });
    }
    let allTaskPoolPid: Array<{ pid: number }> = [];
    if (FlagsConfig.getFlagsConfigEnableStatus('TaskPool')) {
      allTaskPoolPid = await queryTaskPoolProcessIds();
    }
    info('ProcessList Data size is: ', processList!.length);
    for (let i = 0; i < processList.length; i++) {
      const it = processList[i];
      if (
        (this.processThreadDataCountMap.get(it.pid) || 0) == 0 &&
        (this.processThreadCountMap.get(it.pid) || 0) == 0 &&
        (this.processFuncDataCountMap.get(it.pid) || 0) == 0 &&
        (this.processMemDataCountMap.get(it.pid) || 0) == 0
      ) {
        continue;
      }
      let processRow = TraceRow.skeleton<ProcessStruct>();
      processRow.rowId = `${it.pid}`;
      processRow.index = i;
      processRow.rowType = TraceRow.ROW_TYPE_PROCESS;
      processRow.rowParentId = '';
      processRow.style.height = '40px';
      processRow.folder = true;
      if (
        SpChartManager.APP_STARTUP_PID_ARR.find((pid) => pid === it.pid) !== undefined ||
        it.processName === 'render_service'
      ) {
        processRow.addTemplateTypes('AppStartup');
      }
      if (allTaskPoolPid.find((process) => process.pid === it.pid) !== undefined) {
        processRow.addTemplateTypes('TaskPool');
      }
      processRow.name = `${it.processName || 'Process'} ${it.pid}`;
      processRow.supplierFrame = (): Promise<Array<any>> => {
        return processDataSender(it.pid || -1, processRow);
      };
      processRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      processRow.selectChangeHandler = this.trace.selectChangeHandler;
      processRow.onThreadHandler = (useCache): void => {
        processRow.canvasSave(this.trace.canvasPanelCtx!);
        if (processRow.expansion) {
          this.trace.canvasPanelCtx?.clearRect(0, 0, processRow.frame.width, processRow.frame.height);
        } else {
          (renders['process'] as ProcessRender).renderMainThread(
            {
              context: this.trace.canvasPanelCtx,
              pid: it.pid,
              useCache: useCache,
              type: `process ${processRow.index} ${it.processName}`,
            },
            processRow
          );
        }
        processRow.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
      };
      this.trace.rowsEL?.appendChild(processRow);

      /**
       * App Startup row
       */
      let startupRow: TraceRow<AppStartupStruct> | undefined = undefined;
      let soRow: TraceRow<SoStruct> | undefined = undefined;
      if (loadAppStartup) {
        if (this.startupProcessArr.find((sp) => sp.pid === it.pid)) {
          startupRow = this.addStartUpRow(processRow);
        }
        let maxSoDepth = this.processSoMaxDepth.find((md) => md.pid === it.pid);
        if (maxSoDepth) {
          soRow = this.addSoInitRow(processRow, maxSoDepth.maxDepth);
        }
      }

      /**
       * Janks Frames
       */
      let actualRow: TraceRow<JankStruct> | null = null;
      let expectedRow: TraceRow<JankStruct> | null = null;
      if (allJankProcess.indexOf(it.pid) > -1) {
        expectedRow = TraceRow.skeleton<JankStruct>();
        expectedRow.asyncFuncName = it.processName;
        expectedRow.asyncFuncNamePID = it.pid;
        expectedRow.rowType = TraceRow.ROW_TYPE_JANK;
        expectedRow.rowParentId = `${it.pid}`;
        expectedRow.rowHidden = !processRow.expansion;
        expectedRow.style.width = '100%';
        expectedRow.name = 'Expected Timeline';
        expectedRow.addTemplateTypes('FrameTimeline');
        expectedRow.setAttribute('children', '');
        expectedRow.supplierFrame = () => {
          return processExpectedDataSender(it.pid, expectedRow!).then((res) => {
            let maxDepth: number = 1;
            let unitHeight: number = 20;
            for (let j = 0; j < res.length; j++) {
              let expectedItem = res[j];
              if (expectedItem.depth! >= maxDepth) {
                maxDepth = expectedItem.depth! + 1;
              }
              expectedItem.cmdline = this.processNameMap.get(res[j].pid!);
              if (res[j].pid! === renderServiceProcess[0].pid) {
                expectedItem.cmdline = 'render_service';
                expectedItem.frame_type = expectedItem.cmdline;
              } else {
                expectedItem.frame_type = 'app';
              }
            }
            if (expectedRow && !expectedRow.isComplete && res.length > 0) {
              let maxHeight: number = maxDepth * unitHeight;
              expectedRow.style.height = `${maxHeight}px`;
              expectedRow.setAttribute('height', `${maxHeight}`);
              if (res[0]) {
                let timeLineType = res[0].type;
                expectedRow.rowId = `${timeLineType}-${it.pid}`;
                expectedRow.setAttribute('frame_type', res[0].frame_type || '');
              }
            }
            return res;
          });
        };
        expectedRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        expectedRow.selectChangeHandler = this.trace.selectChangeHandler;
        expectedRow.onThreadHandler = (useCache): void => {
          let context = expectedRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          expectedRow!.canvasSave(context);
          (renders['jank'] as JankRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: 'expected_frame_timeline_slice',
            },
            expectedRow!
          );
          expectedRow!.canvasRestore(context, this.trace);
        };
        processRow.addChildTraceRow(expectedRow);
        actualRow = TraceRow.skeleton<JankStruct>();
        actualRow.rowType = TraceRow.ROW_TYPE_JANK;
        actualRow.rowParentId = `${it.pid}`;
        actualRow.rowHidden = !processRow.expansion;
        actualRow.style.width = '100%';
        actualRow.name = 'Actual Timeline';
        actualRow.addTemplateTypes('FrameTimeline');
        actualRow.setAttribute('children', '');
        actualRow.supplierFrame = () => {
          return processActualDataSender(it.pid, actualRow!).then((res) => {
            let maxDepth: number = 1;
            let unitHeight: number = 20;
            for (let j = 0; j < res.length; j++) {
              let actualItem = res[j];
              if (actualItem.depth! >= maxDepth) {
                maxDepth = actualItem.depth! + 1;
              }
              actualItem.src_slice = this.processSrcSliceMap.get(res[j].id!);
              actualItem.cmdline = this.processNameMap.get(res[j].pid!);
              if (res[j].pid! === renderServiceProcess[0].pid) {
                actualItem.cmdline = 'render_service';
                actualItem.frame_type = actualItem.cmdline;
              } else {
                actualItem.frame_type = 'app';
              }
            }
            if (actualRow && !actualRow.isComplete && res.length > 0) {
              let maxHeight: number = maxDepth * unitHeight;
              actualRow.style.height = `${maxHeight}px`;
              actualRow.setAttribute('height', `${maxHeight}`);
              if (res[0]) {
                let timeLineType = res[0].type;
                actualRow.rowId = `${timeLineType}-${it.pid}`;
                actualRow.setAttribute('frame_type', res[0].frame_type || '');
                actualRow.dataList = res;
              }
            }
            return res;
          });
        };
        actualRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        actualRow.selectChangeHandler = this.trace.selectChangeHandler;
        actualRow.onThreadHandler = (useCache): void => {
          let context = actualRow!.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          actualRow!.canvasSave(context);
          (renders['jank'] as JankRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: 'actual_frame_timeline_slice',
            },
            actualRow!
          );
          actualRow!.canvasRestore(context, this.trace);
        };
        processRow.addChildTraceRow(actualRow);
      }
      let offsetYTimeOut: any = undefined;
      processRow.addEventListener('expansion-change', (e: any) => {
        JankStruct.delJankLineFlag = false;
        if (offsetYTimeOut) {
          clearTimeout(offsetYTimeOut);
        }
        if (JankStruct.selectJankStruct !== null && JankStruct.selectJankStruct !== undefined) {
          if (e.detail.expansion) {
            offsetYTimeOut = setTimeout(() => {
              this.trace.linkNodes.forEach((linkNodeItem) => {
                JankStruct.selectJankStructList?.forEach((selectProcessStruct: any) => {
                  if (e.detail.rowId == selectProcessStruct.pid) {
                    JankStruct.selectJankStruct = selectProcessStruct;
                    JankStruct.hoverJankStruct = selectProcessStruct;
                  }
                });
                if (linkNodeItem[0].rowEL.collect) {
                  linkNodeItem[0].rowEL.translateY = linkNodeItem[0].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkNodeItem[0].rowEL.translateY = linkNodeItem[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkNodeItem[0].y = linkNodeItem[0].rowEL!.translateY! + linkNodeItem[0].offsetY;
                if (linkNodeItem[1].rowEL.collect) {
                  linkNodeItem[1].rowEL.translateY = linkNodeItem[1].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkNodeItem[1].rowEL.translateY = linkNodeItem[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkNodeItem[1].y = linkNodeItem[1].rowEL!.translateY! + linkNodeItem[1].offsetY;
                if (actualRow) {
                  if (linkNodeItem[0].rowEL.rowId == e.detail.rowId) {
                    linkNodeItem[0].x = ns2xByTimeShaft(linkNodeItem[0].ns, this.trace.timerShaftEL!);
                    linkNodeItem[0].y = actualRow!.translateY! + linkNodeItem[0].offsetY * 2;
                    linkNodeItem[0].offsetY = linkNodeItem[0].offsetY * 2;
                    linkNodeItem[0].rowEL = actualRow!;
                  } else if (linkNodeItem[1].rowEL.rowId == e.detail.rowId) {
                    linkNodeItem[1].x = ns2xByTimeShaft(linkNodeItem[1].ns, this.trace.timerShaftEL!);
                    linkNodeItem[1].y = actualRow!.translateY! + linkNodeItem[1].offsetY * 2;
                    linkNodeItem[1].offsetY = linkNodeItem[1].offsetY * 2;
                    linkNodeItem[1].rowEL = actualRow!;
                  }
                }
              });
            }, 300);
          } else {
            if (JankStruct!.selectJankStruct) {
              JankStruct.selectJankStructList?.push(<JankStruct>JankStruct!.selectJankStruct);
            }
            offsetYTimeOut = setTimeout(() => {
              this.trace.linkNodes?.forEach((linkProcessItem) => {
                if (linkProcessItem[0].rowEL.collect) {
                  linkProcessItem[0].rowEL.translateY = linkProcessItem[0].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkProcessItem[0].rowEL.translateY =
                    linkProcessItem[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkProcessItem[0].y = linkProcessItem[0].rowEL!.translateY! + linkProcessItem[0].offsetY;
                if (linkProcessItem[1].rowEL.collect) {
                  linkProcessItem[1].rowEL.translateY = linkProcessItem[1].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkProcessItem[1].rowEL.translateY =
                    linkProcessItem[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkProcessItem[1].y = linkProcessItem[1].rowEL!.translateY! + linkProcessItem[1].offsetY;
                if (linkProcessItem[0].rowEL.rowParentId == e.detail.rowId) {
                  if (!linkProcessItem[0].rowEL.collect) {
                    linkProcessItem[0].x = ns2xByTimeShaft(linkProcessItem[0].ns, this.trace.timerShaftEL!);
                    linkProcessItem[0].y = processRow!.translateY! + linkProcessItem[0].offsetY / 2;
                    linkProcessItem[0].offsetY = linkProcessItem[0].offsetY / 2;
                    linkProcessItem[0].rowEL = processRow!;
                  }
                } else if (linkProcessItem[1].rowEL.rowParentId == e.detail.rowId) {
                  if (!linkProcessItem[1].rowEL.collect) {
                    linkProcessItem[1].x = ns2xByTimeShaft(linkProcessItem[1].ns, this.trace.timerShaftEL!);
                    linkProcessItem[1].y = processRow!.translateY! + linkProcessItem[1].offsetY / 2;
                    linkProcessItem[1].offsetY = linkProcessItem[1].offsetY / 2;
                    linkProcessItem[1].rowEL = processRow!;
                  }
                }
              });
            }, 300);
          }
        } else {
          if (e.detail.expansion) {
            offsetYTimeOut = setTimeout(() => {
              this.trace.linkNodes.forEach((linkNodeItem) => {
                ThreadStruct.selectThreadStructList?.forEach((selectProcessStruct: any) => {
                  if (e.detail.rowId == selectProcessStruct.pid) {
                    ThreadStruct.selectThreadStruct = selectProcessStruct;
                    ThreadStruct.hoverThreadStruct = selectProcessStruct;
                  }
                });
                if (linkNodeItem[0].rowEL.expansion && linkNodeItem[0].backrowEL) {
                  linkNodeItem[0].rowEL = linkNodeItem[0].backrowEL;
                  if (linkNodeItem[0].rowEL.collect) {
                    linkNodeItem[0].rowEL.translateY = linkNodeItem[0].rowEL.getBoundingClientRect().top - 195;
                  } else {
                    linkNodeItem[0].rowEL.translateY =
                      linkNodeItem[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                  }
                  linkNodeItem[0].x = ns2xByTimeShaft(linkNodeItem[0].ns, this.trace.timerShaftEL!);
                  linkNodeItem[0].offsetY = linkNodeItem[0].offsetY * 2;
                  linkNodeItem[0].y = linkNodeItem[0].rowEL.translateY + linkNodeItem[0].offsetY;
                }
                if (linkNodeItem[1].rowEL.expansion && linkNodeItem[1].backrowEL) {
                  linkNodeItem[1].rowEL = linkNodeItem[1].backrowEL;
                  if (linkNodeItem[1].rowEL.collect) {
                    linkNodeItem[1].rowEL.translateY = linkNodeItem[1].rowEL.getBoundingClientRect().top - 195;
                  } else {
                    linkNodeItem[1].rowEL.translateY =
                      linkNodeItem[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                  }
                  linkNodeItem[1].x = ns2xByTimeShaft(linkNodeItem[1].ns, this.trace.timerShaftEL!);
                  linkNodeItem[1].offsetY = linkNodeItem[1].offsetY * 2;
                  linkNodeItem[1].y = linkNodeItem[1].rowEL!.translateY! + linkNodeItem[1].offsetY;
                }
              });
            }, 300);
          } else {
            if (ThreadStruct!.selectThreadStruct) {
              ThreadStruct.selectThreadStructList?.push(<ThreadStruct>ThreadStruct!.selectThreadStruct);
            }
            offsetYTimeOut = setTimeout(() => {
              this.trace.linkNodes?.forEach((linkProcessItem) => {
                if (linkProcessItem[0].rowEL.collect) {
                  linkProcessItem[0].rowEL.translateY = linkProcessItem[0].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkProcessItem[0].rowEL.translateY =
                    linkProcessItem[0].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkProcessItem[0].y = processRow!.translateY + linkProcessItem[0].offsetY; //11
                if (linkProcessItem[1].rowEL.collect) {
                  linkProcessItem[1].rowEL.translateY = linkProcessItem[1].rowEL.getBoundingClientRect().top - 195;
                } else {
                  linkProcessItem[1].rowEL.translateY =
                    linkProcessItem[1].rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
                }
                linkProcessItem[1].y = linkProcessItem[1].rowEL!.translateY + linkProcessItem[1].offsetY;
                if (linkProcessItem[0].rowEL.rowParentId == e.detail.rowId) {
                  linkProcessItem[0].x = ns2xByTimeShaft(linkProcessItem[0].ns, this.trace.timerShaftEL!);
                  linkProcessItem[0].y = processRow!.translateY! + linkProcessItem[0].offsetY / 2;
                  linkProcessItem[0].offsetY = linkProcessItem[0].offsetY / 2;
                  linkProcessItem[0].rowEL = processRow!;
                }
                if (linkProcessItem[1].rowEL.rowParentId == e.detail.rowId) {
                  linkProcessItem[1].x = ns2xByTimeShaft(linkProcessItem[1].ns, this.trace.timerShaftEL!);
                  linkProcessItem[1].y = processRow!.translateY! + linkProcessItem[1].offsetY / 2;
                  linkProcessItem[1].offsetY = linkProcessItem[1].offsetY / 2;
                  linkProcessItem[1].rowEL = processRow!;
                }
              });
            }, 300);
          }
        }
        let refreshTimeOut = setTimeout(() => {
          this.trace.refreshCanvas(true);
          clearTimeout(refreshTimeOut);
        }, 360);
      });
      /**
       * Async Function
       */
      let asyncFuncList = this.processAsyncFuncMap[it.pid] || [];
      let asyncFuncGroup = Utils.groupBy(asyncFuncList, 'funName');
      Reflect.ownKeys(asyncFuncGroup).map((key: any) => {
        let asyncFunctions: Array<any> = asyncFuncGroup[key];
        if (asyncFunctions.length > 0) {
          let isIntersect = (a: any, b: any): boolean =>
            Math.max(a.startTs + a.dur, b.startTs + b.dur) - Math.min(a.startTs, b.startTs) < a.dur + b.dur;
          let depthArray: any = [];
          asyncFunctions.forEach((it, i) => {
            if (it.dur === -1) {
              it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
              it.flag = 'Did not end';
            }
            let currentDepth = 0;
            let index = i;
            while (
              depthArray[currentDepth] !== undefined &&
              isIntersect(depthArray[currentDepth], asyncFunctions[index])
            ) {
              currentDepth++;
            }
            asyncFunctions[index].depth = currentDepth;
            depthArray[currentDepth] = asyncFunctions[index];
          });
          let max = Math.max(...asyncFunctions.map((it) => it.depth || 0)) + 1;
          let maxHeight = max * 20;
          let funcRow = TraceRow.skeleton<FuncStruct>();
          funcRow.rowId = `${asyncFunctions[0].funName}-${it.pid}`;
          funcRow.asyncFuncName = asyncFunctions[0].funName;
          funcRow.asyncFuncNamePID = it.pid;
          funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
          funcRow.enableCollapseChart(); //允许折叠泳道图
          funcRow.rowParentId = `${it.pid}`;
          funcRow.rowHidden = !processRow.expansion;
          funcRow.style.width = '100%';
          funcRow.style.height = `${maxHeight}px`;
          funcRow.setAttribute('height', `${maxHeight}`);
          funcRow.name = `${asyncFunctions[0].funName}`;
          funcRow.setAttribute('children', '');
          funcRow.supplier = (): Promise<any> => new Promise((resolve) => resolve(asyncFunctions));
          funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
          funcRow.selectChangeHandler = this.trace.selectChangeHandler;
          funcRow.onThreadHandler = (cacheFlag): void => {
            let context: CanvasRenderingContext2D;
            if (funcRow.currentContext) {
              context = funcRow.currentContext;
            } else {
              context = funcRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
            }
            funcRow.canvasSave(context);
            (renders.func as FuncRender).renderMainThread(
              {
                context: context,
                useCache: cacheFlag,
                type: `func-${asyncFunctions[0].funName}-${it.pid}`,
              },
              funcRow
            );
            funcRow.canvasRestore(context, this.trace);
          };
          processRow.addChildTraceRow(funcRow);
        }
      });

      /**
       * 添加进程内存信息
       */
      let processMem = this.processMem.filter((mem) => mem.pid === it.pid);
      processMem.forEach((mem) => {
        let row = TraceRow.skeleton<ProcessMemStruct>();
        row.rowId = `${mem.trackId}`;
        row.rowType = TraceRow.ROW_TYPE_MEM;
        row.rowParentId = `${it.pid}`;
        row.rowHidden = !processRow.expansion;
        row.style.height = '40px';
        row.style.width = '100%';
        row.name = `${mem.trackName}`;
        row.setAttribute('children', '');
        row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        row.selectChangeHandler = this.trace.selectChangeHandler;
        row.focusHandler = (): void => {
          this.trace.displayTip(
            row,
            ProcessMemStruct.hoverProcessMemStruct,
            `<span>${ProcessMemStruct.hoverProcessMemStruct?.value || '0'}</span>`
          );
        };
        row.findHoverStruct = (): void => {
          ProcessMemStruct.hoverProcessMemStruct = row.getHoverStruct(false);
        };
        row.supplierFrame = (): Promise<Array<ProcessMemStruct>> =>
          processMemDataSender(mem.trackId, row).then((resultProcess) => {
            let maxValue = this.filterIdMaxValue.get(mem.trackId) || 0;
            for (let j = 0; j < resultProcess.length; j++) {
              resultProcess[j].maxValue = maxValue;
              if (j === resultProcess.length - 1) {
                resultProcess[j].duration = (TraceRow.range?.totalNS || 0) - (resultProcess[j].startTime || 0);
              } else {
                resultProcess[j].duration = (resultProcess[j + 1].startTime || 0) - (resultProcess[j].startTime || 0);
              }
              if (j > 0) {
                resultProcess[j].delta = (resultProcess[j].value || 0) - (resultProcess[j - 1].value || 0);
              } else {
                resultProcess[j].delta = 0;
              }
            }
            return resultProcess;
          });
        row.onThreadHandler = (useCache): void => {
          let context: CanvasRenderingContext2D;
          if (row.currentContext) {
            context = row.currentContext;
          } else {
            context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          row.canvasSave(context);
          (renders.mem as MemRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: `mem ${mem.trackId} ${mem.trackName}`,
            },
            row
          );
          row.canvasRestore(context, this.trace);
        };
        processRow.addChildTraceRow(row);
      });
      /**
       * add thread list
       */
      let threads = this.processThreads.filter((thread) => thread.pid === it.pid && thread.tid != 0);
      for (let j = 0; j < threads.length; j++) {
        let thread = threads[j];
        let threadRow = TraceRow.skeleton<ThreadStruct>();
        threadRow.rowId = `${thread.tid}`;
        threadRow.rowType = TraceRow.ROW_TYPE_THREAD;
        threadRow.rowParentId = `${it.pid}`;
        threadRow.rowHidden = !processRow.expansion;
        threadRow.index = j;
        threadRow.style.height = '30px';
        threadRow.style.width = '100%';
        threadRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
        threadRow.setAttribute('children', '');
        threadRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        threadRow.selectChangeHandler = this.trace.selectChangeHandler;
        threadRow.supplierFrame = (): Promise<Array<ThreadStruct>> => {
          return threadDataSender(thread.tid || 0, it.pid || 0, threadRow).then((res) => {
            if (res === true) {
              // threadRow.rowDiscard = true;
              return [];
            } else {
              let rs = res as ThreadStruct[];
              if (rs.length <= 0 && !threadRow.isComplete) {
                this.trace.refreshCanvas(true);
              }
              return rs;
            }
          });
        };
        threadRow.onThreadHandler = (useCache): void => {
          let context: CanvasRenderingContext2D;
          if (threadRow.currentContext) {
            context = threadRow.currentContext;
          } else {
            context = threadRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          threadRow.canvasSave(context);
          (renders['thread'] as ThreadRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: `thread ${thread.tid} ${thread.threadName}`,
              translateY: threadRow.translateY,
            },
            threadRow
          );
          threadRow.canvasRestore(context, this.trace);
        };
        if (threadRow.rowId === threadRow.rowParentId) {
          if (actualRow !== null) {
            processRow.addChildTraceRowAfter(threadRow, actualRow);
          } else if (expectedRow !== null) {
            processRow.addChildTraceRowAfter(threadRow, expectedRow);
          } else if (soRow) {
            processRow.addChildTraceRowAfter(threadRow, soRow);
          } else if (startupRow) {
            processRow.addChildTraceRowAfter(threadRow, startupRow);
          } else {
            processRow.addChildTraceRowSpecifyLocation(threadRow, 0);
          }
        } else {
          processRow.addChildTraceRow(threadRow);
        }
        if (this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) != undefined) {
          let max = this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) || 1;
          let maxHeight = max * 20;
          let funcRow = TraceRow.skeleton<FuncStruct>();
          funcRow.rowId = `${thread.tid}`;
          funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
          funcRow.enableCollapseChart(); //允许折叠泳道图
          funcRow.rowParentId = `${it.pid}`;
          funcRow.rowHidden = !processRow.expansion;
          funcRow.checkType = threadRow.checkType;
          funcRow.style.width = '100%';
          funcRow.style.height = `${maxHeight}px`;
          funcRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
          funcRow.setAttribute('children', '');
          funcRow.supplierFrame = (): Promise<Array<FuncStruct>> => {
            return funcDataSender(thread.tid || 0, thread.upid || 0, funcRow).then(
              (rs: Array<FuncStruct> | boolean) => {
                if (rs === true) {
                  funcRow.rowDiscard = true;
                  return [];
                } else {
                  let funs = rs as FuncStruct[];
                  if (funs.length > 0) {
                    funs.forEach((fun, index) => {
                      funs[index].itid = thread.utid;
                      funs[index].ipid = thread.upid;
                      funs[index].funName = this.funcNameMap.get(funs[index].id!);
                      if (Utils.isBinder(fun)) {
                      } else {
                        if (fun.dur === -1) {
                          fun.dur = (TraceRow.range?.totalNS || 0) - (fun.startTs || 0);
                          fun.flag = 'Did not end';
                        }
                      }
                    });
                  } else {
                    this.trace.refreshCanvas(true);
                  }
                  return funs;
                }
              }
            );
          };
          funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
          funcRow.selectChangeHandler = this.trace.selectChangeHandler;
          funcRow.onThreadHandler = (useCache): void => {
            let context: CanvasRenderingContext2D;
            if (funcRow.currentContext) {
              context = funcRow.currentContext;
            } else {
              context = funcRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
            }
            funcRow.canvasSave(context);
            (renders.func as FuncRender).renderMainThread(
              {
                context: context,
                useCache: useCache,
                type: `func${thread.tid}${thread.threadName}`,
              },
              funcRow
            );
            funcRow.canvasRestore(context, this.trace);
          };
          processRow.addChildTraceRowAfter(funcRow, threadRow);
        }
        if ((thread.switchCount || 0) === 0) {
          threadRow.rowDiscard = true;
        }
      }
      await this.trace.chartManager?.frameTimeChart.initAnimatedScenesChart(processRow, it, expectedRow!);
    }
    let durTime = new Date().getTime() - time;
    info('The time to load the Process data is: ', durTime);
  }

  addStartUpRow(processRow: TraceRow<ProcessStruct>): TraceRow<AppStartupStruct> {
    processRow.setAttribute('hasStartup', 'true');
    let startupRow: TraceRow<AppStartupStruct> = TraceRow.skeleton<AppStartupStruct>();
    startupRow.rowId = `app-start-${processRow.rowId}`;
    startupRow.rowType = TraceRow.ROW_TYPE_APP_STARTUP;
    startupRow.rowParentId = `${processRow.rowId}`;
    startupRow.rowHidden = !processRow.expansion;
    startupRow.index = 0;
    startupRow.style.height = '30px';
    startupRow.style.width = `100%`;
    startupRow.name = `App Startups`;
    startupRow.setAttribute('children', '');
    startupRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    startupRow.selectChangeHandler = this.trace.selectChangeHandler;
    startupRow.supplierFrame = (): Promise<Array<AppStartupStruct>> =>
      processStartupDataSender(parseInt(processRow.rowId!), startupRow).then((res) => {
        if (res.length <= 0) {
          this.trace.refreshCanvas(true);
        }
        for (let i = 0; i < res.length; i++) {
          if (res[i].startName! < 6 && i < res.length - 1) {
            res[i].endItid = res[i + 1].itid;
          }
        }
        return res;
      });
    startupRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (startupRow.currentContext) {
        context = startupRow.currentContext;
      } else {
        context = startupRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      startupRow.canvasSave(context);
      (renders['app-start-up'] as AppStartupRender).renderMainThread(
        {
          appStartupContext: context,
          useCache: useCache,
          type: `app-startup ${processRow.rowId}`,
        },
        startupRow
      );
      startupRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(startupRow);
    return startupRow;
  }

  addSoInitRow(processRow: TraceRow<ProcessStruct>, maxDepth: number): TraceRow<SoStruct> {
    processRow.setAttribute('hasStaticInit', 'true');
    let maxHeight = (maxDepth + 1) * 20;
    let soRow: TraceRow<SoStruct> = TraceRow.skeleton<SoStruct>();
    soRow.rowId = `app-start-${processRow.rowId}`;
    soRow.rowType = TraceRow.ROW_TYPE_STATIC_INIT;
    soRow.rowParentId = `${processRow.rowId}`;
    soRow.rowHidden = !processRow.expansion;
    soRow.index = 0;
    soRow.style.height = `${maxHeight}px`;
    soRow.style.width = `100%`;
    soRow.name = `Static Initialization`;
    soRow.setAttribute('children', '');
    soRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    soRow.selectChangeHandler = this.trace.selectChangeHandler;
    soRow.supplierFrame = (): Promise<Array<SoStruct>> =>
      processSoInitDataSender(parseInt(processRow.rowId!), soRow).then((res) => {
        if (res.length <= 0) {
          this.trace.refreshCanvas(true);
        }
        res.forEach((so, index) => {
          let soName = this.soInitNameMap.get(res[index].id!);
          if (soName) {
            so.soName = soName.replace('dlopen: ', '');
          }
        });
        return res;
      });
    soRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (soRow.currentContext) {
        context = soRow.currentContext;
      } else {
        context = soRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      soRow.canvasSave(context);
      (renders['app-so-init'] as SoRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `static-init ${processRow.rowId}`,
        },
        soRow
      );
      soRow.canvasRestore(context, this.trace);
    };
    processRow.addChildTraceRow(soRow);
    return soRow;
  }

  insertAfter(newEl: HTMLElement, targetEl: HTMLElement): void {
    let parentEl = targetEl.parentNode;
    if (parentEl!.lastChild == targetEl) {
      parentEl!.appendChild(newEl);
    } else {
      parentEl!.insertBefore(newEl, targetEl.nextSibling);
    }
  }
}
