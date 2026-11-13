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

import { query } from '../SqlLite';
import { NetworkTimeInformation, NetworkRequestStruct, NetworkCountData } from '../../bean/NetworkStruct';

interface SqlParams {
  $leftNS: number;
  $rightNS: number;
  $processId?: number;
  [key: string]: number | undefined;
}

export const queryNetworkTimeInformation = (leftNs: number, rightNs: number, processIds?: Array<number>): Promise<Array<NetworkTimeInformation>> => {
  let sql = `SELECT id, itid, ipid,
              (begin_time - tr.start_ts) as beginTime,
              (dns_end_time - tr.start_ts) as dnsEndTime,
              (tcp_end_time - tr.start_ts) as tcpEndTime,
              (tls_end_time - tr.start_ts) as tlsEndTime,
              (first_send_time - tr.start_ts) as firstSendTime,
              (first_recv_time - tr.start_ts) as firstRecvTime,
              (end_time - tr.start_ts) as endTime,
              cache_hit as cacheHit
        FROM network_time_information
        CROSS JOIN trace_range tr
         WHERE $leftNS <= (end_time - tr.start_ts) AND $rightNS >= (begin_time - tr.start_ts)`;

  let params: SqlParams = { $leftNS: leftNs, $rightNS: rightNs };

  if (processIds && processIds.length > 0) {
    const placeholders = processIds.map((_, index) => `$processId${index}`).join(',');
    sql += ` AND ipid IN (${placeholders})`;
    processIds.forEach((pid, index) => {
      params[`$processId${index}`] = pid;
    });
  }

  sql += ` ORDER BY begin_time`;

  return query<NetworkTimeInformation>(
    'queryNetworkTimeInformation',
    sql,
    params
  );
};

export const queryNetworkInformation = (leftNs: number, rightNs: number, processIds?: Array<number>): Promise<Array<NetworkRequestStruct>> => {
  let sql = `SELECT ni.id, nti.ipid, nti.itid, ni.request_id as requestId, ni.protocol, ni.domain, ni.request_uri as requestUri,
             ni.request_method as requestMethod, ni.request_header as requestHeader,
             ni.response_status_code as responseStatusCode, ni.response_header as responseHeader,
             ni.response_effective_url as responseEffectiveUrl, ni.ip_address as ipAddress,
             ni.version, ni.reason_phrase as reasonPhrase,
             (nti.begin_time - tr.start_ts) as startTime, (nti.end_time - tr.start_ts) as endTime,
             (nti.end_time - nti.begin_time) as duration
      FROM network_information ni
       JOIN network_time_information nti ON ni.id = nti.id
       CROSS JOIN trace_range tr
         WHERE $leftNS <= (nti.end_time - tr.start_ts) AND $rightNS >= (nti.begin_time - tr.start_ts)`;

  let params: SqlParams = { $leftNS: leftNs, $rightNS: rightNs };

  if (processIds && processIds.length > 0) {
    const placeholders = processIds.map((_, index) => `$processId${index}`).join(',');
    sql += ` AND nti.ipid IN (${placeholders})`;
    processIds.forEach((pid, index) => {
      params[`$processId${index}`] = pid;
    });
  }

  sql += ` ORDER BY ni.id`;

  return query<NetworkRequestStruct>(
    'queryNetworkInformation',
    sql,
    params
  );
};

