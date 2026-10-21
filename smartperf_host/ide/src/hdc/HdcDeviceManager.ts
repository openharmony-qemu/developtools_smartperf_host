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

import { HdcClient } from './hdcclient/HdcClient';
import { UsbTransmissionChannel } from './transmission/UsbTransmissionChannel';
import { HDC_DEVICE_FILTERS } from './common/ConstantType';
import { FormatCommand } from './hdcclient/FormatCommand';
import { log } from '../log/Log';
import { HdcStream } from './hdcclient/HdcStream';
import { HdcCommand } from './hdcclient/HdcCommand';
import { SpRecordTrace } from '../trace/component/SpRecordTrace';
import { DataMessage } from './message/DataMessage';

export class HdcDeviceManager {
  static escapeCharacterDict = {
    Escape: [27],
    Tab: [9],
    Backspace: [8],
    Enter: [13],
    Insert: [27, 91, 50, 126],
    Home: [27, 91, 49, 126],
    Delete: [27, 91, 51, 126],
    End: [27, 91, 52, 126],
    PageDown: [27, 91, 54, 126],
    PageUp: [27, 91, 53, 126],
    ArrowUp: [27, 91, 65],
    ArrowDown: [27, 91, 66],
    ArrowLeft: [27, 91, 68],
    ArrowRight: [27, 91, 67],
  };
  static ctrlKey = {
    c: [3],
  };
  private static clientList: Map<string, HdcClient> = new Map();
  public static currentHdcClient: HdcClient;
  private static FILE_RECV_PREFIX_STRING = 'hdc file recv -cwd C:\\ ';
  private static cmdSerialNumber: string = '';
  public static hdcCmdMode: boolean = true;

  /**
   * 检测浏览器是否支持 WebUSB。
   * 鸿蒙 PC 海泰浏览器虽有 navigator.usb 对象但 transferIn/transferOut 不可用，
   * 需通过 Go 服务检测 hdc 是否可用来强制走 cmd 模式。
   */
  public static isWebUsbSupported(): boolean {
    if (HdcDeviceManager.hdcCmdMode) {
      return false;
    }
    if (HdcDeviceManager.cmdSerialNumber) {
      return false;
    }
    // @ts-ignore
    if (typeof navigator === 'undefined' || !('usb' in navigator)) {
      return false;
    }
    // @ts-ignore
    const usb = navigator.usb;
    // @ts-ignore
    return typeof usb.requestDevice === 'function' && typeof usb.getDevices === 'function';
  }

  /**
   * getDevices
   */
  // @ts-ignore
  public static async getDevices(): Promise<USBDevice[]> {
    if (!HdcDeviceManager.isWebUsbSupported()) {
      return HdcDeviceManager.cmdListDevices();
    }
    // @ts-ignore
    return navigator.usb.getDevices();
  }

  /**
   * findDevice
   */
  // @ts-ignore
  public static findDevice(): Promise<USBDevice> {
    if (!HdcDeviceManager.isWebUsbSupported()) {
      // @ts-ignore
      return HdcDeviceManager.cmdListDevices().then((devices): any => {
        if (devices.length === 0) {
          throw new Error('No hdc device found (hdc list targets is empty)');
        }
        return devices[0];
      });
    }
    // @ts-ignore
    return navigator.usb.requestDevice({ filters: HDC_DEVICE_FILTERS });
  }

