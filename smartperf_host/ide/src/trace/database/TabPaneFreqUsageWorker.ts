/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

import { type CpuFreqData, type RunningFreqData, type RunningData } from '../component/trace/sheet/frequsage/TabPaneFreqUsageConfig';

let comPower = new Map<number, Map<number, unknown>>();
let resultArray: Array<RunningFreqData> = [];
let timeZones: number = 0;
let maxCommpuPower: number = 0;
let tempIndex: number = 0;

/**
 *
 * @param args.runData 数据库查询上来的running数据，此函数会将数据整理成map结构，分组规则：'pid_tid'为键，running数据数字为值
 * @returns 返回map对象及所有running数据的dur和，后续会依此计算百分比
 */
function orgnazitionMap(
  args: {
    runData: Array<RunningData>;
    cpuFreqData: Array<CpuFreqData>;
    leftNs: number;
    rightNs: number;
    cpuArray: number[];
    broCpuData: unknown[];
    recordStartNS: number;
  }
): Array<RunningFreqData> {
  let result: Map<string, Array<RunningData>> = new Map();
  let sum: number = 0;
  // 循环分组
  for (let i = 0; i < args.runData.length; i++) {
    let mapKey: string = args.runData[i].pid + '_' + args.runData[i].tid;
    // 该running数据若在map对象中不包含其'pid_tid'构成的键，则新加key-value值
    if (!result.has(mapKey)) {
      result.set(mapKey, new Array());
    }
    // 整理左右边界数据问题, 因为涉及多线程，所以必须放在循环里
    if (
      args.runData[i].ts < args.leftNs &&
      args.runData[i].ts + args.runData[i].dur > args.leftNs
    ) {
      args.runData[i].dur = args.runData[i].ts + args.runData[i].dur - args.leftNs;
      args.runData[i].ts = args.leftNs;
    }
    if (args.runData[i].ts + args.runData[i].dur > args.rightNs) {
      args.runData[i].dur = args.rightNs - args.runData[i].ts;
    }
    // 特殊处理数据表中dur为负值的情况
    if (args.runData[i].dur < 0) {
      args.runData[i].dur = 0;
    }
    // 分组整理数据
    result.get(mapKey)?.push({
      pid: args.runData[i].pid,
      tid: args.runData[i].tid,
      cpu: args.runData[i].cpu,
      dur: args.runData[i].dur,
      ts: args.runData[i].ts,
    });
    sum += args.runData[i].dur;
  }
  return dealCpuFreqData(args.cpuFreqData, result, sum, args.cpuArray, args.broCpuData, args.recordStartNS);
}

/**
 *
 * @param cpuFreqData cpu频点数据的数组
 * @param result running数据的map对象
 * @param sum running数据的时间和
 * @returns 返回cpu频点数据map，'pid_tid'为键，频点算力值数据的数组为值
 */
