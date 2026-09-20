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

-- triage_jank.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    fs.flag,
    COUNT(*) AS frame_count,
    MIN(fs.vsync) AS min_vsync,
    MAX(fs.vsync) AS max_vsync
FROM frame_slice fs
JOIN process p ON fs.ipid = p.id
JOIN trace_range TR
WHERE fs.type = 0
  AND fs.flag <> 2
  AND (fs.ts - TR.start_ts) >= 0
-- AND fs.ipid = :ipid
GROUP BY p.name, p.ipid, fs.flag
ORDER BY frame_count DESC;
