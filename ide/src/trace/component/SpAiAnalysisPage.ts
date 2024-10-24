/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BaseElement, element } from '../../base-ui/BaseElement';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { threadPool } from '../database/SqlLite';
import { SpAiAnalysisPageHtml } from './SpAiAnalysisPage.html';
import { getTimeString } from './trace/sheet/TabPaneCurrentSelection';
import { WebSocketManager } from '../../webSocket/WebSocketManager';
import { TypeConstants } from '../../webSocket/Constants';
import { TraceRow } from './trace/base/TraceRow';
import { SpSystemTrace } from './SpSystemTrace';
import { SpApplication } from '../SpApplication';

@element('sp-ai-analysis')
export class SpAiAnalysisPage extends BaseElement {
    private askQuestion: Element | null | undefined;
    private aiAnswerBox: HTMLDivElement | null | undefined;
    private newChatEl: HTMLImageElement | null | undefined;
    private chatWindow: HTMLDivElement | null | undefined;
    private inputEl: HTMLTextAreaElement | null | undefined;
    private chatImg: HTMLImageElement | null | undefined;
    private reportBar: HTMLImageElement | null | undefined;
    private reportImg: HTMLImageElement | null | undefined;
    private sendImg: HTMLImageElement | null | undefined;
    private draftBtn: HTMLDivElement | null | undefined;
    private downloadBtn: HTMLDivElement | null | undefined;
    private draftList: HTMLDivElement | null | undefined;
    private noDataEl: HTMLDivElement | null | undefined;
    private noReportEl: HTMLDListElement | null | undefined;
    private loginTipEl: HTMLDivElement | null | undefined;
    private importTraceTipsEl: HTMLDivElement | null | undefined;
    private loadingItem: HTMLDivElement | null | undefined;
    private startTimeEl: HTMLSpanElement | null | undefined;
    private endTimeEl: HTMLSpanElement | null | undefined;
    private tipsContent: HTMLDivElement | null | undefined;
    private question: string = '';
    private token: string = '';
    // 是否点击了新建聊天
    private isNewChat: boolean = false;
    isCtrlDown: boolean = false;
    static isRepeatedly: boolean = false;
    // 拼接下载内容
    private reportContent: string = '';
    private md: unknown;
    private isResultBack: boolean = true;
    // 监听选中时间范围变化
    static selectChangeListener(startTime: number, endTime: number): void {
        let startEl = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatBox > div > div.report_details > div.selectionBox > div.startBox > span');
        startEl!.innerHTML = getTimeString(startTime).toString();
        let endEl = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatBox > div > div.report_details > div.selectionBox > div.endBox > span');
        endEl!.innerHTML = getTimeString(endTime).toString();
    }
    initElements(): void {
        this.md = require('markdown-it')({
            html: true,
            typographer: true
        });
        let aiAssistant = document.querySelector("body > sp-application")!.shadowRoot!.querySelector("#sp-ai-analysis");
        let chatBar = this.shadowRoot?.querySelector('.chatBar');
        let closeBtn = document.querySelector("body > sp-application")!.shadowRoot!.querySelector("#sp-ai-analysis")!.shadowRoot!.querySelector("div.rightTabBar > lit-icon")!.shadowRoot!.querySelector("#icon");
        this.askQuestion = this.shadowRoot?.querySelector('.ask_question');
        this.reportBar = this.shadowRoot?.querySelector('.report');
        let reportDetails = this.shadowRoot?.querySelector('.report_details');
        let chatInputBox = this.shadowRoot?.querySelector('.chatInputBox');
        this.chatWindow = this.shadowRoot?.querySelector('.ask_question');
        this.inputEl = this.shadowRoot?.querySelector('.inputText');
        this.chatImg = this.shadowRoot?.querySelector('.chatBar')?.getElementsByTagName('img')[0];
        this.reportImg = this.shadowRoot?.querySelector('.report')?.getElementsByTagName('img')[0];
        this.sendImg = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatInputBox > div.chatInput > img');
        this.newChatEl = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatBox > div > div.chatInputBox > div.chatConfig > div > div.newChat > img');
        // 诊断按钮
        this.draftBtn = this.shadowRoot?.querySelector('.analysisBtn');
        // 下载报告按钮
        this.downloadBtn = this.shadowRoot?.querySelector('.downloadBtn');
        // 报告列表
        this.draftList = this.shadowRoot?.querySelector('.data-record');
        // 空数据页面
        this.noDataEl = this.shadowRoot?.querySelector('.no-data');
        // 没诊断出来页面
        this.noReportEl = this.shadowRoot?.querySelector('.no-report');
        this.tipsContent = this.shadowRoot?.querySelector('.tips-content');
        // 未连接提示弹窗
        this.loginTipEl = this.shadowRoot?.querySelector('.loginTip');
        //未导入trace提示弹窗
        this.importTraceTipsEl = this.shadowRoot?.querySelector('.importTraceTips');
        // 时间展示区域
        this.startTimeEl = this.shadowRoot?.querySelector('.startTime');
        this.startTimeEl!.innerHTML = getTimeString(TraceRow.range?.startNS!);
        this.endTimeEl = this.shadowRoot?.querySelector('.endTime');
        this.endTimeEl!.innerHTML = getTimeString(TraceRow.range?.endNS!);

        // 发送消息图标点击事件
        this.sendImg?.addEventListener('click', () => {
            this.sendMessage();
        });

        // 新建对话按钮点击事件
        this.newChatEl?.addEventListener('click', () => {
            this.isNewChat = true;
            this.isResultBack = true;
            this.token = '';
            this.askQuestion!.innerHTML = '';
            this.createAiChatBox('有什么可以帮助您的吗？');
        });

        //通过右上角的‘X’按钮关闭窗口
        //@ts-ignore
        closeBtn?.addEventListener('click', () => {
            //@ts-ignore
            aiAssistant?.style.visibility = 'hidden';
            //@ts-ignore
            aiAssistant?.style.display = 'none';
        })

        // 输入框发送消息
        this.inputEl?.addEventListener('keydown', (e) => {
            if (e.key.toLocaleLowerCase() === 'control' || e.keyCode === 17) {
                this.isCtrlDown = true;
            }
            if (this.isCtrlDown) {
                if (e.key.toLocaleLowerCase() === 'enter') {
                    this.inputEl!.value += '\n';
                }
            } else {
                if (e.key.toLocaleLowerCase() === 'enter') {
                    this.sendMessage();
                    // 禁止默认的回车换行
                    e.preventDefault();
                };
            };
        });

        // 输入框聚焦/失焦--防止触发页面快捷键
        this.inputEl?.addEventListener('focus', () => {
            SpSystemTrace.isAiAsk = true;
        });

        this.inputEl?.addEventListener('blur', () => {
            SpSystemTrace.isAiAsk = false;
        });

        // 监听浏览器刷新，清除db数据
        window.onbeforeunload = function (): void {
            caches.delete(`${window.localStorage.getItem('fileName')}.db`);
            sessionStorage.removeItem('fileName');
        };

        // 监听ctrl抬起
        this.inputEl?.addEventListener('keyup', (e) => {
            if (e.key.toLocaleLowerCase() === 'control' || e.keyCode === 17) {
                this.isCtrlDown = false;
            };
        });

        // 下载诊断报告按钮监听
        this.downloadBtn?.addEventListener('click', (e) => {
            let a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([this.reportContent]));
            a.download = window.sessionStorage.getItem('fileName')! + '诊断报告';
            a.click();
        });