function dealCpuFreqData(
  cpuFreqData: Array<CpuFreqData>,
  result: Map<string, Array<RunningData>>,
  sum: number,
  cpuList: number[],
  broCpuData: unknown[],
  recordStartNS: number
): Array<RunningFreqData> {
  let runningFreqData: Map<string, Array<RunningFreqData>> = new Map();
  result.forEach((item, key) => {
    let resultList: Array<RunningFreqData> = new Array();
    for (let i = 0; i < item.length; i++) {
      for (let j = 0; j < cpuFreqData.length; j++) {
        let flag: number;
        if (item[i].cpu === cpuFreqData[j].cpu) {
          // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间小于频点结束时间减去running数据开始时间的差值的情况
          if (
            item[i].ts > cpuFreqData[j].ts &&
            item[i].ts < cpuFreqData[j].ts + cpuFreqData[j].dur &&
            item[i].dur < cpuFreqData[j].ts + cpuFreqData[j].dur - item[i].ts
          ) {
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!);
            }
            item.splice(i, 1);
            i--;
            break;
          }
          if (
            item[i].ts > cpuFreqData[j].ts &&
            item[i].ts < cpuFreqData[j].ts + cpuFreqData[j].dur &&
            item[i].dur >= cpuFreqData[j].ts + cpuFreqData[j].dur - item[i].ts
          ) {
            // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间大于等于频点结束时间减去running数据开始时间的差值的情况
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!);
            }
          }
          // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值小于频点数据持续时间的情况
          if (
            item[i].ts <= cpuFreqData[j].ts &&
            item[i].ts + item[i].dur > cpuFreqData[j].ts &&
            item[i].dur + item[i].ts - cpuFreqData[j].ts < cpuFreqData[j].dur
          ) {
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!);
            }
            item.splice(i, 1);
            i--;
            break;
          }
          if (
            item[i].ts <= cpuFreqData[j].ts &&
            item[i].ts + item[i].dur > cpuFreqData[j].ts &&
            item[i].dur + item[i].ts - cpuFreqData[j].ts >= cpuFreqData[j].dur
          ) {
            // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值大于等于频点数据持续时间的情况
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!);
            }
          }
          if (
            item[i].ts <= cpuFreqData[j].ts &&
            item[i].ts + item[i].dur <= cpuFreqData[j].ts
          ) {
            // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间小于等于频点开始时间的情况
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
            }
            item.splice(i, 1);
            i--;
            break;
          }
        } else {
          if (!cpuList.includes(item[i].cpu)) {
            if (Array.isArray(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!)) {
              resultList = resultList.concat(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
            } else {
              // @ts-ignore
              resultList.push(returnObj(item[i], cpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
            }
            item.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
    runningFreqData.set(key, mergeSameData(resultList));
  });
  return dealTree(runningFreqData);
}

function insertSortedArray(arr: any[], newArr: any[]) {
  const newValue = newArr[0];
  let left = 0;
  let right = arr.length - 1;
  let index = arr.length; // 默认插入到最后
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if(arr[mid][0] < newValue) {
      left = mid +1;
    }else{
      right = mid - 1;
    }
  }
  index = left;
  tempIndex = index;
  arr.splice(index,0,newArr);
  return arr;
}

/**
 *
 * @param item running数据
 * @param cpuFreqData 频点数据
 * @param sum running总和
 * @param flag 标志位，根据不同值返回不同结果
 * @param broCpuData 所有CPU数据
 * @returns 返回新的对象
 */
function returnObj(
  item: RunningData,
  cpuFreqData: CpuFreqData,
  sum: number,
  flag: number,
  broCpuData: Array<unknown>,
  recordStartNS: number
): RunningFreqData | undefined {
  const PERCENT: number = 100;
  const FREQ_MUTIPLE: number = 1000;
  let computorPower: number = 0;
  //@ts-ignore
  if (comPower && !comPower.get(item.cpu)?.mapData.has(cpuFreqData.value)) {
    //@ts-ignore
    const mapDataArr = Array.from(comPower.get(item.cpu)?.mapData.entries()).sort((a, b) => a[0] - b[0]);
    // 当遗漏的算力频点小于原始数据中最小的key
    // @ts-ignore
    if (Number(cpuFreqData.value) < Number(mapDataArr[0][0])) {
      // @ts-ignore
      computorPower = mapDataArr[0][1] - ((mapDataArr[1][1] - mapDataArr[0][1]) * (mapDataArr[0][0] - cpuFreqData.value) / (mapDataArr[1][0] - mapDataArr[0][0]));
      // @ts-ignore
      // 当遗漏的算力频点大于原始数据中最大的key
    } else if (Number(cpuFreqData.value) > Number(mapDataArr[mapDataArr.length - 1][0])) {
      // @ts-ignore
      // 最后一个频点
      let lastKey = mapDataArr[mapDataArr.length - 1][0];
      // @ts-ignore
      // 最后一个频点对应的算力
      let lastValue = mapDataArr[mapDataArr.length - 1][1];
      // @ts-ignore
      // 倒数第二频点
      let lastTwoKey = mapDataArr[mapDataArr.length - 2][0];
      // @ts-ignore
      // 倒数第二频点对应的算力
      let lastTwoValue = mapDataArr[mapDataArr.length - 2][1];
      computorPower = ((lastValue - lastTwoValue) * (cpuFreqData.value - lastKey) / (lastKey - lastTwoKey)) + lastValue;
    } else {
      // @ts-ignore
      let tempArr = insertSortedArray(mapDataArr, [cpuFreqData.value, null]);
      computorPower = ((tempArr[tempIndex + 1][1] - tempArr[tempIndex - 1][1]) * (cpuFreqData.value - tempArr[tempIndex - 1][0]) / (tempArr[tempIndex + 1][0] - tempArr[tempIndex - 1][0])) + tempArr[tempIndex - 1][1];
    }
  } else {
    // @ts-ignore
    computorPower = comPower ? comPower.get(item.cpu)?.mapData.get(cpuFreqData.value)! : 0;
  }
  let result: RunningFreqData | undefined;
  switch (flag) {
    case 1:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: cpuFreqData.value * item.dur,
        cpu: item.cpu,
        frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
        dur: item.dur,
        percent: (item.dur / sum) * PERCENT,
        consumpower: computorPower * item.dur,
        cpuload: (computorPower * item.dur) / (timeZones * maxCommpuPower) * PERCENT,
        // @ts-ignore
        ts: item.ts - recordStartNS
      };
      break;
    case 2:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: cpuFreqData.value * (cpuFreqData.ts + cpuFreqData.dur - item.ts),
        cpu: item.cpu,
        frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
        dur: cpuFreqData.ts + cpuFreqData.dur - item.ts,
        percent: ((cpuFreqData.ts + cpuFreqData.dur - item.ts) / sum) * PERCENT,
        consumpower: computorPower * (cpuFreqData.ts + cpuFreqData.dur - item.ts),
        cpuload: (computorPower * (cpuFreqData.ts + cpuFreqData.dur - item.ts)) / (timeZones * maxCommpuPower) * PERCENT,
        // @ts-ignore
        ts: item.ts - recordStartNS
      };
      break;
    case 3:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: cpuFreqData.value * (item.dur + item.ts - cpuFreqData.ts),
        cpu: item.cpu,
        frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
        dur: item.dur + item.ts - cpuFreqData.ts,
        percent: ((item.dur + item.ts - cpuFreqData.ts) / sum) * PERCENT,
        consumpower: computorPower * (item.dur + item.ts - cpuFreqData.ts),
        cpuload: (computorPower * (item.dur + item.ts - cpuFreqData.ts)) / (timeZones * maxCommpuPower) * PERCENT,
        // @ts-ignore
        ts: (cpuFreqData.ts - recordStartNS)
      };
      break;
    case 4:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: cpuFreqData.value * cpuFreqData.dur,
        cpu: item.cpu,
        frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
        dur: cpuFreqData.dur,
        percent: (cpuFreqData.dur / sum) * PERCENT,
        consumpower: computorPower * cpuFreqData.dur,
        cpuload: (computorPower * cpuFreqData.dur) / (timeZones * maxCommpuPower) * PERCENT,
        // @ts-ignore
        ts: (cpuFreqData.ts - recordStartNS)
      };
      break;
    case 5:
      result = {
        thread: item.pid + '_' + item.tid,
        consumption: 0,
        cpu: item.cpu,
        frequency: 'unknown',
        dur: item.dur,
        percent: (item.dur / sum) * PERCENT,
        consumpower: 0,
        cpuload: 0,
        // @ts-ignore
        ts: (item.ts - recordStartNS)
      };
      break;
  }
  // @ts-ignore
  if (comPower && comPower!.get(item.cpu) && (comPower!.get(item.cpu).broId || comPower!.get(item.cpu).broId === 0) && comPower!.get(item.cpu).smtRate) {
    // @ts-ignore
    let broCpuDataList = broCpuData.filter((e) => (e.cpu === comPower!.get(item.cpu).broId) && // @ts-ignore
      !(e.startTime >= result!.ts + result!.dur || e.endTime <= result!.ts));
    let parallelDur = 0;
    broCpuDataList.forEach((e) => {
      // @ts-ignore
      if (e.startTime <= result!.ts && e.endTime >= result!.ts + result!.dur) {
        parallelDur += result!.dur;
        // @ts-ignore
      } else if (e.startTime <= result!.ts && e.endTime < result!.ts + result!.dur && e.endTime >= result!.ts) {
        // @ts-ignore
        parallelDur += e.endTime - result!.ts;
        // @ts-ignore
      } else if (e.startTime > result!.ts && e.endTime >= result!.ts + result!.dur && e.startTime <= result!.ts + result!.dur) {
        // @ts-ignore
        parallelDur += result!.ts + result!.dur - e.startTime;
      } else {
        // @ts-ignore
        parallelDur += e.dur;
      }
    });
    if (parallelDur === 0) {
      return result;
    } else if (parallelDur === result!.dur) {
      // @ts-ignore
      result.consumpower = result.consumpower * comPower!.get(item.cpu).smtRate;
      // @ts-ignore
      result.frequency = cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower * comPower!.get(item.cpu).smtRate + '*';
      // @ts-ignore
      result.cpuload = result.consumpower / (timeZones * maxCommpuPower) * PERCENT;
      return result;
    } else {
      let resultArr = [
        {
          thread: item.pid + '_' + item.tid,
          consumption: cpuFreqData.value * (result!.dur - parallelDur),
          cpu: item.cpu,
          frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
          dur: result!.dur - parallelDur,
          percent: ((result!.dur - parallelDur) / sum) * PERCENT,
          consumpower: computorPower * (result!.dur - parallelDur),
          cpuload: (computorPower * (result!.dur - parallelDur)) / (timeZones * maxCommpuPower) * PERCENT,
          // @ts-ignore
          ts: item.ts - recordStartNS
        },
        {
          thread: item.pid + '_' + item.tid,
          consumption: cpuFreqData.value * parallelDur,
          cpu: item.cpu,
          // @ts-ignore
          frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower * comPower!.get(item.cpu).smtRate + '*' : cpuFreqData.value / FREQ_MUTIPLE,
          dur: parallelDur,
          percent: (parallelDur / sum) * PERCENT,
          // @ts-ignore
          consumpower: computorPower * parallelDur * comPower!.get(item.cpu).smtRate,
          // @ts-ignore
          cpuload: (computorPower * parallelDur * comPower!.get(item.cpu).smtRate) / (timeZones * maxCommpuPower) * PERCENT,
          // @ts-ignore
          ts: item.ts - recordStartNS
        }
      ];
      // @ts-ignore
      return resultArr;
    }
  } else {
    return result;
  }
}

