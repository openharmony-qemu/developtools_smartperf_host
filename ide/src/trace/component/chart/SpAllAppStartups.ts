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
import { CpuFreqStruct } from '../../database/ui-worker/ProcedureWorkerFreq';
import { queryAppStartupProcessIds, queryProcessStartup, querySingleAppStartupsName } from '../../database/sql/ProcessThread.sql';
import { FlagsConfig } from '../SpFlags';
import { AllAppStartupStruct, AllAppStartupRender } from '../../database/ui-worker/ProcedureWorkerAllAppStartup';

export class SpAllAppStartupsChart {
  private readonly trace: SpSystemTrace | undefined;
  static APP_STARTUP_PID_ARR: Array<number> = [];
  static jsonRow: TraceRow<CpuFreqStruct> | undefined;
  static trace: SpSystemTrace;
  static AllAppStartupsNameArr: any[] = [];
  static allAppStartupsAva: number[] = [];

  constructor(trace: SpSystemTrace) {
    SpAllAppStartupsChart.trace = trace;
  }

  async init() {
    SpAllAppStartupsChart.APP_STARTUP_PID_ARR = [];
    let appStartUpPids = await queryAppStartupProcessIds();
    appStartUpPids.forEach((it) => SpAllAppStartupsChart.APP_STARTUP_PID_ARR.push(it.pid));
    SpAllAppStartupsChart.AllAppStartupsNameArr = [];
    SpAllAppStartupsChart.allAppStartupsAva = [];
    for (let i = 0; i < SpAllAppStartupsChart.APP_STARTUP_PID_ARR.length; i++) {
      let tmpSingleApp: any[] = await queryProcessStartup(SpAllAppStartupsChart.APP_STARTUP_PID_ARR[i]!);
      if (tmpSingleApp.length == 8) {
        let avilSingleName = await querySingleAppStartupsName(SpAllAppStartupsChart.APP_STARTUP_PID_ARR[i]!);
        SpAllAppStartupsChart.allAppStartupsAva.push(SpAllAppStartupsChart.APP_STARTUP_PID_ARR[i]);
        SpAllAppStartupsChart.AllAppStartupsNameArr.push(avilSingleName![0].name);
      }
    }
    let loadAppStartup: boolean = FlagsConfig.getFlagsConfigEnableStatus('AppStartup');
    if (loadAppStartup && SpAllAppStartupsChart.allAppStartupsAva.length) await this.initFolder();
  }

  async initFolder() {
    let row: TraceRow<AllAppStartupStruct> = TraceRow.skeleton<AllAppStartupStruct>();
    row.setAttribute('hasStartup', 'true');
    row.rowId = `all-app-start-${SpAllAppStartupsChart.APP_STARTUP_PID_ARR![0]}`;
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_ALL_APPSTARTUPS;
    row.rowParentId = '';
    row.folder = false;
    row.style.height = '40px';
    row.name = `All App Startups`;
    row.selectChangeHandler = SpAllAppStartupsChart.trace.selectChangeHandler;
    row.favoriteChangeHandler = SpAllAppStartupsChart.trace.favoriteChangeHandler;
    row.supplier = async (): Promise<Array<AllAppStartupStruct>> => {
      let sendRes: AllAppStartupStruct[] | PromiseLike<AllAppStartupStruct[]> = [];
      for (let i = 0; i < SpAllAppStartupsChart.allAppStartupsAva.length; i++) {
        let tmpResArr = await queryProcessStartup(SpAllAppStartupsChart.allAppStartupsAva[i]);
        let maxStartTs: number | undefined = tmpResArr[0].startTs;
        let minStartTs: number | undefined = tmpResArr[0].startTs;
        let singleDur = tmpResArr[0].dur;
        let endTs: number | undefined = tmpResArr[0].startTs;
        if (tmpResArr.length > 1) {
          for (let j = 0; j < tmpResArr.length; j++) {
            if (Number(tmpResArr[j].startTs) > Number(maxStartTs)) {
              maxStartTs = tmpResArr[j].startTs;
            } else if (Number(tmpResArr[j].startTs) < Number(minStartTs)) {
              minStartTs = tmpResArr[j].startTs;
            }
          }
          tmpResArr.forEach((item) => {
            if (item.startTs == maxStartTs) {
              endTs = Number(item.startTs) + Number(item.dur);
              singleDur = Number(endTs) - Number(minStartTs);
            }
          });
        } else if (tmpResArr.length === 1) {
          minStartTs = tmpResArr[0].startTs;
          singleDur = tmpResArr[0].dur;
        }
        sendRes.push({
          dur: singleDur,
          startTs: minStartTs,
          startName: undefined,
          stepName: SpAllAppStartupsChart.AllAppStartupsNameArr[i],
          translateY: undefined,
          frame: undefined,
          isHover: false,
        });
      }
      return sendRes;
    };

    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect
          ? SpAllAppStartupsChart.trace.canvasFavoritePanelCtx!
          : SpAllAppStartupsChart.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['all-app-start-up'] as AllAppStartupRender).renderMainThread(
        {
          appStartupContext: context,
          useCache: useCache,
          type: `app-startup ${row.rowId}`,
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
    SpAllAppStartupsChart.trace.rowsEL?.appendChild(row);
  }
}
