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

export class TransferPayload extends Object {
  private _index: number; // uint64_t
  private _compressType: number; // uint8_t;
  private _compressSize: number; // uint32_t
  private _uncompressSize: number; //uint32_t

  constructor(index: number, compressType: number, compressSize: number, uncompressSize: number) {
    super();
    this._index = index;
    this._compressType = compressType;
    this._compressSize = compressSize;
    this._uncompressSize = uncompressSize;
  }

  getDataView(): DataView {
    const view = new DataView(new ArrayBuffer(24));
    return view;
  }

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    this._index = value;
  }

  get compressType(): number {
    return this._compressType;
  }

  set compressType(value: number) {
    this._compressType = value;
  }

  get compressSize(): number {
    return this._compressSize;
  }

  set compressSize(value: number) {
    this._compressSize = value;
  }

  get uncompressSize(): number {
    return this._uncompressSize;
  }

  set uncompressSize(value: number) {
    this._uncompressSize = value;
  }

  toString(): string {
    return (
      'index: ' +
      this._index +
      ' compressType: ' +
      this._compressType +
      ' compressSize: ' +
      this._compressSize +
      ' uncompressSize: ' +
      this._uncompressSize
    );
  }
}
