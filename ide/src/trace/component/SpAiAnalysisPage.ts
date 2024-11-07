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
import { Utils } from './trace/base/Utils';

@element('sp-ai-analysis')
export class SpAiAnalysisPage extends BaseElement {
    valueChangeHandler: ((str: string, id: number) => void) | undefined | null;
    private askQuestion: Element | null | undefined;
    private q_a_window: HTMLDivElement | null | undefined;
    private aiAnswerBox: HTMLDivElement | null | undefined;
    private newChatEl: HTMLImageElement | null | undefined;
    private contentWindow: HTMLDivElement | null | undefined;
    private inputEl: HTMLTextAreaElement | null | undefined;
    private tipsContainer: HTMLDivElement | null | undefined;
    private chatImg: HTMLImageElement | null | undefined;
    private reportBar: HTMLImageElement | null | undefined;
    private reportImg: HTMLImageElement | null | undefined;
    private sendImg: HTMLImageElement | null | undefined;
    private draftBtn: HTMLDivElement | null | undefined;
    private downloadBtn: HTMLDivElement | null | undefined;
    private draftList: HTMLDivElement | null | undefined;
    private tipsContent: HTMLDivElement | null | undefined;
    private loadingItem: HTMLDivElement | null | undefined;
    private startTimeEl: HTMLSpanElement | null | undefined;
    private endTimeEl: HTMLSpanElement | null | undefined;
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
    static startTime: number = 0;
    static endTime: number = 0;
    // 监听选中时间范围变化
    static selectChangeListener(startTime: number, endTime: number): void {
        SpAiAnalysisPage.startTime = startTime;
        SpAiAnalysisPage.endTime = endTime;
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
        this.q_a_window = this.shadowRoot?.querySelector('.q_a_window');
        let reportDetails = this.shadowRoot?.querySelector('.report_details');
        this.contentWindow = this.shadowRoot?.querySelector('.ask_question');
        this.tipsContainer = this.shadowRoot?.querySelector('.tipsContainer');
        this.inputEl = this.shadowRoot?.querySelector('.inputText');
        this.chatImg = this.shadowRoot?.querySelector('.chatBar')?.getElementsByTagName('img')[0];
        this.reportImg = this.shadowRoot?.querySelector('.report')?.getElementsByTagName('img')[0];
        this.sendImg = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatInputBox > div.chatInput > img');
        this.newChatEl = document.querySelector("body > sp-application")!.shadowRoot!.querySelector("#sp-ai-analysis")!.shadowRoot?.querySelector("div.chatBox > div > div.ask_question > div.chatInputBox > div.chatConfig > div > div.newChat > img");
        // 诊断按钮
        this.draftBtn = this.shadowRoot?.querySelector('.analysisBtn');
        // 下载报告按钮
        this.downloadBtn = this.shadowRoot?.querySelector('.downloadBtn');
        // 报告列表
        this.draftList = this.shadowRoot?.querySelector('.data-record');
        // 空数据页面
        this.tipsContent = this.shadowRoot?.querySelector('.tips-content');
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
            this.q_a_window!.innerHTML = '';
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
        this.downloadBtn?.addEventListener('click', () => {
            let a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([this.reportContent]));
            a.download = window.sessionStorage.getItem('fileName')! + '诊断报告';
            a.click();
        });

