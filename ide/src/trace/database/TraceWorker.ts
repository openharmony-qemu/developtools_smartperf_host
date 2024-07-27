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

importScripts('trace_streamer_builtin.js');
import { execProtoForWorker } from './data-trafic/utils/ExecProtoForWorker';
import { QueryEnum, TraficEnum } from './data-trafic/utils/QueryEnum';
// @ts-ignore
import { temp_init_sql_list } from './TempSql';
// @ts-ignore
import { BatchSphData } from '../proto/SphBaseData';

enum TsLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
  OFF = 5,
}

let wasmModule: unknown = null;
let enc = new TextEncoder();
let dec = new TextDecoder();
let arr: Uint8Array | undefined;
const REQ_BUF_SIZE = 4 * 1024 * 1024;
let reqBufferAddr: number = -1;
let bufferSlice: Array<Uint8Array> = [];
let headUnitArray: Uint8Array | undefined;
let thirdWasmMap = new Map();
let thirdJsonResult = new Map();

const CONTENT_TYPE_CMDLINES = 2;
const CONTENT_TYPE_TGIDS = 3;
const CONTENT_TYPE_HEADER_PAGE = 30;
const CONTENT_TYPE_PRINTK_FORMATS = 31;
const CONTENT_TYPE_KALLSYMS = 32;

let arkTsData: Array<Uint8Array> = [];
let arkTsDataSize: number = 0;

let currentAction: string = '';
let currentActionId: string = '';
let ffrtFileCacheKey = '-1';
let indexDB: IDBDatabase;
const maxSize = 48 * 1024 * 1024;
const currentTSLogLevel = TsLogLevel.OFF;
//@ts-ignore
let protoDataMap: Map<QueryEnum, BatchSphData> = new Map<QueryEnum, BatchSphData>();
function clear(): void {
  if (wasmModule !== null) {
    //@ts-ignore
    wasmModule._TraceStreamerReset();
    wasmModule = null;
  }
  if (arr) {
    arr = undefined;
  }
  if (headUnitArray) {
    headUnitArray = undefined;
  }
  if (bufferSlice) {
    bufferSlice.length = 0;
  }
  thirdWasmMap.clear();
  thirdJsonResult.clear();
}

self.addEventListener('unhandledrejection', (err) => {
  self.postMessage({
    id: currentActionId,
    action: currentAction,
    init: false,
    status: false,
    msg: err.reason.message,
  });
});

function initWASM(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    let wasm = trace_streamer_builtin_wasm;
    wasmModule = wasm({
      locateFile: (s: unknown) => {
        return s;
      },
      print: (line: string) => {
        if (currentTSLogLevel < TsLogLevel.OFF) {
          console.log(line);
        }
      },
      printErr: (line: string) => {
        if (currentTSLogLevel < TsLogLevel.OFF) {
          console.error(line);
        }
      },
      onRuntimeInitialized: () => {
        resolve('ok');
      },
      onAbort: () => {
        reject('on abort');
      },
    });
  });
}

function initThirdWASM(wasmFunctionName: string): unknown {
  function callModelFun(functionName: string): unknown {
    let func = eval(functionName);
    return new func({
      locateFile: (s: unknown): unknown => {
        return s;
      },
      print: (line: string): void => {
        if (currentTSLogLevel < TsLogLevel.OFF) {
          console.log(line);
        }
      },
      printErr: (line: string): void => {
        if (currentTSLogLevel < TsLogLevel.OFF) {
          console.error(line);
        }
      },
      onRuntimeInitialized: (): void => { },
      onAbort: (): void => { },
    });
  }

  return callModelFun(wasmFunctionName);
}

let merged = (): Uint8Array => {
  let length = 0;
  bufferSlice.forEach((item) => {
    //@ts-ignore
    length += item.length;
  });
  let mergedArray = new Uint8Array(length);
  let offset = 0;
  bufferSlice.forEach((item) => {
    //@ts-ignore
    mergedArray.set(item, offset);
    //@ts-ignore
    offset += item.length;
  });
  return mergedArray;
};

let translateJsonString = (str: string): string => {
  return str //   .padding
    .replace(/[\t|\r|\n]/g, '');
};

let convertJSON = (): unknown[] => {
  try {
    let str = dec.decode(arr);
    let jsonArray: Array<unknown> = [];
    str = str.substring(str.indexOf('\n') + 1);
    if (!str) {
    } else {
      let parse;
      let tansStr: string;
      try {
        tansStr = str.replace(/[\t\r\n]/g, '');
        parse = JSON.parse(tansStr);
      } catch {
        try {
          tansStr = tansStr!.replace(/[^\x20-\x7E]/g, '?'); //匹配乱码字 符，将其转换为？
          parse = JSON.parse(tansStr);
        } catch {
          tansStr = tansStr!.replace(/\\/g, '\\\\');
          parse = JSON.parse(tansStr);
        }
      }
      let columns = parse.columns;
      let values = parse.values;
      for (let i = 0; i < values.length; i++) {
        let obj: unknown = {};
        for (let j = 0; j < columns.length; j++) {
          //@ts-ignore
          obj[columns[j]] = values[i][j];
        }
        jsonArray.push(obj);
      }
    }
    return jsonArray;
  } catch (e) {
    self.postMessage({
      id: currentActionId,
      action: currentAction,
      init: false,
      status: false,
      //@ts-ignore
      msg: e.message,
    });
    return [];
  }
};

/**
 * 计算预留缓存空间，如果空间不够，则删除部分缓存
 * @param size
 */
function saveTraceFileBuffer(key: string, buffer: ArrayBuffer): void {
  obligateFileBufferSpace(buffer.byteLength).then(() => {
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
  });
}

