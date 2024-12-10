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

export class WebSocketManager {
    static instance: WebSocketManager | null | undefined = null;
    url: string = `ws://localhost:${Constants.NODE_PORT}`;//8080后期需要修改
    private websocket: WebSocket | null | undefined = null;
    private ready: boolean = false;
    private distributeMap: Map<number, Function> = new Map<number, Function>();
    private sessionId: number | null | undefined;
    private session: bigint | null | undefined;
    private heartbeatInterval: number | null | undefined;

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
        this.websocket = new WebSocket(this.url);
        this.websocket.binaryType = 'arraybuffer';
        this.websocket.onopen = (): void => {
            // 设置心跳定时器  
            this.sendHeartbeat();
            //检查版本
            this.getVersion();
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
        };

        this.websocket.onclose = (event): void => {
            this.initLoginInfor();
            this.clearHeartbeat();
            this.reconnect(event);
        };
    }

    /**
     * 接收webSocket返回的buffer数据
     * 分别处理登录、其他业务的数据
     * 其他业务数据分发
     */
    onmessage(decode: MessageParam): void {
        // 解码event  调decode
        if (decode.type === TypeConstants.UPDATE_TYPE) {// 升级
            if (decode.cmd === Constants.GET_CMD) {
                // 小于则升级
                let targetVersion = '1.0.1';
                let currentVersion = new TextDecoder().decode(decode.data);
                let result = this.compareVersion(currentVersion, targetVersion);
                if (result === -1) {
                    this.updateVersion();
                } else {
                    // 连接后登录
                    this.login();
                }
            }
        } else if (decode.type === TypeConstants.LOGIN_TYPE) {// 登录
            if (decode.cmd === Constants.LOGIN_CMD) {
                this.ready = true;
                this.sessionId = decode.session_id;
                this.session = decode.session;
            }
        } else {// type其他
            for (let [key, callback] of this.distributeMap.entries()) {
                if (key === decode.type) {
                    callback(decode.cmd, decode.data);
                }
            };
        }
    }

    // get版本
    getVersion(): void {
        // 获取扩展程序版本
        this.send(TypeConstants.UPDATE_TYPE, Constants.GET_CMD);
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
            }/application/extend/hi-smart-perf-host-extend-update.zip`;
        fetch(url).then(response => {
            if (!response.ok) {
                throw new Error('No corresponding upgrade compression package found');
            }
            return response.arrayBuffer();
        }).then((arrayBuffer) => {
            this.send(TypeConstants.UPDATE_TYPE, Constants.UPDATE_CMD, new Uint8Array(arrayBuffer));
        }).catch((error) => {
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

    // WebSocket是否登录成功 
    isReady(): boolean {
        return this.ready;
    }

    /** 
     * 消息监听器
     * listener是不同模块传来接收数据的函数
     * 模块调用
    */
    registerMessageListener(type: number, callback: Function): void {
        if (!this.distributeMap.has(type)) {
            this.distributeMap.set(type, callback);
        }
    }

    /**
     * 传递数据信息至webSocket
     * 模块调
     */
    sendMessage(type: number, cmd?: number, data?: Uint8Array): void {
        // 检查WebSocket是否登录成功 
        if (!this.ready) {// 改判断条件 ready
            return;
        }
        this.send(type, cmd, data);
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

    /**
     * 传递数据信息至webSocket
     * 模块调
    */
    reconnect(event: unknown): void {
        //@ts-ignore
        if (event.wasClean) {// 正常关闭
            return;
        }
        // 未连接成功打开定时器
        setTimeout(() => {
            this.connectWebSocket();
        }, Constants.INTERVAL_TIME);
    }

    // 定时检查心跳  
    sendHeartbeat(): void {
        this.heartbeatInterval = window.setInterval(() => {
            this.sendMessage(TypeConstants.HEARTBEAT_TYPE);
        }, Constants.INTERVAL_TIME);
    }

    /**
     * 重连时初始化登录信息
     * 在异常关闭时调用
     */
    initLoginInfor(): void {
        this.ready = false;
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
}
