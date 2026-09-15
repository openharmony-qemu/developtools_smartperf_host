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
const fs = require('fs')
const winston = require('winston');
const path = require('path');
const AdmZip = require('adm-zip')
const { exit } = require('process');
const TypeManage = require('../typeManage.js');
const Version = require('../version.js');
const updateZipPath = path.join(__dirname, 'update.zip');
const GET_CMD = 1;
const UPDATE_CMD = 3;
const UPDATE_SUCCESS_CMD = 2; // 升级成功
const UPDATE_FAIL_CMD = 4; // 升级失败
let isUpdate = false;
let sessionIdMap = new Map();
// 创建logger
const logger = winston.createLogger(require('./../winston.config.js'));

function init() {
    const apps = require('../app');
    apps.pluginSystem.registerPlugin(TypeManage.TypeConfig.UPDATE_TYPE, process, singleDelete);
    clear();
}
function process(session_id, cmd, message) {
    // 获取扩展程序版本号
    if (cmd === GET_CMD) {
        // 返回扩展程序当前版本
        logger.info(`The current version is ${Version.version.version}`);
        sendMsg(session_id, GET_CMD, Version.version.version)
        // 升级版本
    } else if (cmd === UPDATE_CMD) {
        // 设置标记位
        if (!isUpdate) {
            isUpdate = true;
            update(session_id, message)// 升级完退出服务 
        }
        // 缓存多个session同时升级的场景
        if (!sessionIdMap.has(session_id)) {
            sessionIdMap.set(session_id, session_id);
        }
    }
}

/**
 * 解压新包
 * 替换、新增
 */
function update(session_id, data) {
    // 将文件写入update/update.zip
    fs.writeFile(updateZipPath, data, (err) => {
        if (err) {
            logger.error(`File write failed:${err}`);
            isUpdate = false;
            publishStatus(UPDATE_FAIL_CMD);
            sendMsg(session_id, UPDATE_FAIL_CMD, '');
            return;
        }
        try {
            // 获取项目根目录
            let rootDir = findProjectRoot(session_id, path.dirname(__dirname));
            let zip = new AdmZip(updateZipPath);
            zip.extractAllTo(rootDir, true);
            // 删除临时文件
            fs.unlinkSync(updateZipPath);
            publishStatus(UPDATE_SUCCESS_CMD);
            sendMsg(session_id, UPDATE_SUCCESS_CMD, '');
            // 正常退出进程
            exit(0);
        } catch (err) {
            // 删除临时文件
            fs.unlinkSync(updateZipPath);
            isUpdate = false;
            publishStatus(UPDATE_FAIL_CMD);
            sendMsg(session_id, UPDATE_FAIL_CMD, '')
            logger.error(err);
        }
    })
}

// 定位根目录
function findProjectRoot(session_id, startDir) {
    let currentDir = startDir;
    while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
        let parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            isUpdate = false;
            publishStatus(UPDATE_FAIL_CMD);
            sendMsg(session_id, UPDATE_FAIL_CMD, '')
            logger.error('err: Reached root directory but package. json not found');
        }
        currentDir = parentDir;
    }
    return currentDir;
}

// 同时打开多个页面均可感知升级状态
function publishStatus(cmd) {
    for (const session_id of sessionIdMap.values()) {
        sendMsg(session_id, cmd, '');
    }
    clear();
}

// 删除sessionId对应的键值对
function singleDelete(session_id) {
    sessionIdMap.delete(session_id);
}

// 每次当扩展程序初始化时，清空Map对象
function clear() {
    sessionIdMap.clear();
}

// 将信息send至服务器
function sendMsg(session_id, cmd, data) {
    const app = require('../app');
    app.sendMsgToClient(TypeManage.TypeConfig.UPDATE_TYPE, session_id, cmd, new TextEncoder().encode(data));
}
module.exports = {
    init
}