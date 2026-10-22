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

-- triage_io.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    fio.is_write,
    fio.is_block,
    COUNT(*) AS io_count,
    SUM(fio.duration) AS total_duration,
    AVG(fio.duration) AS avg_duration,
    SUM(fio.request_bytes) AS total_size
FROM filesystem_io fio
JOIN thread t ON fio.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE (fio.start_time - TR.start_ts) >= 0
-- AND t.ipid = :ipid
GROUP BY p.name, p.ipid, fio.is_write, fio.is_block
ORDER BY total_duration DESC
LIMIT 50;
