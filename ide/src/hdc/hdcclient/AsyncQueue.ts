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

import { DataMessage } from '../message/DataMessage';

export class DataMessageQueue<T> {
  private eleArray: Array<T>;

  constructor() {
    this.eleArray = new Array<T>();
  }

  public push(entry: T): boolean {
    if (entry == null) {
      return false;
    }
    this.eleArray.unshift(entry);
    return true;
  }

  public pop(): T | undefined {
    return this.eleArray.pop();
  }

  public size(): number {
    return this.eleArray.length;
  }
}

interface Resolver {
  (data: DataMessage): void;
}

export class AsyncQueue<T> {
  private promiseQueue: DataMessageQueue<Promise<DataMessage>> = new DataMessageQueue<Promise<DataMessage>>();
  private resolverQueue: DataMessageQueue<Resolver> = new DataMessageQueue<Resolver>();

  add() {
    this.promiseQueue.push(
      new Promise((resolve) => {
        this.resolverQueue.push(resolve);
      })
    );
  }

  enqueue(item: DataMessage) {
    if (this.resolverQueue.size() == 0) {
      this.add();
    }
    const resolve = this.resolverQueue.pop();
    resolve ? resolve(item) : null;
  }

  async dequeue(): Promise<DataMessage> {
    if (this.promiseQueue.size() == 0) {
      this.add();
    }
    return this.promiseQueue.pop() || new Promise<DataMessage>(() => {});
  }
}
