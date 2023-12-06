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

import { Utils } from '../../trace/base/Utils';

export const getFormatData = (data: Array<any>) => {
  let arrData: Array<any> = [];
  data.forEach((item, idx) => {
    arrData.push({
      index: idx + 1,
      ...item,
      avg: Utils.getProbablyTime(item.avg),
      max: Utils.getProbablyTime(item.max),
      min: Utils.getProbablyTime(item.min),
      sum: Utils.getProbablyTime(item.sum),
    });
  });
  return arrData;
};

export const getDataNo = (data: Array<any>) => {
  let arrData: Array<any> = [];
  data.forEach((item, idx) => {
    arrData.push({
      index: idx + 1,
      ...item,
    });
  });
  return arrData;
};

export const getInitializeTime = (ns: string) => {
  let hour1 = 3600_000_000_000;
  let minute1 = 60_000_000_000;
  let second1 = 1_000_000_000;
  let millisecond1 = 1_000_000;
  let microsecond1 = 1_000;

  let res = '';
  let currentNs = ns;
  if (currentNs.indexOf('h') != -1) {
    res += Number(currentNs.slice(0, currentNs.length - 1)) * hour1;
  } else if (currentNs.indexOf('m') != -1) {
    res += Number(currentNs.slice(0, currentNs.length - 1)) * minute1;
  } else if (currentNs.indexOf('s') != -1) {
    res += Number(currentNs.slice(0, currentNs.length - 1)) * second1;
  } else if (currentNs.indexOf('ms') != -1) {
    res += Number(currentNs.slice(0, currentNs.length - 2)) * millisecond1;
  } else if (currentNs.indexOf('μs') != -1) {
    res += Number(currentNs.slice(0, currentNs.length - 2)) * microsecond1;
  } else {
    res += Number(currentNs);
  }
  return res;
};
