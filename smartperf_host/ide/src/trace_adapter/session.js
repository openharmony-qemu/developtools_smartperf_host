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
const Utils = require('./Util.js');
const winston = require('winston');
const TypeManage = require('./typeManage.js');
// 创建logger
const logger = winston.createLogger(require('./winston.config.js'));
class SessionJs {
    static sessionMap = getSessionMap();
    static applySession = function (ws, decoderMessage) {
        // 防止连续申请session
        if (ws.userData && ws.userData.sessionId) {
            logger.warn('Please do not apply for the session again');
            return;
        };
        let sendSessionMsg = {};
        if (decoderMessage.cmd === Utils.AuthMsg.LOGIN_CMD) {
            ws.userData = {};
            for (let key of SessionJs.sessionMap.keys()) {
                if (SessionJs.sessionMap.get(key) === null) {
                    // 将sessionId保存在对应ws的userData对象中，在关闭会话的时候要用
                    ws.userData = {
                        sessionId: key
                    }
                    SessionJs.sessionMap.set(key, [Math.floor(Math.random() * 90000000) + 10000000, ws]);
                    break;
                }
            };
            sendSessionMsg.type = TypeManage.TypeConfig.LOGIN_TYPE;
            sendSessionMsg.cmd = ws.userData.sessionId ? Utils.AuthMsg.LOGIN_SUCCESS_CMD : Utils.AuthMsg.LOGIN_FAIL_CMD;
            sendSessionMsg.session_id = ws.userData.sessionId ? ws.userData.sessionId : '';
            sendSessionMsg.session = ws.userData.sessionId ? SessionJs.sessionMap.get(ws.userData.sessionId)[0] : '';
            sendSessionMsg.data_lenght = 0;
        };
        if(ws.userData.sessionId){
            logger.info(`Successfully applied for session,sessionId:${ws.userData.sessionId}`);
        }else{
            logger.error('The current session is full, session request failed');
        }
        ws.send(Utils.Utils.encode(sendSessionMsg));
    };

    /**
     * 校验客户端传入的会话标识与会话凭据是否匹配。
     * @param {number|string} sessionId - 客户端传入的会话标识。
     * @param {bigint|number|string} session - 客户端传入的会话凭据。
     * @returns {boolean} 若匹配成功则返回 true，否则返回 false。
     */
    static checkSession(sessionId, session) {
        if (!SessionJs.sessionMap.has(sessionId)) {
            return false;
        }
        const sessionPair = SessionJs.sessionMap.get(sessionId);
        if (!Array.isArray(sessionPair) || sessionPair.length < 1) {
            return false;
        }
        if (session === undefined || session === null) {
            return false;
        }
        const sessionNumber = Number(session.toString());
        if (!Number.isFinite(sessionNumber)) {
            return false;
        }
        return sessionPair[0] === sessionNumber;
    };
    static clearSession(session_id) {
        SessionJs.sessionMap.set(session_id, null);
        logger.warn(`Session cleared,sessionId:${session_id}`);
    };
};

function getSessionMap(){
    const getSessionMap = new Map();
        for (let index = 1; index <= Utils.AuthMsg.SESSION_LIMIT; index++) {
            getSessionMap.set(index,null);
        }
        return getSessionMap;
}


module.exports = {
    SessionJs
};
