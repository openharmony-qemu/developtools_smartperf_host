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

import { Serialize } from '../common/Serialize';
import { HdcCommand } from './HdcCommand';
import { Utils } from '../common/Utils';
import { HANDSHAKE_MESSAGE } from '../common/ConstantType';
import { PayloadHead } from '../message/PayloadHead';
import { TransmissionInterface } from '../transmission/TransmissionInterface';
import { DataProcessing } from '../transmission/DataProcessing';
import { DataListener } from './DataListener';
import { DataMessage } from '../message/DataMessage';
import { SessionHandShake } from '../message/SessionHandShake';
import { AuthType } from '../message/AuthType';
import { debug, log } from '../../log/Log';
import { HdcStream } from './HdcStream';
import { toHex16 } from '../common/BaseConversion';
import { USBHead } from '../message/USBHead';

export class HdcClient implements DataListener {
  // @ts-ignore
  usbDevice: USBDevice | undefined;
  sessionId: number = 0;
  private transmissionChannel: TransmissionInterface;
  public readDataProcessing: DataProcessing;
  private cmdStreams = new Map();
  private isSuccess: boolean = false;
  private handBody: DataView | undefined;
  private message: DataMessage | undefined;
  private isSigna: boolean = false;

  constructor(
    transmissionChannel: TransmissionInterface,
    // @ts-ignore
    usbDevice: USBDevice | undefined
  ) {
    this.transmissionChannel = transmissionChannel;
    this.usbDevice = usbDevice;
    this.readDataProcessing = new DataProcessing(this, transmissionChannel);
  }

  async connectDevice(): Promise<boolean> {
    debug('start Connect Device');
    this.sessionId = Utils.getSessionId();
    log(`sessionId is ${this.sessionId}`);
    this.isSuccess = false;
    await this.handShakeConnect(AuthType.AUTH_NONE, 'authtype        1               1');
    let timeStamp = new Date().getTime();
    while (await this.readHandShakeMsg()) {
      if (new Date().getTime() - timeStamp > 10000) {
        break;
      }
      // 后续daemon修复发送通道关闭信息后，可放开this.message?.channelClose以作判断
      // 非握手包指令，不予理会
      if (this.message?.commandFlag !== HdcCommand.CMD_KERNEL_HANDSHAKE) {
        continue;
      }
      let backMessage = Serialize.parseHandshake(new Uint8Array(this.message.resArrayBuffer!));
      // 后续daemon修复增加sessionId数据判定后，可放开backMessage.sessionId !== this.sessionId以作判断
      const returnBuf: string = backMessage.buf;
      const returnAuth: number = backMessage.authType;
      switch (returnAuth) {
        case AuthType.AUTH_NONE:
          continue;
        case AuthType.AUTH_TOKEN:
          continue;
        case AuthType.AUTH_SIGNATURE:
          const hdcMsgUrl = this.isSigna ? 'signatureHdcMsg' : 'encryptHdcMsg';
          const response = await fetch(`${window.location.origin}${window.location.pathname}${hdcMsgUrl}?message=` + returnBuf);
          const dataBody = await response.json();
          let signatureHdcMsg = '';
          if (dataBody.success) {
            signatureHdcMsg = dataBody.data.signatures;
          } else {
            break;
          }
          await this.handShakeConnect(AuthType.AUTH_SIGNATURE, signatureHdcMsg);
          timeStamp = new Date().getTime();
          continue;
        case AuthType.AUTH_PUBLICKEY:
          if (returnBuf === 'authtype        1               1') {
            this.isSigna = true;
          } else {
            this.isSigna = false;
          }
          const responsePub = await fetch(`${window.location.origin}${window.location.pathname}hdcPublicKey`);
          const data = await responsePub.json();
          const publicKey = data.success && (`smartPerf-Host` + String.fromCharCode(12) + data.data.publicKey);
          await this.handShakeConnect(AuthType.AUTH_PUBLICKEY, publicKey);
          timeStamp = new Date().getTime();
          continue;
        case AuthType.AUTH_OK:
          if (returnBuf.toLocaleLowerCase().indexOf('unauth') === -1 || returnBuf.includes('SUCCESS')) {
            this.handShakeSuccess(this.handBody!);
            this.isSuccess = true;
            break;
          } else {
            continue;
          }
        default:
          continue;
      }
    }
    return this.isSuccess;
  }

  private async handShakeConnect(authType: number, buf: string): Promise<void> {
    // @ts-ignore
    let handShake: SessionHandShake = new SessionHandShake(
      HANDSHAKE_MESSAGE,
      authType,
      this.sessionId,
      // @ts-ignore
      this.usbDevice.serialNumber,
      buf,
      'Ver: 3.0.0b'
    );
    let hs = Serialize.serializeSessionHandShake(handShake);
    debug('start Connect hs ', hs);
    await this.readDataProcessing.send(
      handShake.sessionId,
      0,
      HdcCommand.CMD_KERNEL_HANDSHAKE,
      hs,
      hs.length
    );
  }

  private async readHandShakeMsg(): Promise<boolean> {
    if (this.isSuccess) {
      return false;
    }
    let handShake = await this.readDataProcessing.readUsbHead();
    this.handBody = await this.readDataProcessing.readBody(handShake!.dataSize);
    this.message = new DataMessage(handShake!, this.handBody);
    return true;
  }

  private handShakeSuccess(handBody: DataView): void {
    let playHeadArray = handBody.buffer.slice(0, PayloadHead.getPayloadHeadLength());
    let resultPayloadHead: PayloadHead = PayloadHead.parsePlayHead(new DataView(playHeadArray));
    debug('resultPayloadHead is ', resultPayloadHead);
    let headSize = resultPayloadHead.headSize;
    let dataSize = resultPayloadHead.dataSize;
    let resPlayProtectBuffer = handBody.buffer.slice(
      PayloadHead.getPayloadHeadLength(),
      PayloadHead.getPayloadHeadLength() + headSize
    );
    debug('PlayProtect is ', resPlayProtectBuffer);
    let resData = handBody.buffer.slice(
      PayloadHead.getPayloadHeadLength() + headSize,
      PayloadHead.getPayloadHeadLength() + headSize + dataSize
    );
    debug('resData is ', resData);
    this.readDataProcessing.startReadData().then(() => {});
  }
  public async disconnect(): Promise<void> {
    try {
      await this.transmissionChannel.close();
      this.readDataProcessing.stopReadData();
      this.cmdStreams.forEach((value) => {
        value.putMessageInQueue(new DataMessage(new USBHead([0, 1], -1, -1, -1)));
      });
      this.cmdStreams.clear();
    } catch (e) {}
  }

  public bindStream(channel: number, hdcStream: HdcStream): void {
    this.cmdStreams.set(channel, hdcStream);
  }

  public unbindStream(channel: number): boolean {
    this.cmdStreams.delete(channel);
    return true;
  }

  public unbindStopStream(channel: number): boolean {
    this.cmdStreams.delete(channel);
    return true;
  }

  createDataMessage(data: DataMessage): void {
    if (this.cmdStreams.has(data.getChannelId())) {
      let stream = this.cmdStreams.get(data.getChannelId());
      if (stream) {
        stream.putMessageInQueue(data);
      }
    }
  }
}
