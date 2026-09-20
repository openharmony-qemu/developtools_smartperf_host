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

-- triage_hang.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    COUNT(*) AS hang_count,
    SUM(c.dur) AS total_hang_duration,
    AVG(c.dur) AS avg_hang_duration,
    MAX(c.dur) AS max_hang_duration
FROM callstack c
JOIN thread t ON t.id = c.callid
JOIN process p ON p.id = t.ipid
JOIN trace_range TR
WHERE c.name LIKE 'H:Et:%'
  AND t.is_main_thread = 1
  AND (c.ts - TR.start_ts) >= 0
-- AND p.ipid = :ipid
GROUP BY p.name, p.ipid
ORDER BY hang_count DESC
LIMIT 50;
