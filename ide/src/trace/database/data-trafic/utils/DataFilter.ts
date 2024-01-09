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
export function filterData(
  list: any[],
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number
): any[] {
  let pns = (endNS - startNS) / width; //每个像素多少ns
  let slice = findRange(list, {startKey, durKey, startNS, endNS});
  let sum = 0;
  for (let i = 0; i < slice.length; i++) {
    if (i === slice.length - 1) {
      if (slice[i][durKey] === undefined || slice[i][durKey] === null) {
        slice[i][durKey] = (endNS || 0) - (slice[i][startKey] || 0);
      }
    } else {
      if (slice[i][durKey] === undefined || slice[i][durKey] === null) {
        slice[i][durKey] = (slice[i + 1][startKey] || 0) - (slice[i][startKey] || 0);
      }
    }
    if (slice[i][durKey] >= pns || slice.length < 100) {
      slice[i].v = true;
    } else {
      if (i > 0) {
        let c = slice[i][startKey] - slice[i - 1][startKey] - slice[i - 1][durKey];
        if (c < pns && sum < pns) {
          sum += c + slice[i - 1][durKey];
          slice[i].v = false;
        } else {
          slice[i].v = true;
          sum = 0;
        }
      }
    }
  }
  return slice.filter((it) => it.v);
}

export function filterDataByLayer(
  list: any[],
  layerKey: string,
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number
): any[] {
  let pns = (endNS - startNS) / width; //每个像素多少ns
  let sliceArray = findRange(list, {startKey, durKey, startNS, endNS});
  let groups = groupBy(sliceArray, layerKey);
  let res: any[] = [];
  Reflect.ownKeys(groups).map((key: any) => {
    let slice = groups[key] as any[];
    if (slice.length > 0) {
      let sum = 0;
      for (let i = 0; i < slice.length; i++) {
        if (i === slice.length - 1) {
          if (slice[i][durKey] === undefined || slice[i][durKey] === null) {
            slice[i][durKey] = (endNS || 0) - (slice[i][startKey] || 0);
          }
        } else {
          if (slice[i][durKey] === undefined || slice[i][durKey] === null) {
            slice[i][durKey] = (slice[i + 1][startKey] || 0) - (slice[i][startKey] || 0);
          }
        }
        if (slice[i][durKey] >= pns || slice.length < 100) {
          slice[i].v = true;
        } else {
          if (i > 0) {
            let c = slice[i][startKey] - slice[i - 1][startKey] - slice[i - 1][durKey];
            if (c < pns && sum < pns) {
              sum += c + slice[i - 1][durKey];
              slice[i].v = false;
            } else {
              slice[i].v = true;
              sum = 0;
            }
          }
        }
      }
      res.push(...slice.filter((it) => it.v));
    }
  });
  return res;
}

export function filterDataByGroup(
  list: any[],
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number,
  valueKey?: string,
  filter?: (a: any) => boolean): any[] {
  let arr = findRange(list, {startKey, durKey, startNS, endNS})
  arr = arr.map((it) => {
    it.px = Math.floor(it[startKey] / ((endNS - startNS) / width));
    return it;
  });
  let group = groupBy(arr, 'px');
  let res: Set<any> = new Set();
  Reflect.ownKeys(group).map((key: any): void => {
    let arr = group[key] as any[];
    if (arr.length > 0) {
      res.add(arr.reduce((p, c) => (p[durKey] > c[durKey]) ? p : c));
      if (valueKey) {
        res.add(arr.reduce((p, c) => (p[valueKey] > c[valueKey]) ? p : c));
      }
      if (filter) {
        let filterArr = arr.filter(a => filter(a));
        if (filterArr && filterArr.length > 0) {
          res.add(filterArr.reduce((p, c) => (p[durKey] > c[durKey]) ? p : c));
        }
      }
    }
  });
  return [...res];
}

export function filterDataByGroupLayer(
  list: any[],
  layerKey: string,
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number
): any[] {
  let arr = findRange(list, {startKey, durKey, startNS, endNS});
  arr = arr.map((it) => {
    it.px = Math.floor(it[startKey] / ((endNS - startNS) / width) + it[layerKey] * width);
    //设置临时变量durTmp 用于参与计算，分组后有dur为-1的数据按最长宽度显示
    it.durTmp = it[durKey] === -1 ? (endNS - it[startKey]) : it[durKey];
    return it;
  });
  let group = groupBy(arr, 'px');
  let res: any[] = [];
  Reflect.ownKeys(group).map((key: any) => {
    let childArray = (group[key] as any[]).reduce((p, c) => (p.durTmp > c.durTmp) ? p : c);
    res.push(childArray);
  });
  return res;
}

function groupBy(array: Array<any>, key: string): any {
  return array.reduce((pre, current, index, arr) => {
    (pre[current[key]] = pre[current[key]] || []).push(current);
    return pre;
  }, {});
}

function findRange(
  fullData: Array<any>,
  condition: {
    startKey: string;
    startNS: number;
    durKey: string;
    endNS: number;
  }
): Array<any> {
  return fullData.filter(it => it[condition.startKey] + it[condition.durKey] >= condition.startNS && it[condition.startKey] <= condition.endNS);
}