async function obligateFileBufferSpace(size: number): Promise<void> {
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

async function onmessageByOpenAction(e: MessageEvent): Promise<void> {
  await initWASM();
  ffrtFileCacheKey = '-1';
  // @ts-ignore
  self.postMessage({
    id: e.data.id,
    action: e.data.action,
    ready: true,
    index: 0,
  });
  let uint8Array = new Uint8Array(e.data.buffer);
  initModuleCallBackAndFun();
  parseThirdWasmByOpenAction(e);
  let wrSize = 0;
  let r2 = -1;
  if (isRawTrace(e.data)) {
    r2 = parseRawTraceByOpenAction(e, wrSize, r2, uint8Array);
  } else {
    r2 = parseNormalTraceByOpenAction(wrSize, r2, uint8Array);
  }
  //@ts-ignore
  wasmModule._TraceStreamerParseDataOver();
  for (let value of thirdWasmMap.values()) {
    value.model._TraceStreamerInParseDataOver();
  }
  postMessageByOpenAction(r2, e);
}

function initModuleCallBackAndFun(): void {
  let callback = (heapPtr: number, size: number, isEnd: number): void => {
    //@ts-ignore
    let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
    bufferSlice.push(out);
    if (isEnd === 1) {
      arr = merged();
      bufferSlice.length = 0;
    }
  };
  let ffrtConvertCallback = (heapPtr: number, size: number, isEnd: number): void => {
    if (isEnd !== 1) {
      //@ts-ignore
      let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
      bufferSlice.push(out);
    } else {
      arr = merged();
      bufferSlice.length = 0;
      ffrtFileCacheKey = `ffrt/${new Date().getTime()}-${arr.buffer.byteLength}`;
      saveTraceFileBuffer(ffrtFileCacheKey, arr.buffer);
    }
  };
  let tlvResultCallback = (heapPtr: number, size: number, type: number, isEnd: number): void => {
    //@ts-ignore
    let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
    protoDataMap.set(type, BatchSphData.decode(out).values);
  };
  //@ts-ignore
  let fn1 = wasmModule.addFunction(callback, 'viii');
  //@ts-ignore
  let fn2 = wasmModule.addFunction(ffrtConvertCallback, 'viii');
  //@ts-ignore
  let tlvResultFun = wasmModule.addFunction(tlvResultCallback, 'viiii');
  //@ts-ignore
  wasmModule._TraceStreamerSetLogLevel(currentTSLogLevel);
  //@ts-ignore
  reqBufferAddr = wasmModule._Initialize(REQ_BUF_SIZE, fn1, tlvResultFun, fn2);
}

function parseThirdWasmByOpenAction(e: MessageEvent): void {
  let parseConfig = e.data.parseConfig;
  if (parseConfig !== '') {
    let parseConfigArray = enc.encode(parseConfig);
    //@ts-ignore
    let parseConfigAddr = wasmModule._InitializeParseConfig(1024);
    //@ts-ignore
    wasmModule.HEAPU8.set(parseConfigArray, parseConfigAddr);
    //@ts-ignore
    wasmModule._TraceStreamerParserConfigEx(parseConfigArray.length);
  }
  let wasmConfigStr = e.data.wasmConfig;
  if (wasmConfigStr !== '' && wasmConfigStr.indexOf('WasmFiles') !== -1) {
    let wasmConfig = JSON.parse(wasmConfigStr);
    let wasmConfigs = wasmConfig.WasmFiles;
    let itemArray = wasmConfigs.map((item: unknown) => {
      //@ts-ignore
      return item.componentId + ';' + item.pluginName;
    });
    let thirdWasmStr: string = itemArray.join(';');
    let configUintArray = enc.encode(thirdWasmStr + ';');
    //@ts-ignore
    wasmModule.HEAPU8.set(configUintArray, reqBufferAddr);
    //@ts-ignore
    wasmModule._TraceStreamerInitThirdPartyConfig(configUintArray.length);
    let first = true;
    let sendDataCallback = (heapPtr: number, size: number, componentID: number): void => {
      if (componentID === 100) {
        if (first) {
          first = false;
          //@ts-ignore
          headUnitArray = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
        }
        return;
      }
      let configs = wasmConfigs.filter((wasmConfig: unknown) => {
        //@ts-ignore
        return wasmConfig.componentId === componentID;
      });
      if (configs.length > 0) {
        let config = configs[0];
        let model = thirdWasmMap.get(componentID);
        if (!model && config.componentId === componentID) {
          importScripts(config.wasmJsName);
          setThirdWasmMap(config, heapPtr, size, componentID);
        } else {
          let mm = model.model;
          //@ts-ignore
          let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
          mm.HEAPU8.set(out, model.bufferAddr);
          mm._ParserData(out.length, componentID);
        }
      }
    };
    //@ts-ignore
    let fn1 = wasmModule.addFunction(sendDataCallback, 'viii');
    //@ts-ignore
    wasmModule._TraceStreamerSetThirdPartyDataDealer(fn1, REQ_BUF_SIZE);
  }
}

function isCommonData(dataType: number): boolean {
  return (
    dataType === CONTENT_TYPE_CMDLINES ||
    dataType === CONTENT_TYPE_TGIDS ||
    dataType === CONTENT_TYPE_HEADER_PAGE ||
    dataType === CONTENT_TYPE_PRINTK_FORMATS ||
    dataType === CONTENT_TYPE_KALLSYMS
  );
}

function parseRawTraceByOpenAction(e: MessageEvent, wrSize: number, r2: number, uint8Array: Uint8Array): number {
  let commonDataOffsetList: Array<{ startOffset: number; endOffset: number }> = []; // common Data
  let offset = 12;
  let tlvTypeLength = 4;
  let headArray = uint8Array.slice(0, offset);
  let commonTotalLength = 0;
  while (offset < uint8Array.length) {
    let commonDataOffset = { startOffset: offset, endOffset: offset };
    let dataTypeData = e.data.buffer.slice(offset, offset + tlvTypeLength);
    offset += tlvTypeLength;
    let dataType = Array.from(new Uint32Array(dataTypeData));
    let currentLData = e.data.buffer.slice(offset, offset + tlvTypeLength);
    offset += tlvTypeLength;
    let currentVLength = Array.from(new Uint32Array(currentLData));
    offset += currentVLength[0];
    commonDataOffset.endOffset = offset;
    if (isCommonData(dataType[0])) {
      commonTotalLength += commonDataOffset.endOffset - commonDataOffset.startOffset;
      commonDataOffsetList.push(commonDataOffset);
    }
  }
  let frontData = new Uint8Array(headArray.byteLength + commonTotalLength); // HeadArray
  frontData.set(headArray, 0);
  let lengthOffset = headArray.byteLength;
  commonDataOffsetList.forEach((item) => {
    let commonData = uint8Array.slice(item.startOffset, item.endOffset);
    frontData.set(commonData, lengthOffset);
    lengthOffset += commonData.byteLength;
  });
  let freeData = uint8Array.slice(12);
  let final = new Uint8Array(frontData.length + freeData.length);
  final.set(frontData);
  final.set(freeData, frontData.length);
  wrSize = 0;
  while (wrSize < final.length) {
    const sliceLen = Math.min(final.length - wrSize, REQ_BUF_SIZE);
    const dataSlice = final.subarray(wrSize, wrSize + sliceLen);
    //@ts-ignore
    wasmModule.HEAPU8.set(dataSlice, reqBufferAddr);
    wrSize += sliceLen;
    //@ts-ignore
    r2 = wasmModule._TraceStreamerParseDataEx(sliceLen, wrSize === final.length ? 1 : 0);
    if (r2 === -1) {
      break;
    }
  }
  return r2;
}

function parseNormalTraceByOpenAction(wrSize: number, r2: number, uint8Array: Uint8Array): number {
  while (wrSize < uint8Array.length) {
    const sliceLen = Math.min(uint8Array.length - wrSize, REQ_BUF_SIZE);
    const dataSlice = uint8Array.subarray(wrSize, wrSize + sliceLen);
    //@ts-ignore
    wasmModule.HEAPU8.set(dataSlice, reqBufferAddr);
    wrSize += sliceLen;
    //@ts-ignore
    r2 = wasmModule._TraceStreamerParseDataEx(sliceLen, wrSize === uint8Array.length ? 1 : 0);
    if (r2 === -1) {
      break;
    }
  }
  return r2;
}

function setThirdWasmMap(config: unknown, heapPtr: number, size: number, componentID: number): void {
  //@ts-ignore
  let thirdMode = initThirdWASM(config.wasmName);
  //@ts-ignore
  let configPluginName = config.pluginName;
  let pluginNameUintArray = enc.encode(configPluginName);
  //@ts-ignore
  let pluginNameBuffer = thirdMode._InitPluginName(pluginNameUintArray.length);
  //@ts-ignore
  thirdMode.HEAPU8.set(pluginNameUintArray, pluginNameBuffer);
  //@ts-ignore
  thirdMode._TraceStreamerGetPluginNameEx(configPluginName.length);
  let thirdQueryDataCallBack = (heapPtr: number, size: number, isEnd: number, isConfig: number): void => {
    if (isConfig === 1) {
      //@ts-ignore
      let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
      thirdJsonResult.set(componentID, {
        jsonConfig: dec.decode(out),
        //@ts-ignore
        disPlayName: config.disPlayName,
        //@ts-ignore
        pluginName: config.pluginName,
      });
    } else {
      //@ts-ignore
      let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
      bufferSlice.push(out);
      if (isEnd === 1) {
        arr = merged();
        bufferSlice.length = 0;
      }
    }
  };
  //@ts-ignore
  let fn = thirdMode.addFunction(thirdQueryDataCallBack, 'viiii');
  //@ts-ignore
  let thirdreqBufferAddr = thirdMode._Init(fn, REQ_BUF_SIZE);
  initTraceRange(thirdMode);
  //@ts-ignore
  thirdMode._TraceStreamerInJsonConfig();
  //@ts-ignore
  thirdMode.HEAPU8.set(headUnitArray, thirdreqBufferAddr);
  //@ts-ignore
  thirdMode._ParserData(headUnitArray!.length, 100);
  //@ts-ignore
  let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
  //@ts-ignore
  thirdMode.HEAPU8.set(out, thirdreqBufferAddr);
  //@ts-ignore
  thirdMode._ParserData(out.length, componentID);
  thirdWasmMap.set(componentID, {
    model: thirdMode,
    bufferAddr: thirdreqBufferAddr,
  });
}

function postMessageByOpenAction(r2: number, e: MessageEvent): void {
  if (r2 === -1) {
    // @ts-ignore
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      init: false,
      msg: 'parse data error',
    });
    return;
  }
  // @ts-ignore
  if (temp_init_sql_list && temp_init_sql_list.length > 0) {
    // @ts-ignore
    temp_init_sql_list.forEach((item, index) => {
      createView(item);
      // @ts-ignore
      self.postMessage({ id: e.data.id, ready: true, index: index + 1 });
    });
  }

  self.postMessage(
    {
      id: e.data.id,
      action: e.data.action,
      init: true,
      msg: 'ok',
      configSqlMap: thirdJsonResult,
      buffer: e.data.buffer,
      fileKey: ffrtFileCacheKey,
    },
    // @ts-ignore
    [e.data.buffer]
  );
}

