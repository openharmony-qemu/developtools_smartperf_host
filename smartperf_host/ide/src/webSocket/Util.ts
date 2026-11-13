/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

const MSG_HEAD_LENGTH = 20;
const TYPT_LENGTH = 1;
const CMD_LENGTH = 2;
const SESSION_ID_LENGTH = 1;
const SESSION_LENGTH = 4;
export class Utils {
    // 模块传进来的数据
    static encode(message: MessageParam): ArrayBuffer {
        let splitUint64 = message.session ? Utils.splitUint64ToUint32s(BigInt(message.session!)) : { high32: 0, low32: 0 };// 需处理64bit(session)
        let totalByteLength = MSG_HEAD_LENGTH + (message.data_lenght ? message.data_lenght : 0);
        let combinedBuffer = new ArrayBuffer(totalByteLength);// 一个更大的ArrayBuffer，合并前20个字节和data
        let headBuffer = new ArrayBuffer(MSG_HEAD_LENGTH);
        let dataView = new DataView(headBuffer);
        let index = 0;
        dataView.setUint8(index, message.type!);
        index += TYPT_LENGTH;
        dataView.setUint16(index, message.cmd ? message.cmd : 0);
        index += CMD_LENGTH;
        dataView.setUint8(index, message.session_id ? message.session_id : 0);
        index += SESSION_ID_LENGTH;
        dataView.setUint32(index, splitUint64?.high32!);
        index += SESSION_LENGTH;
        dataView.setUint32(index, splitUint64?.low32!);
        index += SESSION_LENGTH;
        dataView.setUint32(index, message.data_lenght ? message.data_lenght : 0);
        // 处理合并message.data
        let existingArray = new Uint8Array(headBuffer); // 将处理好的前20个字节 
        let combinedArray = new Uint8Array(combinedBuffer);
        // 分别将前20个字节和data对应的字节流set至combinedBuffer
        combinedArray.set(existingArray, 0);
        combinedArray.set(message.data ? message.data : new Uint8Array(0), headBuffer.byteLength);
        return combinedBuffer;
    }

    // onmessage接收到的数据解码
    public static decode(message: ArrayBuffer): MessageParam {
        let decode: MessageParam | undefined;
        let dataView = new DataView(message);
        let sessionHigh = dataView.getUint32(4);
        let sessionLow = dataView.getUint32(8);
        // 将两个 32 位部分组合成一个 64 位的 BigInt  
        let session = BigInt(sessionHigh) << BigInt(32) | BigInt(sessionLow);
        // 先将data所需的字节截取出来
        let dataBytes = new Uint8Array(message, MSG_HEAD_LENGTH, message.byteLength - MSG_HEAD_LENGTH);
        // 解码 session 的两个 32 位部分  
        decode = {
            type: dataView.getUint8(0),
            cmd: dataView.getUint16(1),
            session_id: dataView.getUint8(3),
            session: session,
            data_lenght: dataView.getUint32(12),
            data: dataBytes
        };
        return decode;
    }

    // 处理64bit 需要拆分成两个32bit
    public static splitUint64ToUint32s(bigInt: bigint): { high32: number, low32: number } {
        // 使用位运算提取高32位和低32位  
        // 右移32位得到高32位，并与0xFFFFFFFF进行按位与操作以确保结果是32位无符号整数  
        const high32 = Number((bigInt >> BigInt(32)) & BigInt(0xFFFFFFFF));
        // 低32位可以直接与0xFFFFFFFF进行按位与操作  
        const low32 = Number(bigInt & BigInt(0xFFFFFFFF));
        return { high32, low32 };
    }
}
export class MessageParam {
    type: number | undefined;
    cmd: number | undefined;
    session_id?: number | undefined;
    session?: bigint | undefined;
    data_lenght?: number | undefined;
    data?: Uint8Array | undefined;
}