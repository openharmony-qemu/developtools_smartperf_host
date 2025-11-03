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

import { ProcedureLogicWorkerPerf } from './ProcedureLogicWorkerPerf';
import { ProcedureLogicWorkerNativeMemory } from './ProcedureLogicWorkerNativeNemory';
import { ProcedureLogicWorkerFileSystem } from './ProcedureLogicWorkerFileSystem';
import { ProcedureLogicWorkerSPT } from './ProcedureLogicWorkerSPT';
import { ProcedureLogicWorkerCpuState } from './ProcedureLogicWorkerCpuState';
import { ProcedureLogicWorkerSchedulingAnalysis } from './ProcedureLogicWorkerSchedulingAnalysis';
import { DataCache } from './ProcedureLogicWorkerCommon';
import { ProcedureLogicWorkerJsCpuProfiler } from './ProcedureLogicWorkerJsCpuProfiler';
import {ProcedureLogicWorkerGpuMemory} from './ProcedureLogicWorkerGpuMemory';
import {ProcedureLogicWorkerOtherSource} from './ProcedureLogicWorkerOtherSource';

let logicWorker = {
  perf: new ProcedureLogicWorkerPerf(),
  'native-memory': new ProcedureLogicWorkerNativeMemory(),
  fileSystem: new ProcedureLogicWorkerFileSystem(),
  CpuState: new ProcedureLogicWorkerCpuState(),
  spt: new ProcedureLogicWorkerSPT(),
  scheduling: new ProcedureLogicWorkerSchedulingAnalysis(),
  jsCpuProfile: new ProcedureLogicWorkerJsCpuProfiler(),
  'gpu-memory': new ProcedureLogicWorkerGpuMemory(),
  'other-source': new ProcedureLogicWorkerOtherSource(),
};

function match(req: { id: string; type: string; params: { dataDict: Map<number, string> } }): void {
  if (req.type === 'clear') {
    //@ts-ignore
    Reflect.ownKeys(logicWorker).forEach((key) => logicWorker[key].clearAll());
    DataCache.getInstance().clearAll();
    return;
  }
  if (req.type === 'cache-data-dict') {
    DataCache.getInstance().dataDict = req.params.dataDict;
    self.postMessage({
      id: req.id,
      action: req.type,
      results: 'ok',
    });
    return;
  }
  Reflect.ownKeys(logicWorker).filter((it) => {
    if (req.type && req.type.startsWith(it as string)) {
      //@ts-ignore
      logicWorker[it].handle(req);
    }
  });
}

self.onmessage = function (e: unknown): void {
  //@ts-ignore
  match(e.data);
};
