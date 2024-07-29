// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Args } from './CommonArgs';
import { cpuList, processList, sliceList, threadStateList } from './utils/AllMemoryCache';
const dataCache: {
  argSetID: number | null | undefined;
  cpu: number | null | undefined;
  dur: number | null | undefined;
  itid: number | null | undefined;
  pid: number | null | undefined;
  state: string | null | undefined;
  tid: number | null | undefined;
  startTime: number | null | undefined;
} = {
  argSetID: null,
  cpu: null,
  dur: null,
  itid: null,
  pid: null,
  state: null,
  tid: null,
  startTime: null
};
export const sliceSqlMem = (args: Args): string => {
  return `
      SELECT B.pid,                        
             B.cpu,
             B.tid,
             B.itid                       as id,
             B.dur                        AS dur,
             B.state,
             B.ts - ${args.recordStartNS} AS startTime,
             ifnull(B.arg_setid, -1)      as argSetId
      from thread_state AS B
      where B.itid is not null and B.ts + ifnull(B.dur, 0) < ${args.recordEndNS}`;
};

export function sliceReceiver(data: unknown, proc: Function): void {
  let count = {
    cpu: new Map<number, number>(),
  };
  // 存储线程及其状态耗时总和；用以线程泳道排序
  let threadMap = new Map<string, number>();
  let processRowSortMap = new Map<string, number>();
  sliceList.clear();
  cpuList.clear();
  processList.clear();
  threadStateList.clear(); //@ts-ignore
  let list: unknown[] = proc(sliceSqlMem(data.params));
  sliceList.set(0, list);
  for (let i = 0; i < list.length; i++) {
    let slice = list[i]; //@ts-ignore
    // @ts-ignore
    if (slice.pid > 0 && typeof slice.pid === 'number' && slice.state === 'Running') {
      // @ts-ignore
      if (!processRowSortMap.has(slice.pid)) {
        // @ts-ignore
        processRowSortMap.set(slice.pid, slice.dur);
      } else {
        // @ts-ignore
        let val = processRowSortMap.get(slice.pid);
        // @ts-ignore
        processRowSortMap.set(slice.pid, val + slice.dur);
      }
    }// @ts-ignore
    if (slice.cpu !== null && slice.cpu !== undefined) {
      //@ts-ignore
      if (cpuList.has(slice.cpu)) {
        //@ts-ignore
        let arr = cpuList.get(slice.cpu) || [];
        let last = arr[arr.length - 1];
        //@ts-ignore
        if (last && (last.dur === -1 || last.dur === null || last.dur === undefined)) {
          //@ts-ignore
          last.dur = slice.startTime - last.startTime;
        } //@ts-ignore
        cpuList.get(slice.cpu)!.push(slice);
      } else {
        //@ts-ignore
        cpuList.set(slice.cpu, [slice]);
      }
    } //@ts-ignore
    if (slice.pid >= 0 && slice.cpu !== null && slice.cpu !== undefined) {
      //@ts-ignore
      if (processList.has(slice.pid)) {
        //@ts-ignore
        processList.get(slice.pid)!.push(slice);
      } else {
        //@ts-ignore
        processList.set(slice.pid, [slice]);
      }
    } //@ts-ignore
    if (slice.pid >= 0 && slice.tid >= 0) {
      //@ts-ignore
      let key = `${slice.pid}-${slice.tid}`;
      if (threadStateList.has(key)) {
        threadStateList.get(key)!.push(slice);
      } else {
        threadStateList.set(key, [slice]);
      }
      // @ts-ignore
      if (slice.state === 'S' || typeof slice.dur !== 'number' || slice.tid === 0) {
        continue;
      } else {
        // @ts-ignore
        if (!threadMap.has(key)) {
          // @ts-ignore
          threadMap.set(key, slice.dur);
        } else {
          // @ts-ignore
          let val = threadMap.get(key);
          // @ts-ignore
          threadMap.set(key, val + slice.dur);
        }
      }
    }
  }
  for (let key of cpuList.keys()) {
    let arr = cpuList.get(key) || [];
    count.cpu.set(key, arr.length);
  }
  //处理threadList最后一个符合条件的dur
  for (let key of threadStateList.keys()) {
    let arr = threadStateList.get(key) || [];
    let last = arr[arr.length - 1];
    if (!last) {
      continue;
    }
    //@ts-ignore
    switch (last.state) {
      case 'S':
      case 'I':
      case 'T':
      case 'X':
        break;
      default:
        //@ts-ignore
        if (last.dur === -1 || last.dur === null || last.dur === undefined) {
          //@ts-ignore
          let totalNs = data.params.recordEndNS - data.params.recordStartNS; //@ts-ignore
          last.dur = totalNs - last.startTime;
        }
        break;
    }
  }
  //处理热点数据
  //@ts-ignore
  let cpuUtiliRateArray = getCpuUtiliRate(cpuList, data.params);
  postMsg(data, { count, threadMap, processRowSortMap, cpuUtiliRateArray });
}

