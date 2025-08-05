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

import { TransmissionInterface } from './TransmissionInterface';
import { PACKET_FLAG, USB_PACKET_FLAG } from '../common/ConstantType';
import { USBHead } from '../message/USBHead';
import { DataMessage } from '../message/DataMessage';
import { DataListener } from '../hdcclient/DataListener';
import { PayloadProtect } from '../message/PayloadProtect';
import { Serialize } from '../common/Serialize';
import { PayloadHead } from '../message/PayloadHead';
import { UsbProtocolOption } from '../hdcclient/UsbProtocolOption';
import { toHex16 } from '../common/BaseConversion';
import { error, log } from '../../log/Log';

export class DataProcessing {
  private readonly transmissionChannel: TransmissionInterface;
  private dataListener: DataListener;
  public readData = true;
  private static usbHeadSize: number = 11;
  private static vCode: number = 0x09;
  private static checkSum: number = 0;

  constructor(dataListener: DataListener, transmissionChannel: TransmissionInterface) {
    this.dataListener = dataListener;
    this.transmissionChannel = transmissionChannel;
  }

  public async startReadData(): Promise<void> {
    try {
      while (this.readData) {
        let usbHead = await this.readUsbHead();
        if (usbHead !== null) {
          let dataSize = usbHead!.dataSize;
          if (dataSize > 0) {
            let body = await this.readBody(dataSize);
            let message = new DataMessage(usbHead, body);
            this.dataListener.createDataMessage(message);
          } else {
            let message = new DataMessage(usbHead);
            this.dataListener.createDataMessage(message);
          }
        } else {
          log('head is null');
        }
      }
    } catch (e) {
      let ubsHead = new USBHead([-1, -1], -1, -1, -1);
      let message = new DataMessage(ubsHead);
      this.dataListener.createDataMessage(message);
      error('error', e);
    }
  }

  public async readUsbHead(): Promise<USBHead | null> {
    let res = await this.transmissionChannel.readData(USBHead.getUSBHeadLength());
    if (res) {
      let useHead: USBHead = USBHead.parseHeadData(res);
      return useHead;
    }
    return null;
  }

  public async readBody(dataSize: number): Promise<DataView> {
    let data = await this.transmissionChannel.readData(dataSize);
    return data;
  }

  public async send(
    sessionId: number,
    channelId: number,
    commandFlag: number,
    data: Uint8Array,
    dataSize: number
  ): Promise<boolean> {
    let protectBuf: PayloadProtect = new PayloadProtect(
      channelId,
      commandFlag,
      DataProcessing.checkSum,
      DataProcessing.vCode
    );
    let pbs = Serialize.serializePayloadProtect(protectBuf);
    let payloadHead: PayloadHead = new PayloadHead(
      [PACKET_FLAG.charCodeAt(0), PACKET_FLAG.charCodeAt(1)],
      [0, 0],
      1,
      pbs.byteLength,
      dataSize
    );
    let dataView = payloadHead.getDataView();
    let playHeadArray = new Uint8Array(dataView.buffer);
    let finalBufSize = dataView.byteLength + pbs.byteLength + dataSize;
    let finalBuf = new Uint8Array(finalBufSize);
    finalBuf.set(playHeadArray);
    finalBuf.set(pbs, dataView.byteLength);
    finalBuf.set(data, dataView.byteLength + pbs.byteLength);
    if (this.transmissionChannel) {
      let header = this.buildPacketHeader(sessionId, UsbProtocolOption.USB_OPTION_HEADER, finalBufSize);
    // @ts-ignore
      await this.transmissionChannel.writeData(header);
    // @ts-ignore
      await this.transmissionChannel.writeData(finalBuf);
      return true;
    } else {
      this.stopReadData();
      return false;
    }
  }

  private buildPacketHeader(sessionId: number, option: number, dataSize: number): Uint8Array {
    let head: USBHead = new USBHead(
      [USB_PACKET_FLAG.charCodeAt(0), USB_PACKET_FLAG.charCodeAt(1)],
      option,
      sessionId,
      dataSize
    );
    let dataView = head.getDataView();
    return new Uint8Array(dataView.buffer);
  }

  public stopReadData(): void {
    this.readData = false;
  }
}
