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

const TypeManage = require('../typeManage.js');
const WebSocket = require('ws');
const winston = require('winston');
const fs = require('fs');
const { exec } = require('child_process')
const { spawn } = require('child_process');
const path = require('path');
const $protobuf = require('protobufjs');
const heapResltRoot = $protobuf.loadSync('./proto/js_heap_result.proto');
const heapConfigRoot = $protobuf.loadSync('./proto/js_heap_config.proto');
const commonTypesRoot = $protobuf.loadSync('./proto/common_types.proto');
let cpuProfilerMsg = {
    initCmd: '',
    beginCmd: '{"id":3,"method":"Profiler.start","params":{}}',
    finishCmd: '{"id":3,"method":"Profiler.stop","params":{}}',
};
let snapshotMsg = {
    beginCmd: '',
};
let timelineMsg = {
    beginCmd: '',
    finishCmd: '{"id":2,"method":"HeapProfiler.stopTrackingHeapObjects","params":{"reportProgress":true}}',
};
const encoder = new TextEncoder();
const decode = new TextDecoder();

let sessionId = 0;
let isRecordHitrace = false;
let isRecordArkTs = false;
let isSnapshot = false;
let rmReleasefport = '';
let rmDebuggerFport = '';
let processId = '';

let maxDur = 0;
let serialNum = '';
let type = '';
let processName = '';
let snapshotTimeInterval = 0;
let cpuProfilerInterval = 0;
let captureNumericValue = false;
let trackAllocations = false;
let enableCpuProfiler = false;
let snapshotTimes = 0;
let snapshotNum = 1;
let timestamps = [];
let diffRealTimeNSec = 0;
let resultArray = [];
let dateTimeArray = [];

let output = '';
let traceName = '';
let configText = '';
let recordHitraceCmd = '';
let directoryPath = path.join(__dirname, 'output');
let fileName = 'config.text';
let filePath = path.join(directoryPath, fileName);

let arktsBuffer = new ArrayBuffer(0);
let htraceBuffer = new ArrayBuffer(0);

let snapShotDur = 0;
let snapShotCyclesNum = 0;
let tmpTimeName = 0;
let longtraceFiles = [];

// 创建logger
const logger = winston.createLogger(require('../winston.config.js'));

function init() {
    logger.info('init record plugin')
    const appjs = require('../app.js');
    appjs.pluginSystem.registerPlugin(TypeManage.TypeConfig.RECORD_ARKTS_TYPE, process);
}

