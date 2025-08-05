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

import { query } from './SqlLite';

class ProcedureThread {
  busy: boolean = false;
  isCancelled: boolean = false;
  id: number = -1; //@ts-ignore
  taskMap: unknown = {};
  name: string | undefined;
  worker?: Worker;
  constructor(worker: Worker) {
    this.worker = worker;
  }
  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }
  //@ts-ignore
  queryFunc(type: string, args: unknown, transfer: unknown, handler: Function): void {
    this.busy = true;
    let id = this.uuid(); // @ts-ignore
    this.taskMap[id] = handler;
    let pam = {
      id: id,
      type: type,
      params: args,
    };
    if (transfer) {
      try {
        if (Array.isArray(transfer)) {
          if (transfer.length > 0) {
            this.worker!.postMessage(pam, [...transfer]);
          } else {
            this.worker!.postMessage(pam);
          }
        } else {
          // @ts-ignore
          this.worker!.postMessage(pam, [transfer]);
        }
      } catch (
        //@ts-ignore
        e: unknown
      ) {}
    } else {
      this.worker!.postMessage(pam);
    }
  }

  cancel(): void {
    this.isCancelled = true;
    this.worker!.terminate();
  }
}

class ProcedurePool {
  static cpuCount = Math.floor((window.navigator.hardwareConcurrency || 4) / 2);
  maxThreadNumber: number = 1;
  works: Array<ProcedureThread> = [];
  timelineChange:
    | ((
        //@ts-ignore
        a: unknown
      ) => void)
    | undefined
    | null = null;
  cpusLen = ProcedurePool.build('cpu', 0);
  freqLen = ProcedurePool.build('freq', 0);
  processLen = ProcedurePool.build('process', 0);
  logicDataLen = ProcedurePool.build('logic', 2);
  names = [...this.cpusLen, ...this.processLen, ...this.freqLen];
  logicDataHandles = [...this.logicDataLen];

  onComplete: Function | undefined; //任务完成回调

  constructor(threadBuild: (() => ProcedureThread) | undefined = undefined) {
    this.init(threadBuild);
  }

  static build(name: string, len: number): string[] {
    return [...Array(len).keys()].map((it) => `${name}${it}`);
  }

  init(threadBuild: (() => ProcedureThread) | undefined = undefined): void {
    this.maxThreadNumber = this.names.length;
    for (let i = 0; i < this.maxThreadNumber; i++) {
      this.newThread();
    }
    for (let j = 0; j < this.logicDataHandles.length; j++) {
      this.logicDataThread();
    }
  }

  newThread(): void {
    // @ts-ignore
    if (window.useWb) {
      return;
    }
    let newThread: ProcedureThread = new ProcedureThread(
      new Worker(new URL('./ui-worker/ProcedureWorker', import.meta.url), {
        type: 'module',
      })
    );
    newThread.name = this.names[this.works.length];
    newThread.worker!.onmessage = (event: MessageEvent): void => {
      newThread.busy = false;
      if ((event.data.type as string) === 'timeline-range-changed') {
        this.timelineChange?.(event.data.results);
        newThread.busy = false;
        return;
      } // @ts-ignore
      if (Reflect.has(newThread.taskMap, event.data.id)) {
        if (event.data) {
          // @ts-ignore
          let fun = newThread.taskMap[event.data.id];
          if (fun) {
            fun(event.data.results, event.data.hover);
          } // @ts-ignore
          Reflect.deleteProperty(newThread.taskMap, event.data.id);
        }
      }
      if (this.isIdle() && this.onComplete) {
        this.onComplete();
      }
    };
    newThread.worker!.onmessageerror = (e): void => {};
    newThread.worker!.onerror = (e): void => {};
    newThread.id = this.works.length;
    newThread.busy = false;
    this.works?.push(newThread);
  }

  private logicDataThread(): void {
    // @ts-ignore
    if (window.useWb) {
      return;
    }
    let thread: ProcedureThread = new ProcedureThread(
      new Worker(new URL('./logic-worker/ProcedureLogicWorker', import.meta.url), {
        type: 'module',
      })
    );
    thread.name = this.logicDataHandles[this.works.length - this.names.length];
    this.sendMessage(thread);
    thread.worker!.onmessageerror = (e): void => {};
    thread.worker!.onerror = (e): void => {};
    thread.id = this.works.length;
    thread.busy = false;
    this.works?.push(thread);
  }

  private sendMessage(thread: ProcedureThread): void {
    thread.worker!.onmessage = (event: MessageEvent): void => {
      thread.busy = false;
      if (event.data.isQuery) {
        query(event.data.type, event.data.sql, event.data.args, { action : 'exec-buf' }).then(
          (
            // @ts-ignore
            res: unknown
          ) => {
            thread.worker!.postMessage({
              type: event.data.type,
              params: {
                list: res,
              },
              id: event.data.id,
            });
          }
        );
        return;
      }
      if (event.data.isSending) {
        if (
          Reflect.has(
            // @ts-ignore
            thread.taskMap,
            event.data.id
          )
        ) {
          if (event.data) {
            // @ts-ignore
            let fun = thread.taskMap[event.data.id];
            if (fun) {
              fun(event.data.results, event.data.hover);
            }
            return;
          }
        }
      } // @ts-ignore
      if (Reflect.has(thread.taskMap, event.data.id)) {
        if (event.data) {
          // @ts-ignore
          let fun = thread.taskMap[event.data.id];
          if (fun) {
            fun(event.data.results, event.data.hover);
          } // @ts-ignore
          Reflect.deleteProperty(thread.taskMap, event.data.id);
        }
      }
      if (this.isIdle() && this.onComplete) {
        this.onComplete();
      }
    };
  }

  close = (): void => {
    for (let thread of this.works) {
      thread.worker!.terminate();
    }
    this.works.length = 0;
  };

  clearCache = (): void => {
    for (let thread of this.works) {
      thread.queryFunc('clear', {}, undefined, () => {});
    }
  };

  submitWithName(name: string, type: string, args: unknown, transfer: unknown, handler: Function): unknown {
    let noBusyThreads = this.works.filter((it) => it.name === name);
    let thread: ProcedureThread | undefined;
    if (noBusyThreads.length > 0) {
      //取第一个空闲的线程进行任务
      thread = noBusyThreads[0];
      thread!.queryFunc(type, args, transfer, handler);
    }
    return thread;
  }
  // @ts-ignore
  submitWithNamePromise(name: string, type: string, args: unknown, transfer: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let noBusyThreads = this.works.filter((it) => it.name === name);
      let thread: ProcedureThread | undefined;
      if (noBusyThreads.length > 0) {
        //取第一个空闲的线程进行任务
        thread = noBusyThreads[0]; // @ts-ignore
        thread!.queryFunc(type, args, transfer, (res: unknown, hover: unknown) => {
          resolve({
            res: res,
            hover: hover,
          });
        });
      }
    });
  }

  isIdle(): boolean {
    return this.works.every((it) => !it.busy);
  }
}

export const procedurePool = new ProcedurePool();
