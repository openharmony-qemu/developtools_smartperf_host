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

import { query } from '../SqlLite';

export const queryRealHangData = (): Promise<Array<{
  id: number,
  name: string,
  num: number
}>> =>
  query(
    'queryHangsData',
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
  c.name LIKE 'H:Et%'
  AND c.dur >= 33000000
GROUP BY
  p.pid
`.trim()
  )

export const queryHangFuncName = (): Promise<Array<{
  id: number,
  name: string
}>> =>
  query('queryHangFuncName',
    `
SELECT
  c.id as id,
  c.name as name
FROM
  callstack c
WHERE
  c.dur >= 33000000
  AND c.name LIKE 'H:Et%'
    `.trim()
  )