function process(session_id, cmd, message) {
    sessionId = session_id;
    arktsBuffer = new ArrayBuffer(0);
    htraceBuffer = new ArrayBuffer(0);
    const params = JSON.parse(decode.decode(message));
    logger.info(`获取到 params 参数`);

    isLongTrace = params.isLongTrace;
    isRecordArkTs = params.isRecordArkTs;
    isRecordHitrace = params.isRecordHitrace;
    maxDur = params.maxDur;
    serialNum = params.serialNum;

    const maxDurMS = maxDur * 1000
    snapShotDur = params.snapShotDur;
    isSnapshot = snapShotDur > 0 ? true : false;

    snapShotCyclesNum = Math.ceil(maxDurMS / snapShotDur);
    logger.info(`snapShot 图片的数量: ${snapShotCyclesNum}`)

    console.log(params, '----------------------------params');
    type = params.type;
    processName = params.processName;
    snapshotTimeInterval = params.snapshotTimeInterval;
    cpuProfilerInterval = params.cpuProfilerInterval;
    captureNumericValue = params.captureNumericValue;
    trackAllocations = params.trackAllocations;
    enableCpuProfiler = params.enableCpuProfiler;
    snapshotTimes = Math.floor(maxDur / snapshotTimeInterval);
    logger.info(`snapshotTimeInterval: ${snapshotTimeInterval}`);
    logger.info(`snapshotTimes: ${snapshotTimes}`)
    snapshotNum = 0;
    cpuProfilerMsg.initCmd = `{"id":3,"method":"Profiler.setSamplingInterval","params": {"interval":${cpuProfilerInterval}}`;
    snapshotMsg.beginCmd = `{ "id": 1, "method": "HeapProfiler.takeHeapSnapshot", "params": { "reportProgress": true, "captureNumericValue": ${captureNumericValue}, "exposeInternals": false } }`;
    timelineMsg.beginCmd = `{"id":1,"method":"HeapProfiler.startTrackingHeapObjects","params": {"trackAllocations": ${trackAllocations}}}`;

    output = params.output;
    traceName = output.split('/').reverse()[0];
    configText = params.htraceCmd.split('<<CONFIG')[1].split('CONFIG')[0];
    ltOutput = 'data/local/tmp/';
    killCmd = 'killall hiprofilerd hiprofiler_plugins native_daemon hiperf hiebpf hiprofiler_cmd';
    recordHitraceCmd = `hiprofiler_cmd -c /data/local/tmp/config.text  -o ${output} -t ${maxDur} -s -k`;
    totalLength = 0;

    if (isLongTrace) {
        delLongTrace()
            .then(pushConfigText)
            .then(sendLongtrace)
            .catch(error => {
                logger.error(`longtrace处理失败: ${error}`);
                const errorMsg = new Uint8Array(encoder.encode(error));
                sendMsg(errorMsg, 3);
            });
    } else {
        if (isRecordArkTs && !isRecordHitrace && !isSnapshot) {
            Promise.all([
                checkPortIfNeedRemove(),
                watchPort()
            ]).then(() => {
                recordArkts().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    generateArktsTrace().then(res => {
                        combinedBufferData();
                    }).catch((error) => {
                        logger.info(`单独抓取 arkts 报错：${error}`); // 处理错误情况
                    });
                }).catch((error) => {
                    logger.info(`单独抓取 arkts 报错：${error}`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`单独抓取 arkts 报错：${error}`); // 处理错误情况
            });
        }

        if (isRecordArkTs && !isRecordHitrace && isSnapshot) {
            Promise.all([
                checkPortIfNeedRemove(),
                watchPort(),
                mkdirForSnapshot()
            ]).then(() => {
                recordArkts().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    Promise.all([
                        generateArktsTrace(),
                        saveSnapshot()
                    ]).then(res => {
                        combinedBufferData();
                    }).catch((error) => {
                        logger.info(`单独抓取 arkts + 截图 报错：${error} 0`); // 处理错误情况
                    });
                }).catch((error) => {
                    logger.info(`单独抓取 arkts + 截图 报错：${error} 1`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`单独抓取 arkts + 截图 报错：${error} 2`); // 处理错误情况
            });
        }

        if (isRecordHitrace && !isRecordArkTs && !isSnapshot) {
            pushConfigText().then(() => {
                recordHitrace().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    receiveHiTrace().then(res => {
                        combinedBufferData();
                    }).catch((error) => {
                        logger.info(`单独抓取 hitrace 报错：${error} 0`); // 处理错误情况
                    });
                }).catch((error) => {
                    logger.info(`单独抓取 hitrace 报错：${error} 1`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`单独抓取 hitrace 报错：${error} 2`); // 处理错误情况
            });
        }

        if (isRecordHitrace && !isRecordArkTs && isSnapshot) {
            logger.info(`'isRecordHitrace': ${isRecordHitrace}`)
            Promise.all([
                pushConfigText(),
                mkdirForSnapshot()
            ]).then(() => {
                recordHitrace().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    Promise.all([
                        saveSnapshot(),
                        receiveHiTrace()
                    ]).then(res => {
                        combinedBufferData();
                    }).catch((error) => {
                        logger.info(`单独抓取 hitrace + 截图 报错：${error}`); // 处理错误情况
                    });
                }).catch((error) => {
                    logger.info(`单独抓取 hitrace + 截图 报错：${error}`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`单独抓取 hitrace + 截图 报错：${error}`); // 处理错误情况
            });
        }

        if (isRecordArkTs && isRecordHitrace && !isSnapshot) {
            Promise.all([
                checkPortIfNeedRemove(),
                watchPort(),
                pushConfigText()
            ]).then(() => {
                recordHitrace().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    Promise.all([
                        receiveHiTrace()
                    ]).then(res => {
                        generateArktsTrace();
                    }).then(res => {
                        combinedBufferData();
                    })
                }).catch((error) => {
                    logger.info(`同时抓取 hitrace 和 arkts trace 报错：${error}`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`同时抓取 hitrace 和 arkts trace 报错：${error}`); // 处理错误情况
            });
        }

        if (isRecordArkTs && isRecordHitrace && isSnapshot) {
            Promise.all([
                checkPortIfNeedRemove(),
                watchPort(),
                pushConfigText(),
                mkdirForSnapshot()
            ]).then(() => {
                recordHitrace().then(res => {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 8);
                    Promise.all([
                        saveSnapshot(),
                        receiveHiTrace()
                    ]).then(res => {
                        generateArktsTrace();
                    }).then(res => {
                        combinedBufferData();
                    })
                }).catch((error) => {
                    logger.info(`同时抓取 hitrace 和 arkts trace + 截图 报错：${error}`); // 处理错误情况
                });
            }).catch((error) => {
                logger.info(`同时抓取 hitrace 和 arkts trace + 截图 报错：${error}`); // 处理错误情况
            });
        }
    }
};

function delLongTrace() {
    return new Promise((resolve, reject) => {
        exec(`hdc shell ${killCmd}`, (error, stdout, stderr) => {
            if (error || (stderr && stderr.length > 0) || stdout.includes('[Fail]')) {
                const errorMsg = new Uint8Array(encoder.encode(stdout || error || stderr));
                sendMsg(errorMsg, 3);
                reject(-1);
                logger.error(`Failed to kill the plug-in service`);
                return;
            };
            resolve(0);
            logger.info(`Succeeded in killing the plug-in service`);
        });
        exec(`hdc shell rm -r /${ltOutput}/hiprofiler_data_*`, (error, stdout, stderr) => {
            logger.info(`delLongTrace : ${error, stdout, stderr}`)
            if (error || (stderr && stderr.length > 0) || stdout.includes('[Fail]')) {
                const errorMsg = new Uint8Array(encoder.encode(stdout || error || stderr));
                sendMsg(errorMsg, 3);
                reject(-1);
                logger.error(`Failed to deleted long_trace file`);
                return;
            };
            resolve(0);
            logger.info(`Successfully deleted long_trace file`);
        });
    });
}