function getCpuUtiliRate(cpulist: Map<number, Array<unknown>>, args: Args): Array<unknown> {
  // cpu进行排序  
  let cpuListArray = Array.from(cpulist.entries());
  //@ts-ignore
  cpuListArray.sort((a: unknown, b: unknown) => parseInt(a[0]) - parseInt(b[0]));
  let cpuListMap = new Map(cpuListArray);
  let cpuUtiliRateArray = new Array();
  let cell = Math.floor((args.recordEndNS - args.recordStartNS) / 100);//分成100个格子，cell每个格子的持续时间
  for (const [cpu, list] of cpuListMap.entries()) {
    let ro = 0;
    let index = 0;
    let sumTime = 0;
    //@ts-ignore
    let sliceSt = list[0].startTime;//起始时间
    let cellSt = ro * cell;//每个格子起始时间
    let cellEt = (ro + 1) * cell;//每个格子的结束时间
    //@ts-ignore
    while (index < list.length && ro <= 99) {
      let isGoNextRo = false;//标志位，当下格子区间内的cpu切片持续时间是否统计结束，如统计结束true可跳转至下一个格子区间，反之false
      //@ts-ignore
      let sliceEt = list[index].startTime + list[index].dur;//cpu结束时间
      if (sliceSt >= cellSt && sliceEt <= cellEt) {//包含在ro内
        //@ts-ignore
        sumTime += (sliceEt - sliceSt);//cpu dur累加
        //@ts-ignore
        sliceSt = index + 1 >= list.length ? sliceSt : list[index + 1].startTime;//处理最后一条cpu数据
        index++;
      } else if (sliceSt >= cellSt && sliceSt < cellEt && sliceEt > cellEt) {//部分包含在ro内
        sumTime = sumTime + (cellEt - sliceSt);
        sliceSt = cellEt;
        isGoNextRo = true;
      } else if (sliceSt >= cellEt) {//不包含在ro内
        isGoNextRo = true;
      } else {//保护逻辑
        //@ts-ignore
        sliceSt = index + 1 >= list.length ? sliceSt : list[index + 1].startTime;
        index++;
      }
      if (isGoNextRo) {//格子内cpu dur累加结束 跳转至下一个Ro 处理比率 储存处理后的数据
        ro++;
        cellSt = ro * cell;//下一个格子的起始时间
        //第99个格子结束时间为recordEndNS，确保覆盖整个时间范围
        if (ro < 99) {
          cellEt = (ro + 1) * cell;//下一个格子结束时间
        } else {
          cellEt = args.recordEndNS - args.recordStartNS;
        }
        //处理比率 储存处理后的数据
        if (sumTime !== 0) {
          let rate = sumTime / cell;
          cpuUtiliRateArray.push({ ro: ro - 1, cpu, rate });
          sumTime = 0;
        }
      }
    }
    //处理最后一个sumTime不为0区间的数据
    if (sumTime !== 0) {
      let rate = sumTime / cell;
      cpuUtiliRateArray.push({ ro, cpu, rate });
    }
  }
  return cpuUtiliRateArray;
}

