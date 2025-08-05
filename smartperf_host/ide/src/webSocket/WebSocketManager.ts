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
import { Utils, MessageParam } from './Util';
import { Constants, TypeConstants } from './Constants';

// 状态枚举
enum GetStatuses {
    UNCONNECTED = 'unconnected', // 服务器未连接
    CONNECTED = 'connected', // 服务器已连接
    LOGINED = 'logined', // 已登录
    LOGINFAILEDBYLACKSESSION = 'loginFailedByLackSession', // session已满
    UPFRADING = 'upgrading', // 正在升级
    UPGRADESUCCESS = 'upgradeSuccess', // 升级成功
    UPGRADEFAILED = 'upgradeFailed', // 升级失败
    READY = 'ready' // 服务与扩展程序准备就绪
}
const INTERMEDIATE_STATE = 'Intermediate state';
const FAILED_STATE = 'Failed state';


export class WebSocketManager {
    static instance: WebSocketManager | null | undefined = null;
    url: string = `ws://localhost:${Constants.NODE_PORT}`;
    private websocket: WebSocket | null | undefined = null;
    private distributeMap: Map<number, { 'messageCallbacks': Function[], 'eventCallBack': Function }> = new Map<number, { 'messageCallbacks': Function[], 'eventCallBack': Function }>();
    private sessionId: number | null | undefined;
    private session: bigint | null | undefined;
    private heartbeatInterval: number | null | undefined;
    public status: string = GetStatuses.UNCONNECTED;
    private cacheInfo: Map<number, unknown> = new Map<number, unknown>();
    private reconnect: number = -1;
    private connectStatus: HTMLElement | null | undefined;

    constructor() {
        if (WebSocketManager.instance) {
            return WebSocketManager.instance;
        }
        WebSocketManager.instance = this;
        //连接websocket
        this.connectWebSocket();
    }
    //连接WebSocket
    connectWebSocket(): void {
        // @ts-ignore
        this.connectStatus = document.querySelector("body > sp-application").shadowRoot.querySelector("#main-menu").shadowRoot.querySelector("div.bottom > div.extend_connect");
        this.websocket = new WebSocket(this.url);
        this.websocket.binaryType = 'arraybuffer';
        this.websocket.onopen = (): void => {
            this.status = GetStatuses.CONNECTED;
            // 设置心跳定时器
            this.sendHeartbeat();
            // 连接后登录
            this.login();
        };

        //接受webSocket的消息
        this.websocket.onmessage = (event): void => {
            // 先解码
            let decode: MessageParam = Utils.decode(event.data);
            if (decode.type === TypeConstants.HEARTBEAT_TYPE) {
                return;
            }
            this.onmessage(decode!);
        };

        this.websocket.onerror = (error): void => {
            console.error('error:', error);
            this.extendTips(false);
        };

        this.websocket.onclose = (event): void => {
            this.status = GetStatuses.UNCONNECTED;
            this.extendTips(false);
            this.finalStatus();
            //初始化标志位
            this.initLoginInfo();
            this.clearHeartbeat();
        };
    }


    /**
     * 接收webSocket返回的buffer数据
     * 分别处理登录、其他业务的数据
     * 其他业务数据分发
     */
    onmessage(decode: MessageParam): void {
        if (decode.type === TypeConstants.LOGIN_TYPE) { // 先登录
            this.loginMessage(decode);
        } else if (decode.type === TypeConstants.UPDATE_TYPE) {// 升级
            this.updateMessage(decode);
        } else {// type其他
            this.businessMessage(decode);
        }
    }

    // 扩展服务连接状态提示
    extendTips(flag: boolean): void {
        if(flag) {
            // @ts-ignore
            this.connectStatus?.style.backgroundColor = 'green';
            // @ts-ignore
            this.connectStatus?.title = 'The extended service is connected.';
        }else{
            // @ts-ignore
            this.connectStatus?.style.backgroundColor = 'red';
            // @ts-ignore
            this.connectStatus?.title = 'The extended service is not connected.';
        }
    }