function initTraceRange(thirdMode: unknown): void {
  let updateTraceTimeCallBack = (heapPtr: number, size: number): void => {
    //@ts-ignore
    let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
    //@ts-ignore
    wasmModule.HEAPU8.set(out, reqBufferAddr);
    //@ts-ignore
    wasmModule._UpdateTraceTime(out.length);
  };
  //@ts-ignore
  let traceRangeFn = thirdMode.addFunction(updateTraceTimeCallBack, 'vii');
  //@ts-ignore
  thirdMode._InitTraceRange(traceRangeFn, 1024);
}

function onmessageByExecAction(e: MessageEvent): void {
  query(e.data.name, e.data.sql, e.data.params);
  let jsonArray = convertJSON();
  // @ts-ignore
  self.postMessage({
    id: e.data.id,
    action: e.data.action,
    results: jsonArray,
  });
}

function onmessageByExecProtoAction(e: MessageEvent): void {
  let typeLength = 4;
  execProtoForWorker(e.data, (sql: string) => {
    let sqlUintArray = enc.encode(sql);
    if (e.data.params.trafic !== TraficEnum.ProtoBuffer) {
      //@ts-ignore
      wasmModule.HEAPU8.set(sqlUintArray, reqBufferAddr);
      //@ts-ignore
      wasmModule._TraceStreamerSqlQueryEx(sqlUintArray.length);
      let jsonArray = convertJSON();
      return jsonArray;
    } else {
      let allArray = new Uint8Array(typeLength + sqlUintArray.length);
      allArray[0] = e.data.name;
      allArray.set(sqlUintArray, typeLength);
      //@ts-ignore
      wasmModule.HEAPU8.set(allArray, reqBufferAddr);
      //@ts-ignore
      wasmModule._TraceStreamerSqlQueryToProtoCallback(allArray.length);
      let finalArrayBuffer = [];
      if (protoDataMap.has(e.data.name)) {
        //@ts-ignore
        finalArrayBuffer = protoDataMap.get(e.data.name);
        protoDataMap.delete(e.data.name);
      }
      return finalArrayBuffer;
    }
  });
}

function onmessageByExecBufAction(e: MessageEvent): void {
  query(e.data.name, e.data.sql, e.data.params);
  self.postMessage(
    { id: e.data.id, action: e.data.action, results: arr!.buffer },
    // @ts-ignore
    [arr.buffer]
  );
}

function onmessageByExecSdkAction(e: MessageEvent): void {
  querySdk(e.data.name, e.data.sql, e.data.params, e.data.action);
  let jsonArray = convertJSON();
  // @ts-ignore
  self.postMessage({
    id: e.data.id,
    action: e.data.action,
    results: jsonArray,
  });
}

function onmessageByExecMetricAction(e: MessageEvent): void {
  queryMetric(e.data.sql);
  let metricResult = dec.decode(arr);
  // @ts-ignore
  self.postMessage({
    id: e.data.id,
    action: e.data.action,
    results: metricResult,
  });
}

function onmessageByInitPortAction(e: MessageEvent): void {
  let port = e.ports[0];
  port.onmessage = (me): void => {
    query(me.data.action, me.data.sql, me.data.params);
    let msg = {
      id: me.data.id,
      action: me.data.action,
      results: arr!.buffer,
    };
    port.postMessage(msg, [arr!.buffer]);
  };
}

function onmessageByDownloadDBAction(e: MessageEvent): void {
  let bufferSliceUint: Array<Uint8Array> = [];
  let mergedUint = (): Uint8Array => {
    let length = 0;
    bufferSliceUint.forEach((item) => {
      length += item.length;
    });
    let mergedArray = new Uint8Array(length);
    let offset = 0;
    bufferSliceUint.forEach((item) => {
      mergedArray.set(item, offset);
      offset += item.length;
    });
    return mergedArray;
  };
  let getDownloadDb = (heapPtr: number, size: number, isEnd: number): void => {
    //@ts-ignore
    let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
    bufferSliceUint.push(out);
    if (isEnd === 1) {
      let arr: Uint8Array = mergedUint();
      self.postMessage({
        id: e.data.id,
        action: e.data.action,
        results: arr,
      });
    }
  };
  //@ts-ignore
  let fn1 = wasmModule.addFunction(getDownloadDb, 'viii');
  //@ts-ignore
  wasmModule._WasmExportDatabase(fn1);
}

