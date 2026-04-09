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
const WebSocket = require('ws');
const winston = require('winston');
const SessionManage = require('./session.js');
const Utils = require('./Util.js');
const TypeManage = require('./typeManage.js');
// 创建logger
const logger = winston.createLogger(require('./winston.config.js'));
const wss = new WebSocket.Server({ port: `${Utils.AuthMsg.SW_PORT}`, maxPayload: 1024 * 1024 * 500 });
// 当发生错误时触发
wss.on('error', function error(err) {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${Utils.AuthMsg.SW_PORT} is occupied`);
    }
    logger.error(`Connection error:${err}`);
});
// 当有新客户端连接时触发
wss.on('connection', function connection(ws, req) {
    // longtrace 预处理链路通过 URL 路径分流到独立的业务处理器。
    if (req && typeof req.url === 'string' && req.url.startsWith('/longtrace-preprocess')) {
        const TRACE_ADAPTER = require('./trace_adapter/traceAdapter.js');
        TRACE_ADAPTER.handleLongTraceConnection(ws);
        return;
    }
    // WebSocket的一个属性，用于控制 WebSocket 连接如何处理接收到的二进制数据;
    ws.binaryType = 'arraybuffer';
    // 接收来自客户端的消息
    ws.on('message', function incoming(message) {
        // 判断头部字节数
        if (new Uint8Array(message).byteLength < Utils.AuthMsg.MESSAGE_BYTE) {
            return;
        };
        let decoderMessage;
        try {
            decoderMessage = Utils.Utils.decode(message);
        } catch (error) {
            logger.error(`Decode message failed:${error}`);
            return;
        }
        // type为0-7为内置，业务type从8开始
        if (decoderMessage.type > TypeManage.TypeConfig.MAX_BUILTIN_TYPE) {
            // 鉴权session和sessionId
            let isAuthSuccess = SessionManage.SessionJs.checkSession(decoderMessage.session_id, decoderMessage.session);
            if (!isAuthSuccess) {
                logger.error(`${decoderMessage.session_id} Authentication failed`);
                return;
            };
            logger.info(`type:${decoderMessage.type},sessionId:${decoderMessage.session_id},cmd:${decoderMessage.cmd}`);
            pluginSystem.execute(decoderMessage.type, 'process', decoderMessage.session_id, decoderMessage.cmd, decoderMessage.data);
        };
        // type为会话信息
        if (decoderMessage.type === TypeManage.TypeConfig.LOGIN_TYPE) {
            SessionManage.SessionJs.applySession(ws, decoderMessage);
            return;
        };
        // type为升级
        if (decoderMessage.type === TypeManage.TypeConfig.UPDATE_TYPE) {
            // 鉴权session和sessionId
            let isAuthSuccess = SessionManage.SessionJs.checkSession(decoderMessage.session_id, decoderMessage.session);
            if (!isAuthSuccess) {
                logger.error('Authentication failed');
                return;
            };
            pluginSystem.execute(decoderMessage.type, 'process', decoderMessage.session_id, decoderMessage.cmd, decoderMessage.data);
            return;
        }
        // type为心跳机制类型
        if (decoderMessage.type === TypeManage.TypeConfig.HEARTBEAT_TYPE) {
            ws.send(message);
            return;
        };
    });

    // 当连接关闭时触发---
    ws.on('close', function close() {
        // 当关闭服务时，判断是否有sessionId，做保护逻辑，之前发现在客户端连续刷新会出现找不到sessionId，会报错，因此在这里做保护
        if (!ws.userData) {
            return;
        }
        // 判断插件是否有清除缓存的clear方法
        if (Object.keys(pluginSystem.plugins).length > 0) {
            // 通知插件清理缓存
            for (const key in pluginSystem.plugins) {
                if (pluginSystem.plugins[key]['clear'] && typeof pluginSystem.plugins[key]['clear'] === 'function') {
                    pluginSystem.execute(key, 'clear', ws.userData.sessionId);
                }
            }

        };
        // session管理中清除对应的session
        SessionManage.SessionJs.clearSession(ws.userData.sessionId);
    });

    // 当发生错误时触发
    ws.on('error', function error(err) {
        logger.error(`Connection error:${err}`);
    });
})
// 业务侧调，用来往客户端发送消息
// type:Number;sessionId:Number;cmd:Number;data:Uint8Array
function sendMsgToClient(type, sessionId, cmd, data) {
    let ws = SessionManage.SessionJs.sessionMap.get(sessionId)[1];
    let sendMsg = {};
    sendMsg.type = type;
    sendMsg.cmd = cmd;
    sendMsg.session_id = sessionId;
    sendMsg.session = SessionManage.SessionJs.sessionMap.get(sessionId)[0];
    sendMsg.data_lenght = data.byteLength;
    sendMsg.data = data;
    ws.send(Utils.Utils.encode(sendMsg));
}

// 模块初始化引入
// 各个业务模块在这里初始化，注册函数
function initPlugins() {
    const AI = require('./ai/ai.js');
    const UPDATE = require('./update/update.js');
    const USB = require('./usb/usb.js');
    const RECORD = require('./record/record.js');
    const DISASSEMBLY = require('./disassembly/disassembly.js');
    const TRACE_ADAPTER = require('./trace_adapter/traceAdapter.js');
    // 加载AI_Plugins插件的init
    AI.init();
    UPDATE.init();
    USB.init();
    RECORD.init();
    DISASSEMBLY.init();
    TRACE_ADAPTER.init();
}

// 函数注册和调用
const pluginSystem = {
    plugins: {},
    // 注册
    registerPlugin(pluginType, pluginProcess, pluginClear) {
        const pluginsObj = {
            'process': pluginProcess,
            'clear': pluginClear
        }
        this.plugins[pluginType] = pluginsObj;
    },
    // 调用
    execute(pluginType, functionName, ...args) {
        const plugin = this.plugins[pluginType];
        if (plugin && typeof plugin[functionName] === 'function') {
            plugin[functionName](...args);
        }
    }
};
module.exports = {
    sendMsgToClient,
    pluginSystem
}

initPlugins();