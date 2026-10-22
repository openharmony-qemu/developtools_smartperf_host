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
const path = require('path');
const { exec, execFile, spawn } = require('child_process');
const TypeManage = require('../typeManage.js');
const readline = require('readline');
const winston = require('winston');
const SAVE_CMD = 1; // {fileName:str, buffer:str, bufferSize:num, totalSize:num, isLast:bool}
const SAVE_BACK_CMD = 2; // {result:num, msg:str}
const QUERY_CMD = 3; // {elfName:str, vaddr:str, func:str}
const QUERY_BACK_CMD = 4; // {result:num, msg:str}
const DISASSEMBLY_QUERY_ELF_CMD = 5; // {elfName:str, vaddr:str, func:str}
const logger = winston.createLogger(require('./../winston.config.js'));

const decoder = new TextDecoder('utf-8'); // 'utf-8' 是常见的字符编码
const textEncoder = new TextEncoder();
let fileStreams = {}; // 用于存储文件的写入流

const TEMP_DIR = path.join(__dirname, 'temp_files');

// objdump路径，通过平台抽象层获取
const platform = require('../platform.js');
const objdumpPath = platform.getToolPath('objdump');
let resultString = '';

function execObjdump(args, callback) {
    if (platform.isHarmony) {
        execFile(objdumpPath, args, callback);
    } else {
        exec(`${objdumpPath} ${args.join(' ')}`, callback);
    }
}

/**
 * 将LLVM objdump输出的十进制立即数转换为十六进制，对齐GNU objdump格式
 * 如 #160 → #0xa0，#6 → #0x6
 * 排除：[...]内的内存偏移、移位关键字后的移位量
 */
function convertDecImmToHex(instruction) {
    if (!platform.isHarmony) {
        return instruction;
    }
    const shiftRe = /\b(lsl|lsr|asr|ror|uxtb|uxth|uxtw|uxtx|sxtb|sxth|sxtw|sxtx)\s*$/;
    const placeholders = [];
    let processed = instruction.replace(/\[([^\]]*)\]/g, (match) => {
        const idx = placeholders.length;
        placeholders.push(match);
        return `\x00B${idx}\x00`;
    });
    processed = processed.replace(/#((?!0x)-?\d+)\b/g, (match, dec, offset, string) => {
        const prefix = string.substring(0, offset);
        if (shiftRe.test(prefix)) {
            return match;
        }
        const num = BigInt(dec);
        const unsigned = num & 0xFFFFFFFFFFFFFFFFn;
        return '#0x' + unsigned.toString(16);
    });
    processed = processed.replace(/\x00B(\d+)\x00/g, (match, idx) => placeholders[parseInt(idx)]);
    return processed;
}

function normalizeHarmonyInstruction(instruction) {
    if (!platform.isHarmony) {
        return instruction;
    }
    let result = instruction;
    result = result.replace(/([\s,])0x([0-9a-fA-F]+)/g, '$1$2');
    result = result.replace(/(\w)</g, '$1 <');
    return result;
}

/**
 * 验证ELF64文件头并返回section header信息
 * @returns {object|null} 包含eShoff/eShentsize/eShnum，验证失败返回null
 */
function validateElf64Header(buffer) {
    if (buffer.length < 64) {
        return null;
    }
    if (buffer[0] !== 0x7f || buffer[1] !== 0x45 ||
        buffer[2] !== 0x4c || buffer[3] !== 0x46) {
        return null;
    }
    if (buffer[4] !== 2) {
        return null;
    }
    const eShoff = Number(buffer.readBigUInt64LE(40));
    const eShentsize = buffer.readUInt16LE(58);
    const eShnum = buffer.readUInt16LE(60);
    if (eShoff === 0 || eShentsize === 0 || eShnum === 0) {
        return null;
    }
    return { eShoff, eShentsize, eShnum };
}

/**
 * 查找.symtab section的offset/size/entsize
 * @returns {object|null} 包含symtabOffset/symtabSize/symtabEntsize，未找到返回null
 */
