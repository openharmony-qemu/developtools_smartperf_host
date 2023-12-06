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

import { BaseBean } from './BaseBean';

export class USBHead extends Object implements BaseBean {
  private _flag: number[]; // uint8_t 'flag', ct.c_uint8 * 2 flag[2] 2
  private _option: number; // uint8_t 1
  private _sessionId: number; // uint32_t 4
  private _dataSize: number; // uint32_t 4

  constructor(flag: number[], option: number, sessionId: number, dataSize: number) {
    super();
    this._flag = flag;
    this._option = option;
    this._sessionId = sessionId;
    this._dataSize = dataSize;
  }
  static getFlag0Length() {
    return 1;
  }

  static getFlag1Length() {
    return 1;
  }

  static getOptionLength() {
    return 1;
  }

  static getSessionIdLength() {
    return 4;
  }

  static getDataSizeLength() {
    return 4;
  }

  static getUSBHeadLength() {
    return 11;
  }

  getDataView(): DataView {
    let dataView = new DataView(new ArrayBuffer(11));
    dataView.setUint8(0, this._flag[0]);
    dataView.setUint8(1, this._flag[1]);
    dataView.setUint8(2, this._option);
    dataView.setUint32(3, this._sessionId);
    dataView.setUint32(7, this._dataSize);
    return dataView;
  }

  static parseHeadData(data: DataView): USBHead {
    let flagZero = data.getUint8(0);
    let flagOne = data.getUint8(1);
    let option = data.getUint8(2);
    let sessionId = data.getUint32(3);
    let dataSize = data.getUint32(7);
    return new USBHead([flagZero, flagOne], option, sessionId, dataSize);
  }

  get flag(): number[] {
    return this._flag;
  }

  set flag(value: number[]) {
    this._flag = value;
  }

  get option(): number {
    return this._option;
  }

  set option(value: number) {
    this._option = value;
  }

  get sessionId(): number {
    return this._sessionId;
  }

  set sessionId(value: number) {
    this._sessionId = value;
  }

  get dataSize(): number {
    return this._dataSize;
  }

  set dataSize(value: number) {
    this._dataSize = value;
  }

  toString(): string {
    return (
      'flag: ' +
      this._flag +
      ' option: ' +
      this._option +
      ' sessionId: ' +
      this._sessionId +
      ' dataSize: ' +
      this._dataSize
    );
  }
}
