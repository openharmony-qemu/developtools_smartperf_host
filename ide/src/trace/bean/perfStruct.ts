const ROW_TYPE = 'hiperf';


export class perfFireChartStruct {
    thread_id:number;
    name: string;
    depth: number;
    selfTime: number;
    totalTime: number;
    id: number;

    constructor(
        id: number,
        name: string,
        depth: number,
        selfTime: number,
        totalTime: number,
        thread_id:number,
    ) {
        this.id = id;
        this.name = name;
        this.depth = depth;
        this.selfTime = selfTime;
        this.totalTime = totalTime;
        this.thread_id = thread_id;
    }
}

// 绘图所需树结构模板
export class hiPerfchartFrame extends perfFireChartStruct {
    startTime: number;
    endTime: number;
    children: Array<hiPerfchartFrame>;
    isSelect: boolean = false;
    line: number = 0;
    column: number = 0;
    thread_id: number=0;

    constructor(
        id: number,
        name: string,
        startTime: number,
        endTime: number,
        totalTime: number,
        depth: number,
        thread_id:number,
    ) {
        super(id, name, depth, 0, totalTime,thread_id);
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.thread_id = thread_id;
        this.children = new Array<hiPerfchartFrame>();
    }
}