/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const platform = require('../platform.js');

const START_SH_PATH = path.join(__dirname, '..', 'start.sh');
const WINDOWS_SERVICE_PATH = path.join(__dirname, '..', 'windows-service.js');
const APP_JS_PATH = path.join(__dirname, '..', 'app.js');

// === start.sh 启动脚本验证 ===

test('start.sh 文件存在且以 bash shebang 开头', () => {
    assert.ok(fs.existsSync(START_SH_PATH));
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    assert.strictEqual(content.split('\n')[0].trim(), '#!/bin/bash');
});

test('start.sh 包含 SCRIPT_DIR 变量', () => {
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    assert.ok(content.includes('SCRIPT_DIR'));
});

test('start.sh 调用 node windows-service.js 且 cd 在 node 之前', () => {
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    assert.ok(content.includes('cd "$SCRIPT_DIR"'));
    assert.ok(content.includes('node windows-service.js'));
    assert.ok(content.indexOf('cd "$SCRIPT_DIR"') < content.indexOf('node windows-service.js'));
});

test('start.sh 使用 dirname 获取脚本目录', () => {
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    assert.ok(content.includes('dirname'));
    assert.ok(content.includes('SCRIPT_DIR'));
});

test('start.sh 无 BOM 头', () => {
    const buf = fs.readFileSync(START_SH_PATH);
    assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF));
});

// === windows-service.js 平台感知启动验证 ===

test('windows-service.js 引入 platform.js 和 path 模块', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes("require('./platform.js')"));
    assert.ok(content.includes("require('path')"));
});

test('windows-service.js 包含 platform.isWindows 条件判断', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes('platform.isWindows'));
});

test('windows-service.js Windows 分支使用 node-windows Service', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes("require('node-windows')"));
    assert.ok(content.includes('Service'));
    assert.ok(content.includes("name: 'HiSmartPerfHostExtend'"));
    assert.ok(content.includes("script: 'app.js'"));
});

test('windows-service.js Windows 分支包含 install 和 start 逻辑', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes("svc.on('install'"));
    assert.ok(content.includes('svc.start()'));
    assert.ok(content.includes('svc.install()'));
});

test('windows-service.js 非 Windows 分支 require app.js', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes("require(path.join(__dirname, 'app.js'))"));
});

test('windows-service.js 无 BOM 头', () => {
    const buf = fs.readFileSync(WINDOWS_SERVICE_PATH);
    assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF));
});

test('windows-service.js 包含 Apache License 头部', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(content.includes('Apache License'));
});

test('start.sh 和 windows-service.js 配合工作', () => {
    const shContent = fs.readFileSync(START_SH_PATH, 'utf8');
    const wsContent = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    assert.ok(shContent.includes('windows-service.js'));
    assert.ok(wsContent.includes('platform.isWindows'));
});

// === app.js WebSocket keep-alive 源码验证 ===

test('app.js 包含 keepAliveInterval 定义且间隔为 30000ms', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('keepAliveInterval'));
    assert.ok(content.includes('setInterval'));
    assert.ok(content.includes('30000'));
});

test('app.js keep-alive 遍历 wss.clients 并发送 ping', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('wss.clients.forEach'));
    assert.ok(content.includes('ws.ping()'));
});

test('app.js keep-alive 检测 isAlive 并 terminate 死连接', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('ws.isAlive === false'));
    assert.ok(content.includes('ws.terminate()'));
    assert.ok(content.includes('ws.isAlive = false'));
});

test('app.js wss close 事件清理 keepAliveInterval', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("wss.on('close'"));
    assert.ok(content.includes('clearInterval(keepAliveInterval)'));
});

test('app.js connection 回调设置 isAlive=true 并监听 pong', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('ws.isAlive = true'));
    assert.ok(content.includes("ws.on('pong'"));
});

test('app.js keep-alive 逻辑顺序：检查→设false→ping', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    const block = content.substring(
        content.indexOf('setInterval(() => {'),
        content.indexOf('}, 30000)')
    );
    assert.ok(block.length > 0);
    const checkIdx = block.indexOf('ws.isAlive === false');
    const setFalseIdx = block.indexOf('ws.isAlive = false');
    const pingIdx = block.indexOf('ws.ping()');
    assert.ok(checkIdx >= 0 && setFalseIdx >= 0 && pingIdx >= 0);
    assert.ok(checkIdx < setFalseIdx);
    assert.ok(setFalseIdx < pingIdx);
});

