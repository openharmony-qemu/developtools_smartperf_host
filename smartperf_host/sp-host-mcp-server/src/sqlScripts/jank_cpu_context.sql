-- Copyright (C) 2026 Huawei Device Co., Ltd.
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- jank_cpu_context.sql
-- @required ipid: internal process ID
-- @required startTime: start timestamp in NS
-- @required endTime: end timestamp in NS
SELECT
    ts.cpu,
    (ts.ts - TR.start_ts) AS start_ts,
    ts.dur,
    t.name AS thread_name,
    p.name AS process_name,
    ts.itid,
    ts.state
FROM thread_state ts
JOIN thread t ON ts.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ts.cpu IS NOT NULL
  AND ts.dur > 0
  AND t.ipid = :ipid
  AND (ts.ts - TR.start_ts) >= :startTime
  AND (ts.ts - TR.start_ts + ts.dur) <= :endTime
ORDER BY (ts.ts - TR.start_ts) ASC;
