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

export class PayloadProtect extends Object implements BaseBean {
  // reserve for encrypt and decrypt
  private _channelId: number; //uint32_t
  private _commandFlag: number; //uint32_t
  private _checkSum: number; // uint8_t enable it will be lose about 20% speed
  private _vCode: number; //uint8_t

  constructor(channelId: number, commandFlag: number, checkSum: number, vCode: number) {
    super();
    this._channelId = channelId;
    this._commandFlag = commandFlag;
    this._checkSum = checkSum;
    this._vCode = vCode;
  }

  getDataView(): DataView {
    return new DataView(new ArrayBuffer(24));
  }

  get channelId(): number {
    return this._channelId;
  }

  set channelId(value: number) {
    this._channelId = value;
  }

  get commandFlag(): number {
    return this._commandFlag;
  }

  set commandFlag(value: number) {
    this._commandFlag = value;
  }

  get checkSum(): number {
    return this._checkSum;
  }

  set checkSum(value: number) {
    this._checkSum = value;
  }

  get vCode(): number {
    return this._vCode;
  }

  set vCode(value: number) {
    this._vCode = value;
  }

  toString(): string {
    return (
      'channelId: ' +
      this._channelId +
      ' commandFlag: ' +
      this._commandFlag +
      ' checkSum: ' +
      this._checkSum +
      ' vCode: ' +
      this._vCode
    );
  }
}
