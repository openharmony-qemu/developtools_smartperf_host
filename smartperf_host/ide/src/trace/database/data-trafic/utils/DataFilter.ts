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

const flagInit = -100000000;

export function filterDataByLayer(
  list: unknown[],
  layerKey: string,
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number
): unknown[] {
  let pns = (endNS - startNS) / width; //每个像素多少ns
  let sliceArray = findRange(list, { startKey, durKey, startNS, endNS });
  let groups = groupBy(sliceArray, layerKey);
  let res: unknown[] = [];
  Reflect.ownKeys(
    //@ts-ignore
    groups
  ).map((key: unknown) => {
    //@ts-ignore
    let it = groups[key] as unknown[];
    if (it.length > 0) {
      let sum = 0;
      for (let i = 0; i < it.length; i++) {
        if (i === it.length - 1) {
          //@ts-ignore
          if (it[i][durKey] === undefined || it[i][durKey] === null) {
            //@ts-ignore
            it[i][durKey] = (endNS || 0) - (it[i][startKey] || 0);
          }
        } else {
          //@ts-ignore
          if (it[i][durKey] === undefined || it[i][durKey] === null) {
            //@ts-ignore
            it[i][durKey] = (it[i + 1][startKey] || 0) - (it[i][startKey] || 0);
          }
        }
        //@ts-ignore
        if (it[i][durKey] >= pns || it.length < 100) {
          //@ts-ignore
          it[i].v = true;
        } else {
          if (i > 0) {
            //@ts-ignore
            let c = it[i][startKey] - it[i - 1][startKey] - it[i - 1][durKey];
            if (c < pns && sum < pns) {
              //@ts-ignore
              sum += c + it[i - 1][durKey];
              //@ts-ignore
              it[i].v = false;
            } else {
              //@ts-ignore
              it[i].v = true;
              sum = 0;
            }
          }
        }
      }
      //@ts-ignore
      res.push(...it.filter((it) => it.v));
    }
  });
  return res;
}

export function filterDataByGroup(
  list: unknown[],
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number,
  valueKey?: string,
  filter?: (a: unknown) => boolean,
  fastFilter: boolean = true,
  isDmaFence?: boolean,
): unknown[] {
  if (!fastFilter || filter) {
    let arr = findRange(list, { startKey, durKey, startNS, endNS });
    arr = arr.map((it) => {
      //@ts-ignore
      it.px = Math.floor(it[startKey] / ((endNS - startNS) / width));
      return it;
    });
    let group = groupBy(arr, 'px');
    let res: Set<unknown> = new Set();
    //@ts-ignore
    Reflect.ownKeys(group).map((key: unknown): void => {
      //@ts-ignore
      let arr = group[key] as unknown[];
      if (arr.length > 0) {
        //@ts-ignore
        res.add(arr.reduce((p, c) => (p[durKey] > c[durKey] ? p : c)));
        if (valueKey) {
          //@ts-ignore
          res.add(arr.reduce((p, c) => (p[valueKey] > c[valueKey] ? p : c)));
        }
        if (filter) {
          let filterArr = arr.filter((a) => filter(a));
          if (filterArr && filterArr.length > 0) {
            //@ts-ignore
            res.add(filterArr.reduce((p, c) => (p[durKey] > c[durKey] ? p : c)));
          }
        }
      }
    });
    return [...res];
  } else {
    return filterDataByGroupWithoutValue(list, startKey, durKey, startNS, endNS, width, isDmaFence);
  }
}

function filterDataByGroupWithoutValue(
  list: unknown[],
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number,
  isDmaFence?: boolean,
): unknown[] {
  let arr: unknown[] = [];
  // 标志位，判定何时进行新一轮数据统计处理
  let flag: number = flagInit;
  for (let i = 0; i < list.length; i++) {
    // 筛选符合判断条件的数据，作进一步处理
    //@ts-ignore
    if (list[i][startKey] + list[i][durKey] >= startNS && list[i][startKey] <= endNS) {
      // 获取当前数据的像素值
      let px: number;
      //@ts-ignore  
      if (isDmaFence && list[i][durKey] === 0) {
        //如果是dmafence泳道，则不进行处理
        //@ts-ignore
        px = list[i][startKey] / ((endNS - startNS) / width);
      } else {
        //@ts-ignore
        px = Math.floor(list[i][startKey] / ((endNS - startNS) / width));
      } //@ts-ignore
      list[i].px = px;
      //@ts-ignore
      if (flag === px && arr[arr.length - 1] && list[i][durKey] > arr[arr.length - 1][durKey]) {
        arr[arr.length - 1] = list[i];
      }
      if (flag !== px) {
        flag = px;
        arr.push(list[i]);
      }
    }
  }
  return arr;
}

export function filterDataByGroupLayer(
  list: unknown[],
  layerKey: string,
  startKey: string,
  durKey: string,
  startNS: number,
  endNS: number,
  width: number
): unknown[] {
  let arr = findRange(list, { startKey, durKey, startNS, endNS });
  arr = arr.map((it) => {
    //@ts-ignore
    it.px = Math.floor(it[startKey] / ((endNS - startNS) / width) + it[layerKey] * width);
    //设置临时变量durTmp 用于参与计算，分组后有dur为-1的数据按最长宽度显示
    //@ts-ignore
    it.durTmp =
      //@ts-ignore
      it[durKey] === -1 || it[durKey] === null || it[durKey] === undefined ? endNS - it[startKey] : it[durKey];
    return it;
  });
  let group = groupBy(arr, 'px');
  let res: unknown[] = [];
  //@ts-ignore
  Reflect.ownKeys(group).map((key: unknown) => {
    //@ts-ignore
    let childArray = (group[key] as unknown[]).reduce((p, c) => (p.durTmp > c.durTmp ? p : c));
    res.push(childArray);
  });
  return res;
}

function groupBy(array: Array<unknown>, key: string): unknown {
  return array.reduce((pre, current, index, arr) => {
    //@ts-ignore
    (pre[current[key]] = pre[current[key]] || []).push(current);
    return pre;
  }, {});
}

function findRange(
  fullData: Array<unknown>,
  condition: {
    startKey: string;
    startNS: number;
    durKey: string;
    endNS: number;
  }
): Array<unknown> {
  return fullData.filter(
    (
      it
      //@ts-ignore
    ) => it[condition.startKey] + it[condition.durKey] >= condition.startNS && it[condition.startKey] <= condition.endNS
  );
}
