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

export class TransferConfig extends Object {
  private _fileSize: number = -1; // uint64_t
  private _atime: number = -1; // uint64_t ns
  private _mtime: number = -1; //  uint64_t ns
  private _options: string = ''; //  string
  private _path: string = '';
  private _optionalName: string = '';
  private _updateIfNew: boolean = false; //bool
  private _compressType: number = CompressType.COMPRESS_NONE; // uint8_t
  private _holdTimestamp: boolean = false; //bool
  private _functionName: string = '';
  private _clientCwd: string = '';
  private _reserve1: string = '';
  private _reserve2: string = '';

  constructor(
    fileSize: number,
    atime: number,
    mtime: number,
    options: string,
    path: string,
    optionalName: string,
    updateIfNew: boolean,
    compressType: number,
    holdTimestamp: boolean,
    functionName: string,
    clientCwd: string,
    reserve1: string,
    reserve2: string
  ) {
    super();
    this._fileSize = fileSize;
    this._atime = atime;
    this._mtime = mtime;
    this._options = options;
    this._path = path;
    this._optionalName = optionalName;
    this._updateIfNew = updateIfNew;
    this._compressType = compressType;
    this._holdTimestamp = holdTimestamp;
    this._functionName = functionName;
    this._clientCwd = clientCwd;
    this._reserve1 = reserve1;
    this._reserve2 = reserve2;
  }

  get fileSize(): number {
    return this._fileSize;
  }

  set fileSize(value: number) {
    this._fileSize = value;
  }

  get atime(): number {
    return this._atime;
  }

  set atime(value: number) {
    this._atime = value;
  }

  get mtime(): number {
    return this._mtime;
  }

  set mtime(value: number) {
    this._mtime = value;
  }

  get options(): string {
    return this._options;
  }

  set options(value: string) {
    this._options = value;
  }

  get path(): string {
    return this._path;
  }

  set path(value: string) {
    this._path = value;
  }

  get optionalName(): string {
    return this._optionalName;
  }

  set optionalName(value: string) {
    this._optionalName = value;
  }

  get updateIfNew(): boolean {
    return this._updateIfNew;
  }

  set updateIfNew(value: boolean) {
    this._updateIfNew = value;
  }

  get compressType(): number {
    return this._compressType;
  }

  set compressType(value: number) {
    this._compressType = value;
  }

  get holdTimestamp(): boolean {
    return this._holdTimestamp;
  }

  set holdTimestamp(value: boolean) {
    this._holdTimestamp = value;
  }

  get functionName(): string {
    return this._functionName;
  }

  set functionName(value: string) {
    this._functionName = value;
  }

  get clientCwd(): string {
    return this._clientCwd;
  }

  set clientCwd(value: string) {
    this._clientCwd = value;
  }

  get reserve1(): string {
    return this._reserve1;
  }

  set reserve1(value: string) {
    this._reserve1 = value;
  }

  get reserve2(): string {
    return this._reserve2;
  }

  set reserve2(value: string) {
    this._reserve2 = value;
  }

  toString(): string {
    return (
      'fileSize: ' +
      this._fileSize +
      ' atime: ' +
      this._atime +
      ' mtime: ' +
      this._mtime +
      ' options: ' +
      this._options +
      ' path: ' +
      this._path +
      ' optionalName: ' +
      this._optionalName +
      ' updateIfNew: ' +
      this._updateIfNew +
      ' compressType: ' +
      this._compressType +
      ' holdTimestamp: ' +
      this._holdTimestamp +
      ' functionName: ' +
      this._functionName +
      ' clientCwd: ' +
      this._clientCwd +
      ' reserve1: ' +
      this._reserve1 +
      ' reserve2: ' +
      this._reserve2
    );
  }
}

enum CompressType {
  COMPRESS_NONE,
  COMPRESS_LZ4,
  COMPRESS_LZ77,
  COMPRESS_LZMA,
  COMPRESS_BROTLI,
}