function recordLongtrace() {
    return new Promise((resolve, reject) => {
        const hdc = spawn('hdc', ['-t', `${serialNum}`, 'shell', `${recordHitraceCmd}`]);
        hdc.stdout.on('data', (data) => {
            console.log(`longtrace标准输出：\n${data}`);
            if (data.includes('DONE')) {
                logger.info(`抓取 longtrace 命令执行完成`);
                const errorMsg = new Uint8Array(encoder.encode(''));
                sendMsg(errorMsg, 7);
                resolve(0);
            }
        });

        hdc.stderr.on('data', (data) => {
            logger.info(`抓取 longtrace 命令执行错误`);
            const errorMsg = new Uint8Array(encoder.encode(data));
            sendMsg(errorMsg, 3);
            reject(-1);
        });
    })
}


function listLongtraceFiles() {
    return new Promise((resolve, reject) => {
        const command = `hdc -t ${serialNum} shell ls ${ltOutput}hiprofiler_data_*`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`列出失败: ${stderr}`);
                return;
            }
            const files = stdout.split('\n').filter(file => file.trim() !== '');
            resolve(files);
            logger.info(`列出成功: ${files}`);
        });
    });
}


function sendLongtrace() {
    return new Promise((resolve, reject) => {
        longtraceFiles = [];
        recordLongtrace()
            .then(() => {
                return listLongtraceFiles()
                    .then(files => {
                        const savePath = `${directoryPath}`;
                        totalLength = files.length;
                        const transferPromises = files.map(fileName => {
                            const remoteFilePath = `${fileName}`;
                            const baseName = path.basename(remoteFilePath);
                            return transferFile(serialNum, remoteFilePath, savePath)
                                .then(() => {
                                    longtraceFiles.push({
                                        fileName: baseName,
                                        localFilePath: `${directoryPath}\\${baseName}`
                                    });
                                });
                        });
                        return Promise.all(transferPromises);
                    });
            })
            .then(() => {
                const cleanedFiles = longtraceFiles.map(file => ({
                    fileName: file.fileName.replace(/\r$/, ''),
                    localFilePath: file.localFilePath.replace(/\r$/, '')
                }));
                const readPromises = cleanedFiles.map(({ fileName, localFilePath }, index) => {
                    return readAndSendFile(fileName, localFilePath, totalLength);
                });

                return Promise.all(readPromises);
            })
            .then(() => {
                logger.info(`longtrace处理成功`);
                resolve();
            })
            .catch(error => {
                logger.error(`longtrace处理失败: ${error}`);
                reject(error);
            });
    });
}

function transferFile(serialNum, remotePath, localPath) {
    return new Promise((resolve, reject) => {
        const command = `hdc -t ${serialNum} file recv ${remotePath} ${localPath}`;
        exec(command, (error, stdout, stderr) => {
            if (stdout.includes('FileTransfer finish')) {
                resolve();
            } else if (stderr.includes('[Fail]')) {
                reject(`文件传输失败: ${stderr}`);
            }
        });
    });
}

function readAndSendFile(fileName, localFilePath, total) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(localFilePath)) {
            reject(`${fileName}不存在`);
            return;
        }
        fs.readFile(localFilePath, (err, data) => {
            if (err) {
                reject(`读取${fileName} 失败: ${err.message}`);
                return;
            }
            const fileMessage = {
                fileName,
                total,
                data: data.toString('base64')
            };
            sendMsg(new TextEncoder().encode(JSON.stringify(fileMessage)), 9);
            resolve();
        });
    });
}

function combinedBufferData() {
    let finalBuffer = new ArrayBuffer(arktsBuffer.byteLength + htraceBuffer.byteLength)
    let traceView = new Uint8Array(finalBuffer);
    traceView.set(new Uint8Array(htraceBuffer), 0);
    traceView.set(new Uint8Array(arktsBuffer), htraceBuffer.byteLength);
    sendMsg(new Uint8Array(finalBuffer), 2);
    logger.info(`将抓取trace下发客户端成功`);

    exec(`hdc -t ${serialNum} shell rm ${output}`);
    exec(`hdc -t ${serialNum} shell rm /data/local/tmp/config.text`);

    logger.info(`抓取 arkts trace 的 buffer 长度：${arktsBuffer.byteLength}`);
    logger.info(`抓取 hitrace 的 buffer 长度：${htraceBuffer.byteLength}`);
    logger.info(`抓取 arkts 和 hitrace 的 buffer 长度：${finalBuffer.byteLength}`);
}

