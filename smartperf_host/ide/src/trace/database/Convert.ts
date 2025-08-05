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

import { DbPool, getThreadPoolTraceBufferCacheKey, setThreadPoolTraceBuffer } from './SqlLite';

class ConvertThread {
  isCancelled: boolean = false;
  id: number = -1;
  taskMap: unknown = {};
  name: string | undefined;
  worker?: Worker;
  busy: boolean = false;
  constructor(worker: Worker) {
    this.worker = worker;
  }
  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  getConvertData(handler: (status: boolean, msg: string, results: Blob) => void): void {
    this.busy = true;
    let id = this.uuid();
    // @ts-ignore
    this.taskMap[id] = (res: unknown): void => {
      // @ts-ignore
      setThreadPoolTraceBuffer('1', res.buffer);
      // @ts-ignore
      handler(res.status, res.msg, res.results);
    };
    caches.match(getThreadPoolTraceBufferCacheKey('1')).then((resData) => {
      if (resData) {
        resData.arrayBuffer().then((buffer) => {
          this.worker!.postMessage(
            {
              id: id,
              action: 'getConvertData',
              buffer: buffer!,
            },
            [buffer!]
          );
        });
      }
    });
  }
}

class ConvertPool {
  maxThreadNumber: number = 0;
  works: Array<ConvertThread> = [];
  progress: Function | undefined | null;
  static data: Array<string> = [];
  num = Math.floor(Math.random() * 10 + 1) + 20;
  init = async (type: string): Promise<void> => {
    // server
    await this.close();
    if (type === 'convert') {
      this.maxThreadNumber = 1;
    }
    for (let i = 0; i < this.maxThreadNumber; i++) {
      let thread: ConvertThread;
      if (type === 'convert') {
        thread = new ConvertThread(new Worker(new URL('./ConvertTraceWorker', import.meta.url)));
      }
      thread!.worker!.onmessage = (event: MessageEvent): void => {
        thread.busy = false;
        ConvertPool.data = event.data.results;
        // @ts-ignore
        if (Reflect.has(thread.taskMap, event.data.id)) {
          if (event.data.results) {
            // @ts-ignore
            let fun = thread.taskMap[event.data.id];
            if (fun) {
              fun(event.data);
            }
            // @ts-ignore
            Reflect.deleteProperty(thread.taskMap, event.data.id);
          } else {
            // @ts-ignore
            let fun = thread.taskMap[event.data.id];
            if (fun) {
              fun([]);
            }
            // @ts-ignore
            Reflect.deleteProperty(thread.taskMap, event.data.id);
          }
        }
      };
      thread!.worker!.onmessageerror = (e): void => {};
      thread!.worker!.onerror = (e): void => {};
      thread!.id = i;
      thread!.busy = false;
      this.works?.push(thread!);
    }
  };

  clearCache = (): void => {
    for (let i = 0; i < this.works.length; i++) {
      let thread = this.works[i];
      thread.getConvertData(() => {});
    }
  };

  close = async (): Promise<void> => {
    for (let i = 0; i < this.works.length; i++) {
      let thread = this.works[i];
      thread.worker!.terminate();
    }
    this.works.length = 0;
  };

  // @ts-ignore
  submitWithName(
    name: string,
    handler: (status: boolean, msg: string, results: Blob) => void
  ): ConvertThread | undefined {
    let noBusyThreads = this.works;
    let thread: ConvertThread | undefined;
    if (noBusyThreads.length > 0) {
      //取第一个空闲的线程进行任务
      thread = noBusyThreads[0];
      thread!.getConvertData(handler);
    }
    return thread;
  }

  isIdle(): boolean {
    return this.works.every((it) => !it.busy);
  }
}

export const convertPool = new ConvertPool();
