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

import { PerfCall, PerfFile } from '../../bean/PerfProfile';
import { info } from '../../../log/Log';
import { SpHiPerf } from './SpHiPerf';
import { procedurePool } from '../../database/Procedure';
import { SpSystemTrace } from '../SpSystemTrace';
import { queryPerfFiles } from '../../database/sql/Perf.sql';

export class PerfDataQuery {
  filesData: unknown = {};
  callChainMap: Map<number, PerfCall> = new Map<number, PerfCall>();

  async initPerfCache(): Promise<void> {
    await this.initPerfCallChainMap();
    await this.initPerfFiles();
  }

  async initPerfCallChainMap(): Promise<void> {
    this.callChainMap.clear();
  }

  async initPerfFiles(): Promise<void> {
    let files = await queryPerfFiles();
    info('PerfFiles Data size is: ', files!.length);
    files.forEach((file) => {
      // @ts-ignore
      this.filesData[file.fileId] = this.filesData[file.fileId] || [];
      PerfFile.setFileName(file); // @ts-ignore
      this.filesData[file.fileId].push(file);
    });
    const data = {
      fValue: SpHiPerf.stringResult?.fValue,
    };
    let results = await new Promise<unknown>((resolve, reject) => {
      procedurePool.submitWithName('logic0', 'perf-init', data, undefined, (res: unknown) => {
        resolve(res);
      });
    }); // @ts-ignore
    this.callChainMap = results as unknown;
    info('Perf Files Data initialized');
  }

  getLibName(fileId: number, symbolId: number): string {
    let name = 'unknown';
    if (symbolId === -1) {
      // @ts-ignore
      if (this.filesData[fileId] && this.filesData[fileId].length > 0) {
        // @ts-ignore
        name = this.filesData[fileId][0].fileName;
      }
    } else {
      // @ts-ignore
      if (this.filesData[fileId] && this.filesData[fileId].length > symbolId) {
        // @ts-ignore
        name = this.filesData[fileId][symbolId].fileName;
      }
    }
    return name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

export const perfDataQuery = new PerfDataQuery();
