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

import { cpuList, processList, sliceList, threadStateList } from './utils/AllMemoryCache';

export const sliceSqlMem = (args: any): string => {
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

export function sliceReceiver(data: any, proc: Function): void {
  let count = {
    cpu: new Map<number, number>(),
  };
  sliceList.clear();
  cpuList.clear();
  processList.clear();
  threadStateList.clear();
  let list: any[] = proc(sliceSqlMem(data.params));
  sliceList.set(0, list);
  for (let i = 0; i < list.length; i++) {
    let slice = list[i];
    if (slice.cpu !== null && slice.cpu !== undefined) {
      if (cpuList.has(slice.cpu)) {
        let arr = cpuList.get(slice.cpu) || [];
        let last = arr[arr.length - 1];
        if (last && (last.dur === -1 || last.dur === null || last.dur === undefined)) {
          last.dur = slice.startTime - last.startTime;
        }
        cpuList.get(slice.cpu)!.push(slice);
      } else {
        cpuList.set(slice.cpu, [slice]);
      }
    }
    if (slice.pid >= 0 && slice.cpu !== null && slice.cpu !== undefined) {
      if (processList.has(slice.pid)) {
        processList.get(slice.pid)!.push(slice);
      } else {
        processList.set(slice.pid, [slice]);
      }
    }
    if (slice.pid >= 0 && slice.tid >= 0) {
      let key = `${slice.pid}-${slice.tid}`;
      if (threadStateList.has(key)) {
        threadStateList.get(key)!.push(slice);
      } else {
        threadStateList.set(key, [slice]);
      }
    }
  }
  for (let key of cpuList.keys()) {
    let arr = cpuList.get(key) || [];
    let last = arr[arr.length - 1];
    if (last && (last.dur === -1 || last.dur === null || last.dur === undefined)) {
      let totalNs = data.params.recordEndNS - data.params.recordStartNS;
      last.dur = totalNs - last.startTime;
    }
    count.cpu.set(key, arr.length);
  }
  postMsg(data, count);
}

export function sliceSPTReceiver(data: any) {
  if (data && data.params.func) {
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
    }
  }
}

function postMsg(data: any, res: any): void {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: res,
      len: res.length,
      transfer: false,
    },
    []
  );
}

function getSPT(data: any): void {
  let threadSlice = sliceList.get(0) || [];
  let sptFilter = threadSlice.filter(
    (it) =>
      Math.max(data.params.leftNs, it.startTime!) < Math.min(data.params.rightNs, it.startTime! + it.dur!) &&
      (it.cpu === null || it.cpu === undefined || data.params.cpus.includes(it.cpu))
  );
  let group: any = {};
  sptFilter.forEach((slice) => {
    let item = {
      title: `T-${slice.tid}`,
      count: 1,
      state: slice.state,
      pid: slice.pid,
      tid: slice.tid,
      minDuration: slice.dur || 0,
      maxDuration: slice.dur || 0,
      wallDuration: slice.dur || 0,
      avgDuration: `${slice.dur}`,
    };
    if (group[`${slice.state}`]) {
      setSPTData(group, slice, item);
    } else {
      group[`${slice.state}`] = {
        title: `S-${slice.state}`,
        count: 1,
        state: slice.state,
        minDuration: slice.dur || 0,
        maxDuration: slice.dur || 0,
        wallDuration: slice.dur || 0,
        avgDuration: `${slice.dur}`,
        children: [
          {
            title: `P-${slice.pid}`,
            count: 1,
            state: slice.state,
            pid: slice.pid,
            minDuration: slice.dur || 0,
            maxDuration: slice.dur || 0,
            wallDuration: slice.dur || 0,
            avgDuration: `${slice.dur}`,
            children: [item],
          },
        ],
      };
    }
  });
  postMsg(data, Object.values(group));
}