function checkPortIfNeedRemove() {
    return new Promise((resolve, reject) => {
        exec(`hdc -t ${serialNum} fport ls`, (error, stdout, stderr) => {
            if (!stdout.includes('[Empty]')) {
                let fportList = stdout.trim().replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
                logger.info(`被占用的端口数组：${fportList}`);
                fportList.forEach(it => {
                    if (it.includes('ark')) {
                        let tcpStr = it.split('[Forward]')[0].split('tcp')[1].trim();
                        logger.info(`抓取arkts 被占用的端口：hdc -t ${serialNum} fport rm tcp${tcpStr}`);
                        exec(`hdc -t ${serialNum} fport rm tcp${tcpStr}`, (error, stdout, stderr) => {
                            logger.info(`Remrove 被占用端口调用返回信息：stdout: ${stdout},error: ${error},stderr: ${stderr}, `)
                            if (stdout.includes('Remove forward ruler success')) {
                                resolve(0);
                                logger.info(`Remrove 被占用端口成功`);
                            } else {
                                reject(-1);
                                logger.error(`Remrove 被占用端口失败`);
                            }
                        });
                    }
                })
            } else {
                resolve(0);
            }
        });
    });
}

function watchPort() {
    timestamps = [];
    diffRealTimeNSec = 0;
    return new Promise((resolve, reject) => {
        exec(`hdc -t ${serialNum} shell pidof ${processName}`, (error, stdout, stderr) => {
            if (stdout.includes('[Fail]')) {
                reject(-1);
                const errorMsg = new Uint8Array(encoder.encode(stdout));
                sendMsg(errorMsg, 3);
                logger.error(`通过 processName 查询 processId 失败信息：${errorMsg}`)
            } else if (stdout === '' || stdout.includes('pidof: Unknown')) {
                reject(-1);
                const errorMsg = new Uint8Array(encoder.encode('Ark Ts 页面输入包名不正确，请重新输入正确的包名。'));
                sendMsg(errorMsg, 3);
                logger.error(`通过 processName 查询 processId 失败信息：Ark Ts 页面输入包名不正确。`);
            } else {
                logger.info(`通过 processName 查询 processId 成功: ${stdout}`);
                processId = stdout;
                let rmReleasefportStr = `hdc -t ${serialNum} fport rm tcp:24219 ark:` + processId + '@' + processName;
                rmReleasefport = rmReleasefportStr.replace(/[\r\n]+/gm, "");
                let rmDebuggerFportStr = `hdc -t ${serialNum} fport rm tcp:24220 ark:` + processId + '@Debugger';
                rmDebuggerFport = rmDebuggerFportStr.replace(/[\r\n]+/gm, "");

                let Releasefport = `hdc -t ${serialNum} fport tcp:24219 ark:` + processId + '@' + processName;
                Releasefport = Releasefport.replace(/[\r\n]+/gm, "");
                let Debuggerfport = `hdc -t ${serialNum} fport tcp:24220 ark:` + processId + '@Debugger';
                Debuggerfport = Debuggerfport.replace(/[\r\n]+/gm, "");
                exec(Releasefport, (error, stdout, stderr) => {
                    if (stdout.includes('result:OK')) {
                        logger.info(`监听 Release fport 成功`);
                        exec(Debuggerfport, (error, stdout, stderr) => {
                            if (stdout.includes('result:OK')) {
                                logger.info(`监听 Debugger fport 成功`);
                                resolve(0);
                            } else {
                                reject(-1);
                                const errorMsg = new Uint8Array(encoder.encode(stdout));
                                sendMsg(errorMsg, 3);
                                removePort();
                                logger.error(`监听 Debugger fport 失败信息：${errorMsg}`);
                            }
                        })
                    } else {
                        reject(-1);
                        const errorMsg = new Uint8Array(encoder.encode(stdout));
                        sendMsg(errorMsg, 3);
                        removePort();
                        logger.error(`监听 Release fport 失败信息：${errorMsg}`);
                    }
                });
            }
        });
    });
}

