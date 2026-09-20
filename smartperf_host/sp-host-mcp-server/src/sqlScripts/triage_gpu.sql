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

-- triage_gpu.sql
SELECT
    (mp.ts - TR.start_ts) AS ts,
    mp.total_size
FROM memory_profile mp
CROSS JOIN trace_range TR
WHERE mp.ts BETWEEN TR.start_ts AND TR.end_ts
ORDER BY (mp.ts - TR.start_ts) ASC
LIMIT 100;
