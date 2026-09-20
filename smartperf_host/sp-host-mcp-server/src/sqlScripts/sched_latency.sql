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

-- sched_latency.sql
-- @optional itid: internal thread ID
SELECT
    ss.itid,
    t.name AS thread_name,
    p.name AS process_name,
    (ss.ts - TR.start_ts) AS ready_ts,
    ss.dur AS sched_latency,
    ss.cpu,
    ss.end_state,
    ss.priority
FROM sched_slice ss
JOIN thread t ON ss.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ss.dur > 0
  AND (ss.ts - TR.start_ts) >= 0
-- AND ss.itid = :itid
ORDER BY ss.dur DESC
LIMIT 100;
