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

export class PayloadHead extends Object implements BaseBean {
  private _flag: Array<number> = [0, 0]; //uint8_t  ct.c_uint8 * 2
  private _reserve: Array<number>; //uint8_t // encrypt'flag or others options ct.c_uint8 * 2
  private _protocolVer: number; // uint8_t 1
  private _headSize: number = 0; // uint16_t 2
  private _dataSize: number = 0; // uint32_t 4

  constructor(flag: Array<number>, reserve: Array<number>, protocolVer: number, headSize: number, dataSize: number) {
    super();
    this._flag = flag;
    this._reserve = reserve;
    this._protocolVer = protocolVer;
    this._headSize = headSize;
    this._dataSize = dataSize;
  }

  static getPayloadHeadLength() {
    return 11;
  }
  getDataView(): DataView {
    const view = new DataView(new ArrayBuffer(11));
    view.setUint8(0, this._flag[0]);
    view.setUint8(1, this._flag[1]);
    view.setUint8(2, this._reserve[0]);
    view.setUint8(3, this._reserve[1]);
    view.setUint8(4, this._protocolVer);
    view.setUint16(5, this._headSize, false);
    view.setUint32(7, this._dataSize);
    return view;
  }

  static parsePlayHead(data: DataView): PayloadHead {
    let flagZero = data.getUint8(0);
    let flagOne = data.getUint8(1);
    let reserveZero = data.getUint8(2);
    let reserveOne = data.getUint8(3);
    let protocolVer = data.getUint8(4);
    let headSize = data.getUint16(5);
    let dataSize;
    if (data.byteLength < 11) {
      dataSize = 0;
    } else {
      dataSize = data.getUint32(7);
    }
    return new PayloadHead([flagZero, flagOne], [reserveZero, reserveOne], protocolVer, headSize, dataSize);
  }

  get flag(): Array<number> {
    return this._flag;
  }

  set flag(value: Array<number>) {
    this._flag = value;
  }

  get headSize(): number {
    return this._headSize;
  }

  set headSize(value: number) {
    this._headSize = value;
  }

  get dataSize(): number {
    return this._dataSize;
  }

  set dataSize(value: number) {
    this._dataSize = value;
  }

  toString(): string {
    return 'PayloadHead: ' + this.getDataView.toString() + ', parsePlayHead: ' + PayloadHead.parsePlayHead.toString();
  }
}
