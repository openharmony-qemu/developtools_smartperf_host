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
global.navigator = {
    userAgent: 'node.js'
};
const { exec } = require('child_process');
const fs = require('fs');
const TypeManage = require('../typeManage.js');
const winston = require('winston');
const SN_CMD = 1;
const GET_PROCESS = 2;
const GET_CPU_COUNT_CMD = 3;
const GET_EVENT_CMD = 4;
const GET_APP_CMD = 5;
const GET_VERSION = 6;
const GET_HISY_CMD = 7;
// 创建logger
const logger = winston.createLogger(require('./../winston.config.js'));
const hisyseventPath = `//data/system/hiview/unzip_configs/sys_event_def/hisysevent.def`;

// 注册
function init() {
    const apps = require('../app');
    logger.info(`type:${TypeManage.TypeConfig.USB_TYPE}`);
    apps.pluginSystem.registerPlugin(TypeManage.TypeConfig.USB_TYPE, process);
}

function process(sessionId, cmd, data) {
    switch (cmd) {
        case SN_CMD:
            logger.info(`to get SN.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            sendSerialNumb(sessionId, cmd);
            break;
        case GET_PROCESS:
            logger.info(`to get process.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getProcess(sessionId, data, cmd);
            break;
        case GET_CPU_COUNT_CMD:
            logger.info(`to get CPU count.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getCpuCunt(sessionId, data, cmd);
            break;
        case GET_EVENT_CMD:
            logger.info(`to get eventName.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getEvent(sessionId, data, cmd);
            break;
        case GET_APP_CMD:
            logger.info(`to get APP name.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getApp(sessionId, data, cmd);
            break;
        case GET_VERSION:
            logger.info(`to get device version.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getVersion(sessionId, data, cmd);
            break;
        case GET_HISY_CMD:
            logger.info(`to get hisystem event.type:${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            getHisystem(sessionId, data, cmd);
            break;
    }
}

// 获取SN号
function sendSerialNumb(sessionId, cmd) {
    exec('hdc list targets', (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed to obtain SN.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        let serialNumArr = stdout.split('\r\n');
        serialNumArr = serialNumArr.slice(0, serialNumArr.length - 1);
        if (stdout) {
            let message = {
                code: 0,
                message: serialNumArr
            }
            sendMsg(sessionId, SN_CMD, message);
        }
    });
}

// 获取进程信息
function getProcess(sessionId, data, cmd) {
    const decoder = new TextDecoder();
    let sendSerialNum = decoder.decode(data).trim();
    console.log(sendSerialNum);
    // 查询进程信息
    exec(`hdc -t ${sendSerialNum} shell ps -A -opid,cmd`, (p_error, pStdout, p_stderr) => {
        if (p_error || (p_stderr && p_stderr.length > 0)) {
            logger.error(`Failed to retrieve process.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        let message = {
            code: 0,
            message: pStdout
        };
        sendMsg(sessionId, GET_PROCESS, message);
    });
}

// 将信息send至客户端
function sendMsg(sessionId, cmd, message) {
    const app = require('../app');
    let jsonString = JSON.stringify({
        resultCode: message.code,
        resultMessage: message.message
    });
    app.sendMsgToClient(TypeManage.TypeConfig.USB_TYPE, sessionId, cmd, new TextEncoder().encode(jsonString));
}

// 获取指定设备的CPU数
function getCpuCunt(sessionId, data, cmd) {
    const decoder = new TextDecoder();
    let sendSerialNum = decoder.decode(data).trim();
    console.log(`hdc -t ${sendSerialNum} shell grep -c 'processor' /proc/cpuinfo`)
    exec(`hdc -t ${sendSerialNum} shell grep -c 'processor' /proc/cpuinfo`, (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed to retrieve CpuCount.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        let message = {
            code: 0,
            message: stdout
        };
        sendMsg(sessionId, GET_CPU_COUNT_CMD, message);
    });
}

// 获取指定设备中关于hiperf的事件列表
function getEvent(sessionId, data, cmd) {
    const decoder = new TextDecoder();
    let sendSerialNum = decoder.decode(data).trim();
    exec(`hdc -t ${sendSerialNum} shell hiperf list`, (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed to retrieve Event.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        let message = {
            code: 0,
            message: stdout
        };
        sendMsg(sessionId, GET_EVENT_CMD, message);
    });
}

function getApp(sessionId, data, cmd) {
    const decoder = new TextDecoder();
    let sendSerialNum = decoder.decode(data).trim();
    exec(`hdc -t ${sendSerialNum} shell bm dump -a`, (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed to obtain app.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        let message = {
            code: 0,
            message: stdout
        };
        sendMsg(sessionId, GET_APP_CMD, message);
    });
}

// 获取设备版本号
function getVersion(sessionId, data, cmd) {
    const decoder = new TextDecoder();
    let sendSerialNum = decoder.decode(data).trim();
    exec(`hdc -t ${sendSerialNum} shell param get const.product.software.version`, (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed to obtain device version.${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        };
        console.log(stdout);
        let message = {
            code: 0,
            message: stdout
        };
        sendMsg(sessionId, GET_VERSION, message);
    });
}

function getHisystem(sessionId, data) {
    const filePath = 'c:\\hisysevent.def';
    exec(`hdc file recv -cwd c:\ ${hisyseventPath} ./`, (error, stdout, stderr) => {
        if (error || (stderr && stderr.length > 0)) {
            logger.error(`Failed : ${TypeManage.TypeConfig.USB_TYPE},sessionId:${sessionId},cmd:${cmd}`);
            return;
        }
        fs.readFile(filePath, 'utf8', (readError, fileContent) => {
            if (readError) {
                logger.error(`读取文件失败: ${readError.message}`);
                const errorMessage = {
                    code: 1,
                    message: readError.message
                };
                sendMsg(sessionId, GET_HISY_CMD, errorMessage);
                return;
            }
            const message = {
                code: 0,
                message: fileContent
            };
            sendMsg(sessionId, GET_HISY_CMD, message);
        });
    });
}

module.exports = {
    init
};