  /**
   * connect by serialNumber
   *
   * @param serialNumber serialNumber
   */
  public static async connect(serialNumber: string): Promise<boolean> {
    if (!HdcDeviceManager.isWebUsbSupported()) {
      HdcDeviceManager.cmdSerialNumber = serialNumber;
      // @ts-ignore
      this.currentHdcClient = { usbDevice: { serialNumber: serialNumber } } as HdcClient;
      return true;
    }
    if (this.currentHdcClient && serialNumber !== this.currentHdcClient.usbDevice.serialNumber) {
      this.clientList.delete(serialNumber);
      HdcDeviceManager.disConnect(this.currentHdcClient.usbDevice.serialNumber).then((): void => {
        window.publish(window.SmartEvent.UI.DeviceDisConnect, this.currentHdcClient.usbDevice.serialNumber);
      });
    }
    const client = this.clientList.get(serialNumber);
    if (client && this.currentHdcClient && serialNumber === this.currentHdcClient.usbDevice.serialNumber) {
      if (client.usbDevice!.opened) {
        log('device Usb is Open');
        return true;
      } else {
        if (SpRecordTrace.serialNumber === serialNumber) {
          SpRecordTrace.serialNumber = '';
        }
        log('device Usb not Open');
        return false;
      }
    }
    try {
      const connectDevice = await this.getDeviceBySerialNumber(serialNumber);
      if (!connectDevice) {
        throw new Error('device not found');
      }
      const usbChannel = await UsbTransmissionChannel.openHdcDevice(connectDevice);
      if (usbChannel) {
        const hdcClient = new HdcClient(usbChannel, connectDevice);
        const connected = await Promise.race([
          hdcClient.connectDevice(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 15000)),
        ]);
        if (connected) {
          this.currentHdcClient = hdcClient;
          this.clientList.set(serialNumber, hdcClient);
          log(`device Usb connected : ${connected}`);
          return true;
        }
      }
      log('WebUSB connect failed, falling back to hdc cmd mode');
      HdcDeviceManager.cmdSerialNumber = serialNumber;
      // @ts-ignore
      this.currentHdcClient = { usbDevice: { serialNumber: serialNumber } } as HdcClient;
      return true;
    } catch (e) {
      log('WebUSB connect error, falling back to hdc cmd mode: ' + e);
      HdcDeviceManager.cmdSerialNumber = serialNumber;
      // @ts-ignore
      this.currentHdcClient = { usbDevice: { serialNumber: serialNumber } } as HdcClient;
      return true;
    }
  }

  // @ts-ignore
  public static async getDeviceBySerialNumber(serialNumber: string): Promise<USBDevice> {
    // @ts-ignore
    const devices = await navigator.usb.getDevices();
    // @ts-ignore
    return devices.find((dev): boolean => dev.serialNumber === serialNumber);
  }

  /**
   * disConnect by serialNumber
   *
   * @param serialNumber
   */
  public static async disConnect(serialNumber: string): Promise<boolean> {
    if (HdcDeviceManager.cmdSerialNumber && HdcDeviceManager.cmdSerialNumber === serialNumber) {
      HdcDeviceManager.cmdSerialNumber = '';
      this.currentHdcClient = undefined as any;
      return true;
    }
    const hdcClient = this.clientList.get(serialNumber);
    if (hdcClient) {
      await hdcClient.disconnect();
      this.clientList.delete(serialNumber);
      return true;
    } else {
      return true;
    }
  }

  /**
   * Execute shell on the currently connected device and return the result as a string
   *
   * @param cmd cmd
   * @param isSkipResult isSkipResult
   * @param shellResultHandleFun shellResultHandleFun
   */
  public static async shellResultAsString(cmd: string, isSkipResult: boolean, shellResultHandleFun?: Function):
    Promise<string> {
    if (this.currentHdcClient) {
      if (HdcDeviceManager.cmdSerialNumber) {
        return HdcDeviceManager.cmdShell(cmd);
      }
      const hdcStream = new HdcStream(this.currentHdcClient, false);
      await hdcStream.DoCommand(cmd);
      let result = '';
      while (true) {
        const dataMessage = await hdcStream.getMessage();
        if (dataMessage.channelClose || isSkipResult) {
          result += dataMessage.getDataToString();
          await hdcStream.DoCommandRemote(new FormatCommand(HdcCommand.CMD_KERNEL_CHANNEL_CLOSE, '0', false));
          log('result is end, close');
          break;
        }
        if (dataMessage.usbHead.sessionId === -1) {
          await hdcStream.closeStream();
          return Promise.resolve('The device is abnormal');
        }
        let dataResult = dataMessage.getDataToString();
        result += dataResult;
        if (shellResultHandleFun && cmd.endsWith('CONFIG')) {
          shellResultHandleFun(dataResult);
        }
      }
      await hdcStream.closeStream();
      await hdcStream.DoCommandRemote(new FormatCommand(HdcCommand.CMD_KERNEL_CHANNEL_CLOSE, '0', false));
      return Promise.resolve(result);
    }
    return Promise.reject('not select device');
  }

  /**
   * Execute shell on the currently connected device and return the result as a string
   *
   * @param cmd cmd
   */
  public static async stopHiprofiler(cmd: string): Promise<string> {
    if (this.currentHdcClient) {
      if (HdcDeviceManager.cmdSerialNumber) {
        return HdcDeviceManager.cmdShell(cmd);
      }
      const hdcStream = new HdcStream(this.currentHdcClient, true);
      await hdcStream.DoCommand(cmd);
      let result = '';
      let dataMessage = await hdcStream.getMessage();
      result += dataMessage.getDataToString();
      while (!dataMessage.channelClose) {
        dataMessage = await hdcStream.getMessage();
        result += dataMessage.getDataToString();
      }
      await hdcStream.DoCommandRemote(new FormatCommand(HdcCommand.CMD_KERNEL_CHANNEL_CLOSE, '0', false));
      await hdcStream.closeStream();
      return Promise.resolve(result);
    }
    return Promise.reject('not select device');
  }

  public static startShell(
    resultCallBack: (res: DataMessage) => void
  ): ((keyboardEvent: KeyboardEvent | string) => void | undefined) | undefined {
    if (this.currentHdcClient) {
      if (HdcDeviceManager.cmdSerialNumber) {
        log('interactive shell is not supported in hdc cmd mode');
        return (): void => {};
      }
      const hdcShellStream = new HdcStream(this.currentHdcClient, false);
      this.shellInit(hdcShellStream, resultCallBack);
      return (keyboardEvent: KeyboardEvent | string): void => {
        let code = undefined;
        if (keyboardEvent instanceof KeyboardEvent) {
          const cmd = keyboardEvent.key;
          if (keyboardEvent.shiftKey && keyboardEvent.key.toUpperCase() === 'SHIFT') {
            return;
          } else if (keyboardEvent.metaKey) {
            return;
          } else if (keyboardEvent.ctrlKey) {
            // @ts-ignore
            code = this.ctrlKey[keyboardEvent.key];
            if (!code) {
              return;
            } else {
              const dataArray = new Uint8Array(code);
              hdcShellStream.sendToDaemon(
                new FormatCommand(HdcCommand.CMD_SHELL_DATA, cmd, false),
                dataArray,
                dataArray.length
              );
            }
          } else if (keyboardEvent.altKey) {
            return;
          } else {
            // @ts-ignore
            code = this.escapeCharacterDict[cmd];
            if (code) {
              const dataArray = new Uint8Array(code);
              hdcShellStream.sendToDaemon(
                new FormatCommand(HdcCommand.CMD_SHELL_DATA, cmd, false),
                dataArray,
                dataArray.length
              );
            } else {
              if (cmd.length === 1) {
                hdcShellStream.DoCommand(cmd);
              }
            }
          }
        } else {
          hdcShellStream.DoCommand(HdcDeviceManager.processCommand(keyboardEvent));
        }
      };
    }
  }

  private static processCommand(command: string): string {
    if (command.indexOf('\\') === -1) {
      return command;
    }
    const lines = command.split('\r\n');
    let processedCommand = '';
    lines.forEach((line) => {
      if (line.endsWith('\\')) {
        line = line.slice(0, -1);
        processedCommand += line;
      } else {
        processedCommand += line;
        processedCommand += '\n';
      }
    });
    return processedCommand;
  }

  /**
   * Execute shell on the currently connected device, the result is returned as Blob
   *
   * @param cmd cmd
   */
  public static async shellResultAsBlob(cmd: string, isSkipResult: boolean): Promise<Blob> {
    if (this.currentHdcClient) {
      if (HdcDeviceManager.cmdSerialNumber) {
        const result = await HdcDeviceManager.cmdShell(cmd);
        return new Blob([result]);
      }
      const hdcStream = new HdcStream(this.currentHdcClient, false);
      log(`cmd is ${cmd}`);
      await hdcStream.DoCommand(cmd);
      let finalBuffer;
      while (true) {
        const dataMessage = await hdcStream.getMessage();
        if (dataMessage.channelClose || isSkipResult) {
          log('result is end, close');
          break;
        }
        const res = dataMessage.getData();
        if (res) {
          if (!finalBuffer) {
            finalBuffer = new Uint8Array(res);
          } else {
            finalBuffer = HdcDeviceManager.appendBuffer(finalBuffer, new Uint8Array(res));
          }
        }
      }
      await hdcStream.closeStream();
      if (finalBuffer) {
    // @ts-ignore
        return Promise.resolve(new Blob([finalBuffer]));
      }
      return Promise.resolve(new Blob());
    }
    return Promise.reject('not select device');
  }

  /**
   * Pull the corresponding file from the device side
   *
   * @param filename filename
   */
  // 进度
  public static async fileRecv(filename: string, callBack: (schedule: number) => void): Promise<Blob> {
    if (this.currentHdcClient && HdcDeviceManager.cmdSerialNumber) {
      return HdcDeviceManager.cmdFileRecv(filename, callBack);
    }
    let finalBuffer;
    if (this.currentHdcClient) {
      const hdcStream = new HdcStream(this.currentHdcClient, false);
      await hdcStream.DoCommand(`${HdcDeviceManager.FILE_RECV_PREFIX_STRING + filename} ./`);
      if (!finalBuffer && hdcStream.fileSize > 0) {
        finalBuffer = new Uint8Array(hdcStream.fileSize);
        log(`Uint8Array size is ${finalBuffer.byteLength}`);
      }
      let offset = 0;
      while (true) {
        const dataMessage = await hdcStream.getMessage();
        if (dataMessage.channelClose) {
          log('result is end, close');
          break;
        }
        if (dataMessage.commandFlag === HdcCommand.CMD_FILE_FINISH) {
          await hdcStream.DoCommandRemote(new FormatCommand(HdcCommand.CMD_KERNEL_CHANNEL_CLOSE, '', false));
          log('CMD_FILE_FINISH is end, close');
          break;
        }
        const res = dataMessage.getData();
        if (res) {
          const resRS: ArrayBuffer = res.slice(64);
          if (finalBuffer) {
            finalBuffer.set(new Uint8Array(resRS), offset);
            offset += resRS.byteLength;
            callBack(Number(((offset / hdcStream.fileSize) * 100).toFixed(3)));
          }
        }
        if (hdcStream.fileSize !== -1 && offset >= hdcStream.fileSize) {
          callBack(100);
          await hdcStream.DoCommandRemote(new FormatCommand(HdcCommand.CMD_FILE_FINISH, '', false));
        }
      }
    }
    if (finalBuffer) {
      return Promise.resolve(new Blob([finalBuffer]));
    } else {
      return Promise.resolve(new Blob([]));
    }
  }

  private static shellInit(hdcShellStream: HdcStream, resultCallBack: (res: DataMessage) => void): void {
    hdcShellStream.DoCommand('hdc_std shell').then(async () => {
      while (true) {
        const data = await hdcShellStream.getMessage();
        resultCallBack(data);
        if (data.channelClose) {
          const channelClose = new FormatCommand(HdcCommand.CMD_KERNEL_CHANNEL_CLOSE, '0', false);
          hdcShellStream.DoCommandRemote(channelClose).then(() => {
            hdcShellStream.closeStream();
          });
          return;
        }
      }
    });
  }

  /**
   * appendBuffer
   *
   * @param buffer1 firstBuffer
   * @param buffer2 secondBuffer
   * @private
   */
  private static appendBuffer(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.byteLength);
    return tmp;
  }

  // ===== hdc 命令模式：WebUSB 不可用时，通过 Go 服务 /hdcCmd 转发 hdc 命令 =====

  private static parseTraceDuration(cmd: string): number {
    const match = cmd.match(/hiprofiler_cmd[\s\S]*?-t\s+(\d+)/);
    if (match && match[1]) {
      const secs = parseInt(match[1], 10);
      if (secs > 0) {
        return secs;
      }
    }
    return 0;
  }

  // @ts-ignore
  private static async cmdListDevices(): Promise<USBDevice[]> {
    try {
      const resp = await HdcDeviceManager.cmdFetch('/hdcCmd', { cmd: 'hdc list targets', tag: 'shell' }, 30000);
      const json = await resp.json();
      if (json.success && json.data && json.data.output) {
        const lines = (json.data.output as string).trim().split(/\r?\n/);
        // @ts-ignore
        return lines
          .filter((s: string) => s.trim() && s.indexOf('Empty') === -1)
          .map((sn: string): any => ({ serialNumber: sn.trim() } as any));
      }
    } catch (e) {
      log('cmdListDevices failed: ' + e);
    }
    // @ts-ignore
    return [];
  }

  private static async cmdShell(cmd: string): Promise<string> {
    try {
      const normalizedCmd = cmd.replace(/^hdc_std\b/, 'hdc');
      const traceSecs = HdcDeviceManager.parseTraceDuration(normalizedCmd);
      // 前端超时 = Go 超时 + 120s 缓冲，确保 Go 先返回响应，避免竞态
      const timeout = traceSecs > 0 ? (traceSecs + 240) * 1000 : (normalizedCmd.includes('<<') ? 3720000 : 300000);
      const resp = await HdcDeviceManager.cmdFetch('/hdcCmd', { cmd: normalizedCmd, tag: 'shell' }, timeout);
      const json = await resp.json();
      if (json.success) {
        return (json.data && json.data.output) || '';
      }
      log('cmdShell failed: ' + (json.msg || ''));
      return 'cmdShell failed: ' + (json.msg || 'unknown error');
    } catch (e) {
      log('cmdShell failed: ' + e);
      return 'cmdShell failed: ' + String(e);
    }
  }

  private static async cmdFileRecv(filename: string, callBack: (schedule: number) => void): Promise<Blob> {
    if (!HdcDeviceManager.cmdSerialNumber) {
      return Promise.resolve(new Blob([]));
    }
    try {
      const sn = HdcDeviceManager.cmdSerialNumber;
      const localName = filename.substring(filename.lastIndexOf('/') + 1);
      const resp = await HdcDeviceManager.cmdFetch(
        '/hdcCmd',
        { cmd: `hdc -t ${sn} file recv ${filename} ./`, tag: 'file', fileName: localName },
        1800000
      );
      const buf = await resp.arrayBuffer();
      callBack(100);
      return new Blob([buf]);
    } catch (e) {
      log('cmdFileRecv failed: ' + e);
      return new Blob([]);
    }
  }

  private static async cmdFetch(url: string, body: any, timeoutMs: number): Promise<Response> {
    const fetchOptions: any = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        fetchOptions.signal = controller.signal;
        return await fetch(url, fetchOptions);
      } finally {
        clearTimeout(timer);
      }
    }
    return fetch(url, fetchOptions);
  }
}
