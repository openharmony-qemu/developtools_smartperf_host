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
const platform = require('../platform.js');

const DISASSEMBLY_PATH = path.join(__dirname, '..', 'disassembly', 'disassembly.js');
const USB_PATH = path.join(__dirname, '..', 'usb', 'usb.js');

// === disassembly.js 工具路径适配验证 ===

test('disassembly.js 引入 platform.js', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes("require('../platform.js')"));
});

test('disassembly.js 使用 platform.objdumpPath', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes('const objdumpPath = platform.objdumpPath'));
});

test('disassembly.js 使用 platform.addr2linePath', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes('const addr2linePath = platform.addr2linePath'));
});

test('disassembly.js 使用 platform.searchCmd', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes('${platform.searchCmd}'));
});

test('disassembly.js 不再硬编码 objdump.exe', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(!content.includes("'objdump.exe'"));
    assert.ok(!content.includes('"objdump.exe"'));
});

test('disassembly.js 不再硬编码 addr2line.exe', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(!content.includes("'addr2line.exe'"));
    assert.ok(!content.includes('"addr2line.exe"'));
});

test('disassembly.js 不再硬编码 findstr', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const codeLines = content.split('\n').filter(l => {
        const t = l.trim();
        return t && !t.startsWith('//') && !t.startsWith('*');
    });
    for (const line of codeLines) {
        assert.ok(!line.includes("'findstr'") && !line.includes('"findstr"'),
            `不应硬编码 findstr: ${line.trim()}`);
    }
});

test('disassembly.js exec 调用使用 ${objdumpPath} 模板变量', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const execLines = content.split('\n').filter(l =>
        (l.includes('exec(') || l.includes('execAsync(')) && l.includes('objdump'));
    for (const line of execLines) {
        assert.ok(line.includes('${objdumpPath}'), `exec 应使用变量: ${line.trim()}`);
    }
});

test('disassembly.js executeAddr2line 使用 ${addr2linePath}', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const start = content.indexOf('async function executeAddr2line');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('${addr2linePath}'));
});

test('disassembly.js objdumpPath 在至少2处被引用', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const matches = content.split('\n').filter(l => l.includes('${objdumpPath}'));
    assert.ok(matches.length >= 2);
});

test('disassembly.js searchCmd 在管道命令中被引用', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const matches = content.split('\n').filter(l => l.includes('${platform.searchCmd}'));
    assert.ok(matches.length >= 1);
});

test('disassembly.js 引用的 objdumpPath 路径格式正确', () => {
    assert.ok(platform.objdumpPath.includes('bin'));
    assert.ok(platform.objdumpPath.includes('objdump'));
});

test('disassembly.js 引用的 addr2linePath 路径格式正确', () => {
    assert.ok(platform.addr2linePath.includes('bin'));
    assert.ok(platform.addr2linePath.includes('addr2line'));
});

test('disassembly.js searchCmd 与当前平台匹配', () => {
    assert.strictEqual(platform.searchCmd, platform.isWindows ? 'findstr' : 'grep');
});

test('disassembly.js 导出 init 函数', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes('module.exports'));
    assert.ok(content.includes('init'));
});

test('disassembly.js init 注册 DISASSEMBLY_TYPE 插件', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const start = content.indexOf('function init()');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('DISASSEMBLY_TYPE'));
    assert.ok(body.includes('registerPlugin'));
});

test('disassembly.js clear 函数清理临时目录', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const start = content.indexOf('function clear');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('TEMP_DIR'));
    assert.ok(body.includes('rmSync'));
});

test('disassembly.js 包含 Apache License 头部且无 BOM', () => {
    const content = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    assert.ok(content.includes('Apache License'));
    const buf = fs.readFileSync(DISASSEMBLY_PATH);
    assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF));
});

// === usb.js 行分隔和临时路径适配验证 ===

test('usb.js 引入 platform.js 和 path 模块', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes("require('../platform.js')"));
    assert.ok(content.includes("require('path')"));
});

test('usb.js 使用 platform.splitLines', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes('platform.splitLines'));
});

test('usb.js 使用 platform.tempDir', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes('platform.tempDir'));
});