        this.draftBtn?.addEventListener('click', async () => {
            this.draftList!.innerHTML = '';
            this.tipsContent!.style.display = 'none';
            this.downloadBtn!.style.display = 'none';
            // 没有登陆，弹窗提示，退出逻辑
            if (!WebSocketManager.getInstance()?.isReady()) {
                this.tipsContent!.style.display = 'flex';
                let guideSrc = `https://${window.location.host.split(':')[0]}:${window.location.port
                    }/application/?action=help_27`;
                let linkNodeTips = `<span>未连接，请启动本地扩展程序再试！[</span><a href=${guideSrc} style="color: blue;" target="_blank">指导</a><span>]</span>`;
                this.abnormalPageTips(linkNodeTips, '', 4000);
                return;
            }
            // 清空诊断报告的内容
            this.reportContent = '';
            // 隐藏诊断按钮
            this.draftBtn!.style.display = 'none';
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
                let importTraceTips = '请先导入trace，再使用诊断功能';
                this.abnormalPageTips(importTraceTips, '', 4000);
                return;
            }
            this.reportImg!.src = 'img/report_active.png';
            this.chatImg!.src = 'img/talk.png';
            this.reportBar!.classList.add('active');
            chatBar!.classList.remove('active');
            //@ts-ignore
            this.askQuestion!.style.display = 'none';
            //@ts-ignore
            reportDetails!.style.display = 'block';
            this.tipsContainer!.style.display = 'none';
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
            reportDetails!.style.display = 'none';
            this.tipsContainer!.style.display = 'none';
        });
    }

    // 重新导trace、db时，初始化诊断功能
    clear() {
        this.draftList!.innerHTML = '';
        this.reportContent = '';
        this.downloadBtn!.style.display = 'none';
        this.draftBtn!.style.display = 'inline-block';
        let chatBar = this.shadowRoot?.querySelector('.chatBar');
        let reportDetails = this.shadowRoot?.querySelector('.report_details');
        this.reportImg!.src = 'img/report.png';
        this.chatImg!.src = 'img/talk_active.png';
        this.reportBar!.classList.remove('active');
        chatBar!.classList.add('active');
        //@ts-ignore
        this.askQuestion!.style.display = 'block';
        //@ts-ignore
        reportDetails!.style.display = 'none';
        this.tipsContainer!.style.display = 'none';
        this.tipsContent!.style.display = 'flex';
    }

    // 发送消息
    async sendMessage(): Promise<void> {
        if (!this.isResultBack) {
            return;
        }
        if (this.inputEl!.value !== '') {
            this.isResultBack = false;
            if (this.isNewChat) {
                this.isNewChat = false;
            }
            this.question = JSON.parse(JSON.stringify(this.inputEl!.value));
            this.createChatBox();
            this.createAiChatBox('AI智能分析中...');
            this.q_a_window!.scrollTop = this.q_a_window!.scrollHeight;
            // 没有token
            if (this.token === '') {
                await this.getToken90Min(true);
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
            let likeDiv = document.createElement('div');
            likeDiv.className = 'likeDiv';
            likeDiv.innerHTML = '<lit-like type = "chat"></lit-like>';
            this.aiAnswerBox?.appendChild(likeDiv);
            // 滚动条滚到底部
            this.q_a_window!.scrollTop = this.q_a_window!.scrollHeight;
        }
        this.isResultBack = true;
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
        this.q_a_window?.appendChild(newMessage);
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
        this.q_a_window?.appendChild(newMessage);
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
            timeDiv.className = 'item two timeDiv';
            timeDiv!.innerHTML = `<span class='item-name'>发生时间：</span>`;
            let timeList = new Array();
            // @ts-ignore
            dataList[i].trace_info.forEach((v: any, index: number) => {
                let timeSpan = document.createElement('span');
                timeSpan.id = v.id;
                timeSpan.className = 'timeItem';
                timeSpan.setAttribute('name', v.name);
                timeSpan.innerHTML = `[<span class = 'timeText'>${v.ts! / 1000000000}</span>s] ,`;
                timeDiv.appendChild(timeSpan);
                timeList.push(v.ts! / 1000000000 + 's');
            });
            // 生成问题原因
            let reasonDiv = document.createElement('div');
            reasonDiv.className = 'item';
            // @ts-ignore
            reasonDiv!.innerHTML = `<span class='item-name'>问题原因：</span>${dataList[i].description}`;
            itemDiv.appendChild(titleDiv);
            itemDiv.appendChild(typeDiv);
            itemDiv.appendChild(timeDiv);
            itemDiv.appendChild(reasonDiv);
            this.timeClickHandler(timeDiv);
            // 生成优化建议
            let suggestonDiv = document.createElement('div');
            suggestonDiv.className = 'item two';
            let suggestionText = '';
            if (this.token === '') {
                await this.getToken90Min(false);
            }
            // @ts-ignore
            suggestionText = await this.getSuggestion(dataList[i], itemDiv, suggestonDiv);
            // @ts-ignore
            this.reportContent += `问题${i + 1}:${dataList[i].type}\n\n时间：${timeList.join(',')}\n\n问题原因：${dataList[i].description}\n\n优化建议：${suggestionText}\n\n\n`;
        }
        this.loadingItem!.style.display = 'none';
        this.downloadBtn!.style.display = 'inline-block';
    }

    async getToken(isChat?: boolean) {
        let data = await SpStatisticsHttpUtil.getAItoken();
        if (data.status !== 200) {
            if (isChat) {
                this.aiAnswerBox!.firstElementChild!.innerHTML = '获取token失败';
            }
            return;
        } else {
            this.token = data.data;
        }
    }

    //控制页面异常场景的显示
    abnormalPageTips(tipStr: string, imgSrc: string, setTimeoutTime: number): void {
        this.tipsContainer!.style.display = 'flex';
        this.tipsContainer!.innerHTML = '';
        if (imgSrc !== '') {
            let mixedTipsBox = document.createElement('div');
            mixedTipsBox.className = 'mixedTips';
            let mixedImg = document.createElement('img');
            mixedImg.src = imgSrc;
            let mixedText = document.createElement('div');
            mixedText.className = 'mixedText';
            mixedText.innerHTML = tipStr;
            mixedTipsBox.appendChild(mixedImg);
            mixedTipsBox.appendChild(mixedText);
            this.tipsContainer!.appendChild(mixedTipsBox);
        } else {
            let textTipsBox = document.createElement('div');
            textTipsBox.className = 'textTips';
            textTipsBox!.innerHTML = tipStr;
            this.tipsContainer!.appendChild(textTipsBox);
        }
        if (setTimeoutTime) {
            setTimeout(() => {
                this.tipsContainer!.style.display = 'none';
            }, setTimeoutTime);
        }
    }

    // 每90min重新获取token
    async getToken90Min(isChat: boolean) {
        await this.getToken(isChat);
        await setInterval(async () => {
            await this.getToken(isChat);
        }, 5400000);
    }

    // 发送请求获取优化建议并渲染页面
    async getSuggestion(item: unknown, itemDiv: HTMLDivElement | null | undefined, suggestonDiv: HTMLDivElement | null | undefined): Promise<string> {
        let suggestion = await SpStatisticsHttpUtil.askAi({
            token: this.token,
            // @ts-ignore
            question: item.description + ',请问该怎么优化？',
            collection: ''
        });
        // @ts-ignore
        suggestonDiv!.innerHTML = `<span class="item-name">优化建议：</span>${this.md!.render(suggestion.data)}`;
        let likeDiv = document.createElement('div');
        likeDiv.className = 'likeDiv';
        // @ts-ignore
        likeDiv.innerHTML = `<lit-like type = "detect" content = ${item.type}#${item.subtype}></lit-like>`;
        this.aiAnswerBox?.appendChild(likeDiv);
        suggestonDiv!.appendChild(likeDiv);
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
    // @ts-ignore
    webSocketCallBack = async (cmd: number, result: Uint8Array): unknown => {
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(result);
        let jsonRes = JSON.parse(jsonString);
        // db文件写入成功
        if (cmd === 2) {
            SpAiAnalysisPage.isRepeatedly = true;
            this.initiateDiagnosis();
            if (jsonRes.resultCode !== 0) {
                this.draftBtn!.style.display = 'inline-block';
            }
        }
        // 诊断结果，resultCode===1:失败；resultCode===0:成功
        if (cmd === 4) {
            //     需要处理
            if (jsonRes.resultCode !== 0) {
                this.draftList!.innerHTML = '';
                let textStr = '服务异常';
                let imgsrc = 'img/no-report.png';
                this.tipsContent!.style.display = 'none';
                this.abnormalPageTips(textStr, imgsrc, 0);
            }
            if (this.isJsonString(jsonRes.resultMessage)) {
                let dataList = JSON.parse(jsonRes.resultMessage) || [];
                if (dataList && dataList.length === 0) {
                    SpStatisticsHttpUtil.generalRecord('AI_statistic', 'large_model_detect', [0])
                    this.draftList!.innerHTML = '';
                    let textStr = '当前trace未诊断出问题';
                    let imgsrc = 'img/no-report.png';
                    this.tipsContent!.style.display = 'none';
                    this.abnormalPageTips(textStr, imgsrc, 0);
                } else {
                    SpStatisticsHttpUtil.generalRecord('AI_statistic', 'large_model_detect', [1]);
                    // 整理数据,渲染数据
                    await this.renderData(dataList);
                }
            }
            this.draftBtn!.style.display = 'inline-block';
        }
    }

    // 发起诊断
    initiateDiagnosis(): void {
        let requestBodyObj = {
            startTime: Math.round(SpAiAnalysisPage.startTime + Utils.getInstance().getRecordStartNS()),
            endTime: Math.round(SpAiAnalysisPage.endTime + Utils.getInstance().getRecordStartNS())
        };
        let requestBodyString = JSON.stringify(requestBodyObj);
        let requestBody = new TextEncoder().encode(requestBodyString);
        WebSocketManager.getInstance()!.sendMessage(TypeConstants.DIAGNOSIS_TYPE, TypeConstants.DIAGNOSIS_CMD, requestBody);
    }

    // 点击时间跳转
    timeClickHandler(timeDiv: HTMLDivElement) {
        let timeElementList = timeDiv!.getElementsByClassName('timeItem');
        for (let i = 0; i < timeElementList.length; i++) {
            timeElementList[i].addEventListener('click', (e) => {
                // 点击项更换颜色
                timeElementList[i].getElementsByClassName('timeText')[0].setAttribute('active', '')
                let name = timeElementList[i].getAttribute('name');
                let id = Number(timeElementList[i].getAttribute('id'));
                // 其他项重置颜色
                for (let j = 0; j < timeElementList.length; j++) {
                    if (i !== j) {
                        timeElementList[j].getElementsByClassName('timeText')[0].removeAttribute('active');
                    }
                }
                // @ts-ignore
                this.valueChangeHandler!(name, id);
            })
        }
    }

    // 判断是否为json
    isJsonString(str: string) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    initHtml(): string {
        return SpAiAnalysisPageHtml;
    }
}