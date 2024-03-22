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

importScripts('trace_converter_builtin.js');
self.onerror = function (error: any) {};

let convertModule: any = null;

function initConvertWASM() {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    let wasm = trace_converter_builtin_wasm;
    convertModule = wasm({
      locateFile: (s: any) => {
        return s;
      },
      print: (line: any) => {},
      printErr: (line: any) => {},
      onAbort: () => {
        reject('on abort');
      },
      onRuntimeInitialized: () => {
        resolve('ok');
      },
    });
  });
}

function isRawTrace(uint8Array: Uint8Array): boolean {
  let rowTraceStr = Array.from(new Uint16Array(uint8Array.buffer.slice(0, 2)));
  return rowTraceStr[0] === 57161;
}

const ARRAY_BUF_SIZE = 2 * 1024 * 1024;
self.onmessage = async (e: MessageEvent) => {
  if (e.data.action === 'getConvertData') {
    await initConvertWASM();
    let fileData = e.data.buffer;
    const stepSize = 4 * 1024 * 1024;
    let totalSize = fileData.byteLength;
    let traceInsPtr = convertModule._GetTraceConverterIns(); // 获取TraceConverter 实例
    convertModule._SetDebugFlag(false, traceInsPtr); // 设置是否为debug模式
    let currentPosition = 1024;
    let dataHeader = convertModule._malloc(1100);
    let traceAllData = new Uint8Array(e.data.buffer);
    let isRawTraceConvert = isRawTrace(e.data);
    if (isRawTraceConvert) {
      [totalSize, currentPosition, traceAllData] = handleRowTrace(e, fileData, dataHeader, traceInsPtr, currentPosition, traceAllData, totalSize);
    } else {
      handleHTrace(fileData, dataHeader, traceInsPtr);
    }
    let dataPtr = convertModule._malloc(stepSize);
    let arrayBufferPtr = convertModule._malloc(ARRAY_BUF_SIZE);
    convertModule._free(dataHeader);
    let bodyDataStr: string[] = [];
    let callback = (heapPtr: number, size: number) => {
      let out = convertModule.HEAPU8.slice(heapPtr, heapPtr + size);
      let dec = new TextDecoder();
      let str = dec.decode(out);
      bodyDataStr.push(str);
    };
    let bodyFn = convertModule.addFunction(callback, 'vii');
    convertModule._SetCallback(bodyFn, traceInsPtr);
    convertData(currentPosition, traceAllData, arrayBufferPtr, dataPtr, traceInsPtr, isRawTraceConvert, stepSize, totalSize);
    convertModule._GetRemainingData(traceInsPtr);
    let headerData: string[] = [];
    let headerCallback = (heapPtr: number, size: number) => {
      let out = convertModule.HEAPU8.slice(heapPtr, heapPtr + size);
      let dec = new TextDecoder();
      let str = dec.decode(out);
      headerData.push(str);
    };
    let headerFn = convertModule.addFunction(headerCallback, 'vii');
    convertModule._SetCallback(headerFn, traceInsPtr);
    convertModule._GetFinalHeader(traceInsPtr);
    let allDataStr = headerData.concat(bodyDataStr);
    convertModule._ReleaseTraceConverterIns(traceInsPtr); // 释放TraceConverter 实例
    convertModule._free(arrayBufferPtr); //释放分片内存
    convertModule._free(dataPtr);
    postMessage(e, allDataStr);
  }
};

function handleHTrace(fileData: Array<any>, dataHeader: any, traceInsPtr: any) {
  let uint8Array = new Uint8Array(fileData.slice(0, 1024));
  convertModule.HEAPU8.set(uint8Array, dataHeader);
  convertModule._SendFileHeader(dataHeader, 1024, traceInsPtr);
}

