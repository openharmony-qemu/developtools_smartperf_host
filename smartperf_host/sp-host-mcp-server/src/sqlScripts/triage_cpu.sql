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

-- triage_cpu.sql
-- @optional cpuId: CPU core ID
SELECT
    ts.cpu,
    COUNT(*) AS slice_count,
    SUM(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS total_duration,
    AVG(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS avg_duration,
    t.name AS thread_name,
    p.name AS process_name,
    ts.itid
FROM thread_state ts
JOIN thread t ON ts.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ts.cpu IS NOT NULL
  AND ts.dur > 0
  AND (ts.ts - TR.start_ts) >= 0
-- AND ts.cpu = :cpuId
GROUP BY ts.cpu, ts.itid, t.name, p.name
ORDER BY total_duration DESC
LIMIT 50;
