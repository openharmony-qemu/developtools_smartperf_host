-- js_heap_summary.sql
-- @required ipid: internal process ID
SELECT
    (m.ts - TR.start_ts) AS ts,
    mf.name AS metric_name,
    m.value
FROM measure m
JOIN process_measure_filter mf ON m.filter_id = mf.id
JOIN trace_range TR
WHERE mf.ipid = :ipid
  AND mf.name LIKE 'js_heap%'
ORDER BY (m.ts - TR.start_ts) ASC;
