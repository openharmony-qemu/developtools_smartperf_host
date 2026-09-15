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
const fs = require('fs');
const winston = require('winston');
const path = require('path');
const { exec } = require('child_process');
const iconv = require("iconv-lite");
const TypeManage = require('../typeManage.js');
const SAVE_CMD = 1;
const DIAGNOSIS_CMD = 3;
const SAVE_BACK_CMD = 2;
const DIAGNOSIS_BACK_CMD = 4;
// 创建logger
const logger = winston.createLogger(require('./../winston.config.js'));

// 注册
function init() {
    const apps = require('../app');
    apps.pluginSystem.registerPlugin(TypeManage.TypeConfig.AI_TYPE, process, clear);
    deleteDirPath();
}

/**
 * 写入DB
 * 诊断
 */
function process(session_id, cmd, data) {
    let filePath = path.join(__dirname, 'db_cache', `${session_id}.db`);// 拼接路径
    let dirPath = path.dirname(filePath);// 获取db文件所在的目录
    if (cmd === SAVE_CMD) {
        logger.info(`Preparing to write to DB,sessionId:${session_id},cmd:${SAVE_CMD}`)
        save(dirPath, filePath, session_id, data);
    } else if (cmd === DIAGNOSIS_CMD) {
        logger.info(`Obtain diagnostic report results,sessionId:${session_id},cmd:${DIAGNOSIS_CMD}`)
        diagnosis(dirPath, filePath, session_id, data);
    }
}

/**
 * 准备写入DB文件
 * 检查db_cache对应的目录是否存在，不存在时创建目录，反之直接写入DB
 * 写入DB文件
 */
function save(dirPath, filePath, session_id, data) {
    let message = { code: -1, message: '' };
    fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
            logger.error(`Directory creation failed:${err},sessionId:${session_id},cmd:${SAVE_CMD}`);
            return;
        }
        let dataBuffer = Buffer.from(data);
        fs.writeFile(filePath, dataBuffer, (err) => {
            if (err) {
                message.code = 1;
                message.message = 'File write failed';
                logger.error(`File write failed,sessionId:${session_id},cmd:${SAVE_CMD}`);
            } else {
                message.code = 0;
                message.message = 'File written successfully';
                logger.info(`File written successfully,sessionId:${session_id},cmd:${SAVE_CMD}`);
            }
            sendMsg(session_id, SAVE_BACK_CMD, message);
        });
    });
}

/**
 * 诊断
 * 检查目录是否存在,判断是否继续诊断
 * 检查对应的DB文件是否存在
 * 调用算法库
 * 获取诊断结果 
 */
function diagnosis(dirPath, filePath, session_id, data) {
    let message = { code: -1, message: '' };
    fs.access(dirPath, fs.constants.F_OK, (errDir) => {
        if (errDir) {
            message.code = 1;
            message.message = 'DB file not imported';
            logger.error(`DB file not imported,unable to find DB folder,sessionId:${session_id},cmd:${DIAGNOSIS_CMD}`);
            sendMsg(session_id, DIAGNOSIS_BACK_CMD, message);
            return;
        }
        fs.access(filePath, fs.constants.F_OK, (errFile) => {
            if (errFile) {
                message.code = 1;
                message.message = 'DB file not imported';
                logger.error(`DB file not imported,unable to find DB file,sessionId:${session_id},cmd:${DIAGNOSIS_CMD}`);
                sendMsg(session_id, DIAGNOSIS_BACK_CMD, message);
                return;
            }
            if (!data) {
                message.code = 1;
                message.message = 'Time range not provided';
                logger.error(`Time range not provided,sessionId:${session_id},cmd:${DIAGNOSIS_CMD}`);
                sendMsg(session_id, DIAGNOSIS_BACK_CMD, message);
                return; 
            }
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(data);
            let timeRange = JSON.parse(jsonString);
            const str = hasKeys(timeRange) ? ` --time_range "${timeRange.startTime},${timeRange.endTime}"` : '';
            // 文件存在时，调用算法库，获取诊断结果
            const mainExePath = path.join(__dirname, '..', 'bin', 'main.exe');
            let command = `"${mainExePath.replace(/\\/g, "/")}" --db_path "${filePath.replace(/\\/g, "/")}"${str}`;
            exec(command, {encoding: 'buffer',maxBuffer: 1024 * 1024 * 500}, (error, stdout, stderr) => {
                if (error || (stderr && stderr.length > 0)) {
                    message.code = 1;
                    message.message = `error: ${error ? error.message : stderr.toString()}`;
                    logger.error(`error: ${error ? error.message : stderr.toString()},sessionId:${session_id},cmd:${DIAGNOSIS_CMD},command:${command}`);
                    sendMsg(session_id, DIAGNOSIS_BACK_CMD, message);
                    return;
                }
                message.code = 0;
                message.message = iconv.decode(stdout, 'gbk');// 字节流解码成字符串
                logger.info(`Successfully obtained diagnostic results,sessionId:${session_id}`)
                sendMsg(session_id, DIAGNOSIS_BACK_CMD, message);
            })
        });
    });
}

// 诊断时判断data中是否包含时间范围，以及时间范围是否为空
function hasKeys(obj) {
    // 判断是否含有startTime和endTime
    if (obj.hasOwnProperty('startTime') && obj.hasOwnProperty('endTime')) {
        const startTimeNotEmpty = obj.startTime !== '' && obj.startTime != null;
        const endTimeNotEmpty = obj.endTime !== '' && obj.endTime != null;
        // 判断两个值是否都不为空
        return startTimeNotEmpty && endTimeNotEmpty;
    }
    return false;
}

// 将信息send至服务器
function sendMsg(session_id, cmd, message) {
    const app = require('../app');
    let jsonString = JSON.stringify({
        resultCode: message.code,
        resultMessage: message.message
    });
    app.sendMsgToClient(TypeManage.TypeConfig.AI_TYPE, session_id, cmd, new TextEncoder().encode(jsonString));
}

// 删除session对应的文件
function clear(session_id) {
    // 拼接路径
    let filePath = path.join(__dirname, 'db_cache', `${session_id}.db`);
    // 先判断文件路径是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        // 不存在直接return
        if (err) {
            logger.error(`${err},sessionId:${session_id}`);
            return;
        }
        // 存在则继续删除
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.error(`File deletion failed:${err},sessionId:${session_id}`);
            }
        });
    })
}
function deleteDirPath() {
    let dirPath = path.join(__dirname, 'db_cache');
    fs.rm(dirPath, { recursive: true, force: true }, (err) => {
        if (err) {
            logger.error(`Failed to delete folder cached db:${err},sessionId:${session_id}`);
        }
    })
}

module.exports = {
    init
}