export function sliceSPTReceiver(data: unknown): void {
  //@ts-ignore
  if (data && data.params.func) {
    //@ts-ignore
    switch (data.params.func) {
      case 'spt-getPTS':
        getPTS(data);
        break;
      case 'spt-getSPT':
        getSPT(data);
        break;
      case 'spt-getCpuPriorityByTime':
        sptGetCpuPriorityByTime(data);
        break;
      case 'state-box':
        getChildBoxDb(data);
        break;
      case 'near-data':
        seacrhThreadNearData(data);
        break;
    }
  }
}

function postMsg(data: unknown, res: unknown): void {
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: res, //@ts-ignore
      len: res.length,
      transfer: false,
    },
    []
  );
}

function getSPT(data: unknown): void {
  let threadSlice = sliceList.get(0) || [];
  let sptFilter = threadSlice.filter(
    (it) =>
      //@ts-ignore
      Math.max(data.params.leftNs, it.startTime!) < Math.min(data.params.rightNs, it.startTime! + it.dur!) &&
      //@ts-ignore
      (it.cpu === null || it.cpu === undefined || data.params.cpus.includes(it.cpu))
  );
  let group: unknown = {};
  sptFilter.forEach((slice) => {
    let item = {
      //@ts-ignore
      title: `T-${slice.tid}`,
      count: 1, //@ts-ignore
      state: slice.state, //@ts-ignore
      pid: slice.pid, //@ts-ignore
      tid: slice.tid, //@ts-ignore
      minDuration: slice.dur || 0, //@ts-ignore
      maxDuration: slice.dur || 0, //@ts-ignore
      wallDuration: slice.dur || 0, //@ts-ignore
      avgDuration: `${slice.dur}`,
    }; //@ts-ignore
    if (group[`${slice.state}`]) {
      setSPTData(group, slice, item);
    } else {
      //@ts-ignore
      group[`${slice.state}`] = {
        //@ts-ignore
        title: `S-${slice.state}`,
        count: 1, //@ts-ignore
        state: slice.state, //@ts-ignore
        minDuration: slice.dur || 0, //@ts-ignore
        maxDuration: slice.dur || 0, //@ts-ignore
        wallDuration: slice.dur || 0, //@ts-ignore
        avgDuration: `${slice.dur}`,
        children: [
          {
            //@ts-ignore
            title: `P-${slice.pid}`,
            count: 1, //@ts-ignore
            state: slice.state, //@ts-ignore
            pid: slice.pid, //@ts-ignore
            minDuration: slice.dur || 0, //@ts-ignore
            maxDuration: slice.dur || 0, //@ts-ignore
            wallDuration: slice.dur || 0, //@ts-ignore
            avgDuration: `${slice.dur}`,
            children: [item],
          },
        ],
      };
    }
  }); //@ts-ignore
  postMsg(data, Object.values(group));
}

function getPTS(data: unknown): void {
  let threadSlice = sliceList.get(0) || [];
  let ptsFilter = threadSlice.filter(
    (it) =>
      //@ts-ignore
      Math.max(data.params.leftNs, it.startTime!) < Math.min(data.params.rightNs, it.startTime! + it.dur!) && //@ts-ignore
      (it.cpu === null || it.cpu === undefined || data.params.cpus.includes(it.cpu))
  );
  let group: unknown = {};
  ptsFilter.forEach((slice) => {
    //@ts-ignore
    let title = `S-${slice.state}`;
    let item = setStateData(slice, title); //@ts-ignore
    if (group[`${slice.pid}`]) {
      //@ts-ignore
      let process = group[`${slice.pid}`];
      process.count += 1; //@ts-ignore
      process.wallDuration += slice.dur; //@ts-ignore
      process.minDuration = Math.min(process.minDuration, slice.dur!); //@ts-ignore
      process.maxDuration = Math.max(process.maxDuration, slice.dur!);
      process.avgDuration = (process.wallDuration / process.count).toFixed(2); //@ts-ignore
      let thread = process.children.find((child: unknown) => child.title === `T-${slice.tid}`);
      if (thread) {
        thread.count += 1; //@ts-ignore
        thread.wallDuration += slice.dur; //@ts-ignore
        thread.minDuration = Math.min(thread.minDuration, slice.dur!); //@ts-ignore
        thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
        thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2); //@ts-ignore
        let state = thread.children.find((child: unknown) => child.title === `S-${slice.state}`);
        if (state) {
          state.count += 1; //@ts-ignore
          state.wallDuration += slice.dur; //@ts-ignore
          state.minDuration = Math.min(state.minDuration, slice.dur!); //@ts-ignore
          state.maxDuration = Math.max(state.maxDuration, slice.dur!);
          state.avgDuration = (state.wallDuration / state.count).toFixed(2);
        } else {
          thread.children.push(item);
        }
      } else {
        let processChild = setThreadData(slice, item);
        process.children.push(processChild);
      }
    } else {
      //@ts-ignore
      group[`${slice.pid}`] = setProcessData(slice, item);
    }
  }); //@ts-ignore
  postMsg(data, Object.values(group));
}

