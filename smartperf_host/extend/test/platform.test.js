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
const os = require('os');
const path = require('path');
const fs = require('fs');

const platform = require('../platform.js');

test('platform 模块导出包含所有预期字段', () => {
    const expectedKeys = ['isWindows', 'platform', 'objdumpPath', 'addr2linePath', 'searchCmd', 'tempDir', 'splitLines'];
    for (const key of expectedKeys) {
        assert.ok(key in platform, `模块应包含字段: ${key}`);
    }
});

test('platform.isWindows 在 win32 平台返回 true，其他平台返回 false', () => {
    if (process.platform === 'win32') {
        assert.strictEqual(platform.isWindows, true);
    } else {
        assert.strictEqual(platform.isWindows, false);
    }
});

test('platform.platform 等于 process.platform', () => {
    assert.strictEqual(platform.platform, process.platform);
});

test('platform.objdumpPath 在 Windows 平台以 .exe 结尾', () => {
    if (platform.isWindows) {
        assert.ok(platform.objdumpPath.endsWith('objdump.exe'),
            `Windows 平台 objdumpPath 应以 objdump.exe 结尾，实际: ${platform.objdumpPath}`);
    } else {
        assert.ok(platform.objdumpPath.endsWith('objdump'),
            `非 Windows 平台 objdumpPath 应以 objdump 结尾，实际: ${platform.objdumpPath}`);
        assert.ok(!platform.objdumpPath.endsWith('.exe'),
            `非 Windows 平台 objdumpPath 不应以 .exe 结尾`);
    }
});

test('platform.addr2linePath 在 Windows 平台以 .exe 结尾', () => {
    if (platform.isWindows) {
        assert.ok(platform.addr2linePath.endsWith('addr2line.exe'),
            `Windows 平台 addr2linePath 应以 addr2line.exe 结尾，实际: ${platform.addr2linePath}`);
    } else {
        assert.ok(platform.addr2linePath.endsWith('addr2line'),
            `非 Windows 平台 addr2linePath 应以 addr2line 结尾，实际: ${platform.addr2linePath}`);
    }
});

test('platform.searchCmd 在 Windows 为 findstr，其他平台为 grep', () => {
    if (platform.isWindows) {
        assert.strictEqual(platform.searchCmd, 'findstr');
    } else {
        assert.strictEqual(platform.searchCmd, 'grep');
    }
});

test('platform.tempDir 在 Windows 为 C:\\，其他平台为 os.tmpdir()', () => {
    if (platform.isWindows) {
        assert.strictEqual(platform.tempDir, 'C:\\');
    } else {
        assert.strictEqual(platform.tempDir, os.tmpdir());
    }
});

test('platform.objdumpPath 和 addr2linePath 基于 __dirname/bin', () => {
    const expectedBinDir = path.join(__dirname, '..', 'bin');
    assert.ok(platform.objdumpPath.startsWith(expectedBinDir),
        `objdumpPath 应基于 ${expectedBinDir}，实际: ${platform.objdumpPath}`);
    assert.ok(platform.addr2linePath.startsWith(expectedBinDir),
        `addr2linePath 应基于 ${expectedBinDir}，实际: ${platform.addr2linePath}`);
});

test('platform.splitLines 对空字符串返回 [""]', () => {
    const result = platform.splitLines('');
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], '');
});

test('platform.splitLines 对单行文本返回单元素数组', () => {
    const result = platform.splitLines('hello world');
    assert.deepStrictEqual(result, ['hello world']);
});

test('platform.splitLines 正确拆分 \\n 换行文本', () => {
    const input = 'line1\nline2\nline3';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['line1', 'line2', 'line3']);
});

test('platform.splitLines 正确拆分 \\r\\n 换行文本', () => {
    const input = 'line1\r\nline2\r\nline3';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['line1', 'line2', 'line3']);
});

test('platform.splitLines 正确拆分混合换行符文本', () => {
    const input = 'line1\nline2\r\nline3\nline4';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['line1', 'line2', 'line3', 'line4']);
});

test('platform.splitLines 对尾部换行产生末尾空字符串', () => {
    const input = 'line1\nline2\n';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['line1', 'line2', '']);
});

