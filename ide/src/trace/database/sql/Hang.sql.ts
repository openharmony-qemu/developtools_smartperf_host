/*
 * Copyright (C) 2024 Shenzhen Kaihong Digital Industry Development Co., Ltd.
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

import { FlagsConfig } from '../../component/SpFlags';
import { query } from '../SqlLite';
import { HangStruct } from '../ui-worker/ProcedureWorkerHang';

function getMinDur(): string {
  let flagsItemJson = JSON.parse(window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY)!);
  let minDur = flagsItemJson.hangValue;
  return minDur;
}

export const queryHangData = (): Promise<Array<{
  id: number,
  name: string,
  num: number
}>> => query(
  'queryHangData',
  `
SELECT
  p.pid as id,
  p.name as name,
  count(*) as num
FROM
  callstack c
LEFT JOIN thread t ON
  t.itid = c.callid
LEFT JOIN process p ON
  p.ipid = t.ipid
WHERE
  c.name LIKE 'H:Et:%'
  AND t.is_main_thread = 1
  AND c.dur >= ${getMinDur()}
GROUP BY
  p.pid
`.trim()
);


export const queryAllHangs = (): Promise<Array<HangStruct>> => query(
  'queryAllHangs',
  `
SELECT
  c.id as id,
  c.ts - r.start_ts as startTime,
  c.dur as dur,
  t.tid as tid,
  p.pid as pid,
  p.name as pname,
  c.name as content
FROM
  callstack c, trace_range r
LEFT JOIN thread t ON
  t.itid = c.callid
LEFT JOIN process p ON
  p.ipid = t.ipid
WHERE
  c.dur >= ${getMinDur()}
  AND t.is_main_thread = 1
  AND c.name LIKE 'H:Et:%'
`.trim()
);