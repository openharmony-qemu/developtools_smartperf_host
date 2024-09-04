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

import { convertJSON, getProbablyTime, LogicHandler } from './ProcedureLogicWorkerCommon';

export class ProcedureLogicWorkerSchedulingAnalysis extends LogicHandler {
  currentEventId: string = '';
  endTs: number = 0;
  startTs: number = 0;
  totalDur: number = 0;
  cpu: number = 0;
  freq: number = 0;
  bigCores: Array<number> = [];
  midCores: Array<number> = [];
  smallCores: Array<number> = [];
  cpuFreqMap: Map<number, Array<CpuMeasure>> = new Map<number, Array<CpuMeasure>>();
  cpuIdle0Map: Map<number, Array<CpuMeasure>> = new Map<number, Array<CpuMeasure>>();
  threadMap: Map<number, string> = new Map<number, string>();
  processMap: Map<number, string> = new Map<number, string>();
  cpuAnalysisMap: Map<string, unknown> = new Map<string, unknown>();

  clearAll(): void {
    this.bigCores.length = 0;
    this.midCores.length = 0;
    this.smallCores.length = 0;
    this.cpuAnalysisMap.clear();
    this.threadMap.clear();
    this.processMap.clear();
    this.cpuFreqMap.clear();
    this.cpuIdle0Map.clear();
  }

