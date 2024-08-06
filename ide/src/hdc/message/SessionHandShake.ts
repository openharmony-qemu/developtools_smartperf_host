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

import { AuthType } from './AuthType';
import { HANDSHAKE_MESSAGE } from '../common/ConstantType';
import { BaseBean } from './BaseBean';

export class SessionHandShake extends Object implements BaseBean {
  private _banner: string = HANDSHAKE_MESSAGE; //  string  must first index
  private _authType: number = AuthType.AUTH_NONE; // uint8_t auth none
  private _sessionId: number = 0; // uint32_t
  private _connectKey: string = ''; // string
  private _buf: string = ''; // string
  private _version: string = 'Ver: 3.0.0b';

  constructor(banner: string, authType: number, sessionId: number, connectKey: string, buf: string, version: string) {
    super();
    this._banner = banner;
    this._authType = authType;
    this._sessionId = sessionId;
    this._connectKey = connectKey;
    this._buf = buf;
    this._version = version;
  }

  getDataView(): DataView {
    const view = new DataView(new ArrayBuffer(24));
    return view;
  }

  get banner(): string {
    return this._banner;
  }

  set banner(value: string) {
    this._banner = value;
  }

  get authType(): number {
    return this._authType;
  }

  set authType(value: number) {
    this._authType = value;
  }

  get sessionId(): number {
    return this._sessionId;
  }

  set sessionId(value: number) {
    this._sessionId = value;
  }

  get connectKey(): string {
    return this._connectKey;
  }

  set connectKey(value: string) {
    this._connectKey = value;
  }

  get buf(): string {
    return this._buf;
  }

  set buf(value: string) {
    this._buf = value;
  }

  get version(): string {
    return this._version;
  }

  set version(value: string) {
    this._version = value;
  }

  toString(): string {
    return (
      'banner: ' +
      this._banner +
      ' authType: ' +
      this._authType +
      ' sessionId: ' +
      this._sessionId +
      ' connectKey: ' +
      this._connectKey +
      ' buf: ' +
      this._buf +
      ' version: ' +
      this._version
    );
  }
}
