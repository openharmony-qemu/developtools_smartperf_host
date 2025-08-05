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
self.onerror = function (error: unknown): void {};

let convertModule: unknown = null;

const CONTENT_TYPE_CMDLINES = 2;
const CONTENT_TYPE_TGIDS = 3;
const CONTENT_TYPE_HEADER_PAGE = 30;
const CONTENT_TYPE_PRINTK_FORMATS = 31;
const CONTENT_TYPE_KALLSYMS = 32;

function initConvertWASM(): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    let wasm = trace_converter_builtin_wasm;
    convertModule = wasm({
      locateFile: (s: unknown): unknown => {
        return s;
      },
      print: (line: unknown): void => {},
      printErr: (line: unknown): void => {},
      onAbort: (): void => {
        reject('on abort');
      },
      onRuntimeInitialized: (): void => {
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
self.onmessage = async (e: MessageEvent): Promise<void> => {
  if (e.data.action === 'getConvertData') {
    await initConvertWASM();
    let fileData = e.data.buffer;
    const stepSize = 4 * 1024 * 1024;
    let totalSize = fileData.byteLength;
    // @ts-ignore
    let traceInsPtr = convertModule._GetTraceConverterIns(); // 获取TraceConverter 实例
    // @ts-ignore
    convertModule._SetDebugFlag(false, traceInsPtr); // 设置是否为debug模式
    let currentPosition = 1024;
    // @ts-ignore
    let dataHeader = convertModule._malloc(1100);
    let traceAllData = new Uint8Array(e.data.buffer);
    let isRawTraceConvert = isRawTrace(e.data);
    if (isRawTraceConvert) {
      [totalSize, currentPosition, traceAllData] = handleRowTrace(
        e,
        fileData,
        dataHeader,
        traceInsPtr,
        currentPosition,
        traceAllData,
        totalSize
      );
    } else {
      handleHTrace(fileData, dataHeader, traceInsPtr);
    }
    // @ts-ignore
    let dataPtr = convertModule._malloc(stepSize);
    // @ts-ignore
    let arrayBufferPtr = convertModule._malloc(ARRAY_BUF_SIZE);
    // @ts-ignore
    convertModule._free(dataHeader);
    let bodyDataStr: string[] = [];
    let callback = (heapPtr: number, size: number): void => {
      // @ts-ignore
      let out = convertModule.HEAPU8.slice(heapPtr, heapPtr + size);
      let dec = new TextDecoder();
      let str = dec.decode(out);
      bodyDataStr.push(str);
    };
    // @ts-ignore
    let bodyFn = convertModule.addFunction(callback, 'vii');
    // @ts-ignore
    convertModule._SetCallback(bodyFn, traceInsPtr);
    convertData(
      currentPosition,
      traceAllData,
      arrayBufferPtr,
      dataPtr,
      traceInsPtr,
      isRawTraceConvert,
      stepSize,
      totalSize
    );
    // @ts-ignore
    convertModule._GetRemainingData(traceInsPtr);
    let headerData: string[] = [];
    let headerCallback = (heapPtr: number, size: number): void => {
      // @ts-ignore
      let out = convertModule.HEAPU8.slice(heapPtr, heapPtr + size);
      let dec = new TextDecoder();
      let str = dec.decode(out);
      headerData.push(str);
    };
    // @ts-ignore
    let headerFn = convertModule.addFunction(headerCallback, 'vii');
    // @ts-ignore
    convertModule._SetCallback(headerFn, traceInsPtr);
    // @ts-ignore
    convertModule._GetFinalHeader(traceInsPtr);
    let allDataStr = headerData.concat(bodyDataStr);
    // @ts-ignore
    convertModule._ReleaseTraceConverterIns(traceInsPtr); // 释放TraceConverter 实例
    // @ts-ignore
    convertModule._free(arrayBufferPtr); //释放分片内存
    // @ts-ignore
    convertModule._free(dataPtr);
    postMessage(e, allDataStr);
  }
};

function handleHTrace(fileData: Array<unknown>, dataHeader: unknown, traceInsPtr: unknown): void {
  // @ts-ignore
  let uint8Array = new Uint8Array(fileData.slice(0, 1024));
  // @ts-ignore
  convertModule.HEAPU8.set(uint8Array, dataHeader);
  // @ts-ignore
  convertModule._SendFileHeader(dataHeader, 1024, traceInsPtr);
}

function handleRowTrace(
  e: MessageEvent,
  fileData: Array<unknown>,
  dataHeader: unknown,
  traceInsPtr: unknown,
  currentPosition: number,
  traceAllData: Uint8Array,
  totalSize: number
): [number, number, Uint8Array] {
  // @ts-ignore
  let uint8Array = new Uint8Array(fileData.slice(0, 12));
  // @ts-ignore
  convertModule.HEAPU8.set(uint8Array, dataHeader);
  // @ts-ignore
  convertModule._SendRawFileHeader(dataHeader, 12, traceInsPtr);
  currentPosition = 12;
  let allRowTraceData = new Uint8Array(e.data.buffer);
  let commonDataOffsetList: Array<{
    startOffset: number;
    endOffset: number;
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

function isCommonData(dataType: number): boolean {
  return (
    dataType === CONTENT_TYPE_CMDLINES ||
    dataType === CONTENT_TYPE_TGIDS ||
    dataType === CONTENT_TYPE_HEADER_PAGE ||
    dataType === CONTENT_TYPE_PRINTK_FORMATS ||
    dataType === CONTENT_TYPE_KALLSYMS
  );
}

function setCommonDataOffsetList(
  e: MessageEvent,
  allRowTraceData: Uint8Array,
  commonDataOffsetList: Array<unknown>
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
    if (isCommonData(dataType[0])) {
      commonTotalLength += commonDataOffset.endOffset - commonDataOffset.startOffset;
      commonDataOffsetList.push(commonDataOffset);
    }
  }
  return commonTotalLength;
}

function convertData(
  currentPosition: number,
  traceAllData: Uint8Array,
  arrayBufferPtr: unknown,
  dataPtr: unknown,
  traceInsPtr: unknown,
  isRawTraceConvert: boolean = false,
  stepSize: number,
  totalSize: number
): void {
  while (currentPosition < totalSize) {
    let endPosition = Math.min(currentPosition + stepSize, totalSize);
    let currentChunk = new Uint8Array(traceAllData.slice(currentPosition, endPosition));
    // @ts-ignore
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
      // @ts-ignore
      let subArrayBuffer = convertModule.HEAPU8.subarray(blockPtr, blockPtr + blockSize);
      // @ts-ignore
      convertModule.HEAPU8.set(subArrayBuffer, arrayBufferPtr);
      // 调用分片转换接口
      if (isRawTraceConvert) {
        // @ts-ignore
        convertModule._ConvertRawBlockData(arrayBufferPtr, subArrayBuffer.length, traceInsPtr); // raw trace
      } else {
        // @ts-ignore
        convertModule._ConvertBlockData(arrayBufferPtr, subArrayBuffer.length, traceInsPtr); // htrace
      }
      processedLen = processedLen + blockSize;
      // @ts-ignore
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
      results: new Blob(allDataStr, { type: 'text/plain' }),
      buffer: e.data.buffer,
    },
    // @ts-ignore
    [e.data.buffer!]
  );
}
