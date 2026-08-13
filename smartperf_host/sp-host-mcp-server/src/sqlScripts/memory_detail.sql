-- memory_detail.sql
-- @required ipid: internal process ID
-- @optional metric: metric name like 'mem.rss'
SELECT
    (m.ts - TR.start_ts) AS ts,
    mf.name AS metric_name,
    m.value
FROM measure m
JOIN process_measure_filter mf ON m.filter_id = mf.id
JOIN trace_range TR
WHERE mf.ipid = :ipid
  AND mf.name IN ('mem.rss', 'mem.pss', 'mem.vss', 'mem.heap_size')
-- AND mf.name = :metric
ORDER BY (m.ts - TR.start_ts) ASC;