function onmessageByUploadSoAction(e: MessageEvent): void {
  uploadSoActionId = e.data.id;
  const fileList = e.data.params as Array<File>;
  failedArray.length = 0;
  if (fileList) {
    fileList.sort((a, b) => b.size - a.size);
    soFileList = fileList;
    uploadFileIndex = 0;
    if (!uploadSoCallbackFn) {
      //@ts-ignore
      uploadSoCallbackFn = wasmModule.addFunction(uploadSoCallBack, 'viii');
    }
    uploadSoFile(soFileList[uploadFileIndex]).then();
  }
}

async function saveDataToIndexDB(
  currentChunk: Uint8Array,
  currentChunkOffset: number,
  fileType: string,
  timStamp: number,
  pageNum: number,
  saveIndex: number,
  saveStartOffset: number
): Promise<void> {
  let freeArray = currentChunk.slice(0, currentChunkOffset);
  await addDataToIndexeddb(indexDB, {
    buf: freeArray,
    id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
    fileType: `${fileType}_new`,
    pageNum: pageNum,
    startOffset: saveStartOffset,
    endOffset: saveStartOffset + maxSize,
    index: saveIndex,
    timStamp: timStamp,
  });
}

function cutLongTraceCallBackHandle(
  traceFileType: string,
  currentPageNum: number,
  heapPtr: number,
  size: number,
  dataType: number,
  newCutFilePageInfo: Map<
    string,
    {
      traceFileType: string;
      dataArray: [{ data: Uint8Array | Array<{ offset: number; size: number }>; dataTypes: string }];
    }
  >
): void {
  let key = `${traceFileType}_${currentPageNum}`;
  //@ts-ignore
  let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
  if (DataTypeEnum.data === dataType) {
    if (traceFileType === 'arkts') {
      arkTsData.push(out);
      arkTsDataSize += size;
    } else {
      if (newCutFilePageInfo.has(key)) {
        let newVar = newCutFilePageInfo.get(key);
        newVar?.dataArray.push({ data: out, dataTypes: 'data' });
      } else {
        newCutFilePageInfo.set(key, {
          traceFileType: traceFileType,
          dataArray: [{ data: out, dataTypes: 'data' }],
        });
      }
    }
  } else if (DataTypeEnum.json === dataType) {
    let cutFilePageInfo = newCutFilePageInfo.get(key);
    if (cutFilePageInfo) {
      let jsonStr: string = dec.decode(out);
      let jsonObj = JSON.parse(jsonStr);
      let valueArray: Array<{ offset: number; size: number }> = jsonObj.value;
      cutFilePageInfo.dataArray.push({ data: valueArray, dataTypes: 'json' });
    }
  }
}

function initSplitLongTraceModuleAndFun(
  headArray: Uint8Array,
  cutFileCallBack: (heapPtr: number, size: number, dataType: number, isEnd: number) => void
): number {
  //@ts-ignore
  splitReqBufferAddr = wasmModule._InitializeSplitFile(wasmModule.addFunction(cutFileCallBack, 'viiii'), REQ_BUF_SIZE);
  //@ts-ignore
  wasmModule.HEAPU8.set(headArray, splitReqBufferAddr);
  //@ts-ignore
  wasmModule._TraceStreamerGetLongTraceTimeSnapEx(headArray.length);
  return splitReqBufferAddr;
}

async function handleDataTypeBySplitLongTrace(
  receiveData: { data: Uint8Array | Array<{ offset: number; size: number }>; dataTypes: string },
  currentChunkOffset: number,
  currentChunk: Uint8Array,
  fileType: string,
  timStamp: number,
  pageNum: number,
  saveIndex: number,
  saveStartOffset: number
): Promise<[number, number, number, Uint8Array]> {
  let receiveDataArray = receiveData.data as Uint8Array;
  if (currentChunkOffset + receiveDataArray.length > maxSize) {
    let freeSize = maxSize - currentChunkOffset;
    let freeSaveData = receiveDataArray.slice(0, freeSize);
    currentChunk.set(freeSaveData, currentChunkOffset);
    await addDataToIndexeddb(indexDB, {
      buf: currentChunk,
      id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
      fileType: `${fileType}_new`,
      pageNum: pageNum,
      startOffset: saveStartOffset,
      endOffset: saveStartOffset + maxSize,
      index: saveIndex,
      timStamp: timStamp,
    });
    saveStartOffset += maxSize;
    saveIndex++;
    currentChunk = new Uint8Array(maxSize);
    let remnantArray = receiveDataArray.slice(freeSize);
    currentChunkOffset = 0;
    currentChunk.set(remnantArray, currentChunkOffset);
    currentChunkOffset += remnantArray.length;
  } else {
    currentChunk.set(receiveDataArray, currentChunkOffset);
    currentChunkOffset += receiveDataArray.length;
  }
  return [currentChunkOffset, saveIndex, saveStartOffset, currentChunk];
}

async function saveAllDataByLongTrace(
  range: IDBKeyRange,
  nowCutInfoList: Array<unknown>,
  searchDataInfo: {
    fileType: string;
    index: number;
    pageNum: number;
    startOffsetSize: number;
    endOffsetSize: number;
  }[],
  currentChunkOffset: number,
  currentChunk: Uint8Array,
  fileType: string,
  timStamp: number,
  pageNum: number,
  saveIndex: number,
  saveStartOffset: number
): Promise<[number, number, number, Uint8Array]> {
  let transaction = indexDB.transaction(STORE_NAME, 'readonly');
  let store = transaction.objectStore(STORE_NAME);
  let index = store.index('QueryCompleteFile');
  const getRequest = index.openCursor(range);
  let queryAllData = await queryDataFromIndexeddb(getRequest);
  let mergeData = indexedDataToBufferData(queryAllData);
  for (let cutOffsetObjIndex = 0; cutOffsetObjIndex < nowCutInfoList.length; cutOffsetObjIndex++) {
    let cutUseOffsetObj = nowCutInfoList[cutOffsetObjIndex];
    //@ts-ignore
    let endOffset = cutUseOffsetObj.offset + cutUseOffsetObj.size;
    let sliceData = mergeData.slice(
      //@ts-ignore
      cutUseOffsetObj.offset - searchDataInfo[0].startOffsetSize,
      endOffset - searchDataInfo[0].startOffsetSize
    );
    let sliceDataLength = sliceData.length;
    if (currentChunkOffset + sliceDataLength >= maxSize) {
      let handleCurrentData = new Uint8Array(currentChunkOffset + sliceDataLength);
      let freeSaveArray = currentChunk.slice(0, currentChunkOffset);
      handleCurrentData.set(freeSaveArray, 0);
      handleCurrentData.set(sliceData, freeSaveArray.length);
      let newSliceDataLength: number = Math.ceil(handleCurrentData.length / maxSize);
      for (let newSliceIndex = 0; newSliceIndex < newSliceDataLength; newSliceIndex++) {
        let newSliceSize = newSliceIndex * maxSize;
        let number = Math.min(newSliceSize + maxSize, handleCurrentData.length);
        let saveArray = handleCurrentData.slice(newSliceSize, number);
        if (newSliceIndex === newSliceDataLength - 1 && number - newSliceSize < maxSize) {
          currentChunk = new Uint8Array(maxSize);
          currentChunkOffset = 0;
          currentChunk.set(saveArray, currentChunkOffset);
          currentChunkOffset += saveArray.length;
        } else {
          await addDataToIndexeddb(indexDB, {
            buf: saveArray,
            id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
            fileType: `${fileType}_new`,
            pageNum: pageNum,
            startOffset: saveStartOffset,
            endOffset: saveStartOffset + maxSize,
            index: saveIndex,
            timStamp: timStamp,
          });
          saveStartOffset += maxSize;
          saveIndex++;
        }
      }
    } else {
      currentChunk.set(sliceData, currentChunkOffset);
      currentChunkOffset += sliceDataLength;
    }
  }
  return [currentChunkOffset, saveIndex, saveStartOffset, currentChunk];
}