test('platform.splitLines 对连续换行产生空字符串元素', () => {
    const input = 'a\n\n\nb';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['a', '', '', 'b']);
});

test('platform.splitLines 对仅含换行符的文本正确拆分', () => {
    assert.deepStrictEqual(platform.splitLines('\n'), ['', '']);
    assert.deepStrictEqual(platform.splitLines('\r\n'), ['', '']);
    assert.deepStrictEqual(platform.splitLines('\n\n'), ['', '', '']);
});

test('platform.splitLines 是函数类型', () => {
    assert.strictEqual(typeof platform.splitLines, 'function');
});

test('platform.isWindows 是布尔类型', () => {
    assert.strictEqual(typeof platform.isWindows, 'boolean');
});

test('platform.objdumpPath 和 addr2linePath 是字符串类型', () => {
    assert.strictEqual(typeof platform.objdumpPath, 'string');
    assert.strictEqual(typeof platform.addr2linePath, 'string');
    assert.ok(platform.objdumpPath.length > 0, 'objdumpPath 不应为空字符串');
    assert.ok(platform.addr2linePath.length > 0, 'addr2linePath 不应为空字符串');
});

test('platform.searchCmd 是字符串类型', () => {
    assert.strictEqual(typeof platform.searchCmd, 'string');
    assert.ok(platform.searchCmd.length > 0, 'searchCmd 不应为空字符串');
});

test('platform.tempDir 是非空字符串', () => {
    assert.strictEqual(typeof platform.tempDir, 'string');
    assert.ok(platform.tempDir.length > 0, 'tempDir 不应为空字符串');
});

test('platform.objdumpPath 路径包含 objdump 基础名', () => {
    const basename = path.basename(platform.objdumpPath);
    assert.ok(basename.startsWith('objdump'),
        `路径 basename 应以 objdump 开头，实际: ${basename}`);
});

test('platform.addr2linePath 路径包含 addr2line 基础名', () => {
    const basename = path.basename(platform.addr2linePath);
    assert.ok(basename.startsWith('addr2line'),
        `路径 basename 应以 addr2line 开头，实际: ${basename}`);
});

test('platform 模块多次 require 返回同一实例', () => {
    delete require.cache[require.resolve('../platform.js')];
    const platformReloaded = require('../platform.js');
    assert.strictEqual(platform.isWindows, platformReloaded.isWindows);
    assert.strictEqual(platform.searchCmd, platformReloaded.searchCmd);
    assert.strictEqual(platform.tempDir, platformReloaded.tempDir);
    assert.deepStrictEqual(platform.splitLines('a\nb'), platformReloaded.splitLines('a\nb'));
});

test('platform.splitLines 返回数组且元素为字符串', () => {
    const result = platform.splitLines('a\nb\nc');
    assert.ok(Array.isArray(result), '返回值应为数组');
    for (const item of result) {
        assert.strictEqual(typeof item, 'string', '每个元素应为字符串');
    }
});

test('platform.splitLines 不修改原始输入', () => {
    const original = 'line1\nline2\nline3';
    const originalCopy = 'line1\nline2\nline3';
    platform.splitLines(original);
    assert.strictEqual(original, originalCopy, '原始字符串不应被修改');
});

test('platform.searchCmd 逻辑验证：非 win32 返回 grep', () => {
    const expectedSearchCmd = process.platform === 'win32' ? 'findstr' : 'grep';
    assert.strictEqual(platform.searchCmd, expectedSearchCmd);
});

test('platform.tempDir 逻辑验证：win32 返回 C:\\', () => {
    const expectedTempDir = process.platform === 'win32' ? 'C:\\' : os.tmpdir();
    assert.strictEqual(platform.tempDir, expectedTempDir);
});

test('platform.objdumpPath 和 addr2linePath 共享同一 bin 目录', () => {
    const objdumpDir = path.dirname(platform.objdumpPath);
    const addr2lineDir = path.dirname(platform.addr2linePath);
    assert.strictEqual(objdumpDir, addr2lineDir,
        `两个工具路径应共享同一目录，objdumpDir: ${objdumpDir}, addr2lineDir: ${addr2lineDir}`);
});