function handleRowTrace(
  e: MessageEvent,
  fileData: Array<any>,
  dataHeader: any,
  traceInsPtr: any,
  currentPosition: number,
  traceAllData: Uint8Array,
  totalSize: number
): [number, number, Uint8Array] {
  let uint8Array = new Uint8Array(fileData.slice(0, 12));
  convertModule.HEAPU8.set(uint8Array, dataHeader);
  convertModule._SendRawFileHeader(dataHeader, 12, traceInsPtr);
  currentPosition = 12;
  let allRowTraceData = new Uint8Array(e.data.buffer);
  let commonDataOffsetList: Array<{
    startOffset: number
    endOffset: number
  }> = [];
  let commonTotalLength = setCommonDataOffsetList(e, allRowTraceData, commonDataOffsetList);
  let commonTotalOffset = 0;
  let commonTotalData = new Uint8Array(commonTotalLength);
  commonDataOffsetList.forEach((item) => {
    commonTotalData.set(allRowTraceData.slice(item.startOffset, item.endOffset), commonTotalOffset);
    commonTotalOffset += item.endOffset - item.startOffset;
  });
  traceAllData = new Uint8Array(allRowTraceData.length + commonTotalData.length);
  traceAllData.set(allRowTraceData.slice(0, currentPosition), 0);
  traceAllData.set(commonTotalData, currentPosition);
  traceAllData.set(allRowTraceData.slice(currentPosition), commonTotalData.length + currentPosition);
  totalSize += commonTotalData.length;
  return [totalSize, currentPosition, traceAllData];
}

function setCommonDataOffsetList(
  e: MessageEvent,
  allRowTraceData: Uint8Array,
  commonDataOffsetList: Array<any>
): number {
  let commonTotalLength: number = 0;
  let commonOffset = 12;
  let tlvTypeLength = 4;
  while (commonOffset < allRowTraceData.length) {
    let commonDataOffset = {
      startOffset: commonOffset,
      endOffset: commonOffset,
    };
    let dataTypeData = e.data.buffer.slice(commonOffset, commonOffset + tlvTypeLength);
    commonOffset += tlvTypeLength;
    let dataType = Array.from(new Uint32Array(dataTypeData));
    let currentLData = e.data.buffer.slice(commonOffset, commonOffset + tlvTypeLength);
    commonOffset += tlvTypeLength;
    let currentVLength = Array.from(new Uint32Array(currentLData));
    commonOffset += currentVLength[0];
    commonDataOffset.endOffset = commonOffset;
    if (dataType[0] === 2 || dataType[0] === 3) {
      commonTotalLength += commonDataOffset.endOffset - commonDataOffset.startOffset;
      commonDataOffsetList.push(commonDataOffset);
    }
  }
  return commonTotalLength;
}

function convertData(
  currentPosition: number,
  traceAllData: Uint8Array,
  arrayBufferPtr: any,
  dataPtr: any,
  traceInsPtr: any,
  isRawTraceConvert: boolean = false,
  stepSize: number,
  totalSize: number
): void {
  while (currentPosition < totalSize) {
    let endPosition = Math.min(currentPosition + stepSize, totalSize);
    let currentChunk = new Uint8Array(traceAllData.slice(currentPosition, endPosition));
    convertModule.HEAPU8.set(currentChunk, dataPtr);
    let leftLen = currentChunk.length;
    let processedLen = 0;
    let blockSize = 0;
    let blockPtr = dataPtr;
    while (leftLen > 0) {
      if (leftLen > ARRAY_BUF_SIZE) {
        blockSize = ARRAY_BUF_SIZE;
      } else {
        blockSize = leftLen;
      }
      let subArrayBuffer = convertModule.HEAPU8.subarray(blockPtr, blockPtr + blockSize);
      convertModule.HEAPU8.set(subArrayBuffer, arrayBufferPtr);
      // 调用分片转换接口
      if (isRawTraceConvert) {
        convertModule._ConvertRawBlockData(arrayBufferPtr, subArrayBuffer.length, traceInsPtr); // raw trace
      } else {
        convertModule._ConvertBlockData(arrayBufferPtr, subArrayBuffer.length, traceInsPtr); // htrace
      }
      processedLen = processedLen + blockSize;
      blockPtr = dataPtr + processedLen;
      leftLen = currentChunk.length - processedLen;
    }
    currentPosition = endPosition;
  }
}

function postMessage(e: MessageEvent, allDataStr: Array<string>): void {
  self.postMessage(
    {
      id: e.data.id,
      action: 'convert',
      status: true,
      results: new Blob(allDataStr, {type: 'text/plain'}),
      buffer: e.data.buffer,
    },
    // @ts-ignore
    [e.data.buffer!]
  );
}