async function handleJsonTypeBySplitLongTrace(
  receiveData: { data: Uint8Array | Array<{ offset: number; size: number }>; dataTypes: string },
  allIndexDataList: Array<{
    fileType: string;
    index: number;
    pageNum: number;
    startOffsetSize: number;
    endOffsetSize: number;
  }>,
  fileType: string,
  timStamp: number,
  currentChunkOffset: number,
  currentChunk: Uint8Array,
  pageNum: number,
  saveIndex: number,
  saveStartOffset: number
): Promise<[number, number, number, Uint8Array]> {
  let needCutMessage = receiveData.data as Array<{ offset: number; size: number }>;
  let startOffset = needCutMessage[0].offset;
  let nowCutInfoList: Array<{
    offset: number;
    size: number;
  }> = [];
  let isBeforeCutFinish = false;
  for (let needCutIndex = 0; needCutIndex < needCutMessage.length; needCutIndex++) {
    let cutInfo = needCutMessage[needCutIndex];
    if (isBeforeCutFinish) {
      startOffset = cutInfo.offset;
      isBeforeCutFinish = false;
      nowCutInfoList.length = 0;
    }
    if (cutInfo.offset + cutInfo.size - startOffset >= maxSize * 10 || needCutIndex === needCutMessage.length - 1) {
      nowCutInfoList.push(cutInfo);
      //@ts-ignore
      let nowStartCutOffset = nowCutInfoList[0].offset;
      let nowEndCutOffset = cutInfo.offset + cutInfo.size;
      let searchDataInfo = allIndexDataList.filter(
        (value: {
          fileType: string;
          index: number;
          pageNum: number;
          startOffsetSize: number;
          endOffsetSize: number;
        }) => {
          return (
            value.fileType === fileType &&
            value.startOffsetSize <= nowEndCutOffset &&
            value.endOffsetSize >= nowStartCutOffset
          );
        }
      );
      let startIndex = searchDataInfo[0].index;
      let endIndex = searchDataInfo[searchDataInfo.length - 1].index;
      let range = IDBKeyRange.bound(
        [timStamp, fileType, 0, startIndex],
        [timStamp, fileType, 0, endIndex],
        false,
        false
      );
      [currentChunkOffset, saveIndex, saveStartOffset, currentChunk] = await saveAllDataByLongTrace(
        range,
        nowCutInfoList,
        searchDataInfo,
        currentChunkOffset,
        currentChunk,
        fileType,
        timStamp,
        pageNum,
        saveIndex,
        saveStartOffset
      );
      isBeforeCutFinish = true;
    } else {
      nowCutInfoList.push(cutInfo);
    }
  }
  return [currentChunkOffset, saveIndex, saveStartOffset, currentChunk];
}

async function handleAllTypeDataByLongTrace(
  newCutFilePageInfo: Map<
    string,
    {
      traceFileType: string;
      dataArray: [
        {
          data: Uint8Array | Array<{ offset: number; size: number }>;
          dataTypes: string;
        }
      ];
    }
  >,
  timStamp: number,
  allIndexDataList: Array<{
    fileType: string;
    index: number;
    pageNum: number;
    startOffsetSize: number;
    endOffsetSize: number;
  }>
): Promise<void> {
  for (const [fileTypePageNum, fileMessage] of newCutFilePageInfo) {
    let fileTypePageNumArr = fileTypePageNum.split('_');
    let fileType = fileTypePageNumArr[0];
    let pageNum = Number(fileTypePageNumArr[1]);
    let saveIndex = 0;
    let saveStartOffset = 0;
    let dataArray = fileMessage.dataArray;
    let currentChunk = new Uint8Array(maxSize);
    let currentChunkOffset = 0;
    for (let fileDataIndex = 0; fileDataIndex < dataArray.length; fileDataIndex++) {
      let receiveData = dataArray[fileDataIndex];
      if (receiveData.dataTypes === 'data') {
        [currentChunkOffset, saveIndex, saveStartOffset, currentChunk] = await handleDataTypeBySplitLongTrace(
          receiveData,
          currentChunkOffset,
          currentChunk,
          fileType,
          timStamp,
          pageNum,
          saveIndex,
          saveStartOffset
        );
      } else {
        if (receiveData.data.length > 0) {
          [currentChunkOffset, saveIndex, saveStartOffset, currentChunk] = await handleJsonTypeBySplitLongTrace(
            receiveData,
            allIndexDataList,
            fileType,
            timStamp,
            currentChunkOffset,
            currentChunk,
            pageNum,
            saveIndex,
            saveStartOffset
          );
        }
      }
    }
    if (currentChunkOffset !== 0) {
      await saveDataToIndexDB(
        currentChunk,
        currentChunkOffset,
        fileType,
        timStamp,
        pageNum,
        saveIndex,
        saveStartOffset
      );
      saveStartOffset += maxSize;
      saveIndex++;
    }
  }
}

