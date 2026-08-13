-- jank_detail.sql
-- @required ipid: internal process ID
-- @optional startTime: start timestamp in NS
-- @optional endTime: end timestamp in NS
SELECT
    fs.id,
    (fs.ts - TR.start_ts) AS ts,
    fs.dur,
    fs.vsync AS frame_number,
    fs.flag,
    fs.type,
    fs.src AS src_slice,
    fs.dst AS dst_slice,
    p.name AS process_name
FROM frame_slice fs
JOIN process p ON fs.ipid = p.id
JOIN trace_range TR
WHERE fs.ipid = :ipid
  AND fs.type = 0
  AND fs.flag <> 2
-- AND (fs.ts - TR.start_ts) >= :startTime
-- AND (fs.ts - TR.start_ts) <= :endTime
ORDER BY fs.vsync ASC;
