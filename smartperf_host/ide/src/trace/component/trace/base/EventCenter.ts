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

class Event {
  map: unknown;
  constructor() {
    this.map = {};
  }

  subscribe(event: string, fn: Function): void {
    //@ts-ignore
    this.map[event] = this.map[event] || []; //@ts-ignore
    this.map[event].push(fn);
  }
  publish(event: string, data: unknown): void {
    //@ts-ignore
    const fnList = this.map[event] || [];
    if (!fnList || fnList.length === 0) {
      return;
    }
    fnList.forEach((fn: Function) => fn.call(undefined, data));
  }
  unsubscribe(event: string, fn: Function): void {
    //@ts-ignore
    const fnList = this.map[event] || [];
    const index = fnList.indexOf(fn);
    if (index < 0) {
      return;
    }
    fnList.splice(index, 1);
  }
  subscribeOnce(event: string, callback: Function): void {
    const f = (data: unknown): void => {
      callback(data);
      this.unsubscribe(event, f);
    };
    this.subscribe(event, f);
  }

  clearTraceRowComplete(): void {
    //@ts-ignore
    if (this.map[window.SmartEvent.UI.TraceRowComplete].length > 0) {
      //@ts-ignore
      this.map[window.SmartEvent.UI.TraceRowComplete] = [];
    }
  }
}

export const EventCenter = new Event();