async function onmessageByLongTraceAction(e: MessageEvent): Promise<void> {
  await initWASM();
  let result = {};
  let headArray = e.data.params.headArray;
  let timStamp = e.data.params.timeStamp;
  let allIndexDataList = e.data.params.splitDataList;
  let splitFileInfos = e.data.params.splitFileInfo as Array<{
    fileType: string;
    startIndex: number;
    endIndex: number;
    size: number;
  }>;
  let maxPageNum = headArray.length / 1024;
  let currentPageNum = 0;
  let splitReqBufferAddr: number;
  if (splitFileInfos) {
    let splitFileInfo = splitFileInfos.filter((splitFileInfo) => splitFileInfo.fileType !== 'trace');
    if (splitFileInfo && splitFileInfo.length > 0) {
      let traceFileType: string = '';
      indexDB = await openDB();
      let newCutFilePageInfo: Map<
        string,
        {
          traceFileType: string;
          dataArray: [{ data: Uint8Array | Array<{ offset: number; size: number }>; dataTypes: string }];
        }
      > = new Map();
      let cutFileCallBack = (heapPtr: number, size: number, dataType: number, isEnd: number): void => {
        cutLongTraceCallBackHandle(traceFileType, currentPageNum, heapPtr, size, dataType, newCutFilePageInfo);
      };
      splitReqBufferAddr = initSplitLongTraceModuleAndFun(headArray, cutFileCallBack);
      for (let fileIndex = 0; fileIndex < splitFileInfo.length; fileIndex++) {
        let fileInfo = splitFileInfo[fileIndex];
        traceFileType = fileInfo.fileType;
        for (let pageNum = 0; pageNum < maxPageNum; pageNum++) {
          currentPageNum = pageNum;
          await splitFileAndSave(timStamp, fileInfo, pageNum, splitReqBufferAddr);
          await initWASM();
          splitReqBufferAddr = initSplitLongTraceModuleAndFun(headArray, cutFileCallBack);
        }
      }
      await handleAllTypeDataByLongTrace(newCutFilePageInfo, timStamp, allIndexDataList);
    }
  }
  self.postMessage({
    id: e.data.id,
    action: e.data.action,
    results: result,
  });
  return;
}

self.onmessage = async (e: MessageEvent): Promise<void> => {
  currentAction = e.data.action;
  currentActionId = e.data.id;
  if (e.data.action === 'reset') {
    clear();
  } else if (e.data.action === 'open') {
    await onmessageByOpenAction(e);
  } else if (e.data.action === 'exec') {
    onmessageByExecAction(e);
  } else if (e.data.action === 'exec-proto') {
    onmessageByExecProtoAction(e);
  } else if (e.data.action === 'exec-buf') {
    onmessageByExecBufAction(e);
  } else if (e.data.action.startsWith('exec-sdk')) {
    onmessageByExecSdkAction(e);
  } else if (e.data.action.startsWith('exec-metric')) {
    onmessageByExecMetricAction(e);
  } else if (e.data.action === 'init-port') {
    onmessageByInitPortAction(e);
  } else if (e.data.action === 'download-db') {
    onmessageByDownloadDBAction(e);
  } else if (e.data.action === 'upload-so') {
    onmessageByUploadSoAction(e);
  } else if (e.data.action === 'cut-file') {
    cutFileByRange(e);
  } else if (e.data.action === 'long_trace') {
    await onmessageByLongTraceAction(e);
  }
};

function indexedDataToBufferData(sourceData: unknown): Uint8Array {
  let uintArrayLength = 0;
  //@ts-ignore
  let uintDataList = sourceData.map((item: unknown) => {
    //@ts-ignore
    let currentBufData = new Uint8Array(item.buf);
    uintArrayLength += currentBufData.length;
    return currentBufData;
  });
  let resultUintArray = new Uint8Array(uintArrayLength);
  let offset = 0;
  uintDataList.forEach((currentArray: Uint8Array) => {
    resultUintArray.set(currentArray, offset);
    offset += currentArray.length;
  });
  return resultUintArray;
}

async function splitFileAndSaveArkTs(
  currentChunkOffset: number,
  currentChunk: Uint8Array,
  fileType: string,
  pageNum: number,
  saveStartOffset: number,
  saveIndex: number,
  timStamp: number
): Promise<void> {
  for (let arkTsAllDataIndex = 0; arkTsAllDataIndex < arkTsData.length; arkTsAllDataIndex++) {
    let currentArkTsData = arkTsData[arkTsAllDataIndex];
    let freeSize = maxSize - currentChunkOffset;
    if (currentArkTsData.length > freeSize) {
      let freeSaveData = currentArkTsData.slice(0, freeSize);
      currentChunk.set(freeSaveData, currentChunkOffset);
      let arg2 = setArg(currentChunk, fileType, pageNum, saveStartOffset, saveIndex, timStamp);
      await addDataToIndexeddb(indexDB, arg2);
      saveStartOffset += maxSize;
      saveIndex++;
      let remnantData = currentArkTsData.slice(freeSize);
      let remnantDataLength: number = Math.ceil(remnantData.length / maxSize);
      for (let newSliceIndex = 0; newSliceIndex < remnantDataLength; newSliceIndex++) {
        let newSliceSize = newSliceIndex * maxSize;
        let number = Math.min(newSliceSize + maxSize, remnantData.length);
        let saveArray = remnantData.slice(newSliceSize, number);
        if (newSliceIndex === remnantDataLength - 1 && number - newSliceSize < maxSize) {
          currentChunk = new Uint8Array(maxSize);
          currentChunkOffset = 0;
          currentChunk.set(saveArray, currentChunkOffset);
          currentChunkOffset += saveArray.length;
        } else {
          let arg2 = setArg(saveArray, fileType, pageNum, saveStartOffset, saveIndex, timStamp);
          await addDataToIndexeddb(indexDB, arg2);
          saveStartOffset += maxSize;
          saveIndex++;
        }
      }
    } else {
      currentChunk.set(currentArkTsData, currentChunkOffset);
      currentChunkOffset += currentArkTsData.length;
    }
  }
}

const splitFileAndSave = async (
  timStamp: number,
  fileInfo: {
    fileType: string;
    startIndex: number;
    endIndex: number;
    size: number;
  },
  pageNum: number,
  splitBufAddr?: number
): Promise<void> => {
  let fileType = fileInfo.fileType;
  let fileSize = fileInfo.size;
  let startIndex = fileInfo.startIndex;
  let endIndex = fileInfo.endIndex;
  let queryStartIndex = startIndex;
  let queryEndIndex = startIndex;
  let saveIndex = 0;
  let saveStartOffset = 0;
  let current = new Uint8Array(maxSize);
  let currentOffset = 0;
  let resSize = 0;
  do {
    queryEndIndex = queryStartIndex + 9;
    if (queryEndIndex > endIndex) {
      queryEndIndex = endIndex;
    }
    let range = getRange(timStamp, fileType, queryStartIndex, queryEndIndex);
    let res = await getIndexedDBQueryData(indexDB, range);
    queryStartIndex = queryEndIndex + 1;
    //@ts-ignore
    for (let i = 0; i < res.length; i++) {
      //@ts-ignore
      let arrayBuffer = res[i];
      let uint8Array = new Uint8Array(arrayBuffer.buf);
      let cutFileSize = 0;
      while (cutFileSize < uint8Array.length) {
        [cutFileSize, resSize] = splitLongTrace(pageNum, fileSize, resSize, cutFileSize, uint8Array, splitBufAddr);
        if (arkTsDataSize > 0 && fileType === 'arkts') {
          splitFileAndSaveArkTs(currentOffset, current, fileType, pageNum, saveStartOffset, saveIndex, timStamp);
        }
      }
    }
  } while (queryEndIndex < endIndex);
  if (fileType === 'arkts' && currentOffset > 0) {
    let remnantArray = new Uint8Array(currentOffset);
    let remnantChunk = current.slice(0, currentOffset);
    remnantArray.set(remnantChunk, 0);
    let arg2 = setArg(remnantArray, fileType, pageNum, saveStartOffset, saveIndex, timStamp);
    await addDataToIndexeddb(indexDB, arg2);
    arkTsDataSize = 0;
    arkTsData.length = 0;
  }
};

