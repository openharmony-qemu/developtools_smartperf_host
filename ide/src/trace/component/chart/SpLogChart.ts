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
import { LogRender, LogStruct } from '../../database/ui-worker/ProcedureWorkerLog';
import { LogDataSender } from '../../database/data-trafic/LogDataSender';
import { queryLogData } from '../../database/sql/SqlLite.sql';

export class SpLogChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let dataArray = await queryLogData();
    if (dataArray.length === 0) {
      return;
    }
    let folder = await this.initFolder();
    this.trace.rowsEL?.appendChild(folder);
  }

  async initFolder(): Promise<TraceRow<LogStruct>> {
    let logsRow = TraceRow.skeleton<LogStruct>();
    logsRow.rowId = 'logs';
    logsRow.index = 0;
    logsRow.rowType = TraceRow.ROW_TYPE_LOGS;
    logsRow.rowParentId = '';
    logsRow.style.height = '42px';
    logsRow.folder = false;
    logsRow.name = 'Logs';
    logsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    logsRow.selectChangeHandler = this.trace.selectChangeHandler;
    logsRow.supplierFrame = (): Promise<LogStruct[]> => {
      return LogDataSender(logsRow).then((res) => {
        return res;
      });
    };
    logsRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (logsRow.currentContext) {
        context = logsRow.currentContext;
      } else {
        context = logsRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      logsRow.canvasSave(context);
      (renders.logs as LogRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'logs',
        },
        logsRow
      );
      logsRow.canvasRestore(context, this.trace);
    };
    return logsRow;
  }
}
