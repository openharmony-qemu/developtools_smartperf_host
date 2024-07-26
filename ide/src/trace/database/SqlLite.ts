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

class DbThread {
  busy: boolean = false;
  id: number = -1;
  //@ts-ignore
  taskMap: unknow = {};
  worker?: Worker;
  traceId: string;

  constructor(worker: Worker, traceId: string) {
    this.worker = worker;
    this.traceId = traceId;
  }

  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: unknow) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  //@ts-ignore
  queryFunc(name: string, sql: string, args: unknow, handler: Function, action: string | null): void {
    this.busy = true;
    let id = this.uuid();
    this.taskMap[id] = handler;
    let msg = {
      id: id,
      name: name,
      action: action || 'exec',
      sql: sql,
      params: args,
    };
    this.worker?.postMessage(msg);
  }

  //@ts-ignore
  queryProto(name: number, args: unknow, handler: Function): void {
    this.busy = true;
    let id = this.uuid();
    this.taskMap[id] = handler;
    let msg = {
      id: id,
      name: name,
      action: 'exec-proto',
      params: args,
    };
    this.worker?.postMessage(msg);
  }

  cutFileByRange(
    leftTs: number,
    rightTs: number,
    handler: (status: boolean, msg: string, splitBuffer?: ArrayBuffer) => void
  ): void {
    this.busy = true;
    let id = this.uuid();
    //@ts-ignore
    this.taskMap[id] = (res: unknow): void => {
      setThreadPoolTraceBuffer(this.traceId, res.buffer);
      if (res.cutStatus) {
        handler(res.cutStatus, res.msg, res.cutBuffer);
      } else {
        handler(res.cutStatus, res.msg);
      }
    };
    caches.match(getThreadPoolTraceBufferCacheKey(this.traceId)).then((resData) => {
      if (resData) {
        resData.arrayBuffer().then((buffer) => {
          this.worker!.postMessage(
            {
              id: id,
              action: 'cut-file',
              leftTs: leftTs,
              rightTs: rightTs,
              buffer: buffer!,
            },
            [buffer!]
          );
        });
      }
    });
  }

  dbOpen = async (
    parseConfig: string,
    sdkWasmConfig?: string,
    buffer?: ArrayBuffer
  ): Promise<{
    status: boolean;
    msg: string;
    buffer: ArrayBuffer;
    //@ts-ignore
    sdkConfigMap: unknow;
    fileKey: string;
  }> => {
    //@ts-ignore
    return new Promise<unknow>((resolve, reject) => {
      let id = this.uuid();
      //@ts-ignore
      this.taskMap[id] = (res: unknow): unknow => {
        if (res.init) {
          resolve({
            status: res.init,
            msg: res.msg,
            sdkConfigMap: res.configSqlMap,
            buffer: res.buffer,
            fileKey: res.fileKey,
          });
        } else {
          resolve({ status: res.init, msg: res.msg });
        }
      };
      this.worker?.postMessage(
        {
          id: id,
          action: 'open',
          parseConfig: parseConfig,
          wasmConfig: sdkWasmConfig,
          buffer: buffer! /*Optional. An ArrayBuffer representing an SQLite Database file*/,
        },
        [buffer!]
      );
    });
  };

  resetWASM(): void {
    this.worker?.postMessage({
      id: this.uuid(),
      action: 'reset',
    });
  }
}

export class DbPool {
  sharedBuffer: ArrayBuffer | null = null;
  fileCacheKey: string = 'null';
  traceId: string;
  maxThreadNumber: number = 0;
  works: Array<DbThread> = [];
  progress: Function | undefined | null;
  num = Math.floor(Math.random() * 10 + 1) + 20;
  cutDownTimer: unknown | undefined;
  currentWasmThread: DbThread | undefined = undefined;

  constructor(traceId: string) {
    this.traceId = traceId;
  }