/**
 *
 * @param resultList 单线程内running数据与cpu频点数据整合成的数组
 */
function mergeSameData(
  resultList: Array<RunningFreqData>
): Array<RunningFreqData> {
  let cpuFreqArr: Array<RunningFreqData> = [];
  let cpuArr: Array<number> = [];
  //合并同一线程内，当运行所在cpu和频点相同时，dur及percent进行累加求和
  for (let i = 0; i < resultList.length; i++) {
    if (!cpuArr.includes(resultList[i].cpu)) {
      cpuArr.push(resultList[i].cpu);
      cpuFreqArr.push(creatNewObj(resultList[i].cpu));
    }
    for (let j = i + 1; j < resultList.length; j++) {
      if (
        resultList[i].cpu === resultList[j].cpu &&
        resultList[i].frequency === resultList[j].frequency
      ) {
        resultList[i].dur += resultList[j].dur;
        resultList[i].percent += resultList[j].percent;
        resultList[i].consumption += resultList[j].consumption;
        resultList[i].consumpower += resultList[j].consumpower;
        resultList[i].cpuload += resultList[j].cpuload;
        resultList.splice(j, 1);
        j--;
      }
    }
    cpuFreqArr.find(function (item) {
      if (item.cpu === resultList[i].cpu) {
        item.children?.push(resultList[i]);
        item.children?.sort((a, b) => b.consumption - a.consumption);
        item.dur += resultList[i].dur;
        item.percent += resultList[i].percent;
        item.consumption += resultList[i].consumption;
        item.consumpower += resultList[i].consumpower;
        item.cpuload += resultList[i].cpuload;
        item.thread = resultList[i].thread;
      }
    });
  }
  cpuFreqArr.sort((a, b) => a.cpu - b.cpu);
  return cpuFreqArr;
}