function recordArkts() {
    return new Promise((resolve, reject) => {
        resultArray = [];
        dateTimeArray = [];
        let msRealTime = 0;
        let msMonoTime = 0;
        logger.info(`开始连接 WebSocket('ws://127.0.0.1:24220')`);
        const socket = new WebSocket('ws://127.0.0.1:24220');
        let timer = setTimeout(() => {
            const errorMsg = new Uint8Array(encoder.encode('WebSocket链接失败，请杀掉应用，然后重新打开再抓取。'));
            sendMsg(errorMsg, 3);
            removePort();
        }, 3000);
        socket.on('open', function open() {
            clearTimeout(timer);
            logger.info(`WebSocket('ws://127.0.0.1:24220') 连接成功`);
            exec(`hdc -t ${serialNum} shell timestamps`, (f_error, stdout, f_stderr) => {
                if (stdout.includes('[Fail]')) {
                    reject(stdout);
                    const errorMsg = new Uint8Array(encoder.encode(stdout));
                    sendMsg(errorMsg, 3);
                    removePort();
                    logger.error(`查询 timestamps 命令执行失败原因：${errorMsg}`);
                } else {
                    logger.info(`查询 timestamps 命令执行成功：${stdout}`);
                    timestamps = stdout.trim().replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
                    let realTime = timestamps[0].split(':')[1].split('.');
                    msRealTime = Number(realTime[0].trim() + '' + realTime[1]);
                    let monoTime = timestamps[3].split(':')[1].split('.');
                    msMonoTime = Number(monoTime[0].trim() + '' + monoTime[1]);
                    let nowDate = new Date().getTime() * 1000000;
                    diffRealTimeNSec = nowDate - msRealTime;
                    const durTime = maxDur * 1000;
                    if (!isRecordHitrace) {
                        const errorMsg = new Uint8Array(encoder.encode('tracing...'));
                        sendMsg(errorMsg, 6);
                    }
                    if (isSnapshot && !isRecordHitrace) {
                        snapshotImages();
                    }
                    if (type === 'cpuProf') {
                        logger.info('开始抓取 cpuProf arkts trace');
                        socket.send(cpuProfilerMsg.initCmd);
                        socket.send(cpuProfilerMsg.beginCmd);
                        let timer = setTimeout(() => {
                            socket.send(cpuProfilerMsg.finishCmd);
                            logger.info(`清理 setTimeout 定时器`);
                            clearTimeout(timer);
                        }, durTime);
                    }
                    if (type === 'snapshot') {
                        logger.info('开始抓取 snapshot arkts trace', snapshotTimeInterval * 1000)
                        socket.send(snapshotMsg.beginCmd);
                        let times = setInterval(() => {
                            socket.send(snapshotMsg.beginCmd);
                            snapshotNum++;
                            if (snapshotNum === snapshotTimes) {
                                clearInterval(times);
                            }
                        }, snapshotTimeInterval * 1000);
                    }
                    if (type === 'timeline') {
                        logger.info('开始抓取 timeline arkts trace')
                        socket.send(timelineMsg.beginCmd);
                        setTimeout(() => {
                            socket.send(timelineMsg.finishCmd);
                        }, durTime);
                    }
                    if (type === 'cpuProf_snapshot') {
                        logger.info(`开始抓取 cpuProf_snapshot arkts trace ${snapshotTimeInterval * 1000} durTime ${durTime}`)
                        socket.send(cpuProfilerMsg.initCmd);
                        socket.send(cpuProfilerMsg.beginCmd);
                        socket.send(snapshotMsg.beginCmd);
                        let times = setInterval(() => {
                            socket.send(snapshotMsg.beginCmd);
                            snapshotNum++;
                            logger.info(`snapshotNum: ${snapshotNum}`);
                            if (snapshotNum === snapshotTimes) {
                                logger.info('cpuProf_snapshot clearInterval(times)')
                                clearInterval(times);
                            }
                        }, snapshotTimeInterval * 1000);
                        setTimeout(() => {
                            logger.info('socket.send(cpuProfilerMsg.finishCmd)');
                            socket.send(cpuProfilerMsg.finishCmd);
                        }, durTime);
                    }
                    if (type === 'cpuProf_timeline') {
                        logger.info('开始抓取 cpuProf_timeline arkts trace')
                        socket.send(cpuProfilerMsg.initCmd);
                        socket.send(cpuProfilerMsg.beginCmd);
                        socket.send(timelineMsg.beginCmd);
                        setTimeout(() => {
                            socket.send(timelineMsg.finishCmd);
                            socket.send(cpuProfilerMsg.finishCmd);
                        }, durTime);
                    }

                }
            })
        });
        socket.on('error', function error(err) {
            reject(`WebSocket('ws://127.0.0.1:24220') 错误：${err}`);
            logger.error(`WebSocket('ws://127.0.0.1:24220') 错误：${err}`);
            const errorMsg = new Uint8Array(encoder.encode(err));
            sendMsg(errorMsg, 3);
            removePort();
        });
        // 当WebSocket接收到服务器发送的消息时，会触发onmessage事件
        socket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            resultArray.push(event.data);
            dateTimeArray.push(new Date().getTime() * 1000000 - diffRealTimeNSec);

            if (type.includes('cpuProf') && data.id == 3 && Object.keys(data.result).length > 0) {
                logger.info(`${type} : arkts 抓取完成`);
                let cpuProfStartTime = data.result.profile.startTime * 1000;
                let cpuProfEndTime = data.result.profile.endTime * 1000;
                let cpuProfRealStartTime = msRealTime + cpuProfStartTime - msMonoTime;
                let cpuProfRealEndTime = msRealTime + cpuProfEndTime - msMonoTime;
                dateTimeArray[0] = cpuProfRealStartTime;
                dateTimeArray[dateTimeArray.length - 1] = cpuProfRealEndTime;
                resolve(0);
                if (!isRecordHitrace) {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 7);
                }
            }
            if (type === 'snapshot' && data.id == 1 && Object.keys(data.result).length === 0 && snapshotNum === snapshotTimes) {
                logger.info(`${type} : arkts 抓取完成`);
                resolve(0);
                if (!isRecordHitrace) {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 7);
                }
            }
            if (type === 'timeline' && data.id == 2 && Object.keys(data.result).length === 0) {
                logger.info(`${type} : arkts 抓取完成`);
                resolve(0);
                if (!isRecordHitrace) {
                    const errorMsg = new Uint8Array(encoder.encode('Done'));
                    sendMsg(errorMsg, 7);
                }
            }
        };
        // 当WebSocket的连接关闭时，会触发onclose事件
        socket.onclose = function (event) {
            logger.info(`WebSocket('ws://127.0.0.1:24220') 连接已关闭`);
            logger.info(`arkts 接收到的数据条数：${resultArray.length}`);
            logger.info(`arkts 接收到的数据时间条数：${dateTimeArray.length}`);
        };
    })
}

