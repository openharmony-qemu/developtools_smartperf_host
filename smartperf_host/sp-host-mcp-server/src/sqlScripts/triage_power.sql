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

-- triage_power.sql
-- @optional metricName: metric name filter
SELECT
    mf.name AS metric_name,
    COUNT(*) AS sample_count,
    MAX(m.value) AS peak_value,
    MIN(m.value) AS min_value,
    AVG(m.value) AS avg_value
FROM measure m
JOIN measure_filter mf ON m.filter_id = mf.id
JOIN trace_range TR
WHERE mf.type = 'xpower_filter'
  AND (m.ts - TR.start_ts) >= 0
-- AND mf.name = :metricName
GROUP BY mf.name
ORDER BY mf.name;