/**
 *
 * @param params cpu层级的数据
 * @returns 整理好的进程级数据
 */
function dealTree(
  params: Map<string, Array<RunningFreqData>>
): Array<RunningFreqData> {
  let result: Array<RunningFreqData> = [];
  params.forEach((item, key) => {
    let process: RunningFreqData = creatNewObj(-1, false);
    let thread: RunningFreqData = creatNewObj(-2);
    for (let i = 0; i < item.length; i++) {
      thread.children?.push(item[i]);
      thread.dur += item[i].dur;
      thread.percent += item[i].percent;
      thread.consumption += item[i].consumption;
      thread.consumpower += item[i].consumpower;
      thread.cpuload += item[i].cpuload;
      thread.thread = item[i].thread;
    }
    process.children?.push(thread);
    process.dur += thread.dur;
    process.percent += thread.percent;
    process.consumption += thread.consumption;
    process.consumpower += thread.consumpower;
    process.cpuload += thread.cpuload;
    process.thread = process.thread! + key.split('_')[0];
    result.push(process);
  });
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].thread === result[j].thread) {
        result[i].children?.push(result[j].children![0]);
        result[i].dur += result[j].dur;
        result[i].percent += result[j].percent;
        result[i].consumption += result[j].consumption;
        result[i].consumpower += result[j].consumpower;
        result[i].cpuload += result[j].cpuload;
        result.splice(j, 1);
        j--;
      }
    }
  }
  return result;
}

/**
 *
 * @param cpu 根据cpu值创建层级结构,cpu < 0为线程、进程层级，其余为cpu层级
 * @returns
 */
function creatNewObj(cpu: number, flag: boolean = true): RunningFreqData {
  return {
    thread: flag ? '' : 'P',
    consumption: 0,
    cpu: cpu,
    frequency: -1,
    dur: 0,
    percent: 0,
    children: [],
    consumpower: 0,
    cpuload: 0
  };
}