function generateArktsTrace() {
    return new Promise((resolve, reject) => {
        logger.info('生成 arkts buffer 数据开始');
        let dataLen = 0;
        let finalBufferArr = [];
        resultArray.forEach((it, idx) => {
            const millis = dateTimeArray[idx];
            const seconds = Math.floor(millis / 1000000000); // 转换成秒
            const nanos = Number(millis.toString().split('').reverse().slice(0, 9).reverse().join('')); // 转换成纳秒
            let bytes = encoder.encode(it);
            let ArkTSResult = heapResltRoot.lookupType('js_heap_result.ArkTSResult');
            let arkTsResltObj = ArkTSResult.fromObject({ result: bytes });
            let ProfilerPluginData = commonTypesRoot.lookupType('common_types.ProfilerPluginData');
            let profilerPluginDataObj = ProfilerPluginData.fromObject({
                data: ArkTSResult.encode(arkTsResltObj).finish(),
                name: 'arkts-plugin',
                tvSec: $protobuf.util.Long.fromNumber(seconds, true),
                tvNsec: $protobuf.util.Long.fromNumber(nanos, true),
            });

            let buffer = ProfilerPluginData.encode(profilerPluginDataObj).finish();
            finalBufferArr.push(buffer);
            dataLen += (buffer.length + 4);
        })

        let ArkTSConfig = heapConfigRoot.lookupType('js_heap_config.ArkTSConfig');
        let typeEnum = type.includes('snapshot') ? ArkTSConfig.HeapType.SNAPSHOT
            : type.includes('timeline') ? ArkTSConfig.HeapType.TIMELINE : ArkTSConfig.HeapType.INVALID;
        let arkTSConfigObj = ArkTSConfig.fromObject({
            pid: processId,
            type: typeEnum,
            interval: snapshotTimeInterval,
            captureNumericValue: captureNumericValue,
            trackAllocations: trackAllocations,
            cpuProfilerInterval: cpuProfilerInterval,
            enableCpuProfiler: enableCpuProfiler,
        })
        let ProfilerPluginData = commonTypesRoot.lookupType('common_types.ProfilerPluginData');
        let profilerPluginDataObj = ProfilerPluginData.fromObject({
            data: ArkTSConfig.encode(arkTSConfigObj).finish(),
            name: 'arkts-plugin_config'
        });
        let arkTSConfigBuffer = ProfilerPluginData.encode(profilerPluginDataObj).finish();

        // trace的总长度
        let finalLength = dataLen + arkTSConfigBuffer.length + 1028;

        let traceBuffer = new ArrayBuffer(finalLength);
        let traceView = new Uint8Array(traceBuffer);
        let traceDataview = new DataView(traceBuffer);

        let headerBuffer = new Uint8Array([79, 72, 79, 83, 80, 82, 79, 70, 111, 210, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 8, 0, 0, 0, 201, 195, 138, 20, 181, 249, 101, 247, 80, 50, 171, 217,
            139, 133, 147, 69, 49, 82, 56, 243, 232, 201, 38, 239, 192, 241, 85, 223, 9, 148, 238, 213, 0, 0, 0, 0, 59, 77, 146, 229, 89, 0, 0, 0, 32, 120, 33, 249, 65, 7, 121, 23, 28, 5, 193,
            248, 65, 7, 121, 23, 67, 79, 146, 229, 89, 0, 0, 0, 121, 218, 49, 229, 89, 0, 0, 0, 79, 81, 146, 229, 89, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,])
        let headerView = new DataView(headerBuffer.buffer);
        const segmentNum = resultArray.length * 2;
        headerView.setUint32(8, finalLength, true); //重写 length
        headerView.setUint32(20, segmentNum, true); // 重写segment

        timestamps.forEach(ts => {
            let timeArr = ts.split(':')[1].split('.');
            let timeStr = timeArr[0].trim() + timeArr[1];
            let clockType = ts.split(':')[0].trim();
            if (clockType === 'CLOCK_BOOTTIME') {
                logger.info(`CLOCK_BOOTTIME;${timeStr}`)
                headerView.setBigUint64(60, BigInt(timeStr), true);
            } else if (clockType === 'CLOCK_REALTIME') {
                headerView.setBigUint64(68, BigInt(timeStr), true);
            } else if (clockType === 'CLOCK_REALTIME_COARSE') {
                headerView.setBigUint64(76, BigInt(timeStr), true);
            } else if (clockType === 'CLOCK_MONOTONIC') {
                headerView.setBigUint64(84, BigInt(timeStr), true);
            } else if (clockType === 'CLOCK_MONOTONIC_COARSE') {
                headerView.setBigUint64(92, BigInt(timeStr), true);
            } else if (clockType === 'CLOCK_MONOTONIC_RAW') {
                headerView.setBigUint64(100, BigInt(timeStr), true);
            }
        })

        traceView.set(new Uint8Array(headerBuffer.buffer), 0);
        traceDataview.setUint32(1024, arkTSConfigBuffer.length, true);
        traceView.set(arkTSConfigBuffer, 1028);

        let lenNumber = 1024 + 4 + arkTSConfigBuffer.length;
        for (let i = 0; i < finalBufferArr.length; i++) {
            let buffer = finalBufferArr[i];
            traceDataview.setUint32(lenNumber, buffer.length, true);
            traceView.set(buffer, lenNumber + 4);
            lenNumber += (buffer.length + 4);
        }
        arktsBuffer = traceBuffer;
        resolve(0);
        logger.info('生成 arkts buffer 数据结束')
        removePort();
        // sendMsg(traceView, 4);
    })
}

