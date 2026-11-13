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

import { BaseStruct } from './BaseStruct';

export interface NetworkPluginConfig {
  pid: number[];
  startupProcessName: string[];
  restartProcessName: string[];
  smbPages: number;
  flushInterval: number;
  block: boolean;
  clockId: string;
}

export interface NetworkRequestStruct extends BaseStruct {
  id: number | undefined;
  ipid: number;
  itid: number;
  requestId: string;
  protocol: string;
  domain: string;
  requestUri: string;
  requestMethod: string;
  requestHeader: string;
  responseStatusCode: number;
  responseHeader: string;
  responseEffectiveUrl: string;
  ipAddress: string;
  version: string;
  reasonPhrase: string;
  startTime: number;
  endTime: number;
  duration: number;
  fromProcessNetworkDetail: boolean;
  clickedLayer?: string;
  timeInfo?: NetworkTimeInformation;
}

export interface NetworkTimeInformation {
  id: number;
  itid: number;
  ipid: number;
  beginTime: number;
  dnsEndTime: number;
  tcpEndTime: number;
  tlsEndTime: number;
  firstSendTime: number;
  firstRecvTime: number;
  endTime: number;
  cacheHit: number;
  pid?: number;
  tid?: number;
  blocked: number;
  waiting: number;
  receive: number;
  dns: number;
  tcp: number;
  tls: number;
  blockedStartTime: number;
  blockedEndTime: number;
  waitingStartTime: number;
  waitingEndTime: number;
  receiveStartTime: number;
  receiveEndTime: number;
  dnsStartTime: number;
  dnsEndTimeCalc: number;
  tcpStartTime: number;
  tcpEndTimeCalc: number;
  tlsStartTime: number;
  tlsEndTimeCalc: number;
}

export interface NetworkCountData extends BaseStruct {
  time: number;
  dur: number;
}

export interface NetworkSummaryData extends BaseStruct {
  id: number;
  requestId: string;
  requestMethod: string;
  protocol: string;
  domain: string;
  uri: string;
  responseCode: number;
  startTime: number;
  endTime: number;
  processId: number;
  threadId: number;
}

export interface ProcessNetworkDetailData extends BaseStruct {
  id: number;
  requestMethod: string;
  url: string;
  statusCode: number;
  startTime: number;
  endTime: number;
  blockedTime: number;
  waitingTime: number;
  responseTime: number;
  dnsTime: number;
  tcpTime: number;
  tlsTime: number;
}

export interface NetworkStatisticsData {
  domain: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  blockMaxTime: number;
  blockAvgTime: number;
  waitingMaxTime: number;
  waitingAvgTime: number;
  receiveMaxTime: number;
  receiveAvgTime: number;
}

export interface NetworkDomainStatistics {
  domain: string;
  ipList: Array<IpStatistics>;
}

export interface IpStatistics {
  ip: string;
  urlList: Array<UrlStatistics>;
}

export interface TransactionData {
  id: number | undefined;
  requestId: string;
  url: string;
  duration: number;
  blockedTime: number;
  waitingTime: number;
  responseTime: number;
  protocol?: string;
  domain?: string;
  requestUri?: string;
  requestMethod?: string;
  requestHeader?: string;
  responseStatusCode?: number;
  responseHeader?: string;
  responseEffectiveUrl?: string;
  ipAddress?: string;
  version?: string;
  reasonPhrase?: string;
}

export interface UrlStatistics {
  url: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  blockMaxTime: number;
  blockAvgTime: number;
  waitingMaxTime: number;
  waitingAvgTime: number;
  receiveMaxTime: number;
  receiveAvgTime: number;
  totalBlockTime: number;
  totalWaitingTime: number;
  totalReceiveTime: number;
  transactions?: TransactionData[];
}

export interface IpSummaryData {
  ipAddress: string;
  count: number;
  totalDuration: number;
  totalDurationStr: string;
  avgDuration: number;
  avgDurationStr: string;
  maxDuration: number;
  maxDurationStr: string;
  blockMaxTime: number;
  blockMaxTimeStr: string;
  blockAvgTime: number;
  blockAvgTimeStr: string;
  waitingMaxTime: number;
  waitingMaxTimeStr: string;
  waitingAvgTime: number;
  waitingAvgTimeStr: string;
  receiveMaxTime: number;
  receiveMaxTimeStr: string;
  receiveAvgTime: number;
  receiveAvgTimeStr: string;
}

export interface NetworkChartDetailItem extends BaseStruct {
  id: number;
  ipid: number | undefined;
  itid: number | undefined;
  requestMethod: string;
  url: string;
  statusCode: number;
  startTime: number | undefined;
  endTime: number | undefined;
  blockedTime: number;
  waitingTime: number;
  responseTime: number;
  dnsTime: number;
  tcpTime: number;
  tlsTime: number;
  dur: number;
  timeInformation: NetworkTimeInformation | undefined;
  domain: string;
  requestUri: string;
  protocol: string;
  requestId: string;
  requestHeader: string;
  responseStatusCode: number;
  responseHeader: string;
  responseEffectiveUrl: string;
  ipAddress: string;
  version: string;
  reasonPhrase: string;
  duration: number;
  layer: number;
  layerHeight: number;
}