async function getIndexedDBQueryData(db: IDBDatabase, range: IDBKeyRange): Promise<unknown> {
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('QueryCompleteFile');
  const getRequest = index.openCursor(range);
  return await queryDataFromIndexeddb(getRequest);
}

function splitLongTrace(
  pageNum: number,
  fileSize: number,
  resultFileSize: number,
  cutFileSize: number,
  uint8Array: Uint8Array,
  splitReqBufferAddr?: number
): [number, number] {
  const sliceLen = Math.min(uint8Array.length - cutFileSize, REQ_BUF_SIZE);
  const dataSlice = uint8Array.subarray(cutFileSize, cutFileSize + sliceLen);
  //@ts-ignore
  wasmModule.HEAPU8.set(dataSlice, splitReqBufferAddr);
  cutFileSize += sliceLen;
  resultFileSize += sliceLen;
  if (resultFileSize >= fileSize) {
    //@ts-ignore
    wasmModule._TraceStreamerLongTraceSplitFileEx(sliceLen, 1, pageNum);
  } else {
    //@ts-ignore
    wasmModule._TraceStreamerLongTraceSplitFileEx(sliceLen, 0, pageNum);
  }
  return [cutFileSize, resultFileSize];
}

function setArg(
  remnantArray: Uint8Array,
  fileType: string,
  pageNum: number,
  saveStartOffset: number,
  saveIndex: number,
  timStamp: number
): unknown {
  return {
    buf: remnantArray,
    id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
    fileType: `${fileType}_new`,
    pageNum: pageNum,
    startOffset: saveStartOffset,
    endOffset: saveStartOffset + maxSize,
    index: saveIndex,
    timStamp: timStamp,
  };
}
function getRange(timStamp: number, fileType: string, queryStartIndex: number, queryEndIndex: number): IDBKeyRange {
  return IDBKeyRange.bound(
    [timStamp, fileType, 0, queryStartIndex],
    [timStamp, fileType, 0, queryEndIndex],
    false,
    false
  );
}

enum DataTypeEnum {
  data,
  json,
}

let uploadSoActionId: string = '';
let uploadFileIndex: number = 0;
let uploadSoCallbackFn: Function;
let soFileList: Array<File | null> = [];
const failedArray: Array<string> = [];
const uploadSoFile = async (file: File | null): Promise<void> => {
  if (file) {
    let fileNameBuffer: Uint8Array | null = enc.encode(file.webkitRelativePath);
    let fileNameLength = fileNameBuffer.length;
    //@ts-ignore
    let addr = wasmModule._InitFileName(uploadSoCallbackFn, fileNameBuffer.length);
    //@ts-ignore
    wasmModule.HEAPU8.set(fileNameBuffer, addr);
    let writeSize = 0;
    let upRes = -1;
    while (writeSize < file.size) {
      let sliceLen = Math.min(file.size - writeSize, REQ_BUF_SIZE);
      let blob: Blob | null = file.slice(writeSize, writeSize + sliceLen);
      let buffer: ArrayBuffer | null = await blob.arrayBuffer();
      let data: Uint8Array | null = new Uint8Array(buffer);
      let size = file.size;
      //@ts-ignore
      wasmModule.HEAPU8.set(data, reqBufferAddr);
      writeSize += sliceLen;
      //@ts-ignore
      upRes = wasmModule._TraceStreamerDownloadELFEx(size, fileNameLength, sliceLen, 1);
      data = null;
      buffer = null;
      blob = null;
    }
    file = null;
    soFileList[uploadFileIndex] = null;
    fileNameBuffer = null;
  }
};

const uploadSoCallBack = (heapPtr: number, size: number, isFinish: number): void => {
  //@ts-ignore
  let out: Uint8Array | null = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
  if (out) {
    let res = dec.decode(out);
    out = null;
    if (res.includes('ok') || res.includes('failed')) {
      if (res.includes('failed')) {
        failedArray.push(soFileList[uploadFileIndex]!.name);
      }
      if (uploadFileIndex < soFileList.length - 1) {
        uploadSoFile(soFileList[uploadFileIndex + 1]).then();
      }
      uploadFileIndex++;
    }
    if (uploadFileIndex === soFileList.length) {
      soFileList.length = 0;
      const result = failedArray.length === 0 ? 'ok' : 'failed';
      self.postMessage({
        id: uploadSoActionId,
        action: 'upload-so',
        results: { result: result, failedArray: failedArray },
      });
    }
  }
};

let splitReqBufferAddr = -1;

enum FileTypeEnum {
  data,
  json,
}

function isRawTrace(uint8Array: Uint8Array): boolean {
  let rowTraceStr = Array.from(new Uint16Array(uint8Array.buffer.slice(0, 2)));
  return rowTraceStr[0] === 57161;
}

function cutFileBufferByOffSet(out: Uint8Array, uint8Array: Uint8Array): Uint8Array {
  let jsonStr: string = dec.decode(out);
  let jsonObj = JSON.parse(jsonStr);
  let valueArray: Array<{ type: number; offset: number; size: number }> = jsonObj.value;
  let cutBuffer: Uint8Array;
  if (isRawTrace(uint8Array)) {
    let commDataSize = 0;
    let otherDataSize = 0;
    valueArray.forEach((item) => {
      const type = item.type;
      if (type === 0) {
        commDataSize += item.size;
      } else {
        otherDataSize += item.size;
        otherDataSize += 8;
      }
    });
    cutBuffer = new Uint8Array(commDataSize + otherDataSize);
    let commOffset = 0;
    let tlvOffset = commDataSize;
    valueArray.forEach((item) => {
      if (item.type !== 0) {
        let typeArray = new Uint32Array(1);
        typeArray[0] = item.type;
        cutBuffer.set(new Uint8Array(typeArray.buffer), tlvOffset);
        tlvOffset += typeArray.byteLength;
        let lengthArray = new Uint32Array(1);
        lengthArray[0] = item.size;
        cutBuffer.set(new Uint8Array(lengthArray.buffer), tlvOffset);
        tlvOffset += typeArray.byteLength;
        const dataSlice = uint8Array.subarray(item.offset, item.offset + item.size);
        cutBuffer.set(dataSlice, tlvOffset);
        tlvOffset += item.size;
      } else {
        const dataSlice = uint8Array.subarray(item.offset, item.offset + item.size);
        cutBuffer.set(dataSlice, commOffset);
        commOffset += item.size;
      }
    });
  } else {
    const sum = valueArray.reduce((total, obj) => total + obj.size, 0);
    cutBuffer = new Uint8Array(sum);
    let offset = 0;
    valueArray.forEach((item, index) => {
      const dataSlice = uint8Array.subarray(item.offset, item.offset + item.size);
      cutBuffer.set(dataSlice, offset);
      offset += item.size;
    });
  }
  return cutBuffer;
}