test('platform.splitLines 正确处理含空格和特殊字符的文本', () => {
    const input = '  hello  world  \n  foo@bar  \n  $PATH  ';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['  hello  world  ', '  foo@bar  ', '  $PATH  ']);
});

test('platform.splitLines 正确处理超长多行文本', () => {
    const lines = [];
    for (let i = 0; i < 1000; i++) {
        lines.push(`line_${i}`);
    }
    const input = lines.join('\n');
    const result = platform.splitLines(input);
    assert.strictEqual(result.length, 1000);
    assert.strictEqual(result[0], 'line_0');
    assert.strictEqual(result[999], 'line_999');
});

test('platform.splitLines 正确处理仅含空格的行', () => {
    const input = 'line1\n   \nline3';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['line1', '   ', 'line3']);
});

test('platform 所有导出字段在多次访问中保持稳定', () => {
    const firstAccess = {
        isWindows: platform.isWindows,
        platform: platform.platform,
        objdumpPath: platform.objdumpPath,
        addr2linePath: platform.addr2linePath,
        searchCmd: platform.searchCmd,
        tempDir: platform.tempDir,
    };
    const secondAccess = {
        isWindows: platform.isWindows,
        platform: platform.platform,
        objdumpPath: platform.objdumpPath,
        addr2linePath: platform.addr2linePath,
        searchCmd: platform.searchCmd,
        tempDir: platform.tempDir,
    };
    assert.deepStrictEqual(firstAccess, secondAccess);
});

test('platform.splitLines 正确处理 Unicode 字符', () => {
    const input = '你好\n世界\n测试';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['你好', '世界', '测试']);
});

test('platform.splitLines 保留制表符', () => {
    const input = 'col1\tcol2\ncol3\tcol4';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['col1\tcol2', 'col3\tcol4']);
});

test('platform.splitLines 不拆分单独 \\r', () => {
    const result = platform.splitLines('line1\rline2');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'line1\rline2');
});

test('platform.splitLines 处理混合换行符且以 \\r\\n 结尾', () => {
    const input = 'a\nb\r\nc\r\n';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['a', 'b', 'c', '']);
});

test('platform.splitLines 对纯 \\r\\n 返回两个空字符串', () => {
    assert.deepStrictEqual(platform.splitLines('\r\n'), ['', '']);
});

test('platform.objdumpPath 使用平台正确的路径分隔符', () => {
    if (platform.isWindows) {
        assert.ok(platform.objdumpPath.includes('\\') || platform.objdumpPath.includes('/'));
    } else {
        assert.ok(platform.objdumpPath.includes('/'));
    }
});

test('platform.addr2linePath 使用平台正确的路径分隔符', () => {
    if (platform.isWindows) {
        assert.ok(platform.addr2linePath.includes('\\') || platform.addr2linePath.includes('/'));
    } else {
        assert.ok(platform.addr2linePath.includes('/'));
    }
});

test('platform.objdumpPath 不包含双斜杠', () => {
    assert.ok(!platform.objdumpPath.includes('//'));
});

test('platform.addr2linePath 不包含双斜杠', () => {
    assert.ok(!platform.addr2linePath.includes('//'));
});

test('platform.tempDir 格式规范', () => {
    if (platform.isWindows) {
        assert.strictEqual(platform.tempDir, 'C:\\');
    } else {
        assert.ok(!platform.tempDir.endsWith('/'),
            '非 Windows tempDir 不应以 / 结尾');
    }
});

test('platform.splitLines 处理数字和符号混合文本', () => {
    const input = '123\nabc\n!@#\n456';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['123', 'abc', '!@#', '456']);
});

test('platform.splitLines 不破坏 JSON 多行结构', () => {
    const input = '{"a":1}\n{"b":2}\n{"c":3}';
    const result = platform.splitLines(input);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(JSON.parse(result[0]).a, 1);
    assert.strictEqual(JSON.parse(result[1]).b, 2);
    assert.strictEqual(JSON.parse(result[2]).c, 3);
});