  handle(data: unknown): void {
    //@ts-ignore
    this.currentEventId = data.id;
    //@ts-ignore
    if (data.params.endTs) {
      //@ts-ignore
      this.endTs = data.params.endTs;
      //@ts-ignore
      this.totalDur = data.params.total;
      this.startTs = this.endTs - this.totalDur;
    }
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      this.handleDataByType(data);
    }
  }
  private handleDataByType(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    switch (data.type) {
      case 'scheduling-clearData':
        this.schedulingClearData(data);
        break;
      case 'scheduling-initFreqData':
        this.schedulingInitFreqData(data);
        break;
      case 'scheduling-getProcessAndThread':
        this.schedulinGetProcessAndThread(data);
        break;
      case 'scheduling-getCpuIdle0':
        this.schedulingGetCpuIdle0(data);
        break;
      case 'scheduling-getCpuUsage':
        this.schedulingGetCpuUsage(data);
        break;
      case 'scheduling-CPU Frequency':
        this.schedulingCPUFrequency(data);
        break;
      case 'scheduling-CPU Frequency Thread':
        this.schedulingCPUFrequencyThread(data);
        break;
      case 'scheduling-CPU Idle':
        this.schedulingCPUIdle(data);
        break;
      case 'scheduling-CPU Irq':
        this.schedulingCPUIrq(data);
        break;
      case 'scheduling-Thread CpuUsage':
        this.schedulingThreadCpuUsage(data);
        break;
      case 'scheduling-Thread RunTime':
        this.schedulingThreadRunTime(data);
        break;
      case 'scheduling-Process ThreadCount':
        this.schedulingProcessThreadCount(data);
        break;
      case 'scheduling-Process SwitchCount':
        this.schedulingProcessSwitchCount(data);
        break;
      case 'scheduling-Thread Freq':
        this.schedulingThreadFreq(data);
        break;
      case 'scheduling-Process Top10Swicount':
        this.schedulingProTop10Swicount(data);
        break;
      case 'scheduling-Process Top10RunTime':
        this.schedulingProcessRunTime(data);
        break;
    }
  }
  private schedulingClearData(data: { id: string; action: string; params: unknown }): void {
    this.clearAll();
    self.postMessage({
      id: data.id,
      action: data.action,
      results: [],
    });
  }
  private schedulingInitFreqData(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      this.groupFreqByCpu(convertJSON(data.params.list) || []);
      self.postMessage({
        id: data.id,
        action: data.action,
        results: [],
      });
    } else {
      this.getCpuFrequency('scheduling-initFreqData');
    }
  }
  private schedulinGetProcessAndThread(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.handleProcessThread(arr);
      self.postMessage({
        id: data.id,
        action: data.action,
        results: [],
      });
    } else {
      this.getProcessAndThread();
    }
  }
  private schedulingGetCpuIdle0(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.handleCPUIdle0Map(arr);
      self.postMessage({
        id: data.id,
        action: data.action,
        results: [],
      });
    } else {
      this.getCpuIdle0();
    }
  }
  private schedulingGetCpuUsage(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      self.postMessage({
        id: data.id,
        action: data.action,
        results: arr,
      });
      arr = [];
    } else {
      this.getCpuUsage();
    }
  }
  private schedulingCPUFrequency(data: { id: string; action: string; params: unknown }): void {
    if (this.cpuAnalysisMap.has('freq')) {
      self.postMessage({
        id: data.id,
        action: data.action,
        results: this.cpuAnalysisMap.get('freq') || [],
      });
    } else {
      //@ts-ignore
      if (data.params.list) {
        //@ts-ignore
        let res = this.computeCpuMeasureDur(convertJSON(data.params.list) || [], 'freq');
        this.cpuAnalysisMap.set('freq', res);
        self.postMessage({
          id: data.id,
          action: data.action,
          results: res,
        });
      } else {
        this.getCpuFrequency('scheduling-CPU Frequency');
      }
    }
  }
  private schedulingCPUFrequencyThread(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.handlerFreqThreadData(convertJSON(data.params.list) || []),
      });
    } else {
      //@ts-ignore
      this.cpu = data.params.cpu;
      //@ts-ignore
      this.freq = data.params.freq;
      //@ts-ignore
      this.getThreadStateByCpu(data.params.cpu);
    }
  }
  private schedulingCPUIdle(data: { id: string; action: string; params: unknown }): void {
    if (this.cpuAnalysisMap.has('idle')) {
      self.postMessage({
        id: data.id,
        action: data.action,
        results: this.cpuAnalysisMap.get('idle') || [],
      });
    } else {
      //@ts-ignore
      if (data.params.list) {
        //@ts-ignore
        let res = this.computeCpuMeasureDur(convertJSON(data.params.list) || []);
        this.cpuAnalysisMap.set('idle', res);
        self.postMessage({
          id: data.id,
          action: data.action,
          results: res,
        });
      } else {
        this.getCpuIdle();
      }
    }
  }
  private schedulingCPUIrq(data: { id: string; action: string; params: unknown }): void {
    if (this.cpuAnalysisMap.has('irq')) {
      self.postMessage({
        id: data.id,
        action: data.action,
        results: this.cpuAnalysisMap.get('irq') || [],
      });
    } else {
      //@ts-ignore
      if (data.params.list) {
        //@ts-ignore
        let res = this.groupIrgDataByCpu(convertJSON(data.params.list) || []);
        this.cpuAnalysisMap.set('irq', res);
        self.postMessage({
          id: data.id,
          action: data.action,
          results: res,
        });
      } else {
        this.getCpuIrq();
      }
    }
  }
  private schedulingThreadCpuUsage(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.handlerThreadCpuUsageData(convertJSON(data.params.list) || []),
      });
    } else {
      //@ts-ignore
      this.bigCores = data.params.bigCores || [];
      //@ts-ignore
      this.midCores = data.params.midCores || [];
      //@ts-ignore
      this.smallCores = data.params.smallCores || [];
      //@ts-ignore
      this.queryThreadCpuUsage(data.params.bigCores || [], data.params.midCores || [], data.params.smallCores || []);
    }
  }
  private schedulingThreadRunTime(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      self.postMessage({
        id: data.id,
        action: data.action,
        results: arr.map((it) => {
          //@ts-ignore
          it.maxDurationStr = getProbablyTime(it.maxDuration);
          //@ts-ignore
          it.pName = this.processMap.get(it.pid) || 'null';
          //@ts-ignore
          it.tName = this.threadMap.get(it.tid) || 'null';
          return it;
        }),
      });
    } else {
      //@ts-ignore
      this.queryThreadRunTime(data.params.cpuMax);
    }
  }
  private schedulingProcessThreadCount(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: convertJSON(data.params.list) || [],
      });
    } else {
      this.queryProcessThreadCount();
    }
  }
  private schedulingProcessSwitchCount(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      self.postMessage({
        id: data.id,
        action: data.action,
        results: arr.map((it) => {
          //@ts-ignore
          it.pName = this.processMap.get(it.pid) || 'null';
          //@ts-ignore
          it.tName = this.threadMap.get(it.tid) || 'null';
          return it;
        }),
      });
    } else {
      this.queryProcessSwitchCount();
    }
  }
  private schedulingThreadFreq(data: { id: string; action: string; params: unknown }): void {
    //@ts-ignore
    if (data.params.list) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.handlerThreadFreqData(convertJSON(data.params.list) || []),
      });
    } else {
      //@ts-ignore
      this.queryThreadStateByTid(data.params.tid);
    }
  }
  private schedulingProTop10Swicount(data: unknown): void {
    // @ts-ignore
    if (data.params.list) {
      // @ts-ignore
      let arr = convertJSON(data.params.list) || [];
      self.postMessage({
        // @ts-ignore
        id: data.id,
        // @ts-ignore
        action: data.action,
        results: arr,
      });
      arr = [];
    } else {
      // @ts-ignore
      if (data.params.pid) {
        // @ts-ignore
        this.queryThrTop10Swicount(data.params.pid);
      } else {
        this.queryProTop10Swicount();
      }
    }
  }
  private schedulingProcessRunTime(data: unknown): void {
    // @ts-ignore
    if (data.params.list) {
      // @ts-ignore
      let arr = convertJSON(data.params.list) || [];
      self.postMessage({
        // @ts-ignore
        id: data.id,
        // @ts-ignore
        action: data.action,
        results: arr,
      });
      arr = [];
    } else {
      // @ts-ignore
      if (data.params.pid) {
        // @ts-ignore
        this.queryThrTop10RunTime(data.params.pid);
      } else {
        this.queryProTop10RunTime();
      }
    }
  }
  getProcessAndThread(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-getProcessAndThread',
      `
select tid id,ifnull(name,'null') name,'t' type from thread
union all
select pid id,ifnull(name,'null') name,'p' type from process;
        `,
      {}
    );
  }

  getCpuUsage(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-getCpuUsage',
      `
select cpu,
       sum(case
               when A.ts < B.start_ts
                   then (A.ts - B.start_ts + A.dur)
               when A.ts >= B.start_ts
                   and (A.ts + A.dur) <= B.end_ts
                   then A.dur
               when (A.ts + A.dur) > B.end_ts
                   then (B.end_ts - A.ts) end) / cast(B.end_ts - B.start_ts as float) as usage
from thread_state A,
     trace_range B
where (A.ts - B.start_ts) > 0
  and A.dur > 0
  and (A.ts + A.dur) > B.start_ts
  and cpu >= 0
  and A.ts < B.end_ts
group by cpu
order by cpu;
`,
      {}
    );
  }

  getCpuFrequency(name: string): void {
    this.queryData(
      this.currentEventId,
      name,
      `
select cpu,value,ts,dur
from measure left join cpu_measure_filter cmf on measure.filter_id = cmf.id
where cmf.name = 'cpu_frequency'
order by cpu,ts;
`,
      {}
    );
  }

  getThreadStateByCpu(cpu: number): void {
    let sql = `
select st.tid,
       st.pid,
       dur,
       ts - tr.start_ts as ts
from thread_state st,trace_range tr
where cpu = ${cpu}
  and dur > 0
  and ts > tr.start_ts
  and ts + st.dur < tr.end_ts
order by ts;`;
    this.queryData(this.currentEventId, 'scheduling-CPU Frequency Thread', sql, {});
  }

  getCpuIdle0(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-getCpuIdle0',
      `
select cpu,value,ts,dur
from measure left join cpu_measure_filter cmf on measure.filter_id = cmf.id
where cmf.name = 'cpu_idle' and value = 0
`,
      {}
    );
  }

  getCpuIdle(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-CPU Idle',
      `
select cpu,value,ts,dur
from measure left join cpu_measure_filter cmf on measure.filter_id = cmf.id
where cmf.name = 'cpu_idle' and value != 0
`,
      {}
    );
  }

  getCpuIrq(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-CPU Irq',
      `
        SELECT callid AS cpu,
        CASE WHEN cat = 'ipi' THEN 'irq' ELSE cat END AS block,
        CASE WHEN cat = 'ipi' THEN 'IPI' || name ELSE name END AS value,
        sum( dur ) sum,
        min( dur ) min,
        max( dur ) max,
        avg( dur ) avg 
    FROM
        irq 
    WHERE
        cat = 'ipi' 
        OR cat = 'softirq' 
        OR ( cat = 'irq' AND flag = '1' ) 
    GROUP BY
        callid,
        cat,
        name;`,
      {}
    );
  }

  queryThreadCpuUsage(bigCores: number[], midCores: number[], smallCores: number[]): void {
    let sql = `
        select A.pid,A.tid,A.cpu,
       sum(A.dur) as total
from thread_state A
where cpu not null
group by A.pid, A.tid,A.cpu`;
    this.queryData(this.currentEventId, 'scheduling-Thread CpuUsage', sql, {});
  }

  queryThreadRunTime(cpuMax: number): void {
    let sql = `
        select (row_number() over (order by max(A.dur) desc)) no,A.tid, A.cpu,A.ts as timestamp,A.pid, max(A.dur) maxDuration
    from thread_state A, trace_range B
    where cpu not null and A.ts between B.start_ts and B.end_ts
    group by A.tid, A.pid
    order by maxDuration desc
    limit 20`;
    this.queryData(this.currentEventId, 'scheduling-Thread RunTime', sql, {});
  }

  queryProcessThreadCount(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process ThreadCount',
      `
select row_number() over (order by count(tid) desc) NO,count(tid) threadNumber,p.pid,ifnull(p.name,'null') pName
from thread t
left join process p on t.ipid = p.ipid
group by p.pid, p.name
order by threadNumber desc limit 20;`,
      {}
    );
  }

  queryProcessSwitchCount(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process SwitchCount',
      `
select row_number() over (order by count(a.tid) desc) NO,
       count(a.tid) as switchCount,
       a.tid,
       a.pid
from thread_state a
where cpu not null
group by a.pid,a.tid limit 20;`,
      {}
    );
  }

  queryThreadStateByTid(tid: number): void {
    let sql = `
select cpu,dur,ts - tr.start_ts as ts
from thread_state st,trace_range tr
where cpu not null
  and tid = ${tid}
  and dur > 0
  and ts > tr.start_ts
  and ts + st.dur < tr.end_ts
  order by cpu,ts;`;
    this.queryData(this.currentEventId, 'scheduling-Thread Freq', sql, {});
  }
  queryProTop10Swicount(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process Top10Swicount',
      `
        select
          pid,
          count(tid) as occurrences
        from
          thread_state 
        where
          state = 'Running'
        group by
          pid
        ORDER BY occurrences desc
        LIMIT 10
      `,
      {}
    );
  }
  queryThrTop10Swicount(pid: number): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process Top10Swicount',
      `
        select
          tid,
          count(tid) as occurrences
        from
          thread_state 
        where
          state = 'Running'
        and pid = ${pid}
        group by
          tid
        ORDER BY occurrences desc
        LIMIT 10
      `,
      {}
    );
  }
  queryProTop10RunTime(): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process Top10RunTime',
      `
        select
          pid,
          SUM(dur) As dur
        from
          thread_state 
        where
          state = 'Running'
        GROUP BY pid
        ORDER BY dur desc
        LIMIT 10
      `,
      {}
    );
  }
  queryThrTop10RunTime(pid: number): void {
    this.queryData(
      this.currentEventId,
      'scheduling-Process Top10RunTime',
      `
        select
          tid,
          SUM(dur) As dur
        from
          thread_state 
        where
          state = 'Running'
        and 
          pid = ${pid}
        GROUP BY tid
        ORDER BY dur desc
        LIMIT 10
      `,
      {}
    );
  }
  groupIrgDataByCpu(arr: Irq[]): Map<number, CpuAnalysis[]> {
    //首先计算 每个频点的持续时间，并根据Cpu来分组
    let map: Map<number, Array<Irq>> = new Map<number, Array<Irq>>();
    let sumMap: Map<number, number> = new Map<number, number>();
    for (let i = 0, len = arr.length; i < len; i++) {
      let ca = arr[i];
      if (map.has(ca.cpu)) {
        map.get(ca.cpu)!.push(ca);
      } else {
        map.set(ca.cpu, [ca]);
      }
      sumMap.set(ca.cpu, (sumMap.get(ca.cpu) || 0) + ca.sum);
    }
    let target: Map<number, CpuAnalysis[]> = new Map<number, CpuAnalysis[]>();
    for (let key of map.keys()) {
      let cpuArr = map
        .get(key)!
        .sort((a, b) => b.sum - a.sum)
        .slice(0, 20);
      target.set(
        key,
        cpuArr.map((irqBean) => {
          let item = {
            cpu: irqBean.cpu,
            value: irqBean.value,
            sum: irqBean.sum,
            sumTimeStr: getProbablyTime(irqBean.sum),
            min: getProbablyTime(irqBean.min),
            max: getProbablyTime(irqBean.max),
            avg: getProbablyTime(irqBean.avg),
            minValue: irqBean.min,
            maxValue: irqBean.max,
            avgValue: irqBean.avg,
            ratio: ((irqBean.sum / (sumMap.get(key) || 1)) * 100).toFixed(2),
            block: irqBean.block,
          };
          //@ts-ignore
          return item as CpuAnalysis;
        })
      );
    }
    return target;
  }

  handleProcessThread(arr: { id: number; name: string; type: string }[]): void {
    this.processMap.clear();
    this.threadMap.clear();
    for (let pt of arr) {
      if (pt.type === 'p') {
        this.processMap.set(pt.id, pt.name);
      } else {
        this.threadMap.set(pt.id, pt.name);
      }
    }
  }

  handleCPUIdle0Map(arr: CpuMeasure[]): void {
    this.cpuIdle0Map.clear();
    for (let i = 0, len = arr.length; i < len; i++) {
      let ca = arr[i];
      ca.ts = ca.ts - this.startTs;
      if (ca.dur === null || ca.dur === undefined) {
        ca.dur = this.totalDur - ca.ts;
      }
      if (this.cpuIdle0Map.has(ca.cpu)) {
        this.cpuIdle0Map.get(ca.cpu)!.push(ca);
      } else {
        this.cpuIdle0Map.set(ca.cpu, [ca]);
      }
    }
  }

  getEffectiveFrequencyDur(m: CpuMeasure): void {
    let arr = this.cpuIdle0Map.get(m.cpu) || [];
    let filterArr: CpuMeasure[] = [];
    for (let it of arr) {
      if (Math.min(m.ts + m.dur, it.ts + it.dur) - Math.max(m.ts, it.ts) > 0) {
        filterArr.push(it);
      }
      if (it.ts > m.ts + m.dur) {
        break;
      }
    }
    let dur = 0;
    for (let idle of filterArr) {
      dur += Math.min(m.ts + m.dur, idle.ts + idle.dur) - Math.max(m.ts, idle.ts);
    }
    m.dur = dur;
  }

  groupFreqByCpu(arr: CpuMeasure[]): void {
    let map: Map<number, Array<CpuMeasure>> = new Map<number, Array<CpuMeasure>>();
    for (let i = 0, len = arr.length; i < len; i++) {
      let ca = arr[i];
      ca.ts = ca.ts - this.startTs;
      if (ca.dur === null || ca.dur === undefined) {
        ca.dur = this.totalDur - ca.ts;
      }
      if (ca.dur > 0) {
        if (map.has(ca.cpu)) {
          map.get(ca.cpu)!.push(ca);
        } else {
          let cpuArr: CpuMeasure[] = [];
          if (ca.ts > 0) {
            cpuArr.push({
              cpu: ca.cpu,
              value: -1,
              block: '',
              ts: 0,
              dur: ca.ts,
            });
          }
          cpuArr.push(ca);
          map.set(ca.cpu, cpuArr);
        }
      }
    }
    this.cpuFreqMap.clear();
    this.cpuFreqMap = map;
  }

  private filterMap(map: Map<number, Array<CpuMeasure>>, key: number): Map<number, CpuAnalysis[]> {
    //@ts-ignore
    return map.get(key)!.reduce((group: unknown, ca) => {
      const { value } = ca;
      //@ts-ignore
      const groupItem = group[value];
      if (groupItem) {
        groupItem.sum = groupItem.sum + ca.dur;
        groupItem.min = groupItem.min < ca.dur ? groupItem.min : ca.dur;
        groupItem.max = groupItem.max > ca.dur ? groupItem.max : ca.dur;
        groupItem.count = groupItem.count + 1;
        groupItem.avg = (groupItem.sum / groupItem.count).toFixed(2);
      } else {
        //@ts-ignore
        group[value] = {
          cpu: ca.cpu,
          value: ca.value,
          sum: ca.dur,
          min: ca.dur,
          max: ca.dur,
          avg: ca.dur,
          count: 1,
          ratio: '',
          block: ca.block,
        };
      }
      return group;
    }, {});
  }
  private setTargetMapValue(cpuArr: Array<CpuAnalysis>, sumMap: Map<number, number>, key: number): unknown[] {
    return cpuArr.map((cpuAnalysisBean) => {
      return {
        cpu: cpuAnalysisBean.cpu,
        value: cpuAnalysisBean.value,
        sum: cpuAnalysisBean.sum,
        sumTimeStr: getProbablyTime(cpuAnalysisBean.sum),
        min: getProbablyTime(cpuAnalysisBean.min),
        minValue: cpuAnalysisBean.min,
        max: getProbablyTime(cpuAnalysisBean.max),
        maxValue: cpuAnalysisBean.max,
        avgValue: cpuAnalysisBean.avg,
        avg: getProbablyTime(cpuAnalysisBean.avg),
        count: cpuAnalysisBean.count,
        ratio: ((cpuAnalysisBean.sum / (sumMap.get(key) || 1)) * 100).toFixed(2),
        block: cpuAnalysisBean.block,
      };
    });
  }
  //根据查询的数据，加工出CPU调度分析所需要展示的相关数据
  private computeCpuMeasureDur(arr: Array<CpuMeasure>, type?: string): Map<number, CpuAnalysis[]> {
    //首先计算 每个频点的持续时间，并根据Cpu来分组
    let map: Map<number, Array<CpuMeasure>> = new Map<number, Array<CpuMeasure>>();
    let sumMap: Map<number, number> = new Map<number, number>();
    for (let i = 0, len = arr.length; i < len; i++) {
      let ca = arr[i];
      ca.ts = ca.ts - this.startTs;
      if (ca.dur === null || ca.dur === undefined) {
        ca.dur = this.totalDur - ca.ts;
      }
      if (type === 'freq') {
        this.getEffectiveFrequencyDur(ca);
      }
      if (ca.dur > 0) {
        if (map.has(ca.cpu)) {
          map.get(ca.cpu)!.push(ca);
        } else {
          map.set(ca.cpu, [ca]);
        }
        sumMap.set(ca.cpu, (sumMap.get(ca.cpu) || 0) + ca.dur);
      }
    }
    let target: Map<number, CpuAnalysis[]> = new Map<number, CpuAnalysis[]>();
    //再根据频点值进行分组求和
    for (let key of map.keys()) {
      let obj = this.filterMap(map, key);
      let cpuArr = (Object.values(obj) as CpuAnalysis[])
        .sort((a, b) => {
          if (type === 'freq') {
            return b.sum - a.sum;
          } else {
            return a.value - b.value;
          }
        })
        .slice(0, 20);
      let value = this.setTargetMapValue(cpuArr, sumMap, key);
      target.set(key, value as CpuAnalysis[]);
    }
    return target;
  }

  private handlerFreqThreadData(arr: FreqThread[]): unknown {
    let cpuFreqArr: CpuMeasure[] = (this.cpuFreqMap.get(this.cpu) || []).filter((it) => it.value === this.freq);
    let map: Map<
      number,
      { tid: number; tName: string; pid: number; pName: string; dur: number; durStr: string; ratio: string }
    > = new Map();
    let sumFreqDur = 0;
    cpuFreqArr.map((it) => {
      sumFreqDur += it.dur;
      let freqEndTs = it.ts + it.dur;
      let threads = arr.filter((f) => Math.min(f.ts + f.dur, freqEndTs) - Math.max(f.ts, it.ts) > 0);
      for (let tf of threads) {
        let tfEndTs = tf.ts + tf.dur;
        let dur = Math.min(freqEndTs, tfEndTs) - Math.max(it.ts, tf.ts);
        if (map.has(tf.tid)) {
          map.get(tf.tid)!.dur = map.get(tf.tid)!.dur + dur;
          map.get(tf.tid)!.durStr = getProbablyTime(map.get(tf.tid)!.dur);
        } else {
          map.set(tf.tid, {
            tid: tf.tid,
            tName: this.threadMap.get(tf.tid) || 'null',
            pid: tf.pid,
            pName: this.processMap.get(tf.pid) || 'null',
            dur: dur,
            ratio: '0',
            durStr: getProbablyTime(dur),
          });
        }
      }
    });
    let target = Array.from(map.values()).sort((a, b) => b.dur - a.dur);
    return target
      .map((it) => {
        it.ratio = ((it.dur / sumFreqDur) * 100).toFixed(2);
        return it;
      })
      .slice(0, 20);
  }
  private filterThreadCpuUsageArr(arr: unknown, sumBig: number, sumMid: number, sumSmall: number): void {
    //@ts-ignore
    return arr.reduce((group: unknown, item: { total: number; pid: number; tid: number; cpu: number }) => {
      const { tid } = item;
      //@ts-ignore
      let tidObj: unknown = group[`${tid}`];
      let cpuType: string = 'mid';
      if (this.bigCores.includes(item.cpu)) {
        cpuType = 'big';
        sumBig += item.total;
      }
      if (this.midCores.includes(item.cpu)) {
        cpuType = 'mid';
        sumMid += item.total;
      }
      if (this.smallCores.includes(item.cpu)) {
        cpuType = 'small';
        sumSmall += item.total;
      }
      if (tidObj) {
        //@ts-ignore
        tidObj.big += cpuType === 'big' ? item.total : 0;
        //@ts-ignore
        tidObj.mid += cpuType === 'mid' ? item.total : 0;
        //@ts-ignore
        tidObj.small += cpuType === 'small' ? item.total : 0;
        //@ts-ignore
        tidObj.total += item.total;
        //@ts-ignore
        tidObj[`cpu${item.cpu}`] = item.total;
      } else {
        //@ts-ignore
        group[`${tid}`] = {
          pid: item.pid,
          pName: this.processMap.get(item.pid) || 'null',
          tid: item.tid,
          tName: this.threadMap.get(item.tid) || 'null',
          total: item.total,
          big: cpuType === 'big' ? item.total : 0,
          mid: cpuType === 'mid' ? item.total : 0,
          small: cpuType === 'small' ? item.total : 0,
        };
        //@ts-ignore
        group[`${tid}`][`cpu${item.cpu}`] = item.total;
      }
      return group;
    }, {});
  }
  //加工Top20线程大中小核占用率数据
  private handlerThreadCpuUsageData(arr: Array<ThreadCpuUsage>): Map<string, ThreadCpuUsage[]> {
    let sumBig = 0;
    let sumMid = 0;
    let sumSmall = 0;
    let reduceObj = this.filterThreadCpuUsageArr(arr, sumBig, sumMid, sumSmall);
    // @ts-ignore
    let source: unknown[] = Object.values(reduceObj);
    for (let obj of source) {
      // @ts-ignore
      obj.bigPercent = sumBig === 0 ? '0' : ((obj.big / sumBig) * 100).toFixed(2);
      // @ts-ignore
      obj.midPercent = sumMid === 0 ? '0' : ((obj.mid / sumMid) * 100).toFixed(2);
      // @ts-ignore
      obj.smallPercent = sumSmall === 0 ? '0' : ((obj.small / sumSmall) * 100).toFixed(2);
      // @ts-ignore
      obj.bigTimeStr = getProbablyTime(obj.big);
      // @ts-ignore
      obj.midTimeStr = getProbablyTime(obj.mid);
      // @ts-ignore
      obj.smallTimeStr = getProbablyTime(obj.small);
    }
    let map: Map<string, Array<ThreadCpuUsage>> = new Map<string, Array<ThreadCpuUsage>>();
    // @ts-ignore
    map.set('total', source.sort((a, b) => b.total - a.total).slice(0, 20));
    // @ts-ignore
    map.set('big', source.sort((a, b) => b.big - a.big).slice(0, 20));
    // @ts-ignore
    map.set('mid', source.sort((a, b) => b.mid - a.mid).slice(0, 20));
    // @ts-ignore
    map.set('small', source.sort((a, b) => b.small - a.small).slice(0, 20));
    // @ts-ignore
    return map;
  }
  private filterThreadFreqData(arr: unknown, sumDur: number): unknown {
    //@ts-ignore
    return arr.reduce((group: unknown, tf: { freqArr: unknown }) => {
      //@ts-ignore
      for (let fa of tf.freqArr) {
        const { cpu, freq } = fa;
        //@ts-ignore
        if (group[`${cpu}-${freq}`]) {
          //@ts-ignore
          group[`${cpu}-${freq}`].time = group[`${cpu}-${freq}`].time + fa.dur;
          //@ts-ignore
          //@ts-ignore
          group[`${cpu}-${freq}`].timeStr = getProbablyTime(group[`${cpu}-${freq}`].time);
          //@ts-ignore
          group[`${cpu}-${freq}`].ratio = ((group[`${cpu}-${freq}`].time / sumDur) * 100).toFixed(2);
        } else {
          //@ts-ignore
          group[`${cpu}-${freq}`] = {
            freq: freq,
            cpu: cpu,
            time: fa.dur,
            timeStr: getProbablyTime(fa.dur),
            ratio: ((fa.dur / sumDur) * 100).toFixed(2),
            totalDur: sumDur,
          };
        }
      }
      return group;
    }, {});
  }

  private handlerThreadFreqData(
    arr: {
      cpu: number;
      dur: number;
      ts: number;
      freqArr: { cpu: number; freq: number; dur: number }[];
    }[]
  ): Array<unknown> {
    let sumDur: number = 0;
    arr.map((it) => {
      it.freqArr = [];
      let itEndTs = it.ts + it.dur;
      let freqArr: CpuMeasure[] = this.cpuFreqMap.get(it.cpu) || [];
      let threadFreqArr = freqArr.filter(
        (f) =>
          (it.ts >= f.ts && it.ts <= f.ts + f.dur) ||
          (it.ts <= f.ts && itEndTs >= f.ts + f.dur) ||
          (itEndTs > f.ts && itEndTs <= f.ts + f.dur)
      );
      for (let tf of threadFreqArr) {
        let tfEndTs = tf.ts + tf.dur;
        it.freqArr.push({
          cpu: it.cpu,
          freq: tf.value as number,
          dur: Math.min(itEndTs, tfEndTs) - Math.max(it.ts, tf.ts),
        });
      }
      sumDur += it.dur;
      return it;
    });
    let obj: unknown = this.filterThreadFreqData(arr, sumDur);
    //@ts-ignore
    let target = Object.values(obj);
    //@ts-ignore
    return target.sort((a, b) => b.time - a.time);
  }
}

