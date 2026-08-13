-- triage_cpu.sql
-- @optional cpuId: CPU core ID
SELECT
    ts.cpu,
    COUNT(*) AS slice_count,
    SUM(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS total_duration,
    AVG(iif(ts.dur = -1 OR ts.dur IS NULL, 0, ts.dur)) AS avg_duration,
    t.name AS thread_name,
    p.name AS process_name,
    ts.itid
FROM thread_state ts
JOIN thread t ON ts.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE ts.cpu IS NOT NULL
  AND ts.dur > 0
  AND (ts.ts - TR.start_ts) >= 0
-- AND ts.cpu = :cpuId
GROUP BY ts.cpu, ts.itid, t.name, p.name
ORDER BY total_duration DESC
LIMIT 50;
