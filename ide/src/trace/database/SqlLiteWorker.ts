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

import {WebSocketManager} from "../../webSocket/WebSocketManager";

importScripts('sql-wasm.js');
// @ts-ignore
import { temp_init_sql_list } from './TempSql';
import { execProtoForWorker } from './data-trafic/utils/ExecProtoForWorker';
import { TraficEnum } from './data-trafic/utils/QueryEnum';
import {Constants, TypeConstants} from "../../webSocket/Constants";

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
  const fileList = e.data.params as Array<File>;
  const file = fileList[0];
  const result = 'ok';
  if (fileList) {
    fileList.sort((a, b) => b.size - a.size);
    uploadAllFilesRecursively(fileList);
  }
  self.postMessage({
    id: uploadSoActionId,
    action: 'upload-so',
    results: { result: result, failedArray: failedArray },
  });
}

// 递归上传文件
function uploadAllFilesRecursively(fileList: Array<File>): void {
  if (fileList.length === 0) {
    console.log("All files have been uploaded.");
    return; // 所有文件上传完成
  }

  // 上传第一个文件
  const file = fileList[0];
  uploadSoFile(file).then(() => {
    console.log(`File ${file.name} uploaded successfully.`);
    // 删除数组中的第一个元素
    fileList.shift();
    // 递归调用上传下一个文件
    uploadAllFilesRecursively(fileList);
  }).catch((error) => {
    console.error(`Failed to upload file: ${file.name}`, error);
    // 继续上传下一个，即使失败也继续
    fileList.shift();
    uploadAllFilesRecursively(fileList);
  });
}


const uploadSoFile = async (file: File | null): Promise<void> => {
  if (file) {
    let fileNameBuffer: Uint8Array | null = enc.encode(file.webkitRelativePath);
    let fileNameLength = fileNameBuffer.length;
    let writeSize = 0;
    let wsInstance = WebSocketManager.getInstance()
    const fileName = file.name;
    let bufferIndex = 0;
    while (writeSize < file.size) {
      let sliceLen = Math.min(file.size - writeSize, REQ_BUF_SIZE);
      let blob: Blob | null = file.slice(writeSize, writeSize + sliceLen);
      let buffer: ArrayBuffer | null = await blob.arrayBuffer();
      let data: Uint8Array | null = new Uint8Array(buffer);
      let fileTotalSize = file.size;
      writeSize += sliceLen;
      //@ts-ignore
      if (wsInstance) {
        // 构造包含元数据和文件内容的对象
        const dataObject = {
          file_name: fileName,
          buffer_index: bufferIndex,
          buffer_size: sliceLen,
          total_size: fileTotalSize,
          is_last: writeSize >= file.size,
          buffer: Array.from(data), // 将 Uint8Array 转换为普通数组，以便可以序列化为 JSON
        };

        // 将对象序列化为 JSON 字符串
        const dataString = JSON.stringify(dataObject);

        // 使用 TextEncoder 将字符串编码为 Uint8Array
        const textEncoder = new TextEncoder();
        const encodedData = textEncoder.encode(dataString);

        // 通过 WebSocket 发送数据
        wsInstance.sendMessage(TypeConstants.DISASSEMBLY_TYPE, Constants.DISASSEMBLY_SAVE_CMD, encodedData);
      }

      // 更新当前片段索引
      bufferIndex++;
      data = null;
      buffer = null;
      blob = null;
    }
    file = null;
    fileNameBuffer = null;
  }
};