  init = async (type: string, threadBuild: (() => DbThread) | undefined = undefined): Promise<void> => {
    // wasm | server | sqlite
    if (this.currentWasmThread) {
      this.currentWasmThread.resetWASM();
      this.currentWasmThread = undefined;
    }
    await this.close();
    this.maxThreadNumber = 1;
    for (let i = 0; i < this.maxThreadNumber; i++) {
      let thread: DbThread | undefined;
      if (threadBuild) {
        thread = threadBuild();
      } else {
        if (type === 'wasm') {
          thread = new DbThread(new Worker(new URL('./TraceWorker', import.meta.url)), this.traceId);
        } else if (type === 'server') {
          thread = new DbThread(new Worker(new URL('./SqlLiteWorker', import.meta.url)), this.traceId);
        } else if (type === 'sqlite') {
          thread = new DbThread(new Worker(new URL('./SqlLiteWorker', import.meta.url)), this.traceId);
        }
      }
      if (thread) {
        this.currentWasmThread = thread;
        thread!.worker!.onerror = (err): void => {
          console.warn(err);
        };
        thread!.worker!.onmessageerror = (err): void => {
          console.warn(err);
        };
        this.threadPostMessage(thread);
        thread!.id = i;
        thread!.busy = false;
        this.works?.push(thread!);
      }
    }
  };
  threadPostMessage(thread: DbThread): void {
    thread!.worker!.onmessage = (event: MessageEvent): void => {
      thread!.busy = false;
      if (Reflect.has(thread!.taskMap, event.data.id)) {
        if (event.data.results) {
          let fun = thread!.taskMap[event.data.id];
          if (fun) {
            fun(event.data.results, event.data.len, event.data.transfer, event.data.isEmpty);
          }
          Reflect.deleteProperty(thread!.taskMap, event.data.id);
        } else if (Reflect.has(event.data, 'cutStatus')) {
          let fun = thread!.taskMap[event.data.id];
          if (fun) {
            fun(event.data);
          }
        } else if (Reflect.has(event.data, 'ready')) {
          this.progress!('database opened', this.num + event.data.index);
          this.progressTimer(this.num + event.data.index, this.progress!);
          this.sharedBuffer = null;
        } else if (Reflect.has(event.data, 'init')) {
          if (this.cutDownTimer !== undefined) {
            //@ts-ignore
            clearInterval(this.cutDownTimer);
          }
          let fun = thread!.taskMap[event.data.id];
          if (!event.data.init && !event.data.status) {
            if (fun) {
              fun(['error', event.data.msg]);
            }
          } else {
            this.progress!('database ready', 40);
            if (fun) {
              fun(event.data);
            }
          }
          Reflect.deleteProperty(thread!.taskMap, event.data.id);
        } else {
          let fun = thread!.taskMap[event.data.id];
          if (fun) {
            fun([]);
          }
          Reflect.deleteProperty(thread!.taskMap, event.data.id);
        }
      }
    };
  }

  initServer = async (url: string, progress: Function): Promise<{ status: boolean; msg: string }> => {
    this.progress = progress;
    progress('database loaded', 15);
    this.sharedBuffer = await fetch(url).then((res) => res.arrayBuffer());
    progress('open database', 20);
    for (let thread of this.works) {
      let { status, msg } = await thread.dbOpen('');
      if (!status) {
        this.sharedBuffer = null;
        return { status, msg };
      }
    }
    return { status: true, msg: 'ok' };
  };
  initSqlite = async (
    buf: ArrayBuffer,
    parseConfig: string,
    sdkWasmConfig: string,
    progress: Function
  ): Promise<
    | {
      status: false;
      msg: string;
      sdkConfigMap?: undefined;
    }
    | {
      status: boolean;
      msg: string;
      //@ts-ignore
      sdkConfigMap: unknow;
    }
  > => {
    this.progress = progress;
    progress('database loaded', 15);
    this.sharedBuffer = buf;
    progress('parse database', 20);
    let configMap;
    for (let thread of this.works) {
      let { status, msg, buffer, sdkConfigMap, fileKey } = await thread.dbOpen(parseConfig, sdkWasmConfig, buf);
      if (!status) {
        this.sharedBuffer = null;
        return { status, msg };
      } else {
        configMap = sdkConfigMap;
        this.sharedBuffer = buffer;
        if (fileKey !== '-1') {
          this.fileCacheKey = fileKey;
        } else {
          this.fileCacheKey = `trace/${new Date().getTime()}-${buffer.byteLength}`;
          this.saveTraceFileBuffer(this.fileCacheKey, buffer).then();
        }
      }
    }
    return { status: true, msg: 'ok', sdkConfigMap: configMap };
  };

  async saveTraceFileBuffer(key: string, buffer: ArrayBuffer): Promise<void> {
    await this.obligateFileBufferSpace(buffer.byteLength);
    caches.open(key).then((cache) => {
      let headers = new Headers();
      headers.append('Content-Length', `${buffer.byteLength}`);
      headers.append('Content-Type', 'application/octet-stream');
      cache
        .put(
          key,
          new Response(buffer, {
            status: 200,
            headers: headers,
          })
        )
        .then();
    });
  }

  /**
   * 计算预留缓存空间，如果空间不够，则删除部分缓存
   * @param size
   */
  async obligateFileBufferSpace(size: number): Promise<void> {
    let es = await navigator.storage.estimate();
    let remainderByte = (es.quota || 0) - (es.usage || 0) - 20 * 1024 * 1024;
    if (remainderByte < size) {
      let keys = await caches.keys();
      keys.sort((keyA, keyB) => {
        if (keyA.includes('/') && keyB.includes('/')) {
          let splitA = keyA.split('/');
          let splitB = keyB.split('/');
          let timeA = splitA[splitA.length - 1].split('-')[0];
          let timeB = splitB[splitB.length - 1].split('-')[0];
          return parseInt(timeA) - parseInt(timeB);
        } else {
          return 0;
        }
      });
      let needSize = size - remainderByte;
      for (let key of keys) {
        await caches.delete(key);
        let keySize = parseInt(key.split('-')[1]);
        if (keySize > needSize) {
          return;
        } else {
          needSize -= keySize;
        }
      }
    }
  }