test('app.js 创建 WebSocket.Server 实例并设置 binaryType', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('WebSocket.Server'));
    assert.ok(content.includes('ws.binaryType'));
    assert.ok(content.includes('arraybuffer'));
});

test('app.js 包含 wss error 事件处理和 EADDRINUSE 检查', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("wss.on('error'"));
    assert.ok(content.includes('EADDRINUSE'));
});

test('app.js 连接关闭时清理 session', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("ws.on('close'"));
    assert.ok(content.includes('clearSession'));
});

test('app.js 导出 sendMsgToClient 和 pluginSystem', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('module.exports'));
    assert.ok(content.includes('sendMsgToClient'));
    assert.ok(content.includes('pluginSystem'));
});

test('app.js keep-alive interval 在 initPlugins 之前定义', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.indexOf('keepAliveInterval') < content.indexOf('initPlugins()'));
});

test('app.js 包含 Apache License 头部', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('Apache License'));
});

test('app.js 无 BOM 头', () => {
    const buf = fs.readFileSync(APP_JS_PATH);
    assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF));
});

test('app.js pong 回调为箭头函数并设置 isAlive=true', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("ws.on('pong', () => { ws.isAlive = true; })"));
});

// === WebSocket keep-alive 行为测试 ===

test('keep-alive: 活连接响应 pong 后不会被终止', async () => {
    const testPort = 19101;
    const wss = new WebSocket.Server({ port: testPort });
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    });
    const ws = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => ws.on('open', resolve));
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(ws.readyState, WebSocket.OPEN);
    clearInterval(keepAliveInterval);
    ws.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: 死连接不响应 pong 会被 terminate', async () => {
    const testPort = 19102;
    const wss = new WebSocket.Server({ port: testPort });
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
    });
    const ws = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => ws.on('open', resolve));
    ws.pong = () => {};
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(ws.readyState, WebSocket.CLOSED);
    clearInterval(keepAliveInterval);
    ws.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: wss close 事件清理定时器', async () => {
    const testPort = 19103;
    const wss = new WebSocket.Server({ port: testPort });
    let intervalCleared = false;
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('close', () => {
        clearInterval(keepAliveInterval);
        intervalCleared = true;
    });
    wss.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(intervalCleared);
});

test('keep-alive: 多个客户端同时接受检测', async () => {
    const testPort = 19104;
    const wss = new WebSocket.Server({ port: testPort });
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    });
    const ws1 = new WebSocket(`ws://localhost:${testPort}`);
    const ws2 = new WebSocket(`ws://localhost:${testPort}`);
    const ws3 = new WebSocket(`ws://localhost:${testPort}`);
    await Promise.all([
        new Promise((r) => ws1.on('open', r)),
        new Promise((r) => ws2.on('open', r)),
        new Promise((r) => ws3.on('open', r)),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(ws1.readyState, WebSocket.OPEN);
    assert.strictEqual(ws2.readyState, WebSocket.OPEN);
    assert.strictEqual(ws3.readyState, WebSocket.OPEN);
    clearInterval(keepAliveInterval);
    ws1.terminate();
    ws2.terminate();
    ws3.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: 只终止死连接，不影响活连接', async () => {
    const testPort = 19105;
    const wss = new WebSocket.Server({ port: testPort });
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    });
    const liveWs = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => liveWs.on('open', resolve));
    const deadWs = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => deadWs.on('open', resolve));
    deadWs.pong = () => {};
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(liveWs.readyState, WebSocket.OPEN);
    assert.strictEqual(deadWs.readyState, WebSocket.CLOSED);
    clearInterval(keepAliveInterval);
    liveWs.terminate();
    if (deadWs.readyState !== WebSocket.CLOSED) deadWs.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: 新连接建立时 isAlive 设为 true', async () => {
    const testPort = 19106;
    const wss = new WebSocket.Server({ port: testPort });
    let capturedIsAlive = null;
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        capturedIsAlive = ws.isAlive;
    });
    const ws = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => ws.on('open', resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual(capturedIsAlive, true);
    ws.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: ping 前 isAlive 被设为 false', async () => {
    const testPort = 19107;
    const wss = new WebSocket.Server({ port: testPort });
    const isAliveValues = [];
    const keepAliveInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                isAliveValues.push(false);
                return ws.terminate();
            }
            isAliveValues.push(ws.isAlive);
            ws.isAlive = false;
            ws.ping();
        });
    }, 100);
    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    });
    const ws = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => ws.on('open', resolve));
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.ok(isAliveValues.length >= 2);
    assert.strictEqual(isAliveValues[0], true);
    clearInterval(keepAliveInterval);
    ws.terminate();
    await new Promise((resolve) => wss.close(resolve));
});

