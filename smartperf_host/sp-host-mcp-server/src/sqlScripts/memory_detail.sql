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

-- memory_detail.sql
-- @required ipid: internal process ID
-- @optional metric: metric name like 'mem.rss'
SELECT
    (m.ts - TR.start_ts) AS ts,
    mf.name AS metric_name,
    m.value
FROM measure m
JOIN process_measure_filter mf ON m.filter_id = mf.id
JOIN trace_range TR
WHERE mf.ipid = :ipid
  AND mf.name IN ('mem.rss', 'mem.pss', 'mem.vss', 'mem.heap_size')
-- AND mf.name = :metric
ORDER BY (m.ts - TR.start_ts) ASC;
