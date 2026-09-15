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
class AuthMsg {
    static LOGIN_CMD = 1; //登录
    static LOGIN_SUCCESS_CMD = 2; //登录成功标识
    static LOGIN_FAIL_CMD = 3; //登录失败标识
    static MESSAGE_BYTE = 20; //socket头部一共20个字节
    static TYPT_BYTE = 1; //type占字节
    static CMD_BYTE = 2; //cmd占字节
    static SESSION_ID_BYTE = 1; //sessionId占字节
    static SESSION_TBYTE = 4; //session占字节
    static SW_PORT = 19099; //websockets端口
    static SESSION_LIMIT = 256; //最大并发数（最多可同时申请256个session）
}

class Utils {
    //模块传进来的数据
    static encode(message) {
        let splitUint64 = message.session ? Utils.splitUint64ToUint32s(BigInt(message.session)) : { high32: 0, low32: 0 };// 需处理64bit(session)
        let totalByteLength = AuthMsg.MESSAGE_BYTE + (message.dataLength ? message.dataLength : 0);
        let combinedBuffer = new ArrayBuffer(totalByteLength);// 一个更大的ArrayBuffer，合并前20个字节和data
        let headBuffer = new ArrayBuffer(AuthMsg.MESSAGE_BYTE);
        let dataView = new DataView(headBuffer);
        let index = 0;
        dataView.setUint8(index, message.type);
        index += AuthMsg.TYPT_BYTE;
        dataView.setUint16(index, message.cmd ? message.cmd : 0);
        index += AuthMsg.CMD_BYTE;
        dataView.setUint8(index, message.session_id ? message.session_id : 0);
        index += AuthMsg.SESSION_ID_BYTE;
        dataView.setUint32(index, splitUint64?.high32);
        index += AuthMsg.SESSION_TBYTE;
        dataView.setUint32(index, splitUint64?.low32);
        index += AuthMsg.SESSION_TBYTE;
        dataView.setUint32(index, message.dataLength ? message.dataLength : 0);
        // 处理合并message.data
        let existingArray = new Uint8Array(headBuffer); // 将处理好的前20个字节 
        let combinedArray = new Uint8Array(combinedBuffer);
        // 分别将前20个字节和data对应的字节流set至combinedBuffer
        combinedArray.set(existingArray, 0);
        combinedArray.set(message.data ? message.data : new Uint8Array(0), headBuffer.byteLength);
        return combinedBuffer;
    }

    // onmessage接收到的数据解码
    static decode(message) {
        let decode;
        let dataView = new DataView(message);
        let sessionHigh = dataView.getUint32(4);
        let sessionLow = dataView.getUint32(8);
        // 将两个 32 位部分组合成一个 64 位的 BigInt  
        let session = BigInt(sessionHigh) << BigInt(32) | BigInt(sessionLow);
        // 先将data所需的字节截取出来
        let dataBytes = new Uint8Array(message, AuthMsg.MESSAGE_BYTE, message.byteLength - AuthMsg.MESSAGE_BYTE);
        // 解码 session 的两个 32 位部分  
        decode = {
            type: dataView.getUint8(0),
            cmd: dataView.getUint16(1),
            session_id: dataView.getUint8(3),
            session: session,
            dataLength: dataView.getUint32(12),
            data: dataBytes
        }
        return decode;
    }

    // 处理64bit 需要拆分成两个32bit
    static splitUint64ToUint32s(bigInt) {
        // 使用位运算提取高32位和低32位  
        // 右移32位得到高32位，并与0xFFFFFFFF进行按位与操作以确保结果是32位无符号整数  
        const high32 = Number((bigInt >> BigInt(32)) & BigInt(0xFFFFFFFF));
        // 低32位可以直接与0xFFFFFFFF进行按位与操作  
        const low32 = Number(bigInt & BigInt(0xFFFFFFFF));
        return { high32, low32 };
    }
}
module.exports = {
    Utils,
    AuthMsg
};