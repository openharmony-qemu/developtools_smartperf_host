-- triage_network.sql
-- @optional ipid: internal process ID
SELECT
    p.name AS process_name,
    p.ipid,
    COUNT(*) AS request_count,
    SUM(CASE WHEN nti.cache_hit = 1 THEN 1 ELSE 0 END) AS cache_hit_count,
    AVG(nti.end_time - nti.begin_time) AS avg_duration
FROM network_time_information nti
JOIN process p ON nti.ipid = p.ipid
JOIN trace_range TR
WHERE (nti.begin_time - TR.start_ts) >= 0
-- AND nti.ipid = :ipid
GROUP BY p.name, p.ipid
ORDER BY request_count DESC
LIMIT 50;
