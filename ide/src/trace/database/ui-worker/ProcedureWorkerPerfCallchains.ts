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

class PerfCallChainThread {
  taskMap: any = {};
  worker?: Worker;
  busy: boolean = false;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  queryFunc(name: string, args: any, handler: Function, action: string | null) {
    this.busy = true;
    let id = this.uuid();
    this.taskMap[id] = handler;
    let msg = {
      id: id,
      name: name,
      action: action || 'exec',
      params: args,
    };
    this.worker!.postMessage(msg);
  }
}

export class PerfCallChainPool {
  maxThreadNumber: number = 0;
  works: Array<PerfCallChainThread> = [];

  close = async () => {
    for (let i = 0; i < this.works.length; i++) {
      let thread = this.works[i];
      thread.worker!.terminate();
    }
    this.works.length = 0;
  };

  init = async () => {
    await this.close();
    let thread = new PerfCallChainThread(
      new Worker(new URL('../../component/chart/PerfDataQuery', import.meta.url), { type: 'module' })
    ); //trace/component/chart/PerfDataQuery.js
    thread!.worker!.onmessage = (event: MessageEvent) => {
      thread.busy = false;
      let fun = thread.taskMap[event.data.id];
      if (fun) {
        fun(event.data.results);
      }
      Reflect.deleteProperty(thread.taskMap, event.data.id);
    };
    thread!.worker!.onmessageerror = (e) => {};
    thread!.worker!.onerror = (e) => {};
    thread!.busy = false;
    this.works?.push(thread!);
  };

  submit(name: string, args: any, handler: Function, action: string | null) {
    let noBusyThreads = this.works.filter((it) => !it.busy);
    let thread: PerfCallChainThread;
    if (noBusyThreads.length > 0) {
      //取第一个空闲的线程进行任务
      thread = noBusyThreads[0];
      thread.queryFunc(name, args, handler, action);
    } else {
      // 随机插入一个线程中
      thread = this.works[Math.floor(Math.random() * this.works.length)];
      thread.queryFunc(name, args, handler, action);
    }
  }
}

export const callChainsPool = new PerfCallChainPool();
