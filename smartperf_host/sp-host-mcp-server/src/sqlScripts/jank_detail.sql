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

-- jank_detail.sql
-- @required ipid: internal process ID
-- @optional startTime: start timestamp in NS
-- @optional endTime: end timestamp in NS
SELECT
    fs.id,
    (fs.ts - TR.start_ts) AS ts,
    fs.dur,
    fs.vsync AS frame_number,
    fs.flag,
    fs.type,
    fs.src AS src_slice,
    fs.dst AS dst_slice,
    p.name AS process_name
FROM frame_slice fs
JOIN process p ON fs.ipid = p.id
JOIN trace_range TR
WHERE fs.ipid = :ipid
  AND fs.type = 0
  AND fs.flag <> 2
-- AND (fs.ts - TR.start_ts) >= :startTime
-- AND (fs.ts - TR.start_ts) <= :endTime
ORDER BY fs.vsync ASC;
