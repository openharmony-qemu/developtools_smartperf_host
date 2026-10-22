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

-- native_hook_detail.sql
-- @required ipid: internal process ID
-- @optional eventType: event type string
SELECT
    nh.id,
    (nh.start_ts - TR.start_ts) AS start_ts,
    nh.dur,
    nh.event_type,
    nh.heap_size,
    nh.addr,
    nh.sub_type_id,
    nh.last_lib_id,
    t.name AS thread_name
FROM native_hook nh
JOIN thread t ON nh.itid = t.id
JOIN trace_range TR
WHERE nh.ipid = :ipid
-- AND nh.event_type = :eventType
ORDER BY (nh.start_ts - TR.start_ts) ASC
LIMIT 200;
