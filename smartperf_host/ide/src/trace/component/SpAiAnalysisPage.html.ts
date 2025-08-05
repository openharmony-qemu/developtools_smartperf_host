/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
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

export const SpAiAnalysisPageHtml = `
<div class="chatBox">
        <h3 class="chatTitle" style="color:#35a1db">
            HiSmartPerf AI助手
        </h3>
        <div class="contentWindow">
            <div class="ask_question">
                <div class="q_a_window">
                    <div class="aiMessage message">
                        <div class="aiHeader headerDiv">
                            <img src="img/logo.png" class="headerImg"/>
                        </div>
                        <div class="systemSay">
                            有什么可以帮助您吗？
                        </div>
                        <div class="clear"></div>
                    </div>
                </div>
            <div class="chatInputBox">
                <div class="chatConfig">
                    <div class="right-box">
                        <div class="history">
                            <img src="img/history.png" style="margin-right: 10px;"/>
                            <div class="config-tip hisTip">
                                历史记录
                            </div>
                        </div>
                        <div class="newChat">
                            <img src="img/new_chat.png"/>
                            <div class="config-tip">
                                新建聊天
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chatInput">
                    <textarea class="inputText" placeholder="请输入消息"></textarea>
                    <img src="img/send.png" class="sendImg">
                </div>
            </div>
            </div>
            <div class="report_details">
                <div class="selectionBox">
                     <div class="startBox">
                        <div class="timeTip"></div>
                        startTime:
                        <span class="startTime"></span>
                    </div>
                    <div class="endBox">
                        <div class="timeTip"></div>
                        endTime:
                        <span class="endTime"></span>
                    </div>
                </div>
                <div class="analysisList">
                    <div class="analysis-header">
                        <h4
                            style="text-align: center;background-color: white;padding: 10px 0px;color: #35a1db;border-radius:2px;margin:0">
                            诊断报告
                        </h4>
                    </div>
                    <lit-table id="tb-contents">
                        <lit-table-column class="cpu-fre-column" width="40px" title="序号" data-index="id" key="id" align="flex-start">
                        </lit-table-column>
                        <lit-table-column class="cpu-fre-column" width="1fr" title="问题类型" data-index="type" key="type" align="flex-start">
                        </lit-table-column>
                        <lit-table-column class="cpu-fre-column" width="1fr" title="问题原因" data-index="description" key="description" align="flex-start">
                        </lit-table-column>
                    </lit-table>
                    <div class="data-record"></div>
                    <div class="tips-content">
                        <div class="no-data">
                            <img src="img/nodata.png" />
                            <div style="text-align: center;">
                                暂无数据
                            </div>
                        </div>
                    </div>
                </div>
                <div class="report-button">
                    <div class="analysisBtn button">
                        一键诊断
                    </div>
                    <div class="downloadBtn button" style="display: none;">报告下载</div>
                </div>
            </div>
        </div>
    </div>
    <div class="rightTabBar">
        <lit-icon name='close' size = '18' style='position: absolute; top: 12px; right: 17px; cursor: pointer;'></lit-icon>
        <div class="chatBar active">
            <img src="img/talk_active.png" class="chatInon"/>
            <div class="chatBarTitle">聊天</div>
        </div>
        <div class="report">
            <img src="img/report.png" class="chatInon"/>
            <div class="chatBarTitle">诊断</div>
        </div>
    </div>
    <div class="tipsContainer" style="display:none;"></div>
    <style>
    .q_a_window{
        height: 75%;
        overflow-y: auto;
        padding-right: 10px;
    }
    .mixedText{
        text-align: center;
    }
    .textTips{
        font-size: 14px;
        height: 45px;
        line-height: 45px;
        background-color: #dff4fd;
        padding: 0 10px;
        border: 1px solid #35a1db;
        border-radius: 10px;
    }
    .tipsContainer{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 90%;
        height: 50%;
        position: absolute;
        top: 23%;
        left: 45%;
        transform: translateX(-50%);
        background-color: sky-blue;
    }
    .report_details {
        width: 100%;
        height: 100%;
        display: none;
        position: relative;
    }

    .report-button {
        position: absolute;
        bottom: 0;
        right: 0;
    }

    .usersay {
        max-width: 70%;
        background: rgb(229,246,255);
        border-radius: 4px;
        float: right;
        line-height: 20px;
        text-overflow: ellipsis;
        word-break: break-all;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        font-size: 12px;
        padding: 5px 10px;
        margin-top: 10px;
        margin-right: 10px;
        position: relative;
        text-align: justify;
        color: #000;
        border: 1px solid #c4ebf5;
        border-radius: 9px;
        border-top-right-radius: 0px;
    }

    .tips-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 90%;
    }

    #tb-contents {
        box-shadow: 0px 2px 5px #bfbfbf;
        margin-bottom: 5px;
        margin-top: 1px;
        border-radius: 7px;
        font-size: 14px
    }

    .systemSay {
        max-width: 70%;
        border-radius: 4px;
        background-color: rgb(249,250,252);
        float: left;
        line-height: 20px;
        text-overflow: ellipsis;
        word-break: break-all;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        font-size: 12px;
        padding: 5px 10px;
        margin-top: 10px;
        position: relative;
        text-align: justify;
        color: #000;
        border: 0.5px solid #eaeaea;
        border-radius: 0 10px 10px 10px;
    }

    .chatBox {
        height: 100%;
        padding-left: 5px;
        padding-bottom: 10px;
        padding-right: 40px;
    }

    .chatTitle {
        margin: 0;
        height: 50px;
        line-height: 50px;
    }

    .contentWindow {
        height: 92%;
        padding: 0 10px 20px 10px;
        border-radius: 10px;
        position: relative;
        background: rgba(235, 235, 235, 0)
    }

    .ask_question {
        overflow-y: auto;
        position: relative;
        overflow-x:hidden;
        height: 100%;
    }

    .ask_question pre code {
        white-space: pre-wrap; 
        overflow-wrap: break-word;
        max-width: 100%; 
        font-family: auto;
    }

    .msgdiv pre code {
        white-space: pre-wrap; 
        overflow-wrap: break-word;
        max-width: 100%; 
        font-family: auto;
    }

    .chatConfig {
        width: 100%;
        height: 30px;
        position: relative;
        margin-top: 10px;
        padding-bottom: 5px;
        border-top: 1px solid rgba(255, 255, 255, .3);
    }

    .chatConfig img {
        width: 20px;
    }

    .chatConfig img:hover+.config-tip {
        display: block;
    }

    .chatInput {
        position: relative;
        width: 100%;
        height: 125px;
        border-radius: 10px;
        text-align: justify;
    }

    .right-box {
        position: absolute;
        display: flex;
        right: 25px;
        top: 10px;
    }

    .history,
    .newChat {
        position: relative;
    }

    .config-tip {
        background-color: rgba(0, 0, 0, .8);
        padding: 5px 10px;
        color: #fff;
        position: absolute;
        top: -30px;
        left: -24px;
        border-radius: 5px;
        width: 52px;
        text-align: center;
        font-size: 12px;
        z-index: 9999;
        display: none;
    }

    .message {
        width: 100%;
    }

    .inputText {
        height: 100%;
        width: 100%;
        resize: none;
        padding: 10px;
        padding-right: 5px;
        background-color: #fcfcfc;
        border-radius: 10px;
        text-align: justify;
        box-sizing: border-box;
        border: 0.5px solid rgb(177, 205, 241);
        font-weight: 400;
        line-height: 20px;
        box-shadow: -5px 5px 10px rgb(246, 246, 246);
    }

    .chatInputBox {
        padding-right: 10px;
        position: absolute;
        width: 100%;
        bottom: 5px;
    }

    .sendImg {
        position: absolute;
        bottom: 10px;
        right: 30px;
        cursor: pointer;
        width: 20px;
        height: 20px;
    }

    img {
        cursor: pointer;
    }

    .rightTabBar {
        text-align: center;
        position: absolute;
        width: 50px;
        top: 0;
        right: 0;
        height: 100%;
        padding-top: 50px;
        font-size: 12px;
        background-color: rgb(246, 246, 246);
        color: #000;
        box-sizing:border-box;
    }

    .chatBar{
        padding-top: 10px;
    }

    .chatBarTitle {
        font-size: 12px;
        height: 30px;
        line-height: 20px;
    }

    .rightTabBar img {
        width: 20px;
    }

    .logo {
        position: absolute;
        top: 150px;
        left: 120px;
        width: 100px;
        height: 100px;

    }

    .logo img {
        width: 100%;
    }

    .report {
        padding-top: 10px;
    }

    .headerDiv {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid galy;
        margin-top: 10px;
    }

    .userHeader {
        float: right;
        background-image: url('img/header.png');
        background-size:40px;
        background-position:-5px -5px;
    }

    .clear {
        clear: both;
    }

    .aiHeader {
        float: left;
        margin-right: 10px;
    }

    .headerImg {
        width: 30px;
        height: 30px;
    }

    ::-webkit-scrollbar {
        width: 5px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb {
        background: #635d5d;
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #4b4848;
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:active {
        background: #4b4848;
        border-radius: 3px;
    }

    .history::title {
        background-color: #dcdfe6;
    }

    textarea:focus {
        outline: none;
    }

    textarea::placeholder {
        color: #000;
    }

    .active {
        color: #35a1db;
    }

    .analysisList {
        overflow: hidden;
        overflow-y: auto;
        height: 84%;
        padding-right: 10px;
        padding-left: 10px;
        box-shadow: 1px 2px 5px #bfbfbf;
        border-radius: 8px;
        position: relative;
    }

    .analysis-header {
        position: sticky;
        top: 0;
        background-color: white;
        z-index: 2;
    }

    .analysisItem {
        width: 100%;
        letter-spacing: 1.5px;
        border-radius: 3px;
        line-height: 20px;
        position: relative;
    }

    .title {
        font-size: 14px;
        font-weight: 700;
        background-color: #8bbcdff7;
        padding: 10px 5px;
        color: #fff;
    }

    .top-up-image {
        width: 17px; 
        height: 17px; 
        background-image: url('img/top_up.png'); 
        background-size: contain;
        background-repeat: no-repeat;
        border: 0;
    }
        
    .item-name {
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 10px;
    }

    .item-name img {
        width: 17px
    }

    .item {
        margin-top: 3px;
        background-color: rgba(212, 227, 227, 0.5);
        padding: 10px 5px;
        font-size: 12px;
        word-break: break-all;
        font-size: 12px;
    }

    .two {
        background-color: rgba(209, 179, 179, 0.5);
    }

    .button {
        padding: 3px 35px;
        height: 26px;
        background-color: #35a1db;
        border-radius: 10px;
        text-align: center;
        line-height: 26px;
        color: #fff;
        font-size: 14px;
        display: inline-block;
        cursor: pointer;
    }

    .loginTip {
        display: none;
        font-size: 14px;
        height: 45px;
        line-height: 45px;
        background-color: #dff4fd;
        padding: 0 10px;
        border: 1px solid #35a1db;
        border-radius: 10px;
    }

    .importTraceTips{
        width:203px;
        visibility: hidden;
        position: absolute;
        top: 28%;
        padding: 5px 15px;
        background-color: rgb(236, 239, 247);
        border-radius: 2px;
        color: #000;
        display: flex;
        align-items: center;
        font-size: 14px;
        height: 50px;
        line-height: 50px;
        left: 50%;
        transform: translateX(-50%);
    }

    .loadingItem {
        height: 100px;
        position: relative;
        width: 100%;
        margin-top: 20px;
    }

    @keyframes opcityliner {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    .selectionBox div {
        font-size: 15px;
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .timeTip {
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: #61da61;
        margin: 0 10px 0 0 !important;
    }

    .timeText {
        color:blue;
        cursor: pointer;
    }

    .timeText[active]{
        color:purple;
    }

    .timeText:not([active]) {
        color:blue;
    }

    p {
      margin:0;
    }

    .likeDiv {
        width:100%;
        height:25px;
        margin-top:10px;
    }

     .getSgtBtn {
        display: inline-block;
        border: 1px #999 solid;
        padding: 2px 20px;
        border-radius: 15px;
        font-size: 12px;
        color:#999;
        cursor:pointer;
    }

    .getSgtBtn:hover {
        color:#000;
        border-color:@000;
    }
</style>
`;