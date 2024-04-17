/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {JanksStruct} from "../../bean/JanksStruct";
import {query} from "../SqlLite";

export const queryExpectedFrameDate = (): Promise<Array<JanksStruct>> =>
  query(
    'queryExpectedFrameDate',
    `
    SELECT
        sf.id,
        'frameTime' as frame_type,
        fs.ipid,
        fs.vsync as name,
        fs.dur as app_dur,
        (sf.ts + sf.dur - fs.ts) as dur,
        (fs.ts - TR.start_ts) AS ts,
        fs.type,
        fs.flag,
        pro.pid,
        pro.name as cmdline,
        (sf.ts - TR.start_ts) AS rs_ts,
        sf.vsync AS rs_vsync,
        sf.dur AS rs_dur,
        sf.ipid AS rs_ipid,
        proc.pid AS rs_pid,
        proc.name AS rs_name
    FROM frame_slice AS fs
    LEFT JOIN process AS pro ON pro.id = fs.ipid
    LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
    LEFT JOIN process AS proc ON proc.id = sf.ipid
    LEFT JOIN trace_range TR
    WHERE fs.dst IS NOT NULL
        AND fs.type = 1
    UNION
    SELECT
        -1 as id,
        'frameTime' as frame_type,
        fs.ipid,
        fs.vsync  as name,
        fs.dur as app_dur,
        fs.dur,
        (fs.ts - TR.start_ts) AS ts,
        fs.type,
        fs.flag,
        pro.pid,
        pro.name as cmdline,
        NULL AS rs_ts,
        NULL AS rs_vsync,
        NULL AS rs_dur,
        NULL AS rs_ipid,
        NULL AS rs_pid,
        NULL AS rs_name
    FROM frame_slice AS fs
    LEFT JOIN process AS pro ON pro.id = fs.ipid
    LEFT JOIN trace_range TR
    WHERE fs.dst IS NULL
    AND pro.name NOT LIKE '%render_service%'
    AND fs.type = 1
    ORDER BY ts;`
  );
export const queryJumpJanksData = (processId: number, vsync: number): Promise<Array<any>> =>
  query(
    'queryJumpJanksData',
    `
        SELECT
            fs.id,
            fs.ts - TR.start_ts as ts,
            fs.vsync AS name,
            fs.type,
            fs.dur,
            0 as depth,
            'app' as frame_type,
            fs.src as src_slice,
            fs.flag as jank_tag,
            fs.dst as dst_slice,
            p.pid,
            p.name AS cmdline
        FROM frame_slice AS fs, trace_range as TR
        LEFT JOIN process AS p ON fs.ipid = p.ipid
        WHERE fs.type = 0 and p.pid = $processId and fs.vsync = $vsync;`,{ $processId: processId, $vsync: vsync }
  );
export const queryAllJankProcess = (): Promise<
  Array<{
    pid: number;
  }>
> =>
  query(
    'queryAllJankProcess',
    `
        SELECT DISTINCT p.pid
        FROM frame_slice AS a
        LEFT JOIN process AS p ON a.ipid = p.ipid
        `
  );
export const queryAllActualData = (): Promise<Array<any>> =>
  query(
    'queryAllActualData',
    `
        SELECT 
               a.id,
               (a.ts - TR.start_ts) AS ts,
               a.vsync AS name,
               a.type,
               a.dur,
               a.src AS src_slice,
               a.flag AS jank_tag,
               a.dst AS dst_slice,
               p.pid,
               p.name AS cmdline,
               (case when p.name like '%render_service' then 'render_service' else 'app' end) as frame_type
        FROM frame_slice AS a, trace_range AS TR
                 LEFT JOIN process AS p ON a.ipid = p.ipid
        WHERE a.type = 0
          AND a.flag <> 2
        ORDER BY a.ipid, ts;`
  );
export const queryActualFrameDate = (): Promise<Array<any>> =>
  query(
    'queryActualFrameDate',
    `SELECT
         sf.id,
         'frameTime' as frame_type,
         fs.ipid,
         fs.vsync as name,
         fs.dur as app_dur,
         (sf.ts + sf.dur - fs.ts) as dur,
         (fs.ts - TR.start_ts) AS ts,
         fs.type,
         (case when (sf.flag == 1 or fs.flag == 1 ) then 1  when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jank_tag,
         pro.pid,
         pro.name as cmdline,
         (sf.ts - TR.start_ts) AS rs_ts,
         sf.vsync AS rs_vsync,
         sf.dur AS rs_dur,
         sf.ipid AS rs_ipid,
         proc.pid AS rs_pid,
         proc.name AS rs_name
     FROM frame_slice AS fs
              LEFT JOIN process AS pro ON pro.id = fs.ipid
              LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
              LEFT JOIN process AS proc ON proc.id = sf.ipid
              LEFT JOIN trace_range TR
     WHERE fs.dst IS NOT NULL
       AND fs.type = 0
       AND fs.flag <> 2
     UNION
     SELECT
         -1 as id,
         'frameTime' as frame_type,
         fs.ipid,
         fs.vsync  as name,
         fs.dur as app_dur,
         fs.dur,
         (fs.ts - TR.start_ts) AS ts,
         fs.type,
         fs.flag as jank_tag,
         pro.pid,
         pro.name as cmdline,
         NULL AS rs_ts,
         NULL AS rs_vsync,
         NULL AS rs_dur,
         NULL AS rs_ipid,
         NULL AS rs_pid,
         NULL AS rs_name
     FROM frame_slice AS fs
              LEFT JOIN process AS pro ON pro.id = fs.ipid
              LEFT JOIN trace_range TR
     WHERE fs.dst IS NULL
       AND pro.name NOT LIKE '%render_service%'
       AND fs.type = 0
       AND fs.flag <> 2
     ORDER BY ts;`
  );
export const querySelectRangeData = (
  allPid: Array<number>,
  leftNs: number,
  rightNs: number): Promise<Array<any>> =>
  query(
    'querySelectRangeData',
    `
    SELECT 
               a.id,
               (a.ts - TR.start_ts) AS startTs,
               a.vsync AS name,
               a.type,
               a.dur,
               a.src AS src_slice,
               a.flag AS jank_tag,
               a.dst AS dst_slice,
               p.pid,
               p.name AS cmdline,
               (case when p.name like '%render_service' then 'render_service' else 'app' end) as frame_type
        FROM frame_slice AS a, trace_range AS TR
                 LEFT JOIN process AS p ON a.ipid = p.ipid
        WHERE a.type = 0
          AND a.flag <> 2
          AND startTs + dur >= ${leftNs}
          AND startTs <= ${rightNs}
          AND p.pid IN (${allPid.join(',')});`
  );