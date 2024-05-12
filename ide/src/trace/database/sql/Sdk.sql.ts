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
import { CounterStruct } from '../ui-worker/ProduceWorkerSdkCounter';
import { CounterSummary, SdkSliceSummary } from '../../bean/SdkSummary';
import { SdkSliceStruct } from '../ui-worker/ProduceWorkerSdkSlice';

//@ts-ignore
export const querySdkCount = (sql: string, componentId: number, args?: unknown): Promise<Array<unknown>> =>
  query('querySdkCount', sql, args, {
    action: `exec-sdk-${componentId}`
  });

export const querySdkCounterData = (
  sql: string,
  counter_id: number,
  componentId: number
): Promise<Array<CounterStruct>> =>
  query('querySdkCounterData', sql, { $counter_id: counter_id }, {
    action: `exec-sdk-${componentId}`
  });

export const getTabSdkCounterData = (
  sqlStr: string,
  startTime: number,
  leftNs: number,
  rightNs: number,
  counters: Array<string>,
  componentId: number
): Promise<Array<CounterSummary>> =>
  query<CounterSummary>(
    'getTabSdkCounterData',
    sqlStr,
    {
      $startTime: startTime,
      $leftNs: leftNs,
      $rightNs: rightNs,
      $counters: counters,
    },
    {
      action: `exec-sdk-${componentId}`
    }
  );

export const getTabSdkCounterLeftData = (
  sqlStr: string,
  leftNs: number,
  counters: Array<string>,
  componentId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  //@ts-ignore
  query<unknown>(
    'getTabSdkCounterLeftData',
    sqlStr,
    {
      $leftNs: leftNs,
      $counters: counters,
    },
    {
      action: `exec-sdk-${componentId}`
    }
  );

export const getTabSdkSliceData = (
  sqlStr: string,
  startTime: number,
  leftNs: number,
  rightNs: number,
  slices: Array<string>,
  componentId: number
): Promise<Array<SdkSliceSummary>> =>
  query<SdkSliceSummary>(
    'getTabSdkSliceData',
    sqlStr,
    {
      $startTime: startTime,
      $leftNs: leftNs,
      $rightNs: rightNs,
      $slices: slices,
    },
    {
      action: `exec-sdk-${componentId}`
    }
  );

export const querySdkSliceData = (
  sqlStr: string,
  column_id: number,
  startNS: number,
  endNS: number,
  componentId: number
): Promise<Array<SdkSliceStruct>> =>
  query(
    'querySdkSliceData',
    sqlStr,
    { $column_id: column_id, $startNS: startNS, $endNS: endNS },
    {
      action: `exec-sdk-${componentId}`
    }
  );

export const queryCounterMax = (
  sqlStr: string,
  counter_id: number,
  componentId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query('queryCounterMax', sqlStr, { $counter_id: counter_id }, {
    action: `exec-sdk-${componentId}`
  });