        this.draftBtn?.addEventListener('click', async (e) => {
            this.draftList!.innerHTML = '';
            this.noDataEl!.style.display = 'none';
            this.noReportEl!.style.display = 'none';
            this.downloadBtn!.style.display = 'none';
            // 没有登陆，弹窗提示，退出逻辑
            if (!WebSocketManager.getInstance()?.isReady()) {
                this.tipsContent!.style.display = 'flex';
                this.loginTipEl!.style.display = 'block';
                setTimeout(() => {
                    this.loginTipEl!.style.display = 'none';
                }, 4000);
                return;
            }
            // 清空诊断报告的内容
            this.reportContent = '';
            // 同一个trace非第一次诊断，无需再发db文件过去
            if (SpAiAnalysisPage.isRepeatedly) {
                this.initiateDiagnosis();
            } else {
                // 首次诊断
                WebSocketManager.getInstance()!.registerMessageListener(TypeConstants.DIAGNOSIS_TYPE, this.webSocketCallBack);
                // 看缓存中有没有db，没有的话拿一个进行诊断并存缓存
                let fileName = sessionStorage.getItem('fileName');
                caches.match(`${fileName}.db`).then(async (res) => {
                    if (!res) {
                        this.cacheDb(fileName);
                    } else {
                        WebSocketManager.getInstance()!.sendMessage(
                            TypeConstants.DIAGNOSIS_TYPE,
                            TypeConstants.SENDDB_CMD,
                            new TextEncoder().encode(await res!.text())
                        );
                    }
                });
            };
            this.tipsContent!.style.display = 'none';
            // 加载中的loading模块
            let loadingDiv = document.createElement('div');
            loadingDiv.className = 'loadingBox';
            loadingDiv.innerHTML = '<lit-loading style="position:absolute;top:45%;left:45%;z-index:999"></lit-loading>';
            let loadingItem = document.createElement('div');
            loadingItem.className = 'loadingItem';
            this.loadingItem = loadingItem;
            loadingItem!.appendChild(loadingDiv);
            this.draftList?.appendChild(loadingItem);
        });