function findSymtab(buffer, hdrInfo) {
    let symtabOffset = 0;
    let symtabSize = 0;
    let symtabEntsize = 0;
    for (let i = 0; i < hdrInfo.eShnum; i++) {
        const shOffset = hdrInfo.eShoff + i * hdrInfo.eShentsize;
        const shType = buffer.readUInt32LE(shOffset + 4);
        if (shType === 2) {
            symtabOffset = Number(buffer.readBigUInt64LE(shOffset + 24));
            symtabSize = Number(buffer.readBigUInt64LE(shOffset + 32));
            symtabEntsize = Number(buffer.readBigUInt64LE(shOffset + 56));
            break;
        }
    }
    if (symtabOffset === 0 || symtabSize === 0 || symtabEntsize === 0) {
        return null;
    }
    return { symtabOffset, symtabSize, symtabEntsize };
}

/**
 * 将.symtab中越界的st_shndx修正为SHN_UNDEF(0)
 * @returns {boolean} 是否有修改
 */
function patchSymbolIndices(buffer, symtabInfo, eShnum) {
    let patched = false;
    const numSymbols = symtabInfo.symtabSize / symtabInfo.symtabEntsize;
    for (let i = 0; i < numSymbols; i++) {
        const symOffset = symtabInfo.symtabOffset + i * symtabInfo.symtabEntsize;
        const stShndx = buffer.readUInt16LE(symOffset + 6);
        if (stShndx >= eShnum && stShndx < 0xff00) {
            buffer.writeUInt16LE(0, symOffset + 6);
            patched = true;
        }
    }
    return patched;
}

/**
 * 修补.an文件的符号表：将越界的st_shndx修正为SHN_UNDEF(0)
 * 解决llvm-objdump严格校验导致的"invalid section index"错误
 * 仅在鸿蒙环境下使用（Windows下GNU objdump容忍此问题）
 */
function patchAnFile(originalPath) {
    try {
        const parsed = path.parse(originalPath);
        const patchedPath = path.join(parsed.dir, parsed.name + '_patched' + parsed.ext);
        if (fs.existsSync(patchedPath)) {
            return patchedPath;
        }
        const buffer = fs.readFileSync(originalPath);
        const hdrInfo = validateElf64Header(buffer);
        if (!hdrInfo) {
            return originalPath;
        }
        const symtabInfo = findSymtab(buffer, hdrInfo);
        if (!symtabInfo) {
            return originalPath;
        }
        const patched = patchSymbolIndices(buffer, symtabInfo, hdrInfo.eShnum);
        if (patched) {
            fs.writeFileSync(patchedPath, buffer);
            logger.info(`Patched .an file: ${originalPath} -> ${patchedPath}`);
            return patchedPath;
        }
        return originalPath;
    } catch (error) {
        logger.error(`patchAnFile error: ${error.message}`);
        return originalPath;
    }
}

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function init() {
    const apps = require('../app.js');
    apps.pluginSystem.registerPlugin(TypeManage.TypeConfig.DISASSEMBLY_TYPE, process, clear);
}

/**
 * 逻辑控制，根据标志符cmd判断前端要什么 写入ELF文件还是提取汇编代码
 * SAVE_CMD     —— 写入ELF文件
 * QUERY_CMD    —— 提取汇编代码
 */
function process(sessionId, cmd, data) {
    if (cmd === SAVE_CMD) {
        save(sessionId, data);
    } else if (cmd === QUERY_CMD) {
        queryData(sessionId, data);
    } else if (cmd === DISASSEMBLY_QUERY_ELF_CMD) {
        checkElf(sessionId, data);
    }
}

/**
 * 搜索so/an文件
 */
