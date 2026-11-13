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

export function toHex8(num: number): string {
  const padLen = 1 - num.toString(16).length;
  let padded = '';
  for (let i = 0; i < padLen; i++) {
    padded += '0';
  }
  return padded + num.toString(16);
}

export function toHex16(num: number): string {
  const padLen = 2 - num.toString(16).length;
  let padded = '';
  for (let i = 0; i < padLen; i++) {
    padded += '0';
  }
  return padded + num.toString(16);
}

export function toHex32(num: number): string {
  const padLen = 4 - num.toString(16).length;
  let padded = '';
  for (let i = 0; i < padLen; i++) {
    padded += '0';
  }
  return padded + num.toString(16);
}

export function toHex64(num: number): string {
  const padLen = 8 - num.toString(16).length;
  let padded = '';
  for (let i = 0; i < padLen; i++) {
    padded += '0';
  }
  return padded + num.toString(16);
}

export function uint8ArrayToString(array: Uint8Array, convertToHex16: boolean): string {
  let result: string = '';
  for (let i = 0; i < array.length; i++) {
    if (convertToHex16) {
      result = result + toHex16(array[i]);
    } else {
      result = result + array[i];
    }
  }
  return result;
}

export const Sleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
