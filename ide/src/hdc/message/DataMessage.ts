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

import { USBHead } from './USBHead';
import { debug, log } from '../../log/Log';
import { PayloadHead } from './PayloadHead';
import { Serialize } from '../common/Serialize';
import { Utils } from '../common/Utils';
import { HdcCommand } from '../hdcclient/HdcCommand';

export class DataMessage extends Object {
  body?: DataView;

  private _usbHead: USBHead;
  private _channelId: number = -1;
  private _result: string = '';
  private _channelClose: boolean = false;
  private _resArrayBuffer: ArrayBuffer | undefined;
  private _commandFlag: number = -1;

  constructor(usbHead: USBHead, body?: DataView) {
    super();
    this._usbHead = usbHead;
    this.body = body;
    if (this.body) {
      this.splitData();
    }
  }

  splitData() {
    let playHeadArray = this.body!.buffer.slice(0, 11);
    let resultPayloadHead: PayloadHead = PayloadHead.parsePlayHead(new DataView(playHeadArray));
    let headSize = resultPayloadHead.headSize;
    let dataSize = resultPayloadHead.dataSize;
    let resultPlayProtectBuffer = this.body!.buffer.slice(11, 11 + headSize);
    let payloadProtect = Serialize.parsePayloadProtect(resultPlayProtectBuffer);
    this._channelId = payloadProtect.channelId;
    this._commandFlag = payloadProtect.commandFlag;
    if (payloadProtect.commandFlag == HdcCommand.CMD_KERNEL_CHANNEL_CLOSE) {
      log('commandFlag: ' + payloadProtect.commandFlag);
      this._channelClose = true;
    } else {
      if (dataSize > 0) {
        this._resArrayBuffer = this.body!.buffer.slice(11 + headSize, 11 + headSize + dataSize);
      }
    }
  }

  public getChannelId(): number {
    return this._channelId;
  }

  public getData(): ArrayBuffer | undefined {
    return this._resArrayBuffer;
  }

  public getDataToString(): string {
    let textDecoder = new TextDecoder();
    this._result = textDecoder.decode(this._resArrayBuffer);
    return this._result;
  }

  get usbHead(): USBHead {
    return this._usbHead;
  }

  set usbHead(value: USBHead) {
    this._usbHead = value;
  }

  get channelId(): number {
    return this._channelId;
  }

  set channelId(value: number) {
    this._channelId = value;
  }

  get result(): string {
    return this._result;
  }

  set result(value: string) {
    this._result = value;
  }

  get channelClose(): boolean {
    return this._channelClose;
  }

  set channelClose(value: boolean) {
    this._channelClose = value;
  }

  get resArrayBuffer(): ArrayBuffer | undefined {
    return this._resArrayBuffer;
  }

  set resArrayBuffer(value: ArrayBuffer | undefined) {
    this._resArrayBuffer = value;
  }

  get commandFlag(): number {
    return this._commandFlag;
  }

  set commandFlag(value: number) {
    this._commandFlag = value;
  }

  toString(): string {
    return (
      'usbHead: ' +
      this._usbHead +
      ' channelId: ' +
      this._channelId +
      ' result: ' +
      this._result +
      ' channelClose: ' +
      this._channelClose +
      ' commandFlag: ' +
      this._commandFlag
    );
  }
}
