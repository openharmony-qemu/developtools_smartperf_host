-- triage_memory.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    mf.name AS metric_name,
    MAX(m.value) AS peak_value,
    MIN(m.value) AS min_value,
    (SELECT m2.value FROM measure m2
     JOIN process_measure_filter mf2 ON m2.filter_id = mf2.id
     WHERE mf2.ipid = p.ipid AND mf2.name = mf.name
     ORDER BY m2.ts DESC LIMIT 1) AS latest_value
FROM process_measure_filter mf
JOIN measure m ON m.filter_id = mf.id
JOIN process p ON mf.ipid = p.id
JOIN trace_range TR
WHERE (m.ts - TR.start_ts) >= 0
  AND mf.name IN ('mem.rss', 'mem.pss', 'mem.vss')
-- AND mf.ipid = :ipid
GROUP BY p.name, p.ipid, mf.name
ORDER BY p.name, mf.name;