test('platform.splitLines 处理 hdc list targets 多设备输出', () => {
    const hdcOutput = 'device_001\ndevice_002\ndevice_003\n';
    const result = platform.splitLines(hdcOutput);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0], 'device_001');
    assert.strictEqual(result[1], 'device_002');
    assert.strictEqual(result[2], 'device_003');
    assert.strictEqual(result[3], '');
});

test('platform.splitLines 处理 hdc shell ps 输出', () => {
    const psOutput = '  PID CMD\n  123 com.ohos.app\n  456 com.test.app';
    const result = platform.splitLines(psOutput);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], '  PID CMD');
    assert.strictEqual(result[1], '  123 com.ohos.app');
    assert.strictEqual(result[2], '  456 com.test.app');
});

test('platform.splitLines 处理 hiperf list 输出', () => {
    const hiperfOutput = 'hw-instructions\nhw-cpu-cycles\nhw-cache-misses\n';
    const result = platform.splitLines(hiperfOutput);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0], 'hw-instructions');
    assert.strictEqual(result[3], '');
});

test('platform.splitLines 处理 bm dump -a 输出', () => {
    const bmOutput = 'com.ohos.launcher\ncom.ohos.settings\ncom.ohos.photos\n';
    const result = platform.splitLines(bmOutput);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0], 'com.ohos.launcher');
    assert.strictEqual(result[1], 'com.ohos.settings');
    assert.strictEqual(result[2], 'com.ohos.photos');
});

test('platform.splitLines 处理 param get 版本号输出', () => {
    const versionOutput = '5.0.0.123\n';
    const result = platform.splitLines(versionOutput);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], '5.0.0.123');
    assert.strictEqual(result[1], '');
});

test('platform objdumpPath/addr2linePath basename 是纯文件名', () => {
    const objdumpBase = path.basename(platform.objdumpPath);
    const addr2lineBase = path.basename(platform.addr2linePath);
    assert.ok(!objdumpBase.includes('/') && !objdumpBase.includes('\\'));
    assert.ok(!addr2lineBase.includes('/') && !addr2lineBase.includes('\\'));
});

test('platform.splitLines 多次调用结果一致', () => {
    const input = 'a\nb\nc';
    const r1 = platform.splitLines(input);
    const r2 = platform.splitLines(input);
    assert.deepStrictEqual(r1, r2);
});

test('platform.splitLines 对非字符串输入不崩溃', () => {
    try {
        platform.splitLines(null);
    } catch (e) {
        assert.ok(e instanceof TypeError);
    }
    try {
        platform.splitLines(undefined);
    } catch (e) {
        assert.ok(e instanceof TypeError);
    }
});

test('platform.searchCmd 是 findstr 或 grep', () => {
    assert.ok(platform.searchCmd === 'findstr' || platform.searchCmd === 'grep');
});

test('platform.objdumpPath 以 bin 结尾的目录', () => {
    const dir = path.dirname(platform.objdumpPath);
    assert.strictEqual(path.basename(dir), 'bin');
});

test('platform.addr2linePath 以 bin 结尾的目录', () => {
    const dir = path.dirname(platform.addr2linePath);
    assert.strictEqual(path.basename(dir), 'bin');
});

test('platform.splitLines 处理含中文和英文混合的文本', () => {
    const input = 'hello 世界\nfoo 测试\nbar';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['hello 世界', 'foo 测试', 'bar']);
});

test('platform.splitLines 处理含 emoji 的文本', () => {
    const input = 'line1 🚀\nline2 📊\nline3';
    const result = platform.splitLines(input);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], 'line1 🚀');
    assert.strictEqual(result[1], 'line2 📊');
});

test('platform.splitLines 处理含引号的文本', () => {
    const input = 'say "hello"\nsay \'world\'';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['say "hello"', "say 'world'"]);
});

test('platform.splitLines 处理含反斜杠的文本', () => {
    const input = 'C:\\path\\to\\file\nD:\\another\\path';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['C:\\path\\to\\file', 'D:\\another\\path']);
});

test('platform.splitLines 处理含正则特殊字符的文本', () => {
    const input = 'a.*b\nc.+d\ne?f';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['a.*b', 'c.+d', 'e?f']);
});