function cutFileByRange(e: MessageEvent): void {
  let cutLeftTs = e.data.leftTs;
  let cutRightTs = e.data.rightTs;
  let uint8Array = new Uint8Array(e.data.buffer);
  let resultBuffer: Array<Uint8Array> = [];
  let cutFileCallBack = cutFileCallBackFunc(resultBuffer, uint8Array, e);
  //@ts-ignore
  splitReqBufferAddr = wasmModule._InitializeSplitFile(wasmModule.addFunction(cutFileCallBack, 'viiii'), REQ_BUF_SIZE);
  let cutTimeRange = `${cutLeftTs};${cutRightTs};`;
  let cutTimeRangeBuffer = enc.encode(cutTimeRange);
  //@ts-ignore
  wasmModule.HEAPU8.set(cutTimeRangeBuffer, splitReqBufferAddr);
  //@ts-ignore
  wasmModule._TraceStreamerSplitFileEx(cutTimeRangeBuffer.length);
  let cutFileSize = 0;
  let receiveFileResult = -1;
  while (cutFileSize < uint8Array.length) {
    const sliceLen = Math.min(uint8Array.length - cutFileSize, REQ_BUF_SIZE);
    const dataSlice = uint8Array.subarray(cutFileSize, cutFileSize + sliceLen);
    //@ts-ignore
    wasmModule.HEAPU8.set(dataSlice, splitReqBufferAddr);
    cutFileSize += sliceLen;
    try {
      if (cutFileSize >= uint8Array.length) {
        //@ts-ignore
        receiveFileResult = wasmModule._TraceStreamerReciveFileEx(sliceLen, 1);
      } else {
        //@ts-ignore
        receiveFileResult = wasmModule._TraceStreamerReciveFileEx(sliceLen, 0);
      }
    } catch (error) {
      self.postMessage(
        {
          id: e.data.id,
          action: e.data.action,
          cutStatus: false,
          msg: 'split failed',
          buffer: e.data.buffer,
        },
        // @ts-ignore
        [e.data.buffer]
      );
    }
  }
}
function cutFileCallBackFunc(resultBuffer: Array<Uint8Array>, uint8Array: Uint8Array, e: MessageEvent): Function {
  return (heapPtr: number, size: number, fileType: number, isEnd: number) => {
    //@ts-ignore
    let out: Uint8Array = wasmModule.HEAPU8.slice(heapPtr, heapPtr + size);
    if (FileTypeEnum.data === fileType) {
      resultBuffer.push(out);
    } else if (FileTypeEnum.json === fileType) {
      let cutBuffer = cutFileBufferByOffSet(out, uint8Array);
      resultBuffer.push(cutBuffer);
    }
    if (isEnd) {
      //@ts-ignore
      const cutResultFileLength = resultBuffer.reduce((total, obj) => total + obj.length, 0);
      //@ts-ignore
      let cutBuffer = new Uint8Array(cutResultFileLength);
      let offset = 0;
      resultBuffer.forEach((item) => {
        //@ts-ignore
        cutBuffer.set(item, offset);
        //@ts-ignore
        offset += item.length;
      });
      resultBuffer.length = 0;
      self.postMessage(
        {
          id: e.data.id,
          action: e.data.action,
          cutStatus: true,
          msg: 'split success',
          buffer: e.data.buffer,
          cutBuffer: cutBuffer.buffer,
        },
        // @ts-ignore
        [e.data.buffer, cutBuffer.buffer]
      );
    }
  };
}

function createView(sql: string): void {
  let array = enc.encode(sql);
  //@ts-ignore
  wasmModule.HEAPU8.set(array, reqBufferAddr);
  //@ts-ignore
  wasmModule._TraceStreamerSqlOperateEx(array.length);
}

function query(name: string, sql: string, params: unknown): void {
  if (params) {
    Reflect.ownKeys(params).forEach((key: unknown) => {
      //@ts-ignore
      if (typeof params[key] === 'string') {
        //@ts-ignore
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), `'${params[key]}'`);
      } else {
        //@ts-ignore
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), params[key]);
      }
    });
  }
  let sqlUintArray = enc.encode(sql);
  //@ts-ignore
  wasmModule.HEAPU8.set(sqlUintArray, reqBufferAddr);
  //@ts-ignore
  wasmModule._TraceStreamerSqlQueryEx(sqlUintArray.length);
}

function querySdk(name: string, sql: string, sdkParams: unknown, action: string): void {
  if (sdkParams) {
    Reflect.ownKeys(sdkParams).forEach((key: unknown) => {
      //@ts-ignore
      if (typeof sdkParams[key] === 'string') {
        //@ts-ignore
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), `'${sdkParams[key]}'`);
      } else {
        //@ts-ignore
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), sdkParams[key]);
      }
    });
  }
  let sqlUintArray = enc.encode(sql);
  let commentId = action.substring(action.lastIndexOf('-') + 1);
  let key = Number(commentId);
  let wasm = thirdWasmMap.get(key);
  if (wasm !== undefined) {
    let wasmModel = wasm.model;
    wasmModel.HEAPU8.set(sqlUintArray, wasm.bufferAddr);
    wasmModel._TraceStreamerSqlQueryEx(sqlUintArray.length);
  }
}

function queryMetric(name: string): void {
  let metricArray = enc.encode(name);
  //@ts-ignore
  wasmModule.HEAPU8.set(metricArray, reqBufferAddr);
  //@ts-ignore
  wasmModule._TraceStreamerSqlMetricsQuery(metricArray.length);
}

const DB_NAME = 'sp';
const DB_VERSION = 1;
const STORE_NAME = 'longTable';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    openRequest.onerror = (): void => reject(openRequest.error);
    openRequest.onsuccess = (): void => {
      resolve(openRequest.result);
    };
  });
}

function queryDataFromIndexeddb(getRequest: IDBRequest<IDBCursorWithValue | null>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let results: unknown[] = [];
    getRequest.onerror = (event): void => {
      // @ts-ignore
      reject(event.target.error);
    };
    getRequest.onsuccess = (event): void => {
      // @ts-ignore
      const cursor = event.target!.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        // @ts-ignore
        resolve(results);
      }
    };
  });
}

function addDataToIndexeddb(db: IDBDatabase, value: unknown, key?: IDBValidKey): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(value, key);
    request.onsuccess = function (event): void {
      // @ts-ignore
      resolve(event.target.result);
    };
    request.onerror = (event): void => {
      reject(event);
    };
  });
}
