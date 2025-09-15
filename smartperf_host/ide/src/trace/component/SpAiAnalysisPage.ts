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
import { AiResponse, SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { threadPool } from '../database/SqlLite';
import { SpAiAnalysisPageHtml } from './SpAiAnalysisPage.html';
import { getTimeString } from './trace/sheet/TabPaneCurrentSelection';
import { WebSocketManager } from '../../webSocket/WebSocketManager';
import { TypeConstants } from '../../webSocket/Constants';
import { TraceRow } from './trace/base/TraceRow';
import { SpSystemTrace } from './SpSystemTrace';
import { SpApplication } from '../SpApplication';
import { Utils } from './trace/base/Utils';
import { LitTable } from '../../base-ui/table/lit-table';

const TITLE_HEIGHT = 41;
const TBODY_HEIGHT = 160;

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
    private contentsTable: LitTable | null | undefined;
    private chatBar: HTMLDivElement | null | undefined;
    private reportDetails: HTMLDivElement | null | undefined;
    private showPageFlag: string = 'chat';
    private tipContentArr: Array<string> = [];
    private question: string = '';
    private chatToken: string = '';
    private detectToken: string = '';
    // 是否点击了新建聊天
    private isNewChat: boolean = false;
    isCtrlDown: boolean = false;
    static isRepeatedly: boolean = false;
    // 拼接下载内容
    private reportContent: string = '';
    private isNodata: boolean = true;
    private md: unknown;
    private isResultBack: boolean = true;
    private timerId: unknown = undefined;
    private getSugBtnList: Array<unknown> = [];
    static startTime: number = 0;
    static endTime: number = 0;
    private showSuggestionPart: boolean = false; // 屏蔽优化建议功能
    activeTime: Element | undefined | null;
    // 监听选中时间范围变化
    static selectChangeListener(startTime: number, endTime: number): void {
        SpAiAnalysisPage.startTime = startTime;
        SpAiAnalysisPage.endTime = endTime;
        if (
            document.querySelector('body > sp-application') &&
            document.querySelector('body > sp-application')!.shadowRoot &&
            document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis') &&
            document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot
        ) {
            let startEl = document
                .querySelector('body > sp-application')!
                .shadowRoot!.querySelector('#sp-ai-analysis')!
                .shadowRoot!.querySelector('div.chatBox > div > div.report_details > div.selectionBox > div.startBox > span');
            startEl && (startEl.innerHTML = getTimeString(startTime).toString());
            let endEl = document
                .querySelector('body > sp-application')!
                .shadowRoot!.querySelector('#sp-ai-analysis')!
                .shadowRoot!.querySelector('div.chatBox > div > div.report_details > div.selectionBox > div.endBox > span');
            endEl && (endEl.innerHTML = getTimeString(endTime).toString());
        }
    }
    initElements(): void {
        this.md = require('markdown-it')({
            html: true,
            typographer: true
        });
        // 自定义 link_open 规则
        // @ts-ignore
        this.md.renderer.rules.link_open = (tokens, idx): string => {
            // @ts-ignore
            const href = tokens![idx].attrIndex('href');
            if (href < 0) {
                return '';
            }
            // @ts-ignore
            tokens[idx].attrPush(['target', '_blank']); // 添加 target="_blank"
            // @ts-ignore
            tokens[idx].attrPush(['rel', 'noopener noreferrer']); // 推荐添加 rel="noopener noreferrer" 以提高安全性
            // @ts-ignore
            return `<p><a href="${tokens[idx].attrs[href][1]}" target="_blank" rel="noopener noreferrer"></p>`;
        };
        let aiAssistant = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis');
        this.chatBar = this.shadowRoot?.querySelector('.chatBar');
        let closeBtn = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot!.querySelector('div.rightTabBar > lit-icon')!.shadowRoot!.querySelector('#icon');
        this.askQuestion = this.shadowRoot?.querySelector('.ask_question');
        this.reportBar = this.shadowRoot?.querySelector('.report');
        this.q_a_window = this.shadowRoot?.querySelector('.q_a_window');
        this.reportDetails = this.shadowRoot?.querySelector('.report_details');
        this.contentWindow = this.shadowRoot?.querySelector('.ask_question');
        this.tipsContainer = this.shadowRoot?.querySelector('.tipsContainer');
        this.inputEl = this.shadowRoot?.querySelector('.inputText');
        this.chatImg = this.shadowRoot?.querySelector('.chatBar')?.getElementsByTagName('img')[0];
        this.reportImg = this.shadowRoot?.querySelector('.report')?.getElementsByTagName('img')[0];
        this.sendImg = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatInputBox > div.chatInput > img');
        this.newChatEl = document.querySelector('body > sp-application')!.shadowRoot!.querySelector('#sp-ai-analysis')!.shadowRoot?.querySelector('div.chatBox > div > div.ask_question > div.chatInputBox > div.chatConfig > div > div.newChat > img');
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
        // 诊断信息汇总列表
        this.contentsTable = this.shadowRoot?.querySelector('#tb-contents');
        this.startTimeEl!.innerHTML = getTimeString(TraceRow.range?.startNS!);
        this.endTimeEl = this.shadowRoot?.querySelector('.endTime');
        this.endTimeEl!.innerHTML = getTimeString(TraceRow.range?.endNS!);

        let rightBarGroup: unknown = [
            {
                barName: '聊天',
                barEl: this.chatBar,
                imgEl: this.chatImg,
                barFlag: 'chat',
                img: 'img/talk.png',
                activeImg: 'img/talk_active.png',
                showPage: this.askQuestion,
                isMustLoadedTrace: false
            },
            {
                barName: '诊断',
                barEl: this.reportBar,
                imgEl: this.reportImg,
                barFlag: 'detect',
                img: 'img/report.png',
                activeImg: 'img/report_active.png',
                showPage: this.reportDetails,
                isMustLoadedTrace: true
            }
        ];

        // 给右边栏添加点击事件
        // @ts-ignore
        rightBarGroup.forEach((barItem: unknown, index: number) => {
            // @ts-ignore
            barItem.barEl.addEventListener('click', (ev: Event) => {
                // @ts-ignore
                if (barItem.isMustLoadedTrace && !SpApplication.isTraceLoaded) {
                    let importTraceTips = '请先导入trace，再使用诊断功能';
                    this.tipContentArr = ['chat'];
                    this.abnormalPageTips(importTraceTips, '', 4000, this.tipContentArr);
                    return;
                }
                // this.tipsContent!.style.display = this.isNodata && barItem.barFlag === 'detect' ? 'flex' : 'none';
                this.tipsContainer!.style.display = 'none';
                // @ts-ignore
                this.showPageFlag = barItem.barFlag;
                // @ts-ignore
                barItem.imgEl.src = barItem.activeImg;
                // @ts-ignore
                barItem.barEl.classList.add('active');
                // @ts-ignore
                barItem.showPage.style.display = 'block';
                // @ts-ignore
                if (this.tipContentArr.indexOf(barItem.barFlag) > -1) {
                    this.tipsContainer!.style.display = 'flex';
                }
                // @ts-ignore
                for (let i = 0; i < rightBarGroup.length; i++) {
                    if (i !== index) {
                        // @ts-ignore
                        rightBarGroup[i].barEl.classList.remove('active');
                        // @ts-ignore
                        rightBarGroup[i].imgEl.src = rightBarGroup[i].img;
                        // @ts-ignore
                        rightBarGroup[i].showPage.style.display = 'none';
                    }
                }
            });
        });

        // 发送消息图标点击事件
        this.sendImg?.addEventListener('click', () => {
            this.sendMessage();
        });

        // 新建对话按钮点击事件
        this.newChatEl?.addEventListener('click', () => {
            this.isNewChat = true;
            this.isResultBack = true;
            this.chatToken = '';
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
        });

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
                    e.stopPropagation();
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
            e.preventDefault();
            e.stopPropagation();
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
            this.contentsTable!.style.display = 'none';
            this.tipsContainer!.style.display = 'none';
            this.tipsContent!.style.display = 'none';
            this.downloadBtn!.style.display = 'none';
            // 清空诊断报告的内容
            this.reportContent = '';
            // 隐藏诊断按钮
            this.draftBtn!.style.display = 'none';
            // 同一个trace非第一次诊断，无需再发db文件过去
            if (SpAiAnalysisPage.isRepeatedly) {
                this.initiateDiagnosis();
            } else {
                // 首次诊断
                WebSocketManager.getInstance()!.registerMessageListener(TypeConstants.DIAGNOSIS_TYPE, this.webSocketCallBack, this.eventCallBack);
                // 看缓存中有没有db，没有的话拿一个进行诊断并存缓存
                let fileName = sessionStorage.getItem('fileName');
                await caches.match(`/${fileName}.db`).then(response => {
                    if (response) {
                        response.blob().then(blob => {
                            const reader = new FileReader();
                            reader.readAsArrayBuffer(blob);
                            reader.onloadend = (): void => {
                                const dbBuffer = reader.result;
                                // @ts-ignore
                                const reqBufferDB = new Uint8Array(dbBuffer);
                                // 使用uint8Array
                                WebSocketManager.getInstance()!.sendMessage(
                                    TypeConstants.DIAGNOSIS_TYPE,
                                    TypeConstants.SENDDB_CMD,
                                    reqBufferDB
                                );
                            };
                        });
                    } else {
                        // 如果缓存中没有，从网络获取并存储
                        this.cacheDb(fileName);
                    }
                });
            };
            // 点击一键诊断时先挂载loading
            this.loadingItem = this.loading('style="position:absolute;top:45%;left:45%;z-index:999"');
            this.draftList?.appendChild(this.loadingItem!);
        });

        // 监听表格目录row点击事件，跳转至对应问题行
        this.contentsTable!.addEventListener('row-click', (evt) => {
            // @ts-ignore
            let index = evt.detail.id;
            let targets: unknown = this.draftList?.querySelectorAll('.title');
            // 目录的(index - 1)对应诊断返回的问题数组下标
            // @ts-ignore
            let target = targets[index - 1];
            if (target) {
                // 改变滚动条滚动高度，实现点击目录跳转到对应问题
                this.shadowRoot!.querySelector('.analysisList')!.scrollTop = target.parentElement.offsetTop - TITLE_HEIGHT;
            }
        });
    }

    // 加载中的loading模块
    loading(styleStr: string): HTMLDivElement {
        let loadingDiv = document.createElement('div');
        loadingDiv.className = 'loadingBox';
        // 动态渲染Loading的样式
        loadingDiv.innerHTML = `<lit-loading ${styleStr}></lit-loading>`;
        let loadingItem = document.createElement('div');
        loadingItem.className = 'loadingItem';
        loadingItem!.appendChild(loadingDiv);
        return loadingItem;
    }

    // 重新导trace、db时，初始化诊断功能
    clear(): void {
        this.tipContentArr = [];
        // 判断是否有上一次未完成的优化建议请求，如果有则断掉
        if (SpStatisticsHttpUtil.controllersMap.size > 0) {
            SpStatisticsHttpUtil.isInterrupt = true;
            this.breakRequest();
        }
        this.contentsTable!.style.display = 'none';
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
        this.isNodata = true;
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
            this.answer();
        }
    }

    // ai对话
    async answer(): Promise<void> {
        let requestBody = {
            'inputs': {},
            'query': this.question,
            'response_mode': 'blocking',
            'conversation_id': '',
            'user': 'abc-123'
        };

        await SpStatisticsHttpUtil.askAi(requestBody, 'difyAsk').then(res => {
            if (res.status === 200) {
                SpStatisticsHttpUtil.generalRecord('AI_statistic', 'large_model_q&a', []);
            }
            this.appendChatContent(res);
        }).catch(error => {
            this.appendChatContent(error);
        });
    }

    appendChatContent(response: AiResponse): void {
        if (!this.isNewChat) {
            // @ts-ignore
            this.aiAnswerBox!.firstElementChild!.innerHTML = this.md!.render(response.data);
            let likeDiv = document.createElement('div');
            likeDiv.className = 'likeDiv';
            likeDiv.innerHTML = '<lit-like type = "chat"></lit-like>';
            this.aiAnswerBox?.appendChild(likeDiv);
            // 滚动条滚到底部
            this.q_a_window!.scrollTop = this.q_a_window!.scrollHeight;
            this.isResultBack = true;
        }
    }

    // 创建用户聊天对话气泡
    createChatBox(): void {
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
        //生成表格导航
        //@ts-ignore
        this.renderTblNav(dataList);
        this.renderTblNav(dataList);
        if (this.detectToken === '') {
            await this.getToken90Min('takeToken', false);
        }
        // @ts-ignore
        for (let i = 0; i < dataList.length; i++) {
            let itemDiv = document.createElement('div');
            itemDiv.className = 'analysisItem';
            // 生成标题
            let titleDiv = document.createElement('div');
            titleDiv.className = 'title item-name';
            titleDiv!.innerText = `问题${i + 1}`;
            // 生成一键置顶
            let topUp = document.createElement('div');
            topUp.className = 'top-up-image';
            titleDiv.appendChild(topUp);
            topUp.addEventListener('click', (e) => {
                this.shadowRoot!.querySelector('.analysisList')!.scrollTop = 0;
            });
            // 生成类型
            let typeDiv = document.createElement('div');
            typeDiv.className = 'item';
            // @ts-ignore
            typeDiv.innerHTML = `<span class='item-name'>问题类型：</span>${dataList[i].type}`;
            // 生成时间
            let timeDiv = document.createElement('div');
            timeDiv.className = 'item two timeDiv';
            timeDiv!.innerHTML = `<span class='item-name'>发生时间：</span>`;
            let timeList = new Array();
            // @ts-ignore
            dataList[i].trace_info.forEach((v: unknown, index: number) => {
                let timeSpan = document.createElement('span');
                // @ts-ignore
                timeSpan.id = v.id;
                timeSpan.className = 'timeItem';
                // @ts-ignore
                timeSpan.setAttribute('name', v.name);
                // @ts-ignore
                timeSpan.innerHTML = `[<span class = 'timeText'>${v.ts! / 1000000000}</span>s]${index !== dataList[i].trace_info.length - 1 ? ' ,' : ''}`;
                timeDiv.appendChild(timeSpan);
                // @ts-ignore
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
            if (this.showSuggestionPart) {
                let suggestonDiv = document.createElement('div');
                suggestonDiv.className = 'item two';
                let suggestonTitle = document.createElement('span');
                suggestonTitle.className = 'item-name';
                suggestonTitle.textContent = '优化建议：';
                suggestonDiv!.appendChild(suggestonTitle);
                itemDiv!.appendChild(suggestonDiv);
                let getButton = document.createElement('span');
                getButton.className = 'getSgtBtn';
                getButton.innerHTML = '获取';
                getButton.addEventListener('click', (ev) => {
                    if (suggestonDiv.getElementsByClassName('msgdiv').length > 0) {
                        suggestonDiv.removeChild(suggestonDiv.getElementsByClassName('msgdiv')[0]);
                    }
                    if (suggestonDiv.getElementsByClassName('likeDiv').length > 0) {
                        suggestonDiv.removeChild(suggestonDiv.getElementsByClassName('likeDiv')[0]);
                    }
                    for (let i = 0; i < this.getSugBtnList.length; i++) {
                        // @ts-ignore
                        this.getSugBtnList[i].style.display = 'none';
                    }
                    suggestonDiv!.appendChild(this.loading(''));
                    // @ts-ignore
                    this.getSuggestion(dataList, i, suggestonDiv, timeList);
                });
                suggestonTitle.appendChild(getButton);
            }
            this.draftList!.insertBefore(itemDiv!, this.loadingItem!);
            itemDiv!.style.animation = 'opcityliner 3s';
            itemDiv!.style.paddingBottom = '20px';
        }
        if (this.showSuggestionPart) {
            // @ts-ignore
            this.getSugBtnList = this.draftList?.getElementsByClassName('getSgtBtn');
            // @ts-ignore
            this.getSugBtnList[0].click();
        }
        this.draftList?.removeChild(this.loadingItem!);
    }


    // Table数据渲染
    renderTblNav(dataList: unknown): void {
        this.contentsTable!.recycleDataSource = [];
        this.contentsTable!.style.display = 'block';
        // 修改Tbl样式
        let th = this.contentsTable!.shadowRoot!.querySelector('div.table > div.thead > div')! as HTMLElement;
        th.style.backgroundColor = '#8bbcdff7';
        // @ts-ignore   
        let source = dataList.map((item: unknown, index: number) => {
            // @ts-ignore
            return { ...item, id: index + 1 };
        });
        let tbody = this.contentsTable!.shadowRoot!.querySelector('.table') as HTMLElement;
        tbody.style.height = 30 + 25 * source.length + 'px';
        tbody.style.maxHeight = TBODY_HEIGHT + 'px';
        this.contentsTable!.recycleDataSource = source;
    }

    connectedCallback(): void {
        super.connectedCallback();
    }

    async getToken(params: string, isChat?: boolean): Promise<void> {
        let data = await SpStatisticsHttpUtil.getAItoken(params);
        if (data.status !== 200) {
            if (isChat) {
                this.aiAnswerBox!.firstElementChild!.innerHTML = '获取token失败';
            }
            return;
        } else {
            if (isChat) {
                this.chatToken = data.data;
            } else {
                this.detectToken = data.data;
            }
        }
    }

    //控制页面异常场景的显示
    abnormalPageTips(tipStr: string, imgSrc: string, setTimeoutTime: number, flag: Array<string>): void {
        // 清除延时器，防止弹窗重叠互相影响
        if (this.timerId) {
            // @ts-ignore
            clearTimeout(this.timerId);
        }
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
            this.tipsContainer!.style.display = 'none';
        } else {
            let textTipsBox = document.createElement('div');
            textTipsBox.className = 'textTips';
            textTipsBox!.innerHTML = tipStr;
            this.tipsContainer!.appendChild(textTipsBox);
        }
        if (flag.indexOf(this.showPageFlag) > -1) {
            this.tipsContainer!.style.display = 'flex';
        }
        if (setTimeoutTime) {
            setTimeout(() => {
                this.timerId = this.tipsContainer!.style.display = 'none';
                this.tipContentArr = [];
            }, setTimeoutTime);
        }
    }

    // 每90min重新获取token
    async getToken90Min(params: string, isChat: boolean): Promise<void> {
        await this.getToken(params, isChat);
        setInterval(async () => {
            await this.getToken(params, isChat);
        }, 5400000);
    }

    // 发送请求获取优化建议并渲染页面
    getSuggestion(
        dataList: unknown,
        i: number,
        suggestonDiv: HTMLDivElement | null | undefined,
        timeList: Array<string>
    ): void {
        SpStatisticsHttpUtil.askAi({
            token: this.detectToken,
            // @ts-ignore
            question: dataList[i].description + ',请问该怎么优化？',
            collection: ''
        }, 'ask').then((suggestion) => {
            this.appendMsg(dataList, i, suggestonDiv, timeList, suggestion);
        }).catch((error) => {
            this.appendMsg(dataList, i, suggestonDiv, timeList, error);
        });
    }

    // 优化建议msg处理并渲染
    appendMsg(dataList: unknown, i: number, suggestonDiv: HTMLDivElement | null | undefined, timeList: Array<string>, suggestion: AiResponse): void {
        // 保证controllersMap里面存的是未完成的请求，并规避重新打开trace时异步msg未请求完毕引入的问题
        if (SpStatisticsHttpUtil.controllersMap.has(suggestion.time!)) {
            SpStatisticsHttpUtil.controllersMap.delete(suggestion.time!);
        }
        if (SpStatisticsHttpUtil.isInterrupt) {
            if (SpStatisticsHttpUtil.controllersMap.size === 0) {
                SpStatisticsHttpUtil.isInterrupt = false;
            }
            return;
        }
        // @ts-ignore
        this.reportContent += `问题${i + 1}:${dataList[i].type}\n\n时间：${timeList.join(',')}\n\n问题原因：${dataList[i].description}\n\n优化建议：${suggestion.data}\n\n\n`;
        let msgdiv = document.createElement('div');
        msgdiv.className = 'msgdiv';
        //@ts-ignore
        msgdiv!.innerHTML = `${this.md!.render(suggestion.data)}`;
        suggestonDiv?.removeChild(suggestonDiv.lastElementChild!);
        let likeDiv = document.createElement('div');
        likeDiv.className = 'likeDiv';
        // @ts-ignore
        likeDiv.innerHTML = `<lit-like type = "detect" content = ${dataList[i].type}#${dataList[i].subtype}></lit-like>`;
        suggestonDiv!.appendChild(msgdiv);
        suggestonDiv!.appendChild(likeDiv);
        for (let i = 0; i < this.getSugBtnList.length; i++) {
            // @ts-ignore
            this.getSugBtnList[i].style.display = 'inline-block';
        }
    }

    // 取消或中断请求
    breakRequest(): void {
        for (const controller of SpStatisticsHttpUtil.controllersMap.values()) {
            controller.abort();
        }
    }

    cacheDb(fileName: string | null): void {
        threadPool.submit(
            'download-db',
            '',
            {},
            (reqBufferDB: Uint8Array) => {
                WebSocketManager.getInstance()!.sendMessage(TypeConstants.DIAGNOSIS_TYPE, TypeConstants.SENDDB_CMD, reqBufferDB);
                // 存入缓存
                // @ts-ignore
                const blob = new Blob([reqBufferDB]);
                const response = new Response(blob);
                caches.open('DB-file').then(cache => {
                    return cache.put(`/${fileName}.db`, response);
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
        if (cmd === 4) {
            //     需要处理
            if (jsonRes.resultCode !== 0) {
                this.isNodata = true;
                this.draftList!.innerHTML = '';
                this.contentsTable!.style.display = 'none';
                let textStr = '服务异常，请重新导trace！';
                let imgsrc = 'img/no-report.png';
                this.tipsContent!.style.display = 'none';
                this.tipContentArr = ['detect'];
                this.abnormalPageTips(textStr, imgsrc, 0, this.tipContentArr);
                this.draftBtn!.style.display = 'inline-block';
            }
            if (this.isJsonString(jsonRes.resultMessage)) {
                let dataList = JSON.parse(jsonRes.resultMessage) || [];
                if (dataList && dataList.length === 0) {
                    SpStatisticsHttpUtil.generalRecord('AI_statistic', 'large_model_detect', ['0']);
                    this.isNodata = true;
                    this.draftList!.innerHTML = '';
                    this.contentsTable!.style.display = 'none';
                    let textStr = '当前未诊断出问题';
                    let imgsrc = 'img/no-report.png';
                    this.tipsContent!.style.display = 'none';
                    this.tipContentArr = ['detect'];
                    this.abnormalPageTips(textStr, imgsrc, 0, this.tipContentArr);
                    this.draftBtn!.style.display = 'inline-block';
                } else {
                    this.tipContentArr = [];
                    SpStatisticsHttpUtil.generalRecord('AI_statistic', 'large_model_detect', ['1']);
                    this.isNodata = false;
                    // 整理数据,渲染数据
                    await this.renderData(dataList);
                    this.draftBtn!.style.display = 'inline-block';
                    this.downloadBtn!.style.display = 'inline-block';
                }
            };
        };
    };

    // eventCallBack
    eventCallBack = async (result: string): Promise<void> => {
        this.draftList!.innerHTML = '';
        this.tipsContent!.style.display = 'flex';
        this.tipContentArr = ['detect'];
        // @ts-ignore
        this.abnormalPageTips(this.getStatusesPrompt()[result].prompt, '', 4000, ['detect']);
        this.draftBtn!.style.display = 'inline-block';
    };

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
    timeClickHandler(timeDiv: HTMLDivElement): void {
        let timeElementList = timeDiv!.getElementsByClassName('timeItem');
        for (let i = 0; i < timeElementList.length; i++) {
            timeElementList[i].addEventListener('click', (e) => {
                if (this.activeTime) {
                    this.activeTime.removeAttribute('active');
                }
                this.activeTime = timeElementList[i].getElementsByClassName('timeText')[0];
                // 点击项更换颜色
                this.activeTime.setAttribute('active', '');
                let name = timeElementList[i].getAttribute('name');
                let id = Number(timeElementList[i].getAttribute('id'));
                // @ts-ignore
                this.valueChangeHandler!(name, id);
            });
        }
    }

    // 判断是否为json
    isJsonString(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    // 获取提示语
    getStatusesPrompt(): unknown {
        let guideSrc = `https://${window.location.host.split(':')[0]}:${window.location.port
            }${window.location.pathname}?action=help_27`;
        return {
            unconnected: {
                prompt: `未连接，请启动本地扩展程序再试！[</span><a href=${guideSrc} style="color: blue;" target="_blank">指导</a><span>]`
            }, // 重连
            connected: {
                prompt: '扩展程序连接中，请稍后再试！'
            }, // 中间
            logined: {
                prompt: '扩展程序连接中，请稍后再试！'
            }, // 中间
            loginFailedByLackSession: {
                prompt: '当前所有会话都在使用中，请释放一些会话再试！'
            }, // 重连
            upgrading: {
                prompt: '扩展程序连接中，请稍后再试！'
            }, // 中间
            upgradeSuccess: {
                prompt: '扩展程序已完成升级，重启中，请稍后再试！'
            }, // 重连
            upgradeFailed: {
                prompt: '刷新页面触发升级，或卸载扩展程序重装！'
            }, // 重连
        };
    }

    initHtml(): string {
        return SpAiAnalysisPageHtml;
    }
}