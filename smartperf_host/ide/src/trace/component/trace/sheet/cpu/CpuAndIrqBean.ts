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
export class CpuAndIrqBean {
    startTime: number = 0;
    dur: number = 0;
    endTime: number = 0;
    cat: string = '';
    cpu: number = 0;
    occurrences: number = 1;
    priority:number = 0;
    pid?: number | string;
    tid?: number | string;
    isFirstObject?:number = 1;
}

export class finalResultBean {
    wallDuration?:number | string;
    dur?: number = 0;
    cat?: string = '';
    cpu?: number = 0;
    occurrences?: number = 1;
    pid?: number | string;
    tid?: number | string;
}

export class byCpuGroupBean {
    CPU: CpuAndIrqBean[] = [];
}

export class softirqAndIrq {
    occurrences: number = 0;
    wallDuration: number = 0;
    avgDuration: number = 0;
    //@ts-ignore
    cpus: { [cpu: number]: number } = {}; // 初始化 cpus 属性为一个空对象
    [cpuDurKey: string]: number;
    //@ts-ignore
    tid?: number|string;
    //@ts-ignore
    pid?: number|string;
    //@ts-ignore
    process?: string;
    //@ts-ignore  
    thread?: string; 
}