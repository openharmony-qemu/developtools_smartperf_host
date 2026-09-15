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
const { exec } = require('child_process');
const TypeManage = require('../typeManage.js');
const readline = require('readline');
const { promisify } = require('util');
const winston = require('winston');
const execAsync = promisify(exec);
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

// objdump.exe、addr2line.exe路径，固定在项目根目录下
const objdumpPath = path.join(__dirname, '../bin/objdump.exe');
const addr2linePath = path.join(__dirname, '../bin/addr2line.exe');
let resultString = '';

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
    const soInfoTxt = path.join(sessionTempDir, `${fileName.replace('.', '_')}.txt`);
    fs.writeFileSync(soInfoTxt, '', { encoding: 'utf8' });
    exec(`${objdumpPath} -d --section=.text ${tempFilePath} >${soInfoTxt}`, (iError, iStdOut, iStdErr) => {
        if (iError || iStdErr) {
            const msg = `SoTxtBuildError(Build Disassembly txt for file:"${fileName}" Error!): [${iError ? iError.message : iStdErr.toString()}]`;
            logger.error('异常：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
        }
    });
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

function processAnFileFindTextName(sessionId, vaddr, func, textName, anFilePath, elfName, eaddr) {
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
  exec(`${objdumpPath} -d ${anFilePath} --start-address=0x${parseInt(vaddr).toString(16)} --stop-address=0x${eaddr.toString(16)}`,
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
        let instruction = ca.split(`:`)[1];
        instruction = instruction.substring(instruction.indexOf(' '));
        instruction = instruction.replace(/\s+/g, ' ').trim();
        ans += `{\"addr\":\"0x${addr}\", \"instruction\":\"${instruction}\"},`;
      }
      sendMsg(sessionId, QUERY_BACK_CMD, { code: 0, message: `[${ans.slice(0, -1)}]`, off: textAddrOff });
    });
}

/**
 * 提取an汇编代码
 */
function extractInfoFromAnTxt(func, elfName, vaddr, sessionId, anFilePath) {
  exec(`${objdumpPath} -t ${anFilePath} | findstr ${func}`,
    (outerError, outerStdOut, outerStdErr) => {
        if (outerError || (outerStdErr && outerStdErr.length > 0)) {
            const msg = `OuterExecError(In Using 'findstr' searching func:"${func}" ` +
                `from file:"${elfName}" to get func-size for calculating the stop-address in needing): [` +
                `${outerError ? outerError.message : outerStdErr.toString()}]`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        if (outerStdOut === '') {
            const msg = `OuterExecError(Return '' when searching func:"${func}" ` +
                `from file:"${elfName}" and got nothing!)`;
            logger.error('error：' + msg);
            sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
            return;
        }
        let eaddr = 0;
        let textName = '';
        for (let i of outerStdOut.split('\n')) {
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
    });
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
  const state = { isInTargetRange: false };
  resultString = '';
  let addrArray = [];
  rl.on('line', (line) => {
      try {
          processSoLine(line, state, prefix, target, rl, addrArray);
      } catch (error) {
          const errMsg = `Reading failed.Error):[${error.message}]`;
      }
  });
  processCloseData(rl, fsRS, func, elfName, vaddr, sessionId, addrArray);
}

function processSoLine(line, state, prefix, target, rl, addrArray) {
    if (state.isInTargetRange) {
        if (line.startsWith(prefix)) {
            state.isInTargetRange = false;
            rl.close();
        } else if (line.trim() !== '') {
            const [addressPart, instructionPart] = line.split(':');
            const addr = addressPart.replace(/\s+/g, '');
            const instruction = instructionPart.substring(instructionPart.indexOf(' ')).replace(/\s+/g, ' ').trim();
            addrArray.push(`0x${addr}`);
            resultString += `{"addr":"0x${addr}", "instruction":"${instruction}"},`;
        }
    }
    if (!state.isInTargetRange && line.startsWith(target)) {
        state.isInTargetRange = true;
    }
}

function processCloseData(rl, fsRS, func, elfName, vaddr, sessionId, addrArray) {
  rl.on('close', async () => {
      fsRS.close();
      if (addrArray.length === 0) {
          const msg = `No addresses found in the target range for elfName:"${elfName}" and vaddr:"${vaddr}".`;
          logger.error('error：' + msg);
          sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg });
          return;
      }
      // Limit the number of addresses per batch
      const MAX_BATCH_SIZE = 500;
      const addressBatches = splitIntoChunks(addrArray, MAX_BATCH_SIZE);
      // Array to hold all source lines
      let allSourceLines = [];
      try {
          // Execute addr2line for the current batch and  Append to allSourceLines
          for (const [index, batch] of addressBatches.entries()) {
              const batchArgs = batch.map(addr => `${addr}`).join(' ');

              // Execute addr2line for the current batch
              const soFilePath = path.join(TEMP_DIR, `session_${sessionId}`, elfName);
              const sourceLines = await executeAddr2line(batchArgs, soFilePath);

              // Append to allSourceLines
              allSourceLines = allSourceLines.concat(sourceLines);
          }
          // After processing all batches, verify the total number of source lines
          if (allSourceLines.length !== addrArray.length) {
              const msg = `MismatchError: Total number of addr2line outputs (${allSourceLines.length}) does not match number of addresses (${addrArray.length}).`;
              logger.error('error：' + msg);
              sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg, func, elfName });
              return;
          }
          // Combine the source lines with the existing resultString
          let finalResult = '[';
          for (let i = 0; i < addrArray.length; i++) {
              const addr = addrArray[i];
              const instructionMatch = resultString.match(new RegExp(`{"addr":"${addr}", "instruction":"([^"]+)"`));
              const instruction = instructionMatch ? instructionMatch[1] : '';
              const source = allSourceLines[i].trim() !== '??' ? allSourceLines[i].trim() : 'Source not found';
              finalResult += `{"addr":"${addr}", "instruction":"${instruction}", "sourceLine":"${source}"},`;
          }
          finalResult = finalResult.slice(0, -1) + ']'; // Remove the trailing comma and close the array
          sendMsg(sessionId, QUERY_BACK_CMD, { code: 0, message: finalResult, func, elfName });
      } catch (error) {
          const msg = `AddrError(addr2line -e ${elfName} Error): [${error.message}]`;
          logger.error('error：' + msg);
          sendMsg(sessionId, QUERY_BACK_CMD, { code: 1, message: msg, func, elfName });
      }
  });
}

/**
 * Helper function to split an array into chunks of a specified size
 * @param {Array} array - The array to split
 * @param {number} chunkSize - The maximum size of each chunk
 * @returns {Array[]} - An array of chunks
 */
function splitIntoChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Helper function to execute addr2line for a batch of addresses
 * @param {string} batchArgs - A string of space-separated addresses
 * @param {string} soFilePath - Path to the .so file
 * @returns {Promise<string[]>} - Resolves to an array of source lines
 */
async function executeAddr2line(batchArgs, soFilePath) {
    try {
        // Execute addr2line and capture both stdout and stderr
        const { stdout, stderr } = await execAsync(`${addr2linePath} -e ${soFilePath} ${batchArgs}`);

        if (stderr && stderr.trim().length > 0) {
            throw new Error(stderr.trim());
        }

        // Split stdout by newlines to get individual source lines
        return stdout.trim().split('\n');
    } catch (error) {
        throw error;
    }
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
