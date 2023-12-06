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
    // @ts-ignore
    let handShake: SessionHandShake = new SessionHandShake(
      HANDSHAKE_MESSAGE,
      AuthType.AUTH_NONE,
      this.sessionId,
      // @ts-ignore
      this.usbDevice.serialNumber,
      ''
    );
    let hs = Serialize.serializeSessionHandShake(handShake);
    debug('start Connect hs ', hs);
    let sendResult = await this.readDataProcessing.send(
      handShake.sessionId,
      0,
      HdcCommand.CMD_KERNEL_HANDSHAKE,
      hs,
      hs.length
    );
    if (sendResult) {
      let handShake = await this.readDataProcessing.readUsbHead();
      let handBody = await this.readDataProcessing.readBody(handShake!.dataSize);
      if (this.sessionId === handShake!.sessionId) {
        debug('handShake: ', handShake);
        this.handShakeSuccess(handBody);
        return true;
      } else {
        log(`session is not eq handShake?.sessionId is : ${handShake?.sessionId} now session is ${this.sessionId}`);
        return false;
      }
    } else {
      return false;
    }
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
    this.cmdStreams['delete'](channel);
    return true;
  }

  public unbindStopStream(channel: number): boolean {
    this.cmdStreams['delete'](channel);
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
