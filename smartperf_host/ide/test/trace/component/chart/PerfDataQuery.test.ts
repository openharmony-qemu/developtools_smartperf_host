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

import '../../../../src/trace/component/chart/SpHiPerf';
import { SpHiPerf } from '../../../../src/trace/component/chart/SpHiPerf';
import '../../../../src/trace/component/chart/PerfDataQuery';
import { PerfDataQuery } from '../../../../src/trace/component/chart/PerfDataQuery';
const perfSql = require('../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {}
});

describe('perfDataQuery Test', () => {
  SpHiPerf.stringResult = {
    existA: true,
    existF: false,
    fValue: 1,
  };
  let perfFiles  = perfSql.queryPerfFiles;
  perfFiles.mockResolvedValue([]);
  let perfDataQuery = new PerfDataQuery();
  it('perfDataQueryTest01 ', function () {
    perfDataQuery.initPerfCache();
    perfDataQuery.initPerfCallChainMap();
    perfDataQuery.getLibName('id', 0);
    perfDataQuery.getLibName('id', -1);
    expect(perfDataQuery.initPerfFiles).not.toBeUndefined();
  });
});
