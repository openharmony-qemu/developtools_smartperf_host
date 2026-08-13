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