  close = async (): Promise<void> => {
    //@ts-ignore
    clearInterval(this.cutDownTimer);
    for (let thread of this.works) {
      thread.worker?.terminate();
    }
    this.works.length = 0;
  };

  async reset(): Promise<void> {
    if (this.currentWasmThread) {
      this.currentWasmThread.resetWASM();
      this.currentWasmThread = undefined;
    }
    await this.close();
  }

  //@ts-ignore
  submit(name: string, sql: string, args: unknow, handler: Function, action: string | null): void {
    let noBusyThreads = this.works.filter((it) => !it.busy);
    let thread: DbThread;
    if (noBusyThreads.length > 0) {
      //取第一个空闲的线程进行任务
      thread = noBusyThreads[0];
      thread.queryFunc(name, sql, args, handler, action);
    } else {
      // 随机插入一个线程中
      thread = this.works[Math.floor(Math.random() * this.works.length)];
      thread.queryFunc(name, sql, args, handler, action);
    }
  }

  //@ts-ignore
  submitProto(name: number, args: unknow, handler: Function): void {
    let noBusyThreads = this.works.filter((it) => !it.busy);
    let thread: DbThread;
    if (noBusyThreads.length > 0) {
      //取第一个空闲的线程进行任务
      thread = noBusyThreads[0];
      thread.queryProto(name, args, handler);
    } else {
      // 随机插入一个线程中
      thread = this.works[Math.floor(Math.random() * this.works.length)];
      if (thread) {
        thread.queryProto(name, args, handler);
      }
    }
  }

  cutFile(
    leftTs: number,
    rightTs: number,
    handler: (status: boolean, msg: string, splitBuffer?: ArrayBuffer) => void
  ): void {
    let noBusyThreads = this.works.filter((it) => !it.busy);
    let thread: DbThread;
    if (noBusyThreads.length > 0) {
      thread = noBusyThreads[0];
      thread.cutFileByRange(leftTs, rightTs, handler);
    } else {
      thread = this.works[Math.floor(Math.random() * this.works.length)];
      thread.cutFileByRange(leftTs, rightTs, handler);
    }
  }

  progressTimer(num: number, progress: Function): void {
    let currentNum = num;
    //@ts-ignore
    clearInterval(this.cutDownTimer);
    this.cutDownTimer = setInterval(() => {
      currentNum += Math.floor(Math.random() * 3);
      if (currentNum >= 50) {
        progress('database opened', 40);
        //@ts-ignore
        clearInterval(this.cutDownTimer);
      } else {
        progress('database opened', currentNum);
      }
    }, Math.floor(Math.random() * 2500 + 1000));
  }
}

export const threadPool = new DbPool('1');
export const threadPool2 = new DbPool('2');

export interface ThreadPoolConfig {
  action?: string | null,
  traceId?: string | null | undefined
}

export function getThreadPool(traceId?: string | null): DbPool {
  return traceId === '2' ? threadPool2 : threadPool;
}

export function query<T>(
  name: string,
  sql: string,
  args: unknown = null,
  config?: ThreadPoolConfig
): Promise<Array<T>> {
  return new Promise<Array<T>>((resolve, reject): void => {
    getThreadPool(config?.traceId).submit(
      name,
      sql,
      args,
      (res: Array<T>) => {
        if (res[0] && res[0] === 'error') {
          window.publish(window.SmartEvent.UI.Error, res[1]);
          reject(res);
        } else {
          resolve(res);
        }
      },
      config ? (config.action || null) : null
    );
  });
}

export function setThreadPoolTraceBuffer(traceId: string, buf: ArrayBuffer | null): void {
  if (traceId === threadPool2.traceId) {
    threadPool2.sharedBuffer = buf;
  } else {
    threadPool.sharedBuffer = buf;
  }
}

export function getThreadPoolTraceBuffer(traceId: string): ArrayBuffer | null {
  return traceId === threadPool2.traceId ? threadPool2.sharedBuffer : threadPool.sharedBuffer;
}

export function setThreadPoolTraceBufferCacheKey(traceId: string, key: string): void {
  if (traceId === threadPool2.traceId) {
    threadPool2.fileCacheKey = key;
  } else {
    threadPool.fileCacheKey = key;
  }
}

export function getThreadPoolTraceBufferCacheKey(traceId: string): string {
  return traceId === threadPool2.traceId ? threadPool2.fileCacheKey : threadPool.fileCacheKey;
}
