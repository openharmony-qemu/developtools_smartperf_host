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
let timeZones: number = 0;
let maxCommpuPower: number = 0;
let tempIndex: number = 0;
/**
 *
 * @param args.runData 数据库查询上来的running数据，此函数会将数据整理成map结构，分组规则：'cpu'为键，running数据数字为值
 * 
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
    let result: Map<number, Array<RunningData>> = new Map();
    let sum: number = 0;
    // 循环分组
    for (let i = 0; i < args.runData.length; i++) {
        let mapKey: number = args.runData[i].cpu;
        if (!result.has(mapKey)) {
            result.set(mapKey, new Array());
        }
        // 整理左右边界数据问题, 因为涉及多线程，所以必须放在循环里
        if (
            args.runData[i].ts < args.leftNs - args.recordStartNS &&
            args.runData[i].ts + args.runData[i].dur > args.leftNs - args.recordStartNS
        ) {
            args.runData[i].dur = args.runData[i].ts + args.runData[i].dur - (args.leftNs - args.recordStartNS);
            args.runData[i].ts = args.leftNs - args.recordStartNS;
        }
        if (args.runData[i].ts + args.runData[i].dur > args.rightNs - args.recordStartNS) {
            args.runData[i].dur = args.rightNs - args.recordStartNS - args.runData[i].ts;
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
            // @ts-ignore
            dur: args.runData[i].dur,
            ts: args.runData[i].ts
        });
        sum += args.runData[i].dur;
    }
    let cpuFreqArr = args.cpuFreqData.filter((item) => {
        // return (item.ts > args.leftNs && item.ts < args.rightNs) || (item.ts + item.dur > args.leftNs && item.ts + item.dur < args.rightNs);
        return (!(item.ts > args.rightNs || item.ts + item.dur < args.leftNs)) && args.cpuArray.indexOf(item.cpu) !== -1;
    });
    let cpuFreqMap = takeCpuFreqToMap(cpuFreqArr, args.leftNs, args.rightNs);
    return dealRunningData(cpuFreqMap, result, sum, args.cpuArray, args.broCpuData, args.recordStartNS)
}

function dealRunningData(
    cpuFreqData: Map<number, Array<CpuFreqData>>,
    result: Map<number, Array<RunningData>>,
    sum: number,
    cpuList: number[],
    broCpuData: unknown[],
    recordStartNS: number
): Array<RunningFreqData> {
    let returnResult: Map<number, Array<RunningFreqData>> = new Map();
    result.forEach((item, key) => {
        // @ts-ignore
        let itemCpuFreqData: Array<CpuFreqData> = cpuFreqData.get(key);
        let resultList: Array<RunningFreqData> = new Array();
        for (let i = 0; i < item.length; i++) {
            for (let j = 0; j < itemCpuFreqData.length; j++) {
                let flag: number;
                // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间小于频点结束时间减去running数据开始时间的差值的情况
                if (
                    item[i].ts > itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].ts < itemCpuFreqData[j].ts - recordStartNS + itemCpuFreqData[j].dur &&
                    item[i].dur < itemCpuFreqData[j].ts - recordStartNS + itemCpuFreqData[j].dur - item[i].ts
                ) {
                    if (Array.isArray(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!)) {
                        resultList = resultList.concat(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!);
                    } else {
                        // @ts-ignore
                        resultList.push(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 1), broCpuData, recordStartNS)!);
                    }
                    item.splice(i, 1);
                    i--;
                    break;
                }
                if (
                    item[i].ts > itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].ts < itemCpuFreqData[j].ts - recordStartNS + itemCpuFreqData[j].dur &&
                    item[i].dur >= itemCpuFreqData[j].ts - recordStartNS + itemCpuFreqData[j].dur - item[i].ts
                ) {
                    // 当running状态数据的开始时间大于频点数据开始时间,小于频点结束时间。且running数据的持续时间大于等于频点结束时间减去running数据开始时间的差值的情况
                    if (Array.isArray(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!)) {
                        resultList = resultList.concat(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!);
                    } else {
                        // @ts-ignore
                        resultList.push(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 2), broCpuData, recordStartNS)!);
                    }
                }
                // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值小于频点数据持续时间的情况
                if (
                    item[i].ts <= itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].ts + item[i].dur > itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].dur + item[i].ts - (itemCpuFreqData[j].ts - recordStartNS) < itemCpuFreqData[j].dur
                ) {
                    if (Array.isArray(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!)) {
                        resultList = resultList.concat(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!);
                    } else {
                        // @ts-ignore
                        resultList.push(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 3), broCpuData, recordStartNS)!);
                    }
                    item.splice(i, 1);
                    i--;
                    break;
                }
                if (
                    item[i].ts <= itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].ts + item[i].dur > itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].dur + item[i].ts - (itemCpuFreqData[j].ts - recordStartNS) >= itemCpuFreqData[j].dur
                ) {
                    // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间大于频点开始时间。且running数据的持续时间减去频点数据开始时间的差值大于等于频点数据持续时间的情况
                    if (Array.isArray(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!)) {
                        resultList = resultList.concat(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!);
                    } else {
                        // @ts-ignore
                        resultList.push(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 4), broCpuData, recordStartNS)!);
                    }
                }
                if (
                    item[i].ts <= itemCpuFreqData[j].ts - recordStartNS &&
                    item[i].ts + item[i].dur <= itemCpuFreqData[j].ts - recordStartNS
                ) {
                    // 当running状态数据的开始时间小于等于频点数据开始时间,结束时间小于等于频点开始时间的情况
                    if (Array.isArray(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!)) {
                        resultList = resultList.concat(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
                    } else {
                        // @ts-ignore
                        resultList.push(returnObj(item[i], itemCpuFreqData[j], sum, (flag = 5), broCpuData, recordStartNS)!);
                    }
                    item.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
        if (!returnResult.has(key)) {
            returnResult.set(key, new Array());
        }
        returnResult.get(key)?.push(...resultList);
    })
    return dealTree(returnResult);
}

function insertSortedArray(arr: any[], newArr: any[]) {
    const newValue = newArr[0];
    let left = 0;
    let right = arr.length - 1;
    let index = arr.length; // 默认插入到最后
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid][0] < newValue) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    index = left;
    tempIndex = index;
    arr.splice(index, 0, newArr);
    return arr;
}

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
                cpuload: maxCommpuPower ? (computorPower * item.dur) / (timeZones * maxCommpuPower) * PERCENT : 0.00,
                ts: item.ts,
                pid: item.pid,
                tid: item.tid
            };
            break;
        case 2:
            result = {
                thread: item.pid + '_' + item.tid,
                consumption: cpuFreqData.value * (cpuFreqData.ts - recordStartNS + cpuFreqData.dur - item.ts),
                cpu: item.cpu,
                frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
                dur: cpuFreqData.ts - recordStartNS + cpuFreqData.dur - item.ts,
                percent: ((cpuFreqData.ts - recordStartNS + cpuFreqData.dur - item.ts) / sum) * PERCENT,
                consumpower: computorPower * (cpuFreqData.ts - recordStartNS + cpuFreqData.dur - item.ts),
                cpuload: maxCommpuPower ? (computorPower * (cpuFreqData.ts - recordStartNS + cpuFreqData.dur - item.ts)) / (timeZones * maxCommpuPower) * PERCENT : 0.00,
                // @ts-ignore
                ts: item.ts,
                pid: item.pid,
                tid: item.tid
            };
            break;
        case 3:
            result = {
                thread: item.pid + '_' + item.tid,
                consumption: cpuFreqData.value * (item.dur + item.ts - (cpuFreqData.ts - recordStartNS)),
                cpu: item.cpu,
                frequency: computorPower ? cpuFreqData.value / FREQ_MUTIPLE + ': ' + computorPower : cpuFreqData.value / FREQ_MUTIPLE,
                dur: item.dur + item.ts - (cpuFreqData.ts - recordStartNS),
                percent: ((item.dur + item.ts - (cpuFreqData.ts - recordStartNS)) / sum) * PERCENT,
                consumpower: computorPower * (item.dur + item.ts - (cpuFreqData.ts - recordStartNS)),
                cpuload: maxCommpuPower ? (computorPower * (item.dur + item.ts - (cpuFreqData.ts - recordStartNS))) / (timeZones * maxCommpuPower) * PERCENT : 0.00,
                ts: cpuFreqData.ts - recordStartNS,
                pid: item.pid,
                tid: item.tid
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
                cpuload: maxCommpuPower ? (computorPower * cpuFreqData.dur) / (timeZones * maxCommpuPower) * PERCENT : 0.00,
                ts: cpuFreqData.ts - recordStartNS,
                pid: item.pid,
                tid: item.tid
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
                ts: item.ts - recordStartNS,
                pid: item.pid,
                tid: item.tid
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
                    ts: item.ts,
                    pid: item.pid,
                    tid: item.tid
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
                    ts: item.ts,
                    pid: item.pid,
                    tid: item.tid
                }
            ];
            // @ts-ignore
            return resultArr;
        }
    } else {
        return result;
    }
}

function takeCpuFreqToMap(cpuFreqData: Array<CpuFreqData>, leftNs: number, rightNs: number): Map<number, Array<CpuFreqData>> {
    let map: Map<number, Array<CpuFreqData>> = new Map();
    for (let i = 0; i < cpuFreqData.length; i++) {
        if (!map.has(cpuFreqData[i].cpu)) {
            map.set(cpuFreqData[i].cpu, new Array());
        }
        // 分组整理数据
        map.get(cpuFreqData[i].cpu)?.push({
            ts: cpuFreqData[i].ts,
            cpu: cpuFreqData[i].cpu,
            value: cpuFreqData[i].value,
            dur: cpuFreqData[i].dur
        })
    }
    return map;
}

function dealTree(
    params: Map<number, Array<RunningFreqData>>
): Array<RunningFreqData> {
    let result: Array<RunningFreqData> = [];
    params.forEach((item, key) => {
        let cpuData: RunningFreqData = creatNewObj(item[0].cpu, false);
        for (let i = 0; i < item.length; i++) {
            // @ts-ignore
            item[i].cpuThreadName = `${item[i].cpu}/[${item[i].tid}]`;
            // @ts-ignore
            item[i].process = item[i].pid;
            if (item.length < 10) {
                cpuData.children?.push(item[i]);
            };
            // @ts-ignore
            cpuData.cpuThreadName = item[i].cpu;
            cpuData.dur += item[i].dur;
            cpuData.percent += item[i].percent;
            cpuData.consumption += item[i].consumption;
            cpuData.consumpower += item[i].consumpower;
            cpuData.cpuload += item[i].cpuload;
            cpuData.thread = '';
        }
        if (item.length > 10) {
            item.sort((a, b) => a.consumpower - b.consumpower);
            let top10Arr = item.slice(0, 10);
            top10Arr.forEach(e => cpuData.children?.push(e));
        }
        result.push(cpuData);
    })
    result.sort((a, b) => a.cpu - b.cpu);
    return result;
}

function creatNewObj(cpu: number, flag: boolean = true): RunningFreqData {
    return {
        thread: flag ? '' : 'P',
        consumption: 0,
        cpu: cpu,
        frequency: 0,
        dur: 0,
        percent: 0,
        children: [],
        consumpower: 0,
        cpuload: 0
    };
}

self.onmessage = (e: MessageEvent): void => {
    comPower = e.data.comPower;
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
    self.postMessage(result);
}