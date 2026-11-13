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

export const HANDSHAKE_MESSAGE: string = 'OHOS HDC'; // sep not char '-', not more than 11 bytes
export const PACKET_FLAG = 'HW';
export const USB_PACKET_FLAG: string = 'UB';
export const MAX_PACKET_SIZE_HISPEED: number = 512; // uint16_t
export const MAX_USBFFS_BULK: number = 16384;
export const ERR_IO_FAIL = -14000;

export const CMDSTR_SHELL: string = 'shell';
export const CMDSTR_FILE_SEND: string = 'file send';
export const CMDSTR_FILE_RECV: string = 'file recv';
// @ts-ignore
export const HDC_DEVICE_FILTER = { classCode: 255, subclassCode: 80, protocolCode: 1 } as USBDeviceFilter;

export const HDC_DEVICE_FILTERS = [HDC_DEVICE_FILTER];
