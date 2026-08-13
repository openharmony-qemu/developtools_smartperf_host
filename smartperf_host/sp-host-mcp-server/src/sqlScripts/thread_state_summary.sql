-- thread_state_summary.sql
-- @required itid: internal thread ID
SELECT
    ts.state,
    COUNT(*) AS state_count,
    SUM(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS total_duration
FROM thread_state ts
JOIN trace_range TR
WHERE ts.itid = :itid
  AND (ts.ts - TR.start_ts) >= 0
GROUP BY ts.state
ORDER BY total_duration DESC;