/**
 *
 * @param arr 需要整理汇总的频点级数据
 * @returns 返回一个total->cpu->频点的三级树结构数组
 */
function fixTotal(arr: Array<RunningFreqData>): Array<RunningFreqData> {
  let result: Array<RunningFreqData> = [];
  let flag: number = -1;
  // 数据入参的情况是，第一条为进程数据，其后是该进程下所有线程的数据。以进程数据做分割
  for (let i = 0; i < arr.length; i++) {
    // 判断如果是进程数据，则将其children的数组清空，并以其作为最顶层数据
    if (arr[i].thread?.indexOf('P') !== -1) {
      arr[i].children = [];
      arr[i].thread = arr[i].thread + '-summary data';
      result.push(arr[i]);
      // 标志判定当前数组的长度，也可用.length判断
      flag++;
    } else {
      // 非进程数据会进入到else中，去判断当前线程数据的cpu分组是否存在，不存在则进行创建
      if (result[flag].children![arr[i].cpu] === undefined) {
        result[flag].children![arr[i].cpu] = {
          thread: 'summary data',
          consumption: 0,
          cpu: arr[i].cpu,
          frequency: -1,
          dur: 0,
          percent: 0,
          children: [],
          consumpower: 0,
          cpuload: 0
        };
      }
      // 每有一条数据要放到cpu分组下时，则将该cpu分组的各项数据累和
      result[flag].children![arr[i].cpu].consumption += arr[i].consumption;
      result[flag].children![arr[i].cpu].consumpower += arr[i].consumpower;
      result[flag].children![arr[i].cpu].cpuload += arr[i].cpuload;
      result[flag].children![arr[i].cpu].dur += arr[i].dur;
      result[flag].children![arr[i].cpu].percent += arr[i].percent;
      // 查找当前cpu分组下是否存在与当前数据的频点相同的数据，返回相同数据的索引值
      let index: number = result[flag].children![
        arr[i].cpu
      ].children?.findIndex((item) => item.frequency === arr[i].frequency)!;
      // 若存在相同频点的数据，则进行合并，不同直接push
      if (index === -1) {
        arr[i].thread = 'summary data';
        result[flag].children![arr[i].cpu].children?.push(arr[i]);
      } else {
        result[flag].children![arr[i].cpu].children![index].consumption += arr[i].consumption;
        result[flag].children![arr[i].cpu].children![index].consumpower += arr[i].consumpower;
        result[flag].children![arr[i].cpu].children![index].dur += arr[i].dur;
        result[flag].children![arr[i].cpu].children![index].percent += arr[i].percent;
        result[flag].children![arr[i].cpu].children![index].cpuload += arr[i].cpuload;
      }
    }
  }
  return result;
}

/**
 *
 * @param arr1 前次整理好的区分线程的数据
 * @param arr2 不区分线程的Total数据
 */
function mergeTotal(
  arr1: Array<RunningFreqData>,
  arr2: Array<RunningFreqData>
): void {
  for (let i = 0; i < arr1.length; i++) {
    const num: number = arr2.findIndex((item) =>
      item.thread?.includes(arr1[i].thread!)
    );
    arr2[num].thread = 'summary data';
    arr1[i].children?.unshift(arr2[num]);
    arr2.splice(num, 1);
  }
}


/**
 *
 * @param arr 待整理的数组，会经过递归取到最底层的数据
 */
function recursion(arr: Array<RunningFreqData>): void {
  for (let idx = 0; idx < arr.length; idx++) {
    if (arr[idx].cpu === -1) {
      resultArray.push(arr[idx]);
    }
    if (arr[idx].children) {
      recursion(arr[idx].children!);
    } else {
      resultArray.push(arr[idx]);
    }
  }
}

self.onmessage = (e: MessageEvent): void => {
  comPower = e.data.comPower;
  resultArray = [];
  timeZones = e.data.rightNs - e.data.leftNs;
  maxCommpuPower = 0;
  if (comPower) {
    comPower.forEach(item => {
      let maxFreq = 0;
      let commpuPower = 0;
      //@ts-ignore
      for (const i of item.mapData.entries()) {
        if (i[0] > maxFreq) {
          maxFreq = i[0];
          commpuPower = i[1];
        }
      }
      //@ts-ignore
      maxCommpuPower += commpuPower * item.smtRate;
    });
  }
  let result = orgnazitionMap(e.data);
  recursion(result);
  resultArray = JSON.parse(JSON.stringify(resultArray));
  mergeTotal(result, fixTotal(resultArray));
  self.postMessage(result);
};