    // 登录
    loginMessage(decode: MessageParam): void {
        if (decode.cmd === Constants.LOGIN_CMD) {
            this.status = GetStatuses.LOGINED;
            this.sessionId = decode.session_id;
            this.session = decode.session;
            //检查版本
            this.getVersion();
        } else if (decode.cmd === Constants.SESSION_EXCEED) { // session满了
            this.status = GetStatuses.LOGINFAILEDBYLACKSESSION;
            this.finalStatus();
        }
    }

    // 升级
    updateMessage(decode: MessageParam): void {
        if (decode.cmd === Constants.GET_VERSION_CMD) {
            // 小于则升级
            let targetVersion = '1.1.4';
            let currentVersion = new TextDecoder().decode(decode.data);
            let result = this.compareVersion(currentVersion, targetVersion);
            if (result === -1) {
                this.status = GetStatuses.UPFRADING;
                this.updateVersion();
                return;
            }
            this.status = GetStatuses.READY;
            this.extendTips(true);
            this.finalStatus();
        } else if (decode.cmd === Constants.UPDATE_SUCCESS_CMD) { // 升级成功
            this.status = GetStatuses.UPGRADESUCCESS;
            this.finalStatus();
        } else if (decode.cmd === Constants.UPDATE_FAIL_CMD) { // 升级失败
            this.status = GetStatuses.UPGRADEFAILED;
            this.finalStatus();
        }
    }

    // 业务
    businessMessage(decode: MessageParam): void {
        if (this.distributeMap.has(decode.type!)) {
            const callbackObj = this.distributeMap.get(decode.type!)!;
            // 遍历调用所有 eventCallBacks
            callbackObj.messageCallbacks.forEach(callback => {
                callback(decode.cmd, decode.data);
            });
        }
    }

    // get版本
    getVersion(): void {
        // 获取扩展程序版本
        this.send(TypeConstants.UPDATE_TYPE, Constants.GET_VERSION_CMD);
    }