function checkElf(sessionId, data) {
    const decodedData = decoder.decode(data);
    const jsonData = JSON.parse(decodedData);
    let { elf_name: elfName, vaddr, func } = jsonData;
    if (elfName.endsWith('.an')) {
        let anFilePath = path.join(TEMP_DIR, `session_${sessionId}`, elfName);
        if (!fs.existsSync(anFilePath)) {
            const msg = `FileNotFoundError: please import "${elfName}"`;
            logger.error('error：' + msg);
            sendMsg(sessionId, DISASSEMBLY_QUERY_ELF_CMD, { code: 1, message: msg });
            return;
        } else {
            sendMsg(sessionId, DISASSEMBLY_QUERY_ELF_CMD, { code: 0, message: 'OK' });
        }
    } else {
        let soInfoTxt = path.join(TEMP_DIR, `session_${sessionId}`, `${elfName.replace('.', '_')}.txt`);
        if (!fs.existsSync(soInfoTxt)) {
            const msg = `FileNotFoundError: please import "${elfName}"`;
            logger.error('error：' + msg);
            sendMsg(sessionId, DISASSEMBLY_QUERY_ELF_CMD, { code: 1, message: msg });
            return;
        } else {
            sendMsg(sessionId, DISASSEMBLY_QUERY_ELF_CMD, { code: 0, message: 'OK' });
        }
    }
}
/**
 * 写入ELF文件
 */
function save(sessionId, data) {
    try {
        // 假设 `decoder` 是已定义的 TextDecoder 实例
        const separatorIndex = data.indexOf('|'.charCodeAt(0));
        // 提取 JSON 字符串长度部分
        const jsonLengthStr = decoder.decode(data.subarray(0, separatorIndex));
        const jsonLength = parseInt(jsonLengthStr, 10);
        // 解析 JSON 字符串
        const jsonStringBytes = data.subarray(separatorIndex + 1, separatorIndex + 1 + jsonLength);
        const { file_name: fileName, buffer_index: bufferIndex, total_size: totalSize, is_last: isLast } = JSON.parse(decoder.decode(jsonStringBytes));
        // 文件数据从 JSON 结束位置之后开始
        const buffer = data.subarray(separatorIndex + 1 + jsonLength);
        logger.info(`save file, file name: ${fileName}, index: ${bufferIndex}`);

        // 将 `buffer` 转换为 Uint8Array
        const fileBuffer = new Uint8Array(buffer);

        // 创建会话对应的临时目录路径
        const sessionTempDir = path.join(TEMP_DIR, `session_${sessionId}`);

        // 如果是文件的第一个分片，初始化文件写入流
        if (!fileStreams[sessionId]?.[fileName] || bufferIndex === 0) {
            fs.mkdirSync(sessionTempDir, { recursive: true });
            // 初始化文件流映射
            fileStreams[sessionId] = fileStreams[sessionId] || {};
            // 创建一个临时文件路径
            const tempFilePath = path.join(sessionTempDir, fileName);
            fileStreams[sessionId][fileName] = fs.createWriteStream(tempFilePath, { flags: 'w' });
            logger.info(`初始化文件写入流: ${tempFilePath}`);
        }

        // 获取文件写入流, 将接收到的文件分片写入文件流
        fileStreams[sessionId][fileName].write(fileBuffer);

        // 如果接收到的是最后一个分片，关闭文件流
        if (isLast) {
            processTheLastData(sessionId, fileName, sessionTempDir, totalSize);
        }
        sendUploadBackMsg(sessionId, SAVE_BACK_CMD, 0, fileName, bufferIndex);
    } catch (error) {
        // 在出错时发送错误 ACK
        try {
            logger.error('Error in save function:', error);
            const { file_name: fileName, buffer_index: bufferIndex } = JSON.parse(decoder.decode(data));
            sendUploadBackMsg(sessionId, SAVE_BACK_CMD, 1, fileName, bufferIndex);
        } catch (parseError) {
            logger.error('Error parsing JSON data for error ACK:', parseError);
        }
    }
}

/**
 * 处理最后一包分片数据
 */