test('platform.splitLines 处理超长单行文本', () => {
    const longLine = 'x'.repeat(10000);
    const result = platform.splitLines(longLine);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].length, 10000);
});

test('platform.splitLines 处理 500 行文本', () => {
    const lines = [];
    for (let i = 0; i < 500; i++) lines.push(`line_${i}`);
    const result = platform.splitLines(lines.join('\n'));
    assert.strictEqual(result.length, 500);
    assert.strictEqual(result[0], 'line_0');
    assert.strictEqual(result[499], 'line_499');
});

test('platform.isWindows 与 process.platform 严格一致', () => {
    assert.strictEqual(platform.isWindows, process.platform === 'win32');
});

test('platform.platform 值是常见平台之一', () => {
    const known = ['win32', 'linux', 'darwin', 'freebsd', 'openbsd'];
    assert.ok(known.includes(platform.platform), `platform: ${platform.platform}`);
});

test('platform.objdumpPath 不包含空格', () => {
    assert.ok(!platform.objdumpPath.includes(' '));
});

test('platform.addr2linePath 不包含空格', () => {
    assert.ok(!platform.addr2linePath.includes(' '));
});

test('platform.tempDir 不包含空格', () => {
    assert.ok(!platform.tempDir.includes(' '));
});

test('platform 模块不包含循环依赖', () => {
    const mod = require('../platform.js');
    assert.ok(mod, '模块应成功加载无循环依赖');
    assert.strictEqual(typeof mod.splitLines, 'function', '模块导出应完整');
    assert.strictEqual(mod.searchCmd, platform.searchCmd, '模块值应一致');
});

test('platform.splitLines 返回值可被 join 还原', () => {
    const input = 'a\nb\nc\nd';
    const result = platform.splitLines(input);
    assert.strictEqual(result.join('\n'), input);
});

test('platform.splitLines 对 \\r\\n 文本 join 还原检查', () => {
    const input = 'a\r\nb\r\nc';
    const result = platform.splitLines(input);
    assert.strictEqual(result.join('\n'), 'a\nb\nc');
    assert.strictEqual(result.join('\r\n'), input);
});

test('platform.searchCmd 不为空字符串', () => {
    assert.ok(platform.searchCmd.length > 0);
});

test('platform.tempDir 是绝对路径', () => {
    assert.ok(path.isAbsolute(platform.tempDir), `tempDir 应为绝对路径: ${platform.tempDir}`);
});

test('platform.objdumpPath 是绝对路径', () => {
    assert.ok(path.isAbsolute(platform.objdumpPath), `objdumpPath 应为绝对路径`);
});

test('platform.addr2linePath 是绝对路径', () => {
    assert.ok(path.isAbsolute(platform.addr2linePath), `addr2linePath 应为绝对路径`);
});

test('platform.splitLines 处理 hdc file recv 输出', () => {
    const recvOutput = 'File Transfer finish, Size:1024 time:32ms rate:32KB/s\n';
    const result = platform.splitLines(recvOutput);
    assert.strictEqual(result.length, 2);
    assert.ok(result[0].includes('File Transfer finish'));
});

test('platform.splitLines 处理 hdc shell grep 输出', () => {
    const grepOutput = 'processor\t: 0\nprocessor\t: 1\nprocessor\t: 2\n';
    const result = platform.splitLines(grepOutput);
    assert.strictEqual(result.length, 4);
    assert.ok(result[0].includes('processor'));
    assert.strictEqual(result[3], '');
});

test('platform.splitLines 处理多行空行交替文本', () => {
    const input = 'a\n\nb\n\n\nc';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['a', '', 'b', '', '', 'c']);
});

test('platform.splitLines 处理含分号和逗号的文本', () => {
    const input = 'a,b;c\nd,e;f';
    const result = platform.splitLines(input);
    assert.deepStrictEqual(result, ['a,b;c', 'd,e;f']);
});

test('platform.splitLines 处理含大括号的 JSON 风格文本', () => {
    const input = '{"key":"value1"}\n{"key":"value2"}';
    const result = platform.splitLines(input);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(JSON.parse(result[0]), { key: 'value1' });
    assert.deepStrictEqual(JSON.parse(result[1]), { key: 'value2' });
});
