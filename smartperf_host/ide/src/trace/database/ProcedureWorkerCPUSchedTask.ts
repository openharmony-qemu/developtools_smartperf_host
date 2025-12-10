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


(self as unknown as Worker).onmessage = (e: MessageEvent): void => {
    orgnazitionStcData(e.data);
}



function orgnazitionStcData(
    args: {
        leftNs: number,
        rightNs: number,
        recordStartNS: number,
        schedTaskData: unknown[]
    }
): void {
    let group: unknown = {};
    args.schedTaskData.forEach((task) => {
        let item = {
            // @ts-ignore
            pid: task.pid,// @ts-ignore
            tid: task.tid,// @ts-ignore
            count: 1, //@ts-ignore
            startTime: task.startTime,// @ts-ignore
            processName: '',// @ts-ignore
            threadName: '',// @ts-ignore
            interval: task.interval,// @ts-ignore
            currMono: task.curr_mono,// @ts-ignore
            expireMono: task.expire_mono
        };// @ts-ignore
        if (group[`${task.pid}`]) {
            setTaskData(group,item);
        } else {
            // @ts-ignore
            group[`${task.pid}`] = {
                // @ts-ignore
                pid: task.pid,// @ts-ignore
                count: 1, //@ts-ignore
                processName: '',// @ts-ignore
                children: [
                    {
                        // @ts-ignore
                        pid: task.pid,// @ts-ignore
                        tid: task.tid,// @ts-ignore
                        count: 1, //@ts-ignore
                        processName: '',// @ts-ignore
                        threadName: '',
                    }
                ]
            }
        }
    });
    // @ts-ignore
    let resultList = Object.values(group);
    self.postMessage(resultList);
}

function setTaskData(group: unknown, item: unknown) {
    // @ts-ignore
    let process = group[`${item.pid}`];
    process.count += 1;
    // @ts-ignore
    let thread = process.children.find((child) => child.tid === item.tid);
    if (thread) {
        thread.count += 1;
    } else {
        process.children.push({
            // @ts-ignore
            pid: item.pid,// @ts-ignore
            tid: item.tid,// @ts-ignore
            count: 1, //@ts-ignore
            processName: '',// @ts-ignore
            threadName: '',
        })
    }
}