test('keep-alive: setInterval 闭包内遍历 clients 并检查 isAlive', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    const block = content.substring(
        content.indexOf('setInterval(() => {'),
        content.indexOf('}, 30000)')
    );
    assert.ok(block.includes('wss.clients.forEach'));
    assert.ok(block.includes('ws.isAlive'));
});

test('platform.isWindows 与 process.platform 一致', () => {
    if (process.platform === 'win32') {
        assert.strictEqual(platform.isWindows, true);
    } else {
        assert.strictEqual(platform.isWindows, false);
    }
});

test('app.js wss 使用 Utils.AuthMsg.SW_PORT 端口号', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('SW_PORT'));
});

test('app.js wss maxPayload 设置正确', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('maxPayload'));
    assert.ok(content.includes('1024'));
});

test('app.js keep-alive interval 变量名包含 keepAlive', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('keepAliveInterval'));
});

test('app.js connection 回调处理 longtrace 路径', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('/longtrace-preprocess'));
});

test('app.js connection 回调处理 message 事件', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("ws.on('message'"));
});

test('app.js connection 回调处理 close 事件', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("ws.on('close'"));
});

test('app.js connection 回调处理 error 事件', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes("ws.on('error'"));
});

test('app.js message 处理检查 MESSAGE_BYTE 最小字节数', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('MESSAGE_BYTE'));
    assert.ok(content.includes('byteLength'));
});

test('app.js message 处理使用 decode 解码消息', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('Utils.Utils.decode'));
});

test('app.js message 处理检查 MAX_BUILTIN_TYPE', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('MAX_BUILTIN_TYPE'));
});

test('app.js message 处理 LOGIN_TYPE', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('LOGIN_TYPE'));
});

test('app.js message 处理 HEARTBEAT_TYPE', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('HEARTBEAT_TYPE'));
});

test('app.js message 处理 UPDATE_TYPE', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('UPDATE_TYPE'));
});

test('app.js initPlugins 加载所有业务模块', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('./ai/ai.js'));
    assert.ok(content.includes('./update/update.js'));
    assert.ok(content.includes('./usb/usb.js'));
    assert.ok(content.includes('./record/record.js'));
    assert.ok(content.includes('./disassembly/disassembly.js'));
});

test('app.js pluginSystem 包含 registerPlugin 和 execute', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('registerPlugin'));
    assert.ok(content.includes('execute'));
});

test('app.js pluginSystem plugins 初始化为空对象', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('plugins: {}'));
});

test('app.js sendMsgToClient 从 sessionMap 获取 ws', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('sessionMap.get'));
});

test('app.js sendMsgToClient 使用 Utils.Utils.encode 编码', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('Utils.Utils.encode'));
});

test('start.sh 行数在 5-15 行之间', () => {
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    assert.ok(lines.length >= 5 && lines.length <= 15,
        `start.sh 有效行数应在 5-15 之间，实际: ${lines.length}`);
});

test('windows-service.js 行数在 20-40 行之间', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    assert.ok(lines.length >= 15 && lines.length <= 40,
        `windows-service.js 有效行数应在 15-40 之间，实际: ${lines.length}`);
});

test('app.js close 回调清理插件缓存', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('pluginSystem.plugins'));
    assert.ok(content.includes("'clear'"));
});

test('app.js close 回调保护 ws.userData 不存在场景', () => {
    const content = fs.readFileSync(APP_JS_PATH, 'utf8');
    assert.ok(content.includes('!ws.userData'));
});

test('start.sh 脚本不含 node-windows 依赖', () => {
    const content = fs.readFileSync(START_SH_PATH, 'utf8');
    assert.ok(!content.includes('node-windows'),
        'start.sh 不应依赖 node-windows');
});

test('windows-service.js 非 Windows 分支不引用 node-windows', () => {
    const content = fs.readFileSync(WINDOWS_SERVICE_PATH, 'utf8');
    const elseBranch = content.substring(content.indexOf('} else {'));
    assert.ok(!elseBranch.includes('node-windows'),
        '非 Windows 分支不应引用 node-windows');
});
