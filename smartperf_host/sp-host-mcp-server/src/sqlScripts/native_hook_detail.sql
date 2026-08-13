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
