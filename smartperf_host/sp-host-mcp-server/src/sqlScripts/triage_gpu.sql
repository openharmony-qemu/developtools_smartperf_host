-- triage_gpu.sql
SELECT
    (mp.ts - TR.start_ts) AS ts,
    mp.total_size
FROM memory_profile mp
CROSS JOIN trace_range TR
WHERE mp.ts BETWEEN TR.start_ts AND TR.end_ts
ORDER BY (mp.ts - TR.start_ts) ASC
LIMIT 100;