        // 侧边栏诊断点击事件 *************优化，考虑多个按钮
        this.reportBar!.addEventListener('click', () => {
            if (!SpApplication.isTraceLoaded) {
                //@ts-ignore
                this.importTraceTipsEl?.style.visibility = 'visible';
                setTimeout(() => {
                    //@ts-ignore
                    this.importTraceTipsEl?.style.visibility = 'hidden';
                }, 4000);
                return;
            }
            this.reportImg!.src = 'img/report_active.png';
            this.chatImg!.src = 'img/talk.png';
            this.reportBar!.classList.add('active');
            chatBar!.classList.remove('active');
            //@ts-ignore
            this.askQuestion!.style.display = 'none';
            //@ts-ignore
            chatInputBox!.style.display = 'none';
            //@ts-ignore
            reportDetails!.style.display = 'block';
        });

        // 侧边栏聊天点击事件
        chatBar!.addEventListener('click', () => {
            this.reportImg!.src = 'img/report.png';
            this.chatImg!.src = 'img/talk_active.png';
            this.reportBar!.classList.remove('active');
            chatBar!.classList.add('active');
            //@ts-ignore
            this.askQuestion!.style.display = 'block';
            //@ts-ignore
            chatInputBox!.style.display = 'block';
            //@ts-ignore
            reportDetails!.style.display = 'none';
        });
    }

    // 重新导trace、db时，初始化诊断功能
    clear() {
        this.draftList!.innerHTML = '';
        this.reportContent = '';
        this.downloadBtn!.style.display = 'none';
        this.tipsContent!.style.display = 'flex';
        this.noDataEl!.style.display = 'block';
        this.noReportEl!.style.display = 'none';
        let chatBar = this.shadowRoot?.querySelector('.chatBar');
        let chatInputBox = this.shadowRoot?.querySelector('.chatInputBox');
        let reportDetails = this.shadowRoot?.querySelector('.report_details');
        this.reportImg!.src = 'img/report.png';
        this.chatImg!.src = 'img/talk_active.png';
        this.reportBar!.classList.remove('active');
        chatBar!.classList.add('active');
        //@ts-ignore
        this.askQuestion!.style.display = 'block';
        //@ts-ignore
        chatInputBox!.style.display = 'block';
        //@ts-ignore
        reportDetails!.style.display = 'none';
        this.noDataEl!.style.display = 'block';
        this.noReportEl!.style.display = 'none';
    }

    // 发送消息
    async sendMessage(): Promise<void> {
        if (!this.isResultBack) {
            return;
        }
        this.isResultBack = false;
        if (this.inputEl!.value !== '') {
            if (this.isNewChat) {
                this.isNewChat = false;
            }
            this.question = JSON.parse(JSON.stringify(this.inputEl!.value));
            this.createChatBox();
            this.createAiChatBox('AI智能分析中...');
            this.chatWindow!.scrollTop = this.chatWindow!.scrollHeight;
            // 没有token
            if (this.token === '') {
                await this.getToken90Min();
            }
            this.answer();
        }
    }

    // ai对话
    async answer(): Promise<void> {
        let requestBody = {
            token: this.token,
            question: this.question,
            collection: 'smart_perf_test',
            scope: 'smartperf'
        };
        let answer = await (await SpStatisticsHttpUtil.askAi(requestBody)).data;
        if (!this.isNewChat) {
            // @ts-ignore
            this.aiAnswerBox!.firstElementChild!.innerHTML = this.md!.render(answer);
            // 滚动条滚到底部
            this.chatWindow!.scrollTop = this.chatWindow!.scrollHeight;
            this.isResultBack = true;
        }
    }

    // 创建用户聊天对话气泡
    createChatBox() {
        // 生成头像
        let headerDiv = document.createElement('div');
        headerDiv.className = 'userHeader headerDiv';
        // 生成聊天内容框
        let newQuestion = document.createElement('div');
        newQuestion.className = 'usersay';
        // @ts-ignore
        newQuestion!.innerHTML = this.inputEl!.value;
        // 单条消息模块，最大的div,包含头像、消息、清除浮动元素
        let newMessage = document.createElement('div');
        newMessage.className = 'usermessage message';
        // @ts-ignore
        this.inputEl!.value = '';
        newMessage.appendChild(headerDiv);
        newMessage.appendChild(newQuestion);
        let claerDiv = document.createElement('div');
        claerDiv.className = 'clear';
        newMessage.appendChild(claerDiv);
        this.askQuestion?.appendChild(newMessage);
    }

    // 创建ai助手聊天对话气泡
    createAiChatBox(aiText: string): void {
        // 生成ai头像
        let headerDiv = document.createElement('div');
        headerDiv.className = 'aiHeader headerDiv';
        headerDiv.innerHTML = `<img class='headerImg' src = 'img/logo.png' title=''></img>`;
        let newQuestion = document.createElement('div');
        newQuestion.className = 'systemSay';
        // @ts-ignore
        newQuestion!.innerHTML = `<div>${aiText}</div>`;
        let newMessage = document.createElement('div');
        newMessage.className = 'aiMessage message';
        newMessage.appendChild(headerDiv);
        newMessage.appendChild(newQuestion);
        let claerDiv = document.createElement('div');
        claerDiv.className = 'clear';
        this.aiAnswerBox = newQuestion;
        newMessage.appendChild(claerDiv);
        this.askQuestion?.appendChild(newMessage);
    }

    // 页面渲染诊断结果
    async renderData(dataList: unknown): Promise<void> {
        // @ts-ignore
        for (let i = 0; i < dataList.length; i++) {
            let itemDiv = document.createElement('div');
            itemDiv!.style.visibility = 'hidden';
            itemDiv.className = 'analysisItem';
            // 生成标题
            let titleDiv = document.createElement('div');
            titleDiv.className = 'title item-name';
            titleDiv!.innerText = `问题${i + 1}`;
            // 生成类型
            let typeDiv = document.createElement('div');
            typeDiv.className = 'item';
            // @ts-ignore
            typeDiv.innerHTML = `<span class="item-name">问题类型：</span>${dataList[i].type}`
            // 生成时间
            let timeDiv = document.createElement('div');
            timeDiv.className = 'item two';
            // 获取每一个诊断项的时间
            let timeList = new Array();
            // @ts-ignore
            dataList[i].trace_info.forEach((v: any) => {
                timeList.push(v.ts! / 1000000000 + 's');
            });
            timeDiv!.innerHTML = `<span class='item-name'>发生时间：</span>${timeList.join(',')}`;
            // 生成问题原因
            let reasonDiv = document.createElement('div');
            reasonDiv.className = 'item';
            // @ts-ignore
            reasonDiv!.innerHTML = `<span class='item-name'>问题原因：</span>${dataList[i].description}`;
            itemDiv.appendChild(titleDiv);
            itemDiv.appendChild(typeDiv);
            itemDiv.appendChild(timeDiv);
            itemDiv.appendChild(reasonDiv);
            // 生成优化建议
            let suggestonDiv = document.createElement('div');
            suggestonDiv.className = 'item two';
            let suggestionText = '';
            if (this.token === '') {
                await this.getToken90Min();
            }
            // @ts-ignore
            suggestionText = await this.getSuggestion(dataList[i].description, itemDiv, suggestonDiv);
            // @ts-ignore
            this.reportContent += `问题${i + 1}:${dataList[i].type}\n\n时间：${timeList.join(',')}\n\n问题原因：${dataList[i].description}\n\n优化建议：${suggestionText}\n\n\n`;
        }
        this.loadingItem!.style.display = 'none';
        this.downloadBtn!.style.display = 'inline-block';
    }

    async getToken() {
        let data = await SpStatisticsHttpUtil.getAItoken();
        if (data.status !== 200) {
            this.aiAnswerBox!.firstElementChild!.innerHTML = '获取token失败';
            return;
        } else {
            this.token = data.data;
        }
    }

    // 每90min重新获取token
    async getToken90Min() {
        await this.getToken();
        await setInterval(async () => {
            await this.getToken();
        }, 5400000);
    }

    // 发送请求获取优化建议并渲染页面
    async getSuggestion(description: string, itemDiv: HTMLDivElement | null | undefined, suggestonDiv: HTMLDivElement | null | undefined): Promise<string> {
        let suggestion = await SpStatisticsHttpUtil.askAi({
            token: this.token,
            question: description + ',请问该怎么优化？',
            collection: ''
        });
        // @ts-ignore
        suggestonDiv!.innerHTML = `<span class="item-name">优化建议：</span>${this.md!.render(suggestion.data)}`;
        itemDiv!.appendChild(suggestonDiv!);
        // 吧loading放到最后面
        this.draftList!.insertBefore(itemDiv!, this.loadingItem!);
        itemDiv!.style.visibility = 'visible';
        itemDiv!.style.animation = 'opcityliner 3s';
        return suggestion.data;
    }

    cacheDb(fileName: string | null): void {
        threadPool.submit(
            'download-db',
            '',
            {},
            (reqBufferDB: Uint8Array) => {
                WebSocketManager.getInstance()!.sendMessage(TypeConstants.DIAGNOSIS_TYPE, TypeConstants.SENDDB_CMD, reqBufferDB);
                // 存入缓存
                caches.open(`${fileName}.db`).then((cache) => {
                    let headers = new Headers();
                    headers.append('Content-Type', 'application/octet-stream');
                    headers.append('Content-Transfer-Encoding', 'binary');
                    return cache
                        .put(
                            `${fileName}.db`,
                            new Response(reqBufferDB, {
                                status: 200,
                            })
                        );
                });
            },
            'download-db'
        );
    }

    // websocket通信回调注册
    webSocketCallBack = (cmd: number, result: Uint8Array): void => {
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(result);
        let jsonRes = JSON.parse(jsonString);
        // db文件写入成功
        if (cmd === 2) {
            SpAiAnalysisPage.isRepeatedly = true;
            this.initiateDiagnosis();
        }
        // 诊断结果，resultCode===0:失败；resultCode===1:成功
        if (cmd === 4) {
            //     需要处理
            if (jsonRes.resultCode !== 0) {
                console.log('错误');
            }
            let dataList = JSON.parse(jsonRes.resultMessage) || [];
            if (dataList && dataList.length === 0) {
                this.draftList!.innerHTML = '';
                this.tipsContent!.style.display = 'flex';
                this.noReportEl!.style.display = 'block';
            } else {
                // 整理数据,渲染数据
                this.renderData(dataList);
            }
        }
    }

    // 发起诊断
    initiateDiagnosis(): void {
        let requestBodyObj = {
            type: 0
        };
        let requestBodyString = JSON.stringify(requestBodyObj);
        let requestBody = new TextEncoder().encode(requestBodyString);
        WebSocketManager.getInstance()!.sendMessage(TypeConstants.DIAGNOSIS_TYPE, TypeConstants.DIAGNOSIS_CMD, requestBody);
    }

    initHtml(): string {
        return SpAiAnalysisPageHtml;
    }
}