function sptGetCpuPriorityByTime(data: unknown): void {
  let threadSlice = sliceList.get(0) || [];
  const result = threadSlice.filter((item: unknown) => {
    //@ts-ignore
    return !(item.startTime + item.dur < data.params.leftNs || item.startTime! > data.params.rightNs);
  });
  postMsg(data, result);
}

//处理跳转子页面的数据
function getChildBoxDb(data: unknown): void {
  let threadSlice = sliceList.get(0) || [];
  let setProcessId;
  let setThreadId;
  let setCpu = new Set();
  //处理processId数据
  //@ts-ignore
  setProcessId = handleIdParams(data.params.processId);
  //处理threadId数据
  //@ts-ignore
  setThreadId = handleIdParams(data.params.threadId);
  //处理Cpu数据
  //@ts-ignore
  if (data.params.cpus) {//@ts-ignore
    if (data.params.cpus.length > 0) {
      //@ts-ignore
      setCpu = new Set(data.params.cpus);
    }
  }

  let childBoxDb = threadSlice.filter((it: unknown) => {
    let condition = true;
    // 检查进程ID  
    if (setProcessId.size !== 0) {
      //@ts-ignore
      condition = condition && setProcessId.has(it.pid);
    }
    // 检查线程ID  
    if (setThreadId.size !== 0) {
      //@ts-ignore
      condition = condition && setThreadId.has(it.tid);
    }
    // 检查CPU（如果存在且不是null/undefined，或在setCpu中）  
    if (setCpu.size !== 0) {
      //@ts-ignore
      condition = condition && (it.cpu === null || it.cpu === undefined || setCpu.has(it.cpu));
    }
    // 检查状态
    //@ts-ignore  
    if (data.params.state) {
      //@ts-ignore  
      condition = condition && it.state === data.params.state;
    }
    //@ts-ignore
    return condition && Math.max(data.params.leftNs, it.startTime!) < Math.min(data.params.rightNs, it.startTime! + it.dur!);
  });
  postMsg(data, childBoxDb);
}
//处理processId和threadId
function handleIdParams(id: number | number[] | undefined): Set<unknown> {
  let setId: Set<unknown>;
  if (Array.isArray(id) || typeof id === 'number') {
    setId = new Set(Array.isArray(id) ? id : [id]);
  } else {
    setId = new Set();
  }
  return setId;
}

//查找点击的thread块前后相邻块信息
function seacrhThreadNearData(target: unknown): void {
  //@ts-ignore
  let key = `${target.params.pid}-${target.params.tid}`;
  let preData;
  let nextData;
  let threadSlice = threadStateList.get(key) || [];
  //@ts-ignore
  let dbIndex = threadSlice.findIndex(it => it.startTime === target.params.startTime);
  if (dbIndex !== -1) {
    preData = threadSlice[dbIndex - 1] ? threadSlice[dbIndex - 1] : dataCache;
    nextData = threadSlice[dbIndex + 1] ? threadSlice[dbIndex + 1] : dataCache;
  } else {
    preData = dataCache;
    nextData = dataCache;
  }
  postMsg(target, [preData, nextData]);
}

