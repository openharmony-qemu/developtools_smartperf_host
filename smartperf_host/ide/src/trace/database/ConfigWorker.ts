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

const mallocSize = 1024 * 1024;

let Module_T: unknown = null;

function initConfigWASM(wasmFunctionName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    function callModelFun(functionName: string): void {
      let func = eval(functionName);
      Module_T = new func({
        locateFile: (s: unknown): unknown => {
          return s;
        },
        print: (line: unknown): void => {},
        printErr: (line: unknown): void => {},
        onRuntimeInitialized: (): void => {
          resolve('ok');
        },
        onAbort: (): void => {},
      });
    }
    callModelFun(wasmFunctionName);
  });
}

self.onmessage = async (e: MessageEvent): Promise<void> => {
  if (e.data.action === 'open') {
    let jsFile = e.data.wasmJsName;
    importScripts(jsFile);
    await initConfigWASM(e.data.WasmName);
    let dataCallBack = (heapPtr: number, size: number, isEnd: number, isConfig: number): void => {
      if (isConfig === 1) {
        // @ts-ignore
        let jsonOut: Uint8Array = Module_T.HEAPU8.slice(heapPtr, heapPtr + size);
        let decoder = new TextDecoder();
        let result = decoder.decode(jsonOut);
        let json = JSON.parse(result);
        self.postMessage({
          results: json,
        });
      }
    };
    // @ts-ignore
    let fn = Module_T.addFunction(dataCallBack, 'viiii');
    // @ts-ignore
    Module_T._Init(fn, mallocSize);
    // @ts-ignore
    Module_T._TraceStreamer_In_JsonConfig();
  }
};
