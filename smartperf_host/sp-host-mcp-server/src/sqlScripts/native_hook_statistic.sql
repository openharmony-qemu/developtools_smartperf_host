-- native_hook_statistic.sql
-- @required ipid: internal process ID
-- @optional eventType: MemoryStatisticType integer (0-21)
SELECT
    nhs.id,
    (nhs.ts - TR.start_ts) AS ts,
    nhs.type,
    nhs.sub_type_id,
    nhs.apply_count,
    nhs.release_count,
    nhs.apply_size,
    nhs.release_size,
    nhs.last_lib_id
FROM native_hook_statistic nhs
JOIN trace_range TR
WHERE nhs.ipid = :ipid
-- AND nhs.type = :eventType
ORDER BY (nhs.ts - TR.start_ts) ASC
LIMIT 200;
