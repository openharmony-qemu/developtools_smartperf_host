-- triage_io.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    fio.is_write,
    fio.is_block,
    COUNT(*) AS io_count,
    SUM(fio.duration) AS total_duration,
    AVG(fio.duration) AS avg_duration,
    SUM(fio.request_bytes) AS total_size
FROM filesystem_io fio
JOIN thread t ON fio.itid = t.id
JOIN process p ON t.ipid = p.id
JOIN trace_range TR
WHERE (fio.start_time - TR.start_ts) >= 0
-- AND t.ipid = :ipid
GROUP BY p.name, p.ipid, fio.is_write, fio.is_block
ORDER BY total_duration DESC
LIMIT 50;