function getPTS(data: any): void {
  let threadSlice = sliceList.get(0) || [];
  let ptsFilter = threadSlice.filter(
    (it) =>
      Math.max(data.params.leftNs, it.startTime!) < Math.min(data.params.rightNs, it.startTime! + it.dur!) &&
      (it.cpu === null || it.cpu === undefined || data.params.cpus.includes(it.cpu))
  );
  let group: any = {};
  ptsFilter.forEach((slice) => {
    let title = `S-${slice.state}`;
    let item = setStateData(slice, title);
    if (group[`${slice.pid}`]) {
      let process = group[`${slice.pid}`];
      process.count += 1;
      process.wallDuration += slice.dur;
      process.minDuration = Math.min(process.minDuration, slice.dur!);
      process.maxDuration = Math.max(process.maxDuration, slice.dur!);
      process.avgDuration = (process.wallDuration / process.count).toFixed(2);
      let thread = process.children.find((child: any) => child.title === `T-${slice.tid}`);
      if (thread) {
        thread.count += 1;
        thread.wallDuration += slice.dur;
        thread.minDuration = Math.min(thread.minDuration, slice.dur!);
        thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
        thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2);
        let state = thread.children.find((child: any) => child.title === `S-${slice.state}`);
        if (state) {
          state.count += 1;
          state.wallDuration += slice.dur;
          state.minDuration = Math.min(state.minDuration, slice.dur!);
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
      group[`${slice.pid}`] = setProcessData(slice, item);
    }
  });
  postMsg(data, Object.values(group));
}

function sptGetCpuPriorityByTime(data: any): void {
  let threadSlice = sliceList.get(0) || [];
  const result = threadSlice.filter((item: any) => {
    return !(item.startTime + item.dur < data.params.leftNs || item.startTime! > data.params.rightNs);
  });
  postMsg(data, result);
}

function setStateData(slice: any, title: string): any {
  return {
    title: title,
    count: 1,
    state: slice.state,
    tid: slice.tid,
    pid: slice.pid,
    minDuration: slice.dur || 0,
    maxDuration: slice.dur || 0,
    wallDuration: slice.dur || 0,
    avgDuration: `${slice.dur}`,
  };
}

function setThreadData(slice: any, item: any): any {
  return {
    title: `T-${slice.tid}`,
    count: 1,
    tid: slice.tid,
    pid: slice.pid,
    minDuration: slice.dur || 0,
    maxDuration: slice.dur || 0,
    wallDuration: slice.dur || 0,
    avgDuration: `${slice.dur}`,
    children: [item],
  };
}

function setProcessData(slice: any, item: any): any {
  return {
    title: `P-${slice.pid}`,
    count: 1,
    pid: slice.pid,
    minDuration: slice.dur || 0,
    maxDuration: slice.dur || 0,
    wallDuration: slice.dur || 0,
    avgDuration: `${slice.dur}`,
    children: [
      {
        title: `T-${slice.tid}`,
        count: 1,
        pid: slice.pid,
        tid: slice.tid,
        minDuration: slice.dur || 0,
        maxDuration: slice.dur || 0,
        wallDuration: slice.dur || 0,
        avgDuration: `${slice.dur}`,
        children: [item],
      },
    ],
  };
}

function setSPTData(group: any, slice: any, item: any): void {
  let state = group[`${slice.state}`];
  state.count += 1;
  state.wallDuration += slice.dur;
  state.minDuration = Math.min(state.minDuration, slice.dur!);
  state.maxDuration = Math.max(state.maxDuration, slice.dur!);
  state.avgDuration = (state.wallDuration / state.count).toFixed(2);
  let process = state.children.find((child: any) => child.title === `P-${slice.pid}`);
  if (process) {
    process.count += 1;
    process.wallDuration += slice.dur;
    process.minDuration = Math.min(process.minDuration, slice.dur!);
    process.maxDuration = Math.max(process.maxDuration, slice.dur!);
    process.avgDuration = (process.wallDuration / process.count).toFixed(2);
    let thread = process.children.find((child: any) => child.title === `T-${slice.tid}`);
    if (thread) {
      thread.count += 1;
      thread.wallDuration += slice.dur;
      thread.minDuration = Math.min(thread.minDuration, slice.dur!);
      thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
      thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2);
    } else {
      process.children.push(item);
    }
  } else {
    state.children.push({
      title: `P-${slice.pid}`,
      count: 1,
      state: slice.state,
      pid: slice.pid,
      minDuration: slice.dur || 0,
      maxDuration: slice.dur || 0,
      wallDuration: slice.dur || 0,
      avgDuration: `${slice.dur}`,
      children: [item],
    });
  }
}
