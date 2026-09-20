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

-- triage_network.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    COUNT(*) AS request_count,
    SUM(CASE WHEN nti.cache_hit = 1 THEN 1 ELSE 0 END) AS cache_hit_count,
    AVG(nti.end_time - nti.begin_time) AS avg_duration
FROM network_time_information nti
JOIN process p ON nti.ipid = p.ipid
JOIN trace_range TR
WHERE (nti.begin_time - TR.start_ts) >= 0
-- AND nti.ipid = :ipid
GROUP BY p.name, p.ipid
ORDER BY request_count DESC
LIMIT 50;