export class CpuUsage {
  cpu: number = 0;
  usage: number = 0;
}

export class Irq {
  cpu: number = 0;
  value: string = '';
  block: string = '';
  max: number = 0;
  min: number = 0;
  avg: number = 0;
  sum: number = 0;
  ratio: string = '';
}

export class CpuMeasure {
  cpu: number = 0;
  value: number | string = 0;
  block: string = '';
  ts: number = 0;
  dur: number = 0;
}

export class CpuAnalysis {
  cpu: number = 0;
  value: number = 0;
  sum: number = 0;
  min: number = 0;
  max: number = 0;
  avg: number = 0;
  count: number = 0;
  ratio: string = '';
  block: string = '';
}

export class ThreadCpuUsage {
  cpu: number = 0;
  pid: number = 0;
  pName: string = '';
  tid: number = 0;
  tName: string = '';
  total: number = 0;
  big: number = 0;
  mid: number = 0;
  small: number = 0;
  bigPercent: string = '';
  bigTimeStr: string = '';
  midPercent: string = '';
  midTimeStr: string = '';
  smallPercent: string = '';
  smallTimeStr: string = '';
}

export class FreqThread {
  pid: number = 0;
  pName: string = '';
  tid: number = 0;
  tName: string = '';
  dur: number = 0;
  durStr: string = '';
  ts: number = 0;
  freq: number = 0;
}
