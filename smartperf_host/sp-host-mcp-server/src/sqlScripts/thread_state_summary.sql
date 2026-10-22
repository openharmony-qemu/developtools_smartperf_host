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

-- thread_state_summary.sql
-- @required itid: internal thread ID
SELECT
    ts.state,
    COUNT(*) AS state_count,
    SUM(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS total_duration
FROM thread_state ts
JOIN trace_range TR
WHERE ts.itid = :itid
  AND (ts.ts - TR.start_ts) >= 0
GROUP BY ts.state
ORDER BY total_duration DESC;