function removePort() {
    exec(rmReleasefport);
    exec(rmDebuggerFport);
    logger.info(`Remove Releasefport DebuggerFport 成功`);
}

function pushConfigText() {
    logger.info('pushConfigText')
    return new Promise((resolve, reject) => {
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
            // 将Buffer数据写入文件
            fs.writeFile(filePath, configText, (writeErr) => {
                if (writeErr) {
                    reject(writeErr);
                    const errorMsg = new Uint8Array(encoder.encode(writeErr));
                    sendMsg(errorMsg, 3);
                    logger.error(`config.text 文件保存失败`);
                };
                logger.info(`config.text 文件保存成功`);
            });

            if (err) {
                reject(err);
                const errorMsg = new Uint8Array(encoder.encode(err));
                sendMsg(errorMsg, 3);
                logger.error(`生成 output 目录文件夹失败`);
            };
        });
        // 将config文件推入手机里
        logger.info(`config.text 文件推入手机开始`);
        let cmd = `hdc -t ${serialNum} file send ${filePath} /data/local/tmp/config.text`;
        exec(cmd, (error, stdout, stderr) => {
            if (stdout.includes('FileTransfer finish')) {
                logger.info(`config.text 文件推入手机结束`);
                resolve(0);
            } else if (stdout.includes('[Fail]')) {
                reject(stdout);
                const errorMsg = new Uint8Array(encoder.encode(stdout));
                sendMsg(errorMsg, 3);
                logger.error(`config.text 文件推入手机失败报错信息 ： ${errorMsg}`);
            }
        });
    });
}

function recordHitrace() {
    return new Promise((resolve, reject) => {
        logger.info(`开始执行 hitrace 抓取命令: ${recordHitraceCmd}`);
        const hdc = spawn('hdc', ['-t', `${serialNum}`, 'shell', `${recordHitraceCmd}`]);
        // 处理hdc的标准输出流
        hdc.stdout.on('data', (data) => {
            console.error(`标准错误输出：\n${data}`);
            logger.info(`处理hdc的标准输出流: \n${data}`);
            if (data.includes('tracing ')) {
                logger.info(`抓取 hitrace 命令执行结果: tracing...`);
                const errorMsg = new Uint8Array(encoder.encode('tracing...'));
                sendMsg(errorMsg, 6);
                if (isSnapshot) {
                    snapshotImages();
                }
                if (isRecordArkTs) {
                    recordArkts().then(res => {
                        logger.info('recordArkts() 执行完成');
                    }).catch(err => {
                        logger.info(`抓取 Arkts 命令执行错误`);
                        const errorMsg = new Uint8Array(encoder.encode(err));
                        sendMsg(errorMsg, 3);
                        reject(-1);
                    })
                }
            }
            if (data.includes('DONE')) {
                logger.info(`抓取 hitrace 命令执行完成`);
                const errorMsg = new Uint8Array(encoder.encode(''));
                sendMsg(errorMsg, 7);
                resolve(0);
            }
        });

        // 处理hdc的标准错误流
        hdc.stderr.on('data', (data) => {
            logger.info(`抓取 hitrace 命令执行错误`);
            const errorMsg = new Uint8Array(encoder.encode(data));
            sendMsg(errorMsg, 3);
            reject(-1);
        });
    })
}

function receiveHiTrace() {
    return new Promise((resolve, reject) => {
        // 从手机里读取抓的trace文件到本地目录
        logger.info(`读取 hitrace 文件到本地目录开始`);
        exec(`hdc -t ${serialNum} file recv ${output} ${directoryPath}`, (error, stdout, stderr) => {
            if (stdout.includes('FileTransfer finish')) {
                logger.info(`读取 hitrace 文件到本地目录结束`);
                htraceBuffer = fs.readFileSync(`${directoryPath}\\${traceName}`);
                resolve(0);
            } else if (stdout.includes('[Fail]')) {
                reject(stdout);
                const errorMsg = new Uint8Array(encoder.encode(stdout));
                sendMsg(errorMsg, 3);
                logger.error(`读取 hitrace 文件到本地目录失败报错信息 ： ${errorMsg}`);
            }
        });
    });
}