test('usb.js 不再硬编码 split("\\r\\n")', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(!content.includes("split('\\r\\n')"));
    assert.ok(!content.includes('split("\\r\\n")'));
});

test('usb.js hisysevent.def 路径使用 path.join(platform.tempDir, ...)', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes("path.join(platform.tempDir, 'hisysevent.def')"));
});

test('usb.js sendSerialNumb 使用 platform.splitLines(stdout)', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    const start = content.indexOf('function sendSerialNumb');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('platform.splitLines(stdout)'));
    assert.ok(body.includes('.slice('));
});

test('usb.js getHisystem 使用 platform.tempDir 和 path.join', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    const start = content.indexOf('function getHisystem');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('platform.tempDir'));
    assert.ok(body.includes('path.join'));
    assert.ok(body.includes('hdc file recv'));
    assert.ok(body.includes('${filePath}'));
});

test('usb.js getHisystem 读取文件并回传内容', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    const start = content.indexOf('function getHisystem');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('fs.readFile'));
});

test('usb.js splitLines 正确处理 hdc list targets 输出', () => {
    assert.deepStrictEqual(platform.splitLines('device1\ndevice2\n'), ['device1', 'device2', '']);
});

test('usb.js splitLines 正确处理 Windows 风格 hdc 输出', () => {
    assert.deepStrictEqual(platform.splitLines('device1\r\ndevice2\r\n'), ['device1', 'device2', '']);
});

test('usb.js splitLines 处理空设备列表', () => {
    assert.deepStrictEqual(platform.splitLines(''), ['']);
    assert.deepStrictEqual(platform.splitLines('\n'), ['', '']);
});

test('usb.js splitLines 正确处理进程列表输出', () => {
    const out = 'PID CMD\n123 com.example.app\n456 com.test.app\n';
    const r = platform.splitLines(out);
    assert.strictEqual(r.length, 4);
    assert.strictEqual(r[0], 'PID CMD');
    assert.strictEqual(r[3], '');
});

test('usb.js 使用的 tempDir 与当前平台匹配', () => {
    const os = require('os');
    assert.strictEqual(platform.tempDir, platform.isWindows ? 'C:\\' : os.tmpdir());
});

test('usb.js hisysevent.def 路径拼接正确', () => {
    const fp = path.join(platform.tempDir, 'hisysevent.def');
    assert.ok(fp.includes('hisysevent.def'));
    assert.ok(fp.length > 'hisysevent.def'.length);
    if (platform.isWindows) assert.ok(fp.includes(':'));
});

test('usb.js 导出 init 函数', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes('module.exports'));
    assert.ok(content.includes('init'));
});

test('usb.js init 注册 USB_TYPE 插件', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    const start = content.indexOf('function init()');
    const body = content.substring(start, content.indexOf('\n}', start));
    assert.ok(body.includes('USB_TYPE'));
    assert.ok(body.includes('registerPlugin'));
});

test('usb.js process 函数包含所有 cmd 分支', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    const start = content.indexOf('function process(');
    const body = content.substring(start, content.indexOf('\n}', start));
    for (const cmd of ['SN_CMD', 'GET_PROCESS', 'GET_CPU_COUNT_CMD', 'GET_EVENT_CMD', 'GET_APP_CMD', 'GET_VERSION', 'GET_HISY_CMD']) {
        assert.ok(body.includes(cmd), `process 应处理 ${cmd}`);
    }
});

test('usb.js 包含 Apache License 头部且无 BOM', () => {
    const content = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(content.includes('Apache License'));
    const buf = fs.readFileSync(USB_PATH);
    assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF));
});

test('disassembly.js 和 usb.js 都引入 winston logger', () => {
    const dis = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const usb = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(dis.includes("require('winston')"));
    assert.ok(usb.includes("require('winston')"));
});

test('disassembly.js 和 usb.js 使用相对路径引入 platform.js', () => {
    const dis = fs.readFileSync(DISASSEMBLY_PATH, 'utf8');
    const usb = fs.readFileSync(USB_PATH, 'utf8');
    assert.ok(dis.includes("require('../platform.js')"));
    assert.ok(usb.includes("require('../platform.js')"));
});
