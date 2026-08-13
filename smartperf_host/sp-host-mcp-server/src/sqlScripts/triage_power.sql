-- triage_power.sql
-- @optional metricName: metric name filter
SELECT
    mf.name AS metric_name,
    COUNT(*) AS sample_count,
    MAX(m.value) AS peak_value,
    MIN(m.value) AS min_value,
    AVG(m.value) AS avg_value
FROM measure m
JOIN measure_filter mf ON m.filter_id = mf.id
JOIN trace_range TR
WHERE mf.type = 'xpower_filter'
  AND (m.ts - TR.start_ts) >= 0
-- AND mf.name = :metricName
GROUP BY mf.name
ORDER BY mf.name;