function processTheLastData(sessionId, fileName, sessionTempDir, totalSize) {
    const fileStream = fileStreams[sessionId][fileName];
    fileStream.end(() => {
        const tempFilePath = path.join(sessionTempDir, fileName);

        // 获取文件的实际大小
        const finalStats = fs.statSync(tempFilePath);

        // 检查文件大小是否与预期匹配
        if (finalStats.size === totalSize) {
            logger.info(`文件 ${fileName} 大小匹配 (${finalStats.size} 字节)`);
        } else {
            logger.warn(`文件 ${fileName} 大小不匹配: 预期 ${totalSize} 字节, 实际 ${finalStats.size} 字节`);
        }
        // 删除文件流对象
        delete fileStreams[sessionId][fileName];

        if (/\.so(\.\d+)*$/.test(fileName)) {
            processSoDisassembly(sessionId, fileName, sessionTempDir, tempFilePath);
        }

        // 如果该会话下没有其他文件，删除会话目录
        if (Object.keys(fileStreams[sessionId]).length === 0) {
            delete fileStreams[sessionId];
        }
    });
}

function processSoDisassembly(sessionId, fileName, sessionTempDir, tempFilePath) {
    // ------------------!!! .so文件反汇编预处理逻辑：执行"objdump -d --section=.text xxxx.so >xxxx.txt"
    // 预处理so文件信息存入同名txt文件 !!!---------------------------
    // 指定临时存储文件，若不存在预先创建空文件，并指定文件为UTF-8编码
    const soInfoTxt = path.join(sessionTempDir, `${fileName.replace('.', '_')}.txt`);
    fs.writeFileSync(soInfoTxt, '', { encoding: 'utf8' });
    // 执行objdump反汇编将信息输入临时存储文件
    if (platform.isHarmony) {
        const soWriteStream = fs.createWriteStream(soInfoTxt);
        const soChild = spawn(objdumpPath,
            ['-d', '--section=.text', '-l', '--demangle', tempFilePath],
            { stdio: ['ignore', 'pipe', 'pipe'] });
        soChild.stdout.pipe(soWriteStream);
        soChild.stderr.on('data', (data) => {
            logger.warn(`objdump(.so) stderr: ${data.toString()}`);
        });
        soChild.on('error', (iError) => {
            const msg = `SoTxtBuildError(Build Disassembly txt for file:"${fileName}" Error!): ` +
                `[code:${iError.code || ''} ${iError.message}]`;
            logger.error('异常：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
        });
        soChild.on('close', (code) => {
            if (code !== 0) {
                const msg = `SoTxtBuildError(Build Disassembly txt for file:"${fileName}" Error!): [exit code:${code}]`;
                logger.error('异常：' + msg);
                sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            }
        });
    } else {
        exec(`${objdumpPath} -d --section=.text -l --demangle ${tempFilePath} >${soInfoTxt}`,
            (iError, iStdOut, iStdErr) => {
                if (iError || iStdErr) {
                    const msg = `SoTxtBuildError(Build Disassembly txt for file:"${fileName}" Error!): ` +
                        `[${iError ? iError.message : iStdErr.toString()}]`;
                    logger.error('异常：' + msg);
                    sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
                }
            });
    }
}


function sendUploadBackMsg(sessionId, cmd, code, fileName, bufferIndex) {
    const app = require('../app.js');
    let jsonString = JSON.stringify({
        resultCode: code,
        fileName: fileName,
        bufferIndex: bufferIndex
    });
    app.sendMsgToClient(TypeManage.TypeConfig.DISASSEMBLY_TYPE, sessionId, cmd, textEncoder.encode(jsonString));
}


/**
 * 提取汇编代码
 */
function queryData(sessionId, data) {
    const decodedData = decoder.decode(data);
    const jsonData = JSON.parse(decodedData);
    logger.info('get query disassembly request：' + jsonData);
    let { elf_name: elfName, vaddr, func } = jsonData;
    if (elfName.endsWith('.an')) {
        let anFilePath = path.join(TEMP_DIR, `session_${sessionId}`, elfName);
        if (!fs.existsSync(anFilePath)) {
            const msg = `FileNotFoundError: please import "${elfName}"`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        if (platform.isHarmony) {
            anFilePath = patchAnFile(anFilePath);
        }
        if (func.includes('@')) { func = func.split('@')[0] }
        extractInfoFromAnTxt(func, elfName, vaddr, sessionId, anFilePath);
    } else {
        let soInfoTxt = path.join(TEMP_DIR, `session_${sessionId}`, `${elfName.replace('.', '_')}.txt`);
        if (!fs.existsSync(soInfoTxt)) {
            const msg = `FileNotFoundError: please import "${elfName}"`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        extractCompileInfoFromSoTxt(func, elfName, vaddr, sessionId, soInfoTxt);
    }
}

/**
 * 从ELF64二进制中读取指定section的文件偏移(sh_offset)
 * 用于替代llvm-objdump -h缺少File off列的问题
 */
function getSectionFileOffset(filePath, sectionName) {
    try {
        const buffer = fs.readFileSync(filePath);
        if (buffer.length < 64 || buffer[0] !== 0x7f ||
            buffer[1] !== 0x45 || buffer[2] !== 0x4c || buffer[3] !== 0x46) {
            return '0x0';
        }
        const eShoff = Number(buffer.readBigUInt64LE(40));
        const eShentsize = buffer.readUInt16LE(58);
        const eShnum = buffer.readUInt16LE(60);
        const eShstrndx = buffer.readUInt16LE(62);
        if (eShoff === 0 || eShentsize === 0 || eShnum === 0) {
            return '0x0';
        }
        const shstrtabHdrOff = eShoff + eShstrndx * eShentsize;
        const shstrtabOffset = Number(buffer.readBigUInt64LE(shstrtabHdrOff + 24));
        for (let i = 0; i < eShnum; i++) {
            const shOff = eShoff + i * eShentsize;
            const shName = buffer.readUInt32LE(shOff);
            let name = '';
            for (let j = shstrtabOffset + shName; j < buffer.length && buffer[j] !== 0; j++) {
                name += String.fromCharCode(buffer[j]);
            }
            if (name === sectionName) {
                const shOffset = Number(buffer.readBigUInt64LE(shOff + 24));
                return `0x${shOffset.toString(16).padStart(8, '0')}`;
            }
        }
        return '0x0';
    } catch (error) {
        logger.error(`getSectionFileOffset error: ${error.message}`);
        return '0x0';
    }
}

function processAnFileFindTextName(sessionId, vaddr, func, textName, anFilePath, elfName, eaddr) {
    if (platform.isHarmony) {
        const textAddrOff = getSectionFileOffset(anFilePath, textName);
        processAnDisassembly(sessionId, vaddr, func, anFilePath, elfName, eaddr, textAddrOff);
        return;
    }
    exec(`${objdumpPath} -h ${anFilePath} | findstr -i ${textName}`,
        (miderError, miderStdOut, miderStdErr) => {
            if (miderError || (miderStdErr && miderStdErr.length > 0)) {
                const msg = `MiderExecError(Get Text Info List for textName:"${textName}" in file:` +
                    `${elfName} Error!):[${miderError ? miderError.message : miderStdErr.toString()}]`;
                logger.error('error：' + msg);
                sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
                return;
            }
            let textAddrOff = `0x${miderStdOut.split(/\s+/g)[6]}`;
            processAnDisassembly(sessionId, vaddr, func, anFilePath, elfName, eaddr, textAddrOff);
        });
}

function processAnDisassembly(sessionId, vaddr, func, anFilePath, elfName, eaddr, textAddrOff) {
    execObjdump([
        '-d', anFilePath,
        `--start-address=0x${parseInt(vaddr).toString(16)}`,
        `--stop-address=0x${eaddr.toString(16)}`
    ],
        (innerError, innerStdOut, innerStdErr) => {
            if (innerError || (innerStdErr && innerStdErr.length > 0)) {
                const msg = `InnerExecError(Get All Symbols from func:"${func}" ` +
                    `in file:${elfName} in Address-Range:[0x${vaddr.toString(16)}, 0x${eaddr.toString(16)}` +
                    `] Error!): [${innerError ? innerError.message : innerStdErr.toString()}]`;
                logger.error('error：' + msg);
                sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg, off: textAddrOff });
                return;
            }
            let ans = '';
            for (let ca of innerStdOut.split(`<${func}>:`)[1].split('\n')) {
                if (ca.trim() === '') {
                    continue;
                }
                let addr = (parseInt(ca.split(`:`)[0].replace(/\s+/g, ''), 16)).toString(16);
                let instruction;
                if (platform.isHarmony) {
                    const colonIdx = ca.indexOf(`:`);
                    const instParts = ca.substring(colonIdx + 1).trim().split(/\s+/);
                    instruction = convertDecImmToHex(instParts.slice(1).join(' '));
                } else {
                    instruction = ca.split(`:`)[1];
                    instruction = instruction.substring(instruction.indexOf(' '));
                    instruction = instruction.replace(/\s+/g, ' ').trim();
                }
                ans += `{\"addr\":\"0x${addr}\", \"instruction\":\"${instruction}\"},`;
            }
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 0, message: `[${ans.slice(0, -1)}]`, off: textAddrOff });
        });
}

