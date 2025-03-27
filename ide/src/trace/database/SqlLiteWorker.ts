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

importScripts('sql-wasm.js');
// @ts-ignore
import {WebSocketManager} from '../../webSocket/WebSocketManager';

importScripts('sql-wasm.js');
// @ts-ignore
import { temp_init_sql_list } from './TempSql';
import { execProtoForWorker } from './data-trafic/utils/ExecProtoForWorker';
import { TraficEnum } from './data-trafic/utils/QueryEnum';

let conn: unknown = null;
let enc = new TextEncoder();
let dec = new TextDecoder();
const REQ_BUF_SIZE = 4 * 1024 * 1024;
let uploadSoActionId: string = '';
const failedArray: Array<string> = [];
self.onerror = function (error): void { };

self.onmessage = async (e: unknown): Promise<void> => {
  //@ts-ignore
  const action = e.data.action;
  //@ts-ignore
  const id = e.data.id;
  if (action === 'open') {
    //@ts-ignore
    let array = new Uint8Array(e.data.buffer);
    // @ts-ignore
    initSqlJs({ locateFile: (filename) => `${filename}` }).then((SQL: unknown) => {
      // @ts-ignore
      conn = new SQL.Database(array);
      self.postMessage({ id: id, ready: true, index: 0 });
      // @ts-ignore
      if (temp_init_sql_list && temp_init_sql_list.length > 0) {
        // @ts-ignore
        temp_init_sql_list.forEach((item, index) => {
          // @ts-ignore
          let r = conn.exec(item);
          self.postMessage({
            id: id,
            ready: true,
            index: index + 1,
          });
        });
      }
      self.postMessage({ id: id, init: true });
    });
  } else if (action === 'close') {
  } else if (action === 'exec' || action === 'exec-buf' || action === 'exec-metric') {
    try {
      //@ts-ignore
      let sql = e.data.sql;
      //@ts-ignore
      let params = e.data.params;
      // @ts-ignore
      const stmt = conn.prepare(sql);
      stmt.bind(params);
      let res = [];
      while (stmt.step()) {
        //@ts-ignore
        res.push(stmt.getAsObject());
      }
      stmt.free();
      // @ts-ignore
      self.postMessage({ id: id, results: res });
    } catch (err) {
      self.postMessage({
        id: id,
        results: [],
        //@ts-ignore
        error: err.message,
      });
    }
  } else if (action === 'exec-proto') {
    //@ts-ignore
    e.data.params.trafic = TraficEnum.Memory;
    //@ts-ignore
    execProtoForWorker(e.data, (sql: string) => {
      try {
        // @ts-ignore
        const stmt = conn.prepare(sql);
        let res = [];
        while (stmt.step()) {
          //@ts-ignore
          res.push(stmt.getAsObject());
        }
        stmt.free();
        return res;
      } catch (err: unknown) {
        console.log(err);
        return [];
      }
    });
  } else if (action === 'upload-so') {
    onmessageByUploadSoAction(e);
  }
};

function onmessageByUploadSoAction(e: unknown): void {
  // @ts-ignore
  uploadSoActionId = e.data.id;
  // @ts-ignore
  const result = 'ok';
  self.postMessage({
    id: uploadSoActionId,
    action: 'upload-so',
    results: { result: result, failedArray: failedArray },
  });
}