export class StateGroup {
    SleepingCount: number = 0;
    RunningCount: number = 0;
    RunnableCount: number = 0;
    DCount: number = 0;
    RunningDur: number = 0;
    RunnableDur: number = 0;
    SleepingDur: number = 0;
    DDur: number = 0;
    title?: string = '';
    pid: number = 0;
    tid: number = 0;
    ts: number = 0;
    dur?: number = 0;
    type: string = '';
    state?: string = '';
    children?: Array<StateGroup>;
    isSelected?: boolean = false;
    totalCount?: number = 0;
    cycleDur?: number;
    cycle:number = 0;
    id?:number;
    cpu?:number = 0;
}

export class FuncNameCycle {
    funcName: string = '';
    cycleStartTime: number = 0;
    cycleDur: number = 0;
    startTime: number = 0;
    endTime: number = 0;
    id: number = 0;
    tid: number = 0;
    pid: number = 0;
  }