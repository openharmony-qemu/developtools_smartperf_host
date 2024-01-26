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
class DataWorkerThread {
  taskMap: any = {};
  worker?: Worker;
  constructor(worker: Worker) {
    this.worker = worker;
  }
  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  //发送方法名 参数 回调
  queryFunc(action: string, args: any, handler: Function) {
    let id = this.uuid();
    this.taskMap[id] = handler;
    let msg = {
      id: id,
      action: action,
      args: args,
    };
    this.worker!.postMessage(msg);
  }
}

class DbThread {
  busy: boolean = false;
  isCancelled: boolean = false;
  id: number = -1;
  taskMap: any = {};
  cacheArray: Array<any> = [];
  worker?: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  uuid(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  queryFunc(name: string, sql: string, args: any, handler: Function, action: string | null) {
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

  queryProto(name: number, args: any, handler: Function) {
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
  ) {
    this.busy = true;
    let id = this.uuid();
    this.taskMap[id] = (res: any) => {
      DbPool.sharedBuffer = res.buffer;
      if (res.cutStatus) {
        handler(res.cutStatus, res.msg, res.cutBuffer);
      } else {
        handler(res.cutStatus, res.msg);
      }
    };
    caches.match(DbPool.fileCacheKey).then((resData) => {
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
    sdkConfigMap: any;
    fileKey: string;
  }> => {
    return new Promise<any>((resolve, reject) => {
      let id = this.uuid();
      this.taskMap[id] = (res: any) => {
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

  resetWASM() {
    this.worker?.postMessage({
      id: this.uuid(),
      action: 'reset',
    });
  }
}

export class DbPool {
  static sharedBuffer: ArrayBuffer | null = null;
  static fileCacheKey: string = 'null';
  maxThreadNumber: number = 0;
  works: Array<DbThread> = [];
  progress: Function | undefined | null;
  num = Math.floor(Math.random() * 10 + 1) + 20;
  cutDownTimer: any | undefined;
  dataWorker: DataWorkerThread | undefined | null;
  currentWasmThread: DbThread | undefined = undefined;

  init = async (type: string, threadBuild: (() => DbThread) | undefined = undefined) => {
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
          thread = new DbThread(new Worker(new URL('./TraceWorker', import.meta.url)));
        } else if (type === 'server') {
          thread = new DbThread(new Worker(new URL('./SqlLiteWorker', import.meta.url)));
        } else if (type === 'sqlite') {
          thread = new DbThread(new Worker(new URL('./SqlLiteWorker', import.meta.url)));
        }
      }
      if (thread) {
        this.currentWasmThread = thread;
        thread!.worker!.onerror = (err) => {
          console.warn(err);
        };
        thread!.worker!.onmessageerror = (err) => {
          console.warn(err);
        };
        this.threadPostMessage(thread);
        thread!.id = i;
        thread!.busy = false;
        this.works?.push(thread!);
      }
    }
  };
  threadPostMessage(thread: DbThread) {
    thread!.worker!.onmessage = (event: MessageEvent) => {
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
          DbPool.sharedBuffer = null;
        } else if (Reflect.has(event.data, 'init')) {
          if (this.cutDownTimer != undefined) {
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
    DbPool.sharedBuffer = await fetch(url).then((res) => res.arrayBuffer());
    progress('open database', 20);
    for (let thread of this.works) {
      let { status, msg } = await thread.dbOpen('');
      if (!status) {
        DbPool.sharedBuffer = null;
        return { status, msg };
      }
    }
    return { status: true, msg: 'ok' };
  };
  initSqlite = async (buf: ArrayBuffer, parseConfig: string, sdkWasmConfig: string, progress: Function) => {
    this.progress = progress;
    progress('database loaded', 15);
    DbPool.sharedBuffer = buf;
    progress('parse database', 20);
    let configMap;
    for (let thread of this.works) {
      let { status, msg, buffer, sdkConfigMap, fileKey } = await thread.dbOpen(parseConfig, sdkWasmConfig, buf);
      if (!status) {
        DbPool.sharedBuffer = null;
        return { status, msg };
      } else {
        configMap = sdkConfigMap;
        DbPool.sharedBuffer = buffer;
        if (fileKey !== '-1') {
          DbPool.fileCacheKey = fileKey;
        } else {
          DbPool.fileCacheKey = `trace/${new Date().getTime()}-${buffer.byteLength}`;
          this.saveTraceFileBuffer(DbPool.fileCacheKey, buffer).then();
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

  close = async () => {
    clearInterval(this.cutDownTimer);
    for (let thread of this.works) {
      thread.worker?.terminate();
    }
    this.works.length = 0;
  };

  submit(name: string, sql: string, args: any, handler: Function, action: string | null) {
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

  submitProto(name: number, args: any, handler: Function) {
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

  //new method replace submit() method
  submitTask(action: string, args: any, handler: Function) {
    this.dataWorker?.queryFunc(action, args, handler);
  }

  cutFile(leftTs: number, rightTs: number, handler: (status: boolean, msg: string, splitBuffer?: ArrayBuffer) => void) {
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

  progressTimer(num: number, progress: Function) {
    let currentNum = num;
    clearInterval(this.cutDownTimer);
    this.cutDownTimer = setInterval(() => {
      currentNum += Math.floor(Math.random() * 3);
      if (currentNum >= 50) {
        progress('database opened', 40);
        clearInterval(this.cutDownTimer);
      } else {
        progress('database opened', currentNum);
      }
    }, Math.floor(Math.random() * 2500 + 1000));
  }
}

export const threadPool = new DbPool();

export function query<T>(name: string, sql: string, args: any = null, action: string | null = null): Promise<Array<T>> {
  return new Promise<Array<T>>((resolve, reject) => {
    threadPool.submit(
      name,
      sql,
      args,
      (res: any) => {
        if (res[0] && res[0] === 'error') {
          window.publish(window.SmartEvent.UI.Error, res[1]);
          reject(res);
        } else {
          resolve(res);
        }
      },
      action
    );
  });
}