export const queryNetworkCountData = (leftNs: number, rightNs: number): Promise<Array<NetworkCountData>> => {
  return query<NetworkCountData>(
    'queryNetworkCountData',
    `SELECT (nti.begin_time - tr.start_ts) as time,
              (nti.end_time - nti.begin_time) as dur,
              (nti.end_time - tr.start_ts) as endTime
       FROM network_time_information nti
       CROSS JOIN trace_range tr
        WHERE $leftNS <= (nti.end_time - tr.start_ts) AND $rightNS >= (nti.begin_time - tr.start_ts)
       ORDER BY nti.begin_time`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
};

export const queryNetworkDetailData = (processId: number, leftNs: number, rightNs: number): Promise<Array<NetworkRequestStruct>> => {
  let sql = `SELECT ni.id, nti.ipid, nti.itid, ni.request_id as requestId, ni.protocol, ni.domain, ni.request_uri as requestUri,
              ni.request_method as requestMethod, ni.request_header as requestHeader,
              ni.response_status_code as responseStatusCode, ni.response_header as responseHeader,
              ni.response_effective_url as responseEffectiveUrl, ni.ip_address as ipAddress,
              ni.version, ni.reason_phrase as reasonPhrase,
              (nti.begin_time - tr.start_ts) as startTime, (nti.end_time - tr.start_ts) as endTime,
              (nti.end_time - nti.begin_time) as duration
       FROM network_information ni
       JOIN network_time_information nti ON ni.id = nti.id
        CROSS JOIN trace_range tr
        WHERE $leftNS <= (nti.end_time - tr.start_ts) AND $rightNS >= (nti.begin_time - tr.start_ts)`;

  let params: SqlParams = { $leftNS: leftNs, $rightNS: rightNs };

  if (processId > 0) {
    sql += ` AND nti.ipid = $processId`;
    params.$processId = processId;
  }

  sql += ` ORDER BY nti.begin_time`;

  return query<NetworkRequestStruct>(
    'queryNetworkDetailData',
    sql,
    params
  );
};

export const queryNetworkSummaryData = (leftNs: number, rightNs: number): Promise<Array<NetworkRequestStruct>> => {
  return query<NetworkRequestStruct>(
    'queryNetworkSummaryData',
    `SELECT ni.id, nti.ipid, nti.itid, ni.request_id as requestId, ni.protocol, ni.domain, ni.request_uri as requestUri,
            ni.request_method as requestMethod, ni.request_header as requestHeader,
            ni.response_status_code as responseStatusCode, ni.response_header as responseHeader,
            ni.response_effective_url as responseEffectiveUrl, ni.ip_address as ipAddress,
            ni.version, ni.reason_phrase as reasonPhrase,
            (nti.begin_time - tr.start_ts) as startTime, (nti.end_time - tr.start_ts) as endTime,
            (nti.end_time - nti.begin_time) as duration
     FROM network_information ni
     JOIN network_time_information nti ON ni.id = nti.id
     CROSS JOIN trace_range tr
      WHERE $leftNS <= (nti.end_time - tr.start_ts) AND $rightNS >= (nti.begin_time - tr.start_ts)
     ORDER BY nti.begin_time`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
};

export const queryNetworkTimeInformationForCount = (leftNs: number, rightNs: number): Promise<Array<NetworkTimeInformation>> => {
  return query<NetworkTimeInformation>(
    'queryNetworkTimeInformationForCount',
    `SELECT id,
              (begin_time - tr.start_ts) as beginTime,
              (end_time - tr.start_ts) as endTime
       FROM network_time_information
       CROSS JOIN trace_range tr
        WHERE $leftNS <= (end_time - tr.start_ts) AND $rightNS >= (begin_time - tr.start_ts)
       ORDER BY begin_time`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
};

export interface ProcessInfo {
  pid: number;
  name: string;
}

export const queryProcessInfo = (ipid: number): Promise<ProcessInfo | undefined> => {
  return query<ProcessInfo>(
    'queryProcessInfo',
    `SELECT pid, name
     FROM process
     WHERE ipid = $ipid`,
    { $ipid: ipid }
  ).then(results => results.length > 0 ? results[0] : undefined);
};

export interface ThreadInfo {
  tid: number;
  name: string;
}

export const queryThreadInfo = (itid: number): Promise<ThreadInfo | undefined> => {
  return query<ThreadInfo>(
    'queryThreadInfo',
    `SELECT tid, name
     FROM thread
     WHERE itid = $itid`,
    { $itid: itid }
  ).then(results => results.length > 0 ? results[0] : undefined);
};

export const queryNetworkTimeInformationById = (ipid: number, itid: number): Promise<NetworkTimeInformation | undefined> => {
  return query<NetworkTimeInformation>(
    'queryNetworkTimeInformationById',
    `SELECT
       nti.id,
       nti.ipid,
       nti.itid,
       (nti.begin_time - tr.start_ts) as beginTime,
       (nti.dns_end_time - tr.start_ts) as dnsEndTime,
       (nti.tcp_end_time - tr.start_ts) as tcpEndTime,
       (nti.tls_end_time - tr.start_ts) as tlsEndTime,
       (nti.first_send_time - tr.start_ts) as firstSendTime,
       (nti.first_recv_time - tr.start_ts) as firstRecvTime,
       (nti.end_time - tr.start_ts) as endTime,
       nti.cache_hit as cacheHit,
       (nti.tls_end_time - nti.begin_time) as blocked,
       (nti.first_recv_time - nti.first_send_time) as waiting,
       (nti.end_time - nti.first_recv_time) as receive,
       (nti.dns_end_time - nti.begin_time) as dns,
       (nti.tcp_end_time - nti.dns_end_time) as tcp,
       (nti.tls_end_time - nti.tcp_end_time) as tls,
       (nti.begin_time - tr.start_ts) as blockedStartTime,
       (nti.tls_end_time - tr.start_ts) as blockedEndTime,
       (nti.first_send_time - tr.start_ts) as waitingStartTime,
       (nti.first_recv_time - tr.start_ts) as waitingEndTime,
       (nti.first_recv_time - tr.start_ts) as receiveStartTime,
       (nti.end_time - tr.start_ts) as receiveEndTime,
       (nti.begin_time - tr.start_ts) as dnsStartTime,
       (nti.dns_end_time - tr.start_ts) as dnsEndTimeCalc,
       (nti.dns_end_time - tr.start_ts) as tcpStartTime,
       (nti.tcp_end_time - tr.start_ts) as tcpEndTimeCalc,
       (nti.tcp_end_time - tr.start_ts) as tlsStartTime,
       (nti.tls_end_time - tr.start_ts) as tlsEndTimeCalc,
       p.pid,
       t.tid
       FROM network_time_information nti
       CROSS JOIN trace_range tr
       LEFT JOIN process p ON nti.ipid = p.ipid
       LEFT JOIN thread t ON nti.itid = t.itid
       WHERE nti.ipid = $ipid AND nti.itid = $itid`,
     { $ipid: ipid, $itid: itid }
  ).then(results => results.length > 0 ? results[0] : undefined);
};