function mkdirForSnapshot() {
    new Promise((resolve, reject) => {
        //定义一个时间戳
        tmpTimeName = new Date().getTime();
        imageFileName = tmpTimeName;
        logger.info(`创建截图文件夹指令，tmpTimeName：${tmpTimeName}`);
        let cmd = `hdc -t ${serialNum} shell mkdir /data/local/tmp/snapshot_${tmpTimeName}`;
        logger.info(`创建截图文件夹指令，cmd：${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            logger.info(`mkdirForSnapshot : ${error, stdout, stderr}`)
            if (error || (stderr && stderr.length > 0) || stdout.includes('[Fail]')) {
                const errorMsg = new Uint8Array(encoder.encode(stdout || error || stderr));
                sendMsg(errorMsg, 3);
                reject(-1);
                logger.error(`Failed to mkdir`);
                return;
            };
            resolve(0);
            logger.info(`创建文件夹成功,cmd:${cmd}`);
        });
    });
}

function snapshotImages() {
    logger.info('Snapshot 截图开始');
    let int = 1;
    let interval = setInterval(() => {
        if (int > snapShotCyclesNum) {
            logger.info('Snapshot 截图结束');
            clearInterval(interval);
            return;
        }
        try {
            let currentTime = new Date().getTime();
            let snapshotName = `snapshot_${int}_${currentTime}`;
            snapshot(snapshotName);
        } catch (error) {
            console.log('截图失败', error);
        }
        int++;
    }, snapShotDur);
}

//执行截图命令
function snapshot(snapshotName) {
    let command = `hdc -t ${serialNum} shell snapshot_display -f /data/local/tmp/snapshot_${tmpTimeName}/${snapshotName}.jpeg`;
    try {
        exec(command, (error, stdout, stderr) => {
            if (error || (stderr && stderr.length > 0) || stdout.includes('[Fail]')) {
                const errorMsg = new Uint8Array(encoder.encode(stdout || error || stderr));
                sendMsg(errorMsg, 3);
                reject(-1);
            };
        })
    } catch (error) {
        reject(error)
    }
}

function saveSnapshot() {
    return new Promise((resolve, reject) => {
        let imagePath = path.join(__dirname, 'image');
        let dirPath = path.dirname(imagePath);
        let command = `hdc -t ${serialNum} file recv data/local/tmp/snapshot_${tmpTimeName} ${dirPath}`;
        exec(command, (error, stdout, stderr) => {
            if (error || (stderr && stderr.length > 0) || stdout.includes('[Fail]')) {
                const errorMsg = new Uint8Array(encoder.encode(stdout || error || stderr));
                sendMsg(errorMsg, 3);
                reject(-1);
                return;
            };
            logger.info(`saveSnapshot(tmpTimeName) : ${stdout}`);
            if (stdout.includes('FileTransfer finish')) {
                logger.info(`保存截图完成`);
                getSnapShotData(resolve, reject);
                exec(`hdc -t ${serialNum} shell rm data/local/tmp/snapshot_${tmpTimeName}`);
            }
        });
    })
}

async function getSnapShotData(resolve, reject) {
    logger.info(`图片下发开始`)
    const dir = path.join(__dirname, `snapshot_${imageFileName}`);
    try {
        const files = await fs.promises.readdir(dir);
        files.sort((a, b) => {
            const timeA = extractTimeFunc(a);
            const timeB = extractTimeFunc(b);
            return timeA - timeB;
        });
        const imageList = [];
        for (const file of files) {
            const filePath = path.join(dir, file);
            const data = await fs.promises.readFile(filePath);
            const img = data.toString('base64');
            imageList.push(`data:image/jpeg;base64,${img}`);
        }
        const traceView = new TextEncoder().encode(JSON.stringify(imageList));
        sendMsg(traceView, 5);
        logger.info(`图片下发完成`)
        resolve(0);
        delSnapshotFolder();
    } catch (err) {
        const errorMsg = new Uint8Array(encoder.encode(err));
        sendMsg(errorMsg, 3);
        reject(-1);
    }
}

function extractTimeFunc(filename) {
    const match = filename.match(/snapshot_[^_]*_(\d+)\.\w+/);
    if (match) {
        return parseInt(match[1], 10);
    } else {
        console.error(`Invalid filename format: ${filename}`);
    }
}

async function delSnapshotFolder() {
    try {
        const entries = await fs.promises.readdir(__dirname, { withFileTypes: true });
        for (const entry of entries) {
            const fullpath = path.join(__dirname, entry.name);
            if (entry.isDirectory() && entry.name.startsWith('snapshot_')) {
                await fs.promises.rm(fullpath, { recursive: true });
                logger.info(`delSnapshotFolder`);
            }
        }
    } catch (err) {
        console.log(`Error reading directory: ${err}`);
    }
}

function sendMsg(traceView, cmd) {
    const app = require('../app.js');
    app.sendMsgToClient(TypeManage.TypeConfig.RECORD_ARKTS_TYPE, sessionId, cmd, traceView);
}

module.exports = {
    init
}