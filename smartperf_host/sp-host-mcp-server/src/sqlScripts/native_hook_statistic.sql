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

-- native_hook_statistic.sql
-- @required ipid: internal process ID
-- @optional eventType: MemoryStatisticType integer (0-21)
SELECT
    nhs.id,
    (nhs.ts - TR.start_ts) AS ts,
    nhs.type,
    nhs.sub_type_id,
    nhs.apply_count,
    nhs.release_count,
    nhs.apply_size,
    nhs.release_size,
    nhs.last_lib_id
FROM native_hook_statistic nhs
JOIN trace_range TR
WHERE nhs.ipid = :ipid
-- AND nhs.type = :eventType
ORDER BY (nhs.ts - TR.start_ts) ASC
LIMIT 200;
