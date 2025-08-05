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
import { LtpoStruct } from './../ui-worker/ProcedureWorkerLTPO';
import { query } from '../SqlLite';

export const queryPresentInfo = (): Promise<Array<LtpoStruct>> =>
  query(
    'queryPresentInfo',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('Present%'))
  AND name LIKE('H:Waiting for Present Fence%')`
  );

export const queryFanceNameList = (): Promise<Array<LtpoStruct>> =>
  query(
    'queryFanceNameList',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('RSHardwareThrea%'))
  AND name LIKE('H:Present Fence%')`
  );

export const queryFpsNameList = (): Promise<Array<LtpoStruct>> =>
  query(
    'queryFpsNameList',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('RSHardwareThrea%'))
  AND name LIKE('%Layers rate%')`
  );
export const queryRealFpsList = (): Promise<Array<LtpoStruct>> =>
  query(
    'queryRealFpsList',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('RSHardwareThrea%'))
  AND name LIKE('H:RSHardwareThread::PerformSetActiveMode%')`
  );
export const querySignaledList = (): Promise<Array<LtpoStruct>> =>
  query(
    'querySignaledList',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('RSHardwareThrea%'))
    AND name LIKE('%has signaled')`
  );
export const queryRSNowTimeList = (): Promise<Array<LtpoStruct>> =>
  query(
    'queryRSNowTimeList',
    `SELECT ts,dur,name FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('render_service%'))
    AND (name LIKE('H:ReceiveVsync dataCount:24bytes%'))
    OR (name LIKE('H:ReceiveVsync dataCount: 24bytes%'))
    OR (name LIKE('H:ReceiveVsync name:rs dataCount: 24bytes%'))`
  );
export const querySkipDataList = (): Promise<Array<LtpoStruct>> =>
  query(
    'querySkipDataList',
    `SELECT ts FROM "callstack" WHERE callid in (SELECT id FROM "thread" WHERE name LIKE('render_service%'))
    AND name LIKE('H:DisplayNodeSkip skip commit')`
  );
