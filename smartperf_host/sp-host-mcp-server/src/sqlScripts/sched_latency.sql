-- sched_latency.sql
-- @optional itid: internal thread ID
SELECT
    ss.itid,
    t.name AS thread_name,
    p.name AS process_name,
    (ss.ts - TR.start_ts) AS ready_ts,
    ss.dur AS sched_latency,
    ss.cpu,
    ss.end_state,
    ss.priority
FROM sched_slice ss
JOIN thread t ON ss.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ss.dur > 0
  AND (ss.ts - TR.start_ts) >= 0
-- AND ss.itid = :itid
ORDER BY ss.dur DESC
LIMIT 100;