    //check版本
    compareVersion(currentVersion: string, targetVersion: string): number {
        // 将版本字符串分割成数组
        let parts1 = currentVersion.split('.');
        let parts2 = targetVersion.split('.');

        // 遍历数组，各部分进行比较
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            let currentNum = i < parts1.length ? parseInt(parts1[i], 10) : 0;
            let targetNum = i < parts2.length ? parseInt(parts2[i], 10) : 0;

            // 比较
            if (currentNum > targetNum) {// 无需更新
                return 1;
            } else if (currentNum < targetNum) { // 需要更新
                return -1;
            }
        }
        return 0; // 无需更新
    }

    // 更新扩展程序
    updateVersion(): void {
        // 扩展程序升级
        let url = `https://${window.location.host.split(':')[0]}:${window.location.port
            }${window.location.pathname}extend/hi-smart-perf-host-extend-update.zip`;
        fetch(url).then(response => {
            if (!response.ok) {
                throw new Error('No corresponding upgrade compression package found');
            }
            return response.arrayBuffer();
        }).then((arrayBuffer) => {
            this.send(TypeConstants.UPDATE_TYPE, Constants.UPDATE_CMD, new Uint8Array(arrayBuffer));
        }).catch((error) => {
            this.status = GetStatuses.UPGRADEFAILED;
            this.finalStatus();
            console.error(error);
        });
    }

    // 登录
    login(): void {
        this.websocket!.send(Utils.encode(Constants.LOGIN_PARAM));
    }

    // 模块调
    static getInstance(): WebSocketManager | null | undefined {
        if (!WebSocketManager.instance) {
            new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    /** 
     * 消息监听器
     * listener是不同模块传来接收数据的函数
     * 模块调用
    */
    registerMessageListener(type: number, callback: Function, eventCallBack: Function, allowMultipleCallback: boolean = false): void {
        let callbackObj = this.distributeMap.get(type);
        if (!callbackObj) {
            callbackObj = {
                messageCallbacks: [callback],
                eventCallBack: eventCallBack
            };
            this.distributeMap.set(type, callbackObj);
        } else {
            if (allowMultipleCallback) {
                callbackObj.messageCallbacks.push(callback);
            }
            callbackObj.eventCallBack = eventCallBack;
        }
    }

    // 删除回调函数
    unregisterCallback(type: number, callback: Function): void {
        if (!this.distributeMap.has(type)) {
            return;
        }
        const callbackObj = this.distributeMap.get(type)!;
        callbackObj.messageCallbacks = callbackObj.messageCallbacks.filter((cb) => cb !== callback);

        // 如果回调数组为空，同时 eventCallBack 也为空，则可以删除整个类型
        if (callbackObj.messageCallbacks.length === 0 && !callbackObj.eventCallBack) {
            this.distributeMap.delete(type);
        }
    }

    /**
     * 传递数据信息至webSocket
     * 模块调
     */
    sendMessage(type: number, cmd?: number, data?: Uint8Array): void {
        // 初始化重连标志位
        this.reconnect = -1;
        // 检查状态
        if (this.status !== GetStatuses.READY) {
            // 缓存数据
            this.cache(type, cmd, data);
            this.checkStatus(type);
        } else {
            this.send(type, cmd, data);
        }
    }

    send(type: number, cmd?: number, data?: Uint8Array): void {
        let message: MessageParam = {
            type: type,
            cmd: cmd,
            session_id: this.sessionId!,
            session: this.session!,
            data_lenght: data ? data.byteLength : undefined,
            data: data
        };
        let encode = Utils.encode(message);
        this.websocket!.send(encode!);
    }

    // 定时检查心跳
    sendHeartbeat(): void {
        this.heartbeatInterval = window.setInterval(() => {
            if (this.status === GetStatuses.READY) {
                this.send(TypeConstants.HEARTBEAT_TYPE, undefined, undefined);
            }
        }, Constants.INTERVAL_TIME);
    }

    /**
     * 重连时初始化登录信息
     * 在异常关闭时调用
     */
    initLoginInfo(): void {
        this.sessionId = null;
        this.session = null;
    }

    // 连接关闭时，清除心跳
    clearHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // 缓存数据
    cache(type: number, cmd?: number, data?: Uint8Array): void {
        if (!this.cacheInfo.has(type)) {
            this.cacheInfo.set(type, { type, cmd, data });
        } else {
            let obj = this.cacheInfo.get(type);
            // @ts-ignore
            obj.cmd = cmd;
            //@ts-ignore
            obj.data = data;
        }
    }

    // 检查状态 中间状态，最终失败状态，最终成功状态
    checkStatus(type: number): void {
        // @ts-ignore
        let statuses = this.getStatusesPrompt()[this.status];
        const distributeEntry = this.distributeMap.get(type);

        if (distributeEntry && typeof distributeEntry.eventCallBack === 'function') {
            if (statuses.type === INTERMEDIATE_STATE) {
                distributeEntry.eventCallBack(this.status);
            } else if (statuses.type === FAILED_STATE) {
                this.reconnect = type;
                this.connectWebSocket();
            }
        }
    }

    // 重连后确认最终状态
    finalStatus(): void {
        if (this.reconnect !== -1) {
            if (this.status === GetStatuses.READY) {
                // @ts-ignore
                this.sendMessage(this.reconnect, this.cacheInfo.get(this.reconnect)!.cmd, this.cacheInfo.get(this.reconnect)!.data);
                return;
            }
            this.distributeMap.get(this.reconnect)!.eventCallBack(this.status);
        }
        this.reconnect = -1;
    }

    getStatusesPrompt(): unknown {
        return {
            unconnected: {
                type: FAILED_STATE
            }, // 重连
            connected: {
                type: INTERMEDIATE_STATE
            }, // 中间
            logined: {
                type: INTERMEDIATE_STATE
            }, // 中间
            loginFailedByLackSession: {
                type: FAILED_STATE
            }, // 重连
            upgrading: {
                type: INTERMEDIATE_STATE
            }, // 中间
            upgradeSuccess: {
                type: FAILED_STATE,
            }, // 重连
            upgradeFailed: {
                type: FAILED_STATE,
            }, // 重连
        };
    }
}
