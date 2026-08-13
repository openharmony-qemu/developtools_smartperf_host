-- jank_cpu_context.sql
-- @required ipid: internal process ID
-- @required startTime: start timestamp in NS
-- @required endTime: end timestamp in NS
SELECT
    ts.cpu,
    (ts.ts - TR.start_ts) AS start_ts,
    ts.dur,
    t.name AS thread_name,
    p.name AS process_name,
    ts.itid,
    ts.state
FROM thread_state ts
JOIN thread t ON ts.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ts.cpu IS NOT NULL
  AND ts.dur > 0
  AND t.ipid = :ipid
  AND (ts.ts - TR.start_ts) >= :startTime
  AND (ts.ts - TR.start_ts + ts.dur) <= :endTime
ORDER BY (ts.ts - TR.start_ts) ASC;