function setStateData(slice: unknown, title: string): unknown {
  return {
    title: title,
    count: 1, //@ts-ignore
    state: slice.state, //@ts-ignore
    tid: slice.tid, //@ts-ignore
    pid: slice.pid, //@ts-ignore
    minDuration: slice.dur || 0, //@ts-ignore
    maxDuration: slice.dur || 0, //@ts-ignore
    wallDuration: slice.dur || 0, //@ts-ignore
    avgDuration: `${slice.dur}`,
  };
}

function setThreadData(slice: unknown, item: unknown): unknown {
  return {
    //@ts-ignore
    title: `T-${slice.tid}`,
    count: 1, //@ts-ignore
    tid: slice.tid, //@ts-ignore
    pid: slice.pid, //@ts-ignore
    minDuration: slice.dur || 0, //@ts-ignore
    maxDuration: slice.dur || 0, //@ts-ignore
    wallDuration: slice.dur || 0, //@ts-ignore
    avgDuration: `${slice.dur}`,
    children: [item],
  };
}

function setProcessData(slice: unknown, item: unknown): unknown {
  return {
    //@ts-ignore
    title: `P-${slice.pid}`,
    count: 1, //@ts-ignore
    pid: slice.pid, //@ts-ignore
    minDuration: slice.dur || 0, //@ts-ignore
    maxDuration: slice.dur || 0, //@ts-ignore
    wallDuration: slice.dur || 0, //@ts-ignore
    avgDuration: `${slice.dur}`,
    children: [
      {
        //@ts-ignore
        title: `T-${slice.tid}`,
        count: 1, //@ts-ignore
        pid: slice.pid, //@ts-ignore
        tid: slice.tid, //@ts-ignore
        minDuration: slice.dur || 0, //@ts-ignore
        maxDuration: slice.dur || 0, //@ts-ignore
        wallDuration: slice.dur || 0, //@ts-ignore
        avgDuration: `${slice.dur}`,
        children: [item],
      },
    ],
  };
}

function setSPTData(group: unknown, slice: unknown, item: unknown): void {
  //@ts-ignore
  let state = group[`${slice.state}`];
  state.count += 1; //@ts-ignore
  state.wallDuration += slice.dur; //@ts-ignore
  state.minDuration = Math.min(state.minDuration, slice.dur!); //@ts-ignore
  state.maxDuration = Math.max(state.maxDuration, slice.dur!);
  state.avgDuration = (state.wallDuration / state.count).toFixed(2); //@ts-ignore
  let process = state.children.find((child: unknown) => child.title === `P-${slice.pid}`);
  if (process) {
    process.count += 1; //@ts-ignore
    process.wallDuration += slice.dur; //@ts-ignore
    process.minDuration = Math.min(process.minDuration, slice.dur!); //@ts-ignore
    process.maxDuration = Math.max(process.maxDuration, slice.dur!);
    process.avgDuration = (process.wallDuration / process.count).toFixed(2); //@ts-ignore
    let thread = process.children.find((child: unknown) => child.title === `T-${slice.tid}`);
    if (thread) {
      thread.count += 1; //@ts-ignore
      thread.wallDuration += slice.dur; //@ts-ignore
      thread.minDuration = Math.min(thread.minDuration, slice.dur!); //@ts-ignore
      thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
      thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2);
    } else {
      process.children.push(item);
    }
  } else {
    state.children.push({
      //@ts-ignore
      title: `P-${slice.pid}`,
      count: 1, //@ts-ignore
      state: slice.state, //@ts-ignore
      pid: slice.pid, //@ts-ignore
      minDuration: slice.dur || 0, //@ts-ignore
      maxDuration: slice.dur || 0, //@ts-ignore
      wallDuration: slice.dur || 0, //@ts-ignore
      avgDuration: `${slice.dur}`,
      children: [item],
    });
  }
}