/**
 * 提取an汇编代码
 */
function extractInfoFromAnTxt(func, elfName, vaddr, sessionId, anFilePath) {
    const anCallback = (outerError, outerStdOut, outerStdErr) => {
        if (outerError || (outerStdErr && outerStdErr.length > 0)) {
            const searchTool = platform.isHarmony ? 'grep' : 'findstr';
            const msg = `OuterExecError(In Using '${searchTool}' searching func:"${func}" ` +
                `from file:"${elfName}" to get func-size for calculating the stop-address in needing): [` +
                `${outerError ? outerError.message : outerStdErr.toString()}]`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        // Windows: output already filtered by findstr; otherwise: filter in JS
        let filteredStdOut = platform.isHarmony
            ? outerStdOut.split('\n').filter(line => line.includes(func)).join('\n')
            : outerStdOut;
        if (filteredStdOut === '') {
            const msg = `OuterExecError(Return '' when searching func:"${func}" ` +
                `from file:"${elfName}" and got nothing!)`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        let eaddr = 0;
        let textName = '';
        for (let i of filteredStdOut.split('\n')) {
            let coms = i.split(/\s+/g);
            if (coms[5] === func && parseInt(coms[4], 16) !== 0) {
                eaddr = parseInt(coms[0], 16) + parseInt(coms[4], 16);
                textName = coms[3];
                break;
            }
        }
        if (eaddr === 0 || parseInt(vaddr, 10) >= eaddr) {
            const msg = `AddressError(Get addresses from func:"${func}" in file:"${elfName}" ` +
                `Error!): [start-address:"0x${vaddr.toString(16)}" ` +
                `isn't smaller than stop-address:"0x${eaddr.toString(16)}"]`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        processAnFileFindTextName(sessionId, vaddr, func, textName, anFilePath, elfName, eaddr);
    };
    if (platform.isHarmony) {
        execObjdump(['-t', anFilePath], anCallback);
    } else {
        exec(`${objdumpPath} -t ${anFilePath} | findstr ${func}`, anCallback);
    }
}

/**
 * 提取so汇编代码
 */
function extractCompileInfoFromSoTxt(func, elfName, vaddr, sessionId, soInfoTxt) {
    let fsRS = fs.createReadStream(soInfoTxt, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: fsRS,
        crlfDelay: Infinity
    });
    const target = parseInt(vaddr, 10).toString(16).padStart(16, '0');
    const prefix = '00';
    const state = { isInTargetRange: false, currentSourceLine: '??:?' };
    resultString = '';
    let addrArray = [];
    let sourceLines = [];
    rl.on('line', (line) => {
        try {
            processSoLine(line, state, prefix, target, rl, addrArray, sourceLines);
        } catch (error) {
            const errMsg = `Reading failed.Error):[${error.message}]`;
        }
    });
    processCloseData(rl, fsRS, func, elfName, vaddr, sessionId, addrArray, sourceLines);
}

function processSoLine(line, state, prefix, target, rl, addrArray, sourceLines) {
    if (state.isInTargetRange) {
        if (line.startsWith(prefix)) {
            state.isInTargetRange = false;
            rl.close();
        } else if (line.trim() !== '') {
            if (line.startsWith(' ') || line.startsWith('\t')) {
                const colonIdx = line.indexOf(':');
                const addr = line.substring(0, colonIdx).replace(/\s+/g, '');
                const instParts = line.substring(colonIdx + 1).trim().split(/\s+/);
                const instruction = normalizeHarmonyInstruction(convertDecImmToHex(instParts.slice(1).join(' ')));
                addrArray.push(`0x${addr}`);
                sourceLines.push(state.currentSourceLine);
                resultString += `{"addr":"0x${addr}", "instruction":"${instruction}"},`;
            } else {
                state.currentSourceLine = line.trim().replace(/^;\s*/, '');
            }
        }
    }
    if (!state.isInTargetRange && line.startsWith(target)) {
        state.isInTargetRange = true;
    }
}

function processCloseData(rl, fsRS, func, elfName, vaddr, sessionId, addrArray, sourceLines) {
    rl.on('close', () => {
        fsRS.close();
        if (addrArray.length === 0) {
            const msg = `No addresses found in the target range for elfName:"${elfName}" and vaddr:"${vaddr}".`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        let finalResult = '[';
        for (let i = 0; i < addrArray.length; i++) {
            const addr = addrArray[i];
            const instructionMatch = resultString.match(new RegExp(`{"addr":"${addr}", "instruction":"([^"]+)"`));
            const instruction = instructionMatch ? instructionMatch[1] : '';
            const source = sourceLines[i] || '??:?';
            finalResult += `{"addr":"${addr}", "instruction":"${instruction}", "sourceLine":"${source}"},`;
        }
        finalResult = finalResult.slice(0, -1) + ']';
        sendMsg(sessionId, QUERY_BACK_CMD, { code: 0, message: finalResult, func, elfName });
    });
}

/*
 * 将信息发送至 HiSmartPerf-Host
 */
function sendMsg(sessionId, cmd, message) {
    const app = require('../app.js');
    let jsonString = JSON.stringify({
        resultCode: message.code,
        resultMessage: message.message,
        elfName: message.elfName ? message.elfName : '',
        functionName: message.func ? message.func : '',
        anFileOff: message.off ? message.off : ''
    });
    app.sendMsgToClient(TypeManage.TypeConfig.DISASSEMBLY_TYPE, sessionId, cmd, textEncoder.encode(jsonString));
}

// 删除session对应的文件
function clear(sessionId) {
    try {
        const sessionTempDir = path.join(TEMP_DIR, `session_${sessionId}`);

        if (fs.existsSync(sessionTempDir)) {
            fs.rmSync(sessionTempDir, { recursive: true, force: true });
            logger.info(`清理会话临时目录: ${sessionTempDir}`);
        } else {
            logger.warn(`会话临时目录不存在: ${sessionTempDir}`);
        }

        // 清理文件流映射
        if (fileStreams[sessionId]) {
            for (const fileName in fileStreams[sessionId]) {
                fileStreams[sessionId][fileName].close();
            }
            delete fileStreams[sessionId];
        }
    } catch (error) {
        logger.error(`清理会话 ${sessionId} 时出错:`, error);
    }
}

module.exports = {
    init,
};
